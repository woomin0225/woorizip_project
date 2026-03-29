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

    @staticmethod
    def normalize_sentence(text: str) -> str:
        cleaned = re.sub(r"\s+", " ", text or "").strip()
        cleaned = re.sub(r"\s*,\s*", ", ", cleaned)
        cleaned = re.sub(r"(,\s*){2,}", ", ", cleaned)
        cleaned = cleaned.strip(" ,")
        
        if cleaned and not re.search(r"[.!?]$", cleaned):
            cleaned += "."
            
        return cleaned
    
    @staticmethod
    def get_optioin_priority() -> list[str]:
        return [
            "에어컨", "침대", "책상", "의자", "옷장",
            "냉장고", "세탁기", "전자레인지", "TV",
            "창문", "신발장", "수납장", "인덕션", "화장실",
        ]
        
    @classmethod
    def order_options(cls, normalized_options: list[str]) -> list[str]:
        seen: set[str] = set()
        cleand_option: list[str] = []
        
        for option in normalized_options or []:
            value = str(option).strip()
            if not value or value in seen:
                continue
            seen.add(value)
            cleand_option.append(value)
            
        priority = cls.get_optioin_priority()
        ordered = [name for name in priority if name in cleand_option]
        ordered.extend([name for name in cleand_option if name not in ordered])
        return ordered
    
    @staticmethod
    def _has_final_consonant(text: str) -> bool:
        if not text:
            return False
        
        last = text[-1]
        if "가" <= last <= "힣":
            return (ord(last) - ord("가")) % 28 != 0
        
        return False
    
    @classmethod
    def _subject_particle(cls, text:str) -> str:
        if not text:
            return "이"
        
        if text[-1].isascii():
            return "가"
        
        return "이" if cls._has_final_consonant(text) else "가"
    
    @classmethod
    def sanitize_caption(cls, caption_text: str, normalized_option: list[str]) -> str:
        ordered_options = cls.order_options(normalized_option)
        visible_options = ordered_options[:5]
        
        if visible_options:
            joined = ", ".join(visible_options)
            particle = cls._subject_particle(visible_options[-1])
            return f"방 사진에서 {joined}{particle} 보입니다."
        
        return cls.normalize_sentence(caption_text)