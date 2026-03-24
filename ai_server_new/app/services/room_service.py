from __future__ import annotations

from app.clients.spring_room_client import SpringRoomClient


class RoomService:
    def __init__(self, client: SpringRoomClient):
        self.client = client

    async def create_for_chatbot(
        self,
        *,
        schema_version: str,
        session_id: str | None,
        client_request_id: str | None,
        draft_payload: dict,
        access_token: str | None = None,
    ) -> dict:
        normalized = self._normalize_draft_payload(draft_payload)
        room_dto = normalized["roomDto"]
        spring_response = await self.client.create_room(
            house_no=normalized["houseNo"],
            room_payload=room_dto,
            access_token=access_token,
        )

        room_name = str(room_dto.get("roomName") or "새 방").strip() or "새 방"
        house_name = str(normalized.get("houseName") or "").strip()
        house_no = str(normalized.get("houseNo") or "").strip()
        created_room = self._extract_created_room(spring_response)
        room_no = str(created_room.get("roomNo") or "").strip()

        location_label = house_name or house_no
        location_hint = f"건물 {location_label}" if location_label else "선택한 건물"
        room_hint = f"{room_name} 등록이 완료되었습니다."
        if room_no:
            room_hint = f"{room_name} 등록이 완료되었습니다. 방 번호는 {room_no}입니다."

        return {
            "schemaVersion": schema_version,
            "reply": f"{location_hint}에 {room_hint}",
            "intent": "ROOM_CREATE",
            "slots": {
                "houseNo": house_no,
                "houseName": house_name,
                **room_dto,
            },
            "action": {
                "name": "ROOM_CREATE",
                "target": "spring_room_api",
                "operation": "create_room",
                "status": "submitted",
            },
            "result": {
                "draftPayload": normalized,
                "createdRoom": created_room,
                "springResponse": spring_response,
            },
            "errorCode": None,
            "requiresConfirm": False,
            "sessionId": session_id,
            "clientRequestId": client_request_id,
            "raw": spring_response if isinstance(spring_response, dict) else {},
        }

    def build_failure_response(
        self,
        *,
        schema_version: str,
        session_id: str | None,
        client_request_id: str | None,
        draft_payload: dict,
        error_message: str,
    ) -> dict:
        normalized = self._normalize_draft_payload(draft_payload)
        room_dto = normalized["roomDto"]
        room_name = str(room_dto.get("roomName") or "방").strip() or "방"
        return {
            "schemaVersion": schema_version,
            "reply": (
                f"{room_name} 등록 중 문제가 발생했습니다. "
                "내용은 그대로 유지되어 있으니 확인 후 다시 등록해 주세요.\n"
                f"오류: {error_message}"
            ),
            "intent": "ROOM_CREATE",
            "slots": {
                "houseNo": normalized.get("houseNo"),
                **room_dto,
            },
            "action": {
                "name": "ROOM_CREATE",
                "target": "spring_room_api",
                "operation": "create_room",
                "status": "failed",
            },
            "result": {
                "draftPayload": normalized,
            },
            "errorCode": "ROOM_CREATE_FAILED",
            "requiresConfirm": False,
            "sessionId": session_id,
            "clientRequestId": client_request_id,
            "raw": {"error": error_message},
        }

    def _normalize_draft_payload(self, draft_payload: dict) -> dict:
        draft_payload = draft_payload or {}
        house_no = str(draft_payload.get("houseNo") or "").strip()
        room_dto = draft_payload.get("roomDto")
        if not house_no:
            raise ValueError("houseNo 값이 필요합니다.")
        if not isinstance(room_dto, dict):
            raise ValueError("roomDto 값이 필요합니다.")

        normalized_room_dto = {
            key: value
            for key, value in room_dto.items()
            if value is not None
        }
        if not str(normalized_room_dto.get("roomName") or "").strip():
            raise ValueError("roomName 값이 필요합니다.")

        return {
            "houseNo": house_no,
            "houseName": str(draft_payload.get("houseName") or "").strip(),
            "roomDto": normalized_room_dto,
        }

    def _extract_created_room(self, spring_response: dict) -> dict:
        if not isinstance(spring_response, dict):
            return {}

        current = spring_response
        for key in ("data", "result"):
            nested = current.get(key)
            if isinstance(nested, dict):
                current = nested

        return current if isinstance(current, dict) else {}
