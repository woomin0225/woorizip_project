# Migration Guide (v0.2 -> v0.3)

## 구조 변경
- 기존 `ibm/` 중심 구조는 유지
- 신규 `app/clients/` 추가
  - IBM 외 provider를 서비스에서 직접 다루지 않고 adapter로 분리

## 서비스 변경
- `RagService`가 임베딩을 LLM에서 직접 호출하지 않고 `EmbeddingClient`를 사용
- `VoiceService`는 `SpeechToTextClient`, `TextToSpeechClient`를 주입받음
- `VisionService`는 `CaptionClient`, `ObjectDetectionClient`, `OCRClient`를 주입받음
- 신규 `ListingService`, `ReviewService` 추가

## 엔드포인트 추가
- `POST /ai/listing/index`
- `POST /ai/listing/search`
- `POST /ai/review/analyze`
- `POST /ai/review/summary`

## 의미상 변경
- 방 등록/수정 시점의 검색용 텍스트 임베딩 반영
- 리뷰 등록/수정 시점의 감성분석 반영
- 특정 방 리뷰 전체 요약 반영
