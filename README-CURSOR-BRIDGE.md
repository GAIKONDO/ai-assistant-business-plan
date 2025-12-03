# Cursor Bridge セットアップガイド

WebアプリからCursorを外部エディタとして起動するためのローカルブリッジサーバーのセットアップ方法です。

## 📋 概要

このシステムは以下の3層構造で動作します：

1. **React Webアプリ** → 「Open in Cursor」ボタンをクリック
2. **ローカルブリッジサーバー** → HTTPリクエストを受信
3. **Cursor** → OSコマンドで起動

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

Expressが自動的にインストールされます。

### 2. ブリッジサーバーの起動

別のターミナルウィンドウで以下を実行：

```bash
npm run cursor-bridge
```

サーバーが `http://127.0.0.1:9999` で起動します。

### 3. Webアプリの起動

通常通りNext.jsアプリを起動：

```bash
npm run dev
```

## 💻 使用方法

### 基本的な使い方

Reactコンポーネントで `OpenInCursorButton` を使用：

```tsx
import OpenInCursorButton from '@/components/OpenInCursorButton';

function MyComponent() {
  return (
    <OpenInCursorButton
      projectPath="/Users/yourname/your-project"
      label="Cursorで開く"
      onSuccess={() => console.log('Cursorが起動しました')}
      onError={(error) => console.error('エラー:', error)}
    />
  );
}
```

### プログラムから直接呼び出す

ユーティリティ関数を直接使用：

```tsx
import { openCursor } from '@/lib/openCursor';

const handleOpen = async () => {
  const result = await openCursor({
    path: '/Users/yourname/your-project',
    instruction: 'このファイルをリファクタリングしてください', // オプション
    onSuccess: () => {
      console.log('成功！');
    },
    onError: (error) => {
      console.error('エラー:', error);
    },
  });
};
```

### 指示を渡してCursorを起動

指示を渡すと、プロジェクト内の `.cursor-instructions/` ディレクトリに指示ファイルが作成され、Cursorで開かれます：

```tsx
<OpenInCursorButton
  projectPath="/Users/yourname/your-project"
  instruction="このファイルのエラーハンドリングを追加してください"
  label="Cursorで編集"
/>
```

## 🔧 設定

### プロジェクトパスの指定

**重要**: クライアントサイドではファイルシステムパスに直接アクセスできないため、プロジェクトパスを明示的に指定する必要があります。

#### 方法1: 環境変数を使用（推奨）

`.env.local` ファイルを作成：

```env
NEXT_PUBLIC_PROJECT_PATH=/Users/yourname/your-project
```

コンポーネントで使用：

```tsx
<OpenInCursorButton
  projectPath={process.env.NEXT_PUBLIC_PROJECT_PATH}
/>
```

#### 方法2: 設定ファイルを作成

`lib/projectConfig.ts` を作成：

```typescript
export const PROJECT_ROOT_PATH = '/Users/yourname/your-project';
```

#### 方法3: 動的に取得

サーバーサイドAPIルートを作成して、プロジェクトパスを取得：

```typescript
// app/api/project-path/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    path: process.cwd() 
  });
}
```

## 🛠️ トラブルシューティング

### ブリッジサーバーが起動しない

- Node.jsがインストールされているか確認
- ポート9999が既に使用されていないか確認
- Expressがインストールされているか確認: `npm list express`

### Cursorが起動しない

- Cursorがインストールされているか確認
- macOSの場合: `open -a "Cursor"` が動作するか確認
- Linuxの場合: `cursor` コマンドがPATHに含まれているか確認

### ブラウザでCORSエラーが発生する

ブリッジサーバーはローカルホスト（127.0.0.1）でのみ動作するため、CORSエラーは通常発生しません。エラーが発生する場合は、ブラウザのコンソールを確認してください。

## 📝 API仕様

### POST /open-in-cursor

Cursorを起動します。

**リクエスト:**
```json
{
  "path": "/path/to/project",
  "instruction": "指示内容（オプション）"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "Cursor opened: /path/to/project",
  "path": "/path/to/project",
  "instructionFile": "/path/to/project/.cursor-instructions/instruction-1234567890.md"
}
```

### POST /open-in-cursor-with-instruction

指示付きでCursorを起動します。

**リクエスト:**
```json
{
  "path": "/path/to/project",
  "instruction": "このファイルをリファクタリングしてください"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "Cursor opened with instruction: /path/to/project",
  "path": "/path/to/project",
  "instructionFile": "/path/to/project/.cursor-instructions/instruction-1234567890.md"
}
```

### GET /health

サーバーの稼働状況を確認します。

**レスポンス:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "platform": "darwin"
}
```

## 🔒 セキュリティ

- ブリッジサーバーはローカルホスト（127.0.0.1）でのみリッスンします
- 外部からのアクセスはできません
- プロジェクトパスは検証されません（信頼できるソースからのみ使用してください）

## 🧪 テスト方法

設定ページ（`/settings`）に「Cursor起動テスト」セクションがあります。ここから：

1. プロジェクトパスを入力
2. 指示を入力（オプション）
3. 「Cursorで開く」ボタンをクリック

ブリッジサーバーの状態もリアルタイムで確認できます。

## 💡 指示の仕組み

指示を渡すと、以下のように動作します：

1. プロジェクト内に `.cursor-instructions/` ディレクトリが作成されます
2. 指示内容がMarkdownファイルとして保存されます
3. プロジェクトと指示ファイルの両方がCursorで開かれます
4. 指示ファイルをCursorで確認して、作業を開始できます

指示ファイルは自動的に削除されません。不要になったら手動で削除してください。

## 📚 関連ファイル

- `scripts/open-cursor-server.js` - ブリッジサーバー
- `lib/openCursor.ts` - React用ユーティリティ
- `components/OpenInCursorButton.tsx` - Reactコンポーネント

