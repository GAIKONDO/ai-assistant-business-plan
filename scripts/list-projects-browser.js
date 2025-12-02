// ブラウザのコンソールで実行するコード
// 事業企画ページ（/business-plan）を開いて、このコードをコンソールに貼り付けて実行してください

(async () => {
  try {
    const { db, auth } = await import('/lib/firebase.ts');
    
    if (!auth?.currentUser || !db) {
      console.error('認証されていません。ログインしてください。');
      return;
    }
    
    const userId = auth.currentUser.uid;
    console.log('ユーザーID:', userId);
    console.log('事業企画を取得中...\n');
    
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    const projectsQuery = query(
      collection(db, 'businessProjects'),
      where('userId', '==', userId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    
    if (projectsSnapshot.empty) {
      console.log('事業企画が見つかりませんでした。');
      return;
    }
    
    console.log(`=== 事業企画一覧（総数: ${projectsSnapshot.size}件） ===\n`);
    
    const projects = [];
    projectsSnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      });
    });
    
    // 動的プロジェクトと固定プロジェクトに分類
    const dynamicProjects = projects.filter(p => !p.isFixed);
    const fixedProjects = projects.filter(p => p.isFixed);
    
    console.log(`動的プロジェクト（isFixed: false）: ${dynamicProjects.length}件`);
    console.log(`固定プロジェクト（isFixed: true）: ${fixedProjects.length}件\n`);
    
    console.log('--- すべてのプロジェクト詳細 ---\n');
    projects.forEach((project, index) => {
      console.log(`[${index + 1}] ID: ${project.id}`);
      console.log(`   名前: ${project.name || '(未設定)'}`);
      console.log(`   説明: ${project.description || '(未設定)'}`);
      console.log(`   userId: ${project.userId || '(なし)'}`);
      console.log(`   serviceId: ${project.serviceId || '(なし)'}`);
      console.log(`   isFixed: ${project.isFixed ? 'true' : 'false'}`);
      console.log(`   linkedPlanIds: ${Array.isArray(project.linkedPlanIds) ? project.linkedPlanIds.join(', ') : '(なし)'}`);
      console.log(`   createdAt: ${project.createdAt ? (project.createdAt instanceof Date ? project.createdAt.toLocaleString('ja-JP') : project.createdAt) : '(なし)'}`);
      console.log(`   updatedAt: ${project.updatedAt ? (project.updatedAt instanceof Date ? project.updatedAt.toLocaleString('ja-JP') : project.updatedAt) : '(なし)'}`);
      console.log('');
    });
    
    console.log('\n--- 動的プロジェクトのみ ---\n');
    dynamicProjects.forEach((project, index) => {
      console.log(`[${index + 1}] ${project.name || '(未設定)'} (ID: ${project.id})`);
    });
    
    console.log('\n--- 固定プロジェクトのみ ---\n');
    fixedProjects.forEach((project, index) => {
      console.log(`[${index + 1}] ${project.name || '(未設定)'} (ID: ${project.id}, serviceId: ${project.serviceId || '(なし)'})`);
    });
    
    // 結果を返す
    return {
      total: projects.length,
      dynamic: dynamicProjects.length,
      fixed: fixedProjects.length,
      projects: projects,
      dynamicProjects: dynamicProjects,
      fixedProjects: fixedProjects,
    };
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
})();

