from __future__ import annotations

import base64
import io
import logging
import os
import sys
import types
from typing import Any

import numpy as np
from PIL import Image, ImageOps, ImageEnhance

from app.clients.protocols import OCRClient

logger = logging.getLogger(__name__)


def _install_langchain_compat_shim() -> None:
    """LangChain 1.x 환경에서 PaddleX가 기대하는 예전 import 경로를 맞춰 준다."""

    try:
        from langchain.docstore.document import Document
        from langchain.text_splitter import RecursiveCharacterTextSplitter
    except Exception:
        try:
            import langchain
        except ModuleNotFoundError:
            return

        try:
            from langchain_core.documents import Document
            from langchain_text_splitters import RecursiveCharacterTextSplitter
        except Exception as exc:
            logger.warning("LangChain 호환 shim 준비를 건너뜁니다: %s", exc)
            return

        doc_module = types.ModuleType("langchain.docstore.document")
        doc_module.Document = Document

        docstore_module = sys.modules.get("langchain.docstore")
        if docstore_module is None:
            docstore_module = types.ModuleType("langchain.docstore")
            sys.modules["langchain.docstore"] = docstore_module
        docstore_module.document = doc_module

        splitter_module = types.ModuleType("langchain.text_splitter")
        splitter_module.RecursiveCharacterTextSplitter = RecursiveCharacterTextSplitter

        sys.modules["langchain.docstore.document"] = doc_module
        sys.modules["langchain.text_splitter"] = splitter_module
        setattr(langchain, "docstore", docstore_module)
    else:
        return


class PaddleOCRClient(OCRClient):
    """PaddleOCR 기반 OCR 클라이언트"""

    def __init__(self):
        self._ocr: Any | None = None
        self._init_error: str | None = None

        # 네트워크 제약이 있는 환경에서는 PaddleX가 import 시점에
        # 원격 모델 서버 연결을 확인하다가 오래 멈출 수 있다.
        os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
        _install_langchain_compat_shim()

        try:
            from paddleocr import PaddleOCR

            self._ocr = PaddleOCR(
                use_angle_cls=True,
                lang='korean',
            )
        except Exception as exc:
            self._init_error = str(exc)
            logger.warning("PaddleOCR client initialization skipped: %s", exc)

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
        if self._ocr is None:
            return {
                'text': '',
                'lines': [],
                'provider': 'paddleocr',
                'warning': self._init_error or 'PaddleOCR is unavailable.',
            }

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
                'warning': str(e),
            }
