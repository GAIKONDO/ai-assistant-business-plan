// ブラウザのコンソールで実行するコード
// 事業企画ページ（/business-plan）を開いて、このコードをコンソールに貼り付けて実行してください

(async () => {
  try {
    const { db, auth } = await import('/lib/firebase.ts');
    
    if (!auth?.currentUser || !db) {
      console.error('認証されていません。ログインしてください。');
      return;
    }
    
    const userId = auth.currentUser.uid;
    console.log('ユーザーID:', userId);
    
    const { doc, getDoc, deleteDoc } = await import('firebase/firestore');
    
    // 削除するプロジェクトID
    const projectIdToDelete = '2g4wQ5PqEqEkMywI2nMV';
    
    console.log(`プロジェクトID "${projectIdToDelete}" を確認中...\n`);
    
    // プロジェクトを取得
    const projectDoc = await getDoc(doc(db, 'businessProjects', projectIdToDelete));
    
    if (!projectDoc.exists()) {
      console.log(`プロジェクトID "${projectIdToDelete}" は存在しません。`);
      return;
    }
    
    const projectData = projectDoc.data();
    
    // プロジェクト情報を表示
    console.log('削除対象のプロジェクト情報:');
    console.log(`  ID: ${projectDoc.id}`);
    console.log(`  名前: ${projectData.name || '(未設定)'}`);
    console.log(`  説明: ${projectData.description || '(未設定)'}`);
    console.log(`  userId: ${projectData.userId || '(なし)'}`);
    console.log(`  serviceId: ${projectData.serviceId || '(なし)'}`);
    console.log(`  isFixed: ${projectData.isFixed ? 'true' : 'false'}`);
    console.log('');
    
    // ユーザーIDの確認
    if (projectData.userId !== userId) {
      console.error('エラー: このプロジェクトはあなたのものではありません。');
      return;
    }
    
    // 確認
    const confirmed = confirm(`プロジェクト "${projectData.name || projectIdToDelete}" を削除しますか？\n\nこの操作は取り消せません。`);
    
    if (!confirmed) {
      console.log('削除をキャンセルしました。');
      return;
    }
    
    // 削除実行
    console.log('削除中...');
    await deleteDoc(doc(db, 'businessProjects', projectIdToDelete));
    
    console.log('✅ プロジェクトの削除が完了しました。');
    
    // 削除後の確認
    const verifyDoc = await getDoc(doc(db, 'businessProjects', projectIdToDelete));
    if (!verifyDoc.exists()) {
      console.log('✅ 確認: プロジェクトは完全に削除されました。');
    } else {
      console.warn('⚠️ 警告: プロジェクトがまだ存在しています。');
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
})();

