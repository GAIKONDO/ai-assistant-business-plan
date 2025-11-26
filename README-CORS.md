# Firebase Storage CORS設定手順

Firebase StorageへのアップロードがCORSエラーでブロックされている場合、以下の手順でCORS設定を行ってください。

## 方法1: Firebase Consoleから設定（推奨・最も簡単）

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクト「ai-assistant-company」を選択
3. 左メニューから「Storage」を選択
4. 「設定」タブを開く
5. 「CORS設定」セクションで、以下のJSONをコピー＆ペースト：
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
  }
]
```
6. 「保存」をクリック

## 方法2: gsutilコマンドを使用

1. Google Cloud SDKがインストールされていることを確認：
```bash
gsutil --version
```

2. Google Cloudにログイン：
```bash
gcloud auth login
```

3. プロジェクトを設定：
```bash
gcloud config set project ai-assistant-company
```

4. バケット名を確認（Firebase Consoleで確認するか、以下を実行）：
```bash
gcloud storage buckets list --project=ai-assistant-company
```

5. CORS設定を適用（バケット名を確認してから）：
```bash
gsutil cors set cors.json gs://<バケット名>
```

## 確認

設定後、ブラウザのコンソールでCORSエラーが解消されているか確認してください。

