# Extic SCIM連携確認テスト ガイド

## 1. 概要

このドキュメントでは、Exticとの SCIM連携機能の動作確認方法について説明します。「多段階アクセス制御モデルゲートウェイ」のPoC開発に先立ち、Exticの主要機能が期待通りに動作することを検証するためのPythonベースの確認プログラムと、その実行方法を提供します。

### 1.1 目的

- ExticのSCIM API連携機能の動作確認
- 多段階アクセス制御モデルに必要なExtic機能の検証
- PoCの開発に必要な前提条件の確認
- Exticとの連携における技術的課題の早期発見

### 1.2 確認対象機能

- SCIM基本接続性
- ユーザー管理操作 (CRUD)
- グループ連携とアクセスレベル変更
- 拡張属性の操作
- 検索とフィルタリング機能
- パフォーマンスと応答時間

## 2. 確認項目リスト

以下は、Exticとの統合を検証するための主要な確認項目です。

### 2.1 基本接続確認

| 確認項目 | 検証内容 | 期待される結果 |
|---------|---------|--------------|
| SCIM エンドポイント接続性 | ExticのSCIMエンドポイントに接続 | 200 OKレスポンス |
| Basic認証 | ユーザー名とパスワードによる認証 | 認証成功 |
| Bearer認証 | トークンによる認証 | 認証成功 |
| サーバー情報確認 | システム情報の取得 | サーバー情報取得 |

### 2.2 ユーザー管理操作確認

| 確認項目 | 検証内容 | 期待される結果 |
|---------|---------|--------------|
| ユーザー一覧取得 | 全ユーザーの取得 | ユーザーリスト |
| ユーザー検索 | ユーザー名による検索 | 対象ユーザーのみ取得 |
| ユーザー作成 | 新規ユーザーの作成 | 201 Created |
| ユーザー情報取得 | 特定ユーザーの情報取得 | ユーザー詳細情報 |
| ユーザー更新 | ユーザー情報の更新 | 200 OKと更新内容 |
| ユーザー削除 | ユーザーの削除 | 204 No Content |

### 2.3 グループ連携と権限検証

| 確認項目 | 検証内容 | 期待される結果 |
|---------|---------|--------------|
| グループ情報取得 | ユーザーのグループ情報取得 | グループリスト |
| 基本グループ割り当て | 基本ユーザーグループへの割り当て | 適切なグループ設定 |
| 研究グループ昇格 | 研究グループへの変更 | グループ変更の反映 |
| 管理者グループ昇格 | 管理者グループへの変更 | グループと権限変更の反映 |
| グループ変更の即時性 | 変更後の即時確認 | 変更内容の即時反映 |

### 2.4 拡張属性操作確認

| 確認項目 | 検証内容 | 期待される結果 |
|---------|---------|--------------|
| 基本拡張属性設定 | 拡張属性の初期設定 | 属性値の保存 |
| accessLevel属性設定 | アクセスレベルの設定と取得 | 属性値の反映 |
| 複数拡張属性 | 複数の拡張属性の同時設定 | すべての属性値の反映 |
| 拡張属性更新 | 既存拡張属性の値更新 | 更新値の反映 |
| 拡張属性追加 | 新規拡張属性の追加 | 新規属性の反映 |

### 2.5 高度な機能確認

| 確認項目 | 検証内容 | 期待される結果 |
|---------|---------|--------------|
| 条件付き検索 | 属性値に基づくフィルター検索 | 条件に一致するユーザーのみ |
| パフォーマンス | 連続リクエスト時の応答時間 | 安定した応答時間 |
| エラー処理 | 不正なリクエスト時のエラーレスポンス | 適切なエラーコードとメッセージ |
| 一括操作 | 複数ユーザーの連続操作 | すべての操作の正常完了 |
| スキーマ検証 | スキーマ定義との整合性 | スキーマ準拠の確認 |

## 3. Python確認プログラム

以下のPythonプログラムを使用して、Exticとの連携を確認します。このプログラムは、上記の確認項目を自動的にテストし、結果をログファイルに記録します。

### 3.1 プログラムの構造

