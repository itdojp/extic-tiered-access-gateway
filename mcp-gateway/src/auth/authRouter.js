/**
 * 認証ルーター
 * 認証関連のエンドポイントを処理する
 */

const express = require('express');
const router = express.Router();
const authController = require('./authAdapter');
const { authenticate } = require('./authMiddlewareAdapter');

// 認証不要のエンドポイント
router.post('/login', authController.login);

// 認証が必要なエンドポイント
router.use(authenticate);
router.get('/me', authController.getMe);

module.exports = router;
