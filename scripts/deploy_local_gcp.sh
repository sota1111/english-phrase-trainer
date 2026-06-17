#!/usr/bin/env bash
set -euo pipefail

# ローカル gcloud CLI 認証による Cloud Run デプロイスクリプト
# (english-phrase-trainer - Next.js)
#
# 使い方:
#   cp .env.example .env && vi .env
#   source .env && bash scripts/deploy_local_gcp.sh
#
# 注意: Cloud Run 以外に Firebase Hosting でのデプロイも可能です。
#       Firebase を使う場合は firebase deploy を使用してください。

if [ -f .env ]; then set -a; source .env; set +a; fi

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
REGION="${GCP_REGION:-asia-northeast1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE_NAME:-english-phrase-trainer}"
ARTIFACT_REPO="${ARTIFACT_REGISTRY_REPOSITORY:-english-phrase-registry}"
IMAGE_VAR="${IMAGE_NAME:-english-phrase-trainer}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${IMAGE_VAR}"

# Required for build-time injection (Next.js)
NEXT_PUBLIC_FIREBASE_API_KEY="${NEXT_PUBLIC_FIREBASE_API_KEY:?NEXT_PUBLIC_FIREBASE_API_KEY is required}"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:?NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required}"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="${NEXT_PUBLIC_FIREBASE_PROJECT_ID:?NEXT_PUBLIC_FIREBASE_PROJECT_ID is required}"
NEXT_PUBLIC_FIREBASE_APP_ID="${NEXT_PUBLIC_FIREBASE_APP_ID:?NEXT_PUBLIC_FIREBASE_APP_ID is required}"
NEXT_PUBLIC_BASE_URL="${NEXT_PUBLIC_BASE_URL:-}"

echo "== Cloud Run デプロイ: ${SERVICE_NAME} =="
echo "Project: ${PROJECT_ID} | Region: ${REGION}"
echo "Image: ${IMAGE}"

gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

gcloud artifacts repositories describe "${ARTIFACT_REPO}" \
  --project="${PROJECT_ID}" --location="${REGION}" &>/dev/null || \
gcloud artifacts repositories create "${ARTIFACT_REPO}" \
  --project="${PROJECT_ID}" --location="${REGION}" \
  --repository-format=docker \
  --description="English Phrase Trainer Docker images"

echo "Submitting build to Google Cloud Build..."
gcloud builds submit . \
  --project="${PROJECT_ID}" \
  --config=cloudbuild.yaml \
  --substitutions="_IMAGE=${IMAGE},_NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY},_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN},_NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID},_NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID},_NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}"


# Secret Manager: 初回デプロイ前に以下を実行してください
# echo -n "value" | gcloud secrets create english-trainer-auth-secret --data-file=- --project=$PROJECT_ID
# echo -n "value" | gcloud secrets create english-trainer-allowed-emails --data-file=- --project=$PROJECT_ID
# gcloud projects add-iam-policy-binding $PROJECT_ID \
#   --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
#   --role="roles/secretmanager.secretAccessor"

gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE}:latest" \
  --set-secrets="AUTH_SECRET=english-trainer-auth-secret:latest,ALLOWED_USER_EMAILS=english-trainer-allowed-emails:latest" \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=1 \
  --quiet

URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region="${REGION}" --project="${PROJECT_ID}" \
  --format='value(status.url)')

echo ""
echo "== デプロイ完了 =="
echo "Service URL: ${URL}"
