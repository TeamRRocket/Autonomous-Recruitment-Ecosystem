"""
Proctoring AI Module - Models
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional


class FrameProcessRequest(BaseModel):
    """Request model for frame processing"""
    session_id: str = Field(..., description="Proctoring session ID")
    frame_data: str = Field(..., description="Base64 encoded frame data")


class FrameProcessResponse(BaseModel):
    """Response model for frame processing"""
    face_count: int = Field(..., description="Number of faces detected")
    looking_away: bool = Field(..., description="Whether candidate is looking away")
    phone_detected: bool = Field(default=False, description="Whether phone was detected")
    timestamp: str = Field(..., description="Processing timestamp")


class EventSummary(BaseModel):
    """Event summary for risk evaluation"""
    total_no_face: int = Field(default=0)
    total_multiple_face: int = Field(default=0)
    total_looking_away: int = Field(default=0)
    total_tab_switch: int = Field(default=0)
    total_window_blur: int = Field(default=0)
    total_copy_paste: int = Field(default=0)
    total_phone_detected: int = Field(default=0)
    longest_looking_away_seconds: int = Field(default=0)


class RiskEvaluationRequest(BaseModel):
    """Request model for risk evaluation"""
    session_id: str = Field(..., description="Proctoring session ID")
    summary: EventSummary = Field(..., description="Aggregated event summary")


class RiskEvaluationResponse(BaseModel):
    """Response model for risk evaluation"""
    risk_score: int = Field(..., ge=0, le=100, description="Risk score (0-100)")
    risk_level: str = Field(..., description="Risk level: Low, Medium, or High")
    reason: str = Field(..., description="Explanation for the risk assessment")
