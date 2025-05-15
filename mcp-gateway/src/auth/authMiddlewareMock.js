/**
 * モック認証ミドルウェア
 * データベースの代わりにモックデータを使用するバージョン
 */

const jwt = require('jsonwebtoken');
const config = require('../../config');
const logger = require('../utils/logger');
const dbMock = require('../utils/dbMock');

// モックデータを取得
const { users } = dbMock.getMockData();

/**
 * JWT認証ミドルウェア
 * Authorization: Bearer <token> ヘッダーを検証する
 */
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // ヘッダーからトークンを取得
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // トークンが存在しない場合はエラー
    if (!token) {
      logger.warn('認証トークンがありません');
      return res.status(401).json({
        success: false,
        error: 'AUTH_001',
        message: '認証トークンが必要です'
      });
    }
    
    try {
      // トークンを検証
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // 検証できたらユーザー情報をreqオブジェクトに追加
      req.user = decoded;
      
      // ユーザーが実際に存在し、アクティブかチェック
      const user = users.find(u => u.id === decoded.id);
      
      if (!user) {
        logger.warn(`不明なユーザーID: ${decoded.id}`);
        return res.status(401).json({
          success: false,
          error: 'AUTH_001',
          message: '認証に失敗しました'
        });
      }
      
      if (!user.active) {
        logger.warn(`無効なユーザーでのアクセス試行: ${user.userName}`);
        return res.status(401).json({
          success: false,
          error: 'AUTH_003',
          message: 'アカウントが無効です'
        });
      }
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('トークンの期限切れ');
        return res.status(401).json({
          success: false,
          error: 'AUTH_002',
          message: 'トークンの期限が切れています'
        });
      }
      
      logger.warn(`無効なトークン: ${error.message}`);
      return res.status(401).json({
        success: false,
        error: 'AUTH_001',
        message: '認証に失敗しました'
      });
    }
  } catch (error) {
    logger.error(`認証エラー: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'SERVER_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

/**
 * 管理者権限が必要なエンドポイント用のミドルウェア
 */
const requireAdmin = async (req, res, next) => {
  const user = users.find(u => u.id === req.user.id);
  
  if (!user || user.accessTier !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'AUTH_005',
      message: 'このリソースにアクセスする権限がありません'
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  requireAdmin
};
