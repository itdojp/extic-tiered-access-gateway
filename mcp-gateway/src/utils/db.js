/**
 * データベース接続モジュール
 * MongoDBへの接続を管理する
 */

const mongoose = require('mongoose');
const config = require('../../config');
const logger = require('../utils/logger');

// MongoDB接続オプション
const connectOptions = config.database.options;

/**
 * データベースに接続する関数
 */
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(config.database.uri, connectOptions);
    logger.info(`MongoDB接続成功: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    logger.error(`MongoDB接続エラー: ${error.message}`);
    process.exit(1);
  }
};

/**
 * データベース接続を閉じる関数
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB接続を閉じました');
  } catch (error) {
    logger.error(`MongoDB切断エラー: ${error.message}`);
    process.exit(1);
  }
};

// 接続イベントのハンドリング
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDBから切断されました');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB接続エラー: ${err.message}`);
});

// エクスポート
module.exports = {
  connectDB,
  closeDB,
  connection: mongoose.connection
};
