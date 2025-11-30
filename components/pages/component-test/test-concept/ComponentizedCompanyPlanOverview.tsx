'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, storage } from '@/lib/firebase';
import { pageConfigs, PageConfig } from './pageConfig';
import PageOrderManager from './PageOrderManager';
import { useComponentizedCompanyPlanPage } from './ComponentizedCompanyPlanPageContext';
import { usePresentationMode } from '@/components/PresentationModeContext';
import { usePlan } from '@/app/business-plan/company/[planId]/layout';
import AddPageForm from './AddPageForm';
import { pageAutoUpdateConfigs, PageAutoUpdateConfig } from './pageAutoUpdateConfig';
import './pageStyles.css';

export default function ComponentizedCompanyPlanOverview() {
  const params = useParams();
  const planId = params.planId as string | undefined;
  const { isPresentationMode } = usePresentationMode();
  const { orderedConfigs, currentPageIndex, totalPages, setCurrentPageIndex, refreshPages, subMenuId } = useComponentizedCompanyPlanPage();
  const { plan, loading: planLoading, reloadPlan } = usePlan();
  const [showOrderManager, setShowOrderManager] = useState(false);
  const [showAddPageForm, setShowAddPageForm] = useState(false);
  const [showLogoEditor, setShowLogoEditor] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // デバッグログ
  useEffect(() => {
    console.log('ComponentizedCompanyPlanOverview - orderedConfigs:', orderedConfigs);
    console.log('ComponentizedCompanyPlanOverview - orderedConfigs.length:', orderedConfigs.length);
    console.log('ComponentizedCompanyPlanOverview - orderedConfigs.map(c => c.id):', orderedConfigs.map(c => c.id));
    console.log('ComponentizedCompanyPlanOverview - isPresentationMode:', isPresentationMode);
    console.log('ComponentizedCompanyPlanOverview - currentPageIndex:', currentPageIndex);
  }, [orderedConfigs, isPresentationMode, currentPageIndex]);

  // planIdが存在しない場合はエラーを表示
  if (!planId) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
          ページ情報が正しく読み込まれていません。
        </p>
      </div>
    );
  }

  const handleOrderChange = (newOrder: PageConfig[]) => {
    // ComponentizedCompanyPlanPageContextで管理されているため、ここでは何もしない
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
    if (!plan?.id || !storage || !auth?.currentUser || !planId) {
      alert('Firebaseが初期化されていません。');
      return;
    }

    setLogoUploading(true);
    try {
      // Firebase Storageにアップロード
      const storageRef = ref(storage, `companyBusinessPlan/${planId}/logo.png`);
      await uploadBytes(storageRef, file);
      
      // ダウンロードURLを取得
      const downloadURL = await getDownloadURL(storageRef);

      // Firestoreに保存
      const planRef = doc(db, 'companyBusinessPlan', plan.id);
      await updateDoc(planRef, {
        keyVisualLogoUrl: downloadURL,
        updatedAt: serverTimestamp()
      });

      // planを再読み込み
      if (reloadPlan) {
        await reloadPlan();
      }
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
    if (!plan?.id || !db) return;

    if (!confirm('ロゴを削除しますか？')) return;

    try {
      const planRef = doc(db, 'companyBusinessPlan', plan.id);
      await updateDoc(planRef, {
        keyVisualLogoUrl: null,
        updatedAt: serverTimestamp()
      });

      // planを再読み込み
      if (reloadPlan) {
        await reloadPlan();
      }
      setShowLogoEditor(false);
      alert('ロゴを削除しました。');
    } catch (error) {
      console.error('ロゴ削除エラー:', error);
      alert(`ロゴの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 現在のページコンポーネントを取得
  const currentPageConfig = orderedConfigs[currentPageIndex];
  const CurrentPageComponent = currentPageConfig?.component;

  // 自動更新が必要なページをチェック
  useEffect(() => {
    if (!currentPageConfig || !plan) return;

    const autoUpdateConfig = pageAutoUpdateConfigs.find(config => config.pageId === currentPageConfig.id);
    if (autoUpdateConfig && autoUpdateConfig.shouldUpdate(plan)) {
      // 自動更新が必要な場合は、ページを再読み込み
      if (refreshPages) {
        refreshPages();
      }
    }
  }, [currentPageConfig, plan, refreshPages]);

  if (planLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
          読み込み中...
        </p>
      </div>
    );
  }

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
                minWidth: '180px',
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
              planId={planId}
              subMenuId={subMenuId}
              onClose={() => setShowAddPageForm(false)}
              onPageAdded={handlePageAdded}
            />
          )}

          {/* ページ順序管理UI */}
          {showOrderManager && (
            <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <PageOrderManager
                planId={planId}
                subMenuId={subMenuId}
                onOrderChange={handleOrderChange}
                onPageDeleted={handlePageDeleted}
                onPageUpdated={handlePageUpdated}
              />
            </div>
          )}

          {/* PDFロゴ設定モーダル */}
          {showLogoEditor && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowLogoEditor(false)}
            >
              <div onClick={(e) => e.stopPropagation()} style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>PDFロゴ設定</h3>
                
                {plan?.keyVisualLogoUrl && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ marginBottom: '8px', fontSize: '14px' }}>現在のロゴ:</p>
                    <img 
                      src={plan.keyVisualLogoUrl} 
                      alt="PDFロゴ" 
                      style={{ maxWidth: '200px', maxHeight: '100px', border: '1px solid #E5E7EB', borderRadius: '4px' }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                    新しいロゴをアップロード
                  </label>
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
                      padding: '8px 16px',
                      backgroundColor: logoUploading ? '#94A3B8' : '#3B82F6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: logoUploading ? 'not-allowed' : 'pointer',
                      marginRight: '8px',
                    }}
                  >
                    {logoUploading ? 'アップロード中...' : 'ファイルを選択'}
                  </button>
                </div>

                {plan?.keyVisualLogoUrl && (
                  <button
                    onClick={handleLogoDelete}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#EF4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      marginRight: '8px',
                    }}
                  >
                    ロゴを削除
                  </button>
                )}

                <button
                  onClick={() => setShowLogoEditor(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#F3F4F6',
                    color: 'var(--color-text)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  閉じる
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ページコンテンツ */}
      {isPresentationMode ? (
        // プレゼンテーションモードの場合は、現在のページのみ表示
        CurrentPageComponent ? (
          <CurrentPageComponent />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
              ページが読み込まれていません。
            </p>
          </div>
        )
      ) : (
        // 通常モードの場合は、すべてのページを表示（ページ番号付き）
        orderedConfigs.length > 0 ? (
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
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
              ページが読み込まれていません。
            </p>
          </div>
        )
      )}
    </div>
  );
}

