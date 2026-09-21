package gov.jharkhand.civicconnect.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "audit_logs")
public class AuditLog {
    @Id
    private String id;
    private String eventType; // "PROJECT_CREATED", "MILESTONE_UPDATED", "EVIDENCE_UPLOADED", "AI_RISK_ANALYZED", "RISK_DETECTED", "COMPLETION_SUBMITTED", "ADMIN_REVIEW_STARTED", "RESOLUTION_APPROVED", "PROJECT_RESOLVED"
    private String entityType; // "PROJECT", "PROBLEM", "COLLABORATION", "MILESTONE"
    private String entityId;
    private String performedByUserId;
    private String performedByRole;
    private String performedByEmail;
    private String details;
    private String executionMode; // "MANUAL", "MCP_ASSISTED", "MCP_ASSISTED_ADMIN_CONFIRMED", "MCP_READ", "MCP_ANALYZE", "MCP_AUTO"
    private String result; // "SUCCESS", "FAILED", "CONFIRMED"
    private String action;
    private Map<String, Object> metadata;
    private String timestamp = Instant.now().toString();

    public AuditLog() {}

    public AuditLog(String eventType, String entityType, String entityId, String performedByUserId, String performedByRole, String details, Map<String, Object> metadata) {
        this.eventType = eventType;
        this.action = eventType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.performedByUserId = performedByUserId;
        this.performedByRole = performedByRole;
        this.details = details;
        this.executionMode = "MANUAL";
        this.result = "SUCCESS";
        this.metadata = metadata;
        this.timestamp = Instant.now().toString();
    }

    public AuditLog(String eventType, String entityType, String entityId, String performedByUserId, String performedByRole, String details, String executionMode, String result, Map<String, Object> metadata) {
        this.eventType = eventType;
        this.action = eventType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.performedByUserId = performedByUserId;
        this.performedByRole = performedByRole;
        this.details = details;
        this.executionMode = executionMode != null ? executionMode : "MANUAL";
        this.result = result != null ? result : "SUCCESS";
        this.metadata = metadata;
        this.timestamp = Instant.now().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }
    public String getPerformedByUserId() { return performedByUserId; }
    public void setPerformedByUserId(String performedByUserId) { this.performedByUserId = performedByUserId; }
    public String getPerformedByRole() { return performedByRole; }
    public void setPerformedByRole(String performedByRole) { this.performedByRole = performedByRole; }
    public String getPerformedByEmail() { return performedByEmail; }
    public void setPerformedByEmail(String performedByEmail) { this.performedByEmail = performedByEmail; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getExecutionMode() { return executionMode; }
    public void setExecutionMode(String executionMode) { this.executionMode = executionMode; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public String getAction() { return action != null ? action : eventType; }
    public void setAction(String action) { this.action = action; }
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
