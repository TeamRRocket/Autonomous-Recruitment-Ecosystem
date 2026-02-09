from typing import Dict


def calculate_final_score(rule_scores: Dict, llm_scores: Dict) -> Dict:
    skill_score = rule_scores.get("skill_score", 0.0)
    experience_score = rule_scores.get("experience_score", 0.0)
    education_score = rule_scores.get("education_score", 0.0)
    project_score = llm_scores.get("project_score", 0.0)
    soft_skill_score = llm_scores.get("soft_skill_score", 0.0)

    final_score = (
        0.45 * skill_score
        + 0.25 * experience_score
        + 0.15 * project_score
        + 0.10 * education_score
        + 0.05 * soft_skill_score
    )

    return {
        "final_score": round(final_score, 2),
        "score_breakdown": {
            "skills": round(skill_score, 2),
            "experience": round(experience_score, 2),
            "projects": round(project_score, 2),
            "education": round(education_score, 2),
            "soft_skills": round(soft_skill_score, 2),
        },
    }
