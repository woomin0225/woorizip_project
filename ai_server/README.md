# WooriZip AI Agent Server (FastAPI) - Slim Skeleton v0.3

학원 가이드의 권장 구조(`core / ibm / services / store / schemas / main`)를 유지하면서,
기획서 v0.3의 기능(Voice / Vision / RAG / Listing / Review / Policy / Monitoring / Agent)을 담도록 업데이트한 스켈레톤입니다.

## 핵심 변경점
- IBM 전용 `ibm/` 레이어만 있던 구조에 더해, **비IBM 모델용 클라이언트 레이어 `app/clients/`를 추가**했습니다.
- 방 등록/수정 시 검색용 임베딩을 만들 수 있도록 `POST /ai/listing/index`를 추가했습니다.
- 리뷰 등록/수정 시 감성분석과 방 단위 리뷰 요약을 처리하도록 `POST /ai/review/analyze`, `POST /ai/review/summary`를 추가했습니다.
- 음성/비전은 각각 provider별 adapter를 두고 서비스에서는 이를 묶어 orchestration만 담당합니다.

## 1) 실행
```bash
cd ai_server
python -m venv .venv
# Windows
.venv\Scripts\activate
# mac/linux
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

- 헬스체크: `GET /health`
- Swagger: `http://localhost:8001/docs`

## 2) Spring -> FastAPI 호출 규칙
- Header: `X-API-KEY: <APP_API_KEY>`
- 선택 헤더: `X-User-Id`, `X-Roles`
- React는 직접 FastAPI를 호출하지 않고 Spring(BFF)만 호출합니다.

## 3) 최소 엔드포인트 + 프로젝트 확장 엔드포인트
### 가이드 핵심 엔드포인트
- `POST /ai/chat`
- `POST /ai/rag/ingest`
- `POST /ai/rag/query`
- `POST /ai/doc/write`
- `POST /ai/recommend`
- `POST /ai/agent/run`

### 통합/확장 엔드포인트
- `POST /ai/summary`
- `POST /ai/vision/analyze`
- `POST /ai/voice/transcribe`
- `POST /ai/voice/speak`
- `POST /ai/policy/check`
- `POST /ai/monitor/analyze`
- `POST /ai/listing/index`
- `POST /ai/listing/search`
- `POST /ai/review/analyze`
- `POST /ai/review/summary`

## 4) 클라이언트 레이어
이 버전부터 IBM 외 모델도 별도 클라이언트로 분리했습니다.
- `app/ibm/` : watsonx LLM
- `app/clients/openai_embedding_client.py` : OpenAI 임베딩
- `app/clients/watson_stt_client.py` : Watson STT adapter
- `app/clients/azure_tts_client.py` : Azure Speech TTS adapter
- `app/clients/qwen_caption_client.py` : Qwen2.5-VL adapter
- `app/clients/groundingdino_client.py` : GroundingDINO adapter
- `app/clients/paddleocr_client.py` : PaddleOCR adapter
- `app/clients/kobert_sentiment_client.py` : KoBERT sentiment adapter

기본값은 모두 mock라서 키 없이 서버를 띄울 수 있고, provider만 바꾸면 adapter를 실제 연동용으로 교체할 수 있습니다.

## 5) Write Tool 정책 (Draft -> Confirm)
`/ai/agent/run`은 Write Tool 요청(매물 등록/시설 예약)을 받으면:
1) `stage=draft`로 초안 반환
2) 사용자 확인 후 `confirm=true`로 재호출해 실행 또는 Spring에서 실행

기본값 `TOOL_EXECUTION_MODE=plan`에서는 FastAPI가 **plan/draft만 반환**합니다.
