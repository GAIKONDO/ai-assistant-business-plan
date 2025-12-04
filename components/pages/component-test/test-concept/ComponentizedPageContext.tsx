'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { pageConfigs, PageConfig } from './pageConfig';
import DynamicPage from './DynamicPage';
import { generatePageMetadata } from '@/lib/pageMetadataUtils';
import { PageMetadata } from '@/types/pageMetadata';
import { updateDoc, serverTimestamp } from 'firebase/firestore';
import { savePageEmbeddingAsync } from '@/lib/pageEmbeddings';
import { SUB_MENU_ITEMS } from '@/components/ConceptSubMenu';

interface ComponentizedPageContextType {
  orderedConfigs: PageConfig[];
  currentPageIndex: number;
  totalPages: number;
  setCurrentPageIndex: (index: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  loading: boolean;
  refreshPages: () => void;
  subMenuId: string;
}

const ComponentizedPageContext = createContext<ComponentizedPageContextType | undefined>(undefined);

export const useComponentizedPage = () => {
  const context = useContext(ComponentizedPageContext);
  if (context === undefined) {
    throw new Error('useComponentizedPage must be used within a ComponentizedPageProvider');
  }
  return context;
};

// オプショナル版：コンテキストが存在しない場合はnullを返す
export const useComponentizedPageOptional = (): ReturnType<typeof useComponentizedPage> | null => {
  const context = useContext(ComponentizedPageContext);
  return context ?? null;
};

interface ComponentizedPageProviderProps {
  children: ReactNode;
}

export function ComponentizedPageProvider({ children }: ComponentizedPageProviderProps) {
  const params = useParams();
  const pathname = usePathname();
  const serviceId = params?.serviceId as string | undefined;
  const conceptId = params?.conceptId as string | undefined;
  
  // 現在のサブメニューIDを取得
  const getCurrentSubMenuId = () => {
    const pathSegments = pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment === conceptId) {
      return 'overview';
    }
    return SUB_MENU_ITEMS.find(item => item.path === lastSegment)?.id || 'overview';
  };
  
  const subMenuId = getCurrentSubMenuId();
  
