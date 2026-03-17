import json
import re
import dateparser
from datetime import datetime


def clean_title(title: str):
    cleaned = re.sub(r"[\d]", "", title)
    return cleaned


def parse_time(user_text: str):
    return dateparser.parse(
        user_text,
        settings={"PREFER_DATES_FROM": "future", "RELATIVE_BASE": datetime.now()},
    )


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
