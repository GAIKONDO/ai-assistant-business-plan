// このスクリプトはブラウザのコンソールで実行してください
// 設定されているページ分割IDの一覧を表示します

function checkPageBreaks() {
  const allKeys = Object.keys(localStorage);
  const pageBreakKeys = allKeys.filter(key => key.startsWith('page-breaks-'));
  
  console.log('=== 設定されているページ分割ID一覧 ===\n');
  
  if (pageBreakKeys.length === 0) {
    console.log('設定されているページ分割IDはありません。');
    return;
  }
  
  pageBreakKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        const ids = JSON.parse(value);
        const parts = key.replace('page-breaks-', '').split('-');
        const planId = parts[0];
        const subMenu = parts.slice(1).join('-');
        
        console.log(`📄 プランID: ${planId}`);
        console.log(`   📑 サブメニュー: ${subMenu}`);
        console.log(`   🔖 設定されている要素ID:`);
        if (ids.length === 0) {
          console.log(`      (なし)`);
        } else {
          ids.forEach((id: string, index: number) => {
            console.log(`      ${index + 1}. ${id}`);
          });
        }
        console.log('');
      } catch (e) {
        console.error(`エラー: ${key} の解析に失敗しました`, e);
      }
    }
  });
  
  console.log('=== 全localStorageキー一覧 ===');
  console.log('page-breaks-で始まるキー:', pageBreakKeys);
}

// 実行
checkPageBreaks();

