// 固定ページ形式に戻すスクリプト
// ブラウザのコンソールで実行してください

(async () => {
  const planId = '9pu2rwOCRjG5gxmqX2t0'; // 11/24に作成した事業計画のID
  
  const { doc, getDoc, updateDoc, deleteField } = await import('firebase/firestore');
  const { db, auth } = await import('@/lib/firebase');
  
  if (!auth?.currentUser || !db) {
    console.error('認証されていないか、Firebaseが初期化されていません');
    return;
  }
  
  try {
    // 事業計画を取得
    const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
    
    if (!planDoc.exists()) {
      console.error('事業計画が見つかりませんでした。');
      return;
    }
    
    const data = planDoc.data();
    console.log('現在のデータ:');
    console.log('  pagesBySubMenu:', data.pagesBySubMenu);
    console.log('  pageOrderBySubMenu:', data.pageOrderBySubMenu);
    
    // 確認
    if (!confirm(`事業計画「${data.title}」から pagesBySubMenu と pageOrderBySubMenu を削除して固定ページ形式に戻しますか？`)) {
      console.log('キャンセルされました。');
      return;
    }
    
    // pagesBySubMenu と pageOrderBySubMenu を削除
    await updateDoc(doc(db, 'companyBusinessPlan', planId), {
      pagesBySubMenu: deleteField(),
      pageOrderBySubMenu: deleteField(),
    });
    
    console.log('✅ 固定ページ形式に戻しました！');
    console.log('ページをリロードしてください。');
    
  } catch (error) {
    console.error('エラー:', error);
  }
})();

