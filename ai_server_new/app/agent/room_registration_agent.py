from __future__ import annotations

"""방 등록 전용 멀티턴 에이전트."""

from copy import deepcopy
from typing import Any, TypedDict

from app.agent.room_registration_parser import extract_room_slots
from app.agent.room_registration_response import (
    build_cancelled_response,
    build_collecting_response,
)
from app.agent.room_registration_slots import (
    ROOM_CREATE_INTENT,
    build_draft_payload,
    compact_text,
    find_house_match,
    get_missing_slots,
    get_next_missing_slot,
    get_room_create_context,
    is_confirm_message,
    is_deny_message,
    should_handle_room_create,
)
from app.agent.session_store import InMemorySessionStore
from app.clients.spring_room_client import SpringRoomClient
from app.services.room_service import RoomService

try:
    from langgraph.graph import END, START, StateGraph
except Exception:  # pragma: no cover - optional dependency fallback
    END = "__end__"
    START = "__start__"
    StateGraph = None


class RoomRegistrationState(TypedDict, total=False):
    """단계별 함수가 이어받는 공유 상태 객체.

    각 단계가 만든 값을 다음 단계가 그대로 이어서 쓰기 때문에
    방 등록 흐름 전체를 관통하는 작업 메모처럼 보면 된다.
    """

    session_id: str
    user_text: str
    request_meta: dict[str, Any]
    session_state: dict[str, Any]
    intent: str
    extracted_slots: dict[str, Any]
    slots: dict[str, Any]
    missing_slots: list[str]
    available_houses: list[dict[str, str]]
    room_create_allowed: bool
    reply_payload: dict[str, Any]
    completed: bool
    cancel: bool


