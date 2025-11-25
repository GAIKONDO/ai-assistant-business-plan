'use client';

import Layout from '@/components/Layout';

export default function ReportsPage() {
  return (
    <Layout>
      <div className="card">
        <h2 style={{ marginBottom: '8px' }}>レポート</h2>
        <p style={{ marginBottom: 0, fontSize: '14px', color: 'var(--color-text-light)' }}>
          レポートの作成・閲覧・管理を行います
        </p>
      </div>
    </Layout>
  );
}

