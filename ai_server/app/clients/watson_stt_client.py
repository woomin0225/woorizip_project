from __future__ import annotations

from typing import Any

from app.clients.mock_clients import MockSpeechToTextClient
from app.clients.protocols import SpeechToTextClient


class WatsonSpeechToTextClient(SpeechToTextClient):
    """실연동 전용 자리.
    실제 Watson STT REST/WebSocket 연동은 팀 계정/오디오 포맷 정책에 맞춰 붙이면 된다.
    기본 스켈레톤은 Mock로 fallback 한다.
    """

    def __init__(self):
        self._fallback = MockSpeechToTextClient()

    async def transcribe(self, audio_base64: str, mime_type: str = 'audio/webm', language: str = 'ko', mock_text: str | None = None) -> dict[str, Any]:
        return await self._fallback.transcribe(audio_base64, mime_type=mime_type, language=language, mock_text=mock_text)
