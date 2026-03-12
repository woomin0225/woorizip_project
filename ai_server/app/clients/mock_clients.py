from __future__ import annotations

import base64
import hashlib
import struct
from typing import Any

from app.core.config import settings
from app.clients.protocols import (
    EmbeddingClient,
    SpeechToTextClient,
    TextToSpeechClient,
    CaptionClient,
    ObjectDetectionClient,
    OCRClient,
    SentimentClient,
)


def _safe_len(b64: str) -> int:
    try:
        return len(base64.b64decode(b64, validate=False))
    except Exception:
        return 0


def _wav_silence_base64(seconds: float = 1.0, sample_rate: int = 16000) -> str:
    n_samples = int(sample_rate * seconds)
    byte_rate = sample_rate * 2
    block_align = 2
    data_size = n_samples * 2
    header = b'RIFF' + struct.pack('<I', 36 + data_size) + b'WAVE'
    fmt = (
        b'fmt '
        + struct.pack('<I', 16)
        + struct.pack('<H', 1)
        + struct.pack('<H', 1)
        + struct.pack('<I', sample_rate)
        + struct.pack('<I', byte_rate)
        + struct.pack('<H', block_align)
        + struct.pack('<H', 16)
    )
    data = b'data' + struct.pack('<I', data_size) + (b'\x00\x00' * n_samples)
    return base64.b64encode(header + fmt + data).decode('ascii')


class MockEmbeddingClient(EmbeddingClient):
    async def embed(self, texts: list[str]) -> list[list[float]]:
        out: list[list[float]] = []
        for t in texts:
            h = hashlib.sha256(t.encode('utf-8', errors='ignore')).digest()
            vec = [((h[i] / 255.0) * 2.0 - 1.0) for i in range(16)]
            out.append(vec)
        return out


class MockSpeechToTextClient(SpeechToTextClient):
    async def transcribe(self, audio_base64: str, mime_type: str = 'audio/webm', language: str = 'ko', mock_text: str | None = None) -> dict[str, Any]:
        if mock_text:
            text = mock_text
        else:
            size = _safe_len(audio_base64)
            text = f'[MOCK STT] {language} 음성({size} bytes) 인식 결과'
        return {'text': text, 'language': language, 'provider': settings.STT_PROVIDER}


class MockTextToSpeechClient(TextToSpeechClient):
    async def speak(self, text: str, voice: str | None = None, audio_format: str | None = None) -> dict[str, Any]:
        return {
            'voice': voice or settings.DEFAULT_TTS_VOICE,
            'audio_format': (audio_format or settings.DEFAULT_AUDIO_FORMAT).lower(),
            'audio_base64': _wav_silence_base64(seconds=1.0),
            'text': text,
            'provider': settings.TTS_PROVIDER,
        }


class MockCaptionClient(CaptionClient):
    async def caption(self, image_base64: str, mime_type: str = 'image/jpeg', meta: dict[str, Any] | None = None) -> dict[str, Any]:
        meta = meta or {}
        hint = meta.get('hint') or meta.get('title') or '실내 공간'
        return {
            'caption': f'[MOCK CAPTION] {hint}이 보이는 이미지',
            'tags': meta.get('tags') or ['room', 'interior'],
            'provider': settings.CAPTION_PROVIDER,
        }


class MockObjectDetectionClient(ObjectDetectionClient):
    async def detect(self, image_base64: str, mime_type: str = 'image/jpeg', purpose: str = 'generic', meta: dict[str, Any] | None = None) -> dict[str, Any]:
        meta = meta or {}
        items = meta.get('known_items') if isinstance(meta.get('known_items'), list) else None
        if not items:
            items = ['침대', '책상', '의자'] if purpose == 'listing_options' else []
        return {
            'items': [{'name': x, 'confidence': 0.5} for x in items],
            'provider': settings.OBJECT_DETECTION_PROVIDER,
        }


class MockOCRClient(OCRClient):
    async def extract_text(self, image_base64: str, mime_type: str = 'image/jpeg', meta: dict[str, Any] | None = None) -> dict[str, Any]:
        meta = meta or {}
        return {
            'text': meta.get('ocr_text', ''),
            'provider': settings.OCR_PROVIDER,
        }


class MockSentimentClient(SentimentClient):
    POSITIVE_HINTS = ['좋', '깨끗', '조용', '추천', '친절', '만족']
    NEGATIVE_HINTS = ['별로', '시끄', '불편', '최악', '비추', '냄새']

    async def analyze(self, text: str) -> dict[str, Any]:
        pos = sum(1 for k in self.POSITIVE_HINTS if k in text)
        neg = sum(1 for k in self.NEGATIVE_HINTS if k in text)
        if pos > neg:
            label = 'positive'
            score = min(0.95, 0.55 + pos * 0.1)
        elif neg > pos:
            label = 'negative'
            score = min(0.95, 0.55 + neg * 0.1)
        else:
            label = 'neutral'
            score = 0.5
        return {'label': label, 'score': round(score, 3), 'provider': settings.SENTIMENT_PROVIDER}
