'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useConcept } from '../layout';

export default function OverviewPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const conceptId = params.conceptId as string;
  const { concept, loading } = useConcept();

  const keyVisualUrl = concept?.keyVisualUrl || '';
  const [keyVisualHeight, setKeyVisualHeight] = useState<number>(56.25);
  const [showSizeControl, setShowSizeControl] = useState(false);
  
  // キービジュアルの高さを読み込む
  useEffect(() => {
    if (concept?.keyVisualHeight !== undefined) {
      setKeyVisualHeight(concept.keyVisualHeight);
    }
  }, [concept?.keyVisualHeight]);
  
  // キービジュアルの高さを保存
  const handleSaveKeyVisualHeight = async (height: number) => {
    if (!auth?.currentUser || !db || !concept?.id) return;
    
    try {
      await updateDoc(doc(db, 'concepts', concept.id), {
        keyVisualHeight: height,
        updatedAt: serverTimestamp(),
      });
      setKeyVisualHeight(height);
    } catch (error) {
      console.error('キービジュアルサイズの保存エラー:', error);
    }
  };

  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        概要・コンセプト
      </p>
      
      {/* キービジュアル */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {keyVisualUrl ? (
          <div style={{ position: 'relative', width: '100%', paddingTop: `${keyVisualHeight}%`, backgroundColor: '#f8f9fa' }}>
            <img
              src={keyVisualUrl}
              alt="キービジュアル"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
            {/* サイズ調整コントロール */}
            {showSizeControl && (
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  padding: '12px',
                  borderRadius: '8px',
                  zIndex: 10,
                  minWidth: '200px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ marginBottom: '8px', color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                  高さ調整（%）
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="5"
                  value={keyVisualHeight}
                  onChange={(e) => {
                    const newHeight = parseFloat(e.target.value);
                    setKeyVisualHeight(newHeight);
                    handleSaveKeyVisualHeight(newHeight);
                  }}
                  style={{
                    width: '100%',
                    marginBottom: '8px',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '12px' }}>{keyVisualHeight}%</span>
                  <button
                    onClick={() => setShowSizeControl(false)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    閉じる
                  </button>
                </div>
              </div>
            )}
            {/* キービジュアル編集ボタン */}
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowSizeControl(!showSizeControl)}
                style={{
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 300,
                  lineHeight: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                title="サイズ調整"
              >
                ⚙
              </button>
              <button
                onClick={() => router.push(`/business-plan/services/${serviceId}/${conceptId}/overview/upload-key-visual`)}
                style={{
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '20px',
                  fontWeight: 300,
                  lineHeight: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                title="画像変更"
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', paddingTop: `${keyVisualHeight}%`, backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* キービジュアルアップロードボタン（中央に配置） */}
            <button
              onClick={() => router.push(`/business-plan/services/${serviceId}/${conceptId}/overview/upload-key-visual`)}
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                width: '32px',
                height: '32px',
                padding: 0,
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '50%',
                color: 'var(--color-text-light)',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 300,
                lineHeight: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.6,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6';
              }}
            >
              +
            </button>
          </div>
        )}
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
            読み込み中...
          </p>
        ) : concept?.description ? (
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.8' }}>
            {concept.description}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
            概要・コンセプトの内容はここに表示されます。
          </p>
        )}
      </div>
    </>
  );
}
