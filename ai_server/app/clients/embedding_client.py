# app/clients/embedding_client.py

from sentence_transformers import SentenceTransformer

from app.core.config import settings
from openai import OpenAI


# nlpai-lab/KURE-v1
class KureEmbeddingClient:
    def __init__(self):
        self.model = SentenceTransformer("nlpai-lab/KURE-v1")
        
    def embed(self, text):
        embeddings = self.model.encode(text)
        return embeddings
        