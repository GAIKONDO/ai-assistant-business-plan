'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Layout from '@/components/Layout';
import BusinessPlanForm, { BusinessPlanData } from '@/components/BusinessPlanForm';
import BusinessPlanCard from '@/components/BusinessPlanCard';
import BusinessProjectForm, { BusinessProjectData } from '@/components/BusinessProjectForm';
import dynamic from 'next/dynamic';

// アニメーション用のスタイル
const modalStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// DynamicPageを動的にインポート（SSRを無効化）
const DynamicPage = dynamic(
  () => import('@/components/pages/component-test/test-concept/DynamicPage'),
  { ssr: false }
);

const SPECIAL_SERVICES = [
  { id: 'own-service', name: '自社開発・自社サービス事業', description: '自社開発のサービス事業に関する計画', hasConcepts: true },
  { id: 'education-training', name: 'AI導入ルール設計・人材育成・教育事業', description: '人材育成、教育、AI導入ルール設計に関する計画', hasConcepts: true },
  { id: 'consulting', name: 'プロセス可視化・業務コンサル事業', description: '業務コンサルティングとプロセス改善に関する計画', hasConcepts: true },
  { id: 'ai-dx', name: 'AI駆動開発・DX支援SI事業', description: 'AI技術を活用した開発・DX支援に関する計画', hasConcepts: true },
];

// 固定構想の定義（重複カウントを防ぐため）
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

