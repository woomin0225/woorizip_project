# app/main.py

from __future__ import annotations
from app.core.config import settings
import base64
from contextlib import asynccontextmanager
from io import BytesIO
from typing import Any, Annotated

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
from pydantic import BaseModel
from transformers import AutoTokenizer

from app.clients.embedding_client import KureEmbeddingClient
from app.clients.groundingdino_client import GroundingDINOClient
from app.clients.paddleocr_client import PaddleOCRClient
from app.clients.qdrant_client import QdrantDbClient
from app.clients.qwen_caption_client import QwenCaptionClient
from app.clients.qwen_llm_client import QwenLlmClient

from app.core.security import require_internal_api_key
from app.ibm.groq_llm_client import GroqLLMClient
from app.routers import (
    assistant_router,
    embed_router,
    rag_router,
    summary_router,
    voice_router,
)
from app.schemas import (
    EmbeddingReq,
    EmbeddingRes,
    RoomVisionAnalyzeRes,
    SummaryReq,
    VisionAnalyzeReq,
)
from app.services.embedding_service import EmbeddingService
from app.services.summary_service import SummaryService
from app.services.vision_service import VisionService


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 앱시작시 구동될 클라이언트 작성
    app.state.qwen_llm_client=QwenLlmClient("Qwen/Qwen2.5-3B-Instruct")   # Qwen/Qwen3-4B-Instruct-2507 : 추후 상위모델로 교체
    # app.state.embeddingClient=OpenaiEmbeddingClient()
    app.state.embedding_client=KureEmbeddingClient()
    app.state.vector_client=QdrantDbClient()
    app.state.tokenizer = AutoTokenizer.from_pretrained("nlpai-lab/KURE-v1")
    yield
    # 앱 종료시

app = FastAPI(
    title="AI Summary + Vision Server",
    default_response_class=JSONResponse,
    lifespan=lifespan
)
app.include_router(
    embed_router.router,
    tags=["embed"]
)
app.include_router(
    summary_router.router,
    tags=["summary"]
)
app.include_router(
    rag_router.router,
    tags=["rag"]
)

@app.middleware("http")
async def add_utf8_charset(request, call_next):
    response = await call_next(request)
    content_type = response.headers.get("content-type", "")
    if content_type.startswith("application/json") and "charset=" not in content_type.lower():
        response.headers["content-type"] = "application/json; charset=utf-8"
    return response


app.include_router(assistant_router.router)
app.include_router(voice_router.router)


class DetectRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"
    text_prompt: str
    box_threshold: float = 0.30
    text_threshold: float = 0.25
    purpose: str = "generic"
    meta: dict[str, Any] | None = None


def decode_base64_image(image_base64: str) -> Image.Image:
    try:
        raw = base64.b64decode(image_base64)
        return Image.open(BytesIO(raw)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"이미지 디코딩 실패: {str(e)}") from e


def parse_grounding_labels(text_prompt: str) -> list[str]:
    labels: list[str] = []
    for token in text_prompt.split("."):
        value = token.strip()
        if value:
            labels.append(value)
    return labels


def build_llm() -> GroqLLMClient:
    if settings.LLM_PROVIDER.lower() != "groq":
        raise RuntimeError("현재 서버는 LLM_PROVIDER=groq 만 지원합니다.")

    return GroqLLMClient(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_MODEL,
    )


@app.on_event("startup")
async def _startup() -> None:
    settings.validate()


llm = build_llm()
summary = SummaryService(llm)
caption_client = QwenCaptionClient()
detection_client = GroundingDINOClient()
ocr_client = PaddleOCRClient()
embedding_service = EmbeddingService()
vision = VisionService(
    caption_client=caption_client,
    detection_client=detection_client,
    ocr_client=ocr_client,
    rag=None,
)


