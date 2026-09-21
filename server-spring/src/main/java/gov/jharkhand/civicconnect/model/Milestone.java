package gov.jharkhand.civicconnect.model;

import java.util.ArrayList;
import java.util.List;

public class Milestone {
    private String id;
    private Integer milestoneNumber;
    private String title;
    private Integer targetWeeks;
    private int progress;
    private boolean completed;
    private String status; // "PENDING", "IN_PROGRESS", "COMPLETED"
    private List<String> evidenceUrls = new ArrayList<>();
    private String completedDate;
    private String fieldNotes;

    public Milestone() {}

    public Milestone(String title, int progress, boolean completed) {
        this.title = title;
        this.progress = progress;
        this.completed = completed;
        this.status = completed ? "COMPLETED" : (progress > 0 ? "IN_PROGRESS" : "PENDING");
    }

    public Milestone(Integer milestoneNumber, String title, Integer targetWeeks) {
        this.milestoneNumber = milestoneNumber;
        this.title = title;
        this.targetWeeks = targetWeeks;
        this.progress = 0;
        this.completed = false;
        this.status = "PENDING";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Integer getMilestoneNumber() { return milestoneNumber; }
    public void setMilestoneNumber(Integer milestoneNumber) { this.milestoneNumber = milestoneNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getTargetWeeks() { return targetWeeks; }
    public void setTargetWeeks(Integer targetWeeks) { this.targetWeeks = targetWeeks; }
    public int getProgress() { return progress; }
    public void setProgress(int progress) { 
        this.progress = progress; 
        if (progress >= 100) {
            this.completed = true;
            this.status = "COMPLETED";
        } else if (progress > 0) {
            this.status = "IN_PROGRESS";
        }
    }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { 
        this.completed = completed; 
        if (completed) {
            this.progress = 100;
            this.status = "COMPLETED";
        }
    }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<String> getEvidenceUrls() { return evidenceUrls; }
    public void setEvidenceUrls(List<String> evidenceUrls) { this.evidenceUrls = evidenceUrls; }
    public String getCompletedDate() { return completedDate; }
    public void setCompletedDate(String completedDate) { this.completedDate = completedDate; }
    public String getFieldNotes() { return fieldNotes; }
    public void setFieldNotes(String fieldNotes) { this.fieldNotes = fieldNotes; }
}
