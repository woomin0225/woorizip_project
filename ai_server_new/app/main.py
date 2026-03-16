from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.routers import assistant_router, tour_router, voice_router

app = FastAPI(default_response_class=JSONResponse)


@app.middleware('http')
async def add_utf8_charset(request, call_next):
    response = await call_next(request)
    content_type = response.headers.get('content-type', '')
    if content_type.startswith('application/json') and 'charset=' not in content_type.lower():
        response.headers['content-type'] = 'application/json; charset=utf-8'
    return response


app.include_router(assistant_router.router)
app.include_router(tour_router.router)
app.include_router(voice_router.router)


@app.get('/')
def welcome():
    return {'hello': 'ai_server_new'}


@app.get('/health')
def health():
    return {
        'ok': True,
        'llm_provider': 'mock' if not (settings.AI_AGENT_ENDPOINT or '').strip() else 'external',
        'stt_provider': settings.STT_PROVIDER,
        'tts_provider': settings.TTS_PROVIDER,
        'features': ['assistant', 'tour', 'stt', 'tts'],
    }
