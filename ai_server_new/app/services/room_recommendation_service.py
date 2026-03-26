from __future__ import annotations

import re
from copy import deepcopy
from typing import Any

from app.clients.spring_room_client import SpringRoomClient


DEFAULT_ROOM_SEARCH_COND = {
    "keyword": "",
    "roomType": "L",
    "minDeposit": None,
    "maxDeposit": None,
    "minTax": None,
    "maxTax": None,
    "swLat": 37.4531,
    "swLng": 126.8446,
    "neLat": 37.7201,
    "neLng": 127.2244,
    "options": [],
    "roomRoomCount": None,
    "houseElevatorYn": False,
    "housePetYn": False,
    "houseFemaleLimit": False,
    "houseParking": False,
    "criterion": "LATEST",
}

DEFAULT_ROOM_PREFERENCE = {
    "sortBy": "LATEST",
    "roomLabel": "",
}

ROOM_RECOMMENDATION_TRIGGER_PATTERNS = (
    "방추천",
    "추천해줘",
    "추천해주세요",
    "추천부탁",
    "추천받고싶",
    "추천받고싶어",
    "추천좀",
    "추천해줄래",
    "추천받을래",
    "추천받아보고싶",
    "방찾아줘",
    "방찾아보고싶",
)

ROOM_DETAIL_TRIGGER_PATTERNS = (
    "그방",
    "이방",
    "추천해준방",
    "자세히",
    "상세",
    "들어가줘",
    "들어가고싶",
    "보여줘",
    "열어줘",
    "확인하고싶",
)

LOW_COST_PATTERNS = (
    "저렴한방",
    "싼방",
    "가성비방",
    "더싼",
    "더저렴",
    "싼걸로",
    "저렴한걸로",
    "가성비좋은",
)

STRICTER_LOW_COST_PATTERNS = (
    "더싼",
    "더저렴",
    "더싼걸로",
    "더저렴한걸로",
    "좀더싼",
    "좀더저렴",
)

HIGH_COST_PATTERNS = (
    "비싼방",
    "고급방",
    "더비싼",
    "고급진",
)

LARGE_AREA_PATTERNS = (
    "넓은방",
    "큰방",
    "넓은집",
    "큰집",
    "넓은걸로",
    "큰걸로",
)

STRICTER_LARGE_AREA_PATTERNS = (
    "더넓은",
    "더큰",
    "더넓은걸로",
    "더큰걸로",
)

SMALL_AREA_PATTERNS = (
    "작은방",
    "좁은방",
    "작은집",
    "좁은걸로",
    "작은걸로",
)

STRICTER_SMALL_AREA_PATTERNS = (
    "더작은",
    "더좁은",
    "더작은걸로",
    "더좁은걸로",
)

ROOM_TYPE_MONTHLY_PATTERNS = ("월세",)
ROOM_TYPE_LEASE_PATTERNS = ("전세",)
SINGLE_ROOM_PATTERNS = ("1인", "혼자", "원룸", "1인실")
DOUBLE_ROOM_PATTERNS = ("2인", "둘이", "2인실", "투룸")
FEMALE_ONLY_PATTERNS = ("여성전용",)
PET_ALLOWED_PATTERNS = ("반려동물", "애완동물")
ELEVATOR_PATTERNS = ("엘리베이터",)
PARKING_PATTERNS = ("주차",)
ROOM_FOLLOW_UP_TRIGGER_PATTERNS = (
    "1번",
    "2번",
    "3번",
    "첫번째",
    "두번째",
    "세번째",
    "아까",
    "그방",
    "이방",
    "다른거",
    "비슷한거",
)

KRW_MAN = 10_000


def compact_no_space(value: Any) -> str:
    return str(value or "").strip().lower().replace(" ", "")


def includes_any(text: str, patterns: tuple[str, ...]) -> bool:
    compact = compact_no_space(text)
    return any(compact_no_space(pattern) in compact for pattern in patterns)


def default_room_request() -> dict[str, Any]:
    return {
        "cond": deepcopy(DEFAULT_ROOM_SEARCH_COND),
        "preference": deepcopy(DEFAULT_ROOM_PREFERENCE),
    }


