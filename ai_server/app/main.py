# app/main.py

from contextlib import asynccontextmanager

from fastapi import FastAPI
from transformers import AutoTokenizer

from app.clients.embedding_client import KureEmbeddingClient, OpenaiEmbeddingClient
from app.clients.llm_client import QwenLlmClient
from app import embed_router, rag_router, summary_router
from app.clients.qdrant_client import QdrantDbClient
from app.schemas import RoomSummaryRequest
from app.services.summary_service import SummaryService
from fastapi import Request

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.llmClient=QwenLlmClient("Qwen/Qwen2.5-3B-Instruct")   # Qwen/Qwen3-4B-Instruct-2507 : 추후 상위모델로 교체
    # app.state.embeddingClient=OpenaiEmbeddingClient()
    app.state.embeddingClient=KureEmbeddingClient()
    app.state.vectorClient=QdrantDbClient()
    app.state.tokenizer = AutoTokenizer.from_pretrained("nlpai-lab/KURE-v1")
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(
    embed_router.router,
    tags=["embed"]
)
app.include_router(
    summary_router.router,
    tags=["summary"]
)
app.include_router(
    rag_router.router,
    tags=["rag"]
)


@app.get("/")
def welcome():
    return {"hello": "ai"}

    
