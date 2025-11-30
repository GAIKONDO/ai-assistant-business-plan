'use client';

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import Script from 'next/script';
import { auth, db } from '@/lib/firebase';
import Layout from '@/components/Layout';
import ConceptSubMenu, { SUB_MENU_ITEMS } from '@/components/ConceptSubMenu';
import { PresentationModeProvider, usePresentationMode } from '@/components/PresentationModeContext';
import { ComponentizedPageProvider, useComponentizedPage } from '@/components/pages/component-test/test-concept/ComponentizedPageContext';
import KeyVisualPDFMetadataEditor from '@/components/KeyVisualPDFMetadataEditor';
import MigrateFromFixedPage from '@/components/pages/component-test/test-concept/MigrateFromFixedPage';

interface ConceptData {
  id: string;
  name: string;
  description: string;
  conceptId: string;
  serviceId: string;
  keyVisualUrl?: string;
  keyVisualHeight?: number; // キービジュアルの高さ（%）
  keyVisualScale?: number; // キービジュアルのスケール（%）
  keyVisualLogoUrl?: string; // PDF右上に表示するロゴのURL
  keyVisualMetadata?: {
    title: string;
    signature: string;
    date: string;
    position: { x: number; y: number; align: 'left' | 'center' | 'right' };
    titleFontSize?: number;
    signatureFontSize?: number;
    dateFontSize?: number;
  };
}

interface ConceptContextType {
  concept: ConceptData | null;
  loading: boolean;
  reloadConcept: () => Promise<void>;
}

const ConceptContext = createContext<ConceptContextType>({ 
  concept: null, 
  loading: true, 
  reloadConcept: async () => {} 
});

export const useConcept = () => useContext(ConceptContext);

interface ContainerVisibilityContextType {
  showContainers: boolean;
  setShowContainers: (show: boolean) => void;
}

const ContainerVisibilityContext = createContext<ContainerVisibilityContextType | undefined>(undefined);

export const useContainerVisibility = () => {
  const context = useContext(ContainerVisibilityContext);
  if (context === undefined) {
    throw new Error('useContainerVisibility must be used within a ContainerVisibilityProvider');
  }
  return context;
};

declare global {
  interface Window {
    p5?: any;
    mermaid?: any;
  }
}

const SERVICE_NAMES: { [key: string]: string } = {
  'own-service': '自社開発・自社サービス事業',
  'education-training': 'AI導入ルール設計・人材育成・教育事業',
  'consulting': 'プロセス可視化・業務コンサル事業',
  'ai-dx': 'AI駆動開発・DX支援SI事業',
};

export default function ConceptDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const serviceId = params.serviceId as string;
  const conceptId = params.conceptId as string;

  // コンポーネント化されたページの場合は、ComponentizedPageProviderでラップ
  // conceptIdが-componentizedを含む、または特定のconceptIdの場合はコンポーネント化されたページ
  const isComponentizedPage = 
    (serviceId === 'component-test' && conceptId === 'test-concept') ||
    conceptId.includes('-componentized');

  const [concept, setConcept] = useState<ConceptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const loadConcept = useCallback(async () => {
    if (!auth?.currentUser || !db || !serviceId || !conceptId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Firestoreから構想データを読み込む
      const conceptsQuery = query(
        collection(db, 'concepts'),
        where('userId', '==', auth.currentUser.uid),
        where('serviceId', '==', serviceId),
        where('conceptId', '==', conceptId)
      );
      
      const conceptsSnapshot = await getDocs(conceptsQuery);
      
      if (!conceptsSnapshot.empty) {
        const conceptDoc = conceptsSnapshot.docs[0];
        const data = conceptDoc.data();
        console.log('Firestoreから読み込んだkeyVisualMetadata:', data.keyVisualMetadata);
        setConcept({
          id: conceptDoc.id,
          name: data.name || '',
          description: data.description || '',
          conceptId: data.conceptId || conceptId,
          serviceId: data.serviceId || serviceId,
          keyVisualUrl: data.keyVisualUrl || '',
          keyVisualHeight: data.keyVisualHeight || 56.25,
          keyVisualScale: data.keyVisualScale || 100,
          keyVisualLogoUrl: data.keyVisualLogoUrl || undefined,
          keyVisualMetadata: data.keyVisualMetadata || undefined,
        });
        console.log('setConceptに設定したkeyVisualMetadata:', data.keyVisualMetadata);
      } else {
        // Firestoreにデータがない場合は固定の名前を使用
        const fixedConcepts: { [key: string]: { [key: string]: string } } = {
          'own-service': {
            'maternity-support': '出産支援パーソナルApp',
            'care-support': '介護支援パーソナルApp',
            'maternity-support-componentized': '出産支援パーソナルApp（コンポーネント化版）',
            'care-support-componentized': '介護支援パーソナルApp（コンポーネント化版）',
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
        const conceptName = fixedConcepts[serviceId]?.[conceptId] || conceptId;
        setConcept({
          id: '',
          name: conceptName,
          description: '',
          conceptId: conceptId,
          serviceId: serviceId,
          keyVisualUrl: '',
          keyVisualHeight: 56.25,
        });
      }
    } catch (error) {
      console.error('読み込みエラー:', error);
      // エラー時も固定の名前を使用
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
      const conceptName = fixedConcepts[serviceId]?.[conceptId] || conceptId;
      setConcept({
        id: '',
        name: conceptName,
        description: '',
        conceptId: conceptId,
        serviceId: serviceId,
        keyVisualUrl: '',
        keyVisualHeight: 56.25,
      });
    } finally {
      setLoading(false);
    }
  }, [serviceId, conceptId]);

  // 認証状態を監視
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthReady(true);
      if (user && serviceId && conceptId) {
        loadConcept();
      } else if (!user) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [serviceId, conceptId, loadConcept]);

  // 認証が完了し、serviceId/conceptIdが変更されたときにデータを読み込む
  useEffect(() => {
    if (authReady && auth?.currentUser && serviceId && conceptId) {
      loadConcept();
    }
  }, [authReady, serviceId, conceptId, loadConcept]);

  // コンポーネント化されたページの場合は、ComponentizedPageProviderでラップ
  const content = (
    <ConceptContext.Provider value={{ concept, loading, reloadConcept: loadConcept }}>
      <ConceptLayoutContent
        serviceId={serviceId}
        conceptId={conceptId}
        concept={concept}
      >
        {children}
      </ConceptLayoutContent>
    </ConceptContext.Provider>
  );

  if (isComponentizedPage) {
    return (
      <PresentationModeProvider>
        <ComponentizedPageProvider>
          {content}
        </ComponentizedPageProvider>
      </PresentationModeProvider>
    );
  }

  return (
    <PresentationModeProvider>
      {content}
    </PresentationModeProvider>
  );
}

function ContainerVisibilityProvider({ children, showContainers, setShowContainers }: { 
  children: React.ReactNode; 
  showContainers: boolean;
  setShowContainers: (show: boolean) => void;
}) {
  return (
    <ContainerVisibilityContext.Provider value={{ showContainers, setShowContainers }}>
      {children}
    </ContainerVisibilityContext.Provider>
  );
}

