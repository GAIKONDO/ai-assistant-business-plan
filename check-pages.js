// ブラウザのコンソールで実行するスクリプト
// このコードをブラウザのコンソールに貼り付けて実行してください

(async () => {
  const planId = '4qYKvU1hFuSBgtuTWPDC';
  const subMenuId = 'overview';
  
  try {
    // Firebase SDKが既に読み込まれていることを前提とします
    const { doc, getDoc } = await import('firebase/firestore');
    
    // dbとauthは既にグローバルに存在することを前提とします
    // 実際のアプリケーションでは、@/lib/firebaseからインポートする必要があります
    
    console.log('=== ページ数確認開始 ===');
    console.log('planId:', planId);
    console.log('subMenuId:', subMenuId);
    
    // 注意: このスクリプトは、アプリケーションのコンテキスト内で実行する必要があります
    // 実際には、ブラウザのコンソールで以下のように実行してください：
    
    const script = `
// ブラウザのコンソールで実行してください
(async () => {
  const planId = '4qYKvU1hFuSBgtuTWPDC';
  const subMenuId = 'overview';
  
  // Firebase SDKが既に読み込まれていることを前提とします
  // 実際のアプリケーションでは、以下のようにインポートする必要があります：
  // import { doc, getDoc } from 'firebase/firestore';
  // import { db } from '@/lib/firebase';
  
  // ただし、ブラウザのコンソールでは直接インポートできないため、
  // アプリケーションのコンテキスト内で実行する必要があります
  
  console.log('このスクリプトは、アプリケーションのコンテキスト内で実行してください。');
  console.log('または、以下のコードをPageOrderManagerコンポーネント内に追加してください：');
})();
`;
    
    console.log(script);
  } catch (error) {
    console.error('エラー:', error);
  }
})();

