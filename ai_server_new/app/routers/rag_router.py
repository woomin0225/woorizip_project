from typing import Annotated

from fastapi import APIRouter, Body, Depends

from app.dependencies import get_rag_service, get_tokenizer
from app.services.rag_service import RagService

# /ai/rag 아래에 RAG 관련 API를 모아 두기 위한 라우터입니다.
router = APIRouter(prefix="/ai/rag")


@router.post(
    "/room",
    summary="방정보 rag 검색",
    description="입력한 텍스트를 사용해 의미기반의 방 검색을 수행합니다.",
)
async def room_search(
    # Body(embed=False)를 사용한 이유:
    # 프론트/스프링에서 {"text": "..."} 같은 JSON 객체가 아니라
    # 문자열 본문 자체를 그대로 보내도록 맞췄기 때문입니다.
    text: Annotated[str, Body(embed=False)],
    # Depends를 사용하면 라우터가 서비스 객체를 직접 생성하지 않고
    # FastAPI의 의존성 주입 시스템에서 받아 쓸 수 있습니다.
    rag_service: Annotated[RagService, Depends(get_rag_service)],
    tokenizer=Depends(get_tokenizer),
):
    # 실제 의미 검색은 RagService가 담당합니다.
    # 라우터는 "요청을 받고", "응답 형태를 정리해서 돌려주는" 역할만 합니다.
    room_list = await rag_service.room_rag(text, tokenizer)

    # 스프링 쪽 기존 DTO가 room 번호 리스트만 기대하고 있어서
    # 호환성을 위해 roomNo만 따로 뽑은 배열도 함께 내려줍니다.
    room_no_list = [item["roomNo"] for item in room_list]

    return {
        "status": True,
        # 사용자가 보낸 원문을 그대로 되돌려 주면
        # 디버깅할 때 "서버가 어떤 문장을 받았는지" 확인하기 쉽습니다.
        "text": text,
        # result에는 점수까지 포함된 상세 결과를 넣습니다.
        "result": room_list,
        # room_list에는 기존 스프링 코드가 바로 쓰기 쉬운 roomNo 배열만 넣습니다.
        "room_list": room_no_list,
        "message": "방정보 rag 검색 성공",
    }
