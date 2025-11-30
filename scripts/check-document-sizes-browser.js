/**
 * ブラウザのコンソールで実行してFirestoreドキュメントサイズを確認するスクリプト
 * 
 * 使用方法:
 * 1. アプリにログインしてブラウザのコンソールを開く
 * 2. このコードをコピー＆ペーストして実行
 * 
 * 注意: Firebase SDKが読み込まれている必要があります
 */

async function checkDocumentSizes() {
  const { db, auth } = await import('/lib/firebase.ts');
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  
  if (!auth?.currentUser || !db) {
    console.error('ログインが必要です');
    return;
  }
  
  try {
    console.log('Firestoreのconceptsコレクションからデータを取得中...\n');
    
    const conceptsQuery = query(
      collection(db, 'concepts'),
      where('userId', '==', auth.currentUser.uid)
    );
    
    const conceptsSnapshot = await getDocs(conceptsQuery);
    
    if (conceptsSnapshot.empty) {
      console.log('データが見つかりませんでした。');
      return;
    }
    
    const sizes = [];
    const details = [];
    
    conceptsSnapshot.forEach((doc) => {
      const data = doc.data();
      const size = new Blob([JSON.stringify(data)]).size;
      sizes.push(size);
      
      // 詳細情報を収集
      const pageCount = data.pagesBySubMenu 
        ? Object.values(data.pagesBySubMenu).reduce((total, pages) => total + (pages?.length || 0), 0)
        : (data.pages?.length || 0);
      
      const referenceCount = data.references?.length || 0;
      
      // 各ページのコンテンツサイズを計算
      let totalContentSize = 0;
      if (data.pagesBySubMenu) {
        Object.values(data.pagesBySubMenu).forEach(pages => {
          if (Array.isArray(pages)) {
            pages.forEach(page => {
              if (page.content) {
                totalContentSize += new Blob([page.content]).size;
              }
            });
          }
        });
      }
      
      details.push({
        id: doc.id,
        conceptId: data.conceptId || 'N/A',
        serviceId: data.serviceId || 'N/A',
        name: data.name || 'N/A',
        size: size,
        sizeFormatted: formatBytes(size),
        pageCount: pageCount,
        referenceCount: referenceCount,
        totalContentSize: totalContentSize,
        totalContentSizeFormatted: formatBytes(totalContentSize),
        hasKeyVisual: !!data.keyVisualUrl,
      });
    });
    
    // 統計を計算
    sizes.sort((a, b) => a - b);
    const total = sizes.reduce((sum, size) => sum + size, 0);
    const average = total / sizes.length;
    const median = sizes.length % 2 === 0
      ? (sizes[sizes.length / 2 - 1] + sizes[sizes.length / 2]) / 2
      : sizes[Math.floor(sizes.length / 2)];
    const min = sizes[0];
    const max = sizes[sizes.length - 1];
    
    // バイトを読みやすい形式に変換
    function formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    // 結果を表示
    console.log('='.repeat(80));
    console.log('📊 Firestore ドキュメントサイズ統計');
    console.log('='.repeat(80));
    console.log(`総ドキュメント数: ${sizes.length}件\n`);
    
    console.log('📏 サイズ統計:');
    console.log(`  最小値: ${formatBytes(min)}`);
    console.log(`  最大値: ${formatBytes(max)}`);
    console.log(`  平均値: ${formatBytes(average)}`);
    console.log(`  中央値: ${formatBytes(median)}`);
    console.log(`  合計: ${formatBytes(total)}\n`);
    
    // 1MB制限との比較
    const oneMB = 1024 * 1024;
    const overLimit = sizes.filter(size => size > oneMB).length;
    const nearLimit = sizes.filter(size => size > oneMB * 0.8).length;
    
    console.log('⚠️  制限チェック:');
    console.log(`  1MB制限を超えている: ${overLimit}件`);
    console.log(`  1MBの80%以上: ${nearLimit}件\n`);
    
    // 詳細情報を表示（サイズ順）
    details.sort((a, b) => b.size - a.size);
    
    console.log('📋 ドキュメント詳細（サイズの大きい順）:');
    console.log('-'.repeat(80));
    details.forEach((detail, index) => {
      const warning = detail.size > oneMB ? ' ⚠️  ' : detail.size > oneMB * 0.8 ? ' ⚡ ' : '   ';
      console.log(`${index + 1}.${warning} ${detail.name}`);
      console.log(`     サイズ: ${detail.sizeFormatted} (${detail.size} bytes)`);
      console.log(`     コンテンツサイズ: ${detail.totalContentSizeFormatted}`);
      console.log(`     ConceptID: ${detail.conceptId} | ServiceID: ${detail.serviceId}`);
      console.log(`     ページ数: ${detail.pageCount} | 参考文献数: ${detail.referenceCount}`);
      console.log(`     キービジュアル: ${detail.hasKeyVisual ? 'あり' : 'なし'}`);
      console.log('');
    });
    
    // サイズ分布を表示
    console.log('📊 サイズ分布:');
    const ranges = [
      { label: '0-100KB', min: 0, max: 100 * 1024 },
      { label: '100KB-500KB', min: 100 * 1024, max: 500 * 1024 },
      { label: '500KB-800KB', min: 500 * 1024, max: 800 * 1024 },
      { label: '800KB-1MB', min: 800 * 1024, max: oneMB },
      { label: '1MB以上', min: oneMB, max: Infinity },
    ];
    
    ranges.forEach(range => {
      const count = sizes.filter(size => size >= range.min && size < range.max).length;
      const percentage = (count / sizes.length * 100).toFixed(1);
      console.log(`  ${range.label}: ${count}件 (${percentage}%)`);
    });
    
    return {
      total: sizes.length,
      min,
      max,
      average,
      median,
      overLimit,
      nearLimit,
      details
    };
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  }
}

// 実行
checkDocumentSizes().then(result => {
  console.log('\n✅ 完了！結果は上記を参照してください。');
  console.log('結果オブジェクト:', result);
}).catch(error => {
  console.error('実行エラー:', error);
});

