from typing import Annotated

from fastapi import APIRouter, Depends, Request

from app.clients.embedding_client import KureEmbeddingClient
from app.dependencies import get_rag_service, get_tokenizer
from app.services.rag_service import RagService

router = APIRouter(
    prefix="/ai/rag"
)

@router.post("/room", summary="방정보 rag 검색", description="입력한 텍스트를 사용해 의미기반의 방 검색을 수행합니다.")
async def room_search(
    text: str,
    rag_service: Annotated[RagService, Depends(get_rag_service)],
    tokenizer = Depends(get_tokenizer)
):
    room_list = rag_service.room_rag(text, tokenizer)
    
    return {
        "status": True,
        "text": text,
        "result": room_list,
        "message": "방정보 rag 검색 성공"
    }