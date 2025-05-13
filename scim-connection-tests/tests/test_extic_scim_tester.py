#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pytest
from unittest.mock import patch, MagicMock
import json
import sys
import os

# srcディレクトリをパスに追加
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src"))
from extic_tester import ExticSCIMTester

class TestExticSCIMTester:
    """ExticSCIMTesterクラスのテストケース"""
    
    @pytest.fixture
    def mock_session(self):
        """requestsのSessionをモックするためのフィクスチャ"""
        with patch('requests.Session') as mock_session:
            session_instance = MagicMock()
            mock_session.return_value = session_instance
            yield session_instance
    
    @pytest.fixture
    def tester(self, mock_session):
        """テスト用のExticSCIMTesterインスタンスを生成"""
        # mockの設定を追加
        mock_session.headers = {}
        mock_session.auth = None
        
        return ExticSCIMTester(
            base_url="https://test.ex-tic.com/idm/scimApi/1.0",
            auth_type="basic",
            username="testuser",
            password="testpass"
        )
    
    def test_init_basic_auth(self, mock_session):
        """Basic認証での初期化テスト"""
        tester = ExticSCIMTester(
            base_url="https://test.ex-tic.com/idm/scimApi/1.0",
            auth_type="basic",
            username="testuser",
            password="testpass"
        )
        assert tester.auth_type == "basic"
        assert tester.username == "testuser"
        assert tester.password == "testpass"
        assert mock_session.auth == ("testuser", "testpass")
    
    def test_init_bearer_auth(self, mock_session):
        """Bearer認証での初期化テスト"""
        tester = ExticSCIMTester(
            base_url="https://test.ex-tic.com/idm/scimApi/1.0",
            auth_type="bearer",
            token="test_token"
        )
        assert tester.auth_type == "bearer"
        assert tester.token == "test_token"
        mock_session.headers.update.assert_called_with({"Authorization": "Bearer test_token"})
    
    def test_test_connection(self, tester, mock_session):
        """接続テストのテスト"""
        # モックレスポンスの設定
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"totalResults": 0, "Resources": []}
        mock_session.get.return_value = mock_response
        
        # テスト実行
        result = tester.test_connection()
        
        # 検証
        assert result is True
        mock_session.get.assert_called_with(
            "https://test.ex-tic.com/idm/scimApi/1.0/Users?startIndex=1&count=0"
        )
    
    def test_get_users(self, tester, mock_session):
        """ユーザー一覧取得のテスト"""
        # モックレスポンスの設定
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "totalResults": 2,
            "Resources": [
                {"id": "1", "userName": "user1"},
                {"id": "2", "userName": "user2"}
            ]
        }
        mock_session.get.return_value = mock_response
        
        # テスト実行
        result = tester.get_users(start_index=1, count=10)
        
        # 検証
        assert result["totalResults"] == 2
        assert len(result["Resources"]) == 2
        mock_session.get.assert_called_with(
            "https://test.ex-tic.com/idm/scimApi/1.0/Users?startIndex=1&count=10"
        )
    
    def test_get_user_by_username(self, tester, mock_session):
        """ユーザー名によるユーザー検索のテスト"""
        # モックレスポンスの設定
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "totalResults": 1,
            "Resources": [
                {"id": "1", "userName": "testuser1"}
            ]
        }
        mock_session.get.return_value = mock_response
        
        # テスト実行
        result = tester.get_user_by_username("testuser1")
        
        # 検証
        assert result["id"] == "1"
        assert result["userName"] == "testuser1"
        mock_session.get.assert_called_with(
            "https://test.ex-tic.com/idm/scimApi/1.0/Users?filter=userName eq \"testuser1\""
        )
    
    def test_create_user(self, tester, mock_session):
        """ユーザー作成のテスト"""
        # モックレスポンスの設定
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.json.return_value = {
            "id": "new_user_id",
            "userName": "newuser",
            "displayName": "新規ユーザー"
        }
        mock_session.post.return_value = mock_response
        
        # テスト用ユーザーデータ
        user_data = {
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
            "userName": "newuser",
            "displayName": "新規ユーザー"
        }
        
        # テスト実行
        result = tester.create_user(user_data)
        
        # 検証
        assert result["id"] == "new_user_id"
        assert result["userName"] == "newuser"
        mock_session.post.assert_called_with(
            "https://test.ex-tic.com/idm/scimApi/1.0/Users",
            json=user_data
        )
    
    def test_update_user(self, tester, mock_session):
        """ユーザー更新のテスト"""
        # モックレスポンスの設定
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "user_id",
            "userName": "updateuser",
            "displayName": "更新ユーザー"
        }
        mock_session.put.return_value = mock_response
        
        # テスト用ユーザーデータ
        user_data = {
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
            "userName": "updateuser",
            "displayName": "更新ユーザー"
        }
        
        # テスト実行
        result = tester.update_user("user_id", user_data)
        
        # 検証
        assert result["id"] == "user_id"
        assert result["displayName"] == "更新ユーザー"
        mock_session.put.assert_called_with(
            "https://test.ex-tic.com/idm/scimApi/1.0/Users/user_id",
            json=user_data
        )
    
    def test_delete_user(self, tester, mock_session):
        """ユーザー削除のテスト"""
        # モックレスポンスの設定
        mock_response = MagicMock()
        mock_response.status_code = 204
        mock_session.delete.return_value = mock_response
        
        # テスト実行
        result = tester.delete_user("user_id")
        
        # 検証
        assert result is True
        mock_session.delete.assert_called_with(
            "https://test.ex-tic.com/idm/scimApi/1.0/Users/user_id"
        )
