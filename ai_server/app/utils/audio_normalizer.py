from __future__ import annotations

import base64
import binascii
import re
from typing import Any


DATA_URI_PATTERN = re.compile(
    r'^data:(?P<mime>[^;]+);base64,(?P<data>.+)$',
    re.IGNORECASE,
)
MAX_AUDIO_BYTES = 10 * 1024 * 1024
SUPPORTED_AUDIO_FORMATS = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
}


def normalize_text(value: Any, max_length: int = 2000) -> str:
    text = re.sub(r'\s+', ' ', str(value or '')).strip()
    if len(text) <= max_length:
        return text
    return text[: max_length - 1].rstrip() + '…'


def normalize_voice_name(value: Any, default_voice: str) -> str:
    return normalize_text(value or default_voice, 80) or default_voice


def normalize_audio_format(value: Any, default_format: str) -> str:
    audio_format = normalize_text(value or default_format, 20).lower()
    if audio_format == 'mpeg':
        audio_format = 'mp3'
    if audio_format not in SUPPORTED_AUDIO_FORMATS:
        allowed = ', '.join(sorted(SUPPORTED_AUDIO_FORMATS))
        raise ValueError(f'지원하지 않는 audio_format 입니다. 허용값: {allowed}')
    return audio_format


def _decode_audio_base64(audio_base64: str) -> tuple[bytes, str | None]:
    matched = DATA_URI_PATTERN.match(audio_base64.strip())
    inferred_mime = None
    if matched:
        inferred_mime = matched.group('mime').strip().lower()
        audio_base64 = matched.group('data').strip()

    try:
        decoded = base64.b64decode(audio_base64, validate=False)
    except (ValueError, binascii.Error) as exc:
        raise ValueError('audio_base64 디코딩에 실패했습니다.') from exc

    if not decoded:
        raise ValueError('오디오 데이터가 비어 있습니다.')
    if len(decoded) > MAX_AUDIO_BYTES:
        raise ValueError('오디오 데이터가 너무 큽니다.')
    return decoded, inferred_mime


def normalize_transcribe_payload(
    audio_base64: str,
    mime_type: str | None,
    language: str | None,
    mock_text: str | None,
) -> dict[str, Any]:
    raw_bytes, inferred_mime = _decode_audio_base64(audio_base64)
    normalized_mime = normalize_text(mime_type or inferred_mime or 'audio/webm', 80).lower()
    if not normalized_mime.startswith('audio/'):
        normalized_mime = 'audio/webm'

    return {
        'audio_base64': base64.b64encode(raw_bytes).decode('ascii'),
        'audio_bytes': len(raw_bytes),
        'mime_type': normalized_mime,
        'language': normalize_text(language or 'ko', 20).lower() or 'ko',
        'mock_text': normalize_text(mock_text, 500) or None,
    }


def normalize_tts_payload(
    text: str,
    voice: str | None,
    audio_format: str | None,
    default_voice: str,
    default_format: str,
) -> dict[str, Any]:
    normalized_text = normalize_text(text, 2000)
    if not normalized_text:
        raise ValueError('text는 비어 있을 수 없습니다.')

    normalized_format = normalize_audio_format(audio_format, default_format)
    return {
        'text': normalized_text,
        'voice': normalize_voice_name(voice, default_voice),
        'audio_format': normalized_format,
        'mime_type': SUPPORTED_AUDIO_FORMATS[normalized_format],
    }


def normalize_transcribe_response(raw: dict[str, Any], request_meta: dict[str, Any]) -> dict[str, Any]:
    raw = raw or {}
    warnings = raw.get('warnings')
    return {
        'text': normalize_text(raw.get('text'), 4000),
        'language': normalize_text(raw.get('language') or request_meta['language'], 20)
        or request_meta['language'],
        'mimeType': normalize_text(raw.get('mime_type') or request_meta['mime_type'], 80)
        or request_meta['mime_type'],
        'provider': normalize_text(raw.get('provider'), 60),
        'audioBytes': int(raw.get('audio_bytes') or request_meta['audio_bytes']),
        'warnings': warnings if isinstance(warnings, list) else [],
        'raw': raw,
    }


def normalize_tts_response(raw: dict[str, Any], request_meta: dict[str, Any]) -> dict[str, Any]:
    raw = raw or {}
    audio_base64 = normalize_text(raw.get('audio_base64'), 20_000_000)
    if not audio_base64:
        raise ValueError('TTS 응답에 audio_base64 가 없습니다.')

    warnings = raw.get('warnings')
    return {
        'text': normalize_text(raw.get('text') or request_meta['text'], 2000),
        'voice': normalize_voice_name(raw.get('voice'), request_meta['voice']),
        'audioFormat': normalize_audio_format(
            raw.get('audio_format'),
            request_meta['audio_format'],
        ),
        'mimeType': normalize_text(raw.get('mime_type') or request_meta['mime_type'], 80)
        or request_meta['mime_type'],
        'audioBase64': audio_base64,
        'provider': normalize_text(raw.get('provider'), 60),
        'warnings': warnings if isinstance(warnings, list) else [],
        'raw': raw,
    }
