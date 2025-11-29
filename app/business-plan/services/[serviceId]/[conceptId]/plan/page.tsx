'use client';

import { useState } from 'react';

export default function PlanPage() {
  const [viewMode, setViewMode] = useState<'separate' | 'combined'>('separate');

  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        事業計画
      </p>
      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            marginBottom: 0, 
            color: 'var(--color-text)', 
            borderLeft: '3px solid var(--color-primary)', 
            paddingLeft: '8px' 
          }}>
            7年計画
          </h3>
          
          {/* 表示切り替えボタン */}
          <div style={{ 
            display: 'flex', 
            gap: '8px'
          }}>
            <button
              onClick={() => setViewMode('separate')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: viewMode === 'separate' ? '#FFFFFF' : 'var(--color-text)',
                backgroundColor: viewMode === 'separate' ? 'var(--color-primary)' : '#F3F4F6',
                border: '1px solid var(--color-border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              各サービス毎
            </button>
            <button
              onClick={() => setViewMode('combined')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: viewMode === 'combined' ? '#FFFFFF' : 'var(--color-text)',
                backgroundColor: viewMode === 'combined' ? 'var(--color-primary)' : '#F3F4F6',
                border: '1px solid var(--color-border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              全サービス合算
            </button>
          </div>
        </div>
        
        {/* 7年計画の表 */}
        <div style={{ 
          overflowX: 'auto',
          marginBottom: '24px'
        }}>
          <table style={{ 
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid var(--color-border-color)'
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#F3F4F6',
                borderBottom: '2px solid var(--color-border-color)'
              }}>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  minWidth: '150px'
                }}>
                  項目
                </th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  minWidth: '100px'
                }}>
                </th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  minWidth: '100px'
                }}>
                  1年目
                </th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  minWidth: '100px'
                }}>
                  2年目
                </th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  minWidth: '100px'
                }}>
                  3年目
                </th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  minWidth: '100px'
                }}>
                  4年目
                </th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  minWidth: '100px'
                }}>
                  5年目
                </th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  minWidth: '100px'
                }}>
                  6年目
                </th>
                <th style={{ 
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  minWidth: '100px'
                }}>
                  7年目
                </th>
              </tr>
            </thead>
            <tbody>
              {viewMode === 'separate' ? (
                <>
                  {/* 一般利用者 */}
                  <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                    <td rowSpan={4} style={{ 
                      padding: '12px 16px', 
                      fontSize: '14px', 
                      color: 'var(--color-text)',
                      fontWeight: 600,
                      verticalAlign: 'middle',
                      borderRight: '1px solid var(--color-border-color)'
                    }}>
                      一般利用者
                    </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  売上
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  売上原価
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  粗利率
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  売上総利益
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>

              {/* 企業向け提供 */}
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td rowSpan={4} style={{ 
                  padding: '12px 16px', 
                  fontSize: '14px', 
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  verticalAlign: 'middle',
                  borderRight: '1px solid var(--color-border-color)'
                }}>
                  企業向け提供
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  売上
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  売上原価
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  粗利率
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  売上総利益
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>

              {/* 自治体向け提供 */}
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td rowSpan={4} style={{ 
                  padding: '12px 16px', 
                  fontSize: '14px', 
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  verticalAlign: 'middle',
                  borderRight: '1px solid var(--color-border-color)'
                }}>
                  自治体向け提供
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  売上
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  売上原価
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  粗利率
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  売上総利益
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>

              {/* パートナー連携 */}
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td rowSpan={4} style={{ 
                  padding: '12px 16px', 
                  fontSize: '14px', 
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  verticalAlign: 'middle',
                  borderRight: '1px solid var(--color-border-color)'
                }}>
                  パートナー連携
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  売上
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  売上原価
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  粗利率
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                  売上総利益
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                  -
                </td>
              </tr>
                </>
              ) : (
                <>
                  {/* 全サービス合算 */}
                  <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                    <td rowSpan={4} style={{ 
                      padding: '12px 16px', 
                      fontSize: '14px', 
                      color: 'var(--color-text)',
                      fontWeight: 600,
                      verticalAlign: 'middle',
                      borderRight: '1px solid var(--color-border-color)'
                    }}>
                      全サービス合算
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                      売上
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                      売上原価
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                      粗利率
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
                      売上総利益
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right' }}>
                      -
                    </td>
                  </tr>
                </>
              )}

              {/* 共通項目：販管費、営業利益、税金、当期純利益 */}
              <tr style={{ borderTop: '2px solid var(--color-border-color)', borderBottom: '1px solid var(--color-border-color)' }}>
                <td rowSpan={4} style={{ 
                  padding: '12px 16px', 
                  fontSize: '14px', 
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  verticalAlign: 'middle',
                  backgroundColor: '#F9FAFB',
                  borderRight: '1px solid var(--color-border-color)'
                }}>
                  共通項目
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500, backgroundColor: '#F9FAFB' }}>
                  販管費
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500, backgroundColor: '#F9FAFB' }}>
                  営業利益
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500, backgroundColor: '#F9FAFB' }}>
                  税金
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500, backgroundColor: '#F9FAFB' }}>
                  当期純利益
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', backgroundColor: '#F9FAFB' }}>
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

