'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePlan } from '../hooks/usePlan';
import { useContainerVisibility } from '../hooks/useContainerVisibility';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import dynamic from 'next/dynamic';
import KeyVisualPDFMetadataEditor from '@/components/KeyVisualPDFMetadataEditor';
import '@/components/pages/component-test/test-concept/pageStyles.css';

declare global {
  interface Window {
    p5?: any;
  }
}

// コンポーネント化されたページのコンポーネント（条件付きインポート）
const ComponentizedCompanyPlanOverview = dynamic(
  () => import('@/components/pages/component-test/test-concept/ComponentizedCompanyPlanOverview'),
  { ssr: false }
);

// 定数定義
const DEFAULT_KEY_VISUAL_HEIGHT = 56.25; // 16:9のアスペクト比（100 * 9 / 16 = 56.25）
const FIRESTORE_COLLECTION_NAME = 'companyBusinessPlan';

// Mermaid図を含むコンテンツをレンダリングするコンポーネント
const MermaidContent = ({ content }: { content: string }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const initializedRef = useRef(false);
  const contentKeyRef = useRef<string>('');

  useEffect(() => {
    // contentからMermaid図のコードを抽出
    const extractMermaidCode = (html: string): string | null => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const mermaidElement = doc.querySelector('.mermaid');
      if (mermaidElement) {
        return mermaidElement.textContent || (mermaidElement as HTMLElement).innerText;
      }
      return null;
    };

    const mermaidCode = extractMermaidCode(content);
    if (!mermaidCode) {
      setSvgContent('');
      return;
    }

    // contentが変更されたときのみ再レンダリング
    if (contentKeyRef.current === content) {
      return;
    }
    contentKeyRef.current = content;

    const renderMermaid = async () => {
      if (typeof window === 'undefined' || !window.mermaid) {
        // Mermaidがまだ読み込まれていない場合、イベントを待つ
        const handleMermaidLoad = async () => {
          await renderMermaid();
          window.removeEventListener('mermaidloaded', handleMermaidLoad);
        };
        window.addEventListener('mermaidloaded', handleMermaidLoad);
      return;
    }
    
      setIsRendering(true);
      try {
        const mermaid = window.mermaid;
        
        // Mermaidの初期化（グローバルに一度だけ）
        if (!initializedRef.current) {
          mermaid.initialize({ 
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              nodeSpacing: 80,
              rankSpacing: 100,
            },
          });
          initializedRef.current = true;
        }

        const id = 'mermaid-diagram-' + Date.now();
        
        if (typeof mermaid.render === 'function') {
          // 最新のAPI: render()を使用
          const result = await mermaid.render(id, mermaidCode);
          const svg = typeof result === 'string' ? result : result.svg;
          setSvgContent(svg);
        } else {
          // フォールバック: 一時的なDOM要素を使用
          const tempContainer = document.createElement('div');
          tempContainer.style.position = 'absolute';
          tempContainer.style.left = '-9999px';
          tempContainer.style.visibility = 'hidden';
          document.body.appendChild(tempContainer);
          
          const diagramDiv = document.createElement('div');
          diagramDiv.className = 'mermaid';
          diagramDiv.textContent = mermaidCode;
          tempContainer.appendChild(diagramDiv);
          
          await mermaid.run({
            nodes: [diagramDiv],
          });
          
          const svg = tempContainer.innerHTML;
          document.body.removeChild(tempContainer);
          setSvgContent(svg);
        }
    } catch (error) {
        console.error('Mermaidレンダリングエラー:', error);
        setSvgContent('');
      } finally {
        setIsRendering(false);
      }
    };

    renderMermaid();
  }, [content]);

  if (isRendering) {
    return (
      <div style={{ padding: '16px', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Mermaid図を読み込み中...</div>
      </div>
    );
  }

  if (!svgContent) {
    return null;
  }

  return (
    <div
      style={{
        padding: '16px',
        minHeight: '100px',
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

// 固定ページ形式のコンテナセクション定義用のMermaid図コンテンツ
const mermaidDiagramContent = `<div class="mermaid">
graph TB
    A["/business-plan/company/[planId]"] --> B["/overview<br/>概要・コンセプト"]
    A --> C["/business-model<br/>事業モデル"]
    A --> D["/market-size<br/>市場規模"]
    A --> E["/features<br/>特徴"]
    A --> F["/itochu-synergy<br/>伊藤忠シナジー"]
    A --> G["/plan<br/>事業計画"]
    A --> H["/references<br/>参考文献"]
    A --> I["/case-study<br/>ケーススタディ"]
    A --> J["/risk-assessment<br/>リスク評価"]
    A --> K["/simulation<br/>シミュレーション"]
    A --> L["/execution-schedule<br/>実行スケジュール"]
    A --> M["/snapshot-comparison<br/>スナップショット比較"]
    A --> N["/subsidies<br/>補助金"]
    A --> O["/visualizations<br/>可視化"]
    
    B --> B1["固定ページ形式<br/>コンテナ管理"]
    B --> B2["コンポーネント形式<br/>動的コンテンツ"]
    B --> B3["キービジュアル設定"]
    
    C --> C1["Mermaid図表示"]
    C --> C2["サービス別図表"]
    
    style A fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff
    style B fill:#90EE90,stroke:#32CD32,stroke-width:2px,color:#000
    style C fill:#FFB6C1,stroke:#FF69B4,stroke-width:2px,color:#000
</div>`;

// 三方良しの関係図用のMermaid図コンテンツ
const sampoYoshiDiagramContent = `<div class="mermaid">
graph TB
    Center["三方よし<br/>Sampo-yoshi<br/><br/>持続的な企業価値向上<br/>と社会課題の解決"]
    
    Seller["売り手よし<br/><br/>取引において売り手が<br/>適正な利益を得られること<br/>持続可能な事業運営の基盤"]
    Buyer["買い手よし<br/><br/>買い手が適正な価格で<br/>良質な商品・サービスを<br/>得られること<br/>顧客満足の実現"]
    Society["世間よし<br/><br/>社会全体に貢献し<br/>ステークホルダー全体の<br/>利益を考慮すること<br/>社会課題の解決"]
    
    Center --> Seller
    Center --> Buyer
    Center --> Society
    
    Seller --> Buyer
    Buyer --> Society
    Society --> Seller
    
    SDGs["SDGsの理念<br/>持続可能な開発目標"]
    Stakeholders["ステークホルダー<br/>投資家・株主・取引先<br/>社員・社会"]
    
    Center --> SDGs
    Seller --> Stakeholders
    Buyer --> Stakeholders
    Society --> Stakeholders
    
    style Center fill:#4169E1,stroke:#1E3A8A,stroke-width:3px,color:#fff
    style Seller fill:#90EE90,stroke:#32CD32,stroke-width:2px,color:#000
    style Buyer fill:#87CEEB,stroke:#4682B4,stroke-width:2px,color:#000
    style Society fill:#FFB6C1,stroke:#FF69B4,stroke-width:2px,color:#000
    style SDGs fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
    style Stakeholders fill:#DDA0DD,stroke:#9370DB,stroke-width:2px,color:#000
</div>`;

// タスク実行型エージェントのシーケンス図用のMermaid図コンテンツ
const taskExecutionSequenceContent = `<div class="mermaid">
sequenceDiagram
    participant User as ユーザー
    participant System as システム
    participant Agent as タスク実行型エージェント
    participant Executor as 実行エンジン
    participant Validator as 検証モジュール
    
    User->>System: タスクリクエスト送信
    System->>Agent: タスク受信・解析
    Agent->>Agent: タスク要件の理解
    Agent->>Agent: 実行計画の作成
    Agent->>Executor: 実行計画の送信
    Executor->>Executor: タスク実行
    Executor->>Validator: 実行結果の送信
    Validator->>Validator: 結果の検証
    Validator->>Agent: 検証結果の返却
    Agent->>Agent: 結果の評価・処理
    Agent->>System: 完了報告
    System->>User: タスク完了通知
</div>`;

// タスク実行型エージェントの環境構築アーキテクチャ図用のMermaid図コンテンツ
const taskExecutionArchitectureContent = `<div class="mermaid">
graph TB
    subgraph "クライアント層"
        WebApp["Webアプリケーション<br/>React/Next.js"]
        MobileApp["モバイルアプリ<br/>iOS/Android"]
        API["REST API<br/>GraphQL"]
    end
    
    subgraph "API Gateway層"
        Gateway["API Gateway<br/>認証・ルーティング<br/>レート制限"]
        LoadBalancer["ロードバランサー<br/>SSL終端"]
    end
    
    subgraph "アプリケーション層"
        subgraph "タスク実行エージェント"
            AgentCore["エージェントコア<br/>タスク解析・計画"]
            TaskQueue["タスクキュー<br/>RabbitMQ/Kafka"]
            Executor["実行エンジン<br/>Docker/Kubernetes"]
            Validator["検証モジュール<br/>結果検証・品質チェック"]
        end
        
        subgraph "オーケストレーション"
            Orchestrator["オーケストレーター<br/>ワークフロー管理"]
            Scheduler["スケジューラー<br/>Cron/Job管理"]
        end
    end
    
    subgraph "データ層"
        PostgreSQL["PostgreSQL<br/>メタデータ・設定"]
        Redis["Redis<br/>キャッシュ・セッション"]
        MongoDB["MongoDB<br/>タスクログ・履歴"]
        S3["Object Storage<br/>S3/Blob Storage<br/>ファイル・アーティファクト"]
    end
    
    subgraph "AI/ML層"
        LLMService["LLMサービス<br/>GPT/Claude API"]
        EmbeddingService["埋め込みサービス<br/>ベクトル検索"]
        ModelRegistry["モデルレジストリ<br/>ドメイン特化モデル"]
    end
    
    subgraph "モニタリング・ロギング"
        Prometheus["Prometheus<br/>メトリクス収集"]
        Grafana["Grafana<br/>可視化・ダッシュボード"]
        ELK["ELK Stack<br/>ログ集約・分析"]
        AlertManager["アラートマネージャー<br/>通知・エスカレーション"]
    end
    
    subgraph "セキュリティ層"
        AuthService["認証サービス<br/>OAuth2/JWT"]
        Vault["シークレット管理<br/>HashiCorp Vault"]
        WAF["Web Application Firewall<br/>DDoS保護"]
    end
    
    subgraph "インフラストラクチャ"
        Kubernetes["Kubernetes<br/>コンテナオーケストレーション"]
        CloudProvider["クラウドプロバイダー<br/>AWS/Azure/GCP"]
        CDN["CDN<br/>コンテンツ配信"]
    end
    
    WebApp --> Gateway
    MobileApp --> Gateway
    API --> Gateway
    Gateway --> LoadBalancer
    LoadBalancer --> AgentCore
    
    AgentCore --> TaskQueue
    TaskQueue --> Executor
    Executor --> Validator
    Validator --> AgentCore
    
    Orchestrator --> AgentCore
    Orchestrator --> Executor
    Scheduler --> Orchestrator
    
    AgentCore --> PostgreSQL
    AgentCore --> Redis
    Executor --> MongoDB
    Executor --> S3
    
    AgentCore --> LLMService
    AgentCore --> EmbeddingService
    AgentCore --> ModelRegistry
    
    Executor --> Prometheus
    AgentCore --> ELK
    Prometheus --> Grafana
    Prometheus --> AlertManager
    
    Gateway --> AuthService
    AgentCore --> Vault
    Gateway --> WAF
    
    Kubernetes --> CloudProvider
    Executor --> Kubernetes
    Gateway --> CDN
    
    style WebApp fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style Gateway fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style AgentCore fill:#e8f5e9,stroke:#388e3c,stroke-width:3px
    style Executor fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    style PostgreSQL fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style LLMService fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    style Kubernetes fill:#e0f2f1,stroke:#00796b,stroke-width:2px
</div>`;

export default function OverviewPage() {
  const { plan, loading, reloadPlan } = usePlan();
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  // すべてのHooksを早期リターンの前に呼び出す（React Hooksのルール）
  const { showContainers } = useContainerVisibility();
  const imgRef = useRef<HTMLImageElement>(null);
  const cycleDiagramRef = useRef<HTMLDivElement>(null);
  const cycleP5Instance = useRef<any>(null);
  const p5Loaded = useRef(false);
  const cycleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const [keyVisualHeight, setKeyVisualHeight] = useState<number>(DEFAULT_KEY_VISUAL_HEIGHT);
  const [keyVisualScale, setKeyVisualScale] = useState<number>(100); // スケール（%）
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number | null>(null);
  const [showSizeControl, setShowSizeControl] = useState(false);
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [showLogoEditor, setShowLogoEditor] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoSize, setLogoSize] = useState<number>(15); // ロゴの高さ（mm）- デフォルト15mm
  const [showTitleEditor, setShowTitleEditor] = useState(false);
  const [titlePositionX, setTitlePositionX] = useState<number>(5); // タイトルのX位置（mm）- デフォルト5mm
  const [titlePositionY, setTitlePositionY] = useState<number>(-3); // タイトルのY位置（mm）- デフォルト-3mm
  const [titleFontSize, setTitleFontSize] = useState<number>(12); // タイトルのフォントサイズ（px）- デフォルト12px
  const [titleBorderEnabled, setTitleBorderEnabled] = useState<boolean>(true); // タイトルのボーダー（縦棒）の有無 - デフォルト有り
  const [footerText, setFooterText] = useState<string>('AI assistant company, Inc - All Rights Reserved'); // フッターテキスト - デフォルト値
  
  // コンポーネント化版かどうかを判定
  const isComponentized = plan?.pagesBySubMenu && 
    typeof plan.pagesBySubMenu === 'object' && 
    Object.keys(plan.pagesBySubMenu).length > 0 &&
    Object.values(plan.pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);

  // キービジュアルの高さとスケールを読み込む
  useEffect(() => {
    if (plan?.keyVisualHeight !== undefined) {
      setKeyVisualHeight(plan.keyVisualHeight);
    }
    if (plan?.keyVisualScale !== undefined) {
      setKeyVisualScale(plan.keyVisualScale);
          }
  }, [plan?.keyVisualHeight, plan?.keyVisualScale]);

  // ロゴサイズを初期化
  useEffect(() => {
    if (plan?.keyVisualLogoSize !== undefined) {
      setLogoSize(plan.keyVisualLogoSize);
    }
  }, [plan?.keyVisualLogoSize]);

  // タイトル設定を初期化
  useEffect(() => {
    if (plan?.titlePositionX !== undefined) {
      setTitlePositionX(plan.titlePositionX);
    }
    if (plan?.titlePositionY !== undefined) {
      setTitlePositionY(plan.titlePositionY);
    }
    if (plan?.titleFontSize !== undefined) {
      setTitleFontSize(plan.titleFontSize);
    }
    if (plan?.titleBorderEnabled !== undefined) {
      setTitleBorderEnabled(plan.titleBorderEnabled);
            } else {
      // デフォルトは有り
      setTitleBorderEnabled(true);
    }
    if (plan?.footerText !== undefined) {
      setFooterText(plan.footerText);
    } else {
      // デフォルト値
      setFooterText('AI assistant company, Inc - All Rights Reserved');
    }
  }, [plan?.titlePositionX, plan?.titlePositionY, plan?.titleFontSize, plan?.titleBorderEnabled, plan?.footerText]);

  // 画像が読み込まれたときにアスペクト比を取得
  useEffect(() => {
    if (plan?.keyVisualUrl && imgRef.current) {
      const img = imgRef.current;
      const checkAspectRatio = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          setOriginalAspectRatio(aspectRatio);
        }
      };
      
      if (img.complete) {
        checkAspectRatio();
    } else {
        img.onload = checkAspectRatio;
        img.onerror = () => {
          setOriginalAspectRatio(16 / 9);
        };
      }
    } else {
      setOriginalAspectRatio(null);
    }
  }, [plan?.keyVisualUrl]);

  // p5.jsでデータ循環ループ図を描画
  useEffect(() => {
    if (planId !== '5fMIys3S9yCQNCtEpIDH' || !cycleDiagramRef.current) return;

    const initCycleDiagram = () => {
      if (typeof window === 'undefined' || !window.p5 || !cycleDiagramRef.current) {
        return false;
      }

      if (cycleDiagramRef.current.hasChildNodes()) {
        return true;
      }

      const sketch = (p: any) => {
        const labels = [
          "さらなる\nデータ",
          "より良い\nアルゴリズム",
          "より良い\nサービス",
          "さらなる\n利用"
        ];
        const englishLabels = [
          "Data",
          "Algorithm",
          "Service",
          "Usage"
        ];

        const NUM_PARTICLES = 5000;
        const STEPS_PER_PARTICLE = 200;
        const NOISE_SCALE = 0.003;
        const particles: any[] = [];
        const nodes: any[] = [];
        let nodeR = 42;
        let bigR = 95;

        const drawNodesAndLabels = () => {
          const cx = p.width / 2;
          const cy = p.height / 2 + 10;
          const outerRadius = bigR + 30;
          p.noFill();
          const numLayers = 5;
          const layerSpacing = 3;
          const startRadius = outerRadius - (numLayers - 1) * layerSpacing / 2;
          
          for (let layer = 0; layer < numLayers; layer++) {
            const radius = startRadius + layer * layerSpacing;
            const opacity = 5 + (layer / (numLayers - 1)) * 25;
            const strokeWeight = 0.3 + (layer / (numLayers - 1)) * 0.4;
            p.stroke(0, opacity);
            p.strokeWeight(strokeWeight);
            for (let i = 0; i < 4; i++) {
              const startAngle = -p.HALF_PI + i * p.HALF_PI + 0.3;
              const endAngle = -p.HALF_PI + ((i + 1) % 4) * p.HALF_PI - 0.3;
              p.arc(cx, cy, radius * 2, radius * 2, startAngle, endAngle);
            }
          }
          
          const outermostRadius = startRadius + (numLayers - 1) * layerSpacing;
          for (let i = 0; i < 4; i++) {
            const endAngle = -p.HALF_PI + ((i + 1) % 4) * p.HALF_PI - 0.3;
            const tipX = cx + p.cos(endAngle) * outermostRadius;
            const tipY = cy + p.sin(endAngle) * outermostRadius;
            const arrowSize = 6;
            const leftAngle = endAngle + p.PI * 0.75;
            const rightAngle = endAngle - p.PI * 0.75;
            p.fill(0, 30);
            p.noStroke();
            p.triangle(tipX, tipY, tipX + p.cos(leftAngle) * arrowSize, tipY + p.sin(leftAngle) * arrowSize, tipX + p.cos(rightAngle) * arrowSize, tipY + p.sin(rightAngle) * arrowSize);
            p.noFill();
          }

          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const x = node.x;
            const y = node.y;

            p.noStroke();
            p.fill(255);
            p.ellipse(x, y, nodeR * 2 + 6, nodeR * 2 + 6);
            p.stroke(0, 12);
            p.strokeWeight(0.5);
            p.noFill();
            p.ellipse(x, y, nodeR * 2 + 4, nodeR * 2 + 4);
            p.stroke(0, 35);
            p.strokeWeight(0.8);
            p.fill(255);
            p.ellipse(x, y, nodeR * 2, nodeR * 2);
            p.stroke(0, 20);
            p.strokeWeight(0.4);
            p.noFill();
            p.ellipse(x, y, nodeR * 1.4, nodeR * 1.4);

            p.noStroke();
            p.fill(0, 255);
            p.textSize(13);
            p.textFont("sans-serif");
            p.textAlign(p.CENTER, p.CENTER);
            p.text(labels[i], x, y);
            p.fill(0, 180);
            p.textSize(7);
            p.textAlign(p.CENTER, p.CENTER);
            p.text(englishLabels[i], x, y + nodeR + 8);
          }
        };

        const drawParticle = (particle: any, p: any, nodes: any[], noiseScale: number, bigR: number, nodeR: number) => {
          const currentNode = nodes[particle.nodeIndex];
          const nextNode = nodes[currentNode.nextIndex];

          const angle = p.noise(particle.x * noiseScale, particle.y * noiseScale) * p.TWO_PI * 3.0;
          let vx = p.cos(angle) * 0.3;
          let vy = p.sin(angle) * 0.3;

          const dxFromCurrent = particle.x - currentNode.x;
          const dyFromCurrent = particle.y - currentNode.y;
          const distFromCurrent = p.sqrt(dxFromCurrent * dxFromCurrent + dyFromCurrent * dyFromCurrent);
          if (distFromCurrent > 0.001) {
            const repelStrength = 0.15 / (distFromCurrent * 0.01 + 1.0);
            vx -= (dxFromCurrent / distFromCurrent) * repelStrength;
            vy -= (dyFromCurrent / distFromCurrent) * repelStrength;
          }

          const dxToNext = nextNode.x - particle.x;
          const dyToNext = nextNode.y - particle.y;
          const distToNext = p.sqrt(dxToNext * dxToNext + dyToNext * dyToNext);
          if (distToNext > 0.001) {
            const attractStrength = 0.2 / (distToNext * 0.005 + 1.0);
            vx += (dxToNext / distToNext) * attractStrength;
            vy += (dyToNext / distToNext) * attractStrength;
          }

          const cx = p.width / 2;
          const cy = p.height / 2 + 10;
          const dx = particle.x - cx;
          const dy = particle.y - cy;
          const distFromCenter = p.sqrt(dx * dx + dy * dy);
          if (distFromCenter > 0.001) {
            const tangentX = -dy / distFromCenter;
            const tangentY = dx / distFromCenter;
            const tangentStrength = 0.15;
            vx += tangentX * tangentStrength;
            vy += tangentY * tangentStrength;
          }

          const ox = particle.x;
          const oy = particle.y;
          particle.x += vx;
          particle.y += vy;

          const outerRadius = bigR + 30;
          const numLayers = 5;
          const layerSpacing = 3;
          const startRadius = outerRadius - (numLayers - 1) * layerSpacing / 2;
          const outermostRadius = startRadius + (numLayers - 1) * layerSpacing;
          const particleMaxRadius = outermostRadius + 40;
          
          const distFromCenterAfter = p.sqrt((particle.x - cx) ** 2 + (particle.y - cy) ** 2);
          if (distFromCenterAfter > particleMaxRadius) {
            particle.nodeIndex = currentNode.nextIndex;
            const newNode = nodes[particle.nodeIndex];
            const angle = p.random(p.TWO_PI);
            const radius = p.random(nodeR * 0.8, nodeR * 1.2);
            particle.x = newNode.x + p.cos(angle) * radius;
            particle.y = newNode.y + p.sin(angle) * radius;
            return;
          }

          p.line(ox, oy, particle.x, particle.y);
        };

        p.setup = () => {
          const containerWidth = cycleDiagramRef.current?.clientWidth || 400;
          const canvasWidth = Math.min(containerWidth - 32, 400);
          const canvasHeight = 350;
          p.createCanvas(canvasWidth, canvasHeight);
          p.pixelDensity(2);
          p.background(255);
          p.stroke(0, 18);
          p.strokeWeight(0.4);
          p.noFill();

          const cx = p.width / 2;
          const cy = p.height / 2 + 10;
          bigR = 95;
          nodeR = 42;

          for (let i = 0; i < 4; i++) {
            let angle = -p.HALF_PI + i * p.HALF_PI;
            let x = cx + p.cos(angle) * bigR;
            let y = cy + p.sin(angle) * bigR;
            nodes.push({ x, y, angle, nextIndex: (i + 1) % 4 });
          }

          for (let i = 0; i < NUM_PARTICLES; i++) {
            const nodeIndex = i % 4;
            const node = nodes[nodeIndex];
            const angle = p.random(p.TWO_PI);
            const radius = p.random(nodeR * 0.8, nodeR * 1.5);
            particles.push({
              x: node.x + p.cos(angle) * radius,
              y: node.y + p.sin(angle) * radius,
              nodeIndex: nodeIndex,
              vx: 0,
              vy: 0
            });
          }

          let stepCount = 0;
          const drawStep = () => {
            if (stepCount >= STEPS_PER_PARTICLE) {
              drawNodesAndLabels();
              p.noLoop();
              return;
            }

            const batchSize = 10;
            for (let s = 0; s < batchSize && stepCount < STEPS_PER_PARTICLE; s++) {
              particles.forEach((particle) => {
                drawParticle(particle, p, nodes, NOISE_SCALE, bigR, nodeR);
              });
              stepCount++;
            }

            if (stepCount < STEPS_PER_PARTICLE) {
              setTimeout(drawStep, 0);
            } else {
              drawNodesAndLabels();
              p.noLoop();
            }
          };

          drawStep();
        };

        p.draw = () => {};
      };

      cycleP5Instance.current = new window.p5(sketch, cycleDiagramRef.current);
      return true;
    };

    const tryInit = () => {
      if (initCycleDiagram()) {
        return;
      }
      const timeoutId = setTimeout(tryInit, 100);
      cycleTimeoutRefs.current.push(timeoutId);
    };

    const handleP5Loaded = () => {
      p5Loaded.current = true;
      if (typeof window !== 'undefined' && window.p5) {
        const timeoutId = setTimeout(() => {
          tryInit();
        }, 100);
        cycleTimeoutRefs.current.push(timeoutId);
      }
    };

    window.addEventListener('p5loaded', handleP5Loaded);
    
    if (typeof window !== 'undefined' && window.p5) {
      p5Loaded.current = true;
      const timeoutId = setTimeout(() => {
        tryInit();
      }, 200);
      cycleTimeoutRefs.current.push(timeoutId);
    } else {
      const checkInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.p5) {
          p5Loaded.current = true;
          clearInterval(checkInterval);
          cycleCheckIntervalRef.current = null;
          const timeoutId = setTimeout(() => {
            tryInit();
          }, 200);
          cycleTimeoutRefs.current.push(timeoutId);
        }
      }, 100);
      cycleCheckIntervalRef.current = checkInterval;

      const timeoutId = setTimeout(() => {
        if (cycleCheckIntervalRef.current) {
          clearInterval(cycleCheckIntervalRef.current);
          cycleCheckIntervalRef.current = null;
        }
      }, 10000);
      cycleTimeoutRefs.current.push(timeoutId);
    }

    return () => {
      window.removeEventListener('p5loaded', handleP5Loaded);
      
      if (cycleCheckIntervalRef.current) {
        clearInterval(cycleCheckIntervalRef.current);
        cycleCheckIntervalRef.current = null;
      }
      
      cycleTimeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      cycleTimeoutRefs.current = [];
      
      if (cycleP5Instance.current) {
        try {
          cycleP5Instance.current.remove();
        } catch (e) {
          // エラーは無視
        }
        cycleP5Instance.current = null;
      }
      if (cycleDiagramRef.current) {
        cycleDiagramRef.current.innerHTML = '';
      }
    };
  }, [planId, showContainers]);
  
  // キービジュアルの高さを保存（useCallbackでメモ化）
  const handleSaveKeyVisualHeight = useCallback(async (height: number) => {
    if (!auth?.currentUser || !db || !planId) return;
    
    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTION_NAME, planId), {
        keyVisualHeight: height,
        updatedAt: serverTimestamp(),
      });
      setKeyVisualHeight(height);
    } catch (error) {
      console.error('キービジュアルサイズの保存エラー:', error);
    }
  }, [auth?.currentUser, db, planId]);

  // キービジュアルのスケールを保存
  const handleSaveKeyVisualScale = useCallback(async (scale: number) => {
    if (!auth?.currentUser || !db || !planId) return;
    
    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTION_NAME, planId), {
        keyVisualScale: scale,
        updatedAt: serverTimestamp(),
      });
      setKeyVisualScale(scale);
    } catch (error) {
      console.error('キービジュアルスケールの保存エラー:', error);
    }
  }, [auth?.currentUser, db, planId]);

  // メタデータを保存
  const handleMetadataSave = useCallback(async (metadata: {
    title: string;
    signature: string;
    date: string;
    position: { x: number; y: number; align: 'left' | 'center' | 'right' };
    titleFontSize?: number;
    signatureFontSize?: number;
    dateFontSize?: number;
  }) => {
    if (!auth?.currentUser || !db || !planId) return;
    
    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTION_NAME, planId), {
        keyVisualMetadata: metadata,
        updatedAt: serverTimestamp(),
      });
      setShowMetadataEditor(false);
      // planを再読み込みして最新のデータを取得
      if (reloadPlan) {
        await reloadPlan();
      }
    } catch (error) {
      console.error('キービジュアルメタデータの保存エラー:', error);
          }
  }, [auth?.currentUser, db, planId, reloadPlan]);

  // キービジュアル画像の変更ハンドラ
  const handleImageChange = () => {
    if (planId) {
      router.push(`/business-plan/company/${planId}/overview/upload-key-visual`);
        }
  };

  // ロゴファイル選択ハンドラ
  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
          return;
        }

    handleLogoUpload(file);
  };

  // ロゴアップロードハンドラ
  const handleLogoUpload = useCallback(async (file: File) => {
    if (!plan?.id || !storage || !auth?.currentUser || !planId || !db) {
      alert('Firebaseが初期化されていません。');
            return;
          }

    setLogoUploading(true);
    try {
      // Firebase Storageにアップロード
      const storageRef = ref(storage, `companyBusinessPlan/${planId}/logo.png`);
      await uploadBytes(storageRef, file);
      
      // ダウンロードURLを取得
      const downloadURL = await getDownloadURL(storageRef);

      // Firestoreに保存
      const planRef = doc(db, FIRESTORE_COLLECTION_NAME, plan.id);
      await updateDoc(planRef, {
        keyVisualLogoUrl: downloadURL,
        updatedAt: serverTimestamp()
      });

      setShowLogoEditor(false);
      alert('ロゴのアップロードが完了しました。');
      // ページをリロードしてplanを再取得
      window.location.reload();
    } catch (error) {
      console.error('ロゴアップロードエラー:', error);
      alert(`ロゴのアップロードに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLogoUploading(false);
    }
  }, [plan?.id, storage, auth?.currentUser, planId, db]);

  // ロゴ削除ハンドラ
  const handleLogoDelete = useCallback(async () => {
    if (!plan?.id || !db) {
      alert('Firebaseが初期化されていません。');
        return;
      }

    if (!confirm('ロゴを削除しますか？')) return;

    try {
      const planRef = doc(db, FIRESTORE_COLLECTION_NAME, plan.id);
      await updateDoc(planRef, {
        keyVisualLogoUrl: null,
        updatedAt: serverTimestamp()
      });

      setShowLogoEditor(false);
      alert('ロゴを削除しました。');
      // ページをリロードしてplanを再取得
      window.location.reload();
    } catch (error) {
      console.error('ロゴ削除エラー:', error);
      alert(`ロゴの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [plan?.id, db]);

  // ロゴサイズを保存
  const handleSaveLogoSize = useCallback(async (size: number) => {
    if (!auth?.currentUser || !db || !planId) return;
    
    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTION_NAME, planId), {
        keyVisualLogoSize: size,
        updatedAt: serverTimestamp(),
      });
      setLogoSize(size);
      // planを再読み込みして最新のデータを取得
      if (reloadPlan) {
        await reloadPlan();
      }
    } catch (error) {
      console.error('ロゴサイズの保存エラー:', error);
      }
  }, [auth?.currentUser, db, planId, reloadPlan]);

  // タイトル設定を保存
  const handleSaveTitleSettings = useCallback(async (x: number, y: number, fontSize: number, borderEnabled: boolean) => {
    if (!auth?.currentUser || !db || !planId) return;
    
    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTION_NAME, planId), {
        titlePositionX: x,
        titlePositionY: y,
        titleFontSize: fontSize,
        titleBorderEnabled: borderEnabled,
        updatedAt: serverTimestamp(),
      });
      setTitlePositionX(x);
      setTitlePositionY(y);
      setTitleFontSize(fontSize);
      setTitleBorderEnabled(borderEnabled);
      // planを再読み込みして最新のデータを取得
      if (reloadPlan) {
        await reloadPlan();
      }
    } catch (error) {
      console.error('タイトル設定の保存エラー:', error);
    }
  }, [auth?.currentUser, db, planId, reloadPlan]);

  // フッターテキストを保存
  const handleSaveFooterText = useCallback(async (text: string) => {
    if (!auth?.currentUser || !db || !planId) return;
    
    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTION_NAME, planId), {
        footerText: text,
        updatedAt: serverTimestamp(),
      });
      setFooterText(text);
      // planを再読み込みして最新のデータを取得
      if (reloadPlan) {
        await reloadPlan();
      }
    } catch (error) {
      console.error('フッターテキストの保存エラー:', error);
    }
  }, [auth?.currentUser, db, planId, reloadPlan]);

  // すべてのフィールドが空かどうかをチェック
  const isEmpty = !plan || (
    !plan.description &&
    !plan.objectives &&
    !plan.targetMarket &&
    !plan.competitiveAdvantage &&
    !plan.keyVisualUrl
  );

  // コンポーネント化されたページを使用するかチェック
  // pagesBySubMenuが存在する場合はComponentizedCompanyPlanOverviewを使用
  if (plan?.pagesBySubMenu) {
    return <ComponentizedCompanyPlanOverview />;
  }

  // スケールに基づいてコンテナの高さを計算（縦横比を維持）
  const displayAspectRatio = originalAspectRatio || 16 / 9;
  const calculatedHeight = keyVisualHeight * (keyVisualScale / 100);
  const keyVisualUrl = plan?.keyVisualUrl || '';
  const keyVisualMetadata = plan?.keyVisualMetadata || null;

  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        概要・コンセプト
      </p>
      
      {/* キービジュアル表示 */}
      {(
        <div className="card" style={{ marginBottom: '24px' }}>
      <div 
        data-page-container="0"
        style={{
          marginBottom: '24px', 
          position: 'relative',
          ...(showContainers ? {
            border: '4px dashed #000000',
            borderRadius: '8px',
                padding: '16px',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            backgroundColor: 'transparent',
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
          } : {}),
        }}
      >
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingBottom: `${calculatedHeight}%`,
                backgroundColor: keyVisualUrl ? 'transparent' : '#f0f0f0',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-light)',
                fontSize: '14px',
              }}
            >
              {keyVisualUrl ? (
                <>
            <img
                    ref={imgRef}
                    src={keyVisualUrl}
                    alt="Key Visual"
              style={{
                position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) scale(${keyVisualScale / 100})`,
                      width: `${100 / displayAspectRatio}%`,
                height: '100%',
                objectFit: 'contain',
                      maxWidth: 'none',
                      maxHeight: 'none',
              }}
            />
                  {/* タイトル、署名、作成日を表示 */}
                  {keyVisualMetadata && (keyVisualMetadata.title || keyVisualMetadata.signature || keyVisualMetadata.date) && (
              <div
                style={{
                  position: 'absolute',
                  // プレビューと同じ計算方法：16:9横長（254mm x 143mm）を基準にパーセンテージで位置を計算
                  // キービジュアルの実際のサイズに合わせてスケール
                  right: keyVisualMetadata.position.align === 'right' 
                    ? `${((254 - keyVisualMetadata.position.x) / 254) * 100}%`
                    : 'auto',
                  left: keyVisualMetadata.position.align === 'left'
                    ? `${(keyVisualMetadata.position.x / 254) * 100}%`
                    : keyVisualMetadata.position.align === 'center'
                    ? '50%'
                    : 'auto',
                  bottom: `${((143 - keyVisualMetadata.position.y) / 143) * 100}%`,
                  transform: keyVisualMetadata.position.align === 'center' 
                    ? 'translateX(-50%)' 
                    : keyVisualMetadata.position.align === 'right'
                    ? 'none'
                    : 'none',
                  color: '#666',
                  textAlign: keyVisualMetadata.position.align,
                  lineHeight: '1.5',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                      {keyVisualMetadata.title && (
                        <div style={{ 
                          fontSize: `${(keyVisualMetadata.titleFontSize || 14) * 1.33}px`,
                          marginBottom: `${(keyVisualMetadata.titleFontSize || 14) * 0.7 * 1.33}px`
                        }}>
                          {keyVisualMetadata.title}
                </div>
                      )}
                      {keyVisualMetadata.signature && (
                        <div style={{ 
                          fontSize: `${(keyVisualMetadata.signatureFontSize || 6) * 1.33}px`,
                          marginBottom: `${(keyVisualMetadata.signatureFontSize || 6) * 0.7 * 1.33}px`
                        }}>
                          {keyVisualMetadata.signature}
                        </div>
                      )}
                      {keyVisualMetadata.date && (
                        <div style={{ fontSize: `${(keyVisualMetadata.dateFontSize || 6) * 1.33}px` }}>
                          {keyVisualMetadata.date}
                        </div>
                      )}
                    </div>
                  )}
                  {/* ロゴを表示 */}
                  {plan?.keyVisualLogoUrl && (
                    <img
                      src={plan.keyVisualLogoUrl}
                      alt="Logo"
                  style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        maxWidth: '120px',
                        maxHeight: '60px',
                        objectFit: 'contain',
                        zIndex: 10,
                  }}
                />
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ marginBottom: '16px' }}>キービジュアルが設定されていません</p>
                  <button
                    onClick={handleImageChange}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    キービジュアルを設定
                  </button>
              </div>
            )}
            </div>
            
            {/* コントロールボタン */}
            {keyVisualUrl && auth?.currentUser && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSizeControl(!showSizeControl)}
                style={{
                    padding: '6px 12px',
                    backgroundColor: showSizeControl ? 'var(--color-primary)' : '#f3f4f6',
                    color: showSizeControl ? '#fff' : 'var(--color-text)',
                    border: '1px solid var(--color-border-color)',
                    borderRadius: '4px',
                  cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  サイズ調整
              </button>
              <button
                  onClick={() => setShowMetadataEditor(true)}
                style={{
                    padding: '6px 12px',
                    backgroundColor: '#f3f4f6',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border-color)',
                    borderRadius: '4px',
                  cursor: 'pointer',
                    fontSize: '12px',
                }}
                >
                  メタデータ編集
              </button>
            <button
                  onClick={handleImageChange}
              style={{
                    padding: '6px 12px',
                    backgroundColor: '#f3f4f6',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border-color)',
                    borderRadius: '4px',
                cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  画像変更
              </button>
              <button
                  onClick={() => setShowLogoEditor(true)}
                style={{
                    padding: '6px 12px',
                    backgroundColor: '#f3f4f6',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border-color)',
                    borderRadius: '4px',
                  cursor: 'pointer',
                    fontSize: '12px',
                }}
                >
                  ロゴ設定
              </button>
              <button
                  onClick={() => setShowTitleEditor(true)}
                style={{
                    padding: '6px 12px',
                    backgroundColor: '#f3f4f6',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border-color)',
                    borderRadius: '4px',
                  cursor: 'pointer',
                    fontSize: '12px',
                }}
                >
                  タイトル設定
              </button>
            </div>
        )}

            {/* サイズ調整コントロール */}
            {showSizeControl && keyVisualUrl && (
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>
                    高さ: {keyVisualHeight.toFixed(2)}%
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="0.1"
                    value={keyVisualHeight}
                    onChange={(e) => {
                      const newHeight = parseFloat(e.target.value);
                      setKeyVisualHeight(newHeight);
                      handleSaveKeyVisualHeight(newHeight);
                    }}
                    style={{ width: '100%' }}
                  />
          </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>
                    スケール: {keyVisualScale}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="1"
                    value={keyVisualScale}
                    onChange={(e) => {
                      const newScale = parseInt(e.target.value);
                      setKeyVisualScale(newScale);
                      handleSaveKeyVisualScale(newScale);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}

            {/* メタデータエディタ */}
            {showMetadataEditor && keyVisualUrl && (
              <div style={{ marginTop: '16px' }}>
                <KeyVisualPDFMetadataEditor
                  isOpen={showMetadataEditor}
                  onClose={() => setShowMetadataEditor(false)}
                  onSave={handleMetadataSave}
                  initialMetadata={keyVisualMetadata || undefined}
                  pageWidth={254} // 16:9横長の幅（mm）
                  pageHeight={143} // 16:9横長の高さ（mm）
                />
              </div>
            )}

            {/* ロゴエディタ */}
            {showLogoEditor && (
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>ロゴ設定</h4>
                  {plan?.keyVisualLogoUrl && (
                    <div style={{ marginBottom: '12px' }}>
                      <img
                        src={plan.keyVisualLogoUrl}
                        alt="現在のロゴ"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '100px',
                          objectFit: 'contain',
                          border: '1px solid var(--color-border-color)',
                          borderRadius: '4px',
                          padding: '8px',
                          backgroundColor: '#fff',
                        }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'var(--color-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: logoUploading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        opacity: logoUploading ? 0.6 : 1,
                      }}
                    >
                      {logoUploading ? 'アップロード中...' : 'ロゴを選択'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileSelect}
                        disabled={logoUploading}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {plan?.keyVisualLogoUrl && (
            <button
                        onClick={handleLogoDelete}
                        disabled={logoUploading}
              style={{
                          padding: '8px 16px',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                border: 'none',
                          borderRadius: '4px',
                          cursor: logoUploading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          opacity: logoUploading ? 0.6 : 1,
                        }}
                      >
                        ロゴを削除
                      </button>
                    )}
                    <button
                      onClick={() => setShowLogoEditor(false)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f3f4f6',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-border-color)',
                        borderRadius: '4px',
                cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
              }}
            >
                      閉じる
            </button>
                  </div>
                  {plan?.keyVisualLogoUrl && (
                    <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>
                        PDF表示サイズ（高さ）: {logoSize.toFixed(1)}mm
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        step="0.5"
                        value={logoSize}
                        onChange={(e) => {
                          const newSize = parseFloat(e.target.value);
                          setLogoSize(newSize);
                          handleSaveLogoSize(newSize);
                        }}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
                        <span>5mm</span>
                        <span>30mm</span>
                      </div>
          </div>
        )}
                  <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-light)' }}>
                    PDF出力時に各ページの右上にロゴが表示されます。
                  </p>
      </div>
              </div>
            )}

            {/* タイトルエディタ */}
            {showTitleEditor && (
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>タイトル設定</h4>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>
                      X位置（左からの距離）: {titlePositionX.toFixed(1)}mm
                    </label>
                    <input
                      type="range"
                      min="-10"
                      max="100"
                      step="0.5"
                      value={titlePositionX}
                      onChange={(e) => {
                        const newX = parseFloat(e.target.value);
                        setTitlePositionX(newX);
                        handleSaveTitleSettings(newX, titlePositionY, titleFontSize, titleBorderEnabled);
                      }}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
                      <span>-10mm</span>
                      <span>100mm</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>
                      Y位置（上からの距離）: {titlePositionY.toFixed(1)}mm
                    </label>
                    <input
                      type="range"
                      min="-20"
                      max="50"
                      step="0.5"
                      value={titlePositionY}
                      onChange={(e) => {
                        const newY = parseFloat(e.target.value);
                        setTitlePositionY(newY);
                        handleSaveTitleSettings(titlePositionX, newY, titleFontSize, titleBorderEnabled);
                      }}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
                      <span>-20mm</span>
                      <span>50mm</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>
                      フォントサイズ: {titleFontSize}px
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="24"
                      step="1"
                      value={titleFontSize}
                      onChange={(e) => {
                        const newFontSize = parseInt(e.target.value);
                        setTitleFontSize(newFontSize);
                        handleSaveTitleSettings(titlePositionX, titlePositionY, newFontSize, titleBorderEnabled);
                      }}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
                      <span>8px</span>
                      <span>24px</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={titleBorderEnabled}
                        onChange={(e) => {
                          const newBorderEnabled = e.target.checked;
                          setTitleBorderEnabled(newBorderEnabled);
                          handleSaveTitleSettings(titlePositionX, titlePositionY, titleFontSize, newBorderEnabled);
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      ボーダー（縦棒）を表示
                    </label>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 600 }}>
                      フッターテキスト（ページ下部）
                    </label>
                    <input
                      type="text"
                      value={footerText}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setFooterText(newText);
                      }}
                      onBlur={() => {
                        handleSaveFooterText(footerText);
                      }}
                      placeholder="AI assistant company, Inc - All Rights Reserved"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--color-border-color)',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                      }}
                    />
                    <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-text-light)' }}>
                      PDF出力時に各ページの下部中央に表示されます。
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTitleEditor(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f3f4f6',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border-color)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    閉じる
            </button>
                  <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-light)' }}>
                    PDF出力時に各ページの左上にタイトルが表示されます。
                  </p>
                </div>
          </div>
        )}
      </div>
        </div>
      )}

      <div className="card">
        {isEmpty ? (
          <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
            概要・コンセプトの内容はここに表示されます。
          </p>
        ) : (
          // その他のplanIdの場合は、planのデータを表示
          <>
            {plan?.description && (
            <div
              data-page-container="1"
              style={{
                  marginBottom: '24px',
                ...(showContainers ? {
                  border: '4px dashed #000000',
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  backgroundColor: 'transparent',
                  position: 'relative',
                  zIndex: 1,
                  } : {}),
              }}
            >
                <p style={{ margin: 0, marginBottom: '8px', fontSize: '14px', color: 'var(--color-text-light)' }}>
                  概要
                </p>
                <div className="card">
                  <p>{plan.description}</p>
              </div>
                </div>
            )}
            {plan?.objectives && (
        <div 
          data-page-container="2"
                      style={{
            marginBottom: '24px',
            ...(showContainers ? {
                    border: '4px dashed #000000',
                    boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              padding: '16px',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
                        backgroundColor: 'transparent',
              position: 'relative',
              zIndex: 1,
            } : {}),
          }}
        >
                <p style={{ margin: 0, marginBottom: '8px', fontSize: '14px', color: 'var(--color-text-light)' }}>
                  目的・目標
                </p>
                <div className="card">
                  <p>{plan.objectives}</p>
                </div>
              </div>
            )}
            {plan?.targetMarket && (
        <div 
              data-page-container="3"
          style={{
            marginBottom: '24px',
            ...(showContainers ? {
                  border: '4px dashed #000000',
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              padding: '16px',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
              backgroundColor: 'transparent',
              position: 'relative',
              zIndex: 1,
            } : {}),
          }}
        >
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                  ターゲット市場
              </h3>
                <div style={{ color: 'var(--color-text)', lineHeight: '1.8', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                  {plan.targetMarket}
                  </div>
                    </div>
            )}
            {plan?.competitiveAdvantage && (
            <div 
              data-page-container="4"
              style={{
                marginBottom: '24px',
                ...(showContainers ? {
                  border: '4px dashed #000000',
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  backgroundColor: 'transparent',
                  position: 'relative',
                  zIndex: 1,
                } : {}),
              }}
            >
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                  競争優位性
              </h3>
                <div style={{ color: 'var(--color-text)', lineHeight: '1.8', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                  {plan.competitiveAdvantage}
                    </div>
                  </div>
            )}
          </>
        )}

        {/* 固定ページ形式のコンテナセクション（page.tsxで直接編集） */}
        {!isComponentized && planId === '5fMIys3S9yCQNCtEpIDH' && (
          <>
            {/* コンテナ1: Marmaid図 */}
            <div 
              data-page-container="1"
              style={{
                marginBottom: '24px',
                position: 'relative',
                ...(showContainers ? {
                  border: '4px dashed #000000',
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  backgroundColor: 'transparent',
                } : {}),
              }}
            >
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 
                  data-pdf-title-h3="true"
                    style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: 'var(--color-text)',
                    borderLeft: '3px solid var(--color-primary)',
                    paddingLeft: '8px',
                    margin: 0,
                    flex: 1,
                  }}>
                  Marmaid図
              </h3>
                <span 
                  className="container-page-number"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-text-light)',
                    marginLeft: '16px',
                  }}>
                  1
                </span>
                </div>
              <MermaidContent content={mermaidDiagramContent} />
            </div>

            {/* コンテナ2: 1. AIファーストカンパニーとは */}
            <div 
              data-page-container="2"
              style={{
                marginBottom: '24px',
                position: 'relative',
                ...(showContainers ? {
                  border: '4px dashed #000000',
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  backgroundColor: 'transparent',
                } : {}),
              }}
            >
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 
                  data-pdf-title-h3="true"
                  style={{
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: 'var(--color-text)',
                    borderLeft: '3px solid var(--color-primary)',
                    paddingLeft: '8px',
                    margin: 0,
                    flex: 1,
                  }}>
                  1. AIファーストカンパニーとは
                </h3>
                <span 
                  className="container-page-number"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-text-light)',
                    marginLeft: '16px',
                  }}>
                  2
                </span>
              </div>
              
              <div className="key-message-container" style={{ marginBottom: '24px' }}>
                <h2 className="key-message-title">
                  人と資産から、アルゴリズム（AI）とネットワークへ。
                </h2>
                <p className="key-message-subtitle" style={{ marginBottom: '20px' }}>
                  競争優位は「人と資産」ではなく「アルゴリズム（AI）とネットワーク」によって決まる時代へ
                </p>
                <p className="body-text-emphasis">
                  AIファーストカンパニーとは、この変化を最も早く、最も深く実装した組織である。
                </p>
                <p className="body-text-small">
                  中核となるのが「AIファクトリー」であり、データ → アルゴリズム → サービス → 利用 → データという自己強化ループを回し続ける仕組みである。
                </p>
              </div>
              
              {/* 自己強化の循環系 */}
              <div style={{ marginTop: '24px', marginBottom: '32px', paddingLeft: '11px' }}>
                <div style={{ 
                      width: '100%',
                  maxWidth: '950px',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '40px',
                  alignItems: 'flex-start',
                }}>
                  {/* 左側：キャッチコピー */}
                  <div style={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '30px', alignSelf: 'flex-start' }}>
                  <p style={{ 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: 'var(--color-text)', 
                      lineHeight: '1.7',
                      fontStyle: 'italic',
                      borderLeft: '2px solid var(--color-primary)',
                      paddingLeft: '14px',
                      marginLeft: '0',
                      marginBottom: '10px'
                    }}>
                      This is not digital transformation.<br />
                      This is an evolution of business itself.
                    </p>
                    <p style={{ 
                      fontSize: '12px', 
                      fontWeight: 400, 
                      color: 'var(--color-text-light)', 
                      lineHeight: '1.7',
                      paddingLeft: '14px',
                      marginLeft: '0',
                      fontStyle: 'normal',
                      marginTop: '0'
                    }}>
                      これはデジタル変革ではない。<br />
                      これはビジネスそのものの進化である。
                    </p>
                  </div>

                  {/* 右側：図と説明 */}
                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '0' }}>
                    <div style={{ 
                      width: '100%', 
                      maxWidth: '500px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative',
                    }}>
                      <div ref={cycleDiagramRef} style={{ width: '100%', maxWidth: '400px' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                      <p style={{ 
                        fontSize: '13px', 
                        color: 'var(--color-text)', 
                        margin: 0,
                        fontWeight: 500,
                        textAlign: 'center',
                        letterSpacing: '0.5px'
                      }}>
                        AI-driven Self-reinforcing Business Loop
                      </p>
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--color-text-light)', marginTop: '12px', fontStyle: 'italic', textAlign: 'center' }}>
                      出典: マルコ・イアンシティ; カリム・R・ラカーニ; 吉田素文、AIファースト・カンパニー: アルゴリズムとネットワークが経済を支配する新時代の経営戦略(p.234). 英治出版株式会社.
                    </p>
            </div>
          </div>
            </div>
            </div>

            {/* コンテナ3: 伊藤忠商事の三方良しについて */}
            <div 
              data-page-container="3"
              style={{
                marginBottom: '24px',
                position: 'relative',
                ...(showContainers ? {
                  border: '4px dashed #000000',
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  backgroundColor: 'transparent',
                } : {}),
              }}
            >
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 
                  data-pdf-title-h3="true"
                  style={{
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: 'var(--color-text)',
                    borderLeft: '3px solid var(--color-primary)',
                    paddingLeft: '8px',
                    margin: 0,
                    flex: 1,
                  }}>
                  伊藤忠商事の三方良しについて
                </h3>
                <span 
                  className="container-page-number"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-text-light)',
                    marginLeft: '16px',
                  }}>
                  3
                </span>
              </div>
              
              <div className="key-message-container" style={{ marginBottom: '24px' }}>
                <h2 className="key-message-title">
                  売り手よし、買い手よし、世間よし
                </h2>
                <p className="key-message-subtitle" style={{ marginBottom: '20px' }}>
                  創業者・初代伊藤忠兵衛の創業精神を表現した「三方よし」は、持続的な企業価値向上と社会課題の解決を同時に図るSDGsの理念にも通じる普遍的な経営思想として注目されています。
                </p>
                <p className="body-text-emphasis">
                  伊藤忠グループは、グループ企業理念「三方よし（売り手よし、買い手よし、世間よし）」のもと、自社の利益だけではなく、投資家や株主の皆様、取引先、社員をはじめ、周囲の様々なステークホルダーの期待と信頼に応えることで、社会課題の解決に貢献することを目指しています。
                </p>
              </div>

              {/* 三方良しの3つの要素 */}
              <div style={{ marginTop: '32px', marginBottom: '32px' }}>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '24px',
                  marginBottom: '32px',
                }}>
                  {/* 売り手よし */}
                  <div style={{
                    padding: '24px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      marginBottom: '12px',
                    }}>
                      売り手よし
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      取引において売り手が適正な利益を得られること。持続可能な事業運営の基盤となる。
                    </p>
                  </div>

                  {/* 買い手よし */}
                  <div style={{
                    padding: '24px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      marginBottom: '12px',
                    }}>
                      買い手よし
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      買い手が適正な価格で良質な商品・サービスを得られること。顧客満足の実現。
                    </p>
                  </div>

                  {/* 世間よし */}
                  <div style={{
                    padding: '24px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      marginBottom: '12px',
                    }}>
                      世間よし
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      社会全体に貢献し、ステークホルダー全体の利益を考慮すること。社会課題の解決。
                    </p>
                  </div>
                </div>

                {/* 三方良しの循環とSDGsとの関連 */}
                <div style={{
                  marginTop: '32px',
                  padding: '24px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  borderLeft: '4px solid var(--color-primary)',
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: '12px',
                  }}>
                    三方よしの精神は過去から現在、そして未来へと受け継がれ、広がり続ける
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--color-text)',
                    lineHeight: '1.8',
                    margin: 0,
                  }}>
                    三方よしの精神は、持続的な企業価値向上と社会課題の解決を同時に図るSDGsの理念にも通じる普遍的な経営思想として、ハーバード・ビジネス・スクールの研究対象にも選定され、世界から注目されています。伊藤忠グループは、この理念のもと、すべてのステークホルダーの期待と信頼に応えることで、社会課題の解決に貢献することを目指しています。
                  </p>
                </div>
              </div>
            </div>

            {/* コンテナ4: 三方良しの関係図 */}
            <div 
              data-page-container="4"
              style={{
                marginBottom: '24px',
                position: 'relative',
                ...(showContainers ? {
                  border: '4px dashed #000000',
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  backgroundColor: 'transparent',
                } : {}),
              }}
            >
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 
                  data-pdf-title-h3="true"
                  style={{
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: 'var(--color-text)',
                    borderLeft: '3px solid var(--color-primary)',
                    paddingLeft: '8px',
                    margin: 0,
                    flex: 1,
                  }}>
                  三方良しの関係図
                </h3>
                <span 
                  className="container-page-number"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-text-light)',
                    marginLeft: '16px',
                  }}>
                  4
                </span>
              </div>
              
              <div className="key-message-container" style={{ marginBottom: '24px' }}>
                <h2 className="key-message-title">
                  三方よしの循環が生み出す持続可能な価値創造
                </h2>
                <p className="key-message-subtitle" style={{ marginBottom: '20px' }}>
                  売り手よし、買い手よし、世間よしの3つの要素が相互に強化し合う循環構造が、持続的な企業価値向上と社会課題の解決を同時に実現する
                </p>
                <p className="body-text-emphasis">
                  三方よしの関係図は、単なる取引の原則ではなく、すべてのステークホルダーが相互に利益を得られる循環的な価値創造の仕組みを示しています。
                </p>
                <p className="body-text-small">
                  この循環構造により、企業は短期的な利益追求ではなく、長期的な持続可能性と社会への貢献を両立させることができます。SDGsの理念にも通じるこの経営思想は、ハーバード・ビジネス・スクールの研究対象にも選定され、世界から注目されています。
                </p>
              </div>

              <MermaidContent content={sampoYoshiDiagramContent} />
            </div>

            {/* コンテナ5: Articul8の強み */}
            <div 
              data-page-container="5"
              style={{
                marginBottom: '24px',
                position: 'relative',
                ...(showContainers ? {
                  border: '4px dashed #000000',
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  backgroundColor: 'transparent',
                } : {}),
              }}
            >
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 
                  data-pdf-title-h3="true"
                  style={{
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: 'var(--color-text)',
                    borderLeft: '3px solid var(--color-primary)',
                    paddingLeft: '8px',
                    margin: 0,
                    flex: 1,
                  }}>
                  Articul8の強み
                </h3>
                <span 
                  className="container-page-number"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-text-light)',
                    marginLeft: '16px',
                  }}>
                  5
                </span>
              </div>
              
              <div className="key-message-container" style={{ marginBottom: '24px' }}>
                <h2 className="key-message-title">
                  ドメイン特化型GenAIプラットフォーム：データの混沌から超パーソナライズされたエンタープライズ成果へ
                </h2>
                <p className="key-message-subtitle" style={{ marginBottom: '20px' }}>
                  複雑なエンタープライズミッションを、信頼性とパーソナライズされた成果で自律的に実行する次世代AIプラットフォーム
                </p>
                <p className="body-text-emphasis">
                  Articul8は、単なる出力ではなく、エンタープライズ規模で構築され、規制産業向けに設計され、精度、説明可能性、速度に最適化された信頼できるAI成果を提供します。
                </p>
              </div>

              {/* 4つのコア機能 */}
              <div style={{ marginTop: '32px', marginBottom: '32px' }}>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '20px',
                  marginBottom: '32px',
                }}>
                  {/* Agent of Agents */}
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: '96px',
                      height: '96px',
                      margin: '0 auto 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '50%',
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                      </svg>
                    </div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                    }}>
                      Agent of Agents
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--color-text-light)',
                      lineHeight: '1.6',
                      margin: 0,
                    }}>
                      エージェントとモデル間での自律的でインテリジェントな協働を実現
                    </p>
                  </div>

                  {/* Domain-Specific Models */}
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: '96px',
                      height: '96px',
                      margin: '0 auto 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#e8f5e9',
                      borderRadius: '50%',
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                    </div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                    }}>
                      Domain-Specific Models
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--color-text-light)',
                      lineHeight: '1.6',
                      margin: 0,
                    }}>
                      業界に特化したインテリジェンス。GPT-5を上回る性能を実現
                    </p>
                  </div>

                  {/* Trust Every Decision */}
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: '96px',
                      height: '96px',
                      margin: '0 auto 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fff3e0',
                      borderRadius: '50%',
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <path d="M9 12l2 2 4-4"></path>
                      </svg>
                    </div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                    }}>
                      Trust Every Decision
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--color-text-light)',
                      lineHeight: '1.6',
                      margin: 0,
                    }}>
                      観測可能性、監査可能性、追跡可能性を提供。SOC 2 Type II準拠
                    </p>
                  </div>

                  {/* Hyper-Personalization */}
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: '96px',
                      height: '96px',
                      margin: '0 auto 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f3e5f5',
                      borderRadius: '50%',
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                        <path d="M12 11v6"></path>
                        <path d="M9 14l3-3 3 3"></path>
                      </svg>
                    </div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                    }}>
                      Hyper-Personalization
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--color-text-light)',
                      lineHeight: '1.6',
                      margin: 0,
                    }}>
                      データ取り込みの瞬間からモデル作成が開始。超パーソナライズされたエージェント
                    </p>
                  </div>
                </div>

                {/* プラットフォームの核心技術 */}
                <div style={{
                  marginTop: '32px',
                  padding: '24px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  borderLeft: '4px solid var(--color-primary)',
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: '24px',
                  }}>
                    プラットフォームを支える核心技術
                  </h4>
                  <div style={{
                    display: 'flex',
                    gap: '32px',
                    alignItems: 'flex-start',
                  }}>
                    {/* 左側：画像 */}
                    <div style={{
                      flex: '0 0 300px',
                    }}>
                      <img
                        src="/ChatGPT Image 2025年11月26日 12_15_46.png"
                        alt="AI Assistant"
                        style={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: '8px',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                    {/* 右側：説明 */}
                    <div style={{
                      flex: '1',
                    }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '13px',
                      }}>
                        <thead>
                          <tr>
                            <th style={{
                              padding: '12px',
                              textAlign: 'left',
                              borderBottom: '2px solid var(--color-primary)',
                              fontWeight: 600,
                              color: 'var(--color-text)',
                              fontSize: '14px',
                            }}>
                              技術名
                            </th>
                            <th style={{
                              padding: '12px',
                              textAlign: 'left',
                              borderBottom: '2px solid var(--color-primary)',
                              fontWeight: 600,
                              color: 'var(--color-text)',
                              fontSize: '14px',
                            }}>
                              説明
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{
                              padding: '12px',
                              borderBottom: '1px solid var(--color-border-color)',
                              fontWeight: 600,
                              color: 'var(--color-primary)',
                              verticalAlign: 'top',
                              width: '180px',
                            }}>
                              ModelMesh™
                            </td>
                            <td style={{
                              padding: '12px',
                              borderBottom: '1px solid var(--color-border-color)',
                              color: 'var(--color-text)',
                              lineHeight: '1.7',
                            }}>
                              自律的なエージェント推論エンジン。ベイジアンシステムと専門言語モデルを組み合わせて、出力の正確性を動的に判断し、次のアクションを決定します。
                            </td>
                          </tr>
                          <tr>
                            <td style={{
                              padding: '12px',
                              borderBottom: '1px solid var(--color-border-color)',
                              fontWeight: 600,
                              color: 'var(--color-primary)',
                              verticalAlign: 'top',
                            }}>
                              LLM-IQ™
                            </td>
                            <td style={{
                              padding: '12px',
                              borderBottom: '1px solid var(--color-border-color)',
                              color: 'var(--color-text)',
                              lineHeight: '1.7',
                            }}>
                              モデル評価と動的ルーティング。複雑な産業プロセス全体で一貫性を維持しながら、最適なモデルを選択します。
                            </td>
                          </tr>
                          <tr>
                            <td style={{
                              padding: '12px',
                              borderBottom: '1px solid var(--color-border-color)',
                              fontWeight: 600,
                              color: 'var(--color-text)',
                              verticalAlign: 'top',
                            }}>
                              ドメイン特化モデル
                            </td>
                            <td style={{
                              padding: '12px',
                              borderBottom: '1px solid var(--color-border-color)',
                              color: 'var(--color-text)',
                              lineHeight: '1.7',
                            }}>
                              <p style={{ margin: '0 0 12px 0' }}>
                                Articul8のドメイン特化モデル（DSM）ライブラリは、推論と効率のベンチマークで汎用モデルを上回る専門家レベルのパフォーマンスを提供しています。
                              </p>
                              <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '12px',
                                marginTop: '8px',
                              }}>
                                <tbody>
                                  <tr>
                                    <td style={{
                                      padding: '8px',
                                      borderBottom: '1px solid #e5e7eb',
                                      fontWeight: 600,
                                      color: 'var(--color-primary)',
                                      width: '140px',
                                    }}>
                                      A8-Semicon
                                    </td>
                                    <td style={{
                                      padding: '8px',
                                      borderBottom: '1px solid #e5e7eb',
                                      color: 'var(--color-text)',
                                      lineHeight: '1.6',
                                    }}>
                                      半導体エンジニアリング向けVerilog対応DSM。最新のオープンソースSOTAモデルより2倍の性能向上。
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style={{
                                      padding: '8px',
                                      borderBottom: '1px solid #e5e7eb',
                                      fontWeight: 600,
                                      color: 'var(--color-primary)',
                                    }}>
                                      A8-Energy
                                    </td>
                                    <td style={{
                                      padding: '8px',
                                      borderBottom: '1px solid #e5e7eb',
                                      color: 'var(--color-text)',
                                      lineHeight: '1.6',
                                    }}>
                                      EPRIと共同開発。10,000以上の専門エネルギーデータセットで訓練。96.9%の平均精度を達成。
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style={{
                                      padding: '8px',
                                      borderBottom: '1px solid #e5e7eb',
                                      fontWeight: 600,
                                      color: 'var(--color-primary)',
                                    }}>
                                      A8-SupplyChain
                                    </td>
                                    <td style={{
                                      padding: '8px',
                                      borderBottom: '1px solid #e5e7eb',
                                      color: 'var(--color-text)',
                                      lineHeight: '1.6',
                                    }}>
                                      製造・サプライチェーン運用に最適化。92%の精度で、プロセスシーケンスの推論で3倍の改善。
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style={{
                                      padding: '8px',
                                      borderBottom: 'none',
                                      fontWeight: 600,
                                      color: 'var(--color-primary)',
                                    }}>
                                      A8-Fin
                                    </td>
                                    <td style={{
                                      padding: '8px',
                                      borderBottom: 'none',
                                      color: 'var(--color-text)',
                                      lineHeight: '1.6',
                                    }}>
                                      金融特化DSM。独自ベンチマークで90%以上の精度を達成。最良のオープンソースモデルより3.5倍コスト効率的。
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* マーケットプレイス対応 */}
                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--color-text)',
                    lineHeight: '1.8',
                    margin: 0,
                  }}>
                    <strong>AWS、Microsoft、Google Cloud Platform、Databricks</strong>などの主要マーケットプレイスで利用可能。エンタープライズ環境内で直接デプロイ、統合、スケールが可能です。
                  </p>
                </div>
              </div>
            </div>

            {/* コンテナ6: AIAgentの機能分類 */}
            <div 
              data-page-container="6"
              style={{
                marginBottom: '24px',
                position: 'relative',
                ...(showContainers ? {
                  border: '4px dashed #000000',
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  backgroundColor: 'transparent',
                } : {}),
              }}
            >
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 
                  data-pdf-title-h3="true"
                  style={{
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: 'var(--color-text)',
                    borderLeft: '3px solid var(--color-primary)',
                    paddingLeft: '8px',
                    margin: 0,
                    flex: 1,
                  }}>
                  AIAgentの機能分類
                </h3>
                <span 
                  className="container-page-number"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-text-light)',
                    marginLeft: '16px',
                  }}>
                  6
                </span>
              </div>
              
              <div className="key-message-container" style={{ marginBottom: '24px' }}>
                <h2 className="key-message-title">
                  AIAgentの機能分類と役割
                </h2>
                <p className="key-message-subtitle" style={{ marginBottom: '20px' }}>
                  AIAgentは、その機能と役割に応じて複数のカテゴリに分類され、それぞれが異なる目的と能力を持っています
                </p>
                <p className="body-text-emphasis">
                  AIAgentの機能分類を理解することで、適切なエージェントを選択し、効果的なAIシステムを構築できます。
                </p>
              </div>

              {/* 機能分類の詳細 */}
              <div style={{ marginTop: '32px', marginBottom: '32px' }}>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '20px',
                  marginBottom: '32px',
                }}>
                  {/* 分類1: タスク実行型エージェント */}
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: '96px',
                      height: '96px',
                      margin: '0 auto 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '50%',
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                    }}>
                      タスク実行型エージェント
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--color-text-light)',
                      lineHeight: '1.6',
                      margin: 0,
                    }}>
                      特定のタスクを実行するために設計されたエージェント。単一の目的に特化し、効率的に作業を完了します。
                    </p>
                  </div>

                  {/* 分類2: 意思決定型エージェント */}
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: '96px',
                      height: '96px',
                      margin: '0 auto 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#e8f5e9',
                      borderRadius: '50%',
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                    </div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                    }}>
                      意思決定型エージェント
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--color-text-light)',
                      lineHeight: '1.6',
                      margin: 0,
                    }}>
                      複数の選択肢から最適な判断を行うエージェント。データ分析と推論に基づいて意思決定をサポートします。
                    </p>
                  </div>

                  {/* 分類3: 協調型エージェント */}
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: '96px',
                      height: '96px',
                      margin: '0 auto 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fff3e0',
                      borderRadius: '50%',
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                      </svg>
                    </div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                    }}>
                      協調型エージェント
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--color-text-light)',
                      lineHeight: '1.6',
                      margin: 0,
                    }}>
                      他のエージェントやシステムと協調して動作するエージェント。複雑なタスクを複数のエージェントで分担します。
                    </p>
                  </div>

                  {/* 分類4: 学習型エージェント */}
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: '96px',
                      height: '96px',
                      margin: '0 auto 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f3e5f5',
                      borderRadius: '50%',
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        <path d="M15 6l3 3"></path>
                      </svg>
                    </div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                    }}>
                      学習型エージェント
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--color-text-light)',
                      lineHeight: '1.6',
                      margin: 0,
                    }}>
                      経験から学習し、パフォーマンスを継続的に改善するエージェント。機械学習アルゴリズムを活用します。
                    </p>
                  </div>
                </div>

                {/* 機能分類の統合的な説明 */}
                <div style={{
                  marginTop: '32px',
                  padding: '24px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  borderLeft: '4px solid var(--color-primary)',
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: '12px',
                  }}>
                    AIAgentの機能分類の重要性
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--color-text)',
                    lineHeight: '1.8',
                    margin: 0,
                  }}>
                    AIAgentの機能分類を理解することで、ビジネス要件に最適なエージェントを選択し、効果的なAIシステムを構築できます。各分類は相互に排他的ではなく、複数の機能を組み合わせたハイブリッド型エージェントも存在します。Articul8プラットフォームでは、これらの機能分類を統合し、エンタープライズ規模でのAI活用を実現しています。
                  </p>
                </div>
              </div>
            </div>

            {/* コンテナ7: タスク実行型エージェントのシーケンス */}
            <div 
              data-page-container="7"
              style={{
                marginBottom: '24px',
                position: 'relative',
                ...(showContainers ? {
                  border: '4px dashed #000000',
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  backgroundColor: 'transparent',
                } : {}),
              }}
            >
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 
                  data-pdf-title-h3="true"
                  style={{
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: 'var(--color-text)',
                    borderLeft: '3px solid var(--color-primary)',
                    paddingLeft: '8px',
                    margin: 0,
                    flex: 1,
                  }}>
                  タスク実行型エージェントの実行フロー
                </h3>
                <span 
                  className="container-page-number"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-text-light)',
                    marginLeft: '16px',
                  }}>
                  7
                </span>
              </div>
              
              <div className="key-message-container" style={{ marginBottom: '24px' }}>
                <h2 className="key-message-title">
                  効率的なタスク実行を実現するシーケンス設計
                </h2>
                <p className="key-message-subtitle" style={{ marginBottom: '20px' }}>
                  タスク実行型エージェントは、受信から完了まで一貫したプロセスでタスクを処理し、確実な実行と検証を実現します
                </p>
                <p className="body-text-emphasis">
                  シーケンス図は、ユーザーからのタスクリクエストから完了通知までの全プロセスを可視化し、各コンポーネント間の相互作用を明確に示します。
                </p>
                <p className="body-text-small">
                  タスク実行型エージェントは、タスクの受信、解析、計画作成、実行、検証、報告という6つの主要ステップを通じて、効率的かつ信頼性の高いタスク処理を実現します。
                </p>
              </div>

              {/* シーケンス図 */}
              <div style={{ marginTop: '32px', marginBottom: '32px' }}>
                <MermaidContent content={taskExecutionSequenceContent} />
              </div>

              {/* 各ステップの詳細説明 */}
              <div style={{ marginTop: '32px', marginBottom: '32px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginBottom: '20px',
                  borderLeft: '3px solid var(--color-primary)',
                  paddingLeft: '8px',
                }}>
                  シーケンスの各ステップ
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                  marginBottom: '24px',
                }}>
                  {/* ステップ1: タスク受信・解析 */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                  }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      marginBottom: '8px',
                    }}>
                      1. タスク受信・解析
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      ユーザーからのタスクリクエストを受信し、タスクの要件を解析して理解します。タスクの種類、優先度、必要なリソースを特定します。
                    </p>
                  </div>

                  {/* ステップ2: 実行計画作成 */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                  }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      marginBottom: '8px',
                    }}>
                      2. 実行計画作成
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      タスクの要件に基づいて、最適な実行計画を作成します。実行順序、必要なリソース、予想される実行時間を計画します。
                    </p>
                  </div>

                  {/* ステップ3: タスク実行 */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                  }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      marginBottom: '8px',
                    }}>
                      3. タスク実行
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      実行エンジンが計画に従ってタスクを実行します。実行中は進捗状況を監視し、必要に応じて調整を行います。
                    </p>
                  </div>

                  {/* ステップ4: 結果検証 */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                  }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      marginBottom: '8px',
                    }}>
                      4. 結果検証
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      実行結果を検証モジュールで検証し、期待される結果と一致するか確認します。問題があれば再実行や修正を行います。
                    </p>
                  </div>
                </div>

                {/* 完了報告の説明 */}
                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  borderLeft: '4px solid var(--color-primary)',
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: '12px',
                  }}>
                    5. 完了報告と通知
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--color-text)',
                    lineHeight: '1.8',
                    margin: 0,
                  }}>
                    検証が完了したら、エージェントは結果を評価・処理し、システムを通じてユーザーにタスク完了を通知します。実行結果の詳細やログも提供され、透明性と追跡可能性が確保されます。
                  </p>
                </div>
              </div>

              {/* シーケンスの利点 */}
              <div style={{
                marginTop: '32px',
                padding: '24px',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                borderLeft: '4px solid var(--color-primary)',
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginBottom: '12px',
                }}>
                  シーケンス設計の利点
                </h4>
                <ul style={{
                  fontSize: '14px',
                  color: 'var(--color-text)',
                  lineHeight: '1.8',
                  margin: 0,
                  paddingLeft: '20px',
                }}>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>明確な責任分離:</strong> 各コンポーネントが明確な役割を持ち、システム全体の保守性が向上します
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>エラーハンドリング:</strong> 各ステップで検証を行うことで、早期に問題を発見し、適切に対処できます
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>スケーラビリティ:</strong> モジュール化された設計により、個別のコンポーネントを拡張・最適化できます
                  </li>
                  <li>
                    <strong>トレーサビリティ:</strong> 各ステップのログを記録することで、実行プロセスの完全な追跡が可能です
                  </li>
                </ul>
              </div>
            </div>

            {/* コンテナ8: タスク実行型エージェントの環境構築アーキテクチャ */}
            <div 
              data-page-container="8"
              style={{
                marginBottom: '24px',
                position: 'relative',
                ...(showContainers ? {
                  border: '4px dashed #000000',
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  backgroundColor: 'transparent',
                } : {}),
              }}
            >
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 
                  data-pdf-title-h3="true"
                  style={{
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: 'var(--color-text)',
                    borderLeft: '3px solid var(--color-primary)',
                    paddingLeft: '8px',
                    margin: 0,
                    flex: 1,
                  }}>
                  タスク実行型エージェントの環境構築アーキテクチャ
                </h3>
                <span 
                  className="container-page-number"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-text-light)',
                    marginLeft: '16px',
                  }}>
                  8
                </span>
              </div>
              
              <div className="key-message-container" style={{ marginBottom: '24px' }}>
                <h2 className="key-message-title">
                  スケーラブルで信頼性の高いエンタープライズ環境構築
                </h2>
                <p className="key-message-subtitle" style={{ marginBottom: '20px' }}>
                  タスク実行型エージェントを実装するための包括的なアーキテクチャ設計。クラウドネイティブな設計により、高い可用性、スケーラビリティ、セキュリティを実現します
                </p>
                <p className="body-text-emphasis">
                  このアーキテクチャは、マイクロサービス、コンテナオーケストレーション、イベント駆動アーキテクチャのベストプラクティスを組み合わせて設計されています。
                </p>
                <p className="body-text-small">
                  各レイヤーは独立してスケール可能で、障害に強く、モニタリングとロギングにより完全な可観測性を提供します。
                </p>
              </div>

              {/* アーキテクチャ図 */}
              <div style={{ marginTop: '32px', marginBottom: '32px' }}>
                <MermaidContent content={taskExecutionArchitectureContent} />
              </div>

              {/* アーキテクチャレイヤーの説明 */}
              <div style={{ marginTop: '32px', marginBottom: '32px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginBottom: '20px',
                  borderLeft: '3px solid var(--color-primary)',
                  paddingLeft: '8px',
                }}>
                  アーキテクチャレイヤーの詳細
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                  marginBottom: '24px',
                }}>
                  {/* クライアント層 */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                  }}>
                    <h5 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      marginBottom: '8px',
                    }}>
                      クライアント層
                    </h5>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      Webアプリケーション、モバイルアプリ、REST API/GraphQLエンドポイントから構成されます。マルチプラットフォーム対応により、様々なデバイスからアクセス可能です。
                    </p>
                  </div>

                  {/* API Gateway層 */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                  }}>
                    <h5 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      marginBottom: '8px',
                    }}>
                      API Gateway層
                    </h5>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      認証・認可、ルーティング、レート制限、SSL終端を担当します。単一のエントリーポイントとして、セキュリティとパフォーマンスを最適化します。
                    </p>
                  </div>

                  {/* アプリケーション層 */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                  }}>
                    <h5 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      marginBottom: '8px',
                    }}>
                      アプリケーション層
                    </h5>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      エージェントコア、タスクキュー、実行エンジン、検証モジュールで構成されるコア機能と、オーケストレーター・スケジューラーによるワークフロー管理を提供します。
                    </p>
                  </div>

                  {/* データ層 */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                  }}>
                    <h5 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      marginBottom: '8px',
                    }}>
                      データ層
                    </h5>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      PostgreSQL（メタデータ）、Redis（キャッシュ）、MongoDB（ログ）、Object Storage（ファイル）により、用途に応じた最適なデータストレージを提供します。
                    </p>
                  </div>

                  {/* AI/ML層 */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                  }}>
                    <h5 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      marginBottom: '8px',
                    }}>
                      AI/ML層
                    </h5>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      LLMサービス、埋め込みサービス、ドメイン特化モデルレジストリにより、高度なAI機能を提供します。Articul8のドメイン特化モデルを活用します。
                    </p>
                  </div>

                  {/* モニタリング・ロギング */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                  }}>
                    <h5 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      marginBottom: '8px',
                    }}>
                      モニタリング・ロギング
                    </h5>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      Prometheus、Grafana、ELK Stackにより、メトリクス収集、可視化、ログ分析を実現します。アラートマネージャーで異常を早期検知します。
                    </p>
                  </div>
                </div>
              </div>

              {/* セキュリティとインフラ */}
              <div style={{ marginTop: '32px', marginBottom: '32px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                  marginBottom: '24px',
                }}>
                  {/* セキュリティ層 */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#fff3e0',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                  }}>
                    <h5 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      marginBottom: '8px',
                    }}>
                      セキュリティ層
                    </h5>
                    <ul style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                      paddingLeft: '20px',
                    }}>
                      <li>OAuth2/JWTによる認証・認可</li>
                      <li>HashiCorp Vaultによるシークレット管理</li>
                      <li>WAFによるDDoS保護とセキュリティフィルタリング</li>
                      <li>エンドツーエンドの暗号化</li>
                    </ul>
                  </div>

                  {/* インフラストラクチャ */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#e0f2f1',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-color)',
                  }}>
                    <h5 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      marginBottom: '8px',
                    }}>
                      インフラストラクチャ
                    </h5>
                    <ul style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                      paddingLeft: '20px',
                    }}>
                      <li>Kubernetesによるコンテナオーケストレーション</li>
                      <li>マルチクラウド対応（AWS/Azure/GCP）</li>
                      <li>CDNによるグローバルコンテンツ配信</li>
                      <li>自動スケーリングと自己修復機能</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* アーキテクチャの利点 */}
              <div style={{
                marginTop: '32px',
                padding: '24px',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                borderLeft: '4px solid var(--color-primary)',
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginBottom: '12px',
                }}>
                  アーキテクチャ設計の利点
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                }}>
                  <div>
                    <h5 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                    }}>
                      スケーラビリティ
                    </h5>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      各コンポーネントが独立してスケール可能。需要に応じて自動的にリソースを調整し、コスト効率を最適化します。
                    </p>
                  </div>
                  <div>
                    <h5 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                    }}>
                      可用性と信頼性
                    </h5>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      冗長性とフェイルオーバー機能により、99.9%以上の可用性を実現。障害発生時も自動的に復旧します。
                    </p>
                  </div>
                  <div>
                    <h5 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                    }}>
                      セキュリティ
                    </h5>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      多層防御アプローチにより、認証、認可、暗号化、監査ログを包括的に実装。SOC 2 Type II準拠をサポートします。
                    </p>
                  </div>
                  <div>
                    <h5 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                    }}>
                      可観測性
                    </h5>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--color-text)',
                      lineHeight: '1.8',
                      margin: 0,
                    }}>
                      メトリクス、ログ、トレースにより、システム全体の動作を可視化。問題の早期発見と迅速な対応を可能にします。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

