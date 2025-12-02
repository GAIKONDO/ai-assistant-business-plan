import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Firebase Admin SDKの初期化
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('firebase-service-account.jsonが見つかりません。');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function listAllProjects() {
  try {
    console.log('事業企画を取得中...\n');
    
    // すべてのbusinessProjectsを取得
    const projectsSnapshot = await db.collection('businessProjects').get();
    
    if (projectsSnapshot.empty) {
      console.log('事業企画が見つかりませんでした。');
      return;
    }
    
    console.log(`=== 事業企画一覧（総数: ${projectsSnapshot.size}件） ===\n`);
    
    const projects: any[] = [];
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
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

listAllProjects().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('エラー:', error);
  process.exit(1);
});

