import io


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract raw text from a DOCX file using python-docx."""
    if not file_bytes:
        return ""
    from docx import Document
    document = Document(io.BytesIO(file_bytes))
    paragraphs = [para.text for para in document.paragraphs if para.text]
    return "\n".join(paragraphs).strip()
