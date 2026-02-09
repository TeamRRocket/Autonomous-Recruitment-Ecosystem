import json
from typing import Any, Dict
import requests

from .prompt import build_resume_extraction_prompt
from .schema import normalize_resume_payload, empty_resume_schema


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "anthropic/claude-3.5-sonnet"


def _parse_json_response(content: str) -> Dict[str, Any]:
    text = content.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def extract_resume_json(raw_text: str, api_key: str) -> Dict[str, Any]:
    """Use Claude Sonnet 3.5 to extract a normalized resume JSON schema."""
    if not raw_text:
        return empty_resume_schema(raw_text="")

    prompt = build_resume_extraction_prompt(raw_text)
    try:
        response = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "HireFlow AI",
            },
            json={
                "model": MODEL_NAME,
                "messages": [
                    {"role": "system", "content": prompt["system"]},
                    {"role": "user", "content": prompt["user"]},
                ],
                "temperature": 0,
                "max_tokens": 2000,
            },
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        if "choices" not in payload or not payload["choices"]:
            return empty_resume_schema(raw_text=raw_text)
        content = payload["choices"][0]["message"]["content"]
        parsed = _parse_json_response(content)
        return normalize_resume_payload(parsed, raw_text=raw_text)
    except Exception:
        return empty_resume_schema(raw_text=raw_text)
