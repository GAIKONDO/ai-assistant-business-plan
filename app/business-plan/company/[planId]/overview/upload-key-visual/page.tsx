'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, storage, db } from '@/lib/firebase';
import Layout from '@/components/Layout';

export default function UploadKeyVisualPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('ファイル選択:', file.name, file.size, 'bytes');

    if (!auth?.currentUser || !storage || !db) {
      const missing = [];
      if (!auth?.currentUser) missing.push('認証');
      if (!storage) missing.push('Storage');
      if (!db) missing.push('Firestore');
      setError(`Firebaseが初期化されていません: ${missing.join(', ')}`);
      console.error('Firebase初期化エラー:', { auth: !!auth?.currentUser, storage: !!storage, db: !!db });
      return;
    }

    // 画像ファイルのみ許可
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください。');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress('画像をアップロード中...');
    console.log('アップロード開始:', `business-plans/${planId}/key-visual.png`);

    try {
      // Firebase Storageにアップロード
      const storageRef = ref(storage, `business-plans/${planId}/key-visual.png`);
      console.log('Storage参照作成完了');
      
      console.log('uploadBytes開始...');
      const uploadStartTime = Date.now();
      await uploadBytes(storageRef, file);
      const uploadEndTime = Date.now();
      console.log(`uploadBytes完了: ${uploadEndTime - uploadStartTime}ms`);
      
      setUploadProgress('画像のURLを取得中...');
      console.log('getDownloadURL開始...');
      const urlStartTime = Date.now();
      const downloadURL = await getDownloadURL(storageRef);
      const urlEndTime = Date.now();
      console.log(`getDownloadURL完了: ${urlEndTime - urlStartTime}ms, URL: ${downloadURL}`);

      // FirestoreにURLを保存
      setUploadProgress('データベースに保存中...');
      console.log('Firestore更新開始...');
      const firestoreStartTime = Date.now();
      await updateDoc(doc(db, 'companyBusinessPlan', planId), {
        keyVisualUrl: downloadURL,
        updatedAt: serverTimestamp(),
      });
      const firestoreEndTime = Date.now();
      console.log(`Firestore更新完了: ${firestoreEndTime - firestoreStartTime}ms`);

      setUploadProgress('アップロード完了！');
      
      // 2秒後に概要ページに戻る
      setTimeout(() => {
        router.push(`/business-plan/company/${planId}/overview`);
      }, 2000);
    } catch (err: any) {
      console.error('アップロードエラー詳細:', {
        code: err.code,
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      setError(`アップロードに失敗しました: ${err.code || err.message || '不明なエラー'}`);
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '24px' }}>キービジュアル画像をアップロード</h2>
        
        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: 'var(--color-text-light)', fontSize: '14px', marginBottom: '16px' }}>
            事業計画のキービジュアル画像を選択してください。
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
            onClick={() => router.push(`/business-plan/company/${planId}/overview`)}
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
        </div>
      </div>
    </Layout>
  );
}

