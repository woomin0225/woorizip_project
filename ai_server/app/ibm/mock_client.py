from __future__ import annotations

import hashlib
from app.ibm.llm_client import LLMClient


class MockLLMClient(LLMClient):
    """키 없이도 서버를 띄우고 프론트/스프링 연동 테스트를 할 수 있게 해주는 Mock."""

    async def chat(self, messages: list[dict], temperature: float = 0.2, max_new_tokens: int = 512) -> str:
        # 마지막 user 메시지만 간단히 에코
        last = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last = str(m.get("content", ""))
                break
        return f"[MOCK] {last[:800]}"

    async def embed(self, texts: list[str]) -> list[list[float]]:
        # 간단한 해시 기반 pseudo-embedding (차원 16)
        out: list[list[float]] = []
        for t in texts:
            h = hashlib.sha256(t.encode("utf-8", errors="ignore")).digest()
            vec = []
            for i in range(16):
                # 0~255 -> -1~1
                vec.append((h[i] / 255.0) * 2.0 - 1.0)
            out.append(vec)
        return out
