from __future__ import annotations

import asyncio
import json
from urllib import error, request

from app.clients.google_auth import build_google_auth_headers
from app.clients.protocols import SpeechToTextClient
from app.core.config import settings


STT_ENDPOINT = 'https://speech.googleapis.com/v1/speech:recognize'
MIME_TO_ENCODING = {
    'audio/webm': 'WEBM_OPUS',
    'audio/webm;codecs=opus': 'WEBM_OPUS',
    'audio/ogg': 'OGG_OPUS',
    'audio/ogg;codecs=opus': 'OGG_OPUS',
    'audio/wav': 'LINEAR16',
    'audio/x-wav': 'LINEAR16',
    'audio/mpeg': 'MP3',
    'audio/mp3': 'MP3',
    'audio/flac': 'FLAC',
}


class GoogleCloudSTTClient(SpeechToTextClient):
    async def transcribe(
        self,
        audio_base64: str,
        *,
        mime_type: str | None = None,
        language: str | None = None,
    ) -> dict:
        return await asyncio.to_thread(
            self._transcribe_sync,
            audio_base64,
            mime_type or 'audio/webm',
            self._normalize_language(language),
        )

    def _transcribe_sync(self, audio_base64: str, mime_type: str, language: str) -> dict:
        normalized_mime = mime_type.strip().lower()
        encoding = self._resolve_encoding(normalized_mime)
        payload = {
            'config': {
                'languageCode': language,
                'encoding': encoding,
                'enableAutomaticPunctuation': True,
                'model': settings.GOOGLE_STT_MODEL,
            },
            'audio': {
                'content': audio_base64,
            },
        }

        headers = {
            'Content-Type': 'application/json; charset=utf-8',
            **build_google_auth_headers(),
        }
        req = request.Request(
            STT_ENDPOINT,
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
                f'Google Cloud STT 호출 실패: status={exc.code}, body={body}'
            ) from exc
        except error.URLError as exc:
            raise ValueError(
                f'Google Cloud STT 통신 중 오류가 발생했습니다: {exc.reason}'
            ) from exc

        parsed = self._parse_response(body)
        return {
            'text': parsed['text'],
            'language': language,
            'mime_type': mime_type,
            'provider': 'google-cloud',
            'audio_bytes': len(audio_base64.encode('ascii')),
            'raw_result': parsed['raw'],
        }

    def _normalize_language(self, language: str | None) -> str:
        candidate = (language or settings.GOOGLE_STT_LANGUAGE_CODE or settings.DEFAULT_STT_LANGUAGE).strip()
        if candidate.lower() == 'ko':
            return 'ko-KR'
        return candidate or 'ko-KR'

    def _resolve_encoding(self, mime_type: str) -> str:
        exact = MIME_TO_ENCODING.get(mime_type)
        if exact:
            return exact
        for key, encoding in MIME_TO_ENCODING.items():
            if mime_type.startswith(key):
                return encoding
        raise ValueError(f'Google Cloud STT에서 지원하지 않는 mime_type 입니다: {mime_type}')

    def _parse_response(self, body: str) -> dict:
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError as exc:
            raise ValueError(f'Google Cloud STT 응답 파싱에 실패했습니다: {body}') from exc

        results = parsed.get('results')
        if not isinstance(results, list):
            raise ValueError(f'Google Cloud STT 응답에 results가 없습니다: {body}')

        transcripts: list[str] = []
        for result in results:
            if not isinstance(result, dict):
                continue
            alternatives = result.get('alternatives')
            if not isinstance(alternatives, list) or not alternatives:
                continue
            first = alternatives[0]
            if isinstance(first, dict):
                transcript = str(first.get('transcript') or '').strip()
                if transcript:
                    transcripts.append(transcript)

        text = ' '.join(transcripts).strip()
        if not text:
            raise ValueError(f'Google Cloud STT 응답에 인식 결과가 없습니다: {body}')
        return {'text': text, 'raw': parsed}
