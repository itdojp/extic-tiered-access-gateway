/**
 * モック認証コントローラ
 * データベースの代わりにモックデータを使用するバージョン
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');
const logger = require('../utils/logger');
const dbMock = require('../utils/dbMock');

// モックデータを取得
const { users } = dbMock.getMockData();

/**
 * ユーザーログイン
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // バリデーション
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'AUTH_001',
        message: 'ユーザー名とパスワードが必要です'
      });
    }
    
    // ユーザーの検索
    const user = users.find(u => u.userName === username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_001',
        message: '認証に失敗しました'
      });
    }
    
    // アカウントが無効化されていないか確認
    if (!user.active) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_003',
        message: 'アカウントが無効です'
      });
    }
    
    // モックモードでは、特定のパスワードを常に通過させる
    const isMatch = password === `${username}123` || 
                    (user.userName === 'admin' && password === 'admin123') ||
                    (user.userName === 'basic_user' && password === 'basic123') ||
                    (user.userName === 'advanced_user' && password === 'advanced123');
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_001',
        message: '認証に失敗しました'
      });
    }
    
    // JWTトークンの作成
    const token = jwt.sign(
      { 
        id: user.id,
        userName: user.userName,
        accessTier: user.accessTier
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // レスポンス
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        userName: user.userName,
        displayName: user.displayName,
        email: user.email,
        accessTier: user.accessTier,
        systemRole: user.systemRole
      }
    });
    
  } catch (error) {
    logger.error(`ログインエラー: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'SERVER_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

/**
 * ユーザー情報取得
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'AUTH_004',
        message: 'ユーザーが見つかりません'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        userName: user.userName,
        displayName: user.displayName,
        email: user.email,
        accessTier: user.accessTier,
        systemRole: user.systemRole,
        userGroups: user.userGroups,
        maxTokens: user.maxTokens,
        allowedFeatures: user.allowedFeatures
      }
    });
    
  } catch (error) {
    logger.error(`ユーザー情報取得エラー: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'SERVER_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

module.exports = {
  login,
  getMe
};
