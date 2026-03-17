from __future__ import annotations

from typing import Any

from app.clients.protocols import CaptionClient, ObjectDetectionClient, OCRClient
from app.services.rag_service import RagService

import re
import random

class VisionService:
    """이미지 이해/캡션(Qwen2.5-VL), 객체 탐지(GroundingDINO), OCR(PaddleOCR)를 묶는 서비스.
    현재 기본 구현은 각 provider의 mock/adapter를 호출한다.
    """

    def __init__(
        self,
        caption_client: CaptionClient,
        detection_client: ObjectDetectionClient,
        ocr_client: OCRClient,
        rag: RagService | None = None,
    ):
        self.caption_client = caption_client
        self.detection_client = detection_client
        self.ocr_client = ocr_client
        self.rag = rag

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

            if caption:
                cap = await self.caption_client.caption(image_b64, mime_type=mime_type, meta=meta)
                result['caption'] = cap.get('caption')
                result['tags'] = cap.get('tags', [])
                result['caption_provider'] = cap.get('provider')

            if detect:
                det = await self.detection_client.detect(image_b64, mime_type=mime_type, purpose=purpose, meta=meta)
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
    def _split_ocr_texts(ocr_text: str) -> list[str]:
        if not ocr_text:
            return []
        parts = re.split(r'[\n,|/]+', ocr_text)
        return [p.strip() for p in parts if p and p.strip()]
    
    @staticmethod
    def _is_noise_ocr_text(text: str) -> bool:
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
        
    def _filter_ocr_texts(self, ocr_texts: list[str]) -> list[str]:
        filtered: list[str] = []
        seen: set[str] = set()
        
        for text in ocr_texts:
            value = text.strip()
            if self._is_noise_ocr_text(value):
                continue
            if value in seen:
                continue
            seen.add(value)
            filtered.append(value)
            
        return filtered

    @staticmethod
    def _normalize_option_name(name: str) -> str | None:
        if not name:
            return None

        text = name.strip().lower()

        option_map = {
            '침대': ['침대', 'bed'],
            '책상': ['책상', 'desk'],
            '의자': ['의자', 'chair'],
            '에어컨': ['에어컨', '벽걸이에어컨', '스탠드에어컨', 'air conditioner', 'aircon'],
            '냉장고': ['냉장고', 'fridge', 'refrigerator'],
            '세탁기': ['세탁기', 'washer', 'washing machine'],
            '전자레인지': ['전자레인지', 'microwave'],
            '옷장': ['옷장', 'closet', 'wardrobe'],
            '수납장': ['수납장', '캐비닛', 'cabinet', 'storage'],
            '싱크대': ['싱크대', 'sink'],
            '인덕션': ['인덕션', '전기레인지', 'induction', 'cooktop'],
            'TV': ['tv', '티비', '텔레비전'],
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
    def _contains_negative_phrase(text: str) -> bool:
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
    
    def _is_negative_option_mention(self, text: str, normalized_name: str) -> bool:
        if not text or not normalized_name:
            return False
        
        lowered = text.strip().lower()
        
        alias_map = {
            'WiFi': ['wifi', 'wi-fi', '인터넷', '무선인터넷'],
            '침대': ['침대', 'bed'],
            '책상': ['책상', 'desk'],
            '의자': ['의자', 'chair'],
            '에어컨': ['에어컨', 'air conditioner', 'aircon'],
            '냉장고': ['냉장고', 'fridge', 'refrigerator'],
            '세탁기': ['세탁기', 'washer', 'washing machine'],
            '전자레인지': ['전자레인지', 'microwave'],
            '옷장': ['옷장', 'closet', 'wardrobe'],
            '수납장': ['수납장', '캐비닛', 'cabinet', 'storage'],
            '싱크대': ['싱크대', 'sink'],
            '인덕션': ['인덕션', '전기레인지', 'induction', 'cooktop'],
            'TV': ['tv', '티비', '텔레비전'],
            '창문': ['창문', 'window'],
            '화장실': ['화장실', '욕실', 'bathroom'],
            '신발장': ['신발장', 'shoe rack', 'shoe cabinet'],
        }
        
        aliases = alias_map.get(normalized_name, [normalized_name.lower()])
        if not any(alias in lowered for alias in aliases):
            return False
        
        return self._contains_negative_phrase(lowered)
    
    def _extract_negative_option_names(self, caption_text: str) -> set[str]:
        if not caption_text:
            return set()

        negative_names: set[str] = set()

        negative_markers = [
            '보이지 않습니다',
            '보이지 않음',
            '보이지 않는다',
            '확인되지 않습니다',
            '확인되지 않음',
            '확인되지 않는다',
            '없습니다',
            '없음',
            '없다',
            'not visible',
            'not detected',
            'not found',
        ]

        for marker in negative_markers:
            if marker not in caption_text:
                continue
            
            left = caption_text.split(marker)[0]
            
            # 마지막 절만 사용
            chunk = left.split('.')[-1]
            chunk = chunk.split('/')[-1]
            
            # "~이 있고, 싱크대, 냉장고..." 같은 경우 마지막 콤마 뒤 후보군만 보도록 보정
            if '있고,' in chunk:
                chunk = chunk.split('있고,')[-1]
            elif '있고' in chunk:
                chunk = chunk.split('있고')[-1]
                
            for token in re.split(r'[,\n/]| 그리고 | 및 | 와 | 과 | 나 ', chunk):
                token = token.strip()
                if not token:
                    continue
                
                normalized = self._normalize_option_name(token)
                if normalized:
                    negative_names.add(normalized)

        return negative_names

    def _extract_option_candidates(
        self,
        caption_text: str,
        detected_items: list[dict[str, Any]],
        ocr_texts: list[str],
        caption_tags: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        candidates: list[dict[str, Any]] = []

        negative_option_names = self._extract_negative_option_names(caption_text)

        if caption_text:
            for token in re.split(r'[,\n.]+', caption_text):
                token = token.strip()
                if not token:
                    continue

                normalized = self._normalize_option_name(token)
                if not normalized:
                    continue

                if normalized in negative_option_names:
                    continue

                if self._is_negative_option_mention(token, normalized):
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
            
            normalized = self._normalize_option_name(tag)
            if not normalized:
                continue
            
            if normalized in negative_option_names:
                continue
            
            candidates.append({
                'name': normalized,
                'confidence': 0.85,
                'source': 'caption',
            })

        for item in detected_items:
            raw_name = str(item.get('name', '')).strip()
            normalized = self._normalize_option_name(raw_name)
            if normalized:
                confidence = item.get('score', 0.8)
                try:
                    confidence = float(confidence)
                except Exception:
                    confidence = 0.8

                candidates.append({
                    'name': normalized,
                    'confidence': confidence,
                    'source': 'detection',
                })

        for text in ocr_texts:
            text = text.strip()
            if not text:
                continue

            normalized = self._normalize_option_name(text)
            if not normalized:
                continue

            if self._is_negative_option_mention(text, normalized):
                continue

            candidates.append({
                'name': normalized,
                'confidence': 0.6,
                'source': 'ocr',
            })

        return candidates

    @staticmethod
    def _deduplicate_option_candidates(
        candidates: list[dict[str, Any]],
    ) -> tuple[list[dict[str, Any]], list[str]]:
        best_by_name: dict[str, dict[str, Any]] = {}

        for candidate in candidates:
            name = candidate.get('name')
            if not name:
                continue

            prev = best_by_name.get(name)
            if prev is None or float(candidate.get('confidence', 0.0)) > float(prev.get('confidence', 0.0)):
                best_by_name[name] = candidate

        deduped = sorted(
            best_by_name.values(),
            key=lambda x: (-float(x.get('confidence', 0.0)), x.get('name', ''))
        )
        normalized_options = [item['name'] for item in deduped]
        return deduped, normalized_options

    @staticmethod
    def _build_room_summary(caption: str, normalized_options: list[str], ocr_texts: list[str]) -> str:

        visible_options = [opt for opt in normalized_options if opt]

        priority_order = [
            '에어컨', '침대', '책상', '옷장', '냉장고', '세탁기',
            '전자레인지', '신발장', 'TV', 'WiFi', '창문', '싱크대'
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
        print('VISION_SERVICE_TAG_DEBUG_PATCH_APPLIED')
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
        all_detected_items: list[dict[str, Any]] = []
        all_candidates: list[dict[str, Any]] = []
        captions: list[str] = []
        warnings: list[str] = []

        for result in base.get('results', []):
            caption_text = str(result.get('caption') or '').strip()
            detected_items = result.get('detected_items') or []
            ocr_text = str(result.get('ocr_text') or '').strip()
            caption_tags = result.get('tags') or []
            
            print('[DEBUG] caption_text =', caption_text)
            print('[DEBUG] caption_tags =', caption_tags)
            print('[DEBUG] detected_items =', detected_items)
            print('[DEBUG] ocr_text =', ocr_text)

            if caption_text:
                captions.append(caption_text)

            ocr_texts = self._split_ocr_texts(ocr_text)
            ocr_texts = self._filter_ocr_texts(ocr_texts)
            all_ocr_texts.extend(ocr_texts)

            for item in detected_items:
                raw_name = str(item.get('name', '')).strip()
                if raw_name:
                    all_detected_objects.append(raw_name)
                    all_detected_items.append(item)

            candidates = self._extract_option_candidates(
                caption_text=caption_text,
                detected_items=detected_items,
                ocr_texts=ocr_texts,
                caption_tags=caption_tags,
            )
            print('[DEBUG] candidates =', candidates)
            all_candidates.extend(candidates)

        deduped_candidates, normalized_options = self._deduplicate_option_candidates(all_candidates)
        print('[DEBUG] all_candidates =', all_candidates)
        print('[DEBUG] deduped_candidates =', deduped_candidates)
        print('[DEBUG] normalized_options =', normalized_options)
        summary = self._build_room_summary(
            caption=' / '.join(captions[:2]),
            normalized_options=normalized_options,
            ocr_texts=all_ocr_texts,
        )

        if not normalized_options:
            warnings.append('이미지에서 옵션을 명확히 추출하지 못했습니다.')

        return {
            'ok': True,
            'data': {
                'summary': summary,
                'caption': ' / '.join(captions[:3]),
                'ocr_texts': list(dict.fromkeys(all_ocr_texts)),
                'detected_objects': list(dict.fromkeys(all_detected_objects)),
                'option_candidates': deduped_candidates,
                'normalized_options': normalized_options,
                'warnings': warnings,
                'meta': {
                    'purpose': 'room',
                    'image_count': base.get('count', 0),
                    'source_prefix': source_prefix,
                    'raw_results': base.get('results', []),
                },
            },
        }