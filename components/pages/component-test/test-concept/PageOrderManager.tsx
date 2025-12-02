'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { collection, query, where, getDocs, doc, setDoc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { pageConfigs, PageConfig } from './pageConfig';
import DynamicPage from './DynamicPage';
import EditPageForm from './EditPageForm';
import { useComponentizedPageOptional } from './ComponentizedPageContext';
import { useComponentizedCompanyPlanPageOptional } from './ComponentizedCompanyPlanPageContext';

interface PageOrderManagerProps {
  serviceId?: string;
  conceptId?: string;
  planId?: string; // 会社本体の事業計画用
  subMenuId: string;
  onOrderChange?: (orderedConfigs: PageConfig[]) => void;
  onPageDeleted?: () => void;
  onPageUpdated?: () => void;
}

function SortablePageItem({ 
  config, 
  index, 
  onDelete,
  onEdit
}: { 
  config: PageConfig; 
  index: number;
  onDelete?: (pageId: string) => void;
  onEdit?: (pageId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 固定ページかどうかを判定
  const isFixedPage = config.id === 'page-0';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDelete && !isFixedPage) {
      onDelete(config.id);
    }
  };

  const handleDeleteMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // ドラッグハンドル用のlisteners（削除ボタン以外に適用）
  const dragHandleListeners = {
    ...listeners,
    onMouseDown: (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      // 編集ボタン、削除ボタン、コピー要素、またはその子要素がクリックされた場合はドラッグを防ぐ
      if (
        target.closest('button[title="ページを削除"]') || 
        target.closest('[data-page-id-copy]') || 
        target.closest('button[title="ページを編集"]') ||
        target.closest('button')?.title === 'ページを編集' ||
        target.closest('button')?.title === 'ページを削除' ||
        target.tagName === 'BUTTON' ||
        (target.parentElement?.tagName === 'BUTTON')
      ) {
        e.stopPropagation();
        e.preventDefault();
        // ネイティブイベントでstopImmediatePropagationを使用
        if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
          (e.nativeEvent as any).stopImmediatePropagation();
        }
        return false;
      }
      if (listeners?.onMouseDown) {
        listeners.onMouseDown(e as any);
      }
    },
    onPointerDown: (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      // 編集ボタン、削除ボタン、コピー要素、またはその子要素がクリックされた場合はドラッグを防ぐ
      if (
        target.closest('button[title="ページを削除"]') || 
        target.closest('[data-page-id-copy]') || 
        target.closest('button[title="ページを編集"]') ||
        target.closest('button')?.title === 'ページを編集' ||
        target.closest('button')?.title === 'ページを削除' ||
        target.tagName === 'BUTTON' ||
        (target.parentElement?.tagName === 'BUTTON')
      ) {
        e.stopPropagation();
        e.preventDefault();
        // ネイティブイベントでstopImmediatePropagationを使用
        if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
          (e.nativeEvent as any).stopImmediatePropagation();
        }
        return false;
      }
      if (listeners?.onPointerDown) {
        listeners.onPointerDown(e as any);
      }
    },
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: '12px 16px',
        marginBottom: '8px',
        backgroundColor: '#fff',
        border: '1px solid var(--color-border-color)',
        borderRadius: '6px',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: isDragging ? '0 4px 8px rgba(0, 0, 0, 0.1)' : '0 1px 2px rgba(0, 0, 0, 0.05)',
        position: 'relative',
      }}
      {...attributes}
      {...dragHandleListeners}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-light)',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        ⋮⋮
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
          {(config as any).title || `ページ ${config.pageNumber}: ${config.id}`}
        </div>
        {/* ページIDを表示（固定ページ以外、または移行したページ） */}
        {((config.id.startsWith('page-') && config.id !== 'page-0') || config.id.startsWith('page-migrated-') || config.id.startsWith('migrated-')) && (
          <div 
            data-page-id-copy="true"
            onClick={async (e) => {
              e.stopPropagation();
              e.preventDefault();
              
              const copyText = config.id;
              const target = e.currentTarget;
              
              // クリップボードAPIを試す
              try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  await navigator.clipboard.writeText(copyText);
                  // 一時的にテキストを変更してコピーしたことを示す
                  const originalText = target.textContent;
                  target.textContent = 'コピーしました！';
                  target.style.color = '#10B981';
                  setTimeout(() => {
                    target.textContent = originalText;
                    target.style.color = 'var(--color-text-light)';
                  }, 1000);
                  return;
                }
              } catch (err) {
                console.log('Clipboard API failed, trying fallback:', err);
              }
              
              // フォールバック: 古い方法を使用
              try {
                const textArea = document.createElement('textarea');
                textArea.value = copyText;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) {
                  // 一時的にテキストを変更してコピーしたことを示す
                  const originalText = target.textContent;
                  target.textContent = 'コピーしました！';
                  target.style.color = '#10B981';
                  setTimeout(() => {
                    target.textContent = originalText;
                    target.style.color = 'var(--color-text-light)';
                  }, 1000);
                } else {
                  throw new Error('execCommand failed');
                }
              } catch (err) {
                console.error('コピーに失敗しました:', err);
                // 最後の手段: テキストを選択状態にしてユーザーに手動コピーを促す
                const range = document.createRange();
                range.selectNodeContents(target);
                const selection = window.getSelection();
                if (selection) {
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
                alert(`コピーに失敗しました。ページID「${copyText}」を手動でコピーしてください。`);
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              // ドラッグを完全に防ぐ
              e.nativeEvent.stopImmediatePropagation();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            style={{ 
              fontSize: '12px', 
              color: 'var(--color-text-light)', 
              marginTop: '2px',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '2px 4px',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="クリックでコピー"
          >
            {config.id}
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: 'var(--color-text-light)',
          backgroundColor: '#F3F4F6',
          padding: '4px 8px',
          borderRadius: '4px',
        }}
      >
        #{index + 1}
      </div>
      {!isFixedPage && (
        <div style={{ display: 'flex', gap: '4px' }}>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // ネイティブイベントでstopImmediatePropagationを使用
                if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                  (e.nativeEvent as any).stopImmediatePropagation();
                }
                onEdit(config.id);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // ネイティブイベントでstopImmediatePropagationを使用
                if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                  (e.nativeEvent as any).stopImmediatePropagation();
                }
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // ネイティブイベントでstopImmediatePropagationを使用
                if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                  (e.nativeEvent as any).stopImmediatePropagation();
                }
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // ネイティブイベントでstopImmediatePropagationを使用
                if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                  (e.nativeEvent as any).stopImmediatePropagation();
                }
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: '#3B82F6',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'background-color 0.2s',
                pointerEvents: 'auto',
                zIndex: 10,
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563EB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3B82F6';
              }}
              title="ページを編集"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              onMouseDown={handleDeleteMouseDown}
              onPointerDown={handleDeleteMouseDown}
              style={{
                padding: '4px 8px',
                backgroundColor: '#EF4444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'background-color 0.2s',
                pointerEvents: 'auto',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#DC2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#EF4444';
              }}
              title="ページを削除"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function PageOrderManager({ serviceId, conceptId, planId, subMenuId, onOrderChange, onPageDeleted, onPageUpdated }: PageOrderManagerProps) {
  // 会社本体の事業計画かどうかを判定
  const isCompanyPlan = !!planId && !serviceId && !conceptId;
  
  // ComponentizedPageContextまたはComponentizedCompanyPlanPageContextからrefreshPagesとorderedConfigsを取得
  // オプショナル版を使用してReact Hooksのルールに準拠
  const companyPlanContext = useComponentizedCompanyPlanPageOptional();
  const servicePlanContext = useComponentizedPageOptional();
  
  let refreshPages: (() => void) | undefined;
  let contextOrderedConfigs: PageConfig[] | undefined;
  if (isCompanyPlan && companyPlanContext) {
    refreshPages = companyPlanContext.refreshPages;
    contextOrderedConfigs = companyPlanContext.orderedConfigs;
  } else if (!isCompanyPlan && servicePlanContext) {
    refreshPages = servicePlanContext.refreshPages;
    contextOrderedConfigs = servicePlanContext.orderedConfigs;
  }
  
  // ContextからorderedConfigsを取得できる場合はそれを使用、そうでない場合は独自に読み込む
  const [orderedConfigs, setOrderedConfigs] = useState<PageConfig[]>(contextOrderedConfigs || (subMenuId === 'overview' ? pageConfigs : []));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // ContextからorderedConfigsを取得できる場合は、それを優先的に使用
  useEffect(() => {
    if (contextOrderedConfigs && contextOrderedConfigs.length > 0) {
      console.log('PageOrderManager - ContextからorderedConfigsを取得:', contextOrderedConfigs);
      console.log('PageOrderManager - Contextから取得したページ数:', contextOrderedConfigs.length);
      setOrderedConfigs(contextOrderedConfigs);
      setLoading(false);
    }
  }, [contextOrderedConfigs]);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageTitle, setEditingPageTitle] = useState('');
  const [editingPageContent, setEditingPageContent] = useState('');

  // すべてのHooksを早期リターンの前に呼び出す（React Hooksのルール）
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // orderedConfigsが変更されたときに親コンポーネントに通知
  // 初回レンダリング時はスキップ（読み込み時の変更は無視）
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 定期的にページを再読み込み（ページが追加された可能性があるため）
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 2000); // 2秒ごとにチェック

    return () => clearInterval(interval);
  }, []);

  // orderedConfigsが変更されたときに親コンポーネントに通知
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    
    if (onOrderChange && orderedConfigs.length > 0) {
      // 次のレンダリングサイクルで呼び出す
      setTimeout(() => {
        onOrderChange(orderedConfigs);
      }, 0);
    }
  }, [orderedConfigs, onOrderChange, isInitialLoad]);

  // Firestoreから順序を読み込む
  useEffect(() => {
    // ContextからorderedConfigsを取得できる場合は、独自の読み込みをスキップ
    if (contextOrderedConfigs && contextOrderedConfigs.length >= 0) {
      // Contextから取得した場合は、独自の読み込みは不要
      return;
    }
    
    // 会社本体の事業計画の場合は、loadCompanyPlanPageOrderを呼ぶ
    if (isCompanyPlan && planId) {
      loadCompanyPlanPageOrder(planId);
      return;
    }
    
    // serviceIdまたはconceptIdが存在しない場合はスキップ
    if (!serviceId || !conceptId) {
      setLoading(false);
      return;
    }

    const loadPageOrder = async () => {
      if (!db || !auth?.currentUser) {
        setLoading(false);
        return;
      }

      try {
        // 構想ドキュメントを検索
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
          const pagesBySubMenu = data.pagesBySubMenu as { [key: string]: Array<{
            id: string;
            pageNumber: number;
            title: string;
            content: string;
          }> } | undefined;
          
          const pageOrderBySubMenu = data.pageOrderBySubMenu as { [key: string]: string[] } | undefined;
          
          // 現在のサブメニューのページデータを取得
          const currentSubMenuPages = pagesBySubMenu?.[subMenuId] || [];
          const currentSubMenuPageOrder = pageOrderBySubMenu?.[subMenuId];
          
          // overviewの場合は、後方互換性のために古い形式もチェック
          let savedPageOrder: string[] | undefined;
          let dynamicPages: Array<{
            id: string;
            pageNumber: number;
            title: string;
            content: string;
          }> | undefined;
          
          if (subMenuId === 'overview') {
            savedPageOrder = currentSubMenuPageOrder || (data.pageOrder as string[] | undefined);
            dynamicPages = currentSubMenuPages.length > 0 ? currentSubMenuPages : (data.pages as Array<{
              id: string;
              pageNumber: number;
              title: string;
              content: string;
            }> | undefined);
          } else {
            savedPageOrder = currentSubMenuPageOrder;
            dynamicPages = currentSubMenuPages;
          }
          
          // 動的ページをPageConfigに変換
          const dynamicPageConfigs: PageConfig[] = (dynamicPages || []).map((page) => ({
            id: page.id,
            pageNumber: page.pageNumber,
            title: page.title,
            component: () => (
              <DynamicPage
                pageId={page.id}
                pageNumber={page.pageNumber}
                title={page.title}
                content={page.content}
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
            // 保存された順序に基づいてページを並び替え
            const ordered = savedPageOrder
              .map((pageId) => allConfigs.find((config) => config.id === pageId))
              .filter((config): config is PageConfig => config !== undefined);
            
            // 保存されていないページを末尾に追加
            const missingPages = allConfigs.filter(
              (config) => !savedPageOrder!.includes(config.id)
            );
            
            setOrderedConfigs([...ordered, ...missingPages]);
          } else {
            // ページ番号でソート
            const sorted = [...allConfigs].sort((a, b) => a.pageNumber - b.pageNumber);
            setOrderedConfigs(sorted);
          }
        } else {
          // データが存在しない場合は、overviewの場合は固定ページを、それ以外は空配列を設定
          if (subMenuId === 'overview') {
          setOrderedConfigs(pageConfigs);
          } else {
            setOrderedConfigs([]);
          }
        }
      } catch (error) {
        console.error('ページ順序の読み込みエラー:', error);
        // エラーが発生してもデフォルト順序を使用して続行
        if (subMenuId === 'overview') {
        setOrderedConfigs(pageConfigs);
        } else {
          setOrderedConfigs([]);
        }
      } finally {
        setLoading(false);
      }
    };

    // エラーハンドリングを追加
    loadPageOrder().catch((error) => {
      console.error('ページ順序の読み込みで予期しないエラー:', error);
      if (subMenuId === 'overview') {
      setOrderedConfigs(pageConfigs);
      } else {
        setOrderedConfigs([]);
      }
      setLoading(false);
    });
    
    loadPageOrder();
  }, [serviceId, conceptId, subMenuId, refreshTrigger, isCompanyPlan, planId]);

  /**
   * 会社本体の事業計画のページ順序を読み込む
   */
  const loadCompanyPlanPageOrder = async (planId: string) => {
    if (!db || !auth?.currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 事業計画ドキュメントを取得
      const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
      
      if (!planDoc.exists()) {
        setOrderedConfigs([]);
        setLoading(false);
        return;
      }

      const planData = planDoc.data();
      
      // サブメニューごとのページデータを取得
      const pagesBySubMenu = planData.pagesBySubMenu as { [key: string]: Array<{
        id: string;
        pageNumber: number;
        title: string;
        content: string;
      }> } | undefined;
      
      const pageOrderBySubMenu = planData.pageOrderBySubMenu as { [key: string]: string[] } | undefined;
      
      // 現在のサブメニューのページデータを取得
      const currentSubMenuPages = pagesBySubMenu?.[subMenuId] || [];
      const currentSubMenuPageOrder = pageOrderBySubMenu?.[subMenuId];
      
      // デバッグログ
      console.log('PageOrderManager - loadCompanyPlanPageOrder:');
      console.log('  planId:', planId);
      console.log('  subMenuId:', subMenuId);
      console.log('  currentSubMenuPages:', currentSubMenuPages);
      console.log('  currentSubMenuPageOrder:', currentSubMenuPageOrder);
      
      // 動的ページをPageConfigに変換
      const dynamicPageConfigs: PageConfig[] = (currentSubMenuPages || []).map((page) => ({
        id: page.id,
        pageNumber: page.pageNumber,
        title: page.title,
        component: () => (
          <DynamicPage
            pageId={page.id}
            pageNumber={page.pageNumber}
            title={page.title}
            content={page.content}
          />
        ),
      }));
      
      console.log('PageOrderManager - dynamicPageConfigs:', dynamicPageConfigs);
      console.log('PageOrderManager - dynamicPageConfigs.length:', dynamicPageConfigs.length);
      
      // overviewの場合は固定ページも含める
      let allConfigs: PageConfig[];
      if (subMenuId === 'overview') {
        allConfigs = [...pageConfigs, ...dynamicPageConfigs];
      } else {
        allConfigs = dynamicPageConfigs;
      }
      
      console.log('PageOrderManager - allConfigs:', allConfigs);
      console.log('PageOrderManager - allConfigs.length:', allConfigs.length);
      
      let finalOrderedConfigs: PageConfig[];
      if (currentSubMenuPageOrder && currentSubMenuPageOrder.length > 0) {
        // 保存された順序に基づいてページを並び替え
        const ordered = currentSubMenuPageOrder
          .map((pageId) => allConfigs.find((config) => config.id === pageId))
          .filter((config): config is PageConfig => config !== undefined);
        
        // 保存されていないページを末尾に追加
        const missingPages = allConfigs.filter(
          (config) => !currentSubMenuPageOrder.includes(config.id)
        );
        
        finalOrderedConfigs = [...ordered, ...missingPages];
      } else {
        // ページ番号でソート
        finalOrderedConfigs = [...allConfigs].sort((a, b) => a.pageNumber - b.pageNumber);
      }
      
      console.log('PageOrderManager - finalOrderedConfigs:', finalOrderedConfigs);
      console.log('PageOrderManager - finalOrderedConfigs.length:', finalOrderedConfigs.length);
      console.log('PageOrderManager - finalOrderedConfigs.map(c => c.id):', finalOrderedConfigs.map(c => c.id));
      
      // ページ数のサマリーを表示
      console.log('=== ページ数サマリー ===');
      console.log(`固定ページ数: ${subMenuId === 'overview' ? pageConfigs.length : 0}`);
      console.log(`動的ページ数: ${dynamicPageConfigs.length}`);
      console.log(`合計ページ数: ${finalOrderedConfigs.length}`);
      console.log(`保存された順序数: ${currentSubMenuPageOrder?.length || 0}`);
      console.log('====================');
      
      setOrderedConfigs(finalOrderedConfigs);
    } catch (error) {
      console.error('ページ順序の読み込みエラー:', error);
      setOrderedConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  // 定期的にページを再読み込み（ページが追加された可能性があるため）
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 2000); // 2秒ごとにチェック

    return () => clearInterval(interval);
  }, []);

  // ComponentizedOverviewからrefreshPagesが呼ばれたときに再読み込み
  // 親コンポーネントからrefreshTriggerを受け取る必要があるが、現在はuseEffectの依存配列で対応
  // より良い方法は、ComponentizedPageContextからorderedConfigsを直接取得することだが、
  // 現在の実装では、ページが追加されたときに手動で再読み込みする必要がある
  // 代わりに、定期的にチェックするか、親コンポーネントからrefreshTriggerを渡す

  // Firestoreに順序を保存
  const savePageOrder = async (newOrder: PageConfig[]) => {
    // 会社本体の事業計画の場合の処理
    if (isCompanyPlan && planId) {
      await saveCompanyPlanPageOrder(planId, newOrder);
      return;
    }

    if (!db || !auth?.currentUser || !serviceId || !conceptId) {
      console.error('保存に必要な情報が不足しています:', { serviceId, conceptId, hasAuth: !!auth?.currentUser });
      return;
    }

    try {
      setSaving(true);

      // 構想ドキュメントを検索
      const conceptsQuery = query(
        collection(db, 'concepts'),
        where('userId', '==', auth.currentUser.uid),
        where('serviceId', '==', serviceId),
        where('conceptId', '==', conceptId)
      );
      
      const conceptsSnapshot = await getDocs(conceptsQuery);
      
      let conceptDocId: string;
      
      if (!conceptsSnapshot.empty) {
        // 既存の構想ドキュメントを更新
        const conceptDoc = conceptsSnapshot.docs[0];
        conceptDocId = conceptDoc.id;
      } else {
        // 構想ドキュメントが存在しない場合は作成
        console.log('構想ドキュメントが存在しないため、作成します');
        
        const fixedConcepts: { [key: string]: { [key: string]: string } } = {
          'component-test': {
            'test-concept': 'テスト構想',
          },
          'own-service': {
            'maternity-support-componentized': '出産支援パーソナルApp（コンポーネント化版）',
            'care-support-componentized': '介護支援パーソナルApp（コンポーネント化版）',
          },
        };
        const conceptName = fixedConcepts[serviceId]?.[conceptId] || conceptId;
        
        const newConceptDoc = await addDoc(collection(db, 'concepts'), {
          name: conceptName,
          description: 'コンポーネント化のテスト用構想',
          conceptId: conceptId,
          serviceId: serviceId,
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        conceptDocId = newConceptDoc.id;
        console.log('構想ドキュメントを作成しました:', conceptDocId);
      }
      
      // ページ順序を保存（サブメニューごと）
      const pageOrder = newOrder.map((config) => config.id);
      
      // 既存のデータを取得
      let conceptData: any = {};
      if (!conceptsSnapshot.empty) {
        conceptData = conceptsSnapshot.docs[0].data();
      }
      
      const pagesBySubMenu = conceptData.pagesBySubMenu as { [key: string]: Array<{
        id: string;
        pageNumber: number;
        title: string;
        content: string;
      }> } | undefined || {};
      
      const pageOrderBySubMenu = conceptData.pageOrderBySubMenu as { [key: string]: string[] } | undefined || {};
      
      // 現在のサブメニューのページデータを更新
      const currentSubMenuPages = pagesBySubMenu[subMenuId] || [];
      const updatedPagesBySubMenu = {
        ...pagesBySubMenu,
        [subMenuId]: currentSubMenuPages,
      };
      
      const updatedPageOrderBySubMenu = {
        ...pageOrderBySubMenu,
        [subMenuId]: pageOrder,
      };
      
      const updateData: any = {
        pagesBySubMenu: updatedPagesBySubMenu,
        pageOrderBySubMenu: updatedPageOrderBySubMenu,
        updatedAt: serverTimestamp(),
      };
      
      // overviewの場合は後方互換性のために古い形式も更新
      if (subMenuId === 'overview') {
        updateData.pageOrder = pageOrder;
      }
      
      await setDoc(
        doc(db, 'concepts', conceptDocId),
        updateData,
        { merge: true }
      );
      
      console.log('ページ順序を保存しました:', pageOrder);
      console.log('保存先ドキュメントID:', conceptDocId);
      console.log('サブメニューID:', subMenuId);
      
      // 保存が成功したことを確認するため、再度読み込んで確認
      const verifyDoc = await getDoc(doc(db, 'concepts', conceptDocId));
      const verifyData = verifyDoc.data();
      console.log('保存後の確認:', verifyData?.pageOrderBySubMenu?.[subMenuId]);
      
      // キャッシュを無効化（2Dグラフのページコンテンツチェック用）
      if (typeof window !== 'undefined' && serviceId && conceptId && subMenuId) {
        const pageUrl = `/business-plan/services/${serviceId}/${conceptId}/${subMenuId}`;
        import('@/components/ForceDirectedGraph').then((module) => {
          if (module.clearPageContentCache) {
            module.clearPageContentCache(pageUrl);
          }
        }).catch(() => {
          // インポートエラーは無視（キャッシュクリアはオプショナル）
        });
      }
      
      // ComponentizedPageContextのページをリフレッシュしてUIを更新
      if (refreshPages) {
        console.log('ページをリフレッシュします');
        refreshPages();
      }
    } catch (error) {
      console.error('ページ順序の保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedConfigs((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        console.log('ドラッグ終了 - 新しい順序:', newOrder.map(c => c.id));
        
        // 順序を保存（非同期）
        savePageOrder(newOrder).catch((error) => {
          console.error('保存エラー:', error);
        });
        
        return newOrder;
      });
    }
  };

  /**
   * 会社本体の事業計画のページ順序を保存
   */
  const saveCompanyPlanPageOrder = async (planId: string, newOrder: PageConfig[]) => {
    if (!db || !auth?.currentUser) {
      console.error('保存に必要な情報が不足しています');
      return;
    }

    try {
      setSaving(true);

      // 事業計画ドキュメントを取得
      const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
      
      if (!planDoc.exists()) {
        alert('事業計画が見つかりませんでした。');
        setSaving(false);
        return;
      }

      const planData = planDoc.data();
      
      // ページ順序を保存（サブメニューごと）
      const pageOrder = newOrder.map((config) => config.id);
      
      // 既存のデータを取得
      const pagesBySubMenu = planData.pagesBySubMenu || {};
      const pageOrderBySubMenu = planData.pageOrderBySubMenu || {};
      
      // サブメニューごとのページデータを更新
      const updatedPagesBySubMenu = {
        ...pagesBySubMenu,
        [subMenuId]: newOrder.map((config, index) => {
          // 既存のページデータを取得
          const existingPage = (pagesBySubMenu[subMenuId] || []).find((p: any) => p.id === config.id);
          if (existingPage) {
            return {
              ...existingPage,
              pageNumber: index,
            };
          }
          // 新しいページの場合は、固定ページの設定を使用
          return {
            id: config.id,
            pageNumber: index,
            title: config.title || `ページ ${index + 1}`,
            content: '',
          };
        }),
      };
      
      const updatedPageOrderBySubMenu = {
        ...pageOrderBySubMenu,
        [subMenuId]: pageOrder,
      };
      
      // Firestoreに保存
      await updateDoc(doc(db, 'companyBusinessPlan', planId), {
        pagesBySubMenu: updatedPagesBySubMenu,
        pageOrderBySubMenu: updatedPageOrderBySubMenu,
        updatedAt: serverTimestamp(),
      });
      
      // キャッシュを無効化（2Dグラフのページコンテンツチェック用）
      if (typeof window !== 'undefined' && planId && subMenuId) {
        const pageUrl = `/business-plan/company/${planId}/${subMenuId}`;
        import('@/components/ForceDirectedGraph').then((module) => {
          if (module.clearPageContentCache) {
            module.clearPageContentCache(pageUrl);
          }
        }).catch(() => {
          // インポートエラーは無視（キャッシュクリアはオプショナル）
        });
      }
      
      if (refreshPages) {
        refreshPages();
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert('ページ順序の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // ページを編集
  const handleEditPage = async (pageId: string) => {
    // 会社本体の事業計画の場合の処理
    if (isCompanyPlan && planId) {
      await handleCompanyPlanEditPage(planId, pageId);
      return;
    }

    if (!db || !auth?.currentUser || !serviceId || !conceptId) {
      console.error('編集に必要な情報が不足しています');
      return;
    }

    try {
      // 構想ドキュメントを検索
      const conceptsQuery = query(
        collection(db, 'concepts'),
        where('userId', '==', auth.currentUser.uid),
        where('serviceId', '==', serviceId),
        where('conceptId', '==', conceptId)
      );
      
      const conceptsSnapshot = await getDocs(conceptsQuery);
      
      if (conceptsSnapshot.empty) {
        alert('構想ドキュメントが見つかりません');
        return;
      }

      const conceptDoc = conceptsSnapshot.docs[0];
      const data = conceptDoc.data();
      
      // サブメニューごとのページデータを取得
      const pagesBySubMenu = (data.pagesBySubMenu as { [key: string]: Array<{
        id: string;
        pageNumber: number;
        title: string;
        content: string;
      }> }) || {};
      
      // 現在のサブメニューのページデータを取得
      const currentSubMenuPages = pagesBySubMenu[subMenuId] || [];
      
      // overviewの場合は後方互換性のために古い形式もチェック
      let pages: Array<{
        id: string;
        pageNumber: number;
        title: string;
        content: string;
      }>;
      
      if (subMenuId === 'overview') {
        const oldPages = (data.pages as Array<{
        id: string;
        pageNumber: number;
        title: string;
        content: string;
      }>) || [];
        pages = currentSubMenuPages.length > 0 ? currentSubMenuPages : oldPages;
      } else {
        pages = currentSubMenuPages;
      }

      const page = pages.find(p => p.id === pageId);
      if (!page) {
        alert('ページが見つかりません');
        return;
      }

      setEditingPageId(pageId);
      setEditingPageTitle(page.title);
      setEditingPageContent(page.content);
    } catch (error) {
      console.error('ページ編集エラー:', error);
      alert('ページの編集に失敗しました');
    }
  };

  /**
   * 会社本体の事業計画のページを編集
   */
  const handleCompanyPlanEditPage = async (planId: string, pageId: string) => {
    if (!db || !auth?.currentUser) {
      console.error('編集に必要な情報が不足しています');
      return;
    }

    try {
      // 事業計画ドキュメントを取得
      const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
      
      if (!planDoc.exists()) {
        alert('事業計画が見つかりませんでした。');
        return;
      }

      const planData = planDoc.data();
      const pagesBySubMenu = planData.pagesBySubMenu || {};
      const currentSubMenuPages = pagesBySubMenu[subMenuId] || [];
      
      // 編集するページを検索
      const pageToEdit = currentSubMenuPages.find((p: any) => p.id === pageId);
      
      if (!pageToEdit) {
        alert('ページが見つかりませんでした。');
        return;
      }
      
      setEditingPageId(pageId);
      setEditingPageTitle(pageToEdit.title || '');
      setEditingPageContent(pageToEdit.content || '');
    } catch (error) {
      console.error('ページ編集エラー:', error);
      alert('ページの編集に失敗しました');
    }
  };

  /**
   * 会社本体の事業計画のページを削除
   */
  const handleCompanyPlanDeletePage = async (planId: string, pageId: string) => {
    if (!db || !auth?.currentUser) {
      console.error('削除に必要な情報が不足しています');
      return;
    }

    try {
      setSaving(true);

      // 事業計画ドキュメントを取得
      const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
      
      if (!planDoc.exists()) {
        alert('事業計画が見つかりませんでした。');
        setSaving(false);
        return;
      }

      const planData = planDoc.data();
      const pagesBySubMenu = planData.pagesBySubMenu || {};
      const pageOrderBySubMenu = planData.pageOrderBySubMenu || {};
      
      // 現在のサブメニューのページデータを取得
      const currentSubMenuPages = pagesBySubMenu[subMenuId] || [];
      const currentSubMenuPageOrder = pageOrderBySubMenu[subMenuId] || [];
      
      // ページを削除
      const updatedPages = currentSubMenuPages.filter((page: any) => page.id !== pageId);
      const updatedPageOrder = currentSubMenuPageOrder.filter((id: string) => id !== pageId);
      
      // 更新データを準備
      const updatedPagesBySubMenu = {
        ...pagesBySubMenu,
        [subMenuId]: updatedPages,
      };
      
      const updatedPageOrderBySubMenu = {
        ...pageOrderBySubMenu,
        [subMenuId]: updatedPageOrder,
      };
      
      // Firestoreに保存
      await setDoc(
        doc(db, 'companyBusinessPlan', planId),
        {
          ...planData,
          pagesBySubMenu: updatedPagesBySubMenu,
          pageOrderBySubMenu: updatedPageOrderBySubMenu,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      
      // キャッシュを無効化（2Dグラフのページコンテンツチェック用）
      if (typeof window !== 'undefined' && planId && subMenuId) {
        const pageUrl = `/business-plan/company/${planId}/${subMenuId}`;
        import('@/components/ForceDirectedGraph').then((module) => {
          if (module.clearPageContentCache) {
            module.clearPageContentCache(pageUrl);
          }
        }).catch(() => {
          // インポートエラーは無視（キャッシュクリアはオプショナル）
        });
      }
      
      // ローカル状態からも削除
      setOrderedConfigs(prev => prev.filter(config => config.id !== pageId));
      
      setSaving(false);
      
      // 親コンポーネントに通知
      if (onPageDeleted) {
        onPageDeleted();
      }
    } catch (error) {
      console.error('ページ削除エラー:', error);
      alert('ページの削除に失敗しました');
      setSaving(false);
    }
  };

  const handlePageUpdated = () => {
    setEditingPageId(null);
    if (onPageUpdated) {
      onPageUpdated();
    }
    // ページリストを再読み込み
    setRefreshTrigger(prev => prev + 1);
  };

  // ページを削除
  const handleDeletePage = async (pageId: string) => {
    // 固定ページは削除できない
    if (pageId === 'page-0') {
      alert('固定ページは削除できません');
      return;
    }

    if (!confirm('このページを削除しますか？')) {
      return;
    }

    // 会社本体の事業計画の場合の処理
    if (isCompanyPlan && planId) {
      await handleCompanyPlanDeletePage(planId, pageId);
      return;
    }

    if (!db || !auth?.currentUser || !serviceId || !conceptId) {
      console.error('削除に必要な情報が不足しています');
      return;
    }

    try {
      setSaving(true);

      // 構想ドキュメントを検索
      const conceptsQuery = query(
        collection(db, 'concepts'),
        where('userId', '==', auth.currentUser.uid),
        where('serviceId', '==', serviceId),
        where('conceptId', '==', conceptId)
      );
      
      const conceptsSnapshot = await getDocs(conceptsQuery);
      
      if (conceptsSnapshot.empty) {
        alert('構想ドキュメントが見つかりません');
        return;
      }

      const conceptDoc = conceptsSnapshot.docs[0];
      const data = conceptDoc.data();
      
      // サブメニューごとのページデータを取得
      const pagesBySubMenu = (data.pagesBySubMenu as { [key: string]: Array<{
        id: string;
        pageNumber: number;
        title: string;
        content: string;
      }> }) || {};
      
      const pageOrderBySubMenu = (data.pageOrderBySubMenu as { [key: string]: string[] }) || {};
      
      // 現在のサブメニューのページデータを取得
      const currentSubMenuPages = pagesBySubMenu[subMenuId] || [];
      const currentSubMenuPageOrder = pageOrderBySubMenu[subMenuId] || [];

      // ページを削除
      const updatedPages = currentSubMenuPages.filter(page => page.id !== pageId);
      
      // ページ順序からも削除
      const updatedPageOrder = currentSubMenuPageOrder.filter(id => id !== pageId);
      
      // 更新データを準備
      const updatedPagesBySubMenu = {
        ...pagesBySubMenu,
        [subMenuId]: updatedPages,
      };
      
      const updatedPageOrderBySubMenu = {
        ...pageOrderBySubMenu,
        [subMenuId]: updatedPageOrder,
      };
      
      const updateData: any = {
        pagesBySubMenu: updatedPagesBySubMenu,
        pageOrderBySubMenu: updatedPageOrderBySubMenu,
        updatedAt: serverTimestamp(),
      };
      
      // overviewの場合は後方互換性のために古い形式も更新
      if (subMenuId === 'overview') {
        const oldPages = (data.pages as Array<{
          id: string;
          pageNumber: number;
          title: string;
          content: string;
        }>) || [];
        const oldPageOrder = (data.pageOrder as string[]) || [];
        
        updateData.pages = oldPages.filter(page => page.id !== pageId);
        updateData.pageOrder = oldPageOrder.filter(id => id !== pageId);
      }

      // Firestoreに保存
      await setDoc(
        doc(db, 'concepts', conceptDoc.id),
        updateData,
        { merge: true }
      );

      console.log('ページを削除しました:', pageId);

      // ローカル状態からも削除
      setOrderedConfigs(prev => prev.filter(config => config.id !== pageId));

      // 親コンポーネントに通知
      if (onPageDeleted) {
        onPageDeleted();
      }
    } catch (error) {
      console.error('ページ削除エラー:', error);
      alert('ページの削除に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div>
      {/* 編集フォーム */}
      {editingPageId && (
        <EditPageForm
          serviceId={serviceId}
          conceptId={conceptId}
          planId={planId}
          subMenuId={subMenuId}
          pageId={editingPageId}
          initialTitle={editingPageTitle}
          initialContent={editingPageContent}
          onClose={() => setEditingPageId(null)}
          onPageUpdated={handlePageUpdated}
        />
      )}

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
          ページの順序を変更
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '16px' }}>
          ドラッグ&ドロップでページの順序を変更できます
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedConfigs.map((config) => config.id)}
          strategy={verticalListSortingStrategy}
        >
          {orderedConfigs.map((config, index) => (
            <SortablePageItem 
              key={config.id} 
              config={config} 
              index={index}
              onDelete={handleDeletePage}
              onEdit={handleEditPage}
            />
          ))}
        </SortableContext>
      </DndContext>

      {saving && (
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-light)' }}>
          保存中...
        </div>
      )}
    </div>
  );
}

