// 固定ページ形式の事業計画の件数を確認するスクリプト
// ブラウザのコンソールで実行してください

(async () => {
  // Firebase SDKが既に読み込まれていることを前提とします
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  const { db, auth } = await import('@/lib/firebase');
  
  if (!auth?.currentUser || !db) {
    console.error('認証されていないか、Firebaseが初期化されていません');
    return;
  }
  
  try {
    const companyQuery = query(
      collection(db, 'companyBusinessPlan'),
      where('userId', '==', auth.currentUser.uid)
    );
    const companySnapshot = await getDocs(companyQuery);
    
    const allPlans = [];
    const fixedPlans = [];
    const componentizedPlans = [];
    
    companySnapshot.forEach((doc) => {
      const data = doc.data();
      const plan = {
        id: doc.id,
        title: data.title || 'タイトルなし',
        pagesBySubMenu: data.pagesBySubMenu,
      };
      
      allPlans.push(plan);
      
      // コンポーネント化版かどうかを判定
      const pagesBySubMenu = data.pagesBySubMenu;
      const isComponentized = pagesBySubMenu && 
        typeof pagesBySubMenu === 'object' && 
        Object.keys(pagesBySubMenu).length > 0 &&
        Object.values(pagesBySubMenu).some((pages) => Array.isArray(pages) && pages.length > 0);
      
      if (isComponentized) {
        componentizedPlans.push(plan);
      } else {
        fixedPlans.push(plan);
      }
    });
    
    console.log('=== 事業計画の件数 ===');
    console.log('合計:', allPlans.length, '件');
    console.log('固定ページ形式:', fixedPlans.length, '件');
    console.log('コンポーネント化版:', componentizedPlans.length, '件');
    console.log('');
    console.log('=== 固定ページ形式の事業計画 ===');
    fixedPlans.forEach((plan, index) => {
      console.log(`${index + 1}. ID: ${plan.id}, タイトル: ${plan.title}`);
    });
    console.log('');
    console.log('=== コンポーネント化版の事業計画 ===');
    componentizedPlans.forEach((plan, index) => {
      console.log(`${index + 1}. ID: ${plan.id}, タイトル: ${plan.title}`);
    });
    console.log('==================');
    
  } catch (error) {
    console.error('エラー:', error);
  }
})();

