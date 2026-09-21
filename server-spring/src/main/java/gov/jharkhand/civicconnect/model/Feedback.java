package gov.jharkhand.civicconnect.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Document(collection = "feedback")
public class Feedback {
    @Id
    private String id;
    private String problemId;
    private String citizenName;
    private Integer rating;
    private String feedbackText;
    private String sentiment;
    private String adminChosenDomain;
    private String adminChosenPriority;
    private String actionType;
    private String createdAt;
    private Map<String, Object> extraData;

    public Feedback() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getProblemId() { return problemId; }
    public void setProblemId(String problemId) { this.problemId = problemId; }
    public String getCitizenName() { return citizenName; }
    public void setCitizenName(String citizenName) { this.citizenName = citizenName; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getFeedbackText() { return feedbackText; }
    public void setFeedbackText(String feedbackText) { this.feedbackText = feedbackText; }
    public String getSentiment() { return sentiment; }
    public void setSentiment(String sentiment) { this.sentiment = sentiment; }
    public String getAdminChosenDomain() { return adminChosenDomain; }
    public void setAdminChosenDomain(String adminChosenDomain) { this.adminChosenDomain = adminChosenDomain; }
    public String getAdminChosenPriority() { return adminChosenPriority; }
    public void setAdminChosenPriority(String adminChosenPriority) { this.adminChosenPriority = adminChosenPriority; }
    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public Map<String, Object> getExtraData() { return extraData; }
    public void setExtraData(Map<String, Object> extraData) { this.extraData = extraData; }
}
