'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePlan } from '../hooks/usePlan';
import { useContainerVisibility } from '../hooks/useContainerVisibility';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import dynamic from 'next/dynamic';

// ComponentizedCompanyPlanOverviewを動的インポート
const ComponentizedCompanyPlanOverview = dynamic(
  () => import('@/components/pages/component-test/test-concept/ComponentizedCompanyPlanOverview'),
  { ssr: false }
);

// planIdごとの固定コンテンツコンポーネント（条件付きインポート）
// 固定ページ形式のコンテナの型定義
interface FixedPageContainer {
  id: string;
  title: string;
  content: string;
  order: number;
}

const FIRESTORE_COLLECTION_NAME = 'companyBusinessPlan';

export default function MarketSizePage() {
  const { plan } = usePlan();
  const params = useParams();
  const planId = params.planId as string;
  
  // すべてのHooksを早期リターンの前に呼び出す（React Hooksのルール）
  const { showContainers } = useContainerVisibility();
  
  // 固定ページ形式のコンテナ管理
  const [fixedPageContainers, setFixedPageContainers] = useState<FixedPageContainer[]>([]);
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  
  // コンポーネント化版かどうかを判定
  const isComponentized = plan?.pagesBySubMenu && 
    typeof plan.pagesBySubMenu === 'object' && 
    Object.keys(plan.pagesBySubMenu).length > 0 &&
    Object.values(plan.pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
  
  // 固定ページ形式のコンテナをFirestoreから読み込む
  useEffect(() => {
    if (isComponentized || !plan || !db || !auth?.currentUser) {
      return;
    }
    
    const loadContainers = async () => {
      try {
        if (!db) return;
        const planDoc = await getDoc(doc(db, FIRESTORE_COLLECTION_NAME, plan.id));
        if (planDoc.exists()) {
          const data = planDoc.data();
          const containersBySubMenu = data.fixedPageContainersBySubMenu || {};
          const containers = containersBySubMenu['market-size'] || [];
          setFixedPageContainers(containers);
        }
      } catch (error) {
        console.error('コンテナの読み込みエラー:', error);
      }
    };
    
    loadContainers();
  }, [plan, isComponentized, db, auth]);
  
  // 固定ページ形式のコンテナをFirestoreに保存
  const saveContainers = useCallback(async (containers: FixedPageContainer[]) => {
    if (!plan || !db || !auth?.currentUser) return;
    
    try {
      if (!db) return;
      const planDoc = await getDoc(doc(db, FIRESTORE_COLLECTION_NAME, plan.id));
      if (planDoc.exists()) {
        const data = planDoc.data();
        const containersBySubMenu = data.fixedPageContainersBySubMenu || {};
        await updateDoc(doc(db, FIRESTORE_COLLECTION_NAME, plan.id), {
          fixedPageContainersBySubMenu: {
            ...containersBySubMenu,
            'market-size': containers,
          },
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('コンテナの保存エラー:', error);
      alert('コンテナの保存に失敗しました。');
    }
  }, [plan, db, auth]);
  
  // コンテナの編集を開始
  const handleStartEditContainer = useCallback((containerId: string) => {
    const container = fixedPageContainers.find(c => c.id === containerId);
    if (container) {
      setEditingContainerId(containerId);
      setEditingTitle(container.title);
      setEditingContent(container.content);
    }
  }, [fixedPageContainers]);
  
  // コンテナの編集を保存
  const handleSaveEditContainer = useCallback(async () => {
    if (!editingContainerId) return;
    
    const updatedContainers = fixedPageContainers.map(c =>
      c.id === editingContainerId
        ? { ...c, title: editingTitle, content: editingContent }
        : c
    );
    
    setFixedPageContainers(updatedContainers);
    await saveContainers(updatedContainers);
    setEditingContainerId(null);
    setEditingTitle('');
    setEditingContent('');
  }, [editingContainerId, editingTitle, editingContent, fixedPageContainers, saveContainers]);
  
  // コンテナの編集をキャンセル
  const handleCancelEditContainer = useCallback(() => {
    setEditingContainerId(null);
    setEditingTitle('');
    setEditingContent('');
  }, []);
  
  // コンテナを削除
  const handleDeleteContainer = useCallback(async (containerId: string) => {
    if (!confirm('このコンテナを削除しますか？')) return;
    
    const updatedContainers = fixedPageContainers
      .filter(c => c.id !== containerId)
      .map((c, index) => ({ ...c, order: index }));
    
    setFixedPageContainers(updatedContainers);
    await saveContainers(updatedContainers);
  }, [fixedPageContainers, saveContainers]);
  
  // コンテナの順序を変更（上に移動）
  const handleMoveContainerUp = useCallback(async (containerId: string) => {
    const index = fixedPageContainers.findIndex(c => c.id === containerId);
    if (index <= 0) return;
    
    const updatedContainers = [...fixedPageContainers];
    [updatedContainers[index - 1], updatedContainers[index]] = [updatedContainers[index], updatedContainers[index - 1]];
    updatedContainers[index - 1].order = index - 1;
    updatedContainers[index].order = index;
    
    setFixedPageContainers(updatedContainers);
    await saveContainers(updatedContainers);
  }, [fixedPageContainers, saveContainers]);
  
  // コンテナの順序を変更（下に移動）
  const handleMoveContainerDown = useCallback(async (containerId: string) => {
    const index = fixedPageContainers.findIndex(c => c.id === containerId);
    if (index < 0 || index >= fixedPageContainers.length - 1) return;
    
    const updatedContainers = [...fixedPageContainers];
    [updatedContainers[index], updatedContainers[index + 1]] = [updatedContainers[index + 1], updatedContainers[index]];
    updatedContainers[index].order = index;
    updatedContainers[index + 1].order = index + 1;
    
    setFixedPageContainers(updatedContainers);
    await saveContainers(updatedContainers);
  }, [fixedPageContainers, saveContainers]);
  
  // コンポーネント化されたページを使用するかチェック
  // pagesBySubMenuが存在する場合はComponentizedCompanyPlanOverviewを使用
  if (plan?.pagesBySubMenu) {
    return <ComponentizedCompanyPlanOverview />;
  }

  // 固定ページ形式で、コンテナがあるかチェック
  if (!fixedPageContainers || fixedPageContainers.length === 0) {
    return null;
  }
  
  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        市場規模
      </p>
      
      <div className="card" style={{ marginBottom: '24px' }}>
          <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
            市場規模の内容はここに表示されます。
          </p>
        </div>

      {/* 固定ページ形式のコンテナセクション */}
      {!isComponentized && fixedPageContainers.length > 0 && (
        <>
          {fixedPageContainers
            .sort((a, b) => a.order - b.order)
            .map((container, index) => {
              // 固定ページコンテナの順序に基づいて1から始まる連番を振る
              const containerNumber = index + 1;
              
              return (
                <div
                  key={container.id}
                  data-page-container={containerNumber.toString()}
                  style={{
                    marginBottom: '24px',
                    position: 'relative',
                    ...(showContainers ? {
                      border: '4px dashed #000000',
                      boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      padding: '16px',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                      backgroundColor: 'transparent',
                    } : {}),
                  }}
                >
                  {/* 編集・削除・順序変更ボタン */}
                  {showContainers && auth?.currentUser && (
                    <div 
                      className="container-control-buttons"
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
          display: 'flex',
                      gap: '4px',
                      zIndex: 10,
        }}>
                      {/* 上に移動 */}
                      {container.order > 0 && (
                        <button
                          onClick={() => handleMoveContainerUp(container.id)}
                          style={{
                            background: 'rgba(255,255,255,0.9)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '4px',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontSize: '12px', 
                          }}
                          title="上に移動"
                        >
                          ↑
                        </button>
                      )}
                      {/* 下に移動 */}
                      {container.order < fixedPageContainers.length - 1 && (
                        <button
                          onClick={() => handleMoveContainerDown(container.id)}
                          style={{
                            background: 'rgba(255,255,255,0.9)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '4px',
                            width: '28px',
                            height: '28px',
            display: 'flex',
            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                          }}
                          title="下に移動"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEditContainer(container.id)}
                        style={{
                          background: 'rgba(255,255,255,0.9)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '4px',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                        }}
                        title="編集"
              >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteContainer(container.id)}
                        style={{
                          background: 'rgba(255,255,255,0.9)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '4px',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                        }}
                        title="削除"
              >
                        🗑️
                      </button>
          </div>
                  )}
                  {/* タイトル */}
                  <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{
              fontSize: '16px', 
                      fontWeight: 600,
                color: 'var(--color-text)',
                      borderLeft: '3px solid var(--color-primary)',
                      paddingLeft: '8px',
                      margin: 0,
                      flex: 1,
                    }}>
                      {container.title}
                    </h3>
                    <span 
                      className="container-page-number"
                      style={{
                fontSize: '14px', 
                      fontWeight: 500,
                      color: 'var(--color-text-light)',
                      marginLeft: '16px',
                    }}>
                      {containerNumber}
                    </span>
              </div>
                  {/* コンテンツ */}
                  <div
                    style={{
                padding: '16px',
                minHeight: '100px',
                    }}
                    dangerouslySetInnerHTML={{ __html: container.content }}
                  />
                </div>
              );
            })}
          
          {/* 編集モーダル */}
          {editingContainerId && (
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
            }}>
              <div style={{ 
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '600px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>コンテナを編集</h3>
              <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>タイトル</label>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>コンテンツ (HTML)</label>
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={10}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={handleCancelEditContainer}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#E5E7EB',
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
                    onClick={handleSaveEditContainer}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-primary)',
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
        </>
      )}
    </>
  );
}
