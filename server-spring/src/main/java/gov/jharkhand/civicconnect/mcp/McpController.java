package gov.jharkhand.civicconnect.mcp;

import gov.jharkhand.civicconnect.model.AuditLog;
import gov.jharkhand.civicconnect.repository.AuditLogRepository;
import gov.jharkhand.civicconnect.repository.ProblemRepository;
import gov.jharkhand.civicconnect.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.time.Instant;
import java.util.*;

@RestController
public class McpController {

    private static final Logger log = LoggerFactory.getLogger(McpController.class);

    private final McpTokenService tokenService;
    private final McpToolRegistry toolRegistry;
    private final McpServerConfig serverConfig;
    private final McpAuditService auditService;
    private final ProblemRepository problemRepository;

    @Autowired(required = false)
    private AuditLogRepository auditLogRepository;

    public McpController(
            McpTokenService tokenService,
            McpToolRegistry toolRegistry,
            McpServerConfig serverConfig,
            McpAuditService auditService,
            ProblemRepository problemRepository
    ) {
        this.tokenService = tokenService;
        this.toolRegistry = toolRegistry;
        this.serverConfig = serverConfig;
        this.auditService = auditService;
        this.problemRepository = problemRepository;
    }

    private String getUsernameFromAuth(Authentication auth) {
        if (auth == null) return "admin";
        if (auth.getPrincipal() instanceof UserPrincipal up) {
            return up.getUsername();
        }
        return auth.getName() != null ? auth.getName() : "admin";
    }

    // ==========================================
    // ADMIN CONFIGURATION & TOKEN MANAGEMENT APIS
    // ==========================================

