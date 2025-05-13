# 多段階アクセス制御モデルゲートウェイ PoC設計書

## 1. 概要

### 1.1 目的と背景

本PoCは、ExticのSCIM機能を活用してAIモデルアクセスに対する多段階アクセス制御を実装するゲートウェイシステムの検証を目的としています。組織内でAIモデルの利用が拡大する中、ユーザーの役割やグループに応じた適切なアクセス制御が必要とされています。Exticの強力なIDM機能とSCIMプロトコルを活用することで、きめ細かいアクセス制御を実現するためのPoC開発を行います。

### 1.2 スコープと目標

**スコープ**:
- ExticとSCIMプロトコルを使用したユーザー情報の同期
- 3段階の権限レベル（基本/高度/管理者）によるアクセス制御
- モデルアクセスのプロキシゲートウェイの実装
- 簡易的な管理インターフェースの提供

**成功基準**:
1. Exticからのユーザーおよびグループ情報のリアルタイム同期
2. 権限レベルに応じたモデルアクセス制御の正確な実装
3. ユーザー属性変更による即時権限変更の実証
4. システムの拡張性と実用性の検証

### 1.3 想定するユーザーとペルソナ

1. **一般ユーザー (基本レベル)**
   - データアナリスト、営業担当者など
   - 基本的なAIモデルのみ使用可能

2. **研究者 (高度レベル)**
   - データサイエンティスト、研究開発者
   - 高度なモデルも使用可能

3. **管理者 (管理者レベル)**
   - システム管理者、プロジェクト管理者
   - すべてのモデルへのアクセスと管理機能の利用

## 2. システムアーキテクチャ

### 2.1 全体構成図

```
+-------------+      SCIM      +---------------+       +---------------+
|             |  プロトコル    |               |       |               |
|    Extic    |<-------------->| MCPゲートウェイ |<----->| モックAIモデル |
|             |                |               |       |               |
+-------------+                +---------------+       +---------------+
      ^                              ^
      |                              |
      v                              v
+-------------+                +---------------+
|             |                |               |
| 管理コンソール |                | アクセスログDB  |
|             |                |               |
+-------------+                +---------------+
```

### 2.2 コンポーネント説明

1. **Extic**
   - ID管理システム
   - ユーザー、グループ情報の管理
   - SCIMプロトコルでゲートウェイと連携

2. **MCPゲートウェイ**
   - SCIMサーバーとしてExticと連携
   - アクセス制御ロジックを実装
   - モデルAPIへのプロキシとして機能
   - アクセスログの記録

3. **モックAIモデル**
   - 実際のAIモデルをシミュレート
   - 権限レベルに応じた機能制限

4. **管理コンソール**
   - ユーザー/グループ管理
   - 権限設定
   - アクセスログ確認

5. **アクセスログDB**
   - 利用ログの保存
   - 監査証跡の提供

### 2.3 通信フロー

1. **ユーザープロビジョニング**
   ```
   Extic → SCIMプロトコル → MCPゲートウェイ → ユーザーDB
   ```

2. **モデルアクセス**
   ```
   クライアント → 認証 → MCPゲートウェイ → 権限チェック → モックAIモデル
   ```

3. **ログ記録**
   ```
   MCPゲートウェイ → アクセスログDB
   ```

## 3. 技術スタック

### 3.1 バックエンド

- **言語**: Node.js (Express)
- **データベース**: MongoDB
- **認証**: JWT、APIキー
- **SCIMサーバー実装**: scimify または自作SCIM実装
- **ログ処理**: Winston

### 3.2 フロントエンド

- **フレームワーク**: React
- **UIライブラリ**: Material UI
- **状態管理**: Redux
- **APIクライアント**: Axios

### 3.3 インフラ

- **コンテナ化**: Docker
- **構成管理**: Docker Compose
- **CI/CD**: GitHub Actions (オプション)

## 4. Extic SCIM連携設計

### 4.1 SCIMスキーマ設計

**コアスキーマ**: `urn:ietf:params:scim:schemas:core:2.0:User`
- id
- userName
- displayName
- active

**拡張スキーマ**: `urn:extic:scim:schemas:1.0:User`
- role
- exticGroups
- extendAttrs
  - name: "accessLevel"
  - value: "basic" | "advanced" | "admin"
  
