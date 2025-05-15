/**
 * データベースモックアダプタ
 * データベース接続の代わりにモックデータを使用するためのアダプタ
 */

const logger = require('./logger');
const mockData = require('./mockData');

/**
 * MongoDBの代わりにモックデータを操作するユーティリティ
 */
const dbMock = {
  // データベース接続のモック
  connectDB: async () => {
    logger.info('モックデータベースに接続しました');
    return {
      connection: {
        host: 'mock-database'
      }
    };
  },
  
  // データベース接続終了のモック
  closeDB: async () => {
    logger.info('モックデータベース接続を終了しました');
    return true;
  },
  
  // モックデータを取得するユーティリティ関数
  getMockData: () => mockData
};

module.exports = dbMock;
