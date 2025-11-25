'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import Layout from '@/components/Layout';
import BusinessPlanForm, { BusinessPlanData } from '@/components/BusinessPlanForm';
import BusinessPlanCard from '@/components/BusinessPlanCard';
import ConceptSubMenu, { SUB_MENU_ITEMS } from '@/components/ConceptSubMenu';


const SERVICE_NAMES: { [key: string]: string } = {
  'own-service': '自社サービス事業',
  'ai-dx': 'AI駆動開発・DX支援事業',
  'consulting': '業務コンサル・プロセス可視化・改善事業',
  'education-training': '人材育成・教育・AI導入ルール設計事業',
};

export default function PlanPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const serviceId = params.serviceId as string;
  const conceptId = params.conceptId as string;
  const serviceName = SERVICE_NAMES[serviceId] || '事業企画';

  const [conceptName, setConceptName] = useState<string>('');
  const [plans, setPlans] = useState<(BusinessPlanData & { id: string; createdAt?: Date; updatedAt?: Date })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<(BusinessPlanData & { id?: string }) | null>(null);
  
  // 現在のサブメニュー項目を判定
  const getCurrentSubMenu = () => {
    const pathSegments = pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    return SUB_MENU_ITEMS.find(item => item.path === lastSegment)?.id || 'plan';
  };
  
  const currentSubMenu = getCurrentSubMenu();

  useEffect(() => {
    if (auth?.currentUser && serviceId && conceptId) {
      loadConcept();
      loadPlans();
    }
  }, [auth?.currentUser, serviceId, conceptId]);

  const loadConcept = async () => {
    if (!serviceId || !conceptId) return;

    // 固定構想の定義
    const fixedConcepts: { [key: string]: { [key: string]: string } } = {
      'own-service': {
        'maternity-support': '出産支援パーソナルアプリケーション',
        'care-support': '介護支援パーソナルアプリケーション',
      },
      'ai-dx': {
        'medical-dx': '医療法人向けDX',
        'sme-dx': '中小企業向けDX',
      },
      'consulting': {
        'sme-process': '中小企業向け業務プロセス可視化・改善',
        'medical-care-process': '医療・介護施設向け業務プロセス可視化・改善',
      },
      'education-training': {
        'corporate-ai-training': '企業向けAI人材育成・教育',
        'ai-governance': 'AI導入ルール設計・ガバナンス支援',
        'sme-ai-education': '中小企業向けAI導入支援・教育',
      },
    };

    // 固定構想の場合は直接設定
    if (fixedConcepts[serviceId]?.[conceptId]) {
      setConceptName(fixedConcepts[serviceId][conceptId]);
      return;
    }

    // 動的構想の場合はFirestoreから取得
    if (!auth?.currentUser || !db) return;

    try {
      const conceptsQuery = query(
        collection(db, 'concepts'),
        where('userId', '==', auth.currentUser.uid),
        where('serviceId', '==', serviceId),
        where('conceptId', '==', conceptId)
      );
      const conceptsSnapshot = await getDocs(conceptsQuery);
      if (!conceptsSnapshot.empty) {
        const conceptDoc = conceptsSnapshot.docs[0];
        setConceptName(conceptDoc.data().name || conceptId);
      } else {
        setConceptName(conceptId);
      }
    } catch (error) {
      console.error('構想読み込みエラー:', error);
      setConceptName(conceptId);
    }
  };

  const loadPlans = async () => {
    if (!auth?.currentUser || !db || !serviceId || !conceptId) return;

    try {
      setLoading(true);
      let plansSnapshot;
      
      try {
        // orderBy付きで試行
        const plansQuery = query(
          collection(db, 'servicePlans'),
          where('userId', '==', auth.currentUser.uid),
          where('serviceId', '==', serviceId),
          where('conceptId', '==', conceptId),
          orderBy('createdAt', 'desc')
        );
        plansSnapshot = await getDocs(plansQuery);
      } catch (error: any) {
        // インデックスがまだ作成中の場合は、orderByなしで再試行
        if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
          console.log('インデックス作成中。orderByなしで読み込みます。');
          const plansQueryWithoutOrder = query(
            collection(db, 'servicePlans'),
            where('userId', '==', auth.currentUser.uid),
            where('serviceId', '==', serviceId),
            where('conceptId', '==', conceptId)
          );
          plansSnapshot = await getDocs(plansQueryWithoutOrder);
        } else {
          throw error;
        }
      }
      
      const plansData: (BusinessPlanData & { id: string; createdAt?: Date; updatedAt?: Date })[] = [];
      plansSnapshot.forEach((doc) => {
        plansData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as BusinessPlanData & { id: string; createdAt?: Date; updatedAt?: Date });
      });
      
      // クライアント側でソート（インデックスが完成していない場合のフォールバック）
      plansData.sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime; // 降順
      });
      
      setPlans(plansData);
    } catch (error: any) {
      console.error('読み込みエラー:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!db) return;
    if (!confirm('この事業計画を削除しますか？')) return;

    try {
      await deleteDoc(doc(db, 'servicePlans', id));
      loadPlans();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const handleEditPlan = (plan: BusinessPlanData & { id: string }) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPlan(null);
    loadPlans();
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
      <div style={{ display: 'flex', gap: '32px' }}>
        {/* サブメニュー */}
        <ConceptSubMenu serviceId={serviceId} conceptId={conceptId} currentSubMenuId={currentSubMenu} />

        {/* メインコンテンツ */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => router.push(`/business-plan/services/${serviceId}`)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '16px',
                padding: 0,
              }}
            >
              ← {serviceName}に戻る
            </button>
            <h2 style={{ marginBottom: '4px' }}>{conceptName}</h2>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-light)' }}>
              事業計画
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>事業計画</h3>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="button">
                新しい事業計画を作成
              </button>
            )}
          </div>

          {showForm ? (
            <BusinessPlanForm
              plan={editingPlan || undefined}
              onSave={handleFormClose}
              onCancel={handleFormClose}
              type="project"
              serviceId={serviceId}
              conceptId={conceptId}
            />
          ) : null}

          {plans.length === 0 && !showForm ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
                事業計画がまだありません。新しい事業計画を作成してください。
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '24px' }}>
              {plans.map((plan) => (
                <BusinessPlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={() => handleEditPlan(plan)}
                  onDelete={() => handleDeletePlan(plan.id)}
                  type="project"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

