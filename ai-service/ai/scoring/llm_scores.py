import json
from typing import Dict, List

from ..config import config
from ..utils import parse_json_response, call_llm_api
from ..utils.llm_client import extract_llm_content


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
        response_json = call_llm_api(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0,
            max_tokens=1500
        )
        content = extract_llm_content(response_json)
        if not content:
            raise ValueError("No choices")
        parsed = parse_json_response(content)
        return {
            "project_score": float(parsed.get("project_score", 0)),
            "soft_skill_score": float(parsed.get("soft_skill_score", 0)),
            "role_fit_score": float(parsed.get("role_fit_score", 0)),
            "strengths": [str(item) for item in parsed.get("strengths", []) if item],
            "gaps": [str(item) for item in parsed.get("gaps", []) if item],
        }
    except Exception:
        return {"project_score": 0.0, "soft_skill_score": 0.0, "role_fit_score": 0.0, "strengths": [], "gaps": []}
