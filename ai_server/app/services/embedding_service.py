# app/services/embedding_service.py
# 텍스트 -> 임베딩 벡터 반환

from fastapi import Request

from app.clients.embedding_client import KureEmbeddingClient
from app.schemas import RoomTotalRequest
from app.services.chunking import chunking

class EmbeddingService:
    def __init__(self, client:KureEmbeddingClient):
        self.client=client
    
    def embed(self, text:str):
        return self.client.embed(text)
    
    def room_embed(self, target: RoomTotalRequest, tokenizer):
        data=target.model_dump()
        text="|".join(f"{k}:{v}" for k, v in data.items() if v is not None)
        chunked = chunking(text, tokenizer)
        return self.client.embed(chunked)