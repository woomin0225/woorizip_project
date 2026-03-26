# app/services/reservation_service.py
from __future__ import annotations
from datetime import datetime, timedelta
from typing import Any
from app.clients.spring_facility_client import SpringFacilityClient
from app.clients.groq_llm_client import GroqLLMClient
from app.services import reservation_preprocessor as pre


class ReservationService:
    def __init__(self, llm: GroqLLMClient):
        self.llm = llm
        self.tools = SpringFacilityClient()

    async def analyze_reservation(
        self, user_text: str, session: dict[str, Any]
    ) -> dict[str, Any]:
        email_id = session.get("user_id")

        db_data = await self.tools.get_facilities(
            user_id=email_id, house_no=session.get("house_no")
        )

        user_name = db_data.get("userName")
        user_phone = db_data.get("userPhone")
        user_type = db_data.get("userType")
        my_facilities = db_data.get("facilities", [])

        if user_type == "LESSOR":
            if db_data.get("type") == "HOUSE_LIST":
                return {
                    "status": "NEED_HOUSE_SELECT",
                    "message": "현황을 보실 건물을 선택해 주세요.",
                    "houses": db_data.get("data", []),
                }

            target_f_no = session.get("facility_no")
            for item in my_facilities:
                if any(
                    kw in user_text
                    for kw in item.get("facilityName", "").replace("/", " ").split()
                ):
                    target_f_no = item.get("facilityNo")
                    break

            if not target_f_no and my_facilities:
                target_f_no = my_facilities[0].get("facilityNo")

            if target_f_no:
                analysis_result = await self.analyze_abuse_patterns(target_f_no)
                summary_res = await self.llm.chat(
                    [
                        {
                            "role": "user",
                            "content": f"분석 결과 요약해줘: {analysis_result}",
                        }
                    ]
                )
                return {
                    "status": "SUCCESS_STATS",
                    "message": summary_res,
                    "data": analysis_result,
                    "extracted_fields": {"facility_no": target_f_no},
                }

        extracted_f_no = session.get("facility_no")
        extracted_f_name = session.get("facility_name")
        for item in my_facilities:
            if item.get("facilityNo") == extracted_f_no and not extracted_f_name:
                extracted_f_name = item.get("facilityName")
            if any(
                kw in user_text
                for kw in item.get("facilityName", "").replace("/", " ").split()
            ):
                extracted_f_no = item.get("facilityNo")
                extracted_f_name = item.get("facilityName")
                break

        if not extracted_f_no:
            return {
                "status": "NEED_FACILITY",
                "message": "어떤 시설을 예약하고 싶으신지 다시 말씀해 주세요.",
            }

        facility_detail = await self.tools.get_facility_detail(facility_no=extracted_f_no)
        has_existing_schedule = any(
            str(session.get(key) or "").strip()
            for key in ("date", "start_time", "end_time")
        )
        has_schedule_signal = has_existing_schedule or self._looks_like_schedule_input(
            user_text
        )

        if not has_schedule_signal:
            return {
                "status": "NEED_SCHEDULE",
                "message": (
                    "예약 날짜와 시간을 알려주세요. "
                    "예를 들면 내일 오후 7시처럼 말씀해 주시면 됩니다."
                ),
                "extracted_fields": {
                    "facility_no": extracted_f_no,
                    "facility_name": extracted_f_name,
                },
                "user_info": {"name": user_name, "phone": user_phone},
            }

        date_data = self._extract_schedule_locally(
            user_text=user_text,
            session=session,
            facility_detail=facility_detail,
        )
        if not self._has_complete_schedule(date_data):
            llm_schedule = await self._extract_schedule_with_llm(
                user_text=user_text,
                session=session,
                facility_detail=facility_detail,
            )
            date_data = self._merge_schedule(date_data, llm_schedule)

        message = self._build_schedule_message(date_data)

        if not self._has_complete_schedule(date_data):
            return {
                "status": "NEED_SCHEDULE",
                "message": message,
                "extracted_fields": {
                    "facility_no": extracted_f_no,
                    "facility_name": extracted_f_name,
                },
                "user_info": {"name": user_name, "phone": user_phone},
            }

        availability = await self._check_schedule_availability(
            facility_no=extracted_f_no,
            facility_detail=facility_detail,
            schedule=date_data,
        )

        return {
            "status": "ANALYZE_COMPLETED",
            "extracted_fields": {
                "facility_no": extracted_f_no,
                "facility_name": extracted_f_name,
                "date": date_data.get("date"),
                "start_time": date_data.get("start_time"),
                "end_time": date_data.get("end_time"),
            },
            "user_info": {"name": user_name, "phone": user_phone},
            "is_available": availability["is_available"],
            "message": availability["message"],
        }

    async def analyze_abuse_patterns(self, facility_no: str) -> list[dict[str, Any]]:
        data = await self.tools.get_stats_data(facility_no)
        return data if isinstance(data, list) else []

    def _has_complete_schedule(self, date_data: Any) -> bool:
        if not isinstance(date_data, dict):
            return False
        return bool(
            str(date_data.get("date") or "").strip()
            and str(date_data.get("start_time") or "").strip()
            and str(date_data.get("end_time") or "").strip()
        )

    def _merge_schedule(
        self,
        base: dict[str, Any] | None,
        override: dict[str, Any] | None,
    ) -> dict[str, Any]:
        merged = {
            "date": "",
            "start_time": "",
            "end_time": "",
        }
        for source in (base or {}, override or {}):
            for key in merged:
                value = str(source.get(key) or "").strip()
                if value:
                    merged[key] = value
        return merged

    def _looks_like_schedule_input(self, user_text: str) -> bool:
        text = str(user_text or "").strip()
        if not text:
            return False
        return any(
            token in text
            for token in (
                "오늘",
                "내일",
                "모레",
                "글피",
                "다음",
                "이번 주",
                "주말",
                "월요일",
                "화요일",
                "수요일",
                "목요일",
                "금요일",
                "토요일",
                "일요일",
                "오전",
                "오후",
                "저녁",
                "아침",
                "밤",
                "부터",
                "까지",
                "시",
                "분",
            )
        )

    def _contains_explicit_date(self, user_text: str) -> bool:
        text = str(user_text or "").strip()
        if not text:
            return False
        return any(
            token in text
            for token in (
                "오늘",
                "내일",
                "모레",
                "글피",
                "다음",
                "이번 주",
                "주말",
                "월요일",
                "화요일",
                "수요일",
                "목요일",
                "금요일",
                "토요일",
                "일요일",
                "년",
                "월",
                "일",
                "-",
                "/",
            )
        )

    def _extract_schedule_locally(
        self,
        *,
        user_text: str,
        session: dict[str, Any],
        facility_detail: dict[str, Any],
    ) -> dict[str, str]:
        if not self._looks_like_schedule_input(user_text):
            return {}

        parsed = pre.parse_time(user_text, base=datetime.now())
        if not parsed:
            return {}

        session_date = str(session.get("date") or "").strip()
        if session_date and not self._contains_explicit_date(user_text):
            date_text = session_date
        else:
            date_text = parsed.strftime("%Y-%m-%d")

        duration_minutes = self._default_duration_minutes(
            user_text=user_text,
            facility_detail=facility_detail,
        )
        end_dt = parsed + timedelta(minutes=duration_minutes)

        return {
            "date": date_text,
            "start_time": parsed.strftime("%H:%M"),
            "end_time": end_dt.strftime("%H:%M"),
        }

    async def _extract_schedule_with_llm(
        self,
        *,
        user_text: str,
        session: dict[str, Any],
        facility_detail: dict[str, Any],
    ) -> dict[str, str]:
        now = datetime.now()
        unit_minutes = self._to_positive_int(
            facility_detail.get("facilityRsvnUnitMinutes"),
            fallback=30,
        )
        max_duration = self._to_positive_int(
            facility_detail.get("facilityMaxDurationMinutes"),
            fallback=120,
        )
        prompt = (
            f"현재 시각: {now.strftime('%Y-%m-%d %H:%M')}\n"
            f"사용자 요청: {user_text}\n"
            f"기존 선택 날짜: {session.get('date') or ''}\n"
            f"기존 선택 시작 시간: {session.get('start_time') or ''}\n"
            f"예약 단위: {unit_minutes}분\n"
            f"최대 예약 시간: {max_duration}분\n"
            "한국어 예약 요청에서 날짜와 시간을 추출해 주세요.\n"
            "반드시 JSON만 출력하고, 알 수 없는 값은 빈 문자열로 두세요.\n"
            "종료 시간이 직접 언급되지 않으면 기본 60분을 사용하되 예약 단위에 맞게 조정하세요.\n"
            '형식: {"date":"YYYY-MM-DD","start_time":"HH:MM","end_time":"HH:MM"}'
        )

        raw = await self.llm.chat([{"role": "user", "content": prompt}])
        parsed = pre.parse_llm_json(raw)
        if not isinstance(parsed, dict):
            return {}
        return {
            "date": str(parsed.get("date") or "").strip(),
            "start_time": self._normalize_time_text(parsed.get("start_time")),
            "end_time": self._normalize_time_text(parsed.get("end_time")),
        }

    def _default_duration_minutes(
        self,
        *,
        user_text: str,
        facility_detail: dict[str, Any],
    ) -> int:
        requested = pre.extract_duration_regex(user_text)
        unit_minutes = self._to_positive_int(
            facility_detail.get("facilityRsvnUnitMinutes"),
            fallback=30,
        )
        max_duration = self._to_positive_int(
            facility_detail.get("facilityMaxDurationMinutes"),
            fallback=120,
        )
        duration = max(requested, unit_minutes)
        if duration % unit_minutes != 0:
            duration = ((duration + unit_minutes - 1) // unit_minutes) * unit_minutes
        return min(duration, max_duration)

    async def _check_schedule_availability(
        self,
        *,
        facility_no: str,
        facility_detail: dict[str, Any],
        schedule: dict[str, str],
    ) -> dict[str, Any]:
        facility_name = str(facility_detail.get("facilityName") or "해당 시설").strip()
        date_text = str(schedule.get("date") or "").strip()
        start_text = self._normalize_time_text(schedule.get("start_time"))
        end_text = self._normalize_time_text(schedule.get("end_time"))

        start_dt = self._parse_schedule_datetime(date_text, start_text)
        end_dt = self._parse_schedule_datetime(date_text, end_text)
        if not start_dt or not end_dt:
            return {
                "is_available": False,
                "message": "예약 날짜와 시간을 다시 말씀해 주세요. 예를 들면 내일 오후 7시처럼 말씀해 주시면 됩니다.",
            }

        if end_dt <= start_dt:
            return {
                "is_available": False,
                "message": "예약 종료 시간은 시작 시간보다 늦어야 해요. 다시 말씀해 주세요.",
            }

        if start_dt < datetime.now():
            return {
                "is_available": False,
                "message": "현재 시각 이전 시간대로는 예약할 수 없어요. 다른 시간을 말씀해 주세요.",
            }

        open_text = self._normalize_time_text(facility_detail.get("facilityOpenTime"))
        close_text = self._normalize_time_text(facility_detail.get("facilityCloseTime"))
        open_dt = self._parse_schedule_datetime(date_text, open_text)
        close_dt = self._parse_schedule_datetime(date_text, close_text)

        if open_dt and start_dt < open_dt:
            return {
                "is_available": False,
                "message": (
                    f"{facility_name}은 {open_text}부터 이용할 수 있어요. "
                    "운영 시간 안에서 다시 말씀해 주세요."
                ),
            }

        if close_dt and end_dt > close_dt:
            return {
                "is_available": False,
                "message": (
                    f"{facility_name}은 {close_text}까지 이용할 수 있어요. "
                    "운영 시간 안에서 다시 말씀해 주세요."
                ),
            }

        duration_minutes = int((end_dt - start_dt).total_seconds() // 60)
        unit_minutes = self._to_positive_int(
            facility_detail.get("facilityRsvnUnitMinutes"),
            fallback=30,
        )
        max_duration = self._to_positive_int(
            facility_detail.get("facilityMaxDurationMinutes"),
            fallback=120,
        )

        if start_dt.minute % unit_minutes != 0 or duration_minutes % unit_minutes != 0:
            return {
                "is_available": False,
                "message": (
                    f"{facility_name}은 {unit_minutes}분 단위로 예약할 수 있어요. "
                    "시간을 다시 말씀해 주세요."
                ),
            }

        if duration_minutes > max_duration:
            return {
                "is_available": False,
                "message": (
                    f"{facility_name}은 최대 {max_duration}분까지 예약할 수 있어요. "
                    "예약 시간을 줄여서 다시 말씀해 주세요."
                ),
            }

        reserved_list = await self.tools.check_availability(
            facility_no=facility_no,
            date=date_text,
        )
        for reservation in reserved_list if isinstance(reserved_list, list) else []:
            status = str(reservation.get("reservationStatus") or "").upper()
            if status not in {"APPROVED", "BLOCKED"}:
                continue

            reserved_start = self._parse_schedule_datetime(
                date_text,
                reservation.get("reservationStartTime"),
            )
            reserved_end = self._parse_schedule_datetime(
                date_text,
                reservation.get("reservationEndTime"),
            )
            if not reserved_start or not reserved_end:
                continue

            if start_dt < reserved_end and end_dt > reserved_start:
                return {
                    "is_available": False,
                    "message": (
                        f"{facility_name}은 {date_text} {start_text}부터 {end_text}까지 "
                        "이미 예약이 있어요. 다른 시간을 말씀해 주세요."
                    ),
                }

        return {
            "is_available": True,
            "message": (
                f"{facility_name}을 {date_text} {start_text}부터 {end_text}까지 예약할 수 있어요. "
                "이 일정으로 진행할까요?"
            ),
        }

    def _parse_schedule_datetime(self, date_text: str, time_text: Any) -> datetime | None:
        normalized_time = self._normalize_time_text(time_text)
        if not date_text or not normalized_time:
            return None
        try:
            return datetime.strptime(f"{date_text} {normalized_time}", "%Y-%m-%d %H:%M")
        except ValueError:
            return None

    def _normalize_time_text(self, value: Any) -> str:
        text = str(value or "").strip()
        if not text:
            return ""
        for fmt in ("%H:%M", "%H:%M:%S"):
            try:
                return datetime.strptime(text, fmt).strftime("%H:%M")
            except ValueError:
                continue
        return ""

    def _to_positive_int(self, value: Any, fallback: int) -> int:
        try:
            parsed = int(value)
            return parsed if parsed > 0 else fallback
        except (TypeError, ValueError):
            return fallback

    def _build_schedule_message(self, date_data: Any) -> str:
        if not isinstance(date_data, dict):
            return "예약 날짜와 시간을 다시 말씀해 주세요. 예를 들면 내일 오후 7시처럼 말씀해 주시면 됩니다."

        suggestion_message = str(date_data.get("suggestion_message") or "").strip()
        if suggestion_message:
            return suggestion_message

        date = str(date_data.get("date") or "").strip()
        start_time = self._normalize_time_text(date_data.get("start_time"))
        end_time = self._normalize_time_text(date_data.get("end_time"))
        is_available = bool(date_data.get("is_available"))

        if date and start_time and end_time and is_available:
            return (
                f"{date} {start_time}부터 {end_time}까지 예약 가능해 보여요. "
                "이 일정으로 진행할지 확인해 주세요."
            )

        if date or start_time or end_time:
            return (
                "예약 시간을 일부만 이해했어요. 날짜와 시작 시간, 종료 시간을 함께 다시 말씀해 주세요."
            )

        return "예약 날짜와 시간을 다시 말씀해 주세요. 예를 들면 내일 오후 7시처럼 말씀해 주시면 됩니다."
