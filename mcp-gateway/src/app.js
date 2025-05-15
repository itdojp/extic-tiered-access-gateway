/**
 * アプリケーションメインファイル
 * Expressサーバーの設定と起動を行う
 */

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const config = require('../config');
const logger = require('./utils/logger');

// データベース接続選択（環境に応じてモックかMongoDBを使い分け）
const db = config.server.env === 'development' && process.env.USE_MOCK_DB === 'true'
  ? require('./utils/dbMock')
  : require('./utils/db');

// ルーターのインポート
const scimRouter = require('./scim/scimRouter');
const authRouter = require('./auth/authRouter');
const apiRouter = require('./api/apiRouter');

// Expressアプリケーションの初期化
const app = express();

// ミドルウェアの設定
app.use(helmet()); // セキュリティヘッダー
app.use(cors()); // CORS設定
app.use(bodyParser.json({ limit: '10mb' })); // JSONボディ解析
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // HTTPログ

// ルートパスの設定
app.get('/', (req, res) => {
  res.json({
    message: 'MCPゲートウェイAPI',
    version: '1.0.0',
    documentation: '/docs'
  });
});

// APIドキュメントへのパス
app.use('/docs', express.static(path.join(__dirname, '../public/docs')));

// APIルートの設定
app.use(config.scim.path, scimRouter); // SCIMエンドポイント
app.use('/api/auth', authRouter); // 認証エンドポイント
app.use('/api', apiRouter); // APIエンドポイント

// 404ハンドラー
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `リクエストされたパス ${req.originalUrl} が見つかりません`
  });
});

// エラーハンドラー
app.use((err, req, res, next) => {
  logger.error(`エラー: ${err.message}`);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.code || 'SERVER_001',
    message: config.server.env === 'production' 
      ? 'サーバーエラーが発生しました' 
      : err.message
  });
});

// サーバー起動
const startServer = async () => {
  try {
    // データベース接続
    await db.connectDB();
    
    // logsディレクトリの作成（存在しない場合）
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // サーバー起動
    const PORT = config.server.port;
    app.listen(PORT, () => {
      logger.info(`サーバーが起動しました: http://${config.server.host}:${PORT}`);
      logger.info(`環境: ${config.server.env}`);
      logger.info(`SCIMエンドポイント: ${config.scim.path}`);
    });
    
  } catch (error) {
    logger.error(`サーバー起動エラー: ${error.message}`);
    process.exit(1);
  }
};

// 未処理の例外ハンドリング
process.on('uncaughtException', (err) => {
  logger.error(`未処理の例外: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未処理のPromise拒否:');
  logger.error(`Promise: ${promise}`);
  logger.error(`理由: ${reason}`);
  process.exit(1);
});

// プロセス終了時の処理
process.on('SIGTERM', async () => {
  logger.info('SIGTERMシグナルを受信しました。サーバーを正常終了します');
  await db.closeDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINTシグナルを受信しました。サーバーを正常終了します');
  await db.closeDB();
  process.exit(0);
});

// サーバー起動実行
startServer();
