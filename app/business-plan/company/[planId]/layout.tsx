'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Script from 'next/script';
import { auth, db } from '@/lib/firebase';
import Layout from '@/components/Layout';
import CompanyPlanSubMenu from '@/components/CompanyPlanSubMenu';
import { SUB_MENU_ITEMS } from '@/components/ConceptSubMenu';
import { BusinessPlanData } from '@/components/BusinessPlanForm';

declare global {
  interface Window {
    p5?: any;
    mermaid?: any;
  }
}

interface PlanContextType {
  plan: (BusinessPlanData & { id: string }) | null;
  loading: boolean;
}

const PlanContext = createContext<PlanContextType>({ plan: null, loading: true });

export const usePlan = () => useContext(PlanContext);

export default function CompanyPlanDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const planId = params.planId as string;

  const [planTitle, setPlanTitle] = useState<string>('');
  const [plan, setPlan] = useState<(BusinessPlanData & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const loadPlan = useCallback(async () => {
    if (!auth?.currentUser || !db || !planId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
      if (planDoc.exists()) {
        const data = planDoc.data();
        const planData = {
          id: planDoc.id,
          title: data.title || '',
          description: data.description || '',
          objectives: data.objectives || '',
          targetMarket: data.targetMarket || '',
          competitiveAdvantage: data.competitiveAdvantage || '',
          financialPlan: data.financialPlan || '',
          timeline: data.timeline || '',
          keyVisualUrl: data.keyVisualUrl || '', // キービジュアル画像のURL
        };
        setPlan(planData);
        setPlanTitle(data.title || '事業計画');
      } else {
        setPlan(null);
        setPlanTitle('事業計画');
      }
    } catch (error) {
      console.error('読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  // 認証状態を監視
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthReady(true);
      if (user && planId) {
        loadPlan();
      } else if (!user) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [planId, loadPlan]);

  // 認証が完了し、planIdが変更されたときにデータを読み込む
  useEffect(() => {
    if (authReady && auth?.currentUser && planId) {
      loadPlan();
    }
  }, [authReady, planId, loadPlan]);

  // 現在のサブメニュー項目を判定
  const getCurrentSubMenu = () => {
    const pathSegments = pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment === planId) {
      return 'overview'; // デフォルトは概要・コンセプト
    }
    return SUB_MENU_ITEMS.find(item => item.path === lastSegment)?.id || 'overview';
  };

  const currentSubMenu = getCurrentSubMenu();

  return (
    <Layout>
      <PlanContext.Provider value={{ plan, loading }}>
      {/* p5.jsとMermaidを一度だけ読み込む */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && window.p5) {
            window.dispatchEvent(new Event('p5loaded'));
          }
        }}
        onReady={() => {
          // 既に読み込まれている場合もイベントを発火
          if (typeof window !== 'undefined' && window.p5) {
            window.dispatchEvent(new Event('p5loaded'));
          }
        }}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (typeof window !== 'undefined' && window.mermaid) {
            window.dispatchEvent(new Event('mermaidloaded'));
          }
        }}
      />
      <div style={{ display: 'flex', gap: '32px' }}>
        <CompanyPlanSubMenu planId={planId} currentSubMenuId={currentSubMenu} />
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => router.push('/business-plan')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '16px',
                padding: 0,
              }}
            >
              ← 事業計画に戻る
            </button>
            <h2 style={{ marginBottom: '4px' }}>{planTitle}</h2>
          </div>
          {children}
        </div>
      </div>
      </PlanContext.Provider>
    </Layout>
  );
}

