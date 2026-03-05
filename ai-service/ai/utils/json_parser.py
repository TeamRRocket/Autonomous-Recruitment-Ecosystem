"""JSON parsing utilities for LLM responses"""
import json
from typing import Any, Dict


def parse_json_response(content: str) -> Dict[str, Any]:
    """
    Parse JSON response from LLM, handling markdown code blocks.
    
    Args:
        content: Raw response content from LLM
        
    Returns:
        Parsed JSON as dictionary
        
    Raises:
        json.JSONDecodeError: If content is not valid JSON
    """
    text = (content or "").strip()
    
    # Remove markdown code blocks if present
    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) >= 2:
            text = parts[1]
        # Remove 'json' language identifier if present
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    
    return json.loads(text)
