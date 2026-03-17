from __future__ import annotations

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.clients.protocols import EmbeddingClient
from app.core.config import settings


class OpenAIEmbeddingClient(EmbeddingClient):
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_EMBED_MODEL or 'text-embedding-3-small'
        self.base_url = (settings.OPENAI_BASE_URL or 'https://api.openai.com/v1').rstrip('/')

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not self.api_key:
            raise RuntimeError('OPENAI_API_KEY 가 필요합니다.')
        headers = {'Authorization': f'Bearer {self.api_key}', 'Content-Type': 'application/json'}
        payload = {'model': self.model, 'input': texts}
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(f'{self.base_url}/embeddings', headers=headers, json=payload)
            resp.raise_for_status()
            js = resp.json()
        return [row['embedding'] for row in js.get('data', [])]
