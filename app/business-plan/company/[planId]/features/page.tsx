'use client';

import { useEffect, useState, useRef } from 'react';
import Script from 'next/script';
import { FaMobileAlt, FaGraduationCap, FaChartBar, FaLaptopCode } from 'react-icons/fa';

declare global {
  interface Window {
    mermaid?: any;
  }
}

const SERVICE_NAMES: { [key: string]: string } = {
  'own-service': '自社開発・自社サービス事業',
  'education-training': 'AI導入ルール設計・教育プログラム提供',
  'consulting': 'プロセス可視化・業務コンサル事業',
  'ai-dx': 'AI駆動開発・DX支援SI事業',
};

// 各事業企画のターゲット範囲
const SERVICE_SCOPE: { [key: string]: string } = {
  'own-service': 'アプリ提供',
  'ai-dx': 'システム開発・導入まで',
  'consulting': '業務コンサル・プロセス改善まで',
  'education-training': '教育・ルール設計まで',
};

// 各事業企画のターゲット顧客層
const SERVICE_TARGET: { [key: string]: string } = {
  'own-service': '自治体、民間企業、一般利用者',
  'ai-dx': 'システム部門',
  'consulting': '経営層・人事、営業部門、職能部門',
  'education-training': '経営層・人事部門・全社',
};

// ターゲットの階層化
const SERVICE_TARGET_LAYER: { [key: string]: { cLayer?: string; department?: string; user?: string } } = {
  'own-service': {
    cLayer: '自治体・企業経営層',
    user: '一般利用者'
  },
  'ai-dx': {
    department: 'システム部門'
  },
  'consulting': {
    cLayer: '経営層・人事',
    department: '営業部門・職能部門'
  },
  'education-training': {
    cLayer: '経営層・人事部門',
    department: '全社'
  },
};

// 各事業企画のサービス提供の流れ
const SERVICE_FLOW: { [key: string]: string } = {
  'own-service': '自社から直接エンドユーザーへサービス提供',
  'education-training': '自社 → 経営層 → システム部門・営業部門・職能部門 → エンドユーザー',
  'consulting': '自社 → 営業部門・職能部門 → エンドユーザー',
  'ai-dx': '自社 → システム部門 → エンドユーザー',
};

// 各事業企画の差別化要因
const SERVICE_DIFFERENTIATION: { [key: string]: string } = {
  'own-service': 'AIファーストカンパニーによるAIネイティブ設計',
  'education-training': '自社での成功事例が裏付けとなるルール設計や教育コンテンツ',
  'consulting': 'AIネイティブ設計の知見と伊藤忠Gとの連携事業',
  'ai-dx': '自社のAI駆動開発の経験とAIネイティブ設計の知見。伊藤忠Gとの連携事業',
};

// 各事業企画で獲得できる強み
const SERVICE_STRENGTHS: { [key: string]: string[] } = {
  'own-service': [
    '収益基盤の確立',
    '自社の開発経験の蓄積',
    'ドッグフーディング実績',
    'ユーザーデータの蓄積',
    'AI活用ノウハウの獲得'
  ],
  'education-training': [
    '人材育成・ルール設計事業への強み獲得',
    '教育コンテンツの蓄積',
    '企業との信頼関係構築'
  ],
  'consulting': [
    '業務コンサル実績の創出',
    '業務コンサル事業の収益化'
  ],
  'ai-dx': [
    'AI駆動開発実績の創出',
    'AI駆動開発事業の収益化',
    '技術リーダーシップの確立'
  ],
};

// 各事業企画の立ち上げタイミング
const SERVICE_LAUNCH_TIMING: { [key: string]: string } = {
  'own-service': '0 - 1年目',
  'education-training': '1 - 2年目',
  'consulting': '2 - 3年目',
  'ai-dx': '2 - 3年目',
};

