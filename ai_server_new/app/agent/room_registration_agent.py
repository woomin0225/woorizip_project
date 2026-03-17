from __future__ import annotations

from copy import deepcopy
from typing import Any, TypedDict

from app.agent.room_registration_parser import extract_room_slots
from app.agent.room_registration_response import (
    build_cancelled_response,
    build_collecting_response,
    build_confirmed_response,
)
from app.agent.room_registration_slots import (
    ROOM_CREATE_INTENT,
    compact_text,
    get_missing_slots,
    is_confirm_message,
    is_deny_message,
    should_handle_room_create,
)
from app.agent.session_store import InMemorySessionStore

try:
    from langgraph.graph import END, START, StateGraph
except Exception:  # pragma: no cover - optional dependency fallback
    END = "__end__"
    START = "__start__"
    StateGraph = None


class RoomRegistrationState(TypedDict, total=False):
    session_id: str
    user_text: str
    request_meta: dict[str, Any]
    session_state: dict[str, Any]
    intent: str
    extracted_slots: dict[str, Any]
    slots: dict[str, Any]
    missing_slots: list[str]
    reply_payload: dict[str, Any]
    completed: bool
    cancel: bool


class RoomRegistrationAgent:
    def __init__(self, store: InMemorySessionStore | None = None):
        self.store = store or InMemorySessionStore()
        self.graph = self._build_graph()

    def should_handle(self, payload: dict[str, Any]) -> bool:
        session_id = str(payload.get("sessionId") or "")
        session_state = self.store.get(session_id)
        return should_handle_room_create(payload.get("text", ""), session_state)

    async def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        state: RoomRegistrationState = {
            "session_id": str(payload.get("sessionId") or ""),
            "user_text": str(payload.get("text") or ""),
            "request_meta": payload,
        }

        if self.graph is not None:
            result = self.graph.invoke(state)
        else:
            result = self._run_sequential(state)

        reply_payload = deepcopy(result.get("reply_payload", {}))
        reply_payload.setdefault("schemaVersion", payload.get("schemaVersion") or "v1")
        reply_payload.setdefault("sessionId", payload.get("sessionId"))
        reply_payload.setdefault("clientRequestId", payload.get("clientRequestId"))
        reply_payload.setdefault("errorCode", None)
        reply_payload.setdefault("raw", {})
        return reply_payload

    def _run_sequential(self, state: RoomRegistrationState) -> RoomRegistrationState:
        state.update(self._load_session(state))
        state.update(self._detect_intent(state))
        state.update(self._extract_slots(state))
        state.update(self._validate_state(state))
        state.update(self._build_reply(state))
        state.update(self._save_session(state))
        return state

    def _build_graph(self):
        if StateGraph is None:
            return None

        builder = StateGraph(RoomRegistrationState)
        builder.add_node("load_session", self._load_session)
        builder.add_node("detect_intent", self._detect_intent)
        builder.add_node("extract_slots", self._extract_slots)
        builder.add_node("validate_state", self._validate_state)
        builder.add_node("build_reply", self._build_reply)
        builder.add_node("save_session", self._save_session)

        builder.add_edge(START, "load_session")
        builder.add_edge("load_session", "detect_intent")
        builder.add_edge("detect_intent", "extract_slots")
        builder.add_edge("extract_slots", "validate_state")
        builder.add_edge("validate_state", "build_reply")
        builder.add_edge("build_reply", "save_session")
        builder.add_edge("save_session", END)
        return builder.compile()

    def _load_session(self, state: RoomRegistrationState) -> dict[str, Any]:
        session_id = state.get("session_id") or ""
        session_state = self.store.get(session_id)
        if not session_state:
            session_state = {
                "intent": ROOM_CREATE_INTENT,
                "slots": {
                    "roomEmptyYn": True,
                    "roomStatus": "ACTIVE",
                },
                "pending_slot": None,
                "completed": False,
            }
        return {"session_state": session_state}

    def _detect_intent(self, state: RoomRegistrationState) -> dict[str, Any]:
        text = state.get("user_text", "")
        session_state = state.get("session_state", {})
        if should_handle_room_create(text, session_state):
            return {"intent": ROOM_CREATE_INTENT}
        return {"intent": "CHAT"}

    def _extract_slots(self, state: RoomRegistrationState) -> dict[str, Any]:
        session_state = deepcopy(state.get("session_state", {}))
        slots = deepcopy(session_state.get("slots", {}))
        text = state.get("user_text", "")

        extracted = extract_room_slots(
            text,
            {
                **slots,
                "pending_slot": session_state.get("pending_slot"),
            },
        )
        slots.update(extracted)

        if state.get("intent") != ROOM_CREATE_INTENT:
            return {"session_state": session_state, "extracted_slots": {}, "slots": slots}

        compact = compact_text(text)
        can_fill_free_text = not is_confirm_message(text) and not is_deny_message(text)

        if session_state.get("pending_slot") == "roomName" and not extracted.get("roomName") and can_fill_free_text:
            if compact and len(text.strip()) <= 40:
                slots["roomName"] = text.strip()
        if session_state.get("pending_slot") == "roomFacing" and not extracted.get("roomFacing") and can_fill_free_text:
            if compact and len(text.strip()) <= 10:
                slots["roomFacing"] = text.strip()
        if session_state.get("pending_slot") == "roomAbstract" and text.strip() and can_fill_free_text:
            slots["roomAbstract"] = text.strip()
        if session_state.get("pending_slot") == "roomOptions" and text.strip() and can_fill_free_text:
            slots["roomOptions"] = text.strip().replace(" ", "")

        session_state["slots"] = slots
        return {
            "session_state": session_state,
            "extracted_slots": extracted,
            "slots": slots,
        }

    def _validate_state(self, state: RoomRegistrationState) -> dict[str, Any]:
        session_state = deepcopy(state.get("session_state", {}))
        slots = deepcopy(state.get("slots", {}))
        text = state.get("user_text", "")
        missing_slots = get_missing_slots(slots)
        completed = not missing_slots
        cancel = False

        if completed and is_confirm_message(text):
            session_state["completed"] = True
        elif completed and is_deny_message(text):
            cancel = True
            session_state["completed"] = False

        session_state["slots"] = slots
        return {
            "session_state": session_state,
            "missing_slots": missing_slots,
            "completed": bool(session_state.get("completed")),
            "cancel": cancel,
        }

    def _build_reply(self, state: RoomRegistrationState) -> dict[str, Any]:
        session_state = deepcopy(state.get("session_state", {}))
        if state.get("intent") != ROOM_CREATE_INTENT:
            return {
                "reply_payload": {
                    "reply": "\ubc29 \ub4f1\ub85d \uc694\uccad\uc73c\ub85c \uc778\uc2dd\ud558\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.",
                    "intent": "CHAT",
                    "slots": {},
                    "action": {"name": "CHAT"},
                    "result": {},
                    "requiresConfirm": False,
                }
            }

        if state.get("cancel"):
            session_state["slots"] = {
                "roomEmptyYn": True,
                "roomStatus": "ACTIVE",
            }
            session_state["pending_slot"] = None
            payload = build_cancelled_response(session_state)
            return {"session_state": session_state, "reply_payload": payload}

        if state.get("completed"):
            payload = build_confirmed_response(session_state)
            return {"reply_payload": payload}

        payload = build_collecting_response(session_state)
        return {"session_state": session_state, "reply_payload": payload}

    def _save_session(self, state: RoomRegistrationState) -> dict[str, Any]:
        session_id = state.get("session_id") or ""
        session_state = deepcopy(state.get("session_state", {}))
        if state.get("cancel") or state.get("completed"):
            self.store.delete(session_id)
        else:
            self.store.set(session_id, session_state)
        return {}
