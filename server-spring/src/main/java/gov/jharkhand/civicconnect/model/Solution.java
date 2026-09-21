package gov.jharkhand.civicconnect.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Document(collection = "solutions")
public class Solution {
    @Id
    private String id;
    private String problemId;
    private String problemTitle;
    private String universityId;
    private String universityName;
    private String department;
    private String solutionTitle;
    private String technicalApproach;
    private String estimatedCost;
    private Integer estimatedTimeWeeks;
    private Integer relevanceScore;
    private Integer feasibilityScore;
    private Integer technicalQualityScore;
    private Integer impactScore;
    private String submittedDate;
    private String mentorName;
    private String mentorDesignation;
    private String mentorEmail;
    private String mentorPhone;
    private Integer teamMembersCount;
    private List<Map<String, Object>> students;
    private List<Map<String, Object>> faculties;
    private List<Map<String, Object>> files;
    private String status;
    private String submitterType; // "university" or "industry"
    private String companyId;
    private String companyName;
    private String teamLeadName;
    private String teamLeadEmail;
    private String teamLeadMobile;
    private String teamLeadDesignation;
    private List<Map<String, Object>> members;
    private String folderLink;
    private String description;
    private String fundingAmount;
    private String category;
    private String domain;
    private String rejectionReason;
    private String adminFeedback;
    private String assignedDate;
    private String assignedBy;
    private String userId;
    private String userEmail;
    private String leadName;
    private List<String> teamMembers;
    private List<Map<String, Object>> milestones;
    private String proposalDocUrl;
    private String expectedOutcome;
    private Map<String, Object> aiAnalysis;
    private String aiModelVersion;
    private String aiAnalysisTimestamp;
    private String aiStatus;
    private Boolean needsHumanReview;
    private String overallScore;
    private Double overallScoreValue;
    private Double alignmentScore;
    private Double methodologyScore;
    private Double budgetRealismScore;
    private Double timelineFeasibilityScore;
    private String createdAt;
    private String updatedAt;