const FIXED_CONCEPTS: { [key: string]: Array<{ id: string; name: string; description: string; target: string }> } = {
  'own-service': [
    { id: 'maternity-support', name: '出産支援パーソナルApp', description: '出産前後のママとパパをサポートするパーソナルアプリケーション', target: 'エンドユーザー（ママ・パパ）' },
    { id: 'care-support', name: '介護支援パーソナルApp', description: '介護を必要とする方とその家族をサポートするパーソナルアプリケーション', target: 'エンドユーザー（介護が必要な方・家族）' },
  ],
  'ai-dx': [
    { id: 'medical-dx', name: '医療法人向けDX', description: '助成金を活用したDX：電子カルテなどの導入支援', target: '医療法人 → 患者' },
    { id: 'sme-dx', name: '中小企業向けDX', description: '内部データ管理やHP作成、Invoice制度の対応など', target: '中小企業 → 従業員・顧客' },
  ],
  'consulting': [
    { id: 'sme-process', name: '中小企業向けプロセス可視化', description: '中小企業の業務プロセス可視化、効率化、経営課題の解決支援、助成金活用支援', target: '中小企業 → 従業員' },
    { id: 'medical-care-process', name: '医療・介護向けプロセス可視化', description: '医療・介護施設の業務フロー可視化、記録業務の効率化、コンプライアンス対応支援', target: '医療・介護施設 → 患者・利用者' },
  ],
  'education-training': [
    { id: 'corporate-ai-training', name: '大企業向けAI人材育成・教育', description: '企業内AI人材の育成、AI活用スキル研修、AI導入教育プログラムの提供', target: '大企業 → 従業員' },
    { id: 'ai-governance', name: 'AI導入ルール設計・ガバナンス支援', description: '企業のAI導入におけるルール設計、ガバナンス構築、コンプライアンス対応支援', target: '企業 → 従業員' },
    { id: 'sme-ai-education', name: '中小企業向けAI導入支援・教育', description: '中小企業向けのAI導入支援、実践的なAI教育、導入ルール設計支援、助成金活用支援', target: '中小企業 → 従業員' },
  ],
};

