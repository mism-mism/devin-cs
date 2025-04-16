# devin-CS プロトタイプ開発ガイド

このドキュメントは、**devin-CS**プロトタイプ構築のためのセットアップおよびデプロイ方法をまとめています。

## 📌 システム概要

**devin-CS** は、LINE経由で受信したユーザーの問い合わせ内容をAIで分析し、Slackを通じて担当者に対応方法を提案・確認し、LINEで自動返信を行うシステムです。

## 🚀 ワークフロー

```
LINEユーザー
　　↓
LINE MCPサーバー（line-bot-mcp-server）
　　↓
devin-CS（AWS Lambda上）
　│↑　└─ 顧客・受注データ（モックMCPサーバー）
　↓
Slack（担当者が対応選択）
　↓
devin-CS（AIでLINE返信生成）
　↓
LINEユーザーへ返信
```

---

## 🛠 推奨技術スタック

| 項目                   | 使用技術                                                     |
|------------------------|--------------------------------------------------------------|
| 実行環境               | AWS Lambda                                                   |
| 開発環境               | Serverless Framework                                        |
| プログラム言語         | TypeScript + Node.js                                        |
| LINE連携               | LINE Messaging API + [line-bot-mcp-server](https://github.com/line/line-bot-mcp-server) |
| Slack連携（MCP対応）   | Bolt for JavaScript（Slack SDK） + MCPクライアント実装       |
| AI連携                 | OpenAI API (GPT-4o)                                          |
| 顧客データ連携（MCP）  | MCPプロトコル準拠REST API（初回はモック）                   |
| その他AWSサービス      | API Gateway, CloudWatch, IAM                                |

---

## ✅ プロトタイプ作成手順

### ① LINE → devin-CS連携

- LINE Messaging APIとline-bot-mcp-serverのWebhookを設定。
- devin-CS側で受信メッセージを解析。

### ② モックMCPサーバーの実装

- 固定のJSONレスポンスを返すREST APIを実装。
- 顧客・受注情報の取得レスポンスを提供。

### ③ AI提案生成（devin-CS）

- OpenAI APIを使い、問い合わせに対する提案を生成。

### ④ Slack通知と担当者選択

- Slack Bolt SDKでMCPクライアントを実装し、担当者が対応を選択できるインターフェースを構築。

### ⑤ LINEへの返信

- 担当者選択をもとにメッセージを生成し、LINE MCPサーバー経由でユーザーに返信。

---

## 📦 開発環境セットアップ

### 前提条件

- Node.js (v18以上)
- npm または yarn
- LINE Developerアカウント
- Slackワークスペース
- OpenAI APIキー
- AWSアカウント

### 環境セットアップ手順

```bash
git clone https://github.com/your-username/devin-cs.git
cd devin-cs
npm install
cp .env.example .env
```

`.env`に環境変数を設定（LINE, Slack, OpenAI APIキーなど）

### 開発サーバーの起動

```bash
npm run dev
```

ローカル環境をngrokで外部公開し、Webhookを設定。

```bash
ngrok http 3000
```

---

## 📌 AWS Lambdaデプロイ

```bash
npm install -g serverless
serverless config credentials --provider aws --key YOUR_ACCESS_KEY --secret YOUR_SECRET_KEY
npm run build
serverless deploy
```

- デプロイ後、API GatewayのURLをLINEおよびSlackに設定。

---

## 📁 プロジェクト構造

```
devin-cs/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── index.ts
│   └── lambda.ts
├── .env.example
├── package.json
├── serverless.yml
├── tsconfig.json
└── README.md
```

---

## 🎯 実装スコープと評価基準

| 評価対象                | 評価基準                                           |
|-------------------------|----------------------------------------------------|
| 顧客特定フロー          | LINE→モック→Slackまでのフローが正確か             |
| AI提案の精度            | 提案内容の妥当性                                   |
| Slack連携の操作性       | UIの操作性（担当者の選択しやすさ）                |
| LINEメッセージの返信    | 適切なメッセージが返信されるか                     |


