# English Phrase Trainer

## アプリ概要

英語フレーズを登録・管理し、復習・クイズ・英作文で学習するWebアプリ。

- フレーズ一覧・追加・編集・削除
- AI 一括登録（不定形テキストを Gemini で複数フレーズに分解）・日本語⇄英文の自動生成
- AI 拡充（類義語・コロケーション生成）/ AI 英作文フィードバック
- 間隔反復（SM-2）に基づく復習スケジューリング（出題方向トグル・片手モード）。復習画面に選択 / 穴埋めのクイズ形式を内包（独立した quiz 画面はありません）
- 正誤記録・学習カレンダー・分析ダッシュボード（`/analytics`）
- Firebase Authentication による個人利用向け認証

## GCP最適化方針

- Cloud Run + Firestore のサーバーレス構成で無料枠内での運用を最優先
- Cloud Run: 最小インスタンス数 0、リクエスト時のみ起動
- Firestore: Native Mode、無料枠（1GB + 1日5万読取/2万書込）
- Container Registry: Artifact Registry（無料枠あり）
- ビルド: Cloud Build（無料枠: 120分/日）

## 使用技術・アーキテクチャ

- **フレームワーク**: Next.js 16 (App Router, TypeScript)
- **データベース**: Firestore (Firebase Admin SDK)
- **ホスティング**: Cloud Run
- **認証**: Firebase Authentication（メール/パスワード）+ HTTP-only Cookie セッション（個人利用向け）

```
[ブラウザ] → [Cloud Run (Next.js)] → [Firestore]
```

## Firestoreデータ設計

### コレクション: `phrases`

| フィールド | 型 | 説明 |
|---|---|---|
| phrase | string | 英語フレーズ |
| meaningJa | string | 日本語の意味 |
| example | string | 例文（英語） |
| exampleJa | string | 例文（日本語） |
| category | string | カテゴリ |
| importance | 'high'｜'normal'｜'low' | 重要度（間隔反復の出題対象を絞り込む。未設定で書き込まれたデータは `'normal'` として読み出す） |
| memo | string | メモ |
| correctCount | number | 正解数 |
| wrongCount | number | 不正解数 |
| answeredCount | number | 回答回数 |
| accuracy | number | 正答率（0〜1） |
| lastReviewedAt | Timestamp｜null | 最終復習日時 |
| createdAt | Timestamp | 作成日時 |
| updatedAt | Timestamp | 更新日時 |

#### 初期フレーズの投入 (seed)

業務でよく使う語彙・定型表現・優先暗記フレーズを初期データとして `src/data/initialPhrases.ts`
に定義しています（`category` は `日常` / `ビジネス` / `技術` のトピック区分、優先フレーズは `importance: 'high'`）。

冪等な seed スクリプトで `phrases` コレクションへ投入できます。`phrase` テキストが既に存在する
エントリはスキップされるため、再実行しても重複は作られません。

```bash
# Application Default Credentials（対象プロジェクトへの書き込み権限）が必要
GOOGLE_CLOUD_PROJECT=<your-gcp-project-id> npx tsx scripts/seed-phrases.ts
```

`GOOGLE_CLOUD_PROJECT` が未設定の場合、誤ったプロジェクトへの書き込みを避けるためスクリプトは
書き込みを行わず exit 1 で終了します。

### コレクション: `learningRecords`

| フィールド | 型 | 説明 |
|---|---|---|
| phraseId | string | 対象フレーズID |
| quizType | 'meaning_to_phrase'｜'blank' | クイズ形式 |
| isCorrect | boolean | 正誤 |
| answer | string | ユーザーの回答 |
| correctAnswer | string | 正解 |
| answeredAt | Timestamp | 回答日時 |

**注意**: フレーズを削除しても、関連する learningRecords は自動削除されません。履歴データとして残ります。

## ディレクトリ構成

