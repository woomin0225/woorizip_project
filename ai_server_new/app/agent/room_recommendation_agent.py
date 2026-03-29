from __future__ import annotations

from copy import deepcopy
import re
from typing import Any

from app.agent.session_store import InMemorySessionStore
from app.services.room_recommendation_service import (
    RoomRecommendationService,
    build_room_search_request,
    compact_no_space,
    default_room_request,
    format_recommended_rooms_message,
    has_room_preference,
    is_cancel_message,
    is_room_follow_up_message,
    is_room_recommendation_request,
    pick_room_from_recommendations,
)


ROOM_RECOMMEND_INTENT = "ROOM_RECOMMEND"


class RoomRecommendationAgent:
    def __init__(
        self,
        service: RoomRecommendationService | None = None,
        store: InMemorySessionStore | None = None,
    ):
        self.service = service or RoomRecommendationService()
        self.store = store or InMemorySessionStore()

    def should_handle(self, payload: dict[str, Any]) -> bool:
        session_id = self._get_session_id(payload)
        session_state = self.store.get(session_id)
        text = str(payload.get("text") or "").strip()
        current_request = build_room_search_request(text)

        if session_state.get("intent") == ROOM_RECOMMEND_INTENT:
            return is_room_follow_up_message(
                text,
                has_last_rooms=bool(session_state.get("lastRooms")),
                awaiting_preference=bool(session_state.get("awaitingPreference")),
                has_active_request=has_room_preference(session_state.get("request")),
                current_request=current_request,
            )

        path = self._get_path(payload)
        return is_room_recommendation_request(text) or (
            path == "/rooms" and has_room_preference(current_request)
        )

    async def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        session_id = self._get_session_id(payload)
        session_state = self.store.get(session_id) or self._default_session_state()

        user_text = str(payload.get("text") or "").strip()
        path = self._get_path(payload)
        explicit_request = is_room_recommendation_request(user_text)
        current_request = build_room_search_request(user_text)
        current_has_preference = has_room_preference(current_request)
        active_request = session_state.get("request")
        has_active_request = has_room_preference(active_request)
        last_rooms = session_state.get("lastRooms") or []
        detail_preference_notice = self._build_detail_preference_notice(
            payload,
            current_request,
        )

        if is_cancel_message(user_text) and (
            session_state.get("awaitingPreference") or last_rooms
        ):
            self.store.delete(session_id)
            return self._build_response(
                payload,
                reply="방 추천을 잠시 멈출게요. 다시 원하시면 원하는 조건과 함께 말씀해 주세요.",
                status="cancelled",
                rooms=[],
                awaiting_preference=False,
            )

        selected_room = None
        if not current_has_preference:
            selected_room = pick_room_from_recommendations(user_text, last_rooms)
        if selected_room:
            session_state["selectedRoomNo"] = selected_room.get("roomNo")
            session_state["stage"] = "selected"
            self.store.set(session_id, session_state)
            return self._build_response(
                payload,
                reply=(
                    f"{selected_room.get('roomName') or '선택한 방'} 상세보기 페이지로 이동할게요. "
                    "사진, 가격, 후기와 투어 정보를 확인할 수 있습니다."
                ),
                status="selected",
                rooms=last_rooms,
                awaiting_preference=False,
                action_name="NAVIGATE",
                action_path=f"/rooms/{selected_room.get('roomNo')}",
                selected_room=selected_room,
                session_state=session_state,
            )

        should_navigate_to_rooms = path != "/rooms"

        if not current_has_preference and not has_active_request:
            session_state["awaitingPreference"] = True
            session_state["stage"] = "collecting"
            self.store.set(session_id, session_state)
            return self._build_response(
                payload,
                reply=(
                    "원하는 방 조건을 먼저 알려주세요.\n"
                    "예를 들면 전세나 월세, 보증금이나 월세 예산, 1인실 또는 2인실, 원하는 지역, "
                    "저렴한 방이나 넓은 방 같은 선호를 말씀해 주시면 바로 추천해 드릴게요."
                ),
                status="collecting",
                rooms=last_rooms,
                awaiting_preference=True,
                action_name="NAVIGATE" if should_navigate_to_rooms else "방찾기",
                action_path="/rooms" if should_navigate_to_rooms else None,
                session_state=session_state,
            )

        recommendation = await self.service.recommend(
            user_text,
            base_request=active_request,
            previous_rooms=last_rooms,
        )
        rooms = recommendation.get("rooms") or []
        search_mode = recommendation.get("searchMode") or "natural"
        recommendation_message = str(recommendation.get("message") or "").strip()
        preserve_previous_rooms = bool(recommendation.get("preservePreviousRooms"))
        should_preserve_previous_rooms = preserve_previous_rooms or (
            bool(last_rooms) and not explicit_request
        )

        session_state["request"] = deepcopy(
            recommendation.get("request") or default_room_request()
        )
        session_state["lastQuery"] = str(recommendation.get("query") or user_text).strip()
        session_state["lastRooms"] = rooms or (
            last_rooms if should_preserve_previous_rooms else []
        )
        session_state["selectedRoomNo"] = None
        session_state["awaitingPreference"] = False
        session_state["stage"] = "done" if rooms else "empty"
        self.store.set(session_id, session_state)

        if not rooms:
            reply = (
                recommendation_message
                or "조건에 맞는 방을 아직 찾지 못했어요.\n"
                "지역이나 예산을 조금 넓히거나 방 종류를 바꿔서 다시 말씀해 주시면 다시 찾아볼게요."
            )
            if detail_preference_notice:
                reply = f"{detail_preference_notice}\n{reply}"
            if should_preserve_previous_rooms and last_rooms and not detail_preference_notice:
                reply = (
                    f"{reply}\n"
                    '아까 추천드린 방은 그대로 볼 수 있어요. "1번 방 자세히 보여줘"처럼 이어서 선택해 주세요.'
                )
            return self._build_response(
                payload,
                reply=reply,
                status="empty",
                rooms=[],
                awaiting_preference=False,
                search_mode=search_mode,
                action_name="NAVIGATE" if should_navigate_to_rooms else "방찾기",
                action_path="/rooms" if should_navigate_to_rooms else None,
                session_state=session_state,
            )

        reply_prefix = (
            "방찾기 페이지로 이동하면서 이 조건으로 바로 추천해 드릴게요.\n"
            if should_navigate_to_rooms
            else "조건에 맞춰 추천한 방입니다.\n"
        )
        return self._build_response(
            payload,
            reply=(
                f"{detail_preference_notice + chr(10) if detail_preference_notice else ''}"
                f"{reply_prefix}"
                f"{format_recommended_rooms_message(rooms)}\n\n"
                '마음에 드는 방이 있으면 "1번 방 자세히 보여줘", "그 방 들어가줘", '
                '"더 싼 걸로"처럼 이어서 말씀해 주세요.'
            ),
            status="done",
            rooms=rooms,
            awaiting_preference=False,
            search_mode=search_mode,
            action_name="NAVIGATE" if should_navigate_to_rooms else "방찾기",
            action_path="/rooms" if should_navigate_to_rooms else None,
            session_state=session_state,
        )

    def _build_response(
        self,
        payload: dict[str, Any],
        *,
        reply: str,
        status: str,
        rooms: list[dict[str, Any]],
        awaiting_preference: bool,
        search_mode: str | None = None,
        action_name: str = "방찾기",
        action_path: str | None = None,
        selected_room: dict[str, Any] | None = None,
        session_state: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        action = {
            "name": action_name,
            "target": "room_recommendation_agent",
            "status": status,
        }
        if action_path:
            action["path"] = action_path

        return {
            "schemaVersion": payload.get("schemaVersion") or "v1",
            "reply": reply,
            "intent": ROOM_RECOMMEND_INTENT,
            "action": action,
            "result": {
                "rooms": rooms,
                "awaitingPreference": awaiting_preference,
                "searchMode": search_mode,
                "stage": status,
                "selectedRoom": selected_room,
                "session": self._serialize_session_state(session_state),
            },
            "requiresConfirm": False,
            "sessionId": payload.get("sessionId"),
            "clientRequestId": payload.get("clientRequestId"),
            "raw": {},
        }

    def _default_session_state(self) -> dict[str, Any]:
        return {
            "intent": ROOM_RECOMMEND_INTENT,
            "awaitingPreference": False,
            "stage": "idle",
            "lastQuery": "",
            "request": default_room_request(),
            "lastRooms": [],
            "selectedRoomNo": None,
        }

    def _serialize_session_state(
        self,
        session_state: dict[str, Any] | None,
    ) -> dict[str, Any]:
        state = session_state or {}
        return {
            "stage": state.get("stage"),
            "lastQuery": state.get("lastQuery"),
            "selectedRoomNo": state.get("selectedRoomNo"),
            "request": deepcopy(state.get("request") or default_room_request()),
        }

    def _get_session_id(self, payload: dict[str, Any]) -> str:
        return str(payload.get("sessionId") or payload.get("userId") or "")

    def _get_path(self, payload: dict[str, Any]) -> str:
        context = payload.get("context")
        if not isinstance(context, dict):
            return ""
        return str(context.get("path") or "")

    def _is_room_detail_path(self, path: str) -> bool:
        return bool(re.match(r"^/rooms/[^/]+(?:/(?:tour|contract))?$", str(path or "")))

    def _build_detail_preference_notice(
        self,
        payload: dict[str, Any],
        current_request: dict[str, Any],
    ) -> str | None:
        path = self._get_path(payload)
        if not self._is_room_detail_path(path):
            return None

        cond = (current_request or {}).get("cond") or {}
        if not cond.get("houseFemaleLimit"):
            return None

        context = payload.get("context")
        if not isinstance(context, dict):
            return None
        page_snapshot = context.get("pageSnapshot")
        if not isinstance(page_snapshot, dict):
            return None

        excerpt = compact_no_space(page_snapshot.get("contentExcerpt"))
        if not excerpt:
            return None

        if any(
            token in excerpt
            for token in (
                "여성전용:x",
                "여성전용:불가",
                "여성전용:아니오",
                "여성전용:false",
            )
        ):
            return "이 건물은 여성 전용이 아닙니다. 방찾기 페이지로 돌아가 여성전용 방을 다시 찾아드릴게요."

        return None
