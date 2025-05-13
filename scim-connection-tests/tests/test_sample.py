import pytest

@pytest.mark.smoke
def test_sample():
    """サンプルテスト - 基本的な検証"""
    assert 1 + 1 == 2

@pytest.mark.connection
def test_extic_url_format():
    """ExticのURLフォーマットテスト"""
    # SCIM APIのベースURLの形式確認
    base_url = "https://example.ex-tic.com/idm/scimApi/1.0"
    assert base_url.startswith("https://")
    assert "/scimApi/" in base_url
    
    # エンドポイントURL生成テスト
    users_url = f"{base_url}/Users"
    assert users_url.endswith("/Users")
    
    # クエリパラメータテスト
    query_url = f"{users_url}?startIndex=1&count=10"
    assert "startIndex=1" in query_url
    assert "count=10" in query_url