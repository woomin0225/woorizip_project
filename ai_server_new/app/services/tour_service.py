from __future__ import annotations

from datetime import datetime
import re

from app.clients.spring_tour_client import SpringTourClient
from app.schemas import TourApplyReq, TourWorkflowApplyReq


class TourService:
    def __init__(self, client: SpringTourClient):
        self.client = client

    async def apply(self, request: TourApplyReq, *, access_token: str | None = None) -> dict:
        normalized_request = TourApplyReq(
            roomNo=(request.roomNo or '').strip(),
            visitDate=self._normalize_visit_date(request.visitDate),
            visitTime=self._normalize_visit_time(request.visitTime),
            userName=self._normalize_user_name(request.userName),
            userPhone=self._normalize_user_phone(request.userPhone),
            inquiry=self._normalize_inquiry(request.inquiry),
        )

        message = self._build_message(normalized_request)
        payload = {
            'visitDate': normalized_request.visitDate,
            'visitTime': self._normalize_visit_time(normalized_request.visitTime),
            'message': message,
        }

        spring_response = await self.client.apply_tour(
            room_no=normalized_request.roomNo,
            payload=payload,
            access_token=access_token,
        )

        return {
            'ok': True,
            'roomNo': normalized_request.roomNo,
            'visitDate': normalized_request.visitDate,
            'visitTime': normalized_request.visitTime,
            'message': message,
            'springResponse': spring_response,
        }

    async def apply_for_chatbot(
        self,
        request: TourWorkflowApplyReq,
        *,
        access_token: str | None = None,
        default_user_name: str | None = None,
        default_user_phone: str | None = None,
    ) -> dict:
        try:
            visit_date, visit_time = self._resolve_visit_schedule(
                visit_date=request.visitDate,
                visit_time=request.visitTime,
                preferred_visit_at=request.preferredVisitAt,
            )
            resolved_user_name = self._resolve_optional_user_name(
                request.userName or default_user_name
            )
            resolved_user_phone = self._resolve_optional_user_phone(
                request.userPhone or default_user_phone
            )
            apply_result = await self.apply(
                TourApplyReq(
                    roomNo=request.roomNo,
                    visitDate=visit_date,
                    visitTime=visit_time,
                    userName=resolved_user_name,
                    userPhone=resolved_user_phone,
                    inquiry=request.inquiry,
                ),
                access_token=access_token,
            )
            room_name = (request.roomName or '').strip()
            room_label = room_name or apply_result['roomNo']
            reply = (
                f"{room_label} 투어 신청이 완료되었습니다. "
                f"방문 일정은 {apply_result['visitDate']} {apply_result['visitTime']}입니다. "
                "담당자가 확인 후 안내드릴 예정입니다."
            )
            return {
                'schemaVersion': request.schemaVersion,
                'reply': reply,
                'intent': 'TOUR_APPLY',
                'slots': {
                    'roomNo': apply_result['roomNo'],
                    'visitDate': apply_result['visitDate'],
                    'visitTime': apply_result['visitTime'],
                    'userName': resolved_user_name,
                    'userPhone': resolved_user_phone,
                    'inquiry': self._normalize_inquiry(request.inquiry),
                },
                'action': {
                    'name': 'TOUR_APPLY',
                    'path': '/ai/tour/workflow/apply',
                    'target': 'spring_tour_api',
                    'status': 'submitted',
                },
                'result': apply_result,
                'errorCode': None,
                'requiresConfirm': False,
                'sessionId': request.sessionId,
                'clientRequestId': request.clientRequestId,
                'raw': apply_result,
            }
        except Exception as exc:
            return {
                'schemaVersion': request.schemaVersion,
                'reply': f"투어 신청 처리 중 문제가 발생했습니다. {str(exc)}",
                'intent': 'TOUR_APPLY',
                'slots': {
                    'roomNo': (request.roomNo or '').strip(),
                    'visitDate': (request.visitDate or '').strip(),
                    'visitTime': (request.visitTime or '').strip(),
                    'preferredVisitAt': (request.preferredVisitAt or '').strip(),
                    'userName': self._resolve_optional_user_name(
                        request.userName or default_user_name
                    ),
                    'userPhone': self._resolve_optional_user_phone(
                        request.userPhone or default_user_phone
                    ),
                    'inquiry': self._normalize_inquiry(request.inquiry),
                },
                'action': {
                    'name': 'TOUR_APPLY',
                    'path': '/ai/tour/workflow/apply',
                    'target': 'spring_tour_api',
                    'status': 'failed',
                },
                'result': {},
                'errorCode': 'TOUR_APPLY_FAILED',
                'requiresConfirm': False,
                'sessionId': request.sessionId,
                'clientRequestId': request.clientRequestId,
                'raw': {'error': str(exc)},
            }

    def _resolve_visit_schedule(
        self,
        *,
        visit_date: str | None,
        visit_time: str | None,
        preferred_visit_at: str | None,
    ) -> tuple[str, str]:
        if preferred_visit_at and preferred_visit_at.strip():
            compact = preferred_visit_at.strip()
            for fmt in ('%Y-%m-%d %H:%M', '%Y-%m-%d %H:%M:%S', '%Y.%m.%d %H:%M', '%Y/%m/%d %H:%M'):
                try:
                    parsed = datetime.strptime(compact, fmt)
                    return parsed.strftime('%Y-%m-%d'), parsed.strftime('%H:%M:%S')
                except ValueError:
                    continue
            raise ValueError('날짜와 시간 형식이 올바르지 않습니다. 예: 2026-03-20 15:00')

        return self._normalize_visit_date(visit_date or ''), self._normalize_visit_time(visit_time or '')

    def _normalize_visit_time(self, value: str) -> str:
        compact = (value or '').strip()
        if not compact:
            raise ValueError('visitTime 값이 필요합니다.')
        if re.fullmatch(r'\d{1,2}', compact):
            compact = compact.zfill(2) + ':00'
        if len(compact) == 5:
            compact = compact + ':00'
        if not re.fullmatch(r'\d{2}:\d{2}(:\d{2})?', compact):
            raise ValueError('visitTime 형식이 올바르지 않습니다. 예: 14:00')
        return compact

    def _normalize_visit_date(self, value: str) -> str:
        compact = (value or '').strip()
        if not compact:
            raise ValueError('visitDate 값이 필요합니다.')
        for fmt in ('%Y-%m-%d', '%Y.%m.%d', '%Y/%m/%d'):
            try:
                return datetime.strptime(compact, fmt).strftime('%Y-%m-%d')
            except ValueError:
                continue
        raise ValueError('visitDate 형식이 올바르지 않습니다. 예: 2026-03-20')

    def _normalize_user_name(self, value: str) -> str:
        compact = (value or '').strip()
        if not compact:
            raise ValueError('userName 값이 필요합니다.')
        return compact

    def _resolve_optional_user_name(self, value: str | None) -> str:
        return (value or '').strip()

    def _normalize_user_phone(self, value: str) -> str:
        compact = re.sub(r'[^0-9]', '', value or '')
        if len(compact) not in (10, 11):
            raise ValueError('userPhone 값이 올바르지 않습니다. 숫자 10~11자리를 입력해 주세요.')
        if len(compact) == 10:
            return f'{compact[:3]}-{compact[3:6]}-{compact[6:]}'
        return f'{compact[:3]}-{compact[3:7]}-{compact[7:]}'

    def _resolve_optional_user_phone(self, value: str | None) -> str:
        compact = (value or '').strip()
        if not compact:
            return ''
        return self._normalize_user_phone(compact)

    def _normalize_inquiry(self, value: str | None) -> str:
        compact = (value or '').strip()
        return compact or '없음'

    def _build_message(self, request: TourApplyReq) -> str:
        inquiry = self._normalize_inquiry(request.inquiry)
        if inquiry == '없음':
            inquiry = '추가 문의사항 없음'
        name = (request.userName or '').strip()
        phone = (request.userPhone or '').strip()
        lines: list[str] = []
        if name:
            lines.append(f'신청자명: {self._normalize_user_name(name)}')
        if phone:
            lines.append(f'연락처: {self._normalize_user_phone(phone)}')
        if not lines:
            lines.append('신청자 정보: 서버에서 확인 예정')
        lines.append(f'문의사항: {inquiry}')
        return '\n'.join(lines)
