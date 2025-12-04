'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import Layout from '@/components/Layout';
import { waitForMermaid, renderMermaidDiagram } from '@/lib/mermaidLoader';
import MermaidLoader from '@/components/MermaidLoader';

declare global {
  interface Window {
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
    if (!mermaidLoaded) {
      return;
    }

    const renderDiagram = async () => {
      try {
        // Mermaidが利用可能になるまで待つ（統一管理されたユーティリティを使用）
        await waitForMermaid();
        
        // 統一管理されたユーティリティを使用してレンダリング
        const svg = await renderMermaidDiagram(diagram);
        setSvgContent(svg);
        setIsLoading(false);
      } catch (err) {
        console.error('Mermaidレンダリングエラー:', err);
        setError('Mermaidのレンダリングに失敗しました。');
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [mermaidLoaded, diagram]);

  // 認証のシーケンス図をレンダリング
  useEffect(() => {
    if (!mermaidLoaded) {
      return;
    }

    const renderSequenceDiagram = async () => {
      try {
        // Mermaidが利用可能になるまで待つ（統一管理されたユーティリティを使用）
        await waitForMermaid();
        
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

        // 統一管理されたユーティリティを使用してレンダリング
        const svg = await renderMermaidDiagram(sequenceDiagram);
        setSequenceSvgContent(svg);
      } catch (err) {
        console.error('シーケンス図レンダリングエラー:', err);
      }
    };

    renderSequenceDiagram();
  }, [mermaidLoaded]);

  return (
    <Layout>
      <MermaidLoader
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
        {isLoading && (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>読み込み中...</p>
          </div>
        )}
        {error && (
          <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', marginBottom: '20px' }}>
            <p style={{ color: '#c00', margin: 0 }}>{error}</p>
          </div>
        )}
        {svgContent && (
          <div
            id="specification-diagram"
            style={{
              width: '100%',
              overflowX: 'auto',
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid var(--color-border-color)',
              marginBottom: '32px',
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
        <h2 style={{ marginTop: '48px', marginBottom: '8px' }}>認証フロー</h2>
        <p style={{ margin: 0, marginBottom: '32px', fontSize: '14px', color: 'var(--color-text-light)' }}>
          ユーザー認証の流れを確認できます
        </p>
        {sequenceSvgContent && (
          <div
            id="sequence-diagram"
            style={{
              width: '100%',
              overflowX: 'auto',
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid var(--color-border-color)',
            }}
            dangerouslySetInnerHTML={{ __html: sequenceSvgContent }}
          />
        )}
      </div>
    </Layout>
  );
}

