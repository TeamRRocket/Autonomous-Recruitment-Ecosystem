import base64
import json
from typing import Any, Dict
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import requests

from ..resume_ingestion.extractor import extract_text
from ..resume_normalization.schema import empty_resume_schema
from ..scoring.rule_scores import score_skills, score_experience, score_education
import os


router = APIRouter()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")


class ScoreRequest(BaseModel):
    job_description: str
    required_skills: List[str] = Field(default_factory=list)
    resume_text: Optional[str] = None
    resume_file_base64: Optional[str] = None
    resume_filename: Optional[str] = None


def _parse_json_response(content: str) -> Dict[str, Any]:
    text = (content or "").strip()
    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) >= 2:
            text = parts[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def _build_resume_score_prompt(job_description: str, resume_text: str) -> str:
    return (
        "You are an AI Resume Processing Engine inside an Autonomous Recruitment Ecosystem.\n\n"
        "Your role is STRICTLY LIMITED to:\n"
        "1. Parsing resume content.\n"
        "2. Comparing it with the provided Job Description.\n"
        "3. Generating structured JSON output.\n"
        "4. Computing resume-based scoring.\n\n"
        "You are NOT allowed to:\n"
        "- Make hiring decisions.\n"
        "- Shortlist or reject candidates.\n"
        "- Add explanations outside JSON.\n"
        "- Output anything other than valid JSON.\n\n"
        "INPUTS:\n"
        f"1) Job Description: {job_description}\n"
        f"2) Resume Text: {resume_text}\n\n"
        "TASKS:\n\n"
        "STEP 1: Extract:\n"
        "- full_name\n"
        "- email\n"
        "- phone\n"
        "- total_years_experience\n"
        "- education[]\n"
        "- skills[]\n"
        "- technical_skills[]\n"
        "- soft_skills[]\n"
        "- projects[]\n"
        "- certifications[]\n"
        "- previous_companies[]\n"
        "- current_role\n\n"
        "STEP 2: Compute scores:\n\n"
        "skill_match_score (0–100)\n"
        "experience_relevance_score (0–100)\n"
        "education_relevance_score (0–100)\n\n"
        "Weights:\n"
        "Skill = 50%\n"
        "Experience = 30%\n"
        "Education = 20%\n\n"
        "overall_resume_score =\n"
        "(skill_match_score * 0.5) +\n"
        "(experience_relevance_score * 0.3) +\n"
        "(education_relevance_score * 0.2)\n\n"
        "Round to nearest integer.\n\n"
        "STEP 3: Generate 3–5 sentence professional summary.\n\n"
        "STRICT OUTPUT:\n"
        "Valid JSON only. No markdown. No explanation.\n\n"
        "Return exactly this JSON shape:\n"
        "{\n"
        "  \"full_name\": \"\",\n"
        "  \"email\": \"\",\n"
        "  \"phone\": \"\",\n"
        "  \"total_years_experience\": 0,\n"
        "  \"education\": [],\n"
        "  \"skills\": [],\n"
        "  \"technical_skills\": [],\n"
        "  \"soft_skills\": [],\n"
        "  \"projects\": [],\n"
        "  \"certifications\": [],\n"
        "  \"previous_companies\": [],\n"
        "  \"current_role\": \"\",\n"
        "  \"matching_scores\": {\n"
        "    \"skill_match_score\": 0,\n"
        "    \"experience_relevance_score\": 0,\n"
        "    \"education_relevance_score\": 0,\n"
        "    \"overall_resume_score\": 0\n"
        "  },\n"
        "  \"professional_summary\": \"\"\n"
        "}\n"
    )


@router.post("/score")
async def score_resume(request: ScoreRequest):
    raw_text = (request.resume_text or "").strip()
    if not raw_text and request.resume_file_base64 and request.resume_filename:
        try:
            file_bytes = base64.b64decode(request.resume_file_base64)
            raw_text = extract_text(file_bytes, request.resume_filename) or ""
        except Exception:
            raw_text = ""

    if not raw_text:
        return {
            "full_name": "",
            "email": "",
            "phone": "",
            "total_years_experience": 0,
            "education": [],
            "skills": [],
            "technical_skills": [],
            "soft_skills": [],
            "projects": [],
            "certifications": [],
            "previous_companies": [],
            "current_role": "",
            "matching_scores": {
                "skill_match_score": 0,
                "experience_relevance_score": 0,
                "education_relevance_score": 0,
                "overall_resume_score": 0,
            },
            "professional_summary": "",
        }

    if OPENROUTER_API_KEY:
        prompt = _build_resume_score_prompt(request.job_description, raw_text)
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "HireFlow AI",
                },
                json={
                    "model": "anthropic/claude-3.5-sonnet",
                    "messages": [
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": "Return the JSON now."},
                    ],
                    "temperature": 0,
                    "max_tokens": 750,
                },
                timeout=45,
            )
            response.raise_for_status()
            payload = response.json()
            if "choices" not in payload or not payload["choices"]:
                raise ValueError("Empty LLM response")
            content = payload["choices"][0]["message"]["content"]
            parsed = _parse_json_response(content)
            return parsed
        except Exception:
            pass

    resume_json = empty_resume_schema(raw_text=raw_text)
    skill_score, _ = score_skills(resume_json, request.required_skills or [])
    experience_score = score_experience(resume_json, job_title="")
    education_score = score_education(resume_json, required_degree=None)
    overall = int(round((skill_score * 0.5) + (experience_score * 0.3) + (education_score * 0.2)))

    return {
        "full_name": resume_json.get("personal", {}).get("name", "") if isinstance(resume_json.get("personal"), dict) else "",
        "email": resume_json.get("personal", {}).get("email", "") if isinstance(resume_json.get("personal"), dict) else "",
        "phone": resume_json.get("personal", {}).get("phone", "") if isinstance(resume_json.get("personal"), dict) else "",
        "total_years_experience": 0,
        "education": resume_json.get("education", []) or [],
        "skills": [],
        "technical_skills": (resume_json.get("skills", {}) or {}).get("technical", []) if isinstance(resume_json.get("skills"), dict) else [],
        "soft_skills": (resume_json.get("skills", {}) or {}).get("soft", []) if isinstance(resume_json.get("skills"), dict) else [],
        "projects": resume_json.get("projects", []) or [],
        "certifications": resume_json.get("certifications", []) or [],
        "previous_companies": [],
        "current_role": "",
        "matching_scores": {
            "skill_match_score": int(round(skill_score)),
            "experience_relevance_score": int(round(experience_score)),
            "education_relevance_score": int(round(education_score)),
            "overall_resume_score": overall,
        },
        "professional_summary": "",
    }
