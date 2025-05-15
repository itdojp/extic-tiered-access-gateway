/**
 * 認証ミドルウェア
 * JWTトークン検証と権限チェックを行う
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../../config');
const logger = require('../utils/logger');

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
      const user = await User.findOne({ id: decoded.id });
      
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
 * 管理者権限チェックミドルウェア
 * システムロールが 'admin' のユーザーのみアクセスを許可
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.systemRole === 'admin') {
    next();
  } else {
    logger.warn(`管理者権限のないユーザーによる管理機能へのアクセス試行: ${req.user.userName}`);
    return res.status(403).json({
      success: false,
      error: 'ACCESS_001',
      message: '管理者権限が必要です'
    });
  }
};

/**
 * アクセスレベルチェックミドルウェア
 * 指定されたアクセスレベル以上を持つユーザーのみアクセスを許可
 */
const hasAccessLevel = (level) => {
  return (req, res, next) => {
    const levelMap = {
      "basic": 1,
      "advanced": 2,
      "admin": 3
    };
    
    const userLevel = req.user.accessTier;
    
    if (levelMap[userLevel] >= levelMap[level]) {
      next();
    } else {
      logger.warn(`不十分な権限レベルによるアクセス試行: ユーザー=${req.user.userName}, 現在=${userLevel}, 必要=${level}`);
      return res.status(403).json({
        success: false,
        error: 'ACCESS_001',
        message: `${level}レベル以上の権限が必要です`
      });
    }
  };
};

module.exports = {
  authenticate,
  isAdmin,
  hasAccessLevel
};
