from __future__ import annotations

from app.core.config import settings
from app.schemas import VoiceSpeakReq, VoiceTranscribeReq
from app.services.voice_service import VoiceService
from app.utils.audio_normalizer import (
    normalize_transcribe_payload,
    normalize_transcribe_response,
    normalize_tts_payload,
    normalize_tts_response,
)


class VoicePipelineService:
    def __init__(self, voice_service: VoiceService):
        self.voice_service = voice_service

    async def transcribe(self, request: VoiceTranscribeReq) -> dict:
        payload = normalize_transcribe_payload(
            request.audio_base64,
            request.mime_type,
            request.language,
            request.mock_text,
        )
        raw = await self.voice_service.transcribe(
            payload['audio_base64'],
            mime_type=payload['mime_type'],
            language=payload['language'],
            mock_text=payload['mock_text'],
        )
        return normalize_transcribe_response(raw, payload)

    async def speak(self, request: VoiceSpeakReq) -> dict:
        payload = normalize_tts_payload(
            request.text,
            request.voice,
            request.audio_format,
            settings.DEFAULT_TTS_VOICE,
            settings.DEFAULT_AUDIO_FORMAT,
        )
        raw = await self.voice_service.speak(
            payload['text'],
            voice=payload['voice'],
            audio_format=payload['audio_format'],
        )
        return normalize_tts_response(raw, payload)
