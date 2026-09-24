package gov.jharkhand.civicconnect.service;

import gov.jharkhand.civicconnect.model.Problem;
import gov.jharkhand.civicconnect.model.Solution;
import gov.jharkhand.civicconnect.repository.ProblemRepository;
import gov.jharkhand.civicconnect.repository.SolutionRepository;
import gov.jharkhand.civicconnect.security.SecurityUtils;
import gov.jharkhand.civicconnect.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
public class SolutionService {

    @Autowired
    private SolutionRepository solutionRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private gov.jharkhand.civicconnect.repository.UserRepository userRepository;

    @Autowired
    private AiService aiService;

    public List<Solution> getAllSolutions() {
        return solutionRepository.findAll();
    }

    public Solution getSolutionById(String id) {
        if (id == null) return null;
        return solutionRepository.findById(id).orElse(null);
    }

    public List<Solution> getSolutionsByProblemId(String problemId) {
        if (problemId == null) return Collections.emptyList();
        return solutionRepository.findByProblemId(problemId);
    }

    public List<Solution> getMySolutions() {
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isEmpty()) {
            return Collections.emptyList();
        }
        UserPrincipal principal = principalOpt.get();
        Map<String, Solution> resultMap = new LinkedHashMap<>();

        if (principal.getId() != null) {
            for (Solution s : solutionRepository.findByUserId(principal.getId())) {
                if (s != null && s.getId() != null) resultMap.put(s.getId(), s);
            }
        }
        if (principal.getEmail() != null) {
            for (Solution s : solutionRepository.findByUserEmailIgnoreCase(principal.getEmail())) {
                if (s != null && s.getId() != null) resultMap.put(s.getId(), s);
            }
        }
        if (principal.getUniversityName() != null && !principal.getUniversityName().trim().isEmpty()) {
            for (Solution s : solutionRepository.findByUniversityNameIgnoreCase(principal.getUniversityName())) {
                if (s != null && s.getId() != null) resultMap.put(s.getId(), s);
            }
        } else if (principal.getOrganization() != null && !principal.getOrganization().trim().isEmpty()) {
            for (Solution s : solutionRepository.findByUniversityNameIgnoreCase(principal.getOrganization())) {
                if (s != null && s.getId() != null) resultMap.put(s.getId(), s);
            }
        } else if (principal.getId() != null) {
            userRepository.findById(principal.getId()).ifPresent(u -> {
                if (u.getUniversityName() != null && !u.getUniversityName().trim().isEmpty()) {
                    for (Solution s : solutionRepository.findByUniversityNameIgnoreCase(u.getUniversityName())) {
                        if (s != null && s.getId() != null) resultMap.put(s.getId(), s);
                    }
                } else if (u.getOrganization() != null && !u.getOrganization().trim().isEmpty()) {
                    for (Solution s : solutionRepository.findByUniversityNameIgnoreCase(u.getOrganization())) {
                        if (s != null && s.getId() != null) resultMap.put(s.getId(), s);
                    }
                }
            });
        }

