package gov.jharkhand.civicconnect.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AiAnalysisResult {

    @JsonProperty("problem_id")
    @JsonAlias({"problemId", "id"})
    private String problemId;

    @JsonProperty("domain")
    @JsonAlias({"detectedDomain", "detected_domain"})
    private String domain;

    @JsonProperty("category")
    @JsonAlias({"detectedCategory", "detected_category"})
    private String category;

    @JsonProperty("urgency")
    @JsonAlias({"priority"})
    private String urgency;

    @JsonProperty("confidence")
    private Double confidence;

    @JsonProperty("keywords")
    private List<String> keywords;

    @JsonProperty("missing_information")
    @JsonAlias({"missingInformation"})
    private List<String> missingInformation;

    @JsonProperty("needs_human_review")
    @JsonAlias({"needsHumanReview"})
    private Boolean needsHumanReview;

    @JsonProperty("verification_recommendation")
    @JsonAlias({"verificationRecommendation"})
    private String verificationRecommendation;

    @JsonProperty("verification_reason")
    @JsonAlias({"verificationReason"})
    private String verificationReason;

    @JsonProperty("duplicate_candidates")
    @JsonAlias({"duplicateCandidates"})
    private List<Map<String, Object>> duplicateCandidates;

    @JsonProperty("image_authenticity")
    @JsonAlias({"imageAuthenticity"})
    private Map<String, Object> imageAuthenticity;

    @JsonProperty("multimodal_conflict")
    @JsonAlias({"multimodalConflict"})
    private Boolean multimodalConflict;

    @JsonProperty("model_version")
    @JsonAlias({"modelVersion", "aiModelVersion"})
    private String modelVersion;

    @JsonProperty("analysis_status")
    @JsonAlias({"analysisStatus"})
    private String analysisStatus;

    @JsonProperty("analyzed_at")
    @JsonAlias({"analyzedAt", "processedAt"})
    private String analyzedAt;

    private String severityScore;
    private String duplicateProbability;
    private boolean isDuplicate;
    private String duplicateWarning;
    private List<Map<String, Object>> similarProblems;
    private List<String> requiredExpertise;
    private Map<String, Object> textAnalysis;
    private Map<String, Object> imageAnalysis;
    private Map<String, Object> verification;
    private Map<String, Object> classification;
    private Map<String, Object> priorityAssessment;
    private Map<String, Object> duplicateAnalysis;
    private List<Map<String, Object>> topUniversityMatches;
    private List<Map<String, Object>> topIndustryMatches;
    private Map<String, Object> autoRouting;
    private Map<String, Object> executiveSummary;

    public AiAnalysisResult() {}

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

    public List<String> getKeywords() { return keywords; }
    public void setKeywords(List<String> keywords) { this.keywords = keywords; }

    public List<String> getMissingInformation() { return missingInformation; }
    public void setMissingInformation(List<String> missingInformation) { this.missingInformation = missingInformation; }

    public Boolean getNeedsHumanReview() { return needsHumanReview; }
    public void setNeedsHumanReview(Boolean needsHumanReview) { this.needsHumanReview = needsHumanReview; }

    public String getVerificationRecommendation() { return verificationRecommendation; }
    public void setVerificationRecommendation(String verificationRecommendation) { this.verificationRecommendation = verificationRecommendation; }

    public String getVerificationReason() { return verificationReason; }
    public void setVerificationReason(String verificationReason) { this.verificationReason = verificationReason; }

    public List<Map<String, Object>> getDuplicateCandidates() { return duplicateCandidates; }
    public void setDuplicateCandidates(List<Map<String, Object>> duplicateCandidates) { this.duplicateCandidates = duplicateCandidates; }

    public Map<String, Object> getImageAuthenticity() { return imageAuthenticity; }
    public void setImageAuthenticity(Map<String, Object> imageAuthenticity) { this.imageAuthenticity = imageAuthenticity; }

    public Boolean getMultimodalConflict() { return multimodalConflict; }
    public void setMultimodalConflict(Boolean multimodalConflict) { this.multimodalConflict = multimodalConflict; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public String getAnalysisStatus() { return analysisStatus; }
    public void setAnalysisStatus(String analysisStatus) { this.analysisStatus = analysisStatus; }

    public String getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(String analyzedAt) { this.analyzedAt = analyzedAt; }

    public String getDetectedCategory() { return category != null ? category : ""; }
    public void setDetectedCategory(String detectedCategory) { this.category = detectedCategory; }

    public String getDetectedDomain() { return domain != null ? domain : ""; }
    public void setDetectedDomain(String detectedDomain) { this.domain = detectedDomain; }

    public String getPriority() { return urgency != null ? urgency : "High"; }
    public void setPriority(String priority) { this.urgency = priority; }

    public String getSeverityScore() { return severityScore; }
    public void setSeverityScore(String severityScore) { this.severityScore = severityScore; }

    public String getDuplicateProbability() { return duplicateProbability; }
    public void setDuplicateProbability(String duplicateProbability) { this.duplicateProbability = duplicateProbability; }

    public boolean isDuplicate() { return isDuplicate; }
    public void setDuplicate(boolean duplicate) { isDuplicate = duplicate; }

    public String getDuplicateWarning() { return duplicateWarning; }
    public void setDuplicateWarning(String duplicateWarning) { this.duplicateWarning = duplicateWarning; }

    public List<Map<String, Object>> getSimilarProblems() { return similarProblems; }
    public void setSimilarProblems(List<Map<String, Object>> similarProblems) { this.similarProblems = similarProblems; }

    public List<String> getRequiredExpertise() { return requiredExpertise; }
    public void setRequiredExpertise(List<String> requiredExpertise) { this.requiredExpertise = requiredExpertise; }

    public Map<String, Object> getTextAnalysis() { return textAnalysis; }
    public void setTextAnalysis(Map<String, Object> textAnalysis) { this.textAnalysis = textAnalysis; }

    public Map<String, Object> getImageAnalysis() { return imageAnalysis; }
    public void setImageAnalysis(Map<String, Object> imageAnalysis) { this.imageAnalysis = imageAnalysis; }

    public String getAiModelVersion() { return modelVersion; }
    public void setAiModelVersion(String aiModelVersion) { this.modelVersion = aiModelVersion; }

    public String getProcessedAt() { return analyzedAt; }
    public void setProcessedAt(String processedAt) { this.analyzedAt = processedAt; }

    public Map<String, Object> getVerification() { return verification; }
    public void setVerification(Map<String, Object> verification) { this.verification = verification; }

    public Map<String, Object> getClassification() { return classification; }
    public void setClassification(Map<String, Object> classification) { this.classification = classification; }

    public Map<String, Object> getPriorityAssessment() { return priorityAssessment; }
    public void setPriorityAssessment(Map<String, Object> priorityAssessment) { this.priorityAssessment = priorityAssessment; }

    public Map<String, Object> getDuplicateAnalysis() { return duplicateAnalysis; }
    public void setDuplicateAnalysis(Map<String, Object> duplicateAnalysis) { this.duplicateAnalysis = duplicateAnalysis; }

    public List<Map<String, Object>> getTopUniversityMatches() { return topUniversityMatches; }
    public void setTopUniversityMatches(List<Map<String, Object>> topUniversityMatches) { this.topUniversityMatches = topUniversityMatches; }

    public List<Map<String, Object>> getTopIndustryMatches() { return topIndustryMatches; }
    public void setTopIndustryMatches(List<Map<String, Object>> topIndustryMatches) { this.topIndustryMatches = topIndustryMatches; }

    public Map<String, Object> getAutoRouting() { return autoRouting; }
    public void setAutoRouting(Map<String, Object> autoRouting) { this.autoRouting = autoRouting; }

    public Map<String, Object> getExecutiveSummary() { return executiveSummary; }
    public void setExecutiveSummary(Map<String, Object> executiveSummary) { this.executiveSummary = executiveSummary; }
}
