from __future__ import annotations

import asyncio
import json
from urllib import error, request
from app.core.config import settings


class SpringFacilityClient:
    def __init__(self):
        self.base_url = (settings.SPRING_BASE_URL or "").rstrip("/")
        if not self.base_url:
            raise ValueError("SPRING_BASE_URL 환경변수가 설정되지 않았습니다.")

        self.api_key = settings.SPRING_INTERNAL_API_KEY

    async def get_facilities(
        self, *, user_id: str, house_no: str | None = None
    ) -> dict:
        """시설 목록 조회 (GET)"""
        url = f"{self.base_url}/api/facilities/ailist?userId={user_id}"
        if house_no:
            url += f"&houseNo={house_no}"

        res = await self._send_request(url, method="GET")
        data = res.get("data", {})

        user_name = data.get("userName")
        user_phone = data.get("userPhone")
        user_type = data.get("userType")
        facilities = data.get("facilities", [])

        if user_type == "LESSOR" and not house_no:
            owner_houses = await self.get_lessor_houses(user_id=user_id)
            return {"type": "HOUSE_LIST", "userType": user_type, "data": owner_houses}

        return {
            "type": "FACILITY_LIST",
            "userType": user_type,
            "userName": user_name,
            "userPhone": user_phone,
            "facilities": facilities,
        }

    async def get_facility_detail(self, *, facility_no: str) -> dict:
        """시설 상세 정보 조회 (GET)"""
        url = f"{self.base_url}/api/facilities/detail/{facility_no}"
        res = await self._send_request(url, method="GET")
        return res.get("data", {}) if isinstance(res, dict) else {}

    async def check_availability(self, *, facility_no: str, date: str) -> list:
        """특정 날짜의 예약 현황 조회 (GET)"""
        url = f"{self.base_url}/api/facilities/aicheck?facilityNo={facility_no}&date={date}"
        res = await self._send_request(url, method="GET")
        return res.get("data", []) if isinstance(res, dict) else []

    async def get_lessor_houses(self, *, user_id: str) -> list:
        """임대인의 건물 목록 조회 (GET)"""
        url = f"{self.base_url}/api/facilities/aiHouse?userId={user_id}"
        res = await self._send_request(url, method="GET")
        houses = res.get("data", []) if isinstance(res, dict) else []

        refined_houses = [
            {"houseNo": h["houseNo"], "houseName": h["houseName"]} for h in houses
        ]

        return refined_houses

    async def get_stats_data(self, facility_no: str) -> list:
        """통계용 예약 데이터 조회 (GET)"""
        url = f"{self.base_url}/api/facilities/aiStats?facilityNo={facility_no}"
        res = await self._send_request(url, method="GET")

        if isinstance(res, dict):
            return res.get("data", [])
        return []

    async def _send_request(
        self, url: str, method: str = "GET", payload: dict | None = None
    ) -> any:
        return await asyncio.to_thread(self._sync_request, url, method, payload)

    def _sync_request(self, url: str, method: str, payload: dict | None) -> any:
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
        }
        if self.api_key:
            headers["X-API-KEY"] = self.api_key

        body = (
            json.dumps(payload, ensure_ascii=False).encode("utf-8") if payload else None
        )
        req = request.Request(url=url, data=body, headers=headers, method=method)

        try:
            with request.urlopen(req, timeout=15) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            print(f">>> [API ERROR] url={url}, status={exc.code}, body={detail}")
            return {}
        except Exception as e:
            print(f">>> [CONNECTION ERROR] url={url}, reason={e}")
            return {}
