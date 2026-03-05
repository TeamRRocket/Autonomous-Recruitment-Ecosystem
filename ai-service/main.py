import os
import sys

# Suppress all warnings at the earliest possible point
import warnings
warnings.filterwarnings('ignore')
os.environ['PYTHONWARNINGS'] = 'ignore'

import json
import requests
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Set
from dotenv import load_dotenv
from dataclasses import dataclass

# Additional warning suppression for specific libraries
warnings.filterwarnings('ignore', category=Warning)
warnings.filterwarnings('ignore', message='.*urllib3.*')
warnings.filterwarnings('ignore', message='.*FontBBox.*')
logging.getLogger('pdfminer').setLevel(logging.ERROR)
logging.getLogger('pdfplumber').setLevel(logging.ERROR)

load_dotenv()

# Import config and utilities
from ai.config import config
from ai.utils import parse_json_response, call_llm_api
from ai.utils.llm_client import extract_llm_content
from ai.matching import SkillMatcher

app = FastAPI(
    title=config.APP_TITLE,
    version=config.APP_VERSION
)

try:
    from ai.api.resume_routes import router as resume_router
    app.include_router(resume_router, prefix="/ai/resume", tags=["resume"])
except Exception as exc:
    # Keep existing APIs running even if resume module dependencies are missing.
    print(f"Resume router failed to load: {exc}")

# Import proctoring module
try:
    from ai.proctoring.models import (
        FrameProcessRequest, 
        FrameProcessResponse,
        RiskEvaluationRequest,
        RiskEvaluationResponse
    )
    from ai.proctoring.frame_processor import process_frame
    from ai.proctoring.risk_evaluator import evaluate_risk
    
    config.PROCTORING_ENABLED = True
    print("✓ Proctoring module loaded successfully")
except Exception:
    # Proctoring is optional - silently disable if cv2 not installed
    config.PROCTORING_ENABLED = False

# ============================================================================
# MODELS
# ============================================================================

class Job(BaseModel):
    job_id: str
    job_title: str
    required_skills: List[str]

class MatchRequest(BaseModel):
    candidate_skills: List[str]
    jobs: List[Job]

class Recommendation(BaseModel):
    job_id: str
    job_title: str
    match_score: int = Field(ge=0, le=100)
    reason: str
    
    @field_validator('match_score', mode='before')
    @classmethod
    def score_must_be_valid(cls, v):
        if isinstance(v, (int, float)):
            if not 0 <= v <= 100:
                return max(0, min(100, int(v)))
            return int(v)
        return v

class MatchResponse(BaseModel):
    recommendations: List[Recommendation]

@dataclass
class SkillMatch:
    job_id: str
    job_title: str
    required_skills: List[str]
    exact_matches: Set[str]
    possible_matches: Set[str]
    missing_skills: Set[str]
    base_score: int
    candidate_skills: List[str]

# ============================================================================
# LLM ENHANCEMENT SERVICE
# ============================================================================