export default function BusinessPlanPage() {
  const router = useRouter();
  const [companyPlans, setCompanyPlans] = useState<(BusinessPlanData & { id: string; createdAt?: Date; updatedAt?: Date })[]>([]);
  const [projects, setProjects] = useState<(BusinessProjectData & { id: string; createdAt?: Date; updatedAt?: Date })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<(BusinessPlanData & { id?: string }) | null>(null);
  const [editingProject, setEditingProject] = useState<(BusinessProjectData & { id?: string }) | null>(null);
  const [serviceCounts, setServiceCounts] = useState<{ [key: string]: number }>({});
  const [servicePageCounts, setServicePageCounts] = useState<{ [key: string]: number }>({});
  const [showCompanyPlanManagement, setShowCompanyPlanManagement] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPlanTitle, setEditingPlanTitle] = useState<string>('');
  const [draggedPlanId, setDraggedPlanId] = useState<string | null>(null);
  const [dragOverPlanId, setDragOverPlanId] = useState<string | null>(null);
  const [showProjectManagement, setShowProjectManagement] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState<string>('');
  const [editingProjectLinkPlanIds, setEditingProjectLinkPlanIds] = useState<Set<string>>(new Set());
  const [showLinkModal, setShowLinkModal] = useState<string | null>(null);
  const [editingFixedServiceId, setEditingFixedServiceId] = useState<string | null>(null);
  const [editingFixedServiceName, setEditingFixedServiceName] = useState<string>('');
  const [editingFixedServiceDescription, setEditingFixedServiceDescription] = useState<string>('');
  const [fixedServiceLinkedPlanIds, setFixedServiceLinkedPlanIds] = useState<{ [key: string]: string[] }>({});
  const [editingProjectModalId, setEditingProjectModalId] = useState<string | null>(null);
  const [editingProjectModalName, setEditingProjectModalName] = useState<string>('');
  const [editingProjectModalDescription, setEditingProjectModalDescription] = useState<string>('');
  const [editingProjectModalLinkPlanIds, setEditingProjectModalLinkPlanIds] = useState<Set<string>>(new Set());
  const [allProjects, setAllProjects] = useState<(BusinessProjectData & { id: string; createdAt?: Date; updatedAt?: Date })[]>([]);
  const [companyPlanFilter, setCompanyPlanFilter] = useState<'all' | 'fixed' | 'componentized' | 'favorite'>('all');
  const [projectCoverData, setProjectCoverData] = useState<{ [serviceId: string]: { id: string; pageNumber: number; title: string; content: string } | null }>({});
  const [selectedPlanFilterIds, setSelectedPlanFilterIds] = useState<Set<string>>(new Set());
  const [showPlanFilterModal, setShowPlanFilterModal] = useState(false);


  const loadPlans = async () => {
    if (!auth?.currentUser || !db) return;

    try {
      let companySnapshot;
      
      try {
        const companyQuery = query(
          collection(db, 'companyBusinessPlan'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        companySnapshot = await getDocs(companyQuery);
      } catch (error: any) {
        // インデックスがまだ作成中の場合は、orderByなしで再試行
        if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
          console.log('インデックス作成中。orderByなしで読み込みます。');
          const companyQueryWithoutOrder = query(
            collection(db, 'companyBusinessPlan'),
            where('userId', '==', auth.currentUser.uid)
          );
          companySnapshot = await getDocs(companyQueryWithoutOrder);
        } else {
          throw error;
        }
      }
      
      const plansData: (BusinessPlanData & { id: string; createdAt?: Date; updatedAt?: Date })[] = [];
      companySnapshot.forEach((doc) => {
        const data = doc.data();
        plansData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : undefined),
          updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : (data.updatedAt instanceof Date ? data.updatedAt : undefined),
        } as BusinessPlanData & { id: string; createdAt?: Date; updatedAt?: Date });
        
        // デバッグログ（開発時のみ）
        if (process.env.NODE_ENV === 'development') {
          console.log('loadPlans - plan loaded:', {
            id: doc.id,
            title: data.title,
            pagesBySubMenu: data.pagesBySubMenu,
            hasPagesBySubMenu: !!data.pagesBySubMenu,
            pagesBySubMenuKeys: data.pagesBySubMenu ? Object.keys(data.pagesBySubMenu) : [],
          });
        }
      });
      
      // クライアント側でソート（orderフィールドがある場合はそれを使用、なければcreatedAtで降順）
      plansData.sort((a, b) => {
        const aOrder = (a as any).order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = (b as any).order ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) {
          return aOrder - bOrder; // orderが小さい順
        }
        // orderが同じ場合はcreatedAtで降順
        const aTime = (a.createdAt instanceof Date) ? a.createdAt.getTime() : 0;
        const bTime = (b.createdAt instanceof Date) ? b.createdAt.getTime() : 0;
        return bTime - aTime; // 降順
      });
      
      // 固定ページ形式とコンポーネント化版を分類
      const fixedPlans = plansData.filter(plan => {
        const pagesBySubMenu = (plan as any).pagesBySubMenu;
        const isComponentized = pagesBySubMenu && 
          typeof pagesBySubMenu === 'object' && 
          Object.keys(pagesBySubMenu).length > 0 &&
          Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
        return !isComponentized;
      });
      
      const componentizedPlans = plansData.filter(plan => {
        const pagesBySubMenu = (plan as any).pagesBySubMenu;
        const isComponentized = pagesBySubMenu && 
          typeof pagesBySubMenu === 'object' && 
          Object.keys(pagesBySubMenu).length > 0 &&
          Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
        return isComponentized;
      });
      
      // デバッグログ（開発時のみ）
      if (process.env.NODE_ENV === 'development') {
        console.log('loadPlans - total plans loaded:', plansData.length);
        console.log('loadPlans - 固定ページ形式:', fixedPlans.length, '件');
        console.log('loadPlans - コンポーネント化版:', componentizedPlans.length, '件');
        console.log('loadPlans - 固定ページ形式のID:', fixedPlans.map(p => ({ id: p.id, title: p.title })));
        console.log('loadPlans - コンポーネント化版のID:', componentizedPlans.map(p => ({ id: p.id, title: p.title })));
      }
      
      setCompanyPlans(plansData);
    } catch (error) {
      console.error('読み込みエラー:', error);
      setCompanyPlans([]);
    }
  };

  const loadProjects = async (): Promise<(BusinessProjectData & { id: string; createdAt?: Date; updatedAt?: Date })[]> => {
    if (!auth?.currentUser || !db) return [];

    try {
      let projectsSnapshot;
      
      try {
        const projectsQuery = query(
          collection(db, 'businessProjects'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        projectsSnapshot = await getDocs(projectsQuery);
      } catch (error: any) {
        // インデックスがまだ作成中の場合は、orderByなしで再試行
        if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
          console.log('インデックス作成中。orderByなしで読み込みます。');
          const projectsQueryWithoutOrder = query(
            collection(db, 'businessProjects'),
            where('userId', '==', auth.currentUser.uid)
          );
          projectsSnapshot = await getDocs(projectsQueryWithoutOrder);
        } else {
          throw error;
        }
      }
      
      const allProjectsData: (BusinessProjectData & { id: string; createdAt?: Date; updatedAt?: Date })[] = [];
      const projectsData: (BusinessProjectData & { id: string; createdAt?: Date; updatedAt?: Date })[] = [];
      
      projectsSnapshot.forEach((doc) => {
        const data = doc.data();
        const projectData = {
          id: doc.id,
          ...data,
          createdAt: (() => {
            const createdAt = data.createdAt;
            return createdAt && typeof createdAt.toDate === 'function' ? createdAt.toDate() : (createdAt instanceof Date ? createdAt : undefined);
          })(),
          updatedAt: (() => {
            const updatedAt = data.updatedAt;
            return updatedAt && typeof updatedAt.toDate === 'function' ? updatedAt.toDate() : (updatedAt instanceof Date ? updatedAt : undefined);
          })(),
        } as BusinessProjectData & { id: string; createdAt?: Date; updatedAt?: Date };
        
        // すべてのプロジェクトをallProjectsDataに追加
        allProjectsData.push(projectData);
        
        // isFixed: trueのプロジェクトは除外（固定サービスはSPECIAL_SERVICESとして表示されるため）
        if (!data.isFixed) {
          projectsData.push(projectData);
        }
      });
      
      // クライアント側でソート
      projectsData.sort((a, b) => {
        const aTime = (a.createdAt instanceof Date) ? a.createdAt.getTime() : 0;
        const bTime = (b.createdAt instanceof Date) ? b.createdAt.getTime() : 0;
        return bTime - aTime; // 降順
      });
      
      allProjectsData.sort((a, b) => {
        const aTime = (a.createdAt instanceof Date) ? a.createdAt.getTime() : 0;
        const bTime = (b.createdAt instanceof Date) ? b.createdAt.getTime() : 0;
        return bTime - aTime; // 降順
      });
      
      // 固定サービスのリンク情報を読み込む（isFixed: trueのプロジェクトから）
      const fixedServiceLinks: { [key: string]: string[] } = {};
      projectsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isFixed && data.serviceId) {
          const serviceId = data.serviceId;
          fixedServiceLinks[serviceId] = data.linkedPlanIds || [];
        }
      });
      setFixedServiceLinkedPlanIds(fixedServiceLinks);
      
      // component-testが含まれていないか確認
      const hasComponentTest = allProjectsData.some(p => 
        p.serviceId === 'component-test' || 
        p.id === 'component-test' || 
        p.name === '5. コンポーネント化test' || 
        p.name === '5.5. コンポーネント化test'
      );
      
      if (hasComponentTest) {
        console.warn('⚠️ 警告: component-testプロジェクトがFirestoreに残っています！');
        const componentTestProjects = allProjectsData.filter(p => 
          p.serviceId === 'component-test' || 
          p.id === 'component-test' || 
          p.name === '5. コンポーネント化test' || 
          p.name === '5.5. コンポーネント化test'
        );
        console.warn('残っているcomponent-testプロジェクト:', componentTestProjects.map(p => ({ id: p.id, name: p.name, serviceId: p.serviceId })));
      } else {
        console.log('✅ component-testプロジェクトはFirestoreに存在しません（削除済み）');
      }
      
      console.log('=== 事業企画一覧 ===');
      console.log(`\n【Firestoreから取得したデータ】`);
      console.log(`総数: ${projectsSnapshot.size}件`);
      console.log(`動的プロジェクト（isFixed: false）: ${projectsData.length}件`);
      console.log(`固定プロジェクト（isFixed: true）: ${allProjectsData.length - projectsData.length}件`);
      console.log(`\n【SPECIAL_SERVICESの定義（固定サービス）】`);
      console.log(`定義されている固定サービス数: ${SPECIAL_SERVICES.length}件`);
      SPECIAL_SERVICES.forEach((service, index) => {
        const existsInFirestore = projectsSnapshot.docs.some(doc => {
          const data = doc.data();
          return data.isFixed && data.serviceId === service.id;
        });
        console.log(`  [${index + 1}] ${service.name} (serviceId: ${service.id}) - Firestore: ${existsInFirestore ? '存在する' : '存在しない'}`);
      });
      console.log('\n--- すべてのプロジェクト詳細（Firestoreから取得） ---');
      projectsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n[${index + 1}] ID: ${doc.id}`);
        console.log(`  名前: ${data.name || '(未設定)'}`);
        console.log(`  説明: ${data.description || '(未設定)'}`);
        console.log(`  serviceId: ${data.serviceId || '(なし)'}`);
        console.log(`  isFixed: ${data.isFixed ? 'true' : 'false'}`);
        console.log(`  linkedPlanIds: ${Array.isArray(data.linkedPlanIds) ? data.linkedPlanIds.join(', ') : '(なし)'}`);
        console.log(`  createdAt: ${data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toLocaleString('ja-JP') : data.createdAt) : '(なし)'}`);
        console.log(`  updatedAt: ${data.updatedAt ? (typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toLocaleString('ja-JP') : data.updatedAt) : '(なし)'}`);
      });
      console.log('\n--- 動的プロジェクトのみ ---');
      projectsData.forEach((p, index) => {
        console.log(`[${index + 1}] ${p.name || '(未設定)'} (ID: ${p.id})`);
      });
      console.log('\n--- 固定プロジェクトのみ ---');
      allProjectsData.filter(p => (p as any).isFixed).forEach((p, index) => {
        console.log(`[${index + 1}] ${p.name || '(未設定)'} (ID: ${p.id}, serviceId: ${(p as any).serviceId || '(なし)'})`);
      });
      console.log('==================\n');
      
      setProjects(projectsData);
      setAllProjects(allProjectsData);
      return projectsData;
    } catch (error) {
      console.error('事業企画読み込みエラー:', error);
      setProjects([]); // エラー時は空配列を設定
      return [];
    }
  };

  const loadServiceCounts = async (projectsList: (BusinessProjectData & { id: string })[]) => {
    if (!auth?.currentUser || !db) {
      console.log('loadServiceCounts: authまたはdbが存在しません');
      return;
    }

    const userId = auth.currentUser.uid; // 変数に保存してTypeScriptエラーを回避

    try {
      console.log('loadServiceCounts: 開始', { projectsListLength: projectsList.length });
      const startTime = performance.now();
      const counts: { [key: string]: number } = {};
      const pageCounts: { [key: string]: number } = {};
      
      // すべてのサービスIDを収集
      const allServiceIds = [
        ...SPECIAL_SERVICES.map(s => s.id),
        ...projectsList.map(p => p.serviceId)
      ];

      console.log('カウントクエリ開始');
      // すべての構想と事業計画を並列で一度に取得
      const [conceptsSnapshot, plansSnapshot] = await Promise.all([
        // すべての構想を一度に取得
        (async () => {
          try {
            const conceptsQuery = query(
              collection(db, 'concepts'),
              where('userId', '==', userId)
            );
            return await getDocs(conceptsQuery);
          } catch (error) {
            console.error('構想取得エラー:', error);
            return null;
          }
        })(),
        // すべての事業計画を一度に取得
        (async () => {
          try {
            const plansQuery = query(
              collection(db, 'servicePlans'),
              where('userId', '==', userId)
            );
            return await getDocs(plansQuery);
          } catch (error) {
            console.error('事業計画取得エラー:', error);
            return null;
          }
        })()
      ]);

      // 固定構想数の定義
      const fixedConceptCounts: { [key: string]: number } = {
        'own-service': 2,
        'ai-dx': 2,
        'consulting': 2,
        'education-training': 3,
      };

      // 固定構想のconceptIdを収集（重複カウントを防ぐため）
      const fixedConceptIds = new Set<string>();
      Object.keys(FIXED_CONCEPTS).forEach((serviceId) => {
        FIXED_CONCEPTS[serviceId].forEach((concept) => {
          fixedConceptIds.add(concept.id);
        });
      });

      // 構想をサービスIDごとに集計（固定構想と同じconceptIdを持つ構想は除外）
      const dynamicConcepts: { [key: string]: Array<{ id: string; name: string; conceptId: string }> } = {};
      const coverDataMap: { [serviceId: string]: { id: string; pageNumber: number; title: string; content: string } | null } = {};
      
      console.log(`構想スナップショット: ${conceptsSnapshot ? conceptsSnapshot.size : 0}件`);
      if (conceptsSnapshot) {
        conceptsSnapshot.forEach((doc) => {
          const data = doc.data();
          const serviceId = data.serviceId;
          const conceptId = data.conceptId;
          
          console.log(`構想処理中: serviceId=${serviceId}, conceptId=${conceptId}, name=${data.name}`);
          
          // ページ数を計算（固定構想も含む）
          if (serviceId) {
            const pagesBySubMenu = data.pagesBySubMenu;
            const isComponentized = pagesBySubMenu && 
              typeof pagesBySubMenu === 'object' && 
              Object.keys(pagesBySubMenu).length > 0 &&
              Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
            
            console.log(`  isComponentized=${isComponentized}, pagesBySubMenu keys=${pagesBySubMenu ? Object.keys(pagesBySubMenu).join(',') : 'none'}`);
            
            // ページ数を計算（コンポーネント形式の場合）
            if (isComponentized && pagesBySubMenu) {
              let totalPages = 0;
              Object.values(pagesBySubMenu).forEach((pages: any) => {
                if (Array.isArray(pages)) {
                  totalPages += pages.length;
                }
              });
              const previousCount = pageCounts[serviceId] || 0;
              pageCounts[serviceId] = previousCount + totalPages;
              console.log(`  ページ数計算: serviceId=${serviceId}, conceptId=${conceptId}, totalPages=${totalPages}, 累計=${pageCounts[serviceId]}`);
            } else {
              console.log(`  コンポーネント形式ではないため、ページ数をスキップ`);
            }
          }
          
          // 固定構想と同じconceptIdを持つ構想は除外（カウント用）
          if (serviceId && !fixedConceptIds.has(conceptId)) {
            counts[serviceId] = (counts[serviceId] || 0) + 1;
            // 動的構想の情報を記録
            if (!dynamicConcepts[serviceId]) {
              dynamicConcepts[serviceId] = [];
            }
            dynamicConcepts[serviceId].push({
              id: doc.id,
              name: data.name || '名前なし',
              conceptId: conceptId || 'conceptIdなし'
            });
            
            // コンポーネント形式の構想の最初のページをカバーとして取得
            const pagesBySubMenuForCover = data.pagesBySubMenu;
            const isComponentizedForCover = pagesBySubMenuForCover && 
              typeof pagesBySubMenuForCover === 'object' && 
              Object.keys(pagesBySubMenuForCover).length > 0 &&
              Object.values(pagesBySubMenuForCover).some((pages: any) => Array.isArray(pages) && pages.length > 0);
            
            // まだカバーが設定されていない場合のみ設定
            if (isComponentizedForCover && !coverDataMap[serviceId]) {
              try {
                const pageOrderBySubMenu = data.pageOrderBySubMenu;
                let targetSubMenuId = 'overview';
                let pages = pagesBySubMenuForCover[targetSubMenuId];
                
                // overviewが存在しない場合は最初のサブメニューを使用
                if (!pages || !Array.isArray(pages) || pages.length === 0) {
                  const subMenuKeys = Object.keys(pagesBySubMenuForCover);
                  if (subMenuKeys.length > 0) {
                    targetSubMenuId = subMenuKeys[0];
                    pages = pagesBySubMenuForCover[targetSubMenuId];
                  }
                }
                
                if (Array.isArray(pages) && pages.length > 0) {
                  // 順序がある場合はそれを使用、なければ最初のページ
                  let firstPage;
                  if (pageOrderBySubMenu && pageOrderBySubMenu[targetSubMenuId] && pageOrderBySubMenu[targetSubMenuId].length > 0) {
                    const firstPageId = pageOrderBySubMenu[targetSubMenuId][0];
                    firstPage = pages.find((p: any) => p.id === firstPageId) || pages[0];
                  } else {
                    firstPage = pages[0];
                  }
                  
                  if (firstPage) {
                    // 1ページ目がキービジュアルのコンテナかどうかを判定
                    const firstPageContent = firstPage.content || '';
                    const firstPageId = firstPage.id || '';
                    const firstPageTitle = (firstPage.title || '').toLowerCase();
                    
                    const isKeyVisualContainer = 
                      firstPageId === '0' ||
                      firstPageId === 'page-0' ||
                      firstPageId.includes('page-0') ||
                      firstPage.pageNumber === 0 ||
                      firstPageContent.includes('data-page-container="0"') ||
                      firstPageContent.includes("data-page-container='0'") ||
                      firstPageTitle.includes('キービジュアル') ||
                      firstPageTitle.includes('keyvisual') ||
                      firstPageContent.includes('keyVisual') ||
                      (firstPage.pageNumber === 1 && firstPageContent.includes('<img') && firstPageContent.length < 500);
                    
                    // キービジュアルの場合は2ページ目を使用
                    let targetPage = firstPage;
                    if (isKeyVisualContainer && pages.length > 1) {
                      if (pageOrderBySubMenu && pageOrderBySubMenu[targetSubMenuId] && pageOrderBySubMenu[targetSubMenuId].length > 1) {
                        const secondPageId = pageOrderBySubMenu[targetSubMenuId][1];
                        targetPage = pages.find((p: any) => p.id === secondPageId) || pages[1];
                      } else {
                        targetPage = pages[1];
                      }
                    }
                    
                    if (targetPage) {
                      coverDataMap[serviceId] = {
                        id: targetPage.id,
                        pageNumber: targetPage.pageNumber || 1,
                        title: targetPage.title || '',
                        content: targetPage.content || '',
                      };
                    }
                  }
                }
              } catch (error) {
                console.error(`事業企画 ${serviceId} のカバー取得エラー:`, error);
              }
            }
          }
        });
      }
      
      setProjectCoverData(coverDataMap);
      
      // 動的構想の情報をコンソールに出力
      console.log('動的構想の一覧:', dynamicConcepts);
      Object.keys(dynamicConcepts).forEach((serviceId) => {
        const service = SPECIAL_SERVICES.find(s => s.id === serviceId);
        const serviceName = service ? service.name : serviceId;
        console.log(`${serviceName}: ${dynamicConcepts[serviceId].length}件`, dynamicConcepts[serviceId]);
      });

      // 固定構想数を追加
      Object.keys(fixedConceptCounts).forEach((serviceId) => {
        counts[serviceId] = (counts[serviceId] || 0) + fixedConceptCounts[serviceId];
      });

      // 事業計画をサービスIDごとに集計
      if (plansSnapshot) {
        plansSnapshot.forEach((doc) => {
          const data = doc.data();
          const serviceId = data.serviceId;
          if (serviceId && serviceId !== 'own-service') {
            counts[serviceId] = (counts[serviceId] || 0) + 1;
          }
        });
      }

      // サービスIDが存在しない場合は0を設定
      for (const serviceId of allServiceIds) {
        if (!counts[serviceId]) {
          counts[serviceId] = 0;
        }
        if (!pageCounts[serviceId]) {
          pageCounts[serviceId] = 0;
        }
      }
      
      const endTime = performance.now();
      console.log(`カウント処理完了: ${(endTime - startTime).toFixed(2)}ms`);
      console.log('ページ数:', pageCounts);
      setServiceCounts(counts);
      setServicePageCounts(pageCounts);
    } catch (error) {
      console.error('カウント読み込みエラー:', error);
      // エラーが発生しても空のオブジェクトを設定して続行
      setServiceCounts({});
      setServicePageCounts({});
    }
  };

  useEffect(() => {
    // 認証状態の監視を設定
    if (!auth) {
      setLoading(false);
      return;
    }

    // 認証状態が確定するまで待つ
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && db) {
        // component-testに関連する構想を削除
        try {
          const conceptsQuery = query(
            collection(db, 'concepts'),
            where('userId', '==', user.uid),
            where('serviceId', '==', 'component-test')
          );
          const conceptsSnapshot = await getDocs(conceptsQuery);
          
          if (!conceptsSnapshot.empty) {
            console.log(`component-testに関連する構想を${conceptsSnapshot.size}件削除します`);
            const deletePromises = conceptsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            console.log('構想の削除が完了しました');
          }
        } catch (error) {
          console.error('構想削除エラー:', error);
        }
        
        // component-testプロジェクトを削除（ゴミデータのクリーンアップ）
        try {
          const projectsQuery = query(
            collection(db, 'businessProjects'),
            where('userId', '==', user.uid)
          );
          const projectsSnapshot = await getDocs(projectsQuery);
          
          const componentTestProjects = projectsSnapshot.docs.filter(doc => {
            const data = doc.data();
            // serviceIdが'component-test'または、idが'component-test'のプロジェクトを削除
            return data.serviceId === 'component-test' || doc.id === 'component-test' || data.name === '5. コンポーネント化test' || data.name === '5.5. コンポーネント化test';
          });
          
          if (componentTestProjects.length > 0) {
            console.log(`🗑️ component-testプロジェクトを${componentTestProjects.length}件削除します:`, componentTestProjects.map(d => ({ id: d.id, name: d.data().name || d.data().title, serviceId: d.data().serviceId })));
            const deletePromises = componentTestProjects.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            console.log('✅ component-testプロジェクトの削除が完了しました');
            
            // 削除後の確認
            const verifyQuery = query(
              collection(db, 'businessProjects'),
              where('userId', '==', user.uid)
            );
            const verifySnapshot = await getDocs(verifyQuery);
            const remainingComponentTest = verifySnapshot.docs.filter(doc => {
              const data = doc.data();
              return data.serviceId === 'component-test' || doc.id === 'component-test' || data.name === '5. コンポーネント化test' || data.name === '5.5. コンポーネント化test';
            });
            
            if (remainingComponentTest.length === 0) {
              console.log('✅ 確認: component-testプロジェクトは完全に削除されました');
            } else {
              console.warn(`⚠️ 警告: ${remainingComponentTest.length}件のcomponent-testプロジェクトがまだ残っています`);
            }
          } else {
            console.log('✅ component-testプロジェクトは既に削除済みです（Firestoreに存在しません）');
          }
        } catch (error) {
          console.error('❌ component-testプロジェクト削除エラー:', error);
        }
        
        setLoading(true);
        const startTime = performance.now();
        console.log('データ読み込み開始');
        
        Promise.all([
          loadPlans(),
          loadProjects()
        ])
          .then(async ([, projectsData]) => {
            const plansTime = performance.now();
            console.log(`基本データ読み込み完了: ${(plansTime - startTime).toFixed(2)}ms`);
            
            // プロジェクト読み込み完了後にカウントを実行
            await loadServiceCounts(projectsData || []);
            const countsTime = performance.now();
            console.log(`カウント読み込み完了: ${(countsTime - plansTime).toFixed(2)}ms`);
            console.log(`合計時間: ${(countsTime - startTime).toFixed(2)}ms`);
            
            setLoading(false);
          })
          .catch((error) => {
            console.error('データ読み込みエラー:', error);
            setLoading(false);
          });
      } else {
        // ユーザーがログインしていない場合は読み込み完了とする
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteCompanyPlan = async (planId: string) => {
    if (!db) return;
    if (!confirm('会社本体の事業計画を削除しますか？')) return;

    try {
      await deleteDoc(doc(db, 'companyBusinessPlan', planId));
      loadPlans();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const handleMovePlanOrder = async (planId: string, direction: 'up' | 'down') => {
    if (!db || !auth?.currentUser) return;

    try {
      const currentIndex = companyPlans.findIndex(p => p.id === planId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= companyPlans.length) return;

      const currentPlan = companyPlans[currentIndex];
      const targetPlan = companyPlans[newIndex];

      // orderフィールドを取得（なければインデックスを使用）
      const currentOrder = (currentPlan as any).order ?? currentIndex;
      const targetOrder = (targetPlan as any).order ?? newIndex;

      // 順序を入れ替え
      await updateDoc(doc(db, 'companyBusinessPlan', currentPlan.id), {
        order: targetOrder,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'companyBusinessPlan', targetPlan.id), {
        order: currentOrder,
        updatedAt: serverTimestamp(),
      });

      loadPlans();
    } catch (error) {
      console.error('順序変更エラー:', error);
      alert('順序の変更に失敗しました');
    }
  };

  const handleDragStart = (e: React.DragEvent, planId: string) => {
    setDraggedPlanId(planId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', planId);
    // ドラッグ中の視覚的フィードバック
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedPlanId(null);
    setDragOverPlanId(null);
  };

  const handleDragOver = (e: React.DragEvent, planId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (planId !== draggedPlanId) {
      setDragOverPlanId(planId);
    }
  };

  const handleDragLeave = () => {
    setDragOverPlanId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetPlanId: string) => {
    e.preventDefault();
    setDragOverPlanId(null);

    if (!draggedPlanId || draggedPlanId === targetPlanId || !db || !auth?.currentUser) {
      setDraggedPlanId(null);
      return;
    }

    try {
      const draggedIndex = companyPlans.findIndex(p => p.id === draggedPlanId);
      const targetIndex = companyPlans.findIndex(p => p.id === targetPlanId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // 新しい順序を計算
      const newPlans = [...companyPlans];
      const [draggedPlan] = newPlans.splice(draggedIndex, 1);
      newPlans.splice(targetIndex, 0, draggedPlan);

      // すべてのプランのorderを更新
      const updatePromises = newPlans.map((plan, index) =>
        updateDoc(doc(db!, 'companyBusinessPlan', plan.id), {
          order: index,
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);
      loadPlans();
    } catch (error) {
      console.error('ドラッグ&ドロップ順序変更エラー:', error);
      alert('順序の変更に失敗しました');
    } finally {
      setDraggedPlanId(null);
    }
  };

  const handleSavePlanTitle = async (planId: string) => {
    if (!db || !auth?.currentUser) return;
    
    if (!editingPlanTitle.trim()) {
      alert('事業計画名を入力してください。');
      return;
    }

    try {
      await updateDoc(doc(db, 'companyBusinessPlan', planId), {
        title: editingPlanTitle.trim(),
        updatedAt: serverTimestamp(),
      });
      
      setEditingPlanId(null);
      setEditingPlanTitle('');
      loadPlans();
    } catch (error) {
      console.error('更新エラー:', error);
      alert('名前の更新に失敗しました');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!db) return;
    if (!confirm('この事業企画を削除しますか？関連する事業計画も削除されます。')) return;

    try {
      await deleteDoc(doc(db, 'businessProjects', id));
      loadProjects();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const handleSaveProjectLinks = async (projectId: string) => {
    if (!db || !auth?.currentUser) return;

    try {
      await updateDoc(doc(db, 'businessProjects', projectId), {
        linkedPlanIds: Array.from(editingProjectLinkPlanIds),
        updatedAt: serverTimestamp(),
      });
      
      setShowLinkModal(null);
      setEditingProjectLinkPlanIds(new Set());
      loadProjects();
    } catch (error) {
      console.error('更新エラー:', error);
      alert('リンクの更新に失敗しました');
    }
  };

  const handleOpenLinkModal = (projectId: string, currentLinkedPlanIds: string[] = []) => {
    setShowLinkModal(projectId);
    setEditingProjectLinkPlanIds(new Set(currentLinkedPlanIds));
  };

  const handleSaveFixedService = async (serviceId: string) => {
    if (!db || !auth?.currentUser) return;
    
    if (!editingFixedServiceName.trim()) {
      alert('事業企画名を入力してください。');
      return;
    }

    try {
      // 固定サービス用のドキュメントを検索または作成
      const fixedServiceQuery = query(
        collection(db, 'businessProjects'),
        where('userId', '==', auth.currentUser.uid),
        where('serviceId', '==', serviceId),
        where('isFixed', '==', true)
      );
      const fixedServiceSnapshot = await getDocs(fixedServiceQuery);
      
      const updateData = {
        name: editingFixedServiceName.trim(),
        description: editingFixedServiceDescription.trim(),
        serviceId: serviceId,
        isFixed: true,
        updatedAt: serverTimestamp(),
      };

      if (!fixedServiceSnapshot.empty) {
        // 既存のドキュメントを更新
        const docId = fixedServiceSnapshot.docs[0].id;
        const existingData = fixedServiceSnapshot.docs[0].data();
        await updateDoc(doc(db, 'businessProjects', docId), {
          ...updateData,
          linkedPlanIds: existingData.linkedPlanIds || [],
        });
      } else {
        // 新規作成
        await addDoc(collection(db, 'businessProjects'), {
          ...updateData,
          userId: auth.currentUser.uid,
          linkedPlanIds: [],
          createdAt: serverTimestamp(),
        });
      }
      
      setEditingFixedServiceId(null);
      setEditingFixedServiceName('');
      setEditingFixedServiceDescription('');
      loadProjects();
    } catch (error) {
      console.error('更新エラー:', error);
      alert('更新に失敗しました');
    }
  };

  const handleSaveFixedServiceWithLinks = async (serviceId: string) => {
    if (!db || !auth?.currentUser) return;
    
    if (!editingProjectModalName.trim()) {
      alert('事業企画名を入力してください。');
      return;
    }

    try {
      // 固定サービス用のドキュメントを検索または作成
      const fixedServiceQuery = query(
        collection(db, 'businessProjects'),
        where('userId', '==', auth.currentUser.uid),
        where('serviceId', '==', serviceId),
        where('isFixed', '==', true)
      );
      const fixedServiceSnapshot = await getDocs(fixedServiceQuery);
      
      const updateData = {
        name: editingProjectModalName.trim(),
        description: editingProjectModalDescription.trim(),
        serviceId: serviceId,
        isFixed: true,
        linkedPlanIds: Array.from(editingProjectModalLinkPlanIds),
        updatedAt: serverTimestamp(),
      };

      if (!fixedServiceSnapshot.empty) {
        // 既存のドキュメントを更新
        const docId = fixedServiceSnapshot.docs[0].id;
        await updateDoc(doc(db, 'businessProjects', docId), updateData);
      } else {
        // 新規作成
        await addDoc(collection(db, 'businessProjects'), {
          ...updateData,
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
        });
      }
      
      setEditingProjectModalId(null);
      setEditingProjectModalName('');
      setEditingProjectModalDescription('');
      setEditingProjectModalLinkPlanIds(new Set());
      loadProjects();
    } catch (error) {
      console.error('更新エラー:', error);
      alert('更新に失敗しました');
    }
  };

  const handleSaveProjectWithLinks = async (projectId: string) => {
    if (!db || !auth?.currentUser) return;
    
    if (!editingProjectModalName.trim()) {
      alert('事業企画名を入力してください。');
      return;
    }

    try {
      await updateDoc(doc(db, 'businessProjects', projectId), {
        name: editingProjectModalName.trim(),
        description: editingProjectModalDescription.trim(),
        linkedPlanIds: Array.from(editingProjectModalLinkPlanIds),
        updatedAt: serverTimestamp(),
      });
      
      setEditingProjectModalId(null);
      setEditingProjectModalName('');
      setEditingProjectModalDescription('');
      setEditingProjectModalLinkPlanIds(new Set());
      loadProjects();
    } catch (error) {
      console.error('更新エラー:', error);
      alert('更新に失敗しました');
    }
  };

  const handleSaveFixedServiceLinks = async (serviceId: string) => {
    if (!db || !auth?.currentUser) return;

    try {
      // 固定サービス用のドキュメントを検索または作成
      const fixedServiceQuery = query(
        collection(db, 'businessProjects'),
        where('userId', '==', auth.currentUser.uid),
        where('serviceId', '==', serviceId),
        where('isFixed', '==', true)
      );
      const fixedServiceSnapshot = await getDocs(fixedServiceQuery);
      
      const updateData = {
        linkedPlanIds: Array.from(editingProjectLinkPlanIds),
        updatedAt: serverTimestamp(),
      };

      if (!fixedServiceSnapshot.empty) {
        // 既存のドキュメントを更新
        const docId = fixedServiceSnapshot.docs[0].id;
        await updateDoc(doc(db, 'businessProjects', docId), updateData);
      } else {
        // 新規作成（固定サービスの基本情報も含める）
        const service = SPECIAL_SERVICES.find(s => s.id === serviceId);
        await addDoc(collection(db, 'businessProjects'), {
          name: service?.name || '',
          description: service?.description || '',
          serviceId: serviceId,
          isFixed: true,
          linkedPlanIds: Array.from(editingProjectLinkPlanIds),
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      setShowLinkModal(null);
      setEditingProjectLinkPlanIds(new Set());
      loadProjects();
    } catch (error) {
      console.error('更新エラー:', error);
      alert('リンクの更新に失敗しました');
    }
  };

  const handleSaveProjectName = async (projectId: string) => {
    if (!db || !auth?.currentUser) return;
    
    if (!editingProjectName.trim()) {
      alert('事業企画名を入力してください。');
      return;
    }

    try {
      await updateDoc(doc(db, 'businessProjects', projectId), {
        name: editingProjectName.trim(),
        updatedAt: serverTimestamp(),
      });
      
      setEditingProjectId(null);
      setEditingProjectName('');
      loadProjects();
    } catch (error) {
      console.error('更新エラー:', error);
      alert('名前の更新に失敗しました');
    }
  };

  const handleEditCompanyPlan = (plan: BusinessPlanData & { id: string }) => {
    setEditingPlan(plan);
    setShowCompanyForm(true);
  };

  const handleToggleCompanyPlanFavorite = async (planId: string, currentFavorite: boolean) => {
    if (!db) return;
    
    try {
      const planDoc = doc(db, 'companyBusinessPlan', planId);
      await updateDoc(planDoc, {
        isFavorite: !currentFavorite,
        updatedAt: serverTimestamp(),
      });
      loadPlans();
    } catch (error) {
      console.error('お気に入り更新エラー:', error);
      alert('お気に入りの更新に失敗しました');
    }
  };

  const handleEditProject = (project: BusinessProjectData & { id: string }) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleFormClose = () => {
    setShowCompanyForm(false);
    setEditingPlan(null);
    loadPlans();
  };

  const handleProjectFormClose = () => {
    setShowProjectForm(false);
    setEditingProject(null);
    loadProjects();
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>読み込み中...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        {/* 会社本体の事業計画セクション */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ marginBottom: '4px' }}>会社本体の事業計画</h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-light)' }}>
                会社全体の事業計画を管理します
              </p>
            </div>
            {!showCompanyForm && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {companyPlans.length > 0 && (
                  <>
                    {/* フィルターボタン */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => setCompanyPlanFilter('all')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: companyPlanFilter === 'all' ? '#4B5563' : '#F3F4F6',
                          color: companyPlanFilter === 'all' ? '#fff' : '#374151',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          transition: 'all 0.2s',
                        }}
                      >
                        すべて
                      </button>
                      <button
                        onClick={() => setCompanyPlanFilter('fixed')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: companyPlanFilter === 'fixed' ? '#4B5563' : '#F3F4F6',
                          color: companyPlanFilter === 'fixed' ? '#fff' : '#374151',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          transition: 'all 0.2s',
                        }}
                      >
                        固定ページ形式
                      </button>
                      <button
                        onClick={() => setCompanyPlanFilter('componentized')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: companyPlanFilter === 'componentized' ? '#4B5563' : '#F3F4F6',
                          color: companyPlanFilter === 'componentized' ? '#fff' : '#374151',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          transition: 'all 0.2s',
                        }}
                      >
                        コンポーネント形式
                      </button>
                      <button
                        onClick={() => setCompanyPlanFilter('favorite')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: companyPlanFilter === 'favorite' ? '#4B5563' : '#F3F4F6',
                          color: companyPlanFilter === 'favorite' ? '#fff' : '#374151',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={companyPlanFilter === 'favorite' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        お気に入り
                      </button>
                      <button
                        onClick={() => setShowPlanFilterModal(true)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: selectedPlanFilterIds.size > 0 ? '#3B82F6' : '#F3F4F6',
                          color: selectedPlanFilterIds.size > 0 ? '#fff' : '#374151',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedPlanFilterIds.size === 0) {
                            e.currentTarget.style.backgroundColor = '#E5E7EB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedPlanFilterIds.size === 0) {
                            e.currentTarget.style.backgroundColor = '#F3F4F6';
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                        事業企画フィルター
                        {selectedPlanFilterIds.size > 0 && (
                          <span style={{
                            backgroundColor: selectedPlanFilterIds.size > 0 ? '#fff' : 'transparent',
                            color: selectedPlanFilterIds.size > 0 ? '#3B82F6' : 'inherit',
                            borderRadius: '10px',
                            padding: '2px 6px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}>
                            {selectedPlanFilterIds.size}
                          </span>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setShowCompanyPlanManagement(true);
                        setSelectedPlanIds(new Set());
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#6B7280',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#4B5563';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#6B7280';
                      }}
                    >
                      管理
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setEditingPlan(null);
                    setShowCompanyForm(true);
                  }}
                  className="button"
                >
                  新しい事業計画を作成
                </button>
              </div>
            )}
          </div>

          {showCompanyForm ? (
            <BusinessPlanForm
              plan={editingPlan || undefined}
              onSave={handleFormClose}
              onCancel={handleFormClose}
              type="company"
            />
          ) : (
            (() => {
              // フィルタリングされたリストを取得
              let filteredPlans = companyPlans;
              
              // 特定の事業計画フィルターが選択されている場合
              if (selectedPlanFilterIds.size > 0) {
                filteredPlans = companyPlans.filter(plan => selectedPlanFilterIds.has(plan.id));
              } else {
                // 会社全体の事業計画のフィルターと連動
                filteredPlans = companyPlans.filter(plan => {
                  if (companyPlanFilter === 'all') return true;
                  if (companyPlanFilter === 'favorite') {
                    return (plan as any).isFavorite === true;
                  }
                  const pagesBySubMenu = (plan as any).pagesBySubMenu;
                  const isComponentized = pagesBySubMenu && 
                    typeof pagesBySubMenu === 'object' && 
                    Object.keys(pagesBySubMenu).length > 0 &&
                    Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
                  if (companyPlanFilter === 'fixed') return !isComponentized;
                  if (companyPlanFilter === 'componentized') return isComponentized;
                  return true;
                });
              }
              
              // フィルタリングされた事業計画のIDセットを作成（事業企画カードのフィルタリング用）
              const filteredPlanIds = new Set(filteredPlans.map(p => p.id));

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                  {filteredPlans.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px', gridColumn: '1 / -1' }}>
                      <p style={{ color: 'var(--color-text-light)', fontSize: '14px', marginBottom: '16px' }}>
                        {companyPlans.length === 0 
                          ? '会社本体の事業計画がまだ作成されていません'
                          : `フィルタ条件に一致する事業計画がありません（${companyPlanFilter === 'fixed' ? '固定ページ形式' : companyPlanFilter === 'componentized' ? 'コンポーネント形式' : companyPlanFilter === 'favorite' ? 'お気に入り' : 'すべて'}）`
                        }
                      </p>
                      {companyPlans.length === 0 && (
                        <button onClick={() => setShowCompanyForm(true)} className="button">
                          作成する
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredPlans.map((plan) => (
                      <BusinessPlanCard
                        key={plan.id}
                        plan={plan}
                        onEdit={() => handleEditCompanyPlan(plan)}
                        onDelete={() => handleDeleteCompanyPlan(plan.id)}
                        type="company"
                        onToggleFavorite={handleToggleCompanyPlanFavorite}
                      />
                    ))
                  )}
                </div>
              );
            })()
          )}
        </div>

        {/* 管理モーダル */}
        {showCompanyPlanManagement && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCompanyPlanManagement(false);
              setSelectedPlanIds(new Set());
              setEditingPlanId(null);
              setEditingPlanTitle('');
            }
          }}
          >
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '0',
              maxWidth: '900px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUp 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
            >
              {/* ヘッダー */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 28px',
                borderBottom: '1px solid #E5E7EB',
                backgroundColor: '#F9FAFB',
              }}>
                <div>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    margin: 0,
                    color: '#111827',
                    marginBottom: '4px',
                  }}>
                    事業計画の管理
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    margin: 0,
                  }}>
                    {companyPlans.length}件の事業計画
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCompanyPlanManagement(false);
                    setSelectedPlanIds(new Set());
                    setEditingPlanId(null);
                    setEditingPlanTitle('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#6B7280',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                    e.currentTarget.style.color = '#111827';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6B7280';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* コンテンツエリア */}
              <div style={{
                padding: '24px 28px',
                overflowY: 'auto',
                flex: 1,
              }}>

                {/* 一括操作 */}
                <div style={{
                  marginBottom: '20px',
                  padding: '16px 20px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedPlanIds.size === companyPlans.length && companyPlans.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlanIds(new Set(companyPlans.map(p => p.id)));
                          } else {
                            setSelectedPlanIds(new Set());
                          }
                        }}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#4A90E2',
                        }}
                      />
                      <span style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#374151',
                      }}>
                        すべて選択
                      </span>
                      {selectedPlanIds.size > 0 && (
                        <span style={{
                          fontSize: '13px',
                          color: '#6B7280',
                          marginLeft: '8px',
                        }}>
                          ({selectedPlanIds.size}件選択中)
                        </span>
                      )}
                    </div>
                    {selectedPlanIds.size > 0 && (
                      <button
                        onClick={async () => {
                          if (!confirm(`選択した${selectedPlanIds.size}件の事業計画を削除しますか？\n\nこの操作は取り消せません。`)) {
                            return;
                          }
                          
                          try {
                            if (!db) return;
                            const dbInstance = db;
                            
                            const deletePromises = Array.from(selectedPlanIds).map(planId => 
                              deleteDoc(doc(dbInstance, 'companyBusinessPlan', planId))
                            );
                            
                            await Promise.all(deletePromises);
                            
                            alert(`${selectedPlanIds.size}件の事業計画を削除しました。`);
                            setSelectedPlanIds(new Set());
                            loadPlans();
                          } catch (error) {
                            console.error('一括削除エラー:', error);
                            alert('削除に失敗しました');
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#EF4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#DC2626';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#EF4444';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        選択した項目を削除
                      </button>
                    )}
                  </div>
                </div>

                {/* 事業計画一覧 */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  {companyPlans.map((plan, index) => {
                    const isComponentized = (plan as any).pagesBySubMenu && 
                      typeof (plan as any).pagesBySubMenu === 'object' && 
                      Object.keys((plan as any).pagesBySubMenu).length > 0 &&
                      Object.values((plan as any).pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
                    
                    const isSelected = selectedPlanIds.has(plan.id);
                    const isEditing = editingPlanId === plan.id;
                    
                    return (
                      <div
                        key={plan.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, plan.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, plan.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, plan.id)}
                        style={{
                          padding: '20px',
                          backgroundColor: isSelected ? '#EFF6FF' : '#fff',
                          borderRadius: '12px',
                          border: `1px solid ${
                            isSelected ? '#3B82F6' : 
                            dragOverPlanId === plan.id ? '#4A90E2' : 
                            draggedPlanId === plan.id ? '#9CA3AF' : 
                            '#E5E7EB'
                          }`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          transition: draggedPlanId === plan.id ? 'none' : 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 
                                     dragOverPlanId === plan.id ? '0 8px 16px rgba(74, 144, 226, 0.2)' :
                                     '0 1px 3px rgba(0, 0, 0, 0.05)',
                          cursor: draggedPlanId === plan.id ? 'grabbing' : 'grab',
                          opacity: draggedPlanId === plan.id ? 0.5 : 1,
                          transform: dragOverPlanId === plan.id ? 'translateY(-2px)' : 'translateY(0)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected && draggedPlanId !== plan.id) {
                            e.currentTarget.style.borderColor = '#D1D5DB';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected && draggedPlanId !== plan.id) {
                            e.currentTarget.style.borderColor = '#E5E7EB';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSelected = new Set(selectedPlanIds);
                            if (e.target.checked) {
                              newSelected.add(plan.id);
                            } else {
                              newSelected.delete(plan.id);
                            }
                            setSelectedPlanIds(newSelected);
                          }}
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: '#4A90E2',
                          }}
                        />
                      
                        {isEditing ? (
                          <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={editingPlanTitle}
                              onChange={(e) => setEditingPlanTitle(e.target.value)}
                              style={{
                                flex: 1,
                                padding: '10px 14px',
                                border: '2px solid #4A90E2',
                                borderRadius: '8px',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSavePlanTitle(plan.id);
                                } else if (e.key === 'Escape') {
                                  setEditingPlanId(null);
                                  setEditingPlanTitle('');
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleSavePlanTitle(plan.id)}
                              style={{
                                padding: '10px 18px',
                                backgroundColor: '#10B981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#059669';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#10B981';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              保存
                            </button>
                            <button
                              onClick={() => {
                                setEditingPlanId(null);
                                setEditingPlanTitle('');
                              }}
                              style={{
                                padding: '10px 18px',
                                backgroundColor: '#6B7280',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#4B5563';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#6B7280';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              キャンセル
                            </button>
                          </div>
                        ) : (
                          <>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '17px',
                                fontWeight: 600,
                                color: '#111827',
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                              }}>
                                {plan.title}
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  backgroundColor: isComponentized ? '#E0E7FF' : '#F3F4F6',
                                  color: isComponentized ? '#4F46E5' : '#6B7280',
                                }}>
                                  {isComponentized ? 'コンポーネント形式' : '固定ページ形式'}
                                </span>
                              </div>
                              <div style={{
                                fontSize: '11px',
                                color: '#6B7280',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                whiteSpace: 'nowrap',
                                flexWrap: 'nowrap',
                              }}>
                                {plan.createdAt && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    作成: {new Date(plan.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                                {plan.updatedAt && plan.updatedAt.getTime() !== plan.createdAt?.getTime() && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                      <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    更新: {new Date(plan.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {/* ドラッグハンドル */}
                              <div
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  handleDragStart(e, plan.id);
                                }}
                                style={{
                                  padding: '8px',
                                  color: '#9CA3AF',
                                  cursor: draggedPlanId === plan.id ? 'grabbing' : 'grab',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '6px',
                                  transition: 'all 0.2s ease',
                                  userSelect: 'none',
                                }}
                                onMouseEnter={(e) => {
                                  if (draggedPlanId !== plan.id) {
                                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                                    e.currentTarget.style.color = '#374151';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (draggedPlanId !== plan.id) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#9CA3AF';
                                  }
                                }}
                                title="ドラッグして順番を変更"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="9" cy="12" r="1"></circle>
                                  <circle cx="9" cy="5" r="1"></circle>
                                  <circle cx="9" cy="19" r="1"></circle>
                                  <circle cx="15" cy="12" r="1"></circle>
                                  <circle cx="15" cy="5" r="1"></circle>
                                  <circle cx="15" cy="19" r="1"></circle>
                                </svg>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingPlanId(plan.id);
                                  setEditingPlanTitle(plan.title);
                                }}
                                style={{
                                  padding: '8px',
                                  backgroundColor: '#F9FAFB',
                                  color: '#374151',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '36px',
                                  height: '36px',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                                  e.currentTarget.style.borderColor = '#9CA3AF';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                                  e.currentTarget.style.borderColor = '#D1D5DB';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                                title="名前を編集"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`事業計画「${plan.title}」を削除しますか？\n\nこの操作は取り消せません。`)) {
                                    return;
                                  }
                                  
                                  try {
                                    if (!db) return;
                                    await deleteDoc(doc(db, 'companyBusinessPlan', plan.id));
                                    alert('事業計画を削除しました。');
                                    loadPlans();
                                    const newSelected = new Set(selectedPlanIds);
                                    newSelected.delete(plan.id);
                                    setSelectedPlanIds(newSelected);
                                  } catch (error) {
                                    console.error('削除エラー:', error);
                                    alert('削除に失敗しました');
                                  }
                                }}
                                style={{
                                  padding: '8px',
                                  backgroundColor: '#FEF2F2',
                                  color: '#EF4444',
                                  border: '1px solid #FECACA',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '36px',
                                  height: '36px',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#FEE2E2';
                                  e.currentTarget.style.borderColor = '#FCA5A5';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#FEF2F2';
                                  e.currentTarget.style.borderColor = '#FECACA';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                                title="削除"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* アニメーション用のスタイル */}
        <style dangerouslySetInnerHTML={{ __html: modalStyles }} />

        {/* 事業企画セクション */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ marginBottom: '4px' }}>事業企画</h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-light)' }}>
                各事業の具体的なサービス内容の事業計画を管理します
              </p>
            </div>
            {!showProjectForm && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {(projects.length > 0 || SPECIAL_SERVICES.length > 0) && (
                  <button
                    onClick={() => {
                      setShowProjectManagement(!showProjectManagement);
                      setEditingProjectId(null);
                      setEditingProjectName('');
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: showProjectManagement ? '#4B5563' : '#6B7280',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!showProjectManagement) {
                        e.currentTarget.style.backgroundColor = '#4B5563';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!showProjectManagement) {
                        e.currentTarget.style.backgroundColor = '#6B7280';
                      }
                    }}
                  >
                    {showProjectManagement ? '管理を終了' : '管理'}
                  </button>
                )}
              <button
                onClick={() => {
                  setEditingProject(null);
                  setShowProjectForm(true);
                }}
                className="button"
              >
                新しい事業企画を作成
              </button>
              </div>
            )}
          </div>

          {showProjectForm && (
            <BusinessProjectForm
              project={editingProject || undefined}
              onSave={handleProjectFormClose}
              onCancel={handleProjectFormClose}
            />
          )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: showProjectForm ? '24px' : '0' }}>
              {/* 特別なサービス（自社開発・自社サービス事業など） */}
              {SPECIAL_SERVICES.filter((service) => {
                // 特定の事業計画フィルターが選択されている場合
                if (selectedPlanFilterIds.size > 0) {
                  const fixedServiceData = projects.find(p => (p as any).serviceId === service.id && (p as any).isFixed);
                  const serviceLinkedPlanIds = fixedServiceData ? ((fixedServiceData as any).linkedPlanIds || []) : (fixedServiceLinkedPlanIds[service.id] || []);
                  // 選択された事業計画にリンクしている場合のみ表示
                  return serviceLinkedPlanIds.some((planId: string) => selectedPlanFilterIds.has(planId));
                }
                
                // フィルターが選択されていない場合はすべて表示
                return true;
              }).map((service, index) => {
                const fixedServiceData = projects.find(p => (p as any).serviceId === service.id && (p as any).isFixed);
                const serviceLinkedPlanIds = fixedServiceData ? ((fixedServiceData as any).linkedPlanIds || []) : (fixedServiceLinkedPlanIds[service.id] || []);
                const isEditingFixedService = editingFixedServiceId === service.id;
                const displayName = fixedServiceData?.name || service.name;
                const displayDescription = fixedServiceData?.description || service.description;
                
                return (
              <div
                key={service.id}
                className="card"
                    onClick={(e) => {
                      // 管理モード時や編集・リンク設定ボタンクリック時は遷移しない
                      if (showProjectManagement || (e.target as HTMLElement).closest('.fixed-service-management-buttons')) {
                        return;
                      }
                  if (service.hasConcepts) {
                    router.push(`/business-plan/services/${service.id}`);
                  } else {
                    router.push(`/business-plan/services/${service.id}`);
                  }
                }}
                style={{
                      cursor: showProjectManagement ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  padding: '24px',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                      if (!showProjectManagement) {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                }}
                onMouseLeave={(e) => {
                      if (!showProjectManagement) {
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                      }
                }}
              >
                    {showProjectManagement && (
                      <div className="fixed-service-management-buttons" style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProjectModalId(`fixed-${service.id}`);
                              setEditingProjectModalName(displayName);
                              setEditingProjectModalDescription(displayDescription);
                              setEditingProjectModalLinkPlanIds(new Set(serviceLinkedPlanIds));
                            }}
                            style={{
                              padding: '6px',
                              backgroundColor: '#F3F4F6',
                              color: '#374151',
                              border: '1px solid #D1D5DB',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                            }}
                            title="編集"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    <div style={{ marginBottom: '12px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: 600, color: 'var(--color-text)' }}>
                        {index + 1}. {displayName}
                </h3>
                <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                        {displayDescription}
                      </p>
                    </div>
                    {/* リンクしている事業計画の表示 */}
                    {serviceLinkedPlanIds.length > 0 && (
                      <div style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: '#F3F4F6', borderRadius: '6px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginBottom: '4px', fontWeight: 500 }}>
                          リンクしている事業計画:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {serviceLinkedPlanIds.map((planId: string) => {
                            const linkedPlan = companyPlans.find(p => p.id === planId);
                            if (!linkedPlan) return null;
                            
                            // コンポーネント形式かどうかを判定
                            const pagesBySubMenu = (linkedPlan as any).pagesBySubMenu;
                            const isComponentized = pagesBySubMenu && 
                              typeof pagesBySubMenu === 'object' && 
                              Object.keys(pagesBySubMenu).length > 0 &&
                              Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
                            
                            // 固定ページ形式とコンポーネント形式で色を変更
                            const tagColor = isComponentized ? '#4A90E2' : '#D97706';
                            const tagBackgroundColor = isComponentized ? '#E3F2FD' : '#FEF3C7';
                            
                            return (
                              <span
                                key={planId}
                                style={{
                                  fontSize: '11px',
                                  color: tagColor,
                                  backgroundColor: tagBackgroundColor,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontWeight: 500,
                                }}
                              >
                                {linkedPlan.title}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>
                    {service.hasConcepts 
                      ? `${serviceCounts[service.id] || 0} 件の構想`
                      : `${serviceCounts[service.id] || 0} 件の事業計画`}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500 }}>
                    詳細を見る →
                  </span>
                </div>
              </div>
                );
              })}

            {/* 動的に追加された事業企画（管理モード時はisFixed: trueのプロジェクトも表示） */}
            {(showProjectManagement 
              ? allProjects.filter(p => {
                  // SPECIAL_SERVICESに含まれるserviceIdを持つisFixed: trueのプロジェクトは除外
                  const isFixed = (p as any).isFixed;
                  const serviceId = (p as any).serviceId;
                  if (isFixed && serviceId && SPECIAL_SERVICES.some(s => s.id === serviceId)) {
                    return false;
                  }
                  return true;
                })
              : projects
            ).filter((project) => {
              // 特定の事業計画フィルターが選択されている場合
              if (selectedPlanFilterIds.size > 0) {
                const projectLinkedPlanIds = (project as any).linkedPlanIds || [];
                // 選択された事業計画にリンクしている場合のみ表示
                return projectLinkedPlanIds.some((planId: string) => selectedPlanFilterIds.has(planId));
              }
              
              // フィルターが選択されていない場合はすべて表示
              return true;
            }).map((project, index) => {
              const isFixedProject = (project as any).isFixed;
              const serviceId = (project as any).serviceId;
              const coverData = serviceId ? projectCoverData[serviceId] : null;
              
              return (
              <div
                key={project.id}
                className="card"
                onClick={(e) => {
                  // 管理モード時や編集・削除ボタンクリック時は遷移しない
                  if (showProjectManagement || (e.target as HTMLElement).closest('.project-management-buttons')) {
                    return;
                  }
                  // serviceIdがある場合は構想一覧ページに遷移、ない場合は従来のプロジェクトページに遷移
                  if (serviceId) {
                    router.push(`/business-plan/services/${serviceId}`);
                  } else {
                  router.push(`/business-plan/project/${project.id}`);
                  }
                }}
                style={{
                  cursor: showProjectManagement ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!showProjectManagement) {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showProjectManagement) {
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {/* カバーエリア（コンポーネント形式の構想がある場合） */}
                {coverData && (
                  <div style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    borderBottom: '1px solid #E5E7EB',
                  }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                      position: 'relative',
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        padding: '12px',
                        backgroundColor: '#FFFFFF',
                        transform: 'scale(0.25)',
                        transformOrigin: 'top left',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}>
                        <div style={{
                          width: '400%',
                          height: '400%',
                        }}>
                          <DynamicPage
                            pageId={coverData.id}
                            pageNumber={coverData.pageNumber}
                            title={coverData.title}
                            content={coverData.content}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div style={{ padding: '24px' }}>
                {showProjectManagement && (
                  <div className="project-management-buttons" style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                          setEditingProjectModalId(project.id);
                          setEditingProjectModalName(project.name || '');
                          setEditingProjectModalDescription(project.description || '');
                          setEditingProjectModalLinkPlanIds(new Set((project as any).linkedPlanIds || []));
                    }}
                    style={{
                          padding: '6px',
                          backgroundColor: '#F3F4F6',
                          color: '#374151',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                      cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                    }}
                      title="編集"
                  >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    style={{
                          padding: '6px',
                          backgroundColor: '#EF4444',
                          color: '#fff',
                      border: 'none',
                          borderRadius: '6px',
                      cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                    }}
                      title="削除"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                  </button>
                  </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: 'var(--color-text)', 
                    flex: 1,
                    minWidth: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: '1.4',
                  }}>
                    {SPECIAL_SERVICES.length + index + 1}. {project.name}
                  </h3>
                </div>
                <p style={{ 
                  marginBottom: '12px', 
                  fontSize: '13px', 
                  color: 'var(--color-text-light)', 
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {project.description}
                </p>
                {/* リンクしている事業計画の表示 */}
                {(project as any).linkedPlanIds && Array.isArray((project as any).linkedPlanIds) && (project as any).linkedPlanIds.length > 0 && (
                  <div style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: '#F3F4F6', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginBottom: '4px', fontWeight: 500 }}>
                      リンクしている事業計画:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(project as any).linkedPlanIds.map((planId: string) => {
                        const linkedPlan = companyPlans.find(p => p.id === planId);
                        if (!linkedPlan) return null;
                        
                        // コンポーネント形式かどうかを判定
                        const pagesBySubMenu = (linkedPlan as any).pagesBySubMenu;
                        const isComponentized = pagesBySubMenu && 
                          typeof pagesBySubMenu === 'object' && 
                          Object.keys(pagesBySubMenu).length > 0 &&
                          Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
                        
                        // 固定ページ形式とコンポーネント形式で色を変更
                        const tagColor = isComponentized ? '#4A90E2' : '#D97706';
                        const tagBackgroundColor = isComponentized ? '#E3F2FD' : '#FEF3C7';
                        
                        return (
                          <span
                            key={planId}
                            style={{
                              fontSize: '11px',
                              color: tagColor,
                              backgroundColor: tagBackgroundColor,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 500,
                            }}
                          >
                            {linkedPlan.title}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>
                    {serviceCounts[project.serviceId] || 0} 件の事業計画
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500 }}>
                    詳細を見る →
                  </span>
                </div>
                </div>
              </div>
              );
            })}
          </div>

          {projects.length === 0 && SPECIAL_SERVICES.length === 0 && !showProjectForm && (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
                事業企画がまだありません。新しい事業企画を作成してください。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 編集・リンク設定モーダル */}
      {editingProjectModalId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingProjectModalId(null);
              setEditingProjectModalName('');
              setEditingProjectModalDescription('');
              setEditingProjectModalLinkPlanIds(new Set());
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '0',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '24px 24px 20px 24px',
              borderBottom: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#4A90E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  事業企画の編集
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingProjectModalId(null);
                  setEditingProjectModalName('');
                  setEditingProjectModalDescription('');
                  setEditingProjectModalLinkPlanIds(new Set());
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px 8px',
                  lineHeight: 1,
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6B7280';
                }}
              >
                ×
              </button>
            </div>
            
            {/* コンテンツ */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* 名前と説明の編集 */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span>事業企画名</span>
                  <span style={{ color: '#EF4444', fontSize: '12px' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editingProjectModalName}
                  onChange={(e) => setEditingProjectModalName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: '#fff',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#4A90E2';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="事業企画名を入力"
                />
              </div>
              
              <div style={{ marginBottom: '28px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: '10px',
                }}>
                  説明
                </label>
                <textarea
                  value={editingProjectModalDescription}
                  onChange={(e) => setEditingProjectModalDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '120px',
                    transition: 'all 0.2s',
                    backgroundColor: '#fff',
                    fontFamily: 'inherit',
                    lineHeight: '1.6',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#4A90E2';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="説明を入力"
                />
              </div>
              
              {/* リンク設定 */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#374151', 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  <span>リンクする事業計画</span>
                </label>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px', 
                  maxHeight: '320px', 
                  overflowY: 'auto',
                  padding: '4px',
                }}>
                  {companyPlans.map((plan) => {
                    const isSelected = editingProjectModalLinkPlanIds.has(plan.id);
                    const isComponentized = (plan as any).pagesBySubMenu && 
                      typeof (plan as any).pagesBySubMenu === 'object' && 
                      Object.keys((plan as any).pagesBySubMenu).length > 0;
                    return (
                      <label
                        key={plan.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '14px',
                          padding: '16px',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? '#EFF6FF' : '#F9FAFB',
                          cursor: 'pointer',
                          border: `2px solid ${isSelected ? '#4A90E2' : '#E5E7EB'}`,
                          transition: 'all 0.2s',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = '#F3F4F6';
                            e.currentTarget.style.borderColor = '#D1D5DB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = '#F9FAFB';
                            e.currentTarget.style.borderColor = '#E5E7EB';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSet = new Set(editingProjectModalLinkPlanIds);
                            if (e.target.checked) {
                              newSet.add(plan.id);
                            } else {
                              newSet.delete(plan.id);
                            }
                            setEditingProjectModalLinkPlanIds(newSet);
                          }}
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            cursor: 'pointer',
                            marginTop: '2px',
                            accentColor: '#4A90E2',
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '15px', 
                            fontWeight: 600, 
                            color: '#111827',
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            {plan.title}
                            {isComponentized && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                color: '#10B981',
                                backgroundColor: '#D1FAE5',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}>
                                コンポーネント化版
                              </span>
                            )}
                          </div>
                          {plan.description && (
                            <div style={{ 
                              fontSize: '13px', 
                              color: '#6B7280', 
                              marginTop: '4px',
                              lineHeight: '1.5',
                            }}>
                              {plan.description}
                            </div>
                          )}
                          {plan.createdAt && (
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#9CA3AF', 
                              marginTop: '6px',
                            }}>
                              作成日: {new Date(plan.createdAt).toLocaleDateString('ja-JP')}
                              {plan.updatedAt && plan.updatedAt.getTime() !== plan.createdAt?.getTime() && (
                                <> | 更新日: {new Date(plan.updatedAt).toLocaleDateString('ja-JP')}</>
                              )}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#4A90E2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                      </label>
                    );
                  })}
                  {companyPlans.length === 0 && (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '60px 20px', 
                      color: '#9CA3AF',
                      fontSize: '14px',
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', opacity: 0.5 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      <div>事業計画がまだありません</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* フッター */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end', 
              padding: '20px 24px',
              borderTop: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
            }}>
              <button
                onClick={() => {
                  setEditingProjectModalId(null);
                  setEditingProjectModalName('');
                  setEditingProjectModalDescription('');
                  setEditingProjectModalLinkPlanIds(new Set());
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#fff',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#9CA3AF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
              >
                キャンセル
              </button>
              <button
                onClick={async () => {
                  if (!editingProjectModalName.trim()) {
                    alert('事業企画名を入力してください。');
                    return;
                  }
                  
                  if (editingProjectModalId?.startsWith('fixed-')) {
                    // 固定サービスの場合
                    const serviceId = editingProjectModalId.replace('fixed-', '');
                    await handleSaveFixedServiceWithLinks(serviceId);
                  } else if (editingProjectModalId) {
                    // 動的プロジェクトの場合
                    await handleSaveProjectWithLinks(editingProjectModalId);
                  }
                }}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#4A90E2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563EB';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4A90E2';
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 事業計画フィルターモーダル */}
      {showPlanFilterModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPlanFilterModal(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827' }}>
                事業計画でフィルター
              </h3>
              <button
                onClick={() => setShowPlanFilterModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <p style={{ marginBottom: '20px', fontSize: '14px', color: '#6B7280' }}>
              表示する事業企画を、リンクしている事業計画で絞り込みます。
            </p>
            
            <div style={{ marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
              {companyPlans.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0' }}>
                  事業計画がまだ作成されていません
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {companyPlans.map((plan) => {
                    const isSelected = selectedPlanFilterIds.has(plan.id);
                    const pagesBySubMenu = (plan as any).pagesBySubMenu;
                    const isComponentized = pagesBySubMenu && 
                      typeof pagesBySubMenu === 'object' && 
                      Object.keys(pagesBySubMenu).length > 0 &&
                      Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
                    
                    return (
                      <label
                        key={plan.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          borderRadius: '8px',
                          border: `2px solid ${isSelected ? '#3B82F6' : '#E5E7EB'}`,
                          backgroundColor: isSelected ? '#EFF6FF' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#9CA3AF';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#E5E7EB';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSet = new Set(selectedPlanFilterIds);
                            if (e.target.checked) {
                              newSet.add(plan.id);
                            } else {
                              newSet.delete(plan.id);
                            }
                            setSelectedPlanFilterIds(newSet);
                          }}
                          style={{
                            width: '18px',
                            height: '18px',
                            marginRight: '12px',
                            cursor: 'pointer',
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                              {plan.title}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 500,
                                color: isComponentized ? '#4A90E2' : '#D97706',
                                backgroundColor: isComponentized ? '#E3F2FD' : '#FEF3C7',
                              }}
                            >
                              {isComponentized ? 'コンポーネント形式' : '固定ページ形式'}
                            </span>
                          </div>
                          {plan.description && (
                            <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', lineHeight: '1.5' }}>
                              {plan.description}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
              <button
                onClick={() => {
                  setSelectedPlanFilterIds(new Set());
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                disabled={selectedPlanFilterIds.size === 0}
                onMouseEnter={(e) => {
                  if (selectedPlanFilterIds.size > 0) {
                    e.currentTarget.style.backgroundColor = '#E5E7EB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPlanFilterIds.size > 0) {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }
                }}
              >
                すべて解除
              </button>
              <button
                onClick={() => setShowPlanFilterModal(false)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#3B82F6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563EB';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3B82F6';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                適用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* リンク設定モーダル（旧、削除予定） */}
      {showLinkModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLinkModal(null);
              setEditingProjectLinkPlanIds(new Set());
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
                事業計画とのリンク設定
              </h3>
              <button
                onClick={() => {
                  setShowLinkModal(null);
                  setEditingProjectLinkPlanIds(new Set());
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px 8px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '12px' }}>
                この事業企画にリンクする事業計画を選択してください：
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                {companyPlans.map((plan) => {
                  const isSelected = editingProjectLinkPlanIds.has(plan.id);
                  return (
                    <label
                      key={plan.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? '#E3F2FD' : '#F9FAFB',
                        cursor: 'pointer',
                        border: `2px solid ${isSelected ? '#4A90E2' : 'transparent'}`,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#F3F4F6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#F9FAFB';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSet = new Set(editingProjectLinkPlanIds);
                          if (e.target.checked) {
                            newSet.add(plan.id);
                          } else {
                            newSet.delete(plan.id);
                          }
                          setEditingProjectLinkPlanIds(newSet);
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a' }}>
                          {plan.title}
                        </div>
                        {plan.description && (
                          <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '4px' }}>
                            {plan.description}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
                {companyPlans.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-light)' }}>
                    事業計画がまだありません
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowLinkModal(null);
                  setEditingProjectLinkPlanIds(new Set());
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  if (showLinkModal) {
                    handleSaveProjectLinks(showLinkModal);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4A90E2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

