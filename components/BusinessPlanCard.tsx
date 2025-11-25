'use client';

import { BusinessPlanData } from './BusinessPlanForm';

interface BusinessPlanCardProps {
  plan: BusinessPlanData & { id: string; createdAt?: Date; updatedAt?: Date };
  onEdit: () => void;
  onDelete: () => void;
  type: 'company' | 'project';
}

export default function BusinessPlanCard({ plan, onEdit, onDelete, type }: BusinessPlanCardProps) {
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
            {plan.title}
          </h3>
          {type === 'project' && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>事業企画</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onEdit}
            className="button"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            編集
          </button>
          <button
            onClick={onDelete}
            className="button"
            style={{ padding: '6px 12px', fontSize: '12px', background: '#dc3545' }}
          >
            削除
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>事業概要:</strong>
        <p style={{ marginTop: '4px', color: 'var(--color-text)', lineHeight: '1.6', fontSize: '14px' }}>
          {plan.description}
        </p>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>事業目標:</strong>
        <p style={{ marginTop: '4px', color: 'var(--color-text)', lineHeight: '1.6', fontSize: '14px' }}>
          {plan.objectives}
        </p>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>ターゲット市場:</strong>
        <p style={{ marginTop: '4px', color: 'var(--color-text)', lineHeight: '1.6', fontSize: '14px' }}>
          {plan.targetMarket}
        </p>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>競争優位性:</strong>
        <p style={{ marginTop: '4px', color: 'var(--color-text)', lineHeight: '1.6', fontSize: '14px' }}>
          {plan.competitiveAdvantage}
        </p>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>財務計画:</strong>
        <p style={{ marginTop: '4px', color: 'var(--color-text)', lineHeight: '1.6', fontSize: '14px' }}>
          {plan.financialPlan}
        </p>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <strong style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>スケジュール:</strong>
        <p style={{ marginTop: '4px', color: 'var(--color-text)', lineHeight: '1.6', fontSize: '14px' }}>
          {plan.timeline}
        </p>
      </div>

      {plan.createdAt && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-color)', fontSize: '12px', color: 'var(--color-text-light)' }}>
          作成日: {formatDate(plan.createdAt)}
          {plan.updatedAt && plan.updatedAt.getTime() !== plan.createdAt.getTime() && (
            <> | 更新日: {formatDate(plan.updatedAt)}</>
          )}
        </div>
      )}
    </div>
  );
}

