# app/core/config.py

from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    
    # ===== Providers =====
    LLM_PROVIDER: str = Field(default='groq', description='groq')
    CAPTION_PROVIDER: str = Field(default='qwen', description='qwen')
    OBJECT_DETECTION_PROVIDER: str = Field(default='groundingdino', description='groundingdino')
    OCR_PROVIDER: str = Field(default='paddleocr', description='paddleocr')

    # ===== Groq =====
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = 'llama-3.1-8b-instant'
    GROQ_VISION_MODEL: str = 'meta-llama/llama-4-scout-17b-16e-instruct'
    
    # ==== GroundingDINO ====
    GROUNDINGDINO_CONFIG_PATH: str = 'GroundingDINO/groundingdino/config/GroundingDINO_SwinT_OGC.py'
    GROUNDINGDINO_CHECKPOINT_PATH: str = 'GroundingDINO/weights/groundingdino_swint_ogc.pth'
    GROUNDINGDINO_DEVICE: str = "cpu"
    GROUNDINGDINO_TIMEOUT: int = 30
    GROUNDINGDINO_BOX_THRESHOLD: float = 0.30
    GROUNDINGDINO_TEXT_THRESHOLD: float = 0.25

    # ===== Internal security =====
    APP_API_KEY: str = 'local-dev-key'

    model_config = SettingsConfigDict(env_file='.env', extra='ignore')
    
    @property
    def groundingdino_config_abs_path(self) -> str:
        return str((BASE_DIR / self.GROUNDINGDINO_CONFIG_PATH).resolve())
    
    @property
    def groundingdino_checkpoint_abs_path(self) -> str:
        return str((BASE_DIR / self.GROUNDINGDINO_CHECKPOINT_PATH).resolve())

    def validate(self) -> None:
        if self.LLM_PROVIDER.lower() == 'groq' and not self.GROQ_API_KEY:
            raise RuntimeError('LLM_PROVIDER=groq 이면 GROQ_API_KEY 가 필요합니다.')
        
        if self.OBJECT_DETECTION_PROVIDER.lower() == 'groundingdino':
            if not self.GROUNDINGDINO_CONFIG_PATH:
                raise RuntimeError('GROUNDINGDINO_CONFIG_PATH 가 필요합니다.')
            if not self.GROUNDINGDINO_CHECKPOINT_PATH:
                raise RuntimeError('GROUNDINGDINO_CHECKPOINT_PATH 가 필요합니다.')
            
            if not Path(self.groundingdino_config_abs_path).exists():
                raise RuntimeError(
                    f'GroundingDINO config 파일을 찾을 수 없습니다: {self.groundingdino_config_abs_path}'
                )
                
            if not Path(self.groundingdino_checkpoint_abs_path).exists():
                raise RuntimeError(
                    f'GroundingDINO checkpoint 파일을 찾을 수 없습니다: {self.groundingdino_checkpoint_abs_path}'
                )


settings = Settings()