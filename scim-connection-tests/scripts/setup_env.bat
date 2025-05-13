@echo off
REM Windows用のセットアップスクリプト

echo uvを使用して必要なパッケージをインストール中...

REM uvがインストールされているか確認
where uv >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo uvがインストールされていません。
    echo https://github.com/astral-sh/uv からインストールしてください。
    exit /b 1
)

REM 必要なパッケージをインストール
uv pip install requests pytest pytest-mock

echo インストール完了
