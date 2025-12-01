// このスクリプトは、public/typography-art (3).pngをFirebase Storageにアップロードします
// 使用方法: npx ts-node scripts/upload-key-visual.ts <planId>

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ai-assistant-company.firebaseapp.com',
  projectId: "ai-assistant-company",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ai-assistant-company.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

async function uploadKeyVisual(planId: string) {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const storage = getStorage(app);
  const db = getFirestore(app);

  // 環境変数から認証情報を取得（必要に応じて）
  const email = process.env.FIREBASE_ADMIN_EMAIL || '';
  const password = process.env.FIREBASE_ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.error('環境変数FIREBASE_ADMIN_EMAILとFIREBASE_ADMIN_PASSWORDを設定してください。');
    process.exit(1);
  }

  try {
    // 認証
    console.log('Firebaseに認証中...');
    await signInWithEmailAndPassword(auth, email, password);

    // 画像ファイルを読み込む
    const imagePath = path.join(process.cwd(), 'public', 'typography-art (3).png');
    if (!fs.existsSync(imagePath)) {
      console.error(`画像ファイルが見つかりません: ${imagePath}`);
      process.exit(1);
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    // Firebase Storageにアップロード
    console.log('Firebase Storageにアップロード中...');
    const storageRef = ref(storage, `business-plans/${planId}/key-visual.png`);
    await uploadBytes(storageRef, blob);

    // ダウンロードURLを取得
    console.log('ダウンロードURLを取得中...');
    const downloadURL = await getDownloadURL(storageRef);

    // FirestoreにURLを保存
    console.log('Firestoreに保存中...');
    await updateDoc(doc(db, 'companyBusinessPlan', planId), {
      keyVisualUrl: downloadURL,
      updatedAt: new Date(),
    });

    console.log('✅ アップロード完了！');
    console.log(`画像URL: ${downloadURL}`);
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

const planId = process.argv[2];
if (!planId) {
  console.error('使用方法: npx ts-node scripts/upload-key-visual.ts <planId>');
  process.exit(1);
}

uploadKeyVisual(planId);