export default function FeaturesPage() {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('own-service'); // 選択中の事業企画
  const initializedRef = useRef(false);
  const renderedRef = useRef(false);

  // コンポーネントがマウントされた際に状態をリセット
  useEffect(() => {
    setSvgContent('');
    setError(null);
    setIsRendering(false);
    renderedRef.current = false;
    
    // Mermaidが既に読み込まれているかチェック
    if (typeof window !== 'undefined' && window.mermaid) {
      setMermaidLoaded(true);
    }
  }, []);

  // 特定の事業企画のMermaidシーケンス図のコードを生成
  const generateMermaidDiagram = (serviceId: string) => {
    const serviceName = SERVICE_NAMES[serviceId];
    const scope = SERVICE_SCOPE[serviceId];
    const target = SERVICE_TARGET[serviceId];
    
    let diagram = 'sequenceDiagram\n';
    
    // 自社開発・自社サービス事業の場合は専用の参加者構成
    if (serviceId === 'own-service') {
      diagram += '    participant 自社 as 株式会社AIアシスタント\n';
      diagram += '    participant 自治体 as 顧客：自治体\n';
      diagram += '    participant 企業 as 顧客：企業\n';
      diagram += '    participant 従業員 as エンドユーザー：従業員\n';
      diagram += '    participant 一般利用者 as エンドユーザー：一般利用者\n\n';
      
      diagram += `    Note over 自社,一般利用者: ${serviceName}<br/>【${scope}】\n`;
      diagram += `    自社->>自治体: ${serviceName}\n`;
      diagram += `    activate 自治体\n`;
      diagram += `    自治体->>一般利用者: アプリ提供\n`;
      diagram += `    deactivate 自治体\n`;
      diagram += `    自社->>企業: ${serviceName}\n`;
      diagram += `    activate 企業\n`;
      diagram += `    企業->>従業員: アプリ提供\n`;
      diagram += `    deactivate 企業\n`;
      diagram += `    自社->>一般利用者: ${serviceName}\n`;
    } else {
      // その他の事業企画は従来の参加者構成
    diagram += '    participant 自社 as 株式会社AIアシスタント\n';
    diagram += '    participant 経営層 as 顧客企業・経営層・人事部門\n';
      diagram += '    participant 業務部門 as 顧客企業・営業部門・職能部門\n';
    diagram += '    participant システム部門 as 顧客企業・システム部門\n';
    diagram += '    participant エンドユーザー as エンドユーザー<br/>(従業員・利用者)\n\n';
    
      if (serviceId === 'ai-dx') {
        // AI駆動開発・DX支援SI事業はシステム部門が主な顧客
        diagram += `    Note over 自社,システム部門: ${serviceName}<br/>【${scope}】<br/>ターゲット: ${target}\n`;
        diagram += `    自社->>システム部門: ${serviceName}\n`;
        diagram += `    activate システム部門\n`;
        diagram += `    システム部門->>エンドユーザー: システム導入・運用\n`;
        diagram += `    システム部門->>業務部門: システム導入・運用\n`;
        diagram += `    システム部門->>経営層: システム導入・運用\n`;
        diagram += `    deactivate システム部門\n`;
      } else if (serviceId === 'consulting') {
        // プロセス可視化・業務コンサル事業は経営層・人事、営業部門、職能部門が主な顧客
        diagram += `    Note over 自社,業務部門: ${serviceName}<br/>【${scope}】<br/>ターゲット: ${target}\n`;
        diagram += `    エンドユーザー->>システム部門: 課題相談・課題共有\n`;
        diagram += `    エンドユーザー->>業務部門: 課題相談・課題共有\n`;
        diagram += `    エンドユーザー->>経営層: 課題相談・課題共有\n`;
        diagram += `    自社->>経営層: ${serviceName}\n`;
        diagram += `    activate 経営層\n`;
        diagram += `    自社->>業務部門: ${serviceName}\n`;
        diagram += `    activate 業務部門\n`;
        diagram += `    自社->>システム部門: ${serviceName}\n`;
        diagram += `    activate システム部門\n`;
        diagram += `    deactivate 業務部門\n`;
        diagram += `    deactivate システム部門\n`;
        diagram += `    deactivate 経営層\n`;
      } else if (serviceId === 'education-training') {
      // AI導入ルール設計・人材育成・教育事業は経営層・全社が主な顧客
      diagram += `    Note over 自社,業務部門: ${serviceName}<br/>【${scope}】<br/>ターゲット: ${target}\n`;
        diagram += `    自社->>経営層: ${serviceName}\n`;
        diagram += `    activate 経営層\n`;
      diagram += `    自社->>業務部門: ${serviceName}\n`;
      diagram += `    activate 業務部門\n`;
      diagram += `    経営層->>業務部門: 教育・研修\n`;
      diagram += `    経営層->>エンドユーザー: 教育・研修\n`;
      diagram += `    業務部門->>エンドユーザー: ルール設計・ガバナンス\n`;
      diagram += `    deactivate 業務部門\n`;
        diagram += `    経営層->>システム部門: ルール設計・ガバナンス\n`;
      diagram += `    activate システム部門\n`;
      diagram += `    システム部門->>エンドユーザー: ルール設計・ガバナンス\n`;
      diagram += `    システム部門->>業務部門: ルール設計・ガバナンス\n`;
      diagram += `    システム部門->>経営層: ルール設計・ガバナンス\n`;
      diagram += `    deactivate システム部門\n`;
        diagram += `    deactivate 経営層\n`;
      }
      }

    return diagram;
  };

  useEffect(() => {
    if (!mermaidLoaded || typeof window === 'undefined' || !window.mermaid || !diagramRef.current) {
      return;
    }

    // 選択された事業企画が変更されたら再レンダリング
    renderedRef.current = false;

    const renderDiagram = async () => {
      setIsRendering(true);
      setSvgContent('');
      setError(null);
      try {
        const mermaid = window.mermaid;
        const diagram = generateMermaidDiagram(selectedServiceId);
        
        // 初期化（一度だけ実行）
        if (!initializedRef.current) {
          mermaid.initialize({ 
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            sequence: {
              diagramMarginX: 20,
              diagramMarginY: 10,
              actorMargin: 30,
              width: 120,
              height: 50,
              boxMargin: 8,
              boxTextMargin: 4,
              noteMargin: 8,
              messageMargin: 25,
              mirrorActors: true,
              bottomMarginAdj: 1,
              useMaxWidth: true,
              rightAngles: false,
              showSequenceNumbers: false,
            },
            fontFamily: 'var(--font-inter), var(--font-noto), sans-serif',
            themeVariables: {
              fontSize: '16px',
              fontFamily: 'var(--font-inter), var(--font-noto), sans-serif',
              primaryTextColor: '#111827',
              primaryBorderColor: '#E5E7EB',
              lineColor: '#6B7280',
              secondaryTextColor: '#6B7280',
              tertiaryColor: '#F9FAFB',
              noteBkgColor: '#FFF4E6',
              noteTextColor: '#111827',
              actorBorder: '#4169E1',
              actorBkg: '#E6F2FF',
              actorTextColor: '#111827',
              actorLineColor: '#4169E1',
              signalColor: '#3B82F6',
              signalTextColor: '#111827',
              labelBoxBkgColor: '#FFFFFF',
              labelBoxBorderColor: '#E5E7EB',
              labelTextColor: '#111827',
              loopTextColor: '#111827',
              activationBorderColor: '#4169E1',
              activationBkgColor: '#E6F2FF',
              sequenceNumberColor: '#111827',
            },
          });
          initializedRef.current = true;
        }

        const id = 'features-diagram-' + Date.now();
        
        if (typeof mermaid.render === 'function') {
          // 最新のAPI: render()を使用
          const result = await mermaid.render(id, diagram);
          const svg = typeof result === 'string' ? result : result.svg;
          setSvgContent(svg);
          renderedRef.current = true;
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
          
          const svg = tempContainer.innerHTML;
          document.body.removeChild(tempContainer);
          setSvgContent(svg);
          renderedRef.current = true;
        }
      } catch (err: any) {
        console.error('Mermaidレンダリングエラー:', err);
        setError('Mermaidのレンダリングに失敗しました: ' + (err.message || '不明なエラー'));
        renderedRef.current = false;
      } finally {
        setIsRendering(false);
      }
    };

    renderDiagram();
  }, [mermaidLoaded, selectedServiceId]);

  // Mermaidの読み込み状態をチェック
  useEffect(() => {
    const checkMermaidLoaded = () => {
      if (typeof window !== 'undefined' && window.mermaid) {
        setMermaidLoaded(true);
      }
    };

    // 既に読み込まれている場合
    checkMermaidLoaded();

    // イベントリスナーを追加
    window.addEventListener('mermaidloaded', checkMermaidLoaded);

    return () => {
      window.removeEventListener('mermaidloaded', checkMermaidLoaded);
    };
  }, []);

  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        提供機能
      </p>
      <div className="card">
        <div style={{ marginBottom: '24px' }}>
          {/* 全体ロードマップ - ステップ図 */}
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
            ロードマップ
          </h3>
          <div style={{ 
            marginBottom: '32px', 
            padding: '24px 20px', 
            backgroundColor: '#F9FAFB', 
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h4 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)', textAlign: 'center' }}>
              成長ロードマップ
            </h4>
            <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '-10px', color: 'var(--color-text-light)', textAlign: 'center', lineHeight: '1.6' }}>
              事業立ち上げからAIファーストカンパニー実現までの4ステップ成長戦略
            </p>
            
            {/* ステップ図コンテナ - 登る階段デザイン */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              justifyContent: 'space-between',
              gap: '16px',
              position: 'relative',
              paddingTop: '0px',
              paddingBottom: '40px',
              minHeight: '550px',
              borderBottom: '2px solid #E5E7EB'
            }}>
              {/* 接続線 - 上向きの階段状パス（グラデーション付き） */}
              <svg 
                style={{
                  position: 'absolute',
                  top: '0px',
                  left: '0',
                  width: '100%',
                  height: '250px',
                  zIndex: 0,
                  pointerEvents: 'none'
                }}
                viewBox="0 0 1000 250"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* グラデーション定義 */}
                  <linearGradient id="stepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="33%" stopColor="#3B82F6" stopOpacity="0.4" />
                    <stop offset="66%" stopColor="#8B5CF6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
                  </linearGradient>
                  {/* 矢印マーカー */}
                  <marker
                    id="stepArrow"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#059669" />
                  </marker>
                </defs>
                {/* 階段の段を描画 - 上向き（グラデーション付き、右向き矢印） */}
                {/* ステップ1: x=50, y=200 | ステップ2: x=250, y=140 | ステップ3: x=500, y=80 | ステップ4: x=750, y=20 */}
                <path
                  d="M 50 200 L 250 200 L 250 140 L 500 140 L 500 80 L 750 80 L 750 20 L 950 20"
                  stroke="url(#stepGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd="url(#stepArrow)"
                />
              </svg>
              
              {/* 成長曲線ライン（下部の右肩上がり、階段の登り幅に合わせる） */}
              <svg 
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  left: '0',
                  width: '100%',
                  height: '250px',
                  zIndex: 0,
                  pointerEvents: 'none'
                }}
                viewBox="0 0 1000 250"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="growthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="33%" stopColor="#3B82F6" stopOpacity="0.4" />
                    <stop offset="66%" stopColor="#8B5CF6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
                  </linearGradient>
                  <marker
                    id="growthArrow"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#059669" />
                  </marker>
                </defs>
                {/* 階段の各ステップ位置を通る成長曲線: ステップ1(50,200) → ステップ2(250,140) → ステップ3(500,80) → ステップ4(750,20) */}
                <path
                  d="M 50 200 Q 150 170, 250 140 Q 375 110, 500 80 Q 625 50, 750 20 L 950 20"
                  stroke="url(#growthGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="5,5"
                  opacity="0.6"
                  markerEnd="url(#growthArrow)"
                />
              </svg>

              {/* ステップ1: 0-1年目 - 自社サービス（一番下） */}
              <div style={{ flex: '1', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0' }}>
                {/* 番号マーカー */}
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #10B981',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
                  position: 'relative',
                  zIndex: 2
                }}>
                  1
                </div>
                {/* カード */}
                <div style={{
                  backgroundColor: '#fff',
                  padding: '24px 20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  marginBottom: '16px',
                  width: '100%',
                  minHeight: '200px',
                  border: '1px solid #F3F4F6',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <h5 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#1F2937' }}>
                    0〜1年目
                  </h5>
                  <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.7', marginBottom: '0', flex: 1 }}>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>自社の技術力とAI活用の基盤</span>を活用し、自社サービス事業を立ち上げ、データ蓄積とユーザー獲得を実現
                  </p>
                </div>
                {/* 色付きバー */}
                <div style={{
                  backgroundColor: '#10B981',
                  color: '#fff',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'center',
                  width: '100%',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                }}>
                  自社サービス
                </div>
                {/* 獲得する強み */}
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  width: '100%'
                }}>
                  <h6 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    獲得する強み
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                    <li>収益基盤の確立</li>
                    <li>自社の開発経験の蓄積</li>
                    <li>ドッグフーディング実績</li>
                  </ul>
                </div>
              </div>

              {/* ステップ2: 1-2年目 - AI導入ルール設計 */}
              <div style={{ flex: '1', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '60px' }}>
                {/* 番号マーカー */}
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #3B82F6',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3B82F6',
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
                  position: 'relative',
                  zIndex: 2
                }}>
                  2
                </div>
                {/* カード */}
                <div style={{
                  backgroundColor: '#fff',
                  padding: '24px 20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  marginBottom: '16px',
                  width: '100%',
                  minHeight: '200px',
                  border: '1px solid #F3F4F6',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <h5 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#1F2937' }}>
                    1〜2年目
                  </h5>
                  <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.7', marginBottom: '0', flex: 1 }}>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>ステップ1で獲得した開発経験とドッグフーディング実績</span>を活用し、AI導入ルール設計と人材育成事業を展開し、自社事例を教材化
                  </p>
                </div>
                {/* 色付きバー */}
                <div style={{
                  backgroundColor: '#3B82F6',
                  color: '#fff',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'center',
                  width: '100%',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                }}>
                  AI導入ルール設計
                </div>
                {/* 獲得する強み */}
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  width: '100%'
                }}>
                  <h6 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    獲得する強み
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                    <li>人材育成・ルール設計事業への強み獲得</li>
                    <li>教育コンテンツの蓄積</li>
                    <li>企業との信頼関係構築</li>
                  </ul>
                </div>
              </div>

              {/* ステップ3: 2-3年目 - 業務可視化 + DX支援SI */}
              <div style={{ flex: '1', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '120px' }}>
                {/* 番号マーカー */}
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #8B5CF6',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8B5CF6',
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)',
                  position: 'relative',
                  zIndex: 2
                }}>
                  3
                </div>
                {/* カード */}
                <div style={{
                  backgroundColor: '#fff',
                  padding: '24px 20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  marginBottom: '16px',
                  width: '100%',
                  minHeight: '200px',
                  border: '1px solid #F3F4F6',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <h5 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#1F2937' }}>
                    2〜3年目
                  </h5>
                  <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.7', marginBottom: '0', flex: 1 }}>
                    <span style={{ color: '#3B82F6', fontWeight: 600 }}>ステップ2で構築した信頼関係と教育コンテンツ</span>を活用し、業務可視化コンサルとDX支援SI事業を展開し、プロダクト化を実現
                  </p>
                </div>
                {/* 色付きバー */}
                <div style={{
                  backgroundColor: '#8B5CF6',
                  color: '#fff',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'center',
                  width: '100%',
                  boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)'
                }}>
                  業務可視化 + DX支援SI
                </div>
                {/* 獲得する強み */}
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  width: '100%'
                }}>
                  <h6 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    獲得する強み
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                    <li>業務コンサル実績の創出</li>
                    <li>業務コンサル事業の収益化</li>
                    <li>データ整備とプロダクト化の実現</li>
                  </ul>
                </div>
              </div>

              {/* ステップ4: 最終目標 - AIファーストカンパニー（一番上） */}
              <div style={{ flex: '1', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '180px' }}>
                {/* 番号マーカー */}
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #059669',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.2)',
                  position: 'relative',
                  zIndex: 2
                }}>
                  4
                </div>
                {/* カード - 最終目標（強調） */}
                <div style={{
                  backgroundColor: '#F0FDF4',
                  padding: '24px 20px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)',
                  marginBottom: '16px',
                  width: '100%',
                  minHeight: '200px',
                  border: '3px solid #059669',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}>
                  <h5 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#1F2937' }}>
                    最終目標
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#059669', marginLeft: '8px', fontStyle: 'italic' }}>
                      Final Goal
                    </span>
                  </h5>
                  <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.7', marginBottom: '0', flex: 1 }}>
                    <span style={{ color: '#8B5CF6', fontWeight: 600 }}>これまでの全ステップで獲得した強み</span>を統合し、全事業を横串で強化し、AIファーストカンパニーとしての地位を確立
                  </p>
                </div>
                {/* 色付きバー */}
                <div style={{
                  backgroundColor: '#059669',
                  color: '#fff',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'center',
                  width: '100%',
                  boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                }}>
                  AIファーストカンパニーへ
                </div>
                {/* 獲得する強み */}
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  width: '100%'
                }}>
                  <h6 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    獲得する強み
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                    <li>AI駆動開発実績の創出</li>
                    <li>AI駆動開発事業の収益化</li>
                    <li>技術リーダーシップの確立</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

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

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
            4つの事業企画
          </h3>
          <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text)', lineHeight: '1.4', textAlign: 'center' }}>
            AIファーストカンパニーで4つの事業を立ち上げ
          </h2>
          <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '20px', color: 'var(--color-text-light)', lineHeight: '1.6', textAlign: 'center', fontStyle: 'normal' }}>
            立ち上げ時期、提供範囲、ターゲット、構想、差別化要因、獲得する強み
          </h3>
        </div>

        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'space-around', flexWrap: 'wrap' }}>
            {/* 1. 自社開発・自社サービス事業 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '250px', maxWidth: '300px' }}>
              <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                backgroundColor: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                position: 'relative'
              }}>
                <div style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <FaMobileAlt size={80} />
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px', lineHeight: '1.4' }}>
                自社開発<br />自社サービス事業
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-light)', marginTop: '4px', marginBottom: '20px' }}>
                サービス開発
              </div>
              
              {/* カード */}
              <div style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                width: '100%',
                border: '1px solid #E5E7EB',
                minHeight: '280px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    提供範囲
                  </h6>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0 }}>
                    {SERVICE_SCOPE['own-service']}
                  </p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    事業構想
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', fontSize: '14px', color: '#374151', lineHeight: '1.8' }}>
                    {(FIXED_CONCEPTS['own-service'] || []).slice(0, 2).map((concept, idx) => (
                      <li key={idx}>{concept.name}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ flex: 1 }}>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    差別化要因
                  </h6>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0, fontWeight: 500 }}>
                    {SERVICE_DIFFERENTIATION['own-service']}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. AI導入ルール設計・人材育成・教育事業 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '250px', maxWidth: '300px' }}>
              <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                backgroundColor: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                position: 'relative'
              }}>
                <div style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <FaGraduationCap size={80} />
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px', lineHeight: '1.4' }}>
                AI導入ルール設計<br />人材育成・教育事業
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-light)', marginTop: '4px', marginBottom: '20px' }}>
                ルール設計
              </div>
              
              {/* カード */}
              <div style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                width: '100%',
                border: '1px solid #E5E7EB',
                minHeight: '280px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    提供範囲
                  </h6>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0 }}>
                    {SERVICE_SCOPE['education-training']}
                  </p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    事業構想
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', fontSize: '14px', color: '#374151', lineHeight: '1.8' }}>
                    {(FIXED_CONCEPTS['education-training'] || []).slice(0, 2).map((concept, idx) => (
                      <li key={idx}>{concept.name}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ flex: 1 }}>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    差別化要因
                  </h6>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0, fontWeight: 500 }}>
                    {SERVICE_DIFFERENTIATION['education-training']}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. プロセス可視化・業務コンサル事業 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '250px', maxWidth: '300px' }}>
              <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                backgroundColor: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                position: 'relative'
              }}>
                <div style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <FaChartBar size={80} />
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px', lineHeight: '1.4' }}>
                プロセス可視化<br />業務コンサル事業
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-light)', marginTop: '4px', marginBottom: '20px' }}>
                可視化
              </div>
              
              {/* カード */}
              <div style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                width: '100%',
                border: '1px solid #E5E7EB',
                minHeight: '280px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    提供範囲
                  </h6>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0 }}>
                    {SERVICE_SCOPE['consulting']}
                  </p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    事業構想
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', fontSize: '14px', color: '#374151', lineHeight: '1.8' }}>
                    {(FIXED_CONCEPTS['consulting'] || []).slice(0, 2).map((concept, idx) => (
                      <li key={idx}>{concept.name}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ flex: 1 }}>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    差別化要因
                  </h6>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0, fontWeight: 500 }}>
                    {SERVICE_DIFFERENTIATION['consulting']}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. AI駆動開発・DX支援SI事業 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '250px', maxWidth: '300px' }}>
              <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                backgroundColor: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                position: 'relative'
              }}>
                <div style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <FaLaptopCode size={80} />
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px', lineHeight: '1.4' }}>
                AI駆動開発<br />DX支援SI事業
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-light)', marginTop: '4px', marginBottom: '20px' }}>
                SI
              </div>
              
              {/* カード */}
              <div style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                width: '100%',
                border: '1px solid #E5E7EB',
                minHeight: '280px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    提供範囲
                  </h6>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0 }}>
                    {SERVICE_SCOPE['ai-dx']}
                  </p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    事業構想
                  </h6>
                  <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc', fontSize: '14px', color: '#374151', lineHeight: '1.8' }}>
                    {(FIXED_CONCEPTS['ai-dx'] || []).slice(0, 2).map((concept, idx) => (
                      <li key={idx}>{concept.name}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ flex: 1 }}>
                  <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    差別化要因
                  </h6>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0, fontWeight: 500 }}>
                    {SERVICE_DIFFERENTIATION['ai-dx']}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
        
        {error && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#fee', 
            color: '#c33', 
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}
        
        {/* 事業企画選択ボタン */}
        <div style={{ marginTop: '20px', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
            サービス提供の流れ
          </h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(SERVICE_NAMES).map(([id, name]) => (
              <button
                key={id}
                onClick={() => setSelectedServiceId(id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedServiceId === id ? 'var(--color-primary)' : '#fff',
                  color: selectedServiceId === id ? '#fff' : 'var(--color-text)',
                  border: `1px solid ${selectedServiceId === id ? 'var(--color-primary)' : 'var(--color-border-color)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: selectedServiceId === id ? 600 : 400,
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (selectedServiceId !== id) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedServiceId !== id) {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        
        <div 
          ref={diagramRef}
          id="features-diagram"
          style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginTop: '20px',
            marginBottom: '20px',
            minHeight: '800px',
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid var(--color-border-color)',
            overflow: 'auto'
          }}
        >
          {svgContent ? (
            <div 
              style={{ 
                width: '100%', 
                maxWidth: '100%',
                display: 'flex', 
                justifyContent: 'center',
                overflow: 'auto'
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }} 
            />
          ) : error ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#c33'
            }}>
              エラー: {error}
            </div>
          ) : (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: 'var(--color-text-light)'
            }}>
              {isRendering ? '図をレンダリング中...' : 'Mermaidライブラリを読み込み中...'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
