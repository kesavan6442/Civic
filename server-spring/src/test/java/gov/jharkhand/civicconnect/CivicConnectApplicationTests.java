package gov.jharkhand.civicconnect;

import gov.jharkhand.civicconnect.dto.AuthRequest;
import gov.jharkhand.civicconnect.dto.AuthResponse;
import gov.jharkhand.civicconnect.model.Assignment;
import gov.jharkhand.civicconnect.model.Problem;
import gov.jharkhand.civicconnect.service.AssignmentService;
import gov.jharkhand.civicconnect.service.AuthService;
import gov.jharkhand.civicconnect.service.ProblemService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CivicConnectApplicationTests {

    @Autowired
    private ProblemService problemService;

    @Autowired
    private AuthService authService;

    @Autowired
    private AssignmentService assignmentService;

    @Test
    void contextLoads() {
        assertNotNull(problemService, "ProblemService should be loaded");
    }

    @Test
    void testAuthAndJwtGeneration() {
        AuthRequest req = new AuthRequest("admin", "admin123", "admin");
        AuthResponse res = authService.login(req);

        assertNotNull(res, "Auth response should not be null");
        assertNotNull(res.getAccessToken(), "JWT Token should be generated");
        assertEquals("admin", res.getUser().getUsername());
    }

    @Test
    void testProblemCreationAndDomainRouting() {
        Problem newProb = new Problem();
        newProb.setTitle("Netarhat Solar Grid Optimization");
        newProb.setCategory("Renewable Energy & Solar Microgrids");
        newProb.setDomain("Renewable Energy & Solar Microgrids");
        newProb.setDistrict("Latehar");
        newProb.setCitizenName("Anita Oraon");
        newProb.setCitizenPhone("+91 98352 44109");

        Problem created = problemService.createProblem(newProb);
        assertNotNull(created.getId(), "Problem should receive an ID");
        assertEquals("Pending Admin Review", created.getStatus());

        List<Problem> energyProblems = problemService.getAllProblems(null, null, null, null, null, null, List.of("Renewable Energy"));
        assertTrue(energyProblems.stream().anyMatch(p -> p.getId().equals(created.getId())), "Domain matching should route to energy domain");
    }

    @Test
    void testAssignmentAnd90DaySla() {
        Assignment asgn = assignmentService.assignProblem(
                "JH-CHLG-2026-1002",
                "UNIV-BAU-08",
                "SOL-1002-BAU",
                "Approved for solar cold storage R&D deployment."
        );

        assertNotNull(asgn);
        assertEquals(3, asgn.getDeadlineMonths());
        assertEquals(90, asgn.getSlaTimelineDays());
        assertNotNull(asgn.getDeadlineInfo());
        assertEquals("On Track", asgn.getDeadlineInfo().getSlaStatus());
    }
}
