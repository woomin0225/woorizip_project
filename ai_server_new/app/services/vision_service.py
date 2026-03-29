# app/services/vision_service.py

from __future__ import annotations

from typing import Any
import random
import logging

from app.clients.protocols import CaptionClient, ObjectDetectionClient, OCRClient
from app.services.room_option_postprocessor import RoomOptionPostprocessor
from app.utils.image_preprocess import preprocess_image_for_vision

logger = logging.getLogger(__name__)


class VisionService:
    """이미지 이해/캡션(Qwen2.5-VL), 객체 탐지(GroundingDINO), OCR(PaddleOCR)를 묶는 서비스."""

    def __init__(
        self,
        caption_client: CaptionClient,
        detection_client: ObjectDetectionClient,
        ocr_client: OCRClient,
        rag: Any | None = None,
        room_option_postprocessor: RoomOptionPostprocessor | None = None,
    ):
        self.caption_client = caption_client
        self.detection_client = detection_client
        self.ocr_client = ocr_client
        self.rag = rag
        self.room_option_postprocessor = room_option_postprocessor or RoomOptionPostprocessor()

    @staticmethod
    def _build_ingest_text(result: dict[str, Any]) -> str:
        parts: list[str] = [f"IMAGE_ID: {result['image_id']}"]
        if result.get('caption'):
            parts.append(f"CAPTION: {result['caption']}")
        if result.get('tags'):
            parts.append('TAGS: ' + ', '.join(result['tags']))
        if result.get('detected_items'):
            parts.append('ITEMS: ' + ', '.join([x['name'] for x in result['detected_items']]))
        if result.get('ocr_text'):
            parts.append(f"OCR: {result['ocr_text']}")
        return '\n'.join(parts)

    async def analyze(
        self,
        images: list[dict[str, Any]],
        purpose: str = 'generic',
        caption: bool = True,
        detect: bool = True,
        ocr: bool = False,
        ingest: bool = False,
        source_prefix: str = 'image',
    ) -> dict:
        results = []

        for idx, it in enumerate(images):
            image_id = it.get('image_id') or f'{source_prefix}:{idx}'
            image_b64 = it.get('image_base64', '')
            mime_type = it.get('mime_type', 'image/jpeg')
            meta = it.get('meta') or {}
            result: dict[str, Any] = {'image_id': image_id, 'meta': meta}
            
            if image_b64:
                image_b64 = preprocess_image_for_vision(image_b64)

            if caption:
                cap = await self.caption_client.caption(image_b64, mime_type=mime_type, meta=meta)
                result['caption'] = cap.get('caption')
                result['tags'] = cap.get('tags', [])
                result['caption_provider'] = cap.get('provider')

            if detect:
                det = await self.detection_client.detect(
                    image_b64,
                    mime_type=mime_type,
                    purpose=purpose,
                    meta=meta,
                )
                result['detected_items'] = det.get('items', [])
                result['detection_provider'] = det.get('provider')

            if ocr:
                ocr_out = await self.ocr_client.extract_text(image_b64, mime_type=mime_type, meta=meta)
                result['ocr_text'] = ocr_out.get('text', '')
                result['ocr_provider'] = ocr_out.get('provider')

            if ingest and self.rag:
                await self.rag.ingest_text(
                    source_id=f'{source_prefix}:{image_id}',
                    text=self._build_ingest_text(result),
                    meta={'type': 'image', 'purpose': purpose, **meta},
                )

            results.append(result)

        return {'purpose': purpose, 'count': len(results), 'results': results}

    @staticmethod
    def _build_room_summary(caption: str, normalized_options: list[str], ocr_texts: list[str]) -> str:
        visible_options = [opt for opt in normalized_options if opt]

        priority_order = [
            '에어컨', '침대', '책상', '옷장', '냉장고', '세탁기',
            '전자레인지', '신발장', 'TV', 'WiFi', '창문'
        ]
        ordered_options = [opt for opt in priority_order if opt in visible_options]
        extra_options = [opt for opt in visible_options if opt not in ordered_options]
        final_options = ordered_options + extra_options

        if not final_options:
            return '방 사진을 바탕으로 소개글을 생성했습니다.'

        option_text = ', '.join(final_options[:4])

        templates = [
            f"{option_text} 옵션이 확인된 방입니다.",
            f"{option_text} 옵션을 갖춘 실용적인 방입니다.",
            f"{option_text} 옵션이 마련된 공간입니다.",
        ]
        return random.choice(templates)

    async def analyze_room_images(
        self,
        images: list[dict[str, Any]],
        source_prefix: str = 'room-image',
        save_embedding: bool = False,
    ) -> dict[str, Any]:
        base = await self.analyze(
            images=images,
            purpose='room',
            caption=True,
            detect=True,
            ocr=False,
            ingest=save_embedding,
            source_prefix=source_prefix,
        )

        all_ocr_texts: list[str] = []
        all_detected_objects: list[str] = []
        all_candidates: list[dict[str, Any]] = []
        captions: list[str] = []
        warnings: list[str] = []

        for result in base.get('results', []):
            caption_text = str(result.get('caption') or '').strip()
            detected_items = result.get('detected_items') or []
            ocr_text = str(result.get('ocr_text') or '').strip()
            caption_tags = result.get('tags') or []

            if caption_text:
                captions.append(caption_text)

            deduped_candidates, normalized_options, ocr_texts = self.room_option_postprocessor.process(
                caption_text=caption_text,
                detected_items=detected_items,
                ocr_text=ocr_text,
                caption_tags=caption_tags,
            )

            all_ocr_texts.extend(ocr_texts)
            all_candidates.extend(deduped_candidates)

            for item in detected_items:
                raw_name = str(item.get('name', '')).strip()
                if raw_name:
                    all_detected_objects.append(raw_name)

        merged_candidates, merged_options = self.room_option_postprocessor.deduplicate_option_candidates(all_candidates)

        if not merged_options:
            warnings.append('이미지에서 옵션을 명확히 추출하지 못했습니다.')

        logger.info(
            "room image analyzed: image_count=%s, options=%s, warnings=%s",
            base.get('count', 0),
            merged_options,
            warnings,
        )

        summary = self._build_room_summary(
            caption=' / '.join(captions[:2]),
            normalized_options=merged_options,
            ocr_texts=all_ocr_texts,
        )
        
        sanitized_caption = self.room_option_postprocessor.sanitize_caption(
            ' / '.join(captions[:3]),
            merged_options,
        )

        return {
            'ok': True,
            'data': {
                'summary': summary,
                'caption': sanitized_caption,
                'ocr_texts': list(dict.fromkeys(all_ocr_texts)),
                'detected_objects': list(dict.fromkeys(all_detected_objects)),
                'option_candidates': merged_candidates,
                'normalized_options': merged_options,
                'warnings': warnings,
                'meta': {
                    'purpose': 'room',
                    'image_count': base.get('count', 0),
                    'source_prefix': source_prefix,
                    'raw_results': base.get('results', []),
                },
            },
        }
        