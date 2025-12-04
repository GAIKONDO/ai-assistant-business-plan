# キーワード検索精度向上の実装

## 概要

キーワード検索の精度を向上させるため、以下の改善を実装しました：

1. **メタデータを活用した埋め込み生成**
2. **タイトルとコンテンツの分離埋め込み**
3. **ハイブリッド検索（ベクトル検索 + メタデータブースト）**

## 実装内容

### 1. データ構造の拡張

#### `PageEmbedding` 型の拡張 (`types/pageMetadata.ts`)

```typescript
export interface PageEmbedding {
  pageId: string;
  
  // 埋め込みベクトル
  titleEmbedding?: number[];          // タイトルのベクトル
  contentEmbedding?: number[];        // コンテンツのベクトル
  combinedEmbedding?: number[];       // 統合ベクトル（後方互換性）
  metadataEmbedding?: number[];       // メタデータのベクトル
  
  // メタデータ（検索高速化用）
  planId?: string;
  conceptId?: string;
  semanticCategory?: string;
  keywords?: string[];
  
  // メタ情報
  embeddingModel?: string;
  embeddingVersion?: string;          // '2.0'に更新
  createdAt?: string;
  updatedAt?: string;
}
```

### 2. 埋め込み生成関数の拡張 (`lib/embeddings.ts`)

- `generateSeparatedEmbeddings`: タイトルとコンテンツを分離
- `generateEnhancedEmbedding`: メタデータを活用（タイトル重み付け）
- `generateMetadataEmbedding`: メタデータのみの埋め込み
- `combineWeightedEmbeddings`: 重み付き統合

### 3. 保存関数の更新 (`lib/pageEmbeddings.ts`)

`savePageEmbedding` 関数がメタデータを受け取り、新しい構造で保存します：

```typescript
savePageEmbedding(
  pageId: string,
  title: string,
  content: string,
  planId?: string,
  conceptId?: string,
  metadata?: {
    keywords?: string[];
    semanticCategory?: string;
    tags?: string[];
    summary?: string;
  }
)
```

### 4. ハイブリッド検索の実装 (`lib/pageEmbeddings.ts`)

`findSimilarPagesHybrid` 関数を追加：

- ベクトル検索で候補を取得
- メタデータでフィルタリング・ブースト
  - セマンティックカテゴリ一致: +0.1
  - キーワード一致: +0.05 per keyword
  - メタデータ埋め込み類似度: 10%の重み

### 5. キーワード検索コンポーネントの更新

`KeywordPageRelationGraph.tsx` で `findSimilarPagesHybrid` を使用するように更新。

## 使用方法

### 新規ページ作成時

メタデータは自動的に生成され、埋め込みに含まれます：

```typescript
// 自動的にメタデータが含まれる
savePageEmbeddingAsync(
  pageId,
  title,
  content,
  planId,
  conceptId,
  {
    keywords: page.keywords,
    semanticCategory: page.semanticCategory,
    tags: page.tags,
    summary: page.summary,
  }
);
```

### 既存データのマイグレーション

`scripts/migrate-page-embeddings.js` を実行：

```bash
# ブラウザコンソールで実行
# または専用ページを作成
```

詳細は `scripts/migrate-page-embeddings-browser.md` を参照。

## Firebaseインデックスのデプロイ

以下のコマンドでインデックスをデプロイ：

```bash
firebase deploy --only firestore:indexes
```

または、Firebase Consoleから手動で作成。

## 精度向上の効果

### 改善前
- タイトルとコンテンツを単純結合
- メタデータを活用していない
- 関連度の閾値なし（上位20件を表示）

### 改善後
- タイトルに重み付け（3回繰り返し）
- メタデータ（keywords, semanticCategory等）を埋め込みに含める
- ハイブリッド検索でメタデータブースト
- より関連性の高いページが上位に表示される

## パフォーマンスへの影響

### APIコール数の増加
- 改善前: 1回（combinedEmbedding）
- 改善後: 3-4回（titleEmbedding, contentEmbedding, metadataEmbedding, combinedEmbedding）

### ストレージ使用量
- 改善前: ~1.5KB per page
- 改善後: ~4-5KB per page（埋め込みベクトルが増加）

### 検索速度
- インデックスを使用することで、メタデータフィルタリングが高速化
- ハイブリッド検索は若干遅くなる可能性（メタデータ取得のため）

## 後方互換性

- 既存のコードはそのまま動作します（メタデータがなくても）
- `combinedEmbedding` は引き続き生成されます
- バージョン1.0のデータも検索可能です

## トラブルシューティング

### エラー: "メタデータが空です"
- ページメタデータが正しく生成されているか確認
- `generatePageMetadata` が呼ばれているか確認

### 検索精度が向上しない
- メタデータが正しく保存されているか確認
- `embeddingVersion: "2.0"` になっているか確認
- Firebaseインデックスが作成されているか確認

### APIエラー
- OpenAI APIキーが正しく設定されているか確認
- APIレート制限に達していないか確認

## 実装済みの改善

### リトライロジックの追加
- APIレート制限（429エラー）に対する自動リトライ
- サーバーエラー（5xx）に対する指数バックオフリトライ
- ネットワークエラーに対するリトライ
- 最大3回のリトライ（デフォルト）

### デプロイスクリプト
- `scripts/deploy-indexes.sh`: Firebaseインデックスを簡単にデプロイ

## 今後の改善案

1. **リランキングの導入**: 初期検索結果を再ランキング
2. **より高精度なモデル**: `text-embedding-3-large` への移行
3. **キャッシュの活用**: よく検索されるキーワードの結果をキャッシュ
4. **A/Bテスト**: 検索精度の改善を定量的に測定
5. **バッチ処理の最適化**: 複数の埋め込みを効率的に生成

## 関連ファイル

- `types/pageMetadata.ts`: 型定義
- `lib/embeddings.ts`: 埋め込み生成関数
- `lib/pageEmbeddings.ts`: 保存・検索関数
- `components/KeywordPageRelationGraph.tsx`: キーワード検索UI
- `firestore.indexes.json`: Firestoreインデックス定義
- `scripts/migrate-page-embeddings.js`: マイグレーションスクリプト

