from __future__ import annotations

from fastapi import APIRouter, Depends

from app.clients import build_stt_client, build_tts_client
from app.core.security import require_internal_api_key
from app.schemas import (
    VoiceSpeakReq,
    VoiceSpeakRes,
    VoiceTranscribeReq,
    VoiceTranscribeRes,
)
from app.services.voice_pipeline_service import VoicePipelineService
from app.services.voice_service import VoiceService


router = APIRouter(prefix='/ai/voice', tags=['voice'])
voice_pipeline = VoicePipelineService(
    VoiceService(
        stt_client=build_stt_client(),
        tts_client=build_tts_client(),
    )
)


@router.post(
    '/transcribe',
    dependencies=[Depends(require_internal_api_key)],
    response_model=VoiceTranscribeRes,
)
async def transcribe(req: VoiceTranscribeReq):
    return await voice_pipeline.transcribe(req)


@router.post(
    '/speak',
    dependencies=[Depends(require_internal_api_key)],
    response_model=VoiceSpeakRes,
)
async def speak(req: VoiceSpeakReq):
    return await voice_pipeline.speak(req)
