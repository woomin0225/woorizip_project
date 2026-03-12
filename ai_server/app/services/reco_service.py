from __future__ import annotations

from app.ibm.llm_client import LLMClient


class RecoService:
    def __init__(self, llm: LLMClient):
        self.llm = llm

    async def recommend(self, user_id: str, candidates: list[dict], goal: str = "주거/매물 탐색") -> dict:
        system = (
            "너는 추천 시스템이다. 후보 목록을 사용자의 목표에 맞춰 상위 5개를 선정하고, "
            "각 추천 이유를 2줄로 설명하라. 마지막에 '추천요약' 한 줄을 추가하라."
        )
        user = f"USER: {user_id}\nGOAL: {goal}\nCANDIDATES:\n{candidates}"
        text = await self.llm.chat(
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.2,
            max_new_tokens=600,
        )
        return {"userId": user_id, "result": text}
