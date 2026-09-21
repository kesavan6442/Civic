import os
import sys
import json
import logging
from typing import Optional, List, Dict, Any

from mcp.server.mcpserver import MCPServer
from config import MCP_HOST, MCP_PORT

# Import Tools
from tools.problem_tools import (
    get_problem, search_problems, get_problem_history, find_similar_problems,
    get_problem_statistics, batch_analyze_problems, approve_problem, select_collaboration,
    approve_collaboration, create_project, change_project_status, mark_problem_resolved,
    assign_problem, merge_problem, approve_solution, approve_funding
)
from tools.ai_tools import analyze_problem, analyze_image, verify_image_authenticity, detect_duplicate, prioritize_problem, analyze_multimodal_problem
from tools.matching_tools import (
    find_matching_universities, find_matching_industries, recommend_collaboration,
    find_capable_universities, find_capable_industries, explain_university_match,
    explain_industry_match, generate_matching_report, batch_matching_report,
    prepare_targeted_dispatch, get_dispatch_preview, get_dispatch_status,
    dispatch_to_approved_partners, dispatch_problem
)
from tools.solution_tools import (
    analyze_solution, compare_solutions, identify_missing_information, analyze_solution_risk,
    generate_collaboration_report, get_problem_proposals, get_university_proposals,
    get_industry_proposals, analyze_proposals, compare_proposals, find_best_collaborations,
    rank_collaboration_pairs, explain_collaboration, batch_collaboration_report
)
from tools.project_tools import (
    get_project_status, analyze_project_risk, get_milestone_status, analyze_project_delay,
    generate_sla_report, analyze_completion_evidence, analyze_project_resolution, generate_verification_report
)
from tools.analytics_tools import get_district_statistics, get_domain_statistics, get_resolution_statistics, get_university_statistics, get_industry_statistics

# Import Resources
from resources.problem_resources import read_problem_resource
from resources.project_resources import read_project_resource, read_solution_resource, read_collaboration_resource
from resources.analytics_resources import read_district_analytics_resource, read_domain_analytics_resource

