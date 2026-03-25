from __future__ import annotations

from copy import deepcopy
from typing import Any, TypedDict

from app.agent.session_store import InMemorySessionStore
from app.schemas import TourWorkflowApplyReq
from app.services.tour_service import TourService

TOUR_APPLY_INTENT = "TOUR_APPLY"

TOUR_APPLY_KEYWORDS = (
    "투어신청",
    "투어 신청",
    "투어예약",
    "투어 예약",
    "방보러",
    "방 보러",
    "방보러가",
    "방 보고",
    "방문예약",
    "방문 예약",
)

CANCEL_KEYWORDS = ("취소", "그만", "중지", "아니요", "아니")


def _compact_text(value: Any) -> str:
    return str(value or "").strip()


def _compact_no_space(value: Any) -> str:
    return _compact_text(value).lower().replace(" ", "")


def _is_tour_apply_message(text: str) -> bool:
    compact = _compact_no_space(text)
    if not compact:
        return False
    return any(keyword.replace(" ", "") in compact for keyword in TOUR_APPLY_KEYWORDS)


def _is_cancel_message(text: str) -> bool:
    compact = _compact_no_space(text)
    if not compact:
        return False
    return any(keyword in compact for keyword in CANCEL_KEYWORDS)


class TourApplyState(TypedDict, total=False):
    session_id: str
    user_text: str
    request_meta: dict[str, Any]
    session_state: dict[str, Any]
    reply_payload: dict[str, Any]


