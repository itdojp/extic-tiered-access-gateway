#!/usr/bin/env python
# -*- coding: utf-8 -*-

import requests
import json
import time
import sys
import os
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
        
        # ログファイルの設定 - logs ディレクトリに保存
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
        os.makedirs(log_dir, exist_ok=True)
        self.log_file = os.path.join(log_dir, f"extic_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
        
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


if __name__ == "__main__":
    # コマンドライン引数の解析
    if len(sys.argv) < 3:
        print("使用方法:")
        print("  Basic認証: python extic_tester.py <base_url> basic <username> <password>")
        print("  Bearer認証: python extic_tester.py <base_url> bearer <token>")
        sys.exit(1)
        
    base_url = sys.argv[1]
    auth_type = sys.argv[2].lower()
    
    if auth_type == "basic" and len(sys.argv) >= 5:
        username = sys.argv[3]
        password = sys.argv[4]
        tester = ExticSCIMTester(base_url, auth_type="basic", username=username, password=password)
    elif auth_type == "bearer" and len(sys.argv) >= 4:
        token = sys.argv[3]
        tester = ExticSCIMTester(base_url, auth_type="bearer", token=token)
    else:
        print("引数が不正です。正しい認証情報を指定してください。")
        sys.exit(1)
    
    # 全テストの実行
    success = tester.run_all_tests()
    
    if success:
        print("\nテスト完了: すべてのテストが正常に実行されました。")
        sys.exit(0)
    else:
        print("\nテスト失敗: 一部のテストが失敗しました。詳細はログファイルを確認してください。")
        sys.exit(1)
