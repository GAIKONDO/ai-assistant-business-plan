'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, setDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { SUB_MENU_ITEMS } from '@/components/ConceptSubMenu';

interface MigrateFromFixedPageProps {
  serviceId: string;
  conceptId: string;
  subMenuId: string;
  onMigrated: (newConceptId?: string) => void;
  onClose: () => void;
}

/**
 * 固定ページからページコンポーネントへの一括移行コンポーネント
 * 
 * 使用方法:
 * 1. 固定ページでDraftを作成（Vibeコーディングで作成）
 * 2. このコンポーネントで一括移行
 * 3. ページコンポーネントで清書・編集
 */
export default function MigrateFromFixedPage({
  serviceId,
  conceptId,
  subMenuId,
  onMigrated,
  onClose,
}: MigrateFromFixedPageProps) {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState('');
  const [extractedPages, setExtractedPages] = useState<Array<{
    id: string;
    title: string;
    content: string;
    pageNumber: number;
    pageId: string; // data-page-containerの値を保持
  }>>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [existingConcept, setExistingConcept] = useState<{ id: string; name: string; pageCount: number; conceptId: string } | null>(null);
  const [existingConcepts, setExistingConcepts] = useState<Array<{ id: string; name: string; pageCount: number; conceptId: string }>>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showConceptSelector, setShowConceptSelector] = useState(false);
  const [showSubMenuSelector, setShowSubMenuSelector] = useState(false);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [selectedSubMenuId, setSelectedSubMenuId] = useState<string>(subMenuId); // デフォルトは現在のサブメニュー
  const [migrationMode, setMigrationMode] = useState<'overwrite' | 'append' | 'new' | null>(null);

  /**
   * HTMLを整形してインデントと改行を追加（元の構造を保持）
   * シンプルな方法：タグの前後に改行を追加するだけ
   */
  const formatHTML = (html: string): string => {
    // HTMLをそのまま保持しつつ、タグの前後に改行を追加
    // ただし、インライン要素の場合は改行を追加しない
    
    // インライン要素のリスト
    const inlineTags = ['span', 'strong', 'em', 'b', 'i', 'u', 'a', 'code', 'br', 'wbr', 'img', 'svg', 'path', 'circle', 'rect', 'line', 'polyline'];
    
    let formatted = html
      // ブロック要素の開始タグの前に改行を追加
      .replace(/<(\/?)(div|h1|h2|h3|h4|h5|h6|p|ul|ol|li|table|thead|tbody|tr|td|th|section|article|header|footer|main|nav|aside|form|button)(\s|>)/gi, '\n<$1$2$3')
      // ブロック要素の終了タグの後に改行を追加
      .replace(/(<\/(div|h1|h2|h3|h4|h5|h6|p|ul|ol|li|table|thead|tbody|tr|td|th|section|article|header|footer|main|nav|aside|form|button)>)/gi, '$1\n')
      // 連続する改行を1つに
      .replace(/\n{3,}/g, '\n\n')
      // 先頭と末尾の改行を削除
      .trim();
    
    // インデントを追加（簡易版）
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const tab = '  ';
    const formattedLines: string[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        formattedLines.push('');
        return;
      }
      
      // 終了タグの場合はインデントを減らす
      if (trimmedLine.startsWith('</')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // インデントを追加
      formattedLines.push(tab.repeat(indentLevel) + trimmedLine);
      
      // 開始タグで自己終了タグでない場合はインデントを増やす
      if (trimmedLine.startsWith('<') && !trimmedLine.startsWith('</') && !trimmedLine.endsWith('/>')) {
        const tagMatch = trimmedLine.match(/^<(\w+)/);
        if (tagMatch) {
          const tagName = tagMatch[1].toLowerCase();
          // インライン要素の場合はインデントを増やさない
          if (!inlineTags.includes(tagName)) {
            indentLevel++;
          }
        }
      }
    });
    
    return formattedLines.join('\n');
  };

  /**
   * 固定ページのコンテンツを抽出
   * data-page-container属性を持つ要素からページを抽出
   */
  const extractPagesFromDOM = () => {
    const pages: Array<{
      id: string;
      title: string;
      content: string;
      pageNumber: number;
      pageId: string; // data-page-containerの値を保持
    }> = [];

    // data-page-container属性を持つ要素を取得
    const containers = document.querySelectorAll('[data-page-container]');
    
    containers.forEach((container, index) => {
      const containerEl = container as HTMLElement;
      const pageId = containerEl.getAttribute('data-page-container') || `page-${index}`;
      
      // タイトルを抽出（h2, h3, または最初の見出し要素）
      let title = '';
      const titleElement = containerEl.querySelector('h2, h3, h1, .page-title');
      if (titleElement) {
        title = titleElement.textContent?.trim() || '';
      } else {
        // タイトルが見つからない場合は、最初のテキストノードから抽出
        const firstText = containerEl.textContent?.trim().split('\n')[0] || '';
        title = firstText.substring(0, 50) || `ページ ${index + 1}`;
      }
      
      // コンテンツを抽出（HTMLを整形して取得）
      const rawHTML = containerEl.innerHTML;
      const content = formatHTML(rawHTML);
      
      pages.push({
        id: `migrated-${pageId}-${Date.now()}`,
        title: title || `ページ ${index + 1}`,
        content: content,
        pageNumber: index,
        pageId: pageId, // data-page-containerの値を保持
      });
    });

    // Page0（キービジュアル）を最初に配置
    const page0Index = pages.findIndex(p => p.pageId === '0' || p.pageId === 'page-0');
    if (page0Index > 0) {
      const page0 = pages.splice(page0Index, 1)[0];
      pages.unshift(page0);
    }

    return pages;
  };

  /**
   * 既存のコンポーネント化された構想をすべて取得
   */
  const getAllExistingConcepts = async () => {
    if (!auth?.currentUser || !db) return [];

    // -componentizedで終わるすべての構想を取得
    const conceptsQuery = query(
      collection(db, 'concepts'),
      where('userId', '==', auth.currentUser.uid),
      where('serviceId', '==', serviceId)
    );
    
    const conceptsSnapshot = await getDocs(conceptsQuery);
    const concepts: Array<{ id: string; name: string; pageCount: number; conceptId: string }> = [];
    
    conceptsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const conceptIdValue = data.conceptId || '';
      
      // -componentizedで終わる構想のみを対象
      if (conceptIdValue.includes('-componentized')) {
        const pagesBySubMenu = data.pagesBySubMenu || {};
        const currentSubMenuPages = pagesBySubMenu[subMenuId] || [];
        
        concepts.push({
          id: doc.id,
          name: data.name || conceptIdValue,
          pageCount: currentSubMenuPages.length,
          conceptId: conceptIdValue,
        });
      }
    });
    
    return concepts;
  };

  /**
   * 既存のコンポーネント化された構想をチェック（標準の-componentized構想）
   */
  const checkExistingConcept = async () => {
    const allConcepts = await getAllExistingConcepts();
    
    // 標準の-componentized構想を探す（タイムスタンプなし）
    const standardConcept = allConcepts.find(c => c.conceptId === `${conceptId}-componentized`);
    
    return standardConcept || null;
  };

  /**
   * 固定ページからページコンポーネントへ移行
   */
  const handleMigrate = async (mode: 'overwrite' | 'append' | 'new', targetConceptId?: string, targetSubMenuId?: string) => {
    if (!auth?.currentUser || !db) {
      alert('ログインが必要です');
      return;
    }

    try {
      setMigrating(true);
      setProgress('ページを抽出中...');

      // 既に抽出されたページがある場合はそれを使用、ない場合は新しく抽出
      let pages = extractedPages.length > 0 ? extractedPages : extractPagesFromDOM();
      
      if (pages.length === 0) {
        alert('移行するページが見つかりませんでした。data-page-container属性を持つ要素を確認してください。');
        setMigrating(false);
        return;
      }

      // 抽出されたページがまだ設定されていない場合は設定
      if (extractedPages.length === 0) {
        setExtractedPages(pages);
        // デフォルトですべて選択
        setSelectedPageIds(new Set(pages.map(p => p.id)));
      }

      // 選択されたページのみをフィルタリング
      const selectedPages = pages.filter(page => selectedPageIds.has(page.id));
      
      if (selectedPages.length === 0) {
        alert('移行するページを1つ以上選択してください。');
        setMigrating(false);
        return;
      }

      setProgress(`${selectedPages.length}件のページを移行中...`);

      // モードに応じて構想IDを決定
      let componentizedConceptId: string;
      let conceptDocId: string;
      let conceptData: any = {};
      let conceptsSnapshot: any = null;

      // 元の構想からキービジュアル設定を取得
      let keyVisualSettings: {
        keyVisualUrl?: string;
        keyVisualHeight?: number;
        keyVisualScale?: number;
        keyVisualLogoUrl?: string;
        keyVisualMetadata?: any;
      } = {};
      
      try {
        const originalConceptQuery = query(
          collection(db, 'concepts'),
          where('userId', '==', auth.currentUser.uid),
          where('serviceId', '==', serviceId),
          where('conceptId', '==', conceptId)
        );
        const originalConceptSnapshot = await getDocs(originalConceptQuery);
        
        if (!originalConceptSnapshot.empty) {
          const originalConceptData = originalConceptSnapshot.docs[0].data();
          // undefinedの値を除外して設定（Firestoreはundefinedをサポートしていない）
          if (originalConceptData.keyVisualUrl !== undefined) {
            keyVisualSettings.keyVisualUrl = originalConceptData.keyVisualUrl;
          }
          if (originalConceptData.keyVisualHeight !== undefined) {
            keyVisualSettings.keyVisualHeight = originalConceptData.keyVisualHeight;
          }
          if (originalConceptData.keyVisualScale !== undefined) {
            keyVisualSettings.keyVisualScale = originalConceptData.keyVisualScale;
          }
          if (originalConceptData.keyVisualLogoUrl !== undefined) {
            keyVisualSettings.keyVisualLogoUrl = originalConceptData.keyVisualLogoUrl;
          }
          if (originalConceptData.keyVisualMetadata !== undefined) {
            keyVisualSettings.keyVisualMetadata = originalConceptData.keyVisualMetadata;
          }
        }
      } catch (error) {
        console.warn('元の構想からキービジュアル設定を取得できませんでした:', error);
      }

      if (mode === 'new') {
        // 新規構想作成モード：新しい構想を作成（タイムスタンプ付き）
        const timestamp = Date.now();
        componentizedConceptId = `${conceptId}-componentized-${timestamp}`;
        
        // 新しい構想を作成
        const fixedConcepts: { [key: string]: { [key: string]: string } } = {
          'own-service': {
            'maternity-support': '出産支援パーソナルApp',
            'care-support': '介護支援パーソナルApp',
          },
          'ai-dx': {
            'medical-dx': '医療法人向けDX',
            'sme-dx': '中小企業向けDX',
          },
          'consulting': {
            'sme-process': '中小企業向け業務プロセス可視化・改善',
            'medical-care-process': '医療・介護施設向け業務プロセス可視化・改善',
          },
          'education-training': {
            'corporate-ai-training': '大企業向けAI人材育成・教育',
            'ai-governance': 'AI導入ルール設計・ガバナンス支援',
            'sme-ai-education': '中小企業向けAI導入支援・教育',
          },
        };
        const originalConceptName = fixedConcepts[serviceId]?.[conceptId] || conceptId;
        const conceptName = `${originalConceptName}（コンポーネント化版 ${new Date(timestamp).toLocaleDateString('ja-JP')}）`;
        
        // テンプレート構想（template-componentized）のページデータを取得
        // テンプレートは空のページ構造を持つ（移行するページだけが追加される）
        let templatePagesBySubMenu: any = {};
        let templatePageOrderBySubMenu: any = {};
        
        try {
          // まず、component-testサービスでテンプレートを探す
          const templateConceptQuery = query(
            collection(db, 'concepts'),
            where('userId', '==', auth.currentUser.uid),
            where('serviceId', '==', 'component-test'),
            where('conceptId', '==', 'template-componentized')
          );
          const templateConceptSnapshot = await getDocs(templateConceptQuery);
          
          if (!templateConceptSnapshot.empty) {
            const templateConceptData = templateConceptSnapshot.docs[0].data();
            // テンプレートからPage0（キービジュアル）を取得
            const templatePagesBySubMenuData = templateConceptData.pagesBySubMenu || {};
            const templatePageOrderBySubMenuData = templateConceptData.pageOrderBySubMenu || {};
            
            // 各サブメニューからPage0を抽出
            for (const [subMenu, pages] of Object.entries(templatePagesBySubMenuData)) {
              const subMenuPages = pages as any[];
              const subMenuPageOrder = templatePageOrderBySubMenuData[subMenu] || [];
              
              // Page0を探す（idが'page-0'またはpageIdが'0'または'page-0'のもの）
              const page0 = subMenuPages.find((p: any) => 
                p.id === 'page-0' || 
                p.pageId === '0' || 
                p.pageId === 'page-0' ||
                (subMenuPageOrder.length > 0 && subMenuPageOrder[0] === p.id && (p.title || '').includes('Page 0'))
              );
              
              if (page0) {
                // Page0が見つかった場合、そのサブメニューにPage0を追加
                if (!templatePagesBySubMenu[subMenu]) {
                  templatePagesBySubMenu[subMenu] = [];
                  templatePageOrderBySubMenu[subMenu] = [];
                }
                // Page0を最初に配置
                templatePagesBySubMenu[subMenu] = [page0];
                templatePageOrderBySubMenu[subMenu] = [page0.id];
                break; // 最初に見つかったPage0を使用
              }
            }
            
            // Page0が見つからなかった場合は空の構造
            if (Object.keys(templatePagesBySubMenu).length === 0) {
              templatePagesBySubMenu = {};
              templatePageOrderBySubMenu = {};
            }
          } else {
            // テンプレートが存在しない場合は作成
            const templateDocRef = await addDoc(collection(db, 'concepts'), {
              name: 'ページコンポーネントテンプレート',
              description: 'ページ移行の雛形として使用するテンプレート',
              conceptId: 'template-componentized',
              serviceId: 'component-test',
              userId: auth.currentUser.uid,
              pagesBySubMenu: {},
              pageOrderBySubMenu: {},
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            console.log('テンプレート構想を作成しました:', templateDocRef.id);
          }
        } catch (error) {
          console.warn('テンプレート構想の処理でエラーが発生しました:', error);
          // エラーが発生しても空の構造で続行
          templatePagesBySubMenu = {};
          templatePageOrderBySubMenu = {};
        }
        
        const newDocRef = await addDoc(collection(db, 'concepts'), {
          name: conceptName,
          description: '固定ページから移行されたコンポーネント化版',
          conceptId: componentizedConceptId,
          serviceId: serviceId,
          userId: auth.currentUser.uid,
          // キービジュアル設定を引き継ぐ
          ...keyVisualSettings,
          // テンプレートからページデータをコピー
          pagesBySubMenu: templatePagesBySubMenu,
          pageOrderBySubMenu: templatePageOrderBySubMenu,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        conceptDocId = newDocRef.id;
        // テンプレートからコピーしたページデータを使用
        conceptData = {
          pagesBySubMenu: templatePagesBySubMenu,
          pageOrderBySubMenu: templatePageOrderBySubMenu,
        };
      } else if (mode === 'append') {
        // 既存に追加モード：指定された構想に追加
        componentizedConceptId = targetConceptId || `${conceptId}-componentized`;
        
        // コンポーネント化された構想ドキュメントを検索
        const conceptsQuery = query(
          collection(db, 'concepts'),
          where('userId', '==', auth.currentUser.uid),
          where('serviceId', '==', serviceId),
          where('conceptId', '==', componentizedConceptId)
        );
        
        conceptsSnapshot = await getDocs(conceptsQuery);
        
        if (!conceptsSnapshot.empty) {
          // 既にコンポーネント化された構想が存在する場合
          const conceptDoc = conceptsSnapshot.docs[0];
          conceptDocId = conceptDoc.id;
          conceptData = conceptDoc.data();
        } else {
          // 既存の構想がない場合はエラー
          alert('既存のコンポーネント化された構想が見つかりませんでした。');
          setMigrating(false);
          return;
        }
      } else {
        // 上書きモード：既存の構想を使用または新規作成
        componentizedConceptId = `${conceptId}-componentized`;
        
        // コンポーネント化された構想ドキュメントを検索または作成
        const conceptsQuery = query(
          collection(db, 'concepts'),
          where('userId', '==', auth.currentUser.uid),
          where('serviceId', '==', serviceId),
          where('conceptId', '==', componentizedConceptId)
        );
        
        conceptsSnapshot = await getDocs(conceptsQuery);
        
        if (!conceptsSnapshot.empty) {
          // 既にコンポーネント化された構想が存在する場合
          const conceptDoc = conceptsSnapshot.docs[0];
          conceptDocId = conceptDoc.id;
          conceptData = conceptDoc.data();
        } else {
          // 新しいコンポーネント化された構想を作成
          const fixedConcepts: { [key: string]: { [key: string]: string } } = {
            'own-service': {
              'maternity-support': '出産支援パーソナルApp',
              'care-support': '介護支援パーソナルApp',
            },
            'ai-dx': {
              'medical-dx': '医療法人向けDX',
              'sme-dx': '中小企業向けDX',
            },
            'consulting': {
              'sme-process': '中小企業向け業務プロセス可視化・改善',
              'medical-care-process': '医療・介護施設向け業務プロセス可視化・改善',
            },
            'education-training': {
              'corporate-ai-training': '大企業向けAI人材育成・教育',
              'ai-governance': 'AI導入ルール設計・ガバナンス支援',
              'sme-ai-education': '中小企業向けAI導入支援・教育',
            },
          };
          const originalConceptName = fixedConcepts[serviceId]?.[conceptId] || conceptId;
          const conceptName = `${originalConceptName}（コンポーネント化版）`;
          
          const newDocRef = await addDoc(collection(db, 'concepts'), {
            name: conceptName,
            description: '固定ページから移行されたコンポーネント化版',
            conceptId: componentizedConceptId, // 新しいconceptIdを使用
            serviceId: serviceId,
            userId: auth.currentUser.uid,
            // キービジュアル設定を引き継ぐ
            ...keyVisualSettings,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          
          conceptDocId = newDocRef.id;
        }
      }

      // 既存のページデータを取得
      const pagesBySubMenu = conceptData.pagesBySubMenu || {};
      const pageOrderBySubMenu = conceptData.pageOrderBySubMenu || {};
      
      // 追加先のサブメニューIDを決定（指定されていない場合は現在のサブメニュー）
      const targetSubMenu = targetSubMenuId || subMenuId;
      
      console.log('🔍 デバッグ情報:', {
        mode,
        targetConceptId,
        targetSubMenuId,
        targetSubMenu,
        currentSubMenuId: subMenuId,
        pagesBySubMenuKeys: Object.keys(pagesBySubMenu),
        conceptData: conceptData,
      });
      
      const currentSubMenuPages = pagesBySubMenu[targetSubMenu] || [];
      const currentSubMenuPageOrder = pageOrderBySubMenu[targetSubMenu] || [];
      
      // selectedPagesは242行目で既に定義されているので、ここでは使用するだけ
      console.log('📄 既存ページ情報:', {
        targetSubMenu,
        currentSubMenuPagesCount: currentSubMenuPages.length,
        currentSubMenuPageOrderCount: currentSubMenuPageOrder.length,
        migratedPagesCount: selectedPages.length,
      });

      // 移行するページを準備（明確なIDを生成）
      const migrationTimestamp = Date.now();
      const migratedPages = selectedPages.map((page, index) => {
        // 明確なIDを生成（page-migrated-{timestamp}-{index}形式）
        const pageId = `page-migrated-${migrationTimestamp}-${index}`;
        return {
          id: pageId,
          pageNumber: mode === 'overwrite' ? index : currentSubMenuPages.length + index,
          title: page.title,
          content: page.content,
          createdAt: new Date().toISOString(),
          migrated: true, // 移行フラグ
          migratedAt: new Date().toISOString(),
        };
      });

      // モードに応じてページを処理
      let updatedPages: any[];
      let updatedPageOrder: string[];
      
      // Page0（キービジュアル）を最初に配置するための処理
      const page0Index = migratedPages.findIndex((p, idx) => {
        const originalPage = pages[idx];
        return originalPage && (originalPage.pageId === '0' || originalPage.pageId === 'page-0');
      });
      
      if (mode === 'new') {
        // 新規構想作成：テンプレートのPage0を最初に配置し、その後移行ページを追加
        // テンプレートのPage0が既にcurrentSubMenuPagesに含まれている場合はそれを最初に
        // 移行するPage0がある場合はそれも考慮
        const templatePage0 = currentSubMenuPages.find((p: any) => 
          p.id === 'page-0' || 
          p.pageId === '0' || 
          p.pageId === 'page-0'
        );
        
        if (templatePage0) {
          // テンプレートのPage0が存在する場合、それを最初に配置
          const otherTemplatePages = currentSubMenuPages.filter((p: any) => 
            p.id !== 'page-0' && 
            p.pageId !== '0' && 
            p.pageId !== 'page-0'
          );
          
          if (page0Index >= 0) {
            // 移行するPage0もある場合
            const migratedPage0 = migratedPages.splice(page0Index, 1)[0];
            // テンプレートのPage0を最初に、その後移行Page0、その後移行ページ
            updatedPages = [templatePage0, migratedPage0, ...otherTemplatePages, ...migratedPages];
            updatedPageOrder = [
              templatePage0.id, 
              migratedPage0.id, 
              ...currentSubMenuPageOrder.filter(id => id !== templatePage0.id),
              ...migratedPages.map(p => p.id)
            ];
          } else {
            // 移行するPage0がない場合
            updatedPages = [templatePage0, ...otherTemplatePages, ...migratedPages];
            updatedPageOrder = [
              templatePage0.id,
              ...currentSubMenuPageOrder.filter(id => id !== templatePage0.id),
              ...migratedPages.map(p => p.id)
            ];
          }
        } else {
          // テンプレートのPage0がない場合、移行するPage0を最初に配置
          if (page0Index >= 0) {
            const page0 = migratedPages.splice(page0Index, 1)[0];
            updatedPages = [...currentSubMenuPages, page0, ...migratedPages];
            updatedPageOrder = [...currentSubMenuPageOrder, page0.id, ...migratedPages.map(p => p.id)];
          } else {
            updatedPages = [...currentSubMenuPages, ...migratedPages];
            updatedPageOrder = [...currentSubMenuPageOrder, ...migratedPages.map(p => p.id)];
          }
        }
      } else if (mode === 'overwrite') {
        // 上書き：既存を削除して新しいページで置き換え
        // Page0を最初に配置
        if (page0Index >= 0) {
          const page0 = migratedPages.splice(page0Index, 1)[0];
          updatedPages = [page0, ...migratedPages];
          updatedPageOrder = [page0.id, ...migratedPages.map(p => p.id)];
        } else {
          updatedPages = migratedPages;
          updatedPageOrder = migratedPages.map(p => p.id);
        }
      } else {
        // 追加：既存のページに追加
        // Page0を最初に配置（既存ページの前に）
        if (page0Index >= 0) {
          const page0 = migratedPages.splice(page0Index, 1)[0];
          updatedPages = [page0, ...currentSubMenuPages, ...migratedPages];
          updatedPageOrder = [page0.id, ...currentSubMenuPageOrder, ...migratedPages.map(p => p.id)];
        } else {
          updatedPages = [...currentSubMenuPages, ...migratedPages];
          updatedPageOrder = [...currentSubMenuPageOrder, ...migratedPages.map(p => p.id)];
        }
      }

      // 更新データを準備
      const updatedPagesBySubMenu = {
        ...pagesBySubMenu,
        [targetSubMenu]: updatedPages,
      };

      const updatedPageOrderBySubMenu = {
        ...pageOrderBySubMenu,
        [targetSubMenu]: updatedPageOrder,
      };

      console.log('📊 更新前後の比較:', {
        targetSubMenu,
        before: {
          pagesCount: currentSubMenuPages.length,
          pageOrderCount: currentSubMenuPageOrder.length,
        },
        after: {
          pagesCount: updatedPages.length,
          pageOrderCount: updatedPageOrder.length,
        },
        updatedPagesBySubMenuKeys: Object.keys(updatedPagesBySubMenu),
        updatedPageOrderBySubMenuKeys: Object.keys(updatedPageOrderBySubMenu),
      });

      const updateData: any = {
        pagesBySubMenu: updatedPagesBySubMenu,
        pageOrderBySubMenu: updatedPageOrderBySubMenu,
        updatedAt: serverTimestamp(),
      };

      // 上書きモードで既存の構想が存在する場合、キービジュアル設定が引き継がれていない場合は追加
      if (mode === 'overwrite' && conceptsSnapshot && !conceptsSnapshot.empty && Object.keys(keyVisualSettings).length > 0) {
        // 既存の構想にキービジュアル設定がない場合のみ追加
        const existingKeyVisual = conceptData.keyVisualUrl;
        if (!existingKeyVisual) {
          Object.assign(updateData, keyVisualSettings);
        }
      }

      // overviewの場合は後方互換性のために古い形式も更新
      if (targetSubMenu === 'overview') {
        const oldPages = conceptData.pages || [];
        const oldPageOrder = conceptData.pageOrder as string[] | undefined;
        
        if (mode === 'overwrite' || mode === 'new') {
          updateData.pages = migratedPages;
          updateData.pageOrder = migratedPages.map(p => p.id);
        } else {
          updateData.pages = [...oldPages, ...migratedPages];
          if (oldPageOrder) {
            updateData.pageOrder = [...oldPageOrder, ...migratedPages.map(p => p.id)];
          } else {
            updateData.pageOrder = migratedPages.map(p => p.id);
          }
        }
      }

      // Firestoreに保存
      console.log('💾 保存データ:', {
        conceptDocId,
        targetSubMenu,
        updatedPagesCount: updatedPages.length,
        updatedPageOrderCount: updatedPageOrder.length,
        updateData: {
          ...updateData,
          pagesBySubMenu: {
            ...updateData.pagesBySubMenu,
            [targetSubMenu]: `[${updatedPages.length}件のページ]`,
          },
        },
      });
      
      // appendモードの場合は、updateDocを使用して既存のデータを保持
      if (mode === 'append') {
        // ドット記法でネストされたフィールドを更新
        const updateFields: any = {
          updatedAt: serverTimestamp(),
        };
        updateFields[`pagesBySubMenu.${targetSubMenu}`] = updatedPages;
        updateFields[`pageOrderBySubMenu.${targetSubMenu}`] = updatedPageOrder;
        
        await updateDoc(
          doc(db, 'concepts', conceptDocId),
          updateFields
        );
      } else {
        // overwrite/newモードの場合は、setDocで全体を更新
        await setDoc(
          doc(db, 'concepts', conceptDocId),
          updateData,
          { merge: true }
        );
      }
      
      console.log('✅ 保存完了', {
        mode,
        targetSubMenu,
        savedPagesCount: updatedPages.length,
        savedPageOrderCount: updatedPageOrder.length,
      });

      let progressMessage = '';
      if (mode === 'overwrite') {
        progressMessage = `✅ ${selectedPages.length}件のページを上書きしました！`;
      } else if (mode === 'append') {
        progressMessage = `✅ ${selectedPages.length}件のページを既存の構想に追加しました！`;
      } else {
        progressMessage = `✅ ${selectedPages.length}件のページを新しい構想として作成しました！`;
      }
      setProgress(progressMessage);
      
      setTimeout(() => {
        // 移行後のコールバックに新しいconceptIdを渡す
        // appendモードの場合は、追加先のサブメニューにリダイレクト
        if (mode === 'append' && targetSubMenuId) {
          // サブメニューIDも含めてリダイレクトするために、URLを構築
          const targetUrl = `/business-plan/services/${serviceId}/${componentizedConceptId}/${targetSubMenuId}`;
          window.location.href = targetUrl;
        } else {
          onMigrated(componentizedConceptId);
        }
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('移行エラー:', error);
      alert(`移行に失敗しました: ${error.message || '不明なエラー'}`);
    } finally {
      setMigrating(false);
    }
  };

  /**
   * 移行開始（既存構想チェック付き）
   */
  const handleStartMigration = async () => {
    if (!auth?.currentUser || !db) {
      alert('ログインが必要です');
      return;
    }

    // DOMからページを抽出
    const pages = extractPagesFromDOM();
    
    if (pages.length === 0) {
      alert('移行するページが見つかりませんでした。data-page-container属性を持つ要素を確認してください。');
      return;
    }

    setExtractedPages(pages);
    // デフォルトですべて選択
    setSelectedPageIds(new Set(pages.map(p => p.id)));

    // 既存のコンポーネント化された構想をチェック
    const existing = await checkExistingConcept();
    
    if (existing) {
      setExistingConcept(existing);
      setShowConfirmDialog(true);
    } else {
      // 既存の構想がない場合は直接移行
      handleMigrate('overwrite');
    }
  };

  return (
    <div style={{
      padding: '32px',
      backgroundColor: '#fff',
      borderRadius: '16px',
      maxWidth: '700px',
      margin: '0 auto',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: '#EFF6FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}>
          🔄
        </div>
        <h3 style={{
          fontSize: '24px',
          fontWeight: 700,
          margin: 0,
          color: '#111827',
        }}>
          固定ページからページコンポーネントへ移行
        </h3>
      </div>

      <div style={{
        marginBottom: '24px',
        padding: '20px',
        backgroundColor: '#F0F9FF',
        borderRadius: '12px',
        border: '1px solid #BFDBFE',
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#1E40AF',
          marginBottom: '12px',
        }}>
          ワークフロー
        </div>
        <div style={{
          fontSize: '14px',
          color: '#1E40AF',
          lineHeight: '1.8',
        }}>
          <div style={{ marginBottom: '8px' }}>1. 固定ページでVibeコーディングでDraftを作成</div>
          <div style={{ marginBottom: '8px' }}>2. この機能で一括移行</div>
          <div>3. ページコンポーネントで清書・編集</div>
        </div>
      </div>

      {extractedPages.length > 0 && (
        <div style={{
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#F9FAFB',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '12px',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📄</span>
              <span>抽出されたページ ({extractedPages.length}件)</span>
              <span style={{ fontSize: '12px', fontWeight: 400, color: '#6B7280' }}>
                ({selectedPageIds.size}件選択中)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  if (selectedPageIds.size === extractedPages.length) {
                    // すべて解除
                    setSelectedPageIds(new Set());
                  } else {
                    // すべて選択
                    setSelectedPageIds(new Set(extractedPages.map(p => p.id)));
                  }
                }}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
              >
                {selectedPageIds.size === extractedPages.length ? 'すべて解除' : 'すべて選択'}
              </button>
            </div>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}>
            {extractedPages.map((page, index) => {
              const isSelected = selectedPageIds.has(page.id);
              return (
                <label
                  key={page.id}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: isSelected ? '#F0F9FF' : '#fff',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                    fontSize: '14px',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                      e.currentTarget.style.borderColor = '#D1D5DB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#fff';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newSelected = new Set(selectedPageIds);
                      if (e.target.checked) {
                        newSelected.add(page.id);
                      } else {
                        newSelected.delete(page.id);
                      }
                      setSelectedPageIds(newSelected);
                    }}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: isSelected ? '#3B82F6' : '#EFF6FF',
                    color: isSelected ? '#fff' : '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ flex: 1 }}>{page.title}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 確認ダイアログ */}
      {showConfirmDialog && existingConcept && (
        <div style={{
          marginBottom: '24px',
          padding: '24px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
            }}>
              ⚠️
            </div>
            <h4 style={{
              fontSize: '18px',
              fontWeight: 700,
              margin: 0,
              color: '#111827',
            }}>
              既存のコンポーネント化された構想が見つかりました
            </h4>
          </div>
          
          <div style={{
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '12px 16px',
              fontSize: '14px',
              color: '#374151',
            }}>
              <div style={{ fontWeight: 600, color: '#6B7280' }}>構想名:</div>
              <div style={{ fontWeight: 500 }}>{existingConcept.name}</div>
              
              <div style={{ fontWeight: 600, color: '#6B7280' }}>既存のページ数:</div>
              <div style={{ fontWeight: 500 }}>{existingConcept.pageCount}件</div>
              
              <div style={{ fontWeight: 600, color: '#6B7280' }}>移行するページ数:</div>
              <div style={{ fontWeight: 500, color: '#3B82F6' }}>{extractedPages.length}件</div>
            </div>
          </div>
          
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '20px',
            lineHeight: '1.6',
          }}>
            どのように処理しますか？
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            <button
              onClick={() => {
                setMigrationMode('overwrite');
                setShowConfirmDialog(false);
                handleMigrate('overwrite');
              }}
              disabled={migrating}
              style={{
                padding: '12px 20px',
                backgroundColor: migrating ? '#FCA5A5' : '#EF4444',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: migrating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: migrating ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
              onMouseEnter={(e) => {
                if (!migrating) {
                  e.currentTarget.style.backgroundColor = '#DC2626';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!migrating) {
                  e.currentTarget.style.backgroundColor = '#EF4444';
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                }
              }}
            >
              上書き
            </button>
            <button
              onClick={async () => {
                // すべての既存構想を取得
                const allConcepts = await getAllExistingConcepts();
                
                if (allConcepts.length === 0) {
                  alert('既存のコンポーネント化された構想が見つかりませんでした。');
                  return;
                } else if (allConcepts.length === 1) {
                  // 1つだけの場合はサブメニュー選択へ
                  setExistingConcept(allConcepts[0]);
                  setSelectedConceptId(allConcepts[0].conceptId);
                  setShowConfirmDialog(false);
                  setShowSubMenuSelector(true);
                } else {
                  // 複数ある場合は選択UIを表示
                  setExistingConcepts(allConcepts);
                  setShowConceptSelector(true);
                  setShowConfirmDialog(false);
                }
              }}
              disabled={migrating}
              style={{
                padding: '12px 20px',
                backgroundColor: migrating ? '#86EFAC' : '#10B981',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: migrating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: migrating ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
              onMouseEnter={(e) => {
                if (!migrating) {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!migrating) {
                  e.currentTarget.style.backgroundColor = '#10B981';
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                }
              }}
            >
              既存に追加
            </button>
            <button
              onClick={() => {
                setMigrationMode('new');
                setShowConfirmDialog(false);
                handleMigrate('new');
              }}
              disabled={migrating}
              style={{
                padding: '12px 20px',
                backgroundColor: migrating ? '#93C5FD' : '#3B82F6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: migrating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: migrating ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
              onMouseEnter={(e) => {
                if (!migrating) {
                  e.currentTarget.style.backgroundColor = '#2563EB';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!migrating) {
                  e.currentTarget.style.backgroundColor = '#3B82F6';
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                }
              }}
            >
              新規構想作成
            </button>
            <button
              onClick={() => {
                setShowConfirmDialog(false);
                setExistingConcept(null);
              }}
              disabled={migrating}
              style={{
                padding: '12px 20px',
                backgroundColor: '#fff',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                cursor: migrating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s',
                opacity: migrating ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!migrating) {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#9CA3AF';
                }
              }}
              onMouseLeave={(e) => {
                if (!migrating) {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 構想選択ダイアログ */}
      {showConceptSelector && existingConcepts.length > 0 && (
        <div style={{
          marginBottom: '24px',
          padding: '24px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
            }}>
              📋
            </div>
            <div>
              <h4 style={{
                fontSize: '18px',
                fontWeight: 700,
                margin: 0,
                marginBottom: '4px',
                color: '#111827',
              }}>
                追加先の構想を選択してください
              </h4>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                margin: 0,
              }}>
                移行するページ数: <strong style={{ color: '#3B82F6' }}>{extractedPages.length}件</strong>
              </p>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '20px',
            maxHeight: '320px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}>
            {existingConcepts.map((concept) => (
              <label
                key={concept.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: selectedConceptId === concept.conceptId ? '#EFF6FF' : '#F9FAFB',
                  border: `2px solid ${selectedConceptId === concept.conceptId ? '#3B82F6' : '#E5E7EB'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (selectedConceptId !== concept.conceptId) {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConceptId !== concept.conceptId) {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${selectedConceptId === concept.conceptId ? '#3B82F6' : '#9CA3AF'}`,
                  backgroundColor: selectedConceptId === concept.conceptId ? '#3B82F6' : 'transparent',
                  marginRight: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  position: 'relative',
                }}>
                  {selectedConceptId === concept.conceptId && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                    }} />
                  )}
                </div>
                <input
                  type="radio"
                  name="concept-select"
                  value={concept.conceptId}
                  checked={selectedConceptId === concept.conceptId}
                  onChange={() => setSelectedConceptId(concept.conceptId)}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '6px',
                  }}>
                    {concept.name}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span>既存のページ数:</span>
                    <span style={{
                      fontWeight: 600,
                      color: '#374151',
                    }}>{concept.pageCount}件</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            paddingTop: '16px',
            borderTop: '1px solid #E5E7EB',
          }}>
            <button
              onClick={() => {
                setShowConceptSelector(false);
                setSelectedConceptId(null);
                setShowConfirmDialog(true);
              }}
              disabled={migrating}
              style={{
                padding: '12px 24px',
                backgroundColor: '#fff',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                cursor: migrating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s',
                opacity: migrating ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!migrating) {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#9CA3AF';
                }
              }}
              onMouseLeave={(e) => {
                if (!migrating) {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }
              }}
            >
              戻る
            </button>
            <button
              onClick={() => {
                if (!selectedConceptId) {
                  alert('追加先の構想を選択してください。');
                  return;
                }
                const selectedConcept = existingConcepts.find(c => c.conceptId === selectedConceptId);
                if (selectedConcept) {
                  setShowConceptSelector(false);
                  setShowSubMenuSelector(true);
                }
              }}
              disabled={migrating || !selectedConceptId}
              style={{
                padding: '12px 24px',
                backgroundColor: selectedConceptId && !migrating ? '#10B981' : '#9CA3AF',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: (migrating || !selectedConceptId) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: (selectedConceptId && !migrating) ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!migrating && selectedConceptId) {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!migrating && selectedConceptId) {
                  e.currentTarget.style.backgroundColor = '#10B981';
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                }
              }}
            >
              追加を実行
            </button>
          </div>
        </div>
      )}

      {/* サブメニュー選択ダイアログ */}
      {showSubMenuSelector && (
        <div style={{
          marginBottom: '24px',
          padding: '24px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              📁
            </div>
            <h4 style={{
              fontSize: '18px',
              fontWeight: 700,
              margin: 0,
              color: '#111827',
            }}>
              追加先のサブメニューを選択
            </h4>
          </div>
          
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '20px',
            lineHeight: '1.6',
          }}>
            どのサブメニューにページを追加しますか？
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
            maxHeight: '300px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}>
            {SUB_MENU_ITEMS.map((item) => (
              <label
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: selectedSubMenuId === item.id ? '#EFF6FF' : '#F9FAFB',
                  border: selectedSubMenuId === item.id ? '2px solid #3B82F6' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedSubMenuId !== item.id) {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSubMenuId !== item.id) {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }
                }}
              >
                <input
                  type="radio"
                  name="selectedSubMenu"
                  value={item.id}
                  checked={selectedSubMenuId === item.id}
                  onChange={() => setSelectedSubMenuId(item.id)}
                  style={{
                    marginRight: '12px',
                    cursor: 'pointer',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: selectedSubMenuId === item.id ? 600 : 500,
                    color: selectedSubMenuId === item.id ? '#1E40AF' : '#374151',
                  }}>
                    {item.label}
                  </div>
                </div>
              </label>
            ))}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={() => {
                setShowSubMenuSelector(false);
                if (existingConcepts.length > 1) {
                  setShowConceptSelector(true);
                } else {
                  setShowConfirmDialog(true);
                }
              }}
              disabled={migrating}
              style={{
                padding: '12px 20px',
                backgroundColor: '#fff',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                cursor: migrating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s',
                opacity: migrating ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!migrating) {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#9CA3AF';
                }
              }}
              onMouseLeave={(e) => {
                if (!migrating) {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }
              }}
            >
              戻る
            </button>
            <button
              onClick={() => {
                if (!selectedConceptId) {
                  alert('追加先の構想を選択してください。');
                  return;
                }
                setMigrationMode('append');
                setShowSubMenuSelector(false);
                handleMigrate('append', selectedConceptId, selectedSubMenuId);
              }}
              disabled={migrating || !selectedSubMenuId}
              style={{
                padding: '12px 24px',
                backgroundColor: selectedSubMenuId && !migrating ? '#10B981' : '#9CA3AF',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: (migrating || !selectedSubMenuId) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: (selectedSubMenuId && !migrating) ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!migrating && selectedSubMenuId) {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!migrating && selectedSubMenuId) {
                  e.currentTarget.style.backgroundColor = '#10B981';
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                }
              }}
            >
              追加を実行
            </button>
          </div>
        </div>
      )}

      {progress && (
        <div style={{
          marginBottom: '24px',
          padding: '16px 20px',
          backgroundColor: progress.includes('✅') ? '#F0FDF4' : '#EFF6FF',
          borderRadius: '12px',
          border: `1px solid ${progress.includes('✅') ? '#86EFAC' : '#BFDBFE'}`,
          color: progress.includes('✅') ? '#166534' : '#1E40AF',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '18px' }}>{progress.includes('✅') ? '✅' : '⏳'}</span>
          <span>{progress}</span>
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        paddingTop: '24px',
        borderTop: '1px solid #E5E7EB',
      }}>
        <button
          onClick={onClose}
          disabled={migrating || showConfirmDialog || showConceptSelector}
          style={{
            padding: '12px 24px',
            backgroundColor: '#fff',
            color: '#374151',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            cursor: (migrating || showConfirmDialog || showConceptSelector) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s',
            opacity: (migrating || showConfirmDialog || showConceptSelector) ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!migrating && !showConfirmDialog && !showConceptSelector) {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
              e.currentTarget.style.borderColor = '#9CA3AF';
            }
          }}
          onMouseLeave={(e) => {
            if (!migrating && !showConfirmDialog && !showConceptSelector) {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.borderColor = '#D1D5DB';
            }
          }}
        >
          キャンセル
        </button>
        {!showConfirmDialog && !showConceptSelector && (
          <button
            onClick={handleStartMigration}
            disabled={migrating}
            style={{
              padding: '12px 24px',
              backgroundColor: migrating ? '#9CA3AF' : '#6366F1',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: migrating ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s',
              boxShadow: migrating ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={(e) => {
              if (!migrating) {
                e.currentTarget.style.backgroundColor = '#4F46E5';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!migrating) {
                e.currentTarget.style.backgroundColor = '#6366F1';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }
            }}
          >
            {migrating ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⏳</span>
                <span>移行中...</span>
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🚀</span>
                <span>移行を開始</span>
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

