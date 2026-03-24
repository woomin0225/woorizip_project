from __future__ import annotations

import asyncio
import json
import re
from urllib import error, request

from app.clients.google_auth import build_google_auth_headers
from app.clients.protocols import TextToSpeechClient
from app.core.config import settings


TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize'
FORMAT_TO_MIME = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'pcm16': 'audio/wav',
}
FORMAT_TO_ENCODING = {
    'mp3': 'MP3',
    'wav': 'LINEAR16',
    'pcm16': 'LINEAR16',
}
VOICE_PATTERN = re.compile(r'^[a-z]{2,3}-[A-Z]{2}-.+$')


class GoogleCloudTTSClient(TextToSpeechClient):
    async def speak(self, text: str, voice: str | None = None, audio_format: str | None = None) -> dict:
        return await asyncio.to_thread(
            self._speak_sync,
            text,
            self._normalize_voice_name(voice),
            (audio_format or settings.DEFAULT_AUDIO_FORMAT).lower(),
        )

    def _speak_sync(self, text: str, voice: str, audio_format: str) -> dict:
        resolved_format = 'mp3' if audio_format == 'mpeg' else audio_format
        encoding = FORMAT_TO_ENCODING.get(resolved_format)
        if not encoding:
            raise ValueError(f'Google Cloud TTS에서 지원하지 않는 audio_format 입니다: {resolved_format}')

        payload = {
            'input': {
                'text': text,
            },
            'voice': {
                'languageCode': self._voice_locale(voice),
                'name': voice,
            },
            'audioConfig': {
                'audioEncoding': encoding,
                'speakingRate': settings.GOOGLE_TTS_SPEAKING_RATE,
            },
        }

        headers = {
            'Content-Type': 'application/json; charset=utf-8',
            **build_google_auth_headers(),
        }
        req = request.Request(
            TTS_ENDPOINT,
            data=json.dumps(payload).encode('utf-8'),
            headers=headers,
            method='POST',
        )

        try:
            with request.urlopen(req, timeout=max(settings.AI_AGENT_TIMEOUT_MS, 1000) / 1000.0) as resp:
                body = resp.read().decode('utf-8', errors='ignore')
        except error.HTTPError as exc:
            body = exc.read().decode('utf-8', errors='ignore')
            raise ValueError(
                f'Google Cloud TTS 호출 실패: status={exc.code}, body={body}'
            ) from exc
        except error.URLError as exc:
            raise ValueError(
                f'Google Cloud TTS 통신 중 오류가 발생했습니다: {exc.reason}'
            ) from exc

        try:
            parsed = json.loads(body)
        except json.JSONDecodeError as exc:
            raise ValueError(f'Google Cloud TTS 응답 파싱에 실패했습니다: {body}') from exc

        audio_base64 = str(parsed.get('audioContent') or '').strip()
        if not audio_base64:
            raise ValueError(f'Google Cloud TTS 응답에 audioContent가 없습니다: {body}')

        return {
            'voice': voice,
            'audio_format': resolved_format,
            'mime_type': FORMAT_TO_MIME.get(resolved_format, 'application/octet-stream'),
            'audio_base64': audio_base64,
            'text': text,
            'provider': 'google-cloud',
            'raw_result': parsed,
        }

    def _normalize_voice_name(self, voice_name: str | None) -> str:
        default_voice = (settings.DEFAULT_TTS_VOICE or 'ko-KR-Standard-A').strip()
        candidate = (voice_name or '').strip()
        if not candidate:
            return default_voice
        if VOICE_PATTERN.match(candidate):
            return candidate
        return default_voice

    def _voice_locale(self, voice_name: str) -> str:
        matched = re.match(r'^([a-z]{2,3}-[A-Z]{2})-', voice_name)
        if matched:
            return matched.group(1)
        return settings.GOOGLE_TTS_LANGUAGE_CODE or 'ko-KR'
