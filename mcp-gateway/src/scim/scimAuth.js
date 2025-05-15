/**
 * SCIM認証ミドルウェア
 * SCIMリクエストの認証を処理する
 */

const config = require('../../config');
const logger = require('../utils/logger');
const { createScimError } = require('./scimUtils');

/**
 * SCIMリクエストの認証を検証するミドルウェア
 */
const scimAuth = (req, res, next) => {
  try {
    // 設定から認証情報を取得
    const { type, token } = config.scim.auth;
    
    // Authorization ヘッダーを取得
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('SCIMリクエスト認証失敗: Authorization ヘッダーがありません');
      return res.status(401).json(
        createScimError(401, 'Authorization ヘッダーが必要です', 'unauthorized')
      );
    }
    
    // Bearer トークン認証の場合
    if (type.toLowerCase() === 'bearer') {
      // Bearer トークンを抽出
      const bearerToken = authHeader.split(' ')[1];
      
      if (!bearerToken) {
        logger.warn('SCIMリクエスト認証失敗: Bearer トークンがありません');
        return res.status(401).json(
          createScimError(401, 'Bearer トークンが必要です', 'unauthorized')
        );
      }
      
      // トークンを検証
      if (bearerToken !== token) {
        logger.warn('SCIMリクエスト認証失敗: 無効なトークン');
        return res.status(401).json(
          createScimError(401, '無効なトークン', 'unauthorized')
        );
      }
    } else {
      // 他の認証タイプは現在サポートされていない
      logger.warn(`SCIMリクエスト認証失敗: サポートされていない認証タイプ ${type}`);
      return res.status(401).json(
        createScimError(401, 'サポートされていない認証タイプ', 'unauthorized')
      );
    }
    
    // 認証成功
    logger.debug('SCIMリクエスト認証成功');
    next();
    
  } catch (error) {
    logger.error(`SCIMリクエスト認証エラー: ${error.message}`);
    return res.status(500).json(
      createScimError(500, '認証処理中にエラーが発生しました', 'serverError')
    );
  }
};

module.exports = scimAuth;
