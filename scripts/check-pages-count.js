// Firestoreからページ数を確認するスクリプト
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Firebase設定（環境変数から取得するか、直接設定）
const firebaseConfig = {
  // ここにFirebase設定を追加
  // 実際の設定は.env.localなどから読み込む必要があります
};

// このスクリプトはブラウザのコンソールで実行することを想定しています
// または、Firebase Admin SDKを使用する必要があります

console.log('このスクリプトはブラウザのコンソールで実行してください。');
console.log('以下のコードをブラウザのコンソールに貼り付けて実行してください：');

const script = `
(async () => {
  const planId = '4qYKvU1hFuSBgtuTWPDC';
  const subMenuId = 'overview';
  
  // Firebase SDKが既に読み込まれていることを前提とします
  const { doc, getDoc } = await import('firebase/firestore');
  const { db } = await import('@/lib/firebase');
  
  try {
    const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
    
    if (planDoc.exists()) {
      const data = planDoc.data();
      const pagesBySubMenu = data.pagesBySubMenu || {};
      const pageOrderBySubMenu = data.pageOrderBySubMenu || {};
      
      const currentSubMenuPages = pagesBySubMenu[subMenuId] || [];
      const currentSubMenuPageOrder = pageOrderBySubMenu[subMenuId] || [];
      
      console.log('=== ページ数確認 ===');
      console.log('planId:', planId);
      console.log('subMenuId:', subMenuId);
      console.log('pagesBySubMenu[overview]のページ数:', currentSubMenuPages.length);
      console.log('pageOrderBySubMenu[overview]の順序数:', currentSubMenuPageOrder.length);
      console.log('ページID一覧:', currentSubMenuPageOrder);
      console.log('ページデータ:', currentSubMenuPages.map(p => ({ id: p.id, title: p.title })));
      console.log('==================');
    } else {
      console.log('事業計画が見つかりませんでした。');
    }
  } catch (error) {
    console.error('エラー:', error);
  }
})();
`;

console.log(script);

