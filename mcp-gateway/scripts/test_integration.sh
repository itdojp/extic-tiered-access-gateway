#!/bin/bash
# 統合テスト用シェルスクリプト

# 現在のディレクトリを記録
CURRENT_DIR=$(pwd)

echo "===== 統合テスト開始 ====="

# モックAIサーバーのテスト
echo "モックAIサーバーをテストします..."
cd /c/work/GithubCopilot/extic-tiered-access-gateway/mock-ai-server
curl -s -X POST "http://localhost:3003/v1/completions" \
  -H "Content-Type: application/json" \
  -d '{"model":"text-basic-v1","prompt":"テスト"}' > /tmp/mock_test_result.json

# 結果を表示
echo "テスト結果:"
cat /tmp/mock_test_result.json
echo ""

# メインゲートウェイのテスト
echo "メインゲートウェイをテストします..."

# ログインテスト
echo "1. ログインテスト..."
LOGIN_RESULT=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "ログイン結果: $LOGIN_RESULT"
echo ""

# トークン抽出
TOKEN=$(echo $LOGIN_RESULT | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "ログインに失敗しました。テストを中止します。"
  exit 1
fi

echo "トークン取得成功: ${TOKEN:0:20}..."
echo ""

# ユーザー情報取得テスト
echo "2. ユーザー情報取得テスト..."
USER_INFO=$(curl -s -X GET "http://localhost:3000/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "ユーザー情報: $USER_INFO"
echo ""

# 利用可能なモデル一覧取得テスト
echo "3. 利用可能なモデル一覧取得テスト..."
MODELS=$(curl -s -X GET "http://localhost:3000/api/models" \
  -H "Authorization: Bearer $TOKEN")

echo "モデル一覧: $MODELS"
echo ""

# テキスト生成テスト
echo "4. テキスト生成テスト..."
TEXT_COMPLETION=$(curl -s -X POST "http://localhost:3000/api/models/text-basic/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt":"こんにちは","max_tokens":100}')

echo "テキスト生成結果: $TEXT_COMPLETION"
echo ""

# 画像生成テスト
echo "5. 画像生成テスト..."
IMAGE_GENERATION=$(curl -s -X POST "http://localhost:3000/api/models/image-basic/generations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"prompt":"青い空","n":1,"size":"512x512"}')

echo "画像生成結果: $IMAGE_GENERATION"
echo ""

echo "===== 統合テスト完了 ====="

# 元のディレクトリに戻る
cd "$CURRENT_DIR"
