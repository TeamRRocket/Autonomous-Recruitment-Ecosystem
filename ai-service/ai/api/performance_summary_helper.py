from typing import Dict, Any, Optional
from pydantic import BaseModel
from ..utils.llm_client import call_llm_api, extract_llm_content

class PerformanceSummaryRequest(BaseModel):
    candidate_name: str
    job_description: str
    resume_summary: str
    scores: Dict[str, Any]

def generate_performance_summary_with_llm(req: PerformanceSummaryRequest) -> str:
    prompt = f"""
You are an expert technical recruiter and AI Assessment evaluator.
Generate a comprehensive, professional, and detailed Candidate Performance Overview based on the following data.
This overview will directly help recruiters make hiring decisions. Write in a clear, objective, professional tone. Do not use conversational filler (e.g., "Here is the summary"). Include a balanced view of strengths and areas for improvement. Address their resume experience and their performance across all the technical/aptitude rounds they took. Give actionable insight.

Candidate Name: {req.candidate_name}
Job Description: {req.job_description}

Original Resume Experience/Summary:
{req.resume_summary}

Actual Round Scores (0-100 scale, N/A means not taken):
- Aptitude Round: {req.scores.get("aptitude", "N/A")}
- DSA Round: {req.scores.get("dsa", "N/A")}
- Technical Output/Interview: {req.scores.get("technical", "N/A")}

Output Requirements:
- Write exactly 2-3 detailed paragraphs.
- Paragraph 1: Holistic summary linking their resume experience to the job requirements.
- Paragraph 2: Analysis of their assessment performance (strengths shown in high scores or concerns in low scores). 
- Paragraph 3: Hiring recommendation or concluding thoughts based strictly on their match to the role.
- NEVER invent scores or facts.
"""

    messages = [
        {"role": "system", "content": "You are an expert evaluator of technical talent."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = call_llm_api(messages=messages, temperature=0.3, max_tokens=600)
        content = extract_llm_content(response)
        return content or "Failed to generate comprehensive summary. Try again later."
    except Exception as e:
        print(f"Error generating performance summary: {str(e)}")
        return "Performance summary currently unavailable."

