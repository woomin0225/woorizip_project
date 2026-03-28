from typing import Annotated

from fastapi import APIRouter, Body, Depends

from app.dependencies import get_rag_service
from app.services.rag_service import RagService

router = APIRouter(prefix="/ai/rag")


@router.post(
    "/room",
    summary="방 정보 RAG 검색",
    description="입력 텍스트를 사용해 방 벡터 검색을 수행하고 설명을 생성합니다.",
)
async def room_search(
    text: Annotated[str, Body(embed=False)],
    rag_service: Annotated[RagService, Depends(get_rag_service)],
):
    rag_result = await rag_service.room_rag(text)
    room_list = rag_result.get("results") or []
    room_no_list = [item["roomNo"] for item in room_list]
    explanation = str(rag_result.get("explanation") or "").strip()

    return {
        "status": True,
        "text": text,
        "result": room_list,
        "room_list": room_no_list,
        "explanation": explanation,
        "message": "방정보 rag 검색 성공",
    }
