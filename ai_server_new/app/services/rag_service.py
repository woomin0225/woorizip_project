# app/services/rag.py

from __future__ import annotations

import asyncio
from typing import Any

from app.clients.embedding_client import KureEmbeddingClient
from app.clients.qdrant_client import QdrantDbClient
from app.clients.qwen_llm_client import QwenLlmClient


class RagService:
    def __init__(
        self,
        vectorClient: QdrantDbClient,
        embeddingClient: KureEmbeddingClient,
        llmClient: QwenLlmClient | None = None,
    ):
        self.vectorClient = vectorClient
        self.embeddingClient = embeddingClient
        self.llmClient = llmClient

    async def room_rag(self, text: str) -> dict[str, Any]:
        ranked_contexts = self._search_ranked_contexts(text)
        results = [
            {"roomNo": context["roomNo"], "score": context["score"]}
            for context in ranked_contexts
        ]
        return {"results": results}

    async def room_rag_explanation(self, text: str) -> dict[str, Any]:
        ranked_contexts = self._search_ranked_contexts(text)
        explanation = await self._generate_explanation(text, ranked_contexts[:5])
        return {"explanation": explanation}

    def _search_ranked_contexts(self, text: str) -> list[dict[str, Any]]:
        # 질문 문장을 임베딩한 뒤 Qdrant에서 유사한 방을 찾습니다.
        embedded = self.embeddingClient.embed(text)
        hits = self.vectorClient.room_query(
            collection_name="room_collection",
            point=embedded,
        )
        return self._build_ranked_contexts(hits)

    def _build_ranked_contexts(self, hits: list[Any]) -> list[dict[str, Any]]:
        best: dict[str, dict[str, Any]] = {}
        for hit in hits:
            payload = hit.payload if isinstance(hit.payload, dict) else {}
            room_no = payload.get("roomNo")
            if not room_no:
                continue

            score = float(hit.score)
            current = best.get(room_no)
            if current is None or score > current["score"]:
                best[room_no] = {
                    "roomNo": room_no,
                    "score": score,
                    "payload": payload,
                }

        return sorted(best.values(), key=lambda item: item["score"], reverse=True)

    async def _generate_explanation(
        self,
        user_query: str,
        ranked_contexts: list[dict[str, Any]],
    ) -> str:
        if self.llmClient is None or not ranked_contexts:
            return ""

        context_lines = [
            self._format_context_line(index, item)
            for index, item in enumerate(ranked_contexts, start=1)
        ]
        messages = [
            {
                "role": "system",
                "content": (
                    "너는 부동산 AI 검색 결과를 설명하는 도우미다. "
                    "반드시 제공된 검색 결과 정보만 근거로 설명하고, 없는 정보는 추측하지 마라. "
                    "응답은 자연스러운 한국어만 사용하고, 영어식 표현이나 외국어 문장은 쓰지 마라. "
                    "사용자에게 안내하듯 친절하고 부드러운 존댓말로 2~3문장으로만 설명하라. "
                    "검색 조건과 잘 맞는 이유를 알기 쉽게 요약하고, 근거가 약한 내용은 말하지 마라. "
                    "검색어를 그대로 반복하며 '사용자가 ~를 검색했기 때문입니다' 같은 당연한 설명은 쓰지 마라. "
                    "불필요한 서론 없이 바로 결과의 공통점과 추천 이유부터 말하라. "
                    "각 문장은 완결된 문장으로 끝내고, 마지막 문장은 반드시 마침표로 끝내라."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"사용자 검색어:\n{user_query}\n\n"
                    "Qdrant 상위 검색 결과:\n"
                    f"{chr(10).join(context_lines)}\n\n"
                    "위 결과들을 바탕으로 이 결과들의 공통점과 추천 이유를 바로 설명해줘. "
                    "검색어를 그대로 되풀이하지 말고, 첫 문장부터 핵심 이유를 말해줘."
                ),
            },
        ]

        try:
            result = await asyncio.to_thread(
                self.llmClient.generate_from_messages,
                messages,
                100,
                False,
            )
            return self._finalize_explanation(str(result))
        except Exception:
            return ""

    def _finalize_explanation(self, text: str) -> str:
        explanation = str(text or "").strip()
        if not explanation:
            return ""

        explanation = explanation.replace("\n", " ").strip()

        sentence_endings = [".", "!", "?"]
        last_end = max(explanation.rfind(mark) for mark in sentence_endings)
        if last_end >= 0:
            explanation = explanation[: last_end + 1].strip()
        else:
            explanation = explanation.rstrip(" ,") + "."

        return explanation

    def _format_context_line(self, index: int, item: dict[str, Any]) -> str:
        payload = item.get("payload") or {}
        options = str(payload.get("roomOptions") or "").strip()
        image_summary = str(payload.get("imageSummary") or "").strip()
        review_summary = str(payload.get("reviewSummary") or "").strip()
        facility_names = payload.get("facilityNames") or []

        detail_parts = [
            f"순위 {index}",
            f"방이름={payload.get('roomName') or ''}",
            f"건물명={payload.get('houseName') or ''}",
            f"주소={payload.get('houseAddress') or ''}",
            f"거래유형={payload.get('roomMethod') or ''}",
            f"보증금={payload.get('roomDeposit') or 0}",
            f"월세={payload.get('roomMonthly') or 0}",
            f"면적={payload.get('roomArea') or 0}",
            f"여성전용={payload.get('houseFemaleLimit')}",
            f"반려동물={payload.get('housePetYn')}",
            f"엘리베이터={payload.get('houseElevatorYn')}",
            f"주차가능대수={payload.get('houseParkingMax') or 0}",
            f"옵션={options}",
            f"시설={', '.join(str(name) for name in facility_names if name)}",
            f"이미지요약={image_summary}",
            f"리뷰요약={review_summary}",
            f"유사도점수={item.get('score'):.4f}",
        ]
        return " | ".join(
            part for part in detail_parts if not part.endswith("=")
        )
