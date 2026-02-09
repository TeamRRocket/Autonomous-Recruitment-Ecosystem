import re
from datetime import datetime
from typing import Dict, List, Tuple, Optional


DATE_PATTERNS = [
    "%Y-%m", "%Y/%m", "%m/%Y", "%b %Y", "%B %Y", "%Y"
]


def _parse_date(value: str) -> Optional[datetime]:
    value = (value or "").strip()
    if not value or value.lower() in {"present", "current"}:
        return datetime.utcnow()
    for pattern in DATE_PATTERNS:
        try:
            return datetime.strptime(value, pattern)
        except ValueError:
            continue
    return None


def total_years_experience(experience: List[Dict[str, str]]) -> float:
    total_months = 0
    for role in experience:
        start = _parse_date(role.get("start_date", ""))
        end = _parse_date(role.get("end_date", ""))
        if start and end and end >= start:
            total_months += (end.year - start.year) * 12 + (end.month - start.month)
    return round(total_months / 12.0, 2)


def skill_overlap(resume_skills: Dict[str, List[str]], required_skills: List[str]) -> Tuple[int, List[str]]:
    required = {s.lower().strip() for s in required_skills if s}
    candidate = {
        s.lower().strip()
        for group in (resume_skills.get("technical", []), resume_skills.get("tools", []))
        for s in group
    }
    overlap = sorted(required.intersection(candidate))
    return len(overlap), overlap


def skill_recency(experience: List[Dict[str, str]], required_skills: List[str]) -> List[str]:
    if not experience:
        return []
    recent_text = " ".join((experience[0].get("description") or "") for _ in [0])
    recent_text = recent_text.lower()
    recency_hits = []
    for skill in required_skills:
        if skill.lower() in recent_text:
            recency_hits.append(skill)
    return recency_hits


def role_title_alignment(experience: List[Dict[str, str]], job_title: str) -> float:
    if not experience or not job_title:
        return 0.0
    job_tokens = set(re.findall(r"[a-zA-Z]+", job_title.lower()))
    role_titles = " ".join(role.get("role", "") for role in experience).lower()
    if not job_tokens:
        return 0.0
    matches = sum(1 for token in job_tokens if token in role_titles)
    return round(matches / len(job_tokens), 2)


def employment_gaps(experience: List[Dict[str, str]]) -> int:
    dates = []
    for role in experience:
        start = _parse_date(role.get("start_date", ""))
        end = _parse_date(role.get("end_date", ""))
        if start and end:
            dates.append((start, end))
    dates.sort(key=lambda x: x[0])
    gaps = 0
    for idx in range(1, len(dates)):
        prev_end = dates[idx - 1][1]
        curr_start = dates[idx][0]
        if curr_start > prev_end:
            gap_months = (curr_start.year - prev_end.year) * 12 + (curr_start.month - prev_end.month)
            if gap_months >= 6:
                gaps += 1
    return gaps


def project_relevance(projects: List[Dict[str, str]], job_keywords: List[str]) -> List[str]:
    keywords = {kw.lower() for kw in job_keywords if kw}
    hits = []
    for project in projects:
        text = f"{project.get('name', '')} {project.get('description', '')}"
        text_lower = text.lower()
        for keyword in keywords:
            if keyword in text_lower:
                hits.append(keyword)
    return sorted(set(hits))
