'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { useParams } from 'next/navigation';
import { useConcept } from '../hooks/useConcept';
import { ContainerVisibilityContext } from '../hooks/useContainerVisibility';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import { waitForMermaid, renderMermaidDiagram } from '@/lib/mermaidLoader';

// コンポーネント化されたページのコンポーネント（条件付きインポート）
const ComponentizedOverview = dynamic(
  () => import('@/components/pages/component-test/test-concept/ComponentizedOverview'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: 'var(--color-text-light)',
      }}>
        読み込み中...
      </div>
    ),
  }
);

export default function BusinessModelPage() {
  const params = useParams();
  const serviceId = params.serviceId as string;
  const conceptId = params.conceptId as string;
  const { concept, loading } = useConcept();
  
  // ContainerVisibilityContextが利用可能かチェック（条件付きで使用）
  const containerVisibilityContext = useContext(ContainerVisibilityContext);
  const showContainers = containerVisibilityContext?.showContainers ?? false;

  // すべてのHooksを早期リターンの前に呼び出す（React Hooksのルール）
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const businessModelDiagramRef = useRef<HTMLDivElement>(null);
  const businessModelRenderedRef = useRef(false);

  // Mermaidが読み込まれるまで待つ（統一管理されたユーティリティを使用）
  useEffect(() => {
    if (typeof window === 'undefined') return;

    waitForMermaid()
      .then(() => {
        setMermaidLoaded(true);
      })
      .catch((error) => {
        console.error('Mermaid読み込みエラー:', error);
      });
  }, []);

  // ビジネスモデル図を生成
  const generateBusinessModelDiagram = () => {
    // 介護支援パーソナルAppの場合
    if (conceptId === 'care-support') {
      return `graph LR
    direction LR
    classDef partnerClass fill:#FFB6C1,stroke:#FF69B4,stroke-width:2px,color:#000
    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff
    classDef userClass fill:#90EE90,stroke:#32CD32,stroke-width:2px,color:#000
    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:2px,color:#000
    classDef paymentClass fill:#90EE90,stroke:#32CD32,stroke-width:3px,color:#000
    
    P1["税理士・法律パートナー<br/>相続・税金問題の相談<br/>紹介手数料"]
    P2["不動産パートナー<br/>不動産関連<br/>紹介手数料"]
    P3["介護施設・医療パートナー<br/>介護施設・医療機関の紹介<br/>マッチング手数料"]
    C["株式会社AIアシスタント<br/>介護支援パーソナルアプリ提供"]
    E["企業<br/>従業員向け福利厚生<br/>企業契約"]
    G["自治体<br/>住民向けサービス<br/>自治体契約"]
    A["認定取得支援<br/>介護休業制度整備支援<br/>介護支援制度整備支援<br/>介護離職ゼロの取り組み支援<br/>企業向け"]
    
    subgraph EndUsers1["エンドユーザー"]
      U1["一般利用者<br/>プレミアムプラン<br/>月額/年額"]
      U2["一般利用者<br/>無料プラン"]
    end
    
    subgraph EndUsers2["エンドユーザー"]
      E2["企業の従業員"]
      G2["自治体の住民"]
    end
    
    P1 ==>|💰 紹介手数料| C
    P2 ==>|💰 紹介手数料| C
    P3 ==>|💰 マッチング手数料| C
    C -->|直接提供| U1
    C -->|直接提供| U2
    C -->|B2B提供| E
    C -->|B2B提供| G
    C -->|認定取得支援サービス提供| A
    
    U1 ==>|💰 月額/年額| C
    E ==>|💰 企業契約| C
    E -->|提供| E2
    G ==>|💰 自治体契約| C
    G -->|提供| G2
    A ==>|💰 認定取得支援手数料| C
    A -->|認定取得支援サービス提供| E
    
    class P1,P2,P3 partnerClass
    class C companyClass
    class U1 paymentClass
    class E paymentClass
    class G paymentClass
    class A paymentClass
    class U2,E2,G2 userClass`;
    }
    
    // 出産支援パーソナルAppの場合（デフォルト）
    return `graph LR
    direction LR
    classDef partnerClass fill:#FFB6C1,stroke:#FF69B4,stroke-width:2px,color:#000
    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff
    classDef userClass fill:#90EE90,stroke:#32CD32,stroke-width:2px,color:#000
    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:2px,color:#000
    classDef paymentClass fill:#90EE90,stroke:#32CD32,stroke-width:3px,color:#000
    
    P1["パートナー企業<br/>広告費・紹介手数料"]
    P2["パートナー企業<br/>代行手数料・リファラル手数料"]
    P3["パートナー企業<br/>マッチング手数料"]
    C["株式会社AIアシスタント<br/>出産支援パーソナルアプリ提供"]
    E["企業<br/>従業員向け福利厚生<br/>企業契約"]
    G["自治体<br/>住民向けサービス<br/>自治体契約"]
    A["認定取得支援<br/>くるみん認定取得支援<br/>健康経営優良法人認定取得<br/>企業向け"]
    
    subgraph EndUsers1["エンドユーザー"]
      U1["一般利用者<br/>プレミアムプラン<br/>月額/年額"]
      U2["一般利用者<br/>無料プラン"]
    end
    
    subgraph EndUsers2["エンドユーザー"]
      E2["企業の従業員"]
      G2["自治体の住民"]
    end
    
    P1 ==>|💰 広告費・紹介手数料| C
    P2 ==>|💰 代行手数料・リファラル手数料| C
    P3 ==>|💰 マッチング手数料| C
    C -->|直接提供| U1
    C -->|直接提供| U2
    C -->|B2B提供| E
    C -->|B2B提供| G
    C -->|認定取得支援サービス提供| A
    
    U1 ==>|💰 月額/年額| C
    E ==>|💰 企業契約| C
    E -->|提供| E2
    G ==>|💰 自治体契約| C
    G -->|提供| G2
    A ==>|💰 認定取得支援手数料| C
    A -->|認定取得支援サービス提供| E
    
    class P1,P2,P3 partnerClass
    class C companyClass
    class U1 paymentClass
    class E paymentClass
    class G paymentClass
    class A paymentClass
    class U2,E2,G2 userClass`;
  };

  // conceptIdが変更されたときにレンダリングフラグをリセット
  useEffect(() => {
    businessModelRenderedRef.current = false;
    if (businessModelDiagramRef.current) {
      businessModelDiagramRef.current.innerHTML = '';
    }
  }, [conceptId]);

  // ビジネスモデル図をレンダリング（統一管理されたユーティリティを使用）
  useEffect(() => {
    if (conceptId !== 'maternity-support' && conceptId !== 'care-support') {
      return;
    }

    const renderDiagram = async () => {
      // DOM要素が存在するまで待つ
      let domRetries = 0;
      const maxDomRetries = 50; // 5秒間
      while (domRetries < maxDomRetries && !businessModelDiagramRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        domRetries++;
      }

      if (!businessModelDiagramRef.current) {
        return;
      }

      if (businessModelRenderedRef.current) {
        return;
      }
      
      // Mermaidが利用可能になるまで待つ（統一管理されたユーティリティを使用）
      try {
        await waitForMermaid();
        
        if (!businessModelDiagramRef.current || businessModelRenderedRef.current) {
          return;
        }

        const diagram = generateBusinessModelDiagram();
        const svg = await renderMermaidDiagram(diagram);
        
        if (businessModelDiagramRef.current) {
          businessModelDiagramRef.current.innerHTML = svg;
        }
        businessModelRenderedRef.current = true;
        setMermaidLoaded(true);
      } catch (err: any) {
        console.error('Mermaidレンダリングエラー:', err);
        businessModelRenderedRef.current = false;
        if (businessModelDiagramRef.current) {
          businessModelDiagramRef.current.innerHTML = `
            <div style="padding: 20px; color: #dc3545; border: 1px solid #dc3545; border-radius: 6px; background: rgba(220, 53, 69, 0.1);">
              <strong>グラフのレンダリングエラー:</strong><br/>
              ${err?.message || '不明なエラーが発生しました'}<br/>
              <small style="font-size: 11px; margin-top: 8px; display: block;">詳細はブラウザのコンソール（F12）を確認してください。</small>
            </div>
          `;
        }
      }
    };

    // 少し待ってからレンダリングを開始
    const timer = setTimeout(() => {
      renderDiagram();
    }, 100);

    return () => clearTimeout(timer);
  }, [conceptId, mermaidLoaded]);

  // コンポーネント化されたページを使用するかチェック
  if ((serviceId === 'component-test' && conceptId === 'test-concept') ||
      conceptId.includes('-componentized')) {
    return (
      <ErrorBoundary>
        <ComponentizedOverview />
      </ErrorBoundary>
    );
  }

  // 出産支援パーソナルAppと介護支援パーソナルApp以外の構想の場合は、未実装メッセージを表示
  if (conceptId !== 'maternity-support' && conceptId !== 'care-support') {
    return (
      <>
        <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
          ビジネスモデル
        </p>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
              この構想のビジネスモデルページは現在準備中です。
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        ビジネスモデル
      </p>
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px' }}>
        <div 
          data-page-container="1"
          style={{ 
            marginBottom: '24px',
            ...(showContainers ? {
              border: '2px dashed var(--color-primary)',
              borderRadius: '8px',
              padding: '16px',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            } : {}),
          }}
        >
          <h4 
            data-pdf-title-h3="true"
            style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}
          >
            ビジネスモデル
          </h4>
          {/* キーメッセージとサブメッセージ */}
          <div className="key-message-container" style={{ 
            marginBottom: '32px'
          }}>
            <h2 className="key-message-title">
              多様な収益源で持続可能な成長を実現
            </h2>
            <p className="key-message-subtitle gradient-text-blue">
              個人ユーザーへの直接提供、企業・自治体へのB2B提供、パートナー企業との連携により、多角的な収益構造を構築
            </p>
          </div>
          <div style={{ marginBottom: '16px', paddingLeft: '11px' }}>
            <p style={{ fontSize: '14px', lineHeight: '1.8', marginBottom: '16px', color: 'var(--color-text)' }}>
              {conceptId === 'care-support' 
                ? '介護支援パーソナルアプリケーションは、個人ユーザーへの直接提供、企業・自治体へのB2B提供、パートナー企業からの広告費・紹介手数料、認定取得支援サービスなど、多様な収益源を持つビジネスモデルを採用しています。一般利用者には無料プランとプレミアムプランを提供し、企業や自治体には従業員・住民向けの福利厚生サービスとして提供することで、持続可能な成長を実現します。'
                : '出産支援パーソナルアプリケーションは、個人ユーザーへの直接提供、企業・自治体へのB2B提供、パートナー企業からの広告費・紹介手数料、認定取得支援サービスなど、多様な収益源を持つビジネスモデルを採用しています。一般利用者には無料プランとプレミアムプランを提供し、企業や自治体には従業員・住民向けの福利厚生サービスとして提供することで、持続可能な成長を実現します。'}
            </p>
            <div
              ref={businessModelDiagramRef}
              style={{
                width: '100%',
                overflowX: 'auto',
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid var(--color-border-color)',
              }}
            />
          </div>
        </div>

        {/* 収益モデルセクション */}
        <div 
          data-page-container="2"
          style={{ 
            marginBottom: '24px',
            ...(showContainers ? {
              border: '2px dashed var(--color-primary)',
              borderRadius: '8px',
              padding: '16px',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            } : {}),
          }}
        >
          <h4 
            data-pdf-title-h3="true"
            style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}
          >
            収益モデル
          </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', paddingLeft: '11px' }}>
              <div style={{ 
                backgroundColor: '#fff', 
                borderRadius: '8px', 
                padding: '16px', 
                border: '1px solid var(--color-border-color)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                  パートナー連携による収益
                </h5>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                  <li>広告費</li>
                  <li>紹介手数料</li>
                  <li>代行手数料</li>
                  <li>リファラル手数料</li>
                  <li>マッチング手数料</li>
                </ul>
              </div>
              <div style={{ 
                backgroundColor: '#fff', 
                borderRadius: '8px', 
                padding: '16px', 
                border: '1px solid var(--color-border-color)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                  個人ユーザーからの収益
                </h5>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                  <li>プレミアムプランの月額/年額料金</li>
                </ul>
              </div>
              <div style={{ 
                backgroundColor: '#fff', 
                borderRadius: '8px', 
                padding: '16px', 
                border: '1px solid var(--color-border-color)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                  B2B収益
                </h5>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                  <li>企業契約（従業員向け福利厚生）</li>
                  <li>自治体契約（住民向けサービス）</li>
                </ul>
              </div>
              <div style={{ 
                backgroundColor: '#fff', 
                borderRadius: '8px', 
                padding: '16px', 
                border: '1px solid var(--color-border-color)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                  認定取得支援
                </h5>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                  <li>企業向け認定取得支援サービスの手数料</li>
                </ul>
              </div>
            </div>
        </div>

        {/* サービス提供先セクション */}
        <div 
          data-page-container="3"
          style={{ 
            marginBottom: '24px',
            ...(showContainers ? {
              border: '2px dashed var(--color-primary)',
              borderRadius: '8px',
              padding: '16px',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            } : {}),
          }}
        >
          <h4 
            data-pdf-title-h3="true"
            style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}
          >
            サービス提供先
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', paddingLeft: '11px' }}>
            <div style={{ 
              backgroundColor: '#fff', 
              borderRadius: '8px', 
              padding: '16px', 
              border: '1px solid var(--color-border-color)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                個人ユーザー
              </h5>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                無料版とプレミアムプラン
              </p>
            </div>
            <div style={{ 
              backgroundColor: '#fff', 
              borderRadius: '8px', 
              padding: '16px', 
              border: '1px solid var(--color-border-color)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                企業
              </h5>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                従業員向け福利厚生として提供
              </p>
            </div>
            <div style={{ 
              backgroundColor: '#fff', 
              borderRadius: '8px', 
              padding: '16px', 
              border: '1px solid var(--color-border-color)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                自治体
              </h5>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                住民向けサービスとして提供
              </p>
            </div>
            <div style={{ 
              backgroundColor: '#fff', 
              borderRadius: '8px', 
              padding: '16px', 
              border: '1px solid var(--color-border-color)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                パートナー企業
              </h5>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                連携サービス提供・マッチング
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

