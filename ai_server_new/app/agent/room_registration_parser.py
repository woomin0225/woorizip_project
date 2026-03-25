from __future__ import annotations

"""Rule-based slot parser for room registration chat inputs."""

import re
from datetime import date, timedelta
from typing import Any


HOUSE_NO_PATTERN = re.compile(r"\b([A-Za-z][A-Za-z0-9_-]*\d[A-Za-z0-9_-]*)\b")
ISO_DATE_PATTERN = re.compile(r"\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b")
NUMBER_PATTERN = re.compile(r"(?<!\d)(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?!\d)")

KOREAN_NUMBER_MAP = {
    "영": 0,
    "공": 0,
    "일": 1,
    "한": 1,
    "이": 2,
    "두": 2,
    "삼": 3,
    "세": 3,
    "사": 4,
    "네": 4,
    "오": 5,
    "육": 6,
    "륙": 6,
    "칠": 7,
    "팔": 8,
    "구": 9,
}

KOREAN_SMALL_UNIT_MAP = {
    "십": 10,
    "백": 100,
    "천": 1000,
}

KOREAN_COUNT_WORD_MAP = {
    "하나": 1,
    "한개": 1,
    "한칸": 1,
    "한개요": 1,
    "둘": 2,
    "두개": 2,
    "두칸": 2,
    "셋": 3,
    "세개": 3,
    "세칸": 3,
    "넷": 4,
    "네개": 4,
    "네칸": 4,
    "다섯": 5,
    "여섯": 6,
    "일곱": 7,
    "여덟": 8,
    "아홉": 9,
    "열": 10,
}

MONEY_SLOTS = {"roomDeposit", "roomMonthly"}

FACING_NORMALIZATION_MAP = {
    "남": "남향",
    "북": "북향",
    "동": "동향",
    "서": "서향",
    "남동": "남동향",
    "남서": "남서향",
    "북동": "북동향",
    "북서": "북서향",
    "남향": "남향",
    "북향": "북향",
    "동향": "동향",
    "서향": "서향",
    "남동향": "남동향",
    "남서향": "남서향",
    "북동향": "북동향",
    "북서향": "북서향",
}


def _normalize_date(text: str) -> str | None:
    """Normalize date-like expressions into YYYY-MM-DD."""

    match = ISO_DATE_PATTERN.search(text)
    if match:
        year, month, day = match.groups()
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"

    compact = re.sub(r"\s+", "", text)
    today = date.today()

    if "오늘" in compact:
        return today.strftime("%Y-%m-%d")
    if "내일" in compact:
        return (today + timedelta(days=1)).strftime("%Y-%m-%d")

    korean_full = re.search(r"\b(20\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일?\b", text)
    if korean_full:
        year, month, day = korean_full.groups()
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"

    korean_month_day = re.search(r"\b(\d{1,2})\s*월\s*(\d{1,2})\s*일?\b", text)
    if korean_month_day:
        month, day = korean_month_day.groups()
        return f"{date.today().year:04d}-{int(month):02d}-{int(day):02d}"

    compact = text.replace(" ", "")
    next_month = today.month + 1
    next_year = today.year + (1 if next_month > 12 else 0)
    next_month = 1 if next_month > 12 else next_month

    relative = re.search(r"다음달(\d{1,2})일?", compact)
    if relative:
        day = int(relative.group(1))
        return f"{next_year:04d}-{next_month:02d}-{day:02d}"

    return None


def _parse_options(text: str) -> str | None:
    """Parse room options into a comma-separated string."""

    option_keywords = ("옵션", "에어컨", "세탁기", "냉장고", "침대", "책상", "옷장")
    if not any(keyword in text for keyword in option_keywords) and "," not in text:
        return None

    candidates = []
    for raw in re.split(r"[,/]|하고|\s", text):
        item = raw.strip()
        if item and item not in {"옵션", "있어", "있음", "추가"}:
            candidates.append(item)
    return ",".join(dict.fromkeys(candidates)) if candidates else None


def _extract_number_after_keywords(text: str, keywords: tuple[str, ...], cast_type):
    """Extract a number that appears after one of the given keywords."""

    for keyword in keywords:
        pattern = re.compile(
            re.escape(keyword) + r"\s*(?:은|는|이|가|:)?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)"
        )
        match = pattern.search(text)
        if match:
            numeric_value = match.group(1).replace(",", "")
            return float(numeric_value) if cast_type is float else int(float(numeric_value))
    return None


