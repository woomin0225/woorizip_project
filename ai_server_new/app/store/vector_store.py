# app/store/vector_store.py


# Add vectors
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from qdrant_client.models import VectorParams, Distance

from app.clients.qdrant_client import QdrantDbClient
from app.schemas import RoomTotalRequest


class VectorStore:
    def __init__(self, client: QdrantDbClient):
        self.client = client
    
    async def room_vector_store(self, target:RoomTotalRequest, vector):
        self.client.ensure_collection("room_collection")
        self.client.room_upsert("room_collection", target, vector)
        
    async def remove_room_vector(self, room_no: str):
        self.client.ensure_collection("room_collection")
        self.client.remove_room_vector("room_collection", room_no)