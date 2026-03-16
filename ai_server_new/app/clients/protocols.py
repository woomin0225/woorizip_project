from __future__ import annotations

from typing import Protocol


class SpeechToTextClient(Protocol):
    async def transcribe(
        self,
        audio_base64: str,
        *,
        mime_type: str | None = None,
        language: str | None = None,
        mock_text: str | None = None,
    ) -> dict: ...


class TextToSpeechClient(Protocol):
    async def speak(
        self,
        text: str,
        *,
        voice: str | None = None,
        audio_format: str | None = None,
    ) -> dict: ...