```
ExticSCIMTester
├── __init__ - 初期化とセッション設定
├── log - ログ出力関数
├── 基本接続テスト
│   └── test_connection - 基本接続テスト
├── ユーザー管理テスト
│   ├── get_users - ユーザー一覧取得
│   ├── get_user_by_username - ユーザー名による検索
│   ├── get_user_by_id - ユーザーID検索
│   ├── create_user - ユーザー作成
│   ├── update_user - ユーザー更新
│   ├── delete_user - ユーザー削除
│   └── test_user_create_update_delete - ユーザーCRUDテスト
├── グループ連携テスト
│   └── test_group_based_access - グループベースのアクセス制御テスト
├── 拡張属性テスト
│   └── test_extended_attributes - 拡張属性テスト
├── 高度なテスト
│   ├── test_performance - パフォーマンステスト
│   ├── test_filtered_search - フィルター検索テスト
│   └── test_bulk_operations - 一括操作テスト
└── run_all_tests - すべてのテストを実行
```

### 3.2 プログラムコード

```python
import requests
import json
import time
import sys
from datetime import datetime

class ExticSCIMTester:
    def __init__(self, base_url, auth_type="basic", username=None, password=None, token=None):
        """
        Exticとの接続テスト用クラスのコンストラクタ
        
        Args:
            base_url (str): ExticのSCIM APIのベースURL (例: "https://example.ex-tic.com/idm/scimApi/1.0")
            auth_type (str): 認証タイプ ("basic" または "bearer")
            username (str): Basic認証用ユーザー名
            password (str): Basic認証用パスワード
            token (str): Bearer認証用トークン
        """
        self.base_url = base_url
        self.auth_type = auth_type
        self.username = username
        self.password = password
        self.token = token
        self.session = requests.Session()
        
        # 認証ヘッダーの設定
        if auth_type.lower() == "basic" and username and password:
            self.session.auth = (username, password)
        elif auth_type.lower() == "bearer" and token:
            self.session.headers.update({
                "Authorization": f"Bearer {token}"
            })
        else:
            raise ValueError("認証情報が不正です")
            
        # 共通ヘッダーの設定
        self.session.headers.update({
            "Accept": "application/scim+json;charset=UTF-8",
            "Content-Type": "application/scim+json;charset=UTF-8"
        })
        
        self.log_file = f"extic_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
    def log(self, message):
        """ログを出力"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] {message}"
        print(log_message)
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(log_message + "\n")
            
    def test_connection(self):
        """基本的な接続テスト"""
        self.log("=== 基本接続テスト開始 ===")
        try:
            response = self.session.get(f"{self.base_url}/Users?startIndex=1&count=0")
            response.raise_for_status()
            self.log(f"接続成功: ステータスコード: {response.status_code}")
            self.log(f"レスポンス: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
            return True
        except Exception as e:
            self.log(f"接続エラー: {str(e)}")
            return False
            
    def get_users(self, start_index=1, count=10):
        """ユーザー一覧の取得"""
        self.log("=== ユーザー一覧取得テスト ===")
        try:
            response = self.session.get(
                f"{self.base_url}/Users?startIndex={start_index}&count={count}"
            )
            response.raise_for_status()
            users = response.json()
            self.log(f"ユーザー数: {users.get('totalResults', 0)}")
            return users
        except Exception as e:
            self.log(f"ユーザー一覧取得エラー: {str(e)}")
            return None
            
    def get_user_by_username(self, username):
        """ユーザー名によるユーザー検索"""
        self.log(f"=== ユーザー検索テスト: {username} ===")
        try:
            response = self.session.get(
                f"{self.base_url}/Users?filter=userName eq \"{username}\""
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("totalResults", 0) > 0 and "Resources" in result:
                user = result["Resources"][0]
                self.log(f"ユーザー情報: {json.dumps(user, indent=2, ensure_ascii=False)}")
                return user
            else:
                self.log(f"ユーザー {username} が見つかりません")
                return None
        except Exception as e:
            self.log(f"ユーザー検索エラー: {str(e)}")
            return None
    
    def get_user_by_id(self, user_id):
        """ユーザーIDによるユーザー取得"""
        self.log(f"=== ユーザーID検索テスト: {user_id} ===")
        try:
            response = self.session.get(f"{self.base_url}/Users/{user_id}")
            response.raise_for_status()
            user = response.json()
            self.log(f"ユーザー情報: {json.dumps(user, indent=2, ensure_ascii=False)}")
            return user
        except Exception as e:
            self.log(f"ユーザー取得エラー: {str(e)}")
            return None
    
    def create_user(self, user_data):
        """ユーザー作成"""
        self.log("=== ユーザー作成テスト ===")
        try:
            response = self.session.post(
                f"{self.base_url}/Users",
                json=user_data
            )
            response.raise_for_status()
            created_user = response.json()
            self.log(f"ユーザー作成成功: {json.dumps(created_user, indent=2, ensure_ascii=False)}")
            return created_user
        except Exception as e:
            self.log(f"ユーザー作成エラー: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                self.log(f"エラーレスポンス: {e.response.text}")
            return None
    
    def update_user(self, user_id, user_data):
        """ユーザー更新"""
        self.log(f"=== ユーザー更新テスト: {user_id} ===")
        try:
            response = self.session.put(
                f"{self.base_url}/Users/{user_id}",
                json=user_data
            )
            response.raise_for_status()
            updated_user = response.json()
            self.log(f"ユーザー更新成功: {json.dumps(updated_user, indent=2, ensure_ascii=False)}")
            return updated_user
        except Exception as e:
            self.log(f"ユーザー更新エラー: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                self.log(f"エラーレスポンス: {e.response.text}")
            return None
    
    def delete_user(self, user_id):
        """ユーザー削除"""
        self.log(f"=== ユーザー削除テスト: {user_id} ===")
        try:
            response = self.session.delete(f"{self.base_url}/Users/{user_id}")
            if response.status_code == 204:
                self.log("ユーザー削除成功")
                return True
            else:
                self.log(f"予期しないステータスコード: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"ユーザー削除エラー: {str(e)}")
            return False
    
    def test_user_create_update_delete(self):
        """ユーザーのCRUD操作の一連のテスト"""
        self.log("=== ユーザーCRUD操作テスト開始 ===")
        
        # テストユーザーデータ
        test_username = f"testuser_{int(time.time())}"
        
        # 1. ユーザー作成
        user_data = {
            "schemas": [
                "urn:ietf:params:scim:schemas:core:2.0:User",
                "urn:extic:scim:schemas:1.0:User"
            ],
            "userName": test_username,
            "password": "TestP@ssw0rd",
            "displayName": "テストユーザー",
            "urn:extic:scim:schemas:1.0:User": {
                "exticGroups": ["基本ユーザーグループ"],
                "extendAttrs": [
                    {
                        "name": "accessLevel",
                        "value": "basic"
                    }
                ]
            }
        }
        
        created_user = self.create_user(user_data)
        if not created_user:
            self.log("ユーザー作成テスト失敗")
            return False
        
        user_id = created_user["id"]
        
        # 2. ユーザー情報取得
        retrieved_user = self.get_user_by_id(user_id)
        if not retrieved_user:
            self.log("ユーザー取得テスト失敗")
            return False
        
        # 3. ユーザー更新 - 研究グループに変更
        update_data = {
            "schemas": [
                "urn:ietf:params:scim:schemas:core:2.0:User",
                "urn:extic:scim:schemas:1.0:User"
            ],
            "userName": test_username,
            "displayName": "テストユーザー（更新）",
            "urn:extic:scim:schemas:1.0:User": {
                "exticGroups": ["研究グループ"],
                "extendAttrs": [
                    {
                        "name": "accessLevel",
                        "value": "advanced"
                    }
                ]
            }
        }
        
        updated_user = self.update_user(user_id, update_data)
        if not updated_user:
            self.log("ユーザー更新テスト失敗")
            return False
        
        # 4. 更新後の情報確認
        updated_check = self.get_user_by_id(user_id)
        if not updated_check:
            self.log("更新後のユーザー取得テスト失敗")
            return False
        
        # グループと権限レベルの変更を確認
        extic_data = updated_check.get("urn:extic:scim:schemas:1.0:User", {})
        groups = extic_data.get("exticGroups", [])
        
        if "研究グループ" in groups:
            self.log("グループ更新確認: 成功")
        else:
            self.log(f"グループ更新確認: 失敗 - {groups}")
        
        # 5. ユーザー削除
        delete_result = self.delete_user(user_id)
        if not delete_result:
            self.log("ユーザー削除テスト失敗")
            return False
        
        # 6. 削除確認
        deleted_check = self.get_user_by_id(user_id)
        if deleted_check:
            self.log("ユーザー削除確認: 失敗 - ユーザーがまだ存在しています")
            return False
        else:
            self.log("ユーザー削除確認: 成功")
        
        self.log("=== ユーザーCRUD操作テスト完了 ===")
        return True
    
    def test_group_based_access(self):
        """グループベースのアクセス制御テスト"""
        self.log("=== グループベースアクセス制御テスト開始 ===")
        
        # 1. 基本ユーザーの作成
        basic_username = f"basic_user_{int(time.time())}"
        basic_user_data = {
            "schemas": [
                "urn:ietf:params:scim:schemas:core:2.0:User",
                "urn:extic:scim:schemas:1.0:User"
            ],
            "userName": basic_username,
            "password": "BasicP@ss123",
            "displayName": "基本ユーザー",
            "urn:extic:scim:schemas:1.0:User": {
                "exticGroups": ["基本ユーザーグループ"],
                "extendAttrs": [
                    {
                        "name": "accessLevel",
                        "value": "basic"
                    }
                ]
            }
        }
        
        basic_user = self.create_user(basic_user_data)
        if not basic_user:
            self.log("基本ユーザー作成失敗")
            return False
        
        basic_user_id = basic_user["id"]
        
        # 2. グループの変更 (基本→研究)
        self.log("基本ユーザーを研究グループに変更")
        update_data = {
            "schemas": [
                "urn:ietf:params:scim:schemas:core:2.0:User",
                "urn:extic:scim:schemas:1.0:User"
            ],
            "userName": basic_username,
            "displayName": "基本ユーザー",
            "urn:extic:scim:schemas:1.0:User": {
                "exticGroups": ["研究グループ"],
                "extendAttrs": [
                    {
                        "name": "accessLevel",
                        "value": "advanced"
                    }
                ]
            }
        }
        
        updated_user = self.update_user(basic_user_id, update_data)
        if not updated_user:
            self.log("ユーザーグループ更新失敗")
            self.delete_user(basic_user_id)  # クリーンアップ
            return False
        
        # 3. 管理者グループへの変更
        self.log("研究ユーザーを管理者グループに変更")
        admin_update_data = {
            "schemas": [
                "urn:ietf:params:scim:schemas:core:2.0:User",
                "urn:extic:scim:schemas:1.0:User"
            ],
            "userName": basic_username,
            "displayName": "基本ユーザー",
            "urn:extic:scim:schemas:1.0:User": {
                "exticGroups": ["管理者グループ"],
                "role": "管理者",
                "extendAttrs": [
                    {
                        "name": "accessLevel",
                        "value": "admin"
                    }
                ]
            }
        }
        
        admin_user = self.update_user(basic_user_id, admin_update_data)
        if not admin_user:
            self.log("管理者グループ更新失敗")
            self.delete_user(basic_user_id)  # クリーンアップ
            return False
        
        # 4. 最終確認とクリーンアップ
        final_user = self.get_user_by_id(basic_user_id)
        if final_user:
            extic_data = final_user.get("urn:extic:scim:schemas:1.0:User", {})
            role = extic_data.get("role", "")
            self.log(f"最終ロール確認: {role}")
            
            # クリーンアップ
            self.delete_user(basic_user_id)
            self.log("テストユーザー削除完了")
            return True
        else:
            self.log("最終ユーザー確認失敗")
            return False
    
    def test_extended_attributes(self):
        """拡張属性テスト"""
        self.log("=== 拡張属性テスト開始 ===")
        
        # ユーザー作成 (拡張属性付き)
        ext_username = f"ext_user_{int(time.time())}"
        ext_user_data = {
            "schemas": [
                "urn:ietf:params:scim:schemas:core:2.0:User",
                "urn:extic:scim:schemas:1.0:User"
            ],
            "userName": ext_username,
            "password": "ExtP@ss123",
            "displayName": "拡張属性テストユーザー",
            "urn:extic:scim:schemas:1.0:User": {
                "exticGroups": ["基本ユーザーグループ"],
                "extendAttrs": [
                    {
                        "name": "accessLevel",
                        "value": "basic"
                    },
                    {
                        "name": "department",
                        "value": "研究開発部"
                    },
                    {
                        "name": "projectCode",
                        "value": "PRJ-001"
                    }
                ]
            }
        }
        
        ext_user = self.create_user(ext_user_data)
        if not ext_user:
            self.log("拡張属性テストユーザー作成失敗")
            return False
        
        ext_user_id = ext_user["id"]
        
        # 拡張属性の確認
        retrieved_user = self.get_user_by_id(ext_user_id)
        if retrieved_user:
            extic_data = retrieved_user.get("urn:extic:scim:schemas:1.0:User", {})
            ext_attrs = extic_data.get("extendAttrs", [])
            
            self.log("拡張属性一覧:")
            for attr in ext_attrs:
                self.log(f"  {attr.get('name')}: {attr.get('value')}")
            
            # 拡張属性の更新
            self.log("拡張属性の更新テスト")
            update_data = {
                "schemas": [
                    "urn:ietf:params:scim:schemas:core:2.0:User",
                    "urn:extic:scim:schemas:1.0:User"
                ],
                "userName": ext_username,
                "displayName": "拡張属性テストユーザー",
                "urn:extic:scim:schemas:1.0:User": {
                    "exticGroups": ["基本ユーザーグループ"],
                    "extendAttrs": [
                        {
                            "name": "accessLevel",
                            "value": "basic"
                        },
                        {
                            "name": "department",
                            "value": "マーケティング部"  # 変更
                        },
                        {
                            "name": "projectCode",
                            "value": "PRJ-002"  # 変更
                        },
                        {
                            "name": "location",
                            "value": "東京オフィス"  # 追加
                        }
                    ]
                }
            }
            
            updated_user = self.update_user(ext_user_id, update_data)
            if updated_user:
                extic_data = updated_user.get("urn:extic:scim:schemas:1.0:User", {})
                updated_attrs = extic_data.get("extendAttrs", [])
                
                self.log("更新後の拡張属性一覧:")
                for attr in updated_attrs:
                    self.log(f"  {attr.get('name')}: {attr.get('value')}")
            else:
                self.log("拡張属性更新失敗")
            
            # クリーンアップ
            self.delete_user(ext_user_id)
            self.log("拡張属性テストユーザー削除完了")
            return True
        else:
            self.log("拡張属性テストユーザー取得失敗")
            return False

    def test_performance(self, iterations=10):
        """パフォーマンステスト"""
        self.log(f"=== パフォーマンステスト ({iterations}回繰り返し) ===")
        start_time = time.time()
        
        for i in range(iterations):
            self.log(f"イテレーション {i+1}/{iterations}")
            # ユーザー一覧取得の時間計測
            user_start = time.time()
            self.get_users(count=20)
            user_end = time.time()
            self.log(f"ユーザー一覧取得時間: {user_end - user_start:.3f}秒")
        
        total_time = time.time() - start_time
        self.log(f"合計実行時間: {total_time:.3f}秒")
        self.log(f"平均リクエスト時間: {total_time/iterations:.3f}秒")
        return True

    def test_filtered_search(self):
        """フィルター検索テスト"""
        self.log("=== フィルター検索テスト ===")
        
        # 拡張属性での検索
        try:
            filter_query = "(extendAttrs.name eq \"accessLevel\") and (extendAttrs.value eq \"advanced\")"
            response = self.session.get(
                f"{self.base_url}/Users?filter={requests.utils.quote(filter_query)}"
            )
            response.raise_for_status()
            result = response.json()
            
            self.log(f"高度アクセスレベルユーザー数: {result.get('totalResults', 0)}")
            return True
        except Exception as e:
            self.log(f"フィルター検索エラー: {str(e)}")
            return False

    def test_bulk_operations(self, user_count=3):
        """一括操作テスト"""
        self.log(f"=== 一括操作テスト ({user_count}ユーザー) ===")
        
        test_users = []
        
        # 複数ユーザー作成
        for i in range(user_count):
            username = f"bulk_user_{int(time.time())}_{i}"
            user_data = {
                "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User", "urn:extic:scim:schemas:1.0:User"],
                "userName": username,
                "password": f"BulkP@ss{i}",
                "displayName": f"一括テストユーザー{i}",
                "urn:extic:scim:schemas:1.0:User": {
                    "exticGroups": ["基本ユーザーグループ"]
                }
            }
            
            user = self.create_user(user_data)
            if user:
                test_users.append(user)
        
        self.log(f"{len(test_users)}/{user_count}ユーザーの作成に成功")
        
        # 一括削除
        success_count = 0
        for user in test_users:
            if self.delete_user(user["id"]):
                success_count += 1
        
        self.log(f"{success_count}/{len(test_users)}ユーザーの削除に成功")
        return success_count == len(test_users)

    def run_all_tests(self):
        """すべてのテストを実行"""
        self.log("==== Extic SCIM API テスト開始 ====")
        
        # 1. 接続テスト
        if not self.test_connection():
            self.log("接続テスト失敗 - テスト中止")
            return False
        
        # 2. ユーザーCRUDテスト
        if not self.test_user_create_update_delete():
            self.log("ユーザーCRUDテスト失敗")
        
        # 3. グループベースアクセス制御テスト
        if not self.test_group_based_access():
            self.log("グループベースアクセス制御テスト失敗")
        
        # 4. 拡張属性テスト
        if not self.test_extended_attributes():
            self.log("拡張属性テスト失敗")
        
        # 5. パフォーマンステスト
        if not self.test_performance(iterations=5):
            self.log("パフォーマンステスト失敗")
            
        # 6. フィルター検索テスト
        if not self.test_filtered_search():
            self.log("フィルター検索テスト失敗")
            
        # 7. 一括操作テスト
        if not self.test_bulk_operations(user_count=2):
            self.log("一括操作テスト失敗")
        
        self.log("==== Extic SCIM API テスト完了 ====")
        return True
```

