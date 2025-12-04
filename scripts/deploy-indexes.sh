#!/bin/bash

# Firebaseインデックスのデプロイスクリプト
# 
# 使用方法:
#   chmod +x scripts/deploy-indexes.sh
#   ./scripts/deploy-indexes.sh

echo "📊 Firebaseインデックスをデプロイします..."
echo ""

# プロジェクト確認
echo "現在のプロジェクト:"
firebase use

echo ""
read -p "このプロジェクトにインデックスをデプロイしますか？ (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "デプロイをキャンセルしました。"
    exit 1
fi

echo ""
echo "🚀 インデックスをデプロイ中..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ インデックスのデプロイが完了しました！"
    echo ""
    echo "📝 注意: インデックスの作成には数分かかる場合があります。"
    echo "   Firebase Consoleでインデックスの状態を確認できます:"
    echo "   https://console.firebase.google.com/project/ai-assistant-company/firestore/indexes"
else
    echo ""
    echo "❌ デプロイに失敗しました。エラーメッセージを確認してください。"
    exit 1
fi

