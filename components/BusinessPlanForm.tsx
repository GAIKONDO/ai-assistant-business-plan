'use client';

import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface KeyVisualPDFMetadata {
  title: string;
  signature: string;
  date: string;
  position: {
    x: number; // mm
    y: number; // mm
    align: 'left' | 'center' | 'right';
  };
  titleFontSize?: number; // pt
  signatureFontSize?: number; // pt
  dateFontSize?: number; // pt
}

export interface BusinessPlanData {
  title: string;
  description: string;
  objectives: string;
  targetMarket: string;
  competitiveAdvantage: string;
  financialPlan: string;
  timeline: string;
  keyVisualUrl?: string; // キービジュアル画像のURL
  keyVisualHeight?: number; // キービジュアルの高さ（%）
  keyVisualScale?: number; // キービジュアルのスケール（%）
  keyVisualLogoUrl?: string; // PDFロゴのURL
  keyVisualLogoSize?: number; // PDFロゴのサイズ（mm）- 高さ
  keyVisualMetadata?: KeyVisualPDFMetadata; // PDFメタデータ（タイトル、署名、作成日）
  titlePositionX?: number; // PDFタイトルのX位置（mm）
  titlePositionY?: number; // PDFタイトルのY位置（mm）
  titleFontSize?: number; // PDFタイトルのフォントサイズ（px）
  titleBorderEnabled?: boolean; // PDFタイトルのボーダー（縦棒）の有無
  footerText?: string; // PDFフッターテキスト
  pagesBySubMenu?: { [subMenuId: string]: Array<any> }; // サブメニューごとのページ
  pageOrderBySubMenu?: { [subMenuId: string]: string[] }; // サブメニューごとのページ順序
  isFavorite?: boolean; // お気に入り
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
      // タイトルと概要のみを保存（他のフィールドは既存データがあれば保持、なければ空文字列）
      const data = {
        title: formData.title,
        description: formData.description,
        objectives: plan?.objectives || '',
        targetMarket: plan?.targetMarket || '',
        competitiveAdvantage: plan?.competitiveAdvantage || '',
        financialPlan: plan?.financialPlan || '',
        timeline: plan?.timeline || '',
        userId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      };

      if (type === 'company') {
        // 会社本体の事業計画（複数作成可能）
        if (plan?.id) {
          await updateDoc(doc(db, 'companyBusinessPlan', plan.id), data);
        } else {
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
          <label className="label">概要</label>
          <textarea
            className="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="事業の概要を説明してください"
            rows={4}
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

