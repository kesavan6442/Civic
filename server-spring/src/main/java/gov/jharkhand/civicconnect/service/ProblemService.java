package gov.jharkhand.civicconnect.service;

import gov.jharkhand.civicconnect.model.*;
import gov.jharkhand.civicconnect.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProblemService {

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private SolutionRepository solutionRepository;

    @Autowired
    private CollaborationRepository collaborationRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private AIAnalysisRepository aiAnalysisRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private AiService aiService;

    public List<Problem> getAllProblems(String district, String category, String domain, String q, String status, String universityId, List<String> domains) {
        return getAllProblems(district, category, domain, q, status, universityId, domains, null, null, null);
    }

    public List<Problem> getAllProblems(String district, String category, String domain, String q, String status, String universityId, List<String> domains, String userId, String citizenEmail, String citizenPhone) {
        List<Problem> list = problemRepository.findAll();

        // Citizen user specific filter
        if (userId != null && !userId.trim().isEmpty()) {
            list = list.stream().filter(p -> userId.equals(p.getUserId()) || (citizenEmail != null && citizenEmail.equalsIgnoreCase(p.getCitizenEmail()))).collect(Collectors.toList());
        } else if (citizenEmail != null && !citizenEmail.trim().isEmpty()) {
            list = list.stream().filter(p -> citizenEmail.equalsIgnoreCase(p.getCitizenEmail())).collect(Collectors.toList());
        } else if (citizenPhone != null && !citizenPhone.trim().isEmpty()) {
            list = list.stream().filter(p -> citizenPhone.equals(p.getCitizenPhone())).collect(Collectors.toList());
        }

        // University Capability Matching & Tenant Isolation
        if (universityId != null && !universityId.trim().isEmpty()) {
            final String uId = universityId.trim();
            University u = universityRepository.findById(uId).orElse(null);
            List<String> targetDomains = new ArrayList<>();
            if (domains != null && !domains.isEmpty()) {
                targetDomains.addAll(domains);
            } else if (u != null && u.getExpertise() != null) {
                targetDomains.addAll(u.getExpertise());
            }

            list = list.stream().filter(p -> {
                // Must not be in unapproved pending review state
                String appStatus = p.getApprovalStatus();
                String st = p.getStatus() != null ? p.getStatus() : "";
                if ("PENDING_ADMIN_REVIEW".equalsIgnoreCase(appStatus) ||
                    "REJECTED_BY_ADMIN".equalsIgnoreCase(appStatus) ||
                    "Pending Admin Review".equalsIgnoreCase(st) ||
                    "Under AI Analysis".equalsIgnoreCase(st)) {
                    return false;
                }

                // If explicit matched IDs exist, verify institution was matched
                if (p.getMatchedUniversityIds() != null && !p.getMatchedUniversityIds().isEmpty()) {
                    return p.getMatchedUniversityIds().contains(uId) ||
                        (u != null && u.getName() != null && p.getMatchedUniversityIds().stream().anyMatch(m -> m.equalsIgnoreCase(u.getName()) || u.getName().toLowerCase().contains(m.toLowerCase())));
                }

                // Domain alignment fallback
                if (!targetDomains.isEmpty()) {
                    String probDomain = (p.getDomain() != null ? p.getDomain() : (p.getCategory() != null ? p.getCategory() : "")).toLowerCase();
                    return targetDomains.stream().anyMatch(td -> probDomain.contains(td.toLowerCase()) || td.toLowerCase().contains(probDomain));
                }
                return true;
            }).collect(Collectors.toList());
        } else if (domains != null && !domains.isEmpty()) {
            list = list.stream().filter(p -> {
                String probDomain = (p.getDomain() != null ? p.getDomain() : (p.getCategory() != null ? p.getCategory() : "")).toLowerCase();
                return domains.stream().anyMatch(td -> probDomain.contains(td.toLowerCase()) || td.toLowerCase().contains(probDomain));
            }).collect(Collectors.toList());
        }

        if (district != null && !district.equalsIgnoreCase("All")) {
            list = list.stream().filter(p -> p.getDistrict() != null && p.getDistrict().equalsIgnoreCase(district)).collect(Collectors.toList());
        }

        if (category != null && !category.equalsIgnoreCase("All")) {
            list = list.stream().filter(p -> p.getCategory() != null && p.getCategory().toLowerCase().contains(category.toLowerCase())).collect(Collectors.toList());
        }

        if (domain != null && !domain.equalsIgnoreCase("All")) {
            list = list.stream().filter(p -> p.getDomain() != null && p.getDomain().toLowerCase().contains(domain.toLowerCase())).collect(Collectors.toList());
        }

        if (status != null && !status.equalsIgnoreCase("All")) {
            String sLower = status.toLowerCase();
            list = list.stream().filter(p -> {
                String ps = p.getStatus() != null ? p.getStatus().toLowerCase() : "";
                if (sLower.contains("pending") || sLower.contains("review") || sLower.equals("new")) {
                    return ps.contains("pending") || ps.equals("new");
                }
                if (sLower.contains("broadcast")) return ps.contains("broadcast");
                if (sLower.contains("working") || sLower.contains("paired")) return ps.contains("working") || ps.contains("paired");
                return ps.equals(sLower);
            }).collect(Collectors.toList());
        }

        if (q != null && !q.trim().isEmpty()) {
            String query = q.toLowerCase();
            list = list.stream().filter(p ->
                    (p.getTitle() != null && p.getTitle().toLowerCase().contains(query)) ||
                    (p.getDescription() != null && p.getDescription().toLowerCase().contains(query)) ||
                    (p.getCitizenName() != null && p.getCitizenName().toLowerCase().contains(query)) ||
                    (p.getDistrict() != null && p.getDistrict().toLowerCase().contains(query))
            ).collect(Collectors.toList());
        }

        // Enrich with solutions, 90-day SLA deadline, collaborations in a single batch
        return enrichProblemsBatch(list);
    }

    public Problem getProblemById(String id) {
        Problem p = problemRepository.findById(id).orElse(null);
        if (p == null) return null;
        return enrichProblem(p);
    }

    public Problem createProblem(Problem input) {
        String id = input.getId();
        if (id == null || id.trim().isEmpty()) {
            id = "JH-CHLG-2026-" + (1000 + problemRepository.count() + 1);
            input.setId(id);
        }

        if (input.getCreatedAt() == null) input.setCreatedAt(Instant.now().toString());
        if (input.getSubmissionDate() == null) input.setSubmissionDate(LocalDate.now().toString());
        if (input.getPriority() == null) input.setPriority(input.getUrgency() != null ? input.getUrgency() : "High");
        if (input.getStatus() == null || input.getStatus().trim().isEmpty()) input.setStatus("NEW");
        input.setAiStatus("SUBMITTED");

        // 1. Save immediately to MongoDB first so citizen submission is never lost
        problemRepository.save(input);

        // 2. Run Python AI pipeline & store AI analysis document separately
        try {
            AiAnalysisResult aiResult = aiService.analyzeProblem(input);
            
            if ("MODEL_UNAVAILABLE".equalsIgnoreCase(aiResult.getAnalysisStatus()) || "PENDING".equalsIgnoreCase(aiResult.getAnalysisStatus())) {
                input.setAiStatus("PENDING");
                input.setNeedsHumanReview(true);
                input.setAiVerification("Pending Review");
                input.setAiReason("AI model unavailable or service offline — queued for manual admin verification.");
                input.setAiConfidenceValue(0.0);
                input.setAiConfidence(null);
                input.setAiModelVersion(aiResult.getModelVersion() != null ? aiResult.getModelVersion() : "None");
            } else {
                input.setAiStatus("AI_COMPLETED");
                input.setDomain(aiResult.getDomain() != null ? aiResult.getDomain() : input.getCategory());
                input.setCategory(aiResult.getCategory() != null ? aiResult.getCategory() : input.getCategory());
                input.setUrgency(aiResult.getUrgency() != null ? aiResult.getUrgency() : input.getPriority());
                input.setPriority(input.getUrgency());
                
                Double conf = aiResult.getConfidence();
                input.setAiConfidenceValue(conf != null ? conf : 0.0);
                input.setAiConfidence(conf != null ? String.format(Locale.US, "%.1f%%", conf * 100) : null);
                
                input.setAiVerification(aiResult.getVerificationRecommendation() != null ? aiResult.getVerificationRecommendation() : "Recommended for verification");
                input.setAiReason(aiResult.getVerificationReason() != null ? aiResult.getVerificationReason() : "Verified genuine civic complaint.");
                input.setNeedsHumanReview(Boolean.TRUE.equals(aiResult.getNeedsHumanReview()));
                input.setMissingInformation(aiResult.getMissingInformation() != null ? aiResult.getMissingInformation() : new ArrayList<>());
                input.setKeywords(aiResult.getKeywords() != null ? aiResult.getKeywords() : new ArrayList<>());
                input.setAiModelVersion(aiResult.getModelVersion() != null ? aiResult.getModelVersion() : "XLM-RoBERTa-Civic-v1.4");
                input.setMultimodalConflict(Boolean.TRUE.equals(aiResult.getMultimodalConflict()));

                // Image Authenticity & Evidence Rejection Policy
                if (aiResult.getImageAuthenticity() != null) {
                    Map<String, Object> imgAuth = aiResult.getImageAuthenticity();
                    input.setImageAuthenticity(imgAuth);
                    String authStatus = (String) imgAuth.get("status");
                    input.setImageAuthenticityStatus(authStatus);
                    
                    Object authConfObj = imgAuth.get("confidence");
                    if (authConfObj instanceof Number) {
                        input.setImageAuthenticityConfidence(((Number) authConfObj).doubleValue());
                    }

                    if ("AI_GENERATED".equalsIgnoreCase(authStatus)) {
                        input.setIsEvidenceAcceptable(false);
                        input.setEvidenceRejectionReason("Uploaded image could not be accepted as photographic evidence because the authenticity model detected characteristics associated with synthetic/AI-generated imagery.");
                        input.setNeedsHumanReview(true);
                        input.setAiReason("Uploaded image was detected as synthetic/AI-generated and rejected as evidence. Citizen complaint text preserved.");
                    } else if ("UNCERTAIN".equalsIgnoreCase(authStatus)) {
                        input.setIsEvidenceAcceptable(false);
                        input.setEvidenceRejectionReason("Image authenticity is uncertain; flagged for manual admin verification.");
                        input.setNeedsHumanReview(true);
                    } else {
                        input.setIsEvidenceAcceptable(true);
                        input.setEvidenceRejectionReason(null);
                    }
                }

                // Duplicate Detection
                if (aiResult.getDuplicateCandidates() != null && !aiResult.getDuplicateCandidates().isEmpty()) {
                    input.setPossibleDuplicate(true);
                    input.setDuplicateCandidates(aiResult.getDuplicateCandidates());
                    Map<String, Object> topMatch = aiResult.getDuplicateCandidates().get(0);
                    input.setDuplicateMatchingProblemId((String) topMatch.get("problem_id"));
                    Object sim = topMatch.get("similarity");
                    if (sim instanceof Number) {
                        input.setDuplicateSimilarityScore(((Number) sim).doubleValue());
                    }
                    input.setDuplicateReason((String) topMatch.get("reason"));
                    input.setDuplicateStatus("Possible Duplicate (" + (int)(input.getDuplicateSimilarityScore() != null ? input.getDuplicateSimilarityScore() * 100 : 0) + "% match)");
                    input.setNeedsHumanReview(true);
                } else {
                    input.setPossibleDuplicate(false);
                    input.setDuplicateStatus("Unique (0% duplicate match)");
                }

                input.setStatus("Pending Admin Review");
                input.setApprovalStatus("PENDING_ADMIN_REVIEW");
                input.setMatchingStatus("NOT_STARTED");

                // Persist AI analysis separately into ai_analysis collection
                AIAnalysis aiAnalysisDoc = new AIAnalysis();
                aiAnalysisDoc.setId("AI-" + input.getId());
                aiAnalysisDoc.setProblemId(input.getId());
                aiAnalysisDoc.setDomain(input.getDomain());
                aiAnalysisDoc.setCategory(input.getCategory());
                aiAnalysisDoc.setUrgency(input.getPriority());
                aiAnalysisDoc.setConfidence(input.getAiConfidenceValue());
                aiAnalysisDoc.setNeedsHumanReview(input.getNeedsHumanReview());
                aiAnalysisDoc.setDuplicateCandidates(input.getDuplicateCandidates() != null ? List.of(input.getDuplicateStatus()) : List.of());
                aiAnalysisDoc.setMissingInformation(input.getMissingInformation());
                aiAnalysisDoc.setVerificationRecommendation(input.getAiReason());
                aiAnalysisDoc.setImageAuthenticity(input.getImageAuthenticity());
                aiAnalysisDoc.setMultimodalConflict(input.getMultimodalConflict());
                aiAnalysisDoc.setModelVersion(input.getAiModelVersion());
                aiAnalysisDoc.setAnalyzedAt(Instant.now().toString());
                aiAnalysisRepository.save(aiAnalysisDoc);
            }

        } catch (Exception e) {
            // Graceful offline fallback
            input.setAiStatus("PENDING");
            input.setNeedsHumanReview(true);
            input.setAiVerification("Pending Review");
            input.setAiConfidence(null);
            input.setAiConfidenceValue(0.0);
            input.setAiReason("AI service offline — queued for manual admin verification.");
            input.setAiModelVersion("None");
            input.setStatus(input.getStatus() != null ? input.getStatus() : "Pending Admin Review");
        }

        // Final save with AI enrichment
        problemRepository.save(input);
        return enrichProblem(input);
    }

    public Problem mergeProblems(String masterId, String duplicateId) {
        Problem master = problemRepository.findById(masterId).orElse(null);
        Problem duplicate = problemRepository.findById(duplicateId).orElse(null);
        if (master != null && duplicate != null) {
            if (master.getLinkedCitizenReports() == null) {
                master.setLinkedCitizenReports(new ArrayList<>());
            }
            if (!master.getLinkedCitizenReports().contains(duplicateId)) {
                master.getLinkedCitizenReports().add(duplicateId);
            }
            duplicate.setStatus("Merged with " + masterId);
            duplicate.setMasterProblemId(masterId);
            problemRepository.save(master);
            problemRepository.save(duplicate);
            return enrichProblem(master);
        }
        return null;
    }

    public Problem overrideProblem(String id, Map<String, Object> overrideData) {
        Problem p = problemRepository.findById(id).orElse(null);
        if (p != null) {
            if (overrideData.containsKey("domain")) p.setDomain((String) overrideData.get("domain"));
            if (overrideData.containsKey("category")) p.setCategory((String) overrideData.get("category"));
            if (overrideData.containsKey("priority")) p.setPriority((String) overrideData.get("priority"));
            if (overrideData.containsKey("status")) p.setStatus((String) overrideData.get("status"));
            if (overrideData.containsKey("aiVerification")) p.setAiVerification((String) overrideData.get("aiVerification"));
            
            // Log feedback telemetry
            aiService.logFeedback(Map.of(
                    "problemId", id,
                    "adminChosenDomain", p.getDomain(),
                    "adminChosenPriority", p.getPriority(),
                    "actionType", "Admin Override"
            ));

            problemRepository.save(p);
            return enrichProblem(p);
        }
        return null;
    }

    public Problem updateProblem(Problem p) {
        if (p != null) {
            problemRepository.save(p);
            return enrichProblem(p);
        }
        return null;
    }

    public Problem updateProblemStatus(String id, String newStatus) {
        Problem p = problemRepository.findById(id).orElse(null);
        if (p != null) {
            p.setStatus(newStatus);
            problemRepository.save(p);
            return enrichProblem(p);
        }
        return null;
    }

    public Problem reopenProblem(String id) {
        Problem p = problemRepository.findById(id).orElse(null);
        if (p != null) {
            p.setStatus("Broadcasted to Universities");
            // Remove previous assignment
            assignmentRepository.findByProblemId(id).ifPresent(asgn -> assignmentRepository.deleteById(asgn.getId()));
            problemRepository.save(p);
            return enrichProblem(p);
        }
        return null;
    }

    public DeadlineInfo calculateDeadlineInfo(String deadlineDateStr, int timelineDays) {
        DeadlineInfo info = new DeadlineInfo();
        info.setTimelineDays(timelineDays > 0 ? timelineDays : 90);

        try {
            LocalDate deadline = deadlineDateStr != null ? LocalDate.parse(deadlineDateStr.split("T")[0]) : LocalDate.now().plusDays(90);
            long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), deadline);
            info.setDeadlineDate(deadline.toString());
            info.setDaysRemaining(daysRemaining);
            info.setBreached(daysRemaining < 0);
            info.setAtRisk(daysRemaining >= 0 && daysRemaining <= 15);
            info.setSlaStatus(daysRemaining < 0 ? "Breached" : (daysRemaining <= 15 ? "At Risk" : "On Track"));
        } catch (Exception e) {
            info.setDeadlineDate(LocalDate.now().plusDays(90).toString());
            info.setDaysRemaining(90);
            info.setSlaStatus("On Track");
        }

        return info;
    }

    public List<Problem> enrichProblemsBatch(List<Problem> list) {
        if (list == null || list.isEmpty()) return Collections.emptyList();

        List<Solution> allSolutions = solutionRepository.findAll();
        Map<String, List<Solution>> solutionsByProblem = allSolutions.stream()
                .filter(s -> s.getProblemId() != null)
                .collect(Collectors.groupingBy(Solution::getProblemId));

        List<Collaboration> allCollabs = collaborationRepository.findAll();
        Map<String, List<Collaboration>> collabsByProblem = allCollabs.stream()
                .filter(c -> c.getProblemId() != null)
                .collect(Collectors.groupingBy(Collaboration::getProblemId));

        List<Assignment> allAssignments = assignmentRepository.findAll();
        Map<String, Assignment> assignmentsByProblem = allAssignments.stream()
                .filter(a -> a.getProblemId() != null)
                .collect(Collectors.toMap(Assignment::getProblemId, a -> a, (a1, a2) -> a1));

        for (Problem p : list) {
            String pid = p.getId();
            List<Solution> pSolutions = solutionsByProblem.getOrDefault(pid, Collections.emptyList());
            List<Collaboration> pCollabs = collabsByProblem.getOrDefault(pid, Collections.emptyList());
            Assignment asgn = assignmentsByProblem.get(pid);

            p.setSolutionsCount(pSolutions.size());
            p.setSolutions(pSolutions);
            p.setIndustryCollaborations(pCollabs);

            if (asgn != null) {
                DeadlineInfo dInfo = calculateDeadlineInfo(asgn.getDeadlineDate(), asgn.getSlaTimelineDays() != null ? asgn.getSlaTimelineDays() : 90);
                p.setDeadlineInfo(dInfo);
                p.setAssignedTo(Map.of(
                        "universityId", asgn.getUniversityId() != null ? asgn.getUniversityId() : "",
                        "universityName", asgn.getUniversityName() != null ? asgn.getUniversityName() : "",
                        "assignedDate", asgn.getAssignedDate() != null ? asgn.getAssignedDate() : "",
                        "deadlineDate", asgn.getDeadlineDate() != null ? asgn.getDeadlineDate() : "",
                        "slaTimelineDays", asgn.getSlaTimelineDays() != null ? asgn.getSlaTimelineDays() : 90,
                        "solutionTitle", asgn.getSolutionTitle() != null ? asgn.getSolutionTitle() : "",
                        "status", asgn.getStatus() != null ? asgn.getStatus() : ""
                ));
            }
        }

        return list;
    }

    public Problem enrichProblem(Problem p) {
        List<Solution> pSolutions = solutionRepository.findByProblemId(p.getId());
        List<Collaboration> pCollabs = collaborationRepository.findByProblemId(p.getId());
        Assignment asgn = assignmentRepository.findByProblemId(p.getId()).orElse(null);

        p.setSolutionsCount(pSolutions.size());
        p.setSolutions(pSolutions);
        p.setIndustryCollaborations(pCollabs);

        if (asgn != null) {
            DeadlineInfo dInfo = calculateDeadlineInfo(asgn.getDeadlineDate(), asgn.getSlaTimelineDays() != null ? asgn.getSlaTimelineDays() : 90);
            p.setDeadlineInfo(dInfo);
            p.setAssignedTo(Map.of(
                    "universityId", asgn.getUniversityId() != null ? asgn.getUniversityId() : "",
                    "universityName", asgn.getUniversityName() != null ? asgn.getUniversityName() : "",
                    "assignedDate", asgn.getAssignedDate() != null ? asgn.getAssignedDate() : "",
                    "deadlineDate", asgn.getDeadlineDate() != null ? asgn.getDeadlineDate() : "",
                    "slaTimelineDays", asgn.getSlaTimelineDays() != null ? asgn.getSlaTimelineDays() : 90,
                    "solutionTitle", asgn.getSolutionTitle() != null ? asgn.getSolutionTitle() : "",
                    "status", asgn.getStatus() != null ? asgn.getStatus() : ""
            ));
        }

        return p;
    }
}
