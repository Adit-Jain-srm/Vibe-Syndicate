from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class Config:
    """Syndicate agent configuration — loaded from environment."""

    # Band.ai
    band_ws_url: str = "wss://app.band.ai/api/v1/socket/websocket"
    band_rest_url: str = "https://app.band.ai/"

    # Google Gemini (primary agents)
    google_api_key: str = ""
    gemini_model_coordinator: str = "gemini-2.5-flash"
    gemini_model_specialist: str = "gemini-2.5-flash"

    # Azure OpenAI (adversarial reviewer - different model family)
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment: str = "gpt-4o"
    azure_openai_api_version: str = "2025-01-01-preview"

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""

    @classmethod
    def load(cls) -> Config:
        return cls(
            band_ws_url=os.getenv("BAND_WS_URL", cls.band_ws_url),
            band_rest_url=os.getenv("BAND_REST_URL", cls.band_rest_url),
            google_api_key=os.getenv("GOOGLE_API_KEY", ""),
            gemini_model_coordinator=os.getenv(
                "GEMINI_MODEL_COORDINATOR", cls.gemini_model_coordinator
            ),
            gemini_model_specialist=os.getenv(
                "GEMINI_MODEL_SPECIALIST", cls.gemini_model_specialist
            ),
            azure_openai_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT", ""),
            azure_openai_api_key=os.getenv("AZURE_OPENAI_API_KEY", ""),
            azure_openai_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT", cls.azure_openai_deployment),
            azure_openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION", cls.azure_openai_api_version),
            supabase_url=os.getenv("SUPABASE_URL", ""),
            supabase_key=os.getenv("SUPABASE_KEY", ""),
        )
