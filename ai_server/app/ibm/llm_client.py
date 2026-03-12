from __future__ import annotations

import os
from typing import Protocol

from google import genai
from google.genai import types
from groq import AsyncGroq


class LLMClient(Protocol):
    async def chat(
        self,
        messages: list[dict],
        temperature: float = 0.2,
        max_new_tokens: int = 512,
    ) -> str:
        ...

    async def embed(self, texts: list[str]) -> list[list[float]]:
        ...


class GeminiLLMClient:
    def __init__(
        self,
        api_key: str | None = None,
        model: str = "gemini-2.5-flash",
        embedding_model: str = "gemini-embedding-001",
    ):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY 환경변수가 필요합니다.")

        self.model_name = os.getenv("GEMINI_CHAT_MODEL", model)
        self.embedding_model_name = os.getenv("GEMINI_EMBED_MODEL", embedding_model)
        self.client = genai.Client(api_key=self.api_key)

    def _build_prompt(self, messages: list[dict]) -> str:
        blocks: list[str] = []

        for msg in messages or []:
            role = str(msg.get("role") or "user").strip().lower()
            content = str(msg.get("content") or "").strip()

            if not content:
                continue

            if role == "system":
                blocks.append(f"[SYSTEM]\n{content}")
            elif role == "assistant":
                blocks.append(f"[ASSISTANT]\n{content}")
            else:
                blocks.append(f"[USER]\n{content}")

        return "\n\n".join(blocks).strip()

    async def chat(
        self,
        messages: list[dict],
        temperature: float = 0.2,
        max_new_tokens: int = 512,
    ) -> str:
        prompt = self._build_prompt(messages)
        if not prompt:
            return ""

        response = await self.client.aio.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_new_tokens,
                response_mime_type="application/json",
            ),
        )

        return (response.text or "").strip()

    async def embed(self, texts: list[str]) -> list[list[float]]:
        cleaned = [str(text).strip() for text in texts if str(text).strip()]
        if not cleaned:
            return []

        result = await self.client.aio.models.embed_content(
            model=self.embedding_model_name,
            contents=cleaned,
        )

        embeddings = getattr(result, "embeddings", None) or []
        return [list(getattr(item, "values", []) or []) for item in embeddings]


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