# app/services/room_caption_sanitizer.py

from __future__ import annotations

import re


class RoomCaptionSanitizer:

    @staticmethod
    def split_ocr_texts(ocr_text: str) -> list[str]:
        if not ocr_text:
            return []
        parts = re.split(r'[\n,|/]+', ocr_text)
        return [p.strip() for p in parts if p and p.strip()]

    @staticmethod
    def is_noise_ocr_text(text: str) -> bool:
        if not text:
            return True

        value = text.strip()
        if not value:
            return True
        if len(value) <= 1:
            return True

        compact = value.replace(' ', '')
        if len(compact) <= 2 and compact.isascii():
            return True

        has_korean = any('가' <= ch <= '힣' for ch in value)
        if not has_korean and len(value) <= 3:
            return True

        return False

    @classmethod
    def filter_ocr_texts(cls, ocr_texts: list[str]) -> list[str]:
        filtered: list[str] = []
        seen: set[str] = set()

        for text in ocr_texts:
            value = text.strip()
            if cls.is_noise_ocr_text(value):
                continue
            if value in seen:
                continue
            seen.add(value)
            filtered.append(value)

        return filtered

    @staticmethod
    def deduplicate_option_candidates(
        candidates: list[dict[str, object]],
    ) -> tuple[list[dict[str, object]], list[str]]:
        best_by_name: dict[str, dict[str, object]] = {}

        for candidate in candidates:
            name = candidate.get('name')
            if not name:
                continue

            prev = best_by_name.get(str(name))
            if prev is None or float(candidate.get('confidence', 0.0)) > float(prev.get('confidence', 0.0)):
                best_by_name[str(name)] = candidate

        deduped = sorted(
            best_by_name.values(),
            key=lambda x: (-float(x.get('confidence', 0.0)), str(x.get('name', '')))
        )
        normalized_options = [str(item['name']) for item in deduped]
        return deduped, normalized_options

    @staticmethod
    def get_caption_aliases() -> dict[str, list[str]]:
        return {
            '침대': ['침대', 'bed'],
            '책상': ['책상', 'desk'],
            '의자': ['의자', 'chair'],
            '에어컨': ['에어컨', '벽 에어컨', '벽걸이 에어컨', 'air conditioner', 'aircon', 'ac'],
            '냉장고': ['냉장고', 'fridge', 'refrigerator'],
            '세탁기': ['세탁기', 'washer', 'washing machine'],
            '전자레인지': ['전자레인지', 'microwave'],
            '옷장': ['옷장', 'closet', 'wardrobe'],
            '수납장': ['수납장', '캐비닛', 'cabinet', 'storage'],
            '인덕션': ['인덕션', '전기레인지', 'induction', 'cooktop'],
            'TV': ['TV', 'tv', '티비', '티브이', '텔레비전'],
            '창문': ['창문', 'window'],
            '화장실': ['화장실', '욕실', 'bathroom'],
            '신발장': ['신발장', 'shoe rack', 'shoe cabinet'],
        }

    @staticmethod
    def get_high_risk_caption_options() -> set[str]:
        return {'옷장', '냉장고', 'TV', '에어컨'}

    @classmethod
    def sanitize_caption(cls, caption_text: str, normalized_options: list[str]) -> str:
        if not caption_text:
            return ''

        cleaned = caption_text
        allowed = set(normalized_options or [])
        aliases_map = cls.get_caption_aliases()

        for option_name in cls.get_high_risk_caption_options():
            if option_name in allowed:
                continue

            for alias in aliases_map.get(option_name, []):
                cleaned = re.sub(re.escape(alias), '', cleaned, flags=re.IGNORECASE)

        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        cleaned = re.sub(r'\s*,\s*', ', ', cleaned)
        cleaned = re.sub(r',\s*,+', ', ', cleaned)
        cleaned = re.sub(r'^,\s*', '', cleaned)
        cleaned = re.sub(r'\s*\.\s*', '. ', cleaned)

        cleaned = re.sub(r',\s*([이가은는을를와과])', r' \1', cleaned)
        cleaned = re.sub(r'\s{2,}', ' ', cleaned)
        cleaned = re.sub(r'\s+,', ',', cleaned)

        cleaned = re.sub(r'(\S)\s+가 보입니다', r'\1이 보입니다', cleaned)
        cleaned = re.sub(r'(\S)\s+이 있습니다', r'\1이 있습니다', cleaned)
        cleaned = re.sub(r'(\S)\s+가 있다', r'\1이 있다', cleaned)

        cleaned = cleaned.strip(' ,')
        if cleaned and not cleaned.endswith('.'):
            cleaned += '.'
        return cleaned.strip(' ,')