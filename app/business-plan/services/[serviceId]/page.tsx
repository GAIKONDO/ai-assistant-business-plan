'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
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


const SERVICE_NAMES: { [key: string]: string } = {
  'own-service': '自社開発・自社サービス事業',
  'education-training': 'AI導入ルール設計・人材育成・教育事業',
  'consulting': 'プロセス可視化・業務コンサル事業',
  'ai-dx': 'AI駆動開発・DX支援SI事業',
  'component-test': '5. コンポーネント化test',
};

// 固定構想の定義
// 注意: -componentized版は動的に作成されるため、固定構想からは除外
const FIXED_CONCEPTS: { [key: string]: Array<{ id: string; name: string; description: string }> } = {
  'own-service': [
    { id: 'maternity-support', name: '出産支援パーソナルApp', description: '出産前後のママとパパをサポートするパーソナルアプリケーション' },
    { id: 'care-support', name: '介護支援パーソナルApp', description: '介護を必要とする方とその家族をサポートするパーソナルアプリケーション' },
    // -componentized版は動的に作成されるため、固定構想からは除外
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

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const serviceName = SERVICE_NAMES[serviceId] || '事業企画';
  const fixedConcepts = FIXED_CONCEPTS[serviceId] || [];

  const [concepts, setConcepts] = useState<(ConceptData & { id: string; createdAt?: Date; updatedAt?: Date })[]>([]);
  
  // デバッグ: コンポーネントがレンダリングされているか確認
  useEffect(() => {
    console.log('ServiceDetailPage マウント:', { serviceId, serviceName });
  }, [serviceId, serviceName]);
  const [loading, setLoading] = useState(true);
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [editingConcept, setEditingConcept] = useState<(ConceptData & { id?: string }) | null>(null);
  const [conceptCounts, setConceptCounts] = useState<{ [key: string]: number }>({});
  const [authReady, setAuthReady] = useState(false);
  const [conceptCoverData, setConceptCoverData] = useState<{ [conceptId: string]: { id: string; pageNumber: number; title: string; content: string } | null }>({});

  const loadConcepts = useCallback(async () => {
    console.log('loadConcepts開始:', { serviceId, hasAuth: !!auth?.currentUser, hasDb: !!db });
    if (!auth?.currentUser || !db || !serviceId) {
      console.log('loadConcepts: 条件未満足でスキップ');
      return;
    }

    try {
      setLoading(true);
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
        // インデックスがまだ作成中の場合は、orderByなしで再試行
        if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
          console.log('インデックス作成中。orderByなしで読み込みます。');
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
      const fixedConceptIds = new Set(fixedConcepts.map(c => c.id));
      const filteredConcepts = conceptsData.filter(concept => !fixedConceptIds.has(concept.conceptId));
      
      console.log('loadConcepts: 構想データ取得完了', {
        totalConcepts: conceptsData.length,
        filteredConcepts: filteredConcepts.length,
        filteredConceptIds: filteredConcepts.map(c => c.conceptId),
      });
      
      // コンポーネント形式の構想のカバーデータを取得
      const coverDataMap: { [conceptId: string]: { id: string; pageNumber: number; title: string; content: string } | null } = {};
      
      filteredConcepts.forEach((concept) => {
        const pagesBySubMenu = concept.pagesBySubMenu;
        const isComponentized = pagesBySubMenu && 
          typeof pagesBySubMenu === 'object' && 
          Object.keys(pagesBySubMenu).length > 0 &&
          Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
        
        console.log('構想カバー取得チェック:', {
          conceptId: concept.conceptId,
          conceptName: concept.name,
          hasPagesBySubMenu: !!pagesBySubMenu,
          pagesBySubMenuKeys: pagesBySubMenu ? Object.keys(pagesBySubMenu) : [],
          isComponentized,
        });
        
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
                  console.log('構想カバーデータ設定:', {
                    conceptId: concept.conceptId,
                    coverData: coverDataMap[concept.conceptId],
                  });
                } else {
                  console.log('構想カバー: ターゲットページが見つかりません', {
                    conceptId: concept.conceptId,
                    pagesLength: pages.length,
                  });
                }
              }
            }
          } catch (error) {
            console.error(`構想 ${concept.conceptId} のカバー取得エラー:`, error);
          }
        }
      });
      
      console.log('構想カバーデータマップ:', coverDataMap);
      console.log('構想カバーデータマップのキー:', Object.keys(coverDataMap));
      setConceptCoverData(coverDataMap);
      setConcepts(filteredConcepts);
      loadConceptCounts(filteredConcepts);
    } catch (error) {
      console.error('読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  }, [serviceId, fixedConcepts]);

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

  // 認証が完了し、serviceIdが変更されたときにデータを読み込む
  useEffect(() => {
    console.log('useEffect実行:', { authReady, hasAuth: !!auth?.currentUser, serviceId });
    if (authReady && auth?.currentUser && serviceId) {
      console.log('loadConceptsを呼び出します');
      loadConcepts();
    } else {
      console.log('useEffect: 条件未満足でスキップ', { authReady, hasAuth: !!auth?.currentUser, serviceId });
    }
  }, [authReady, serviceId, loadConcepts]);

  const loadConceptCounts = async (conceptsList: (ConceptData & { id: string })[]) => {
    if (!auth?.currentUser || !db) return;

    try {
      const counts: { [key: string]: number } = {};
      
      // 固定構想のカウント
      for (const concept of fixedConcepts) {
        const plansQuery = query(
          collection(db, 'servicePlans'),
          where('userId', '==', auth.currentUser.uid),
          where('serviceId', '==', serviceId),
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
          where('serviceId', '==', serviceId),
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
          <h2 style={{ marginBottom: '4px' }}>{serviceName}</h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-light)' }}>
            各構想の具体的なサービス内容の事業計画を管理します
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
            serviceId={serviceId}
            onSave={handleConceptFormClose}
            onCancel={handleConceptFormClose}
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: showConceptForm ? '24px' : '0' }}>
          {/* 固定構想 */}
          {fixedConcepts.map((concept, index) => (
            <div
              key={concept.id}
              className="card"
              onClick={() => router.push(`/business-plan/services/${serviceId}/${concept.id}`)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
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
              <p style={{ marginBottom: 0, fontSize: '14px', color: 'var(--color-text-light)', lineHeight: '1.6', flex: 1 }}>
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
          {concepts.map((concept, index) => {
            const coverData = conceptCoverData[concept.conceptId];
            const isComponentized = concept.pagesBySubMenu && 
              typeof concept.pagesBySubMenu === 'object' && 
              Object.keys(concept.pagesBySubMenu).length > 0 &&
              Object.values(concept.pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
            
            console.log('構想カード表示:', {
              conceptId: concept.conceptId,
              conceptName: concept.name,
              hasCoverData: !!coverData,
              coverData: coverData,
              isComponentized,
              pagesBySubMenu: concept.pagesBySubMenu,
              coverDataKeys: Object.keys(conceptCoverData),
              willRenderCover: isComponentized && coverData,
            });
            
            return (
            <div
              key={concept.id}
              className="card"
              onClick={() => router.push(`/business-plan/services/${serviceId}/${concept.conceptId}`)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 0,
                position: 'relative',
                overflow: 'hidden',
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
                  {(() => {
                    console.log('カバーエリアレンダリング:', {
                      conceptId: concept.conceptId,
                      coverData,
                      isComponentized,
                    });
                    return null;
                  })()}
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
              {isComponentized && !coverData && (
                <div style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  backgroundColor: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9CA3AF',
                  fontSize: '14px',
                }}>
                  カバー読み込み中...
                </div>
              )}
              
              <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', flex: 1 }}>
                  {fixedConcepts.length + index + 1}. {concept.name}
                </h3>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditConcept(concept);
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
                    handleDeleteConcept(concept.id);
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
            </div>
            );
          })}
        </div>

        {fixedConcepts.length === 0 && concepts.length === 0 && !showConceptForm && (
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