    @GetMapping({"/api/admin/mcp/status", "/api/mcp/status"})
    public ResponseEntity<Map<String, Object>> getMcpStatus(HttpServletRequest request) {
        Optional<McpToken> activeToken = tokenService.getActiveTokenMetadata();
        Optional<McpToken> latestToken = tokenService.getLatestTokenMetadata();

        // Dynamically compute the server URL if running behind proxy / on Render
        String resolvedServerUrl = serverConfig.getServerUrl();
        if (request != null) {
            String forwardedProto = request.getHeader("X-Forwarded-Proto");
            String forwardedHost = request.getHeader("X-Forwarded-Host");
            if (forwardedHost != null && !forwardedHost.isBlank()) {
                String proto = (forwardedProto != null && !forwardedProto.isBlank()) ? forwardedProto : "https";
                resolvedServerUrl = proto + "://" + forwardedHost + "/mcp";
            } else if (request.getServerName() != null && !request.getServerName().equals("localhost") && !request.getServerName().equals("127.0.0.1")) {
                String scheme = request.getScheme() != null ? request.getScheme() : "https";
                int port = request.getServerPort();
                String portPart = (port == 80 || port == 443 || port <= 0) ? "" : (":" + port);
                resolvedServerUrl = scheme + "://" + request.getServerName() + portPart + "/mcp";
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("enabled", serverConfig.isEnabled());
        response.put("serverUrl", resolvedServerUrl);
        response.put("connected", serverConfig.isEnabled());
        response.put("activeToolsCount", toolRegistry.getToolCount());
        response.put("hasActiveToken", activeToken.isPresent());

        if (activeToken.isPresent()) {
            McpToken t = activeToken.get();
            response.put("tokenPrefix", t.getTokenPrefix());
            response.put("tokenMasked", t.getTokenMasked());
            response.put("createdAt", t.getCreatedAt());
            response.put("expiresAt", t.getExpiresAt());
            response.put("lastUsedAt", t.getLastUsedAt());
            response.put("scopes", t.getScopes());
            response.put("createdByAdmin", t.getCreatedBy());
        } else if (latestToken.isPresent()) {
            McpToken t = latestToken.get();
            response.put("tokenPrefix", t.getTokenPrefix());
            response.put("tokenMasked", t.getTokenMasked());
            response.put("createdAt", t.getCreatedAt());
            response.put("revokedAt", t.getRevokedAt());
            response.put("scopes", t.getScopes());
        }

        // Include security audit metrics
        response.put("auditMetrics", auditService.getAuditMetrics());

        return ResponseEntity.ok(response);
    }

    @PostMapping({"/api/admin/mcp/tokens", "/api/mcp/tokens"})
    public ResponseEntity<Map<String, Object>> generateToken(
            Authentication auth,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        String adminUsername = getUsernameFromAuth(auth);
        @SuppressWarnings("unchecked")
        List<String> scopes = body != null ? (List<String>) body.get("scopes") : null;

        McpTokenService.TokenGenerationResult result = tokenService.generateToken(adminUsername, scopes);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("plainTextToken", result.plainTextToken());
        response.put("tokenPrefix", result.tokenPrefix());
        response.put("tokenMasked", result.tokenMasked());
        response.put("createdAt", result.createdAt());
        response.put("expiresAt", result.expiresAt());
        response.put("scopes", result.scopes());
        response.put("message", "MCP Bearer token generated successfully. Copy this token now. It will not be shown again.");

        return ResponseEntity.ok(response);
    }

    @PostMapping({"/api/admin/mcp/tokens/regenerate", "/api/mcp/tokens/regenerate"})
    public ResponseEntity<Map<String, Object>> regenerateToken(
            Authentication auth,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        String adminUsername = getUsernameFromAuth(auth);
        @SuppressWarnings("unchecked")
        List<String> scopes = body != null ? (List<String>) body.get("scopes") : null;

        McpTokenService.TokenGenerationResult result = tokenService.regenerateToken(adminUsername, scopes);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("plainTextToken", result.plainTextToken());
        response.put("tokenPrefix", result.tokenPrefix());
        response.put("tokenMasked", result.tokenMasked());
        response.put("createdAt", result.createdAt());
        response.put("expiresAt", result.expiresAt());
        response.put("scopes", result.scopes());
        response.put("message", "New MCP Bearer token generated. All previous tokens revoked.");

        return ResponseEntity.ok(response);
    }

    @PostMapping({"/api/admin/mcp/tokens/revoke", "/api/mcp/tokens/revoke"})
    public ResponseEntity<Map<String, Object>> revokeToken(
            Authentication auth,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        String adminUsername = getUsernameFromAuth(auth);
        String reason = body != null ? (String) body.get("reason") : "Manual Revocation via Admin Portal";

        boolean revoked = tokenService.revokeAllActiveTokens(adminUsername, reason);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", revoked);
        response.put("message", revoked ? "All active MCP tokens successfully revoked." : "No active tokens were found to revoke.");

        return ResponseEntity.ok(response);
    }

    @GetMapping({"/api/admin/mcp/tools", "/api/mcp/tools"})
    public ResponseEntity<Map<String, Object>> getToolsCatalog() {
        List<McpToolRegistry.ToolDefinition> tools = toolRegistry.getAllTools();

        List<McpToolRegistry.ToolDefinition> readTools = tools.stream()
                .filter(t -> "READ".equalsIgnoreCase(t.category())).toList();
        List<McpToolRegistry.ToolDefinition> analyzeTools = tools.stream()
                .filter(t -> "ANALYZE".equalsIgnoreCase(t.category())).toList();
        List<McpToolRegistry.ToolDefinition> highImpactTools = tools.stream()
                .filter(t -> "HIGH_IMPACT".equalsIgnoreCase(t.category())).toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("total", tools.size());
        response.put("readTools", readTools);
        response.put("analyzeTools", analyzeTools);
        response.put("highImpactTools", highImpactTools);

        return ResponseEntity.ok(response);
    }

    @GetMapping({"/api/admin/mcp/audit-logs", "/api/mcp/audit-logs", "/api/admin/audit-logs"})
    public ResponseEntity<Map<String, Object>> getAuditLogs() {
        Map<String, Object> response = new LinkedHashMap<>();
        List<Map<String, Object>> list = new ArrayList<>(auditService.getRecentLogs(50));

        if (auditLogRepository != null) {
            try {
                List<AuditLog> dbLogs = auditLogRepository.findAll();
                for (AuditLog dbLog : dbLogs) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("module", dbLog.getEntityType() != null ? dbLog.getEntityType() : "GOVERNANCE");
                    map.put("action", dbLog.getAction() != null ? dbLog.getAction() : dbLog.getEventType());
                    map.put("user", dbLog.getPerformedByUserId() != null ? dbLog.getPerformedByUserId() : "admin");
                    map.put("source", dbLog.getPerformedByRole() != null ? dbLog.getPerformedByRole() : "ADMIN");
                    map.put("description", dbLog.getDetails() != null ? dbLog.getDetails() : "—");
                    map.put("oldValue", "—");
                    map.put("newValue", dbLog.getEntityId() != null ? dbLog.getEntityId() : "—");
                    map.put("executionMode", dbLog.getExecutionMode() != null ? dbLog.getExecutionMode() : "MANUAL");
                    map.put("result", dbLog.getResult() != null ? dbLog.getResult() : "SUCCESS");
                    map.put("modifiedTime", dbLog.getTimestamp());
                    map.put("timestamp", dbLog.getTimestamp());
                    list.add(map);
                }
            } catch (Exception e) {
                log.warn("Could not query DB audit logs: {}", e.getMessage());
            }
        }

        // Sort combined list descending by timestamp
        list.sort((a, b) -> {
            String ta = (String) a.getOrDefault("timestamp", "");
            String tb = (String) b.getOrDefault("timestamp", "");
            return tb.compareTo(ta);
        });

        response.put("logs", list);
        response.put("metrics", auditService.getAuditMetrics());
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // STANDARD MCP PROTOCOL ENDPOINT (/mcp)
    // ==========================================

    @GetMapping("/mcp")
    public ResponseEntity<Map<String, Object>> mcpDiscovery() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("name", "CivicConnect MCP Server");
        info.put("version", "1.0.0");
        info.put("protocolVersion", "2024-11-05");
        info.put("description", "Jharkhand Government Civic Problem Resolution Platform MCP Gateway");
        info.put("toolsCount", toolRegistry.getToolCount());
        info.put("authType", "Bearer Token (civic_mcp_*)");
        return ResponseEntity.ok(info);
    }

    @PostMapping("/mcp")
    public ResponseEntity<?> handleMcpRpc(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> body
    ) {
        long startTime = System.currentTimeMillis();
        String jsonRpcVersion = (String) body.getOrDefault("jsonrpc", "2.0");
        Object reqId = body.get("id");
        String method = (String) body.get("method");

        // Validate Bearer Token
        if (authHeader == null || !authHeader.startsWith("Bearer civic_mcp_")) {
            auditService.logEvent(
                    McpAuditService.McpAuditEvent.MCP_AUTH_FAILURE,
                    "anonymous",
                    "MCP_CLIENT",
                    method != null ? method : "mcp_rpc",
                    null,
                    "FAILED",
                    HttpStatus.UNAUTHORIZED.value(),
                    "Missing or malformed Authorization header"
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "jsonrpc", jsonRpcVersion,
                    "error", Map.of("code", -32001, "message", "Unauthorized: Valid MCP Bearer token required (Bearer civic_mcp_...)"),
                    "id", reqId
            ));
        }

        String rawToken = authHeader.substring(7).trim();
        Optional<McpToken> tokenOpt = tokenService.validateBearerToken(rawToken);
        if (tokenOpt.isEmpty()) {
            auditService.logEvent(
                    McpAuditService.McpAuditEvent.MCP_AUTH_FAILURE,
                    "anonymous",
                    "MCP_CLIENT",
                    method != null ? method : "mcp_rpc",
                    null,
                    "FAILED",
                    HttpStatus.UNAUTHORIZED.value(),
                    "Invalid or expired MCP Bearer token"
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "jsonrpc", jsonRpcVersion,
                    "error", Map.of("code", -32001, "message", "Unauthorized: Token is invalid, expired, or revoked"),
                    "id", reqId
            ));
        }