def normalize_room_request(request_data: dict[str, Any] | None) -> dict[str, Any]:
    normalized = default_room_request()
    if not isinstance(request_data, dict):
        return normalized

    cond = request_data.get("cond")
    if isinstance(cond, dict):
        normalized["cond"].update(cond)

    preference = request_data.get("preference")
    if isinstance(preference, dict):
        normalized["preference"].update(preference)

    return normalized


def is_room_recommendation_request(text: str) -> bool:
    compact = compact_no_space(text)
    if not compact:
        return False
    return includes_any(compact, ROOM_RECOMMENDATION_TRIGGER_PATTERNS)


def is_room_detail_request(text: str) -> bool:
    compact = compact_no_space(text)
    if not compact:
        return False
    return includes_any(compact, ROOM_DETAIL_TRIGGER_PATTERNS) or includes_any(
        compact,
        ROOM_FOLLOW_UP_TRIGGER_PATTERNS,
    )


def is_room_preference_message(text: str) -> bool:
    request_data = build_room_search_request(text)
    compact = compact_no_space(text)
    if not compact:
        return False
    return has_room_preference(request_data) or includes_any(
        compact,
        LOW_COST_PATTERNS
        + HIGH_COST_PATTERNS
        + LARGE_AREA_PATTERNS
        + SMALL_AREA_PATTERNS,
    )


def is_cancel_message(text: str) -> bool:
    compact = compact_no_space(text)
    if not compact:
        return False
    return any(token in compact for token in ("아니", "취소", "중지", "그만"))


def is_room_follow_up_message(
    text: str,
    *,
    has_last_rooms: bool = False,
    awaiting_preference: bool = False,
    has_active_request: bool = False,
    current_request: dict[str, Any] | None = None,
) -> bool:
    compact = compact_no_space(text)
    if not compact:
        return False

    request_data = normalize_room_request(current_request)
    current_has_preference = has_room_preference(request_data)

    if (
        is_cancel_message(text)
        or is_room_recommendation_request(text)
        or is_room_preference_message(text)
        or current_has_preference
    ):
        return True

    if has_last_rooms and (
        is_room_detail_request(text)
        or includes_any(compact, ROOM_FOLLOW_UP_TRIGGER_PATTERNS)
    ):
        return True

    if awaiting_preference and current_has_preference:
        return True

    if has_active_request and includes_any(
        compact,
        LOW_COST_PATTERNS
        + HIGH_COST_PATTERNS
        + LARGE_AREA_PATTERNS
        + SMALL_AREA_PATTERNS,
    ):
        return True

    return False


def parse_amount_to_won(text: str | None) -> int | None:
    if not text:
        return None

    match = re.search(
        r"(\d+(?:\.\d+)?)\s*(억|천만|백만|십만|만원|만|원)?",
        str(text),
    )
    if not match:
        return None

    value = float(match.group(1))
    unit = match.group(2) or "만"
    multipliers = {
        "억": 100_000_000,
        "천만": 10_000_000,
        "백만": 1_000_000,
        "십만": 100_000,
        "만원": 10_000,
        "만": 10_000,
        "원": 1,
    }
    return round(value * multipliers.get(unit, 10_000))


def extract_budget_range(text: str, label: str) -> tuple[int | None, int | None]:
    source = str(text or "")
    max_match = re.search(
        rf"{label}\s*([\d.,]+\s*(?:억|천만|백만|십만|만원|만|원)?)(?:\s*(?:이하|까지|안쪽|미만))?",
        source,
    )
    min_match = re.search(
        rf"{label}\s*([\d.,]+\s*(?:억|천만|백만|십만|만원|만|원)?)\s*(?:이상|부터|초과|넘는)",
        source,
    )
    return (
        parse_amount_to_won(min_match.group(1)) if min_match else None,
        parse_amount_to_won(max_match.group(1)) if max_match else None,
    )


