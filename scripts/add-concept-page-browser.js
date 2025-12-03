/**
 * ブラウザのコンソールで実行するコード
 * 
 * 構想のoverviewページに新しいコンテナを追加し、2ページ目にします
 * 
 * 使用方法:
 * 1. ブラウザで該当ページを開く: http://localhost:3005/business-plan/services/own-service/concept-1764780734434/overview
 * 2. 開発者ツールのコンソールを開く（F12）
 * 3. 以下のコードを貼り付けて実行
 * 
 * 注意: このコードはNext.jsのページ上で実行する必要があります（Firebaseが既に読み込まれている必要があります）
 */

(async function() {
  const serviceId = 'own-service';
  const conceptId = 'concept-1764780734434';
  const subMenuId = 'overview';
  const pageNumber = 1; // 2ページ目（0ベースなので1）
  const title = '新しいコンテナ';
  const content = '<p>新しいコンテナのコンテンツをここに入力してください。</p>';

  try {
    // グローバルに読み込まれているFirebaseモジュールを使用
    // Next.jsのページでは既にFirebaseが読み込まれている
    const firebase = window.firebase || (await import('firebase/app')).default;
    const firestore = await import('firebase/firestore');
    
    // dbとauthは既にページに読み込まれているはず
    // もし読み込まれていない場合は、手動でインポートする必要があります
    console.log('Firebaseモジュールを確認中...');
    
    // より確実な方法: ページのコンポーネントから直接Firestoreにアクセス
    // このコードは、ページが既にFirebaseを初期化していることを前提としています

    // 構想ドキュメントを取得
    const conceptsQuery = query(
      collection(db, 'concepts'),
      where('userId', '==', auth.currentUser.uid),
      where('serviceId', '==', serviceId),
      where('conceptId', '==', conceptId)
    );

    const conceptsSnapshot = await getDocs(conceptsQuery);

    if (conceptsSnapshot.empty) {
      console.error('❌ 構想が見つかりませんでした。');
      return;
    }

    const conceptDoc = conceptsSnapshot.docs[0];
    const conceptData = conceptDoc.data();

    // サブメニューごとのページデータを取得
    const pagesBySubMenu = conceptData.pagesBySubMenu || {};
    const pageOrderBySubMenu = conceptData.pageOrderBySubMenu || {};

    // overviewサブメニューのページデータを取得
    const overviewPages = pagesBySubMenu[subMenuId] || [];
    const overviewPageOrder = pageOrderBySubMenu[subMenuId] || [];

    console.log(`現在のページ数: ${overviewPages.length}`);
    console.log(`現在のページ順序:`, overviewPageOrder);

    // 新しいページIDを生成
    const newPageId = `page-${Date.now()}`;

    // ページ番号を決定（2ページ目なので1）
    const targetPageNumber = pageNumber;

    // 指定されたページ番号以降のページを1つずつずらす
    const updatedPages = overviewPages.map(page => {
      if (page.pageNumber >= pageNumber) {
        return { ...page, pageNumber: page.pageNumber + 1 };
      }
      return page;
    });

    // 新しいページを作成
    const newPage = {
      id: newPageId,
      pageNumber: targetPageNumber,
      title: title.trim(),
      content: content.trim() || '<p>コンテンツを入力してください。</p>',
      createdAt: new Date().toISOString(),
    };

    // ページを指定された位置に挿入
    updatedPages.splice(pageNumber, 0, newPage);

    // ページ順序も更新
    const updatedPageOrder = [...overviewPageOrder];
    updatedPageOrder.splice(pageNumber, 0, newPageId);

    // 更新データを準備
    const updatedPagesBySubMenu = {
      ...pagesBySubMenu,
      [subMenuId]: updatedPages,
    };

    const updatedPageOrderBySubMenu = {
      ...pageOrderBySubMenu,
      [subMenuId]: updatedPageOrder,
    };

    // Firestoreに保存
    await updateDoc(doc(db, 'concepts', conceptDoc.id), {
      pagesBySubMenu: updatedPagesBySubMenu,
      pageOrderBySubMenu: updatedPageOrderBySubMenu,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ ページを追加しました: ${newPageId}`);
    console.log(`   タイトル: ${title}`);
    console.log(`   ページ番号: ${targetPageNumber}`);
    console.log(`   総ページ数: ${updatedPages.length}`);
    console.log(`   更新されたページ順序:`, updatedPageOrder);

    // ページをリロードして変更を反映
    console.log('🔄 ページをリロードします...');
    window.location.reload();

  } catch (error) {
    console.error('❌ エラー:', error);
  }
})();

