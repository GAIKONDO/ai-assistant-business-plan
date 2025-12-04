'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { DashboardIcon, LineChartIcon, BarChartIcon, DocumentIcon, SettingsIcon, MenuIcon, CloseIcon, SpecificationIcon, VisualizationsIcon } from './Icons';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

// 特別なサービス（静的データ）
const SPECIAL_SERVICES = [
  { id: 'own-service', name: '自社開発・自社サービス事業', description: '自社開発のサービス事業に関する計画', hasConcepts: true },
  { id: 'education-training', name: 'AI導入ルール設計・人材育成・教育事業', description: '人材育成、教育、AI導入ルール設計に関する計画', hasConcepts: true },
  { id: 'consulting', name: 'プロセス可視化・業務コンサル事業', description: '業務コンサルティングとプロセス改善に関する計画', hasConcepts: true },
  { id: 'ai-dx', name: 'AI駆動開発・DX支援SI事業', description: 'AI技術を活用した開発・DX支援に関する計画', hasConcepts: true },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPage?: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: 'company-plan' | 'project' | 'concept';
  path: string;
  serviceId?: string; // 事業企画の場合のserviceId
}

interface ConceptItem {
  id: string;
  title: string;
  conceptId: string;
  path: string;
}

// 固定構想の定義
const FIXED_CONCEPTS: { [key: string]: Array<{ id: string; name: string; description: string }> } = {
  'own-service': [
    { id: 'maternity-support', name: '出産支援パーソナルApp', description: '出産前後のママとパパをサポートするパーソナルアプリケーション' },
    { id: 'care-support', name: '介護支援パーソナルApp', description: '介護を必要とする方とその家族をサポートするパーソナルアプリケーション' },
  ],
  'ai-dx': [
    { id: 'medical-dx', name: '医療法人向けDX', description: '助成金を活用したDX：電子カルテなどの導入支援' },
    { id: 'sme-dx', name: '中小企業向けDX', description: '内部データ管理やHP作成、Invoice制度の対応など' },
  ],
  'consulting': [
    { id: 'sme-process', name: '中小企業向け業務プロセス可視化・改善', description: '中小企業の業務プロセス可視化、効率化、経営課題の解決支援、助成金活用支援' },
    { id: 'medical-care-process', name: '医療・介護施設向け業務プロセス可視化・改善', description: '医療・介護施設の業務フロー可視化、記録業務の効率化、コンプライアンス対応支援' },
  ],
  'education-training': [
    { id: 'corporate-ai-training', name: '大企業向けAI人材育成・教育', description: '企業内AI人材の育成、AI活用スキル研修、AI導入教育プログラムの提供' },
    { id: 'ai-governance', name: 'AI導入ルール設計・ガバナンス支援', description: '企業のAI導入におけるルール設計、ガバナンス構築、コンプライアンス対応支援' },
    { id: 'sme-ai-education', name: '中小企業向けAI導入支援・教育', description: '中小企業向けのAI導入支援、実践的なAI教育、導入ルール設計支援、助成金活用支援' },
  ],
};