**AIモデルアクセススキーマ**: `custom:ai:access`
- allowedModels: 配列（アクセス可能モデルリスト）
- maxTokens: 数値（最大トークン制限）
- allowedFeatures: 配列（利用可能機能）

### 4.2 属性マッピング

| Extic属性 | MCPゲートウェイ属性 | 説明 |
|----------|-------------------|------|
| exticGroups | userGroups | グループに基づくアクセス権限のマッピング |
| role | systemRole | システムロール（ユーザー/管理者） |
| extendAttrs.accessLevel | accessTier | アクセスレベル（基本/高度/管理者） |
| userName | userId | ユーザー識別子 |
| active | isActive | アカウントステータス |

### 4.3 グループ権限マッピング

| グループ名 | アクセスレベル | 許可モデル | 追加機能 |
|-----------|--------------|-----------|--------|
| 基本ユーザーグループ | basic | text-basic, image-basic | - |
| 研究グループ | advanced | text-basic, text-advanced, image-basic, image-advanced | Fine-tuning |
| 管理者グループ | admin | すべてのモデル | すべての機能 |

## 5. アクセス制御モデル

### 5.1 権限レベル定義

1. **基本レベル (Basic)**
   - 基本的なテキスト生成モデル
   - 基本的な画像生成モデル
   - トークン制限: 1000/リクエスト
   - レート制限: 10リクエスト/分

2. **高度レベル (Advanced)**
   - 高度なテキスト生成モデル
   - 高度な画像生成モデル
   - ファインチューニング機能
   - トークン制限: 4000/リクエスト
   - レート制限: 30リクエスト/分

3. **管理者レベル (Admin)**
   - すべてのモデルアクセス
   - 管理機能（使用状況監視、ユーザー管理）
   - モデル設定変更
   - トークン制限: 10000/リクエスト
   - レート制限: 100リクエスト/分

### 5.2 アクセス制御ロジック

```javascript
function evaluateAccess(user, requestedModel, requestedOperation) {
  // ユーザーの権限レベル取得
  const accessLevel = getUserAccessLevel(user);
  
  // モデルの必要権限レベル取得
  const requiredLevel = getModelRequiredLevel(requestedModel);
  
  // 操作の必要権限レベル取得
  const operationLevel = getOperationRequiredLevel(requestedOperation);
  
  // 権限レベルの数値マッピング
  const levelMap = {
    "basic": 1,
    "advanced": 2,
    "admin": 3
  };
  
  // アクセス判定
  if (levelMap[accessLevel] >= levelMap[requiredLevel] && 
      levelMap[accessLevel] >= levelMap[operationLevel]) {
    return true;
  }
  
  return false;
}
```

### 5.3 トークン・レート制限

```javascript
function applyLimits(user) {
  const accessLevel = getUserAccessLevel(user);
  
  const limits = {
    "basic": {
      maxTokens: 1000,
      rateLimit: 10
    },
    "advanced": {
      maxTokens: 4000,
      rateLimit: 30
    },
    "admin": {
      maxTokens: 10000,
      rateLimit: 100
    }
  };
  
  return limits[accessLevel] || limits["basic"];
}
```

## 6. API設計

### 6.1 ゲートウェイAPIエンドポイント

#### 6.1.1 認証API

- **POST /api/auth/login**
  - ユーザー認証とJWTトークン発行
  - リクエスト: `{ username, password }`
  - レスポンス: `{ token, user }`

- **POST /api/auth/apikey**
  - APIキー発行
  - リクエスト: `{ description }`
  - レスポンス: `{ apiKey }`

#### 6.1.2 モデルアクセスAPI

- **POST /api/models/:modelId/completions**
  - テキスト生成モデルへのアクセス
  - パス: modelId - モデルID
  - リクエスト: モデル固有パラメータ
  - レスポンス: モデル結果

- **POST /api/models/:modelId/images**
  - 画像生成モデルへのアクセス
  - パス: modelId - モデルID
  - リクエスト: モデル固有パラメータ
  - レスポンス: 画像データ

- **GET /api/models**
  - アクセス可能なモデル一覧
  - クエリ: type - モデルタイプ
  - レスポンス: モデルリスト

#### 6.1.3 管理API

- **GET /api/admin/users**
  - ユーザー一覧取得 (管理者専用)
  - クエリ: page, limit, filter
  - レスポンス: ユーザーリスト

- **GET /api/admin/logs**
  - アクセスログ取得 (管理者専用)
  - クエリ: page, limit, filter
  - レスポンス: ログリスト

