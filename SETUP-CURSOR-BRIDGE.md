# Cursor Bridge セットアップ手順

WebアプリからCursorを起動して指示を出す機能のセットアップ手順です。

## 📋 前提条件

- Node.jsがインストールされていること
- Cursorエディタがインストールされていること
- このプロジェクトのルートディレクトリにいること

## 🚀 セットアップ手順

### ステップ1: 依存関係のインストール

ターミナルで以下のコマンドを実行：

```bash
npm install
```

これでExpressなどの必要なパッケージがインストールされます。

### ステップ2: ブリッジサーバーの起動

**新しいターミナルウィンドウ**を開いて、以下のコマンドを実行：

```bash
npm run cursor-bridge
```

以下のようなメッセージが表示されれば成功です：

```
🚀 Cursor Bridge Server running on http://127.0.0.1:9999
📝 Ready to open Cursor from web app
💡 Health check: http://127.0.0.1:9999/health
```

**重要**: このターミナルは開いたままにしておいてください。サーバーが動作し続けます。

### ステップ3: Webアプリの起動

**別のターミナルウィンドウ**を開いて、以下のコマンドを実行：

```bash
npm run dev
```

ブラウザで `http://localhost:3005` にアクセスできるようになります。

## 🧪 テスト手順

### 方法1: 設定ページからテスト（推奨）

1. ブラウザで `http://localhost:3005/settings` にアクセス
2. ページを下にスクロールして「Cursor起動テスト」セクションを見つける
3. ブリッジサーバーの状態を確認
   - 🟢 緑色 = サーバーが稼働中
   - 🔴 赤色 = サーバーが起動していない（ステップ2を確認）
4. **プロジェクトパス**を入力
   - 例: `/Users/yourname/your-project`
   - 例: `/Users/gaikondo/Desktop/test-app/app32_株式会社AIアシスタント`
5. **指示**を入力（オプション）
   - 例: `このファイルをリファクタリングしてください`
   - 例: `エラーハンドリングを追加してください`
6. 「📝 Cursorで開く」ボタンをクリック
7. Cursorが起動し、プロジェクトが開きます
8. 指示を入力した場合、指示ファイルもCursorで開かれます

### 方法2: コードから直接使用

Reactコンポーネントで使用する場合：

```tsx
import OpenInCursorButton from '@/components/OpenInCursorButton';

function MyComponent() {
  return (
    <OpenInCursorButton
      projectPath="/Users/yourname/your-project"
      instruction="このファイルをリファクタリングしてください"
      label="Cursorで編集"
    />
  );
}
```

または、ユーティリティ関数を直接使用：

```tsx
import { openCursor } from '@/lib/openCursor';

const handleOpen = async () => {
  await openCursor({
    path: '/Users/yourname/your-project',
    instruction: 'このファイルをリファクタリングしてください',
    onSuccess: () => {
      console.log('Cursorが起動しました！');
    },
    onError: (error) => {
      console.error('エラー:', error);
    },
  });
};
```

## 🔍 トラブルシューティング

### ブリッジサーバーが起動しない

**エラー**: `Cannot find module 'express'`

**解決方法**:
```bash
npm install express
```

### ポート9999が既に使用されている

**エラー**: `Error: listen EADDRINUSE: address already in use :::9999`

**解決方法**:
1. 他のプロセスがポート9999を使用している可能性があります
2. ターミナルで以下を実行して確認：
   ```bash
   lsof -i :9999
   ```
3. プロセスを終了するか、`scripts/open-cursor-server.js` のポート番号を変更

### Cursorが起動しない

**確認事項**:
1. Cursorがインストールされているか確認
2. macOSの場合、以下をターミナルで実行して確認：
   ```bash
   open -a "Cursor"
   ```
3. Linuxの場合、`cursor` コマンドがPATHに含まれているか確認：
   ```bash
   which cursor
   ```

### ブリッジサーバーの状態が「🔴 赤色」のまま

**確認事項**:
1. ステップ2でブリッジサーバーを起動したか確認
2. ターミナルにエラーメッセージがないか確認
3. ブラウザのコンソールにエラーがないか確認（F12キーで開発者ツールを開く）

### 指示ファイルが作成されない

**確認事項**:
1. プロジェクトパスが正しいか確認（存在するディレクトリを指定）
2. プロジェクトディレクトリに書き込み権限があるか確認
3. ブリッジサーバーのターミナルにエラーメッセージがないか確認

## 📝 動作の仕組み

1. **Webアプリ** → 「Cursorで開く」ボタンをクリック
2. **HTTPリクエスト** → `http://127.0.0.1:9999/open-in-cursor` に送信
3. **ブリッジサーバー** → リクエストを受信
4. **指示ファイル作成** → プロジェクト内に `.cursor-instructions/instruction-{timestamp}.md` を作成
5. **Cursor起動** → OSコマンドでCursorを起動
6. **ファイルを開く** → プロジェクトと指示ファイルの両方をCursorで開く

## 💡 ヒント

- ブリッジサーバーは常に起動しておく必要があります
- 指示ファイルは自動的に削除されません。不要になったら手動で削除してください
- プロジェクトパスは環境変数に設定しておくと便利です（`.env.local`）
- 設定ページのテストセクションで、ブリッジサーバーの状態をリアルタイムで確認できます

## 🎯 次のステップ

1. 実際のプロジェクトパスでテストしてみる
2. 指示を入力してCursorで開いてみる
3. 自分のコンポーネントに組み込んでみる
4. 環境変数でプロジェクトパスを設定する

## 📚 関連ファイル

- `scripts/open-cursor-server.js` - ブリッジサーバー
- `lib/openCursor.ts` - React用ユーティリティ
- `components/OpenInCursorButton.tsx` - Reactコンポーネント
- `app/settings/page.tsx` - テストページ
- `README-CURSOR-BRIDGE.md` - 詳細なドキュメント

