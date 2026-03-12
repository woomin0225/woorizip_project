# app/services/summary_service.py

from app.clients.llm_client import QwenLlmClient
from app.schemas import RoomSummaryRequest

class SummaryService:
    def __init__(self, client: QwenLlmClient):
        self.client=client
        
    def summary_room_reviews(self, room_reviews: list):
        if not room_reviews:
            raise ValueError("요약할 리뷰 텍스트가 비어있습니다.")
        review_values = [r for r in room_reviews if r]
        prompt = f"""Give me a summary about following room's reviews in korean. '{review_values}'"""
        messages = [
            {"role": "system", "content": f"You are real estate summary master. You have to summarize about room's reviews and return the summary text."},
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": "summarized result is "}
        ]
        result = self.client.generate_from_messages(messages, max_new_tokens=128)
        return result.strip()
    
    def summary_room_image_captions(self, room_image_captions: list):
        if not room_image_captions:
            raise ValueError("요약할 리뷰 텍스트가 비어있습니다.")
        caption_values = [c for c in room_image_captions if c]
        prompt = f"""Give me a summary about following room's reviews in korean. '{caption_values}'"""
        messages = [
            {"role": "system", "content": f"You are real estate summary master. You have to summarize about room's image captions and return the summary text."},
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": "summarized result is "}
        ]
        result = self.client.generate_from_messages(messages, max_new_tokens=128)
        return result.strip()
    
    def summary_room_total(self, room: RoomSummaryRequest):
        if not room:
            raise ValueError("요약할 방 정보 텍스트가 비어있습니다.")
        prompt = f"""Give me a summary about following room's basic information, image summary and review summary in korean. '{room}'"""
        category = """
        채광, 치안, 소음, 주변시설, 공용시설, 관리, 관리비, 주차, 학교, 마트, 배달, 이웃, 풍경, 냄새, 위치
        """
        messages = [
            {"role": "system", "content": f"You are real estate agent. You have to summarize about room information and return the summary. You can use following category keywords on summarize work. category: {category}"},
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": "summarized result is "}
        ]
        result = self.client.generate_from_messages(messages, max_new_tokens=128)
        return result.strip()