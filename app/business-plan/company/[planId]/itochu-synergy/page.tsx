'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    mermaid?: any;
  }
}

interface GroupCompany {
  name: string;
  business: string;
  synergy: string[];
  collaboration: string[];
  strategicValue: string;
}

interface BusinessSynergy {
  serviceId: string;
  serviceName: string;
  companies: {
    companyName: string;
    synergy: string[];
    collaboration: string[];
    strategicValue: string;
  }[];
}

const BUSINESS_SYNERGIES: BusinessSynergy[] = [
  {
    serviceId: 'own-service',
    serviceName: '自社開発・自社サービス事業',
    companies: [
      {
        companyName: 'ベルシステム24',
        synergy: [
          'パーソナルアプリのカスタマーサポート体制構築',
          'ユーザーからの問い合わせ対応ノウハウの活用',
          'B2B契約企業のサポート体制強化'
        ],
        collaboration: [
          'コールセンター機能のアプリ内統合',
          '24時間365日対応体制の構築',
          '多言語対応サービスの提供'
        ],
        strategicValue: 'エンドユーザーとの接点強化と顧客満足度向上'
      },
      {
        companyName: '伊藤忠テクノソリューションズ',
        synergy: [
          'AIアシスタントの技術基盤構築',
          'セキュリティ・ガバナンス体制の強化',
          'エンタープライズ向けカスタマイズ対応'
        ],
        collaboration: [
          'プラットフォームの技術サポート',
          '企業・自治体向けシステム連携',
          'データ管理・分析基盤の構築'
        ],
        strategicValue: '技術的信頼性の確保とB2B事業拡大の基盤'
      },
      {
        companyName: '伊藤忠インタラクティブ',
        synergy: [
          'パーソナルアプリのマーケティング戦略',
          'ECリファラル・アフィリエイト事業の拡大',
          'デジタル広告運用ノウハウの活用'
        ],
        collaboration: [
          'アプリ内EC機能の統合',
          'パートナー企業との連携強化',
          'データドリブンなマーケティング施策'
        ],
        strategicValue: '収益チャネルの多様化とユーザー獲得効率化'
      },
      {
        companyName: 'GIクラウド',
        synergy: [
          'プラットフォームのインフラ基盤',
          'スケーラブルなシステム構築',
          'データ管理・バックアップ体制'
        ],
        collaboration: [
          'クラウドインフラの提供',
          'データセンター運用サポート',
          '災害対策・BCP体制の構築'
        ],
        strategicValue: '安定したサービス提供と事業拡大の基盤'
      },
      {
        companyName: 'I&B',
        synergy: [
          '保険代行サービスの強化',
          '保険パートナーとの連携深化',
          '金融サービス統合の可能性'
        ],
        collaboration: [
          '保険加入手続き代行の拡充',
          '保険申請・手続き代行の自動化',
          '保険商品のアプリ内紹介'
        ],
        strategicValue: '高単価サービス領域への展開と収益性向上'
      }
    ]
  },
  {
    serviceId: 'education-training',
    serviceName: 'AI導入ルール設計・人材育成・教育事業',
    companies: [
      {
        companyName: '伊藤忠テクノソリューションズ',
        synergy: [
          'AI導入ルール設計の技術的実装支援',
          'セキュリティ・ガバナンス体制の構築',
          'エンタープライズ向け教育コンテンツの提供'
        ],
        collaboration: [
          'AI導入ルール設計の技術サポート',
          'ガバナンス構築の実装支援',
          'システム部門向け教育プログラムの提供'
        ],
        strategicValue: '技術的信頼性の確保と教育事業の拡大'
      },
      {
        companyName: 'シグマクシス',
        synergy: [
          'AI活用教育プログラムの開発支援',
          'ドッグフーディング案件の教育コンテンツ化',
          'AI活用ノウハウの教育への展開'
        ],
        collaboration: [
          '教育プログラムの技術連携',
          '実践的AI活用研修の開発',
          'セキュリティ・データガバナンス教育の実装'
        ],
        strategicValue: 'AI事業戦略の技術的実現と教育ノウハウ獲得'
      },
      {
        companyName: '辻本郷itコンサル',
        synergy: [
          'AI導入コンサルティングの展開',
          '組織全体のAI活用能力向上支援',
          '経営層向けコンサルティングの強化'
        ],
        collaboration: [
          'AI導入ルール設計コンサルティング',
          'ガバナンス構築支援',
          '組織全体のAI活用能力向上コンサルティング'
        ],
        strategicValue: 'エリア2への成長基盤構築と教育事業の実現'
      }
    ]
  },
  {
    serviceId: 'consulting',
    serviceName: 'プロセス可視化・業務コンサル事業',
    companies: [
      {
        companyName: 'シグマクシス',
        synergy: [
          '分散データ分析システムの開発支援',
          'プロセス可視化ツールの技術実装',
          'AI Agentによる業務分析の実現'
        ],
        collaboration: [
          '業務プロセス可視化システムの開発',
          '分散データ分析ツールの構築',
          'セキュリティ・データガバナンスの実装'
        ],
        strategicValue: 'AI事業戦略の技術的実現と業務コンサル基盤'
      },
      {
        companyName: '辻本郷itコンサル',
        synergy: [
          '業務コンサル事業の強化',
          'プロセス可視化・改善支援の実現',
          '助成金活用支援の展開'
        ],
        collaboration: [
          '業務プロセス可視化コンサルティング',
          '分散データ分析・改善提案',
          '助成金活用支援・申請代行'
        ],
        strategicValue: 'エリア2への成長基盤構築と業務コンサル事業の実現'
      },
      {
        companyName: 'GIクラウド',
        synergy: [
          '分散データ管理基盤の提供',
          'スケーラブルな分析システム構築',
          'データバックアップ・セキュリティ体制'
        ],
        collaboration: [
          'クラウドインフラの提供',
          'データ管理基盤の構築',
          '災害対策・BCP体制の構築'
        ],
        strategicValue: '安定したデータ管理と業務コンサル事業の基盤'
      }
    ]
  },
  {
    serviceId: 'ai-dx',
    serviceName: 'AI駆動開発・DX支援SI事業',
    companies: [
      {
        companyName: '伊藤忠テクノソリューションズ',
        synergy: [
          'AI活用アーキテクチャの技術基盤構築',
          'セキュリティ・ガバナンス体制の強化',
          'エンタープライズ向けシステム連携'
        ],
        collaboration: [
          'AI活用アーキテクチャ導入の技術サポート',
          'カスタムAIシステム開発の基盤構築',
          'データ統合・分析システムの構築'
        ],
        strategicValue: '技術的信頼性の確保とDX事業拡大の基盤'
      },
      {
        companyName: 'シグマクシス',
        synergy: [
          'AI駆動開発の技術的実現',
          'ドッグフーディング案件の共同開発',
          'AI活用ノウハウの蓄積'
        ],
        collaboration: [
          'AI活用アーキテクチャ導入支援',
          'カスタムAIシステム開発',
          'セキュリティ・データガバナンスの実装'
        ],
        strategicValue: 'AI事業戦略の技術的実現とDXノウハウ獲得'
      },
      {
        companyName: 'GIクラウド',
        synergy: [
          'AIシステムのインフラ基盤',
          'スケーラブルなAIシステム構築',
          'データ管理・バックアップ体制'
        ],
        collaboration: [
          'クラウドインフラの提供',
          'AIシステム運用のインフラサポート',
          '災害対策・BCP体制の構築'
        ],
        strategicValue: '安定したAIシステム提供とDX事業拡大の基盤'
      },
      {
        companyName: '辻本郷itコンサル',
        synergy: [
          'DX推進コンサルティングの展開',
          'AI導入支援・DX推進支援',
          '助成金活用支援の展開'
        ],
        collaboration: [
          'AI導入支援・DX推進支援',
          '助成金活用支援・申請代行',
          'システム部門向けコンサルティング'
        ],
        strategicValue: 'エリア2への成長基盤構築とDX事業の実現'
      }
    ]
  }
];

