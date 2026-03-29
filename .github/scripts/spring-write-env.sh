#!/bin/bash
set -euo pipefail

REGION="ap-northeast-2"

DB_URL=$(aws ssm get-parameter --name /woorizip/prod/db/url --query 'Parameter.Value' --output text --region "$REGION")
DB_USERNAME=$(aws ssm get-parameter --name /woorizip/prod/db/username --query 'Parameter.Value' --output text --region "$REGION")
DB_PASSWORD=$(aws ssm get-parameter --name /woorizip/prod/db/password --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
UPLOAD_BUCKET=$(aws ssm get-parameter --name /woorizip/prod/upload-bucket --query 'Parameter.Value' --output text --region "$REGION")
FASTAPI_BASE_URL=$(aws ssm get-parameter --name /woorizip/prod/fastapi/base-url --query 'Parameter.Value' --output text --region "$REGION")
JWT_SECRET=$(aws ssm get-parameter --name /woorizip/prod/jwt/secret --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
KAKAO_REST_API_KEY=$(aws ssm get-parameter --name /woorizip/prod/kakao/rest-api-key --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
KAKAOMAP_REST_API_KEY=$(aws ssm get-parameter --name /woorizip/prod/kakaomap/rest-api-key --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
GOOGLE_CLIENT_ID=$(aws ssm get-parameter --name /woorizip/prod/google/client-id --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
GOOGLE_CLIENT_SECRET=$(aws ssm get-parameter --name /woorizip/prod/google/client-secret --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
KAKAO_CLIENT_SECRET=$(aws ssm get-parameter --name /woorizip/prod/kakao/client-secret --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
KAKAO_GEOCODING_API_URI=$(aws ssm get-parameter --name /woorizip/prod/kakao/geocoding-api-uri --query 'Parameter.Value' --output text --region "$REGION")
TOSS_TEST_SECRET_KEY=$(aws ssm get-parameter --name /woorizip/prod/toss/test-secret-key --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
TOSS_TEST_CLIENT_KEY=$(aws ssm get-parameter --name /woorizip/prod/toss/test-client-key --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
EFORMSIGN_API_KEY=$(aws ssm get-parameter --name /woorizip/prod/eformsign/api-key --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
EFORMSIGN_VERIFY_BEARER=$(aws ssm get-parameter --name /woorizip/prod/eformsign/verify-bearer --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
AI_AGENT_API_KEY=$(aws ssm get-parameter --name /woorizip/prod/ai/agent-api-key --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
AI_SERVER_INTERNAL_API_KEY=$(aws ssm get-parameter --name /woorizip/prod/ai/server-internal-api-key --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
AI_AGENT_REFERENCE_VERSION=$(aws ssm get-parameter --name /woorizip/prod/ai/agent-reference-version --query 'Parameter.Value' --output text --region "$REGION")
AZURE_TTS_API_KEY=$(aws ssm get-parameter --name /woorizip/prod/ai/azure-tts-api-key --with-decryption --query 'Parameter.Value' --output text --region "$REGION")
APP_FRONTEND_BASE_URL=$(aws ssm get-parameter --name /woorizip/prod/frontend/base-url --query 'Parameter.Value' --output text --region "$REGION")
APP_OAUTH2_AUTHORIZED_REDIRECT_URIS=$(aws ssm get-parameter --name /woorizip/prod/frontend/oauth2-redirect-uri --query 'Parameter.Value' --output text --region "$REGION")

cat > /opt/myapp/env/spring.env <<EOT
DB_URL=$DB_URL
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
UPLOAD_BUCKET=$UPLOAD_BUCKET
FASTAPI_BASE_URL=$FASTAPI_BASE_URL
JWT_SECRET=$JWT_SECRET
SPRING_PROFILES_ACTIVE=prod
KAKAO_REST_API_KEY=$KAKAO_REST_API_KEY
KAKAOMAP_REST_API_KEY=$KAKAOMAP_REST_API_KEY
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
KAKAO_CLIENT_SECRET=$KAKAO_CLIENT_SECRET
KAKAO_GEOCODING_API_URI=$KAKAO_GEOCODING_API_URI
TOSS_TEST_SECRET_KEY=$TOSS_TEST_SECRET_KEY
TOSS_TEST_CLIENT_KEY=$TOSS_TEST_CLIENT_KEY
EFORMSIGN_API_KEY=$EFORMSIGN_API_KEY
EFORMSIGN_VERIFY_BEARER=$EFORMSIGN_VERIFY_BEARER
AI_AGENT_API_KEY=$AI_AGENT_API_KEY
AI_SERVER_INTERNAL_API_KEY=$AI_SERVER_INTERNAL_API_KEY
AI_AGENT_REFERENCE_VERSION=$AI_AGENT_REFERENCE_VERSION
AZURE_TTS_API_KEY=$AZURE_TTS_API_KEY
APP_FRONTEND_BASE_URL=$APP_FRONTEND_BASE_URL
APP_OAUTH2_AUTHORIZED_REDIRECT_URIS=$APP_OAUTH2_AUTHORIZED_REDIRECT_URIS
EOT