## 4. 実行手順

### 4.1 必要な環境

- Python 3.6以上
- 必要なライブラリ: requests

### 4.2 環境準備

```bash
# 仮想環境の作成とアクティブ化（推奨）
python -m venv extic-test-env
source extic-test-env/bin/activate  # Windowsの場合: extic-test-env\Scripts\activate

# 必要なライブラリのインストール
pip install requests
```

### 4.3 実行方法

```bash
# Basic認証の場合
python extic_tester.py https://example.ex-tic.com/idm/scimApi/1.0 basic admin password

# Bearer認証の場合
python extic_tester.py https://example.ex-tic.com/idm/scimApi/1.0 bearer your_token
```

### 4.4 個別テストの実行

特定のテストのみを実行する場合は、以下のようにスクリプトを修正して実行できます:

```python
if __name__ == "__main__":
    # コマンドライン引数からパラメータを取得
    # （省略）...
    
    # 全テスト実行の代わりに特定のテストのみ実行
    tester = ExticSCIMTester(base_url, auth_type="basic", username=username, password=password)
    
    # 基本接続テスト
    tester.test_connection()
    
    # 特定のテストのみ実行
    tester.test_group_based_access()
    tester.test_extended_attributes()
```

## 5. テスト結果の解釈

### 5.1 ログファイル分析

