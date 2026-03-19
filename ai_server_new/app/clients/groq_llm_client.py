from __future__ import annotations

import os
from groq import AsyncGroq

class GroqLLMClient:
    def __init__(
        self,
        api_key: str | None = None,
        model: str = "llama-3.1-8b-instant",
    ):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY 환경변수가 필요합니다.")

        self.model_name = os.getenv("GROQ_MODEL", model)
        self.client = AsyncGroq(api_key=self.api_key)

    async def chat(
        self,
        messages: list[dict],
        temperature: float = 0.2,
        max_new_tokens: int = 512,
    ) -> str:
        normalized_messages: list[dict] = []

        for msg in messages or []:
            role = str(msg.get("role") or "user").strip().lower()
            content = str(msg.get("content") or "").strip()

            if not content:
                continue

            if role not in {"system", "user", "assistant"}:
                role = "user"

            normalized_messages.append({
                "role": role,
                "content": content,
            })

        if not normalized_messages:
            return ""

        response = await self.client.chat.completions.create(
            model=self.model_name,
            messages=normalized_messages,
            temperature=temperature,
            max_tokens=max_new_tokens,
        )

        return (response.choices[0].message.content or "").strip()

    async def embed(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError("Groq는 현재 이 프로젝트에서 embedding 용도로 사용하지 않습니다.")