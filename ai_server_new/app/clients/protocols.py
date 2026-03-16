# app/clients/protocols.py

from __future__ import annotations

from typing import Any, Protocol


class EmbeddingClient(Protocol):
    async def embed(self, texts: list[str]) -> list[list[float]]: ...


class CaptionClient(Protocol):
    async def caption(self, image_base64: str, mime_type: str = 'image/jpeg', meta: dict[str, Any] | None = None) -> dict[str, Any]: ...


class ObjectDetectionClient(Protocol):
    async def detect(self, image_base64: str, mime_type: str = 'image/jpeg', purpose: str = 'generic', meta: dict[str, Any] | None = None) -> dict[str, Any]: ...


class OCRClient(Protocol):
    async def extract_text(self, image_base64: str, mime_type: str = 'image/jpeg', meta: dict[str, Any] | None = None) -> dict[str, Any]: ...
