'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useConcept, useContainerVisibility } from '../layout';
import Script from 'next/script';
import dynamic from 'next/dynamic';

// コンポーネント化されたページのコンポーネント（条件付きインポート）
const ComponentizedOverview = dynamic(
  () => import('@/components/pages/component-test/test-concept/ComponentizedOverview'),
  { ssr: false }
);

export default function OverviewPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const conceptId = params.conceptId as string;
  const { concept, loading } = useConcept();
  const { showContainers } = useContainerVisibility();

  // コンポーネント化されたページを使用するかチェック
  // conceptIdが-componentizedを含む、または特定のconceptIdの場合はComponentizedOverviewを使用
  if (conceptId.includes('-componentized') || 
      (serviceId === 'component-test' && conceptId === 'test-concept')) {
    return <ComponentizedOverview />;
  }

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
        const mermaid = (window as any).mermaid;
        // 初期化がまだ実行されていない場合は実行
        if (typeof mermaid.initialize === 'function') {
          try {
            mermaid.initialize({ 
              startOnLoad: false,
              theme: 'default',
              securityLevel: 'loose',
              fontFamily: 'inherit',
              htmlLabels: true
            });
          } catch (e) {
            // 既に初期化されている場合はエラーを無視
          }
        }
        if (!mermaidLoaded) {
          setMermaidLoaded(true);
        }
        return true;
      }
      return false;
    };

    const handleMermaidLoaded = () => {
      // 少し遅延させてからチェック（初期化が完了するのを待つ）
      setTimeout(() => {
        checkMermaid();
      }, 50);
    };

    if (typeof window !== 'undefined') {
      // 既に読み込まれている場合
      if (checkMermaid()) {
        return;
      }
      
      // イベントリスナーを追加
      window.addEventListener('mermaidloaded', handleMermaidLoaded);
      
      // 定期的にチェック（フォールバック）
      let retries = 0;
      const maxRetries = 100; // 10秒間
      const interval = setInterval(() => {
        retries++;
        if (checkMermaid() || retries >= maxRetries) {
          clearInterval(interval);
        }
      }, 100);

      return () => {
        window.removeEventListener('mermaidloaded', handleMermaidLoaded);
        clearInterval(interval);
      };
    }
  }, [mermaidLoaded]);

  // AIネイティブ設計の関係図を生成
  const generateAiNativeDiagram = () => {
    return `graph TB
    Center["<span style='font-size: 28px; font-weight: bold; color: #ffffff;'>AIネイティブ設計</span>"]
    
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
    
    style Center fill:#667eea,stroke:#4c51bf,stroke-width:1px,color:#ffffff,font-size:28px
    style A1 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style A2 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style A3 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style A4 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style A5 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style A6 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px
    style A7 fill:#e0e7ff,stroke:#6366f1,stroke-width:2px`;
  };


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
    aiNativeRenderedRef.current = false;
    businessModelRenderedRef.current = false;
    setAiNativeDiagramSvg('');
    if (aiNativeDiagramRef.current) {
      aiNativeDiagramRef.current.innerHTML = '';
    }
    if (businessModelDiagramRef.current) {
      businessModelDiagramRef.current.innerHTML = '';
    }
  }, [conceptId]);

  // AIネイティブ図をレンダリング
  useEffect(() => {
    if (conceptId !== 'maternity-support' && conceptId !== 'care-support') {
      return;
    }

    const renderDiagram = async () => {
      // DOM要素が存在するまで待つ
      let domRetries = 0;
      const maxDomRetries = 50; // 5秒間
      while (domRetries < maxDomRetries && !aiNativeDiagramRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        domRetries++;
      }

      if (!aiNativeDiagramRef.current) {
        return;
      }

      if (aiNativeRenderedRef.current) {
        return;
      }
      
      // Mermaidが利用可能になるまで待つ
      let retries = 0;
      const maxRetries = 100; // 10秒間
      while (retries < maxRetries && (!(window as any).mermaid || typeof (window as any).mermaid.render !== 'function')) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      const mermaid = (window as any).mermaid;
      if (!mermaid || typeof mermaid.render !== 'function') {
        aiNativeRenderedRef.current = false;
        return;
      }

      // Mermaidが利用可能になったら、mermaidLoadedをtrueに設定
      if (!mermaidLoaded) {
        setMermaidLoaded(true);
      }

      if (!aiNativeDiagramRef.current || aiNativeRenderedRef.current) {
        return;
      }

      try {
        const diagram = generateAiNativeDiagram();
        const id = 'ai-native-diagram-' + Date.now();
        
        const result = await mermaid.render(id, diagram);
        const svg = typeof result === 'string' ? result : result.svg;
        setAiNativeDiagramSvg(svg);
        if (aiNativeDiagramRef.current) {
          aiNativeDiagramRef.current.innerHTML = svg;
        }
        aiNativeRenderedRef.current = true;
      } catch (err: any) {
        console.error('Mermaidレンダリングエラー:', err);
        aiNativeRenderedRef.current = false;
      }
    };

    // 少し待ってからレンダリングを開始
    const timer = setTimeout(() => {
      renderDiagram();
    }, 100);

    return () => clearTimeout(timer);
  }, [conceptId, mermaidLoaded]);


  // ビジネスモデル図をレンダリング
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
      
      // Mermaidが利用可能になるまで待つ
      let retries = 0;
      const maxRetries = 100; // 10秒間
      while (retries < maxRetries && (!(window as any).mermaid || typeof (window as any).mermaid.render !== 'function')) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      const mermaid = (window as any).mermaid;
      if (!mermaid || typeof mermaid.render !== 'function') {
        businessModelRenderedRef.current = false;
        return;
      }

      // Mermaidが利用可能になったら、mermaidLoadedをtrueに設定
      if (!mermaidLoaded) {
        setMermaidLoaded(true);
      }

      if (!businessModelDiagramRef.current || businessModelRenderedRef.current) {
        return;
      }

      try {
        const diagram = generateBusinessModelDiagram();
        const id = 'business-model-diagram-' + Date.now();
        
        const result = await mermaid.render(id, diagram);
        const svg = typeof result === 'string' ? result : result.svg;
        if (businessModelDiagramRef.current) {
          businessModelDiagramRef.current.innerHTML = svg;
        }
        businessModelRenderedRef.current = true;
      } catch (err: any) {
        console.error('Mermaidレンダリングエラー:', err);
        businessModelRenderedRef.current = false;
      }
    };

    // 少し待ってからレンダリングを開始
    const timer = setTimeout(() => {
      renderDiagram();
    }, 100);

    return () => clearTimeout(timer);
  }, [conceptId, mermaidLoaded]);

  
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
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        概要・コンセプト
      </p>
      
      {/* キービジュアル */}
      <div 
        data-page-container="0"
        className="card" 
        style={{ 
          padding: 0, 
          overflow: 'hidden',
          ...(showContainers ? {
            border: '2px dashed var(--color-primary)',
            borderRadius: '8px',
            padding: '16px',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
          } : {}),
        }}
      >
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
            <div 
              data-page-container="1"
              style={{ 
                marginBottom: '32px',
                ...(showContainers ? {
                  border: '2px dashed var(--color-primary)',
                  borderRadius: '8px',
                  padding: '16px',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                } : {}),
              }}
            >
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                はじめに
              </h4>
              {conceptId === 'maternity-support' ? (
                <div style={{ marginBottom: '48px', position: 'relative' }}>
                  {/* キーメッセージ - 最大化 */}
                  <div style={{ 
                    marginBottom: '40px',
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
                      なぜ出産・育児世代は<wbr />同じ課題や悩みを経験しなければならないのか？
                    </h2>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '18px', 
                      fontWeight: 500,
                      color: 'var(--color-primary)',
                      letterSpacing: '0.3px'
                    }}>
                      — ノウハウが共有化されず、<strong>出産・育児世代の負担</strong>になっている —
                    </p>
                  </div>

                  {/* 課題カード - 3列グリッド */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '24px',
                    marginBottom: '40px'
                  }}>
                    {/* 課題1: 精神的な不安（ピンク系） */}
                    <div style={{
                      padding: '28px',
                      backgroundColor: '#fff',
                      borderRadius: '16px',
                      border: '2px solid rgba(255, 107, 107, 0.2)',
                      boxShadow: '0 4px 12px rgba(255, 107, 107, 0.08)',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 107, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.2)';
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        letterSpacing: '0.5px'
                      }}>
                        精神的な不安
                      </div>
                      <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 107, 107, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                        marginTop: '8px'
                      }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                      </div>
                      <h4 style={{ 
                        margin: '0 0 16px 0', 
                        fontSize: '18px', 
                        fontWeight: 700, 
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        情報不足による<wbr />精神的な不安
                      </h4>
                      <ul style={{ 
                        margin: 0, 
                        paddingLeft: '20px',
                        fontSize: '14px', 
                        lineHeight: '1.8', 
                        color: 'var(--color-text-light)',
                        listStyle: 'none'
                      }}>
                        <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                          <span style={{ position: 'absolute', left: 0, color: '#ff6b6b' }}>•</span>
                          そもそも<strong>選択肢があることを知らない</strong>
                        </li>
                        <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                          <span style={{ position: 'absolute', left: 0, color: '#ff6b6b' }}>•</span>
                          出産・育児への<strong>不安や孤立感</strong>が生まれる
                        </li>
                      </ul>
                    </div>

                    {/* 課題2: 経済的な不安（黄色系） */}
                    <div style={{
                      padding: '28px',
                      backgroundColor: '#fff',
                      borderRadius: '16px',
                      border: '2px solid rgba(255, 193, 7, 0.2)',
                      boxShadow: '0 4px 12px rgba(255, 193, 7, 0.08)',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 193, 7, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(255, 193, 7, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 193, 7, 0.2)';
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#ffc107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        letterSpacing: '0.5px'
                      }}>
                        経済的な不安
                      </div>
                      <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 193, 7, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                        marginTop: '8px'
                      }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffc107" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                      </div>
                      <h4 style={{ 
                        margin: '0 0 16px 0', 
                        fontSize: '18px', 
                        fontWeight: 700, 
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        費用の見通しが<wbr />立たない不安
                      </h4>
                      <ul style={{ 
                        margin: 0, 
                        paddingLeft: '20px',
                        fontSize: '14px', 
                        lineHeight: '1.8', 
                        color: 'var(--color-text-light)',
                        listStyle: 'none'
                      }}>
                        <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                          <span style={{ position: 'absolute', left: 0, color: '#ffc107' }}>•</span>
                          子育てにかかる<strong>費用がわからない</strong>
                        </li>
                        <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                          <span style={{ position: 'absolute', left: 0, color: '#ffc107' }}>•</span>
                          支援制度を活用できず<strong>経済的な不安</strong>が続く
                        </li>
                      </ul>
                    </div>

                    {/* 課題3: 見通しがわからない不安（グレー系） */}
                    <div style={{
                      padding: '28px',
                      backgroundColor: '#fff',
                      borderRadius: '16px',
                      border: '2px solid rgba(108, 117, 125, 0.2)',
                      boxShadow: '0 4px 12px rgba(108, 117, 125, 0.08)',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(108, 117, 125, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(108, 117, 125, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(108, 117, 125, 0.2)';
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#6c757d',
                        backgroundColor: 'rgba(108, 117, 125, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        letterSpacing: '0.5px'
                      }}>
                        見通しの不安
                      </div>
                      <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '16px',
                        backgroundColor: 'rgba(108, 117, 125, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                        marginTop: '8px'
                      }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <h4 style={{ 
                        margin: '0 0 16px 0', 
                        fontSize: '18px', 
                        fontWeight: 700, 
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        いつ何をすればいいか<wbr />わからない不安
                      </h4>
                      <ul style={{ 
                        margin: 0, 
                        paddingLeft: '20px',
                        fontSize: '14px', 
                        lineHeight: '1.8', 
                        color: 'var(--color-text-light)',
                        listStyle: 'none'
                      }}>
                        <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                          <span style={{ position: 'absolute', left: 0, color: '#6c757d' }}>•</span>
                          計画が立てられず<strong>準備ができない</strong>
                        </li>
                        <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                          <span style={{ position: 'absolute', left: 0, color: '#6c757d' }}>•</span>
                          申請タイミングを<strong>見逃す不安</strong>が続く
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* 解決策セクション - 未来形・ベネフィット重視 */}
                  <div style={{
                    padding: '40px 48px',
                    background: 'linear-gradient(135deg, rgba(31, 41, 51, 0.04) 0%, rgba(31, 41, 51, 0.01) 100%)',
                    borderRadius: '20px',
                    border: '3px solid var(--color-primary)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-80px',
                      right: '-80px',
                      width: '300px',
                      height: '300px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(31, 41, 51, 0.05) 0%, transparent 70%)',
                      zIndex: 0
                    }}></div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '24px' }}>
                        <div style={{ 
                          width: '72px', 
                          height: '72px', 
                          borderRadius: '20px',
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, rgba(31, 41, 51, 0.8) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 8px 20px rgba(31, 41, 51, 0.25)'
                        }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ 
                            margin: '0 0 16px 0', 
                            fontSize: '24px', 
                            fontWeight: 700, 
                            color: 'var(--color-text)',
                            lineHeight: '1.3'
                          }}>
                            パーソナルな情報分析とワンストップサービスにより、<br />
                            <span style={{ color: 'var(--color-primary)' }}>一人ひとりに最適な支援を提供</span>
                          </h3>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '20px',
                            marginTop: '24px'
                          }}>
                            <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px' }}>
                                情報の一元管理
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                                分散した支援制度を一箇所に集約
                              </div>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px' }}>
                                パーソナル分析
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                                個人の状況に合わせた最適な支援を提案
                              </div>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px' }}>
                                ワンストップサービス
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                                申請から利用まで一貫してサポート
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <div style={{ color: 'var(--color-text)', lineHeight: '1.8', fontSize: '14px' }}>
              {conceptId === 'maternity-support' ? (
                <div 
                  data-page-container="2"
                  style={{ 
                    marginBottom: '40px',
                    ...(showContainers ? {
                      border: '2px dashed var(--color-primary)',
                      borderRadius: '8px',
                      padding: '16px',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                    } : {}),
                  }}
                >
                  <div style={{ marginBottom: '40px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '32px', color: '#1f2937', borderLeft: '4px solid var(--color-primary)', paddingLeft: '12px', letterSpacing: '0.3px' }}>
                      1. 出産支援パーソナルアプリケーションとは
                    </h4>
                    {/* キーメッセージ - 最大化 */}
                    <div style={{ 
                      marginBottom: '32px',
                      textAlign: 'center'
                    }}>
                      <h2 style={{ 
                        margin: '0 0 12px 0', 
                        fontSize: '32px', 
                        fontWeight: 700, 
                        background: 'linear-gradient(135deg, #0066CC 0%, #00BFFF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        lineHeight: '1.3',
                        letterSpacing: '-0.5px'
                      }}>
                        必要な支援を見逃さない、<wbr />安心の出産・育児を。
                      </h2>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '18px', 
                        fontWeight: 500,
                        color: 'var(--color-text)',
                        letterSpacing: '0.3px',
                        lineHeight: '1.6'
                      }}>
                        妊娠・出産・育児を、もっとスマートに、もっと確実に。
                      </p>
                    </div>
                  </div>
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <p style={{ marginBottom: '16px', paddingLeft: '11px' }}>
                        妊娠・出産・育児に関する各種支援制度の情報を一元管理し、ユーザーが適切な支援を受けられるようサポートするWebアプリケーションです。ユーザーフレンドリーな設計により、直感的で使いやすいインターフェースを提供します。
                      </p>
                      <div style={{ marginBottom: '16px', paddingLeft: '11px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                        <div style={{ flexShrink: 0 }}>
                          <img
                            src="/Gemini_Generated_Image_uj5ghguj5ghguj5g.png"
                            alt="出産支援パーソナルアプリケーション"
                            style={{
                              width: '400px',
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
                              支援制度の情報を一元管理し、必要な支援を見逃すことなく受けられるようサポートします。パーソナル分析や収支概算により、経済的な不安を軽減し、安心して出産・育児を迎えられます。
                            </p>
                          </div>
                          <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                              企業への貢献
                            </h5>
                            <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                              従業員の満足度向上と離職率の低下に貢献します。くるみん認定や健康経営優良法人認定の取得支援を通じて、企業の社会的評価向上をサポートします。
                            </p>
                          </div>
                          <div style={{ marginBottom: '0' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                              社会への貢献
                            </h5>
                            <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                              すべての妊婦・育児家庭が、必要な支援制度を見逃すことなく、安心して出産・育児を迎えられる社会の実現に貢献します。様々なパートナーと連携し、ワンストップで必要なサービスの利用を実現します。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                </div>
              ) : null}
              {conceptId === 'maternity-support' ? (
                <>
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
                    <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                      2. アプリケーションの目的
                    </h4>
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
                      多くの人が困っていること
                    </h2>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '18px', 
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      letterSpacing: '0.3px',
                      lineHeight: '1.6'
                    }}>
                      情報の分散、手続きの複雑さ、費用の不明確さなど、出産・育児を迎える多くの人が直面する共通の課題
                    </p>
                  </div>
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
                      なぜこれまで実現できなかったのか
                    </h2>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '18px', 
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      letterSpacing: '0.3px',
                      lineHeight: '1.6'
                    }}>
                    従来のアプリケーションやサービスでは、以下の理由から、これらの課題を解決することが困難でした。
                  </p>
                  </div>
                  <div style={{ 
                      display: 'flex',
                    gap: '16px', 
                    marginBottom: '32px',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between'
                    }}>
                    <div style={{
                      flex: '1 1 calc(20% - 13px)',
                      minWidth: '180px',
                      padding: '20px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        情報の分散と見づらさ
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                        margin: 0
                      }}>
                        支援制度は様々な主体が提供しており、それぞれのWebサイトが独立しているため、情報を探すだけでも一苦労である。
                      </p>
                    </div>
                    <div style={{
                      flex: '1 1 calc(20% - 13px)',
                      minWidth: '180px',
                      padding: '20px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        パーソナライズ化のコスト
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                        margin: 0
                      }}>
                        各ユーザーの状況に応じた情報提供には、大量のデータ管理と複雑なロジックが必要で、費用対効果が取れなかった。
                    </p>
                  </div>
                    <div style={{
                      flex: '1 1 calc(20% - 13px)',
                      minWidth: '180px',
                      padding: '20px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        24時間365日のサポート
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                        margin: 0
                      }}>
                        育児の疑問や不安は時間を選ばず発生するが、人的リソースによる24時間対応はコストが高すぎる。
                      </p>
                    </div>
                    <div style={{
                      flex: '1 1 calc(20% - 13px)',
                      minWidth: '180px',
                      padding: '20px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        複雑な申請フローの可視化
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                        margin: 0
                      }}>
                        制度ごとに異なる申請フローを可視化するには、専門知識とデザイン力の両立が必要で、スケーラブルな仕組みがなかった。
                      </p>
                    </div>
                    <div style={{
                      flex: '1 1 calc(20% - 13px)',
                      minWidth: '180px',
                      padding: '20px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        多様なパートナーとの連携
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                        margin: 0
                      }}>
                        様々なサービスと連携し、ワンストップで提供するには、個別の連携開発が必要で、拡張性に限界があった。
                      </p>
                    </div>
                  </div>

                  </div>

                  <div 
                    data-page-container="4"
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
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid #000', paddingLeft: '8px' }}>
                        3. AIネイティブ設計
                      </h4>
                    </div>

        
                  
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
                      なぜAIネイティブ設計だと可能なのか
                    </h2>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '18px', 
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      letterSpacing: '0.3px',
                      lineHeight: '1.6'
                    }}>
                      AIネイティブ設計により、自動化・パーソナライズ化・継続的改善を低コストで実現
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
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    marginBottom: '32px',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{
                      flex: '1 1 calc(14.28% - 14px)',
                      minWidth: '140px',
                      padding: '20px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        AIによる自動情報収集・更新
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                        margin: 0
                      }}>
                        AIエージェントが分散した情報源から自動的に情報を収集・更新し、常に最新の情報を提供できる。手動での情報管理が不要となる。
                      </p>
                    </div>
                    <div style={{
                      flex: '1 1 calc(14.28% - 14px)',
                      minWidth: '140px',
                      padding: '20px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        パーソナライズ化の低コスト実現
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                        margin: 0
                      }}>
                        AIがユーザーの状況を理解し、必要な情報を自動的に抽出・提示することで、従来は困難だった個別最適化が低コストで実現できる。
                      </p>
                    </div>
                    <div style={{
                      flex: '1 1 calc(14.28% - 14px)',
                      minWidth: '140px',
                      padding: '20px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        24時間365日のAIアシスタント
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                        margin: 0
                      }}>
                        LLMを活用したAIアシスタントにより、専門知識に基づいた相談対応を24時間365日、低コストで提供できる。
                      </p>
                    </div>
                    <div style={{
                      flex: '1 1 calc(14.28% - 14px)',
                      minWidth: '140px',
                      padding: '20px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        複雑なフローの自動可視化
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                        margin: 0
                      }}>
                        AIが制度の仕組みを理解し、Mermaid図などの可視化を自動生成することで、専門知識がなくても分かりやすい説明を提供できる。
                      </p>
                    </div>
                    <div style={{
                      flex: '1 1 calc(14.28% - 14px)',
                      minWidth: '140px',
                      padding: '20px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        パートナー連携の自動化
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                        margin: 0
                      }}>
                        AIエージェントが各パートナーのAPIと連携し、ユーザーのニーズに応じて適切なサービスを自動的に提案・接続できる。
                      </p>
                    </div>
                    <div style={{
                      flex: '1 1 calc(14.28% - 14px)',
                      minWidth: '140px',
                      padding: '20px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        継続的な改善
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                        margin: 0
                      }}>
                        ユーザーの行動データをAIが分析し、サービスを継続的に改善する好循環を実現できる。
                      </p>
                    </div>
                    <div style={{
                      flex: '1 1 calc(14.28% - 14px)',
                      minWidth: '140px',
                      padding: '20px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: 'var(--color-text)',
                        lineHeight: '1.4'
                      }}>
                        ユーザーフレンドリーなUI設計
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: 'var(--color-text)',
                        margin: 0
                      }}>
                        技術の複雑さを隠し、直感的で使いやすいインターフェースを提供することで、誰でも簡単にサービスを利用できる。
                      </p>
                    </div>
                  </div>
                </div>
                  

                <div 
                  data-page-container="5"
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
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                    4. 対象ユーザー
                  </h4>
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
                      個人・企業・自治体を対象とした包括的なサービス
                    </h2>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '18px', 
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      letterSpacing: '0.3px',
                      lineHeight: '1.6'
                    }}>
                      妊娠・出産・育児を迎える個人から、従業員支援を行う企業、住民サービスを提供する自治体まで
                    </p>
                  </div>
                  
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
                </div>

                <div 
                  data-page-container="6"
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
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                    5. 主要な提供機能
                  </h4>
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
                </div>

                <div 
                  data-page-container="7"
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
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                    6. ビジネスモデル
                  </h4>
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
                      多様な収益源で持続可能な成長を実現
                    </h2>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '18px', 
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      letterSpacing: '0.3px',
                      lineHeight: '1.6'
                    }}>
                      個人ユーザーへの直接提供、企業・自治体へのB2B提供、パートナー企業との連携により、多角的な収益構造を構築
                    </p>
                  </div>
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
                </div>

                <div 
                  data-page-container="8"
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
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                    7. 法改正に対応
                  </h4>
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
                      法改正に完全対応した<br />申請サポートを実現
                    </h2>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '18px', 
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      letterSpacing: '0.3px',
                      lineHeight: '1.6'
                    }}>
                      2025年4月施行の次世代育成支援対策推進法の改正に対応し、企業の法遵守と認定取得をサポート
                    </p>
                  </div>
                  <div style={{ paddingLeft: '11px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '20px',
                      marginBottom: '24px'
                    }}>
                      {/* POINT 4 */}
                      <div style={{
                        padding: '20px',
                        backgroundColor: '#f0f8ff',
                        borderRadius: '8px',
                        border: '1px solid #4a90e2'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '16px'
                        }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#ffd700',
                            color: '#333',
                            fontSize: '14px',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            POINT
                          </div>
                          <span style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            color: '#1e3a8a'
                          }}>
                            4
                          </span>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#666',
                            marginLeft: 'auto',
                            padding: '4px 12px',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap'
                          }}>
                            2025年4月1日施行
                          </span>
                        </div>
                        <h5 style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#1e3a8a',
                          marginBottom: '12px',
                          lineHeight: '1.4'
                        }}>
                          育児休業等の取得状況の公表義務が300人超の企業に拡大
                        </h5>
                        <div style={{
                          marginTop: '16px',
                          padding: '12px',
                          backgroundColor: '#fff',
                          borderRadius: '4px',
                          borderLeft: '3px solid #4a90e2'
                        }}>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.7',
                            color: '#333',
                            marginBottom: '8px'
                          }}>
                            <strong>対象企業：</strong>
                            従業員数1,000人超に加え、<strong>300人超1,000人以下の企業</strong>にも、育児休業等の取得状況を公表することが義務付けられました。
                          </p>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.7',
                            color: '#333',
                            marginBottom: '8px'
                          }}>
                            <strong>公表内容：</strong>
                            公表を行う日の属する事業年度の直前の事業年度（公表前事業年度）における男性の「育児休業等の取得割合」または「育児休業等と育児目的休暇の取得割合」のいずれかの割合です。
                          </p>
                          <div style={{
                            marginTop: '12px',
                            padding: '8px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            <strong>※「育児休業等」とは：</strong>
                            <ul style={{
                              margin: '8px 0 0 20px',
                              padding: 0,
                              listStyle: 'disc'
                            }}>
                              <li>育児休業（産後パパ育休を含む）</li>
                              <li>法第23条第2項又は第24条第1項の規定に基づく措置として育児休業に関する制度に準ずる措置を講じた場合は、その措置に基づく休業</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* POINT 5 */}
                      <div style={{
                        padding: '20px',
                        backgroundColor: '#f0f8ff',
                        borderRadius: '8px',
                        border: '1px solid #4a90e2'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '16px'
                        }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#ffd700',
                            color: '#333',
                            fontSize: '14px',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            POINT
                          </div>
                          <span style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            color: '#1e3a8a'
                          }}>
                            5
                          </span>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#666',
                            marginLeft: 'auto',
                            padding: '4px 12px',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap'
                          }}>
                            2025年4月1日施行
                          </span>
                        </div>
                        <h5 style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#1e3a8a',
                          marginBottom: '12px',
                          lineHeight: '1.4'
                        }}>
                          行動計画策定・変更時の育児休業等取得状況や労働時間の状況の把握・数値目標設定の義務付け
                        </h5>
                        <div style={{
                          marginTop: '16px',
                          padding: '12px',
                          backgroundColor: '#fff',
                          borderRadius: '4px',
                          borderLeft: '3px solid #4a90e2'
                        }}>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.7',
                            color: '#333',
                            marginBottom: '12px'
                          }}>
                            <strong>対象企業：</strong>
                            従業員数<strong>100人超の企業</strong>は、2025年（令和7年）4月1日以降に行動計画を策定又は変更する場合に、次のことが義務付けられました。
                            <br />
                            <span style={{ fontSize: '12px', color: '#666' }}>
                              （従業員数100人以下の企業は、努力義務）
                            </span>
                          </p>
                          <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '4px'
                          }}>
                            <p style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              marginBottom: '8px',
                              color: '#333'
                            }}>
                              義務付けられた内容：
                            </p>
                            <ul style={{
                              margin: 0,
                              paddingLeft: '20px',
                              listStyle: 'disc',
                              fontSize: '13px',
                              lineHeight: '1.7'
                            }}>
                              <li style={{ marginBottom: '6px' }}>
                                計画策定又は変更時の育児休業等取得状況や労働時間の状況の把握等（PDCAサイクルの実施）
                              </li>
                              <li>
                                育児休業等取得状況や労働時間の状況に関する数値目標の設定
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p style={{ marginBottom: '16px', fontSize: '14px' }}>
                      これらの法改正に対応した申請サポートを可能にしています。
                    </p>
                  </div>
                </div>
                </div>

                <div 
                  data-page-container="9"
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
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                    8. 提供価値
                  </h4>
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
                      個人・企業・社会に価値を提供
                    </h2>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '18px', 
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      letterSpacing: '0.3px',
                      lineHeight: '1.6'
                    }}>
                      一人ひとりの安心から、企業の成長、社会全体の持続可能性まで、多層的な価値を創造
                    </p>
                  </div>
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
                </div>
              </>
                ) : conceptId === 'care-support' ? (
                  <>
                    <div style={{ marginBottom: '48px', position: 'relative' }}>
                      {/* キーメッセージ - 最大化 */}
                      <div style={{ 
                        marginBottom: '40px',
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
                          シニア世代、働く世代が共通して抱える課題や悩み、直面する問題とは？
                        </h2>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 500,
                          color: 'var(--color-primary)',
                          letterSpacing: '0.3px'
                        }}>
                          — 個々の状況が複雑化し、必要な情報が見えなくなっている —
                        </p>
                      </div>

                      {/* 課題カード - 3列グリッド */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '24px',
                        marginBottom: '40px'
                      }}>
                        {/* 課題1: 精神的な不安 */}
                        <div style={{
                          padding: '28px',
                          backgroundColor: '#fff',
                          borderRadius: '16px',
                          border: '2px solid rgba(255, 107, 107, 0.2)',
                          boxShadow: '0 4px 12px rgba(255, 107, 107, 0.08)',
                          transition: 'all 0.3s ease',
                          position: 'relative'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#ff6b6b',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            letterSpacing: '0.5px'
                          }}>
                            精神的な不安
                          </div>
                          <div style={{ 
                            width: '64px', 
                            height: '64px', 
                            borderRadius: '16px',
                            backgroundColor: 'rgba(255, 107, 107, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            marginTop: '8px'
                          }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                          </div>
                          <h4 style={{ 
                            margin: '0 0 16px 0', 
                            fontSize: '18px', 
                            fontWeight: 800, 
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            介護・終活への<wbr />経済的不安
                          </h4>
                          <ul style={{ 
                            margin: 0, 
                            paddingLeft: '20px',
                            fontSize: '14px', 
                            lineHeight: '1.8', 
                            color: 'var(--color-text-light)',
                            listStyle: 'none'
                          }}>
                            <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#ff6b6b' }}>•</span>
                              費用が<strong>どれくらいかかるかわからない</strong>
                            </li>
                            <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#ff6b6b' }}>•</span>
                              相続・税金問題への<strong>不安が続く</strong>
                            </li>
                          </ul>
                        </div>

                        {/* 課題2: 見通しの不安 */}
                        <div style={{
                          padding: '28px',
                          backgroundColor: '#fff',
                          borderRadius: '16px',
                          border: '2px solid rgba(108, 117, 125, 0.2)',
                          boxShadow: '0 4px 12px rgba(108, 117, 125, 0.08)',
                          transition: 'all 0.3s ease',
                          position: 'relative'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#6c757d',
                            backgroundColor: 'rgba(108, 117, 125, 0.1)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            letterSpacing: '0.5px'
                          }}>
                            見通しの不安
                          </div>
                          <div style={{ 
                            width: '64px', 
                            height: '64px', 
                            borderRadius: '16px',
                            backgroundColor: 'rgba(108, 117, 125, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            marginTop: '8px'
                          }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                          </div>
                          <h4 style={{ 
                            margin: '0 0 16px 0', 
                            fontSize: '18px', 
                            fontWeight: 800, 
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            いつ何をすればいいか<wbr />わからない不安
                          </h4>
                          <ul style={{ 
                            margin: 0, 
                            paddingLeft: '20px',
                            fontSize: '14px', 
                            lineHeight: '1.8', 
                            color: 'var(--color-text-light)',
                            listStyle: 'none'
                          }}>
                            <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#6c757d' }}>•</span>
                              終活の計画が立てられず<strong>準備ができない</strong>
                            </li>
                            <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#6c757d' }}>•</span>
                              介護施設選びの<strong>タイミングを見逃す不安</strong>が続く
                            </li>
                          </ul>
                        </div>

                        {/* 課題3: 情報の分散 */}
                        <div style={{
                          padding: '28px',
                          backgroundColor: '#fff',
                          borderRadius: '16px',
                          border: '2px solid rgba(59, 130, 246, 0.2)',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
                          transition: 'all 0.3s ease',
                          position: 'relative'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            letterSpacing: '0.5px'
                          }}>
                            情報の分散
                          </div>
                          <div style={{ 
                            width: '64px', 
                            height: '64px', 
                            borderRadius: '16px',
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            marginTop: '8px'
                          }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8"></circle>
                              <path d="m21 21-4.35-4.35"></path>
                            </svg>
                          </div>
                          <h4 style={{ 
                            margin: '0 0 16px 0', 
                            fontSize: '18px', 
                            fontWeight: 800, 
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            情報が<wbr />分散している
                          </h4>
                          <ul style={{ 
                            margin: 0, 
                            paddingLeft: '20px',
                            fontSize: '14px', 
                            lineHeight: '1.8', 
                            color: 'var(--color-text-light)',
                            listStyle: 'none'
                          }}>
                            <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#3b82f6' }}>•</span>
                              支援制度の情報が<strong>バラバラで探しにくい</strong>
                            </li>
                            <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#3b82f6' }}>•</span>
                              介護施設の情報が<strong>比較しにくい</strong>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* 解決策セクション */}
                      <div style={{
                        padding: '40px 48px',
                        background: 'linear-gradient(135deg, rgba(31, 41, 51, 0.04) 0%, rgba(31, 41, 51, 0.01) 100%)',
                        borderRadius: '20px',
                        border: '3px solid var(--color-primary)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-80px',
                          right: '-80px',
                          width: '300px',
                          height: '300px',
                          borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(31, 41, 51, 0.05) 0%, transparent 70%)',
                          zIndex: 0
                        }}></div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '24px' }}>
                            <div style={{ 
                              width: '72px', 
                              height: '72px', 
                              borderRadius: '20px',
                              background: 'linear-gradient(135deg, var(--color-primary) 0%, rgba(31, 41, 51, 0.8) 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 8px 20px rgba(31, 41, 51, 0.25)'
                            }}>
                              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                            </div>
                            <div style={{ flex: 1 }}>
                              <h3 style={{ 
                                margin: '0 0 16px 0', 
                                fontSize: '24px', 
                                fontWeight: 700, 
                                color: 'var(--color-text)',
                                lineHeight: '1.3'
                              }}>
                                パーソナルな情報分析とワンストップサービスにより、<br />
                                <span style={{ color: 'var(--color-primary)' }}>一人ひとりに最適な支援を提供</span>
                              </h3>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '20px',
                                marginTop: '24px'
                              }}>
                                <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>
                                    情報の一元管理
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginBottom: '8px', opacity: 0.7, fontStyle: 'italic' }}>
                                    Centralized Information
                                  </div>
                                  <div style={{ fontSize: '13px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                                    分散した支援制度を一箇所に集約
                                  </div>
                                </div>
                                <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>
                                    パーソナル分析
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginBottom: '8px', opacity: 0.7, fontStyle: 'italic' }}>
                                    Personal Analysis
                                  </div>
                                  <div style={{ fontSize: '13px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                                    個人の状況に合わせた最適な支援を提案
                                  </div>
                                </div>
                                <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>
                                    ワンストップサービス
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginBottom: '8px', opacity: 0.7, fontStyle: 'italic' }}>
                                    One-Stop Service
                                  </div>
                                  <div style={{ fontSize: '13px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                                    申請から利用まで一貫してサポート
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '40px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '32px', color: '#1f2937', borderLeft: '4px solid var(--color-primary)', paddingLeft: '12px', letterSpacing: '0.3px' }}>
                        1. 介護支援パーソナルアプリケーションとは
                      </h4>
                      {/* キーメッセージ - 最大化 */}
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
                          必要な支援を見逃さない、<wbr />安心の介護・終活を。
                        </h2>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          letterSpacing: '0.3px',
                          lineHeight: '1.6'
                        }}>
                          妊娠・出産・育児を、もっとスマートに、もっと確実に。
                        </p>
                      </div>
                      <p style={{ marginBottom: '16px', paddingLeft: '11px' }}>
                        介護・終活に関する各種支援制度の情報を一元管理し、ユーザーが適切な支援を受けられるようサポートするWebアプリケーションです。支援制度の検索や申請、終活、介護施設、相続税金問題などを一元管理することで、社会問題の解決に貢献します。
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
                              支援制度の情報を一元管理し、必要な支援を見逃すことなく受けられるようサポートします。終活、介護施設選び、相続税金問題など、複雑な手続きを分かりやすく整理します。
                            </p>
                          </div>
                          <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                              働く世代への貢献
                            </h5>
                            <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                              家族との情報共有機能により、家族と協力して介護を進められる環境を整えます。介護と仕事の両立を支援します。
                            </p>
                          </div>
                          <div style={{ marginBottom: '20px' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                              企業への貢献
                            </h5>
                            <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                              従業員が安心して介護休暇を取得し、キャリアプランを描けるよう支援することで、従業員の満足度向上と離職率の低下に貢献します。企業の介護支援施策を可視化し、社会的評価の向上をサポートします。
                            </p>
                          </div>
                          <div style={{ marginBottom: '0' }}>
                            <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                              社会への貢献
                            </h5>
                            <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                              すべてのシニア世代とその家族が、必要な支援制度を見逃すことなく、安心して介護・終活を迎えられる社会の実現に貢献します。医療・ヘルスケア、介護施設、法律・税務、保険など、様々なパートナーと連携し、ワンストップで必要なサービスの利用を実現します。
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        2. アプリケーションの目的
                      </h4>
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
                          多くの人が困っていること
                        </h2>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          letterSpacing: '0.3px',
                          lineHeight: '1.6'
                        }}>
                          情報の分散、手続きの複雑さ、費用の不明確さなど、介護・終活を迎える多くの人が直面する共通の課題
                        </p>
                      </div>
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
                          なぜこれまで実現できなかったのか
                        </h2>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          letterSpacing: '0.3px',
                          lineHeight: '1.6'
                        }}>
                        従来のアプリケーションやサービスでは、以下の理由から、これらの課題を解決することが困難でした。
                      </p>
                      </div>
                      <div style={{ 
                          display: 'flex',
                        gap: '16px', 
                        marginBottom: '32px',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between'
                        }}>
                        <div style={{
                          flex: '1 1 calc(16.666% - 13px)',
                          minWidth: '150px',
                          padding: '20px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            情報の分散と見づらさ
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            支援制度は様々な主体が提供しており、それぞれのWebサイトが独立しているため、情報を探すだけでも一苦労である。
                          </p>
                        </div>
                        <div style={{
                          flex: '1 1 calc(16.666% - 13px)',
                          minWidth: '150px',
                          padding: '20px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            パーソナライズ化のコスト
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            各ユーザーの状況に応じた情報提供には、大量のデータ管理と複雑なロジックが必要で、費用対効果が取れなかった。
                        </p>
                      </div>
                        <div style={{
                          flex: '1 1 calc(16.666% - 13px)',
                          minWidth: '150px',
                          padding: '20px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            24時間365日のサポート
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            介護や終活の疑問や不安は時間を選ばず発生するが、人的リソースによる24時間対応はコストが高すぎる。
                          </p>
                        </div>
                        <div style={{
                          flex: '1 1 calc(16.666% - 13px)',
                          minWidth: '150px',
                          padding: '20px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            複雑な申請フローの可視化
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            制度ごとに異なる申請フローを可視化するには、専門知識とデザイン力の両立が必要で、スケーラブルな仕組みがなかった。
                          </p>
                        </div>
                        <div style={{
                          flex: '1 1 calc(16.666% - 13px)',
                          minWidth: '150px',
                          padding: '20px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            介護施設選びの困難さ
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            介護施設に関する情報が分散しており、必要な情報が不足していたため、選択肢を把握することが困難であった。
                          </p>
                        </div>
                        <div style={{
                          flex: '1 1 calc(16.666% - 13px)',
                          minWidth: '150px',
                          padding: '20px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            多様なパートナーとの連携
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            様々なサービスと連携し、ワンストップで提供するには、個別の連携開発が必要で、拡張性に限界があった。
                          </p>
                        </div>
                      </div>
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid #000', paddingLeft: '8px' }}>
                          3. AIネイティブ設計
                        </h4>
                      </div>
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
                          なぜAIネイティブ設計だと可能なのか
                        </h2>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          letterSpacing: '0.3px',
                          lineHeight: '1.6'
                        }}>
                          AIネイティブ設計により、自動化・パーソナライズ化・継続的改善を低コストで実現
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
                      <div style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        marginBottom: '32px',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{
                          flex: '1 1 calc(14.28% - 14px)',
                          minWidth: '140px',
                          padding: '20px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            AIによる自動情報収集・更新
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            AIエージェントが分散した情報源から自動的に情報を収集・更新し、常に最新の情報を提供できる。手動での情報管理が不要となる。
                          </p>
                        </div>
                        <div style={{
                          flex: '1 1 calc(14.28% - 14px)',
                          minWidth: '140px',
                          padding: '20px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            パーソナライズ化の低コスト実現
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            AIがユーザーの状況を理解し、必要な情報を自動的に抽出・提示することで、従来は困難だった個別最適化が低コストで実現できる。
                          </p>
                        </div>
                        <div style={{
                          flex: '1 1 calc(14.28% - 14px)',
                          minWidth: '140px',
                          padding: '20px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            24時間365日のAIアシスタント
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            LLMを活用したAIアシスタントにより、専門知識に基づいた相談対応を24時間365日、低コストで提供できる。
                          </p>
                        </div>
                        <div style={{
                          flex: '1 1 calc(14.28% - 14px)',
                          minWidth: '140px',
                          padding: '20px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            複雑なフローの自動可視化
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            AIが制度の仕組みを理解し、Mermaid図などの可視化を自動生成することで、専門知識がなくても分かりやすい説明を提供できる。
                          </p>
                        </div>
                        <div style={{
                          flex: '1 1 calc(14.28% - 14px)',
                          minWidth: '140px',
                          padding: '20px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            パートナー連携の自動化
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            AIエージェントが各パートナーのAPIと連携し、ユーザーのニーズに応じて適切なサービスを自動的に提案・接続できる。
                          </p>
                        </div>
                        <div style={{
                          flex: '1 1 calc(14.28% - 14px)',
                          minWidth: '140px',
                          padding: '20px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            継続的な改善
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            ユーザーの行動データをAIが分析し、サービスを継続的に改善する好循環を実現できる。
                          </p>
                        </div>
                        <div style={{
                          flex: '1 1 calc(14.28% - 14px)',
                          minWidth: '140px',
                          padding: '20px',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            marginBottom: '12px',
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            ユーザーフレンドリーなUI設計
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            技術の複雑さを隠し、直感的で使いやすいインターフェースを提供することで、誰でも簡単にサービスを利用できる。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                        3. 対象ユーザー
                      </h4>
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
                          個人・企業・自治体を対象とした包括的なサービス
                        </h2>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          letterSpacing: '0.3px',
                          lineHeight: '1.6'
                        }}>
                          介護・終活を迎えるシニア世代から、家族を支える働く世代、従業員支援を行う企業、住民サービスを提供する自治体まで
                        </p>
                      </div>
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
                        5. 主要な提供機能
                      </h4>
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
                          介護・終活を支える包括的な機能群
                        </h2>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          letterSpacing: '0.3px',
                          lineHeight: '1.6'
                        }}>
                          支援制度の検索から施設選び、終活準備、家族との情報共有まで、必要な機能をワンストップで提供
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
                        6. ビジネスモデル
                      </h4>
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
                          多様な収益源で持続可能な成長を実現
                        </h2>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          letterSpacing: '0.3px',
                          lineHeight: '1.6'
                        }}>
                          個人ユーザーへの直接提供、企業・自治体へのB2B提供、パートナー企業との連携により、多角的な収益構造を構築
                        </p>
                      </div>
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
                        7. 提供価値
                      </h4>
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
                          個人・企業・社会に価値を提供
                        </h2>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          letterSpacing: '0.3px',
                          lineHeight: '1.6'
                        }}>
                          一人ひとりの安心から、企業の成長、社会全体の持続可能性まで、多層的な価値を創造
                        </p>
                      </div>
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
                    <div style={{ marginBottom: '48px', position: 'relative' }}>
                      {/* キーメッセージ - 最大化 */}
                      <div style={{ 
                        marginBottom: '40px',
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
                          なぜ多くの企業でAI活用は<wbr />"止まる"のか？
                        </h2>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 500,
                          color: 'var(--color-primary)',
                          letterSpacing: '0.3px'
                        }}>
                          — 技術ではなく<strong>"人と組織の設計"</strong>がボトルネックになっている —
                        </p>
                      </div>

                      {/* 課題カード - 3列グリッド */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '24px',
                        marginBottom: '40px'
                      }}>
                        {/* 課題1: 人の問題（赤系） */}
                        <div style={{
                          padding: '28px',
                          backgroundColor: '#fff',
                          borderRadius: '16px',
                          border: '2px solid rgba(255, 107, 107, 0.2)',
                          boxShadow: '0 4px 12px rgba(255, 107, 107, 0.08)',
                          transition: 'all 0.3s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-6px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 107, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.2)';
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#ff6b6b',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            letterSpacing: '0.5px'
                          }}>
                            人の問題
                          </div>
                          <div style={{ 
                            width: '64px', 
                            height: '64px', 
                            borderRadius: '16px',
                            backgroundColor: 'rgba(255, 107, 107, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            marginTop: '8px'
                          }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                          </div>
                          <h4 style={{ 
                            margin: '0 0 16px 0', 
                            fontSize: '18px', 
                            fontWeight: 700, 
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            AIの可能性を<wbr />体感できていない
                          </h4>
                          <ul style={{ 
                            margin: 0, 
                            paddingLeft: '20px',
                            fontSize: '14px', 
                            lineHeight: '1.8', 
                            color: 'var(--color-text-light)',
                            listStyle: 'none'
                          }}>
                            <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#ff6b6b' }}>•</span>
                              実体験がないため<strong>発想が生まれない</strong>
                            </li>
                            <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#ff6b6b' }}>•</span>
                              デモ止まりで<strong>業務に結びつかない</strong>
                            </li>
                          </ul>
                        </div>

                        {/* 課題2: 組織の問題（黄色系） */}
                        <div style={{
                          padding: '28px',
                          backgroundColor: '#fff',
                          borderRadius: '16px',
                          border: '2px solid rgba(255, 193, 7, 0.2)',
                          boxShadow: '0 4px 12px rgba(255, 193, 7, 0.08)',
                          transition: 'all 0.3s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-6px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 193, 7, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(255, 193, 7, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(255, 193, 7, 0.2)';
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#ffc107',
                            backgroundColor: 'rgba(255, 193, 7, 0.1)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            letterSpacing: '0.5px'
                          }}>
                            組織の問題
                          </div>
                          <div style={{ 
                            width: '64px', 
                            height: '64px', 
                            borderRadius: '16px',
                            backgroundColor: 'rgba(255, 193, 7, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            marginTop: '8px'
                          }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffc107" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="9" y1="3" x2="9" y2="21"></line>
                              <line x1="15" y1="3" x2="15" y2="21"></line>
                              <line x1="3" y1="9" x2="21" y2="9"></line>
                              <line x1="3" y1="15" x2="21" y2="15"></line>
                            </svg>
                          </div>
                          <h4 style={{ 
                            margin: '0 0 16px 0', 
                            fontSize: '18px', 
                            fontWeight: 700, 
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            PoC（概念実証）<wbr />止まり
                          </h4>
                          <ul style={{ 
                            margin: 0, 
                            paddingLeft: '20px',
                            fontSize: '14px', 
                            lineHeight: '1.8', 
                            color: 'var(--color-text-light)',
                            listStyle: 'none'
                          }}>
                            <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#ffc107' }}>•</span>
                              <strong>ワークフロー変革なし</strong>
                            </li>
                            <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#ffc107' }}>•</span>
                              AIが<strong>"外付け"</strong>になっている
                            </li>
                          </ul>
                        </div>

                        {/* 課題3: 設計の問題（グレー系） */}
                        <div style={{
                          padding: '28px',
                          backgroundColor: '#fff',
                          borderRadius: '16px',
                          border: '2px solid rgba(108, 117, 125, 0.2)',
                          boxShadow: '0 4px 12px rgba(108, 117, 125, 0.08)',
                          transition: 'all 0.3s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-6px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(108, 117, 125, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(108, 117, 125, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(108, 117, 125, 0.2)';
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#6c757d',
                            backgroundColor: 'rgba(108, 117, 125, 0.1)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            letterSpacing: '0.5px'
                          }}>
                            設計の問題
                          </div>
                          <div style={{ 
                            width: '64px', 
                            height: '64px', 
                            borderRadius: '16px',
                            backgroundColor: 'rgba(108, 117, 125, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            marginTop: '8px'
                          }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                          </div>
                          <h4 style={{ 
                            margin: '0 0 16px 0', 
                            fontSize: '18px', 
                            fontWeight: 700, 
                            color: 'var(--color-text)',
                            lineHeight: '1.4'
                          }}>
                            業務理解と<wbr />AI設計のギャップ
                          </h4>
                          <ul style={{ 
                            margin: 0, 
                            paddingLeft: '20px',
                            fontSize: '14px', 
                            lineHeight: '1.8', 
                            color: 'var(--color-text-light)',
                            listStyle: 'none'
                          }}>
                            <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#6c757d' }}>•</span>
                              業務理解なしに<strong>AI導入</strong>
                            </li>
                            <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '20px' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#6c757d' }}>•</span>
                              結果、<strong>最適化されない</strong>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* 解決策セクション - 未来形・ベネフィット重視 */}
                      <div style={{
                        padding: '40px 48px',
                        background: 'linear-gradient(135deg, rgba(31, 41, 51, 0.04) 0%, rgba(31, 41, 51, 0.01) 100%)',
                        borderRadius: '20px',
                        border: '3px solid var(--color-primary)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-80px',
                          right: '-80px',
                          width: '300px',
                          height: '300px',
                          borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(31, 41, 51, 0.05) 0%, transparent 70%)',
                          zIndex: 0
                        }}></div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '24px' }}>
                            <div style={{ 
                              width: '72px', 
                              height: '72px', 
                              borderRadius: '20px',
                              background: 'linear-gradient(135deg, var(--color-primary) 0%, rgba(31, 41, 51, 0.8) 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 8px 20px rgba(31, 41, 51, 0.25)'
                            }}>
                              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                            </div>
                            <div style={{ flex: 1 }}>
                              <h3 style={{ 
                                margin: '0 0 16px 0', 
                                fontSize: '24px', 
                                fontWeight: 700, 
                                color: 'var(--color-text)',
                                lineHeight: '1.3'
                              }}>
                                AIの可能性を"体験"し、業務を"再設計"することで、<br />
                                <span style={{ color: 'var(--color-primary)' }}>自走できるAIネイティブ組織へ</span>
                              </h3>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '20px',
                                marginTop: '24px'
                              }}>
                                <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px' }}>
                                    AI × 業務理解
                                  </div>
                                  <div style={{ fontSize: '13px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                                    実際の体験を通じて発想を生み出す
                                  </div>
                                </div>
                                <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px' }}>
                                    AIネイティブ設計思考
                                  </div>
                                  <div style={{ fontSize: '13px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                                    最適な業務設計を考える
                                  </div>
                                </div>
                                <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '12px' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '8px' }}>
                                    AIファクトリー設計
                                  </div>
                                  <div style={{ fontSize: '13px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                                    再現性のある組織変革
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* フッター */}
                      <div style={{
                        marginTop: '32px',
                        paddingTop: '16px',
                        borderTop: '1px solid rgba(31, 41, 51, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        color: 'var(--color-text-light)'
                      }}>
                        <div style={{ fontWeight: 500 }}>
                          AI導入ルール設計・人材育成・教育事業
                        </div>
                        <div style={{ letterSpacing: '0.5px' }}>
                          株式会社AIアシスタント
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '32px', color: '#1f2937', borderLeft: '4px solid var(--color-primary)', paddingLeft: '12px', letterSpacing: '0.3px' }}>
                        1. 大企業向けAI人材育成・教育とは
                      </h4>
                      {/* キーメッセージ - 最大化 */}
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
                          AIを理解するのではなく、<wbr />使いこなす人材を育てる。
                        </h2>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          letterSpacing: '0.3px',
                          lineHeight: '1.6'
                        }}>
                          大企業向けAI人材育成・教育は、従業員が<strong>AIの可能性を「体験」し、実務での価値創出を自ら設計・実行できるようにする</strong>実践型プログラムです。
                        </p>
                      </div>
                      <div style={{ paddingLeft: '24px', lineHeight: '1.9', color: 'var(--color-text)' }}>
                        <div style={{ marginBottom: '24px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                          <div style={{ flexShrink: 0 }}>
                            <img
                              src="/Gemini_Generated_Image_d67kcqd67kcqd67k.png"
                              alt="Vibeコーディング - AI人材育成"
                              style={{
                                width: '400px',
                                maxWidth: '100%',
                                height: 'auto',
                                borderRadius: '12px',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                              }}
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ marginBottom: '20px', fontSize: '15px', lineHeight: '1.9' }}>
                              本プログラムの中核は<strong style={{ color: 'var(--color-primary)' }}>Vibeコーディング</strong>。
                            </p>
                            <p style={{ marginBottom: '16px', fontSize: '15px', lineHeight: '1.9' }}>
                              単なる知識習得ではなく、実務・データ・業務課題に直結した体験を通じて、
                            </p>
                            <ul style={{ marginLeft: '24px', marginBottom: '16px', fontSize: '15px', lineHeight: '1.9' }}>
                              <li style={{ marginBottom: '10px' }}>
                                <strong>自身の業務とAIの接続</strong>
                              </li>
                              <li style={{ marginBottom: '10px' }}>
                                <strong>AIネイティブな業務設計思考</strong>
                              </li>
                              <li style={{ marginBottom: '10px' }}>
                                <strong>再現性のある業務改革の型化（AIファクトリー）</strong>
                              </li>
                            </ul>
                            <p style={{ marginBottom: '0', fontSize: '15px', lineHeight: '1.9' }}>
                              を身につけます。
                            </p>
                          </div>
                        </div>
                        <p style={{ marginTop: '20px', marginBottom: '0', fontSize: '15px', lineHeight: '1.9' }}>
                          本プログラムは、<strong>株式会社AIアシスタントの成功事例</strong>を元に、大企業規模への展開と横断的な組織変革を可能にします。
                        </p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '32px', color: '#1f2937', borderLeft: '4px solid var(--color-primary)', paddingLeft: '12px', letterSpacing: '0.3px' }}>
                        2. プログラムの目的
                      </h4>
                      {/* キーメッセージ - 最大化 */}
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
                          PoCで止まらず、<wbr />組織を進化させるAI人材を生み出す
                        </h2>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          letterSpacing: '0.3px',
                          lineHeight: '1.6'
                        }}>
                          多くの企業が「PoC止まり」に陥る中、本プログラムは以下の3点を目的とします。
                        </p>
                      </div>
                      <div style={{ paddingLeft: '24px', lineHeight: '1.9', color: 'var(--color-text)', position: 'relative', paddingBottom: '40px' }}>
                        <div style={{ marginBottom: '24px' }}>
                          {/* ① AIの可能性の体感 */}
                          <div style={{ 
                            marginBottom: '12px',
                            display: 'flex',
                            gap: '24px',
                            alignItems: 'flex-start'
                          }}>
                            <div style={{ flexShrink: 0, width: '200px' }}>
                              <img
                                src="/Gemini_Generated_Image_7xcldo7xcldo7xcl.png"
                                alt="AIの可能性の体感"
                                style={{
                                  width: '200px',
                                  height: '200px',
                                  objectFit: 'cover',
                                  borderRadius: '12px',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                }}
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                            <div style={{ 
                              flex: 1,
                              padding: '20px',
                              backgroundColor: 'rgba(31, 41, 51, 0.02)',
                              borderRadius: '12px',
                              borderLeft: '4px solid #4A90E2',
                              position: 'relative'
                            }}>
                              <div style={{
                                position: 'absolute',
                                left: '-8px',
                                top: '20px',
                                width: '0',
                                height: '0',
                                borderTop: '6px solid transparent',
                                borderBottom: '6px solid transparent',
                                borderRight: '6px solid #4A90E2'
                              }}></div>
                              <h5 style={{ 
                                margin: '0 0 12px 0', 
                                fontSize: '16px', 
                                fontWeight: 700, 
                                color: 'var(--color-text)'
                              }}>
                                ① AIの可能性の体感
                              </h5>
                              <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8', listStyle: 'none' }}>
                                <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '0' }}>
                                  <strong>「知る」から「使う」へ</strong>
                                </li>
                                <li style={{ marginBottom: '0', position: 'relative', paddingLeft: '0' }}>
                                  <strong>体感が発想を生む</strong>
                                </li>
                              </ul>
                            </div>
                            {/* 右側ラベル - 体験 */}
                            <div style={{
                              flexShrink: 0,
                              width: '160px',
                              padding: '20px 16px',
                              backgroundColor: 'rgba(31, 41, 51, 0.04)',
                              borderRadius: '12px',
                              border: '2px solid rgba(31, 41, 51, 0.1)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: '200px'
                            }}>
                              <div style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#4A90E2',
                                marginBottom: '4px'
                              }}>
                                体験
                              </div>
                              <div style={{
                                fontSize: '10px',
                                color: 'var(--color-text-light)',
                                fontWeight: 500,
                                marginBottom: '8px',
                                letterSpacing: '0.3px',
                                textAlign: 'center'
                              }}>
                                (Mindset change)
                              </div>
                              <div style={{
                                fontSize: '24px',
                                color: 'var(--color-text-light)',
                                lineHeight: '1',
                                marginBottom: '8px'
                              }}>
                                ↓
                              </div>
                            </div>
                          </div>
                          
                          {/* ② 業務理解の深化 */}
                          <div style={{ 
                            marginBottom: '12px',
                            display: 'flex',
                            gap: '24px',
                            alignItems: 'flex-start'
                          }}>
                            <div style={{ flexShrink: 0, width: '200px' }}>
                              <img
                                src="/Gemini_Generated_Image_fpu87cfpu87cfpu8.png"
                                alt="業務理解の深化"
                                style={{
                                  width: '200px',
                                  height: '200px',
                                  objectFit: 'cover',
                                  borderRadius: '12px',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                }}
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                            <div style={{ 
                              flex: 1,
                              padding: '20px',
                              backgroundColor: 'rgba(31, 41, 51, 0.02)',
                              borderRadius: '12px',
                              borderLeft: '4px solid #FF8C42',
                              position: 'relative'
                            }}>
                              <div style={{
                                position: 'absolute',
                                left: '-8px',
                                top: '20px',
                                width: '0',
                                height: '0',
                                borderTop: '6px solid transparent',
                                borderBottom: '6px solid transparent',
                                borderRight: '6px solid #FF8C42'
                              }}></div>
                              <h5 style={{ 
                                margin: '0 0 12px 0', 
                                fontSize: '16px', 
                                fontWeight: 700, 
                                color: 'var(--color-text)'
                              }}>
                                ② 業務理解の深化
                              </h5>
                              <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8', listStyle: 'none' }}>
                                <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '0' }}>
                                  <strong>業務構造の再構築</strong>
                                </li>
                                <li style={{ marginBottom: '0', position: 'relative', paddingLeft: '0' }}>
                                  <strong>AI前提の思考へ</strong>
                                </li>
                              </ul>
                            </div>
                            {/* 右側ラベル - 設計 */}
                            <div style={{
                              flexShrink: 0,
                              width: '160px',
                              padding: '20px 16px',
                              backgroundColor: 'rgba(31, 41, 51, 0.04)',
                              borderRadius: '12px',
                              border: '2px solid rgba(31, 41, 51, 0.1)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: '200px'
                            }}>
                              <div style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#FF8C42',
                                marginBottom: '4px'
                              }}>
                                設計
                              </div>
                              <div style={{
                                fontSize: '10px',
                                color: 'var(--color-text-light)',
                                fontWeight: 500,
                                marginBottom: '8px',
                                letterSpacing: '0.3px',
                                textAlign: 'center'
                              }}>
                                (Structure change)
                              </div>
                              <div style={{
                                fontSize: '24px',
                                color: 'var(--color-text-light)',
                                lineHeight: '1',
                                marginBottom: '8px'
                              }}>
                                ↓
                              </div>
                            </div>
                          </div>
                          
                          {/* ③ AIネイティブ設計の実践 */}
                          <div style={{ 
                            marginBottom: '0',
                            display: 'flex',
                            gap: '24px',
                            alignItems: 'flex-start'
                          }}>
                            <div style={{ flexShrink: 0, width: '200px' }}>
                              <img
                                src="/Gemini_Generated_Image_klkb3nklkb3nklkb.png"
                                alt="AIネイティブ設計の実践"
                                style={{
                                  width: '200px',
                                  height: '200px',
                                  objectFit: 'cover',
                                  borderRadius: '12px',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                }}
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                            <div style={{ 
                              flex: 1,
                              padding: '20px',
                              backgroundColor: 'rgba(31, 41, 51, 0.02)',
                              borderRadius: '12px',
                              borderLeft: '4px solid #6C757D',
                              position: 'relative'
                            }}>
                              <div style={{
                                position: 'absolute',
                                left: '-8px',
                                top: '20px',
                                width: '0',
                                height: '0',
                                borderTop: '6px solid transparent',
                                borderBottom: '6px solid transparent',
                                borderRight: '6px solid #6C757D'
                              }}></div>
                              <h5 style={{ 
                                margin: '0 0 12px 0', 
                                fontSize: '16px', 
                                fontWeight: 700, 
                                color: 'var(--color-text)'
                              }}>
                                ③ AIネイティブ設計の実践
                              </h5>
                              <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8', listStyle: 'none' }}>
                                <li style={{ marginBottom: '8px', position: 'relative', paddingLeft: '0' }}>
                                  <strong>最適構造を描く</strong>
                                </li>
                                <li style={{ marginBottom: '0', position: 'relative', paddingLeft: '0' }}>
                                  <strong>現場で動く形へ</strong>
                                </li>
                              </ul>
                            </div>
                            {/* 右側ラベル - 実装 */}
                            <div style={{
                              flexShrink: 0,
                              width: '160px',
                              padding: '20px 16px',
                              backgroundColor: 'rgba(31, 41, 51, 0.04)',
                              borderRadius: '12px',
                              border: '2px solid rgba(31, 41, 51, 0.1)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: '200px',
                              position: 'relative'
                            }}>
                              <div style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#6C757D',
                                marginBottom: '4px'
                              }}>
                                実装
                              </div>
                              <div style={{
                                fontSize: '10px',
                                color: 'var(--color-text-light)',
                                fontWeight: 500,
                                marginBottom: '8px',
                                letterSpacing: '0.3px',
                                textAlign: 'center'
                              }}>
                                (Behavior change)
                              </div>
                              <div style={{
                                width: '100%',
                                height: '2px',
                                backgroundColor: 'rgba(31, 41, 51, 0.2)',
                                margin: '8px 0 12px 0'
                              }}></div>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--color-primary)',
                                textAlign: 'center',
                                lineHeight: '1.5',
                                marginBottom: '8px'
                              }}>
                                再現可能な<br />AI変革モデル
                              </div>
                              {/* 右下のプログラム情報 */}
                              <div style={{
                                position: 'absolute',
                                bottom: '12px',
                                right: '12px',
                                fontSize: '9px',
                                color: 'var(--color-text-light)',
                                fontWeight: 500,
                                letterSpacing: '0.3px',
                                opacity: 0.6,
                                textAlign: 'right',
                                lineHeight: '1.3'
                              }}>
                                AI Assistant /<br />CTC Co-Creation
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 左下のPhase情報 */}
                        <div style={{
                          position: 'absolute',
                          left: '24px',
                          bottom: '0',
                          fontSize: '11px',
                          color: 'var(--color-text-light)',
                          fontWeight: 500,
                          letterSpacing: '0.5px',
                          opacity: 0.7
                        }}>
                          Phase 1 / Vision
                        </div>
                        
                        <p style={{ 
                          marginTop: '24px', 
                          marginBottom: '0', 
                          fontSize: '15px', 
                          lineHeight: '1.9',
                          padding: '20px',
                          backgroundColor: 'rgba(31, 41, 51, 0.03)',
                          borderRadius: '12px',
                          border: '1px solid rgba(31, 41, 51, 0.1)'
                        }}>
                          この取り組みにより、<strong>個人から組織へ、実験から構造へ、PoCからスケールへ</strong>と段階的に変革を進め、将来的には企業全体の業務改革・新規事業創出・DX戦略へと発展させます。
                        </p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '32px', color: '#1f2937', borderLeft: '4px solid var(--color-primary)', paddingLeft: '12px', letterSpacing: '0.3px' }}>
                        3. 対象ユーザー
                      </h4>
                      {/* キーメッセージ - 最大化 */}
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
                          誰がこのプログラムを活用するのか
                        </h2>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '18px', 
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          letterSpacing: '0.3px',
                          lineHeight: '1.6'
                        }}>
                          本プログラムの対象ユーザーは、大企業の以下のような従業員です。
                        </p>
                      </div>

                      {/* ユーザータイプカード */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '16px', 
                        marginBottom: '24px',
                        paddingLeft: '20px',
                        paddingRight: '20px'
                      }}>
                        {/* 業務部門の従業員 */}
                        <div style={{
                          padding: '20px',
                          backgroundColor: 'rgba(31, 41, 51, 0.03)',
                          borderRadius: '12px',
                          border: '1px solid rgba(31, 41, 51, 0.1)',
                          borderLeft: '4px solid var(--color-primary)',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            marginBottom: '8px',
                            letterSpacing: '0.3px'
                          }}>
                            業務部門の従業員
                          </div>
                          <p style={{
                            fontSize: '14px',
                            lineHeight: '1.7',
                            color: 'var(--color-text)',
                            margin: '0'
                          }}>
                            日々の業務改善に取り組みたい従業員
                          </p>
                        </div>

                        {/* システム部門の従業員 */}
                        <div style={{
                          padding: '20px',
                          backgroundColor: 'rgba(31, 41, 51, 0.03)',
                          borderRadius: '12px',
                          border: '1px solid rgba(31, 41, 51, 0.1)',
                          borderLeft: '4px solid var(--color-primary)',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            marginBottom: '8px',
                            letterSpacing: '0.3px'
                          }}>
                            システム部門の従業員
                          </div>
                          <p style={{
                            fontSize: '14px',
                            lineHeight: '1.7',
                            color: 'var(--color-text)',
                            margin: '0'
                          }}>
                            AI導入を推進したいIT担当者
                          </p>
                        </div>

                        {/* 経営層・管理職 */}
                        <div style={{
                          padding: '20px',
                          backgroundColor: 'rgba(31, 41, 51, 0.03)',
                          borderRadius: '12px',
                          border: '1px solid rgba(31, 41, 51, 0.1)',
                          borderLeft: '4px solid var(--color-primary)',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            marginBottom: '8px',
                            letterSpacing: '0.3px'
                          }}>
                            経営層・管理職
                          </div>
                          <p style={{
                            fontSize: '14px',
                            lineHeight: '1.7',
                            color: 'var(--color-text)',
                            margin: '0'
                          }}>
                            組織全体のAI活用戦略を考えたい経営層・管理職
                          </p>
                        </div>

                        {/* 人事部門 */}
                        <div style={{
                          padding: '20px',
                          backgroundColor: 'rgba(31, 41, 51, 0.03)',
                          borderRadius: '12px',
                          border: '1px solid rgba(31, 41, 51, 0.1)',
                          borderLeft: '4px solid var(--color-primary)',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            marginBottom: '8px',
                            letterSpacing: '0.3px'
                          }}>
                            人事部門
                          </div>
                          <p style={{
                            fontSize: '14px',
                            lineHeight: '1.7',
                            color: 'var(--color-text)',
                            margin: '0'
                          }}>
                            組織全体のAI人材育成を推進したい人事担当者
                          </p>
                        </div>
                      </div>

                      {/* 補足説明 */}
                      <div style={{ 
                        paddingLeft: '20px',
                        paddingRight: '20px'
                      }}>
                        <div style={{
                          padding: '20px',
                          backgroundColor: 'rgba(31, 41, 51, 0.04)',
                          borderRadius: '12px',
                          border: '1px solid rgba(31, 41, 51, 0.12)',
                          borderLeft: '4px solid #6C757D'
                        }}>
                          <p style={{
                            fontSize: '14px',
                            lineHeight: '1.8',
                            color: 'var(--color-text)',
                            margin: '0',
                            fontWeight: 500
                          }}>
                            <strong style={{ color: '#1f2937' }}>特に、</strong>AIの可能性を体感できていないため発想が出てこない従業員や、PoC止まりで結果の出るAI活用ができていない企業の従業員を<strong style={{ color: '#1f2937' }}>主な対象</strong>としています。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#1f2937', borderLeft: '4px solid var(--color-primary)', paddingLeft: '12px', letterSpacing: '0.3px' }}>
                        4. 解決する課題
                      </h4>
                      <div style={{ paddingLeft: '20px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                        <p style={{ marginBottom: '16px' }}>
                          多くの大企業が直面している以下の課題を解決します：
                        </p>
                        <div style={{ marginBottom: '16px' }}>
                          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                            4.1 AIの可能性を体感できていない
                          </h5>
                          <p style={{ marginLeft: '16px', marginBottom: '12px' }}>
                            従業員がAIの可能性を実際に体験していないため、AIを活用した業務改善のアイディアが生まれません。理論的な説明だけでは、実践的な発想は生まれないのが現状です。
                          </p>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                            4.2 PoC止まりで結果の出るAI活用ができていない
                          </h5>
                          <p style={{ marginLeft: '16px', marginBottom: '12px' }}>
                            多くの企業がPoC（概念実証）段階で止まっており、実際に業務に組み込まれ、結果を出すAI活用・AI導入ができていません。その理由は、オペレーションとワークフロー、会社の仕組みそのものと一緒に変革しないと、AI導入がただの二重作業になってしまうためです。
                          </p>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                            4.3 業務理解とAI設計のギャップ
                          </h5>
                          <p style={{ marginLeft: '16px', marginBottom: '12px' }}>
                            AIの可能性と自分の業務の理解、会社の業務理解がないと、適切なAI活用の設計ができません。業務を深く理解していない状態でAIを導入しても、既存の業務フローに無理やりAIを組み込むだけになり、真の効率化にはつながりません。
                          </p>
                        </div>
                        <div>
                          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                            4.4 組織全体のAI活用ビジョンの欠如
                          </h5>
                          <p style={{ marginLeft: '16px' }}>
                            個社でのAI活用のビジョンが生まれないため、大規模開発が必要になったときに、俯瞰した会社全体の業務コンサルやビジネスプラン、実装支援へと発展させることができません。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#1f2937', borderLeft: '4px solid var(--color-primary)', paddingLeft: '12px', letterSpacing: '0.3px' }}>
                        5. 主要な提供機能
                      </h4>
                      <div style={{ paddingLeft: '20px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                        <div style={{ marginBottom: '20px' }}>
                          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                            5.1 Vibeコーディング中心の実践的研修プログラム
                          </h5>
                          <p style={{ marginLeft: '16px', marginBottom: '12px' }}>
                            本プログラムの中心となるのは<strong>Vibeコーディング</strong>です。Vibeコーディングを通じて、従業員はAIの可能性を実際に体験し、自分の業務や会社の業務を理解した上で、AIを活用した業務改善のアイディアを生み出せるようになります。
                          </p>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                            5.2 AIネイティブ設計とAIファクトリーの概念教育
                          </h5>
                          <p style={{ marginLeft: '16px', marginBottom: '12px' }}>
                            AIネイティブ設計とAIファクトリーの概念を中心に、最適な業務設計を考え、実行できるようになるための教育を提供します。オペレーションとワークフロー、会社の仕組みそのものと一緒に変革する方法を学びます。
                          </p>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                            5.3 自社成功事例に基づく実践的育成
                          </h5>
                          <p style={{ marginLeft: '16px', marginBottom: '12px' }}>
                            株式会社AIアシスタントの自社の成功事例と経験を基に、実践的な研修と育成を提供します。理論だけでなく、実際に成功した事例を通じて、AI活用のノウハウを学びます。
                          </p>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                            5.4 協業パートナーとのスケーラブルな研修プログラム
                          </h5>
                          <p style={{ marginLeft: '16px', marginBottom: '12px' }}>
                            伊藤忠テクノロジーやベルシステム24との協業により、研修プログラムをスケールさせ、事業の拡大を図ります。大規模な企業でも対応できる体制を整えています。
                          </p>
                        </div>
                        <div>
                          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                            5.5 大規模開発への発展支援
                          </h5>
                          <p style={{ marginLeft: '16px' }}>
                            個社でのAI活用のビジョンが生まれることで、大規模開発が必要になったときに、より俯瞰した会社全体の業務コンサルやビジネスプラン、実装支援へと発展させることができます。シグマクシスやI&Bとの協業による業務コンサル、GIクラウドや伊藤忠テクノソリューションズとの協業によるセキュリティ、データベース、システムの環境構築支援も提供します。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#1f2937', borderLeft: '4px solid var(--color-primary)', paddingLeft: '12px', letterSpacing: '0.3px' }}>
                        6. 提供価値
                      </h4>
                      <div style={{ paddingLeft: '20px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                        <p style={{ marginBottom: '16px' }}>
                          本プログラムにより、以下の価値を提供します：
                        </p>
                        <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
                          <li style={{ marginBottom: '12px' }}>
                            <strong>AIの可能性の体感</strong>：従業員がAIの可能性を実際に体験し、AIを活用した業務改善のアイディアを生み出せるようになります。
                          </li>
                          <li style={{ marginBottom: '12px' }}>
                            <strong>PoCを超えた実践的AI活用</strong>：オペレーションとワークフロー、会社の仕組みそのものと一緒に変革することで、PoCを超えた結果の出るAI活用・AI導入が実現できます。
                          </li>
                          <li style={{ marginBottom: '12px' }}>
                            <strong>業務理解に基づくAI設計</strong>：自分の業務と会社の業務を深く理解した上で、AIネイティブ設計とAIファクトリーの概念に基づいた最適な業務設計ができるようになります。
                          </li>
                          <li style={{ marginBottom: '12px' }}>
                            <strong>組織全体のAI活用ビジョンの創出</strong>：個社でのAI活用のビジョンが生まれることで、大規模開発が必要になったときに、より俯瞰した会社全体の業務コンサルやビジネスプラン、実装支援へと発展させることができます。
                          </li>
                          <li style={{ marginBottom: '12px' }}>
                            <strong>実践的な成功事例の共有</strong>：株式会社AIアシスタントの自社の成功事例と経験を基に、理論だけでなく実践的なノウハウを学べます。
                          </li>
                          <li>
                            <strong>スケーラブルな研修体制</strong>：伊藤忠テクノロジーやベルシステム24との協業により、大規模な企業でも対応できる研修体制を提供します。
                          </li>
                        </ul>
                      </div>
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
                        7. 提供価値
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
                        7. 提供価値
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
                        7. 提供価値
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
                        7. 提供価値
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
                        7. 提供価値
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
                        7. 提供価値
                      </h4>
                    </div>
                  </>
                ) : null}
              </div>
          </>
        )}
      </div>
    </>
  );
}
