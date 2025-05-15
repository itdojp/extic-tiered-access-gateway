@echo off
REM 統合テスト用バッチスクリプト

REM 必要なディレクトリに移動
cd /d "%~dp0"

echo ===== 統合テストスクリプト開始 =====

REM モックAIサーバーの起動（新しいウィンドウで実行）
echo モックAIサーバーを起動しています...
cd ..\mock-ai-server
start "Mock AI Server" cmd /c "node server.js > ..\mcp-gateway\logs\mock-ai-server.log 2>&1"
timeout /t 2 > nul

REM メインゲートウェイを起動（新しいウィンドウで実行）
echo メインゲートウェイを起動しています...
cd ..\mcp-gateway
start "MCP Gateway" cmd /c "node src\app.js > logs\mcp-gateway.log 2>&1"
timeout /t 2 > nul

REM モックAIサーバーのテスト
echo.
echo ===== モックAIサーバーテスト =====
echo テキスト生成APIをテストしています...
curl -s -X POST "http://localhost:3003/v1/completions" -H "Content-Type: application/json" -d "{\"model\":\"text-basic-v1\",\"prompt\":\"テスト\"}"

echo.
echo 画像生成APIをテストしています...
curl -s -X POST "http://localhost:3003/v1/images/generations" -H "Content-Type: application/json" -d "{\"model\":\"image-basic-v1\",\"prompt\":\"テスト画像\",\"n\":1,\"size\":\"512x512\"}"

REM メインゲートウェイのテスト
echo.
echo ===== メインゲートウェイテスト =====
echo ルートエンドポイントをテストしています...
curl -s "http://localhost:3000/"

echo.
echo 認証APIをテストしています...
curl -s -X POST "http://localhost:3000/api/auth/login" -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}" > login_response.json

REM JWTトークンを抽出（要node.js）
echo.
echo JWTトークンを抽出しています...
for /f "tokens=*" %%i in ('node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync('login_response.json'));console.log(data.token||'')"') do set TOKEN=%%i

if not "%TOKEN%"=="" (
  echo 認証成功: トークンを取得しました
  
  echo.
  echo ユーザー情報APIをテストしています...
  curl -s "http://localhost:3000/api/auth/me" -H "Authorization: Bearer %TOKEN%"
  
  echo.
  echo モデル一覧APIをテストしています...
  curl -s "http://localhost:3000/api/models" -H "Authorization: Bearer %TOKEN%"
  
  echo.
  echo テキスト生成APIをテストしています...
  curl -s -X POST "http://localhost:3000/api/models/text-basic/completions" -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"prompt\":\"テスト\",\"max_tokens\":100}"
    
  echo.
  echo 画像生成APIをテストしています...
  curl -s -X POST "http://localhost:3000/api/models/image-basic/generations" -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"prompt\":\"テスト画像\",\"n\":1,\"size\":\"512x512\"}"
) else (
  echo 認証に失敗しました
)

REM 一時ファイルの削除
del login_response.json

echo.
echo ===== テスト終了 =====
echo プロセスは手動で終了してください（コマンドプロンプトウィンドウを閉じる）

echo テスト完了
