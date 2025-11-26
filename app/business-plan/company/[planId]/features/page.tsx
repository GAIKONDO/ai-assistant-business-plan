'use client';

import { useEffect, useState, useRef } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    mermaid?: any;
  }
}

const SERVICE_NAMES: { [key: string]: string } = {
  'own-service': '自社サービス事業',
  'education-training': '人材育成・教育・AI導入ルール設計事業',
  'consulting': '業務コンサル・プロセス可視化・改善事業',
  'ai-dx': 'AI駆動開発・DX支援事業',
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
  'own-service': 'エンドユーザー',
  'ai-dx': 'システム部門',
  'consulting': '業務部門',
  'education-training': '経営層・人事部門・全社',
};

const FIXED_CONCEPTS: { [key: string]: Array<{ id: string; name: string; description: string; target: string }> } = {
  'own-service': [
    { id: 'maternity-support', name: '出産支援パーソナルアプリケーション', description: '出産前後のママとパパをサポートするパーソナルアプリケーション', target: 'エンドユーザー（ママ・パパ）' },
    { id: 'care-support', name: '介護支援パーソナルアプリケーション', description: '介護を必要とする方とその家族をサポートするパーソナルアプリケーション', target: 'エンドユーザー（介護が必要な方・家族）' },
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

  // Mermaidシーケンス図のコードを生成
  const generateMermaidDiagram = () => {
    const services = Object.keys(SERVICE_NAMES);
    let diagram = 'sequenceDiagram\n';
    diagram += '    participant 自社 as 株式会社AIアシスタント\n';
    diagram += '    participant 経営層 as 顧客企業・経営層・人事部門\n';
    diagram += '    participant 業務部門 as 顧客企業・業務部門\n';
    diagram += '    participant システム部門 as 顧客企業・システム部門\n';
    diagram += '    participant エンドユーザー as エンドユーザー<br/>(従業員・利用者)\n\n';
    
    // 各企画を追加
    services.forEach((serviceId, index) => {
      const serviceName = SERVICE_NAMES[serviceId];
      const scope = SERVICE_SCOPE[serviceId];
      const target = SERVICE_TARGET[serviceId];
      
      // 自社サービス事業の場合は直接エンドユーザーへ
      if (serviceId === 'own-service') {
        diagram += `    Note over 自社,エンドユーザー: ${serviceName}<br/>【${scope}】\n`;
        diagram += `    自社->>エンドユーザー: ${serviceName}\n`;
      } else if (serviceId === 'ai-dx') {
        // AI駆動開発・DX支援事業はシステム部門が主な顧客
        diagram += `    Note over 自社,システム部門: ${serviceName}<br/>【${scope}】<br/>ターゲット: ${target}\n`;
        diagram += `    自社->>システム部門: ${serviceName}\n`;
        diagram += `    activate システム部門\n`;
        diagram += `    システム部門->>エンドユーザー: システム導入・運用\n`;
        diagram += `    deactivate システム部門\n`;
      } else if (serviceId === 'consulting') {
        // 業務コンサル・プロセス可視化・改善事業は業務部門が主な顧客
        diagram += `    Note over 自社,業務部門: ${serviceName}<br/>【${scope}】<br/>ターゲット: ${target}\n`;
        diagram += `    自社->>業務部門: ${serviceName}\n`;
        diagram += `    activate 業務部門\n`;
        diagram += `    業務部門->>エンドユーザー: 業務改善・効率化\n`;
        diagram += `    deactivate 業務部門\n`;
      } else if (serviceId === 'education-training') {
        // 人材育成・教育・AI導入ルール設計事業は経営層・全社が主な顧客
        diagram += `    Note over 自社,経営層: ${serviceName}<br/>【${scope}】<br/>ターゲット: ${target}\n`;
        diagram += `    自社->>経営層: ${serviceName}\n`;
        diagram += `    activate 経営層\n`;
        diagram += `    経営層->>システム部門: ルール設計・ガバナンス\n`;
        diagram += `    経営層->>業務部門: 教育・研修\n`;
        diagram += `    システム部門->>エンドユーザー: AI活用支援\n`;
        diagram += `    業務部門->>エンドユーザー: 業務改善\n`;
        diagram += `    deactivate 経営層\n`;
      }
      
      if (index < services.length - 1) {
        diagram += '\n';
      }
    });

    return diagram;
  };

  useEffect(() => {
    if (!mermaidLoaded || typeof window === 'undefined' || !window.mermaid || !diagramRef.current) {
      return;
    }

    // 既にレンダリング済みまたはレンダリング中の場合はスキップ
    if (renderedRef.current || isRendering) {
      return;
    }

    const renderDiagram = async () => {
      setIsRendering(true);
      try {
        const mermaid = window.mermaid;
        const diagram = generateMermaidDiagram();
        
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
  }, [mermaidLoaded]);

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
            4つの事業企画のサービス提供フロー
          </h3>
          <p style={{ color: 'var(--color-text-light)', fontSize: '14px', marginBottom: '16px' }}>
            当社の4つの事業企画が、自社から顧客、そしてエンドユーザーへとどのようにサービスを提供するかを示しています。
          </p>
        </div>

        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
            各事業企画のターゲット範囲と顧客層
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
                    minWidth: '200px'
                  }}>
                    事業企画名
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    border: '1px solid var(--color-border-color)', 
                    fontWeight: 600,
                    minWidth: '150px'
                  }}>
                    提供範囲
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    border: '1px solid var(--color-border-color)', 
                    fontWeight: 600,
                    minWidth: '250px'
                  }}>
                    構想
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(SERVICE_NAMES).map(([id, name], index) => {
                  const concepts = FIXED_CONCEPTS[id] || [];
                  return (
                    <tr key={id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ 
                        padding: '12px', 
                        border: '1px solid var(--color-border-color)', 
                        verticalAlign: 'top'
                      }}>
                        {index + 1}. {name}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        border: '1px solid var(--color-border-color)', 
                        verticalAlign: 'top'
                      }}>
                        {SERVICE_SCOPE[id]}
                      </td>
                      <td style={{ 
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
            サービス提供の流れ（一例）
          </h4>
          <ol style={{ paddingLeft: '20px', listStyleType: 'decimal' }}>
            <li style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--color-text)' }}>
              <strong>自社サービス事業:</strong> 自社から直接エンドユーザーへサービス提供
            </li>
            <li style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--color-text)' }}>
              <strong>AI駆動開発・DX支援事業:</strong> 自社 → システム部門 → エンドユーザー
            </li>
            <li style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--color-text)' }}>
              <strong>業務コンサル・プロセス可視化・改善事業:</strong> 自社 → 業務部門 → エンドユーザー
            </li>
            <li style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--color-text)' }}>
              <strong>人材育成・教育・AI導入ルール設計事業:</strong> 自社 → 経営層 → システム部門・業務部門 → エンドユーザー
            </li>
          </ol>
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
