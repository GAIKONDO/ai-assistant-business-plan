'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null | undefined;
  sidebarOpen?: boolean;
}

export default function Header({ user, sidebarOpen = false }: HeaderProps) {
  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // サイドバー幅: 70px, サイドメニュー幅: 280px
  const headerMarginLeft = user 
    ? (sidebarOpen ? '350px' : '70px') // サイドメニューが開いているときは350px、閉じているときは70px
    : '0';
  
  const headerWidth = user 
    ? (sidebarOpen ? 'calc(100% - 350px)' : 'calc(100% - 70px)') // サイドメニューが開いているときは350px引く、閉じているときは70px引く
    : '100%';

  return (
    <header style={{
      background: 'linear-gradient(180deg, #1F2933 0%, #18222D 100%)',
      color: 'white',
      padding: 0,
      marginBottom: 0,
      marginLeft: headerMarginLeft,
      width: headerWidth,
      boxShadow: 'none',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'margin-left 0.3s ease, width 0.3s ease'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '20px 48px' }}>
        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 400, letterSpacing: '0.5px', color: 'white' }}>
          株式会社<span style={{ fontWeight: 600 }}>AI</span>アシスタント
        </h1>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>{user.email}</span>
            <button 
              onClick={handleSignOut} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'rgba(255, 255, 255, 0.7)', 
                cursor: 'pointer',
                fontSize: '14px',
                padding: '4px 0',
                transition: 'color 0.2s ease',
                fontWeight: 400
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

