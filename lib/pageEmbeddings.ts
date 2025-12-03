/**
 * ページ埋め込みの管理ユーティリティ
 * Firestoreへの保存・取得・検索機能を提供
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { generateCombinedEmbedding, cosineSimilarity } from './embeddings';
import { PageEmbedding } from '@/types/pageMetadata';

/**
 * ページ埋め込みを保存
 * 
 * @param pageId ページID
 * @param title ページタイトル
 * @param content ページコンテンツ
 * @param planId 事業計画ID（オプション）
 * @param conceptId 構想ID（オプション）
 */
export async function savePageEmbedding(
  pageId: string,
  title: string,
  content: string,
  planId?: string,
  conceptId?: string
): Promise<void> {
  if (!db) {
    throw new Error('Firestoreが初期化されていません');
  }

  try {
    // 埋め込みを生成
    const combinedEmbedding = await generateCombinedEmbedding(title, content);
    
    // Firestoreに保存
    const embeddingData: PageEmbedding = {
      pageId,
      combinedEmbedding,
      embeddingModel: 'text-embedding-3-small',
      embeddingVersion: '1.0',
      createdAt: new Date().toISOString(),
    };

    // 追加情報があれば保存
    if (planId) {
      (embeddingData as any).planId = planId;
    }
    if (conceptId) {
      (embeddingData as any).conceptId = conceptId;
    }

    await setDoc(doc(db, 'pageEmbeddings', pageId), embeddingData);
    
    console.log('✅ ページ埋め込みを保存しました:', pageId);
  } catch (error) {
    console.error('ページ埋め込みの保存エラー:', error);
    // エラーが発生しても処理を続行（埋め込みはオプショナル）
    throw error;
  }
}

/**
 * ページ埋め込みを非同期で生成・保存
 * エラーが発生しても処理を続行する（オプショナルな機能のため）
 * 
 * @param pageId ページID
 * @param title ページタイトル
 * @param content ページコンテンツ
 * @param planId 事業計画ID（オプション）
 * @param conceptId 構想ID（オプション）
 */
export async function savePageEmbeddingAsync(
  pageId: string,
  title: string,
  content: string,
  planId?: string,
  conceptId?: string
): Promise<void> {
  // 非同期で実行（エラーは無視）
  savePageEmbedding(pageId, title, content, planId, conceptId).catch((error) => {
    console.warn('ページ埋め込みの非同期保存でエラーが発生しました（無視されます）:', error);
  });
}

/**
 * ページ埋め込みを取得
 * 
 * @param pageId ページID
 * @returns ページ埋め込みデータ、またはnull
 */
export async function getPageEmbedding(pageId: string): Promise<PageEmbedding | null> {
  if (!db) {
    throw new Error('Firestoreが初期化されていません');
  }

  try {
    const docRef = doc(db, 'pageEmbeddings', pageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as PageEmbedding;
    }
    
    return null;
  } catch (error) {
    console.error('ページ埋め込みの取得エラー:', error);
    throw error;
  }
}

/**
 * 類似ページを検索
 * 
 * @param queryText 検索クエリテキスト
 * @param limit 返す結果の最大数（デフォルト: 5）
 * @param planId 事業計画IDでフィルタ（オプション）
 * @param conceptId 構想IDでフィルタ（オプション）
 * @returns 類似ページの配列（pageIdとsimilarityを含む）
 */
