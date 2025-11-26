'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import Layout from '@/components/Layout';

declare global {
  interface Window {
    mermaid?: any;
  }
}

export default function SpecificationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const [sequenceSvgContent, setSequenceSvgContent] = useState<string>('');


  // 構成図のMermaidコード
  const diagram = `graph LR
    subgraph Frontend["フロントエンド"]
        A["Next.js 14<br/>App Router"] --> B["Layout Component<br/>共通レイアウト"]
        B --> C["Header<br/>ヘッダー"]
        B --> D["Sidebar<br/>サイドバー"]
        B --> E["Main Content<br/>メインコンテンツ"]
        C --- D
        D --- E
    end

    subgraph Hosting["ホスティング"]
        V["Vercel<br/>ホスティング"]
        N["自動デプロイ<br/>GitHub"]
    end

    subgraph Auth["認証"]
        F["Firebase<br/>Authentication"] --> G["Login<br/>ログイン"]
        G --> H["認証状態管理<br/>Auth State"]
    end

    subgraph Database["データベース"]
        I["Firebase<br/>Firestore"] --> J["companyBusinessPlan<br/>会社事業計画"]
        I --> K["businessProjects<br/>事業企画"]
        I --> L["concepts<br/>構想"]
        I --> M["servicePlans<br/>事業計画"]
    end

    subgraph FirebaseServices["Firebase サービス"]
        O["Firebase Auth<br/>認証"]
        P["Firestore<br/>データベース"]
        Q["Console<br/>管理画面"]
    end

    subgraph GoogleServices["Google サービス"]
        R["Google Fonts<br/>フォント"]
        S["Analytics<br/>分析"]
    end

    %% 接続関係を調整してフロントエンド層を上に配置
    V --> A
    N --> V
    R --> A
    S --> A
    A --> F
    A --> I
    H --> E
    E --> I
    F --> O
    I --> P
    Q --> O
    Q --> P

    style A fill:#1F2933,stroke:#3B82F6,stroke-width:3px,color:#fff
    style I fill:#1F2933,stroke:#10B981,stroke-width:3px,color:#fff
    style F fill:#1F2933,stroke:#F59E0B,stroke-width:3px,color:#fff
    style B fill:#1F2933,stroke:#8B5CF6,stroke-width:2px,color:#fff
    style V fill:#1F2933,stroke:#000,stroke-width:2px,color:#fff
    style O fill:#1F2933,stroke:#FFA000,stroke-width:2px,color:#fff
    style P fill:#1F2933,stroke:#4285F4,stroke-width:2px,color:#fff`;

  useEffect(() => {
    if (!mermaidLoaded || typeof window === 'undefined' || !window.mermaid) {
      return;
    }

    const renderDiagram = async () => {
      try {
        const mermaid = window.mermaid;
        
        // 初期化
        mermaid.initialize({ 
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            // ノード間の距離を調整
            nodeSpacing: 80,        // ノード間の水平方向の距離（デフォルト: 50）
            rankSpacing: 100,       // 階層間の垂直方向の距離（デフォルト: 50）
            curve: 'basis',          // エッジの曲線タイプ（linear, basis, cardinal, monotoneX, monotoneY, catmullRom, step, stepBefore, stepAfter）
            padding: 20,            // サブグラフのパディング（デフォルト: 10）
            // ノードのサイズ調整
            defaultRenderer: 'dagre-wrapper', // レンダラー（dagre-wrapper, dagre-d3, elk）
            // ノードのパディングを増やしてテキストが見切れないようにする
            paddingX: 20,           // ノードの左右のパディング
            paddingY: 15,           // ノードの上下のパディング
          },
          // フォントサイズの調整
          themeVariables: {
            fontSize: '14px',       // 基本フォントサイズ
            fontFamily: 'var(--font-inter), var(--font-noto), sans-serif',
            primaryTextColor: '#111827',
            primaryBorderColor: '#E5E7EB',
            lineColor: '#6B7280',
            secondaryTextColor: '#6B7280',
            tertiaryColor: '#F9FAFB',
            // ノードのフォントサイズ
            nodeBkg: '#FFFFFF',
            nodeBorder: '#E5E7EB',
            clusterBkg: '#F9FAFB',
            clusterBorder: '#D1D5DB',
            defaultLinkColor: '#3B82F6',
            titleColor: '#111827',
            edgeLabelBackground: '#FFFFFF',
            // テキストサイズの詳細設定
            cScale0: '#1F2933',
            cScale1: '#3B82F6',
            cScale2: '#10B981',
          },
        });

        // レンダリングしてSVGを取得
        const id = 'mermaid-diagram-' + Date.now();
        let svg: string;
        
        if (typeof mermaid.render === 'function') {
          // 最新のAPI: render()を使用
          const result = await mermaid.render(id, diagram);
          svg = typeof result === 'string' ? result : result.svg;
        } else {
          // フォールバック: 一時的なDOM要素を使用
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
          
          svg = tempContainer.innerHTML;
          document.body.removeChild(tempContainer);
        }
        
        // SVGコンテンツを状態に設定（Reactの管理下に置く）
        setSvgContent(svg);
        setIsLoading(false);
      } catch (err) {
        console.error('Mermaidレンダリングエラー:', err);
        setError('Mermaidのレンダリングに失敗しました。');
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [mermaidLoaded]);

  // 認証のシーケンス図をレンダリング
  useEffect(() => {
    if (!mermaidLoaded || typeof window === 'undefined' || !window.mermaid) {
      return;
    }

    const renderSequenceDiagram = async () => {
      try {
        const mermaid = window.mermaid;
        
        // シーケンス図のMermaidコード
        const sequenceDiagram = `sequenceDiagram
    participant User as ユーザー
    participant Layout as Layout Component
    participant Login as Login Component
    participant Firebase as Firebase Auth
    participant App as アプリケーション

    User->>Layout: アプリにアクセス
    Layout->>Firebase: 認証状態を確認
    Firebase-->>Layout: 未認証
    
    Layout->>Login: ログイン画面を表示
    User->>Login: メール/パスワード入力
    Login->>Firebase: 認証リクエスト
    Firebase-->>Login: 認証成功
    Login->>Layout: 認証状態を更新
    Layout->>App: 認証済みユーザーとして表示
    App-->>User: メインコンテンツを表示`;

        // レンダリングしてSVGを取得
        const id = 'sequence-diagram-' + Date.now();
        let svg: string;
        
        if (typeof mermaid.render === 'function') {
          const result = await mermaid.render(id, sequenceDiagram);
          svg = typeof result === 'string' ? result : result.svg;
        } else {
          const tempContainer = document.createElement('div');
          tempContainer.style.position = 'absolute';
          tempContainer.style.left = '-9999px';
          tempContainer.style.visibility = 'hidden';
          document.body.appendChild(tempContainer);
          
          const diagramDiv = document.createElement('div');
          diagramDiv.className = 'mermaid';
          diagramDiv.textContent = sequenceDiagram;
          tempContainer.appendChild(diagramDiv);
          
          await mermaid.run({
            nodes: [diagramDiv],
          });
          
          svg = tempContainer.innerHTML;
          document.body.removeChild(tempContainer);
        }
        
        setSequenceSvgContent(svg);
      } catch (err) {
        console.error('シーケンス図レンダリングエラー:', err);
      }
    };

    renderSequenceDiagram();
  }, [mermaidLoaded]);


  return (
    <Layout>
      <Script
        src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"
        onLoad={() => {
          setMermaidLoaded(true);
        }}
        onError={() => {
          setError('Mermaidライブラリの読み込みに失敗しました。');
          setIsLoading(false);
        }}
      />
      <div>
        <h1 style={{ marginBottom: '8px' }}>アプリケーション構成図</h1>
        <p style={{ margin: 0, marginBottom: '32px', fontSize: '14px', color: 'var(--color-text-light)' }}>
          現在のアプリケーションの構成を確認できます
        </p>

        <div className="card" style={{ padding: '32px', overflow: 'auto' }}>
          <div style={{ minHeight: '400px' }}>
            {isLoading && (
              <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
                読み込み中...
              </p>
            )}
            {error && (
              <p style={{ color: '#dc3545', fontSize: '14px' }}>
                {error}
              </p>
            )}
            {!isLoading && !error && svgContent && (
              <div 
                id="specification-diagram"
                dangerouslySetInnerHTML={{ __html: svgContent }}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                }}
                className="mermaid-diagram"
              />
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>構成の説明</h2>
          <div style={{ fontSize: '14px', color: 'var(--color-text-light)', lineHeight: '1.8' }}>
            <h3 style={{ marginTop: '16px', marginBottom: '8px', fontSize: '16px', fontWeight: 500, color: 'var(--color-text)' }}>フロントエンド</h3>
            <p>ReactベースのNext.js 14のApp Routerを使用したSPAアプリケーションです。Layout Componentで共通レイアウトを管理し、各ページで再利用されています。コンポーネントはReactの関数コンポーネントで実装されています。</p>

            <h3 style={{ marginTop: '16px', marginBottom: '8px', fontSize: '16px', fontWeight: 500, color: 'var(--color-text)' }}>認証</h3>
            <p>Firebase Authenticationを使用してユーザー認証を実装しています。ログイン状態はLayout Componentで管理され、全ページで共有されます。</p>

            <h3 style={{ marginTop: '16px', marginBottom: '8px', fontSize: '16px', fontWeight: 500, color: 'var(--color-text)' }}>データベース</h3>
            <p>Firebase Firestoreを使用して以下のコレクションでデータを管理しています：</p>
            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>companyBusinessPlan: 会社本体の事業計画</li>
              <li>businessProjects: 事業企画</li>
              <li>concepts: 構想</li>
              <li>servicePlans: 事業計画</li>
            </ul>

            <h3 style={{ marginTop: '16px', marginBottom: '8px', fontSize: '16px', fontWeight: 500, color: 'var(--color-text)' }}>ホスティング・インフラ</h3>
            <p>Vercelを使用してアプリケーションをホスティングしています。GitHubと連携することで、コードのプッシュ時に自動的にデプロイされます。</p>

            <h3 style={{ marginTop: '16px', marginBottom: '8px', fontSize: '16px', fontWeight: 500, color: 'var(--color-text)' }}>Firebase サービス</h3>
            <p>Firebase Authenticationでユーザー認証を、Firestoreでデータベースを管理しています。Firebase Consoleから管理・監視が可能です。</p>

            <h3 style={{ marginTop: '16px', marginBottom: '8px', fontSize: '16px', fontWeight: 500, color: 'var(--color-text)' }}>Google サービス</h3>
            <p>Google Fontsを使用してフォントを提供しています。将来的にはGoogle Analyticsの統合も検討しています。</p>
          </div>
        </div>

        {/* 認証のシーケンス図 */}
        <div className="card" style={{ marginTop: '24px', padding: '24px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>認証のシーケンス図</h2>
          <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
            ユーザー認証の処理フローを確認できます
          </p>
          <div className="card" style={{ padding: '32px', overflow: 'auto', backgroundColor: 'var(--color-background)' }}>
            <div style={{ minHeight: '300px' }}>
              {sequenceSvgContent ? (
                <div 
                  id="sequence-diagram"
                  dangerouslySetInnerHTML={{ __html: sequenceSvgContent }}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                  }}
                />
              ) : (
                <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
                  読み込み中...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

