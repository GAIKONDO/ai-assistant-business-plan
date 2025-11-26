'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { usePlan } from '../layout';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import VegaChart from '@/components/VegaChart';

declare global {
  interface Window {
    p5?: any;
  }
}

export default function OverviewPage() {
  const { plan, loading } = usePlan();
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;
  
  // キービジュアルの高さを読み込む
  useEffect(() => {
    if (plan?.keyVisualHeight !== undefined) {
      setKeyVisualHeight(plan.keyVisualHeight);
    }
  }, [plan?.keyVisualHeight]);
  
  // キービジュアルの高さを保存
  const handleSaveKeyVisualHeight = async (height: number) => {
    if (!auth?.currentUser || !db || !planId) return;
    
    try {
      await updateDoc(doc(db, 'companyBusinessPlan', planId), {
        keyVisualHeight: height,
        updatedAt: serverTimestamp(),
      });
      setKeyVisualHeight(height);
    } catch (error) {
      console.error('キービジュアルサイズの保存エラー:', error);
    }
  };
  const aiFactoryCanvasRef = useRef<HTMLDivElement>(null);
  const cycleDiagramRef = useRef<HTMLDivElement>(null);
  const p5Loaded = useRef(false);
  const aiFactoryP5Instance = useRef<any>(null);
  const cycleP5Instance = useRef<any>(null);
  const cycleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const aiFactoryTimeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const [showArchitectureDetails, setShowArchitectureDetails] = useState(false);
  const [showArchitecturePossibilities, setShowArchitecturePossibilities] = useState(false);
  const [keyVisualHeight, setKeyVisualHeight] = useState<number>(56.25); // デフォルトは16:9のアスペクト比
  const [showSizeControl, setShowSizeControl] = useState(false);

  // すべてのフィールドが空かどうかをチェック
  const isEmpty = !plan || (
    !plan.description &&
    !plan.objectives &&
    !plan.targetMarket &&
    !plan.competitiveAdvantage &&
    !plan.keyVisualUrl
  );

  // p5.jsでAIファクトリー図を描画
  useEffect(() => {
    const initAIFactoryDiagram = () => {
      if (typeof window === 'undefined' || !window.p5 || !aiFactoryCanvasRef.current) {
        return;
      }

      // 既に描画済みの場合はスキップ
      if (aiFactoryCanvasRef.current.hasChildNodes()) {
        return;
      }

      const sketch = (p: any) => {
        p.setup = () => {
          const containerWidth = aiFactoryCanvasRef.current?.clientWidth || 600;
          const canvasWidth = Math.min(containerWidth - 32, 600);
          const canvasHeight = 600;
          p.createCanvas(canvasWidth, canvasHeight);
          p.pixelDensity(2);
        };

        p.draw = () => {
          p.background(255);
          p.textFont('sans-serif');
          
          const centerX = p.width / 2;
          const centerY = p.height / 2;
          const cycleRadius = 120;
          
          // 円形サイクル図を描画
          p.push();
          p.translate(centerX, centerY);
          
          // 4つの円とテキスト
          const cycleItems = [
            { angle: -90, text: 'さらなる\nデータ' },
            { angle: 0, text: 'より良い\nアルゴリズム' },
            { angle: 90, text: 'より良い\nサービス' },
            { angle: 180, text: 'さらなる\n利用' },
          ];
          
          // 矢印を描画（時計回り）
          p.stroke(0);
          p.strokeWeight(3);
          p.noFill();
          for (let i = 0; i < cycleItems.length; i++) {
            const startAngle = p.radians(cycleItems[i].angle);
            const endAngle = p.radians(cycleItems[(i + 1) % cycleItems.length].angle);
            const startX = p.cos(startAngle) * cycleRadius;
            const startY = p.sin(startAngle) * cycleRadius;
            const endX = p.cos(endAngle) * cycleRadius;
            const endY = p.sin(endAngle) * cycleRadius;
            
            // 矢印の線
            p.line(startX, startY, endX, endY);
            
            // 矢印の先端
            const arrowAngle = p.atan2(endY - startY, endX - startX);
            const arrowSize = 10;
            p.push();
            p.translate(endX, endY);
            p.rotate(arrowAngle);
            p.beginShape();
            p.vertex(0, 0);
            p.vertex(-arrowSize, -arrowSize / 2);
            p.vertex(-arrowSize, arrowSize / 2);
            p.endShape(p.CLOSE);
            p.pop();
          }
          
          // 円とテキストを描画
          p.fill(255);
          p.stroke(0);
          p.strokeWeight(2);
          for (let i = 0; i < cycleItems.length; i++) {
            const angle = p.radians(cycleItems[i].angle);
            const x = p.cos(angle) * cycleRadius;
            const y = p.sin(angle) * cycleRadius;
            
            // 円
            p.circle(x, y, 80);
            
            // テキスト
            p.fill(0);
            p.noStroke();
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(14);
            p.text(cycleItems[i].text, x, y);
          }
          
          p.pop();
          
          p.noLoop();
        };
      };

      aiFactoryP5Instance.current = new window.p5(sketch, aiFactoryCanvasRef.current);
    };

    if (p5Loaded.current && typeof window !== 'undefined' && window.p5) {
      initAIFactoryDiagram();
    }

    const handleP5Loaded = () => {
      p5Loaded.current = true;
      if (typeof window !== 'undefined' && window.p5) {
        const timeoutId = setTimeout(() => {
          initAIFactoryDiagram();
        }, 100);
        aiFactoryTimeoutRefs.current.push(timeoutId);
      }
    };

    window.addEventListener('p5loaded', handleP5Loaded);
    
    // 既にp5.jsが読み込まれている場合
    if (typeof window !== 'undefined' && window.p5) {
      p5Loaded.current = true;
      const timeoutId = setTimeout(() => {
        initAIFactoryDiagram();
      }, 100);
      aiFactoryTimeoutRefs.current.push(timeoutId);
    }

    return () => {
      window.removeEventListener('p5loaded', handleP5Loaded);
      
      // setTimeoutをクリーンアップ
      aiFactoryTimeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      aiFactoryTimeoutRefs.current = [];
      
      // p5.jsインスタンスをクリーンアップ
      if (aiFactoryP5Instance.current) {
        try {
          aiFactoryP5Instance.current.remove();
        } catch (e) {
          // エラーは無視（既に削除されている可能性がある）
        }
        aiFactoryP5Instance.current = null;
      }
      // DOM要素もクリア
      if (aiFactoryCanvasRef.current) {
        aiFactoryCanvasRef.current.innerHTML = '';
      }
    };
  }, []);

  // p5.jsでデータ循環ループ図を描画
  useEffect(() => {
    const initCycleDiagram = () => {
      if (typeof window === 'undefined' || !window.p5 || !cycleDiagramRef.current) {
        return false; // 失敗した場合はfalseを返す
      }

      // 既に描画済みの場合はスキップ
      if (cycleDiagramRef.current.hasChildNodes()) {
        return true; // 既に描画済みの場合はtrueを返す
      }

      const sketch = (p: any) => {
        const labels = [
          "さらなる\nデータ",
          "より良い\nアルゴリズム",
          "より良い\nサービス",
          "さらなる\n利用"
        ];

        // Brain Human Hybrid Neural Fieldスタイル: 静的な背景を描画
        const NUM_PARTICLES = 5000;
        const STEPS_PER_PARTICLE = 200;
        const NOISE_SCALE = 0.003;
        const particles: any[] = [];
        const nodes: any[] = [];
        let nodeR = 42;  // 各ノードの半径
        let bigR = 95;   // ノードを並べる大きい円の半径

        // drawNodesAndLabels関数を先に定義（p.setupより前）
        const drawNodesAndLabels = () => {
          const cx = p.width / 2;
          const cy = p.height / 2 + 10;
          const outerRadius = bigR + 30; // ノードの外側に配置

          // 外側の循環矢印を描画（5重の円で立体感を表現）
          p.noFill();
          
          // 5重の円弧を描画（内側から外側に向かって濃く）
          const numLayers = 5;
          const layerSpacing = 3; // 各層の間隔
          const startRadius = outerRadius - (numLayers - 1) * layerSpacing / 2;
          
          for (let layer = 0; layer < numLayers; layer++) {
            const radius = startRadius + layer * layerSpacing;
            // 内側から外側に向かって透明度を段階的に増加（5 → 30）
            const opacity = 5 + (layer / (numLayers - 1)) * 25;
            // 内側から外側に向かってストロークの太さを段階的に増加（0.3 → 0.7）
            const strokeWeight = 0.3 + (layer / (numLayers - 1)) * 0.4;
            
            p.stroke(0, opacity);
            p.strokeWeight(strokeWeight);
            
            for (let i = 0; i < 4; i++) {
              const startAngle = -p.HALF_PI + i * p.HALF_PI + 0.3;
              const endAngle = -p.HALF_PI + ((i + 1) % 4) * p.HALF_PI - 0.3;
              
              // 円弧を描画
              p.arc(cx, cy, radius * 2, radius * 2, startAngle, endAngle);
            }
          }
          
          // 矢印の先端（最も外側の円に合わせる）
          const outermostRadius = startRadius + (numLayers - 1) * layerSpacing;
          for (let i = 0; i < 4; i++) {
            const endAngle = -p.HALF_PI + ((i + 1) % 4) * p.HALF_PI - 0.3;
            const tipX = cx + p.cos(endAngle) * outermostRadius;
            const tipY = cy + p.sin(endAngle) * outermostRadius;
            
            // 矢印の左右（少し内側・角度をずらす）
            const arrowSize = 6;
            const leftAngle = endAngle + p.PI * 0.75;
            const rightAngle = endAngle - p.PI * 0.75;
            const leftX = tipX + p.cos(leftAngle) * arrowSize;
            const leftY = tipY + p.sin(leftAngle) * arrowSize;
            const rightX = tipX + p.cos(rightAngle) * arrowSize;
            const rightY = tipY + p.sin(rightAngle) * arrowSize;
            
            p.fill(0, 30); // 矢印は少し濃く
            p.noStroke();
            p.triangle(tipX, tipY, leftX, leftY, rightX, rightY);
            p.noFill();
          }

          // ノードの円を描画（モノトーンアート風、確実に表示）
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const x = node.x;
            const y = node.y;

            // 背景の白い円（粒子の線を隠す）
            p.noStroke();
            p.fill(255);
            p.ellipse(x, y, nodeR * 2 + 6, nodeR * 2 + 6);
            
            // 外側の円（薄い）
            p.stroke(0, 12);
            p.strokeWeight(0.5);
            p.noFill();
            p.ellipse(x, y, nodeR * 2 + 4, nodeR * 2 + 4);
            
            // メインの円（少し濃い）
            p.stroke(0, 35);
            p.strokeWeight(0.8);
            p.fill(255);
            p.ellipse(x, y, nodeR * 2, nodeR * 2);
            
            // 内側の円（アクセント）
            p.stroke(0, 20);
            p.strokeWeight(0.4);
            p.noFill();
            p.ellipse(x, y, nodeR * 1.4, nodeR * 1.4);

            // ラベル（モノトーン、確実に読めるように）
            p.noStroke();
            p.fill(0, 255); // すべてのラベルを完全に不透明な黒で濃く表示
            p.textSize(13);
            p.textFont("sans-serif");
            p.textAlign(p.CENTER, p.CENTER);
            p.text(labels[i], x, y);
          }
        };

        // drawParticle関数を先に定義
        const drawParticle = (particle: any, p: any, nodes: any[], noiseScale: number, bigR: number, nodeR: number) => {
          const currentNode = nodes[particle.nodeIndex];
          const nextNode = nodes[currentNode.nextIndex];

          // パーリンノイズによる基本の流れ（有機的）
          const angle = p.noise(particle.x * noiseScale, particle.y * noiseScale) * p.TWO_PI * 3.0;
          let vx = p.cos(angle) * 0.3;
          let vy = p.sin(angle) * 0.3;

          // 現在のノードからの反発力（ノード周辺に留まる）
          const dxFromCurrent = particle.x - currentNode.x;
          const dyFromCurrent = particle.y - currentNode.y;
          const distFromCurrent = p.sqrt(dxFromCurrent * dxFromCurrent + dyFromCurrent * dyFromCurrent);
          if (distFromCurrent > 0.001) {
            const repelStrength = 0.15 / (distFromCurrent * 0.01 + 1.0);
            vx -= (dxFromCurrent / distFromCurrent) * repelStrength;
            vy -= (dyFromCurrent / distFromCurrent) * repelStrength;
          }

          // 次のノードへの引力（循環の流れ）
          const dxToNext = nextNode.x - particle.x;
          const dyToNext = nextNode.y - particle.y;
          const distToNext = p.sqrt(dxToNext * dxToNext + dyToNext * dyToNext);
          if (distToNext > 0.001) {
            const attractStrength = 0.2 / (distToNext * 0.005 + 1.0);
            vx += (dxToNext / distToNext) * attractStrength;
            vy += (dyToNext / distToNext) * attractStrength;
          }

          // 円周に沿った流れ（循環の方向性）- 右回転（時計回り）
          const cx = p.width / 2;
          const cy = p.height / 2 + 10;
          const dx = particle.x - cx;
          const dy = particle.y - cy;
          const distFromCenter = p.sqrt(dx * dx + dy * dy);
          if (distFromCenter > 0.001) {
            // 右回転（時計回り）の接線方向の力
            const tangentX = -dy / distFromCenter;
            const tangentY = dx / distFromCenter;
            const tangentStrength = 0.15; // 右回転をより明確にするため強度を上げる
            vx += tangentX * tangentStrength;
            vy += tangentY * tangentStrength;
          }

          // 進行
          const ox = particle.x;
          const oy = particle.y;
          particle.x += vx;
          particle.y += vy;

          // 境界チェック：5重の円よりも少しだけはみ出るくらいに広げる
          // 5重の円の最も外側の半径を計算
          const outerRadius = bigR + 30;
          const numLayers = 5;
          const layerSpacing = 3;
          const startRadius = outerRadius - (numLayers - 1) * layerSpacing / 2;
          const outermostRadius = startRadius + (numLayers - 1) * layerSpacing;
          const particleMaxRadius = outermostRadius + 40; // もっと大きく外にはみ出る
          
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

          // 元の位置から線を引く（流れるような線）
          p.line(ox, oy, particle.x, particle.y);
        };

        p.setup = () => {
          const containerWidth = cycleDiagramRef.current?.clientWidth || 400;
          const canvasWidth = Math.min(containerWidth - 32, 400);
          const canvasHeight = 350;
          p.createCanvas(canvasWidth, canvasHeight);
          p.pixelDensity(2);
          p.background(255);
          p.stroke(0, 18); // 黒の線を見やすく（透明度18）
          p.strokeWeight(0.4);
          p.noFill();

          const cx = p.width / 2;
          const cy = p.height / 2 + 10;
          bigR = 95;   // ノードを並べる大きい円の半径
          nodeR = 42;  // 各ノードの半径

          // ノードの位置を計算
          for (let i = 0; i < 4; i++) {
            let angle = -p.HALF_PI + i * p.HALF_PI; // 上から時計回りに4つ
            let x = cx + p.cos(angle) * bigR;
            let y = cy + p.sin(angle) * bigR;
            nodes.push({ x, y, angle, nextIndex: (i + 1) % 4 });
          }

          // 粒子を各ノード周辺に配置
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

          // 非同期で描画（パフォーマンス向上、Brainスタイル）
          let stepCount = 0;
          const drawStep = () => {
            if (stepCount >= STEPS_PER_PARTICLE) {
              // ノードとラベルを最後に描画（上に表示）
              drawNodesAndLabels();
              p.noLoop(); // 描画完了後、ループを停止（静的な背景）
              return;
            }

            const batchSize = 10; // 一度に処理するステップ数
            for (let s = 0; s < batchSize && stepCount < STEPS_PER_PARTICLE; s++) {
              particles.forEach((particle) => {
                drawParticle(particle, p, nodes, NOISE_SCALE, bigR, nodeR);
              });
              stepCount++;
            }

            if (stepCount < STEPS_PER_PARTICLE) {
              setTimeout(drawStep, 0);
            } else {
              // ノードとラベルを最後に描画（上に表示）
              drawNodesAndLabels();
              p.noLoop(); // 描画完了後、ループを停止（静的な背景）
            }
          };

          drawStep();
        };

        p.draw = () => {
          // 描画中は何もしない（setupで描画、Brainスタイル）
        };
      };

      cycleP5Instance.current = new window.p5(sketch, cycleDiagramRef.current);
      return true; // 成功した場合はtrueを返す
    };

    const tryInit = () => {
      if (initCycleDiagram()) {
        return; // 成功した場合は終了
      }
      // 失敗した場合は再試行
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
    
    // 既にp5.jsが読み込まれている場合（リロード時など）
    if (typeof window !== 'undefined' && window.p5) {
      p5Loaded.current = true;
      // 少し待ってから初期化（DOMの準備を待つ）
      const timeoutId = setTimeout(() => {
        tryInit();
      }, 200);
      cycleTimeoutRefs.current.push(timeoutId);
    } else {
      // p5.jsがまだ読み込まれていない場合、定期的にチェック
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

      // 10秒後にタイムアウト
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
      
      // setIntervalをクリーンアップ
      if (cycleCheckIntervalRef.current) {
        clearInterval(cycleCheckIntervalRef.current);
        cycleCheckIntervalRef.current = null;
      }
      
      // setTimeoutをクリーンアップ
      cycleTimeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      cycleTimeoutRefs.current = [];
      
      // p5.jsインスタンスをクリーンアップ
      if (cycleP5Instance.current) {
        try {
          cycleP5Instance.current.remove();
        } catch (e) {
          // エラーは無視（既に削除されている可能性がある）
        }
        cycleP5Instance.current = null;
      }
      // DOM要素もクリア
      if (cycleDiagramRef.current) {
        cycleDiagramRef.current.innerHTML = '';
      }
    };
  }, []);


  // p5.jsの読み込み状態をチェック
  useEffect(() => {
    if (typeof window !== 'undefined' && window.p5) {
      p5Loaded.current = true;
      window.dispatchEvent(new Event('p5loaded'));
    }
  }, []);

  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        概要・コンセプト
      </p>
      
      {/* キービジュアル画像 */}
      <div className="card" style={{ marginBottom: '24px', padding: 0, overflow: 'hidden', position: 'relative' }}>
        {plan?.keyVisualUrl ? (
          <div style={{ position: 'relative', width: '100%', paddingTop: `${keyVisualHeight}%`, backgroundColor: '#f8f9fa' }}>
            <img
              src={plan.keyVisualUrl}
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
            {/* キービジュアル変更ボタン（右下に配置） */}
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
                onClick={() => router.push(`/business-plan/company/${planId}/overview/upload-key-visual`)}
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
              onClick={() => router.push(`/business-plan/company/${planId}/overview/upload-key-visual`)}
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
        {isEmpty ? (
          <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
            概要・コンセプトの内容はここに表示されます。
          </p>
        ) : (
          <>
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
            はじめに
          </h3>
          <div style={{ color: 'var(--color-text)', lineHeight: '1.8', fontSize: '14px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                1. AIファーストカンパニーとは
              </h4>
              <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                産業の競争力は「人と資産中心」から「アルゴリズム（AI）とネットワーク中心」へと変化している。このパラダイムに転換した企業が「AIファーストカンパニー」である。
              </p>
              <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                その中核装置が「AIファクトリー」であり、データ→アルゴリズム→サービス→利用→データという自己強化の循環系を実現する仕組みである。
              </p>
            </div>
            
          {/* 自己強化の循環系 */}
          <div style={{ marginTop: '24px', marginBottom: '32px', paddingLeft: '11px' }}>
            <div style={{ 
              width: '100%', 
              maxWidth: '800px',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <div ref={cycleDiagramRef} style={{ width: '100%', maxWidth: '400px' }} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '12px', fontStyle: 'italic', textAlign: 'center' }}>
              出典: マルコ・イアンシティ; カリム・R・ラカーニ; 吉田素文、AIファースト・カンパニー: アルゴリズムとネットワークが経済を支配する新時代の経営戦略(p.234). 英治出版株式会社.
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                2. AIの真価
              </h4>
              <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                AIの真価は、以下において新たな可能性を開くことにある。
              </p>
              <ul style={{ marginBottom: '12px', paddingLeft: '32px', listStyleType: 'disc' }}>
                <li style={{ marginBottom: '8px' }}>これまでマネタイズができなかった領域（採算が取れなかった領域）</li>
                <li style={{ marginBottom: '8px' }}>費用対効果の観点からパーソナライズ化やユーザーフレンドリーなUI設計が困難だった領域</li>
              </ul>
              
              {/* AIの真価バブルチャート（Vega-Lite版） */}
              <div style={{ marginTop: '32px', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ marginBottom: '16px', width: '100%', maxWidth: '1200px' }}>
                  <h5 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' }}>
                    AIは「不可能だった価値」を可能にする
                  </h5>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 600 }}>
                    🟡 黄色の領域 = AIが「不可能 → 可能」にした新しい価値の場所
                  </p>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 600 }}>
                    ⚪ 点線の丸 = 従来から可能だった領域（従来IT / DX）
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <VegaChart
                  language="vega-lite"
                  title=""
                  spec={{
                    "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
                    "width": 600,
                    "height": 500,
                    "data": {
                      "values": [
                        {
                          "category": "従来のIT/DX",
                          "name": "レガシーシステム",
                          "costEffectiveness": 0.8,
                          "monetization": 0.2,
                          "size": 30,
                          "subDescription": "人手依存・スケール不能・属人化"
                        },
                        {
                          "category": "従来のIT/DX",
                          "name": "パッケージソフト",
                          "costEffectiveness": 0.7,
                          "monetization": 0.65,
                          "size": 50,
                          "subDescription": "標準化されたソリューション"
                        },
                        {
                          "category": "従来のIT/DX",
                          "name": "従来のITシステム",
                          "costEffectiveness": 0.6,
                          "monetization": 0.5,
                          "size": 40,
                          "subDescription": "基幹システム・業務システム"
                        },
                        {
                          "category": "従来のIT/DX",
                          "name": "カスタム開発",
                          "costEffectiveness": 0.3,
                          "monetization": 0.75,
                          "size": 60,
                          "subDescription": "大規模開発・高収益"
                        },
                        {
                          "category": "従来のIT/DX",
                          "name": "DX",
                          "costEffectiveness": 0.35,
                          "monetization": 0.7,
                          "size": 55,
                          "subDescription": "効率は上がるが差別化しにくい"
                        },
                        {
                          "category": "AIの真価が開く領域",
                          "name": "マネタイズができなかった領域",
                          "costEffectiveness": 0.25,
                          "monetization": 0.25,
                          "size": 300,
                          "description": "採算が取れなかった領域",
                          "subDescription": "ほぼゼロ限界コスト・超スケール"
                        },
                        {
                          "category": "AIの真価が開く領域",
                          "name": "パーソナライズ化が困難だった領域",
                          "costEffectiveness": 0.25,
                          "monetization": 0.75,
                          "size": 300,
                          "description": "費用対効果の観点から困難だった領域",
                          "subDescription": "超個別最適・設計が複雑すぎた"
                        }
                      ]
                    },
                    "layer": [
                      {
                        "mark": {
                          "type": "rule",
                          "stroke": "#000",
                          "strokeWidth": 2
                        },
                        "encoding": {
                          "x": {"datum": 0.5}
                        }
                      },
                      {
                        "mark": {
                          "type": "rule",
                          "stroke": "#000",
                          "strokeWidth": 2
                        },
                        "encoding": {
                          "y": {"datum": 0.5}
                        }
                      },
                      {
                        "mark": {
                          "type": "circle",
                          "opacity": 0.85,
                          "stroke": "#FFA500",
                          "strokeWidth": 1.5,
                          "strokeOpacity": 0.6,
                          "fill": "#FFD700"
                        },
                        "encoding": {
                          "x": {
                            "field": "costEffectiveness",
                            "type": "quantitative",
                            "scale": {"domain": [0, 1]},
                            "title": "実現難易度・運用コスト（右に行くほど難しい・高コスト）",
                            "axis": {
                              "gridOpacity": 0.2,
                              "titleFontSize": 12,
                              "titleFontWeight": "bold"
                            }
                          },
                          "y": {
                            "field": "monetization",
                            "type": "quantitative",
                            "scale": {"domain": [0, 1]},
                            "title": "ビジネス価値・収益ポテンシャル（高いほど売れる・広がる）",
                            "axis": {
                              "gridOpacity": 0.2,
                              "titleFontSize": 12,
                              "titleFontWeight": "bold"
                            }
                          },
                          "size": {
                            "field": "size",
                            "type": "quantitative",
                            "scale": {"range": [100, 3000]},
                            "legend": null
                          },
                          "color": {
                            "field": "category",
                            "type": "nominal",
                            "scale": {
                              "domain": ["AIの真価が開く領域"],
                              "range": ["#FFD700"]
                            },
                            "legend": null
                          },
                          "fillOpacity": {
                            "value": 0.75
                          }
                        },
                        "transform": [
                          {"filter": "datum.category === 'AIの真価が開く領域'"}
                        ]
                      },
                      {
                        "mark": {
                          "type": "circle",
                          "fill": "transparent",
                          "stroke": "#999",
                          "strokeWidth": 2,
                          "strokeDash": [5, 5],
                          "opacity": 0.6
                        },
                        "encoding": {
                          "x": {
                            "field": "costEffectiveness",
                            "type": "quantitative",
                            "scale": {"domain": [0, 1], "reverse": true}
                          },
                          "y": {
                            "field": "monetization",
                            "type": "quantitative",
                            "scale": {"domain": [0, 1]}
                          },
                          "size": {
                            "field": "size",
                            "type": "quantitative",
                            "scale": {"range": [100, 3000]}
                          }
                        },
                        "transform": [
                          {"filter": "datum.category === '従来のIT/DX'"}
                        ]
                      },
                      {
                        "mark": {
                          "type": "text",
                          "fontSize": 10,
                          "fontWeight": "bold",
                          "dy": -8,
                          "fill": {
                            "field": "category",
                            "scale": {
                              "domain": ["従来のIT/DX", "AIの真価が開く領域"],
                              "range": ["#666", "#000"]
                            }
                          }
                        },
                        "encoding": {
                          "x": {
                            "field": "costEffectiveness",
                            "type": "quantitative"
                          },
                          "y": {
                            "field": "monetization",
                            "type": "quantitative"
                          },
                          "text": {
                            "field": "name"
                          }
                        }
                      },
                      {
                        "mark": {
                          "type": "text",
                          "fontSize": 7,
                          "fill": {
                            "field": "category",
                            "scale": {
                              "domain": ["従来のIT/DX", "AIの真価が開く領域"],
                              "range": ["#888", "#B8860B"]
                            }
                          },
                          "dy": 10
                        },
                        "encoding": {
                          "x": {
                            "field": "costEffectiveness",
                            "type": "quantitative"
                          },
                          "y": {
                            "field": "monetization",
                            "type": "quantitative"
                          },
                          "text": {
                            "field": "subDescription"
                          }
                        },
                        "transform": [
                          {"filter": "datum.subDescription"}
                        ]
                      },
                      {
                        "mark": {
                          "type": "text",
                          "fontSize": 8,
                          "fill": "#666",
                          "dy": 20
                        },
                        "encoding": {
                          "x": {
                            "field": "costEffectiveness",
                            "type": "quantitative"
                          },
                          "y": {
                            "field": "monetization",
                            "type": "quantitative"
                          },
                          "text": {
                            "field": "description"
                          }
                        },
                        "transform": [
                          {"filter": "datum.description"}
                        ]
                      },
                      {
                        "data": {
                          "values": [
                            {"x": 0.85, "y": 0.85, "label": "従来から\n可能だった領域", "xOffset": -60, "yOffset": -20},
                            {"x": 0.15, "y": 0.85, "label": "AIによって\n解放された領域", "xOffset": -60, "yOffset": -20},
                            {"x": 0.85, "y": 0.15, "label": "従来から\n可能だった領域", "xOffset": -60, "yOffset": -20},
                            {"x": 0.15, "y": 0.15, "label": "AIによって\n解放された領域", "xOffset": -60, "yOffset": -20}
                          ]
                        },
                        "mark": {
                          "type": "rect",
                          "fill": "white",
                          "opacity": 0.85,
                          "stroke": "#ddd",
                          "strokeWidth": 1,
                          "cornerRadius": 4,
                          "width": 120,
                          "height": 40
                        },
                        "encoding": {
                          "x": {"field": "x", "type": "quantitative"},
                          "y": {"field": "y", "type": "quantitative"},
                          "xOffset": {"field": "xOffset", "type": "quantitative"},
                          "yOffset": {"field": "yOffset", "type": "quantitative"}
                        }
                      },
                      {
                        "data": {
                          "values": [
                            {"x": 0.85, "y": 0.85, "label": "従来から\n可能だった領域"},
                            {"x": 0.15, "y": 0.85, "label": "AIによって\n解放された領域"},
                            {"x": 0.85, "y": 0.15, "label": "従来から\n可能だった領域"},
                            {"x": 0.15, "y": 0.15, "label": "AIによって\n解放された領域"}
                          ]
                        },
                        "mark": {
                          "type": "text",
                          "fontSize": 11,
                          "fontWeight": "bold",
                          "fill": "#333",
                          "align": "center",
                          "baseline": "middle"
                        },
                        "encoding": {
                          "x": {"field": "x", "type": "quantitative"},
                          "y": {"field": "y", "type": "quantitative"},
                          "text": {"field": "label"}
                        }
                      }
                    ]
                  }}
                />
                </div>
              </div>
              
              <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                AIを活用することで、ユーザー負荷を最小化し、理想のオペレーションを実現できる。
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                3. AIネイティブ設計
              </h4>
              <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                AIネイティブ設計とは、AIの活用を前提として、AIファクトリーの自己強化の循環系を高速回転させることを意識した設計である。
              </p>
              <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                この設計により、以下の効果が得られる。
              </p>
              <ul style={{ marginBottom: '12px', paddingLeft: '32px', listStyleType: 'disc' }}>
                <li style={{ marginBottom: '8px' }}>AIアシスタントへの指示が明確になる</li>
                <li style={{ marginBottom: '8px' }}>データが集まり、継続的な改良が可能になる</li>
                <li style={{ marginBottom: '8px' }}>ユーザー体験の向上により、データ収集→アルゴリズム改善→サービス向上→利用拡大という好循環が生まれる</li>
              </ul>
              <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                この好循環の起点は、ユーザーフレンドリーな設計である。
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                4. AI活用アーキテクチャ
              </h4>
              <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                本アーキテクチャは、<strong>事業でAIを活用するためのアーキテクチャ</strong>であり、<strong>「統合と分散の両立」</strong>を実現するAI活用システムを提案する。会社全体の標準化されたAI活用と、個人・各組織のカスタマイズされたAI活用を、同一の基盤AIモデル上で実現する。
              </p>
              <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                高性能なLLMを会社として一元管理し、全ユーザーがAPIを通じてアクセスできる環境を整備。全社統合データと個人・組織分散データの両方を効果的に活用し、AI Agentが基盤AIモデルと各データソースを適切に連携させることで、精度の高い成果物を生成する。
              </p>
              
              {/* AI活用アーキテクチャ図 */}
              <div style={{ marginTop: '24px', marginBottom: '24px', paddingLeft: '11px' }}>
                <div style={{ 
                  width: '100%', 
                  overflowX: 'auto',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <svg width="1400" height="800" viewBox="0 0 1400 800" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%', height: 'auto' }}>
                      {/* 背景グラデーション */}
                      <defs>
                      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#F9FAFB",stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:"#FFFFFF",stopOpacity:1}} />
                      </linearGradient>
                      
                      {/* ホバーエフェクト用のフィルター */}
                      <filter id="hoverGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      
                      {/* 矢印マーカー */}
                      <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="#4169E1" />
                      </marker>
                      
                      {/* 対応関係を示すスタイル */}
                      <style>{`
                        .arch-box { cursor: pointer; transition: all 0.15s ease; transform-origin: center; }
                        .arch-box:hover { filter: url(#hoverGlow); transform: scale(1.02); }
                        .arch-text { pointer-events: none; }
                        .corresponding-group { opacity: 0.7; transition: opacity 0.15s ease; }
                        .arch-box:hover ~ .corresponding-group,
                        .corresponding-group:hover { opacity: 1; }
                      `}</style>
                      <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor:"#1F2933",stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:"#2E3440",stopOpacity:1}} />
                      </linearGradient>
                      <linearGradient id="boxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#ffffff",stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:"#F9FAFB",stopOpacity:1}} />
                      </linearGradient>
                      <linearGradient id="boxGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#ffffff",stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:"#F9FAFB",stopOpacity:1}} />
                      </linearGradient>
                      <linearGradient id="boxGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#F9FAFB",stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:"#E5E7EB",stopOpacity:0.3}} />
                      </linearGradient>
                      <linearGradient id="boxGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#F9FAFB",stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:"#E5E7EB",stopOpacity:0.5}} />
                      </linearGradient>
                      <linearGradient id="boxGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#F9FAFB",stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:"#E5E7EB",stopOpacity:0.4}} />
                      </linearGradient>
                      <linearGradient id="importantDataGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#F0F9F4",stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:"#E8F5ED",stopOpacity:1}} />
                      </linearGradient>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.1"/>
                      </filter>
                    </defs>
                    {/* 背景 */}
                    <rect width="1400" height="800" fill="url(#bgGradient)" rx="12"/>
                    
                    {/* 上部ヘッダー */}
                    {/* 会社としての管理対象 */}
                    <rect x="300" y="50" width="500" height="60" fill="url(#headerGradient)" rx="8" filter="url(#shadow)"/>
                    <text x="550" y="85" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#FFFFFF">会社としてのAI活用</text>
                    
                    {/* 個人としての管理対象 */}
                    <rect x="850" y="50" width="500" height="60" fill="url(#headerGradient)" rx="8" filter="url(#shadow)"/>
                    <text x="1100" y="85" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#FFFFFF">個人・各組織としてのAI活用</text>
                    
                    {/* 環境レイヤー（二段目） */}
                    {/* 左側：環境 */}
                    <rect className="arch-box" x="50" y="600" width="200" height="80" fill="url(#boxGradient5)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="150" y="630" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">環境</text>
                    
                    {/* 中央：オンプレ・クラウド */}
                    <rect className="arch-box corresponding-group" x="300" y="600" width="500" height="80" fill="url(#boxGradient5)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="550" y="630" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">環境/ネットワーク</text>
                    <text className="arch-text" x="550" y="655" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#666">オンプレ クラウド</text>
                    
                    {/* 右側：ローカル・クラウド */}
                    <rect className="arch-box corresponding-group" x="850" y="600" width="500" height="80" fill="white" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1100" y="630" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">環境/ネットワーク</text>
                    <text className="arch-text" x="1100" y="655" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#666">ローカル クラウド</text>
                    
                    {/* 重要なデータソースレイヤー（三段目） */}
                    {/* 左側：重要なデータソース */}
                    <rect className="arch-box" x="50" y="500" width="200" height="80" fill="url(#boxGradient4)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="150" y="530" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">重要なデータソース</text>

                    {/* 中央：全社統合システム */}
                    <rect className="arch-box corresponding-group" x="300" y="500" width="500" height="80" fill="url(#boxGradient4)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="550" y="530" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">重要なデータソース</text>
                    <text className="arch-text" x="550" y="555" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#666">全社統合システム：データレイク・データウェアハウス</text>
                    
                    {/* 右側：個人データソース */}
                    {/* メール */}
                    <rect className="arch-box corresponding-group" x="850" y="500" width="150" height="80" fill="url(#importantDataGradient)" stroke="#1F3D2B" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="925" y="530" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#1F3D2B">重要なデータソース</text>
                    <text className="arch-text" x="925" y="555" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#1F3D2B">メール</text>
                    
                    {/* チャット履歴 */}
                    <rect className="arch-box corresponding-group" x="1020" y="500" width="150" height="80" fill="url(#importantDataGradient)" stroke="#1F3D2B" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1095" y="530" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#1F3D2B">重要なデータソース</text>
                    <text className="arch-text" x="1095" y="555" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#1F3D2B">チャット履歴</text>
                    
                    {/* 組織ごとのストレージ */}
                    <rect className="arch-box corresponding-group" x="1190" y="500" width="160" height="80" fill="url(#importantDataGradient)" stroke="#1F3D2B" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1270" y="530" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#1F3D2B">重要なデータソース</text>
                    <text className="arch-text" x="1270" y="555" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#1F3D2B">組織ごとのストレージ</text>
                    
                    {/* メールからAI Agentへの矢印 */}
                    <line x1="925" y1="500" x2="1100" y2="240" stroke="#4169E1" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                    
                    {/* チャット履歴からAI Agentへの矢印 */}
                    <line x1="1095" y1="500" x2="1100" y2="240" stroke="#4169E1" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                    
                    {/* 組織ごとのストレージからAI Agentへの矢印 */}
                    <line x1="1270" y1="500" x2="1100" y2="240" stroke="#4169E1" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                    
                    {/* AI活用領域レイヤー（四段目） */}
                    {/* 左側：AI活用領域 */}
                    <rect className="arch-box" x="50" y="200" width="200" height="280" fill="url(#boxGradient2)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="150" y="230" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">AI活用領域</text>
                    
                    {/* 中央：LLM */}
                    <rect className="arch-box" x="300" y="300" width="500" height="180" fill="url(#boxGradient3)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="550" y="330" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">基盤AIモデル</text>
                    <text className="arch-text" x="550" y="355" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#666">LLM：会社として性能の良いモデルを活用できる場を整え</text>
                    <text className="arch-text" x="550" y="375" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#666">各社員はそのLLMにAPIでつなぐ使い方</text>
                    
                    {/* 右側：データ範囲指定 */}
                    <rect className="arch-box corresponding-group" x="850" y="400" width="500" height="80" fill="white" stroke="#4169E1" strokeWidth="2" strokeDasharray="5,5" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1100" y="430" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">データ整理・可視化：Python スクリプト作成/AI Cording</text>
                    
                    {/* 右側：AIによる成果物 */}
                    <rect className="arch-box corresponding-group" x="850" y="300" width="500" height="80" fill="url(#boxGradient)" stroke="#4169E1" strokeWidth="2" strokeDasharray="5,5" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1100" y="330" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">参照データ範囲指定</text>
                    
                    {/* AI Agentレイヤー（六段目） */}
                    {/* 中央：AI Agent */}
                    <rect className="arch-box corresponding-group" x="300" y="200" width="500" height="80" fill="url(#boxGradient2)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="550" y="230" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">AI Agent</text>
                    
                    {/* 右側：AI Agent */}
                    <rect className="arch-box corresponding-group" x="850" y="200" width="500" height="80" fill="white" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1100" y="230" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">AI Agent</text>
                    
                    {/* 基盤AIモデルから右のAI Agentへの矢印 */}
                    <line x1="800" y1="390" x2="850" y2="240" stroke="#4169E1" strokeWidth="3" markerEnd="url(#arrowhead)"/>
                    <text x="825" y="355" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#111827">API</text>
                    
                    {/* 基盤AIモデルからPython スクリプト作成への矢印 */}
                    <line x1="800" y1="390" x2="850" y2="440" stroke="#4169E1" strokeWidth="3" markerEnd="url(#arrowhead)"/>
                    <text x="825" y="435" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#111827">API</text>
                    
                    {/* 枠線から会社としてのAI Agentへの矢印 */}
                    <line x1="550" y1="300" x2="550" y2="280" stroke="#4169E1" strokeWidth="3" markerEnd="url(#arrowhead)"/>
                    <text x="570" y="294" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#111827">API</text>
                    
                    {/* 中央のAI Agentから会社としてのAIによる成果物への矢印 */}
                    <line x1="550" y1="200" x2="550" y2="180" stroke="#4169E1" strokeWidth="3" markerEnd="url(#arrowhead)"/>
                    <text x="570" y="194" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#111827">生成</text>
                    
                    {/* 右側のAI Agentから個人・各組織としてのAIによる成果物への矢印 */}
                    <line x1="1100" y1="200" x2="1100" y2="180" stroke="#4169E1" strokeWidth="3" markerEnd="url(#arrowhead)"/>
                    <text x="1120" y="194" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#111827">生成</text>
                    
                    {/* AIによる成果物レイヤー（七段目） */}
                    {/* 左側：AIによる成果物 */}
                    <rect className="arch-box" x="50" y="100" width="200" height="80" fill="url(#boxGradient)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="150" y="130" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">AIによる成果物</text>
                    
                    {/* 中央：AIによる成果物 */}
                    <rect className="arch-box corresponding-group" x="300" y="100" width="500" height="80" fill="url(#boxGradient)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="550" y="130" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">AIによる成果物</text>
                    <text className="arch-text" x="550" y="155" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#666">成果物生成 (全社で使うユースケース)</text>
                    
                    {/* 右側：AIによる成果物 */}
                    <rect className="arch-box corresponding-group" x="850" y="100" width="500" height="80" fill="url(#boxGradient)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1100" y="130" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">AIによる成果物</text>
                    <text className="arch-text" x="1100" y="155" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#666">現場の人が本当にほしい 現場独自のユースケース</text>
                    
                    {/* 最下段のインフラ基盤 */}
                    {/* 左側：インフラ基盤 */}
                    <rect className="arch-box" x="50" y="700" width="200" height="80" fill="url(#boxGradient5)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="150" y="730" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">インフラ基盤</text>
                    
                    {/* 中央：全社基盤 */}
                    <rect className="arch-box corresponding-group" x="300" y="700" width="500" height="80" fill="url(#boxGradient5)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="550" y="730" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">インフラ基盤</text>
                    <text className="arch-text" x="550" y="755" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#666">全社基盤</text>
                    
                    {/* 右側：個人端末 */}
                    <rect className="arch-box corresponding-group" x="850" y="700" width="500" height="80" fill="white" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1100" y="730" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827">個人端末</text>
                    <text className="arch-text" x="1100" y="755" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#666">PC/iPhone</text>
                  </svg>
                </div>
                
                {/* 設計概念の詳細（折りたたみ可能） */}
                <div style={{ marginTop: '24px' }}>
                  <button
                    onClick={() => setShowArchitectureDetails(!showArchitectureDetails)}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      backgroundColor: 'rgba(31, 41, 51, 0.03)',
                      border: '1px solid var(--color-border-color)',
                      borderLeft: '3px solid var(--color-primary)',
                      borderRadius: '0 6px 6px 0',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                      textAlign: 'left',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(31, 41, 51, 0.06)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.06)';
                      e.currentTarget.style.borderLeftColor = '#4169E1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(31, 41, 51, 0.03)';
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
                      e.currentTarget.style.borderLeftColor = 'var(--color-primary)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '16px',
                        color: 'var(--color-primary)'
                      }}>
                        {showArchitectureDetails ? '▼' : '▶'}
                      </span>
                      <span>設計概念の詳細</span>
                    </div>
                    <span style={{ 
                      fontSize: '12px',
                      color: 'var(--color-text-light)',
                      fontWeight: 400
                    }}>
                      {showArchitectureDetails ? '閉じる' : 'クリックして展開'}
                    </span>
                  </button>
                  
                  {showArchitectureDetails && (
                    <div style={{
                      marginTop: '16px',
                      padding: '20px',
                      backgroundColor: '#fff',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border-color)'
                    }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>
                        アーキテクチャ設計の概要
                      </h4>
                      
                      <h5 style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', marginBottom: '12px', color: 'var(--color-text)' }}>
                        1. 設計コンセプト
                      </h5>
                      <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                        本アーキテクチャは、<strong>「統合と分散の両立」</strong>を実現するAI活用システムをイメージ。会社全体の標準化されたAI活用と、個人・各組織のカスタマイズされたAI活用を、同一の基盤AIモデル上で実現。
                      </p>
                      
                      <h5 style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', marginBottom: '12px', color: 'var(--color-text)' }}>
                        2. システム構成の特徴
                      </h5>
                      <ul style={{ marginBottom: '16px', paddingLeft: '24px', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>基盤AIモデルの一元管理:</strong> 高性能なLLMを会社として管理し、全ユーザーがAPIを通じてアクセス
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>二層構造のデータ活用:</strong> 全社統合データと個人・組織分散データの両方を効果的に活用
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>AI Agentによる橋渡し:</strong> 基盤AIモデルと各データソースを適切に連携させ、精度の高い成果物を生成
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>参照データ範囲の最適化:</strong> 個人・各組織レベルでのデータ範囲指定により、雑音を排除し関連性の高い成果物を実現
                        </li>
                      </ul>
                      
                      <h5 style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', marginBottom: '12px', color: 'var(--color-text)' }}>
                        3. 活用領域の違い
                      </h5>
                      <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse',
                          fontSize: '14px'
                        }}>
                          <thead>
                            <tr>
                              <th style={{ 
                                padding: '10px', 
                                border: '1px solid var(--color-border-color)', 
                                backgroundColor: 'var(--color-bg-secondary)',
                                textAlign: 'left',
                                fontWeight: 600
                              }}>項目</th>
                              <th style={{ 
                                padding: '10px', 
                                border: '1px solid var(--color-border-color)', 
                                backgroundColor: '#e6f0ff',
                                textAlign: 'left',
                                fontWeight: 600
                              }}>会社としての活用</th>
                              <th style={{ 
                                padding: '10px', 
                                border: '1px solid var(--color-border-color)', 
                                backgroundColor: '#f0f4ff',
                                textAlign: 'left',
                                fontWeight: 600
                              }}>個人・各組織としての活用</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '10px', border: '1px solid var(--color-border-color)', fontWeight: 600 }}>データソース</td>
                              <td style={{ padding: '10px', border: '1px solid var(--color-border-color)' }}>全社統合システム（データレイク・データウェアハウス）</td>
                              <td style={{ padding: '10px', border: '1px solid var(--color-border-color)' }}>メール・チャット・ストレージ（分散データ）</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '10px', border: '1px solid var(--color-border-color)', fontWeight: 600 }}>成果物</td>
                              <td style={{ padding: '10px', border: '1px solid var(--color-border-color)' }}>全社で使うユースケース</td>
                              <td style={{ padding: '10px', border: '1px solid var(--color-border-color)' }}>現場独自のユースケース</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '10px', border: '1px solid var(--color-border-color)', fontWeight: 600 }}>環境</td>
                              <td style={{ padding: '10px', border: '1px solid var(--color-border-color)' }}>オンプレ・クラウド</td>
                              <td style={{ padding: '10px', border: '1px solid var(--color-border-color)' }}>ローカル・クラウド</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '10px', border: '1px solid var(--color-border-color)', fontWeight: 600 }}>カスタマイズ</td>
                              <td style={{ padding: '10px', border: '1px solid var(--color-border-color)' }}>標準化されたプロセス</td>
                              <td style={{ padding: '10px', border: '1px solid var(--color-border-color)' }}>個人・組織の意思に基づくカスタマイズ</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <h5 style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', marginBottom: '12px', color: 'var(--color-text)' }}>
                        4. 技術的イノベーション
                      </h5>
                      <ul style={{ marginBottom: '16px', paddingLeft: '24px', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>API統合による効率化:</strong> 同一基盤AIモデルを複数の活用領域で共有
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>データ範囲指定機能:</strong> 個人・各組織が参照データを指定することで、より精度の高い成果物を生成
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>分散データの効果的活用:</strong> 従来活用困難だった個人・組織の分散データをAI活用に統合
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>スケーラブルな設計:</strong> 組織規模に応じた柔軟な拡張が可能
                        </li>
                      </ul>
                      
                      <h5 style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', marginBottom: '12px', color: 'var(--color-text)' }}>
                        5. 期待される事業効果
                      </h5>
                      <ul style={{ marginBottom: '16px', paddingLeft: '24px', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>生産性向上:</strong> 個人・各組織の意思に基づくカスタマイズされたAI活用により、業務効率が大幅に向上
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>競争優位の確立:</strong> 分散データの効果的活用により、他社との差別化を実現
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>組織全体のAI活用能力向上:</strong> 標準化とカスタマイズの両立により、全社的なAI活用レベルを向上
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>コスト効率化:</strong> 基盤AIモデルの共有により、運用コストを削減
                        </li>
                      </ul>
                      
                      <h5 style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', marginBottom: '12px', color: 'var(--color-text)' }}>
                        6. 実装上のポイント
                      </h5>
                      <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                        本アーキテクチャの成功には、<strong>「参照データ範囲の適切な指定」</strong>が鍵。個人・各組織が、どのデータを参照するかを明確に指定することで、雑音を排除し、より関連性の高い成果物を生成。これにより、従来の「すべてのデータを参照する」アプローチでは実現できなかった、精度の高いAI活用が可能にする。
                      </p>
                    </div>
                  )}
                </div>

                {/* 本アーキテクチャを採用することで実現可能な内容の詳細（折りたたみ可能） */}
                <div style={{ marginTop: '24px' }}>
                  <button
                    onClick={() => setShowArchitecturePossibilities(!showArchitecturePossibilities)}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      backgroundColor: 'rgba(31, 41, 51, 0.03)',
                      border: '1px solid var(--color-border-color)',
                      borderLeft: '3px solid var(--color-primary)',
                      borderRadius: '0 6px 6px 0',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                      textAlign: 'left',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(31, 41, 51, 0.06)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.06)';
                      e.currentTarget.style.borderLeftColor = '#4169E1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(31, 41, 51, 0.03)';
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
                      e.currentTarget.style.borderLeftColor = 'var(--color-primary)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '16px',
                        color: 'var(--color-primary)'
                      }}>
                        {showArchitecturePossibilities ? '▼' : '▶'}
                      </span>
                      <span>本アーキテクチャを採用することで実現可能な内容</span>
                    </div>
                    <span style={{ 
                      fontSize: '12px',
                      color: 'var(--color-text-light)',
                      fontWeight: 400
                    }}>
                      {showArchitecturePossibilities ? '閉じる' : 'クリックして展開'}
                    </span>
                  </button>
                  
                  {showArchitecturePossibilities && (
                    <div style={{
                      marginTop: '16px',
                      padding: '20px',
                      backgroundColor: '#fff',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border-color)'
                    }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>
                        実現可能な事業・サービス領域
                      </h4>
                      
                      <h5 style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', marginBottom: '12px', color: 'var(--color-text)' }}>
                        1. 自社開発・自社サービス事業
                      </h5>
                      <p style={{ marginBottom: '12px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                        本アーキテクチャを基盤として、<strong>パーソナルデータレイク</strong>を活用した個人向けサービスを構築可能。ユーザー個人のデータ（メール、チャット履歴、ストレージ等）をAI Agentが適切に参照し、パーソナライズされたサービスを提供。
                      </p>
                      <ul style={{ marginBottom: '16px', paddingLeft: '24px', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>出産支援パーソナルアプリケーション:</strong> 個人の健康データ、生活パターン、メール・チャット履歴を統合し、妊娠・出産・育児に最適化されたアドバイスとサポートを提供
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>介護支援パーソナルアプリケーション:</strong> 介護者・被介護者のデータを統合し、個別の状況に応じた介護計画、医療連携、家族間コミュニケーション支援を実現
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>その他パーソナルサービス:</strong> 個人の分散データを統合し、ライフステージやニーズに応じたカスタマイズされたサービスを提供可能
                        </li>
                      </ul>
                      
                      <h5 style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', marginBottom: '12px', color: 'var(--color-text)' }}>
                        2. AI駆動開発・DX支援SI事業
                      </h5>
                      <p style={{ marginBottom: '12px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                        企業のシステム部門向けに、<strong>本アーキテクチャの導入支援</strong>と<strong>カスタマイズ開発</strong>を提供。全社統合データと分散データの両方を活用するAIシステムの構築を支援。
                      </p>
                      <ul style={{ marginBottom: '16px', paddingLeft: '24px', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>医療法人向けDX:</strong> 電子カルテなどの医療データと、各部署の分散データを統合し、AI活用による業務効率化と診療支援システムを構築
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>中小企業向けDX:</strong> 内部データ管理、HP作成、Invoice制度対応など、中小企業の分散データを統合し、AI活用による業務自動化と効率化を実現
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>カスタムAIシステム開発:</strong> 企業の既存データ構造に合わせたAI Agentの開発、データ範囲指定機能の実装、API統合支援を提供
                        </li>
                      </ul>
                      
                      <h5 style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', marginBottom: '12px', color: 'var(--color-text)' }}>
                        3. プロセス可視化・業務コンサル事業
                      </h5>
                      <p style={{ marginBottom: '12px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                        業務部門向けに、<strong>分散データの可視化</strong>と<strong>プロセス改善</strong>を支援。メール、チャット、ストレージなどの分散データをAI Agentが分析し、業務フローの最適化を提案。
                      </p>
                      <ul style={{ marginBottom: '16px', paddingLeft: '24px', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>中小企業向け業務プロセス可視化・改善:</strong> 各部署の分散データを統合分析し、業務フローのボトルネックを特定。AI活用による自動化提案と効率化支援を提供
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>医療・介護施設向け業務プロセス可視化・改善:</strong> 記録業務、連絡業務などの分散データを統合し、コンプライアンス対応と業務効率化を両立した改善提案を実現
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>データドリブンな業務改善:</strong> 従来可視化困難だった個人・組織の分散データをAI Agentが分析し、データに基づいた改善提案を提供
                        </li>
                      </ul>
                      
                      <h5 style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', marginBottom: '12px', color: 'var(--color-text)' }}>
                        4. AI導入ルール設計・人材育成・教育事業
                      </h5>
                      <p style={{ marginBottom: '12px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                        経営層・人事部門向けに、<strong>本アーキテクチャの導入</strong>と<strong>組織全体のAI活用能力向上</strong>を支援。標準化とカスタマイズの両立を実現するための教育・研修・ルール設計を提供。
                      </p>
                      <ul style={{ marginBottom: '16px', paddingLeft: '24px', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>企業向けAI活用教育・研修:</strong> 本アーキテクチャの活用方法、データ範囲指定の重要性、AI Agentの効果的な使い方を教育
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>AI導入ルール設計・ガバナンス:</strong> 統合と分散の両立を実現するためのルール設計、データアクセス制御、セキュリティポリシーの策定支援
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>組織全体のAI活用能力向上支援:</strong> 標準化された基盤AIモデルの活用と、個人・組織のカスタマイズのバランスを取るためのコンサルティング
                        </li>
                      </ul>
                      
                      <h5 style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', marginBottom: '12px', color: 'var(--color-text)' }}>
                        5. 新規事業・サービス構築の可能性
                      </h5>
                      <p style={{ marginBottom: '12px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                        本アーキテクチャの柔軟性により、以下のような新規事業・サービスの構築も可能。
                      </p>
                      <ul style={{ marginBottom: '16px', paddingLeft: '24px', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>業界特化型AIプラットフォーム:</strong> 特定業界（医療、介護、教育等）のデータ構造に最適化したAI活用プラットフォームの構築
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>データ統合・分析サービス:</strong> 企業の分散データを統合し、AI Agentによる分析レポートを提供するサービス
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>カスタムAI Agent開発サービス:</strong> 企業の特定ニーズに応じた専用AI Agentの開発・提供サービス
                        </li>
                        <li style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                          <strong>パーソナルデータレイク構築支援:</strong> 個人・組織の分散データを統合管理し、AI活用を可能にするデータレイク構築支援サービス
                        </li>
                      </ul>
                      
                      <h5 style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', marginBottom: '12px', color: 'var(--color-text)' }}>
                        6. 事業企画・構想への展開
                      </h5>
                      <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                        本アーキテクチャは、上記の4つの事業企画すべての基盤技術として機能し、各事業の<strong>差別化要因</strong>となる。特に、従来のAI活用では困難だった<strong>「分散データの効果的活用」</strong>と<strong>「統合と分散の両立」</strong>を実現することで、競合他社との差別化を図ることができる。
                      </p>
                      <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text)' }}>
                        また、本アーキテクチャの導入実績とノウハウを活かし、<strong>他社への導入支援</strong>や<strong>コンサルティング</strong>も新たな事業機会として展開可能。自社がAIファーストカンパニーとして実践し、その経験を他社の変革支援に活かすことで、持続的な事業成長を実現する。
                      </p>
                    </div>
                  )}
                </div>
              </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                5. パーソナルDXとパーソナルデータレイクの重要性
              </h4>
              <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                AIの真価、効果的な領域、および伊藤忠としての参入すべき観点を総合的に鑑みると、パーソナルDX（Personal Digital Experience）およびパーソナルデータレイクが極めて重要である。
              </p>
              <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
                これらを実現するためには、ユーザーフレンドリーなUIが不可欠である。ユーザーが直感的に操作でき、負担なくデータを提供できるインターフェースが、AIファクトリーの循環系を動かす原動力となる。
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                6. 株式会社AIアシスタントの使命
              </h4>
              <div style={{ marginBottom: '12px', paddingLeft: '11px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <img 
                  src="/ChatGPT Image 2025年11月26日 12_15_46.png" 
                  alt="株式会社AIアシスタントの使命" 
                  style={{ 
                    maxWidth: '400px', 
                    width: '100%',
                    height: 'auto', 
                    borderRadius: '8px',
                    flexShrink: 0
                  }} 
                />
                <div style={{ flex: 1 }}>
                  {/* 1. Mission */}
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                      1. Mission
                    </h5>
                    <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                      株式会社AIアシスタントは、自社がAIファーストカンパニーとして、ユーザーフレンドリーなUI設計を通じて、パーソナルDXの実現を目指す。そして、その実践経験とノウハウを活かして、他社のAIファーストカンパニーへの変革も支援する。
                    </p>
                  </div>

                  {/* 2. Vision */}
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                      2. Vision
                    </h5>
                    <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                      すべての個人と組織が、AIを自然に活用できる社会の実現を目指す。パーソナルデータレイクを基盤とした、真にユーザー中心のAIエコシステムを構築し、データ主権を個人に取り戻すことで、より豊かで創造的な未来を創造する。
                    </p>
                  </div>

                  {/* 3. Value */}
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                      3. Value
                    </h5>
                    <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                      ユーザーフレンドリーな設計を最優先とし、技術の複雑さを隠し、直感的な体験を提供する。実践を通じて得た知見を積極的に共有し、オープンな協業により、AIファーストカンパニーへの変革を加速させる。常にユーザーの視点に立ち、データの透明性とプライバシーを尊重する。
                    </p>
                  </div>

                  {/* 4. Business / Service */}
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                      4. Business / Service
                    </h5>
                    <p style={{ marginBottom: '0', paddingLeft: '11px', fontSize: '14px', lineHeight: '1.8' }}>
                      自社開発・自社サービス事業としてパーソナルアプリケーションを提供し、AIファーストカンパニーとしての実績とナレッジを獲得。獲得した経験を元にAI導入ルール設計・人材育成・教育事業を展開し、伊藤忠グループのエコシステムによる顧客伴奏支援型の業務コンサル事業を拡大。顧客課題を具体化しAI駆動開発・DX支援SI事業で企業のシステム開発を支援する。
                    </p>
                  </div>
                </div>
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

