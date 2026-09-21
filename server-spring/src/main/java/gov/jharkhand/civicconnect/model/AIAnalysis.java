package gov.jharkhand.civicconnect.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

@Document(collection = "ai_analysis")
public class AIAnalysis {
    @Id
    private String id;
    private String problemId;
    private String domain;
    private String category;
    private String urgency;
    private Double confidence;
    private Boolean needsHumanReview;
    private List<String> duplicateCandidates;
    private List<String> missingInformation;
    private String verificationRecommendation;
    private String modelVersion;
    private String analyzedAt;
    private Map<String, Object> imageAuthenticity;
    private Boolean multimodalConflict;
    private Map<String, Object> rawAnalysis;

    public AIAnalysis() {}

    public Map<String, Object> getImageAuthenticity() { return imageAuthenticity; }
    public void setImageAuthenticity(Map<String, Object> imageAuthenticity) { this.imageAuthenticity = imageAuthenticity; }
    public Boolean getMultimodalConflict() { return multimodalConflict; }
    public void setMultimodalConflict(Boolean multimodalConflict) { this.multimodalConflict = multimodalConflict; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getProblemId() { return problemId; }
    public void setProblemId(String problemId) { this.problemId = problemId; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }
    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }
    public Boolean getNeedsHumanReview() { return needsHumanReview; }
    public void setNeedsHumanReview(Boolean needsHumanReview) { this.needsHumanReview = needsHumanReview; }
    public List<String> getDuplicateCandidates() { return duplicateCandidates; }
    public void setDuplicateCandidates(List<String> duplicateCandidates) { this.duplicateCandidates = duplicateCandidates; }
    public List<String> getMissingInformation() { return missingInformation; }
    public void setMissingInformation(List<String> missingInformation) { this.missingInformation = missingInformation; }
    public String getVerificationRecommendation() { return verificationRecommendation; }
    public void setVerificationRecommendation(String verificationRecommendation) { this.verificationRecommendation = verificationRecommendation; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public String getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(String analyzedAt) { this.analyzedAt = analyzedAt; }
    public Map<String, Object> getRawAnalysis() { return rawAnalysis; }
    public void setRawAnalysis(Map<String, Object> rawAnalysis) { this.rawAnalysis = rawAnalysis; }
}
