'use client';

import Layout from '@/components/Layout';

export default function SettingsPage() {
  return (
    <Layout>
      <div className="card">
        <h2 style={{ marginBottom: '8px' }}>設定</h2>
        <p style={{ marginBottom: 0, fontSize: '14px', color: 'var(--color-text-light)' }}>
          アカウント設定やアプリケーション設定を管理します
        </p>
      </div>
    </Layout>
  );
}

