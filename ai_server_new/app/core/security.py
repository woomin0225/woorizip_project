from __future__ import annotations

from fastapi import Header, HTTPException
from app.core.config import settings


def require_internal_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-KEY"),
):
    # Spring Boot(BFF) -> FastAPI 내부 호출 보호용
    if x_api_key != settings.APP_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized (invalid X-API-KEY)")


def get_user_context(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_roles: str | None = Header(default="", alias="X-Roles"),
) -> dict:
    # Spring이 인증/권한을 들고 있으므로, 필요한 최소 컨텍스트를 헤더로 전달
    roles = [r.strip() for r in (x_roles or "").split(",") if r.strip()]
    return {"user_id": x_user_id, "roles": roles}
