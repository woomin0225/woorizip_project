from __future__ import annotations

from typing import Protocol, Any

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.core.config import settings


class VectorStore(Protocol):
    def upsert(self, ids: list[str], embeddings: list[list[float]], documents: list[str], metadatas: list[dict]) -> None:
        ...

    def query(self, query_embedding: list[float], top_k: int = 5) -> dict[str, Any]:
        ...


class ChromaVectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_DIR,
            settings=ChromaSettings(allow_reset=False),
        )
        self.col = self.client.get_or_create_collection(name=settings.CHROMA_COLLECTION)

    def upsert(self, ids: list[str], embeddings: list[list[float]], documents: list[str], metadatas: list[dict]) -> None:
        self.col.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)

    def query(self, query_embedding: list[float], top_k: int = 5) -> dict:
        return self.col.query(query_embeddings=[query_embedding], n_results=top_k)


def build_vector_store() -> VectorStore:
    return ChromaVectorStore()
