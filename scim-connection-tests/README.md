# Extic SCIM 接続テスト

このフォルダには、Exticとの SCIM連携機能の動作確認用のテストツールが含まれています。

## フォルダ構造

```
scim-connection-tests/
├── src/                  # ソースコード
│   └── extic_tester.py   # SCIM連携テストの主要クラス
├── tests/                # テストコード
│   ├── __init__.py
│   ├── test_extic_scim_tester.py  # APIテスト用のテスト
│   └── test_sample.py    # サンプルテスト
├── scripts/              # スクリプト
│   ├── run_tests.bat     # Windowsでのテスト実行スクリプト
│   ├── setup_env.bat     # Windows環境セットアップスクリプト  
│   └── setup_env.sh      # Linux/Mac環境セットアップスクリプト
├── conftest.py           # pytestの設定ファイル
├── pytest.ini            # pytestの初期設定
├── extic-scim-integration-testing-guide.md  # 詳細なテストガイド
└── run_tests.py          # テスト実行用のメインスクリプト
```

## セットアップ方法

### 1. 環境のセットアップ

```bash
# Windows
scripts\setup_env.bat

# Linux/Mac
bash scripts/setup_env.sh
```

### 2. テストの実行

```bash
# すべてのテストを実行
python run_tests.py https://example.ex-tic.com/idm/scimApi/1.0 basic username password

# Pytestによるユニットテスト実行
uv run pytest tests/
```

## 詳細

詳細な使用方法と検証内容については、[extic-scim-integration-testing-guide.md](extic-scim-integration-testing-guide.md)を参照してください。
