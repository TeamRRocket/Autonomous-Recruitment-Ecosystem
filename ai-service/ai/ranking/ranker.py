from typing import Dict, List, Optional

from ..feature_engineering.features import employment_gaps
from ..scoring.rule_scores import score_skills, score_experience, score_education
from ..scoring.llm_scores import score_with_llm
from ..scoring.final_score import calculate_final_score


def rank_candidates(
    job_id: str,
    job_title: str,
    job_description: str,
    required_skills: List[str],
    candidates: List[Dict],
    api_key: Optional[str],
) -> Dict:
    ranked = []

    for candidate in candidates:
        resume = candidate.get("resume", {})
        skill_score, overlaps = score_skills(resume, required_skills)
        experience_score = score_experience(resume, job_title)
        education_score = score_education(resume)

        rule_scores = {
            "skill_score": skill_score,
            "experience_score": experience_score,
            "education_score": education_score,
        }

        llm_scores = {
            "project_score": 0.0,
            "soft_skill_score": 0.0,
            "role_fit_score": 0.0,
            "strengths": [],
            "gaps": [],
        }
        if api_key:
            llm_scores = score_with_llm(resume, job_description, required_skills, api_key)

        final = calculate_final_score(rule_scores, llm_scores)
        strengths = []
        gaps = []
        if overlaps:
            strengths.append(f"Strong skill match on {', '.join(overlaps[:5])}")
        if employment_gaps(resume.get("experience", [])) > 0:
            gaps.append("Employment gaps detected")
        strengths.extend(llm_scores.get("strengths", []))
        gaps.extend(llm_scores.get("gaps", []))

        ranked.append(
            {
                "candidate_id": candidate.get("candidate_id"),
                "final_score": final["final_score"],
                "score_breakdown": final["score_breakdown"],
                "strengths": list(dict.fromkeys(strengths))[:5],
                "gaps": list(dict.fromkeys(gaps))[:5],
            }
        )

    ranked.sort(key=lambda x: x["final_score"], reverse=True)
    return {"job_id": job_id, "ranked_candidates": ranked}
