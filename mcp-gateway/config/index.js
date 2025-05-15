/**
 * 設定ファイル
 * 環境変数から設定を読み込み、アプリケーション全体で利用する
 */

const dotenv = require('dotenv');
const path = require('path');

// .envファイルを読み込む
dotenv.config();

// 設定オブジェクト
const config = {
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
    }
  },
  
  // JWT認証設定
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  
  // SCIM設定
  scim: {
    path: process.env.SCIM_PATH || '/scim/v2',
    auth: {
      type: 'bearer',
      token: process.env.SCIM_AUTH_TOKEN || 'your_secure_token',
    }
  },
  
  // ログ設定
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  
  // モックAIモデル設定
  mockAi: {
    url: process.env.MOCK_AI_URL || 'http://localhost:3001',
  }
};

module.exports = config;
