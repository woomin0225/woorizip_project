Azure 투어 신청 워크플로에서 필요한 값 정리

필수 값
- `fastApiBaseUrl`
  - 예: `http://127.0.0.1:8000`
- `internalApiKey`
  - FastAPI의 `APP_API_KEY`와 같은 값
- `roomNo`
  - 방 상세 페이지일 때만 전달
- `roomName`
  - 방 상세 페이지일 때만 전달

권장 규칙
- 방 상세 페이지가 아니면 `roomNo`, `roomName`은 보내지 않음
- 사용자가 투어 신청 의도를 말해도 현재 페이지가 방 상세 페이지가 아니면 상세 페이지에서 다시 신청해 달라고 안내
- 워크플로는 날짜와 시간을 한 번에 받아 `preferredVisitAt` 하나만 FastAPI에 전달
- 이름, 연락처 같은 사용자 정보는 워크플로에서 다시 묻지 않음

워크플로에서 FastAPI 호출 시 헤더 예시
```yaml
headers:
  Content-Type: application/json
  X-API-KEY: =System.Context.internalApiKey
```

워크플로에서 FastAPI 호출 시 body 예시
```yaml
body:
  schemaVersion: =Workflow.SchemaVersion
  sessionId: =Workflow.SessionId
  clientRequestId: =Workflow.ClientRequestId
  roomNo: =System.Context.roomNo
  roomName: =System.Context.roomName
  preferredVisitAt: =Workflow.PreferredVisitAt
```

프론트에서 상세 페이지일 때만 넣어야 하는 값
```json
{
  "roomNo": "ROOM123",
  "roomName": "101호"
}
```

Azure 또는 호출 환경에서 항상 넣어야 하는 값
```json
{
  "fastApiBaseUrl": "http://127.0.0.1:8000",
  "internalApiKey": "local-dev-key"
}
```

백엔드 처리 원칙
- 워크플로는 현재 방 정보와 방문 희망 날짜/시간만 보낸다
- 나머지 사용자 정보가 필요하면 백엔드가 인증 정보나 서버 측 데이터로 처리한다