# Import Prompts
from prompts.civic_prompts import (
    prompt_analyze_civic_problem,
    prompt_review_problem_completeness,
    prompt_review_solution,
    prompt_compare_solutions,
    prompt_find_collaboration,
    prompt_analyze_project_risk,
    prompt_summarize_district_problems
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civicconnect.mcp")

# Initialize MCP Server Instance
from security import validate_bearer_token
mcp = MCPServer("CivicConnect-MCP")

# =====================================================================
# 0. AUTHENTICATION & SESSION VERIFICATION
# =====================================================================
@mcp.tool()
def mcp_authenticate_with_bearer_token(bearer_token: str) -> dict:
    """
    Authenticate an MCP session using the CivicConnect application JWT Bearer token.
    Validates token claims, returns current authenticated user and role permissions (ADMIN, UNIVERSITY, INDUSTRY, CITIZEN).
    """
    auth = validate_bearer_token(bearer_token)
    if not auth.get("valid"):
        return {"authenticated": False, "error": auth.get("error")}
    return {
        "authenticated": True,
        "username": auth.get("username"),
        "role": auth.get("role"),
        "is_admin": auth.get("is_admin", False),
        "message": f"Successfully authenticated as {auth.get('role')} ({auth.get('username')})."
    }

# =====================================================================
# 1. PROBLEM INTELLIGENCE TOOLS
# =====================================================================
@mcp.tool()
def mcp_get_problem(problem_id: str) -> dict:
    """Retrieve full details of a civic problem statement from MongoDB."""
    return get_problem(problem_id)

@mcp.tool()
def mcp_search_problems(query: str = "", district: str = "", category: str = "", status: str = "", limit: int = 10) -> list:
    """Search civic problems with filters across district, category, and status."""
    return search_problems(query=query, district=district, category=category, status=status, limit=limit)

@mcp.tool()
def mcp_get_problem_history(problem_id: str) -> dict:
    """Retrieve milestone timeline and lifecycle status history for a problem."""
    return get_problem_history(problem_id)

@mcp.tool()
def mcp_find_similar_problems(problem_id: str) -> dict:
    """Identify duplicate or semantically similar problem statements using embeddings."""
    return find_similar_problems(problem_id)

@mcp.tool()
def mcp_get_problem_statistics() -> dict:
    """Retrieve aggregate statistics of civic problems across Jharkhand."""
    return get_problem_statistics()

@mcp.tool()
def mcp_batch_analyze_problems(problem_ids: list) -> dict:
    """Batch analyze multiple civic problem statements for priority and capability matching."""
    return batch_analyze_problems(problem_ids)

# =====================================================================
# 2. AI MULTIMODAL & FORENSIC TOOLS
# =====================================================================
@mcp.tool()
def mcp_analyze_problem(title: str, description: str, category: str = "", district: str = "") -> dict:
    """Run multilingual NLP analysis for domain classification and urgency assessment."""
    return analyze_problem(title=title, description=description, category=category, district=district)

@mcp.tool()
def mcp_analyze_image(image_url: str) -> dict:
    """Analyze image evidence using computer vision for civic infrastructure classification."""
    return analyze_image(image_url)

@mcp.tool()
def mcp_verify_image_authenticity(image_url: str, problem_id: str = "") -> dict:
    """Perform forensic ELA and AI-generated image detection on citizen uploads."""
    return verify_image_authenticity(image_url, problem_id=problem_id)

@mcp.tool()
def mcp_detect_duplicate(title: str, description: str, district: str = "") -> dict:
    """Perform semantic vector comparison against existing database complaints."""
    return detect_duplicate(title=title, description=description, district=district)

@mcp.tool()
def mcp_prioritize_problem(problem_id: str) -> dict:
    """Compute multi-factor SLA urgency, priority index, and population impact score."""
    return prioritize_problem(problem_id)

@mcp.tool()
def mcp_analyze_multimodal_problem(problem_id: str) -> dict:
    """Jointly evaluate citizen text narrative and uploaded photo evidence."""
    return analyze_multimodal_problem(problem_id)

# =====================================================================
# 3. CAPABILITY MATCHING & TARGETED DISPATCH TOOLS
# =====================================================================
@mcp.tool()
def mcp_find_capable_universities(problem_id: str, category: str = "", domain: str = "") -> dict:
    """Query institutional R&D repository and match all capable Jharkhand universities (no Top-5 limit)."""
    return find_capable_universities(problem_id, category=category, domain=domain)

@mcp.tool()
def mcp_find_matching_universities(problem_id: str, category: str = "", domain: str = "") -> dict:
    """Alias for find_capable_universities."""
    return find_matching_universities(problem_id, category=category, domain=domain)

@mcp.tool()
def mcp_find_capable_industries(problem_id: str, category: str = "", domain: str = "") -> dict:
    """Match all capable corporate CSR partners with funding alignment and equipment (no Top-5 limit)."""
    return find_capable_industries(problem_id, category=category, domain=domain)

@mcp.tool()
def mcp_find_matching_industries(problem_id: str, category: str = "", domain: str = "") -> dict:
    """Alias for find_capable_industries."""
    return find_matching_industries(problem_id, category=category, domain=domain)

@mcp.tool()
def mcp_explain_university_match(problem_id: str, university_name: str) -> dict:
    """Explain why a university was matched using 7-dimension explainability."""
    return explain_university_match(problem_id, university_name)

@mcp.tool()
def mcp_explain_industry_match(problem_id: str, industry_name: str) -> dict:
    """Explain why an industry was matched using 7-dimension explainability."""
    return explain_industry_match(problem_id, industry_name)

@mcp.tool()
def mcp_generate_matching_report(problem_id: str) -> dict:
    """Generate comprehensive capability matching report for capable institutions."""
    return generate_matching_report(problem_id)

@mcp.tool()
def mcp_batch_matching_report(problem_ids: list) -> dict:
    """Generate batch capability matching reports across multiple problems."""
    return batch_matching_report(problem_ids)

@mcp.tool()
def mcp_prepare_targeted_dispatch(problem_id: str, university_ids: list = None, industry_ids: list = None) -> dict:
    """Prepare targeted dispatch package for selected institutions."""
    return prepare_targeted_dispatch(problem_id, university_ids, industry_ids)

@mcp.tool()
def mcp_get_dispatch_preview(problem_id: str) -> dict:
    """Preview problem statement as it appears to dispatched partners."""
    return get_dispatch_preview(problem_id)

@mcp.tool()
def mcp_get_dispatch_status(problem_id: str) -> dict:
    """Get real-time dispatch and RFP status for a problem statement."""
    return get_dispatch_status(problem_id)

@mcp.tool()
def mcp_dispatch_to_approved_partners(problem_id: str, partner_ids: list = None, confirm: bool = False) -> dict:
    """Dispatch RFP notifications to approved partners. Requires confirm: true."""
    return dispatch_to_approved_partners(problem_id, partner_ids, confirm=confirm)

@mcp.tool()
def mcp_dispatch_problem(problem_id: str, confirm: bool = False) -> dict:
    """Dispatch problem statement to all capable partners. Requires confirm: true."""
    return dispatch_problem(problem_id, confirm=confirm)

# =====================================================================
# 4. PROPOSAL INTELLIGENCE & EVALUATION TOOLS
# =====================================================================
@mcp.tool()
def mcp_get_problem_proposals(problem_id: str) -> dict:
    """Retrieve all submitted university and industry proposals for a problem."""
    return get_problem_proposals(problem_id)

@mcp.tool()
def mcp_get_university_proposals(problem_id: str) -> dict:
    """Retrieve submitted university technical proposals for a problem."""
    return get_university_proposals(problem_id)

@mcp.tool()
def mcp_get_industry_proposals(problem_id: str) -> dict:
    """Retrieve submitted corporate CSR proposals for a problem."""
    return get_industry_proposals(problem_id)

@mcp.tool()
def mcp_analyze_proposals(problem_id: str) -> dict:
    """Run comprehensive technical quality and feasibility analysis across proposals."""
    return analyze_proposals(problem_id)

@mcp.tool()
def mcp_compare_proposals(problem_id: str) -> dict:
    """Side-by-side comparative analysis of proposals for a problem."""
    return compare_proposals(problem_id)

@mcp.tool()
def mcp_analyze_solution(solution_title: str, technical_approach: str, estimated_cost: str = "", timeline_weeks: int = 6) -> dict:
    """Evaluate technical quality, feasibility, realism, and missing components in an R&D proposal."""
    return analyze_solution(solution_title, technical_approach, estimated_cost, timeline_weeks)

@mcp.tool()
def mcp_compare_solutions(problem_id: str) -> dict:
    """Conduct side-by-side comparative analysis of submitted University and Industry solutions."""
    return compare_solutions(problem_id)

@mcp.tool()
def mcp_identify_missing_information(proposal_data: str) -> dict:
    """Audit proposal text to highlight missing mandatory parameters (BOM, milestones, safety clearance)."""
    return identify_missing_information(proposal_data)

@mcp.tool()
def mcp_analyze_solution_risk(solution_id: str) -> dict:
    """Compute delivery, procurement, and environmental risks for a selected solution."""
    return analyze_solution_risk(solution_id)

# =====================================================================
# 5. COLLABORATION INTELLIGENCE (GATE 2) TOOLS
# =====================================================================
@mcp.tool()
def mcp_find_best_collaborations(problem_id: str) -> dict:
    """Find and rank top 1-University + 1-Industry collaboration pairs for a problem."""
    return find_best_collaborations(problem_id)

@mcp.tool()
def mcp_rank_collaboration_pairs(problem_id: str) -> dict:
    """Rank all potential University-Industry pairs across 7 compatibility dimensions."""
    return rank_collaboration_pairs(problem_id)

@mcp.tool()
def mcp_explain_collaboration(problem_id: str, university_name: str, industry_name: str) -> dict:
    """Explain why a specific University + Industry pair was recommended across 7 dimensions."""
    return explain_collaboration(problem_id, university_name, industry_name)

@mcp.tool()
def mcp_generate_collaboration_report(problem_id: str) -> dict:
    """Generate an explainable MCP Collaboration Intelligence Report."""
    return generate_collaboration_report(problem_id)

@mcp.tool()
def mcp_batch_collaboration_report(problem_ids: list) -> dict:
    """Generate batch collaboration reports across multiple problems."""
    return batch_collaboration_report(problem_ids)

@mcp.tool()
def mcp_recommend_collaboration(problem_id: str) -> dict:
    """Generate optimal multi-stakeholder partnership recommendations combining University R&D with Industry CSR."""
    return recommend_collaboration(problem_id)

# =====================================================================
# 6. PROJECT SLA & FINAL VERIFICATION (GATE 3) TOOLS
# =====================================================================
@mcp.tool()
def mcp_get_project_status(project_id: str) -> dict:
    """Retrieve live deployment status, assigned university/industry team, and completion progress."""
    return get_project_status(project_id)

@mcp.tool()
def mcp_analyze_project_risk(project_id: str) -> dict:
    """Evaluate delivery bottlenecks, resource constraints, and SLA deadline risks."""
    return analyze_project_risk(project_id)

@mcp.tool()
def mcp_get_milestone_status(project_id: str) -> dict:
    """Get detailed breakdown of project implementation phases."""
    return get_milestone_status(project_id)

@mcp.tool()
def mcp_analyze_project_delay(project_id: str) -> dict:
    """Assess whether the project has incurred timeline variance and suggest recovery actions."""
    return analyze_project_delay(project_id)

@mcp.tool()
def mcp_generate_sla_report(project_id: str) -> dict:
    """Generate comprehensive SLA and milestone performance audit report."""
    return generate_sla_report(project_id)

@mcp.tool()
def mcp_analyze_completion_evidence(project_id: str, evidence_urls: list = None) -> dict:
    """Verify physical completion evidence (post-fix photos, sensor telemetry, signoff)."""
    return analyze_completion_evidence(project_id, evidence_urls)

@mcp.tool()
def mcp_analyze_project_resolution(project_id: str) -> dict:
    """Audit end-to-end resolution criteria before final Gate 3 administrative sign-off."""
    return analyze_project_resolution(project_id)

@mcp.tool()
def mcp_generate_verification_report(project_id: str) -> dict:
    """Generate final Gate 3 Pre-Verification Audit report for Admin sign-off."""
    return generate_verification_report(project_id)

# =====================================================================
# 7. HIGH-IMPACT ADMINISTRATIVE ACTION TOOLS (WITH CONFIRMATION GUARD)
# =====================================================================
@mcp.tool()
def mcp_approve_problem(problem_id: str, priority: str = "High", confirm: bool = False) -> dict:
    """Gate 1: Formally approve a citizen problem statement and assign priority. Requires confirm: true."""
    return approve_problem(problem_id, priority=priority, confirm=confirm)

@mcp.tool()
def mcp_select_collaboration(problem_id: str, university_name: str, industry_name: str, funding_split: str = "70% CSR / 30% State Grant", confirm: bool = False) -> dict:
    """Gate 2: Select and authorize a University + Industry collaborative partnership. Requires confirm: true."""
    return select_collaboration(problem_id, university_name, industry_name, funding_split=funding_split, confirm=confirm)

@mcp.tool()
def mcp_approve_collaboration(collaboration_id: str, confirm: bool = False) -> dict:
    """Approve a proposed collaboration record. Requires confirm: true."""
    return approve_collaboration(collaboration_id, confirm=confirm)

@mcp.tool()
def mcp_create_project(problem_id: str, university_name: str, industry_name: str, sla_days: int = 90, confirm: bool = False) -> dict:
    """Create and commission an active deployment project from selected partners. Requires confirm: true."""
    return create_project(problem_id, university_name, industry_name, sla_days=sla_days, confirm=confirm)

@mcp.tool()
def mcp_change_project_status(project_id: str, new_status: str, notes: str = "", confirm: bool = False) -> dict:
    """Change lifecycle status of an active deployment project. Requires confirm: true."""
    return change_project_status(project_id, new_status, notes=notes, confirm=confirm)

@mcp.tool()
def mcp_mark_problem_resolved(problem_id: str, verification_notes: str = "", confirm: bool = False) -> dict:
    """Gate 3: Officially sanction problem resolution and close project. Requires confirm: true."""
    return mark_problem_resolved(problem_id, verification_notes=verification_notes, confirm=confirm)

@mcp.tool()
def mcp_assign_problem(problem_id: str, assigned_to: str, confirm: bool = False) -> dict:
    """Assign problem to an institution or team. Requires confirm: true."""
    return assign_problem(problem_id, assigned_to=assigned_to, confirm=confirm)

@mcp.tool()
def mcp_merge_problem(duplicate_id: str, master_id: str, confirm: bool = False) -> dict:
    """Merge duplicate problem into master ticket. Requires confirm: true."""
    return merge_problem(duplicate_id, master_id=master_id, confirm=confirm)

@mcp.tool()
def mcp_approve_solution(solution_id: str, confirm: bool = False) -> dict:
    """Approve a submitted solution. Requires confirm: true."""
    return approve_solution(solution_id, confirm=confirm)

@mcp.tool()
def mcp_approve_funding(project_id: str, amount: str, confirm: bool = False) -> dict:
    """Authorize state co-funding grant for a project. Requires confirm: true."""
    return approve_funding(project_id, amount=amount, confirm=confirm)

# =====================================================================
# 8. ANALYTICS TOOLS
# =====================================================================
@mcp.tool()
def mcp_get_district_statistics(district: str = "All") -> dict:
    """Compute geographic civic issue aggregates, resolution rates, and urgency distributions by district."""
    return get_district_statistics(district)

@mcp.tool()
def mcp_get_domain_statistics(domain: str = "All") -> dict:
    """Calculate civic infrastructure domain breakdowns (Water, Roads, Sanitation, Health, Energy)."""
    return get_domain_statistics(domain)

@mcp.tool()
def mcp_get_resolution_statistics() -> dict:
    """Provide state-wide average resolution time, SLA performance metrics, and pending queue size."""
    return get_resolution_statistics()

@mcp.tool()
def mcp_get_university_statistics() -> dict:
    """Summarize university partner participation, active lab projects, and submitted R&D proposals."""
    return get_university_statistics()

@mcp.tool()
def mcp_get_industry_statistics() -> dict:
    """Summarize corporate CSR co-funding, equipment grants, and verified industrial partners."""
    return get_industry_statistics()

# =====================================================================
# 7. READ-ONLY RESOURCES
# =====================================================================
@mcp.resource("problem://{problem_id}")
def resource_problem(problem_id: str) -> str:
    """Read full problem details as JSON resource."""
    return read_problem_resource(problem_id)

@mcp.resource("project://{project_id}")
def resource_project(project_id: str) -> str:
    """Read project status as JSON resource."""
    return read_project_resource(project_id)

@mcp.resource("solution://{solution_id}")
def resource_solution(solution_id: str) -> str:
    """Read solution details as JSON resource."""
    return read_solution_resource(solution_id)

@mcp.resource("collaboration://{collaboration_id}")
def resource_collaboration(collaboration_id: str) -> str:
    """Read collaboration record as JSON resource."""
    return read_collaboration_resource(collaboration_id)

@mcp.resource("analytics://district/{district}")
def resource_district_analytics(district: str) -> str:
    """Read district analytics as JSON resource."""
    return read_district_analytics_resource(district)

@mcp.resource("analytics://domain/{domain}")
def resource_domain_analytics(domain: str) -> str:
    """Read domain analytics as JSON resource."""
    return read_domain_analytics_resource(domain)

# =====================================================================
# 8. CIVIC AI PROMPT TEMPLATES
# =====================================================================
@mcp.prompt("analyze-civic-problem")
def prompt_analyze(problem_title: str, description: str, district: str = "Jharkhand") -> str:
    """Prompt template for analyzing citizen problem statements."""
    return prompt_analyze_civic_problem(problem_title, description, district)

@mcp.prompt("review-problem-completeness")
def prompt_completeness(problem_data: str) -> str:
    """Prompt template for checking problem statement completeness."""
    return prompt_review_problem_completeness(problem_data)

@mcp.prompt("review-solution")
def prompt_solution(solution_title: str, technical_approach: str, cost: str = "") -> str:
    """Prompt template for evaluating solution feasibility and technical merit."""
    return prompt_review_solution(solution_title, technical_approach, cost)

@mcp.prompt("compare-solutions")
def prompt_compare(solutions_summary: str) -> str:
    """Prompt template for comparing submitted solutions side-by-side."""
    return prompt_compare_solutions(solutions_summary)

@mcp.prompt("find-collaboration")
def prompt_collab(problem_id: str, university_name: str, industry_name: str) -> str:
    """Prompt template for drafting university-industry partnership briefs."""
    return prompt_find_collaboration(problem_id, university_name, industry_name)

@mcp.prompt("analyze-project-risk")
def prompt_risk(project_id: str, current_status: str, milestone_progress: str) -> str:
    """Prompt template for auditing project SLA and delay risks."""
    return prompt_analyze_project_risk(project_id, current_status, milestone_progress)

@mcp.prompt("summarize-district-problems")
def prompt_district_summary(district: str, problems_summary: str) -> str:
    """Prompt template for generating executive district civic summaries."""
    return prompt_summarize_district_problems(district, problems_summary)


if __name__ == "__main__":
    logger.info(f"Starting CivicConnect MCP Server on {MCP_HOST}:{MCP_PORT}...")
    # Supports both stdio (default MCP transport) and network transport
    if len(sys.argv) > 1 and sys.argv[1] == "--sse":
        mcp.run(transport="sse")
    else:
        mcp.run(transport="stdio")