@app.get("/")
def welcome(request: Request):
    qwen_client = getattr(request.app.state, "qwen_llm_client", None)
    embedding_client = getattr(request.app.state, "embedding_client", None)
    vector_client = getattr(request.app.state, "vector_client", None)
    tokenizer = getattr(request.app.state, "tokenizer", None)

    return {
        "message": "AI server is running",
        "clients": {
            "qwen_llm_client": {
                "ready": qwen_client is not None,
                "model_name": getattr(qwen_client, "model_name", None),
            },
            "embedding_client": {
                "ready": embedding_client is not None,
                "model_name": "nlpai-lab/KURE-v1" if embedding_client is not None else None,
            },
            "vector_client": {
                "ready": vector_client is not None,
                "type": type(vector_client).__name__ if vector_client is not None else None,
            },
            "tokenizer": {
                "ready": tokenizer is not None,
                "name": getattr(tokenizer, "name_or_path", None),
            },
        },
    }



@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "llm_provider": settings.LLM_PROVIDER,
        "caption_provider": settings.CAPTION_PROVIDER,
        "object_detection_provider": settings.OBJECT_DETECTION_PROVIDER,
        "ocr_provider": settings.OCR_PROVIDER,
        "stt_provider": settings.STT_PROVIDER,
        "tts_provider": settings.TTS_PROVIDER,
        "features": ["assistant", "stt", "tts", "summary", "vision", "embedding"],
    }


@app.post("/detect")
async def groundingdino_detect(req: DetectRequest) -> dict[str, Any]:
    result = await detection_client.detect(
        image_base64=req.image_base64,
        mime_type=req.mime_type,
        purpose=req.purpose,
        meta={
            **(req.meta or {}),
            "labels": parse_grounding_labels(req.text_prompt),
        },
    )

    return {
        "items": result.get("items", []),
        "provider": result.get("provider", "groundingdino"),
        "text_prompt": result.get("text_prompt", req.text_prompt),
        "warning": result.get("warning"),
    }


@app.post("/ai/summary", dependencies=[Depends(require_internal_api_key)])
async def summary_unified(req: SummaryReq) -> dict[str, Any]:
    if req.target_type == "room":
        return await summary.summarize_room(
            room_id=req.room_id,
            room=req.room or {},
            reviews=req.reviews or [],
            photos_caption=req.photos_caption,
            bullets=req.bullets,
        )

    if req.target_type == "post" or req.attachments:
        return await summary.summarize_post(
            title=req.title,
            text=req.text or "",
            attachments=[item.model_dump() for item in req.attachments],
            bullets=req.bullets,
        )

    return await summary.summarize_text(
        title=req.title,
        text=req.text or "",
        bullets=req.bullets,
    )


@app.post("/ai/vision/analyze", dependencies=[Depends(require_internal_api_key)])
async def vision_analyze(req: VisionAnalyzeReq) -> dict[str, Any]:
    return await vision.analyze(
        images=[it.model_dump() for it in req.images],
        purpose=req.purpose,
        caption=req.caption,
        detect=req.detect,
        ocr=req.ocr,
        ingest=False,
        source_prefix=req.source_prefix,
    )


@app.post(
    "/ai/vision/room/analyze",
    dependencies=[Depends(require_internal_api_key)],
    response_model=RoomVisionAnalyzeRes,
)
async def room_vision_analyze(
    images: Annotated[list[UploadFile], File(...)],
    source_prefix: Annotated[str, Form()] = "room-image",
    save_embedding: Annotated[bool, Form()] = False,
) -> dict[str, Any]:
    converted_images: list[dict[str, Any]] = []

    for image in images:
        content = await image.read()
        mime_type = image.content_type or "application/octet-stream"
        b64_data = base64.b64encode(content).decode("utf-8")

        converted_images.append(
            {
                "image_id": image.filename or "room-image",
                "mime_type": mime_type,
                "image_base64": b64_data,
                "meta": {},
            }
        )

    return await vision.analyze_room_images(
        images=converted_images,
        source_prefix=source_prefix,
        save_embedding=save_embedding,
    )


@app.post(
    "/ai/embedding",
    dependencies=[Depends(require_internal_api_key)],
    response_model=EmbeddingRes,
)
async def create_embedding(req: EmbeddingReq) -> dict[str, Any]:
    result = embedding_service.embed_text(req.text)
    return {
        "model": result["model"],
        "dimension": result["dimension"],
        "embedding": result["embedding"],
    }
