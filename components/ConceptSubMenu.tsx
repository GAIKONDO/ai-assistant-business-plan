'use client';

import { useRouter, usePathname } from 'next/navigation';

const SUB_MENU_ITEMS = [
  { id: 'overview', label: '概要・コンセプト', path: 'overview' },
  { id: 'features', label: '提供機能', path: 'features' },
  { id: 'business-model', label: 'ビジネスモデル', path: 'business-model' },
  { id: 'market-size', label: '市場規模', path: 'market-size' },
  { id: 'plan', label: '事業計画', path: 'plan' },
  { id: 'simulation', label: 'シミュレーション', path: 'simulation' },
  { id: 'subsidies', label: '補助金・助成金', path: 'subsidies' },
  { id: 'case-study', label: 'ケーススタディ', path: 'case-study' },
  { id: 'risk-assessment', label: 'リスク評価', path: 'risk-assessment' },
  { id: 'itochu-synergy', label: '伊藤忠シナジー', path: 'itochu-synergy' },
  { id: 'snapshot-comparison', label: 'スナップショット比較', path: 'snapshot-comparison' },
];

interface ConceptSubMenuProps {
  serviceId: string;
  conceptId: string;
  currentSubMenuId: string;
}

export default function ConceptSubMenu({ serviceId, conceptId, currentSubMenuId }: ConceptSubMenuProps) {
  const router = useRouter();

  const handleSubMenuClick = (item: typeof SUB_MENU_ITEMS[0]) => {
    router.push(`/business-plan/services/${serviceId}/${conceptId}/${item.path}`);
  };

  return (
    <div style={{ width: '240px', flexShrink: 0 }}>
      <div style={{ 
        background: 'var(--color-background)',
        border: '1px solid var(--color-border-color)',
        borderRadius: '6px',
        padding: '16px 0',
        position: 'sticky',
        top: '20px',
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
                  borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                  backgroundColor: isActive ? 'rgba(31, 41, 51, 0.05)' : 'transparent',
                  fontSize: '14px',
                  fontWeight: isActive ? 500 : 400,
                  border: 'none',
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

export { SUB_MENU_ITEMS };

