# AI-readableな情報の改善提案

## 現状の評価

### ✅ 現在AI-readableな情報として保持されているもの

1. **構造化されたデータ**
   - `pagesBySubMenu`: サブメニューごとのページ配列
   - `pageOrderBySubMenu`: ページの順序情報
   - 各ページの基本情報（id, pageNumber, title, content, createdAt）

2. **コンテナ化されたページ構造**
   - `data-page-container`属性によるページの識別
   - サブメニューIDによる分類
   - ページ番号による順序管理

3. **コンテンツの種類の識別**
   - HTMLコンテンツとMermaid図の分離
   - タイトルとコンテンツの分離

### ⚠️ 不足しているAI-readableな情報

## 1. セマンティックラベルとメタデータ

### 推奨される追加フィールド

```typescript
interface PageMetadata {
  // 既存フィールド
  id: string;
  pageNumber: number;
  title: string;
  content: string;
  createdAt: string;
  
  // 追加推奨フィールド
  tags?: string[];                    // セマンティックタグ（例: ['概要', '市場分析', '技術説明']）
  contentType?: 'text' | 'diagram' | 'table' | 'list' | 'mixed';  // コンテンツの種類
  semanticCategory?: string;          // 意味的なカテゴリ（例: 'overview', 'market-analysis', 'technical-spec'）
  keywords?: string[];                // キーワード（検索・関連性判定用）
  summary?: string;                   // ページの要約（AI生成可能）
  relatedPageIds?: string[];          // 関連ページのID
  sectionType?: 'introduction' | 'main-content' | 'conclusion' | 'appendix';  // セクションタイプ
  importance?: 'high' | 'medium' | 'low';  // 重要度
  targetAudience?: string[];          // 対象読者（例: ['経営層', '技術者', '投資家']）
}
```

## 2. ベクトル埋め込み（Embeddings）

### 推奨される実装

```typescript
interface PageEmbedding {
  pageId: string;
  // タイトルとコンテンツを組み合わせた埋め込み
  titleEmbedding?: number[];          // タイトルのベクトル（768次元など）
  contentEmbedding?: number[];        // コンテンツのベクトル
  combinedEmbedding?: number[];       // タイトル+コンテンツの統合ベクトル
  
  // メタデータ
  embeddingModel?: string;            // 使用したモデル（例: 'text-embedding-3-large'）
  embeddingVersion?: string;          // 埋め込みのバージョン
  createdAt?: string;                 // 埋め込み生成日時
}
```

### 実装方法
- OpenAI Embeddings API または Vertex AI の Text Embeddings API を使用
- ページ作成・更新時に自動生成
- Firestoreの別コレクション（`pageEmbeddings`）に保存

## 3. コンテンツ構造の解析

### 推奨される追加情報

```typescript
interface ContentStructure {
  pageId: string;
  headings?: Array<{
    level: number;                    // h1, h2, h3など
    text: string;
    position: number;                  // コンテンツ内の位置
  }>;
  sections?: Array<{
    title: string;
    startPosition: number;
    endPosition: number;
    type: 'paragraph' | 'list' | 'table' | 'diagram' | 'code';
  }>;
  hasImages?: boolean;
  hasDiagrams?: boolean;
  hasTables?: boolean;
  wordCount?: number;
  readingTime?: number;               // 推定読了時間（分）
}
```

## 4. 関連性と依存関係

### 推奨される追加情報

```typescript
interface PageRelations {
  pageId: string;
  // 前後のページ関係
  previousPageId?: string;
  nextPageId?: string;
  
  // 意味的な関連性（ベクトル類似度ベース）
  similarPages?: Array<{
    pageId: string;
    similarity: number;               // 0-1の類似度スコア
    reason?: string;                  // 類似している理由
  }>;
  
  // 参照関係
  references?: string[];               // 参照しているページID
  referencedBy?: string[];            // 参照されているページID
  
  // トピック関係
  topics?: string[];                  // トピックタグ
  topicHierarchy?: Array<{            // トピックの階層構造
    level: number;
    topic: string;
  }>;
}
```

## 5. フォーマットパターンの記録

### 推奨される追加情報

```typescript
interface FormatPattern {
  pageId: string;
  // レイアウトパターン
  layoutType?: 'single-column' | 'two-column' | 'grid' | 'mixed';
  
  // スタイルパターン
  stylePattern?: {
    hasKeyMessage?: boolean;          // キーメッセージコンテナの有無
    hasCards?: boolean;                // カードレイアウトの有無
    colorScheme?: string;             // カラースキーム
    visualElements?: string[];         // 視覚要素（['diagram', 'chart', 'image']）
  };
  
  // コンテンツパターン
  contentPattern?: {
    structure?: 'narrative' | 'list-based' | 'comparison' | 'process-flow';
    hasIntroduction?: boolean;
    hasConclusion?: boolean;
    hasCallToAction?: boolean;
  };
}
```

## 実装の優先順位

### Phase 1: 基本的なメタデータ追加（即座に実装可能）
1. ✅ `tags` フィールドの追加
2. ✅ `contentType` フィールドの追加
3. ✅ `semanticCategory` フィールドの追加
4. ✅ `keywords` フィールドの追加

### Phase 2: ベクトル埋め込み（中期的に実装）
1. ✅ 埋め込み生成APIの統合
2. ✅ ページ作成・更新時の自動埋め込み生成
3. ✅ 類似ページ検索機能の実装

### Phase 3: 高度な構造解析（長期的に実装）
1. ✅ コンテンツ構造の自動解析
2. ✅ 関連性の自動検出
3. ✅ フォーマットパターンの記録

## 具体的な実装例

### 1. ページ作成時のメタデータ自動付与

