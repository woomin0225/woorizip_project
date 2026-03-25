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


def _map_voice_value_error(exc: ValueError) -> HTTPException:
    message = str(exc)
    lowered = message.lower()

    if (
        'google_application_credentials' in lowered
        or 'google_service_account_json' in lowered
        or '서비스 계정' in message
        or 'access token' in lowered
        or 'unsupported tts_provider' in lowered
        or 'unsupported stt_provider' in lowered
        or 'provider' in lowered and '지원' in message
    ):
        return HTTPException(status_code=503, detail=message)

    if (
        'text는 비어' in message
        or 'audio_format' in lowered
        or 'mime_type' in lowered
        or 'audio_base64' in lowered
        or '오디오 데이터가 비어' in message
        or '오디오 데이터가 너무' in message
    ):
        return HTTPException(status_code=400, detail=message)

    if 'google cloud' in lowered:
        return HTTPException(status_code=502, detail=message)

    return HTTPException(status_code=500, detail=message)


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
    try:
        return await _get_voice_pipeline().transcribe(req)
    except HTTPException:
        raise
    except ValueError as exc:
        logger.warning('Voice transcribe validation/provider error: %s', exc)
        raise _map_voice_value_error(exc) from exc
    except Exception as exc:
        logger.exception('Voice transcribe failed: %s', exc)
        raise HTTPException(
            status_code=500,
            detail='음성 인식 처리 중 내부 오류가 발생했습니다.',
        ) from exc


@router.post(
    '/speak',
    dependencies=[Depends(require_internal_api_key)],
    response_model=VoiceSpeakRes,
)
async def speak(req: VoiceSpeakReq):
    try:
        return await _get_voice_pipeline().speak(req)
    except HTTPException:
        raise
    except ValueError as exc:
        logger.warning('Voice speak validation/provider error: %s', exc)
        raise _map_voice_value_error(exc) from exc
    except Exception as exc:
        logger.exception('Voice speak failed: %s', exc)
        raise HTTPException(
            status_code=500,
            detail='음성 합성 처리 중 내부 오류가 발생했습니다.',
        ) from exc
