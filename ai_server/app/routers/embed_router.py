# app/estateRouter.py

from fastapi import APIRouter, Request

from app.clients.qdrant_client import QdrantDbClient
from app.schemas import RoomTotalRequest
from app.services.chunking import chunking
from app.services.embedding_service import EmbeddingService
from app.store.vector_store import VectorStore

router = APIRouter(
    prefix="/ai/embed",
)


@router.post("/room", summary="방 정보 임베딩+벡터저장", description="방의 정보(기본정보+사진캡션요약+리뷰요약)를 임베딩하여 qdrant db에 저장합니다.")
def RoomInfoEmbeddingAndStore(target:RoomTotalRequest, request:Request):
    # embeddingService 인스턴스 생성
    embeddingService = EmbeddingService(client=request.app.state.embeddingClient)
    vector = embeddingService.room_embed(target, request.app.state.tokenizer)
    
    # vectorStore 인스턴스 생성
    collection_name = "room_collection" # 저장할 컬렉션 이름
    vectorStore = VectorStore(client=request.app.state.vectorClient)
    vectorStore.room_vector_store(collection_name, target, vector)
    
    return {
        "status": True,
        "roomNo": target.roomNo,
        "collection": collection_name,
        "message": "방정보 임베딩 및 벡터 저장에 성공"
    }
