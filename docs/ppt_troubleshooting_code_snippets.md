# PPT Troubleshooting Code Snippets

## 1. 챗봇 Before

```python



def build_instruction(text: str, context: dict[str, Any]) -> str:
    user_text = compact_text(text, MAX_TEXT_LENGTH)
    parts = [user_text]
    compact = user_text.lower().replace(' ', '')

    if any(keyword.replace(' ', '') in compact for keyword in TOUR_APPLY_KEYWORDS):
        parts.append(
            '\n'.join(
                [
                    '[WORKFLOW_HINT]',
                    'intent: TOUR_APPLY',
                    'route: azure_workflow',
                    'required_slots: roomNo, preferredVisitAt',
                    'instruction: roomNo가 있으면 현재 방 기준으로 바로 투어 신청 워크플로로 진입하세요.',
                    '[/WORKFLOW_HINT]',
                ]
            )
        )

    return '\n\n'.join(part for part in parts if part)



```

## 2. 챗봇 After

```python



PAGE_NAVIGATION_KEYWORDS = (
    '이동', '가줘', '가고싶', '가고싶어', '들어가', '열어', '보여줘',
    '페이지', '화면', '목록', '바로가기', '안내'
)

def should_include_navigation_context(text: str) -> bool:
    compact = compact_text(text, MAX_TEXT_LENGTH).lower().replace(' ', '')
    return any(keyword.replace(' ', '') in compact for keyword in PAGE_NAVIGATION_KEYWORDS)

def build_instruction(text: str, context: dict[str, Any]) -> str:
    available_page_targets = context.get('availablePageTargets') or []
    if available_page_targets and should_include_navigation_context(text):
        parts.append('[PAGE_NAVIGATION_HINT]')
        parts.append('intent: NAVIGATE')
        parts.append('route: azure_workflow')
        parts.append('instruction: 사용자가 페이지 이동을 원하면 action.name= NAVIGATE, action.path=해당 경로로 응답하세요.')



```

```jsx




const navigationContext = getCurrentPageNavigationContext(
  window.location.pathname,
  roomContext
);

const result = await runOrchestrateCommand({
  text: messageText,
  sessionId: requestSessionId,
  context: {
    path: window.location.pathname,
    ...roomContext,
    currentRoomResolved: Boolean(roomContext.roomNo),
    availablePageTargets: PAGE_NAVIGATION_TARGETS,
    navigationContext,
  },
});

handleAssistantNavigateAction(result, actionIds);




```

## 3. 음성 Before

```python




from app.clients.azure_tts_client import AzureSpeechTTSClient
from app.clients.mock_clients import MockSpeechToTextClient

def build_stt_client():
    return MockSpeechToTextClient()

def build_tts_client():
    provider = (settings.TTS_PROVIDER or 'mock').strip().lower()
    if provider == 'azure':
        return AzureSpeechTTSClient()
    return AzureSpeechTTSClient()

STT_PROVIDER: str = Field(default="mock", description="mock | watson")
TTS_PROVIDER: str = Field(default="mock", description="mock | azure")
DEFAULT_TTS_VOICE: str = "sage"




```

## 4. 음성 After

```python




from app.clients.google_stt_client import GoogleCloudSTTClient
from app.clients.google_tts_client import GoogleCloudTTSClient

def build_stt_client():
    provider = (settings.STT_PROVIDER or 'google').strip().lower()
    if provider == 'google':
        return GoogleCloudSTTClient()

def build_tts_client():
    provider = (settings.TTS_PROVIDER or 'google').strip().lower()
    if provider == 'google':
        return GoogleCloudTTSClient()

STT_PROVIDER: str = Field(default="google", description="google")
TTS_PROVIDER: str = Field(default="google", description="google")
DEFAULT_TTS_VOICE: str = "ko-KR-Neural2-A"
GOOGLE_APPLICATION_CREDENTIALS: str | None = None

if self.TTS_PROVIDER.lower() == "google" or self.STT_PROVIDER.lower() == "google":
    if not self.GOOGLE_APPLICATION_CREDENTIALS and not self.GOOGLE_SERVICE_ACCOUNT_JSON:
        raise RuntimeError("Google Cloud 음성을 사용하려면 인증 정보가 필요합니다.")




```

## 5. EC2 설정

```env




STT_PROVIDER=google
TTS_PROVIDER=google
DEFAULT_TTS_VOICE=ko-KR-Neural2-A
GOOGLE_APPLICATION_CREDENTIALS=/opt/myapp/env/woorizipproject-12982f92b809.json




```
