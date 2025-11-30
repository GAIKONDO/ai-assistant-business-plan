'use client';

import { usePlan } from '../layout';
import dynamic from 'next/dynamic';

// ComponentizedCompanyPlanOverviewを動的インポート
const ComponentizedCompanyPlanOverview = dynamic(
  () => import('@/components/pages/component-test/test-concept/ComponentizedCompanyPlanOverview'),
  { ssr: false }
);

export default function MarketSizePage() {
  const { plan } = usePlan();
  
  // コンポーネント化されたページを使用するかチェック
  // pagesBySubMenuが存在する場合はComponentizedCompanyPlanOverviewを使用
  if (plan?.pagesBySubMenu) {
    return <ComponentizedCompanyPlanOverview />;
  }
  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        市場規模
      </p>
      
      {/* 市場規模（稟議書テンプレート） */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          marginBottom: '12px', 
          color: 'var(--color-text)', 
          borderLeft: '3px solid var(--color-primary)', 
          paddingLeft: '8px' 
        }}>
          市場規模
        </h3>

        {/* タイトルとサブタイトル */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            marginBottom: '8px', 
            color: '#1F2937',
            lineHeight: '1.3',
            margin: '0 auto 8px'
          }}>
            市場規模分析
          </h2>
          <p style={{ 
            fontSize: '15px', 
            fontWeight: 400, 
            color: '#6B7280', 
            lineHeight: '1.6',
            margin: 0
          }}>
            TAM・SAM・SOMによる市場規模の定義と成長機会の明確化
          </p>
        </div>

        {/* 1. 日本のAI市場（Total Addressable Market） */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            marginBottom: '16px', 
            color: 'var(--color-text)',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border-color)'
          }}>
            1. 日本のAI市場（Total Addressable Market）
          </h4>
        </div>

        {/* テキスト情報とサークル図 */}
        <div style={{ 
          display: 'flex',
          alignItems: 'flex-start',
          gap: '20px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {/* テキスト情報 */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: 700, 
              color: '#1F2937',
              marginBottom: '8px',
              lineHeight: '1.3'
            }}>
              2025年 : 約3兆円
            </div>
            <div style={{ 
              fontSize: '15px', 
              color: '#6B7280',
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              年率30〜40%成長
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#9CA3AF',
              lineHeight: '1.5'
            }}>
              参考：総務省／経産省／IDC／Gartner
            </div>
          </div>
          
          {/* 3層サークル図 */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            marginLeft: '20px'
          }}>
            <svg width="200" height="200" viewBox="0 0 200 200" style={{ maxWidth: '100%', height: 'auto' }}>
              {/* TAM - 最大の円（3兆円）- 一番下 */}
              <circle
                cx="100"
                cy="120"
                r="60"
                fill="#9CA3AF"
                opacity="0.9"
              />
              <text
                x="100"
                y="70"
                textAnchor="middle"
                fontSize="16"
                fontWeight="800"
                fill="#333333"
                fontFamily="sans-serif"
              >
                TAM
              </text>

              {/* SAM - 中くらいの円（1,500億円）- 少し上にずらす */}
              <circle
                cx="100"
                cy="130"
                r="42"
                fill="#3B82F6"
                opacity="0.9"
              />
              <text
                x="100"
                y="110"
                textAnchor="middle"
                fontSize="14"
                fontWeight="800"
                fill="#333333"
                fontFamily="sans-serif"
              >
                SAM
              </text>

              {/* SOM - 最小の円（30億円）- さらに上にずらす */}
              <circle
                cx="100"
                cy="140"
                r="25"
                fill="#1E40AF"
                opacity="0.9"
              />
              <text
                x="100"
                y="137"
                textAnchor="middle"
                fontSize="11"
                fontWeight="800"
                fill="#FFFFFF"
                fontFamily="sans-serif"
              >
                SOM
              </text>
            </svg>
          </div>

          {/* 市場成長のキードライバー */}
          <div style={{ 
            flex: 1,
            minWidth: '300px',
            padding: '20px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid var(--color-border-color)',
            marginRight: '20px'
          }}>
            <h5 style={{ 
              fontSize: '16px', 
              fontWeight: 700, 
              color: '#1F2937',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '2px solid var(--color-primary)'
            }}>
              市場成長ドライバー（2025–2030）
            </h5>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--color-text)',
                lineHeight: '1.6',
                paddingLeft: '16px',
                position: 'relative'
              }}>
                <span style={{ 
                  position: 'absolute',
                  left: 0,
                  color: 'var(--color-primary)',
                  fontWeight: 600
                }}>•</span>
                企業のAI導入義務化の流れ（ガバナンス強化）
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--color-text)',
                lineHeight: '1.6',
                paddingLeft: '16px',
                position: 'relative'
              }}>
                <span style={{ 
                  position: 'absolute',
                  left: 0,
                  color: 'var(--color-primary)',
                  fontWeight: 600
                }}>•</span>
                人材不足により AIリスキリング市場が加速
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--color-text)',
                lineHeight: '1.6',
                paddingLeft: '16px',
                position: 'relative'
              }}>
                <span style={{ 
                  position: 'absolute',
                  left: 0,
                  color: 'var(--color-primary)',
                  fontWeight: 600
                }}>•</span>
                LLM導入でアプリ新規需要が拡大
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--color-text)',
                lineHeight: '1.6',
                paddingLeft: '16px',
                position: 'relative'
              }}>
                <span style={{ 
                  position: 'absolute',
                  left: 0,
                  color: 'var(--color-primary)',
                  fontWeight: 600
                }}>•</span>
                行政DX・自治体AI導入の本格化
              </div>
            </div>
          </div>
        </div>

        {/* 2. 当社が狙う領域 */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            marginBottom: '16px', 
            color: 'var(--color-text)',
            paddingBottom: '8px',
            borderBottom: '2px solid var(--color-border-color)'
          }}>
            2. 当社が狙う領域
          </h4>
          <div style={{ 
            overflowX: 'auto'
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
                    color: 'var(--color-text)'
                  }}>
                    市場区分
                  </th>
                  <th style={{ 
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    市場規模
                  </th>
                  <th style={{ 
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    成長率
                  </th>
                  <th style={{ 
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    当社の勝ち筋
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)' }}>
                    自社開発・自社サービス事業
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', fontWeight: 600 }}>
                    500億円
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3B82F6', textAlign: 'right', fontWeight: 600 }}>
                    +15%/年
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.5', fontWeight: 700 }}>
                    AIファーストカンパニーによるAIネイティブ設計
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)' }}>
                    AI導入ルール設計・人材育成・教育事業
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', fontWeight: 600 }}>
                    400億円
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3B82F6', textAlign: 'right', fontWeight: 600 }}>
                    +20%/年
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.5', fontWeight: 700 }}>
                    自社での成功事例が裏付けとなるルール設計や教育コンテンツ
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)' }}>
                    プロセス可視化・業務コンサル事業
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', fontWeight: 600 }}>
                    300億円
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3B82F6', textAlign: 'right', fontWeight: 600 }}>
                    +25%/年
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.5', fontWeight: 700 }}>
                    AIネイティブ設計の知見と伊藤忠Gとの連携事業
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-color)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)' }}>
                    AI駆動開発・DX支援SI事業
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text)', textAlign: 'right', fontWeight: 600 }}>
                    300億円
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3B82F6', textAlign: 'right', fontWeight: 600 }}>
                    +25%/年
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.5', fontWeight: 700 }}>
                    自社のAI駆動開発の経験とAIネイティブ設計の知見。伊藤忠Gとの連携事業
                  </td>
                </tr>
                <tr style={{ 
                  backgroundColor: '#F9FAFB',
                  borderTop: '2px solid var(--color-border-color)'
                }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                    合計
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', textAlign: 'right' }}>
                    1,500億円
                  </td>
                  <td style={{ padding: '12px 16px' }}></td>
                  <td style={{ padding: '12px 16px' }}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* タイトルとサブタイトル（SOMセクション） */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            marginBottom: '8px', 
            color: '#1F2937',
            lineHeight: '1.3',
            margin: '0 auto 8px'
          }}>
            3年後の売上目標
          </h2>
          <p style={{ 
            fontSize: '15px', 
            fontWeight: 400, 
            color: '#6B7280', 
            lineHeight: '1.6',
            margin: 0
          }}>
            各事業領域における現実的な獲得可能市場（SOM）の設定と成長戦略
          </p>
        </div>

        {/* 3. 当社が3年で獲得可能な市場（Serviceable Obtainable Market） */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            marginBottom: '16px', 
            color: 'var(--color-text)',
            paddingBottom: '8px',
            borderBottom: '2px solid var(--color-border-color)'
          }}>
            3. 当社が3年で獲得可能な市場（Serviceable Obtainable Market）
          </h4>
          <div style={{ 
            backgroundColor: '#F0FDF4',
            padding: '24px',
            borderRadius: '8px',
            border: '2px solid #10B981'
          }}>
            {/* 4分割グリッド */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ 
                padding: '16px',
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                border: '1px solid var(--color-border-color)',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '12px', lineHeight: '1.4' }}>
                  自社開発・自社サービス事業
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
                  15億円
                </div>
              </div>
              <div style={{ 
                padding: '16px',
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                border: '1px solid var(--color-border-color)',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '12px', lineHeight: '1.4' }}>
                  AI導入ルール設計・人材育成・教育事業
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
                  5億円
                </div>
              </div>
              <div style={{ 
                padding: '16px',
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                border: '1px solid var(--color-border-color)',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '12px', lineHeight: '1.4' }}>
                  プロセス可視化・業務コンサル事業
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
                  5億円
                </div>
              </div>
              <div style={{ 
                padding: '16px',
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                border: '1px solid var(--color-border-color)',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '12px', lineHeight: '1.4' }}>
                  AI駆動開発・DX支援SI事業
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>
                  5億円
                </div>
              </div>
            </div>
            
            {/* 30億円と粗利率を横並びに表示 */}
            <div style={{ 
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              alignItems: 'stretch'
            }}>
              {/* 30億円のカード */}
              <div style={{ 
                padding: '24px',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '2px solid #10B981',
                textAlign: 'center',
                flex: '1',
                maxWidth: '400px'
              }}>
                <div style={{ fontSize: '13px', color: 'var(--color-text-light)', marginBottom: '8px', fontWeight: 500 }}>
                  合計：3年後売上
                </div>
                <div style={{ fontSize: '56px', fontWeight: 800, color: '#10B981', marginBottom: '8px', lineHeight: '1.2' }}>
                  30億円
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-light)', fontWeight: 500 }}>
                  成長率20%
                </div>
              </div>
              
              {/* 粗利率のカード */}
              <div style={{ 
                padding: '24px',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '2px solid #10B981',
                textAlign: 'center',
                flex: '1',
                maxWidth: '400px'
              }}>
                <div style={{ fontSize: '13px', color: 'var(--color-text-light)', marginBottom: '8px', fontWeight: 500 }}>
                  粗利率
                </div>
                <div style={{ fontSize: '56px', fontWeight: 800, color: '#10B981', marginBottom: '8px', lineHeight: '1.2' }}>
                  40%
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-light)', fontWeight: 500 }}>
                  目標値
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 市場トレンド */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            marginBottom: '16px', 
            color: 'var(--color-text)',
            paddingBottom: '8px',
            borderBottom: '2px solid var(--color-border-color)'
          }}>
            4. 市場トレンド
          </h4>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px'
          }}>
            <div style={{ 
              padding: '16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid var(--color-border-color)',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                生成AI市場
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.6' }}>
                年率30〜40%で成長
              </div>
            </div>
            <div style={{ 
              padding: '16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid var(--color-border-color)',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                国内企業のAI導入率
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.6' }}>
                まだ15〜25% → 未成熟で伸びる余地大
              </div>
            </div>
            <div style={{ 
              padding: '16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid var(--color-border-color)',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                政府のAI投資
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.6' }}>
                G7内でも最大級の成長率
              </div>
            </div>
            <div style={{ 
              padding: '16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid var(--color-border-color)',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                AIガバナンス/ルール設計需要
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.6' }}>
                急拡大
              </div>
            </div>
            <div style={{ 
              padding: '16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid var(--color-border-color)',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                中小企業DX市場
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.6' }}>
                年間20%成長
              </div>
            </div>
          </div>
        </div>

        {/* ターゲット顧客セクション */}
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          marginBottom: '12px', 
          marginTop: '48px',
          color: 'var(--color-text)', 
          borderLeft: '3px solid var(--color-primary)', 
          paddingLeft: '8px' 
        }}>
          ターゲット顧客
        </h3>

        {/* タイトルとサブタイトル（ターゲット顧客セクション） */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            marginBottom: '8px', 
            color: '#1F2937',
            lineHeight: '1.3',
            margin: '0 auto 8px'
          }}>
            ターゲット顧客セグメント
          </h2>
          <p style={{ 
            fontSize: '15px', 
            fontWeight: 400, 
            color: '#6B7280', 
            lineHeight: '1.6',
            margin: 0
          }}>
            各セグメントにおける収益獲得戦略と想定LTV
          </p>
        </div>

        {/* ターゲット顧客カード */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px'
          }}>
            {/* 自治体 */}
            <div style={{ 
              padding: '20px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid var(--color-border-color)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>
                自治体
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.5', marginBottom: '16px' }}>
                子育て/介護アプリ導入
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, marginBottom: '6px' }}>
                  課題（Pain）
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                  子育て・介護の情報が分散、アプリ開発の内製化が不可
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 600, marginBottom: '6px' }}>
                  提供価値（Value）
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                  AIアシスタントによるワンストップ支援、市民満足度向上、DX補助金活用
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, marginBottom: '6px' }}>
                  決裁者・難易度
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                  市長/部長 | 難易度：高（長いプロセス・年予算制）
                </div>
              </div>
              
              <div style={{ 
                padding: '10px 12px',
                backgroundColor: '#F3F4F6',
                borderRadius: '6px',
                borderTop: '2px solid #9CA3AF',
                marginTop: 'auto'
              }}>
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px', fontWeight: 600 }}>
                  3年後売上貢献
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', marginBottom: '2px' }}>
                  15億円
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                  想定LTV: 中〜高
                </div>
              </div>
            </div>
            
            {/* 大企業 */}
            <div style={{ 
              padding: '20px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid var(--color-border-color)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>
                大企業
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.5', marginBottom: '16px' }}>
                AIルール設計・ガバナンス支援
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, marginBottom: '6px' }}>
                  課題（Pain）
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                  ガバナンス整っていない、内製化の人材不足
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 600, marginBottom: '6px' }}>
                  提供価値（Value）
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                  AIルール設計の標準化、ガイドライン構築、内製推進
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, marginBottom: '6px' }}>
                  決裁者・難易度
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                  情報システム部/DX部門 | 難易度：中（PoC → ルール設計 → 全社導入）
                </div>
              </div>
              
              <div style={{ 
                padding: '10px 12px',
                backgroundColor: '#F3F4F6',
                borderRadius: '6px',
                borderTop: '2px solid #10B981',
                marginTop: 'auto'
              }}>
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px', fontWeight: 600 }}>
                  3年後売上貢献
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', marginBottom: '2px' }}>
                  5億円
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                  想定LTV: 高
                </div>
              </div>
            </div>
            
            {/* 中堅企業 */}
            <div style={{ 
              padding: '20px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid var(--color-border-color)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>
                中堅企業
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.5', marginBottom: '16px' }}>
                AI導入コンサル・教育
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, marginBottom: '6px' }}>
                  課題（Pain）
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                  AI導入の予算が限られる、スキル不足
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 600, marginBottom: '6px' }}>
                  提供価値（Value）
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                  低コスト導入、研修支援、業務改善ベースのコンサル提供
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, marginBottom: '6px' }}>
                  決裁者・難易度
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                  代表/管理部 | 難易度：低〜中（意思決定が早い）
                </div>
              </div>
              
              <div style={{ 
                padding: '10px 12px',
                backgroundColor: '#F3F4F6',
                borderRadius: '6px',
                borderTop: '2px solid #3B82F6',
                marginTop: 'auto'
              }}>
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px', fontWeight: 600 }}>
                  3年後売上貢献
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', marginBottom: '2px' }}>
                  5億円
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                  想定LTV: 中
                </div>
              </div>
            </div>
            
            {/* 医療法人 */}
            <div style={{ 
              padding: '20px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid var(--color-border-color)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>
                医療法人
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.5', marginBottom: '16px' }}>
                業務DX支援
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, marginBottom: '6px' }}>
                  課題（Pain）
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                  紙文化・非効率業務、職員不足
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 600, marginBottom: '6px' }}>
                  提供価値（Value）
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                  AIによる業務簡略化、入力支援、DX補助金活用
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, marginBottom: '6px' }}>
                  決裁者・難易度
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                  院長/事務長 | 難易度：中（補助金活用次第で早い）
                </div>
              </div>
              
              <div style={{ 
                padding: '10px 12px',
                backgroundColor: '#F3F4F6',
                borderRadius: '6px',
                borderTop: '2px solid #9CA3AF',
                marginTop: 'auto'
              }}>
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px', fontWeight: 600 }}>
                  3年後売上貢献
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', marginBottom: '2px' }}>
                  5億円
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                  想定LTV: 中〜高
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
