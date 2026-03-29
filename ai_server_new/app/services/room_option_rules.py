# app/services/room_option_rules.py

from __future__ import annotations

from typing import Any
import re


class RoomOptionRules:

    @staticmethod
    def get_detection_min_confidence(normalized_name: str) -> float:
        thresholds = {
            'TV': 0.80,
            '옷장': 0.95,
            '에어컨': 0.75,
            '냉장고': 0.85,
        }
        return thresholds.get(normalized_name, 0.5)

    @staticmethod
    def requires_detection_support(normalized_name: str) -> bool:
        return normalized_name in {'옷장', '에어컨', 'TV', '냉장고'}

    @staticmethod
    def normalize_option_name(name: str) -> str | None:
        if not name:
            return None

        text = name.strip().lower()

        option_map = {
            '침대': ['침대', 'bed'],
            '책상': ['책상', 'desk'],
            '의자': ['의자', 'chair'],
            '에어컨': [
                '에어컨',
                '벽걸이에어컨',
                '벽걸이 에어컨',
                '스탠드에어컨',
                '벽 에어컨',
                'air conditioner',
                'wall-mounted air conditioner',
                'wall mounted air conditioner',
                'aircon',
                'ac',
            ],
            '냉장고': ['냉장고', 'fridge', 'refrigerator'],
            '세탁기': ['세탁기', 'washer', 'washing machine'],
            '전자레인지': ['전자레인지', 'microwave'],
            '옷장': ['옷장', 'closet', 'wardrobe'],
            '수납장': ['수납장', '캐비닛', 'cabinet', 'storage'],
            '인덕션': ['인덕션', '전기레인지', 'induction', 'cooktop'],
            'TV': ['tv', '티비', '티브이', '텔레비전'],
            '창문': ['창문', 'window'],
            '화장실': ['화장실', '욕실', 'bathroom'],
            '신발장': ['신발장', 'shoe rack', 'shoe cabinet'],
        }

        for normalized, keywords in option_map.items():
            for keyword in keywords:
                if keyword in text:
                    return normalized
        return None

    @staticmethod
    def contains_negative_phrase(text: str) -> bool:
        if not text:
            return False

        lowered = text.strip().lower()

        negative_keywords = [
            '없음',
            '없다',
            '없고',
            '없는',
            '없습니다',
            '미제공',
            '제공되지 않',
            '없어 보',
            '안 보',
            '보이지 않',
            '확인되지 않',
            '식별되지 않',
            '찾을 수 없',
            '미확인',
            'not visible',
            'not shown',
            'not detected',
            'not found',
            'without',
            'no ',
        ]
        return any(keyword in lowered for keyword in negative_keywords)

    @staticmethod
    def contains_positive_phrase(text: str) -> bool:
        if not text:
            return False

        lowered = text.strip().lower()

        positive_keywords = [
            '보입니다',
            '있습니다',
            '확인됩니다',
            '마련되어',
            '구비되어',
            '있다',
            '보인다',
            '확인됨',
            'visible',
            'shown',
            'detected',
        ]
        return any(keyword in lowered for keyword in positive_keywords)

    @classmethod
    def is_negative_option_mention(cls, text: str, normalized_name: str) -> bool:
        if not text or not normalized_name:
            return False

        lowered = text.strip().lower()

        alias_map = {
            'WiFi': ['wifi', 'wi-fi', '인터넷', '무선인터넷'],
            '침대': ['침대', 'bed'],
            '책상': ['책상', 'desk'],
            '의자': ['의자', 'chair'],
            '에어컨': ['에어컨', '벽 에어컨', 'air conditioner', 'aircon'],
            '냉장고': ['냉장고', 'fridge', 'refrigerator'],
            '세탁기': ['세탁기', 'washer', 'washing machine'],
            '전자레인지': ['전자레인지', 'microwave'],
            '옷장': ['옷장', 'closet', 'wardrobe'],
            '수납장': ['수납장', '캐비닛', 'cabinet', 'storage'],
            '인덕션': ['인덕션', '전기레인지', 'induction', 'cooktop'],
            'TV': ['tv', '티비', '티브이', '텔레비전'],
            '창문': ['창문', 'window'],
            '화장실': ['화장실', '욕실', 'bathroom'],
            '신발장': ['신발장', 'shoe rack', 'shoe cabinet'],
        }

        aliases = alias_map.get(normalized_name, [normalized_name.lower()])
        if not any(alias in lowered for alias in aliases):
            return False

        return cls.contains_negative_phrase(lowered)

    @staticmethod
    def split_sentences(text: str) -> list[str]:
        if not text:
            return []
        return [s.strip() for s in re.split(r'[.!?\n]+', text) if s and s.strip()]

    @staticmethod
    def split_clauses(text: str) -> list[str]:
        if not text:
            return []
        return [s.strip() for s in re.split(r'[;\n/]| 그리고 | 하지만 | 그런데 |며 |고 ', text) if s and s.strip()]

    @classmethod
    def extract_option_names_from_text(cls, text: str) -> list[str]:
        names: list[str] = []

        for token in re.split(r'[,\n/]| 그리고 | 및 | 와 | 과 | 나 | 또는 ', text):
            token = token.strip()
            if not token:
                continue

            normalized = cls.normalize_option_name(token)
            if normalized:
                names.append(normalized)

        return list(dict.fromkeys(names))

    @classmethod
    def extract_negative_option_names(cls, caption_text: str) -> set[str]:
        if not caption_text:
            return set()

        negative_names: set[str] = set()

        for sentence in cls.split_sentences(caption_text):
            for clause in cls.split_clauses(sentence):
                if not cls.contains_negative_phrase(clause):
                    continue

                for normalized in cls.extract_option_names_from_text(clause):
                    negative_names.add(normalized)

        return negative_names

    @classmethod
    def extract_positive_option_names(cls, caption_text: str) -> set[str]:
        if not caption_text:
            return set()

        positive_names: set[str] = set()

        for sentence in cls.split_sentences(caption_text):
            for clause in cls.split_clauses(sentence):
                if cls.contains_negative_phrase(clause):
                    continue
                if not cls.contains_positive_phrase(clause):
                    continue

                for normalized in cls.extract_option_names_from_text(clause):
                    positive_names.add(normalized)

        return positive_names

    @classmethod
    def has_detection_support(
        cls,
        normalized_name: str,
        detected_items: list[dict[str, Any]],
        min_confidence: float = 0.5,
    ) -> bool:
        for item in detected_items:
            raw_name = str(item.get('name', '')).strip()
            normalized = cls.normalize_option_name(raw_name)
            if normalized != normalized_name:
                continue

            try:
                confidence = float(item.get('score', 0.0))
            except Exception:
                confidence = 0.0

            if confidence >= min_confidence:
                return True

        return False

    @classmethod
    def extract_option_candidates(
        cls,
        caption_text: str,
        detected_items: list[dict[str, Any]],
        ocr_texts: list[str],
        caption_tags: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        candidates: list[dict[str, Any]] = []

        negative_option_names = cls.extract_negative_option_names(caption_text)
        positive_option_names = cls.extract_positive_option_names(caption_text)

        for normalized in positive_option_names:
            if normalized in negative_option_names:
                continue

            if cls.requires_detection_support(normalized):
                min_confidence = cls.get_detection_min_confidence(normalized)
                if not cls.has_detection_support(normalized, detected_items, min_confidence=min_confidence):
                    continue

                if normalized == '옷장':
                    continue

            candidates.append({
                'name': normalized,
                'confidence': 0.7,
                'source': 'caption',
            })

        for tag in caption_tags or []:
            tag = str(tag).strip()
            if not tag:
                continue

            normalized = cls.normalize_option_name(tag)
            if not normalized:
                continue

            if normalized in negative_option_names:
                continue

            min_confidence = cls.get_detection_min_confidence(normalized)

            if cls.requires_detection_support(normalized):
                if not cls.has_detection_support(normalized, detected_items, min_confidence=min_confidence):
                    continue

                if normalized == '옷장':
                    continue

            elif normalized not in positive_option_names:
                if not cls.has_detection_support(normalized, detected_items, min_confidence=0.5):
                    continue

            candidates.append({
                'name': normalized,
                'confidence': 0.8,
                'source': 'caption',
            })

        for item in detected_items:
            raw_name = str(item.get('name', '')).strip()

            try:
                confidence = float(item.get('score', 0.8))
            except Exception:
                confidence = 0.8

            normalized = cls.normalize_option_name(raw_name)
            if not normalized:
                continue

            min_confidence = cls.get_detection_min_confidence(normalized)
            if confidence < min_confidence:
                continue

            if normalized in negative_option_names and confidence < 0.8:
                continue

            lowered = raw_name.lower()
            if normalized == 'TV' and ('ac' in lowered or 'air conditioner' in lowered):
                continue

            candidates.append({
                'name': normalized,
                'confidence': confidence,
                'source': 'detection',
            })

        for text in ocr_texts:
            text = text.strip()
            if not text:
                continue

            normalized = cls.normalize_option_name(text)
            if not normalized:
                continue

            if cls.is_negative_option_mention(text, normalized):
                continue

            candidates.append({
                'name': normalized,
                'confidence': 0.6,
                'source': 'ocr',
            })

        return candidates