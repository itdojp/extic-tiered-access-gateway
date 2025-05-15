/**
 * 管理コントローラ
 * 管理機能を提供する
 */

const User = require('../models/User');
const Model = require('../models/Model');
const AccessLog = require('../models/AccessLog');
const logger = require('../utils/logger');

/**
 * ユーザー一覧を取得
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, filter } = req.query;
    
    // クエリの構築
    const query = {};
    if (filter) {
      query.$or = [
        { userName: { $regex: filter, $options: 'i' } },
        { displayName: { $regex: filter, $options: 'i' } },
        { email: { $regex: filter, $options: 'i' } }
      ];
    }
    
    // ページネーション
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // ユーザーの取得
    const users = await User.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    // 合計カウントの取得
    const total = await User.countDocuments(query);
    
    // クライアント用に整形
    const formattedUsers = users.map(user => ({
      id: user.id,
      userName: user.userName,
      displayName: user.displayName,
      email: user.email,
      active: user.active,
      systemRole: user.systemRole,
      accessTier: user.accessTier,
      userGroups: user.userGroups,
      allowedModels: user.allowedModels,
      allowedFeatures: user.allowedFeatures,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: formattedUsers
    });
    
  } catch (error) {
    logger.error(`管理者ユーザー一覧取得エラー: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'SERVER_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

/**
 * アクセスログ一覧を取得
 * GET /api/admin/logs
 */
const getLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      userId, 
      modelId, 
      status,
      startDate,
      endDate,
      operation
    } = req.query;
    
    // クエリの構築
    const query = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (modelId) {
      query.modelId = modelId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (operation) {
      query.operation = operation;
    }
    
    // 日付範囲
    if (startDate || endDate) {
      query.requestTime = {};
      
      if (startDate) {
        query.requestTime.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.requestTime.$lte = new Date(endDate);
      }
    }
    
    // ページネーション
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // ログの取得
    const logs = await AccessLog.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ requestTime: -1 });
    
    // 合計カウントの取得
    const total = await AccessLog.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: logs
    });
    
  } catch (error) {
    logger.error(`管理者ログ一覧取得エラー: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'SERVER_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

/**
 * 利用統計を取得
 * GET /api/admin/stats
 */
const getStats = async (req, res) => {
  try {
    // ユーザー統計
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ active: true });
    const adminUsers = await User.countDocuments({ systemRole: 'admin' });
    
    // アクセスレベル別ユーザー数
    const basicUsers = await User.countDocuments({ accessTier: 'basic' });
    const advancedUsers = await User.countDocuments({ accessTier: 'advanced' });
    const adminTierUsers = await User.countDocuments({ accessTier: 'admin' });
    
    // モデル統計
    const totalModels = await Model.countDocuments();
    const activeModels = await Model.countDocuments({ active: true });
    
    // モデルタイプ別カウント
    const textModels = await Model.countDocuments({ type: 'text' });
    const imageModels = await Model.countDocuments({ type: 'image' });
    
    // ログ統計
    const totalLogs = await AccessLog.countDocuments();
    const successLogs = await AccessLog.countDocuments({ status: 'success' });
    const errorLogs = await AccessLog.countDocuments({ status: 'error' });
    
    // 直近30日間のアクティビティ
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentLogs = await AccessLog.countDocuments({
      requestTime: { $gte: thirtyDaysAgo }
    });
    
    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers,
          byAccessLevel: {
            basic: basicUsers,
            advanced: advancedUsers,
            admin: adminTierUsers
          }
        },
        models: {
          total: totalModels,
          active: activeModels,
          byType: {
            text: textModels,
            image: imageModels
          }
        },
        logs: {
          total: totalLogs,
          success: successLogs,
          error: errorLogs,
          last30Days: recentLogs
        }
      }
    });
    
  } catch (error) {
    logger.error(`管理者統計取得エラー: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'SERVER_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

/**
 * モデル一覧を取得（管理者用）
 * GET /api/admin/models
 */
const getModels = async (req, res) => {
  try {
    const { page = 1, limit = 10, filter } = req.query;
    
    // クエリの構築
    const query = {};
    if (filter) {
      query.$or = [
        { id: { $regex: filter, $options: 'i' } },
        { name: { $regex: filter, $options: 'i' } },
        { description: { $regex: filter, $options: 'i' } }
      ];
    }
    
    // ページネーション
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // モデルの取得
    const models = await Model.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    // 合計カウントの取得
    const total = await Model.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: models.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: models
    });
    
  } catch (error) {
    logger.error(`管理者モデル一覧取得エラー: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'SERVER_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

module.exports = {
  getUsers,
  getLogs,
  getStats,
  getModels
};
