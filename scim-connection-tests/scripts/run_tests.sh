#!/bin/bash
# SCIM接続テスト実行スクリプト

# スクリプトのあるディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# プロジェクトルートに移動
cd "$PROJECT_ROOT"

# コマンドライン引数をチェック
if [ "$#" -lt 3 ]; then
    echo "使用方法:"
    echo "  Basic認証: $0 <base_url> basic <username> <password>"
    echo "  Bearer認証: $0 <base_url> bearer <token>"
    exit 1
fi

# Pythonスクリプトを実行
python run_tests.py "$@"
