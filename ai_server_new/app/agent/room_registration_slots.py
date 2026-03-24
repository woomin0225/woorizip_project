from __future__ import annotations

"""방 등록 에이전트가 공통으로 참조하는 슬롯 정의와 헬퍼 모음.

이 파일은 "방 등록을 끝내려면 어떤 정보가 필요한가?"를 한곳에 모아 둔 설정 파일이다.
질문 순서, 표시 라벨, 필수 여부를 여기서 관리하면 응답 생성부와 검증부가 같은 기준을 쓸 수 있다.
"""

from collections import OrderedDict
from typing import Any


ROOM_CREATE_INTENT = "ROOM_CREATE"


SLOT_DEFINITIONS: "OrderedDict[str, dict[str, Any]]" = OrderedDict(
    [
        (
            "houseNo",
            {
                "label": "소속 건물",
                "question": "어느 건물에 방을 등록할까요? 건물명을 알려주세요.",
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
            "roomMethod",
            {
                "label": "거래 방식",
                "question": "거래 방식을 말해주세요. 월세 또는 전세 중 어떤 방식인가요?",
                "required": True,
            },
        ),
        # 거래 방식을 먼저 받아 두면 뒤 질문을 자연스럽게 분기할 수 있다.
        # 월세(M)면 보증금 다음에 월세를 묻고, 전세(L)면 월세 질문을 건너뛴다.
        (
            "roomDeposit",
            {
                "label": "보증금",
                "question": "보증금이 얼마인지 말해주세요",
                "required": True,
            },
        ),
        (
            "roomMonthly",
            {
                "label": "월세",
                "question": "월세는 얼마인가요?",
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
                "label": "방향",
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
    "네",
    "예",
    "응",
    "맞아",
    "맞습니다",
    "확인",
    "등록해줘",
    "등록할게",
    "진행",
    "진행해줘",
}
DENY_TOKENS = {"아니", "아니요", "취소", "중지", "그만", "수정"}
ROOM_CREATE_KEYWORDS = (
    "방등록",
    "방 등록",
    "매물등록",
    "매물 등록",
    "룸등록",
    "룸 등록",
    "방 추가",
    "등록할 방",
)


def normalize_user_text(value: str | None) -> str:
    """비어 있는 입력도 안전하게 문자열로 정리한다."""

    return str(value or "").strip()


def compact_text(value: str | None) -> str:
    """간단한 키워드 비교를 위해 공백과 대소문자 차이를 줄인다."""

    return normalize_user_text(value).lower().replace(" ", "")


def normalize_house_name(value: str | None) -> str:
    """건물명 비교용 정규화 문자열을 만든다."""

    return compact_text(value).replace("건물", "")


def normalize_house_item(item: Any) -> dict[str, str]:
    """컨텍스트에서 넘어온 건물 정보를 표준 형태로 정리한다."""

    if not isinstance(item, dict):
        return {}

    house_no = normalize_user_text(item.get("houseNo"))
    house_name = normalize_user_text(item.get("houseName"))
    normalized: dict[str, str] = {}

    if house_no:
        normalized["houseNo"] = house_no
    if house_name:
        normalized["houseName"] = house_name
    return normalized


def get_room_create_context(request_meta: dict[str, Any] | None) -> dict[str, Any]:
    """프론트 컨텍스트에서 방 등록 관련 건물 정보를 꺼낸다."""

    request_meta = request_meta or {}
    context = request_meta.get("context")
    if not isinstance(context, dict):
        return {"current_house": {}, "available_houses": []}

    current_house = normalize_house_item(context.get("currentHouse"))
    available_houses = [
        item
        for item in (
            normalize_house_item(raw)
            for raw in (context.get("availableHouses") or [])
        )
        if item
    ]

    if current_house:
        current_house_no = current_house.get("houseNo")
        if current_house_no and not any(
            house.get("houseNo") == current_house_no for house in available_houses
        ):
            available_houses.insert(0, current_house)

    return {
        "current_house": current_house,
        "available_houses": available_houses,
    }


def find_house_match(text: str, available_houses: list[dict[str, str]]) -> dict[str, str] | None:
    """사용자 입력을 건물명/건물번호와 대조해 가장 그럴듯한 건물을 찾는다."""

    if not available_houses:
        return None

    normalized_input = normalize_house_name(text)
    normalized_raw = compact_text(text)
    if not normalized_input and not normalized_raw:
        return None

    best_match: dict[str, str] | None = None
    best_score = 0

    for house in available_houses:
        house_name = normalize_house_name(house.get("houseName"))
        house_no = compact_text(house.get("houseNo"))
        score = 0

        # 완전 일치 > 포함 일치 > houseNo 일치 순으로 점수를 준다.
        if house_name and normalized_input == house_name:
            score = 5
        elif house_name and house_name in normalized_input:
            score = 4
        elif house_name and normalized_input in house_name and len(normalized_input) >= 2:
            score = 3
        elif house_no and normalized_raw == house_no:
            score = 2
        elif house_no and house_no in normalized_raw:
            score = 1

        if score > best_score:
            best_match = house
            best_score = score

    return best_match if best_score > 0 else None


def get_house_display_name(slots: dict[str, Any]) -> str:
    """사용자에게 보여줄 건물명을 우선순위에 따라 고른다."""

    house_name = normalize_user_text(slots.get("houseName"))
    if house_name:
        return house_name
    return normalize_user_text(slots.get("houseNo"))


def build_house_question(available_houses: list[dict[str, str]] | None = None) -> str:
    """건물 선택 질문을 사용자 친화적인 문구로 만든다."""

    available_houses = available_houses or []
    if not available_houses:
        return get_slot_question("houseNo")

    house_names = [
        house.get("houseName") or house.get("houseNo")
        for house in available_houses
        if house.get("houseName") or house.get("houseNo")
    ]
    preview = ", ".join(house_names[:5])
    if len(house_names) > 5:
        preview += " 외"
    return f"어느 건물에 방을 등록할까요? 건물명을 알려주세요.\n선택 가능한 건물: {preview}"


def should_handle_room_create(text: str, session_state: dict[str, Any] | None = None) -> bool:
    """현재 요청을 방 등록 에이전트가 맡아야 하는지 판단한다."""

    compact = compact_text(text)
    if any(keyword.replace(" ", "") in compact for keyword in ROOM_CREATE_KEYWORDS):
        return True
    if not session_state:
        return False
    return session_state.get("intent") == ROOM_CREATE_INTENT and not session_state.get("completed", False)


def _is_required_slot(slot_name: str, slots: dict[str, Any], meta: dict[str, Any]) -> bool:
    """슬롯별 조건부 필수 여부를 계산한다.

    거래 방식이 전세(L)라면 월세는 더 이상 물을 필요가 없으므로
    `roomMonthly`를 필수 항목에서 제외한다.
    """

    if not meta.get("required"):
        return False
    # 기본적으로는 required=True인 항목을 모두 받지만,
    # 일부 항목은 이미 받은 값에 따라 "이번에는 생략 가능"으로 바뀔 수 있다.
    if slot_name == "roomMonthly" and not slots.get("roomMethod"):
        # 월세는 거래 방식이 "월세(M)"인지 확인된 뒤에만 의미가 있다.
        # 따라서 roomMethod가 비어 있는 동안에는 missing 목록에도 올리지 않는다.
        return False
    if slot_name == "roomMonthly" and slots.get("roomMethod") == "L":
        return False
    return True


def get_missing_slots(slots: dict[str, Any]) -> list[str]:
    """필수 슬롯 중 아직 비어 있는 항목 목록을 순서대로 돌려준다."""

    missing: list[str] = []
    for key, meta in SLOT_DEFINITIONS.items():
        if _is_required_slot(key, slots, meta) and slots.get(key) in (None, "", []):
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

    room_method = slots.get("roomMethod")
    # 전세는 월세가 없는 거래 방식이므로,
    # 사용자가 값을 입력하지 않아도 백엔드에는 0으로 맞춰서 전달한다.
    room_monthly = 0 if room_method == "L" else slots.get("roomMonthly")

    return {
        "houseNo": slots.get("houseNo"),
        "roomDto": {
            "roomName": slots.get("roomName"),
            "roomDeposit": slots.get("roomDeposit"),
            "roomMonthly": room_monthly,
            "roomMethod": room_method,
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
