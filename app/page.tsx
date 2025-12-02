'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import ForceDirectedGraph3D from '@/components/ForceDirectedGraph3D';
import ForceDirectedGraph from '@/components/ForceDirectedGraph';

// 固定構想の定義（app/business-plan/page.tsxと同じ）
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

export default function DashboardPage() {
  const [businessProjectsCount, setBusinessProjectsCount] = useState<number>(0);
  const [conceptsCount, setConceptsCount] = useState<number>(0);
  const [conceptsFixedCount, setConceptsFixedCount] = useState<number>(0);
  const [conceptsComponentizedCount, setConceptsComponentizedCount] = useState<number>(0);
  const [conceptsComponentizedPagesCount, setConceptsComponentizedPagesCount] = useState<number>(0);
  const [servicePlansCount, setServicePlansCount] = useState<number>(0);
  const [servicePlansFixedCount, setServicePlansFixedCount] = useState<number>(0);
  const [servicePlansComponentizedCount, setServicePlansComponentizedCount] = useState<number>(0);
  const [servicePlansComponentizedPagesCount, setServicePlansComponentizedPagesCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const loadCounts = useCallback(async () => {
    if (!auth || !db) {
      console.log('Dashboard: authまたはdbが未初期化');
      setLoading(false);
      return;
    }

    // 認証状態を待つ
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('Dashboard: ユーザーが未認証');
      setLoading(false);
      return;
    }

    try {
      const userId = currentUser.uid;
      console.log('Dashboard: カウント取得開始', { userId });

      // 事業企画の数を取得（動的に追加されたもの + 固定サービス）
      let businessProjectsCount = 0;
      try {
        const businessProjectsQuery = query(
          collection(db, 'businessProjects'),
          where('userId', '==', userId)
        );
        const businessProjectsSnapshot = await getDocs(businessProjectsQuery);
        businessProjectsCount = businessProjectsSnapshot.size;
        console.log('Dashboard: 動的事業企画数', businessProjectsCount, businessProjectsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error: any) {
        console.error('Dashboard: 事業企画取得エラー:', error);
      }
      
      // 固定サービス（SPECIAL_SERVICES）もカウントに含める
      // 自社開発・自社サービス事業、AI駆動開発・DX支援SI事業、プロセス可視化・業務コンサル事業、AI導入ルール設計・人材育成・教育事業
      const fixedServicesCount = 4;
      const totalBusinessProjects = businessProjectsCount + fixedServicesCount;
      console.log('Dashboard: 事業企画総数（動的 + 固定）', totalBusinessProjects);
      setBusinessProjectsCount(totalBusinessProjects);

      // 構想の数を取得（動的に追加されたもの + 固定構想）
      // 固定ページ形式とコンポーネント形式で分けてカウント
      // 固定構想のconceptIdを収集（重複カウントを防ぐため）
      const fixedConceptIds = new Set<string>();
      Object.keys(FIXED_CONCEPTS).forEach((serviceId) => {
        FIXED_CONCEPTS[serviceId].forEach((concept) => {
          fixedConceptIds.add(concept.id);
        });
      });

      let dynamicConceptsFixedCount = 0;
      let dynamicConceptsComponentizedCount = 0;
      let conceptsComponentizedPagesCount = 0;
      try {
        const conceptsQuery = query(
          collection(db, 'concepts'),
          where('userId', '==', userId)
        );
        const conceptsSnapshot = await getDocs(conceptsQuery);
        // 固定構想と同じconceptIdを持つ構想は除外
        conceptsSnapshot.forEach((doc) => {
          const data = doc.data();
          const conceptId = data.conceptId;
          if (!fixedConceptIds.has(conceptId)) {
            const pagesBySubMenu = data.pagesBySubMenu;
            const isComponentized = pagesBySubMenu && 
              typeof pagesBySubMenu === 'object' && 
              Object.keys(pagesBySubMenu).length > 0 &&
              Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
            if (isComponentized) {
              dynamicConceptsComponentizedCount++;
              // ページ数を集計
              if (pagesBySubMenu && typeof pagesBySubMenu === 'object') {
                Object.values(pagesBySubMenu).forEach((pages: any) => {
                  if (Array.isArray(pages)) {
                    conceptsComponentizedPagesCount += pages.length;
                  }
                });
              }
            } else {
              dynamicConceptsFixedCount++;
            }
          }
        });
        console.log('Dashboard: 動的構想数（固定構想除外後）', { fixed: dynamicConceptsFixedCount, componentized: dynamicConceptsComponentizedCount, pages: conceptsComponentizedPagesCount }, conceptsSnapshot.docs.map(d => ({ id: d.id, conceptId: d.data().conceptId, ...d.data() })));
      } catch (error: any) {
        console.error('Dashboard: 構想取得エラー:', error);
      }
      
      // 固定構想もカウントに含める（固定構想は固定ページ形式として扱う）
      // 自社開発・自社サービス事業: 2つ（出産支援、介護支援）
      // AI駆動開発・DX支援SI事業: 2つ（医療法人向けDX、中小企業向けDX）
      // プロセス可視化・業務コンサル事業: 2つ（中小企業向け、医療・介護施設向け）
      // AI導入ルール設計・人材育成・教育事業: 3つ（大企業向けAI人材育成、AI導入ルール設計、中小企業向けAI導入支援）
      const fixedConceptsCount = 2 + 2 + 2 + 3; // 9つ
      const conceptsFixedCount = dynamicConceptsFixedCount + fixedConceptsCount;
      const conceptsComponentizedCount = dynamicConceptsComponentizedCount;
      const totalConcepts = conceptsFixedCount + conceptsComponentizedCount;
      console.log('Dashboard: 構想総数（動的 + 固定）', totalConcepts, { fixed: conceptsFixedCount, componentized: conceptsComponentizedCount, pages: conceptsComponentizedPagesCount, dynamicFixed: dynamicConceptsFixedCount, dynamicComponentized: dynamicConceptsComponentizedCount, fixedConceptsCount });
      setConceptsCount(totalConcepts);
      setConceptsFixedCount(conceptsFixedCount);
      setConceptsComponentizedCount(conceptsComponentizedCount);
      setConceptsComponentizedPagesCount(conceptsComponentizedPagesCount);

      // 事業計画の数を取得（会社全体の事業計画のみ）
      // 固定ページ形式とコンポーネント形式で分けてカウント
      let servicePlansFixedCount = 0;
      let servicePlansComponentizedCount = 0;
      let servicePlansComponentizedPagesCount = 0;
      try {
        const companyPlansQuery = query(
          collection(db, 'companyBusinessPlan'),
          where('userId', '==', userId)
        );
        const companyPlansSnapshot = await getDocs(companyPlansQuery);
        companyPlansSnapshot.forEach((doc) => {
          const data = doc.data();
          const pagesBySubMenu = data.pagesBySubMenu;
          const isComponentized = pagesBySubMenu && 
            typeof pagesBySubMenu === 'object' && 
            Object.keys(pagesBySubMenu).length > 0 &&
            Object.values(pagesBySubMenu).some((pages: any) => Array.isArray(pages) && pages.length > 0);
          if (isComponentized) {
            servicePlansComponentizedCount++;
            // ページ数を集計
            if (pagesBySubMenu && typeof pagesBySubMenu === 'object') {
              Object.values(pagesBySubMenu).forEach((pages: any) => {
                if (Array.isArray(pages)) {
                  servicePlansComponentizedPagesCount += pages.length;
                }
              });
            }
          } else {
            servicePlansFixedCount++;
          }
        });
        const servicePlansCount = servicePlansFixedCount + servicePlansComponentizedCount;
        console.log('Dashboard: 会社事業計画数', servicePlansCount, { fixed: servicePlansFixedCount, componentized: servicePlansComponentizedCount, pages: servicePlansComponentizedPagesCount });
        setServicePlansCount(servicePlansCount);
        setServicePlansFixedCount(servicePlansFixedCount);
        setServicePlansComponentizedCount(servicePlansComponentizedCount);
        setServicePlansComponentizedPagesCount(servicePlansComponentizedPagesCount);
      } catch (error: any) {
        console.error('Dashboard: 会社事業計画取得エラー:', error);
        setServicePlansCount(0);
        setServicePlansFixedCount(0);
        setServicePlansComponentizedCount(0);
        setServicePlansComponentizedPagesCount(0);
      }
    } catch (error: any) {
      console.error('Dashboard: カウント取得エラー:', error);
      console.error('エラー詳細:', {
        code: error?.code,
        message: error?.message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 認証状態の変更を監視
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Dashboard: 認証状態変更', { userId: user?.uid, email: user?.email });
      if (user) {
        loadCounts();
      } else {
        setLoading(false);
      }
    });

    // 初回レンダリング時にも実行（既に認証済みの場合）
    if (auth.currentUser) {
      loadCounts();
    }

    // ページがフォーカスされた時にも再読み込み
    const handleFocus = () => {
      if (auth && auth.currentUser) {
        loadCounts();
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadCounts]);

  return (
    <Layout>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '8px' }}>ダッシュボード</h2>
          <p style={{ marginBottom: 0, fontSize: '14px', color: 'var(--color-text-light)' }}>
            現在のプロジェクト状況・AI提案・重要指標を確認できます
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginLeft: '48px' }}>
          {/* 事業企画（共通） */}
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '4px' }}>
                {loading ? '-' : businessProjectsCount}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(107, 114, 128, 0.7)', fontWeight: 400 }}>事業企画</div>
            </div>
          </div>
          {/* 固定ページ形式 */}
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '4px' }}>
                {loading ? '-' : servicePlansFixedCount}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(107, 114, 128, 0.7)', fontWeight: 400 }}>事業計画</div>
              <div style={{ fontSize: '10px', color: 'rgba(107, 114, 128, 0.5)', fontWeight: 400, marginTop: '2px' }}>固定ページ形式</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '4px' }}>
                {loading ? '-' : conceptsFixedCount}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(107, 114, 128, 0.7)', fontWeight: 400 }}>構想</div>
              <div style={{ fontSize: '10px', color: 'rgba(107, 114, 128, 0.5)', fontWeight: 400, marginTop: '2px' }}>固定ページ形式</div>
            </div>
          </div>
          {/* コンポーネント形式 */}
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '4px' }}>
                {loading ? '-' : servicePlansComponentizedCount}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(107, 114, 128, 0.7)', fontWeight: 400 }}>事業計画</div>
              <div style={{ fontSize: '10px', color: 'rgba(107, 114, 128, 0.5)', fontWeight: 400, marginTop: '2px' }}>コンポーネント形式</div>
              {servicePlansComponentizedPagesCount > 0 && (
                <div style={{ fontSize: '10px', color: 'rgba(107, 114, 128, 0.6)', fontWeight: 500, marginTop: '4px' }}>
                  {servicePlansComponentizedPagesCount} ページ
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '4px' }}>
                {loading ? '-' : conceptsComponentizedCount}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(107, 114, 128, 0.7)', fontWeight: 400 }}>構想</div>
              <div style={{ fontSize: '10px', color: 'rgba(107, 114, 128, 0.5)', fontWeight: 400, marginTop: '2px' }}>コンポーネント形式</div>
              {conceptsComponentizedPagesCount > 0 && (
                <div style={{ fontSize: '10px', color: 'rgba(107, 114, 128, 0.6)', fontWeight: 500, marginTop: '4px' }}>
                  {conceptsComponentizedPagesCount} ページ
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 会社・事業企画・構想の関係性（2D） */}
      <div className="card" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <ForceDirectedGraph width={1200} height={600} title="会社・事業企画・構想の関係性（2D）" />
      </div>
      
      {/* 会社・事業企画・構想の関係性（3D） */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <ForceDirectedGraph3D width={1200} height={600} title="会社・事業企画・構想の関係性（3D）" />
      </div>
    </Layout>
  );
}

