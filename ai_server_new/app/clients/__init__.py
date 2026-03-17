from __future__ import annotations

from app.clients.azure_tts_client import AzureSpeechTTSClient
from app.clients.mock_clients import MockSpeechToTextClient
from app.core.config import settings


def build_stt_client():
    return MockSpeechToTextClient()


def build_tts_client():
    provider = (settings.TTS_PROVIDER or 'mock').strip().lower()
    if provider == 'azure':
        return AzureSpeechTTSClient()
    return AzureSpeechTTSClient()