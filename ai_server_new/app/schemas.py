# app/schemas.py

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


SummaryTarget = Literal["page", "post", "room", "generic"]


class SummaryAttachment(BaseModel):
    filename: str
    mime_type: str | None = None
    text: str | None = None
    file_base64: str | None = None
    meta: dict[str, Any] = Field(default_factory=dict)


class SummaryReq(BaseModel):
    target_type: SummaryTarget = "generic"
    title: str | None = None
    text: str | None = None
    attachments: list[SummaryAttachment] = Field(default_factory=list)
    room_id: str | None = None
    room: dict[str, Any] | None = None
    reviews: list[dict[str, Any]] | None = None
    photos_caption: str | None = None
    bullets: int = 5


class ImageItem(BaseModel):
    image_id: str | None = None
    image_base64: str
    mime_type: str = "image/jpeg"
    meta: dict[str, Any] = Field(default_factory=dict)


class VisionAnalyzeReq(BaseModel):
    purpose: str = "generic"
    images: list[ImageItem]
    caption: bool = True
    detect: bool = True
    ocr: bool = False
    ingest: bool = False
    source_prefix: str = "image"


class RoomOptionCandidate(BaseModel):
    name: str
    confidence: float = 0.0
    source: Literal["caption", "ocr", "detection", "rule"] = "rule"


class RoomVisionResult(BaseModel):
    summary: str = ""
    caption: str = ""
    ocr_texts: list[str] = Field(default_factory=list)
    detected_objects: list[str] = Field(default_factory=list)
    option_candidates: list[RoomOptionCandidate] = Field(default_factory=list)
    normalized_options: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    meta: dict[str, Any] = Field(default_factory=dict)


class RoomVisionAnalyzeRes(BaseModel):
    ok: bool = True
    data: RoomVisionResult
    
class EmbeddingReq(BaseModel):
    text: str
    model: str = 'infloat/multilingual-e5-small'    
    
class EmbeddingRes(BaseModel):
    model: str
    dimension: int
    embedding: list[float]
