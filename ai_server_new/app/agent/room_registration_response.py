from __future__ import annotations

from app.agent.room_registration_slots import ROOM_CREATE_INTENT, SLOT_DEFINITIONS, build_draft_payload, get_missing_slots, get_next_missing_slot, get_slot_question


def build_collecting_response(state: dict) -> dict:
    slots = state.get("slots", {})
    missing_slots = get_missing_slots(slots)
    next_slot = get_next_missing_slot(slots)
    draft_payload = build_draft_payload(slots)
    if next_slot:
        reply = get_slot_question(next_slot)
        state["pending_slot"] = next_slot
        status = "collecting"
    else:
        state["pending_slot"] = None
        reply = build_confirmation_message(slots)
        status = "ready"
    return {
        "reply": reply,
        "intent": ROOM_CREATE_INTENT,
        "slots": slots,
        "action": {"name": "ROOM_CREATE_DRAFT", "target": "bff_room_api", "operation": "create_room", "status": status},
        "result": {
            "missingSlots": missing_slots,
            "draftPayload": draft_payload,
            "slotLabels": {key: meta.get("label") for key, meta in SLOT_DEFINITIONS.items()},
        },
        "requiresConfirm": status == "ready",
    }


def build_confirmation_message(slots: dict) -> str:
    lines = [
        "\ub2e4\uc74c \ub0b4\uc6a9\uc73c\ub85c \ubc29 \ub4f1\ub85d \ucd08\uc548\uc744 \ub9cc\ub4e4\uc5c8\uc2b5\ub2c8\ub2e4.",
        f"houseNo: {slots.get('houseNo')}",
        f"\ubc29 \uc774\ub984: {slots.get('roomName')}",
        f"\ubcf4\uc99d\uae08/\uc6d4\uc138: {slots.get('roomDeposit')} / {slots.get('roomMonthly')}",
        f"\uac70\ub798 \ubc29\uc2dd: {slots.get('roomMethod')}",
        f"\uba74\uc801/\ubc29\ud5a5: {slots.get('roomArea')} / {slots.get('roomFacing')}",
        f"\uc785\uc8fc \uac00\ub2a5\uc77c: {slots.get('roomAvailableDate')}",
        f"\uce68\uc2e4/\uc695\uc2e4: {slots.get('roomRoomCount')} / {slots.get('roomBathCount')}",
    ]
    if slots.get("roomOptions"):
        lines.append(f"\uc635\uc158: {slots.get('roomOptions')}")
    lines.append("\ub9de\uc73c\uba74 \ub4f1\ub85d\ud574\uc918 \ub610\ub294 \ud655\uc778\uc774\ub77c\uace0 \ub9d0\uc500\ud574 \uc8fc\uc138\uc694.")
    lines.append("\uc218\uc815\ud558\ub824\uba74 \ubc14\uafb8\uace0 \uc2f6\uc740 \ud56d\ubaa9\uc744 \ub2e4\uc2dc \ub9d0\uc500\ud574 \uc8fc\uc138\uc694.")
    return "\n".join(lines)


def build_confirmed_response(state: dict) -> dict:
    slots = state.get("slots", {})
    draft_payload = build_draft_payload(slots)
    return {
        "reply": "\ubc29 \ub4f1\ub85d \uc2e4\ud589 \uc900\ube44\uac00 \ub05d\ub0ac\uc2b5\ub2c8\ub2e4.\n\uc774\uc81c BFF\uac00 draftPayload\ub97c \uc0ac\uc6a9\ud574 \uc2e4\uc81c \ub4f1\ub85d\uc744 \uc9c4\ud589\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
        "intent": ROOM_CREATE_INTENT,
        "slots": slots,
        "action": {"name": "ROOM_CREATE_DRAFT", "target": "bff_room_api", "operation": "create_room", "status": "confirmed"},
        "result": {"missingSlots": [], "draftPayload": draft_payload},
        "requiresConfirm": False,
    }


def build_cancelled_response(state: dict) -> dict:
    return {
        "reply": "\ubc29 \ub4f1\ub85d \ucd08\uc548 \uc9c4\ud589\uc744 \ucde8\uc18c\ud588\uc2b5\ub2c8\ub2e4.\n\ub2e4\uc2dc \uc2dc\uc791\ud558\ub824\uba74 \ubc29 \ub4f1\ub85d\ud558\uace0 \uc2f6\ub2e4\uace0 \ub9d0\uc500\ud574 \uc8fc\uc138\uc694.",
        "intent": ROOM_CREATE_INTENT,
        "slots": state.get("slots", {}),
        "action": {"name": "ROOM_CREATE_DRAFT", "target": "bff_room_api", "operation": "create_room", "status": "cancelled"},
        "result": {"missingSlots": [], "draftPayload": {}},
        "requiresConfirm": False,
    }