  const [orderedConfigs, setOrderedConfigs] = useState<PageConfig[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 認証状態を監視
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthReady(!!user);
      if (!user) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Firestoreから順序と動的ページを読み込む（サブメニューごと）
  useEffect(() => {
    // コンポーネント化されたページかどうかを判定
    // conceptIdが-componentizedを含む、または特定のconceptIdの場合はコンポーネント化されたページ
    const isComponentized =
      (serviceId === 'component-test' && conceptId === 'test-concept') ||
      (conceptId && conceptId.includes('-componentized'));
    
    if (!serviceId || !conceptId || !isComponentized) {
      setLoading(false);
      return;
    }

    const loadPageOrder = async () => {
      if (!db || !authReady || !auth?.currentUser) {
        if (!authReady) {
          return;
        }
        setLoading(false);
        return;
      }

      try {
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
          
          // サブメニューごとのページデータを取得
          let pagesBySubMenu = data.pagesBySubMenu as { [key: string]: Array<PageMetadata> } | undefined;
          
          const pageOrderBySubMenu = data.pageOrderBySubMenu as { [key: string]: string[] } | undefined;
          
          // 現在のサブメニューのページデータを取得
          let currentSubMenuPages = (pagesBySubMenu?.[subMenuId] || []) as PageMetadata[];
          const currentSubMenuPageOrder = pageOrderBySubMenu?.[subMenuId];
          
          // overviewの場合は、後方互換性のために古い形式もチェック
          let savedPageOrder: string[] | undefined;
          let dynamicPages: Array<PageMetadata> | undefined;
          
          if (subMenuId === 'overview') {
            savedPageOrder = currentSubMenuPageOrder || (data.pageOrder as string[] | undefined);
            const oldPages = (data.pages as Array<PageMetadata>) || [];
            dynamicPages = currentSubMenuPages.length > 0 ? currentSubMenuPages : oldPages;
          } else {
            savedPageOrder = currentSubMenuPageOrder;
            dynamicPages = currentSubMenuPages;
          }
          
          // 既存のページにメタデータがない場合は自動生成して保存
          if (dynamicPages && dynamicPages.length > 0) {
            const totalPages = Object.values(pagesBySubMenu || {}).reduce((sum, pages) => sum + pages.length, 0);
            let needsUpdate = false;
            const updatedPages = dynamicPages.map((page) => {
              // メタデータがない場合は生成
              if (!page.tags && !page.contentType && !page.semanticCategory) {
                needsUpdate = true;
                // メタデータを生成し、元のページデータのkeyMessageとsubMessageを保持
                const generatedMetadata = generatePageMetadata({
                  id: page.id,
                  pageNumber: page.pageNumber,
                  title: page.title,
                  content: page.content,
                  createdAt: page.createdAt || new Date().toISOString(),
                }, subMenuId, totalPages);
                // keyMessageとsubMessageを保持（存在する場合）
                return {
                  ...generatedMetadata,
                  keyMessage: (page as any).keyMessage,
                  subMessage: (page as any).subMessage,
                };
              }
              return page;
            });
            
            // メタデータを更新する必要がある場合はFirestoreに保存
            if (needsUpdate && db && conceptDoc) {
              try {
                const updatedPagesBySubMenu = {
                  ...pagesBySubMenu,
                  [subMenuId]: updatedPages,
                };
                
                const updateData: any = {
                  pagesBySubMenu: updatedPagesBySubMenu,
                  updatedAt: serverTimestamp(),
                };
                
                // overviewの場合は後方互換性のために古い形式も更新
                if (subMenuId === 'overview') {
                  updateData.pages = updatedPages;
                }
                
                await updateDoc(conceptDoc.ref, updateData);
                console.log('✅ 既存ページにメタデータを自動付与しました:', updatedPages.length, 'ページ');
                
                // ベクトル埋め込みも非同期で生成（メタデータを含む）
                for (const page of updatedPages) {
                  savePageEmbeddingAsync(
                    page.id, 
                    page.title, 
                    page.content, 
                    undefined, 
                    conceptId,
                    {
                      keywords: page.keywords,
                      semanticCategory: page.semanticCategory,
                      tags: page.tags,
                      summary: page.summary,
                    }
                  );
                }
                
                // 更新後のデータを使用
                dynamicPages = updatedPages;
                currentSubMenuPages = updatedPages;
                pagesBySubMenu = updatedPagesBySubMenu;
              } catch (error) {
                console.error('メタデータ自動付与エラー:', error);
              }
            }
          }
          
          // 動的ページをPageConfigに変換
          const dynamicPageConfigs: PageConfig[] = (dynamicPages || []).map((page) => ({
            id: page.id,
            pageNumber: page.pageNumber,
            title: page.title,
            content: page.content, // プレビュー用にcontentを追加
            component: () => (
              <DynamicPage
                pageId={page.id}
                pageNumber={page.pageNumber}
                title={page.title}
                content={page.content}
                keyMessage={(page as any).keyMessage}
                subMessage={(page as any).subMessage}
              />
            ),
          }));
          
          // overviewの場合は固定ページも含める
          let allConfigs: PageConfig[];
          if (subMenuId === 'overview') {
            allConfigs = [...pageConfigs, ...dynamicPageConfigs];
          } else {
            allConfigs = dynamicPageConfigs;
          }
          
          if (savedPageOrder && savedPageOrder.length > 0) {
            const ordered = savedPageOrder
              .map((pageId) => allConfigs.find((config) => config.id === pageId))
              .filter((config): config is PageConfig => config !== undefined);
            
            const missingPages = allConfigs.filter(
              (config) => !savedPageOrder!.includes(config.id)
            );
            
            // Page0（page-0）を常に最初に配置
            const page0Config = allConfigs.find((config) => config.id === 'page-0');
            const otherConfigs = [...ordered, ...missingPages].filter((config) => config.id !== 'page-0');
            
            if (page0Config) {
              setOrderedConfigs([page0Config, ...otherConfigs]);
            } else {
              setOrderedConfigs([...ordered, ...missingPages]);
            }
          } else {
            // ページ番号でソート（Page0を最初に）
            const page0Config = allConfigs.find((config) => config.id === 'page-0');
            const otherConfigs = allConfigs.filter((config) => config.id !== 'page-0').sort((a, b) => a.pageNumber - b.pageNumber);
            
            if (page0Config) {
              setOrderedConfigs([page0Config, ...otherConfigs]);
            } else {
              const sorted = [...allConfigs].sort((a, b) => a.pageNumber - b.pageNumber);
              setOrderedConfigs(sorted);
            }
          }
        } else {
          // データが存在しない場合は、overviewの場合は固定ページを、それ以外は空配列を設定
          if (subMenuId === 'overview') {
            // Page0を常に最初に配置
            setOrderedConfigs(pageConfigs);
          } else {
            setOrderedConfigs([]);
          }
        }
      } catch (error) {
        console.error('ページ順序の読み込みエラー:', error);
        if (subMenuId === 'overview') {
        setOrderedConfigs(pageConfigs);
        } else {
          setOrderedConfigs([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPageOrder().catch((error) => {
      console.error('ページ順序の読み込みで予期しないエラー:', error);
      if (subMenuId === 'overview') {
      setOrderedConfigs(pageConfigs);
      } else {
        setOrderedConfigs([]);
      }
      setLoading(false);
    });
  }, [serviceId, conceptId, authReady, refreshTrigger, subMenuId]);

  const refreshPages = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const totalPages = orderedConfigs.length;

  const goToNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  // ページが変更されたときにリセット
  useEffect(() => {
    setCurrentPageIndex(0);
  }, [serviceId, conceptId, subMenuId]);

  const value: ComponentizedPageContextType = {
    orderedConfigs,
    currentPageIndex,
    totalPages,
    setCurrentPageIndex,
    goToNextPage,
    goToPreviousPage,
    loading,
    refreshPages,
    subMenuId,
  };

  return (
    <ComponentizedPageContext.Provider value={value}>
      {children}
    </ComponentizedPageContext.Provider>
  );
}

