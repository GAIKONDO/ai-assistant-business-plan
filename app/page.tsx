'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [businessProjectsCount, setBusinessProjectsCount] = useState<number>(0);
  const [conceptsCount, setConceptsCount] = useState<number>(0);
  const [servicePlansCount, setServicePlansCount] = useState<number>(0);
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
      let conceptsCount = 0;
      try {
        const conceptsQuery = query(
          collection(db, 'concepts'),
          where('userId', '==', userId)
        );
        const conceptsSnapshot = await getDocs(conceptsQuery);
        conceptsCount = conceptsSnapshot.size;
        console.log('Dashboard: 動的構想数', conceptsCount, conceptsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error: any) {
        console.error('Dashboard: 構想取得エラー:', error);
      }
      
      // 固定構想もカウントに含める
      // 自社開発・自社サービス事業: 2つ（出産支援、介護支援）
      // AI駆動開発・DX支援SI事業: 2つ（医療法人向けDX、中小企業向けDX）
      // プロセス可視化・業務コンサル事業: 2つ（中小企業向け、医療・介護施設向け）
      // AI導入ルール設計・人材育成・教育事業: 3つ（大企業向けAI人材育成、AI導入ルール設計、中小企業向けAI導入支援）
      const fixedConceptsCount = 2 + 2 + 2 + 3; // 9つ
      const totalConcepts = conceptsCount + fixedConceptsCount;
      console.log('Dashboard: 構想総数（動的 + 固定）', totalConcepts);
      setConceptsCount(totalConcepts);

      // 事業計画の数を取得（会社全体の事業計画のみ）
      let servicePlansCount = 0;
      try {
        const companyPlansQuery = query(
          collection(db, 'companyBusinessPlan'),
          where('userId', '==', userId)
        );
        const companyPlansSnapshot = await getDocs(companyPlansQuery);
        servicePlansCount = companyPlansSnapshot.size;
        console.log('Dashboard: 会社事業計画数', servicePlansCount, companyPlansSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error: any) {
        console.error('Dashboard: 会社事業計画取得エラー:', error);
      }
      setServicePlansCount(servicePlansCount);
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
      if (auth.currentUser) {
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
        <div style={{ display: 'flex', gap: '32px', marginLeft: '48px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '4px' }}>
              {loading ? '-' : servicePlansCount}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(107, 114, 128, 0.7)', fontWeight: 400 }}>事業計画</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '4px' }}>
              {loading ? '-' : businessProjectsCount}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(107, 114, 128, 0.7)', fontWeight: 400 }}>事業企画</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '4px' }}>
              {loading ? '-' : conceptsCount}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(107, 114, 128, 0.7)', fontWeight: 400 }}>構想</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

