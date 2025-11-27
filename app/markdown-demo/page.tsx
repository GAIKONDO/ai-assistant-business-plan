'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import Layout from '@/components/Layout';
import MarkdownRenderer from '@/components/MarkdownRenderer';

declare global {
  interface Window {
    p5?: any;
  }
}

export default function MarkdownDemoPage() {
  const canvasRef6 = useRef<HTMLDivElement>(null);
  const canvasRef7 = useRef<HTMLDivElement>(null);
  const canvasRef8 = useRef<HTMLDivElement>(null);
  const p5Loaded = useRef(false);
  const p5Instance6 = useRef<any>(null);
  const p5Instance7 = useRef<any>(null);
  const p5Instance8 = useRef<any>(null);
  const [isComplete6, setIsComplete6] = useState(false);
  const [isComplete7, setIsComplete7] = useState(false);
  const [isComplete8, setIsComplete8] = useState(false);

  useEffect(() => {
    const initArt = () => {
      if (typeof window === 'undefined' || !window.p5) {
        return;
      }

    // アート1: アトラクタアート（横幅広げ版）
    if (canvasRef6.current && !canvasRef6.current.hasChildNodes()) {
      const sketch6 = (p: any) => {
        const a = -1.4;
        const b = 1.6;
        const c = 1.0;
        const d = 0.7;
        let x = 0.01;
        let y = 0.0;

        p.setup = () => {
          p.createCanvas(600, 600);
          p.pixelDensity(2);
          p.background(255);
          p.stroke(0, 8); // 元に戻す
          p.strokeWeight(0.4); // 元に戻す
          p.noFill();
          
          p.translate(p.width / 2, p.height / 2);
          
          const steps = 700000; // 元に戻す
          const scale = p.min(p.width, p.height) * 0.25;
          
          // 非同期で描画（パフォーマンス向上）
          let stepCount = 0;
          const drawStep = () => {
            if (stepCount >= steps) {
              p.noLoop();
              return;
            }
            
            const batchSize = 2000; // 一度に描画するステップ数
            for (let i = 0; i < batchSize && stepCount < steps; i++) {
              const x1 = p.sin(a * y) + c * p.cos(a * x);
              const y1 = p.sin(b * x) + d * p.cos(b * y);
              
              // 横だけ1.3倍、縦は少し縮める
              const sx = x1 * scale * 1.3;
              const sy = y1 * scale * 0.9;
              
              p.point(sx, sy);
              
              x = x1;
              y = y1;
              stepCount++;
            }
            
            if (stepCount < steps) {
              setTimeout(drawStep, 0);
            } else {
              p.noLoop();
              setIsComplete6(true);
            }
          };
          
          drawStep();
        };

        p.draw = () => {
          // 描画中は何もしない（setupで描画）
        };
      };
      if (p5Instance6.current) {
        try {
          p5Instance6.current.remove();
        } catch (e) {
          // エラーは無視
        }
      }
      p5Instance6.current = new window.p5(sketch6, canvasRef6.current);
    }

    // アート2: Neural Flow Field - AIっぽいモノトーンアート
    if (canvasRef7.current && !canvasRef7.current.hasChildNodes()) {
      const sketch7 = (p: any) => {
        const NUM_PARTICLES = 4000;
        const STEPS_PER_PARTICLE = 300;
        const NOISE_SCALE = 0.003;
        const particles: any[] = [];
        let isDrawing = false;

        p.setup = () => {
          p.createCanvas(600, 600);
          p.pixelDensity(2);
          p.background(255);
          p.stroke(0, 10); // 黒・かなり薄め
          p.strokeWeight(0.35);
          p.noFill();

          // 粒子を中心付近の帯状に配置（データの流れっぽく）
          for (let i = 0; i < NUM_PARTICLES; i++) {
            const t = p.random(-1, 1);
            const x = p.width * (0.2 + 0.6 * p.random()); // 横広く
            const y = p.height * (0.5 + t * 0.15); // 中央あたりに帯状
            particles.push({ x, y });
          }

          isDrawing = true;
          
          // 非同期で描画（パフォーマンス向上）
          let stepCount = 0;
          const drawStep = () => {
            if (stepCount >= STEPS_PER_PARTICLE) {
              isDrawing = false;
              p.noLoop();
              return;
            }

            const batchSize = 10; // 一度に処理するステップ数
            for (let s = 0; s < batchSize && stepCount < STEPS_PER_PARTICLE; s++) {
              particles.forEach((particle) => {
                drawParticle(particle, p);
              });
              stepCount++;
            }

            if (stepCount < STEPS_PER_PARTICLE) {
              setTimeout(drawStep, 0);
            } else {
              isDrawing = false;
              p.noLoop();
              setIsComplete7(true);
            }
          };

          drawStep();
        };

        const drawParticle = (particle: any, p: any) => {
          // ノイズから流れの方向を決める（疑似的な力場）
          const angle = p.noise(particle.x * NOISE_SCALE, particle.y * NOISE_SCALE) * p.TWO_PI * 4.0;

          const vx = p.cos(angle);
          const vy = p.sin(angle);

          particle.x += vx;
          particle.y += vy * 0.9; // 少しだけ縦方向を抑えると流れが綺麗

          // 画面外に出たら戻す
          if (particle.x < -50 || particle.x > p.width + 50 || 
              particle.y < -50 || particle.y > p.height + 50) {
            particle.x = p.random(p.width * 0.2, p.width * 0.8);
            particle.y = p.random(p.height * 0.4, p.height * 0.6);
            return;
          }

          // 中央の軌跡 + 左右対称にミラー（AIチップっぽい幾何学感）
          p.point(particle.x, particle.y);
          const mx = p.width - particle.x;
          p.point(mx, particle.y);
        };

        p.draw = () => {
          // 描画中は何もしない（setupで描画）
        };
      };
      if (p5Instance7.current) {
        try {
          p5Instance7.current.remove();
        } catch (e) {
          // エラーは無視
        }
      }
      p5Instance7.current = new window.p5(sketch7, canvasRef7.current);
    }

    // アート3: Brain / Human Hybrid Neural Field
    if (canvasRef8.current && !canvasRef8.current.hasChildNodes()) {
      const sketch8 = (p: any) => {
        const NUM_PARTICLES = 5000;
        const STEPS_PER_PARTICLE = 280;
        const NOISE_SCALE = 0.004;
        const particles: any[] = [];
        let hubs: any[] = [];
        let cx = 0;
        let cy = 0;

        const randomPointInHead = (cx: number, cy: number) => {
          let x, y;
          let tries = 0;

          while (true) {
            x = p.random(cx - p.width * 0.22, cx + p.width * 0.22);
            y = p.random(cy - p.height * 0.30, cy + p.height * 0.38);

            if (isInsideHead(x, y, cx, cy)) break;

            tries++;
            if (tries > 1000) break;
          }

          return { x, y };
        };

        const isInsideHead = (x: number, y: number, cx: number, cy: number) => {
          // 上部：脳の楕円
          const dx = (x - cx) / (p.width * 0.22);
          const dy = (y - (cy - p.height * 0.05)) / (p.height * 0.28);
          const inBrain = dx * dx + dy * dy <= 1.0;

          // 下部：首・顔の下部を少しだけ追加
          const inNeck = (y > cy + p.height * 0.10) &&
                         (p.abs(x - cx) < p.width * 0.10);

          return inBrain || inNeck;
        };

        const drawParticle = (particle: any, cx: number, cy: number) => {
          // パーリンノイズによる基本の流れ（有機的）
          const angle = p.noise(particle.x * NOISE_SCALE, particle.y * NOISE_SCALE) * p.TWO_PI * 3.0;

          let vx = p.cos(angle);
          let vy = p.sin(angle);

          // ハブへの引力（AIネットワークっぽさ）
          let hubForceX = 0;
          let hubForceY = 0;
          for (const h of hubs) {
            const dx = h.x - particle.x;
            const dy = h.y - particle.y;
            const d = p.sqrt(dx * dx + dy * dy);
            if (d > 0.001) {
              const strength = 0.4 / (d * 0.002 + 1.0); // 近いほど少し強く
              hubForceX += (dx / d) * strength;
              hubForceY += (dy / d) * strength;
            }
          }

          vx += hubForceX;
          vy += hubForceY;

          // 「人っぽさ」＝上下方向に少し流れを強調（重力のような感じ）
          vy += 0.05;

          // 進行
          const ox = particle.x;
          const oy = particle.y;
          particle.x += vx;
          particle.y += vy;

          // 頭の外に出たら描画せずリスポーン
          if (!isInsideHead(particle.x, particle.y, cx, cy)) {
            const np = randomPointInHead(cx, cy);
            particle.x = np.x;
            particle.y = np.y;
            return;
          }

          // 元の位置から線を引く（微妙なストローク）
          p.line(ox, oy, particle.x, particle.y);
        };

        p.setup = () => {
          p.createCanvas(600, 600);
          p.pixelDensity(2);
          p.background(255);
          p.stroke(0, 10);
          p.strokeWeight(0.35);
          p.noFill();

          // 脳のシルエット中心
          cx = p.width * 0.5;
          cy = p.height * 0.45;

          // 情報ハブを数点置く（左脳/右脳＋前頭葉イメージ）
          hubs = [
            p.createVector(cx - p.width * 0.10, cy - p.height * 0.05),
            p.createVector(cx + p.width * 0.10, cy - p.height * 0.02),
            p.createVector(cx, cy + p.height * 0.05)
          ];

          // 粒子を「頭の形」の中に配置
          for (let i = 0; i < NUM_PARTICLES; i++) {
            particles.push(randomPointInHead(cx, cy));
          }

          // 非同期で描画（パフォーマンス向上）
          let stepCount = 0;
          const drawStep = () => {
            if (stepCount >= STEPS_PER_PARTICLE) {
              p.noLoop();
              return;
            }

            const batchSize = 10; // 一度に処理するステップ数
            for (let s = 0; s < batchSize && stepCount < STEPS_PER_PARTICLE; s++) {
              particles.forEach((particle) => {
                drawParticle(particle, cx, cy);
              });
              stepCount++;
            }

            if (stepCount < STEPS_PER_PARTICLE) {
              setTimeout(drawStep, 0);
            } else {
              p.noLoop();
              setIsComplete8(true);
            }
          };

          drawStep();
        };

        p.draw = () => {
          // 描画中は何もしない（setupで描画）
        };
      };
      if (p5Instance8.current) {
        try {
          p5Instance8.current.remove();
        } catch (e) {
          // エラーは無視
        }
      }
      p5Instance8.current = new window.p5(sketch8, canvasRef8.current);
    }
    };

    if (p5Loaded.current && typeof window !== 'undefined' && window.p5) {
      initArt();
    }

    const handleP5Loaded = () => {
      if (typeof window !== 'undefined' && window.p5) {
        initArt();
      }
    };

    window.addEventListener('p5loaded', handleP5Loaded);
    return () => {
      window.removeEventListener('p5loaded', handleP5Loaded);
      
      // p5.jsインスタンスをクリーンアップ
      if (p5Instance6.current) {
        try {
          p5Instance6.current.remove();
        } catch (e) {
          // エラーは無視
        }
        p5Instance6.current = null;
      }
      if (p5Instance7.current) {
        try {
          p5Instance7.current.remove();
        } catch (e) {
          // エラーは無視
        }
        p5Instance7.current = null;
      }
      if (p5Instance8.current) {
        try {
          p5Instance8.current.remove();
        } catch (e) {
          // エラーは無視
        }
        p5Instance8.current = null;
      }
      
      // DOM要素もクリア
      if (canvasRef6.current) {
        canvasRef6.current.innerHTML = '';
      }
      if (canvasRef7.current) {
        canvasRef7.current.innerHTML = '';
      }
      if (canvasRef8.current) {
        canvasRef8.current.innerHTML = '';
      }
    };
  }, []);

  const markdownContent = `## タイポグラフィデザイン

### パーソナルDX関連ワード

\`\`\`typography-art:パーソナルDX関連ワード
{
  "words": [
    "パーソナルDX",
    "パーソナルデータレイクス",
    "ユーザーフレンドリーUI",
    "ミッションクリティカル",
    "データドリブン",
    "ユーザーエクスペリエンス",
    "デジタルトランスフォーメーション",
    "カスタマイゼーション",
    "パーソナライゼーション",
    "セルフサービス",
    "オムニチャネル",
    "リアルタイム分析",
    "データ統合",
    "API連携",
    "クラウドネイティブ",
    "マイクロサービス",
    "コンテナ化",
    "DevOps",
    "CI/CD",
    "自動化",
    "機械学習",
    "AI活用",
    "予測分析",
    "ビジネスインテリジェンス"
  ],
  "width": 1000,
  "height": 800,
  "backgroundColor": "#ffffff",
  "textColor": "#000000",
  "minFontSize": 28,
  "maxFontSize": 140,
  "rotationRange": 45
}
\`\`\`

## Vega-Liteグラフの例

### 1. 棒グラフ

\`\`\`vega-lite:売上推移
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "description": "月別売上推移",
  "data": {
    "values": [
      {"month": "1月", "sales": 1200000},
      {"month": "2月", "sales": 1500000},
      {"month": "3月", "sales": 1800000},
      {"month": "4月", "sales": 1600000},
      {"month": "5月", "sales": 2000000},
      {"month": "6月", "sales": 2200000}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "month", "type": "ordinal", "title": "月"},
    "y": {"field": "sales", "type": "quantitative", "title": "売上（円）"}
  }
}
\`\`\`

### 2. 折れ線グラフ

\`\`\`vega-lite:成長率
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "description": "成長率の推移",
  "data": {
    "values": [
      {"year": 2020, "growth": 5.2},
      {"year": 2021, "growth": 7.8},
      {"year": 2022, "growth": 12.3},
      {"year": 2023, "growth": 15.6},
      {"year": 2024, "growth": 18.9}
    ]
  },
  "mark": {"type": "line", "point": true},
  "encoding": {
    "x": {"field": "year", "type": "ordinal", "title": "年"},
    "y": {"field": "growth", "type": "quantitative", "title": "成長率（%）"}
  }
}
\`\`\`

### 3. 円グラフ

\`\`\`vega-lite:事業別売上構成比
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "description": "事業別売上構成比",
  "data": {
    "values": [
      {"category": "AI人材育成", "value": 35},
      {"category": "AI導入支援", "value": 25},
      {"category": "コンサルティング", "value": 20},
      {"category": "その他", "value": 20}
    ]
  },
  "mark": {"type": "arc", "innerRadius": 50},
  "encoding": {
    "theta": {"field": "value", "type": "quantitative"},
    "color": {"field": "category", "type": "nominal", "title": "事業カテゴリ"}
  }
}
\`\`\`

### 4. 散布図

\`\`\`vega-lite:顧客満足度と売上の関係
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "description": "顧客満足度と売上の関係",
  "data": {
    "values": [
      {"satisfaction": 3.5, "sales": 500000, "region": "関東"},
      {"satisfaction": 4.2, "sales": 800000, "region": "関東"},
      {"satisfaction": 4.8, "sales": 1200000, "region": "関東"},
      {"satisfaction": 3.8, "sales": 600000, "region": "関西"},
      {"satisfaction": 4.5, "sales": 900000, "region": "関西"},
      {"satisfaction": 4.9, "sales": 1100000, "region": "関西"}
    ]
  },
  "mark": "circle",
  "encoding": {
    "x": {"field": "satisfaction", "type": "quantitative", "title": "顧客満足度"},
    "y": {"field": "sales", "type": "quantitative", "title": "売上（円）"},
    "color": {"field": "region", "type": "nominal", "title": "地域"},
    "size": {"field": "sales", "type": "quantitative"}
  }
}
\`\`\`

## スタイリッシュなグラフの例

### 1. モダンなエリアチャート（グラデーション）

\`\`\`vega-lite:AI事業の成長トレンド
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "description": "AI事業の成長トレンド",
  "width": 600,
  "height": 300,
  "data": {
    "values": [
      {"quarter": "2023 Q1", "revenue": 1200000, "target": 1500000},
      {"quarter": "2023 Q2", "revenue": 1800000, "target": 2000000},
      {"quarter": "2023 Q3", "revenue": 2400000, "target": 2500000},
      {"quarter": "2023 Q4", "revenue": 3200000, "target": 3000000},
      {"quarter": "2024 Q1", "revenue": 4100000, "target": 3500000},
      {"quarter": "2024 Q2", "revenue": 5200000, "target": 4000000}
    ]
  },
  "layer": [
    {
      "mark": {
        "type": "area",
        "opacity": 0.3,
        "interpolate": "monotone"
      },
      "encoding": {
        "x": {"field": "quarter", "type": "ordinal", "title": "四半期", "axis": {"labelAngle": -45}},
        "y": {"field": "target", "type": "quantitative", "title": "金額（円）"},
        "color": {"value": "#8B5CF6"}
      }
    },
    {
      "mark": {
        "type": "area",
        "opacity": 0.7,
        "interpolate": "monotone"
      },
      "encoding": {
        "x": {"field": "quarter", "type": "ordinal"},
        "y": {"field": "revenue", "type": "quantitative"},
        "color": {"value": "#1F2933"}
      }
    },
    {
      "mark": {
        "type": "line",
        "strokeWidth": 3,
        "point": true
      },
      "encoding": {
        "x": {"field": "quarter", "type": "ordinal"},
        "y": {"field": "revenue", "type": "quantitative"},
        "color": {"value": "#1F2933"}
      }
    }
  ]
}
\`\`\`

### 2. スタイリッシュな棒グラフ（カスタムカラー）

\`\`\`vega-lite:事業別売上実績
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "description": "事業別売上実績",
  "width": 600,
  "height": 400,
  "data": {
    "values": [
      {"business": "AI人材育成", "sales": 3500000, "growth": 25},
      {"business": "AI導入支援", "sales": 2800000, "growth": 18},
      {"business": "コンサルティング", "sales": 2200000, "growth": 12},
      {"business": "データ分析", "sales": 1800000, "growth": 30},
      {"business": "システム開発", "sales": 1500000, "growth": 8}
    ]
  },
  "mark": {
    "type": "bar",
    "cornerRadius": 4
  },
  "encoding": {
    "x": {
      "field": "business",
      "type": "ordinal",
      "title": "事業",
      "axis": {"labelAngle": -45, "labelFontSize": 12}
    },
    "y": {
      "field": "sales",
      "type": "quantitative",
      "title": "売上（円）",
      "axis": {"format": "~s"}
    },
    "color": {
      "field": "growth",
      "type": "quantitative",
      "scale": {
        "range": ["#E5E7EB", "#1F2933"],
        "domain": [0, 35]
      },
      "legend": {
        "title": "成長率（%）",
        "gradientLength": 300
      }
    },
    "tooltip": [
      {"field": "business", "title": "事業"},
      {"field": "sales", "title": "売上", "format": ",.0f"},
      {"field": "growth", "title": "成長率", "format": ".1f"}
    ]
  }
}
\`\`\`

### 3. インタラクティブなダッシュボード風グラフ

\`\`\`vega-lite:月別パフォーマンス分析
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "description": "月別パフォーマンス分析",
  "width": 700,
  "height": 400,
  "data": {
    "values": [
      {"month": "1月", "revenue": 1200000, "cost": 800000, "profit": 400000},
      {"month": "2月", "revenue": 1500000, "cost": 950000, "profit": 550000},
      {"month": "3月", "revenue": 1800000, "cost": 1100000, "profit": 700000},
      {"month": "4月", "revenue": 1600000, "cost": 1000000, "profit": 600000},
      {"month": "5月", "revenue": 2000000, "cost": 1200000, "profit": 800000},
      {"month": "6月", "revenue": 2200000, "cost": 1300000, "profit": 900000}
    ]
  },
  "encoding": {
    "x": {"field": "month", "type": "ordinal", "title": "月"}
  },
  "layer": [
    {
      "mark": {
        "type": "bar",
        "opacity": 0.6,
        "cornerRadius": 2
      },
      "encoding": {
        "y": {
          "field": "revenue",
          "type": "quantitative",
          "title": "金額（円）",
          "axis": {"format": "~s"}
        },
        "color": {"value": "#1F2933"}
      }
    },
    {
      "mark": {
        "type": "line",
        "strokeWidth": 3,
        "point": {"filled": true, "size": 100}
      },
      "encoding": {
        "y": {
          "field": "profit",
          "type": "quantitative"
        },
        "color": {"value": "#10B981"}
      }
    }
  ]
}
\`\`\`

### 4. エレガントな円グラフ（ドーナツチャート）

\`\`\`vega-lite:市場シェア分析
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "description": "市場シェア分析",
  "width": 500,
  "height": 500,
  "data": {
    "values": [
      {"category": "大企業向けAI人材育成", "share": 35, "color": "#1F2933"},
      {"category": "AI導入支援", "share": 25, "color": "#3B82F6"},
      {"category": "コンサルティング", "share": 20, "color": "#10B981"},
      {"category": "データ分析", "share": 12, "color": "#F59E0B"},
      {"category": "その他", "share": 8, "color": "#6B7280"}
    ]
  },
  "mark": {
    "type": "arc",
    "innerRadius": 80,
    "stroke": "#fff",
    "strokeWidth": 2
  },
  "encoding": {
    "theta": {
      "field": "share",
      "type": "quantitative",
      "stack": true
    },
    "color": {
      "field": "category",
      "type": "nominal",
      "scale": {
        "range": ["#1F2933", "#3B82F6", "#10B981", "#F59E0B", "#6B7280"]
      },
      "legend": {
        "title": "カテゴリ",
        "orient": "right",
        "labelFontSize": 12
      }
    },
    "tooltip": [
      {"field": "category", "title": "カテゴリ"},
      {"field": "share", "title": "シェア", "format": ".1f"}
    ]
  }
}
\`\`\`

### 5. モダンなヒートマップ

\`\`\`vega-lite:週別・時間帯別アクティビティ
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "description": "週別・時間帯別アクティビティ",
  "width": 600,
  "height": 300,
  "data": {
    "values": [
      {"day": "月", "hour": "9時", "activity": 45},
      {"day": "月", "hour": "10時", "activity": 78},
      {"day": "月", "hour": "11時", "activity": 92},
      {"day": "月", "hour": "12時", "activity": 65},
      {"day": "月", "hour": "13時", "activity": 88},
      {"day": "月", "hour": "14時", "activity": 95},
      {"day": "月", "hour": "15時", "activity": 82},
      {"day": "火", "hour": "9時", "activity": 52},
      {"day": "火", "hour": "10時", "activity": 85},
      {"day": "火", "hour": "11時", "activity": 98},
      {"day": "火", "hour": "12時", "activity": 70},
      {"day": "火", "hour": "13時", "activity": 90},
      {"day": "火", "hour": "14時", "activity": 100},
      {"day": "火", "hour": "15時", "activity": 88},
      {"day": "水", "hour": "9時", "activity": 48},
      {"day": "水", "hour": "10時", "activity": 80},
      {"day": "水", "hour": "11時", "activity": 95},
      {"day": "水", "hour": "12時", "activity": 68},
      {"day": "水", "hour": "13時", "activity": 85},
      {"day": "水", "hour": "14時", "activity": 98},
      {"day": "水", "hour": "15時", "activity": 85}
    ]
  },
  "mark": {
    "type": "rect",
    "cornerRadius": 4
  },
  "encoding": {
    "x": {
      "field": "hour",
      "type": "ordinal",
      "title": "時間帯",
      "axis": {"labelAngle": 0}
    },
    "y": {
      "field": "day",
      "type": "ordinal",
      "title": "曜日"
    },
    "color": {
      "field": "activity",
      "type": "quantitative",
      "scale": {
        "range": ["#F3F4F6", "#1F2933"],
        "domain": [0, 100]
      },
      "legend": {
        "title": "アクティビティ",
        "gradientLength": 300
      }
    },
    "tooltip": [
      {"field": "day", "title": "曜日"},
      {"field": "hour", "title": "時間帯"},
      {"field": "activity", "title": "アクティビティ", "format": ".0f"}
    ]
  }
}
\`\`\`
`;

  return (
    <Layout>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"
        onLoad={() => {
          p5Loaded.current = true;
          if (typeof window !== 'undefined' && window.p5) {
            // 強制的に再レンダリングをトリガー
            setTimeout(() => {
              window.dispatchEvent(new Event('p5loaded'));
            }, 100);
          }
        }}
      />
      <div className="card">
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
            スタイリッシュなアート作品
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>1. アトラクタアート（横幅広げ版）</h3>
              <div style={{ position: 'relative' }}>
                <div ref={canvasRef6} style={{ border: '1px solid var(--color-border-color)', borderRadius: '6px', overflow: 'hidden' }} />
                {isComplete6 && (
                  <button
                    onClick={() => {
                      if (p5Instance6.current?.canvas) {
                        const link = document.createElement('a');
                        link.download = 'attractor-art.png';
                        link.href = p5Instance6.current.canvas.toDataURL('image/png');
                        link.click();
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                    }}
                  >
                    PNGでダウンロード
                  </button>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '8px' }}>
                700,000ステップで描画される高密度のパターン。横幅を広げてより横長の形状に（描画に時間がかかります）
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>2. Neural Flow Field - AIっぽいモノトーンアート</h3>
              <div style={{ position: 'relative' }}>
                <div ref={canvasRef7} style={{ border: '1px solid var(--color-border-color)', borderRadius: '6px', overflow: 'hidden' }} />
                {isComplete7 && (
                  <button
                    onClick={() => {
                      if (p5Instance7.current?.canvas) {
                        const link = document.createElement('a');
                        link.download = 'neural-flow-field.png';
                        link.href = p5Instance7.current.canvas.toDataURL('image/png');
                        link.click();
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                    }}
                  >
                    PNGでダウンロード
                  </button>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '8px' }}>
                4,000個のパーティクルがノイズベースのフローフィールドに従って流れる。左右対称のミラーリングでAIチップのような幾何学的な美しさを表現（描画に時間がかかります）
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>3. Brain / Human Hybrid Neural Field</h3>
              <div style={{ position: 'relative' }}>
                <div ref={canvasRef8} style={{ border: '1px solid var(--color-border-color)', borderRadius: '6px', overflow: 'hidden' }} />
                {isComplete8 && (
                  <button
                    onClick={() => {
                      if (p5Instance8.current?.canvas) {
                        const link = document.createElement('a');
                        link.download = 'brain-neural-field.png';
                        link.href = p5Instance8.current.canvas.toDataURL('image/png');
                        link.click();
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                    }}
                  >
                    PNGでダウンロード
                  </button>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '8px' }}>
                5,000個のパーティクルが脳のシルエット内を流れる。ノイズベースのフローフィールドとハブへの引力で、人間とAIのハイブリッドな神経ネットワークを表現（描画に時間がかかります）
              </p>
            </div>
          </div>
        </div>

        <MarkdownRenderer content={markdownContent} className="markdown-content" />
      </div>
    </Layout>
  );
}

