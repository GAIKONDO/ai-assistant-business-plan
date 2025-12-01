'use client';

import { usePlan } from '../hooks/usePlan';
import { useParams } from 'next/navigation';
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

export default function SnapshotComparisonPage() {
  const { plan } = usePlan();
  const params = useParams();
  const planId = params.planId as string;
  
  // planIdに応じてコンテンツを表示するかどうかを決定
  const hasCustomContent = planId && PLAN_CONTENT_MAP[planId] ? true : false;
  
  // コンポーネント化されたページを使用するかチェック
  // pagesBySubMenuが存在する場合はComponentizedCompanyPlanOverviewを使用
  if (plan?.pagesBySubMenu) {
    return <ComponentizedCompanyPlanOverview />;
  }

  // 固定ページ形式で、planId固有のコンテンツが存在しない場合は何も表示しない
  if (!hasCustomContent) {
    return null;
  }
  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        スナップショット比較
      </p>
      <div className="card">
        <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
          スナップショット比較の内容をここに表示します
        </p>
      </div>
    </>
  );
}