def extract_location_keyword(text: str) -> str:
    match = re.search(
        r"([가-힣0-9]{1,}(?:역|구|동|로|가))(?:\s*(?:근처|부근|쪽|인근))?",
        str(text or ""),
    )
    return match.group(1) if match else ""


def build_room_search_request(
    message_text: str,
    *,
    base_request: dict[str, Any] | None = None,
) -> dict[str, Any]:
    text = str(message_text or "")
    compact = compact_no_space(text)
    current = normalize_room_request(base_request)
    cond = deepcopy(current["cond"])
    preference = deepcopy(current["preference"])

    has_explicit_room_type = includes_any(compact, ROOM_TYPE_MONTHLY_PATTERNS) or includes_any(
        compact,
        ROOM_TYPE_LEASE_PATTERNS,
    )
    if includes_any(compact, ROOM_TYPE_MONTHLY_PATTERNS):
        cond["roomType"] = "M"
    if includes_any(compact, ROOM_TYPE_LEASE_PATTERNS):
        cond["roomType"] = "L"
    if (
        base_request is None
        and not has_explicit_room_type
        and includes_any(compact, LOW_COST_PATTERNS)
    ):
        cond["roomType"] = "M"

    min_deposit, max_deposit = extract_budget_range(text, "보증금")
    if min_deposit is not None:
        cond["minDeposit"] = min_deposit
    if max_deposit is not None:
        cond["maxDeposit"] = max_deposit

    min_tax, max_tax = extract_budget_range(text, "월세")
    if min_tax is not None:
        cond["minTax"] = min_tax
    if max_tax is not None:
        cond["maxTax"] = max_tax

    if includes_any(compact, SINGLE_ROOM_PATTERNS):
        cond["roomRoomCount"] = 1
        preference["roomLabel"] = "1인용"
    if includes_any(compact, DOUBLE_ROOM_PATTERNS):
        cond["roomRoomCount"] = 2
        preference["roomLabel"] = "2인용"

    if includes_any(compact, FEMALE_ONLY_PATTERNS):
        cond["houseFemaleLimit"] = True
    if includes_any(compact, PET_ALLOWED_PATTERNS):
        cond["housePetYn"] = True
    if includes_any(compact, ELEVATOR_PATTERNS):
        cond["houseElevatorYn"] = True
    if includes_any(compact, PARKING_PATTERNS):
        cond["houseParking"] = True

    if includes_any(compact, LOW_COST_PATTERNS):
        preference["sortBy"] = "LOW_COST"
    if includes_any(compact, HIGH_COST_PATTERNS):
        preference["sortBy"] = "HIGH_COST"
    if includes_any(compact, LARGE_AREA_PATTERNS):
        preference["sortBy"] = "LARGE_AREA"
    if includes_any(compact, SMALL_AREA_PATTERNS):
        preference["sortBy"] = "SMALL_AREA"

    keyword = extract_location_keyword(text)
    if keyword:
        cond["keyword"] = keyword

    if "역세권" in compact and not cond["keyword"]:
        preference["roomLabel"] = (
            f"{preference['roomLabel']} 역세권".strip()
            if preference["roomLabel"]
            else "역세권"
        )

    cond["criterion"] = to_search_criterion(
        room_type=str(cond.get("roomType") or "L"),
        sort_by=str(preference["sortBy"]),
    )
    return {"cond": cond, "preference": preference}


def has_room_preference(request_data: dict[str, Any] | None) -> bool:
    normalized = normalize_room_request(request_data)
    cond = normalized.get("cond") or {}
    preference = normalized.get("preference") or {}
    return bool(
        cond.get("keyword")
        or cond.get("roomType") == "M"
        or cond.get("minDeposit") is not None
        or cond.get("maxDeposit") is not None
        or cond.get("minTax") is not None
        or cond.get("maxTax") is not None
        or cond.get("roomRoomCount")
        or cond.get("houseFemaleLimit")
        or cond.get("housePetYn")
        or cond.get("houseElevatorYn")
        or preference.get("sortBy") != "LATEST"
    )