### 6.2 SCIM APIエンドポイント

- **POST /scim/v2/Users**
  - ユーザー作成
  - リクエスト: SCIMユーザー情報
  - レスポンス: 作成されたユーザー

- **GET /scim/v2/Users/:id**
  - ユーザー取得
  - パス: id - ユーザーID
  - レスポンス: SCIMユーザー情報

- **PUT /scim/v2/Users/:id**
  - ユーザー更新
  - パス: id - ユーザーID
  - リクエスト: SCIMユーザー情報
  - レスポンス: 更新されたユーザー

- **DELETE /scim/v2/Users/:id**
  - ユーザー削除
  - パス: id - ユーザーID
  - レスポンス: 204 No Content

- **GET /scim/v2/Users**
  - ユーザー検索
  - クエリ: filter, startIndex, count
  - レスポンス: ユーザーリスト

## 7. データモデル

### 7.1 ユーザーモデル

```javascript
{
  id: String,                // UUIDなど一意識別子
  userName: String,          // ユーザー名
  displayName: String,       // 表示名
  active: Boolean,           // アカウント有効状態
  email: String,             // メールアドレス
  systemRole: String,        // システムロール
  accessTier: String,        // アクセスレベル
  userGroups: [String],      // 所属グループ
  allowedModels: [String],   // アクセス可能モデル
  maxTokens: Number,         // トークン制限
  allowedFeatures: [String], // 利用可能機能
  createdAt: Date,           // 作成日時
  updatedAt: Date            // 更新日時
}
```

### 7.2 モデル定義

```javascript
{
  id: String,                // モデルID
  name: String,              // モデル名
  description: String,       // 説明
  type: String,              // モデルタイプ
  requiredLevel: String,     // 必要アクセスレベル
  apiEndpoint: String,       // 実際のAPIエンドポイント
  parameters: Object,        // パラメータ定義
  active: Boolean            // 有効状態
}
```

### 7.3 アクセスログ

```javascript
{
  id: String,                // ログID
  userId: String,            // ユーザーID
  userName: String,          // ユーザー名
  modelId: String,           // アクセスしたモデルID
  operation: String,         // 実行した操作
  requestTime: Date,         // リクエスト時間
  responseTime: Number,      // レスポンス時間(ms)
  tokenCount: Number,        // 使用トークン数
  status: String,            // 状態(成功/失敗)
  errorMessage: String,      // エラーメッセージ(存在する場合)
  ipAddress: String,         // IPアドレス
  userAgent: String          // ユーザーエージェント
}
```

## 8. 実装計画

### 8.1 フェーズ分け

#### フェーズ1: 基盤構築
- SCIM連携基盤実装
- 基本的なユーザーモデル実装
- 認証システム構築

#### フェーズ2: アクセス制御実装
- 権限レベル定義
- アクセス制御ロジック実装
- モックAIモデル実装

#### フェーズ3: 管理機能・UI実装
- 管理コンソール実装
- ログ機能実装
- UIの洗練

#### フェーズ4: テスト・検証
- 各種テスト
- パフォーマンス検証
- セキュリティレビュー

### 8.2 タイムライン

| フェーズ | 作業内容 | 期間 |
|---------|---------|------|
| フェーズ1 | 基盤構築 | 2週間 |
| フェーズ2 | アクセス制御実装 | 2週間 |
| フェーズ3 | 管理機能・UI実装 | 2週間 |
| フェーズ4 | テスト・検証 | 1週間 |

### 8.3 優先度付け

**最優先実装項目**:
1. SCIM連携基盤
2. 基本的なユーザーモデル
3. 認証システム
4. 権限レベル実装
5. モデルアクセスプロキシ

**二次優先実装項目**:
1. 管理コンソール
2. 詳細ログ機能
3. 高度な権限制御
4. パフォーマンス最適化

## 9. テスト計画

### 9.1 テスト戦略

- **単体テスト**: 個別コンポーネントの機能テスト
- **統合テスト**: SCIM連携とアクセス制御の連動テスト
- **システムテスト**: エンドツーエンドのシナリオテスト
- **負荷テスト**: 同時多数アクセス時の挙動検証

### 9.2 テストケース

#### SCIM連携テスト
1. ユーザー追加の同期検証
2. ユーザー更新の即時反映検証
3. グループ変更による権限変更検証
4. ユーザー無効化の即時反映検証

