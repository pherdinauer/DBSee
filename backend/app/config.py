from pydantic_settings import BaseSettings
from typing import List
from pydantic import field_validator


class Settings(BaseSettings):
    # Database
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = "password"
    db_name: str = "test"
    db_min_connections: int = 1
    db_max_connections: int = 10

    # JWT
    jwt_secret_key: str = "default-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    # CORS
    allowed_origins: str = "http://localhost:3000"
    
    @field_validator('allowed_origins', mode='after')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v if isinstance(v, list) else [v]

    # Application
    debug: bool = True
    log_level: str = "info"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # Rate Limiting
    rate_limit_per_minute: int = 100

    # Pagination
    default_page_size: int = 20
    max_page_size: int = 100

    @property
    def database_url(self) -> str:
        return f"mysql+pymysql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    class Config:
        case_sensitive = False
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings() 