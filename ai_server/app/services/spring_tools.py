from __future__ import annotations

from typing import Any
import httpx

from app.core.config import settings


class SpringTools:
    """FastAPI가 Spring 업무 API를 호출하는 '툴' 레이어.

    기본값(권장): TOOL_EXECUTION_MODE=plan
      - FastAPI는 draft/plan만 반환
      - 실제 DB 트랜잭션은 Spring이 수행 (인증/권한/감사로그 포함)

    선택: TOOL_EXECUTION_MODE=execute
      - FastAPI가 내부망에서 Spring의 internal endpoint를 직접 호출
      - 팀 합의/보안 설정(mTLS/내부키 등) 후 사용
    """

    def __init__(self):
        self.mode = settings.TOOL_EXECUTION_MODE.lower().strip()
        self.base_url = settings.SPRING_BASE_URL
        self.api_key = settings.SPRING_INTERNAL_API_KEY

    def plan(self, tool: str, args: dict[str, Any]) -> dict:
        return {"mode": "plan", "tool": tool, "args": args}

    async def _post(self, tool: str, args: dict[str, Any]) -> dict:
        if not self.base_url:
            raise RuntimeError("SPRING_BASE_URL is not set")
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-API-KEY"] = self.api_key

        # 예시 경로: Spring에서 internal controller로 받기
        url = f"{self.base_url.rstrip('/')}/internal/ai/tool/{tool}"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, headers=headers, json=args)
            resp.raise_for_status()
            return resp.json()

    async def call(self, tool: str, args: dict[str, Any]) -> dict:
        if self.mode == "execute":
            return {
                "mode": "execute",
                "tool": tool,
                "result": await self._post(tool, args),
            }
        return self.plan(tool, args)

    # ===== Tool definitions (기획서 기반) =====
    async def listing_register_draft(
        self, utterance: str, partial: dict[str, Any] | None = None
    ) -> dict:
        return await self.call(
            "listing_register_draft", {"utterance": utterance, "partial": partial or {}}
        )

    async def get_facilities(self, house_no: str = None) -> list[dict]:
        path = f"/api/facilities/{house_no}" if house_no else "/api/facilities"
        url = f"{self.base_url.rstrip('/')}{path}"

        headers = {"Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            return resp.json()

    async def facility_booking_draft(
        self, utterance: str, facilities: list[dict] | None = None
    ) -> dict:
        return await self.call(
            "facility_booking_draft",
            {"utterance": utterance, "facilities": facilities or []},
        )

    async def navigate_to_post(
        self, utterance: str, candidates: list[dict] | None = None
    ) -> dict:
        return await self.call(
            "navigate_to_post", {"utterance": utterance, "candidates": candidates or []}
        )
