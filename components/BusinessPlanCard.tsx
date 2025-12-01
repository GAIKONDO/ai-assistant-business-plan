'use client';

import { useRouter } from 'next/navigation';
import { BusinessPlanData } from './BusinessPlanForm';

interface BusinessPlanCardProps {
  plan: BusinessPlanData & { id: string; createdAt?: Date; updatedAt?: Date };
  onEdit: () => void;
  onDelete: () => void;
  type: 'company' | 'project';
}

export default function BusinessPlanCard({ plan, onEdit, onDelete, type }: BusinessPlanCardProps) {
  const router = useRouter();

  // コンポーネント化版かどうかを判定
  // pagesBySubMenuが存在し、かつ空でないオブジェクトで、少なくとも1つのサブメニューにページが存在する場合のみコンポーネント化版と判定
  const pagesBySubMenu = (plan as any).pagesBySubMenu;
  const isComponentized = pagesBySubMenu && 
    typeof pagesBySubMenu === 'object' && 
    Object.keys(pagesBySubMenu).length > 0 &&
    Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
  
  // デバッグログ（開発時のみ）
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('BusinessPlanCard - plan.id:', plan.id);
    console.log('BusinessPlanCard - plan.title:', plan.title);
    console.log('BusinessPlanCard - pagesBySubMenu:', pagesBySubMenu);
    console.log('BusinessPlanCard - pagesBySubMenu keys:', pagesBySubMenu ? Object.keys(pagesBySubMenu) : []);
    console.log('BusinessPlanCard - pagesBySubMenu values:', pagesBySubMenu ? Object.values(pagesBySubMenu).map((v: any) => Array.isArray(v) ? v.length : 'not array') : []);
    console.log('BusinessPlanCard - isComponentized:', isComponentized);
  }

  const formatDate = (date?: Date) => {
    if (!date) return '';
    // Dateオブジェクトでない場合は変換を試みる
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // ボタンクリック時はカードのクリックイベントを無視
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (type === 'company') {
      router.push(`/business-plan/company/${plan.id}`);
    } else {
      router.push(`/business-plan/project/${plan.id}`);
    }
  };

  return (
    <div 
      className="card"
      onClick={handleCardClick}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: isComponentized ? '#F0F9FF' : '#FFFFFF', // コンポーネント化版は薄い青、固定版は白
        border: isComponentized ? '1px solid #BFDBFE' : '1px solid var(--color-border-color)', // コンポーネント化版は青い枠線
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
            {plan.title}
          </h3>
          {type === 'project' && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>事業企画</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{
              background: 'rgba(31, 41, 51, 0.05)',
              border: '1px solid rgba(31, 41, 51, 0.1)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(31, 41, 51, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(31, 41, 51, 0.2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(31, 41, 51, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(31, 41, 51, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
            }}
            title="編集"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          {/* 固定形式の場合はゴミ箱アイコンを表示しない */}
          {isComponentized && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={{
                background: 'rgba(220, 53, 69, 0.08)',
                border: '1px solid rgba(220, 53, 69, 0.2)',
                color: '#dc3545',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(220, 53, 69, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(220, 53, 69, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(220, 53, 69, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(220, 53, 69, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(220, 53, 69, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(220, 53, 69, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(220, 53, 69, 0.1)';
              }}
              title="削除"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ marginTop: '4px', color: 'var(--color-text)', lineHeight: '1.6', fontSize: '14px' }}>
          {plan.description}
        </p>
      </div>

      {plan.createdAt && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-color)', fontSize: '12px', color: 'var(--color-text-light)' }}>
          作成日: {formatDate(plan.createdAt)}
          {plan.updatedAt && (() => {
            try {
              const createdAtDate = plan.createdAt instanceof Date ? plan.createdAt : new Date(plan.createdAt);
              const updatedAtDate = plan.updatedAt instanceof Date ? plan.updatedAt : new Date(plan.updatedAt);
              if (!isNaN(createdAtDate.getTime()) && !isNaN(updatedAtDate.getTime()) && updatedAtDate.getTime() !== createdAtDate.getTime()) {
                return <> | 更新日: {formatDate(plan.updatedAt)}</>;
              }
            } catch (e) {
              // エラーが発生した場合は更新日を表示しない
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
}

