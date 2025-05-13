import pytest
import os
import sys

# プロジェクトルートとsrcディレクトリをパスに追加
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))

@pytest.fixture(scope="session", autouse=True)
def setup_teardown():
    # Setup code here
    yield
    # Teardown code here

@pytest.fixture(scope="session")
def test_base_url():
    """テスト用のベースURLを返す"""
    return "https://test.ex-tic.com/idm/scimApi/1.0"

@pytest.fixture(scope="session")
def test_username():
    """テスト用のユーザー名を返す"""
    return "testuser"

@pytest.fixture(scope="session")
def test_password():
    """テスト用のパスワードを返す"""
    return "testpass"

@pytest.fixture(scope="session")
def test_token():
    """テスト用のトークンを返す"""
    return "test_token"