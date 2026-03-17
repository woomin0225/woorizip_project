from __future__ import annotations

from typing import Any

from groq import AsyncGroq

from app.core.config import settings
from app.clients.protocols import CaptionClient


class QwenCaptionClient(CaptionClient):
    """Groq의 vision 지원 모델을 이용한 이미지 캡션 클라이언트."""

    def __init__(self):
        if not settings.GROQ_API_KEY:
            raise RuntimeError('QwenCaptionClient 사용을 위해 GROQ_API_KEY 가 필요합니다.')
        self._client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self._model = getattr(settings, 'GROQ_VISION_MODEL', 'meta-llama/llama-4-scout-17b-16e-instruct')

    async def caption(
        self,
        image_base64: str, 
        mime_type: str = 'image/jpeg', 
        meta: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        prompt = (
            "이 이미지는 방/실내 사진입니다. "
            "사진에서 실제로 보이는 가구, 가전, 구조만 기준으로 짧고 구체적인 한국어 한 문장으로 설명하세요. "
            "보이지 않는 항목이나 확실하지 않은 항목은 절대 언급하지 마세요. "
            "가능하면 침대, 책상, 에어컨, 냉장고, 세탁기, 옷장, TV, 신발장, 창문, 싱크대 중 실제로 보이는 것만 포함하세요."
        )
        
        image_url = f"data:{mime_type};base64,{image_base64}"
        
        response = await self._client.chat.completions.create(
            model=self._model,
            temperature=0.2,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_url},
                        },
                    ],
                }
            ],
        )
        
        caption_text = ''
        try:
            caption_text = response.choices[0].message.content.strip()
        except Exception:
            caption_text = ''
            
        tags = []
        lowered = caption_text.lower()
        
        tag_map = {
            '침대': ['침대', 'bed'],
            '책상': ['책상', 'desk'],
            '에어컨': ['에어컨', 'air conditioner', 'aircon'],
            '냉장고': ['냉장고', 'fridge', 'refrigerator'],
            '세탁기': ['세탁기', 'washer', 'washing machine'],
            '옷장': ['옷장', 'closet', 'wardrobe'],
            'tv': ['tv', '티비', '텔레비전'],
            '신발장': ['신발장', 'shoe cabinet', 'shoe rack'],
            '창문': ['창문', 'window'],
            '싱크대': ['싱크대', 'sink'],
        }
        
        for tag, keywords in tag_map.items():
            if any(keyword in lowered for keyword in keywords):
                tags.append(tag)
                
        return {
            'caption': caption_text or '방 이미지 설명을 생성하지 못했습니다.',
            'tags': [],
            'provider': 'qwen',
        }