        McpToken token = tokenOpt.get();

        if (method == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "jsonrpc", jsonRpcVersion,
                    "error", Map.of("code", -32600, "message", "Invalid Request: 'method' is required"),
                    "id", reqId
            ));
        }

        try {
            switch (method) {
                case "tools/list" -> {
                    List<Map<String, Object>> toolsList = toolRegistry.getAllTools().stream()
                            .map(t -> {
                                Map<String, Object> map = new LinkedHashMap<>();
                                map.put("name", t.name());
                                map.put("description", t.description());
                                map.put("category", t.category());
                                map.put("inputSchema", t.inputSchema());
                                return map;
                            }).toList();

                    auditService.logEvent(
                            McpAuditService.McpAuditEvent.MCP_TOOLS_LISTED,
                            token.getCreatedBy(),
                            "MCP_CLIENT",
                            "tools/list",
                            token.getId(),
                            "SUCCESS",
                            200,
                            "Listed " + toolsList.size() + " tools"
                    );

                    return ResponseEntity.ok(Map.of(
                            "jsonrpc", jsonRpcVersion,
                            "result", Map.of("tools", toolsList),
                            "id", reqId
                    ));
                }

                case "tools/call" -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> params = (Map<String, Object>) body.get("params");
                    if (params == null || !params.containsKey("name")) {
                        return ResponseEntity.badRequest().body(Map.of(
                                "jsonrpc", jsonRpcVersion,
                                "error", Map.of("code", -32602, "message", "Invalid params: 'name' is required"),
                                "id", reqId
                        ));
                    }

                    String toolName = (String) params.get("name");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> arguments = (Map<String, Object>) params.getOrDefault("arguments", Map.of());

                    long execStart = System.currentTimeMillis();
                    Object executionResult = toolRegistry.executeTool(toolName, arguments, token);
                    long duration = System.currentTimeMillis() - execStart;

                    String detailMessage = formatToolExecutionDetail(toolName, arguments, executionResult, duration);

                    auditService.logEvent(
                            McpAuditService.McpAuditEvent.MCP_TOOL_EXECUTED,
                            token.getCreatedBy(),
                            "MCP_CLIENT",
                            toolName,
                            arguments.containsKey("problem_id") ? String.valueOf(arguments.get("problem_id")) : token.getId(),
                            "SUCCESS",
                            duration,
                            detailMessage
                    );

                    return ResponseEntity.ok(Map.of(
                            "jsonrpc", jsonRpcVersion,
                            "result", Map.of(
                                    "content", List.of(
                                            Map.of("type", "text", "text", executionResult != null ? executionResult.toString() : "")
                                    ),
                                    "structuredData", executionResult
                            ),
                            "id", reqId
                    ));
                }

                case "initialize" -> {
                    return ResponseEntity.ok(Map.of(
                            "jsonrpc", jsonRpcVersion,
                            "result", Map.of(
                                    "protocolVersion", "2024-11-05",
                                    "capabilities", Map.of("tools", Map.of("listChanged", false)),
                                    "serverInfo", Map.of("name", "CivicConnect MCP Gateway", "version", "1.0.0")
                            ),
                            "id", reqId
                    ));
                }

                default -> {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                            "jsonrpc", jsonRpcVersion,
                            "error", Map.of("code", -32601, "message", "Method not found: " + method),
                            "id", reqId
                    ));
                }
            }
        } catch (Exception e) {
            log.error("Error executing MCP method {}: {}", method, e.getMessage(), e);
            String actualTool = "tools/call".equals(method) && body.get("params") instanceof Map<?, ?> p && p.get("name") != null 
                    ? (String) p.get("name") 
                    : method;
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            auditService.logEvent(
                    McpAuditService.McpAuditEvent.MCP_TOOL_FAILED,
                    token != null ? token.getCreatedBy() : "admin",
                    "MCP_CLIENT",
                    actualTool != null ? actualTool : "tools/call",
                    token != null ? token.getId() : "N/A",
                    "FAILED",
                    System.currentTimeMillis() - startTime,
                    "Execution error: " + errorMsg
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "jsonrpc", jsonRpcVersion,
                    "error", Map.of("code", -32603, "message", "Internal server error: " + errorMsg),
                    "id", reqId
            ));
        }
    }

    private String formatToolExecutionDetail(String toolName, Map<String, Object> args, Object result, long durationMs) {
        String problemId = (String) (args != null ? (args.get("problem_id") != null ? args.get("problem_id") : args.get("id")) : null);
        String district = (String) (args != null ? args.get("district") : null);
        String category = (String) (args != null ? args.get("category") : null);
        String domain = (String) (args != null ? args.get("domain") : null);
        String title = (String) (args != null ? args.get("title") : null);

        switch (toolName) {
            case "mcp_find_matching_universities" -> {
                String target = problemId != null ? "Problem " + problemId : (domain != null ? domain : "Civic Challenge");
                return "Matched Top 5 University R&D Labs for " + target + " with expertise alignment & distance weighting (" + durationMs + "ms)";
            }
            case "mcp_find_matching_industries" -> {
                String target = problemId != null ? "Problem " + problemId : (domain != null ? domain : "Civic Challenge");
                return "Matched Corporate CSR Partners for " + target + " with budget allocation & sector focus (" + durationMs + "ms)";
            }
            case "mcp_search_problems" -> {
                String filterInfo = (district != null && !district.isEmpty() ? " District=" + district : "") + 
                                    (category != null && !category.isEmpty() ? " Category=" + category : "");
                return "Searched statewide civic problem registry" + (filterInfo.isEmpty() ? " (All Districts)" : filterInfo) + " (" + durationMs + "ms)";
            }
            case "mcp_get_problem" -> {
                return "Retrieved problem details with PII redaction (ID: " + (problemId != null ? problemId : "N/A") + ") in " + durationMs + "ms";
            }
            case "mcp_get_domain_statistics" -> {
                return "Retrieved statewide 12-domain distribution and infrastructure statistics (" + durationMs + "ms)";
            }
            case "mcp_get_district_statistics" -> {
                return "Computed grievance resolution SLA & district telemetry for " + (district != null ? district : "all districts") + " (" + durationMs + "ms)";
            }
            case "mcp_get_university_statistics" -> {
                return "Aggregated university partnership engagement and active R&D proposal metrics (" + durationMs + "ms)";
            }
            case "mcp_get_industry_statistics" -> {
                return "Aggregated corporate CSR co-funding commitments and joint project counts (" + durationMs + "ms)";
            }
            case "mcp_get_workflow_status" -> {
                return "Triaged statewide innovation workflow queues across all 6 stages (" + durationMs + "ms)";
            }
            case "mcp_detect_duplicate" -> {
                String t = title != null ? " \"" + title + "\"" : "";
                return "Analyzed multimodal text & location vectors for duplicate prevention" + t + " (" + durationMs + "ms)";
            }
            case "mcp_recommend_collaboration" -> {
                return "Synthesized AI university-industry collaboration pairing recommendation (" + durationMs + "ms)";
            }
            case "mcp_get_project_status" -> {
                return "Fetched live telemetry and 90-day SLA milestone progress (" + durationMs + "ms)";
            }
            case "mcp_get_resolution_statistics" -> {
                return "Calculated statewide turnaround time, resolution rates, and SLA compliance (" + durationMs + "ms)";
            }
            case "mcp_analyze_problem" -> {
                return "Executed NLP domain classification and urgency assessment (" + durationMs + "ms)";
            }
            case "mcp_analyze_solution" -> {
                return "Evaluated proposal technical rigor, feasibility, and cost-benefit synergy (" + durationMs + "ms)";
            }
            default -> {
                return "Tool " + toolName + " executed successfully in " + durationMs + "ms";
            }
        }
    }
}
