from __future__ import annotations

import asyncio
import json
import uuid
from urllib import error, parse, request

from app.core.config import settings


class SpringRoomClient:
    def __init__(self):
        self.base_url = (settings.SPRING_BASE_URL or "").rstrip("/")
        if not self.base_url:
            raise ValueError("SPRING_BASE_URL 환경변수가 필요합니다.")

        self.api_key = settings.SPRING_INTERNAL_API_KEY

    async def search_rooms_natural(self, *, query: str) -> list[dict]:
        return await asyncio.to_thread(
            self._search_rooms_natural_sync,
            query=query,
        )

    async def search_rooms_filtered(
        self,
        *,
        cond: dict[str, object],
        page: int = 0,
        size: int = 12,
    ) -> dict:
        return await asyncio.to_thread(
            self._search_rooms_filtered_sync,
            cond=cond,
            page=page,
            size=size,
        )

    async def create_room(
        self,
        *,
        house_no: str,
        room_payload: dict,
        access_token: str | None = None,
    ) -> dict:
        return await asyncio.to_thread(
            self._create_room_sync,
            house_no=house_no,
            room_payload=room_payload,
            access_token=access_token,
        )

    def _create_room_sync(
        self,
        *,
        house_no: str,
        room_payload: dict,
        access_token: str | None = None,
    ) -> dict:
        url = f"{self.base_url}/api/rooms"
        body, content_type = self._build_multipart_body(
            {
                "houseNo": house_no,
                **(room_payload or {}),
            }
        )

        headers = self._build_headers(content_type=content_type)
        if access_token:
            headers.pop("X-API-KEY", None)
            headers["Authorization"] = f"Bearer {access_token}"
        req = request.Request(url=url, data=body, headers=headers, method="POST")

        try:
            with request.urlopen(req, timeout=15) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise ValueError(
                f"Spring room API 호출 실패: url={url}, status={exc.code}, body={detail}"
            ) from exc
        except error.URLError as exc:
            raise ValueError(f"Spring room API 연결 실패: url={url}, reason={exc.reason}") from exc

    def _search_rooms_natural_sync(self, *, query: str) -> list[dict]:
        url = f"{self.base_url}/api/rooms/rag/room"
        headers = self._build_headers(content_type="text/plain; charset=utf-8")
        body = str(query or "").encode("utf-8")
        raw = self._request_json(url=url, method="POST", data=body, headers=headers)
        data = self._unwrap_payload(raw)
        return data if isinstance(data, list) else []

    def _search_rooms_filtered_sync(
        self,
        *,
        cond: dict[str, object],
        page: int,
        size: int,
    ) -> dict:
        params = {
            key: value
            for key, value in {**(cond or {}), "page": page, "size": size}.items()
            if value is not None
        }
        query_string = parse.urlencode(params, doseq=True)
        url = f"{self.base_url}/api/rooms/search?{query_string}"
        headers = self._build_headers()
        raw = self._request_json(url=url, method="GET", headers=headers)
        data = self._unwrap_payload(raw)
        return data if isinstance(data, dict) else {}

    def _build_multipart_body(self, fields: dict[str, object]) -> tuple[bytes, str]:
        boundary = f"----CodexRoomBoundary{uuid.uuid4().hex}"
        lines: list[bytes] = []

        for key, value in fields.items():
            if value is None:
                continue

            if isinstance(value, bool):
                text_value = "true" if value else "false"
            else:
                text_value = str(value)

            if text_value in {"null", "undefined"}:
                continue

            lines.extend(
                [
                    f"--{boundary}".encode("utf-8"),
                    f'Content-Disposition: form-data; name="{key}"'.encode("utf-8"),
                    b"",
                    text_value.encode("utf-8"),
                ]
            )

        lines.append(f"--{boundary}--".encode("utf-8"))
        lines.append(b"")
        body = b"\r\n".join(lines)
        return body, f"multipart/form-data; boundary={boundary}"

    def _build_headers(self, *, content_type: str = "application/json; charset=utf-8") -> dict[str, str]:
        headers = {
            "Accept": "application/json",
            "Content-Type": content_type,
        }
        if self.api_key:
            headers["X-API-KEY"] = self.api_key
        return headers

    def _request_json(
        self,
        *,
        url: str,
        method: str,
        headers: dict[str, str],
        data: bytes | None = None,
    ) -> dict | list | str:
        req = request.Request(url=url, data=data, headers=headers, method=method)
        try:
            with request.urlopen(req, timeout=15) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise ValueError(
                f"Spring room API 호출 실패: url={url}, status={exc.code}, body={detail}"
            ) from exc
        except error.URLError as exc:
            raise ValueError(
                f"Spring room API 연결 실패: url={url}, reason={exc.reason}"
            ) from exc

    def _unwrap_payload(self, raw: dict | list | str) -> dict | list | str:
        if isinstance(raw, dict) and "data" in raw:
            return raw.get("data")
        return raw
