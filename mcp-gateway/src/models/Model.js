/**
 * AIモデル定義モデル
 * アクセス可能なAIモデルの定義を格納するモデル
 */

const mongoose = require('mongoose');

const ModelSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'audio', 'video', 'multimodal'],
    required: true
  },
  requiredLevel: {
    type: String,
    enum: ['basic', 'advanced', 'admin'],
    default: 'basic'
  },
  apiEndpoint: {
    type: String,
    required: true
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新日時を自動更新
ModelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 権限レベルによるアクセス評価
ModelSchema.methods.isAccessibleByLevel = function(accessLevel) {
  if (!this.active) return false;
  
  const levelMap = {
    "basic": 1,
    "advanced": 2,
    "admin": 3
  };
  
  return levelMap[accessLevel] >= levelMap[this.requiredLevel];
};

module.exports = mongoose.model('Model', ModelSchema);
