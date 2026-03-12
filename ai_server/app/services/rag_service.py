from __future__ import annotations

import uuid
from typing import Any

from app.ibm.llm_client import LLMClient
from app.clients.protocols import EmbeddingClient
from app.store.vector_store import VectorStore


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    chunks = []
    i = 0
    text = text or ''
    while i < len(text):
        chunks.append(text[i:i + chunk_size])
        i += max(1, chunk_size - overlap)
    return chunks or ['']


class RagService:
    def __init__(self, llm: LLMClient, embeddings: EmbeddingClient, store: VectorStore):
        self.llm = llm
        self.embeddings = embeddings
        self.store = store

    async def ingest_text(self, source_id: str, text: str, meta: dict[str, Any] | None = None) -> dict:
        meta = meta or {}
        chunks = chunk_text(text)
        vecs = await self.embeddings.embed(chunks)
        ids = [f'{source_id}:{uuid.uuid4().hex}' for _ in chunks]
        metadatas = [{'source_id': source_id, 'chunk': idx, **meta} for idx in range(len(chunks))]
        self.store.upsert(ids=ids, embeddings=vecs, documents=chunks, metadatas=metadatas)
        return {'source_id': source_id, 'chunks': len(chunks), 'meta': meta}

    async def answer(self, question: str, top_k: int = 5, filters: dict[str, Any] | None = None) -> dict:
        q_emb = (await self.embeddings.embed([question]))[0]
        hits = self.store.query(q_emb, top_k=top_k)
        docs = hits.get('documents', [[]])[0]
        metas = hits.get('metadatas', [[]])[0]
        context = '\n\n'.join([f'[{i + 1}] {d}' for i, d in enumerate(docs)])
        system = (
            '너는 프로젝트 문서 기반 RAG 어시스턴트다. 반드시 제공된 CONTEXT에 근거해서 답하고, '
            "근거가 부족하면 '문서 근거 부족'이라고 말하라. 답변 마지막에 참고한 근거 번호([1],[2]...)를 적어라."
        )
        user = f'QUESTION:\n{question}\n\nFILTERS:\n{filters or {}}\n\nCONTEXT:\n{context}'
        answer = await self.llm.chat(
            [{'role': 'system', 'content': system}, {'role': 'user', 'content': user}],
            temperature=0.2,
            max_new_tokens=700,
        )
        return {
            'question': question,
            'answer': answer,
            'citations': [
                {'rank': i + 1, 'source_id': metas[i].get('source_id'), 'chunk': metas[i].get('chunk'), 'meta': metas[i]}
                for i in range(len(metas))
            ],
        }
