// page-1764467460467ページのコンテンツを「はじめに」の内容に更新
// ブラウザのコンソールで実行してください

(async function() {
  const { db, auth } = await import('/lib/firebase');
  const { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  
  if (!auth?.currentUser || !db) {
    console.error('認証されていません');
    return;
  }

  const userId = auth.currentUser.uid;
  const serviceId = 'own-service';
  const conceptId = 'maternity-support-componentized';
  const subMenuId = 'overview';
  const targetPageId = 'page-1764467460467';

  // 「はじめに」のコンテンツ（HTML形式）
  const introductionContent = `<div style="margin-bottom: 40px">
  <div style="margin-bottom: 48px; text-align: center">
    <h2 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #1F2937; line-height: 1.4; letter-spacing: -0.5px">
      なぜ出産・育児世代は同じ課題や悩みを経験しなければならないのか?
    </h2>
    <p style="margin: 0; font-size: 18px; font-weight: 500; color: #6B7280; letter-spacing: 0.3px; line-height: 1.6">
      ノウハウが共有化されず、出産・育児世代の負担になっている
    </p>
  </div>

  <!-- 3つの問題カード -->
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 48px">
    <!-- 精神的な不安 -->
    <div style="background: #FEF2F2; border-radius: 12px; padding: 24px; position: relative">
      <div style="position: absolute; top: 12px; right: 12px; background: #FCA5A5; color: #991B1B; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600">
        精神的な不安
      </div>
      <div style="width: 64px; height: 64px; background: #FEE2E2; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px">
        <div style="font-size: 32px; color: #F87171; font-weight: 700">$</div>
      </div>
      <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1F2937; line-height: 1.4">
        情報不足による精神的な不安
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #4B5563; line-height: 1.8; font-size: 14px">
        <li>そもそも選択肢があることを知らない</li>
        <li>出産・育児への不安や孤立感が生まれる</li>
      </ul>
    </div>

    <!-- 経済的な不安 -->
    <div style="background: #FFFBEB; border-radius: 12px; padding: 24px; position: relative">
      <div style="position: absolute; top: 12px; right: 12px; background: #FCD34D; color: #92400E; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600">
        経済的な不安
      </div>
      <div style="width: 64px; height: 64px; background: #FEF3C7; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px">
        <div style="font-size: 32px; color: #F59E0B; font-weight: 700">$</div>
      </div>
      <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1F2937; line-height: 1.4">
        費用の見通しが立たない不安
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #4B5563; line-height: 1.8; font-size: 14px">
        <li>子育てにかかる費用がわからない</li>
        <li>支援制度を活用できず経済的な不安が続く</li>
      </ul>
    </div>

    <!-- 見通しの不安 -->
    <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; position: relative">
      <div style="position: absolute; top: 12px; right: 12px; background: #D1D5DB; color: #374151; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600">
        見通しの不安
      </div>
      <div style="width: 64px; height: 64px; background: #F3F4F6; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px">
        <div style="font-size: 32px; color: #9CA3AF; font-weight: 700">⏰</div>
      </div>
      <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1F2937; line-height: 1.4">
        いつ何をすればいいかわからない不安
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #4B5563; line-height: 1.8; font-size: 14px">
        <li>計画が立てられず準備ができない</li>
        <li>申請タイミングを見逃す不安が続く</li>
      </ul>
    </div>
  </div>

  <!-- 解決策セクション -->
  <div style="background: #F9FAFB; border-radius: 12px; padding: 32px">
    <div style="display: flex; align-items: center; margin-bottom: 32px">
      <div style="width: 48px; height: 48px; background: #1F2937; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0">
        <div style="color: white; font-size: 24px; font-weight: 700">✓</div>
      </div>
      <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #1F2937; line-height: 1.4">
        パーソナルな情報分析とワンストップサービスにより、一人ひとりに最適な支援を提供
      </h2>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px">
      <div>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1F2937">
          情報の一元管理
        </h3>
        <p style="margin: 0; color: #4B5563; line-height: 1.6; font-size: 14px">
          分散した支援制度を一箇所に集約
        </p>
      </div>
      <div>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1F2937">
          パーソナル分析
        </h3>
        <p style="margin: 0; color: #4B5563; line-height: 1.6; font-size: 14px">
          個人の状況に合わせた最適な支援を提案
        </p>
      </div>
      <div>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1F2937">
          ワンストップサービス
        </h3>
        <p style="margin: 0; color: #4B5563; line-height: 1.6; font-size: 14px">
          申請から利用まで一貫してサポート
        </p>
      </div>
    </div>
  </div>
</div>`;

  try {
    const conceptsQuery = query(
      collection(db, 'concepts'),
      where('userId', '==', userId),
      where('serviceId', '==', serviceId),
      where('conceptId', '==', conceptId)
    );
    
    const conceptsSnapshot = await getDocs(conceptsQuery);
    
    if (conceptsSnapshot.empty) {
      console.error('構想ドキュメントが見つかりません');
      return;
    }

    const conceptDoc = conceptsSnapshot.docs[0];
    const conceptData = conceptDoc.data();
    
    console.log('構想データ:', conceptData);
    
    // サブメニューごとのページデータを取得
    const pagesBySubMenu = conceptData.pagesBySubMenu || {};
    console.log('pagesBySubMenu:', pagesBySubMenu);
    
    const currentSubMenuPages = pagesBySubMenu[subMenuId] || [];
    console.log(`サブメニュー ${subMenuId} のページ:`, currentSubMenuPages);

    // page-1764467460467ページを検索
    const targetPageIndex = currentSubMenuPages.findIndex(
      (page) => page.id === targetPageId
    );

    if (targetPageIndex === -1) {
      console.warn(`ページ ${targetPageId} が見つかりません。新規作成します。`);
      console.log('利用可能なページ:', currentSubMenuPages.map(p => `${p.id} (${p.title})`));
      
      // ページが存在しない場合は新規作成
      const newPage = {
        id: targetPageId,
        pageNumber: currentSubMenuPages.length,
        title: 'はじめに',
        content: introductionContent,
        createdAt: new Date().toISOString(),
      };
      
      const updatedPages = [...currentSubMenuPages, newPage];
      
      // ページ順序にも追加
      const pageOrderBySubMenu = conceptData.pageOrderBySubMenu || {};
      const currentSubMenuPageOrder = pageOrderBySubMenu[subMenuId] || [];
      const updatedPageOrder = [...currentSubMenuPageOrder, targetPageId];
      
      const updatedPagesBySubMenu = {
        ...pagesBySubMenu,
        [subMenuId]: updatedPages,
      };
      
      const updatedPageOrderBySubMenu = {
        ...pageOrderBySubMenu,
        [subMenuId]: updatedPageOrder,
      };
      
      await updateDoc(doc(db, 'concepts', conceptDoc.id), {
        pagesBySubMenu: updatedPagesBySubMenu,
        pageOrderBySubMenu: updatedPageOrderBySubMenu,
        updatedAt: serverTimestamp(),
      });
      
      console.log(`✅ ページ ${targetPageId} を新規作成しました`);
      console.log('ページをリロードしてください');
      return;
    }

    console.log(`ページ ${targetPageId} が見つかりました:`, currentSubMenuPages[targetPageIndex]);
    console.log('現在のコンテンツ:', currentSubMenuPages[targetPageIndex].content);

    // ページのコンテンツを更新（強制的に上書き）
    const updatedPages = [...currentSubMenuPages];
    updatedPages[targetPageIndex] = {
      ...updatedPages[targetPageIndex],
      content: introductionContent,
    };

    // 更新データを準備
    const updatedPagesBySubMenu = {
      ...pagesBySubMenu,
      [subMenuId]: updatedPages,
    };

    console.log('更新するデータ:', {
      pagesBySubMenu: updatedPagesBySubMenu,
      targetPage: updatedPages[targetPageIndex]
    });

    // Firestoreに保存
    await updateDoc(doc(db, 'concepts', conceptDoc.id), {
      pagesBySubMenu: updatedPagesBySubMenu,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ ページ ${targetPageId} のコンテンツを更新しました`);
    console.log('ページをリロードしてください');
  } catch (error) {
    console.error('❌ エラー:', error);
  }
})();

