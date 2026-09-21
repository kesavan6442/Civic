package gov.jharkhand.civicconnect.controller;

import gov.jharkhand.civicconnect.dto.ApiResponse;
import gov.jharkhand.civicconnect.model.AiAnalysisResult;
import gov.jharkhand.civicconnect.model.Problem;
import gov.jharkhand.civicconnect.model.Solution;
import gov.jharkhand.civicconnect.security.SecurityUtils;
import gov.jharkhand.civicconnect.security.UserPrincipal;
import gov.jharkhand.civicconnect.service.AiService;
import gov.jharkhand.civicconnect.service.AuditLogService;
import gov.jharkhand.civicconnect.service.ProblemService;
import gov.jharkhand.civicconnect.service.SolutionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import gov.jharkhand.civicconnect.model.Role;

@RestController
@RequestMapping("/api/problems")
public class ProblemController {

    @Autowired
    private ProblemService problemService;

    @Autowired
    private SolutionService solutionService;

    @Autowired
    private AiService aiService;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Problem>>> getAllProblems(
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) List<String> domains,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String citizenEmail,
            @RequestParam(required = false) String citizenPhone
    ) {
        List<Problem> problems = problemService.getAllProblems(district, category, domain, q, status, universityId, domains, userId, citizenEmail, citizenPhone);
        ApiResponse<List<Problem>> response = ApiResponse.ok(problems);
        response.setCount(problems.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<Problem>>> getMyProblems(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String userId
    ) {
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        String effectiveUserId = principalOpt.map(UserPrincipal::getId).orElse(userId);
        String effectiveEmail = principalOpt.map(UserPrincipal::getEmail).orElse(email);

        if ((effectiveUserId == null || effectiveUserId.trim().isEmpty()) &&
            (effectiveEmail == null || effectiveEmail.trim().isEmpty()) &&
            (phone == null || phone.trim().isEmpty())) {
            return ResponseEntity.ok(ApiResponse.ok("No citizen session found", List.of()));
        }

        List<Problem> problems = problemService.getAllProblems(null, null, null, null, null, null, null, effectiveUserId, effectiveEmail, phone);
        ApiResponse<List<Problem>> response = ApiResponse.ok(problems);
        response.setCount(problems.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Problem>> getProblemById(@PathVariable String id) {
        Problem problem = problemService.getProblemById(id);
        if (problem == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Problem not found"));
        }

        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isPresent()) {
            UserPrincipal principal = principalOpt.get();
            Role role = principal.getRole();
            if (role == Role.UNIVERSITY) {
                String appStatus = problem.getApprovalStatus();
                if ("PENDING_ADMIN_REVIEW".equalsIgnoreCase(appStatus) || "REJECTED_BY_ADMIN".equalsIgnoreCase(appStatus)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Problem is not available for university access"));
                }
                if (problem.getMatchedUniversityIds() != null && !problem.getMatchedUniversityIds().isEmpty()) {
                    boolean matched = problem.getMatchedUniversityIds().contains(principal.getId()) ||
                            (principal.getUniversityName() != null && problem.getMatchedUniversityIds().contains(principal.getUniversityName())) ||
                            (principal.getOrganization() != null && problem.getMatchedUniversityIds().contains(principal.getOrganization()));
                    if (!matched) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Problem has not been matched to your institution"));
                    }
                }
            } else if (role == Role.INDUSTRY) {
                String appStatus = problem.getApprovalStatus();
                if ("PENDING_ADMIN_REVIEW".equalsIgnoreCase(appStatus) || "REJECTED_BY_ADMIN".equalsIgnoreCase(appStatus)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Problem is not available for industry access"));
                }
                if (problem.getMatchedIndustryIds() != null && !problem.getMatchedIndustryIds().isEmpty()) {
                    boolean matched = problem.getMatchedIndustryIds().contains(principal.getId()) ||
                            (principal.getCompanyName() != null && problem.getMatchedIndustryIds().contains(principal.getCompanyName())) ||
                            (principal.getOrganization() != null && problem.getMatchedIndustryIds().contains(principal.getOrganization()));
                    if (!matched) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Problem has not been matched to your industry organization"));
                    }
                }
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(problem));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Problem>> createProblem(@RequestBody Problem problem, HttpServletRequest httpRequest) {
        if (problem == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Request payload is empty"));
        }

        String title = problem.getTitle() != null ? problem.getTitle().trim() : "";
        if (title.length() < 5 || title.length() > 200) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Problem title must be between 5 and 200 characters"));
        }

        String description = problem.getDescription() != null ? problem.getDescription().trim() : "";
        if (description.length() < 10 || description.length() > 3000) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Problem description must be between 10 and 3000 characters"));
        }

        String district = problem.getDistrict() != null ? problem.getDistrict().trim() : "";
        if (district.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("District is required"));
        }

        // Always extract authenticated user identity from SecurityContext — never trust client-supplied userId/role
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isPresent()) {
            UserPrincipal principal = principalOpt.get();
            problem.setUserId(principal.getId());
            problem.setCitizenEmail(principal.getEmail());
            if (problem.getCitizenName() == null || problem.getCitizenName().trim().isEmpty()) {
                problem.setCitizenName(principal.getFullName() != null ? principal.getFullName() : principal.getUsername());
            }
        }

        Problem created = problemService.createProblem(problem);

        String clientIp = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditLogService.logSecurityEvent(AuditLogService.Action.PROBLEM_CREATED, created.getUserId(), created.getCitizenName(), created.getId(), clientIp, "Title=" + created.getTitle());

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Problem logged successfully", created));
    }

    @GetMapping("/{id}/solutions")
    public ResponseEntity<ApiResponse<List<Solution>>> getProblemSolutions(@PathVariable String id) {
        List<Solution> solutions = solutionService.getSolutionsByProblemId(id);
        ApiResponse<List<Solution>> response = ApiResponse.ok(solutions);
        response.setCount(solutions.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = {"/{id}/solutions", "/{id}/submit-idea"})
    public ResponseEntity<ApiResponse<Solution>> submitSolution(@PathVariable String id, @RequestBody Solution solution, HttpServletRequest httpRequest) {
        if (solution.getProblemId() == null || solution.getProblemId().trim().isEmpty()) {
            solution.setProblemId(id);
        }

        SecurityUtils.getCurrentUserPrincipal().ifPresent(principal -> {
            if (solution.getUserId() == null || solution.getUserId().trim().isEmpty()) {
                solution.setUserId(principal.getId());
            }
            if (solution.getUserEmail() == null || solution.getUserEmail().trim().isEmpty()) {
                solution.setUserEmail(principal.getEmail());
            }
        });

        Solution created = solutionService.submitSolution(solution);

        String clientIp = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        String submitter = created.getUniversityName() != null ? created.getUniversityName() : created.getCompanyName();
        auditLogService.logSecurityEvent(AuditLogService.Action.SOLUTION_SUBMITTED, created.getUserId(), submitter, created.getId(), clientIp, "ProblemId=" + id);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Solution submitted successfully", created));
    }

    @PostMapping("/submit-idea")
    public ResponseEntity<ApiResponse<Solution>> submitIdeaGeneral(@RequestBody Solution solution, HttpServletRequest httpRequest) {
        SecurityUtils.getCurrentUserPrincipal().ifPresent(principal -> {
            if (solution.getUserId() == null || solution.getUserId().trim().isEmpty()) {
                solution.setUserId(principal.getId());
            }
            if (solution.getUserEmail() == null || solution.getUserEmail().trim().isEmpty()) {
                solution.setUserEmail(principal.getEmail());
            }
        });

        Solution created = solutionService.submitSolution(solution);

        String clientIp = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        String submitter = created.getUniversityName() != null ? created.getUniversityName() : created.getCompanyName();
        auditLogService.logSecurityEvent(AuditLogService.Action.SOLUTION_SUBMITTED, created.getUserId(), submitter, created.getId(), clientIp, "General proposal");

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Solution submitted successfully", created));
    }

    @GetMapping("/{id}/ai-analysis")
    public ResponseEntity<ApiResponse<AiAnalysisResult>> getAiAnalysis(@PathVariable String id) {
        Problem problem = problemService.getProblemById(id);
        if (problem == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Problem not found"));
        }
        AiAnalysisResult analysis = aiService.analyzeProblem(problem);
        return ResponseEntity.ok(ApiResponse.ok(analysis));
    }

    @GetMapping("/{id}/recommend-universities")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRecommendedUniversities(@PathVariable String id) {
        Problem problem = problemService.getProblemById(id);
        if (problem == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Problem not found"));
        }
        List<Map<String, Object>> recommendations = aiService.recommendUniversities(problem);
        return ResponseEntity.ok(ApiResponse.ok(recommendations));
    }

    @PostMapping("/{id}/respond-info")
    public ResponseEntity<ApiResponse<Problem>> respondToInformationRequest(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload,
            HttpServletRequest httpRequest
    ) {
        Problem problem = problemService.getProblemById(id);
        if (problem == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Problem not found"));
        }

        String additionalInfo = (String) payload.get("additionalInformation");
        String additionalEvidenceUrl = (String) payload.get("mediaUrl");
        if (additionalInfo != null && !additionalInfo.trim().isEmpty()) {
            problem.setDescription(problem.getDescription() + "\n\n[Citizen Clarification Submitted " + java.time.Instant.now() + "]:\n" + additionalInfo.trim());
        }
        if (additionalEvidenceUrl != null && !additionalEvidenceUrl.trim().isEmpty()) {
            problem.setMediaUrl(additionalEvidenceUrl);
        }

        // Return status to PENDING_ADMIN_REVIEW for Admin Gate 1 re-review
        problem.setStatus("PENDING_ADMIN_REVIEW");
        problem.setApprovalStatus("PENDING_ADMIN_REVIEW");
        problem.setAdminReviewNotes("Citizen submitted requested clarification. Queued for Admin Gate 1 review.");

        Problem updated = problemService.updateProblem(problem);

        String clientIp = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditLogService.logSecurityEvent(AuditLogService.Action.PROBLEM_UPDATED, problem.getUserId(), problem.getCitizenName(), problem.getId(), clientIp, "Citizen responded to MORE_INFO_REQUESTED");

        return ResponseEntity.ok(ApiResponse.ok("Clarification submitted successfully. Queued for Admin Gate 1 review.", updated));
    }
}
