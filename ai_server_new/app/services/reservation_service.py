# app/services/reservation_service.py
from __future__ import annotations
import json
from datetime import datetime
from typing import Any
import pandas as pd
from app.schemas import ReservationAnalyzeReq
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
        for item in my_facilities:
            if any(
                kw in user_text
                for kw in item.get("facilityName", "").replace("/", " ").split()
            ):
                extracted_f_no = item.get("facilityNo")
                break

        if not extracted_f_no:
            return {
                "status": "NEED_FACILITY",
                "message": "어떤 시설을 예약하고 싶으신지 다시 말씀해 주세요.",
            }

        now = datetime.now()
        time_extract_prompt = f"현재 시각: {now.strftime('%Y-%m-%d %H:%M')}\n사용자 요청: {user_text}\n..."

        time_res = await self.llm.chat(
            [{"role": "user", "content": time_extract_prompt}]
        )
        date_data = pre.parse_llm_json(time_res)

        return {
            "status": "ANALYZE_COMPLETED",
            "extracted_fields": {
                "facility_no": extracted_f_no,
                "date": date_data.get("date") if isinstance(date_data, dict) else None,
                "start_time": (
                    date_data.get("start_time") if isinstance(date_data, dict) else None
                ),
                "end_time": (
                    date_data.get("end_time") if isinstance(date_data, dict) else None
                ),
            },
            "user_info": {"name": user_name, "phone": user_phone},
            "is_available": (
                date_data.get("is_available") if isinstance(date_data, dict) else False
            ),
            "message": (
                date_data.get("suggestion_message")
                if isinstance(date_data, dict)
                else "시간을 다시 확인해주세요."
            ),
        }
