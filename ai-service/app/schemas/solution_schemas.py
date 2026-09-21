from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SolutionProposalInput(BaseModel):
    id: Optional[str] = None
    problemId: str
    problemTitle: Optional[str] = None
    submitterType: str = "university"  # university or industry
    universityId: Optional[str] = None
    universityName: Optional[str] = None
    department: Optional[str] = None
    companyId: Optional[str] = None
    companyName: Optional[str] = None
    teamLeadName: Optional[str] = None
    solutionTitle: str
    technicalApproach: Optional[str] = None
    description: Optional[str] = None
    estimatedCost: Optional[str] = None
    fundingAmount: Optional[str] = None
    estimatedTimeWeeks: Optional[int] = None
    files: Optional[List[Dict[str, Any]]] = []
    folderLink: Optional[str] = None

class ScoreDetail(BaseModel):
    score: float
    score_type: str
    model_version: str = "civic-solution-eval-v2.2"
    analysis_timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    explanation: str
    factors: List[str] = []

class SolutionAnalysisResult(BaseModel):
    solutionId: str
    providerName: str
    providerType: str
    hasSufficientInfo: bool
    technicalQualityScore: Optional[str] = None  # e.g., "78%"
    feasibilityScore: Optional[str] = None       # e.g., "82%"
    scalabilityScore: Optional[str] = None       # e.g., "75%"
    overallScore: str                            # e.g., "79%" or "Pending detailed analysis"
    overallScoreValue: Optional[float] = None    # 0.79 float
    alignmentScore: Optional[float] = None
    methodologyScore: Optional[float] = None
    budgetRealismScore: Optional[float] = None
    timelineFeasibilityScore: Optional[float] = None
    detailedScores: List[ScoreDetail] = []
    missingFields: List[str] = []
    keyStrengths: List[str] = []
    identifiedRisks: List[str] = []
    evaluationSummary: str
    modelVersion: str = "civic-solution-eval-v2.2"
    analysisTimestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    needsHumanReview: bool = False

class SolutionComparisonResponse(BaseModel):
    problemId: str
    totalSolutionsSubmitted: int
    analyzedSolutions: List[SolutionAnalysisResult] = []
    bestRecommendation: Optional[Dict[str, Any]] = None
    comparisonMatrix: Dict[str, Any] = {}
    adminNotice: str = "AI Recommendation Only — Final Award Decision is reserved for the District Administrator."

class CollaborationRecommendation(BaseModel):
    problemId: str
    recommendedMode: str
    jointRationale: str
    universityRoleSuggestion: str
    industryRoleSuggestion: str
    universityRole: Optional[str] = None
    industryRole: Optional[str] = None
    capabilityMatch: Optional[str] = None
    technicalAlignment: Optional[float] = None
    fundingAlignment: Optional[float] = None
    deploymentAlignment: Optional[float] = None
    synergyScore: Optional[float] = None
    synergyScorePct: Optional[str] = None
    risks: List[str] = []
    recommendedNextSteps: List[str] = []
    combinedEstimatedTimeline: str
    adminApprovalRequired: bool = True
    modelVersion: str = "civic-hybrid-matcher-v2.2"
    analysisTimestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    needsHumanReview: bool = False

class ProjectRiskInput(BaseModel):
    assignmentId: str
    problemId: Optional[str] = None
    daysElapsed: int
    totalSlaDays: int = 90
    milestones: List[Dict[str, Any]] = []
    lastReportDate: Optional[str] = None
    budgetSpentPercentage: Optional[float] = None
    modificationRequestsCount: int = 0
    prototypeTestingPassed: Optional[bool] = None
    citizenEscalationsCount: int = 0

class ProjectRiskResult(BaseModel):
    assignmentId: str
    problemId: Optional[str] = None
    riskLevel: str  # Low, Medium, High, Critical
    daysElapsed: int
    daysRemaining: int
    slaProgressPercentage: int
    slaBurnPercentage: float
    milestoneVelocity: float
    milestonesCompleted: str
    delayProbability: Optional[float] = None
    projectedDelayDays: int = 0
    activeRiskFactors: List[str] = []
    aiProgressSummary: str
    adminInterventionRecommended: bool
    modelVersion: str = "civic-project-sla-v2.1"
    analyzedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    needsHumanReview: bool = False

class ProjectResolutionAuditInput(BaseModel):
    projectId: str
    problemId: str
    verificationNotes: str
    finalDeliverablesSummary: Optional[str] = None
    evidenceUrls: List[str] = []
    milestonesCompletedCount: int
    totalMilestonesCount: int
    daysToResolve: int

class ProjectResolutionAuditResult(BaseModel):
    projectId: str
    problemId: str
    isResolutionValid: bool
    auditScore: float
    auditStatus: str  # VERIFIED, INCOMPLETE, REJECTED
    deliverablesCompleteness: float
    evidenceVerificationStatus: str
    auditFindings: List[str] = []
    recommendation: str
    modelVersion: str = "civic-resolution-audit-v2.1"
    auditedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    needsHumanReview: bool = False
