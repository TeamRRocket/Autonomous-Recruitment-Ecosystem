import json
from typing import Dict, List
import requests


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "anthropic/claude-3.5-sonnet"


def _parse_json_response(content: str) -> Dict:
    text = content.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def score_with_llm(resume: Dict, job_description: str, job_required_skills: List[str], api_key: str) -> Dict:
    """Return LLM-based scores for project relevance, soft skills, and role fit."""
    if not job_description:
        return {"project_score": 0.0, "soft_skill_score": 0.0, "role_fit_score": 0.0, "strengths": [], "gaps": []}

    system_prompt = (
        "You are a recruiter assistant. Evaluate the resume for project relevance, soft skills, "
        "and role fit based on the job description. Return JSON only with numeric scores 0-100. "
        "Provide 2-3 strengths and 1-3 gaps as short phrases. Do not include explanations or reasoning."
    )

    user_prompt = (
        "Job description:\n"
        f"{job_description}\n\n"
        "Required skills:\n"
        f"{job_required_skills}\n\n"
        "Resume JSON:\n"
        f"{json.dumps(resume, ensure_ascii=True)}\n\n"
        "Return JSON:\n"
        "{\n"
        "  \"project_score\": 0-100,\n"
        "  \"soft_skill_score\": 0-100,\n"
        "  \"role_fit_score\": 0-100,\n"
        "  \"strengths\": [\"...\"],\n"
        "  \"gaps\": [\"...\"]\n"
        "}\n"
    )

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
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0,
                "max_tokens": 1500,
            },
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        if "choices" not in payload or not payload["choices"]:
            raise ValueError("No choices")
        content = payload["choices"][0]["message"]["content"]
        parsed = _parse_json_response(content)
        return {
            "project_score": float(parsed.get("project_score", 0)),
            "soft_skill_score": float(parsed.get("soft_skill_score", 0)),
            "role_fit_score": float(parsed.get("role_fit_score", 0)),
            "strengths": [str(item) for item in parsed.get("strengths", []) if item],
            "gaps": [str(item) for item in parsed.get("gaps", []) if item],
        }
    except Exception:
        return {"project_score": 0.0, "soft_skill_score": 0.0, "role_fit_score": 0.0, "strengths": [], "gaps": []}
