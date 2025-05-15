/**
 * APIルーター
 * API関連のエンドポイントを処理する
 */

const express = require('express');
const router = express.Router();
const modelController = require('./modelAdapter');
const adminController = require('./adminAdapter');
const { authenticate, requireAdmin } = require('../auth/authMiddlewareAdapter');

// 全APIルートで認証が必要
router.use(authenticate);

// モデル関連のルート
router.get('/models', modelController.getModels);
router.post('/models/:modelId/completions', modelController.textCompletion);
router.post('/models/:modelId/generations', modelController.imageGeneration);

// 管理者専用ルート
router.use('/admin', requireAdmin);
router.get('/admin/users', adminController.getUsers);
router.get('/admin/logs', adminController.getLogs);
router.get('/admin/stats', adminController.getStats);
router.get('/admin/models', adminController.getModels);

module.exports = router;
