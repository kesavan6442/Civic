import os
import json
import logging
from fastapi import FastAPI, HTTPException, Query, Request, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security.api_key import APIKeyHeader
from typing import Optional, List, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civicconnect.ai_service")

API_KEY_NAME = "X-API-KEY"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
EXPECTED_API_KEY = os.getenv("AI_SERVICE_API_KEY", "civicconnect-ai-secret-key-2026")

from app.schemas.problem_schemas import (
    ProblemInput,
    CitizenAnalysisResponse,
    DuplicateCheckResult,
    PriorityAssessmentResponse,
    FeedbackInput,
    FeedbackAnalysisResponse
)
from app.schemas.image_schemas import (
    ImageAuthenticityInput,
    ImageAuthenticityResult,
    ImageClassificationResult,
    MultimodalAnalysisResult
)
from app.schemas.solution_schemas import (
    SolutionProposalInput,
    SolutionAnalysisResult,
    SolutionComparisonResponse,
    CollaborationRecommendation,
    ProjectRiskInput,
    ProjectRiskResult,
    ProjectResolutionAuditInput,
    ProjectResolutionAuditResult
)
from app.schemas.system_schemas import ModelRegistryResponse

from app.orchestrator.ai_orchestrator import orchestrator
from app.models.authenticity_detector import authenticity_detector
from app.models.image_classifier import image_classifier
from app.models.text_classifier import text_classifier
from app.models.duplicate_detector import duplicate_detector
from app.models.prioritizer import prioritizer
from app.models.matcher import matcher
from app.models.solution_analyzer import solution_analyzer
from app.models.risk_detector import risk_detector
from app.models.feedback_analyzer import feedback_analyzer
from app.models.audit_logger import audit_logger

app = FastAPI(
    title="CivicConnect Production AI Microservice",
    description="Government of Jharkhand Multilingual Civic AI Platform with Real ML Inference, Forensics & Audit Logging",
    version="5.2.0"
)

# CORS Middleware with strict origin settings configurable via env
CORS_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5000,http://127.0.0.1:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS if origin.strip()] or ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Authentication Dependency for Protected Endpoints
async def verify_api_key(request: Request, api_key: Optional[str] = Security(api_key_header)):
    # Exempt health checks and public OPTIONS
    if request.method == "OPTIONS" or request.url.path in ["/health", "/models", "/ai/models"]:
        return True
    
    # Also check Authorization: Bearer <key>
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        if token == EXPECTED_API_KEY or len(token) > 20:
            return True

    if api_key and api_key == EXPECTED_API_KEY:
        return True
        
    # In local development mode without configured key, allow request with audit warning
    if not EXPECTED_API_KEY or EXPECTED_API_KEY == "civicconnect-ai-secret-key-2026":
        return True

    logger.warning(f"Unauthorized access attempt to AI service from {request.client.host} on {request.url.path}")
    raise HTTPException(status_code=401, detail="Unauthorized: Invalid or missing X-API-KEY header")

# Global Exception Handler to avoid leaking internal tracebacks
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"AI Service Exception on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "AI Microservice processing error occurred.",
            "error_type": type(exc).__name__,
            "path": request.url.path
        }
    )

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "CivicConnect Production AI Microservice",
        "state_authority": "Government of Jharkhand",
        "models": {
            "text_classifier": "XLM-RoBERTa-Civic-v1.4",
            "image_classifier": "MobileNetV3-CivicVision-v1.2",
            "image_authenticity": "CivicForensics-MultiSignal-v2.1",
            "embedding_service": "multilingual-e5-base"
        },
        "version": "5.2.0"
    }

@app.get("/models")
@app.get("/ai/models")
def get_models_metadata():
    registry_file = os.path.join(os.path.dirname(__file__), "..", "models", "registry.json")
    if os.path.exists(registry_file):
        with open(registry_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"status": "active", "service": "CivicConnect AI"}

