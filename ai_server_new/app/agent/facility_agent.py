# app/agents/facility_agent.py
from typing import Any
from app.services.reservation_service import ReservationService
from app.schemas import ReservationAnalyzeReq
from datetime import datetime

FACILITY_KEYWORDS = (
    "예약",
    "시설",
    "공용시설",
    "예약내역",
    "예약현황",
    "예약목록",
    "시설예약",
    "공용시설예약",
    "시설현황",
    "시설분석",
)


class FacilityAgent:
    def __init__(self, service: ReservationService):
        self.service = service
        self.sessions: dict[str, dict[str, Any]] = {}

    def should_handle(self, payload: dict[str, Any]) -> bool:
        session_id = str(payload.get("userId") or payload.get("sessionId") or "")
        if session_id in self.sessions:
            return True
        text = str(payload.get("text") or "").replace(" ", "")
        print(f">>> [DEBUG] Payload Text: {text}")
        return any(kw in text for kw in FACILITY_KEYWORDS)

    async def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        session_id = str(payload.get("userId") or payload.get("sessionId") or "")
        user_text = str(payload.get("text") or "").strip()

        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "user_id": session_id,
                "house_no": None,
                "facility_no": None,
                "date": None,
                "start_time": None,
                "end_time": None,
            }

        session = self.sessions[session_id]

        if any(kw in user_text for kw in ["다른 건물", "건물 변경"]):
            session["house_no"] = None

        result = await self.service.analyze_reservation(user_text, session)

        if "extracted_fields" in result:
            for key, val in result["extracted_fields"].items():
                if val:
                    session[key] = val

        status = result.get("status")

        if status == "NEED_HOUSE_SELECT":
            return self._build_house_select_response(payload, result)

        if status == "SUCCESS_STATS":
            self._partial_clear(session_id)
            return self._build_stats_response(payload, result)

        if status == "ANALYZE_COMPLETED":
            return self._build_confirm_response(payload, result, session)

        return self._build_collecting_response(payload, result, session_id)

    def _partial_clear(self, session_id: str):
        h_no = self.sessions[session_id].get("house_no")
        self.sessions[session_id] = {"user_id": session_id, "house_no": h_no}

    def _build_house_select_response(self, payload, result):
        return {
            "schemaVersion": "v1",
            "reply": result["message"],
            "intent": "FACILITY_MANAGEMENT",
            "action": {
                "name": "SELECT_HOUSE",
                "target": "facility_agent",
                "status": "collecting",
            },
            "houses": result.get("houses"),
            "sessionId": payload.get("sessionId"),
        }

    def _build_confirm_response(self, payload, result, session):
        is_available = result.get("is_available", False)
        user_info = result.get("user_info", {})

        analyze_req = None
        if is_available and session.get("date"):
            analyze_req = ReservationAnalyzeReq(
                reservationName=user_info.get("name"),
                reservationPhone=user_info.get("phone"),
                reservationDate=datetime.strptime(session["date"], "%Y-%m-%d").date(),
                reservationStartTime=datetime.strptime(
                    session["start_time"], "%H:%M"
                ).time(),
                reservationEndTime=datetime.strptime(
                    session["end_time"], "%H:%M"
                ).time(),
                facilityNo=str(session["facility_no"]),
            )

        return {
            "schemaVersion": "v1",
            "reply": result["message"],
            "intent": "FACILITY_MANAGEMENT",
            "action": {
                "name": "CONFIRM_RESERVATION",
                "target": "facility_agent",
                "status": "confirming" if is_available else "collecting",
            },
            "analyze_result": analyze_req.dict() if analyze_req else None,
            "sessionId": payload.get("sessionId"),
        }

    def _build_stats_response(self, payload, result):
        return {
            "schemaVersion": "v1",
            "reply": result["message"],
            "intent": "FACILITY_MANAGEMENT",
            "action": {
                "name": "DISPLAY_STATS",
                "target": "facility_agent",
                "status": "done",
            },
            "data": result.get("data"),
            "options": result.get("options"),
            "sessionId": payload.get("sessionId"),
        }

    def _build_collecting_response(self, payload, result, session_id: str):
        return {
            "schemaVersion": payload.get("schemaVersion") or "v1",
            "reply": result.get("message") or "예약 정보를 다시 말씀해 주세요.",
            "intent": "FACILITY_MANAGEMENT",
            "action": {
                "name": "COLLECT_RESERVATION_INFO",
                "target": "facility_agent",
                "status": "collecting",
            },
            "result": {},
            "sessionId": payload.get("sessionId") or session_id,
            "clientRequestId": payload.get("clientRequestId"),
        }
