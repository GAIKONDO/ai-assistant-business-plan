'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useConcept } from '../layout';
import Script from 'next/script';

export default function OverviewPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const conceptId = params.conceptId as string;
  const { concept, loading } = useConcept();

  const keyVisualUrl = concept?.keyVisualUrl || '';
  const [keyVisualHeight, setKeyVisualHeight] = useState<number>(56.25);
  const [showSizeControl, setShowSizeControl] = useState(false);
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const [aiNativeDiagramSvg, setAiNativeDiagramSvg] = useState<string>('');
  const aiNativeDiagramRef = useRef<HTMLDivElement>(null);
  const aiNativeRenderedRef = useRef(false);
  const businessModelDiagramRef = useRef<HTMLDivElement>(null);
  const businessModelRenderedRef = useRef(false);
  
  // キービジュアルの高さを読み込む
  useEffect(() => {
    if (concept?.keyVisualHeight !== undefined) {
      setKeyVisualHeight(concept.keyVisualHeight);
    }
  }, [concept?.keyVisualHeight]);

  // Mermaidが読み込まれたときの処理
  useEffect(() => {
    const checkMermaid = () => {
      if (typeof window !== 'undefined' && (window as any).mermaid) {
        setMermaidLoaded(true);
      }
    };

    const handleMermaidLoaded = () => {
      setMermaidLoaded(true);
    };

    if (typeof window !== 'undefined') {
      // 既に読み込まれている場合
      checkMermaid();
      
      // イベントリスナーを追加
      window.addEventListener('mermaidloaded', handleMermaidLoaded);
      
      // 定期的にチェック（フォールバック）
      const interval = setInterval(() => {
        checkMermaid();
      }, 100);
      
      // 5秒後にクリア
      setTimeout(() => {
        clearInterval(interval);
      }, 5000);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mermaidloaded', handleMermaidLoaded);
      }
    };
  }, []);

  // AIネイティブ設計の関係図を生成
  const generateAiNativeDiagram = () => {
    return `graph TB
    Center["AIネイティブ設計"]
    
    A1["<b>自動情報収集・更新</b><br/>常に最新の情報を提供"]
    A2["<b>パーソナライズ化</b><br/>個別最適化を低コストで実現"]
    A3["<b>24時間365日サポート</b><br/>専門知識に基づく即座の対応"]
    A4["<b>自動可視化</b><br/>複雑なフローを分かりやすく"]
    A5["<b>パートナー連携</b><br/>ワンストップでサービス提供"]
    A6["<b>継続的改善</b><br/>ユーザーデータから自動改善"]
    A7["<b>ユーザーフレンドリーなUI設計</b><br/>直感的で使いやすいインターフェース"]
    
    Center --> A1
    Center --> A2
    Center --> A3
    Center --> A4
    Center --> A5
    Center --> A6
    Center --> A7
    
    style Center fill:#667eea,stroke:#4c51bf,stroke-width:4px,color:#fff,font-size:18px
    style A1 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style A2 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style A3 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style A4 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style A5 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style A6 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style A7 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px`;
  };

  // conceptIdが変更されたときにレンダリングフラグをリセット
  useEffect(() => {
    aiNativeRenderedRef.current = false;
    businessModelRenderedRef.current = false;
    if (aiNativeDiagramRef.current) {
      aiNativeDiagramRef.current.innerHTML = '';
    }
    if (businessModelDiagramRef.current) {
      businessModelDiagramRef.current.innerHTML = '';
    }
  }, [conceptId]);

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

  // Mermaid図をレンダリング
  useEffect(() => {
    if (conceptId !== 'maternity-support' && conceptId !== 'care-support') {
      aiNativeRenderedRef.current = false;
      if (aiNativeDiagramRef.current) {
        aiNativeDiagramRef.current.innerHTML = '';
      }
      return;
    }

    if (!mermaidLoaded) {
      return;
    }

    if (!aiNativeDiagramRef.current || aiNativeRenderedRef.current) {
      return;
    }

    const renderDiagram = async () => {
      try {
        // 少し待ってからレンダリング
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const mermaid = (window as any).mermaid;
        if (!mermaid) {
          console.log('Mermaid not available');
          return;
        }

        if (!aiNativeDiagramRef.current) {
          return;
        }

        const diagram = generateAiNativeDiagram();
        const id = 'ai-native-diagram-' + Date.now();
        
        if (typeof mermaid.render === 'function') {
          const result = await mermaid.render(id, diagram);
          const svg = typeof result === 'string' ? result : result.svg;
          setAiNativeDiagramSvg(svg);
          if (aiNativeDiagramRef.current) {
            aiNativeDiagramRef.current.innerHTML = svg;
          }
          aiNativeRenderedRef.current = true;
        } else {
          const tempContainer = document.createElement('div');
          tempContainer.style.position = 'absolute';
          tempContainer.style.left = '-9999px';
          tempContainer.style.visibility = 'hidden';
          document.body.appendChild(tempContainer);
          
          const diagramDiv = document.createElement('div');
          diagramDiv.className = 'mermaid';
          diagramDiv.textContent = diagram;
          tempContainer.appendChild(diagramDiv);
          
          await mermaid.run({
            nodes: [diagramDiv],
          });
          
          const svg = tempContainer.innerHTML;
          document.body.removeChild(tempContainer);
          setAiNativeDiagramSvg(svg);
          if (aiNativeDiagramRef.current) {
            aiNativeDiagramRef.current.innerHTML = svg;
          }
          aiNativeRenderedRef.current = true;
        }
      } catch (err: any) {
        console.error('Mermaidレンダリングエラー:', err);
      }
    };

    renderDiagram();
  }, [mermaidLoaded, conceptId]);

  // ビジネスモデル図をレンダリング
  useEffect(() => {
    if (conceptId !== 'maternity-support' && conceptId !== 'care-support') {
      businessModelRenderedRef.current = false;
      if (businessModelDiagramRef.current) {
        businessModelDiagramRef.current.innerHTML = '';
      }
      return;
    }

    if (!mermaidLoaded) {
      return;
    }

    if (!businessModelDiagramRef.current || businessModelRenderedRef.current) {
      return;
    }

    const renderDiagram = async () => {
      try {
        // 少し待ってからレンダリング
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const mermaid = (window as any).mermaid;
        if (!mermaid) {
          console.log('Mermaid not available');
          return;
        }

        if (!businessModelDiagramRef.current) {
          return;
        }

        const diagram = generateBusinessModelDiagram();
        const id = 'business-model-diagram-' + Date.now();
        
        if (typeof mermaid.render === 'function') {
          const result = await mermaid.render(id, diagram);
          const svg = typeof result === 'string' ? result : result.svg;
          if (businessModelDiagramRef.current) {
            businessModelDiagramRef.current.innerHTML = svg;
          }
          businessModelRenderedRef.current = true;
        } else {
          const tempContainer = document.createElement('div');
          tempContainer.style.position = 'absolute';
          tempContainer.style.left = '-9999px';
          tempContainer.style.visibility = 'hidden';
          document.body.appendChild(tempContainer);
          
          const diagramDiv = document.createElement('div');
          diagramDiv.className = 'mermaid';
          diagramDiv.textContent = diagram;
          tempContainer.appendChild(diagramDiv);
          
          await mermaid.run({
            nodes: [diagramDiv],
          });
          
          const svg = tempContainer.innerHTML;
          document.body.removeChild(tempContainer);
          if (businessModelDiagramRef.current) {
            businessModelDiagramRef.current.innerHTML = svg;
          }
          businessModelRenderedRef.current = true;
        }
      } catch (err: any) {
        console.error('ビジネスモデル図レンダリングエラー:', err);
      }
    };

    renderDiagram();
  }, [mermaidLoaded, conceptId]);
  
  // キービジュアルの高さを保存
  const handleSaveKeyVisualHeight = async (height: number) => {
    if (!auth?.currentUser || !db || !concept?.id) return;
    
    try {
      await updateDoc(doc(db, 'concepts', concept.id), {
        keyVisualHeight: height,
        updatedAt: serverTimestamp(),
      });
      setKeyVisualHeight(height);
    } catch (error) {
      console.error('キービジュアルサイズの保存エラー:', error);
    }
  };

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"
        strategy="lazyOnload"
        onLoad={() => {
          setTimeout(() => {
            if (typeof window !== 'undefined' && (window as any).mermaid) {
            (window as any).mermaid.initialize({ 
              startOnLoad: false,
              theme: 'default',
              securityLevel: 'loose',
              fontFamily: 'inherit',
              htmlLabels: true
            });
              setMermaidLoaded(true);
              window.dispatchEvent(new Event('mermaidloaded'));
            }
          }, 100);
        }}
        onError={(e) => {
          console.error('Mermaid script load error:', e);
        }}
      />
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        概要・コンセプト
      </p>
      
      {/* キービジュアル */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {keyVisualUrl ? (
          <div style={{ position: 'relative', width: '100%', paddingTop: `${keyVisualHeight}%`, backgroundColor: '#f8f9fa' }}>
            <img
              src={keyVisualUrl}
              alt="キービジュアル"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
            {/* サイズ調整コントロール */}
            {showSizeControl && (
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  padding: '12px',
                  borderRadius: '8px',
                  zIndex: 10,
                  minWidth: '200px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ marginBottom: '8px', color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                  高さ調整（%）
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="5"
                  value={keyVisualHeight}
                  onChange={(e) => {
                    const newHeight = parseFloat(e.target.value);
                    setKeyVisualHeight(newHeight);
                    handleSaveKeyVisualHeight(newHeight);
                  }}
                  style={{
                    width: '100%',
                    marginBottom: '8px',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '12px' }}>{keyVisualHeight}%</span>
                  <button
                    onClick={() => setShowSizeControl(false)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    閉じる
                  </button>
                </div>
              </div>
            )}
            {/* キービジュアル編集ボタン */}
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowSizeControl(!showSizeControl)}
                style={{
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 300,
                  lineHeight: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                title="サイズ調整"
              >
                ⚙
              </button>
              <button
                onClick={() => router.push(`/business-plan/services/${serviceId}/${conceptId}/overview/upload-key-visual`)}
                style={{
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '20px',
                  fontWeight: 300,
                  lineHeight: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                title="画像変更"
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', paddingTop: `${keyVisualHeight}%`, backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* キービジュアルアップロードボタン（中央に配置） */}
            <button
              onClick={() => router.push(`/business-plan/services/${serviceId}/${conceptId}/overview/upload-key-visual`)}
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                width: '32px',
                height: '32px',
                padding: 0,
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '50%',
                color: 'var(--color-text-light)',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 300,
                lineHeight: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.6,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6';
              }}
            >
              +
            </button>
          </div>
        )}
      </div>

      <div className="card">
        {loading ? (
        <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
            読み込み中...
          </p>
        ) : (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                はじめに
              </h3>
              <div style={{ color: 'var(--color-text)', lineHeight: '1.8', fontSize: '14px' }}>
                {conceptId === 'maternity-support' ? (
                  <>
                    <p style={{ marginBottom: '24px', paddingLeft: '0' }}>
                      すべての妊婦・育児家庭が、必要な支援制度を見逃すことなく、安心して出産・育児を迎えられる世界を実現します。パーソナルな情報分析とワンストップサービスにより、一人ひとりに最適な支援を提供します。
                    </p>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        1. 出産支援パーソナルアプリケーションとは
                      </h4>
                      <p style={{ marginBottom: '16px', paddingLeft: '11px' }}>
                        妊娠・出産・育児に関する各種支援制度の情報を一元管理し、ユーザーが適切な支援を受けられるようサポートするWebアプリケーションです。ユーザーフレンドリーな設計により、直感的で使いやすいインターフェースを提供します。
                      </p>
                      <div style={{ marginBottom: '16px', paddingLeft: '11px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                        <div style={{ flexShrink: 0 }}>
                          <img
                            src="/Gemini_Generated_Image_uj5ghguj5ghguj5g.png"
                            alt="出産支援パーソナルアプリケーション"
                            style={{
                              width: '500px',
                              maxWidth: '100%',
                              height: 'auto',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            }}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                              個人への貢献
                            </h5>
                            <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                              支援制度の情報を一元管理し、必要な支援を見逃すことなく受けられるようサポートします。いつ何をすればよいかのパーソナル分析や、子育てにかかる収支の概算により、経済的な不安を軽減し、安心して出産・育児を迎えられます。家族との情報共有機能により、パートナーと協力して育児を進められる環境を整えます。
                            </p>
                          </div>
                          <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                              企業への貢献
                            </h5>
                            <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                              従業員が安心して育休を取得し、キャリアプランを描けるよう支援することで、従業員の満足度向上と離職率の低下に貢献します。くるみん認定や健康経営優良法人認定の取得支援を通じて、企業の子育て支援施策を可視化し、社会的評価の向上をサポートします。これにより、企業の魅力向上と業績向上に寄与します。
                            </p>
                          </div>
                          <div style={{ marginBottom: '0' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                              社会への貢献
                            </h5>
                            <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                              すべての妊婦・育児家庭が、必要な支援制度を見逃すことなく、安心して出産・育児を迎えられる社会の実現に貢献します。教育サービス、保険、医療・ヘルスケア、ECサイトなど、様々なパートナーと連携し、ワンストップで必要なサービスの利用を実現することで、より良い子育て支援のエコシステムを構築します。
                            </p>
                          </div>
                        </div>
                      </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                    2. アプリケーションの目的
                  </h4>
                  <p style={{ marginBottom: '16px', paddingLeft: '11px', fontWeight: 600 }}>
                    多くの人が困っていること
                  </p>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(4, 1fr)', 
                        gap: '24px', 
                        marginBottom: '24px',
                        paddingLeft: '11px'
                      }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#5A6578',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <path d="m21 21-4.35-4.35"></path>
                        </svg>
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>情報が分散</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>受けられる制度が分からない</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#5A6578',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="9" y1="3" x2="9" y2="21"></line>
                        </svg>
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>制度の把握が困難</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>企業・自治体の制度を把握しきれない</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#5A6578',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>手続きが複雑</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>いつ何をすればよいか分からない</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#5A6578',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>必要な書類が不明</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>申請に必要な書類や手続きが分からない</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#5A6578',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>期限を逃す</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>支援を受けられない</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#5A6578',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>費用が不明</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>経済的な不安がある</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#5A6578',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>相談場所がない</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>疑問や不安をすぐに解決できない</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#5A6578',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>情報共有が困難</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>家族と協力して育児を進められない</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', paddingLeft: '11px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#5A6578',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px',
                      flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      なぜこれまで実現できなかったのか
                    </p>
                  </div>
                  <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                    従来のアプリケーションやサービスでは、以下の理由から、これらの課題を解決することが困難でした。
                  </p>
                  <ul style={{ marginBottom: '16px', paddingLeft: '32px', listStyleType: 'disc' }}>
                    <li style={{ marginBottom: '8px' }}><strong>情報の分散と見づらさ</strong>：支援制度は国、都道府県、市区町村、企業など様々な主体が提供しており、それぞれのWebサイトが独立しているため、情報を探すだけでも一苦労である。さらに、各制度の説明は個別のユーザー視点ではなく、すべてのユーザーをカバーする汎用的な記載になっているため、自分に該当する条件が分かりづらい。このような分散した情報を手動で一元管理し、ユーザーごとにパーソナライズ化することは、現実的に困難であった。</li>
                    <li style={{ marginBottom: '8px' }}><strong>パーソナライズ化のコスト</strong>：各ユーザーの状況（妊娠週数、居住地、勤務先など）に応じた情報提供には、大量のデータ管理と複雑なロジックが必要で、費用対効果が取れなかった</li>
                    <li style={{ marginBottom: '8px' }}><strong>24時間365日のサポート</strong>：育児の疑問や不安は時間を選ばず発生するが、人的リソースによる24時間対応はコストが高すぎる</li>
                    <li style={{ marginBottom: '8px' }}><strong>複雑な申請フローの可視化</strong>：制度ごとに異なる申請フローを分かりやすく可視化するには、専門知識とデザイン力の両立が必要で、スケーラブルな仕組みがなかった</li>
                    <li style={{ marginBottom: '8px' }}><strong>多様なパートナーとの連携</strong>：教育、保険、医療、ECなど様々なサービスと連携し、ワンストップで提供するには、個別の連携開発が必要で、拡張性に限界があった</li>
                  </ul>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', paddingLeft: '11px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#5A6578',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px',
                      flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      なぜAIネイティブ設計だと可能なのか
                    </p>
                  </div>
                  <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                    AIネイティブ設計により、以下のことが可能になります。
                  </p>
                  {conceptId === 'maternity-support' && (
                    <div style={{ marginBottom: '24px', paddingLeft: '11px' }}>
                      <div
                        ref={aiNativeDiagramRef}
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
                  )}
                  <ul style={{ marginBottom: '12px', paddingLeft: '32px', listStyleType: 'disc' }}>
                    <li style={{ marginBottom: '8px' }}><strong>AIによる自動情報収集・更新</strong>：AIエージェントが分散した情報源から自動的に情報を収集・更新し、常に最新の情報を提供できる</li>
                    <li style={{ marginBottom: '8px' }}><strong>パーソナライズ化の低コスト実現</strong>：AIがユーザーの状況を理解し、必要な情報を自動的に抽出・提示することで、従来は困難だった個別最適化が低コストで実現できる</li>
                    <li style={{ marginBottom: '8px' }}><strong>24時間365日のAIアシスタント</strong>：LLMを活用したAIアシスタントにより、専門知識に基づいた相談対応を24時間365日、低コストで提供できる</li>
                    <li style={{ marginBottom: '8px' }}><strong>複雑なフローの自動可視化</strong>：AIが制度の仕組みを理解し、Mermaid図などの可視化を自動生成することで、専門知識がなくても分かりやすい説明を提供できる</li>
                    <li style={{ marginBottom: '8px' }}><strong>パートナー連携の自動化</strong>：AIエージェントが各パートナーのAPIと連携し、ユーザーのニーズに応じて適切なサービスを自動的に提案・接続できる</li>
                    <li style={{ marginBottom: '8px' }}><strong>継続的な改善</strong>：ユーザーの行動データをAIが分析し、サービスを継続的に改善する好循環を実現できる</li>
                    <li style={{ marginBottom: '8px' }}><strong>ユーザーフレンドリーなUI設計</strong>：技術の複雑さを隠し、直感的で使いやすいインターフェースを提供することで、誰でも簡単にサービスを利用できる</li>
                  </ul>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                    3. 対象ユーザー
                  </h4>
                  {/* アイコン表示 */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginBottom: '24px', paddingLeft: '11px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        backgroundColor: '#e0e7ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        border: '3px solid #6366f1',
                      }}>
                        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>個人</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        backgroundColor: '#e0e7ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        border: '3px solid #6366f1',
                      }}>
                        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
                        </svg>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>企業</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        backgroundColor: '#e0e7ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        border: '3px solid #6366f1',
                      }}>
                        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>自治体</div>
                    </div>
                  </div>
                  {/* 表 */}
                  <div style={{ paddingLeft: '11px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--color-border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--color-background)' }}>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>対象ユーザー</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>主なニーズ</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>ターゲット人口・数</span>
                              <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-light)' }}>
                                （数値：目標獲得率：目標獲得数）
                              </span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', width: '35%' }}>
                            <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px', color: 'var(--color-text-light)' }}>
                              <li style={{ marginBottom: '4px' }}>妊活中の方</li>
                              <li style={{ marginBottom: '4px' }}>妊娠中の方</li>
                              <li style={{ marginBottom: '4px' }}>育児中の方（0-6歳児の親）</li>
                              <li style={{ marginBottom: '4px' }}>出産・育児に関する支援制度を探している方</li>
                              <li style={{ marginBottom: '4px' }}>育児と仕事の両立に悩んでいる方</li>
                              <li style={{ marginBottom: '4px' }}>育児に関する不安や疑問がある方</li>
                            </ul>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', width: '40%' }}>
                            <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px' }}>
                              <li style={{ marginBottom: '4px' }}>支援制度の情報を一元管理したい</li>
                              <li style={{ marginBottom: '4px' }}>申請手続きを簡単にしたい</li>
                              <li style={{ marginBottom: '4px' }}>申請期限を逃したくない</li>
                              <li style={{ marginBottom: '4px' }}>育児に関する相談をしたい</li>
                              <li style={{ marginBottom: '4px' }}>健診記録を管理したい</li>
                              <li style={{ marginBottom: '4px' }}>家族と情報を共有したい</li>
                            </ul>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', width: '25%' }}>
                            <div style={{ fontSize: '13px' }}>
                              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600 }}>妊婦：</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--color-text-light)' }}>約58万人</span>
                                  <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>30%：約17万人</span>
                                </div>
                              </div>
                              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600 }}>0-1歳の親：</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--color-text-light)' }}>約70万組</span>
                                  <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>20%：約14万組</span>
                                </div>
                              </div>
                              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600 }}>1-2歳の親：</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--color-text-light)' }}>約78万組</span>
                                  <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>10%：約8万組</span>
                                </div>
                              </div>
                              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600 }}>2-3歳の親：</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--color-text-light)' }}>約78万組</span>
                                  <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>5%：約4万組</span>
                                </div>
                              </div>
                              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600 }}>3-6歳の親：</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--color-text-light)' }}>約232万組</span>
                                  <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>1%：約2万組</span>
                                </div>
                              </div>
                              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--color-border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600 }}>合計：</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--color-text)', fontSize: '14px' }}>約516万人</span>
                                  <span style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 600 }}>約45万人</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                            <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px', color: 'var(--color-text-light)' }}>
                              <li style={{ marginBottom: '4px' }}>従業員の福利厚生を充実させたい企業</li>
                              <li style={{ marginBottom: '4px' }}>子育て支援に取り組む企業</li>
                              <li style={{ marginBottom: '4px' }}>働き方改革を推進する企業</li>
                              <li style={{ marginBottom: '4px' }}>健康経営に取り組む企業</li>
                            </ul>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                            <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px' }}>
                              <li style={{ marginBottom: '4px' }}>従業員の育児と仕事の両立を支援したい</li>
                              <li style={{ marginBottom: '4px' }}>従業員の満足度を向上させたい</li>
                              <li style={{ marginBottom: '4px' }}>離職率を低下させたい</li>
                              <li style={{ marginBottom: '4px' }}>企業の子育て支援施策を可視化したい</li>
                            </ul>
                          </td>
                          <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '13px' }}>
                              <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600 }}>上場企業：</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--color-text-light)' }}>約3,800社</span>
                                  <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>5%：約190社</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600 }}>中小企業：</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--color-text-light)' }}>約358万社</span>
                                  <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>1%：約3.6万社</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                            <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px', color: 'var(--color-text-light)' }}>
                              <li style={{ marginBottom: '4px' }}>住民向けサービスを提供したい自治体</li>
                              <li style={{ marginBottom: '4px' }}>子育て支援施策を充実させたい自治体</li>
                              <li style={{ marginBottom: '4px' }}>デジタル化を推進する自治体</li>
                            </ul>
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                            <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px' }}>
                              <li style={{ marginBottom: '4px' }}>住民の子育て支援を強化したい</li>
                              <li style={{ marginBottom: '4px' }}>自治体独自の支援制度を周知したい</li>
                              <li style={{ marginBottom: '4px' }}>住民サービスの質を向上させたい</li>
                              <li style={{ marginBottom: '4px' }}>行政のデジタル化を推進したい</li>
                            </ul>
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '13px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600 }}>日本の自治体数：</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--color-text-light)' }}>約1,700</span>
                                  <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>5%：約85</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ marginTop: '16px', paddingLeft: '11px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                        エビデンス（ターゲット人口試算に使用）
                      </div>
                      <div style={{ fontSize: '13px' }}>
                        <a 
                          href="https://www.mhlw.go.jp/toukei/saikin/hw/jinkou/geppo/nengai24/dl/gaikyouR6.pdf" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                        >
                          厚生労働省「人口動態統計（確定数）の概況」（令和6年）
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                    4. 主要な提供機能
                  </h4>
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

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                    5. ビジネスモデル
                  </h4>
                  <div style={{ marginBottom: '16px', paddingLeft: '11px' }}>
                    <p style={{ fontSize: '14px', lineHeight: '1.8', marginBottom: '16px', color: 'var(--color-text)' }}>
                      出産支援パーソナルアプリケーションは、個人ユーザーへの直接提供、企業・自治体へのB2B提供、パートナー企業からの広告費・紹介手数料、認定取得支援サービスなど、多様な収益源を持つビジネスモデルを採用しています。一般利用者には無料プランとプレミアムプランを提供し、企業や自治体には従業員・住民向けの福利厚生サービスとして提供することで、持続可能な成長を実現します。
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

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                    6. 提供価値
                  </h4>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', paddingLeft: '11px' }}>
                    <div style={{ flexShrink: 0 }}>
                      <img
                        src="/Gemini_Generated_Image_l3zgsvl3zgsvl3zg.png"
                        alt="提供価値"
                        style={{
                          width: '400px',
                          maxWidth: '100%',
                          height: '400px',
                          objectFit: 'cover',
                          clipPath: 'circle(50%)',
                          borderRadius: '50%',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        }}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ marginBottom: '16px' }}>
                        <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', marginTop: '16px', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>個人への貢献</h5>
                    <ul style={{ marginBottom: '12px', paddingLeft: '32px', listStyleType: 'disc' }}>
                      <li style={{ marginBottom: '8px' }}>支援制度の情報を一元管理し、申請手続きを分かりやすく、適切なタイミングで申請できる</li>
                      <li style={{ marginBottom: '8px' }}>育児に関する不安を解消し、経済的な見通しを立てやすくすることで、安心して出産・育児に臨める</li>
                      <li style={{ marginBottom: '8px' }}>家族との情報共有機能により、パートナーと協力して育児を進められる環境を整える</li>
                    </ul>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', marginTop: '16px', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>企業への貢献</h5>
                    <ul style={{ marginBottom: '12px', paddingLeft: '32px', listStyleType: 'disc' }}>
                      <li style={{ marginBottom: '8px' }}>従業員の育児と仕事の両立を支援し、満足度向上と離職率低下に貢献</li>
                      <li style={{ marginBottom: '8px' }}>くるみん認定や健康経営優良法人認定の取得支援により、企業の社会的評価を向上</li>
                      <li style={{ marginBottom: '8px' }}>従業員の生産性向上により、企業の魅力向上と業績向上に寄与</li>
                    </ul>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', marginTop: '16px', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>社会への貢献</h5>
                    <ul style={{ marginBottom: '12px', paddingLeft: '32px', listStyleType: 'disc' }}>
                      <li style={{ marginBottom: '8px' }}>住民の子育て支援を強化し、自治体独自の支援制度を効率的に周知することで、住民満足度を向上</li>
                      <li style={{ marginBottom: '8px' }}>行政のデジタル化を推進し、住民サービスの一元化により、行政の効率化とサービスの質向上を実現</li>
                      <li style={{ marginBottom: '8px' }}>子育て支援施策の効果を可視化し、政策の改善に活用できる環境を構築</li>
                    </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </>
                ) : conceptId === 'care-support' ? (
                  <>
                    <p style={{ marginBottom: '24px', paddingLeft: '0' }}>
                      すべてのシニア世代とその家族が、必要な支援制度を見逃すことなく、安心して介護・終活を迎えられる世界を実現します。パーソナルな情報分析とワンストップサービスにより、一人ひとりに最適な支援を提供します。
                    </p>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        1. 介護支援パーソナルアプリケーションとは
                      </h4>
                      <p style={{ marginBottom: '16px', paddingLeft: '11px' }}>
                        介護・終活に関する各種支援制度の情報を一元管理し、ユーザーが適切な支援を受けられるようサポートするWebアプリケーションです。支援制度の検索や申請、終活、介護施設、相続税金問題などを一元管理することで、社会問題の解決に貢献します。ユーザーフレンドリーな設計により、直感的で使いやすいインターフェースを提供します。
                      </p>
                      <div style={{ marginBottom: '16px', paddingLeft: '11px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                        <div style={{ flexShrink: 0 }}>
                          <img
                            src="/Gemini_Generated_Image_k1ceolk1ceolk1ce.png"
                            alt="介護支援パーソナルアプリケーション"
                            style={{
                              width: '500px',
                              maxWidth: '100%',
                              height: 'auto',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            }}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                              シニア世代への貢献
                            </h5>
                            <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                              支援制度の情報を一元管理し、必要な支援を見逃すことなく受けられるようサポートします。終活、介護施設選び、相続税金問題など、複雑な手続きを分かりやすく整理し、安心して介護・終活を迎えられます。
                            </p>
                          </div>
                          <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                              働く世代への貢献
                            </h5>
                            <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                              家族との情報共有機能により、家族と協力して介護を進められる環境を整えます。介護と仕事の両立を支援し、安心して介護休暇を取得できるようサポートします。
                            </p>
                          </div>
                          <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                              企業への貢献
                            </h5>
                            <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                              従業員が安心して介護休暇を取得し、キャリアプランを描けるよう支援することで、従業員の満足度向上と離職率の低下に貢献します。企業の介護支援施策を可視化し、社会的評価の向上をサポートします。これにより、企業の魅力向上と業績向上に寄与します。
                            </p>
                          </div>
                          <div style={{ marginBottom: '0' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                              社会への貢献
                            </h5>
                            <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                              すべてのシニア世代とその家族が、必要な支援制度を見逃すことなく、安心して介護・終活を迎えられる社会の実現に貢献します。医療・ヘルスケア、介護施設、法律・税務、保険など、様々なパートナーと連携し、ワンストップで必要なサービスの利用を実現することで、より良い介護支援のエコシステムを構築します。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        2. アプリケーションの目的
                      </h4>
                      <p style={{ marginBottom: '16px', paddingLeft: '11px', fontWeight: 600 }}>
                        多くの人が困っていること
                      </p>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(4, 1fr)', 
                        gap: '24px', 
                        marginBottom: '24px',
                        paddingLeft: '11px'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#5A6578',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                          }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8"></circle>
                              <path d="m21 21-4.35-4.35"></path>
                            </svg>
                          </div>
                          <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>情報が分散</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>支援制度が分からない</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#5A6578',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                          }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                          </div>
                          <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>申請が面倒</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>手続きが複雑</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#5A6578',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                          }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                          </div>
                          <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>介護施設選び</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>適切な施設が分からない</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#5A6578',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                          }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="1" x2="12" y2="23"></line>
                              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                          </div>
                          <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>相続税金問題</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>対策が分からない</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#5A6578',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                          }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                          </div>
                          <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>終活の準備</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>何から始めればよいか分からない</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#5A6578',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                          }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                          </div>
                          <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>家族との情報共有</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>協力して進められない</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#5A6578',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                          }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                          </div>
                          <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>相談場所がない</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>疑問や不安をすぐに解決できない</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#5A6578',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                          }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                          </div>
                          <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>期限を逃す</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>申請や手続きを逃してしまう</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', paddingLeft: '11px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#5A6578',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          flexShrink: 0,
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                          </svg>
                        </div>
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          なぜこれまで実現できなかったのか
                        </p>
                      </div>
                      <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                        従来のアプリケーションやサービスでは、以下の理由から、これらの課題を解決することが困難でした。
                      </p>
                      <ul style={{ marginBottom: '16px', paddingLeft: '32px', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '8px' }}><strong>情報の分散と見づらさ</strong>：支援制度は国、都道府県、市区町村、企業など様々な主体が提供しており、それぞれのWebサイトが独立しているため、情報を探すだけでも一苦労である。さらに、各制度の説明は個別のユーザー視点ではなく、すべてのユーザーをカバーする汎用的な記載になっているため、自分に該当する条件が分かりづらい。このような分散した情報を手動で一元管理し、ユーザーごとにパーソナライズ化することは、現実的に困難であった。</li>
                        <li style={{ marginBottom: '8px' }}><strong>パーソナライズ化のコスト</strong>：各ユーザーの状況（年齢、居住地、家族構成、介護状況など）に応じた情報提供には、大量のデータ管理と複雑なロジックが必要で、費用対効果が取れなかった</li>
                        <li style={{ marginBottom: '8px' }}><strong>24時間365日のサポート</strong>：介護や終活の疑問や不安は時間を選ばず発生するが、人的リソースによる24時間対応はコストが高すぎる</li>
                        <li style={{ marginBottom: '8px' }}><strong>複雑な申請フローの可視化</strong>：制度ごとに異なる申請フローを分かりやすく可視化するには、専門知識とデザイン力の両立が必要で、スケーラブルな仕組みがなかった</li>
                        <li style={{ marginBottom: '8px' }}><strong>介護施設選びの困難さ</strong>：介護施設に関する情報が分散しており、必要な情報が不足していたため、選択肢を把握することが困難であった。さらに、施設間の費用比較や、相続・税金問題を考慮したシミュレーションができなかったため、限られた選択肢の中から選ばざるを得ない状況が続いていた</li>
                        <li style={{ marginBottom: '8px' }}><strong>多様なパートナーとの連携</strong>：医療、介護施設、法律・税務、保険など様々なサービスと連携し、ワンストップで提供するには、個別の連携開発が必要で、拡張性に限界があった</li>
                      </ul>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', paddingLeft: '11px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#5A6578',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          flexShrink: 0,
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                          </svg>
                        </div>
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          なぜAIネイティブ設計だと可能なのか
                        </p>
                      </div>
                      <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                        AIネイティブ設計により、以下のことが可能になります。
                      </p>
                      {conceptId === 'care-support' && (
                        <div style={{ marginBottom: '24px', paddingLeft: '11px' }}>
                          <div
                            ref={aiNativeDiagramRef}
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
                      )}
                      <ul style={{ marginBottom: '12px', paddingLeft: '32px', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '8px' }}><strong>AIによる自動情報収集・更新</strong>：AIエージェントが分散した情報源から自動的に情報を収集・更新し、常に最新の情報を提供できる</li>
                        <li style={{ marginBottom: '8px' }}><strong>パーソナライズ化の低コスト実現</strong>：AIがユーザーの状況を理解し、必要な情報を自動的に抽出・提示することで、従来は困難だった個別最適化が低コストで実現できる</li>
                        <li style={{ marginBottom: '8px' }}><strong>24時間365日のAIアシスタント</strong>：LLMを活用したAIアシスタントにより、専門知識に基づいた相談対応を24時間365日、低コストで提供できる</li>
                        <li style={{ marginBottom: '8px' }}><strong>複雑なフローの自動可視化</strong>：AIが制度の仕組みを理解し、Mermaid図などの可視化を自動生成することで、専門知識がなくても分かりやすい説明を提供できる</li>
                        <li style={{ marginBottom: '8px' }}><strong>パートナー連携の自動化</strong>：AIエージェントが各パートナーのAPIと連携し、ユーザーのニーズに応じて適切なサービスを自動的に提案・接続できる</li>
                        <li style={{ marginBottom: '8px' }}><strong>継続的な改善</strong>：ユーザーの行動データをAIが分析し、サービスを継続的に改善する好循環を実現できる</li>
                        <li style={{ marginBottom: '8px' }}><strong>ユーザーフレンドリーなUI設計</strong>：技術の複雑さを隠し、直感的で使いやすいインターフェースを提供することで、誰でも簡単にサービスを利用できる</li>
                      </ul>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        3. 対象ユーザー
                      </h4>
                      {/* アイコン表示 */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginBottom: '24px', paddingLeft: '11px', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            backgroundColor: '#e0e7ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                            border: '3px solid #6366f1',
                          }}>
                            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>シニア世代</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            backgroundColor: '#e0e7ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                            border: '3px solid #6366f1',
                          }}>
                            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>働く世代</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            backgroundColor: '#e0e7ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                            border: '3px solid #6366f1',
                          }}>
                            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
                            </svg>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>企業</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            backgroundColor: '#e0e7ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                            border: '3px solid #6366f1',
                          }}>
                            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>自治体</div>
                        </div>
                      </div>
                      {/* 表 */}
                      <div style={{ paddingLeft: '11px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--color-border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                          <thead>
                            <tr style={{ backgroundColor: 'var(--color-background)' }}>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>対象ユーザー</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>主なニーズ</th>
                              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--color-border-color)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>ターゲット人口・数</span>
                                  <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-light)' }}>
                                    （数値：目標獲得率：目標獲得数）
                                  </span>
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', width: '35%' }}>
                                <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px', color: 'var(--color-text-light)' }}>
                                  <li style={{ marginBottom: '4px' }}>シニア世代</li>
                                  <li style={{ marginBottom: '4px' }}>介護に関する支援制度を探している方</li>
                                  <li style={{ marginBottom: '4px' }}>終活を考えている方</li>
                                  <li style={{ marginBottom: '4px' }}>介護施設を探している方</li>
                                  <li style={{ marginBottom: '4px' }}>相続・税金問題で悩んでいる方</li>
                                </ul>
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', width: '40%' }}>
                                <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px' }}>
                                  <li style={{ marginBottom: '4px' }}>支援制度の情報を一元管理したい</li>
                                  <li style={{ marginBottom: '4px' }}>申請手続きを簡単にしたい</li>
                                  <li style={{ marginBottom: '4px' }}>終活の準備を進めたい</li>
                                  <li style={{ marginBottom: '4px' }}>適切な介護施設を見つけたい</li>
                                  <li style={{ marginBottom: '4px' }}>相続・税金問題の対策を知りたい</li>
                                  <li style={{ marginBottom: '4px' }}>家族と情報を共有したい</li>
                                </ul>
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', width: '25%' }}>
                                <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                                  詳細は今後追加予定
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', width: '35%' }}>
                                <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px', color: 'var(--color-text-light)' }}>
                                  <li style={{ marginBottom: '4px' }}>シニア世代を支える働く世代</li>
                                </ul>
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', width: '40%' }}>
                                <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px' }}>
                                  <li style={{ marginBottom: '4px' }}>支援制度の情報を一元管理したい</li>
                                  <li style={{ marginBottom: '4px' }}>申請手続きを簡単にしたい</li>
                                  <li style={{ marginBottom: '4px' }}>家族と情報を共有したい</li>
                                </ul>
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', width: '25%' }}>
                                <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                                  詳細は今後追加予定
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                                <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px', color: 'var(--color-text-light)' }}>
                                  <li style={{ marginBottom: '4px' }}>従業員の福利厚生を充実させたい企業</li>
                                  <li style={{ marginBottom: '4px' }}>介護支援に取り組む企業</li>
                                  <li style={{ marginBottom: '4px' }}>働き方改革を推進する企業</li>
                                </ul>
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                                <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px' }}>
                                  <li style={{ marginBottom: '4px' }}>従業員の介護と仕事の両立を支援したい</li>
                                  <li style={{ marginBottom: '4px' }}>従業員の満足度を向上させたい</li>
                                  <li style={{ marginBottom: '4px' }}>離職率を低下させたい</li>
                                </ul>
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                                  詳細は今後追加予定
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                                <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px', color: 'var(--color-text-light)' }}>
                                  <li style={{ marginBottom: '4px' }}>住民向けサービスを提供したい自治体</li>
                                  <li style={{ marginBottom: '4px' }}>介護支援施策を充実させたい自治体</li>
                                  <li style={{ marginBottom: '4px' }}>デジタル化を推進する自治体</li>
                                </ul>
                              </td>
                              <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                                <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', fontSize: '13px' }}>
                                  <li style={{ marginBottom: '4px' }}>住民の介護支援を強化したい</li>
                                  <li style={{ marginBottom: '4px' }}>自治体独自の支援制度を周知したい</li>
                                  <li style={{ marginBottom: '4px' }}>住民サービスの質を向上させたい</li>
                                </ul>
                              </td>
                              <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                                  詳細は今後追加予定
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        4. 主要な提供機能
                      </h4>
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
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>国、自治体、企業などの介護支援制度を一元的に検索・閲覧できます。</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>2. 支援制度の詳細情報表示</td>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>各支援制度の対象者、期間、金額、必要書類などを詳しく確認できます。</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>3. 終活支援機能</td>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>終活に関する情報や手続きを一元管理し、計画的に準備を進められます。</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>4. 介護施設検索・比較</td>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>適切な介護施設を検索・比較し、最適な選択をサポートします。</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>5. 相続・税金問題のサポート</td>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>相続や税金に関する情報を提供し、適切な対策をサポートします。</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>6. 収支シミュレーション</td>
                              <td style={{ padding: '12px', borderBottom: '1px solid var(--color-border-color)', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>介護費用や支援制度を活用した場合の収支をシミュレーションし、家計への影響を可視化します。</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '12px', fontSize: '14px', color: 'var(--color-text)', verticalAlign: 'top', fontWeight: 600 }}>7. AIアシスタント機能</td>
                              <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text)', verticalAlign: 'top' }}>24時間365日、介護や終活に関する疑問や不安にAIが即座に回答・アドバイスします。</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        5. ビジネスモデル
                      </h4>
                      <div style={{ marginBottom: '16px', paddingLeft: '11px' }}>
                        <p style={{ fontSize: '14px', lineHeight: '1.8', marginBottom: '16px', color: 'var(--color-text)' }}>
                          介護支援パーソナルアプリケーションは、個人ユーザーへの直接提供、企業・自治体へのB2B提供、パートナー企業からの広告費・紹介手数料、認定取得支援サービスなど、多様な収益源を持つビジネスモデルを採用しています。一般利用者には無料プランとプレミアムプランを提供し、企業や自治体には従業員・住民向けの福利厚生サービスとして提供することで、持続可能な成長を実現します。
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

                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        6. 提供価値
                      </h4>
                      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', paddingLeft: '11px' }}>
                        <div style={{ flexShrink: 0 }}>
                          <img
                            src="/Gemini_Generated_Image_4awgre4awgre4awg.png"
                            alt="提供価値"
                            style={{
                              width: '400px',
                              maxWidth: '100%',
                              height: '400px',
                              objectFit: 'cover',
                              clipPath: 'circle(50%)',
                              borderRadius: '50%',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            }}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ marginBottom: '16px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', marginTop: '16px', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>シニア世代への貢献</h5>
                            <ul style={{ marginBottom: '12px', paddingLeft: '32px', listStyleType: 'disc' }}>
                              <li style={{ marginBottom: '8px' }}>支援制度の情報を一元管理し、申請手続きを分かりやすく、適切なタイミングで申請できる</li>
                              <li style={{ marginBottom: '8px' }}>終活、介護施設選び、相続・税金問題など、複雑な課題を整理し、安心して介護・終活を迎えられる</li>
                            </ul>
                          </div>
                          <div style={{ marginBottom: '16px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', marginTop: '16px', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>働く世代への貢献</h5>
                            <ul style={{ marginBottom: '12px', paddingLeft: '32px', listStyleType: 'disc' }}>
                              <li style={{ marginBottom: '8px' }}>家族との情報共有機能により、家族と協力して介護を進められる環境を整える</li>
                              <li style={{ marginBottom: '8px' }}>介護と仕事の両立を支援し、安心して介護休暇を取得できるようサポートする</li>
                            </ul>
                          </div>
                          <div style={{ marginBottom: '16px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', marginTop: '16px', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>企業への貢献</h5>
                            <ul style={{ marginBottom: '12px', paddingLeft: '32px', listStyleType: 'disc' }}>
                              <li style={{ marginBottom: '8px' }}>従業員の介護と仕事の両立を支援し、満足度向上と離職率低下に貢献</li>
                              <li style={{ marginBottom: '8px' }}>企業の介護支援施策を可視化し、社会的評価を向上</li>
                              <li style={{ marginBottom: '8px' }}>従業員の生産性向上により、企業の魅力向上と業績向上に寄与</li>
                            </ul>
                          </div>
                          <div style={{ marginBottom: '16px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', marginTop: '16px', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>社会への貢献</h5>
                            <ul style={{ marginBottom: '12px', paddingLeft: '32px', listStyleType: 'disc' }}>
                              <li style={{ marginBottom: '8px' }}>住民の介護支援を強化し、自治体独自の支援制度を効率的に周知することで、住民満足度を向上</li>
                              <li style={{ marginBottom: '8px' }}>行政のデジタル化を推進し、住民サービスの一元化により、行政の効率化とサービスの質向上を実現</li>
                              <li style={{ marginBottom: '8px' }}>介護支援施策の効果を可視化し、政策の改善に活用できる環境を構築</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : conceptId === 'corporate-ai-training' ? (
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        1. 大企業向けAI人材育成・教育とは
                      </h4>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        2. 事業の目的
                      </h4>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        3. 対象ユーザー
                      </h4>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        4. 解決する課題
                      </h4>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        5. 主要な提供機能
                      </h4>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        6. 提供価値
                      </h4>
                    </div>
                  </>
                ) : conceptId === 'medical-dx' ? (
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        1. 医療法人向けDXとは
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        2. 事業の目的
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        3. 対象ユーザー
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        4. 解決する課題
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        5. 主要な提供機能
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        6. 提供価値
                      </h4>
                    </div>
                  </>
                ) : conceptId === 'sme-dx' ? (
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        1. 中小企業向けDXとは
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        2. 事業の目的
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        3. 対象ユーザー
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        4. 解決する課題
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        5. 主要な提供機能
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        6. 提供価値
                      </h4>
                    </div>
                  </>
                ) : conceptId === 'sme-process' ? (
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        1. 中小企業向け業務プロセス可視化・改善とは
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        2. 事業の目的
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        3. 対象ユーザー
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        4. 解決する課題
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        5. 主要な提供機能
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        6. 提供価値
                      </h4>
                    </div>
                  </>
                ) : conceptId === 'medical-care-process' ? (
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        1. 医療・介護施設向け業務プロセス可視化・改善とは
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        2. 事業の目的
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        3. 対象ユーザー
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        4. 解決する課題
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        5. 主要な提供機能
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        6. 提供価値
                      </h4>
                    </div>
                  </>
                ) : conceptId === 'ai-governance' ? (
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        1. AI導入ルール設計・ガバナンス支援とは
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        2. 事業の目的
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        3. 対象ユーザー
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        4. 解決する課題
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        5. 主要な提供機能
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        6. 提供価値
                      </h4>
                    </div>
                  </>
                ) : conceptId === 'sme-ai-education' ? (
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        1. 中小企業向けAI導入支援・教育とは
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        2. 事業の目的
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        3. 対象ユーザー
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        4. 解決する課題
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        5. 主要な提供機能
                      </h4>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        6. 提供価値
                      </h4>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
