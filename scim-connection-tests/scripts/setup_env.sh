#!/bin/bash

# uvが既にインストールされているか確認
if ! command -v uv &> /dev/null; then
    echo "uvがインストールされていません。インストールします..."
    curl -sSf https://install.ultraviolet.dev | sh
fi

# 必要なパッケージをインストール
echo "必要なパッケージをインストール中..."
uv pip install requests pytest pytest-mock

echo "インストール完了"
