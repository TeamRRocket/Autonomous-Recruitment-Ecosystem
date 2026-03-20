"""
Technical Interview Evaluation Service
Evaluates candidate answers using LLM
"""

from typing import List, Optional
from pydantic import BaseModel
import os
import requests
import json

class EvaluationRequest(BaseModel):
    question: str
    answer: str
    expectedConcepts: Optional[List[str]] = []
    topic: Optional[str] = None

class EvaluationResponse(BaseModel):
    score: float  # 0-10
    feedback: str
    correctness: float  # 0-10
    depth: float  # 0-10
    clarity: float  # 0-10

def evaluate_technical_answer(request: EvaluationRequest) -> EvaluationResponse:
    """
    Evaluate a technical interview answer using LLM.
    
    Args:
        request: EvaluationRequest containing question, answer, and context
        
    Returns:
        EvaluationResponse with scores and feedback
    """
    
    # Build the evaluation prompt
    expected_concepts_str = ", ".join(request.expectedConcepts) if request.expectedConcepts else "N/A"
    
    prompt = f"""You are a technical interviewer evaluating a candidate's answer.

Question: {request.question}

{f"Topic: {request.topic}" if request.topic else ""}

Expected Key Concepts: {expected_concepts_str}

Candidate's Answer:
{request.answer}

Please evaluate the answer on the following dimensions (rate each 0-10):

1. Correctness: Is the answer factually accurate?
2. Depth: Does the answer demonstrate deep understanding of the concept?
3. Clarity: Is the explanation clear and well-structured?

Provide:
- A score for each dimension (0-10)
- An overall score (0-10, average of the three dimensions)
- Constructive feedback (2-3 sentences)

Return your evaluation in the following JSON format:
{{
  "correctness": <score 0-10>,
  "depth": <score 0-10>,
  "clarity": <score 0-10>,
  "score": <overall score 0-10>,
  "feedback": "<constructive feedback>"
}}
"""

    # Get LLM endpoint from environment
    llm_endpoint = os.getenv('LLM_ENDPOINT', 'http://localhost:11434/api/generate')
    model = os.getenv('LLM_MODEL', 'llama3')
    
    try:
        # Call LLM API (Ollama format)
        response = requests.post(
            llm_endpoint,
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            # Parse the response
            if 'response' in result:
                try:
                    evaluation = json.loads(result['response'])
                    
                    # Validate and normalize scores
                    correctness = max(0, min(10, float(evaluation.get('correctness', 5))))
                    depth = max(0, min(10, float(evaluation.get('depth', 5))))
                    clarity = max(0, min(10, float(evaluation.get('clarity', 5))))
                    score = (correctness + depth + clarity) / 3
                    
                    return EvaluationResponse(
                        score=round(score, 1),
                        feedback=evaluation.get('feedback', 'Answer evaluated'),
                        correctness=round(correctness, 1),
                        depth=round(depth, 1),
                        clarity=round(clarity, 1)
                    )
                except json.JSONDecodeError:
                    pass
        
    except Exception as e:
        print(f"LLM evaluation error: {str(e)}")
    
    # Fallback: Simple heuristic evaluation
    answer_length = len(request.answer.strip())
    
    # Basic scoring based on answer length and keyword matching
    correctness = 5.0
    depth = 5.0
    clarity = 5.0
    
    # Adjust based on answer length
    if answer_length < 50:
        depth = 3.0
        clarity = 4.0
    elif answer_length > 200:
        depth = 7.0
        clarity = 7.0
    
    # Keyword matching for correctness
    if request.expectedConcepts:
        matched_concepts = sum(1 for concept in request.expectedConcepts 
                              if concept.lower() in request.answer.lower())
        concept_ratio = matched_concepts / len(request.expectedConcepts)
        correctness = 3.0 + (concept_ratio * 7.0)
    
    score = (correctness + depth + clarity) / 3
    
    return EvaluationResponse(
        score=round(score, 1),
        feedback="Your answer has been recorded. Consider elaborating on key concepts and providing examples.",
        correctness=round(correctness, 1),
        depth=round(depth, 1),
        clarity=round(clarity, 1)
    )
