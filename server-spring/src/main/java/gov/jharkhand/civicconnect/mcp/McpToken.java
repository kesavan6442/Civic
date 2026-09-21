package gov.jharkhand.civicconnect.mcp;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "mcp_tokens")
public class McpToken {

    @Id
    private String id;

    @Indexed(unique = true)
    private String tokenHash;

    private String tokenPrefix;
    private String tokenMasked;
    private String createdBy;
    private Instant createdAt;
    private Instant expiresAt;
    private Instant revokedAt;
    private Instant lastUsedAt;
    private boolean active;
    private List<String> scopes = new ArrayList<>();
    private int failedAttempts;

    public McpToken() {
        this.createdAt = Instant.now();
        this.active = true;
    }

    public McpToken(String tokenHash, String tokenPrefix, String createdBy, Instant expiresAt, List<String> scopes) {
        this.tokenHash = tokenHash;
        this.tokenPrefix = tokenPrefix;
        this.tokenMasked = "civic_mcp_" + "•".repeat(32);
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
        this.expiresAt = expiresAt;
        this.active = true;
        this.scopes = scopes != null ? scopes : new ArrayList<>();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public String getTokenPrefix() {
        return tokenPrefix;
    }

    public void setTokenPrefix(String tokenPrefix) {
        this.tokenPrefix = tokenPrefix;
    }

    public String getTokenMasked() {
        return tokenMasked;
    }

    public void setTokenMasked(String tokenMasked) {
        this.tokenMasked = tokenMasked;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public String getCreatedByAdmin() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(Instant revokedAt) {
        this.revokedAt = revokedAt;
    }

    public Instant getLastUsedAt() {
        return lastUsedAt;
    }

    public void setLastUsedAt(Instant lastUsedAt) {
        this.lastUsedAt = lastUsedAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public List<String> getScopes() {
        return scopes;
    }

    public void setScopes(List<String> scopes) {
        this.scopes = scopes;
    }

    public int getFailedAttempts() {
        return failedAttempts;
    }

    public void setFailedAttempts(int failedAttempts) {
        this.failedAttempts = failedAttempts;
    }
}