def _parse_small_korean_number(value: str) -> int | None:
    compact = str(value or "").strip()
    if not compact:
        return None
    if compact.isdigit():
        return int(compact)

    total = 0
    pending: int | None = None
    digit_buffer = ""

    for char in compact:
        if char.isdigit():
            digit_buffer += char
            continue

        if digit_buffer:
            pending = int(digit_buffer)
            digit_buffer = ""

        if char in KOREAN_NUMBER_MAP:
            pending = KOREAN_NUMBER_MAP[char]
            continue

        if char in KOREAN_SMALL_UNIT_MAP:
            unit = KOREAN_SMALL_UNIT_MAP[char]
            total += (pending if pending is not None else 1) * unit
            pending = None
            continue

        return None

    if digit_buffer:
        pending = int(digit_buffer)
    if pending is not None:
        total += pending
    return total


def _parse_count_value(value: str) -> int | None:
    compact = re.sub(r"\s+", "", str(value or "").strip())
    if not compact:
        return None

    if compact.isdigit():
        return int(compact)

    normalized = compact.replace("개", "").replace("칸", "").replace("개요", "")
    if normalized in KOREAN_COUNT_WORD_MAP:
        return KOREAN_COUNT_WORD_MAP[normalized]

    return _parse_small_korean_number(normalized)


def _extract_count_after_keywords(text: str, keywords: tuple[str, ...]) -> int | None:
    for keyword in keywords:
        pattern = re.compile(re.escape(keyword) + r"\s*(?:은|는|이|가|:)?\s*([0-9가-힣]+)")
        match = pattern.search(text)
        if not match:
            continue
        count_value = _parse_count_value(match.group(1))
        if count_value is not None:
            return count_value
    return None


def _parse_money_amount(value: str) -> int | None:
    """Parse flexible Korean money expressions into won."""

    compact = str(value or "").strip().lower()
    if not compact:
        return None

    compact = compact.replace(" ", "").replace(",", "").replace("원", "")
    if not compact:
        return None

    if compact.isdigit():
        return int(compact)

    total = 0
    remainder = compact
    has_eok = "억" in compact
    has_man = "만" in compact

    if not has_eok and not has_man:
        base_value = _parse_small_korean_number(compact)
        if base_value is None:
            return None
        return base_value * 10_000

    if has_eok:
        head, remainder = remainder.split("억", 1)
        head_value = _parse_small_korean_number(head) if head else 1
        if head_value is None:
            return None
        total += head_value * 100_000_000

    if "만" in remainder:
        head, remainder = remainder.split("만", 1)
        head_value = _parse_small_korean_number(head) if head else 1
        if head_value is None:
            return None
        total += head_value * 10_000
        has_man = True

    if remainder:
        tail_value = _parse_small_korean_number(remainder)
        if tail_value is None:
            return None
        if has_eok and not has_man:
            total += tail_value * 10_000
        else:
            total += tail_value

    if total > 0 or compact in {"0", "영", "공"}:
        return total

    return None


def _extract_money_after_keywords(text: str, keywords: tuple[str, ...]) -> int | None:
    for keyword in keywords:
        pattern = re.compile(re.escape(keyword) + r"\s*(?:은|는|이|가|:)?\s*([0-9,가-힣]+)")
        match = pattern.search(text)
        if not match:
            continue
        money_value = _parse_money_amount(match.group(1))
        if money_value is not None:
            return money_value
    return None


def _extract_room_method(text: str) -> str | None:
    """Map room trade method expressions to internal codes."""

    compact = text.lower().replace(" ", "")
    normalized = re.sub(r"[^a-z0-9가-힣]", "", compact)

    if normalized in {"월", "월세", "m", "monthly"}:
        return "M"
    if normalized in {"전", "전세", "l", "long"}:
        return "L"
    if "월세" in compact or "monthly" in compact or re.search(r"\bm\b", compact):
        return "M"
    if "전세" in compact or "long" in compact or re.search(r"\bl\b", compact):
        return "L"
    return None


def _extract_room_facing(text: str) -> str | None:
    """Extract facing direction such as 남향 or 동향."""

    match = re.search(r"(남향|북향|동향|서향|남동향|남서향|북동향|북서향)", text)
    if match:
        return match.group(1)

    compact = re.sub(r"[^가-힣]", "", text)
    for raw, normalized in sorted(
        FACING_NORMALIZATION_MAP.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    ):
        if compact == raw or compact.endswith(raw):
            return normalized

    facing_pattern = re.search(r"방향\s*(?:은|는|이|가|:)?\s*([가-힣]{1,10})", text)
    if not facing_pattern:
        return None

    raw_value = facing_pattern.group(1).strip()
    return FACING_NORMALIZATION_MAP.get(raw_value, raw_value)


