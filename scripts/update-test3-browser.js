/**
 * ブラウザのコンソールから実行してtest3ページのコンテンツを更新するスクリプト
 * 
 * 使用方法:
 * 1. ブラウザでコンポーネント化されたページを開く
 * 2. 開発者ツールのコンソールを開く
 * 3. このコードをコピー&ペーストして実行
 */

// 「1. 出産支援パーソナルアプリケーションとは」のコンテンツ（HTML形式）
const maternitySupportContent = `
<div style="margin-bottom: 40px">
  <div style="margin-bottom: 32px; text-align: center">
    <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 700; color: var(--color-text); line-height: 1.3; letter-spacing: -0.5px">
      必要な支援を見逃さない、<wbr />安心の出産・育児を。
    </h2>
    <p style="margin: 0; font-size: 18px; font-weight: 500; color: var(--color-text); letter-spacing: 0.3px; line-height: 1.6">
      妊娠・出産・育児を、もっとスマートに、もっと確実に。
    </p>
  </div>
  <div style="margin-bottom: 24px">
    <p style="margin-bottom: 16px; padding-left: 11px">
      妊娠・出産・育児に関する各種支援制度の情報を一元管理し、ユーザーが適切な支援を受けられるようサポートするWebアプリケーションです。ユーザーフレンドリーな設計により、直感的で使いやすいインターフェースを提供します。
    </p>
    <div style="margin-bottom: 16px; padding-left: 11px; display: flex; gap: 24px; align-items: flex-start">
      <div style="flex-shrink: 0">
        <img
          src="/Gemini_Generated_Image_uj5ghguj5ghguj5g.png"
          alt="出産支援パーソナルアプリケーション"
          style="width: 400px; max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1)"
        />
      </div>
      <div style="flex: 1; min-width: 0">
        <div style="margin-bottom: 20px">
          <h5 style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: var(--color-text); border-left: 3px solid var(--color-primary); padding-left: 8px">
            個人への貢献
          </h5>
          <p style="margin-bottom: 0; padding-left: 11px; font-size: 14px; line-height: 1.8">
            支援制度の情報を一元管理し、必要な支援を見逃すことなく受けられるようサポートします。パーソナル分析や収支概算により、経済的な不安を軽減し、安心して出産・育児を迎えられます。
          </p>
        </div>
        <div style="margin-bottom: 20px">
          <h5 style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: var(--color-text); border-left: 3px solid var(--color-primary); padding-left: 8px">
            企業への貢献
          </h5>
          <p style="margin-bottom: 0; padding-left: 11px; font-size: 14px; line-height: 1.8">
            従業員の満足度向上と離職率の低下に貢献します。くるみん認定や健康経営優良法人認定の取得支援を通じて、企業の社会的評価向上をサポートします。
          </p>
        </div>
        <div style="margin-bottom: 0">
          <h5 style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: var(--color-text); border-left: 3px solid var(--color-primary); padding-left: 8px">
            社会への貢献
          </h5>
          <p style="margin-bottom: 0; padding-left: 11px; font-size: 14px; line-height: 1.8">
            すべての妊婦・育児家庭が、必要な支援制度を見逃すことなく、安心して出産・育児を迎えられる社会の実現に貢献します。様々なパートナーと連携し、ワンストップで必要なサービスの利用を実現します。
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
`;

async function updateTest3Content() {
  try {
    // Firebaseのインポート（既にページに読み込まれている場合）
    const { db, auth } = await import('/lib/firebase');
    
    if (!auth?.currentUser || !db) {
      console.error('認証されていません');
      return;
    }

    const userId = auth.currentUser.uid;
    const serviceId = 'component-test';
    const conceptId = 'test-concept';

    // Firestoreから構想ドキュメントを取得
    const { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    
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
    const pages = conceptData.pages || [];

    // test3ページを検索（タイトルが「test3」または「Test3」のページ）
    const test3PageIndex = pages.findIndex(
      (page) => page.title?.toLowerCase() === 'test3'
    );

    if (test3PageIndex === -1) {
      console.error('test3ページが見つかりません。利用可能なページ:', pages.map(p => p.title));
      return;
    }

    // test3ページのコンテンツを更新
    const updatedPages = [...pages];
    updatedPages[test3PageIndex] = {
      ...updatedPages[test3PageIndex],
      content: maternitySupportContent,
    };

    // Firestoreに保存
    await updateDoc(doc(db, 'concepts', conceptDoc.id), {
      pages: updatedPages,
      updatedAt: serverTimestamp(),
    });

    console.log('test3ページのコンテンツを更新しました');
    console.log('ページをリロードしてください');
  } catch (error) {
    console.error('エラー:', error);
  }
}

// 実行
updateTest3Content();

