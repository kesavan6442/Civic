package gov.jharkhand.civicconnect.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document(collection = "projects")
public class Project {
    @Id
    private String id;
    
    @Version
    private Long version;

    private String problemId;
    private String problemTitle;
    private String domain;
    private String category;
    private String district;

    private String collaborationId;
    private String solutionId;
    private String universityId;
    private String universityName;
    private String universityUserId;
    private String industryId;
    private String companyName;
    private String industryUserId;

    // State Machine: IN_PROGRESS -> COMPLETION_SUBMITTED -> PENDING_ADMIN_VERIFICATION -> ADMIN_VERIFIED -> RESOLVED
    private String status; // "IN_PROGRESS", "COMPLETION_SUBMITTED", "PENDING_ADMIN_VERIFICATION", "ADMIN_VERIFIED", "RESOLVED"

    // Real Persisted Timeline & SLA Inputs
    private String startDate;
    private String projectStartDate;
    private String deadlineDate;
    private Integer approvedSlaDays; // default 90
    private Integer daysElapsed;
    private Integer daysRemaining;
    private Integer slaProgressPercentage;
    private Double slaBurnPercentage;
    private Double milestoneVelocity;

    private Integer progress; // 0 - 100
    private List<Milestone> milestones = new ArrayList<>();
    private String budgetSanctioned;

    // Real Explainable AI SLA Risk Fields
    private String riskLevel; // "Low", "Medium", "High", "Critical"
    private Double delayProbability;
    private Integer projectedDelayDays;
    private List<String> activeRiskFactors = new ArrayList<>();
    private String aiProgressSummary;
    private String aiModelVersion;
    private String aiStatus; // "ANALYZED", "PENDING"
    private Boolean needsHumanReview;
    private String lastRiskAnalysisTimestamp;
    private Map<String, Object> aiRiskAnalysis;

    // Completion Submission Details
    private String finalDeliverablesSummary;
    private List<String> finalEvidenceUrls = new ArrayList<>();
    private String completionSubmittedAt;
    private String completionSubmittedBy;
    private String completionNotes;

    // Administrative Resolution / Work Order Record
    private String auditStatus; // "VERIFIED", "REJECTED"
    private String sanctionOrderNumber;
    private String workOrderDetails;
    private String sanctionedBy;
    private String resolutionNotes;
    private String resolvedAt;
    private Map<String, Object> resolutionAuditResult;

    private String createdAt;
    private String updatedAt;

