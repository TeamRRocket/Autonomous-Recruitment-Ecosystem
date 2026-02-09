import os
from typing import Optional

from .pdf_parser import extract_text_from_pdf
from .docx_parser import extract_text_from_docx


SUPPORTED_EXTENSIONS = {".pdf", ".docx"}


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Route extraction based on file extension. No LLM usage here."""
    if not filename:
        return ""
    extension = os.path.splitext(filename.lower())[1]
    if extension == ".pdf":
        return extract_text_from_pdf(file_bytes)
    if extension == ".docx":
        return extract_text_from_docx(file_bytes)
    return ""
