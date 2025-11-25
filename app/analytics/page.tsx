'use client';

import Layout from '@/components/Layout';

export default function AnalyticsPage() {
  return (
    <Layout>
      <div className="card">
        <h2 style={{ marginBottom: '8px' }}>分析</h2>
        <p style={{ marginBottom: 0, fontSize: '14px', color: 'var(--color-text-light)' }}>
          データ分析とレポートを確認できます
        </p>
      </div>
    </Layout>
  );
}

