package gov.jharkhand.civicconnect;

import gov.jharkhand.civicconnect.controller.AdminController;
import gov.jharkhand.civicconnect.dto.ApiResponse;
import gov.jharkhand.civicconnect.model.*;
import gov.jharkhand.civicconnect.repository.*;
import gov.jharkhand.civicconnect.service.ProblemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AdminWorkflowIntegrationTests {

    @Autowired
    private AdminController adminController;

    @Autowired
    private ProblemService problemService;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private SolutionRepository solutionRepository;

    @Autowired
    private CollaborationRepository collaborationRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @BeforeEach
    void setUpSecurityContext() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin@jharkhand.gov.in",
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("1. Workflow Gate: Citizen Problem begins in Pending Review")
    void testCitizenProblemCreationPendingReview() {
        Problem problem = new Problem();
        problem.setTitle("Rural Drinking Water Filtration Failure");
        problem.setDescription("Severe siltation and fluoride contamination in block deep borewells.");
        problem.setCategory("Water Management & Drainage");
        problem.setDomain("Water Management & Drainage");
        problem.setDistrict("Ranchi");
        problem.setCitizenName("Ramesh Soren");
        problem.setCitizenPhone("+91 94311 00211");

        Problem saved = problemService.createProblem(problem);
        assertNotNull(saved.getId());
        assertEquals("Pending Admin Review", saved.getStatus());

        ResponseEntity<ApiResponse<List<Problem>>> pendingRes = adminController.getProblemsPendingReview();
        assertTrue(pendingRes.getBody().getData().stream().anyMatch(p -> p.getId().equals(saved.getId())));
    }

    @Test
    @DisplayName("2. Admin Review Gate: Approve Problem and trigger capability-based matching")
    void testAdminApproveProblemAndCapabilityMatching() {
        Problem problem = new Problem();
        problem.setTitle("Solar Powered IoT Water Pumping Units");
        problem.setDescription("Design and installation of smart telemetry for community solar pumps.");
        problem.setCategory("Renewable Energy & Solar Microgrids");
        problem.setDomain("Renewable Energy & Solar Microgrids");
        problem.setDistrict("Latehar");
        problem.setCitizenName("Bimal Minz");
        Problem saved = problemService.createProblem(problem);

        ResponseEntity<ApiResponse<Map<String, Object>>> approveRes = adminController.approveProblemForMatching(
                saved.getId(),
                Map.of("adminNotes", "Verified on-site necessity; approved for Top 5 capability matching.")
        );

        assertEquals(200, approveRes.getStatusCode().value());
        Map<String, Object> data = approveRes.getBody().getData();
        assertNotNull(data);

        Problem approvedProb = (Problem) data.get("problem");
        assertEquals("APPROVED_FOR_MATCHING", approvedProb.getApprovalStatus());
        assertEquals("COMPLETED", approvedProb.getMatchingStatus());
        assertNotNull(approvedProb.getMatchedUniversityIds());
        assertFalse(approvedProb.getMatchedUniversityIds().isEmpty(), "Should match at least one capable university");

        Map<String, Object> explanations = approvedProb.getMatchingExplanations();
        assertNotNull(explanations);
        assertTrue(explanations.containsKey("matchedUniversities"));
        assertTrue(explanations.containsKey("matchedIndustries"));

        List<AuditLog> audits = auditLogRepository.findByEntityId(saved.getId());
        assertTrue(audits.stream().anyMatch(a -> "PROBLEM_APPROVED_FOR_MATCHING".equals(a.getEventType())));
    }

    @Test
    @DisplayName("3. Admin Review Gate: Rejection with Mandatory Reason")
    void testAdminRejectProblem() {
        Problem problem = new Problem();
        problem.setTitle("Commercial Advertising Billboard Grievance");
        problem.setDescription("Private shop sign board placed on private wall.");
        problem.setCategory("General Municipal Issues");
        Problem saved = problemService.createProblem(problem);

        ResponseEntity<ApiResponse<Problem>> rejectRes = adminController.rejectProblem(
                saved.getId(),
                Map.of("rejectionReason", "Out of civic engineering mandate; private matter.")
        );

        assertEquals(200, rejectRes.getStatusCode().value());
        Problem rejected = rejectRes.getBody().getData();
        assertEquals("REJECTED_BY_ADMIN", rejected.getApprovalStatus());
        assertEquals("REJECTED", rejected.getStatus());
        assertEquals("Out of civic engineering mandate; private matter.", rejected.getAdminRejectionReason());
    }

    @Test
    @DisplayName("4. Collaboration Synthesis, Duplicate Prevention & Explicit Admin Decision Activation")
    void testProposalAnalysisAndAdminCollaborationApproval() {
        Problem prob = new Problem();
        prob.setTitle("Fluoride Water Testing and Filtration Pilot");
        prob.setDescription("Automated chemical testing and filtration membrane plant.");
        prob.setDomain("Water Management & Drainage");
        prob.setDistrict("Dhanbad");
        Problem savedProb = problemService.createProblem(prob);

        ResponseEntity<ApiResponse<Map<String, Object>>> approveRes = adminController.approveProblemForMatching(savedProb.getId(), Map.of());
        Problem approvedProb = (Problem) approveRes.getBody().getData().get("problem");

        String matchedUniId = approvedProb.getMatchedUniversityIds() != null && !approvedProb.getMatchedUniversityIds().isEmpty()
                ? approvedProb.getMatchedUniversityIds().get(0)
                : "UNIV-CUJ-01";
        String matchedIndId = approvedProb.getMatchedIndustryIds() != null && !approvedProb.getMatchedIndustryIds().isEmpty()
                ? approvedProb.getMatchedIndustryIds().get(0)
                : "IND-TATA-01";

        Solution univSol = new Solution();
        univSol.setProblemId(savedProb.getId());
        univSol.setUniversityId(matchedUniId);
        univSol.setUniversityName("Central University of Jharkhand");
        univSol.setDepartment("Centre for Water Engineering & Environmental Sciences");
        univSol.setSolutionTitle("Advanced Alumina Adsorption Filtration");
        univSol.setTechnicalApproach("Laboratory verified activated alumina column with IoT telemetry sensor.");
        univSol.setEstimatedCost("₹ 6.5 Lakhs");
        univSol.setEstimatedTimeWeeks(8);
        univSol.setSubmitterType("university");
        Solution savedUnivSol = solutionRepository.save(univSol);

        Collaboration indCollab = new Collaboration();
        indCollab.setProblemId(savedProb.getId());
        indCollab.setIndustryId(matchedIndId);
        indCollab.setCompanyName("Tata Steel Limited (CSR Division)");
        indCollab.setFundingAmount("₹ 10.0 Lakhs");
        indCollab.setEquipmentSupport("Heavy dewatering and column fabrication tooling");
        indCollab.setCsrCommitmentDetails("100% equipment & fabrication funding sanctioned.");
        Collaboration savedIndCollab = collaborationRepository.save(indCollab);

        ResponseEntity<ApiResponse<Map<String, Object>>> analysisRes = adminController.analyzeCollaborationProposals(savedProb.getId());
        assertNotNull(analysisRes.getBody().getData());

        ResponseEntity<ApiResponse<Map<String, Object>>> decisionRes = adminController.approveCollaborationSelection(
                savedProb.getId(),
                Map.of(
                        "universityProposalId", savedUnivSol.getId(),
                        "industryProposalId", savedIndCollab.getId(),
                        "universityId", matchedUniId,
                        "industryId", matchedIndId,
                        "decisionNotes", "Approved top synergy pair with 8-week execution timeline."
                )
        );

        assertEquals(200, decisionRes.getStatusCode().value());
        Map<String, Object> respData = decisionRes.getBody().getData();
        Collaboration activatedCollab = (Collaboration) respData.get("collaboration");
        Project initializedProject = (Project) respData.get("project");

        assertTrue(activatedCollab.getSelectedByAdmin());
        assertEquals("Active Collaboration", activatedCollab.getStatus());
        assertEquals("IN_PROGRESS", initializedProject.getStatus());
        assertEquals("IN_PROGRESS", ((Problem) respData.get("problem")).getStatus());

        List<AuditLog> audits = auditLogRepository.findByEntityId(activatedCollab.getId());
        assertTrue(audits.stream().anyMatch(a -> "COLLABORATION_APPROVED".equals(a.getEventType())));

        // Test Duplicate Active Project Prevention
        ResponseEntity<ApiResponse<Map<String, Object>>> duplicateAttempt = adminController.approveCollaborationSelection(
                savedProb.getId(),
                Map.of("universityProposalId", savedUnivSol.getId(), "industryProposalId", savedIndCollab.getId())
        );
        assertEquals(400, duplicateAttempt.getStatusCode().value());
    }
}
