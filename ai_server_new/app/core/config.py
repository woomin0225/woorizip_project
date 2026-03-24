# app/core/config.py

from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # ===== Providers =====
    LLM_PROVIDER: str = Field(default="groq", description="mock | watsonx | gemini | groq")
    EMBEDDING_PROVIDER: str = Field(default="mock", description="mock | openai")
    STT_PROVIDER: str = Field(default="google", description="google")
    TTS_PROVIDER: str = Field(default="google", description="google")
    CAPTION_PROVIDER: str = Field(default="qwen", description="mock | qwen")
    OBJECT_DETECTION_PROVIDER: str = Field(default="groundingdino", description="mock | groundingdino")
    OCR_PROVIDER: str = Field(default="paddleocr", description="mock | paddleocr")
    SENTIMENT_PROVIDER: str = Field(default="mock", description="mock | kobert")

    # ===== watsonx =====
    WATSONX_APIKEY: str | None = None
    WATSONX_PROJECT_ID: str | None = None
    WATSONX_URL: str | None = None
    WATSONX_CHAT_MODEL_ID: str | None = None
    WATSONX_EMBED_MODEL_ID: str | None = None

    # ===== Groq =====
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    GROQ_VISION_MODEL: str = "meta-llama/llama-4-scout-17b-16e-instruct"

    # ===== GroundingDINO =====
    GROUNDINGDINO_CONFIG_PATH: str = "GroundingDINO/groundingdino/config/GroundingDINO_SwinT_OGC.py"
    GROUNDINGDINO_CHECKPOINT_PATH: str = "GroundingDINO/weights/groundingdino_swint_ogc.pth"
    GROUNDINGDINO_DEVICE: str = "cpu"
    GROUNDINGDINO_BASE_URL: str = "http://localhost:8000"
    GROUNDINGDINO_TIMEOUT: int = 30
    GROUNDINGDINO_BOX_THRESHOLD: float = 0.30
    GROUNDINGDINO_TEXT_THRESHOLD: float = 0.25

    # ===== OpenAI embedding =====
    OPENAI_API_KEY: str | None = None
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_EMBED_MODEL: str = "text-embedding-3-small"

    # ===== Internal security =====
    APP_API_KEY: str = "local-dev-key"

    # ===== Vector store =====
    QDRANT_URL: str = "https://67244007-2025-4429-8b6c-764e71885a21.sa-east-1-0.aws.cloud.qdrant.io:6333"
    QDRANT_APIKEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.Jj_WYSz2iWyht8ki9B2Q4uhdJ-WkGQpFLZo3bF54nmM"

    # ===== Tool execution =====
    TOOL_EXECUTION_MODE: str = Field(default="plan", description="plan | execute")
    SPRING_BASE_URL: str | None = None
    SPRING_INTERNAL_API_KEY: str | None = None

    # ===== Audio =====
    DEFAULT_TTS_VOICE: str = "ko-KR-Standard-A"
    DEFAULT_AUDIO_FORMAT: str = "mp3"
    DEFAULT_STT_LANGUAGE: str = "ko-KR"
    GOOGLE_APPLICATION_CREDENTIALS: str | None = None
    GOOGLE_SERVICE_ACCOUNT_JSON: str | None = None
    GOOGLE_CLOUD_PROJECT: str | None = None
    GOOGLE_STT_LANGUAGE_CODE: str = "ko-KR"
    GOOGLE_STT_MODEL: str = "latest_long"
    GOOGLE_TTS_LANGUAGE_CODE: str = "ko-KR"
    GOOGLE_TTS_SPEAKING_RATE: float = 1.0

    # ===== Assistant =====
    AI_AGENT_ENDPOINT: str | None = None
    AI_AGENT_ENDPOINT_PATH: str | None = None
    AI_AGENT_MODEL: str = "gpt-4o-mini"
    AI_AGENT_SYSTEM_PROMPT: str | None = None
    AI_AGENT_BASE_INFO: str | None = None
    AI_AGENT_AUTH_MODE: str = "api_key"
    AI_AGENT_API_KEY: str | None = None
    AI_AGENT_BEARER_TOKEN: str | None = None
    AI_AGENT_API_VERSION: str | None = None
    AI_AGENT_TIMEOUT_MS: int = 15000

    # ===== Misc =====
    DEFAULT_TIMEZONE: str = "Asia/Seoul"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def groundingdino_config_abs_path(self) -> str:
        return str((BASE_DIR / self.GROUNDINGDINO_CONFIG_PATH).resolve())

    @property
    def groundingdino_checkpoint_abs_path(self) -> str:
        return str((BASE_DIR / self.GROUNDINGDINO_CHECKPOINT_PATH).resolve())

    def validate(self) -> None:
        if self.LLM_PROVIDER.lower() == "watsonx":
            missing = [
                k
                for k in ["WATSONX_APIKEY", "WATSONX_PROJECT_ID", "WATSONX_URL", "WATSONX_CHAT_MODEL_ID"]
                if not getattr(self, k)
            ]
            if missing:
                raise RuntimeError("LLM_PROVIDER=watsonx 이지만 환경변수 누락: " + ", ".join(missing))

        if self.LLM_PROVIDER.lower() == "gemini" and not self.GOOGLE_API_KEY:
            raise RuntimeError("LLM_PROVIDER=gemini 이면 GOOGLE_API_KEY 가 필요합니다.")

        if self.LLM_PROVIDER.lower() == "groq" and not self.GROQ_API_KEY:
            raise RuntimeError("LLM_PROVIDER=groq 이면 GROQ_API_KEY 가 필요합니다.")

        if self.OBJECT_DETECTION_PROVIDER.lower() == "groundingdino":
            if not self.GROUNDINGDINO_CONFIG_PATH:
                raise RuntimeError("GROUNDINGDINO_CONFIG_PATH 가 필요합니다.")
            if not self.GROUNDINGDINO_CHECKPOINT_PATH:
                raise RuntimeError("GROUNDINGDINO_CHECKPOINT_PATH 가 필요합니다.")

            if not Path(self.groundingdino_config_abs_path).exists():
                raise RuntimeError(
                    f"GroundingDINO config 파일을 찾을 수 없습니다: {self.groundingdino_config_abs_path}"
                )

            if not Path(self.groundingdino_checkpoint_abs_path).exists():
                raise RuntimeError(
                    f"GroundingDINO checkpoint 파일을 찾을 수 없습니다: {self.groundingdino_checkpoint_abs_path}"
                )

        if self.EMBEDDING_PROVIDER.lower() == "openai" and not self.OPENAI_API_KEY:
            raise RuntimeError("EMBEDDING_PROVIDER=openai 이면 OPENAI_API_KEY 가 필요합니다.")

        if self.TOOL_EXECUTION_MODE.lower() == "execute" and not self.SPRING_BASE_URL:
            raise RuntimeError("TOOL_EXECUTION_MODE=execute 이면 SPRING_BASE_URL 이 필요합니다.")

        if self.TTS_PROVIDER.lower() == "google" or self.STT_PROVIDER.lower() == "google":
            if not self.GOOGLE_APPLICATION_CREDENTIALS and not self.GOOGLE_SERVICE_ACCOUNT_JSON:
                raise RuntimeError(
                    "Google Cloud 음성을 사용하려면 GOOGLE_APPLICATION_CREDENTIALS 또는 "
                    "GOOGLE_SERVICE_ACCOUNT_JSON 이 필요합니다."
                )


settings = Settings()


