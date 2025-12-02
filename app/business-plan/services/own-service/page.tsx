'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import Layout from '@/components/Layout';
import ConceptForm, { ConceptData } from '@/components/ConceptForm';
import dynamic from 'next/dynamic';

// DynamicPageを動的にインポート（SSRを無効化）
const DynamicPage = dynamic(
  () => import('@/components/pages/component-test/test-concept/DynamicPage'),
  { ssr: false }
);

// 固定構想の定義
// 注意: -componentized版は動的に作成されるため、固定構想からは除外
const FIXED_CONCEPTS = [
  { id: 'maternity-support', name: '出産支援パーソナルApp', description: '出産前後のママとパパをサポートするパーソナルアプリケーション' },
  { id: 'care-support', name: '介護支援パーソナルApp', description: '介護を必要とする方とその家族をサポートするパーソナルアプリケーション' },
  // -componentized版は動的に作成されるため、固定構想からは除外
];

export default function OwnServicePage() {
  const router = useRouter();
  const [concepts, setConcepts] = useState<(ConceptData & { id: string; createdAt?: Date; updatedAt?: Date })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [editingConcept, setEditingConcept] = useState<(ConceptData & { id?: string }) | null>(null);
  const [conceptCounts, setConceptCounts] = useState<{ [key: string]: number }>({});
  const [conceptPageCounts, setConceptPageCounts] = useState<{ [key: string]: number }>({});
  const [fixedConceptDates, setFixedConceptDates] = useState<{ [conceptId: string]: { createdAt?: Date; updatedAt?: Date; isFavorite?: boolean } }>({});
  const [conceptFilter, setConceptFilter] = useState<'all' | 'fixed' | 'componentized' | 'favorite'>('all');
  const [showConceptManagement, setShowConceptManagement] = useState(false);
  const [selectedConceptIds, setSelectedConceptIds] = useState<Set<string>>(new Set());
  const [editingConceptId, setEditingConceptId] = useState<string | null>(null);
  const [editingConceptTitle, setEditingConceptTitle] = useState<string>('');
  const [authReady, setAuthReady] = useState(false);
  const [conceptCoverData, setConceptCoverData] = useState<{ [conceptId: string]: { id: string; pageNumber: number; title: string; content: string } | null }>({});

  const loadConcepts = useCallback(async () => {
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
      
      // 固定構想と同じconceptIdを持つ構想を除外
      const fixedConceptIds = new Set(FIXED_CONCEPTS.map(c => c.id));
      const filteredConcepts = conceptsData.filter(concept => !fixedConceptIds.has(concept.conceptId));
      
      // 固定構想の日付情報とお気に入り情報を取得
      const fixedDatesMap: { [conceptId: string]: { createdAt?: Date; updatedAt?: Date; isFavorite?: boolean } } = {};
      for (const fixedConcept of FIXED_CONCEPTS) {
        const fixedConceptDoc = conceptsData.find(c => c.conceptId === fixedConcept.id);
        if (fixedConceptDoc) {
          fixedDatesMap[fixedConcept.id] = {
            createdAt: fixedConceptDoc.createdAt,
            updatedAt: fixedConceptDoc.updatedAt,
            isFavorite: (fixedConceptDoc as any).isFavorite || false,
          };
        } else {
          // Firestoreに存在しない場合は、Firestoreから直接取得を試みる
          try {
            if (db && auth?.currentUser) {
              const conceptQuery = query(
                collection(db, 'concepts'),
                where('userId', '==', auth.currentUser.uid),
                where('serviceId', '==', 'own-service'),
                where('conceptId', '==', fixedConcept.id)
              );
              const conceptSnapshot = await getDocs(conceptQuery);
              if (!conceptSnapshot.empty) {
                const docData = conceptSnapshot.docs[0].data();
                fixedDatesMap[fixedConcept.id] = {
                  createdAt: docData.createdAt?.toDate(),
                  updatedAt: docData.updatedAt?.toDate(),
                  isFavorite: docData.isFavorite || false,
                };
              }
            }
          } catch (error) {
            console.error('固定構想のお気に入り情報取得エラー:', error);
          }
        }
      }
      setFixedConceptDates(fixedDatesMap);
      
      // コンポーネント形式の構想のカバーデータを取得
      const coverDataMap: { [conceptId: string]: { id: string; pageNumber: number; title: string; content: string } | null } = {};
      
      filteredConcepts.forEach((concept) => {
        const pagesBySubMenu = concept.pagesBySubMenu;
        const isComponentized = pagesBySubMenu && 
          typeof pagesBySubMenu === 'object' && 
          Object.keys(pagesBySubMenu).length > 0 &&
          Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
        
        if (isComponentized) {
          try {
            const pageOrderBySubMenu = concept.pageOrderBySubMenu;
            let targetSubMenuId = 'overview';
            let pages = pagesBySubMenu[targetSubMenuId];
            
            // overviewが存在しない場合は最初のサブメニューを使用
            if (!pages || !Array.isArray(pages) || pages.length === 0) {
              const subMenuKeys = Object.keys(pagesBySubMenu);
              if (subMenuKeys.length > 0) {
                targetSubMenuId = subMenuKeys[0];
                pages = pagesBySubMenu[targetSubMenuId];
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
                  coverDataMap[concept.conceptId] = {
                    id: targetPage.id,
                    pageNumber: targetPage.pageNumber || 1,
                    title: targetPage.title || '',
                    content: targetPage.content || '',
                  };
                }
              }
            }
          } catch (error) {
            console.error(`構想 ${concept.conceptId} のカバー取得エラー:`, error);
          }
        }
      });
      
      setConceptCoverData(coverDataMap);
      setConcepts(filteredConcepts);
      loadConceptCounts(filteredConcepts);
    } catch (error) {
      console.error('読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 認証状態を監視
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthReady(true);
      if (!user) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 認証が完了したときにデータを読み込む
  useEffect(() => {
    if (authReady && auth?.currentUser) {
      loadConcepts();
    }
  }, [authReady, loadConcepts]);

  const loadConceptCounts = async (conceptsList: (ConceptData & { id: string })[]) => {
    if (!auth?.currentUser || !db) return;

    try {
      const counts: { [key: string]: number } = {};
      const pageCounts: { [key: string]: number } = {};
      
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
        // 固定構想は固定ページ形式なので、ページ数は0
        pageCounts[concept.id] = 0;
      }

      // 動的に追加された構想のカウントとページ数
      for (const concept of conceptsList) {
        const plansQuery = query(
          collection(db, 'servicePlans'),
          where('userId', '==', auth.currentUser.uid),
          where('serviceId', '==', 'own-service'),
          where('conceptId', '==', concept.conceptId)
        );
        const snapshot = await getDocs(plansQuery);
        counts[concept.conceptId] = snapshot.size;
        
        // ページ数を計算（コンポーネント形式の場合）
        const pagesBySubMenu = concept.pagesBySubMenu;
        const isComponentized = pagesBySubMenu && 
          typeof pagesBySubMenu === 'object' && 
          Object.keys(pagesBySubMenu).length > 0 &&
          Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
        
        if (isComponentized && pagesBySubMenu) {
          let totalPages = 0;
          Object.values(pagesBySubMenu).forEach((pages: any) => {
            if (Array.isArray(pages)) {
              totalPages += pages.length;
            }
          });
          pageCounts[concept.conceptId] = totalPages;
        } else {
          // 固定ページ形式の場合は0
          pageCounts[concept.conceptId] = 0;
        }
      }
      
      setConceptCounts(counts);
      setConceptPageCounts(pageCounts);
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

  const handleSaveConceptTitle = async (conceptId: string) => {
    if (!db || !editingConceptTitle.trim()) return;
    
    try {
      const conceptDoc = doc(db, 'concepts', conceptId);
      await updateDoc(conceptDoc, {
        name: editingConceptTitle.trim(),
        updatedAt: serverTimestamp(),
      });
      setEditingConceptId(null);
      setEditingConceptTitle('');
      loadConcepts();
    } catch (error) {
      console.error('タイトル更新エラー:', error);
      alert('タイトルの更新に失敗しました');
    }
  };

  const handleToggleFavorite = async (conceptId: string, currentFavorite: boolean, isFixedConcept: boolean = false) => {
    if (!db || !auth?.currentUser) return;
    
    try {
      if (isFixedConcept) {
        // 固定構想の場合、conceptIdで検索して更新または作成
        const conceptQuery = query(
          collection(db, 'concepts'),
          where('userId', '==', auth.currentUser.uid),
          where('serviceId', '==', 'own-service'),
          where('conceptId', '==', conceptId)
        );
        const conceptSnapshot = await getDocs(conceptQuery);
        
        if (!conceptSnapshot.empty) {
          // 既存のドキュメントを更新
          const conceptDoc = doc(db, 'concepts', conceptSnapshot.docs[0].id);
          await updateDoc(conceptDoc, {
            isFavorite: !currentFavorite,
            updatedAt: serverTimestamp(),
          });
        } else {
          // 新規作成
          await addDoc(collection(db, 'concepts'), {
            userId: auth.currentUser.uid,
            serviceId: 'own-service',
            conceptId: conceptId,
            name: FIXED_CONCEPTS.find(c => c.id === conceptId)?.name || '',
            description: FIXED_CONCEPTS.find(c => c.id === conceptId)?.description || '',
            isFavorite: !currentFavorite,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        // 固定構想の日付情報を再取得
        const fixedDatesMap: { [conceptId: string]: { createdAt?: Date; updatedAt?: Date; isFavorite?: boolean } } = {};
        for (const fixedConcept of FIXED_CONCEPTS) {
          const conceptQuery2 = query(
            collection(db, 'concepts'),
            where('userId', '==', auth.currentUser.uid),
            where('serviceId', '==', 'own-service'),
            where('conceptId', '==', fixedConcept.id)
          );
          const conceptSnapshot2 = await getDocs(conceptQuery2);
          if (!conceptSnapshot2.empty) {
            const docData = conceptSnapshot2.docs[0].data();
            fixedDatesMap[fixedConcept.id] = {
              createdAt: docData.createdAt?.toDate(),
              updatedAt: docData.updatedAt?.toDate(),
              isFavorite: docData.isFavorite || false,
            };
          }
        }
        setFixedConceptDates(fixedDatesMap);
      } else {
        // 動的構想の場合
        const conceptDoc = doc(db, 'concepts', conceptId);
        await updateDoc(conceptDoc, {
          isFavorite: !currentFavorite,
          updatedAt: serverTimestamp(),
        });
        loadConcepts();
      }
    } catch (error) {
      console.error('お気に入り更新エラー:', error);
      alert('お気に入りの更新に失敗しました');
    }
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
          <h2 style={{ marginBottom: '4px' }}>自社開発・自社サービス事業</h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-light)' }}>
            自社開発のサービス事業に関する構想を管理します
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>構想</h3>
          {!showConceptForm && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setConceptFilter('all')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: conceptFilter === 'all' ? '#4B5563' : '#F3F4F6',
                    color: conceptFilter === 'all' ? '#fff' : '#374151',
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
                  onClick={() => setConceptFilter('fixed')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: conceptFilter === 'fixed' ? '#4B5563' : '#F3F4F6',
                    color: conceptFilter === 'fixed' ? '#fff' : '#374151',
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
                  onClick={() => setConceptFilter('componentized')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: conceptFilter === 'componentized' ? '#4B5563' : '#F3F4F6',
                    color: conceptFilter === 'componentized' ? '#fff' : '#374151',
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
                  onClick={() => setConceptFilter('favorite')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: conceptFilter === 'favorite' ? '#4B5563' : '#F3F4F6',
                    color: conceptFilter === 'favorite' ? '#fff' : '#374151',
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={conceptFilter === 'favorite' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  お気に入り
                </button>
              </div>
              <button
                onClick={() => setShowConceptManagement(!showConceptManagement)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: showConceptManagement ? '#4B5563' : '#6B7280',
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
                  e.currentTarget.style.backgroundColor = showConceptManagement ? '#4B5563' : '#6B7280';
                }}
              >
                管理
              </button>
              <button
                onClick={() => {
                  setEditingConcept(null);
                  setShowConceptForm(true);
                }}
                className="button"
              >
                新しい構想を作成
              </button>
            </div>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: showConceptForm ? '24px' : '0' }}>
          {/* 固定構想 */}
          {FIXED_CONCEPTS.filter((concept) => {
            if (conceptFilter === 'all') return true;
            if (conceptFilter === 'favorite') {
              return fixedConceptDates[concept.id]?.isFavorite === true;
            }
            if (conceptFilter === 'fixed') return true; // 固定構想は常に固定ページ形式
            if (conceptFilter === 'componentized') return false; // 固定構想はコンポーネント形式ではない
            return true;
          }).map((concept, index) => (
            <div
              key={concept.id}
              className="card"
              onClick={() => router.push(`/business-plan/services/own-service/${concept.id}`)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: '24px',
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(concept.id, fixedConceptDates[concept.id]?.isFavorite || false);
                }}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill={fixedConceptDates[concept.id]?.isFavorite ? '#FCD34D' : 'none'} 
                  stroke={fixedConceptDates[concept.id]?.isFavorite ? '#FCD34D' : '#9CA3AF'} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{
                    transition: 'all 0.2s ease',
                  }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
              <h3 style={{
                marginBottom: '10px',
                paddingRight: '30px',
                fontSize: '16px', 
                fontWeight: 600, 
                color: 'var(--color-text)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.4',
              }}>
                {index + 1}. {concept.name}
              </h3>
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
                {concept.description}
              </p>
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>
                      {conceptPageCounts[concept.id] || 0} ページ
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500 }}>
                      詳細を見る →
                    </span>
                  </div>
                  {fixedConceptDates[concept.id]?.createdAt && (
                    <div style={{
                      fontSize: '10px',
                      color: 'var(--color-text-light)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      作成日: {new Date(fixedConceptDates[concept.id].createdAt!).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {fixedConceptDates[concept.id]?.updatedAt && (() => {
                      try {
                        const conceptDates = fixedConceptDates[concept.id];
                        if (conceptDates?.createdAt && conceptDates?.updatedAt) {
                          const createdAtDate = conceptDates.createdAt instanceof Date ? conceptDates.createdAt : new Date(conceptDates.createdAt);
                          const updatedAtDate = conceptDates.updatedAt instanceof Date ? conceptDates.updatedAt : new Date(conceptDates.updatedAt);
                          if (!isNaN(createdAtDate.getTime()) && !isNaN(updatedAtDate.getTime()) && updatedAtDate.getTime() !== createdAtDate.getTime()) {
                            return <> | 更新日: {new Date(conceptDates.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</>;
                          }
                        }
                      } catch (e) {
                        // エラーが発生した場合は更新日を表示しない
                      }
                      return null;
                    })()}
                    </div>
                  )}
                </div>
            </div>
          ))}

          {/* 動的に追加された構想 */}
          {concepts.filter((concept) => {
            if (conceptFilter === 'all') return true;
            const pagesBySubMenu = concept.pagesBySubMenu;
            const isComponentized = pagesBySubMenu && 
              typeof pagesBySubMenu === 'object' && 
              Object.keys(pagesBySubMenu).length > 0 &&
              Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
            if (conceptFilter === 'fixed') return !isComponentized;
            if (conceptFilter === 'componentized') return isComponentized;
            return true;
          }).map((concept, index) => {
            const coverData = conceptCoverData[concept.conceptId];
            const isComponentized = concept.pagesBySubMenu && 
              typeof concept.pagesBySubMenu === 'object' && 
              Object.keys(concept.pagesBySubMenu).length > 0 &&
              Object.values(concept.pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
            
            return (
            <div
              key={concept.id}
              className="card"
              onClick={() => router.push(`/business-plan/services/own-service/${concept.conceptId}`)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 0,
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: isComponentized ? '#F0F9FF' : '#FFFFFF', // コンポーネント化版は薄い青、固定版は白
                border: isComponentized ? '1px solid #BFDBFE' : '1px solid var(--color-border-color)', // コンポーネント化版は青い枠線
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
              {/* カバーエリア（コンポーネント形式の場合） */}
              {isComponentized && coverData && (
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
              
              <div style={{ padding: '24px', position: 'relative' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(concept.id, (concept as any).isFavorite || false, false);
                }}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill={(concept as any).isFavorite ? '#FCD34D' : 'none'} 
                  stroke={(concept as any).isFavorite ? '#FCD34D' : '#9CA3AF'} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{
                    transition: 'all 0.2s ease',
                  }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
              <h3 style={{ 
                margin: 0, 
                marginBottom: '10px',
                paddingRight: '30px',
                fontSize: '16px', 
                fontWeight: 600, 
                color: 'var(--color-text)', 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.4',
              }}>
                {FIXED_CONCEPTS.filter((c) => {
                  if (conceptFilter === 'all') return true;
                  if (conceptFilter === 'fixed') return true;
                  if (conceptFilter === 'componentized') return false;
                  if (conceptFilter === 'favorite') return false;
                  return true;
                }).length + index + 1}. {concept.name}
              </h3>
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
                {concept.description}
              </p>
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>
                      {conceptPageCounts[concept.conceptId] || 0} ページ
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500 }}>
                      詳細を見る →
                    </span>
                  </div>
                  {concept.createdAt && (
                    <div style={{
                      fontSize: '10px',
                      color: 'var(--color-text-light)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      作成日: {new Date(concept.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {concept.updatedAt && (() => {
                        try {
                          const createdAtDate = concept.createdAt instanceof Date ? concept.createdAt : new Date(concept.createdAt);
                          const updatedAtDate = concept.updatedAt instanceof Date ? concept.updatedAt : new Date(concept.updatedAt);
                          if (!isNaN(createdAtDate.getTime()) && !isNaN(updatedAtDate.getTime()) && updatedAtDate.getTime() !== createdAtDate.getTime()) {
                            return <> | 更新日: {new Date(concept.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</>;
                          }
                        } catch (e) {
                          // エラーが発生した場合は更新日を表示しない
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {FIXED_CONCEPTS.length === 0 && concepts.length === 0 && !showConceptForm && (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
              構想がまだありません。新しい構想を作成してください。
            </p>
          </div>
        )}
      </div>

      {/* 構想管理モーダル */}
      {showConceptManagement && (
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
            setShowConceptManagement(false);
            setSelectedConceptIds(new Set());
            setEditingConceptId(null);
            setEditingConceptTitle('');
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
                  構想の管理
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  margin: 0,
                }}>
                  {FIXED_CONCEPTS.length + concepts.length}件の構想
                </p>
              </div>
              <button
                onClick={() => {
                  setShowConceptManagement(false);
                  setSelectedConceptIds(new Set());
                  setEditingConceptId(null);
                  setEditingConceptTitle('');
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
                      checked={selectedConceptIds.size === concepts.length && concepts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedConceptIds(new Set(concepts.map(c => c.id)));
                        } else {
                          setSelectedConceptIds(new Set());
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
                    {selectedConceptIds.size > 0 && (
                      <span style={{
                        fontSize: '13px',
                        color: '#6B7280',
                        marginLeft: '8px',
                      }}>
                        ({selectedConceptIds.size}件選択中)
                      </span>
                    )}
                  </div>
                  {selectedConceptIds.size > 0 && (
                    <button
                      onClick={async () => {
                        if (!confirm(`選択した${selectedConceptIds.size}件の構想を削除しますか？\n\nこの操作は取り消せません。`)) {
                          return;
                        }
                        
                        try {
                          if (!db) return;
                          const dbInstance = db;
                          
                          const deletePromises = Array.from(selectedConceptIds).map(conceptId => 
                            deleteDoc(doc(dbInstance, 'concepts', conceptId))
                          );
                          
                          await Promise.all(deletePromises);
                          
                          alert(`${selectedConceptIds.size}件の構想を削除しました。`);
                          setSelectedConceptIds(new Set());
                          loadConcepts();
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

              {/* 構想一覧 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {/* 固定構想 */}
                {FIXED_CONCEPTS.map((concept, index) => {
                  const isSelected = selectedConceptIds.has(concept.id);
                  
                  return (
                    <div
                      key={concept.id}
                      style={{
                        padding: '20px',
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        opacity: 0.6,
                      }}
                    >
                      <input
                        type="checkbox"
                        disabled
                        checked={false}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'not-allowed',
                          accentColor: '#4A90E2',
                        }}
                      />
                      
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
                          {concept.name}
                          <span style={{
                            padding: '4px 10px',
                            backgroundColor: '#F3F4F6',
                            color: '#374151',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}>
                            固定ページ形式
                          </span>
                        </div>
                        {concept.description && (
                          <p style={{
                            fontSize: '14px',
                            color: '#6B7280',
                            margin: 0,
                            marginBottom: '8px',
                          }}>
                            {concept.description}
                          </p>
                        )}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          fontSize: '12px',
                          color: '#9CA3AF',
                        }}>
                          <span>{conceptPageCounts[concept.id] || 0} ページ</span>
                          {fixedConceptDates[concept.id]?.createdAt && (
                            <span>
                              作成日: {new Date(fixedConceptDates[concept.id].createdAt!).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{
                          padding: '8px 14px',
                          backgroundColor: '#F3F4F6',
                          color: '#9CA3AF',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}>
                          固定構想
                        </span>
                      </div>
                    </div>
                  );
                })}
                
                {/* 動的構想 */}
                {concepts.map((concept, index) => {
                  const isComponentized = concept.pagesBySubMenu && 
                    typeof concept.pagesBySubMenu === 'object' && 
                    Object.keys(concept.pagesBySubMenu).length > 0 &&
                    Object.values(concept.pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
                  
                  const isSelected = selectedConceptIds.has(concept.id);
                  const isEditing = editingConceptId === concept.id;
                  
                  return (
                    <div
                      key={concept.id}
                      style={{
                        padding: '20px',
                        backgroundColor: isSelected ? '#EFF6FF' : '#fff',
                        borderRadius: '12px',
                        border: `1px solid ${isSelected ? '#3B82F6' : '#E5E7EB'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#D1D5DB';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSelected = new Set(selectedConceptIds);
                          if (e.target.checked) {
                            newSelected.add(concept.id);
                          } else {
                            newSelected.delete(concept.id);
                          }
                          setSelectedConceptIds(newSelected);
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
                            value={editingConceptTitle}
                            onChange={(e) => setEditingConceptTitle(e.target.value)}
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
                                handleSaveConceptTitle(concept.id);
                              } else if (e.key === 'Escape') {
                                setEditingConceptId(null);
                                setEditingConceptTitle('');
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveConceptTitle(concept.id)}
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
                              setEditingConceptId(null);
                              setEditingConceptTitle('');
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
                              {concept.name}
                              {isComponentized && (
                                <span style={{
                                  padding: '4px 10px',
                                  backgroundColor: '#DBEAFE',
                                  color: '#1E40AF',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                }}>
                                  コンポーネント形式
                                </span>
                              )}
                              {!isComponentized && (
                                <span style={{
                                  padding: '4px 10px',
                                  backgroundColor: '#F3F4F6',
                                  color: '#374151',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                }}>
                                  固定ページ形式
                                </span>
                              )}
                            </div>
                            {concept.description && (
                              <p style={{
                                fontSize: '14px',
                                color: '#6B7280',
                                margin: 0,
                                marginBottom: '8px',
                              }}>
                                {concept.description}
                              </p>
                            )}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              fontSize: '12px',
                              color: '#9CA3AF',
                            }}>
                              <span>{conceptPageCounts[concept.conceptId] || 0} ページ</span>
                              {concept.createdAt && (
                                <span>
                                  作成日: {new Date(concept.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setEditingConceptId(concept.id);
                                setEditingConceptTitle(concept.name);
                              }}
                              style={{
                                padding: '8px 14px',
                                backgroundColor: '#F3F4F6',
                                color: '#374151',
                                border: '1px solid #D1D5DB',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#E5E7EB';
                                e.currentTarget.style.borderColor = '#9CA3AF';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#F3F4F6';
                                e.currentTarget.style.borderColor = '#D1D5DB';
                              }}
                            >
                              編集
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`「${concept.name}」を削除しますか？\n\nこの操作は取り消せません。`)) {
                                  return;
                                }
                                
                                try {
                                  if (!db) return;
                                  await deleteDoc(doc(db, 'concepts', concept.id));
                                  loadConcepts();
                                } catch (error) {
                                  console.error('削除エラー:', error);
                                  alert('削除に失敗しました');
                                }
                              }}
                              style={{
                                padding: '8px 14px',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#FEE2E2';
                                e.currentTarget.style.borderColor = '#FCA5A5';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FEF2F2';
                                e.currentTarget.style.borderColor = '#FECACA';
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
        </div>
      )}
    </Layout>
  );
}

