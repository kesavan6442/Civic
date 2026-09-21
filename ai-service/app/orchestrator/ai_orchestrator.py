from typing import Dict, Any, List, Optional
from app.schemas.problem_schemas import ProblemInput, CitizenAnalysisResponse
from app.schemas.image_schemas import AuthenticityStatus
from app.models.authenticity_detector import authenticity_detector
from app.models.text_classifier import text_classifier
from app.models.image_classifier import image_classifier
from app.models.duplicate_detector import duplicate_detector
from app.models.prioritizer import prioritizer
from app.models.audit_logger import audit_logger

class AIOrchestrator:
    def orchestrate_problem_analysis(
        self,
        problem: ProblemInput,
        existing_problems: Optional[List[Dict[str, Any]]] = None
    ) -> CitizenAnalysisResponse:
        title = problem.title.strip()
        desc = problem.description.strip()
        dist = problem.district or "Ranchi"
        media_url = problem.mediaUrl
        prob_id = problem.id or f"JH-TEMP-{hash(title)%10000:04d}"

        # Step 1: Image Authenticity Pre-check
        auth_result = None
        is_image_usable = False
        rejection_reason = None

        if media_url:
            auth_result = authenticity_detector.analyze_image_authenticity(image_url=media_url)
            if auth_result.status == AuthenticityStatus.REAL:
                is_image_usable = True
            elif auth_result.status == AuthenticityStatus.AI_GENERATED:
                is_image_usable = False
                rejection_reason = auth_result.rejection_reason
            else:  # UNCERTAIN
                is_image_usable = False
                rejection_reason = "Authenticity uncertain: Forwarded to Admin for verification."

        # Step 2: Multilingual Text Classification
        text_result = text_classifier.classify_text(
            title=title,
            description=desc,
            category_hint=problem.category or "",
            district=dist
        )

        # Step 3: Image Classification (if image is genuine and accepted)
        image_result = None
        if is_image_usable and media_url:
            image_result = image_classifier.classify_image(
                image_url=media_url,
                context_domain=text_result['domain']
            )

        # Step 4: Multimodal Fusion & Conflict Detection
        combined_domain = text_result['domain']
        combined_category = text_result['category']
        confidence = text_result['confidence']
        multimodal_conflict = False

        if image_result and is_image_usable:
            # Weighted fusion
            text_conf = text_result['confidence']
            img_conf = image_result.confidence
            
            # Check domain compatibility
            img_cat = image_result.predicted_category.lower()
            text_dom = text_result['domain'].lower()

            is_domain_compatible = any(k in img_cat for k in ['water', 'road', 'waste', 'energy', 'flood', 'agri', 'infra'] if k in text_dom)
            if not is_domain_compatible and text_conf > 0.65 and img_conf > 0.65:
                multimodal_conflict = True
            else:
                confidence = round((text_conf * 0.60) + (img_conf * 0.40), 2)

        # Step 5: Duplicate Detection
        if not existing_problems:
            try:
                import pymongo
                import os
                mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
                client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=1000)
                db = client["civicconnect_db"]
                cursor = db.problems.find({}, {"_id": 1, "id": 1, "title": 1, "description": 1, "district": 1, "category": 1, "domain": 1}).sort("_id", -1).limit(100)
                existing_problems = list(cursor)
            except Exception:
                existing_problems = []

        dup_result = duplicate_detector.check_duplicates(problem.dict(), existing_problems or [])

        # Step 6: Priority Assessment
        priority_result = prioritizer.prioritize_problem(problem.dict())

        # Step 7: Final Admin Verification Recommendation Formulation
        if text_result.get('is_spam'):
            rec_status = "Needs more information"
            rec_reason = f"Syntactic irregularity detected: {text_result.get('spam_reason')}"
            needs_review = True
        elif auth_result and auth_result.status == AuthenticityStatus.AI_GENERATED:
            rec_status = "Needs more information"
            rec_reason = "Uploaded image was detected as synthetic/AI-generated and rejected as evidence. Citizen requested to submit on-site photo."
            needs_review = True
        elif dup_result.duplicate_detected:
            rec_status = "Possible duplicate"
            rec_reason = f"High similarity match found with problem {dup_result.matches[0].problem_id} ({int(dup_result.top_similarity*100)}%)."
            needs_review = True
        elif text_result['needs_human_review'] or confidence < 0.65:
            rec_status = "Low confidence"
            rec_reason = "Basic description provided without sufficient operational detail. Recommended for quick Admin manual triage."
            needs_review = True
        elif multimodal_conflict:
            rec_status = "Admin Review Required"
            rec_reason = "Multimodal discrepancy detected: Submitted photograph does not match text description domain."
            needs_review = True
        else:
            rec_status = "Recommended for verification"
            rec_reason = f"Verified genuine complaint in {dist} with {int(confidence*100)}% AI confidence and valid evidence."
            needs_review = False

        response = CitizenAnalysisResponse(
            problem_id=prob_id,
            domain=combined_domain,
            category=combined_category,
            urgency=priority_result.priority,
            confidence=confidence,
            keywords=text_result.get('keywords', []),
            missing_information=text_result.get('missing_information', []),
            needs_human_review=needs_review,
            verification_recommendation=rec_status,
            verification_reason=rec_reason,
            duplicate_candidates=dup_result.matches,
            image_authenticity=auth_result.dict() if auth_result else None,
            multimodal_conflict=multimodal_conflict,
            model_version=text_result.get('model_version', 'XLM-RoBERTa-Civic-v1.4'),
            analysis_status=text_result.get('analysis_status', 'COMPLETED')
        )

        # Step 8: Log to Government AI Audit Trail
        audit_logger.log_inference(
            model_name="CivicOrchestrator-v2",
            model_version="2.0.0",
            input_type="multimodal" if media_url else "text",
            prediction=response.dict(),
            confidence=confidence,
            recommendation=rec_status,
            problem_id=prob_id
        )

        return response

orchestrator = AIOrchestrator()
