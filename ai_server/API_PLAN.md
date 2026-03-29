# API 계획서 (FastAPI) v0.3

## 공통
- 모든 `/ai/*` 요청은 Header `X-API-KEY` 필요
- Spring이 있으면 `X-User-Id`, `X-Roles` 헤더로 사용자 컨텍스트 전달

## 가이드 핵심 엔드포인트
### 1) POST /ai/chat
일반 대화

### 2) POST /ai/rag/ingest
문서/게시글 텍스트 적재(청크/임베딩/저장)

### 3) POST /ai/rag/query
근거 기반 Q&A

### 4) POST /ai/doc/write
회의록/보고서/소개글 작성

### 5) POST /ai/recommend
후보 리스트 재정렬/추천 설명

### 6) POST /ai/agent/run
의도파악 → Tool 호출 계획/실행(Draft → Confirm)

## 프로젝트 확장 엔드포인트
### 7) POST /ai/summary
페이지/게시글/매물 요약 통합

### 8) POST /ai/vision/analyze
이미지 캡션 + 객체 탐지 + OCR + 선택적 ingest

### 9) POST /ai/voice/transcribe
Watson STT adapter 호출

### 10) POST /ai/voice/speak
Azure Speech TTS adapter 호출

### 11) POST /ai/policy/check
비속어/스팸/정책 검사

### 12) POST /ai/monitor/analyze
조회수 어뷰징/시설 사용 로그 이상 탐지 요약

### 13) POST /ai/listing/index
방 등록/수정 시 검색용 문서 생성 + 임베딩 저장
- room 기본정보
- image_summaries(캡션/탐지/OCR)
- review_summary(선택)

### 14) POST /ai/listing/search
매물 자연어 검색
- query + filters + Spring DB 후보(candidates)
- DB 후보가 없으면 벡터스토어 후보 식별
- LLM으로 설명/재정렬

### 15) POST /ai/review/analyze
리뷰 단건 감성분석
- room_id, review_id, text
- ingest=true면 리뷰 텍스트도 벡터화

### 16) POST /ai/review/summary
특정 방 리뷰 전체 요약
- 리뷰 수, 감성 분포, 장단점 요약 반환
