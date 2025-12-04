/**
 * ページ埋め込みデータのマイグレーションスクリプト
 * 既存のpageEmbeddingsを新しい構造（メタデータを含む）に移行
 * 
 * 使用方法:
 * 1. ブラウザのコンソールで実行
 * 2. または、Node.js環境で実行（Firebase Admin SDKが必要）
 */

// ブラウザで実行する場合のコード
if (typeof window !== 'undefined') {
  console.log('📊 ページ埋め込みデータのマイグレーションを開始します...');
  
  // Firebaseの初期化を確認
  if (typeof db === 'undefined' || typeof auth === 'undefined') {
    console.error('❌ Firebaseが初期化されていません。このスクリプトはFirebaseが初期化されたページで実行してください。');
  } else {
    migratePageEmbeddings();
  }
}

/**
 * ページ埋め込みデータをマイグレーション
 */
async function migratePageEmbeddings() {
  const { collection, getDocs, doc, getDoc, setDoc, query } = await import('firebase/firestore');
  const { db } = await import('@/lib/firebase');
  
  if (!db) {
    console.error('❌ Firestoreが初期化されていません');
    return;
  }

  try {
    console.log('📋 既存のページ埋め込みを取得中...');
    
    // すべてのページ埋め込みを取得
    const embeddingsSnapshot = await getDocs(collection(db, 'pageEmbeddings'));
    const totalEmbeddings = embeddingsSnapshot.docs.length;
    
    console.log(`✅ ${totalEmbeddings}件の埋め込みが見つかりました`);
    
    if (totalEmbeddings === 0) {
      console.log('⚠️ マイグレーションするデータがありません');
      return;
    }

    // すべてのページメタデータを取得（conceptsとcompanyBusinessPlanから）
    const allPagesMetadata = new Map();
    
    // conceptsから取得
    console.log('📋 構想のページメタデータを取得中...');
    const conceptsSnapshot = await getDocs(collection(db, 'concepts'));
    for (const conceptDoc of conceptsSnapshot.docs) {
      const conceptData = conceptDoc.data();
      const pagesBySubMenu = conceptData.pagesBySubMenu || {};
      
      for (const pages of Object.values(pagesBySubMenu)) {
        if (Array.isArray(pages)) {
          for (const page of pages) {
            if (page.id) {
              allPagesMetadata.set(page.id, {
                ...page,
                conceptId: conceptData.conceptId,
                serviceId: conceptData.serviceId,
              });
            }
          }
        }
      }
    }
    
    // companyBusinessPlanから取得
    console.log('📋 会社事業計画のページメタデータを取得中...');
    const plansSnapshot = await getDocs(collection(db, 'companyBusinessPlan'));
    for (const planDoc of plansSnapshot.docs) {
      const planData = planDoc.data();
      const pagesBySubMenu = planData.pagesBySubMenu || {};
      
      for (const pages of Object.values(pagesBySubMenu)) {
        if (Array.isArray(pages)) {
          for (const page of pages) {
            if (page.id) {
              allPagesMetadata.set(page.id, {
                ...page,
                planId: planDoc.id,
              });
            }
          }
        }
      }
    }
    
    console.log(`✅ ${allPagesMetadata.size}件のページメタデータを取得しました`);

    // 各埋め込みをマイグレーション
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const [index, docSnap] of embeddingsSnapshot.docs.entries()) {
      const embeddingData = docSnap.data();
      const pageId = embeddingData.pageId;
      
      console.log(`\n[${index + 1}/${totalEmbeddings}] ページ ${pageId} を処理中...`);

      try {
        // 既にバージョン2.0の場合はスキップ
        if (embeddingData.embeddingVersion === '2.0' && 
            embeddingData.titleEmbedding && 
            embeddingData.contentEmbedding) {
          console.log(`  ⏭️  既にマイグレーション済み（バージョン2.0）のためスキップ`);
          skippedCount++;
          continue;
        }

        // ページメタデータを取得
        const pageMetadata = allPagesMetadata.get(pageId);
        
        if (!pageMetadata) {
          console.log(`  ⚠️  ページメタデータが見つかりません（スキップ）`);
          skippedCount++;
          continue;
        }

        // メタデータを準備
        const metadata = {
          keywords: pageMetadata.keywords,
          semanticCategory: pageMetadata.semanticCategory,
          tags: pageMetadata.tags,
          summary: pageMetadata.summary,
        };

        // 埋め込みを再生成（動的インポート）
        const { savePageEmbedding } = await import('@/lib/pageEmbeddings');
        
        await savePageEmbedding(
          pageId,
          pageMetadata.title,
          pageMetadata.content,
          pageMetadata.planId,
          pageMetadata.conceptId,
          metadata
        );

        console.log(`  ✅ マイグレーション完了`);
        migratedCount++;

        // APIレート制限を考慮して少し待機
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`  ❌ エラー:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 マイグレーション結果:');
    console.log(`  ✅ 成功: ${migratedCount}件`);
    console.log(`  ⏭️  スキップ: ${skippedCount}件`);
    console.log(`  ❌ エラー: ${errorCount}件`);
    console.log(`  📊 合計: ${totalEmbeddings}件`);
    
  } catch (error) {
    console.error('❌ マイグレーションエラー:', error);
  }
}

// Node.js環境で実行する場合（未実装、必要に応じて追加）
if (typeof window === 'undefined' && typeof module !== 'undefined') {
  module.exports = { migratePageEmbeddings };
}

