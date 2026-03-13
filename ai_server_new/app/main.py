# app/main.py

from contextlib import asynccontextmanager

from fastapi import FastAPI
from transformers import AutoTokenizer

from app.clients.embedding_client import KureEmbeddingClient
from app.clients.qwen_llm_client import QwenLlmClient
from app.routers import embed_router, rag_router, summary_router
from app.clients.qdrant_client import QdrantDbClient
from app.schemas import RoomSummaryRequest
from app.services.summary_service import RoomSummaryService
from fastapi import Request

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 앱시작시 구동될 클라이언트 작성
    app.state.qwen_llm_client=QwenLlmClient("Qwen/Qwen2.5-3B-Instruct")   # Qwen/Qwen3-4B-Instruct-2507 : 추후 상위모델로 교체
    # app.state.embeddingClient=OpenaiEmbeddingClient()
    app.state.embedding_client=KureEmbeddingClient()
    app.state.vector_client=QdrantDbClient()
    app.state.tokenizer = AutoTokenizer.from_pretrained("nlpai-lab/KURE-v1")
    yield
    # 앱 종료시

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
def welcome(request: Request):
    return {
        "qwen_llm_client (Qwen/Qwen2.5-3B-Instruct)": request.app.state.qwen_llm_client,
        "embedding_client (nlpai-lab/KURE-v1)": request.app.state.embedding_client,
        "vector_client (QdrantDB)": request.app.state.vector_client,
        "tokenizer (AutoTokenizer:nlpai-lab/KURE-v1)": request.app.state.tokenizer,
    }

    
