/**
 * モック管理コントローラ
 * データベースの代わりにモックデータを使用するバージョン
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const dbMock = require('../utils/dbMock');

// モックデータを取得
const { users, models } = dbMock.getMockData();

// モックログエントリ
const mockLogs = [
  {
    id: uuidv4(),
    userId: users[0].id,
    userName: users[0].userName,
    modelId: models[0].id,
    operation: 'text_completion',
    requestTime: new Date(Date.now() - 3600000),
    responseTime: new Date(Date.now() - 3599800),
    ipAddress: '127.0.0.1',
    status: 'success',
    processingTime: 200,
    tokenUsage: {
      prompt_tokens: 20,
      completion_tokens: 30,
      total_tokens: 50
    }
  },
  {
    id: uuidv4(),
    userId: users[1].id,
    userName: users[1].userName,
    modelId: models[0].id,
    operation: 'text_completion',
    requestTime: new Date(Date.now() - 3000000),
    responseTime: new Date(Date.now() - 2999800),
    ipAddress: '127.0.0.1',
    status: 'error',
    processingTime: 200,
    errorMessage: 'モデルアクセス権限エラー'
  },
  {
    id: uuidv4(),
    userId: users[2].id,
    userName: users[2].userName,
    modelId: models[2].id,
    operation: 'image_generation',
    requestTime: new Date(Date.now() - 1800000),
    responseTime: new Date(Date.now() - 1799700),
    ipAddress: '127.0.0.1',
    status: 'success',
    processingTime: 300,
    tokenUsage: {
      prompt_tokens: 10,
      completion_tokens: 0,
      total_tokens: 10
    }
  }
];

// モック統計データ
const mockStats = {
  totalRequests: 128,
  successfulRequests: 120,
  failedRequests: 8,
  averageResponseTime: 250,
  totalTokensUsed: 12540,
  userStats: [
    { userId: users[0].id, userName: users[0].userName, requestCount: 50, tokenUsage: 5200 },
    { userId: users[1].id, userName: users[1].userName, requestCount: 30, tokenUsage: 3100 },
    { userId: users[2].id, userName: users[2].userName, requestCount: 48, tokenUsage: 4240 }
  ],
  modelStats: [
    { modelId: models[0].id, modelName: models[0].name, requestCount: 70, tokenUsage: 7000 },
    { modelId: models[1].id, modelName: models[1].name, requestCount: 40, tokenUsage: 4000 },
    { modelId: models[2].id, modelName: models[2].name, requestCount: 18, tokenUsage: 1540 }
  ]
};

/**
 * ユーザー一覧の取得
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    // ユーザー一覧を返す
    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(user => ({
        id: user.id,
        userName: user.userName,
        displayName: user.displayName,
        email: user.email,
        active: user.active,
        accessTier: user.accessTier,
        systemRole: user.systemRole,
        userGroups: user.userGroups,
        allowedModels: user.allowedModels,
        maxTokens: user.maxTokens,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    });
  } catch (error) {
    logger.error(`ユーザー一覧取得エラー: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'ADMIN_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

/**
 * アクセスログの取得
 * GET /api/admin/logs
 */
const getLogs = async (req, res) => {
  try {
    const { userId, modelId, status, startDate, endDate, limit = 50, page = 1 } = req.query;
    
    // フィルタリング（実際のモックデータでは簡易的に実装）
    let filteredLogs = [...mockLogs];
    
    // レスポンス
    res.status(200).json({
      success: true,
      count: filteredLogs.length,
      data: filteredLogs,
      pagination: {
        page,
        limit,
        total: filteredLogs.length,
        pages: Math.ceil(filteredLogs.length / limit)
      }
    });
  } catch (error) {
    logger.error(`ログ取得エラー: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'ADMIN_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

/**
 * 統計情報の取得
 * GET /api/admin/stats
 */
const getStats = async (req, res) => {
  try {
    // 期間パラメータ（実際のモックデータでは無視）
    const { startDate, endDate } = req.query;
    
    // 統計情報を返す
    res.status(200).json({
      success: true,
      data: mockStats
    });
  } catch (error) {
    logger.error(`統計情報取得エラー: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'ADMIN_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

/**
 * モデル一覧の取得（管理者用）
 * GET /api/admin/models
 */
const getModels = async (req, res) => {
  try {
    // モデル一覧を返す
    res.status(200).json({
      success: true,
      count: models.length,
      data: models
    });
  } catch (error) {
    logger.error(`モデル一覧取得エラー: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'ADMIN_001',
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
