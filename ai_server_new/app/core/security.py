from __future__ import annotations

from fastapi import Header, HTTPException

from app.core.config import settings


async def require_internal_api_key(x_api_key: str | None = Header(default=None, alias='X-API-KEY')) -> None:
    expected = (settings.APP_API_KEY or '').strip()
    if not expected:
        return
    if x_api_key == expected:
        return
    raise HTTPException(status_code=401, detail='유효한 내부 API 키가 필요합니다.')


async def get_user_context(
    x_user_id: str | None = Header(default=None, alias='X-USER-ID'),
    x_user_role: str | None = Header(default=None, alias='X-USER-ROLE'),
) -> dict:
    return {
        'user_id': x_user_id,
        'roles': [x_user_role] if x_user_role else [],
    }