class TourApplyAgent:
    def __init__(
        self,
        service: TourService,
        store: InMemorySessionStore | None = None,
    ):
        self.service = service
        self.store = store or InMemorySessionStore()

    def should_handle(self, payload: dict[str, Any]) -> bool:
        session_id = str(payload.get("sessionId") or "")
        session_state = self.store.get(session_id)
        if session_state.get("intent") == TOUR_APPLY_INTENT:
            return True

        text = str(payload.get("text") or "")
        return _is_tour_apply_message(text)

    async def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        session_id = str(payload.get("sessionId") or "")
        session_state = self.store.get(session_id) or self._default_session_state()
        session_state = self._apply_request_context(session_state, payload)

        user_text = str(payload.get("text") or "").strip()

        if _is_cancel_message(user_text):
            self.store.delete(session_id)
            return self._build_cancelled_response(payload)

        if not session_state.get("roomNo"):
            self.store.delete(session_id)
            return self._build_missing_room_response(payload)

        session_state["intent"] = TOUR_APPLY_INTENT

        if session_state.get("stage") == "awaiting_user_name":
            if self.service.looks_like_name_input(user_text):
                session_state["userName"] = user_text
                session_state["stage"] = ""
            else:
                self.store.set(session_id, session_state)
                return self._build_collect_name_response(
                    payload,
                    session_state,
                    invalid_input=bool(user_text),
                )

        if session_state.get("stage") == "awaiting_user_phone":
            if self.service.looks_like_phone_input(user_text):
                session_state["userPhone"] = self.service.normalize_phone_input(user_text)
                session_state["stage"] = ""
            else:
                self.store.set(session_id, session_state)
                return self._build_collect_phone_response(
                    payload,
                    session_state,
                    invalid_input=bool(user_text),
                )

        if not session_state.get("preferredVisitAt"):
            merged_schedule = self.service.merge_schedule_input(
                existing_visit_date=session_state.get("visitDate"),
                existing_visit_time=session_state.get("visitTime"),
                user_input=user_text,
            )
            has_schedule_signal = bool(
                merged_schedule.get("visitDate")
                or merged_schedule.get("visitTime")
                or self.service.looks_like_schedule_input(user_text)
            )
            if not has_schedule_signal:
                session_state["stage"] = "awaiting_visit_at"
                self.store.set(session_id, session_state)
                return self._build_collecting_response(payload, session_state)

            session_state["visitDate"] = merged_schedule.get("visitDate", "")
            session_state["visitTime"] = merged_schedule.get("visitTime", "")
            session_state["preferredVisitAt"] = merged_schedule.get("preferredVisitAt", "")

            if not session_state.get("preferredVisitAt"):
                session_state["stage"] = "awaiting_visit_at"
                self.store.set(session_id, session_state)
                return self._build_collecting_response(payload, session_state)

        if not session_state.get("userName"):
            session_state["stage"] = "awaiting_user_name"
            self.store.set(session_id, session_state)
            return self._build_collect_name_response(payload, session_state)

        if not session_state.get("userPhone"):
            session_state["stage"] = "awaiting_user_phone"
            self.store.set(session_id, session_state)
            return self._build_collect_phone_response(payload, session_state)

        try:
            result = await self.service.apply_for_chatbot(
                TourWorkflowApplyReq(
                    schemaVersion=payload.get("schemaVersion") or "v1",
                    sessionId=payload.get("sessionId"),
                    clientRequestId=payload.get("clientRequestId"),
                    roomNo=session_state["roomNo"],
                    roomName=session_state.get("roomName"),
                    visitDate=session_state.get("visitDate"),
                    visitTime=session_state.get("visitTime"),
                    preferredVisitAt=session_state.get("preferredVisitAt"),
                    userName=session_state.get("userName"),
                    userPhone=session_state.get("userPhone"),
                ),
                access_token=str(payload.get("accessToken") or "").strip() or None,
                default_user_name=session_state.get("userName"),
                default_user_phone=session_state.get("userPhone"),
            )
            if result.get("errorCode") == "TOUR_APPLY_FAILED":
                session_state["stage"] = "awaiting_visit_at"
                self.store.set(session_id, session_state)
                return self._build_retry_response(
                    payload,
                    session_state,
                    str(result.get("raw", {}).get("error") or result.get("reply") or ""),
                )
            self.store.delete(session_id)
            return result
        except Exception:
            session_state["stage"] = "awaiting_visit_at"
            self.store.set(session_id, session_state)
            return self._build_collecting_response(payload, session_state)

    def _default_session_state(self) -> dict[str, Any]:
        return {
            "intent": TOUR_APPLY_INTENT,
            "roomNo": "",
            "roomName": "",
            "userName": "",
            "userPhone": "",
            "visitDate": "",
            "visitTime": "",
            "preferredVisitAt": "",
            "stage": "awaiting_visit_at",
        }

    def _apply_request_context(
        self,
        session_state: dict[str, Any],
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        next_state = deepcopy(session_state)
        context = payload.get("context")
        if isinstance(context, dict):
            room_no = _compact_text(context.get("roomNo"))
            room_name = _compact_text(context.get("roomName"))
            if room_no:
                next_state["roomNo"] = room_no
            if room_name:
                next_state["roomName"] = room_name

            user_profile = context.get("userProfile")
            if isinstance(user_profile, dict):
                user_name = _compact_text(user_profile.get("userName"))
                user_phone = _compact_text(user_profile.get("userPhone"))
                if user_name:
                    next_state["userName"] = user_name
                if user_phone:
                    next_state["userPhone"] = user_phone

        return next_state

    def _build_collecting_response(
        self,
        payload: dict[str, Any],
        session_state: dict[str, Any],
    ) -> dict[str, Any]:
        room_label = session_state.get("roomName") or "현재 보고 계신 방"
        visit_date = session_state.get("visitDate", "")
        visit_time = session_state.get("visitTime", "")
        if visit_date and not visit_time:
            schedule_guide = (
                f"희망 방문 날짜는 {visit_date}로 확인했어요.\n"
                "이제 방문 시간을 알려주세요.\n"
            )
        elif visit_time and not visit_date:
            schedule_guide = (
                f"희망 방문 시간은 {visit_time[:5]}로 확인했어요.\n"
                "이제 방문 날짜를 알려주세요.\n"
            )
        else:
            schedule_guide = "방문하실 날짜와 시간을 알려주세요.\n"
        return {
            "schemaVersion": payload.get("schemaVersion") or "v1",
            "reply": (
                f"{room_label} 투어 신청을 이어서 도와드릴게요.\n"
                f"{schedule_guide}"
            ),
            "intent": TOUR_APPLY_INTENT,
            "slots": {
                "roomNo": session_state.get("roomNo", ""),
                "roomName": session_state.get("roomName", ""),
                "visitDate": session_state.get("visitDate", ""),
                "visitTime": session_state.get("visitTime", ""),
                "preferredVisitAt": session_state.get("preferredVisitAt", ""),
            },
            "action": {
                "name": TOUR_APPLY_INTENT,
                "target": "tour_apply_agent",
                "status": "collecting",
            },
            "result": {
                "stage": "awaiting_visit_at",
                "missingSlots": self._schedule_missing_slots(session_state),
            },
            "errorCode": None,
            "requiresConfirm": False,
            "sessionId": payload.get("sessionId"),
            "clientRequestId": payload.get("clientRequestId"),
            "raw": {"agent": "tour_apply_agent"},
        }

    def _build_retry_response(
        self,
        payload: dict[str, Any],
        session_state: dict[str, Any],
        error_message: str,
    ) -> dict[str, Any]:
        room_label = session_state.get("roomName") or "현재 보고 계신 방"
        visit_date = session_state.get("visitDate", "")
        if visit_date:
            retry_guide = (
                f"날짜는 {visit_date}로 저장되어 있어요. 가능한 방문 시간을 다시 알려주세요.\n"
            )
        else:
            retry_guide = "방문 희망 날짜와 시간을 한 번 더 알려주세요.\n"
        return {
            "schemaVersion": payload.get("schemaVersion") or "v1",
            "reply": (
                f"{room_label} 투어 신청을 이어서 도와드릴게요.\n"
                f"{retry_guide}"
            ),
            "intent": TOUR_APPLY_INTENT,
            "slots": {
                "roomNo": session_state.get("roomNo", ""),
                "roomName": session_state.get("roomName", ""),
                "visitDate": session_state.get("visitDate", ""),
                "visitTime": session_state.get("visitTime", ""),
                "preferredVisitAt": session_state.get("preferredVisitAt", ""),
            },
            "action": {
                "name": TOUR_APPLY_INTENT,
                "target": "tour_apply_agent",
                "status": "retry",
            },
            "result": {
                "stage": "awaiting_visit_at",
                "missingSlots": self._schedule_missing_slots(session_state),
            },
            "errorCode": error_message or "TOUR_APPLY_INVALID_SCHEDULE",
            "requiresConfirm": False,
            "sessionId": payload.get("sessionId"),
            "clientRequestId": payload.get("clientRequestId"),
            "raw": {"agent": "tour_apply_agent", "error": error_message},
        }

    def _build_collect_name_response(
        self,
        payload: dict[str, Any],
        session_state: dict[str, Any],
        *,
        invalid_input: bool = False,
    ) -> dict[str, Any]:
        room_label = session_state.get("roomName") or "현재 보고 계신 방"
        prefix = "이름을 다시 알려주세요.\n" if invalid_input else ""
        return {
            "schemaVersion": payload.get("schemaVersion") or "v1",
            "reply": (
                f"{room_label} 투어 신청을 이어서 도와드릴게요.\n"
                f"{prefix}"
                "신청자 이름을 알려주세요."
            ),
            "intent": TOUR_APPLY_INTENT,
            "slots": {
                "roomNo": session_state.get("roomNo", ""),
                "roomName": session_state.get("roomName", ""),
                "visitDate": session_state.get("visitDate", ""),
                "visitTime": session_state.get("visitTime", ""),
                "preferredVisitAt": session_state.get("preferredVisitAt", ""),
            },
            "action": {
                "name": TOUR_APPLY_INTENT,
                "target": "tour_apply_agent",
                "status": "collecting",
            },
            "result": {
                "stage": "awaiting_user_name",
                "missingSlots": ["userName"],
            },
            "errorCode": None,
            "requiresConfirm": False,
            "sessionId": payload.get("sessionId"),
            "clientRequestId": payload.get("clientRequestId"),
            "raw": {"agent": "tour_apply_agent"},
        }

    def _build_collect_phone_response(
        self,
        payload: dict[str, Any],
        session_state: dict[str, Any],
        *,
        invalid_input: bool = False,
    ) -> dict[str, Any]:
        room_label = session_state.get("roomName") or "현재 보고 계신 방"
        prefix = (
            "전화번호 형식이 올바르지 않아요.\n숫자 10~11자리로 다시 알려주세요.\n"
            if invalid_input
            else ""
        )
        return {
            "schemaVersion": payload.get("schemaVersion") or "v1",
            "reply": (
                f"{room_label} 투어 신청을 이어서 도와드릴게요.\n"
                f"{prefix}"
                "연락받으실 전화번호를 알려주세요.\n"
                "예: 01012341234"
            ),
            "intent": TOUR_APPLY_INTENT,
            "slots": {
                "roomNo": session_state.get("roomNo", ""),
                "roomName": session_state.get("roomName", ""),
                "visitDate": session_state.get("visitDate", ""),
                "visitTime": session_state.get("visitTime", ""),
                "preferredVisitAt": session_state.get("preferredVisitAt", ""),
                "userName": session_state.get("userName", ""),
            },
            "action": {
                "name": TOUR_APPLY_INTENT,
                "target": "tour_apply_agent",
                "status": "collecting",
            },
            "result": {
                "stage": "awaiting_user_phone",
                "missingSlots": ["userPhone"],
            },
            "errorCode": None,
            "requiresConfirm": False,
            "sessionId": payload.get("sessionId"),
            "clientRequestId": payload.get("clientRequestId"),
            "raw": {"agent": "tour_apply_agent"},
        }

    def _build_missing_room_response(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {
            "schemaVersion": payload.get("schemaVersion") or "v1",
            "reply": "투어 신청은 방 상세페이지에서 다시 시작해 주세요.",
            "intent": "CHAT",
            "slots": {},
            "action": {"name": "CHAT"},
            "result": {},
            "errorCode": None,
            "requiresConfirm": False,
            "sessionId": payload.get("sessionId"),
            "clientRequestId": payload.get("clientRequestId"),
            "raw": {"agent": "tour_apply_agent"},
        }

    def _build_cancelled_response(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {
            "schemaVersion": payload.get("schemaVersion") or "v1",
            "reply": "투어 신청을 취소했어요. 원하시면 다시 말씀해 주세요.",
            "intent": TOUR_APPLY_INTENT,
            "slots": {},
            "action": {
                "name": TOUR_APPLY_INTENT,
                "target": "tour_apply_agent",
                "status": "cancelled",
            },
            "result": {},
            "errorCode": None,
            "requiresConfirm": False,
            "sessionId": payload.get("sessionId"),
            "clientRequestId": payload.get("clientRequestId"),
            "raw": {"agent": "tour_apply_agent"},
        }

    def _schedule_missing_slots(self, session_state: dict[str, Any]) -> list[str]:
        missing_slots: list[str] = []
        if not session_state.get("visitDate"):
            missing_slots.append("visitDate")
        if not session_state.get("visitTime"):
            missing_slots.append("visitTime")
        return missing_slots or ["preferredVisitAt"]