// 後方互換性のため、GROUP_COMPANIESも保持
const GROUP_COMPANIES: GroupCompany[] = [
  {
    name: 'ベルシステム24',
    business: 'コールセンター・BPO事業',
    synergy: [
      'パーソナルアプリのカスタマーサポート体制構築',
      'ユーザーからの問い合わせ対応ノウハウの活用',
      'B2B契約企業のサポート体制強化'
    ],
    collaboration: [
      'コールセンター機能のアプリ内統合',
      '24時間365日対応体制の構築',
      '多言語対応サービスの提供'
    ],
    strategicValue: 'エンドユーザーとの接点強化と顧客満足度向上'
  },
  {
    name: '伊藤忠テクノソリューションズ',
    business: 'ITソリューション・システムインテグレーション',
    synergy: [
      'AIアシスタントの技術基盤構築',
      'セキュリティ・ガバナンス体制の強化',
      'エンタープライズ向けカスタマイズ対応'
    ],
    collaboration: [
      'プラットフォームの技術サポート',
      '企業・自治体向けシステム連携',
      'データ管理・分析基盤の構築'
    ],
    strategicValue: '技術的信頼性の確保とB2B事業拡大の基盤'
  },
  {
    name: '伊藤忠インタラクティブ',
    business: 'デジタルマーケティング・EC事業',
    synergy: [
      'パーソナルアプリのマーケティング戦略',
      'ECリファラル・アフィリエイト事業の拡大',
      'デジタル広告運用ノウハウの活用'
    ],
    collaboration: [
      'アプリ内EC機能の統合',
      'パートナー企業との連携強化',
      'データドリブンなマーケティング施策'
    ],
    strategicValue: '収益チャネルの多様化とユーザー獲得効率化'
  },
  {
    name: 'シグマクシス',
    business: 'システム開発・DX支援',
    synergy: [
      'AIアシスタント機能の開発支援',
      'ドッグフーディング案件の共同開発',
      'AI活用ノウハウの蓄積'
    ],
    collaboration: [
      'AI新規事業会社との技術連携',
      '業務コンサル事業への展開',
      'セキュリティ・データガバナンスの実装'
    ],
    strategicValue: 'AI事業戦略の技術的実現とノウハウ獲得'
  },
  {
    name: 'GIクラウド',
    business: 'クラウドインフラ・データセンター',
    synergy: [
      'プラットフォームのインフラ基盤',
      'スケーラブルなシステム構築',
      'データ管理・バックアップ体制'
    ],
    collaboration: [
      'クラウドインフラの提供',
      'データセンター運用サポート',
      '災害対策・BCP体制の構築'
    ],
    strategicValue: '安定したサービス提供と事業拡大の基盤'
  },
  {
    name: 'I&B',
    business: '保険・金融サービス',
    synergy: [
      '保険代行サービスの強化',
      '保険パートナーとの連携深化',
      '金融サービス統合の可能性'
    ],
    collaboration: [
      '保険加入手続き代行の拡充',
      '保険申請・手続き代行の自動化',
      '保険商品のアプリ内紹介'
    ],
    strategicValue: '高単価サービス領域への展開と収益性向上'
  },
  {
    name: '辻本郷itコンサル',
    business: 'ITコンサルティング・システム構築',
    synergy: [
      '業務コンサル事業の強化',
      'AI活用コンサルティングの展開',
      'プロセス可視化・改善支援の実現'
    ],
    collaboration: [
      '業務プロセス可視化コンサルティング',
      'AI導入支援・DX推進支援',
      '分散データ分析・改善提案',
      '助成金活用支援・申請代行'
    ],
    strategicValue: 'エリア2への成長基盤構築と業務コンサル事業の実現'
  }
];

