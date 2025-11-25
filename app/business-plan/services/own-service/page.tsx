'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import Layout from '@/components/Layout';
import ConceptForm, { ConceptData } from '@/components/ConceptForm';

const FIXED_CONCEPTS = [
  { id: 'maternity-support', name: '出産支援パーソナルアプリケーション', description: '出産前後のママとパパをサポートするパーソナルアプリケーション' },
  { id: 'care-support', name: '介護支援パーソナルアプリケーション', description: '介護を必要とする方とその家族をサポートするパーソナルアプリケーション' },
];

export default function OwnServicePage() {
  const router = useRouter();
  const [concepts, setConcepts] = useState<(ConceptData & { id: string; createdAt?: Date; updatedAt?: Date })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [editingConcept, setEditingConcept] = useState<(ConceptData & { id?: string }) | null>(null);
  const [conceptCounts, setConceptCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (auth?.currentUser) {
      loadConcepts();
    }
  }, [auth?.currentUser]);

  const loadConcepts = async () => {
    if (!auth?.currentUser || !db) return;

    try {
      setLoading(true);
      let conceptsSnapshot;
      
      try {
        const conceptsQuery = query(
          collection(db, 'concepts'),
          where('userId', '==', auth.currentUser.uid),
          where('serviceId', '==', 'own-service'),
          orderBy('createdAt', 'desc')
        );
        conceptsSnapshot = await getDocs(conceptsQuery);
      } catch (error: any) {
        // インデックスがまだ作成中の場合は、orderByなしで再試行
        if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
          console.log('インデックス作成中。orderByなしで読み込みます。');
          const conceptsQueryWithoutOrder = query(
            collection(db, 'concepts'),
            where('userId', '==', auth.currentUser.uid),
            where('serviceId', '==', 'own-service')
          );
          conceptsSnapshot = await getDocs(conceptsQueryWithoutOrder);
        } else {
          throw error;
        }
      }
      
      const conceptsData: (ConceptData & { id: string; createdAt?: Date; updatedAt?: Date })[] = [];
      conceptsSnapshot.forEach((doc) => {
        conceptsData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as ConceptData & { id: string; createdAt?: Date; updatedAt?: Date });
      });
      
      // クライアント側でソート
      conceptsData.sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime; // 降順
      });
      
      setConcepts(conceptsData);
      loadConceptCounts(conceptsData);
    } catch (error) {
      console.error('読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConceptCounts = async (conceptsList: (ConceptData & { id: string })[]) => {
    if (!auth?.currentUser || !db) return;

    try {
      const counts: { [key: string]: number } = {};
      
      // 固定構想のカウント
      for (const concept of FIXED_CONCEPTS) {
        const plansQuery = query(
          collection(db, 'servicePlans'),
          where('userId', '==', auth.currentUser.uid),
          where('serviceId', '==', 'own-service'),
          where('conceptId', '==', concept.id)
        );
        const snapshot = await getDocs(plansQuery);
        counts[concept.id] = snapshot.size;
      }

      // 動的に追加された構想のカウント
      for (const concept of conceptsList) {
        const plansQuery = query(
          collection(db, 'servicePlans'),
          where('userId', '==', auth.currentUser.uid),
          where('serviceId', '==', 'own-service'),
          where('conceptId', '==', concept.conceptId)
        );
        const snapshot = await getDocs(plansQuery);
        counts[concept.conceptId] = snapshot.size;
      }
      
      setConceptCounts(counts);
    } catch (error) {
      console.error('カウント読み込みエラー:', error);
    }
  };

  const handleDeleteConcept = async (id: string) => {
    if (!db) return;
    if (!confirm('この構想を削除しますか？関連する事業計画も削除されます。')) return;

    try {
      await deleteDoc(doc(db, 'concepts', id));
      loadConcepts();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const handleEditConcept = (concept: ConceptData & { id: string }) => {
    setEditingConcept(concept);
    setShowConceptForm(true);
  };

  const handleConceptFormClose = () => {
    setShowConceptForm(false);
    setEditingConcept(null);
    loadConcepts();
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
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => router.push('/business-plan')}
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
            ← 事業企画一覧に戻る
          </button>
          <h2 style={{ marginBottom: '4px' }}>自社サービス事業</h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-light)' }}>
            自社開発のサービス事業に関する構想を管理します
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>構想</h3>
          {!showConceptForm && (
            <button
              onClick={() => {
                setEditingConcept(null);
                setShowConceptForm(true);
              }}
              className="button"
            >
              新しい構想を作成
            </button>
          )}
        </div>

        {showConceptForm && (
          <ConceptForm
            concept={editingConcept || undefined}
            serviceId="own-service"
            onSave={handleConceptFormClose}
            onCancel={handleConceptFormClose}
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: showConceptForm ? '24px' : '0' }}>
          {/* 固定構想 */}
          {FIXED_CONCEPTS.map((concept, index) => (
            <div
              key={concept.id}
              className="card"
              onClick={() => router.push(`/business-plan/services/own-service/${concept.id}`)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: '32px',
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
                {index + 1}. {concept.name}
              </h3>
              <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                {concept.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border-color)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                  {conceptCounts[concept.id] || 0} 件の事業計画
                </span>
                <span style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: 500 }}>
                  詳細を見る →
                </span>
              </div>
            </div>
          ))}

          {/* 動的に追加された構想 */}
          {concepts.map((concept, index) => (
            <div
              key={concept.id}
              className="card"
              onClick={() => router.push(`/business-plan/services/own-service/${concept.conceptId}`)}
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
                  {FIXED_CONCEPTS.length + index + 1}. {concept.name}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditConcept(concept);
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
                    handleDeleteConcept(concept.id);
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
                {concept.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border-color)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                  {conceptCounts[concept.conceptId] || 0} 件の事業計画
                </span>
                <span style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: 500 }}>
                  詳細を見る →
                </span>
              </div>
            </div>
          ))}
        </div>

        {FIXED_CONCEPTS.length === 0 && concepts.length === 0 && !showConceptForm && (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
              構想がまだありません。新しい構想を作成してください。
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

