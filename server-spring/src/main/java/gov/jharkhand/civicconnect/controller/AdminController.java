package gov.jharkhand.civicconnect.controller;

import gov.jharkhand.civicconnect.dto.ApiResponse;
import gov.jharkhand.civicconnect.dto.AssignRequest;
import gov.jharkhand.civicconnect.model.*;
import gov.jharkhand.civicconnect.repository.*;
import gov.jharkhand.civicconnect.service.AiService;
import gov.jharkhand.civicconnect.service.AssignmentService;
import gov.jharkhand.civicconnect.service.IndustryService;
import gov.jharkhand.civicconnect.service.ProblemService;
import gov.jharkhand.civicconnect.service.SolutionService;
import gov.jharkhand.civicconnect.service.UniversityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private IndustryRepository industryRepository;

    @Autowired
    private SolutionRepository solutionRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private CollaborationRepository collaborationRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AIAnalysisRepository aiAnalysisRepository;

    @Autowired
    private ProblemService problemService;

    @Autowired
    private AssignmentService assignmentService;

    @Autowired
    private IndustryService industryService;

    @Autowired
    private UniversityService universityService;

    @Autowired
    private SolutionService solutionService;

    @Autowired
    private AiService aiService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminDashboardStats() {
        List<Problem> allProblems = problemRepository.findAll();
        long totalProblems = allProblems.size();
        long underAIReview = allProblems.stream().filter(p -> p.getStatus() != null && (p.getStatus().equalsIgnoreCase("Pending Admin Review") || p.getStatus().equalsIgnoreCase("Under AI Analysis"))).count();
        long broadcasted = allProblems.stream().filter(p -> p.getStatus() != null && (p.getStatus().toLowerCase().contains("broadcast"))).count();
        long assigned = allProblems.stream().filter(p -> p.getStatus() != null && (p.getStatus().equalsIgnoreCase("Assigned") || p.getAssignedTo() != null)).count();
        long inProgress = allProblems.stream().filter(p -> p.getStatus() != null && (p.getStatus().equalsIgnoreCase("Currently Working") || p.getStatus().equalsIgnoreCase("In Progress"))).count();
        long resolved = allProblems.stream().filter(p -> p.getStatus() != null && p.getStatus().equalsIgnoreCase("Resolved")).count();
        long criticalCount = allProblems.stream().filter(p -> "Critical".equalsIgnoreCase(p.getUrgency()) || "Critical".equalsIgnoreCase(p.getPriority())).count();

        long solutionsCount = solutionRepository.count();
        long assignmentsCount = assignmentRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProblems", totalProblems);
        stats.put("underAIReview", underAIReview);
        stats.put("broadcasted", broadcasted);
        stats.put("solutionsSubmitted", solutionsCount);
        stats.put("assigned", assigned > 0 ? assigned : assignmentsCount);
        stats.put("inProgress", inProgress);
        stats.put("resolved", resolved);
        stats.put("totalUniversities", universityRepository.count());
        stats.put("totalIndustries", industryRepository.count());
        stats.put("totalAssignments", assignmentsCount);
        stats.put("avgResolutionDays", resolved > 0 ? 18 : 0);
        stats.put("criticalUrgencyCount", criticalCount);

        return ResponseEntity.ok(ApiResponse.ok("Live Dashboard Statistics", stats));
    }

    @GetMapping("/problems")
    public ResponseEntity<ApiResponse<List<Problem>>> getAdminProblems(
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status
    ) {
        List<Problem> list = problemService.getAllProblems(district, category, domain, q, status, null, null);
        ApiResponse<List<Problem>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/universities")
    public ResponseEntity<ApiResponse<List<University>>> getUniversities() {
        List<University> list = universityRepository.findAll();
        ApiResponse<List<University>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/industries")
    public ResponseEntity<ApiResponse<List<IndustryPartner>>> getIndustries() {
        List<IndustryPartner> list = industryRepository.findAll();
        ApiResponse<List<IndustryPartner>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = {"/solutions", "/solutions/{problemId}"})
    public ResponseEntity<ApiResponse<List<Solution>>> getSolutions(
            @PathVariable(required = false) String problemId,
            @RequestParam(required = false) String problemIdQuery
    ) {
        String targetId = problemId != null ? problemId : problemIdQuery;
        List<Solution> list = (targetId != null && !targetId.trim().isEmpty()) 
                ? solutionRepository.findByProblemId(targetId) 
                : solutionRepository.findAll();
        ApiResponse<List<Solution>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = {"/problems/{id}/verify", "/problems/{id}/admin-verify"})
    public ResponseEntity<ApiResponse<Problem>> verifyProblem(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem != null) {
            String newStatus = payload != null && payload.containsKey("status") ? (String) payload.get("status") : "AI Verified";
            problem.setStatus(newStatus);
            if (payload != null && payload.containsKey("adminNotes")) {
                problem.setAiReason((String) payload.get("adminNotes"));
            }
            Problem saved = problemRepository.save(problem);
            return ResponseEntity.ok(ApiResponse.ok("Problem verified successfully", saved));
        }
        return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(ApiResponse.error("Problem not found"));
    }

    @PostMapping(value = {"/proposals/{id}/approve", "/assign-solution"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveProposal(
            @PathVariable(required = false) String id,
            @RequestBody Map<String, Object> payload
    ) {
        String solId = id != null ? id : (String) payload.get("solutionId");
        if (solId != null) {
            Solution sol = solutionRepository.findById(solId).orElse(null);
            if (sol != null) {
                if ("Assigned".equalsIgnoreCase(sol.getStatus()) || "Approved".equalsIgnoreCase(sol.getStatus())) {
                    return ResponseEntity.badRequest().body(ApiResponse.error("Proposal has already been approved/assigned (Status: " + sol.getStatus() + "). Duplicate action blocked."));
                }
                sol.setStatus("Assigned");
                sol.setAssignedDate(java.time.LocalDate.now().toString());
                sol.setAssignedBy((String) payload.getOrDefault("assignedBy", "State Administration"));
                solutionRepository.save(sol);

                if (sol.getProblemId() != null) {
                    Problem prob = problemRepository.findById(sol.getProblemId()).orElse(null);
                    if (prob != null) {
                        prob.setStatus("Assigned");
                        java.util.Map<String, Object> assigned = new java.util.HashMap<>();
                        assigned.put("name", sol.getUniversityName() != null ? sol.getUniversityName() : sol.getCompanyName());
                        assigned.put("type", sol.getSubmitterType());
                        assigned.put("solutionId", sol.getId());
                        prob.setAssignedTo(assigned);
                        problemRepository.save(prob);
                    }
                }
            }
        }
        return ResponseEntity.ok(ApiResponse.ok("Proposal approved and assigned", payload));
    }

    @PostMapping("/proposals/{id}/modify")
    public ResponseEntity<ApiResponse<Solution>> requestProposalModification(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload
    ) {
        Solution sol = solutionRepository.findById(id).orElse(null);
        if (sol != null) {
            if ("Assigned".equalsIgnoreCase(sol.getStatus()) || "Rejected".equalsIgnoreCase(sol.getStatus())) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Cannot request modification for proposal in status: " + sol.getStatus()));
            }
            sol.setStatus("Modification Requested");
            sol.setAdminFeedback((String) payload.get("adminFeedback"));
            solutionRepository.save(sol);
            return ResponseEntity.ok(ApiResponse.ok("Modification requested from submitter", sol));
        }
        return ResponseEntity.ok(ApiResponse.ok("Modification requested", null));
    }

    @PostMapping("/proposals/{id}/reject")
    public ResponseEntity<ApiResponse<Solution>> rejectProposal(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload
    ) {
        Solution sol = solutionRepository.findById(id).orElse(null);
        if (sol != null) {
            if ("Rejected".equalsIgnoreCase(sol.getStatus())) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Proposal is already rejected."));
            }
            sol.setStatus("Rejected");
            sol.setRejectionReason((String) payload.get("rejectionReason"));
            solutionRepository.save(sol);
            return ResponseEntity.ok(ApiResponse.ok("Proposal rejected", sol));
        }
        return ResponseEntity.ok(ApiResponse.ok("Proposal rejected", null));
    }

    @PostMapping("/combine-collaboration")
    public ResponseEntity<ApiResponse<Collaboration>> combineCollaboration(@RequestBody Map<String, Object> payload) {
        Collaboration collab = new Collaboration();
        collab.setId("COLLAB-" + System.currentTimeMillis());
        collab.setProblemId((String) payload.get("problemId"));
        collab.setProblemTitle((String) payload.get("problemTitle"));
        collab.setDomain((String) payload.get("domain"));
        collab.setCategory((String) payload.get("category"));
        collab.setUniversityId((String) payload.get("universityId"));
        collab.setUniversityName((String) payload.get("universityName"));
        
        String indId = (String) payload.get("industryId");
        if (indId == null) indId = (String) payload.get("companyId");
        collab.setIndustryId(indId);

        String compName = (String) payload.get("companyName");
        if (compName == null) compName = (String) payload.get("industryName");
        collab.setCompanyName(compName);

        collab.setFundingAmount("CSR Co-Funding Sanctioned");
        collab.setStatus("Active Collaboration");
        collab.setSolutionStatus("In Progress");
        collab.setCollaboratedDate(java.time.LocalDate.now().toString());

        Collaboration saved = collaborationRepository.save(collab);

        if (collab.getProblemId() != null) {
            Problem p = problemRepository.findById(collab.getProblemId()).orElse(null);
            if (p != null) {
                p.setStatus("Currently Working");
                p.setApprovalStatus("COLLABORATION_APPROVED");
                p.setAdoptedByUniversity(collab.getUniversityName());
                p.setAdoptedByIndustry(collab.getCompanyName());
                Map<String, Object> assigned = new HashMap<>();
                assigned.put("universityId", collab.getUniversityId());
                assigned.put("universityName", collab.getUniversityName());
                assigned.put("industryId", collab.getIndustryId());
                assigned.put("companyName", collab.getCompanyName());
                assigned.put("assignedDate", java.time.LocalDate.now().toString());
                p.setAssignedTo(assigned);
                problemRepository.save(p);
            }
        }

        return ResponseEntity.ok(ApiResponse.ok("University and Industry successfully combined", saved));
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications() {
        List<Notification> list = notificationRepository.findAll();
        ApiResponse<List<Notification>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ai-analysis")
    public ResponseEntity<ApiResponse<List<AIAnalysis>>> getAiAnalyses() {
        List<AIAnalysis> list = aiAnalysisRepository.findAll();
        ApiResponse<List<AIAnalysis>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/problems/priority-queue")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPriorityQueue() {
        List<Problem> list = problemService.getAllProblems(null, null, null, null, null, null, null);
        List<Map<String, Object>> queue = aiService.getPriorityQueue(list);
        return ResponseEntity.ok(ApiResponse.ok("AI Recommended Priority Queue", queue));
    }

    @PostMapping("/problems/{id}/merge")
    public ResponseEntity<ApiResponse<Problem>> mergeProblems(
            @PathVariable String id,
            @RequestBody Map<String, String> payload
    ) {
        String duplicateId = payload.get("duplicateId");
        Problem merged = problemService.mergeProblems(id, duplicateId);
        return ResponseEntity.ok(ApiResponse.ok("Problem merged into master civic problem", merged));
    }

    @PostMapping("/problems/{id}/override")
    public ResponseEntity<ApiResponse<Problem>> overrideProblem(
            @PathVariable String id,
            @RequestBody Map<String, Object> overrideData
    ) {
        Problem updated = problemService.overrideProblem(id, overrideData);
        return ResponseEntity.ok(ApiResponse.ok("Problem classification/priority successfully overridden by Admin", updated));
    }

    @GetMapping("/problems/{id}/pair-partners")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> pairPartners(@PathVariable String id) {
        Problem problem = problemService.getProblemById(id);
        List<Map<String, Object>> pairings = aiService.pairPartners(problem);
        return ResponseEntity.ok(ApiResponse.ok("AI University + Industry Complementary Pairings", pairings));
    }

    @PostMapping("/solutions/combine")
    public ResponseEntity<ApiResponse<Map<String, Object>>> combineSolutions(@RequestBody Map<String, Object> payload) {
        Map<String, Object> sol1 = (Map<String, Object>) payload.get("solution1");
        Map<String, Object> sol2 = (Map<String, Object>) payload.get("solution2");
        Problem prob = problemService.getProblemById((String) payload.get("problemId"));
        Map<String, Object> combined = aiService.combineSolutions(sol1, sol2, prob);
        return ResponseEntity.ok(ApiResponse.ok("Combined University-Industry Hybrid Proposal generated", combined));
    }

    @GetMapping("/projects/{id}/ai-sla-monitor")
    public ResponseEntity<ApiResponse<Map<String, Object>>> monitorProjectSla(@PathVariable String id) {
        Assignment asgn = assignmentService.getAssignmentById(id);
        Map<String, Object> asgnMap = asgn != null ? Map.of("id", asgn.getId(), "daysElapsed", 24, "milestones", asgn.getMilestones() != null ? asgn.getMilestones() : List.of()) : Map.of();
        Map<String, Object> result = aiService.monitorProjectSla(asgnMap);
        return ResponseEntity.ok(ApiResponse.ok("AI Continuous SLA Risk Monitor", result));
    }

    @PostMapping("/projects/{id}/ai-resolution-audit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> auditResolution(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload
    ) {
        Map<String, Object> result = aiService.auditResolution(payload);
        return ResponseEntity.ok(ApiResponse.ok("AI Resolution Support Audit", result));
    }

    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse<Map<String, Object>>> logFeedback(@RequestBody Map<String, Object> payload) {
        Map<String, Object> result = aiService.logFeedback(payload);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/problems/{id}/proceed")
    public ResponseEntity<ApiResponse<Problem>> proceedProblem(@PathVariable String id) {
        Problem updated = problemService.updateProblemStatus(id, "Broadcasted to Universities");
        return ResponseEntity.ok(ApiResponse.ok("Challenge broadcasted to universities across Jharkhand", updated));
    }

    @PostMapping("/problems/{id}/assign")
    public ResponseEntity<ApiResponse<Assignment>> assignProblem(
            @PathVariable String id,
            @RequestBody AssignRequest request
    ) {
        Assignment assignment = assignmentService.assignProblem(
                id,
                request.getUniversityId(),
                request.getSolutionId(),
                request.getDecisionNotes()
        );
        return ResponseEntity.ok(ApiResponse.ok("Problem assigned to university with 90-day SLA", assignment));
    }

    @PostMapping("/problems/{id}/reopen")
    public ResponseEntity<ApiResponse<Problem>> reopenProblem(@PathVariable String id) {
        Problem reopened = problemService.reopenProblem(id);
        return ResponseEntity.ok(ApiResponse.ok("Problem reopened and rebroadcasted", reopened));
    }

    @GetMapping("/assignments")
    public ResponseEntity<ApiResponse<List<Assignment>>> getAssignments() {
        List<Assignment> list = assignmentService.getAllAssignments();
        ApiResponse<List<Assignment>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = {"/industry-collaborations", "/collaborations"})
    public ResponseEntity<ApiResponse<List<Collaboration>>> getIndustryCollaborations() {
        List<Collaboration> list = industryService.getAllCollaborations();
        ApiResponse<List<Collaboration>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/collaborations/{id}")
    public ResponseEntity<ApiResponse<Collaboration>> getAdminCollaborationById(@PathVariable String id) {
        Collaboration collab = industryService.getCollaborationById(id);
        if (collab == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(ApiResponse.error("Collaboration not found: " + id));
        }
        return ResponseEntity.ok(ApiResponse.ok(collab));
    }

    @PostMapping("/collaborations/{id}/approve")
    public ResponseEntity<ApiResponse<Collaboration>> approveAdminCollaboration(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        String adminNotes = payload != null ? (String) payload.get("adminNotes") : "Approved by State Nodal Administrator";
        Collaboration approved = industryService.approveCollaboration(id, adminNotes);
        return ResponseEntity.ok(ApiResponse.ok("Collaboration successfully approved. Hybrid project activated.", approved));
    }

    @PostMapping("/collaborations/{id}/reject")
    public ResponseEntity<ApiResponse<Collaboration>> rejectAdminCollaboration(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        String reason = payload != null ? (String) payload.get("rejectionReason") : "CSR commitment rejected by administration";
        Collaboration rejected = industryService.rejectCollaboration(id, reason);
        return ResponseEntity.ok(ApiResponse.ok("Collaboration proposal rejected", rejected));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics() {
        List<Problem> problems = problemRepository.findAll();
        List<Collaboration> collabs = collaborationRepository.findAll();
        List<Assignment> assignments = assignmentService.getAllAssignments();

        Map<String, Long> districtDistribution = problems.stream()
                .filter(p -> p.getDistrict() != null)
                .collect(Collectors.groupingBy(Problem::getDistrict, Collectors.counting()));

        Map<String, Long> categoryDistribution = problems.stream()
                .filter(p -> p.getCategory() != null)
                .collect(Collectors.groupingBy(Problem::getCategory, Collectors.counting()));

        Map<String, Long> statusDistribution = problems.stream()
                .filter(p -> p.getStatus() != null)
                .collect(Collectors.groupingBy(Problem::getStatus, Collectors.counting()));

        long inProgressCount = problems.stream().filter(p -> p.getStatus() != null && (p.getStatus().equalsIgnoreCase("Currently Working") || p.getStatus().equalsIgnoreCase("In Progress"))).count();
        long resolvedCount = problems.stream().filter(p -> p.getStatus() != null && p.getStatus().equalsIgnoreCase("Resolved")).count();

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalProblems", problems.size());
        analytics.put("inProgress", inProgressCount);
        analytics.put("resolved", resolvedCount);
        analytics.put("activeUniversities", universityRepository.count());
        analytics.put("activeIndustryPartners", industryRepository.count());
        analytics.put("totalAssignments", assignments.size());
        analytics.put("totalSolutions", solutionRepository.count());
        analytics.put("totalCollaborations", collabs.size());
        analytics.put("districtDistribution", districtDistribution);
        analytics.put("categoryDistribution", categoryDistribution);
        analytics.put("statusDistribution", statusDistribution);

        return ResponseEntity.ok(ApiResponse.ok("Live Dynamic State Analytics", analytics));
    }

    @Autowired
    private gov.jharkhand.civicconnect.service.ProjectService projectService;

    @GetMapping("/projects/{problemId}")
    public ResponseEntity<ApiResponse<gov.jharkhand.civicconnect.model.Project>> getAdminProject(@PathVariable String problemId) {
        gov.jharkhand.civicconnect.model.Project project = projectService.getProjectByProblemId(problemId);
        if (project == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Project not found for problem: " + problemId));
        }
        return ResponseEntity.ok(ApiResponse.ok("Project details retrieved for administrative audit", project));
    }

    @PostMapping(value = {"/projects/{problemId}/sanction-resolution", "/projects/{problemId}/proceed-work", "/collaborations/{problemId}/proceed-work"})
    public ResponseEntity<ApiResponse<gov.jharkhand.civicconnect.model.Project>> sanctionAndResolveProject(
            @PathVariable String problemId,
            @RequestBody Map<String, Object> sanctionData
    ) {
        try {
            gov.jharkhand.civicconnect.model.Project resolved = projectService.sanctionAndResolveProject(problemId, sanctionData);
            return ResponseEntity.ok(ApiResponse.ok("Administrative Resolution Record created and problem marked Resolved.", resolved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/projects/{problemId}/request-correction")
    public ResponseEntity<ApiResponse<gov.jharkhand.civicconnect.model.Project>> requestProjectCorrection(
            @PathVariable String problemId,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        gov.jharkhand.civicconnect.model.Project project = projectService.getProjectByProblemId(problemId);
        if (project == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Project not found: " + problemId));
        }

        String notes = payload != null && payload.containsKey("correctionNotes") ? (String) payload.get("correctionNotes") : "Additional validation evidence and documentation requested.";
        String adminUser = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();

        project.setStatus("IN_PROGRESS");
        project.setResolutionNotes("Correction Requested: " + notes);
        project.setAuditStatus("CORRECTION_REQUESTED");
        gov.jharkhand.civicconnect.model.Project saved = projectRepository.save(project);

        if (project.getUniversityId() != null) {
            Notification un = new Notification();
            un.setRecipientRole("ROLE_UNIVERSITY");
            un.setRecipientUserId(project.getUniversityId());
            un.setTitle("Correction Requested: " + project.getProblemTitle());
            un.setMessage("State Administration requested deliverables correction: " + notes);
            un.setReferenceId(project.getProblemId());
            un.setType("COMPLETION_CORRECTION");
            un.setCreatedAt(java.time.Instant.now().toString());
            notificationRepository.save(un);
        }

        if (project.getIndustryId() != null) {
            Notification in = new Notification();
            in.setRecipientRole("ROLE_INDUSTRY");
            in.setRecipientUserId(project.getIndustryId());
            in.setTitle("Correction Requested: " + project.getProblemTitle());
            in.setMessage("State Administration requested deliverables correction: " + notes);
            in.setReferenceId(project.getProblemId());
            in.setType("COMPLETION_CORRECTION");
            in.setCreatedAt(java.time.Instant.now().toString());
            notificationRepository.save(in);
        }

        AuditLog audit = new AuditLog(
                "PROJECT_CORRECTION_REQUESTED",
                "PROJECT",
                project.getId(),
                adminUser,
                "ADMIN",
                "Administrator requested correction on completion deliverables: " + notes,
                Map.of("correctionNotes", notes, "problemId", problemId)
        );
        auditLogRepository.save(audit);

        return ResponseEntity.ok(ApiResponse.ok("Correction requested from execution partners.", saved));
    }

    // =========================================================================
    // ADMIN-GATED CAPABILITY MATCHING & COLLABORATION WORKFLOW (ENTERPRISE SLICES)
    // =========================================================================

    @GetMapping("/problems/pending-review")
    public ResponseEntity<ApiResponse<List<Problem>>> getProblemsPendingReview() {
        List<Problem> all = problemRepository.findAll();
        List<Problem> pending = all.stream()
                .filter(p -> p.getApprovalStatus() == null ||
                        "PENDING_ADMIN_REVIEW".equalsIgnoreCase(p.getApprovalStatus()) ||
                        "Pending Admin Review".equalsIgnoreCase(p.getStatus()) ||
                        "Under AI Analysis".equalsIgnoreCase(p.getStatus()) ||
                        "AI Verified".equalsIgnoreCase(p.getStatus()))
                .filter(p -> !"APPROVED_FOR_MATCHING".equalsIgnoreCase(p.getApprovalStatus()) &&
                        !"REJECTED_BY_ADMIN".equalsIgnoreCase(p.getApprovalStatus()))
                .sorted(Comparator.comparing(Problem::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        ApiResponse<List<Problem>> response = ApiResponse.ok("Pending Administrative Review Queue", pending);
        response.setCount(pending.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = {"/problems/{id}/approve", "/problems/{id}/proceed"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveProblemForMatching(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Problem statement not found: " + id));
        }

        if ("APPROVED_FOR_MATCHING".equalsIgnoreCase(problem.getApprovalStatus()) ||
            "COLLABORATION_APPROVED".equalsIgnoreCase(problem.getApprovalStatus()) ||
            "PROJECT_CREATED".equalsIgnoreCase(problem.getApprovalStatus())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Problem statement is already approved for matching (Status: " + problem.getApprovalStatus() + "). Duplicate approval blocked."));
        }
        if ("REJECTED_BY_ADMIN".equalsIgnoreCase(problem.getApprovalStatus())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Problem statement has been rejected by administration. Duplicate action blocked."));
        }

        String adminNotes = payload != null && payload.containsKey("adminNotes") ? (String) payload.get("adminNotes") : "Approved for Capability Matching by State Administration";
        String adminUser = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        int deadlineDays = payload != null && payload.containsKey("proposalDeadlineDays") ? ((Number) payload.get("proposalDeadlineDays")).intValue() : 7;

        problem.setApprovalStatus("APPROVED_FOR_MATCHING");
        problem.setStatus("AWAITING_PROPOSALS");
        problem.setApprovedBy(adminUser != null ? adminUser : "admin@jharkhand.gov.in");
        problem.setApprovedAt(java.time.Instant.now().toString());
        problem.setAdminReviewNotes(adminNotes);
        problem.setMatchingStatus("MATCHING");
        problem.setInvitationSentAt(java.time.Instant.now().toString());
        problem.setProposalDeadline(java.time.Instant.now().plus(deadlineDays, java.time.temporal.ChronoUnit.DAYS).toString());

        // Execute explainable capability-based matching via real AI Service
        List<Map<String, Object>> uniMatches = aiService.recommendUniversities(problem);
        List<Map<String, Object>> indMatches = aiService.recommendIndustries(problem);

        List<String> matchedUniIds = new ArrayList<>();
        if (uniMatches != null) {
            for (Map<String, Object> u : uniMatches) {
                if (u.containsKey("id") && u.get("id") != null) matchedUniIds.add(String.valueOf(u.get("id")));
            }
        }
        List<String> matchedIndIds = new ArrayList<>();
        if (indMatches != null) {
            for (Map<String, Object> ind : indMatches) {
                if (ind.containsKey("id") && ind.get("id") != null) matchedIndIds.add(String.valueOf(ind.get("id")));
            }
        }

        problem.setMatchedUniversityIds(matchedUniIds);
        problem.setMatchedIndustryIds(matchedIndIds);
        problem.setMatchedUniversitiesCount(matchedUniIds.size());

        Map<String, Object> explanations = new HashMap<>();
        explanations.put("matchedUniversities", uniMatches);
        explanations.put("matchedIndustries", indMatches);
        explanations.put("matchedAt", java.time.Instant.now().toString());
        problem.setMatchingExplanations(explanations);

        if (matchedUniIds.isEmpty() && matchedIndIds.isEmpty()) {
            problem.setMatchingStatus("NO_CAPABLE_PARTNER_FOUND");
        } else {
            problem.setMatchingStatus("COMPLETED");
        }

        // Initialize Structured Targeted Dispatch Tracking
        Map<String, Object> dispatch = new HashMap<>();
        dispatch.put("universitiesMatchedCount", matchedUniIds.size());
        dispatch.put("universitiesNotifiedCount", matchedUniIds.size());
        dispatch.put("universitiesViewedCount", 0);
        dispatch.put("universitiesProposalsCount", 0);
        dispatch.put("universitiesPendingCount", matchedUniIds.size());
        dispatch.put("industriesMatchedCount", matchedIndIds.size());
        dispatch.put("industriesNotifiedCount", matchedIndIds.size());
        dispatch.put("industriesViewedCount", 0);
        dispatch.put("industriesCommitmentsCount", 0);
        dispatch.put("industriesPendingCount", matchedIndIds.size());
        dispatch.put("invitationSentAt", problem.getInvitationSentAt());
        dispatch.put("proposalDeadline", problem.getProposalDeadline());
        problem.setDispatchStatus(dispatch);

        Problem saved = problemRepository.save(problem);

        // Targeted Notifications sent ONLY to matched institutions
        for (String uId : matchedUniIds) {
            Notification un = new Notification();
            un.setRecipientRole("ROLE_UNIVERSITY");
            un.setRecipientUserId(uId);
            un.setTitle("Civic Challenge Matched: " + problem.getTitle());
            un.setMessage("Your academic department capabilities matched a new State Civic Challenge. Please review and formulate proposal before deadline " + problem.getProposalDeadline());
            un.setReferenceId(problem.getId());
            un.setType("CHALLENGE_INVITATION");
            un.setCreatedAt(java.time.Instant.now().toString());
            notificationRepository.save(un);
        }

        for (String iId : matchedIndIds) {
            Notification in = new Notification();
            in.setRecipientRole("ROLE_INDUSTRY");
            in.setRecipientUserId(iId);
            in.setTitle("CSR Opportunity Matched: " + problem.getTitle());
            in.setMessage("Your CSR priority domain matched a new Government Civic Challenge. Review and submit CSR commitment before deadline " + problem.getProposalDeadline());
            in.setReferenceId(problem.getId());
            in.setType("CSR_INVITATION");
            in.setCreatedAt(java.time.Instant.now().toString());
            notificationRepository.save(in);
        }

        // Immutable Audit Log Record
        String executionMode = payload != null && payload.containsKey("executionMode") 
                ? (String) payload.get("executionMode") 
                : (payload != null && payload.containsKey("mode") ? (String) payload.get("mode") : "MANUAL");

        AuditLog audit = new AuditLog(
                "PROBLEM_APPROVED_FOR_MATCHING",
                "PROBLEM",
                problem.getId(),
                adminUser,
                "ADMIN",
                "Problem approved by Admin and capability-matched with " + matchedUniIds.size() + " universities and " + matchedIndIds.size() + " industries.",
                executionMode,
                "SUCCESS",
                Map.of("matchedUniversities", matchedUniIds, "matchedIndustries", matchedIndIds, "status", "AWAITING_PROPOSALS", "executionMode", executionMode)
        );
        auditLogRepository.save(audit);

        Map<String, Object> result = new HashMap<>();
        result.put("problem", saved);
        result.put("matchedUniversities", uniMatches);
        result.put("matchedIndustries", indMatches);
        result.put("matchingStatus", saved.getMatchingStatus());
        result.put("dispatchStatus", dispatch);

        return ResponseEntity.ok(ApiResponse.ok("Problem approved and capability matching completed successfully.", result));
    }

    @PostMapping("/problems/{id}/reject")
    public ResponseEntity<ApiResponse<Problem>> rejectProblem(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload
    ) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Problem not found: " + id));
        }

        if ("REJECTED_BY_ADMIN".equalsIgnoreCase(problem.getApprovalStatus())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Problem statement has already been rejected by administration. Duplicate rejection blocked."));
        }

        String reason = (String) payload.getOrDefault("rejectionReason", "Does not meet state civic challenge criteria");
        String adminUser = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();

        problem.setApprovalStatus("REJECTED_BY_ADMIN");
        problem.setStatus("REJECTED");
        problem.setAdminRejectionReason(reason);
        problem.setMatchingStatus("NOT_STARTED");
        Problem saved = problemRepository.save(problem);

        if (problem.getUserId() != null || problem.getCitizenEmail() != null) {
            Notification cn = new Notification();
            cn.setRecipientRole("ROLE_CITIZEN");
            cn.setRecipientUserId(problem.getUserId() != null ? problem.getUserId() : problem.getCitizenEmail());
            cn.setTitle("Civic Grievance Review: " + problem.getTitle());
            cn.setMessage("Your submitted grievance was reviewed by State Administration and marked Closed: " + reason);
            cn.setReferenceId(problem.getId());
            cn.setType("GRIEVANCE_REJECTED");
            cn.setCreatedAt(java.time.Instant.now().toString());
            notificationRepository.save(cn);
        }

        String executionMode = payload != null && payload.containsKey("executionMode") 
                ? (String) payload.get("executionMode") 
                : (payload != null && payload.containsKey("mode") ? (String) payload.get("mode") : "MANUAL");

        AuditLog audit = new AuditLog(
                "PROBLEM_REJECTED",
                "PROBLEM",
                problem.getId(),
                adminUser,
                "ADMIN",
                "Problem rejected by Administrator: " + reason,
                executionMode,
                "SUCCESS",
                Map.of("rejectionReason", reason, "executionMode", executionMode)
        );
        auditLogRepository.save(audit);

        return ResponseEntity.ok(ApiResponse.ok("Problem rejected by administration", saved));
    }

    @PostMapping("/problems/{id}/request-info")
    public ResponseEntity<ApiResponse<Problem>> requestMoreInfo(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload
    ) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Problem not found: " + id));
        }

        String notes = (String) payload.getOrDefault("adminNotes", "Additional location/photographic evidence requested.");
        String adminUser = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();

        problem.setApprovalStatus("MORE_INFO_REQUESTED");
        problem.setStatus("MORE_INFO_REQUESTED");
        problem.setAdminReviewNotes(notes);
        problem.setRequestedInformation(notes);
        problem.setInfoRequestedBy(adminUser != null ? adminUser : "admin@jharkhand.gov.in");
        problem.setInfoRequestedAt(java.time.Instant.now().toString());
        problem.setInfoResponseDeadline(java.time.Instant.now().plus(7, java.time.temporal.ChronoUnit.DAYS).toString());

        Problem saved = problemRepository.save(problem);

        if (problem.getUserId() != null || problem.getCitizenEmail() != null) {
            Notification cn = new Notification();
            cn.setRecipientRole("ROLE_CITIZEN");
            cn.setRecipientUserId(problem.getUserId() != null ? problem.getUserId() : problem.getCitizenEmail());
            cn.setTitle("Clarification Needed: " + problem.getTitle());
            cn.setMessage("State Administration requested additional evidence/information: " + notes + ". Please respond to resume review.");
            cn.setReferenceId(problem.getId());
            cn.setType("MORE_INFO_REQUESTED");
            cn.setCreatedAt(java.time.Instant.now().toString());
            notificationRepository.save(cn);
        }

        String reqInfoMode = payload != null && payload.containsKey("executionMode") 
                ? (String) payload.get("executionMode") 
                : (payload != null && payload.containsKey("mode") ? (String) payload.get("mode") : "MANUAL");

        AuditLog audit = new AuditLog(
                "PROBLEM_MORE_INFO_REQUESTED",
                "PROBLEM",
                problem.getId(),
                adminUser,
                "ADMIN",
                "Administrator requested more information from submitter: " + notes,
                reqInfoMode,
                "SUCCESS",
                Map.of("adminNotes", notes, "executionMode", reqInfoMode)
        );
        auditLogRepository.save(audit);

        return ResponseEntity.ok(ApiResponse.ok("Additional information requested from citizen.", saved));
    }

    @GetMapping("/problems/{id}/matches")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProblemMatches(@PathVariable String id) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Problem not found: " + id));
        }

        Map<String, Object> data = new HashMap<>();
        data.put("problemId", problem.getId());
        data.put("matchingStatus", problem.getMatchingStatus() != null ? problem.getMatchingStatus() : "NOT_STARTED");
        data.put("matchedUniversityIds", problem.getMatchedUniversityIds() != null ? problem.getMatchedUniversityIds() : List.of());
        data.put("matchedIndustryIds", problem.getMatchedIndustryIds() != null ? problem.getMatchedIndustryIds() : List.of());

        if (problem.getMatchingExplanations() != null) {
            data.putAll(problem.getMatchingExplanations());
        } else {
            data.put("matchedUniversities", aiService.recommendUniversities(problem));
            data.put("matchedIndustries", aiService.recommendIndustries(problem));
        }

        return ResponseEntity.ok(ApiResponse.ok("Capability-based partner matches", data));
    }

    @GetMapping("/problems/{id}/proposals")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProblemProposals(@PathVariable String id) {
        List<Solution> universityProposals = solutionRepository.findByProblemId(id);
        List<Collaboration> industryProposals = collaborationRepository.findByProblemId(id);

        Map<String, Object> result = new HashMap<>();
        result.put("problemId", id);
        result.put("universityProposals", universityProposals);
        result.put("universityProposalsCount", universityProposals.size());
        result.put("industryProposals", industryProposals);
        result.put("industryProposalsCount", industryProposals.size());

        return ResponseEntity.ok(ApiResponse.ok("Submitted proposals for challenge", result));
    }

    @PostMapping("/problems/{id}/analyze-collaboration")
    public ResponseEntity<ApiResponse<Map<String, Object>>> analyzeCollaborationProposals(@PathVariable String id) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Problem not found: " + id));
        }

        List<Solution> universityProposals = solutionRepository.findByProblemId(id);
        List<Collaboration> industryProposals = collaborationRepository.findByProblemId(id);

        Map<String, Object> analysis = aiService.analyzeCandidatePairs(problem, universityProposals, industryProposals);

        return ResponseEntity.ok(ApiResponse.ok("AI multi-proposal synergy analysis", analysis));
    }

    @PostMapping("/problems/{id}/collaboration-report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateCollaborationReport(@PathVariable String id) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Problem not found: " + id));
        }

        List<Solution> universityProposals = solutionRepository.findByProblemId(id);
        List<Collaboration> industryProposals = collaborationRepository.findByProblemId(id);

        Map<String, Object> analysis = aiService.analyzeCandidatePairs(problem, universityProposals, industryProposals);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> candidatePairs = analysis != null && analysis.containsKey("candidatePairs")
                ? (List<Map<String, Object>>) analysis.get("candidatePairs")
                : List.of();

        List<Map<String, Object>> existingReports = problem.getCollaborationReports() != null
                ? problem.getCollaborationReports()
                : new ArrayList<>();
        int versionNum = existingReports.size() + 1;
        String versionStr = "V" + versionNum;

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("reportVersion", versionStr);
        report.put("reportId", "REP-" + id + "-" + versionStr);
        report.put("problemId", id);
        report.put("problemTitle", problem.getTitle());
        report.put("generatedAt", java.time.Instant.now().toString());
        report.put("proposalsAnalyzed", Map.of(
                "universitiesCount", universityProposals.size(),
                "industriesCount", industryProposals.size()
        ));
        report.put("candidatePairsIdentified", candidatePairs.size());
        report.put("candidatePairs", candidatePairs);
        report.put("summary", "Analyzed " + universityProposals.size() + " university proposals and " + industryProposals.size() + " industry proposals. Identified " + candidatePairs.size() + " candidate collaborative partnerships.");
        report.put("requiresAdminDecision", true);

        // Versioning: Append without overwriting earlier reports
        existingReports.add(report);
        problem.setCollaborationReports(existingReports);
        problem.setLatestCollaborationReport(report);
        problem.setStatus("COLLABORATION_ANALYSIS");
        problemRepository.save(problem);

        return ResponseEntity.ok(ApiResponse.ok("MCP Collaboration Intelligence Report generated successfully.", report));
    }

    @GetMapping("/problems/{id}/collaboration-reports")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCollaborationReportsHistory(@PathVariable String id) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Problem not found: " + id));
        }

        List<Map<String, Object>> reports = problem.getCollaborationReports() != null ? problem.getCollaborationReports() : List.of();
        Map<String, Object> res = new HashMap<>();
        res.put("problemId", id);
        res.put("totalReportsCount", reports.size());
        res.put("reports", reports);
        res.put("latestReport", problem.getLatestCollaborationReport());

        return ResponseEntity.ok(ApiResponse.ok("Collaboration Reports History", res));
    }

    @PostMapping("/problems/{id}/approve-collaboration")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveCollaborationSelection(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload
    ) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Problem not found: " + id));
        }

        String universityProposalId = (String) payload.get("universityProposalId");
        String industryProposalId = (String) payload.get("industryProposalId");
        final String universityId = payload.get("universityId") != null ? (String) payload.get("universityId") : (String) payload.get("selectedUniversityId");
        final String industryId = payload.get("industryId") != null ? (String) payload.get("industryId") : (String) payload.get("selectedIndustryId");
        String adminDecisionNotes = (String) payload.getOrDefault("decisionNotes", (String) payload.getOrDefault("rationale", "Approved optimal University + Industry hybrid collaboration"));
        String adminUser = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();

        // Check duplicate active project prevention
        Project existingProject = projectService.getProjectByProblemId(id);
        if (existingProject != null && !"RESOLVED".equalsIgnoreCase(existingProject.getStatus()) && !"CANCELLED".equalsIgnoreCase(existingProject.getStatus())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("An active project already exists for this civic problem statement. Duplicate project creation is blocked."));
        }

        // Retrieve University Proposal
        Solution selectedSolution = null;
        if (universityProposalId != null) {
            selectedSolution = solutionRepository.findById(universityProposalId).orElse(null);
        }
        if (selectedSolution == null && universityId != null) {
            List<Solution> sols = solutionRepository.findByProblemId(id);
            selectedSolution = sols.stream().filter(s -> universityId.equalsIgnoreCase(s.getUniversityId())).findFirst().orElse(null);
        }

        // Retrieve Industry Proposal
        Collaboration selectedCollab = null;
        if (industryProposalId != null) {
            selectedCollab = collaborationRepository.findById(industryProposalId).orElse(null);
        }
        if (selectedCollab == null && industryId != null) {
            List<Collaboration> collabs = collaborationRepository.findByProblemId(id);
            selectedCollab = collabs.stream().filter(c -> industryId.equalsIgnoreCase(c.getIndustryId())).findFirst().orElse(null);
        }

        // Validate matched shortlist
        if (problem.getMatchedUniversityIds() != null && !problem.getMatchedUniversityIds().isEmpty()) {
            boolean validUni = (universityId != null && problem.getMatchedUniversityIds().contains(universityId)) ||
                    (selectedSolution != null && (problem.getMatchedUniversityIds().contains(selectedSolution.getUniversityId()) ||
                            problem.getMatchedUniversityIds().contains(selectedSolution.getUniversityName())));
            if (!validUni) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Selected university is not in the approved matched shortlist for this problem."));
            }
        }
        if (problem.getMatchedIndustryIds() != null && !problem.getMatchedIndustryIds().isEmpty()) {
            boolean validInd = (industryId != null && problem.getMatchedIndustryIds().contains(industryId)) ||
                    (selectedCollab != null && (problem.getMatchedIndustryIds().contains(selectedCollab.getIndustryId()) ||
                            problem.getMatchedIndustryIds().contains(selectedCollab.getCompanyName())));
            if (!validInd) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Selected industry is not in the approved matched shortlist for this problem."));
            }
        }

        if (selectedCollab == null) {
            selectedCollab = new Collaboration();
            selectedCollab.setId("COLLAB-" + System.currentTimeMillis());
            selectedCollab.setProblemId(problem.getId());
            selectedCollab.setProblemTitle(problem.getTitle());
            selectedCollab.setDomain(problem.getDomain());
            selectedCollab.setCategory(problem.getCategory());
            selectedCollab.setCreatedAt(java.time.Instant.now().toString());
        }

        if (selectedSolution != null) {
            selectedCollab.setUniversityId(selectedSolution.getUniversityId());
            selectedCollab.setUniversityName(selectedSolution.getUniversityName());
            selectedCollab.setDepartment(selectedSolution.getDepartment());
            selectedCollab.setSolutionId(selectedSolution.getId());
            selectedCollab.setSolutionTitle(selectedSolution.getSolutionTitle());
            selectedCollab.setUniversityProposalId(selectedSolution.getId());
            selectedSolution.setStatus("Assigned");
            solutionRepository.save(selectedSolution);
        }

        if (industryId != null && selectedCollab.getIndustryId() == null) {
            selectedCollab.setIndustryId(industryId);
            selectedCollab.setCompanyName((String) payload.getOrDefault("companyName", "Industry Partner"));
        }

        selectedCollab.setSelectedByAdmin(true);
        selectedCollab.setSelectedAt(java.time.Instant.now().toString());
        selectedCollab.setSelectedBy(adminUser != null ? adminUser : "admin@jharkhand.gov.in");
        selectedCollab.setAdminDecisionNotes(adminDecisionNotes);
        selectedCollab.setStatus("Active Collaboration");
        selectedCollab.setSolutionStatus("In Progress");
        selectedCollab.setCollaboratedDate(java.time.LocalDate.now().toString());
        selectedCollab.setUpdatedAt(java.time.Instant.now().toString());

        Collaboration savedCollab = collaborationRepository.save(selectedCollab);

        // Initialize Project record
        Project project = new Project();
        project.setId("PROJ-" + System.currentTimeMillis());
        project.setProblemId(problem.getId());
        project.setProblemTitle(problem.getTitle());
        project.setDomain(problem.getDomain());
        project.setCategory(problem.getCategory());
        project.setDistrict(problem.getDistrict());
        project.setCollaborationId(savedCollab.getId());
        project.setSolutionId(savedCollab.getSolutionId());
        project.setUniversityId(savedCollab.getUniversityId());
        project.setUniversityName(savedCollab.getUniversityName());
        project.setIndustryId(savedCollab.getIndustryId());
        project.setCompanyName(savedCollab.getCompanyName());
        project.setStatus("IN_PROGRESS");
        project.setProgress(0);
        project.setStartDate(java.time.LocalDate.now().toString());
        project.setDeadlineDate(java.time.LocalDate.now().plusDays(90).toString());
        project.setApprovedSlaDays(90);
        project.setDaysElapsed(0);
        project.setDaysRemaining(90);
        project.setRiskLevel("Low");
        project.setCreatedAt(java.time.Instant.now().toString());
        projectRepository.save(project);

        // Update Problem state
        problem.setStatus("IN_PROGRESS");
        problem.setApprovalStatus("COLLABORATION_APPROVED");
        problem.setAdoptedByUniversity(savedCollab.getUniversityName());
        problem.setAdoptedByIndustry(savedCollab.getCompanyName());
        problem.setActiveCollaborationId(savedCollab.getId());
        problem.setActiveProjectId(project.getId());
        problemRepository.save(problem);

        // Targeted Notifications to selected partners
        if (savedCollab.getUniversityId() != null) {
            Notification un = new Notification();
            un.setRecipientRole("ROLE_UNIVERSITY");
            un.setRecipientUserId(savedCollab.getUniversityId());
            un.setTitle("Collaboration Approved: " + problem.getTitle());
            un.setMessage("State Administration approved your hybrid collaboration with " + savedCollab.getCompanyName() + ". Project initialized.");
            un.setReferenceId(problem.getId());
            un.setType("COLLABORATION_SANCTION");
            un.setCreatedAt(java.time.Instant.now().toString());
            notificationRepository.save(un);
        }

        if (savedCollab.getIndustryId() != null) {
            Notification in = new Notification();
            in.setRecipientRole("ROLE_INDUSTRY");
            in.setRecipientUserId(savedCollab.getIndustryId());
            in.setTitle("Collaboration Approved: " + problem.getTitle());
            in.setMessage("State Administration approved your hybrid collaboration with " + savedCollab.getUniversityName() + ". Project initialized.");
            in.setReferenceId(problem.getId());
            in.setType("COLLABORATION_SANCTION");
            in.setCreatedAt(java.time.Instant.now().toString());
            notificationRepository.save(in);
        }

        // Notify Citizen
        if (problem.getUserId() != null || problem.getCitizenEmail() != null) {
            Notification cn = new Notification();
            cn.setRecipientRole("ROLE_CITIZEN");
            cn.setRecipientUserId(problem.getUserId() != null ? problem.getUserId() : problem.getCitizenEmail());
            cn.setTitle("Project Activated: " + problem.getTitle());
            cn.setMessage("A joint University-Industry partnership (" + savedCollab.getUniversityName() + " + " + savedCollab.getCompanyName() + ") has been officially sanctioned to solve your reported grievance.");
            cn.setReferenceId(problem.getId());
            cn.setType("PROJECT_ACTIVATED");
            cn.setCreatedAt(java.time.Instant.now().toString());
            notificationRepository.save(cn);
        }

        // Notify Unselected Matched Institutions
        if (problem.getMatchedUniversityIds() != null) {
            for (String uId : problem.getMatchedUniversityIds()) {
                if (savedCollab.getUniversityId() != null && !uId.equalsIgnoreCase(savedCollab.getUniversityId())) {
                    Notification un = new Notification();
                    un.setRecipientRole("ROLE_UNIVERSITY");
                    un.setRecipientUserId(uId);
                    un.setTitle("Challenge Assigned: " + problem.getTitle());
                    un.setMessage("The state civic challenge has been assigned to a collaborating partnership. Thank you for your proposal participation.");
                    un.setReferenceId(problem.getId());
                    un.setType("CHALLENGE_CLOSED");
                    un.setCreatedAt(java.time.Instant.now().toString());
                    notificationRepository.save(un);
                }
            }
        }

        if (problem.getMatchedIndustryIds() != null) {
            for (String iId : problem.getMatchedIndustryIds()) {
                if (savedCollab.getIndustryId() != null && !iId.equalsIgnoreCase(savedCollab.getIndustryId())) {
                    Notification in = new Notification();
                    in.setRecipientRole("ROLE_INDUSTRY");
                    in.setRecipientUserId(iId);
                    in.setTitle("CSR Opportunity Assigned: " + problem.getTitle());
                    in.setMessage("The civic challenge has been assigned to an active partnership. Thank you for your CSR interest.");
                    in.setReferenceId(problem.getId());
                    in.setType("CSR_CLOSED");
                    in.setCreatedAt(java.time.Instant.now().toString());
                    notificationRepository.save(in);
                }
            }
        }

        // Immutable Audit Log
        String executionMode = payload != null && payload.containsKey("executionMode") 
                ? (String) payload.get("executionMode") 
                : (payload != null && payload.containsKey("mode") ? (String) payload.get("mode") : "MANUAL");

        AuditLog audit = new AuditLog(
                "COLLABORATION_APPROVED",
                "COLLABORATION",
                savedCollab.getId(),
                adminUser,
                "ADMIN",
                "Administrator approved collaboration between " + savedCollab.getUniversityName() + " and " + savedCollab.getCompanyName(),
                executionMode,
                "SUCCESS",
                Map.of("problemId", problem.getId(), "universityId", String.valueOf(savedCollab.getUniversityId()), "industryId", String.valueOf(savedCollab.getIndustryId()), "projectId", project.getId(), "executionMode", executionMode)
        );
        auditLogRepository.save(audit);

        Map<String, Object> respData = new HashMap<>();
        respData.put("collaboration", savedCollab);
        respData.put("project", project);
        respData.put("problem", problem);

        return ResponseEntity.ok(ApiResponse.ok("Hybrid University + Industry collaboration activated and project initialized.", respData));
    }

    // ==========================================
    // LIFECYCLE WORKFLOW APIS (NEW -> ROUTED -> PROPOSAL_SUBMITTED -> APPROVED -> IN_PROGRESS -> COMPLETED)
    // ==========================================

    @PostMapping("/problems/{id}/route")
    public ResponseEntity<ApiResponse<Problem>> routeProblem(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload
    ) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Problem not found: " + id));
        }

        String targetType = (String) payload.getOrDefault("targetType", "UNIVERSITY");
        String orgId = (String) payload.get("orgId");
        String orgName = (String) payload.get("orgName");
        String routingNotes = (String) payload.get("routingNotes");
        String nowStr = java.time.Instant.now().toString();

        problem.setStatus("ROUTED");
        problem.setApprovalStatus("ROUTED");
        problem.setRoutedAt(nowStr);
        problem.setRoutedToOrgId(orgId);
        problem.setRoutedToOrgName(orgName != null ? orgName : "Assigned Organization");
        problem.setRoutedToOrgType(targetType);

        Map<String, Object> assignedMap = new HashMap<>();
        assignedMap.put("id", orgId);
        assignedMap.put("name", orgName != null ? orgName : "Assigned Organization");
        assignedMap.put("type", targetType);
        assignedMap.put("routedAt", nowStr);
        assignedMap.put("notes", routingNotes);
        problem.setAssignedTo(assignedMap);

        if ("UNIVERSITY".equalsIgnoreCase(targetType)) {
            problem.setAdoptedByUniversity(orgName);
            List<String> unis = problem.getMatchedUniversityIds() != null ? new ArrayList<>(problem.getMatchedUniversityIds()) : new ArrayList<>();
            if (orgId != null && !unis.contains(orgId)) unis.add(orgId);
            if (orgName != null && !unis.contains(orgName)) unis.add(orgName);
            problem.setMatchedUniversityIds(unis);
        } else if ("INDUSTRY".equalsIgnoreCase(targetType)) {
            problem.setAdoptedByIndustry(orgName);
            List<String> inds = problem.getMatchedIndustryIds() != null ? new ArrayList<>(problem.getMatchedIndustryIds()) : new ArrayList<>();
            if (orgId != null && !inds.contains(orgId)) inds.add(orgId);
            if (orgName != null && !inds.contains(orgName)) inds.add(orgName);
            problem.setMatchedIndustryIds(inds);
        }

        Map<String, Object> dispatch = problem.getDispatchStatus() != null ? new HashMap<>(problem.getDispatchStatus()) : new HashMap<>();
        dispatch.put("routedTo", orgName);
        dispatch.put("routedAt", nowStr);
        dispatch.put("waitingProposal", true);
        problem.setDispatchStatus(dispatch);

        Problem saved = problemRepository.save(problem);

        Notification notif = new Notification();
        notif.setRecipientRole("INDUSTRY".equalsIgnoreCase(targetType) ? "ROLE_INDUSTRY" : "ROLE_UNIVERSITY");
        notif.setRecipientUserId(orgId != null ? orgId : orgName);
        notif.setTitle("Civic Problem Routed: " + problem.getTitle());
        notif.setMessage("State Administration has routed a civic problem to your organization for proposal formulation.");
        notif.setReferenceId(problem.getId());
        notif.setType("PROBLEM_ROUTED");
        notif.setCreatedAt(nowStr);
        notificationRepository.save(notif);

        return ResponseEntity.ok(ApiResponse.ok("Problem routed successfully to " + (orgName != null ? orgName : targetType), saved));
    }

    @PostMapping("/problems/{id}/approve-proposal")
    public ResponseEntity<ApiResponse<Problem>> approveProblemProposal(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Problem not found: " + id));
        }

        String proposalId = payload != null ? (String) payload.get("proposalId") : null;
        String decisionNotes = payload != null ? (String) payload.getOrDefault("decisionNotes", "Proposal approved by State Administration") : "Proposal approved by State Administration";
        String adminUser = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        String nowStr = java.time.Instant.now().toString();

        Solution sol = null;
        if (proposalId != null) {
            sol = solutionRepository.findById(proposalId).orElse(null);
        }
        if (sol == null) {
            List<Solution> sols = solutionRepository.findByProblemId(id);
            if (!sols.isEmpty()) sol = sols.get(0);
        }

        if (sol != null) {
            sol.setStatus("APPROVED");
            sol.setAssignedDate(java.time.LocalDate.now().toString());
            sol.setAssignedBy(adminUser != null ? adminUser : "State Administration");
            solutionRepository.save(sol);
        }

        problem.setStatus("IN_PROGRESS");
        problem.setApprovalStatus("APPROVED");
        problem.setApprovedAt(nowStr);
        problem.setApprovedBy(adminUser != null ? adminUser : "State Administration");
        problem.setProjectProgress(0);

        Map<String, Object> appMap = new HashMap<>();
        appMap.put("proposalId", sol != null ? sol.getId() : proposalId);
        appMap.put("proposalTitle", sol != null ? sol.getSolutionTitle() : problem.getTitle());
        appMap.put("approvedAt", nowStr);
        appMap.put("notes", decisionNotes);
        String orgName = sol != null ? (sol.getUniversityName() != null ? sol.getUniversityName() : sol.getCompanyName()) : (problem.getRoutedToOrgName() != null ? problem.getRoutedToOrgName() : "Partner Institution");
        appMap.put("orgName", orgName);
        problem.setApprovedProposal(appMap);

        List<Project> existingProjects = projectRepository.findByProblemId(id);
        Project project = existingProjects != null && !existingProjects.isEmpty() ? existingProjects.get(0) : null;
        if (project == null) {
            project = new Project();
            project.setId("PROJ-" + System.currentTimeMillis());
            project.setProblemId(problem.getId());
            project.setProblemTitle(problem.getTitle());
            project.setDomain(problem.getDomain());
            project.setCategory(problem.getCategory());
            project.setDistrict(problem.getDistrict());
            project.setUniversityName(orgName);
            project.setStatus("IN_PROGRESS");
            project.setProgress(0);
            project.setStartDate(java.time.LocalDate.now().toString());
            project.setDeadlineDate(java.time.LocalDate.now().plusDays(90).toString());
            project.setApprovedSlaDays(90);
            project.setCreatedAt(nowStr);
        } else {
            project.setStatus("IN_PROGRESS");
            project.setProgress(0);
        }
        projectRepository.save(project);
        problem.setActiveProjectId(project.getId());

        Problem saved = problemRepository.save(problem);

        if (problem.getUserId() != null || problem.getCitizenEmail() != null) {
            Notification cn = new Notification();
            cn.setRecipientRole("ROLE_CITIZEN");
            cn.setRecipientUserId(problem.getUserId() != null ? problem.getUserId() : problem.getCitizenEmail());
            cn.setTitle("Proposal Approved: " + problem.getTitle());
            cn.setMessage("State Administration approved the implementation proposal from " + orgName + ". Project is now in progress.");
            cn.setReferenceId(problem.getId());
            cn.setType("PROPOSAL_APPROVED");
            cn.setCreatedAt(nowStr);
            notificationRepository.save(cn);
        }

        return ResponseEntity.ok(ApiResponse.ok("Proposal approved and active project initialized", saved));
    }

    @PostMapping("/problems/{id}/reject-proposal")
    public ResponseEntity<ApiResponse<Problem>> rejectProblemProposal(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Problem not found: " + id));
        }

        String proposalId = payload != null ? (String) payload.get("proposalId") : null;
        String rejectionReason = payload != null ? (String) payload.getOrDefault("rejectionReason", "Proposal does not meet feasibility standards") : "Proposal does not meet feasibility standards";

        if (proposalId != null) {
            solutionRepository.findById(proposalId).ifPresent(s -> {
                s.setStatus("REJECTED");
                s.setRejectionReason(rejectionReason);
                solutionRepository.save(s);
            });
        }

        problem.setStatus("ROUTED");
        problem.setProposal(null);
        Problem saved = problemRepository.save(problem);

        return ResponseEntity.ok(ApiResponse.ok("Proposal rejected. Problem returned to Routed queue.", saved));
    }

    @PostMapping("/problems/{id}/complete")
    public ResponseEntity<ApiResponse<Problem>> completeProblemLifecycle(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Problem not found: " + id));
        }

        String nowStr = java.time.Instant.now().toString();
        String implementedSolution = payload != null && payload.get("implementedSolution") != null ? (String) payload.get("implementedSolution") : "Verified technological and on-ground civic solution deployed.";
        String impactResult = payload != null && payload.get("impactResult") != null ? (String) payload.get("impactResult") : "100% resolution verified across district.";
        String completedByOrg = payload != null && payload.get("completedByOrg") != null ? (String) payload.get("completedByOrg") : (problem.getRoutedToOrgName() != null ? problem.getRoutedToOrgName() : "Partner Institution");

        problem.setStatus("COMPLETED");
        problem.setApprovalStatus("COMPLETED");
        problem.setCompletedAt(nowStr);
        problem.setResolvedAt(nowStr);
        problem.setImplementedSolution(implementedSolution);
        problem.setImpactResult(impactResult);
        problem.setCompletedByOrg(completedByOrg);
        problem.setProjectProgress(100);

        List<Project> projects = projectRepository.findByProblemId(id);
        if (projects != null) {
            for (Project project : projects) {
                project.setStatus("RESOLVED");
                project.setProgress(100);
                project.setResolvedAt(nowStr);
                projectRepository.save(project);
            }
        }

        Problem saved = problemRepository.save(problem);

        if (problem.getUserId() != null || problem.getCitizenEmail() != null) {
            Notification cn = new Notification();
            cn.setRecipientRole("ROLE_CITIZEN");
            cn.setRecipientUserId(problem.getUserId() != null ? problem.getUserId() : problem.getCitizenEmail());
            cn.setTitle("Civic Problem Resolved: " + problem.getTitle());
            cn.setMessage("Your reported grievance has been fully resolved by " + completedByOrg + ". Solution: " + implementedSolution);
            cn.setReferenceId(problem.getId());
            cn.setType("PROBLEM_COMPLETED");
            cn.setCreatedAt(nowStr);
            notificationRepository.save(cn);
        }

        return ResponseEntity.ok(ApiResponse.ok("Problem marked COMPLETED and preserved as historical record.", saved));
    }

    @PostMapping("/problems/{id}/update-progress")
    public ResponseEntity<ApiResponse<Problem>> updateProblemProgress(
            @PathVariable String id,
            @RequestBody Map<String, Object> payload
    ) {
        Problem problem = problemRepository.findById(id).orElse(null);
        if (problem == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Problem not found: " + id));
        }

        int progress = payload.get("progress") instanceof Number ? ((Number) payload.get("progress")).intValue() : 50;
        problem.setProjectProgress(Math.min(100, Math.max(0, progress)));
        if (progress >= 100) {
            problem.setStatus("COMPLETED");
            problem.setCompletedAt(java.time.Instant.now().toString());
            problem.setResolvedAt(java.time.Instant.now().toString());
        }

        List<Project> projects = projectRepository.findByProblemId(id);
        if (projects != null) {
            for (Project project : projects) {
                project.setProgress(progress);
                if (progress >= 100) project.setStatus("RESOLVED");
                projectRepository.save(project);
            }
        }

        Problem saved = problemRepository.save(problem);
        return ResponseEntity.ok(ApiResponse.ok("Project progress updated to " + progress + "%", saved));
    }
}
