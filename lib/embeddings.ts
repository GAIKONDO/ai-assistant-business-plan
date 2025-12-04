/**
 * ベクトル埋め込み生成ユーティリティ
 * OpenAI Embeddings APIまたは代替APIを使用してテキストの埋め込みを生成
 */

import { stripHtml } from './pageMetadataUtils';

/**
 * 埋め込み生成の設定
 */
export interface EmbeddingConfig {
  model?: string;
  apiKey?: string;
  apiUrl?: string;
}

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG: EmbeddingConfig = {
  model: 'text-embedding-3-small', // コスト効率の良いモデル
  apiUrl: 'https://api.openai.com/v1/embeddings',
};

/**
 * 埋め込みを生成（リトライロジック付き）
 * 
 * @param text 埋め込みを生成するテキスト
 * @param config 設定（オプション）
 * @param retries リトライ回数（デフォルト: 3）
 * @returns 埋め込みベクトル（配列）
 */
export async function generateEmbedding(
  text: string,
  config: EmbeddingConfig = {},
  retries: number = 3
): Promise<number[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const apiKey = config.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenAI APIキーが設定されていません。埋め込み生成をスキップします。');
    throw new Error('OpenAI APIキーが設定されていません');
  }

  // HTMLタグを除去してテキストのみを取得
  const cleanText = stripHtml(text).trim();
  
  if (!cleanText) {
    throw new Error('テキストが空です');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // OpenAI Embeddings APIを呼び出し
      const response = await fetch(finalConfig.apiUrl!, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: finalConfig.model,
          input: cleanText,
        }),
      });

      // レート制限エラー（429）の場合はリトライ
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        
        if (attempt < retries) {
          console.warn(`APIレート制限に達しました。${waitTime}ms待機してリトライします... (${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `埋め込み生成エラー: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`;
        
        // 5xxエラー（サーバーエラー）の場合はリトライ
        if (response.status >= 500 && attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`サーバーエラーが発生しました。${waitTime}ms待機してリトライします... (${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('埋め込みデータの形式が不正です');
      }

      return data.data[0].embedding as number[];
    } catch (error) {
      lastError = error as Error;
      
      // ネットワークエラーの場合はリトライ
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`ネットワークエラーが発生しました。${waitTime}ms待機してリトライします... (${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // 最後の試行でエラーが発生した場合、またはリトライ不可のエラーの場合
      if (attempt === retries || !(error instanceof TypeError)) {
        console.error('埋め込み生成エラー:', error);
        throw error;
      }
    }
  }

  // ここに到達することはないはずですが、型安全性のため
  throw lastError || new Error('埋め込み生成に失敗しました');
}

/**
 * タイトルとコンテンツを組み合わせた埋め込みを生成
 * 
 * @param title ページタイトル
 * @param content ページコンテンツ（HTML形式）
 * @param config 設定（オプション）
 * @returns 埋め込みベクトル（配列）
 */
export async function generateCombinedEmbedding(
  title: string,
  content: string,
  config: EmbeddingConfig = {}
): Promise<number[]> {
  // タイトルとコンテンツを組み合わせて埋め込みを生成
  const combinedText = `${title}\n\n${content}`;
  return generateEmbedding(combinedText, config);
}

/**
 * タイトルとコンテンツを分離して埋め込みを生成
 * 
 * @param title ページタイトル
 * @param content ページコンテンツ（HTML形式）
 * @param config 設定（オプション）
 * @returns タイトルとコンテンツの埋め込みベクトル
 */
export async function generateSeparatedEmbeddings(
  title: string,
  content: string,
  config: EmbeddingConfig = {}
): Promise<{ titleEmbedding: number[]; contentEmbedding: number[] }> {
  const [titleEmbedding, contentEmbedding] = await Promise.all([
    generateEmbedding(title, config),
    generateEmbedding(content, config),
  ]);
  
  return { titleEmbedding, contentEmbedding };
}

/**
 * メタデータを活用した埋め込みを生成
 * タイトルに重み付けし、メタデータ（keywords, semanticCategory等）を含める
 * 
 * @param title ページタイトル
 * @param content ページコンテンツ（HTML形式）
 * @param metadata メタデータ（オプション）
 * @param config 設定（オプション）
 * @returns 埋め込みベクトル（配列）
 */
export async function generateEnhancedEmbedding(
  title: string,
  content: string,
  metadata?: {
    keywords?: string[];
    semanticCategory?: string;
    tags?: string[];
    summary?: string;
  },
  config: EmbeddingConfig = {}
): Promise<number[]> {
  // タイトルに重み付け（3回繰り返しで重要度を上げる）
  const weightedTitle = `${title}\n${title}\n${title}`;
  
  // メタデータを組み合わせ
  const metadataParts: string[] = [];
  if (metadata?.semanticCategory) {
    metadataParts.push(metadata.semanticCategory);
  }
  if (metadata?.keywords && metadata.keywords.length > 0) {
    // 上位5キーワードを使用
    metadataParts.push(...metadata.keywords.slice(0, 5).join(' '));
  }
  if (metadata?.tags && metadata.tags.length > 0) {
    // 上位3タグを使用
    metadataParts.push(...metadata.tags.slice(0, 3).join(' '));
  }
  if (metadata?.summary) {
    metadataParts.push(metadata.summary);
  }
  
  const metadataText = metadataParts.join('\n');
  
  // 構造化されたテキストを生成
  const enhancedText = metadataText 
    ? `${weightedTitle}\n\n${metadataText}\n\n${content}`
    : `${weightedTitle}\n\n${content}`;
  
  return generateEmbedding(enhancedText, config);
}

/**
 * タイトルとコンテンツの埋め込みを重み付きで統合
 * 
 * @param titleEmbedding タイトルの埋め込みベクトル
 * @param contentEmbedding コンテンツの埋め込みベクトル
 * @param titleWeight タイトルの重み（デフォルト: 0.4）
 * @param contentWeight コンテンツの重み（デフォルト: 0.6）
 * @returns 統合された埋め込みベクトル
 */
export function combineWeightedEmbeddings(
  titleEmbedding: number[],
  contentEmbedding: number[],
  titleWeight: number = 0.4,
  contentWeight: number = 0.6
): number[] {
  if (titleEmbedding.length !== contentEmbedding.length) {
    throw new Error('タイトルとコンテンツの埋め込みベクトルの次元が一致しません');
  }
  
  // 重み付きで統合
  return titleEmbedding.map((val, i) => 
    val * titleWeight + contentEmbedding[i] * contentWeight
  );
}

/**
 * メタデータのみの埋め込みを生成
 * 
 * @param metadata メタデータ
 * @param config 設定（オプション）
 * @returns メタデータの埋め込みベクトル
 */
export async function generateMetadataEmbedding(
  metadata: {
    keywords?: string[];
    semanticCategory?: string;
    tags?: string[];
    summary?: string;
  },
  config: EmbeddingConfig = {}
): Promise<number[]> {
  const metadataParts: string[] = [];
  
  if (metadata.semanticCategory) {
    metadataParts.push(metadata.semanticCategory);
  }
  if (metadata.keywords && metadata.keywords.length > 0) {
    metadataParts.push(...metadata.keywords.slice(0, 10)); // 上位10キーワード
  }
  if (metadata.tags && metadata.tags.length > 0) {
    metadataParts.push(...metadata.tags.slice(0, 5)); // 上位5タグ
  }
  if (metadata.summary) {
    metadataParts.push(metadata.summary);
  }
  
  const metadataText = metadataParts.join('\n');
  
  if (!metadataText.trim()) {
    // メタデータが空の場合は空のベクトルを返す（後で処理）
    throw new Error('メタデータが空です');
  }
  
  return generateEmbedding(metadataText, config);
}

/**
 * 複数のテキストの埋め込みを一括生成
 * 
 * @param texts テキストの配列
 * @param config 設定（オプション）
 * @returns 埋め込みベクトルの配列
 */
export async function generateBatchEmbeddings(
  texts: string[],
  config: EmbeddingConfig = {}
): Promise<number[][]> {
  // OpenAI APIはバッチリクエストをサポートしているが、ここでは順次処理
  // 実際の実装では、APIのバッチ機能を使用することを推奨
  const embeddings: number[][] = [];
  
  for (const text of texts) {
    try {
      const embedding = await generateEmbedding(text, config);
      embeddings.push(embedding);
    } catch (error) {
      console.error(`テキスト「${text.substring(0, 50)}...」の埋め込み生成に失敗:`, error);
      // エラーが発生した場合は空の配列を追加（またはスキップ）
      embeddings.push([]);
    }
  }
  
  return embeddings;
}

/**
 * コサイン類似度を計算
 * 
 * @param vecA ベクトルA
 * @param vecB ベクトルB
 * @returns コサイン類似度（0-1の値）
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(`ベクトルの次元が一致しません: ${vecA.length} vs ${vecB.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * ユークリッド距離を計算
 * 
 * @param vecA ベクトルA
 * @param vecB ベクトルB
 * @returns ユークリッド距離
 */
export function euclideanDistance(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(`ベクトルの次元が一致しません: ${vecA.length} vs ${vecB.length}`);
  }

  let sumSquaredDiff = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sumSquaredDiff += diff * diff;
  }

  return Math.sqrt(sumSquaredDiff);
}