class RoomRegistrationAgent:
    """방 등록 대화를 전담하는 규칙 기반 멀티턴 에이전트."""

    def __init__(
        self,
        service: RoomService | None = None,
        store: InMemorySessionStore | None = None,
    ):
        self.service = service or RoomService(SpringRoomClient())
        self.store = store or InMemorySessionStore()
        self.graph = self._build_graph()

    def should_handle(self, payload: dict[str, Any]) -> bool:
        """현재 요청을 범용 LLM 대신 방 등록 에이전트가 맡을지 판별한다."""

        session_id = str(payload.get("sessionId") or "")
        session_state = self.store.get(session_id)
        return should_handle_room_create(payload.get("text", ""), session_state)

    async def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        """방 등록 흐름을 실행하고 표준 응답 payload를 돌려준다."""

        state: RoomRegistrationState = {
            "session_id": str(payload.get("sessionId") or ""),
            "user_text": str(payload.get("text") or ""),
            "request_meta": payload,
        }

        state.update(self._load_session(state))
        state.update(self._detect_intent(state))
        state.update(self._extract_slots(state))
        state.update(self._validate_state(state))

        executed_payload = await self._maybe_execute_room_create(state, payload)
        if executed_payload is not None:
            reply_payload = deepcopy(executed_payload)
            reply_payload.setdefault("schemaVersion", payload.get("schemaVersion") or "v1")
            reply_payload.setdefault("sessionId", payload.get("sessionId"))
            reply_payload.setdefault("clientRequestId", payload.get("clientRequestId"))
            reply_payload.setdefault("errorCode", None)
            reply_payload.setdefault("raw", {})
            return reply_payload

        state.update(self._build_reply(state))
        state.update(self._save_session(state))

        reply_payload = deepcopy(state.get("reply_payload", {}))
        reply_payload.setdefault("schemaVersion", payload.get("schemaVersion") or "v1")
        reply_payload.setdefault("sessionId", payload.get("sessionId"))
        reply_payload.setdefault("clientRequestId", payload.get("clientRequestId"))
        reply_payload.setdefault("errorCode", None)
        reply_payload.setdefault("raw", {})
        return reply_payload

    async def _maybe_execute_room_create(
        self,
        state: RoomRegistrationState,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        if state.get("intent") != ROOM_CREATE_INTENT:
            return None
        if state.get("cancel") or not state.get("completed"):
            return None

        session_state = deepcopy(state.get("session_state", {}))
        draft_payload = build_draft_payload(session_state.get("slots", {}))

        try:
            result = await self.service.create_for_chatbot(
                schema_version=payload.get("schemaVersion") or "v1",
                session_id=payload.get("sessionId"),
                client_request_id=payload.get("clientRequestId"),
                draft_payload=draft_payload,
                access_token=str(payload.get("accessToken") or "").strip() or None,
            )
        except Exception as exc:
            session_state["completed"] = False
            failure_payload, retry_slot = self.service.build_failure_response(
                schema_version=payload.get("schemaVersion") or "v1",
                session_id=payload.get("sessionId"),
                client_request_id=payload.get("clientRequestId"),
                draft_payload=draft_payload,
                error_message=str(exc),
            )
            if retry_slot:
                slots = deepcopy(session_state.get("slots", {}))
                if retry_slot == "houseNo":
                    slots.pop("houseNo", None)
                    slots.pop("houseName", None)
                else:
                    slots.pop(retry_slot, None)
                session_state["slots"] = slots
                session_state["pending_slot"] = retry_slot
            else:
                session_state["pending_slot"] = None
            self.store.set(state.get("session_id") or "", session_state)
            return failure_payload

        self.store.delete(state.get("session_id") or "")
        return result

    def _run_sequential(self, state: RoomRegistrationState) -> RoomRegistrationState:
        """LangGraph가 없을 때도 같은 순서로 처리할 수 있게 둔 백업 경로다."""

        state.update(self._load_session(state))
        state.update(self._detect_intent(state))
        state.update(self._extract_slots(state))
        state.update(self._validate_state(state))
        state.update(self._build_reply(state))
        state.update(self._save_session(state))
        return state

    def _build_graph(self):
        """각 단계를 LangGraph 노드로 연결한다.

        지금 구조는 분기보다 "정해진 단계 파이프라인"에 가깝기 때문에
        그래프가 없어도 되지만, 나중에 검증 단계나 예외 분기가 늘어나면
        여기서 흐름을 더 쉽게 확장할 수 있다.
        """

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

    def _default_session_state(self) -> dict[str, Any]:
        """새 대화를 시작할 때 쓰는 기본 세션 상태다."""

        return {
            "intent": ROOM_CREATE_INTENT,
            "slots": {
                "roomEmptyYn": True,
                "roomStatus": "ACTIVE",
            },
            "pending_slot": None,
            "completed": False,
            "available_houses": [],
            "room_create_allowed": True,
        }

    def _get_room_create_permission(self, request_meta: dict[str, Any] | None) -> bool:
        """방 등록 권한 여부를 프론트 컨텍스트에서 읽는다.

        현재 챗봇 요청 payload에는 인증 헤더가 직접 실리지 않으므로
        프론트가 함께 보낸 `userProfile` 정보를 기준으로 1차 판별한다.
        관리자 또는 임대인만 방 등록 흐름을 이어갈 수 있다.
        """

        context = (request_meta or {}).get("context")
        if not isinstance(context, dict):
            # userProfile을 아직 보내지 않는 클라이언트도 있을 수 있다.
            # 그런 요청까지 전부 막지 않기 위해 기본값은 True로 둔다.
            return True

        user_profile = context.get("userProfile")
        if not isinstance(user_profile, dict):
            return True

        is_admin = bool(user_profile.get("isAdmin"))
        is_lessor = bool(user_profile.get("isLessor"))
        return is_admin or is_lessor

    def _apply_house_context(
        self,
        session_state: dict[str, Any],
        request_meta: dict[str, Any] | None,
    ) -> dict[str, Any]:
        """프론트 컨텍스트에 담긴 건물 정보를 세션 슬롯에 반영한다.

        핵심은 "사용자에게는 건물명으로 묻되, 내부 payload는 houseNo로 유지"다.
        그래서 현재 선택 건물이나 보유 건물 목록이 있으면 먼저 houseNo를 채우고,
        표시용으로는 houseName도 같이 저장해 둔다.
        """

        context = get_room_create_context(request_meta)
        slots = session_state.setdefault("slots", {})
        available_houses = context.get("available_houses") or session_state.get("available_houses") or []
        current_house = context.get("current_house") or {}
        # 권한 결과를 세션에 저장해 두면 같은 턴의 응답 생성과 세션 정리에서 재사용할 수 있다.
        session_state["room_create_allowed"] = self._get_room_create_permission(request_meta)

        # 프론트가 보낸 후보 건물 목록은 세션에 보관해 두어야
        # 다음 턴에서 사용자가 건물명만 말해도 houseNo로 다시 연결할 수 있다.
        session_state["available_houses"] = available_houses

        if current_house:
            if current_house.get("houseNo") and not slots.get("houseNo"):
                slots["houseNo"] = current_house["houseNo"]
            if current_house.get("houseName"):
                slots["houseName"] = current_house["houseName"]
        elif len(available_houses) == 1 and not slots.get("houseNo"):
            # 선택 가능한 건물이 하나뿐이면 굳이 다시 묻지 않고 바로 채운다.
            only_house = available_houses[0]
            if only_house.get("houseNo"):
                slots["houseNo"] = only_house["houseNo"]
            if only_house.get("houseName"):
                slots["houseName"] = only_house["houseName"]

        if slots.get("houseNo") and not slots.get("houseName"):
            # 내부 식별자만 있을 때 확인 문구가 딱딱해지지 않도록 건물명을 복원해 둔다.
            for house in available_houses:
                if house.get("houseNo") == slots.get("houseNo") and house.get("houseName"):
                    slots["houseName"] = house["houseName"]
                    break

        session_state["slots"] = slots
        return session_state

    def _load_session(self, state: RoomRegistrationState) -> dict[str, Any]:
        """기존 세션을 불러오고, 이번 요청의 프론트 컨텍스트도 덧입힌다."""

        session_id = state.get("session_id") or ""
        session_state = self.store.get(session_id) or self._default_session_state()
        session_state = self._apply_house_context(
            deepcopy(session_state),
            state.get("request_meta"),
        )
        session_state = self._normalize_pending_slot(session_state)
        return {
            "session_state": session_state,
            "available_houses": deepcopy(session_state.get("available_houses", [])),
            "room_create_allowed": bool(session_state.get("room_create_allowed", True)),
        }

    def _normalize_pending_slot(self, session_state: dict[str, Any]) -> dict[str, Any]:
        """예전 세션의 다음 질문 포인터를 현재 규칙에 맞게 보정한다."""

        slots = deepcopy(session_state.get("slots", {}))
        next_missing_slot = get_next_missing_slot(slots)
        pending_slot = session_state.get("pending_slot")

        if pending_slot != next_missing_slot:
            # 과거 순서(roomMonthly 먼저 묻기)로 저장된 세션이 남아 있어도
            # 현재 규칙의 다음 질문을 기준으로 다시 맞춘다.
            session_state["pending_slot"] = next_missing_slot

        return session_state

    def _detect_intent(self, state: RoomRegistrationState) -> dict[str, Any]:
        """현재 입력이 방 등록 흐름인지 일반 채팅인지 구분한다."""

        text = state.get("user_text", "")
        session_state = state.get("session_state", {})
        if should_handle_room_create(text, session_state):
            return {"intent": ROOM_CREATE_INTENT}
        return {"intent": "CHAT"}

    def _resolve_house_slot(
        self,
        text: str,
        slots: dict[str, Any],
        available_houses: list[dict[str, str]],
    ) -> None:
        """사용자 입력의 건물명을 houseNo로 해석해 슬롯에 반영한다."""

        if slots.get("houseNo") and slots.get("houseName"):
            return

        if slots.get("houseNo"):
            for house in available_houses:
                if house.get("houseNo") == slots.get("houseNo") and house.get("houseName"):
                    slots["houseName"] = house["houseName"]
                    return

        house_match = find_house_match(text, available_houses)
        if not house_match:
            return

        if house_match.get("houseNo"):
            slots["houseNo"] = house_match["houseNo"]
        if house_match.get("houseName"):
            slots["houseName"] = house_match["houseName"]

    def _extract_slots(self, state: RoomRegistrationState) -> dict[str, Any]:
        """사용자 입력에서 슬롯 값을 추출하고 짧은 자유 입력도 보완한다."""

        session_state = deepcopy(state.get("session_state", {}))
        slots = deepcopy(session_state.get("slots", {}))
        text = state.get("user_text", "")
        available_houses = deepcopy(session_state.get("available_houses", []))

        extracted = extract_room_slots(
            text,
            {
                **slots,
                "pending_slot": session_state.get("pending_slot"),
            },
        )
        slots.update(extracted)

        if state.get("intent") != ROOM_CREATE_INTENT:
            return {
                "session_state": session_state,
                "extracted_slots": {},
                "slots": slots,
                "available_houses": available_houses,
            }

        compact = compact_text(text)
        can_fill_free_text = not is_confirm_message(text) and not is_deny_message(text)

        # 규칙 파서가 houseNo만 바로 잡아내는 구조라서,
        # 건물명 답변은 여기서 후보 목록과 대조해 보완한다.
        self._resolve_house_slot(text, slots, available_houses)

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

        if session_state.get("pending_slot") == "houseNo" and can_fill_free_text:
            # houseNo 슬롯 차례에는 "성수스테이" 같은 자유 답변이 자주 들어오므로
            # 한 번 더 건물명 매칭을 시도한다.
            self._resolve_house_slot(text, slots, available_houses)

        session_state["slots"] = slots
        session_state["available_houses"] = available_houses
        return {
            "session_state": session_state,
            "extracted_slots": extracted,
            "slots": slots,
            "available_houses": available_houses,
        }

    def _validate_state(self, state: RoomRegistrationState) -> dict[str, Any]:
        """현재 슬롯 상태가 수집 중인지, 완료인지, 취소인지 판단한다."""

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
        """검증 결과를 바탕으로 실제 사용자 응답 payload를 만든다."""

        session_state = deepcopy(state.get("session_state", {}))

        if state.get("intent") != ROOM_CREATE_INTENT:
            return {
                "reply_payload": {
                    "reply": "방 등록 요청으로 인식하지 않았습니다.",
                    "intent": "CHAT",
                    "slots": {},
                    "action": {"name": "CHAT"},
                    "result": {},
                    "requiresConfirm": False,
                }
            }

        if not bool(session_state.get("room_create_allowed", True)):
            # 권한이 없으면 슬롯 수집을 더 진행하지 않는다.
            # 여기서 즉시 끊어야 건물명 질문이 반복되는 문제를 막을 수 있다.
            return {
                "reply_payload": {
                    "reply": "방 등록은 임대인 또는 관리자만 진행할 수 있습니다.",
                    "intent": ROOM_CREATE_INTENT,
                    "slots": {},
                    "action": {
                        "name": "ROOM_CREATE",
                        "target": "room_registration_agent",
                        "operation": "create_room",
                        "status": "forbidden",
                    },
                    "result": {
                        "missingSlots": [],
                        "draftPayload": {},
                    },
                    "requiresConfirm": False,
                }
            }

        if state.get("cancel"):
            # 취소 뒤에는 다음 시작이 자연스럽도록 방 정보만 초기화하되,
            # 현재 페이지 컨텍스트의 건물 정보는 다시 덧입혀 둔다.
            session_state["slots"] = {
                "roomEmptyYn": True,
                "roomStatus": "ACTIVE",
            }
            session_state = self._apply_house_context(
                session_state,
                state.get("request_meta"),
            )
            session_state["pending_slot"] = None
            payload = build_cancelled_response(session_state)
            return {"session_state": session_state, "reply_payload": payload}

        payload = build_collecting_response(session_state)
        return {"session_state": session_state, "reply_payload": payload}

    def _save_session(self, state: RoomRegistrationState) -> dict[str, Any]:
        """대화가 이어지면 세션을 저장하고, 끝났으면 정리한다."""

        session_id = state.get("session_id") or ""
        session_state = deepcopy(state.get("session_state", {}))

        if (
            state.get("cancel")
            or state.get("completed")
            or not bool(session_state.get("room_create_allowed", True))
        ):
            self.store.delete(session_id)
        else:
            self.store.set(session_id, session_state)
        return {}
