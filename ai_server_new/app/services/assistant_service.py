from __future__ import annotations

from app.clients.openai_agent_client import OpenAIAgentClient
from app.core.config import settings
from app.schemas import AssistantRunReq
from app.utils.assistant_normalizer import (
    build_system_prompt,
    normalize_assistant_payload,
    normalize_assistant_response,
)


class AssistantService:
    def __init__(self, client: OpenAIAgentClient):
        self.client = client

    async def run(self, request: AssistantRunReq) -> dict:
        payload = normalize_assistant_payload(request.model_dump())
        if not (settings.AI_AGENT_ENDPOINT or '').strip():
            return self._build_mock_response(payload)

        system_prompt = build_system_prompt(
            payload.get('systemPrompt'),
            settings.AI_AGENT_SYSTEM_PROMPT,
            settings.AI_AGENT_BASE_INFO,
        )
        raw = await self.client.run(
            instruction=payload['instruction'],
            system_prompt=system_prompt or None,
        )
        return normalize_assistant_response(raw, payload)

    def _build_mock_response(self, payload: dict) -> dict:
        text = str(payload.get('text') or '').strip()
        compact = text.replace(' ', '').lower()

        intent = 'CHAT'
        reply = '안녕하세요. 현재 AI_AGENT_ENDPOINT 설정이 없어 mock 응답으로 안내드리고 있습니다.'
        action = {'name': 'CHAT'}
        result = {'mode': 'mock'}
        requires_confirm = False

        if '투어신청' in compact or '투어신청' == compact or '투어' in compact and ('신청' in compact or '방보러' in compact or '방보고싶' in compact or '방문' in compact):
            intent = 'TOUR_APPLY'
            reply = '투어 신청 요청으로 이해했습니다. mock 모드에서는 실제 신청 대신 투어 신청 워크플로 진입만 안내합니다.'
            action = {'name': 'TOUR_APPLY', 'path': '/tour/apply', 'target': 'azure_workflow'}
            result = {'mode': 'mock', 'next': '투어 신청 워크플로 진입'}
            requires_confirm = True
        elif '예약' in compact:
            intent = 'FACILITY_BOOKING'
            reply = '예약 요청으로 이해했습니다. mock 모드에서는 실제 예약 대신 안내만 제공합니다.'
            action = {'name': 'FACILITY_BOOKING', 'path': '/reservation/view'}
            result = {'mode': 'mock', 'next': '예약 페이지 이동'}
            requires_confirm = True
        elif '요약' in compact:
            intent = 'SUMMARY'
            excerpt = (
                payload.get('context', {})
                .get('pageSnapshot', {})
                .get('contentExcerpt', '')
            )
            reply = f"현재 페이지 요약(mock): {excerpt[:180] or '요약할 본문을 찾지 못했습니다.'}"
            action = {'name': 'SUMMARY'}
        elif '인기' in compact and '방' in compact:
            intent = 'POPULAR_ROOMS'
            reply = '인기 방 목록 요청으로 이해했습니다. mock 모드에서는 방 목록 페이지 이동을 권장합니다.'
            action = {'name': 'POPULAR_ROOMS', 'path': '/rooms'}
        elif '시간' in compact or '운영' in compact:
            intent = 'FACILITY_HOURS'
            reply = '공용시설 운영시간 확인 요청으로 이해했습니다. mock 모드에서는 시설 페이지 이동을 권장합니다.'
            action = {'name': 'FACILITY_HOURS', 'path': '/facility/view'}

        raw = {
            'reply': reply,
            'intent': intent,
            'action': action,
            'result': result,
            'requiresConfirm': requires_confirm,
            'provider': 'mock',
        }
        return normalize_assistant_response(raw, payload)
