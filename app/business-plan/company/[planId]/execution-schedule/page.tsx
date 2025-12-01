'use client';

import React, { useEffect, useState, useRef } from 'react';
import Script from 'next/script';
import { useParams } from 'next/navigation';
import { usePlan } from '../hooks/usePlan';
import dynamic from 'next/dynamic';

// ComponentizedCompanyPlanOverviewを動的インポート
const ComponentizedCompanyPlanOverview = dynamic(
  () => import('@/components/pages/component-test/test-concept/ComponentizedCompanyPlanOverview'),
  { ssr: false }
);

// planIdごとの固定コンテンツコンポーネント（条件付きインポート）
// 固定コンテンツがあるplanIdのマッピング
const PLAN_CONTENT_MAP: { [key: string]: boolean } = {
  '9pu2rwOCRjG5gxmqX2tO': true,
};

declare global {
  interface Window {
    mermaid?: any;
  }
}

const SERVICE_NAMES: { [key: string]: string } = {
  'own-service': '1. 自社開発・自社サービス事業',
  'education-training': '2. AI導入ルール設計・人材育成・教育事業',
  'consulting': '3. プロセス可視化・業務コンサル事業',
  'ai-dx': '4. AI駆動開発・DX支援SI事業',
};

interface ScheduleItem {
  serviceId: string;
  year: number;
  phase: 'preparation' | 'start' | 'development' | 'full-scale';
  activities: string[];
  achievements: string[];
  nextStep?: string;
  itochuSynergy?: string[];
  revenue?: string; // 売上規模
  netIncome?: string; // 税後利益規模
}

