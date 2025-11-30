'use client';

import { usePlan } from '../layout';
import dynamic from 'next/dynamic';

// ComponentizedCompanyPlanOverviewを動的インポート
const ComponentizedCompanyPlanOverview = dynamic(
  () => import('@/components/pages/component-test/test-concept/ComponentizedCompanyPlanOverview'),
  { ssr: false }
);

export default function RiskAssessmentPage() {
  const { plan } = usePlan();
  
  // コンポーネント化されたページを使用するかチェック
  // pagesBySubMenuが存在する場合はComponentizedCompanyPlanOverviewを使用
  if (plan?.pagesBySubMenu) {
    return <ComponentizedCompanyPlanOverview />;
  }
  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        リスク評価
      </p>
      <div className="card">
        <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
          リスク評価の内容をここに表示します
        </p>
      </div>
    </>
  );
}

