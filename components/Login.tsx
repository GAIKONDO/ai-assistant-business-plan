'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const ADMIN_UID = 'PktGlRBWVZc9E0Y3OLSQ4TeRg0P2';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth || !db) {
      setError('Firebaseが設定されていません。.env.localファイルにFirebase設定を追加してください。');
      setLoading(false);
      return;
    }

    try {
      let userCredential;
      if (isSignUp) {
        // 新規登録時
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 管理者情報を取得
        const adminDoc = await getDoc(doc(db, 'admins', ADMIN_UID));
        const adminEmail = adminDoc.exists() ? adminDoc.data().email : null;
        
        // ユーザー情報を承認待ち状態で保存
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          createdAt: serverTimestamp(),
          approved: false, // 承認待ち
          approvedBy: null,
          approvedAt: null,
          requestedAt: serverTimestamp(),
        });
        
        // 承認リクエストを保存（管理者に通知するため）
        // 権限エラーが発生する可能性があるため、try-catchで囲む
        try {
          await setDoc(doc(db, 'approvalRequests', userCredential.user.uid), {
            userId: userCredential.user.uid,
            email: userCredential.user.email,
            requestedAt: serverTimestamp(),
            status: 'pending',
          });
        } catch (approvalErr: any) {
          // 承認リクエストの保存に失敗しても、ユーザードキュメントは保存されているので続行
          console.warn('承認リクエストの保存エラー（無視）:', approvalErr);
        }
        
        // 管理者にメール通知を送る（Firebase Functionsが必要）
        // ここでは一旦Firestoreに保存するだけ。後でFirebase Functionsでメール送信を実装
        
        // 一旦ログアウト（承認待ちのため）
        await signOut(auth);
        
        // フォームをリセット
        setEmail('');
        setPassword('');
        setIsSignUp(false);
        
        // 成功メッセージを表示（エラーではなく情報メッセージ）
        setError(''); // エラーをクリア
        alert('アカウント登録が完了しました。管理者の承認をお待ちください。承認後、ログインできるようになります。');
      } else {
        // ログイン時
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // 管理者の場合は承認チェックをスキップ
        if (userCredential.user.uid === ADMIN_UID) {
          console.log('管理者としてログイン');
          // 管理者情報をFirestoreに保存（初回のみ）
          if (db) {
            try {
              const adminDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
              if (!adminDoc.exists()) {
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                  email: userCredential.user.email,
                  createdAt: serverTimestamp(),
                  approved: true, // 管理者は自動承認
                  approvedBy: null,
                  approvedAt: serverTimestamp(),
                });
              }
            } catch (err) {
              console.warn('管理者情報の保存エラー（無視）:', err);
            }
          }
          // ログイン記録を保存
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: userCredential.user.email,
            lastLoginAt: serverTimestamp(),
          }, { merge: true });
          
          // ログイン履歴を追加
          const loginHistoryRef = doc(collection(db, 'users', userCredential.user.uid, 'loginHistory'));
          await setDoc(loginHistoryRef, {
            loginAt: serverTimestamp(),
            ipAddress: null,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
          });
          return; // 管理者の場合はここで終了
        }
        
        // まず承認リクエストを確認（最優先）
        const approvalRequestDoc = await getDoc(doc(db, 'approvalRequests', userCredential.user.uid));
        const approvalRequestData = approvalRequestDoc.exists() ? approvalRequestDoc.data() : null;
        const hasPendingRequest = approvalRequestData && approvalRequestData.status === 'pending';
        
        // ユーザーの承認状態を確認
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        // デバッグログ
        console.log('承認チェック:', {
          userId: userCredential.user.uid,
          hasPendingRequest,
          approvalRequestStatus: approvalRequestData?.status,
          userExists: userDoc.exists(),
          userApproved: userData?.approved,
        });
        
        // 承認リクエストがpendingの場合は、ユーザードキュメントの状態に関わらずログアウト
        if (hasPendingRequest) {
          console.log('承認待ちのためログアウト');
          await signOut(auth);
          setError('アカウントがまだ承認されていません。管理者の承認をお待ちください。');
          setLoading(false);
          return;
        }
        
        if (!userDoc.exists()) {
          // ユーザードキュメントが存在しない場合
          // 承認リクエストがない場合は既存ユーザーとみなして自動承認
          // （旧ユーザーでFirestoreにデータがない場合）
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: userCredential.user.email,
            createdAt: serverTimestamp(),
            approved: true, // 既存ユーザーは自動承認
            approvedBy: null,
            approvedAt: serverTimestamp(),
          });
        } else {
          // 承認されていない場合はログアウト
          if (userData && userData.approved === false) {
            console.log('承認されていないためログアウト');
            await signOut(auth);
            setError('アカウントがまだ承認されていません。管理者の承認をお待ちください。');
            setLoading(false);
            return;
          }
        }
        
        // ログイン記録を保存（approvedフィールドを保持）
        const updateData: any = {
          email: userCredential.user.email,
          lastLoginAt: serverTimestamp(),
        };
        
        // approvedフィールドが存在する場合は保持
        if (userData && userData.approved !== undefined) {
          updateData.approved = userData.approved;
        }
        
        await setDoc(doc(db, 'users', userCredential.user.uid), updateData, { merge: true });
        
        // ログイン履歴を追加
        const loginHistoryRef = doc(collection(db, 'users', userCredential.user.uid, 'loginHistory'));
        await setDoc(loginHistoryRef, {
          loginAt: serverTimestamp(),
          ipAddress: null,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        });
      }
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>
          {isSignUp ? '新規登録' : 'ログイン'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">メールアドレス</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">パスワード</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && (
            <div style={{ color: '#dc3545', marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}>
              {error}
            </div>
          )}
          <button type="submit" className="button" disabled={loading} style={{ width: '100%' }}>
            {loading ? '処理中...' : isSignUp ? '登録' : 'ログイン'}
          </button>
        </form>
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isSignUp ? '既にアカウントをお持ちの方はこちら' : '新規登録はこちら'}
          </button>
        </div>
      </div>
    </div>
  );
}