def to_search_criterion(room_type: str, sort_by: str) -> str:
    if sort_by == "LOW_COST":
        return "LOW_TAX" if room_type == "M" else "LOW_DEPOSIT"
    if sort_by == "HIGH_COST":
        return "HIGH_TAX" if room_type == "M" else "HIGH_DEPOSIT"
    if sort_by == "LARGE_AREA":
        return "AREA"
    return "LATEST"


def get_room_cost_score(room: dict[str, Any]) -> int:
    deposit = int(room.get("roomDeposit") or 0)
    monthly = int(room.get("roomMonthly") or 0)
    return deposit + monthly * 24


def get_room_deposit(room: dict[str, Any]) -> int:
    return int(room.get("roomDeposit") or 0)


def get_room_monthly(room: dict[str, Any]) -> int:
    return int(room.get("roomMonthly") or 0)


def get_room_method(room: dict[str, Any]) -> str:
    return str(room.get("roomMethod") or "").upper()


def get_room_area(room: dict[str, Any]) -> float:
    return float(room.get("roomArea") or 0)


def compact_room_text(room: dict[str, Any]) -> str:
    return compact_no_space(
        " ".join(
            str(value or "")
            for value in (
                room.get("roomName"),
                room.get("houseName"),
                room.get("houseAddress"),
            )
        )
    )


def keyword_matches_room(keyword: str, room: dict[str, Any]) -> bool:
    compact_keyword = compact_no_space(keyword)
    if not compact_keyword:
        return True
    room_text = compact_room_text(room)
    return compact_keyword in room_text


def room_matches_request(room: dict[str, Any], request_data: dict[str, Any]) -> bool:
    normalized = normalize_room_request(request_data)
    cond = normalized["cond"]

    keyword = str(cond.get("keyword") or "").strip()
    if keyword and not keyword_matches_room(keyword, room):
        return False

    room_type = str(cond.get("roomType") or "").upper()
    if room_type and room_type != get_room_method(room):
        return False

    deposit = get_room_deposit(room)
    monthly = get_room_monthly(room)
    room_count = int(room.get("roomRoomCount") or 0)

    min_deposit = cond.get("minDeposit")
    max_deposit = cond.get("maxDeposit")
    min_tax = cond.get("minTax")
    max_tax = cond.get("maxTax")

    if min_deposit is not None and deposit < int(min_deposit):
        return False
    if max_deposit is not None and deposit > int(max_deposit):
        return False
    if min_tax is not None and monthly < int(min_tax):
        return False
    if max_tax is not None and monthly > int(max_tax):
        return False
    if cond.get("roomRoomCount") and room_count < int(cond["roomRoomCount"]):
        return False

    if cond.get("houseFemaleLimit") and not bool(room.get("houseFemaleLimit")):
        return False
    if cond.get("housePetYn") and not bool(room.get("housePetYn")):
        return False
    if cond.get("houseElevatorYn") and not bool(room.get("houseElevatorYn")):
        return False
    if cond.get("houseParking") and int(room.get("houseParkingMax") or 0) <= 0:
        return False

    return True


def filter_rooms_by_request(
    rooms: list[dict[str, Any]],
    request_data: dict[str, Any],
) -> list[dict[str, Any]]:
    return [
        room
        for room in list(rooms or [])
        if isinstance(room, dict) and room_matches_request(room, request_data)
    ]


def is_stricter_low_cost_message(text: str) -> bool:
    compact = compact_no_space(text)
    if not compact:
        return False
    return "더" in compact and includes_any(compact, STRICTER_LOW_COST_PATTERNS)


def is_stricter_large_area_message(text: str) -> bool:
    compact = compact_no_space(text)
    if not compact:
        return False
    return "더" in compact and includes_any(compact, STRICTER_LARGE_AREA_PATTERNS)


def is_stricter_small_area_message(text: str) -> bool:
    compact = compact_no_space(text)
    if not compact:
        return False
    return "더" in compact and includes_any(compact, STRICTER_SMALL_AREA_PATTERNS)


