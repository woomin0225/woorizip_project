from __future__ import annotations

from app.clients.mock_clients import (
    MockEmbeddingClient,
    MockSpeechToTextClient,
    MockTextToSpeechClient,
    MockCaptionClient,
    MockObjectDetectionClient,
    MockOCRClient,
    MockSentimentClient,
)
from app.clients.openai_embedding_client import OpenAIEmbeddingClient
from app.clients.watson_stt_client import WatsonSpeechToTextClient
from app.clients.azure_tts_client import AzureSpeechTTSClient
from app.clients.qwen_caption_client import QwenCaptionClient
from app.clients.groundingdino_client import GroundingDINOClient
from app.clients.paddleocr_client import PaddleOCRClient
from app.clients.kobert_sentiment_client import KoBERTSentimentClient
from app.core.config import settings


def build_embedding_client():
    if settings.EMBEDDING_PROVIDER.lower() == 'openai':
        return OpenAIEmbeddingClient()
    return MockEmbeddingClient()


def build_stt_client():
    if settings.STT_PROVIDER.lower() == 'watson':
        return WatsonSpeechToTextClient()
    return MockSpeechToTextClient()


def build_tts_client():
    if settings.TTS_PROVIDER.lower() == 'azure':
        return AzureSpeechTTSClient()
    return MockTextToSpeechClient()


def build_caption_client():
    if settings.CAPTION_PROVIDER.lower() == 'qwen':
        return QwenCaptionClient()
    return MockCaptionClient()


def build_object_detection_client():
    if settings.OBJECT_DETECTION_PROVIDER.lower() == 'groundingdino':
        return GroundingDINOClient()
    return MockObjectDetectionClient()


def build_ocr_client():
    if settings.OCR_PROVIDER.lower() == 'paddleocr':
        return PaddleOCRClient()
    return MockOCRClient()


def build_sentiment_client():
    if settings.SENTIMENT_PROVIDER.lower() == 'kobert':
        return KoBERTSentimentClient()
    return MockSentimentClient()
