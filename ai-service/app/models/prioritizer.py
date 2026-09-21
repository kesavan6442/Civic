from typing import Dict, Any, List
from app.schemas.problem_schemas import PriorityAssessmentResponse

class ExplainablePrioritizer:
    def prioritize_problem(self, problem: Dict[str, Any]) -> PriorityAssessmentResponse:
        title = (problem.get('title') or '').strip()
        desc = (problem.get('description') or '').strip()
        urgency_raw = (problem.get('urgency') or 'High').capitalize()
        full_text = f"{title} {desc}".lower()
        words = full_text.split()
        has_media = bool(problem.get('mediaUrl'))

        has_sufficient = (len(words) >= 12 and len(desc) >= 60) or has_media

        # Safety distress factors
        critical_factors = []
        high_factors = []

        if any(k in full_text for k in ['fatal', 'collapse', 'death', 'emergency', 'poison', 'overflow', 'drowning', 'बिजली करंट', 'हादसा']):
            critical_factors.append("Direct acute hazard to human life or municipal failure")
        if any(k in full_text for k in ['fluoride', 'arsenic', 'drinking water', 'hospital', 'dengue', 'outbreak', 'बीमारी', 'पानी']):
            critical_factors.append("Public health / drinking water contamination risk")
        if any(k in full_text for k in ['broken', 'severe', 'block', 'danger', 'stench', 'flood', 'कट', 'खतरा']):
            high_factors.append("Major civic infrastructure breakdown affecting commuter transit or livelihood")

        # Determine level
        if critical_factors or urgency_raw == 'Critical':
            priority = "Critical"
            severity = "96/100"
            impact_level = "Catastrophic / Acute Public Risk"
            affected_pop = "15,000+ residents & commuters"
            reasons = critical_factors or ["High vulnerability zone identified with emergency citizen priority"]
        elif high_factors or urgency_raw == 'High':
            priority = "High"
            severity = "88/100"
            impact_level = "Severe Public Disruption"
            affected_pop = "5,000+ ward residents"
            reasons = high_factors or ["Major infrastructure degradation requiring university or industry intervention"]
        elif urgency_raw == 'Medium':
            priority = "Medium"
            severity = "65/100"
            impact_level = "Moderate Civic Inconvenience"
            affected_pop = "1,200+ local citizens"
            reasons = ["Localized municipal issue manageable within standard departmental sprint"]
        else:
            priority = "Low"
            severity = "42/100"
            impact_level = "Low Priority Maintenance"
            affected_pop = "300+ local citizens"
            reasons = ["Aesthetic or minor maintenance backlog without active safety hazard"]

        if not has_sufficient:
            return PriorityAssessmentResponse(
                priority=priority,
                severity_score="Pending detailed inspection",
                has_sufficient_info=False,
                impact_level="Pending on-site evaluation",
                estimated_affected_population="Pending field survey",
                reasons=["Basic problem statement received. Detailed severity will be calculated upon field inspection or technical submission."],
                needs_human_review=True
            )

        return PriorityAssessmentResponse(
            priority=priority,
            severity_score=severity,
            has_sufficient_info=True,
            impact_level=impact_level,
            estimated_affected_population=affected_pop,
            reasons=reasons,
            needs_human_review=False
        )

prioritizer = ExplainablePrioritizer()
