# 構想ページにコンテナを追加する方法

`own-service/concept-1764780734434/overview` ページに新しいコンテナを追加し、2ページ目にする方法です。

## 方法1: ブラウザのコンソールで実行

1. ブラウザで該当ページを開く:
   ```
   http://localhost:3005/business-plan/services/own-service/concept-1764780734434/overview
   ```

2. 開発者ツールのコンソールを開く（F12）

3. 以下のコードを貼り付けて実行:

```javascript
(async function() {
  const serviceId = 'own-service';
  const conceptId = 'concept-1764780734434';
  const subMenuId = 'overview';
  const pageNumber = 1; // 2ページ目（0ベースなので1）
  const title = '新しいコンテナ';
  const content = '<p>新しいコンテナのコンテンツをここに入力してください。</p>';

  try {
    // Firebaseモジュールを動的にインポート
    const { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    
    // グローバルに読み込まれているdbとauthを使用
    // ページのコンポーネントから直接アクセスする必要があります
    // このコードは、ページが既にFirebaseを初期化していることを前提としています
    
    // 注意: この方法は、ページのコンポーネント内で実行する必要があります
    // または、Firebase Admin SDKを使用する必要があります
    
    console.log('このコードはページのコンポーネント内で実行する必要があります。');
    console.log('代わりに、ページ上の「ページを追加」ボタンを使用してください。');
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
})();
```

## 方法2: ページ上の「ページを追加」ボタンを使用（推奨）

1. 該当ページを開く
2. 「ページを追加」ボタンをクリック
3. タイトルとコンテンツを入力
4. 保存後、「ページ順序を変更」ボタンで2ページ目に移動

## 方法3: 直接Firestoreを更新（開発者向け）

Firebase Consoleから直接Firestoreを更新する方法:

1. Firebase Consoleを開く
2. Firestore Databaseに移動
3. `concepts` コレクションを開く
4. `conceptId` が `concept-1764780734434` のドキュメントを探す
5. `pagesBySubMenu.overview` 配列に新しいページオブジェクトを追加
6. `pageOrderBySubMenu.overview` 配列にもページIDを追加

新しいページオブジェクトの形式:
```json
{
  "id": "page-1764780734434",
  "pageNumber": 1,
  "title": "新しいコンテナ",
  "content": "<p>新しいコンテナのコンテンツをここに入力してください。</p>",
  "createdAt": "2025-01-02T12:00:00.000Z"
}
```

