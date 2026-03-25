from __future__ import annotations

from typing import Any

from app.ibm.llm_client import LLMClient
from app.services.rag_service import RagService
from app.services.doc_service import DocService
from app.services.reco_service import RecoService
from app.services.summary_service import SummaryService
from app.services.policy_service import PolicyService
from app.services.monitoring_service import MonitoringService
from app.services.spring_tools import SpringTools
from app.services.reservation_service import ReservationService


class AgentRouter:
    """의도 분류 → (Read Tool / Write Tool) 실행 → 최종 응답.

    - Read Tool: 조회/요약/질의응답 → 바로 실행
    - Write Tool: 등록/수정/예약 → draft 생성 후 confirm 단계로 분리(기획서 원칙)
    """

    def __init__(
        self,
        llm: LLMClient,
        rag: RagService,
        doc: DocService,
        reco: RecoService,
        summary: SummaryService,
        policy: PolicyService,
        monitoring: MonitoringService,
        tools: SpringTools,
        reservation: ReservationService,
    ):
        self.llm = llm
        self.rag = rag
        self.doc = doc
        self.reco = reco
        self.summary = summary
        self.policy = policy
        self.monitoring = monitoring
        self.tools = tools
        self.reservation = reservation

    async def _classify_intent(self, instruction: str) -> str:
        system = (
            "너는 AI Agent 라우터다. 사용자의 요청을 아래 중 하나로만 분류해라(한 단어로 답):\n"
            "RAG_QUERY, DOC_WRITE, SUMMARY, RECOMMEND, POLICY_CHECK, MONITOR_VIEW_ABUSE, MONITOR_FACILITY,\n"
            "LISTING_REGISTER, FACILITY_BOOKING, NAVIGATE_POST, LOCATION_PROSCONS, CHAT\n"
            "- SUMMARY: 페이지/게시글/매물 요약\n"
            "- RAG_QUERY: 문서/첨부 기반 근거 답변\n"
            "- LISTING_REGISTER/FACILITY_BOOKING: write tool (draft->confirm)\n"
        )
        intent = (
            (
                await self.llm.chat(
                    [
                        {"role": "system", "content": system},
                        {"role": "user", "content": instruction},
                    ],
                    temperature=0.0,
                    max_new_tokens=8,
                )
            )
            .strip()
            .upper()
        )

        # 안전장치
        allowed = {
            "RAG_QUERY",
            "DOC_WRITE",
            "SUMMARY",
            "RECOMMEND",
            "POLICY_CHECK",
            "MONITOR_VIEW_ABUSE",
            "MONITOR_FACILITY",
            "LISTING_REGISTER",
            "FACILITY_BOOKING",
            "NAVIGATE_POST",
            "LOCATION_PROSCONS",
            "CHAT",
        }
        return intent if intent in allowed else "CHAT"

    async def run(
        self, user_id: str, instruction: str, extra: dict[str, Any] | None = None
    ) -> dict:
        extra = extra or {}
        intent = await self._classify_intent(instruction)

        # ===== Read tools =====
        if intent == "RAG_QUERY":
            top_k = int(extra.get("top_k", 5))
            return {
                "intent": intent,
                "data": await self.rag.answer(instruction, top_k=top_k),
            }

        if intent == "DOC_WRITE":
            doc_type = extra.get("doc_type", "보고서")
            tone = extra.get("tone", "업무용")
            length = extra.get("length", "1~2 페이지")
            return {
                "intent": intent,
                "data": {
                    "result": await self.doc.write(
                        doc_type, instruction, tone=tone, length=length
                    )
                },
            }

        if intent == "SUMMARY":
            title = extra.get("title")
            text = extra.get("text") or instruction
            bullets = int(extra.get("bullets", 5))
            return {
                "intent": intent,
                "data": await self.summary.summarize_text(title, text, bullets=bullets),
            }

        if intent == "RECOMMEND":
            candidates = extra.get("candidates", [])
            goal = extra.get("goal", "주거/매물 탐색")
            return {
                "intent": intent,
                "data": await self.reco.recommend(user_id, candidates, goal=goal),
            }

        if intent == "POLICY_CHECK":
            text = extra.get("text") or instruction
            return {"intent": intent, "data": await self.policy.check(text)}

        if intent == "MONITOR_VIEW_ABUSE":
            payload = extra.get("payload", {})
            return {
                "intent": intent,
                "data": await self.monitoring.analyze(
                    "view_abuse", payload, tone=extra.get("tone", "업무용")
                ),
            }

        if intent == "MONITOR_FACILITY":
            payload = extra.get("payload", {})
            return {
                "intent": intent,
                "data": await self.monitoring.analyze(
                    "facility_usage", payload, tone=extra.get("tone", "업무용")
                ),
            }

        if intent == "LOCATION_PROSCONS":
            # Spring이 주변 데이터(nearby)를 수집해서 extra로 넘겨주는 형태를 권장
            address = extra.get("address", "")
            nearby = extra.get("nearby", {})
            text = f"""주소/좌표: {address}
주변데이터: {nearby}
요청: {instruction}
"""
            return {
                "intent": intent,
                "data": await self.summary.summarize_text(
                    "location_proscons", text, bullets=int(extra.get("bullets", 6))
                ),
            }

        # ===== Write tools (draft -> confirm) =====
        if intent == "LISTING_REGISTER":
            # 1) draft 단계
            if not extra.get("confirm"):
                partial = extra.get("partial", {})
                draft = await self.tools.listing_register_draft(
                    utterance=instruction, partial=partial
                )
                return {
                    "intent": intent,
                    "stage": "draft",
                    "draft": draft,
                    "next": "사용자 확인(confirm=true) 후 실행",
                }

            # 2) confirm 단계 (Spring이 실행하는게 기본)
            return {
                "intent": intent,
                "stage": "confirm",
                "data": await self.tools.call(
                    "listing_register_confirm",
                    {"draft": extra.get("draft"), "confirmed": True},
                ),
            }

        if intent == "FACILITY_BOOKING":
            if not extra.get("confirm"):
                res_data = await self.reservation.analyze_reservation(
                    instruction, {"user_id": user_id}
                )

                return {
                    "intent": intent,
                    "stage": "draft",
                    "draft": res_data["analyze_result"].model_dump(),
                    "message": res_data["message"],
                    "is_available": res_data["is_available"],
                }

            else:
                booking_result = await self.tools.create_booking(
                    user_id, extra.get("draft")
                )
                return {"intent": intent, "stage": "confirm", "data": booking_result}

        if intent == "NAVIGATE_POST":
            candidates = extra.get("candidates", [])
            plan = await self.tools.navigate_to_post(
                utterance=instruction, candidates=candidates
            )
            return {"intent": intent, "data": plan}

        # ===== Default =====
        answer = await self.llm.chat(
            [{"role": "user", "content": instruction}],
            temperature=0.3,
            max_new_tokens=500,
        )
        return {"intent": "CHAT", "data": {"answer": answer}}
