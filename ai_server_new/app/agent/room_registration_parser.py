from __future__ import annotations

"""사용자 자유 입력에서 방 등록 슬롯을 추출하는 규칙 기반 파서."""

import re
from datetime import date
from typing import Any


HOUSE_NO_PATTERN = re.compile(r"\b([A-Za-z][A-Za-z0-9_-]*\d[A-Za-z0-9_-]*)\b")
ISO_DATE_PATTERN = re.compile(r"\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b")
NUMBER_PATTERN = re.compile(r"(?<!\d)(\d+(?:\.\d+)?)(?!\d)")


def _normalize_date(text: str) -> str | None:
    """날짜 표현을 `YYYY-MM-DD` 형식으로 맞춘다."""

    match = ISO_DATE_PATTERN.search(text)
    if match:
        year, month, day = match.groups()
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"

    compact = text.replace(" ", "")
    today = date.today()
    next_month = today.month + 1
    next_year = today.year + (1 if next_month > 12 else 0)
    next_month = 1 if next_month > 12 else next_month

    relative = re.search(r"다음달(\d{1,2})일", compact)
    if relative:
        day = int(relative.group(1))
        return f"{next_year:04d}-{next_month:02d}-{day:02d}"
    return None


def _parse_options(text: str) -> str | None:
    """방 옵션 문구를 쉼표 기반 문자열로 정리한다."""

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
    """키워드 뒤에 따라오는 숫자를 추출한다."""

    for keyword in keywords:
        pattern = re.compile(re.escape(keyword) + r"\s*[:은는이가]?\s*(\d+(?:\.\d+)?)")
        match = pattern.search(text)
        if match:
            numeric_value = match.group(1)
            return float(numeric_value) if cast_type is float else int(float(numeric_value))
    return None


def _extract_room_method(text: str) -> str | None:
    """월세/전세 표현을 내부 코드값으로 바꾼다."""

    compact = text.lower().replace(" ", "")
    if "월세" in compact or "monthly" in compact or re.search(r"\bm\b", compact):
        return "M"
    if "전세" in compact or "long" in compact or re.search(r"\bl\b", compact):
        return "L"
    return None


def _extract_room_facing(text: str) -> str | None:
    """방향(남향, 북향 등)을 추출한다."""

    match = re.search(r"(남향|북향|동향|서향|남동향|남서향|북동향|북서향)", text)
    if match:
        return match.group(1)

    facing_pattern = re.search(r"방향\s*[:은는이가]?\s*([가-힣]{1,10})", text)
    return facing_pattern.group(1) if facing_pattern else None


def _extract_room_name(text: str) -> str | None:
    """방 이름을 추출한다."""

    match = re.search(
        r"(?:방이름|방 이름|roomname|room name)\s*[:은는이가]?\s*([^\n,]+)",
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
    """한 문장에서 추출 가능한 방 등록 슬롯을 최대한 많이 뽑아낸다."""

    existing_slots = existing_slots or {}
    slots: dict[str, Any] = {}

    house_no = HOUSE_NO_PATTERN.search(text)
    if house_no and not existing_slots.get("houseNo"):
        slots["houseNo"] = house_no.group(1)
    elif existing_slots.get("pending_slot") == "houseNo" and not existing_slots.get("houseNo"):
        # house_s014 같은 식별자는 언더스코어/하이픈이 섞이기 쉬워서
        # 정규식에 걸리지 않아도 "한 단어짜리 답변"이면 houseNo 후보로 한 번 더 받아 준다.
        compact = text.strip()
        if compact and " " not in compact and len(compact) <= 50:
            slots["houseNo"] = compact

    room_name = _extract_room_name(text)
    if room_name:
        slots["roomName"] = room_name

    deposit = _extract_number_after_keywords(text, ("보증금", "deposit"), int)
    if deposit is not None:
        slots["roomDeposit"] = deposit

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

    room_count = _extract_number_after_keywords(text, ("방개수", "방 개수", "침실", "룸수"), int)
    if room_count is not None:
        slots["roomRoomCount"] = room_count

    bath_count = _extract_number_after_keywords(text, ("욕실", "화장실", "bath"), int)
    if bath_count is not None:
        slots["roomBathCount"] = bath_count

    abstract = re.search(r"(?:소개|설명|비고)\s*[:은는이가]?\s*([^\n]+)", text)
    if abstract:
        slots["roomAbstract"] = abstract.group(1).strip()

    options = _parse_options(text)
    if options:
        slots["roomOptions"] = options

    numeric_values = NUMBER_PATTERN.findall(text)
    pending_slot = existing_slots.get("pending_slot")
    if len(numeric_values) == 1 and pending_slot in {
        "roomDeposit",
        "roomMonthly",
        "roomArea",
        "roomRoomCount",
        "roomBathCount",
    }:
        if pending_slot == "roomMonthly" and existing_slots.get("roomMethod") != "M":
            # 거래 방식이 월세(M)로 확정되기 전에는
            # 숫자 한 개 입력을 월세로 자동 해석하지 않는다.
            return slots
        numeric_value = numeric_values[0]
        slots[pending_slot] = float(numeric_value) if pending_slot == "roomArea" else int(float(numeric_value))

    return slots
