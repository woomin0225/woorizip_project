from __future__ import annotations

import re
from datetime import date
from typing import Any


HOUSE_NO_PATTERN = re.compile(r"\b([A-Za-z]{1,4}\d{1,10})\b")
ISO_DATE_PATTERN = re.compile(r"\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b")
NUMBER_PATTERN = re.compile(r"(?<!\d)(\d+(?:\.\d+)?)(?!\d)")


def _normalize_date(text: str) -> str | None:
    match = ISO_DATE_PATTERN.search(text)
    if match:
        year, month, day = match.groups()
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
    compact = text.replace(" ", "")
    today = date.today()
    next_month = today.month + 1
    next_year = today.year + (1 if next_month > 12 else 0)
    next_month = 1 if next_month > 12 else next_month
    relative = re.search(r"\ub2e4\uc74c\ub2ec(\d{1,2})\uc77c", compact)
    if relative:
        day = int(relative.group(1))
        return f"{next_year:04d}-{next_month:02d}-{day:02d}"
    return None


def _parse_options(text: str) -> str | None:
    option_keywords = ("\uc635\uc158", "\uc5d0\uc5b4\ucee8", "\uc138\ud0c1\uae30", "\ub0c9\uc7a5\uace0", "\uce68\ub300", "\ucc45\uc0c1", "\uc634\uc7a5")
    if not any(keyword in text for keyword in option_keywords) and "," not in text:
        return None
    candidates = []
    for raw in re.split(r"[,/]|및|하고|\s", text):
        item = raw.strip()
        if item and item not in {"\uc635\uc158", "\uc788\uc5b4", "\uc788\uc74c", "\ucd94\uac00"}:
            candidates.append(item)
    return ",".join(dict.fromkeys(candidates)) if candidates else None


def _extract_number_after_keywords(text: str, keywords: tuple[str, ...], cast_type):
    for keyword in keywords:
        pattern = re.compile(re.escape(keyword) + r"\s*[:은는이가]?\s*(\d+(?:\.\d+)?)")
        match = pattern.search(text)
        if match:
            numeric_value = match.group(1)
            return float(numeric_value) if cast_type is float else int(float(numeric_value))
    return None


def _extract_room_method(text: str) -> str | None:
    compact = text.lower().replace(" ", "")
    if "\uc6d4\uc138" in compact or "monthly" in compact or re.search(r"\bm\b", compact):
        return "M"
    if "\uc804\uc138" in compact or "long" in compact or re.search(r"\bl\b", compact):
        return "L"
    return None


def _extract_room_facing(text: str) -> str | None:
    match = re.search(r"(\ub0a8\ud5a5|\ubd81\ud5a5|\ub3d9\ud5a5|\uc11c\ud5a5|\ub0a8\ub3d9\ud5a5|\ub0a8\uc11c\ud5a5|\ubd81\ub3d9\ud5a5|\ubd81\uc11c\ud5a5)", text)
    if match:
        return match.group(1)
    facing_pattern = re.search(r"\ubc29\ud5a5\s*[:은는이가]?\s*([가-힣]{1,10})", text)
    return facing_pattern.group(1) if facing_pattern else None


def _extract_room_name(text: str) -> str | None:
    match = re.search(r"(?:\ubc29\uc774\ub984|\ubc29 \uc774\ub984|roomname|room name)\s*[:은는이가]?\s*([^\n,]+)", text, re.IGNORECASE)
    if match:
        value = match.group(1).strip()
        for stop_token in ("\ubcf4\uc99d\uae08", "\uc6d4\uc138", "\uba74\uc801", "\uc785\uc8fc", "\uce68\uc2e4"):
            if stop_token in value:
                value = value.split(stop_token)[0].strip()
        return value or None
    quote = re.search(r"['\"]([^'\"]+)['\"]", text)
    return quote.group(1).strip() if quote else None


def extract_room_slots(text: str, existing_slots: dict[str, Any] | None = None) -> dict[str, Any]:
    existing_slots = existing_slots or {}
    slots: dict[str, Any] = {}
    house_no = HOUSE_NO_PATTERN.search(text)
    if house_no and not existing_slots.get("houseNo"):
        slots["houseNo"] = house_no.group(1)
    room_name = _extract_room_name(text)
    if room_name:
        slots["roomName"] = room_name
    deposit = _extract_number_after_keywords(text, ("\ubcf4\uc99d\uae08", "deposit"), int)
    if deposit is not None:
        slots["roomDeposit"] = deposit
    monthly = _extract_number_after_keywords(text, ("\uc6d4\uc138", "monthly", "\uad00\ub9ac\ube44"), int)
    if monthly is not None:
        slots["roomMonthly"] = monthly
    room_method = _extract_room_method(text)
    if room_method:
        slots["roomMethod"] = room_method
    area = _extract_number_after_keywords(text, ("\uba74\uc801", "\uc804\uc6a9\uba74\uc801", "\ub113\uc774", "\ud3c9\uc218", "area"), float)
    if area is not None:
        slots["roomArea"] = area
    facing = _extract_room_facing(text)
    if facing:
        slots["roomFacing"] = facing
    available_date = _normalize_date(text)
    if available_date:
        slots["roomAvailableDate"] = available_date
    room_count = _extract_number_after_keywords(text, ("\ubc29\uac1c\uc218", "\ubc29 \uac1c\uc218", "\uce68\uc2e4", "\ub8f8\uc218"), int)
    if room_count is not None:
        slots["roomRoomCount"] = room_count
    bath_count = _extract_number_after_keywords(text, ("\uc695\uc2e4", "\ud654\uc7a5\uc2e4", "bath"), int)
    if bath_count is not None:
        slots["roomBathCount"] = bath_count
    abstract = re.search(r"(?:\uc18c\uac1c|\uc124\uba85|\ube44\uace0)\s*[:은는이가]?\s*([^\n]+)", text)
    if abstract:
        slots["roomAbstract"] = abstract.group(1).strip()
    options = _parse_options(text)
    if options:
        slots["roomOptions"] = options

    numeric_values = NUMBER_PATTERN.findall(text)
    pending_slot = existing_slots.get("pending_slot")
    if len(numeric_values) == 1 and pending_slot in {"roomDeposit", "roomMonthly", "roomArea", "roomRoomCount", "roomBathCount"}:
        numeric_value = numeric_values[0]
        slots[pending_slot] = float(numeric_value) if pending_slot == "roomArea" else int(float(numeric_value))
    return slots
