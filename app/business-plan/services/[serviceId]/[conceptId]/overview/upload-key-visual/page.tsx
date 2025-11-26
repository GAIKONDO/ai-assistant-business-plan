'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, addDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, storage, db } from '@/lib/firebase';
import Layout from '@/components/Layout';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

type AspectRatio = '16:9' | '4:3' | '1:1' | '3:4' | '1:2' | 'free' | null;

export default function UploadKeyVisualPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const conceptId = params.conceptId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(null);
  const [cropInputs, setCropInputs] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください。');
      return;
    }

    setSelectedFile(file);
    setError('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      
      // 画像サイズを取得
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        setCropArea(null);
        setAspectRatio(null);
        setCropInputs({ x: 0, y: 0, width: 0, height: 0 });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // アスペクト比に基づいてトリミング領域を設定
  const applyAspectRatio = (ratio: AspectRatio) => {
    if (!imageSize) return;
    
    setAspectRatio(ratio);
    
    if (ratio === null || ratio === 'free') {
      setCropArea(null);
      setCropInputs({ x: 0, y: 0, width: 0, height: 0 });
      return;
    }

    let targetWidth: number;
    let targetHeight: number;
    
    switch (ratio) {
      case '16:9':
        targetWidth = imageSize.width;
        targetHeight = (imageSize.width * 9) / 16;
        if (targetHeight > imageSize.height) {
          targetHeight = imageSize.height;
          targetWidth = (imageSize.height * 16) / 9;
        }
        break;
      case '4:3':
        targetWidth = imageSize.width;
        targetHeight = (imageSize.width * 3) / 4;
        if (targetHeight > imageSize.height) {
          targetHeight = imageSize.height;
          targetWidth = (imageSize.height * 4) / 3;
        }
        break;
      case '1:1':
        targetWidth = Math.min(imageSize.width, imageSize.height);
        targetHeight = targetWidth;
        break;
      case '3:4':
        targetHeight = imageSize.height;
        targetWidth = (imageSize.height * 3) / 4;
        if (targetWidth > imageSize.width) {
          targetWidth = imageSize.width;
          targetHeight = (imageSize.width * 4) / 3;
        }
        break;
      case '1:2':
        targetHeight = imageSize.height;
        targetWidth = imageSize.height / 2;
        if (targetWidth > imageSize.width) {
          targetWidth = imageSize.width;
          targetHeight = imageSize.width * 2;
        }
        break;
      default:
        return;
    }

    const x = (imageSize.width - targetWidth) / 2;
    const y = (imageSize.height - targetHeight) / 2;
    
    const newCropArea = {
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: Math.min(targetWidth, imageSize.width - Math.max(0, x)),
      height: Math.min(targetHeight, imageSize.height - Math.max(0, y)),
    };
    
    setCropArea(newCropArea);
    setCropInputs({
      x: Math.round(newCropArea.x),
      y: Math.round(newCropArea.y),
      width: Math.round(newCropArea.width),
      height: Math.round(newCropArea.height),
    });
  };

  // 数値入力からトリミング領域を更新
  const updateCropAreaFromInputs = (inputs: { x: number; y: number; width: number; height: number }, changedField?: 'x' | 'y' | 'width' | 'height') => {
    if (!imageSize) return;
    
    let newWidth = inputs.width;
    let newHeight = inputs.height;
    let newX = inputs.x;
    let newY = inputs.y;
    
    // アスペクト比が設定されている場合は、幅に基づいて高さを調整
    if (aspectRatio && aspectRatio !== 'free') {
      const oldHeight = newHeight;
      switch (aspectRatio) {
        case '16:9':
          newHeight = (newWidth * 9) / 16;
          break;
        case '4:3':
          newHeight = (newWidth * 3) / 4;
          break;
        case '1:1':
          newHeight = newWidth;
          break;
        case '3:4':
          newHeight = (newWidth * 4) / 3;
          break;
        case '1:2':
          newHeight = newWidth * 2;
          break;
      }
      
      // Y座標を変更した場合、高さが変わったときにY座標を調整して範囲内に収める
      if (changedField === 'y' && oldHeight !== newHeight) {
        // 高さの変化分だけY座標を調整
        const heightDiff = newHeight - oldHeight;
        newY = Math.max(0, Math.min(newY, imageSize.height - newHeight));
      }
    }
    
    // 画像の範囲内に制限
    newX = Math.max(0, Math.min(newX, imageSize.width - newWidth));
    newY = Math.max(0, Math.min(newY, imageSize.height - newHeight));
    newWidth = Math.max(1, Math.min(newWidth, imageSize.width - newX));
    newHeight = Math.max(1, Math.min(newHeight, imageSize.height - newY));
    
    const newCropArea = {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };
    
    setCropArea(newCropArea);
    setCropInputs({
      x: Math.round(newCropArea.x),
      y: Math.round(newCropArea.y),
      width: Math.round(newCropArea.width),
      height: Math.round(newCropArea.height),
    });
  };

  // トリミング領域が変更されたときに数値入力を更新
  useEffect(() => {
    if (cropArea) {
      setCropInputs({
        x: Math.round(cropArea.x),
        y: Math.round(cropArea.y),
        width: Math.round(cropArea.width),
        height: Math.round(cropArea.height),
      });
    }
  }, [cropArea]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageSize || !containerRef.current || !imageRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    
    // 画像の実際の表示サイズと元のサイズの比率を計算
    const scaleX = imageSize.width / imageRect.width;
    const scaleY = imageSize.height / imageRect.height;
    
    // 画像の左上角からの相対座標を計算
    const x = (e.clientX - imageRect.left) * scaleX;
    const y = (e.clientY - imageRect.top) * scaleY;
    
    setIsDragging(true);
    setDragStart({ x, y });
    setAspectRatio('free'); // ドラッグ開始時に自由比率に変更
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !imageSize || !containerRef.current || !imageRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    
    // 画像の実際の表示サイズと元のサイズの比率を計算
    const scaleX = imageSize.width / imageRect.width;
    const scaleY = imageSize.height / imageRect.height;
    
    // 画像の左上角からの相対座標を計算
    const currentX = (e.clientX - imageRect.left) * scaleX;
    const currentY = (e.clientY - imageRect.top) * scaleY;
    
    let x = Math.min(dragStart.x, currentX);
    let y = Math.min(dragStart.y, currentY);
    let width = Math.abs(currentX - dragStart.x);
    let height = Math.abs(currentY - dragStart.y);
    
    // アスペクト比が設定されている場合は、幅に基づいて高さを調整
    if (aspectRatio && aspectRatio !== 'free') {
      switch (aspectRatio) {
        case '16:9':
          height = (width * 9) / 16;
          break;
        case '4:3':
          height = (width * 3) / 4;
          break;
        case '1:1':
          height = width;
          break;
        case '3:4':
          height = (width * 4) / 3;
          break;
        case '1:2':
          height = width * 2;
          break;
      }
    }
    
    // 画像の範囲内に制限
    x = Math.max(0, Math.min(x, imageSize.width));
    y = Math.max(0, Math.min(y, imageSize.height));
    width = Math.max(1, Math.min(width, imageSize.width - x));
    height = Math.max(1, Math.min(height, imageSize.height - y));
    
    setCropArea({
      x,
      y,
      width,
      height,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const cropImage = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!imageRef.current || !cropArea || !imageSize) {
        reject(new Error('画像またはトリミング領域が設定されていません'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas contextが取得できません'));
        return;
      }

      // 画像の元のサイズを使用してトリミング
      canvas.width = Math.round(cropArea.width);
      canvas.height = Math.round(cropArea.height);

      // 画像の元のサイズに対する座標でトリミング
      ctx.drawImage(
        imageRef.current,
        Math.round(cropArea.x),
        Math.round(cropArea.y),
        Math.round(cropArea.width),
        Math.round(cropArea.height),
        0,
        0,
        Math.round(cropArea.width),
        Math.round(cropArea.height)
      );

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('画像のトリミングに失敗しました'));
        }
      }, 'image/png');
    });
  }, [imageRef, cropArea, imageSize]);

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('画像を選択してください。');
      return;
    }

    if (!auth?.currentUser || !storage || !db) {
      const missing = [];
      if (!auth?.currentUser) missing.push('認証');
      if (!storage) missing.push('Storage');
      if (!db) missing.push('Firestore');
      setError(`Firebaseが初期化されていません: ${missing.join(', ')}`);
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      let blobToUpload: Blob;
      
      if (cropArea) {
        setUploadProgress('画像をトリミング中...');
        blobToUpload = await cropImage();
      } else {
        blobToUpload = selectedFile;
      }
      
      setUploadProgress('画像をアップロード中...');
      
      const storageRef = ref(storage, `concepts/${serviceId}/${conceptId}/key-visual.png`);
      await uploadBytes(storageRef, blobToUpload);
      
      setUploadProgress('画像のURLを取得中...');
      const downloadURL = await getDownloadURL(storageRef);

      setUploadProgress('データベースに保存中...');
      
      const conceptsQuery = query(
        collection(db, 'concepts'),
        where('userId', '==', auth.currentUser.uid),
        where('serviceId', '==', serviceId),
        where('conceptId', '==', conceptId)
      );
      
      const conceptsSnapshot = await getDocs(conceptsQuery);
      
      if (!conceptsSnapshot.empty) {
        const conceptDoc = conceptsSnapshot.docs[0];
        await updateDoc(doc(db, 'concepts', conceptDoc.id), {
          keyVisualUrl: downloadURL,
          updatedAt: serverTimestamp(),
        });
      } else {
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
            'corporate-ai-training': '大企業向けAI人材育成・教育',
            'ai-governance': 'AI導入ルール設計・ガバナンス支援',
            'sme-ai-education': '中小企業向けAI導入支援・教育',
          },
        };
        const conceptName = fixedConcepts[serviceId]?.[conceptId] || conceptId;
        
        await addDoc(collection(db, 'concepts'), {
          name: conceptName,
          description: '',
          conceptId: conceptId,
          serviceId: serviceId,
          userId: auth.currentUser.uid,
          keyVisualUrl: downloadURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setUploadProgress('アップロード完了！');
      
      setTimeout(() => {
        router.push(`/business-plan/services/${serviceId}/${conceptId}/overview`);
      }, 2000);
    } catch (err: any) {
      console.error('アップロードエラー詳細:', err);
      setError(`アップロードに失敗しました: ${err.message || '不明なエラー'}`);
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  const getCropAreaStyle = () => {
    if (!cropArea || !imageSize || !containerRef.current || !imageRef.current) return {};
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    
    // 画像の実際の表示サイズと元のサイズの比率を計算
    const scaleX = imageRect.width / imageSize.width;
    const scaleY = imageRect.height / imageSize.height;
    
    // 画像がコンテナ内のどこに配置されているかを計算
    const imageOffsetX = imageRect.left - containerRect.left;
    const imageOffsetY = imageRect.top - containerRect.top;
    
    return {
      position: 'absolute' as const,
      left: `${imageOffsetX + cropArea.x * scaleX}px`,
      top: `${imageOffsetY + cropArea.y * scaleY}px`,
      width: `${cropArea.width * scaleX}px`,
      height: `${cropArea.height * scaleY}px`,
      border: '2px dashed #fff',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      cursor: 'move',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
      pointerEvents: 'none' as const,
    };
  };

  return (
    <Layout>
      <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '24px' }}>キービジュアル画像をアップロード</h2>
        
        {!imageSrc ? (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: 'var(--color-text-light)', fontSize: '14px', marginBottom: '16px' }}>
              構想のキービジュアル画像を選択してください。
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--color-border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            {/* アスペクト比選択 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                アスペクト比
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => applyAspectRatio(null)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: aspectRatio === null ? 'var(--color-primary)' : 'transparent',
                    color: aspectRatio === null ? '#fff' : 'var(--color-text)',
                    border: '1px solid var(--color-border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  トリミングなし
                </button>
                <button
                  onClick={() => applyAspectRatio('16:9')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: aspectRatio === '16:9' ? 'var(--color-primary)' : 'transparent',
                    color: aspectRatio === '16:9' ? '#fff' : 'var(--color-text)',
                    border: '1px solid var(--color-border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  16:9
                </button>
                <button
                  onClick={() => applyAspectRatio('4:3')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: aspectRatio === '4:3' ? 'var(--color-primary)' : 'transparent',
                    color: aspectRatio === '4:3' ? '#fff' : 'var(--color-text)',
                    border: '1px solid var(--color-border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  4:3
                </button>
                <button
                  onClick={() => applyAspectRatio('1:1')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: aspectRatio === '1:1' ? 'var(--color-primary)' : 'transparent',
                    color: aspectRatio === '1:1' ? '#fff' : 'var(--color-text)',
                    border: '1px solid var(--color-border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  1:1
                </button>
                <button
                  onClick={() => applyAspectRatio('3:4')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: aspectRatio === '3:4' ? 'var(--color-primary)' : 'transparent',
                    color: aspectRatio === '3:4' ? '#fff' : 'var(--color-text)',
                    border: '1px solid var(--color-border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  3:4
                </button>
                <button
                  onClick={() => applyAspectRatio('1:2')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: aspectRatio === '1:2' ? 'var(--color-primary)' : 'transparent',
                    color: aspectRatio === '1:2' ? '#fff' : 'var(--color-text)',
                    border: '1px solid var(--color-border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  1:2
                </button>
                <button
                  onClick={() => applyAspectRatio('free')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: aspectRatio === 'free' ? 'var(--color-primary)' : 'transparent',
                    color: aspectRatio === 'free' ? '#fff' : 'var(--color-text)',
                    border: '1px solid var(--color-border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  自由
                </button>
              </div>
            </div>

            {/* 数値入力フォーム */}
            {cropArea && (
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--color-text-light)' }}>
                      X位置 (px)
                    </label>
                    <input
                      type="number"
                      value={cropInputs.x}
                      onChange={(e) => {
                        const newInputs = { ...cropInputs, x: parseInt(e.target.value) || 0 };
                        setCropInputs(newInputs);
                        updateCropAreaFromInputs(newInputs, 'x');
                      }}
                      min={0}
                      max={imageSize?.width || 0}
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: '1px solid var(--color-border-color)',
                        borderRadius: '4px',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--color-text-light)' }}>
                      Y位置 (px)
                    </label>
                    <input
                      type="number"
                      value={cropInputs.y}
                      onChange={(e) => {
                        const newInputs = { ...cropInputs, y: parseInt(e.target.value) || 0 };
                        setCropInputs(newInputs);
                        updateCropAreaFromInputs(newInputs, 'y');
                      }}
                      min={0}
                      max={imageSize?.height || 0}
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: '1px solid var(--color-border-color)',
                        borderRadius: '4px',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--color-text-light)' }}>
                      幅 (px)
                    </label>
                    <input
                      type="number"
                      value={cropInputs.width}
                      onChange={(e) => {
                        const newInputs = { ...cropInputs, width: parseInt(e.target.value) || 0 };
                        setCropInputs(newInputs);
                        updateCropAreaFromInputs(newInputs, 'width');
                      }}
                      min={1}
                      max={imageSize?.width || 0}
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: '1px solid var(--color-border-color)',
                        borderRadius: '4px',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: 'var(--color-text-light)' }}>
                      高さ (px)
                    </label>
                    <input
                      type="number"
                      value={cropInputs.height}
                      onChange={(e) => {
                        const newInputs = { ...cropInputs, height: parseInt(e.target.value) || 0 };
                        setCropInputs(newInputs);
                        updateCropAreaFromInputs(newInputs, 'height');
                      }}
                      min={1}
                      max={imageSize?.height || 0}
                      disabled={aspectRatio !== null && aspectRatio !== 'free'}
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: '1px solid var(--color-border-color)',
                        borderRadius: '4px',
                        fontSize: '13px',
                        backgroundColor: (aspectRatio !== null && aspectRatio !== 'free') ? '#f0f0f0' : '#fff',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <p style={{ color: 'var(--color-text-light)', fontSize: '14px', marginBottom: '16px' }}>
              画像上でドラッグしてトリミング領域を選択できます（選択しない場合は元画像をそのままアップロードします）。
            </p>
            <div
              ref={containerRef}
              style={{
                position: 'relative',
                width: '100%',
                maxHeight: '500px',
                overflow: 'auto',
                border: '1px solid var(--color-border-color)',
                borderRadius: '6px',
                backgroundColor: '#f8f9fa',
                cursor: isDragging ? 'move' : 'crosshair',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="プレビュー"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
              {cropArea && (
                <div style={getCropAreaStyle()}>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-24px',
                      left: 0,
                      color: '#fff',
                      fontSize: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setImageSrc(null);
                  setSelectedFile(null);
                  setCropArea(null);
                  setImageSize(null);
                  setAspectRatio(null);
                  setCropInputs({ x: 0, y: 0, width: 0, height: 0 });
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={uploading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border-color)',
                  borderRadius: '6px',
                  color: 'var(--color-text)',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                別の画像を選択
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid #dc3545',
            borderRadius: '6px',
            color: '#dc3545',
            fontSize: '14px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {uploadProgress && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            border: '1px solid #28a745',
            borderRadius: '6px',
            color: '#28a745',
            fontSize: '14px',
            marginBottom: '16px',
          }}>
            {uploadProgress}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => router.push(`/business-plan/services/${serviceId}/${conceptId}/overview`)}
            disabled={uploading}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border-color)',
              borderRadius: '6px',
              color: 'var(--color-text)',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            キャンセル
          </button>
          {imageSrc && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--color-primary)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {uploading ? 'アップロード中...' : 'アップロード'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
