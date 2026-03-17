from __future__ import annotations

from app.ibm.llm_client import LLMClient


class DocService:
    def __init__(self, llm: LLMClient):
        self.llm = llm

    async def write(
        self,
        doc_type: str,
        requirements: str,
        tone: str = "업무용",
        length: str = "1~2 페이지",
    ) -> str:
        system = (
            "너는 실무 문서 작성 도우미다. 사용자의 요구사항을 구조화하고, "
            "제목/개요/본문/요약/다음 액션을 포함해 한국어로 작성하라."
        )
        user = f"""DOC_TYPE: {doc_type}
TONE: {tone}
LENGTH: {length}

REQUIREMENTS:
{requirements}
"""
        return await self.llm.chat(
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.3,
            max_new_tokens=900,
        )