    public Project() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
    public String getProblemId() { return problemId; }
    public void setProblemId(String problemId) { this.problemId = problemId; }
    public String getProblemTitle() { return problemTitle; }
    public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getCollaborationId() { return collaborationId; }
    public void setCollaborationId(String collaborationId) { this.collaborationId = collaborationId; }
    public String getSolutionId() { return solutionId; }
    public void setSolutionId(String solutionId) { this.solutionId = solutionId; }
    public String getUniversityId() { return universityId; }
    public void setUniversityId(String universityId) { this.universityId = universityId; }
    public String getUniversityName() { return universityName; }
    public void setUniversityName(String universityName) { this.universityName = universityName; }
    public String getUniversityUserId() { return universityUserId; }
    public void setUniversityUserId(String universityUserId) { this.universityUserId = universityUserId; }
    public String getIndustryId() { return industryId; }
    public void setIndustryId(String industryId) { this.industryId = industryId; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getIndustryUserId() { return industryUserId; }
    public void setIndustryUserId(String industryUserId) { this.industryUserId = industryUserId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getProjectStartDate() { return projectStartDate; }
    public void setProjectStartDate(String projectStartDate) { this.projectStartDate = projectStartDate; }
    public String getDeadlineDate() { return deadlineDate; }
    public void setDeadlineDate(String deadlineDate) { this.deadlineDate = deadlineDate; }
    public Integer getApprovedSlaDays() { return approvedSlaDays; }
    public void setApprovedSlaDays(Integer approvedSlaDays) { this.approvedSlaDays = approvedSlaDays; }
    public Integer getDaysElapsed() { return daysElapsed; }
    public void setDaysElapsed(Integer daysElapsed) { this.daysElapsed = daysElapsed; }
    public Integer getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(Integer daysRemaining) { this.daysRemaining = daysRemaining; }
    public Integer getSlaProgressPercentage() { return slaProgressPercentage; }
    public void setSlaProgressPercentage(Integer slaProgressPercentage) { this.slaProgressPercentage = slaProgressPercentage; }
    public Double getSlaBurnPercentage() { return slaBurnPercentage; }
    public void setSlaBurnPercentage(Double slaBurnPercentage) { this.slaBurnPercentage = slaBurnPercentage; }
    public Double getMilestoneVelocity() { return milestoneVelocity; }
    public void setMilestoneVelocity(Double milestoneVelocity) { this.milestoneVelocity = milestoneVelocity; }
    public Integer getProgress() { return progress; }
    public void setProgress(Integer progress) { this.progress = progress; }
    public List<Milestone> getMilestones() { return milestones; }
    public void setMilestones(List<Milestone> milestones) { this.milestones = milestones; }
    public String getBudgetSanctioned() { return budgetSanctioned; }
    public void setBudgetSanctioned(String budgetSanctioned) { this.budgetSanctioned = budgetSanctioned; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public Double getDelayProbability() { return delayProbability; }
    public void setDelayProbability(Double delayProbability) { this.delayProbability = delayProbability; }
    public Integer getProjectedDelayDays() { return projectedDelayDays; }
    public void setProjectedDelayDays(Integer projectedDelayDays) { this.projectedDelayDays = projectedDelayDays; }
    public List<String> getActiveRiskFactors() { return activeRiskFactors; }
    public void setActiveRiskFactors(List<String> activeRiskFactors) { this.activeRiskFactors = activeRiskFactors; }
    public String getAiProgressSummary() { return aiProgressSummary; }
    public void setAiProgressSummary(String aiProgressSummary) { this.aiProgressSummary = aiProgressSummary; }
    public String getAiModelVersion() { return aiModelVersion; }
    public void setAiModelVersion(String aiModelVersion) { this.aiModelVersion = aiModelVersion; }
    public String getAiStatus() { return aiStatus; }
    public void setAiStatus(String aiStatus) { this.aiStatus = aiStatus; }
    public Boolean getNeedsHumanReview() { return needsHumanReview; }
    public void setNeedsHumanReview(Boolean needsHumanReview) { this.needsHumanReview = needsHumanReview; }
    public String getLastRiskAnalysisTimestamp() { return lastRiskAnalysisTimestamp; }
    public void setLastRiskAnalysisTimestamp(String lastRiskAnalysisTimestamp) { this.lastRiskAnalysisTimestamp = lastRiskAnalysisTimestamp; }
    public Map<String, Object> getAiRiskAnalysis() { return aiRiskAnalysis; }
    public void setAiRiskAnalysis(Map<String, Object> aiRiskAnalysis) { this.aiRiskAnalysis = aiRiskAnalysis; }
    public String getFinalDeliverablesSummary() { return finalDeliverablesSummary; }
    public void setFinalDeliverablesSummary(String finalDeliverablesSummary) { this.finalDeliverablesSummary = finalDeliverablesSummary; }
    public List<String> getFinalEvidenceUrls() { return finalEvidenceUrls; }
    public void setFinalEvidenceUrls(List<String> finalEvidenceUrls) { this.finalEvidenceUrls = finalEvidenceUrls; }
    public String getCompletionSubmittedAt() { return completionSubmittedAt; }
    public void setCompletionSubmittedAt(String completionSubmittedAt) { this.completionSubmittedAt = completionSubmittedAt; }
    public String getCompletionSubmittedBy() { return completionSubmittedBy; }
    public void setCompletionSubmittedBy(String completionSubmittedBy) { this.completionSubmittedBy = completionSubmittedBy; }
    public String getCompletionNotes() { return completionNotes; }
    public void setCompletionNotes(String completionNotes) { this.completionNotes = completionNotes; }
    public String getAuditStatus() { return auditStatus; }
    public void setAuditStatus(String auditStatus) { this.auditStatus = auditStatus; }
    public String getSanctionOrderNumber() { return sanctionOrderNumber; }
    public void setSanctionOrderNumber(String sanctionOrderNumber) { this.sanctionOrderNumber = sanctionOrderNumber; }
    public String getWorkOrderDetails() { return workOrderDetails; }
    public void setWorkOrderDetails(String workOrderDetails) { this.workOrderDetails = workOrderDetails; }
    public String getSanctionedBy() { return sanctionedBy; }
    public void setSanctionedBy(String sanctionedBy) { this.sanctionedBy = sanctionedBy; }
    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
    public String getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(String resolvedAt) { this.resolvedAt = resolvedAt; }
    public Map<String, Object> getResolutionAuditResult() { return resolutionAuditResult; }
    public void setResolutionAuditResult(Map<String, Object> resolutionAuditResult) { this.resolutionAuditResult = resolutionAuditResult; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
