/**
 * 構想のoverviewページに新しいコンテナを追加するスクリプト
 * 
 * 使用方法:
 * node scripts/add-concept-page.js <serviceId> <conceptId> <title> <content>
 * 
 * 例:
 * node scripts/add-concept-page.js own-service concept-1764780734434 "新しいページ" "<p>コンテンツ</p>"
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

// Firebase設定（環境変数から取得するか、直接設定）
const firebaseConfig = {
  // ここにFirebase設定を追加
  // または環境変数から読み込む
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function addConceptPage(serviceId, conceptId, title, content, pageNumber = null) {
  try {
    console.log(`📝 構想ページを追加中: ${serviceId}/${conceptId}`);
    
    // 構想ドキュメントを取得
    const conceptsQuery = query(
      collection(db, 'concepts'),
      where('serviceId', '==', serviceId),
      where('conceptId', '==', conceptId)
    );
    
    const conceptsSnapshot = await getDocs(conceptsQuery);
    
    if (conceptsSnapshot.empty) {
      console.error('❌ 構想が見つかりませんでした。');
      return;
    }
    
    const conceptDoc = conceptsSnapshot.docs[0];
    const conceptData = conceptDoc.data();
    
    // サブメニューごとのページデータを取得
    const pagesBySubMenu = conceptData.pagesBySubMenu || {};
    const pageOrderBySubMenu = conceptData.pageOrderBySubMenu || {};
    
    // overviewサブメニューのページデータを取得
    const overviewPages = pagesBySubMenu['overview'] || [];
    const overviewPageOrder = pageOrderBySubMenu['overview'] || [];
    
    // 新しいページIDを生成
    const newPageId = `page-${Date.now()}`;
    
    // ページ番号を決定（指定されていない場合は最後に追加）
    let targetPageNumber;
    if (pageNumber !== null) {
      targetPageNumber = pageNumber;
      // 指定されたページ番号以降のページを1つずつずらす
      overviewPages.forEach(page => {
        if (page.pageNumber >= pageNumber) {
          page.pageNumber += 1;
        }
      });
    } else {
      targetPageNumber = overviewPages.length;
    }
    
    // 新しいページを作成
    const newPage = {
      id: newPageId,
      pageNumber: targetPageNumber,
      title: title.trim(),
      content: content.trim() || '<p>コンテンツを入力してください。</p>',
      createdAt: new Date().toISOString(),
    };
    
    // ページを追加（指定されたページ番号の位置に挿入）
    let updatedPages;
    let updatedPageOrder;
    
    if (pageNumber !== null && pageNumber < overviewPages.length) {
      // 指定された位置に挿入
      updatedPages = [...overviewPages];
      updatedPages.splice(pageNumber, 0, newPage);
      updatedPageOrder = [...overviewPageOrder];
      updatedPageOrder.splice(pageNumber, 0, newPageId);
    } else {
      // 最後に追加
      updatedPages = [...overviewPages, newPage];
      updatedPageOrder = [...overviewPageOrder, newPageId];
    }
    
    // 更新データを準備
    const updatedPagesBySubMenu = {
      ...pagesBySubMenu,
      'overview': updatedPages,
    };
    
    const updatedPageOrderBySubMenu = {
      ...pageOrderBySubMenu,
      'overview': updatedPageOrder,
    };
    
    // Firestoreに保存
    await updateDoc(doc(db, 'concepts', conceptDoc.id), {
      pagesBySubMenu: updatedPagesBySubMenu,
      pageOrderBySubMenu: updatedPageOrderBySubMenu,
      updatedAt: serverTimestamp(),
    });
    
    console.log(`✅ ページを追加しました: ${newPageId}`);
    console.log(`   タイトル: ${title}`);
    console.log(`   ページ番号: ${targetPageNumber}`);
    console.log(`   総ページ数: ${updatedPages.length}`);
    
  } catch (error) {
    console.error('❌ エラー:', error);
    throw error;
  }
}

// コマンドライン引数からパラメータを取得
const args = process.argv.slice(2);

if (args.length < 4) {
  console.log('使用方法: node scripts/add-concept-page.js <serviceId> <conceptId> <title> <content> [pageNumber]');
  console.log('例: node scripts/add-concept-page.js own-service concept-1764780734434 "新しいページ" "<p>コンテンツ</p>" 1');
  process.exit(1);
}

const [serviceId, conceptId, title, content, pageNumberStr] = args;
const pageNumber = pageNumberStr ? parseInt(pageNumberStr, 10) : null;

// 実行
signInAnonymously(auth)
  .then(() => {
    return addConceptPage(serviceId, conceptId, title, content, pageNumber);
  })
  .then(() => {
    console.log('✅ 完了');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ エラー:', error);
    process.exit(1);
  });

