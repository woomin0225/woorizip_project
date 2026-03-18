from __future__ import annotations

"""방 등록 상태를 사용자 응답 payload로 변환한다."""

from app.agent.room_registration_slots import (
    ROOM_CREATE_INTENT,
    SLOT_DEFINITIONS,
    build_draft_payload,
    build_house_question,
    get_house_display_name,
    get_missing_slots,
    get_next_missing_slot,
    get_slot_question,
)


def build_collecting_response(state: dict) -> dict:
    """아직 슬롯 수집 중일 때의 응답을 만든다."""

    slots = state.get("slots", {})
    missing_slots = get_missing_slots(slots)
    next_slot = get_next_missing_slot(slots)
    draft_payload = build_draft_payload(slots)

    if next_slot:
        if next_slot == "houseNo":
            # 내부 식별자는 houseNo지만, 사용자에게는 건물명 기준 질문이 더 자연스럽다.
            reply = build_house_question(state.get("available_houses"))
        else:
            # 다음으로 비어 있는 슬롯 하나만 물어보면 대화가 짧고 명확하게 유지된다.
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
    """모든 슬롯이 모였을 때 읽기 쉬운 확인 문구를 만든다."""

    room_method = slots.get("roomMethod")
    if room_method == "L":
        # 전세는 월세가 없으므로 확인 문구에서도 월세 줄을 빼 준다.
        price_line = f"보증금: {slots.get('roomDeposit')}"
        method_label = "전세"
    elif room_method == "M":
        # 월세는 보증금과 월세를 함께 보여 줘야 사용자가 조건을 한 번에 확인하기 쉽다.
        price_line = f"보증금 / 월세: {slots.get('roomDeposit')} / {slots.get('roomMonthly')}"
        method_label = "월세"
    else:
        price_line = f"보증금 / 월세: {slots.get('roomDeposit')} / {slots.get('roomMonthly')}"
        method_label = str(room_method or "-")

    lines = [
        "다음 내용으로 방 등록 초안을 만들었습니다.",
        f"건물: {get_house_display_name(slots)}",
        f"방 이름: {slots.get('roomName')}",
        price_line,
        f"거래 방식: {method_label}",
        f"면적 / 방향: {slots.get('roomArea')} / {slots.get('roomFacing')}",
        f"입주 가능일: {slots.get('roomAvailableDate')}",
        f"침실 / 욕실: {slots.get('roomRoomCount')} / {slots.get('roomBathCount')}",
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
        "reply": "방 등록 초안 진행을 취소했습니다.\n다시 시작하려면 방 등록이라고 말씀해 주세요.",
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
