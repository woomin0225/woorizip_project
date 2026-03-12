from __future__ import annotations

from app.clients.mock_clients import MockTextToSpeechClient
from app.clients.protocols import TextToSpeechClient


class AzureSpeechTTSClient(TextToSpeechClient):
    """실연동 전용 자리. 기본은 Mock fallback."""

    def __init__(self):
        self._fallback = MockTextToSpeechClient()

    async def speak(self, text: str, voice: str | None = None, audio_format: str | None = None) -> dict:
        return await self._fallback.speak(text, voice=voice, audio_format=audio_format)
