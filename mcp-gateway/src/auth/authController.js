/**
 * 認証コントローラ
 * ユーザー認証とAPIキー管理を処理する
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const config = require('../../config');
const logger = require('../utils/logger');

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
    
    // ユーザーの検索（passwordフィールドを含める）
    const user = await User.findOne({ userName: username }).select('+password');
    
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
    
    // パスワード検証
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'AUTH_001',
        message: '認証に失敗しました'
      });
    }
    
    // JWTトークンの生成
    const token = user.getSignedJwtToken();
    
    // ユーザー情報をクライアント用に整形
    const userData = {
      id: user.id,
      userName: user.userName,
      displayName: user.displayName,
      email: user.email,
      systemRole: user.systemRole,
      accessTier: user.accessTier,
      allowedModels: user.allowedModels,
      allowedFeatures: user.allowedFeatures
    };
    
    logger.info(`ユーザーログイン成功: ${user.userName}`);
    
    res.status(200).json({
      success: true,
      token,
      user: userData
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
 * APIキーの発行
 * POST /api/auth/apikey
 */
const generateApiKey = async (req, res) => {
  try {
    // ユーザーIDとキーの説明
    const userId = req.user.id;
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'AUTH_004',
        message: 'APIキーの説明が必要です'
      });
    }
    
    // ユーザーの取得
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'AUTH_005',
        message: 'ユーザーが見つかりません'
      });
    }
    
    // APIキーの生成
    const apiKey = uuidv4();
    
    // TODO: ここで実際にはAPIキーをデータベースに保存し、
    // 後で認証に使用できるようにします。
    // 現段階ではAPIキー認証は実装の一部ですが、
    // 完全な実装は将来のフェーズで行います。
    
    logger.info(`APIキー生成成功: ユーザー=${user.userName}`);
    
    res.status(201).json({
      success: true,
      apiKey,
      description,
      created: new Date()
    });
    
  } catch (error) {
    logger.error(`APIキー生成エラー: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'SERVER_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

/**
 * 現在のユーザーの取得
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // ユーザーの取得
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'AUTH_005',
        message: 'ユーザーが見つかりません'
      });
    }
    
    // ユーザー情報をクライアント用に整形
    const userData = {
      id: user.id,
      userName: user.userName,
      displayName: user.displayName,
      email: user.email,
      systemRole: user.systemRole,
      accessTier: user.accessTier,
      allowedModels: user.allowedModels,
      allowedFeatures: user.allowedFeatures
    };
    
    res.status(200).json({
      success: true,
      user: userData
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
  generateApiKey,
  getCurrentUser
};
