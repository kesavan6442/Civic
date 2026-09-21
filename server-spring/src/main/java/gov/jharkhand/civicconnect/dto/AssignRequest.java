package gov.jharkhand.civicconnect.dto;

public class AssignRequest {
    private String universityId;
    private String solutionId;
    private String decisionNotes;

    public AssignRequest() {}

    public AssignRequest(String universityId, String solutionId, String decisionNotes) {
        this.universityId = universityId;
        this.solutionId = solutionId;
        this.decisionNotes = decisionNotes;
    }

    public String getUniversityId() { return universityId; }
    public void setUniversityId(String universityId) { this.universityId = universityId; }
    public String getSolutionId() { return solutionId; }
    public void setSolutionId(String solutionId) { this.solutionId = solutionId; }
    public String getDecisionNotes() { return decisionNotes; }
    public void setDecisionNotes(String decisionNotes) { this.decisionNotes = decisionNotes; }
}
