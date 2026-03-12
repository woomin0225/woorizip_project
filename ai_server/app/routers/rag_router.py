from fastapi import APIRouter, Request

from app.clients.embedding_client import KureEmbeddingClient
from app.services.rag_service import RagService

router = APIRouter(
    prefix="/ai/rag"
)

@router.post("/room", summary="방정보 rag 검색", description="입력한 텍스트를 사용해 의미기반의 방 검색을 수행합니다.")
def room_search(text: str, request: Request):
    ragService = RagService(vectorClient=request.app.state.vectorClient, embeddingClient=request.app.state.embeddingClient)
    room_list = ragService.room_rag(text, request.app.state.tokenizer)
    
    return {
        "status": True,
        "text": text,
        "result": room_list,
        "message": "방정보 rag 검색 성공"
    }