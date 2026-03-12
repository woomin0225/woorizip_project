# 폴더 구조(간소화, v0.3)

가이드 권장 모듈을 기준으로 유지:
- `app/main.py` : FastAPI 엔드포인트
- `app/schemas.py` : 요청/응답 DTO
- `app/core/` : 설정, 보안
- `app/ibm/` : watsonx LLM client
- `app/clients/` : OpenAI / Watson STT / Azure TTS / Qwen / GroundingDINO / PaddleOCR / KoBERT adapter
- `app/store/vector_store.py` : Vector DB (개발은 Chroma)
- `app/services/` : RAG / Summary / Vision / Voice / Listing / Review / Policy / Monitoring / Agent

## 핵심 원칙
- 엔드포인트는 과도하게 쪼개지지 않게 유지
- provider 교체는 `services/`가 아니라 `clients/`에서 처리
- 등록/예약 같은 Write Tool은 `draft -> confirm` 2단계 유지
- 방 검색과 리뷰 처리는 기획서에 맞게 별도 서비스로 분리하되, 구조는 얇게 유지
