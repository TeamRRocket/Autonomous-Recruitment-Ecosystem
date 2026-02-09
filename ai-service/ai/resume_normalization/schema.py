from typing import Any, Dict, List


def empty_resume_schema(raw_text: str = "") -> Dict[str, Any]:
    return {
        "personal": {
            "name": "",
            "email": "",
            "phone": "",
            "location": "",
        },
        "experience": [],
        "education": [],
        "skills": {
            "technical": [],
            "soft": [],
            "tools": [],
        },
        "projects": [],
        "certifications": [],
        "raw_text": raw_text or "",
    }


def _safe_list(value: Any) -> List[Any]:
    if isinstance(value, list):
        return value
    return []


def normalize_resume_payload(payload: Dict[str, Any], raw_text: str) -> Dict[str, Any]:
    """Coerce incoming data to the strict resume schema with empty defaults."""
    base = empty_resume_schema(raw_text=raw_text)
    if not isinstance(payload, dict):
        return base

    personal = payload.get("personal", {}) if isinstance(payload.get("personal"), dict) else {}
    base["personal"] = {
        "name": str(personal.get("name") or ""),
        "email": str(personal.get("email") or ""),
        "phone": str(personal.get("phone") or ""),
        "location": str(personal.get("location") or ""),
    }

    experience = _safe_list(payload.get("experience"))
    normalized_experience = []
    for item in experience:
        if isinstance(item, dict):
            normalized_experience.append(
                {
                    "company": str(item.get("company") or ""),
                    "role": str(item.get("role") or ""),
                    "start_date": str(item.get("start_date") or ""),
                    "end_date": str(item.get("end_date") or ""),
                    "description": str(item.get("description") or ""),
                }
            )
    if normalized_experience:
        base["experience"] = normalized_experience

    education = _safe_list(payload.get("education"))
    normalized_education = []
    for item in education:
        if isinstance(item, dict):
            normalized_education.append(
                {
                    "degree": str(item.get("degree") or ""),
                    "field": str(item.get("field") or ""),
                    "institution": str(item.get("institution") or ""),
                    "year": str(item.get("year") or ""),
                }
            )
    if normalized_education:
        base["education"] = normalized_education

    skills = payload.get("skills", {}) if isinstance(payload.get("skills"), dict) else {}
    base["skills"] = {
        "technical": [str(s) for s in _safe_list(skills.get("technical")) if s],
        "soft": [str(s) for s in _safe_list(skills.get("soft")) if s],
        "tools": [str(s) for s in _safe_list(skills.get("tools")) if s],
    }

    projects = _safe_list(payload.get("projects"))
    normalized_projects = []
    for item in projects:
        if isinstance(item, dict):
            normalized_projects.append(
                {
                    "name": str(item.get("name") or ""),
                    "description": str(item.get("description") or ""),
                    "tech": [str(t) for t in _safe_list(item.get("tech")) if t],
                }
            )
    if normalized_projects:
        base["projects"] = normalized_projects

    base["certifications"] = [str(c) for c in _safe_list(payload.get("certifications")) if c]
    base["raw_text"] = raw_text or ""
    return base
