package gov.jharkhand.civicconnect.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String recipientUserId;
    private String recipientRole; // "CITIZEN", "UNIVERSITY", "INDUSTRY", "ADMIN"
    private String recipientEmail;
    private String title;
    private String message;
    private String type; // "MILESTONE_UPDATED", "RISK_ALERT", "COMPLETION_SUBMITTED", "RESOLUTION_APPROVED"
    private String referenceId; // problemId or projectId
    private boolean read = false;
    private String createdAt = Instant.now().toString();

    public Notification() {}

    public Notification(String recipientUserId, String recipientRole, String title, String message, String type, String referenceId) {
        this.recipientUserId = recipientUserId;
        this.recipientRole = recipientRole;
        this.title = title;
        this.message = message;
        this.type = type;
        this.referenceId = referenceId;
        this.read = false;
        this.createdAt = Instant.now().toString();
    }

    public Notification(String id, String type, String title, String message, String referenceId, boolean read) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.referenceId = referenceId;
        this.read = read;
        this.createdAt = Instant.now().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRecipientUserId() { return recipientUserId; }
    public void setRecipientUserId(String recipientUserId) { this.recipientUserId = recipientUserId; }
    public String getRecipientRole() { return recipientRole; }
    public void setRecipientRole(String recipientRole) { this.recipientRole = recipientRole; }
    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
