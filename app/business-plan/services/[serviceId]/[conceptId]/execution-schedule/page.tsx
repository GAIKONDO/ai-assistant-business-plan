'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// コンポーネント化されたページのコンポーネント（条件付きインポート）
const ComponentizedOverview = dynamic(
  () => import('@/components/pages/component-test/test-concept/ComponentizedOverview'),
  { ssr: false }
);

export default function ExecutionSchedulePage() {
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
        実行スケジュール
      </p>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text)' }}>
          実行スケジュール
        </h3>
        <p style={{ color: 'var(--color-text)', lineHeight: '1.8', fontSize: '14px' }}>
          実行スケジュールの内容をここに表示します。
        </p>
      </div>
    </>
  );
}

