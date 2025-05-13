# Extic 多段階アクセス制御モデルゲートウェイ

このリポジトリは、Extic システムにおける多段階アクセス制御モデルゲートウェイの開発プロジェクトを含んでいます。

## プロジェクト構造

```
extic-tiered-access-gateway/
├── scim-connection-tests/   # SCIM連携テスト
│   ├── src/                 # テスト用ソースコード
│   ├── tests/               # テストケース
│   └── scripts/             # スクリプト
├── docs/                    # ドキュメント
│   └── multitiered-access-control-gateway-poc.md  # PoC設計ドキュメント
└── [今後追加予定] アプリケーション本体
```

## 主要コンポーネント

### 1. SCIM連携テスト

Exticとの SCIM連携機能の動作確認を行うためのテストツールです。詳細は[こちら](scim-connection-tests/README.md)を参照してください。

### 2. 多段階アクセス制御モデルゲートウェイ (予定)

アクセスレベルに応じて特権操作を制御するゲートウェイシステムの実装です。
