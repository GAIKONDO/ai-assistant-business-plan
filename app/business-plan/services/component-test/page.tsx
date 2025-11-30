'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Layout from '@/components/Layout';
import ConceptForm, { ConceptData } from '@/components/ConceptForm';

const FIXED_CONCEPTS = [
  { id: 'test-concept', name: 'テスト構想', description: 'コンポーネント化のテスト用構想' },
];

export default function ComponentTestPage() {
  const router = useRouter();
  const [concepts, setConcepts] = useState<(ConceptData & { id: string; createdAt?: Date; updatedAt?: Date })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [editingConcept, setEditingConcept] = useState<(ConceptData & { id?: string }) | null>(null);
  const [conceptCounts, setConceptCounts] = useState<{ [key: string]: number }>({});
  const [authReady, setAuthReady] = useState(false);

  const loadConcepts = useCallback(async () => {
    if (!auth?.currentUser || !db) return;

    try {
      setLoading(true);
      let conceptsSnapshot;
      
      try {
        const conceptsQuery = query(
          collection(db, 'concepts'),
          where('userId', '==', auth.currentUser.uid),
          where('serviceId', '==', 'component-test'),
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
            where('serviceId', '==', 'component-test')
          );
          conceptsSnapshot = await getDocs(conceptsQueryWithoutOrder);
        } else {
          throw error;
        }
      }

      const conceptsData = conceptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as (ConceptData & { id: string; createdAt?: Date; updatedAt?: Date })[];

      setConcepts(conceptsData);

      // 各構想の事業計画数を取得
      const counts: { [key: string]: number } = {};
      for (const concept of [...FIXED_CONCEPTS, ...conceptsData]) {
        try {
          const plansQuery = query(
            collection(db, 'servicePlans'),
            where('userId', '==', auth.currentUser.uid),
            where('serviceId', '==', 'component-test'),
            where('conceptId', '==', concept.id)
          );
          const plansSnapshot = await getDocs(plansQuery);
          counts[concept.id] = plansSnapshot.size;
        } catch (error) {
          console.error(`構想 ${concept.id} の事業計画数の取得エラー:`, error);
          counts[concept.id] = 0;
        }
      }
      setConceptCounts(counts);
    } catch (error) {
      console.error('構想の読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthReady(!!user);
      if (user) {
        loadConcepts();
      }
    });

    return () => unsubscribe();
  }, [loadConcepts]);

  const handleConceptFormClose = () => {
    setShowConceptForm(false);
    setEditingConcept(null);
    loadConcepts();
  };

  const handleDeleteConcept = async (conceptId: string) => {
    if (!auth?.currentUser || !db) return;
    if (!confirm('この構想を削除しますか？')) return;

    try {
      await deleteDoc(doc(db, 'concepts', conceptId));
      loadConcepts();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <Layout>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' }}>
            5. コンポーネント化test
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
            コンポーネント化のテスト用事業企画
          </p>
        </div>

        {!authReady ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>認証情報を確認中...</p>
          </div>
        ) : loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>読み込み中...</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditingConcept(null);
                  setShowConceptForm(true);
                }}
                className="button"
              >
                + 新しい構想を追加
              </button>
            </div>

            {showConceptForm && (
              <ConceptForm
                concept={editingConcept || undefined}
                serviceId="component-test"
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
                  onClick={() => router.push(`/business-plan/services/component-test/${concept.id}`)}
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
                  onClick={() => router.push(`/business-plan/services/component-test/${concept.conceptId}`)}
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
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    display: 'flex',
                    gap: '8px',
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingConcept(concept);
                        setShowConceptForm(true);
                      }}
                      className="button"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: 'var(--color-primary)',
                        color: '#fff',
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
                        handleDeleteConcept(concept.id);
                      }}
                      className="button"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: '#ef4444',
                        color: '#fff',
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
                  <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: 600, color: 'var(--color-text)' }}>
                    {FIXED_CONCEPTS.length + index + 1}. {concept.name}
                  </h3>
                  <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                    {concept.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border-color)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                      {conceptCounts[concept.conceptId || concept.id] || 0} 件の事業計画
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
          </>
        )}
      </div>
    </Layout>
  );
}

