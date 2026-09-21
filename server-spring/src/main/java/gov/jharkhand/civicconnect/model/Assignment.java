package gov.jharkhand.civicconnect.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "assignments")
public class Assignment {
    @Id
    private String id;
    private String problemId;
    private String problemTitle;
    private String problemCategory;
    private String universityId;
    private String universityName;
    private String department;
    private String mentorName;
    private String mentorDesignation;
    private String mentorEmail;
    private String mentorPhone;
    private String solutionId;
    private String solutionTitle;
    private String estimatedCost;
    private Integer estimatedTimeWeeks;
    private String technicalApproach;
    private String assignedDate;
    private String deadlineDate;
    private Integer deadlineMonths;
    private Integer slaTimelineDays;
    private String status;
    private List<Milestone> milestones;
    private String decisionNotes;
    private DeadlineInfo deadlineInfo;
    private String userId;
    private String userEmail;

    public Assignment() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getProblemId() { return problemId; }
    public void setProblemId(String problemId) { this.problemId = problemId; }
    public String getProblemTitle() { return problemTitle; }
    public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }
    public String getProblemCategory() { return problemCategory; }
    public void setProblemCategory(String problemCategory) { this.problemCategory = problemCategory; }
    public String getUniversityId() { return universityId; }
    public void setUniversityId(String universityId) { this.universityId = universityId; }
    public String getUniversityName() { return universityName; }
    public void setUniversityName(String universityName) { this.universityName = universityName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getMentorName() { return mentorName; }
    public void setMentorName(String mentorName) { this.mentorName = mentorName; }
    public String getMentorDesignation() { return mentorDesignation; }
    public void setMentorDesignation(String mentorDesignation) { this.mentorDesignation = mentorDesignation; }
    public String getMentorEmail() { return mentorEmail; }
    public void setMentorEmail(String mentorEmail) { this.mentorEmail = mentorEmail; }
    public String getMentorPhone() { return mentorPhone; }
    public void setMentorPhone(String mentorPhone) { this.mentorPhone = mentorPhone; }
    public String getSolutionId() { return solutionId; }
    public void setSolutionId(String solutionId) { this.solutionId = solutionId; }
    public String getSolutionTitle() { return solutionTitle; }
    public void setSolutionTitle(String solutionTitle) { this.solutionTitle = solutionTitle; }
    public String getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(String estimatedCost) { this.estimatedCost = estimatedCost; }
    public Integer getEstimatedTimeWeeks() { return estimatedTimeWeeks; }
    public void setEstimatedTimeWeeks(Integer estimatedTimeWeeks) { this.estimatedTimeWeeks = estimatedTimeWeeks; }
    public String getTechnicalApproach() { return technicalApproach; }
    public void setTechnicalApproach(String technicalApproach) { this.technicalApproach = technicalApproach; }
    public String getAssignedDate() { return assignedDate; }
    public void setAssignedDate(String assignedDate) { this.assignedDate = assignedDate; }
    public String getDeadlineDate() { return deadlineDate; }
    public void setDeadlineDate(String deadlineDate) { this.deadlineDate = deadlineDate; }
    public Integer getDeadlineMonths() { return deadlineMonths; }
    public void setDeadlineMonths(Integer deadlineMonths) { this.deadlineMonths = deadlineMonths; }
    public Integer getSlaTimelineDays() { return slaTimelineDays; }
    public void setSlaTimelineDays(Integer slaTimelineDays) { this.slaTimelineDays = slaTimelineDays; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<Milestone> getMilestones() { return milestones; }
    public void setMilestones(List<Milestone> milestones) { this.milestones = milestones; }
    public String getDecisionNotes() { return decisionNotes; }
    public void setDecisionNotes(String decisionNotes) { this.decisionNotes = decisionNotes; }
    public DeadlineInfo getDeadlineInfo() { return deadlineInfo; }
    public void setDeadlineInfo(DeadlineInfo deadlineInfo) { this.deadlineInfo = deadlineInfo; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
}
