# English Phrase Trainer

## アプリ概要

英語フレーズを登録・管理し、クイズ形式で学習するWebアプリ。

- フレーズ一覧・追加・編集・削除
- 復習クイズ（意味→フレーズ入力、穴埋め形式）
- 正誤記録・正答率集計
- 苦手フレーズ管理

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
- **認証**: なし（個人用途）

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
| difficulty | 'easy'｜'normal'｜'hard' | 難易度 |
| memo | string | メモ |
| correctCount | number | 正解数 |
| wrongCount | number | 不正解数 |
| answeredCount | number | 回答回数 |
| accuracy | number | 正答率（0〜1） |
| lastReviewedAt | Timestamp｜null | 最終復習日時 |
| createdAt | Timestamp | 作成日時 |
| updatedAt | Timestamp | 更新日時 |

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
    api/phrases/     GET/POST/PUT/DELETE
    api/review/      GET（クイズ対象フレーズ取得）
    api/learning-records/  POST（正誤記録）
    api/stats/       GET（統計情報）
    phrases/         フレーズ管理画面
    review/          復習クイズ設定・実行
    weak/            苦手フレーズ一覧
    page.tsx         トップページ
  components/        再利用UIコンポーネント
  lib/
    firebase-admin.ts
    quiz.ts
    firestore/
  types/             型定義
```

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

## Cloud Runデプロイ手順

### 前提条件

- Google Cloud プロジェクト作成済み
- `gcloud` CLI インストール済み・認証済み
- Firestore が Native Mode で有効化済み
- Cloud Run API、Artifact Registry API 有効化済み

### 1. Artifact Registry リポジトリ作成（初回のみ）

```bash
export PROJECT_ID=your-gcp-project-id
export REGION=asia-northeast1

gcloud artifacts repositories create english-phrase-trainer \
  --repository-format=docker \
  --location=$REGION \
  --description="English Phrase Trainer"
```

### 2. Dockerイメージをビルド＆プッシュ

```bash
gcloud builds submit --tag \
  $REGION-docker.pkg.dev/$PROJECT_ID/english-phrase-trainer/app:latest
```

### 3. Cloud Runにデプロイ

```bash
gcloud run deploy english-phrase-trainer \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/english-phrase-trainer/app:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
  --set-env-vars NEXT_PUBLIC_BASE_URL=https://your-cloudrun-url \
  --min-instances 0 \
  --max-instances 2 \
  --memory 512Mi \
  --cpu 1
```

### 4. Firestore権限設定

Cloud Runのサービスアカウントに Firestore の権限を付与：

```bash
# Cloud Runのサービスアカウントを確認
gcloud run services describe english-phrase-trainer \
  --region $REGION \
  --format='value(spec.template.spec.serviceAccountName)'

# Cloud Datastore User ロールを付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/datastore.user"
```

## 無料枠運用の注意点

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

- Firebase Authentication による認証追加
- 音声読み上げ（Web Speech API）
- CSVインポート/エクスポート
- 学習進捗グラフ（Chart.js等）
- PWA対応（オフライン学習）
- 複数ユーザー対応（Firestore セキュリティルール）

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

エミュレーター起動後、以下を確認:

```bash
# フレーズ一覧API
curl http://localhost:3000/api/phrases

# 統計API
curl http://localhost:3000/api/stats
```

## Docker単体での実行

```bash
docker build -t english-phrase-trainer .
docker run -p 3000:3000 \
  -e GOOGLE_CLOUD_PROJECT=your-gcp-project-id \
  -e FIRESTORE_EMULATOR_HOST=host.docker.internal:8080 \
  english-phrase-trainer
```

## Cloud Runへのデプロイ

```bash
# gcloud認証
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# イメージをビルドしてArtifact Registryへプッシュ
gcloud builds submit --tag asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/english-phrase-trainer/app

# Cloud Runへデプロイ
gcloud run deploy english-phrase-trainer \
  --image asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/english-phrase-trainer/app \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID \
  --memory 512Mi
```