export async function findSimilarPages(
  queryText: string,
  limit: number = 5,
  planId?: string,
  conceptId?: string
): Promise<Array<{ pageId: string; similarity: number; title?: string }>> {
  if (!db) {
    throw new Error('Firestoreが初期化されていません');
  }

  try {
    // クエリの埋め込みを生成
    const { generateEmbedding } = await import('./embeddings');
    const queryEmbedding = await generateEmbedding(queryText);

    // 埋め込みコレクションから取得
    let q = query(collection(db, 'pageEmbeddings'));
    
    // フィルタを追加
    if (planId) {
      q = query(q, where('planId', '==', planId));
    }
    if (conceptId) {
      q = query(q, where('conceptId', '==', conceptId));
    }

    const embeddingsSnapshot = await getDocs(q);

    // コサイン類似度を計算
    const similarities: Array<{ pageId: string; similarity: number; title?: string }> = [];
    
    for (const docSnap of embeddingsSnapshot.docs) {
      const embeddingData = docSnap.data() as PageEmbedding;
      
      if (!embeddingData.combinedEmbedding || embeddingData.combinedEmbedding.length === 0) {
        continue;
      }

      try {
        const similarity = cosineSimilarity(queryEmbedding, embeddingData.combinedEmbedding);
        similarities.push({
          pageId: embeddingData.pageId,
          similarity,
        });
      } catch (error) {
        console.warn(`ページ ${embeddingData.pageId} の類似度計算でエラー:`, error);
      }
    }

    // 類似度でソートして上位を返す
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    console.error('類似ページ検索エラー:', error);
    throw error;
  }
}

/**
 * 特定のページに類似するページを検索
 * 
 * @param pageId 基準となるページID
 * @param limit 返す結果の最大数（デフォルト: 5）
 * @returns 類似ページの配列
 */
export async function findSimilarPagesByPageId(
  pageId: string,
  limit: number = 5
): Promise<Array<{ pageId: string; similarity: number }>> {
  if (!db) {
    throw new Error('Firestoreが初期化されていません');
  }

  try {
    // 基準ページの埋め込みを取得
    const pageEmbedding = await getPageEmbedding(pageId);
    
    if (!pageEmbedding || !pageEmbedding.combinedEmbedding) {
      return [];
    }

    // すべての埋め込みを取得
    const embeddingsSnapshot = await getDocs(collection(db, 'pageEmbeddings'));

    // コサイン類似度を計算
    const similarities: Array<{ pageId: string; similarity: number }> = [];
    
    for (const docSnap of embeddingsSnapshot.docs) {
      const embeddingData = docSnap.data() as PageEmbedding;
      
      // 自分自身は除外
      if (embeddingData.pageId === pageId) {
        continue;
      }

      if (!embeddingData.combinedEmbedding || embeddingData.combinedEmbedding.length === 0) {
        continue;
      }

      try {
        const similarity = cosineSimilarity(
          pageEmbedding.combinedEmbedding,
          embeddingData.combinedEmbedding
        );
        similarities.push({
          pageId: embeddingData.pageId,
          similarity,
        });
      } catch (error) {
        console.warn(`ページ ${embeddingData.pageId} の類似度計算でエラー:`, error);
      }
    }

    // 類似度でソートして上位を返す
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    console.error('類似ページ検索エラー:', error);
    throw error;
  }
}

/**
 * 既存のページ埋め込みを一括更新
 * メタデータがない既存ページに埋め込みを生成する際に使用
 * 
 * @param pages ページデータの配列
 * @param planId 事業計画ID（オプション）
 * @param conceptId 構想ID（オプション）
 */
export async function batchUpdatePageEmbeddings(
  pages: Array<{ id: string; title: string; content: string }>,
  planId?: string,
  conceptId?: string
): Promise<void> {
  if (!db) {
    throw new Error('Firestoreが初期化されていません');
  }

  console.log(`📊 ${pages.length}件のページ埋め込みを一括生成します...`);

  for (const page of pages) {
    try {
      // 既に埋め込みが存在するかチェック
      const existing = await getPageEmbedding(page.id);
      if (existing) {
        console.log(`⏭️  ページ ${page.id} は既に埋め込みが存在するためスキップ`);
        continue;
      }

      await savePageEmbedding(page.id, page.title, page.content, planId, conceptId);
      
      // APIレート制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`ページ ${page.id} の埋め込み生成エラー:`, error);
      // エラーが発生しても続行
    }
  }

  console.log('✅ ページ埋め込みの一括生成が完了しました');
}

