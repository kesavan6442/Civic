package gov.jharkhand.civicconnect.service;

import gov.jharkhand.civicconnect.model.*;
import gov.jharkhand.civicconnect.repository.CollaborationRepository;
import gov.jharkhand.civicconnect.repository.ProblemRepository;
import gov.jharkhand.civicconnect.repository.ProjectRepository;
import gov.jharkhand.civicconnect.repository.SolutionRepository;
import gov.jharkhand.civicconnect.security.SecurityUtils;
import gov.jharkhand.civicconnect.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private CollaborationRepository collaborationRepository;

    @Autowired
    private SolutionRepository solutionRepository;

    @Autowired
    private AiService aiService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public Project getProjectById(String id) {
        if (id == null) return null;
        return projectRepository.findById(id).orElse(null);
    }

    public Project getProjectByProblemId(String problemId) {
        if (problemId == null) return null;
        List<Project> list = projectRepository.findByProblemId(problemId);
        if (!list.isEmpty()) {
            return list.get(0);
        }

        // Auto-initialize if problem is currently working
        Problem problem = problemRepository.findById(problemId).orElse(null);
        if (problem != null && ("Currently Working".equalsIgnoreCase(problem.getStatus()) || "Solutions Submitted".equalsIgnoreCase(problem.getStatus()))) {
            return initializeProjectForProblem(problem);
        }
        return null;
    }

    public List<Project> getMyProjects() {
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isEmpty()) {
            return Collections.emptyList();
        }
        UserPrincipal principal = principalOpt.get();
        Set<String> projectIds = new LinkedHashSet<>();
        List<Project> results = new ArrayList<>();

        if (principal.getId() != null) {
            for (Project p : projectRepository.findAll()) {
                if (principal.getId().equals(p.getUniversityUserId()) || principal.getId().equals(p.getIndustryUserId())) {
                    if (projectIds.add(p.getId())) results.add(p);
                }
            }
        }

        String uId = principal.getUniversityId();
        String uName = principal.getUniversityName();
        String org = principal.getOrganization();
        if (uId != null && !uId.trim().isEmpty()) {
            for (Project p : projectRepository.findAll()) {
                if (uId.equalsIgnoreCase(p.getUniversityId())) {
                    if (projectIds.add(p.getId())) results.add(p);
                }
            }
        }
        if (uName != null && !uName.trim().isEmpty()) {
            for (Project p : projectRepository.findAll()) {
                if (uName.equalsIgnoreCase(p.getUniversityName())) {
                    if (projectIds.add(p.getId())) results.add(p);
                }
            }
        }
        if (org != null && !org.trim().isEmpty()) {
            for (Project p : projectRepository.findAll()) {
                if (org.equalsIgnoreCase(p.getUniversityName()) || org.equalsIgnoreCase(p.getCompanyName())) {
                    if (projectIds.add(p.getId())) results.add(p);
                }
            }
        }

        String indId = principal.getIndustryId();
        String cName = principal.getCompanyName();
        if (indId != null && !indId.trim().isEmpty()) {
            for (Project p : projectRepository.findAll()) {
                if (indId.equalsIgnoreCase(p.getIndustryId())) {
                    if (projectIds.add(p.getId())) results.add(p);
                }
            }
        }
        if (cName != null && !cName.trim().isEmpty()) {
            for (Project p : projectRepository.findAll()) {
                if (cName.equalsIgnoreCase(p.getCompanyName())) {
                    if (projectIds.add(p.getId())) results.add(p);
                }
            }
        }

        return results;
    }

    public Project initializeProjectForProblem(Problem problem) {
        if (problem == null) return null;
        List<Project> existing = projectRepository.findByProblemId(problem.getId());
        if (!existing.isEmpty()) {
            return existing.get(0);
        }

        Project p = new Project();
        p.setId("PRJ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        p.setProblemId(problem.getId());
        p.setProblemTitle(problem.getTitle());
        p.setDomain(problem.getDomain());
        p.setCategory(problem.getCategory());
        p.setDistrict(problem.getDistrict());
        p.setStatus("IN_PROGRESS");
        p.setProgress(0);
        p.setApprovedSlaDays(90);

        String today = LocalDate.now().toString();
        p.setStartDate(today);
        p.setProjectStartDate(today);
        p.setDeadlineDate(LocalDate.now().plusDays(90).toString());
        p.setDaysElapsed(0);
        p.setDaysRemaining(90);
        p.setSlaProgressPercentage(0);
        p.setSlaBurnPercentage(0.0);
        p.setMilestoneVelocity(0.0);
        p.setCreatedAt(Instant.now().toString());
        p.setUpdatedAt(Instant.now().toString());

        // Find associated collaboration / solution
        List<Collaboration> collabs = collaborationRepository.findByProblemId(problem.getId());
        if (!collabs.isEmpty()) {
            Collaboration c = collabs.get(0);
            p.setCollaborationId(c.getId());
            p.setUniversityId(c.getUniversityId());
            p.setUniversityName(c.getUniversityName());
            p.setIndustryId(c.getIndustryId());
            p.setCompanyName(c.getCompanyName());
            p.setIndustryUserId(c.getUserId());
            p.setBudgetSanctioned(c.getFundingAmount());
        }

        List<Solution> sols = solutionRepository.findByProblemId(problem.getId());
        if (!sols.isEmpty()) {
            Solution s = sols.get(0);
            p.setSolutionId(s.getId());
            if (p.getUniversityName() == null) p.setUniversityName(s.getUniversityName());
            p.setUniversityUserId(s.getUserId());
        }

        // Standard 4-phase civic engineering milestone structure
        List<Milestone> milestones = new ArrayList<>();
        milestones.add(new Milestone(1, "Phase 1: Laboratory Prototype & Technical Engineering Validation", 3));
        milestones.add(new Milestone(2, "Phase 2: District Field Deployment & Sensor Telemetry Installation", 6));
        milestones.add(new Milestone(3, "Phase 3: Municipal Site Quality Testing & Continuous Data Logging", 9));
        milestones.add(new Milestone(4, "Phase 4: Citizen Handover & Official Administrative Commissioning", 12));
        p.setMilestones(milestones);

        // Real AI Risk Analysis
        Map<String, Object> risk = aiService.analyzeProjectRisk(p);
        if (risk != null && !risk.isEmpty()) {
            p.setAiRiskAnalysis(risk);
            p.setRiskLevel((String) risk.getOrDefault("riskLevel", "Low"));
            p.setAiProgressSummary((String) risk.getOrDefault("aiProgressSummary", "Project initialized within 90-day SLA."));
            p.setAiStatus((String) risk.getOrDefault("aiStatus", "ANALYZED"));
            p.setAiModelVersion((String) risk.getOrDefault("modelVersion", "civic-project-sla-v2.1"));
            p.setNeedsHumanReview((Boolean) risk.getOrDefault("needsHumanReview", false));
        }

        Project saved = projectRepository.save(p);
        auditLogService.logEvent("PROJECT_CREATED", "PROJECT", saved.getId(), "Project initiated for problem " + problem.getId(), Map.of("problemId", problem.getId()));
        return saved;
    }

    public Project updateProjectProgress(String problemId, Map<String, Object> progressData) {
        if (problemId == null) {
            throw new IllegalArgumentException("Problem ID cannot be null.");
        }
        Project project = getProjectByProblemId(problemId);
        if (project == null) {
            throw new IllegalArgumentException("Project not found for problem: " + problemId);
        }

        // 1. Strict State Machine Validation
        if (!"IN_PROGRESS".equalsIgnoreCase(project.getStatus())) {
            throw new IllegalArgumentException("Cannot update milestone progress for project with status: " + project.getStatus() + ". Only IN_PROGRESS projects allow progress updates.");
        }

        // 2. Assignment Authorization
        verifyUserProjectAssignment(project);

        // 3. Optimistic Locking Protection
        if (progressData.containsKey("version") || progressData.containsKey("currentVersion")) {
            Object reqVersion = progressData.containsKey("version") ? progressData.get("version") : progressData.get("currentVersion");
            if (reqVersion instanceof Number) {
                long clientVersion = ((Number) reqVersion).longValue();
                if (project.getVersion() != null && clientVersion != project.getVersion()) {
                    throw new OptimisticLockingFailureException("Project was modified concurrently by another user (expected v" + clientVersion + ", current v" + project.getVersion() + "). Please reload.");
                }
            }
        }

        // 4. Update Milestones & Progress
        if (progressData.containsKey("milestones") && progressData.get("milestones") instanceof List) {
            List<?> msList = (List<?>) progressData.get("milestones");
            List<Milestone> updatedMs = new ArrayList<>();
            int totalProgressSum = 0;

            for (Object obj : msList) {
                if (obj instanceof Map) {
                    Map<?, ?> m = (Map<?, ?>) obj;
                    Milestone milestone = new Milestone();
                    if (m.get("milestoneNumber") instanceof Number) {
                        milestone.setMilestoneNumber(((Number) m.get("milestoneNumber")).intValue());
                    }
                    milestone.setTitle((String) m.get("title"));
                    if (m.get("targetWeeks") instanceof Number) {
                        milestone.setTargetWeeks(((Number) m.get("targetWeeks")).intValue());
                    }
                    int prog = m.get("progress") instanceof Number ? ((Number) m.get("progress")).intValue() : 0;
                    milestone.setProgress(prog);
                    milestone.setCompleted(Boolean.TRUE.equals(m.get("completed")) || prog >= 100);
                    String statusVal = m.get("status") instanceof String ? (String) m.get("status") : (milestone.isCompleted() ? "COMPLETED" : (prog > 0 ? "IN_PROGRESS" : "PENDING"));
                    milestone.setStatus(statusVal);
                    
                    if (m.get("evidenceUrls") instanceof List) {
                        List<String> eUrls = new ArrayList<>();
                        for (Object u : (List<?>) m.get("evidenceUrls")) {
                            if (u != null) eUrls.add(u.toString());
                        }
                        milestone.setEvidenceUrls(eUrls);
                    }
                    milestone.setCompletedDate((String) m.get("completedDate"));
                    milestone.setFieldNotes((String) m.get("fieldNotes"));

                    updatedMs.add(milestone);
                    totalProgressSum += Math.min(100, Math.max(0, prog));
                }
            }

            if (!updatedMs.isEmpty()) {
                project.setMilestones(updatedMs);
                project.setProgress(totalProgressSum / updatedMs.size());
            }
        } else if (progressData.containsKey("progress") && progressData.get("progress") instanceof Number) {
            project.setProgress(((Number) progressData.get("progress")).intValue());
        }

        // 5. Real SLA Math from Persisted Start Date
        recalculateSlaMetrics(project);

        // 6. Real Explainable AI SLA Risk Evaluation
        Map<String, Object> risk = aiService.analyzeProjectRisk(project);
        if (risk != null && !risk.isEmpty()) {
            project.setAiRiskAnalysis(risk);
            project.setRiskLevel((String) risk.getOrDefault("riskLevel", "Low"));
            project.setAiProgressSummary((String) risk.getOrDefault("aiProgressSummary", "SLA progress updated."));
            project.setAiStatus((String) risk.getOrDefault("aiStatus", "ANALYZED"));
            project.setAiModelVersion((String) risk.getOrDefault("modelVersion", "civic-project-sla-v2.1"));
            project.setNeedsHumanReview((Boolean) risk.getOrDefault("needsHumanReview", false));
            if (risk.get("delayProbability") instanceof Number) {
                project.setDelayProbability(((Number) risk.get("delayProbability")).doubleValue());
            }
            if (risk.get("projectedDelayDays") instanceof Number) {
                project.setProjectedDelayDays(((Number) risk.get("projectedDelayDays")).intValue());
            }
            if (risk.get("activeRiskFactors") instanceof List) {
                List<String> rFactors = new ArrayList<>();
                for (Object rf : (List<?>) risk.get("activeRiskFactors")) {
                    if (rf != null) rFactors.add(rf.toString());
                }
                project.setActiveRiskFactors(rFactors);
            }
        }

        project.setUpdatedAt(Instant.now().toString());
        Project saved = projectRepository.save(project);

        // 7. Scoped Notifications & Audit Logs
        if ("High".equalsIgnoreCase(saved.getRiskLevel()) || "Critical".equalsIgnoreCase(saved.getRiskLevel())) {
            notificationService.sendNotification(null, "ADMIN", "SLA Risk Alert: " + saved.getProblemTitle(), "Project for " + saved.getDistrict() + " flagged with " + saved.getRiskLevel() + " risk.", "RISK_ALERT", saved.getProblemId());
            auditLogService.logEvent("RISK_DETECTED", "PROJECT", saved.getId(), "Risk level " + saved.getRiskLevel() + " detected", Map.of("riskLevel", saved.getRiskLevel()));
        }

        auditLogService.logEvent("MILESTONE_UPDATED", "PROJECT", saved.getId(), "Milestone progress updated to " + saved.getProgress() + "%", Map.of("progress", saved.getProgress()));
        return saved;
    }

    public Project submitProjectCompletion(String problemId, Map<String, Object> completionData) {
        if (problemId == null) {
            throw new IllegalArgumentException("Problem ID cannot be null.");
        }
        Project project = getProjectByProblemId(problemId);
        if (project == null) {
            throw new IllegalArgumentException("Project not found for problem: " + problemId);
        }

        // 1. Strict State Machine Validation
        if ("PENDING_ADMIN_VERIFICATION".equalsIgnoreCase(project.getStatus()) || "COMPLETION_SUBMITTED".equalsIgnoreCase(project.getStatus())) {
            return project; // Idempotent return
        }
        if (!"IN_PROGRESS".equalsIgnoreCase(project.getStatus())) {
            throw new IllegalArgumentException("Invalid state transition. Only IN_PROGRESS projects can be submitted for completion (current status: " + project.getStatus() + ").");
        }

        // 2. Assignment Authorization
        verifyUserProjectAssignment(project);

        // 3. Validation of Completion Deliverables & Milestones
        boolean allMilestonesComplete = true;
        if (project.getMilestones() != null && !project.getMilestones().isEmpty()) {
            for (Milestone m : project.getMilestones()) {
                if (!m.isCompleted() && m.getProgress() < 100) {
                    allMilestonesComplete = false;
                    break;
                }
            }
        }
        if (!allMilestonesComplete) {
            throw new IllegalArgumentException("Cannot submit completion: All scheduled milestones must reach 100% completion first.");
        }

        String summary = (String) completionData.get("finalDeliverablesSummary");
        if (summary == null || summary.trim().length() < 20) {
            summary = (String) completionData.get("finalDescription");
        }
        if (summary == null || summary.trim().length() < 20) {
            throw new IllegalArgumentException("Final deliverables summary must be at least 20 characters in length.");
        }

        List<String> evidenceUrls = new ArrayList<>();
        if (completionData.get("finalEvidenceUrls") instanceof List) {
            for (Object u : (List<?>) completionData.get("finalEvidenceUrls")) {
                if (u != null) evidenceUrls.add(u.toString());
            }
        } else if (completionData.get("files") instanceof List) {
            for (Object f : (List<?>) completionData.get("files")) {
                if (f instanceof Map && ((Map<?, ?>) f).get("url") != null) {
                    evidenceUrls.add(((Map<?, ?>) f).get("url").toString());
                }
            }
        }

        project.setFinalDeliverablesSummary(summary);
        project.setFinalEvidenceUrls(evidenceUrls);
        project.setCompletionSubmittedAt(Instant.now().toString());
        project.setCompletionNotes((String) completionData.get("completionNotes"));
        project.setProgress(100);

        // Controlled State Transition
        project.setStatus("PENDING_ADMIN_VERIFICATION");
        project.setUpdatedAt(Instant.now().toString());

        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        principalOpt.ifPresent(p -> project.setCompletionSubmittedBy(p.getEmail()));

        Project saved = projectRepository.save(project);

        // Update Parent Problem Status
        Problem problem = problemRepository.findById(project.getProblemId()).orElse(null);
        if (problem != null) {
            problem.setStatus("Completion Submitted");
            problemRepository.save(problem);
        }

        // Notification & Audit
        notificationService.sendNotification(null, "ADMIN", "Project Completion Ready for Review", "Project deliverables submitted for problem: " + project.getProblemTitle(), "COMPLETION_SUBMITTED", project.getProblemId());
        auditLogService.logEvent("COMPLETION_SUBMITTED", "PROJECT", saved.getId(), "Completion bundle submitted by " + project.getCompletionSubmittedBy(), Map.of("problemId", project.getProblemId()));

        return saved;
    }

    public Project sanctionAndResolveProject(String problemId, Map<String, Object> sanctionData) {
        if (problemId == null) {
            throw new IllegalArgumentException("Problem ID cannot be null.");
        }
        Project project = getProjectByProblemId(problemId);
        if (project == null) {
            throw new IllegalArgumentException("Project not found for problem: " + problemId);
        }

        // 1. Strict State Machine Validation
        if ("RESOLVED".equalsIgnoreCase(project.getStatus())) {
            return project; // Idempotent return
        }
        if (!"PENDING_ADMIN_VERIFICATION".equalsIgnoreCase(project.getStatus()) && !"COMPLETION_SUBMITTED".equalsIgnoreCase(project.getStatus())) {
            throw new IllegalArgumentException("Invalid state transition. Project must be in PENDING_ADMIN_VERIFICATION before resolution (current status: " + project.getStatus() + ").");
        }

        // 2. Admin Role Verification
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isEmpty() || principalOpt.get().getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only state administrators (ROLE_ADMIN) may perform final resolution audit and sanction.");
        }

        // 3. Evidence & Verification Notes Requirement
        String vNotes = (String) sanctionData.get("verificationNotes");
        if (vNotes == null || vNotes.trim().length() < 20) {
            vNotes = (String) sanctionData.get("notes");
        }
        if (vNotes == null || vNotes.trim().length() < 20) {
            throw new IllegalArgumentException("Administrative verification notes (minimum 20 characters) and completion audit are required to resolve a project.");
        }

        // 4. AI Resolution Audit Verification
        Map<String, Object> auditRes = aiService.auditProjectResolution(project, vNotes, project.getFinalEvidenceUrls());
        project.setResolutionAuditResult(auditRes);

        // 5. Transition to RESOLVED & Create Administrative Resolution Record
        project.setStatus("RESOLVED");
        project.setAuditStatus("VERIFIED");
        project.setResolutionNotes(vNotes);
        project.setResolvedAt(Instant.now().toString());

        String sanctionNo = (String) sanctionData.get("sanctionOrderNumber");
        if (sanctionNo == null || sanctionNo.trim().isEmpty()) {
            sanctionNo = "JH-RES-2026-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }
        project.setSanctionOrderNumber(sanctionNo);
        project.setWorkOrderDetails((String) sanctionData.getOrDefault("workOrderDetails", "Official Administrative Resolution Record issued by State Civic Governance Directorate."));
        String sanctioner = principalOpt.get().getEmail() != null ? principalOpt.get().getEmail() : principalOpt.get().getUsername();
        project.setSanctionedBy(sanctioner != null ? sanctioner : "admin@jharkhand.gov.in");
        project.setUpdatedAt(Instant.now().toString());

        Project saved = projectRepository.save(project);

        // 6. Update Parent Problem to Resolved
        Problem problem = problemRepository.findById(project.getProblemId()).orElse(null);
        if (problem != null) {
            problem.setStatus("Resolved");
            problemRepository.save(problem);

            // Notify Citizen
            if (problem.getUserId() != null) {
                notificationService.sendNotification(problem.getUserId(), "CITIZEN", "Civic Problem Resolved", "Your reported issue '" + problem.getTitle() + "' has been successfully resolved and commissioned by the district administration.", "RESOLUTION_APPROVED", problem.getId());
            }
        }

        // Notify University & Industry
        if (project.getUniversityUserId() != null) {
            notificationService.sendNotification(project.getUniversityUserId(), "UNIVERSITY", "Project Resolution Approved", "Your technical solution for '" + project.getProblemTitle() + "' has been approved and closed with sanction order " + sanctionNo + ".", "RESOLUTION_APPROVED", project.getProblemId());
        }
        if (project.getIndustryUserId() != null) {
            notificationService.sendNotification(project.getIndustryUserId(), "INDUSTRY", "CSR Project Commissioned", "CSR co-funded project for '" + project.getProblemTitle() + "' has achieved verified completion.", "RESOLUTION_APPROVED", project.getProblemId());
        }

        String executionMode = sanctionData != null && sanctionData.containsKey("executionMode") 
                ? (String) sanctionData.get("executionMode") 
                : (sanctionData != null && sanctionData.containsKey("mode") ? (String) sanctionData.get("mode") : "MANUAL");

        auditLogService.logEvent("RESOLUTION_APPROVED", "PROJECT", saved.getId(), "Project resolution approved and sanctioned with order " + sanctionNo, executionMode, "SUCCESS", Map.of("sanctionOrderNumber", sanctionNo, "problemId", project.getProblemId(), "executionMode", executionMode));
        auditLogService.logEvent("PROJECT_RESOLVED", "PROBLEM", project.getProblemId(), "Civic problem marked Resolved", executionMode, "SUCCESS", Map.of("problemId", project.getProblemId(), "executionMode", executionMode));

        return saved;
    }

    private void recalculateSlaMetrics(Project project) {
        if (project == null) return;
        int totalSla = project.getApprovedSlaDays() != null && project.getApprovedSlaDays() > 0 ? project.getApprovedSlaDays() : 90;
        
        LocalDate start = LocalDate.now();
        if (project.getProjectStartDate() != null) {
            try {
                start = LocalDate.parse(project.getProjectStartDate().split("T")[0]);
            } catch (Exception ignored) {}
        }
        
        long elapsed = Math.max(0, ChronoUnit.DAYS.between(start, LocalDate.now()));
        project.setDaysElapsed((int) elapsed);
        project.setDaysRemaining((int) Math.max(0, totalSla - elapsed));
        
        double burn = Math.round(((double) elapsed / totalSla) * 1000.0) / 10.0;
        project.setSlaBurnPercentage(burn);
        project.setSlaProgressPercentage((int) Math.min(100, burn));

        int completedCount = 0;
        if (project.getMilestones() != null) {
            for (Milestone m : project.getMilestones()) {
                if (m.isCompleted() || m.getProgress() >= 100) completedCount++;
            }
        }
        double velocity = Math.round((completedCount / Math.max(1.0, elapsed)) * 300.0) / 10.0;
        project.setMilestoneVelocity(velocity);
    }

    private void verifyUserProjectAssignment(Project project) {
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isEmpty()) {
            throw new AccessDeniedException("Authentication required to access project.");
        }
        UserPrincipal principal = principalOpt.get();

        if (principal.getRole() == Role.ADMIN) {
            return; // Admins have full access
        }

        boolean match = false;
        if (principal.getId() != null) {
            if (principal.getId().equals(project.getUniversityUserId()) || principal.getId().equals(project.getIndustryUserId())) {
                match = true;
            }
        }
        if (!match && principal.getUniversityName() != null && !principal.getUniversityName().trim().isEmpty()) {
            if (principal.getUniversityName().equalsIgnoreCase(project.getUniversityName())) {
                match = true;
            }
        }
        if (!match && principal.getCompanyName() != null && !principal.getCompanyName().trim().isEmpty()) {
            if (principal.getCompanyName().equalsIgnoreCase(project.getCompanyName())) {
                match = true;
            }
        }

        if (!match) {
            throw new AccessDeniedException("Unauthorized: You are not assigned to this project.");
        }
    }
}
