/**
 * アプリケーション設定
 * 環境変数から設定値を読み込む
 */

require('dotenv').config();

module.exports = {
  // サーバー設定
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
  },

  // データベース設定
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mcp-gateway',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // JWT設定
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_for_development',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  // SCIM設定
  scim: {
    path: process.env.SCIM_PATH || '/scim/v2',
    authToken: process.env.SCIM_AUTH_TOKEN || 'default_secure_token_for_development',
  },

  // モックAI設定
  mockAi: {
    url: process.env.MOCK_AI_URL || 'http://localhost:3001',
  },

  // ログ設定
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // アクセス制御設定
  accessControl: {
    levels: {
      basic: 'basic',
      advanced: 'advanced',
      admin: 'admin',
    },
  },

  // モデル設定
  models: {
    text: {
      basic: 'text-basic-v1',
      advanced: 'text-advanced-v1',
    },
    image: {
      basic: 'image-basic-v1',
      advanced: 'image-advanced-v1',
    },
  },
};
