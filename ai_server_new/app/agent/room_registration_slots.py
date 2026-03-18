from __future__ import annotations

"""방 등록 에이전트가 공통으로 참조하는 슬롯 정의 모음.

이 파일은 "방 등록을 완료하려면 어떤 정보가 필요한가?"를 한곳에 모아 둔 설정 파일에 가깝다.
핵심 아이디어는 다음과 같다.

1. 슬롯(slot)은 사용자가 채워야 하는 입력 항목이다.
2. 질문 순서를 고정하고 싶기 때문에 `OrderedDict`를 사용한다.
3. 질문 문구, 라벨, 필수 여부를 코드 여러 곳에 흩뿌리지 않고 한곳에서 관리한다.
"""

from collections import OrderedDict
from typing import Any


ROOM_CREATE_INTENT = "ROOM_CREATE"


SLOT_DEFINITIONS: "OrderedDict[str, dict[str, Any]]" = OrderedDict(
    [
        (
            "houseNo",
            {
                "label": "매물 소속 houseNo",
                "question": "어느 houseNo에 방을 등록할지 알려주세요.",
                "required": True,
            },
        ),
        (
            "roomName",
            {
                "label": "방 이름",
                "question": "등록할 방 이름을 알려주세요.",
                "required": True,
            },
        ),
        (
            "roomDeposit",
            {
                "label": "보증금",
                "question": "보증금을 숫자로 알려주세요.",
                "required": True,
            },
        ),
        (
            "roomMonthly",
            {
                "label": "월세",
                "question": "월세를 숫자로 알려주세요.",
                "required": True,
            },
        ),
        (
            "roomMethod",
            {
                "label": "거래 방식",
                "question": "거래 방식은 월세면 M, 전세면 L로 입력할 수 있습니다. 어떤 방식인가요?",
                "required": True,
            },
        ),
        (
            "roomArea",
            {
                "label": "면적",
                "question": "방 면적을 숫자로 알려주세요. 예: 18.5",
                "required": True,
            },
        ),
        (
            "roomFacing",
            {
                "label": "방 향",
                "question": "방의 방향을 알려주세요. 예: 남향, 동향",
                "required": True,
            },
        ),
        (
            "roomAvailableDate",
            {
                "label": "입주 가능일",
                "question": "입주 가능일을 YYYY-MM-DD 형식으로 알려주세요.",
                "required": True,
            },
        ),
        (
            "roomRoomCount",
            {
                "label": "방 개수",
                "question": "침실 개수를 숫자로 알려주세요.",
                "required": True,
            },
        ),
        (
            "roomBathCount",
            {
                "label": "욕실 개수",
                "question": "욕실 개수를 숫자로 알려주세요.",
                "required": True,
            },
        ),
        (
            "roomAbstract",
            {
                "label": "방 소개",
                "question": "방 소개 문구가 있으면 알려주세요. 없으면 생략 가능합니다.",
                "required": False,
            },
        ),
        (
            "roomOptions",
            {
                "label": "방 옵션",
                "question": "옵션이 있으면 쉼표로 알려주세요. 예: 에어컨,세탁기,침대",
                "required": False,
            },
        ),
    ]
)


CONFIRM_TOKENS = {
    "응",
    "네",
    "예",
    "맞아",
    "맞습니다",
    "확인",
    "등록해줘",
    "등록할게",
    "진행",
    "진행해줘",
}
DENY_TOKENS = {"아니", "아니오", "취소", "중지", "그만", "수정"}
ROOM_CREATE_KEYWORDS = (
    "방등록",
    "방 등록",
    "매물등록",
    "매물 등록",
    "룸등록",
    "룸 등록",
    "새 방",
    "등록할 방",
)


def normalize_user_text(value: str | None) -> str:
    """비어 있는 입력을 안전하게 문자열로 정규화한다."""

    return str(value or "").strip()


def compact_text(value: str | None) -> str:
    """간단한 키워드 비교를 위해 공백과 대소문자 차이를 줄인다."""

    return normalize_user_text(value).lower().replace(" ", "")


def should_handle_room_create(text: str, session_state: dict[str, Any] | None = None) -> bool:
    """현재 요청을 방 등록 에이전트가 맡아야 하는지 판단한다."""

    compact = compact_text(text)
    if any(keyword.replace(" ", "") in compact for keyword in ROOM_CREATE_KEYWORDS):
        return True
    if not session_state:
        return False
    return session_state.get("intent") == ROOM_CREATE_INTENT and not session_state.get("completed", False)


def get_missing_slots(slots: dict[str, Any]) -> list[str]:
    """필수 슬롯 중 아직 비어 있는 항목 목록을 순서대로 돌려준다."""

    missing: list[str] = []
    for key, meta in SLOT_DEFINITIONS.items():
        if meta.get("required") and slots.get(key) in (None, "", []):
            missing.append(key)
    return missing


def get_next_missing_slot(slots: dict[str, Any]) -> str | None:
    """다음에 물어봐야 할 슬롯 하나만 고른다."""

    missing = get_missing_slots(slots)
    return missing[0] if missing else None


def get_slot_question(slot_name: str) -> str:
    """슬롯에 대응하는 사용자 질문 문구를 가져온다."""

    meta = SLOT_DEFINITIONS.get(slot_name, {})
    return str(meta.get("question") or f"{slot_name} 값을 알려주세요.")


def is_confirm_message(text: str) -> bool:
    """사용자 메시지가 확인/진행 의사인지 간단한 규칙으로 판별한다."""

    compact = compact_text(text)
    return any(token in compact for token in [item.replace(" ", "") for item in CONFIRM_TOKENS])


def is_deny_message(text: str) -> bool:
    """사용자 메시지가 취소/수정 의사인지 간단한 규칙으로 판별한다."""

    compact = compact_text(text)
    return any(token in compact for token in [item.replace(" ", "") for item in DENY_TOKENS])


def build_draft_payload(slots: dict[str, Any]) -> dict[str, Any]:
    """현재까지 모은 슬롯을 BFF가 바로 사용할 수 있는 draft payload로 바꾼다."""

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
