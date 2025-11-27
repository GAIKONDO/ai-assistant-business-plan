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
    { id: 'sme-process', name: '中小企業向け業務プロセス可視化・改善', description: '中小企業の業務プロセス可視化、効率化、経営課題の解決支援、助成金活用支援', target: '中小企業 → 従業員' },
    { id: 'medical-care-process', name: '医療・介護施設向け業務プロセス可視化・改善', description: '医療・介護施設の業務フロー可視化、記録業務の効率化、コンプライアンス対応支援', target: '医療・介護施設 → 患者・利用者' },
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
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>
            4つの事業企画
          </h3>
          <p style={{ color: 'var(--color-text-light)', fontSize: '14px', marginBottom: '16px' }}>
            4つの事業企画の立ち上げ時期、提供範囲、ターゲット、構想、差別化要因、獲得する強みをまとめています。
          </p>
        </div>

        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'space-around', flexWrap: 'wrap', marginBottom: '24px' }}>
            {/* 1. 自社開発・自社サービス事業 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '150px' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                color: '#fff'
              }}>
                <FaMobileAlt size={40} />
              </div>
              <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px', lineHeight: '1.4' }}>
                自社開発<br />自社サービス事業
              </div>
            </div>

            {/* 2. AI導入ルール設計・人材育成・教育事業 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '150px' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                color: '#fff'
              }}>
                <FaGraduationCap size={40} />
              </div>
              <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px', lineHeight: '1.4' }}>
                AI導入ルール設計<br />人材育成・教育事業
              </div>
            </div>

            {/* 3. プロセス可視化・業務コンサル事業 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '150px' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                color: '#fff'
              }}>
                <FaChartBar size={40} />
              </div>
              <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px', lineHeight: '1.4' }}>
                プロセス可視化<br />業務コンサル事業
              </div>
            </div>

            {/* 4. AI駆動開発・DX支援SI事業 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '150px' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                color: '#fff'
              }}>
                <FaLaptopCode size={40} />
              </div>
              <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px', lineHeight: '1.4' }}>
                AI駆動開発<br />DX支援SI事業
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
            各事業企画の詳細情報
          </h4>
          <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: '14px',
              backgroundColor: '#fff'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    border: '1px solid var(--color-border-color)', 
                    fontWeight: 600,
                    width: '120px'
                  }}>
                    
                  </th>
                  {Object.entries(SERVICE_NAMES).map(([id, name], index) => (
                    <th key={id} style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      border: '1px solid var(--color-border-color)', 
                      fontWeight: 600,
                      minWidth: '200px'
                    }}>
                      {index + 1}. {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#fff' }}>
                  <td style={{ 
                    padding: '12px', 
                    border: '1px solid var(--color-border-color)', 
                    fontWeight: 600,
                    backgroundColor: '#f5f5f5',
                    width: '120px'
                  }}>
                    立ち上げ時期
                  </td>
                  {Object.entries(SERVICE_NAMES).map(([id]) => (
                    <td key={id} style={{ 
                      padding: '12px', 
                      border: '1px solid var(--color-border-color)', 
                      verticalAlign: 'top'
                    }}>
                      {SERVICE_LAUNCH_TIMING[id]}
                    </td>
                  ))}
                </tr>
                <tr style={{ backgroundColor: '#fff' }}>
                  <td style={{ 
                    padding: '12px', 
                    border: '1px solid var(--color-border-color)', 
                    fontWeight: 600,
                    backgroundColor: '#f5f5f5',
                    width: '120px'
                  }}>
                    提供範囲
                  </td>
                  {Object.entries(SERVICE_NAMES).map(([id]) => (
                    <td key={id} style={{ 
                      padding: '12px', 
                      border: '1px solid var(--color-border-color)', 
                      verticalAlign: 'top'
                    }}>
                      {SERVICE_SCOPE[id]}
                    </td>
                  ))}
                </tr>
                <tr style={{ backgroundColor: '#fff' }}>
                  <td style={{ 
                    padding: '12px', 
                    border: '1px solid var(--color-border-color)', 
                    fontWeight: 600,
                    backgroundColor: '#f5f5f5',
                    width: '120px'
                  }}>
                    ターゲット
                  </td>
                  {Object.entries(SERVICE_NAMES).map(([id]) => (
                    <td key={id} style={{ 
                      padding: '12px', 
                      border: '1px solid var(--color-border-color)', 
                      verticalAlign: 'top'
                    }}>
                      {SERVICE_TARGET[id]}
                    </td>
                  ))}
                </tr>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  <td style={{ 
                    padding: '12px', 
                    border: '1px solid var(--color-border-color)', 
                    fontWeight: 600,
                    backgroundColor: '#f5f5f5',
                    width: '120px'
                  }}>
                    事業構想
                  </td>
                  {Object.entries(SERVICE_NAMES).map(([id], index) => {
                    const concepts = FIXED_CONCEPTS[id] || [];
                    return (
                      <td key={id} style={{ 
                        padding: '12px', 
                        border: '1px solid var(--color-border-color)', 
                        verticalAlign: 'top'
                      }}>
                        {concepts.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc' }}>
                            {concepts.map((concept, conceptIndex) => (
                              <li key={conceptIndex} style={{ marginBottom: '4px', fontSize: '13px' }}>
                                {concept.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ color: 'var(--color-text-light)' }}>-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr style={{ backgroundColor: '#fff' }}>
                  <td style={{ 
                    padding: '12px', 
                    border: '1px solid var(--color-border-color)', 
                    fontWeight: 600,
                    backgroundColor: '#f5f5f5',
                    width: '120px'
                  }}>
                    差別化要因
                  </td>
                  {Object.entries(SERVICE_NAMES).map(([id]) => (
                    <td key={id} style={{ 
                      padding: '12px', 
                      border: '1px solid var(--color-border-color)', 
                      verticalAlign: 'top'
                    }}>
                      {SERVICE_DIFFERENTIATION[id]}
                    </td>
                  ))}
                </tr>
                <tr style={{ backgroundColor: '#fff' }}>
                  <td style={{ 
                    padding: '12px', 
                    border: '1px solid var(--color-border-color)', 
                    fontWeight: 600,
                    backgroundColor: '#f5f5f5',
                    width: '120px'
                  }}>
                    獲得する強み
                  </td>
                  {Object.entries(SERVICE_NAMES).map(([id]) => {
                    const strengths = SERVICE_STRENGTHS[id] || [];
                    return (
                      <td key={id} style={{ 
                        padding: '12px', 
                        border: '1px solid var(--color-border-color)', 
                        verticalAlign: 'top'
                      }}>
                        {strengths.length > 0 ? (
                          <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc' }}>
                            {strengths.map((strength, strengthIndex) => (
                              <li key={strengthIndex} style={{ marginBottom: '4px', fontSize: '13px' }}>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ color: 'var(--color-text-light)' }}>-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
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
