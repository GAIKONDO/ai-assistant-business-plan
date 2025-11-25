'use client';

import { useState, useEffect } from 'react';
import { doc, addDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface BusinessProjectData {
  name: string;
  description: string;
  serviceId: string; // 自動生成されるID
}

interface BusinessProjectFormProps {
  project?: BusinessProjectData & { id?: string };
  onSave: () => void;
  onCancel: () => void;
}

export default function BusinessProjectForm({ project, onSave, onCancel }: BusinessProjectFormProps) {
  const [formData, setFormData] = useState<BusinessProjectData>({
    name: '',
    description: '',
    serviceId: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        serviceId: project.serviceId || '',
      });
    } else {
      // 新規作成時はserviceIdを自動生成
      setFormData({
        name: '',
        description: '',
        serviceId: generateServiceId(''),
      });
    }
  }, [project]);

  const generateServiceId = (name: string): string => {
    if (!name) return '';
    // 日本語名から英数字IDを生成（簡易版）
    const normalized = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    return normalized || `project-${Date.now()}`;
  };

  const handleNameChange = (name: string) => {
    const serviceId = project?.serviceId || generateServiceId(name);
    setFormData({ ...formData, name, serviceId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !db) return;

    setLoading(true);
    try {
      const data = {
        name: formData.name,
        description: formData.description,
        serviceId: formData.serviceId,
        userId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      };

      if (project?.id) {
        await updateDoc(doc(db, 'businessProjects', project.id), data);
      } else {
        await addDoc(collection(db, 'businessProjects'), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }
      onSave();
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '24px' }}>
        {project ? '事業企画を編集' : '新しい事業企画を作成'}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">事業企画名 *</label>
          <input
            type="text"
            className="input"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="例: AI駆動開発・DX支援事業"
          />
        </div>

        <div className="form-group">
          <label className="label">説明 *</label>
          <textarea
            className="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder="事業企画の説明を入力してください"
            rows={4}
          />
        </div>

        <div className="form-group">
          <label className="label">サービスID（自動生成）</label>
          <input
            type="text"
            className="input"
            value={formData.serviceId}
            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
            placeholder="URL用のID（自動生成されますが、変更可能です）"
            style={{ fontFamily: 'monospace', fontSize: '13px' }}
          />
          <p style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '4px' }}>
            このIDはURLに使用されます。変更する場合は英数字とハイフンのみ使用してください。
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            className="button"
            style={{ background: 'var(--color-text-light)' }}
            disabled={loading}
          >
            キャンセル
          </button>
          <button type="submit" className="button" disabled={loading}>
            {loading ? '保存中...' : project ? '更新' : '作成'}
          </button>
        </div>
      </form>
    </div>
  );
}

