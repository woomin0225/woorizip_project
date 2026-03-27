from __future__ import annotations

import asyncio
import json
import logging
from urllib import error, request

from app.core.config import settings


logger = logging.getLogger(__name__)


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
            raise ValueError('SPRING_BASE_URL environment variable is required')

        path = '/api/tour/insert' if access_token else '/api/tour/internal/insert'
        url = f'{base_url}{path}/{room_no}'
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
            # CODEX-AZURE-TRACE-START
            logger.info(
                "SPRING_TOUR_HTTP_REQUEST url=%s payload=%s authorization=%s apiKey=%s",
                url,
                payload,
                bool(access_token),
                bool(settings.SPRING_INTERNAL_API_KEY),
            )
            # CODEX-AZURE-TRACE-END
            with request.urlopen(req, timeout=15) as resp:
                raw = resp.read().decode('utf-8')
                parsed = json.loads(raw) if raw else {}
                # CODEX-AZURE-TRACE-START
                logger.info(
                    "SPRING_TOUR_HTTP_RESPONSE url=%s status=%s body=%s",
                    url,
                    getattr(resp, 'status', None),
                    parsed,
                )
                # CODEX-AZURE-TRACE-END
                return parsed
        except error.HTTPError as exc:
            detail = exc.read().decode('utf-8', errors='ignore')
            # CODEX-AZURE-TRACE-START
            logger.exception(
                "SPRING_TOUR_HTTP_ERROR url=%s status=%s body=%s",
                url,
                exc.code,
                detail,
            )
            # CODEX-AZURE-TRACE-END
            raise ValueError(
                f'Spring tour API call failed: url={url}, status={exc.code}, body={detail}'
            ) from exc
        except error.URLError as exc:
            # CODEX-AZURE-TRACE-START
            logger.exception(
                "SPRING_TOUR_HTTP_CONNECTION_ERROR url=%s reason=%s",
                url,
                exc.reason,
            )
            # CODEX-AZURE-TRACE-END
            raise ValueError(f'Spring tour API connection failed: url={url}, reason={exc.reason}') from exc
