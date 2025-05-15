# 多段階アクセス制御モデルゲートウェイのセットアップと実行方法

本ドキュメントでは、多段階アクセス制御モデルゲートウェイとモックAIサーバーのセットアップと実行方法について説明します。

## 1. 前提条件

- Node.js v14以上
- npm v6以上

## 2. セットアップ手順

### モックAIサーバーのセットアップ

1. モックAIサーバーのディレクトリに移動します。
   ```bash
   cd /path/to/extic-tiered-access-gateway/mock-ai-server
   ```

2. 依存パッケージをインストールします。
   ```bash
   npm install
   ```

3. 環境変数を設定するための`.env`ファイルを確認します。既に設定されているはずですが、必要に応じて変更してください。
   ```
   # モックAIサーバー設定
   PORT=3003
   LOG_LEVEL=debug
   SIMULATE_DELAY=true
   MIN_DELAY_MS=100
   MAX_DELAY_MS=500
   ```

### メインゲートウェイのセットアップ

1. メインゲートウェイのディレクトリに移動します。
   ```bash
   cd /path/to/extic-tiered-access-gateway/mcp-gateway
   ```

2. 依存パッケージをインストールします。
   ```bash
   npm install
   ```

3. 環境変数を設定するための`.env`ファイルを確認します。モック開発環境向けの設定が既に行われているはずです。
   ```
   # サーバー設定
   PORT=3000
   HOST=localhost
   NODE_ENV=development
   USE_MOCK_DB=true

   # モックAIモデル設定
   MOCK_AI_URL=http://localhost:3003
   ```

## 3. アプリケーションの実行

### モックAIサーバーの起動

1. モックAIサーバーを起動します。
   ```bash
   cd /path/to/extic-tiered-access-gateway/mock-ai-server
   node server.js
   ```

2. 以下のようなメッセージが表示されれば、正常に起動しています。
   ```
   モックAIサーバーが起動しました: http://localhost:3003
   環境変数PORT=3003, 使用中のPORT=3003
   ```

### メインゲートウェイの起動

1. 別のターミナルウィンドウを開き、メインゲートウェイを起動します。
   ```bash
   cd /path/to/extic-tiered-access-gateway/mcp-gateway
   node src/app.js
   ```

2. 以下のようなメッセージが表示されれば、正常に起動しています。
   ```
   サーバーが起動しました: http://localhost:3000
   環境: development
   SCIMエンドポイント: /scim/v2
   ```

## 4. APIテスト

APIの動作を確認するためのテストスクリプトが用意されています。このスクリプトは、異なるユーザー権限でのAPIアクセスをテストします。

1. テストスクリプトを実行します。
   ```bash
   cd /path/to/extic-tiered-access-gateway/mcp-gateway/scripts
   bash api_test.sh
   ```

2. テスト結果が表示されます。正常な動作であれば、以下のようなテストケースが成功するはずです。
   - 管理者ユーザーのテスト
   - 基本ユーザーのテスト
   - 高度ユーザーのテスト
   - 認証なしのテスト

## 5. デフォルトユーザー

システムには以下のデフォルトユーザーが設定されています。

1. 管理者ユーザー
   - ユーザー名: `admin`
   - パスワード: `admin123`
   - アクセスレベル: `admin`
   - 全モデルへのアクセス権限があります

2. 基本ユーザー
   - ユーザー名: `basic_user`
   - パスワード: `basic123`
   - アクセスレベル: `basic`
   - 基本モデルのみにアクセスできます

3. 高度ユーザー
   - ユーザー名: `advanced_user`
   - パスワード: `advanced123`
   - アクセスレベル: `advanced`
   - 基本モデルと高度モデルにアクセスできます

## 6. トラブルシューティング

1. ポートが既に使用されている場合
   - `.env`ファイルで別のポートを指定してください。
   - モックAIサーバーのポートを変更した場合は、メインゲートウェイの`.env`ファイルの`MOCK_AI_URL`も更新してください。

2. モックAIサーバーに接続できない場合
   - モックAIサーバーが起動しているか確認してください。
   - ポート設定が正しいか確認してください。
   - メインゲートウェイの`.env`ファイルの`MOCK_AI_URL`が正しいか確認してください。

3. 認証エラーが発生する場合
   - 正しいユーザー名とパスワードを使用しているか確認してください。
   - JWTトークンの有効期限が切れていないか確認してください。

## 7. MongoDB接続（オプション）

実際のMongoDBを使用する場合は、以下の手順で設定を変更します。

1. `.env`ファイルの`USE_MOCK_DB`を`false`に変更します。
   ```
   USE_MOCK_DB=false
   ```

2. MongoDBの接続URIを設定します。
   ```
   MONGODB_URI=mongodb://localhost:27017/mcp-gateway
   ```

3. データベースの初期化スクリプトを実行します。
   ```bash
   npm run seed
   ```

これで、モックデータの代わりに実際のMongoDBを使用するようになります。

--- 

© 2025 多段階アクセス制御モデルゲートウェイ - PoC プロジェクト
