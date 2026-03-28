# app/services/rag.py

from __future__ import annotations

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
        # 질문 문장을 임베딩한 뒤 Qdrant에서 유사한 방을 찾습니다.
        embedded = self.embeddingClient.embed(text)

        collection_name = "room_collection"
        hits = self.vectorClient.room_query(
            collection_name=collection_name,
            point=embedded,
        )
        ranked_contexts = self._build_ranked_contexts(hits)

        results = [
            {"roomNo": context["roomNo"], "score": context["score"]}
            for context in ranked_contexts
        ]
        explanation = self._generate_explanation(text, ranked_contexts[:5])
        return {
            "results": results,
            "explanation": explanation,
        }

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

    def _generate_explanation(
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
                    "사용자에게 안내하듯 친절하고 부드러운 존댓말로 2~4문장으로 설명하라. "
                    "검색 조건과 잘 맞는 이유를 알기 쉽게 요약하고, 근거가 약한 내용은 말하지 마라."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"사용자 검색어:\n{user_query}\n\n"
                    "Qdrant 상위 검색 결과:\n"
                    f"{chr(10).join(context_lines)}\n\n"
                    "위 결과들을 바탕으로 왜 이런 방들이 검색되었는지 친절한 한국어로 설명해줘."
                ),
            },
        ]

        try:
            return str(
                self.llmClient.generate_from_messages(
                    messages,
                    max_new_tokens=180,
                    do_sample=False,
                )
            ).strip()
        except Exception:
            return ""

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
