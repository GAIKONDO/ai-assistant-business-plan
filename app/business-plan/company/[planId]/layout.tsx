'use client';

import { useState, useEffect, createContext, useContext, useCallback, useRef, startTransition } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Script from 'next/script';
import { auth, db } from '@/lib/firebase';
import Layout from '@/components/Layout';
import CompanyPlanSubMenu from '@/components/CompanyPlanSubMenu';
import { SUB_MENU_ITEMS } from '@/components/ConceptSubMenu';
import { BusinessPlanData } from '@/components/BusinessPlanForm';
import { PresentationModeProvider, usePresentationMode } from '@/components/PresentationModeContext';
import PageBreakEditor from '@/components/PageBreakEditor';

declare global {
  interface Window {
    html2pdf?: any;
  }
}

declare global {
  interface Window {
    p5?: any;
    mermaid?: any;
  }
}

interface PlanContextType {
  plan: (BusinessPlanData & { id: string }) | null;
  loading: boolean;
}

const PlanContext = createContext<PlanContextType>({ plan: null, loading: true });

export const usePlan = () => useContext(PlanContext);

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

export default function CompanyPlanDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const planId = params.planId as string;

  const [planTitle, setPlanTitle] = useState<string>('');
  const [plan, setPlan] = useState<(BusinessPlanData & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const loadPlan = useCallback(async () => {
    if (!auth?.currentUser || !db || !planId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
      if (planDoc.exists()) {
        const data = planDoc.data();
        const planData = {
          id: planDoc.id,
          title: data.title || '',
          description: data.description || '',
          objectives: data.objectives || '',
          targetMarket: data.targetMarket || '',
          competitiveAdvantage: data.competitiveAdvantage || '',
          financialPlan: data.financialPlan || '',
          timeline: data.timeline || '',
          keyVisualUrl: data.keyVisualUrl || '', // キービジュアル画像のURL
          keyVisualHeight: data.keyVisualHeight || 56.25, // キービジュアルの高さ（%）
        };
        setPlan(planData);
        setPlanTitle(data.title || '事業計画');
      } else {
        setPlan(null);
        setPlanTitle('事業計画');
      }
    } catch (error) {
      console.error('読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  // 認証状態を監視
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthReady(true);
      if (user && planId) {
        loadPlan();
      } else if (!user) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [planId, loadPlan]);

  // 認証が完了し、planIdが変更されたときにデータを読み込む
  useEffect(() => {
    if (authReady && auth?.currentUser && planId) {
      loadPlan();
    }
  }, [authReady, planId, loadPlan]);

  // 現在のサブメニュー項目を判定
  const getCurrentSubMenu = () => {
    const pathSegments = pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment === planId) {
      return 'overview'; // デフォルトは概要・コンセプト
    }
    return SUB_MENU_ITEMS.find(item => item.path === lastSegment)?.id || 'overview';
  };

  const currentSubMenu = getCurrentSubMenu();

  return (
    <PresentationModeProvider>
      <CompanyPlanLayoutContent
        planId={planId}
        planTitle={planTitle}
        plan={plan}
        loading={loading}
        currentSubMenu={currentSubMenu}
        router={router}
      >
        {children}
      </CompanyPlanLayoutContent>
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

function CompanyPlanLayoutContent({
  planId,
  planTitle,
  plan,
  loading,
  currentSubMenu,
  router,
  children,
}: {
  planId: string;
  planTitle: string;
  plan: (BusinessPlanData & { id: string }) | null;
  loading: boolean;
  currentSubMenu: string;
  router: ReturnType<typeof useRouter>;
  children: React.ReactNode;
}) {
  const { isPresentationMode, enterPresentationMode, exitPresentationMode } = usePresentationMode();
  const pathname = usePathname();
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [showSlideThumbnails, setShowSlideThumbnails] = useState(false);
  const [showStartGuide, setShowStartGuide] = useState(false);
  const [showTableOfContents, setShowTableOfContents] = useState(true); // デフォルトで表示
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageBreakIds, setPageBreakIds] = useState<string[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const presentationContainerRef = useRef<HTMLDivElement>(null);
  const [showContainers, setShowContainers] = useState(false); // コンテナの表示・非表示状態
  const [isExportingPDF, setIsExportingPDF] = useState(false); // PDF出力中の状態
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [contentAspectRatio, setContentAspectRatio] = useState<number | null>(null);
  
  // 現在のスライドインデックスを取得
  const currentSlideIndex = SUB_MENU_ITEMS.findIndex(item => item.id === currentSubMenu);
  const totalSlides = SUB_MENU_ITEMS.length;
  
  // localStorageからページ分割設定を読み込む
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const storageKey = `page-breaks-${planId}-${currentSubMenu}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        setPageBreakIds(ids);
      } catch (e) {
        console.error('ページ分割設定の読み込みエラー:', e);
      }
    } else {
      setPageBreakIds([]);
    }
  }, [planId, currentSubMenu]);
  
  // ページ分割設定を保存
  const savePageBreakIds = useCallback((ids: string[]) => {
    if (typeof window === 'undefined') return;
    const storageKey = `page-breaks-${planId}-${currentSubMenu}`;
    localStorage.setItem(storageKey, JSON.stringify(ids));
    setPageBreakIds(ids);
  }, [planId, currentSubMenu]);
  
  // スライドが変更されたときにページをリセット
  useEffect(() => {
    setCurrentPage(0);
    setTotalPages(1);
  }, [currentSubMenu]);

  // 次のスライドと前のスライドを事前にプリフェッチ
  useEffect(() => {
    if (currentSlideIndex >= 0 && currentSlideIndex < totalSlides) {
      // 次のスライドをプリフェッチ
      if (currentSlideIndex < totalSlides - 1) {
        const nextItem = SUB_MENU_ITEMS[currentSlideIndex + 1];
        router.prefetch(`/business-plan/company/${planId}/${nextItem.path}`);
      }
      // 前のスライドをプリフェッチ
      if (currentSlideIndex > 0) {
        const previousItem = SUB_MENU_ITEMS[currentSlideIndex - 1];
        router.prefetch(`/business-plan/company/${planId}/${previousItem.path}`);
      }
    }
  }, [currentSlideIndex, totalSlides, planId, router]);
  
  // 要素IDベースでページ数を計算（スクロール方式）
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
      
      // ページ分割IDが設定されている場合
      if (pageBreakIds.length > 0) {
        const pages = pageBreakIds.length + 1; // マーカーの数 + 1（最初のページ）
        setTotalPages(pages);
      } else {
        // ページ分割IDが設定されていない場合は従来の方法（高さベース）
        const viewportHeight = window.innerHeight;
        const headerHeight = 80;
        const footerHeight = 60;
        const padding = 80;
        const pageHeight = viewportHeight - headerHeight - footerHeight - padding;
        const contentHeight = container.scrollHeight;
        const pages = Math.max(1, Math.ceil(contentHeight / pageHeight));
        setTotalPages(pages);
      }
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
  }, [isPresentationMode, currentSubMenu, pageBreakIds]);
  
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

  // ページ変更時にスクロール位置を更新（要素IDベースのスクロール方式）
  useEffect(() => {
    if (!isPresentationMode || !contentRef.current) return;
    
    const container = contentRef.current;
    
    // すべての要素を表示（スクロール方式なので非表示にしない）
    const allChildren = Array.from(container.children) as HTMLElement[];
    allChildren.forEach(child => {
      child.style.display = '';
      child.style.visibility = 'visible';
    });
    
    // ページ分割IDが設定されている場合
    if (pageBreakIds.length > 0 && currentPage > 0) {
      // 現在のページに対応するIDの要素にスクロール
      const targetId = pageBreakIds[currentPage - 1];
      
      // 要素を検索（複数の方法を試す）
      let targetElement: Element | null = null;
      
      // 方法1: コンテナ内でIDで検索
      const allElements = container.querySelectorAll('[id]');
      for (let i = 0; i < allElements.length; i++) {
        if (allElements[i].id === targetId) {
          targetElement = allElements[i];
          break;
        }
      }
      
      // 方法2: ドキュメント全体から検索
      if (!targetElement) {
        const allDocElements = document.querySelectorAll('[id]');
        for (let i = 0; i < allDocElements.length; i++) {
          if (allDocElements[i].id === targetId && container.contains(allDocElements[i])) {
            targetElement = allDocElements[i];
            break;
          }
        }
      }
      
      if (targetElement) {
        // 要素の位置にスクロール
        const scrollToElement = () => {
          // コンテナをスクロール可能にする
          container.style.overflowY = 'auto';
          container.style.height = '100%';
          
          // 要素の位置を計算（offsetTopを使用してより正確に）
          const targetEl = targetElement as HTMLElement;
          let elementTop = 0;
          let currentEl: HTMLElement | null = targetEl;
          
          // コンテナまでの相対位置を計算
          while (currentEl && currentEl !== container) {
            elementTop += currentEl.offsetTop;
            currentEl = currentEl.offsetParent as HTMLElement | null;
          }
          
          // 要素の位置にスクロール（少し上に余白を追加）
          const offset = 20; // 上部の余白
          const targetScrollTop = Math.max(0, elementTop - offset);
          
          container.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth',
          });
        };
        
        // レイアウトが安定するまで待つ
        setTimeout(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(scrollToElement);
          });
        }, 100);
      } else {
        console.warn(`ページ ${currentPage + 1} のターゲット要素が見つかりません: ${targetId}`);
      }
    } else if (pageBreakIds.length === 0) {
      // 高さベースの分割の場合
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
        container.scrollTo({
          top: scrollOffset,
          behavior: 'smooth',
        });
      }
    } else if (currentPage === 0) {
      // 最初のページの場合は先頭にスクロール
      container.style.overflowY = 'auto';
      container.style.height = '100%';
      container.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [currentPage, totalPages, isPresentationMode, pageBreakIds]);
  
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
      startTransition(() => {
        router.push(`/business-plan/company/${planId}/${previousItem.path}`, { scroll: false });
      });
      setTimeout(() => setSlideDirection(null), 350);
    }
  }, [currentSlideIndex, planId, router]);
  
  // 次のスライドに移動
  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < totalSlides - 1) {
      const nextItem = SUB_MENU_ITEMS[currentSlideIndex + 1];
      // アニメーションを開始
      setSlideDirection('left');
      // startTransitionで遷移を最適化（React 18の並行レンダリング機能を活用）
      startTransition(() => {
        router.push(`/business-plan/company/${planId}/${nextItem.path}`, { scroll: false });
      });
      // アニメーション時間に合わせてリセット
      setTimeout(() => setSlideDirection(null), 350);
    }
  }, [currentSlideIndex, totalSlides, planId, router]);
  
  // 特定のスライドに移動
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      const item = SUB_MENU_ITEMS[index];
      router.push(`/business-plan/company/${planId}/${item.path}`, { scroll: false });
      setShowSlideThumbnails(false);
    }
  }, [totalSlides, planId, router]);
  
  // 前のページに移動
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    } else if (currentSlideIndex > 0) {
      // 最初のページで、前のスライドがある場合は前のスライドの最後のページに移動
      const previousItem = SUB_MENU_ITEMS[currentSlideIndex - 1];
      router.push(`/business-plan/company/${planId}/${previousItem.path}`, { scroll: false });
      // 前のスライドの最後のページに移動するため、一時的に大きな値を設定
      // 実際のページ数は次のuseEffectで調整される
    }
  }, [currentPage, currentSlideIndex, planId, router]);
  
  // 次のページに移動
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    } else if (currentSlideIndex < totalSlides - 1) {
      // 最後のページで、次のスライドがある場合は次のスライドの最初のページに移動
      setCurrentPage(0);
      const nextItem = SUB_MENU_ITEMS[currentSlideIndex + 1];
      router.push(`/business-plan/company/${planId}/${nextItem.path}`, { scroll: false });
    }
  }, [currentPage, totalPages, currentSlideIndex, totalSlides, planId, router]);
  
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
  }, [isPresentationMode, goToPreviousPage, goToNextPage, showSlideThumbnails, showStartGuide, exitPresentationMode]);

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

      // パワーポイント形式（16:9）のサイズを計算
      // パワーポイント標準サイズ: 25.4cm × 14.29cm (10インチ × 5.625インチ)
      const pdfWidth = 254; // 25.4cm = 254mm
      const pdfHeight = 143; // 14.29cm ≈ 143mm (16:9のアスペクト比)
      const margin = 10; // マージン（mm）
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = pdfHeight - (margin * 2);

      // PDFインスタンスを作成（カスタムサイズ、横長）
      // 最初のページの向きに応じて後で設定するため、一時的に作成
      let pdf = new jsPDF({
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
        orientation: 'landscape'
      });

      // 各コンテナを画像化してPDFに追加
      for (let i = 0; i < containers.length; i++) {
        const containerEl = containers[i];
        
        // キービジュアルコンテナかどうかを判定（data-page-container="0"）
        const isKeyVisual = containerEl.getAttribute('data-page-container') === '0';
        
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
          // コンテナのアスペクト比を維持しつつ、適切なサイズを計算
          // 基準となる高さを設定（A4縦の高さを基準）
          const baseHeight = 297; // A4縦の高さ（mm）
          pageHeight = baseHeight;
          pageWidth = baseHeight * containerAspectRatio;
          orientation = 'portrait';
        } else {
          // 横長の場合は横向き（landscape）
          // 16:9の比率を維持
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
        
        // コンテナを画像化
        const canvas = await html2canvas(containerEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: containerEl.scrollWidth,
          height: containerEl.scrollHeight,
        });
        
        // SVGの位置調整を元に戻す
        svgAdjustments.forEach(({ svg, parent, originalParentPaddingTop, originalSvgMarginTop }) => {
          parent.style.paddingTop = originalParentPaddingTop;
          (svg as HTMLElement).style.marginTop = originalSvgMarginTop;
        });
        
        // 元のborderスタイルを復元
        containerEl.style.border = originalBorder;

        // 画像データを取得
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // 画像のサイズを計算（パワーポイント形式の16:9に収まるように調整）
        let imgWidth = canvas.width;
        let imgHeight = canvas.height;
        let imgAspectRatio = imgWidth / imgHeight;
        
        // キービジュアルの場合は、実際の画像アスペクト比を使用
        if (isKeyVisual && targetAspectRatio) {
          imgAspectRatio = targetAspectRatio;
          // アスペクト比に基づいて高さを再計算
          imgHeight = imgWidth / imgAspectRatio;
        }
        
        // ページのアスペクト比
        const pageAspectRatio = pageWidth / pageHeight;
        
        let finalWidth = contentWidth;
        let finalHeight = contentWidth / imgAspectRatio;
        
        // 高さがページを超える場合は、高さ基準で調整
        if (finalHeight > contentHeight) {
          finalHeight = contentHeight;
          finalWidth = contentHeight * imgAspectRatio;
        }
        
        // 下揃えのための位置調整
        const xOffset = (contentWidth - finalWidth) / 2;
        const yOffset = contentHeight - finalHeight;

        // PDFに画像を追加（下揃え）
        pdf.addImage(imgData, 'PNG', margin + xOffset, margin + yOffset, finalWidth, finalHeight);
        
        // 非表示にした要素を復元
        hiddenElements.forEach(({ element, originalDisplay }) => {
          element.style.display = originalDisplay;
        });
      }

      // PDFを保存
      pdf.save(`${planTitle}_${currentSubMenu}_${new Date().toISOString().split('T')[0]}.pdf`);

      console.log('PDF生成が完了しました');
    } catch (error) {
      console.error('PDF出力エラー:', error);
      alert(`PDF出力に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExportingPDF(false); // 処理完了
    }
  }, [showContainers, planTitle, currentSubMenu]);

  return (
    <Layout>
      <PlanContext.Provider value={{ plan, loading }}>
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
        strategy="lazyOnload"
        onLoad={() => {
          if (typeof window !== 'undefined' && window.mermaid) {
            window.dispatchEvent(new Event('mermaidloaded'));
          }
        }}
      />
      {!isPresentationMode && (
        <div style={{ display: 'flex', gap: '32px' }}>
          <CompanyPlanSubMenu planId={planId} currentSubMenuId={currentSubMenu} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => router.push('/business-plan')}
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
                ← 事業計画に戻る
              </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ marginBottom: '4px' }}>{planTitle}</h2>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <PageBreakEditor
                          planId={planId}
                          currentSubMenu={currentSubMenu}
                          pageBreakIds={pageBreakIds}
                          onSave={savePageBreakIds}
                        />
                        <button
                          onClick={() => setShowContainers(!showContainers)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: showContainers ? 'var(--color-primary)' : '#F3F4F6',
                            color: showContainers ? '#fff' : 'var(--color-text)',
                            border: '1px solid var(--color-border-color)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            transition: 'all 0.2s',
                          }}
                        >
                          {showContainers ? 'コンテナ非表示' : 'コンテナ表示'}
                        </button>
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
                      </div>
                    </div>
            </div>
            <ContainerVisibilityProvider showContainers={showContainers} setShowContainers={setShowContainers}>
              <div data-content-container ref={contentContainerRef}>
                {children}
              </div>
            </ContainerVisibilityProvider>
          </div>
        </div>
      )}
      {isPresentationMode && (
        <>
          <style jsx global>{`
            @keyframes slideInFromRight {
              from {
                opacity: 0;
                transform: translateX(30px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            @keyframes slideInFromLeft {
              from {
                opacity: 0;
                transform: translateX(-30px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
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
                        // 目次の状態は保持する（閉じない）
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
              left: showTableOfContents ? '300px' : '20px', // 目次が表示されている時は右にずらす
              right: '20px',
              zIndex: 10002, // 目次（zIndex: 10001）より前面に表示
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
                {SUB_MENU_ITEMS[currentSlideIndex]?.label}
              </span>
              {/* スライド番号とページ番号 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                  {currentSlideIndex + 1} / {totalSlides}
                  {totalPages > 1 && (
                    <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.8 }}>
                      (ページ {currentPage + 1} / {totalPages})
                    </span>
                  )}
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
                      width: `${((currentSlideIndex + 1) / totalSlides) * 100}%`,
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
          
          {/* ナビゲーション矢印ボタン（左右：ページ/スライド移動、上下：ページ移動） */}
          {/* 左矢印：前のページまたは前のスライド */}
          {(currentPage > 0 || currentSlideIndex > 0) && (
            <button
              onClick={goToPreviousPage}
              style={{
                position: 'absolute',
                left: showTableOfContents ? '300px' : '20px', // 目次が表示されている時は右にずらす
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
          <div style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
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
                ? 'calc(100% - 400px)' // 目次が表示されている時：目次幅280px + 左矢印ボタン用100px + マージン20px
                : 'calc(100% - 200px)', // 目次が閉じている時：左右100pxずつのマージン（ボタン用の余白を確保）
              maxWidth: showTableOfContents 
                ? 'calc(100% - 400px)' 
                : '1800px', // 目次が閉じている時はより広い最大幅
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '40px',
              color: 'var(--color-text)',
              marginTop: '80px', // 上部の余白を少し減らして表示幅を広げる
              marginLeft: showTableOfContents ? '400px' : '100px', // 目次が表示されている時は左矢印ボタン用に400px、閉じている時は100px
              marginRight: showTableOfContents ? '100px' : '100px', // 右矢印ボタン用に100pxのマージン
              marginBottom: '80px', // 下部の余白を少し減らして表示幅を広げる
              animation: slideDirection === 'left' 
                ? 'slideInFromRight 0.3s ease-out'
                : slideDirection === 'right'
                ? 'slideInFromLeft 0.3s ease-out'
                : 'none',
              position: 'relative',
              overflow: isPresentationMode ? 'hidden' : 'visible', // プレゼンテーションモード時はhiddenにして余白部分を見えないようにする
              maxHeight: isPresentationMode ? 'calc(100vh - 200px)' : 'none', // プレゼンテーションモード時のみ高さを制限
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
                  // スクロール方式なので、overflowを設定
                  overflowY: isPresentationMode ? 'auto' : 'visible',
                  height: isPresentationMode ? 'calc(100vh - 200px - 60px)' : 'auto',
                  maxHeight: isPresentationMode ? 'calc(100vh - 200px - 60px)' : 'none',
                  position: 'relative',
                  paddingBottom: isPresentationMode ? '60px' : '0',
                }}
              >
                <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>
                  {planTitle}
                </h2>
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
        </>
      )}
      </PlanContext.Provider>
    </Layout>
  );
}

