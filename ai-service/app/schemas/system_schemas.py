from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ModelMetadata(BaseModel):
    model_name: str
    model_version: str
    architecture: str
    supported_languages: List[str]
    training_date: Optional[str] = None
    dataset_type: str = "manually_verified" # development_sample, manually_verified, external_benchmark
    evaluation_metrics: Dict[str, Any] = {}
    status: str = "active"

class ModelRegistryResponse(BaseModel):
    service: str = "CivicConnect AI Engine"
    environment: str = "Production"
    models: Dict[str, ModelMetadata]

class AuditLogEntry(BaseModel):
    log_id: str
    problem_id: Optional[str] = None
    model_name: str
    model_version: str
    input_type: str  # text, image, multimodal, proposal, risk
    prediction: Dict[str, Any]
    confidence: Optional[float] = None
    recommendation: str
    human_decision: Optional[str] = "Pending Admin Review"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class AuditLogFilter(BaseModel):
    problem_id: Optional[str] = None
    model_name: Optional[str] = None
    limit: int = 50
