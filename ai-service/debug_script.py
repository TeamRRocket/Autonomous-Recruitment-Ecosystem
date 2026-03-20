import sys
import os
import io

# Add current directory to path
sys.path.append(os.getcwd())

from ai.resume_ingestion.extractor import extract_text

filename = "../backend/uploads/resumes/resume-1773340224065-278519384.pdf"
abs_path = os.path.abspath(filename)
print("Checking file:", abs_path)

if not os.path.exists(abs_path):
    print("File not found!")
    sys.exit(1)

with open(abs_path, "rb") as f:
    file_bytes = f.read()
    print(f"Read {len(file_bytes)} bytes")
    
    try:
        text = extract_text(file_bytes, filename)
        print("--- EXTRACTED TEXT ---")
        print(text[:500])  # Print first 500 chars
        print("----------------------")
        
        if not text.strip():
            print("WARNING: Extracted text is empty!")
        else:
            print(f"Extraction successful. Length: {len(text)}")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
