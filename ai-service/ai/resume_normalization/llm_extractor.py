from typing import Any, Dict

from ..config import config
from ..utils import parse_json_response, call_llm_api
from ..utils.llm_client import extract_llm_content
from .prompt import build_resume_extraction_prompt
from .schema import normalize_resume_payload, empty_resume_schema


def extract_resume_json(raw_text: str, api_key: str) -> Dict[str, Any]:
    """Use Claude Sonnet 3.5 to extract a normalized resume JSON schema."""
    if not raw_text:
        return empty_resume_schema(raw_text="")

    prompt = build_resume_extraction_prompt(raw_text)
    try:
        response_json = call_llm_api(
            messages=[
                {"role": "system", "content": prompt["system"]},
                {"role": "user", "content": prompt["user"]},
            ],
            temperature=0,
            max_tokens=2000
        )
        content = extract_llm_content(response_json)
        if not content:
            return empty_resume_schema(raw_text=raw_text)
        parsed = parse_json_response(content)
        return normalize_resume_payload(parsed, raw_text=raw_text)
    except Exception:
        return empty_resume_schema(raw_text=raw_text)
