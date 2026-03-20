# app/clients/qdrant_client.py

from uuid import NAMESPACE_URL, uuid4, uuid5

from qdrant_client import QdrantClient, models
from qdrant_client.models import PointStruct
from qdrant_client.models import VectorParams, Distance
from app.schemas import RoomTotalRequest
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# qdrant client 생성
class QdrantDbClient:
    def __init__(self, url:str="http://localhost:6333"):
        # self.client=QdrantClient(url=url) # 로컬용
        self.client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_APIKEY,
        )
        
    def ensure_collection(self, name:str):
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
    
    def room_upsert(self, collection_name:str, target:RoomTotalRequest, vector):
        (n, _) = vector.shape
        
        points=[]
        for i in range(0, n):
            # roomNo is a business key like "room_s0030", not a UUID.
            point_id = str(uuid5(NAMESPACE_URL, f"room:{target.roomNo}:{i}"))
            points.append(PointStruct(id=point_id, vector=vector[i], payload=target.model_dump(mode="json")))
        
        info = self.client.upsert(
            collection_name=collection_name,
            wait=True,
            points=points,
        )
        logger.info("Qdrant 방 벡터 등록 성공: %s", info)
        
    def room_query(self, collection_name:str, point):
        hits = self.client.query_points(
            collection_name=collection_name,
            query=point,
            limit=30
        ).points
        
        for hit in hits:
            payload = hit.payload if isinstance(hit.payload, dict) else {}
            room_no = payload.get("roomNo")
            logger.info("Qdrant room hit roomNo=%s score=%s", room_no, hit.score)
            
        return hits
    
    def remove_room_vector(self, collection_name: str, room_no):
        logger.info("Qdrant에 방 벡터 삭제요청. room_no=%s, collection_name=%s", room_no, collection_name)
        try:
            result = self.client.delete(
                collection_name=collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="roomNo",
                                match=models.MatchValue(value=room_no),
                            )
                        ]
                    )
                ),
                wait=True
            )
            logger.info("Qdrant 방 벡터 삭제 성공. room_no=%s, collection_name=%s, result=%s", room_no, collection_name, result)
            return result
        except Exception:
            logger.exception("Qdrant 방 벡터 삭제 에러발생. room_no=%s, collection_name=%s", room_no, collection_name)
            raise
