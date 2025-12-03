/**
 * ブラウザのコンソールで実行する簡単なコード
 * 
 * 使用方法:
 * 1. 該当ページを開く: http://localhost:3005/business-plan/services/own-service/concept-1764780734434/overview
 * 2. 開発者ツールのコンソールを開く（F12）
 * 3. 以下のコード全体をコピーして貼り付け、実行
 */

// このコードをブラウザのコンソールに貼り付けて実行してください
(async function() {
  const serviceId = 'own-service';
  const conceptId = 'concept-1764780734434';
  const subMenuId = 'overview';
  const pageNumber = 1; // 2ページ目（0ベースなので1）
  const title = '新しいコンテナ';
  const content = '<p>新しいコンテナのコンテンツをここに入力してください。</p>';

  try {
    // Firebaseモジュールを動的にインポート
    const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } = firestoreModule;
    
    // 注意: この方法は動作しない可能性があります
    // 代わりに、ページ上の「ページを追加」ボタンを使用することをお勧めします
    
    console.log('❌ このコードは直接実行できません。');
    console.log('✅ 代わりに、ページ上の「ページを追加」ボタンを使用してください:');
    console.log('   1. ページ右上の「ページを追加」ボタンをクリック');
    console.log('   2. タイトルとコンテンツを入力');
    console.log('   3. 保存後、「ページ順序を変更」ボタンで2ページ目に移動');
    
  } catch (error) {
    console.error('❌ エラー:', error);
    console.log('✅ 代わりに、ページ上の「ページを追加」ボタンを使用してください。');
  }
})();

