# app/clients/groundingdino_client.py

from __future__ import annotations

from typing import Any
import base64
import io
import torch

from PIL import Image

from app.clients.protocols import ObjectDetectionClient
from app.core.config import settings


class GroundingDINOClient(ObjectDetectionClient):
    """GroundingDINO 로컬 추론 클라이언트"""

    def __init__(self) -> None:
        self.device = settings.GROUNDINGDINO_DEVICE
        self.box_threshold = settings.GROUNDINGDINO_BOX_THRESHOLD
        self.text_threshold = settings.GROUNDINGDINO_TEXT_THRESHOLD
        self.model = self._load_model()

    def _load_model(self):
        # 실제 설치한 GroundingDINO 버전에 따라 import 경로가 달라질 수 있음
        from groundingdino.util.inference import load_model

        model = load_model(
            settings.groundingdino_config_abs_path,
            settings.groundingdino_checkpoint_abs_path,
            device=self.device,
        )
        return model

    def _decode_image(self, image_base64: str) -> Image.Image:
        image_bytes = base64.b64decode(image_base64)
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")

    @staticmethod
    def _build_text_prompt(
        purpose: str = "generic",
        meta: dict[str, Any] | None = None,
    ) -> str:
        meta = meta or {}

        if purpose == "room":
            labels = [
                "bed",
                "desk",
                "chair",
                "air conditioner",
                "refrigerator",
                "washing machine",
                "microwave",
                "wardrobe",
                "tv",
                "window",
            ]
            return " . ".join(labels) + " ."

        custom_labels = meta.get("labels")
        if isinstance(custom_labels, list) and custom_labels:
            cleaned = [str(x).strip() for x in custom_labels if str(x).strip()]
            if cleaned:
                return " . ".join(cleaned) + " ."

        return "furniture . appliance . object ."

    async def detect(
        self,
        image_base64: str,
        mime_type: str = "image/jpeg",
        purpose: str = "generic",
        meta: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        text_prompt = self._build_text_prompt(purpose=purpose, meta=meta)
        image = self._decode_image(image_base64)

        try:
            from groundingdino.util.inference import predict
            
            image_tensor = self._preprocess_image(image)

            boxes, logits, phrases = predict(
                model=self.model,
                image=image_tensor,
                caption=text_prompt,
                box_threshold=self.box_threshold,
                text_threshold=self.text_threshold,
                device=self.device,
            )

            items: list[dict[str, Any]] = []

            for box, score, phrase in zip(boxes, logits, phrases):
                try:
                    score_value = float(score)
                except Exception:
                    score_value = 0.0

                bbox = box.tolist() if hasattr(box, "tolist") else box

                items.append(
                    {
                        "name": str(phrase).strip(),
                        "score": score_value,
                        "bbox": bbox,
                    }
                )

            return {
                "provider": "groundingdino",
                "items": items,
                "text_prompt": text_prompt,
            }

        except Exception as e:
            return {
                "provider": "groundingdino",
                "items": [],
                "text_prompt": text_prompt,
                "warning": f"groundingdino detect failed: {str(e)}",
            }
            
    def _preprocess_image(self, image: Image.Image):
        import groundingdino.datasets.transforms as T

        transform = T.Compose([
            T.RandomResize([800], max_size=1333),
            T.ToTensor(),
            T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
        image_transformed, _ = transform(image, None)
        return image_transformed