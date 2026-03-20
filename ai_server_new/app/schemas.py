# app/schemas.py


from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field

SummaryTarget = Literal["page", "post", "room", "generic"]
MonitorKind = Literal["view_abuse", "facility_usage", "generic"]

# 방 정보 종합 요약시 사용 (리뷰, 이미지설명 포함)
class RoomTotalRequest(BaseModel):
    roomNo: str = Field(description="방 번호 (식별자, 사용자는 알 수 없음)")
    roomName: str = Field(description="방 이름")
    houseNo: str = Field(description="건물 번호 (식별자, 사용자는 알 수 없음)")
    
    houseName: str = Field(description="건물 이름")
    houseAddress: str = Field(description="건물 주소")
    houseCompletionYear: int = Field(description="건물 완공년도")
    houseFloors: int = Field(description="건물 층수")
    houseHouseHolds: int = Field(description="건물 내 총 세대수")
    houseElevatorYn: bool = Field(description="건물 승강기 유무")
    housePetYn: bool = Field(description="건물 내 애완동물 가능여부")
    houseFemaleLimit: bool = Field(description="여성전용 건물 여부")
    houseParkingMax: int = Field(description="건물 최대 주차 대수")
    houseAbstract: str = Field(description="건물 소개글")
    
    roomCreatedAt: datetime = Field(description="방 정보 등록일")
    roomUpdatedAt: Optional[datetime] = Field(default=None, description="방 정보 최근 수정일")
    roomDeposit: int = Field(description="방 보증금")
    roomMonthly: int = Field(description="방 월세금")
    roomMethod: str = Field(description="전세인지 월세인지 나타냄. M이면 월세, L이면 월세")
    roomArea: float = Field(description="방 전용 면적. 미터제곱 단위")
    roomFacing: str = Field(description="방의 방향")
    roomAvailableDate: date = Field(description="방 입주가능 일자")
    roomAbstract: str = Field(description="방 소개글")
    roomRoomCount: int = Field(description="방 최대 이용가능 인원수")
    roomBathCount: int = Field(description="방 내 욕실 또는 화장실 수")
    roomEmptyYn: bool = Field(description="방의 공실여부")
    roomStatus: str = Field(description="방의 공개/숨김 상태")
    roomOptions: str = Field(description="방의 가구/옵션들")
    imageSummary: str = Field(description="방의 이미지 캡션들을 요약한 글")
    reviewSummary: str = Field(description="방의 리뷰들을 요약한 글")
    
    
# 리뷰나 이미지 캡션들 요약시 사용
class RoomSummaryRequest(BaseModel):
    roomNo: str
    texts: list
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
    doc_type: str = "보고서"
    requirements: str
    tone: str = "업무용"
    length: str = "1~2 페이지"


class RecommendReq(BaseModel):
    user_id: str
    candidates: list[dict]
    goal: str = "주거/매물 탐색"


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
    include_tts: bool = False
    voice: str | None = None
    audio_format: str | None = None


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


class RoomVisionAnalyzeReq(BaseModel):
    room_id: str | None = None
    images: list[ImageItem]
    ocr: bool = True
    detect: bool = True
    caption: bool = True
    save_embedding: bool = False
    source_prefix: str = "room-image"
    meta: dict[str, Any] = Field(default_factory=dict)


class RoomVisionAnalyzeRes(BaseModel):
    ok: bool = True
    data: RoomVisionResult


class VoiceTranscribeReq(BaseModel):
    audio_base64: str
    mime_type: str = "audio/webm"
    language: str = "ko"
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


class MonitorAnalyzeReq(BaseModel):
    kind: MonitorKind = "generic"
    payload: dict[str, Any] = Field(default_factory=dict)
    tone: str = "업무용"


class AgentRunReq(BaseModel):
    user_id: str | None = None
    instruction: str
    extra: dict[str, Any] = Field(default_factory=dict)


class AssistantRunReq(BaseModel):
    schemaVersion: str = "v1"
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


class TourApplyReq(BaseModel):
    roomNo: str
    visitDate: str
    visitTime: str
    userName: str
    userPhone: str
    inquiry: str | None = None


class TourApplyRes(BaseModel):
    ok: bool = True
    roomNo: str
    visitDate: str
    visitTime: str
    message: str
    springResponse: dict[str, Any] = Field(default_factory=dict)


class TourWorkflowApplyReq(BaseModel):
    schemaVersion: str = "v1"
    sessionId: str | None = None
    clientRequestId: str | None = None
    roomNo: str
    roomName: str | None = None
    visitDate: str | None = None
    visitTime: str | None = None
    preferredVisitAt: str | None = None
    userName: str | None = None
    userPhone: str | None = None
    inquiry: str | None = None


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
