'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export const SUB_MENU_ITEMS = [
  { id: 'overview', label: '概要・コンセプト', path: 'overview' },
  { id: 'features', label: '成長戦略', path: 'features' },
  { id: 'business-model', label: 'ビジネスモデル', path: 'business-model' },
  { id: 'market-size', label: '市場規模', path: 'market-size' },
  { id: 'plan', label: '事業計画', path: 'plan' },
  { id: 'simulation', label: 'シミュレーション', path: 'simulation' },
  { id: 'execution-schedule', label: '実行スケジュール', path: 'execution-schedule' },
  { id: 'itochu-synergy', label: '伊藤忠シナジー', path: 'itochu-synergy' },
  { id: 'subsidies', label: '補助金・助成金', path: 'subsidies' },
  { id: 'case-study', label: 'ケーススタディ', path: 'case-study' },
  { id: 'risk-assessment', label: 'リスク評価', path: 'risk-assessment' },
  { id: 'snapshot-comparison', label: 'スナップショット比較', path: 'snapshot-comparison' },
  { id: 'references', label: '参考文献', path: 'references' },
];

interface ConceptSubMenuProps {
  serviceId: string;
  conceptId: string;
  currentSubMenuId: string;
}

export default function ConceptSubMenu({ serviceId, conceptId, currentSubMenuId }: ConceptSubMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // localStorageからサイドバーの開閉状態を読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      setSidebarOpen(saved === 'true');
      
      // localStorageの変更を監視（異なるタブ間の同期用）
      const handleStorageChange = () => {
        const saved = localStorage.getItem('sidebarOpen');
        setSidebarOpen(saved === 'true');
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // カスタムイベントでサイドバーの変更を監視（同じウィンドウ内）
      const handleSidebarToggle = () => {
        const saved = localStorage.getItem('sidebarOpen');
        setSidebarOpen(saved === 'true');
      };
      
      window.addEventListener('sidebarToggle', handleSidebarToggle);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('sidebarToggle', handleSidebarToggle);
      };
    }
  }, []);

  const handleSubMenuClick = (item: typeof SUB_MENU_ITEMS[0]) => {
    startTransition(() => {
      router.push(`/business-plan/services/${serviceId}/${conceptId}/${item.path}`);
    });
  };

  // サイドバーの開閉状態に応じてleft位置を計算
  const sidebarWidth = sidebarOpen ? 350 : 70;
  const containerPadding = 48;
  const leftPosition = sidebarWidth + containerPadding;

  return (
    <div style={{ width: '240px', flexShrink: 0 }}>
      <div style={{ 
        background: 'var(--color-background)',
        border: '1px solid var(--color-border-color)',
        borderRadius: '6px',
        padding: '16px 0',
        position: 'fixed',
        top: '80px',
        left: `${leftPosition}px`,
        width: '240px',
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
        zIndex: 100,
        transition: 'left 0.3s ease',
      }}>
        <nav>
          {SUB_MENU_ITEMS.map((item, index) => {
            const isActive = currentSubMenuId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSubMenuClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 24px',
                  width: '100%',
                  color: isActive ? 'var(--color-text)' : 'var(--color-text-light)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  borderTop: 'none',
                  borderRight: 'none',
                  borderBottom: 'none',
                  borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                  backgroundColor: isActive ? 'rgba(31, 41, 51, 0.05)' : 'transparent',
                  fontSize: '14px',
                  fontWeight: isActive ? 500 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(31, 41, 51, 0.03)';
                    e.currentTarget.style.borderLeftColor = 'rgba(31, 41, 51, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderLeftColor = 'transparent';
                  }
                }}
              >
                <span style={{ marginRight: '12px', fontSize: '12px', color: 'var(--color-text-light)', minWidth: '24px' }}>
                  {index + 1}.
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

