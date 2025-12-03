'use client';

import { useState, useEffect } from 'react';
import { doc, addDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { PageMetadata } from '@/types/pageMetadata';

export interface ConceptData {
  name: string;
  description: string;
  conceptId: string; // 自動生成されるID
  pagesBySubMenu?: { [subMenuId: string]: Array<PageMetadata> }; // メタデータ付きページ
  pageOrderBySubMenu?: { [subMenuId: string]: string[] };
}

interface ConceptFormProps {
  concept?: ConceptData & { id?: string };
  serviceId: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function ConceptForm({ concept, serviceId, onSave, onCancel }: ConceptFormProps) {
  const [formData, setFormData] = useState<ConceptData>({
    name: '',
    description: '',
    conceptId: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (concept) {
      setFormData({
        name: concept.name || '',
        description: concept.description || '',
        conceptId: concept.conceptId || '',
      });
    } else {
      // 新規作成時はconceptIdを自動生成（構想名が入力されるまで空文字列）
      // 構想名が入力された時点で自動生成される
      setFormData({
        name: '',
        description: '',
        conceptId: '',
      });
    }
  }, [concept]);

  const generateConceptId = (name: string): string => {
    // タイムスタンプベースの一意なIDを生成
    // 形式: concept-{timestamp}
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `concept-${timestamp}${randomSuffix}`;
  };

  const handleNameChange = (name: string) => {
    // 新規作成時のみ構想IDを自動生成（編集時は既存のIDを維持）
    const conceptId = concept?.conceptId || generateConceptId(name);
    setFormData({ ...formData, name, conceptId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !db) return;

    setLoading(true);
    try {
      const data = {
        name: formData.name,
        description: formData.description,
        conceptId: formData.conceptId,
        serviceId: serviceId,
        userId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      };

      if (concept?.id) {
        await updateDoc(doc(db, 'concepts', concept.id), data);
      } else {
        await addDoc(collection(db, 'concepts'), {
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
        {concept ? '構想を編集' : '新しい構想を作成'}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">構想名 *</label>
          <input
            type="text"
            className="input"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="例: 出産支援パーソナルApp"
          />
        </div>

        <div className="form-group">
          <label className="label">説明</label>
          <textarea
            className="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="構想の説明を入力してください（任意）"
            rows={4}
          />
        </div>

        <div className="form-group">
          <label className="label">構想ID（自動生成）</label>
          <input
            type="text"
            className="input"
            value={formData.conceptId}
            readOnly
            disabled={!!concept?.id}
            placeholder="構想IDは自動生成されます"
            style={{ 
              fontFamily: 'monospace', 
              fontSize: '13px',
              backgroundColor: concept?.id ? 'var(--color-bg-secondary)' : 'var(--color-bg)',
              cursor: concept?.id ? 'not-allowed' : 'default',
              opacity: concept?.id ? 0.7 : 1,
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '4px' }}>
            {concept?.id 
              ? 'このIDは変更できません。URLに使用されます。'
              : '構想IDは自動生成され、変更できません。URLに使用されます。'}
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
            {loading ? '保存中...' : concept ? '更新' : '作成'}
          </button>
        </div>
      </form>
    </div>
  );
}

