from __future__ import annotations

"""방 등록 대화 상태를 사용자 응답 payload로 변환하는 모듈."""

from app.agent.room_registration_slots import (
    ROOM_CREATE_INTENT,
    SLOT_DEFINITIONS,
    build_draft_payload,
    get_missing_slots,
    get_next_missing_slot,
    get_slot_question,
)


def build_collecting_response(state: dict) -> dict:
    """아직 슬롯 수집 중일 때 응답을 만든다."""

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
        "action": {
            "name": "ROOM_CREATE_DRAFT",
            "target": "bff_room_api",
            "operation": "create_room",
            "status": status,
        },
        "result": {
            "missingSlots": missing_slots,
            "draftPayload": draft_payload,
            "slotLabels": {key: meta.get("label") for key, meta in SLOT_DEFINITIONS.items()},
        },
        "requiresConfirm": status == "ready",
    }


def build_confirmation_message(slots: dict) -> str:
    """모은 슬롯을 사람이 읽기 쉬운 확인 문장으로 조립한다."""

    lines = [
        "다음 내용으로 방 등록 초안을 만들었습니다.",
        f"houseNo: {slots.get('houseNo')}",
        f"방 이름: {slots.get('roomName')}",
        f"보증금/월세: {slots.get('roomDeposit')} / {slots.get('roomMonthly')}",
        f"거래 방식: {slots.get('roomMethod')}",
        f"면적/방향: {slots.get('roomArea')} / {slots.get('roomFacing')}",
        f"입주 가능일: {slots.get('roomAvailableDate')}",
        f"침실/욕실: {slots.get('roomRoomCount')} / {slots.get('roomBathCount')}",
    ]
    if slots.get("roomOptions"):
        lines.append(f"옵션: {slots.get('roomOptions')}")
    lines.append("맞으면 등록해줘 또는 확인이라고 말씀해 주세요.")
    lines.append("수정하려면 바꾸고 싶은 항목을 다시 말씀해 주세요.")
    return "\n".join(lines)


def build_confirmed_response(state: dict) -> dict:
    """사용자가 최종 확인했을 때의 응답을 만든다."""

    slots = state.get("slots", {})
    draft_payload = build_draft_payload(slots)
    return {
        "reply": "방 등록 실행 준비가 끝났습니다.\n이제 BFF가 draftPayload를 사용해 실제 등록을 진행할 수 있습니다.",
        "intent": ROOM_CREATE_INTENT,
        "slots": slots,
        "action": {
            "name": "ROOM_CREATE_DRAFT",
            "target": "bff_room_api",
            "operation": "create_room",
            "status": "confirmed",
        },
        "result": {"missingSlots": [], "draftPayload": draft_payload},
        "requiresConfirm": False,
    }


def build_cancelled_response(state: dict) -> dict:
    """사용자가 취소를 선택했을 때의 응답을 만든다."""

    return {
        "reply": "방 등록 초안 진행을 취소했습니다.\n다시 시작하려면 방 등록하고 싶다고 말씀해 주세요.",
        "intent": ROOM_CREATE_INTENT,
        "slots": state.get("slots", {}),
        "action": {
            "name": "ROOM_CREATE_DRAFT",
            "target": "bff_room_api",
            "operation": "create_room",
            "status": "cancelled",
        },
        "result": {"missingSlots": [], "draftPayload": {}},
        "requiresConfirm": False,
    }