    public Solution() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getProblemId() { return problemId; }
    public void setProblemId(String problemId) { this.problemId = problemId; }
    public String getProblemTitle() { return problemTitle; }
    public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }
    public String getUniversityId() { return universityId; }
    public void setUniversityId(String universityId) { this.universityId = universityId; }
    public String getUniversityName() { return universityName; }
    public void setUniversityName(String universityName) { this.universityName = universityName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getSolutionTitle() { return solutionTitle; }
    public void setSolutionTitle(String solutionTitle) { this.solutionTitle = solutionTitle; }
    public String getTechnicalApproach() { return technicalApproach; }
    public void setTechnicalApproach(String technicalApproach) { this.technicalApproach = technicalApproach; }
    public String getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(String estimatedCost) { this.estimatedCost = estimatedCost; }
    public Integer getEstimatedTimeWeeks() { return estimatedTimeWeeks; }
    public void setEstimatedTimeWeeks(Integer estimatedTimeWeeks) { this.estimatedTimeWeeks = estimatedTimeWeeks; }
    public Integer getRelevanceScore() { return relevanceScore; }
    public void setRelevanceScore(Integer relevanceScore) { this.relevanceScore = relevanceScore; }
    public Integer getFeasibilityScore() { return feasibilityScore; }
    public void setFeasibilityScore(Integer feasibilityScore) { this.feasibilityScore = feasibilityScore; }
    public Integer getTechnicalQualityScore() { return technicalQualityScore; }
    public void setTechnicalQualityScore(Integer technicalQualityScore) { this.technicalQualityScore = technicalQualityScore; }
    public Integer getImpactScore() { return impactScore; }
    public void setImpactScore(Integer impactScore) { this.impactScore = impactScore; }
    public String getSubmittedDate() { return submittedDate; }
    public void setSubmittedDate(String submittedDate) { this.submittedDate = submittedDate; }
    public String getMentorName() { return mentorName; }
    public void setMentorName(String mentorName) { this.mentorName = mentorName; }
    public String getMentorDesignation() { return mentorDesignation; }
    public void setMentorDesignation(String mentorDesignation) { this.mentorDesignation = mentorDesignation; }
    public String getMentorEmail() { return mentorEmail; }
    public void setMentorEmail(String mentorEmail) { this.mentorEmail = mentorEmail; }
    public String getMentorPhone() { return mentorPhone; }
    public void setMentorPhone(String mentorPhone) { this.mentorPhone = mentorPhone; }
    public Integer getTeamMembersCount() { return teamMembersCount; }
    public void setTeamMembersCount(Integer teamMembersCount) { this.teamMembersCount = teamMembersCount; }
    public List<Map<String, Object>> getStudents() { return students; }
    public void setStudents(List<Map<String, Object>> students) { this.students = students; }
    public List<Map<String, Object>> getFaculties() { return faculties; }
    public void setFaculties(List<Map<String, Object>> faculties) { this.faculties = faculties; }
    public List<Map<String, Object>> getFiles() { return files; }
    public void setFiles(List<Map<String, Object>> files) { this.files = files; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSubmitterType() { return submitterType; }
    public void setSubmitterType(String submitterType) { this.submitterType = submitterType; }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getTeamLeadName() { return teamLeadName; }
    public void setTeamLeadName(String teamLeadName) { this.teamLeadName = teamLeadName; }
    public String getTeamLeadEmail() { return teamLeadEmail; }
    public void setTeamLeadEmail(String teamLeadEmail) { this.teamLeadEmail = teamLeadEmail; }
    public String getTeamLeadMobile() { return teamLeadMobile; }
    public void setTeamLeadMobile(String teamLeadMobile) { this.teamLeadMobile = teamLeadMobile; }
    public String getTeamLeadDesignation() { return teamLeadDesignation; }
    public void setTeamLeadDesignation(String teamLeadDesignation) { this.teamLeadDesignation = teamLeadDesignation; }
    public List<Map<String, Object>> getMembers() { return members; }
    public void setMembers(List<Map<String, Object>> members) { this.members = members; }
    public String getFolderLink() { return folderLink; }
    public void setFolderLink(String folderLink) { this.folderLink = folderLink; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getFundingAmount() { return fundingAmount; }
    public void setFundingAmount(String fundingAmount) { this.fundingAmount = fundingAmount; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public String getAdminFeedback() { return adminFeedback; }
    public void setAdminFeedback(String adminFeedback) { this.adminFeedback = adminFeedback; }
    public String getAssignedDate() { return assignedDate; }
    public void setAssignedDate(String assignedDate) { this.assignedDate = assignedDate; }
    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getLeadName() { return leadName; }
    public void setLeadName(String leadName) { this.leadName = leadName; }
    public List<String> getTeamMembers() { return teamMembers; }
    public void setTeamMembers(List<String> teamMembers) { this.teamMembers = teamMembers; }
    public List<Map<String, Object>> getMilestones() { return milestones; }
    public void setMilestones(List<Map<String, Object>> milestones) { this.milestones = milestones; }
    public String getProposalDocUrl() { return proposalDocUrl; }
    public void setProposalDocUrl(String proposalDocUrl) { this.proposalDocUrl = proposalDocUrl; }
    public String getExpectedOutcome() { return expectedOutcome; }
    public void setExpectedOutcome(String expectedOutcome) { this.expectedOutcome = expectedOutcome; }
    public Map<String, Object> getAiAnalysis() { return aiAnalysis; }
    public void setAiAnalysis(Map<String, Object> aiAnalysis) { this.aiAnalysis = aiAnalysis; }
    public String getAiModelVersion() { return aiModelVersion; }
    public void setAiModelVersion(String aiModelVersion) { this.aiModelVersion = aiModelVersion; }
    public String getAiAnalysisTimestamp() { return aiAnalysisTimestamp; }
    public void setAiAnalysisTimestamp(String aiAnalysisTimestamp) { this.aiAnalysisTimestamp = aiAnalysisTimestamp; }
    public String getAiStatus() { return aiStatus; }
    public void setAiStatus(String aiStatus) { this.aiStatus = aiStatus; }
    public Boolean getNeedsHumanReview() { return needsHumanReview; }
    public void setNeedsHumanReview(Boolean needsHumanReview) { this.needsHumanReview = needsHumanReview; }
    public String getOverallScore() { return overallScore; }
    public void setOverallScore(String overallScore) { this.overallScore = overallScore; }
    public Double getOverallScoreValue() { return overallScoreValue; }
    public void setOverallScoreValue(Double overallScoreValue) { this.overallScoreValue = overallScoreValue; }
    public Double getAlignmentScore() { return alignmentScore; }
    public void setAlignmentScore(Double alignmentScore) { this.alignmentScore = alignmentScore; }
    public Double getMethodologyScore() { return methodologyScore; }
    public void setMethodologyScore(Double methodologyScore) { this.methodologyScore = methodologyScore; }
    public Double getBudgetRealismScore() { return budgetRealismScore; }
    public void setBudgetRealismScore(Double budgetRealismScore) { this.budgetRealismScore = budgetRealismScore; }
    public Double getTimelineFeasibilityScore() { return timelineFeasibilityScore; }
    public void setTimelineFeasibilityScore(Double timelineFeasibilityScore) { this.timelineFeasibilityScore = timelineFeasibilityScore; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Solution solution = (Solution) o;
        return Objects.equals(id, solution.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
