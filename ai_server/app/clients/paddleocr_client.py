from __future__ import annotations

from typing import Any
import base64
import io

import numpy as np
from PIL import Image, ImageOps, ImageEnhance
from paddleocr import PaddleOCR

from app.clients.protocols import OCRClient


class PaddleOCRClient(OCRClient):
    """PaddleOCR 기반 OCR 클라이언트"""

    def __init__(self):
        self._ocr = PaddleOCR(
            use_angle_cls=True,
            lang='korean',
        )

    def _preprocess_for_ocr(self, image: Image.Image) -> np.ndarray:
        # 1) 흑백 변환
        gray = ImageOps.grayscale(image)

        # 2) OCR용 크게 확대
        scale = 2
        gray = gray.resize((gray.width * scale, gray.height * scale))
        
        max_side = 3000
        w, h = gray.size
        if max(w, h) > max_side:
            ratio = max_side / max(w, h)
            gray = gray.resize((int(w * ratio), int(h * ratio)))

        # 3) 대비/선명도 강화
        gray = ImageEnhance.Contrast(gray).enhance(2.0)
        gray = ImageEnhance.Sharpness(gray).enhance(2.0)

        # 4) PaddleOCR 입력용 3채널 RGB numpy array 반환
        return np.array(gray.convert('RGB'))

    def _extract_texts_from_result(self, result: Any) -> list[str]:
        texts: list[str] = []

        if not result:
            return texts

        # ocr() 계열 결과 파싱
        try:
            for line_group in result:
                for line in line_group or []:
                    if not line or len(line) < 2:
                        continue
                    text = str(line[1][0]).strip()
                    if text:
                        texts.append(text)
        except Exception:
            pass

        return texts

    async def extract_text(
        self,
        image_base64: str,
        mime_type: str = 'image/jpeg',
        meta: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        try:
            image_bytes = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

            image_np = self._preprocess_for_ocr(image)

            result = None

            # 1차: predict 시도
            try:
                result = self._ocr.predict(image_np)
                print('[DEBUG-OCR] predict result =', result)
            except Exception as e:
                print('[DEBUG-OCR] predict exception =', e)

            texts = self._extract_texts_from_result(result)

            # 2차: 비어 있으면 ocr fallback
            if not texts:
                try:
                    result = self._ocr.ocr(image_np)
                    print('[DEBUG-OCR] ocr result =', result)
                    texts = self._extract_texts_from_result(result)
                except Exception as e:
                    print('[DEBUG-OCR] ocr exception =', e)

            return {
                'text': '\n'.join(texts),
                'lines': texts,
                'provider': 'paddleocr',
            }

        except Exception as e:
            print('[DEBUG-OCR] exception =', e)
            return {
                'text': '',
                'lines': [],
                'provider': 'paddleocr',
            }