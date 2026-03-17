from __future__ import annotations

from collections import OrderedDict
from typing import Any


ROOM_CREATE_INTENT = "ROOM_CREATE"


SLOT_DEFINITIONS: "OrderedDict[str, dict[str, Any]]" = OrderedDict(
    [
        ("houseNo", {"label": "\ub9e4\ubb3c \uc18c\uc18d houseNo", "question": "\uc5b4\ub290 houseNo\uc5d0 \ubc29\uc744 \ub4f1\ub85d\ud560\uc9c0 \uc54c\ub824\uc8fc\uc138\uc694.", "required": True}),
        ("roomName", {"label": "\ubc29 \uc774\ub984", "question": "\ub4f1\ub85d\ud560 \ubc29 \uc774\ub984\uc744 \uc54c\ub824\uc8fc\uc138\uc694.", "required": True}),
        ("roomDeposit", {"label": "\ubcf4\uc99d\uae08", "question": "\ubcf4\uc99d\uae08\uc744 \uc22b\uc790\ub85c \uc54c\ub824\uc8fc\uc138\uc694.", "required": True}),
        ("roomMonthly", {"label": "\uc6d4\uc138", "question": "\uc6d4\uc138\ub97c \uc22b\uc790\ub85c \uc54c\ub824\uc8fc\uc138\uc694.", "required": True}),
        ("roomMethod", {"label": "\uac70\ub798 \ubc29\uc2dd", "question": "\uac70\ub798 \ubc29\uc2dd\uc740 \uc6d4\uc138\uba74 M, \uc804\uc138\uba74 L\ub85c \uc785\ub825\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4. \uc5b4\ub5a4 \ubc29\uc2dd\uc778\uac00\uc694?", "required": True}),
        ("roomArea", {"label": "\uba74\uc801", "question": "\ubc29 \uba74\uc801\uc744 \uc22b\uc790\ub85c \uc54c\ub824\uc8fc\uc138\uc694. \uc608: 18.5", "required": True}),
        ("roomFacing", {"label": "\ubc29 \ud5a5", "question": "\ubc29\uc758 \ubc29\ud5a5\uc744 \uc54c\ub824\uc8fc\uc138\uc694. \uc608: \ub0a8\ud5a5, \ub3d9\ud5a5", "required": True}),
        ("roomAvailableDate", {"label": "\uc785\uc8fc \uac00\ub2a5\uc77c", "question": "\uc785\uc8fc \uac00\ub2a5\uc77c\uc744 YYYY-MM-DD \ud615\uc2dd\uc73c\ub85c \uc54c\ub824\uc8fc\uc138\uc694.", "required": True}),
        ("roomRoomCount", {"label": "\ubc29 \uac1c\uc218", "question": "\uce68\uc2e4 \uac1c\uc218\ub97c \uc22b\uc790\ub85c \uc54c\ub824\uc8fc\uc138\uc694.", "required": True}),
        ("roomBathCount", {"label": "\uc695\uc2e4 \uac1c\uc218", "question": "\uc695\uc2e4 \uac1c\uc218\ub97c \uc22b\uc790\ub85c \uc54c\ub824\uc8fc\uc138\uc694.", "required": True}),
        ("roomAbstract", {"label": "\ubc29 \uc18c\uac1c", "question": "\ubc29 \uc18c\uac1c \ubb38\uad6c\uac00 \uc788\uc73c\uba74 \uc54c\ub824\uc8fc\uc138\uc694. \uc5c6\uc73c\uba74 \uc0dd\ub7b5 \uac00\ub2a5\ud569\ub2c8\ub2e4.", "required": False}),
        ("roomOptions", {"label": "\ubc29 \uc635\uc158", "question": "\uc635\uc158\uc774 \uc788\uc73c\uba74 \uc27c\ud45c\ub85c \uc54c\ub824\uc8fc\uc138\uc694. \uc608: \uc5d0\uc5b4\ucee8,\uc138\ud0c1\uae30,\uce68\ub300", "required": False}),
    ]
)


CONFIRM_TOKENS = {"\uc751", "\ub124", "\uc608", "\ub9de\uc544", "\ub9de\uc2b5\ub2c8\ub2e4", "\ud655\uc778", "\ub4f1\ub85d\ud574\uc918", "\ub4f1\ub85d\ud560\uac8c", "\uc9c4\ud589", "\uc9c4\ud589\ud574\uc918"}
DENY_TOKENS = {"\uc544\ub2c8", "\uc544\ub2c8\uc624", "\ucde8\uc18c", "\uc911\uc9c0", "\uadf8\ub9cc", "\uc218\uc815"}
ROOM_CREATE_KEYWORDS = ("\ubc29\ub4f1\ub85d", "\ubc29 \ub4f1\ub85d", "\ub9e4\ubb3c\ub4f1\ub85d", "\ub9e4\ubb3c \ub4f1\ub85d", "\ub8f8\ub4f1\ub85d", "\ub8f8 \ub4f1\ub85d", "\uc0c8 \ubc29", "\ub4f1\ub85d\ud560 \ubc29")


def normalize_user_text(value: str | None) -> str:
    return str(value or "").strip()


def compact_text(value: str | None) -> str:
    return normalize_user_text(value).lower().replace(" ", "")


def should_handle_room_create(text: str, session_state: dict[str, Any] | None = None) -> bool:
    compact = compact_text(text)
    if any(keyword.replace(" ", "") in compact for keyword in ROOM_CREATE_KEYWORDS):
        return True
    if not session_state:
        return False
    return session_state.get("intent") == ROOM_CREATE_INTENT and not session_state.get("completed", False)


def get_missing_slots(slots: dict[str, Any]) -> list[str]:
    missing: list[str] = []
    for key, meta in SLOT_DEFINITIONS.items():
        if meta.get("required") and slots.get(key) in (None, "", []):
            missing.append(key)
    return missing


def get_next_missing_slot(slots: dict[str, Any]) -> str | None:
    missing = get_missing_slots(slots)
    return missing[0] if missing else None


def get_slot_question(slot_name: str) -> str:
    meta = SLOT_DEFINITIONS.get(slot_name, {})
    return str(meta.get("question") or f"{slot_name} \uac12\uc744 \uc54c\ub824\uc8fc\uc138\uc694.")


def is_confirm_message(text: str) -> bool:
    compact = compact_text(text)
    return any(token in compact for token in [item.replace(" ", "") for item in CONFIRM_TOKENS])


def is_deny_message(text: str) -> bool:
    compact = compact_text(text)
    return any(token in compact for token in [item.replace(" ", "") for item in DENY_TOKENS])


def build_draft_payload(slots: dict[str, Any]) -> dict[str, Any]:
    return {
        "houseNo": slots.get("houseNo"),
        "roomDto": {
            "roomName": slots.get("roomName"),
            "roomDeposit": slots.get("roomDeposit"),
            "roomMonthly": slots.get("roomMonthly"),
            "roomMethod": slots.get("roomMethod"),
            "roomArea": slots.get("roomArea"),
            "roomFacing": slots.get("roomFacing"),
            "roomAvailableDate": slots.get("roomAvailableDate"),
            "roomAbstract": slots.get("roomAbstract") or "",
            "roomRoomCount": slots.get("roomRoomCount"),
            "roomBathCount": slots.get("roomBathCount"),
            "roomEmptyYn": slots.get("roomEmptyYn", True),
            "roomStatus": slots.get("roomStatus", "ACTIVE"),
            "roomOptions": slots.get("roomOptions") or "",
        },
    }
