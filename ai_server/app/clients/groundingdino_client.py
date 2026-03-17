from __future__ import annotations

from typing import Any

import httpx

from app.clients.protocols import ObjectDetectionClient
from app.core.config import settings


class GroundingDINOClient(ObjectDetectionClient):
    """GroundingDINO inference server 연동 클라이언트"""

    def __init__(self) -> None:
        self.base_url = settings.GROUNDINGDINO_BASE_URL.rstrip('/')
        self.timeout = getattr(settings, 'GROUNDINGDINO_TIMEOUT', 30)

    async def detect(
        self,
        image_base64: str,
        mime_type: str = 'image/jpeg',
        purpose: str = 'generic',
        meta: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        meta = meta or {}

        text_prompt = self._build_text_prompt(purpose=purpose, meta=meta)

        payload = {
            'image_base64': image_base64,
            'mime_type': mime_type,
            'text_prompt': text_prompt,
            'box_threshold': getattr(settings, 'GROUNDINGDINO_BOX_THRESHOLD', 0.30),
            'text_threshold': getattr(settings, 'GROUNDINGDINO_TEXT_THRESHOLD', 0.25),
            'purpose': purpose,
            'meta': meta,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f'{self.base_url}/detect',
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
        except Exception as e:
            return {
                'provider': 'groundingdino',
                'items': [],
                'warning': f'groundingdino detect failed: {str(e)}',
            }

        raw_items = data.get('items', [])
        items: list[dict[str, Any]] = []

        for item in raw_items:
            name = str(item.get('name', '')).strip()
            if not name:
                continue

            try:
                score = float(item.get('score', 0.0))
            except Exception:
                score = 0.0

            normalized = {
                'name': name,
                'score': score,
                'bbox': item.get('bbox'),
            }
            items.append(normalized)

        return {
            'provider': 'groundingdino',
            'items': items,
            'text_prompt': text_prompt,
        }

    @staticmethod
    def _build_text_prompt(purpose: str = 'generic', meta: dict[str, Any] | None = None) -> str:
        meta = meta or {}

        if purpose == 'room':
            labels = [
                'bed',
                'desk',
                'chair',
                'air conditioner',
                'refrigerator',
                'washing machine',
                'microwave',
                'wardrobe',
                'closet',
                'cabinet',
                'sink',
                'induction',
                'tv',
                'window',
                'bathroom door',
                'shoe cabinet',
            ]
            return ' . '.join(labels) + ' .'

        custom_labels = meta.get('labels')
        if isinstance(custom_labels, list) and custom_labels:
            cleaned = [str(x).strip() for x in custom_labels if str(x).strip()]
            if cleaned:
                return ' . '.join(cleaned) + ' .'

        return 'furniture . appliance . object .'