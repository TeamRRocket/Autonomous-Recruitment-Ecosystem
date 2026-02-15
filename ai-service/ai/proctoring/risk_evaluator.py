"""
Risk Evaluator - LLM-based behavioral risk assessment
Analyzes aggregated proctoring events and provides risk scoring
"""
import os
import json
import requests
from typing import Dict
from .models import EventSummary


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def generate_llm_prompt(summary: EventSummary) -> str:
    """
    Generate LLM prompt for risk evaluation
    
    Args:
        summary: Aggregated event summary
        
    Returns:
        Formatted prompt string
    """
    prompt = f"""You are an AI exam proctor analyzing a candidate's behavior during an online assessment.

Session Summary:
- No face detected: {summary.total_no_face} times
- Multiple faces detected: {summary.total_multiple_face} times
- Looking away: {summary.total_looking_away} times
- Longest looking away duration: {summary.longest_looking_away_seconds} seconds
- Tab switches: {summary.total_tab_switch} times
- Window blur events: {summary.total_window_blur} times
- Copy/paste attempts: {summary.total_copy_paste} times
- Phone detected: {summary.total_phone_detected} times

Your task is to evaluate the risk level of potential cheating based on these behavioral indicators.

Guidelines:
- No face detected: High concern (candidate may have left or is avoiding camera)
- Multiple faces: Very high concern (unauthorized assistance)
- Looking away frequently: Medium concern (may be looking at notes or another screen)
- Tab switches: High concern (accessing external resources)
- Copy/paste: Very high concern (copying answers from external sources)
- Phone detected: Very high concern (using phone for assistance)

Provide:
1. Risk score (0-100, where 0 is no risk and 100 is extremely high risk)
2. Risk level (Low/Medium/High)
   - Low: 0-39
   - Medium: 40-69
   - High: 70-100
3. Brief reasoning explanation (2-3 sentences)

Return ONLY valid JSON in this exact format:
{{
  "risk_score": <0-100>,
  "risk_level": "<Low|Medium|High>",
  "reason": "<explanation>"
}}"""
    
    return prompt


def evaluate_risk_with_llm(summary: EventSummary) -> Dict:
    """
    Evaluate risk using LLM
    
    Args:
        summary: Aggregated event summary
        
    Returns:
        Dictionary with risk_score, risk_level, and reason
    """
    if not OPENROUTER_API_KEY:
        print("⚠ OPENROUTER_API_KEY not set, using fallback risk calculation")
        return calculate_fallback_risk(summary)
    
    try:
        prompt = generate_llm_prompt(summary)
        
        response = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "HireFlow AI Proctoring"
            },
            json={
                "model": "anthropic/claude-3.5-sonnet",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3,
                "max_tokens": 500
            },
            timeout=30
        )
        
        response.raise_for_status()
        response_json = response.json()
        
        if "choices" not in response_json or not response_json["choices"]:
            print("⚠ Invalid LLM response, using fallback")
            return calculate_fallback_risk(summary)
        
        content = response_json["choices"][0]["message"]["content"]
        
        # Parse JSON from response (handle markdown code blocks)
        content = content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()
        
        result = json.loads(content)
        
        # Validate response
        if "risk_score" not in result or "risk_level" not in result or "reason" not in result:
            print("⚠ Incomplete LLM response, using fallback")
            return calculate_fallback_risk(summary)
        
        # Ensure risk_score is in valid range
        result["risk_score"] = max(0, min(100, int(result["risk_score"])))
        
        # Validate risk_level
        if result["risk_level"] not in ["Low", "Medium", "High"]:
            # Infer from score
            score = result["risk_score"]
            if score < 40:
                result["risk_level"] = "Low"
            elif score < 70:
                result["risk_level"] = "Medium"
            else:
                result["risk_level"] = "High"
        
        print(f"✓ LLM risk evaluation: {result['risk_level']} ({result['risk_score']})")
        return result
        
    except Exception as e:
        print(f"⚠ LLM evaluation failed: {e}, using fallback")
        return calculate_fallback_risk(summary)


def calculate_fallback_risk(summary: EventSummary) -> Dict:
    """
    Calculate risk score using rule-based logic (fallback when LLM fails)
    
    Args:
        summary: Aggregated event summary
        
    Returns:
        Dictionary with risk_score, risk_level, and reason
    """
    risk_score = 0
    concerns = []
    
    # No face detected - 5 points each
    if summary.total_no_face > 0:
        risk_score += summary.total_no_face * 5
        concerns.append(f"face absent {summary.total_no_face} times")
    
    # Multiple faces - 10 points each (very serious)
    if summary.total_multiple_face > 0:
        risk_score += summary.total_multiple_face * 10
        concerns.append(f"multiple faces {summary.total_multiple_face} times")
    
    # Looking away - 2 points each
    if summary.total_looking_away > 0:
        risk_score += summary.total_looking_away * 2
        concerns.append(f"looking away {summary.total_looking_away} times")
    
    # Tab switches - 8 points each
    if summary.total_tab_switch > 0:
        risk_score += summary.total_tab_switch * 8
        concerns.append(f"{summary.total_tab_switch} tab switches")
    
    # Window blur - 3 points each
    if summary.total_window_blur > 0:
        risk_score += summary.total_window_blur * 3
        concerns.append(f"{summary.total_window_blur} window blur events")
    
    # Copy/paste - 15 points each (very serious)
    if summary.total_copy_paste > 0:
        risk_score += summary.total_copy_paste * 15
        concerns.append(f"{summary.total_copy_paste} copy/paste attempts")
    
    # Phone detected - 20 points each (very serious)
    if summary.total_phone_detected > 0:
        risk_score += summary.total_phone_detected * 20
        concerns.append(f"phone detected {summary.total_phone_detected} times")
    
    # Cap at 100
    risk_score = min(100, risk_score)
    
    # Determine risk level
    if risk_score < 40:
        risk_level = "Low"
    elif risk_score < 70:
        risk_level = "Medium"
    else:
        risk_level = "High"
    
    # Generate reason
    if len(concerns) == 0:
        reason = "No significant violations detected during the exam."
    else:
        reason = f"Detected: {', '.join(concerns)}. Risk assessment based on automated detection."
    
    print(f"✓ Fallback risk calculation: {risk_level} ({risk_score})")
    
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "reason": reason
    }


def evaluate_risk(summary: EventSummary) -> Dict:
    """
    Main entry point for risk evaluation
    
    Args:
        summary: Aggregated event summary
        
    Returns:
        Dictionary with risk_score, risk_level, and reason
    """
    return evaluate_risk_with_llm(summary)
