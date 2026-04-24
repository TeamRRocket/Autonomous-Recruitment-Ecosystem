import base64
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..config import config
from ..utils import parse_json_response, call_llm_api
from ..utils.llm_client import extract_llm_content
from ..resume_ingestion.extractor import extract_text
from ..resume_normalization.schema import empty_resume_schema
from ..scoring.rule_scores import score_skills, score_experience, score_education


router = APIRouter()


class ScoreRequest(BaseModel):
    job_description: str
    required_skills: List[str] = Field(default_factory=list)
    resume_text: Optional[str] = None
    resume_file_base64: Optional[str] = None
    resume_filename: Optional[str] = None


def _build_resume_score_prompt(job_description: str, resume_text: str) -> str:
    return (
        "You are an AI Resume Processing Engine inside an Autonomous Recruitment Ecosystem.\n\n"
        "Your role is STRICTLY LIMITED to:\n"
        "1. Extract information from the resume.\n"
        "2. Score the candidate's fit for the job (0-100 scale).\n"
        "3. Output ONLY valid JSON with NO markdown, NO explanations.\n\n"
        "JOB DESCRIPTION:\n"
        f"{job_description}\n\n"
        "RESUME TEXT:\n"
        f"{resume_text}\n\n"
        "SCORING INSTRUCTIONS:\n\n"
        "1. skill_match_score (0-100):\n"
        "   - Compare candidate's skills to job requirements\n"
        "   - 80-100: Has most/all required skills\n"
        "   - 50-79: Has some required skills\n"
        "   - 20-49: Has few matching skills\n"
        "   - 0-19: No relevant skills\n\n"
        "2. experience_relevance_score (0-100):\n"
        "   - 80-100: Extensive relevant experience (3+ years)\n"
        "   - 50-79: Moderate experience (1-3 years)\n"
        "   - 20-49: Some experience (< 1 year)\n"
        "   - 0-19: No relevant experience\n\n"
        "3. education_relevance_score (0-100):\n"
        "   - 80-100: Relevant degree/certification\n"
        "   - 50-79: Related field\n"
        "   - 20-49: Different field but relevant\n"
        "   - 0-19: Not relevant\n\n"
        "4. overall_resume_score:\n"
        "   = (skill_match_score × 0.5) + (experience_relevance_score × 0.3) + (education_relevance_score × 0.2)\n"
        "   IMPORTANT: Calculate this as an integer between 0-100.\n\n"
        "OUTPUT FORMAT (JSON only, no markdown):\n"
        "{\n"
        "  \"full_name\": \"extracted name\",\n"
        "  \"email\": \"extracted email\",\n"
        "  \"phone\": \"extracted phone\",\n"
        "  \"total_years_experience\": <number>,\n"
        "  \"education\": [\"degree 1\", \"degree 2\"],\n"
        "  \"skills\": [\"all skills\"],\n"
        "  \"technical_skills\": [\"technical skills\"],\n"
        "  \"soft_skills\": [\"soft skills\"],\n"
        "  \"projects\": [\"project names or descriptions\"],\n"
        "  \"certifications\": [\"certs\"],\n"
        "  \"previous_companies\": [\"companies\"],\n"
        "  \"current_role\": \"current job title\",\n"
        "  \"matching_scores\": {\n"
        "    \"skill_match_score\": <calculate 0-100>,\n"
        "    \"experience_relevance_score\": <calculate 0-100>,\n"
        "    \"education_relevance_score\": <calculate 0-100>,\n"
        "    \"overall_resume_score\": <calculate weighted average>\n"
        "  },\n"
        "  \"professional_summary\": \"Write an in-depth, comprehensive evaluation of the candidate. Detail their core technical expertise, domain experience, significant achievements, and directly assess their suitability against the requirements of the job. This should be a highly analytical, multi-sentence paragraph designed to give a recruiter immediate and deep clarity on the candidate's potential and fit.\"\n"
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

    if config.is_llm_configured():
        prompt = _build_resume_score_prompt(request.job_description, raw_text)
        try:
            response_json = call_llm_api(
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": "Analyze the resume and return the scored JSON response. Calculate actual scores based on the job fit."},
                ],
                temperature=0.3,
                max_tokens=1500,
                timeout=60
            )
            content = extract_llm_content(response_json)
            if not content:
                raise ValueError("Empty LLM response")
            parsed = parse_json_response(content)
            
            # Check if LLM returned all zeros - if so, recalculate with rule-based scoring
            scores = parsed.get("matching_scores", {})
            if (scores.get("skill_match_score", 0) == 0 and 
                scores.get("experience_relevance_score", 0) == 0 and 
                scores.get("education_relevance_score", 0) == 0):
                # LLM didn't score properly, calculate scores ourselves
                skill_score, _ = score_skills(parsed, request.required_skills or [])
                experience_score = score_experience(parsed, job_title=request.job_description[:100] if request.job_description else "")
                education_score = score_education(parsed, required_degree=None)
                overall = int(round(
                    (skill_score * config.SKILL_WEIGHT) + 
                    (experience_score * config.EXPERIENCE_WEIGHT) + 
                    (education_score * config.EDUCATION_WEIGHT)
                ))
                parsed["matching_scores"] = {
                    "skill_match_score": int(round(skill_score)),
                    "experience_relevance_score": int(round(experience_score)),
                    "education_relevance_score": int(round(education_score)),
                    "overall_resume_score": overall,
                }
            
            return parsed
        except Exception:
            pass
    resume_json = empty_resume_schema(raw_text=raw_text)
    skill_score, _ = score_skills(resume_json, request.required_skills or [])
    experience_score = score_experience(resume_json, job_title="")
    education_score = score_education(resume_json, required_degree=None)
    overall = int(round(
        (skill_score * config.SKILL_WEIGHT) + 
        (experience_score * config.EXPERIENCE_WEIGHT) + 
        (education_score * config.EDUCATION_WEIGHT)
    ))

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


from .performance_summary_helper import PerformanceSummaryRequest, generate_performance_summary_with_llm

@router.post("/performance-summary")
async def generate_performance_summary(req: PerformanceSummaryRequest):
    try:
        summary = generate_performance_summary_with_llm(req)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
