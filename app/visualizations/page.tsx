'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import type { ChaosMapData } from '@/components/ChaosMap';
import type { BubbleData } from '@/components/BubbleChart';
import type { ScatterBubbleData } from '@/components/ScatterBubbleChart';
import type { PopulationData } from '@/components/PopulationPyramid';
import type { SunburstNode } from '@/components/BusinessSunburst';
import type { RadialBarData } from '@/components/BusinessRadialBar';
import type { AlluvialDiagramData } from '@/components/AlluvialDiagram';
import type { EcosystemAlluvialData } from '@/components/EcosystemAlluvialDiagram';

// 遅延読み込みコンポーネント（パフォーマンス最適化）
const ChaosMap = dynamic(() => import('@/components/ChaosMap').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => <ChartSkeleton height={600} />
});
const BubbleChart = dynamic(() => import('@/components/BubbleChart').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => <ChartSkeleton height={600} />
});
const ScatterBubbleChart = dynamic(() => import('@/components/ScatterBubbleChart').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => <ChartSkeleton height={600} />
});
const PopulationPyramid = dynamic(() => import('@/components/PopulationPyramid').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => <ChartSkeleton height={600} />
});
const BusinessSunburst = dynamic(() => import('@/components/BusinessSunburst').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => <ChartSkeleton height={600} />
});
const BusinessRadialBar = dynamic(() => import('@/components/BusinessRadialBar').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => <ChartSkeleton height={600} />
});
const AlluvialDiagram = dynamic(() => import('@/components/AlluvialDiagram').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => <ChartSkeleton height={600} />
});
const EcosystemAlluvialDiagram = dynamic(() => import('@/components/EcosystemAlluvialDiagram').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => <ChartSkeleton height={900} />
});

