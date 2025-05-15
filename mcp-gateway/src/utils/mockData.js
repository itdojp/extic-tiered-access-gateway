/**
 * モックデータエクスポート
 * MongoDBが利用できない環境で使用するモックデータ
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// パスワードのモックハッシュ
const mockPasswordHash = '$2a$10$aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789ABCDEFGHIJKLM';

// 初期管理者ユーザー
const adminUser = {
  id: 'admin-' + uuidv4(),
  userName: 'admin',
  displayName: '管理者',
  email: 'admin@example.com',
  password: mockPasswordHash,
  active: true,
  systemRole: 'admin',
  accessTier: 'admin',
  userGroups: ['管理者グループ'],
  allowedModels: [],
  maxTokens: 10000,
  allowedFeatures: ['fine-tuning', 'model-management'],
  createdAt: new Date(),
  updatedAt: new Date()
};

// 基本ユーザー
const basicUser = {
  id: 'basic-' + uuidv4(),
  userName: 'basic_user',
  displayName: '基本ユーザー',
  email: 'basic@example.com',
  password: mockPasswordHash,
  active: true,
  systemRole: 'user',
  accessTier: 'basic',
  userGroups: ['基本ユーザーグループ'],
  allowedModels: ['text-basic', 'image-basic'],
  maxTokens: 1000,
  allowedFeatures: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

// 高度ユーザー
const advancedUser = {
  id: 'advanced-' + uuidv4(),
  userName: 'advanced_user',
  displayName: '高度ユーザー',
  email: 'advanced@example.com',
  password: mockPasswordHash,
  active: true,
  systemRole: 'user',
  accessTier: 'advanced',
  userGroups: ['研究グループ'],
  allowedModels: ['text-basic', 'text-advanced', 'image-basic', 'image-advanced'],
  maxTokens: 4000,
  allowedFeatures: ['fine-tuning'],
  createdAt: new Date(),
  updatedAt: new Date()
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
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
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
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
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
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
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
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ユーザーデータをエクスポート
const users = [adminUser, basicUser, advancedUser];

module.exports = {
  users,
  models,
  
  // ユーザー検索用関数
  findUserByUsername: (username) => {
    return users.find(user => user.userName === username);
  },
  
  // モデル検索用関数
  findModelById: (modelId) => {
    return models.find(model => model.id === modelId);
  },
  
  // 利用可能なモデル一覧取得関数
  getModelsForAccessTier: (accessTier) => {
    switch(accessTier) {
      case 'admin':
        return models;
      case 'advanced':
        return models.filter(model => ['basic', 'advanced'].includes(model.requiredLevel));
      case 'basic':
      default:
        return models.filter(model => model.requiredLevel === 'basic');
    }
  }
};
