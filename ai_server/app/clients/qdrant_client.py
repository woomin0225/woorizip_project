# app/clients/qdrant_client.py

from uuid import uuid4, uuid5, UUID
import uuid

from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from qdrant_client.models import VectorParams, Distance
from app.schemas import RoomTotalRequest
from numpy import shape


# qdrant client 생성
class QdrantDbClient:
    def __init__(self, url: str = "http://localhost:6333"):
        self.client = QdrantClient(url=url)

    def ensure_collection(self, name: str):
        if not self.client.collection_exists(name):
            self.client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
                # text-embedding-3-small은 차원수 1536, 벡터유사도 계산방식 COSINE 추천
                # nlpai-lab/KURE-v1은 차원수 1024
            )

    def upsert(self, collection_name: str, vector):
        info = self.client.upsert(
            collection_name=collection_name,
            wait=True,
            points=[PointStruct(id=str(uuid4()), vector=vector, payload={})],
        )
        print(info)

    def room_upsert(self, collection_name: str, target: RoomTotalRequest, vector):
        (n, _) = vector.shape

        points = []
        for i in range(0, n):
            point_id = str(uuid5(UUID(target.roomNo), f"{i}"))
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector[i],
                    payload=target.model_dump(mode="json"),
                )
            )

        info = self.client.upsert(
            collection_name=collection_name,
            wait=True,
            points=points,
        )
        print(info)

    def room_query(self, collection_name: str, point):
        hits = self.client.query_points(
            collection_name=collection_name, query=point, limit=30
        ).points

        for hit in hits:
            print(hit.payload, "score:", hit.score)

        return hits

    def search(self, collection_name: str, query_vector: list[float], limit: int = 1):
        hits = self.client.query_points(
            collection_name=collection_name, query=query_vector, limit=limit
        ).points
        return hits
