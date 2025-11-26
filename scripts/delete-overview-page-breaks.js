// ブラウザのコンソールで実行してください
// 「概要・コンセプト」(overview)のページ分割設定を削除します

(function() {
  console.log('=== 「概要・コンセプト」のページ分割設定を削除します ===\n');
  
  // localStorageからpage-breaks-で始まるキーを取得
  const allKeys = Object.keys(localStorage);
  const pageBreakKeys = allKeys.filter(key => key.startsWith('page-breaks-') && key.includes('-overview'));
  
  if (pageBreakKeys.length === 0) {
    console.log('❌ 「概要・コンセプト」のページ分割設定は見つかりませんでした。');
    return;
  }
  
  console.log(`見つかったキー (${pageBreakKeys.length}個):`);
  pageBreakKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        const ids = JSON.parse(value);
        console.log(`  📄 ${key}`);
        console.log(`     設定されているID: ${ids.length}個`);
        ids.forEach((id, index) => {
          console.log(`       ${index + 1}. ${id}`);
        });
      } catch (e) {
        console.log(`  ⚠️  ${key} (解析エラー)`);
      }
    }
  });
  
  console.log('\n削除を実行します...');
  
  // 削除を実行
  pageBreakKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✓ 削除しました: ${key}`);
  });
  
  console.log('\n✅ 削除が完了しました。');
  console.log('\n💡 ページをリロードすると、設定が反映されます。');
})();

