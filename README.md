# 株式会社AIアシスタント - 事業計画策定アプリケーション

事業計画の作成・管理・共有ができるアプリケーションです。

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **認証・データベース**: Firebase (Authentication, Firestore)
- **スタイリング**: CSS Modules, Inline Styles

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ai-assistant-company.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ai-assistant-company.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3005 で起動します。

## デプロイ

### Vercelでのデプロイ（推奨）

1. [Vercel](https://vercel.com)にアカウントを作成
2. GitHubリポジトリをインポート
3. 環境変数を設定
4. デプロイ

### Firebase Hostingでのデプロイ

Firebase Hostingでデプロイする場合は、Firebase Functionsと組み合わせる必要があります。

## 機能

- ユーザー認証（Firebase Authentication）
- 会社本体の事業計画管理
- 事業企画の作成・編集・削除
- 構想の管理
- 事業計画の作成・管理

## ライセンス

Private