const SCHEDULE_DATA: ScheduleItem[] = [
  // 0年目：準備期間
  {
    serviceId: 'own-service',
    year: 0,
    phase: 'preparation',
    activities: ['会社設立準備', '事業計画策定', '初期チーム構築'],
    achievements: ['設立準備完了', '事業計画確定']
  },
  
  // 1年目：自社開発・自社サービス事業
  {
    serviceId: 'own-service',
    year: 1,
    phase: 'start',
    activities: [
      'パーソナルアプリ開発開始',
      'ユーザー獲得施策',
      'B2B契約獲得',
      'ドッグフーディング案件実施'
    ],
    achievements: [
      '収益基盤の確立',
      '自社の開発経験の蓄積',
      'ドッグフーディング実績',
      'ユーザーデータの蓄積',
      'AI活用ノウハウの獲得'
    ],
    nextStep: '人材育成・教育事業への展開基盤',
    itochuSynergy: ['GIクラウド'],
    revenue: '15',
    netIncome: '-14'
  },
  
  // 2年目：自社開発・自社サービス事業継続 + 人材育成事業開始
  {
    serviceId: 'own-service',
    year: 2,
    phase: 'development',
    activities: [
      'サービス拡充',
      'プレミアムプラン展開',
      'パートナー連携強化',
      '代行サービス開始'
    ],
    achievements: [
      '収益の安定化',
      '事業運営ノウハウの確立',
      'グループ会社との連携強化'
    ],
    itochuSynergy: ['ベルシステム24', 'I&B', '辻本郷itコンサル'],
    revenue: '146',
    netIncome: '60'
  },
  {
    serviceId: 'education-training',
    year: 2,
    phase: 'start',
    activities: [
      '教育プログラム開発',
      'AI導入ルール設計サービス開始',
      '企業向け研修提供'
    ],
    achievements: [
      '人材育成・ルール設計事業への強み獲得',
      '教育コンテンツの蓄積',
      '企業との信頼関係構築'
    ],
    nextStep: '業務コンサル・AI駆動開発事業への展開',
    itochuSynergy: ['ベルシステム24', 'I&B', '辻本郷itコンサル']
  },
  {
    serviceId: 'consulting',
    year: 2,
    phase: 'preparation',
    activities: [
      '業務コンサル体制構築',
      'プロセス可視化ツール開発',
      'グループ会社との連携強化'
    ],
    achievements: [
      '業務コンサル基盤の準備',
      'グループ会社連携の実証'
    ],
    itochuSynergy: ['ベルシステム24', 'I&B', '辻本郷itコンサル']
  },
  {
    serviceId: 'ai-dx',
    year: 2,
    phase: 'preparation',
    activities: [
      'AI駆動開発体制構築',
      'DX支援サービス設計',
      '技術基盤の整備'
    ],
    achievements: [
      'AI駆動開発基盤の準備',
      '技術ノウハウの蓄積'
    ],
    itochuSynergy: ['ベルシステム24', 'I&B', '辻本郷itコンサル']
  },
  
  // 3年目：事業化本格化
  {
    serviceId: 'own-service',
    year: 3,
    phase: 'full-scale',
    activities: [
      '事業の本格展開',
      '新規サービス追加',
      '市場拡大'
    ],
    achievements: [
      '安定した収益基盤',
      '市場でのポジション確立'
    ],
    itochuSynergy: ['伊藤忠テクノソリューションズ', '伊藤忠インタラクティブ'],
    revenue: '362',
    netIncome: '184'
  },
  {
    serviceId: 'education-training',
    year: 3,
    phase: 'full-scale',
    activities: [
      '教育事業の本格展開',
      'ルール設計サービスの拡大',
      '企業契約の拡大'
    ],
    achievements: [
      '教育事業の収益化',
      'AI導入支援の実績拡大'
    ],
    itochuSynergy: ['伊藤忠テクノソリューションズ', '伊藤忠インタラクティブ']
  },
  {
    serviceId: 'consulting',
    year: 3,
    phase: 'start',
    activities: [
      '業務コンサルサービス開始',
      'プロセス可視化・改善支援',
      '助成金活用支援'
    ],
    achievements: [
      '業務コンサル実績の創出',
      '顧客満足度の向上',
      'リピート契約の獲得'
    ],
    itochuSynergy: ['伊藤忠テクノソリューションズ', '伊藤忠インタラクティブ']
  },
  {
    serviceId: 'ai-dx',
    year: 3,
    phase: 'start',
    activities: [
      'AI駆動開発サービス開始',
      'DX支援プロジェクト実施',
      'システム開発・導入支援'
    ],
    achievements: [
      'AI駆動開発実績の創出',
      'DX支援ノウハウの蓄積',
      '技術的信頼性の確立'
    ],
    itochuSynergy: ['伊藤忠テクノソリューションズ', '伊藤忠インタラクティブ']
  },
  
  // 4年目以降：全事業の本格化
  {
    serviceId: 'consulting',
    year: 4,
    phase: 'full-scale',
    activities: [
      '業務コンサル事業の本格展開',
      'サービスラインの拡充',
      '市場拡大'
    ],
    achievements: [
      '業務コンサル事業の収益化',
      '市場でのポジション確立'
    ],
    itochuSynergy: ['伊藤忠テクノソリューションズ', '辻本郷itコンサル', 'I&B'],
    revenue: '769',
    netIncome: '429'
  },
  {
    serviceId: 'ai-dx',
    year: 4,
    phase: 'full-scale',
    activities: [
      'AI駆動開発事業の本格展開',
      'DX支援サービスの拡大',
      '技術イノベーションの推進'
    ],
    achievements: [
      'AI駆動開発事業の収益化',
      '技術リーダーシップの確立'
    ],
    itochuSynergy: ['伊藤忠テクノソリューションズ', 'GIクラウド', '辻本郷itコンサル']
  },
  
  // 5年目：継続的成長
  {
    serviceId: 'own-service',
    year: 5,
    phase: 'full-scale',
    activities: ['継続的な事業拡大', '新規市場開拓'],
    achievements: ['持続的な成長', '市場シェア拡大'],
    itochuSynergy: ['ベルシステム24', '伊藤忠インタラクティブ', 'I&B', 'GIクラウド', '伊藤忠テクノソリューションズ'],
    revenue: '1,150',
    netIncome: '662'
  },
  {
    serviceId: 'education-training',
    year: 5,
    phase: 'full-scale',
    activities: ['教育事業の拡大', '新規プログラム開発'],
    achievements: ['教育事業の成長', '市場リーダーシップ'],
    itochuSynergy: ['伊藤忠テクノソリューションズ', '伊藤忠インタラクティブ', '辻本郷itコンサル']
  },
  {
    serviceId: 'consulting',
    year: 5,
    phase: 'full-scale',
    activities: ['コンサル事業の拡大', '新規サービス開発'],
    achievements: ['コンサル事業の成長', '専門性の確立'],
    itochuSynergy: ['伊藤忠テクノソリューションズ', '辻本郷itコンサル', 'I&B']
  },
  {
    serviceId: 'ai-dx',
    year: 5,
    phase: 'full-scale',
    activities: ['DX事業の拡大', '技術革新の推進'],
    achievements: ['DX事業の成長', '技術的優位性の確立'],
    itochuSynergy: ['伊藤忠テクノソリューションズ', 'GIクラウド', '辻本郷itコンサル']
  }
];

