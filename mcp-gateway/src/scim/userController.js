/**
 * SCIMユーザーコントローラ
 * SCIMプロトコルによるユーザー操作を処理する
 */

const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const logger = require('../utils/logger');
const { 
  createScimError, 
  createListResponse, 
  parseScimFilter,
  handlePaging 
} = require('./scimUtils');

/**
 * ユーザー一覧を取得
 * GET /scim/v2/Users
 */
const getUsers = async (req, res) => {
  try {
    logger.debug('SCIMユーザー一覧リクエスト受信');
    
    // ページング処理
    const { startIndex, count, skip, limit } = handlePaging(req.query);
    
    // フィルター処理
    let query = {};
    if (req.query.filter) {
      query = parseScimFilter(req.query.filter);
    }
    
    // ユーザーの取得
    const users = await User.find(query)
      .skip(skip)
      .limit(limit);
    
    // 合計カウントの取得
    const totalResults = await User.countDocuments(query);
    
    // ユーザーをSCIM形式に変換
    const scimUsers = users.map(user => user.toScim());
    
    // レスポンスの作成
    const response = createListResponse(
      scimUsers,
      totalResults,
      startIndex,
      count
    );
    
    logger.info(`SCIMユーザー一覧取得成功: ${scimUsers.length}件 / 合計${totalResults}件`);
    return res.status(200).json(response);
    
  } catch (error) {
    logger.error(`SCIMユーザー一覧取得エラー: ${error.message}`);
    return res.status(500).json(
      createScimError(500, `ユーザー一覧の取得中にエラーが発生しました: ${error.message}`)
    );
  }
};

/**
 * ユーザーの詳細を取得
 * GET /scim/v2/Users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug(`SCIMユーザー詳細リクエスト受信: ID=${id}`);
    
    // ユーザーの取得
    const user = await User.findOne({ id });
    
    if (!user) {
      logger.warn(`SCIMユーザー詳細取得失敗: ID=${id} のユーザーが見つかりません`);
      return res.status(404).json(
        createScimError(404, `ID=${id} のユーザーが見つかりません`, 'notFound')
      );
    }
    
    // SCIM形式にして返す
    const scimUser = user.toScim();
    
    logger.info(`SCIMユーザー詳細取得成功: ID=${id}`);
    return res.status(200).json(scimUser);
    
  } catch (error) {
    logger.error(`SCIMユーザー詳細取得エラー: ${error.message}`);
    return res.status(500).json(
      createScimError(500, `ユーザー詳細の取得中にエラーが発生しました: ${error.message}`)
    );
  }
};

/**
 * ユーザーを作成
 * POST /scim/v2/Users
 */
const createUser = async (req, res) => {
  try {
    logger.debug('SCIMユーザー作成リクエスト受信');
    
    // リクエストデータのバリデーション
    if (!req.body.userName) {
      logger.warn('SCIMユーザー作成失敗: userNameが必要です');
      return res.status(400).json(
        createScimError(400, 'userNameフィールドは必須です', 'invalidValue')
      );
    }
    
    // 既存ユーザーの確認
    const existingUser = await User.findOne({ userName: req.body.userName });
    if (existingUser) {
      logger.warn(`SCIMユーザー作成失敗: userName=${req.body.userName} は既に使用されています`);
      return res.status(409).json(
        createScimError(409, `userName=${req.body.userName} は既に使用されています`, 'uniqueness')
      );
    }
    
    // IDの生成
    const userId = req.body.id || uuidv4();
    
    // SCIMデータからユーザーデータへの変換
    const userData = User.fromScim({
      ...req.body,
      id: userId
    });
    
    // ユーザーの作成
    const user = await User.create(userData);
    
    // SCIM形式にして返す
    const scimUser = user.toScim();
    
    logger.info(`SCIMユーザー作成成功: ID=${userId}, userName=${user.userName}`);
    return res.status(201).json(scimUser);
    
  } catch (error) {
    logger.error(`SCIMユーザー作成エラー: ${error.message}`);
    return res.status(500).json(
      createScimError(500, `ユーザーの作成中にエラーが発生しました: ${error.message}`)
    );
  }
};

/**
 * ユーザーを更新
 * PUT /scim/v2/Users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug(`SCIMユーザー更新リクエスト受信: ID=${id}`);
    
    // ユーザーの取得
    const user = await User.findOne({ id });
    
    if (!user) {
      logger.warn(`SCIMユーザー更新失敗: ID=${id} のユーザーが見つかりません`);
      return res.status(404).json(
        createScimError(404, `ID=${id} のユーザーが見つかりません`, 'notFound')
      );
    }
    
    // SCIMデータからユーザーデータへの変換
    const userData = User.fromScim({
      ...req.body,
      id // IDを維持
    });
    
    // ユーザーの更新
    Object.keys(userData).forEach(key => {
      if (key !== 'id') { // IDは変更不可
        user[key] = userData[key];
      }
    });
    
    await user.save();
    
    // SCIM形式にして返す
    const scimUser = user.toScim();
    
    logger.info(`SCIMユーザー更新成功: ID=${id}`);
    return res.status(200).json(scimUser);
    
  } catch (error) {
    logger.error(`SCIMユーザー更新エラー: ${error.message}`);
    return res.status(500).json(
      createScimError(500, `ユーザーの更新中にエラーが発生しました: ${error.message}`)
    );
  }
};

/**
 * ユーザーを削除
 * DELETE /scim/v2/Users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug(`SCIMユーザー削除リクエスト受信: ID=${id}`);
    
    // ユーザーの取得
    const user = await User.findOne({ id });
    
    if (!user) {
      logger.warn(`SCIMユーザー削除失敗: ID=${id} のユーザーが見つかりません`);
      return res.status(404).json(
        createScimError(404, `ID=${id} のユーザーが見つかりません`, 'notFound')
      );
    }
    
    // ユーザーの削除
    await User.deleteOne({ id });
    
    logger.info(`SCIMユーザー削除成功: ID=${id}`);
    return res.status(204).send();
    
  } catch (error) {
    logger.error(`SCIMユーザー削除エラー: ${error.message}`);
    return res.status(500).json(
      createScimError(500, `ユーザーの削除中にエラーが発生しました: ${error.message}`)
    );
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