// チャートスケルトンコンポーネント
function ChartSkeleton({ height }: { height: number }) {
  return (
    <div 
      className="card" 
      style={{ 
        marginBottom: '24px', 
        height: `${height}px`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'loading 1.5s ease-in-out infinite',
      }}
    >
      <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>読み込み中...</p>
      <style jsx>{`
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// サンプルデータ（実際のデータはFirebaseなどから取得）
const sampleChaosMapData: ChaosMapData = {
  title: '市場カオスマップ 2024',
  bands: [
    { id: 'personal', label: '個人向け' },
    { id: 'enterprise', label: '企業向け' },
    { id: 'professional', label: '専門家向け' },
  ],
  segments: [
    { id: 'document', label: '文書作成・レビュー' },
    { id: 'management', label: '文書・案件管理' },
    { id: 'contract', label: '契約締結' },
    { id: 'application', label: '申請・出願' },
    { id: 'research', label: 'リサーチ・検索ポータル' },
    { id: 'due-diligence', label: 'デューデリ・フォレンジック' },
    { id: 'dispute', label: '紛争解決・訴訟' },
  ],
  cells: [
    {
      bandId: 'personal',
      segmentId: 'document',
      companies: [
        { name: 'サービスA', description: '個人向け文書作成サービス' },
        { name: 'サービスB', description: '簡単文書作成ツール' },
      ],
    },
    {
      bandId: 'enterprise',
      segmentId: 'document',
      companies: [
        { name: '企業向けサービスA', description: '企業向け文書作成' },
        { name: '企業向けサービスB', description: '文書レビューAI' },
        { name: '企業向けサービスC', description: '契約書作成ツール' },
      ],
    },
    {
      bandId: 'enterprise',
      segmentId: 'management',
      companies: [
        { name: '管理ツールA', description: '文書管理システム' },
        { name: '管理ツールB', description: '案件管理プラットフォーム' },
      ],
    },
    {
      bandId: 'enterprise',
      segmentId: 'contract',
      companies: [
        { name: '電子署名A', description: '電子契約サービス' },
        { name: '電子署名B', description: '契約管理プラットフォーム' },
      ],
    },
    {
      bandId: 'professional',
      segmentId: 'document',
      companies: [
        { name: '専門家ツールA', description: '専門家向け文書作成' },
      ],
    },
    {
      bandId: 'professional',
      segmentId: 'management',
      companies: [
        { name: '専門家管理A', description: '専門家向け案件管理' },
        { name: '専門家管理B', description: '高度な文書管理' },
      ],
    },
    {
      bandId: 'professional',
      segmentId: 'research',
      companies: [
        { name: 'リサーチツールA', description: '法律リサーチプラットフォーム' },
      ],
    },
  ],
};

// バブルチャート用のサンプルデータ（市場規模を表す）
const bubbleChartData: BubbleData[] = [
  // アジア市場
  { name: '中国', value: 1400, group: 'アジア', description: '最大の市場規模' },
  { name: 'インド', value: 1300, group: 'アジア', description: '急成長市場' },
  { name: '日本', value: 500, group: 'アジア', description: '成熟市場' },
  { name: 'インドネシア', value: 270, group: 'アジア', description: '成長市場' },
  { name: '韓国', value: 170, group: 'アジア', description: '技術先進市場' },
  { name: 'ベトナム', value: 97, group: 'アジア', description: '新興市場' },
  { name: 'タイ', value: 70, group: 'アジア', description: '成長市場' },
  { name: 'マレーシア', value: 33, group: 'アジア', description: '中規模市場' },
  { name: 'シンガポール', value: 57, group: 'アジア', description: 'ハブ市場' },
  { name: 'フィリピン', value: 110, group: 'アジア', description: '成長市場' },
  
  // 北米市場
  { name: 'アメリカ', value: 330, group: '北米', description: '主要市場' },
  { name: 'カナダ', value: 38, group: '北米', description: '安定市場' },
  
  // ヨーロッパ市場
  { name: 'ドイツ', value: 83, group: 'ヨーロッパ', description: 'EU最大市場' },
  { name: 'イギリス', value: 67, group: 'ヨーロッパ', description: '金融ハブ' },
  { name: 'フランス', value: 68, group: 'ヨーロッパ', description: '主要市場' },
  { name: 'イタリア', value: 60, group: 'ヨーロッパ', description: '主要市場' },
  { name: 'スペイン', value: 47, group: 'ヨーロッパ', description: '成長市場' },
  
  // その他
  { name: 'ブラジル', value: 215, group: '南米', description: '南米最大市場' },
  { name: 'メキシコ', value: 128, group: '南米', description: '成長市場' },
  { name: 'ロシア', value: 144, group: '東欧', description: '大規模市場' },
  { name: 'オーストラリア', value: 26, group: 'オセアニア', description: '安定市場' },
];

// 散布図バブルチャート用のサンプルデータ
const scatterBubbleData: ScatterBubbleData[] = [
  // 汎用的なサービス（左側）
  { name: 'SaaSプラットフォーム', x: 0.1, y: 50000, size: 1000, category: 'プラットフォーム', description: '汎用的なSaaSサービス' },
  { name: 'クラウドストレージ', x: 0.15, y: 30000, size: 800, category: 'インフラ', description: '汎用的なストレージサービス' },
  { name: 'CRMシステム', x: 0.2, y: 100000, size: 1200, category: 'ビジネスツール', description: '標準的なCRM' },
  { name: '会計ソフト', x: 0.25, y: 50000, size: 600, category: 'ビジネスツール', description: '汎用的な会計ソフト' },
  
  // 中間的なサービス
  { name: '業界特化SaaS', x: 0.4, y: 200000, size: 500, category: '業界特化', description: '特定業界向けSaaS' },
  { name: 'カスタマイズ可能CRM', x: 0.45, y: 300000, size: 700, category: 'ビジネスツール', description: 'カスタマイズ可能なCRM' },
  { name: '業種別ERP', x: 0.5, y: 500000, size: 900, category: '業界特化', description: '業種別ERPシステム' },
  
  // パーソナル化されたサービス（右側）
  { name: '完全カスタム開発', x: 0.75, y: 2000000, size: 300, category: 'カスタム開発', description: '完全にカスタマイズされたシステム' },
  { name: 'コンサルティング+開発', x: 0.8, y: 5000000, size: 200, category: 'コンサルティング', description: 'コンサルティングを含む開発' },
  { name: '専属開発チーム', x: 0.85, y: 10000000, size: 150, category: 'カスタム開発', description: '専属チームによる開発' },
  { name: '完全オーダーメイド', x: 0.9, y: 20000000, size: 100, category: 'カスタム開発', description: '完全オーダーメイドシステム' },
  
  // その他
  { name: 'マーケットプレイス', x: 0.3, y: 150000, size: 1100, category: 'プラットフォーム', description: 'マーケットプレイス型サービス' },
  { name: 'API連携サービス', x: 0.35, y: 80000, size: 750, category: 'インフラ', description: 'API連携サービス' },
  { name: 'データ分析プラットフォーム', x: 0.55, y: 400000, size: 650, category: 'データ分析', description: 'データ分析プラットフォーム' },
  { name: 'AIカスタマイズサービス', x: 0.7, y: 1000000, size: 400, category: 'AI', description: 'AIを活用したカスタムサービス' },
];

// 人口ピラミッド用のサンプルデータ（日本の人口構造を模したデータ）
const populationData: PopulationData[] = [
  { age: '0-4', male: 2500000, female: 2380000 },
  { age: '5-9', male: 2600000, female: 2480000 },
  { age: '10-14', male: 2800000, female: 2680000 },
  { age: '15-19', male: 2900000, female: 2780000 },
  { age: '20-24', male: 3000000, female: 2900000 },
  { age: '25-29', male: 3200000, female: 3100000 },
  { age: '30-34', male: 3400000, female: 3300000 },
  { age: '35-39', male: 3600000, female: 3500000 },
  { age: '40-44', male: 3800000, female: 3700000 },
  { age: '45-49', male: 4000000, female: 3900000 },
  { age: '50-54', male: 4200000, female: 4100000 },
  { age: '55-59', male: 4400000, female: 4300000 },
  { age: '60-64', male: 4600000, female: 4500000 },
  { age: '65-69', male: 4800000, female: 4700000 },
  { age: '70-74', male: 4500000, female: 4600000 },
  { age: '75-79', male: 3800000, female: 4200000 },
  { age: '80-84', male: 2800000, female: 3600000 },
  { age: '85-89', male: 1800000, female: 2800000 },
  { age: '90+', male: 800000, female: 1800000 },
];

// Sunburst用のサンプルデータ（事業拡大の階層構造）
const sunburstData: SunburstNode = {
  name: '本社',
  children: [
    {
      name: '事業部A',
      value: 5000,
      children: [
        { name: 'プロジェクト1', value: 2000 },
        { name: 'プロジェクト2', value: 1500 },
        { name: 'プロジェクト3', value: 1500 },
      ],
    },
    {
      name: '事業部B',
      value: 3000,
      children: [
        { name: 'プロジェクト4', value: 1200 },
        { name: 'プロジェクト5', value: 1000 },
        { name: 'プロジェクト6', value: 800 },
      ],
    },
    {
      name: '事業部C',
      value: 2000,
      children: [
        { name: 'プロジェクト7', value: 800 },
        { name: 'プロジェクト8', value: 700 },
        { name: 'プロジェクト9', value: 500 },
      ],
    },
    {
      name: '新規事業',
      value: 1000,
      children: [
        { name: 'スタートアップ1', value: 400 },
        { name: 'スタートアップ2', value: 350 },
        { name: 'スタートアップ3', value: 250 },
      ],
    },
  ],
};

// ラジアルバー用のサンプルデータ（時系列での成長）
const radialBarData: RadialBarData[] = [
  {
    id: '事業部A',
    data: [
      { x: '2020', y: 1000 },
      { x: '2021', y: 1500 },
      { x: '2022', y: 2000 },
      { x: '2023', y: 2500 },
      { x: '2024', y: 3000 },
    ],
  },
  {
    id: '事業部B',
    data: [
      { x: '2020', y: 800 },
      { x: '2021', y: 1200 },
      { x: '2022', y: 1800 },
      { x: '2023', y: 2200 },
      { x: '2024', y: 2800 },
    ],
  },
  {
    id: '事業部C',
    data: [
      { x: '2020', y: 600 },
      { x: '2021', y: 900 },
      { x: '2022', y: 1300 },
      { x: '2023', y: 1700 },
      { x: '2024', y: 2000 },
    ],
  },
  {
    id: '新規事業',
    data: [
      { x: '2020', y: 0 },
      { x: '2021', y: 200 },
      { x: '2022', y: 500 },
      { x: '2023', y: 800 },
      { x: '2024', y: 1200 },
    ],
  },
];

// Alluvial Diagram用のサンプルデータ（地域からサービスカテゴリへの流れ）
const alluvialData: AlluvialDiagramData = {
  nodes: {
    left: [
      { id: 'asia', label: 'アジア', value: 4000, category: 'アジア' },
      { id: 'north-america', label: '北米', value: 368, category: '北米' },
      { id: 'europe', label: 'ヨーロッパ', value: 325, category: 'ヨーロッパ' },
      { id: 'others', label: 'その他', value: 513, category: 'その他' },
    ],
    right: [
      { id: 'platform', label: 'プラットフォーム', value: 2000, category: 'プラットフォーム' },
      { id: 'infrastructure', label: 'インフラ', value: 1500, category: 'インフラ' },
      { id: 'business-tool', label: 'ビジネスツール', value: 2500, category: 'ビジネスツール' },
      { id: 'industry-specific', label: '業界特化', value: 1400, category: '業界特化' },
      { id: 'custom-dev', label: 'カスタム開発', value: 300, category: 'カスタム開発' },
    ],
  },
  links: [
    { source: 'asia', target: 'platform', value: 800 },
    { source: 'asia', target: 'infrastructure', value: 600 },
    { source: 'asia', target: 'business-tool', value: 1200 },
    { source: 'asia', target: 'industry-specific', value: 1000 },
    { source: 'asia', target: 'custom-dev', value: 400 },
    { source: 'north-america', target: 'platform', value: 150 },
    { source: 'north-america', target: 'infrastructure', value: 100 },
    { source: 'north-america', target: 'business-tool', value: 80 },
    { source: 'north-america', target: 'industry-specific', value: 38 },
    { source: 'europe', target: 'platform', value: 100 },
    { source: 'europe', target: 'infrastructure', value: 80 },
    { source: 'europe', target: 'business-tool', value: 90 },
    { source: 'europe', target: 'industry-specific', value: 55 },
    { source: 'others', target: 'platform', value: 200 },
    { source: 'others', target: 'infrastructure', value: 150 },
    { source: 'others', target: 'business-tool', value: 100 },
    { source: 'others', target: 'industry-specific', value: 63 },
  ],
};

// 自社開発・自社サービス事業のビジネスモデル用Alluvial Diagramデータ
const ownServiceBusinessModelData: AlluvialDiagramData = {
  nodes: {
    left: [
      { id: 'maternity-app', label: '出産支援\nパーソナルApp', value: 5000, category: 'サービス' },
      { id: 'care-app', label: '介護支援\nパーソナルApp', value: 4500, category: 'サービス' },
    ],
    right: [
      { id: 'partner-revenue', label: 'パートナー連携\nによる収益', value: 3500, category: '収益源' },
      { id: 'individual-revenue', label: '個人ユーザー\nからの収益', value: 2500, category: '収益源' },
      { id: 'b2b-revenue', label: 'B2B収益\n（企業・自治体）', value: 3000, category: '収益源' },
      { id: 'certification-revenue', label: '認定取得\n支援', value: 500, category: '収益源' },
    ],
  },
  links: [
    // 出産支援Appからの流れ
    { source: 'maternity-app', target: 'partner-revenue', value: 1800 },
    { source: 'maternity-app', target: 'individual-revenue', value: 1500 },
    { source: 'maternity-app', target: 'b2b-revenue', value: 1500 },
    { source: 'maternity-app', target: 'certification-revenue', value: 200 },
    // 介護支援Appからの流れ
    { source: 'care-app', target: 'partner-revenue', value: 1700 },
    { source: 'care-app', target: 'individual-revenue', value: 1000 },
    { source: 'care-app', target: 'b2b-revenue', value: 1500 },
    { source: 'care-app', target: 'certification-revenue', value: 300 },
  ],
};

// エコシステム設計用Alluvial Diagramデータ
// 1. 顧客 → 課題 → ソリューション → 収益
const customerToRevenueData: EcosystemAlluvialData = {
  layers: ['顧客', '課題', 'ソリューション', '収益'],
  nodes: [
    // レイヤー0: 顧客
    { id: 'customer-individual', label: '個人ユーザー', value: 4000, category: '顧客', layer: 0 },
    { id: 'customer-enterprise', label: '企業', value: 3000, category: '顧客', layer: 0 },
    { id: 'customer-government', label: '自治体', value: 2000, category: '顧客', layer: 0 },
    // レイヤー1: 課題
    { id: 'issue-life-event', label: 'ライフイベント\n（出産・介護）', value: 3500, category: '課題', layer: 1 },
    { id: 'issue-work-life', label: 'ワークライフ\nバランス', value: 2500, category: '課題', layer: 1 },
    { id: 'issue-support', label: '支援制度\n活用不足', value: 2000, category: '課題', layer: 1 },
    { id: 'issue-efficiency', label: '業務効率化', value: 1000, category: '課題', layer: 1 },
    // レイヤー2: ソリューション
    { id: 'solution-app', label: 'パーソナル\nアプリ', value: 4000, category: 'ソリューション', layer: 2 },
    { id: 'solution-consulting', label: 'コンサル\nティング', value: 2000, category: 'ソリューション', layer: 2 },
    { id: 'solution-education', label: '教育・研修', value: 1500, category: 'ソリューション', layer: 2 },
    { id: 'solution-dx', label: 'DX支援', value: 2500, category: 'ソリューション', layer: 2 },
    // レイヤー3: 収益
    { id: 'revenue-subscription', label: 'サブスクリプション', value: 3000, category: '収益', layer: 3 },
    { id: 'revenue-partner', label: 'パートナー\n連携', value: 2500, category: '収益', layer: 3 },
    { id: 'revenue-b2b', label: 'B2B契約', value: 3500, category: '収益', layer: 3 },
    { id: 'revenue-project', label: 'プロジェクト\n契約', value: 2000, category: '収益', layer: 3 },
  ],
  links: [
    // 顧客 → 課題
    { source: 'customer-individual', target: 'issue-life-event', value: 2500 },
    { source: 'customer-individual', target: 'issue-work-life', value: 1500 },
    { source: 'customer-enterprise', target: 'issue-work-life', value: 1000 },
    { source: 'customer-enterprise', target: 'issue-support', value: 1500 },
    { source: 'customer-enterprise', target: 'issue-efficiency', value: 500 },
    { source: 'customer-government', target: 'issue-support', value: 500 },
    { source: 'customer-government', target: 'issue-efficiency', value: 500 },
    { source: 'customer-government', target: 'issue-life-event', value: 1000 },
    // 課題 → ソリューション
    { source: 'issue-life-event', target: 'solution-app', value: 3000 },
    { source: 'issue-life-event', target: 'solution-consulting', value: 500 },
    { source: 'issue-work-life', target: 'solution-app', value: 1000 },
    { source: 'issue-work-life', target: 'solution-education', value: 1500 },
    { source: 'issue-support', target: 'solution-consulting', value: 1000 },
    { source: 'issue-support', target: 'solution-education', value: 1000 },
    { source: 'issue-efficiency', target: 'solution-dx', value: 1000 },
    { source: 'issue-efficiency', target: 'solution-consulting', value: 500 },
    // ソリューション → 収益
    { source: 'solution-app', target: 'revenue-subscription', value: 2000 },
    { source: 'solution-app', target: 'revenue-partner', value: 1500 },
    { source: 'solution-app', target: 'revenue-b2b', value: 500 },
    { source: 'solution-consulting', target: 'revenue-project', value: 1500 },
    { source: 'solution-consulting', target: 'revenue-b2b', value: 500 },
    { source: 'solution-education', target: 'revenue-project', value: 500 },
    { source: 'solution-education', target: 'revenue-b2b', value: 1000 },
    { source: 'solution-dx', target: 'revenue-project', value: 2000 },
    { source: 'solution-dx', target: 'revenue-b2b', value: 500 },
  ],
};

// 2. 自社 → パートナー → 顧客 → 市場
const ecosystemFlowData: EcosystemAlluvialData = {
  layers: ['自社', 'パートナー', '顧客', '市場'],
  nodes: [
    // レイヤー0: 自社
    { id: 'company-own-service', label: '自社開発・\n自社サービス', value: 4000, category: '自社', layer: 0 },
    { id: 'company-education', label: '教育・\n人材育成', value: 2000, category: '自社', layer: 0 },
    { id: 'company-consulting', label: 'コンサル\nティング', value: 2000, category: '自社', layer: 0 },
    { id: 'company-dx', label: 'DX支援', value: 2000, category: '自社', layer: 0 },
    // レイヤー1: パートナー
    { id: 'partner-bell', label: 'ベルシステム24', value: 2500, category: 'パートナー', layer: 1 },
    { id: 'partner-tech', label: '伊藤忠テクノ\nソリューションズ', value: 2000, category: 'パートナー', layer: 1 },
    { id: 'partner-interactive', label: '伊藤忠\nインタラクティブ', value: 1500, category: 'パートナー', layer: 1 },
    { id: 'partner-gi', label: 'GIクラウド', value: 2000, category: 'パートナー', layer: 1 },
    { id: 'partner-ib', label: 'I&B', value: 1000, category: 'パートナー', layer: 1 },
    // レイヤー2: 顧客
    { id: 'customer-individual-2', label: '個人ユーザー', value: 3000, category: '顧客', layer: 2 },
    { id: 'customer-sme', label: '中小企業', value: 2500, category: '顧客', layer: 2 },
    { id: 'customer-large', label: '大企業', value: 2000, category: '顧客', layer: 2 },
    { id: 'customer-medical', label: '医療・介護\n施設', value: 1500, category: '顧客', layer: 2 },
    { id: 'customer-government-2', label: '自治体', value: 1000, category: '顧客', layer: 2 },
    // レイヤー3: 市場
    { id: 'market-consumer', label: '消費者\n市場', value: 3000, category: '市場', layer: 3 },
    { id: 'market-b2b', label: 'B2B市場', value: 4000, category: '市場', layer: 3 },
    { id: 'market-public', label: '公共市場', value: 2000, category: '市場', layer: 3 },
    { id: 'market-healthcare', label: 'ヘルスケア\n市場', value: 1000, category: '市場', layer: 3 },
  ],
  links: [
    // 自社 → パートナー
    { source: 'company-own-service', target: 'partner-bell', value: 1500 },
    { source: 'company-own-service', target: 'partner-tech', value: 1000 },
    { source: 'company-own-service', target: 'partner-interactive', value: 1000 },
    { source: 'company-own-service', target: 'partner-gi', value: 500 },
    { source: 'company-education', target: 'partner-bell', value: 500 },
    { source: 'company-education', target: 'partner-ib', value: 1000 },
    { source: 'company-education', target: 'partner-gi', value: 500 },
    { source: 'company-consulting', target: 'partner-gi', value: 1000 },
    { source: 'company-consulting', target: 'partner-tech', value: 500 },
    { source: 'company-dx', target: 'partner-gi', value: 1000 },
    { source: 'company-dx', target: 'partner-tech', value: 500 },
    { source: 'company-dx', target: 'partner-ib', value: 500 },
    // パートナー → 顧客
    { source: 'partner-bell', target: 'customer-individual-2', value: 1000 },
    { source: 'partner-bell', target: 'customer-sme', value: 800 },
    { source: 'partner-bell', target: 'customer-large', value: 700 },
    { source: 'partner-tech', target: 'customer-large', value: 1000 },
    { source: 'partner-tech', target: 'customer-medical', value: 500 },
    { source: 'partner-tech', target: 'customer-sme', value: 500 },
    { source: 'partner-interactive', target: 'customer-individual-2', value: 1000 },
    { source: 'partner-interactive', target: 'customer-sme', value: 500 },
    { source: 'partner-gi', target: 'customer-large', value: 800 },
    { source: 'partner-gi', target: 'customer-medical', value: 700 },
    { source: 'partner-gi', target: 'customer-government-2', value: 500 },
    { source: 'partner-ib', target: 'customer-sme', value: 700 },
    { source: 'partner-ib', target: 'customer-large', value: 300 },
    // 顧客 → 市場
    { source: 'customer-individual-2', target: 'market-consumer', value: 3000 },
    { source: 'customer-sme', target: 'market-b2b', value: 2000 },
    { source: 'customer-sme', target: 'market-consumer', value: 500 },
    { source: 'customer-large', target: 'market-b2b', value: 2000 },
    { source: 'customer-medical', target: 'market-healthcare', value: 1000 },
    { source: 'customer-medical', target: 'market-b2b', value: 500 },
    { source: 'customer-government-2', target: 'market-public', value: 1000 },
  ],
};

// 3. 技術キーワード → 技術カテゴリ → サービス → 産業
const technologyToIndustryData: EcosystemAlluvialData = {
  layers: ['技術キーワード', '技術カテゴリ', 'サービス', '産業'],
  nodes: [
    // レイヤー0: 技術キーワード（25個：+3個追加）
    { id: 'kw-ml', label: '機械学習', value: 800, category: '技術キーワード', layer: 0 },
    { id: 'kw-dl', label: '深層学習', value: 700, category: '技術キーワード', layer: 0 },
    { id: 'kw-nlp', label: '自然言語処理', value: 600, category: '技術キーワード', layer: 0 },
    { id: 'kw-cv', label: 'コンピュータビジョン', value: 500, category: '技術キーワード', layer: 0 },
    { id: 'kw-genai', label: '生成AI', value: 900, category: '技術キーワード', layer: 0 },
    { id: 'kw-llm', label: 'LLM', value: 800, category: '技術キーワード', layer: 0 },
    { id: 'kw-rag', label: 'RAG', value: 600, category: '技術キーワード', layer: 0 },
    { id: 'kw-agent', label: 'AIエージェント', value: 500, category: '技術キーワード', layer: 0 },
    { id: 'kw-automation', label: '自動化', value: 400, category: '技術キーワード', layer: 0 },
    { id: 'kw-prediction', label: '予測分析', value: 300, category: '技術キーワード', layer: 0 },
    { id: 'kw-aws', label: 'AWS', value: 600, category: '技術キーワード', layer: 0 },
    { id: 'kw-azure', label: 'Azure', value: 500, category: '技術キーワード', layer: 0 },
    { id: 'kw-gcp', label: 'GCP', value: 400, category: '技術キーワード', layer: 0 },
    { id: 'kw-container', label: 'コンテナ', value: 400, category: '技術キーワード', layer: 0 },
    { id: 'kw-k8s', label: 'Kubernetes', value: 300, category: '技術キーワード', layer: 0 },
    { id: 'kw-serverless', label: 'サーバーレス', value: 300, category: '技術キーワード', layer: 0 },
    { id: 'kw-api', label: 'API', value: 400, category: '技術キーワード', layer: 0 },
    { id: 'kw-db', label: 'データベース', value: 500, category: '技術キーワード', layer: 0 },
    { id: 'kw-bigdata', label: 'ビッグデータ', value: 400, category: '技術キーワード', layer: 0 },
    { id: 'kw-bi', label: 'BI・可視化', value: 300, category: '技術キーワード', layer: 0 },
    { id: 'kw-integration', label: 'システム統合', value: 400, category: '技術キーワード', layer: 0 },
    { id: 'kw-security', label: 'セキュリティ', value: 300, category: '技術キーワード', layer: 0 },
    { id: 'kw-blockchain', label: 'ブロックチェーン', value: 250, category: '技術キーワード', layer: 0 },
    { id: 'kw-iot', label: 'IoT', value: 250, category: '技術キーワード', layer: 0 },
    { id: 'kw-edge', label: 'エッジコンピューティング', value: 200, category: '技術キーワード', layer: 0 },
    // レイヤー1: 技術カテゴリ
    { id: 'tech-ai', label: 'AI技術', value: 5000, category: '技術カテゴリ', layer: 1 },
    { id: 'tech-cloud', label: 'クラウド', value: 3000, category: '技術カテゴリ', layer: 1 },
    { id: 'tech-data', label: 'データ\n分析', value: 2000, category: '技術カテゴリ', layer: 1 },
    { id: 'tech-integration', label: 'システム\n統合', value: 1000, category: '技術カテゴリ', layer: 1 },
    // レイヤー2: サービス
    { id: 'service-app', label: 'パーソナル\nアプリ', value: 3500, category: 'サービス', layer: 2 },
    { id: 'service-platform', label: 'プラット\nフォーム', value: 2000, category: 'サービス', layer: 2 },
    { id: 'service-consulting', label: 'コンサル\nティング', value: 2000, category: 'サービス', layer: 2 },
    { id: 'service-si', label: 'SIサービス', value: 2500, category: 'サービス', layer: 2 },
    // レイヤー3: 産業（+1カテゴリ追加）
    { id: 'industry-healthcare', label: 'ヘルスケア', value: 3000, category: '産業', layer: 3 },
    { id: 'industry-finance', label: '金融', value: 2000, category: '産業', layer: 3 },
    { id: 'industry-retail', label: '小売・EC', value: 2000, category: '産業', layer: 3 },
    { id: 'industry-manufacturing', label: '製造業', value: 1500, category: '産業', layer: 3 },
    { id: 'industry-public', label: '公共', value: 1500, category: '産業', layer: 3 },
    { id: 'industry-education', label: '教育', value: 1200, category: '産業', layer: 3 },
  ],
  links: [
    // 技術キーワード → 技術カテゴリ
    { source: 'kw-ml', target: 'tech-ai', value: 800 },
    { source: 'kw-dl', target: 'tech-ai', value: 700 },
    { source: 'kw-nlp', target: 'tech-ai', value: 600 },
    { source: 'kw-cv', target: 'tech-ai', value: 500 },
    { source: 'kw-genai', target: 'tech-ai', value: 900 },
    { source: 'kw-llm', target: 'tech-ai', value: 800 },
    { source: 'kw-rag', target: 'tech-ai', value: 600 },
    { source: 'kw-agent', target: 'tech-ai', value: 500 },
    { source: 'kw-automation', target: 'tech-ai', value: 200 },
    { source: 'kw-automation', target: 'tech-integration', value: 200 },
    { source: 'kw-prediction', target: 'tech-data', value: 300 },
    { source: 'kw-aws', target: 'tech-cloud', value: 600 },
    { source: 'kw-azure', target: 'tech-cloud', value: 500 },
    { source: 'kw-gcp', target: 'tech-cloud', value: 400 },
    { source: 'kw-container', target: 'tech-cloud', value: 400 },
    { source: 'kw-k8s', target: 'tech-cloud', value: 300 },
    { source: 'kw-serverless', target: 'tech-cloud', value: 300 },
    { source: 'kw-api', target: 'tech-cloud', value: 200 },
    { source: 'kw-api', target: 'tech-integration', value: 200 },
    { source: 'kw-db', target: 'tech-cloud', value: 300 },
    { source: 'kw-db', target: 'tech-data', value: 200 },
    { source: 'kw-bigdata', target: 'tech-data', value: 400 },
    { source: 'kw-bi', target: 'tech-data', value: 300 },
    { source: 'kw-integration', target: 'tech-integration', value: 400 },
    { source: 'kw-security', target: 'tech-integration', value: 200 },
    { source: 'kw-security', target: 'tech-cloud', value: 100 },
    // 技術カテゴリ → サービス
    { source: 'tech-ai', target: 'service-app', value: 2000 },
    { source: 'tech-ai', target: 'service-platform', value: 1500 },
    { source: 'tech-ai', target: 'service-consulting', value: 1000 },
    { source: 'tech-ai', target: 'service-si', value: 1000 },
    { source: 'tech-cloud', target: 'service-platform', value: 1000 },
    { source: 'tech-cloud', target: 'service-si', value: 2000 },
    { source: 'tech-data', target: 'service-consulting', value: 1000 },
    { source: 'tech-data', target: 'service-si', value: 500 },
    { source: 'tech-data', target: 'service-app', value: 300 },
    { source: 'tech-data', target: 'service-platform', value: 200 },
    { source: 'tech-integration', target: 'service-si', value: 1000 },
    // 技術キーワード → サービス（直接リンク）
    { source: 'kw-genai', target: 'service-app', value: 300 },
    { source: 'kw-llm', target: 'service-app', value: 200 },
    { source: 'kw-rag', target: 'service-app', value: 150 },
    { source: 'kw-agent', target: 'service-app', value: 100 },
    { source: 'kw-ml', target: 'service-platform', value: 200 },
    { source: 'kw-dl', target: 'service-platform', value: 150 },
    { source: 'kw-nlp', target: 'service-platform', value: 100 },
    { source: 'kw-aws', target: 'service-platform', value: 200 },
    { source: 'kw-azure', target: 'service-platform', value: 150 },
    { source: 'kw-gcp', target: 'service-platform', value: 100 },
    { source: 'kw-bigdata', target: 'service-consulting', value: 150 },
    { source: 'kw-bi', target: 'service-consulting', value: 100 },
    { source: 'kw-integration', target: 'service-si', value: 200 },
    { source: 'kw-security', target: 'service-si', value: 150 },
    { source: 'kw-security', target: 'service-platform', value: 100 },
    // サービス → 産業
    { source: 'service-app', target: 'industry-healthcare', value: 2500 },
    { source: 'service-app', target: 'industry-retail', value: 1000 },
    { source: 'service-platform', target: 'industry-finance', value: 1000 },
    { source: 'service-platform', target: 'industry-retail', value: 800 },
    { source: 'service-platform', target: 'industry-healthcare', value: 200 },
    { source: 'service-consulting', target: 'industry-manufacturing', value: 1000 },
    { source: 'service-consulting', target: 'industry-public', value: 1000 },
    { source: 'service-si', target: 'industry-manufacturing', value: 1000 },
    { source: 'service-si', target: 'industry-public', value: 800 },
    { source: 'service-si', target: 'industry-healthcare', value: 400 },
    { source: 'service-si', target: 'industry-finance', value: 300 },
  ],
};

// 人の感情・行動の流れと因果関係：原因 → 感情 → 行動 → 結果 → 解決策
const humanEmotionFlowData: EcosystemAlluvialData = {
  layers: ['原因（課題）', '感情・心理状態', '行動', '結果・影響', '解決策'],
  nodes: [
    // レイヤー0: 原因（課題）
    { id: 'cause-info-lack', label: '情報不足', value: 3500, category: '原因', layer: 0 },
    { id: 'cause-cost-unknown', label: '費用の\n見通し不明', value: 3000, category: '原因', layer: 0 },
    { id: 'cause-timing-unknown', label: 'タイミング\n不明', value: 2500, category: '原因', layer: 0 },
    { id: 'cause-isolation', label: '孤立感', value: 2000, category: '原因', layer: 0 },
    // レイヤー1: 感情・心理状態
    { id: 'emotion-mental-anxiety', label: '精神的\n不安', value: 4000, category: '感情', layer: 1 },
    { id: 'emotion-financial-anxiety', label: '経済的\n不安', value: 3500, category: '感情', layer: 1 },
    { id: 'emotion-foresight-anxiety', label: '見通しの\n不安', value: 3000, category: '感情', layer: 1 },
    { id: 'emotion-isolation', label: '孤立感', value: 1500, category: '感情', layer: 1 },
    // レイヤー2: 行動
    { id: 'action-no-plan', label: '計画\nできない', value: 3000, category: '行動', layer: 2 },
    { id: 'action-miss-timing', label: '申請タイミング\n見逃し', value: 2500, category: '行動', layer: 2 },
    { id: 'action-no-support', label: '支援制度\n未活用', value: 3500, category: '行動', layer: 2 },
    { id: 'action-delay', label: '準備\n遅れ', value: 2000, category: '行動', layer: 2 },
    // レイヤー3: 結果・影響
    { id: 'result-burden', label: '負担\n増大', value: 4000, category: '結果', layer: 3 },
    { id: 'result-stress', label: 'ストレス\n増加', value: 3000, category: '結果', layer: 3 },
    { id: 'result-inefficiency', label: '非効率', value: 2500, category: '結果', layer: 3 },
    { id: 'result-missed-opportunity', label: '機会\n損失', value: 1500, category: '結果', layer: 3 },
    // レイヤー4: 解決策
    { id: 'solution-centralized', label: '情報の\n一元管理', value: 3500, category: '解決策', layer: 4 },
    { id: 'solution-personal', label: 'パーソナル\n分析', value: 3000, category: '解決策', layer: 4 },
    { id: 'solution-onestop', label: 'ワンストップ\nサービス', value: 4000, category: '解決策', layer: 4 },
  ],
  links: [
    // 原因 → 感情
    { source: 'cause-info-lack', target: 'emotion-mental-anxiety', value: 2500 },
    { source: 'cause-info-lack', target: 'emotion-isolation', value: 1000 },
    { source: 'cause-cost-unknown', target: 'emotion-financial-anxiety', value: 3000 },
    { source: 'cause-cost-unknown', target: 'emotion-mental-anxiety', value: 500 },
    { source: 'cause-timing-unknown', target: 'emotion-foresight-anxiety', value: 2500 },
    { source: 'cause-isolation', target: 'emotion-isolation', value: 1500 },
    { source: 'cause-isolation', target: 'emotion-mental-anxiety', value: 500 },
    // 感情 → 行動
    { source: 'emotion-mental-anxiety', target: 'action-no-plan', value: 2000 },
    { source: 'emotion-mental-anxiety', target: 'action-delay', value: 1500 },
    { source: 'emotion-mental-anxiety', target: 'action-no-support', value: 500 },
    { source: 'emotion-financial-anxiety', target: 'action-no-support', value: 2500 },
    { source: 'emotion-financial-anxiety', target: 'action-no-plan', value: 1000 },
    { source: 'emotion-foresight-anxiety', target: 'action-miss-timing', value: 2000 },
    { source: 'emotion-foresight-anxiety', target: 'action-no-plan', value: 1000 },
    { source: 'emotion-isolation', target: 'action-delay', value: 500 },
    { source: 'emotion-isolation', target: 'action-no-support', value: 1000 },
    // 行動 → 結果
    { source: 'action-no-plan', target: 'result-burden', value: 2000 },
    { source: 'action-no-plan', target: 'result-stress', value: 1000 },
    { source: 'action-miss-timing', target: 'result-missed-opportunity', value: 1500 },
    { source: 'action-miss-timing', target: 'result-burden', value: 1000 },
    { source: 'action-no-support', target: 'result-burden', value: 2000 },
    { source: 'action-no-support', target: 'result-inefficiency', value: 1500 },
    { source: 'action-delay', target: 'result-stress', value: 1500 },
    { source: 'action-delay', target: 'result-inefficiency', value: 1000 },
    // 結果 → 解決策
    { source: 'result-burden', target: 'solution-centralized', value: 2000 },
    { source: 'result-burden', target: 'solution-onestop', value: 2000 },
    { source: 'result-stress', target: 'solution-personal', value: 2000 },
    { source: 'result-stress', target: 'solution-onestop', value: 1000 },
    { source: 'result-inefficiency', target: 'solution-centralized', value: 1500 },
    { source: 'result-inefficiency', target: 'solution-onestop', value: 1000 },
    { source: 'result-missed-opportunity', target: 'solution-personal', value: 1000 },
    { source: 'result-missed-opportunity', target: 'solution-onestop', value: 500 },
  ],
};

// 出産・育児世代の課題と解決策の流れ
const maternityCareChallengeFlowData: EcosystemAlluvialData = {
  layers: ['課題', '影響', '解決策', '効果'],
  nodes: [
    // レイヤー0: 課題
    { id: 'challenge-info', label: '情報不足\n選択肢不明', value: 4000, category: '課題', layer: 0 },
    { id: 'challenge-cost', label: '費用見通し\n不明', value: 3500, category: '課題', layer: 0 },
    { id: 'challenge-timing', label: '申請タイミング\n不明', value: 3000, category: '課題', layer: 0 },
    // レイヤー1: 影響
    { id: 'impact-anxiety', label: '不安・\n孤立感', value: 4500, category: '影響', layer: 1 },
    { id: 'impact-financial', label: '経済的\n負担', value: 3500, category: '影響', layer: 1 },
    { id: 'impact-planning', label: '計画\n困難', value: 2500, category: '影響', layer: 1 },
    // レイヤー2: 解決策
    { id: 'solution-info-centralized', label: '情報の\n一元管理', value: 4000, category: '解決策', layer: 2 },
    { id: 'solution-personal-analysis', label: 'パーソナル\n分析', value: 3500, category: '解決策', layer: 2 },
    { id: 'solution-onestop-service', label: 'ワンストップ\nサービス', value: 3000, category: '解決策', layer: 2 },
    // レイヤー3: 効果
    { id: 'effect-reduce-anxiety', label: '不安\n軽減', value: 4000, category: '効果', layer: 3 },
    { id: 'effect-optimal-support', label: '最適な\n支援', value: 3500, category: '効果', layer: 3 },
    { id: 'effect-efficiency', label: '効率化', value: 3000, category: '効果', layer: 3 },
  ],
  links: [
    // 課題 → 影響
    { source: 'challenge-info', target: 'impact-anxiety', value: 3000 },
    { source: 'challenge-info', target: 'impact-planning', value: 1000 },
    { source: 'challenge-cost', target: 'impact-financial', value: 3000 },
    { source: 'challenge-cost', target: 'impact-anxiety', value: 500 },
    { source: 'challenge-timing', target: 'impact-planning', value: 2000 },
    { source: 'challenge-timing', target: 'impact-anxiety', value: 1000 },
    // 影響 → 解決策
    { source: 'impact-anxiety', target: 'solution-info-centralized', value: 2000 },
    { source: 'impact-anxiety', target: 'solution-personal-analysis', value: 2000 },
    { source: 'impact-anxiety', target: 'solution-onestop-service', value: 500 },
    { source: 'impact-financial', target: 'solution-personal-analysis', value: 1500 },
    { source: 'impact-financial', target: 'solution-onestop-service', value: 2000 },
    { source: 'impact-planning', target: 'solution-info-centralized', value: 2000 },
    { source: 'impact-planning', target: 'solution-onestop-service', value: 500 },
    // 解決策 → 効果
    { source: 'solution-info-centralized', target: 'effect-reduce-anxiety', value: 2000 },
    { source: 'solution-info-centralized', target: 'effect-efficiency', value: 2000 },
    { source: 'solution-personal-analysis', target: 'effect-optimal-support', value: 3000 },
    { source: 'solution-personal-analysis', target: 'effect-reduce-anxiety', value: 500 },
    { source: 'solution-onestop-service', target: 'effect-efficiency', value: 2000 },
    { source: 'solution-onestop-service', target: 'effect-optimal-support', value: 1000 },
  ],
};

export default function VisualizationsPage() {
  // Intersection Observerでビューポートに入ったら読み込む
  const [visibleCharts, setVisibleCharts] = useState<Set<string>>(new Set());
  const chartRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const chartId = entry.target.getAttribute('data-chart-id');
            if (chartId) {
              setVisibleCharts((prev) => new Set(prev).add(chartId));
              // 一度表示されたら監視を停止
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin: '200px' } // 200px手前から読み込み開始
    );

    // すべてのチャート要素を監視
    chartRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Layout>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        データ可視化
      </p>
      
      {/* 事業計画・エコシステム設計：技術キーワード → 技術カテゴリ → サービス → 産業 */}
      <div 
        ref={(el) => { if (el) chartRefs.current.set('ecosystem3', el); }} 
        data-chart-id="ecosystem3"
        className="card" 
        style={{ marginBottom: '24px' }}
      >
        {visibleCharts.has('ecosystem3') ? (
          <EcosystemAlluvialDiagram
            data={technologyToIndustryData}
            width={1600}
            height={900}
            title="事業計画・エコシステム設計：技術キーワード → 技術カテゴリ → サービス → 産業"
            subtitle="From Technology to Industry"
          />
        ) : (
          <ChartSkeleton height={900} />
        )}
      </div>
      
      {/* カオスマップ */}
      <div 
        ref={(el) => { if (el) chartRefs.current.set('chaos', el); }} 
        data-chart-id="chaos"
        className="card" 
        style={{ marginBottom: '24px' }}
      >
        {visibleCharts.has('chaos') ? (
          <ChaosMap 
            data={sampleChaosMapData} 
            width={1000} 
            height={600}
            innerRadius={60}
            outerRadius={320}
            backgroundImageUrl="/Gemini_Generated_Image_4awgre4awgre4awg.png"
          />
        ) : (
          <ChartSkeleton height={600} />
        )}
      </div>
      
      {/* バブルチャート */}
      <div 
        ref={(el) => { if (el) chartRefs.current.set('bubble', el); }} 
        data-chart-id="bubble"
        className="card" 
        style={{ marginBottom: '24px' }}
      >
        {visibleCharts.has('bubble') ? (
          <BubbleChart
            data={bubbleChartData}
            width={1000}
            height={600}
            title="市場規模別 国・地域マップ"
          />
        ) : (
          <ChartSkeleton height={600} />
        )}
      </div>
      
      {/* 散布図バブルチャート */}
      <div 
        ref={(el) => { if (el) chartRefs.current.set('scatter', el); }} 
        data-chart-id="scatter"
        className="card" 
        style={{ marginBottom: '24px' }}
      >
        {visibleCharts.has('scatter') ? (
          <ScatterBubbleChart
            data={scatterBubbleData}
            width={1000}
            height={600}
            xAxisLabel="実現難易度・運用コスト（右に行くほど難しい・高コスト）"
            title="ビジネスモデル分析：汎用性 vs 契約金額規模"
          />
        ) : (
          <ChartSkeleton height={600} />
        )}
      </div>
      
      {/* Alluvial Diagram */}
      <div 
        ref={(el) => { if (el) chartRefs.current.set('alluvial1', el); }} 
        data-chart-id="alluvial1"
        className="card" 
        style={{ marginBottom: '24px' }}
      >
        {visibleCharts.has('alluvial1') ? (
          <AlluvialDiagram
            data={alluvialData}
            width={1000}
            height={600}
            title="市場規模フロー分析：地域からサービスカテゴリへの流れ"
          />
        ) : (
          <ChartSkeleton height={600} />
        )}
      </div>
      
      {/* 自社開発・自社サービス事業のビジネスモデル（Alluvial Diagram） */}
      <div 
        ref={(el) => { if (el) chartRefs.current.set('alluvial2', el); }} 
        data-chart-id="alluvial2"
        className="card" 
        style={{ marginBottom: '24px' }}
      >
        {visibleCharts.has('alluvial2') ? (
          <AlluvialDiagram
            data={ownServiceBusinessModelData}
            width={1000}
            height={600}
            title="自社開発・自社サービス事業のビジネスモデル：サービスから収益源への流れ"
          />
        ) : (
          <ChartSkeleton height={600} />
        )}
      </div>
      
      {/* 事業計画・エコシステム設計：顧客 → 課題 → ソリューション → 収益 */}
      <div 
        ref={(el) => { if (el) chartRefs.current.set('ecosystem1', el); }} 
        data-chart-id="ecosystem1"
        className="card" 
        style={{ marginBottom: '24px' }}
      >
        {visibleCharts.has('ecosystem1') ? (
          <EcosystemAlluvialDiagram
            data={customerToRevenueData}
            width={1400}
            height={700}
            title="事業計画・エコシステム設計：顧客 → 課題 → ソリューション → 収益"
          />
        ) : (
          <ChartSkeleton height={700} />
        )}
      </div>
      
      {/* 事業計画・エコシステム設計：自社 → パートナー → 顧客 → 市場 */}
      <div 
        ref={(el) => { if (el) chartRefs.current.set('ecosystem2', el); }} 
        data-chart-id="ecosystem2"
        className="card" 
        style={{ marginBottom: '24px' }}
      >
        {visibleCharts.has('ecosystem2') ? (
          <EcosystemAlluvialDiagram
            data={ecosystemFlowData}
            width={1400}
            height={700}
            title="事業計画・エコシステム設計：自社 → パートナー → 顧客 → 市場"
          />
        ) : (
          <ChartSkeleton height={700} />
        )}
      </div>
      
      {/* 人の感情・行動の流れと因果関係：原因 → 感情 → 行動 → 結果 → 解決策 */}
      <div 
        ref={(el) => { if (el) chartRefs.current.set('ecosystem4', el); }} 
        data-chart-id="ecosystem4"
        className="card" 
        style={{ marginBottom: '24px' }}
      >
        {visibleCharts.has('ecosystem4') ? (
          <EcosystemAlluvialDiagram
            data={humanEmotionFlowData}
            width={1600}
            height={800}
            title="人の感情・行動の流れと因果関係：原因（課題） → 感情・心理状態 → 行動 → 結果・影響 → 解決策"
          />
        ) : (
          <ChartSkeleton height={800} />
        )}
      </div>
      
      {/* 出産・育児世代の課題と解決策の流れ */}
      <div 
        ref={(el) => { if (el) chartRefs.current.set('ecosystem5', el); }} 
        data-chart-id="ecosystem5"
        className="card" 
        style={{ marginBottom: '24px' }}
      >
        {visibleCharts.has('ecosystem5') ? (
          <EcosystemAlluvialDiagram
            data={maternityCareChallengeFlowData}
            width={1400}
            height={700}
            title="出産・育児世代の課題と解決策の流れ：課題 → 影響 → 解決策 → 効果"
          />
        ) : (
          <ChartSkeleton height={700} />
        )}
      </div>
      
      {/* 人口ピラミッド */}
      <div 
        ref={(el) => { if (el) chartRefs.current.set('pyramid', el); }} 
        data-chart-id="pyramid"
        className="card" 
        style={{ marginBottom: '24px' }}
      >
        {visibleCharts.has('pyramid') ? (
          <PopulationPyramid
            data={populationData}
            height={600}
            title="人口ピラミッド（年代別・性別）"
          />
        ) : (
          <ChartSkeleton height={600} />
        )}
      </div>
      
      {/* 事業拡大の階層構造（Sunburst） */}
      <div 
        ref={(el) => { if (el) chartRefs.current.set('sunburst', el); }} 
        data-chart-id="sunburst"
        className="card" 
        style={{ marginBottom: '24px' }}
      >
        {visibleCharts.has('sunburst') ? (
          <BusinessSunburst
            data={sunburstData}
            height={600}
            title="事業拡大の階層構造"
          />
        ) : (
          <ChartSkeleton height={600} />
        )}
      </div>
      
      {/* 事業拡大の時系列成長（ラジアルバー） */}
      <div 
        ref={(el) => { if (el) chartRefs.current.set('radial', el); }} 
        data-chart-id="radial"
        className="card"
      >
        {visibleCharts.has('radial') ? (
          <BusinessRadialBar
            data={radialBarData}
            height={600}
            title="事業拡大の時系列成長（2020-2024）"
          />
        ) : (
          <ChartSkeleton height={600} />
        )}
      </div>
    </Layout>
  );
}

