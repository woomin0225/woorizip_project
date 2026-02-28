# PASS 본인인증 연동 스펙 (프론트/백엔드)

## 1) 목적
- 휴대폰 번호 기반 PASS 본인인증을 통해 사용자 신원을 확인한다.
- 프론트는 인증창 트리거와 결과 반영만 담당한다.
- PASS 비밀키/서명/검증은 반드시 백엔드에서만 처리한다.

## 2) 환경변수 (프론트)
- `REACT_APP_PASS_AUTH_MOCK=true`
  - `true`: 목(Mock) 모드로 동작
  - `false`: 백엔드 `/auth/pass/*` 실제 연동 엔드포인트 호출

## 3) 백엔드 엔드포인트

### 3-1) 인증 시작
- `POST /auth/pass/start`
- Request
```json
{
  "phone": "01012345678",
  "purpose": "WISHLIST"
}
```
- Response
```json
{
  "txId": "PASS_TX_20260228120000_001",
  "status": "PENDING",
  "authUrl": "https://pass-provider.example.com/auth/redirect"
}
```

### 3-2) 인증 결과 조회
- `GET /auth/pass/result?txId=PASS_TX_20260228120000_001`
- Response (성공)
```json
{
  "txId": "PASS_TX_20260228120000_001",
  "status": "VERIFIED",
  "verifiedAt": "2026-02-28T12:01:09.000Z",
  "message": "OK",
  "user": {
    "name": "홍길동",
    "phone": "01012345678",
    "phoneMasked": "010-****-5678",
    "ci": "CI_VALUE",
    "di": "DI_VALUE"
  }
}
```
- Response (진행중)
```json
{
  "txId": "PASS_TX_20260228120000_001",
  "status": "PENDING",
  "message": "인증 진행중"
}
```
- Response (실패/거절/만료)
```json
{
  "txId": "PASS_TX_20260228120000_001",
  "status": "FAILED",
  "message": "사용자 취소"
}
```

## 4) 프론트 처리 규칙
- 인증 시작 전에 휴대폰 번호 숫자 10~11자리 검증
- `status=VERIFIED`일 때만 인증 성공 처리
- 인증 성공 상태는 세션에 저장하고 30분 TTL 적용
- 인증 실패/만료/거절 시 기능 접근 거부

## 5) 현재 구현 위치
- API: `src/features/member/api/passAuthApi.js`
- Hook: `src/features/member/hooks/usePassVerification.js`
- 검색 결과 UI 연동:
  - `src/features/houseAndRoom/pages/Search.jsx`
  - `src/features/houseAndRoom/components/Search/ResultList.jsx`
  - `src/features/houseAndRoom/components/Search/ResultItem.jsx`
- 회원 인증 UI 연동:
  - `src/features/member/hooks/useUserHooks.js`
  - `src/features/member/pages/Signup.jsx`
  - `src/features/member/pages/FindId.jsx`
  - `src/features/member/pages/FindPassword.jsx`
