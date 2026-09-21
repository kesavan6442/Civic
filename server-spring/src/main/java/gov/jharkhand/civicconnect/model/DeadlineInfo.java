package gov.jharkhand.civicconnect.model;

public class DeadlineInfo {
    private String deadlineDate;
    private long daysRemaining;
    private String slaStatus;
    private boolean isBreached;
    private boolean isAtRisk;
    private int timelineDays;

    public DeadlineInfo() {}

    public DeadlineInfo(String deadlineDate, long daysRemaining, String slaStatus, boolean isBreached, boolean isAtRisk, int timelineDays) {
        this.deadlineDate = deadlineDate;
        this.daysRemaining = daysRemaining;
        this.slaStatus = slaStatus;
        this.isBreached = isBreached;
        this.isAtRisk = isAtRisk;
        this.timelineDays = timelineDays;
    }

    public String getDeadlineDate() { return deadlineDate; }
    public void setDeadlineDate(String deadlineDate) { this.deadlineDate = deadlineDate; }
    public long getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(long daysRemaining) { this.daysRemaining = daysRemaining; }
    public String getSlaStatus() { return slaStatus; }
    public void setSlaStatus(String slaStatus) { this.slaStatus = slaStatus; }
    public boolean isBreached() { return isBreached; }
    public void setBreached(boolean breached) { isBreached = breached; }
    public boolean isAtRisk() { return isAtRisk; }
    public void setAtRisk(boolean atRisk) { isAtRisk = atRisk; }
    public int getTimelineDays() { return timelineDays; }
    public void setTimelineDays(int timelineDays) { this.timelineDays = timelineDays; }
}
