// ブラウザのコンソールで実行するコード
// このコードをブラウザのコンソールにコピー＆ペーストして実行してください

(async function() {
  // Firebaseのインポート（既にページで読み込まれている場合）
  const { db } = await import('/lib/firebase.js');
  const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
  
  const planId = '5fMIys3S9yCQNCtEpIDH';
  const subMenuId = 'overview';
  const newPageId = 'page-migrated-1764535589151-0';

  // 伊藤忠商事の「三方良し」についてのコンテンツ
  const itochuContent = `
<div class="page-section-content">
  <div class="key-message-container" style="margin-bottom: 24px;">
    <h2 class="key-message-title">三方良し：持続可能なビジネスの基盤</h2>
    <p class="key-message-subtitle" style="margin-bottom: 20px;">
      伊藤忠商事が150年以上にわたって実践してきた「三方良し」の経営哲学
    </p>
    <p class="body-text-emphasis">
      三方良しとは、「売り手良し、買い手良し、世間良し」という近江商人の経営理念を現代に活かした、持続可能なビジネスモデルの基盤である。
    </p>
  </div>

  <div style="margin-top: 32px; margin-bottom: 32px;">
    <h3 style="font-size: 18px; font-weight: 600; color: var(--color-text); border-left: 3px solid var(--color-primary); padding-left: 8px; margin-bottom: 16px;">
      1. 三方良しの基本概念
    </h3>
    <div style="padding-left: 11px;">
      <p class="body-text" style="margin-bottom: 16px;">
        <strong>売り手良し</strong>：取引の当事者である売り手（供給者）が利益を得られること。持続可能な事業運営のためには、適正な利益の確保が不可欠である。
      </p>
      <p class="body-text" style="margin-bottom: 16px;">
        <strong>買い手良し</strong>：買い手（顧客）が価値ある商品・サービスを適正な価格で得られること。顧客満足の実現は、長期的な関係構築の基盤となる。
      </p>
      <p class="body-text" style="margin-bottom: 16px;">
        <strong>世間良し</strong>：社会全体に貢献し、ステークホルダー全体の利益を考慮すること。社会貢献と企業価値の向上は、持続可能な成長の源泉である。
      </p>
    </div>
  </div>

  <div style="margin-top: 32px; margin-bottom: 32px;">
    <h3 style="font-size: 18px; font-weight: 600; color: var(--color-text); border-left: 3px solid var(--color-primary); padding-left: 8px; margin-bottom: 16px;">
      2. 現代ビジネスにおける重要性
    </h3>
    <div style="padding-left: 11px;">
      <p class="body-text" style="margin-bottom: 16px;">
        グローバル化が進む現代において、三方良しの考え方は、ESG（環境・社会・ガバナンス）経営やSDGs（持続可能な開発目標）の実現と密接に関連している。
      </p>
      <p class="body-text" style="margin-bottom: 16px;">
        短期的な利益追求ではなく、長期的な価値創造を重視する経営姿勢は、投資家やステークホルダーからの信頼を獲得し、企業の持続的な成長を支える。
      </p>
    </div>
  </div>

  <div style="margin-top: 32px; margin-bottom: 32px;">
    <h3 style="font-size: 18px; font-weight: 600; color: var(--color-text); border-left: 3px solid var(--color-primary); padding-left: 8px; margin-bottom: 16px;">
      3. 実践例：伊藤忠商事の取り組み
    </h3>
    <div style="padding-left: 11px;">
      <p class="body-text" style="margin-bottom: 16px;">
        伊藤忠商事は、三方良しの理念を基に、以下のような取り組みを実践している：
      </p>
      <ul style="margin-left: 20px; margin-bottom: 16px;">
        <li class="body-text" style="margin-bottom: 8px;">
          <strong>サプライチェーン全体の価値創造</strong>：原材料調達から最終消費者まで、すべてのステークホルダーに価値を提供するビジネスモデルの構築
        </li>
        <li class="body-text" style="margin-bottom: 8px;">
          <strong>環境配慮型ビジネス</strong>：再生可能エネルギー、環境技術、持続可能な農業など、環境に配慮した事業領域への投資
        </li>
        <li class="body-text" style="margin-bottom: 8px;">
          <strong>地域社会への貢献</strong>：現地雇用の創出、地域経済の活性化、文化・教育支援など、事業展開地域への貢献活動
        </li>
      </ul>
    </div>
  </div>

  <div style="margin-top: 32px; margin-bottom: 32px;">
    <h3 style="font-size: 18px; font-weight: 600; color: var(--color-text); border-left: 3px solid var(--color-primary); padding-left: 8px; margin-bottom: 16px;">
      4. AIファーストカンパニーとの関連性
    </h3>
    <div style="padding-left: 11px;">
      <p class="body-text" style="margin-bottom: 16px;">
        AIファーストカンパニーにおいても、三方良しの考え方は重要な指針となる。AI技術の活用により、以下のような価値創造が可能となる：
      </p>
      <ul style="margin-left: 20px; margin-bottom: 16px;">
        <li class="body-text" style="margin-bottom: 8px;">
          <strong>効率化によるコスト削減</strong>：AIによる業務効率化により、顧客により良い価格でサービスを提供可能
        </li>
        <li class="body-text" style="margin-bottom: 8px;">
          <strong>パーソナライズされた価値提供</strong>：データ分析により、顧客一人ひとりに最適化されたサービスを提供
        </li>
        <li class="body-text" style="margin-bottom: 8px;">
          <strong>社会課題の解決</strong>：AI技術を活用した社会課題の解決により、社会全体に価値を提供
        </li>
      </ul>
    </div>
  </div>

  <div style="margin-top: 32px; margin-bottom: 32px; padding-left: 11px;">
    <p class="body-text-small" style="font-style: italic; color: var(--color-text-light);">
      三方良しの理念は、単なる経営哲学ではなく、持続可能なビジネスを実現するための実践的な指針である。すべてのステークホルダーに価値を提供することで、長期的な成功と成長を実現できる。
    </p>
  </div>
</div>
`;

  try {
    // 既存のFirebaseインスタンスを使用
    // このコードは、既にFirebaseが初期化されているページで実行する必要があります
    const { db } = window; // グローバルスコープから取得を試みる
    
    // もしグローバルスコープにない場合は、モジュールからインポート
    if (!db) {
      const firebaseModule = await import('@/lib/firebase');
      const db = firebaseModule.db;
    }
    
    const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
    
    // 事業計画ドキュメントを取得
    const planRef = doc(db, 'companyBusinessPlan', planId);
    const planDoc = await getDoc(planRef);
    
    if (!planDoc.exists()) {
      console.error('事業計画が見つかりませんでした。');
      return;
    }

    const planData = planDoc.data();
    
    // サブメニューごとのページデータを取得
    const pagesBySubMenu = planData.pagesBySubMenu || {};
    const pageOrderBySubMenu = planData.pageOrderBySubMenu || {};
    
    // 現在のサブメニューのページデータを取得
    const currentSubMenuPages = pagesBySubMenu[subMenuId] || [];
    const currentSubMenuPageOrder = pageOrderBySubMenu[subMenuId] || [];
    
    // 既に同じIDのページが存在するか確認
    const existingPageIndex = currentSubMenuPages.findIndex((p) => p.id === newPageId);
    
    const newPage = {
      id: newPageId,
      pageNumber: currentSubMenuPages.length,
      title: '三方良し：持続可能なビジネスの基盤',
      content: itochuContent.trim(),
      createdAt: new Date().toISOString(),
    };
    
    let updatedPages;
    let updatedPageOrder;
    
    if (existingPageIndex >= 0) {
      // 既存のページを更新
      updatedPages = [...currentSubMenuPages];
      updatedPages[existingPageIndex] = newPage;
      updatedPageOrder = [...currentSubMenuPageOrder];
      console.log('既存のページを更新します:', newPageId);
    } else {
      // 新しいページを追加
      updatedPages = [...currentSubMenuPages, newPage];
      updatedPageOrder = [...currentSubMenuPageOrder, newPageId];
      console.log('新しいページを追加します:', newPageId);
    }
    
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
    await setDoc(
      planRef,
      {
        ...planData,
        pagesBySubMenu: updatedPagesBySubMenu,
        pageOrderBySubMenu: updatedPageOrderBySubMenu,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    
    console.log('✅ ページを追加/更新しました:', newPageId);
    console.log('タイトル:', newPage.title);
    console.log('サブメニューID:', subMenuId);
    console.log('更新されたページ順序:', updatedPageOrder);
    console.log('ページ数:', updatedPages.length);
    
    // ページをリロード
    alert('ページを追加しました。ページをリロードします。');
    window.location.reload();
    
  } catch (error) {
    console.error('❌ エラー:', error);
    alert('エラーが発生しました: ' + error.message);
  }
})();



