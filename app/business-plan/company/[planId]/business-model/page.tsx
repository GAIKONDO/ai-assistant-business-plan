'use client';

import { useEffect, useState, useRef } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    mermaid?: any;
  }
}

const SERVICE_NAMES: { [key: string]: string } = {
  'own-service': '自社開発・自社サービス事業',
  'education-training': 'AI導入ルール設計・人材育成・教育事業',
  'consulting': 'プロセス可視化・業務コンサル事業',
  'ai-dx': 'AI駆動開発・DX支援SI事業',
};

// 各事業企画ごとの伊藤忠グループ企業
const GROUP_COMPANIES_BY_SERVICE: { [key: string]: string[] } = {
  'own-service': ['ベルシステム24', '伊藤忠テクノソリューションズ', '伊藤忠インタラクティブ', 'GIクラウド', 'I&B'],
  'education-training': ['ベルシステム24', 'I&B', '辻本郷itコンサル'],
  'consulting': ['シグマクシス', '辻本郷itコンサル', 'GIクラウド'],
  'ai-dx': ['シグマクシス', 'GIクラウド', '辻本郷itコンサル'],
};

type ServiceId = 'own-service' | 'education-training' | 'consulting' | 'ai-dx';

export default function BusinessModelPage() {
  const [selectedService, setSelectedService] = useState<ServiceId>('own-service');
  const [isDetailed, setIsDetailed] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const initializedRef = useRef(false);
  const renderedRef = useRef<{ [key: string]: { [key: string]: boolean } }>({});

  // コンポーネントがマウントされた際に状態をリセット
  useEffect(() => {
    setSvgContent('');
    setError(null);
    setIsRendering(false);
    renderedRef.current = {};
    
    // Mermaidが既に読み込まれているかチェック
    if (typeof window !== 'undefined' && window.mermaid) {
      setMermaidLoaded(true);
    }
  }, []);

  // 選択されたサービスまたは詳細/簡素が変更されたときに図を再レンダリング
  useEffect(() => {
    if (mermaidLoaded && diagramRef.current) {
      if (!renderedRef.current[selectedService]) {
        renderedRef.current[selectedService] = {};
      }
      renderedRef.current[selectedService][isDetailed ? 'detailed' : 'simple'] = false;
      setSvgContent('');
      setError(null);
    }
  }, [selectedService, isDetailed, mermaidLoaded]);

  // 自社開発・自社サービス事業のMermaid図を生成（簡素版）
  const generateOwnServiceDiagramSimple = () => {
    let diagram = 'graph LR\n';
    diagram += '    direction LR\n';
    diagram += '    classDef partnerClass fill:#FFB6C1,stroke:#FF69B4,stroke-width:2px,color:#000\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff\n';
    diagram += '    classDef userClass fill:#90EE90,stroke:#32CD32,stroke-width:2px,color:#000\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:2px,color:#000\n';
    diagram += '    classDef paymentClass fill:#90EE90,stroke:#32CD32,stroke-width:3px,color:#000\n\n';
    
    diagram += '    P["パートナー企業<br/>広告費・紹介手数料等"]\n';
    diagram += '    C["株式会社AIアシスタント<br/>出産支援パーソナルアプリ提供"]\n';
    diagram += '    U1["個人ユーザー<br/>プレミアムプラン<br/>月額/年額"]\n';
    diagram += '    U2["エンドユーザー<br/>無料で利用"]\n';
    diagram += '    E["企業<br/>従業員向け福利厚生<br/>企業契約"]\n';
    diagram += '    E2["企業の従業員<br/>エンドユーザー"]\n';
    diagram += '    G["自治体<br/>住民向けサービス<br/>自治体契約"]\n';
    diagram += '    G2["自治体の住民<br/>エンドユーザー"]\n';
    diagram += '    A["認定取得支援<br/>くるみん認定取得支援<br/>健康経営優良法人認定取得<br/>企業向け"]\n\n';
    
    diagram += '    P ==>|💰 広告費・紹介手数料<br/>代行手数料・リファラル手数料<br/>マッチング手数料| C\n';
    diagram += '    C -->|直接提供| U1\n';
    diagram += '    C -->|直接提供| U2\n';
    diagram += '    C -->|B2B提供| E\n';
    diagram += '    C -->|B2B提供| G\n';
    diagram += '    C -->|認定取得支援サービス提供| A\n\n';
    
    diagram += '    U1 ==>|💰 月額/年額| C\n';
    diagram += '    E ==>|💰 企業契約| C\n';
    diagram += '    E -->|提供| E2\n';
    diagram += '    G ==>|💰 自治体契約| C\n';
    diagram += '    G -->|提供| G2\n';
    diagram += '    A ==>|💰 認定取得支援手数料| C\n\n';
    
    diagram += '    class P partnerClass\n';
    diagram += '    class C companyClass\n';
    diagram += '    class U1 paymentClass\n';
    diagram += '    class E paymentClass\n';
    diagram += '    class G paymentClass\n';
    diagram += '    class A paymentClass\n';
    diagram += '    class U2,E2,G2 userClass\n';
    
    return diagram;
  };

  // 自社開発・自社サービス事業のMermaid図を生成（詳細版）
  const generateOwnServiceDiagram = () => {
    let diagram = 'graph LR\n';
    diagram += '    direction LR\n';
    diagram += '    classDef partnerClass fill:#FFB6C1,stroke:#FF69B4,stroke-width:2px,color:#000\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff\n';
    diagram += '    classDef userClass fill:#90EE90,stroke:#32CD32,stroke-width:2px,color:#000\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:2px,color:#000\n';
    diagram += '    classDef serviceClass fill:#E6F2FF,stroke:#6495ED,stroke-width:2px,color:#000\n';
    diagram += '    classDef paymentClass fill:#90EE90,stroke:#32CD32,stroke-width:3px,color:#000\n\n';
    
    diagram += '    subgraph Partners["パートナー企業"]\n';
    diagram += '        A1["広告主企業<br/>広告費"]\n';
    diagram += '        A2["知育・塾パートナー<br/>教育サービス<br/>紹介手数料"]\n';
    diagram += '        A3["保険パートナー<br/>乳児・児童保険<br/>学生保険<br/>学業費用保険<br/>紹介手数料・代行手数料"]\n';
    diagram += '        A4["医療・ヘルスケアパートナー<br/>薬・予防接種<br/>遺伝子検査<br/>アレルギー検査<br/>紹介手数料・代行手数料"]\n';
    diagram += '        A5["ECリファラル<br/>アフィリエイト<br/>商品紹介<br/>リファラル手数料"]\n';
    diagram += '        A6["家政婦・専門教師<br/>マッチング<br/>サービス提供者<br/>マッチング手数料"]\n';
    diagram += '        A7["リフォームパートナー<br/>子育て対応リフォーム<br/>業者紹介斡旋<br/>デザイン相談<br/>紹介手数料"]\n';
    diagram += '        A8["アルバム制作パートナー<br/>アルバム制作サービス<br/>紹介手数料"]\n';
    diagram += '    end\n\n';
    
    diagram += '    Company["株式会社AIアシスタント<br/>運営会社<br/>━━━━━━━━━━━━━━━━<br/>出産支援パーソナルアプリ提供<br/>プラットフォーム運営<br/>AIアシスタントによる伴走型育児支援・アドバイス"]\n';
    diagram += '    class Company companyClass\n\n';
    
    diagram += '    subgraph Users["ユーザー・クライアント"]\n';
    diagram += '        U1["個人ユーザー<br/>プレミアムプラン<br/>月額/年額"]\n';
    diagram += '        U2["エンドユーザー<br/>無料で利用"]\n';
    diagram += '        U3["企業<br/>従業員向け福利厚生<br/>カスタマイズ対応<br/>━━━━━━━━━━━━━━━━<br/>企業契約<br/>月額従業員1人あたり500円<br/>従業員数ベース"]\n';
    diagram += '        U4["企業の従業員<br/>エンドユーザー"]\n';
    diagram += '        U5["自治体<br/>住民向けサービス<br/>自治体ロゴ・カスタマイズ<br/>━━━━━━━━━━━━━━━━<br/>自治体契約<br/>月額利用者1人あたり300円<br/>利用者数ベース"]\n';
    diagram += '        U6["自治体の住民<br/>エンドユーザー"]\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph Services["代行サービス"]\n';
    diagram += '        S1["申請代行サービス<br/>自治体・企業向け<br/>━━━━━━━━━━━━━━━━<br/>書類作成・提出代行<br/>1件あたり3,000円~<br/>代行手数料 成功報酬型"]\n';
    diagram += '        S2["保険代行サービス<br/>━━━━━━━━━━━━━━━━<br/>保険加入手続き代行<br/>保険申請・手続き代行<br/>1件あたり5,000円~<br/>代行手数料 成功報酬型"]\n';
    diagram += '        S3["医療サービス代行<br/>━━━━━━━━━━━━━━━━<br/>薬・検査の紹介・手続き代行<br/>医療機関連携・手続き代行<br/>1件あたり4,000円~<br/>代行手数料 成功報酬型"]\n';
    diagram += '        S4["認定取得支援<br/>企業向け<br/>━━━━━━━━━━━━━━━━<br/>くるみん認定取得支援<br/>次世代育成支援対策推進法に基づく認定マーク<br/>健康経営優良法人認定取得支援<br/>認定取得支援手数料<br/>1件あたり100,000円"]\n';
    diagram += '    end\n\n';
    
    diagram += '    A1 ==>|💰 広告費| Company\n';
    diagram += '    A2 ==>|💰 紹介手数料| Company\n';
    diagram += '    A3 ==>|💰 紹介手数料・代行手数料| Company\n';
    diagram += '    A4 ==>|💰 紹介手数料・代行手数料| Company\n';
    diagram += '    A5 ==>|💰 リファラル手数料| Company\n';
    diagram += '    A6 ==>|💰 マッチング手数料| Company\n';
    diagram += '    A7 ==>|💰 紹介手数料| Company\n';
    diagram += '    A8 ==>|💰 紹介手数料| Company\n\n';
    
    diagram += '    Company -->|直接提供| U1\n';
    diagram += '    Company -->|直接提供| U2\n';
    diagram += '    Company -->|B2B提供<br/>福利厚生として提供| U3\n';
    diagram += '    Company -->|B2B提供<br/>住民サービスとして提供| U5\n';
    diagram += '    Company -->|申請代行サービス提供| S1\n';
    diagram += '    Company -->|保険代行サービス提供| S2\n';
    diagram += '    Company -->|医療サービス代行提供| S3\n';
    diagram += '    Company -->|認定取得支援サービス提供| S4\n\n';
    
    diagram += '    U1 ==>|💰 月額/年額| Company\n';
    diagram += '    U3 ==>|💰 企業契約<br/>月額従業員1人あたり500円<br/>従業員数ベース| Company\n';
    diagram += '    U5 ==>|💰 自治体契約<br/>月額利用者1人あたり300円<br/>利用者数ベース| Company\n';
    diagram += '    S1 ==>|💰 代行手数料<br/>成功報酬型<br/>1件あたり3,000円~| Company\n';
    diagram += '    S2 ==>|💰 代行手数料<br/>成功報酬型<br/>1件あたり5,000円~| Company\n';
    diagram += '    S3 ==>|💰 代行手数料<br/>成功報酬型<br/>1件あたり4,000円~| Company\n';
    diagram += '    S4 ==>|💰 認定取得支援手数料<br/>1件あたり100,000円| Company\n\n';
    
    diagram += '    U3 -->|提供| U4\n';
    diagram += '    U5 -->|提供| U6\n';
    diagram += '    U3 -->|申請代行サービス利用| S1\n';
    diagram += '    U5 -->|申請代行サービス利用| S1\n';
    diagram += '    U3 -->|保険代行サービス利用| S2\n';
    diagram += '    U5 -->|保険代行サービス利用| S2\n';
    diagram += '    U3 -->|医療サービス代行利用| S3\n';
    diagram += '    U5 -->|医療サービス代行利用| S3\n';
    diagram += '    U3 -->|認定取得支援利用| S4\n\n';
    
    diagram += '    class A1,A2,A3,A4,A5,A6,A7,A8 partnerClass\n';
    diagram += '    class U1,U3,U5 paymentClass\n';
    diagram += '    class U2,U4,U6 userClass\n';
    diagram += '    class S1,S2,S3,S4 paymentClass\n';
    
    return diagram;
  };

  // AI導入ルール設計・人材育成・教育事業のMermaid図を生成（簡素版）
  const generateEducationTrainingDiagramSimple = () => {
    let diagram = 'graph LR\n';
    diagram += '    direction LR\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:2px,color:#fff\n';
    diagram += '    classDef groupClass fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:1px,color:#000\n';
    diagram += '    classDef paymentClass fill:#90EE90,stroke:#32CD32,stroke-width:3px,color:#000\n';
    diagram += '    classDef endUserClass fill:#E6F2FF,stroke:#6495ED,stroke-width:1px,color:#000\n\n';
    
    diagram += '    Group["伊藤忠G"]\n';
    diagram += '    Company["株式会社AIアシスタント<br/>AI導入ルール設計・人材育成・教育事業"]\n';
    
    diagram += '    subgraph ClientArea["顧客企業"]\n';
    diagram += '        Management["経営層・人事部門<br/>契約料金"]\n';
    diagram += '        BusinessDept["業務部門<br/>営業部門・職能部門"]\n';
    diagram += '        SystemDept["システム部門"]\n';
    diagram += '        EndUsers["エンドユーザー<br/>従業員・利用者"]\n';
    diagram += '    end\n\n';
    
    diagram += '    Group -.->|連携・サポート↓| Company\n';
    diagram += '    Company -.->|サービス提供↑| Group\n';
    diagram += '    Company -->|AI導入ルール設計・人材育成・教育事業| Management\n';
    diagram += '    Company -->|AI導入ルール設計・人材育成・教育事業| BusinessDept\n';
    diagram += '    Management ==>|💰 契約料金| Company\n';
    diagram += '    Management -->|教育・研修| BusinessDept\n';
    diagram += '    Management -->|教育・研修| EndUsers\n';
    diagram += '    BusinessDept -->|ルール設計・ガバナンス| EndUsers\n';
    diagram += '    Management -->|ルール設計・ガバナンス| SystemDept\n';
    diagram += '    SystemDept -->|ルール設計・ガバナンス| EndUsers\n';
    diagram += '    SystemDept -->|ルール設計・ガバナンス| BusinessDept\n';
    diagram += '    SystemDept -->|ルール設計・ガバナンス| Management\n\n';
    
    diagram += '    class Group groupClass\n';
    diagram += '    class Company companyClass\n';
    diagram += '    class Management paymentClass\n';
    diagram += '    class BusinessDept,SystemDept,EndUsers clientClass\n';
    
    return diagram;
  };

  // AI導入ルール設計・人材育成・教育事業のMermaid図を生成（詳細版）
  const generateEducationTrainingDiagram = () => {
    const groupCompanies = GROUP_COMPANIES_BY_SERVICE['education-training'] || [];
    let diagram = 'graph LR\n';
    diagram += '    direction LR\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff\n';
    diagram += '    classDef groupClass fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:2px,color:#000\n';
    diagram += '    classDef paymentClass fill:#90EE90,stroke:#32CD32,stroke-width:3px,color:#000\n';
    diagram += '    classDef endUserClass fill:#E6F2FF,stroke:#6495ED,stroke-width:1px,color:#000\n\n';
    
    if (groupCompanies.length > 0) {
      diagram += '    subgraph Group["伊藤忠グループ企業"]\n';
      groupCompanies.forEach((company, index) => {
        diagram += `        G${index + 1}["${company}"]\n`;
      });
      diagram += '    end\n\n';
    }
    
    diagram += '    Company["株式会社AIアシスタント<br/>AI導入ルール設計・人材育成・教育事業"]\n';
    diagram += '    class Company companyClass\n\n';
    
    diagram += '    subgraph Clients["顧客企業"]\n';
    diagram += '        C1["経営層・人事部門<br/>契約料金"]\n';
    diagram += '        C2["業務部門<br/>営業部門・職能部門"]\n';
    diagram += '        C3["システム部門"]\n';
    diagram += '        E1["エンドユーザー<br/>従業員・利用者"]\n';
    diagram += '    end\n\n';
    
    if (groupCompanies.length > 0) {
      groupCompanies.forEach((company, index) => {
        diagram += `    G${index + 1} -.->|連携・サポート↓| Company\n`;
        diagram += `    Company -.->|サービス提供↑| G${index + 1}\n`;
      });
      diagram += '\n';
    }
    
    diagram += '    Company -->|AI導入ルール設計・人材育成・教育事業| C1\n';
    diagram += '    Company -->|AI導入ルール設計・人材育成・教育事業| C2\n';
    diagram += '    C1 ==>|💰 契約料金| Company\n';
    diagram += '    C1 -->|教育・研修| C2\n';
    diagram += '    C1 -->|教育・研修| E1\n';
    diagram += '    C2 -->|ルール設計・ガバナンス| E1\n';
    diagram += '    C1 -->|ルール設計・ガバナンス| C3\n';
    diagram += '    C3 -->|ルール設計・ガバナンス| E1\n';
    diagram += '    C3 -->|ルール設計・ガバナンス| C2\n';
    diagram += '    C3 -->|ルール設計・ガバナンス| C1\n\n';
    
    if (groupCompanies.length > 0) {
      groupCompanies.forEach((company, index) => {
        diagram += `    class G${index + 1} groupClass\n`;
      });
      diagram += '\n';
    }
    diagram += '    class C1 paymentClass\n';
    diagram += '    class C2,C3,E1 clientClass\n';
    
    return diagram;
  };

  // プロセス可視化・業務コンサル事業のMermaid図を生成（簡素版）
  const generateConsultingDiagramSimple = () => {
    let diagram = 'graph LR\n';
    diagram += '    direction LR\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:2px,color:#fff\n';
    diagram += '    classDef groupClass fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:1px,color:#000\n';
    diagram += '    classDef paymentClass fill:#90EE90,stroke:#32CD32,stroke-width:3px,color:#000\n\n';
    
    diagram += '    Group["伊藤忠G"]\n';
    diagram += '    Company["株式会社AIアシスタント<br/>プロセス可視化・業務コンサル事業"]\n';
    
    diagram += '    subgraph ClientArea["顧客企業"]\n';
    diagram += '        EndUsers["エンドユーザー<br/>従業員・利用者"]\n';
    diagram += '        Management["経営層"]\n';
    diagram += '        BusinessDept["業務部門<br/>営業部門・職能部門"]\n';
    diagram += '        SystemDept["システム部門"]\n';
    diagram += '    end\n\n';
    
    diagram += '    Group -.->|連携・サポート↓| Company\n';
    diagram += '    Company -.->|サービス提供↑| Group\n';
    diagram += '    EndUsers -->|課題相談・課題共有| SystemDept\n';
    diagram += '    EndUsers -->|課題相談・課題共有| BusinessDept\n';
    diagram += '    EndUsers -->|課題相談・課題共有| Management\n';
    diagram += '    Company -->|プロセス可視化・業務コンサル事業| Management\n';
    diagram += '    Company -->|プロセス可視化・業務コンサル事業| BusinessDept\n';
    diagram += '    Company -->|プロセス可視化・業務コンサル事業| SystemDept\n';
    diagram += '    Management ==>|💰 コンサルティング料金| Company\n';
    diagram += '    BusinessDept ==>|💰 コンサルティング料金| Company\n';
    diagram += '    SystemDept ==>|💰 コンサルティング料金| Company\n\n';
    
    diagram += '    class Group groupClass\n';
    diagram += '    class Company companyClass\n';
    diagram += '    class Management,BusinessDept,SystemDept paymentClass\n';
    diagram += '    class EndUsers clientClass\n';
    
    return diagram;
  };

  // プロセス可視化・業務コンサル事業のMermaid図を生成（詳細版）
  const generateConsultingDiagram = () => {
    const groupCompanies = GROUP_COMPANIES_BY_SERVICE['consulting'] || [];
    let diagram = 'graph LR\n';
    diagram += '    direction LR\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff\n';
    diagram += '    classDef groupClass fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:2px,color:#000\n';
    diagram += '    classDef paymentClass fill:#90EE90,stroke:#32CD32,stroke-width:3px,color:#000\n\n';
    
    if (groupCompanies.length > 0) {
      diagram += '    subgraph Group["伊藤忠グループ企業"]\n';
      groupCompanies.forEach((company, index) => {
        diagram += `        G${index + 1}["${company}"]\n`;
      });
      diagram += '    end\n\n';
    }
    
    diagram += '    Company["株式会社AIアシスタント<br/>プロセス可視化・業務コンサル事業"]\n';
    diagram += '    class Company companyClass\n\n';
    
    diagram += '    subgraph Clients["顧客企業"]\n';
    diagram += '        E1["エンドユーザー<br/>従業員・利用者"]\n';
    diagram += '        C1["経営層<br/>コンサルティング料金"]\n';
    diagram += '        C2["業務部門<br/>営業部門・職能部門<br/>コンサルティング料金"]\n';
    diagram += '        C3["システム部門<br/>コンサルティング料金"]\n';
    diagram += '    end\n\n';
    
    if (groupCompanies.length > 0) {
      groupCompanies.forEach((company, index) => {
        diagram += `    G${index + 1} -.->|連携・サポート↓| Company\n`;
        diagram += `    Company -.->|サービス提供↑| G${index + 1}\n`;
      });
      diagram += '\n';
    }
    
    diagram += '    E1 -->|課題相談・課題共有| C3\n';
    diagram += '    E1 -->|課題相談・課題共有| C2\n';
    diagram += '    E1 -->|課題相談・課題共有| C1\n';
    diagram += '    Company -->|プロセス可視化・業務コンサル事業| C1\n';
    diagram += '    Company -->|プロセス可視化・業務コンサル事業| C2\n';
    diagram += '    Company -->|プロセス可視化・業務コンサル事業| C3\n';
    diagram += '    C1 ==>|💰 コンサルティング料金| Company\n';
    diagram += '    C2 ==>|💰 コンサルティング料金| Company\n';
    diagram += '    C3 ==>|💰 コンサルティング料金| Company\n\n';
    
    if (groupCompanies.length > 0) {
      groupCompanies.forEach((company, index) => {
        diagram += `    class G${index + 1} groupClass\n`;
      });
      diagram += '\n';
    }
    diagram += '    class C1,C2,C3 paymentClass\n';
    diagram += '    class E1 clientClass\n';
    
    return diagram;
  };

  // AI駆動開発・DX支援SI事業のMermaid図を生成（簡素版）
  const generateAiDxDiagramSimple = () => {
    let diagram = 'graph LR\n';
    diagram += '    direction LR\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:2px,color:#fff\n';
    diagram += '    classDef groupClass fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:1px,color:#000\n';
    diagram += '    classDef serviceClass fill:#90EE90,stroke:#32CD32,stroke-width:1px,color:#000\n';
    diagram += '    classDef paymentClass fill:#90EE90,stroke:#32CD32,stroke-width:3px,color:#000\n';
    diagram += '    classDef endUserClass fill:#E6F2FF,stroke:#6495ED,stroke-width:1px,color:#000\n\n';
    
    diagram += '    Group["伊藤忠G"]\n';
    diagram += '    Company["株式会社AIアシスタント<br/>AI駆動開発・DX支援SI事業"]\n';
    diagram += '    Services["提供サービス<br/>AIシステム開発・導入"]\n';
    diagram += '    Clients["顧客企業<br/>システム部門"]\n';
    diagram += '    EndUsers["エンドユーザー<br/>従業員"]\n\n';
    
    diagram += '    Group -.->|連携・サポート↓| Company\n';
    diagram += '    Company -.->|サービス提供↑| Group\n';
    diagram += '    Company -->|サービス提供| Services\n';
    diagram += '    Services -->|システム導入| Clients\n';
    diagram += '    Clients ==>|💰 開発・導入費用| Company\n';
    diagram += '    Clients -->|システム導入・運用| EndUsers\n\n';
    
    diagram += '    class Group groupClass\n';
    diagram += '    class Company companyClass\n';
    diagram += '    class Clients paymentClass\n';
    diagram += '    class Services serviceClass\n';
    diagram += '    class EndUsers endUserClass\n';
    
    return diagram;
  };

  // AI駆動開発・DX支援SI事業のMermaid図を生成（詳細版）
  const generateAiDxDiagram = () => {
    const groupCompanies = GROUP_COMPANIES_BY_SERVICE['ai-dx'] || [];
    let diagram = 'graph LR\n';
    diagram += '    direction LR\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff\n';
    diagram += '    classDef groupClass fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:2px,color:#000\n';
    diagram += '    classDef serviceClass fill:#90EE90,stroke:#32CD32,stroke-width:2px,color:#000\n';
    diagram += '    classDef paymentClass fill:#90EE90,stroke:#32CD32,stroke-width:3px,color:#000\n';
    diagram += '    classDef endUserClass fill:#E6F2FF,stroke:#6495ED,stroke-width:1px,color:#000\n\n';
    
    if (groupCompanies.length > 0) {
      diagram += '    subgraph Group["伊藤忠グループ企業"]\n';
      groupCompanies.forEach((company, index) => {
        diagram += `        G${index + 1}["${company}"]\n`;
      });
    diagram += '    end\n\n';
    }
    
    diagram += '    Company["株式会社AIアシスタント<br/>AI駆動開発・DX支援SI事業"]\n';
    diagram += '    class Company companyClass\n\n';
    
    diagram += '    subgraph Services["提供サービス"]\n';
    diagram += '        S1["AI活用アーキテクチャ導入<br/>カスタムAIシステム開発"]\n';
    diagram += '        S2["データ統合・分析システム<br/>分散データの効果的活用"]\n';
    diagram += '        S3["API統合支援<br/>基盤AIモデル連携"]\n';
    diagram += '        S4["助成金活用支援<br/>申請サポート"]\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph Clients["顧客企業"]\n';
    diagram += '        C1["システム部門<br/>AIシステム開発依頼<br/>開発・導入費用"]\n';
    diagram += '        C2["医療法人<br/>電子カルテ導入支援<br/>助成金活用"]\n';
    diagram += '        C3["中小企業<br/>内部データ管理<br/>HP作成<br/>Invoice制度対応"]\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph EndUsers["エンドユーザー"]\n';
    diagram += '        E1["従業員<br/>システム利用者"]\n';
    diagram += '    end\n\n';
    
    if (groupCompanies.length > 0) {
      groupCompanies.forEach((company, index) => {
        diagram += `    G${index + 1} -.->|連携・サポート↓| Company\n`;
        diagram += `    Company -.->|サービス提供↑| G${index + 1}\n`;
      });
      diagram += '\n';
    }
    
    diagram += '    Company -->|サービス提供| S1\n';
    diagram += '    Company -->|サービス提供| S2\n';
    diagram += '    Company -->|サービス提供| S3\n';
    diagram += '    Company -->|サービス提供| S4\n';
    diagram += '    S1 -->|システム導入| C1\n';
    diagram += '    S2 -->|システム導入| C1\n';
    diagram += '    S3 -->|技術支援| C1\n';
    diagram += '    S4 -->|支援| C2\n';
    diagram += '    S4 -->|支援| C3\n';
    diagram += '    C1 ==>|💰 開発・導入費用| Company\n';
    diagram += '    C2 ==>|💰 開発・導入費用| Company\n';
    diagram += '    C3 ==>|💰 開発・導入費用| Company\n';
    diagram += '    C1 -->|システム導入・運用| E1\n';
    diagram += '    C2 -->|システム導入・運用| E1\n';
    diagram += '    C3 -->|システム導入・運用| E1\n\n';
    
    if (groupCompanies.length > 0) {
      groupCompanies.forEach((company, index) => {
        diagram += `    class G${index + 1} groupClass\n`;
      });
      diagram += '\n';
    }
    diagram += '    class C1,C2,C3 paymentClass\n';
    diagram += '    class S1,S2,S3,S4 serviceClass\n';
    diagram += '    class E1 endUserClass\n';
    
    return diagram;
  };

  // 選択されたサービスに応じてMermaid図を生成
  const generateMermaidDiagram = (serviceId: ServiceId, detailed: boolean) => {
    switch (serviceId) {
      case 'own-service':
        return detailed ? generateOwnServiceDiagram() : generateOwnServiceDiagramSimple();
      case 'education-training':
        return detailed ? generateEducationTrainingDiagram() : generateEducationTrainingDiagramSimple();
      case 'consulting':
        return detailed ? generateConsultingDiagram() : generateConsultingDiagramSimple();
      case 'ai-dx':
        return detailed ? generateAiDxDiagram() : generateAiDxDiagramSimple();
      default:
        return detailed ? generateOwnServiceDiagram() : generateOwnServiceDiagramSimple();
    }
  };

  // 各事業の説明文を取得
  const getServiceDescription = (serviceId: ServiceId) => {
    switch (serviceId) {
      case 'own-service':
        return {
          title: '自社開発・自社サービス事業のビジネスモデル',
          description: [
            '自社開発・自社サービス事業は、パーソナルアプリケーションを直接エンドユーザーに提供する事業です。主なサービスとして「出産支援パーソナルApp」と「介護支援パーソナルApp」を展開しています。',
            'ビジネスモデルは、多様なパートナー企業との連携による紹介手数料・広告費収入と、個人ユーザー・企業・自治体からの直接収益を組み合わせたマルチチャネルモデルです。無料で利用できる基本機能によりユーザーを獲得し、プレミアムプランやB2B契約、パートナー紹介による収益化を実現します。',
          ],
          revenueModel: [
            { title: 'パートナー連携による収益', items: ['広告費', '紹介手数料', '代行手数料', 'リファラル手数料', 'マッチング手数料'] },
            { title: '個人ユーザーからの収益', items: ['プレミアムプランの月額/年額料金'] },
            { title: 'B2B収益', items: ['企業契約（従業員向け福利厚生）', '自治体契約（住民向けサービス）'] },
            { title: '認定取得支援', items: ['企業向け認定取得支援サービスの手数料'] },
          ],
          serviceTargets: [
            { title: '個人ユーザー', description: '無料版とプレミアムプラン' },
            { title: '企業', description: '従業員向け福利厚生として提供' },
            { title: '自治体', description: '住民向けサービスとして提供' },
          ],
        };
      case 'education-training':
        return {
          title: 'AI導入ルール設計・人材育成・教育事業のビジネスモデル',
          description: [
            'AI導入ルール設計・人材育成・教育事業は、経営層・人事部門を主な顧客として、組織全体のAI活用能力向上を支援する事業です。',
            'ビジネスモデルは、企業との契約料金を主な収益源とし、AI活用教育・研修、AI導入ルール設計・ガバナンス構築、組織全体のAI活用能力向上コンサルティングを提供します。標準化とカスタマイズの両立を実現するための教育・研修・ルール設計を提供することで、企業のAIファーストカンパニーへの変革を支援します。',
          ],
          revenueModel: [
            { title: '企業契約料金', items: ['経営層・人事部門との全社向けサービス契約', '年間契約・プロジェクト契約'] },
            { title: '教育・研修サービス', items: ['AI活用基礎研修', '実践的AI活用研修', 'カスタマイズ研修'] },
            { title: 'コンサルティングサービス', items: ['AI導入ルール設計', 'ガバナンス構築支援', '組織全体のAI活用能力向上コンサルティング'] },
          ],
          serviceTargets: [
            { title: '経営層・人事部門', description: '全社向けAI活用戦略の策定・実行支援' },
            { title: 'システム部門', description: 'ルール設計・ガバナンス構築の技術支援' },
            { title: '業務部門', description: '教育・研修・実践サポート' },
          ],
        };
      case 'consulting':
        return {
          title: 'プロセス可視化・業務コンサル事業のビジネスモデル',
          description: [
            'プロセス可視化・業務コンサル事業は、エンドユーザーからの課題相談・課題共有を起点として、経営層・業務部門・システム部門に対して分散データの可視化とプロセス改善を支援する事業です。',
            'ビジネスモデルは、コンサルティング料金を主な収益源とし、業務プロセス可視化、データドリブンな業務改善提案、助成金活用支援を提供します。メール、チャット、ストレージなどの分散データをAI Agentが分析し、業務フローの最適化を提案することで、従来可視化困難だった個人・組織の分散データを活用した改善を実現します。',
          ],
          revenueModel: [
            { title: 'コンサルティング料金', items: ['業務プロセス可視化・改善プロジェクト', '中小企業向け業務プロセス改善', '医療・介護施設向け業務改善'] },
            { title: '助成金活用支援', items: ['助成金申請サポート', '申請代行サービス'] },
            { title: '継続サポート', items: ['改善後のフォローアップ', '継続的な業務改善支援'] },
          ],
          serviceTargets: [
            { title: '中小企業', description: '業務プロセス可視化、効率化、経営課題の解決支援' },
            { title: '医療・介護施設', description: '業務フロー可視化、記録業務の効率化、コンプライアンス対応支援' },
            { title: '業務部門', description: 'データドリブンな業務改善の実践支援' },
          ],
        };
      case 'ai-dx':
        return {
          title: 'AI駆動開発・DX支援SI事業のビジネスモデル',
          description: [
            'AI駆動開発・DX支援SI事業は、システム部門を主な顧客として、AI活用アーキテクチャの導入支援とカスタムAIシステム開発を提供する事業です。',
            'ビジネスモデルは、開発・導入費用を主な収益源とし、AI活用アーキテクチャ導入、カスタムAIシステム開発、データ統合・分析システム構築、API統合支援を提供します。全社統合データと分散データの両方を活用するAIシステムの構築を支援し、企業のDX推進を加速させます。',
          ],
          revenueModel: [
            { title: '開発・導入費用', items: ['AI活用アーキテクチャ導入', 'カスタムAIシステム開発', 'データ統合・分析システム構築'] },
            { title: '技術サポート', items: ['API統合支援', '基盤AIモデル連携', 'システム運用サポート'] },
            { title: '助成金活用支援', items: ['助成金申請サポート', '申請代行サービス'] },
          ],
          serviceTargets: [
            { title: '医療法人', description: '電子カルテなどの医療データ統合、AI活用による業務効率化' },
            { title: '中小企業', description: '内部データ管理、HP作成、Invoice制度対応などのDX支援' },
            { title: 'システム部門', description: 'AI活用アーキテクチャ導入、カスタムAIシステム開発' },
          ],
        };
      default:
        return {
          title: '',
          description: [],
          revenueModel: [],
          serviceTargets: [],
        };
    }
  };

  useEffect(() => {
    if (!mermaidLoaded || typeof window === 'undefined' || !window.mermaid || !diagramRef.current) {
      return;
    }

    // 既にレンダリング済みの場合はスキップ
    const renderKey = isDetailed ? 'detailed' : 'simple';
    if (renderedRef.current[selectedService] && renderedRef.current[selectedService][renderKey] || isRendering) {
      return;
    }

    const renderDiagram = async () => {
      setIsRendering(true);
      try {
        const mermaid = window.mermaid;
        const diagram = generateMermaidDiagram(selectedService, isDetailed);
        
        // 初期化（一度だけ実行）
        if (!initializedRef.current) {
          mermaid.initialize({ 
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              nodeSpacing: 80,
              rankSpacing: 100,
              curve: 'basis',
              padding: 15,
              defaultRenderer: 'dagre-wrapper',
              paddingX: 15,
              paddingY: 10,
            },
            fontFamily: 'var(--font-inter), var(--font-noto), sans-serif',
            themeVariables: {
              fontSize: '14px',
              fontFamily: 'var(--font-inter), var(--font-noto), sans-serif',
              primaryTextColor: '#111827',
              primaryBorderColor: '#E5E7EB',
              lineColor: '#6B7280',
              secondaryTextColor: '#6B7280',
              tertiaryColor: '#F9FAFB',
              nodeBkg: '#FFFFFF',
              nodeBorder: '#E5E7EB',
              clusterBkg: '#F9FAFB',
              clusterBorder: '#D1D5DB',
              defaultLinkColor: '#3B82F6',
              titleColor: '#111827',
              edgeLabelBackground: '#FFFFFF',
            },
          });
          initializedRef.current = true;
        }

        const id = 'business-model-diagram-' + selectedService + '-' + Date.now();
        
        if (typeof mermaid.render === 'function') {
          // 最新のAPI: render()を使用
          const result = await mermaid.render(id, diagram);
          const svg = typeof result === 'string' ? result : result.svg;
          setSvgContent(svg);
          if (!renderedRef.current[selectedService]) {
            renderedRef.current[selectedService] = {};
          }
          renderedRef.current[selectedService][renderKey] = true;
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
          if (!renderedRef.current[selectedService]) {
            renderedRef.current[selectedService] = {};
          }
          renderedRef.current[selectedService][renderKey] = true;
        }
      } catch (err: any) {
        console.error('Mermaidレンダリングエラー:', err);
        setError('Mermaidのレンダリングに失敗しました: ' + (err.message || '不明なエラー'));
        if (!renderedRef.current[selectedService]) {
          renderedRef.current[selectedService] = {};
        }
        renderedRef.current[selectedService][renderKey] = false;
      } finally {
        setIsRendering(false);
      }
    };

    renderDiagram();
  }, [selectedService, isDetailed, mermaidLoaded]);

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

  const serviceInfo = getServiceDescription(selectedService);

  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        ビジネスモデル
      </p>
      
      {/* 切り替えボタン */}
      <div style={{ 
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {(Object.keys(SERVICE_NAMES) as ServiceId[]).map((serviceId, index) => (
          <button
            key={serviceId}
            onClick={() => setSelectedService(serviceId)}
            style={{
              padding: '12px 20px',
              backgroundColor: selectedService === serviceId 
                ? 'var(--color-primary)' 
                : 'rgba(31, 41, 51, 0.03)',
              color: selectedService === serviceId 
                ? '#fff' 
                : 'var(--color-text)',
              border: selectedService === serviceId
                ? '1px solid var(--color-primary)'
                : '1px solid var(--color-border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: selectedService === serviceId ? 600 : 400,
              transition: 'all 0.2s ease',
              boxShadow: selectedService === serviceId
                ? '0 2px 4px rgba(0, 0, 0, 0.1)'
                : '0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
            onMouseEnter={(e) => {
              if (selectedService !== serviceId) {
                e.currentTarget.style.backgroundColor = 'rgba(31, 41, 51, 0.06)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedService !== serviceId) {
                e.currentTarget.style.backgroundColor = 'rgba(31, 41, 51, 0.03)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
              }
            }}
          >
            {index + 1}. {SERVICE_NAMES[serviceId]}
          </button>
        ))}
      </div>

      <div className="card">
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>
            {selectedService === 'own-service' && '1. '}
            {selectedService === 'education-training' && '2. '}
            {selectedService === 'consulting' && '3. '}
            {selectedService === 'ai-dx' && '4. '}
            {serviceInfo.title}
          </h3>
          {serviceInfo.description.map((desc, index) => (
            <p 
              key={index}
              style={{ color: 'var(--color-text-light)', fontSize: '14px', marginBottom: '16px', lineHeight: '1.8' }}
            >
              {desc}
            </p>
          ))}
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

        {/* 簡素版/詳細版切り替えボタン */}
        <div style={{ 
          marginBottom: '16px',
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => setIsDetailed(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: !isDetailed 
                ? 'var(--color-primary)' 
                : 'rgba(31, 41, 51, 0.03)',
              color: !isDetailed 
                ? '#fff' 
                : 'var(--color-text)',
              border: !isDetailed
                ? '1px solid var(--color-primary)'
                : '1px solid var(--color-border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: !isDetailed ? 600 : 400,
              transition: 'all 0.2s ease',
              boxShadow: !isDetailed
                ? '0 2px 4px rgba(0, 0, 0, 0.1)'
                : '0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
            onMouseEnter={(e) => {
              if (isDetailed) {
                e.currentTarget.style.backgroundColor = 'rgba(31, 41, 51, 0.06)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (isDetailed) {
                e.currentTarget.style.backgroundColor = 'rgba(31, 41, 51, 0.03)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
              }
            }}
          >
            簡素版
          </button>
          <button
            onClick={() => setIsDetailed(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: isDetailed 
                ? 'var(--color-primary)' 
                : 'rgba(31, 41, 51, 0.03)',
              color: isDetailed 
                ? '#fff' 
                : 'var(--color-text)',
              border: isDetailed
                ? '1px solid var(--color-primary)'
                : '1px solid var(--color-border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: isDetailed ? 600 : 400,
              transition: 'all 0.2s ease',
              boxShadow: isDetailed
                ? '0 2px 4px rgba(0, 0, 0, 0.1)'
                : '0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
            onMouseEnter={(e) => {
              if (!isDetailed) {
                e.currentTarget.style.backgroundColor = 'rgba(31, 41, 51, 0.06)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDetailed) {
                e.currentTarget.style.backgroundColor = 'rgba(31, 41, 51, 0.03)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
              }
            }}
          >
            詳細版
          </button>
        </div>
        
        <div 
          ref={diagramRef}
          id="business-model-diagram"
          style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginTop: '20px',
            marginBottom: '20px',
            minHeight: '600px',
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

        {/* 収益モデルとサービス提供先 */}
        <div style={{ marginTop: '32px' }}>
          {/* 収益モデル */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              marginBottom: '20px', 
              color: 'var(--color-text)',
              borderLeft: '4px solid var(--color-primary)',
              paddingLeft: '12px'
            }}>
              収益モデル
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '16px' 
            }}>
              {serviceInfo.revenueModel.map((revenue, index) => (
                <div 
                  key={index} 
                  style={{ 
                    backgroundColor: '#fff',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #E5E7EB'
                  }}>
                    {revenue.title}
                  </div>
                  <ul style={{ 
                    margin: 0, 
                    paddingLeft: '20px', 
                    listStyleType: 'disc',
                    flex: 1
                  }}>
                    {revenue.items.map((item, itemIndex) => (
                      <li 
                        key={itemIndex} 
                        style={{ 
                          marginBottom: '8px', 
                          fontSize: '14px', 
                          color: '#374151',
                          lineHeight: '1.6'
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          {/* サービス提供先 */}
          <div>
            <h4 style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              marginBottom: '20px', 
              color: 'var(--color-text)',
              borderLeft: '4px solid var(--color-primary)',
              paddingLeft: '12px'
            }}>
              サービス提供先
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '16px' 
            }}>
              {serviceInfo.serviceTargets.map((target, index) => (
                <div 
                  key={index} 
                  style={{ 
                    backgroundColor: '#F9FAFB',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#1F2937',
                    marginBottom: '8px'
                  }}>
                    {target.title}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    lineHeight: '1.6'
                  }}>
                    {target.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
