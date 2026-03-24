from __future__ import annotations

from app.clients.google_stt_client import GoogleCloudSTTClient
from app.clients.google_tts_client import GoogleCloudTTSClient
from app.core.config import settings


def build_stt_client():
    provider = (settings.STT_PROVIDER or 'google').strip().lower()
    if provider != 'google':
        raise RuntimeError(f'지원하지 않는 STT_PROVIDER 입니다: {provider}')
    return GoogleCloudSTTClient()


def build_tts_client():
    provider = (settings.TTS_PROVIDER or 'google').strip().lower()
    if provider != 'google':
        raise RuntimeError(f'지원하지 않는 TTS_PROVIDER 입니다: {provider}')
    return GoogleCloudTTSClient()
