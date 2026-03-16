# app/services/room_option_postprocessor.py

from __future__ import annotations

from typing import Any

from app.services.room_caption_sanitizer import RoomCaptionSanitizer
from app.services.room_option_rules import RoomOptionRules


class RoomOptionPostprocessor:

    def __init__(self) -> None:
        self.rules = RoomOptionRules()
        self.caption_sanitizer = RoomCaptionSanitizer()

    def process(
        self,
        caption_text: str,
        detected_items: list[dict[str, Any]],
        ocr_text: str,
        caption_tags: list[str] | None = None,
    ) -> tuple[list[dict[str, Any]], list[str], list[str]]:
        ocr_texts = self.caption_sanitizer.split_ocr_texts(ocr_text)
        ocr_texts = self.caption_sanitizer.filter_ocr_texts(ocr_texts)

        candidates = self.rules.extract_option_candidates(
            caption_text=caption_text,
            detected_items=detected_items,
            ocr_texts=ocr_texts,
            caption_tags=caption_tags,
        )
        deduped_candidates, normalized_options = self.caption_sanitizer.deduplicate_option_candidates(candidates)

        return deduped_candidates, normalized_options, ocr_texts

    def deduplicate_option_candidates(
        self,
        candidates: list[dict[str, Any]],
    ) -> tuple[list[dict[str, Any]], list[str]]:
        return self.caption_sanitizer.deduplicate_option_candidates(candidates)

    def sanitize_caption(self, caption_text: str, normalized_options: list[str]) -> str:
        return self.caption_sanitizer.sanitize_caption(caption_text, normalized_options)