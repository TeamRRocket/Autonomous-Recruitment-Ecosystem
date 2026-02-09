from typing import Dict


def build_resume_extraction_prompt(raw_text: str) -> Dict[str, str]:
    system_prompt = (
        "You are a resume parsing engine. Convert the provided resume text into a strict JSON "
        "schema. Output JSON only, no markdown, no explanations. If information is missing or "
        "uncertain, use empty strings or empty arrays. Do not hallucinate fields."
    )

    user_prompt = (
        "Extract the resume into this exact JSON schema:\n"
        "{\n"
        "  \"personal\": {\"name\": \"\", \"email\": \"\", \"phone\": \"\", \"location\": \"\"},\n"
        "  \"experience\": [{\"company\": \"\", \"role\": \"\", \"start_date\": \"\", \"end_date\": \"\", \"description\": \"\"}],\n"
        "  \"education\": [{\"degree\": \"\", \"field\": \"\", \"institution\": \"\", \"year\": \"\"}],\n"
        "  \"skills\": {\"technical\": [], \"soft\": [], \"tools\": []},\n"
        "  \"projects\": [{\"name\": \"\", \"description\": \"\", \"tech\": []}],\n"
        "  \"certifications\": [],\n"
        "  \"raw_text\": \"\"\n"
        "}\n\n"
        "Resume text:\n"
        f"{raw_text}"
    )

    return {"system": system_prompt, "user": user_prompt}
