import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Brightloop Novelty Modules"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/novelties"
    ENVIRONMENT: str = "development"

    # Security — must match main app for token compatibility when integrated
    SECRET_KEY: str = "brightloop-super-secure-production-secret-key-2026-xyz"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Isolated novelty database — NEVER shares with main brightloop.db
    DATABASE_URL: str = "sqlite:///./novelty_modules.db"

    # Minimum margin guardrail default (percent)
    MIN_MARGIN_PERCENT: float = 15.0

    CORS_ORIGINS: str = "http://localhost:5174,http://localhost:5173,http://127.0.0.1:5174"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
