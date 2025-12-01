'use client';

import { useState, useEffect, useRef, useContext, createContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '@/lib/firebase';
import KeyVisualPDFMetadataEditor from '@/components/KeyVisualPDFMetadataEditor';

// デフォルトのコンテキスト（コンテキストが存在しない場合に使用）
const DefaultContainerVisibilityContext = createContext<{ showContainers: boolean } | undefined>(undefined);
const DefaultConceptContext = createContext<{ concept: any; reloadConcept: () => Promise<void> } | undefined>(undefined);
const DefaultPlanContext = createContext<{ plan: any; reloadPlan: () => Promise<void> } | undefined>(undefined);

// オプショナルなコンテキストをモジュールレベルでインポート
let ContainerVisibilityContext: any = DefaultContainerVisibilityContext;
let ConceptContext: any = DefaultConceptContext;
let PlanContext: any = DefaultPlanContext;

try {
  const serviceLayout = require('@/app/business-plan/services/[serviceId]/[conceptId]/layout');
  ConceptContext = serviceLayout.ConceptContext || DefaultConceptContext;
  ContainerVisibilityContext = serviceLayout.ContainerVisibilityContext || DefaultContainerVisibilityContext;
} catch {
  // インポートに失敗した場合はデフォルトコンテキストを使用
}

try {
  const companyLayout = require('@/app/business-plan/company/[planId]/layout');
  PlanContext = companyLayout.PlanContext || DefaultPlanContext;
  if (ContainerVisibilityContext === DefaultContainerVisibilityContext) {
    ContainerVisibilityContext = companyLayout.ContainerVisibilityContext || DefaultContainerVisibilityContext;
  }
} catch {
  // インポートに失敗した場合はデフォルトコンテキストを使用
}

export default function Page0() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string | undefined;
  const conceptId = params.conceptId as string | undefined;
  const planId = params.planId as string | undefined;
  
  // React Hooksのルールに準拠するため、すべてのHooksを常に呼び出す
  const containerVisibilityValue = useContext(ContainerVisibilityContext);
  const conceptValue = useContext(ConceptContext);
  const planValue = useContext(PlanContext);
  
  // useContainerVisibilityはオプショナル（コンテキストが存在しない場合があるため）
  const showContainers = containerVisibilityValue?.showContainers ?? false;
  
  // useConceptもオプショナル
  // 会社本体の事業計画の場合はusePlanを使用
  let concept: any = null;
  let reloadConcept: (() => Promise<void>) | undefined = undefined;
  
  // 事業企画の場合
  if (serviceId && conceptId && conceptValue) {
    concept = conceptValue.concept;
    reloadConcept = conceptValue.reloadConcept;
  } else if (planId && planValue) {
    // 会社本体の事業計画の場合
    // planをconcept形式に変換
    concept = planValue.plan ? {
      id: planValue.plan.id,
      keyVisualUrl: planValue.plan.keyVisualUrl || '',
      keyVisualHeight: planValue.plan.keyVisualHeight || 56.25,
      keyVisualLogoUrl: planValue.plan.keyVisualLogoUrl || null,
      keyVisualMetadata: planValue.plan.keyVisualMetadata || undefined,
    } : null;
    reloadConcept = async () => {
      // planの再読み込みを実行
      if (planValue.reloadPlan) {
        await planValue.reloadPlan();
      }
    };
  }
  
  const imgRef = useRef<HTMLImageElement>(null);

  const keyVisualUrl = concept?.keyVisualUrl || '';
  const [keyVisualHeight, setKeyVisualHeight] = useState<number>(56.25);
  const [keyVisualScale, setKeyVisualScale] = useState<number>(100); // スケール（%）
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number | null>(null);
  const [showSizeControl, setShowSizeControl] = useState(false);
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [showLogoEditor, setShowLogoEditor] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (concept?.keyVisualHeight !== undefined) {
      setKeyVisualHeight(concept.keyVisualHeight);
    }
    // スケール値も読み込む（存在する場合）
    if (concept?.keyVisualScale !== undefined) {
      setKeyVisualScale(concept.keyVisualScale);
    }
  }, [concept?.keyVisualHeight, concept?.keyVisualScale]);

  // メタデータはconceptから直接取得（ローカル状態ではなく）
  const keyVisualMetadata = concept?.keyVisualMetadata || null;
  
  // デバッグ: keyVisualMetadataの状態を確認
  useEffect(() => {
    console.log('Page0: concept?.keyVisualMetadata:', concept?.keyVisualMetadata);
    console.log('Page0: keyVisualMetadata:', keyVisualMetadata);
  }, [concept?.keyVisualMetadata, keyVisualMetadata]);

  // 画像が読み込まれたときにアスペクト比を取得
  useEffect(() => {
    if (keyVisualUrl && imgRef.current) {
      const img = imgRef.current;
      const checkAspectRatio = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          setOriginalAspectRatio(aspectRatio);
        }
      };
      
      if (img.complete) {
        checkAspectRatio();
      } else {
        img.onload = checkAspectRatio;
        img.onerror = () => {
          // エラー時はデフォルトのアスペクト比を使用
          setOriginalAspectRatio(16 / 9);
        };
      }
    } else {
      setOriginalAspectRatio(null);
    }
  }, [keyVisualUrl]);

  const handleScaleChange = (newScale: number) => {
    setKeyVisualScale(newScale);
  };

  const saveScaleChange = async () => {
    if (!concept?.id || !db) return;
    
    try {
      // 事業企画の場合はconceptsコレクション、会社本体の事業計画の場合はcompanyBusinessPlanコレクション
      if (serviceId && conceptId) {
        const conceptRef = doc(db, 'concepts', concept.id);
        await updateDoc(conceptRef, { 
          keyVisualScale: keyVisualScale,
          updatedAt: serverTimestamp() 
        });
      } else if (planId) {
        const planRef = doc(db, 'companyBusinessPlan', planId);
        await updateDoc(planRef, { 
          keyVisualScale: keyVisualScale,
          updatedAt: serverTimestamp() 
        });
      }
      setShowSizeControl(false);
    } catch (error) {
      console.error('キービジュアルのスケール保存エラー:', error);
    }
  };

  const handleImageChange = () => {
    if (serviceId && conceptId) {
      router.push(`/business-plan/services/${serviceId}/${conceptId}/overview/upload-key-visual`);
    } else if (planId) {
      // 会社本体の事業計画の場合は、画像変更機能を無効化するか、別のページに遷移
      alert('画像変更機能は現在利用できません。');
    }
  };

  const handleMetadataSave = async (metadata: {
    title: string;
    signature: string;
    date: string;
    position: { x: number; y: number; align: 'left' | 'center' | 'right' };
    titleFontSize?: number;
    signatureFontSize?: number;
    dateFontSize?: number;
  }) => {
    if (!concept?.id || !db) return;
    
    try {
      console.log('メタデータを保存します:', metadata);
      // 事業企画の場合はconceptsコレクション、会社本体の事業計画の場合はcompanyBusinessPlanコレクション
      if (serviceId && conceptId) {
        const conceptRef = doc(db, 'concepts', concept.id);
        await updateDoc(conceptRef, {
          keyVisualMetadata: metadata,
          updatedAt: serverTimestamp()
        });
      } else if (planId) {
        const planRef = doc(db, 'companyBusinessPlan', planId);
        await updateDoc(planRef, {
          keyVisualMetadata: metadata,
          updatedAt: serverTimestamp()
        });
      }
      console.log('Firestoreへの保存が完了しました');
      // Firestoreに保存後、conceptを再読み込み
      setShowMetadataEditor(false);
      if (reloadConcept) {
        await reloadConcept();
      }
      console.log('conceptの再読み込みが完了しました。keyVisualMetadata:', concept?.keyVisualMetadata);
    } catch (error) {
      console.error('キービジュアルメタデータの保存エラー:', error);
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
    if (!concept?.id || !storage || !auth?.currentUser || !db) {
      alert('Firebaseが初期化されていません。');
      return;
    }

    setLogoUploading(true);
    try {
      // Firebase Storageにアップロード
      let storageRef;
      if (serviceId && conceptId) {
        storageRef = ref(storage, `concepts/${serviceId}/${conceptId}/logo.png`);
      } else if (planId) {
        storageRef = ref(storage, `companyBusinessPlan/${planId}/logo.png`);
      } else {
        throw new Error('必要な情報が不足しています。');
      }
      
      await uploadBytes(storageRef, file);
      
      // ダウンロードURLを取得
      const downloadURL = await getDownloadURL(storageRef);

      // Firestoreに保存
      if (serviceId && conceptId) {
        const conceptRef = doc(db, 'concepts', concept.id);
        await updateDoc(conceptRef, {
          keyVisualLogoUrl: downloadURL,
          updatedAt: serverTimestamp()
        });
      } else if (planId) {
        const planRef = doc(db, 'companyBusinessPlan', planId);
        await updateDoc(planRef, {
          keyVisualLogoUrl: downloadURL,
          updatedAt: serverTimestamp()
        });
      }

      // conceptを再読み込み
      if (reloadConcept) {
        await reloadConcept();
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
    if (!concept?.id || !db) return;

    if (!confirm('ロゴを削除しますか？')) return;

    try {
      // 事業企画の場合はconceptsコレクション、会社本体の事業計画の場合はcompanyBusinessPlanコレクション
      if (serviceId && conceptId) {
        const conceptRef = doc(db, 'concepts', concept.id);
        await updateDoc(conceptRef, {
          keyVisualLogoUrl: null,
          updatedAt: serverTimestamp()
        });
      } else if (planId) {
        const planRef = doc(db, 'companyBusinessPlan', planId);
        await updateDoc(planRef, {
          keyVisualLogoUrl: null,
          updatedAt: serverTimestamp()
        });
      }

      if (reloadConcept) {
        await reloadConcept();
      }
      setShowLogoEditor(false);
      alert('ロゴを削除しました。');
    } catch (error) {
      console.error('ロゴ削除エラー:', error);
      alert(`ロゴの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // スケールに基づいてコンテナの高さを計算（縦横比を維持）
  // 元のアスペクト比が取得できている場合は、それを使用して高さを計算
  const displayAspectRatio = originalAspectRatio || 16 / 9; // デフォルトは16:9
  // 基準の高さ（keyVisualHeight）にスケールを適用して、コンテナの高さを調整
  const calculatedHeight = keyVisualHeight * (keyVisualScale / 100);

  return (
    <div
      data-page-container="0"
      style={{
        marginBottom: '32px',
        position: 'relative',
        ...(showContainers ? {
          border: '4px dashed #000000',
          borderRadius: '8px',
          padding: '16px',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
          backgroundColor: 'transparent',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
        } : {}),
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: `${calculatedHeight}%`,
          backgroundColor: keyVisualUrl ? 'transparent' : '#f0f0f0',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-light)',
          fontSize: '14px',
        }}
      >
        {keyVisualUrl ? (
          <>
            <img
              ref={imgRef}
              src={keyVisualUrl}
              alt="Key Visual"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${keyVisualScale / 100})`,
                width: `${100 / displayAspectRatio}%`,
                height: '100%',
                objectFit: 'contain',
                maxWidth: 'none',
                maxHeight: 'none',
              }}
            />
            {/* タイトル、署名、作成日を表示 */}
            {keyVisualMetadata && (keyVisualMetadata.title || keyVisualMetadata.signature || keyVisualMetadata.date) && (
              <div
                data-key-visual-metadata="true"
                style={{
                  position: 'absolute',
                  right: `${((254 - keyVisualMetadata.position.x) / 254) * 100}%`,
                  bottom: `${((143 - keyVisualMetadata.position.y) / 143) * 100}%`,
                  textAlign: keyVisualMetadata.position.align,
                  color: '#666',
                  lineHeight: '1.5',
                  zIndex: 5,
                  pointerEvents: 'none',
                }}
              >
                {keyVisualMetadata.title && (
                  <div style={{ fontSize: `${(keyVisualMetadata.titleFontSize || 6) * 1.33}px` }}>
                    {keyVisualMetadata.title}
                  </div>
                )}
                {keyVisualMetadata.signature && (
                  <div style={{ fontSize: `${(keyVisualMetadata.signatureFontSize || 6) * 1.33}px` }}>
                    {keyVisualMetadata.signature}
                  </div>
                )}
                {keyVisualMetadata.date && (
                  <div style={{ fontSize: `${(keyVisualMetadata.dateFontSize || 6) * 1.33}px` }}>
                    {keyVisualMetadata.date}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            キービジュアルが設定されていません
          </div>
        )}
        {!showContainers && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '8px', zIndex: 10 }}>
            <button
              onClick={() => setShowSizeControl(!showSizeControl)}
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
              title="サイズ調整"
            >
              ⚙️
            </button>
            <button
              onClick={handleImageChange}
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
              title="画像変更"
            >
              +
            </button>
          </div>
        )}
      </div>
      {showSizeControl && !showContainers && (
        <>
          {/* モーダル外クリック用のオーバーレイ */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
            onClick={saveScaleChange}
          />
          {/* サイズ調整コントロール */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 999,
              minWidth: '300px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <label htmlFor="keyVisualScale" style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>サイズ:</label>
            <input
              type="range"
              id="keyVisualScale"
              min="50"
              max="150"
              step="5"
              value={keyVisualScale}
              onChange={(e) => handleScaleChange(Number(e.target.value))}
              style={{ flexGrow: 1 }}
            />
            <span style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 600, minWidth: '45px', textAlign: 'right' }}>{keyVisualScale}%</span>
            <button
              onClick={saveScaleChange}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              適用
            </button>
            <button
              onClick={() => {
                setShowSizeControl(false);
                setShowMetadataEditor(true);
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#6B7280',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              PDFメタデータ編集
            </button>
            <button
              onClick={() => {
                setShowSizeControl(false);
                setShowLogoEditor(true);
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#10B981',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              ロゴ設定
            </button>
          </div>
        </>
      )}
      
      {/* PDFメタデータ編集モーダル */}
      {showMetadataEditor && (
        <KeyVisualPDFMetadataEditor
          isOpen={showMetadataEditor}
          onClose={() => setShowMetadataEditor(false)}
          onSave={handleMetadataSave}
          initialMetadata={keyVisualMetadata || undefined}
          pageWidth={254}
          pageHeight={143}
        />
      )}

      {/* ロゴ設定モーダル */}
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
    </div>
  );
}

