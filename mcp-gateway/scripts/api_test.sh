#!/bin/bash
# 多段階アクセス制御モデルゲートウェイAPIテストスクリプト
# 様々なユーザー権限でのテストを実行する

# 色付きの出力のための設定
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 初期設定
API_BASE_URL="http://localhost:3000"
MOCK_AI_URL="http://localhost:3003"
ADMIN_USER="admin"
ADMIN_PASS="admin123"
BASIC_USER="basic_user"
BASIC_PASS="basic123"
ADVANCED_USER="advanced_user" 
ADVANCED_PASS="advanced123"

# ヘルパー関数：タイトル表示用
print_title() {
  echo -e "${BLUE}==== $1 ====${NC}"
}

# ヘルパー関数：ステップ表示用
print_step() {
  echo -e "${YELLOW}>> $1${NC}"
}

# ヘルパー関数：成功表示用
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# ヘルパー関数：エラー表示用
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# ヘルパー関数：結果表示用
print_result() {
  local result=$1
  local success_message=$2
  local error_message=$3
  
  if [[ $result == *"success\":true"* ]]; then
    print_success "$success_message"
  else
    print_error "$error_message: $result"
  fi
}

# ヘルパー関数：ログイン用
do_login() {
  local username=$1
  local password=$2
  
  print_step "$username でログインしています..."
  
  local result=$(curl -s -X POST "${API_BASE_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$username\",\"password\":\"$password\"}")
  
  if [[ $result == *"token"* ]]; then
    local token=$(echo $result | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    print_success "ログイン成功: トークン取得"
    echo $token
  else
    print_error "ログイン失敗: $result"
    echo ""
  fi
}

# ヘルパー関数：APIリクエスト実行用
do_api_request() {
  local method=$1
  local endpoint=$2
  local token=$3
  local data=$4
  
  if [[ -z $data ]]; then
    curl -s -X $method "${API_BASE_URL}${endpoint}" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json"
  else
    curl -s -X $method "${API_BASE_URL}${endpoint}" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d "$data"
  fi
}

# 事前チェック
print_title "事前チェック"

# モックAIサーバーが稼働中か確認
print_step "モックAIサーバーが稼働中か確認しています..."
mock_ai_status=$(curl -s -m 2 -o /dev/null -w "%{http_code}" "${MOCK_AI_URL}/v1/completions" -H "Content-Type: application/json" -d '{"model":"text-basic-v1","prompt":"test"}')

if [[ $mock_ai_status -eq 200 ]]; then
  print_success "モックAIサーバーは稼働中です (HTTPステータス: $mock_ai_status)"
else
  print_error "モックAIサーバーに接続できません (HTTPステータス: $mock_ai_status)"
  echo "モックAIサーバーが起動していない場合は、別のターミナルで以下のコマンドを実行してください："
  echo "cd /c/work/GithubCopilot/extic-tiered-access-gateway/mock-ai-server && PORT=3003 node server.js"
  echo "テストを続行します（フォールバックレスポンスで動作確認可能）..."
fi

# メインゲートウェイが稼働中か確認
print_step "メインゲートウェイが稼働中か確認しています..."
gateway_status=$(curl -s -m 2 -o /dev/null -w "%{http_code}" "${API_BASE_URL}")

if [[ $gateway_status -eq 200 ]]; then
  print_success "メインゲートウェイは稼働中です (HTTPステータス: $gateway_status)"
else
  print_error "メインゲートウェイに接続できません (HTTPステータス: $gateway_status)"
  echo "メインゲートウェイが起動していない場合は、別のターミナルで以下のコマンドを実行してください："
  echo "cd /c/work/GithubCopilot/extic-tiered-access-gateway/mcp-gateway && node src/app.js"
  exit 1
fi

# ケース1: 管理者ユーザーテスト
print_title "1. 管理者ユーザーテスト"

# ログイン
admin_token=$(do_login $ADMIN_USER $ADMIN_PASS)

if [[ -z $admin_token ]]; then
  print_error "管理者としてのログインに失敗しました。テストを終了します。"
  exit 1
fi

# ユーザー情報取得
print_step "管理者のユーザー情報を取得しています..."
user_info=$(do_api_request "GET" "/api/auth/me" "$admin_token")
print_result "$user_info" "ユーザー情報取得成功" "ユーザー情報取得失敗"

# モデル一覧取得
print_step "利用可能なモデル一覧を取得しています..."
models=$(do_api_request "GET" "/api/models" "$admin_token")
print_result "$models" "モデル一覧取得成功" "モデル一覧取得失敗"

# テキスト生成（基本モデル）
print_step "基本テキストモデルでテキスト生成しています..."
text_basic=$(do_api_request "POST" "/api/models/text-basic/completions" "$admin_token" \
  '{"prompt":"こんにちは、私は管理者です。","max_tokens":100}')
print_result "$text_basic" "テキスト生成成功" "テキスト生成失敗"

# テキスト生成（高度モデル）
print_step "高度テキストモデルでテキスト生成しています..."
text_advanced=$(do_api_request "POST" "/api/models/text-advanced/completions" "$admin_token" \
  '{"prompt":"高度なモデルを使ってテキスト生成します。","max_tokens":200}')
print_result "$text_advanced" "高度テキスト生成成功" "高度テキスト生成失敗"

# 画像生成（基本モデル）
print_step "基本画像モデルで画像生成しています..."
image_basic=$(do_api_request "POST" "/api/models/image-basic/generations" "$admin_token" \
  '{"prompt":"青い空と緑の草原","n":1,"size":"512x512"}')
print_result "$image_basic" "画像生成成功" "画像生成失敗"

# 管理者機能テスト（ユーザー一覧）
print_step "管理者機能: ユーザー一覧を取得しています..."
admin_users=$(do_api_request "GET" "/api/admin/users" "$admin_token")
print_result "$admin_users" "ユーザー一覧取得成功" "ユーザー一覧取得失敗"

# 管理者機能テスト（ログ一覧）
print_step "管理者機能: ログ一覧を取得しています..."
admin_logs=$(do_api_request "GET" "/api/admin/logs" "$admin_token")
print_result "$admin_logs" "ログ一覧取得成功" "ログ一覧取得失敗"

# 管理者機能テスト（統計情報）
print_step "管理者機能: 統計情報を取得しています..."
admin_stats=$(do_api_request "GET" "/api/admin/stats" "$admin_token")
print_result "$admin_stats" "統計情報取得成功" "統計情報取得失敗"

# ケース2: 基本ユーザーテスト
print_title "2. 基本ユーザーテスト"

# ログイン
basic_token=$(do_login $BASIC_USER $BASIC_PASS)

if [[ -z $basic_token ]]; then
  print_error "基本ユーザーとしてのログインに失敗しました。この部分のテストをスキップします。"
else
  # ユーザー情報取得
  print_step "基本ユーザーの情報を取得しています..."
  user_info=$(do_api_request "GET" "/api/auth/me" "$basic_token")
  print_result "$user_info" "ユーザー情報取得成功" "ユーザー情報取得失敗"

  # モデル一覧取得
  print_step "利用可能なモデル一覧を取得しています..."
  models=$(do_api_request "GET" "/api/models" "$basic_token")
  print_result "$models" "モデル一覧取得成功" "モデル一覧取得失敗"

  # テキスト生成（基本モデル）
  print_step "基本テキストモデルでテキスト生成しています..."
  text_basic=$(do_api_request "POST" "/api/models/text-basic/completions" "$basic_token" \
    '{"prompt":"こんにちは、私は基本ユーザーです。","max_tokens":100}')
  print_result "$text_basic" "テキスト生成成功" "テキスト生成失敗"

  # テキスト生成（高度モデル - アクセス拒否期待）
  print_step "高度テキストモデルでテキスト生成を試みています（アクセス拒否期待）..."
  text_advanced=$(do_api_request "POST" "/api/models/text-advanced/completions" "$basic_token" \
    '{"prompt":"高度なモデルを使ってテキスト生成します。","max_tokens":200}')
  if [[ $text_advanced == *"access"*"false"* ]]; then
    print_success "期待通りアクセスが拒否されました"
  else
    print_error "期待に反してアクセスが許可されました: $text_advanced"
  fi

  # 管理者機能テスト（アクセス拒否期待）
  print_step "管理者機能: ユーザー一覧取得を試みています（アクセス拒否期待）..."
  admin_users=$(do_api_request "GET" "/api/admin/users" "$basic_token")
  if [[ $admin_users == *"success\":false"* ]]; then
    print_success "期待通りアクセスが拒否されました"
  else
    print_error "期待に反してアクセスが許可されました: $admin_users"
  fi
fi

# ケース3: 高度ユーザーテスト
print_title "3. 高度ユーザーテスト"

# ログイン
advanced_token=$(do_login $ADVANCED_USER $ADVANCED_PASS)

if [[ -z $advanced_token ]]; then
  print_error "高度ユーザーとしてのログインに失敗しました。この部分のテストをスキップします。"
else
  # ユーザー情報取得
  print_step "高度ユーザーの情報を取得しています..."
  user_info=$(do_api_request "GET" "/api/auth/me" "$advanced_token")
  print_result "$user_info" "ユーザー情報取得成功" "ユーザー情報取得失敗"

  # モデル一覧取得
  print_step "利用可能なモデル一覧を取得しています..."
  models=$(do_api_request "GET" "/api/models" "$advanced_token")
  print_result "$models" "モデル一覧取得成功" "モデル一覧取得失敗"

  # テキスト生成（基本モデル）
  print_step "基本テキストモデルでテキスト生成しています..."
  text_basic=$(do_api_request "POST" "/api/models/text-basic/completions" "$advanced_token" \
    '{"prompt":"こんにちは、私は高度ユーザーです。","max_tokens":100}')
  print_result "$text_basic" "テキスト生成成功" "テキスト生成失敗"

  # テキスト生成（高度モデル）
  print_step "高度テキストモデルでテキスト生成しています..."
  text_advanced=$(do_api_request "POST" "/api/models/text-advanced/completions" "$advanced_token" \
    '{"prompt":"高度なモデルを使ってテキスト生成します。","max_tokens":200}')
  print_result "$text_advanced" "高度テキスト生成成功" "高度テキスト生成失敗"

  # 管理者機能テスト（アクセス拒否期待）
  print_step "管理者機能: ユーザー一覧取得を試みています（アクセス拒否期待）..."
  admin_users=$(do_api_request "GET" "/api/admin/users" "$advanced_token")
  if [[ $admin_users == *"success\":false"* ]]; then
    print_success "期待通りアクセスが拒否されました"
  else
    print_error "期待に反してアクセスが許可されました: $admin_users"
  fi
fi

# ケース4: 認証なしテスト
print_title "4. 認証なしテスト"

print_step "認証なしでモデル一覧を取得しようとしています（アクセス拒否期待）..."
no_auth_models=$(curl -s -X GET "${API_BASE_URL}/api/models" \
  -H "Content-Type: application/json")

if [[ $no_auth_models == *"success\":false"* ]]; then
  print_success "期待通りアクセスが拒否されました"
else
  print_error "期待に反してアクセスが許可されました: $no_auth_models"
fi

print_title "テスト完了"
echo "全テストシナリオが完了しました。"
