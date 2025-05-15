#!/bin/bash
# 統合テスト用スクリプト

# 必要なディレクトリに移動
cd "$(dirname "$0")"

echo "===== 統合テストスクリプト開始 ====="

# モックAIサーバーの起動（バックグラウンドで実行）
echo "モックAIサーバーを起動しています..."
cd ../mock-ai-server
node server.js > ../mcp-gateway/logs/mock-ai-server.log 2>&1 &
MOCK_PID=$!
echo "モックAIサーバーが起動しました (PID: $MOCK_PID)"
sleep 2  # サーバーの起動を待つ

# メインゲートウェイを起動（バックグラウンドで実行）
echo "メインゲートウェイを起動しています..."
cd ../mcp-gateway
node src/app.js > logs/mcp-gateway.log 2>&1 &
MCP_PID=$!
echo "メインゲートウェイが起動しました (PID: $MCP_PID)"
sleep 2  # サーバーの起動を待つ

# モックAIサーバーのテスト
echo ""
echo "===== モックAIサーバーテスト ====="
echo "テキスト生成APIをテストしています..."
curl -s -X POST "http://localhost:3003/v1/completions" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"text-basic-v1\",\"prompt\":\"テスト\"}" | jq

echo ""
echo "画像生成APIをテストしています..."
curl -s -X POST "http://localhost:3003/v1/images/generations" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"image-basic-v1\",\"prompt\":\"テスト画像\",\"n\":1,\"size\":\"512x512\"}" | jq

# メインゲートウェイのテスト
echo ""
echo "===== メインゲートウェイテスト ====="
echo "ルートエンドポイントをテストしています..."
curl -s "http://localhost:3000/" | jq

echo ""
echo "認証APIをテストしています..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}")
echo $LOGIN_RESPONSE | jq

echo ""
echo "JWTトークンを抽出しています..."
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
if [ "$TOKEN" != "null" ]; then
  echo "認証成功: トークンを取得しました"
  
  echo ""
  echo "ユーザー情報APIをテストしています..."
  curl -s "http://localhost:3000/api/auth/me" \
    -H "Authorization: Bearer $TOKEN" | jq
  
  echo ""
  echo "モデル一覧APIをテストしています..."
  curl -s "http://localhost:3000/api/models" \
    -H "Authorization: Bearer $TOKEN" | jq
  
  echo ""
  echo "テキスト生成APIをテストしています..."
  curl -s -X POST "http://localhost:3000/api/models/text-basic/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"prompt\":\"テスト\",\"max_tokens\":100}" | jq
    
  echo ""
  echo "画像生成APIをテストしています..."
  curl -s -X POST "http://localhost:3000/api/models/image-basic/generations" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"prompt\":\"テスト画像\",\"n\":1,\"size\":\"512x512\"}" | jq
else
  echo "認証に失敗しました"
fi

# プロセスの終了
echo ""
echo "===== テスト終了 ====="
echo "プロセスを終了しています..."
kill $MOCK_PID
kill $MCP_PID
echo "すべてのプロセスを終了しました"

echo "テスト完了"