export default function Sidebar({ isOpen, onToggle, currentPage }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [menuPlanItems, setMenuPlanItems] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [hoveredProjectServiceId, setHoveredProjectServiceId] = useState<string | null>(null);
  const [hoveredConcepts, setHoveredConcepts] = useState<ConceptItem[]>([]);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  
  const menuItems = [
    { icon: DashboardIcon, label: '事業計画', id: 'business-plan', path: '/business-plan' },
    { icon: LineChartIcon, label: 'ダッシュボード', id: 'dashboard', path: '/' },
    { icon: VisualizationsIcon, label: 'データ可視化', id: 'visualizations', path: '/visualizations' },
    { icon: BarChartIcon, label: '分析', id: 'analytics', path: '/analytics' },
    { icon: DocumentIcon, label: 'レポート', id: 'reports', path: '/reports' },
    { icon: SpecificationIcon, label: '仕様書', id: 'specification', path: '/specification' },
    { icon: DocumentIcon, label: 'Markdownデモ', id: 'markdown-demo', path: '/markdown-demo' },
    { icon: SettingsIcon, label: '設定', id: 'settings', path: '/settings' },
  ];

  // 現在のページを判定
  const getCurrentPage = () => {
    console.log('🔍 getCurrentPage:', { currentPage, pathname });
    if (currentPage) {
      // currentPageプロップが'business-plan'で始まる場合は'business-plan'を返す
      if (currentPage.startsWith('business-plan')) {
        console.log('✅ currentPageプロップを使用（business-planに正規化）:', currentPage);
        return 'business-plan';
      }
      console.log('✅ currentPageプロップを使用:', currentPage);
      return currentPage;
    }
    if (pathname === '/') return 'dashboard';
    // /business-plan で始まるパスはすべて 'business-plan' として扱う（最初にチェック）
    if (pathname.startsWith('/business-plan')) {
      console.log('✅ /business-planで始まるパスを検出:', pathname);
      return 'business-plan';
    }
    // /markdown-demo のようなパスを正しく処理
    const pathWithoutSlash = pathname.replace('/', '');
    if (pathWithoutSlash === 'markdown-demo') return 'markdown-demo';
    if (pathWithoutSlash === 'visualizations') return 'visualizations';
    // /business-plan/company/[planId]/visualizations のようなパスも処理
    if (pathname.includes('/visualizations')) return 'visualizations';
    const result = pathWithoutSlash || 'dashboard';
    console.log('⚠️ デフォルト値を使用:', result);
    return result;
  };

  const activePage = getCurrentPage();
  console.log('🔍 activePage決定:', { activePage, pathname, currentPage });

  const handleNavigation = (path: string) => {
    startTransition(() => {
      router.push(path);
    });
    // サイドメニューの開閉状態は維持する
  };

  // 認証状態の監視
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // パスからserviceIdを抽出（useMemoでメモ化）
  const serviceId = useMemo(() => {
    if (!pathname) return null;
    const match = pathname.match(/^\/business-plan\/services\/([^\/]+)/);
    const id = match ? match[1] : null;
    console.log('🔍 パス解析:', { pathname, serviceId: id, match });
    return id;
  }, [pathname]);

  // パスからprojectIdを抽出（useMemoでメモ化）
  const projectId = useMemo(() => {
    if (!pathname) return null;
    const match = pathname.match(/^\/business-plan\/project\/([^\/]+)/);
    const id = match ? match[1] : null;
    console.log('🔍 パス解析（projectId）:', { pathname, projectId: id, match });
    return id;
  }, [pathname]);

  // コンテンツの読み込み
  useEffect(() => {
    console.log('🔍 useEffect実行:', {
      isOpen,
      authReady,
      hasAuth: !!auth?.currentUser,
      hasDb: !!db,
      activePage,
      pathname,
    });

    if (!isOpen || !authReady || !auth?.currentUser || !db) {
      console.log('⚠️ 条件未満足でスキップ:', {
        isOpen,
        authReady,
        hasAuth: !!auth?.currentUser,
        hasDb: !!db,
      });
      return;
    }

    const loadContent = async () => {
      console.log('🔍 loadContent開始:', { activePage, pathname });
      // activePageが'business-plan'または'business-plan'で始まる場合に処理を続行
      if (activePage !== 'business-plan' && !activePage.startsWith('business-plan')) {
        console.log('⚠️ activePageがbusiness-planではない:', activePage);
        setContentItems([]);
        setMenuPlanItems([]);
        return;
      }

      setLoadingContent(true);
      try {
        console.log('🔍 コンテンツ読み込み:', { 
          activePage, 
          pathname, 
          serviceId,
          projectId,
          isOpen,
          authReady,
          userId: auth?.currentUser?.uid || '',
        });
        
        // 個別の事業企画ページの場合（serviceIdまたはprojectIdがある場合）
        // メニューセクション：事業企画一覧を表示
        // コンテンツセクション：構想一覧を表示（serviceIdがある場合のみ）
        if ((serviceId || projectId) && db && auth?.currentUser) {
          console.log('🔍 事業企画ページ読み込み開始:', { serviceId, pathname });
          
          // 事業企画一覧を取得（メニューセクション用）
          let projectsSnapshot;
          try {
            const projectsQuery = query(
              collection(db, 'businessProjects'),
              where('userId', '==', auth.currentUser.uid),
              orderBy('createdAt', 'desc')
            );
            projectsSnapshot = await getDocs(projectsQuery);
            console.log('📋 事業企画クエリ（orderByあり）:', {
              size: projectsSnapshot.size,
              empty: projectsSnapshot.empty,
            });
          } catch (error: any) {
            console.log('⚠️ orderByでエラー、orderByなしで再試行:', error);
            if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
              if (!db || !auth?.currentUser) return;
              const projectsQueryWithoutOrder = query(
                collection(db, 'businessProjects'),
                where('userId', '==', auth.currentUser.uid)
              );
              projectsSnapshot = await getDocs(projectsQueryWithoutOrder);
              console.log('📋 事業企画クエリ（orderByなし）:', {
                size: projectsSnapshot.size,
                empty: projectsSnapshot.empty,
              });
            } else {
              // その他のエラーでもorderByなしで再試行
              console.log('⚠️ その他のエラー、orderByなしで再試行');
              if (!db || !auth?.currentUser) return;
              const projectsQueryWithoutOrder = query(
                collection(db, 'businessProjects'),
                where('userId', '==', auth.currentUser.uid)
              );
              projectsSnapshot = await getDocs(projectsQueryWithoutOrder);
              console.log('📋 事業企画クエリ（orderByなし、エラー後）:', {
                size: projectsSnapshot.size,
                empty: projectsSnapshot.empty,
              });
            }
          }

          const menuItems: ContentItem[] = [];
          const addedPaths = new Set<string>(); // 重複チェック用

          // 事業企画を追加
          const projects: Array<{ id: string; serviceId?: string; title: string; createdAt: Date | null }> = [];
          projectsSnapshot.forEach((doc) => {
            const data = doc.data();
            // isFixed: trueのプロジェクトは除外（固定サービスはSPECIAL_SERVICESとして表示されるため）
            if (data.isFixed) {
              console.log('📋 固定プロジェクトをスキップ:', { id: doc.id, name: data.name || data.title });
              return;
            }
            const projectTitle = data.name || data.title || '事業企画';
            const serviceId = data.serviceId || doc.id; // serviceIdフィールドがあればそれを使用、なければドキュメントIDを使用
            projects.push({
              id: doc.id,
              serviceId: serviceId,
              title: projectTitle,
              createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : null),
            });
          });

          // 作成日時でソート（降順）
          projects.sort((a, b) => {
            const aTime = (a.createdAt instanceof Date) ? a.createdAt.getTime() : 0;
            const bTime = (b.createdAt instanceof Date) ? b.createdAt.getTime() : 0;
            return bTime - aTime;
          });

          // メニュー用アイテムに変換（事業企画）
          projects.forEach((project) => {
            const path = `/business-plan/services/${project.serviceId || project.id}`;
            // 重複チェック：同じpathが既に追加されている場合はスキップ
            if (addedPaths.has(path)) {
              console.log('⚠️ 重複プロジェクトをスキップ:', { id: project.id, serviceId: project.serviceId, path });
              return;
            }
            addedPaths.add(path);
            menuItems.push({
              id: project.id,
              title: project.title,
              type: 'project',
              path: path,
              serviceId: project.serviceId || project.id, // serviceIdを追加
            });
          });

          // 特別なサービス（静的データ）も追加
          SPECIAL_SERVICES.forEach((service) => {
            const path = `/business-plan/services/${service.id}`;
            // 重複チェック：同じpathが既に追加されている場合はスキップ
            if (addedPaths.has(path)) {
              console.log('⚠️ 重複サービスをスキップ:', { id: service.id, path });
              return;
            }
            addedPaths.add(path);
            menuItems.push({
              id: service.id,
              title: service.name,
              type: 'project',
              path: path,
              serviceId: service.id, // serviceIdを追加
            });
          });

          console.log('✅ 事業企画ページ - menuItems設定前:', {
            menuItemsLength: menuItems.length,
            menuItems: menuItems.map(i => ({ type: i.type, title: i.title, path: i.path })),
          });
          setMenuPlanItems(menuItems);

          // Firebaseから構想を取得（コンテンツセクション用、serviceIdがある場合のみ）
          const contentItems: ContentItem[] = [];
          
          if (serviceId) {
          let conceptsSnapshot;
          try {
            const conceptsQuery = query(
              collection(db, 'concepts'),
              where('userId', '==', auth.currentUser.uid),
              where('serviceId', '==', serviceId),
              orderBy('createdAt', 'desc')
            );
            conceptsSnapshot = await getDocs(conceptsQuery);
          } catch (error: any) {
            if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
              const conceptsQueryWithoutOrder = query(
                collection(db, 'concepts'),
                where('userId', '==', auth.currentUser.uid),
                where('serviceId', '==', serviceId)
              );
              conceptsSnapshot = await getDocs(conceptsQueryWithoutOrder);
            } else {
              throw error;
            }
          }
          
          // 固定構想を追加
          const fixedConcepts = FIXED_CONCEPTS[serviceId] || [];
          fixedConcepts.forEach((concept) => {
              contentItems.push({
              id: concept.id,
              title: concept.name,
              type: 'concept',
              path: `/business-plan/services/${serviceId}/${concept.id}/overview`,
            });
          });

          // Firebaseから取得した構想を追加（固定構想と同じconceptIdを持つ構想を除外）
          const fixedConceptIds = new Set(fixedConcepts.map(c => c.id));
          const concepts: Array<{ id: string; title: string; conceptId: string; createdAt: Date | null }> = [];
          
          conceptsSnapshot.forEach((doc) => {
            const data = doc.data();
            const conceptId = data.conceptId || '';
            // 固定構想と同じconceptIdを持つ構想を除外
            if (!fixedConceptIds.has(conceptId)) {
              concepts.push({
                id: doc.id,
                title: data.name || conceptId,
                conceptId: conceptId,
                createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : null),
              });
            }
          });

          // 作成日時でソート（降順）
          concepts.sort((a, b) => {
            const aTime = (a.createdAt instanceof Date) ? a.createdAt.getTime() : 0;
            const bTime = (b.createdAt instanceof Date) ? b.createdAt.getTime() : 0;
            return bTime - aTime;
          });

          // アイテムに変換
          concepts.forEach((concept) => {
              contentItems.push({
              id: concept.id,
              title: concept.title,
              type: 'concept',
              path: `/business-plan/services/${serviceId}/${concept.conceptId}/overview`,
            });
          });
          }

          console.log('✅ 事業企画ページアイテム:', {
            menuItems: menuItems.length,
            contentItems: contentItems.length,
            serviceId,
            projectId,
            menuItemsDetails: menuItems.map(i => ({ type: i.type, title: i.title, path: i.path })),
          });

          setMenuPlanItems(menuItems);
          setContentItems(contentItems);
          setLoadingContent(false);
          console.log('✅ 事業企画ページ - setMenuPlanItems完了:', menuItems.length);
          return;
        }

        // 通常の事業計画ページの場合
        // メニューセクション：会社全体の事業計画を表示
        // コンテンツセクション：事業企画を表示
        
        if (!db || !auth?.currentUser) return;
        
        // 会社全体の事業計画を取得（メニューセクション用）
        let companyPlansSnapshot;
        try {
          const companyPlansQuery = query(
            collection(db, 'companyBusinessPlan'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
          );
          companyPlansSnapshot = await getDocs(companyPlansQuery);
          console.log('🏢 会社事業計画クエリ（orderByあり）:', {
            size: companyPlansSnapshot.size,
            empty: companyPlansSnapshot.empty,
          });
        } catch (error: any) {
          console.log('⚠️ orderByでエラー、orderByなしで再試行:', error);
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            if (!db || !auth?.currentUser) return;
            const companyPlansQueryWithoutOrder = query(
              collection(db, 'companyBusinessPlan'),
              where('userId', '==', auth.currentUser.uid)
            );
            companyPlansSnapshot = await getDocs(companyPlansQueryWithoutOrder);
            console.log('🏢 会社事業計画クエリ（orderByなし）:', {
              size: companyPlansSnapshot.size,
              empty: companyPlansSnapshot.empty,
            });
          } else {
            // その他のエラーでもorderByなしで再試行
            console.log('⚠️ その他のエラー、orderByなしで再試行');
            if (!db || !auth?.currentUser) return;
            const companyPlansQueryWithoutOrder = query(
              collection(db, 'companyBusinessPlan'),
              where('userId', '==', auth.currentUser.uid)
            );
            companyPlansSnapshot = await getDocs(companyPlansQueryWithoutOrder);
            console.log('🏢 会社事業計画クエリ（orderByなし、エラー後）:', {
              size: companyPlansSnapshot.size,
              empty: companyPlansSnapshot.empty,
            });
          }
        }

        // 会社全体の事業計画をメニュー用に追加
        const menuItems: ContentItem[] = [];
        const companyPlans: Array<{ id: string; title: string; createdAt: Date | null; order?: number }> = [];
        console.log('🏢 会社事業計画取得結果:', {
          snapshotSize: companyPlansSnapshot.size,
          docs: companyPlansSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
          })),
        });
        companyPlansSnapshot.forEach((doc) => {
          const data = doc.data();
          const planTitle = data.title || '会社事業計画';
          companyPlans.push({
            id: doc.id,
            title: planTitle,
            createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : null),
            order: data.order,
          });
        });

        // ソート（orderフィールドがある場合はそれを使用、なければcreatedAtで降順）
        companyPlans.sort((a, b) => {
          const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
          const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
          if (aOrder !== bOrder) {
            return aOrder - bOrder; // orderが小さい順
          }
          // orderが同じ場合はcreatedAtで降順
          const aTime = (a.createdAt instanceof Date) ? a.createdAt.getTime() : 0;
          const bTime = (b.createdAt instanceof Date) ? b.createdAt.getTime() : 0;
          return bTime - aTime; // 降順
        });

        // メニュー用アイテムに変換（会社全体の事業計画）
        companyPlans.forEach((plan) => {
          menuItems.push({
            id: plan.id,
            title: plan.title,
            type: 'company-plan',
            path: `/business-plan/company/${plan.id}/plan`,
          });
        });

        setMenuPlanItems(menuItems);

        // 事業企画を取得（コンテンツセクション用）
        let projectsSnapshot;
        try {
          const projectsQuery = query(
            collection(db, 'businessProjects'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
          );
          projectsSnapshot = await getDocs(projectsQuery);
          console.log('📋 事業企画クエリ（orderByあり）:', {
            size: projectsSnapshot.size,
            empty: projectsSnapshot.empty,
          });
        } catch (error: any) {
          console.log('⚠️ orderByでエラー、orderByなしで再試行:', error);
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            if (!db || !auth?.currentUser) return;
            const projectsQueryWithoutOrder = query(
              collection(db, 'businessProjects'),
              where('userId', '==', auth.currentUser.uid)
            );
            projectsSnapshot = await getDocs(projectsQueryWithoutOrder);
            console.log('📋 事業企画クエリ（orderByなし）:', {
              size: projectsSnapshot.size,
              empty: projectsSnapshot.empty,
            });
          } else {
            // その他のエラーでもorderByなしで再試行
            console.log('⚠️ その他のエラー、orderByなしで再試行');
            if (!db || !auth?.currentUser) return;
            const projectsQueryWithoutOrder = query(
              collection(db, 'businessProjects'),
              where('userId', '==', auth.currentUser.uid)
            );
            projectsSnapshot = await getDocs(projectsQueryWithoutOrder);
            console.log('📋 事業企画クエリ（orderByなし、エラー後）:', {
              size: projectsSnapshot.size,
              empty: projectsSnapshot.empty,
            });
          }
        }

        const contentItems: ContentItem[] = [];

        // 事業企画を追加
        const projects: Array<{ id: string; serviceId?: string; title: string; createdAt: Date | null }> = [];
        console.log('📋 事業企画取得結果:', {
          snapshotSize: projectsSnapshot.size,
          docs: projectsSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
          })),
        });
        projectsSnapshot.forEach((doc) => {
          const data = doc.data();
          // isFixed: trueのプロジェクトは除外（固定サービスはSPECIAL_SERVICESとして表示されるため）
          if (data.isFixed) {
            console.log('📋 固定プロジェクトをスキップ:', { id: doc.id, name: data.name || data.title });
            return;
          }
          console.log('📋 事業企画データ:', {
            id: doc.id,
            name: data.name,
            title: data.title,
            serviceId: data.serviceId,
            allFields: Object.keys(data),
            rawData: data,
          });
          // nameまたはtitleフィールドを使用（BusinessProjectFormではname、BusinessPlanFormではtitle）
          const projectTitle = data.name || data.title || '事業企画';
          const serviceId = data.serviceId; // serviceIdフィールドを取得
          projects.push({
            id: doc.id,
            serviceId: serviceId,
            title: projectTitle,
            createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : null),
          });
        });

        // 作成日時でソート（降順）
        projects.sort((a, b) => {
          const aTime = (a.createdAt instanceof Date) ? a.createdAt.getTime() : 0;
          const bTime = (b.createdAt instanceof Date) ? b.createdAt.getTime() : 0;
          return bTime - aTime;
        });

        // アイテムに変換（事業企画）
        projects.forEach((project) => {
          // serviceIdがある場合は /business-plan/services/${serviceId} に、ない場合は /business-plan/project/${project.id} にリンク
          const path = project.serviceId 
            ? `/business-plan/services/${project.serviceId}` 
            : `/business-plan/project/${project.id}`;
          contentItems.push({
            id: project.id,
            title: project.title,
            type: 'project',
            path: path,
            serviceId: project.serviceId, // serviceIdを追加
          });
        });

        // 特別なサービス（静的データ）も追加
        SPECIAL_SERVICES.forEach((service) => {
          contentItems.push({
            id: service.id,
            title: service.name,
            type: 'project',
            path: `/business-plan/services/${service.id}`,
            serviceId: service.id, // serviceIdを追加
          });
        });

        console.log('✅ 最終的なコンテンツアイテム（事業企画）:', {
          totalItems: contentItems.length,
          projects: contentItems.filter(i => i.type === 'project').length,
          staticServices: SPECIAL_SERVICES.length,
          items: contentItems.map(i => ({ type: i.type, title: i.title })),
        });

        setContentItems(contentItems);
      } catch (error) {
        console.error('❌ コンテンツの読み込みエラー:', error);
        console.error('エラー詳細:', {
          error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        setContentItems([]);
      } finally {
        setLoadingContent(false);
      }
    };

    loadContent();
  }, [isOpen, activePage, authReady, auth?.currentUser, serviceId, projectId]);

  // ホバー時に構想を取得
  useEffect(() => {
    if (!hoveredProjectServiceId || !authReady || !auth?.currentUser || !db) {
      setHoveredConcepts([]);
      return;
    }

    const loadConcepts = async () => {
      setLoadingConcepts(true);
      try {
        const concepts: ConceptItem[] = [];
        
        // 固定構想を追加
        const fixedConcepts = FIXED_CONCEPTS[hoveredProjectServiceId] || [];
        fixedConcepts.forEach((concept) => {
          concepts.push({
            id: `fixed-${concept.id}`,
            title: concept.name,
            conceptId: concept.id,
            path: `/business-plan/services/${hoveredProjectServiceId}/${concept.id}/overview`,
          });
        });

        // Firebaseから構想を取得
        let conceptsSnapshot;
        try {
          const conceptsQuery = query(
            collection(db, 'concepts'),
            where('userId', '==', auth.currentUser.uid),
            where('serviceId', '==', hoveredProjectServiceId),
            orderBy('createdAt', 'desc')
          );
          conceptsSnapshot = await getDocs(conceptsQuery);
        } catch (error: any) {
          if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
            const conceptsQueryWithoutOrder = query(
              collection(db, 'concepts'),
              where('userId', '==', auth.currentUser.uid),
              where('serviceId', '==', hoveredProjectServiceId)
            );
            conceptsSnapshot = await getDocs(conceptsQueryWithoutOrder);
          } else {
            throw error;
          }
        }

        // 固定構想と同じconceptIdを持つ構想を除外
        const fixedConceptIds = new Set(fixedConcepts.map(c => c.id));
        const conceptsData: Array<{ id: string; title: string; conceptId: string; createdAt: Date | null }> = [];
        
        conceptsSnapshot.forEach((doc) => {
          const data = doc.data();
          const conceptId = data.conceptId || '';
          if (!fixedConceptIds.has(conceptId)) {
            conceptsData.push({
              id: doc.id,
              title: data.name || conceptId,
              conceptId: conceptId,
              createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : null),
            });
          }
        });

        // 作成日時でソート（降順）
        conceptsData.sort((a, b) => {
          const aTime = (a.createdAt instanceof Date) ? a.createdAt.getTime() : 0;
          const bTime = (b.createdAt instanceof Date) ? b.createdAt.getTime() : 0;
          return bTime - aTime;
        });

        // アイテムに変換
        conceptsData.forEach((concept) => {
          concepts.push({
            id: concept.id,
            title: concept.title,
            conceptId: concept.conceptId,
            path: `/business-plan/services/${hoveredProjectServiceId}/${concept.conceptId}/overview`,
          });
        });

        setHoveredConcepts(concepts);
      } catch (error) {
        console.error('❌ 構想の読み込みエラー:', error);
        setHoveredConcepts([]);
      } finally {
        setLoadingConcepts(false);
      }
    };

    loadConcepts();
  }, [hoveredProjectServiceId, authReady, auth?.currentUser]);

  return (
    <>
      {/* サイドバー（アイコン表示） - 常に表示 */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '70px',
          height: '100vh',
          background: 'linear-gradient(180deg, #1F2933 0%, #18222D 100%)',
          zIndex: 998,
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
        }}
      >
        {/* ハンバーガーメニューボタン - サイドバーの一番上 */}
        <button
          onClick={onToggle}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            width: '50px',
            height: '50px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            transition: 'background-color 0.2s',
            opacity: 0.8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.opacity = '0.8';
          }}
          aria-label="メニューを開く"
        >
          {isOpen ? <CloseIcon size={20} color="white" /> : <MenuIcon size={20} color="white" />}
        </button>

        {/* メニューアイテム */}
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              title={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                marginBottom: index < menuItems.length - 1 ? '10px' : '0',
                borderRadius: '6px',
                color: 'white',
                textDecoration: 'none',
                transition: 'background-color 0.2s',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                opacity: isActive ? 1 : 0.7,
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.opacity = '1';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.opacity = '0.7';
                }
              }}
            >
              <IconComponent size={20} color="white" />
            </button>
          );
        })}
      </aside>

      {/* サイドメニュー - サイドバーの右側に表示 */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '70px',
            width: '280px',
            height: '100vh',
            background: 'var(--color-surface)',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            zIndex: 999,
            padding: '16px 0',
            overflowY: 'auto',
            borderRight: `1px solid var(--color-border-color)`,
          }}
        >
          {/* 事業計画が選択されている場合、かつメニュー計画一覧がある場合は通常のメニューを非表示、代わりに事業計画一覧を表示 */}
          {(() => {
            const shouldShow = activePage === 'business-plan' && menuPlanItems.length > 0;
            console.log('🔍 メニュー表示条件チェック:', {
              activePage,
              menuPlanItemsLength: menuPlanItems.length,
              menuPlanItems: menuPlanItems.map(i => ({ type: i.type, title: i.title })),
              shouldShow,
              pathname,
              isOpen,
            });
            return null;
          })()}
          {activePage === 'business-plan' && menuPlanItems.length > 0 ? (
            <>
              <div style={{ padding: '0 24px', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-light)', marginBottom: '0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  メニュー
                </h2>
              </div>
              {/* 事業企画一覧に戻るリンク */}
              {(() => {
                // 事業企画ページ（serviceIdまたはprojectIdがある場合）にいる場合のみ表示
                if (serviceId || projectId) {
                  return (
                    <button
                      onClick={() => handleNavigation('/business-plan')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 24px',
                        width: '100%',
                        color: 'var(--color-text-light)',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        borderLeft: '2px solid transparent',
                        backgroundColor: 'transparent',
                        fontSize: '14px',
                        fontWeight: 400,
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginBottom: '8px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-background)';
                        e.currentTarget.style.borderLeftColor = 'rgba(31, 41, 51, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderLeftColor = 'transparent';
                      }}
                    >
                      <span style={{ marginRight: '12px', opacity: 0.6 }}>
                        <span style={{ fontSize: '18px' }}>←</span>
                      </span>
                      <span>事業企画一覧に戻る</span>
                    </button>
                  );
                }
                return null;
              })()}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {loadingContent ? (
                  <div style={{ padding: '16px 24px', color: 'var(--color-text-light)', fontSize: '14px' }}>
                    読み込み中...
                  </div>
                ) : (
                  menuPlanItems.map((item) => {
                    // 現在のパスと一致するかチェック
                    let isActive = false;
                    
                    if (pathname === item.path) {
                      // 完全一致
                      isActive = true;
                    } else if (item.type === 'company-plan') {
                      // 会社事業計画の場合: /business-plan/company/[planId] で始まるかチェック
                      const planIdMatch = item.path.match(/\/business-plan\/company\/([^\/]+)/);
                      if (planIdMatch) {
                        const planId = planIdMatch[1];
                        isActive = pathname.startsWith(`/business-plan/company/${planId}/`);
                      }
                    } else if (item.type === 'project') {
                      // 事業企画の場合: /business-plan/services/[serviceId] で始まるかチェック
                      if (item.path.startsWith('/business-plan/services/')) {
                        const serviceIdMatch = item.path.match(/\/business-plan\/services\/([^\/]+)$/);
                        if (serviceIdMatch) {
                          const serviceId = serviceIdMatch[1];
                          // プロジェクト詳細ページ自体の場合もアクティブ
                          if (pathname === `/business-plan/services/${serviceId}`) {
                            isActive = true;
                          } else {
                            // 構想ページではない場合もアクティブ
                            isActive = pathname.startsWith(`/business-plan/services/${serviceId}/`) && 
                                       !pathname.match(/\/business-plan\/services\/[^\/]+\/[^\/]+/); // 構想ページではない
                          }
                        }
                      }
                    }
                    
                    // 事業企画の場合、serviceIdを取得
                    const menuProjectServiceId = item.type === 'project' ? item.serviceId || (item.path.startsWith('/business-plan/services/') ? item.path.match(/\/business-plan\/services\/([^\/]+)$/)?.[1] : null) : null;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.path)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '6px 24px',
                          width: '100%',
                          color: isActive ? 'var(--color-text)' : 'var(--color-text-light)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                          backgroundColor: isActive ? 'var(--color-background)' : 'transparent',
                          fontSize: '13px',
                          fontWeight: isActive ? 500 : 400,
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'var(--color-background)';
                            e.currentTarget.style.borderLeftColor = 'rgba(31, 41, 51, 0.2)';
                          }
                          // 事業企画の場合、構想を表示
                          if (item.type === 'project' && menuProjectServiceId) {
                            setHoveredProjectServiceId(menuProjectServiceId);
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderLeftColor = 'transparent';
                          }
                          // マウスがポップアップに移動した場合は保持
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (!relatedTarget || !relatedTarget.closest('.concept-popup')) {
                            setHoveredProjectServiceId(null);
                          }
                        }}
                      >
                        <span style={{ marginRight: '12px', opacity: isActive ? 1 : 0.6 }}>
                          <span style={{ fontSize: '18px' }}>
                            {item.type === 'company-plan' ? '🏢' : item.type === 'project' ? '📋' : '💡'}
                          </span>
                        </span>
                        <span>{item.title}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <>
          <div style={{ padding: '0 24px', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-light)', marginBottom: '0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              メニュー
            </h2>
          </div>
          <nav>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 24px',
                    width: '100%',
                    color: isActive ? 'var(--color-text)' : 'var(--color-text-light)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                    backgroundColor: isActive ? 'var(--color-background)' : 'transparent',
                    fontSize: '14px',
                    fontWeight: isActive ? 500 : 400,
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--color-background)';
                      e.currentTarget.style.borderLeftColor = 'rgba(31, 41, 51, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderLeftColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ marginRight: '12px', opacity: isActive ? 1 : 0.6 }}>
                    <IconComponent size={18} color={isActive ? 'var(--color-text)' : 'var(--color-text-light)'} />
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
            </>
          )}

          {/* コンテンツセクション - 事業計画が選択されている場合のみ表示 */}
          {activePage === 'business-plan' && contentItems.length > 0 && (
            <>
              <div style={{ padding: '0 24px', marginTop: '24px', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-light)', marginBottom: '0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  コンテンツ
                </h2>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {loadingContent ? (
                  <div style={{ padding: '16px 24px', color: 'var(--color-text-light)', fontSize: '14px' }}>
                    読み込み中...
                  </div>
                ) : (
                  contentItems.map((item) => {
                    // 現在のパスと一致するかチェック
                    let isActive = false;
                    
                    if (pathname === item.path) {
                      // 完全一致
                      isActive = true;
                    } else if (item.type === 'company-plan') {
                      // 会社事業計画の場合: /business-plan/company/[planId] で始まるかチェック
                      const planIdMatch = item.path.match(/\/business-plan\/company\/([^\/]+)/);
                      if (planIdMatch) {
                        const planId = planIdMatch[1];
                        isActive = pathname.startsWith(`/business-plan/company/${planId}/`);
                      }
                    } else if (item.type === 'concept') {
                      // 構想の場合: /business-plan/services/[serviceId]/[conceptId] で始まるかチェック
                      const conceptMatch = item.path.match(/\/business-plan\/services\/([^\/]+)\/([^\/]+)/);
                      if (conceptMatch) {
                        const serviceId = conceptMatch[1];
                        const conceptId = conceptMatch[2];
                        isActive = pathname.startsWith(`/business-plan/services/${serviceId}/${conceptId}/`);
                      }
                    } else if (item.type === 'project') {
                      // 事業企画の場合: /business-plan/services/[serviceId] で始まるかチェック
                      if (item.path.startsWith('/business-plan/services/')) {
                        const serviceIdMatch = item.path.match(/\/business-plan\/services\/([^\/]+)$/);
                        if (serviceIdMatch) {
                          const serviceId = serviceIdMatch[1];
                          // プロジェクト詳細ページ自体の場合もアクティブ
                          if (pathname === `/business-plan/services/${serviceId}`) {
                            isActive = true;
                          } else {
                            // 構想ページではない場合もアクティブ
                          isActive = pathname.startsWith(`/business-plan/services/${serviceId}/`) && 
                                     !pathname.match(/\/business-plan\/services\/[^\/]+\/[^\/]+/); // 構想ページではない
                          }
                        }
                      }
                    }
                    
                    // 事業企画の場合、serviceIdを取得
                    const projectServiceId = item.type === 'project' ? item.serviceId || (item.path.startsWith('/business-plan/services/') ? item.path.match(/\/business-plan\/services\/([^\/]+)$/)?.[1] : null) : null;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.path)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 24px',
                          width: '100%',
                          color: isActive ? '#fff' : 'var(--color-text-light)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                          fontSize: '13px',
                          fontWeight: isActive ? 600 : 400,
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          borderLeft: isActive ? '2px solid #3B82F6' : '2px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'var(--color-background)';
                            e.currentTarget.style.borderLeftColor = 'rgba(31, 41, 51, 0.2)';
                          }
                          // 事業企画の場合、構想を表示（会社全体の事業計画ページの場合のみ）
                          if (item.type === 'project' && projectServiceId && activePage === 'business-plan' && !serviceId && !projectId) {
                            setHoveredProjectServiceId(projectServiceId);
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderLeftColor = 'transparent';
                          } else {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                            e.currentTarget.style.borderLeftColor = '#3B82F6';
                          }
                          // マウスがポップアップに移動した場合は保持
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (!relatedTarget || !relatedTarget.closest('.concept-popup')) {
                            setHoveredProjectServiceId(null);
                          }
                        }}
                      >
                        <span style={{ 
                          marginRight: '8px', 
                          fontSize: '10px',
                          color: isActive 
                            ? '#fff' 
                            : (item.type === 'company-plan' ? '#3B82F6' : item.type === 'project' ? '#10B981' : '#8B5CF6'),
                          fontWeight: 500,
                        }}>
                          {item.type === 'company-plan' ? '🏢' : item.type === 'project' ? '📋' : '💡'}
                        </span>
                        <span style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}>
                          {item.title}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 構想一覧ポップアップ - 事業企画にホバーしたときに表示 */}
      {isOpen && hoveredProjectServiceId && hoveredConcepts.length > 0 && (
        <div
          className="concept-popup"
          style={{
            position: 'fixed',
            top: 0,
            left: '350px', // サイドメニューの右側
            width: '320px',
            height: '100vh',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.08), -2px 0 8px rgba(0,0,0,0.04)',
            zIndex: 998,
            padding: 0,
            overflowY: 'auto',
            borderRight: `1px solid rgba(0, 0, 0, 0.1)`,
            animation: 'conceptPopupSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={() => {
            // ポップアップ内にマウスがある場合は保持
          }}
          onMouseLeave={() => {
            setHoveredProjectServiceId(null);
          }}
        >
          {/* ヘッダー */}
          <div style={{
            padding: '20px 24px',
            background: 'linear-gradient(180deg, #1F2933 0%, #18222D 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}>
                💡
              </div>
              <div>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: 400,
                  color: '#ffffff',
                  margin: 0,
                  letterSpacing: '0.5px',
                }}>
                  構想一覧
                </h2>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: '4px 0 0 0',
                }}>
                  {hoveredConcepts.length}件の構想
                </p>
              </div>
            </div>
          </div>

          {/* コンテンツ */}
          <div style={{
            padding: '16px 12px',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
          }}>
            {loadingConcepts ? (
              <div style={{
                padding: '40px 24px',
                textAlign: 'center',
                color: 'var(--color-text-light)',
                fontSize: '14px',
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid rgba(139, 92, 246, 0.2)',
                  borderTopColor: '#8B5CF6',
                  borderRadius: '50%',
                  animation: 'conceptPopupSpin 0.8s linear infinite',
                  margin: '0 auto 12px',
                }} />
                読み込み中...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hoveredConcepts.map((concept, index) => {
                  const isActive = pathname.startsWith(concept.path);
                  return (
                    <button
                      key={concept.id}
                      onClick={() => handleNavigation(concept.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        width: '100%',
                        color: isActive ? '#8B5CF6' : 'var(--color-text)',
                        textDecoration: 'none',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        backgroundColor: isActive 
                          ? 'rgba(139, 92, 246, 0.1)' 
                          : 'rgba(255, 255, 255, 0.8)',
                        fontSize: '13px',
                        fontWeight: isActive ? 600 : 500,
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderRadius: '8px',
                        borderLeft: isActive ? '3px solid #8B5CF6' : '3px solid transparent',
                        boxShadow: isActive 
                          ? '0 2px 8px rgba(139, 92, 246, 0.15)' 
                          : '0 1px 3px rgba(0, 0, 0, 0.05)',
                        transform: isActive ? 'translateX(2px)' : 'translateX(0)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.08)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.12)';
                          e.currentTarget.style.transform = 'translateX(2px)';
                          e.currentTarget.style.borderLeftColor = 'rgba(139, 92, 246, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.borderLeftColor = 'transparent';
                        } else {
                          e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.15)';
                          e.currentTarget.style.borderLeftColor = '#8B5CF6';
                        }
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: isActive 
                          ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                          : 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        marginRight: '12px',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}>
                        💡
                      </div>
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        lineHeight: '1.4',
                      }}>
                        {concept.title}
                      </span>
                      {isActive && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '12px',
                          color: '#8B5CF6',
                          fontWeight: 600,
                        }}>
                          →
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

