package gov.jharkhand.civicconnect.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Document(collection = "collaborations")
public class Collaboration {
    @Id
    private String id;
    private String problemId;
    private String problemTitle;
    private String category;
    private String domain;
    private String universityId;
    private String universityName;
    private String department;
    private String industryId;
    private String companyName;
    private String contactPerson;
    private String contactEmail;
    private String contactPhone;
    private String fundingAmount;
    private String fundingStatus; // e.g. "Committed", "Approved", "Sanctioned"
    private List<String> supportTypes;
    private String collaborationNotes;
    private String solutionId;
    private String solutionTitle;
    private String collaboratedDate;
    private String collaboratedAt;
    private String status; // "PENDING_ADMIN_REVIEW", "APPROVED", "REJECTED", "Active Collaboration"
    private String solutionStatus;
    private String userId;
    private String userEmail;

    // Slice 3 additions
    private String equipmentSupport;
    private String technicalSupport;
    private String csrCommitmentDetails;
    private String csrDocUrl;
    private Double aiSynergyScore;
    private String aiSynergyRationale;
    private String universityRole;
    private String industryRole;
    private Map<String, Object> aiAnalysis;
    private String aiModelVersion;
    private String aiStatus;
    private Boolean needsHumanReview;
    private String adminFeedback;
    private String rejectionReason;
    private String createdAt;
    private String updatedAt;

    // Admin-Gated Collaboration Selection fields
    private Boolean selectedByAdmin;
    private String selectedAt;
    private String selectedBy;
    private String universityProposalId;
    private String industryProposalId;
    private String collaborationRationale;
    private String adminDecisionNotes;

    public Collaboration() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getProblemId() { return problemId; }
    public void setProblemId(String problemId) { this.problemId = problemId; }
    public String getProblemTitle() { return problemTitle; }
    public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public String getUniversityId() { return universityId; }
    public void setUniversityId(String universityId) { this.universityId = universityId; }
    public String getUniversityName() { return universityName; }
    public void setUniversityName(String universityName) { this.universityName = universityName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getIndustryId() { return industryId; }
    public void setIndustryId(String industryId) { this.industryId = industryId; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public String getFundingAmount() { return fundingAmount; }
    public void setFundingAmount(String fundingAmount) { this.fundingAmount = fundingAmount; }
    public String getFundingStatus() { return fundingStatus; }
    public void setFundingStatus(String fundingStatus) { this.fundingStatus = fundingStatus; }
    public List<String> getSupportTypes() { return supportTypes; }
    public void setSupportTypes(List<String> supportTypes) { this.supportTypes = supportTypes; }
    public String getCollaborationNotes() { return collaborationNotes; }
    public void setCollaborationNotes(String collaborationNotes) { this.collaborationNotes = collaborationNotes; }
    public String getSolutionId() { return solutionId; }
    public void setSolutionId(String solutionId) { this.solutionId = solutionId; }
    public String getSolutionTitle() { return solutionTitle; }
    public void setSolutionTitle(String solutionTitle) { this.solutionTitle = solutionTitle; }
    public String getCollaboratedDate() { return collaboratedDate; }
    public void setCollaboratedDate(String collaboratedDate) { this.collaboratedDate = collaboratedDate; }
    public String getCollaborationDate() { return collaboratedDate; }
    public void setCollaborationDate(String collaborationDate) { this.collaboratedDate = collaborationDate; }
    public String getCollaboratedAt() { return collaboratedAt; }
    public void setCollaboratedAt(String collaboratedAt) { this.collaboratedAt = collaboratedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSolutionStatus() { return solutionStatus; }
    public void setSolutionStatus(String solutionStatus) { this.solutionStatus = solutionStatus; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getEquipmentSupport() { return equipmentSupport; }
    public void setEquipmentSupport(String equipmentSupport) { this.equipmentSupport = equipmentSupport; }
    public String getTechnicalSupport() { return technicalSupport; }
    public void setTechnicalSupport(String technicalSupport) { this.technicalSupport = technicalSupport; }
    public String getCsrCommitmentDetails() { return csrCommitmentDetails; }
    public void setCsrCommitmentDetails(String csrCommitmentDetails) { this.csrCommitmentDetails = csrCommitmentDetails; }
    public String getCsrDocUrl() { return csrDocUrl; }
    public void setCsrDocUrl(String csrDocUrl) { this.csrDocUrl = csrDocUrl; }
    public Double getAiSynergyScore() { return aiSynergyScore; }
    public void setAiSynergyScore(Double aiSynergyScore) { this.aiSynergyScore = aiSynergyScore; }
    public String getAiSynergyRationale() { return aiSynergyRationale; }
    public void setAiSynergyRationale(String aiSynergyRationale) { this.aiSynergyRationale = aiSynergyRationale; }
    public String getUniversityRole() { return universityRole; }
    public void setUniversityRole(String universityRole) { this.universityRole = universityRole; }
    public String getIndustryRole() { return industryRole; }
    public void setIndustryRole(String industryRole) { this.industryRole = industryRole; }
    public Map<String, Object> getAiAnalysis() { return aiAnalysis; }
    public void setAiAnalysis(Map<String, Object> aiAnalysis) { this.aiAnalysis = aiAnalysis; }
    public String getAiModelVersion() { return aiModelVersion; }
    public void setAiModelVersion(String aiModelVersion) { this.aiModelVersion = aiModelVersion; }
    public String getAiStatus() { return aiStatus; }
    public void setAiStatus(String aiStatus) { this.aiStatus = aiStatus; }
    public Boolean getNeedsHumanReview() { return needsHumanReview; }
    public void setNeedsHumanReview(Boolean needsHumanReview) { this.needsHumanReview = needsHumanReview; }
    public String getAdminFeedback() { return adminFeedback; }
    public void setAdminFeedback(String adminFeedback) { this.adminFeedback = adminFeedback; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getSelectedByAdmin() { return selectedByAdmin; }
    public void setSelectedByAdmin(Boolean selectedByAdmin) { this.selectedByAdmin = selectedByAdmin; }
    public String getSelectedAt() { return selectedAt; }
    public void setSelectedAt(String selectedAt) { this.selectedAt = selectedAt; }
    public String getSelectedBy() { return selectedBy; }
    public void setSelectedBy(String selectedBy) { this.selectedBy = selectedBy; }
    public String getUniversityProposalId() { return universityProposalId; }
    public void setUniversityProposalId(String universityProposalId) { this.universityProposalId = universityProposalId; }
    public String getIndustryProposalId() { return industryProposalId; }
    public void setIndustryProposalId(String industryProposalId) { this.industryProposalId = industryProposalId; }
    public String getCollaborationRationale() { return collaborationRationale; }
    public void setCollaborationRationale(String collaborationRationale) { this.collaborationRationale = collaborationRationale; }
    public String getAdminDecisionNotes() { return adminDecisionNotes; }
    public void setAdminDecisionNotes(String adminDecisionNotes) { this.adminDecisionNotes = adminDecisionNotes; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Collaboration that = (Collaboration) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
