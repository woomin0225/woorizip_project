from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, UploadFile, File, Form
import base64

from app.clients import (
    build_caption_client,
    build_embedding_client,
    build_object_detection_client,
    build_ocr_client,
    build_sentiment_client,
    build_stt_client,
    build_tts_client,
)
from app.core.config import settings
from app.core.security import get_user_context, require_internal_api_key
from app.ibm.mock_client import MockLLMClient
from app.ibm.watsonx_client import WatsonxClient
from app.ibm.llm_client import GeminiLLMClient, GroqLLMClient
from app.schemas import (
    AgentRunReq,
    ChatReq,
    DocWriteReq,
    ListingIndexReq,
    ListingSearchReq,
    MonitorAnalyzeReq,
    PolicyCheckReq,
    RagIngestReq,
    RagQueryReq,
    RecommendReq,
    ReviewAnalyzeReq,
    ReviewSummaryReq,
    SummaryReq,
    VisionAnalyzeReq,
    RoomVisionAnalyzeRes,
    VoiceSpeakReq,
    VoiceTranscribeReq,
)
from app.services.agent_router import AgentRouter
from app.services.doc_service import DocService
from app.services.listing_service import ListingService
from app.services.monitoring_service import MonitoringService
from app.services.policy_service import PolicyService
from app.services.rag_service import RagService
from app.services.reco_service import RecoService
from app.services.review_service import ReviewService
from app.services.spring_tools import SpringTools
from app.services.summary_service import SummaryService
from app.services.vision_service import VisionService
from app.services.voice_service import VoiceService
from app.store.vector_store import build_vector_store

app = FastAPI(title='WooriZip AI Agent Server (Slim v0.3)', version='0.3.0')


@app.on_event('startup')
async def _startup():
    settings.validate()


def build_llm():
    provider = settings.LLM_PROVIDER.lower()

    if provider == 'groq':
        return GroqLLMClient(
            api_key=settings.GROQ_API_KEY,
            model=settings.GROQ_MODEL,
        )

    if provider == 'gemini':
        return GeminiLLMClient(
            api_key=settings.GOOGLE_API_KEY,
            model=settings.GEMINI_CHAT_MODEL,
            embedding_model=settings.GEMINI_EMBED_MODEL,
        )

    if provider == 'watsonx':
        return WatsonxClient()

    if provider == 'mock':
        return MockLLMClient()

    raise ValueError(f'Unsupported LLM_PROVIDER: {settings.LLM_PROVIDER}')


llm = build_llm()
embedding_client = build_embedding_client()
stt_client = build_stt_client()
tts_client = build_tts_client()
caption_client = build_caption_client()
detection_client = build_object_detection_client()
ocr_client = build_ocr_client()
sentiment_client = build_sentiment_client()
store = build_vector_store()

rag = RagService(llm, embedding_client, store)
doc = DocService(llm)
reco = RecoService(llm)
summary = SummaryService(llm)
policy = PolicyService(llm=None)
monitoring = MonitoringService(llm=llm)
tools = SpringTools()
agent = AgentRouter(llm, rag, doc, reco, summary, policy, monitoring, tools)
vision = VisionService(caption_client=caption_client, detection_client=detection_client, ocr_client=ocr_client, rag=rag)
voice = VoiceService(stt_client=stt_client, tts_client=tts_client)
listing = ListingService(llm, embedding_client, store)
review = ReviewService(llm, sentiment_client, embedding_client, store)


@app.get('/health')
def health():
    return {
        'ok': True,
        'llm_provider': settings.LLM_PROVIDER,
        'embedding_provider': settings.EMBEDDING_PROVIDER,
        'stt_provider': settings.STT_PROVIDER,
        'tts_provider': settings.TTS_PROVIDER,
        'caption_provider': settings.CAPTION_PROVIDER,
        'object_detection_provider': settings.OBJECT_DETECTION_PROVIDER,
        'ocr_provider': settings.OCR_PROVIDER,
        'sentiment_provider': settings.SENTIMENT_PROVIDER,
        'tool_mode': settings.TOOL_EXECUTION_MODE,
        'vector_store': 'chroma',
    }


@app.post('/ai/chat', dependencies=[Depends(require_internal_api_key)])
async def ai_chat(req: ChatReq, ctx: dict = Depends(get_user_context)):
    messages = req.history + [{'role': 'user', 'content': req.message}]
    answer = await llm.chat(messages, temperature=0.3, max_new_tokens=600)
    return {'answer': answer, 'user': ctx.get('user_id'), 'roles': ctx.get('roles')}


@app.post('/ai/rag/ingest', dependencies=[Depends(require_internal_api_key)])
async def rag_ingest(req: RagIngestReq, ctx: dict = Depends(get_user_context)):
    meta = {**req.meta, 'user_id': ctx.get('user_id')}
    return await rag.ingest_text(req.source_id, req.text, meta)


