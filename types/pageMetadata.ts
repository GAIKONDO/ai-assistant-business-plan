/**
 * ページメタデータの型定義
 * AI-readableな情報を保持するための拡張型定義
 */

/**
 * コンテンツタイプ
 */
export type ContentType = 
  | 'text'           // テキスト中心
  | 'diagram'        // 図表中心（Mermaid等）
  | 'table'          // 表形式
  | 'list'           // リスト形式
  | 'mixed'          // 複合型
  | 'key-visual'     // キービジュアル
  | 'comparison'     // 比較表
  | 'process-flow';  // プロセスフロー

/**
 * セクションタイプ
 */
export type SectionType = 
  | 'introduction'    // 導入
  | 'main-content'   // メインコンテンツ
  | 'conclusion'     // 結論
  | 'appendix'       // 付録
  | 'summary';       // 要約

/**
 * 重要度
 */
export type Importance = 'high' | 'medium' | 'low';

/**
 * 拡張されたページメタデータ
 */
export interface PageMetadata {
  // 既存フィールド
  id: string;
  pageNumber: number;
  title: string;
  content: string;
  createdAt: string;
  
  // AI-readableな追加メタデータ
  tags?: string[];                    // セマンティックタグ
  contentType?: ContentType;          // コンテンツの種類
  semanticCategory?: string;         // 意味的なカテゴリ
  keywords?: string[];                // キーワード
  summary?: string;                   // ページの要約
  relatedPageIds?: string[];          // 関連ページのID
  sectionType?: SectionType;         // セクションタイプ
  importance?: Importance;           // 重要度
  targetAudience?: string[];         // 対象読者
  updatedAt?: string;                // 更新日時
}

/**
 * ページ埋め込みデータ
 */
export interface PageEmbedding {
  pageId: string;
  
  // 埋め込みベクトル
  titleEmbedding?: number[];          // タイトルのベクトル（分離埋め込み用）
  contentEmbedding?: number[];        // コンテンツのベクトル（分離埋め込み用）
  combinedEmbedding?: number[];       // タイトル+コンテンツの統合ベクトル（後方互換性のため保持）
  metadataEmbedding?: number[];       // メタデータ（keywords, semanticCategory等）のベクトル
  
  // メタデータ（検索高速化・フィルタリング用）
  planId?: string;                    // 事業計画ID
  conceptId?: string;                  // 構想ID
  semanticCategory?: string;           // セマンティックカテゴリ（インデックス用）
  keywords?: string[];                 // キーワード配列（array-contains-any用）
  
  // メタ情報
  embeddingModel?: string;            // 使用したモデル
  embeddingVersion?: string;          // 埋め込みのバージョン（'2.0'に更新）
  createdAt?: string;                 // 埋め込み生成日時
  updatedAt?: string;                 // 更新日時
}

/**
 * コンテンツ構造情報
 */
export interface ContentStructure {
  pageId: string;
  headings?: Array<{
    level: number;                    // h1=1, h2=2, h3=3など
    text: string;
    position: number;                 // コンテンツ内の位置（文字数）
  }>;
  sections?: Array<{
    title: string;
    startPosition: number;
    endPosition: number;
    type: 'paragraph' | 'list' | 'table' | 'diagram' | 'code' | 'image';
  }>;
  hasImages?: boolean;
  hasDiagrams?: boolean;
  hasTables?: boolean;
  hasLists?: boolean;
  wordCount?: number;
  readingTime?: number;               // 推定読了時間（分）
}

/**
 * ページ間の関連性
 */
export interface PageRelations {
  pageId: string;
  previousPageId?: string;
  nextPageId?: string;
  similarPages?: Array<{
    pageId: string;
    similarity: number;               // 0-1の類似度スコア
    reason?: string;                  // 類似している理由
  }>;
  references?: string[];               // 参照しているページID
  referencedBy?: string[];            // 参照されているページID
  topics?: string[];                  // トピックタグ
  topicHierarchy?: Array<{
    level: number;
    topic: string;
  }>;
}

/**
 * フォーマットパターン
 */
export interface FormatPattern {
  pageId: string;
  layoutType?: 'single-column' | 'two-column' | 'grid' | 'mixed';
  stylePattern?: {
    hasKeyMessage?: boolean;
    hasCards?: boolean;
    colorScheme?: string;
    visualElements?: string[];
  };
  contentPattern?: {
    structure?: 'narrative' | 'list-based' | 'comparison' | 'process-flow';
    hasIntroduction?: boolean;
    hasConclusion?: boolean;
    hasCallToAction?: boolean;
  };
}

