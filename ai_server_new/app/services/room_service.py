from __future__ import annotations

import json
from copy import deepcopy
from typing import Any

from app.agent.room_registration_slots import SLOT_DEFINITIONS, get_slot_question
from app.clients.spring_room_client import SpringRoomClient


BACKEND_FIELD_TO_SLOT = {
    "houseNo": "houseNo",
    "house_no": "houseNo",
    "roomName": "roomName",
    "room_name": "roomName",
    "roomDeposit": "roomDeposit",
    "room_deposit": "roomDeposit",
    "roomMonthly": "roomMonthly",
    "room_monthly": "roomMonthly",
    "roomMethod": "roomMethod",
    "room_method": "roomMethod",
    "roomArea": "roomArea",
    "room_area": "roomArea",
    "roomFacing": "roomFacing",
    "room_facing": "roomFacing",
    "roomAvailableDate": "roomAvailableDate",
    "room_available_date": "roomAvailableDate",
    "roomRoomCount": "roomRoomCount",
    "room_room_count": "roomRoomCount",
    "roomBathCount": "roomBathCount",
    "room_bath_count": "roomBathCount",
    "roomAbstract": "roomAbstract",
    "room_abstract": "roomAbstract",
    "roomOptions": "roomOptions",
    "room_options": "roomOptions",
}


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
    ) -> tuple[dict, str | None]:
        normalized = self._normalize_draft_payload(draft_payload)
        room_dto = normalized["roomDto"]
        room_name = str(room_dto.get("roomName") or "방").strip() or "방"

        invalid_slot, validation_message = self._extract_invalid_slot(error_message)
        response_slots = {
            "houseNo": normalized.get("houseNo"),
            "houseName": normalized.get("houseName"),
            **room_dto,
        }
        response_draft = deepcopy(normalized)

        if invalid_slot:
            response_slots.pop(invalid_slot, None)
            if invalid_slot == "houseNo":
                response_slots.pop("houseName", None)
                response_draft["houseNo"] = ""
                response_draft["houseName"] = ""
            else:
                response_draft["roomDto"].pop(invalid_slot, None)

        if invalid_slot:
            slot_label = self._get_slot_label(invalid_slot)
            slot_question = self._get_retry_question(invalid_slot)
            reason = validation_message or "입력 형식이나 값이 올바르지 않습니다."
            reply = f"{slot_label} 입력을 다시 확인해 주세요. {reason}"
            if slot_question:
                reply = f"{reply}\n{slot_question}"
        else:
            reply = (
                f"{room_name} 등록 중 문제가 발생했습니다. "
                "내용은 그대로 유지되어 있으니 확인 후 다시 등록해 주세요.\n"
                f"오류: {error_message}"
            )

        response = {
            "schemaVersion": schema_version,
            "reply": reply,
            "intent": "ROOM_CREATE",
            "slots": response_slots,
            "action": {
                "name": "ROOM_CREATE",
                "target": "spring_room_api",
                "operation": "create_room",
                "status": "retry" if invalid_slot else "failed",
            },
            "result": {
                "draftPayload": response_draft,
                "invalidSlot": invalid_slot,
                "validationMessage": validation_message,
            },
            "errorCode": "ROOM_CREATE_VALIDATION_FAILED" if invalid_slot else "ROOM_CREATE_FAILED",
            "requiresConfirm": False,
            "sessionId": session_id,
            "clientRequestId": client_request_id,
            "raw": {"error": error_message},
        }
        return response, invalid_slot

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

    def _extract_invalid_slot(self, error_message: str) -> tuple[str | None, str | None]:
        error_body = self._extract_error_body(error_message)
        if isinstance(error_body, dict):
            data = error_body.get("data")
            if isinstance(data, dict):
                for key, value in data.items():
                    slot_name = BACKEND_FIELD_TO_SLOT.get(str(key))
                    if slot_name:
                        return slot_name, str(value)
            if isinstance(data, str):
                guessed = self._guess_slot_from_text(data)
                if guessed:
                    return guessed, data

        guessed = self._guess_slot_from_text(error_message)
        return guessed, None

    def _extract_error_body(self, error_message: str) -> dict[str, Any] | None:
        marker = "body="
        body_index = error_message.find(marker)
        if body_index < 0:
            return None

        body_text = error_message[body_index + len(marker):].strip()
        try:
            parsed = json.loads(body_text)
        except json.JSONDecodeError:
            return None
        return parsed if isinstance(parsed, dict) else None

    def _guess_slot_from_text(self, text: str) -> str | None:
        lowered = str(text or "").lower()
        for backend_field, slot_name in BACKEND_FIELD_TO_SLOT.items():
            if backend_field.lower() in lowered:
                return slot_name
        return None

    def _get_slot_label(self, slot_name: str) -> str:
        if slot_name == "houseNo":
            return "건물"
        meta = SLOT_DEFINITIONS.get(slot_name, {})
        return str(meta.get("label") or slot_name)

    def _get_retry_question(self, slot_name: str) -> str:
        if slot_name == "houseNo":
            return "어느 건물에 등록할지 건물명을 다시 알려주세요."
        return get_slot_question(slot_name)