```
src/
  app/
    api/
      auth/login/                POST（ログイン）
      auth/logout/               POST（ログアウト）
      phrases/generate/          POST（Gemini で日本語⇄英文・例文を自動生成）
      phrases/parse/             POST（不定形テキストを Gemini で複数フレーズに分解し一括登録候補を生成）
      phrases/enrich/            POST（類義語・コロケーションを Gemini で生成）
      phrases/writing-feedback/  POST（英作文への AI フィードバック）
    login/               ログイン画面
    phrases/             フレーズ管理画面
    spaced-review/       間隔反復（SM-2）復習画面
      one-handed/        片手モード復習画面
    writing/             AI 英作文フィードバック画面
    analytics/           分析ダッシュボード画面
    calendar/            学習カレンダー画面
    page.tsx             ダッシュボード（トップページ）
  components/            UIコンポーネント（calendar / phrases / reviews / ui）
  lib/
    ai/                  Gemini クライアント（gemini.ts。Vertex AI / API-key 両対応）
    actions/             Server Actions（phraseActions / reviewActions / statsActions）
    firestore/           Firestore アクセス（phrases / learningRecords / dailyStats / reviewSchedules）
    firebase-admin.ts
    sm2.ts               SM-2 間隔反復アルゴリズム
    importance.ts        重要度の分類・既定値
  types/                 型定義（phrase / reviewSchedule など）
  middleware.ts          認証ミドルウェア（全ルート保護）
```

> フレーズ CRUD・ダッシュボード・カレンダー・統計のデータ取得/更新は **Server Actions（`src/lib/actions/*`）とサーバーコンポーネント** 経由で行います。汎用の REST API エンドポイント（`/api/phrases` 等）は提供していません。認証（`/api/auth/*`）と AI 機能（`/api/phrases/generate`・`/api/phrases/parse`・`/api/phrases/enrich`・`/api/phrases/writing-feedback`）のみ Route Handler として実装しています。

> **AI 一括登録**: フレーズ管理画面の「AIで一括登録」から、英単語・熟語・例文・日本語の意味などが混在した不定形テキストを貼り付けると、Gemini が英語/日本語/重要度/カテゴリを自動判別して複数フレーズに分解します。内容を確認・編集してまとめて登録できます。

## ローカル起動手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/sota1111/english-phrase-trainer.git
cd english-phrase-trainer
npm install
```

### 2. 環境変数を設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集：

```
# Firebase クライアント設定（Firebase Console > プロジェクト設定 > アプリ から取得）
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id

# 許可するメールアドレス（カンマ区切り）
ALLOWED_USER_EMAILS=your-email@example.com

# セッションcookie署名用シークレット（32文字以上推奨）
AUTH_SECRET=your-random-secret-key-32chars-or-more

GOOGLE_CLOUD_PROJECT=your-gcp-project-id
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Firestoreへの接続

**方法A: Firebase Emulator（推奨）**

→ 下記の「Firebase Emulator手順」を参照。

**方法B: 本番Firestore（Application Default Credentials）**

```bash
gcloud auth application-default login
```

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス可能。

## 認証設定

このアプリはアプリ所有者本人のみが利用できる個人利用向け認証を実装しています。

### 認証方式

- Firebase Authentication（メール/パスワードログイン）
- ログイン後、Firebase ID トークンをサーバーサイドで検証し、HTTP-only Cookie にセッションを保存
- 許可されたメールアドレスのみアプリを利用できる（ALLOWED_USER_EMAILS）

### Firebase Authentication セットアップ

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを開く
2. 「Authentication」→「始める」をクリック
3. 「Sign-in method」タブで「メール/パスワード」を有効化
4. 「Users」タブでログインに使用するメールアドレスとパスワードを追加
5. 「プロジェクト設定」→「マイアプリ」でウェブアプリを追加し、設定値を取得

### 許可メールアドレスの設定

`ALLOWED_USER_EMAILS` 環境変数にカンマ区切りで許可するメールアドレスを設定します：

```
ALLOWED_USER_EMAILS=your-email@example.com,another@example.com
```

- 空の場合は Firebase Authentication で認証されたすべてのユーザーがアクセス可能
- 許可されていないメールアドレスでログインするとアクセス不可メッセージを表示

### 環境変数一覧

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API キー | Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth ドメイン | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase プロジェクト ID | Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | Yes |
| `FIREBASE_WEB_API_KEY` | サーバサイドREST認証用 Web API キー（優先）。未設定時は `FIREBASE_API_KEY` にフォールバック | Yes |
| `FIREBASE_API_KEY` | `FIREBASE_WEB_API_KEY` 未設定時のフォールバック | 任意 |
| `ALLOWED_USER_EMAILS` | 許可メールアドレス（カンマ区切り） | 推奨 |
| `AUTH_SECRET` | セッション Cookie 署名用シークレット（32文字以上） | Yes |
| `GOOGLE_CLOUD_PROJECT` | GCP プロジェクト ID（Firestore 接続用） | Yes |
| `GOOGLE_GENAI_USE_VERTEXAI` | truthy で Vertex AI モード（APIキー不要。本番 Cloud Run の SA 認証で利用） | 本番推奨 |
| `GOOGLE_CLOUD_LOCATION` | Vertex AI のロケーション（既定 `us-central1`） | No |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | Gemini API キー（ローカルの API-key モード時のみ） | No |
| `GEMINI_MODEL` | 使用する Gemini モデル（既定 `gemini-2.5-flash`） | No |

