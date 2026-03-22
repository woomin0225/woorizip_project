from __future__ import annotations
import re
import requests
import json
from datetime import datetime, timedelta
from typing import Any

from app.core.config import settings
from app.schemas import ReservationAnalyzeReq
from app.clients.spring_facility_client import SpringFacilityClient
from app.clients.groq_llm_client import GroqLLMClient
from app.core import reservation_preprocessor as pre


class ReservationService:
    def __init__(self, llm: GroqLLMClient):
        self.llm = llm
        self.tools = SpringFacilityClient()
        self.base_url = settings.SPRING_BASE_URL
        self.sessions = {}

    def clear_session(self, user_id: str):
        """예약 완료 후 해당 유저의 세션 정보를 삭제"""
        if user_id in self.sessions:
            del self.sessions[user_id]
            print(f"[DEBUG] 세션 삭제 완료: {user_id}")

    async def save_reservation(self, req: ReservationAnalyzeReq) -> dict[str, Any]:
        """AI가 만든 예약 객체를 실제 Spring 서버 DB에 저장"""
        try:
            # req를 dict로 변환 (Pydantic 객체 -> JSON용 dict)
            save_data = req.dict()

            # datetime 객체들은 JSON 전송을 위해 문자열로 변환
            save_data["reservationDate"] = str(save_data["reservationDate"])
            save_data["reservationStartTime"] = str(save_data["reservationStartTime"])
            save_data["reservationEndTime"] = str(save_data["reservationEndTime"])

            # Spring 서버의 실제 예약 저장 API 주소 (환경설정에 따라 수정)
            target_url = f"{self.base_url}/api/reservation/save"

            response = requests.post(target_url, json=save_data)
            response.raise_for_status()  # 에러 나면 예외 발생

            return {"status": "success", "detail": response.json()}
        except Exception as e:
            print(f"[ERROR] 최종 저장 실패: {e}")
            return {"status": "error", "message": str(e)}

    async def analyze_reservation(
        self, user_text: str, ctx: dict[str, Any]
    ) -> dict[str, Any]:
        """자연어 분석 -> 예약 현황 확인 -> 결과 반환"""

        email_id = ctx.get("user_id")

        if email_id not in self.sessions:
            self.sessions[email_id] = {
                "date": None,
                "start_time": None,
                "end_time": None,
                "facility_no": None,
            }
        session = self.sessions[email_id]

        db_data = await self.tools.get_facilities(user_id=email_id)

        user_name = db_data.get("userName")
        user_phone = db_data.get("userPhone")
        my_facilities = db_data.get("facilities")

        # 시설 찾기
        facility_no = None
        facility_name_found = "알 수 없음"

        for item in my_facilities:
            f_no = item.get("facilityNo")
            f_name = item.get("facilityName", "")
            keywords = f_name.replace("/", " ").split()

            match = any(kw in user_text for kw in keywords)

            if match:
                facility_no = f_no
                facility_name_found = f_name
                break

        # 시설을 아예 못 찾았을 때
        if not facility_no:
            return {
                "message": "어떤 시설을 예약하고 싶으신지 잘 모르겠어요. 시설 이름을 다시 말씀해 주시겠어요?"
            }

        # 날짜 및 시간 추출 (LLM)
        now = datetime.now()
        time_extract_prompt = f"""
        사용자 요청: "{user_text}"
        현재 시각: {now.strftime('%Y-%m-%d %H:%M')}

        지시사항:
        1. 상대적인 날짜를 계산해서 YYYY-MM-DD 형식으로 추출하라.
        2. 오직 JSON 형식으로만 응답하라. 설명이나 파이썬 코드를 절대 포함하지 마라.
        3. 응답 예시: {{"date": "2026-03-21"}}
        """

        try:
            time_res = await self.llm.chat(
                [{"role": "user", "content": time_extract_prompt}]
            )
            date_data = pre.parse_llm_json(time_res)

            if isinstance(date_data, dict):
                # 세션 데이터 업데이트
                for key in ["date", "start_time", "end_time"]:
                    if date_data.get(key):
                        session[key] = date_data.get(key)

            # 무조건 세션에 있는 값을 최우선으로 사용
            target_date = session.get("date") or now.strftime("%Y-%m-%d")

        except Exception as e:
            print(f"[ERROR] 시간 추출 실패: {e}")
            target_date = session.get("date") or now.strftime("%Y-%m-%d")

        except Exception as e:
            # 여기서 'time_res'를 같이 찍어줘야 우리가 정체를 알 수 있어!
            print(f"\n[CRITICAL ERROR] 에러 발생 원인: {e}")
            print(
                f"[CRITICAL ERROR] 당시 LLM 응답값: {time_res if 'time_res' in locals() else 'None'}"
            )
            target_date = now.strftime("%Y-%m-%d")

        # 2. 시설 상세 및 예약 정보 확인
        availability_data = []
        facility_info_str = "상세 정보 없음"

        try:
            detail = await self.tools.get_facility_detail(facility_no=facility_no)
            print(f">>> [LOG 2] 시설 상세 정보(detail): {detail}")
            if detail:
                # 여기서 detail이 dict가 아닐 경우 에러 날 수 있음
                if isinstance(detail, dict):
                    facility_info_str = json.dumps(detail, ensure_ascii=False)
                    facility_name_found = detail.get(
                        "facilityName", facility_name_found
                    )
                else:
                    facility_info_str = str(detail)

            availability_data = await self.tools.check_availability(
                facility_no=facility_no, date=target_date
            )
            print(
                f">>> [LOG 2] 예약 현황(availability): {availability_data}"
            )  # 로그 추가
        except Exception as e:
            print(f">>> [ERROR 2] 데이터 조회 에러: {e}")

        current_session_info = f"""
        - 확정된 날짜: {session.get('date') or '미정'}
        - 확정된 시작시간: {session.get('start_time') or '미정'}
        - 확정된 종료시간: {session.get('end_time') or '미정'}
        """

        # 종합 분석 프롬프트
        final_prompt = f"""
        사용자 요청: "{user_text}"
        조회 날짜: {target_date}
        현재 시각: {now.strftime('%Y-%m-%d %H:%M')}
        
        [현재까지 파악된 정보]
        {current_session_info}
        
        [시설 정보]
        {facility_info_str}
        
        [해당 날짜 기존 예약 현황]
        {json.dumps(availability_data, ensure_ascii=False)}
        
        [수행 규칙]
        1. 사용자가 특정 시간을 명시하지 않았다면, 절대로 임의로 시간을 결정(예: 운영 시작 시간으로 설정)하지 마라.
           - 시간이 누락되었다면 'start_time'과 'end_time'은 null로 반환하라.
           - 'suggestion_message'에 "몇 시에 이용하시겠어요?"라고 구체적으로 질문하라.
        2. 정보가 모두 있고 예약 가능하다면:
            - 'is_available': true
            - 'suggestion_message': "모든 정보가 확인되었습니다. 예약을 확정할까요?"
        
        분석 가이드:
        1. 시설의 상세 정보(운영 시간 등)와 reservationStatus가 APPROVED인 기존 예약을 모두 고려하라.
        2. 사용자가 요청한 시간이 기존 예약과 겹치는지, 혹은 운영 시간 외인지 확인하라.
        3. 겹치거나 불가능하다면, 가장 가까운 예약 가능 시간을 찾아 제안하라.
        4. 날짜는 "YYYY-MM-DD" 형식으로 처리하며, 모든 시간은 24시간 형식(HH:MM)으로만 처리하라.
        5. 시간 추론 규칙:
           - [추측 금지] 사용자가 "내일 예약해줘"라고만 하고 시간을 말하지 않은 경우, 시설 운영 시간을 바탕으로 시간을 자동 할당하지 마라. 반드시 사용자에게 확인 질문을 먼저 던져야 한다.
           - 사용자가 "2시", "3시"처럼 오전/오후 언급 없이 숫자만 말하면, 현재 시각({now.strftime('%H:%M')})과 시설 운영 시간을 고려하여 상식적인 시간을 추론하라.
           - 보통 예약 요청에서 숫자만 말하면 '오후(PM)'를 의미할 확률이 높다. (예: 2시 -> 14:00)
           - 단, 시설이 오전 8시에 열고 유저가 8시라고 하면 오전 08:00으로 해석하라.
        6. 모호한 경우:
           - 유저의 요청이 오전/오후가 너무 헷갈린다면, suggestion_message에 "오전 2시인가요, 오후 2시인가요?"와 같이 물어보고 is_available을 false로 주어라.
        7. 예약이 가능하다면 반드시 'is_available': true로 설정하라.
        8. 오직 JSON 형식으로만 응답하라. 설명이나 파이썬 코드를 절대 포함하지 마라.
        9. 응답 예시(날짜나 시간을 입력하지 않았을 때):
        {{
            "is_available": true/false,
            "date": null,
            "start_time": null,
            "end_time": null,
            "suggestion_message": "상세한 안내 메시지"
        }}
        """

        try:
            final_res = await self.llm.chat([{"role": "user", "content": final_prompt}])
            print(f">>> [LOG 3] 최종 분석 LLM 응답: {final_res}")
            extracted = pre.parse_llm_json(final_res)
            print(f">>> [LOG 3] 최종 파싱 데이터(extracted): {extracted}")

            if isinstance(extracted, dict):
                for key in ["date", "start_time", "end_time"]:
                    if extracted.get(key):
                        session[key] = extracted.get(key)

            return {
                "analyze_result": ReservationAnalyzeReq(
                    reservationName=user_name,
                    reservationPhone=user_phone,
                    reservationDate=datetime.strptime(target_date, "%Y-%m-%d").date(),
                    # 값이 없으면 일단 "00:00"으로 채워서 에러 방지 (실제 예약은 안 됨)
                    reservationStartTime=datetime.strptime(
                        session.get("start_time") or "00:00", "%H:%M"
                    ).time(),
                    reservationEndTime=datetime.strptime(
                        session.get("end_time") or "00:00", "%H:%M"
                    ).time(),
                    facilityNo=str(facility_no),
                ),
                # ⭐ 여기가 핵심! 세션에 시간이나 날짜가 하나라도 없으면 무조건 False!
                "is_available": (
                    extracted.get("is_available", False)
                    if session.get("start_time")
                    else False
                ),
                "message": extracted.get("suggestion_message"),
            }

        except Exception as e:
            print(f">>> [ERROR 3] 최종 분석/파싱 실패: {e}")
            return {"message": f"분석 에러: {str(e)}"}
