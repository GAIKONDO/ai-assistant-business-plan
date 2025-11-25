'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname } from 'next/navigation';
import Login from './Login';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  
  // localStorageからサイドメニューの開閉状態を読み込む
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      return saved === 'true';
    }
    return false;
  });
  
  const pathname = usePathname();

  // サイドメニューの開閉状態をlocalStorageに保存
  const handleToggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', String(newState));
    }
  };

  useEffect(() => {
    if (!auth) {
      setFirebaseError('Firebaseが設定されていません。.env.localファイルにFirebase設定を追加してください。');
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      }, (error) => {
        console.error('認証エラー:', error);
        setFirebaseError('Firebase認証の設定に問題があります。.env.localファイルを確認してください。');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Firebase初期化エラー:', error);
      setFirebaseError('Firebaseの初期化に失敗しました。');
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'var(--color-text-light)',
        fontSize: '14px'
      }}>
        読み込み中...
      </div>
    );
  }

  if (firebaseError) {
    return (
      <main>
        <Header user={null} />
        <div className="container">
          <div className="card" style={{ maxWidth: '600px', margin: '50px auto', textAlign: 'center' }}>
            <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>Firebase設定エラー</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>{firebaseError}</p>
            <div style={{ textAlign: 'left', background: '#f8f9fa', padding: '20px', borderRadius: '4px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>設定手順:</h3>
              <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Firebase Console (https://console.firebase.google.com/) にアクセス</li>
                <li>プロジェクト「ai-assistant-company」を選択</li>
                <li>プロジェクト設定 &gt; 全般 &gt; マイアプリ &gt; Webアプリの設定から設定値を取得</li>
                <li>.env.localファイルに設定値を入力</li>
                <li>開発サーバーを再起動</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // サイドバー幅: 70px, サイドメニュー幅: 280px
  const mainContentMarginLeft = user 
    ? (sidebarOpen ? '350px' : '70px')
    : '0';
  
  const mainContentWidth = user 
    ? (sidebarOpen ? 'calc(100% - 350px)' : 'calc(100% - 70px)')
    : '100%';

  // 現在のページを判定
  const getCurrentPage = () => {
    if (pathname === '/') return 'dashboard';
    return pathname.replace('/', '') || 'dashboard';
  };

  return (
    <main>
      {user && <Sidebar isOpen={sidebarOpen} onToggle={handleToggleSidebar} currentPage={getCurrentPage()} />}
      <Header user={user} sidebarOpen={sidebarOpen} />
      <div className="container" style={{ marginLeft: mainContentMarginLeft, width: mainContentWidth, transition: 'margin-left 0.3s ease, width 0.3s ease' }}>
        {user ? children : <Login />}
      </div>
    </main>
  );
}

