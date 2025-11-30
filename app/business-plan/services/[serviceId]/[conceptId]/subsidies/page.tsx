'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// コンポーネント化されたページのコンポーネント（条件付きインポート）
const ComponentizedOverview = dynamic(
  () => import('@/components/pages/component-test/test-concept/ComponentizedOverview'),
  { ssr: false }
);

export default function SubsidiesPage() {
  const params = useParams();
  const serviceId = params.serviceId as string;
  const conceptId = params.conceptId as string;

  // コンポーネント化されたページを使用するかチェック
  if ((serviceId === 'component-test' && conceptId === 'test-concept') ||
      conceptId.includes('-componentized')) {
    return <ComponentizedOverview />;
  }

  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        補助金・助成金
      </p>
      <div className="card">
        <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
          補助金・助成金の内容をここに表示します
        </p>
      </div>
    </>
  );
}

