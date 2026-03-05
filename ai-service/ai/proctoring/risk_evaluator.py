"""
Risk Evaluator - LLM-based behavioral risk assessment
Analyzes aggregated proctoring events and provides risk scoring
"""
from typing import Dict

from ..config import config
from ..utils import parse_json_response, call_llm_api
from ..utils.llm_client import extract_llm_content
from .models import EventSummary


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

Guidelines for scoring (BE STRICT):
- No face detected: HIGH CONCERN (10 points each) - candidate may have left or is avoiding camera
- Multiple faces: CRITICAL CONCERN (15 points each) - unauthorized assistance detected
- Looking away frequently: MEDIUM CONCERN (3 points each) - may be looking at notes or another screen
- Tab switches: HIGH CONCERN (10 points each) - accessing external resources
- Copy/paste: CRITICAL CONCERN (20 points each) - copying answers from external sources
- Phone detected: CRITICAL CONCERN (25 points each) - using phone for assistance
- Window blur: LOW-MEDIUM CONCERN (4 points each) - distraction or potential window switching

Score calculation example:
- 1 phone detected = 25 points (HIGH risk)
- 3 looking away + 2 tab switches = (3*3) + (2*10) = 29 points (LOW risk)
- 1 phone + 2 tab switches = 25 + 20 = 45 points (MEDIUM risk)
- 2 phones + 5 tab switches = 50 + 50 = 100 points (HIGH risk)

Risk Levels:
- Low (0-39): Minor or no violations detected
- Medium (40-69): Moderate concerns, needs attention
- High (70-100): Serious violations, likely cheating

BE MORE SENSITIVE TO VIOLATIONS. Even a single phone detection should result in at least MEDIUM risk.

Provide:
1. Risk score (0-100, calculated strictly according to guidelines)
2. Risk level (Low/Medium/High based on score ranges above)
3. Brief reasoning explanation (2-3 sentences explaining the specific violations detected)

Return ONLY valid JSON in this exact format:
{{
  "risk_score": <number between 0-100>,
  "risk_level": "<Low|Medium|High>",
  "reason": "<explanation of specific violations>"
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
    print(f"🔍 Evaluating risk for session: {summary.total_no_face} no_face, {summary.total_multiple_face} multi_face, {summary.total_phone_detected} phone, {summary.total_tab_switch} tab_switch")
    
    if not config.is_llm_configured():
        print("⚠ LLM not configured, using fallback risk calculation")
        return calculate_fallback_risk(summary)
    
    try:
        print("🤖 Calling LLM for risk evaluation...")
        prompt = generate_llm_prompt(summary)
        
        response_json = call_llm_api(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=800,
            timeout=60
        )
        
        content = extract_llm_content(response_json)
        if not content:
            print("⚠ Invalid LLM response, using fallback")
            return calculate_fallback_risk(summary)
        
        print(f"✓ LLM response received: {content[:200]}...")
        result = parse_json_response(content)
        
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
    
    # No face detected - 8 points each (increased from 5)
    if summary.total_no_face > 0:
        risk_score += summary.total_no_face * 8
        concerns.append(f"face absent {summary.total_no_face} times")
    
    # Multiple faces - 15 points each (increased from 10)
    if summary.total_multiple_face > 0:
        risk_score += summary.total_multiple_face * 15
        concerns.append(f"multiple faces {summary.total_multiple_face} times")
    
    # Looking away - 3 points each (increased from 2)
    if summary.total_looking_away > 0:
        risk_score += summary.total_looking_away * 3
        concerns.append(f"looking away {summary.total_looking_away} times")
    
    # Tab switches - 10 points each (increased from 8)
    if summary.total_tab_switch > 0:
        risk_score += summary.total_tab_switch * 10
        concerns.append(f"{summary.total_tab_switch} tab switches")
    
    # Window blur - 4 points each (increased from 3)
    if summary.total_window_blur > 0:
        risk_score += summary.total_window_blur * 4
        concerns.append(f"{summary.total_window_blur} window blur events")
    
    # Copy/paste - 20 points each (increased from 15)
    if summary.total_copy_paste > 0:
        risk_score += summary.total_copy_paste * 20
        concerns.append(f"{summary.total_copy_paste} copy/paste attempts")
    
    # Phone detected - 25 points each (increased from 20)
    if summary.total_phone_detected > 0:
        risk_score += summary.total_phone_detected * 25
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
