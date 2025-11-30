'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, storage } from '@/lib/firebase';
import { pageConfigs, PageConfig } from './pageConfig';
import PageOrderManager from './PageOrderManager';
import { useComponentizedPage } from './ComponentizedPageContext';
import { usePresentationMode } from '@/components/PresentationModeContext';
import { useConcept } from '@/app/business-plan/services/[serviceId]/[conceptId]/layout';
import AddPageForm from './AddPageForm';
import { pageAutoUpdateConfigs, PageAutoUpdateConfig } from './pageAutoUpdateConfig';
import './pageStyles.css';

export default function ComponentizedOverview() {
  const params = useParams();
  const serviceId = params?.serviceId as string | undefined;
  const conceptId = params?.conceptId as string | undefined;
  const { isPresentationMode } = usePresentationMode();
  const { orderedConfigs, currentPageIndex, totalPages, setCurrentPageIndex, refreshPages, subMenuId } = useComponentizedPage();
  const { concept, reloadConcept } = useConcept();
  const [showOrderManager, setShowOrderManager] = useState(false);
  const [showAddPageForm, setShowAddPageForm] = useState(false);
  const [showLogoEditor, setShowLogoEditor] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // serviceIdまたはconceptIdが存在しない場合はエラーを表示
  if (!serviceId || !conceptId) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
          ページ情報が正しく読み込まれていません。
        </p>
      </div>
    );
  }

  const handleOrderChange = (newOrder: PageConfig[]) => {
    // ComponentizedPageContextで管理されているため、ここでは何もしない
    console.log('ページ順序が変更されました:', newOrder.map(c => c.id));
  };

  const handlePageAdded = () => {
    if (refreshPages) {
      refreshPages();
    }
    // ページ順序管理UIも更新するために、一度閉じて再度開く
    if (showOrderManager) {
      setShowOrderManager(false);
      setTimeout(() => {
        setShowOrderManager(true);
      }, 100);
    }
  };

  const handlePageDeleted = () => {
    if (refreshPages) {
      refreshPages();
    }
    // ページ順序管理UIも更新するために、一度閉じて再度開く
    if (showOrderManager) {
      setShowOrderManager(false);
      setTimeout(() => {
        setShowOrderManager(true);
      }, 100);
    }
  };

  const handlePageUpdated = () => {
    if (refreshPages) {
      refreshPages();
    }
    // ページ順序管理UIも更新するために、一度閉じて再度開く
    if (showOrderManager) {
      setShowOrderManager(false);
      setTimeout(() => {
        setShowOrderManager(true);
      }, 100);
    }
  };

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      return;
    }

    handleLogoUpload(file);
  };

  const handleLogoUpload = async (file: File) => {
    if (!concept?.id || !storage || !auth?.currentUser || !serviceId || !conceptId) {
      alert('Firebaseが初期化されていません。');
      return;
    }

    setLogoUploading(true);
    try {
      // Firebase Storageにアップロード
      const storageRef = ref(storage, `concepts/${serviceId}/${conceptId}/logo.png`);
      await uploadBytes(storageRef, file);
      
      // ダウンロードURLを取得
      const downloadURL = await getDownloadURL(storageRef);

      // Firestoreに保存
      const conceptRef = doc(db, 'concepts', concept.id);
      await updateDoc(conceptRef, {
        keyVisualLogoUrl: downloadURL,
        updatedAt: serverTimestamp()
      });

      // conceptを再読み込み
      await reloadConcept();
      setShowLogoEditor(false);
      alert('ロゴのアップロードが完了しました。');
    } catch (error) {
      console.error('ロゴアップロードエラー:', error);
      alert(`ロゴのアップロードに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!concept?.id || !db) return;

    if (!confirm('ロゴを削除しますか？')) return;

    try {
      const conceptRef = doc(db, 'concepts', concept.id);
      await updateDoc(conceptRef, {
        keyVisualLogoUrl: null,
        updatedAt: serverTimestamp()
      });

      await reloadConcept();
      setShowLogoEditor(false);
      alert('ロゴを削除しました。');
    } catch (error) {
      console.error('ロゴ削除エラー:', error);
      alert(`ロゴの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // すべてのページコンポーネントの自動更新機能（設定ファイルベース）
  useEffect(() => {
    const autoUpdatePages = async () => {
      if (!serviceId || !conceptId) {
        return;
      }

      if (!auth?.currentUser || !db) {
        return;
      }

      // 現在のserviceId/conceptId/subMenuIdに該当する設定をフィルタリング
      const applicableConfigs = pageAutoUpdateConfigs.filter(config => {
        if (config.serviceId !== serviceId || config.conceptId !== conceptId) {
          return false;
        }
        // subMenuIdが指定されている場合は一致する必要がある
        if (config.subMenuId !== undefined && config.subMenuId !== subMenuId) {
          return false;
        }
        return true;
      });

      if (applicableConfigs.length === 0) {
        return;
      }

      try {
        const conceptsQuery = query(
          collection(db, 'concepts'),
          where('userId', '==', auth.currentUser.uid),
          where('serviceId', '==', serviceId),
          where('conceptId', '==', conceptId)
        );
        
        const conceptsSnapshot = await getDocs(conceptsQuery);
        
        if (conceptsSnapshot.empty) {
          return;
        }

        const conceptDoc = conceptsSnapshot.docs[0];
        const conceptData = conceptDoc.data();
        
        // サブメニューごとのページデータを取得
        const pagesBySubMenu = conceptData.pagesBySubMenu || {};
        let hasUpdates = false;
        const updatedPagesBySubMenu = { ...pagesBySubMenu };

        // 各設定に対してページを更新
        for (const config of applicableConfigs) {
          const targetSubMenuId = config.subMenuId || subMenuId || 'overview';
          const currentSubMenuPages = updatedPagesBySubMenu[targetSubMenuId] || [];

          const targetPageIndex = currentSubMenuPages.findIndex(
            (page: any) => page.id === config.pageId
        );

        if (targetPageIndex === -1) {
            console.log(`ページ ${config.pageId} が見つかりません。新規作成します。`);
            // ページが存在しない場合は新規作成
            const newPage = {
              id: config.pageId,
              pageNumber: currentSubMenuPages.length,
              title: config.title || '新規ページ',
              content: config.content.trim(),
              createdAt: new Date().toISOString(),
            };
            
            const updatedPages = [...currentSubMenuPages, newPage];
            updatedPagesBySubMenu[targetSubMenuId] = updatedPages;
            
            // ページ順序にも追加
            const pageOrderBySubMenu = conceptData.pageOrderBySubMenu || {};
            const currentSubMenuPageOrder = pageOrderBySubMenu[targetSubMenuId] || [];
            const updatedPageOrder = [...currentSubMenuPageOrder, config.pageId];
            
            await updateDoc(doc(db, 'concepts', conceptDoc.id), {
              pagesBySubMenu: updatedPagesBySubMenu,
              pageOrderBySubMenu: {
                ...pageOrderBySubMenu,
                [targetSubMenuId]: updatedPageOrder,
              },
              updatedAt: serverTimestamp(),
            });
            
            console.log(`✅ ページ ${config.pageId} を新規作成しました`);
            hasUpdates = true;
            continue;
        }

          // 更新が必要かどうかを判定
          const currentContent = currentSubMenuPages[targetPageIndex].content || '';
          const shouldUpdate = config.shouldUpdate 
            ? config.shouldUpdate(currentContent)
            : true; // デフォルトは常に更新

          if (shouldUpdate) {
            const updatedPages = [...currentSubMenuPages];
          updatedPages[targetPageIndex] = {
            ...updatedPages[targetPageIndex],
              content: config.content.trim(),
              ...(config.title && { title: config.title }),
            };

            updatedPagesBySubMenu[targetSubMenuId] = updatedPages;
            hasUpdates = true;

            console.log(`✅ ページ ${config.pageId} のコンテンツを自動更新しました`);
          } else {
            console.log(`ページ ${config.pageId} は既に更新済みです`);
          }
        }

        // 更新があった場合のみFirestoreに保存
        if (hasUpdates) {
          await updateDoc(doc(db, 'concepts', conceptDoc.id), {
            pagesBySubMenu: updatedPagesBySubMenu,
            updatedAt: serverTimestamp(),
          });
          
          // ページをリロード（少し遅延させてから実行し、無限ループを防ぐ）
          if (refreshPages) {
            setTimeout(() => {
              refreshPages();
            }, 500);
          }
        }
      } catch (error) {
        console.error('自動更新エラー:', error);
      }
    };

    // 少し遅延させてから実行（認証とデータ読み込みを待つ）
    const timer = setTimeout(() => {
      autoUpdatePages();
    }, 1000);

    return () => clearTimeout(timer);
    // refreshPagesを依存配列から除外（無限ループを防ぐため）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, conceptId, subMenuId]);

  return (
    <div>
      {/* ページ管理ボタン（プレゼンテーションモードでは非表示） */}
      {!isPresentationMode && (
        <>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={() => setShowAddPageForm(!showAddPageForm)}
              style={{
                padding: '8px 16px',
                backgroundColor: showAddPageForm ? '#F3F4F6' : '#10B981',
                color: showAddPageForm ? 'var(--color-text)' : '#fff',
                border: '1px solid var(--color-border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {showAddPageForm ? '×' : '+'}
              <span>{showAddPageForm ? '閉じる' : 'ページを追加'}</span>
            </button>
            <button
              onClick={() => setShowOrderManager(!showOrderManager)}
              style={{
                padding: '8px 16px',
                backgroundColor: showOrderManager ? '#F3F4F6' : 'var(--color-primary)',
                color: showOrderManager ? 'var(--color-text)' : '#fff',
                border: '1px solid var(--color-border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '180px', // 「ページ順序を変更」のテキスト幅に合わせる
                justifyContent: 'center',
              }}
            >
              {showOrderManager ? '×' : '⚙️'}
              <span>{showOrderManager ? '閉じる' : 'ページ順序を変更'}</span>
            </button>
            <button
              onClick={() => setShowLogoEditor(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#8B5CF6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🖼️
              <span>PDFロゴ設定</span>
            </button>
          </div>

          {/* ページ追加フォーム */}
          {showAddPageForm && (
            <AddPageForm
              serviceId={serviceId}
              conceptId={conceptId}
              subMenuId={subMenuId}
              onClose={() => setShowAddPageForm(false)}
              onPageAdded={handlePageAdded}
            />
          )}

          {/* ページ順序管理UI */}
          {showOrderManager && (
            <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <PageOrderManager
                serviceId={serviceId}
                conceptId={conceptId}
                subMenuId={subMenuId}
                onOrderChange={handleOrderChange}
                onPageDeleted={handlePageDeleted}
                onPageUpdated={handlePageUpdated}
              />
            </div>
          )}

          {/* PDFロゴ設定モーダル */}
          {showLogoEditor && (
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
                zIndex: 10000,
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowLogoEditor(false);
                }
              }}
            >
              <div
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  padding: '24px',
                  maxWidth: '500px',
                  width: '90%',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: 600 }}>
                  PDFロゴ設定
                </h2>

                {concept?.keyVisualLogoUrl && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>現在のロゴ:</p>
                    <img
                      src={concept.keyVisualLogoUrl}
                      alt="現在のロゴ"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '100px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => logoFileInputRef.current?.click()}
                    disabled={logoUploading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: logoUploading ? '#9CA3AF' : 'var(--color-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: logoUploading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      width: '100%',
                      marginBottom: '12px',
                    }}
                  >
                    {logoUploading ? 'アップロード中...' : concept?.keyVisualLogoUrl ? 'ロゴを変更' : 'ロゴをアップロード'}
                  </button>
                </div>

                {concept?.keyVisualLogoUrl && (
                  <button
                    onClick={handleLogoDelete}
                    disabled={logoUploading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: logoUploading ? '#9CA3AF' : '#EF4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: logoUploading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      width: '100%',
                      marginBottom: '12px',
                    }}
                  >
                    ロゴを削除
                  </button>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowLogoEditor(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ページコンポーネントの表示 */}
      {isPresentationMode ? (
        // プレゼンテーションモードの場合は、現在のページのみを表示
        (() => {
          const currentConfig = orderedConfigs[currentPageIndex];
          if (!currentConfig) return null;
          const PageComponent = currentConfig.component;
          return (
            <div 
              key={`${currentConfig.id}-${currentPageIndex}`}
              style={{
                position: 'relative',
              }}
            >
              {/* ページ番号表示 */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text-light)',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                p.{String(currentPageIndex + 1).padStart(2, '0')}
              </div>
              <PageComponent />
            </div>
          );
        })()
      ) : (
        // 通常モードの場合は、すべてのページを表示（ページ番号付き）
        orderedConfigs.map((config, index) => {
          const PageComponent = config.component;
          return (
            <div 
              key={`${config.id}-${index}`}
              style={{
                position: 'relative',
              }}
            >
              {/* ページ番号表示 */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text-light)',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                p.{String(index + 1).padStart(2, '0')}
              </div>
              <PageComponent />
            </div>
          );
        })
      )}
    </div>
  );
}

