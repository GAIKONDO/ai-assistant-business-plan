/**
 * ページ生成ユーティリティ
 * GPT APIを使用して過去のページやフォーマットを参考に新しいページを生成
 */

import { findSimilarPages } from './pageEmbeddings';
import { getPageStructure } from './pageStructure';
import { PageMetadata } from '@/types/pageMetadata';
import { stripHtml } from './pageMetadataUtils';
import { db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { PageTemplate, getPageTemplate } from './pageTemplates';

/**
 * GPT API設定
 */
interface GPTConfig {
  model?: string;
  apiKey?: string;
  apiUrl?: string;
  temperature?: number;
  maxTokens?: number;
  maxCompletionTokens?: number;
}

const DEFAULT_GPT_CONFIG: GPTConfig = {
  model: 'gpt-4.1-mini', // デフォルトモデル
  apiUrl: 'https://api.openai.com/v1/chat/completions',
  temperature: 0.7,
  maxTokens: 2000,
  maxCompletionTokens: 2000,
};

/**
 * GPT APIを呼び出してテキストを生成
 */
async function callGPTAPI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  config: GPTConfig = {}
): Promise<string> {
  const finalConfig = { ...DEFAULT_GPT_CONFIG, ...config };
  const apiKey = config.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI APIキーが設定されていません');
  }

  try {
    const requestBody: any = {
      model: finalConfig.model,
      messages,
    };
    
    // モデルによってmax_tokensまたはmax_completion_tokensを使用
    // gpt-5系のモデルはmax_completion_tokensを使用
    if (finalConfig.model?.startsWith('gpt-5')) {
      requestBody.max_completion_tokens = finalConfig.maxCompletionTokens || finalConfig.maxTokens || 2000;
      // gpt-5系のモデルではtemperatureはサポートされていないため設定しない
    } else {
      requestBody.max_tokens = finalConfig.maxTokens || 2000;
      requestBody.temperature = finalConfig.temperature;
    }
    
    const response = await fetch(finalConfig.apiUrl!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `GPT APIエラー: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('GPT APIの応答形式が不正です');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('GPT API呼び出しエラー:', error);
    throw error;
  }
}

/**
 * 参考ページの情報を取得
 */
async function getReferencePageInfo(
  pageId: string,
  planId?: string,
  conceptId?: string,
  subMenuId?: string
): Promise<{
  page: PageMetadata | null;
  structure: Awaited<ReturnType<typeof getPageStructure>>;
}> {
  if (!db) {
    throw new Error('Firestoreが初期化されていません');
  }

  let page: PageMetadata | null = null;
  let structure = null;

  try {
    // ページデータを取得
    if (planId) {
      // 会社本体の事業計画の場合
      const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
      if (planDoc.exists()) {
        const planData = planDoc.data();
        const pagesBySubMenu = (planData.pagesBySubMenu || {}) as { [key: string]: Array<PageMetadata> };
        
        // すべてのサブメニューからページを検索
        const allPages = Object.values(pagesBySubMenu).flat();
        page = allPages.find(p => p.id === pageId) || null;
      }
    } else if (conceptId) {
      // 構想の場合
      const conceptsQuery = query(
        collection(db, 'concepts'),
        where('conceptId', '==', conceptId)
      );
      const conceptsSnapshot = await getDocs(conceptsQuery);
      if (!conceptsSnapshot.empty) {
        const conceptData = conceptsSnapshot.docs[0].data();
        const pagesBySubMenu = (conceptData.pagesBySubMenu || {}) as { [key: string]: Array<PageMetadata> };
        
        // すべてのサブメニューからページを検索
        const allPages = Object.values(pagesBySubMenu).flat();
        page = allPages.find(p => p.id === pageId) || null;
      }
    }

    // 構造データを取得
    try {
      structure = await getPageStructure(pageId);
    } catch (error) {
      console.warn(`ページ ${pageId} の構造データ取得エラー:`, error);
    }
  } catch (error) {
    console.error(`ページ ${pageId} の情報取得エラー:`, error);
  }

  return { page, structure };
}

/**
 * フォーマットパターンの説明を生成
 */
function formatPatternDescription(structure: any): string {
  if (!structure) return '';

  const parts: string[] = [];

  // レイアウトタイプ
  if (structure.formatPattern?.layoutType) {
    parts.push(`レイアウト: ${structure.formatPattern.layoutType}`);
  }

  // スタイルパターン
  if (structure.formatPattern?.stylePattern) {
    const style = structure.formatPattern.stylePattern;
    if (style.hasKeyMessage) parts.push('キーメッセージあり');
    if (style.hasCards) parts.push('カードレイアウトあり');
    if (style.visualElements && style.visualElements.length > 0) {
      parts.push(`視覚要素: ${style.visualElements.join(', ')}`);
    }
  }

  // コンテンツパターン
  if (structure.formatPattern?.contentPattern) {
    const content = structure.formatPattern.contentPattern;
    if (content.structure) parts.push(`構造タイプ: ${content.structure}`);
    if (content.hasIntroduction) parts.push('導入部分あり');
    if (content.hasConclusion) parts.push('結論部分あり');
  }

  // コンテンツ構造
  if (structure.contentStructure) {
    const cs = structure.contentStructure;
    if (cs.headings && cs.headings.length > 0) {
      parts.push(`見出し数: ${cs.headings.length}個`);
    }
    if (cs.hasImages) parts.push('画像あり');
    if (cs.hasDiagrams) parts.push('図表あり');
    if (cs.hasTables) parts.push('テーブルあり');
  }

  return parts.join(', ');
}

/**
 * 類似ページを参考に新しいページを生成
 */
export async function generatePageFromSimilar(
  query: string,
  subMenuId: string,
  planId?: string,
  conceptId?: string,
  referencePageIds?: string[],
  model?: string,
  evidenceText?: string
): Promise<{
  title: string;
  content: string;
  referencePages: Array<{ pageId: string; similarity: number; title?: string }>;
}> {
  try {
    // 1. 類似ページを検索
    let similarPages: Array<{ pageId: string; similarity: number; title?: string }> = [];
    
    if (referencePageIds && referencePageIds.length > 0) {
      // 指定されたページIDを使用
      similarPages = referencePageIds.map((id, idx) => ({
        pageId: id,
        similarity: 1 - idx * 0.1, // 仮の類似度
      }));
    } else {
      // クエリに基づいて類似ページを検索
      similarPages = await findSimilarPages(query, 5, planId, conceptId);
    }

    if (similarPages.length === 0) {
      throw new Error('参考となる類似ページが見つかりませんでした');
    }

    // 2. 参考ページの情報を取得
    const referencePagesInfo = await Promise.all(
      similarPages.slice(0, 3).map(async (sp) => {
        const info = await getReferencePageInfo(sp.pageId, planId, conceptId, subMenuId);
        return {
          pageId: sp.pageId,
          similarity: sp.similarity,
          title: info.page?.title || sp.title || sp.pageId,
          content: info.page?.content || '',
          structure: info.structure,
        };
      })
    );

    // 3. 最も類似度の高いページの構造を分析
    const primaryReference = referencePagesInfo[0];
    const formatDescription = formatPatternDescription(primaryReference.structure);
    
    // 参考ページのコンテンツ例を取得（HTMLタグを除去してテキストのみ）
    const referenceContentExamples = referencePagesInfo
      .map(r => r.content ? stripHtml(r.content).substring(0, 300) : '')
      .filter(Boolean)
      .join('\n\n---\n\n');

    // 4. GPT APIを使用してページを生成（GPT-4.1とGPT-5で同じプロンプトを使用）
    const systemPrompt = `あなたは事業計画書のページを作成する専門家です。
過去のページのフォーマットや構造を参考にしながら、新しいページのコンテンツをHTML形式で生成してください。

重要な要件:
- HTMLタグを使用して構造化されたコンテンツを生成
- 見出し（h2, h3）を使用してセクションを明確に
- 段落（p）を使用してテキストを記述
- リスト（ul, ol, li）を適切に使用
- 参考ページのフォーマットパターンを尊重
- 日本語で自然な文章を生成
- 具体的で実用的な内容を生成`;

    // テーマとエビデンスを分離
    const themeMatch = query.match(/^(.+?)(?:\n\n【参照エビデンス】|$)/s);
    const theme = themeMatch ? themeMatch[1].trim() : query;
    const evidence = evidenceText || (query.includes('【参照エビデンス】') ? query.split('【参照エビデンス】')[1] : '');

    const userPrompt = `以下の情報を参考に、新しいページを生成してください。

【生成するページのテーマ】
${theme}

${evidence ? `【参照エビデンス】
${evidence}` : ''}

【参考ページのフォーマットパターン】
${formatDescription || 'フォーマット情報なし'}

【参考ページのタイトル例】
${referencePagesInfo.map(r => r.title || r.pageId).join(', ')}

${referenceContentExamples ? `【参考ページのコンテンツ例】
${referenceContentExamples}` : ''}

上記の情報を参考に、以下の形式でページを生成してください:
1. ページタイトル（1行）
2. HTMLコンテンツ（複数行）

出力形式:
TITLE: [ページタイトル]
CONTENT:
[HTMLコンテンツ]`;

    const generatedText = await callGPTAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], model ? { model } : {});

    // 5. 生成されたテキストを解析
    const titleMatch = generatedText.match(/TITLE:\s*(.+)/i);
    const contentMatch = generatedText.match(/CONTENT:\s*([\s\S]+)/i);

    let title = query;
    let content = '';

    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    if (contentMatch) {
      content = contentMatch[1].trim();
    } else {
      // CONTENT: が見つからない場合、TITLE: 以降をコンテンツとして扱う
      const afterTitle = generatedText.replace(/TITLE:.*/i, '').trim();
      content = afterTitle || generatedText;
    }

    // コンテンツが空の場合はデフォルトを生成
    if (!content.trim()) {
      content = `<h2>${title}</h2>
<p>${query}に関する内容をここに記述します。</p>`;
    }

    return {
      title,
      content,
      referencePages: similarPages,
    };
  } catch (error) {
    console.error('ページ生成エラー:', error);
    throw error;
  }
}

/**
 * テンプレートをベースに新しいページを生成
 */
export async function generatePageFromTemplate(
  query: string,
  templateId: string,
  subMenuId: string,
  model?: string,
  evidenceText?: string
): Promise<{
  title: string;
  content: string;
  template: PageTemplate;
}> {
  try {
    // テンプレートを取得
    const template = await getPageTemplate(templateId);
    
    if (!template) {
      throw new Error('テンプレートが見つかりませんでした');
    }

    // テンプレートの構造情報を取得
    const formatDescription = formatPatternDescription(template.structure || null);
    
    // GPT APIを使用してページを生成（GPT-4.1とGPT-5で同じプロンプトを使用）
    
    // テーマとエビデンスを分離
    const themeMatch = query.match(/^(.+?)(?:\n\n【参照エビデンス】|$)/s);
    const theme = themeMatch ? themeMatch[1].trim() : query;
    const evidence = evidenceText || (query.includes('【参照エビデンス】') ? query.split('【参照エビデンス】')[1] : '');

    const systemPrompt = `あなたは事業計画書のページを作成する専門家です。
テンプレートページのフォーマットや構造を厳密に守りながら、新しいテーマに沿った内容でページを生成してください。

重要な要件:
- テンプレートページのHTML構造を完全に維持する
- テンプレートページと同じ見出しレベルとセクション構造を使用
- テンプレートページと同じHTMLタグの種類と配置パターンを使用
- テーマに沿った新しい内容を生成するが、構造はテンプレートに従う
- 日本語で自然な文章を生成
- 具体的で実用的な内容を生成`;

    const userPrompt = `以下のテンプレートページを参考に、新しいテーマでページを生成してください。

【生成するページのテーマ】
${theme}

${evidence ? `【参照エビデンス】
${evidence}` : ''}

【テンプレートページのタイトル】
${template.pageTitle}

【テンプレートページのフォーマットパターン】
${formatDescription || 'フォーマット情報なし'}

【テンプレートページのHTML構造例】
${template.pageContent.substring(0, 2000)}

上記のテンプレートページの構造を厳密に守りながら、テーマ「${theme}」に沿った新しい内容でページを生成してください。
テンプレートと同じHTML構造（見出しレベル、セクション、リスト、段落など）を使用し、内容のみを新しいテーマに合わせて変更してください。

出力形式:
TITLE: [ページタイトル]
CONTENT:
[HTMLコンテンツ]`;

    const generatedText = await callGPTAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], model ? { model } : {});

    // 生成されたテキストを解析
    const titleMatch = generatedText.match(/TITLE:\s*(.+)/i);
    const contentMatch = generatedText.match(/CONTENT:\s*([\s\S]+)/i);

    let title = query;
    let content = '';

    if (titleMatch) {
      title = titleMatch[1].trim();
    }

    if (contentMatch) {
      content = contentMatch[1].trim();
    } else {
      // CONTENT: が見つからない場合、TITLE: 以降をコンテンツとして扱う
      const afterTitle = generatedText.replace(/TITLE:.*/i, '').trim();
      content = afterTitle || generatedText;
    }

    // コンテンツが空の場合はテンプレートをベースに生成
    if (!content.trim()) {
      // テンプレートの構造を維持しつつ、内容を置き換える
      content = template.pageContent.replace(
        new RegExp(template.pageTitle, 'g'),
        title
      );
    }

    return {
      title,
      content,
      template,
    };
  } catch (error) {
    console.error('テンプレートベースページ生成エラー:', error);
    throw error;
  }
}

/**
 * 複数の参考ページのコンテンツを取得して統合
 */
export async function getReferencePagesContent(
  pageIds: string[],
  planId?: string,
  conceptId?: string
): Promise<Array<{ pageId: string; title: string; content: string }>> {
  // 実際の実装では、Firestoreからページデータを取得
  // ここでは簡易版として空の配列を返す
  return [];
}

