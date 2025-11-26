'use client';

import { useState, useEffect } from 'react';
import { User, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, limit, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Layout from '@/components/Layout';

const ADMIN_UID = 'PktGlRBWVZc9E0Y3OLSQ4TeRg0P2';

interface UserData {
  uid: string;
  email: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  loginCount: number;
  approved?: boolean;
  requestedAt?: string;
}

interface ApprovalRequest {
  userId: string;
  email: string | null;
  requestedAt: string;
  status: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 管理者かどうかを確認
        const admin = currentUser.uid === ADMIN_UID;
        setIsAdmin(admin);
        
        // 管理者情報をFirestoreに保存（初回のみ）
        if (admin && db) {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', ADMIN_UID));
            if (!adminDoc.exists()) {
              // ドキュメントが存在しない場合は作成
              await setDoc(doc(db, 'admins', ADMIN_UID), {
                uid: ADMIN_UID,
                email: currentUser.email,
                createdAt: serverTimestamp(),
              });
            } else {
              // 既存のドキュメントを更新（メールアドレスが変更された場合に備えて）
              await updateDoc(doc(db, 'admins', ADMIN_UID), {
                email: currentUser.email,
              });
            }
          } catch (err) {
            console.error('管理者情報の保存エラー:', err);
          }
        }
        
        await loadUsers();
        if (admin) {
          await loadApprovalRequests();
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      if (!db) return;
      // Firestoreからユーザー情報を取得
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      
      const usersList: UserData[] = [];
      
      // すべてのユーザーのログイン履歴クエリを並列で実行
      const userHistoryPromises = querySnapshot.docs.map(async (userDoc) => {
        const data = userDoc.data();
        const userId = userDoc.id;
        
        // ログイン履歴を取得（最新1件と全件を並列で取得）
        const loginHistoryRef = collection(db, 'users', userId, 'loginHistory');
        const [lastLoginSnapshot, allLoginSnapshot] = await Promise.all([
          getDocs(query(loginHistoryRef, orderBy('loginAt', 'desc'), limit(1))),
          getDocs(query(loginHistoryRef))
        ]);
        
        let lastLoginAt: string | null = null;
        if (lastLoginSnapshot.docs.length > 0) {
          const lastLogin = lastLoginSnapshot.docs[0].data();
          if (lastLogin.loginAt) {
            lastLoginAt = lastLogin.loginAt.toDate().toISOString();
          }
        } else if (data.lastLoginAt) {
          // Firestoreのタイムスタンプを文字列に変換
          lastLoginAt = data.lastLoginAt.toDate ? data.lastLoginAt.toDate().toISOString() : data.lastLoginAt;
        }
        
        const loginCount = allLoginSnapshot.size;
        
        return {
          uid: userId,
          email: data.email || null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || ''),
          lastLoginAt: lastLoginAt,
          loginCount: loginCount,
          approved: data.approved !== undefined ? data.approved : true, // 既存ユーザーは自動承認済みとみなす
          requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate().toISOString() : (data.requestedAt || undefined),
        };
      });
      
      // すべてのユーザーデータを並列で取得
      const usersData = await Promise.all(userHistoryPromises);
      usersList.push(...usersData);

      // 現在ログインしているユーザーも追加（Firestoreにない場合に備えて）
      if (auth && auth.currentUser) {
        const currentUser = auth.currentUser;
        const currentUserExists = usersList.find(u => u.uid === currentUser.uid);
        if (!currentUserExists) {
          usersList.push({
            uid: currentUser.uid,
            email: currentUser.email,
            createdAt: currentUser.metadata.creationTime || '',
            lastLoginAt: currentUser.metadata.lastSignInTime || null,
            loginCount: 0,
          });
        }
      }

      // 最終ログイン日時でソート（新しい順）
      usersList.sort((a, b) => {
        if (!a.lastLoginAt && !b.lastLoginAt) return 0;
        if (!a.lastLoginAt) return 1;
        if (!b.lastLoginAt) return -1;
        return new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime();
      });

      setUsers(usersList);
      setLoading(false);
    } catch (err: any) {
      console.error('ユーザー一覧の取得エラー:', err);
      // Firestoreにusersコレクションがない場合は、現在のユーザーのみ表示
      if (auth && auth.currentUser) {
        setUsers([{
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          createdAt: auth.currentUser.metadata.creationTime || '',
          lastLoginAt: auth.currentUser.metadata.lastSignInTime || null,
          loginCount: 0,
        }]);
      }
      setLoading(false);
    }
  };

  const handleDeleteUser = async (targetUid: string, targetEmail: string | null) => {
    if (!auth?.currentUser) {
      setError('ログインしていません。');
      return;
    }

    // 自分自身を削除する場合
    if (targetUid === auth?.currentUser?.uid) {
      setError('自分自身のアカウントは削除できません。ログアウトしてから再度ログインしてください。');
      return;
    }

    // パスワード確認が必要
    if (!password) {
      setError('アカウント削除にはパスワードの確認が必要です。');
      setDeleteConfirm(targetUid);
      return;
    }

    try {
      // 再認証
      if (!auth?.currentUser?.email) {
        setError('メールアドレスが設定されていません。');
        return;
      }

      const credential = EmailAuthProvider.credential(
        auth?.currentUser?.email,
        password
      );
      if (auth?.currentUser) {
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      // Firestoreからユーザーデータを削除
      try {
        const userDocRef = doc(db, 'users', targetUid);
        await deleteDoc(userDocRef);
      } catch (err) {
        console.warn('Firestoreからの削除エラー（無視）:', err);
      }

      // Firebase Authenticationからユーザーを削除
      // 注意: 管理者権限がないと他のユーザーを削除できません
      // この機能はFirebase Admin SDKが必要です
      setError('他のユーザーのアカウント削除には管理者権限が必要です。Firebase Admin SDKを使用してください。');
      setDeleteConfirm(null);
      setPassword('');
    } catch (err: any) {
      console.error('アカウント削除エラー:', err);
      setError(err.message || 'アカウントの削除に失敗しました。');
      setPassword('');
    }
  };

  const handleDeleteOwnAccount = async () => {
    if (!auth.currentUser) {
      setError('ログインしていません。');
      return;
    }

    if (!password) {
      setError('アカウント削除にはパスワードの確認が必要です。');
      setDeleteConfirm(auth.currentUser.uid);
      return;
    }

    try {
      // 再認証
      if (!auth?.currentUser?.email) {
        setError('メールアドレスが設定されていません。');
        return;
      }

      const credential = EmailAuthProvider.credential(
        auth?.currentUser?.email,
        password
      );
      if (auth?.currentUser) {
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      // Firestoreからユーザーデータを削除
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await deleteDoc(userDocRef);
      } catch (err) {
        console.warn('Firestoreからの削除エラー（無視）:', err);
      }

      // Firebase Authenticationからユーザーを削除
      await deleteUser(auth.currentUser);
      setSuccess('アカウントが削除されました。');
      
      // ログアウトしてログインページにリダイレクト
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      console.error('アカウント削除エラー:', err);
      setError(err.message || 'アカウントの削除に失敗しました。');
      setPassword('');
    }
  };

  const loadApprovalRequests = async () => {
    try {
      if (!db) return;
      
      const requestsRef = collection(db, 'approvalRequests');
      const q = query(requestsRef, where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      
      const requests: ApprovalRequest[] = [];
      for (const requestDoc of querySnapshot.docs) {
        const data = requestDoc.data();
        requests.push({
          userId: data.userId,
          email: data.email || null,
          requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate().toISOString() : (data.requestedAt || ''),
          status: data.status || 'pending',
        });
      }
      
      // リクエスト日時でソート（新しい順）
      requests.sort((a, b) => {
        return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
      });
      
      setApprovalRequests(requests);
    } catch (err: any) {
      console.error('承認リクエストの取得エラー:', err);
    }
  };

  const handleApproveUser = async (userId: string, email: string | null) => {
    if (!isAdmin || !db || !auth.currentUser) {
      setError('管理者権限がありません。');
      return;
    }

    try {
      // ユーザードキュメントを更新
      await updateDoc(doc(db, 'users', userId), {
        approved: true,
        approvedBy: auth.currentUser.uid,
        approvedAt: serverTimestamp(),
      });

      // 承認リクエストを更新
      await updateDoc(doc(db, 'approvalRequests', userId), {
        status: 'approved',
        approvedBy: auth.currentUser.uid,
        approvedAt: serverTimestamp(),
      });

      setSuccess(`${email || userId} のアカウントを承認しました。`);
      
      // リストを再読み込み
      await loadUsers();
      await loadApprovalRequests();
      
      // 成功メッセージを3秒後にクリア
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('承認エラー:', err);
      setError(err.message || '承認に失敗しました。');
    }
  };

  const handleRejectUser = async (userId: string, email: string | null) => {
    if (!isAdmin || !db || !auth.currentUser) {
      setError('管理者権限がありません。');
      return;
    }

    if (!window.confirm(`${email || userId} のアカウント申請を拒否しますか？`)) {
      return;
    }

    try {
      // 承認リクエストを更新
      await updateDoc(doc(db, 'approvalRequests', userId), {
        status: 'rejected',
        rejectedBy: auth.currentUser.uid,
        rejectedAt: serverTimestamp(),
      });

      setSuccess(`${email || userId} のアカウント申請を拒否しました。`);
      
      // リストを再読み込み
      await loadApprovalRequests();
      
      // 成功メッセージを3秒後にクリア
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('拒否エラー:', err);
      setError(err.message || '拒否に失敗しました。');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="card">
          <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>読み込み中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 style={{ marginBottom: '8px' }}>設定</h1>
        <p style={{ margin: 0, marginBottom: '32px', fontSize: '14px', color: 'var(--color-text-light)' }}>
          アカウント設定やアプリケーション設定を管理します
        </p>

        {/* エラーメッセージ */}
        {error && (
          <div className="card" style={{ marginBottom: '24px', backgroundColor: '#fee', borderLeft: '4px solid #dc3545' }}>
            <p style={{ color: '#dc3545', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* 成功メッセージ */}
        {success && (
          <div className="card" style={{ marginBottom: '24px', backgroundColor: '#efe', borderLeft: '4px solid #10B981' }}>
            <p style={{ color: '#10B981', fontSize: '14px', margin: 0 }}>{success}</p>
          </div>
        )}

        {/* 管理者承認セクション */}
        {isAdmin && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>承認待ちアカウント</h2>
            {approvalRequests.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>
                承認待ちのアカウントはありません。
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border-color)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text)' }}>メールアドレス</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text)' }}>申請日時</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text)' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalRequests.map((request) => (
                      <tr
                        key={request.userId}
                        style={{
                          borderBottom: '1px solid var(--color-border-color)',
                        }}
                      >
                        <td style={{ padding: '12px', color: 'var(--color-text)' }}>
                          {request.email || 'メールアドレス未設定'}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--color-text-light)' }}>
                          {request.requestedAt ? new Date(request.requestedAt).toLocaleString('ja-JP') : '不明'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleApproveUser(request.userId, request.email)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                backgroundColor: '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              承認
                            </button>
                            <button
                              onClick={() => handleRejectUser(request.userId, request.email)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              拒否
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* アカウント管理セクション */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>アカウント管理</h2>
          
          {/* 現在のユーザー情報 */}
          {user && (
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--color-border-color)' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 500 }}>現在のアカウント</h3>
              <div style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '16px' }}>
                <p style={{ marginBottom: '8px' }}><strong>メールアドレス:</strong> {user.email || '未設定'}</p>
                <p style={{ marginBottom: '8px' }}><strong>ユーザーID:</strong> {user.uid}</p>
                <p style={{ marginBottom: '8px' }}><strong>作成日時:</strong> {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString('ja-JP') : '不明'}</p>
                {isAdmin && (
                  <p style={{ marginBottom: '8px', color: 'var(--color-primary)', fontWeight: 500 }}>
                    （管理者）
                  </p>
                )}
              </div>
            </div>
          )}

          {/* パスワード確認入力（削除時） */}
          {deleteConfirm && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--color-background)', borderRadius: '6px', border: '1px solid var(--color-border-color)' }}>
              <p style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--color-text)' }}>
                アカウント削除にはパスワードの確認が必要です。
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid var(--color-border-color)',
                  borderRadius: '4px',
                  marginBottom: '12px',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    if (deleteConfirm === user?.uid) {
                      handleDeleteOwnAccount();
                    } else {
                      const targetUser = users.find(u => u.uid === deleteConfirm);
                      if (targetUser) {
                        handleDeleteUser(targetUser.uid, targetUser.email);
                      }
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  削除を実行
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirm(null);
                    setPassword('');
                    setError(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: 'var(--color-border-color)',
                    color: 'var(--color-text)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* 登録済みアカウント一覧（表形式） */}
          <div>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 500 }}>登録済みアカウント</h3>
            {users.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>
                アカウントが見つかりませんでした。
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border-color)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text)' }}>メールアドレス</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text)' }}>作成日時</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text)' }}>最終ログイン</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text)' }}>ログイン回数</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text)' }}>承認状態</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: 'var(--color-text)' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userItem, index) => {
                      const isCurrentUser = userItem.uid === user?.uid;
                      return (
                        <tr
                          key={userItem.uid}
                          style={{
                            borderBottom: '1px solid var(--color-border-color)',
                            backgroundColor: isCurrentUser ? 'var(--color-background)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '12px', color: 'var(--color-text)' }}>
                            {userItem.email || 'メールアドレス未設定'}
                            {isCurrentUser && (
                              <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 500 }}>
                                （現在）
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--color-text-light)' }}>
                            {userItem.createdAt ? new Date(userItem.createdAt).toLocaleString('ja-JP') : '不明'}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--color-text-light)' }}>
                            {userItem.lastLoginAt ? new Date(userItem.lastLoginAt).toLocaleString('ja-JP') : 'ログイン記録なし'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-light)' }}>
                            {userItem.loginCount}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-light)' }}>
                            {userItem.approved === false ? (
                              <span style={{ color: '#F59E0B', fontWeight: 500 }}>承認待ち</span>
                            ) : (
                              <span style={{ color: '#10B981', fontWeight: 500 }}>承認済み</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {isCurrentUser && (
                              <button
                                onClick={() => {
                                  if (window.confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) {
                                    setDeleteConfirm(userItem.uid);
                                  }
                                }}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                              >
                                削除
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

