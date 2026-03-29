from __future__ import annotations

from app.clients.protocols import SpeechToTextClient, TextToSpeechClient


class VoiceService:
    def __init__(self, stt_client: SpeechToTextClient, tts_client: TextToSpeechClient):
        self.stt_client = stt_client
        self.tts_client = tts_client

    async def transcribe(
        self,
        audio_base64: str,
        *,
        mime_type: str | None = None,
        language: str | None = None,
    ) -> dict:
        return await self.stt_client.transcribe(
            audio_base64,
            mime_type=mime_type,
            language=language,
        )

    async def speak(
        self,
        text: str,
        *,
        voice: str | None = None,
        audio_format: str | None = None,
    ) -> dict:
        return await self.tts_client.speak(
            text,
            voice=voice,
            audio_format=audio_format,
        )
