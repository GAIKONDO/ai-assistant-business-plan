// ブラウザのコンソールで実行してください
// 設定されているページ分割IDの一覧を表示します

(function() {
  console.log('=== 設定されているページ分割ID一覧 ===\n');
  
  // localStorageからpage-breaks-で始まるキーを取得
  const allKeys = Object.keys(localStorage);
  const pageBreakKeys = allKeys.filter(key => key.startsWith('page-breaks-'));
  
  if (pageBreakKeys.length === 0) {
    console.log('❌ 設定されているページ分割IDはありません。');
    console.log('\n💡 ページ分割を設定するには、通常表示時に右下の「ページ分割設定」ボタンをクリックしてください。');
    return;
  }
  
  let totalCount = 0;
  
  pageBreakKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        const ids = JSON.parse(value);
        // キーからplanIdとsubMenuを抽出
        // 形式: page-breaks-{planId}-{subMenu}
        const match = key.match(/^page-breaks-(.+?)-(.+)$/);
        if (match) {
          const planId = match[1];
          const subMenu = match[2];
          
          console.log(`📄 プランID: ${planId}`);
          console.log(`   📑 サブメニュー: ${subMenu}`);
          console.log(`   🔖 設定されている要素ID (${ids.length}個):`);
          
          if (ids.length === 0) {
            console.log(`      (なし)`);
          } else {
            ids.forEach((id, index) => {
              console.log(`      ${index + 1}. ${id}`);
              totalCount++;
            });
          }
          console.log('');
        } else {
          console.log(`⚠️  キーの形式が不正: ${key}`);
        }
      } catch (e) {
        console.error(`❌ エラー: ${key} の解析に失敗しました`, e);
      }
    }
  });
  
  console.log(`\n合計: ${totalCount}個の要素IDが設定されています。`);
  console.log('\n=== 全localStorageキー一覧 (page-breaks-で始まるもの) ===');
  console.log(pageBreakKeys);
  
  // 現在のページで利用可能なIDも表示
  console.log('\n=== 現在のページで利用可能なID ===');
  const container = document.querySelector('[data-content-container]');
  if (container) {
    const elementsWithId = [];
    
    // h2, h3, h4を検索
    const headings = container.querySelectorAll('h2[id], h3[id], h4[id]');
    headings.forEach(heading => {
      if (heading instanceof HTMLElement && heading.id) {
        const text = heading.textContent?.trim() || heading.id;
        elementsWithId.push({
          id: heading.id,
          type: heading.tagName.toLowerCase(),
          text: text.substring(0, 50)
        });
      }
    });
    
    // .card要素を検索
    const cards = container.querySelectorAll('.card[id]');
    cards.forEach(card => {
      if (card instanceof HTMLElement && card.id) {
        const heading = card.querySelector('h3, h4');
        const text = heading?.textContent?.trim() || card.id;
        elementsWithId.push({
          id: card.id,
          type: 'card',
          text: text.substring(0, 50)
        });
      }
    });
    
    if (elementsWithId.length === 0) {
      console.log('❌ IDを持つ要素が見つかりませんでした。');
      console.log('💡 ページ分割を設定するには、要素にIDを追加してください。');
      console.log('   例: <h3 id="section-1">見出し</h3>');
      console.log('   例: <div className="card" id="card-1">...</div>');
    } else {
      console.log(`✅ ${elementsWithId.length}個のIDが見つかりました:`);
      elementsWithId.forEach((item, index) => {
        console.log(`   ${index + 1}. [${item.type}] ${item.id} - "${item.text}"`);
      });
    }
  } else {
    console.log('⚠️  [data-content-container]要素が見つかりませんでした。');
  }
})();

