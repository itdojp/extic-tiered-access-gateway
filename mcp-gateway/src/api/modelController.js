/**
 * モデルコントローラ
 * AIモデルへのアクセスを処理する
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const Model = require('../models/Model');
const User = require('../models/User');
const AccessLog = require('../models/AccessLog');
const config = require('../../config');
const logger = require('../utils/logger');

/**
 * 利用可能なモデル一覧を取得
 * GET /api/models
 */
const getModels = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;
    
    // ユーザーの取得
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'MODEL_003',
        message: 'ユーザーが見つかりません'
      });
    }
    
    // クエリフィルターの設定
    const filter = { active: true };
    if (type) {
      filter.type = type;
    }
    
    // モデル一覧の取得
    const allModels = await Model.find(filter);
    
    // ユーザーのアクセスレベルでフィルタリング
    const accessibleModels = allModels
      .filter(model => {
        // 管理者は全モデルアクセス可能
        if (user.accessTier === 'admin') {
          return true;
        }
        
        // 特定のモデルが許可リストに含まれているか
        if (user.allowedModels.includes(model.id)) {
          return true;
        }
        
        // アクセスレベルに基づく評価
        return model.isAccessibleByLevel(user.accessTier);
      })
      .map(model => ({
        id: model.id,
        name: model.name,
        description: model.description,
        type: model.type,
        parameters: model.parameters
      }));
    
    res.status(200).json({
      success: true,
      count: accessibleModels.length,
      data: accessibleModels
    });
    
  } catch (error) {
    logger.error(`モデル一覧取得エラー: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'SERVER_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

/**
 * テキスト生成モデルへのアクセス
 * POST /api/models/:modelId/completions
 */
const textCompletion = async (req, res) => {
  const startTime = Date.now();
  let logEntry = {
    id: uuidv4(),
    userId: req.user.id,
    userName: req.user.userName,
    modelId: req.params.modelId,
    operation: 'text_completion',
    requestTime: new Date(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    requestParams: req.body,
    status: 'error'
  };
  
  try {
    const { modelId } = req.params;
    const userId = req.user.id;
    
    // モデルの存在確認
    const model = await Model.findOne({ id: modelId, active: true });
    
    if (!model) {
      logEntry.errorMessage = 'モデルが存在しません';
      await AccessLog.create(logEntry);
      
      return res.status(404).json({
        success: false,
        error: 'MODEL_001',
        message: 'モデルが存在しません'
      });
    }
    
    // ユーザーの取得
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      logEntry.errorMessage = 'ユーザーが見つかりません';
      await AccessLog.create(logEntry);
      
      return res.status(404).json({
        success: false,
        error: 'MODEL_003',
        message: 'ユーザーが見つかりません'
      });
    }
    
    // アクセス権限の検証
    if (!user.canAccessModel(modelId) && !model.isAccessibleByLevel(user.accessTier)) {
      logEntry.errorMessage = 'このモデルへのアクセス権限がありません';
      await AccessLog.create(logEntry);
      
      return res.status(403).json({
        success: false,
        error: 'ACCESS_001',
        message: 'このモデルへのアクセス権限がありません'
      });
    }
    
    // ユーザーの制限を取得
    const limits = user.getLimits();
    
    // トークン数の制限チェック
    if (req.body.max_tokens && req.body.max_tokens > limits.maxTokens) {
      logEntry.errorMessage = `トークン数が制限を超えています (最大: ${limits.maxTokens})`;
      await AccessLog.create(logEntry);
      
      return res.status(400).json({
        success: false,
        error: 'MODEL_002',
        message: `トークン数が制限を超えています (最大: ${limits.maxTokens})`
      });
    }
    
    // モックAIモデルへのリクエスト
    const mockAiUrl = `${config.mockAi.url}/v1/completions`;
    const mockAiRequest = {
      model: modelId,
      ...req.body,
      max_tokens: Math.min(req.body.max_tokens || 1000, limits.maxTokens),
      user: userId
    };
    
    logger.debug(`モックAIへのリクエスト: ${mockAiUrl}`);
      // モックAIサーバーへのリクエストを実行
    logger.debug(`モックAIへのリクエスト: ${mockAiUrl}, データ: ${JSON.stringify(mockAiRequest)}`);
    
    const mockResponse = await axios.post(mockAiUrl, mockAiRequest);
    const completion = mockResponse.data;
    
    // 処理時間の計算
    const responseTime = Date.now() - startTime;
      // ログエントリの更新と保存
    logEntry.status = 'success';
    logEntry.responseTime = responseTime;
    logEntry.tokenCount = completion.usage ? completion.usage.total_tokens : 0;
    logEntry.responseData = {
      id: completion.id,
      model: completion.model,
      usage: completion.usage
    };
    
    await AccessLog.create(logEntry);
    
    // 成功レスポンスの返却
    res.status(200).json(completion);
    
  } catch (error) {
    logger.error(`テキスト生成エラー: ${error.message}`);
    
    // エラーログの保存
    logEntry.errorMessage = error.message;
    logEntry.responseTime = Date.now() - startTime;
    await AccessLog.create(logEntry);
    
    res.status(500).json({
      success: false,
      error: 'SERVER_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

/**
 * 画像生成モデルへのアクセス
 * POST /api/models/:modelId/images
 */
const imageGeneration = async (req, res) => {
  const startTime = Date.now();
  let logEntry = {
    id: uuidv4(),
    userId: req.user.id,
    userName: req.user.userName,
    modelId: req.params.modelId,
    operation: 'image_generation',
    requestTime: new Date(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    requestParams: req.body,
    status: 'error'
  };
  
  try {
    const { modelId } = req.params;
    const userId = req.user.id;
    
    // モデルの存在確認
    const model = await Model.findOne({ id: modelId, active: true, type: 'image' });
    
    if (!model) {
      logEntry.errorMessage = 'モデルが存在しないか、画像生成モデルではありません';
      await AccessLog.create(logEntry);
      
      return res.status(404).json({
        success: false,
        error: 'MODEL_001',
        message: 'モデルが存在しないか、画像生成モデルではありません'
      });
    }
    
    // ユーザーの取得
    const user = await User.findOne({ id: userId });
    
    if (!user) {
      logEntry.errorMessage = 'ユーザーが見つかりません';
      await AccessLog.create(logEntry);
      
      return res.status(404).json({
        success: false,
        error: 'MODEL_003',
        message: 'ユーザーが見つかりません'
      });
    }
    
    // アクセス権限の検証
    if (!user.canAccessModel(modelId) && !model.isAccessibleByLevel(user.accessTier)) {
      logEntry.errorMessage = 'このモデルへのアクセス権限がありません';
      await AccessLog.create(logEntry);
      
      return res.status(403).json({
        success: false,
        error: 'ACCESS_001',
        message: 'このモデルへのアクセス権限がありません'
      });
    }
      // モックAIモデルへのリクエスト
    const mockAiUrl = `${config.mockAi.url}/v1/images/generations`;
    const mockAiRequest = {
      model: modelId,
      ...req.body,
      user: userId
    };
    
    logger.debug(`モックAIへのリクエスト: ${mockAiUrl}, データ: ${JSON.stringify(mockAiRequest)}`);
    
    // モックAIサーバーへのリクエストを実行
    const mockResponse = await axios.post(mockAiUrl, mockAiRequest);
    const imageResult = mockResponse.data;
    
    // 処理時間の計算
    const responseTime = Date.now() - startTime;
      // ログエントリの更新と保存
    logEntry.status = 'success';
    logEntry.responseTime = responseTime;
    logEntry.tokenCount = imageResult.usage ? imageResult.usage.total_tokens : 0;
    logEntry.responseData = {
      created: imageResult.created,
      data_count: imageResult.data.length
    };
    
    await AccessLog.create(logEntry);
    
    // 成功レスポンスの返却
    res.status(200).json(imageResult);
    
  } catch (error) {
    logger.error(`画像生成エラー: ${error.message}`);
    
    // エラーログの保存
    logEntry.errorMessage = error.message;
    logEntry.responseTime = Date.now() - startTime;
    await AccessLog.create(logEntry);
    
    res.status(500).json({
      success: false,
      error: 'SERVER_001',
      message: 'サーバーエラーが発生しました'
    });
  }
};

module.exports = {
  getModels,
  textCompletion,
  imageGeneration
};
