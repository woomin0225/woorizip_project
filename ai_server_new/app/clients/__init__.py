from __future__ import annotations

from app.clients.google_stt_client import GoogleCloudSTTClient
from app.clients.google_tts_client import GoogleCloudTTSClient
from app.core.config import settings

SUPPORTED_STT_PROVIDERS = {'google'}
SUPPORTED_TTS_PROVIDERS = {'google'}


def build_stt_client():
    provider = (settings.STT_PROVIDER or 'google').strip().lower()
    if provider in SUPPORTED_STT_PROVIDERS:
        return GoogleCloudSTTClient()
    supported = ', '.join(sorted(SUPPORTED_STT_PROVIDERS))
    raise RuntimeError(
        f'지원하지 않는 STT_PROVIDER 입니다: {provider}. 지원값: {supported}'
    )


def build_tts_client():
    provider = (settings.TTS_PROVIDER or 'google').strip().lower()
    if provider in SUPPORTED_TTS_PROVIDERS:
        return GoogleCloudTTSClient()
    supported = ', '.join(sorted(SUPPORTED_TTS_PROVIDERS))
    raise RuntimeError(
        f'지원하지 않는 TTS_PROVIDER 입니다: {provider}. 지원값: {supported}'
    )