        return new ArrayList<>(resultMap.values());
    }

    public Solution submitSolution(String problemId, Solution solution) {
        if (solution != null && problemId != null && (solution.getProblemId() == null || solution.getProblemId().trim().isEmpty())) {
            solution.setProblemId(problemId);
        }
        return submitSolution(solution);
    }

    public Solution submitSolution(Solution solution) {
        if (solution == null) {
            throw new IllegalArgumentException("Solution proposal body cannot be null.");
        }

        // 1. Validate problemId and parent Problem existence
        if (solution.getProblemId() == null || solution.getProblemId().trim().isEmpty()) {
            throw new IllegalArgumentException("Parent problemId is required to submit a solution proposal.");
        }

        Problem problem = problemRepository.findById(solution.getProblemId()).orElse(null);
        if (problem == null) {
            throw new IllegalArgumentException("Referenced civic problem does not exist: " + solution.getProblemId());
        }

        // 2. Validate technical approach / methodology length >= 20 characters
        String approach = solution.getTechnicalApproach();
        if (approach == null || approach.trim().isEmpty()) {
            approach = solution.getDescription();
        }
        if (approach == null || approach.trim().length() < 20) {
            throw new IllegalArgumentException("Technical approach and methodology must be at least 20 characters in length.");
        }

        // 3. User Identity & University Scoping from SecurityContext
        SecurityUtils.getCurrentUserPrincipal().ifPresent(principal -> {
            solution.setUserId(principal.getId());
            solution.setUserEmail(principal.getEmail());
            if (solution.getUniversityName() == null || solution.getUniversityName().trim().isEmpty()) {
                if (principal.getUniversityName() != null && !principal.getUniversityName().trim().isEmpty()) {
                    solution.setUniversityName(principal.getUniversityName());
                } else if (principal.getOrganization() != null && !principal.getOrganization().trim().isEmpty()) {
                    solution.setUniversityName(principal.getOrganization());
                } else if (principal.getId() != null) {
                    userRepository.findById(principal.getId()).ifPresent(u -> {
                        if (u.getUniversityName() != null && !u.getUniversityName().trim().isEmpty()) {
                            solution.setUniversityName(u.getUniversityName());
                        } else if (u.getOrganization() != null && !u.getOrganization().trim().isEmpty()) {
                            solution.setUniversityName(u.getOrganization());
                        }
                    });
                }
            }
            if (solution.getSubmitterType() == null || solution.getSubmitterType().trim().isEmpty()) {
                if (principal.getRole() != null) {
                    solution.setSubmitterType(principal.getRole().name().toLowerCase());
                } else {
                    solution.setSubmitterType("university");
                }
            }
        });

        if (solution.getSubmitterType() == null) {
            solution.setSubmitterType("university");
        }

        // 4. Default identifiers and timestamps
        if (solution.getId() == null || solution.getId().trim().isEmpty()) {
            solution.setId("SOL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        String nowIso = Instant.now().toString();
        if (solution.getCreatedAt() == null) {
            solution.setCreatedAt(nowIso);
        }
        solution.setUpdatedAt(nowIso);
        if (solution.getSubmittedDate() == null) {
            solution.setSubmittedDate(LocalDate.now().toString());
        }
        if (solution.getStatus() == null) {
            solution.setStatus("Under Review");
        }
        if (solution.getProblemTitle() == null || solution.getProblemTitle().trim().isEmpty()) {
            solution.setProblemTitle(problem.getTitle());
        }
        if (solution.getCategory() == null || solution.getCategory().trim().isEmpty()) {
            solution.setCategory(problem.getCategory());
        }
        if (solution.getDomain() == null || solution.getDomain().trim().isEmpty()) {
            solution.setDomain(problem.getDomain());
        }

        // 5. Call Python AI Service for real feasibility, alignment & completeness analysis
        Map<String, Object> aiResult = aiService.analyzeSingleSolution(solution, problem);

        if (aiResult != null && !aiResult.isEmpty()) {
            solution.setAiAnalysis(aiResult);
            solution.setAiStatus("ANALYZED");

            String modelVersion = (String) aiResult.get("modelVersion");
            if (modelVersion == null) modelVersion = (String) aiResult.get("model_version");
            solution.setAiModelVersion(modelVersion != null ? modelVersion : "civic-solution-eval-v2.2");

            String timestamp = (String) aiResult.get("analysisTimestamp");
            if (timestamp == null) timestamp = (String) aiResult.get("timestamp");
            solution.setAiAnalysisTimestamp(timestamp != null ? timestamp : nowIso);

            Boolean needsReview = (Boolean) aiResult.get("needsHumanReview");
            if (needsReview == null) needsReview = (Boolean) aiResult.get("needs_human_review");
            solution.setNeedsHumanReview(needsReview != null ? needsReview : false);

            Double overallScore = extractScoreValue(aiResult.get("overall_score"), aiResult.get("overallScoreValue"));
            if (overallScore == null) overallScore = extractScoreValue(aiResult.get("overallScore"), aiResult.get("feasibilityScore"));

            Double alignmentScore = extractScoreValue(aiResult.get("alignment_score"), aiResult.get("alignmentScore"));
            if (alignmentScore == null) alignmentScore = extractScoreValue(aiResult.get("scalabilityScore"), null);

            Double methodologyScore = extractScoreValue(aiResult.get("methodology_score"), aiResult.get("methodologyScore"));
            if (methodologyScore == null) methodologyScore = extractScoreValue(aiResult.get("technicalQualityScore"), null);

            Double budgetScore = extractScoreValue(aiResult.get("budget_realism_score"), aiResult.get("budgetRealismScore"));
            Double timelineScore = extractScoreValue(aiResult.get("timeline_feasibility_score"), aiResult.get("timelineFeasibilityScore"));

            if (overallScore != null) {
                solution.setOverallScoreValue(overallScore);
                solution.setOverallScore(String.format(Locale.US, "%.1f%%", overallScore * 100));
                solution.setFeasibilityScore((int) Math.round(overallScore * 100));
            }
            if (alignmentScore != null) {
                solution.setAlignmentScore(alignmentScore);
                solution.setRelevanceScore((int) Math.round(alignmentScore * 100));
            }
            if (methodologyScore != null) {
                solution.setMethodologyScore(methodologyScore);
                solution.setTechnicalQualityScore((int) Math.round(methodologyScore * 100));
            }
            if (budgetScore != null) {
                solution.setBudgetRealismScore(budgetScore);
                solution.setImpactScore((int) Math.round(budgetScore * 100));
            }
            if (timelineScore != null) {
                solution.setTimelineFeasibilityScore(timelineScore);
            }
        } else {
            // Offline AI Fallback: no fake scores, mark as PENDING with human review flag
            solution.setAiStatus("PENDING");
            solution.setNeedsHumanReview(true);
            solution.setAiModelVersion("None");
            solution.setAiAnalysisTimestamp(nowIso);
            solution.setOverallScoreValue(null);
            solution.setOverallScore(null);
            solution.setAlignmentScore(null);
            solution.setMethodologyScore(null);
            solution.setBudgetRealismScore(null);
            solution.setTimelineFeasibilityScore(null);
            solution.setRelevanceScore(null);
            solution.setFeasibilityScore(null);
            solution.setTechnicalQualityScore(null);
            solution.setImpactScore(null);
        }

        // 6. Save Solution to MongoDB
        Solution saved = solutionRepository.save(solution);

        // 7. Atomically Update Problem Solution Count & Lifecycle State Transition
        long currentCount = solutionRepository.findByProblemId(problem.getId()).size();
        problem.setSolutionsCount((int) currentCount);
        if (!"IN_PROGRESS".equalsIgnoreCase(problem.getStatus()) &&
            !"Currently Working".equalsIgnoreCase(problem.getStatus()) &&
            !"COMPLETED".equalsIgnoreCase(problem.getStatus()) &&
            !"Resolved".equalsIgnoreCase(problem.getStatus())) {
            problem.setStatus("PROPOSAL_SUBMITTED");
            problem.setProposalSubmittedAt(Instant.now().toString());
            String submitterName = saved.getUniversityName() != null ? saved.getUniversityName() : (saved.getCompanyName() != null ? saved.getCompanyName() : "Partner Institution");
            problem.setProposalSubmittedBy(submitterName);

            Map<String, Object> propMap = new HashMap<>();
            propMap.put("id", saved.getId());
            propMap.put("title", saved.getSolutionTitle() != null ? saved.getSolutionTitle() : problem.getTitle());
            propMap.put("description", saved.getDescription());
            propMap.put("technicalApproach", saved.getTechnicalApproach());
            propMap.put("submittedBy", submitterName);
            propMap.put("submittedAt", Instant.now().toString());
            propMap.put("budgetEstimate", saved.getEstimatedCost());
            propMap.put("durationMonths", saved.getEstimatedTimeWeeks());
            problem.setProposal(propMap);
        }
        problemRepository.save(problem);

        return saved;
    }

    private Double extractScoreValue(Object scoreObj, Object directFloatObj) {
        if (directFloatObj instanceof Number) {
            return ((Number) directFloatObj).doubleValue();
        }
        if (scoreObj instanceof Number) {
            return ((Number) scoreObj).doubleValue();
        }
        if (scoreObj instanceof String) {
            try {
                String str = ((String) scoreObj).replace("%", "").trim();
                double val = Double.parseDouble(str);
                return val > 1.0 ? val / 100.0 : val;
            } catch (Exception ignored) {}
        }
        if (directFloatObj instanceof String) {
            try {
                String str = ((String) directFloatObj).replace("%", "").trim();
                double val = Double.parseDouble(str);
                return val > 1.0 ? val / 100.0 : val;
            } catch (Exception ignored) {}
        }
        if (scoreObj instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) scoreObj;
            Object val = map.get("score");
            if (val instanceof Number) {
                return ((Number) val).doubleValue();
            }
            if (val instanceof String) {
                try {
                    String str = ((String) val).replace("%", "").trim();
                    double d = Double.parseDouble(str);
                    return d > 1.0 ? d / 100.0 : d;
                } catch (Exception ignored) {}
            }
        }
        return null;
    }
}
