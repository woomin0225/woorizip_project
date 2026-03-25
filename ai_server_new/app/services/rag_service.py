# app/services/rag.py

from app.clients.embedding_client import KureEmbeddingClient
from app.clients.qdrant_client import QdrantDbClient


class RagService:
    def __init__(self, vectorClient: QdrantDbClient, embeddingClient: KureEmbeddingClient):
        self.vectorClient = vectorClient
        self.embeddingClient = embeddingClient
        
    async def room_rag(self, text: str):
        # 질문문장은 청킹 안함 (2차원 벡터 검색됨)
        embeded = self.embeddingClient.embed(text)
        
        collection_name = "room_collection"
        hits = self.vectorClient.room_query(collection_name=collection_name, point=embeded)
        best={}
        for hit in hits:
            payload = hit.payload if isinstance(hit.payload, dict) else {}
            room_no = payload.get("roomNo")
            if not room_no:
                continue
            best[room_no] = max(best.get(room_no, -1), hit.score)
        
        ranked_rooms = sorted(
            best.items(),   # 튜플로 나열
            key=lambda x: x[1], # 튜플 두번째 값 (score) 기준으로 정렬
            reverse=True    # 내림차순
        )
        result = [{"roomNo": room_no, "score": score} for room_no, score in ranked_rooms]
        return result   # 스프링에서 받도록 dto형태로 보내기
