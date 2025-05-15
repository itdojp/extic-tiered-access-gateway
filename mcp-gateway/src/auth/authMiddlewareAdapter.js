/**
 * 認証ミドルウェアのアダプタ
 * 実際のMongoDBかモックデータを使用するかを判断する
 */

const config = require('../../config');
const mockMode = config.server.env === 'development' && process.env.USE_MOCK_DB === 'true';

// 実際のミドルウェアかモックミドルウェアを使用
module.exports = mockMode
  ? require('./authMiddlewareMock')
  : require('./authMiddleware');
