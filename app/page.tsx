'use client';

import Layout from '@/components/Layout';

export default function DashboardPage() {
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
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '4px' }}>3</div>
            <div style={{ fontSize: '12px', color: 'rgba(107, 114, 128, 0.7)', fontWeight: 400 }}>プロジェクト</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '4px' }}>5</div>
            <div style={{ fontSize: '12px', color: 'rgba(107, 114, 128, 0.7)', fontWeight: 400 }}>タスク</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '4px' }}>2</div>
            <div style={{ fontSize: '12px', color: 'rgba(107, 114, 128, 0.7)', fontWeight: 400 }}>AI提案</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

