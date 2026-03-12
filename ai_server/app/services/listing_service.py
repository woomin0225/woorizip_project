from __future__ import annotations

from typing import Any

from app.clients.protocols import EmbeddingClient
from app.ibm.llm_client import LLMClient
from app.store.vector_store import VectorStore


class ListingService:
    """매물 검색/인덱싱/추천용 통합 서비스.
    - 방 등록/수정 시 검색용 텍스트를 만들고 벡터화
    - 자연어 검색은 DB 필터 결과(candidates)를 입력받아 재랭킹/설명 생성
    """

    def __init__(self, llm: LLMClient, embeddings: EmbeddingClient, store: VectorStore):
        self.llm = llm
        self.embeddings = embeddings
        self.store = store

    @staticmethod
    def build_search_text(
        room: dict[str, Any],
        image_summaries: list[dict[str, Any]] | None = None,
        review_summary: dict[str, Any] | None = None,
    ) -> str:
        image_summaries = image_summaries or []
        parts = [
            f"title: {room.get('title','')}",
            f"location: {room.get('location','')}",
            f"deposit: {room.get('deposit','')}",
            f"rent: {room.get('rent','')}",
            f"room_type: {room.get('room_type','')}",
            f"options: {', '.join(room.get('options', [])) if isinstance(room.get('options'), list) else room.get('options','')}",
            f"description: {room.get('description','')}",
        ]
        for img in image_summaries:
            cap = img.get('caption', '')
            items = ', '.join([x.get('name', '') for x in img.get('detected_items', [])])
            ocr = img.get('ocr_text', '')
            parts.append(f'image_caption: {cap}')
            if items:
                parts.append(f'image_items: {items}')
            if ocr:
                parts.append(f'image_ocr: {ocr}')
        if review_summary:
            parts.append(f"review_summary: {review_summary.get('summary','')}")
            parts.append(f"review_sentiment: {review_summary.get('sentiment_breakdown',{})}")
        return '\n'.join([p for p in parts if p and not p.endswith(': ')])

    async def index_room(
        self,
        room_id: str,
        room: dict[str, Any],
        image_summaries: list[dict[str, Any]] | None = None,
        review_summary: dict[str, Any] | None = None,
        meta: dict[str, Any] | None = None,
    ) -> dict:
        text = self.build_search_text(room, image_summaries=image_summaries, review_summary=review_summary)
        vec = (await self.embeddings.embed([text]))[0]
        self.store.upsert(
            ids=[f'room:{room_id}'],
            embeddings=[vec],
            documents=[text],
            metadatas=[{'entity_type': 'room', 'room_id': room_id, **(meta or {})}],
        )
        return {'room_id': room_id, 'indexed': True, 'document_preview': text[:500]}

    async def search_rooms(
        self,
        query: str,
        filters: dict[str, Any] | None = None,
        candidates: list[dict[str, Any]] | None = None,
        top_k: int = 5,
    ) -> dict:
        """초기 개발용 하이브리드 구조.
        1) Spring이 필터 SQL 결과(candidates)를 줄 수 있음
        2) FastAPI는 의미 질의 기반 설명/재정렬 수행
        """
        filters = filters or {}
        candidates = candidates or []
        if not candidates:
            # DB 후보가 없으면 벡터 스토어에서 room 후보를 식별
            qvec = (await self.embeddings.embed([query]))[0]
            hits = self.store.query(qvec, top_k=top_k)
            metas = hits.get('metadatas', [[]])[0]
            docs = hits.get('documents', [[]])[0]
            candidates = [
                {'room_id': m.get('room_id'), 'search_text': docs[i], 'meta': m}
                for i, m in enumerate(metas)
                if m.get('entity_type') == 'room'
            ]

        prompt = f"""사용자 매물 검색 요청을 요약하고, 후보를 상위 {top_k}개로 정렬해줘.
QUERY: {query}
FILTERS: {filters}
CANDIDATES: {candidates}
출력은 한국어로 하고, 각 후보마다 추천 이유 1~2줄과 주의점이 있으면 같이 적어줘.
"""
        explanation = await self.llm.chat([{'role': 'user', 'content': prompt}], temperature=0.2, max_new_tokens=700)
        return {'query': query, 'filters': filters, 'count': len(candidates), 'candidates': candidates[:top_k], 'explanation': explanation}
