@echo off
REM Windows用のテスト実行スクリプト

echo pytestを使用してテストを実行します...

REM カレントディレクトリをプロジェクトルートに変更
cd %~dp0\..\

REM uvで環境内でpytestを実行
uv run pytest %*

IF %ERRORLEVEL% EQU 0 (
    echo テストが成功しました。
) ELSE (
    echo テストが失敗しました。
)
