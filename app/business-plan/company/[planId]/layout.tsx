'use client';

import { useState, useEffect, createContext, useContext, useCallback, useRef, startTransition, useMemo } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Script from 'next/script';
import { auth, db } from '@/lib/firebase';
import Layout from '@/components/Layout';
import CompanyPlanSubMenu from '@/components/CompanyPlanSubMenu';
import { SUB_MENU_ITEMS } from '@/components/ConceptSubMenu';
import { BusinessPlanData } from '@/components/BusinessPlanForm';
import { PresentationModeProvider, usePresentationMode } from '@/components/PresentationModeContext';
import PageBreakEditor from '@/components/PageBreakEditor';
import MigrateFromFixedPage from '@/components/pages/component-test/test-concept/MigrateFromFixedPage';
import { ComponentizedCompanyPlanPageProvider, useComponentizedCompanyPlanPageOptional } from '@/components/pages/component-test/test-concept/ComponentizedCompanyPlanPageContext';
import MermaidLoader from '@/components/MermaidLoader';
import { PlanContext, usePlan } from './hooks/usePlan';
import { ContainerVisibilityContext, useContainerVisibility } from './hooks/useContainerVisibility';

declare global {
  interface Window {
    html2pdf?: any;
  }
}

declare global {
  interface Window {
    p5?: any;
  }
}

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
          keyVisualScale: data.keyVisualScale || 100, // キービジュアルのスケール（%）
          keyVisualLogoUrl: data.keyVisualLogoUrl || '', // PDFロゴのURL
          keyVisualLogoSize: data.keyVisualLogoSize || 15, // PDFロゴのサイズ（mm）
          keyVisualMetadata: data.keyVisualMetadata || undefined, // PDFメタデータ（タイトル、署名、作成日）
          titlePositionX: data.titlePositionX ?? 5, // PDFタイトルのX位置（mm）
          titlePositionY: data.titlePositionY ?? -3, // PDFタイトルのY位置（mm）
          titleFontSize: data.titleFontSize ?? 12, // PDFタイトルのフォントサイズ（px）
          titleBorderEnabled: data.titleBorderEnabled !== undefined ? data.titleBorderEnabled : true, // PDFタイトルのボーダー（縦棒）の有無（デフォルトは有り）
          footerText: data.footerText || 'AI assistant company, Inc - All Rights Reserved', // PDFフッターテキスト（デフォルト値）
          pagesBySubMenu: data.pagesBySubMenu, // サブメニューごとのページデータ
          pageOrderBySubMenu: data.pageOrderBySubMenu, // サブメニューごとのページ順序
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
      <PlanContext.Provider value={{ plan, loading, reloadPlan: loadPlan }}>
        {plan?.pagesBySubMenu ? (
          // コンポーネント化されたページの場合は、ComponentizedCompanyPlanPageProviderを使用
          <ComponentizedCompanyPlanPageProvider>
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
          </ComponentizedCompanyPlanPageProvider>
        ) : (
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
        )}
      </PlanContext.Provider>
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
  const { reloadPlan } = usePlan();
  const { isPresentationMode, enterPresentationMode, exitPresentationMode } = usePresentationMode();
  
  // コンポーネント化版かどうかを判定
  const isComponentized = plan?.pagesBySubMenu && 
    typeof plan.pagesBySubMenu === 'object' && 
    Object.keys(plan.pagesBySubMenu).length > 0 &&
    Object.values(plan.pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
  
  // コンポーネント化されたページのコンテキストを取得（オプショナル）
  const componentizedPageContext = useComponentizedCompanyPlanPageOptional();
  
  // showContainersの状態をローカルで管理（固定ページ形式の場合）
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
  
  // showContainersの状態をローカルで管理
  const [localShowContainers, setLocalShowContainers] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showContainers');
      return saved === 'true';
    }
    return false;
  });
  
  const showContainers = localShowContainers;
  const setShowContainers = setLocalShowContainers;
  
  // showContainersの状態をlocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showContainers', showContainers.toString());
    }
  }, [showContainers]);
  const [isExportingPDF, setIsExportingPDF] = useState(false); // PDF出力中の状態
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [contentAspectRatio, setContentAspectRatio] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 1920, height: 1080 };
  });
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [subMenuOpen, setSubMenuOpen] = useState(true); // サブメニューの表示状態
  const [showPDFSubMenuSelector, setShowPDFSubMenuSelector] = useState(false); // PDF出力時のサブメニュー選択モーダル
  const [selectedSubMenusForPDF, setSelectedSubMenusForPDF] = useState<Set<string>>(new Set([currentSubMenu])); // 選択されたサブメニュー
  const [subMenuPagesStatus, setSubMenuPagesStatus] = useState<Array<{ id: string; label: string; hasPages: boolean }>>([]); // サブメニューのページ有無状態
  const [isCheckingPages, setIsCheckingPages] = useState(false); // ページ確認中かどうか
  
  // 固定ページ形式のコンテナ管理用の状態
  interface FixedPageContainer {
    id: string;
    title: string;
    content: string;
    order: number;
  }
  const [fixedPageContainers, setFixedPageContainers] = useState<FixedPageContainer[]>([]);
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  
  // 固定ページ形式のコンテナはpage.tsxで直接定義するため、Firestoreから読み込まない
  // useEffect(() => {
  //   if (isComponentized || !plan || !db || !auth?.currentUser) {
  //     console.log('コンテナ読み込みスキップ:', { isComponentized, plan: !!plan, db: !!db, auth: !!auth?.currentUser });
  //     return;
  //   }
  //   
  //   const loadContainers = async () => {
  //     try {
  //       const planDoc = await getDoc(doc(db, 'companyBusinessPlan', plan.id));
  //       if (planDoc.exists()) {
  //         const data = planDoc.data();
  //         const containersBySubMenu = data.fixedPageContainersBySubMenu || {};
  //         const containers = containersBySubMenu[currentSubMenu] || [];
  //         console.log('コンテナを読み込みました:', { currentSubMenu, containersCount: containers.length, containers });
  //         setFixedPageContainers(containers);
  //       }
  //     } catch (error) {
  //       console.error('コンテナの読み込みエラー:', error);
  //     }
  //   };
  //   
  //   loadContainers();
  // }, [plan, currentSubMenu, isComponentized, db, auth]);
  
  // 固定ページ形式のコンテナをFirestoreに保存
  const saveContainers = useCallback(async (containers: FixedPageContainer[]) => {
    if (!plan || !db || !auth?.currentUser) return;
    
    try {
      const planDoc = await getDoc(doc(db, 'companyBusinessPlan', plan.id));
      if (planDoc.exists()) {
        const data = planDoc.data();
        const containersBySubMenu = data.fixedPageContainersBySubMenu || {};
        await updateDoc(doc(db, 'companyBusinessPlan', plan.id), {
          fixedPageContainersBySubMenu: {
            ...containersBySubMenu,
            [currentSubMenu]: containers,
          },
          updatedAt: serverTimestamp(),
        });
        console.log('layout.tsx: コンテナを保存しました:', { currentSubMenu, containersCount: containers.length, containers });
        // planを再読み込みして、overview/page.tsxなど他のコンポーネントにも反映
        if (reloadPlan) {
          await reloadPlan();
        }
      }
    } catch (error) {
      console.error('コンテナの保存エラー:', error);
      alert('コンテナの保存に失敗しました。');
    }
  }, [plan, currentSubMenu, db, auth, reloadPlan]);
  
  
  // コンテナの編集を開始
  const handleStartEditContainer = useCallback((containerId: string) => {
    const container = fixedPageContainers.find(c => c.id === containerId);
    if (container) {
      setEditingContainerId(containerId);
      setEditingTitle(container.title);
      setEditingContent(container.content);
    }
  }, [fixedPageContainers]);
  
  // コンテナの編集を保存
  const handleSaveEditContainer = useCallback(async () => {
    if (!editingContainerId) return;
    
    const updatedContainers = fixedPageContainers.map(c =>
      c.id === editingContainerId
        ? { ...c, title: editingTitle, content: editingContent }
        : c
    );
    
    setFixedPageContainers(updatedContainers);
    await saveContainers(updatedContainers);
    setEditingContainerId(null);
    setEditingTitle('');
    setEditingContent('');
  }, [editingContainerId, editingTitle, editingContent, fixedPageContainers, saveContainers]);
  
  // コンテナの編集をキャンセル
  const handleCancelEditContainer = useCallback(() => {
    setEditingContainerId(null);
    setEditingTitle('');
    setEditingContent('');
  }, []);
  
  // コンテナを削除
  const handleDeleteContainer = useCallback(async (containerId: string) => {
    if (!confirm('このコンテナを削除しますか？')) return;
    
    const updatedContainers = fixedPageContainers
      .filter(c => c.id !== containerId)
      .map((c, index) => ({ ...c, order: index }));
    
    setFixedPageContainers(updatedContainers);
    await saveContainers(updatedContainers);
  }, [fixedPageContainers, saveContainers]);
  
  // コンテナの順序を変更（上に移動）
  const handleMoveContainerUp = useCallback(async (containerId: string) => {
    const index = fixedPageContainers.findIndex(c => c.id === containerId);
    if (index <= 0) return;
    
    const updatedContainers = [...fixedPageContainers];
    [updatedContainers[index - 1], updatedContainers[index]] = [updatedContainers[index], updatedContainers[index - 1]];
    updatedContainers[index - 1].order = index - 1;
    updatedContainers[index].order = index;
    
    setFixedPageContainers(updatedContainers);
    await saveContainers(updatedContainers);
  }, [fixedPageContainers, saveContainers]);
  
  // コンテナの順序を変更（下に移動）
  const handleMoveContainerDown = useCallback(async (containerId: string) => {
    const index = fixedPageContainers.findIndex(c => c.id === containerId);
    if (index < 0 || index >= fixedPageContainers.length - 1) return;
    
    const updatedContainers = [...fixedPageContainers];
    [updatedContainers[index], updatedContainers[index + 1]] = [updatedContainers[index + 1], updatedContainers[index]];
    updatedContainers[index].order = index;
    updatedContainers[index + 1].order = index + 1;
    
    setFixedPageContainers(updatedContainers);
    await saveContainers(updatedContainers);
  }, [fixedPageContainers, saveContainers]);
  
  // サブメニューの表示状態を監視
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 初期状態を読み込む
    const savedSubMenuOpen = localStorage.getItem('subMenuOpen');
    if (savedSubMenuOpen !== null) {
      setSubMenuOpen(savedSubMenuOpen === 'true');
    }
    
    // カスタムイベントでサブメニューの表示状態変更を監視
    const handleSubMenuToggle = () => {
      const savedSubMenuOpen = localStorage.getItem('subMenuOpen');
      if (savedSubMenuOpen !== null) {
        setSubMenuOpen(savedSubMenuOpen === 'true');
      }
    };
    
    window.addEventListener('subMenuToggle', handleSubMenuToggle);
    
    return () => {
      window.removeEventListener('subMenuToggle', handleSubMenuToggle);
    };
  }, []);
  
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
  
  // ウィンドウサイズを監視（プレゼンテーションモード時）- デバウンス付き
  useEffect(() => {
    if (!isPresentationMode) return;

    let resizeTimer: NodeJS.Timeout | null = null;

    const handleResize = () => {
      // デバウンス: リサイズイベントを16ms（約60fps）ごとに処理
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      
      resizeTimer = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 16); // 約60fps
    };

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize(); // 初回実行

    return () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isPresentationMode]);

  // コンテンツのアスペクト比を検出（プレゼンテーションモード時）- デバウンス付き
  useEffect(() => {
    if (!isPresentationMode || !contentRef.current) {
      setContentAspectRatio(null);
      return;
    }

    let aspectRatioTimer: NodeJS.Timeout | null = null;

    const calculateAspectRatio = () => {
      const container = contentRef.current;
      if (!container) {
        setContentAspectRatio(null);
        return;
      }

      // デバウンス: アスペクト比の計算を16msごとに処理
      if (aspectRatioTimer) {
        clearTimeout(aspectRatioTimer);
      }

      aspectRatioTimer = setTimeout(() => {
      // コンテンツの実際のサイズを測定
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width > 0 && height > 0) {
        const aspectRatio = width / height;
        setContentAspectRatio(aspectRatio);
      }
      }, 16); // 約60fps
    };

    // 初回計算
    calculateAspectRatio();

    // リサイズ時にも再計算（ResizeObserverは既にデバウンスされている）
    const resizeObserver = new ResizeObserver(() => {
      calculateAspectRatio();
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      if (aspectRatioTimer) {
        clearTimeout(aspectRatioTimer);
      }
      resizeObserver.disconnect();
    };
  }, [isPresentationMode, currentSubMenu, currentPage]);

  // プレゼンテーションモード時のスタイル計算（useMemoでメモ化）
  const presentationStyle = useMemo(() => {
    if (!isPresentationMode) return {};

    // ウィンドウサイズを取得（stateから）
    const windowWidth = windowSize.width;
    const windowHeight = windowSize.height;
    
    // ヘッダーとマージンを考慮した利用可能なサイズ
    const headerHeight = 200; // ヘッダー部分の高さ
    const availableHeight = windowHeight - headerHeight;
    
    // 利用可能な幅を計算（目次とサブメニューの状態に応じて）
    const availableWidth = showTableOfContents 
      ? windowWidth - 400 
      : subMenuOpen
        ? windowWidth - 200
        : windowWidth - 100; // サブメニューが非表示の時は横幅を最大に
    
    // コンテンツのアスペクト比を維持しながら、ウィンドウサイズに収まるように調整
    let calculatedWidth = availableWidth;
    let calculatedHeight = availableHeight;
    
    if (contentAspectRatio && contentAspectRatio > 0) {
      // アスペクト比が取得できている場合は、それを使用
      if (contentAspectRatio > 1) {
        // 横長の場合：幅基準で高さを計算
        calculatedHeight = calculatedWidth / contentAspectRatio;
        if (calculatedHeight > availableHeight) {
          calculatedHeight = availableHeight;
          calculatedWidth = calculatedHeight * contentAspectRatio;
        }
      } else {
        // 縦長の場合：高さ基準で幅を計算
        calculatedWidth = calculatedHeight * contentAspectRatio;
        if (calculatedWidth > availableWidth) {
          calculatedWidth = availableWidth;
          calculatedHeight = calculatedWidth / contentAspectRatio;
        }
      }
    }
    
    return {
      width: `${Math.min(calculatedWidth, availableWidth)}px`,
      maxWidth: `${Math.min(calculatedWidth, availableWidth)}px`,
      // heightは設定しない（コンテンツの高さに合わせる）
      maxHeight: `${Math.min(calculatedHeight, availableHeight)}px`,
    };
  }, [isPresentationMode, windowSize, showTableOfContents, subMenuOpen, contentAspectRatio]);

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
    // コンポーネント化されたページの場合は、コンテキストのgoToPreviousPageを使用
    if (isComponentized && componentizedPageContext) {
      componentizedPageContext.goToPreviousPage();
      return;
    }
    
    // 固定ページ形式の場合
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    } else if (currentSlideIndex > 0) {
      // 最初のページで、前のスライドがある場合は前のスライドの最後のページに移動
      const previousItem = SUB_MENU_ITEMS[currentSlideIndex - 1];
      router.push(`/business-plan/company/${planId}/${previousItem.path}`, { scroll: false });
      // 前のスライドの最後のページに移動するため、一時的に大きな値を設定
      // 実際のページ数は次のuseEffectで調整される
    }
  }, [currentPage, currentSlideIndex, planId, router, isComponentized, componentizedPageContext]);
  
  // 次のページに移動
  const goToNextPage = useCallback(() => {
    // コンポーネント化されたページの場合は、コンテキストのgoToNextPageを使用
    if (isComponentized && componentizedPageContext) {
      componentizedPageContext.goToNextPage();
      return;
    }
    
    // 固定ページ形式の場合
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    } else if (currentSlideIndex < totalSlides - 1) {
      // 最後のページで、次のスライドがある場合は次のスライドの最初のページに移動
      setCurrentPage(0);
      const nextItem = SUB_MENU_ITEMS[currentSlideIndex + 1];
      router.push(`/business-plan/company/${planId}/${nextItem.path}`, { scroll: false });
    }
  }, [currentPage, totalPages, currentSlideIndex, totalSlides, planId, router, isComponentized, componentizedPageContext]);
  
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

  // サブメニューにページがあるかどうかを確認する関数
  const checkSubMenuHasPages = useCallback(async (subMenuId: string): Promise<boolean> => {
    if (isComponentized && plan?.pagesBySubMenu) {
      // コンポーネント化版の場合
      const pages = plan.pagesBySubMenu[subMenuId];
      return Array.isArray(pages) && pages.length > 0;
    } else {
      // 固定ページ版の場合
      try {
        // 各サブメニューのページをiframeで読み込んで確認
        const subMenuItem = SUB_MENU_ITEMS.find(item => item.id === subMenuId);
        if (!subMenuItem) return false;
        
        const url = `/business-plan/company/${planId}/${subMenuItem.path}`;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        document.body.appendChild(iframe);
        
        return new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => {
            document.body.removeChild(iframe);
            resolve(false);
          }, 5000);
          
          iframe.onload = () => {
            setTimeout(() => {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
              if (iframeDoc) {
                const containers = iframeDoc.querySelectorAll('[data-page-container]');
                document.body.removeChild(iframe);
                clearTimeout(timeout);
                resolve(containers.length > 0);
              } else {
                document.body.removeChild(iframe);
                clearTimeout(timeout);
                resolve(false);
              }
            }, 1000);
          };
          
          iframe.onerror = () => {
            document.body.removeChild(iframe);
            clearTimeout(timeout);
            resolve(false);
          };
          
          iframe.src = url;
        });
      } catch (error) {
        console.error(`サブメニュー ${subMenuId} のページ確認エラー:`, error);
        return false;
      }
    }
  }, [isComponentized, plan, planId]);

  // PDF出力機能（サブメニュー選択モーダルを表示）
  const handleExportToPDFClick = useCallback(async () => {
    if (!showContainers) {
      alert('コンテナ表示モードでPDF出力してください。');
      return;
    }

    // モーダルをすぐに表示
    setShowPDFSubMenuSelector(true);

    // 現在のサブメニューをデフォルトで選択
    setSelectedSubMenusForPDF(new Set([currentSubMenu]));
  }, [showContainers, currentSubMenu]);

  // PDF出力機能（実際のPDF生成）
  const handleExportToPDF = useCallback(async (selectedSubMenus: Set<string>, downloadCallback?: (blob: Blob, fileName: string) => void) => {
    if (!showContainers) {
      alert('コンテナ表示モードでPDF出力してください。');
      return;
    }

    setIsExportingPDF(true); // 処理開始

    // 一時的なコンテナと追加したスタイルシートを追跡（finallyブロックで削除するため）
    const tempContainers: HTMLElement[] = [];
    const addedStyles: HTMLElement[] = [];

    try {
      setIsCheckingPages(true);
      
      // 選択したサブメニューにページがあるかどうかを確認（並列処理）
      const selectedSubMenuStatus = await Promise.all(
        Array.from(selectedSubMenus).map(async (subMenuId) => {
          const hasPages = await checkSubMenuHasPages(subMenuId);
          return { subMenuId, hasPages };
        })
      );
      
      // ページがないサブメニューがある場合は警告
      const subMenusWithoutPages = selectedSubMenuStatus.filter(status => !status.hasPages);
      if (subMenusWithoutPages.length > 0) {
        const subMenuLabels = subMenusWithoutPages.map(status => {
          const item = SUB_MENU_ITEMS.find(i => i.id === status.subMenuId);
          return item?.label || status.subMenuId;
        }).join('、');
        alert(`以下のサブメニューにはページがありません: ${subMenuLabels}`);
        setIsExportingPDF(false);
        setIsCheckingPages(false);
        return;
      }
      
      setIsCheckingPages(false);
      // html2canvasとjsPDFを動的にインポート
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      // 選択したサブメニューのページをすべて取得
      const allContainers: Array<{ container: HTMLElement; subMenuId: string; subMenuLabel: string }> = [];
      
      for (const subMenuId of selectedSubMenus) {
        const subMenuItem = SUB_MENU_ITEMS.find(item => item.id === subMenuId);
        if (!subMenuItem) continue;
        
        if (isComponentized && plan?.pagesBySubMenu?.[subMenuId]) {
          // コンポーネント化版の場合、現在のページからコンテナを取得
          if (subMenuId === currentSubMenu) {
            const container = contentContainerRef.current;
            if (container) {
              const containers = Array.from(container.querySelectorAll('[data-page-container]')) as HTMLElement[];
              containers.forEach(c => {
                allContainers.push({ container: c, subMenuId, subMenuLabel: subMenuItem.label });
              });
            }
          } else {
            // 他のサブメニューの場合は、iframeで読み込んで取得
            const url = `/business-plan/company/${planId}/${subMenuItem.path}`;
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.style.width = '0';
            iframe.style.height = '0';
            document.body.appendChild(iframe);
            
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                document.body.removeChild(iframe);
                resolve();
              }, 10000);
              
              iframe.onload = () => {
                setTimeout(() => {
                  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                  if (iframeDoc) {
                    // iframeのスタイルシートを現在のドキュメントにコピー
                    const iframeStyles = Array.from(iframeDoc.querySelectorAll('style, link[rel="stylesheet"]'));
                    iframeStyles.forEach(style => {
                      if (style.tagName === 'STYLE') {
                        const newStyle = document.createElement('style');
                        newStyle.textContent = (style as HTMLStyleElement).textContent;
                        document.head.appendChild(newStyle);
                        addedStyles.push(newStyle);
                      } else if (style.tagName === 'LINK') {
                        const link = style as HTMLLinkElement;
                        const newLink = document.createElement('link');
                        newLink.rel = 'stylesheet';
                        newLink.href = link.href;
                        document.head.appendChild(newLink);
                        addedStyles.push(newLink);
                      }
                    });
                    
                    // 元のページのコンテナ幅を取得
                    const originalContainer = iframeDoc.querySelector('[data-content-container]') as HTMLElement;
                    const originalWidth = originalContainer ? 
                      (iframeDoc.defaultView?.getComputedStyle(originalContainer).width || '1200px') : '1200px';
                    
                    // 一時的なコンテナを作成してレイアウトコンテキストを再現
                    // html2canvasでキャプチャできるように、visibility: visibleにする
                    const tempContainer = document.createElement('div');
                    tempContainer.style.position = 'absolute';
                    tempContainer.style.left = '0';
                    tempContainer.style.top = '0';
                    tempContainer.style.width = originalWidth;
                    tempContainer.style.visibility = 'visible';
                    tempContainer.style.opacity = '0';
                    tempContainer.style.pointerEvents = 'none';
                    tempContainer.style.zIndex = '-1';
                    document.body.appendChild(tempContainer);
                    tempContainers.push(tempContainer);
                    
                    const containers = Array.from(iframeDoc.querySelectorAll('[data-page-container]')) as HTMLElement[];
                    containers.forEach(c => {
                      // コンテナを現在のドキュメントにクローン
                      const clonedContainer = c.cloneNode(true) as HTMLElement;
                      
                      // 元の要素のcomputed styleを取得して適用
                      const originalStyle = iframeDoc.defaultView?.getComputedStyle(c);
                      if (originalStyle) {
                        clonedContainer.style.width = originalStyle.width;
                        clonedContainer.style.height = originalStyle.height;
                        clonedContainer.style.margin = originalStyle.margin;
                        clonedContainer.style.padding = originalStyle.padding;
                        clonedContainer.style.display = originalStyle.display;
                        clonedContainer.style.position = originalStyle.position;
                        // flexbox関連のスタイルを保持
                        clonedContainer.style.flex = originalStyle.flex;
                        clonedContainer.style.flexDirection = originalStyle.flexDirection;
                        clonedContainer.style.flexWrap = originalStyle.flexWrap;
                        clonedContainer.style.alignItems = originalStyle.alignItems;
                        clonedContainer.style.justifyContent = originalStyle.justifyContent;
                        clonedContainer.style.minWidth = originalStyle.minWidth;
                        clonedContainer.style.maxWidth = originalStyle.maxWidth;
                        clonedContainer.style.minHeight = originalStyle.minHeight;
                        clonedContainer.style.maxHeight = originalStyle.maxHeight;
                        clonedContainer.style.gap = originalStyle.gap;
                      }
                      
                      // 子要素のスタイルも保持（特にflexboxレイアウト）
                      const cloneAllElementStyles = (originalEl: HTMLElement, clonedEl: HTMLElement) => {
                        const originalChildren = originalEl.children;
                        const clonedChildren = clonedEl.children;
                        
                        for (let i = 0; i < originalChildren.length && i < clonedChildren.length; i++) {
                          const originalChild = originalChildren[i] as HTMLElement;
                          const clonedChild = clonedChildren[i] as HTMLElement;
                          const childStyle = iframeDoc.defaultView?.getComputedStyle(originalChild);
                          
                          if (childStyle) {
                            clonedChild.style.width = childStyle.width;
                            clonedChild.style.height = childStyle.height;
                            clonedChild.style.margin = childStyle.margin;
                            clonedChild.style.padding = childStyle.padding;
                            clonedChild.style.display = childStyle.display;
                            clonedChild.style.position = childStyle.position;
                            clonedChild.style.flex = childStyle.flex;
                            clonedChild.style.flexDirection = childStyle.flexDirection;
                            clonedChild.style.flexWrap = childStyle.flexWrap;
                            clonedChild.style.alignItems = childStyle.alignItems;
                            clonedChild.style.justifyContent = childStyle.justifyContent;
                            clonedChild.style.minWidth = childStyle.minWidth;
                            clonedChild.style.maxWidth = childStyle.maxWidth;
                            clonedChild.style.minHeight = childStyle.minHeight;
                            clonedChild.style.maxHeight = childStyle.maxHeight;
                            clonedChild.style.gap = childStyle.gap;
                            clonedChild.style.textAlign = childStyle.textAlign;
                            clonedChild.style.verticalAlign = childStyle.verticalAlign;
                            
                            // flexプロパティを持つ要素の幅を固定値に変換（PDF出力時の位置ズレを防ぐため）
                            if (childStyle.flex && childStyle.flex !== 'none' && childStyle.flex !== '0 0 auto') {
                              const actualWidth = originalChild.offsetWidth || originalChild.scrollWidth;
                              if (actualWidth > 0) {
                                clonedChild.style.width = `${actualWidth}px`;
                                clonedChild.style.flex = '0 0 auto'; // flexを無効化して固定幅にする
                              }
                            }
                          }
                          
                          // 再帰的に子要素のスタイルも保持
                          cloneAllElementStyles(originalChild, clonedChild);
                        }
                      };
                      
                      cloneAllElementStyles(c, clonedContainer);
                      
                      // SVG要素のスタイルも保持
                      const svgElements = clonedContainer.querySelectorAll('svg');
                      const originalSvgElements = c.querySelectorAll('svg');
                      svgElements.forEach((svg, index) => {
                        if (index < originalSvgElements.length) {
                          const originalSvg = originalSvgElements[index] as SVGSVGElement;
                          const svgStyle = iframeDoc.defaultView?.getComputedStyle(originalSvg);
                          if (svgStyle) {
                            const svgEl = svg as unknown as HTMLElement;
                            svgEl.style.width = svgStyle.width;
                            svgEl.style.height = svgStyle.height;
                            svgEl.style.maxWidth = svgStyle.maxWidth;
                            svgEl.style.maxHeight = svgStyle.maxHeight;
                            svgEl.style.margin = svgStyle.margin;
                            svgEl.style.display = svgStyle.display;
                            svgEl.style.position = svgStyle.position;
                            
                            // SVGのwidth属性が"100%"の場合は、実際の幅を計算して固定値に変換
                            const widthAttr = originalSvg.getAttribute('width');
                            const heightAttr = originalSvg.getAttribute('height');
                            const viewBox = originalSvg.getAttribute('viewBox');
                            
                            if (widthAttr === '100%' && svgStyle.width && svgStyle.width !== 'auto') {
                              // 実際の幅を取得して固定値に変換
                              const actualWidth = parseFloat(svgStyle.width);
                              if (!isNaN(actualWidth) && actualWidth > 0) {
                                svg.setAttribute('width', `${actualWidth}px`);
                              } else if (viewBox) {
                                // viewBoxから幅を取得
                                const viewBoxValues = viewBox.split(' ');
                                if (viewBoxValues.length >= 3) {
                                  const viewBoxWidth = parseFloat(viewBoxValues[2]);
                                  if (!isNaN(viewBoxWidth) && viewBoxWidth > 0) {
                                    svg.setAttribute('width', `${viewBoxWidth}px`);
                                  }
                                }
                              }
                            } else if (widthAttr) {
                              svg.setAttribute('width', widthAttr);
                            }
                            
                            if (heightAttr) {
                              svg.setAttribute('height', heightAttr);
                            }
                            
                            // viewBoxとpreserveAspectRatioも保持
                            if (viewBox) {
                              svg.setAttribute('viewBox', viewBox);
                            }
                            const preserveAspectRatio = originalSvg.getAttribute('preserveAspectRatio');
                            if (preserveAspectRatio) {
                              svg.setAttribute('preserveAspectRatio', preserveAspectRatio);
                            }
                          }
                        }
                      });
                      
                      // 画像のパスを絶対パスに変換
                      const images = clonedContainer.querySelectorAll('img');
                      images.forEach(img => {
                        const imgSrc = img.getAttribute('src') || img.src;
                        if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) {
                          try {
                            // 相対パスの場合は現在のページのベースURLを使用
                            const baseUrl = window.location.origin + url.replace(/\/[^/]*$/, '/');
                            const absoluteUrl = new URL(imgSrc, baseUrl);
                            img.src = absoluteUrl.href;
                          } catch (e) {
                            // エラーの場合は元のsrcをそのまま使用
                            console.warn('画像パスの変換に失敗:', imgSrc, e);
                          }
                        }
                      });
                      
                      tempContainer.appendChild(clonedContainer);
                      allContainers.push({ container: clonedContainer, subMenuId, subMenuLabel: subMenuItem.label });
                    });
                  }
                  document.body.removeChild(iframe);
                  clearTimeout(timeout);
                  resolve();
                }, 2000);
              };
              
              iframe.onerror = () => {
                document.body.removeChild(iframe);
                clearTimeout(timeout);
                resolve();
              };
              
              iframe.src = url;
            });
          }
        } else {
          // 固定ページ版の場合
          if (subMenuId === currentSubMenu) {
            const container = contentContainerRef.current;
            if (container) {
              let containers = Array.from(container.querySelectorAll('[data-page-container]')) as HTMLElement[];
              if (containers.length === 0) {
                containers = Array.from(container.querySelectorAll('*')).filter((el: Element) => {
                  const htmlEl = el as HTMLElement;
                  const style = window.getComputedStyle(htmlEl);
                  const inlineStyle = htmlEl.style.border || '';
                  return style.border.includes('dashed') || inlineStyle.includes('dashed');
                }) as HTMLElement[];
              }
              containers.forEach(c => {
                allContainers.push({ container: c, subMenuId, subMenuLabel: subMenuItem.label });
              });
            }
          } else {
            // 他のサブメニューの場合は、iframeで読み込んで取得
            const url = `/business-plan/company/${planId}/${subMenuItem.path}`;
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.style.width = '0';
            iframe.style.height = '0';
            document.body.appendChild(iframe);
            
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                document.body.removeChild(iframe);
                resolve();
              }, 10000);
              
              iframe.onload = () => {
                setTimeout(() => {
                  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                  if (iframeDoc) {
                    // iframeのスタイルシートを現在のドキュメントにコピー
                    const iframeStyles = Array.from(iframeDoc.querySelectorAll('style, link[rel="stylesheet"]'));
                    iframeStyles.forEach(style => {
                      if (style.tagName === 'STYLE') {
                        const newStyle = document.createElement('style');
                        newStyle.textContent = (style as HTMLStyleElement).textContent;
                        document.head.appendChild(newStyle);
                        addedStyles.push(newStyle);
                      } else if (style.tagName === 'LINK') {
                        const link = style as HTMLLinkElement;
                        const newLink = document.createElement('link');
                        newLink.rel = 'stylesheet';
                        newLink.href = link.href;
                        document.head.appendChild(newLink);
                        addedStyles.push(newLink);
                      }
                    });
                    
                    // 元のページのコンテナ幅を取得
                    const originalContainer = iframeDoc.querySelector('[data-content-container]') as HTMLElement;
                    const originalWidth = originalContainer ? 
                      (iframeDoc.defaultView?.getComputedStyle(originalContainer).width || '1200px') : '1200px';
                    
                    // 一時的なコンテナを作成してレイアウトコンテキストを再現
                    // html2canvasでキャプチャできるように、visibility: visibleにする
                    const tempContainer = document.createElement('div');
                    tempContainer.style.position = 'absolute';
                    tempContainer.style.left = '0';
                    tempContainer.style.top = '0';
                    tempContainer.style.width = originalWidth;
                    tempContainer.style.visibility = 'visible';
                    tempContainer.style.opacity = '0';
                    tempContainer.style.pointerEvents = 'none';
                    tempContainer.style.zIndex = '-1';
                    document.body.appendChild(tempContainer);
                    tempContainers.push(tempContainer);
                    
                    let containers = Array.from(iframeDoc.querySelectorAll('[data-page-container]')) as HTMLElement[];
                    if (containers.length === 0) {
                      containers = Array.from(iframeDoc.querySelectorAll('*')).filter((el: Element) => {
                        const htmlEl = el as HTMLElement;
                        const style = iframeDoc.defaultView?.getComputedStyle(htmlEl);
                        const inlineStyle = htmlEl.style.border || '';
                        return style?.border.includes('dashed') || inlineStyle.includes('dashed');
                      }) as HTMLElement[];
                    }
                    containers.forEach(c => {
                      // コンテナを現在のドキュメントにクローン
                      const clonedContainer = c.cloneNode(true) as HTMLElement;
                      
                      // 元の要素のcomputed styleを取得して適用
                      const originalStyle = iframeDoc.defaultView?.getComputedStyle(c);
                      if (originalStyle) {
                        clonedContainer.style.width = originalStyle.width;
                        clonedContainer.style.height = originalStyle.height;
                        clonedContainer.style.margin = originalStyle.margin;
                        clonedContainer.style.padding = originalStyle.padding;
                        clonedContainer.style.display = originalStyle.display;
                        clonedContainer.style.position = originalStyle.position;
                        // flexbox関連のスタイルを保持
                        clonedContainer.style.flex = originalStyle.flex;
                        clonedContainer.style.flexDirection = originalStyle.flexDirection;
                        clonedContainer.style.flexWrap = originalStyle.flexWrap;
                        clonedContainer.style.alignItems = originalStyle.alignItems;
                        clonedContainer.style.justifyContent = originalStyle.justifyContent;
                        clonedContainer.style.minWidth = originalStyle.minWidth;
                        clonedContainer.style.maxWidth = originalStyle.maxWidth;
                        clonedContainer.style.minHeight = originalStyle.minHeight;
                        clonedContainer.style.maxHeight = originalStyle.maxHeight;
                        clonedContainer.style.gap = originalStyle.gap;
                      }
                      
                      // 子要素のスタイルも保持（特にflexboxレイアウト）
                      const cloneAllElementStyles = (originalEl: HTMLElement, clonedEl: HTMLElement) => {
                        const originalChildren = originalEl.children;
                        const clonedChildren = clonedEl.children;
                        
                        for (let i = 0; i < originalChildren.length && i < clonedChildren.length; i++) {
                          const originalChild = originalChildren[i] as HTMLElement;
                          const clonedChild = clonedChildren[i] as HTMLElement;
                          const childStyle = iframeDoc.defaultView?.getComputedStyle(originalChild);
                          
                          if (childStyle) {
                            clonedChild.style.width = childStyle.width;
                            clonedChild.style.height = childStyle.height;
                            clonedChild.style.margin = childStyle.margin;
                            clonedChild.style.padding = childStyle.padding;
                            clonedChild.style.display = childStyle.display;
                            clonedChild.style.position = childStyle.position;
                            clonedChild.style.flex = childStyle.flex;
                            clonedChild.style.flexDirection = childStyle.flexDirection;
                            clonedChild.style.flexWrap = childStyle.flexWrap;
                            clonedChild.style.alignItems = childStyle.alignItems;
                            clonedChild.style.justifyContent = childStyle.justifyContent;
                            clonedChild.style.minWidth = childStyle.minWidth;
                            clonedChild.style.maxWidth = childStyle.maxWidth;
                            clonedChild.style.minHeight = childStyle.minHeight;
                            clonedChild.style.maxHeight = childStyle.maxHeight;
                            clonedChild.style.gap = childStyle.gap;
                            clonedChild.style.textAlign = childStyle.textAlign;
                            clonedChild.style.verticalAlign = childStyle.verticalAlign;
                            
                            // flexプロパティを持つ要素の幅を固定値に変換（PDF出力時の位置ズレを防ぐため）
                            if (childStyle.flex && childStyle.flex !== 'none' && childStyle.flex !== '0 0 auto') {
                              const actualWidth = originalChild.offsetWidth || originalChild.scrollWidth;
                              if (actualWidth > 0) {
                                clonedChild.style.width = `${actualWidth}px`;
                                clonedChild.style.flex = '0 0 auto'; // flexを無効化して固定幅にする
                              }
                            }
                          }
                          
                          // 再帰的に子要素のスタイルも保持
                          cloneAllElementStyles(originalChild, clonedChild);
                        }
                      };
                      
                      cloneAllElementStyles(c, clonedContainer);
                      
                      // SVG要素のスタイルも保持
                      const svgElements = clonedContainer.querySelectorAll('svg');
                      const originalSvgElements = c.querySelectorAll('svg');
                      svgElements.forEach((svg, index) => {
                        if (index < originalSvgElements.length) {
                          const originalSvg = originalSvgElements[index] as SVGSVGElement;
                          const svgStyle = iframeDoc.defaultView?.getComputedStyle(originalSvg);
                          if (svgStyle) {
                            const svgEl = svg as unknown as HTMLElement;
                            svgEl.style.width = svgStyle.width;
                            svgEl.style.height = svgStyle.height;
                            svgEl.style.maxWidth = svgStyle.maxWidth;
                            svgEl.style.maxHeight = svgStyle.maxHeight;
                            svgEl.style.margin = svgStyle.margin;
                            svgEl.style.display = svgStyle.display;
                            svgEl.style.position = svgStyle.position;
                            
                            // SVGのwidth属性が"100%"の場合は、実際の幅を計算して固定値に変換
                            const widthAttr = originalSvg.getAttribute('width');
                            const heightAttr = originalSvg.getAttribute('height');
                            const viewBox = originalSvg.getAttribute('viewBox');
                            
                            if (widthAttr === '100%' && svgStyle.width && svgStyle.width !== 'auto') {
                              // 実際の幅を取得して固定値に変換
                              const actualWidth = parseFloat(svgStyle.width);
                              if (!isNaN(actualWidth) && actualWidth > 0) {
                                svg.setAttribute('width', `${actualWidth}px`);
                              } else if (viewBox) {
                                // viewBoxから幅を取得
                                const viewBoxValues = viewBox.split(' ');
                                if (viewBoxValues.length >= 3) {
                                  const viewBoxWidth = parseFloat(viewBoxValues[2]);
                                  if (!isNaN(viewBoxWidth) && viewBoxWidth > 0) {
                                    svg.setAttribute('width', `${viewBoxWidth}px`);
                                  }
                                }
                              }
                            } else if (widthAttr) {
                              svg.setAttribute('width', widthAttr);
                            }
                            
                            if (heightAttr) {
                              svg.setAttribute('height', heightAttr);
                            }
                            
                            // viewBoxとpreserveAspectRatioも保持
                            if (viewBox) {
                              svg.setAttribute('viewBox', viewBox);
                            }
                            const preserveAspectRatio = originalSvg.getAttribute('preserveAspectRatio');
                            if (preserveAspectRatio) {
                              svg.setAttribute('preserveAspectRatio', preserveAspectRatio);
                            }
                          }
                        }
                      });
                      
                      // 画像のパスを絶対パスに変換
                      const images = clonedContainer.querySelectorAll('img');
                      images.forEach(img => {
                        const imgSrc = img.getAttribute('src') || img.src;
                        if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) {
                          try {
                            // 相対パスの場合は現在のページのベースURLを使用
                            const baseUrl = window.location.origin + url.replace(/\/[^/]*$/, '/');
                            const absoluteUrl = new URL(imgSrc, baseUrl);
                            img.src = absoluteUrl.href;
                          } catch (e) {
                            // エラーの場合は元のsrcをそのまま使用
                            console.warn('画像パスの変換に失敗:', imgSrc, e);
                          }
                        }
                      });
                      
                      tempContainer.appendChild(clonedContainer);
                      allContainers.push({ container: clonedContainer, subMenuId, subMenuLabel: subMenuItem.label });
                    });
                  }
                  document.body.removeChild(iframe);
                  clearTimeout(timeout);
                  resolve();
                }, 2000);
              };
              
              iframe.onerror = () => {
                document.body.removeChild(iframe);
                clearTimeout(timeout);
                resolve();
              };
              
              iframe.src = url;
            });
          }
        }
      }
      
      if (allContainers.length === 0) {
        alert('コンテナが見つかりません。コンテナ表示モードでPDF出力してください。');
        return;
      }

      console.log('PDF出力対象のコンテナ数:', allContainers.length);
      
      // レイアウトの再計算を待つ（flexboxレイアウトが正しく計算されるように）
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // すべての一時的なコンテナの幅を再計算
      tempContainers.forEach(tempContainer => {
        const firstChild = tempContainer.firstElementChild as HTMLElement;
        if (firstChild) {
          const computedStyle = window.getComputedStyle(firstChild);
          const originalWidth = computedStyle.width;
          if (originalWidth && originalWidth !== 'auto') {
            tempContainer.style.width = originalWidth;
          }
        }
      });
      
      // 再度レイアウトの再計算を待つ
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Page0（キービジュアル）を最初に配置
      const page0Index = allContainers.findIndex(c => c.container.getAttribute('data-page-container') === '0');
      if (page0Index > 0) {
        const page0 = allContainers.splice(page0Index, 1)[0];
        allContainers.unshift(page0);
      }

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
      for (let i = 0; i < allContainers.length; i++) {
        const containerInfo = allContainers[i];
        const containerEl = containerInfo.container;
        const subMenuId = containerInfo.subMenuId;
        
        // キービジュアルコンテナかどうかを判定（data-page-container="0"）
        const isKeyVisual = containerEl.getAttribute('data-page-container') === '0';
        
        // 元のborderスタイルを保存
        const originalBorder = containerEl.style.border;
        
        // PDF出力時に非表示にする要素を追跡する配列（各コンテナごとに初期化）
        const hiddenElements: Array<{ element: HTMLElement; originalDisplay: string }> = [];
        
        // PDF出力時は点線を非表示にする
        containerEl.style.border = 'none';
        
        // PDF出力時に編集ボタン（↑、↓、編集、ゴミ箱）を非表示にする
        const controlButtons = containerEl.querySelectorAll('.container-control-buttons');
        controlButtons.forEach((buttonGroup) => {
          const buttonGroupEl = buttonGroup as HTMLElement;
          const originalDisplay = buttonGroupEl.style.display || window.getComputedStyle(buttonGroupEl).display;
          hiddenElements.push({ element: buttonGroupEl, originalDisplay });
          buttonGroupEl.style.display = 'none';
        });
        
        // PDF出力時に右上のページ番号を非表示にする（右下にページ番号が出力されるため）
        const pageNumbers = containerEl.querySelectorAll('.container-page-number');
        pageNumbers.forEach((pageNumber) => {
          const pageNumberEl = pageNumber as HTMLElement;
          const originalDisplay = pageNumberEl.style.display || window.getComputedStyle(pageNumberEl).display;
          hiddenElements.push({ element: pageNumberEl, originalDisplay });
          pageNumberEl.style.display = 'none';
        });
        
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

        // 各ページのタイトルを左上に追加（コンテンツに依存せず固定位置・固定サイズ）
        // コンテナからタイトルを取得（PDF出力前にタイトル要素を非表示にするため、先に取得）
        let pageTitle = '';
        let titleElement: HTMLElement | null = null;
        if (!isKeyVisual) {
          // 固定ページ形式・コンポーネント形式の両方に対応：data-pdf-title-h3属性でタイトル要素を探す
          titleElement = containerEl.querySelector('[data-pdf-title-h3="true"]') as HTMLElement;
          if (titleElement) {
            pageTitle = titleElement.textContent?.trim() || '';
            // タイトル要素を非表示にして、PDF出力時に2重表示を防ぐ
            const originalTitleDisplay = titleElement.style.display || window.getComputedStyle(titleElement).display;
            hiddenElements.push({ element: titleElement, originalDisplay: originalTitleDisplay });
            titleElement.style.display = 'none';
          }
          // タイトルが見つからない場合、data属性から取得を試みる（固定ページ形式のみ）
          if (!pageTitle && db) {
            const containerId = containerEl.getAttribute('data-page-container');
            if (containerId && containerId !== '0') {
              // 固定ページコンテナの場合は、Firestoreからタイトルを取得
              try {
                const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
                if (planDoc.exists()) {
                  const data = planDoc.data();
                  const containersBySubMenu = data.fixedPageContainersBySubMenu || {};
                  const containers = containersBySubMenu[subMenuId] || [];
                  const containerIndex = parseInt(containerId) - 1;
                  if (containers[containerIndex]) {
                    pageTitle = containers[containerIndex].title || '';
                  }
                }
              } catch (error) {
                console.error('タイトル取得エラー:', error);
              }
            }
          }
        }
        
        // タイトルを左上に追加（固定位置・固定サイズ）
        // 日本語フォントの問題を回避するため、html2canvasを使用して画像として追加
        // タイトルは最後に追加して、コンテンツの上に表示されるようにする
        let titleImgData: string | null = null;
        let titleWidth: number = 0;
        let titleHeight: number = 0;
        let titleX: number = 0;
        let titleY: number = 0;
        let titlePageTitle: string = '';
        
        if (pageTitle) {
          try {
            titlePageTitle = pageTitle;
            // タイトル要素を一時的なDOM要素として作成（通常表示と同じスタイル）
            const titleDiv = document.createElement('div');
            titleDiv.style.position = 'absolute';
            titleDiv.style.left = '-9999px';
            titleDiv.style.top = '-9999px';
            titleDiv.style.backgroundColor = 'transparent';
            titleDiv.style.color = 'var(--color-text)'; // 通常表示と同じ色
            titleDiv.style.fontFamily = 'sans-serif';
            titleDiv.style.fontSize = `${plan?.titleFontSize || 12}px`; // 設定値またはデフォルト12px
            titleDiv.style.fontWeight = '600'; // 太字
            titleDiv.style.lineHeight = '1.5';
            titleDiv.style.whiteSpace = 'nowrap';
            titleDiv.style.display = 'inline-block'; // 幅を正しく計算するために追加
            // ボーダーの有無を設定に応じて反映（デフォルトは有り）
            const borderEnabled = plan?.titleBorderEnabled !== false; // undefinedの場合はtrue（デフォルト）
            if (borderEnabled) {
              titleDiv.style.borderLeft = '3px solid var(--color-primary)'; // 左側に3pxの縦棒
              titleDiv.style.paddingLeft = '8px'; // 縦棒とテキストの間隔
            } else {
              titleDiv.style.borderLeft = 'none';
              titleDiv.style.paddingLeft = '0';
            }
            titleDiv.style.margin = '0';
            titleDiv.style.marginBottom = '12px'; // 通常表示と同じマージン
            titleDiv.textContent = pageTitle;
            
            document.body.appendChild(titleDiv);
            
            // レンダリングを待つ
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // html2canvasで画像化（width/heightを指定せず自動計算させる）
            const titleCanvas = await html2canvas(titleDiv, {
              scale: 2,
              backgroundColor: null,
              useCORS: true,
              logging: false,
              // width/heightを指定しないことで、要素の実際のサイズを自動計算
            });
            
            titleImgData = titleCanvas.toDataURL('image/png');
            
            // 画像のサイズを計算（mm単位、96dpi基準）
            titleWidth = (titleCanvas.width / 2) * 0.264583; // scale: 2なので2で割る
            titleHeight = (titleCanvas.height / 2) * 0.264583;
            
            // 左上の位置を計算（設定値またはデフォルト値を使用）
            titleX = margin + (plan?.titlePositionX ?? 5); // 左端からの距離（mm）
            titleY = margin + (plan?.titlePositionY ?? -3); // 上端からの距離（mm）
            
            // 一時的なDOM要素を削除
            if (document.body.contains(titleDiv)) {
              document.body.removeChild(titleDiv);
            }
          } catch (error) {
            console.error('タイトル画像の生成エラー:', error);
            // エラーが発生した場合は、後でテキストとして追加を試みる
          }
        }

        // キービジュアルの場合は、画像要素を直接取得してアスペクト比を計算
        // また、PDF出力時に不要なボタンを非表示にする
        let targetAspectRatio: number | null = null;
        let keyVisualImageUrl: string | null = null;
        let keyVisualScale: number = 100; // デフォルトは100%（スケールなし）
        
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
          
          // キービジュアルのスケール設定を取得（planから）
          if (plan?.keyVisualScale) {
            keyVisualScale = plan.keyVisualScale;
          } else {
            // planにない場合は、画像要素のtransform: scale()から取得を試みる
          const imgElement = containerEl.querySelector('img') as HTMLImageElement;
            if (imgElement) {
              const transform = window.getComputedStyle(imgElement).transform;
              if (transform && transform !== 'none') {
                const matrix = transform.match(/matrix\(([^)]+)\)/);
                if (matrix) {
                  const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
                  // matrix(a, b, c, d, e, f) の a と d がスケール値
                  if (values.length >= 4) {
                    const scaleX = values[0];
                    const scaleY = values[3];
                    // 平均を取る（通常は同じ値）
                    keyVisualScale = ((scaleX + scaleY) / 2) * 100;
                  }
                }
              }
            }
          }
          
          const imgElement = containerEl.querySelector('img') as HTMLImageElement;
          if (imgElement) {
            // 画像URLを保存
            keyVisualImageUrl = imgElement.src;
            
            // 画像の読み込みを確実に待つ
            if (!imgElement.complete) {
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
            }
            
            // 画像の実際のアスペクト比を取得（naturalWidth/naturalHeight）
            if (imgElement.complete && imgElement.naturalWidth > 0 && imgElement.naturalHeight > 0) {
              targetAspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
              console.log('キービジュアル画像のアスペクト比:', {
                naturalWidth: imgElement.naturalWidth,
                naturalHeight: imgElement.naturalHeight,
                aspectRatio: targetAspectRatio,
                imageUrl: keyVisualImageUrl,
                scale: keyVisualScale,
              });
            }
          }
          
          // 画像のアスペクト比が取得できない場合は、paddingTopから計算
          if (!targetAspectRatio || targetAspectRatio <= 0) {
            const paddingTopElement = containerEl.querySelector('[style*="padding-top"]') as HTMLElement;
            if (paddingTopElement) {
              const paddingTopStyle = window.getComputedStyle(paddingTopElement).paddingTop;
              const paddingTopPercent = parseFloat(paddingTopStyle);
              if (!isNaN(paddingTopPercent) && paddingTopPercent > 0) {
                // paddingTopのパーセンテージからアスペクト比を計算
                // paddingTop: 56.25% = 16:9のアスペクト比
                targetAspectRatio = 100 / paddingTopPercent;
                console.log('paddingTopからアスペクト比を計算:', {
                  paddingTop: paddingTopPercent,
                  aspectRatio: targetAspectRatio,
                });
              }
            }
          }
          
          // それでも取得できない場合は、デフォルトの16:9を使用
          if (!targetAspectRatio || targetAspectRatio <= 0) {
            targetAspectRatio = 16 / 9;
            console.log('デフォルトの16:9アスペクト比を使用');
          }
        }

        // flexboxレイアウトが正しく計算されるように待機
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // コンテナの幅を明示的に設定（flexboxレイアウトが正しく計算されるように）
        const containerComputedStyle = window.getComputedStyle(containerEl);
        if (containerComputedStyle.display === 'flex' || containerComputedStyle.display === 'inline-flex') {
          // flexboxコンテナの幅を明示的に設定
          const parentWidth = containerEl.parentElement 
            ? window.getComputedStyle(containerEl.parentElement).width 
            : '1200px';
          if (parentWidth && parentWidth !== 'auto') {
            containerEl.style.width = parentWidth;
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
                (svgEl as unknown as HTMLElement).style.marginTop = '0';
              }
            }
          }
        });
        
        // コンテナを画像化
        const canvasScale = 2; // 高品質な画像のためのスケール
        const canvas = await html2canvas(containerEl, {
          scale: canvasScale,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: containerEl.scrollWidth,
          height: containerEl.scrollHeight,
          onclone: (clonedDoc, clonedWindow) => {
            try {
              // グラデーションテキストをSVGに変換
              const gradientTextElements = clonedDoc.querySelectorAll('.key-message-title, .gradient-text-blue');
              gradientTextElements.forEach((element) => {
                try {
                  const htmlElement = element as HTMLElement;
                  const text = htmlElement.textContent || '';
                  
                  // 元の要素からスタイルを取得
                  let computedStyle: CSSStyleDeclaration | null = null;
                  try {
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
                  
                  // 親要素のスタイルを取得（元の要素から取得）
                  let textAlign = 'left'; // デフォルトをleftに変更
                  try {
                    // 元の要素から親要素を取得
                    const originalElement = containerEl.querySelector(`.${Array.from(htmlElement.classList).join('.')}`) as HTMLElement;
                    if (originalElement && originalElement.parentElement) {
                      const parentComputedStyle = window.getComputedStyle(originalElement.parentElement);
                      textAlign = parentComputedStyle.textAlign || 'left';
                    }
                  } catch (e) {
                    // エラーが発生した場合はデフォルト値（left）を使用
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
                  const svgWidth = originalWidth > 0 ? originalWidth : 800;
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
                  stop2.setAttribute('stop-color', '#00D9A5');
                  gradient.appendChild(stop2);
                  
                  defs.appendChild(gradient);
                  svg.appendChild(defs);
                  
                  // テキスト要素
                  const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  // textAlignに応じてx座標とtext-anchorを設定
                  let textX: number;
                  let textAnchor: string;
                  if (textAlign === 'center') {
                    textX = svgWidth / 2;
                    textAnchor = 'middle';
                  } else if (textAlign === 'right') {
                    textX = svgWidth;
                    textAnchor = 'end';
                  } else {
                    // left（デフォルト）
                    textX = 0;
                    textAnchor = 'start';
                  }
                  textElement.setAttribute('x', textX.toString());
                  textElement.setAttribute('y', (svgHeight / 2).toString());
                  textElement.setAttribute('text-anchor', textAnchor);
                  textElement.setAttribute('dominant-baseline', 'middle');
                  textElement.setAttribute('font-size', fontSize);
                  textElement.setAttribute('font-weight', fontWeight);
                  textElement.setAttribute('font-family', computedStyle.fontFamily || 'inherit');
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
          (svg as unknown as HTMLElement).style.marginTop = originalSvgMarginTop;
        });
        
        // 元のborderスタイルを復元
        containerEl.style.border = originalBorder;

        // キービジュアルの場合は、実際の画像URLから直接画像を取得してPDFに追加
        if (isKeyVisual && keyVisualImageUrl && targetAspectRatio && targetAspectRatio > 0) {
          try {
            // 画像をfetchしてBase64に変換
            const response = await fetch(keyVisualImageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            const imageBase64 = await new Promise<string>((resolve, reject) => {
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

            // 画像の形式を自動検出
            const imageFormat = imageBase64.split(';')[0].split('/')[1].toUpperCase();
        
            // アスペクト比を維持しながら、ページサイズに収まるようにサイズを計算
            let finalWidth = contentWidth;
            let finalHeight = contentWidth / targetAspectRatio;
            
            // 高さがページを超える場合は、高さ基準で再計算
            if (finalHeight > contentHeight) {
              finalHeight = contentHeight;
              finalWidth = contentHeight * targetAspectRatio;
            }
            
            // 幅がページを超える場合は、幅基準で再計算
            if (finalWidth > contentWidth) {
              finalWidth = contentWidth;
              finalHeight = contentWidth / targetAspectRatio;
            }
            
            // スケール設定を反映（keyVisualScaleは%単位なので、100で割る）
            const scaleFactor = keyVisualScale / 100;
            finalWidth = finalWidth * scaleFactor;
            finalHeight = finalHeight * scaleFactor;
        
            // スケール適用後、ページサイズを超えないように再調整
            if (finalWidth > contentWidth) {
              const scaleDown = contentWidth / finalWidth;
              finalWidth = contentWidth;
              finalHeight = finalHeight * scaleDown;
            }
            if (finalHeight > contentHeight) {
              const scaleDown = contentHeight / finalHeight;
              finalHeight = contentHeight;
              finalWidth = finalWidth * scaleDown;
            }
            
            console.log('PDF出力: キービジュアル画像を直接追加', {
              finalWidth,
              finalHeight,
              aspectRatio: targetAspectRatio,
              scale: keyVisualScale,
              scaleFactor,
              contentWidth,
              contentHeight,
              imageFormat,
            });
            
            // 中央揃えのための位置調整
            const xOffset = (contentWidth - finalWidth) / 2;
            const yOffset = (contentHeight - finalHeight) / 2;

            // PDFに画像を直接追加（アスペクト比とスケールを維持）
            pdf.addImage(imageBase64, imageFormat, margin + xOffset, margin + yOffset, finalWidth, finalHeight);
          } catch (error) {
            console.error('キービジュアル画像の直接追加に失敗、canvasを使用:', error);
            // エラーの場合は、通常のcanvas方式にフォールバック
            const imgData = canvas.toDataURL('image/png', 1.0);
            const imgAspectRatio = targetAspectRatio;
        let finalWidth = contentWidth;
        let finalHeight = contentWidth / imgAspectRatio;
            if (finalHeight > contentHeight) {
              finalHeight = contentHeight;
              finalWidth = contentHeight * imgAspectRatio;
            }
            if (finalWidth > contentWidth) {
              finalWidth = contentWidth;
              finalHeight = contentWidth / imgAspectRatio;
            }
            const xOffset = (contentWidth - finalWidth) / 2;
            const yOffset = (contentHeight - finalHeight) / 2;
            pdf.addImage(imgData, 'PNG', margin + xOffset, margin + yOffset, finalWidth, finalHeight);
          }
        } else {
          // 通常のコンテナの場合は、canvasを使用
          const imgData = canvas.toDataURL('image/png', 1.0);
          
          // canvasのサイズをscaleで割って、実際のコンテナサイズを取得
          const actualCanvasWidth = canvas.width / canvasScale;
          const actualCanvasHeight = canvas.height / canvasScale;
          const imgAspectRatio = actualCanvasWidth / actualCanvasHeight;
          
          // コンテナの実際のサイズとPDFのコンテンツサイズを比較して、適切なサイズを計算
          // コンテナのアスペクト比を維持しつつ、PDFのコンテンツエリアに収まるようにする
          let finalWidth = contentWidth;
          let finalHeight = contentWidth / imgAspectRatio;
          
        if (finalHeight > contentHeight) {
          finalHeight = contentHeight;
          finalWidth = contentHeight * imgAspectRatio;
        }
        
          if (finalWidth > contentWidth) {
            finalWidth = contentWidth;
            finalHeight = contentWidth / imgAspectRatio;
          }
          
        const xOffset = (contentWidth - finalWidth) / 2;
          const yOffset = (contentHeight - finalHeight) / 2;

        pdf.addImage(imgData, 'PNG', margin + xOffset, margin + yOffset, finalWidth, finalHeight);
        }
        
        // ロゴを右上に追加（plan.keyVisualLogoUrlが存在する場合）
        // ロゴが上に表示されるように、コンテンツの後に追加する
        if (plan?.keyVisualLogoUrl) {
          const logoUrl = plan.keyVisualLogoUrl;
          try {
            // 画像を読み込んでcanvasに描画（透明度の問題を回避するため）
            const img = new Image();
            img.crossOrigin = 'anonymous'; // CORSエラーを回避
            
            const logoImageData = await new Promise<{ width: number; height: number; canvas: HTMLCanvasElement }>((resolve, reject) => {
              img.onload = () => {
                // canvasを作成して画像を描画（白背景で合成）
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                  reject(new Error('Canvas context could not be created'));
                  return;
                }
                
                // 白背景で塗りつぶし（透明度の問題を回避）
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 画像を描画
                ctx.drawImage(img, 0, 0);
                
                resolve({ width: img.width, height: img.height, canvas });
              };
              img.onerror = reject;
              img.src = logoUrl;
            });

            const logoAspectRatio = logoImageData.width / logoImageData.height;
            const logoMargin = 5; // ロゴのマージン（mm）
            // ロゴサイズをplanから取得（デフォルトは15mm）
            const logoHeight = plan?.keyVisualLogoSize || 15; // ロゴの高さ（mm）
            const logoWidth = logoHeight * logoAspectRatio; // アスペクト比を維持して幅を計算
            
            // 右上の位置を計算（ページサイズからマージンとロゴサイズを引く）
            const logoX = pageWidth - logoMargin - logoWidth;
            const logoY = logoMargin;
            
            // canvasからBase64データURLを取得（PNG形式、透明度なし）
            const logoBase64 = logoImageData.canvas.toDataURL('image/png');
            
            // ロゴ画像をPDFページに直接追加（アスペクト比を維持）
            pdf.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
          } catch (error) {
            console.error('ロゴの追加エラー:', error);
            // エラーが発生してもPDF生成は続行
          }
        }
        
        // キービジュアル（1ページ目）にタイトル、署名、作成日を独立して追加
        // ページコンポーネントの画像とは独立して、PDFページに直接追加
        // 日本語フォントの問題を回避するため、html2canvasを使用して画像として追加
        if (i === 0 && isKeyVisual) {
          // planからメタデータを取得（最新のplanデータを取得するため、PDF生成時に再取得）
          // 最新のplanデータを取得するため、Firestoreから直接読み込む
          let latestMetadata = plan?.keyVisualMetadata;
          if (plan?.id && db) {
            try {
              const planDoc = await getDoc(doc(db, 'companyBusinessPlan', plan.id));
              if (planDoc.exists()) {
                const data = planDoc.data();
                latestMetadata = data.keyVisualMetadata;
                console.log('PDF生成時: Firestoreからメタデータを取得', latestMetadata);
              }
            } catch (error) {
              console.error('メタデータの取得エラー:', error);
            }
          }
          const metadata = latestMetadata;
          console.log('PDF生成時のメタデータ:', JSON.stringify(metadata, null, 2));
          console.log('メタデータの存在チェック:', {
            hasMetadata: !!metadata,
            hasTitle: !!(metadata?.title),
            hasSignature: !!(metadata?.signature),
            hasDate: !!(metadata?.date),
            title: metadata?.title,
            signature: metadata?.signature,
            date: metadata?.date,
            position: metadata?.position
          });
          if (metadata && (metadata.title || metadata.signature || metadata.date)) {
            console.log('メタデータをPDFに追加します');
            const align = metadata.position.align;
            
            // メタデータの位置をそのまま使用（16:9横長のページサイズで設定されているため）
            // 位置調整は行わず、保存された値をそのまま使用
            let textX = metadata.position.x;
            let textY = metadata.position.y;
            
            // 右揃えの場合でも、保存されたX座標をそのまま使用
            // （デフォルト値は既に右端から10mmの位置に設定されている）
            
            // 座標がページ範囲外の場合は調整
            if (textX > pageWidth) {
              textX = pageWidth - 10; // 右端から10mm内側
            }
            if (textX < 0) {
              textX = 10; // 左端から10mm内側
            }
            if (textY > pageHeight) {
              textY = pageHeight - 10; // 下端から10mm上
            }
            if (textY < 0) {
              textY = 10; // 上端から10mm下
            }
            
            console.log('メタデータの位置（調整後）:', { 
              textX, 
              textY, 
              align,
              pageWidth,
              pageHeight,
              originalX: metadata.position.x,
              originalY: metadata.position.y
            });
            
            // メタデータテキストを一時的なDOM要素として作成（テキスト要素のみ）
            const textDiv = document.createElement('div');
            textDiv.style.position = 'absolute';
            textDiv.style.left = '-9999px';
            textDiv.style.top = '-9999px';
            textDiv.style.backgroundColor = 'transparent';
            textDiv.style.color = '#808080'; // グレー色
            textDiv.style.fontFamily = 'sans-serif';
            textDiv.style.lineHeight = '1.5';
            textDiv.style.textAlign = align;
            textDiv.style.display = 'inline-block';
            textDiv.style.whiteSpace = 'nowrap';
            
            // タイトルを追加
            if (metadata.title) {
              const titleFontSize = metadata.titleFontSize || 6;
              const titleElement = document.createElement('div');
              titleElement.textContent = metadata.title;
              titleElement.style.fontSize = `${titleFontSize}pt`;
              titleElement.style.marginBottom = `${titleFontSize * 0.7}pt`;
              titleElement.style.color = '#808080';
              titleElement.style.textAlign = align;
              textDiv.appendChild(titleElement);
            }
            
            // 署名を追加
            if (metadata.signature) {
              const signatureFontSize = metadata.signatureFontSize || 6;
              const signatureElement = document.createElement('div');
              signatureElement.textContent = metadata.signature;
              signatureElement.style.fontSize = `${signatureFontSize}pt`;
              signatureElement.style.marginBottom = `${signatureFontSize * 0.7}pt`;
              signatureElement.style.color = '#808080';
              signatureElement.style.textAlign = align;
              textDiv.appendChild(signatureElement);
            }
            
            // 作成日を追加
            if (metadata.date) {
              const dateFontSize = metadata.dateFontSize || 6;
              const dateElement = document.createElement('div');
              dateElement.textContent = metadata.date;
              dateElement.style.fontSize = `${dateFontSize}pt`;
              dateElement.style.color = '#808080';
              dateElement.style.textAlign = align;
              textDiv.appendChild(dateElement);
            }
            
            document.body.appendChild(textDiv);
            
            // テキスト要素の内容を確認
            console.log('テキスト要素の内容:', {
              textContent: textDiv.textContent,
              innerHTML: textDiv.innerHTML,
              scrollWidth: textDiv.scrollWidth,
              scrollHeight: textDiv.scrollHeight,
              offsetWidth: textDiv.offsetWidth,
              offsetHeight: textDiv.offsetHeight
            });
            
            try {
              // レンダリングを待つ（より長く待つ）
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // html2canvasで画像化（テキスト要素のみ）
              const metadataCanvas = await html2canvas(textDiv, {
                scale: 3, // 高解像度でキャプチャ
                backgroundColor: '#FFFFFF', // 白背景に変更（透明だと見えない可能性がある）
                useCORS: true,
                logging: true, // デバッグ用にログを有効化
                width: textDiv.scrollWidth || 100,
                height: textDiv.scrollHeight || 100,
              });
              
              console.log('html2canvas結果:', {
                canvasWidth: metadataCanvas.width,
                canvasHeight: metadataCanvas.height,
                scrollWidth: textDiv.scrollWidth,
                scrollHeight: textDiv.scrollHeight
              });
              
              const metadataImgData = metadataCanvas.toDataURL('image/png');
              
              // 画像のサイズを計算（mm単位、96dpi基準）
              const imgWidth = (metadataCanvas.width / 3) * 0.264583; // scale: 3なので3で割る
              const imgHeight = (metadataCanvas.height / 3) * 0.264583;
              
              console.log('計算された画像サイズ:', { imgWidth, imgHeight });
              
              // PDFに画像として追加（下端がtextYになるように配置）
              let imgX: number;
              if (align === 'center') {
                imgX = textX - imgWidth / 2;
              } else if (align === 'right') {
                imgX = textX - imgWidth;
              } else {
                imgX = textX;
              }
              const imgY = textY - imgHeight; // 下端がtextYになるように
              
              console.log('メタデータ画像をPDFに追加:', {
                imgX,
                imgY,
                imgWidth,
                imgHeight,
                canvasWidth: metadataCanvas.width,
                canvasHeight: metadataCanvas.height,
                pageWidth,
                pageHeight,
                textX,
                textY,
                align
              });
              
              // 座標がページ範囲内かチェック
              if (imgX < 0 || imgX > pageWidth || imgY < 0 || imgY > pageHeight) {
                console.warn('メタデータ画像の座標がページ範囲外です:', {
                  imgX,
                  imgY,
                  pageWidth,
                  pageHeight
                });
              }
              
              pdf.addImage(metadataImgData, 'PNG', imgX, imgY, imgWidth, imgHeight);
              console.log('メタデータ画像の追加完了');
            } catch (error) {
              console.error('メタデータ画像の生成エラー:', error);
            } finally {
              // 一時的なDOM要素を削除
              if (document.body.contains(textDiv)) {
                document.body.removeChild(textDiv);
              }
            }
          } else {
            console.log('メタデータが存在しないか、タイトル・署名・日付がすべて空です');
          }
        }
        
        // フッターテキストを追加（各ページの下部）
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128); // グレー色
        const footerText = plan?.footerText || 'AI assistant company, Inc - All Rights Reserved'; // 設定値またはデフォルト値
        const textWidth = pdf.getTextWidth(footerText);
        const footerX = (pageWidth - textWidth) / 2; // 中央揃え
        const footerY = pageHeight - 5; // ページ下部から5mm上
        pdf.text(footerText, footerX, footerY);
        
        // ページ番号を右下に追加
        const pageNumber = i + 1;
        const pageNumberText = String(pageNumber);
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100); // ダークグレー色
        const pageNumberWidth = pdf.getTextWidth(pageNumberText);
        const pageNumberX = pageWidth - margin - pageNumberWidth; // 右端からマージン分引いた位置
        const pageNumberY = pageHeight - 5; // ページ下部から5mm上
        pdf.text(pageNumberText, pageNumberX, pageNumberY);
        
        // タイトルを最後に追加（コンテンツの上に表示されるように）
        if (titleImgData && titlePageTitle) {
          try {
            pdf.addImage(titleImgData, 'PNG', titleX, titleY, titleWidth, titleHeight);
          } catch (error) {
            console.error('タイトル画像の追加エラー:', error);
            // エラーの場合は、テキストとして追加を試みる（文字化けする可能性がある）
            pdf.setFontSize(16);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'bold');
            const fallbackTitleX = margin + 5;
            const fallbackTitleY = margin + 8;
            pdf.text(titlePageTitle, fallbackTitleX, fallbackTitleY);
          }
        }
        
        // 非表示にした要素を復元（各コンテナの処理後に復元）
        hiddenElements.forEach(({ element, originalDisplay }) => {
          element.style.display = originalDisplay;
        });
        
        // borderスタイルも復元
        containerEl.style.border = originalBorder;
      }

      // PDFをBlobとして生成して保存（ユーザー操作のコンテキスト内でダウンロードを実行するため）
      const selectedSubMenuLabels = Array.from(selectedSubMenus)
        .map(id => SUB_MENU_ITEMS.find(item => item.id === id)?.label || id)
        .join('_');
      const fileName = selectedSubMenus.size === 1 
        ? `${planTitle}_${selectedSubMenuLabels}_${new Date().toISOString().split('T')[0]}.pdf`
        : `${planTitle}_一括出力_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // PDFをBlobとして生成
      const pdfBlob = pdf.output('blob');

      console.log('PDF生成が完了しました', { blobSize: pdfBlob.size, fileName });
      
      // コールバックが提供されている場合は、それを使用してダウンロードを実行
      // これにより、ユーザーのクリックイベントのコンテキスト内でダウンロードが実行される
      if (downloadCallback) {
        console.log('コールバックを使用してダウンロードを実行');
        try {
          downloadCallback(pdfBlob, fileName);
          console.log('コールバック実行完了');
        } catch (error) {
          console.error('コールバック実行エラー:', error);
          // フォールバック: 直接ダウンロードを試行
          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } else {
        console.log('コールバックなし、直接ダウンロードを試行');
        // フォールバック: 直接ダウンロードを試行
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('PDF出力エラー:', error);
      alert(`PDF出力に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // 一時的なコンテナと追加したスタイルシートを削除
      tempContainers.forEach(container => {
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      });
      addedStyles.forEach(style => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      });
      setIsExportingPDF(false); // 処理完了
      setIsCheckingPages(false); // ページ確認状態をリセット
    }
  }, [showContainers, planTitle, currentSubMenu, plan, planId, isComponentized, checkSubMenuHasPages]);

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
      <MermaidLoader
        config={{
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
          htmlLabels: true,
        }}
        strategy="lazyOnload"
      />
      {!isPresentationMode && (
        <div style={{ display: 'flex', gap: '32px' }}>
          <CompanyPlanSubMenu planId={planId} currentSubMenuId={currentSubMenu} />
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
                        {/* コンポーネント形式の場合はPageBreakEditorを表示 */}
                        {isComponentized && (
                        <PageBreakEditor
                          planId={planId}
                          currentSubMenu={currentSubMenu}
                          pageBreakIds={pageBreakIds}
                          onSave={savePageBreakIds}
                        />
                        )}
                        {showContainers && (
                          <button
                            onClick={handleExportToPDFClick}
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
                          onClick={() => {
                            const newValue = !showContainers;
                            setShowContainers(newValue);
                            // コンポーネント化されたページの場合、既にsetShowContainersがコンテキストのものを指しているので、
                            // 追加の更新は不要
                          }}
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
                        {/* 固定ページからページコンポーネントへの移行ボタン（固定ページ形式の場合のみ表示、すべてのサブメニューで表示） */}
                        {!isComponentized && (
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
                marginTop: '20px',
                marginBottom: '20px',
              }}
              onClick={() => setShowMigrateModal(false)}
              >
                <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '20px', marginBottom: '20px' }}>
                  <MigrateFromFixedPage
                    planId={planId}
                    subMenuId={currentSubMenu}
                    onMigrated={async (newPlanId, targetSubMenuId) => {
                      // 移行後、同じページに戻る（または新しいplanIdに遷移）
                      // appendモードの場合は、追加先のサブメニューに遷移
                      const targetSubMenu = targetSubMenuId || currentSubMenu;
                      if (newPlanId && newPlanId !== planId) {
                        // 新規作成の場合、新しいplanIdに遷移
                        // ページをリロードしてから遷移（planIdが変更されるため）
                        router.push(`/business-plan/company/${newPlanId}/${targetSubMenu}`);
                        // ページを完全にリロードして新しいplanIdでデータを読み込む
                        window.location.href = `/business-plan/company/${newPlanId}/${targetSubMenu}`;
                      } else {
                        // データをリロードしてから遷移
                        await reloadPlan();
                        router.push(`/business-plan/company/${planId}/${targetSubMenu}`);
                      }
                    }}
                    onClose={() => setShowMigrateModal(false)}
                  />
                </div>
              </div>
            )}
            {/* PDF出力サブメニュー選択モーダル */}
            {showPDFSubMenuSelector && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 10001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                transition: 'opacity 0.2s ease-out',
              }}
              onClick={() => setShowPDFSubMenuSelector(false)}
              >
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.3s ease-out',
                  }}
                >
                  {/* ヘッダー */}
                  <div style={{ marginBottom: '24px', borderBottom: '2px solid #F3F4F6', paddingBottom: '16px' }}>
                    <h2 style={{ 
                      margin: 0, 
                      fontSize: '24px', 
                      fontWeight: 700,
                      color: '#1F2937',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: '#10B981',
                        color: '#fff',
                        fontSize: '20px',
                      }}>📄</span>
                      PDF出力するサブメニューを選択
                    </h2>
                    <p style={{ 
                      margin: '8px 0 0 0',
                      fontSize: '14px',
                      color: '#6B7280',
                    }}>
                      出力したいサブメニューを選択してください。複数選択可能です。
                    </p>
                    {isCheckingPages && (
                      <div style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        backgroundColor: '#FEF3C7',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#92400E',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span>⏳</span>
                        <span>ページを確認中...</span>
                      </div>
                    )}
                  </div>

                  {/* 全選択/全解除ボタン */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #E5E7EB',
                  }}>
                    <button
                      onClick={() => {
                        const allWithPages = subMenuPagesStatus.length > 0
                          ? subMenuPagesStatus.filter(status => status.hasPages).map(status => status.id)
                          : SUB_MENU_ITEMS.map(item => item.id);
                        setSelectedSubMenusForPDF(new Set(allWithPages));
                      }}
                      disabled={isCheckingPages}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#E5E7EB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }}
                    >
                      すべて選択
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSubMenusForPDF(new Set([currentSubMenu]));
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#E5E7EB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }}
                    >
                      選択をクリア
                    </button>
                    <div style={{ flex: 1 }} />
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      backgroundColor: '#10B981',
                      color: '#fff',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}>
                      <span>選択中:</span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '24px',
                        height: '24px',
                        padding: '0 8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        fontSize: '14px',
                      }}>
                        {selectedSubMenusForPDF.size}
                      </span>
                    </div>
                  </div>

                  {/* サブメニューリスト */}
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '12px',
                    marginBottom: '24px',
                  }}>
                    {SUB_MENU_ITEMS.map((item, index) => {
                      const isSelected = selectedSubMenusForPDF.has(item.id);
                      
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            const newSelected = new Set(selectedSubMenusForPDF);
                            if (isSelected) {
                              newSelected.delete(item.id);
                            } else {
                              newSelected.add(item.id);
                            }
                            setSelectedSubMenusForPDF(newSelected);
                          }}
                          style={{
                            position: 'relative',
                            padding: '16px',
                            borderRadius: '12px',
                            border: `2px solid ${isSelected ? '#10B981' : '#E5E7EB'}`,
                            backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                          }}
                          onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = isSelected 
                                ? '0 6px 16px rgba(16, 185, 129, 0.2)' 
                                : '0 4px 12px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = isSelected 
                              ? '0 4px 12px rgba(16, 185, 129, 0.15)' 
                              : '0 1px 3px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          {/* チェックボックスアイコン */}
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: `2px solid ${isSelected ? '#10B981' : '#D1D5DB'}`,
                            backgroundColor: isSelected ? '#10B981' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}>
                            {isSelected && (
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>

                          {/* コンテンツ */}
                          <div style={{ paddingRight: '32px' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '8px',
                            }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                backgroundColor: isSelected ? '#10B981' : '#F3F4F6',
                                color: isSelected ? '#FFFFFF' : '#6B7280',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}>
                                {index + 1}
                              </span>
                              <span style={{ 
                                fontSize: '15px', 
                                fontWeight: isSelected ? 600 : 500,
                                color: isSelected ? '#10B981' : '#1F2937',
                              }}>
                                {item.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* フッター */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'flex-end',
                    paddingTop: '20px',
                    borderTop: '2px solid #F3F4F6',
                  }}>
                    <button
                      onClick={() => {
                        setShowPDFSubMenuSelector(false);
                        setSelectedSubMenusForPDF(new Set([currentSubMenu]));
                      }}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#FFFFFF',
                        color: '#374151',
                        border: '2px solid #E5E7EB',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#E5E7EB';
                      }}
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={async () => {
                        if (selectedSubMenusForPDF.size === 0) {
                          alert('少なくとも1つのサブメニューを選択してください。');
                          return;
                        }
                        
                        // ユーザーのクリックイベントのコンテキスト内でダウンロードを実行するためのコールバック
                        const downloadPDF = (blob: Blob, fileName: string) => {
                          console.log('downloadPDFコールバック実行', { blobSize: blob.size, fileName });
                          try {
                            const url = URL.createObjectURL(blob);
                            
                            // 方法1: リンク要素を使用
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = fileName;
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            
                            // ダウンロードを確実に実行するため、すぐにクリック
                            link.click();
                            
                            // クリーンアップを少し遅らせる
                            setTimeout(() => {
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                              console.log('ダウンロードリンククリック完了');
                            }, 1000);
                          } catch (error) {
                            console.error('downloadPDFコールバックエラー:', error);
                            alert('PDFのダウンロードに失敗しました。ブラウザの設定を確認してください。');
                          }
                        };
                        
                        setShowPDFSubMenuSelector(false);
                        await handleExportToPDF(selectedSubMenusForPDF, downloadPDF);
                      }}
                      disabled={selectedSubMenusForPDF.size === 0}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: selectedSubMenusForPDF.size === 0 ? '#D1D5DB' : '#10B981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: selectedSubMenusForPDF.size === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: selectedSubMenusForPDF.size === 0 ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedSubMenusForPDF.size > 0) {
                          e.currentTarget.style.backgroundColor = '#059669';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedSubMenusForPDF.size > 0) {
                          e.currentTarget.style.backgroundColor = '#10B981';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <span>📥</span>
                      <span>PDF出力</span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '24px',
                        height: '24px',
                        padding: '0 8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}>
                        {selectedSubMenusForPDF.size}
                      </span>
                    </button>
                  </div>
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
                position: 'fixed', // fixedに変更して、コンテンツの影響を受けないようにする
                left: showTableOfContents ? '320px' : '20px', // 目次が表示されている時は目次の右側に配置（目次幅280px + マージン40px）
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10003, // 目次（zIndex: 10001）より前面に表示
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
                pointerEvents: 'auto', // クリック可能にする
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
                : subMenuOpen
                  ? 'calc(100% - 200px)' // サブメニューが表示されている時：左右100pxずつのマージン（ボタン用の余白を確保）
                  : 'calc(100% - 100px)', // サブメニューが非表示の時：右側のみ100pxのマージン（横幅を最大に）
              maxWidth: showTableOfContents 
                ? 'calc(100% - 400px)' 
                : subMenuOpen
                  ? '1800px' // サブメニューが表示されている時は通常の最大幅
                  : 'calc(100% - 100px)', // サブメニューが非表示の時は横幅を最大に
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '40px',
              color: 'var(--color-text)',
              marginTop: '80px', // 上部の余白を少し減らして表示幅を広げる
              marginLeft: showTableOfContents 
                ? '400px' // 目次が表示されている時は左矢印ボタン用に400px
                : subMenuOpen
                  ? '100px' // サブメニューが表示されている時は100px
                  : '100px', // サブメニューが非表示の時も左矢印ボタン用に100pxのマージンを確保
              marginRight: showTableOfContents ? '100px' : '100px', // 右矢印ボタン用に100pxのマージン
              marginBottom: '80px', // 下部の余白を少し減らして表示幅を広げる
              animation: slideDirection === 'left' 
                ? 'slideInFromRight 0.3s ease-out'
                : slideDirection === 'right'
                ? 'slideInFromLeft 0.3s ease-out'
                : 'none',
              position: 'relative',
              overflow: isPresentationMode ? 'auto' : 'visible', // プレゼンテーションモード時はスクロール可能にする
              maxHeight: isPresentationMode ? 'calc(100vh - 200px)' : 'none', // プレゼンテーションモード時のみ高さを制限
              paddingBottom: isPresentationMode ? '60px' : '0',
              transition: isPresentationMode 
                ? 'margin-left 0.2s ease-out, width 0.2s ease-out, max-width 0.2s ease-out, margin-right 0.2s ease-out' 
                : 'margin-left 0.3s ease, width 0.3s ease, max-width 0.3s ease, margin-right 0.3s ease',
              // プレゼンテーションモード時はウィンドウサイズに応じてコンテンツサイズを調整
              ...presentationStyle,
            }}
          >
            <ContainerVisibilityProvider showContainers={showContainers} setShowContainers={setShowContainers}>
              <div
                ref={contentRef}
                data-content-container
                style={{
                  // プレゼンテーションモード時もレンダリングを有効にする
                  overflowY: isPresentationMode ? 'auto' : 'visible',
                  overflowX: 'visible',
                  height: isPresentationMode ? 'auto' : 'auto',
                  minHeight: isPresentationMode ? 'calc(100vh - 200px - 60px)' : 'auto',
                  maxHeight: isPresentationMode ? 'calc(100vh - 200px - 60px)' : 'none',
                  position: 'relative',
                  paddingBottom: isPresentationMode ? '60px' : '0',
                }}
              >
                {/* プレゼンテーションモード時はコンテンツを縮小するためのラッパー */}
                {(() => { console.log('レンダリングモード判定:', { isPresentationMode, isComponentized, containersLength: fixedPageContainers.length, currentSubMenu }); return null; })()}
                {isPresentationMode ? (
                  <div
                    style={{
                      transform: 'scale(0.85)',
                      transformOrigin: 'top left',
                      width: '117.65%', // 1 / 0.85 = 1.1765... でスケール後の幅を補正
                    }}
                  >
                    <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>
                      {planTitle}
                    </h2>
                    {children}
                    {/* 固定ページ形式のコンテナはpage.tsxで直接定義されるため、ここでは表示しない */}
                  </div>
                ) : (
                  <>
                    <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>
                      {planTitle}
                    </h2>
                    {children}
                    {/* 固定ページ形式のコンテナはpage.tsxで直接定義されるため、ここでは表示しない */}
                  </>
                )}
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
      
      {/* 固定ページ形式のコンテナ編集モーダル */}
      {!isComponentized && editingContainerId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelEditContainer();
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: 600 }}>
              コンテナを編集
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                タイトル
              </label>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--color-border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                コンテンツ（HTML形式）
              </label>
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '300px',
                  padding: '12px',
                  border: '1px solid var(--color-border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                }}
                placeholder="HTMLタグを使用できます（例: &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;など）"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEditContainer}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#F3F4F6',
                  color: 'var(--color-text)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveEditContainer}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

