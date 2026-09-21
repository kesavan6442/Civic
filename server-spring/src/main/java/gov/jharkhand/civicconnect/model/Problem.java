package gov.jharkhand.civicconnect.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

@Document(collection = "problems")
public class Problem {
    @Id
    private String id;
    
    private String title;
    
    @Indexed
    private String category;
    
    @Indexed
    private String domain;
    
    private String description;
    private String citizenName;
    private String citizenPhone;
    
    @Indexed
    private String citizenEmail;
    
    @Indexed
    private String userId;
    
    private String submissionDate;
    
    @Indexed
    private String district;
    
    private String locationAddress;
    private String mediaType;
    private String mediaUrl;
    
    @Indexed
    private String status;
    
    private String urgency;
    private String priority;
    private String createdAt;
    private String aiStatus;
    private String duplicateStatus;
    private Integer matchedUniversitiesCount;
    private Integer solutionsCount;
    private List<Solution> solutions;
    private DeadlineInfo deadlineInfo;
    private List<Collaboration> industryCollaborations;
    private Map<String, Object> assignedTo;

    private String aiVerification;
    private String aiConfidence;
    private Double aiConfidenceValue;
    private String aiReason;
    private String aiSeverity;
    private String aiImpact;
    private String aiModelVersion;
    private Boolean needsHumanReview;
    private List<String> missingInformation;
    private List<String> keywords;
    
    // Image Authenticity & Evidence Fields
    private String imageAuthenticityStatus; // REAL, AI_GENERATED, UNCERTAIN, MANIPULATED
    private Double imageAuthenticityConfidence;
    private Boolean isEvidenceAcceptable;
    private String evidenceRejectionReason;
    private Map<String, Object> imageAuthenticity;
    private Boolean multimodalConflict;

    // Duplicate Detection Fields
    private Boolean possibleDuplicate;
    private String duplicateMatchingProblemId;
    private Double duplicateSimilarityScore;
    private String duplicateReason;
    private List<Map<String, Object>> duplicateCandidates;

    private String masterProblemId;
    private List<String> linkedCitizenReports;
    private Boolean autoRouted;
    private Integer aiPriorityScore;
    private Map<String, Object> aiExecutiveSummary;
    private Map<String, Object> aiAnalysis;
    private String adoptedByUniversity;
    private String adoptedByIndustry;
    private String fundingStatus;
    private String coFundingAmount;

    // Admin Review & Capability-Based Matching Workflow Fields
    private String approvalStatus; // "PENDING_ADMIN_REVIEW", "APPROVED_FOR_MATCHING", "REJECTED_BY_ADMIN", "MORE_INFO_REQUESTED"
    private String approvedBy;
    private String approvedAt;
    private String matchingStatus; // "NOT_STARTED", "MATCHING", "COMPLETED", "NO_CAPABLE_PARTNER_FOUND"
    private List<String> matchedUniversityIds;
    private List<String> matchedIndustryIds;
    private Map<String, Object> matchingExplanations;
    private String adminReviewNotes;
    private String adminRejectionReason;
    private String resolvedAt;

    public Problem() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCitizenName() { return citizenName; }
    public void setCitizenName(String citizenName) { this.citizenName = citizenName; }
    public String getCitizenPhone() { return citizenPhone; }
    public void setCitizenPhone(String citizenPhone) { this.citizenPhone = citizenPhone; }
    public String getSubmissionDate() { return submissionDate; }
    public void setSubmissionDate(String submissionDate) { this.submissionDate = submissionDate; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getLocationAddress() { return locationAddress; }
    public void setLocationAddress(String locationAddress) { this.locationAddress = locationAddress; }
    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getAiStatus() { return aiStatus; }
    public void setAiStatus(String aiStatus) { this.aiStatus = aiStatus; }
    public String getDuplicateStatus() { return duplicateStatus; }
    public void setDuplicateStatus(String duplicateStatus) { this.duplicateStatus = duplicateStatus; }
    public Integer getMatchedUniversitiesCount() { return matchedUniversitiesCount; }
    public void setMatchedUniversitiesCount(Integer matchedUniversitiesCount) { this.matchedUniversitiesCount = matchedUniversitiesCount; }
    public Integer getSolutionsCount() { return solutionsCount; }
    public void setSolutionsCount(Integer solutionsCount) { this.solutionsCount = solutionsCount; }
    public List<Solution> getSolutions() { return solutions; }
    public void setSolutions(List<Solution> solutions) { this.solutions = solutions; }
    public DeadlineInfo getDeadlineInfo() { return deadlineInfo; }
    public void setDeadlineInfo(DeadlineInfo deadlineInfo) { this.deadlineInfo = deadlineInfo; }
    public List<Collaboration> getIndustryCollaborations() { return industryCollaborations; }
    public void setIndustryCollaborations(List<Collaboration> industryCollaborations) { this.industryCollaborations = industryCollaborations; }
    public Map<String, Object> getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Map<String, Object> assignedTo) { this.assignedTo = assignedTo; }

