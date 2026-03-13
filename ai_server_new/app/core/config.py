from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    
    # ===== Providers =====
    LLM_PROVIDER: str = Field(default='mock', description='mock | watsonx | gemini | groq')
    EMBEDDING_PROVIDER: str = Field(default='mock', description='mock | openai')
    STT_PROVIDER: str = Field(default='mock', description='mock | watson')
    TTS_PROVIDER: str = Field(default='mock', description='mock | azure')
    CAPTION_PROVIDER: str = Field(default='mock', description='mock | qwen')
    OBJECT_DETECTION_PROVIDER: str = Field(default='mock', description='mock | groundingdino')
    OCR_PROVIDER: str = Field(default='mock', description='mock | paddleocr')
    SENTIMENT_PROVIDER: str = Field(default='mock', description='mock | kobert')

    # ===== watsonx =====
    WATSONX_APIKEY: str | None = None
    WATSONX_PROJECT_ID: str | None = None
    WATSONX_URL: str | None = None
    WATSONX_CHAT_MODEL_ID: str | None = None
    WATSONX_EMBED_MODEL_ID: str | None = None

    # ===== Gemini =====
    GOOGLE_API_KEY: str | None = None
    GEMINI_CHAT_MODEL: str = 'gemini-2.5-flash'
    GEMINI_EMBED_MODEL: str = 'gemini-embedding-001'

    # ===== Groq =====
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = 'llama-3.1-8b-instant'
    GROQ_VISION_MODEL: str = 'meta-llama/llama-4-scout-17b-16e-instruct'
    
    # ==== GroundingDINO ====
    GROUNDINGDINO_BASE_URL: str = 'http://localhost:8000'
    GROUNDINGDINO_TIMEOUT: int = 30
    GROUNDINGDINO_BOX_THRESHOLD: float = 0.30
    GROUNDINGDINO_TEXT_THRESHOLD: float = 0.25

    # ===== OpenAI embedding =====
    OPENAI_API_KEY: str | None = None
    OPENAI_BASE_URL: str = 'https://api.openai.com/v1'
    OPENAI_EMBED_MODEL: str = 'text-embedding-3-small'

    # ===== Internal security =====
    APP_API_KEY: str = 'local-dev-key'

    # ===== Vector store =====
    CHROMA_DIR: str = './chroma_data'
    CHROMA_COLLECTION: str = 'woorizip'

    # ===== Tool execution =====
    TOOL_EXECUTION_MODE: str = Field(default='plan', description='plan | execute')
    SPRING_BASE_URL: str | None = None
    SPRING_INTERNAL_API_KEY: str | None = None

    # ===== Audio =====
    DEFAULT_TTS_VOICE: str = 'ko-KR-SunHiNeural'
    DEFAULT_AUDIO_FORMAT: str = 'wav'
    AZURE_TTS_ENDPOINT: str | None = None
    AZURE_TTS_REGION: str | None = None
    AZURE_TTS_API_KEY: str | None = None
    AZURE_TTS_OUTPUT_FORMAT: str = 'audio-24khz-48kbitrate-mono-mp3'

    # ===== Assistant =====
    AI_AGENT_ENDPOINT: str | None = None
    AI_AGENT_ENDPOINT_PATH: str | None = None
    AI_AGENT_MODEL: str = 'gpt-4o-mini'
    AI_AGENT_SYSTEM_PROMPT: str | None = None
    AI_AGENT_BASE_INFO: str | None = None
    AI_AGENT_AUTH_MODE: str = 'api_key'
    AI_AGENT_API_KEY: str | None = None
    AI_AGENT_BEARER_TOKEN: str | None = None
    AI_AGENT_API_VERSION: str | None = None
    AI_AGENT_TIMEOUT_MS: int = 15000

    # ===== Misc =====
    DEFAULT_TIMEZONE: str = 'Asia/Seoul'
    LOG_LEVEL: str = 'INFO'

    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    def validate(self) -> None:
        if self.LLM_PROVIDER.lower() == 'watsonx':
            missing = [
                k for k in ['WATSONX_APIKEY', 'WATSONX_PROJECT_ID', 'WATSONX_URL', 'WATSONX_CHAT_MODEL_ID']
                if not getattr(self, k)
            ]
            if missing:
                raise RuntimeError('LLM_PROVIDER=watsonx 이지만 환경변수 누락: ' + ', '.join(missing))

        if self.LLM_PROVIDER.lower() == 'gemini' and not self.GOOGLE_API_KEY:
            raise RuntimeError('LLM_PROVIDER=gemini 이면 GOOGLE_API_KEY 가 필요합니다.')

        if self.LLM_PROVIDER.lower() == 'groq' and not self.GROQ_API_KEY:
            raise RuntimeError('LLM_PROVIDER=groq 이면 GROQ_API_KEY 가 필요합니다.')
        
        if self.OBJECT_DETECTION_PROVIDER.lower() == 'groundingdino' and not self.GROUNDINGDINO_BASE_URL:
            raise RuntimeError('OBJECT_DETECTION_PROVIDER=groundingdino 이면 GROUNDINGDINO_BASE_URL 이 필요합니다.')

        if self.EMBEDDING_PROVIDER.lower() == 'openai' and not self.OPENAI_API_KEY:
            raise RuntimeError('EMBEDDING_PROVIDER=openai 이면 OPENAI_API_KEY 가 필요합니다.')

        if self.TOOL_EXECUTION_MODE.lower() == 'execute' and not self.SPRING_BASE_URL:
            raise RuntimeError('TOOL_EXECUTION_MODE=execute 이면 SPRING_BASE_URL 이 필요합니다.')


settings = Settings()
