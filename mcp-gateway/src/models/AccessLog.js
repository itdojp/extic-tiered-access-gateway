/**
 * アクセスログモデル
 * モデルアクセスの記録を保持するモデル
 */

const mongoose = require('mongoose');

const AccessLogSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  modelId: {
    type: String,
    required: true,
    index: true
  },
  operation: {
    type: String,
    required: true
  },
  requestTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  responseTime: {
    type: Number,
    default: 0
  },
  tokenCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['success', 'error'],
    required: true
  },
  errorMessage: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  requestParams: {
    type: mongoose.Schema.Types.Mixed
  },
  responseData: {
    type: mongoose.Schema.Types.Mixed
  }
});

// インデックスの作成
AccessLogSchema.index({ userId: 1, requestTime: -1 });
AccessLogSchema.index({ modelId: 1, requestTime: -1 });
AccessLogSchema.index({ status: 1, requestTime: -1 });

module.exports = mongoose.model('AccessLog', AccessLogSchema);