    public String getAiVerification() { return aiVerification; }
    public void setAiVerification(String aiVerification) { this.aiVerification = aiVerification; }
    public String getAiConfidence() { return aiConfidence; }
    public void setAiConfidence(String aiConfidence) { this.aiConfidence = aiConfidence; }
    public String getAiReason() { return aiReason; }
    public void setAiReason(String aiReason) { this.aiReason = aiReason; }
    public String getAiSeverity() { return aiSeverity; }
    public void setAiSeverity(String aiSeverity) { this.aiSeverity = aiSeverity; }
    public String getAiImpact() { return aiImpact; }
    public void setAiImpact(String aiImpact) { this.aiImpact = aiImpact; }
    public String getMasterProblemId() { return masterProblemId; }
    public void setMasterProblemId(String masterProblemId) { this.masterProblemId = masterProblemId; }
    public List<String> getLinkedCitizenReports() { return linkedCitizenReports; }
    public void setLinkedCitizenReports(List<String> linkedCitizenReports) { this.linkedCitizenReports = linkedCitizenReports; }
    public Boolean getAutoRouted() { return autoRouted; }
    public void setAutoRouted(Boolean autoRouted) { this.autoRouted = autoRouted; }
    public Integer getAiPriorityScore() { return aiPriorityScore; }
    public void setAiPriorityScore(Integer aiPriorityScore) { this.aiPriorityScore = aiPriorityScore; }
    public Map<String, Object> getAiExecutiveSummary() { return aiExecutiveSummary; }
    public void setAiExecutiveSummary(Map<String, Object> aiExecutiveSummary) { this.aiExecutiveSummary = aiExecutiveSummary; }
    public Map<String, Object> getAiAnalysis() { return aiAnalysis; }
    public void setAiAnalysis(Map<String, Object> aiAnalysis) { this.aiAnalysis = aiAnalysis; }
    public String getAdoptedByUniversity() { return adoptedByUniversity; }
    public void setAdoptedByUniversity(String adoptedByUniversity) { this.adoptedByUniversity = adoptedByUniversity; }
    public String getAdoptedByIndustry() { return adoptedByIndustry; }
    public void setAdoptedByIndustry(String adoptedByIndustry) { this.adoptedByIndustry = adoptedByIndustry; }
    public String getFundingStatus() { return fundingStatus; }
    public void setFundingStatus(String fundingStatus) { this.fundingStatus = fundingStatus; }
    public String getCoFundingAmount() { return coFundingAmount; }
    public void setCoFundingAmount(String coFundingAmount) { this.coFundingAmount = coFundingAmount; }
    public String getCitizenEmail() { return citizenEmail; }
    public void setCitizenEmail(String citizenEmail) { this.citizenEmail = citizenEmail; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Double getAiConfidenceValue() { return aiConfidenceValue; }
    public void setAiConfidenceValue(Double aiConfidenceValue) { this.aiConfidenceValue = aiConfidenceValue; }
    public String getAiModelVersion() { return aiModelVersion; }
    public void setAiModelVersion(String aiModelVersion) { this.aiModelVersion = aiModelVersion; }
    public Boolean getNeedsHumanReview() { return needsHumanReview; }
    public void setNeedsHumanReview(Boolean needsHumanReview) { this.needsHumanReview = needsHumanReview; }
    public List<String> getMissingInformation() { return missingInformation; }
    public void setMissingInformation(List<String> missingInformation) { this.missingInformation = missingInformation; }
    public List<String> getKeywords() { return keywords; }
    public void setKeywords(List<String> keywords) { this.keywords = keywords; }

    public String getImageAuthenticityStatus() { return imageAuthenticityStatus; }
    public void setImageAuthenticityStatus(String imageAuthenticityStatus) { this.imageAuthenticityStatus = imageAuthenticityStatus; }
    public Double getImageAuthenticityConfidence() { return imageAuthenticityConfidence; }
    public void setImageAuthenticityConfidence(Double imageAuthenticityConfidence) { this.imageAuthenticityConfidence = imageAuthenticityConfidence; }
    public Boolean getIsEvidenceAcceptable() { return isEvidenceAcceptable; }
    public void setIsEvidenceAcceptable(Boolean isEvidenceAcceptable) { this.isEvidenceAcceptable = isEvidenceAcceptable; }
    public String getEvidenceRejectionReason() { return evidenceRejectionReason; }
    public void setEvidenceRejectionReason(String evidenceRejectionReason) { this.evidenceRejectionReason = evidenceRejectionReason; }
    public Map<String, Object> getImageAuthenticity() { return imageAuthenticity; }
    public void setImageAuthenticity(Map<String, Object> imageAuthenticity) { this.imageAuthenticity = imageAuthenticity; }
    public Boolean getMultimodalConflict() { return multimodalConflict; }
    public void setMultimodalConflict(Boolean multimodalConflict) { this.multimodalConflict = multimodalConflict; }

    public Boolean getPossibleDuplicate() { return possibleDuplicate; }
    public void setPossibleDuplicate(Boolean possibleDuplicate) { this.possibleDuplicate = possibleDuplicate; }
    public String getDuplicateMatchingProblemId() { return duplicateMatchingProblemId; }
    public void setDuplicateMatchingProblemId(String duplicateMatchingProblemId) { this.duplicateMatchingProblemId = duplicateMatchingProblemId; }
    public Double getDuplicateSimilarityScore() { return duplicateSimilarityScore; }
    public void setDuplicateSimilarityScore(Double duplicateSimilarityScore) { this.duplicateSimilarityScore = duplicateSimilarityScore; }
    public String getDuplicateReason() { return duplicateReason; }
    public void setDuplicateReason(String duplicateReason) { this.duplicateReason = duplicateReason; }
    public List<Map<String, Object>> getDuplicateCandidates() { return duplicateCandidates; }
    public void setDuplicateCandidates(List<Map<String, Object>> duplicateCandidates) { this.duplicateCandidates = duplicateCandidates; }

    // Targeted Dispatch & Proposal Workflow
    private Map<String, Object> dispatchStatus;
    private String proposalDeadline;
    private String invitationSentAt;
    private String requestedInformation;
    private String infoRequestedBy;
    private String infoRequestedAt;
    private String infoResponseDeadline;
    private String activeProjectId;
    private String activeCollaborationId;
    private List<Map<String, Object>> collaborationReports;
    private Map<String, Object> latestCollaborationReport;

    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public String getApprovedAt() { return approvedAt; }
    public void setApprovedAt(String approvedAt) { this.approvedAt = approvedAt; }
    public String getMatchingStatus() { return matchingStatus; }
    public void setMatchingStatus(String matchingStatus) { this.matchingStatus = matchingStatus; }
    public List<String> getMatchedUniversityIds() { return matchedUniversityIds; }
    public void setMatchedUniversityIds(List<String> matchedUniversityIds) { this.matchedUniversityIds = matchedUniversityIds; }
    public List<String> getMatchedIndustryIds() { return matchedIndustryIds; }
    public void setMatchedIndustryIds(List<String> matchedIndustryIds) { this.matchedIndustryIds = matchedIndustryIds; }
    public Map<String, Object> getMatchingExplanations() { return matchingExplanations; }
    public void setMatchingExplanations(Map<String, Object> matchingExplanations) { this.matchingExplanations = matchingExplanations; }
    public String getAdminReviewNotes() { return adminReviewNotes; }
    public void setAdminReviewNotes(String adminReviewNotes) { this.adminReviewNotes = adminReviewNotes; }
    public String getAdminRejectionReason() { return adminRejectionReason; }
    public void setAdminRejectionReason(String adminRejectionReason) { this.adminRejectionReason = adminRejectionReason; }

    public Map<String, Object> getDispatchStatus() { return dispatchStatus; }
    public void setDispatchStatus(Map<String, Object> dispatchStatus) { this.dispatchStatus = dispatchStatus; }
    public String getProposalDeadline() { return proposalDeadline; }
    public void setProposalDeadline(String proposalDeadline) { this.proposalDeadline = proposalDeadline; }
    public String getInvitationSentAt() { return invitationSentAt; }
    public void setInvitationSentAt(String invitationSentAt) { this.invitationSentAt = invitationSentAt; }
    public String getRequestedInformation() { return requestedInformation; }
    public void setRequestedInformation(String requestedInformation) { this.requestedInformation = requestedInformation; }
    public String getInfoRequestedBy() { return infoRequestedBy; }
    public void setInfoRequestedBy(String infoRequestedBy) { this.infoRequestedBy = infoRequestedBy; }
    public String getInfoRequestedAt() { return infoRequestedAt; }
    public void setInfoRequestedAt(String infoRequestedAt) { this.infoRequestedAt = infoRequestedAt; }
    public String getInfoResponseDeadline() { return infoResponseDeadline; }
    public void setInfoResponseDeadline(String infoResponseDeadline) { this.infoResponseDeadline = infoResponseDeadline; }
    public String getActiveProjectId() { return activeProjectId; }
    public void setActiveProjectId(String activeProjectId) { this.activeProjectId = activeProjectId; }
    public String getActiveCollaborationId() { return activeCollaborationId; }
    public void setActiveCollaborationId(String activeCollaborationId) { this.activeCollaborationId = activeCollaborationId; }
    public List<Map<String, Object>> getCollaborationReports() { return collaborationReports; }
    public void setCollaborationReports(List<Map<String, Object>> collaborationReports) { this.collaborationReports = collaborationReports; }
    public Map<String, Object> getLatestCollaborationReport() { return latestCollaborationReport; }
    public void setLatestCollaborationReport(Map<String, Object> latestCollaborationReport) { this.latestCollaborationReport = latestCollaborationReport; }
    public String getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(String resolvedAt) { this.resolvedAt = resolvedAt; }
}
