from __future__ import annotations

import json
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2 import service_account

from app.core.config import settings


GOOGLE_CLOUD_SCOPE = ['https://www.googleapis.com/auth/cloud-platform']


def build_google_auth_headers() -> dict[str, str]:
    credentials = _load_google_credentials()
    credentials.refresh(Request())
    if not credentials.token:
        raise ValueError('Google Cloud access token 발급에 실패했습니다.')
    return {
        'Authorization': f'Bearer {credentials.token}',
        'User-Agent': 'woorizip-ai-server',
    }


def _load_google_credentials():
    raw_json = (settings.GOOGLE_SERVICE_ACCOUNT_JSON or '').strip()
    credentials_path = (settings.GOOGLE_APPLICATION_CREDENTIALS or '').strip()

    if raw_json:
        try:
            info = json.loads(raw_json)
        except json.JSONDecodeError as exc:
            raise ValueError('GOOGLE_SERVICE_ACCOUNT_JSON 형식이 올바르지 않습니다.') from exc
        return service_account.Credentials.from_service_account_info(
            info,
            scopes=GOOGLE_CLOUD_SCOPE,
        )

    if credentials_path:
        path = Path(credentials_path)
        if not path.is_absolute():
            path = (Path(__file__).resolve().parents[2] / path).resolve()
        if not path.exists():
            raise ValueError(f'Google 서비스 계정 파일을 찾을 수 없습니다: {path}')
        return service_account.Credentials.from_service_account_file(
            str(path),
            scopes=GOOGLE_CLOUD_SCOPE,
        )

    raise ValueError(
        'Google Cloud 인증을 사용하려면 GOOGLE_APPLICATION_CREDENTIALS 또는 '
        'GOOGLE_SERVICE_ACCOUNT_JSON 설정이 필요합니다.'
    )
