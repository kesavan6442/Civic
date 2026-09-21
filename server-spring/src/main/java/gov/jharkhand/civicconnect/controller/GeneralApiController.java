package gov.jharkhand.civicconnect.controller;

import gov.jharkhand.civicconnect.dto.ApiResponse;
import gov.jharkhand.civicconnect.model.*;
import gov.jharkhand.civicconnect.security.SecurityUtils;
import gov.jharkhand.civicconnect.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class GeneralApiController {

    @Autowired
    private AssignmentService assignmentService;

    @Autowired
    private SolutionService solutionService;

    @Autowired
    private IndustryService industryService;

    @Autowired
    private UniversityService universityService;

    @GetMapping("/teams")
    public ResponseEntity<ApiResponse<List<Assignment>>> getTeams(
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String universityName
    ) {
        String authUserId = SecurityUtils.getCurrentUserId();
        String effectiveUserId = authUserId != null ? authUserId : userId;
        List<Assignment> list = assignmentService.getAllAssignments();
        if (universityId != null && !universityId.trim().isEmpty()) {
            list = list.stream().filter(a -> universityId.equalsIgnoreCase(a.getUniversityId())).toList();
        } else if (effectiveUserId != null && !effectiveUserId.trim().isEmpty()) {
            list = list.stream().filter(a -> effectiveUserId.equals(a.getUserId())).toList();
        } else if (universityName != null && !universityName.trim().isEmpty()) {
            list = list.stream().filter(a -> universityName.equalsIgnoreCase(a.getUniversityName())).toList();
        }
        ApiResponse<List<Assignment>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/teams")
    public ResponseEntity<ApiResponse<Assignment>> createTeam(@RequestBody Assignment assignment) {
        if (assignment.getId() == null || assignment.getId().trim().isEmpty()) {
            assignment.setId("TEAM-" + System.currentTimeMillis());
        }
        SecurityUtils.getCurrentUserPrincipal().ifPresent(principal -> {
            if (assignment.getUserId() == null || assignment.getUserId().trim().isEmpty()) {
                assignment.setUserId(principal.getId());
            }
            if (assignment.getUserEmail() == null || assignment.getUserEmail().trim().isEmpty()) {
                assignment.setUserEmail(principal.getEmail());
            }
        });
        Assignment created = assignmentService.assignProblem(
                assignment.getProblemId(),
                assignment.getUniversityId() != null ? assignment.getUniversityId() : "UNIV-AUTO",
                assignment.getSolutionId() != null ? assignment.getSolutionId() : "SOL-AUTO",
                assignment.getDecisionNotes() != null ? assignment.getDecisionNotes() : "Adopted by University Innovation Team"
        );
        if (assignment.getUserId() != null) created.setUserId(assignment.getUserId());
        if (assignment.getUserEmail() != null) created.setUserEmail(assignment.getUserEmail());
        if (assignment.getUniversityName() != null) created.setUniversityName(assignment.getUniversityName());
        return ResponseEntity.ok(ApiResponse.ok("Team registered successfully", created));
    }

    @GetMapping("/industry/teams")
    public ResponseEntity<ApiResponse<List<Assignment>>> getIndustryTeams(
            @RequestParam(required = false) String industryId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String companyName
    ) {
        String authUserId = SecurityUtils.getCurrentUserId();
        String effectiveUserId = authUserId != null ? authUserId : userId;
        List<Assignment> list = assignmentService.getAllAssignments();
        if (industryId != null && !industryId.trim().isEmpty()) {
            list = list.stream().filter(a -> industryId.equalsIgnoreCase(a.getUniversityId())).toList();
        } else if (effectiveUserId != null && !effectiveUserId.trim().isEmpty()) {
            list = list.stream().filter(a -> effectiveUserId.equals(a.getUserId())).toList();
        }
        ApiResponse<List<Assignment>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/funding-approvals")
    public ResponseEntity<ApiResponse<List<Collaboration>>> getFundingApprovals(
            @RequestParam(required = false) String industryId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String companyName
    ) {
        String authUserId = SecurityUtils.getCurrentUserId();
        String effectiveUserId = authUserId != null ? authUserId : userId;
        List<Collaboration> list = industryService.getAllCollaborations();
        if (industryId != null && !industryId.trim().isEmpty()) {
            list = list.stream().filter(c -> industryId.equalsIgnoreCase(c.getIndustryId())).toList();
        } else if (effectiveUserId != null && !effectiveUserId.trim().isEmpty()) {
            list = list.stream().filter(c -> effectiveUserId.equals(c.getUserId())).toList();
        } else if (companyName != null && !companyName.trim().isEmpty()) {
            list = list.stream().filter(c -> companyName.equalsIgnoreCase(c.getCompanyName())).toList();
        }
        ApiResponse<List<Collaboration>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/proposals")
    public ResponseEntity<ApiResponse<List<Solution>>> getProposals(
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String universityName,
            @RequestParam(required = false) String problemId
    ) {
        String authUserId = SecurityUtils.getCurrentUserId();
        String effectiveUserId = authUserId != null ? authUserId : userId;
        List<Solution> list = solutionService.getAllSolutions();
        if (problemId != null && !problemId.trim().isEmpty()) {
            list = list.stream().filter(s -> problemId.equalsIgnoreCase(s.getProblemId())).toList();
        }
        if (universityId != null && !universityId.trim().isEmpty()) {
            list = list.stream().filter(s -> universityId.equalsIgnoreCase(s.getUniversityId())).toList();
        } else if (effectiveUserId != null && !effectiveUserId.trim().isEmpty()) {
            list = list.stream().filter(s -> effectiveUserId.equals(s.getUserId())).toList();
        } else if (universityName != null && !universityName.trim().isEmpty()) {
            list = list.stream().filter(s -> universityName.equalsIgnoreCase(s.getUniversityName())).toList();
        }
        ApiResponse<List<Solution>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/solutions/mine")
    public ResponseEntity<ApiResponse<List<Solution>>> getMySolutions() {
        List<Solution> list = solutionService.getMySolutions();
        ApiResponse<List<Solution>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/solutions/{id}")
    public ResponseEntity<ApiResponse<Solution>> getSolutionById(@PathVariable String id) {
        Solution sol = solutionService.getSolutionById(id);
        if (sol == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(ApiResponse.error("Solution not found"));
        }
        return ResponseEntity.ok(ApiResponse.ok(sol));
    }

    @GetMapping("/solutions/problem/{problemId}")
    public ResponseEntity<ApiResponse<List<Solution>>> getSolutionsByProblemId(@PathVariable String problemId) {
        List<Solution> list = solutionService.getSolutionsByProblemId(problemId);
        ApiResponse<List<Solution>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = {"/proposals", "/solutions"})
    public ResponseEntity<ApiResponse<Solution>> submitSolution(@RequestBody Solution solution) {
        Solution created = solutionService.submitSolution(solution.getProblemId(), solution);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(ApiResponse.ok("Proposal submitted successfully", created));
    }

    @GetMapping("/solutions")
    public ResponseEntity<ApiResponse<List<Solution>>> getSolutions(
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String universityName,
            @RequestParam(required = false) String companyName
    ) {
        String authUserId = SecurityUtils.getCurrentUserId();
        String effectiveUserId = authUserId != null ? authUserId : userId;
        List<Solution> list = solutionService.getAllSolutions();
        if (universityId != null && !universityId.trim().isEmpty()) {
            list = list.stream().filter(s -> universityId.equalsIgnoreCase(s.getUniversityId())).toList();
        } else if (effectiveUserId != null && !effectiveUserId.trim().isEmpty()) {
            list = list.stream().filter(s -> effectiveUserId.equals(s.getUserId())).toList();
        } else if (universityName != null && !universityName.trim().isEmpty()) {
            list = list.stream().filter(s -> universityName.equalsIgnoreCase(s.getUniversityName())).toList();
        } else if (companyName != null && !companyName.trim().isEmpty()) {
            list = list.stream().filter(s -> companyName.equalsIgnoreCase(s.getCompanyName())).toList();
        }
        ApiResponse<List<Solution>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/collaborations")
    public ResponseEntity<ApiResponse<List<Collaboration>>> getCollaborations(
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) String industryId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String companyName,
            @RequestParam(required = false) String universityName
    ) {
        String authUserId = SecurityUtils.getCurrentUserId();
        String effectiveUserId = authUserId != null ? authUserId : userId;
        List<Collaboration> list = industryService.getAllCollaborations();
        if (universityId != null && !universityId.trim().isEmpty()) {
            list = list.stream().filter(c -> universityId.equalsIgnoreCase(c.getUniversityId())).toList();
        } else if (industryId != null && !industryId.trim().isEmpty()) {
            list = list.stream().filter(c -> industryId.equalsIgnoreCase(c.getIndustryId())).toList();
        } else if (effectiveUserId != null && !effectiveUserId.trim().isEmpty()) {
            list = list.stream().filter(c -> effectiveUserId.equals(c.getUserId())).toList();
        } else if (companyName != null && !companyName.trim().isEmpty()) {
            list = list.stream().filter(c -> companyName.equalsIgnoreCase(c.getCompanyName())).toList();
        } else if (universityName != null && !universityName.trim().isEmpty()) {
            list = list.stream().filter(c -> universityName.equalsIgnoreCase(c.getUniversityName())).toList();
        }
        ApiResponse<List<Collaboration>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMetrics(
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String universityName
    ) {
        String authUserId = SecurityUtils.getCurrentUserId();
        String effectiveUserId = authUserId != null ? authUserId : userId;
        Map<String, Object> metrics = universityService.getMetrics(universityId, effectiveUserId, universityName);
        return ResponseEntity.ok(ApiResponse.ok(metrics));
    }
}
