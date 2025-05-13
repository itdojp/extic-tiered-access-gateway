#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os

# パスの調整
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from src.extic_tester import ExticSCIMTester

def main():
    """Extic SCIM接続テストのメイン関数"""
    # コマンドライン引数の解析
    if len(sys.argv) < 3:
        print("使用方法:")
        print("  Basic認証: python run_tests.py <base_url> basic <username> <password>")
        print("  Bearer認証: python run_tests.py <base_url> bearer <token>")
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

if __name__ == "__main__":
    main()
