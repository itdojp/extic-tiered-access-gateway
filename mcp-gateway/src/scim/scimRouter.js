/**
 * SCIMルーター
 * SCIMエンドポイントのルーティングを処理する
 */

const express = require('express');
const router = express.Router();
const userController = require('./userController');
const scimAuth = require('./scimAuth');

// 認証ミドルウェアの適用
router.use(scimAuth);

// ユーザー関連のエンドポイント
router.get('/Users', userController.getUsers);
router.get('/Users/:id', userController.getUserById);
router.post('/Users', userController.createUser);
router.put('/Users/:id', userController.updateUser);
router.delete('/Users/:id', userController.deleteUser);

// ServiceProviderConfig エンドポイント
router.get('/ServiceProviderConfig', (req, res) => {
  res.json({
    "schemas": ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
    "documentationUri": "https://example.com/help/scim",
    "patch": {
      "supported": false
    },
    "bulk": {
      "supported": false
    },
    "filter": {
      "supported": true,
      "maxResults": 200
    },
    "changePassword": {
      "supported": false
    },
    "sort": {
      "supported": false
    },
    "etag": {
      "supported": false
    },
    "authenticationSchemes": [
      {
        "type": "Bearer",
        "name": "Bearer Token Authentication",
        "description": "Authentication scheme using a Bearer token",
        "specUri": "https://tools.ietf.org/html/rfc6750",
        "primary": true
      }
    ]
  });
});

// ResourceTypes エンドポイント
router.get('/ResourceTypes', (req, res) => {
  res.json({
    "schemas": ["urn:ietf:params:scim:schemas:core:2.0:ResourceType"],
    "id": "User",
    "name": "User",
    "endpoint": "/Users",
    "description": "User Account",
    "schema": "urn:ietf:params:scim:schemas:core:2.0:User",
    "schemaExtensions": [
      {
        "schema": "urn:extic:scim:schemas:1.0:User",
        "required": false
      },
      {
        "schema": "custom:ai:access",
        "required": false
      }
    ]
  });
});

// Schemas エンドポイント
router.get('/Schemas', (req, res) => {
  res.json({
    "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    "totalResults": 3,
    "Resources": [
      {
        "id": "urn:ietf:params:scim:schemas:core:2.0:User",
        "name": "User",
        "description": "User Account",
        "attributes": [
          {
            "name": "id",
            "type": "string",
            "multiValued": false,
            "required": true,
            "caseExact": true,
            "mutability": "readOnly",
            "returned": "always",
            "uniqueness": "server"
          },
          {
            "name": "userName",
            "type": "string",
            "multiValued": false,
            "required": true,
            "caseExact": false,
            "mutability": "readWrite",
            "returned": "always",
            "uniqueness": "server"
          },
          {
            "name": "displayName",
            "type": "string",
            "multiValued": false,
            "required": false,
            "caseExact": false,
            "mutability": "readWrite",
            "returned": "always",
            "uniqueness": "none"
          },
          {
            "name": "active",
            "type": "boolean",
            "multiValued": false,
            "required": false,
            "mutability": "readWrite",
            "returned": "always"
          },
          {
            "name": "emails",
            "type": "complex",
            "multiValued": true,
            "required": false,
            "mutability": "readWrite",
            "returned": "default",
            "subAttributes": [
              {
                "name": "value",
                "type": "string",
                "multiValued": false,
                "required": true
              },
              {
                "name": "primary",
                "type": "boolean",
                "multiValued": false,
                "required": false
              }
            ]
          }
        ]
      },
      {
        "id": "urn:extic:scim:schemas:1.0:User",
        "name": "ExticUser",
        "description": "Extic User Extension",
        "attributes": [
          {
            "name": "role",
            "type": "string",
            "multiValued": false,
            "required": false,
            "caseExact": true,
            "mutability": "readWrite",
            "returned": "default"
          },
          {
            "name": "exticGroups",
            "type": "string",
            "multiValued": true,
            "required": false,
            "caseExact": true,
            "mutability": "readWrite",
            "returned": "default"
          },
          {
            "name": "extendAttrs",
            "type": "complex",
            "multiValued": true,
            "required": false,
            "mutability": "readWrite",
            "returned": "default",
            "subAttributes": [
              {
                "name": "name",
                "type": "string",
                "multiValued": false,
                "required": true
              },
              {
                "name": "value",
                "type": "string",
                "multiValued": false,
                "required": true
              }
            ]
          }
        ]
      },
      {
        "id": "custom:ai:access",
        "name": "AIAccess",
        "description": "AI Model Access Control",
        "attributes": [
          {
            "name": "allowedModels",
            "type": "string",
            "multiValued": true,
            "required": false,
            "caseExact": true,
            "mutability": "readWrite",
            "returned": "default"
          },
          {
            "name": "maxTokens",
            "type": "integer",
            "multiValued": false,
            "required": false,
            "mutability": "readWrite",
            "returned": "default"
          },
          {
            "name": "allowedFeatures",
            "type": "string",
            "multiValued": true,
            "required": false,
            "caseExact": true,
            "mutability": "readWrite",
            "returned": "default"
          }
        ]
      }
    ]
  });
});

module.exports = router;
