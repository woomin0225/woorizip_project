# app/schemas.py

from datetime import datetime, date

from pydantic import BaseModel

# 방 정보 종합 요약시 사용 (리뷰, 이미지설명 포함)
class RoomTotalRequest(BaseModel):
    roomNo: str
    roomName: str
    houseNo: str
    houseName: str
    houseAddress: str
    roomCreatedAt: datetime
    roomUpdatedAt: datetime
    roomDeposit: int
    roomMonthly: int
    roomMethod: str
    roomArea: float
    roomFacing: str
    roomAvailableDate: date
    roomAbstract: str
    roomRoomCount: int
    roomBathCount: int
    roomEmptyYn: bool
    roomStatus: str
    roomOptions: str
    imageSummary: str
    reviewSummary: str
    
    
# 리뷰나 이미지 캡션들 요약시 사용
class RoomSummaryRequest(BaseModel):
    roomNo: str
    texts: list

from pydantic import BaseModel, Field
from typing import Any, Literal


class Envelope(BaseModel):
    ok: bool = True
    intent: str | None = None
    data: Any | None = None
    warnings: list[str] = Field(default_factory=list)


class ChatReq(BaseModel):
    message: str
    history: list[dict] = Field(default_factory=list)


class RagIngestReq(BaseModel):
    source_id: str
    text: str
    meta: dict[str, Any] = Field(default_factory=dict)


class RagQueryReq(BaseModel):
    question: str
    top_k: int = 5
    filters: dict[str, Any] = Field(default_factory=dict)


class DocWriteReq(BaseModel):
    doc_type: str = '보고서'
    requirements: str
    tone: str = '업무용'
    length: str = '1~2 페이지'


class RecommendReq(BaseModel):
    user_id: str
    candidates: list[dict]
    goal: str = '주거/매물 탐색'


SummaryTarget = Literal['page', 'post', 'room', 'generic']

class SummaryAttachment(BaseModel):
    filename: str
    mime_type: str | None = None
    text: str | None = None
    file_base64: str | None = None
    meta: dict[str, Any] = Field(default_factory=dict)



class SummaryReq(BaseModel):
    target_type: SummaryTarget = 'generic'
    title: str | None = None
    text: str | None = None
    attachments: list[SummaryAttachment] = Field(default_factory=list)
    room_id: str | None = None
    room: dict[str, Any] | None = None
    reviews: list[dict[str, Any]] | None = None
    photos_caption: str | None = None
    bullets: int = 5
    include_tts: bool = False
    voice: str | None = None
    audio_format: str | None = None


class ImageItem(BaseModel):
    image_id: str | None = None
    image_base64: str
    mime_type: str = 'image/jpeg'
    meta: dict[str, Any] = Field(default_factory=dict)


class VisionAnalyzeReq(BaseModel):
    purpose: str = 'generic'
    images: list[ImageItem]
    caption: bool = True
    detect: bool = True
    ocr: bool = False
    ingest: bool = False
    source_prefix: str = 'image'
    
    
class RoomOptionCandidate(BaseModel):
    name: str
    confidence: float = 0.0
    source: Literal['caption', 'ocr', 'detection', 'rule'] = 'rule'


class RoomVisionResult(BaseModel):
    summary: str = ''
    caption: str = ''
    ocr_texts: list[str] = Field(default_factory=list)
    detected_objects: list[str] = Field(default_factory=list)
    option_candidates: list[RoomOptionCandidate] = Field(default_factory=list)
    normalized_options: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    meta: dict[str, Any] = Field(default_factory=dict)


class RoomVisionAnalyzeReq(BaseModel):
    room_id: str | None = None
    images: list[ImageItem]
    ocr: bool = True
    detect: bool = True
    caption: bool = True
    save_embedding: bool = False
    source_prefix: str = 'room-image'
    meta: dict[str, Any] = Field(default_factory=dict)


class RoomVisionAnalyzeRes(BaseModel):
    ok: bool = True
    data: RoomVisionResult


class VoiceTranscribeReq(BaseModel):
    audio_base64: str
    mime_type: str = 'audio/webm'
    language: str = 'ko'
    mock_text: str | None = None


class VoiceSpeakReq(BaseModel):
    text: str
    voice: str | None = None
    audio_format: str | None = None


class VoiceTranscribeRes(BaseModel):
    text: str
    language: str
    mimeType: str
    provider: str | None = None
    audioBytes: int
    warnings: list[str] = Field(default_factory=list)
    raw: dict[str, Any] = Field(default_factory=dict)


class VoiceSpeakRes(BaseModel):
    text: str
    voice: str
    audioFormat: str
    mimeType: str
    audioBase64: str
    provider: str | None = None
    warnings: list[str] = Field(default_factory=list)
    raw: dict[str, Any] = Field(default_factory=dict)


class PolicyCheckReq(BaseModel):
    text: str


MonitorKind = Literal['view_abuse', 'facility_usage', 'generic']


class MonitorAnalyzeReq(BaseModel):
    kind: MonitorKind = 'generic'
    payload: dict[str, Any] = Field(default_factory=dict)
    tone: str = '업무용'


class AgentRunReq(BaseModel):
    user_id: str | None = None
    instruction: str
    extra: dict[str, Any] = Field(default_factory=dict)


class AssistantRunReq(BaseModel):
    schemaVersion: str = 'v1'
    text: str
    sessionId: str | None = None
    clientRequestId: str | None = None
    systemPrompt: str | None = None
    context: dict[str, Any] = Field(default_factory=dict)
    userId: str | None = None


class AssistantRunRes(BaseModel):
    schemaVersion: str
    reply: str
    intent: str
    slots: dict[str, Any] = Field(default_factory=dict)
    action: dict[str, Any] = Field(default_factory=dict)
    result: dict[str, Any] = Field(default_factory=dict)
    errorCode: str | None = None
    requiresConfirm: bool = False
    sessionId: str | None = None
    clientRequestId: str | None = None
    raw: dict[str, Any] = Field(default_factory=dict)


class ListingIndexReq(BaseModel):
    room_id: str
    room: dict[str, Any]
    image_summaries: list[dict[str, Any]] = Field(default_factory=list)
    review_summary: dict[str, Any] | None = None
    meta: dict[str, Any] = Field(default_factory=dict)


class ListingSearchReq(BaseModel):
    query: str
    filters: dict[str, Any] = Field(default_factory=dict)
    candidates: list[dict[str, Any]] = Field(default_factory=list)
    top_k: int = 5


class ReviewAnalyzeReq(BaseModel):
    room_id: str
    review_id: str
    text: str
    ingest: bool = False
    meta: dict[str, Any] = Field(default_factory=dict)


class ReviewSummaryReq(BaseModel):
    room_id: str
    reviews: list[dict[str, Any]]
    room_meta: dict[str, Any] = Field(default_factory=dict)
