'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '@/lib/firebase';
import { SUB_MENU_ITEMS } from '@/components/ConceptSubMenu';

interface MigrateFromFixedPageProps {
  serviceId?: string;
  conceptId?: string;
  planId?: string; // 会社本体の事業計画用
  subMenuId: string;
  onMigrated: (newId?: string, targetSubMenuId?: string) => void; // newConceptIdまたはnewPlanId, 追加先のサブメニューID
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
  planId,
  subMenuId,
  onMigrated,
  onClose,
}: MigrateFromFixedPageProps) {
  // 会社本体の事業計画かどうかを判定
  const isCompanyPlan = !!planId && !serviceId && !conceptId;
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
  const [totalExistingPlansCount, setTotalExistingPlansCount] = useState<number>(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showConceptSelector, setShowConceptSelector] = useState(false);
  const [showSubMenuSelector, setShowSubMenuSelector] = useState(false);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [selectedSubMenuId, setSelectedSubMenuId] = useState<string>(subMenuId); // デフォルトは現在のサブメニュー
  const [migrationMode, setMigrationMode] = useState<'overwrite' | 'append' | 'new' | null>(null);
  const [useBulkMigration, setUseBulkMigration] = useState(false); // 全ページ一括移行モード
  const [pagesBySubMenu, setPagesBySubMenu] = useState<{ [key: string]: Array<{ id: string; title: string; content: string; pageNumber: number; pageId: string }> }>({});
  const [bulkMigrationPageCount, setBulkMigrationPageCount] = useState<{ total: number; bySubMenu: { [key: string]: number } }>({ total: 0, bySubMenu: {} });

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
   * 指定されたサブメニューのページを抽出
   * @param subMenuId サブメニューID（省略時は現在のページ）
   * @param htmlContent HTMLコンテンツ（省略時は現在のDOMから取得）
   */
  const extractPagesFromHTML = (htmlContent?: string, subMenuId?: string) => {
    const pages: Array<{
      id: string;
      title: string;
      content: string;
      pageNumber: number;
      pageId: string;
      subMenuId?: string; // サブメニューIDを追加
    }> = [];

    // HTMLコンテンツが提供されている場合はそれを使用、なければ現在のDOMから取得
    const container = htmlContent 
      ? (() => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, 'text/html');
          return doc;
        })()
      : document;

    // data-page-container属性を持つ要素を取得
    const containers = container.querySelectorAll('[data-page-container]');
    
    containers.forEach((containerEl, index) => {
      const pageId = (containerEl as HTMLElement).getAttribute('data-page-container') || `page-${index}`;
      
      // タイトルを抽出
      let title = '';
      const titleElement = (containerEl as HTMLElement).querySelector('h2, h3, h1, .page-title');
      if (titleElement) {
        title = titleElement.textContent?.trim() || '';
      } else {
        const firstText = (containerEl as HTMLElement).textContent?.trim().split('\n')[0] || '';
        title = firstText.substring(0, 50) || `ページ ${index + 1}`;
      }
      
      // コンテンツを抽出
      const rawHTML = (containerEl as HTMLElement).innerHTML;
      const content = formatHTML(rawHTML);
      
      pages.push({
        id: `migrated-${pageId}-${Date.now()}-${index}`,
        title: title || `ページ ${index + 1}`,
        content: content,
        pageNumber: index,
        pageId: pageId,
        subMenuId: subMenuId,
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
   * すべてのサブメニューのページを一括で取得
   */
  const extractAllPagesFromAllSubMenus = async () => {
    if (!planId) {
      console.error('extractAllPagesFromAllSubMenus: planIdが設定されていません');
      return {};
    }
    
    const allPagesBySubMenu: { [key: string]: Array<{ id: string; title: string; content: string; pageNumber: number; pageId: string }> } = {};
    
    setProgress('すべてのサブメニューからページを取得中...');
    
    console.log('extractAllPagesFromAllSubMenus: 開始, planId:', planId);
    
    // 各サブメニューのページを取得（iframeを使用してDOMから直接読み取る）
    for (const subMenuItem of SUB_MENU_ITEMS) {
      try {
        const url = `/business-plan/company/${planId}/${subMenuItem.path}`;
        console.log(`extractAllPagesFromAllSubMenus: ${subMenuItem.label} (${subMenuItem.id}) から取得中: ${url}`);
        
        // iframeを作成してページを読み込む
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        document.body.appendChild(iframe);
        
        // iframeが読み込まれるまで待つ
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`タイムアウト: ${subMenuItem.label}`));
          }, 10000); // 10秒でタイムアウト
          
          iframe.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          
          iframe.onerror = () => {
            clearTimeout(timeout);
            reject(new Error(`読み込みエラー: ${subMenuItem.label}`));
          };
          
          iframe.src = url;
        });
        
        // iframe内のDOMからコンテナを取得
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          console.warn(`サブメニュー「${subMenuItem.label}」のiframeドキュメントにアクセスできません`);
          document.body.removeChild(iframe);
          continue;
        }
        
        // ページが完全にレンダリングされるまで少し待つ
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const containers = iframeDoc.querySelectorAll('[data-page-container]');
        
        console.log(`extractAllPagesFromAllSubMenus: ${subMenuItem.label} で ${containers.length} 個のコンテナを発見`);
        
        if (containers.length > 0) {
          const pages: Array<{ id: string; title: string; content: string; pageNumber: number; pageId: string }> = [];
          
          // 非同期処理のため、Promise.allを使用
          const pagePromises = Array.from(containers).map(async (containerEl, index) => {
            const pageId = (containerEl as HTMLElement).getAttribute('data-page-container') || `page-${index}`;
            
            // タイトルを抽出
            let title = '';
            const titleElement = (containerEl as HTMLElement).querySelector('h2, h3, h1, .page-title');
            if (titleElement) {
              title = titleElement.textContent?.trim() || '';
            } else {
              const firstText = (containerEl as HTMLElement).textContent?.trim().split('\n')[0] || '';
              title = firstText.substring(0, 50) || `${subMenuItem.label} - ページ ${index + 1}`;
            }
            
            // 図形を画像化（canvas、Mermaid図など）
            let rawHTML = (containerEl as HTMLElement).innerHTML;
            try {
              rawHTML = await convertDiagramsToImages(containerEl as HTMLElement, `${subMenuItem.id}-${pageId}`);
            } catch (error) {
              console.error(`ページ ${subMenuItem.label}-${pageId} の図形画像化エラー:`, error);
              // エラーが発生しても元のHTMLを使用して続行
            }
            
            // コンテンツを抽出
            const content = formatHTML(rawHTML);
            
            return {
              id: `migrated-${subMenuItem.id}-${pageId}-${Date.now()}-${index}`,
              title: title || `${subMenuItem.label} - ページ ${index + 1}`,
              content: content,
              pageNumber: index,
              pageId: pageId,
            };
          });
          
          const resolvedPages = await Promise.all(pagePromises);
          pages.push(...resolvedPages);
          
          // Page0（キービジュアル）を最初に配置
          const page0Index = pages.findIndex(p => p.pageId === '0' || p.pageId === 'page-0');
          if (page0Index > 0) {
            const page0 = pages.splice(page0Index, 1)[0];
            pages.unshift(page0);
          }
          
          if (pages.length > 0) {
            allPagesBySubMenu[subMenuItem.id] = pages;
            console.log(`extractAllPagesFromAllSubMenus: ${subMenuItem.label} に ${pages.length} ページを追加`);
          }
        }
        
        // iframeを削除
        document.body.removeChild(iframe);
      } catch (error) {
        console.error(`サブメニュー「${subMenuItem.label}」のページ取得に失敗:`, error);
      }
    }
    
    const totalPages = Object.values(allPagesBySubMenu).reduce((sum, pages) => sum + pages.length, 0);
    console.log('extractAllPagesFromAllSubMenus: 完了', {
      totalPages,
      subMenuCount: Object.keys(allPagesBySubMenu).length,
      subMenus: Object.keys(allPagesBySubMenu),
    });
    
    return allPagesBySubMenu;
  };

  /**
   * 図形要素（canvas、Mermaid図など）を画像化してFirebase Storageに保存
   * @param containerEl コンテナ要素
   * @param pageId ページID（ファイル名に使用）
   * @returns 更新されたHTMLコンテンツ
   */
  const convertDiagramsToImages = async (containerEl: HTMLElement, pageId: string): Promise<string> => {
    if (!auth?.currentUser || !storage) {
      console.warn('Firebase Storageが利用できません。図形の画像化をスキップします。');
      return containerEl.innerHTML;
    }

    let updatedHTML = containerEl.innerHTML;
    
    // 1. canvas要素（p5.jsなど）を検出して画像化
    // 実際のDOM要素から検出（tempDivではなく、containerElから直接検出）
    const canvases = containerEl.querySelectorAll('canvas');
    const canvasReplacements: Array<{ original: string; replacement: string }> = [];
    
    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i] as HTMLCanvasElement;
      try {
        // canvasを画像データに変換
        const imageData = canvas.toDataURL('image/png', 1.0);
        
        // Base64データをBlobに変換
        const response = await fetch(imageData);
        const blob = await response.blob();
        
        // Firebase Storageにアップロード
        const fileName = `diagram-${pageId}-canvas-${i}-${Date.now()}.png`;
        let storagePath: string;
        if (planId) {
          storagePath = `companyBusinessPlan/${planId}/${fileName}`;
        } else if (serviceId && conceptId) {
          storagePath = `concepts/${serviceId}/${conceptId}/${fileName}`;
        } else {
          console.warn('ストレージパスを決定できません。スキップします。');
          continue;
        }
        
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        
        console.log(`Canvas画像をアップロード: ${downloadURL}`);
        
        // canvas要素をimgタグに置き換え（後で一括置換するため、配列に保存）
        const imgTag = `<img src="${downloadURL}" alt="図形" style="max-width: 100%; height: auto; display: block; margin: 16px auto;" />`;
        canvasReplacements.push({
          original: canvas.outerHTML,
          replacement: imgTag,
        });
      } catch (error) {
        console.error('Canvas画像化エラー:', error);
        // エラーが発生しても処理を続行
      }
    }
    
    // canvas要素を一括置換
    for (const replacement of canvasReplacements) {
      updatedHTML = updatedHTML.replace(replacement.original, replacement.replacement);
    }

    // 2. Mermaid図を検出して画像化
    // 実際のDOM要素から検出（containerElから直接検出）
    const mermaidContainers = containerEl.querySelectorAll('.mermaid-diagram-container');
    const mermaidElements = containerEl.querySelectorAll('.mermaid, [data-mermaid-diagram]');
    const mermaidReplacements: Array<{ original: string; replacement: string }> = [];
    
    if (mermaidContainers.length > 0 || mermaidElements.length > 0) {
      // html2canvasを動的にインポート
      try {
        const html2canvas = (await import('html2canvas')).default;
        
        // 親要素がある場合は親要素を画像化（推奨）
        for (let i = 0; i < mermaidContainers.length; i++) {
          const containerEl = mermaidContainers[i] as HTMLElement;
          try {
            // Mermaid図が完全にレンダリングされるまで少し待つ
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mermaid図のコンテナ全体を画像化
            const canvas = await html2canvas(containerEl, {
              scale: 2,
              backgroundColor: '#ffffff',
              useCORS: true,
              logging: false,
              allowTaint: true,
            });
            
            const imageData = canvas.toDataURL('image/png', 1.0);
            
            // Base64データをBlobに変換
            const response = await fetch(imageData);
            const blob = await response.blob();
            
            // Firebase Storageにアップロード
            const fileName = `diagram-${pageId}-mermaid-${i}-${Date.now()}.png`;
            let storagePath: string;
            if (planId) {
              storagePath = `companyBusinessPlan/${planId}/${fileName}`;
            } else if (serviceId && conceptId) {
              storagePath = `concepts/${serviceId}/${conceptId}/${fileName}`;
            } else {
              console.warn('ストレージパスを決定できません。スキップします。');
              continue;
            }
            
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            
            console.log(`Mermaid図を画像化: ${downloadURL}`);
            
            // Mermaidコンテナ要素をimgタグに置き換え（後で一括置換するため、配列に保存）
            const imgTag = `<img src="${downloadURL}" alt="Mermaid図" style="max-width: 100%; height: auto; display: block; margin: 16px auto;" />`;
            mermaidReplacements.push({
              original: containerEl.outerHTML,
              replacement: imgTag,
            });
          } catch (error) {
            console.error('Mermaid図画像化エラー:', error);
            // エラーが発生しても処理を続行
          }
        }
        
        // 親要素がない場合、直接Mermaid要素を画像化
        for (let i = 0; i < mermaidElements.length; i++) {
          const mermaidEl = mermaidElements[i] as HTMLElement;
          // 親要素が既に処理されている場合はスキップ
          if (mermaidEl.closest('.mermaid-diagram-container')) {
            continue;
          }
          
          try {
            // Mermaid図が完全にレンダリングされるまで少し待つ
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mermaid図を画像化
            const canvas = await html2canvas(mermaidEl, {
              scale: 2,
              backgroundColor: '#ffffff',
              useCORS: true,
              logging: false,
              allowTaint: true,
            });
            
            const imageData = canvas.toDataURL('image/png', 1.0);
            
            // Base64データをBlobに変換
            const response = await fetch(imageData);
            const blob = await response.blob();
            
            // Firebase Storageにアップロード
            const fileName = `diagram-${pageId}-mermaid-${i}-${Date.now()}.png`;
            let storagePath: string;
            if (planId) {
              storagePath = `companyBusinessPlan/${planId}/${fileName}`;
            } else if (serviceId && conceptId) {
              storagePath = `concepts/${serviceId}/${conceptId}/${fileName}`;
            } else {
              console.warn('ストレージパスを決定できません。スキップします。');
              continue;
            }
            
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            
            console.log(`Mermaid図を画像化: ${downloadURL}`);
            
            // Mermaid要素をimgタグに置き換え（後で一括置換するため、配列に保存）
            const imgTag = `<img src="${downloadURL}" alt="Mermaid図" style="max-width: 100%; height: auto; display: block; margin: 16px auto;" />`;
            mermaidReplacements.push({
              original: mermaidEl.outerHTML,
              replacement: imgTag,
            });
          } catch (error) {
            console.error('Mermaid図画像化エラー:', error);
            // エラーが発生しても処理を続行
          }
        }
        
        // Mermaid要素を一括置換
        for (const replacement of mermaidReplacements) {
          updatedHTML = updatedHTML.replace(replacement.original, replacement.replacement);
        }
      } catch (error) {
        console.error('html2canvasのインポートエラー:', error);
        // html2canvasが利用できない場合はスキップ
      }
    }

    // 3. SVG要素を検出して画像化（大きなSVG要素のみ対象）
    const svgElements = Array.from(containerEl.querySelectorAll('svg')).filter((svg) => {
      const svgEl = svg as SVGSVGElement;
      const width = svgEl.getAttribute('width');
      const height = svgEl.getAttribute('height');
      const viewBox = svgEl.getAttribute('viewBox');
      
      // widthまたはheightが100px以上のSVG、またはviewBoxの幅が200以上のSVGを対象とする
      if (width && width !== '100%') {
        const widthNum = parseFloat(width);
        if (!isNaN(widthNum) && widthNum >= 100) return true;
      }
      if (height && height !== '100%') {
        const heightNum = parseFloat(height);
        if (!isNaN(heightNum) && heightNum >= 100) return true;
      }
      if (viewBox) {
        const viewBoxValues = viewBox.split(' ');
        if (viewBoxValues.length >= 3) {
          const viewBoxWidth = parseFloat(viewBoxValues[2]);
          if (!isNaN(viewBoxWidth) && viewBoxWidth >= 200) return true;
        }
      }
      
      // デフォルトで、サイズが大きいと判断されるSVGも対象（width="100%"など）
      const computedStyle = window.getComputedStyle(svgEl);
      const computedWidth = parseFloat(computedStyle.width);
      const computedHeight = parseFloat(computedStyle.height);
      if (!isNaN(computedWidth) && computedWidth >= 200) return true;
      if (!isNaN(computedHeight) && computedHeight >= 200) return true;
      
      return false;
    });
    
    const svgReplacements: Array<{ original: string; replacement: string }> = [];
    
    if (svgElements.length > 0) {
      console.log(`SVG要素を${svgElements.length}個検出しました。画像化を開始します。`);
      // html2canvasを動的にインポート
      try {
        const html2canvas = (await import('html2canvas')).default;
        
        for (let i = 0; i < svgElements.length; i++) {
          const svgEl = svgElements[i] as SVGSVGElement;
          try {
            console.log(`SVG要素 ${i + 1}/${svgElements.length} を画像化中...`);
            
            // SVG要素が完全にレンダリングされるまで少し待つ
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // SVG要素を画像化
            const canvas = await html2canvas(svgEl as unknown as HTMLElement, {
              scale: 2,
              backgroundColor: '#ffffff',
              useCORS: true,
              logging: false,
              allowTaint: true,
            });
            
            const imageData = canvas.toDataURL('image/png', 1.0);
            
            // Base64データをBlobに変換
            const response = await fetch(imageData);
            const blob = await response.blob();
            
            // Firebase Storageにアップロード
            const fileName = `diagram-${pageId}-svg-${i}-${Date.now()}.png`;
            let storagePath: string;
            if (planId) {
              storagePath = `companyBusinessPlan/${planId}/${fileName}`;
            } else if (serviceId && conceptId) {
              storagePath = `concepts/${serviceId}/${conceptId}/${fileName}`;
            } else {
              console.warn('ストレージパスを決定できません。スキップします。');
              continue;
            }
            
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            
            console.log(`SVG画像をアップロード: ${downloadURL}`);
            
            // SVG要素のスタイルを保持してimgタグに置き換え
            const svgStyle = window.getComputedStyle(svgEl);
            const svgWidth = svgEl.getAttribute('width') || svgStyle.width || 'auto';
            const svgHeight = svgEl.getAttribute('height') || svgStyle.height || 'auto';
            const maxWidth = svgStyle.maxWidth || '100%';
            const display = svgStyle.display || 'block';
            
            // 左からの距離を計算（中央揃えではなく、実際の位置を保持）
            const svgRect = svgEl.getBoundingClientRect();
            const parentRect = svgEl.parentElement?.getBoundingClientRect();
            let marginLeft = '0px';
            
            if (parentRect) {
              // 親要素からの相対位置を計算
              const leftOffset = svgRect.left - parentRect.left;
              if (leftOffset > 0) {
                marginLeft = `${leftOffset}px`;
              }
            } else {
              // 親要素がない場合は、元のmarginLeftを保持
              marginLeft = svgStyle.marginLeft || '0px';
            }
            
            // margin: 0px auto を削除して、左からの距離で配置
            const imgTag = `<img src="${downloadURL}" alt="図形" style="width: ${svgWidth}; height: ${svgHeight}; max-width: ${maxWidth}; margin-left: ${marginLeft}; margin-top: ${svgStyle.marginTop || '0px'}; margin-right: ${svgStyle.marginRight || '0px'}; margin-bottom: ${svgStyle.marginBottom || '0px'}; display: ${display};" />`;
            
            // outerHTMLをエスケープして正確に置換
            const svgOuterHTML = svgEl.outerHTML;
            svgReplacements.push({
              original: svgOuterHTML,
              replacement: imgTag,
            });
          } catch (error) {
            console.error(`SVG要素 ${i + 1} の画像化エラー:`, error);
            // エラーが発生しても処理を続行
          }
        }
        
        // SVG要素を一括置換（正規表現を使用してより確実に）
        for (const replacement of svgReplacements) {
          // HTMLエスケープを考慮して置換
          const escapedOriginal = replacement.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          updatedHTML = updatedHTML.replace(new RegExp(escapedOriginal, 'g'), replacement.replacement);
        }
        
        console.log(`SVG要素を${svgReplacements.length}個画像化しました。`);
      } catch (error) {
        console.error('html2canvasのインポートエラー（SVG用）:', error);
        // html2canvasが利用できない場合はスキップ
      }
    }

    // 4. ダウンロードボタンを削除
    // HTMLをパースしてダウンロードボタンを検出・削除
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(updatedHTML, 'text/html');
      
      // 「ダウンロード」というテキストを含むボタン要素を検索
      const allElements = doc.querySelectorAll('*');
      const elementsToRemove: Element[] = [];
      
      allElements.forEach((element) => {
        const textContent = element.textContent || '';
        // 「ダウンロード」というテキストを含む要素を検出
        if (textContent.includes('ダウンロード')) {
          // ボタン要素、またはボタンを含む親要素を削除対象に追加
          if (element.tagName === 'BUTTON' || element.querySelector('button')) {
            elementsToRemove.push(element);
          }
        }
      });
      
      // 削除対象の要素を削除
      elementsToRemove.forEach((element) => {
        element.remove();
      });
      
      // 更新されたHTMLを取得
      updatedHTML = doc.body.innerHTML;
    } catch (error) {
      console.error('ダウンロードボタン削除エラー:', error);
      // エラーが発生しても処理を続行
    }

    return updatedHTML;
  };

  /**
   * 固定ページのコンテンツを抽出（現在のページのみ）
   * data-page-container属性を持つ要素からページを抽出
   */
  const extractPagesFromDOM = async () => {
    const pages: Array<{
      id: string;
      title: string;
      content: string;
      pageNumber: number;
      pageId: string; // data-page-containerの値を保持
    }> = [];

    // data-page-container属性を持つ要素を取得
    const containers = document.querySelectorAll('[data-page-container]');
    
    // 非同期処理のため、Promise.allを使用
    const pagePromises = Array.from(containers).map(async (container, index) => {
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
      
      // 図形を画像化（canvas、Mermaid図など）
      let rawHTML = containerEl.innerHTML;
      try {
        rawHTML = await convertDiagramsToImages(containerEl, pageId);
      } catch (error) {
        console.error(`ページ ${pageId} の図形画像化エラー:`, error);
        // エラーが発生しても元のHTMLを使用して続行
      }
      
      // コンテンツを抽出（HTMLを整形して取得）
      const content = formatHTML(rawHTML);
      
      return {
        id: `migrated-${pageId}-${Date.now()}-${index}`,
        title: title || `ページ ${index + 1}`,
        content: content,
        pageNumber: index,
        pageId: pageId, // data-page-containerの値を保持
      };
    });

    const resolvedPages = await Promise.all(pagePromises);
    pages.push(...resolvedPages);

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

    if (isCompanyPlan) {
      // 会社本体の事業計画の場合は、companyBusinessPlanコレクションから取得
      // -componentizedで終わるplanIdを持つ事業計画を取得
      const plansQuery = query(
        collection(db, 'companyBusinessPlan'),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const plansSnapshot = await getDocs(plansQuery);
      const concepts: Array<{ id: string; name: string; pageCount: number; conceptId: string }> = [];
      
      plansSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const planIdValue = doc.id;
        
        // -componentizedで終わるplanIdのみを対象、またはpagesBySubMenuが存在するもの
        const hasPagesBySubMenu = data.pagesBySubMenu && Object.keys(data.pagesBySubMenu).length > 0;
        if (planIdValue.includes('-componentized') || hasPagesBySubMenu) {
          const pagesBySubMenu = data.pagesBySubMenu || {};
          const currentSubMenuPages = pagesBySubMenu[subMenuId] || [];
          
          concepts.push({
            id: doc.id,
            name: data.title || planIdValue,
            pageCount: currentSubMenuPages.length,
            conceptId: planIdValue,
          });
        }
      });
      
      return concepts;
    }

    // 事業企画の場合は、conceptsコレクションから取得
    if (!serviceId) return [];
    
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
    if (isCompanyPlan) {
      // 会社本体の事業計画の場合は、すべてのコンポーネント化された事業計画を取得
      try {
        const allPlans = await getAllExistingConcepts();
        
        // 既存のコンポーネント化された事業計画がある場合は、最初のものを返す
        // （「既存に追加」ボタンで全件を選択できるようにする）
        if (allPlans.length > 0) {
          return allPlans[0]; // 最初の事業計画を返す（既存に追加で全件選択可能）
        }
        
        // 現在のplanIdのドキュメントもチェック（既にコンポーネント化されている場合）
        if (planId && db) {
          const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
          if (planDoc.exists()) {
            const planData = planDoc.data();
            const hasPagesBySubMenu = planData.pagesBySubMenu && Object.keys(planData.pagesBySubMenu).length > 0;
            if (hasPagesBySubMenu) {
              return {
                id: planDoc.id,
                name: planData.title || '事業計画',
                pageCount: (planData.pagesBySubMenu[subMenuId] || []).length,
                conceptId: planDoc.id,
              };
            }
          }
        }
      } catch (error) {
        console.warn('会社本体の事業計画のチェックエラー:', error);
      }
      return null;
    }

    const allConcepts = await getAllExistingConcepts();
    
    // 標準の-componentized構想を探す（タイムスタンプなし）
    const standardConcept = allConcepts.find(c => c.conceptId === `${conceptId}-componentized`);
    
    return standardConcept || null;
  };

  /**
   * 会社本体の事業計画の全ページ一括追加処理（既存に追加モード）
   */
  const handleCompanyPlanBulkAppend = async (
    allPagesBySubMenu: { [key: string]: Array<{ id: string; title: string; content: string; pageNumber: number; pageId: string }> },
    targetPlanId: string
  ) => {
    if (!targetPlanId || !auth?.currentUser || !db) {
      alert('必要な情報が不足しています。');
      setMigrating(false);
      return;
    }

    const migrationTimestamp = Date.now();
    
    // 既存の事業計画データを取得
    const planDoc = await getDoc(doc(db, 'companyBusinessPlan', targetPlanId));
    if (!planDoc.exists()) {
      alert('事業計画が見つかりませんでした。');
      setMigrating(false);
      return;
    }

    const planData = planDoc.data();
    const existingPagesBySubMenu = planData.pagesBySubMenu || {};
    const existingPageOrderBySubMenu = planData.pageOrderBySubMenu || {};
    
    const updatedPagesBySubMenu: any = { ...existingPagesBySubMenu };
    const updatedPageOrderBySubMenu: any = { ...existingPageOrderBySubMenu };
    
    // 各サブメニューのページを処理
    for (const [subMenuId, pages] of Object.entries(allPagesBySubMenu)) {
      if (Array.isArray(pages) && pages.length > 0) {
        // 移行するページデータを準備
        const migratedPages = pages.map((page, index) => {
          const pageId = `page-migrated-${migrationTimestamp}-${subMenuId}-${index}`;
          return {
            id: pageId,
            pageNumber: index,
            title: page.title,
            content: page.content,
            pageId: page.pageId,
            createdAt: new Date().toISOString(),
            migrated: true,
            migratedAt: new Date().toISOString(),
          };
        });
        
        // Page0（キービジュアル）を最初に配置
        const page0Index = migratedPages.findIndex((p) => 
          p.pageId === '0' || p.pageId === 'page-0'
        );
        const page0 = page0Index >= 0 ? migratedPages[page0Index] : null;
        const otherMigratedPages = page0Index >= 0 
          ? migratedPages.filter((_, idx) => idx !== page0Index)
          : migratedPages;
        
        // 既存のページに追加
        const existingPages = existingPagesBySubMenu[subMenuId] || [];
        const existingPageOrder = existingPageOrderBySubMenu[subMenuId] || [];
        
        if (page0) {
          // Page0が既に存在する場合は追加しない（キービジュアルは1つだけ）
          const hasPage0 = existingPages.some((p: any) => p.pageId === '0' || p.pageId === 'page-0');
          if (!hasPage0) {
            updatedPagesBySubMenu[subMenuId] = [page0, ...existingPages, ...otherMigratedPages];
            updatedPageOrderBySubMenu[subMenuId] = [page0.id, ...existingPageOrder, ...otherMigratedPages.map(p => p.id)];
          } else {
            updatedPagesBySubMenu[subMenuId] = [...existingPages, ...otherMigratedPages];
            updatedPageOrderBySubMenu[subMenuId] = [...existingPageOrder, ...otherMigratedPages.map(p => p.id)];
          }
        } else {
          updatedPagesBySubMenu[subMenuId] = [...existingPages, ...otherMigratedPages];
          updatedPageOrderBySubMenu[subMenuId] = [...existingPageOrder, ...otherMigratedPages.map(p => p.id)];
        }
      }
    }
    
    // Firestoreに更新
    await updateDoc(doc(db, 'companyBusinessPlan', targetPlanId), {
      pagesBySubMenu: updatedPagesBySubMenu,
      pageOrderBySubMenu: updatedPageOrderBySubMenu,
      updatedAt: serverTimestamp(),
    });
    
    const totalPages = Object.values(allPagesBySubMenu).reduce((sum, pages) => sum + pages.length, 0);
    const subMenuCount = Object.keys(allPagesBySubMenu).length;

    console.log('✅ 全ページ一括追加完了:', {
      targetPlanId,
      planName: planData.title,
      totalPages,
      subMenuCount,
      subMenus: Object.keys(allPagesBySubMenu),
    });

    setProgress(`✅ ${totalPages}件のページを${subMenuCount}個のサブメニューに追加しました！`);
    setTimeout(() => {
      onMigrated(targetPlanId, SUB_MENU_ITEMS[0].id); // 最初のサブメニューにリダイレクト
      onClose();
    }, 1500);
  };

  /**
   * 会社本体の事業計画の全ページ一括移行処理
   */
  const handleCompanyPlanBulkMigration = async (
    allPagesBySubMenu: { [key: string]: Array<{ id: string; title: string; content: string; pageNumber: number; pageId: string }> },
    targetPlanId: string
  ) => {
    if (!targetPlanId || !auth?.currentUser || !db) {
      alert('必要な情報が不足しています。');
      setMigrating(false);
      return;
    }

    const migrationTimestamp = Date.now();
    
    // 既存の事業計画データを取得（キービジュアル設定を引き継ぐため）
    let planData: any = {};
    let keyVisualSettings: {
      keyVisualUrl?: string;
      keyVisualHeight?: number;
      keyVisualScale?: number;
      keyVisualLogoUrl?: string;
      keyVisualMetadata?: any;
    } = {};
    
    if (planId) {
      try {
        const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
        if (planDoc.exists()) {
          planData = planDoc.data();
          if (planData.keyVisualUrl !== undefined) {
            keyVisualSettings.keyVisualUrl = planData.keyVisualUrl;
          }
          if (planData.keyVisualHeight !== undefined) {
            keyVisualSettings.keyVisualHeight = planData.keyVisualHeight;
          }
          if (planData.keyVisualScale !== undefined) {
            keyVisualSettings.keyVisualScale = planData.keyVisualScale;
          }
          if (planData.keyVisualLogoUrl !== undefined) {
            keyVisualSettings.keyVisualLogoUrl = planData.keyVisualLogoUrl;
          }
          if (planData.keyVisualMetadata !== undefined) {
            keyVisualSettings.keyVisualMetadata = planData.keyVisualMetadata;
          }
        }
      } catch (error) {
        console.warn('キービジュアル設定の取得に失敗:', error);
      }
    }
    
    const planName = `${planData.title || '事業計画'}（コンポーネント化版 ${new Date(migrationTimestamp).toLocaleDateString('ja-JP')}）`;
    
    const newPagesBySubMenu: any = {};
    const newPageOrderBySubMenu: any = {};
    
    // 各サブメニューのページを処理
    for (const [subMenuId, pages] of Object.entries(allPagesBySubMenu)) {
      if (Array.isArray(pages) && pages.length > 0) {
        // 移行するページデータを準備
        const migratedPages = pages.map((page, index) => {
          const pageId = `page-migrated-${migrationTimestamp}-${subMenuId}-${index}`;
          return {
            id: pageId,
            pageNumber: index,
            title: page.title,
            content: page.content,
            pageId: page.pageId,
            createdAt: new Date().toISOString(),
            migrated: true,
            migratedAt: new Date().toISOString(),
          };
        });
        
        // Page0（キービジュアル）を最初に配置
        const page0Index = migratedPages.findIndex((p) => 
          p.pageId === '0' || p.pageId === 'page-0'
        );
        const page0 = page0Index >= 0 ? migratedPages[page0Index] : null;
        const otherMigratedPages = page0Index >= 0 
          ? migratedPages.filter((_, idx) => idx !== page0Index)
          : migratedPages;
        
        if (page0) {
          newPagesBySubMenu[subMenuId] = [page0, ...otherMigratedPages];
          newPageOrderBySubMenu[subMenuId] = [page0.id, ...otherMigratedPages.map(p => p.id)];
        } else {
          newPagesBySubMenu[subMenuId] = [...otherMigratedPages];
          newPageOrderBySubMenu[subMenuId] = [...otherMigratedPages.map(p => p.id)];
        }
      }
    }
    
    // 新規事業計画を作成
    const newDocRef = await addDoc(collection(db, 'companyBusinessPlan'), {
      title: planName,
      description: planData.description || '',
      userId: auth.currentUser.uid,
      ...keyVisualSettings,
      pagesBySubMenu: newPagesBySubMenu,
      pageOrderBySubMenu: newPageOrderBySubMenu,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const actualNewPlanId = newDocRef.id;
    
    const totalPages = Object.values(allPagesBySubMenu).reduce((sum, pages) => sum + pages.length, 0);
    const subMenuCount = Object.keys(allPagesBySubMenu).length;

    console.log('✅ 全ページ一括移行完了:', {
      newPlanId: actualNewPlanId,
      planName,
      totalPages,
      subMenuCount,
      subMenus: Object.keys(allPagesBySubMenu),
    });

    setProgress(`✅ ${totalPages}件のページを${subMenuCount}個のサブメニューから新しい事業計画として作成しました！`);
    setTimeout(() => {
      onMigrated(actualNewPlanId, 'overview');
      setMigrating(false);
    }, 1000);
  };

  /**
   * 会社本体の事業計画の移行処理
   */
  const handleCompanyPlanMigration = async (
    selectedPages: Array<{ id: string; title: string; content: string; pageNumber: number; pageId: string }>,
    mode: 'overwrite' | 'append' | 'new',
    targetSubMenuId?: string,
    targetPlanId?: string // 「既存に追加」の場合の対象事業計画ID
  ) => {
    // 「既存に追加」の場合はtargetPlanIdを使用、それ以外はplanIdを使用
    const finalPlanId = (mode === 'append' && targetPlanId) ? targetPlanId : planId;
    
    if (!finalPlanId || !auth?.currentUser || !db) {
      alert('必要な情報が不足しています。');
      setMigrating(false);
      return;
    }

    const targetSubMenu: string = targetSubMenuId || subMenuId;
    if (!targetSubMenu) {
      alert('サブメニューIDが指定されていません。');
      setMigrating(false);
      return;
    }
    const migrationTimestamp = Date.now();

    // 移行するページデータを準備
    const migratedPages = selectedPages.map((page, index) => {
      const pageId = `page-migrated-${migrationTimestamp}-${index}`;
      return {
        id: pageId,
        pageNumber: index,
        title: page.title,
        content: page.content,
        pageId: page.pageId,
        createdAt: new Date().toISOString(),
        migrated: true,
        migratedAt: new Date().toISOString(),
      };
    });

    // Page0（キービジュアル）を最初に配置
    const page0Index = migratedPages.findIndex((p) => 
      p.pageId === '0' || p.pageId === 'page-0'
    );
    const page0 = page0Index >= 0 ? migratedPages[page0Index] : null;
    const otherMigratedPages = page0Index >= 0 
      ? migratedPages.filter((_, idx) => idx !== page0Index)
      : migratedPages;

    // 既存の事業計画データを取得
    const planDoc = await getDoc(doc(db, 'companyBusinessPlan', finalPlanId));
    if (!planDoc.exists()) {
      alert('事業計画が見つかりませんでした。');
      setMigrating(false);
      return;
    }

    const planData = planDoc.data();
    const currentSubMenuPages = (planData.pagesBySubMenu?.[targetSubMenu] || []) as any[];
    const currentSubMenuPageOrder = (planData.pageOrderBySubMenu?.[targetSubMenu] || []) as string[];
    
    // 元の事業計画からキービジュアル設定を取得
    const keyVisualSettings: {
      keyVisualUrl?: string;
      keyVisualHeight?: number;
      keyVisualScale?: number;
      keyVisualLogoUrl?: string;
      keyVisualMetadata?: any;
    } = {};
    
    // undefinedの値を除外して設定（Firestoreはundefinedをサポートしていない）
    if (planData.keyVisualUrl !== undefined) {
      keyVisualSettings.keyVisualUrl = planData.keyVisualUrl;
    }
    if (planData.keyVisualHeight !== undefined) {
      keyVisualSettings.keyVisualHeight = planData.keyVisualHeight;
    }
    if (planData.keyVisualScale !== undefined) {
      keyVisualSettings.keyVisualScale = planData.keyVisualScale;
    }
    if (planData.keyVisualLogoUrl !== undefined) {
      keyVisualSettings.keyVisualLogoUrl = planData.keyVisualLogoUrl;
    }
    if (planData.keyVisualMetadata !== undefined) {
      keyVisualSettings.keyVisualMetadata = planData.keyVisualMetadata;
    }

    let updatedPages: any[];
    let updatedPageOrder: string[];

    if (mode === 'new') {
      // 新規作成モード：新しい事業計画を作成（タイムスタンプ付き）
      const planName = `${planData.title || '事業計画'}（コンポーネント化版 ${new Date(migrationTimestamp).toLocaleDateString('ja-JP')}）`;
      
      const newPagesBySubMenu: any = {};
      const newPageOrderBySubMenu: any = {};
      
      if (page0) {
        newPagesBySubMenu[targetSubMenu] = [page0, ...otherMigratedPages];
        newPageOrderBySubMenu[targetSubMenu] = [page0.id, ...otherMigratedPages.map(p => p.id)];
      } else {
        newPagesBySubMenu[targetSubMenu] = [...otherMigratedPages];
        newPageOrderBySubMenu[targetSubMenu] = [...otherMigratedPages.map(p => p.id)];
      }

      // addDocの戻り値から実際のドキュメントIDを取得
      const newDocRef = await addDoc(collection(db, 'companyBusinessPlan'), {
        title: planName,
        description: planData.description || '',
        userId: auth.currentUser.uid,
        // キービジュアル設定を引き継ぐ
        ...keyVisualSettings,
        pagesBySubMenu: newPagesBySubMenu,
        pageOrderBySubMenu: newPageOrderBySubMenu,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const actualNewPlanId = newDocRef.id; // 実際のFirestoreドキュメントID

      console.log('✅ 新規事業計画作成完了:', {
        newPlanId: actualNewPlanId,
        planName,
        targetSubMenu,
        pagesCount: selectedPages.length,
      });

      setProgress(`✅ ${selectedPages.length}件のページを新しい事業計画として作成しました！`);
      setTimeout(() => {
        onMigrated(actualNewPlanId, targetSubMenu);
        setMigrating(false);
      }, 1000);
      return;
    } else if (mode === 'overwrite') {
      // 上書きモード
      updatedPages = page0 ? [page0, ...otherMigratedPages] : otherMigratedPages;
      updatedPageOrder = page0 ? [page0.id, ...otherMigratedPages.map(p => p.id)] : otherMigratedPages.map(p => p.id);
    } else {
      // 追加モード
      updatedPages = page0 
        ? [...currentSubMenuPages, page0, ...otherMigratedPages]
        : [...currentSubMenuPages, ...otherMigratedPages];
      updatedPageOrder = page0
        ? [...currentSubMenuPageOrder, page0.id, ...otherMigratedPages.map(p => p.id)]
        : [...currentSubMenuPageOrder, ...otherMigratedPages.map(p => p.id)];
    }

    // Firestoreに保存
    const updatedPagesBySubMenu = {
      ...(planData.pagesBySubMenu || {}),
      [targetSubMenu]: updatedPages,
    };
    const updatedPageOrderBySubMenu = {
      ...(planData.pageOrderBySubMenu || {}),
      [targetSubMenu]: updatedPageOrder,
    };

    // すべてのモードでsetDocを使用して全体を更新（merge: trueで既存データを保持）
    console.log('handleCompanyPlanMigration - 保存前のデータ:');
    console.log('  planId:', planId);
    console.log('  targetSubMenu:', targetSubMenu);
    console.log('  updatedPages:', updatedPages);
    console.log('  updatedPageOrder:', updatedPageOrder);
    console.log('  updatedPagesBySubMenu:', updatedPagesBySubMenu);
    console.log('  updatedPageOrderBySubMenu:', updatedPageOrderBySubMenu);
    console.log('  keyVisualSettings:', keyVisualSettings);
    
    // 更新データを準備（キービジュアル設定も含める）
    const updateData: any = {
      ...planData,
      pagesBySubMenu: updatedPagesBySubMenu,
      pageOrderBySubMenu: updatedPageOrderBySubMenu,
      updatedAt: serverTimestamp(),
    };
    
    // キービジュアル設定を追加（既存の設定がない場合、または上書きモードの場合）
    if (mode === 'overwrite' || Object.keys(keyVisualSettings).length > 0) {
      // 既存のキービジュアル設定がない場合、または上書きモードの場合は設定を追加
      if (mode === 'overwrite' || !planData.keyVisualUrl) {
        Object.assign(updateData, keyVisualSettings);
      }
    }
    
    await setDoc(
      doc(db, 'companyBusinessPlan', finalPlanId),
      updateData,
      { merge: true }
    );

    // 保存後に確認
    const savedDoc = await getDoc(doc(db, 'companyBusinessPlan', finalPlanId));
    if (savedDoc.exists()) {
      const savedData = savedDoc.data();
      console.log('handleCompanyPlanMigration - 保存後のデータ:');
      console.log('  savedData.pagesBySubMenu:', savedData.pagesBySubMenu);
      console.log('  savedData.pageOrderBySubMenu:', savedData.pageOrderBySubMenu);
      if (targetSubMenu) {
        console.log('  savedData.pagesBySubMenu[targetSubMenu]:', savedData.pagesBySubMenu?.[targetSubMenu]);
        console.log('  savedData.pageOrderBySubMenu[targetSubMenu]:', savedData.pageOrderBySubMenu?.[targetSubMenu]);
      }
    }

    setProgress(`✅ ${selectedPages.length}件のページを${mode === 'overwrite' ? '上書き' : '追加'}しました！`);
    setTimeout(() => {
      // appendモードの場合は、追加先のサブメニューIDも渡す
      onMigrated(finalPlanId, mode === 'append' ? targetSubMenu : undefined);
      setMigrating(false);
    }, 1000);
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
      
      // 既に抽出されたページがある場合はそれを使用、ない場合は新しく抽出
      let pages = extractedPages.length > 0 ? extractedPages : await extractPagesFromDOM();
      
      if (pages.length === 0) {
        alert('移行するページが見つかりませんでした。data-page-container属性を持つ要素を確認してください。');
        setMigrating(false);
        setProgress('');
        return;
      }

      // 抽出されたページがまだ設定されていない場合は設定
      if (extractedPages.length === 0) {
        setExtractedPages(pages);
        // デフォルトですべて選択
        setSelectedPageIds(new Set(pages.map(p => p.id)));
        // ページ抽出中メッセージを表示
        setProgress('ページを抽出中...');
      }

      // 選択されたページのみをフィルタリング
      const selectedPages = pages.filter(page => selectedPageIds.has(page.id));
      
      if (selectedPages.length === 0) {
        alert('移行するページを1つ以上選択してください。');
        setMigrating(false);
        setProgress('');
        return;
      }

      // 既に抽出済みの場合は、進捗メッセージを更新
      if (extractedPages.length > 0) {
        setProgress(`${selectedPages.length}件のページを移行中...`);
      } else {
        // 新しく抽出した場合は、抽出完了後に移行中メッセージを表示
        setProgress(`${selectedPages.length}件のページを移行中...`);
      }

      // 会社本体の事業計画の場合の処理
      if (isCompanyPlan) {
        // 「既存に追加」モードの場合は、targetConceptIdをplanIdとして使用
        const targetPlanId = (mode === 'append' && targetConceptId) ? targetConceptId : planId;
        
        if (!targetPlanId) {
          alert('事業計画IDが見つかりませんでした。');
          setMigrating(false);
          setProgress('');
          return;
        }
        
        // 全ページ一括移行モードの場合、pagesBySubMenu stateを使用
        if (useBulkMigration && Object.keys(pagesBySubMenu).length > 0) {
          if (mode === 'new') {
            // 新規作成：すべてのサブメニューのページを移行
            await handleCompanyPlanBulkMigration(pagesBySubMenu, targetPlanId);
          } else if (mode === 'append') {
            // 既存に追加：すべてのサブメニューのページを追加
            await handleCompanyPlanBulkAppend(pagesBySubMenu, targetPlanId);
          } else {
            // 上書きモードは全ページ一括移行ではサポートしない（通常モードを使用）
            await handleCompanyPlanMigration(selectedPages, mode, targetSubMenuId, targetPlanId);
          }
        } else {
          // 通常モード：会社本体の事業計画の場合は、companyBusinessPlanコレクションに保存
          await handleCompanyPlanMigration(selectedPages, mode, targetSubMenuId, targetPlanId);
        }
        return;
      }

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
        const originalConceptName = (serviceId && conceptId) ? (fixedConcepts[serviceId]?.[conceptId] || conceptId) : conceptId || '';
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
          const originalConceptName = (serviceId && conceptId) ? (fixedConcepts[serviceId]?.[conceptId] || conceptId) : conceptId || '';
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
      const existingPagesBySubMenu = conceptData.pagesBySubMenu || {};
      const pageOrderBySubMenu = conceptData.pageOrderBySubMenu || {};
      
      // 追加先のサブメニューIDを決定（指定されていない場合は現在のサブメニュー）
      const targetSubMenu = targetSubMenuId || subMenuId;
      
      console.log('🔍 デバッグ情報:', {
        mode,
        targetConceptId,
        targetSubMenuId,
        targetSubMenu,
        currentSubMenuId: subMenuId,
        pagesBySubMenuKeys: Object.keys(existingPagesBySubMenu),
        conceptData: conceptData,
      });
      
      const currentSubMenuPages = targetSubMenu ? (existingPagesBySubMenu[targetSubMenu] || []) : [];
      const currentSubMenuPageOrder = targetSubMenu ? (pageOrderBySubMenu[targetSubMenu] || []) : [];
      
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
              ...currentSubMenuPageOrder.filter((id: string) => id !== templatePage0.id),
              ...migratedPages.map(p => p.id)
            ];
          } else {
            // 移行するPage0がない場合
            updatedPages = [templatePage0, ...otherTemplatePages, ...migratedPages];
            updatedPageOrder = [
              templatePage0.id,
              ...currentSubMenuPageOrder.filter((id: string) => id !== templatePage0.id),
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
        progressMessage = `✅ ${selectedPages.length}件のページを既存の${isCompanyPlan ? '事業計画' : '構想'}に追加しました！`;
      } else {
        progressMessage = `✅ ${selectedPages.length}件のページを新しい${isCompanyPlan ? '事業計画' : '構想'}として作成しました！`;
      }
      setProgress(progressMessage);
      
      setTimeout(() => {
        // 移行後のコールバックに新しいconceptIdを渡す
        // appendモードの場合は、追加先のサブメニューにリダイレクト
        if (mode === 'append' && targetSubMenuId) {
          // サブメニューIDも含めてリダイレクトするために、URLを構築
          if (isCompanyPlan && planId) {
            const targetUrl = `/business-plan/company/${planId}/${targetSubMenuId}`;
            window.location.href = targetUrl;
          } else if (serviceId && componentizedConceptId) {
            const targetUrl = `/business-plan/services/${serviceId}/${componentizedConceptId}/${targetSubMenuId}`;
            window.location.href = targetUrl;
          } else {
            onMigrated(componentizedConceptId);
          }
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

    // 進捗メッセージをクリア
    setProgress('');
    
    // DOMが準備されるまで少し待機（モーダルが開かれた直後はDOMがまだ更新されていない可能性がある）
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 図形のレンダリングを待つ（p5.jsやMermaid図が描画されるまで待機）
    setProgress('図形を検出中...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機して図形の描画を待つ
    
    // DOMからページを抽出（図形を画像化しながら）
    setProgress('ページを抽出中...');
    const pages = await extractPagesFromDOM();
    
    // デバッグログ
    console.log('extractPagesFromDOM - 検出されたコンテナ数:', document.querySelectorAll('[data-page-container]').length);
    console.log('extractPagesFromDOM - 抽出されたページ数:', pages.length);
    
    if (pages.length === 0) {
      const containerCount = document.querySelectorAll('[data-page-container]').length;
      alert(`移行するページが見つかりませんでした。\n\n検出されたdata-page-container要素: ${containerCount}件\n\n現在のページにdata-page-container属性を持つ要素が存在するか確認してください。`);
      setProgress('');
      return;
    }

    setExtractedPages(pages);
    // デフォルトですべて選択
    setSelectedPageIds(new Set(pages.map(p => p.id)));
    
    // 進捗メッセージをクリア（ページ抽出完了）
    setProgress('');

    // 既存のコンポーネント化された構想をチェック
    const existing = await checkExistingConcept();
    
    // 会社事業計画の場合は、すべての既存事業計画を取得して「既存に追加」を有効にする
    if (isCompanyPlan) {
      const allPlans = await getAllExistingConcepts();
      setTotalExistingPlansCount(allPlans.length);
      
      if (allPlans.length > 0) {
        // 既存のコンポーネント化された事業計画がある場合
        // 最初のものをexistingConceptとして設定（「既存に追加」で全件選択可能）
        setExistingConcept(allPlans[0]);
        setShowConfirmDialog(true);
      } else {
        // 既存の事業計画がない場合
        setExistingConcept({
          id: '',
          name: '新規事業計画を作成',
          pageCount: 0,
          conceptId: '',
        });
        setShowConfirmDialog(true);
      }
    } else {
      // 事業企画の場合
      if (existing) {
        setExistingConcept(existing);
        setShowConfirmDialog(true);
      } else {
        // 既存の構想がない場合でも、選択UIを表示
        // ダミーの既存構想オブジェクトを作成（新規作成のみ選択可能）
        setExistingConcept({
          id: '',
          name: '新規構想を作成',
          pageCount: 0,
          conceptId: '',
        });
        setShowConfirmDialog(true);
      }
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
              {existingConcept && existingConcept.id 
                ? (isCompanyPlan ? '既存のコンポーネント化された事業計画が見つかりました' : '既存のコンポーネント化された構想が見つかりました')
                : (isCompanyPlan ? 'ページを移行します' : 'ページを移行します')}
            </h4>
          </div>
          
          {existingConcept && existingConcept.id && (
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
                {isCompanyPlan && (
                  <>
                    <div style={{ fontWeight: 600, color: '#6B7280' }}>既存のコンポーネント化された事業計画:</div>
                    <div style={{ fontWeight: 500, color: '#3B82F6' }}>{totalExistingPlansCount}件</div>
                  </>
                )}
                <div style={{ fontWeight: 600, color: '#6B7280' }}>{isCompanyPlan ? '事業計画名:' : '構想名:'}</div>
                <div style={{ fontWeight: 500 }}>{existingConcept.name}</div>
                
                <div style={{ fontWeight: 600, color: '#6B7280' }}>既存のページ数:</div>
                <div style={{ fontWeight: 500 }}>{existingConcept.pageCount}件</div>
                
                <div style={{ fontWeight: 600, color: '#6B7280' }}>移行するページ数:</div>
                <div style={{ fontWeight: 500, color: '#3B82F6' }}>{extractedPages.length}件</div>
              </div>
            </div>
          )}
          
          {!existingConcept || !existingConcept.id ? (
            <div style={{
              backgroundColor: '#F0F9FF',
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
                <div style={{ fontWeight: 600, color: '#6B7280' }}>移行するページ数:</div>
                <div style={{ fontWeight: 500, color: '#3B82F6' }}>{extractedPages.length}件</div>
              </div>
            </div>
          ) : null}
          
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '20px',
            lineHeight: '1.6',
          }}>
            {existingConcept && existingConcept.id 
              ? (isCompanyPlan 
                  ? `既存のコンポーネント化された事業計画が${totalExistingPlansCount}件見つかりました。どのように処理しますか？`
                  : 'どのように処理しますか？')
              : '新規のコンポーネント化された' + (isCompanyPlan ? '事業計画' : '構想') + 'を作成しますか？'}
          </p>
          
          {existingConcept && existingConcept.id && isCompanyPlan && (
            <div style={{
              backgroundColor: '#EFF6FF',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              border: '1px solid #BFDBFE',
            }}>
              <div style={{
                fontSize: '13px',
                color: '#1E40AF',
                lineHeight: '1.6',
              }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>💡 「既存に追加」について</div>
                <div>別のコンポーネント化された事業計画にページを追加します。移行前の固定ページ形式には追加されません。</div>
              </div>
            </div>
          )}
          
          {/* 新規事業計画作成時の全ページ一括移行オプション（常に表示） */}
          {isCompanyPlan && (
            <div style={{
              backgroundColor: '#F0FDF4',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              border: '1px solid #86EFAC',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#166534',
              }}>
                <input
                  type="checkbox"
                  checked={useBulkMigration}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    setUseBulkMigration(checked);
                    
                    // チェックされた場合、すべてのサブメニューからページを取得して件数を表示
                    if (checked && isCompanyPlan && planId) {
                      try {
                        setProgress('すべてのサブメニューからページを取得中...');
                        const allPages = await extractAllPagesFromAllSubMenus();
                        setPagesBySubMenu(allPages);
                        
                        // 件数を計算
                        const total = Object.values(allPages).reduce((sum, pages) => sum + pages.length, 0);
                        const bySubMenu: { [key: string]: number } = {};
                        Object.entries(allPages).forEach(([subMenuId, pages]) => {
                          bySubMenu[subMenuId] = pages.length;
                        });
                        
                        setBulkMigrationPageCount({ total, bySubMenu });
                        setProgress('');
                      } catch (error) {
                        console.error('ページ取得エラー:', error);
                        setProgress('');
                      }
                    } else {
                      // チェックが外された場合、件数をリセット
                      setBulkMigrationPageCount({ total: 0, bySubMenu: {} });
                      setPagesBySubMenu({});
                    }
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    marginTop: '2px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px' }}>🚀 全ページ一括移行</div>
                  <div style={{ fontSize: '13px', color: '#15803D', lineHeight: '1.6', marginBottom: '8px' }}>
                    概要・コンセプト、成長戦略、ビジネスモデル、市場規模、事業計画、シミュレーション、実行スケジュール、伊藤忠シナジー、補助金・助成金、ケーススタディ、リスク評価、スナップショット比較、参考文献のすべてのサブメニューからページを一括で移行します。
                  </div>
                  {useBulkMigration && bulkMigrationPageCount.total > 0 && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#D1FAE5',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#065F46',
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                        移行予定: 合計 {bulkMigrationPageCount.total}件
                      </div>
                      <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                        {Object.entries(bulkMigrationPageCount.bySubMenu).map(([subMenuId, count]) => {
                          const subMenuItem = SUB_MENU_ITEMS.find(item => item.id === subMenuId);
                          return subMenuItem ? (
                            <div key={subMenuId}>
                              {subMenuItem.label}: {count}件
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          )}
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            {/* 既存のコンポーネント化された事業計画/構想がある場合のみ「上書き」と「既存に追加」を表示 */}
            {existingConcept && existingConcept.id && (
              <>
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
                    // 全ページ一括移行モードの場合
                    if (isCompanyPlan && useBulkMigration && planId && Object.keys(pagesBySubMenu).length > 0) {
                      // すべての既存構想を取得
                      const allConcepts = await getAllExistingConcepts();
                      
                      if (allConcepts.length === 0) {
                        alert('既存のコンポーネント化された事業計画が見つかりませんでした。');
                        return;
                      } else if (allConcepts.length === 1) {
                        // 1つだけの場合は直接追加
                        setMigrationMode('append');
                        setShowConfirmDialog(false);
                        
                        try {
                          setMigrating(true);
                          setProgress('すべてのサブメニューにページを追加中...');
                          await handleMigrate('append', allConcepts[0].id);
                        } catch (error: any) {
                          console.error('全ページ一括追加エラー:', error);
                          alert(`全ページ一括追加に失敗しました: ${error.message || '不明なエラー'}`);
                          setMigrating(false);
                          setProgress('');
                        }
                        return;
                      } else {
                        // 複数ある場合は選択UIを表示
                        setShowConceptSelector(true);
                        setMigrationMode('append');
                        return;
                      }
                    }
                    
                    // 通常モード：すべての既存構想を取得
                    const allConcepts = await getAllExistingConcepts();
                    
                    if (allConcepts.length === 0) {
                      alert(isCompanyPlan ? '既存のコンポーネント化された事業計画が見つかりませんでした。' : '既存のコンポーネント化された構想が見つかりませんでした。');
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
              </>
            )}
            <button
              onClick={async () => {
                setMigrationMode('new');
                setShowConfirmDialog(false);
                
                // 全ページ一括移行モードの場合、すべてのサブメニューからページを取得
                if (isCompanyPlan && useBulkMigration && planId) {
                  try {
                    setMigrating(true);
                    setProgress('すべてのサブメニューからページを取得中...');
                    
                    const allPages = await extractAllPagesFromAllSubMenus();
                    
                    // 全ページ数を計算
                    const totalPages = Object.values(allPages).reduce((sum, pages) => sum + pages.length, 0);
                    const subMenuCount = Object.keys(allPages).length;
                    
                    if (totalPages === 0) {
                      const checkedSubMenus = SUB_MENU_ITEMS.map(item => item.label).join('、');
                      alert(`すべてのサブメニューからページが見つかりませんでした。\n\n確認したサブメニュー: ${checkedSubMenus}\n\n各サブメニューのページに\`data-page-container\`属性を持つ要素があるか確認してください。\n\nブラウザのコンソールに詳細なログが表示されています。`);
                      setMigrating(false);
                      setProgress('');
                      return;
                    }
                    
                    console.log('✅ 全ページ一括移行: ページ取得完了', {
                      totalPages,
                      subMenuCount,
                      subMenus: Object.keys(allPages).map(id => {
                        const item = SUB_MENU_ITEMS.find(i => i.id === id);
                        return item ? item.label : id;
                      }),
                    });
                    
                    setPagesBySubMenu(allPages); // stateも更新（表示用）
                    setProgress(`✅ ${totalPages}件のページを${Object.keys(allPages).length}個のサブメニューから取得しました。移行を開始します...`);
                    
                    // すべてのページを直接移行（stateに依存せず、取得したデータを直接使用）
                    await handleCompanyPlanBulkMigration(allPages, planId);
                  } catch (error: any) {
                    console.error('全ページ一括取得エラー:', error);
                    alert(`全ページ一括取得に失敗しました: ${error.message || '不明なエラー'}`);
                    setMigrating(false);
                    setProgress('');
                  }
                } else {
                  // 通常モード
                  handleMigrate('new');
                }
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
              {isCompanyPlan ? '新規事業計画作成' : '新規構想作成'}
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
                {isCompanyPlan ? '追加先の事業計画を選択してください' : '追加先の構想を選択してください'}
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
                  alert(isCompanyPlan ? '追加先の事業計画を選択してください。' : '追加先の構想を選択してください。');
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
              onClick={async () => {
                if (!selectedConceptId) {
                  alert(isCompanyPlan ? '追加先の事業計画を選択してください。' : '追加先の構想を選択してください。');
                  return;
                }
                setMigrationMode('append');
                setShowSubMenuSelector(false);
                
                // 全ページ一括移行モードの場合
                if (isCompanyPlan && useBulkMigration && planId && Object.keys(pagesBySubMenu).length > 0 && selectedConceptId) {
                  try {
                    setMigrating(true);
                    setProgress('すべてのサブメニューにページを追加中...');
                    await handleMigrate('append', selectedConceptId);
                  } catch (error: any) {
                    console.error('全ページ一括追加エラー:', error);
                    alert(`全ページ一括追加に失敗しました: ${error.message || '不明なエラー'}`);
                    setMigrating(false);
                    setProgress('');
                  }
                } else {
                  // 通常モード
                  handleMigrate('append', selectedConceptId, selectedSubMenuId);
                }
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

