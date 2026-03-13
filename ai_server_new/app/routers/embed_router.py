# app/estateRouter.py

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from tokenizers import Tokenizer

# from app.clients.embedding_client import OpenaiEmbeddingClient
from app.clients.qdrant_client import QdrantDbClient
from app.dependencies import get_embedding_service, get_tokenizer, get_vector_store
from app.schemas import RoomTotalRequest
from app.services.chunking import chunking
from app.services.embedding_service import EmbeddingService
from app.store.vector_store import VectorStore

router = APIRouter(
    prefix="/ai/embed",
)


@router.post("/room", summary="방 정보 임베딩+벡터저장", description="방의 정보(기본정보+사진캡션요약+리뷰요약)를 임베딩하여 qdrant db에 저장합니다.")
async def RoomInfoEmbeddingAndStore(
    target:RoomTotalRequest,
    embedding_service: Annotated[EmbeddingService, Depends(get_embedding_service)],
    vector_store: Annotated[VectorStore, Depends(get_vector_store)],
    tokenizer= Depends(get_tokenizer)
):
    # embeddingService
    vector = embedding_service.room_embed(target, tokenizer)
    
    # vectorStore
    collection_name = "room_collection" # 저장할 컬렉션 이름
    vector_store.room_vector_store(collection_name, target, vector)
    
    return {
        "status": True,
        "roomNo": target.roomNo,
        "collection": collection_name,
        "message": "방정보 임베딩 및 벡터 저장에 성공"
    }
