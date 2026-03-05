"""Centralized configuration for AI service"""
import os
from typing import Optional


class Config:
    """Application configuration"""
    
    # API Keys (not needed for local Ollama)
    OPENROUTER_API_KEY: Optional[str] = os.getenv("OPENROUTER_API_KEY")
    
    # API URLs
    # Using local Ollama instead of OpenRouter
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")
    OPENROUTER_URL: str = "https://openrouter.ai/api/v1/chat/completions"  # Fallback
    
    # Model configurations
    USE_LOCAL_MODEL: bool = os.getenv("USE_LOCAL_MODEL", "true").lower() == "true"
    LOCAL_MODEL: str = os.getenv("LOCAL_MODEL", "mistral")
    DEFAULT_MODEL: str = "anthropic/claude-3.5-sonnet"  # Fallback for OpenRouter
    DEFAULT_TEMPERATURE: float = 0.3
    DEFAULT_MAX_TOKENS: int = 2000
    DEFAULT_TIMEOUT: int = 30
    
    # Service settings
    APP_TITLE: str = "HireFlow AI - Hybrid Matching Service"
    APP_VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Proctoring settings
    PROCTORING_ENABLED: bool = True
    
    # Scoring weights
    SKILL_WEIGHT: float = 0.5
    EXPERIENCE_WEIGHT: float = 0.3
    EDUCATION_WEIGHT: float = 0.2
    
    # Risk thresholds
    RISK_LOW_THRESHOLD: int = 40
    RISK_MEDIUM_THRESHOLD: int = 70
    
    @classmethod
    def is_llm_configured(cls) -> bool:
        """Check if LLM API is properly configured"""
        # If using local model, always return True
        if cls.USE_LOCAL_MODEL:
            return True
        # Otherwise check for OpenRouter API key
        return bool(cls.OPENROUTER_API_KEY)


# Create singleton instance
config = Config()
