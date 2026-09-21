from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProblemInput(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., description="Problem title submitted by citizen")
    description: str = Field(..., description="Detailed problem description")
    category: Optional[str] = None
    domain: Optional[str] = None
    citizenName: Optional[str] = "Anonymous Citizen"
    citizenPhone: Optional[str] = None
    district: Optional[str] = "Ranchi"
    locationAddress: Optional[str] = None
    urgency: Optional[str] = "High"
    mediaType: Optional[str] = "image"
    mediaUrl: Optional[str] = None
    additionalInfo: Optional[Dict[str, Any]] = None

class DuplicateMatch(BaseModel):
    problem_id: str
    problem_title: Optional[str] = None
    similarity: float
    reason: str
    geographical_distance_km: Optional[float] = None

class DuplicateCheckResult(BaseModel):
    duplicate_detected: bool
    matches: List[DuplicateMatch] = []
    top_similarity: float = 0.0
    recommendation: str = "Unique Problem Statement"

class CitizenAnalysisResponse(BaseModel):
    problem_id: Optional[str] = None
    domain: str
    category: str
    urgency: str
    confidence: float
    keywords: List[str] = []
    missing_information: List[str] = []
    needs_human_review: bool = False
    verification_recommendation: str
    verification_reason: str
    duplicate_candidates: List[DuplicateMatch] = []
    image_authenticity: Optional[Dict[str, Any]] = None
    multimodal_conflict: bool = False
    model_version: str = "XLM-RoBERTa-Civic-v1.4"
    analysis_status: str = "COMPLETED"
    analyzed_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class PriorityAssessmentResponse(BaseModel):
    priority: str
    severity_score: Optional[str] = None
    has_sufficient_info: bool = True
    impact_level: str
    estimated_affected_population: str
    reasons: List[str] = []
    needs_human_review: bool = False

class FeedbackInput(BaseModel):
    problemId: str
    citizenFeedbackText: str
    rating: Optional[int] = None
    feedbackDate: Optional[str] = None

class FeedbackAnalysisResponse(BaseModel):
    problemId: str
    sentiment: str  # Positive, Neutral, Negative
    confidence: float
    satisfaction_level: str
    extracted_issues: List[str] = []
    service_complaint: bool = False
    additional_problem_detected: bool = False
    admin_review_required: bool = False
    summary: str
