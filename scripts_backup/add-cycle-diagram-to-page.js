// page-migrated-1764527302738-overview-1ページにAI-driven Self-reinforcing Business Loopの画像を追加
// ブラウザのコンソールで実行してください
// このスクリプトは、現在のページからp5.jsのキャンバスを取得し、Firebase Storageにアップロードしてからページコンポーネントに追加します

(async function() {
  const { db, auth, storage } = await import('/lib/firebase');
  const { doc, getDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  
  if (!auth?.currentUser || !db || !storage) {
    console.error('認証されていないか、Firebaseが初期化されていません');
    return;
  }

  const planId = '9pu2rwOCRjG5gxmqX2tO'; // URLから取得
  const subMenuId = 'overview';
  const targetPageId = 'page-migrated-1764527302738-overview-1';

  try {
    // 1. 現在のページからp5.jsのキャンバスを取得
    console.log('キャンバスを検索中...');
    
    // すべてのcanvas要素を取得
    const allCanvases = document.querySelectorAll('canvas');
    console.log(`見つかったcanvas要素の数: ${allCanvases.length}`);
    
    // AI-driven Self-reinforcing Business Loopのキャンバスを探す
    // タイトル「AI-driven Self-reinforcing Business Loop」の近くにあるcanvasを探す
    let canvas = null;
    
    // 方法1: タイトル要素の近くのcanvasを探す
    const titles = Array.from(document.querySelectorAll('p')).filter(p => 
      p.textContent && p.textContent.includes('AI-driven Self-reinforcing Business Loop')
    );
    
    if (titles.length > 0) {
      const title = titles[0];
      // タイトルの前にあるcanvas要素を探す
      let currentElement = title.previousElementSibling;
      while (currentElement) {
        const foundCanvas = currentElement.querySelector('canvas');
        if (foundCanvas) {
          canvas = foundCanvas;
          break;
        }
        currentElement = currentElement.previousElementSibling;
      }
    }
    
    // 方法2: 見つからない場合は、最初のcanvasを使用（通常はcycleDiagramRefのcanvas）
    if (!canvas && allCanvases.length > 0) {
      // サイズが適切なcanvasを選択（400x350程度）
      canvas = Array.from(allCanvases).find(c => {
        const width = c.width || c.clientWidth;
        const height = c.height || c.clientHeight;
        return width >= 300 && width <= 500 && height >= 300 && height <= 400;
      }) || allCanvases[0];
    }
    
    if (!canvas) {
      console.error('キャンバスが見つかりません。ページにAI-driven Self-reinforcing Business Loopが表示されていることを確認してください。');
      console.log('利用可能なcanvas要素:', Array.from(allCanvases).map(c => ({
        width: c.width || c.clientWidth,
        height: c.height || c.clientHeight
      })));
      return;
    }

    console.log('キャンバスを発見:', canvas);
    console.log('キャンバスサイズ:', canvas.width, 'x', canvas.height);

    // 2. キャンバスを画像データに変換
    const imageData = canvas.toDataURL('image/png');
    console.log('画像データを取得しました');

    // 3. Base64データをBlobに変換
    const response = await fetch(imageData);
    const blob = await response.blob();
    console.log('Blobを作成しました');

    // 4. Firebase Storageにアップロード
    const fileName = `cycle-diagram-${Date.now()}.png`;
    const storageRef = ref(storage, `companyBusinessPlan/${planId}/${fileName}`);
    console.log('Firebase Storageにアップロード中...');
    
    await uploadBytes(storageRef, blob);
    console.log('アップロード完了');

    // 5. ダウンロードURLを取得
    const downloadURL = await getDownloadURL(storageRef);
    console.log('ダウンロードURLを取得:', downloadURL);

    // 6. 事業計画を取得
    const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
    if (!planDoc.exists()) {
      console.error('事業計画が見つかりません');
      return;
    }

    const planData = planDoc.data();
    const pagesBySubMenu = planData.pagesBySubMenu || {};
    const pages = pagesBySubMenu[subMenuId] || [];

    // 7. 対象のページを検索
    const targetPage = pages.find((page) => page.id === targetPageId);
    if (!targetPage) {
      console.error(`ページ ${targetPageId} が見つかりません`);
      console.log('利用可能なページID:', pages.map((p) => p.id));
      return;
    }

    console.log('対象ページを発見:', targetPage);

    // 8. 画像を含むHTMLコンテンツを作成
    const imageHTML = `
<div style="margin-bottom: 32px; text-align: center;">
  <div style="display: inline-block; position: relative; width: 100%; max-width: 400px;">
    <img 
      src="${downloadURL}" 
      alt="AI-driven Self-reinforcing Business Loop"
      style="width: 100%; height: auto; display: block; margin: 0 auto;"
      loading="lazy"
    />
  </div>
  <p style="font-size: 13px; color: var(--color-text); margin-top: 16px; font-weight: 500; text-align: center; letter-spacing: 0.5px">
    AI-driven Self-reinforcing Business Loop
  </p>
  <p style="font-size: 10px; color: var(--color-text-light); margin-top: 12px; font-style: italic; text-align: center">
    出典: マルコ・イアンシティ; カリム・R・ラカーニ; 吉田素文、AIファースト・カンパニー: アルゴリズムとネットワークが経済を支配する新時代の経営戦略(p.234). 英治出版株式会社.
  </p>
</div>
`;

    // 9. 既存のコンテンツに画像を追加
    const updatedContent = (targetPage.content || '') + imageHTML;

    // 10. ページを更新
    const updatedPages = pages.map((page) => 
      page.id === targetPageId 
        ? { ...page, content: updatedContent }
        : page
    );

    // 11. Firestoreに保存
    await updateDoc(doc(db, 'companyBusinessPlan', planId), {
      [`pagesBySubMenu.${subMenuId}`]: updatedPages,
      updatedAt: serverTimestamp()
    });

    console.log('✅ 画像を追加しました！');
    console.log('📸 画像URL:', downloadURL);
    console.log('🔄 ページをリロードしてください。');
  } catch (error) {
    console.error('❌ エラー:', error);
  }
})();

