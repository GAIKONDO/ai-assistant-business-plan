'use client';

export default function FeaturesPage() {
  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        提供機能
      </p>
      <div className="card">
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
            機能一覧
          </h3>
          <div style={{ 
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '32px', 
              fontWeight: 700, 
              color: 'var(--color-text)',
              lineHeight: '1.3',
              letterSpacing: '-0.5px'
            }}>
              出産・育児を支える包括的な機能群
            </h2>
            <p style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 500,
              color: 'var(--color-text)',
              letterSpacing: '0.3px',
              lineHeight: '1.6'
            }}>
              支援制度の検索から申請手続き、家族との情報共有まで、必要な機能をワンストップで提供
            </p>
          </div>
          <div style={{ paddingLeft: '11px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--color-border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', width: '30%' }}>機能名</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>説明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>1. 支援制度の検索・閲覧</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>国、都道府県、市区町村、企業などの支援制度を一元管理し、効率的に検索・閲覧できる</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>2. 支援制度の詳細情報表示</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>各支援制度の詳細情報（申請方法、必要書類、支給金額など）を分かりやすく表示</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>3. Mermaid図による可視化</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>制度の仕組みや申請フロー、関係組織などを視覚的に分かりやすく表示</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>4. アクション管理</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>申請予定の制度を管理し、申請期限を可視化。リマインダー機能で期限を逃さないようサポート</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>5. 統計情報の表示</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>カテゴリ別の支援制度の件数や支給金額の合計を表示し、全体像を把握できる</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>6. 収支概算</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>子育てにかかる収支の概算を表示し、経済的な見通しを立てやすくする</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>7. AIアシスタント機能</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>24時間365日いつでも育児に関する相談やアドバイスを受けられる伴走型育児支援</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>8. 電子母子手帳機能</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>妊婦健診の記録を電子化し、いつでも確認できる。データの共有も容易</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>9. 家族・パートナーとの情報共有</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>アカウント共有機能により、家族やパートナーと情報を共有し、申請手続きや記録を共同で管理</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>10. パートナー連携</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>教育サービス、保険、医療・ヘルスケア、ECサイトなど、様々なパートナーと連携し、ワンストップで必要なサービスを利用できる</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 提供先別セクション */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
            一般利用者（無料プラン/プレミアムプラン）
          </h3>
          <div style={{ 
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '32px', 
              fontWeight: 700, 
              color: 'var(--color-text)',
              lineHeight: '1.3',
              letterSpacing: '-0.5px'
            }}>
              個人ユーザー向けサービスプラン
            </h2>
            <p style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 500,
              color: 'var(--color-text)',
              letterSpacing: '0.3px',
              lineHeight: '1.6'
            }}>
              基本機能を無料で利用できる無料プランと、より高度な機能を提供するプレミアムプランをご用意
            </p>
          </div>
          <div style={{ paddingLeft: '11px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--color-border-color)', borderRadius: '8px', overflow: 'hidden', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '50px' }}>項番</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '150px' }}>サービス名</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '150px' }}>対象</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '120px' }}>料金</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '200px' }}>主な機能・特徴</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '200px' }}>サービス説明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>1</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>一般利用者（無料プラン）</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>個人ユーザー（妊婦、出産予定者、育児中の方）</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>無料</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', lineHeight: '1.8' }}>
                      <li>支援制度の検索・閲覧</li>
                      <li>支援制度の詳細情報表示</li>
                      <li>アクション管理・タスクレポート</li>
                      <li>統計情報の表示</li>
                      <li>電子母子手帳機能</li>
                      <li>AIアシスタントによる伴走型育児支援（制限付き）</li>
                      <li>検索機能</li>
                      <li>収支概算</li>
                    </ul>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>個人ユーザーは基本機能を無料で利用できます。</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>2</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>一般利用者（プレミアムプラン）</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>個人ユーザー（より高度な機能を求める方）</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>月額980円または年額9,800円</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', lineHeight: '1.8' }}>
                      <li>AIアシスタントによる伴走型育児支援（24時間365日の育児相談、パーソナライズドアドバイス）</li>
                      <li>AIアシスタントの高度な機能</li>
                      <li>優先的なカスタマーサポート</li>
                      <li>詳細な統計情報の閲覧</li>
                      <li>カスタムレポートの生成</li>
                      <li>薬・予防接種・検査の紹介</li>
                      <li>継続的な伴走支援</li>
                    </ul>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>無料プランのすべての機能を含み、より高度な機能や優先サポートが必要な個人ユーザー向けの有料プランです。</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
            企業向け提供
          </h3>
          <div style={{ 
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '32px', 
              fontWeight: 700, 
              color: 'var(--color-text)',
              lineHeight: '1.3',
              letterSpacing: '-0.5px'
            }}>
              企業の従業員向け福利厚生サービス
            </h2>
            <p style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 500,
              color: 'var(--color-text)',
              letterSpacing: '0.3px',
              lineHeight: '1.6'
            }}>
              従業員の満足度向上と離職率低下に貢献する、企業向けの包括的なサービスプラン
            </p>
          </div>
          <div style={{ paddingLeft: '11px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--color-border-color)', borderRadius: '8px', overflow: 'hidden', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '50px' }}>項番</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '150px' }}>サービス名</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '150px' }}>対象</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '120px' }}>料金</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '200px' }}>主な機能・特徴</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '200px' }}>サービス説明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>1</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>企業向けカスタムアプリ提供（福利厚生・労務管理）</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>企業（従業員向け福利厚生・労務管理）</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>月額従業員1人あたり 500円</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', lineHeight: '1.8' }}>
                      <li>企業カスタマイズ（ロゴ・ブランディング、独自支援制度）</li>
                      <li>福利厚生・労務管理（育児休暇、復職タイミング、育児パパ休業の管理）</li>
                      <li>報告資料作成支援（厚生労働省への報告資料）</li>
                      <li>利用状況レポート・専任サポート</li>
                      <li>全機能へのアクセス</li>
                    </ul>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>企業のカスタマイズを施したアプリを提供します。企業ロゴ・ブランディングのカスタマイズ、企業独自の支援制度情報の追加、企業の福利厚生管理、育児休暇・復職タイミング・育児パパ休業の管理、厚生労働省への報告資料作成支援、従業員の利用状況レポート、専任サポート担当者の配置など、企業の労務管理を包括的にサポートします。</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>2</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>認定取得支援</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>企業（認定取得を目指す企業）</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>要相談</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', lineHeight: '1.8' }}>
                      <li>くるみん認定取得支援</li>
                      <li>健康経営優良法人認定取得支援</li>
                    </ul>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>企業の社会的評価向上のため、くるみん認定や健康経営優良法人認定の取得をサポートします。</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>3</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>申請代行サービス</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>企業（従業員の申請手続きを代行してほしい場合）</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>1件あたり3,000円から、成功報酬型も選択可能</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', lineHeight: '1.8' }}>
                      <li>書類作成の代行</li>
                      <li>申請手続きの代行</li>
                      <li>提出までの完全サポート</li>
                      <li>成功報酬型の料金体系</li>
                    </ul>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>支援制度の申請手続きを代行する有料サービスを提供します。</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
            自治体向け提供
          </h3>
          <div style={{ 
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '32px', 
              fontWeight: 700, 
              color: 'var(--color-text)',
              lineHeight: '1.3',
              letterSpacing: '-0.5px'
            }}>
              自治体の住民向けサービス提供
            </h2>
            <p style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 500,
              color: 'var(--color-text)',
              letterSpacing: '0.3px',
              lineHeight: '1.6'
            }}>
              住民の子育て支援を強化し、自治体独自の支援制度を効率的に周知できるサービスプラン
            </p>
          </div>
          <div style={{ paddingLeft: '11px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--color-border-color)', borderRadius: '8px', overflow: 'hidden', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '50px' }}>項番</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '150px' }}>サービス名</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '150px' }}>対象</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '120px' }}>料金</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '200px' }}>主な機能・特徴</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '200px' }}>サービス説明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>1</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>自治体向けカスタムアプリ提供（住民サービス）</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>自治体（住民向けサービス）</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>月額利用者1人あたり 300円</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', lineHeight: '1.8' }}>
                      <li>自治体カスタマイズ（ロゴ、独自支援制度）</li>
                      <li>住民の利用状況レポート</li>
                      <li>自治体向け専用サポート</li>
                      <li>全機能へのアクセス</li>
                    </ul>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>市区町村などの自治体が住民向けサービスとして本アプリケーションを提供できます。自治体ロゴのカスタマイズ、自治体独自の支援制度情報の追加、住民の利用状況レポート、自治体向け専用サポートなど、自治体の子育て支援施策を包括的にサポートします。</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
            パートナー連携
          </h3>
          <div style={{ 
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '32px', 
              fontWeight: 700, 
              color: 'var(--color-text)',
              lineHeight: '1.3',
              letterSpacing: '-0.5px'
            }}>
              多様なパートナーとの連携サービス
            </h2>
            <p style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 500,
              color: 'var(--color-text)',
              letterSpacing: '0.3px',
              lineHeight: '1.6'
            }}>
              教育、保険、医療・ヘルスケア、EC、マッチングなど、様々なパートナーと連携し、ワンストップで必要なサービスを提供
            </p>
          </div>
          <div style={{ paddingLeft: '11px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--color-border-color)', borderRadius: '8px', overflow: 'hidden', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '50px' }}>項番</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '150px' }}>サービス名</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '150px' }}>対象</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '120px' }}>料金</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '200px' }}>主な機能・特徴</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '200px' }}>サービス説明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>1</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>教育サービス紹介・マッチング</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>教育サービス事業者</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>紹介1件あたり1,000円<br />継続利用で月額手数料</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', lineHeight: '1.8' }}>
                      <li>教育サービスの紹介</li>
                      <li>ユーザーと教育サービスのマッチング</li>
                      <li>紹介手数料の獲得</li>
                      <li>継続利用に伴う月額手数料</li>
                    </ul>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>知育サービスや学習塾などの教育サービスと連携し、ユーザーを紹介します。</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>2</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>保険紹介・代行サービス</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>個人ユーザー（保険加入を検討している方）</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>紹介1件あたり1,000円<br />保険加入手続き代行1件あたり5,000円から</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', lineHeight: '1.8' }}>
                      <li>乳児・児童保険の紹介</li>
                      <li>学生保険の紹介</li>
                      <li>学業費用保険の紹介</li>
                      <li>保険加入手続きの代行</li>
                      <li>保険相談サービス</li>
                    </ul>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>乳児・児童向けの保険、学生保険、学業費用保険などの保険パートナーと連携し、ユーザーへの保険紹介および加入手続きの代行サービスを提供します。</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>3</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>医療・ヘルスケアサービス紹介・代行</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>個人ユーザー（医療・ヘルスケアサービスを利用したい方）</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>紹介1件あたり1,000円<br />医療サービス手続き代行1件あたり4,000円から</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', lineHeight: '1.8' }}>
                      <li>薬の紹介・相談</li>
                      <li>予防接種の案内</li>
                      <li>遺伝子検査の紹介</li>
                      <li>アレルギー検査の紹介</li>
                      <li>医療サービス手続きの代行</li>
                    </ul>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>薬の紹介、予防接種の案内、遺伝子検査、アレルギー検査などの医療・ヘルスケアパートナーと連携し、ユーザーへの紹介および手続き代行サービスを提供します。</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>4</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>ECアフィリエイト連携</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>ECサイト運営企業</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>売上高の3~10%</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', lineHeight: '1.8' }}>
                      <li>育児用品の紹介</li>
                      <li>ベビー用品の紹介</li>
                      <li>マタニティ用品の紹介</li>
                      <li>商品購入に伴うリファラル手数料</li>
                      <li>購入データの分析・レポート</li>
                    </ul>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>育児用品、ベビー用品、マタニティ用品などのECサイトと連携し、ユーザーが商品を購入した際にリファラル手数料を受け取ります。</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>5</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>家事代行・学習支援マッチング</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>個人ユーザー（家事代行・学習支援サービスを利用したい方）</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>マッチング成立時に料金の10~20%</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', lineHeight: '1.8' }}>
                      <li>家政婦・家事代行サービスのマッチング</li>
                      <li>専門教師・家庭教師のマッチング</li>
                      <li>ベビーシッターのマッチング</li>
                      <li>ユーザーとサービス提供者のマッチング</li>
                      <li>マッチング成立時の手数料</li>
                    </ul>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>育児中の家庭を支援するため、家政婦・家事代行サービスや専門教師・家庭教師とのマッチングサービスを提供します。</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>6</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>広告サービス</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>広告主（育児・出産関連サービス提供企業）</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>要相談（表示回数・クリック数・成果に応じた料金体系）</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', lineHeight: '1.8' }}>
                      <li>バナー広告の掲載</li>
                      <li>ネイティブ広告の掲載</li>
                      <li>ターゲティング広告の配信</li>
                      <li>広告効果の測定・レポート</li>
                    </ul>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>育児・出産関連のサービスを提供する企業向けに、アプリ内での広告掲載サービスを提供します。表示回数、クリック数、成果に応じた柔軟な料金体系で、ターゲットユーザーに効果的にリーチできます。</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