```typescript
// ページ作成時に自動的にメタデータを付与
async function createPageWithMetadata(
  title: string,
  content: string,
  subMenuId: string
) {
  // コンテンツタイプを自動判定
  const contentType = detectContentType(content);
  
  // キーワードを自動抽出（簡易版）
  const keywords = extractKeywords(title + ' ' + content);
  
  // セマンティックカテゴリを判定
  const semanticCategory = determineSemanticCategory(title, content, subMenuId);
  
  const newPage = {
    id: `page-${Date.now()}`,
    pageNumber: getNextPageNumber(subMenuId),
    title: title.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
    // メタデータ
    contentType,
    keywords,
    semanticCategory,
    tags: generateTags(title, content, subMenuId),
  };
  
  // ベクトル埋め込みを生成（非同期）
  generateEmbeddingAsync(newPage.id, title, content);
  
  return newPage;
}
```

### 2. ベクトル埋め込みの生成と保存

```typescript
async function generateEmbeddingAsync(
  pageId: string,
  title: string,
  content: string
) {
  try {
    // OpenAI Embeddings APIを使用
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-large',
        input: `${title}\n\n${stripHtml(content)}`, // HTMLタグを除去
      }),
    });
    
    const data = await response.json();
    const embedding = data.data[0].embedding;
    
    // Firestoreに保存
    await setDoc(doc(db, 'pageEmbeddings', pageId), {
      pageId,
      combinedEmbedding: embedding,
      embeddingModel: 'text-embedding-3-large',
      embeddingVersion: '1.0',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('埋め込み生成エラー:', error);
  }
}
```

### 3. 類似ページ検索

```typescript
async function findSimilarPages(
  queryText: string,
  limit: number = 5
): Promise<Array<{ pageId: string; similarity: number }>> {
  // クエリの埋め込みを生成
  const queryEmbedding = await generateEmbedding(queryText);
  
  // すべてのページ埋め込みを取得
  const embeddingsSnapshot = await getDocs(collection(db, 'pageEmbeddings'));
  
  // コサイン類似度を計算
  const similarities = embeddingsSnapshot.docs.map(doc => {
    const embedding = doc.data().combinedEmbedding;
    const similarity = cosineSimilarity(queryEmbedding, embedding);
    return {
      pageId: doc.id,
      similarity,
    };
  });
  
  // 類似度でソートして上位を返す
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
```

## データベーススキーマの拡張

### Firestoreコレクション構造

```
companyBusinessPlan/{planId}
  ├── pagesBySubMenu: {
  │     [subMenuId]: [
  │       {
  │         id: string,
  │         pageNumber: number,
  │         title: string,
  │         content: string,
  │         createdAt: string,
  │         // 追加メタデータ
  │         tags?: string[],
  │         contentType?: string,
  │         semanticCategory?: string,
  │         keywords?: string[],
  │         summary?: string,
  │         relatedPageIds?: string[],
  │         sectionType?: string,
  │         importance?: string,
  │         targetAudience?: string[],
  │       }
  │     ]
  │   }
  │
  └── pageEmbeddings/{pageId}  // 新しいコレクション
        ├── pageId: string
        ├── combinedEmbedding: number[]
        ├── titleEmbedding?: number[]
        ├── contentEmbedding?: number[]
        ├── embeddingModel: string
        ├── embeddingVersion: string
        └── createdAt: Timestamp

  └── pageStructures/{pageId}  // 新しいコレクション（オプション）
        ├── pageId: string
        ├── headings: Array<{level, text, position}>
        ├── sections: Array<{title, startPosition, endPosition, type}>
        ├── hasImages: boolean
        ├── hasDiagrams: boolean
        ├── wordCount: number
        └── readingTime: number
```

## AI機能実装への活用方法

### 1. 過去のページを参考にした資料生成

```typescript
async function generatePageFromSimilar(
  query: string,
  subMenuId: string
): Promise<PageMetadata> {
  // 1. 類似ページを検索
  const similarPages = await findSimilarPages(query, 5);
  
  // 2. 類似ページのフォーマットパターンを分析
  const formatPatterns = await analyzeFormatPatterns(
    similarPages.map(p => p.pageId)
  );
  
  // 3. 最も類似度の高いページのフォーマットを参考に生成
  const referencePage = await getPage(similarPages[0].pageId);
  
  // 4. AIにフォーマットを学習させて新しいページを生成
  const generatedContent = await aiGeneratePage({
    query,
    referenceFormat: formatPatterns[0],
    referenceContent: referencePage.content,
  });
  
  return generatedContent;
}
```

### 2. 質問応答機能

```typescript
async function answerQuestion(
  question: string,
  planId: string
): Promise<string> {
  // 1. 質問に関連するページを検索
  const relevantPages = await findSimilarPages(question, 10);
  
  // 2. 関連ページのコンテンツを取得
  const pageContents = await Promise.all(
    relevantPages.map(p => getPageContent(p.pageId))
  );
  
  // 3. コンテキストとして関連ページをAIに渡して回答生成
  const answer = await aiGenerateAnswer({
    question,
    context: pageContents,
    relevantPageIds: relevantPages.map(p => p.pageId),
  });
  
  return answer;
}
```

## まとめ

現在のコンポーネント形式は基本的なAI-readableな構造を持っていますが、以下の改善により、より強力なAI機能を実装できます：

1. **セマンティックメタデータの追加** - タグ、カテゴリ、キーワード
2. **ベクトル埋め込みの実装** - 類似ページ検索とセマンティック検索
3. **コンテンツ構造の解析** - より詳細なコンテンツ理解
4. **関連性の記録** - ページ間の関係性の明確化

これらの改善により、過去のページを参考にした資料生成や、質問応答機能をより効果的に実装できます。

