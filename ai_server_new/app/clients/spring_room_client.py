from __future__ import annotations

import asyncio
import json
import uuid
from urllib import error, request

from app.core.config import settings


class SpringRoomClient:
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
        base_url = (settings.SPRING_BASE_URL or "").rstrip("/")
        if not base_url:
            raise ValueError("SPRING_BASE_URL 환경변수가 필요합니다.")

        url = f"{base_url}/api/rooms"
        body, content_type = self._build_multipart_body(
            {
                "houseNo": house_no,
                **(room_payload or {}),
            }
        )

        headers = {
            "Content-Type": content_type,
            "Accept": "application/json",
        }
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        elif settings.SPRING_INTERNAL_API_KEY:
            headers["X-API-KEY"] = settings.SPRING_INTERNAL_API_KEY

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
