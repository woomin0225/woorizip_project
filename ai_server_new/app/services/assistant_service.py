from __future__ import annotations

import logging

from app.agent import (
    FacilityAgent,
    RoomRecommendationAgent,
    RoomRegistrationAgent,
    TourApplyAgent,
)
from app.clients.groq_llm_client import GroqLLMClient
from app.clients.openai_agent_client import OpenAIAgentClient
from app.clients.spring_room_client import SpringRoomClient
from app.clients.spring_tour_client import SpringTourClient
from app.core.config import settings
from app.schemas import AssistantRunReq
from app.services.azure_tour_workflow_service import AzureTourWorkflowService
from app.services.reservation_service import ReservationService
from app.services.room_service import RoomService
from app.services.room_recommendation_service import RoomRecommendationService
from app.services.tour_service import TourService
from app.utils.assistant_normalizer import (
    build_system_prompt,
    normalize_assistant_payload,
    normalize_assistant_response,
)

logger = logging.getLogger(__name__)


class AssistantService:
    def __init__(self, client: OpenAIAgentClient):
        self.client = client
        self.room_registration_agent = RoomRegistrationAgent(
            RoomService(SpringRoomClient())
        )
        self.tour_apply_agent = TourApplyAgent(TourService(SpringTourClient()))
        self.facility_agent = FacilityAgent(
            ReservationService(
                GroqLLMClient(
                    api_key=settings.GROQ_API_KEY,
                    model=settings.GROQ_MODEL,
                )
            )
        )
        self.room_recommendation_agent = RoomRecommendationAgent(
            RoomRecommendationService(SpringRoomClient())
        )
        self.azure_tour_workflow_service = AzureTourWorkflowService(self.client)

    async def run(
        self,
        request: AssistantRunReq,
        *,
        access_token: str | None = None,
    ) -> dict:
        payload = normalize_assistant_payload(request.model_dump())
        if access_token:
            payload["accessToken"] = access_token

        has_ai_endpoint = bool((settings.AI_AGENT_ENDPOINT or "").strip())
        system_prompt = None
        if has_ai_endpoint:
            system_prompt = build_system_prompt(
                payload.get("systemPrompt"),
                settings.AI_AGENT_SYSTEM_PROMPT,
                settings.AI_AGENT_BASE_INFO,
            )

        # CODEX-AZURE-WORKFLOW-ROUTE-START
        # Tour apply intent is routed to Azure workflow first.
        # Delete only this marked block to remove the new route.
        if has_ai_endpoint and self.azure_tour_workflow_service.should_handle(payload):
            # CODEX-AZURE-TRACE-START
            logger.info(
                "AZURE_WORKFLOW_ATTEMPT sessionId=%s text=%s",
                payload.get("sessionId"),
                str(payload.get("text") or "")[:120],
            )
            # CODEX-AZURE-TRACE-END
            try:
                raw = await self.azure_tour_workflow_service.run(
                    payload,
                    system_prompt=system_prompt or None,
                )
                # CODEX-AZURE-TRACE-START
                logger.info(
                    "AZURE_WORKFLOW_SUCCESS sessionId=%s intent=%s action=%s",
                    payload.get("sessionId"),
                    raw.get("intent"),
                    raw.get("action"),
                )
                # CODEX-AZURE-TRACE-END
                return normalize_assistant_response(raw, payload)
            except Exception as exc:
                # CODEX-AZURE-TRACE-START
                logger.warning(
                    "AZURE_WORKFLOW_FALLBACK sessionId=%s reason=%s",
                    payload.get("sessionId"),
                    str(exc),
                )
                # CODEX-AZURE-TRACE-END
                pass
        # CODEX-AZURE-WORKFLOW-ROUTE-END

        # CODEX-AZURE-WORKFLOW-LEGACY-FALLBACK-START
        if self.tour_apply_agent.should_handle(payload):
            # CODEX-AZURE-TRACE-START
            logger.info(
                "TOUR_APPLY_AGENT_FALLBACK_USED sessionId=%s text=%s",
                payload.get("sessionId"),
                str(payload.get("text") or "")[:120],
            )
            # CODEX-AZURE-TRACE-END
            return await self.tour_apply_agent.run(payload)
        # CODEX-AZURE-WORKFLOW-LEGACY-FALLBACK-END

        if self.room_registration_agent.should_handle(payload):
            return await self.room_registration_agent.run(payload)

        if self.facility_agent.should_handle(payload):
            return await self.facility_agent.run(payload)

        if self.room_recommendation_agent.should_handle(payload):
            return await self.room_recommendation_agent.run(payload)

        if not has_ai_endpoint:
            return self._build_mock_response(payload)

        try:
            raw = await self.client.run(
                instruction=payload["instruction"],
                system_prompt=system_prompt or None,
            )
            return normalize_assistant_response(raw, payload)
        except Exception as exc:
            # CODEX-AZURE-RATE-LIMIT-GUARD-START
            logger.warning(
                "AZURE_AGENT_FINAL_CALL_FAILED sessionId=%s reason=%s",
                payload.get("sessionId"),
                str(exc),
            )
            if self._is_rate_limit_error(exc):
                return normalize_assistant_response(
                    {
                        "reply": (
                            "현재 투어 신청 요청이 일시적으로 많아 잠시 처리 지연이 발생하고 있습니다.\n"
                            "30초 정도 후에 다시 시도해 주세요."
                        ),
                        "intent": "TOUR_APPLY"
                        if self._looks_like_tour_context(payload)
                        else "CHAT",
                        "action": {
                            "name": "RETRY_LATER",
                            "target": "azure_agent",
                            "status": "rate_limited",
                        },
                        "result": {},
                        "errorCode": "AZURE_AGENT_RATE_LIMITED",
                        "requiresConfirm": False,
                    },
                    payload,
                )
            if self._is_tool_user_error(exc):
                return normalize_assistant_response(
                    {
                        "reply": (
                            "투어 신청 처리 중 외부 연동 호출이 일시적으로 실패했습니다.\n"
                            "잠시 후 다시 시도해 주세요."
                        ),
                        "intent": "TOUR_APPLY"
                        if self._looks_like_tour_context(payload)
                        else "CHAT",
                        "action": {
                            "name": "RETRY_LATER",
                            "target": "tour_apply_api",
                            "status": "tool_error",
                        },
                        "result": {},
                        "errorCode": "AZURE_AGENT_TOOL_USER_ERROR",
                        "requiresConfirm": False,
                    },
                    payload,
                )
            # CODEX-AZURE-RATE-LIMIT-GUARD-END
            raise

    def _build_mock_response(self, payload: dict) -> dict:
        text = str(payload.get("text") or "").strip()
        compact = text.replace(" ", "").lower()

        intent = "CHAT"
        reply = (
            "안녕하세요. 현재 AI_AGENT_ENDPOINT 설정이 없어 mock 응답으로 안내드리고 있습니다."
        )
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
            reply = (
                "투어 신청 요청으로 이해했습니다. mock 모드에서는 실제 신청 대신 "
                "투어 신청 워크플로 진입만 안내합니다."
            )
            action = {
                "name": "TOUR_APPLY",
                "path": "/tour/apply",
                "target": "azure_workflow",
            }
            result = {"mode": "mock", "next": "투어 신청 워크플로 진입"}
            requires_confirm = True
        elif "예약" in compact:
            intent = "FACILITY_BOOKING"
            reply = (
                "예약 요청으로 이해했습니다. mock 모드에서는 실제 예약 대신 안내만 제공합니다."
            )
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
            reply = (
                f"현재 페이지 요약(mock): "
                f"{excerpt[:180] or '요약할 본문을 찾지 못했습니다.'}"
            )
            action = {"name": "SUMMARY"}
        elif "인기" in compact and "방" in compact:
            intent = "POPULAR_ROOMS"
            reply = (
                "인기 방 목록 요청으로 이해했습니다. mock 모드에서는 방 목록 페이지 이동을 권장합니다."
            )
            action = {"name": "POPULAR_ROOMS", "path": "/rooms"}
        elif "시간" in compact or "이용" in compact:
            intent = "FACILITY_HOURS"
            reply = (
                "공용시설 이용시간 확인 요청으로 이해했습니다. mock 모드에서는 시설 페이지 이동을 권장합니다."
            )
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

    def _is_rate_limit_error(self, exc: Exception) -> bool:
        compact = str(exc).lower()
        return "429" in compact or "too many requests" in compact or "too_many_requests" in compact

    def _is_tool_user_error(self, exc: Exception) -> bool:
        compact = str(exc).lower()
        return (
            "tool_user_error" in compact
            or "validation error" in compact
            or "http_client_error" in compact
        )

    def _looks_like_tour_context(self, payload: dict) -> bool:
        text = str(payload.get("text") or "").replace(" ", "").lower()
        context = payload.get("context") or {}
        return bool(
            "투어" in text
            or "tour" in text
            or context.get("roomNo")
            or context.get("roomName")
            or payload.get("workflowHint") == "TOUR_APPLY"
        )