### GCP Secret Manager セットアップ（本番環境）

本番環境（Cloud Run）では機密情報を Secret Manager で管理します。初回デプロイ前に以下のコマンドでシークレットを作成してください。

```bash
# セッション署名シークレットの作成
echo -n "your-auth-secret" | gcloud secrets create english-trainer-auth-secret --data-file=- --project=YOUR_PROJECT_ID

# Cloud Run サービスアカウントへの権限付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 対象外機能

以下の機能は実装していません（個人利用のため不要）：

- ユーザー登録（Firebase Console で手動追加）
- 複数ユーザー管理
- パスワード再発行
- 管理者画面


## Firebase Emulator手順

```bash
# Firebase CLI インストール（未インストールの場合）
npm install -g firebase-tools

# Firebase プロジェクト初期化（初回のみ）
firebase init emulators
# → Firestore emulator を選択、ポートはデフォルト(8080)を推奨

# Emulator起動
firebase emulators:start --only firestore

# 別ターミナルで Next.js 起動
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run dev
```

## Docker起動手順

```bash
# イメージビルド
docker build -t english-phrase-trainer .

# コンテナ起動（Application Default Credentials を使用）
docker run -p 8080:8080 \
  -e GOOGLE_CLOUD_PROJECT=your-project-id \
  -e NEXT_PUBLIC_BASE_URL=http://localhost:8080 \
  -v $HOME/.config/gcloud:/root/.config/gcloud:ro \
  english-phrase-trainer

# http://localhost:8080 でアクセス
```

## GitHub Actions による自動デプロイ（Cloud Run）

`.github/workflows/deploy-cloudrun.yml` により、`main` への push（および手動の `workflow_dispatch`）で
GitHub Actions から Cloud Run へ自動デプロイされます。認証は Workload Identity Federation（WIF）を使用し、
JSON キーは使用しません（`permissions: contents: read` / `id-token: write`）。フローは
Docker build → Artifact Registry push → `gcloud run deploy` です。

### 必要な GitHub Secrets

リポジトリの Settings → Secrets and variables → Actions に以下を登録してください。

#### GCP / デプロイ設定

| Secret 名 | 用途 |
| --- | --- |
| `GCP_PROJECT_ID` | デプロイ先 GCP プロジェクト ID |
| `GCP_REGION` | Cloud Run / Artifact Registry のリージョン（例: `asia-northeast1`） |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity Provider のリソース名 |
| `GCP_SERVICE_ACCOUNT` | デプロイに使用するサービスアカウントのメール |
| `ARTIFACT_REGISTRY_REPOSITORY` | Artifact Registry のリポジトリ名 |
| `CLOUD_RUN_SERVICE` | Cloud Run サービス名（= `english-phrase-trainer`） |

#### Firebase 公開設定（ビルド時に Docker イメージへ注入）

| Secret 名 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API キー |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase 認証ドメイン |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase プロジェクト ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase アプリ ID |
| `NEXT_PUBLIC_BASE_URL` | アプリのベース URL |

> Next.js のクライアント側 Firebase 設定はビルド時に埋め込まれるため、これらは `docker build --build-arg`
> で渡しています。未設定の場合、デプロイは成功してもクライアントの Firebase 設定が空になります。
> 実行時のサーバ機密（`AUTH_SECRET` など）は別途 Secret Manager で管理します（下記「Cloud Run デプロイ」参照）。

## Cloud Run デプロイ

このアプリは Cloud Run へのデプロイを自動化するスクリプトを提供しています。Next.js のビルド時に Firebase のパブリック設定を注入し、実行時に Secret Manager から機密情報を取得する構成になっています。

### 1. Secret Manager の設定

初回デプロイ前に、GCP コンソールまたは CLI で以下のシークレットを作成してください。

```bash
# セッション署名シークレット
echo -n "your-auth-secret" | gcloud secrets create english-trainer-auth-secret --data-file=-

