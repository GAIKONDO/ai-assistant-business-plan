'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Layout from '@/components/Layout';
import { BusinessProjectData } from '@/components/BusinessProjectForm';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<(BusinessProjectData & { id: string; createdAt?: Date; updatedAt?: Date }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      if (!auth?.currentUser || !db || !projectId) {
        setLoading(false);
        return;
      }

      try {
        const projectDoc = await getDoc(doc(db, 'businessProjects', projectId));
        if (projectDoc.exists()) {
          const data = projectDoc.data();
          setProject({
            id: projectDoc.id,
            name: data.name || '',
            description: data.description || '',
            serviceId: data.serviceId || '',
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          });
        } else {
          router.push('/business-plan');
        }
      } catch (error) {
        console.error('読み込みエラー:', error);
        router.push('/business-plan');
      } finally {
        setLoading(false);
      }
    };

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadProject();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [projectId, router]);

  const handleDelete = async () => {
    if (!project || !db) return;
    if (!confirm('この事業企画を削除しますか？関連する事業計画も削除されます。')) return;

    try {
      await deleteDoc(doc(db, 'businessProjects', project.id));
      router.push('/business-plan');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>読み込み中...</div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>事業企画が見つかりませんでした</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button
            onClick={() => router.push('/business-plan')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '8px 0',
            }}
          >
            ← 戻る
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => router.push(`/business-plan?editProject=${project.id}`)}
              style={{
                background: 'rgba(31, 41, 51, 0.05)',
                border: '1px solid rgba(31, 41, 51, 0.1)',
                color: 'var(--color-text)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(31, 41, 51, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(31, 41, 51, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(31, 41, 51, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(31, 41, 51, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
              }}
              title="編集"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button
              onClick={handleDelete}
              style={{
                background: 'rgba(220, 53, 69, 0.08)',
                border: '1px solid rgba(220, 53, 69, 0.2)',
                color: '#dc3545',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(220, 53, 69, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(220, 53, 69, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(220, 53, 69, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(220, 53, 69, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(220, 53, 69, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(220, 53, 69, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(220, 53, 69, 0.1)';
              }}
              title="削除"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="card">
          <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>
            {project.name}
          </h1>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
              説明
            </h3>
            <p style={{ color: 'var(--color-text)', lineHeight: '1.8', fontSize: '14px' }}>
              {project.description || '未設定'}
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text)' }}>
              サービスID
            </h3>
            <p style={{ color: 'var(--color-text)', lineHeight: '1.8', fontSize: '14px', fontFamily: 'monospace' }}>
              {project.serviceId || '未設定'}
            </p>
          </div>

          {project.createdAt && (
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border-color)', fontSize: '12px', color: 'var(--color-text-light)' }}>
              作成日: {formatDate(project.createdAt)}
              {project.updatedAt && project.updatedAt.getTime() !== project.createdAt.getTime() && (
                <> | 更新日: {formatDate(project.updatedAt)}</>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

