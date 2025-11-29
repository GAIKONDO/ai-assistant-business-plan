'use client';

import { useEffect, useState, useRef } from 'react';
import Script from 'next/script';
import { FaMobileAlt, FaGraduationCap, FaChartBar, FaLaptopCode, FaEye } from 'react-icons/fa';

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

// 資本構成フローダイアグラムコンポーネント（SVG版）
function CapitalFlowDiagram() {
  return (
    <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto' }}>
      <svg width="100%" height="500" viewBox="0 0 700 500" style={{ maxWidth: '700px' }}>
        <defs>
          <marker id="arrowhead-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <polygon points="0 0, 10 3, 0 6" fill="#3B82F6" />
          </marker>
          <marker id="arrowhead-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <polygon points="0 0, 10 3, 0 6" fill="#10B981" />
          </marker>
          <marker id="arrowhead-red" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <polygon points="0 0, 10 3, 0 6" fill="#EF4444" />
          </marker>
        </defs>

        {/* 発案者ボックス */}
        <rect x="100" y="50" width="140" height="90" rx="8" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="2" />
        <text x="170" y="75" textAnchor="middle" fontSize="14" fontWeight="600" fill="#1E293B">発案者</text>
        <text x="170" y="95" textAnchor="middle" fontSize="12" fill="#475569">自己資金</text>
        <text x="170" y="115" textAnchor="middle" fontSize="14" fontWeight="700" fill="#3B82F6">5,000万円</text>
        <text x="170" y="130" textAnchor="middle" fontSize="10" fill="#64748B">転籍して経営にコミット</text>

        {/* 伊藤忠商事ボックス */}
        <rect x="460" y="50" width="140" height="90" rx="8" fill="#F0FDF4" stroke="#10B981" strokeWidth="2" />
        <text x="530" y="75" textAnchor="middle" fontSize="14" fontWeight="600" fill="#1E293B">伊藤忠商事</text>
        <text x="530" y="95" textAnchor="middle" fontSize="12" fill="#475569">出資</text>
        <text x="530" y="115" textAnchor="middle" fontSize="14" fontWeight="700" fill="#10B981">5,000万円</text>
        <text x="530" y="130" textAnchor="middle" fontSize="10" fill="#64748B">Veto権保持</text>

        {/* 新会社ボックス */}
        <rect x="250" y="220" width="200" height="110" rx="8" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" />
        <text x="350" y="250" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1E293B">新会社</text>
        <text x="350" y="270" textAnchor="middle" fontSize="13" fill="#475569">株式会社AIアシスタント</text>
        <text x="350" y="295" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1E293B">資本金1億円</text>
        <text x="350" y="315" textAnchor="middle" fontSize="11" fill="#64748B">(発案者50% + 伊藤忠50%)</text>

        {/* 転籍・経営コミットメントテキスト（発案者と保証の中央揃え） */}
        <text x="170" y="250" textAnchor="middle" fontSize="12" fill="#3B82F6" fontWeight="600">転籍</text>
        <text x="170" y="270" textAnchor="middle" fontSize="12" fill="#475569">経営</text>
        <text x="170" y="290" textAnchor="middle" fontSize="11" fill="#64748B">コミット</text>

        {/* Drag-along条項テキスト（独立表示） */}
        <text x="600" y="260" textAnchor="middle" fontSize="12" fill="#EF4444" fontWeight="600">1,500万円</text>

        {/* 清算時損失補填ボックス */}
        <rect x="100" y="380" width="140" height="70" rx="8" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
        <text x="170" y="405" textAnchor="middle" fontSize="12" fontWeight="600" fill="#DC2626">清算時損失補填</text>
        <text x="170" y="425" textAnchor="middle" fontSize="12" fontWeight="700" fill="#DC2626">最大15%</text>
        <text x="170" y="440" textAnchor="middle" fontSize="10" fill="#991B1B">(発案者→伊藤忠)</text>

        {/* 発案者から新会社への矢印 */}
        <path d="M 170 140 Q 200 180 280 220" stroke="#3B82F6" strokeWidth="4" fill="none" markerEnd="url(#arrowhead-blue)" />
        <text x="220" y="175" fontSize="12" fill="#3B82F6" fontWeight="700">5,000万円</text>
        <text x="220" y="190" fontSize="11" fill="#64748B">出資</text>

        {/* 伊藤忠から新会社への矢印 */}
        <path d="M 530 140 Q 500 180 420 220" stroke="#10B981" strokeWidth="4" fill="none" markerEnd="url(#arrowhead-green)" />
        <text x="470" y="175" fontSize="12" fill="#10B981" fontWeight="700">5,000万円</text>
        <text x="470" y="190" fontSize="11" fill="#64748B">出資</text>

        {/* 新会社から保証への矢印（点線） */}
        <path d="M 300 330 Q 250 350 220 380" stroke="#EF4444" strokeWidth="3" strokeDasharray="8,4" fill="none" markerEnd="url(#arrowhead-red)" />
        <text x="250" y="360" fontSize="10" fill="#EF4444" fontWeight="600">清算時</text>

        {/* 保証から伊藤忠商事への矢印（点線、直角に曲がる、新会社を避ける） */}
        <path d="M 240 415 L 530 415 L 530 140" stroke="#EF4444" strokeWidth="2.5" strokeDasharray="8,4" fill="none" markerEnd="url(#arrowhead-red)" />
      </svg>
    </div>
  );
}

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
  const [isTableExpanded, setIsTableExpanded] = useState(false); // 表の折りたたみ状態
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
        成長戦略
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
                  bottom: '-70px',
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
                    <span style={{ color: '#10B981', fontWeight: 600 }}>自社の技術力とAI活用の基盤</span>を活用し、自社サービス事業を立ち上げ、データ蓄積とユーザー獲得を実現。自社のAI活用実践の場をつくり、AIスキルを高度化。
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
                    <li>人材育成・ルール設計のノウハウ蓄積</li>
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
                    <span style={{ color: '#3B82F6', fontWeight: 600 }}>ステップ2で構築した信頼関係と教育コンテンツ</span>を活用し、業務可視化コンサルとDX支援SI事業を展開。ペインポイントを押さえ、顧客の中枢に入り込むことで勝利の方程式を確立
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
                    <li>顧客の中枢への入り込み</li>
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

        {/* なぜ自社開発APPから始めるのか */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
            なぜ自社開発APPから始めるのか
          </h3>
          <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text)', lineHeight: '1.4', textAlign: 'center' }}>
            市場拡大と投資拡大の正のスパイラルの恩恵を享受する
          </h2>
          <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '20px', color: 'var(--color-text-light)', lineHeight: '1.6', textAlign: 'center', fontStyle: 'normal' }}>
            AIネイティブを前提に、「構造化/非構造化データ+AIモデル+ビジネスロジック」のパラダイムに移行
          </h3>
          
          <div style={{ 
            marginBottom: '16px'
          }}>
            
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#F9FAFB', 
              borderRadius: '6px',
              border: '1px solid #E5E7EB',
              marginTop: '20px'
            }}>
              <p style={{ 
                fontSize: '14px', 
                color: 'var(--color-text)', 
                lineHeight: '1.8',
                margin: 0
              }}>
                <strong>1. アプリケーションサービス戦略（アプリケーション事業）</strong><br />
                アプリケーションを中核にサービス市場進出と拡大を狙う戦略。合計契約金額（TCV）型の買い切り経済から、顧客生涯価値（LTV）型のサブスクリプション経済に移行し、年間計上収益（ARR）がもたらす予測可能な経営と投資、市場拡大と投資拡大の正のスパイラルの恩恵を享受する必要。その際には、AIネイティブを前提に、「構造化/非構造化データ+AIモデル+ビジネスロジック」のパラダイムに移行し、スマイルカーブ、データアーキテクチャ、ソフトウェアアーキテクチャの3つのシフトを実現する必要。AIネイティブ<sup style={{ fontSize: '10px', verticalAlign: 'super' }}>15</sup>に対応できないアプリケーション事業は、対応した競合に対する競争力を失い、既にドミナントデザインを築いていたとしても退場を迫られる恐れがある。
              </p>
              <div style={{ 
                marginTop: '12px',
                paddingLeft: '16px',
                borderLeft: '3px solid #E5E7EB',
                fontSize: '12px',
                color: 'var(--color-text-light)',
                lineHeight: '1.6',
                fontStyle: 'italic'
              }}>
                <sup style={{ fontSize: '10px', verticalAlign: 'super' }}>15</sup> 本書におけるAIネイティブとは、従来のビジネスロジックを中心としたソフトウェア設計から脱却し、AIモデルを核に据え、構造化データと非構造化データの双方を柔軟に活用することを前提に設計を行うことを指す。
              </div>
            </div>
            
            {/* 2. プラットフォームビジネス */}
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#F9FAFB', 
              borderRadius: '6px',
              border: '1px solid #E5E7EB',
              marginTop: '20px'
            }}>
              <p style={{ 
                fontSize: '14px', 
                color: 'var(--color-text)', 
                lineHeight: '1.8',
                margin: 0,
                marginBottom: '16px'
              }}>
                <strong>2. アプリケーションサービス戦略の派生形としての「プラットフォームビジネス」</strong><br />
                ソフトウェアを中核に両面市場（別名：ツーサイドプラットフォーム）（以下、「TSM」という。）形で、サービス提供者とサービス消費者をマッチングさせる派生的なサービスを提供する形態をとる。TSM型のアプリケーションサービス戦略を中核に、デジタル広告等を含む多面市場（別名：マルチサイドプラットフォーム）（以下、「MSM」という。）の構成を取るものを狭義のプラットフォームビジネス。プラットフォーム事業者の最大関心事はサービス提供者とサービス消費者の数と取引総量（＝デジタル取引）であり、プラットフォーム戦略はデジタル取引を最大化するために様々な手段を組み合わせてプラットフォームの維持・拡大を目指す。
              </p>
              
              {/* プラットフォームビジネスのグローバル市場における事例の表 */}
              <div style={{ marginTop: '20px', overflowX: 'auto', position: 'relative' }}>
                <button
                  onClick={() => setIsTableExpanded(!isTableExpanded)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    color: '#64748B',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: 400,
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#475569';
                    e.currentTarget.style.backgroundColor = '#F1F5F9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#64748B';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {isTableExpanded ? '折りたたむ' : 'もっと見る'}
                </button>
                <table style={{ 
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB',
                  fontSize: '13px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F3F4F6' }}>
                      <th style={{ 
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        borderBottom: '2px solid #E5E7EB',
                        width: '100px'
                      }}>
                        カテゴリ
                      </th>
                      <th style={{ 
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        borderBottom: '2px solid #E5E7EB',
                        width: '350px'
                      }}>
                        グローバル市場プラットフォーム事業者（例）
                      </th>
                      <th style={{ 
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        borderBottom: '2px solid #E5E7EB',
                        width: '140px'
                      }}>
                        サービス提供者
                      </th>
                      <th style={{ 
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        borderBottom: '2px solid #E5E7EB',
                        width: '140px'
                      }}>
                        サービス消費者
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>アプリストア</td>
                      <td style={{ padding: '10px 12px' }}>App Store (Apple), Google Play, Microsoft Store 等</td>
                      <td style={{ padding: '10px 12px' }}>アプリ開発者</td>
                      <td style={{ padding: '10px 12px' }}>アプリ利用者</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>ECモール</td>
                      <td style={{ padding: '10px 12px' }}>Amazon, Alibaba (Tmall), eBay 等</td>
                      <td style={{ padding: '10px 12px' }}>ECモール出店者</td>
                      <td style={{ padding: '10px 12px' }}>ECモール利用者</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>SNS</td>
                      <td style={{ padding: '10px 12px' }}>Facebook/Instagram (Meta Platforms), LinkedIn (Microsoft), X, Weibo 等</td>
                      <td style={{ padding: '10px 12px' }}>SNS利用者</td>
                      <td style={{ padding: '10px 12px' }}>SNS利用者</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>検索エンジン</td>
                      <td style={{ padding: '10px 12px' }}>Google, Baidu, NAVER 等</td>
                      <td style={{ padding: '10px 12px' }}>ウェブサイト運営者</td>
                      <td style={{ padding: '10px 12px' }}>検索エンジン利用者</td>
                    </tr>
                    {isTableExpanded && (
                      <>
                        <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>動画配信</td>
                          <td style={{ padding: '10px 12px' }}>Prime Video (Amazon), YouTube (Alphabet), Netflix, Hulu 等</td>
                          <td style={{ padding: '10px 12px' }}>映像制作者</td>
                          <td style={{ padding: '10px 12px' }}>動画視聴者</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>ライドシェア</td>
                          <td style={{ padding: '10px 12px' }}>Uber Technologies, DiDi, Grab, Lyft 等</td>
                          <td style={{ padding: '10px 12px' }}>ギグワーカー、タクシー会社</td>
                          <td style={{ padding: '10px 12px' }}>ライドシェア利用者</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>チャット</td>
                          <td style={{ padding: '10px 12px' }}>WhatsApp/Messenger (Meta Platforms), WeChat (Tencent), Telegram 等</td>
                          <td style={{ padding: '10px 12px' }}>コンテンツプロバイダー</td>
                          <td style={{ padding: '10px 12px' }}>チャット利用者</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>オンライン決済</td>
                          <td style={{ padding: '10px 12px' }}>VISA, PayPal, Alipay (Alibaba), Square, Stripe, Amazon Pay 等</td>
                          <td style={{ padding: '10px 12px' }}>店舗</td>
                          <td style={{ padding: '10px 12px' }}>オンライン決済利用者</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>音楽</td>
                          <td style={{ padding: '10px 12px' }}>Spotify, Apple Music, SoundCloud, Amazon Music, YouTube Music (Alphabet)</td>
                          <td style={{ padding: '10px 12px' }}>音楽制作者</td>
                          <td style={{ padding: '10px 12px' }}>音楽リスナー</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>フードデリバリー</td>
                          <td style={{ padding: '10px 12px' }}>Uber Eats, Grab Food, Ele.me (Alibaba), Meituan, DoorDash, Wolt</td>
                          <td style={{ padding: '10px 12px' }}>店舗、ギグワーカー</td>
                          <td style={{ padding: '10px 12px' }}>フードデリバリー利用者</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
                <p style={{ 
                  fontSize: '11px', 
                  color: 'var(--color-text-light)', 
                  marginTop: '8px',
                  marginBottom: 0,
                  fontStyle: 'italic'
                }}>
                  出典: 経済産業省若手新政策プロジェクトPIVOT作成
                </p>
              </div>
            </div>
            
            {/* 参考文献（1と2共通） */}
            <div style={{ 
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #E5E7EB'
            }}>
              <p style={{ 
                fontSize: '13px', 
                color: 'var(--color-text-light)', 
                marginBottom: '8px',
                fontWeight: 500
              }}>
                参考文献：
              </p>
              <a
                href="https://www.meti.go.jp/policy/it_policy/statistics/digital_economy_report/digital_economy_report1.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '14px',
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                経済産業省 デジタル経済レポート（PDF）
              </a>
            </div>
          </div>
        </div>

        {/* なぜ、新規会社を立てるのか */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
            なぜ、新規会社を立てるのか
          </h3>
          <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text)', lineHeight: '1.4', textAlign: 'center' }}>
            AIネイティブ事業を新会社として独立させるべき理由
          </h2>
          <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '20px', color: 'var(--color-text-light)', lineHeight: '1.6', textAlign: 'center', fontStyle: 'normal' }}>
            AIネイティブ事業は既存事業の構造と「経済性」が根本的に異なるため、同じ組織構造では成長できない
          </h3>
          
          {/* 5つの理由を横並びカード形式で表示 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '16px',
            marginBottom: '32px'
          }}>
            {/* 1. 事業構造と経済性の違い */}
            <div style={{ 
              backgroundColor: '#FFFFFF',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
            >
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: 'var(--color-primary)', 
                marginBottom: '8px',
                letterSpacing: '0.3px'
              }}>
                1. 事業構造と経済性の違い
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--color-text)', 
                lineHeight: '1.6',
                flex: 1
              }}>
                少人数 × 高生産性 × ソフト中心の高い粗利<sup style={{ fontSize: '10px', verticalAlign: 'super' }}>1</sup>。機動力重視・フラット構造<sup style={{ fontSize: '10px', verticalAlign: 'super' }}>2</sup>。既存企業の階層型・稟議型組織ではスピードに追いつけない。
              </div>
            </div>

            {/* 2. 収益モデルと評価制度の不一致 */}
            <div style={{ 
              backgroundColor: '#FFFFFF',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
            >
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: 'var(--color-primary)', 
                marginBottom: '8px',
                letterSpacing: '0.3px'
              }}>
                2. 収益モデルと評価制度の不一致
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--color-text)', 
                lineHeight: '1.6',
                flex: 1
              }}>
                プロダクト売上 + スケールで利益が出る。既存組織の人月モデルと真逆のため、評価制度が事業成長を阻害する<sup style={{ fontSize: '10px', verticalAlign: 'super' }}>3</sup>。
              </div>
            </div>

            {/* 3. AI人材の採用・報酬制度の違い */}
            <div style={{ 
              backgroundColor: '#FFFFFF',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
            >
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: 'var(--color-primary)', 
                marginBottom: '8px',
                letterSpacing: '0.3px'
              }}>
                3. AI人材の採用・報酬制度の違い
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--color-text)', 
                lineHeight: '1.6',
                flex: 1
              }}>
                年功序列・固定給では世界のAI人材市場と競争できない<sup style={{ fontSize: '10px', verticalAlign: 'super' }}>4,5</sup>。新会社なら独自の報酬体系・株式報酬を自由に設計できる。
              </div>
            </div>

            {/* 4. スケール・高速展開と大企業構造の矛盾 */}
            <div style={{ 
              backgroundColor: '#FFFFFF',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
            >
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: 'var(--color-primary)', 
                marginBottom: '8px',
                letterSpacing: '0.3px'
              }}>
                4. スケール・高速展開と大企業構造の矛盾
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--color-text)', 
                lineHeight: '1.6',
                flex: 1
              }}>
                複製コストが限りなくゼロ<sup style={{ fontSize: '10px', verticalAlign: 'super' }}>6</sup>。市場スピードが正義。大企業の意思決定速度は3〜10倍遅く、AI市場の速度に負ける<sup style={{ fontSize: '10px', verticalAlign: 'super' }}>7</sup>。
              </div>
            </div>

            {/* 5. 投資ストーリーの明確化 */}
            <div style={{ 
              backgroundColor: '#FFFFFF',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
            >
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: 'var(--color-primary)', 
                marginBottom: '8px',
                letterSpacing: '0.3px'
              }}>
                5. 投資ストーリーの明確化
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--color-text)', 
                lineHeight: '1.6',
                flex: 1
              }}>
                高成長・高粗利・高い資本効率<sup style={{ fontSize: '10px', verticalAlign: 'super' }}>8,9</sup>。新会社として事業構造を切り分けたほうが企業価値が明瞭に上がる。
              </div>
            </div>
          </div>

          {/* 経営系統の問題: 経営戦略 */}
          <div style={{
            marginTop: '32px',
            marginBottom: '32px'
          }}>
            <h4 style={{
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '12px',
              color: '#1E293B',
              borderLeft: '4px solid #3B82F6',
              paddingLeft: '12px'
            }}>
              経営系統の問題: 経営戦略
            </h4>
            <div style={{
              marginTop: '20px'
            }}>
              <div style={{
                marginBottom: '24px',
                display: 'flex',
                gap: '24px',
                alignItems: 'baseline'
              }}>
                <div style={{
                  flex: '0 0 350px',
                  minWidth: '350px'
                }}>
                  <h6 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: 0,
                    color: '#1E293B',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                    lineHeight: '1.8'
                  }}>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#3B82F6'
                    }}>1</span>
                    <span>プロジェクトオーナーとしての社長・経営幹部のコミットメント確保</span>
                  </h6>
                </div>
                <div style={{
                  flex: 1
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    lineHeight: '1.8',
                    color: '#475569'
                  }}>
                    プロジェクトオーナーが社長ではないソフトウェア・データ経営改革は成功しない。DX同様、社長をはじめとした経営幹部がこの先10年の全社の命運を握る経営問題として聖域なきデジタル市場を正面から捉え、適合戦略の策定・実行にコミットすることが、デジタルシフトの成功を左右する最も重要な要因である。
                  </p>
                </div>
              </div>

              <div style={{
                marginBottom: '24px',
                display: 'flex',
                gap: '24px',
                alignItems: 'baseline'
              }}>
                <div style={{
                  flex: '0 0 350px',
                  minWidth: '350px'
                }}>
                  <h6 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: 0,
                    color: '#1E293B',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                    lineHeight: '1.8'
                  }}>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#3B82F6'
                    }}>2</span>
                    <span>ソフトウェア・データ戦略をトップダウンで設計するアーキテクトのアサインと権限委譲</span>
                  </h6>
                </div>
                <div style={{
                  flex: 1
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    lineHeight: '1.8',
                    color: '#475569'
                  }}>
                    全社の業務フローを洗い出したうえで、最上流のソフトウェア・データ戦略を設計するアーキテクト人材をCDO（Chief Digital Officer）やCA（Chief Architect）にアサインし、権限移譲を行う必要。権限委譲がないと、現場層からの抵抗に対する後ろ盾がなく、あるべき姿への主導を遂行できない。
                  </p>
                </div>
              </div>

              <div style={{
                marginBottom: '24px',
                display: 'flex',
                gap: '24px',
                alignItems: 'baseline'
              }}>
                <div style={{
                  flex: '0 0 350px',
                  minWidth: '350px'
                }}>
                  <h6 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: 0,
                    color: '#1E293B',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                    lineHeight: '1.8'
                  }}>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#3B82F6'
                    }}>3</span>
                    <span>戦略実行のための有効な全社スキームの樹立</span>
                  </h6>
                </div>
                <div style={{
                  flex: 1
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    lineHeight: '1.8',
                    color: '#475569'
                  }}>
                    社長から移譲された権限の下、CDO/アーキテクトにより設計された施作を基に、ボトムアップで積み上げられてきた業務オペレーションを標準化・変革する全社スキームを樹立すること。特に、事業本部長や工場長、現場統括等のステークホルダの利害関係調整を社長・経営幹部が強力に主導しなければ、現場の変革は訪れない。
                  </p>
                </div>
              </div>

              <div style={{
                marginBottom: '0',
                display: 'flex',
                gap: '24px',
                alignItems: 'baseline'
              }}>
                <div style={{
                  flex: '0 0 350px',
                  minWidth: '350px'
                }}>
                  <h6 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: 0,
                    color: '#1E293B',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                    lineHeight: '1.8'
                  }}>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#3B82F6'
                    }}>4</span>
                    <span>請負型・準委任型契約に基づく開発丸投げ外注からの脱却</span>
                  </h6>
                </div>
                <div style={{
                  flex: 1
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    lineHeight: '1.8',
                    color: '#475569'
                  }}>
                    コア領域の開発を丸投げ外注する体制は成立しない。アジャイル開発を前提に、発注者がプロジェクトマネージャーを立て、自ら成果物の品質をコントロールする体制が必要。事業要件とシステム開発要件双方に精通したフルスタックのプロジェクトマネジメント人材が必須。
                  </p>
                </div>
              </div>
              
              {/* 注釈 */}
              <div style={{
                marginTop: '16px',
                fontSize: '8px',
                color: 'var(--color-text-light)',
                lineHeight: '1.4'
              }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '8px' }}>
                  <sup style={{ fontSize: '8px', verticalAlign: 'super' }}>41</sup> DXを成功させたトップ企業22%のうち、DX推進の全社責任を負う経営幹部が存在する企業は82%（n=1550）を超えることが調査で明らかになっている。出典：アクセンチュア「デジタル変革の投資を最大化する5つの指針：部門の枠を超えたコラボレーションがもたらす効果」
                </p>
                <p style={{ margin: 0, fontSize: '8px' }}>
                  <sup style={{ fontSize: '8px', verticalAlign: 'super' }}>40</sup> 経済産業省（2021）「DX レポート 2.1 (DX レポート2 追補版)」https://www.meti.go.jp/press/2021/08/20210831005/20210831005-2.pdf
                </p>
              </div>
            </div>
          </div>

          {/* まとめ */}
          <h4 style={{
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '12px',
            color: '#1E293B',
            borderLeft: '4px solid #3B82F6',
            paddingLeft: '12px',
            marginTop: '32px'
          }}>
            まとめ
          </h4>
          <div style={{ 
            marginTop: '0',
            marginBottom: '32px'
          }}>
              <p style={{ 
                fontSize: '16px', 
                color: '#1E293B', 
                lineHeight: '1.7',
                margin: 0,
                marginBottom: '12px',
                fontWeight: 600,
                letterSpacing: '-0.01em'
              }}>
                AIネイティブ企業は「既存企業の事業構造と根本的に異なるため、新会社として設立する必要がある」
              </p>
              <p style={{ 
                fontSize: '14px', 
                color: '#475569', 
                lineHeight: '1.7',
                margin: 0,
                marginBottom: '24px',
                fontWeight: 500
              }}>
                企業価値の最大化のためには切り離すべき<sup style={{ fontSize: '9px', verticalAlign: 'super', color: '#64748B' }}>8,9</sup>
              </p>

              {/* AIネイティブ企業の特徴 */}
              <div style={{
                marginBottom: '12px'
              }}>
                <h5 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1E293B',
                  marginBottom: '16px'
                }}>
                  AIネイティブ企業の特徴
                </h5>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px'
                }}>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px', fontWeight: 600 }}>事業スピード</div>
                    <div style={{ fontSize: '14px', color: '#1E293B', fontWeight: 600 }}>反復速度10〜20倍</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>高速意思決定・フラットな稟議</div>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px', fontWeight: 600 }}>収益モデル</div>
                    <div style={{ fontSize: '14px', color: '#1E293B', fontWeight: 600 }}>プロダクト売上+スケール</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>少人数×高付加価値×ソフト中心</div>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px', fontWeight: 600 }}>制度設計</div>
                    <div style={{ fontSize: '14px', color: '#1E293B', fontWeight: 600 }}>独自の報酬体系・株式報酬</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>優秀な人材の流出防止</div>
                  </div>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px', fontWeight: 600 }}>組織構造</div>
                    <div style={{ fontSize: '14px', color: '#1E293B', fontWeight: 600 }}>モジュール型組織</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>スケール前提のテックアーキ</div>
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: '1.6',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ color: '#3B82F6', fontSize: '16px', lineHeight: '1' }}>•</span>
                  <span>事業スピードが異次元<sup style={{ fontSize: '9px', verticalAlign: 'super', color: '#64748B' }}>6</sup></span>
                </div>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: '1.6',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ color: '#3B82F6', fontSize: '16px', lineHeight: '1' }}>•</span>
                  <span>収益モデルが根本的に違う<sup style={{ fontSize: '9px', verticalAlign: 'super', color: '#64748B' }}>3</sup></span>
                </div>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: '1.6',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ color: '#3B82F6', fontSize: '16px', lineHeight: '1' }}>•</span>
                  <span>AI人材確保が既存の制度では困難<sup style={{ fontSize: '9px', verticalAlign: 'super', color: '#64748B' }}>4,5</sup></span>
                </div>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: '1.6',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ color: '#3B82F6', fontSize: '16px', lineHeight: '1' }}>•</span>
                  <span>スケールモデルが大企業の組織構造と矛盾<sup style={{ fontSize: '9px', verticalAlign: 'super', color: '#64748B' }}>7</sup></span>
                </div>
              </div>
          </div>

          {/* 参考文献 */}
          <div style={{ 
            marginTop: '24px',
            fontSize: '8px'
          }}>
            <p style={{ 
              fontSize: '8px', 
              color: 'var(--color-text-light)', 
              lineHeight: '1.3',
              margin: 0,
              marginBottom: '4px',
              fontWeight: 500
            }}>
              参考文献：
            </p>
            <div style={{ 
              fontSize: '8px', 
              color: 'var(--color-text-light)', 
              lineHeight: '1.4',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              wordBreak: 'break-word'
            }}>
              <span style={{ fontSize: '8px', whiteSpace: 'normal' }}>
                <strong style={{ fontSize: '8px' }}>1.</strong> McKinsey（2023）：Generative AIはホワイトカラー生産性を30〜70%向上。少人数で運営できるビジネスほど競争優位が大きい。
              </span>
              <span style={{ fontSize: '8px', whiteSpace: 'normal' }}>
                <strong style={{ fontSize: '8px' }}>2.</strong> Harvard Business Review（2024）：AIネイティブ企業の競争力は「高速検証 × 小規模チーム運営」に依存する。
              </span>
              <span style={{ fontSize: '8px', whiteSpace: 'normal' }}>
                <strong style={{ fontSize: '8px' }}>3.</strong> Bain & Company（2024）：AI導入企業の75%が「既存のKPIとAI事業が整合しない」ことを課題に挙げた。
              </span>
              <span style={{ fontSize: '8px', whiteSpace: 'normal' }}>
                <strong style={{ fontSize: '8px' }}>4.</strong> OpenAI, Anthropic, Google DeepMind：主要AI研究者の報酬は年収5,000万円〜数億＋ストックオプション付与。
              </span>
              <span style={{ fontSize: '8px', whiteSpace: 'normal' }}>
                <strong style={{ fontSize: '8px' }}>5.</strong> MIT CSAIL（2024）：「AI人材の市場価格は既存企業の給与体系と乖離している」と明示。
              </span>
              <span style={{ fontSize: '8px', whiteSpace: 'normal' }}>
                <strong style={{ fontSize: '8px' }}>6.</strong> Stanford/MIT（2024）：生成AIは「コンテンツ生成コストを98〜99%削減」して高速な市場投入と反復改善を可能にする。
              </span>
              <span style={{ fontSize: '8px', whiteSpace: 'normal' }}>
                <strong style={{ fontSize: '8px' }}>7.</strong> Goldman Sachs（2024）：AIネイティブ事業は伝統的事業の2倍〜4倍の投資利回り。
              </span>
              <span style={{ fontSize: '8px', whiteSpace: 'normal' }}>
                <strong style={{ fontSize: '8px' }}>8.</strong> Sequoia（2023 "AI The New Frontier"）：AIネイティブ企業は「スケール到達までの資本効率が最も高い」。
              </span>
              <span style={{ fontSize: '8px', whiteSpace: 'normal' }}>
                <strong style={{ fontSize: '8px' }}>40.</strong> 経済産業省（2021）「DX レポート 2.1 (DX レポート2 追補版)」https://www.meti.go.jp/press/2021/08/20210831005/20210831005-2.pdf
              </span>
              <span style={{ fontSize: '8px', whiteSpace: 'normal' }}>
                <strong style={{ fontSize: '8px' }}>41.</strong> DXを成功させたトップ企業22%のうち、DX推進の全社責任を負う経営幹部が存在する企業は82%（n=1550）を超えることが調査で明らかになっている。出典：アクセンチュア「デジタル変革の投資を最大化する5つの指針：部門の枠を超えたコラボレーションがもたらす効果」
              </span>
            </div>
          </div>
        </div>

        {/* 設立時の資本構成 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
            設立時の資本構成
          </h3>
          <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text)', lineHeight: '1.4', textAlign: 'center' }}>
            株式会社AIアシスタント 設立計画（共同出資スキーム案）
          </h2>
          <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '20px', color: 'var(--color-text-light)', lineHeight: '1.6', textAlign: 'center', fontStyle: 'normal' }}>
            発案者は転籍し、経営とプロダクト開発にコミットメント
          </h3>
          <div style={{ 
            marginTop: '20px'
          }}>
            <div style={{
              display: 'flex',
              gap: '40px',
              alignItems: 'flex-start',
              flexWrap: 'wrap'
            }}>
              {/* 左側：相関図 */}
              <div style={{
                flex: '1',
                minWidth: '400px'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1E293B',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  資本構成とお金の流れ
                </div>
                <CapitalFlowDiagram />
              </div>

              {/* 右側：資本構成図 */}
              <div style={{
                flex: '1',
                minWidth: '400px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  gap: '40px',
                  marginBottom: '32px',
                  flexWrap: 'wrap'
                }}>
              {/* 発案者 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: '1',
                minWidth: '200px',
                maxWidth: '300px'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  border: '3px solid #3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#3B82F6'
                  }}>
                    50%
                  </div>
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#1E293B',
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  発案者
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px'
                }}>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#475569'
                  }}>自己資金</span>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#3B82F6'
                  }}>5,000万円</span>
                </div>
                
                {/* 発案者の主要条件カード */}
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '2px dashed #3B82F6',
                  borderRadius: '8px',
                  width: '100%',
                  maxWidth: '280px',
                  minHeight: '360px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#3B82F6',
                    marginBottom: '12px',
                    textAlign: 'center'
                  }}>
                    主要条件
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#475569',
                    lineHeight: '1.8',
                    textAlign: 'left'
                  }}>
                    <div style={{ marginBottom: '8px' }}>1. フルコミットメント</div>
                    <div style={{ marginBottom: '8px', fontSize: '11px', color: '#64748B', paddingLeft: '8px' }}>経営責任およびプロダクト開発に専念</div>
                    <div style={{ marginBottom: '8px' }}>2. 自己資金5,000万円出資</div>
                    <div style={{ marginBottom: '8px', fontSize: '11px', color: '#64748B', paddingLeft: '8px' }}>新会社の株式50%を保有、経営者責任としてリスクテイク</div>
                    <div style={{ marginBottom: '8px' }}>3. 清算時損失補填（最大15%）</div>
                    <div style={{ marginBottom: '8px', fontSize: '11px', color: '#64748B', paddingLeft: '8px' }}>事業不振・清算のとき、伊藤忠側へ損失補填</div>
                    <div style={{ marginBottom: '8px' }}>4. Drag-along</div>
                    <div style={{ marginBottom: '8px', fontSize: '11px', color: '#64748B', paddingLeft: '8px' }}>条件付きのExit時の同条件売却義務</div>
                    <div>5. Veto権は投資家に付与</div>
                    <div style={{ fontSize: '11px', color: '#64748B', paddingLeft: '8px' }}>安全性担保</div>
                  </div>
                </div>
              </div>

              {/* 伊藤忠商事 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: '1',
                minWidth: '200px',
                maxWidth: '300px'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: '#F0FDF4',
                  border: '3px solid #10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#10B981'
                  }}>
                    50%
                  </div>
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#1E293B',
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  伊藤忠商事
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px'
                }}>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#475569'
                  }}>出資</span>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#10B981'
                  }}>5,000万円</span>
                </div>
                
                {/* 伊藤忠商事の主要条件カード */}
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '2px dashed #10B981',
                  borderRadius: '8px',
                  width: '100%',
                  maxWidth: '280px',
                  minHeight: '360px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#10B981',
                    marginBottom: '12px',
                    textAlign: 'center'
                  }}>
                    主要条件
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#475569',
                    lineHeight: '1.8',
                    textAlign: 'left'
                  }}>
                    <div style={{ marginBottom: '8px' }}>1. 出資5,000万円（株式50%）</div>
                    <div style={{ marginBottom: '8px', fontSize: '11px', color: '#64748B', paddingLeft: '8px' }}>新会社の株式50%を保有</div>
                    <div style={{ marginBottom: '8px' }}>2. Veto権保持</div>
                    <div style={{ marginBottom: '8px', fontSize: '11px', color: '#64748B', paddingLeft: '8px' }}>増資・役員選任・事業売却等の重要事項について拒否権</div>
                    <div style={{ marginBottom: '8px' }}>3. 清算優先権（1.0x）</div>
                    <div style={{ marginBottom: '8px', fontSize: '11px', color: '#64748B', paddingLeft: '8px' }}>優先回収権</div>
                    <div style={{ marginBottom: '8px' }}>4. Drag-along（条件付き）</div>
                    <div style={{ marginBottom: '8px', fontSize: '11px', color: '#64748B', paddingLeft: '8px' }}>3倍以上の売却価格の場合のみ有効</div>
                    <div>5. 定期的な情報提供</div>
                    <div style={{ fontSize: '11px', color: '#64748B', paddingLeft: '8px' }}>KPI/PL/BS/CF</div>
                  </div>
                </div>
              </div>
                </div>
              </div>
            </div>
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
                    立ち上げ時期
                  </h6>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0, fontWeight: 600 }}>
                    {SERVICE_LAUNCH_TIMING['own-service']}
                  </p>
                </div>
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
                    立ち上げ時期
                  </h6>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0, fontWeight: 600 }}>
                    {SERVICE_LAUNCH_TIMING['education-training']}
                  </p>
                </div>
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
                    立ち上げ時期
                  </h6>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0, fontWeight: 600 }}>
                    {SERVICE_LAUNCH_TIMING['consulting']}
                  </p>
                </div>
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
                    立ち上げ時期
                  </h6>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0, fontWeight: 600 }}>
                    {SERVICE_LAUNCH_TIMING['ai-dx']}
                  </p>
                </div>
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

        {/* アプリの構想のターゲット */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
            アプリの構想のターゲット
          </h3>
          <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text)', lineHeight: '1.4', textAlign: 'center' }}>
            なぜ、出産支援/介護支援パーソナルAppから着手するのか
          </h2>
          <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '20px', color: 'var(--color-text-light)', lineHeight: '1.6', textAlign: 'center', fontStyle: 'normal' }}>
            戦略的優位性と社会的価値の両立を実現する起点
          </h3>
          
          {/* 理由 */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                marginBottom: '20px', 
                color: 'var(--color-text)' 
              }}>
                理由
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '20px' 
              }}>
                {/* 競合優位性 */}
                <div style={{ 
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                }}
                >
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: 'var(--color-primary)', 
                    marginBottom: '8px',
                    letterSpacing: '0.3px'
                  }}>
                    競合優位性
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--color-text)', 
                    lineHeight: '1.7' 
                  }}>
                    強力な先行企業によるアプリケーション・サービス提供者がいない
                  </div>
                </div>

                {/* 戦略立案の容易さ */}
                <div style={{ 
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                }}
                >
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: 'var(--color-primary)', 
                    marginBottom: '8px',
                    letterSpacing: '0.3px'
                  }}>
                    戦略立案の容易さ
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--color-text)', 
                    lineHeight: '1.7' 
                  }}>
                    ターゲット層と目的が明確で戦略や方向性が立てやすい
                  </div>
                </div>

                {/* 社会的意義 */}
                <div style={{ 
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                }}
                >
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: 'var(--color-primary)', 
                    marginBottom: '8px',
                    letterSpacing: '0.3px'
                  }}>
                    社会的意義
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--color-text)', 
                    lineHeight: '1.7' 
                  }}>
                    日本が抱える、少子高齢化に直結する取り組み
                  </div>
                </div>

                {/* 社会的動向 */}
                <div style={{ 
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                }}
                >
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: 'var(--color-primary)', 
                    marginBottom: '8px',
                    letterSpacing: '0.3px'
                  }}>
                    社会的動向
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--color-text)', 
                    lineHeight: '1.7' 
                  }}>
                    デジタル化や育児支援（働き方改革）に関する法整備・政策動向が活発化
                  </div>
                </div>
              </div>
            </div>

            {/* プラットフォームビジネスにおける競合戦略 */}
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#F9FAFB', 
              borderRadius: '6px',
              border: '1px solid #E5E7EB',
              marginTop: '24px'
            }}>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                marginBottom: '12px', 
                color: 'var(--color-text)' 
              }}>
                1. プラットフォームビジネスの競合戦略
              </h4>
              <p style={{ 
                fontSize: '14px', 
                color: 'var(--color-text)', 
                lineHeight: '1.8',
                margin: 0,
                marginBottom: '12px'
              }}>
                プラットフォームビジネスにおける競合戦略は、一言でいえばTSM及びMSMにおけるサービス提供者と消費者の「スイッチングコスト」<sup style={{ fontSize: '10px', verticalAlign: 'super' }}>19</sup>の増大。プラットフォームの優位性は先行性によるデファクト・スタンダードの存在をはじめ、取引手数料の低さといった経済的インセンティブ、提供機能の独自性（特許や標準によるソフトウェアチョーキング戦略）等様々な要因で動的かつ複合的に決定されるが、プラットフォーム事業者にとって重要なのは、いかに現在擁しているサービス消費者の数と取引総量を維持・拡大するかということである。そのためには、今プラットフォームを利用しているサービス提供者及び消費者の、他のサービスに切り替える際のコストを最大化することで、その場に留まらせ続ける必要がある、というのがこの戦略の背景<sup style={{ fontSize: '10px', verticalAlign: 'super' }}>20</sup>。
              </p>
              
              {/* 脚注 */}
              <div style={{ 
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #E5E7EB'
              }}>
                <div style={{ 
                  marginBottom: '12px',
                  paddingLeft: '16px',
                  borderLeft: '3px solid #E5E7EB',
                  fontSize: '12px',
                  color: 'var(--color-text-light)',
                  lineHeight: '1.6',
                  fontStyle: 'italic'
                }}>
                  <sup style={{ fontSize: '10px', verticalAlign: 'super' }}>19</sup> スイッチングコストとは、顧客が現在利用している製品・サービスから別の会社の製品・サービスに切り替える際に負担しなければならない金銭的・物理的・心理的なコストのこと。
                </div>
                <div style={{ 
                  paddingLeft: '16px',
                  borderLeft: '3px solid #E5E7EB',
                  fontSize: '12px',
                  color: 'var(--color-text-light)',
                  lineHeight: '1.6',
                  fontStyle: 'italic'
                }}>
                  <sup style={{ fontSize: '10px', verticalAlign: 'super' }}>20</sup> なお、先行者優位のプラットフォーム市場において、支配的なプラットフォーム事業者がこの競合戦略を行う場合、競争環境上の問題を孕むことに留意する必要がある。
                </div>
                
                {/* 参考文献 */}
                <div style={{ 
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #E5E7EB'
                }}>
                  <p style={{ 
                    fontSize: '13px', 
                    color: 'var(--color-text-light)', 
                    marginBottom: '8px',
                    fontWeight: 500
                  }}>
                    参考文献：
                  </p>
                  <a
                    href="https://www.meti.go.jp/policy/it_policy/statistics/digital_economy_report/digital_economy_report1.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '14px',
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    経済産業省 デジタル経済レポート（PDF）
                  </a>
                </div>
              </div>
            </div>

            {/* プラットフォームビジネスの競合戦略の図 */}
            <div style={{ 
              marginTop: '32px'
            }}>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                marginBottom: '24px', 
                color: 'var(--color-text)',
                textAlign: 'center'
              }}>
                図24 プラットフォームビジネスの競合戦略
              </h4>
              
              <div style={{ 
                display: 'flex', 
                gap: '32px', 
                flexWrap: 'wrap',
                alignItems: 'flex-start'
              }}>
                {/* 左側：バリューチェーンのグラフ */}
                <div style={{ flex: '1', minWidth: '300px' }}>
                  <h5 style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    marginBottom: '20px', 
                    color: 'var(--color-text)',
                    textAlign: 'center'
                  }}>
                    バリューチェーン
                  </h5>
                  
                  {/* SVGグラフ */}
                    <svg 
                      width="100%" 
                      height="380" 
                      viewBox="0 0 400 380"
                      style={{ maxWidth: '400px', margin: '0 auto', display: 'block' }}
                    >
                      {/* グリッド線 */}
                      <defs>
                        <marker
                          id="arrowhead"
                          markerWidth="10"
                          markerHeight="10"
                          refX="9"
                          refY="3"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3, 0 6" fill="#333" />
                        </marker>
                      </defs>
                      
                      {/* Y軸 */}
                      <line x1="50" y1="250" x2="50" y2="30" stroke="#333" strokeWidth="2" markerEnd="url(#arrowhead)" />
                      <text x="20" y="140" fontSize="12" fill="#666" transform="rotate(-90 20 140)">
                        付加価値
                      </text>
                      <text x="15" y="35" fontSize="11" fill="#666">高</text>
                      <text x="15" y="255" fontSize="11" fill="#666">低</text>
                      
                      {/* X軸 */}
                      <line x1="50" y1="250" x2="350" y2="250" stroke="#333" strokeWidth="2" markerEnd="url(#arrowhead)" />
                      <text x="200" y="360" fontSize="12" fill="#666" textAnchor="middle">バリューチェーン</text>
                      
                      {/* U字型カーブ（スマイルカーブ） */}
                      <path
                        d="M 80 80 Q 200 350, 320 80"
                        stroke="#4A90E2"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                      />
                      
                      {/* ポイント */}
                      {/* 上流（イ） */}
                      <circle cx="80" cy="80" r="6" fill="#4A90E2" />
                      <text x="80" y="70" fontSize="12" fill="#4A90E2" fontWeight="600" textAnchor="middle">イ</text>
                      <text x="80" y="265" fontSize="11" fill="#666" textAnchor="middle" fontWeight="600">上流</text>
                      <text x="80" y="278" fontSize="10" fill="#666" textAnchor="middle">企画・開発</text>
                      <text x="80" y="291" fontSize="10" fill="#666" textAnchor="middle">設計等</text>
                      
                      {/* 中流（ロ） */}
                      <circle cx="200" cy="215" r="6" fill="#4A90E2" />
                      <text x="200" y="205" fontSize="12" fill="#4A90E2" fontWeight="600" textAnchor="middle">ロ</text>
                      <text x="200" y="265" fontSize="11" fill="#666" textAnchor="middle" fontWeight="600">中流</text>
                      <text x="200" y="278" fontSize="10" fill="#666" textAnchor="middle">実装・運用</text>
                      <text x="200" y="291" fontSize="10" fill="#666" textAnchor="middle">ローカライズ</text>
                      <text x="200" y="304" fontSize="10" fill="#666" textAnchor="middle">保守等</text>
                      
                      {/* 下流（ハ） */}
                      <circle cx="320" cy="80" r="6" fill="#4A90E2" />
                      <text x="320" y="70" fontSize="12" fill="#4A90E2" fontWeight="600" textAnchor="middle">ハ</text>
                      <text x="320" y="265" fontSize="11" fill="#666" textAnchor="middle" fontWeight="600">下流</text>
                      <text x="320" y="278" fontSize="10" fill="#666" textAnchor="middle">営業・マーケ</text>
                      <text x="320" y="291" fontSize="10" fill="#666" textAnchor="middle">カスタマー</text>
                      <text x="320" y="304" fontSize="10" fill="#666" textAnchor="middle">サクセス等</text>
                    </svg>
                </div>
                
                {/* 右側：競合戦略の表 */}
                <div style={{ flex: '1', minWidth: '400px' }}>
                  <h5 style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    marginBottom: '20px', 
                    color: 'var(--color-text)',
                    textAlign: 'center'
                  }}>
                    競合戦略
                  </h5>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* 1. サービス提供者の誘引手段 */}
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '12px'
                        }}>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: '#4A90E2' 
                          }}>
                            イ
                          </span>
                          <h6 style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            サービス提供者の誘引手段
                          </h6>
                        </div>
                        <p style={{ 
                          fontSize: '13px', 
                          fontWeight: 600, 
                          marginBottom: '8px',
                          color: 'var(--color-text)'
                        }}>
                          1. アルゴリズムの公開
                        </p>
                        <p style={{ 
                          fontSize: '12px', 
                          color: 'var(--color-text-light)', 
                          lineHeight: '1.6',
                          margin: 0
                        }}>
                          本来的に付加価値の高いアルゴリズムをオープンソースで公開し、サービス提供者を呼び込みながら、開発者コミュニティの知見を基により良いアルゴリズムに昇華させる。
                        </p>
                      </div>
                      
                      {/* 2. SI・ローカライゼーション */}
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '12px'
                        }}>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: '#4A90E2' 
                          }}>
                            ロ
                          </span>
                          <h6 style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            サービス消費者の誘引手段
                          </h6>
                        </div>
                        <p style={{ 
                          fontSize: '13px', 
                          fontWeight: 600, 
                          marginBottom: '8px',
                          color: 'var(--color-text)'
                        }}>
                          2. SI・ローカライゼーション
                        </p>
                        <p style={{ 
                          fontSize: '12px', 
                          color: 'var(--color-text-light)', 
                          lineHeight: '1.6',
                          margin: 0
                        }}>
                          自身のプラットフォームに消費者を乗り換えさせたうえで、定着させるためタイムチャージビジネスで付加価値の低いSIやローカライゼーションを無償・極めて低価格で実施する。
                        </p>
                      </div>
                      
                      {/* 3. サービスバンドル */}
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '12px'
                        }}>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: '#4A90E2' 
                          }}>
                            ハ
                          </span>
                          <h6 style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            サービス消費者の誘引手段
                          </h6>
                        </div>
                        <p style={{ 
                          fontSize: '13px', 
                          fontWeight: 600, 
                          marginBottom: '8px',
                          color: 'var(--color-text)'
                        }}>
                          3. サービスバンドル
                        </p>
                        <p style={{ 
                          fontSize: '12px', 
                          color: 'var(--color-text-light)', 
                          lineHeight: '1.6',
                          margin: 0
                        }}>
                          消費者との接点である付加価値の高いサービス領域において、競争力のある先行アイデアやサービスをつまみ食いする形でプラットフォームに取り込み、サービス品質の向上と競合からの消費者奪取を行う。
                        </p>
                      </div>
                    </div>
                </div>
              </div>
              
              <p style={{ 
                fontSize: '11px', 
                color: 'var(--color-text-light)', 
                marginTop: '16px',
                marginBottom: 0,
                fontStyle: 'italic',
                textAlign: 'center'
              }}>
                出典: 経済産業省若手新政策プロジェクトPIVOT作成
              </p>
            </div>

        {/* 後発事業者の参入の勝機 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
            後発事業者の参入の勝機
          </h3>
          <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text)', lineHeight: '1.4', textAlign: 'center' }}>
            後発事業者の参入の勝機
          </h2>
          <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '20px', color: 'var(--color-text-light)', lineHeight: '1.6', textAlign: 'center', fontStyle: 'normal' }}>
            先行者優位の市場において、後発者が参入するためには、「規模・密度・範囲の経済のトリレンマ」が１つの切り口
          </h3>

          {/* 株式会社AIアシスタントの視点 */}
          <div style={{
            marginTop: '32px'
          }}>
            <div style={{
              display: 'flex',
              gap: '24px',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#3B82F6'
              }}>
                <FaEye size={24} />
              </div>
              <div style={{
                flex: 1
              }}>
                <p style={{ 
                  fontSize: '14px', 
                  color: 'var(--color-text)', 
                  lineHeight: '1.8',
                  margin: 0,
                  fontWeight: 600
                }}>
                  株式会社AIアシスタントは、<strong>「範囲の経済の犠牲」</strong>を選択し、出産支援/介護支援という特定領域（密度の経済）に集中しつつ、AIアプリケーションとして効率的な規模（規模の経済）を実現することで、後発事業者としての参入を目指す。
                </p>
              </div>
            </div>
          </div>

          {/* 規模・密度・範囲の経済のトリレンマ */}
            <div style={{ marginTop: '32px' }}>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                marginBottom: '24px', 
                color: 'var(--color-text)',
                textAlign: 'center'
              }}>
                図25 規模・密度・範囲の経済のトリレンマ仮説
              </h4>
              
              <div style={{ 
                display: 'flex', 
                gap: '32px', 
                flexWrap: 'wrap',
                alignItems: 'flex-start'
              }}>
                {/* 左側：トリレンマの図 */}
                <div style={{ flex: '1', minWidth: '300px' }}>
                  <h5 style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    marginBottom: '20px', 
                    color: 'var(--color-text)',
                    textAlign: 'center'
                  }}>
                    トリレンマ
                  </h5>
                  
                  {/* SVG図 */}
                  <svg 
                    width="100%" 
                    height="400" 
                    viewBox="0 0 500 400"
                    style={{ maxWidth: '500px', margin: '0 auto', display: 'block' }}
                  >
                    <defs>
                      <marker
                        id="arrowhead-trilemma"
                        markerWidth="7"
                        markerHeight="7"
                        refX="6"
                        refY="2"
                        orient="auto"
                      >
                        <polygon points="0 0, 7 2, 0 4" fill="#1F2937" />
                      </marker>
                    </defs>
                    
                    {/* 三角形 */}
                    <polygon
                      points="250,80 100,320 400,320"
                      fill="#F3F4F6"
                      stroke="#1F2937"
                      strokeWidth="2"
                    />
                    
                    {/* 密度の経済（上） */}
                    <circle cx="250" cy="80" r="8" fill="#4A90E2" />
                    <text x="250" y="65" fontSize="14" fill="#1F2937" fontWeight="700" textAnchor="middle">密度の経済</text>
                    <text x="250" y="30" fontSize="12" fill="#374151" textAnchor="middle">狭い範囲を支配すると</text>
                    <text x="250" y="45" fontSize="12" fill="#374151" textAnchor="middle">コストが低減される</text>
                    
                    {/* 規模の経済（左下） */}
                    <circle cx="100" cy="320" r="8" fill="#4A90E2" />
                    <text x="100" y="305" fontSize="14" fill="#1F2937" fontWeight="700" textAnchor="middle">規模の経済</text>
                    <text x="100" y="345" fontSize="12" fill="#374151" textAnchor="middle">大規模な投資で大量に</text>
                    <text x="100" y="360" fontSize="12" fill="#374151" textAnchor="middle">生産するとコストが低減される</text>
                    
                    {/* 範囲の経済（右下） */}
                    <circle cx="400" cy="320" r="8" fill="#4A90E2" />
                    <text x="400" y="305" fontSize="14" fill="#1F2937" fontWeight="700" textAnchor="middle">範囲の経済</text>
                    <text x="400" y="345" fontSize="12" fill="#374151" textAnchor="middle">製品の種類や事業範囲を</text>
                    <text x="400" y="360" fontSize="12" fill="#374151" textAnchor="middle">広げるとコストが低減される</text>
                    
                    {/* 矢印：規模の経済 ↔ 範囲の経済 */}
                    <line x1="180" y1="280" x2="320" y2="280" stroke="#1F2937" strokeWidth="1.2" markerEnd="url(#arrowhead-trilemma)" markerStart="url(#arrowhead-trilemma)" />
                    
                    {/* 矢印：規模の経済 → 密度の経済 */}
                    <line x1="160" y1="270" x2="240" y2="120" stroke="#1F2937" strokeWidth="1.2" markerEnd="url(#arrowhead-trilemma)" />
                    
                    {/* 矢印：密度の経済 → 規模の経済 */}
                    <line x1="240" y1="120" x2="160" y2="270" stroke="#1F2937" strokeWidth="1.2" markerEnd="url(#arrowhead-trilemma)" />
                    
                    {/* 矢印：範囲の経済 → 密度の経済 */}
                    <line x1="340" y1="270" x2="260" y2="120" stroke="#1F2937" strokeWidth="1.2" markerEnd="url(#arrowhead-trilemma)" />
                    
                    {/* 矢印：密度の経済 → 範囲の経済 */}
                    <line x1="260" y1="120" x2="340" y2="270" stroke="#1F2937" strokeWidth="1.2" markerEnd="url(#arrowhead-trilemma)" />
                  </svg>
                  
                  <p style={{ 
                    fontSize: '11px', 
                    color: 'var(--color-text-light)', 
                    marginTop: '16px',
                    marginBottom: 0,
                    fontStyle: 'italic',
                    textAlign: 'center'
                  }}>
                    出典: 経済産業省若手新政策プロジェクトPIVOT作成
                  </p>
                </div>
                
                {/* 右側：3つの犠牲 */}
                <div style={{ flex: '1', minWidth: '400px' }}>
                  <h5 style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    marginBottom: '20px', 
                    color: 'var(--color-text)',
                    textAlign: 'center'
                  }}>
                    3つの犠牲
                  </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. 密度の経済の犠牲 */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: '#4A90E2' 
                    }}>
                      1
                    </span>
                    <h6 style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: 'var(--color-text)',
                      margin: 0
                    }}>
                      密度の経済の犠牲
                    </h6>
                  </div>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--color-text-light)', 
                    lineHeight: '1.6',
                    margin: 0,
                    marginBottom: '8px'
                  }}>
                    規模の経済と範囲の経済を取ると、狭い範囲を支配することによりコストを低減できる密度の経済を放棄することになる。
                  </p>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--color-text-light)', 
                    lineHeight: '1.6',
                    margin: 0,
                    fontStyle: 'italic'
                  }}>
                    例: 米中ビッグテック等のコングロマリット企業
                  </p>
                </div>

                {/* 2. 規模の経済の犠牲 */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: '#4A90E2' 
                    }}>
                      2
                    </span>
                    <h6 style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: 'var(--color-text)',
                      margin: 0
                    }}>
                      規模の経済の犠牲
                    </h6>
                  </div>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--color-text-light)', 
                    lineHeight: '1.6',
                    margin: 0,
                    marginBottom: '8px'
                  }}>
                    範囲の経済と密度の経済を取ると、大規模な投資で大量に生産することでコストを低減できる規模の経済を放棄することになる。
                  </p>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--color-text-light)', 
                    lineHeight: '1.6',
                    margin: 0,
                    fontStyle: 'italic'
                  }}>
                    例: ドイツ Mittelstand 等のグローバルニッチ企業
                  </p>
                </div>

                {/* 3. 範囲の経済の犠牲 */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: '#4A90E2' 
                    }}>
                      3
                    </span>
                    <h6 style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: 'var(--color-text)',
                      margin: 0
                    }}>
                      範囲の経済の犠牲
                    </h6>
                  </div>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--color-text-light)', 
                    lineHeight: '1.6',
                    margin: 0,
                    marginBottom: '8px'
                  }}>
                    密度の経済と規模の経済を取ると、製品の種類や事業範囲を広げることでコストを低減できる範囲の経済を放棄することになる。
                  </p>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--color-text-light)', 
                    lineHeight: '1.6',
                    margin: 0,
                    fontStyle: 'italic'
                  }}>
                    例: 新興系スタートアップ等のディスラプター企業
                  </p>
                </div>
              </div>
                </div>
              </div>
            </div>
        </div>
        </div>
      </div>
    </>
  );
}
