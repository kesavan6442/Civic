from typing import Dict, Any, List, Optional
from datetime import datetime
from app.schemas.solution_schemas import (
    ProjectRiskInput,
    ProjectRiskResult,
    ProjectResolutionAuditInput,
    ProjectResolutionAuditResult
)

class ProjectRiskDetector:
    def analyze_project_risk(self, payload: ProjectRiskInput) -> ProjectRiskResult:
        days_elapsed = max(0, payload.daysElapsed)
        total_sla = max(1, payload.totalSlaDays or 90)
        days_remaining = max(0, total_sla - days_elapsed)
        milestones = payload.milestones or []
        
        # Calculate milestone completion
        completed = sum(1 for m in milestones if m.get('completed') is True or str(m.get('status', '')).lower() == 'completed' or float(m.get('progress', 0)) >= 100.0)
        total_m = len(milestones) if milestones else 4
        
        # SLA burn calculation
        sla_burn = round((days_elapsed / total_sla) * 100.0, 1)
        sla_pct = int(min(100, (days_elapsed / total_sla) * 100))
        
        # Milestone Velocity: completed milestones per elapsed day (normalized per 30 days)
        velocity = round((completed / max(1, days_elapsed)) * 30.0, 2)
        
        # Progress Ratio
        milestone_completion_pct = (completed / total_m) * 100.0 if total_m > 0 else 0.0

        risk_factors: List[str] = []
        risk_level = "Low"
        delay_prob: Optional[float] = None
        projected_delay = 0

        # 1. Milestone velocity vs SLA burn check
        if days_elapsed > 15 and completed == 0:
            risk_factors.append(f"Zero completed milestones recorded despite {days_elapsed} days elapsed.")
            risk_level = "Medium"
            delay_prob = 0.35

        if sla_burn >= 50.0 and milestone_completion_pct < 40.0:
            risk_factors.append(f"SLA burn reached {sla_burn}% with only {completed}/{total_m} milestones delivered ({milestone_completion_pct:.0f}% completion).")
            risk_level = "High"
            delay_prob = 0.65
            projected_delay = max(5, int((100.0 - milestone_completion_pct) * (total_sla / 100.0) - days_remaining))

        if days_remaining <= 15 and completed < total_m:
            risk_factors.append(f"Critical SLA boundary: {days_remaining} days remaining with {total_m - completed} pending milestones.")
            risk_level = "Critical"
            delay_prob = 0.88
            projected_delay = max(10, projected_delay or 14)

        if days_elapsed > total_sla and completed < total_m:
            risk_factors.append(f"SLA breached: Project is {days_elapsed - total_sla} days past the approved {total_sla}-day timeline.")
            risk_level = "Critical"
            delay_prob = 0.95
            projected_delay = max(projected_delay, days_elapsed - total_sla)

        # 2. Testing failure checks
        if payload.prototypeTestingPassed is False:
            risk_factors.append("Laboratory prototype testing failed quality audit; re-engineering required.")
            if risk_level not in ["Critical"]:
                risk_level = "High"
            delay_prob = max(delay_prob or 0.0, 0.70)

        # 3. Repeated modification requests & escalations
        if payload.modificationRequestsCount >= 2:
            risk_factors.append(f"{payload.modificationRequestsCount} administrative modification requests logged.")
            if risk_level == "Low":
                risk_level = "Medium"
                delay_prob = max(delay_prob or 0.0, 0.40)

        if payload.citizenEscalationsCount >= 1:
            risk_factors.append(f"{payload.citizenEscalationsCount} citizen grievance escalation(s) registered for this civic issue.")
            if risk_level == "Low":
                risk_level = "Medium"

        if not risk_factors:
            risk_factors.append("All project deliverables are progressing on track within Government SLA window.")
            delay_prob = 0.05

        summary = f"Project is {sla_burn}% through the {total_sla}-day SLA window with {completed}/{total_m} milestones completed (Velocity: {velocity} milestones/month)."

        return ProjectRiskResult(
            assignmentId=payload.assignmentId,
            problemId=payload.problemId,
            riskLevel=risk_level,
            daysElapsed=days_elapsed,
            daysRemaining=days_remaining,
            slaProgressPercentage=sla_pct,
            slaBurnPercentage=sla_burn,
            milestoneVelocity=velocity,
            milestonesCompleted=f"{completed}/{total_m}",
            delayProbability=delay_prob,
            projectedDelayDays=projected_delay,
            activeRiskFactors=risk_factors,
            aiProgressSummary=summary,
            adminInterventionRecommended=(risk_level in ["High", "Critical"]),
            modelVersion="civic-project-sla-v2.1",
            analyzedAt=datetime.utcnow().isoformat(),
            needsHumanReview=(risk_level in ["High", "Critical"])
        )

    def audit_project_resolution(self, payload: ProjectResolutionAuditInput) -> ProjectResolutionAuditResult:
        findings: List[str] = []
        audit_score = 0.0
        
        # 1. Milestone completeness check
        if payload.totalMilestonesCount > 0 and payload.milestonesCompletedCount >= payload.totalMilestonesCount:
            audit_score += 40.0
            findings.append(f"All {payload.milestonesCompletedCount}/{payload.totalMilestonesCount} scheduled milestones completed.")
        else:
            findings.append(f"Incomplete milestones: {payload.milestonesCompletedCount}/{payload.totalMilestonesCount} completed.")

        # 2. Evidence URLs check
        if payload.evidenceUrls and len(payload.evidenceUrls) > 0:
            audit_score += 30.0
            findings.append(f"{len(payload.evidenceUrls)} field verification photo(s) and technical test reports provided.")
        else:
            findings.append("No field evidence documents or test photographs attached.")

        # 3. Verification notes & summary completeness
        v_notes = payload.verificationNotes or ""
        d_summary = payload.finalDeliverablesSummary or ""
        if len(v_notes.strip()) >= 20 and len(d_summary.strip()) >= 20:
            audit_score += 30.0
            findings.append("Comprehensive deliverables summary and administrator verification notes documented.")
        elif len(v_notes.strip()) > 0 or len(d_summary.strip()) > 0:
            audit_score += 15.0
            findings.append("Partial verification documentation supplied.")
        else:
            findings.append("Missing administrative verification notes.")

        is_valid = audit_score >= 70.0
        status = "VERIFIED" if is_valid else ("INCOMPLETE" if audit_score >= 40.0 else "REJECTED")
        recommendation = "Approved for final Government Work Order Closure." if is_valid else "Additional field evidence or milestone deliverables required prior to closure."

        return ProjectResolutionAuditResult(
            projectId=payload.projectId,
            problemId=payload.problemId,
            isResolutionValid=is_valid,
            auditScore=round(audit_score / 100.0, 2),
            auditStatus=status,
            deliverablesCompleteness=round(min(1.0, audit_score / 100.0), 2),
            evidenceVerificationStatus="ACCEPTABLE" if len(payload.evidenceUrls) > 0 else "MISSING",
            auditFindings=findings,
            recommendation=recommendation,
            modelVersion="civic-resolution-audit-v2.1",
            auditedAt=datetime.utcnow().isoformat(),
            needsHumanReview=not is_valid
        )

risk_detector = ProjectRiskDetector()
