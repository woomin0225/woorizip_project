from __future__ import annotations

from app.agent import RoomRegistrationAgent, TourApplyAgent, FacilityAgent
from app.clients.openai_agent_client import OpenAIAgentClient
from app.clients.spring_tour_client import SpringTourClient
from app.clients.spring_facility_client import SpringFacilityClient
from app.core.config import settings
from app.schemas import AssistantRunReq
from app.services.tour_service import TourService
from app.services.reservation_service import ReservationService
from app.utils.assistant_normalizer import (
    build_system_prompt,
    normalize_assistant_payload,
    normalize_assistant_response,
)


class AssistantService:
    def __init__(self, client: OpenAIAgentClient):
        self.client = client
        # 방 등록 에이전트는 여러 턴에 걸쳐 슬롯을 모으기 때문에,
        # 요청마다 새로 만들기보다 서비스 인스턴스가 살아 있는 동안 함께 유지하는 편이 이해하기 쉽다.
        # 이렇게 해 두면 에이전트 내부의 세션 저장소도 같은 객체를 계속 사용하게 된다.
        self.room_registration_agent = RoomRegistrationAgent()
        self.tour_apply_agent = TourApplyAgent(TourService(SpringTourClient()))
        self.facility_agent = FacilityAgent(ReservationService(SpringFacilityClient))

    async def run(
        self,
        request: AssistantRunReq,
        *,
        access_token: str | None = None,
    ) -> dict:
        payload = normalize_assistant_payload(request.model_dump())
        if access_token:
            payload["accessToken"] = access_token
        # 모든 요청을 바로 범용 LLM으로 보내지 않고, 먼저 "전용 에이전트가 처리해야 하는가?"를 확인한다.
        # 이유는 방 등록처럼 구조화된 업무는 규칙 기반 에이전트가 더 빠르고, 예측 가능하고, 상태 관리도 쉽기 때문이다.
        if self.tour_apply_agent.should_handle(payload):
            return await self.tour_apply_agent.run(payload)

        if self.room_registration_agent.should_handle(payload):
            # 전용 에이전트가 맡는다고 판단되면 이 시점에서 바로 라우팅을 종료한다.
            # 즉, 아래의 일반 AI endpoint 호출로 내려가지 않고 방 등록 전용 흐름이 우선권을 가진다.
            return await self.room_registration_agent.run(payload)

        if self.facility_agent.should_handle(payload):
            return await self.facility_agent.run(payload)

        if not (settings.AI_AGENT_ENDPOINT or "").strip():
            return self._build_mock_response(payload)

        system_prompt = build_system_prompt(
            payload.get("systemPrompt"),
            settings.AI_AGENT_SYSTEM_PROMPT,
            settings.AI_AGENT_BASE_INFO,
        )
        raw = await self.client.run(
            instruction=payload["instruction"],
            system_prompt=system_prompt or None,
        )
        return normalize_assistant_response(raw, payload)

    def _build_mock_response(self, payload: dict) -> dict:
        text = str(payload.get("text") or "").strip()
        compact = text.replace(" ", "").lower()

        intent = "CHAT"
        reply = "안녕하세요. 현재 AI_AGENT_ENDPOINT 설정이 없어 mock 응답으로 안내드리고 있습니다."
        action = {"name": "CHAT"}
        result = {"mode": "mock"}
        requires_confirm = False

        if (
            "투어신청" in compact
            or "투어신청" == compact
            or "투어" in compact
            and (
                "신청" in compact
                or "방보러" in compact
                or "방보고싶" in compact
                or "방문" in compact
            )
        ):
            intent = "TOUR_APPLY"
            reply = "투어 신청 요청으로 이해했습니다. mock 모드에서는 실제 신청 대신 투어 신청 워크플로 진입만 안내합니다."
            action = {
                "name": "TOUR_APPLY",
                "path": "/tour/apply",
                "target": "azure_workflow",
            }
            result = {"mode": "mock", "next": "투어 신청 워크플로 진입"}
            requires_confirm = True
        elif "예약" in compact:
            intent = "FACILITY_BOOKING"
            reply = "예약 요청으로 이해했습니다. mock 모드에서는 실제 예약 대신 안내만 제공합니다."
            action = {"name": "FACILITY_BOOKING", "path": "/reservation/view"}
            result = {"mode": "mock", "next": "예약 페이지 이동"}
            requires_confirm = True
        elif "요약" in compact:
            intent = "SUMMARY"
            excerpt = (
                payload.get("context", {})
                .get("pageSnapshot", {})
                .get("contentExcerpt", "")
            )
            reply = f"현재 페이지 요약(mock): {excerpt[:180] or '요약할 본문을 찾지 못했습니다.'}"
            action = {"name": "SUMMARY"}
        elif "인기" in compact and "방" in compact:
            intent = "POPULAR_ROOMS"
            reply = "인기 방 목록 요청으로 이해했습니다. mock 모드에서는 방 목록 페이지 이동을 권장합니다."
            action = {"name": "POPULAR_ROOMS", "path": "/rooms"}
        elif "시간" in compact or "운영" in compact:
            intent = "FACILITY_HOURS"
            reply = "공용시설 운영시간 확인 요청으로 이해했습니다. mock 모드에서는 시설 페이지 이동을 권장합니다."
            action = {"name": "FACILITY_HOURS", "path": "/facility/view"}

        raw = {
            "reply": reply,
            "intent": intent,
            "action": action,
            "result": result,
            "requiresConfirm": requires_confirm,
            "provider": "mock",
        }
        return normalize_assistant_response(raw, payload)
