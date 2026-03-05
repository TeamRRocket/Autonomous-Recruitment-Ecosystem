"""Centralized LLM API client"""
import requests
from typing import Dict, List, Any, Optional
from ..config import config


def call_ollama_api(
    messages: List[Dict[str, str]],
    model: str = "mistral",
    temperature: float = 0.3,
    timeout: int = 30
) -> Dict[str, Any]:
    """
    Call local Ollama API with standardized configuration.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        model: Model identifier (default: mistral)
        temperature: Sampling temperature (0-1)
        timeout: Request timeout in seconds
        
    Returns:
        Response JSON from Ollama API (converted to OpenRouter format)
        
    Raises:
        requests.HTTPError: If request fails
        requests.Timeout: If request times out
    """
    response = requests.post(
        config.OLLAMA_URL,
        headers={
            "Content-Type": "application/json"
        },
        json={
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature
            }
        },
        timeout=timeout
    )
    
    response.raise_for_status()
    ollama_response = response.json()
    
    # Convert Ollama response format to OpenRouter format for compatibility
    return {
        "choices": [
            {
                "message": {
                    "content": ollama_response.get("message", {}).get("content", "")
                }
            }
        ]
    }


def call_openrouter_api(
    api_key: str,
    messages: List[Dict[str, str]],
    model: str = "anthropic/claude-3.5-sonnet",
    temperature: float = 0.3,
    max_tokens: int = 2000,
    timeout: int = 30
) -> Dict[str, Any]:
    """
    Call OpenRouter API with standardized configuration.
    
    Args:
        api_key: OpenRouter API key
        messages: List of message dicts with 'role' and 'content'
        model: Model identifier (default: Claude 3.5 Sonnet)
        temperature: Sampling temperature (0-1)
        max_tokens: Maximum tokens to generate
        timeout: Request timeout in seconds
        
    Returns:
        Response JSON from OpenRouter API
        
    Raises:
        requests.HTTPError: If request fails
        requests.Timeout: If request times out
    """
    response = requests.post(
        config.OPENROUTER_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "HireFlow AI"
        },
        json={
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        },
        timeout=timeout
    )
    
    response.raise_for_status()
    return response.json()


def call_llm_api(
    messages: List[Dict[str, str]],
    temperature: float = 0.3,
    max_tokens: int = 2000,
    timeout: int = 30,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Unified LLM API caller - automatically chooses between local Ollama or OpenRouter.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        temperature: Sampling temperature (0-1)
        max_tokens: Maximum tokens to generate
        timeout: Request timeout in seconds
        api_key: OpenRouter API key (only needed if not using local model)
        
    Returns:
        Response JSON in standardized format
        
    Raises:
        requests.HTTPError: If request fails
        requests.Timeout: If request times out
    """
    if config.USE_LOCAL_MODEL:
        print(f"🤖 Using local model: {config.LOCAL_MODEL}")
        return call_ollama_api(
            messages=messages,
            model=config.LOCAL_MODEL,
            temperature=temperature,
            timeout=timeout
        )
    else:
        print(f"☁️  Using OpenRouter: {config.DEFAULT_MODEL}")
        if not api_key:
            api_key = config.OPENROUTER_API_KEY
        return call_openrouter_api(
            api_key=api_key,
            messages=messages,
            model=config.DEFAULT_MODEL,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=timeout
        )


def extract_llm_content(response_json: Dict[str, Any]) -> Optional[str]:
    """
    Extract content from OpenRouter API response.
    
    Args:
        response_json: Response JSON from OpenRouter API
        
    Returns:
        Extracted content string or None if not found
    """
    if "choices" not in response_json or not response_json["choices"]:
        return None
    
    return response_json["choices"][0]["message"]["content"]
