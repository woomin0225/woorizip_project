# Woorizip

Woorizip은 코리빙 하우스 사용자를 위한 공유주거 플랫폼입니다. 매물 탐색, AI 상담, 투어 신청, 계약, 커뮤니티, 공용시설 예약 기능을 하나의 서비스 흐름으로 연결하는 것을 목표로 개발했습니다. 프로젝트는 React 프론트엔드, Spring Boot 백엔드, FastAPI 기반 AI 서버로 분리되어 있습니다.

## 아키텍처

```mermaid
flowchart LR
    User["사용자 브라우저"] --> Frontend["React Frontend\nfrontend_workspace"]
    Frontend --> Backend["Spring Boot API\nbackend_workspace"]
    Backend --> MySQL["MySQL"]
    Backend --> FastAPI["FastAPI AI Server\nai_server_new"]
    FastAPI --> Qdrant["Qdrant Vector DB"]
    FastAPI --> LLM["LLM / Agent Providers"]
    FastAPI --> STT["STT / TTS Providers"]
    Backend --> Storage["Upload / Contract File Storage"]
    Frontend --> S3["AWS S3 + CloudFront"]
    Backend --> EC2Spring["AWS EC2 Spring"]
    FastAPI --> EC2FastAPI["AWS EC2 FastAPI"]
```

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | React 18, JavaScript, React Router, Axios, Reactstrap, TipTap |
| Backend | Java 21, Spring Boot 3.5, Spring Security, OAuth2 Client, JWT, JPA, QueryDSL, Gradle |
| AI Server | Python, FastAPI, LangGraph, Groq/OpenAI 호환 Agent Client, STT/TTS, OCR/Vision 모듈 |
| Database / Vector Store | MySQL, Qdrant |
| Deploy | GitHub Actions, AWS S3, CloudFront, EC2, SSM, RDS 호환 MySQL |

## 프로젝트 구조

```text
woorizip_project
|-- frontend_workspace   # React 클라이언트
|-- backend_workspace    # Spring Boot API 서버
|-- ai_server_new        # FastAPI AI 서버
`-- .github              # CI/CD 워크플로우와 배포 스크립트
```

## 주요 기능

- 회원가입, 로그인, 소셜 로그인, 아이디/비밀번호 찾기, JWT 인증
- 방/건물 검색, 등록, 상세 조회, 찜, 리뷰 기반 탐색
- 프론트엔드 채팅 UI, Spring Boot, FastAPI를 연결한 AI 챗봇
- 채팅으로 방문 일정과 사용자 정보를 수집하는 AI 투어 신청 워크플로
- STT/TTS 기반 음성 접근성 및 페이지 요약 기능
- 공지사항, 정보 게시판, 이벤트, Q&A, AI 게시글 요약
- 코리빙 공용시설 및 예약 관리
- 계약 및 결제 관련 워크플로
- 프론트엔드, 백엔드, AI 서버 분리 배포 파이프라인

## 로컬 실행 방법

### 1. Backend

필수 환경:

- Java 21
- MySQL

```bash
cd backend_workspace
./gradlew bootRun
```

백엔드는 데이터베이스, JWT, OAuth, 결제, AI 연동 값을 환경변수로 사용합니다. 필요한 변수명은 `backend_workspace/src/main/resources/application.properties`에서 확인할 수 있습니다.

주요 환경변수 예시:

```bash
DB_USERNAME=root
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
KAKAO_REST_API_KEY=your_kakao_key
KAKAOMAP_REST_API_KEY=your_kakaomap_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
KAKAO_CLIENT_SECRET=your_kakao_client_secret
AI_AGENT_API_KEY=your_ai_agent_api_key
```

### 2. Frontend

필수 환경:

- Node.js 20 이상
- npm

```bash
cd frontend_workspace
npm install
npm start
```

선택 환경변수:

```bash
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_AI_BASE_URL=http://localhost:8080
REACT_APP_KAKAO_MAP_KEY=your_kakao_map_key
REACT_APP_TOSS_CLIENT_KEY=your_toss_client_key
```

### 3. AI Server

필수 환경:

- Python 3.11 이상
- pip

```bash
cd ai_server_new
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Windows PowerShell:

```powershell
cd ai_server_new
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

주요 환경변수 예시:

```bash
APP_API_KEY=local-dev-key
GROQ_API_KEY=your_groq_key
QDRANT_URL=your_qdrant_url
QDRANT_APIKEY=your_qdrant_api_key
SPRING_BASE_URL=http://localhost:8080
SPRING_INTERNAL_API_KEY=local-dev-key
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

일부 AI Vision 기능은 GroundingDINO 가중치와 같은 추가 모델 파일이 필요합니다. 자세한 내용은 `ai_server_new/requirements.txt`의 주석을 참고하세요.

## 배포

각 워크스페이스는 GitHub Actions를 통해 독립적으로 배포됩니다.

| Workflow | 대상 |
| --- | --- |
| `.github/workflows/frontend-deploy.yml` | React 빌드 후 AWS S3 업로드 및 CloudFront 무효화 |
| `.github/workflows/spring-deploy.yml` | Spring Boot JAR 업로드 후 AWS SSM으로 EC2 재시작 |
| `.github/workflows/fastapi-deploy.yml` | FastAPI ZIP 파일 업로드 후 AWS SSM으로 EC2 재시작 |

운영 환경의 민감 정보와 배포 설정은 GitHub Actions Secrets와 AWS SSM Parameter Store를 통해 관리합니다.

## 브랜치 전략

- `main`: 운영/기본 브랜치
- `develop`: 기능 통합 브랜치
- `feature/*` 및 팀원별 브랜치: 기능 개발 및 협업 브랜치

## 개인 기여 포인트

이 포트폴리오에서 중점적으로 설명하는 개인 기여 영역은 다음과 같습니다.

- Spring Security와 JWT 기반 인증 및 로그인 세션 흐름 구현
- React, Spring Boot, FastAPI를 연결한 AI 챗봇 요청 흐름 구성
- AI 투어 신청 워크플로에서 `sessionId`, `userId`, 사용자 정보를 연결하는 흐름 구현
- STT/TTS 기반 음성 접근성 기능 구현
- GitHub Actions와 AWS 기반 배포/운영 흐름 정리
