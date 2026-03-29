from __future__ import annotations

from app.clients.mock_clients import MockSentimentClient
from app.clients.protocols import SentimentClient


class KoBERTSentimentClient(SentimentClient):
    """KoBERT 연동 자리. 기본은 Mock fallback."""

    def __init__(self):
        self._fallback = MockSentimentClient()

    async def analyze(self, text: str) -> dict:
        return await self._fallback.analyze(text)
