/**
 * ページテンプレート管理コンポーネント
 * 既存ページをテンプレートとして登録・管理
 */

'use client';

import { useState, useEffect } from 'react';
import { savePageTemplate, getUserTemplates, deletePageTemplate, PageTemplate } from '@/lib/pageTemplates';
import { db, auth } from '@/lib/firebase';

interface PageTemplateManagerProps {
  planId?: string;
  conceptId?: string;
  onTemplateSelected?: (templateId: string) => void;
}

export default function PageTemplateManager({
  planId,
  conceptId,
  onTemplateSelected,
}: PageTemplateManagerProps) {
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registeringPageId, setRegisteringPageId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // テンプレート一覧を読み込む
  useEffect(() => {
    loadTemplates();
  }, [planId, conceptId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedTemplates = await getUserTemplates(planId, conceptId);
      setTemplates(loadedTemplates);
    } catch (err) {
      console.error('テンプレート読み込みエラー:', err);
      setError(err instanceof Error ? err.message : 'テンプレートの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTemplate = async () => {
    if (!registeringPageId || !templateName.trim()) {
      setError('テンプレート名を入力してください');
      return;
    }

    try {
      setRegistering(true);
      setError(null);
      await savePageTemplate(
        registeringPageId,
        templateName.trim(),
        templateDescription.trim(),
        planId,
        conceptId
      );
      
      // フォームをリセット
      setTemplateName('');
      setTemplateDescription('');
      setRegisteringPageId(null);
      setShowRegisterForm(false);
      
      // テンプレート一覧を再読み込み
      await loadTemplates();
    } catch (err) {
      console.error('テンプレート登録エラー:', err);
      setError(err instanceof Error ? err.message : 'テンプレートの登録に失敗しました');
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('このテンプレートを削除しますか？')) {
      return;
    }

    try {
      await deletePageTemplate(templateId);
      await loadTemplates();
    } catch (err) {
      console.error('テンプレート削除エラー:', err);
      alert(err instanceof Error ? err.message : 'テンプレートの削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#F9FAFB',
      borderRadius: '8px',
      border: '1px solid #E5E7EB',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          📋 ページテンプレート
        </h3>
        <button
          onClick={() => setShowRegisterForm(!showRegisterForm)}
          style={{
            padding: '6px 12px',
            backgroundColor: showRegisterForm ? '#F3F4F6' : '#10B981',
            color: showRegisterForm ? 'var(--color-text)' : '#fff',
            border: '1px solid var(--color-border-color)',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {showRegisterForm ? '×' : '+ テンプレート登録'}
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: '6px',
          color: '#991B1B',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* テンプレート登録フォーム */}
      {showRegisterForm && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#fff',
          borderRadius: '6px',
          border: '1px solid #E5E7EB',
        }}>
          <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
            既存ページをテンプレートとして登録
          </h4>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
              ページID *
            </label>
            <input
              type="text"
              value={registeringPageId || ''}
              onChange={(e) => setRegisteringPageId(e.target.value)}
              placeholder="例: page-1234567890"
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid var(--color-border-color)',
                borderRadius: '4px',
                fontSize: '12px',
              }}
              disabled={registering}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
              テンプレート名 *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="例: 概要ページテンプレート"
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid var(--color-border-color)',
                borderRadius: '4px',
                fontSize: '12px',
              }}
              disabled={registering}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
              説明（任意）
            </label>
            <textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="このテンプレートの説明を入力"
              rows={3}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid var(--color-border-color)',
                borderRadius: '4px',
                fontSize: '12px',
                resize: 'vertical',
              }}
              disabled={registering}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowRegisterForm(false);
                setTemplateName('');
                setTemplateDescription('');
                setRegisteringPageId(null);
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#F3F4F6',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
              disabled={registering}
            >
              キャンセル
            </button>
            <button
              onClick={handleRegisterTemplate}
              style={{
                padding: '6px 12px',
                backgroundColor: '#10B981',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: registering ? 'not-allowed' : 'pointer',
                opacity: registering ? 0.6 : 1,
              }}
              disabled={registering}
            >
              {registering ? '登録中...' : '登録'}
            </button>
          </div>
        </div>
      )}

      {/* テンプレート一覧 */}
      {templates.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '14px' }}>
          テンプレートが登録されていません
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                padding: '12px',
                backgroundColor: '#fff',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                  {template.name}
                </div>
                {template.description && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '4px' }}>
                    {template.description}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>
                  元のページ: {template.pageTitle} (ID: {template.pageId})
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {onTemplateSelected && (
                  <button
                    onClick={() => onTemplateSelected(template.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#8B5CF6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    選択
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#EF4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

