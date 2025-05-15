/**
 * データベース初期化シードスクリプト
 * 初期ユーザーとモデルをデータベースに挿入する
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('../../config');
const User = require('../models/User');
const Model = require('../models/Model');
const logger = require('./logger');
const db = require('./db');

// 初期管理者ユーザー
const adminUser = {
  id: uuidv4(),
  userName: 'admin',
  displayName: '管理者',
  email: 'admin@example.com',
  password: 'admin123', // 本番環境では強力なパスワードを使用すること
  active: true,
  systemRole: 'admin',
  accessTier: 'admin',
  userGroups: ['管理者グループ'],
  allowedModels: [],
  maxTokens: 10000,
  allowedFeatures: ['fine-tuning', 'model-management']
};

// 基本ユーザー
const basicUser = {
  id: uuidv4(),
  userName: 'basic_user',
  displayName: '基本ユーザー',
  email: 'basic@example.com',
  password: 'basic123',
  active: true,
  systemRole: 'user',
  accessTier: 'basic',
  userGroups: ['基本ユーザーグループ'],
  allowedModels: ['text-basic', 'image-basic'],
  maxTokens: 1000,
  allowedFeatures: []
};

// 高度ユーザー
const advancedUser = {
  id: uuidv4(),
  userName: 'advanced_user',
  displayName: '高度ユーザー',
  email: 'advanced@example.com',
  password: 'advanced123',
  active: true,
  systemRole: 'user',
  accessTier: 'advanced',
  userGroups: ['研究グループ'],
  allowedModels: ['text-basic', 'text-advanced', 'image-basic', 'image-advanced'],
  maxTokens: 4000,
  allowedFeatures: ['fine-tuning']
};

// モデル定義
const models = [
  {
    id: 'text-basic',
    name: '基本テキストモデル',
    description: '基本的なテキスト生成モデル',
    type: 'text',
    requiredLevel: 'basic',
    apiEndpoint: '/v1/completions',
    parameters: {
      max_tokens: 1000,
      temperature: 0.7,
      models: ['text-basic-v1']
    },
    active: true
  },
  {
    id: 'text-advanced',
    name: '高度テキストモデル',
    description: '高性能テキスト生成モデル',
    type: 'text',
    requiredLevel: 'advanced',
    apiEndpoint: '/v1/completions',
    parameters: {
      max_tokens: 4000,
      temperature: 0.7,
      models: ['text-advanced-v1']
    },
    active: true
  },
  {
    id: 'image-basic',
    name: '基本画像モデル',
    description: '基本的な画像生成モデル',
    type: 'image',
    requiredLevel: 'basic',
    apiEndpoint: '/v1/images/generations',
    parameters: {
      n: 1,
      size: '512x512',
      models: ['image-basic-v1']
    },
    active: true
  },
  {
    id: 'image-advanced',
    name: '高度画像モデル',
    description: '高性能画像生成モデル',
    type: 'image',
    requiredLevel: 'advanced',
    apiEndpoint: '/v1/images/generations',
    parameters: {
      n: 4,
      size: '1024x1024',
      models: ['image-advanced-v1']
    },
    active: true
  }
];

/**
 * パスワードをハッシュ化
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * データベースをシードする
 */
const seedDatabase = async () => {
  try {
    // データベースに接続
    await db.connectDB();
    
    logger.info('データベースのシード開始...');
    
    // コレクションのクリア
    await User.deleteMany({});
    await Model.deleteMany({});
    
    logger.info('既存のコレクションをクリアしました');
    
    // パスワードのハッシュ化
    adminUser.password = await hashPassword(adminUser.password);
    basicUser.password = await hashPassword(basicUser.password);
    advancedUser.password = await hashPassword(advancedUser.password);
    
    // ユーザーの作成
    await User.create(adminUser);
    await User.create(basicUser);
    await User.create(advancedUser);
    
    logger.info('ユーザーを作成しました');
    
    // モデルの作成
    await Model.create(models);
    
    logger.info('モデルを作成しました');
    
    logger.info('データベースのシード完了');
    
    // 接続を閉じる
    await db.closeDB();
    
    process.exit(0);
    
  } catch (error) {
    logger.error(`シード処理エラー: ${error.message}`);
    process.exit(1);
  }
};

// スクリプト実行
seedDatabase();
