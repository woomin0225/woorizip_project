from __future__ import annotations

import time
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.ibm.llm_client import LLMClient

IAM_TOKEN_URL = "https://iam.cloud.ibm.com/identity/token"


class WatsonxClient(LLMClient):
    """watsonx.ai Chat/Embeddings 호출 래퍼 (IAM 토큰 캐시 포함)."""

    def __init__(self):
        self._access_token: str | None = None
        self._expires_at: float = 0.0  # epoch seconds

    async def _get_iam_token(self) -> str:
        now = time.time()
        if self._access_token and now < self._expires_at - 60:
            return self._access_token

        data = {
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": settings.WATSONX_APIKEY,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(IAM_TOKEN_URL, data=data, headers=headers)
            resp.raise_for_status()
            js = resp.json()

        self._access_token = js["access_token"]
        self._expires_at = now + float(js.get("expires_in", 3600))
        return self._access_token

    async def _auth_headers(self) -> dict:
        token = await self._get_iam_token()
        return {"Authorization": f"Bearer {token}"}

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
    async def chat(self, messages: list[dict], temperature: float = 0.2, max_new_tokens: int = 512) -> str:
        url = f"{settings.WATSONX_URL}/ml/v1/text/chat?version=2024-05-01"
        headers = await self._auth_headers()
        headers["Content-Type"] = "application/json"

        payload = {
            "model_id": settings.WATSONX_CHAT_MODEL_ID,
            "project_id": settings.WATSONX_PROJECT_ID,
            "messages": messages,
            "parameters": {"temperature": temperature, "max_new_tokens": max_new_tokens},
        }

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            js = resp.json()

        try:
            return js["choices"][0]["message"]["content"]
        except Exception:
            return str(js)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
    async def embed(self, texts: list[str]) -> list[list[float]]:
        url = f"{settings.WATSONX_URL}/ml/v1/text/embeddings?version=2024-05-01"
        headers = await self._auth_headers()
        headers["Content-Type"] = "application/json"

        payload = {
            "model_id": settings.WATSONX_EMBED_MODEL_ID,
            "project_id": settings.WATSONX_PROJECT_ID,
            "inputs": texts,
        }

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            js = resp.json()

        if "data" in js:
            return [row["embedding"] for row in js["data"]]
        if "embeddings" in js:
            return js["embeddings"]
        return []
