from __future__ import annotations

import asyncio
import base64
from html import escape
from urllib import error, request

from app.clients.mock_clients import MockTextToSpeechClient
from app.clients.protocols import TextToSpeechClient
from app.core.config import settings


FORMAT_TO_HEADER = {
    'mp3': 'audio-24khz-48kbitrate-mono-mp3',
    'wav': 'riff-24khz-16bit-mono-pcm',
}

FORMAT_TO_MIME = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
}


class AzureSpeechTTSClient(TextToSpeechClient):
    def __init__(self):
        self._fallback = MockTextToSpeechClient()

    async def speak(self, text: str, voice: str | None = None, audio_format: str | None = None) -> dict:
        if not settings.AZURE_TTS_API_KEY or not (
            settings.AZURE_TTS_ENDPOINT or settings.AZURE_TTS_REGION
        ):
            return await self._fallback.speak(text, voice=voice, audio_format=audio_format)

        return await asyncio.to_thread(
            self._speak_sync,
            text,
            voice or settings.DEFAULT_TTS_VOICE,
            (audio_format or settings.DEFAULT_AUDIO_FORMAT).lower(),
        )

    def _speak_sync(self, text: str, voice: str, audio_format: str) -> dict:
        endpoint = self._resolve_endpoint()
        resolved_format = 'mp3' if audio_format == 'mpeg' else audio_format
        output_header = FORMAT_TO_HEADER.get(
            resolved_format,
            settings.AZURE_TTS_OUTPUT_FORMAT,
        )

        ssml = self._to_ssml(text, voice)
        req = request.Request(
            endpoint,
            data=ssml.encode('utf-8'),
            headers={
                'Content-Type': 'application/ssml+xml',
                'Ocp-Apim-Subscription-Key': settings.AZURE_TTS_API_KEY or '',
                'X-Microsoft-OutputFormat': output_header,
                'User-Agent': 'woorizip-ai-server',
            },
            method='POST',
        )

        try:
            with request.urlopen(req, timeout=max(settings.AI_AGENT_TIMEOUT_MS, 1000) / 1000.0) as resp:
                audio_bytes = resp.read()
        except error.HTTPError as exc:
            body = exc.read().decode('utf-8', errors='ignore')
            raise ValueError(
                f'Azure TTS 호출 실패: status={exc.code}, body={body}'
            ) from exc
        except error.URLError as exc:
            raise ValueError(
                f'Azure TTS 통신 중 오류가 발생했습니다: {exc.reason}'
            ) from exc

        return {
            'voice': voice,
            'audio_format': resolved_format,
            'mime_type': FORMAT_TO_MIME.get(resolved_format, 'application/octet-stream'),
            'audio_base64': base64.b64encode(audio_bytes).decode('ascii'),
            'text': text,
            'provider': 'azure',
        }

    def _resolve_endpoint(self) -> str:
        if settings.AZURE_TTS_ENDPOINT:
            return settings.AZURE_TTS_ENDPOINT.rstrip('/')
        if settings.AZURE_TTS_REGION:
            return (
                f'https://{settings.AZURE_TTS_REGION.strip()}'
                '.tts.speech.microsoft.com/cognitiveservices/v1'
            )
        raise ValueError('AZURE_TTS_ENDPOINT 또는 AZURE_TTS_REGION 설정이 필요합니다.')

    def _to_ssml(self, text: str, voice_name: str) -> str:
        return (
            '<speak version="1.0" xml:lang="ko-KR">'
            f'<voice name="{escape(voice_name)}">{escape(text)}</voice>'
            '</speak>'
        )
