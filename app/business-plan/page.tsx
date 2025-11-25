'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Layout from '@/components/Layout';
import BusinessPlanForm, { BusinessPlanData } from '@/components/BusinessPlanForm';
import BusinessPlanCard from '@/components/BusinessPlanCard';
import BusinessProjectForm, { BusinessProjectData } from '@/components/BusinessProjectForm';

const SPECIAL_SERVICES = [
  { id: 'own-service', name: '自社サービス事業', description: '自社開発のサービス事業に関する計画', hasConcepts: true },
  { id: 'ai-dx', name: 'AI駆動開発・DX支援事業', description: 'AI技術を活用した開発・DX支援に関する計画', hasConcepts: true },
  { id: 'consulting', name: '業務コンサル・プロセス可視化・改善事業', description: '業務コンサルティングとプロセス改善に関する計画', hasConcepts: true },
  { id: 'education-training', name: '人材育成・教育・AI導入ルール設計事業', description: '人材育成、教育、AI導入ルール設計に関する計画', hasConcepts: true },
];

export default function BusinessPlanPage() {
  const router = useRouter();
  const [companyPlan, setCompanyPlan] = useState<(BusinessPlanData & { id: string; createdAt?: Date; updatedAt?: Date }) | null>(null);
  const [projects, setProjects] = useState<(BusinessProjectData & { id: string; createdAt?: Date; updatedAt?: Date })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<(BusinessPlanData & { id?: string }) | null>(null);
  const [editingProject, setEditingProject] = useState<(BusinessProjectData & { id?: string }) | null>(null);
  const [serviceCounts, setServiceCounts] = useState<{ [key: string]: number }>({});


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
      
      if (!companySnapshot.empty) {
        const doc = companySnapshot.docs[0];
        setCompanyPlan({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as BusinessPlanData & { id: string; createdAt?: Date; updatedAt?: Date });
      } else {
        setCompanyPlan(null);
      }
    } catch (error) {
      console.error('読み込みエラー:', error);
      setCompanyPlan(null);
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
      // 並列でクエリを実行
      const [ownServiceConceptsResult, aiDxConceptsResult, consultingConceptsResult, educationTrainingConceptsResult, plansSnapshot] = await Promise.all([
        // 自社サービス事業の構想数を取得
        (async () => {
          try {
            const conceptsQuery = query(
              collection(db, 'concepts'),
              where('userId', '==', userId),
              where('serviceId', '==', 'own-service')
            );
            const conceptsSnapshot = await getDocs(conceptsQuery);
            return 2 + conceptsSnapshot.size; // 固定構想2つ + 動的構想
          } catch (error) {
            console.error('構想カウントエラー:', error);
            return 2;
          }
        })(),
        // AI駆動開発・DX支援事業の構想数を取得
        (async () => {
          try {
            const conceptsQuery = query(
              collection(db, 'concepts'),
              where('userId', '==', userId),
              where('serviceId', '==', 'ai-dx')
            );
            const conceptsSnapshot = await getDocs(conceptsQuery);
            return 2 + conceptsSnapshot.size; // 固定構想2つ + 動的構想
          } catch (error) {
            console.error('構想カウントエラー:', error);
            return 2;
          }
        })(),
        // 業務コンサル・プロセス可視化・改善事業の構想数を取得
        (async () => {
          try {
            const conceptsQuery = query(
              collection(db, 'concepts'),
              where('userId', '==', userId),
              where('serviceId', '==', 'consulting')
            );
            const conceptsSnapshot = await getDocs(conceptsQuery);
            return 2 + conceptsSnapshot.size; // 固定構想2つ + 動的構想
          } catch (error) {
            console.error('構想カウントエラー:', error);
            return 2;
          }
        })(),
        // 人材育成・教育・AI導入ルール設計事業の構想数を取得
        (async () => {
          try {
            const conceptsQuery = query(
              collection(db, 'concepts'),
              where('userId', '==', userId),
              where('serviceId', '==', 'education-training')
            );
            const conceptsSnapshot = await getDocs(conceptsQuery);
            return 3 + conceptsSnapshot.size; // 固定構想3つ + 動的構想
          } catch (error) {
            console.error('構想カウントエラー:', error);
            return 3;
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

      // 自社サービス事業、AI駆動開発・DX支援事業、業務コンサル・プロセス可視化・改善事業、人材育成・教育・AI導入ルール設計事業の構想数を設定
      counts['own-service'] = ownServiceConceptsResult;
      counts['ai-dx'] = aiDxConceptsResult;
      counts['consulting'] = consultingConceptsResult;
      counts['education-training'] = educationTrainingConceptsResult;

      // 事業計画をサービスIDごとに集計
      if (plansSnapshot) {
        plansSnapshot.forEach((doc: any) => {
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

  const handleDeleteCompanyPlan = async () => {
    if (!companyPlan || !db) return;
    if (!confirm('会社本体の事業計画を削除しますか？')) return;

    try {
      await deleteDoc(doc(db, 'companyBusinessPlan', companyPlan.id));
      loadPlans();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
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

  const handleEditCompanyPlan = () => {
    setEditingPlan(companyPlan);
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
              <button
                onClick={() => {
                  setEditingPlan(companyPlan);
                  setShowCompanyForm(true);
                }}
                className="button"
              >
                {companyPlan ? '編集' : '作成'}
              </button>
            )}
          </div>

          {showCompanyForm ? (
            <BusinessPlanForm
              plan={editingPlan || undefined}
              onSave={handleFormClose}
              onCancel={handleFormClose}
              type="company"
            />
          ) : companyPlan ? (
            <BusinessPlanCard
              plan={companyPlan}
              onEdit={handleEditCompanyPlan}
              onDelete={handleDeleteCompanyPlan}
              type="company"
            />
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <p style={{ color: 'var(--color-text-light)', fontSize: '14px', marginBottom: '16px' }}>
                会社本体の事業計画がまだ作成されていません
              </p>
              <button onClick={() => setShowCompanyForm(true)} className="button">
                作成する
              </button>
            </div>
          )}
        </div>

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
              {/* 特別なサービス（自社サービス事業など） */}
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
                onClick={() => router.push(`/business-plan/services/${project.serviceId}`)}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProject(project);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-light)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '4px 8px',
                      marginLeft: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-light)';
                    }}
                  >
                    編集
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '4px 8px',
                      marginLeft: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    削除
                  </button>
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

