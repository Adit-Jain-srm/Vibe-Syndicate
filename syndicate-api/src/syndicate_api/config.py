from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://localhost:5432/syndicate"

    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""
    clerk_jwt_verification_key: str = ""

    band_rest_url: str = "https://app.band.ai/"
    band_ws_url: str = "wss://app.band.ai/api/v1/socket/websocket"

    google_api_key: str = ""
    anthropic_api_key: str = ""

    supabase_url: str = ""
    supabase_key: str = ""

    web_app_origin: str = "http://localhost:5173"
    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