export default function ItochuSynergyPage() {
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [expandedQuantitative, setExpandedQuantitative] = useState<boolean>(false);
  const [expandedQualitative, setExpandedQualitative] = useState<boolean>(false);
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const valueArchitectureRef = useRef<HTMLDivElement>(null);
  const valueArchitectureRenderedRef = useRef(false);
  const companyDiagramRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const companyRenderedRefs = useRef<{ [key: string]: boolean }>({});

  // Mermaidの読み込み状態をチェック
  useEffect(() => {
    if (typeof window !== 'undefined' && window.mermaid) {
      setMermaidLoaded(true);
    }
  }, []);

  // 獲得価値アーキテクチャ図を生成
  const generateValueArchitectureDiagram = () => {
    let diagram = 'graph TB\n';
    diagram += '    direction TB\n';
    diagram += '    classDef startupClass fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff\n';
    diagram += '    classDef quantitativeClass fill:#90EE90,stroke:#32CD32,stroke-width:2px,color:#000\n';
    diagram += '    classDef qualitativeClass fill:#FFB6C1,stroke:#FF69B4,stroke-width:2px,color:#000\n';
    diagram += '    classDef area2Class fill:#FFF9C4,stroke:#F9A825,stroke-width:2px,color:#000\n';
    diagram += '    classDef groupClass fill:#E3F2FD,stroke:#1976D2,stroke-width:2px,color:#000\n\n';
    
    diagram += '    Startup["株式会社AIアシスタント<br/>設立・事業立ち上げ"]\n\n';
    
    diagram += '    subgraph Quantitative["定量面（数値で測定可能な価値）"]\n';
    diagram += '        Q1["事業実績・売上<br/>━━━━━━━━━━━━━━━━<br/>・ユーザー獲得数<br/>・B2B契約数<br/>・プレミアムプラン加入者数<br/>・パートナー連携件数<br/>・代行サービス取扱件数<br/>・売上高・利益率"]\n';
    diagram += '        Q2["ドッグフーディング案件<br/>━━━━━━━━━━━━━━━━<br/>・実施件数<br/>・成功件数<br/>・顧客満足度スコア<br/>・案件あたり平均売上<br/>・リピート率"]\n';
    diagram += '        Q3["データ・アセット蓄積<br/>━━━━━━━━━━━━━━━━<br/>・ユーザーデータ蓄積量<br/>・AI学習データ量・質<br/>・業務プロセスデータ<br/>・改善効果の数値化"]\n';
    diagram += '        Q4["組織・人材の成長<br/>━━━━━━━━━━━━━━━━<br/>・AIスキル人材育成数<br/>・教育プログラム受講者数<br/>・資格・認定取得者数<br/>・社内AIプロジェクト件数"]\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph Qualitative["定性面（数値では測定困難だが重要な価値）"]\n';
    diagram += '        L1["AI活用ノウハウ蓄積<br/>━━━━━━━━━━━━━━━━<br/>・実装ノウハウ<br/>・ベストプラクティス<br/>・課題解決ノウハウ<br/>・エンドユーザー知見<br/>・業務コンサル知識"]\n';
    diagram += '        L2["プレイグラウンド機能<br/>━━━━━━━━━━━━━━━━<br/>・実績・信頼性確立<br/>・検証環境構築<br/>・実験的取り組みの場<br/>・試行錯誤の実現"]\n';
    diagram += '        L3["ブランディング・認知<br/>━━━━━━━━━━━━━━━━<br/>・AIファーストカンパニー<br/>・イノベーション企業認知<br/>・次世代技術アピール<br/>・AI技術力の可視化"]\n';
    diagram += '        L4["エリア2成長基盤<br/>━━━━━━━━━━━━━━━━<br/>・業務コンサル展開基盤<br/>・保守運用体制ノウハウ<br/>・保険ビジネス展開<br/>・高マネタイズ領域への道"]\n';
    diagram += '        L5["グループ波及効果<br/>━━━━━━━━━━━━━━━━<br/>・連携強化の実証<br/>・AI活用能力向上<br/>・技術展開基盤<br/>・競争力強化"]\n';
    diagram += '    end\n\n';
    
    diagram += '    Area2["エリア2<br/>高マネタイズインパクト<br/>━━━━━━━━━━━━━━━━<br/>・AI時代の保守運用<br/>・業務コンサル・保険ビジネス<br/>・組織再編・体制強化"]\n';
    diagram += '    Group["グループ全体<br/>━━━━━━━━━━━━━━━━<br/>・グループ会社間連携<br/>・AI活用能力向上<br/>・競争力強化"]\n\n';
    
    diagram += '    Startup -->|事業展開| Q1\n';
    diagram += '    Startup -->|案件実施| Q2\n';
    diagram += '    Startup -->|データ収集| Q3\n';
    diagram += '    Startup -->|人材育成| Q4\n\n';
    
    diagram += '    Q1 -->|実績創出| L1\n';
    diagram += '    Q1 -->|信頼性確立| L2\n';
    diagram += '    Q1 -->|認知向上| L3\n';
    diagram += '    Q2 -->|ノウハウ蓄積| L1\n';
    diagram += '    Q2 -->|検証環境| L2\n';
    diagram += '    Q3 -->|データ活用ノウハウ| L1\n';
    diagram += '    Q3 -->|分析基盤| L4\n';
    diagram += '    Q4 -->|組織能力向上| L1\n';
    diagram += '    Q4 -->|人材基盤| L5\n\n';
    
    diagram += '    L1 -->|技術基盤| L4\n';
    diagram += '    L1 -->|知識共有| L5\n';
    diagram += '    L2 -->|実績基盤| L4\n';
    diagram += '    L2 -->|実験場| L5\n';
    diagram += '    L3 -->|ブランド価値| L4\n';
    diagram += '    L3 -->|グループ認知| L5\n\n';
    
    diagram += '    L4 -->|成長実現| Area2\n';
    diagram += '    L5 -->|波及効果| Group\n';
    diagram += '    Area2 -->|高マネタイズ| Group\n\n';
    
    diagram += '    class Startup startupClass\n';
    diagram += '    class Q1,Q2,Q3,Q4 quantitativeClass\n';
    diagram += '    class L1,L2,L3,L4,L5 qualitativeClass\n';
    diagram += '    class Area2 area2Class\n';
    diagram += '    class Group groupClass\n';
    
    return diagram;
  };

  // Mermaid図を生成（SOW構造化版）
  const generateSynergyDiagram = () => {
    let diagram = 'graph TB\n';
    diagram += '    direction TB\n';
    diagram += '    classDef area1Class fill:#E3F2FD,stroke:#1976D2,stroke-width:2px,color:#000\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff\n';
    diagram += '    classDef groupClass fill:#90EE90,stroke:#32CD32,stroke-width:2px,color:#000\n';
    diagram += '    classDef partnerClass fill:#FFB6C1,stroke:#FF69B4,stroke-width:2px,color:#000\n';
    diagram += '    classDef area2Class fill:#FFF9C4,stroke:#F9A825,stroke-width:2px,color:#000\n';
    diagram += '    classDef sowClass fill:#F5F5F5,stroke:#666,stroke-width:1px,color:#000\n\n';
    
    diagram += '    Area1["エリア1: 情報・通信部門AI事業戦略<br/>━━━━━━━━━━━━━━━━<br/>【SOW】<br/>・AI新規事業会社の設立<br/>・ドッグフーディング案件の創出<br/>・AI活用ノウハウの獲得<br/>・業務コンサル基盤の構築"]\n';
    diagram += '    Company["株式会社AIアシスタント<br/>━━━━━━━━━━━━━━━━<br/>【役割】プレイグラウンド<br/>【提供】出産支援パーソナルアプリ<br/>【成果物】実績・ノウハウ・データ"]\n';
    diagram += '    Google["Google等大手AI企業<br/>━━━━━━━━━━━━━━━━<br/>【SOW】<br/>・AIモデル・Agent技術提供<br/>・協業連携・技術支援"]\n\n';
    
    diagram += '    subgraph SOW1["SOW: ベルシステム24"]\n';
    diagram += '        B24_Input["【インプット】<br/>・アプリ利用者からの問い合わせ<br/>・B2B契約企業のサポート要請"]\n';
    diagram += '        B24_Work["【作業範囲】<br/>・24時間365日コールセンター対応<br/>・多言語対応サービス<br/>・アプリ内サポート機能統合"]\n';
    diagram += '        B24_Output["【アウトプット】<br/>・顧客満足度向上<br/>・問い合わせ対応ノウハウ<br/>・サポート体制の強化"]\n';
    diagram += '        B24_Input --> B24_Work\n';
    diagram += '        B24_Work --> B24_Output\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph SOW2["SOW: 伊藤忠テクノソリューションズ"]\n';
    diagram += '        ITS_Input["【インプット】<br/>・プラットフォーム技術要件<br/>・セキュリティ・ガバナンス要件"]\n';
    diagram += '        ITS_Work["【作業範囲】<br/>・AIアシスタント技術基盤構築<br/>・セキュリティ体制強化<br/>・企業・自治体向けシステム連携<br/>・データ管理・分析基盤構築"]\n';
    diagram += '        ITS_Output["【アウトプット】<br/>・技術的信頼性の確保<br/>・B2B事業拡大の基盤<br/>・エンタープライズ対応力"]\n';
    diagram += '        ITS_Input --> ITS_Work\n';
    diagram += '        ITS_Work --> ITS_Output\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph SOW3["SOW: 伊藤忠インタラクティブ"]\n';
    diagram += '        ITI_Input["【インプット】<br/>・マーケティング要件<br/>・EC・広告運用要件"]\n';
    diagram += '        ITI_Work["【作業範囲】<br/>・デジタルマーケティング戦略<br/>・ECリファラル・アフィリエイト運用<br/>・パートナー企業との連携強化<br/>・データドリブン施策"]\n';
    diagram += '        ITI_Output["【アウトプット】<br/>・収益チャネルの多様化<br/>・ユーザー獲得効率化<br/>・マーケティングノウハウ"]\n';
    diagram += '        ITI_Input --> ITI_Work\n';
    diagram += '        ITI_Work --> ITI_Output\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph SOW4["SOW: シグマクシス"]\n';
    diagram += '        SG_Input["【インプット】<br/>・AI機能開発要件<br/>・ドッグフーディング案件"]\n';
    diagram += '        SG_Work["【作業範囲】<br/>・AIアシスタント機能開発支援<br/>・ドッグフーディング案件の共同開発<br/>・セキュリティ・データガバナンス実装<br/>・業務コンサル事業への展開"]\n';
    diagram += '        SG_Output["【アウトプット】<br/>・AI事業戦略の技術的実現<br/>・AI活用ノウハウの蓄積<br/>・業務コンサル基盤"]\n';
    diagram += '        SG_Input --> SG_Work\n';
    diagram += '        SG_Work --> SG_Output\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph SOW5["SOW: GIクラウド"]\n';
    diagram += '        GI_Input["【インプット】<br/>・インフラ要件<br/>・スケーラビリティ要件"]\n';
    diagram += '        GI_Work["【作業範囲】<br/>・クラウドインフラの提供<br/>・データセンター運用サポート<br/>・災害対策・BCP体制構築<br/>・スケーラブルなシステム構築"]\n';
    diagram += '        GI_Output["【アウトプット】<br/>・安定したサービス提供<br/>・事業拡大の基盤<br/>・データ管理・バックアップ体制"]\n';
    diagram += '        GI_Input --> GI_Work\n';
    diagram += '        GI_Work --> GI_Output\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph SOW6["SOW: I&B"]\n';
    diagram += '        IB_Input["【インプット】<br/>・保険代行サービス要件<br/>・金融サービス統合要件"]\n';
    diagram += '        IB_Work["【作業範囲】<br/>・保険加入手続き代行の拡充<br/>・保険申請・手続き代行の自動化<br/>・保険商品のアプリ内紹介<br/>・保険パートナーとの連携深化"]\n';
    diagram += '        IB_Output["【アウトプット】<br/>・高単価サービス領域への展開<br/>・収益性向上<br/>・金融サービス統合の可能性"]\n';
    diagram += '        IB_Input --> IB_Work\n';
    diagram += '        IB_Work --> IB_Output\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph SOW7["SOW: 辻本郷itコンサル"]\n';
    diagram += '        TJ_Input["【インプット】<br/>・業務コンサル要件<br/>・AI活用コンサル要件<br/>・プロセス可視化要件"]\n';
    diagram += '        TJ_Work["【作業範囲】<br/>・業務プロセス可視化コンサルティング<br/>・AI導入支援・DX推進支援<br/>・分散データ分析・改善提案<br/>・助成金活用支援・申請代行"]\n';
    diagram += '        TJ_Output["【アウトプット】<br/>・エリア2への成長基盤構築<br/>・業務コンサル事業の実現<br/>・AI活用ノウハウの組織展開"]\n';
    diagram += '        TJ_Input --> TJ_Work\n';
    diagram += '        TJ_Work --> TJ_Output\n';
    diagram += '    end\n\n';
    
    diagram += '    Area2["エリア2: 高マネタイズインパクト<br/>━━━━━━━━━━━━━━━━<br/>【成果物】<br/>・AI時代の保守運用体制<br/>・業務コンサル・保険ビジネス<br/>・組織再編・体制強化"]\n\n';
    
    diagram += '    Area1 -->|【SOW】AI新規事業会社設立<br/>プレイグラウンド機能提供| Company\n';
    diagram += '    Google -->|【SOW】AI技術提供<br/>協業連携| Company\n';
    diagram += '    Company -->|【要件定義】<br/>サポート体制構築| SOW1\n';
    diagram += '    Company -->|【要件定義】<br/>技術基盤構築| SOW2\n';
    diagram += '    Company -->|【要件定義】<br/>マーケティング戦略| SOW3\n';
    diagram += '    Company -->|【要件定義】<br/>開発支援| SOW4\n';
    diagram += '    Company -->|【要件定義】<br/>インフラ基盤| SOW5\n';
    diagram += '    Company -->|【要件定義】<br/>保険代行サービス| SOW6\n';
    diagram += '    Company -->|【要件定義】<br/>業務コンサル展開| SOW7\n\n';
    
    diagram += '    SOW1 -->|【成果物】<br/>サポート体制| Company\n';
    diagram += '    SOW2 -->|【成果物】<br/>技術基盤| Company\n';
    diagram += '    SOW3 -->|【成果物】<br/>マーケティング力| Company\n';
    diagram += '    SOW4 -->|【成果物】<br/>AIノウハウ| Company\n';
    diagram += '    SOW5 -->|【成果物】<br/>インフラ基盤| Company\n';
    diagram += '    SOW6 -->|【成果物】<br/>高単価サービス| Company\n';
    diagram += '    SOW7 -->|【成果物】<br/>業務コンサル基盤| Company\n\n';
    
    diagram += '    Company -->|【成果物】<br/>実績・ノウハウ・データ<br/>業務コンサル基盤| Area2\n\n';
    
    diagram += '    class Area1 area1Class\n';
    diagram += '    class Company companyClass\n';
    diagram += '    class Google partnerClass\n';
    diagram += '    class Area2 area2Class\n';
    diagram += '    class SOW1,SOW2,SOW3,SOW4,SOW5,SOW6,SOW7 sowClass\n';
    diagram += '    class B24_Input,B24_Work,B24_Output,ITS_Input,ITS_Work,ITS_Output,ITI_Input,ITI_Work,ITI_Output,SG_Input,SG_Work,SG_Output,GI_Input,GI_Work,GI_Output,IB_Input,IB_Work,IB_Output,TJ_Input,TJ_Work,TJ_Output groupClass\n';
    
    return diagram;
  };

  // 各グループ会社とのSOW図を生成（シーケンス図版）
  const generateCompanySOWDiagram = (serviceId: string, companyName: string) => {
    const businessSynergy = BUSINESS_SYNERGIES.find(bs => bs.serviceId === serviceId);
    if (!businessSynergy) return '';
    
    const company = businessSynergy.companies.find(c => c.companyName === companyName);
    if (!company) return '';

    let diagram = 'sequenceDiagram\n';
    diagram += `    participant C as 株式会社AIアシスタント<br/>${businessSynergy.serviceName}\n`;
    diagram += `    participant G as ${company.companyName}\n\n`;
    
    diagram += `    Note over C: 【役割】<br/>・${businessSynergy.serviceName}<br/>・AI活用ノウハウ獲得\n\n`;
    
    diagram += '    Note over C,G: 【フェーズ1】要件定義・依頼\n';
    diagram += '    C->>G: 連携要件の提示\n';
    company.collaboration.forEach((item, index) => {
      if (index < 3) { // 最初の3つを表示
        diagram += `    C->>G: ${item}\n`;
      }
    });
    if (company.collaboration.length > 3) {
      diagram += `    C->>G: ...他${company.collaboration.length - 3}項目\n`;
    }
    diagram += '    G-->>C: 要件確認・受諾\n\n';
    
    diagram += '    Note over C,G: 【フェーズ2】作業範囲 SOW 実施\n';
    company.synergy.forEach((item, index) => {
      if (index < 3) { // 最初の3つを表示
        diagram += `    G->>G: ${item}\n`;
      }
    });
    if (company.synergy.length > 3) {
      diagram += `    G->>G: ...他${company.synergy.length - 3}項目\n`;
    }
    diagram += '    G->>C: 作業進捗報告\n';
    diagram += '    C-->>G: フィードバック・調整\n\n';
    
    diagram += '    Note over C,G: 【フェーズ3】成果物提供・価値創出\n';
    diagram += `    G->>C: ${company.strategicValue}\n`;
    diagram += '    C-->>G: 成果物確認・評価\n';
    diagram += '    C->>C: AI活用ノウハウの蓄積\n';
    diagram += '    C->>C: 業務コンサル基盤の強化\n\n';
    
    diagram += '    Note over C,G: 【継続的連携】\n';
    diagram += '    C<->>G: 相互連携・情報共有\n';
    diagram += '    C<->>G: 新たな連携機会の創出\n';
    
    return diagram;
  };

  // 各グループ会社のMermaid図をレンダリング
  useEffect(() => {
    if (!mermaidLoaded || !expandedService || !expandedCompany) return;

    // expandedCompanyは既に`${serviceId}-${companyName}`の形式
    const diagramKey = expandedCompany;
    
    const renderDiagram = async (ref: HTMLDivElement, key: string) => {
      try {
        // expandedCompanyからserviceIdとcompanyNameを抽出
        const [serviceId, ...companyNameParts] = expandedCompany.split('-');
        const companyName = companyNameParts.join('-');
        
        const diagram = generateCompanySOWDiagram(serviceId, companyName);
        if (!diagram) return;

        if (window.mermaid) {
          // 既存のSVGをクリア
          ref.innerHTML = '';
          
          const diagramId = `company-diagram-${key.replace(/\s/g, '-')}-${Date.now()}`;
          const { svg } = await window.mermaid.render(diagramId, diagram);
          if (ref && expandedService && expandedCompany) {
            ref.innerHTML = svg;
            companyRenderedRefs.current[key] = true;
          }
        }
      } catch (err: any) {
        console.error('Company diagram rendering error:', err);
        if (ref) {
          ref.innerHTML = `<div style="padding: 20px; color: #c33;">図のレンダリングに失敗しました: ${err.message}</div>`;
        }
      }
    };

    const diagramRef = companyDiagramRefs.current[diagramKey];
    
    // refが設定されるまで待つ
    if (!diagramRef) {
      // refがまだ設定されていない場合、少し待って再試行
      const checkRef = setTimeout(() => {
        const ref = companyDiagramRefs.current[diagramKey];
        if (ref && !companyRenderedRefs.current[diagramKey]) {
          renderDiagram(ref, diagramKey);
        }
      }, 100);
      return () => clearTimeout(checkRef);
    }

    // 既にレンダリング済みの場合はスキップ
    if (companyRenderedRefs.current[diagramKey]) return;

    // DOMの準備を待ってからレンダリング
    const timeoutId = setTimeout(() => {
      renderDiagram(diagramRef, diagramKey);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [mermaidLoaded, expandedService, expandedCompany]);

  // 獲得価値アーキテクチャ図をレンダリング
  useEffect(() => {
    if (!mermaidLoaded || !valueArchitectureRef.current || valueArchitectureRenderedRef.current) return;

    const renderValueArchitecture = async () => {
      try {
        const diagram = generateValueArchitectureDiagram();
        
        if (window.mermaid) {
          window.mermaid.initialize({ 
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
          });
          
          const { svg } = await window.mermaid.render('value-architecture-diagram', diagram);
          if (valueArchitectureRef.current) {
            valueArchitectureRef.current.innerHTML = svg;
            valueArchitectureRenderedRef.current = true;
          }
        }
      } catch (err: any) {
        console.error('Value architecture diagram rendering error:', err);
        if (valueArchitectureRef.current) {
          valueArchitectureRef.current.innerHTML = `<div style="padding: 20px; color: #c33;">図のレンダリングに失敗しました: ${err.message}</div>`;
        }
      }
    };

    renderValueArchitecture();
  }, [mermaidLoaded]);

  // Mermaid図をレンダリング
  useEffect(() => {
    if (!mermaidLoaded || !diagramRef.current || renderedRef.current) return;

    const renderDiagram = async () => {
      try {
        setError(null);
        const diagram = generateSynergyDiagram();
        
        if (window.mermaid) {
          window.mermaid.initialize({ 
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
          });
          
          const { svg } = await window.mermaid.render('synergy-diagram', diagram);
          if (diagramRef.current) {
            diagramRef.current.innerHTML = svg;
            setSvgContent(svg);
            renderedRef.current = true;
          }
        }
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        setError(`Mermaidのレンダリングに失敗しました: ${err.message}`);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = '';
        }
      }
    };

    renderDiagram();
  }, [mermaidLoaded]);

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
        伊藤忠シナジー
      </p>

      {/* 事業立ち上げによる獲得価値 */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>
          株式会社AIアシスタント設立・事業立ち上げによる獲得価値
        </h3>
        
        {/* 獲得価値アーキテクチャ図 */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
            獲得価値アーキテクチャ図
          </h4>
          <div 
            ref={valueArchitectureRef}
            style={{ 
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '600px',
              backgroundColor: '#fff',
              border: '1px solid var(--color-border-color)',
              borderRadius: '6px',
              padding: '16px',
              overflow: 'auto'
            }}
          />
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

        <div style={{ color: 'var(--color-text)', lineHeight: '1.8', fontSize: '14px' }}>
          {/* 定量面（プルダウン） */}
          <div style={{ marginBottom: '24px', border: '1px solid var(--color-border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              onClick={() => setExpandedQuantitative(!expandedQuantitative)}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: expandedQuantitative ? 'rgba(31, 41, 51, 0.05)' : 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                定量面（数値で測定可能な価値）
              </h4>
              <span style={{ fontSize: '18px', color: 'var(--color-text-light)' }}>
                {expandedQuantitative ? '−' : '+'}
              </span>
            </button>
            
            {expandedQuantitative && (
              <div style={{ padding: '16px', borderTop: '1px solid var(--color-border-color)', backgroundColor: '#fff' }}>
                <div style={{ paddingLeft: '11px' }}>
              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'rgba(31, 41, 51, 0.05)', borderRadius: '6px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                  1. 事業実績・売上
                </h5>
                <ul style={{ marginLeft: '20px', marginBottom: 0, lineHeight: '1.8' }}>
                  <li>パーソナルアプリのユーザー獲得数（個人・企業・自治体）</li>
                  <li>B2B契約数（企業契約・自治体契約）</li>
                  <li>プレミアムプラン加入者数</li>
                  <li>パートナー企業との連携件数</li>
                  <li>代行サービス（申請・保険・医療・認定取得）の取扱件数</li>
                  <li>売上高・利益率</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'rgba(31, 41, 51, 0.05)', borderRadius: '6px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                  2. ドッグフーディング案件の実績
                </h5>
                <ul style={{ marginLeft: '20px', marginBottom: 0, lineHeight: '1.8' }}>
                  <li>ドッグフーディング案件の実施件数</li>
                  <li>AI活用プロジェクトの成功件数</li>
                  <li>顧客満足度スコア（NPS等）</li>
                  <li>案件あたりの平均売上・利益</li>
                  <li>リピート率・継続率</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'rgba(31, 41, 51, 0.05)', borderRadius: '6px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                  3. データ・アセットの蓄積
                </h5>
                <ul style={{ marginLeft: '20px', marginBottom: 0, lineHeight: '1.8' }}>
                  <li>ユーザーデータの蓄積量（匿名化・プライバシー保護下）</li>
                  <li>AI学習データの量・質</li>
                  <li>業務プロセスデータの可視化件数</li>
                  <li>データ活用による改善効果の数値化</li>
                </ul>
              </div>

              <div style={{ padding: '16px', backgroundColor: 'rgba(31, 41, 51, 0.05)', borderRadius: '6px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                  4. 組織・人材の成長
                </h5>
                <ul style={{ marginLeft: '20px', marginBottom: 0, lineHeight: '1.8' }}>
                  <li>AI活用スキルを持つ人材の育成数</li>
                  <li>社内教育プログラムの受講者数・修了率</li>
                  <li>AI活用資格・認定の取得者数</li>
                  <li>社内AIプロジェクトの実施件数</li>
                </ul>
              </div>
                </div>
              </div>
            )}
          </div>

          {/* 定性面（プルダウン） */}
          <div style={{ marginBottom: '24px', border: '1px solid var(--color-border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              onClick={() => setExpandedQualitative(!expandedQualitative)}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: expandedQualitative ? 'rgba(31, 41, 51, 0.05)' : 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
                定性面（数値では測定困難だが重要な価値）
              </h4>
              <span style={{ fontSize: '18px', color: 'var(--color-text-light)' }}>
                {expandedQualitative ? '−' : '+'}
              </span>
            </button>
            
            {expandedQualitative && (
              <div style={{ padding: '16px', borderTop: '1px solid var(--color-border-color)', backgroundColor: '#fff' }}>
                <div style={{ paddingLeft: '11px' }}>
              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'rgba(31, 41, 51, 0.05)', borderRadius: '6px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                  1. AI活用ノウハウの蓄積
                </h5>
                <ul style={{ marginLeft: '20px', marginBottom: 0, lineHeight: '1.8' }}>
                  <li>AIモデル・Agent技術の実装ノウハウ</li>
                  <li>セキュリティ・データ・ガバナンスを考慮したAI活用のベストプラクティス</li>
                  <li>ドッグフーディング案件での課題解決ノウハウ</li>
                  <li>エンドユーザーとの接点を通じたAI活用の知見</li>
                  <li>業務コンサル事業への展開に必要な知識・スキル</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'rgba(31, 41, 51, 0.05)', borderRadius: '6px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                  2. プレイグラウンド機能の実現
                </h5>
                <ul style={{ marginLeft: '20px', marginBottom: 0, lineHeight: '1.8' }}>
                  <li>AI新規事業会社としての実績・信頼性の確立</li>
                  <li>実際のユーザーとの接点を通じた検証環境の構築</li>
                  <li>失敗を許容できる実験的取り組みの場の提供</li>
                  <li>新技術・新サービスの迅速な試行錯誤の実現</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'rgba(31, 41, 51, 0.05)', borderRadius: '6px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                  3. ブランディング・認知向上
                </h5>
                <ul style={{ marginLeft: '20px', marginBottom: 0, lineHeight: '1.8' }}>
                  <li>伊藤忠グループの「AIファーストカンパニー」への転換を示す象徴的取り組み</li>
                  <li>イノベーション企業としての認知向上</li>
                  <li>次世代技術への取り組み姿勢のアピール</li>
                  <li>パーソナルアプリという身近なサービスを通じたAI技術力の可視化</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'rgba(31, 41, 51, 0.05)', borderRadius: '6px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                  4. エリア2への成長基盤構築
                </h5>
                <ul style={{ marginLeft: '20px', marginBottom: 0, lineHeight: '1.8' }}>
                  <li>業務コンサル事業への展開基盤（セキュリティ・データ・ガバナンスを考慮した実績）</li>
                  <li>AI時代の保守運用体制の構築ノウハウ</li>
                  <li>保険ビジネスへの展開可能性</li>
                  <li>高マネタイズインパクト領域への成長への道筋</li>
                </ul>
              </div>

              <div style={{ padding: '16px', backgroundColor: 'rgba(31, 41, 51, 0.05)', borderRadius: '6px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                  5. グループ全体への波及効果
                </h5>
                <ul style={{ marginLeft: '20px', marginBottom: 0, lineHeight: '1.8' }}>
                  <li>グループ会社間の連携強化の実証</li>
                  <li>グループ全体のAI活用能力向上への貢献</li>
                  <li>組織内でのAI技術の展開・横展開の基盤</li>
                  <li>グループ全体の競争力強化への貢献</li>
                </ul>
              </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* グループシナジー図 */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>
          グループシナジー全体図
        </h3>
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
          style={{ 
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            backgroundColor: '#fff'
          }}
        />
        {!mermaidLoaded && !error && (
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

      {/* 4つの事業企画ごとのグループ会社とのシナジー */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>
          4つの事業企画ごとのグループ会社とのシナジー
        </h3>
        <div style={{ color: 'var(--color-text)', fontSize: '14px' }}>
          {BUSINESS_SYNERGIES.map((businessSynergy, serviceIndex) => (
            <div 
              key={serviceIndex}
              style={{ 
                marginBottom: '24px',
                border: '1px solid var(--color-border-color)',
                borderRadius: '6px',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() => setExpandedService(expandedService === businessSynergy.serviceId ? null : businessSynergy.serviceId)}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: expandedService === businessSynergy.serviceId ? 'rgba(31, 41, 51, 0.05)' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.2s'
                }}
              >
                <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
                  {businessSynergy.serviceName}
                </h4>
                <span style={{ fontSize: '18px', color: 'var(--color-text-light)' }}>
                  {expandedService === businessSynergy.serviceId ? '−' : '+'}
                </span>
              </button>
              
              {expandedService === businessSynergy.serviceId && (
                <div style={{ padding: '16px', borderTop: '1px solid var(--color-border-color)', backgroundColor: '#fff' }}>
                  {businessSynergy.companies.map((company, companyIndex) => {
                    const companyKey = `${businessSynergy.serviceId}-${company.companyName}`;
                    return (
                      <div 
                        key={companyIndex}
                        style={{ 
                          marginBottom: companyIndex < businessSynergy.companies.length - 1 ? '24px' : 0,
                          border: '1px solid var(--color-border-color)',
                          borderRadius: '6px',
                          overflow: 'hidden'
                        }}
                      >
                        <button
                          onClick={() => {
                            setExpandedCompany(expandedCompany === companyKey ? null : companyKey);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: expandedCompany === companyKey ? 'rgba(31, 41, 51, 0.03)' : 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <div>
                            <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>
                              {company.companyName}
                            </h5>
                          </div>
                          <span style={{ fontSize: '16px', color: 'var(--color-text-light)' }}>
                            {expandedCompany === companyKey ? '−' : '+'}
                          </span>
                        </button>
                        
                        {expandedCompany === companyKey && (
                          <div style={{ padding: '16px', borderTop: '1px solid var(--color-border-color)', backgroundColor: '#fff' }}>
                            {/* SOW関係性図 */}
                            <div style={{ marginBottom: '24px' }}>
                              <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                                SOW関係性図（シーケンス図）
                              </h6>
                              <div 
                                ref={(el) => {
                                  if (el) {
                                    companyDiagramRefs.current[companyKey] = el;
                                    // refが設定されたら、レンダリング状態をリセットして再レンダリングを促す
                                    if (expandedService === businessSynergy.serviceId && expandedCompany === companyKey) {
                                      // レンダリング状態をリセット
                                      companyRenderedRefs.current[companyKey] = false;
                                      // 次のレンダリングサイクルでuseEffectが実行されるようにする
                                      setTimeout(() => {
                                        if (mermaidLoaded && expandedService === businessSynergy.serviceId && expandedCompany === companyKey) {
                                          const renderDiagram = async () => {
                                            try {
                                              const diagram = generateCompanySOWDiagram(businessSynergy.serviceId, company.companyName);
                                              if (!diagram) return;

                                              if (window.mermaid) {
                                                el.innerHTML = '';
                                                const diagramId = `company-diagram-${companyKey.replace(/\s/g, '-')}-${Date.now()}`;
                                                const { svg } = await window.mermaid.render(diagramId, diagram);
                                                el.innerHTML = svg;
                                                companyRenderedRefs.current[companyKey] = true;
                                              }
                                            } catch (err: any) {
                                              console.error('Company diagram rendering error:', err);
                                              el.innerHTML = `<div style="padding: 20px; color: #c33;">図のレンダリングに失敗しました: ${err.message}</div>`;
                                            }
                                          };
                                          renderDiagram();
                                        }
                                      }, 100);
                                    }
                                  } else {
                                    // 要素が削除されたときはレンダリング状態をクリア
                                    if (companyDiagramRefs.current[companyKey]) {
                                      delete companyRenderedRefs.current[companyKey];
                                    }
                                  }
                                }}
                                style={{ 
                                  width: '100%',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  minHeight: '300px',
                                  backgroundColor: '#fff',
                                  border: '1px solid var(--color-border-color)',
                                  borderRadius: '6px',
                                  padding: '16px',
                                  overflow: 'auto'
                                }}
                              >
                                {!mermaidLoaded && (
                                  <div style={{ 
                                    padding: '20px', 
                                    textAlign: 'center', 
                                    color: 'var(--color-text-light)',
                                    fontSize: '13px'
                                  }}>
                                    Mermaidを読み込み中...
                                  </div>
                                )}
                                {mermaidLoaded && expandedService === businessSynergy.serviceId && expandedCompany === companyKey && !companyRenderedRefs.current[companyKey] && (
                                  <div style={{ 
                                    padding: '20px', 
                                    textAlign: 'center', 
                                    color: 'var(--color-text-light)',
                                    fontSize: '13px'
                                  }}>
                                    図をレンダリング中...
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                              <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                                シナジー効果
                              </h6>
                              <ul style={{ marginLeft: '20px', marginBottom: 0, lineHeight: '1.8', fontSize: '13px' }}>
                                {company.synergy.map((item, i) => (
                                  <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div style={{ marginBottom: '16px' }}>
                              <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                                具体的な連携内容
                              </h6>
                              <ul style={{ marginLeft: '20px', marginBottom: 0, lineHeight: '1.8', fontSize: '13px' }}>
                                {company.collaboration.map((item, i) => (
                                  <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h6 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                                戦略的価値
                              </h6>
                              <p style={{ margin: 0, lineHeight: '1.8', paddingLeft: '8px', borderLeft: '2px solid var(--color-primary)', fontSize: '13px' }}>
                                {company.strategicValue}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 旧構造（後方互換性のため残す） */}
      <div className="card" style={{ marginBottom: '24px', display: 'none' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>
          グループ会社とのシナジー（旧構造）
        </h3>
        <div style={{ color: 'var(--color-text)', fontSize: '14px' }}>
          {GROUP_COMPANIES.map((company, index) => (
            <div 
              key={index}
              style={{ 
                marginBottom: '24px',
                border: '1px solid var(--color-border-color)',
                borderRadius: '6px',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() => setExpandedCompany(expandedCompany === company.name ? null : company.name)}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: expandedCompany === company.name ? 'rgba(31, 41, 51, 0.05)' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.2s'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text)' }}>
                    {company.name}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-light)', margin: 0 }}>
                    {company.business}
                  </p>
                </div>
                <span style={{ fontSize: '18px', color: 'var(--color-text-light)' }}>
                  {expandedCompany === company.name ? '−' : '+'}
                </span>
              </button>
              
              {expandedCompany === company.name && (
                <div style={{ padding: '16px', borderTop: '1px solid var(--color-border-color)', backgroundColor: '#fff' }}>
                  {/* SOW関係性図 */}
                  <div style={{ marginBottom: '24px' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
                      SOW関係性図（シーケンス図）
                    </h5>
                    <div 
                      ref={(el) => {
                        if (el) {
                          companyDiagramRefs.current[company.name] = el;
                          // レンダリング状態をリセットして再レンダリングを促す
                          if (expandedCompany === company.name) {
                            companyRenderedRefs.current[company.name] = false;
                          }
                        } else {
                          // 要素が削除されたときはレンダリング状態をクリア
                          if (companyDiagramRefs.current[company.name]) {
                            delete companyRenderedRefs.current[company.name];
                          }
                        }
                      }}
                      style={{ 
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '300px',
                        backgroundColor: '#fff',
                        border: '1px solid var(--color-border-color)',
                        borderRadius: '6px',
                        padding: '16px',
                        overflow: 'auto'
                      }}
                    >
                      {!mermaidLoaded && (
                        <div style={{ 
                          padding: '20px', 
                          textAlign: 'center', 
                          color: 'var(--color-text-light)',
                          fontSize: '13px'
                        }}>
                          Mermaidを読み込み中...
                        </div>
                      )}
                      {mermaidLoaded && expandedCompany === company.name && !companyRenderedRefs.current[company.name] && (
                        <div style={{ 
                          padding: '20px', 
                          textAlign: 'center', 
                          color: 'var(--color-text-light)',
                          fontSize: '13px'
                        }}>
                          図をレンダリング中...
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                      シナジー効果
                    </h5>
                    <ul style={{ marginLeft: '20px', marginBottom: 0, lineHeight: '1.8' }}>
                      {company.synergy.map((item, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                      具体的な連携内容
                    </h5>
                    <ul style={{ marginLeft: '20px', marginBottom: 0, lineHeight: '1.8' }}>
                      {company.collaboration.map((item, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
                      戦略的価値
                    </h5>
                    <p style={{ margin: 0, lineHeight: '1.8', paddingLeft: '8px', borderLeft: '2px solid var(--color-primary)' }}>
                      {company.strategicValue}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 戦略的重要性 */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>
          戦略的重要性
        </h3>
        <div style={{ color: 'var(--color-text)', lineHeight: '1.8', fontSize: '14px' }}>
          <div style={{ marginBottom: '24px', paddingLeft: '11px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
              1. AI事業戦略の実現基盤
            </h4>
            <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
              本事業は、情報・通信部門がAI事業戦略を推進する上での「プレイグラウンド」として機能します。実際のユーザーとの接点を通じて、AI活用のノウハウを蓄積し、セキュリティ・データ・ガバナンスを考慮した業務コンサル事業への展開基盤を構築します。
            </p>
          </div>

          <div style={{ marginBottom: '24px', paddingLeft: '11px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
              2. グループ全体のAI活用促進
            </h4>
            <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
              各グループ会社との連携により、AI技術の組織内展開を加速させます。本事業で得られた知見は、グループ全体のAI活用能力向上に貢献し、伊藤忠グループ全体の競争力強化につながります。
            </p>
          </div>

          <div style={{ marginBottom: '24px', paddingLeft: '11px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '8px' }}>
              3. マネタイズ領域への成長
            </h4>
            <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
              エリア1での実績創出とノウハウ獲得により、エリア2（高マネタイズインパクト）への成長が期待されます。ダイナミックな組織再編と連携により、AI時代の保守運用や業務コンサル・保険ビジネスの体制強化を実現します。
            </p>
          </div>
        </div>
      </div>

      {/* ブランディング効果 */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>
          ブランディング効果
        </h3>
        <div style={{ color: 'var(--color-text)', lineHeight: '1.8', fontSize: '14px' }}>
          <div style={{ marginBottom: '16px', paddingLeft: '11px' }}>
            <p style={{ marginBottom: '12px', paddingLeft: '11px' }}>
              本事業は、伊藤忠グループの「AIファーストカンパニー」への転換を示す象徴的な取り組みとして機能します。パーソナルアプリという身近なサービスを通じて、伊藤忠グループのAI活用能力とイノベーション力を社会に示すことができます。
            </p>
          </div>
          
          <div style={{ padding: '16px', backgroundColor: 'rgba(31, 41, 51, 0.05)', borderRadius: '6px', paddingLeft: '11px' }}>
            <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
              期待されるブランディング効果：
            </h5>
            <ul style={{ marginLeft: '20px', marginBottom: 0, paddingLeft: '11px' }}>
              <li>伊藤忠グループのAI技術力の可視化</li>
              <li>イノベーション企業としての認知向上</li>
              <li>グループ会社間の連携強化の実証</li>
              <li>次世代技術への取り組み姿勢のアピール</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

