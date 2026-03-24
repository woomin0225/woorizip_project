from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

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
logger = logging.getLogger(__name__)


def _build_voice_pipeline() -> VoicePipelineService:
    return VoicePipelineService(
        VoiceService(
            stt_client=build_stt_client(),
            tts_client=build_tts_client(),
        )
    )


def _get_voice_pipeline() -> VoicePipelineService:
    # Keep the app bootable even when voice provider settings are wrong.
    try:
        return _build_voice_pipeline()
    except Exception as exc:
        logger.exception('Voice pipeline initialization failed: %s', exc)
        raise HTTPException(
            status_code=503,
            detail=(
                '음성 기능 설정이 올바르지 않아 현재 사용할 수 없습니다. '
                '배포 환경의 STT/TTS provider와 인증 정보를 확인해 주세요.'
            ),
        ) from exc


@router.post(
    '/transcribe',
    dependencies=[Depends(require_internal_api_key)],
    response_model=VoiceTranscribeRes,
)
async def transcribe(req: VoiceTranscribeReq):
    return await _get_voice_pipeline().transcribe(req)


@router.post(
    '/speak',
    dependencies=[Depends(require_internal_api_key)],
    response_model=VoiceSpeakRes,
)
async def speak(req: VoiceSpeakReq):
    return await _get_voice_pipeline().speak(req)
