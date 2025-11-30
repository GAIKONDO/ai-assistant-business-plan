'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
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
  { id: 'component-test', name: '5. コンポーネント化test', description: 'コンポーネント化のテスト用事業企画', hasConcepts: true },
];

// 固定構想の定義（重複カウントを防ぐため）
const FIXED_CONCEPTS: { [key: string]: Array<{ id: string; name: string; description: string }> } = {
  'own-service': [
    { id: 'maternity-support', name: '出産支援パーソナルApp', description: '出産前後のママとパパをサポートするパーソナルアプリケーション' },
    { id: 'care-support', name: '介護支援パーソナルApp', description: '介護を必要とする方とその家族をサポートするパーソナルアプリケーション' },
  ],
  'component-test': [
    { id: 'test-concept', name: 'テスト構想', description: 'コンポーネント化のテスト用構想' },
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
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
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
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
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
      
      const projectsData: (BusinessProjectData & { id: string; createdAt?: Date; updatedAt?: Date })[] = [];
      projectsSnapshot.forEach((doc) => {
        projectsData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as BusinessProjectData & { id: string; createdAt?: Date; updatedAt?: Date });
      });
      
      // クライアント側でソート
      projectsData.sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime; // 降順
      });
      
      console.log('読み込まれた事業企画数:', projectsData.length);
      console.log('事業企画データ:', projectsData.map(p => ({ id: p.id, name: p.name, serviceId: p.serviceId })));
      setProjects(projectsData);
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
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
                          
                          const deletePromises = Array.from(selectedPlanIds).map(planId => 
                            deleteDoc(doc(db, 'companyBusinessPlan', planId))
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
                                padding: '6px 12px',
                                backgroundColor: '#F3F4F6',
                                color: '#374151',
                                border: '1px solid #D1D5DB',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                              }}
                            >
                              名前を編集
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
                                padding: '6px 12px',
                                backgroundColor: '#EF4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                              }}
                            >
                              削除
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
              <button
                onClick={() => {
                  setEditingProject(null);
                  setShowProjectForm(true);
                }}
                className="button"
              >
                新しい事業企画を作成
              </button>
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
              {SPECIAL_SERVICES.map((service, index) => (
              <div
                key={service.id}
                className="card"
                onClick={() => {
                  if (service.hasConcepts) {
                    router.push(`/business-plan/services/${service.id}`);
                  } else {
                    router.push(`/business-plan/services/${service.id}`);
                  }
                }}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: '32px',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: 600, color: 'var(--color-text)' }}>
                  {index + 1}. {service.name}
                </h3>
                <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                  {service.description}
                </p>
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
            ))}

            {/* 動的に追加された事業企画 */}
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="card"
                onClick={() => router.push(`/business-plan/project/${project.id}`)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: '32px',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', flex: 1 }}>
                    {SPECIAL_SERVICES.length + index + 1}. {project.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProject(project);
                    }}
                    style={{
                        background: 'transparent',
                      border: 'none',
                        color: 'rgba(107, 114, 128, 0.4)',
                      cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        opacity: 0.6,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-light)';
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.background = 'rgba(31, 41, 51, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(107, 114, 128, 0.4)';
                        e.currentTarget.style.opacity = '0.6';
                        e.currentTarget.style.background = 'transparent';
                    }}
                      title="編集"
                  >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        background: 'transparent',
                      border: 'none',
                        color: 'rgba(220, 53, 69, 0.4)',
                      cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        opacity: 0.6,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#dc3545';
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.background = 'rgba(220, 53, 69, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(220, 53, 69, 0.4)';
                        e.currentTarget.style.opacity = '0.6';
                        e.currentTarget.style.background = 'transparent';
                    }}
                      title="削除"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                  </button>
                  </div>
                </div>
                <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                  {project.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border-color)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                    {serviceCounts[project.serviceId] || 0} 件の事業計画
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: 500 }}>
                    詳細を見る →
                  </span>
                </div>
              </div>
            ))}
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
    </Layout>
  );
}

