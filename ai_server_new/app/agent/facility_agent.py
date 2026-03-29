# app/agents/facility_agent.py
from datetime import datetime
from typing import Any

from app.schemas import ReservationAnalyzeReq
from app.services.reservation_service import ReservationService

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

    def _get_session_key(self, payload: dict[str, Any]) -> str:
        return str(payload.get("sessionId") or payload.get("userId") or "")

    def should_handle(self, payload: dict[str, Any]) -> bool:
        session_key = self._get_session_key(payload)
        if session_key in self.sessions:
            return True
        text = str(payload.get("text") or "").replace(" ", "")
        return any(kw in text for kw in FACILITY_KEYWORDS)

    async def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        session_key = self._get_session_key(payload)
        user_text = str(payload.get("text") or "").strip()
        user_id = str(payload.get("userId") or "").strip() or None

        if session_key not in self.sessions:
            self.sessions[session_key] = {
                "user_id": user_id,
                "house_no": None,
                "facility_no": None,
                "date": None,
                "start_time": None,
                "end_time": None,
            }

        session = self.sessions[session_key]
        if user_id and not session.get("user_id"):
            session["user_id"] = user_id

        if any(kw in user_text for kw in ["다른 건물", "건물 변경"]):
            session["house_no"] = None

        if not session.get("user_id"):
            return self._build_collecting_response(
                payload,
                {
                    "message": "로그인 정보를 확인한 뒤 다시 시도해 주세요.",
                    "missing": ["userId"],
                },
                session_key,
            )

        result = await self.service.analyze_reservation(user_text, session)

        if "extracted_fields" in result:
            for key, val in result["extracted_fields"].items():
                if val:
                    session[key] = val

        status = result.get("status")

        if status == "NEED_HOUSE_SELECT":
            return self._build_house_select_response(payload, result)

        if status == "SUCCESS_STATS":
            self._partial_clear(session_key)
            return self._build_stats_response(payload, result)

        if status == "ANALYZE_COMPLETED":
            return self._build_confirm_response(payload, result, session)

        return self._build_collecting_response(payload, result, session_key)

    def _partial_clear(self, session_key: str):
        user_id = self.sessions[session_key].get("user_id")
        h_no = self.sessions[session_key].get("house_no")
        self.sessions[session_key] = {"user_id": user_id, "house_no": h_no}

    def _reply_text(self, result: dict[str, Any], fallback: str) -> str:
        return str(result.get("message") or fallback).strip() or fallback

    def _build_house_select_response(self, payload, result):
        return {
            "schemaVersion": payload.get("schemaVersion") or "v1",
            "reply": self._reply_text(
                result,
                "현황을 확인할 건물을 선택해 주세요.",
            ),
            "intent": "FACILITY_MANAGEMENT",
            "action": {
                "name": "SELECT_HOUSE",
                "target": "facility_agent",
                "status": "collecting",
            },
            "result": {
                "stage": "house_select",
                "houses": result.get("houses") or [],
            },
            "requiresConfirm": False,
            "sessionId": payload.get("sessionId"),
            "clientRequestId": payload.get("clientRequestId"),
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
            "schemaVersion": payload.get("schemaVersion") or "v1",
            "reply": self._reply_text(
                result,
                "예약 정보를 다시 확인해 주세요.",
            ),
            "intent": "FACILITY_MANAGEMENT",
            "action": {
                "name": "CONFIRM_RESERVATION",
                "target": "facility_agent",
                "status": "confirming" if is_available else "collecting",
            },
            "result": {
                "stage": "confirming" if is_available else "collecting",
                "isAvailable": is_available,
                "analyzeResult": analyze_req.dict() if analyze_req else None,
                "userInfo": user_info,
                "session": {
                    "facilityNo": session.get("facility_no"),
                    "facilityName": session.get("facility_name"),
                    "date": session.get("date"),
                    "startTime": session.get("start_time"),
                    "endTime": session.get("end_time"),
                },
            },
            "requiresConfirm": False,
            "sessionId": payload.get("sessionId"),
            "clientRequestId": payload.get("clientRequestId"),
        }

    def _build_stats_response(self, payload, result):
        return {
            "schemaVersion": payload.get("schemaVersion") or "v1",
            "reply": self._reply_text(
                result,
                "시설 현황 결과를 불러왔습니다.",
            ),
            "intent": "FACILITY_MANAGEMENT",
            "action": {
                "name": "DISPLAY_STATS",
                "target": "facility_agent",
                "status": "done",
            },
            "result": {
                "stage": "done",
                "data": result.get("data"),
                "options": result.get("options"),
            },
            "requiresConfirm": False,
            "sessionId": payload.get("sessionId"),
            "clientRequestId": payload.get("clientRequestId"),
        }

    def _build_collecting_response(self, payload, result, session_id: str):
        return {
            "schemaVersion": payload.get("schemaVersion") or "v1",
            "reply": self._reply_text(
                result,
                "예약에 필요한 정보를 다시 말씀해 주세요.",
            ),
            "intent": "FACILITY_MANAGEMENT",
            "action": {
                "name": "COLLECT_FACILITY_INFO",
                "target": "facility_agent",
                "status": "collecting",
            },
            "result": {
                "stage": "collecting",
                "missing": result.get("missing") or [],
            },
            "requiresConfirm": False,
            "sessionId": payload.get("sessionId") or session_id,
            "clientRequestId": payload.get("clientRequestId"),
        }
