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
 * 埋め込みを生成
 * 
 * @param text 埋め込みを生成するテキスト
 * @param config 設定（オプション）
 * @returns 埋め込みベクトル（配列）
 */
export async function generateEmbedding(
  text: string,
  config: EmbeddingConfig = {}
): Promise<number[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const apiKey = config.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenAI APIキーが設定されていません。埋め込み生成をスキップします。');
    throw new Error('OpenAI APIキーが設定されていません');
  }

  try {
    // HTMLタグを除去してテキストのみを取得
    const cleanText = stripHtml(text).trim();
    
    if (!cleanText) {
      throw new Error('テキストが空です');
    }

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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `埋め込み生成エラー: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('埋め込みデータの形式が不正です');
    }

    return data.data[0].embedding as number[];
  } catch (error) {
    console.error('埋め込み生成エラー:', error);
    throw error;
  }
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

