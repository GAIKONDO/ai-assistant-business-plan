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

  // 自社サービス事業のMermaid図を生成（簡素版）
  const generateOwnServiceDiagramSimple = () => {
    let diagram = 'graph LR\n';
    diagram += '    direction LR\n';
    diagram += '    classDef partnerClass fill:#FFB6C1,stroke:#FF69B4,stroke-width:1px,color:#000\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:2px,color:#fff\n';
    diagram += '    classDef userClass fill:#90EE90,stroke:#32CD32,stroke-width:1px,color:#000\n\n';
    
    diagram += '    Partners["パートナー企業<br/>広告費・紹介手数料等"]\n';
    diagram += '    Company["株式会社AIアシスタント<br/>出産支援パーソナルアプリ提供"]\n';
    diagram += '    Users["ユーザー・クライアント<br/>個人・企業・自治体"]\n\n';
    
    diagram += '    Partners -->|収益| Company\n';
    diagram += '    Company -->|サービス提供| Users\n';
    diagram += '    Users -->|料金| Company\n\n';
    
    diagram += '    class Partners partnerClass\n';
    diagram += '    class Company companyClass\n';
    diagram += '    class Users userClass\n';
    
    return diagram;
  };

  // 自社サービス事業のMermaid図を生成（詳細版）
  const generateOwnServiceDiagram = () => {
    let diagram = 'graph LR\n';
    diagram += '    direction LR\n';
    diagram += '    classDef partnerClass fill:#FFB6C1,stroke:#FF69B4,stroke-width:2px,color:#000\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff\n';
    diagram += '    classDef userClass fill:#90EE90,stroke:#32CD32,stroke-width:2px,color:#000\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:2px,color:#000\n\n';
    
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
    
    diagram += '    Company["株式会社AIアシスタント<br/>出産支援パーソナルアプリ提供"]\n';
    diagram += '    class Company companyClass\n\n';
    
    diagram += '    subgraph Users["ユーザー・クライアント"]\n';
    diagram += '        U1["個人ユーザー<br/>プレミアムプラン<br/>月額/年額"]\n';
    diagram += '        U2["エンドユーザー<br/>無料で利用"]\n';
    diagram += '        U3["企業<br/>従業員向け福利厚生<br/>企業契約"]\n';
    diagram += '        U4["企業の従業員<br/>エンドユーザー"]\n';
    diagram += '        U5["自治体<br/>住民向けサービス<br/>自治体契約"]\n';
    diagram += '        U6["自治体の住民<br/>エンドユーザー"]\n';
    diagram += '        U7["認定取得支援<br/>くるみん認定取得支援<br/>健康経営優良法人認定取得<br/>企業向け<br/>認定取得支援手数料"]\n';
    diagram += '    end\n\n';
    
    diagram += '    A1 -->|広告費| Company\n';
    diagram += '    A2 -->|紹介手数料| Company\n';
    diagram += '    A3 -->|紹介手数料・代行手数料| Company\n';
    diagram += '    A4 -->|紹介手数料・代行手数料| Company\n';
    diagram += '    A5 -->|リファラル手数料| Company\n';
    diagram += '    A6 -->|マッチング手数料| Company\n';
    diagram += '    A7 -->|紹介手数料| Company\n';
    diagram += '    A8 -->|紹介手数料| Company\n\n';
    
    diagram += '    Company -->|直接提供| U1\n';
    diagram += '    Company -->|直接提供| U2\n';
    diagram += '    Company -->|B2B提供| U3\n';
    diagram += '    Company -->|B2B提供| U5\n';
    diagram += '    Company -->|認定取得支援サービス提供| U7\n\n';
    
    diagram += '    U1 -->|月額/年額| Company\n';
    diagram += '    U3 -->|企業契約| Company\n';
    diagram += '    U5 -->|自治体契約| Company\n';
    diagram += '    U7 -->|認定取得支援手数料| Company\n\n';
    
    diagram += '    U3 -->|提供| U4\n';
    diagram += '    U5 -->|提供| U6\n\n';
    
    diagram += '    class A1,A2,A3,A4,A5,A6,A7,A8 partnerClass\n';
    diagram += '    class U1,U2,U3,U4,U5,U6,U7 userClass\n';
    
    return diagram;
  };

  // 人材育成・教育・AI導入ルール設計事業のMermaid図を生成（簡素版）
  const generateEducationTrainingDiagramSimple = () => {
    let diagram = 'graph TD\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:2px,color:#fff\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:1px,color:#000\n';
    diagram += '    classDef serviceClass fill:#90EE90,stroke:#32CD32,stroke-width:1px,color:#000\n';
    diagram += '    classDef endUserClass fill:#E6F2FF,stroke:#6495ED,stroke-width:1px,color:#000\n\n';
    
    diagram += '    Company["株式会社AIアシスタント<br/>人材育成・教育・AI導入ルール設計事業"]\n';
    diagram += '    Clients["顧客企業<br/>経営層・人事部門"]\n';
    diagram += '    Services["提供サービス<br/>教育・研修・コンサルティング"]\n';
    diagram += '    EndUsers["エンドユーザー<br/>従業員"]\n\n';
    
    diagram += '    Company -->|サービス提供| Clients\n';
    diagram += '    Clients -->|契約料金| Company\n';
    diagram += '    Company -->|サービス提供| Services\n';
    diagram += '    Services -->|教育・研修| Clients\n';
    diagram += '    Clients -->|AI活用支援| EndUsers\n\n';
    
    diagram += '    class Company companyClass\n';
    diagram += '    class Clients clientClass\n';
    diagram += '    class Services serviceClass\n';
    diagram += '    class EndUsers endUserClass\n';
    
    return diagram;
  };

  // 人材育成・教育・AI導入ルール設計事業のMermaid図を生成（詳細版）
  const generateEducationTrainingDiagram = () => {
    let diagram = 'graph TD\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:2px,color:#000\n';
    diagram += '    classDef serviceClass fill:#90EE90,stroke:#32CD32,stroke-width:2px,color:#000\n';
    diagram += '    classDef endUserClass fill:#E6F2FF,stroke:#6495ED,stroke-width:1px,color:#000\n\n';
    
    diagram += '    Company["株式会社AIアシスタント<br/>人材育成・教育・AI導入ルール設計事業"]\n';
    diagram += '    class Company companyClass\n\n';
    
    diagram += '    subgraph Clients["顧客企業"]\n';
    diagram += '        C1["経営層・人事部門<br/>全社向けサービス<br/>契約料金"]\n';
    diagram += '        C2["システム部門<br/>ルール設計・ガバナンス<br/>技術サポート"]\n';
    diagram += '        C3["業務部門<br/>教育・研修<br/>実践サポート"]\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph Services["提供サービス"]\n';
    diagram += '        S1["AI活用教育・研修<br/>基礎から実践まで"]\n';
    diagram += '        S2["AI導入ルール設計<br/>ガバナンス構築"]\n';
    diagram += '        S3["組織全体のAI活用能力向上<br/>コンサルティング"]\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph EndUsers["エンドユーザー"]\n';
    diagram += '        E1["従業員<br/>AI活用実践者"]\n';
    diagram += '    end\n\n';
    
    diagram += '    Company -->|サービス提供| C1\n';
    diagram += '    C1 -->|契約料金| Company\n';
    diagram += '    Company -->|サービス提供| S1\n';
    diagram += '    Company -->|サービス提供| S2\n';
    diagram += '    Company -->|サービス提供| S3\n';
    diagram += '    S1 -->|教育・研修| C2\n';
    diagram += '    S1 -->|教育・研修| C3\n';
    diagram += '    S2 -->|ルール設計| C2\n';
    diagram += '    S3 -->|コンサルティング| C1\n';
    diagram += '    C2 -->|AI活用支援| E1\n';
    diagram += '    C3 -->|業務改善| E1\n\n';
    
    diagram += '    class C1,C2,C3 clientClass\n';
    diagram += '    class S1,S2,S3 serviceClass\n';
    diagram += '    class E1 endUserClass\n';
    
    return diagram;
  };

  // 業務コンサル・プロセス可視化・改善事業のMermaid図を生成（簡素版）
  const generateConsultingDiagramSimple = () => {
    let diagram = 'graph TD\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:2px,color:#fff\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:1px,color:#000\n';
    diagram += '    classDef serviceClass fill:#90EE90,stroke:#32CD32,stroke-width:1px,color:#000\n';
    diagram += '    classDef endUserClass fill:#E6F2FF,stroke:#6495ED,stroke-width:1px,color:#000\n\n';
    
    diagram += '    Company["株式会社AIアシスタント<br/>業務コンサル・プロセス可視化・改善事業"]\n';
    diagram += '    Clients["顧客企業<br/>業務部門"]\n';
    diagram += '    Services["提供サービス<br/>プロセス可視化・改善提案"]\n';
    diagram += '    EndUsers["エンドユーザー<br/>従業員"]\n\n';
    
    diagram += '    Company -->|サービス提供| Clients\n';
    diagram += '    Clients -->|コンサルティング料金| Company\n';
    diagram += '    Company -->|サービス提供| Services\n';
    diagram += '    Services -->|分析結果・改善提案| Clients\n';
    diagram += '    Clients -->|業務改善・効率化| EndUsers\n\n';
    
    diagram += '    class Company companyClass\n';
    diagram += '    class Clients clientClass\n';
    diagram += '    class Services serviceClass\n';
    diagram += '    class EndUsers endUserClass\n';
    
    return diagram;
  };

  // 業務コンサル・プロセス可視化・改善事業のMermaid図を生成（詳細版）
  const generateConsultingDiagram = () => {
    let diagram = 'graph TD\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:2px,color:#000\n';
    diagram += '    classDef serviceClass fill:#90EE90,stroke:#32CD32,stroke-width:2px,color:#000\n';
    diagram += '    classDef endUserClass fill:#E6F2FF,stroke:#6495ED,stroke-width:1px,color:#000\n\n';
    
    diagram += '    Company["株式会社AIアシスタント<br/>業務コンサル・プロセス可視化・改善事業"]\n';
    diagram += '    class Company companyClass\n\n';
    
    diagram += '    subgraph Clients["顧客企業"]\n';
    diagram += '        C1["業務部門<br/>業務プロセス改善依頼<br/>コンサルティング料金"]\n';
    diagram += '        C2["中小企業<br/>業務プロセス可視化・改善<br/>助成金活用支援"]\n';
    diagram += '        C3["医療・介護施設<br/>業務フロー可視化<br/>記録業務効率化<br/>コンプライアンス対応"]\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph Services["提供サービス"]\n';
    diagram += '        S1["業務プロセス可視化<br/>AI活用による分析"]\n';
    diagram += '        S2["業務改善提案<br/>データドリブンな改善"]\n';
    diagram += '        S3["助成金活用支援<br/>申請サポート"]\n';
    diagram += '        S4["コンプライアンス対応支援<br/>記録業務効率化"]\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph EndUsers["エンドユーザー"]\n';
    diagram += '        E1["従業員<br/>業務改善・効率化の実践者"]\n';
    diagram += '    end\n\n';
    
    diagram += '    Company -->|サービス提供| C1\n';
    diagram += '    Company -->|サービス提供| C2\n';
    diagram += '    Company -->|サービス提供| C3\n';
    diagram += '    C1 -->|コンサルティング料金| Company\n';
    diagram += '    C2 -->|コンサルティング料金| Company\n';
    diagram += '    C3 -->|コンサルティング料金| Company\n';
    diagram += '    Company -->|サービス提供| S1\n';
    diagram += '    Company -->|サービス提供| S2\n';
    diagram += '    Company -->|サービス提供| S3\n';
    diagram += '    Company -->|サービス提供| S4\n';
    diagram += '    S1 -->|分析結果| C1\n';
    diagram += '    S2 -->|改善提案| C1\n';
    diagram += '    S3 -->|支援| C2\n';
    diagram += '    S4 -->|支援| C3\n';
    diagram += '    C1 -->|業務改善・効率化| E1\n';
    diagram += '    C2 -->|業務改善・効率化| E1\n';
    diagram += '    C3 -->|業務改善・効率化| E1\n\n';
    
    diagram += '    class C1,C2,C3 clientClass\n';
    diagram += '    class S1,S2,S3,S4 serviceClass\n';
    diagram += '    class E1 endUserClass\n';
    
    return diagram;
  };

  // AI駆動開発・DX支援事業のMermaid図を生成（簡素版）
  const generateAiDxDiagramSimple = () => {
    let diagram = 'graph TD\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:2px,color:#fff\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:1px,color:#000\n';
    diagram += '    classDef serviceClass fill:#90EE90,stroke:#32CD32,stroke-width:1px,color:#000\n';
    diagram += '    classDef endUserClass fill:#E6F2FF,stroke:#6495ED,stroke-width:1px,color:#000\n\n';
    
    diagram += '    Company["株式会社AIアシスタント<br/>AI駆動開発・DX支援事業"]\n';
    diagram += '    Clients["顧客企業<br/>システム部門"]\n';
    diagram += '    Services["提供サービス<br/>AIシステム開発・導入"]\n';
    diagram += '    EndUsers["エンドユーザー<br/>従業員"]\n\n';
    
    diagram += '    Company -->|サービス提供| Clients\n';
    diagram += '    Clients -->|開発・導入費用| Company\n';
    diagram += '    Company -->|サービス提供| Services\n';
    diagram += '    Services -->|システム導入| Clients\n';
    diagram += '    Clients -->|システム導入・運用| EndUsers\n\n';
    
    diagram += '    class Company companyClass\n';
    diagram += '    class Clients clientClass\n';
    diagram += '    class Services serviceClass\n';
    diagram += '    class EndUsers endUserClass\n';
    
    return diagram;
  };

  // AI駆動開発・DX支援事業のMermaid図を生成（詳細版）
  const generateAiDxDiagram = () => {
    let diagram = 'graph TD\n';
    diagram += '    classDef companyClass fill:#6495ED,stroke:#4169E1,stroke-width:3px,color:#fff\n';
    diagram += '    classDef clientClass fill:#FFA500,stroke:#FF8C00,stroke-width:2px,color:#000\n';
    diagram += '    classDef serviceClass fill:#90EE90,stroke:#32CD32,stroke-width:2px,color:#000\n';
    diagram += '    classDef endUserClass fill:#E6F2FF,stroke:#6495ED,stroke-width:1px,color:#000\n\n';
    
    diagram += '    Company["株式会社AIアシスタント<br/>AI駆動開発・DX支援事業"]\n';
    diagram += '    class Company companyClass\n\n';
    
    diagram += '    subgraph Clients["顧客企業"]\n';
    diagram += '        C1["システム部門<br/>AIシステム開発依頼<br/>開発・導入費用"]\n';
    diagram += '        C2["医療法人<br/>電子カルテ導入支援<br/>助成金活用"]\n';
    diagram += '        C3["中小企業<br/>内部データ管理<br/>HP作成<br/>Invoice制度対応"]\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph Services["提供サービス"]\n';
    diagram += '        S1["AI活用アーキテクチャ導入<br/>カスタムAIシステム開発"]\n';
    diagram += '        S2["データ統合・分析システム<br/>分散データの効果的活用"]\n';
    diagram += '        S3["API統合支援<br/>基盤AIモデル連携"]\n';
    diagram += '        S4["助成金活用支援<br/>申請サポート"]\n';
    diagram += '    end\n\n';
    
    diagram += '    subgraph EndUsers["エンドユーザー"]\n';
    diagram += '        E1["従業員<br/>システム利用者"]\n';
    diagram += '    end\n\n';
    
    diagram += '    Company -->|サービス提供| C1\n';
    diagram += '    Company -->|サービス提供| C2\n';
    diagram += '    Company -->|サービス提供| C3\n';
    diagram += '    C1 -->|開発・導入費用| Company\n';
    diagram += '    C2 -->|開発・導入費用| Company\n';
    diagram += '    C3 -->|開発・導入費用| Company\n';
    diagram += '    Company -->|サービス提供| S1\n';
    diagram += '    Company -->|サービス提供| S2\n';
    diagram += '    Company -->|サービス提供| S3\n';
    diagram += '    Company -->|サービス提供| S4\n';
    diagram += '    S1 -->|システム導入| C1\n';
    diagram += '    S2 -->|システム導入| C1\n';
    diagram += '    S3 -->|技術支援| C1\n';
    diagram += '    S4 -->|支援| C2\n';
    diagram += '    S4 -->|支援| C3\n';
    diagram += '    C1 -->|システム導入・運用| E1\n';
    diagram += '    C2 -->|システム導入・運用| E1\n';
    diagram += '    C3 -->|システム導入・運用| E1\n\n';
    
    diagram += '    class C1,C2,C3 clientClass\n';
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
          title: '自社サービス事業のビジネスモデル',
          description: [
            '自社サービス事業は、パーソナルアプリケーションを直接エンドユーザーに提供する事業です。主なサービスとして「出産支援パーソナルアプリケーション」と「介護支援パーソナルアプリケーション」を展開しています。',
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
          title: '人材育成・教育・AI導入ルール設計事業のビジネスモデル',
          description: [
            '人材育成・教育・AI導入ルール設計事業は、経営層・人事部門を主な顧客として、組織全体のAI活用能力向上を支援する事業です。',
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
          title: '業務コンサル・プロセス可視化・改善事業のビジネスモデル',
          description: [
            '業務コンサル・プロセス可視化・改善事業は、業務部門を主な顧客として、分散データの可視化とプロセス改善を支援する事業です。',
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
          title: 'AI駆動開発・DX支援事業のビジネスモデル',
          description: [
            'AI駆動開発・DX支援事業は、システム部門を主な顧客として、AI活用アーキテクチャの導入支援とカスタムAIシステム開発を提供する事業です。',
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
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>
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

        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
            収益モデル
          </h4>
          {serviceInfo.revenueModel.map((revenue, index) => (
            <div key={index} style={{ marginBottom: '16px' }}>
              <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>{revenue.title}:</strong>
              <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px', listStyleType: 'disc' }}>
                {revenue.items.map((item, itemIndex) => (
                  <li key={itemIndex} style={{ marginBottom: '4px', fontSize: '14px', color: 'var(--color-text)' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', marginTop: '20px', color: 'var(--color-text)' }}>
            サービス提供先
          </h4>
          {serviceInfo.serviceTargets.map((target, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>{target.title}:</strong>
              <span style={{ fontSize: '14px', color: 'var(--color-text)', marginLeft: '8px' }}>
                {target.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
