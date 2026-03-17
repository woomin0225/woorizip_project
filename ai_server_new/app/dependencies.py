# app/dependencies.py

from fastapi import Depends, Request
from transformers import AutoTokenizer

from app.services.embedding_service import RoomEmbeddingService
from app.services.rag_service import RagService
from app.services.summary_service import RoomSummaryService
from app.store.vector_store import VectorStore

def get_embedding_client(request: Request):
    return request.app.state.embedding_client

def get_embedding_service(embedding_client=Depends(get_embedding_client)):
    return RoomEmbeddingService(client=embedding_client)

def get_qwen_llm_client(request: Request):
    return request.app.state.qwen_llm_client

def get_room_summary_service(llm_client=Depends(get_qwen_llm_client)):
    return RoomSummaryService(client=llm_client)

def get_vector_client(request: Request):
    return request.app.state.vector_client

def get_vector_store(vector_client=Depends(get_vector_client)):
    return VectorStore(client=vector_client)

def get_tokenizer(request: Request):
    return request.app.state.tokenizer

def get_rag_service(vector_client=Depends(get_vector_client), embedding_client=Depends(get_embedding_client)):
    return RagService(vectorClient=vector_client, embeddingClient=embedding_client)