export default function ExecutionSchedulePage() {
  const { plan } = usePlan();
  const params = useParams();
  const planId = params.planId as string;
  
  // planIdに応じてコンテンツを表示するかどうかを決定
  const hasCustomContent = planId && PLAN_CONTENT_MAP[planId] ? true : false;
  
  // すべてのHooksを早期リターンの前に呼び出す（React Hooksのルール）
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);
  const detailedDiagramRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const detailedRenderedRef = useRef(false);
  const [isDetailed, setIsDetailed] = useState(false);

  // Mermaidの読み込み状態をチェック
  useEffect(() => {
    if (typeof window !== 'undefined' && window.mermaid) {
      setMermaidLoaded(true);
    }
  }, []);

  // Mermaidが読み込まれたときの処理
  useEffect(() => {
    const handleMermaidLoaded = () => {
      setMermaidLoaded(true);
    };

    if (typeof window !== 'undefined') {
      if (window.mermaid) {
        setMermaidLoaded(true);
      } else {
        window.addEventListener('mermaidloaded', handleMermaidLoaded);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mermaidloaded', handleMermaidLoaded);
      }
    };
  }, []);

  // ビジネスの順序性図を生成（簡略版）
  const generateBusinessFlowDiagram = () => {
    let diagram = 'graph TB\n';
    diagram += '    direction TB\n';
    diagram += '    classDef year0Class fill:#E8F4F8,stroke:#4A90E2,stroke-width:2px,color:#000\n';
    diagram += '    classDef year1Class fill:#E8F5E9,stroke:#66BB6A,stroke-width:2px,color:#000\n';
    diagram += '    classDef year2Class fill:#FFF3E0,stroke:#FFA726,stroke-width:2px,color:#000\n';
    diagram += '    classDef year3Class fill:#FCE4EC,stroke:#EC407A,stroke-width:2px,color:#000\n';
    diagram += '    classDef year4Class fill:#F3E5F5,stroke:#AB47BC,stroke-width:2px,color:#000\n';
    diagram += '    classDef year5Class fill:#E0F2F1,stroke:#26A69A,stroke-width:2px,color:#000\n\n';

    // 0年目：準備期間
    diagram += '    Y0["0年目：準備期間<br/>会社設立準備<br/>事業計画策定<br/>初期チーム構築"]\n';
    diagram += '    class Y0 year0Class\n\n';

    // 1年目：自社開発・自社サービス事業開始
    diagram += '    Y1["1年目：自社開発・自社サービス事業<br/>立ち上げ事業<br/>パーソナルアプリ開発開始<br/>ユーザー獲得施策<br/>B2B契約獲得"]\n';
    diagram += '    A1["獲得：収益基盤の確立<br/>自社の開発経験の蓄積<br/>AI活用ノウハウの獲得"]\n';
    diagram += '    class Y1,A1 year1Class\n\n';

    // 2年目：複数事業開始
    diagram += '    Y2A["2年目：自社開発・自社サービス事業<br/>注力事業<br/>サービス拡充<br/>パートナー連携強化"]\n';
    diagram += '    Y2B["2年目：人材育成・教育事業<br/>立ち上げ事業<br/>教育プログラム開発<br/>AI導入ルール設計サービス開始"]\n';
    diagram += '    Y2C["2年目：業務コンサル事業<br/>準備<br/>業務コンサル体制構築"]\n';
    diagram += '    Y2D["2年目：AI駆動開発事業<br/>準備<br/>AI駆動開発体制構築"]\n';
    diagram += '    A2["獲得：人材育成・ルール設計事業への強み<br/>業務コンサル基盤の準備<br/>AI駆動開発基盤の準備"]\n';
    diagram += '    class Y2A,Y2B,Y2C,Y2D,A2 year2Class\n\n';

    // 3年目：事業本格化
    diagram += '    Y3A["3年目：自社開発・自社サービス事業<br/>スケール事業<br/>事業の本格展開<br/>市場拡大"]\n';
    diagram += '    Y3B["3年目：人材育成・教育事業<br/>スケール事業<br/>教育事業の本格展開<br/>企業契約の拡大"]\n';
    diagram += '    Y3C["3年目：業務コンサル事業<br/>立ち上げ事業<br/>業務コンサルサービス開始<br/>プロセス可視化・改善支援"]\n';
    diagram += '    Y3D["3年目：AI駆動開発事業<br/>立ち上げ事業<br/>AI駆動開発サービス開始<br/>DX支援プロジェクト実施"]\n';
    diagram += '    A3["獲得：安定した収益基盤<br/>教育事業の収益化<br/>業務コンサル実績の創出<br/>AI駆動開発実績の創出"]\n';
    diagram += '    class Y3A,Y3B,Y3C,Y3D,A3 year3Class\n\n';

    // 4年目：全事業本格展開
    diagram += '    Y4A["4年目：業務コンサル事業<br/>スケール事業<br/>業務コンサル事業の本格展開<br/>サービスラインの拡充"]\n';
    diagram += '    Y4B["4年目：AI駆動開発事業<br/>スケール事業<br/>AI駆動開発事業の本格展開<br/>DX支援サービスの拡大"]\n';
    diagram += '    A4["獲得：業務コンサル事業の収益化<br/>AI駆動開発事業の収益化<br/>技術リーダーシップの確立"]\n';
    diagram += '    class Y4A,Y4B,A4 year4Class\n\n';

    // 5年目：継続的成長
    diagram += '    Y5["5年目：全事業<br/>継続的成長<br/>事業拡大<br/>新規市場開拓<br/>技術革新の推進"]\n';
    diagram += '    A5["獲得：持続的な成長<br/>市場シェア拡大<br/>技術的優位性の確立"]\n';
    diagram += '    class Y5,A5 year5Class\n\n';

    // 矢印で順序性を表現
    diagram += '    Y0 --> Y1\n';
    diagram += '    Y1 --> A1\n';
    diagram += '    A1 --> Y2A\n';
    diagram += '    A1 --> Y2B\n';
    diagram += '    Y2A --> A2\n';
    diagram += '    Y2B --> A2\n';
    diagram += '    Y2C --> A2\n';
    diagram += '    Y2D --> A2\n';
    diagram += '    A2 --> Y3A\n';
    diagram += '    A2 --> Y3B\n';
    diagram += '    A2 --> Y3C\n';
    diagram += '    A2 --> Y3D\n';
    diagram += '    Y3A --> A3\n';
    diagram += '    Y3B --> A3\n';
    diagram += '    Y3C --> A3\n';
    diagram += '    Y3D --> A3\n';
    diagram += '    A3 --> Y4A\n';
    diagram += '    A3 --> Y4B\n';
    diagram += '    Y4A --> A4\n';
    diagram += '    Y4B --> A4\n';
    diagram += '    A4 --> Y5\n';
    diagram += '    Y5 --> A5\n';

    return diagram;
  };

  // ビジネスの順序性図を生成（詳細版）
  const generateDetailedBusinessFlowDiagram = () => {
    let diagram = 'graph TB\n';
    diagram += '    direction TB\n';
    diagram += '    classDef year0Class fill:#E8F4F8,stroke:#4A90E2,stroke-width:2px,color:#000\n';
    diagram += '    classDef year1Class fill:#E8F5E9,stroke:#66BB6A,stroke-width:2px,color:#000\n';
    diagram += '    classDef year2Class fill:#FFF3E0,stroke:#FFA726,stroke-width:2px,color:#000\n';
    diagram += '    classDef year3Class fill:#FCE4EC,stroke:#EC407A,stroke-width:2px,color:#000\n';
    diagram += '    classDef year4Class fill:#F3E5F5,stroke:#AB47BC,stroke-width:2px,color:#000\n';
    diagram += '    classDef year5Class fill:#E0F2F1,stroke:#26A69A,stroke-width:2px,color:#000\n';
    diagram += '    classDef reasonClass fill:#FFF9C4,stroke:#F9A825,stroke-width:2px,color:#000\n\n';

    // 0年目：準備期間
    diagram += '    Y0["0年目：準備期間<br/>会社設立準備<br/>事業計画策定<br/>初期チーム構築"]\n';
    diagram += '    class Y0 year0Class\n\n';

    // 1年目：自社開発・自社サービス事業開始
    diagram += '    Y1["1年目：自社開発・自社サービス事業<br/>立ち上げ事業<br/>パーソナルアプリ開発開始<br/>ユーザー獲得施策<br/>B2B契約獲得"]\n';
    diagram += '    A1["獲得：収益基盤の確立<br/>自社の開発経験の蓄積<br/>AI活用ノウハウの獲得"]\n';
    diagram += '    R1A["なぜ必要？<br/>収益基盤の確立<br/>→ 次の事業への投資資金が必要<br/>→ 事業拡大のための資金調達"]\n';
    diagram += '    R1B["なぜ必要？<br/>自社の開発経験の蓄積<br/>→ 人材育成事業で教育コンテンツを作るため<br/>→ 実践的なノウハウの提供が可能に"]\n';
    diagram += '    R1C["なぜ必要？<br/>AI活用ノウハウの獲得<br/>→ AI駆動開発事業を立ち上げるため<br/>→ ドッグフーディング実績が信頼性を生む"]\n';
    diagram += '    class Y1,A1 year1Class\n';
    diagram += '    class R1A,R1B,R1C reasonClass\n\n';

    // 2年目：複数事業開始
    diagram += '    Y2A["2年目：自社開発・自社サービス事業<br/>注力事業<br/>サービス拡充<br/>パートナー連携強化"]\n';
    diagram += '    Y2B["2年目：人材育成・教育事業<br/>立ち上げ事業<br/>教育プログラム開発<br/>AI導入ルール設計サービス開始"]\n';
    diagram += '    Y2C["2年目：業務コンサル事業<br/>準備<br/>業務コンサル体制構築"]\n';
    diagram += '    Y2D["2年目：AI駆動開発事業<br/>準備<br/>AI駆動開発体制構築"]\n';
    diagram += '    A2["獲得：人材育成・ルール設計事業への強み<br/>業務コンサル基盤の準備<br/>AI駆動開発基盤の準備"]\n';
    diagram += '    R2A["なぜ必要？<br/>人材育成・ルール設計事業への強み<br/>→ 業務コンサル事業で組織全体のAI活用能力向上を支援<br/>→ エリア2への成長基盤構築"]\n';
    diagram += '    R2B["なぜ必要？<br/>業務コンサル基盤の準備<br/>→ プロセス可視化・改善支援を実現<br/>→ 助成金活用支援で顧客価値を高める"]\n';
    diagram += '    R2C["なぜ必要？<br/>AI駆動開発基盤の準備<br/>→ DX支援プロジェクトを実施するため<br/>→ 技術的信頼性を確立"]\n';
    diagram += '    class Y2A,Y2B,Y2C,Y2D,A2 year2Class\n';
    diagram += '    class R2A,R2B,R2C reasonClass\n\n';

    // 3年目：事業本格化
    diagram += '    Y3A["3年目：自社開発・自社サービス事業<br/>スケール事業<br/>事業の本格展開<br/>市場拡大"]\n';
    diagram += '    Y3B["3年目：人材育成・教育事業<br/>スケール事業<br/>教育事業の本格展開<br/>企業契約の拡大"]\n';
    diagram += '    Y3C["3年目：業務コンサル事業<br/>立ち上げ事業<br/>業務コンサルサービス開始<br/>プロセス可視化・改善支援"]\n';
    diagram += '    Y3D["3年目：AI駆動開発事業<br/>立ち上げ事業<br/>AI駆動開発サービス開始<br/>DX支援プロジェクト実施"]\n';
    diagram += '    A3["獲得：安定した収益基盤<br/>教育事業の収益化<br/>業務コンサル実績の創出<br/>AI駆動開発実績の創出"]\n';
    diagram += '    R3A["なぜ必要？<br/>安定した収益基盤<br/>→ 全事業の継続的な成長を支える<br/>→ 新規市場開拓のための資金確保"]\n';
    diagram += '    R3B["なぜ必要？<br/>教育事業の収益化<br/>→ 市場リーダーシップの確立<br/>→ 新規プログラム開発の資金源"]\n';
    diagram += '    R3C["なぜ必要？<br/>業務コンサル実績の創出<br/>→ リピート契約の獲得<br/>→ 専門性の確立"]\n';
    diagram += '    R3D["なぜ必要？<br/>AI駆動開発実績の創出<br/>→ 技術的信頼性の確立<br/>→ DX事業拡大の基盤"]\n';
    diagram += '    class Y3A,Y3B,Y3C,Y3D,A3 year3Class\n';
    diagram += '    class R3A,R3B,R3C,R3D reasonClass\n\n';

    // 4年目：全事業本格展開
    diagram += '    Y4A["4年目：業務コンサル事業<br/>スケール事業<br/>業務コンサル事業の本格展開<br/>サービスラインの拡充"]\n';
    diagram += '    Y4B["4年目：AI駆動開発事業<br/>スケール事業<br/>AI駆動開発事業の本格展開<br/>DX支援サービスの拡大"]\n';
    diagram += '    A4["獲得：業務コンサル事業の収益化<br/>AI駆動開発事業の収益化<br/>技術リーダーシップの確立"]\n';
    diagram += '    R4A["なぜ必要？<br/>業務コンサル事業の収益化<br/>→ 市場でのポジション確立<br/>→ 新規サービス開発の資金源"]\n';
    diagram += '    R4B["なぜ必要？<br/>AI駆動開発事業の収益化<br/>→ 技術リーダーシップの確立<br/>→ 技術的優位性の確立"]\n';
    diagram += '    R4C["なぜ必要？<br/>技術リーダーシップの確立<br/>→ 継続的な事業拡大の基盤<br/>→ 新規市場開拓のための信頼性"]\n';
    diagram += '    class Y4A,Y4B,A4 year4Class\n';
    diagram += '    class R4A,R4B,R4C reasonClass\n\n';

    // 5年目：継続的成長
    diagram += '    Y5["5年目：全事業<br/>継続的成長<br/>事業拡大<br/>新規市場開拓<br/>技術革新の推進"]\n';
    diagram += '    A5["獲得：持続的な成長<br/>市場シェア拡大<br/>技術的優位性の確立"]\n';
    diagram += '    R5A["なぜ必要？<br/>持続的な成長<br/>→ 長期的な競争優位性の確保<br/>→ 事業の継続可能性"]\n';
    diagram += '    R5B["なぜ必要？<br/>市場シェア拡大<br/>→ 業界でのリーダーシップ確立<br/>→ 新規事業への展開基盤"]\n';
    diagram += '    R5C["なぜ必要？<br/>技術的優位性の確立<br/>→ イノベーションの推進<br/>→ 次世代技術への対応力"]\n';
    diagram += '    class Y5,A5 year5Class\n';
    diagram += '    class R5A,R5B,R5C reasonClass\n\n';

    // 矢印で順序性を表現（詳細版では理由も含める）
    diagram += '    Y0 --> Y1\n';
    diagram += '    Y1 --> A1\n';
    diagram += '    A1 --> R1A\n';
    diagram += '    A1 --> R1B\n';
    diagram += '    A1 --> R1C\n';
    diagram += '    R1A --> Y2A\n';
    diagram += '    R1B --> Y2B\n';
    diagram += '    R1C --> Y2D\n';
    diagram += '    Y2A --> A2\n';
    diagram += '    Y2B --> A2\n';
    diagram += '    Y2C --> A2\n';
    diagram += '    Y2D --> A2\n';
    diagram += '    A2 --> R2A\n';
    diagram += '    A2 --> R2B\n';
    diagram += '    A2 --> R2C\n';
    diagram += '    R2A --> Y3C\n';
    diagram += '    R2B --> Y3C\n';
    diagram += '    R2C --> Y3D\n';
    diagram += '    Y3A --> A3\n';
    diagram += '    Y3B --> A3\n';
    diagram += '    Y3C --> A3\n';
    diagram += '    Y3D --> A3\n';
    diagram += '    A3 --> R3A\n';
    diagram += '    A3 --> R3B\n';
    diagram += '    A3 --> R3C\n';
    diagram += '    A3 --> R3D\n';
    diagram += '    R3C --> Y4A\n';
    diagram += '    R3D --> Y4B\n';
    diagram += '    Y4A --> A4\n';
    diagram += '    Y4B --> A4\n';
    diagram += '    A4 --> R4A\n';
    diagram += '    A4 --> R4B\n';
    diagram += '    A4 --> R4C\n';
    diagram += '    R4A --> Y5\n';
    diagram += '    R4B --> Y5\n';
    diagram += '    R4C --> Y5\n';
    diagram += '    Y5 --> A5\n';
    diagram += '    A5 --> R5A\n';
    diagram += '    A5 --> R5B\n';
    diagram += '    A5 --> R5C\n';

    return diagram;
  };

  // Mermaid図をレンダリング（簡略版）
  useEffect(() => {
    if (!mermaidLoaded || !diagramRef.current || renderedRef.current || isDetailed) return;

    const renderDiagram = async () => {
      try {
        const diagram = generateBusinessFlowDiagram();
        
        if (window.mermaid) {
          window.mermaid.initialize({ 
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
          });
          
          const { svg } = await window.mermaid.render('business-flow-diagram', diagram);
          if (diagramRef.current) {
            diagramRef.current.innerHTML = svg;
            renderedRef.current = true;
          }
        }
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = '';
        }
      }
    };

    renderDiagram();
  }, [mermaidLoaded, isDetailed]);

  // Mermaid図をレンダリング（詳細版）
  useEffect(() => {
    if (!mermaidLoaded || !detailedDiagramRef.current || detailedRenderedRef.current || !isDetailed) return;

    const renderDiagram = async () => {
      try {
        const diagram = generateDetailedBusinessFlowDiagram();
        
        if (window.mermaid) {
          window.mermaid.initialize({ 
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
          });
          
          const { svg } = await window.mermaid.render('detailed-business-flow-diagram', diagram);
          if (detailedDiagramRef.current) {
            detailedDiagramRef.current.innerHTML = svg;
            detailedRenderedRef.current = true;
          }
        }
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        if (detailedDiagramRef.current) {
          detailedDiagramRef.current.innerHTML = '';
        }
      }
    };

    renderDiagram();
  }, [mermaidLoaded, isDetailed]);

  // 表示切り替え時にレンダリング状態をリセット
  useEffect(() => {
    if (isDetailed) {
      renderedRef.current = false;
      if (diagramRef.current) {
        diagramRef.current.innerHTML = '';
      }
    } else {
      detailedRenderedRef.current = false;
      if (detailedDiagramRef.current) {
        detailedDiagramRef.current.innerHTML = '';
      }
    }
  }, [isDetailed]);

  // コンポーネント化されたページを使用するかチェック
  // pagesBySubMenuが存在する場合はComponentizedCompanyPlanOverviewを使用
  if (plan?.pagesBySubMenu) {
    return <ComponentizedCompanyPlanOverview />;
  }

  // 固定ページ形式で、planId固有のコンテンツが存在しない場合は何も表示しない
  if (!hasCustomContent) {
    return null;
  }

  // 年ごとのスケジュールを整理
  const scheduleByYear: { [year: number]: ScheduleItem[] } = {};
  SCHEDULE_DATA.forEach(item => {
    if (!scheduleByYear[item.year]) {
      scheduleByYear[item.year] = [];
    }
    scheduleByYear[item.year].push(item);
  });

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (typeof window !== 'undefined' && window.mermaid) {
            window.dispatchEvent(new Event('mermaidloaded'));
          }
        }}
      />
      
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        実行スケジュール
      </p>

      {/* ビジネスの順序性図 */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
            ビジネスの参入・強み獲得・事業拡大の順序性
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setIsDetailed(false)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: isDetailed ? 400 : 600,
                backgroundColor: isDetailed ? 'transparent' : 'var(--color-primary)',
                color: isDetailed ? 'var(--color-text)' : '#fff',
                border: `1px solid ${isDetailed ? 'var(--color-border-color)' : 'var(--color-primary)'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              簡略版
            </button>
            <button
              onClick={() => setIsDetailed(true)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: isDetailed ? 600 : 400,
                backgroundColor: isDetailed ? 'var(--color-primary)' : 'transparent',
                color: isDetailed ? '#fff' : 'var(--color-text)',
                border: `1px solid ${isDetailed ? 'var(--color-primary)' : 'var(--color-border-color)'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              詳細版
            </button>
          </div>
        </div>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          {!isDetailed ? (
            <div 
              ref={diagramRef}
              style={{ 
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '600px',
                backgroundColor: '#fff',
                minWidth: 'fit-content'
              }}
            />
          ) : (
            <div 
              ref={detailedDiagramRef}
              style={{ 
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '800px',
                backgroundColor: '#fff',
                minWidth: 'fit-content'
              }}
            />
          )}
        </div>
        {!mermaidLoaded && (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: 'var(--color-text-light)',
            fontSize: '14px'
          }}>
            Mermaidを読み込み中...
          </div>
        )}
      </div>

      <div className="card" style={{ 
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'block',
        position: 'relative',
        minWidth: 0,
        flexShrink: 1,
        flexBasis: 'auto'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>
          詳細スケジュール
        </h3>
        <div style={{ 
          width: '100%',
          maxWidth: '100%',
          overflowX: 'auto',
          overflowY: 'visible',
          WebkitOverflowScrolling: 'touch',
          minWidth: 0,
          display: 'block'
        }}>
          <table style={{ 
            minWidth: '1200px',
            borderCollapse: 'collapse', 
            fontSize: '14px',
            width: 'max-content',
            margin: 0,
            display: 'table',
            tableLayout: 'auto'
          }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(31, 41, 51, 0.05)' }}>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  border: '1px solid var(--color-border-color)', 
                  fontWeight: 600, 
                  minWidth: '150px',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#f5f5f5',
                  zIndex: 100,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                  backgroundClip: 'padding-box'
                }}>
                  項目
                </th>
                {[0, 1, 2, 3, 4, 5].map(year => (
                  <th 
                    key={year}
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      border: '1px solid var(--color-border-color)', 
                      fontWeight: 600,
                      minWidth: '200px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {year === 0 ? '0年目（準備期間）' : `${year}年目`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 立ち上げ事業行 */}
              <tr style={{ backgroundColor: '#fff' }}>
                <td style={{ 
                  padding: '12px', 
                  border: '1px solid var(--color-border-color)', 
                  verticalAlign: 'top',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#ffffff',
                  zIndex: 99,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                  backgroundClip: 'padding-box'
                }}>
                  立ち上げ事業
                </td>
                {[0, 1, 2, 3, 4, 5].map(year => {
                  const items = scheduleByYear[year] || [];
                  const startupItems = items.filter(item => item.phase === 'preparation' || item.phase === 'start');
                  return (
                    <td key={year} style={{ padding: '12px', border: '1px solid var(--color-border-color)', verticalAlign: 'top' }}>
                      {startupItems.length > 0 ? (
                        <div style={{ lineHeight: '1.8' }}>
                          {startupItems.map((item, i) => (
                            <div key={i}>{SERVICE_NAMES[item.serviceId]}</div>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                  );
                })}
              </tr>
              
              {/* 注力事業行 */}
              <tr style={{ backgroundColor: 'rgba(31, 41, 51, 0.02)' }}>
                <td style={{ 
                  padding: '12px', 
                  border: '1px solid var(--color-border-color)', 
                  verticalAlign: 'top',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#fafafa',
                  zIndex: 99,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                  backgroundClip: 'padding-box'
                }}>
                  注力事業
                </td>
                {[0, 1, 2, 3, 4, 5].map(year => {
                  const items = scheduleByYear[year] || [];
                  const focusItems = items.filter(item => item.phase === 'development');
                  return (
                    <td key={year} style={{ padding: '12px', border: '1px solid var(--color-border-color)', verticalAlign: 'top' }}>
                      {focusItems.length > 0 ? (
                        <div style={{ lineHeight: '1.8' }}>
                          {focusItems.map((item, i) => (
                            <div key={i}>{SERVICE_NAMES[item.serviceId]}</div>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                  );
                })}
              </tr>
              
              {/* スケール事業行 */}
              <tr style={{ backgroundColor: '#fff' }}>
                <td style={{ 
                  padding: '12px', 
                  border: '1px solid var(--color-border-color)', 
                  verticalAlign: 'top',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#ffffff',
                  zIndex: 99,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                  backgroundClip: 'padding-box'
                }}>
                  スケール事業
                </td>
                {[0, 1, 2, 3, 4, 5].map(year => {
                  const items = scheduleByYear[year] || [];
                  const scaleItems = items.filter(item => item.phase === 'full-scale');
                  return (
                    <td key={year} style={{ padding: '12px', border: '1px solid var(--color-border-color)', verticalAlign: 'top' }}>
                      {scaleItems.length > 0 ? (
                        <div style={{ lineHeight: '1.8' }}>
                          {scaleItems.map((item, i) => (
                            <div key={i}>{SERVICE_NAMES[item.serviceId]}</div>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                  );
                })}
              </tr>
              
              {/* 売上規模行 */}
              <tr style={{ backgroundColor: 'rgba(31, 41, 51, 0.02)' }}>
                <td style={{ 
                  padding: '12px', 
                  border: '1px solid var(--color-border-color)', 
                  verticalAlign: 'top',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#fafafa',
                  zIndex: 99,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                  backgroundClip: 'padding-box'
                }}>
                  売上規模
                </td>
                {[0, 1, 2, 3, 4, 5].map(year => {
                  const items = scheduleByYear[year] || [];
                  const revenues = items.map(item => item.revenue).filter(r => r);
                  const uniqueRevenues = Array.from(new Set(revenues));
                  return (
                    <td key={year} style={{ padding: '12px', border: '1px solid var(--color-border-color)', verticalAlign: 'top' }}>
                      {uniqueRevenues.length > 0 ? (
                        <div style={{ lineHeight: '1.8' }}>
                          {uniqueRevenues.map((revenue, i) => (
                            <div key={i}>{revenue}百万円</div>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                  );
                })}
              </tr>
              
              {/* 税後利益規模行 */}
              <tr style={{ backgroundColor: '#fff' }}>
                <td style={{ 
                  padding: '12px', 
                  border: '1px solid var(--color-border-color)', 
                  verticalAlign: 'top',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#ffffff',
                  zIndex: 99,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                  backgroundClip: 'padding-box'
                }}>
                  税後利益規模
                </td>
                {[0, 1, 2, 3, 4, 5].map(year => {
                  const items = scheduleByYear[year] || [];
                  const netIncomes = items.map(item => item.netIncome).filter(n => n);
                  const uniqueNetIncomes = Array.from(new Set(netIncomes));
                  return (
                    <td key={year} style={{ padding: '12px', border: '1px solid var(--color-border-color)', verticalAlign: 'top' }}>
                      {uniqueNetIncomes.length > 0 ? (
                        <div style={{ lineHeight: '1.8' }}>
                          {uniqueNetIncomes.map((netIncome, i) => (
                            <div key={i}>{netIncome}百万円</div>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                  );
                })}
              </tr>
              
              {/* 取り組み内容行 */}
              <tr style={{ backgroundColor: 'rgba(31, 41, 51, 0.02)' }}>
                <td style={{ 
                  padding: '12px', 
                  border: '1px solid var(--color-border-color)', 
                  verticalAlign: 'top',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#fafafa',
                  zIndex: 99,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                  backgroundClip: 'padding-box'
                }}>
                  取り組み内容
                </td>
                {[0, 1, 2, 3, 4, 5].map(year => {
                  const items = scheduleByYear[year] || [];
                  return (
                    <td key={year} style={{ padding: '12px', border: '1px solid var(--color-border-color)', verticalAlign: 'top' }}>
                      {items.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                          {items.map((item, i) => (
                            <React.Fragment key={i}>
                              {item.activities.map((activity, j) => (
                                <li key={j}>{activity}</li>
                              ))}
                            </React.Fragment>
                          ))}
                        </ul>
                      ) : '-'}
                    </td>
                  );
                })}
              </tr>
              
              {/* 獲得する価値・実績行 */}
              <tr style={{ backgroundColor: '#fff' }}>
                <td style={{ 
                  padding: '12px', 
                  border: '1px solid var(--color-border-color)', 
                  verticalAlign: 'top',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#ffffff',
                  zIndex: 99,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                  backgroundClip: 'padding-box'
                }}>
                  獲得する価値・実績
                </td>
                {[0, 1, 2, 3, 4, 5].map(year => {
                  const items = scheduleByYear[year] || [];
                  return (
                    <td key={year} style={{ padding: '12px', border: '1px solid var(--color-border-color)', verticalAlign: 'top' }}>
                      {items.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                          {items.map((item, i) => (
                            <React.Fragment key={i}>
                              {item.achievements.map((achievement, j) => (
                                <li key={j}>{achievement}</li>
                              ))}
                            </React.Fragment>
                          ))}
                        </ul>
                      ) : '-'}
                    </td>
                  );
                })}
              </tr>
              
              {/* 次のステップ行 */}
              <tr style={{ backgroundColor: 'rgba(31, 41, 51, 0.02)' }}>
                <td style={{ 
                  padding: '12px', 
                  border: '1px solid var(--color-border-color)', 
                  verticalAlign: 'top',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#fafafa',
                  zIndex: 99,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                  backgroundClip: 'padding-box'
                }}>
                  次のステップ
                </td>
                {[0, 1, 2, 3, 4, 5].map(year => {
                  const items = scheduleByYear[year] || [];
                  const nextSteps = items.map(item => item.nextStep).filter(step => step);
                  return (
                    <td key={year} style={{ padding: '12px', border: '1px solid var(--color-border-color)', verticalAlign: 'top' }}>
                      {nextSteps.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                          {nextSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      ) : '-'}
                    </td>
                  );
                })}
              </tr>
              
              {/* 伊藤忠シナジー行 */}
              <tr style={{ backgroundColor: '#fff' }}>
                <td style={{ 
                  padding: '12px', 
                  border: '1px solid var(--color-border-color)', 
                  verticalAlign: 'top',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#ffffff',
                  zIndex: 99,
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                  backgroundClip: 'padding-box'
                }}>
                  伊藤忠シナジー
                </td>
                {[0, 1, 2, 3, 4, 5].map(year => {
                  // 4年目と5年目は1,2,3年目の企業すべてを含める
                  // それ以外は前年までのすべての企業を含める
                  const targetYears = year >= 4 ? [1, 2, 3] : Array.from({ length: year + 1 }, (_, i) => i);
                  const synergyItems = Array.from(new Set(
                    targetYears.flatMap(y => {
                      const items = scheduleByYear[y] || [];
                      return items
                        .map(item => item.itochuSynergy || [])
                        .flat()
                        .filter(synergy => synergy);
                    })
                  ));
                  
                  return (
                    <td key={year} style={{ padding: '12px', border: '1px solid var(--color-border-color)', verticalAlign: 'top' }}>
                      {synergyItems.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                          {synergyItems.map((synergy, i) => (
                            <li key={i}>{synergy}</li>
                          ))}
                        </ul>
                      ) : '-'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
