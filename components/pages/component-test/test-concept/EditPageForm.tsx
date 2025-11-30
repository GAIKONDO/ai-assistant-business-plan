'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '@/lib/firebase';
import dynamic from 'next/dynamic';

// Monaco Editorを動的インポート（SSRを回避）
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => (
    <div style={{ 
      height: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid var(--color-border-color)',
      borderRadius: '6px',
      backgroundColor: '#f9fafb',
      color: 'var(--color-text-light)',
    }}>
      エディターを読み込み中...
    </div>
  ),
});

interface EditPageFormProps {
  serviceId?: string;
  conceptId?: string;
  planId?: string; // 会社本体の事業計画用
  subMenuId: string;
  pageId: string;
  initialTitle: string;
  initialContent: string;
  onClose: () => void;
  onPageUpdated: () => void;
}

export default function EditPageForm({ 
  serviceId, 
  conceptId,
  planId,
  subMenuId,
  pageId, 
  initialTitle, 
  initialContent, 
  onClose, 
  onPageUpdated 
}: EditPageFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [keyMessage, setKeyMessage] = useState('');
  const [subMessage, setSubMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const monacoEditorRef = useRef<any>(null);

  // 既存のコンテンツからキーメッセージとサブメッセージを抽出
  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    
    // HTMLからキーメッセージとサブメッセージを抽出
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = initialContent;
    
    // key-message-containerまたはkey-message-titleクラスを持つ要素を探す
    const keyMessageContainer = tempDiv.querySelector('.key-message-container');
    if (keyMessageContainer) {
      const titleElement = keyMessageContainer.querySelector('.key-message-title');
      const subtitleElement = keyMessageContainer.querySelector('.key-message-subtitle');
      
      if (titleElement) {
        setKeyMessage(titleElement.textContent || '');
      }
      if (subtitleElement) {
        setSubMessage(subtitleElement.textContent || '');
      }
    } else {
      // クラスがない場合、h2とpの組み合わせを探す
      const h2Element = tempDiv.querySelector('h2');
      const pElement = tempDiv.querySelector('p');
      
      if (h2Element && pElement) {
        // グラデーションスタイルが含まれているかチェック
        const h2Style = h2Element.getAttribute('style') || '';
        if (h2Style.includes('linear-gradient') || h2Style.includes('background-clip')) {
          setKeyMessage(h2Element.textContent || '');
          setSubMessage(pElement.textContent || '');
        }
      }
    }
  }, [initialTitle, initialContent]);

  // 画像アップロード処理
  const handleImageUpload = async (file: File) => {
    if (!auth?.currentUser || !storage) {
      alert('Firebaseが初期化されていません。');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      return;
    }

    setUploadingImage(true);
    try {
      // ファイル名を生成
      const fileName = `page-image-${Date.now()}-${file.name}`;
      
      // ストレージパスを決定
      let storagePath: string;
      if (planId) {
        // 会社本体の事業計画の場合
        storagePath = `companyBusinessPlan/${planId}/${fileName}`;
      } else if (serviceId && conceptId) {
        // サービス事業計画の場合
        storagePath = `concepts/${serviceId}/${conceptId}/${fileName}`;
      } else {
        throw new Error('必要な情報が不足しています。');
      }

      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      
      // ダウンロードURLを取得
      const downloadURL = await getDownloadURL(storageRef);
      
      // 画像のHTMLタグを生成
      const imageHTML = `<img src="${downloadURL}" alt="アップロード画像" style="max-width: 100%; height: auto; display: block; margin: 16px 0;" />`;
      
      // Monaco Editorのカーソル位置に画像を挿入
      if (monacoEditorRef.current) {
        try {
          const editor = monacoEditorRef.current;
          const position = editor.getPosition();
          const model = editor.getModel();
          
          if (model && position) {
            // カーソル位置に画像を挿入
            const insertText = '\n' + imageHTML + '\n';
            const range = {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            };
            
            model.pushEditOperations(
              [],
              [{
                range: range as any,
                text: insertText,
              }],
              () => null
            );
            
            // カーソルを画像の後に移動
            const newPosition = {
              lineNumber: position.lineNumber + insertText.split('\n').length - 1,
              column: 1,
            };
            editor.setPosition(newPosition);
            editor.focus();
          } else {
            // フォールバック: コンテンツの末尾に追加
            const newContent = content + '\n' + imageHTML;
            setContent(newContent);
          }
        } catch (error) {
          console.error('Monaco Editorへの挿入エラー:', error);
          // フォールバック: コンテンツの末尾に追加
          const newContent = content + '\n' + imageHTML;
          setContent(newContent);
        }
      } else {
        // Monaco Editorが利用できない場合は、コンテンツの末尾に追加
        const newContent = content + '\n' + imageHTML;
        setContent(newContent);
      }
      
      alert('画像をアップロードしました。コンテンツに追加されました。');
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      alert(`画像のアップロードに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // 画像ファイル選択ハンドラー
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // 同じファイルを再度選択できるようにリセット
    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !db) return;
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    try {
      setSaving(true);

      // 会社本体の事業計画の場合の処理
      const isCompanyPlan = !!planId && !serviceId && !conceptId;
      if (isCompanyPlan && planId) {
        // 事業計画ドキュメントを取得
        const planDoc = await getDoc(doc(db, 'companyBusinessPlan', planId));
        
        if (!planDoc.exists()) {
          alert('事業計画が見つかりませんでした。');
          setSaving(false);
          return;
        }

        const planData = planDoc.data();
        const pagesBySubMenu = planData.pagesBySubMenu || {};
        const pageOrderBySubMenu = planData.pageOrderBySubMenu || {};
        
        // 現在のサブメニューのページデータを取得
        const currentSubMenuPages = pagesBySubMenu[subMenuId] || [];
        
        // キーメッセージとサブメッセージをHTMLにフォーマット
        let formattedContent = content.trim();
        
        // キーメッセージまたはサブメッセージが入力されている場合
        if (keyMessage.trim() || subMessage.trim()) {
          const keyMessageHTML = `
  <!-- キーメッセージ - 最大化 -->
  <div class="key-message-container" style="margin-bottom: ${keyMessage.trim() && subMessage.trim() ? '32px' : '48px'}">
    ${keyMessage.trim() ? `<h2 class="key-message-title" style="margin: 0 0 ${subMessage.trim() ? '12px' : '16px'} 0; line-height: 1.4">
      ${keyMessage.trim()}
    </h2>` : ''}
    ${subMessage.trim() ? `<p class="key-message-subtitle">
      ${subMessage.trim()}
    </p>` : ''}
  </div>`;
          
          // 既存のコンテンツからキーメッセージ部分を削除
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = formattedContent;
          
          // key-message-containerを削除
          const existingKeyMessageContainer = tempDiv.querySelector('.key-message-container');
          if (existingKeyMessageContainer) {
            existingKeyMessageContainer.remove();
          } else {
            // クラスがない場合、h2とpの組み合わせを削除
            const h2Element = tempDiv.querySelector('h2');
            const pElement = tempDiv.querySelector('p');
            if (h2Element && pElement) {
              const h2Style = h2Element.getAttribute('style') || '';
              if (h2Style.includes('linear-gradient') || h2Style.includes('background-clip')) {
                h2Element.remove();
                pElement.remove();
              }
            }
          }
          
          // キーメッセージを先頭に追加
          formattedContent = keyMessageHTML + '\n' + tempDiv.innerHTML.trim();
        }
        
        // ページを更新
        const updatedPages = currentSubMenuPages.map((page: any) => 
          page.id === pageId 
            ? { ...page, title: title.trim(), content: formattedContent || '<p>コンテンツを入力してください。</p>' }
            : page
        );
        
        // 更新データを準備
        const updatedPagesBySubMenu = {
          ...pagesBySubMenu,
          [subMenuId]: updatedPages,
        };
        
        // Firestoreに保存
        await setDoc(
          doc(db, 'companyBusinessPlan', planId),
          {
            ...planData,
            pagesBySubMenu: updatedPagesBySubMenu,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        
        setSaving(false);
        onPageUpdated();
        onClose();
        return;
      }

      // 事業企画の場合の処理
      if (!serviceId || !conceptId) {
        alert('必要な情報が不足しています。');
        setSaving(false);
        return;
      }

      // 構想ドキュメントを検索
      const conceptsQuery = query(
        collection(db, 'concepts'),
        where('userId', '==', auth.currentUser.uid),
        where('serviceId', '==', serviceId),
        where('conceptId', '==', conceptId)
      );
      
      const conceptsSnapshot = await getDocs(conceptsQuery);
      
      if (conceptsSnapshot.empty) {
        alert('構想ドキュメントが見つかりません');
        setSaving(false);
        return;
      }

      const conceptDoc = conceptsSnapshot.docs[0];
      const conceptData = conceptDoc.data();
      
      // サブメニューごとのページデータを取得
      const pagesBySubMenu = (conceptData.pagesBySubMenu as { [key: string]: Array<{
        id: string;
        pageNumber: number;
        title: string;
        content: string;
      }> }) || {};
      
      // 現在のサブメニューのページデータを取得
      const currentSubMenuPages = pagesBySubMenu[subMenuId] || [];
      
      // overviewの場合は後方互換性のために古い形式もチェック
      let pages: Array<{
        id: string;
        pageNumber: number;
        title: string;
        content: string;
      }>;
      
      if (subMenuId === 'overview') {
        const oldPages = (conceptData.pages as Array<{
          id: string;
          pageNumber: number;
          title: string;
          content: string;
        }>) || [];
        pages = currentSubMenuPages.length > 0 ? currentSubMenuPages : oldPages;
      } else {
        pages = currentSubMenuPages;
      }

      // 編集対象のページを検索
      const pageIndex = pages.findIndex((page: any) => page.id === pageId);
      if (pageIndex === -1) {
        alert('ページが見つかりません');
        return;
      }

      // キーメッセージとサブメッセージをHTMLにフォーマット
      let formattedContent = content.trim();
      
      // キーメッセージまたはサブメッセージが入力されている場合
      if (keyMessage.trim() || subMessage.trim()) {
        const keyMessageHTML = `
  <!-- キーメッセージ - 最大化 -->
  <div class="key-message-container" style="margin-bottom: ${keyMessage.trim() && subMessage.trim() ? '32px' : '48px'}">
    ${keyMessage.trim() ? `<h2 class="key-message-title" style="margin: 0 0 ${subMessage.trim() ? '12px' : '16px'} 0; line-height: 1.4">
      ${keyMessage.trim()}
    </h2>` : ''}
    ${subMessage.trim() ? `<p class="key-message-subtitle">
      ${subMessage.trim()}
    </p>` : ''}
  </div>`;
        
        // 既存のコンテンツからキーメッセージ部分を削除
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formattedContent;
        
        // key-message-containerを削除
        const existingKeyMessageContainer = tempDiv.querySelector('.key-message-container');
        if (existingKeyMessageContainer) {
          existingKeyMessageContainer.remove();
        } else {
          // クラスがない場合、h2とpの組み合わせを削除
          const h2Element = tempDiv.querySelector('h2');
          const pElement = tempDiv.querySelector('p');
          if (h2Element && pElement) {
            const h2Style = h2Element.getAttribute('style') || '';
            if (h2Style.includes('linear-gradient') || h2Style.includes('background-clip')) {
              h2Element.remove();
              pElement.remove();
            }
          }
        }
        
        // キーメッセージを先頭に追加
        formattedContent = keyMessageHTML + '\n' + tempDiv.innerHTML.trim();
      }
      
      // ページのコンテンツを更新
      const updatedPages = [...pages];
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        title: title.trim(),
        content: formattedContent || '<p>コンテンツを入力してください。</p>',
      };

      // 更新データを準備
      const updatedPagesBySubMenu = {
        ...pagesBySubMenu,
        [subMenuId]: updatedPages,
      };
      
      const updateData: any = {
        pagesBySubMenu: updatedPagesBySubMenu,
        updatedAt: serverTimestamp(),
      };
      
      // overviewの場合は後方互換性のために古い形式も更新
      if (subMenuId === 'overview') {
        updateData.pages = updatedPages;
      }

      // Firestoreに保存
      await updateDoc(doc(db, 'concepts', conceptDoc.id), updateData);
      
      onPageUpdated();
      onClose();
    } catch (error: any) {
      console.error('ページ更新エラー:', error);
      alert(`ページの更新に失敗しました: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      border: '1px solid var(--color-border-color)',
      marginBottom: '24px',
    }}>
      <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 600 }}>
        ページを編集
      </h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="editPageTitle" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
            ページタイトル *
          </label>
          <input
            id="editPageTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: はじめに"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--color-border-color)',
              borderRadius: '6px',
              fontSize: '14px',
            }}
            required
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="editKeyMessage" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
            キーメッセージ（任意）
          </label>
          <input
            id="editKeyMessage"
            type="text"
            value={keyMessage}
            onChange={(e) => setKeyMessage(e.target.value)}
            placeholder="例: 必要な支援を見逃さない、安心の出産・育児を。"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--color-border-color)',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-text-light)' }}>
            グラデーションスタイルが自動的に適用されます
          </p>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="editSubMessage" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
            サブメッセージ（任意）
          </label>
          <input
            id="editSubMessage"
            type="text"
            value={subMessage}
            onChange={(e) => setSubMessage(e.target.value)}
            placeholder="例: 妊娠・出産・育児を、もっとスマートに、もっと確実に。"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--color-border-color)',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label htmlFor="editPageContent" style={{ fontSize: '14px', fontWeight: 500 }}>
              コンテンツ（HTML形式）
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileSelect}
                style={{ display: 'none' }}
                id="imageUploadInput"
              />
              <label
                htmlFor="imageUploadInput"
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#10B981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  opacity: uploadingImage ? 0.6 : 1,
                  display: 'inline-block',
                }}
              >
                {uploadingImage ? 'アップロード中...' : '📷 画像を追加'}
              </label>
            </div>
          </div>
          <div style={{
            border: '1px solid var(--color-border-color)',
            borderRadius: '6px',
            overflow: 'hidden',
            minHeight: '400px',
          }}>
            <MonacoEditor
              height="400px"
              language="html"
              value={content}
              onChange={(value) => setContent(value || '')}
              onMount={(editor) => {
                monacoEditorRef.current = editor;
              }}
              theme="vs"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'off', // 改行を保持するためoffに
                formatOnPaste: true,
                formatOnType: false, // 自動フォーマットを無効化（改行が消えるのを防ぐ）
                autoIndent: 'full',
                bracketPairColorization: { enabled: true },
                colorDecorators: true,
                insertSpaces: true,
                detectIndentation: true,
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                },
              }}
            />
          </div>
          <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-text-light)' }}>
            HTMLタグを使用できます（例: &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;など）。タグの自動補完とシンタックスハイライトが有効です。
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#F3F4F6',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border-color)',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            disabled={saving}
          >
            キャンセル
          </button>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}

