from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class AuthenticityStatus(str, Enum):
    REAL = "REAL"
    AI_GENERATED = "AI_GENERATED"
    MANIPULATED = "MANIPULATED"
    UNCERTAIN = "UNCERTAIN"

class ImageAuthenticityInput(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    file_name: Optional[str] = None
    mime_type: Optional[str] = "image/jpeg"

class ImageAuthenticityResult(BaseModel):
    status: AuthenticityStatus
    confidence: float = Field(..., ge=0.0, le=1.0)
    model_name: str
    model_version: str
    is_acceptable_evidence: bool
    rejection_reason: Optional[str] = None
    forensic_signals: Dict[str, Any] = {}
    checked_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ImageClassificationResult(BaseModel):
    predicted_category: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    detected_visual_evidence: List[str] = []
    secondary_categories: List[Dict[str, Any]] = []
    needs_human_review: bool = False

class MultimodalAnalysisResult(BaseModel):
    combined_domain: str
    combined_category: str
    confidence: float
    text_prediction: Dict[str, Any]
    image_prediction: Optional[Dict[str, Any]] = None
    image_authenticity: Optional[ImageAuthenticityResult] = None
    multimodal_conflict: bool = False
    conflict_details: Optional[str] = None
    recommended_admin_action: str
