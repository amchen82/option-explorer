import json

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://postgres:postgres@localhost:5432/options_tool"
    secret_key: str = "change-me-in-production"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""
    market_data_cache_ttl_seconds: int = 900
    historical_data_cache_ttl_seconds: int = 3600

    @property
    def cors_origins_list(self) -> list[str]:
        value = self.cors_origins.strip()

        if value.startswith("["):
            parsed = json.loads(value)
            return [origin.strip() for origin in parsed if isinstance(origin, str) and origin.strip()]

        return [origin.strip() for origin in value.split(",") if origin.strip()]


settings = Settings()
