from __future__ import annotations

from datetime import datetime
import json
import logging
import re

from app.clients.spring_tour_client import SpringTourClient
from app.schemas import TourApplyReq, TourWorkflowApplyReq


logger = logging.getLogger(__name__)


class TourService:
    ALLOWED_TOUR_TIMES = {
        '14:00:00',
        '15:00:00',
        '16:00:00',
        '17:00:00',
        '18:00:00',
        '19:00:00',
    }

    def __init__(self, client: SpringTourClient):
        self.client = client

    async def apply(
        self,
        request: TourApplyReq,
        *,
        access_token: str | None = None,
        user_id: str | None = None,
    ) -> dict:
        normalized_request = TourApplyReq(
            roomNo=self._normalize_room_no(request.roomNo),
            visitDate=self._normalize_visit_date(request.visitDate),
            visitTime=self._normalize_visit_time(request.visitTime),
            userName=self._resolve_optional_user_name(request.userName),
            userPhone=self._resolve_optional_user_phone(request.userPhone),
            inquiry=self._normalize_inquiry(request.inquiry),
        )

        message = self._build_message(normalized_request)
        payload = {
            'visitDate': normalized_request.visitDate,
            'visitTime': self._normalize_visit_time(normalized_request.visitTime),
            'message': message,
            'userName': normalized_request.userName,
            'userPhone': normalized_request.userPhone,
        }

        # CODEX-AZURE-TRACE-START
        logger.info(
            "TOUR_SPRING_APPLY_REQUEST roomNo=%s visitDate=%s visitTime=%s accessTokenPresent=%s",
            normalized_request.roomNo,
            normalized_request.visitDate,
            payload['visitTime'],
            bool(access_token),
        )
        # CODEX-AZURE-TRACE-END

        spring_response = await self.client.apply_tour(
            room_no=normalized_request.roomNo,
            payload=payload,
            access_token=access_token,
            user_id=user_id,
        )

        # CODEX-AZURE-TRACE-START
        logger.info(
            "TOUR_SPRING_APPLY_RESPONSE roomNo=%s response=%s",
            normalized_request.roomNo,
            spring_response,
        )
        # CODEX-AZURE-TRACE-END

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
        default_user_id: str | None = None,
        default_user_name: str | None = None,
        default_user_phone: str | None = None,
    ) -> dict:
        try:
            # CODEX-AZURE-TRACE-START
            logger.info(
                "TOUR_WORKFLOW_APPLY_SERVICE_START sessionId=%s roomNo=%s roomName=%s preferredVisitAt=%s visitDate=%s visitTime=%s",
                request.sessionId,
                request.roomNo,
                request.roomName,
                request.preferredVisitAt,
                request.visitDate,
                request.visitTime,
            )
            # CODEX-AZURE-TRACE-END
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
            normalized_room_no = self._normalize_room_no(request.roomNo)
            # CODEX-AZURE-TRACE-START
            logger.info(
                "TOUR_WORKFLOW_APPLY_SERVICE_RESOLVED sessionId=%s roomNo=%s visitDate=%s visitTime=%s userIdPresent=%s userNamePresent=%s userPhonePresent=%s",
                request.sessionId,
                normalized_room_no,
                visit_date,
                visit_time,
                bool((default_user_id or '').strip()),
                bool(resolved_user_name),
                bool(resolved_user_phone),
            )
            # CODEX-AZURE-TRACE-END
            if self._is_current_room_placeholder(normalized_room_no):
                return {
                    'schemaVersion': request.schemaVersion,
                    'reply': (
                        "투어 신청을 계속하려면 신청자 정보 확인이 필요합니다.\n"
                        "로그인 상태를 확인한 뒤 다시 시도해 주세요."
                    ),
                    'intent': 'TOUR_APPLY',
                    'slots': {
                        'roomNo': (request.roomNo or '').strip(),
                        'roomName': (request.roomName or '').strip(),
                        'visitDate': visit_date,
                        'visitTime': visit_time,
                        'preferredVisitAt': (request.preferredVisitAt or '').strip(),
                        'userName': resolved_user_name,
                        'userPhone': resolved_user_phone,
                        'inquiry': self._normalize_inquiry(request.inquiry),
                    },
                    'action': {
                        'name': 'TOUR_APPLY',
                        'path': '/ai/tour/workflow/apply',
                        'target': 'spring_tour_api',
                        'status': 'missing_user_profile',
                    },
                    'result': {},
                    'errorCode': 'TOUR_APPLY_MISSING_USER_PROFILE',
                    'requiresConfirm': False,
                    'sessionId': request.sessionId,
                    'clientRequestId': request.clientRequestId,
                    'raw': {'error': '사용자 이름 또는 전화번호가 필요합니다.'},
                }
            apply_result = await self.apply(
                TourApplyReq(
                    roomNo=normalized_room_no,
                    visitDate=visit_date,
                    visitTime=visit_time,
                    userName=resolved_user_name,
                    userPhone=resolved_user_phone,
                    inquiry=request.inquiry,
                ),
                access_token=None,
                user_id=(default_user_id or '').strip() or None,
            )
            room_name = (request.roomName or '').strip()
            room_label = room_name or '현재 보고 계신 방'
            reply = (
                f"{room_label} 투어 신청이 완료되었습니다. "
                f"방문 일정은 {apply_result['visitDate']} {apply_result['visitTime']}입니다. "
                "추후 문자로 추가 안내 드리겠습니다."
            )
            return {
                'schemaVersion': request.schemaVersion,
                'reply': reply,
                'intent': 'TOUR_APPLY',
                'slots': {
                    'roomNo': apply_result['roomNo'],
                    'visitDate': apply_result['visitDate'],
                    'visitTime': apply_result['visitTime'],
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
            # CODEX-AZURE-TRACE-START
            logger.exception(
                "TOUR_WORKFLOW_APPLY_SERVICE_ERROR sessionId=%s roomNo=%s error=%s",
                request.sessionId,
                request.roomNo,
                exc,
            )
            # CODEX-AZURE-TRACE-END
            error_message = str(exc)
            if 'TOUR_UNAVAILABLE_TIME' in error_message:
                return {
                    'schemaVersion': request.schemaVersion,
                    'reply': (
                        "해당 시간은 투어 가능한 시간이 아닙니다.\n"
                        "투어 가능 시간은 14시 ~ 19시 사이 정각입니다.\n"
                    ),
                    'intent': 'TOUR_APPLY',
                    'slots': {
                        'roomNo': (request.roomNo or '').strip(),
                        'roomName': (request.roomName or '').strip(),
                    },
                    'action': {
                        'name': 'TOUR_APPLY',
                        'path': '/ai/tour/workflow/apply',
                        'target': 'spring_tour_api',
                        'status': 'rejected',
                    },
                    'result': {
                        'availableTimes': sorted(self.ALLOWED_TOUR_TIMES),
                    },
                    'errorCode': 'TOUR_APPLY_UNAVAILABLE_TIME',
                    'requiresConfirm': False,
                    'sessionId': request.sessionId,
                    'clientRequestId': request.clientRequestId,
                    'raw': {'error': error_message},
                }
            if self._is_schedule_error(error_message):
                return {
                    'schemaVersion': request.schemaVersion,
                    'reply': (
                        "방문 날짜와 시간을 다시 확인해 주세요.\n"
                        "투어 가능 시간은 14시 ~ 19시 사이 정각입니다.\n"
                        "예: 5월 13일 오후 5시"
                    ),
                    'intent': 'TOUR_APPLY',
                    'slots': {
                        'roomNo': (request.roomNo or '').strip(),
                        'roomName': (request.roomName or '').strip(),
                        'visitDate': (request.visitDate or '').strip(),
                        'visitTime': (request.visitTime or '').strip(),
                        'preferredVisitAt': (request.preferredVisitAt or '').strip(),
                    },
                    'action': {
                        'name': 'TOUR_APPLY',
                        'path': '/ai/tour/workflow/apply',
                        'target': 'spring_tour_api',
                        'status': 'retry',
                    },
                    'result': {},
                    'errorCode': 'TOUR_APPLY_INVALID_SCHEDULE',
                    'requiresConfirm': False,
                    'sessionId': request.sessionId,
                    'clientRequestId': request.clientRequestId,
                    'raw': {'error': error_message},
                }
            if self._is_auth_error(error_message):
                return {
                    'schemaVersion': request.schemaVersion,
                    'reply': (
                        "투어 신청을 진행하려면 로그인 상태를 먼저 확인해 주세요.\n"
                        "로그인 후 같은 방에서 다시 신청해 주시면 바로 도와드릴게요."
                    ),
                    'intent': 'TOUR_APPLY',
                    'slots': {
                        'roomNo': (request.roomNo or '').strip(),
                        'roomName': (request.roomName or '').strip(),
                        'visitDate': (request.visitDate or '').strip(),
                        'visitTime': (request.visitTime or '').strip(),
                        'preferredVisitAt': (request.preferredVisitAt or '').strip(),
                    },
                    'action': {
                        'name': 'TOUR_APPLY',
                        'path': '/ai/tour/workflow/apply',
                        'target': 'spring_tour_api',
                        'status': 'rejected',
                    },
                    'result': {},
                    'errorCode': 'TOUR_APPLY_AUTH_REQUIRED',
                    'requiresConfirm': False,
                    'sessionId': request.sessionId,
                    'clientRequestId': request.clientRequestId,
                    'raw': {'error': error_message},
                }
            spring_message = self._extract_spring_error_message(error_message)
            if spring_message:
                return {
                    'schemaVersion': request.schemaVersion,
                    'reply': (
                        f"투어 신청을 완료하지 못했어요.\n"
                        f"{spring_message}"
                    ),
                    'intent': 'TOUR_APPLY',
                    'slots': {
                        'roomNo': (request.roomNo or '').strip(),
                        'roomName': (request.roomName or '').strip(),
                        'visitDate': (request.visitDate or '').strip(),
                        'visitTime': (request.visitTime or '').strip(),
                        'preferredVisitAt': (request.preferredVisitAt or '').strip(),
                    },
                    'action': {
                        'name': 'TOUR_APPLY',
                        'path': '/ai/tour/workflow/apply',
                        'target': 'spring_tour_api',
                        'status': 'failed',
                    },
                    'result': {},
                    'errorCode': 'TOUR_APPLY_REJECTED',
                    'requiresConfirm': False,
                    'sessionId': request.sessionId,
                    'clientRequestId': request.clientRequestId,
                    'raw': {'error': error_message},
                }
            return {
                'schemaVersion': request.schemaVersion,
                'reply': (
                    "투어 신청 처리 중 문제가 발생했습니다.\n"
                    "입력하신 일정은 확인했지만 신청을 완료하지 못했어요.\n"
                    "잠시 후 다시 시도해 주세요."
                ),
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

    def _is_schedule_error(self, error_message: str) -> bool:
        lowered = (error_message or '').lower()
        schedule_keywords = (
            '날짜와 시간 형식이 올바르지 않습니다',
            '방문시간 형식이 올바르지 않습니다',
            '방문시간 값이 필요합니다',
            '방문일자 값이 필요합니다',
            '방문일자 형식이 올바르지 않습니다',
            'tour_unavailable_time',
        )
        return any(keyword in lowered for keyword in map(str.lower, schedule_keywords))

    def _is_auth_error(self, error_message: str) -> bool:
        lowered = (error_message or '').lower()
        return 'status=401' in lowered or 'status=403' in lowered

    def _extract_spring_error_message(self, error_message: str) -> str:
        compact = (error_message or '').strip()
        if not compact:
            return ''
        body_marker = 'body='
        marker_index = compact.find(body_marker)
        if marker_index < 0:
            return ''
        body_text = compact[marker_index + len(body_marker):].strip()
        if not body_text:
            return ''
        try:
            parsed = json.loads(body_text)
        except json.JSONDecodeError:
            return ''
        if not isinstance(parsed, dict):
            return ''
        message = parsed.get('message')
        if isinstance(message, str) and message.strip():
            return message.strip()
        return ''

    def _resolve_visit_schedule(
        self,
        *,
        visit_date: str | None,
        visit_time: str | None,
        preferred_visit_at: str | None,
    ) -> tuple[str, str]:
        if preferred_visit_at and preferred_visit_at.strip():
            compact = preferred_visit_at.strip()
            for fmt in (
                '%Y-%m-%d %H:%M',
                '%Y-%m-%d %H:%M:%S',
                '%Y-%m-%dT%H:%M:%S',
                '%Y-%m-%dT%H:%M',
                '%Y.%m.%d %H:%M',
                '%Y/%m/%d %H:%M',
            ):
                try:
                    parsed = datetime.strptime(compact, fmt)
                    parsed = self._coerce_future_schedule_year(parsed)
                    return parsed.strftime('%Y-%m-%d'), self._validate_allowed_visit_time(
                        parsed.strftime('%H:%M:%S')
                    )
                except ValueError:
                    continue
            parsed = self._parse_simple_korean_schedule(compact)
            if parsed is not None:
                parsed = self._coerce_future_schedule_year(parsed)
                return parsed.strftime('%Y-%m-%d'), self._validate_allowed_visit_time(
                    parsed.strftime('%H:%M:%S')
                )
            parsed = self._parse_natural_korean_schedule(compact)
            if parsed is not None:
                parsed = self._coerce_future_schedule_year(parsed)
                return parsed.strftime('%Y-%m-%d'), self._validate_allowed_visit_time(
                    parsed.strftime('%H:%M:%S')
                )
            raise ValueError('날짜와 시간 형식이 올바르지 않습니다. 예: 2026-03-20 15:00')

        return (
            self._normalize_visit_date(visit_date or ''),
            self._validate_allowed_visit_time(
                self._normalize_visit_time(visit_time or '')
            ),
        )

    def looks_like_schedule_input(self, value: str | None) -> bool:
        text = (value or '').strip()
        if not text:
            return False
        if self.extract_schedule_parts(text)["visitDate"] or self.extract_schedule_parts(text)["visitTime"]:
            return True
        if self._parse_natural_korean_schedule(text) is not None:
            return True
        return bool(
            re.search(r'\d{4}[-./]\d{1,2}[-./]\d{1,2}\s+\d{1,2}:\d{2}', text)
        )

    def looks_like_partial_schedule_input(self, value: str | None) -> bool:
        text = (value or '').strip()
        if not text:
            return False
        parts = self.extract_schedule_parts(text)
        has_date = bool(parts["visitDate"])
        has_time = bool(parts["visitTime"])
        return has_date ^ has_time

    def looks_like_date_only_input(self, value: str | None) -> bool:
        text = (value or '').strip()
        if not text:
            return False
        parts = self.extract_schedule_parts(text)
        return bool(parts["visitDate"]) and not bool(parts["visitTime"])

    def looks_like_time_only_input(self, value: str | None) -> bool:
        text = (value or '').strip()
        if not text:
            return False
        parts = self.extract_schedule_parts(text)
        return bool(parts["visitTime"]) and not bool(parts["visitDate"])

    def merge_schedule_input(
        self,
        *,
        existing_visit_date: str | None = None,
        existing_visit_time: str | None = None,
        user_input: str | None = None,
    ) -> dict[str, str]:
        next_visit_date = (existing_visit_date or '').strip()
        next_visit_time = (existing_visit_time or '').strip()
        text = (user_input or '').strip()
        if not text:
            return {
                'visitDate': next_visit_date,
                'visitTime': next_visit_time,
                'preferredVisitAt': self._combine_schedule_parts(next_visit_date, next_visit_time),
            }

        parsed_schedule = self._parse_natural_korean_schedule(text)
        if parsed_schedule is not None:
            next_visit_date = parsed_schedule.strftime('%Y-%m-%d')
            next_visit_time = parsed_schedule.strftime('%H:%M:%S')
        else:
            extracted = self.extract_schedule_parts(text)
            if extracted['visitDate']:
                next_visit_date = extracted['visitDate']
            if extracted['visitTime']:
                next_visit_time = extracted['visitTime']

        return {
            'visitDate': next_visit_date,
            'visitTime': next_visit_time,
            'preferredVisitAt': self._combine_schedule_parts(next_visit_date, next_visit_time),
        }

    def extract_schedule_parts(self, value: str | None) -> dict[str, str]:
        text = (value or '').strip()
        if not text:
            return {'visitDate': '', 'visitTime': ''}

        visit_date = ''
        visit_time = ''

        date_match = re.search(
            r'(?:(?P<year>\d{4})\s*년\s*)?'
            r'(?P<month>\d{1,2})\s*(?:월|/|\.)\s*'
            r'(?P<day>\d{1,2})\s*(?:일)?',
            text,
        )
        if date_match:
            year = date_match.group('year') or str(datetime.now().year)
            visit_date = self._normalize_visit_date(
                f"{year}-{date_match.group('month')}-{date_match.group('day')}"
            )

        # Only parse time when the input includes an actual time marker.
        # This prevents date-only inputs like '3월 28일' from becoming '15:00'.
        time_match = re.search(
            r'(?:(?P<ampm>오전|오후|am|pm)\s*)?'
            r'(?P<hour>\d{1,2})'
            r'(?:'
            r'\s*:\s*(?P<minute_colon>\d{1,2})'
            r'|'
            r'\s*시(?:\s*(?P<minute_korean>\d{1,2})\s*분?)?'
            r')',
            text,
            re.IGNORECASE,
        )
        if time_match:
            raw_hour = int(time_match.group('hour'))
            raw_minute = int(
                time_match.group('minute_colon')
                or time_match.group('minute_korean')
                or 0
            )
            ampm = (time_match.group('ampm') or '').lower()

            if raw_hour <= 23 and raw_minute <= 59:
                if ampm in ('오후', 'pm') and raw_hour < 12:
                    raw_hour += 12
                elif ampm in ('오전', 'am') and raw_hour == 12:
                    raw_hour = 0
                elif not ampm and 1 <= raw_hour <= 7:
                    raw_hour += 12

                visit_time = self._normalize_visit_time(f'{raw_hour:02d}:{raw_minute:02d}')

        return {'visitDate': visit_date, 'visitTime': visit_time}

    def _combine_schedule_parts(self, visit_date: str, visit_time: str) -> str:
        if visit_date and visit_time:
            return f'{visit_date} {visit_time[:5]}'
        return ''

    def looks_like_phone_input(self, value: str | None) -> bool:
        compact = re.sub(r'[^0-9]', '', value or '')
        return len(compact) in (10, 11)

    def normalize_phone_input(self, value: str) -> str:
        return self._normalize_user_phone(value)

    def looks_like_name_input(self, value: str | None) -> bool:
        compact = (value or '').strip()
        return len(compact) >= 2

    def extract_name_and_phone_input(self, value: str | None) -> dict[str, str]:
        text = (value or '').strip()
        if not text:
            return {'userName': '', 'userPhone': ''}
        phone_match = re.search(r'(01[016789])[-\s]?(\d{3,4})[-\s]?(\d{4})', text)
        if not phone_match:
            return {'userName': '', 'userPhone': ''}
        raw_phone = ''.join(phone_match.groups())
        name_candidate = text[: phone_match.start()].strip()
        if not name_candidate:
            return {'userName': '', 'userPhone': ''}
        return {
            'userName': name_candidate,
            'userPhone': self._normalize_user_phone(raw_phone),
        }

    def _parse_natural_korean_schedule(self, value: str) -> datetime | None:
        compact = (value or '').strip()
        if not compact:
            return None

        match = re.search(
            r'(?:(?P<year>\d{4})\s*년\s*)?'
            r'(?P<month>\d{1,2})\s*(?:월|/|\.)\s*'
            r'(?P<day>\d{1,2})\s*(?:일)?\s*'
            r'(?:(?P<ampm>오전|오후|am|pm)\s*)?'
            r'(?P<hour>\d{1,2})\s*(?:시|:)\s*'
            r'(?:(?P<minute>\d{1,2})\s*분?)?',
            compact,
            re.IGNORECASE,
        )
        if not match:
            return None

        now = datetime.now()
        year = int(match.group('year') or now.year)
        month = int(match.group('month'))
        day = int(match.group('day'))
        hour = int(match.group('hour'))
        minute = int(match.group('minute') or 0)
        ampm = (match.group('ampm') or '').lower()

        if ampm in ('오후', 'pm') and hour < 12:
            hour += 12
        elif ampm in ('오전', 'am') and hour == 12:
            hour = 0
        elif not ampm and 1 <= hour <= 7:
            # 투어는 오후 슬롯으로 운영되므로 "5시" 같은 표현은 기본적으로 17시로 본다.
            hour += 12

        try:
            parsed = datetime(year, month, day, hour, minute)
        except ValueError:
            return None

        if not match.group('year') and parsed.date() < now.date():
            try:
                parsed = datetime(year + 1, month, day, hour, minute)
            except ValueError:
                return None

        return parsed

    def _parse_simple_korean_schedule(self, value: str) -> datetime | None:
        compact = (value or '').strip()
        if not compact:
            return None

        match = re.search(
            r'(?:(?P<year>\d{4})\s*년\s*)?'
            r'(?P<month>\d{1,2})\s*월\s*'
            r'(?P<day>\d{1,2})\s*일?\s*'
            r'(?:(?P<ampm>오전|오후|am|pm)\s*)?'
            r'(?P<hour>\d{1,2})\s*(?:시|:)\s*'
            r'(?:(?P<minute>\d{1,2})\s*(?:분)?)?',
            compact,
            re.IGNORECASE,
        )
        if not match:
            return None

        now = datetime.now()
        year = int(match.group('year') or now.year)
        month = int(match.group('month'))
        day = int(match.group('day'))
        hour = int(match.group('hour'))
        minute = int(match.group('minute') or 0)
        ampm = (match.group('ampm') or '').lower()

        if ampm in ('오후', 'pm') and hour < 12:
            hour += 12
        elif ampm in ('오전', 'am') and hour == 12:
            hour = 0
        elif not ampm and 1 <= hour <= 7:
            hour += 12

        try:
            parsed = datetime(year, month, day, hour, minute)
        except ValueError:
            return None

        if not match.group('year') and parsed.date() < now.date():
            try:
                parsed = datetime(year + 1, month, day, hour, minute)
            except ValueError:
                return None

        return parsed

    def _normalize_visit_time(self, value: str) -> str:
        compact = (value or '').strip()
        if not compact:
            raise ValueError('방문시간 값이 필요합니다.')
        if re.fullmatch(r'\d{1,2}', compact):
            compact = compact.zfill(2) + ':00'
        if len(compact) == 5:
            compact = compact + ':00'
        if not re.fullmatch(r'\d{2}:\d{2}(:\d{2})?', compact):
            raise ValueError('방문시간 형식이 올바르지 않습니다. 예: 14:00')
        return compact

    def _validate_allowed_visit_time(self, visit_time: str) -> str:
        normalized = self._normalize_visit_time(visit_time)
        if normalized not in self.ALLOWED_TOUR_TIMES:
            raise ValueError(
                f'TOUR_UNAVAILABLE_TIME: {normalized} 은(는) 투어 가능한 시간이 아닙니다.'
            )
        return normalized

    def _normalize_visit_date(self, value: str) -> str:
        compact = (value or '').strip()
        if not compact:
            raise ValueError('방문일자 값이 필요합니다.')
        for fmt in ('%Y-%m-%d', '%Y.%m.%d', '%Y/%m/%d'):
            try:
                return datetime.strptime(compact, fmt).strftime('%Y-%m-%d')
            except ValueError:
                continue
        raise ValueError('방문일자 형식이 올바르지 않습니다. 예: 2026-03-20')

    def _normalize_user_name(self, value: str) -> str:
        compact = (value or '').strip()
        if not compact:
            raise ValueError('사용자 이름 값이 필요합니다.')
        return compact

    def _normalize_room_no(self, value: str | None) -> str:
        compact = re.sub(r'\s+', '', str(value or '')).strip()
        if not compact:
            raise ValueError('roomNo is required')
        if self._is_current_room_placeholder(compact):
            return 'current'
        if compact.isdigit():
            return f'room{compact}'
        match = re.fullmatch(r'room[-_\s]?(\d+)', compact, re.IGNORECASE)
        if match:
            return f'room{match.group(1)}'
        return compact

    def _is_current_room_placeholder(self, value: str | None) -> bool:
        compact = re.sub(r'\s+', '', str(value or '')).strip().lower()
        return compact in {'current', 'currentroom', 'roomcurrent'}

    def _coerce_future_schedule_year(self, parsed: datetime) -> datetime:
        now = datetime.now()
        if parsed.year < now.year:
            try:
                parsed = parsed.replace(year=now.year)
            except ValueError:
                return parsed
            if parsed.date() < now.date():
                try:
                    parsed = parsed.replace(year=now.year + 1)
                except ValueError:
                    return parsed
        return parsed

    def _resolve_optional_user_name(self, value: str | None) -> str:
        return (value or '').strip()

    def _normalize_user_phone(self, value: str) -> str:
        compact = re.sub(r'[^0-9]', '', value or '')
        if len(compact) not in (10, 11):
            raise ValueError('전화번호 값이 올바르지 않습니다. 전화 번호를 입력해 주세요.')
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
