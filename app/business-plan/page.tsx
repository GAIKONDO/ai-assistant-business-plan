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
  const [showCompanyPlanManagement, setShowCompanyPlanManagement] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPlanTitle, setEditingPlanTitle] = useState<string>('');
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
      
      // クライアント側でソート
      plansData.sort((a, b) => {
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
    if (!auth?.currentUser || !db) return;

    const userId = auth.currentUser.uid; // 変数に保存してTypeScriptエラーを回避

    try {
      const startTime = performance.now();
      const counts: { [key: string]: number } = {};
      
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
      if (conceptsSnapshot) {
        conceptsSnapshot.forEach((doc) => {
          const data = doc.data();
          const serviceId = data.serviceId;
          const conceptId = data.conceptId;
          // 固定構想と同じconceptIdを持つ構想は除外
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
          }
        });
      }
      
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
      }
      
      const endTime = performance.now();
      console.log(`カウント処理完了: ${(endTime - startTime).toFixed(2)}ms`);
      setServiceCounts(counts);
    } catch (error) {
      console.error('カウント読み込みエラー:', error);
      // エラーが発生しても空のオブジェクトを設定して続行
      setServiceCounts({});
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
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {companyPlans.length > 0 && (
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {companyPlans.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px', gridColumn: '1 / -1' }}>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '14px', marginBottom: '16px' }}>
                    会社本体の事業計画がまだ作成されていません
                  </p>
                  <button onClick={() => setShowCompanyForm(true)} className="button">
                    作成する
                  </button>
                </div>
              ) : (
                companyPlans.map((plan) => (
                  <BusinessPlanCard
                    key={plan.id}
                    plan={plan}
                    onEdit={() => handleEditCompanyPlan(plan)}
                    onDelete={() => handleDeleteCompanyPlan(plan.id)}
                    type="company"
                  />
                ))
              )}
            </div>
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
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
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  margin: 0,
                  color: '#111827',
                }}>
                  事業計画の管理
                </h3>
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
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6B7280',
                    padding: '4px 8px',
                  }}
                >
                  ×
                </button>
              </div>

              {/* 一括操作 */}
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
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
                      }}
                    />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#374151',
                    }}>
                      すべて選択 ({selectedPlanIds.size}件選択中)
                    </span>
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
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    >
                      選択した項目を削除 ({selectedPlanIds.size}件)
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
                {companyPlans.map((plan) => {
                  const isComponentized = (plan as any).pagesBySubMenu && 
                    typeof (plan as any).pagesBySubMenu === 'object' && 
                    Object.keys((plan as any).pagesBySubMenu).length > 0 &&
                    Object.values((plan as any).pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
                  
                  const isSelected = selectedPlanIds.has(plan.id);
                  const isEditing = editingPlanId === plan.id;
                  
                  return (
                    <div
                      key={plan.id}
                      style={{
                        padding: '16px',
                        backgroundColor: isSelected ? '#EFF6FF' : '#fff',
                        borderRadius: '8px',
                        border: `2px solid ${isSelected ? '#3B82F6' : '#E5E7EB'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
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
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                        }}
                      />
                      
                      {isEditing ? (
                        <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={editingPlanTitle}
                            onChange={(e) => setEditingPlanTitle(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              border: '1px solid #D1D5DB',
                              borderRadius: '6px',
                              fontSize: '14px',
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
                              padding: '8px 16px',
                              backgroundColor: '#10B981',
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
                          <button
                            onClick={() => {
                              setEditingPlanId(null);
                              setEditingPlanTitle('');
                            }}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#6B7280',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 500,
                            }}
                          >
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#111827',
                              marginBottom: '4px',
                            }}>
                              {plan.title}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#6B7280',
                            }}>
                              {isComponentized ? 'コンポーネント化版' : '固定ページ形式'} | 
                              {plan.createdAt && ` 作成日: ${new Date(plan.createdAt).toLocaleDateString('ja-JP')}`}
                              {plan.updatedAt && plan.updatedAt.getTime() !== plan.createdAt?.getTime() && 
                                ` | 更新日: ${new Date(plan.updatedAt).toLocaleDateString('ja-JP')}`
                              }
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setEditingPlanId(plan.id);
                                setEditingPlanTitle(plan.title);
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
                              title="名前を編集"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: showProjectForm ? '24px' : '0' }}>
              {/* 特別なサービス（自社開発・自社サービス事業など） */}
              {SPECIAL_SERVICES.map((service, index) => {
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
                  padding: '32px',
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
                            return linkedPlan ? (
                              <span
                                key={planId}
                                style={{
                                  fontSize: '11px',
                                  color: '#4A90E2',
                                  backgroundColor: '#E3F2FD',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontWeight: 500,
                                }}
                              >
                                {linkedPlan.title}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border-color)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                    {service.hasConcepts 
                      ? `${serviceCounts[service.id] || 0} 件の構想`
                      : `${serviceCounts[service.id] || 0} 件の事業計画`}
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: 500 }}>
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
            ).map((project, index) => {
              const isFixedProject = (project as any).isFixed;
              return (
              <div
                key={project.id}
                className="card"
                onClick={(e) => {
                  // 管理モード時や編集・削除ボタンクリック時は遷移しない
                  if (showProjectManagement || (e.target as HTMLElement).closest('.project-management-buttons')) {
                    return;
                  }
                  router.push(`/business-plan/project/${project.id}`);
                }}
                style={{
                  cursor: showProjectManagement ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  padding: '32px',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', flex: 1 }}>
                    {SPECIAL_SERVICES.length + index + 1}. {project.name}
                  </h3>
                </div>
                <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
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
                        return linkedPlan ? (
                          <span
                            key={planId}
                            style={{
                              fontSize: '11px',
                              color: '#4A90E2',
                              backgroundColor: '#E3F2FD',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: 500,
                            }}
                          >
                            {linkedPlan.title}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border-color)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                    {serviceCounts[project.serviceId] || 0} 件の事業計画
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: 500 }}>
                    詳細を見る →
                  </span>
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

