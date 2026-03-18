from __future__ import annotations
import re
import requests
import json
from datetime import datetime, timedelta
from typing import Any

from app.core.config import settings
from app.schemas import ReservationAnalyzeReq
from app.services.embedding_service import EmbeddingService
from app.clients.qdrant_client import QdrantDbClient
from app.ibm.llm_client import GroqLLMClient
from app.services.spring_tools import SpringTools
from app.core import reservation_preprocessor as pre


class ReservationService:
    def __init__(
        self,
        llm: GroqLLMClient,
        tools: SpringTools,
        embedder: EmbeddingService,
        qdrant_db: QdrantDbClient,
    ):
        self.llm = llm
        self.tools = tools
        self.embedder = embedder
        self.base_url = settings.SPRING_BASE_URL
        self.user_api_base = f"{self.base_url}/api/user"
        self.qdrant_db = qdrant_db

    async def get_user_details(self, email_id: str) -> dict:
        """백엔드 API 호출: 유저 상세 정보 가져오기"""
        if not email_id:
            return {}
        url = f"{self.user_api_base}/{email_id}"
        try:
            resp = requests.get(url)
            if resp.status_code == 200:
                return resp.json().get("data", {})
        except Exception as e:
            print(f"유저 정보 조회 실패 ({email_id}): {e}")
        return {}

    async def _search_facility_with_qdrant(self, user_text: str) -> str | None:
        """EmbeddingService를 사용하여 Qdrant에서 시설 검색"""
        try:
            query_vector = self.embedder.embed(user_text)

            search_result = self.qdrant_db.search(
                collection_name=settings.QDRANT_COLLECTION,
                query_vector=query_vector,
                limit=1,
            )

            if search_result:
                return search_result[0].payload.get("facilityNo")
        except Exception as e:
            print(f"Qdrant 검색 실패: {e}")
        return None

    async def analyze_reservation(
        self, user_text: str, ctx: dict[str, Any]
    ) -> ReservationAnalyzeReq:
        """자연어 분석 -> 예약 객체 생성"""

        email_id = ctx.get("user_id")
        user_data = await self.get_user_details(email_id)

        # 시설 찾기
        db_data = await self.tools.get_facilities()
        facility_no = None
        for item in db_data:
            f_no = item.get("facilityNo")
            f_name = item.get("facilityName", "")
            core_title = pre.clean_title(item.get("facilityTitle", ""))

            if (f_name and f_name in user_text) or (
                core_title and core_title in user_text
            ):
                facility_no = f_no
                break

        # 텍스트 매칭 실패 시
        if not facility_no:
            facility_no = await self._search_facility_with_qdrant(user_text)

        # 날짜, 시간 추출 (LLM)
        prompt = f"""
        사용자 요청: "{user_text}"
        현재 시각: {datetime.now().strftime('%Y-%m-%d %H:%M')}
        
        위 문장에서 다음 정보를 추출해서 JSON으로 응답하라:
        1. date: YYYY-MM-DD 형식
        2. start_time: HH:MM 형식
        3. end_time: HH:MM 형식 (모르면 null)
        4. duration_minutes: 숫자 (모르면 60)
        """

        try:
            llm_res = await self.llm.ask(prompt)
            extracted = pre.parse_llm_json(llm_res)

            res_date = datetime.strptime(extracted["date"], "%Y-%m-%d").date()
            start_t = datetime.strptime(extracted["start_time"], "%H:%M").time()

            if extracted.get("end_time"):
                end_t = datetime.strptime(extracted["end_time"], "%H:%M").time()
            else:
                duration = int(extracted.get("duration_minutes", 60))
                end_t = (
                    datetime.combine(res_date, start_t) + timedelta(minutes=duration)
                ).time()

        except Exception as e:
            print(f"LLM 분석 실패({e}), 백업 로직 가동")
            parsed_dt = pre.parse_time(user_text)
            res_date = parsed_dt.date()
            start_t = parsed_dt.time()
            duration = pre.extract_duration_regex(user_text)
            end_t = (parsed_dt + timedelta(minutes=duration)).time()

        # 결과 반환
        return ReservationAnalyzeReq(
            reservationName=user_data.get("name"),
            reservationPhone=user_data.get("phone"),
            reservationDate=res_date,
            reservationStartTime=start_t,
            reservationEndTime=end_t,
            facilityNo=str(facility_no) if facility_no else None,
        )
