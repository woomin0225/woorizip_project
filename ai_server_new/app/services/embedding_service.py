# app/services/embedding_service.py
# 텍스트 -> 임베딩 벡터 반환

from __future__ import annotations

from typing import Any

import torch
from transformers import AutoModel, AutoTokenizer

from fastapi import Request

from app.clients.embedding_client import KureEmbeddingClient
from app.schemas import RoomTotalRequest
from app.services.chunking import chunking

class EmbeddingService:
  """multilingual-e5-small 로컬 임베딩 서비스"""
  
  def __init__(self, model_name: str = "intfloat/multilingual-e5-small", device: str = "cpu") -> None:
    self.model_name = model_name
    self.device = device
    
    self.tokenizer = AutoTokenizer.from_pretrained(model_name)
    self.model = AutoModel.from_pretrained(model_name)
    self.model.to(device)
    self.model.eval()
    
  def _prepare_text(self, text: str) -> str:
    text = (text or "").strip()
    if not text:
      raise ValueError("임베딩할 text가 비어 있습니다.")
    
    # e5 계열은 query:/passage: prefix 사용 권장
    return f"passage: {text}"
  
  @staticmethod
  def _average_pool(last_hidden_states: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
    mask = attention_mask.unsqueeze(-1).expand(last_hidden_states.size()).float()
    masked = last_hidden_states * mask
    summed = masked.sum(dim=1)
    counts = mask.sum(dim=1).clamp(min=1e-9)
    return summed / counts
  
  def embed_text(self, text: str) -> dict[str, Any]:
    prepared_text = self._prepare_text(text)
    
    encoded = self.tokenizer(
      [prepared_text],
      max_length=512,
      padding=True,
      truncation=True,
      return_tensors="pt",
    )
    
    encoded = {k: v.to(self.device) for k, v in encoded.items()}
    
    with torch.no_grad():
      outputs = self.model(**encoded)
      embeddings = self._average_pool(outputs.last_hidden_state, encoded["attention_mask"])
      embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
      
    vector = embeddings[0].detach().cpu().tolist()
    
    return {
      "model": self.model_name,
      "dimension": len(vector),
      "embedding": vector,
    }



class RoomEmbeddingService:
    def __init__(self, client:KureEmbeddingClient):
        self.client=client
    
    async def embed(self, text:str):
        return self.client.embed(text)
    
    async def room_embed(self, target: RoomTotalRequest, tokenizer):
        data=target.model_dump()
        text="|".join(f"{k}:{v}" for k, v in data.items() if v is not None)
        chunked = chunking(text, tokenizer)
        return self.client.embed(chunked)