from __future__ import annotations

import re
from app.ibm.llm_client import LLMClient


_BAD_WORDS = [
    # 프로젝트 데모용: 실제 운영은 금칙어 사전/분류모델/가드레일로 교체
    "시발", "병신", "좆", "개새", "꺼져",
]


class PolicyService:
    def __init__(self, llm: LLMClient | None = None):
        self.llm = llm

    async def check(self, text: str) -> dict:
        reasons: list[str] = []
        lowered = text.lower()

        if any(w in text for w in _BAD_WORDS):
            reasons.append("profanity")

        # 아주 단순한 스팸 힌트
        if len(re.findall(r"https?://", lowered)) >= 2:
            reasons.append("spam_links")

        if len(text) > 2000 and "무료" in text:
            reasons.append("spam_long")

        action = "allow"
        if reasons:
            action = "block" if "profanity" in reasons else "review"

        return {"action": action, "reasons": reasons}