テスト実行後に生成されるログファイル (`extic_test_YYYYMMDD_HHMMSS.log`) には、以下の情報が含まれています:

- 接続ステータス
- 作成/更新/削除されたユーザーの詳細
- 拡張属性の値とその変更
- グループ情報とその変化
- エラーメッセージ（存在する場合）
- パフォーマンス測定結果

ログファイルを詳細に分析することで、以下のような情報を確認できます:

1. **接続性と認証**: Exticとの接続が正常に確立されたか
2. **CRUD操作**: ユーザー操作が期待通りに機能するか
3. **属性同期**: 拡張属性やグループ情報が正しく同期されるか
4. **パフォーマンス**: 応答時間が許容範囲内か
5. **エラー処理**: エラー時に適切なメッセージが返されるか

### 5.2 成功基準

テストは以下の基準を満たすと「成功」と見なされます:

1. **接続テスト**: 200 OKレスポンスの取得
2. **ユーザーCRUDテスト**: 作成/参照/更新/削除の全操作の成功
3. **グループテスト**: グループの変更が即時反映されること
4. **拡張属性テスト**: 拡張属性の追加と更新が正常に機能すること
5. **高度なテスト**: フィルター検索やパフォーマンステストが成功すること

## 6. トラブルシューティング

### 6.1 一般的な問題

