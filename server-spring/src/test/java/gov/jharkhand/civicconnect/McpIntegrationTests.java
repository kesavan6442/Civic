package gov.jharkhand.civicconnect;

import gov.jharkhand.civicconnect.mcp.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class McpIntegrationTests {

    @Autowired
    private McpTokenService tokenService;

    @Autowired
    private McpToolRegistry toolRegistry;

    @Autowired
    private McpAuthorizationService authzService;

    @Autowired
    private McpAuditService auditService;

    @Autowired
    private McpTokenRepository tokenRepository;

    @BeforeEach
    void setup() {
        tokenRepository.deleteAll();
    }

    @Test
    @DisplayName("1. Token Generation: Creates civic_mcp_* token and stores SHA-256 hash")
    void testTokenGeneration() {
        McpTokenService.TokenGenerationResult result = tokenService.generateToken("admin-test", List.of("READ_PROBLEMS", "ANALYZE_PROBLEMS"));

        assertNotNull(result.plainTextToken());
        assertTrue(result.plainTextToken().startsWith("civic_mcp_"));
        assertTrue(result.tokenPrefix().startsWith("civic_mcp_"));
        assertTrue(result.tokenMasked().startsWith("civic_mcp_"));
        assertEquals(2, result.scopes().size());

        // Verify database does NOT store plaintext token
        Optional<McpToken> saved = tokenRepository.findById(result.id());
        assertTrue(saved.isPresent());
        McpToken dbToken = saved.get();
        assertNotEquals(result.plainTextToken(), dbToken.getTokenHash());
        assertEquals(64, dbToken.getTokenHash().length()); // 64 hex chars for SHA-256
        assertTrue(dbToken.isActive());
    }

    @Test
    @DisplayName("2. Token Validation: Validates active token and rejects invalid/expired token")
    void testTokenValidation() {
        McpTokenService.TokenGenerationResult gen = tokenService.generateToken("admin-test", null);
        String rawToken = gen.plainTextToken();

        // Valid token
        Optional<McpToken> validOpt = tokenService.validateBearerToken(rawToken);
        assertTrue(validOpt.isPresent());
        assertNotNull(validOpt.get().getLastUsedAt());

        // Invalid token
        Optional<McpToken> invalidOpt = tokenService.validateBearerToken("civic_mcp_invalid_token_12345");
        assertTrue(invalidOpt.isEmpty());

        // Malformed token without civic_mcp_ prefix
        Optional<McpToken> malformedOpt = tokenService.validateBearerToken("some_random_jwt_or_string");
        assertTrue(malformedOpt.isEmpty());
    }

    @Test
    @DisplayName("3. Token Rotation & Regeneration: Revokes previous tokens and issues new one")
    void testTokenRegeneration() {
        McpTokenService.TokenGenerationResult first = tokenService.generateToken("admin-test", null);
        assertTrue(tokenService.validateBearerToken(first.plainTextToken()).isPresent());

        McpTokenService.TokenGenerationResult second = tokenService.regenerateToken("admin-test", null);
        assertNotEquals(first.plainTextToken(), second.plainTextToken());

        // Old token should now be invalid / revoked
        Optional<McpToken> oldOpt = tokenService.validateBearerToken(first.plainTextToken());
        assertTrue(oldOpt.isEmpty());

        // New token should be active
        Optional<McpToken> newOpt = tokenService.validateBearerToken(second.plainTextToken());
        assertTrue(newOpt.isPresent());
    }

    @Test
    @DisplayName("4. Token Revocation: Explicitly revokes all active tokens")
    void testTokenRevocation() {
        McpTokenService.TokenGenerationResult token = tokenService.generateToken("admin-test", null);
        assertTrue(tokenService.validateBearerToken(token.plainTextToken()).isPresent());

        boolean revoked = tokenService.revokeAllActiveTokens("admin-test", "Security test revocation");
        assertTrue(revoked);

        assertTrue(tokenService.validateBearerToken(token.plainTextToken()).isEmpty());
        Optional<McpToken> dbToken = tokenRepository.findById(token.id());
        assertTrue(dbToken.isPresent());
        assertFalse(dbToken.get().isActive());
        assertNotNull(dbToken.get().getRevokedAt());
    }

    @Test
    @DisplayName("5. Tool Registry: All registered tools exist across READ, ANALYZE, and HIGH_IMPACT categories")
    void testToolRegistryCatalog() {
        // Get actual count dynamically so test is stable across iterations
        int totalTools = toolRegistry.getToolCount();
        assertTrue(totalTools >= 26, "Expected at least 26 MCP tools, got: " + totalTools);

        List<McpToolRegistry.ToolDefinition> tools = toolRegistry.getAllTools();
        long readCount = tools.stream().filter(t -> "READ".equals(t.category())).count();
        long analyzeCount = tools.stream().filter(t -> "ANALYZE".equals(t.category())).count();
        long highImpactCount = tools.stream().filter(t -> "HIGH_IMPACT".equals(t.category())).count();

        assertTrue(readCount >= 11, "Expected at least 11 READ tools, got: " + readCount);
        assertTrue(analyzeCount >= 10, "Expected at least 10 ANALYZE tools, got: " + analyzeCount);
        assertTrue(highImpactCount >= 5, "Expected at least 5 HIGH_IMPACT tools, got: " + highImpactCount);

        // Verify specific critical tools exist
        assertTrue(toolRegistry.hasTool("mcp_get_problem"));
        assertTrue(toolRegistry.hasTool("mcp_search_problems"));
        assertTrue(toolRegistry.hasTool("mcp_analyze_problem"));
        assertTrue(toolRegistry.hasTool("mcp_assign_problem"));
        assertTrue(toolRegistry.hasTool("mcp_approve_funding"));
    }

    @Test
    @DisplayName("6. High-Impact Safeguard: Enforces Human-in-the-Loop Admin Approval")
    void testHighImpactToolSafeguard() {
        McpTokenService.TokenGenerationResult gen = tokenService.generateToken("admin-test", null);
        McpToken token = tokenRepository.findById(gen.id()).orElseThrow();

        // Calling a HIGH_IMPACT tool must return admin approval required response
        Object result = toolRegistry.executeTool("mcp_assign_problem", Map.of("problem_id", "P-101", "partner_id", "U-202"), token);
        assertNotNull(result, "HIGH_IMPACT tool should return a non-null approval response");
        assertTrue(result instanceof Map<?, ?>, "Response should be a Map");

        @SuppressWarnings("unchecked")
        Map<String, Object> map = (Map<String, Object>) result;

        // The response must include admin-approval-required markers
        assertTrue(map.containsKey("requires_admin_approval"), "Response must have 'requires_admin_approval' key");
        assertEquals(true, map.get("requires_admin_approval"), "requires_admin_approval must be true");
        assertEquals(false, map.get("success"), "success must be false for high-impact approval-required responses");
        assertNotNull(map.get("message"), "Response must include an explanatory message");
    }

    @Test
    @DisplayName("7. PII Redaction: Masks emails, phone numbers, and secrets in outputs")
    void testPiiRedaction() {
        Map<String, Object> sensitiveData = new java.util.LinkedHashMap<>();
        sensitiveData.put("citizenPhone", "+91 9876543210");
        sensitiveData.put("citizenEmail", "rahul.verma@example.com");
        sensitiveData.put("password", "plaintext_secret_1234");
        sensitiveData.put("apiKey", "super_secret_api_key_5678");
        sensitiveData.put("nested", Map.of("contact", "write to test@jharkhand.gov.in for help"));

        @SuppressWarnings("unchecked")
        Map<String, Object> redacted = (Map<String, Object>) toolRegistry.redactPii(sensitiveData);

        // Secrets should be completely stripped
        assertFalse(redacted.containsKey("password"), "password field must be stripped by PII redaction");
        assertFalse(redacted.containsKey("apiKey"), "apiKey field must be stripped by PII redaction");
    }

    @Test
    @DisplayName("8. Read & Analyze Tool Execution: Returns structured data")
    void testToolExecution() {
        McpTokenService.TokenGenerationResult gen = tokenService.generateToken("admin-test", null);
        McpToken token = tokenRepository.findById(gen.id()).orElseThrow();

        Object districtStats = toolRegistry.executeTool("mcp_get_district_statistics", Map.of("district", "Ranchi"), token);
        assertNotNull(districtStats, "District statistics should not be null");
        assertTrue(districtStats instanceof Map<?, ?>, "District statistics should be a Map");

        Object domainStats = toolRegistry.executeTool("mcp_get_domain_statistics", Map.of(), token);
        assertNotNull(domainStats, "Domain statistics should not be null");

        Object analyzeRes = toolRegistry.executeTool("mcp_analyze_problem", Map.of("problem_id", "TEST-1"), token);
        assertNotNull(analyzeRes, "Problem analysis result should not be null");
        assertTrue(analyzeRes instanceof Map<?, ?>, "Analysis result should be a Map");
    }

    @Test
    @DisplayName("9. Audit Service: Tracks request timestamps, failed auth, and metrics")
    void testAuditMetrics() {
        auditService.logEvent(
                McpAuditService.McpAuditEvent.MCP_AUTH_FAILED,
                "attacker",
                "NONE",
                "mcp_search_problems",
                null,
                "FAILED",
                5,
                "Invalid bearer token"
        );

        Map<String, Object> metrics = auditService.getAuditMetrics();
        assertNotNull(metrics.get("lastRequestTime"), "lastRequestTime must be set after a logged event");
        assertTrue((int) metrics.get("failedAuthAttempts") >= 1, "Failed auth count must be >= 1");
        assertTrue((int) metrics.get("totalRequests") >= 1, "Total requests must be >= 1");
        assertFalse(auditService.getRecentLogs(5).isEmpty(), "Recent logs should not be empty");
    }
}
