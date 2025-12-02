'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { select } from 'd3-selection';
import { drag } from 'd3-drag';
import { scaleOrdinal } from 'd3-scale';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import { SUB_MENU_ITEMS } from '@/components/ConceptSubMenu';

// DynamicPageを動的インポート（SSRを回避）
const DynamicPage = dynamic(
  () => import('@/components/pages/component-test/test-concept/DynamicPage'),
  { ssr: false }
);

// 固定サービス（事業企画）の定義
const SPECIAL_SERVICES = [
  { id: 'own-service', name: '自社開発・自社サービス事業', description: '自社開発のサービス事業に関する計画', hasConcepts: true },
  { id: 'education-training', name: 'AI導入ルール設計・人材育成・教育事業', description: '人材育成、教育、AI導入ルール設計に関する計画', hasConcepts: true },
  { id: 'consulting', name: 'プロセス可視化・業務コンサル事業', description: '業務コンサルティングとプロセス改善に関する計画', hasConcepts: true },
  { id: 'ai-dx', name: 'AI駆動開発・DX支援SI事業', description: 'AI技術を活用した開発・DX支援に関する計画', hasConcepts: true },
];

// 固定構想の定義
const FIXED_CONCEPTS: { [key: string]: Array<{ id: string; name: string; description: string }> } = {
  'own-service': [
    { id: 'maternity-support', name: '出産支援パーソナルApp', description: '出産前後のママとパパをサポートするパーソナルアプリケーション' },
    { id: 'care-support', name: '介護支援パーソナルApp', description: '介護を必要とする方とその家族をサポートするパーソナルアプリケーション' },
  ],
  'ai-dx': [
    { id: 'medical-dx', name: '医療法人向けDX', description: '助成金を活用したDX：電子カルテなどの導入支援' },
    { id: 'sme-dx', name: '中小企業向けDX', description: '内部データ管理やHP作成、Invoice制度の対応など' },
  ],
  'consulting': [
    { id: 'sme-process', name: '中小企業向け業務プロセス可視化・改善', description: '中小企業の業務プロセス可視化、効率化、経営課題の解決支援、助成金活用支援' },
    { id: 'medical-care-process', name: '医療・介護施設向け業務プロセス可視化・改善', description: '医療・介護施設の業務フロー可視化、記録業務の効率化、コンプライアンス対応支援' },
  ],
  'education-training': [
    { id: 'corporate-ai-training', name: '大企業向けAI人材育成・教育', description: '企業内AI人材の育成、AI活用スキル研修、AI導入教育プログラムの提供' },
    { id: 'ai-governance', name: 'AI導入ルール設計・ガバナンス支援', description: '企業のAI導入におけるルール設計、ガバナンス構築、コンプライアンス対応支援' },
    { id: 'sme-ai-education', name: '中小企業向けAI導入支援・教育', description: '中小企業向けのAI導入支援、実践的なAI教育、導入ルール設計支援、助成金活用支援' },
  ],
};

// 各構想から獲得できる強みの定義
const CONCEPT_STRENGTHS: { [key: string]: string[] } = {
  'maternity-support': [
    '妊婦・育児データの蓄積',
    'パーソナライズドヘルスケアのノウハウ',
    '医療機関との連携実績'
  ],
  'care-support': [
    '介護データの蓄積',
    '家族支援のノウハウ',
    '介護施設との連携実績'
  ],
  'medical-dx': [
    '医療機関との信頼関係',
    '電子カルテ導入の実績',
    'コンプライアンス対応の経験'
  ],
  'sme-dx': [
    '中小企業向けDXの実績',
    'コスト効率的なソリューション提供',
    '助成金活用のサポート実績'
  ],
  'sme-process': [
    '業務プロセス可視化の技術',
    '中小企業の経営課題理解',
    '経営コンサルティングの実績'
  ],
  'medical-care-process': [
    '医療・介護施設の業務理解',
    '記録業務効率化の実績',
    'コンプライアンス対応の経験'
  ],
  'corporate-ai-training': [
    '大企業向け研修プログラムの実績',
    'AI人材育成のノウハウ',
    'AI導入戦略のコンサル実績'
  ],
  'ai-governance': [
    'AIガバナンス設計の実績',
    'コンプライアンス対応の経験',
    'AI導入ルール策定のノウハウ'
  ],
  'sme-ai-education': [
    '中小企業向けAI教育の実績',
    '実践的なAI活用のノウハウ',
    '助成金活用支援の経験'
  ]
};

export interface GraphNode {
  id: string;
  label: string;
  type: 'company' | 'project' | 'concept' | 'servicePlan' | 'page' | 'subMenu';
  data?: any;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type?: string;
}

interface ForceDirectedGraphProps {
  width?: number;
  height?: number;
  title?: string;
}