| エラー | 考えられる原因 | 対処方法 |
|-------|--------------|---------|
| 接続エラー | ネットワーク問題 | ネットワーク設定を確認 |
| 401 Unauthorized | 認証情報の不備 | ユーザー名/パスワード/トークンを確認 |
| 403 Forbidden | 権限不足 | 必要な権限が付与されているか確認 |
| 404 Not Found | エンドポイント不正 | URLが正しいか確認 |
| 400 Bad Request | リクエスト形式不正 | JSON形式やスキーマを確認 |
| 500 Server Error | サーバー側のエラー | Exticログを確認 |

### 6.2 Extic側の確認

問題が発生した場合、以下のExtic側の確認を行ってください:

1. **SCIMプロトコル設定**: ExticのSCIM API設定が有効か
2. **認証設定**: Basic認証またはBearer認証が正しく設定されているか
3. **アクセス権限**: テスト用アカウントに必要な権限が付与されているか
4. **ログ確認**: Extic側のログで詳細なエラー情報を確認

### 6.3 プログラム修正

プログラムの問題が疑われる場合、以下の修正を検討してください:

1. **デバッグ出力の強化**: 詳細なログ出力を追加
2. **タイムアウト設定**: リクエストのタイムアウト値を調整
3. **リトライロジック**: 一時的な障害に対するリトライ処理の追加
4. **エラーハンドリング**: より詳細なエラーハンドリングの実装