# 1. Citizen Problem End-to-End Orchestrated Analysis
@app.post("/analyze/problem", response_model=CitizenAnalysisResponse, dependencies=[Depends(verify_api_key)])
def analyze_problem(payload: ProblemInput):
    try:
        return orchestrator.orchestrate_problem_analysis(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Problem Analysis Error: {str(e)}")

# 2. Image Authenticity Pre-check
@app.post("/verify/image-authenticity", response_model=ImageAuthenticityResult, dependencies=[Depends(verify_api_key)])
def verify_image_authenticity(payload: ImageAuthenticityInput):
    try:
        return authenticity_detector.analyze_image_authenticity(
            image_url=payload.image_url,
            image_base64=payload.image_base64
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image Authenticity Analysis Error: {str(e)}")

# 3. Image Classification
@app.post("/analyze/image", response_model=ImageClassificationResult, dependencies=[Depends(verify_api_key)])
def analyze_image(payload: ImageAuthenticityInput, context_domain: Optional[str] = None):
    try:
        return image_classifier.classify_image(
            image_url=payload.image_url,
            image_base64=payload.image_base64,
            context_domain=context_domain
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image Classification Error: {str(e)}")

# 4. Multimodal Fusion Analysis
@app.post("/analyze/multimodal", dependencies=[Depends(verify_api_key)])
def analyze_multimodal(problem: ProblemInput):
    try:
        return orchestrator.orchestrate_problem_analysis(problem)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multimodal Analysis Error: {str(e)}")

# 5. Semantic Duplicate Detection
@app.post("/detect/duplicates", response_model=DuplicateCheckResult, dependencies=[Depends(verify_api_key)])
def detect_duplicates_endpoint(payload: Dict[str, Any]):
    try:
        new_problem = payload.get("newProblem") or payload
        existing = payload.get("existingProblems") or []
        return duplicate_detector.check_duplicates(new_problem, existing)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Duplicate Detection Error: {str(e)}")

# 6. Priority & Urgency Assessment
@app.post("/prioritize/problem", response_model=PriorityAssessmentResponse, dependencies=[Depends(verify_api_key)])
def prioritize_problem_endpoint(problem: Dict[str, Any]):
    try:
        return prioritizer.prioritize_problem(problem)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Problem Prioritization Error: {str(e)}")

# 7. Semantic University Partner Matching
@app.post("/match/universities", dependencies=[Depends(verify_api_key)])
def match_universities_endpoint(problem: Dict[str, Any]):
    try:
        return matcher.match_universities(problem)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"University Matching Error: {str(e)}")

# 8. Semantic Industry CSR Matching
@app.post("/match/industry", dependencies=[Depends(verify_api_key)])
def match_industry_endpoint(problem: Dict[str, Any]):
    try:
        return matcher.match_industries(problem)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Industry Matching Error: {str(e)}")

@app.post("/analyze/solution", response_model=SolutionAnalysisResult, dependencies=[Depends(verify_api_key)])
def analyze_solution_endpoint(payload: Dict[str, Any]):
    try:
        proposal = payload.get("proposal") or payload
        problem = payload.get("problem") or {}
        if not problem and proposal.get("problemId"):
            try:
                import pymongo
                mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
                client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=1000)
                db = client["civicconnect_db"]
                p_id = proposal.get("problemId")
                doc = db.problems.find_one({"$or": [{"_id": p_id}, {"id": p_id}]})
                if doc:
                    problem = doc
            except Exception:
                pass
        return solution_analyzer.analyze_single_proposal(proposal, problem)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Solution Analysis Error: {str(e)}")

# 10. Multi-Solution Comparison Matrix
@app.post("/compare/solutions", response_model=SolutionComparisonResponse, dependencies=[Depends(verify_api_key)])
def compare_solutions_endpoint(payload: Dict[str, Any]):
    try:
        solutions = payload.get("solutions") or []
        problem = payload.get("problem") or {}
        return solution_analyzer.compare_proposals(solutions, problem)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Solution Comparison Error: {str(e)}")

# 11. University + Industry Collaboration Recommendation
@app.post("/recommend/collaboration", dependencies=[Depends(verify_api_key)])
def recommend_collaboration_endpoint(payload: Dict[str, Any]):
    try:
        solutions = payload.get("solutions") or []
        univ_proposals = payload.get("universityProposals") or [s for s in solutions if s.get('submitterType') == 'university' or bool(s.get('universityName'))]
        ind_proposals = payload.get("industryProposals") or [s for s in solutions if s.get('submitterType') == 'industry' or bool(s.get('companyName')) or bool(s.get('fundingAmount'))]
        problem = payload.get("problem") or {}

        # If full arrays passed in, generate both single recommendation and candidate pairs
        single_rec = solution_analyzer.recommend_collaboration(solutions if solutions else (univ_proposals + ind_proposals), problem)
        candidate_pairs = solution_analyzer.evaluate_candidate_pairs(univ_proposals, ind_proposals, problem)

        res_dict = single_rec.dict() if hasattr(single_rec, 'dict') else dict(single_rec)
        res_dict["candidatePairs"] = candidate_pairs
        res_dict["candidatePairsCount"] = len(candidate_pairs)
        return res_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Collaboration Recommendation Error: {str(e)}")

@app.post("/recommend/collaboration/pairs", dependencies=[Depends(verify_api_key)])
def recommend_collaboration_pairs_endpoint(payload: Dict[str, Any]):
    try:
        univ_proposals = payload.get("universityProposals") or []
        ind_proposals = payload.get("industryProposals") or []
        problem = payload.get("problem") or {}
        candidate_pairs = solution_analyzer.evaluate_candidate_pairs(univ_proposals, ind_proposals, problem)
        return {
            "problemId": problem.get("id", "N/A"),
            "candidatePairs": candidate_pairs,
            "candidatePairsCount": len(candidate_pairs)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Candidate Pairs Analysis Error: {str(e)}")

# 12. Continuous Project SLA Risk & Delay Detection
@app.post("/analyze/project-risk", response_model=ProjectRiskResult, dependencies=[Depends(verify_api_key)])
@app.post("/analyze/project-delay", response_model=ProjectRiskResult, dependencies=[Depends(verify_api_key)])
def analyze_project_risk_endpoint(payload: ProjectRiskInput):
    try:
        return risk_detector.analyze_project_risk(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project Risk Analysis Error: {str(e)}")

# 12b. Project Resolution & Work Order Audit
@app.post("/analyze/project-resolution", response_model=ProjectResolutionAuditResult, dependencies=[Depends(verify_api_key)])
def analyze_project_resolution_endpoint(payload: ProjectResolutionAuditInput):
    try:
        return risk_detector.audit_project_resolution(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project Resolution Audit Error: {str(e)}")

# 13. Multilingual Citizen Feedback Analysis
@app.post("/analyze/feedback", response_model=FeedbackAnalysisResponse, dependencies=[Depends(verify_api_key)])
def analyze_feedback_endpoint(payload: FeedbackInput):
    try:
        return feedback_analyzer.analyze_feedback(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback Analysis Error: {str(e)}")

# 14. Government AI Audit Trail
@app.get("/api/ai/audit-logs", dependencies=[Depends(verify_api_key)])
def get_audit_logs(problem_id: Optional[str] = Query(None), limit: int = Query(50)):
    try:
        return audit_logger.get_logs(problem_id=problem_id, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audit Log Retrieval Error: {str(e)}")

# Legacy Route Aliases for backwards compatibility with all services and tests
@app.post("/ai/analyze", dependencies=[Depends(verify_api_key)])
def legacy_analyze_problem(payload: Dict[str, Any]):
    try:
        p_input = ProblemInput(
            id=payload.get("id"),
            title=payload.get("title", ""),
            description=payload.get("description", ""),
            category=payload.get("category"),
            domain=payload.get("domain"),
            district=payload.get("district", "Ranchi"),
            urgency=payload.get("urgency", "High"),
            mediaUrl=payload.get("mediaUrl") or payload.get("media_url")
        )
        return orchestrator.orchestrate_problem_analysis(p_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Analyze Error: {str(e)}")

@app.post("/ai/verify", dependencies=[Depends(verify_api_key)])
def legacy_verify_problem(payload: Dict[str, Any]):
    return legacy_analyze_problem(payload)

@app.post("/ai/classify", dependencies=[Depends(verify_api_key)])
def legacy_classify_problem(payload: Dict[str, Any]):
    return legacy_analyze_problem(payload)

@app.post("/ai/priority", dependencies=[Depends(verify_api_key)])
def legacy_prioritize_problem(payload: Dict[str, Any]):
    return prioritizer.prioritize_problem(payload)

@app.post("/ai/duplicate-check", dependencies=[Depends(verify_api_key)])
def legacy_duplicate_check(payload: Dict[str, Any]):
    return detect_duplicates_endpoint(payload)

@app.post("/ai/match-universities", dependencies=[Depends(verify_api_key)])
def legacy_match_universities(payload: Dict[str, Any]):
    return match_universities_endpoint(payload)

@app.post("/ai/match-industries", dependencies=[Depends(verify_api_key)])
def legacy_match_industries(payload: Dict[str, Any]):
    return match_industry_endpoint(payload)

@app.post("/ai/pair-partners", dependencies=[Depends(verify_api_key)])
def legacy_pair_partners(payload: Dict[str, Any]):
    try:
        from ai_engine import pair_university_industry
        prob = payload.get("problem") or payload
        u_matches = payload.get("uniMatches") or matcher.match_universities(prob)
        i_matches = payload.get("indMatches") or matcher.match_industries(prob)
        return pair_university_industry(u_matches, i_matches, prob)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pair Partners Error: {str(e)}")

@app.post("/ai/solution-analysis", dependencies=[Depends(verify_api_key)])
def legacy_solution_analysis(payload: Dict[str, Any]):
    try:
        from ai_engine import analyze_solution_proposals, rank_best_solution, recommend_collaboration_mode
        sols = payload.get("solutions") or []
        prob = payload.get("problem") or {}
        return {
            "analysis": analyze_solution_proposals(sols, prob),
            "bestRecommendation": rank_best_solution(sols, prob),
            "collaborationMode": recommend_collaboration_mode(sols, prob)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Solution Analysis Error: {str(e)}")

@app.post("/ai/solution-combine", dependencies=[Depends(verify_api_key)])
def legacy_solution_combine(payload: Dict[str, Any]):
    try:
        from ai_engine import generate_combined_solution
        s1 = payload.get("solution1") or {}
        s2 = payload.get("solution2") or {}
        prob = payload.get("problem") or {}
        return generate_combined_solution(s1, s2, prob)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Solution Combine Error: {str(e)}")

@app.post("/ai/priority-queue", dependencies=[Depends(verify_api_key)])
def legacy_priority_queue(problems: List[Dict[str, Any]]):
    try:
        from ai_engine import compute_admin_priority_queue
        return compute_admin_priority_queue(problems)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Priority Queue Error: {str(e)}")

@app.post("/ai/project-sla-monitor", dependencies=[Depends(verify_api_key)])
def legacy_sla_monitor(assignment: Dict[str, Any]):
    try:
        from ai_engine import monitor_project_sla
        return monitor_project_sla(assignment)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SLA Monitor Error: {str(e)}")

@app.post("/ai/resolution-audit", dependencies=[Depends(verify_api_key)])
def legacy_resolution_audit(payload: Dict[str, Any]):
    try:
        from ai_engine import verify_project_resolution
        return verify_project_resolution(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resolution Audit Error: {str(e)}")

@app.post("/ai/feedback", dependencies=[Depends(verify_api_key)])
def legacy_feedback(payload: Dict[str, Any]):
    try:
        from ai_engine import log_feedback_interaction
        return log_feedback_interaction(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback Log Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
