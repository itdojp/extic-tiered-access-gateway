/**
 * モックモデルコントローラ
 * データベースの代わりにモックデータを使用するバージョン
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const config = require('../../config');
const logger = require('../utils/logger');
const dbMock = require('../utils/dbMock');

// モックデータを取得
const { models, users, findUserByUsername, getModelsForAccessTier } = dbMock.getMockData();

/**
 * 利用可能なモデル一覧を取得
 * GET /api/models
 */
const getModels = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;
    
    // ユーザーの取得
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'MODEL_003',
        message: 'ユーザーが見つかりません'
      });
    }
    
    // モデル一覧の取得
    let accessibleModels = getModelsForAccessTier(user.accessTier);
    
    // タイプでフィルタリング
    if (type) {
      accessibleModels = accessibleModels.filter(model => model.type === type);
    }
    
    // レスポンス用にデータを整形
    const responseModels = accessibleModels.map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      type: model.type,
      parameters: model.parameters
    }));
    
    res.status(200).json({
      success: true,
      count: responseModels.length,
      data: responseModels
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
    const model = models.find(m => m.id === modelId && m.active);
    
    if (!model) {
      logEntry.errorMessage = 'モデルが存在しません';
      logger.warn(`モデル存在エラー: ${modelId}`);
      
      return res.status(404).json({
        success: false,
        error: 'MODEL_001',
        message: 'モデルが存在しません'
      });
    }
    
    // ユーザーの取得
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      logEntry.errorMessage = 'ユーザーが見つかりません';
      logger.warn(`ユーザー不明エラー: ${userId}`);
      
      return res.status(404).json({
        success: false,
        error: 'MODEL_003',
        message: 'ユーザーが見つかりません'
      });
    }
    
    // アクセス権限の検証
    const hasAccess = user.allowedModels.includes(modelId) || 
                      (model.requiredLevel === 'basic') || 
                      (user.accessTier === 'advanced' && model.requiredLevel === 'advanced') ||
                      (user.accessTier === 'admin');
    
    if (!hasAccess) {
      logEntry.errorMessage = 'このモデルへのアクセス権限がありません';
      logger.warn(`アクセス権限エラー: ユーザー ${user.userName} がモデル ${modelId} にアクセス試行`);
      
      return res.status(403).json({
        success: false,
        error: 'ACCESS_001',
        message: 'このモデルへのアクセス権限がありません'
      });
    }
    
    // ユーザーの制限を取得
    const maxTokens = user.maxTokens || 1000;
    
    // トークン数の制限チェック
    if (req.body.max_tokens && req.body.max_tokens > maxTokens) {
      logEntry.errorMessage = `トークン数が制限を超えています (最大: ${maxTokens})`;
      logger.warn(`トークン制限エラー: ${req.body.max_tokens} > ${maxTokens}`);
      
      return res.status(400).json({
        success: false,
        error: 'MODEL_002',
        message: `トークン数が制限を超えています (最大: ${maxTokens})`
      });
    }
    
    // モックサーバーへのリクエスト準備
    // モデルのパラメータから使用するモデルIDを取得
    const modelParams = model.parameters || {};
    const availableModels = modelParams.models || ['text-basic-v1'];
    const modelId = availableModels[0];
    
    // モックAIサーバーへのリクエスト
    try {
      const mockAiUrl = `${config.mockAi.url}/v1/completions`;
      const mockAiRequest = {
        model: modelId,
        ...req.body,
        max_tokens: Math.min(req.body.max_tokens || 1000, maxTokens),
        user: userId
      };
      
      logger.info(`モックAIへのリクエスト: ${mockAiUrl}, model=${modelId}`);
      
      // 実際のモックAPIサーバーへのリクエスト
      const mockResponse = await axios.post(mockAiUrl, mockAiRequest);
      const completion = mockResponse.data;
      
      // ログエントリの更新
      logEntry.status = 'success';
      logEntry.responseTime = new Date();
      logEntry.processingTime = Date.now() - startTime;
      logEntry.tokenUsage = completion.usage;
      
      logger.info(`テキスト生成完了: model=${modelId}, tokens=${completion.usage.total_tokens}`);
      
      // クライアントへのレスポンス
      res.status(200).json({
        success: true,
        data: completion
      });
      
    } catch (error) {
      logger.error(`モックAIリクエストエラー: ${error.message}`);
      
      // エラーの詳細をログに記録
      if (error.response) {
        logger.error(`APIエラーレスポンス: ${JSON.stringify(error.response.data)}`);
      }
      
      // フォールバック: ダミーレスポンスを返す
      const dummyResponse = {
        id: `mock-completion-${uuidv4()}`,
        object: "completion",
        created: Math.floor(Date.now() / 1000),
        model: modelId,
        choices: [
          {
            text: `これはフォールバックの応答です。モックサーバーへの接続に失敗しました: ${error.message}`,
            index: 0,
            logprobs: null,
            finish_reason: "stop"
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };
      
      logEntry.status = 'error';
      logEntry.errorMessage = `モックサーバー接続エラー: ${error.message}`;
      logEntry.responseTime = new Date();
      logEntry.processingTime = Date.now() - startTime;
      
      res.status(200).json({
        success: true,
        data: dummyResponse,
        warning: "モックサーバーへの接続に失敗しました。フォールバックレスポンスを返しています。"
      });
    }
    
  } catch (error) {
    logger.error(`テキスト生成処理エラー: ${error.message}`);
    
    logEntry.status = 'error';
    logEntry.errorMessage = error.message;
    logEntry.responseTime = new Date();
    logEntry.processingTime = Date.now() - startTime;
    
    res.status(500).json({
      success: false,
      error: 'SERVER_001',
      message: 'サーバーエラーが発生しました'
    });
  }
  
  // ログ記録（実際のDB書き込みではなくログ出力のみ）
  logger.info(`アクセスログ: ${JSON.stringify(logEntry)}`);
};

/**
 * 画像生成モデルへのアクセス
 * POST /api/models/:modelId/generations
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
    const model = models.find(m => m.id === modelId && m.active);
    
    if (!model) {
      logEntry.errorMessage = 'モデルが存在しません';
      logger.warn(`モデル存在エラー: ${modelId}`);
      
      return res.status(404).json({
        success: false,
        error: 'MODEL_001',
        message: 'モデルが存在しません'
      });
    }
    
    // ユーザーの取得
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      logEntry.errorMessage = 'ユーザーが見つかりません';
      logger.warn(`ユーザー不明エラー: ${userId}`);
      
      return res.status(404).json({
        success: false,
        error: 'MODEL_003',
        message: 'ユーザーが見つかりません'
      });
    }
    
    // アクセス権限の検証
    const hasAccess = user.allowedModels.includes(modelId) || 
                      (model.requiredLevel === 'basic') || 
                      (user.accessTier === 'advanced' && model.requiredLevel === 'advanced') ||
                      (user.accessTier === 'admin');
    
    if (!hasAccess) {
      logEntry.errorMessage = 'このモデルへのアクセス権限がありません';
      logger.warn(`アクセス権限エラー: ユーザー ${user.userName} がモデル ${modelId} にアクセス試行`);
      
      return res.status(403).json({
        success: false,
        error: 'ACCESS_001',
        message: 'このモデルへのアクセス権限がありません'
      });
    }
    
    // モックサーバーへのリクエスト準備
    // モデルのパラメータから使用するモデルIDを取得
    const modelParams = model.parameters || {};
    const availableModels = modelParams.models || ['image-basic-v1'];
    const imageModelId = availableModels[0];
    
    // パラメータの準備
    const requestParams = {
      ...req.body,
      model: imageModelId,
      n: Math.min(req.body.n || 1, modelParams.n || 1),
      size: req.body.size || modelParams.size || '512x512',
      user: userId
    };
    
    // モックAIサーバーへのリクエスト
    try {
      const mockAiUrl = `${config.mockAi.url}/v1/images/generations`;
      
      logger.info(`モックAIへの画像生成リクエスト: ${mockAiUrl}, model=${imageModelId}`);
      
      // 実際のモックAPIサーバーへのリクエスト
      const mockResponse = await axios.post(mockAiUrl, requestParams);
      const imageData = mockResponse.data;
      
      // ログエントリの更新
      logEntry.status = 'success';
      logEntry.responseTime = new Date();
      logEntry.processingTime = Date.now() - startTime;
      logEntry.tokenUsage = imageData.usage;
      
      logger.info(`画像生成完了: model=${imageModelId}, prompt="${req.body.prompt?.substring(0, 30)}..."`);
      
      // クライアントへのレスポンス
      res.status(200).json({
        success: true,
        data: imageData
      });
      
    } catch (error) {
      logger.error(`モックAI画像生成リクエストエラー: ${error.message}`);
      
      // エラーの詳細をログに記録
      if (error.response) {
        logger.error(`APIエラーレスポンス: ${JSON.stringify(error.response.data)}`);
      }
      
      // フォールバック: ダミーレスポンスを返す
      const dummyResponse = {
        created: Math.floor(Date.now() / 1000),
        data: [
          {
            url: "https://placehold.co/512x512/webp?text=Mock+Image"
          }
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 0,
          total_tokens: 5
        }
      };
      
      logEntry.status = 'error';
      logEntry.errorMessage = `モックサーバー接続エラー: ${error.message}`;
      logEntry.responseTime = new Date();
      logEntry.processingTime = Date.now() - startTime;
      
      res.status(200).json({
        success: true,
        data: dummyResponse,
        warning: "モックサーバーへの接続に失敗しました。フォールバックレスポンスを返しています。"
      });
    }
    
  } catch (error) {
    logger.error(`画像生成処理エラー: ${error.message}`);
    
    logEntry.status = 'error';
    logEntry.errorMessage = error.message;
    logEntry.responseTime = new Date();
    logEntry.processingTime = Date.now() - startTime;
    
    res.status(500).json({
      success: false,
      error: 'SERVER_001',
      message: 'サーバーエラーが発生しました'
    });
  }
  
  // ログ記録（実際のDB書き込みではなくログ出力のみ）
  logger.info(`アクセスログ: ${JSON.stringify(logEntry)}`);
};

module.exports = {
  getModels,
  textCompletion,
  imageGeneration
};
