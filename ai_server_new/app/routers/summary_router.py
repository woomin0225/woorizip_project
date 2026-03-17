from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.dependencies import get_room_summary_service
from app.schemas import RoomSummaryRequest, RoomTotalRequest
from app.services.summary_service import RoomSummaryService

router = APIRouter(
    prefix='/ai/summary'
)

@router.post("/room/reviews", summary="방 리뷰들 요약", description="방의 리뷰들의 내용을 요약합니다.")
async def room_reviews_summary(
    room_reviews:RoomSummaryRequest,
    room_summary_service: Annotated[RoomSummaryService, Depends(get_room_summary_service)]
):
    try:
        summary = room_summary_service.summary_room_reviews(room_reviews.texts)
        return {
            "status": True,
            "status_code": 200,
            "roomNo": room_reviews.roomNo,
            "summary": summary,
            "message": "방 리뷰 목록 요약 성공"
        }
    except ValueError as exc:
        return {
            "status": False,
            "status_code": 400,
            "roomNo": room_reviews.roomNo,
            "summary": None,
            "message": str(exc)
            }
        
    except Exception:
        return {
            "status": False,
            "status_code": 500,
            "roomNo": room_reviews.roomNo,
            "summary": None,
            "message": "방 리뷰 목록 요약 실패"
            }

@router.post("/room/images", summary="방 이미지 캡션들 요약", description="이미지에 추가된 캡션들의 내용을 요약합니다.")
async def room_images_summary(
    room_image_captions:RoomSummaryRequest,
    room_summary_service: Annotated[RoomSummaryService, Depends(get_room_summary_service)]
):
    summary = room_summary_service.summary_room_image_captions(room_image_captions.texts)
    return {
        "status": True,
        "roomNo": room_image_captions.roomNo,
        "summary": summary,
        "message": "방 이미지 설명 목록 요약 성공"
    }

@router.post("/room/total", summary="방 정보 요약", description="방의 정보(기본정보+사진캡션요약+리뷰요약)를 종합 요약합니다.")
async def room_total_summary(
    room:RoomTotalRequest,
    room_summary_service: Annotated[RoomSummaryService, Depends(get_room_summary_service)]
):
    summary = room_summary_service.summary_room_total(room)
    return {
        "status": True,
        "roomNo": room.roomNo,
        "summary": summary,
        "message": "방정보 종합 요약 성공"
    }
