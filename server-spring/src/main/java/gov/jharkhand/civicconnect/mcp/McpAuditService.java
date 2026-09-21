package gov.jharkhand.civicconnect.mcp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class McpAuditService {

    private static final Logger auditLogger = LoggerFactory.getLogger("MCP_SECURITY_AUDIT");

    private final AtomicReference<Instant> lastRequestTime = new AtomicReference<>(null);
    private final AtomicInteger failedAuthAttempts = new AtomicInteger(0);
    private final AtomicInteger totalRequests = new AtomicInteger(0);
    private final Deque<Map<String, Object>> recentLogs = new ConcurrentLinkedDeque<>();
    private static final int MAX_LOGS = 100;

    public enum McpAuditEvent {
        MCP_TOOL_EXECUTED,
        MCP_TOOL_FAILED,
        MCP_TOOLS_LISTED,
        MCP_AUTH_FAILED,
        MCP_AUTH_FAILURE,
        MCP_TOKEN_CREATED,
        MCP_TOKEN_REGENERATED,
        MCP_TOKEN_REVOKED,
        MCP_HIGH_IMPACT_REQUESTED,
        MCP_ADMIN_APPROVAL
    }

    public void logEvent(McpAuditEvent event, String actorId, String actorRole, String toolName, String resourceId, String result, long durationMs, String details) {
        logEvent(event, actorId, actorRole, toolName, resourceId, result, durationMs, details, null, null);
    }

    public void logEvent(McpAuditEvent event, String actorId, String actorRole, String toolName, String resourceId, String result, long durationMs, String details, String oldValue, String newValue) {
        Instant now = Instant.now();
        lastRequestTime.set(now);
        totalRequests.incrementAndGet();

        if (event == McpAuditEvent.MCP_AUTH_FAILED || event == McpAuditEvent.MCP_AUTH_FAILURE) {
            failedAuthAttempts.incrementAndGet();
        }

        String safeDetails = sanitize(details);
        String safeOldValue = sanitize(oldValue != null ? oldValue : "");
        String safeNewValue = sanitize(newValue != null ? newValue : safeDetails);

        auditLogger.info("[MCP_AUDIT] Timestamp={} | Event={} | ActorId={} | ActorRole={} | Tool={} | ResourceId={} | Result={} | DurationMs={} | Details={}",
                now,
                event,
                actorId != null ? actorId : "ANONYMOUS",
                actorRole != null ? actorRole : "NONE",
                toolName != null ? toolName : "N/A",
                resourceId != null ? resourceId : "N/A",
                result != null ? result : "SUCCESS",
                durationMs,
                safeDetails
        );

        String module = deriveModule(toolName, event);
        String action = deriveAction(toolName, event);
        String formattedTime = java.time.LocalDateTime.ofInstant(now, java.time.ZoneId.systemDefault())
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS"));

        Map<String, Object> logEntry = new LinkedHashMap<>();
        logEntry.put("module", module);
        logEntry.put("action", action);
        logEntry.put("user", actorId != null ? actorId : "admin");
        logEntry.put("source", "MCP_CLIENT".equalsIgnoreCase(actorRole) ? "MCP" : ("ADMIN".equalsIgnoreCase(actorRole) ? "UI" : "API"));
        logEntry.put("description", safeDetails);
        logEntry.put("oldValue", safeOldValue);
        logEntry.put("newValue", safeNewValue.isEmpty() ? safeDetails : safeNewValue);
        logEntry.put("modifiedTime", formattedTime);

        // Core metadata
        logEntry.put("timestamp", now.toString());
        logEntry.put("event", event.name());
        logEntry.put("actorId", actorId != null ? actorId : "ANONYMOUS");
        logEntry.put("actorRole", actorRole != null ? actorRole : "NONE");
        logEntry.put("tool", toolName != null ? toolName : "N/A");
        logEntry.put("resourceId", resourceId != null ? resourceId : "N/A");
        logEntry.put("result", result != null ? result : "SUCCESS");
        logEntry.put("durationMs", durationMs);
        logEntry.put("details", safeDetails);

        recentLogs.addFirst(logEntry);
        while (recentLogs.size() > MAX_LOGS) {
            recentLogs.removeLast();
        }
    }

    private String deriveModule(String toolName, McpAuditEvent event) {
        if (event == McpAuditEvent.MCP_TOKEN_CREATED || event == McpAuditEvent.MCP_TOKEN_REGENERATED || event == McpAuditEvent.MCP_TOKEN_REVOKED || event == McpAuditEvent.MCP_AUTH_FAILURE || event == McpAuditEvent.MCP_AUTH_FAILED) {
            return "Security & Auth";
        }
        if (toolName == null) return "MCP Gateway";
        String t = toolName.toLowerCase();
        if (t.contains("univ")) return "University";
        if (t.contains("indus")) return "Industry";
        if (t.contains("stat") || t.contains("resolut")) return "Analytics";
        if (t.contains("workflow") || t.contains("queue") || t.contains("review")) return "Workflow";
        if (t.contains("duplicate") || t.contains("image") || t.contains("analyze")) return "AI Intelligence";
        if (t.contains("problem") || t.contains("search")) return "Problem Intake";
        if (t.contains("project") || t.contains("milestone")) return "Project Execution";
        if (t.contains("collab") || t.contains("solution")) return "Collaboration";
        return "MCP Gateway";
    }

    private String deriveAction(String toolName, McpAuditEvent event) {
        if (event == McpAuditEvent.MCP_TOKEN_CREATED) return "Generate Bearer Token";
        if (event == McpAuditEvent.MCP_TOKEN_REGENERATED) return "Rotate Bearer Token";
        if (event == McpAuditEvent.MCP_TOKEN_REVOKED) return "Revoke Bearer Token";
        if (event == McpAuditEvent.MCP_TOOLS_LISTED) return "Discover Tool Catalog";
        if (event == McpAuditEvent.MCP_AUTH_FAILURE || event == McpAuditEvent.MCP_AUTH_FAILED) return "Authentication Challenge";

        if (toolName == null) return event.name();
        String t = toolName.toLowerCase();
        if (t.equals("mcp_find_matching_universities")) return "Match Universities";
        if (t.equals("mcp_find_matching_industries")) return "Match CSR Partners";
        if (t.equals("mcp_get_domain_statistics")) return "Fetch Domain Stats";
        if (t.equals("mcp_get_district_statistics")) return "Fetch District Telemetry";
        if (t.equals("mcp_get_university_statistics")) return "Fetch University Stats";
        if (t.equals("mcp_get_industry_statistics")) return "Fetch Industry Stats";
        if (t.equals("mcp_get_workflow_status")) return "Triage Workflow Queue";
        if (t.equals("mcp_search_problems")) return "Search Problem Registry";
        if (t.equals("mcp_detect_duplicate")) return "Detect Duplication";
        if (t.equals("mcp_recommend_collaboration")) return "Recommend Pairing";
        if (t.equals("mcp_get_problem")) return "Fetch Problem Record";
        if (t.equals("mcp_get_project_status")) return "Fetch Project Telemetry";
        if (t.equals("mcp_get_resolution_statistics")) return "Fetch Resolution Stats";
        return toolName;
    }

    public Instant getLastRequestTime() {
        return lastRequestTime.get();
    }

    public int getFailedAuthAttempts() {
        return failedAuthAttempts.get();
    }

    public Map<String, Object> getAuditMetrics() {
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("lastRequestTime", lastRequestTime.get() != null ? lastRequestTime.get().toString() : "No requests yet");
        metrics.put("failedAuthAttempts", failedAuthAttempts.get());
        metrics.put("totalRequests", totalRequests.get());
        metrics.put("activeLogsCount", recentLogs.size());
        return metrics;
    }

    public List<Map<String, Object>> getRecentLogs(int limit) {
        return recentLogs.stream().limit(limit).toList();
    }

    private String sanitize(String input) {
        if (input == null) return "";
        return input.replaceAll("(?i)(civic_mcp_[a-zA-Z0-9_-]+)", "civic_mcp_••••••••")
                .replaceAll("(?i)(password|secret|token|bearer|key)\\s*[:=]\\s*['\"]?[^,'\"\\s]+", "$1=***");
    }
}
