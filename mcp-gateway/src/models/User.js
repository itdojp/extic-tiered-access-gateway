/**
 * ユーザーモデル
 * SCIMと連携するユーザー情報を格納するモデル
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config');

const UserSchema = new mongoose.Schema({
  // 基本情報
  id: {
    type: String, 
    required: true,
    unique: true
  },
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  email: {
    type: String,
    required: false,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'メールアドレスの形式が正しくありません'
    ]
  },
  password: {
    type: String,
    required: false,
    select: false
  },
  
  // システム情報
  systemRole: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // アクセス制御情報
  accessTier: {
    type: String,
    enum: ['basic', 'advanced', 'admin'],
    default: 'basic'
  },
  userGroups: {
    type: [String],
    default: []
  },
  allowedModels: {
    type: [String],
    default: []
  },
  maxTokens: {
    type: Number,
    default: 1000
  },
  allowedFeatures: {
    type: [String],
    default: []
  },
  
  // 監査情報
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// パスワードをハッシュ化するミドルウェア
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  this.updatedAt = Date.now();
  next();
});

// パスワード検証メソッド
UserSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// JWTトークン生成メソッド
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this.id,
      userName: this.userName,
      systemRole: this.systemRole,
      accessTier: this.accessTier
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn
    }
  );
};

// アクセス権限の評価メソッド
UserSchema.methods.canAccessModel = function(modelId) {
  if (!this.active) return false;
  
  // 管理者は全てのモデルにアクセス可能
  if (this.accessTier === 'admin') return true;
  
  // allowedModelsに含まれているか確認
  return this.allowedModels.includes(modelId);
};

// アクセス制限の取得メソッド
UserSchema.methods.getLimits = function() {
  // アクセスレベルに応じた制限を返す
  const limits = {
    basic: {
      maxTokens: 1000,
      rateLimit: 10
    },
    advanced: {
      maxTokens: 4000,
      rateLimit: 30
    },
    admin: {
      maxTokens: 10000,
      rateLimit: 100
    }
  };
  
  return limits[this.accessTier] || limits.basic;
};

// SCIM表現の取得メソッド
UserSchema.methods.toScim = function() {
  return {
    "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User", "urn:extic:scim:schemas:1.0:User", "custom:ai:access"],
    "id": this.id,
    "userName": this.userName,
    "displayName": this.displayName,
    "active": this.active,
    "emails": this.email ? [
      {
        "value": this.email,
        "primary": true
      }
    ] : [],
    "urn:extic:scim:schemas:1.0:User": {
      "role": this.systemRole,
      "exticGroups": this.userGroups,
      "extendAttrs": [
        {
          "name": "accessLevel",
          "value": this.accessTier
        }
      ]
    },
    "custom:ai:access": {
      "allowedModels": this.allowedModels,
      "maxTokens": this.maxTokens,
      "allowedFeatures": this.allowedFeatures
    },
    "meta": {
      "created": this.createdAt,
      "lastModified": this.updatedAt,
      "resourceType": "User"
    }
  };
};

// SCIMデータからユーザーを更新するメソッド
UserSchema.statics.fromScim = function(scimData) {
  const userData = {
    id: scimData.id,
    userName: scimData.userName,
    displayName: scimData.displayName || scimData.userName,
    active: scimData.active
  };
  
  // メールアドレスの処理
  if (scimData.emails && scimData.emails.length > 0) {
    const primaryEmail = scimData.emails.find(email => email.primary) || scimData.emails[0];
    userData.email = primaryEmail.value;
  }
  
  // Extic拡張スキーマの処理
  const exticSchema = scimData["urn:extic:scim:schemas:1.0:User"];
  if (exticSchema) {
    userData.systemRole = exticSchema.role || 'user';
    userData.userGroups = exticSchema.exticGroups || [];
    
    // 拡張属性の処理
    if (exticSchema.extendAttrs && Array.isArray(exticSchema.extendAttrs)) {
      const accessLevelAttr = exticSchema.extendAttrs.find(attr => attr.name === 'accessLevel');
      if (accessLevelAttr) {
        userData.accessTier = accessLevelAttr.value;
      }
    }
  }
  
  // AIアクセススキーマの処理
  const aiAccessSchema = scimData["custom:ai:access"];
  if (aiAccessSchema) {
    userData.allowedModels = aiAccessSchema.allowedModels || [];
    userData.maxTokens = aiAccessSchema.maxTokens || 1000;
    userData.allowedFeatures = aiAccessSchema.allowedFeatures || [];
  }
  
  return userData;
};

module.exports = mongoose.model('User', UserSchema);
