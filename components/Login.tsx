'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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

    if (!auth) {
      setError('Firebaseが設定されていません。.env.localファイルにFirebase設定を追加してください。');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
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