class LLMEnhancer:
    """Uses LLM for semantic matching and explanation generation"""
    
    @staticmethod
    def enhance_matches(matches: List[SkillMatch], top_n: int = 5) -> List[Recommendation]:
        """
        Use LLM to:
        1. Find semantic similarities we might have missed
        2. Adjust scores based on soft skill inference
        3. Generate explanations
        4. Final ranking
        """
        
        # Only return as many recommendations as we have jobs
        top_n = min(top_n, len(matches))
        
        if not config.is_llm_configured():
            # Fallback to rule-based only
            return LLMEnhancer._fallback_recommendations(matches, top_n)
        
        try:
            # Prepare data for LLM
            jobs_data = []
            for match in matches:
                jobs_data.append({
                    'job_id': match.job_id,
                    'job_title': match.job_title,
                    'required_skills': match.required_skills,
                    'exact_matches': list(match.exact_matches),
                    'possible_matches': list(match.possible_matches),
                    'missing_skills': list(match.missing_skills),
                    'base_score': match.base_score
                })
            
            system_prompt = """You are a job matching expert. You'll receive jobs with pre-calculated base scores from rule-based matching.

Your tasks:
1. Identify semantic similarities between candidate skills and missing required skills (e.g., "REST APIs" ↔ "API Development")
2. Infer soft skills from technical background (e.g., Agile experience suggests teamwork)
3. Adjust scores by ±10 points maximum based on your semantic analysis
4. Generate a concise, helpful explanation (1-2 sentences) for each match
5. Rank the top 5 jobs

Scoring adjustments:
- Strong semantic matches in missing skills: +5 to +10
- Soft skill inference from tech stack: +3 to +7
- Critical skill gaps: -5 to -10

Return valid JSON with this structure:
{
  "recommendations": [
    {
      "job_id": "string",
      "job_title": "string", 
      "match_score": 0-100,
      "reason": "Brief explanation of match quality and key gaps"
    }
  ]
}

IMPORTANT: Only return recommendations for the jobs provided above. Do not create or suggest jobs that were not in the input. Order by match_score (highest first)."""

            candidate_skills_str = ", ".join(matches[0].candidate_skills) if matches else ""
            
            response_json = call_llm_api(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user", 
                        "content": f"Candidate Skills: {candidate_skills_str}\n\nJobs with base scores:\n{json.dumps(jobs_data, indent=2)}\n\nAnalyze and return recommendations for these {len(jobs_data)} job(s) with adjusted scores and explanations. Only include jobs from the list above."
                    }
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            content = extract_llm_content(response_json)
            if not content:
                print(f"Invalid LLM response")
                return LLMEnhancer._fallback_recommendations(matches, top_n)
            
            result = parse_json_response(content)
            recommendations = result.get("recommendations", [])
            
            # Validate and convert to Recommendation objects
            # Filter out any hallucinated jobs not in original matches
            valid_job_ids = {match.job_id for match in matches}
            validated_recs = []
            for rec in recommendations[:top_n]:
                try:
                    # Only include if job_id matches one of the input jobs
                    if rec.get('job_id') in valid_job_ids:
                        validated_recs.append(Recommendation(**rec))
                    else:
                        print(f"Skipping hallucinated job: {rec.get('job_title', 'unknown')}")
                except Exception as e:
                    print(f"Invalid recommendation format: {e}")
                    continue
            
            if validated_recs:
                return validated_recs
            else:
                # No valid recommendations, use fallback
                return LLMEnhancer._fallback_recommendations(matches, top_n)
                
        except Exception as e:
            print(f"LLM enhancement failed: {str(e)}")
            return LLMEnhancer._fallback_recommendations(matches, top_n)
    
    @staticmethod
    def _fallback_recommendations(matches: List[SkillMatch], top_n: int = 5) -> List[Recommendation]:
        """Fallback to pure rule-based recommendations"""
        # Sort by base score
        sorted_matches = sorted(matches, key=lambda x: x.base_score, reverse=True)[:top_n]
        
        recommendations = []
        for match in sorted_matches:
            # Generate simple reason
            exact_count = len(match.exact_matches)
            possible_count = len(match.possible_matches)
            missing_count = len(match.missing_skills)
            
            if exact_count > 0 and missing_count == 0:
                reason = f"Strong match with {exact_count} required skills"
            elif exact_count > 0:
                reason = f"Match for {exact_count} required skills, missing {missing_count} skills"
            elif possible_count > 0:
                reason = f"Partial match with {possible_count} related skills, missing {missing_count} core skills"
            else:
                reason = f"Limited match, missing {missing_count} required skills"
            
            recommendations.append(Recommendation(
                job_id=match.job_id,
                job_title=match.job_title,
                match_score=match.base_score,
                reason=reason
            ))
        
        # Ensure we have exactly top_n recommendations
        while len(recommendations) < top_n and len(recommendations) < len(matches):
            idx = len(recommendations)
            if idx < len(sorted_matches):
                match = sorted_matches[idx]
                recommendations.append(Recommendation(
                    job_id=match.job_id,
                    job_title=match.job_title,
                    match_score=match.base_score,
                    reason="Additional opportunity to consider"
                ))
        
        return recommendations

# ============================================================================
# MAIN ENDPOINT
# ============================================================================

@app.post("/match-jobs", response_model=MatchResponse)
async def match_jobs(request: MatchRequest):
    """
    Hybrid matching system:
    1. Rule-based matching calculates base scores
    2. LLM enhances with semantic understanding and explanations
    """
    
    if not request.jobs:
        return MatchResponse(recommendations=[])
    
    if not request.candidate_skills:
        return MatchResponse(recommendations=[])
    
    try:
        # Phase 1: Rule-based matching
        matches = []
        for job in request.jobs:
            base_score, exact, possible, missing = SkillMatcher.calculate_base_score(
                request.candidate_skills,
                job.required_skills
            )
            
            matches.append(SkillMatch(
                job_id=job.job_id,
                job_title=job.job_title,
                required_skills=job.required_skills,
                exact_matches=exact,
                possible_matches=possible,
                missing_skills=missing,
                base_score=base_score,
                candidate_skills=request.candidate_skills
            ))
        
        # Phase 2: LLM enhancement
        recommendations = LLMEnhancer.enhance_matches(matches, top_n=5)
        
        return MatchResponse(recommendations=recommendations)
        
    except Exception as e:
        print(f"Error in match_jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "llm_configured": config.is_llm_configured(),
        "proctoring_enabled": config.PROCTORING_ENABLED
    }

# ============================================================================
# PROCTORING ENDPOINTS
# ============================================================================

if config.PROCTORING_ENABLED:
    @app.post("/ai/proctoring/process-frame", response_model=FrameProcessResponse)
    async def process_frame_endpoint(request: FrameProcessRequest):
        """
        Process a single frame with OpenCV for proctoring
        
        Detects:
        - Number of faces
        - Looking away behavior
        - Phone presence (placeholder)
        """
        try:
            result = process_frame(request.frame_data)
            
            return FrameProcessResponse(
                face_count=result.get('face_count', 0),
                looking_away=result.get('looking_away', False),
                phone_detected=result.get('phone_detected', False),
                timestamp=result.get('timestamp', '')
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Frame processing error: {str(e)}")

    @app.post("/ai/proctoring/evaluate-risk", response_model=RiskEvaluationResponse)
    async def evaluate_risk_endpoint(request: RiskEvaluationRequest):
        """
        Evaluate proctoring risk using LLM
        
        Analyzes aggregated event summary and provides:
        - Risk score (0-100)
        - Risk level (Low/Medium/High)
        - Reasoning explanation
        """
        try:
            result = evaluate_risk(request.summary)
            
            return RiskEvaluationResponse(
                risk_score=result['risk_score'],
                risk_level=result['risk_level'],
                reason=result['reason']
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Risk evaluation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.HOST, port=config.PORT)