@app.post('/ai/rag/query', dependencies=[Depends(require_internal_api_key)])
async def rag_query(req: RagQueryReq):
    return await rag.answer(req.question, top_k=req.top_k, filters=req.filters)


@app.post('/ai/doc/write', dependencies=[Depends(require_internal_api_key)])
async def doc_write(req: DocWriteReq):
    text = await doc.write(req.doc_type, req.requirements, req.tone, req.length)
    return {'result': text}


@app.post('/ai/recommend', dependencies=[Depends(require_internal_api_key)])
async def recommend(req: RecommendReq):
    return await reco.recommend(req.user_id, req.candidates, req.goal)


@app.post('/ai/agent/run', dependencies=[Depends(require_internal_api_key)])
async def agent_run(req: AgentRunReq, ctx: dict = Depends(get_user_context)):
    user_id = req.user_id or ctx.get('user_id') or 'anonymous'
    return await agent.run(user_id, req.instruction, req.extra)


@app.post('/ai/summary', dependencies=[Depends(require_internal_api_key)])
async def summary_unified(req: SummaryReq):
    if req.target_type == 'room':
        out = await summary.summarize_room(req.room_id, req.room or {}, reviews=req.reviews or [], photos_caption=req.photos_caption, bullets=req.bullets)
    elif req.target_type == 'post' or req.attachments:
        out = await summary.summarize_post(
            req.title,
            req.text or '',
            attachments=[item.model_dump() for item in req.attachments],
            bullets=req.bullets,
        )
    else:
        out = await summary.summarize_text(req.title, req.text or '', bullets=req.bullets)

    if req.include_tts:
        tts = await voice.speak(out.get('summary') or '', voice=req.voice, audio_format=req.audio_format)
        return {'summary': out, 'tts': tts}
    return out


@app.post('/ai/vision/analyze', dependencies=[Depends(require_internal_api_key)])
async def vision_analyze(req: VisionAnalyzeReq):
    return await vision.analyze(
        images=[it.model_dump() for it in req.images],
        purpose=req.purpose,
        caption=req.caption,
        detect=req.detect,
        ocr=req.ocr,
        ingest=req.ingest,
        source_prefix=req.source_prefix,
    )
    
    
@app.post('/ai/vision/room/analyze', dependencies=[Depends(require_internal_api_key)], response_model=RoomVisionAnalyzeRes)
async def room_vision_analyze(
    images: list[UploadFile] = File(...),
    source_prefix: str = Form('room-image'),
    save_embedding: bool = Form(False),
):
    converted_images = []
    
    for image in images:
        content = await image.read()
        mime_type = image.content_type or 'application/octet-stream'
        b64_data = base64.b64encode(content).decode('utf-8')
        
        converted_images.append({
            'image_id': image.filename or 'room-image',
            'mime_type': mime_type,
            'image_base64': b64_data,
            'meta': {},
        })
        
    return await vision.analyze_room_images(
        images=converted_images,
        source_prefix=source_prefix,
        save_embedding=save_embedding,
    )


@app.post('/ai/voice/transcribe', dependencies=[Depends(require_internal_api_key)])
async def voice_transcribe(req: VoiceTranscribeReq):
    return await voice.transcribe(req.audio_base64, mime_type=req.mime_type, language=req.language, mock_text=req.mock_text)


@app.post('/ai/voice/speak', dependencies=[Depends(require_internal_api_key)])
async def voice_speak(req: VoiceSpeakReq):
    return await voice.speak(req.text, voice=req.voice, audio_format=req.audio_format)


@app.post('/ai/policy/check', dependencies=[Depends(require_internal_api_key)])
async def policy_check(req: PolicyCheckReq):
    return await policy.check(req.text)


@app.post('/ai/monitor/analyze', dependencies=[Depends(require_internal_api_key)])
async def monitor_analyze(req: MonitorAnalyzeReq):
    return await monitoring.analyze(req.kind, req.payload, tone=req.tone)


@app.post('/ai/listing/index', dependencies=[Depends(require_internal_api_key)])
async def listing_index(req: ListingIndexReq):
    return await listing.index_room(req.room_id, req.room, image_summaries=req.image_summaries, review_summary=req.review_summary, meta=req.meta)


@app.post('/ai/listing/search', dependencies=[Depends(require_internal_api_key)])
async def listing_search(req: ListingSearchReq):
    return await listing.search_rooms(req.query, filters=req.filters, candidates=req.candidates, top_k=req.top_k)


@app.post('/ai/review/analyze', dependencies=[Depends(require_internal_api_key)])
async def review_analyze(req: ReviewAnalyzeReq):
    return await review.analyze_review(req.room_id, req.review_id, req.text, ingest=req.ingest, meta=req.meta)


@app.post('/ai/review/summary', dependencies=[Depends(require_internal_api_key)])
async def review_summary(req: ReviewSummaryReq):
    return await review.summarize_room_reviews(req.room_id, req.reviews, room_meta=req.room_meta)
