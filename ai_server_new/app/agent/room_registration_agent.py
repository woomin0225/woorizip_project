from __future__ import annotations

"""방 등록 전용 에이전트의 메인 오케스트레이터.

이 파일은 "사용자 요청 하나"를 받아서 아래 순서로 흘려보낸다.

1. 세션 상태를 불러온다.
2. 지금 요청이 정말 방 등록 대화인지 판단한다.
3. 문장에서 슬롯을 추출해 기존 상태에 합친다.
4. 아직 모자란 값이 있는지, 확인/취소 단계인지 검증한다.
5. 사용자에게 돌려줄 응답 payload를 만든다.
6. 대화가 계속되면 세션을 저장하고, 끝났으면 정리한다.

초심자 관점에서 핵심은 "에이전트"를 거대한 마법 상자로 볼 필요가 없다는 점이다.
여기서는 대부분의 흐름이 아주 명시적인 함수 단계로 쪼개져 있고,
LangGraph는 그 단계를 보기 좋게 연결해 주는 선택지일 뿐이다.
LangGraph가 없어도 같은 순서를 순차 실행으로 그대로 수행할 수 있게 작성되어 있다.
"""

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
    """방 등록 파이프라인을 흐르며 조금씩 채워지는 상태 객체.

    한 단계에서 만든 값을 다음 단계가 이어서 쓰기 때문에,
    에이전트 전체를 관통하는 "공유 작업 메모장"처럼 이해하면 편하다.
    """

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
    """방 등록 대화를 전담하는 규칙 기반 멀티턴 에이전트."""

    def __init__(self, store: InMemorySessionStore | None = None):
        # 저장소를 주입 가능하게 해 둔 이유는 테스트와 확장 때문이다.
        # 지금은 메모리 저장소를 쓰지만, 나중에 Redis 같은 외부 저장소로 바꿔도
        # 에이전트 본체의 흐름은 거의 그대로 유지할 수 있다.
        self.store = store or InMemorySessionStore()
        self.graph = self._build_graph()

    def should_handle(self, payload: dict[str, Any]) -> bool:
        """이 요청을 범용 LLM 대신 방 등록 에이전트가 먼저 가져갈지 판단한다."""

        session_id = str(payload.get("sessionId") or "")
        session_state = self.store.get(session_id)
        return should_handle_room_create(payload.get("text", ""), session_state)

    async def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        """방 등록 에이전트 한 턴을 실행한다.

        비동기 함수 형태를 쓰는 이유는 상위 서비스 인터페이스와 맞추기 위해서다.
        실제 내부 처리는 현재 동기적이지만, 추후 외부 저장소/LLM 호출이 붙어도
        상위 코드를 크게 바꾸지 않도록 인터페이스를 미리 맞춰 둔 셈이다.
        """

        state: RoomRegistrationState = {
            "session_id": str(payload.get("sessionId") or ""),
            "user_text": str(payload.get("text") or ""),
            "request_meta": payload,
        }

        # LangGraph가 설치되어 있으면 그래프 엔진으로 실행하고,
        # 그렇지 않더라도 같은 단계를 순차적으로 밟아 결과를 낼 수 있게 해 두었다.
        if self.graph is not None:
            result = self.graph.invoke(state)
        else:
            result = self._run_sequential(state)

        # 응답 표준 필드는 마지막에 한 번 더 보정해 준다.
        # 이렇게 해 두면 각 하위 단계는 본질적인 값(reply, intent, action...)에 집중하고
        # 공통 메타데이터(schemaVersion 등)는 여기서 일괄 정리할 수 있다.
        reply_payload = deepcopy(result.get("reply_payload", {}))
        reply_payload.setdefault("schemaVersion", payload.get("schemaVersion") or "v1")
        reply_payload.setdefault("sessionId", payload.get("sessionId"))
        reply_payload.setdefault("clientRequestId", payload.get("clientRequestId"))
        reply_payload.setdefault("errorCode", None)
        reply_payload.setdefault("raw", {})
        return reply_payload

    def _run_sequential(self, state: RoomRegistrationState) -> RoomRegistrationState:
        """LangGraph 없이도 동일한 흐름을 순서대로 실행하는 백업 경로."""

        state.update(self._load_session(state))
        state.update(self._detect_intent(state))
        state.update(self._extract_slots(state))
        state.update(self._validate_state(state))
        state.update(self._build_reply(state))
        state.update(self._save_session(state))
        return state

    def _build_graph(self):
        """동일한 처리 단계를 LangGraph 노드로 연결한다.

        이 그래프는 복잡한 분기형 에이전트라기보다,
        지금 단계에서는 "상태 머신처럼 읽히는 선형 파이프라인"에 가깝다.
        그래도 노드를 분리해 두면 나중에 검증/분기 단계를 늘리기 쉽다.
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

    def _load_session(self, state: RoomRegistrationState) -> dict[str, Any]:
        """기존 대화 상태를 불러오거나, 없으면 새 기본 상태를 만든다."""

        session_id = state.get("session_id") or ""
        session_state = self.store.get(session_id)
        if not session_state:
            session_state = {
                "intent": ROOM_CREATE_INTENT,
                "slots": {
                    # 아래 값들은 등록 API에 항상 기본값으로 들어가는 속성이다.
                    "roomEmptyYn": True,
                    "roomStatus": "ACTIVE",
                },
                # 직전에 어떤 슬롯을 질문했는지 기억해 두면
                # 사용자가 "1000"처럼 짧게 답했을 때도 의미를 복원할 수 있다.
                "pending_slot": None,
                "completed": False,
            }
        return {"session_state": session_state}

    def _detect_intent(self, state: RoomRegistrationState) -> dict[str, Any]:
        """현재 사용자 입력이 방 등록 흐름인지 일반 채팅인지 구분한다."""

        text = state.get("user_text", "")
        session_state = state.get("session_state", {})
        if should_handle_room_create(text, session_state):
            return {"intent": ROOM_CREATE_INTENT}
        return {"intent": "CHAT"}

    def _extract_slots(self, state: RoomRegistrationState) -> dict[str, Any]:
        """사용자 문장에서 슬롯 값을 추출해 기존 세션 상태에 반영한다."""

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

        # 방 등록 흐름이 아니면 추출값을 굳이 확장 해석하지 않고 바로 반환한다.
        if state.get("intent") != ROOM_CREATE_INTENT:
            return {"session_state": session_state, "extracted_slots": {}, "slots": slots}

        compact = compact_text(text)
        can_fill_free_text = not is_confirm_message(text) and not is_deny_message(text)

        # 규칙 파서가 잡지 못한 짧은 자유 입력을 보완하는 구간이다.
        # 예를 들어 방 이름은 꼭 "방이름: 햇살방"처럼 말하지 않고 그냥 "햇살방"만 말할 수 있다.
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
        """현재 슬롯 상태가 수집 중인지, 완료인지, 취소인지 판단한다."""

        session_state = deepcopy(state.get("session_state", {}))
        slots = deepcopy(state.get("slots", {}))
        text = state.get("user_text", "")
        missing_slots = get_missing_slots(slots)
        completed = not missing_slots
        cancel = False

        # 모든 필수 슬롯이 모인 다음에는 사용자의 마지막 의사표현이 중요하다.
        # "확인"이면 완료, "취소/수정"이면 종료 또는 재수정 흐름으로 보낸다.
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
        """검증 결과를 바탕으로 실제 사용자 응답 payload를 조립한다."""

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

        if state.get("cancel"):
            # 취소 시에는 이전에 모았던 슬롯을 비우고 새로 시작할 수 있게 만든다.
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
        """대화가 계속되면 세션을 저장하고, 끝났으면 정리한다."""

        session_id = state.get("session_id") or ""
        session_state = deepcopy(state.get("session_state", {}))

        # 완료/취소가 났다면 더 이상 이어질 대화가 아니므로 세션을 제거한다.
        if state.get("cancel") or state.get("completed"):
            self.store.delete(session_id)
        else:
            self.store.set(session_id, session_state)
        return {}
