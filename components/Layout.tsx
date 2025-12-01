'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { usePathname } from 'next/navigation';
import Login from './Login';
import Header from './Header';
import Sidebar from './Sidebar';

const ADMIN_UID = 'PktGlRBWVZc9E0Y3OLSQ4TeRg0P2';

// ユーザー承認状態のキャッシュ（セッション中のみ有効）
const userApprovalCache = new Map<string, { approved: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分間キャッシュ

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  
  // body要素のdata属性を監視してプレゼンテーションモードの状態を取得
  useEffect(() => {
    const checkPresentationMode = () => {
      if (typeof document !== 'undefined') {
        const isPresentation = document.body.hasAttribute('data-presentation-mode') && 
                               document.body.getAttribute('data-presentation-mode') === 'true';
        setIsPresentationMode(isPresentation);
      }
    };
    
    // 初期チェック
    checkPresentationMode();
    
    // MutationObserverでdata属性の変更を監視
    const observer = new MutationObserver(checkPresentationMode);
    if (typeof document !== 'undefined') {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-presentation-mode'],
      });
    }
    
    // フルスクリーン状態も監視（念のため）
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // フルスクリーンが終了したら、data属性も削除
        if (typeof document !== 'undefined') {
          document.body.removeAttribute('data-presentation-mode');
        }
        checkPresentationMode();
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      observer.disconnect();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
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
  const handleToggleSidebar = useCallback(() => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', String(newState));
      // カスタムイベントを発火してサブメニューに通知
      window.dispatchEvent(new Event('sidebarToggle'));
    }
  }, [sidebarOpen]);

  // サイドバー幅: 70px, サイドメニュー幅: 280px
  const sidebarWidth = useMemo(() => user ? (sidebarOpen ? 350 : 70) : 0, [user, sidebarOpen]);
  
  // コンテナを中央配置するためのスタイル
  const containerStyle = useMemo(() => ({
    marginLeft: `${sidebarWidth}px`,
    marginRight: 'auto',
    width: `calc(100% - ${sidebarWidth}px)`,
    maxWidth: '1800px', // 1400pxから1800pxに拡大
    transition: 'margin-left 0.3s ease, width 0.3s ease',
  }), [sidebarWidth]);

  // 現在のページを判定
  const currentPage = useMemo(() => {
    if (pathname === '/') return 'dashboard';
    return pathname.replace('/', '') || 'dashboard';
  }, [pathname]);

  useEffect(() => {
    if (!auth) {
      setFirebaseError('Firebaseが設定されていません。.env.localファイルにFirebase設定を追加してください。');
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // 管理者の場合は承認チェックをスキップ
          if (user.uid === ADMIN_UID) {
            console.log('Layout: 管理者としてログイン');
            setUser(user);
            setLoading(false);
            return;
          }
          
          // ユーザーの承認状態を確認（キャッシュを活用）
          let isApproved = false;
          try {
            if (db) {
              // キャッシュをチェック
              const cached = userApprovalCache.get(user.uid);
              const now = Date.now();
              
              if (cached && (now - cached.timestamp) < CACHE_DURATION) {
                // キャッシュが有効な場合はそれを使用
                isApproved = cached.approved;
                console.log('Layout: キャッシュから承認状態を取得:', { approved: isApproved });
              } else {
                // キャッシュが無効または存在しない場合はFirestoreから取得
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // デバッグログ
                console.log('Layout: ユーザーデータ確認:', {
                  approved: userData.approved,
                });
                
                // 承認されていない場合はログアウト
                if (userData.approved === false) {
                  console.log('Layout: 承認されていないためログアウト');
                    userApprovalCache.set(user.uid, { approved: false, timestamp: now });
                  if (auth) {
                    if (auth) {
                  await signOut(auth);
                }
                  }
                  setUser(null);
                  setLoading(false);
                  return;
                }
                
                // approvedがtrueまたはundefined（既存ユーザー）の場合は承認済み
                if (userData.approved === true || userData.approved === undefined) {
                  isApproved = true;
                    // キャッシュに保存
                    userApprovalCache.set(user.uid, { approved: true, timestamp: now });
                }
              } else {
                // ユーザードキュメントが存在しない場合
                // 新規登録直後の可能性があるため、安全側に倒してログアウト
                // （新規登録時は必ずユーザードキュメントが作成される）
                console.log('Layout: ユーザードキュメントが存在しないため、安全のためログアウト');
                  userApprovalCache.set(user.uid, { approved: false, timestamp: now });
                if (auth) {
                  await signOut(auth);
                }
                setUser(null);
                setLoading(false);
                return;
                }
              }
            }
          } catch (err: any) {
            console.error('承認状態の確認エラー:', err);
            // エラーが発生した場合は、安全側に倒してログアウト
            // 承認状態が確認できない場合はログインを許可しない
            console.log('Layout: 承認状態が確認できないため、安全のためログアウト');
            if (auth) {
              await signOut(auth);
            }
            setUser(null);
            setLoading(false);
            return;
          }
          
          // 承認チェックが成功した場合のみユーザーを設定
          if (isApproved) {
            setUser(user);
            setLoading(false);
          } else {
            // 承認されていない場合はログアウト
            if (auth) {
              await signOut(auth);
            }
            setUser(null);
            setLoading(false);
          }
        } else {
          // ログアウト時はキャッシュをクリア
          if (user) {
            userApprovalCache.delete((user as any).uid);
          }
          setUser(null);
          setLoading(false);
        }
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

  return (
    <main>
      {!isPresentationMode && user && <Sidebar isOpen={sidebarOpen} onToggle={handleToggleSidebar} currentPage={currentPage} />}
      {!isPresentationMode && <Header user={user} sidebarOpen={sidebarOpen} />}
      <div className="container" style={isPresentationMode ? { margin: 0, width: '100%', maxWidth: '100%' } : containerStyle}>
        {user ? children : <Login />}
      </div>
    </main>
  );
}

