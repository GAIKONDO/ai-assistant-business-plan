// page-migrated-1764527302738-overview-1ページの画像を適切な位置とサイズに調整
// ブラウザのコンソールで実行してください

(async function() {
  const { db, auth } = await import('/lib/firebase');
  const { doc, getDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  
  if (!auth?.currentUser || !db) {
    console.error('認証されていません');
    return;
  }

  const planId = '9pu2rwOCRjG5gxmqX2tO';
  const subMenuId = 'overview';
  const targetPageId = 'page-migrated-1764527302738-overview-1';

  try {
    // 事業計画を取得
    const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
    if (!planDoc.exists()) {
      console.error('事業計画が見つかりません');
      return;
    }

    const planData = planDoc.data();
    const pagesBySubMenu = planData.pagesBySubMenu || {};
    const pages = pagesBySubMenu[subMenuId] || [];

    // 対象のページを検索
    const targetPage = pages.find((page) => page.id === targetPageId);
    if (!targetPage) {
      console.error(`ページ ${targetPageId} が見つかりません`);
      console.log('利用可能なページID:', pages.map((p) => p.id));
      return;
    }

    console.log('対象ページを発見:', targetPage);
    console.log('現在のコンテンツ:', targetPage.content);

    let updatedContent = targetPage.content || '';

    // すべてのimgタグを検索
    const imgRegex = /<img\s+([^>]*?)>/gi;
    const matches = [];
    let match;
    
    while ((match = imgRegex.exec(updatedContent)) !== null) {
      matches.push({
        index: match.index,
        tag: match[0],
        attributes: match[1]
      });
    }
    
    console.log(`見つかった画像の数: ${matches.length}`);

    if (matches.length === 0) {
      console.warn('画像が見つかりませんでした。');
      return;
    }

    // 各画像を適切な位置とサイズに調整（後ろから処理してインデックスがずれないように）
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const imgTag = match.tag;
      const imgAttributes = match.attributes;
      
      console.log(`画像 ${i + 1} を調整中...`);
      console.log(`画像タグ: ${imgTag}`);

      // src属性を抽出
      const srcMatch = imgAttributes.match(/src=["']([^"']+)["']/i);
      const src = srcMatch ? srcMatch[1] : '';
      console.log(`画像URL: ${src}`);

      if (!src) {
        console.warn('画像のsrc属性が見つかりません。スキップします。');
        continue;
      }

      // AI-driven Self-reinforcing Business Loopの画像かどうかを判定
      const isCycleDiagram = src && (
        src.includes('cycle-diagram') || 
        src.includes('Self-reinforcing') ||
        src.includes('Business-Loop')
      );

      let replacement = '';

      if (isCycleDiagram) {
        // AI-driven Self-reinforcing Business Loopの画像の場合
        // 中央揃え、適切なサイズ、タイトルと出典情報を含むコンテナで囲む
        replacement = `
<div style="margin-bottom: 32px; text-align: center;">
  <div style="display: inline-block; position: relative; width: 100%; max-width: 400px; margin: 0 auto;">
    <img src="${src}" alt="AI-driven Self-reinforcing Business Loop" style="width: 100%; height: auto; display: block; margin: 0 auto;" />
    <p style="font-size: 13px; color: var(--color-text); margin-top: 16px; font-weight: 500; text-align: center; letter-spacing: 0.5px">
      AI-driven Self-reinforcing Business Loop
    </p>
    <p style="font-size: 10px; color: var(--color-text-light); margin-top: 12px; font-style: italic; text-align: center">
      出典: マルコ・イアンシティ; カリム・R・ラカーニ; 吉田素文、AIファースト・カンパニー: アルゴリズムとネットワークが経済を支配する新時代の経営戦略(p.234). 英治出版株式会社.
    </p>
  </div>
</div>`;
      } else {
        // その他の画像の場合
        // 中央揃え、適切なサイズに調整
        replacement = `
<div style="margin: 24px 0; text-align: center;">
  <img src="${src}" alt="アップロード画像" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />
</div>`;
      }

      // 元の画像タグを置き換え
      updatedContent = updatedContent.substring(0, match.index) + replacement + updatedContent.substring(match.index + imgTag.length);
    }
    console.log('更新後のコンテンツ:', updatedContent);

    // ページを更新
    const updatedPages = pages.map((page) => 
      page.id === targetPageId 
        ? { ...page, content: updatedContent }
        : page
    );

    // Firestoreに保存
    await updateDoc(doc(db, 'companyBusinessPlan', planId), {
      [`pagesBySubMenu.${subMenuId}`]: updatedPages,
      updatedAt: serverTimestamp()
    });

    console.log('✅ 画像の位置とサイズを調整しました！');
    console.log('🔄 ページをリロードしてください。');
  } catch (error) {
    console.error('❌ エラー:', error);
  }
})();

