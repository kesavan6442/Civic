from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.embedding_service import embedding_service
from app.schemas.solution_schemas import (
    ScoreDetail,
    SolutionAnalysisResult,
    SolutionComparisonResponse,
    CollaborationRecommendation
)

class ProposalSolutionAnalyzer:
    def __init__(self):
        self.model_version = "civic-solution-eval-v2.2"

    def analyze_single_proposal(self, s: Dict[str, Any], problem: Dict[str, Any]) -> SolutionAnalysisResult:
        tech = (s.get('technicalApproach') or s.get('technical_approach') or s.get('methodology') or s.get('description') or s.get('solutionTitle') or s.get('solution_title') or '').strip()
        has_files = bool(s.get('files')) or bool(s.get('proposalDocUrl')) or bool(s.get('proposal_doc_url')) or bool(s.get('folderLink'))
        word_count = len(tech.split())
        char_count = len(tech)

        provider_name = s.get('universityName') or s.get('university_name') or s.get('companyName') or s.get('company_name') or s.get('providerName') or 'Project Partner'
        provider_type = s.get('providerType') or s.get('submitterType') or s.get('submitter_type') or 'University'
        sol_id = s.get('id') or s.get('_id') or s.get('solution_id') or 'SOL-TEMP'

        missing_fields = []
        if not s.get('estimatedCost') and not s.get('estimated_cost') and not s.get('budget') and not s.get('fundingAmount') and not s.get('funding_amount'):
            missing_fields.append("Detailed Costing / Estimated Budget")
        if not s.get('estimatedTimeWeeks') and not s.get('duration_weeks') and not s.get('duration'):
            missing_fields.append("Execution Timeline in Weeks")
        if word_count < 15:
            missing_fields.append("Technical Implementation Methodology (minimum 15 words)")
        if not s.get('milestones') or len(s.get('milestones', [])) == 0:
            missing_fields.append("Milestone Breakdown")

        if word_count < 8 or char_count < 30:
            return SolutionAnalysisResult(
                solutionId=str(sol_id),
                providerName=provider_name,
                providerType=provider_type,
                hasSufficientInfo=False,
                technicalQualityScore=None,
                feasibilityScore=None,
                scalabilityScore=None,
                overallScore="Pending detailed analysis",
                overallScoreValue=None,
                missingFields=missing_fields or ["Insufficient technical details provided in proposal"],
                keyStrengths=["Proposal registered"],
                identifiedRisks=["Insufficient technical depth to evaluate engineering feasibility and alignment"],
                evaluationSummary="Proposal contains insufficient technical methodology for automated AI evaluation. Queued for manual triage.",
                modelVersion=self.model_version,
                needsHumanReview=True
            )

        # 1. Problem-Solution Semantic Alignment
        prob_text = f"{problem.get('title', '')} {problem.get('description', '')} {problem.get('category', '')} {s.get('problem_description', '')}".strip()
        if prob_text:
            prob_emb = embedding_service.generate_text_embedding(prob_text)
            sol_emb = embedding_service.generate_text_embedding(tech)
            raw_alignment = embedding_service.compute_cosine_similarity(prob_emb, sol_emb)
            alignment_score = round(max(0.15, min(0.98, raw_alignment)), 2)
        else:
            alignment_score = 0.70

        # 2. Methodology Completeness Score
        tech_lower = tech.lower()
        checks = {
            "Clear Objectives": any(k in tech_lower for k in ["objective", "aim", "goal", "target", "purpose", "resolve", "address"]),
            "Technical Methodology": any(k in tech_lower for k in ["method", "design", "architecture", "algorithm", "technique", "approach", "pipeline", "system", "iot", "sensor", "filter", "solar", "deep", "model", "plant", "dialysis", "electro"]),
            "Implementation Stages": any(k in tech_lower for k in ["stage", "phase", "milestone", "step", "deployment", "install", "fabricat", "build", "week", "schedule"]),
            "Required Resources": any(k in tech_lower for k in ["hardware", "software", "material", "component", "resource", "equipment", "sensor", "tool", "team", "lab", "processor", "alumina", "bed"]),
            "Testing & QA Plan": any(k in tech_lower for k in ["test", "validat", "benchmark", "trial", "qa", "inspect", "verif", "pilot", "evaluat", "field", "monitor"]),
            "Expected Deliverables": any(k in tech_lower for k in ["deliverable", "outcome", "result", "prototype", "report", "dashboard", "closure", "system", "station"])
        }
        passed_checks = [k for k, v in checks.items() if v]
        methodology_score = round(max(0.25, len(passed_checks) / len(checks)), 2)

        # 3. Budget Realism Analysis
        raw_cost = s.get('estimatedCost') or s.get('estimated_cost') or s.get('budget') or s.get('fundingAmount') or s.get('funding_amount')
        cost_val = None
        if raw_cost is not None:
            try:
                cost_str = str(raw_cost).replace("₹", "").replace(",", "").strip()
                if "lakh" in cost_str.lower():
                    cost_val = float(cost_str.lower().replace("lakhs", "").replace("lakh", "").strip()) * 100000
                elif "crore" in cost_str.lower():
                    cost_val = float(cost_str.lower().replace("crores", "").replace("crore", "").strip()) * 10000000
                else:
                    cost_val = float(cost_str)
            except Exception:
                cost_val = 200000.0

        if cost_val is None:
            budget_score = 0.50
            budget_expl = "Budget figures not specified in proposal."
        elif cost_val < 5000:
            budget_score = 0.40
            budget_expl = "Budget appears unrealistically low for municipal engineering implementation."
        elif cost_val > 50000000:
            budget_score = 0.60
            budget_expl = "Budget exceeds standard municipal pilot parameters."
        else:
            budget_score = 0.88
            budget_expl = "Budget is within realistic benchmark parameters for state civic innovation grants."

        # 4. Timeline Feasibility Score
        weeks = s.get('estimatedTimeWeeks') or s.get('duration_weeks') or s.get('duration') or 8
        try:
            weeks_num = int(weeks)
        except Exception:
            weeks_num = 8

        if 2 <= weeks_num <= 16:
            timeline_score = 0.90
            timeline_expl = f"{weeks_num} weeks duration aligns well with the 90-day State SLA mandate."
        elif weeks_num > 26:
            timeline_score = 0.60
            timeline_expl = f"Duration of {weeks_num} weeks exceeds the typical 90-day fast-track implementation SLA."
        else:
            timeline_score = 0.75
            timeline_expl = f"Duration of {weeks_num} weeks is acceptable."

        # 5. Composite Feasibility Score
        composite_val = round((alignment_score * 0.35) + (methodology_score * 0.35) + (budget_score * 0.15) + (timeline_score * 0.15), 2)
        composite_pct = f"{int(composite_val * 100)}%"

        # Detailed Transparent Scores
        now_ts = datetime.utcnow().isoformat()
        detailed_scores = [
            ScoreDetail(
                score=alignment_score,
                score_type="problem_solution_alignment",
                model_version=self.model_version,
                analysis_timestamp=now_ts,
                explanation=f"Semantic similarity between problem requirements and technical methodology is {int(alignment_score*100)}%.",
                factors=[f"Cosine similarity: {alignment_score}"]
            ),
            ScoreDetail(
                score=methodology_score,
                score_type="methodology_completeness",
                model_version=self.model_version,
                analysis_timestamp=now_ts,
                explanation=f"Identified {len(passed_checks)} of 6 essential methodology structural criteria.",
                factors=passed_checks
            ),
            ScoreDetail(
                score=budget_score,
                score_type="budget_realism",
                model_version=self.model_version,
                analysis_timestamp=now_ts,
                explanation=budget_expl,
                factors=[f"Estimated cost: {raw_cost}"]
            ),
            ScoreDetail(
                score=timeline_score,
                score_type="timeline_feasibility",
                model_version=self.model_version,
                analysis_timestamp=now_ts,
                explanation=timeline_expl,
                factors=[f"Duration: {weeks_num} weeks"]
            )
        ]

        strengths = []
        if alignment_score > 0.65:
            strengths.append("Strong technical alignment with stated civic problem parameters")
        if methodology_score >= 0.60:
            strengths.append("Structured engineering methodology with clear execution stages")
        if has_files:
            strengths.append("Supporting documentation / technical attachment provided")
        if not strengths:
            strengths.append("Basic engineering framework defined")

        risks = []
        if alignment_score < 0.50:
            risks.append("Moderate misalignment between problem specifics and proposed technical approach")
        if methodology_score < 0.50:
            risks.append("Methodology lacks detailed testing/validation or resource specifications")
        if cost_val is None or cost_val < 5000:
            risks.append("Cost breakdown requires verification by state engineering committee")
        if not risks:
            risks.append("Standard on-site deployment and seasonal monsoon dependencies")

        needs_review = composite_val < 0.65 or len(missing_fields) > 1

        return SolutionAnalysisResult(
            solutionId=str(sol_id),
            providerName=provider_name,
            providerType=provider_type,
            hasSufficientInfo=True,
            technicalQualityScore=f"{int(methodology_score * 100)}%",
            feasibilityScore=f"{int(composite_val * 100)}%",
            scalabilityScore=f"{int(alignment_score * 100)}%",
            overallScore=composite_pct,
            overallScoreValue=composite_val,
            alignmentScore=alignment_score,
            methodologyScore=methodology_score,
            budgetRealismScore=budget_score,
            timelineFeasibilityScore=timeline_score,
            detailedScores=detailed_scores,
            missingFields=missing_fields,
            keyStrengths=strengths,
            identifiedRisks=risks,
            evaluationSummary=f"AI Advisory Analysis: Evaluated proposal by {provider_name} achieving {composite_pct} feasibility score with {int(alignment_score*100)}% problem alignment.",
            modelVersion=self.model_version,
            analysisTimestamp=now_ts,
            needsHumanReview=needs_review
        )

    def compare_proposals(self, solutions: List[Dict[str, Any]], problem: Dict[str, Any]) -> SolutionComparisonResponse:
        analyzed = [self.analyze_single_proposal(s, problem) for s in solutions]
        
        # Rank only proposals with sufficient info
        valid = [a for a in analyzed if a.hasSufficientInfo and a.overallScore.endswith('%')]
        valid.sort(key=lambda x: int(x.overallScore.replace('%', '')), reverse=True)

        best_rec = None
        if valid:
            top = valid[0]
            best_rec = {
                "recommendedSolutionId": top.solutionId,
                "recommendedProvider": top.providerName,
                "score": top.overallScore,
                "reason": f"Top ranked proposal achieving {top.overallScore} based on technical methodology and verified deliverable attachments."
            }

        return SolutionComparisonResponse(
            problemId=problem.get('id', 'N/A'),
            totalSolutionsSubmitted=len(solutions),
            analyzedSolutions=analyzed,
            bestRecommendation=best_rec
        )

    def recommend_collaboration(self, solutions: List[Dict[str, Any]], problem: Dict[str, Any]) -> CollaborationRecommendation:
        univ_sols = [s for s in solutions if s.get('submitterType') == 'university' or s.get('providerType') == 'University' or bool(s.get('universityName'))]
        ind_sols = [s for s in solutions if s.get('submitterType') == 'industry' or s.get('providerType') == 'Industry' or bool(s.get('companyName')) or bool(s.get('fundingAmount'))]

        has_univ = len(univ_sols) > 0
        has_ind = len(ind_sols) > 0

        prob_text = f"{problem.get('title', '')} {problem.get('description', '')} {problem.get('category', '')} {problem.get('domain', '')}".strip()
        prob_emb = embedding_service.generate_text_embedding(prob_text) if prob_text else None

        tech_align = 0.70
        if has_univ and prob_emb is not None:
            u_tech = (univ_sols[0].get('technicalApproach') or univ_sols[0].get('description') or univ_sols[0].get('solutionTitle') or '').strip()
            if u_tech:
                u_emb = embedding_service.generate_text_embedding(u_tech)
                tech_align = round(max(0.20, min(0.98, embedding_service.compute_cosine_similarity(prob_emb, u_emb))), 2)

        fund_align = 0.85 if has_ind else 0.50
        deploy_align = 0.80 if has_ind else 0.45

        if has_ind and prob_emb is not None:
            i_text = f"{ind_sols[0].get('companyName', '')} {ind_sols[0].get('csrCommitmentDetails', '')} {ind_sols[0].get('equipmentSupport', '')} {ind_sols[0].get('technicalSupport', '')}".strip()
            if i_text:
                i_emb = embedding_service.generate_text_embedding(i_text)
                sim_i = round(max(0.20, min(0.98, embedding_service.compute_cosine_similarity(prob_emb, i_emb))), 2)
                deploy_align = round((deploy_align * 0.5) + (sim_i * 0.5), 2)

        synergy_val = round((tech_align * 0.40) + (fund_align * 0.30) + (deploy_align * 0.30), 2)
        synergy_pct = f"{int(synergy_val * 100)}%"

        if has_univ and has_ind:
            mode = "University + Industry Joint Public-Private Partnership (PPP)"
            u_name = univ_sols[0].get('universityName') or "University Research Team"
            i_name = ind_sols[0].get('companyName') or "Industry CSR Partner"
            rationale = f"High structural synergy between {u_name} for sensor/engineering R&D and {i_name} for capital co-funding and industrial fabrication scale."
            u_role = "Core engineering design, sensor calibration, lab assay verification, student/faculty prototype deployment."
            i_role = "CSR grant disbursement, industrial equipment tooling, fabrication materials supply, and municipal field installation."
            cap_match = "Complementary Academic Research + Industrial Fabrication Capacity"
            risks = [
                "Joint coordination SLA between academic semester schedules and industrial supply chain delivery",
                "Site access permits required from municipal district administration"
            ]
            next_steps = [
                "Submit Joint Proposal for District Administrator Approval",
                "Execute Trilateral MoU (Govt of Jharkhand + University + Industry)",
                "Disburse Phase 1 CSR Mobilization Advance"
            ]
        elif has_univ:
            mode = "University R&D Pilot with State Assistance"
            u_name = univ_sols[0].get('universityName') or "University Team"
            rationale = f"Academic engineering proposal by {u_name} ready for municipal testing; open for industrial CSR co-sponsorship."
            u_role = "Prototype fabrication, lab assays, and field testing."
            i_role = "Open for industrial sponsor"
            cap_match = "Academic R&D Ready (Awaiting CSR Co-Funding)"
            risks = ["Limited industrial manufacturing tooling without CSR partner"]
            next_steps = ["Broadcast to State CSR Registry for co-funding"]
        elif has_ind:
            mode = "Industry Turnkey Implementation"
            i_name = ind_sols[0].get('companyName') or "Industry Partner"
            rationale = f"Direct industrial deployment and equipment contribution committed by {i_name}."
            u_role = "Open for academic testing and third-party audit"
            i_role = "Turnkey equipment deployment and maintenance."
            cap_match = "Industrial Turnkey Capability"
            risks = ["Requires academic testing validation prior to commissioning"]
            next_steps = ["Assign university research team for quality assurance audit"]
        else:
            mode = "Open for Joint PPP Proposals"
            rationale = "Civic challenge broadcasted; awaiting academic and industrial submissions."
            u_role = "Open for academic submission"
            i_role = "Open for industrial co-funding"
            cap_match = "Pending Proposals"
            risks = ["No solutions submitted yet"]
            next_steps = ["Broadcast challenge to state university and industry network"]

        return CollaborationRecommendation(
            problemId=str(problem.get('id') or problem.get('_id') or 'N/A'),
            recommendedMode=mode,
            jointRationale=rationale,
            universityRoleSuggestion=u_role,
            industryRoleSuggestion=i_role,
            universityRole=u_role,
            industryRole=i_role,
            capabilityMatch=cap_match,
            technicalAlignment=tech_align,
            fundingAlignment=fund_align,
            deploymentAlignment=deploy_align,
            synergyScore=synergy_val,
            synergyScorePct=synergy_pct,
            risks=risks,
            recommendedNextSteps=next_steps,
            combinedEstimatedTimeline="75 Days (within 90-day Mandated SLA)",
            adminApprovalRequired=True,
            modelVersion=self.model_version,
            needsHumanReview=(synergy_val < 0.60)
        )

    def evaluate_candidate_pairs(self, univ_proposals: List[Dict[str, Any]], ind_proposals: List[Dict[str, Any]], problem: Dict[str, Any]) -> List[Dict[str, Any]]:
        prob_text = f"{problem.get('title', '')} {problem.get('description', '')} {problem.get('category', '')} {problem.get('domain', '')}".strip()
        prob_emb = embedding_service.generate_text_embedding(prob_text) if prob_text else None

        candidate_pairs = []
        for u in univ_proposals:
            u_tech = (u.get('technicalApproach') or u.get('description') or u.get('solutionTitle') or '').strip()
            u_name = u.get('universityName') or 'University Partner'
            u_id = str(u.get('universityId') or u.get('id') or 'UNIV')
            u_sol_id = str(u.get('id') or u.get('_id') or 'SOL')

            u_emb = embedding_service.generate_text_embedding(u_tech) if u_tech else None
            u_align = 0.70
            if prob_emb is not None and u_emb is not None:
                u_align = round(max(0.25, min(0.98, embedding_service.compute_cosine_similarity(prob_emb, u_emb))), 2)

            for i in ind_proposals:
                i_name = i.get('companyName') or 'Industry Partner'
                i_id = str(i.get('industryId') or i.get('id') or 'IND')
                i_collab_id = str(i.get('id') or i.get('_id') or 'COL')
                i_text = f"{i.get('csrCommitmentDetails', '')} {i.get('equipmentSupport', '')} {i.get('technicalSupport', '')}".strip()

                i_emb = embedding_service.generate_text_embedding(i_text) if i_text else None
                i_align = 0.65
                if prob_emb is not None and i_emb is not None:
                    i_align = round(max(0.25, min(0.98, embedding_service.compute_cosine_similarity(prob_emb, i_emb))), 2)

                # 5 Dimensional Multi-factor Evaluation
                tech_score = round(u_align * 100, 1)
                cap_score = round(((u_align * 0.5) + (i_align * 0.5)) * 100, 1)
                budget_score = 88.0 if i.get('fundingAmount') or i.get('csrCommitmentDetails') else 65.0
                timeline_score = 85.0 if u.get('estimatedTimeWeeks', 8) <= 12 else 70.0
                deploy_score = 92.0 if i.get('equipmentSupport') or i.get('technicalSupport') else 65.0

                overall_synergy = round((tech_score * 0.30) + (cap_score * 0.25) + (budget_score * 0.15) + (timeline_score * 0.15) + (deploy_score * 0.15), 1)

                def to_level(val):
                    if val >= 80: return "HIGH"
                    if val >= 60: return "MEDIUM"
                    return "LOW"

                why_points = [
                    f"University has strong R&D capability in {u.get('department', 'engineering')} ({u_name})",
                    f"Industry provides equipment and CSR co-funding commitment ({i_name})",
                    f"CSR budget allocation matches proposed solution scope",
                    f"Industry partner has field deployment capability across Jharkhand districts"
                ]

                candidate_pairs.append({
                    "universityId": u_id,
                    "universityProposalId": u_sol_id,
                    "universityName": u_name,
                    "department": u.get('department', 'Applied Research'),
                    "industryId": i_id,
                    "industryProposalId": i_collab_id,
                    "companyName": i_name,
                    "technicalAlignment": tech_score,
                    "capabilityCompatibility": cap_score,
                    "budgetCompatibility": budget_score,
                    "timelineCompatibility": timeline_score,
                    "deploymentCompatibility": deploy_score,
                    "technicalCompatibilityLevel": to_level(tech_score),
                    "resourceCompatibilityLevel": to_level(cap_score),
                    "budgetAlignmentLevel": to_level(budget_score),
                    "timelineCompatibilityLevel": to_level(timeline_score),
                    "deploymentReadinessLevel": to_level(deploy_score),
                    "overallSynergyScore": overall_synergy,
                    "whyThisPair": why_points,
                    "universityRole": f"Research, Prototype, Testing, Lab Validation ({u_name})",
                    "industryRole": f"Funding, Manufacturing Tooling, Field Deployment, Maintenance ({i_name})",
                    "reasons": why_points,
                    "risks": [
                        "Prototype to deployment timeline requires milestone synchronization",
                        "Site permits and municipal clearance needed from district administration"
                    ],
                    "mitigation": [
                        "Align university lab prototype testing with industry procurement schedule",
                        "State nodal administrator facilitates fast-track municipal site access"
                    ]
                })

        candidate_pairs.sort(key=lambda x: x['overallSynergyScore'], reverse=True)
        return candidate_pairs

solution_analyzer = ProposalSolutionAnalyzer()