def apply_relative_low_cost_refinement(
    message_text: str,
    request_data: dict[str, Any],
    previous_rooms: list[dict[str, Any]] | None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    refined_request = normalize_room_request(request_data)
    metadata = {
        "applied": False,
        "reason": None,
        "message": None,
        "preservePreviousRooms": False,
    }
    rooms = list(previous_rooms or [])

    if not is_stricter_low_cost_message(message_text) or not rooms:
        return refined_request, metadata

    cond = refined_request["cond"]
    preference = refined_request["preference"]
    room_type = str(cond.get("roomType") or "").upper()
    if not room_type:
        monthly_count = sum(1 for room in rooms if get_room_method(room) == "M")
        room_type = "M" if monthly_count >= len(rooms) / 2 else "L"
        cond["roomType"] = room_type

    metadata["applied"] = True
    metadata["reason"] = "LOWER_THAN_PREVIOUS"
    metadata["preservePreviousRooms"] = True
    preference["sortBy"] = "LOW_COST"

    if room_type == "M":
        monthly_values = [
            get_room_monthly(room)
            for room in rooms
            if get_room_method(room) == "M" and get_room_monthly(room) > 0
        ]
        if not monthly_values:
            metadata["message"] = (
                "지금 추천드린 방들의 월세 정보를 기준으로는 더 저렴한 방을 좁혀 찾기 어려워요. "
                "지역이나 보증금 조건을 함께 조정해 주시면 다시 찾아볼게요."
            )
            return refined_request, metadata

        strict_max_tax = max(min(monthly_values) - KRW_MAN, 0)
        current_max_tax = cond.get("maxTax")
        cond["maxTax"] = (
            min(int(current_max_tax), strict_max_tax)
            if current_max_tax is not None
            else strict_max_tax
        )
        cond["criterion"] = "LOW_TAX"
        return refined_request, metadata

    deposit_values = [get_room_deposit(room) for room in rooms if get_room_deposit(room) > 0]
    if not deposit_values:
        metadata["message"] = (
            "지금 추천드린 전세 방들의 보증금 정보를 기준으로는 더 저렴한 방을 좁혀 찾기 어려워요. "
            "지역이나 방 조건을 함께 조정해 주시면 다시 찾아볼게요."
        )
        return refined_request, metadata

    strict_max_deposit = max(min(deposit_values) - KRW_MAN, 0)
    current_max_deposit = cond.get("maxDeposit")
    cond["maxDeposit"] = (
        min(int(current_max_deposit), strict_max_deposit)
        if current_max_deposit is not None
        else strict_max_deposit
    )
    cond["criterion"] = "LOW_DEPOSIT"
    return refined_request, metadata


def apply_relative_area_result_filter(
    message_text: str,
    rooms: list[dict[str, Any]],
    previous_rooms: list[dict[str, Any]] | None,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    metadata = {
        "applied": False,
        "reason": None,
        "message": None,
        "preservePreviousRooms": False,
    }
    previous = list(previous_rooms or [])
    current_rooms = list(rooms or [])

    if not previous:
        return current_rooms, metadata

    previous_areas = [get_room_area(room) for room in previous if get_room_area(room) > 0]
    if not previous_areas:
        return current_rooms, metadata

    if is_stricter_large_area_message(message_text):
        baseline = max(previous_areas)
        filtered_rooms = [room for room in current_rooms if get_room_area(room) > baseline]
        metadata.update(
            {
                "applied": True,
                "reason": "LARGER_THAN_PREVIOUS",
                "preservePreviousRooms": True,
            }
        )
        if not filtered_rooms:
            metadata["message"] = (
                "지금 추천드린 방들보다 면적이 더 넓은 방은 찾지 못했어요. "
                "지역을 넓히거나 예산 조건을 함께 조정하면 다시 찾아볼게요."
            )
        return filtered_rooms, metadata

    if is_stricter_small_area_message(message_text):
        baseline = min(previous_areas)
        filtered_rooms = [
            room for room in current_rooms if 0 < get_room_area(room) < baseline
        ]
        metadata.update(
            {
                "applied": True,
                "reason": "SMALLER_THAN_PREVIOUS",
                "preservePreviousRooms": True,
            }
        )
        if not filtered_rooms:
            metadata["message"] = (
                "지금 추천드린 방들보다 면적이 더 작은 방은 찾지 못했어요. "
                "지역이나 예산 조건을 조금 조정하면 다시 찾아볼게요."
            )
        return filtered_rooms, metadata

    return current_rooms, metadata


def sort_rooms(
    rooms: list[dict[str, Any]],
    preference: dict[str, Any],
    *,
    room_type: str | None = None,
) -> list[dict[str, Any]]:
    copied = list(rooms or [])
    sort_by = str(preference.get("sortBy") or "LATEST")
    if sort_by == "LOW_COST":
        effective_room_type = str(room_type or "").upper()
        if effective_room_type == "M":
            return sorted(copied, key=lambda item: (get_room_monthly(item), get_room_deposit(item)))
        if effective_room_type == "L":
            return sorted(copied, key=lambda item: (get_room_deposit(item), get_room_monthly(item)))
        return sorted(copied, key=get_room_cost_score)
    if sort_by == "HIGH_COST":
        effective_room_type = str(room_type or "").upper()
        if effective_room_type == "M":
            return sorted(
                copied,
                key=lambda item: (get_room_monthly(item), get_room_deposit(item)),
                reverse=True,
            )
        if effective_room_type == "L":
            return sorted(
                copied,
                key=lambda item: (get_room_deposit(item), get_room_monthly(item)),
                reverse=True,
            )
        return sorted(copied, key=get_room_cost_score, reverse=True)
    if sort_by == "LARGE_AREA":
        return sorted(
            copied,
            key=lambda item: float(item.get("roomArea") or 0),
            reverse=True,
        )
    if sort_by == "SMALL_AREA":
        return sorted(copied, key=lambda item: float(item.get("roomArea") or 0))
    return copied


def format_money_kr(value: Any) -> str:
    amount = int(value or 0)
    if amount <= 0:
        return "0원"

    eok = amount // 100_000_000
    man = round((amount % 100_000_000) / 10_000)
    if eok > 0 and man > 0:
        return f"{eok}억 {man}만 원"
    if eok > 0:
        return f"{eok}억 원"
    return f"{man}만 원"


def format_room_price(room: dict[str, Any]) -> str:
    deposit = room.get("roomDeposit")
    monthly = room.get("roomMonthly")
    if str(room.get("roomMethod") or "").upper() == "M":
        return f"보증금 {format_money_kr(deposit)} / 월세 {format_money_kr(monthly)}"
    return f"전세 {format_money_kr(deposit)}"


def format_recommended_rooms_message(rooms: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for index, room in enumerate(rooms, start=1):
        parts = [
            f"{index}. {room.get('roomName') or '이름 없는 방'}",
            f"건물: {room.get('houseName')}" if room.get("houseName") else "",
            format_room_price(room),
            f"면적: {room.get('roomArea')}㎡" if room.get("roomArea") else "",
            f"위치: {room.get('houseAddress')}" if room.get("houseAddress") else "",
        ]
        lines.append(" / ".join(part for part in parts if part))
    return "\n".join(lines)


def build_room_query_text(request_data: dict[str, Any], fallback_text: str) -> str:
    normalized = normalize_room_request(request_data)
    cond = normalized["cond"]
    preference = normalized["preference"]
    parts: list[str] = []

    if cond.get("keyword"):
        parts.append(f"{cond['keyword']} 근처")
    if cond.get("roomType") == "M":
        parts.append("월세")
    elif cond.get("roomType") == "L":
        parts.append("전세")
    if cond.get("maxDeposit") is not None:
        parts.append(f"보증금 {format_money_kr(cond['maxDeposit'])} 이하")
    if cond.get("maxTax") is not None:
        parts.append(f"월세 {format_money_kr(cond['maxTax'])} 이하")
    if cond.get("roomRoomCount") == 1:
        parts.append("1인실")
    if cond.get("roomRoomCount") == 2:
        parts.append("2인실")
    if cond.get("houseFemaleLimit"):
        parts.append("여성전용")
    if cond.get("housePetYn"):
        parts.append("반려동물 가능")
    if cond.get("houseElevatorYn"):
        parts.append("엘리베이터")
    if preference.get("sortBy") == "LOW_COST":
        parts.append("저렴한 방")
    if preference.get("sortBy") == "HIGH_COST":
        parts.append("고급 방")
    if preference.get("sortBy") == "LARGE_AREA":
        parts.append("넓은 방")
    if preference.get("sortBy") == "SMALL_AREA":
        parts.append("작은 방")

    return " ".join(str(part).strip() for part in parts if str(part).strip()) or str(
        fallback_text or ""
    ).strip()


def pick_room_from_recommendations(
    message_text: str,
    rooms: list[dict[str, Any]],
) -> dict[str, Any] | None:
    if not isinstance(rooms, list) or not rooms:
        return None

    compact = compact_no_space(message_text)
    if not compact:
        return None

    if "2번" in compact or "두번째" in compact or "두번" in compact:
        return rooms[1] if len(rooms) > 1 else None
    if "3번" in compact or "세번째" in compact or "세번" in compact:
        return rooms[2] if len(rooms) > 2 else None

    for room in rooms:
        room_name = compact_no_space(room.get("roomName"))
        house_name = compact_no_space(room.get("houseName"))
        if (room_name and room_name in compact) or (house_name and house_name in compact):
            return room

    if (
        "1번" in compact
        or "첫번째" in compact
        or "첫방" in compact
        or "그방" in compact
        or "이방" in compact
    ):
        return rooms[0]

    return rooms[0] if is_room_detail_request(message_text) else None


class RoomRecommendationService:
    def __init__(self, client: SpringRoomClient | None = None):
        self.client = client or SpringRoomClient()

    async def recommend(
        self,
        user_text: str,
        *,
        base_request: dict[str, Any] | None = None,
        previous_rooms: list[dict[str, Any]] | None = None,
        size: int = 3,
    ) -> dict[str, Any]:
        request_data = build_room_search_request(user_text, base_request=base_request)
        request_data, refinement_meta = apply_relative_low_cost_refinement(
            user_text,
            request_data,
            previous_rooms,
        )
        rooms: list[dict[str, Any]] = []
        search_mode = "natural"
        query = build_room_query_text(request_data, user_text)

        if has_room_preference(request_data):
            filtered = await self.client.search_rooms_filtered(
                cond=request_data["cond"],
                page=0,
                size=12,
            )
            content = filtered.get("content") if isinstance(filtered, dict) else []
            if isinstance(content, list) and content:
                rooms = filter_rooms_by_request(content, request_data)
                search_mode = "filtered"

        if not rooms:
            natural_rooms = await self.client.search_rooms_natural(query=query)
            rooms = filter_rooms_by_request(natural_rooms, request_data)

        rooms, area_refinement_meta = apply_relative_area_result_filter(
            user_text,
            rooms,
            previous_rooms,
        )
        ranked_rooms = sort_rooms(
            rooms,
            request_data["preference"],
            room_type=str(request_data["cond"].get("roomType") or ""),
        )[:size]

        message = refinement_meta.get("message") or area_refinement_meta.get("message")
        if refinement_meta.get("applied") and not ranked_rooms and not message:
            if str(request_data["cond"].get("roomType") or "").upper() == "M":
                message = (
                    "지금 추천드린 방들보다 월세가 더 저렴한 방은 찾지 못했어요. "
                    "지역을 넓히거나 보증금 조건을 함께 조정하면 다시 찾아볼게요."
                )
            else:
                message = (
                    "지금 추천드린 방들보다 보증금이 더 낮은 전세 방은 찾지 못했어요. "
                    "지역이나 방 조건을 조금 넓혀 주시면 다시 찾아볼게요."
                )

        return {
            "rooms": ranked_rooms,
            "searchMode": search_mode,
            "request": request_data,
            "query": query,
            "message": message,
            "preservePreviousRooms": bool(
                refinement_meta.get("preservePreviousRooms")
                or area_refinement_meta.get("preservePreviousRooms")
            ),
        }
