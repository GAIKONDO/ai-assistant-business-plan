'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Script from 'next/script';
import { usePlan, useContainerVisibility } from '../layout';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import ScatterBubbleChart, { ScatterBubbleData } from '@/components/ScatterBubbleChart';
import dynamic from 'next/dynamic';

// コンポーネント化されたページのコンポーネント（条件付きインポート）
const ComponentizedCompanyPlanOverview = dynamic(
  () => import('@/components/pages/component-test/test-concept/ComponentizedCompanyPlanOverview'),
  { ssr: false }
);

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

  // すべてのHooksを早期リターンの前に呼び出す（React Hooksのルール）
  const { showContainers } = useContainerVisibility();
  const aiFactoryCanvasRef = useRef<HTMLDivElement>(null);
  const cycleDiagramRef = useRef<HTMLDivElement>(null);
  const cycleDiagramRef2 = useRef<HTMLDivElement>(null);
  const p5Loaded = useRef(false);
  const aiFactoryP5Instance = useRef<any>(null);
  const cycleP5Instance = useRef<any>(null);
  const cycleP5Instance2 = useRef<any>(null);
  const cycleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const aiFactoryTimeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const [keyVisualHeight, setKeyVisualHeight] = useState<number>(56.25); // デフォルトは16:9のアスペクト比
  const [showSizeControl, setShowSizeControl] = useState(false);

  // キービジュアルの高さを読み込む
  useEffect(() => {
    if (plan?.keyVisualHeight !== undefined) {
      setKeyVisualHeight(plan.keyVisualHeight);
    }
  }, [plan?.keyVisualHeight]);
  
  // キービジュアルの高さを保存（useCallbackでメモ化）
  const handleSaveKeyVisualHeight = useCallback(async (height: number) => {
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
  }, [auth?.currentUser, db, planId]);

  // AI-driven Self-reinforcing Business Loopの画像をダウンロード
  const handleDownloadCycleDiagram = useCallback(() => {
    if (!cycleDiagramRef.current) return;
    
    // p5.jsのキャンバス要素を取得
    const canvas = cycleDiagramRef.current.querySelector('canvas');
    if (!canvas) {
      alert('画像を取得できませんでした。');
      return;
    }
    
    try {
      // キャンバスを画像データに変換
      const imageData = canvas.toDataURL('image/png');
      
      // ダウンロードリンクを作成
      const link = document.createElement('a');
      link.download = 'AI-driven-Self-reinforcing-Business-Loop.png';
      link.href = imageData;
      link.click();
    } catch (error) {
      console.error('画像のダウンロードエラー:', error);
      alert('画像のダウンロードに失敗しました。');
    }
  }, []);

  // AI-driven Self-reinforcing Business Loopの画像をダウンロード（2つ目）
  const handleDownloadCycleDiagram2 = useCallback(() => {
    if (!cycleDiagramRef2.current) return;
    
    // p5.jsのキャンバス要素を取得
    const canvas = cycleDiagramRef2.current.querySelector('canvas');
    if (!canvas) {
      alert('画像を取得できませんでした。');
      return;
    }
    
    try {
      // キャンバスを画像データに変換
      const imageData = canvas.toDataURL('image/png');
      
      // ダウンロードリンクを作成
      const link = document.createElement('a');
      link.download = 'AI-driven-Self-reinforcing-Business-Loop-2.png';
      link.href = imageData;
      link.click();
    } catch (error) {
      console.error('画像のダウンロードエラー:', error);
      alert('画像のダウンロードに失敗しました。');
    }
  }, []);

  // AIの真価：2軸マトリクス用データ
  const aiValueMatrixData = useMemo<ScatterBubbleData[]>(() => [
    // 青い円（従来から可能な領域）
    { name: '汎用的サービス', x: 0.2, y: 0.5, size: 45, category: 'traditional', description: 'AI導入で可能になった領域' },
    { name: '企業向け大規模開発', x: 0.75, y: 0.9, size: 80, category: 'traditional', description: 'AI導入で可能になった領域' },
    { name: '個人向けパーソナライズ化', x: 0.8, y: 0.3, size: 20, category: 'traditional', description: 'AI導入で可能になった領域' },
    { name: '個人向けUI設計', x: 0.6, y: 0.35, size: 20, category: 'traditional', description: 'AI導入で可能になった領域' },
    { name: 'SaaS', x: 0.4, y: 0.6, size: 80, category: 'traditional', description: 'AI導入で可能になった領域' },
    { name: '企業向けUI設計', x: 0.75, y: 0.55, size: 30, category: 'traditional', description: 'AI導入で可能になった領域' },
    { name: '企業向けカスタマイズ', x: 0.7, y: 0.7, size: 50, category: 'traditional', description: 'AI導入で可能になった領域' },
    
    // 緑の円（AI導入で可能になった領域）- 低コスト・高マネタイズの領域（左上象限）に配置
    { name: '汎用的サービス', x: 0.1, y: 0.1, size: 20, category: 'ai-enabled', description: 'AI導入で可能になった領域' },
    { name: '企業向け大規模開発', x: 0.5, y: 0.9, size: 80, category: 'ai-enabled', description: 'AI導入で可能になった領域' },
    { name: '個人向けパーソナライズ化', x: 0.15, y: 0.75, size: 60, category: 'ai-enabled', description: 'AI導入で可能になった領域' },
    { name: '個人向けUI設計', x: 0.35, y: 0.75, size: 65, category: 'ai-enabled', description: 'AI導入で可能になった領域' },
    { name: 'SaaS', x: 0.1, y: 0.3, size: 30, category: 'ai-enabled', description: 'AI導入で可能になった領域' },
    { name: '企業向けUI設計', x: 0.3, y: 0.45, size: 40, category: 'ai-enabled', description: 'AI導入で可能になった領域' },
    { name: '企業向けカスタマイズ', x: 0.25, y: 0.6, size: 50, category: 'ai-enabled', description: 'AI導入で可能になった領域' },
  ], []);

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
        const englishLabels = [
          "Data",
          "Algorithm",
          "Service",
          "Usage"
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
            
            // 英語ラベル（小さく下に配置）
            p.fill(0, 180); // 少し薄めの黒
            p.textSize(7); // 日本語の40-50%のサイズ
            p.textAlign(p.CENTER, p.CENTER);
            p.text(englishLabels[i], x, y + nodeR + 8);
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
  }, [showContainers]);

  // p5.jsでデータ循環ループ図を描画（2つ目 - AIネイティブ設計セクション用）
  useEffect(() => {
    const initCycleDiagram2 = () => {
      if (typeof window === 'undefined' || !window.p5 || !cycleDiagramRef2.current) {
        return false;
      }

      if (cycleDiagramRef2.current.hasChildNodes()) {
        return true;
      }

    // cycleDiagramRefと同じスケッチを使用（簡略版）
    const sketch = (p: any) => {
      const labels = ["さらなる\nデータ", "より良い\nアルゴリズム", "より良い\nサービス", "さらなる\n利用"];
      const englishLabels = ["Data", "Algorithm", "Service", "Usage"];
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
          const isStartPoint = i === 2; // 「より良いサービス」が起点
          
          p.noStroke();
          p.fill(255);
          p.ellipse(x, y, nodeR * 2 + 6, nodeR * 2 + 6);
          p.stroke(0, 12);
          p.strokeWeight(0.5);
          p.noFill();
          p.ellipse(x, y, nodeR * 2 + 4, nodeR * 2 + 4);
          
          // 起点ノードは強調表示
          if (isStartPoint) {
            p.stroke(255, 193, 7); // 金色
            p.strokeWeight(2);
            p.noFill();
            p.ellipse(x, y, nodeR * 2 + 8, nodeR * 2 + 8);
          }
          
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
          
          // 起点マーカーを追加（円の下に配置）
          if (isStartPoint) {
            // 星印を追加（円の下）
            p.push();
            p.translate(x, y + nodeR + 25);
            p.fill(255, 193, 7);
            p.noStroke();
            p.beginShape();
            for (let j = 0; j < 5; j++) {
              const angle = (p.TWO_PI * j) / 5 - p.HALF_PI;
              const x1 = p.cos(angle) * 8;
              const y1 = p.sin(angle) * 8;
              p.vertex(x1, y1);
              const angle2 = (p.TWO_PI * (j + 0.5)) / 5 - p.HALF_PI;
              const x2 = p.cos(angle2) * 4;
              const y2 = p.sin(angle2) * 4;
              p.vertex(x2, y2);
            }
            p.endShape(p.CLOSE);
            p.pop();
            
            // 「起点」テキストを星印の下に追加
            p.fill(255, 193, 7); // 金色
            p.noStroke();
            p.textSize(10);
            p.textFont("sans-serif");
            p.textAlign(p.CENTER, p.CENTER);
            p.text("起点", x, y + nodeR + 40);
          }
        }
      };

      const drawParticle = (particle: any) => {
        const currentNode = nodes[particle.nodeIndex];
        const nextNode = nodes[currentNode.nextIndex];
        const angle = p.noise(particle.x * NOISE_SCALE, particle.y * NOISE_SCALE) * p.TWO_PI * 3.0;
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
          vx += tangentX * 0.15;
          vy += tangentY * 0.15;
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
        const containerWidth = cycleDiagramRef2.current?.clientWidth || 400;
        const canvasWidth = Math.min(containerWidth - 32, 400);
        const canvasHeight = 420; // 起点マーカーのために高さを増やす
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
          particles.push({ x: node.x + p.cos(angle) * radius, y: node.y + p.sin(angle) * radius, nodeIndex: nodeIndex, vx: 0, vy: 0 });
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
            particles.forEach((particle) => drawParticle(particle));
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

      cycleP5Instance2.current = new window.p5(sketch, cycleDiagramRef2.current);
      return true;
    };

    const tryInit2 = () => {
      if (initCycleDiagram2()) {
        return;
      }
      const timeoutId = setTimeout(tryInit2, 100);
      cycleTimeoutRefs.current.push(timeoutId);
    };

    const handleP5Loaded2 = () => {
      p5Loaded.current = true;
      if (typeof window !== 'undefined' && window.p5) {
        const timeoutId = setTimeout(() => {
          tryInit2();
        }, 100);
        cycleTimeoutRefs.current.push(timeoutId);
      }
    };

    window.addEventListener('p5loaded', handleP5Loaded2);
    
    // 既にp5.jsが読み込まれている場合（リロード時など）
    if (typeof window !== 'undefined' && window.p5) {
      p5Loaded.current = true;
      const timeoutId = setTimeout(() => {
        tryInit2();
      }, 200);
      cycleTimeoutRefs.current.push(timeoutId);
    } else {
      // p5.jsがまだ読み込まれていない場合、定期的にチェック
      const checkInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.p5) {
          p5Loaded.current = true;
          clearInterval(checkInterval);
          const timeoutId = setTimeout(() => {
            tryInit2();
          }, 200);
          cycleTimeoutRefs.current.push(timeoutId);
        }
      }, 100);

      const timeoutId = setTimeout(() => {
        if (checkInterval) {
          clearInterval(checkInterval);
        }
      }, 10000);
      cycleTimeoutRefs.current.push(timeoutId);
    }

    return () => {
      window.removeEventListener('p5loaded', handleP5Loaded2);
      
      cycleTimeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      cycleTimeoutRefs.current = [];
      
      if (cycleP5Instance2.current) {
        try {
          cycleP5Instance2.current.remove();
        } catch (e) {
          // エラーは無視
        }
        cycleP5Instance2.current = null;
      }
      
      if (cycleDiagramRef2.current) {
        cycleDiagramRef2.current.innerHTML = '';
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

  // コンポーネント化されたページを使用するかチェック
  // pagesBySubMenuが存在する場合はComponentizedCompanyPlanOverviewを使用
  if (plan?.pagesBySubMenu) {
    return <ComponentizedCompanyPlanOverview />;
  }

  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        概要・コンセプト
      </p>
      
      {/* キービジュアル画像 */}
      <div 
        data-page-container="0"
        className="card" 
        style={{
          marginBottom: '24px', 
          padding: showContainers ? '16px' : 0, 
          overflow: 'hidden', 
          position: 'relative',
          ...(showContainers ? {
            border: '4px dashed #000000',
            borderRadius: '8px',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            backgroundColor: 'transparent',
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
          } : {}),
        }}
      >
        {plan?.keyVisualUrl ? (
          <div style={{ position: 'relative', width: '100%', paddingTop: `${keyVisualHeight}%`, backgroundColor: '#f8f9fa' }}>
            <img
              src={plan.keyVisualUrl}
              alt="キービジュアル"
              loading="lazy"
              decoding="async"
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
            <div
              data-page-container="1"
              style={{
                ...(showContainers ? {
                  border: '4px dashed #000000',
                  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  backgroundColor: 'transparent',
                  position: 'relative',
                  zIndex: 1,
                } : {
                  marginBottom: '24px',
                }),
              }}
            >
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px', margin: 0 }}>
                    1. AIファーストカンパニーとは
                  </h4>
                  <span id="page-overview-1" style={{ fontSize: '12px', color: '#94A3B8' }}>1</span>
                </div>
                <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text)', lineHeight: '1.4', textAlign: 'center' }}>
                  人と資産から、アルゴリズム（AI）とネットワークへ。
                </h2>
                <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '20px', color: 'var(--color-text-light)', lineHeight: '1.6', textAlign: 'center', fontStyle: 'normal' }}>
                  競争優位は「人と資産」ではなく「アルゴリズム（AI）とネットワーク」によって決まる時代へ
                </h3>
                <p style={{ marginBottom: '16px', paddingLeft: '11px', fontSize: '15px', lineHeight: '1.8', fontWeight: 500 }}>
                  AIファーストカンパニーとは、この変化を最も早く、最も深く実装した組織である。
                </p>
                <p style={{ marginBottom: '12px', paddingLeft: '11px', fontSize: '13px', lineHeight: '1.8', color: 'var(--color-text-light)' }}>
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
                    <button
                      onClick={handleDownloadCycleDiagram}
                      style={{
                        padding: '2px 8px',
                        backgroundColor: 'transparent',
                        color: '#9CA3AF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: 400,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: 0.7,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.7';
                      }}
                      title="画像をダウンロード"
                    >
                      <span style={{ fontSize: '10px' }}>⬇</span>
                      <span>ダウンロード</span>
                    </button>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--color-text-light)', marginTop: '12px', fontStyle: 'italic', textAlign: 'center' }}>
                    出典: マルコ・イアンシティ; カリム・R・ラカーニ; 吉田素文、AIファースト・カンパニー: アルゴリズムとネットワークが経済を支配する新時代の経営戦略(p.234). 英治出版株式会社.
                  </p>
                </div>
              </div>
            </div>
            </div>

        <div 
          data-page-container="2"
          style={{
            marginBottom: '24px',
            ...(showContainers ? {
              border: '3px dashed #1F2933',
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px', margin: 0 }}>
                  2. AIの真価
                </h4>
                <span id="page-overview-2" style={{ fontSize: '12px', color: '#94A3B8' }}>2</span>
              </div>
              <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text)', lineHeight: '1.4', textAlign: 'center' }}>
                AIは「不可能だった価値」を可能にする
              </h2>
              <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '20px', color: 'var(--color-text-light)', lineHeight: '1.6', textAlign: 'center', fontStyle: 'normal' }}>
                採算性とコストの壁を越えて、新たな価値創造の領域を開く
              </h3>

              {/* 2軸マトリクス（採算性 vs コスト） */}
              <div style={{ marginTop: '48px', marginBottom: '48px' }}>
                {/* チャートと説明を横並びに配置 */}
                <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', justifyContent: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
                  {/* チャート（左側） */}
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '650px', marginTop: '20px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '-70px', marginLeft: '50px', color: 'var(--color-text-light)', textAlign: 'center', width: '100%' }}>
                      （<span style={{ color: '#4DB368', fontWeight: 600 }}>緑</span>＝AIにより新たに可能となった領域 / <span style={{ color: '#4A90E2', fontWeight: 600 }}>青</span>＝従来から可能な領域）
                    </p>
                    <ScatterBubbleChart
                      data={aiValueMatrixData}
                      width={650}
                      height={650}
                      xAxisLabel="コスト（低い → 高い）"
                      yAxisLabel="採算性（低い → 高い）"
                      title=""
                    />
                  </div>

                  {/* 説明（右側） */}
                  <div style={{ flex: '1', minWidth: '300px', paddingTop: '20px' }}>
                    {/* 右上象限の注釈 */}
                    <div style={{ 
                      marginBottom: '24px',
                      padding: '16px 20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: 'var(--color-text)',
                      border: '1px solid rgba(0,0,0,0.08)'
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: '15px' }}>
                        右上象限：高採算 × 高コスト
                      </p>
                      <p style={{ margin: '0', fontSize: '13px', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                        AIにより「高価だが高採算」案件が個別最適から半自動化へ移行し始めている
                      </p>
                    </div>

                    {/* AIにより「低コストで高採算」の領域が大幅に拡張 */}
                    <div style={{ 
                      padding: '20px 24px', 
                      backgroundColor: 'var(--color-background-light)', 
                      borderRadius: '8px', 
                      borderLeft: '4px solid var(--color-primary)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'
                    }}>
                      <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)', lineHeight: '1.6' }}>
                        AIにより「低コストで高採算」の領域が大幅に拡張
                      </p>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-light)', lineHeight: '1.8', marginBottom: '20px' }}>
                        特に個人向けパーソナライズと企業向けカスタム領域で新市場が出現。従来は不採算または高コストだった領域が「低コスト × 高採算」の象限へ大幅に移動している。この高採算化の背景には、AIによって多くの案件を同時並行的に、スピーディーに処理できるようになったことがある。案件数の増加により、従来は個別対応が困難だった領域でも採算性が確保できるようになった。
                      </p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', lineHeight: '1.8', marginBottom: '20px', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid rgba(74, 144, 226, 0.2)' }}>
                        → この領域拡張<sup style={{ fontSize: '10px', verticalAlign: 'super' }}>※</sup>こそが、新規会社が狙うべきコア市場である。
                      </p>
                      
                      {/* AIがもたらした主な変化 */}
                      <div style={{ marginTop: '24px' }}>
                        <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                          <span style={{ color: '#4DB368' }}>●</span> AIがもたらした主な変化
                        </p>
                        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', color: 'var(--color-text-light)', lineHeight: '1.8' }}>
                          <li>個人向けパーソナライズ領域が高採算化</li>
                          <li>SaaS領域で自動化が進み低コスト化</li>
                          <li>企業向けカスタマイズも一部が低コスト化</li>
                          <li>企業向け大規模開発は一部AIで効率化され別象限へシフト</li>
                        </ul>
                      </div>
                    </div>
                    
                    {/* 脚注 */}
                    <div style={{ 
                      marginTop: '12px',
                      fontSize: '11px',
                      color: 'var(--color-text-light)',
                      lineHeight: '1.5',
                      fontStyle: 'italic'
                    }}>
                      <sup style={{ fontSize: '9px', verticalAlign: 'super' }}>※</sup> Stanford/MIT（2024）による"生成AIの98–99%コスト削減"、McKinsey（2023）の"ソフト開発効率30〜75%改善"、Gartner（2024）の"AIアプリ市場CAGR44%"に基づき作成。
                    </div>
                  </div>
                </div>

              </div>

            </div>

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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px', margin: 0 }}>
                  3. AIネイティブ設計
                </h4>
                <span id="page-overview-3" style={{ fontSize: '12px', color: '#94A3B8' }}>3</span>
              </div>
              <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text)', lineHeight: '1.4', textAlign: 'center' }}>
                ユーザーフレンドリーな設計が好循環の起点
              </h2>
              <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '20px', color: 'var(--color-text-light)', lineHeight: '1.6', textAlign: 'center', fontStyle: 'normal' }}>
                AIファクトリーの自己強化ループを高速回転させる設計
              </h3>
              <p style={{ marginBottom: '16px', paddingLeft: '11px', fontSize: '15px', lineHeight: '1.8', fontWeight: 500 }}>
                AIネイティブ設計とは、AIの活用を前提として、AIファクトリーの自己強化の循環系を高速回転させることを意識した設計である。
              </p>
              
              {/* 左右2カラムレイアウト */}
              <div style={{ marginTop: '32px', marginBottom: '24px', paddingLeft: '11px' }}>
                <div style={{ 
                  width: '100%', 
                  maxWidth: '950px',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '40px',
                  alignItems: 'flex-start',
                }}>
                  {/* 左側：キービジュアル（循環図） */}
                  <div style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div ref={cycleDiagramRef2} style={{ width: '100%', maxWidth: '400px', minHeight: '420px' }} />
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
                      <button
                        onClick={handleDownloadCycleDiagram2}
                        style={{
                          padding: '2px 8px',
                          backgroundColor: 'transparent',
                          color: '#9CA3AF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: 400,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: 0.7,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                        }}
                        title="画像をダウンロード"
                      >
                        <span style={{ fontSize: '10px' }}>⬇</span>
                        <span>ダウンロード</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 右側：解説 */}
                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ marginBottom: '4px', paddingBottom: '16px', borderBottom: '2px solid var(--color-primary)' }}>
                      <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', color: '#FFC107' }}>★</span>
                        【起点】ユーザーフレンドリーな設計
                      </h5>
                      <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text-light)' }}>
                        好循環の起点となるのが、ユーザーフレンドリーな設計である。使いやすく直感的な設計により、ユーザーが自然にサービスを利用し、データが集まり始める。
                      </p>
                    </div>
                    
                    <div style={{ marginBottom: '4px' }}>
                      <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                        利用拡大
                      </h5>
                      <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text-light)' }}>
                        ユーザーフレンドリーな設計により、ユーザーが自然にサービスを利用し、さらなるデータ収集の機会が生まれる。
                      </p>
                    </div>
                    
                    <div style={{ marginBottom: '4px' }}>
                      <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                        データ収集
                      </h5>
                      <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text-light)' }}>
                        AIネイティブな設計により、はじめからAIが活用できるデータ構造の設計を採用することで、従来のAIが使いやすい構造かデータに変換する手間がなくなる。
                      </p>
                    </div>
                    
                    <div style={{ marginBottom: '4px' }}>
                      <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                        アルゴリズム改善
                      </h5>
                      <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text-light)' }}>
                        収集されたデータを活用して、AIアシスタントへの指示が明確になり、アルゴリズムが継続的に改良される。
                      </p>
                    </div>
                    
                    <div style={{ marginBottom: '4px' }}>
                      <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                        サービス向上
                      </h5>
                      <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text-light)' }}>
                        改善されたアルゴリズムにより、より良いサービスが提供され、ユーザー体験が向上する。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px', margin: 0 }}>
                  4. AI活用アーキテクチャ
                </h4>
                <span id="page-overview-4" style={{ fontSize: '12px', color: '#94A3B8' }}>4</span>
              </div>
              <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text)', lineHeight: '1.4', textAlign: 'center' }}>
                統合と分散の両立を実現するAI活用システム
              </h2>
              <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '20px', color: 'var(--color-text-light)', lineHeight: '1.6', textAlign: 'center', fontStyle: 'normal' }}>
                「統合と分散の両立」のアーキテクチャが事業でのAI活用を実現する
              </h3>
              <p style={{ marginBottom: '12px', paddingLeft: '11px', fontSize: '13px', lineHeight: '1.8', color: 'var(--color-text-light)' }}>
                高性能なLLMを会社として一元管理し、全ユーザーがAPIを通じてアクセスできる環境を整備。全社統合データと個人・組織分散データの両方を効果的に活用し、AI Agentが基盤AIモデルと各データソースを適切に連携させることで、精度の高い成果物を生成する。
              </p>
              
              {/* AI活用アーキテクチャ図 */}
              <div style={{ marginTop: '24px', marginBottom: '24px', paddingLeft: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  width: '100%', 
                  maxWidth: '1400px',
                  overflowX: 'auto',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  padding: '20px',
                  paddingTop: '60px',
                  margin: '0 auto'
                }}>
                  <svg width="1396" height="512" viewBox="0 0 2000 800" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto', marginTop: '-60px' }}>
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
                      
                      {/* 矢印マーカー（主要・下向き） */}
                      <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="#4169E1" />
                      </marker>
                      {/* 矢印マーカー（主要・上向き） */}
                      <marker id="arrowheadUp" markerWidth="10" markerHeight="10" refX="1" refY="3" orient="auto">
                        <polygon points="10 0, 0 3, 10 6" fill="#4169E1" />
                      </marker>
                      {/* 矢印マーカー（サブ） */}
                      <marker id="arrowheadSub" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0, 8 2.5, 0 5" fill="#999" />
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
                      <linearGradient id="uiAccentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#EFF6FF",stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:"#DBEAFE",stopOpacity:1}} />
                      </linearGradient>
                      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.1"/>
                      </filter>
                    </defs>
                    
                    {/* タイトル */}
                    {/* 左側：統合 */}
                    <text x="500" y="50" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold" fill="#111827">統合</text>
                    <text x="500" y="75" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="normal" fill="#666666">全社データレイク</text>
                    
                    {/* 右側：分散 */}
                    <text x="1050" y="50" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold" fill="#111827">分散</text>
                    <text x="1050" y="75" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="normal" fill="#666666">パーソナルデータレイク</text>
                    
                    {/* 環境レイヤー（二段目） */}
                    {/* 左側：環境 */}
                    <rect className="arch-box" x="0" y="600" width="200" height="80" fill="url(#boxGradient5)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="100" y="640" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">環境</text>
                    
                    {/* 中央：オンプレ・クラウド - 淡い枠 */}
                    <rect className="arch-box corresponding-group" x="250" y="600" width="500" height="80" fill="url(#boxGradient5)" stroke="#4169E1" strokeWidth="1" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="500" y="640" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">環境/ネットワーク</text>
                    
                    {/* 右側：ローカル・クラウド */}
                    <rect className="arch-box corresponding-group" x="800" y="600" width="500" height="80" fill="white" stroke="#4169E1" strokeWidth="1" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1050" y="640" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">環境/ネットワーク</text>
                    
                    {/* 重要なデータソースレイヤー（三段目） */}
                    {/* 左側：重要なデータソース */}
                    <rect className="arch-box" x="0" y="500" width="200" height="80" fill="url(#boxGradient4)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="100" y="540" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">重要なデータソース</text>

                    {/* 中央：全社統合システム - さらに薄い枠 */}
                    <rect className="arch-box corresponding-group" x="250" y="500" width="500" height="80" fill="url(#boxGradient4)" stroke="#4169E1" strokeWidth="1.5" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="500" y="540" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">重要なデータソース</text>
                    
                    {/* 右側：個人データソース - 統一された横幅 */}
                    {/* メール */}
                    <rect className="arch-box corresponding-group" x="800" y="500" width="160" height="80" fill="url(#importantDataGradient)" stroke="#1F3D2B" strokeWidth="1.5" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="880" y="540" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#1F3D2B" dominantBaseline="middle">メール</text>
                    
                    {/* チャット履歴 */}
                    <rect className="arch-box corresponding-group" x="970" y="500" width="160" height="80" fill="url(#importantDataGradient)" stroke="#1F3D2B" strokeWidth="1.5" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1050" y="540" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#1F3D2B" dominantBaseline="middle">チャット履歴</text>
                    
                    {/* 組織ごとのストレージ */}
                    <rect className="arch-box corresponding-group" x="1140" y="500" width="160" height="80" fill="url(#importantDataGradient)" stroke="#1F3D2B" strokeWidth="1.5" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1220" y="540" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#1F3D2B" dominantBaseline="middle">組織ごとのストレージ</text>
                    
                    {/* メールから参照データ範囲指定への矢印 */}
                    <line x1="880" y1="500" x2="950" y2="340" stroke="#999" strokeWidth="1.5" markerEnd="url(#arrowheadSub)"/>
                    
                    {/* チャット履歴から参照データ範囲指定への矢印 */}
                    <line x1="1050" y1="500" x2="1050" y2="340" stroke="#999" strokeWidth="1.5" markerEnd="url(#arrowheadSub)"/>
                    
                    {/* 組織ごとのストレージから参照データ範囲指定への矢印 */}
                    <line x1="1220" y1="500" x2="1150" y2="340" stroke="#999" strokeWidth="1.5" markerEnd="url(#arrowheadSub)"/>
                    
                    {/* 参照データ範囲指定からAI Agentへの矢印 */}
                    <line x1="1050" y1="300" x2="1050" y2="280" stroke="#4169E1" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                    
                    {/* 左側：UI */}
                    <rect className="arch-box" x="0" y="100" width="200" height="80" fill="url(#uiAccentGradient)" stroke="#2563EB" strokeWidth="3" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="100" y="140" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">UI</text>
                    
                    {/* AI活用領域レイヤー（四段目） */}
                    {/* 左側：AI活用領域 */}
                    <rect className="arch-box" x="0" y="200" width="200" height="280" fill="url(#boxGradient2)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="100" y="230" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="17" fontWeight="bold" fill="#111827">AI活用領域</text>
                    <text className="arch-text" x="100" y="265" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fill="#555" fontWeight="500">・AI Model</text>
                    <text className="arch-text" x="100" y="292" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fill="#555" fontWeight="500">・RAG</text>
                    <text className="arch-text" x="100" y="319" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fill="#555" fontWeight="500">・API</text>
                    <text className="arch-text" x="100" y="346" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fill="#555" fontWeight="500">・MCP</text>
                    <text className="arch-text" x="100" y="373" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fill="#555" fontWeight="500">・A2A</text>
                    
                    {/* 中央：LLM - 薄い枠 */}
                    <rect className="arch-box" x="250" y="300" width="500" height="180" fill="url(#boxGradient3)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="500" y="390" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">基盤AIモデル</text>
                    
                    {/* 右側：データ整理・可視化 */}
                    <rect className="arch-box corresponding-group" x="800" y="400" width="500" height="80" fill="white" stroke="#999" strokeWidth="1" strokeDasharray="5,5" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1050" y="440" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">データ整理・可視化</text>
                    
                    {/* 右側：参照データ範囲指定 */}
                    <rect className="arch-box corresponding-group" x="800" y="300" width="500" height="80" fill="url(#boxGradient)" stroke="#999" strokeWidth="1" strokeDasharray="5,5" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1050" y="340" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">参照データ範囲指定</text>
                    
                    {/* AI Agentレイヤー（六段目） */}
                    {/* 中央：AI Agent - 濃い枠で強調 */}
                    <rect className="arch-box corresponding-group" x="250" y="200" width="500" height="80" fill="url(#boxGradient2)" stroke="#4169E1" strokeWidth="4" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="500" y="240" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">AI Agent</text>
                    
                    {/* 右側：AI Agent */}
                    <rect className="arch-box corresponding-group" x="800" y="200" width="500" height="80" fill="white" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1050" y="240" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">AI Agent</text>
                    
                    {/* 基盤AIモデルから右のAI Agentへの矢印 */}
                    <line x1="750" y1="390" x2="800" y2="240" stroke="#4169E1" strokeWidth="3" markerEnd="url(#arrowhead)"/>
                    <text x="775" y="355" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#111827">API</text>
                    
                    {/* 基盤AIモデルからデータ整理・可視化への矢印 */}
                    <line x1="750" y1="390" x2="800" y2="440" stroke="#4169E1" strokeWidth="3" markerEnd="url(#arrowhead)"/>
                    <text x="775" y="435" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#111827">API</text>
                    
                    {/* 基盤AIモデルから会社としてのAI Agentへの矢印 */}
                    <line x1="500" y1="300" x2="500" y2="280" stroke="#4169E1" strokeWidth="3" markerEnd="url(#arrowhead)"/>
                    <text x="520" y="294" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#111827">API</text>
                    
                    {/* 中央のAI Agentから会社としてのユーザーフレンドリーUIへの矢印 */}
                    <line x1="500" y1="200" x2="500" y2="180" stroke="#4169E1" strokeWidth="3" markerEnd="url(#arrowhead)"/>
                    <text x="520" y="194" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#111827">生成</text>
                    
                    {/* 右側のAI Agentから個人・各組織としてのユーザーフレンドリーUIへの矢印 */}
                    <line x1="1050" y1="200" x2="1050" y2="180" stroke="#4169E1" strokeWidth="3" markerEnd="url(#arrowhead)"/>
                    <text x="1070" y="194" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#111827">生成</text>
                    
                    {/* AIによる成果物レイヤー（七段目） */}
                    {/* 中央：ユーザーフレンドリーUI */}
                    <rect className="arch-box corresponding-group" x="250" y="100" width="500" height="80" fill="url(#uiAccentGradient)" stroke="#2563EB" strokeWidth="3" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="500" y="140" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">ユーザーフレンドリーUI</text>
                    
                    {/* 右側：ユーザーフレンドリーUI */}
                    <rect className="arch-box corresponding-group" x="800" y="100" width="500" height="80" fill="url(#uiAccentGradient)" stroke="#2563EB" strokeWidth="3" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1050" y="140" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">ユーザーフレンドリーUI</text>
                    
                    {/* 最下段のインフラ基盤 */}
                    {/* 左側：インフラ基盤 */}
                    <rect className="arch-box" x="0" y="700" width="200" height="80" fill="url(#boxGradient5)" stroke="#4169E1" strokeWidth="2" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="100" y="740" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">インフラ基盤</text>
                    
                    {/* 中央：全社基盤 - 淡い枠 */}
                    <rect className="arch-box corresponding-group" x="250" y="700" width="500" height="80" fill="url(#boxGradient5)" stroke="#4169E1" strokeWidth="1" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="500" y="740" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">インフラ基盤</text>
                    
                    {/* 右側：個人端末 */}
                    <rect className="arch-box corresponding-group" x="800" y="700" width="500" height="80" fill="white" stroke="#4169E1" strokeWidth="1" rx="8" filter="url(#shadow)"/>
                    <text className="arch-text" x="1050" y="740" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#111827" dominantBaseline="middle">個人端末</text>
                    
                    {/* 右側説明パネル - 各階層と同じ位置に配置（中央揃え） */}
                    {/* ユーザーフレンドリーUIの説明 */}
                    <text x="1400" y="125" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">
                      <tspan fill="#2563EB" fontWeight="bold">使いやすい</tspan>UI
                    </text>
                    <text x="1400" y="155" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">
                      <tspan fill="#2563EB" fontWeight="bold">使いやすい</tspan>がゆえに<tspan fill="#2563EB" fontWeight="bold">データも集まる</tspan>好循環
                    </text>
                    
                    {/* AI Agentの説明 */}
                    <text x="1400" y="225" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">
                      会社が管理する基盤モデルを活用することで<tspan fill="#2563EB" fontWeight="bold">セキュリティ担保</tspan>
                    </text>
                    <text x="1400" y="255" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">
                      個人毎に必要なデータをAIに連携できる<tspan fill="#2563EB" fontWeight="bold">アーキテクチャが重要</tspan>
                    </text>
                    
                    {/* 参照データ範囲指定の説明 */}
                    <text x="1400" y="325" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">個人・組織レベルで参照するデータの範囲を指定。</text>
                    <text x="1400" y="355" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">
                      本当に<tspan fill="#2563EB" fontWeight="bold">価値のあるアウトプット</tspan>には、<tspan fill="#2563EB" fontWeight="bold">個人毎に必要なデータが異なる</tspan>。
                    </text>
                    
                    {/* データ整理・可視化の説明 */}
                    <text x="1400" y="425" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">
                      <tspan fill="#2563EB" fontWeight="bold">重要なデータ</tspan>は個人や組織毎に異なる。
                    </text>
                    <text x="1400" y="455" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">
                      全体に<tspan fill="#2563EB" fontWeight="bold">統合するもの</tspan>と、個人の<tspan fill="#2563EB" fontWeight="bold">分散環境で管理するべきもの</tspan>が存在。
                    </text>
                    
                    {/* 重要なデータソースの説明 */}
                    <text x="1400" y="525" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">
                      <tspan fill="#2563EB" fontWeight="bold">統合</tspan>：全社統合データレイクに蓄積された企業データ。
                    </text>
                    <text x="1400" y="555" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">
                      <tspan fill="#2563EB" fontWeight="bold">分散</tspan>：メール、チャット履歴、組織ごとのストレージなど。
                    </text>
                    
                    {/* 環境/ネットワークの説明 */}
                    <text x="1400" y="625" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">
                      <tspan fill="#2563EB" fontWeight="bold">統合</tspan>：オンプレミス・クラウド環境。
                    </text>
                    <text x="1400" y="655" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">
                      <tspan fill="#2563EB" fontWeight="bold">分散</tspan>：ローカル・クラウド環境。
                    </text>
                    
                    {/* インフラ基盤/個人端末の説明 */}
                    <text x="1400" y="725" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">
                      <tspan fill="#2563EB" fontWeight="bold">統合</tspan>：全社のインフラ基盤（サーバー、ストレージなど）。
                    </text>
                    <text x="1400" y="755" fontFamily="Arial, sans-serif" fontSize="22" fill="#374151" dominantBaseline="middle">
                      <tspan fill="#2563EB" fontWeight="bold">分散</tspan>：個人の端末（PC、スマートフォンなど）で動作。
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            <div 
              data-page-container="5"
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px', margin: 0 }}>
                  5. パーソナルDXとパーソナルデータレイクの重要性
                </h4>
                <span id="page-overview-5" style={{ fontSize: '12px', color: '#94A3B8' }}>5</span>
              </div>
              <h2 style={{ fontSize: '38px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-text)', lineHeight: '1.4', textAlign: 'center' }}>
                パーソナルDXとパーソナルデータレイクがAIファクトリーの原動力
              </h2>
              <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '20px', color: 'var(--color-text-light)', lineHeight: '1.6', textAlign: 'center', fontStyle: 'normal' }}>
                UIがAIファクトリーの"起動スイッチ"になる
              </h3>
              <p style={{ marginBottom: '12px', paddingLeft: '11px', fontSize: '15px', lineHeight: '1.8', fontWeight: 500 }}>
                AI価値の本質と伊藤忠の戦略優位性を踏まえると、<br />
                次の成長エンジンは<strong>"パーソナルDX × パーソナルデータレイク"</strong>である。これらを実現するためには、ユーザーフレンドリーなUIが欠かせない。
              </p>

              <div style={{ marginTop: '24px', marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border-color)' }}>
                <h4 style={{ 
                  fontSize: '18px', 
                  fontWeight: 700, 
                  marginBottom: '12px', 
                  color: '#1E293B', 
                  borderLeft: '4px solid #3B82F6', 
                  paddingLeft: '12px'
                }}>
                  株式会社AIアシスタントの使命
                </h4>
              <div style={{ marginBottom: '12px', paddingLeft: '11px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                  <img 
                    src="/ChatGPT Image 2025年11月26日 12_15_46.png" 
                    alt="株式会社AIアシスタントの使命"
                    loading="lazy"
                    decoding="async"
                    style={{ 
                      maxWidth: '320px', 
                      width: '100%',
                      height: 'auto', 
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }} 
                  />
                  <p style={{ 
                    textAlign: 'center', 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: 'var(--color-primary)',
                    marginTop: '8px',
                    fontStyle: 'italic'
                  }}>
                    Your Personal AI Partner
                  </p>
                </div>
                <div style={{ flex: 1 }}>
                  {/* 1. Mission */}
                  <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <h5 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '0', color: 'var(--color-text)', minWidth: '100px', flexShrink: 0 }}>
                      1. Mission
                    </h5>
                    <div style={{ flex: 1 }}>
                      <p style={{ marginBottom: '4px', fontSize: '18px', lineHeight: '1.8', fontWeight: 600 }}>
                        個人と組織が自然にAIを使える未来を創る。
                      </p>
                      <p style={{ marginBottom: '0', fontSize: '12px', lineHeight: '1.6', color: 'var(--color-text-light)', fontStyle: 'italic' }}>
                        — Powered by Personal DX &amp; AI Factory Architecture
                      </p>
                    </div>
                  </div>

                  {/* 2. Vision */}
                  <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <h5 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '0', color: 'var(--color-text)', minWidth: '100px', flexShrink: 0 }}>
                      2. Vision
                    </h5>
                    <div style={{ flex: 1 }}>
                      <p style={{ marginBottom: '0', fontSize: '18px', lineHeight: '1.8', fontWeight: 600 }}>
                        すべての人に個別最適なAIアシスタントを提供する社会構造の実現。
                      </p>
                    </div>
                  </div>

                  {/* 3. Value */}
                  <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <h5 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '0', color: 'var(--color-text)', minWidth: '100px', flexShrink: 0 }}>
                      3. Value
                    </h5>
                    <div style={{ flex: 1 }}>
                      <p style={{ marginBottom: '8px', fontSize: '18px', lineHeight: '1.8', fontWeight: 600 }}>
                        ユーザー中心の設計とオープンな協業で、AI活用の価値を最大化する。
                      </p>
                      <ul style={{ marginBottom: '0', paddingLeft: '30px', fontSize: '14px', lineHeight: '2.0', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '8px' }}>ユーザーフレンドリーを最優先</li>
                        <li style={{ marginBottom: '8px' }}>直感的な体験を最短で提供</li>
                        <li style={{ marginBottom: '8px' }}>オープンな知識共有とデータ透明性を重視</li>
                      </ul>
                    </div>
                  </div>

                  {/* 4. Business / Service */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      <h5 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '0', color: 'var(--color-text)', minWidth: '100px', flexShrink: 0 }}>
                        4. Business
                      </h5>
                      <div style={{ flex: 1 }}>
                        <p style={{ marginBottom: '8px', fontSize: '18px', lineHeight: '1.8', fontWeight: 600 }}>
                          すべての企業にAIファーストカンパニーへの道を提供する。
                        </p>
                        <ul style={{ marginBottom: '12px', paddingLeft: '30px', fontSize: '14px', lineHeight: '2.0', listStyleType: 'disc' }}>
                          <li style={{ marginBottom: '8px' }}>AIアプリケーションの開発・運用</li>
                          <li style={{ marginBottom: '8px' }}>人材育成・教育、AI導入のルール設計</li>
                          <li style={{ marginBottom: '8px' }}>企業向けAIコンサルとシステム開発支援</li>
                        </ul>
                        <p style={{ marginBottom: '0', fontSize: '14px', lineHeight: '1.8', color: 'var(--color-text-light)' }}>
                          自社開発・自社サービス事業としてパーソナルアプリケーションを提供し、AIファーストカンパニーとしての実績とナレッジを獲得。獲得した経験を元にAI導入のルール設計・人材育成・教育事業を展開し、伊藤忠グループのエコシステムによる顧客伴奏型の業務コンサル事業を拡大。顧客課題を具体化しAI駆動開発・DX支援SI事業で企業のシステム開発を支援する。
                        </p>
                      </div>
                    </div>
                  </div>
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

