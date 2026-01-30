# NEO - ツイート代行ボット

ヒカマーのツイート代行bot・NEO。Next.js・React・TypeScript・Tailwind CSSで構築されたTwitter/X自動投稿システム。

## 機能

- ツイート文の入力（最大280文字）
- 画像・動画のアップロード（最大4枚）
- GIFのアップロード（最大1枚）
- 引用ツイート対応
- リツイート対応
- 15分間隔でのスケジューリング
- 予約済みツイートの管理・削除

## 技術スタック

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **Twitter API**: twitter-api-v2
- **Icons**: Lucide React

## セットアップ

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
TWITTER_USERNAME=hikamerdaiko
TWITTER_PASSWORD=ibeharu09212010
TOTP_SECRET=your_totp_secret_here
```

Twitter APIキーの取得方法：
1. [Twitter Developer Portal](https://developer.twitter.com/)でアプリを作成
2. API Key、API Secret、Access Token、Access Secretを取得
3. `.env.local`に設定

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 開発サーバーの起動

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) にアクセスしてください。

## 使用方法

### ツイートの作成と予約

1. ツイート内容を入力
2. 必要に応じてメディアを追加（画像/動画最大4枚、GIF最大1枚）
3. 引用ツイートやリツイートの設定（オプション）
4. 投稿日時を指定（未指定の場合は次の15分間隔に自動設定）
5. 「ツイート予約」ボタンをクリック

### 予約済みツイートの管理

- ナビゲーションの「予約済み」タブで確認
- 削除ボタンで予約をキャンセル

### スケジューラーの実行

ツイートを自動投稿するには、スケジューラーを実行する必要があります：

```bash
node scripts/scheduler.js
```

またはcronジョブとして設定（15分ごとに実行）：

```
*/15 * * * * cd /path/to/neo-twitter-bot && node scripts/scheduler.js
```

## プロジェクト構造

```
neo-twitter-bot/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── schedule-tweet/     # ツイート予約API
│   │   │   ├── post-tweet/         # ツイート投稿API
│   │   │   └── scheduler/          # スケジューラーAPI
│   │   ├── page.tsx                # メインページ（ツイート作成）
│   │   ├── scheduled/page.tsx     # 予約済みツイート一覧
│   │   └── layout.tsx              # レイアウト
│   ├── components/
│   │   └── Navigation.tsx         # ナビゲーションコンポーネント
│   └── lib/
│       └── twitter-client.ts       # Twitter APIクライアント
├── scripts/
│   └── scheduler.js               # スケジューラースクリプト
└── .env.local                     # 環境変数
```

## APIドキュメント

### POST /api/schedule-tweet

ツイートを予約する。

**リクエストボディ**:
- `text`: ツイート内容
- `scheduledTime`: 投稿日時（ISO 8601形式）
- `isRetweet`: リツイートかどうか
- `retweetId`: リツイートするツイートID
- `quoteTweetId`: 引用ツイートID
- `media_*`: メディアファイル

### POST /api/post-tweet

予約されたツイートを投稿する。

**リクエストボディ**:
- `tweetId`: ツイートID

### DELETE /api/schedule-tweet/[id]

予約されたツイートを削除する。

## 注意事項

- Twitter APIのレート制限に注意してください
- TOTPシークレットは安全な場所に保管してください
- 本番環境では`.env.local`を`.env.production`に置き換えてください
- メディアファイルはbase64エンコードされて保存されます

## ライセンス

MIT
