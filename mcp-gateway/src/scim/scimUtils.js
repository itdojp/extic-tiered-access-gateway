/**
 * SCIM関連のユーティリティ
 * SCIMプロトコルの処理をサポートする関数群
 */

const logger = require('../utils/logger');

/**
 * SCIMエラーレスポンスを生成
 * @param {number} status - HTTPステータスコード
 * @param {string} detail - エラーの詳細説明
 * @param {string} [scimType] - SCIMエラータイプ
 * @returns {Object} SCIMエラーオブジェクト
 */
const createScimError = (status, detail, scimType = null) => {
  const error = {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    status: status.toString(),
    detail
  };
  
  if (scimType) {
    error.scimType = scimType;
  }
  
  return error;
};

/**
 * SCIMリソースのリストレスポンスを生成
 * @param {Array} resources - リソースの配列
 * @param {number} totalResults - 全リソース数
 * @param {number} startIndex - 開始インデックス
 * @param {number} count - 1ページあたりの件数
 * @returns {Object} SCIMリストレスポンス
 */
const createListResponse = (resources, totalResults, startIndex = 1, count = 10) => {
  return {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults,
    startIndex,
    itemsPerPage: resources.length,
    Resources: resources
  };
};

/**
 * SCIMフィルターをMongoDBクエリに変換
 * @param {string} filter - SCIMフィルター式
 * @returns {Object} MongoDBクエリオブジェクト
 */
const parseScimFilter = (filter) => {
  logger.debug(`SCIMフィルター解析: ${filter}`);
  
  if (!filter) {
    return {};
  }
  
  try {
    // 単純なSCIMフィルターの解析（基本的なケースのみサポート）
    // 例: userName eq "john"
    const equalityMatch = filter.match(/(\w+)\s+eq\s+"([^"]+)"/);
    if (equalityMatch) {
      const [_, attribute, value] = equalityMatch;
      logger.debug(`フィルター解析結果: ${attribute} = ${value}`);
      
      // 属性に基づいてクエリを構築
      if (attribute === 'userName') {
        return { userName: value };
      } else if (attribute === 'email') {
        return { email: value };
      } else if (attribute === 'id') {
        return { id: value };
      } else if (attribute === 'displayName') {
        return { displayName: value };
      } else {
        // その他の属性への対応
        logger.warn(`未サポートの属性フィルター: ${attribute}`);
        return {};
      }
    }
    
    // 'present' 演算子 (例: active pr)
    const presentMatch = filter.match(/(\w+)\s+pr/);
    if (presentMatch) {
      const [_, attribute] = presentMatch;
      logger.debug(`Present フィルター解析結果: ${attribute} exists`);
      
      return { [attribute]: { $exists: true } };
    }
    
    // より複雑なフィルターの場合は未サポート
    logger.warn(`複雑すぎるフィルター式: ${filter}`);
    return {};
    
  } catch (error) {
    logger.error(`SCIMフィルター解析エラー: ${error.message}`);
    return {};
  }
};

/**
 * ページングパラメータを処理
 * @param {Object} params - リクエストパラメータ
 * @returns {Object} スタートインデックスとカウント
 */
const handlePaging = (params) => {
  const startIndex = parseInt(params.startIndex) || 1;
  const count = parseInt(params.count) || 10;
  
  return {
    startIndex,
    count,
    skip: Math.max(0, startIndex - 1),
    limit: count
  };
};

module.exports = {
  createScimError,
  createListResponse,
  parseScimFilter,
  handlePaging
};