export default function ForceDirectedGraph({
  width = 1200,
  height = 800,
  title = '会社・事業企画・構想の関係性',
}: ForceDirectedGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: GraphNode } | null>(null);
  const simulationRef = useRef<any>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'fixed' | 'componentized'>('all');
  const [nodeTypeFilters, setNodeTypeFilters] = useState<{
    company: boolean;
    project: boolean;
    concept: boolean;
    subMenu: boolean;
    page: boolean;
  }>({
    company: true,
    project: true,
    concept: true,
    subMenu: false,
    page: false,
  });
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [selectedConceptIds, setSelectedConceptIds] = useState<Set<string>>(new Set());
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [selectedSubMenuIds, setSelectedSubMenuIds] = useState<Set<string>>(new Set());
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);
  const [modalPage, setModalPage] = useState<{
    title: string;
    content: string;
    pageId: string;
    pageNumber: number;
  } | null>(null);
  const [modalSubMenuPages, setModalSubMenuPages] = useState<Array<{
    title: string;
    content: string;
    pageId: string;
    pageNumber: number;
  }> | null>(null);
  const [modalFixedPage, setModalFixedPage] = useState<{
    serviceId: string;
    conceptId: string;
    subMenuId: string;
    subMenuLabel: string;
  } | null>(null);
  const [modalFixedConcept, setModalFixedConcept] = useState<{
    serviceId: string;
    conceptId: string;
    conceptLabel: string;
  } | null>(null);

  // ノードタイプごとの色を設定
  const colorScale = useMemo(() => {
    return scaleOrdinal<string>()
      .domain(['company', 'project', 'concept', 'servicePlan', 'subMenu', 'page'])
      .range(['#4A90E2', '#50C878', '#FF6B6B', '#FFA500', '#E67E22', '#9B59B6']); // 青、緑、赤、オレンジ、オレンジ系、紫
  }, []);

  // Firebaseからデータを取得
  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !db) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userId = user.uid;

        // 並列でデータを取得
        const [companyPlansSnapshot, projectsSnapshot, conceptsSnapshot, servicePlansSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'companyBusinessPlan'), where('userId', '==', userId))),
          getDocs(query(collection(db, 'businessProjects'), where('userId', '==', userId))),
          getDocs(query(collection(db, 'concepts'), where('userId', '==', userId))),
          getDocs(query(collection(db, 'servicePlans'), where('userId', '==', userId))),
        ]);

        // ノードを作成
        const nodesMap = new Map<string, GraphNode>();

        // 会社ノードを追加
        companyPlansSnapshot.forEach((doc) => {
          const data = doc.data();
          const nodeId = `company-${doc.id}`;
          const pagesBySubMenu = data.pagesBySubMenu;
          const isComponentized = pagesBySubMenu && 
            typeof pagesBySubMenu === 'object' && 
            Object.keys(pagesBySubMenu).length > 0 &&
            Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
          nodesMap.set(nodeId, {
            id: nodeId,
            label: data.title || '会社事業計画',
            type: 'company',
            data: { ...data, docId: doc.id, isComponentized },
          });

          // コンポーネント形式の場合、サブメニューノードとページコンテナをノードとして追加
          if (isComponentized && pagesBySubMenu) {
            Object.entries(pagesBySubMenu).forEach(([subMenuId, pages]) => {
              if (Array.isArray(pages) && pages.length > 0) {
                // サブメニューノードを追加（会社の事業計画にもサブメニューがある場合）
                const subMenuItem = SUB_MENU_ITEMS.find(item => item.id === subMenuId);
                if (subMenuItem) {
                  const subMenuNodeId = `subMenu-company-${doc.id}-${subMenuId}`;
                  nodesMap.set(subMenuNodeId, {
                    id: subMenuNodeId,
                    label: subMenuItem.label,
                    type: 'subMenu',
                    data: {
                      planId: doc.id,
                      subMenuId: subMenuId,
                      subMenuLabel: subMenuItem.label,
                      pages: pages.map((page: any) => ({
                        id: page.id,
                        title: page.title,
                        content: page.content,
                        pageNumber: page.pageNumber,
                      })),
                      isComponentized: true,
                      isCompanyPlan: true,
                    },
                  });
                }
                
                // ページコンテナをノードとして追加
                pages.forEach((page: any) => {
                  if (page && page.id && page.title) {
                    const pageNodeId = `page-company-${doc.id}-${subMenuId}-${page.id}`;
                    nodesMap.set(pageNodeId, {
                      id: pageNodeId,
                      label: page.title || `ページ ${page.pageNumber || ''}`,
                      type: 'page',
                      data: {
                        planId: doc.id,
                        subMenuId: subMenuId,
                        pageId: page.id,
                        pageNumber: page.pageNumber,
                        pageTitle: page.title,
                        pageContent: page.content,
                        isComponentized: true,
                        isCompanyPlan: true,
                      },
                    });
                  }
                });
              }
            });
          }
        });

        // 固定サービス（事業企画）ノードを追加
        SPECIAL_SERVICES.forEach((service) => {
          const nodeId = `project-${service.id}`;
          nodesMap.set(nodeId, {
            id: nodeId,
            label: service.name,
            type: 'project',
            data: { serviceId: service.id, description: service.description, isFixed: true },
          });
        });

        // 事業企画ノードを追加（Firebaseから取得）
        projectsSnapshot.forEach((doc) => {
          const data = doc.data();
          const nodeId = `project-${doc.id}`;
          nodesMap.set(nodeId, {
            id: nodeId,
            label: data.name || '事業企画',
            type: 'project',
            data: { ...data, docId: doc.id, serviceId: data.serviceId },
          });
        });

        // 構想ノードを追加（Firebaseから取得した構想）
        const addedConceptIds = new Set<string>();
        const conceptNodesPromises: Promise<void>[] = [];
        
        for (const doc of conceptsSnapshot.docs) {
          const conceptPromise = (async () => {
            const data = doc.data();
            const nodeId = `concept-${doc.id}`;
            const conceptId = data.conceptId || doc.id;
            addedConceptIds.add(conceptId);
            const pagesBySubMenu = data.pagesBySubMenu;
            const isComponentized = pagesBySubMenu && 
              typeof pagesBySubMenu === 'object' && 
              Object.keys(pagesBySubMenu).length > 0 &&
              Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
            nodesMap.set(nodeId, {
              id: nodeId,
              label: data.name || '構想',
              type: 'concept',
              data: { ...data, docId: doc.id, serviceId: data.serviceId, conceptId: conceptId, isComponentized },
            });

          // コンポーネント形式の場合、サブメニューノードとページコンテナをノードとして追加
          if (isComponentized && pagesBySubMenu) {
            Object.entries(pagesBySubMenu).forEach(([subMenuId, pages]) => {
              if (Array.isArray(pages) && pages.length > 0) {
                // サブメニューノードを追加
                const subMenuItem = SUB_MENU_ITEMS.find(item => item.id === subMenuId);
                if (subMenuItem) {
                  const subMenuNodeId = `subMenu-${doc.id}-${subMenuId}`;
                  nodesMap.set(subMenuNodeId, {
                    id: subMenuNodeId,
                    label: subMenuItem.label,
                    type: 'subMenu',
                    data: {
                      conceptId: conceptId,
                      conceptDocId: doc.id,
                      subMenuId: subMenuId,
                      subMenuLabel: subMenuItem.label,
                      pages: pages.map((page: any) => ({
                        id: page.id,
                        title: page.title,
                        content: page.content,
                        pageNumber: page.pageNumber,
                      })),
                      isComponentized: true,
                    },
                  });
                }
                
                // ページコンテナをノードとして追加
                pages.forEach((page: any) => {
                  if (page && page.id && page.title) {
                    const pageNodeId = `page-${doc.id}-${subMenuId}-${page.id}`;
                    nodesMap.set(pageNodeId, {
                      id: pageNodeId,
                      label: page.title || `ページ ${page.pageNumber || ''}`,
                      type: 'page',
                      data: {
                        conceptId: conceptId,
                        conceptDocId: doc.id,
                        subMenuId: subMenuId,
                        pageId: page.id,
                        pageNumber: page.pageNumber,
                        pageTitle: page.title,
                        pageContent: page.content,
                        isComponentized: true,
                      },
                    });
                  }
                });
              }
            });
          } else {
            // 固定ページ形式の場合でも、すべてのサブメニューノードを追加
            // ただし、ページの内容をチェックして、デフォルトのプレースホルダーのみの場合は除外
            const subMenuPromises = SUB_MENU_ITEMS.map(async (subMenuItem) => {
              const subMenuNodeId = `subMenu-${doc.id}-${subMenuItem.id}`;
              const pageUrl = `/business-plan/services/${data.serviceId}/${conceptId}/${subMenuItem.id}`;
              
              // ページの内容をチェック（非同期）
              try {
                const response = await fetch(pageUrl);
                if (!response || !response.ok) {
                  // ページが存在しない場合は除外
                  return null;
                }
                
                const html = await response.text();
                // デフォルトのプレースホルダーテキストのパターンをチェック
                const placeholderPatterns = [
                  `${subMenuItem.label}の内容をここに表示します`,
                  `この構想の${subMenuItem.label}ページは現在準備中です。`,
                  'の内容をここに表示します',
                  'は現在準備中です。',
                ];
                
                // HTMLから実際のコンテンツがあるかチェック
                // デフォルトのプレースホルダーテキストのみの場合は除外
                const hasRealContent = !placeholderPatterns.some(pattern => 
                  html.includes(pattern) && html.split(pattern).length === 2
                );
                
                // cardクラス内にプレースホルダーテキストのみの場合は除外
                const cardMatch = html.match(/<div[^>]*class="card"[^>]*>([\s\S]*?)<\/div>/);
                if (cardMatch) {
                  const cardContent = cardMatch[1];
                  const isOnlyPlaceholder = placeholderPatterns.some(pattern => 
                    cardContent.includes(pattern) && cardContent.trim().length < 200
                  );
                  if (isOnlyPlaceholder) {
                    return null;
                  }
                }
                
                if (!hasRealContent) {
                  return null;
                }
                
                // ページが存在し、コンテンツがある場合のみノードを作成
                return {
                  id: subMenuNodeId,
                  label: subMenuItem.label,
                  type: 'subMenu' as const,
                  data: {
                    conceptId: conceptId,
                    conceptDocId: doc.id,
                    serviceId: data.serviceId,
                    subMenuId: subMenuItem.id,
                    subMenuLabel: subMenuItem.label,
                    pages: [],
                    isComponentized: false,
                  },
                };
              } catch (error) {
                // エラーの場合は表示対象外にする（ページが存在しない場合など）
                console.log('ページ内容のチェックエラー:', pageUrl, error);
                return null;
              }
            });
            
            // すべてのサブメニューのチェックを並列実行
            const subMenuNodes = await Promise.all(subMenuPromises);
            subMenuNodes.forEach(node => {
              if (node) {
                nodesMap.set(node.id, node);
              }
            });
          }
          })();
          conceptNodesPromises.push(conceptPromise);
        }
        
        // すべての構想ノードの処理を待つ
        await Promise.all(conceptNodesPromises);

        // 固定構想ノードを追加（Firebaseに存在しない場合）
        const fixedConceptPromises: Promise<void>[] = [];
        for (const [serviceId, concepts] of Object.entries(FIXED_CONCEPTS)) {
          for (const concept of concepts) {
            // 既に追加されている構想はスキップ
            if (!addedConceptIds.has(concept.id)) {
              const fixedConceptPromise = (async () => {
                const nodeId = `fixed-concept-${serviceId}-${concept.id}`;
                nodesMap.set(nodeId, {
                  id: nodeId,
                  label: concept.name,
                  type: 'concept',
                  data: { 
                    serviceId: serviceId, 
                    conceptId: concept.id, 
                    description: concept.description,
                    isFixed: true,
                    isComponentized: false // 固定構想は固定ページ形式
                  },
                });
                
                // 固定ページ形式でも、すべてのサブメニューノードを追加
                // ただし、ページの内容をチェックして、デフォルトのプレースホルダーのみの場合は除外
                const subMenuPromises = SUB_MENU_ITEMS.map(async (subMenuItem) => {
                  const subMenuNodeId = `subMenu-fixed-${serviceId}-${concept.id}-${subMenuItem.id}`;
                  const pageUrl = `/business-plan/services/${serviceId}/${concept.id}/${subMenuItem.id}`;
                  
                  // ページの内容をチェック（非同期）
                  try {
                    const response = await fetch(pageUrl);
                    if (!response || !response.ok) {
                      // ページが存在しない場合は除外
                      return null;
                    }
                    
                    const html = await response.text();
                    // デフォルトのプレースホルダーテキストのパターンをチェック
                    const placeholderPatterns = [
                      `${subMenuItem.label}の内容をここに表示します`,
                      `この構想の${subMenuItem.label}ページは現在準備中です。`,
                      'の内容をここに表示します',
                      'は現在準備中です。',
                    ];
                    
                    // HTMLから実際のコンテンツがあるかチェック
                    // デフォルトのプレースホルダーテキストのみの場合は除外
                    const hasRealContent = !placeholderPatterns.some(pattern => 
                      html.includes(pattern) && html.split(pattern).length === 2
                    );
                    
                    // cardクラス内にプレースホルダーテキストのみの場合は除外
                    const cardMatch = html.match(/<div[^>]*class="card"[^>]*>([\s\S]*?)<\/div>/);
                    if (cardMatch) {
                      const cardContent = cardMatch[1];
                      const isOnlyPlaceholder = placeholderPatterns.some(pattern => 
                        cardContent.includes(pattern) && cardContent.trim().length < 200
                      );
                      if (isOnlyPlaceholder) {
                        return null;
                      }
                    }
                    
                    if (!hasRealContent) {
                      return null;
                    }
                    
                    // ページが存在し、コンテンツがある場合のみノードを作成
                    return {
                      id: subMenuNodeId,
                      label: subMenuItem.label,
                      type: 'subMenu' as const,
                      data: {
                        conceptId: concept.id,
                        serviceId: serviceId,
                        subMenuId: subMenuItem.id,
                        subMenuLabel: subMenuItem.label,
                        pages: [],
                        isComponentized: false,
                        isFixed: true,
                      },
                    };
                  } catch (error) {
                    // エラーの場合は表示対象外にする（ページが存在しない場合など）
                    console.log('ページ内容のチェックエラー:', pageUrl, error);
                    return null;
                  }
                });
                
                // すべてのサブメニューのチェックを並列実行
                const subMenuNodes = await Promise.all(subMenuPromises);
                subMenuNodes.forEach(node => {
                  if (node) {
                    nodesMap.set(node.id, node);
                  }
                });
              })();
              fixedConceptPromises.push(fixedConceptPromise);
            }
          }
        }
        
        // すべての固定構想ノードの処理を待つ
        await Promise.all(fixedConceptPromises);

        // サービス計画ノードを追加
        servicePlansSnapshot.forEach((doc) => {
          const data = doc.data();
          const nodeId = `servicePlan-${doc.id}`;
          nodesMap.set(nodeId, {
            id: nodeId,
            label: data.title || 'サービス計画',
            type: 'servicePlan',
            data: { ...data, docId: doc.id, serviceId: data.serviceId, conceptId: data.conceptId },
          });
        });


        // リンクを作成
        const linksList: GraphLink[] = [];

        // 会社と事業企画のリンク（同じユーザーIDで関連、すべての会社に接続）
        const companyNodes = Array.from(nodesMap.values()).filter((n) => n.type === 'company');
        const projectNodes = Array.from(nodesMap.values()).filter((n) => n.type === 'project');

        companyNodes.forEach((companyNode) => {
          projectNodes.forEach((projectNode) => {
            linksList.push({
              source: companyNode.id,
              target: projectNode.id,
              type: 'company-project',
            });
          });
        });

        // 事業企画と構想のリンク（serviceIdで関連）
        // 固定サービス（事業企画）と構想のリンク
        SPECIAL_SERVICES.forEach((service) => {
          const projectId = `project-${service.id}`;
          const serviceId = service.id;

          // Firebaseから取得した構想（コンポーネント形式も含む）
          conceptsSnapshot.forEach((conceptDoc) => {
            const conceptData = conceptDoc.data();
            if (conceptData.serviceId === serviceId) {
              const conceptId = `concept-${conceptDoc.id}`;
              const pagesBySubMenu = conceptData.pagesBySubMenu;
              const isComponentized = pagesBySubMenu && 
                typeof pagesBySubMenu === 'object' && 
                Object.keys(pagesBySubMenu).length > 0 &&
                Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
              
              // コンポーネント形式の構想も事業企画にリンク
              linksList.push({
                source: projectId,
                target: conceptId,
                type: 'project-concept',
              });
              
              console.log('構想と事業企画のリンク作成:', {
                projectId,
                conceptId,
                serviceId,
                isComponentized,
              });
            }
          });
          // 固定構想
          const fixedConcepts = FIXED_CONCEPTS[serviceId] || [];
          fixedConcepts.forEach((concept) => {
            const conceptId = `fixed-concept-${serviceId}-${concept.id}`;
            if (nodesMap.has(conceptId)) {
              linksList.push({
                source: projectId,
                target: conceptId,
                type: 'project-concept',
              });
            }
          });
        });

        // Firebaseから取得した事業企画と構想のリンク
        projectsSnapshot.forEach((projectDoc) => {
          const projectData = projectDoc.data();
          const projectId = `project-${projectDoc.id}`;
          const serviceId = projectData.serviceId;

          if (serviceId) {
            // Firebaseから取得した構想（コンポーネント形式も含む）
            conceptsSnapshot.forEach((conceptDoc) => {
              const conceptData = conceptDoc.data();
              if (conceptData.serviceId === serviceId) {
                const conceptId = `concept-${conceptDoc.id}`;
                const pagesBySubMenu = conceptData.pagesBySubMenu;
                const isComponentized = pagesBySubMenu && 
                  typeof pagesBySubMenu === 'object' && 
                  Object.keys(pagesBySubMenu).length > 0 &&
                  Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
                
                // コンポーネント形式の構想も事業企画にリンク
                linksList.push({
                  source: projectId,
                  target: conceptId,
                  type: 'project-concept',
                });
                
                console.log('構想と事業企画のリンク作成:', {
                  projectId,
                  conceptId,
                  serviceId,
                  isComponentized,
                });
              }
            });
            // 固定構想
            const fixedConcepts = FIXED_CONCEPTS[serviceId] || [];
            fixedConcepts.forEach((concept) => {
              const conceptId = `fixed-concept-${serviceId}-${concept.id}`;
              if (nodesMap.has(conceptId)) {
                linksList.push({
                  source: projectId,
                  target: conceptId,
                  type: 'project-concept',
                });
              }
            });
          }
        });

        // 会社とページコンテナのリンク（コンポーネント形式の場合）
        companyPlansSnapshot.forEach((planDoc) => {
          const planData = planDoc.data();
          const companyId = `company-${planDoc.id}`;
          const pagesBySubMenu = planData.pagesBySubMenu;
          const isComponentized = pagesBySubMenu && 
            typeof pagesBySubMenu === 'object' && 
            Object.keys(pagesBySubMenu).length > 0 &&
            Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);

          if (isComponentized && pagesBySubMenu) {
            Object.entries(pagesBySubMenu).forEach(([subMenuId, pages]) => {
              if (Array.isArray(pages) && pages.length > 0) {
                // サブメニューノードへのリンク
                const subMenuNodeId = `subMenu-company-${planDoc.id}-${subMenuId}`;
                linksList.push({
                  source: companyId,
                  target: subMenuNodeId,
                  type: 'company-subMenu',
                });
                
                // サブメニューからページへのリンク
                pages.forEach((page: any) => {
                  if (page && page.id && page.title) {
                    const pageNodeId = `page-company-${planDoc.id}-${subMenuId}-${page.id}`;
                    linksList.push({
                      source: subMenuNodeId,
                      target: pageNodeId,
                      type: 'subMenu-page',
                    });
                  }
                });
              }
            });
          }
        });

        // 構想とサブメニューのリンク、サブメニューとページのリンク
        conceptsSnapshot.forEach((conceptDoc) => {
          const conceptData = conceptDoc.data();
          const conceptId = `concept-${conceptDoc.id}`;
          const pagesBySubMenu = conceptData.pagesBySubMenu;
          const isComponentized = pagesBySubMenu && 
            typeof pagesBySubMenu === 'object' && 
            Object.keys(pagesBySubMenu).length > 0 &&
            Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);

          if (isComponentized && pagesBySubMenu) {
            // コンポーネント形式の場合
            Object.entries(pagesBySubMenu).forEach(([subMenuId, pages]) => {
              if (Array.isArray(pages) && pages.length > 0) {
                // サブメニューノードへのリンク
                const subMenuNodeId = `subMenu-${conceptDoc.id}-${subMenuId}`;
                linksList.push({
                  source: conceptId,
                  target: subMenuNodeId,
                  type: 'concept-subMenu',
                });
                
                // サブメニューからページへのリンク
                pages.forEach((page: any) => {
                  if (page && page.id && page.title) {
                    const pageNodeId = `page-${conceptDoc.id}-${subMenuId}-${page.id}`;
                    linksList.push({
                      source: subMenuNodeId,
                      target: pageNodeId,
                      type: 'subMenu-page',
                    });
                  }
                });
              }
            });
          } else {
            // 固定ページ形式の場合でも、すべてのサブメニューにリンク
            SUB_MENU_ITEMS.forEach((subMenuItem) => {
              const subMenuNodeId = `subMenu-${conceptDoc.id}-${subMenuItem.id}`;
              linksList.push({
                source: conceptId,
                target: subMenuNodeId,
                type: 'concept-subMenu',
              });
            });
          }
        });
        
        // 固定構想とサブメニューのリンク
        Object.entries(FIXED_CONCEPTS).forEach(([serviceId, concepts]) => {
          concepts.forEach((concept) => {
            const conceptId = `fixed-concept-${serviceId}-${concept.id}`;
            if (nodesMap.has(conceptId)) {
              SUB_MENU_ITEMS.forEach((subMenuItem) => {
                const subMenuNodeId = `subMenu-fixed-${serviceId}-${concept.id}-${subMenuItem.id}`;
                if (nodesMap.has(subMenuNodeId)) {
                  linksList.push({
                    source: conceptId,
                    target: subMenuNodeId,
                    type: 'concept-subMenu',
                  });
                }
              });
            }
          });
        });

        // 構想とサービス計画のリンク（conceptIdで関連）
        conceptsSnapshot.forEach((conceptDoc) => {
          const conceptData = conceptDoc.data();
          const conceptId = `concept-${conceptDoc.id}`;
          const conceptConceptId = conceptData.conceptId;

          if (conceptConceptId) {
            servicePlansSnapshot.forEach((planDoc) => {
              const planData = planDoc.data();
              if (planData.conceptId === conceptConceptId) {
                const planId = `servicePlan-${planDoc.id}`;
                linksList.push({
                  source: conceptId,
                  target: planId,
                  type: 'concept-servicePlan',
                });
              }
            });
          }
        });

        // 構想と会社の直接リンクは削除（事業企画経由のみ）

        // 事業企画とサービス計画のリンク（serviceIdで関連、conceptIdがない場合も含む）
        // 固定サービス（事業企画）とサービス計画のリンク
        SPECIAL_SERVICES.forEach((service) => {
          const projectId = `project-${service.id}`;
          const serviceId = service.id;

          servicePlansSnapshot.forEach((planDoc) => {
            const planData = planDoc.data();
            if (planData.serviceId === serviceId) {
              const planId = `servicePlan-${planDoc.id}`;
              // 既にconcept-servicePlanリンクが存在する場合はスキップ（構想経由の方が優先）
              const conceptLinkExists = linksList.some(
                (link) =>
                  (link.target === planId || (typeof link.target === 'object' && link.target.id === planId)) &&
                  link.type === 'concept-servicePlan'
              );
              if (!conceptLinkExists) {
                linksList.push({
                  source: projectId,
                  target: planId,
                  type: 'project-servicePlan',
                });
              }
            }
          });
        });

        // Firebaseから取得した事業企画とサービス計画のリンク
        projectsSnapshot.forEach((projectDoc) => {
          const projectData = projectDoc.data();
          const projectId = `project-${projectDoc.id}`;
          const serviceId = projectData.serviceId;

          if (serviceId) {
            servicePlansSnapshot.forEach((planDoc) => {
              const planData = planDoc.data();
              if (planData.serviceId === serviceId) {
                const planId = `servicePlan-${planDoc.id}`;
                // 既にconcept-servicePlanリンクが存在する場合はスキップ（構想経由の方が優先）
                const conceptLinkExists = linksList.some(
                  (link) =>
                    (link.target === planId || (typeof link.target === 'object' && link.target.id === planId)) &&
                    link.type === 'concept-servicePlan'
                );
                if (!conceptLinkExists) {
                  linksList.push({
                    source: projectId,
                    target: planId,
                    type: 'project-servicePlan',
                  });
                }
              }
            });
          }
        });


        // デバッグ用ログ
        console.log('ノード数:', nodesMap.size);
        console.log('ノード一覧:', Array.from(nodesMap.values()).map(n => ({ id: n.id, label: n.label, type: n.type })));
        console.log('リンク数:', linksList.length);
        console.log('リンク一覧:', linksList.map(l => ({ source: typeof l.source === 'string' ? l.source : l.source.id, target: typeof l.target === 'string' ? l.target : l.target.id, type: l.type })));

        setNodes(Array.from(nodesMap.values()));
        setLinks(linksList);
        setLoading(false);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  // フィルタリングされたノードとリンクを計算
  const filteredNodes = useMemo(() => {
    let filtered = nodes;
    
    // 形式フィルター（固定ページ形式/コンポーネント形式）
    // 事業企画ノードは形式の区別がないので常に表示
    if (filterMode !== 'all') {
      filtered = filtered.filter(node => {
        // 事業企画ノードは常に表示
        if (node.type === 'project') {
          return true;
        }
        
        const isComponentized = node.data?.isComponentized ?? false;
        if (filterMode === 'componentized') {
          return isComponentized;
        } else { // filterMode === 'fixed'
          return !isComponentized;
        }
      });
    }
    
    // 階層フィルター（ノードタイプ）
    filtered = filtered.filter(node => {
      return nodeTypeFilters[node.type];
    });
    
    // 事業企画フィルター
    if (selectedProjectIds.size > 0) {
      const projectNodeIds = new Set<string>();
      const relatedConceptIds = new Set<string>();
      const relatedSubMenuIds = new Set<string>();
      const relatedPageIds = new Set<string>();
      const relatedCompanyIds = new Set<string>();
      
      // 選択された事業企画ノードIDを収集
      nodes.forEach(node => {
        if (node.type === 'project') {
          const projectId = node.id.replace('project-', '');
          if (selectedProjectIds.has(projectId) || selectedProjectIds.has(node.id)) {
            projectNodeIds.add(node.id);
          }
        }
      });
      
      // 選択された事業企画に関連する構想ノードを収集
      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (link.type === 'project-concept' && projectNodeIds.has(sourceId)) {
          relatedConceptIds.add(targetId);
        }
        if (link.type === 'concept-subMenu' && relatedConceptIds.has(sourceId)) {
          relatedSubMenuIds.add(targetId);
        }
        if (link.type === 'subMenu-page' && relatedSubMenuIds.has(sourceId)) {
          relatedPageIds.add(targetId);
        }
        if (link.type === 'company-project' && projectNodeIds.has(targetId)) {
          relatedCompanyIds.add(sourceId);
        }
      });
      
      // 選択された事業企画に関連するノードのみを表示
      filtered = filtered.filter(node => {
        if (node.type === 'project') {
          return projectNodeIds.has(node.id);
        }
        if (node.type === 'concept') {
          return relatedConceptIds.has(node.id);
        }
        if (node.type === 'subMenu') {
          return relatedSubMenuIds.has(node.id);
        }
        if (node.type === 'page') {
          return relatedPageIds.has(node.id);
        }
        if (node.type === 'company') {
          return relatedCompanyIds.has(node.id);
        }
        return false;
      });
    }
    
    // 構想フィルター
    if (selectedConceptIds.size > 0) {
      const conceptNodeIds = new Set<string>();
      const relatedSubMenuIds = new Set<string>();
      const relatedPageIds = new Set<string>();
      const relatedProjectIds = new Set<string>();
      const relatedCompanyIds = new Set<string>();
      
      // 選択された構想ノードIDを収集
      nodes.forEach(node => {
        if (node.type === 'concept') {
          const conceptDocId = node.data?.docId;
          const conceptId = node.data?.conceptId || node.id.replace('concept-', '').replace('fixed-concept-', '');
          if (selectedConceptIds.has(node.id) || selectedConceptIds.has(conceptId) || (conceptDocId && selectedConceptIds.has(conceptDocId))) {
            conceptNodeIds.add(node.id);
          }
        }
      });
      
      // 選択された構想に関連するノードを収集
      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (link.type === 'concept-subMenu' && conceptNodeIds.has(sourceId)) {
          relatedSubMenuIds.add(targetId);
        }
        if (link.type === 'subMenu-page' && relatedSubMenuIds.has(sourceId)) {
          relatedPageIds.add(targetId);
        }
        if (link.type === 'project-concept' && conceptNodeIds.has(targetId)) {
          relatedProjectIds.add(sourceId);
        }
        if (link.type === 'company-project' && relatedProjectIds.has(targetId)) {
          relatedCompanyIds.add(sourceId);
        }
      });
      
      // 選択された構想に関連するノードのみを表示
      filtered = filtered.filter(node => {
        if (node.type === 'concept') {
          return conceptNodeIds.has(node.id);
        }
        if (node.type === 'subMenu') {
          return relatedSubMenuIds.has(node.id);
        }
        if (node.type === 'page') {
          return relatedPageIds.has(node.id);
        }
        if (node.type === 'project') {
          return relatedProjectIds.has(node.id);
        }
        if (node.type === 'company') {
          return relatedCompanyIds.has(node.id);
        }
        return false;
      });
    }
    
    // サブメニューフィルター
    if (selectedSubMenuIds.size > 0) {
      const subMenuNodeIds = new Set<string>();
      const relatedPageIds = new Set<string>();
      const relatedConceptIds = new Set<string>();
      const relatedProjectIds = new Set<string>();
      const relatedCompanyIds = new Set<string>();
      
      // 選択されたサブメニューノードIDを収集
      nodes.forEach(node => {
        if (node.type === 'subMenu' && selectedSubMenuIds.has(node.id)) {
          subMenuNodeIds.add(node.id);
        }
      });
      
      // 選択されたサブメニューに関連するノードを収集
      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (link.type === 'subMenu-page' && subMenuNodeIds.has(sourceId)) {
          relatedPageIds.add(targetId);
        }
        if (link.type === 'concept-subMenu' && subMenuNodeIds.has(targetId)) {
          relatedConceptIds.add(sourceId);
        }
        if (link.type === 'company-subMenu' && subMenuNodeIds.has(targetId)) {
          relatedCompanyIds.add(sourceId);
        }
        if (link.type === 'project-concept' && relatedConceptIds.has(targetId)) {
          relatedProjectIds.add(sourceId);
        }
        if (link.type === 'company-project' && relatedProjectIds.has(targetId)) {
          relatedCompanyIds.add(sourceId);
        }
      });
      
      // 選択されたサブメニューに関連するノードのみを表示
      filtered = filtered.filter(node => {
        if (node.type === 'subMenu') {
          return subMenuNodeIds.has(node.id);
        }
        if (node.type === 'page') {
          return relatedPageIds.has(node.id);
        }
        if (node.type === 'concept') {
          return relatedConceptIds.has(node.id);
        }
        if (node.type === 'project') {
          return relatedProjectIds.has(node.id);
        }
        if (node.type === 'company') {
          return relatedCompanyIds.has(node.id);
        }
        return false;
      });
    }
    
    // 会社フィルター
    if (selectedCompanyIds.size > 0) {
      const companyNodeIds = new Set<string>();
      const relatedProjectIds = new Set<string>();
      const relatedConceptIds = new Set<string>();
      const relatedSubMenuIds = new Set<string>();
      const relatedPageIds = new Set<string>();
      
      // 選択された会社ノードIDを収集
      nodes.forEach(node => {
        if (node.type === 'company') {
          const companyId = node.id.replace('company-', '');
          if (selectedCompanyIds.has(companyId) || selectedCompanyIds.has(node.id)) {
            companyNodeIds.add(node.id);
          }
        }
      });
      
      // 選択された会社に関連するノードを収集
      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (link.type === 'company-project' && companyNodeIds.has(sourceId)) {
          relatedProjectIds.add(targetId);
        }
        if (link.type === 'project-concept' && relatedProjectIds.has(sourceId)) {
          relatedConceptIds.add(targetId);
        }
        if (link.type === 'concept-subMenu' && relatedConceptIds.has(sourceId)) {
          relatedSubMenuIds.add(targetId);
        }
        if (link.type === 'subMenu-page' && relatedSubMenuIds.has(sourceId)) {
          relatedPageIds.add(targetId);
        }
        if (link.type === 'company-subMenu' && companyNodeIds.has(sourceId)) {
          relatedSubMenuIds.add(targetId);
        }
        if (link.type === 'subMenu-page' && relatedSubMenuIds.has(sourceId)) {
          relatedPageIds.add(targetId);
        }
      });
      
      // 選択された会社に関連するノードのみを表示
      filtered = filtered.filter(node => {
        if (node.type === 'company') {
          return companyNodeIds.has(node.id);
        }
        if (node.type === 'project') {
          return relatedProjectIds.has(node.id);
        }
        if (node.type === 'concept') {
          return relatedConceptIds.has(node.id);
        }
        if (node.type === 'subMenu') {
          return relatedSubMenuIds.has(node.id);
        }
        if (node.type === 'page') {
          return relatedPageIds.has(node.id);
        }
        return false;
      });
    }
    
    return filtered;
  }, [nodes, filterMode, nodeTypeFilters, selectedProjectIds, selectedConceptIds, selectedCompanyIds, selectedSubMenuIds, links]);

  const filteredLinks = useMemo(() => {
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    return links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });
  }, [links, filteredNodes]);

  // Force simulationの実行
  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0 || loading) return;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    // リンクの描画用グループ
    const linkGroup = svg.append('g').attr('class', 'links');
    // ノードの描画用グループ
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    // リンクのsource/targetをノードオブジェクトに変換（描画用）
    const linksWithNodes = filteredLinks.map((link) => {
      const sourceNode = filteredNodes.find((n) => n.id === (typeof link.source === 'string' ? link.source : link.source.id));
      const targetNode = filteredNodes.find((n) => n.id === (typeof link.target === 'string' ? link.target : link.target.id));
      return {
        source: sourceNode || link.source,
        target: targetNode || link.target,
        type: link.type,
      };
    }).filter((link) => link.source && link.target);

    // グラデーション定義を追加
    const defs = svg.append('defs');
    
    // リンク用のグラデーション
    const linkGradients = {
      'company-project': defs.append('linearGradient').attr('id', 'grad-company-project'),
      'project-concept': defs.append('linearGradient').attr('id', 'grad-project-concept'),
      'concept-servicePlan': defs.append('linearGradient').attr('id', 'grad-concept-servicePlan'),
      'project-servicePlan': defs.append('linearGradient').attr('id', 'grad-project-servicePlan'),
      'concept-subMenu': defs.append('linearGradient').attr('id', 'grad-concept-subMenu'),
      'company-subMenu': defs.append('linearGradient').attr('id', 'grad-company-subMenu'),
      'subMenu-page': defs.append('linearGradient').attr('id', 'grad-subMenu-page'),
    };
    
    Object.entries(linkGradients).forEach(([type, gradient]) => {
      const colors: { [key: string]: [string, string] } = {
        'company-project': ['#4A90E2', '#6BA3F0'],
        'project-concept': ['#50C878', '#6FD88F'],
        'concept-servicePlan': ['#FF6B6B', '#FF8E8E'],
        'project-servicePlan': ['#FFA500', '#FFB84D'],
        'concept-subMenu': ['#FF7B7B', '#E67E22'],
        'company-subMenu': ['#5BA0F2', '#E67E22'],
        'subMenu-page': ['#E67E22', '#9B59B6'],
      };
      gradient
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%');
      gradient.append('stop').attr('offset', '0%').attr('stop-color', colors[type][0]).attr('stop-opacity', 0.6);
      gradient.append('stop').attr('offset', '100%').attr('stop-color', colors[type][1]).attr('stop-opacity', 0.3);
    });
    
    // ノード用のグラデーション
    const nodeGradients = {
      company: defs.append('radialGradient').attr('id', 'grad-company'),
      project: defs.append('radialGradient').attr('id', 'grad-project'),
      concept: defs.append('radialGradient').attr('id', 'grad-concept'),
      servicePlan: defs.append('radialGradient').attr('id', 'grad-servicePlan'),
    };
    
    Object.entries(nodeGradients).forEach(([type, gradient]) => {
      const colors: { [key: string]: [string, string] } = {
        company: ['#5BA0F2', '#3A7BC8'],
        project: ['#60D88A', '#40B86A'],
        concept: ['#FF7B7B', '#E55A5A'],
        servicePlan: ['#FFB84D', '#E5951F'],
      };
      gradient
        .attr('cx', '30%')
        .attr('cy', '30%')
        .attr('r', '70%');
      gradient.append('stop').attr('offset', '0%').attr('stop-color', colors[type][0]);
      gradient.append('stop').attr('offset', '100%').attr('stop-color', colors[type][1]);
    });
    
    // フィルター（シャドウ）は一旦削除（色が正しく表示されることを確認）
    
    // リンクを描画（パスとして描画してグラデーションを適用）
    const linkElements = linkGroup
      .selectAll('line')
      .data(linksWithNodes)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        if (d.type === 'company-project') return 'url(#grad-company-project)';
        if (d.type === 'project-concept') return 'url(#grad-project-concept)';
        if (d.type === 'concept-servicePlan') return 'url(#grad-concept-servicePlan)';
        if (d.type === 'project-servicePlan') return 'url(#grad-project-servicePlan)';
        if (d.type === 'concept-subMenu') return 'url(#grad-concept-subMenu)';
        if (d.type === 'company-subMenu') return 'url(#grad-company-subMenu)';
        if (d.type === 'subMenu-page') return 'url(#grad-subMenu-page)';
        return '#999';
      })
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', (d) => {
        if (d.type === 'company-project') return 3;
        if (d.type === 'project-concept') return 2.5;
        if (d.type === 'concept-servicePlan') return 2;
        if (d.type === 'project-servicePlan') return 1.5;
        if (d.type === 'concept-subMenu') return 2;
        if (d.type === 'company-subMenu') return 2;
        if (d.type === 'subMenu-page') return 1.5;
        return 1.5;
      })
      .style('transition', 'all 0.3s ease')
      .on('mouseenter', function() {
        select(this).attr('stroke-width', (d: any) => {
          if (d.type === 'company-project') return 4;
          if (d.type === 'project-concept') return 3.5;
          if (d.type === 'concept-servicePlan') return 3;
          if (d.type === 'project-servicePlan') return 2.5;
          if (d.type === 'concept-subMenu') return 3;
          if (d.type === 'company-subMenu') return 3;
          if (d.type === 'subMenu-page') return 2.5;
          return 2;
        }).attr('stroke-opacity', 1);
      })
      .on('mouseleave', function() {
        select(this).attr('stroke-width', (d: any) => {
          if (d.type === 'company-project') return 3;
          if (d.type === 'project-concept') return 2.5;
          if (d.type === 'concept-servicePlan') return 2;
          if (d.type === 'project-servicePlan') return 1.5;
          if (d.type === 'concept-subMenu') return 2;
          if (d.type === 'company-subMenu') return 2;
          if (d.type === 'subMenu-page') return 1.5;
          return 1.5;
        }).attr('stroke-opacity', 0.7);
      });

    // ノードを描画（構想ノードは初期状態で非表示）
    const nodeElements = nodeGroup
      .selectAll('circle')
      .data(filteredNodes)
      .enter()
      .append('circle')
      .attr('r', (d) => {
        if (d.type === 'company') return 32;
        if (d.type === 'project') return 22;
        if (d.type === 'concept') return 14;
        if (d.type === 'servicePlan') return 12;
        if (d.type === 'subMenu') return 12;
        if (d.type === 'page') return 10;
        return 12;
      })
      .attr('fill', (d) => {
        // より鮮やかな色を直接使用
        if (d.type === 'company') return '#5BA0F2';
        if (d.type === 'project') return '#60D88A';
        if (d.type === 'concept') return '#FF7B7B';
        if (d.type === 'servicePlan') return '#FFB84D';
        if (d.type === 'subMenu') return '#E67E22';
        if (d.type === 'page') return '#9B59B6';
        return colorScale(d.type);
      })
      .attr('fill-opacity', 1)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', (d) => {
        if (d.type === 'company') return 3;
        if (d.type === 'project') return 2.5;
        return 2;
      })
      // フィルターは一旦無効化（色が正しく表示されることを確認）
      .style('cursor', 'pointer')
      .style('transition', 'all 0.3s ease')
      .call(
        (selection: any) =>
          (selection as any).on('mouseover', function (this: SVGCircleElement, event: MouseEvent, d: GraphNode) {
            const node = select(this);
            if (d.type === 'company') {
              node.attr('stroke-width', 4).attr('r', 38);
            } else if (d.type === 'project') {
              node.attr('stroke-width', 3.5).attr('r', 26);
            } else if (d.type === 'concept') {
              node.attr('stroke-width', 3).attr('r', 17);
            } else if (d.type === 'servicePlan') {
              node.attr('stroke-width', 3).attr('r', 15);
            } else if (d.type === 'subMenu') {
              node.attr('stroke-width', 2.5).attr('r', 14);
            } else if (d.type === 'page') {
              node.attr('stroke-width', 2.5).attr('r', 12);
            } else {
              node.attr('stroke-width', 3).attr('r', 15);
            }
            // node.attr('filter', 'url(#node-shadow)'); // フィルター無効化
            // ツールチップを表示
            const svgRect = svgRef.current?.getBoundingClientRect();
            if (svgRect) {
              setTooltip({
                x: event.clientX - svgRect.left,
                y: event.clientY - svgRect.top - 10,
                data: d,
              });
            }
          }) as any
      )
      .call(
        (selection: any) =>
          (selection as any).on('mouseout', function (this: SVGCircleElement, event: MouseEvent, d: GraphNode) {
            const node = select(this);
            if (d.type === 'company') {
              node.attr('stroke-width', 3).attr('r', 32);
            } else if (d.type === 'project') {
              node.attr('stroke-width', 2.5).attr('r', 22);
            } else if (d.type === 'concept') {
              node.attr('stroke-width', 2).attr('r', 14);
            } else if (d.type === 'servicePlan') {
              node.attr('stroke-width', 2).attr('r', 12);
            } else if (d.type === 'subMenu') {
              node.attr('stroke-width', 2).attr('r', 12);
            } else if (d.type === 'page') {
              node.attr('stroke-width', 2).attr('r', 10);
            } else {
              node.attr('stroke-width', 2).attr('r', 12);
            }
            // ツールチップを非表示
            setTooltip(null);
          }) as any
      );

    // ラベルを描画（構想ノードのラベルは初期状態で非表示）
    const labelElements = nodeGroup
      .selectAll('text')
      .data(filteredNodes)
      .enter()
      .append('text')
      .text((d) => d.label)
      .attr('dx', (d) => {
        if (d.type === 'company') return 35;
        if (d.type === 'project') return 24;
        if (d.type === 'concept') return 15;
        if (d.type === 'servicePlan') return 13;
        if (d.type === 'subMenu') return 13;
        if (d.type === 'page') return 12;
        return 15;
      })
      .attr('font-size', (d) => {
        if (d.type === 'company') return '18px';
        if (d.type === 'project') return '16px';
        if (d.type === 'subMenu') return '12px';
        if (d.type === 'page') return '11px';
        return '13px';
      })
      .attr('dy', 4)
      .attr('fill', '#1a1a1a')
      .attr('font-weight', (d) => {
        if (d.type === 'company') return '600';
        if (d.type === 'project') return '500';
        return '400';
      })
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .style('font-family', "'Inter', 'Noto Sans JP', -apple-system, sans-serif");

    // Force simulationを設定（リンクのsource/targetをノードオブジェクトに変換）
    const simulationLinks = linksWithNodes.map((link) => ({
      source: typeof link.source === 'string' 
        ? filteredNodes.find((n) => n.id === link.source) || link.source
        : link.source,
      target: typeof link.target === 'string'
        ? filteredNodes.find((n) => n.id === link.target) || link.target
        : link.target,
      type: link.type,
    })).filter((link) => link.source && link.target);

    // マージンを設定
    const margin = 50;
    const boundsWidth = width - margin * 2;
    const boundsHeight = height - margin * 2;

    const simulation = forceSimulation(filteredNodes as any)
      .force(
        'link',
        forceLink(simulationLinks as any)
          .id((d: any) => d.id)
          .distance((link: any) => {
            if (link.type === 'company-project') return 150;
            if (link.type === 'project-concept') return 100;
            if (link.type === 'concept-servicePlan') return 70;
            if (link.type === 'project-servicePlan') return 90;
            if (link.type === 'concept-subMenu') return 80;
            if (link.type === 'company-subMenu') return 80;
            if (link.type === 'subMenu-page') return 60;
            return 80;
          })
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(width / 2, height / 2))
        .force('collision', forceCollide().radius((d: any) => {
        if (d.type === 'company') return 35;
        if (d.type === 'project') return 24;
        if (d.type === 'concept') return 15;
        if (d.type === 'servicePlan') return 13;
        if (d.type === 'subMenu') return 13;
        if (d.type === 'page') return 11;
        return 12;
      }));

    // シミュレーションの更新
    simulation.on('tick', () => {
      // ノードの位置を境界内に制限
      filteredNodes.forEach((node: any) => {
        if (node.x < margin) node.x = margin;
        if (node.x > width - margin) node.x = width - margin;
        if (node.y < margin) node.y = margin;
        if (node.y > height - margin) node.y = height - margin;
      });

      linkElements
        .attr('x1', (d: any) => {
          const source = typeof d.source === 'object' ? d.source : filteredNodes.find(n => n.id === d.source);
          return source?.x || 0;
        })
        .attr('y1', (d: any) => {
          const source = typeof d.source === 'object' ? d.source : filteredNodes.find(n => n.id === d.source);
          return source?.y || 0;
        })
        .attr('x2', (d: any) => {
          const target = typeof d.target === 'object' ? d.target : filteredNodes.find(n => n.id === d.target);
          return target?.x || 0;
        })
        .attr('y2', (d: any) => {
          const target = typeof d.target === 'object' ? d.target : filteredNodes.find(n => n.id === d.target);
          return target?.y || 0;
        });

      nodeElements.attr('cx', (d: any) => d.x || 0).attr('cy', (d: any) => d.y || 0);

      labelElements.attr('x', (d: any) => d.x || 0).attr('y', (d: any) => d.y || 0);
    });

    // クリックイベントを追加（企画ノードをクリックすると構想ノードを表示）
    nodeElements.on('click', function (event: MouseEvent, d: GraphNode) {
      if (d.type === 'project') {
        const projectId = d.id;
        const relatedConcepts = links
          .filter(link => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;
            return (sourceId === projectId && link.type === 'project-concept') ||
                   (targetId === projectId && link.type === 'project-concept');
          })
          .map(link => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;
            return sourceId === projectId ? targetId : sourceId;
          });
        
        // 構想ノードは常に表示されているため、クリックイベントは不要
        // シミュレーションを再起動してノードを再配置
        simulation.alpha(1).restart();
      } else if (d.type === 'concept' && !d.data?.isComponentized) {
        // 固定ページ形式の構想ノードをクリックしたときに、その構想のoverviewページをモーダルで表示
        const serviceId = d.data?.serviceId;
        const conceptId = d.data?.conceptId || d.id.replace('concept-', '').replace('fixed-concept-', '');
        const conceptLabel = d.label;
        
        if (serviceId && conceptId) {
          setModalFixedConcept({
            serviceId,
            conceptId,
            conceptLabel,
          });
        }
      }
    });

    // ダブルクリックイベントを追加（ページノード、サブメニューノード、構想ノードをダブルクリックするとモーダルで表示）
    nodeElements.on('dblclick', function (event: MouseEvent, d: GraphNode) {
      if (d.type === 'page' && d.data?.pageContent) {
        setModalPage({
          title: d.data.pageTitle || d.label,
          content: d.data.pageContent,
          pageId: d.data.pageId,
          pageNumber: d.data.pageNumber || 0,
        });
      } else if (d.type === 'concept') {
        // 構想ノードをダブルクリックしたときに、その構想のページをモーダルで表示
        const serviceId = d.data?.serviceId;
        const conceptId = d.data?.conceptId || d.id.replace('concept-', '').replace('fixed-concept-', '');
        const conceptLabel = d.label;
        const isComponentized = d.data?.isComponentized ?? false;
        
        if (serviceId && conceptId) {
          if (isComponentized) {
            // コンポーネント形式の構想の場合、overviewページをモーダルで表示
            setModalFixedConcept({
              serviceId,
              conceptId,
              conceptLabel,
            });
          } else {
            // 固定ページ形式の構想の場合、overviewページをモーダルで表示
            setModalFixedConcept({
              serviceId,
              conceptId,
              conceptLabel,
            });
          }
        }
      } else if (d.type === 'subMenu') {
        if (d.data?.isComponentized && d.data?.pages && Array.isArray(d.data.pages) && d.data.pages.length > 0) {
          // コンポーネント形式のサブメニューノードをダブルクリックすると、そのサブメニューに属するページをモーダルで表示
          const pages = d.data.pages.map((page: any) => ({
            title: page.title || `ページ ${page.pageNumber || ''}`,
            content: page.content || '',
            pageId: page.id,
            pageNumber: page.pageNumber || 0,
          }));
          setModalSubMenuPages(pages);
        } else if (!d.data?.isComponentized) {
          // 固定ページ形式のサブメニューノードをダブルクリックすると、そのページをモーダルで表示
          const serviceId = d.data?.serviceId;
          const conceptId = d.data?.conceptId;
          const subMenuId = d.data?.subMenuId;
          const subMenuLabel = d.data?.subMenuLabel || d.label;
          
          if (serviceId && conceptId && subMenuId) {
            setModalFixedPage({
              serviceId,
              conceptId,
              subMenuId,
              subMenuLabel,
            });
          }
        }
      }
    });

    // ドラッグ機能を追加
    const dragHandler = drag<SVGCircleElement, GraphNode>()
      .on('start', function (event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on('drag', function (event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on('end', function (event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });

    nodeElements.call(dragHandler);

    simulationRef.current = simulation;

    // クリーンアップ
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [filteredNodes, filteredLinks, width, height, colorScale, loading]);

  if (loading) {
    return (
      <div style={{ width: '100%', padding: '40px', textAlign: 'center' }}>
        <p>データを読み込み中...</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div style={{ width: '100%', padding: '40px', textAlign: 'center' }}>
        <p>データがありません。会社、事業企画、構想を作成してください。</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflow: 'hidden', padding: '20px' }}>
      {title && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600',
              color: '#1a1a1a',
              fontFamily: "'Inter', 'Noto Sans JP', -apple-system, sans-serif",
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              {title}
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setFilterMode('all')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: filterMode === 'all' ? '#4A90E2' : '#f0f0f0',
                  color: filterMode === 'all' ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                すべて
              </button>
              <button
                onClick={() => setFilterMode('fixed')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: filterMode === 'fixed' ? '#4A90E2' : '#f0f0f0',
                  color: filterMode === 'fixed' ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                固定ページ形式
              </button>
              <button
                onClick={() => setFilterMode('componentized')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: filterMode === 'componentized' ? '#4A90E2' : '#f0f0f0',
                  color: filterMode === 'componentized' ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                コンポーネント形式
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#666', marginRight: '4px' }}>表示する階層:</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={nodeTypeFilters.company}
                onChange={(e) => setNodeTypeFilters(prev => ({ ...prev, company: e.target.checked }))}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>会社</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={nodeTypeFilters.project}
                onChange={(e) => setNodeTypeFilters(prev => ({ ...prev, project: e.target.checked }))}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>事業企画</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={nodeTypeFilters.concept}
                onChange={(e) => setNodeTypeFilters(prev => ({ ...prev, concept: e.target.checked }))}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>構想</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={nodeTypeFilters.subMenu}
                onChange={(e) => setNodeTypeFilters(prev => ({ ...prev, subMenu: e.target.checked }))}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>サブメニュー</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={nodeTypeFilters.page}
                onChange={(e) => setNodeTypeFilters(prev => ({ ...prev, page: e.target.checked }))}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>ページ</span>
            </label>
          </div>
          {/* フィルターセクション（折りたたみ可能） */}
          <div style={{ marginTop: '12px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#f9f9f9' }}>
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              style={{
                width: '100%',
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#333',
              }}
            >
              <span>詳細フィルター</span>
              <span style={{ fontSize: '12px', color: '#666' }}>{isFilterExpanded ? '▼' : '▶'}</span>
            </button>
            {isFilterExpanded && (
              <div style={{ padding: '12px', borderTop: '1px solid #e0e0e0' }}>
                {/* 会社フィルター */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#666', marginRight: '4px', minWidth: '100px' }}>会社で絞り込み:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fff', flex: 1 }}>
                    {nodes.filter(n => {
                      if (n.type !== 'company') return false;
                      if (filterMode === 'all') return true;
                      const isComponentized = n.data?.isComponentized ?? false;
                      if (filterMode === 'componentized') return isComponentized;
                      if (filterMode === 'fixed') return !isComponentized;
                      return true;
                    }).map(companyNode => {
                      const companyId = companyNode.id.replace('company-', '');
                      const isSelected = selectedCompanyIds.has(companyId) || selectedCompanyIds.has(companyNode.id);
                      return (
                        <label key={companyNode.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSet = new Set(selectedCompanyIds);
                              if (e.target.checked) {
                                newSet.add(companyId);
                                newSet.add(companyNode.id);
                              } else {
                                newSet.delete(companyId);
                                newSet.delete(companyNode.id);
                              }
                              setSelectedCompanyIds(newSet);
                            }}
                            style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                          />
                          <span style={{ color: '#333' }}>{companyNode.label}</span>
                        </label>
                      );
                    })}
                    {nodes.filter(n => {
                      if (n.type !== 'company') return false;
                      if (filterMode === 'all') return true;
                      const isComponentized = n.data?.isComponentized ?? false;
                      if (filterMode === 'componentized') return isComponentized;
                      if (filterMode === 'fixed') return !isComponentized;
                      return true;
                    }).length === 0 && (
                      <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>会社がありません</span>
                    )}
                  </div>
                </div>
                {/* 事業企画フィルター */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#666', marginRight: '4px', minWidth: '100px' }}>事業企画で絞り込み:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fff', flex: 1 }}>
                    {nodes.filter(n => n.type === 'project').map(projectNode => {
                      const projectId = projectNode.id.replace('project-', '');
                      const isSelected = selectedProjectIds.has(projectId) || selectedProjectIds.has(projectNode.id);
                      return (
                        <label key={projectNode.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSet = new Set(selectedProjectIds);
                              if (e.target.checked) {
                                newSet.add(projectId);
                                newSet.add(projectNode.id);
                              } else {
                                newSet.delete(projectId);
                                newSet.delete(projectNode.id);
                              }
                              setSelectedProjectIds(newSet);
                            }}
                            style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                          />
                          <span style={{ color: '#333' }}>{projectNode.label}</span>
                        </label>
                      );
                    })}
                    {nodes.filter(n => n.type === 'project').length === 0 && (
                      <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>事業企画がありません</span>
                    )}
                  </div>
                </div>
                {/* 構想フィルター */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#666', marginRight: '4px', minWidth: '100px' }}>構想で絞り込み:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fff', flex: 1 }}>
                    {nodes.filter(n => {
                      if (n.type !== 'concept') return false;
                      if (filterMode === 'all') return true;
                      const isComponentized = n.data?.isComponentized ?? false;
                      if (filterMode === 'componentized') return isComponentized;
                      if (filterMode === 'fixed') return !isComponentized;
                      return true;
                    }).map(conceptNode => {
                      const conceptDocId = conceptNode.data?.docId;
                      const conceptId = conceptNode.data?.conceptId || conceptNode.id.replace('concept-', '').replace('fixed-concept-', '');
                      const isSelected = selectedConceptIds.has(conceptNode.id) || selectedConceptIds.has(conceptId) || (conceptDocId && selectedConceptIds.has(conceptDocId));
                      return (
                        <label key={conceptNode.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSet = new Set(selectedConceptIds);
                              if (e.target.checked) {
                                newSet.add(conceptNode.id);
                                newSet.add(conceptId);
                                if (conceptDocId) newSet.add(conceptDocId);
                              } else {
                                newSet.delete(conceptNode.id);
                                newSet.delete(conceptId);
                                if (conceptDocId) newSet.delete(conceptDocId);
                              }
                              setSelectedConceptIds(newSet);
                            }}
                            style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                          />
                          <span style={{ color: '#333' }}>{conceptNode.label}</span>
                        </label>
                      );
                    })}
                    {nodes.filter(n => {
                      if (n.type !== 'concept') return false;
                      if (filterMode === 'all') return true;
                      const isComponentized = n.data?.isComponentized ?? false;
                      if (filterMode === 'componentized') return isComponentized;
                      if (filterMode === 'fixed') return !isComponentized;
                      return true;
                    }).length === 0 && (
                      <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>構想がありません</span>
                    )}
                  </div>
                </div>
                {/* サブメニューフィルター */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#666', marginRight: '4px', minWidth: '100px' }}>サブメニューで絞り込み:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fff', flex: 1 }}>
                    {nodes.filter(n => {
                      if (n.type !== 'subMenu') return false;
                      if (filterMode === 'all') return true;
                      const isComponentized = n.data?.isComponentized ?? false;
                      if (filterMode === 'componentized') return isComponentized;
                      if (filterMode === 'fixed') return !isComponentized;
                      return true;
                    }).map(subMenuNode => {
                      const subMenuId = subMenuNode.id;
                      const isSelected = selectedSubMenuIds.has(subMenuId);
                      return (
                        <label key={subMenuNode.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSet = new Set(selectedSubMenuIds);
                              if (e.target.checked) {
                                newSet.add(subMenuId);
                              } else {
                                newSet.delete(subMenuId);
                              }
                              setSelectedSubMenuIds(newSet);
                            }}
                            style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                          />
                          <span style={{ color: '#333' }}>{subMenuNode.label}</span>
                        </label>
                      );
                    })}
                    {nodes.filter(n => {
                      if (n.type !== 'subMenu') return false;
                      if (filterMode === 'all') return true;
                      const isComponentized = n.data?.isComponentized ?? false;
                      if (filterMode === 'componentized') return isComponentized;
                      if (filterMode === 'fixed') return !isComponentized;
                      return true;
                    }).length === 0 && (
                      <span style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>サブメニューがありません</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div style={{ width: '100%', maxWidth: `${width}px`, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', border: 'none', borderRadius: '12px', backgroundColor: '#ffffff', overflow: 'visible', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}
          xmlns="http://www.w3.org/2000/svg"
        />
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -100%)',
              background: 'rgba(26, 26, 26, 0.95)',
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              pointerEvents: 'none',
              zIndex: 1000,
              maxWidth: '280px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(10px)',
              fontFamily: "'Inter', 'Noto Sans JP', -apple-system, sans-serif",
              lineHeight: '1.5',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: colorScale(tooltip.data.type) }}>
              {tooltip.data.type === 'company' && '会社'}
              {tooltip.data.type === 'project' && '事業企画'}
              {tooltip.data.type === 'concept' && '構想'}
              {tooltip.data.type === 'servicePlan' && 'サービス計画'}
              {tooltip.data.type === 'subMenu' && 'サブメニュー'}
              {tooltip.data.type === 'page' && 'ページ'}
            </div>
            <div style={{ marginBottom: '4px' }}>{tooltip.data.label}</div>
            {tooltip.data.data?.description && (
              <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '4px' }}>
                {tooltip.data.data.description.substring(0, 100)}
                {tooltip.data.data.description.length > 100 ? '...' : ''}
              </div>
            )}
            {tooltip.data.data?.serviceId && (
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
                サービスID: {tooltip.data.data.serviceId}
              </div>
            )}
            {tooltip.data.data?.conceptId && (
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
                構想ID: {tooltip.data.data.conceptId}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
        <div style={{ display: 'inline-flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #5BA0F2, #3A7BC8)',
                boxShadow: '0 2px 4px rgba(58, 123, 200, 0.3)',
              }}
            />
            <span style={{ fontFamily: "'Inter', 'Noto Sans JP', -apple-system, sans-serif", fontWeight: '500' }}>会社</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #60D88A, #40B86A)',
                boxShadow: '0 2px 4px rgba(64, 184, 106, 0.3)',
              }}
            />
            <span style={{ fontFamily: "'Inter', 'Noto Sans JP', -apple-system, sans-serif", fontWeight: '500' }}>事業企画</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #FF7B7B, #E55A5A)',
                boxShadow: '0 2px 4px rgba(229, 90, 90, 0.3)',
              }}
            />
            <span style={{ fontFamily: "'Inter', 'Noto Sans JP', -apple-system, sans-serif", fontWeight: '500' }}>構想</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #E67E22, #D35400)',
                boxShadow: '0 2px 4px rgba(230, 126, 34, 0.3)',
              }}
            />
            <span style={{ fontFamily: "'Inter', 'Noto Sans JP', -apple-system, sans-serif", fontWeight: '500' }}>サブメニュー</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #9B59B6, #8E44AD)',
                boxShadow: '0 2px 4px rgba(155, 89, 182, 0.3)',
              }}
            />
            <span style={{ fontFamily: "'Inter', 'Noto Sans JP', -apple-system, sans-serif", fontWeight: '500' }}>ページ</span>
          </div>
          </div>
        <p style={{ marginTop: '12px', fontSize: '13px', color: '#888', fontFamily: "'Inter', 'Noto Sans JP', -apple-system, sans-serif" }}>
          ノードをドラッグして移動できます。構想ノード、サブメニューノード、ページノードをダブルクリックすると詳細を表示します。
        </p>
      </div>
      
      {/* ページモーダル */}
      {modalPage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalPage(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '1600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
                {modalPage.title}
              </h3>
              <button
                onClick={() => setModalPage(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px 8px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
              <DynamicPage
                pageId={modalPage.pageId}
                pageNumber={modalPage.pageNumber}
                title={modalPage.title}
                content={modalPage.content}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* サブメニューページモーダル */}
      {modalSubMenuPages && modalSubMenuPages.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalSubMenuPages(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '1600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
                サブメニューのページ一覧 ({modalSubMenuPages.length}件)
              </h3>
              <button
                onClick={() => setModalSubMenuPages(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px 8px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
              {modalSubMenuPages.map((page, index) => (
                <div key={page.pageId} style={{ marginBottom: index < modalSubMenuPages.length - 1 ? '40px' : 0 }}>
                  <DynamicPage
                    pageId={page.pageId}
                    pageNumber={page.pageNumber}
                    title={page.title}
                    content={page.content}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* サブメニューページモーダル */}
      {modalSubMenuPages && modalSubMenuPages.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalSubMenuPages(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '1600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
                サブメニューのページ一覧 ({modalSubMenuPages.length}件)
              </h3>
              <button
                onClick={() => setModalSubMenuPages(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px 8px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
              {modalSubMenuPages.map((page, index) => (
                <div key={page.pageId} style={{ marginBottom: index < modalSubMenuPages.length - 1 ? '40px' : 0 }}>
                  <DynamicPage
                    pageId={page.pageId}
                    pageNumber={page.pageNumber}
                    title={page.title}
                    content={page.content}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 固定ページ形式のサブメニューモーダル */}
      {modalFixedPage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalFixedPage(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '1600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
                {modalFixedPage.subMenuLabel}
              </h3>
              <button
                onClick={() => setModalFixedPage(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px 8px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
              <iframe
                src={`/business-plan/services/${modalFixedPage.serviceId}/${modalFixedPage.conceptId}/${modalFixedPage.subMenuId}?modal=true&hideSidebar=true`}
                style={{
                  width: '100%',
                  height: '70vh',
                  border: 'none',
                  borderRadius: '8px',
                }}
                title={modalFixedPage.subMenuLabel}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* 固定ページ形式の構想モーダル */}
      {modalFixedConcept && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalFixedConcept(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '1600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
                {modalFixedConcept.conceptLabel}
              </h3>
              <button
                onClick={() => setModalFixedConcept(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '4px 8px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
              <iframe
                src={`/business-plan/services/${modalFixedConcept.serviceId}/${modalFixedConcept.conceptId}/overview?modal=true`}
                style={{
                  width: '100%',
                  height: '70vh',
                  border: 'none',
                  borderRadius: '8px',
                }}
                title={modalFixedConcept.conceptLabel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

