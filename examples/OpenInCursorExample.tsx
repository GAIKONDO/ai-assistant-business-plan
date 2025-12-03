/**
 * OpenInCursorButton の使用例
 * 
 * このファイルは参考用のサンプルコードです。
 * 実際のプロジェクトに組み込む際の参考にしてください。
 */

'use client';

import React from 'react';
import OpenInCursorButton from '@/components/OpenInCursorButton';
import { openCursor } from '@/lib/openCursor';

export default function OpenInCursorExample() {
  // 例1: コンポーネントを使用
  const Example1 = () => {
    return (
      <div style={{ padding: '20px' }}>
        <h2>例1: OpenInCursorButtonコンポーネント</h2>
        <OpenInCursorButton
          projectPath={process.env.NEXT_PUBLIC_PROJECT_PATH || '/path/to/your/project'}
          label="Cursorで開く"
          onSuccess={() => {
            alert('Cursorが起動しました！');
          }}
          onError={(error) => {
            alert(`エラー: ${error.message}`);
          }}
        />
      </div>
    );
  };

  // 例2: ユーティリティ関数を直接使用
  const Example2 = () => {
    const handleOpen = async () => {
      const result = await openCursor({
        path: process.env.NEXT_PUBLIC_PROJECT_PATH || '/path/to/your/project',
        onSuccess: () => {
          console.log('Cursorが起動しました');
        },
        onError: (error) => {
          console.error('エラー:', error);
          alert(`エラー: ${error.message}`);
        },
      });

      if (!result.success) {
        console.error('失敗:', result.error);
      }
    };

    return (
      <div style={{ padding: '20px' }}>
        <h2>例2: ユーティリティ関数を直接使用</h2>
        <button
          onClick={handleOpen}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0066CC',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Cursorで開く（カスタムボタン）
        </button>
      </div>
    );
  };

  // 例3: カスタムスタイル
  const Example3 = () => {
    return (
      <div style={{ padding: '20px' }}>
        <h2>例3: カスタムスタイル</h2>
        <OpenInCursorButton
          projectPath={process.env.NEXT_PUBLIC_PROJECT_PATH || '/path/to/your/project'}
          label="📝 Cursorで編集"
          style={{
            backgroundColor: '#10B981',
            padding: '12px 24px',
            fontSize: '16px',
          }}
        />
      </div>
    );
  };

  return (
    <div>
      <h1>OpenInCursor 使用例</h1>
      <Example1 />
      <Example2 />
      <Example3 />
    </div>
  );
}

