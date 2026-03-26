import json
import re
import dateparser
from datetime import date, datetime, timedelta


WEEKDAY_INDEX = {
    "월": 0,
    "화": 1,
    "수": 2,
    "목": 3,
    "금": 4,
    "토": 5,
    "일": 6,
}

RELATIVE_DAY_OFFSETS = {
    "오늘": 0,
    "내일": 1,
    "모레": 2,
    "글피": 3,
}


def clean_title(title: str):
    cleaned = re.sub(r"[\d]", "", title)
    return cleaned


def parse_time(user_text: str, *, base: datetime | None = None):
    base_dt = base or datetime.now()
    normalized = re.sub(r"\s+", " ", str(user_text or "")).strip()
    if not normalized:
        return None

    parsed = _parse_korean_datetime(normalized, base_dt)
    if parsed:
        return parsed

    return dateparser.parse(
        normalized,
        languages=["ko"],
        settings={"PREFER_DATES_FROM": "future", "RELATIVE_BASE": base_dt},
    )


def _parse_korean_datetime(user_text: str, base: datetime) -> datetime | None:
    parsed_time = _extract_time(user_text)
    if not parsed_time:
        return None

    parsed_date = _extract_date(user_text, base, parsed_time)
    has_explicit_day = parsed_date is not None

    if not parsed_date:
        parsed_date = base.date()

    parsed_datetime = datetime.combine(parsed_date, parsed_time)

    if not has_explicit_day and parsed_datetime <= base:
        parsed_datetime += timedelta(days=1)

    return parsed_datetime


def _extract_time(user_text: str):
    text = str(user_text or "").strip()
    if not text:
        return None

    if "정오" in text:
        return datetime.strptime("12:00", "%H:%M").time()
    if "자정" in text:
        return datetime.strptime("00:00", "%H:%M").time()

    hour = None
    minute = 0

    colon_match = re.search(r"(\d{1,2})\s*:\s*(\d{1,2})", text)
    if colon_match:
        hour = int(colon_match.group(1))
        minute = int(colon_match.group(2))
    else:
        hour_minute_match = re.search(r"(\d{1,2})\s*시\s*(\d{1,2})\s*분", text)
        if hour_minute_match:
            hour = int(hour_minute_match.group(1))
            minute = int(hour_minute_match.group(2))
        else:
            half_match = re.search(r"(\d{1,2})\s*시\s*반", text)
            if half_match:
                hour = int(half_match.group(1))
                minute = 30
            else:
                hour_match = re.search(r"(\d{1,2})\s*시", text)
                if hour_match:
                    hour = int(hour_match.group(1))
                    minute = 0

    if hour is None or hour > 24 or minute > 59:
        return None

    meridiem = None
    if any(token in text for token in ("오전", "아침")):
        meridiem = "am"
    elif "오후" in text:
        meridiem = "pm"
    elif any(token in text for token in ("저녁", "밤")):
        meridiem = "night"

    if meridiem == "am":
        if hour == 12:
            hour = 0
    elif meridiem in {"pm", "night"}:
        if 1 <= hour < 12:
            hour += 12
        elif meridiem == "night" and hour == 12:
            hour = 0

    if hour == 24 and minute == 0:
        hour = 0

    if hour > 23:
        return None

    return datetime.strptime(f"{hour:02d}:{minute:02d}", "%H:%M").time()


def _extract_date(user_text: str, base: datetime, parsed_time) -> date | None:
    explicit_date = _extract_explicit_date(user_text, base)
    if explicit_date:
        return explicit_date

    for token, offset in RELATIVE_DAY_OFFSETS.items():
        if token in user_text:
            return (base + timedelta(days=offset)).date()

    weekend_match = re.search(r"(이번\s*주|이번주|다음\s*주|다음주)?\s*주말", user_text)
    if weekend_match:
        modifier = _normalize_week_modifier(weekend_match.group(1))
        return _resolve_weekday_date(base, 5, modifier, parsed_time)

    weekday_match = re.search(
        r"(이번\s*주|이번주|다음\s*주|다음주)?\s*([월화수목금토일])요일",
        user_text,
    )
    if weekday_match:
        modifier = _normalize_week_modifier(weekday_match.group(1))
        weekday = WEEKDAY_INDEX[weekday_match.group(2)]
        return _resolve_weekday_date(base, weekday, modifier, parsed_time)

    return None


def _extract_explicit_date(user_text: str, base: datetime) -> date | None:
    year_month_day = re.search(
        r"(?:(\d{4})\s*[./-]\s*)?(\d{1,2})\s*[./-]\s*(\d{1,2})",
        user_text,
    )
    if year_month_day:
        year = int(year_month_day.group(1) or base.year)
        month = int(year_month_day.group(2))
        day = int(year_month_day.group(3))
        return _build_safe_date(year, month, day, base, year_given=bool(year_month_day.group(1)))

    korean_date = re.search(
        r"(?:(\d{4})\s*년\s*)?(\d{1,2})\s*월\s*(\d{1,2})\s*일",
        user_text,
    )
    if korean_date:
        year = int(korean_date.group(1) or base.year)
        month = int(korean_date.group(2))
        day = int(korean_date.group(3))
        return _build_safe_date(year, month, day, base, year_given=bool(korean_date.group(1)))

    return None


def _build_safe_date(
    year: int,
    month: int,
    day: int,
    base: datetime,
    *,
    year_given: bool,
):
    try:
        candidate = datetime(year, month, day).date()
    except ValueError:
        return None

    if year_given:
        return candidate

    if candidate < base.date():
        try:
            return datetime(year + 1, month, day).date()
        except ValueError:
            return candidate
    return candidate


def _normalize_week_modifier(raw: str | None) -> str | None:
    text = str(raw or "").replace(" ", "")
    if text.startswith("이번주") or text == "이번":
        return "this"
    if text.startswith("다음주") or text == "다음":
        return "next"
    return None


def _resolve_weekday_date(
    base: datetime,
    weekday: int,
    modifier: str | None,
    parsed_time,
):
    start_of_week = base.date() - timedelta(days=base.weekday())

    if modifier == "next":
        candidate = start_of_week + timedelta(days=7 + weekday)
    elif modifier == "this":
        candidate = start_of_week + timedelta(days=weekday)
    else:
        days_ahead = (weekday - base.weekday()) % 7
        candidate = base.date() + timedelta(days=days_ahead)

    candidate_dt = datetime.combine(candidate, parsed_time)
    if candidate_dt <= base:
        candidate += timedelta(days=7)

    return candidate


def extract_duration_regex(user_text: str) -> int:
    hour_match = re.search(r"(\d+)\s*시간", user_text)
    minute_match = re.search(r"(\d+)\s*분", user_text)
    half_match = re.search(r"시간\s*반", user_text)

    total_minutes = 0

    if hour_match:
        total_minutes += int(hour_match.group(1)) * 60

    if minute_match:
        total_minutes += int(minute_match.group(1))
    elif half_match:
        total_minutes += 30

    return total_minutes if total_minutes > 0 else 60


def parse_llm_json(text: str) -> dict:
    """LLM 응답 문자열에서 JSON 블록만 추출해서 dict로 반환"""
    try:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        return {}
    except (json.JSONDecodeError, AttributeError):
        return {}
