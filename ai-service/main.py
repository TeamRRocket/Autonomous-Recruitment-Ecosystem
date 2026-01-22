import os
import json
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="HireFlow AI - Matching Service")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

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
    match_score: int
    reason: str

class MatchResponse(BaseModel):
    recommendations: List[Recommendation]

@app.post("/match-jobs", response_model=MatchResponse)
async def match_jobs(request: MatchRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not configured")

    if not request.jobs:
        return {"recommendations": []}

    try:
        response = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "HireFlow AI"
            },
            json={
                "model": "meta-llama/llama-3.1-8b-instruct",
                "messages": [
                    {
                        "role": "system", 
                        "content": """You are a deterministic recruitment matching engine.

Your task is to evaluate EVERY job provided and return EXACTLY 5 job recommendations with the highest relevance.

You must strictly follow ALL rules below. No exceptions.

================================================
SKILL CLASSIFICATION (MANDATORY)
================================================
Each required skill must be classified into ONE category:

HARD SKILLS:
- Programming languages, frameworks, tools, platforms, databases, cloud, APIs, algorithms, system design.

SOFT SKILLS:
- Communication, teamwork, leadership, ownership, problem-solving, adaptability, collaboration,
  stakeholder management, mentoring, decision-making, time management.

If a skill is ambiguous, treat it as SOFT.

================================================
SKILL NORMALIZATION & INFERENCE
================================================
- Skills are case-insensitive.
- Normalize common aliases and equivalents:
  js = javascript
  node = nodejs
  py = python
  react.js = react
  ml = machine learning

HARD SKILL FAMILY MATCHING:
- If skills belong to the same technical family, count as a match.
  Example:
  REST APIs ↔ API Development
  PostgreSQL ↔ SQL Databases

SOFT SKILL INFERENCE (CRITICAL):
A SOFT skill is considered MATCHED if the candidate shows INDIRECT EVIDENCE, such as:
- Team-based technologies (Agile, Scrum, cross-functional work)
- Leadership indicators (mentoring, code reviews, ownership)
- Client-facing or coordination indicators (APIs, integrations, product work)
- Problem-solving indicators (debugging, optimization, system design)

Do NOT require exact wording for soft skills.

================================================
SKILL IMPORTANCE RULES
================================================
- FIRST HALF of required_skills → CORE
- SECOND HALF → SECONDARY

CORE HARD skills are most important.
SOFT skills can NEVER be CORE HARD blockers.

================================================
SCORING MODEL (STRICT & DETERMINISTIC)
================================================

STEP 1: HARD SKILL SCORE
- Count HARD CORE matches
- Count HARD SECONDARY matches

hard_score =
(
  (hard_core_matches * 2) +
  (hard_secondary_matches * 1)
) / (
  (total_hard_core * 2) +
  (total_hard_secondary * 1)
) * 100

If no HARD skills exist → hard_score = 50

STEP 2: SOFT SKILL SCORE
- soft_score = (matched_soft_skills / total_soft_skills) * 100
- Cap soft_score influence to MAX 15 points

soft_bonus = round((soft_score / 100) * 15)

STEP 3: FINAL SCORE
final_score = round(min(hard_score + soft_bonus, 100))

================================================
RANKING RULES
================================================
Evaluate ALL jobs, then sort by:
1. final_score (descending)
2. Number of HARD CORE matches
3. Total HARD matches

Return ONLY the TOP 5 jobs.

================================================
OUTPUT FORMAT (ABSOLUTELY STRICT)
================================================
Return a VALID JSON object ONLY.

Top-level key:
- "recommendations": array of EXACTLY 5 objects

Each object MUST contain ONLY:
- "job_id"
- "job_title"
- "match_score" (final_score, integer 0–100)
- "reason" (ONE concise sentence mentioning hard + soft fit)

No markdown. No comments. No extra keys."""
                    },
                    {
                        "role": "user", 
                        "content": f"Candidate's Database Skills: {', '.join(request.candidate_skills)}\n\nJobs to evaluate:\n" + \
                                   "\n".join([f"- [ID: {j.job_id}] {j.job_title} (Requires: {', '.join(j.required_skills)})" for i, j in enumerate(request.jobs)]) + \
                                   "\n\nReturn Exactly 5 JSON recommendations using the exact schema keys (job_id, job_title, match_score, reason)."
                    }
                ],
                "response_format": { "type": "json_object" },
                "temperature": 0.0,
                "top_p": 0.01,
                "seed": 42
            }
        )
        
        response_json = response.json()
        if "choices" not in response_json:
            print(f"Error from OpenRouter: {response_json}")
            raise HTTPException(status_code=500, detail="Failed to get recommendations from LLM")

        llm_content = response_json["choices"][0]["message"]["content"]
        recommendations_data = json.loads(llm_content)
        
        return recommendations_data

    except Exception as e:
        print(f"Exception during matching: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing recommendations: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
