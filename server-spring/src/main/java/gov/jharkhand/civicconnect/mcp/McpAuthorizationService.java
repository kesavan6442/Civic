package gov.jharkhand.civicconnect.mcp;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class McpAuthorizationService {

    public enum ToolCategory {
        READ,
        ANALYZE,
        HIGH_IMPACT
    }

    private static final Set<String> HIGH_IMPACT_TOOLS = Set.of(
            "mcp_approve_problem",
            "mcp_dispatch_problem",
            "mcp_dispatch_to_approved_partners",
            "mcp_select_collaboration",
            "mcp_approve_collaboration",
            "mcp_create_project",
            "mcp_change_project_status",
            "mcp_change_status",
            "mcp_mark_problem_resolved",
            "mcp_sanction_resolution",
            "mcp_assign_problem",
            "mcp_merge_problem",
            "mcp_approve_solution",
            "mcp_approve_funding",
            "mcp_submit_university_proposal",
            "mcp_submit_industry_proposal",
            "mcp_submit_bulk_proposals",
            "mcp_submit_proposals",
            "mcp_create_test_problems",
            "mcp_create_test_problem"
    );

    private static final Set<String> READ_TOOLS = Set.of(
            "mcp_get_problem",
            "mcp_search_problems",
            "mcp_get_problem_history",
            "mcp_find_similar_problems",
            "mcp_get_problem_statistics",
            "mcp_get_district_statistics",
            "mcp_get_domain_statistics",
            "mcp_get_resolution_statistics",
            "mcp_get_university",
            "mcp_get_industry",
            "mcp_get_university_statistics",
            "mcp_get_industry_statistics",
            "mcp_get_problem_proposals",
            "mcp_get_university_proposals",
            "mcp_get_industry_proposals",
            "mcp_get_pending_admin_reviews",
            "mcp_get_problem_matches",
            "mcp_get_dispatch_preview",
            "mcp_get_dispatch_status",
            "mcp_get_workflow_status",
            "mcp_get_project_status",
            "mcp_get_milestone_status",
            "mcp_get_collaboration_audit"
    );

    private static final Set<String> ANALYZE_TOOLS = Set.of(
            "mcp_analyze_problem",
            "mcp_batch_analyze_problems",
            "mcp_detect_duplicate",
            "mcp_verify_image_authenticity",
            "mcp_analyze_image",
            "mcp_analyze_multimodal_problem",
            "mcp_prioritize_problem",
            "mcp_find_capable_universities",
            "mcp_find_matching_universities",
            "mcp_find_capable_industries",
            "mcp_find_matching_industries",
            "mcp_explain_university_match",
            "mcp_explain_industry_match",
            "mcp_generate_matching_report",
            "mcp_batch_matching_report",
            "mcp_prepare_targeted_dispatch",
            "mcp_analyze_proposals",
            "mcp_compare_proposals",
            "mcp_identify_missing_information",
            "mcp_analyze_solution",
            "mcp_compare_solutions",
            "mcp_analyze_solution_risk",
            "mcp_find_best_collaborations",
            "mcp_find_best_collaboration",
            "mcp_rank_collaboration_pairs",
            "mcp_explain_collaboration",
            "mcp_generate_collaboration_report",
            "mcp_batch_collaboration_report",
            "mcp_recommend_collaboration",
            "mcp_analyze_project_risk",
            "mcp_analyze_project_delay",
            "mcp_generate_sla_report",
            "mcp_analyze_completion_evidence",
            "mcp_analyze_project_resolution",
            "mcp_generate_verification_report",
            "mcp_prepare_university_proposal",
            "mcp_generate_university_proposal",
            "mcp_prepare_industry_proposal",
            "mcp_generate_industry_proposal",
            "mcp_generate_bulk_proposals",
            "mcp_prepare_bulk_proposals"
    );

    public ToolCategory getCategoryForTool(String toolName) {
        if (HIGH_IMPACT_TOOLS.contains(toolName)) {
            return ToolCategory.HIGH_IMPACT;
        }
        if (ANALYZE_TOOLS.contains(toolName)) {
            return ToolCategory.ANALYZE;
        }
        return ToolCategory.READ;
    }

    public boolean isHighImpact(String toolName) {
        return HIGH_IMPACT_TOOLS.contains(toolName);
    }

    public boolean isAuthorized(McpToken token, String toolName) {
        if (token == null || !token.isActive()) {
            return false;
        }

        List<String> scopes = token.getScopes();
        if (scopes == null || scopes.isEmpty()) {
            return false;
        }

        if (scopes.contains("ALL") || scopes.contains("ROLE_ADMIN")) {
            return true;
        }

        ToolCategory category = getCategoryForTool(toolName);
        return switch (category) {
            case READ -> scopes.contains("READ_PROBLEMS") || scopes.contains("READ_PROJECTS") || scopes.contains("READ_ANALYTICS");
            case ANALYZE -> scopes.contains("ANALYZE_PROBLEMS") || scopes.contains("READ_PROBLEMS");
            case HIGH_IMPACT -> scopes.contains("HIGH_IMPACT_EXECUTE") || scopes.contains("ROLE_ADMIN");
        };
    }

    public Map<String, Object> createAdminApprovalRequiredResponse(String toolName, Map<String, Object> params) {
        return Map.of(
                "success", false,
                "requires_admin_approval", true,
                "needs_human_review", true,
                "action", toolName,
                "message", "Administrator approval is required before executing high-impact civic action: " + toolName,
                "governance", "Government of Jharkhand Multi-Tier Verification Guardrail",
                "confirmationPrompt", "Please review the parameters and pass 'confirm: true' to authorize execution.",
                "parameters", params != null ? params : Map.of()
        );
    }
}
