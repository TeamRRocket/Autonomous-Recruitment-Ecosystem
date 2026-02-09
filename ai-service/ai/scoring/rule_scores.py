import re
from typing import Dict, List, Tuple, Optional

from ..feature_engineering.features import (
    total_years_experience,
    skill_overlap,
    role_title_alignment,
)


def _text_contains_skill(raw_text: str, skill: str) -> bool:
    text = (raw_text or "").lower()
    s = (skill or "").lower().strip()
    if not text or not s:
        return False

    # Match either as a word boundary token, or a simple substring for things like "node.js".
    if re.search(r"\b" + re.escape(s) + r"\b", text):
        return True
    return s in text


def _fallback_skill_score_from_text(raw_text: str, required_skills: List[str]) -> Tuple[float, List[str]]:
    required = [s for s in required_skills if s]
    if not required:
        return 50.0, []
    hits = [s for s in required if _text_contains_skill(raw_text, s)]
    score = (len(hits) / len(required)) * 100
    return round(score, 2), hits


def _infer_years_from_text(raw_text: str) -> float:
    text = (raw_text or "").lower()
    if not text:
        return 0.0
    match = re.search(r"(\d{1,2})\s*\+?\s*(years|yrs)\s+of\s+experience", text)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            return 0.0
    return 0.0


def score_skills(resume: Dict, required_skills: List[str]) -> Tuple[float, List[str]]:
    overlap_count, overlap = skill_overlap(resume.get("skills", {}), required_skills)
    required_total = len([s for s in required_skills if s])
    if required_total == 0:
        return 50.0, []
    if overlap_count == 0:
        raw_text = str(resume.get("raw_text") or "")
        return _fallback_skill_score_from_text(raw_text, required_skills)

    score = (overlap_count / required_total) * 100
    return round(score, 2), overlap


def score_experience(resume: Dict, job_title: str) -> float:
    years = total_years_experience(resume.get("experience", []))
    experience = resume.get("experience", [])
    alignment = role_title_alignment(experience, job_title)

    # Fallback when experience isn't structured
    if (not experience or years == 0) and resume.get("raw_text"):
        inferred_years = _infer_years_from_text(str(resume.get("raw_text") or ""))
        years = max(years, inferred_years)
        if alignment == 0 and job_title:
            title_tokens = re.findall(r"[a-zA-Z]+", job_title.lower())
            text = str(resume.get("raw_text") or "").lower()
            if title_tokens:
                alignment = sum(1 for t in title_tokens if t in text) / len(title_tokens)
    base = min(100.0, (years / 10.0) * 100)
    score = base * 0.7 + alignment * 100 * 0.3
    return round(min(100.0, score), 2)


def score_education(resume: Dict, required_degree: Optional[str] = None) -> float:
    education = resume.get("education", [])
    if not education:
        return 0.0
    if not required_degree:
        return 60.0
    required_degree = required_degree.lower()
    for entry in education:
        degree = (entry.get("degree") or "").lower()
        if required_degree in degree:
            return 100.0
    return 40.0
