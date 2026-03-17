from __future__ import annotations

from app.clients.spring_tour_client import SpringTourClient
from app.schemas import TourApplyReq


class TourService:
    def __init__(self, client: SpringTourClient):
        self.client = client

    async def apply(self, request: TourApplyReq, *, access_token: str | None = None) -> dict:
        message = self._build_message(request)
        payload = {
            'visitDate': request.visitDate,
            'visitTime': self._normalize_visit_time(request.visitTime),
            'message': message,
        }

        spring_response = await self.client.apply_tour(
            room_no=request.roomNo,
            payload=payload,
            access_token=access_token,
        )

        return {
            'ok': True,
            'roomNo': request.roomNo,
            'visitDate': request.visitDate,
            'visitTime': request.visitTime,
            'message': message,
            'springResponse': spring_response,
        }

    def _normalize_visit_time(self, value: str) -> str:
        compact = (value or '').strip()
        if len(compact) == 5:
            return compact + ':00'
        return compact

    def _build_message(self, request: TourApplyReq) -> str:
        inquiry = (request.inquiry or '').strip()
        if not inquiry or inquiry == '없음':
            inquiry = '추가 문의사항 없음'
        return (
            f'신청자명: {request.userName}\n'
            f'연락처: {request.userPhone}\n'
            f'문의사항: {inquiry}'
        )