## 7. 結論と次のステップ

### 7.1 確認結果の活用

このテストプログラムを使用したExticのSCIM連携確認により、「多段階アクセス制御モデルゲートウェイ」のPoCに必要な前提条件が整っていることを確認できます。

特に以下の点が重要です:

1. SCIM APIの基本機能が正常に動作すること
2. ユーザーとグループの連携が期待通りに機能すること
3. 拡張属性を用いたアクセスレベル制御が可能であること
4. 複数のグループを用いた階層的な権限設定が機能すること

### 7.2 次のステップ

確認が完了したら、以下の順序でPoCの開発を進めることをお勧めします:

1. **SCIM連携基盤の実装**: ExticからSCIMデータを受け取る基盤の構築
2. **ユーザーモデルの実装**: 3段階のアクセスレベルを持つユーザーモデルの構築
3. **アクセス制御ロジックの実装**: グループと拡張属性に基づく権限判定の実装
4. **プロキシゲートウェイの実装**: AIモデルリクエストの中継と権限チェック
5. **ユーザーインターフェースの実装**: 管理画面と利用画面の構築

### 7.3 関連文書

- Extic SCIM API マニュアル
- 多段階アクセス制御モデルゲートウェイ PoC設計書

## 付録A: テストシナリオ例

### シナリオ1: 基本ユーザーアクセス

1. 基本ユーザーを作成
2. 基本グループに所属していることを確認
3. accessLevel属性が"basic"に設定されていることを確認

### シナリオ2: 権限昇格

1. 基本ユーザーを研究グループに変更
2. accessLevel属性が"advanced"に自動更新されるか確認
3. 研究グループから管理者グループへ昇格
4. role属性が"管理者"に設定されるか確認

### シナリオ3: 拡張属性操作

1. 複数の拡張属性を持つユーザー作成
2. 拡張属性の更新
3. 新規拡張属性の追加
4. すべての拡張属性が正しく表示されることを確認

### シナリオ4: 高度なクエリ

1. accessLevel属性を基にユーザーを検索
2. 特定のグループに所属するユーザーを検索
3. 複数条件でのフィルター検索
