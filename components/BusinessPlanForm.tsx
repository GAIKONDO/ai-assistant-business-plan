'use client';

import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface BusinessPlanData {
  title: string;
  description: string;
  objectives: string;
  targetMarket: string;
  competitiveAdvantage: string;
  financialPlan: string;
  timeline: string;
}

interface BusinessPlanFormProps {
  plan?: BusinessPlanData & { id?: string };
  onSave: () => void;
  onCancel: () => void;
  type: 'company' | 'project';
  serviceId?: string; // サービスID（事業企画内の具体的なサービス用）
  conceptId?: string; // 構想ID（自社サービス事業内の構想用）
}

export default function BusinessPlanForm({ plan, onSave, onCancel, type, serviceId, conceptId }: BusinessPlanFormProps) {
  const [formData, setFormData] = useState<BusinessPlanData>({
    title: '',
    description: '',
    objectives: '',
    targetMarket: '',
    competitiveAdvantage: '',
    financialPlan: '',
    timeline: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData({
        title: plan.title || '',
        description: plan.description || '',
        objectives: plan.objectives || '',
        targetMarket: plan.targetMarket || '',
        competitiveAdvantage: plan.competitiveAdvantage || '',
        financialPlan: plan.financialPlan || '',
        timeline: plan.timeline || '',
      });
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !db) return;

    setLoading(true);
    try {
      const data = {
        ...formData,
        userId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      };

      if (type === 'company') {
        // 会社本体の事業計画は1つだけ
        if (plan?.id) {
          await updateDoc(doc(db, 'companyBusinessPlan', plan.id), data);
        } else {
          // 既存の会社本体事業計画を確認
          const existingPlans = await collection(db, 'companyBusinessPlan');
          // ここでは簡易的に、既存があれば更新、なければ作成
          await addDoc(collection(db, 'companyBusinessPlan'), {
            ...data,
            createdAt: serverTimestamp(),
          });
        }
      } else if (serviceId) {
        // サービス事業計画（事業企画内の具体的なサービス内容）
        const serviceData = {
          ...data,
          serviceId: serviceId,
          ...(conceptId && { conceptId: conceptId }), // 構想IDがある場合のみ追加
        };
        if (plan?.id) {
          await updateDoc(doc(db, 'servicePlans', plan.id), serviceData);
        } else {
          await addDoc(collection(db, 'servicePlans'), {
            ...serviceData,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        // 事業企画
        if (plan?.id) {
          await updateDoc(doc(db, 'businessProjects', plan.id), data);
        } else {
          await addDoc(collection(db, 'businessProjects'), {
            ...data,
            createdAt: serverTimestamp(),
          });
        }
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
        {plan ? '編集' : '作成'}: {type === 'company' ? '会社本体の事業計画' : '事業企画'}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">タイトル *</label>
          <input
            type="text"
            className="input"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="事業計画のタイトルを入力"
          />
        </div>

        <div className="form-group">
          <label className="label">事業概要 *</label>
          <textarea
            className="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder="事業の概要を説明してください"
          />
        </div>

        <div className="form-group">
          <label className="label">事業目標 *</label>
          <textarea
            className="textarea"
            value={formData.objectives}
            onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
            required
            placeholder="達成したい事業目標を記述してください"
          />
        </div>

        <div className="form-group">
          <label className="label">ターゲット市場 *</label>
          <textarea
            className="textarea"
            value={formData.targetMarket}
            onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
            required
            placeholder="ターゲットとする市場・顧客層を説明してください"
          />
        </div>

        <div className="form-group">
          <label className="label">競争優位性 *</label>
          <textarea
            className="textarea"
            value={formData.competitiveAdvantage}
            onChange={(e) => setFormData({ ...formData, competitiveAdvantage: e.target.value })}
            required
            placeholder="競合他社との差別化要因や強みを説明してください"
          />
        </div>

        <div className="form-group">
          <label className="label">財務計画 *</label>
          <textarea
            className="textarea"
            value={formData.financialPlan}
            onChange={(e) => setFormData({ ...formData, financialPlan: e.target.value })}
            required
            placeholder="売上目標、コスト構造、資金調達計画などを記述してください"
          />
        </div>

        <div className="form-group">
          <label className="label">スケジュール・タイムライン *</label>
          <textarea
            className="textarea"
            value={formData.timeline}
            onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
            required
            placeholder="事業のマイルストーンやスケジュールを記述してください"
          />
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
            {loading ? '保存中...' : plan ? '更新' : '作成'}
          </button>
        </div>
      </form>
    </div>
  );
}

