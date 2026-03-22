# app/estateRouter.py

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_embedding_service, get_tokenizer, get_vector_store
from app.schemas import RoomTotalRequest
from app.services.embedding_service import RoomEmbeddingService
from app.store.vector_store import VectorStore
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ai/embed",
)


@router.post("/room", summary="방 정보 임베딩+벡터저장", description="방의 정보(기본정보+사진캡션요약+리뷰요약)를 임베딩하여 qdrant db에 저장합니다.")
async def RoomInfoEmbeddingAndStore(
    target:RoomTotalRequest,
    embedding_service: Annotated[RoomEmbeddingService, Depends(get_embedding_service)],
    vector_store: Annotated[VectorStore, Depends(get_vector_store)],
    tokenizer= Depends(get_tokenizer)
):
    # embeddingService
    vector = await embedding_service.room_embed(target, tokenizer)
    
    # vectorStore
    collection_name = "room_collection" # 저장할 컬렉션 이름(리턴용)
    await vector_store.room_vector_store(target, vector)
    
    return {
        "status": True,
        "roomNo": target.roomNo,
        "collection": collection_name,
        "message": "방정보 임베딩 및 벡터 저장에 성공"
    }

@router.delete("/room/{room_no}")
async def RemoveRoomVector(
    vector_store: Annotated[VectorStore, Depends(get_vector_store)],
    room_no: str
):
    collection_name = "room_collection"
    logger.info("방 벡터 삭제 시작. room_no=%s, collection_name=%s", room_no, collection_name)
    try:
        await vector_store.remove_room_vector(room_no)
        logger.info("방 벡터 삭제 마침. room_no=%s, collection_name=%s", room_no, collection_name)
    except Exception:
        logger.exception("방 벡터 삭제 실패. room_no=%s, collection_name=%s", room_no, collection_name)
        raise HTTPException(status_code=500, detail="Qdrant delete failed")
    
    return {
        "status": True,
        "roomNo": room_no,
        "collection": collection_name,
        "message": "방 벡터 삭제 성공"
    }
