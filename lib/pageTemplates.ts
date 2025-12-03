/**
 * ページテンプレート管理ユーティリティ
 * Firestoreへの保存・取得機能を提供
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { PageMetadata } from '@/types/pageMetadata';
import { getPageStructure } from './pageStructure';

/**
 * ページテンプレートの型定義
 */
export interface PageTemplate {
  id: string;
  name: string;
  description?: string;
  pageId: string; // 元のページID
  pageTitle: string;
  pageContent: string;
  subMenuId: string;
  planId?: string;
  conceptId?: string;
  structure?: {
    contentStructure?: any;
    formatPattern?: any;
    pageRelations?: any;
  };
  createdAt: string;
  updatedAt: string;
  userId: string;
}

/**
 * テンプレートを保存
 */
export async function savePageTemplate(
  pageId: string,
  name: string,
  description: string,
  planId?: string,
  conceptId?: string
): Promise<string> {
  if (!db || !auth?.currentUser) {
    throw new Error('Firebaseが初期化されていません');
  }

  try {
    // ページデータを取得
    let pageData: PageMetadata | null = null;
    let subMenuId = 'overview';

    if (planId) {
      // 会社本体の事業計画の場合
      const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
      if (planDoc.exists()) {
        const planData = planDoc.data();
        const pagesBySubMenu = (planData.pagesBySubMenu || {}) as { [key: string]: Array<PageMetadata> };
        
        // すべてのサブメニューからページを検索
        for (const [subMenu, pages] of Object.entries(pagesBySubMenu)) {
          const found = pages.find(p => p.id === pageId);
          if (found) {
            pageData = found;
            subMenuId = subMenu;
            break;
          }
        }
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
        for (const [subMenu, pages] of Object.entries(pagesBySubMenu)) {
          const found = pages.find(p => p.id === pageId);
          if (found) {
            pageData = found;
            subMenuId = subMenu;
            break;
          }
        }
      }
    }

    if (!pageData) {
      throw new Error('ページが見つかりませんでした');
    }

    // 構造データを取得
    let structure = null;
    try {
      structure = await getPageStructure(pageId);
    } catch (error) {
      console.warn(`ページ ${pageId} の構造データ取得エラー:`, error);
    }

    // テンプレートIDを生成
    const templateId = `template-${Date.now()}`;

    // テンプレートデータを作成（undefinedのフィールドを削除）
    const templateData: any = {
      id: templateId,
      name: name.trim(),
      description: description.trim() || '',
      pageId,
      pageTitle: pageData.title,
      pageContent: pageData.content,
      subMenuId,
      userId: auth.currentUser.uid,
    };

    // オプショナルフィールドを追加（undefinedでない場合のみ）
    if (planId) {
      templateData.planId = planId;
    }
    if (conceptId) {
      templateData.conceptId = conceptId;
    }
    if (structure) {
      templateData.structure = structure;
    }

    // Firestoreに保存
    await setDoc(doc(db, 'pageTemplates', templateId), {
      ...templateData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ テンプレートを保存しました:', templateId);
    return templateId;
  } catch (error) {
    console.error('テンプレート保存エラー:', error);
    throw error;
  }
}

/**
 * ユーザーのテンプレート一覧を取得
 */
export async function getUserTemplates(
  planId?: string,
  conceptId?: string
): Promise<PageTemplate[]> {
  if (!db || !auth?.currentUser) {
    throw new Error('Firebaseが初期化されていません');
  }

  try {
    let q = query(
      collection(db, 'pageTemplates'),
      where('userId', '==', auth.currentUser.uid)
    );

    // フィルタを追加
    if (planId) {
      q = query(q, where('planId', '==', planId));
    } else if (conceptId) {
      q = query(q, where('conceptId', '==', conceptId));
    }

    const snapshot = await getDocs(q);
    const templates: PageTemplate[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      templates.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        pageId: data.pageId,
        pageTitle: data.pageTitle,
        pageContent: data.pageContent,
        subMenuId: data.subMenuId,
        planId: data.planId,
        conceptId: data.conceptId,
        structure: data.structure,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        userId: data.userId,
      });
    });

    // 作成日時でソート（新しい順）
    templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return templates;
  } catch (error) {
    console.error('テンプレート取得エラー:', error);
    throw error;
  }
}

/**
 * テンプレートを取得
 */
export async function getPageTemplate(templateId: string): Promise<PageTemplate | null> {
  if (!db) {
    throw new Error('Firestoreが初期化されていません');
  }

  try {
    const docRef = doc(db, 'pageTemplates', templateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        pageId: data.pageId,
        pageTitle: data.pageTitle,
        pageContent: data.pageContent,
        subMenuId: data.subMenuId,
        planId: data.planId,
        conceptId: data.conceptId,
        structure: data.structure,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        userId: data.userId,
      };
    }
    
    return null;
  } catch (error) {
    console.error('テンプレート取得エラー:', error);
    throw error;
  }
}

/**
 * テンプレートを削除
 */
export async function deletePageTemplate(templateId: string): Promise<void> {
  if (!db || !auth?.currentUser) {
    throw new Error('Firebaseが初期化されていません');
  }

  try {
    // ユーザーが所有しているか確認
    const template = await getPageTemplate(templateId);
    if (!template) {
      throw new Error('テンプレートが見つかりません');
    }

    if (template.userId !== auth.currentUser.uid) {
      throw new Error('このテンプレートを削除する権限がありません');
    }

    await deleteDoc(doc(db, 'pageTemplates', templateId));
    console.log('✅ テンプレートを削除しました:', templateId);
  } catch (error) {
    console.error('テンプレート削除エラー:', error);
    throw error;
  }
}