#### アクセス制御テスト
1. 基本レベルユーザーのアクセス権限検証
2. 高度レベルユーザーのアクセス権限検証
3. 管理者レベルユーザーのアクセス権限検証
4. 権限外リソースへのアクセス拒否検証

#### パフォーマンステスト
1. 複数同時リクエスト処理性能
2. レート制限の正確な適用
3. 大量ユーザー同期時の挙動

## 10. デモシナリオ

### 10.1 シナリオ1: 基本ユーザーアクセス

1. 基本ユーザーでログイン
2. アクセス可能なモデル一覧の確認
3. 基本テキストモデルへのアクセス実行
4. 基本画像モデルへのアクセス実行
5. 高度モデルへのアクセス試行（拒否される）

### 10.2 シナリオ2: 権限昇格

1. 管理者がExticで基本ユーザーのグループを研究グループに変更
2. SCIMによる即時同期
3. ユーザーの権限が高度レベルに昇格
4. 高度モデルへのアクセスが可能になることを確認

### 10.3 シナリオ3: 管理操作

1. 管理者ユーザーでログイン
2. ユーザー一覧と使用状況の確認
3. モデルアクセス設定の変更
4. アクセスログの確認と分析

### 10.4 シナリオ4: 緊急アクセス制限

1. 管理者がExticでユーザーを無効化
2. SCIMによる即時同期
3. ユーザーのアクセスが即時拒否されることを確認

## 11. 拡張性と将来計画

### 11.1 拡張可能な領域

- **リソース割当管理**: ユーザー/グループごとのクォータ管理
- **コンテキスト対応セキュリティ**: 状況に応じた動的アクセス制御
- **高度な監査機能**: 詳細な利用分析とレポート
- **複合認証要素**: リスクに応じた多要素認証

### 11.2 将来の発展方向

- **機械学習による異常検知**: 不審なアクセスパターンの自動検出
- **自動権限提案**: 利用パターンに基づく最適権限の提案
- **マルチテナント対応**: 複数組織のサポート
- **高度なポリシーエンジン**: カスタムルールに基づく柔軟なアクセス制御

## 付録

### A. 設定パラメータ

```json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "database": {
    "uri": "mongodb://localhost:27017/mcp-gateway",
    "options": {
      "useNewUrlParser": true,
      "useUnifiedTopology": true
    }
  },
  "scim": {
    "path": "/scim/v2",
    "auth": {
      "type": "bearer",
      "token": "your-secure-token"
    }
  },
  "jwt": {
    "secret": "your-jwt-secret",
    "expiresIn": "1h"
  },
  "logging": {
    "level": "info",
    "format": "json"
  }
}
```

### B. APIサンプルリクエスト/レスポンス

#### ユーザー認証

**リクエスト**:
```json
POST /api/auth/login
{
  "username": "researcher1",
  "password": "securepass"
}
```

**レスポンス**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "12345",
    "userName": "researcher1",
    "displayName": "研究者1",
    "accessTier": "advanced",
    "userGroups": ["研究グループ"]
  }
}
```

#### モデルアクセス

**リクエスト**:
```json
POST /api/models/text-advanced/completions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
{
  "prompt": "AIの倫理的な課題について説明してください",
  "max_tokens": 1000,
  "temperature": 0.7
}
```

**レスポンス**:
```json
{
  "id": "cmpl-123456",
  "object": "text_completion",
  "created": 1620000000,
  "model": "text-advanced",
  "choices": [
    {
      "text": "AIの倫理的な課題は多岐にわたります...",
      "index": 0,
      "finish_reason": "length"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 985,
    "total_tokens": 1000
  }
}
```

### C. エラーコード一覧

| エラーコード | 説明 | HTTP状態コード |
|------------|-----|--------------|
| AUTH_001 | 認証失敗 | 401 |
| AUTH_002 | トークン期限切れ | 401 |
| ACCESS_001 | アクセス権限不足 | 403 |
| ACCESS_002 | レート制限超過 | 429 |
| MODEL_001 | モデルが存在しない | 404 |
| MODEL_002 | モデルパラメータ不正 | 400 |
| SCIM_001 | SCIMリクエスト不正 | 400 |
| SCIM_002 | SCIMリソース未検出 | 404 |
| SERVER_001 | 内部サーバーエラー | 500 |
