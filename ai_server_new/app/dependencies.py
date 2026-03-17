# app/dependencies.py

from fastapi import Depends, Request
from transformers import AutoTokenizer

from app.clients.qwen_llm_client import QwenLlmClient
from app.clients.embedding_client import KureEmbeddingClient
from app.services.embedding_service import RoomEmbeddingService
from app.services.rag_service import RagService
from app.services.summary_service import RoomSummaryService
from app.store.vector_store import VectorStore

async def get_embedding_client(request: Request):
    return request.app.state.embedding_client

async def get_embedding_service(embedding_client=Depends(get_embedding_client)):
    return RoomEmbeddingService(client=embedding_client)

async def get_qwen_llm_client(request: Request):
    if request.app.state.qwen_llm_client is None:
        request.app.state.qwen_llm_client = QwenLlmClient("Qwen/Qwen2.5-3B-Instruct")   # Qwen/Qwen3-4B-Instruct-2507 : 추후 상위모델로 교체
    return request.app.state.qwen_llm_client

async def get_room_summary_service(llm_client=Depends(get_qwen_llm_client)):
    return RoomSummaryService(client=llm_client)

async def get_vector_client(request: Request):
    return request.app.state.vector_client

async def get_vector_store(vector_client=Depends(get_vector_client)):
    return VectorStore(client=vector_client)

async def get_tokenizer(request: Request):
    if request.app.state.tokenizer is None:
        request.app.state.tokenizer=AutoTokenizer.from_pretrained("nlpai-lab/KURE-v1")
    return request.app.state.tokenizer

async def get_rag_service(vector_client=Depends(get_vector_client), embedding_client=Depends(get_embedding_client)):
    return RagService(vectorClient=vector_client, embeddingClient=embedding_client)