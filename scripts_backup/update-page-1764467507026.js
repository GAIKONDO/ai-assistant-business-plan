// page-1764467507026ページのコンテンツを「2. アプリケーションの目的」の内容に更新
// ブラウザのコンソールで実行してください

(async function() {
  const { db, auth } = await import('/lib/firebase');
  const { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  
  if (!auth?.currentUser || !db) {
    console.error('認証されていません');
    return;
  }

  const userId = auth.currentUser.uid;
  const serviceId = 'own-service';
  const conceptId = 'maternity-support-componentized';
  const subMenuId = 'overview';
  const targetPageId = 'page-1764467507026';

  // 「2. アプリケーションの目的」のコンテンツ（HTML形式）
  const applicationPurposeContent = `<div style="margin-bottom: 40px">
  <!-- メイン見出し -->
  <div style="margin-bottom: 24px; text-align: center">
    <h2 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700; color: #1F2937; line-height: 1.4; letter-spacing: -0.5px">
      多くの人が困っていること
    </h2>
    <p style="margin: 0; font-size: 16px; font-weight: 500; color: #6B7280; letter-spacing: 0.3px; line-height: 1.6">
      情報の分散、手続きの複雑さ、費用の不明確さなど、出産・育児を迎える多くの人が直面する共通の課題
    </p>
  </div>

  <!-- 8つの課題（2行×4列のグリッド） -->
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 24px; padding-left: 11px">
    <!-- 1. 情報が分散 -->
    <div style="text-align: center">
      <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #5A6578; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: var(--color-text)">
        <div style="font-weight: 600; margin-bottom: 4px; font-size: 15px">情報が分散</div>
        <div style="font-size: 12px; color: var(--color-text-light)">受けられる制度が分からない</div>
      </div>
    </div>

    <!-- 2. 制度の把握が困難 -->
    <div style="text-align: center">
      <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #5A6578; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: var(--color-text)">
        <div style="font-weight: 600; margin-bottom: 4px; font-size: 15px">制度の把握が困難</div>
        <div style="font-size: 12px; color: var(--color-text-light)">企業・自治体の制度を把握しきれない</div>
      </div>
    </div>

    <!-- 3. 手続きが複雑 -->
    <div style="text-align: center">
      <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #5A6578; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: var(--color-text)">
        <div style="font-weight: 600; margin-bottom: 4px; font-size: 15px">手続きが複雑</div>
        <div style="font-size: 12px; color: var(--color-text-light)">いつ何をすればよいか分からない</div>
      </div>
    </div>

    <!-- 4. 必要な書類が不明 -->
    <div style="text-align: center">
      <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #5A6578; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: var(--color-text)">
        <div style="font-weight: 600; margin-bottom: 4px; font-size: 15px">必要な書類が不明</div>
        <div style="font-size: 12px; color: var(--color-text-light)">申請に必要な書類や手続きが分からない</div>
      </div>
    </div>

    <!-- 5. 期限を逃す -->
    <div style="text-align: center">
      <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #5A6578; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: var(--color-text)">
        <div style="font-weight: 600; margin-bottom: 4px; font-size: 15px">期限を逃す</div>
        <div style="font-size: 12px; color: var(--color-text-light)">支援を受けられない</div>
      </div>
    </div>

    <!-- 6. 費用が不明 -->
    <div style="text-align: center">
      <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #5A6578; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: var(--color-text)">
        <div style="font-weight: 600; margin-bottom: 4px; font-size: 15px">費用が不明</div>
        <div style="font-size: 12px; color: var(--color-text-light)">経済的な不安がある</div>
      </div>
    </div>

    <!-- 7. 相談場所がない -->
    <div style="text-align: center">
      <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #5A6578; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: var(--color-text)">
        <div style="font-weight: 600; margin-bottom: 4px; font-size: 15px">相談場所がない</div>
        <div style="font-size: 12px; color: var(--color-text-light)">疑問や不安をすぐに解決できない</div>
      </div>
    </div>

    <!-- 8. 情報共有が困難 -->
    <div style="text-align: center">
      <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #5A6578; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: var(--color-text)">
        <div style="font-weight: 600; margin-bottom: 4px; font-size: 15px">情報共有が困難</div>
        <div style="font-size: 12px; color: var(--color-text-light)">家族と協力して育児を進められない</div>
      </div>
    </div>
  </div>

  <!-- なぜこれまで実現できなかったのか -->
  <div style="margin-bottom: 32px">
    <div style="margin-bottom: 32px; text-align: center">
      <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 700; color: var(--color-text); line-height: 1.3; letter-spacing: -0.5px">
        なぜこれまで実現できなかったのか
      </h2>
      <p style="margin: 0; font-size: 18px; font-weight: 500; color: var(--color-text); letter-spacing: 0.3px; line-height: 1.6">
        従来のアプリケーションやサービスでは、以下の理由から、これらの課題を解決することが困難でした。
      </p>
    </div>
    <!-- 5つの理由のボックス（横一列に配置） -->
    <div style="display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; justify-content: space-between">
      <!-- 1. 情報の分散と見づらさ -->
      <div style="flex: 1 1 calc(20% - 13px); min-width: 180px; padding: 20px; background-color: var(--color-background); border-radius: 8px; border: 1px solid var(--color-border); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05)">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--color-text); line-height: 1.4">
          情報の分散と見づらさ
        </h3>
        <p style="font-size: 13px; line-height: 1.6; color: var(--color-text); margin: 0">
          支援制度は様々な主体が提供しており、それぞれのWebサイトが独立しているため、情報を探すだけでも一苦労である。
        </p>
      </div>

      <!-- 2. パーソナライズ化のコスト -->
      <div style="flex: 1 1 calc(20% - 13px); min-width: 180px; padding: 20px; background-color: var(--color-background); border-radius: 8px; border: 1px solid var(--color-border); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05)">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--color-text); line-height: 1.4">
          パーソナライズ化のコスト
        </h3>
        <p style="font-size: 13px; line-height: 1.6; color: var(--color-text); margin: 0">
          各ユーザーの状況に応じた情報提供には、大量のデータ管理と複雑なロジックが必要で、費用対効果が取れなかった。
        </p>
      </div>

      <!-- 3. 24時間365日のサポート -->
      <div style="flex: 1 1 calc(20% - 13px); min-width: 180px; padding: 20px; background-color: var(--color-background); border-radius: 8px; border: 1px solid var(--color-border); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05)">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--color-text); line-height: 1.4">
          24時間365日のサポート
        </h3>
        <p style="font-size: 13px; line-height: 1.6; color: var(--color-text); margin: 0">
          育児の疑問や不安は時間を選ばず発生するが、人的リソースによる24時間対応はコストが高すぎる。
        </p>
      </div>

      <!-- 4. 複雑な申請フローの可視化 -->
      <div style="flex: 1 1 calc(20% - 13px); min-width: 180px; padding: 20px; background-color: var(--color-background); border-radius: 8px; border: 1px solid var(--color-border); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05)">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--color-text); line-height: 1.4">
          複雑な申請フローの可視化
        </h3>
        <p style="font-size: 13px; line-height: 1.6; color: var(--color-text); margin: 0">
          制度ごとに異なる申請フローを可視化するには、専門知識とデザイン力の両立が必要で、スケーラブルな仕組みがなかった。
        </p>
      </div>

      <!-- 5. 多様なパートナーとの連携 -->
      <div style="flex: 1 1 calc(20% - 13px); min-width: 180px; padding: 20px; background-color: var(--color-background); border-radius: 8px; border: 1px solid var(--color-border); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05)">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--color-text); line-height: 1.4">
          多様なパートナーとの連携
        </h3>
        <p style="font-size: 13px; line-height: 1.6; color: var(--color-text); margin: 0">
          様々なサービスと連携し、ワンストップで提供するには、個別の連携開発が必要で、拡張性に限界があった。
        </p>
      </div>
    </div>
  </div>
</div>`;

  try {
    const conceptsQuery = query(
      collection(db, 'concepts'),
      where('userId', '==', userId),
      where('serviceId', '==', serviceId),
      where('conceptId', '==', conceptId)
    );
    
    const conceptsSnapshot = await getDocs(conceptsQuery);
    
    if (conceptsSnapshot.empty) {
      console.error('構想ドキュメントが見つかりません');
      return;
    }

    const conceptDoc = conceptsSnapshot.docs[0];
    const conceptData = conceptDoc.data();
    
    console.log('構想データ:', conceptData);
    
    // サブメニューごとのページデータを取得
    const pagesBySubMenu = conceptData.pagesBySubMenu || {};
    console.log('pagesBySubMenu:', pagesBySubMenu);
    
    const currentSubMenuPages = pagesBySubMenu[subMenuId] || [];
    console.log(`サブメニュー ${subMenuId} のページ:`, currentSubMenuPages);

    // page-1764467507026ページを検索
    const targetPageIndex = currentSubMenuPages.findIndex(
      (page) => page.id === targetPageId
    );

    if (targetPageIndex === -1) {
      console.warn(`ページ ${targetPageId} が見つかりません。新規作成します。`);
      console.log('利用可能なページ:', currentSubMenuPages.map(p => `${p.id} (${p.title})`));
      
      // ページが存在しない場合は新規作成
      const newPage = {
        id: targetPageId,
        pageNumber: currentSubMenuPages.length,
        title: '2. アプリケーションの目的',
        content: applicationPurposeContent,
        createdAt: new Date().toISOString(),
      };
      
      const updatedPages = [...currentSubMenuPages, newPage];
      
      // ページ順序にも追加
      const pageOrderBySubMenu = conceptData.pageOrderBySubMenu || {};
      const currentSubMenuPageOrder = pageOrderBySubMenu[subMenuId] || [];
      const updatedPageOrder = [...currentSubMenuPageOrder, targetPageId];
      
      const updatedPagesBySubMenu = {
        ...pagesBySubMenu,
        [subMenuId]: updatedPages,
      };
      
      const updatedPageOrderBySubMenu = {
        ...pageOrderBySubMenu,
        [subMenuId]: updatedPageOrder,
      };
      
      await updateDoc(doc(db, 'concepts', conceptDoc.id), {
        pagesBySubMenu: updatedPagesBySubMenu,
        pageOrderBySubMenu: updatedPageOrderBySubMenu,
        updatedAt: serverTimestamp(),
      });
      
      console.log(`✅ ページ ${targetPageId} を新規作成しました`);
      console.log('ページをリロードしてください');
      return;
    }

    console.log(`ページ ${targetPageId} が見つかりました:`, currentSubMenuPages[targetPageIndex]);
    console.log('現在のコンテンツ:', currentSubMenuPages[targetPageIndex].content);

    // ページのコンテンツを更新（強制的に上書き）
    const updatedPages = [...currentSubMenuPages];
    updatedPages[targetPageIndex] = {
      ...updatedPages[targetPageIndex],
      content: applicationPurposeContent,
      title: '2. アプリケーションの目的',
    };

    // 更新データを準備
    const updatedPagesBySubMenu = {
      ...pagesBySubMenu,
      [subMenuId]: updatedPages,
    };

    console.log('更新するデータ:', {
      pagesBySubMenu: updatedPagesBySubMenu,
      targetPage: updatedPages[targetPageIndex]
    });

    // Firestoreに保存
    await updateDoc(doc(db, 'concepts', conceptDoc.id), {
      pagesBySubMenu: updatedPagesBySubMenu,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ ページ ${targetPageId} のコンテンツを更新しました`);
    console.log('ページをリロードしてください');
  } catch (error) {
    console.error('❌ エラー:', error);
  }
})();

