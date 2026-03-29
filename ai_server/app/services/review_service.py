from __future__ import annotations

from collections import Counter
from typing import Any

from app.clients.protocols import SentimentClient, EmbeddingClient
from app.ibm.llm_client import LLMClient
from app.store.vector_store import VectorStore


class ReviewService:
    def __init__(self, llm: LLMClient, sentiment: SentimentClient, embeddings: EmbeddingClient, store: VectorStore):
        self.llm = llm
        self.sentiment = sentiment
        self.embeddings = embeddings
        self.store = store

    async def analyze_review(self, room_id: str, review_id: str, text: str, ingest: bool = False, meta: dict[str, Any] | None = None) -> dict:
        result = await self.sentiment.analyze(text)
        payload = {'room_id': room_id, 'review_id': review_id, 'text': text, **result}
        if ingest:
            vec = (await self.embeddings.embed([text]))[0]
            self.store.upsert(
                ids=[f'review:{review_id}'],
                embeddings=[vec],
                documents=[text],
                metadatas=[{'entity_type': 'review', 'room_id': room_id, 'review_id': review_id, **(meta or {})}],
            )
        return payload

    async def summarize_room_reviews(self, room_id: str, reviews: list[dict[str, Any]], room_meta: dict[str, Any] | None = None) -> dict:
        labels = Counter([r.get('label', 'unknown') for r in reviews])
        prompt = f"""다음은 특정 방의 리뷰 목록이다. 장점/단점/추천대상/주의사항으로 요약해줘.
ROOM_ID: {room_id}
ROOM_META: {room_meta or {}}
REVIEWS: {reviews}
"""
        summary = await self.llm.chat([{'role': 'user', 'content': prompt}], temperature=0.25, max_new_tokens=700)
        return {
            'room_id': room_id,
            'review_count': len(reviews),
            'sentiment_breakdown': dict(labels),
            'summary': summary,
        }