# 許可するメールアドレス（カンマ区切り、空の場合は全ユーザー許可）
echo -n "user1@example.com,user2@example.com" | gcloud secrets create english-trainer-allowed-emails --data-file=-
```

### 2. 環境変数の準備

`.env` ファイルを作成し、Firebase の設定値を入力します。これらは Docker イメージのビルド時に埋め込まれます。

```bash
cp .env.example .env
# .env を編集して Firebase 設定値を入力
```

### 3. デプロイの実行

提供されているスクリプトを実行します。

```bash
# .env を読み込んで実行
source .env && bash scripts/deploy_local_gcp.sh
```

このスクリプトは以下のステップを自動で行います：
1. Artifact Registry リポジトリの作成（未作成の場合）
2. Cloud Build による Docker ビルド（Next.js ビルド時環境変数を注入）
3. Cloud Run へのデプロイ（シークレットの紐付け、ポート 8080、未認証アクセス許可）

### 無料枠運用の注意点

### Cloud Run 無料枠（月あたり）

- CPU: 180,000 vCPU秒
- メモリ: 360,000 GB秒
- リクエスト数: 200万回

### Firestore 無料枠（1日あたり）

- 読み取り: 50,000回
- 書き込み: 20,000回
- 削除: 20,000回
- ストレージ: 1GB

### 予算アラート設定

GCPコンソール → 予算とアラート → 予算を作成：

1. Google Cloud Console → 「お支払い」→「予算とアラート」
2. 「予算を作成」をクリック
3. 金額: $1（または希望金額）
4. アラートのしきい値: 50%, 90%, 100%
5. メール通知先を設定

```bash
# CLIでの予算作成例
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="english-phrase-trainer-budget" \
  --budget-amount=1USD \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0
```

## 将来拡張案

- 音声読み上げ（Web Speech API）
- CSVインポート/エクスポート
- 学習進捗グラフ（Chart.js等）
- PWA対応（オフライン学習）

## ローカル開発（Firestore Emulator使用）

本番Firestoreなしでローカル開発が可能です。Firebase Emulatorを使用します。

### 前提条件

- Node.js 18+
- npm
- Java 11+ （Firestoreエミュレーターの実行に必要）
- Firebase CLI: `npm install -g firebase-tools`

### 手順

#### 方法1: Firebase Emulatorを手動で起動する

```bash
# 1. リポジトリのクローン
git clone https://github.com/sota1111/english-phrase-trainer.git
cd english-phrase-trainer

# 2. 依存パッケージのインストール
npm install

# 3. 環境変数の設定
cp .env.local.example .env.local
# .env.local を開いて FIRESTORE_EMULATOR_HOST のコメントを外す

# 4. Firestoreエミュレーターの起動（別ターミナル）
firebase emulators:start --only firestore

# 5. アプリの起動
npm run dev
```

アクセス: http://localhost:3000
エミュレーターUI: http://localhost:4000

#### 方法2: Docker Composeで起動する

```bash
cp .env.local.example .env.local
docker compose up
```

アクセス: http://localhost:3000

### 動作確認

エミュレーター起動後、ブラウザで http://localhost:3000 を開き、以下を確認:

- ダッシュボード（`/`）に統計が表示される
- フレーズ管理（`/phrases`）で一覧・追加・編集・削除ができる
- 間隔反復復習（`/spaced-review`）で出題される

> データ取得/更新は Server Actions・サーバーコンポーネント経由のため、汎用 REST API（`/api/phrases` 等）への `curl` 確認は行えません。

## Docker単体での実行

```bash
docker build -t english-phrase-trainer .
docker run -p 3000:3000 \
  -e GOOGLE_CLOUD_PROJECT=your-gcp-project-id \
  -e FIRESTORE_EMULATOR_HOST=host.docker.internal:8080 \
  english-phrase-trainer
```

### E2E テスト (Playwright)

ブラウザによるエンドツーエンドテストを実行します。

```bash
# ブラウザのインストール (初回のみ)
npx playwright install chromium

# テストの実行
npm run test:e2e
```

認証が必要なテストを実行する場合、以下の環境変数を設定してください。未設定の場合は自動的にスキップされます。
- `E2E_TEST_EMAIL`: テスト用ユーザーのメールアドレス
- `E2E_TEST_PASSWORD`: テスト用ユーザーのパスワード
