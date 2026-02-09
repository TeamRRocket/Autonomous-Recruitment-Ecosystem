import base64
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..resume_ingestion.extractor import extract_text
from ..resume_normalization.llm_extractor import extract_resume_json
from ..resume_normalization.schema import empty_resume_schema
from ..ranking.ranker import rank_candidates
import os


router = APIRouter()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")


class CandidatePayload(BaseModel):
    candidate_id: str
    resume_text: Optional[str] = None
    resume_file_base64: Optional[str] = None
    resume_filename: Optional[str] = None


class RankRequest(BaseModel):
    job_id: str
    job_title: str
    job_description: str
    required_skills: List[str]
    candidates: List[CandidatePayload]


@router.post("/rank")
async def rank_resumes(request: RankRequest):
    if not request.candidates:
        return {"job_id": request.job_id, "ranked_candidates": []}

    candidates_data = []
    for candidate in request.candidates:
        raw_text = candidate.resume_text or ""
        if not raw_text and candidate.resume_file_base64 and candidate.resume_filename:
            try:
                file_bytes = base64.b64decode(candidate.resume_file_base64)
                raw_text = extract_text(file_bytes, candidate.resume_filename)
            except Exception:
                raw_text = ""

        if not raw_text:
            resume_json = empty_resume_schema(raw_text="")
        elif OPENROUTER_API_KEY:
            resume_json = extract_resume_json(raw_text, OPENROUTER_API_KEY)
        else:
            resume_json = empty_resume_schema(raw_text=raw_text)

        candidates_data.append(
            {
                "candidate_id": candidate.candidate_id,
                "resume": resume_json,
            }
        )

    return rank_candidates(
        job_id=request.job_id,
        job_title=request.job_title,
        job_description=request.job_description,
        required_skills=request.required_skills,
        candidates=candidates_data,
        api_key=OPENROUTER_API_KEY,
    )
