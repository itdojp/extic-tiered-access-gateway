/**
 * ロガー設定
 * Winstonを使用したロギング機能を提供する
 */

const winston = require('winston');
const config = require('../../config');

// ログフォーマットの定義
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  config.logging.format === 'json'
    ? winston.format.json()
    : winston.format.printf(({ level, message, timestamp, ...meta }) => {
        return `${timestamp} ${level.toUpperCase()}: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta) : ''
        }`;
      })
);

// ロガーの設定
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    // コンソール出力
    new winston.transports.Console(),
    // ファイル出力
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ],
});

// NODE_ENV が 'development' の場合、コンソールにも出力
if (config.server.env === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
