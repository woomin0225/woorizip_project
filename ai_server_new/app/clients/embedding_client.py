# app/clients/embedding_client.py

from sentence_transformers import SentenceTransformer

# from app.core.config import settings
# from openai import OpenAI



# text-embedding-3-small client 생성
# class OpenaiEmbeddingClient:
#     def __init__(self):
#         self.client=OpenAI(api_key=settings.OPENAI_API_KEY)
#         self.model_name="text-embedding-3-small"
        
#     def embed(self, text:str):
#         response=self.client.embeddings.create(
#             input=text,
#             model=self.model_name
#         )
#         vector=response.data[0].embedding
#         return vector
    
# nlpai-lab/KURE-v1
class KureEmbeddingClient:
    def __init__(self):
        self.model = SentenceTransformer("nlpai-lab/KURE-v1")
        
    def embed(self, text):
        embeddings = self.model.encode(text)
        return embeddings
        