function ConceptLayoutContent({
  serviceId,
  conceptId,
  concept,
  children,
}: {
  serviceId: string;
  conceptId: string;
  concept: ConceptData | null;
  children: React.ReactNode;
}) {
  const { isPresentationMode, enterPresentationMode, exitPresentationMode } = usePresentationMode();
  const pathname = usePathname();
  const router = useRouter();
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [showSlideThumbnails, setShowSlideThumbnails] = useState(false);
  const [showStartGuide, setShowStartGuide] = useState(false);
  const [showTableOfContents, setShowTableOfContents] = useState(true); // デフォルトで表示
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const presentationContainerRef = useRef<HTMLDivElement>(null);
  const [showContainers, setShowContainers] = useState(false); // コンテナの表示・非表示状態（デフォルトでfalse）
  const [isExportingPDF, setIsExportingPDF] = useState(false); // PDF出力中の状態
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [showKeyVisualMetadataEditor, setShowKeyVisualMetadataEditor] = useState(false);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [keyVisualMetadata, setKeyVisualMetadata] = useState<{
    title: string;
    signature: string;
    date: string;
    position: { x: number; y: number; align: 'left' | 'center' | 'right' };
  } | null>(null);
  const [pendingPDFExport, setPendingPDFExport] = useState(false);
  const [currentPageDimensions, setCurrentPageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [contentAspectRatio, setContentAspectRatio] = useState<number | null>(null);

  // コンポーネント化されたページの場合のコンテキスト
  let componentizedPageContext: ReturnType<typeof useComponentizedPage> | null = null;
  try {
    if ((serviceId === 'component-test' && conceptId === 'test-concept') ||
        conceptId.includes('-componentized')) {
      componentizedPageContext = useComponentizedPage();
    }
  } catch (e) {
    // ComponentizedPageProviderでラップされていない場合は無視
  }

  // 現在のサブメニュー項目を判定
  const getCurrentSubMenu = () => {
    const pathSegments = pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment === conceptId) {
      return 'overview'; // デフォルトは概要・コンセプト
    }
    return SUB_MENU_ITEMS.find(item => item.path === lastSegment)?.id || 'overview';
  };

  const currentSubMenu = getCurrentSubMenu();
  const currentSlideIndex = SUB_MENU_ITEMS.findIndex(item => item.id === currentSubMenu);
  const totalSlides = SUB_MENU_ITEMS.length;
  const serviceName = SERVICE_NAMES[serviceId] || '事業企画';

  // コンポーネント化されたページの場合の判定
  const isComponentizedPage = 
    ((serviceId === 'component-test' && conceptId === 'test-concept') ||
     conceptId.includes('-componentized')) &&
    currentSubMenu === 'overview';
  
  // コンポーネント化されたページの場合、コンポーネントページの情報を使用
  const componentizedCurrentPage = componentizedPageContext?.currentPageIndex ?? 0;
  const componentizedTotalPages = componentizedPageContext?.totalPages ?? 1;

  // スライドが変更されたときにページをリセット
  useEffect(() => {
    setCurrentPage(0);
    setTotalPages(1);
  }, [currentSubMenu]);

  // ページ数を計算（高さベースの自動ページネーション）
  useEffect(() => {
    if (!isPresentationMode || !contentRef.current) {
      setTotalPages(1);
      // プレゼンテーションモードでない場合は、すべての要素を表示
      if (contentRef.current) {
        const allChildren = Array.from(contentRef.current.children) as HTMLElement[];
        allChildren.forEach(child => {
          child.style.display = '';
          child.style.visibility = 'visible';
        });
      }
      return;
    }
    
    const calculatePages = () => {
      const container = contentRef.current;
      if (!container) {
        setTotalPages(1);
        return;
      }
      
      // すべての要素を表示（スクロール方式なので非表示にしない）
      const allChildren = Array.from(container.children) as HTMLElement[];
      allChildren.forEach(child => {
        child.style.display = '';
        child.style.visibility = 'visible';
      });
      
      // 高さベースの自動ページネーション
      const viewportHeight = window.innerHeight;
      const headerHeight = 80;
      const footerHeight = 60;
      const padding = 80;
      const pageHeight = viewportHeight - headerHeight - footerHeight - padding;
      const contentHeight = container.scrollHeight;
      const pages = Math.max(1, Math.ceil(contentHeight / pageHeight));
      setTotalPages(pages);
    };
    
    // 初回計算（少し遅延させてDOMが完全にレンダリングされるのを待つ）
    const timeoutId = setTimeout(calculatePages, 300);
    
    // リサイズ時にも再計算
    const handleResize = () => {
      clearTimeout(timeoutId);
      setTimeout(calculatePages, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // コンテンツの変更を監視（MutationObserver）
    const observer = new MutationObserver(() => {
      clearTimeout(timeoutId);
      setTimeout(calculatePages, 100);
    });
    
    if (contentRef.current) {
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'id'],
      });
    }
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [isPresentationMode, currentSubMenu]);

  // ページ数が変更されたときに現在のページを調整
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, currentPage]);

  // コンテンツのアスペクト比を検出（プレゼンテーションモード時）
  useEffect(() => {
    if (!isPresentationMode || !contentRef.current) {
      setContentAspectRatio(null);
      return;
    }

    const calculateAspectRatio = () => {
      const container = contentRef.current;
      if (!container) {
        setContentAspectRatio(null);
        return;
      }

      // コンテンツの実際のサイズを測定
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width > 0 && height > 0) {
        const aspectRatio = width / height;
        setContentAspectRatio(aspectRatio);
      }
    };

    // 初回計算
    calculateAspectRatio();

    // リサイズ時にも再計算
    const resizeObserver = new ResizeObserver(() => {
      calculateAspectRatio();
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    // ウィンドウリサイズ時にも再計算
    window.addEventListener('resize', calculateAspectRatio);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateAspectRatio);
    };
  }, [isPresentationMode, currentSubMenu, currentPage]);

  // ページ変更時にスクロール位置を更新（自動ページネーション）
  useEffect(() => {
    if (!isPresentationMode || !contentRef.current) return;
    
    const container = contentRef.current;
    
    // すべての要素を表示（スクロール方式なので非表示にしない）
    const allChildren = Array.from(container.children) as HTMLElement[];
    allChildren.forEach(child => {
      child.style.display = '';
      child.style.visibility = 'visible';
    });
    
    // 高さベースの自動ページネーション
    const viewportHeight = window.innerHeight;
    const headerHeight = 80;
    const footerHeight = 60;
    const padding = 80;
    const pageHeight = viewportHeight - headerHeight - footerHeight - padding;
    
    if (totalPages > 1) {
      // コンテナをスクロール可能にする
      container.style.overflowY = 'auto';
      container.style.height = '100%';
      
      const scrollOffset = currentPage * pageHeight;
      
      // レイアウトが安定するまで待ってからスクロール
      setTimeout(() => {
        requestAnimationFrame(() => {
          container.scrollTo({
            top: scrollOffset,
            behavior: 'smooth',
          });
        });
      }, 100);
    } else {
      // 1ページのみの場合は先頭にスクロール
      container.style.overflowY = 'auto';
      container.style.height = '100%';
      container.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [currentPage, totalPages, isPresentationMode]);

  // プレゼンテーションモード開始時にガイドを表示
  useEffect(() => {
    if (isPresentationMode && !localStorage.getItem('presentationGuideShown')) {
      setShowStartGuide(true);
      localStorage.setItem('presentationGuideShown', 'true');
    }
  }, [isPresentationMode]);

  // 前のスライドに移動
  const goToPreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setSlideDirection('right');
      const previousItem = SUB_MENU_ITEMS[currentSlideIndex - 1];
      router.push(`/business-plan/services/${serviceId}/${conceptId}/${previousItem.path}`);
      setTimeout(() => setSlideDirection(null), 500);
    }
  }, [currentSlideIndex, serviceId, conceptId, router]);

  // 次のスライドに移動
  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < totalSlides - 1) {
      setSlideDirection('left');
      const nextItem = SUB_MENU_ITEMS[currentSlideIndex + 1];
      router.push(`/business-plan/services/${serviceId}/${conceptId}/${nextItem.path}`);
      setTimeout(() => setSlideDirection(null), 500);
    }
  }, [currentSlideIndex, totalSlides, serviceId, conceptId, router]);

  // 特定のスライドに移動
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      const item = SUB_MENU_ITEMS[index];
      router.push(`/business-plan/services/${serviceId}/${conceptId}/${item.path}`);
      setShowSlideThumbnails(false);
    }
  }, [totalSlides, serviceId, conceptId, router]);

  // 前のページに移動
  const goToPreviousPage = useCallback(() => {
    // コンポーネント化されたページの場合は、コンポーネントページのナビゲーションを使用
    if (isComponentizedPage && componentizedPageContext) {
      componentizedPageContext.goToPreviousPage();
      return;
    }
    
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    } else if (currentSlideIndex > 0) {
      // 最初のページで、前のスライドがある場合は前のスライドの最後のページに移動
      const previousItem = SUB_MENU_ITEMS[currentSlideIndex - 1];
      router.push(`/business-plan/services/${serviceId}/${conceptId}/${previousItem.path}`);
    }
  }, [currentPage, currentSlideIndex, serviceId, conceptId, router, isComponentizedPage, componentizedPageContext]);

  // 次のページに移動
  const goToNextPage = useCallback(() => {
    // コンポーネント化されたページの場合は、コンポーネントページのナビゲーションを使用
    if (isComponentizedPage && componentizedPageContext) {
      componentizedPageContext.goToNextPage();
      return;
    }
    
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    } else if (currentSlideIndex < totalSlides - 1) {
      // 最後のページで、次のスライドがある場合は次のスライドの最初のページに移動
      setCurrentPage(0);
      const nextItem = SUB_MENU_ITEMS[currentSlideIndex + 1];
      router.push(`/business-plan/services/${serviceId}/${conceptId}/${nextItem.path}`, { scroll: false });
    }
  }, [currentPage, totalPages, currentSlideIndex, totalSlides, serviceId, conceptId, router, isComponentizedPage, componentizedPageContext]);

  // プレゼンテーションモード時のキーボードナビゲーション
  useEffect(() => {
    if (!isPresentationMode) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showSlideThumbnails || showStartGuide) {
        // サムネイルやガイド表示中は通常のナビゲーションを無効化
        if (event.key === 'Escape') {
          event.preventDefault();
          if (showSlideThumbnails) {
            setShowSlideThumbnails(false);
          }
          if (showStartGuide) {
            setShowStartGuide(false);
          }
        }
        return;
      }
      
      if (showTableOfContents) {
        // 目次表示中はESCキーで閉じる（ただし、他のキーは通常通り動作）
        if (event.key === 'Escape') {
          event.preventDefault();
          setShowTableOfContents(false);
          return;
        }
        // ESC以外のキーは通常通り処理（目次を閉じない）
      }
      
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPreviousPage();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNextPage();
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        goToPreviousPage();
      } else if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault();
        goToNextPage();
      } else if (event.key === 't' || event.key === 'T') {
        // Tキーでサムネイル表示を切り替え
        event.preventDefault();
        setShowSlideThumbnails(prev => !prev);
      } else if (event.key === 'm' || event.key === 'M') {
        // Mキーで目次表示を切り替え
        event.preventDefault();
        setShowTableOfContents(prev => !prev);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        exitPresentationMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPresentationMode, goToPreviousPage, goToNextPage, showSlideThumbnails, showStartGuide, showTableOfContents, exitPresentationMode]);

  // PDF出力機能
  const handleExportToPDF = useCallback(async () => {
    if (!showContainers) {
      alert('コンテナ表示モードでPDF出力してください。');
      return;
    }

    if (!contentContainerRef.current) {
      alert('コンテンツが見つかりません。');
      return;
    }

    setIsExportingPDF(true); // 処理開始

    try {
      // html2canvasとjsPDFを動的にインポート
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      // コンテナで囲まれた要素を取得
      const container = contentContainerRef.current;
      if (!container) {
        alert('コンテナが見つかりません。');
        return;
      }

      // コンテナ内のすべてのコンテナ要素を取得（data-page-container属性を持つ要素）
      let containers = Array.from(container.querySelectorAll('[data-page-container]')) as HTMLElement[];
      
      // data-page-container属性がない場合は、border: 2px dashed が含まれる要素を検索
      if (containers.length === 0) {
        containers = Array.from(container.querySelectorAll('*')).filter((el: Element) => {
          const htmlEl = el as HTMLElement;
          const style = window.getComputedStyle(htmlEl);
          const inlineStyle = htmlEl.style.border || '';
          return style.border.includes('dashed') || inlineStyle.includes('dashed');
        }) as HTMLElement[];
      }
      
      if (containers.length === 0) {
        alert('コンテナが見つかりません。コンテナ表示モードでPDF出力してください。');
        return;
      }

      console.log('PDF出力対象のコンテナ数:', containers.length);

      // PDFインスタンスをletで宣言
      let pdf: any = new jsPDF({
        unit: 'mm',
        format: [254, 143], // 初期値は横長
        orientation: 'landscape'
      });

      // 各コンテナを画像化してPDFに追加
      for (let i = 0; i < containers.length; i++) {
        const containerEl = containers[i];
        
        // キービジュアルコンテナかどうかを判定（data-page-container="0" かつ img要素が存在する）
        const pageContainerAttr = containerEl.getAttribute('data-page-container');
        const hasImage = containerEl.querySelector('img') !== null;
        const isKeyVisual = pageContainerAttr === '0' && hasImage;
        
        // 元のborderスタイルを保存
        const originalBorder = containerEl.style.border;
        
        // PDF出力時は点線を非表示にする
        containerEl.style.border = 'none';
        
        // コンテナのサイズを取得（レイアウトの再計算を待つ）
        await new Promise(resolve => setTimeout(resolve, 50));
        const containerWidth = containerEl.scrollWidth;
        const containerHeight = containerEl.scrollHeight;
        const containerAspectRatio = containerWidth / containerHeight;
        const isPortrait = containerHeight > containerWidth; // 縦長かどうか
        
        // ページサイズと向きを決定
        let pageWidth: number;
        let pageHeight: number;
        let orientation: 'landscape' | 'portrait';
        
        if (isPortrait) {
          // 縦長の場合は縦向き（portrait）
          pageHeight = 297; // A4縦の高さ
          pageWidth = pageHeight * containerAspectRatio; // コンテナのアスペクト比を維持
          orientation = 'portrait';
        } else {
          // 横長の場合は横向き（landscape）
          pageWidth = 254; // 25.4cm
          pageHeight = 143; // 14.29cm
          orientation = 'landscape';
        }
        
        const margin = 10;
        const contentWidth = pageWidth - (margin * 2);
        const contentHeight = pageHeight - (margin * 2);
        
        // 新しいページを追加（最初のページ以外）
        if (i > 0) {
          pdf.addPage([pageWidth, pageHeight], orientation);
        } else {
          // 最初のページの場合は、向きに応じてPDFインスタンスを作り直す
          if (isPortrait) {
            pdf = new jsPDF({
              unit: 'mm',
              format: [pageWidth, pageHeight],
              orientation: 'portrait'
            });
          } else {
            pdf = new jsPDF({
              unit: 'mm',
              format: [pageWidth, pageHeight],
              orientation: 'landscape'
            });
          }
        }

        // キービジュアルの場合は、画像要素を直接取得してアスペクト比を計算
        // また、PDF出力時に不要なボタンを非表示にする
        let targetAspectRatio: number | null = null;
        const hiddenElements: Array<{ element: HTMLElement; originalDisplay: string }> = [];
        
        if (isKeyVisual) {
          // サイズ調整ボタンと画像変更ボタンを非表示にする
          const buttons = containerEl.querySelectorAll('button');
          buttons.forEach((button) => {
            const buttonEl = button as HTMLElement;
            const originalDisplay = buttonEl.style.display || window.getComputedStyle(buttonEl).display;
            hiddenElements.push({ element: buttonEl, originalDisplay });
            buttonEl.style.display = 'none';
          });
          
          // サイズ調整コントロールパネルも非表示にする
          const controlPanel = containerEl.querySelector('[style*="backgroundColor"][style*="rgba(0, 0, 0, 0.8)"]') as HTMLElement;
          if (controlPanel) {
            const originalDisplay = controlPanel.style.display || window.getComputedStyle(controlPanel).display;
            hiddenElements.push({ element: controlPanel, originalDisplay });
            controlPanel.style.display = 'none';
          }
          
          // メタデータ（タイトル、署名、作成日）を非表示にする（PDFに直接追加するため）
          const metadataElement = containerEl.querySelector('[data-key-visual-metadata="true"]') as HTMLElement;
          if (metadataElement) {
            const originalDisplay = metadataElement.style.display || window.getComputedStyle(metadataElement).display;
            hiddenElements.push({ element: metadataElement, originalDisplay });
            metadataElement.style.display = 'none';
          }
          
          const imgElement = containerEl.querySelector('img') as HTMLImageElement;
          if (imgElement && imgElement.complete) {
            // 画像の実際のアスペクト比を取得
            targetAspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
          } else if (imgElement) {
            // 画像がまだ読み込まれていない場合は、読み込みを待つ
            await new Promise((resolve) => {
              if (imgElement.complete) {
                resolve(null);
              } else {
                imgElement.onload = () => resolve(null);
                imgElement.onerror = () => resolve(null);
                // タイムアウト（5秒）
                setTimeout(() => resolve(null), 5000);
              }
            });
            if (imgElement.complete && imgElement.naturalWidth > 0) {
              targetAspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
            }
          }
          
          // 画像のアスペクト比が取得できない場合は、paddingTopから計算
          if (!targetAspectRatio) {
            const paddingTopElement = containerEl.querySelector('[style*="padding-top"]') as HTMLElement;
            if (paddingTopElement) {
              const paddingTopStyle = window.getComputedStyle(paddingTopElement).paddingTop;
              const paddingTopPercent = parseFloat(paddingTopStyle);
              if (!isNaN(paddingTopPercent)) {
                // paddingTopのパーセンテージからアスペクト比を計算
                // paddingTop: 56.25% = 16:9のアスペクト比
                targetAspectRatio = 100 / paddingTopPercent;
              }
            }
          }
        }

        // SVG要素のレンダリングを待つための遅延を追加
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // SVG要素の位置調整用の情報を事前に取得
        const svgAdjustments: Array<{
          svg: SVGSVGElement;
          parent: HTMLElement;
          originalParentPaddingTop: string;
          originalSvgMarginTop: string;
        }> = [];
        
        const svgElements = containerEl.querySelectorAll('svg');
        svgElements.forEach((svg) => {
          const svgEl = svg as SVGSVGElement;
          const computedStyle = window.getComputedStyle(svgEl);
          const marginTop = computedStyle.marginTop;
          
          // 負のマージンがある場合のみ処理対象とする
          if (marginTop.includes('-')) {
            const parent = svgEl.parentElement;
            if (parent) {
              const parentStyle = window.getComputedStyle(parent);
              const paddingTop = parseFloat(parentStyle.paddingTop) || 0;
              const marginTopValue = parseFloat(marginTop) || 0;
              
              // 親要素のpaddingTopとSVGのmarginTopを調整
              if (paddingTop > 0 && marginTopValue < 0) {
                svgAdjustments.push({
                  svg: svgEl,
                  parent: parent as HTMLElement,
                  originalParentPaddingTop: parentStyle.paddingTop,
                  originalSvgMarginTop: marginTop,
                });
                
                // 一時的に調整（PDF出力後に復元する）
                (parent as HTMLElement).style.paddingTop = `${paddingTop + marginTopValue}px`;
                (svgEl as HTMLElement).style.marginTop = '0';
              }
            }
          }
        });
        
        // フォントの読み込みを待つ
        await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // コンテナを画像化
        const canvas = await html2canvas(containerEl, {
          scale: 3, // 解像度を上げる
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: containerEl.scrollWidth,
          height: containerEl.scrollHeight,
          letterRendering: true, // 文字単位でのレンダリングを有効化
          onclone: (clonedDoc, clonedWindow) => {
            try {
              // クローンされたドキュメント内のフォントを確実に適用
              const clonedContainer = clonedDoc.querySelector('[data-page-container]') as HTMLElement;
              if (clonedContainer) {
                // 元の要素からスタイルを取得（clonedWindowは信頼できないため、常に元のwindowを使用）
                try {
                  const originalElement = containerEl.querySelector('[data-page-container]') as HTMLElement;
                  if (originalElement) {
                    const computedStyle = window.getComputedStyle(originalElement);
                    clonedContainer.style.fontFamily = computedStyle.fontFamily;
                    clonedContainer.style.fontFeatureSettings = 'normal';
                    clonedContainer.style.fontVariantLigatures = 'normal';
                    clonedContainer.style.letterSpacing = 'normal';
                    clonedContainer.style.wordSpacing = 'normal';
                    clonedContainer.style.textRendering = 'optimizeLegibility';
                    clonedContainer.style.webkitFontSmoothing = 'antialiased';
                    clonedContainer.style.mozOsxFontSmoothing = 'grayscale';
                  }
                } catch (e) {
                  // エラーが発生した場合は無視
                }
              }
              
              // グラデーションテキストをSVGに変換
              const gradientTextElements = clonedDoc.querySelectorAll('.key-message-title, .gradient-text-blue');
              gradientTextElements.forEach((element) => {
                try {
                  const htmlElement = element as HTMLElement;
                  const text = htmlElement.textContent || '';
                  
                  // 元の要素からスタイルを取得（clonedWindowは信頼できないため、常に元のwindowを使用）
                  let computedStyle: CSSStyleDeclaration | null = null;
                  try {
                    // クラス名で元の要素を検索
                    const classNames = Array.from(htmlElement.classList);
                    if (classNames.length > 0) {
                      const originalElement = containerEl.querySelector(`.${classNames.join('.')}`) as HTMLElement;
                      if (originalElement) {
                        computedStyle = window.getComputedStyle(originalElement);
                      }
                    }
                  } catch (e) {
                    // エラーが発生した場合は無視
                  }
                  
                  // フォールバック: デフォルト値を使用
                  if (!computedStyle) {
                    computedStyle = {
                      fontSize: '32px',
                      fontWeight: '700',
                      lineHeight: '1.3',
                      letterSpacing: '-0.5px',
                      margin: '0 0 12px 0',
                      fontFamily: 'inherit',
                    } as CSSStyleDeclaration;
                  }
                  
                  const fontSize = computedStyle.fontSize || '32px';
                  const fontWeight = computedStyle.fontWeight || '700';
                  const lineHeight = computedStyle.lineHeight || '1.3';
                  const letterSpacing = computedStyle.letterSpacing || '-0.5px';
                  const margin = computedStyle.margin || '0 0 12px 0';
                  
                  // 元の要素の実際のサイズを取得
                  const originalWidth = htmlElement.offsetWidth || htmlElement.scrollWidth || 800;
                  const originalHeight = htmlElement.offsetHeight || htmlElement.scrollHeight || 50;
                  
                  // 親要素のスタイルを取得
                  const parent = htmlElement.parentElement;
                  let textAlign = 'center';
                  if (parent) {
                    try {
                      const parentComputedStyle = window.getComputedStyle(parent);
                      textAlign = parentComputedStyle.textAlign || 'center';
                    } catch (e) {
                      // エラーが発生した場合はデフォルト値を使用
                    }
                  }
              
              // SVG要素を作成
              const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
              svg.style.display = 'block';
              svg.style.margin = margin;
              svg.style.textAlign = textAlign;
              svg.style.width = originalWidth > 0 ? `${originalWidth}px` : '100%';
              svg.style.height = originalHeight > 0 ? `${originalHeight}px` : 'auto';
              svg.style.verticalAlign = 'top';
              
              // フォントサイズを数値に変換
              const fontSizeNum = parseFloat(fontSize);
              const lineHeightNum = parseFloat(lineHeight);
              
              // viewBoxのサイズを元の要素のサイズに合わせる
              const svgWidth = originalWidth > 0 ? originalWidth : 800; // デフォルト幅
              const svgHeight = originalHeight > 0 ? originalHeight : fontSizeNum * lineHeightNum;
              
              svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
              svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
              
              // グラデーション定義
              const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
              const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
              gradient.setAttribute('id', `gradient-${Math.random().toString(36).substr(2, 9)}`);
              gradient.setAttribute('x1', '0%');
              gradient.setAttribute('y1', '0%');
              gradient.setAttribute('x2', '100%');
              gradient.setAttribute('y2', '0%');
              
              const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              stop1.setAttribute('offset', '0%');
              stop1.setAttribute('stop-color', '#0066CC');
              gradient.appendChild(stop1);
              
              const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              stop2.setAttribute('offset', '100%');
              stop2.setAttribute('stop-color', '#00BFFF');
              gradient.appendChild(stop2);
              
              defs.appendChild(gradient);
              svg.appendChild(defs);
              
              // テキスト要素
              const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              textElement.setAttribute('x', svgWidth / 2);
              textElement.setAttribute('y', svgHeight / 2);
              textElement.setAttribute('text-anchor', 'middle');
              textElement.setAttribute('dominant-baseline', 'middle');
              textElement.setAttribute('font-size', fontSize);
              textElement.setAttribute('font-weight', fontWeight);
              textElement.setAttribute('font-family', computedStyle.fontFamily);
              textElement.setAttribute('letter-spacing', letterSpacing);
              textElement.setAttribute('fill', `url(#${gradient.getAttribute('id')})`);
              textElement.textContent = text;
              svg.appendChild(textElement);
              
                  // 元の要素をSVGに置き換え
                  if (htmlElement.parentNode) {
                    htmlElement.parentNode.replaceChild(svg, htmlElement);
                  }
                } catch (error) {
                  console.warn('グラデーションテキストのSVG変換エラー:', error);
                  // エラーが発生しても処理を続行
                }
              });
            } catch (error) {
              console.warn('onclone処理エラー:', error);
              // エラーが発生しても処理を続行
            }
          },
          allowTaint: true,
          foreignObjectRendering: false,
        });
        
        // SVGの位置調整を元に戻す
        svgAdjustments.forEach(({ svg, parent, originalParentPaddingTop, originalSvgMarginTop }) => {
          parent.style.paddingTop = originalParentPaddingTop;
          (svg as HTMLElement).style.marginTop = originalSvgMarginTop;
        });
        
        // 元のborderスタイルを復元
        containerEl.style.border = originalBorder;

        if (isKeyVisual) {
          hiddenElements.forEach(({ element, originalDisplay }) => {
            element.style.display = originalDisplay;
          });
        }

        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // 1ページ目（キービジュアル）の場合のみ画像の実際のアスペクト比を使用
        // それ以外の場合は、キャンバスの実際のアスペクト比を使用（コンテナ全体のサイズに基づく）
        let aspectRatioToUse: number;
        // 1ページ目かつtargetAspectRatioが正しく取得できている場合のみ画像のアスペクト比を使用
        if (i === 0 && targetAspectRatio !== null && targetAspectRatio > 0 && isFinite(targetAspectRatio)) {
          aspectRatioToUse = targetAspectRatio;
        } else {
          // キャンバスの実際のアスペクト比を使用（コンテナ全体のサイズに基づく）
          aspectRatioToUse = canvas.width / canvas.height;
        }
        
        let finalWidth = contentWidth;
        let finalHeight = contentWidth / aspectRatioToUse;
        
        if (finalHeight > contentHeight) {
          finalHeight = contentHeight;
          finalWidth = contentHeight * aspectRatioToUse;
        }
        
        const xOffset = (contentWidth - finalWidth) / 2;
        const yOffset = 0; // 上揃え

        pdf.addImage(imgData, 'PNG', margin + xOffset, margin + yOffset, finalWidth, finalHeight);
        
        // ロゴをPDFページの右上に追加
        // 概要・コンセプトの場合は2ページ目以降、それ以外は1ページ目から表示
        // ページコンポーネントに依存せず、PDFページに直接追加
        if ((currentSubMenu === 'overview' ? i > 0 : i >= 0) && concept?.keyVisualLogoUrl) {
          try {
            // fetch APIを使って画像を取得し、Base64に変換
            const response = await fetch(concept.keyVisualLogoUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            const logoBase64 = await new Promise<string>((resolve, reject) => {
              reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                  resolve(reader.result);
                } else {
                  reject(new Error('Failed to convert image to base64'));
                }
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });

            // 画像のサイズを取得してアスペクト比を計算
            const img = new Image();
            const logoImageData = await new Promise<{ width: number; height: number }>((resolve, reject) => {
              img.onload = () => {
                resolve({ width: img.width, height: img.height });
              };
              img.onerror = reject;
              img.src = concept.keyVisualLogoUrl;
            });

            const logoAspectRatio = logoImageData.width / logoImageData.height;
            const logoMargin = 5; // ロゴのマージン（mm）
            const logoHeight = 15; // ロゴの高さ（mm）- 基準サイズ
            const logoWidth = logoHeight * logoAspectRatio; // アスペクト比を維持して幅を計算
            
            // 右上の位置を計算（ページサイズからマージンとロゴサイズを引く）
            const logoX = pageWidth - logoMargin - logoWidth;
            const logoY = logoMargin;
            
            // 画像の形式を自動検出（Base64データURLから取得）
            const imageFormat = logoBase64.split(';')[0].split('/')[1].toUpperCase();
            
            // ロゴ画像をPDFページに直接追加（アスペクト比を維持）
            pdf.addImage(logoBase64, imageFormat, logoX, logoY, logoWidth, logoHeight);
          } catch (error) {
            console.error('ロゴの追加エラー:', error);
            // エラーが発生してもPDF生成を続行
          }
        }
        
        // ページ番号をPDFページの右下に追加
        const pageNumber = i + 1;
        const formattedPageNumber = `p.${String(pageNumber).padStart(2, '0')}`;
        const pageNumberMargin = 2; // ページ番号のマージン（mm）- 下の枠ギリギリに近づける
        const fontSize = 6; // フォントサイズ（pt）
        
        // 右下の位置を計算（ページサイズからマージンを引く）
        const pageNumberX = pageWidth - pageNumberMargin;
        const pageNumberY = pageHeight - pageNumberMargin;
        
        // テキストの配置を右下に設定
        pdf.setFontSize(fontSize);
        pdf.setTextColor(128, 128, 128); // グレー色
        pdf.text(formattedPageNumber, pageNumberX, pageNumberY, {
          align: 'right',
          baseline: 'bottom'
        });
        
        // コピーライトテキストを1ページ目以外のページの下部中央に追加
        if (i > 0) {
          const copyrightText = 'AI assistant company, Inc - All Rights Reserved';
          const copyrightY = pageHeight - pageNumberMargin; // ページ番号と同じ高さ
          const copyrightX = pageWidth / 2; // 中央
          
          pdf.setFontSize(fontSize);
          pdf.setTextColor(128, 128, 128); // グレー色
          pdf.text(copyrightText, copyrightX, copyrightY, {
            align: 'center',
            baseline: 'bottom'
          });
        }
        
        // キービジュアル（1ページ目）にタイトル、署名、作成日を独立して追加
        // ページコンポーネントの画像とは独立して、PDFページに直接追加
        // ページ番号と同じように、画像に引きづられずにPDFページに直接描画
        if (i === 0 && isKeyVisual) {
          // conceptからメタデータを取得
          const metadata = concept?.keyVisualMetadata;
          if (metadata && (metadata.title || metadata.signature || metadata.date)) {
            pdf.setTextColor(128, 128, 128); // グレー色
            
            // ページの座標系（mm単位）で直接指定（画像のサイズや位置に依存しない）
            const textX = metadata.position.x;
            const textY = metadata.position.y;
            const align = metadata.position.align;
            
            let currentY = textY;
            
            // タイトルを追加
            if (metadata.title) {
              const titleFontSize = metadata.titleFontSize || 6;
              pdf.setFontSize(titleFontSize);
              pdf.text(metadata.title, textX, currentY, {
                align: align,
                baseline: 'bottom'
              });
              currentY -= titleFontSize * 0.7; // フォントサイズの70%を行間とする
            }
            
            // 署名を追加
            if (metadata.signature) {
              const signatureFontSize = metadata.signatureFontSize || 6;
              pdf.setFontSize(signatureFontSize);
              pdf.text(metadata.signature, textX, currentY, {
                align: align,
                baseline: 'bottom'
              });
              currentY -= signatureFontSize * 0.7; // フォントサイズの70%を行間とする
            }
            
            // 作成日を追加
            if (metadata.date) {
              const dateFontSize = metadata.dateFontSize || 6;
              pdf.setFontSize(dateFontSize);
              pdf.text(metadata.date, textX, currentY, {
                align: align,
                baseline: 'bottom'
              });
            }
          }
        }
      }

      const conceptName = concept?.name || conceptId;
      pdf.save(`${conceptName}_${currentSubMenu}_${new Date().toISOString().split('T')[0]}.pdf`);
      console.log('PDF生成が完了しました');
    } catch (error) {
      console.error('PDF出力エラー:', error);
      alert(`PDF出力に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExportingPDF(false); // 処理終了
      setPendingPDFExport(false);
      // keyVisualMetadataはクリアしない（Firestoreに保存されているので維持される）
    }
  }, [showContainers, concept, conceptId, currentSubMenu]);

  // モーダルで保存された後にPDF出力を続行（現在は使用されていない）
  const handleMetadataSave = useCallback(async (metadata: {
    title: string;
    signature: string;
    date: string;
    position: { x: number; y: number; align: 'left' | 'center' | 'right' };
    titleFontSize?: number;
    signatureFontSize?: number;
    dateFontSize?: number;
  }) => {
    // Firestoreに保存（Page0.tsxで既に保存されている）
    // conceptが更新されるまで待つ必要がある
    setShowKeyVisualMetadataEditor(false);
    setPendingPDFExport(false);
    
    // 状態更新を待ってからPDF出力を実行
    // Firestoreの更新が反映されるまで少し待つ
    setTimeout(async () => {
      await handleExportToPDF();
    }, 500);
  }, [handleExportToPDF]);

  return (
    <Layout>
      {/* p5.jsとMermaidを一度だけ読み込む */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && window.p5) {
            window.dispatchEvent(new Event('p5loaded'));
          }
        }}
        onReady={() => {
          // 既に読み込まれている場合もイベントを発火
          if (typeof window !== 'undefined' && window.p5) {
            window.dispatchEvent(new Event('p5loaded'));
          }
        }}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && window.mermaid) {
            // 初期化を確実に実行
            window.mermaid.initialize({ 
              startOnLoad: false,
              theme: 'default',
              securityLevel: 'loose',
              fontFamily: 'inherit',
              htmlLabels: true
            });
            window.dispatchEvent(new Event('mermaidloaded'));
          }
        }}
        onReady={() => {
          // 既に読み込まれている場合も初期化とイベントを発火
          if (typeof window !== 'undefined' && window.mermaid) {
            window.mermaid.initialize({ 
              startOnLoad: false,
              theme: 'default',
              securityLevel: 'loose',
              fontFamily: 'inherit',
              htmlLabels: true
            });
            window.dispatchEvent(new Event('mermaidloaded'));
          }
        }}
      />
      {!isPresentationMode && (
        <div style={{ display: 'flex', gap: '32px' }}>
          <ConceptSubMenu serviceId={serviceId} conceptId={conceptId} currentSubMenuId={currentSubMenu} />
          <div style={{ 
            flex: 1, 
            minWidth: 0,
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '40px',
            marginTop: '0',
            marginBottom: '40px',
          }}>
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => router.push(`/business-plan/services/${serviceId}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginBottom: '16px',
                  padding: 0,
                }}
              >
                ← {serviceName}に戻る
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ marginBottom: '4px' }}>{concept?.name || conceptId}</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {showContainers && (
                    <button
                      onClick={handleExportToPDF}
                      disabled={isExportingPDF}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: isExportingPDF ? '#94A3B8' : '#10B981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isExportingPDF ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        opacity: isExportingPDF ? 0.7 : 1,
                      }}
                    >
                      {isExportingPDF ? '処理中...' : 'PDF出力'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowContainers(!showContainers)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: showContainers ? '#10B981' : '#6B7280',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                  >
                    {showContainers ? 'コンテナ非表示' : 'コンテナ表示'}
                  </button>
                  <button
                    onClick={enterPresentationMode}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    プレゼンテーションモード
                  </button>
                  {/* 固定ページからページコンポーネントへの移行ボタン（コンポーネント化されていない場合のみ表示） */}
                  {!isComponentizedPage && currentSubMenu === 'overview' && (
                    <button
                      onClick={() => setShowMigrateModal(true)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#8B5CF6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                      title="固定ページからページコンポーネントへ移行"
                    >
                      ページ移行
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* 移行モーダル */}
            {showMigrateModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '20px',
                overflowY: 'auto',
              }}
              onClick={() => setShowMigrateModal(false)}
              >
                <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '20px', marginBottom: '20px' }}>
                  <MigrateFromFixedPage
                    serviceId={serviceId}
                    conceptId={conceptId}
                    subMenuId={currentSubMenu}
                    onMigrated={(newConceptId) => {
                      // 移行後、コンポーネント化されたページに切り替える
                      // 追加モードの場合は新しいconceptId、上書きモードの場合は既存のconceptIdを使用
                      const componentizedConceptId = newConceptId || `${conceptId}-componentized`;
                      router.push(`/business-plan/services/${serviceId}/${componentizedConceptId}/overview`);
                    }}
                    onClose={() => setShowMigrateModal(false)}
                  />
                </div>
              </div>
            )}
            <ContainerVisibilityProvider showContainers={showContainers} setShowContainers={setShowContainers}>
              <div data-content-container ref={contentContainerRef}>
                {children}
              </div>
            </ContainerVisibilityProvider>
          </div>
        </div>
      )}
      {isPresentationMode && (
        <div
          ref={presentationContainerRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            overflow: 'auto',
            cursor: 'none',
          }}
          onMouseMove={(e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
          }}
        >
          {/* レーザーポインター風ポインター */}
          <div
            style={{
              position: 'fixed',
              left: mousePosition.x - 5,
              top: mousePosition.y - 5,
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #ff3333 0%, #ff0000 50%, #ff3333 100%)',
              boxShadow: '0 0 5px #ff0000, 0 0 10px rgba(255, 0, 0, 0.8), 0 0 15px rgba(255, 0, 0, 0.4), inset 0 0 3px rgba(255, 255, 255, 0.5)',
              pointerEvents: 'none',
              zIndex: 10000,
              transition: 'none',
            }}
          />
          {/* 開始ガイド */}
          {showStartGuide && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                zIndex: 10001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => setShowStartGuide(false)}
            >
              <div
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '40px',
                  maxWidth: '600px',
                  textAlign: 'center',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-text)' }}>
                  プレゼンテーションモード
                </h3>
                <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                  <p style={{ fontSize: '14px', color: 'var(--color-text)', marginBottom: '12px', lineHeight: '1.8' }}>
                    <strong>操作方法:</strong>
                  </p>
                  <ul style={{ marginLeft: '20px', fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.8' }}>
                    <li>← → キー: 前後のページ/スライドに移動</li>
                    <li>↑ ↓ キー: 前後のページに移動（複数ページの場合）</li>
                    <li>M キー: 目次を表示/非表示</li>
                    <li>T キー: スライド一覧を表示/非表示</li>
                    <li>ESC キー: プレゼンテーションモードを終了</li>
                  </ul>
                </div>
                <button
                  onClick={() => setShowStartGuide(false)}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  開始する
                </button>
              </div>
            </div>
          )}
          
          {/* 目次（サブメニュー風） */}
          {showTableOfContents && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '280px',
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                zIndex: 10001,
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0 }}>
                  目次
                </h3>
                <button
                  onClick={() => setShowTableOfContents(false)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  閉じる (ESC)
                </button>
              </div>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '8px 0',
                }}
              >
                {SUB_MENU_ITEMS.map((item, index) => {
                  const isActive = index === currentSlideIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setCurrentPage(0);
                        goToSlide(index);
                      }}
                      style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        backgroundColor: isActive 
                          ? 'rgba(31, 41, 51, 0.5)' 
                          : 'transparent',
                        borderLeft: isActive 
                          ? '3px solid var(--color-primary)' 
                          : '3px solid transparent',
                        color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.8)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: isActive ? 600 : 400,
                          minWidth: '24px',
                          textAlign: 'center',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: isActive ? 600 : 400,
                          lineHeight: '1.4',
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* スライド一覧サムネイル */}
          {showSlideThumbnails && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                zIndex: 10001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                overflow: 'auto',
              }}
              onClick={() => setShowSlideThumbnails(false)}
            >
              <div
                style={{
                  maxWidth: '1200px',
                  width: '100%',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>
                    スライド一覧
                  </h3>
                  <button
                    onClick={() => setShowSlideThumbnails(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    閉じる (ESC)
                  </button>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {SUB_MENU_ITEMS.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => goToSlide(index)}
                      style={{
                        backgroundColor: index === currentSlideIndex ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)',
                        border: index === currentSlideIndex ? '2px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center',
                      }}
                      onMouseEnter={(e) => {
                        if (index !== currentSlideIndex) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (index !== currentSlideIndex) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }
                      }}
                    >
                      <div
                        style={{
                          fontSize: '32px',
                          fontWeight: 600,
                          color: '#fff',
                          marginBottom: '8px',
                        }}
                      >
                        {index + 1}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#fff',
                          lineHeight: '1.4',
                        }}
                      >
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* ヘッダー部分：終了ボタン、スライド番号、進捗バー */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: showTableOfContents ? '300px' : '20px',
              right: '20px',
              zIndex: 10002,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px',
              transition: 'left 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* スライドタイトル */}
              <span style={{ color: '#fff', fontSize: '24px', fontWeight: 600 }}>
                {isComponentizedPage ? `ページ ${componentizedCurrentPage + 1}` : SUB_MENU_ITEMS[currentSlideIndex]?.label}
              </span>
              {/* スライド番号とページ番号 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                  {isComponentizedPage 
                    ? `${componentizedCurrentPage + 1} / ${componentizedTotalPages}`
                    : `${currentSlideIndex + 1} / ${totalSlides}${totalPages > 1 ? ` (ページ ${currentPage + 1} / ${totalPages})` : ''}`}
                </span>
                <div
                  style={{
                    width: '200px',
                    height: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${isComponentizedPage 
                        ? ((componentizedCurrentPage + 1) / componentizedTotalPages) * 100 
                        : ((currentSlideIndex + 1) / totalSlides) * 100}%`,
                      height: '100%',
                      backgroundColor: 'var(--color-primary)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={exitPresentationMode}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              ESCで終了
            </button>
          </div>
          
          {/* ナビゲーション矢印ボタン */}
          {((isComponentizedPage && componentizedCurrentPage > 0) || 
            (!isComponentizedPage && (currentPage > 0 || currentSlideIndex > 0))) && (
            <button
              onClick={goToPreviousPage}
              style={{
                position: 'absolute',
                left: showTableOfContents ? '300px' : '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10000,
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                transition: 'left 0.3s ease, background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              ←
            </button>
          )}
          
          {/* 右側のナビゲーションボタン */}
          <div
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10000,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* 右矢印：次のページまたは次のスライド */}
            {(currentPage < totalPages - 1 || currentSlideIndex < totalSlides - 1) && (
              <button
                onClick={goToNextPage}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                title="次のページ"
              >
                →
              </button>
            )}
            
            {/* 次のスライドボタン */}
            {currentSlideIndex < totalSlides - 1 && (
              <button
                onClick={goToNextSlide}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 600,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                title="次のスライド"
              >
                ≫
              </button>
            )}
          </div>
          
          {/* メインコンテンツ */}
          <div
            style={{
              width: showTableOfContents 
                ? 'calc(100% - 400px)'
                : 'calc(100% - 200px)',
              maxWidth: showTableOfContents 
                ? 'calc(100% - 400px)' 
                : '1800px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '40px',
              color: 'var(--color-text)',
              marginTop: '80px',
              marginLeft: showTableOfContents ? '400px' : '100px',
              marginRight: showTableOfContents ? '100px' : '100px',
              marginBottom: '80px',
              animation: slideDirection === 'left' 
                ? 'slideInFromRight 0.5s ease-out'
                : slideDirection === 'right'
                ? 'slideInFromLeft 0.5s ease-out'
                : 'none',
              position: 'relative',
              overflow: isPresentationMode ? 'hidden' : 'visible',
              height: isPresentationMode ? 'calc(100vh - 200px)' : 'auto',
              minHeight: isPresentationMode ? 'calc(100vh - 200px)' : 'auto',
              maxHeight: isPresentationMode ? 'calc(100vh - 200px)' : 'none',
              paddingBottom: isPresentationMode ? '60px' : '0',
              transition: 'margin-left 0.3s ease, width 0.3s ease, max-width 0.3s ease, margin-right 0.3s ease',
              // PDF出力と同じ比率を維持
              ...(isPresentationMode && contentAspectRatio ? (() => {
                const isPortrait = contentAspectRatio < 1;
                // PDF出力と同じ比率を使用
                // 縦長: A4縦 (210mm x 297mm) = 約0.707:1
                // 横長: 16:9 (254mm x 143mm) = 約1.778:1
                const targetAspectRatio = isPortrait ? 210 / 297 : 254 / 143;
                
                // コンテナの高さに基づいて幅を計算
                const containerHeight = window.innerHeight - 200; // ヘッダーとマージンを考慮
                const calculatedWidth = containerHeight * targetAspectRatio;
                const maxAvailableWidth = showTableOfContents 
                  ? window.innerWidth - 400 
                  : window.innerWidth - 200;
                
                return {
                  width: `${Math.min(calculatedWidth, maxAvailableWidth)}px`,
                  maxWidth: `${Math.min(calculatedWidth, maxAvailableWidth)}px`,
                  aspectRatio: `${targetAspectRatio}`,
                };
              })() : {}),
            }}
          >
            <ContainerVisibilityProvider showContainers={false} setShowContainers={() => {}}>
              <div
                ref={contentRef}
                data-content-container
                style={{
                  overflowY: isPresentationMode ? 'auto' : 'visible',
                  height: isPresentationMode ? 'calc(100vh - 200px - 60px)' : 'auto',
                  minHeight: isPresentationMode ? 'calc(100vh - 200px - 60px)' : 'auto',
                  maxHeight: isPresentationMode ? 'calc(100vh - 200px - 60px)' : 'none',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  paddingBottom: isPresentationMode ? '60px' : '0',
                }}
              >
                {children}
              </div>
            </ContainerVisibilityProvider>
          </div>
          
          {/* 目次ボタン */}
          <button
            onClick={() => setShowTableOfContents(prev => !prev)}
            style={{
              position: 'absolute',
              bottom: '60px',
              left: '20px',
              zIndex: 10000,
              padding: '8px 16px',
              backgroundColor: showTableOfContents 
                ? 'rgba(255, 255, 255, 0.3)' 
                : 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            M: 目次
          </button>
          
          {/* スライド一覧ボタン */}
          <button
            onClick={() => setShowSlideThumbnails(true)}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              zIndex: 10000,
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            T: スライド一覧
          </button>
          
          {/* キーボードショートカットのヒント */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10000,
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '12px',
              textAlign: 'center',
            }}
          >
            {totalPages > 1 ? (
              <>
                ← → キーでページ/スライドを移動 | ↑ ↓ キーでページを移動 | M で目次 | T でスライド一覧 | ESC で終了
              </>
            ) : (
              <>
                ← → キーでスライドを移動 | M で目次 | T でスライド一覧 | ESC で終了
              </>
            )}
          </div>
        </div>
      )}
      
      {/* キービジュアルPDFメタデータ編集モーダル */}
      {showKeyVisualMetadataEditor && currentPageDimensions && (
        <KeyVisualPDFMetadataEditor
          isOpen={showKeyVisualMetadataEditor}
          onClose={() => {
            setShowKeyVisualMetadataEditor(false);
            setPendingPDFExport(false);
            // keyVisualMetadataはクリアしない（Firestoreに保存されているので維持される）
          }}
          onSave={handleMetadataSave}
          pageWidth={currentPageDimensions.width}
          pageHeight={currentPageDimensions.height}
        />
      )}
    </Layout>
  );
}
