from __future__ import annotations

import asyncio
import base64
import json
from urllib import error, request

from app.clients.mock_clients import MockTextToSpeechClient
from app.clients.protocols import TextToSpeechClient
from app.core.config import settings


FORMAT_TO_MIME = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'flac': 'audio/flac',
    'opus': 'audio/opus',
    'pcm16': 'audio/wav',
    'aac': 'audio/aac',
}

OPENAI_TTS_VOICES = {
    'alloy',
    'ash',
    'ballad',
    'coral',
    'echo',
    'sage',
    'shimmer',
    'verse',
    'marin',
    'cedar',
}


class AzureSpeechTTSClient(TextToSpeechClient):
    def __init__(self):
        self._fallback = MockTextToSpeechClient()

    async def speak(self, text: str, voice: str | None = None, audio_format: str | None = None) -> dict:
        if not settings.AZURE_TTS_API_KEY or not settings.AZURE_TTS_ENDPOINT:
            return await self._fallback.speak(text, voice=voice, audio_format=audio_format)

        return await asyncio.to_thread(
            self._speak_sync,
            text,
            voice or settings.DEFAULT_TTS_VOICE,
            (audio_format or settings.DEFAULT_AUDIO_FORMAT).lower(),
        )

    def _speak_sync(self, text: str, voice: str, audio_format: str) -> dict:
        endpoint = self._resolve_openai_endpoint()
        resolved_format = 'mp3' if audio_format == 'mpeg' else audio_format
        resolved_voice = self._normalize_openai_voice(voice)
        audio_bytes = self._request_openai_audio(
            endpoint=endpoint,
            deployment=settings.AZURE_TTS_DEPLOYMENT,
            api_version=settings.AZURE_TTS_API_VERSION,
            text=text,
            voice=resolved_voice,
            audio_format=resolved_format,
        )

        return {
            'voice': resolved_voice,
            'audio_format': resolved_format,
            'mime_type': FORMAT_TO_MIME.get(resolved_format, 'application/octet-stream'),
            'audio_base64': base64.b64encode(audio_bytes).decode('ascii'),
            'text': text,
            'provider': 'azure-openai',
        }

    def _request_openai_audio(
        self,
        *,
        endpoint: str,
        deployment: str | None,
        api_version: str,
        text: str,
        voice: str,
        audio_format: str,
    ) -> bytes:
        if not deployment:
            raise ValueError('AZURE_TTS_DEPLOYMENT 설정이 필요합니다.')

        url = (
            f'{endpoint}/openai/deployments/{deployment}/chat/completions'
            f'?api-version={api_version}'
        )
        payload = {
            'model': deployment,
            'modalities': ['text', 'audio'],
            'audio': {
                'voice': voice,
                'format': audio_format,
            },
            'messages': [
                {
                    'role': 'user',
                    'content': text,
                }
            ],
        }

        req = request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'api-key': settings.AZURE_TTS_API_KEY or '',
                'User-Agent': 'woorizip-ai-server',
            },
            method='POST',
        )

        try:
            with request.urlopen(req, timeout=max(settings.AI_AGENT_TIMEOUT_MS, 1000) / 1000.0) as resp:
                body = resp.read().decode('utf-8', errors='ignore')
        except error.HTTPError as exc:
            body = exc.read().decode('utf-8', errors='ignore')
            raise ValueError(
                f'Azure OpenAI TTS 호출 실패: status={exc.code}, body={body}'
            ) from exc
        except error.URLError as exc:
            raise ValueError(
                f'Azure OpenAI TTS 통신 중 오류가 발생했습니다: {exc.reason}'
            ) from exc

        try:
            parsed = json.loads(body)
            audio_base64 = (
                parsed.get('choices', [{}])[0]
                .get('message', {})
                .get('audio', {})
                .get('data')
            )
        except Exception as exc:  # pragma: no cover
            raise ValueError('Azure OpenAI TTS 응답 파싱에 실패했습니다.') from exc

        if not audio_base64:
            raise ValueError(f'Azure OpenAI TTS 응답에 audio data가 없습니다: {body}')

        return base64.b64decode(audio_base64)

    def _resolve_openai_endpoint(self) -> str:
        endpoint = (settings.AZURE_TTS_ENDPOINT or '').rstrip('/')
        if not endpoint:
            raise ValueError('AZURE_TTS_ENDPOINT 설정이 필요합니다.')
        if endpoint.endswith('/openai/v1'):
            return endpoint[:-10]
        if endpoint.endswith('/cognitiveservices/v1'):
            return endpoint[:-19]
        return endpoint

    def _normalize_openai_voice(self, voice_name: str | None) -> str:
        candidate = (voice_name or '').strip().lower()
        if candidate in OPENAI_TTS_VOICES:
            return candidate
        return (settings.DEFAULT_TTS_VOICE or 'alloy').strip().lower()