def _extract_room_name(text: str) -> str | None:
    """Extract room name from free-form input."""

    match = re.search(
        r"(?:방이름|방 이름|roomname|room name)\s*(?:은|는|이|가|:)?\s*([^\n,]+)",
        text,
        re.IGNORECASE,
    )
    if match:
        value = match.group(1).strip()
        for stop_token in ("보증금", "월세", "면적", "입주", "침실"):
            if stop_token in value:
                value = value.split(stop_token)[0].strip()
        return value or None

    quote = re.search(r"['\"]([^'\"]+)['\"]", text)
    return quote.group(1).strip() if quote else None


def extract_room_slots(text: str, existing_slots: dict[str, Any] | None = None) -> dict[str, Any]:
    """Extract as many room registration slots as possible from one utterance."""

    existing_slots = existing_slots or {}
    slots: dict[str, Any] = {}

    house_no = HOUSE_NO_PATTERN.search(text)
    if house_no and not existing_slots.get("houseNo"):
        slots["houseNo"] = house_no.group(1)
    elif existing_slots.get("pending_slot") == "houseNo" and not existing_slots.get("houseNo"):
        compact = text.strip()
        if compact and " " not in compact and len(compact) <= 50:
            slots["houseNo"] = compact

    room_name = _extract_room_name(text)
    if room_name:
        slots["roomName"] = room_name

    deposit = _extract_money_after_keywords(text, ("보증금", "deposit"))
    if deposit is None:
        deposit = _extract_number_after_keywords(text, ("보증금", "deposit"), int)
    if deposit is not None:
        slots["roomDeposit"] = deposit

    monthly = _extract_money_after_keywords(text, ("월세", "monthly", "관리비"))
    if monthly is None:
        monthly = _extract_number_after_keywords(text, ("월세", "monthly", "관리비"), int)
    if monthly is not None:
        slots["roomMonthly"] = monthly

    room_method = _extract_room_method(text)
    if room_method:
        slots["roomMethod"] = room_method

    area = _extract_number_after_keywords(text, ("면적", "전용면적", "넓이", "평수", "area"), float)
    if area is not None:
        slots["roomArea"] = area

    facing = _extract_room_facing(text)
    if facing:
        slots["roomFacing"] = facing

    available_date = _normalize_date(text)
    if available_date:
        slots["roomAvailableDate"] = available_date

    room_count = _extract_count_after_keywords(text, ("방개수", "방 갯수", "침실", "룸수"))
    if room_count is None:
        room_count = _extract_number_after_keywords(text, ("방개수", "방 갯수", "침실", "룸수"), int)
    if room_count is not None:
        slots["roomRoomCount"] = room_count

    bath_count = _extract_count_after_keywords(text, ("욕실", "화장실", "bath"))
    if bath_count is None:
        bath_count = _extract_number_after_keywords(text, ("욕실", "화장실", "bath"), int)
    if bath_count is not None:
        slots["roomBathCount"] = bath_count

    abstract = re.search(r"(?:소개|설명|비고)\s*(?:은|는|이|가|:)?\s*([^\n]+)", text)
    if abstract:
        slots["roomAbstract"] = abstract.group(1).strip()

    options = _parse_options(text)
    if options:
        slots["roomOptions"] = options

    pending_slot = existing_slots.get("pending_slot")
    if pending_slot in MONEY_SLOTS:
        money_value = _parse_money_amount(text)
        if money_value is not None:
            if pending_slot == "roomMonthly" and existing_slots.get("roomMethod") != "M":
                return slots
            slots[pending_slot] = money_value

    numeric_values = [value.replace(",", "") for value in NUMBER_PATTERN.findall(text)]
    if len(numeric_values) == 1 and pending_slot in {
        "roomDeposit",
        "roomMonthly",
        "roomArea",
        "roomRoomCount",
        "roomBathCount",
    } and pending_slot not in slots:
        if pending_slot == "roomMonthly" and existing_slots.get("roomMethod") != "M":
            return slots
        numeric_value = numeric_values[0]
        slots[pending_slot] = (
            float(numeric_value) if pending_slot == "roomArea" else int(float(numeric_value))
        )

    if pending_slot in {"roomRoomCount", "roomBathCount"} and pending_slot not in slots:
        count_value = _parse_count_value(text)
        if count_value is not None:
            slots[pending_slot] = count_value

    return slots
