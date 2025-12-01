'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import dynamic from 'next/dynamic';

// コンポーネント化されたページのコンポーネント（条件付きインポート）
const ComponentizedOverview = dynamic(
  () => import('@/components/pages/component-test/test-concept/ComponentizedOverview'),
  { ssr: false }
);

interface Reference {
  id: string;
  title: string;
  url: string;
  publishedDate?: string; // 公開日（YYYY-MM-DD形式）
}

export default function ReferencesPage() {
  const params = useParams();
  const serviceId = params.serviceId as string;
  const conceptId = params.conceptId as string;
  // すべてのHooksを早期リターンの前に呼び出す（React Hooksのルール）
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newReference, setNewReference] = useState({ title: '', url: '', publishedDate: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [conceptDocId, setConceptDocId] = useState<string | null>(null);

  // デフォルトの参考文献
  const defaultReferences: Reference[] = [
    {
      id: 'default-1',
      title: '令和7年版 情報通信白書の概要',
      url: 'https://www.soumu.go.jp/johotsusintokei/whitepaper/ja/r07/html/nb000000.html',
    },
    {
      id: 'default-2',
      title: '総務省 情報通信白書 令和7年版 第2部 地域創生（PDF）',
      url: 'https://www.soumu.go.jp/johotsusintokei/whitepaper/ja/r07/pdf/n1320000.pdf',
    },
    {
      id: 'default-3',
      title: '経済産業省 デジタル経済レポート（PDF）',
      url: 'https://www.meti.go.jp/policy/it_policy/statistics/digital_economy_report/digital_economy_report1.pdf',
    },
    {
      id: 'default-4',
      title: 'McKinsey: The Economic Potential of Generative AI: The Next Productivity Frontier',
      url: 'https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/the-economic-potential-of-generative-ai-the-next-productivity-frontier',
    },
  ];

  // Firestoreから構想ドキュメントIDを取得し、参考文献を読み込む
  useEffect(() => {
    const loadReferences = async () => {
      if (!db || !auth?.currentUser || !serviceId || !conceptId) {
        setLoading(false);
        return;
      }

      try {
        // 構想ドキュメントを検索
        const conceptsQuery = query(
          collection(db, 'concepts'),
          where('userId', '==', auth.currentUser.uid),
          where('serviceId', '==', serviceId),
          where('conceptId', '==', conceptId)
        );
        
        const conceptsSnapshot = await getDocs(conceptsQuery);
        
        if (conceptsSnapshot.empty) {
          setLoading(false);
          return;
        }

        const conceptDoc = conceptsSnapshot.docs[0];
        const docId = conceptDoc.id;
        setConceptDocId(docId);

        const data = conceptDoc.data();
        const savedReferences = data.references || [];
        
        // 参考文献が存在しない場合、デフォルトの参考文献を追加
        if (savedReferences.length === 0) {
          setReferences(defaultReferences);
          // Firestoreに保存
          await setDoc(doc(db, 'concepts', docId), { references: defaultReferences }, { merge: true });
        } else {
          // 既存の参考文献がある場合、デフォルトの参考文献が含まれているかチェック
          const existingIds = savedReferences.map((ref: Reference) => ref.id);
          const missingReferences = defaultReferences.filter(
            (defaultRef) => !existingIds.includes(defaultRef.id)
          );
          
          if (missingReferences.length > 0) {
            // 不足しているデフォルトの参考文献を追加
            const updatedReferences = [...savedReferences, ...missingReferences];
            setReferences(updatedReferences);
            // Firestoreに保存
            await setDoc(doc(db, 'concepts', docId), { references: updatedReferences }, { merge: true });
          } else {
            setReferences(savedReferences);
          }
        }
      } catch (error) {
        console.error('参考文献の読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReferences();
  }, [serviceId, conceptId]);

  // コンポーネント化されたページを使用するかチェック
  if ((serviceId === 'component-test' && conceptId === 'test-concept') ||
      conceptId.includes('-componentized')) {
    return <ComponentizedOverview />;
  }

  // Firestoreに参考文献を保存
  const saveReferences = async (updatedReferences: Reference[]) => {
    if (!db || !conceptDocId) return;

    try {
      await setDoc(doc(db, 'concepts', conceptDocId), { references: updatedReferences }, { merge: true });
    } catch (error) {
      console.error('参考文献の保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  // 新しい参考文献を追加
  const handleAdd = () => {
    if (!newReference.title.trim() || !newReference.url.trim()) {
      alert('タイトルとURLを入力してください');
      return;
    }

    const reference: Reference = {
      id: Date.now().toString(),
      title: newReference.title.trim(),
      url: newReference.url.trim(),
      publishedDate: newReference.publishedDate.trim() || undefined,
    };

    const updatedReferences = [...references, reference];
    setReferences(updatedReferences);
    saveReferences(updatedReferences);
    setNewReference({ title: '', url: '', publishedDate: '' });
    setShowAddForm(false);
  };

  // 参考文献を更新
  const handleUpdate = (id: string, field: 'title' | 'url' | 'publishedDate', value: string) => {
    const updatedReferences = references.map(ref =>
      ref.id === id ? { ...ref, [field]: value || undefined } : ref
    );
    setReferences(updatedReferences);
    saveReferences(updatedReferences);
  };

  // 参考文献を削除
  const handleDelete = (id: string) => {
    if (!confirm('この参考文献を削除しますか？')) return;

    const updatedReferences = references.filter(ref => ref.id !== id);
    setReferences(updatedReferences);
    saveReferences(updatedReferences);
  };

  // URLのバリデーション
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <>
      <p style={{ margin: 0, marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-light)' }}>
        参考文献
      </p>
      
      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            marginBottom: 0, 
            color: 'var(--color-text)', 
            borderLeft: '3px solid var(--color-primary)', 
            paddingLeft: '8px' 
          }}>
            参考文献
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: showAddForm ? '#F3F4F6' : 'var(--color-primary)',
              color: showAddForm ? 'var(--color-text)' : '#fff',
              border: '1px solid var(--color-border-color)',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {showAddForm ? (
              <>
                <span>−</span>
                <span>閉じる</span>
              </>
            ) : (
              <>
                <span>+</span>
                <span>新しい参考文献を追加</span>
              </>
            )}
          </button>
        </div>

        {/* 新しい参考文献の追加フォーム */}
        {showAddForm && (
          <div style={{ 
            marginBottom: '32px', 
            padding: '20px', 
            backgroundColor: '#F9FAFB', 
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <h4 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              marginBottom: '16px', 
              color: 'var(--color-text)' 
            }}>
              新しい参考文献を追加
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 500, 
                marginBottom: '6px', 
                color: 'var(--color-text)' 
              }}>
                タイトル *
              </label>
              <input
                type="text"
                value={newReference.title}
                onChange={(e) => setNewReference({ ...newReference, title: e.target.value })}
                placeholder="例: AI市場の現状と展望"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid var(--color-border-color)',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 500, 
                marginBottom: '6px', 
                color: 'var(--color-text)' 
              }}>
                URL *
              </label>
              <input
                type="url"
                value={newReference.url}
                onChange={(e) => setNewReference({ ...newReference, url: e.target.value })}
                placeholder="https://example.com/article"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid var(--color-border-color)',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 500, 
                marginBottom: '6px', 
                color: 'var(--color-text)' 
              }}>
                公開日
              </label>
              <input
                type="date"
                value={newReference.publishedDate}
                onChange={(e) => setNewReference({ ...newReference, publishedDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid var(--color-border-color)',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                }}
              />
            </div>
            <button
              onClick={handleAdd}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              追加
            </button>
          </div>
        </div>
        )}

        {/* 参考文献テーブル */}
        {references.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: 'var(--color-text-light)' 
          }}>
            参考文献がまだ追加されていません
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid var(--color-border-color)'
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#F3F4F6',
                  borderBottom: '2px solid var(--color-border-color)'
                }}>
                  <th style={{ 
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    width: '60px'
                  }}>
                    #
                  </th>
                  <th style={{ 
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--color-text)'
                  }}>
                    タイトル
                  </th>
                  <th style={{ 
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    width: '140px'
                  }}>
                    公開日
                  </th>
                  <th style={{ 
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    width: '140px'
                  }}>
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {references.map((ref, index) => (
                  <tr 
                    key={ref.id}
                    style={{ 
                      borderBottom: '1px solid var(--color-border-color)',
                      backgroundColor: editingId === ref.id ? '#F9FAFB' : '#FFFFFF'
                    }}
                  >
                    <td style={{ 
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: 'var(--color-text-light)'
                    }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {editingId === ref.id ? (
                        <input
                          type="text"
                          value={ref.title}
                          onChange={(e) => handleUpdate(ref.id, 'title', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            fontSize: '14px',
                            border: '1px solid var(--color-border-color)',
                            borderRadius: '6px',
                          }}
                        />
                      ) : (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--color-primary)',
                            textDecoration: 'none',
                            display: 'inline-block',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                          {ref.title}
                        </a>
                      )}
                      {editingId === ref.id && (
                        <div style={{ marginTop: '8px' }}>
                          <input
                            type="url"
                            value={ref.url}
                            onChange={(e) => handleUpdate(ref.id, 'url', e.target.value)}
                            placeholder="URL"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              fontSize: '14px',
                              border: '1px solid var(--color-border-color)',
                              borderRadius: '6px',
                            }}
                          />
                        </div>
                      )}
                      {!isValidUrl(ref.url) && editingId !== ref.id && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#EF4444', 
                          marginTop: '4px' 
                        }}>
                          ※ 無効なURL形式です
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {editingId === ref.id ? (
                        <input
                          type="date"
                          value={ref.publishedDate || ''}
                          onChange={(e) => handleUpdate(ref.id, 'publishedDate', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            fontSize: '14px',
                            border: '1px solid var(--color-border-color)',
                            borderRadius: '6px',
                          }}
                        />
                      ) : (
                        <span style={{ 
                          fontSize: '14px',
                          color: 'var(--color-text)'
                        }}>
                          {ref.publishedDate 
                            ? new Date(ref.publishedDate).toLocaleDateString('ja-JP', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : '-'
                          }
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {editingId === ref.id ? (
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#F3F4F6',
                            color: 'var(--color-text)',
                            border: '1px solid var(--color-border-color)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          完了
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setEditingId(ref.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#F3F4F6',
                              color: 'var(--color-text)',
                              border: '1px solid var(--color-border-color)',
                              borderRadius: '6px',
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(ref.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              borderRadius: '6px',
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            削除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

