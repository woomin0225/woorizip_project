from __future__ import annotations

import asyncio
import json
from urllib import error, request

from app.core.config import settings


class SpringTourClient:
    async def apply_tour(self, *, room_no: str, payload: dict, access_token: str | None = None) -> dict:
        return await asyncio.to_thread(
            self._apply_tour_sync,
            room_no=room_no,
            payload=payload,
            access_token=access_token,
        )

    def _apply_tour_sync(self, *, room_no: str, payload: dict, access_token: str | None = None) -> dict:
        base_url = (settings.SPRING_BASE_URL or '').rstrip('/')
        if not base_url:
            raise ValueError('SPRING_BASE_URL 환경변수가 필요합니다.')

        url = f'{base_url}/api/tour/insert/{room_no}'
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')

        headers = {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json',
        }
        if access_token:
            headers['Authorization'] = f'Bearer {access_token}'
        elif settings.SPRING_INTERNAL_API_KEY:
            headers['X-API-KEY'] = settings.SPRING_INTERNAL_API_KEY

        req = request.Request(url=url, data=body, headers=headers, method='POST')
        try:
            with request.urlopen(req, timeout=15) as resp:
                raw = resp.read().decode('utf-8')
                return json.loads(raw) if raw else {}
        except error.HTTPError as exc:
            detail = exc.read().decode('utf-8', errors='ignore')
            raise ValueError(
                f'Spring tour API 호출 실패: url={url}, status={exc.code}, body={detail}'
            ) from exc
        except error.URLError as exc:
            raise ValueError(f'Spring tour API 연결 실패: url={url}, reason={exc.reason}') from exc
