# ページ埋め込みデータのマイグレーション手順

## 概要
既存のページ埋め込みデータを新しい構造（メタデータを含む）に移行します。

## 前提条件
- Firebaseが初期化されているページで実行する必要があります
- ページメタデータが既に生成されている必要があります

## 実行方法

### 方法1: ブラウザコンソールで実行

1. アプリケーションの任意のページを開く（Firebaseが初期化されているページ）
2. ブラウザの開発者ツール（F12）を開く
3. コンソールタブを開く
4. 以下のコードをコピー＆ペーストして実行:

```javascript
// マイグレーションスクリプトを読み込んで実行
(async () => {
  // スクリプトファイルを読み込む
  const script = await fetch('/scripts/migrate-page-embeddings.js');
  const code = await script.text();
  eval(code);
})();
```

または、直接関数を実行:

```javascript
// マイグレーション関数を直接実行
(async () => {
  const { collection, getDocs, doc, getDoc, setDoc } = await import('firebase/firestore');
  const { db } = await import('@/lib/firebase');
  
  // migratePageEmbeddings関数のコードをここに貼り付け
  // （scripts/migrate-page-embeddings.jsの内容を参照）
})();
```

### 方法2: 専用ページを作成（推奨）

管理画面にマイグレーションページを追加して、ボタンクリックで実行できるようにする。

## 注意事項

1. **APIレート制限**: OpenAI APIのレート制限に注意してください
   - 大量のページがある場合、時間がかかる可能性があります
   - スクリプト内で200msの待機時間を設けています

2. **コスト**: 埋め込み生成にはAPIコストがかかります
   - タイトル、コンテンツ、メタデータの3つの埋め込みを生成します
   - 既存のcombinedEmbeddingも再生成されます

3. **既存データ**: バージョン2.0のデータは自動的にスキップされます

4. **エラーハンドリング**: エラーが発生しても処理は続行されます

## 実行後の確認

1. Firestore Consoleで `pageEmbeddings` コレクションを確認
2. 各ドキュメントに以下のフィールドが追加されていることを確認:
   - `titleEmbedding`
   - `contentEmbedding`
   - `metadataEmbedding` (メタデータがある場合)
   - `semanticCategory`
   - `keywords`
   - `embeddingVersion: "2.0"`

## トラブルシューティング

### エラー: "Firebaseが初期化されていません"
- Firebaseが初期化されているページで実行してください
- ログインしていることを確認してください

### エラー: "ページメタデータが見つかりません"
- ページが `pagesBySubMenu` に正しく保存されているか確認してください
- ページIDが一致しているか確認してください

### APIエラー
- OpenAI APIキーが正しく設定されているか確認してください
- APIレート制限に達していないか確認してください

