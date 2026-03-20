"""
Technical Interview API Routes
"""

from fastapi import APIRouter, HTTPException
from .evaluator import evaluate_technical_answer, EvaluationRequest, EvaluationResponse

router = APIRouter()

@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_answer(request: EvaluationRequest):
    """
    Evaluate a candidate's answer to a technical interview question.
    
    Args:
        request: EvaluationRequest with question and answer
        
    Returns:
        EvaluationResponse with scores and feedback
    """
    try:
        result = evaluate_technical_answer(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint for technical interview service"""
    return {"status": "ok", "service": "technical-interview"}
