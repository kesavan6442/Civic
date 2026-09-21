from typing import Dict, Any, List
from app.schemas.problem_schemas import FeedbackInput, FeedbackAnalysisResponse
from app.utils.text_preprocessor import clean_text

class CitizenFeedbackAnalyzer:
    def analyze_feedback(self, payload: FeedbackInput) -> FeedbackAnalysisResponse:
        raw_text = payload.citizenFeedbackText or ""
        cleaned = clean_text(raw_text).lower()
        rating = payload.rating

        positive_words = ['solved', 'fixed', 'happy', 'great', 'fast', 'thank', 'excellent', 'अच्छा', 'संतुष्ट', 'धन्यवाद', 'ठीक हो गया']
        negative_words = ['broken', 'not solved', 'waste', 'useless', 'delayed', 'pending', 'poor', 'झूठ', 'खराब', 'समस्या बाकी है', 'काम नहीं हुआ']

        pos_count = sum(1 for w in positive_words if w in cleaned)
        neg_count = sum(1 for w in negative_words if w in cleaned)

        # Rating alignment
        if rating is not None:
            if rating >= 4:
                pos_count += 3
            elif rating <= 2:
                neg_count += 3

        extracted_issues = []
        is_complaint = False
        is_additional_prob = False

        if "not fixed" in cleaned or "still broken" in cleaned or "बाकी है" in cleaned:
            extracted_issues.append("Unresolved problem remains on-site")
            is_complaint = True

        if "delayed" in cleaned or "slow" in cleaned or "देरी" in cleaned:
            extracted_issues.append("Execution timeline dissatisfaction")
            is_complaint = True

        if "new problem" in cleaned or "another leak" in cleaned or "नया" in cleaned:
            is_additional_prob = True
            extracted_issues.append("Secondary defect reported post-intervention")

        if neg_count > pos_count:
            sentiment = "Negative"
            confidence = 0.89
            satisfaction = "Dissatisfied"
            review_required = True
            summary = "Citizen reported dissatisfaction with resolution quality. Administrative audit required."
        elif pos_count > neg_count:
            sentiment = "Positive"
            confidence = 0.92
            satisfaction = "Satisfied"
            review_required = False
            summary = "Citizen verified satisfactory problem resolution and quality on-site."
        else:
            sentiment = "Neutral"
            confidence = 0.75
            satisfaction = "Moderate"
            review_required = is_complaint
            summary = "Citizen provided standard feedback with moderate satisfaction."

        return FeedbackAnalysisResponse(
            problemId=payload.problemId,
            sentiment=sentiment,
            confidence=confidence,
            satisfaction_level=satisfaction,
            extracted_issues=extracted_issues,
            service_complaint=is_complaint,
            additional_problem_detected=is_additional_prob,
            admin_review_required=review_required,
            summary=summary
        )

feedback_analyzer = CitizenFeedbackAnalyzer()
