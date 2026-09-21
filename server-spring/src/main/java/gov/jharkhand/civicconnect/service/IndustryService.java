package gov.jharkhand.civicconnect.service;

import gov.jharkhand.civicconnect.model.Collaboration;
import gov.jharkhand.civicconnect.model.IndustryPartner;
import gov.jharkhand.civicconnect.model.Problem;
import gov.jharkhand.civicconnect.model.Project;
import gov.jharkhand.civicconnect.model.Solution;
import gov.jharkhand.civicconnect.repository.*;
import gov.jharkhand.civicconnect.security.SecurityUtils;
import gov.jharkhand.civicconnect.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
public class IndustryService {

    @Autowired
    private IndustryRepository industryRepository;

    @Autowired
    private CollaborationRepository collaborationRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private SolutionRepository solutionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private AiService aiService;

    @Autowired
    private ProjectService projectService;

    public List<IndustryPartner> getAllPartners() {
        return industryRepository.findAll();
    }

    public List<Collaboration> getAllCollaborations() {
        return collaborationRepository.findAll();
    }

    public Collaboration getCollaborationById(String id) {
        if (id == null) return null;
        return collaborationRepository.findById(id).orElse(null);
    }

    public List<Collaboration> getCollaborationsByProblemId(String problemId) {
        if (problemId == null) return Collections.emptyList();
        return collaborationRepository.findByProblemId(problemId);
    }

    public List<Collaboration> getMyCollaborations() {
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isEmpty()) {
            return Collections.emptyList();
        }
        UserPrincipal principal = principalOpt.get();
        Map<String, Collaboration> resultMap = new LinkedHashMap<>();

        if (principal.getId() != null) {
            for (Collaboration c : collaborationRepository.findByUserId(principal.getId())) {
                if (c != null && c.getId() != null) resultMap.put(c.getId(), c);
            }
        }
        if (principal.getEmail() != null) {
            for (Collaboration c : collaborationRepository.findByUserEmailIgnoreCase(principal.getEmail())) {
                if (c != null && c.getId() != null) resultMap.put(c.getId(), c);
            }
        }
        if (principal.getCompanyName() != null && !principal.getCompanyName().trim().isEmpty()) {
            for (Collaboration c : collaborationRepository.findByCompanyNameIgnoreCase(principal.getCompanyName())) {
                if (c != null && c.getId() != null) resultMap.put(c.getId(), c);
            }
        } else if (principal.getOrganization() != null && !principal.getOrganization().trim().isEmpty()) {
            for (Collaboration c : collaborationRepository.findByCompanyNameIgnoreCase(principal.getOrganization())) {
                if (c != null && c.getId() != null) resultMap.put(c.getId(), c);
            }
        } else if (principal.getId() != null) {
            userRepository.findById(principal.getId()).ifPresent(u -> {
                if (u.getCompanyName() != null && !u.getCompanyName().trim().isEmpty()) {
                    for (Collaboration c : collaborationRepository.findByCompanyNameIgnoreCase(u.getCompanyName())) {
                        if (c != null && c.getId() != null) resultMap.put(c.getId(), c);
                    }
                } else if (u.getOrganization() != null && !u.getOrganization().trim().isEmpty()) {
                    for (Collaboration c : collaborationRepository.findByCompanyNameIgnoreCase(u.getOrganization())) {
                        if (c != null && c.getId() != null) resultMap.put(c.getId(), c);
                    }
                }
            });
        }

        return new ArrayList<>(resultMap.values());
    }

    public Collaboration registerCollaboration(Collaboration collab) {
        if (collab == null) {
            throw new IllegalArgumentException("Collaboration payload cannot be null.");
        }

        // 1. Problem Existence Validation
        if (collab.getProblemId() == null || collab.getProblemId().trim().isEmpty()) {
            throw new IllegalArgumentException("Parent problem ID is required to submit a CSR collaboration commitment.");
        }

        Problem problem = problemRepository.findById(collab.getProblemId()).orElse(null);
        if (problem == null) {
            throw new IllegalArgumentException("Referenced civic problem does not exist: " + collab.getProblemId());
        }

        // 2. Validate Funding Amount & Technical / Equipment Support
        double funding = 0.0;
        if (collab.getFundingAmount() != null) {
            String raw = collab.getFundingAmount().trim();
            if (raw.startsWith("-") || raw.contains("-")) {
                throw new IllegalArgumentException("CSR funding commitment amount cannot be negative.");
            }
            String clean = raw.replaceAll("[^0-9.]", "").trim();
            if (!clean.isEmpty()) {
                try {
                    funding = Double.parseDouble(clean);
                } catch (NumberFormatException ignored) {}
            }
        }
        if (funding < 0) {
            throw new IllegalArgumentException("CSR funding commitment amount cannot be negative.");
        }

        boolean hasTechnicalSupport = (collab.getTechnicalSupport() != null && collab.getTechnicalSupport().trim().length() >= 20) ||
                (collab.getEquipmentSupport() != null && collab.getEquipmentSupport().trim().length() >= 10) ||
                (collab.getCsrCommitmentDetails() != null && collab.getCsrCommitmentDetails().trim().length() >= 20);

        if (funding == 0.0 && !hasTechnicalSupport) {
            throw new IllegalArgumentException("CSR commitment must specify either a valid funding amount or meaningful technical/equipment support (minimum 20 characters).");
        }

        // 3. User Identity Binding from SecurityContext
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isEmpty()) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication is required to submit a CSR collaboration proposal.");
        }
        UserPrincipal principal = principalOpt.get();
        collab.setUserId(principal.getId());
        collab.setUserEmail(principal.getEmail());
        if (collab.getCompanyName() == null || collab.getCompanyName().trim().isEmpty()) {
            if (principal.getCompanyName() != null && !principal.getCompanyName().trim().isEmpty()) {
                collab.setCompanyName(principal.getCompanyName());
            } else if (principal.getOrganization() != null && !principal.getOrganization().trim().isEmpty()) {
                collab.setCompanyName(principal.getOrganization());
            } else if (principal.getId() != null) {
                userRepository.findById(principal.getId()).ifPresent(u -> {
                    if (u.getCompanyName() != null && !u.getCompanyName().trim().isEmpty()) {
                        collab.setCompanyName(u.getCompanyName());
                    } else if (u.getOrganization() != null && !u.getOrganization().trim().isEmpty()) {
                        collab.setCompanyName(u.getOrganization());
                    }
                });
            }
        }

        // 4. Identifiers & Timestamps
        if (collab.getId() == null || collab.getId().trim().isEmpty()) {
            collab.setId("COLLAB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        String nowIso = Instant.now().toString();
        if (collab.getCreatedAt() == null) {
            collab.setCreatedAt(nowIso);
        }
        collab.setUpdatedAt(nowIso);
        if (collab.getCollaboratedDate() == null) {
            collab.setCollaboratedDate(LocalDate.now().toString());
        }
        if (collab.getCollaboratedAt() == null) {
            collab.setCollaboratedAt(nowIso);
        }
        collab.setStatus("PENDING_ADMIN_REVIEW");
        collab.setSolutionStatus("Pending Review");
        if (collab.getFundingStatus() == null) {
            collab.setFundingStatus("Committed");
        }

        if (collab.getProblemTitle() == null || collab.getProblemTitle().trim().isEmpty()) {
            collab.setProblemTitle(problem.getTitle());
        }
        if (collab.getCategory() == null || collab.getCategory().trim().isEmpty()) {
            collab.setCategory(problem.getCategory());
        }
        if (collab.getDomain() == null || collab.getDomain().trim().isEmpty()) {
            collab.setDomain(problem.getDomain());
        }

        // 5. University Proposal Association
        Solution univSolution = null;
        if (collab.getSolutionId() != null) {
            univSolution = solutionRepository.findById(collab.getSolutionId()).orElse(null);
        }
        if (univSolution == null) {
            List<Solution> sols = solutionRepository.findByProblemId(problem.getId());
            if (!sols.isEmpty()) {
                univSolution = sols.get(0);
            }
        }
        if (univSolution != null) {
            if (collab.getUniversityId() == null) collab.setUniversityId(univSolution.getUniversityId());
            if (collab.getUniversityName() == null) collab.setUniversityName(univSolution.getUniversityName());
            if (collab.getSolutionId() == null) collab.setSolutionId(univSolution.getId());
            if (collab.getSolutionTitle() == null) collab.setSolutionTitle(univSolution.getSolutionTitle());
        }

        // 6. Real AI Synergy Matchmaking
        Map<String, Object> aiRec = aiService.recommendCollaboration(problem, collab, univSolution);
        if (aiRec != null && !aiRec.isEmpty()) {
            collab.setAiAnalysis(aiRec);
            collab.setAiStatus("ANALYZED");
            collab.setAiModelVersion((String) aiRec.getOrDefault("modelVersion", "civic-hybrid-matcher-v2.2"));
            collab.setUniversityRole((String) aiRec.getOrDefault("universityRole", "Sensor design, laboratory assays, and pilot validation."));
            collab.setIndustryRole((String) aiRec.getOrDefault("industryRole", "CSR funding grant, heavy tooling, and turnkey municipal installation."));
            collab.setAiSynergyRationale((String) aiRec.get("jointRationale"));

            Object synScore = aiRec.get("synergyScore");
            if (synScore instanceof Number) {
                collab.setAiSynergyScore(((Number) synScore).doubleValue());
            }
            Boolean needsReview = (Boolean) aiRec.get("needsHumanReview");
            collab.setNeedsHumanReview(needsReview != null ? needsReview : false);
        } else {
            collab.setAiStatus("PENDING");
            collab.setNeedsHumanReview(true);
            collab.setAiModelVersion("None");
        }

        return collaborationRepository.save(collab);
    }

    public Collaboration approveCollaboration(String collaborationId, String adminNotes) {
        if (collaborationId == null) {
            throw new IllegalArgumentException("Collaboration ID cannot be null.");
        }
        Collaboration collab = collaborationRepository.findById(collaborationId).orElse(null);
        if (collab == null) {
            throw new IllegalArgumentException("Collaboration record not found: " + collaborationId);
        }

        collab.setStatus("APPROVED");
        collab.setSolutionStatus("Active Collaboration");
        collab.setFundingStatus("Approved");
        if (adminNotes != null) {
            collab.setAdminFeedback(adminNotes);
        }
        collab.setUpdatedAt(Instant.now().toString());

        Collaboration saved = collaborationRepository.save(collab);

        // Update Parent Problem & Initialize Live Tracked Project
        if (collab.getProblemId() != null) {
            Problem prob = problemRepository.findById(collab.getProblemId()).orElse(null);
            if (prob != null) {
                prob.setStatus("Currently Working");
                prob.setAdoptedByIndustry(collab.getCompanyName());
                if (collab.getUniversityName() != null) {
                    prob.setAdoptedByUniversity(collab.getUniversityName());
                }
                prob.setFundingStatus("CSR Co-Funding Sanctioned");
                prob.setCoFundingAmount(collab.getFundingAmount());
                problemRepository.save(prob);

                // Initialize Project Execution Tracking
                try {
                    projectService.initializeProjectForProblem(prob);
                } catch (Exception ignored) {}
            }
        }

        return saved;
    }

    public Collaboration rejectCollaboration(String collaborationId, String rejectionReason) {
        if (collaborationId == null) {
            throw new IllegalArgumentException("Collaboration ID cannot be null.");
        }
        Collaboration collab = collaborationRepository.findById(collaborationId).orElse(null);
        if (collab == null) {
            throw new IllegalArgumentException("Collaboration record not found: " + collaborationId);
        }

        collab.setStatus("REJECTED");
        collab.setSolutionStatus("Rejected");
        collab.setFundingStatus("Rejected");
        collab.setRejectionReason(rejectionReason);
        collab.setUpdatedAt(Instant.now().toString());

        return collaborationRepository.save(collab);
    }

    public IndustryPartner getCurrentIndustryProfile() {
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isEmpty()) {
            return null;
        }
        UserPrincipal principal = principalOpt.get();
        String indId = principal.getIndustryId();
        String cName = principal.getCompanyName() != null ? principal.getCompanyName() : principal.getOrganization();

        if (indId != null && !indId.trim().isEmpty()) {
            IndustryPartner ip = industryRepository.findById(indId.trim()).orElse(null);
            if (ip != null) return ip;
        }

        if (cName != null && !cName.trim().isEmpty()) {
            for (IndustryPartner ip : industryRepository.findAll()) {
                if (ip.getCompanyName() != null && (ip.getCompanyName().equalsIgnoreCase(cName) || ip.getCompanyName().toLowerCase().contains(cName.toLowerCase()) || cName.toLowerCase().contains(ip.getCompanyName().toLowerCase()))) {
                    return ip;
                }
            }
        }

        // Build fallback profile from user entity
        IndustryPartner fallback = new IndustryPartner();
        fallback.setId(indId != null ? indId : ("IND-" + principal.getId()));
        fallback.setCompanyName(cName != null ? cName : principal.getFullName());
        fallback.setHeadquarters(principal.getDistrict() != null ? principal.getDistrict() : "Jharkhand");
        fallback.setContactPerson(principal.getFullName());
        fallback.setContactEmail(principal.getEmail());
        fallback.setContactPhone(principal.getDistrict());
        fallback.setExpertiseSectors(List.of("Water Resources", "Urban Infrastructure", "Public Health", "Renewable Energy"));
        fallback.setTotalFundingCommitted("₹ 50 Lakhs - 2 Cr");
        fallback.setStatus("Verified State Partner");
        fallback.setActiveProjectsSupported(0);
        return fallback;
    }

    public List<Problem> getMyMatchedProblems() {
        IndustryPartner profile = getCurrentIndustryProfile();
        if (profile == null) {
            return Collections.emptyList();
        }

        final String indId = profile.getId();
        final String cName = profile.getCompanyName();
        final List<String> csrSectors = profile.getExpertiseSectors() != null ? profile.getExpertiseSectors() : Collections.emptyList();

        List<Problem> all = problemRepository.findAll();
        return all.stream().filter(p -> {
            String appStatus = p.getApprovalStatus();
            String st = p.getStatus() != null ? p.getStatus() : "";
            if ("PENDING_ADMIN_REVIEW".equalsIgnoreCase(appStatus) ||
                "REJECTED_BY_ADMIN".equalsIgnoreCase(appStatus) ||
                "Pending Admin Review".equalsIgnoreCase(st) ||
                "Under AI Analysis".equalsIgnoreCase(st)) {
                return false;
            }

            // 1. Explicit matched IDs match
            if (p.getMatchedIndustryIds() != null && !p.getMatchedIndustryIds().isEmpty()) {
                if ((indId != null && p.getMatchedIndustryIds().contains(indId)) ||
                    (cName != null && p.getMatchedIndustryIds().stream().anyMatch(m -> m.equalsIgnoreCase(cName) || cName.toLowerCase().contains(m.toLowerCase())))) {
                    return true;
                }
            }

            // 2. Adopted or assigned to this industry
            if (cName != null && p.getAdoptedByIndustry() != null && p.getAdoptedByIndustry().equalsIgnoreCase(cName)) {
                return true;
            }

            // 3. CSR Sector alignment for this specific industry
            if (!csrSectors.isEmpty() && (p.getMatchedIndustryIds() == null || p.getMatchedIndustryIds().isEmpty())) {
                String probDomain = (p.getDomain() != null ? p.getDomain() : (p.getCategory() != null ? p.getCategory() : "")).toLowerCase();
                return csrSectors.stream().anyMatch(s -> probDomain.contains(s.toLowerCase()) || s.toLowerCase().contains(probDomain));
            }

            return false;
        }).toList();
    }

    public List<Project> getMyProjects() {
        IndustryPartner profile = getCurrentIndustryProfile();
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isEmpty()) {
            return Collections.emptyList();
        }
        UserPrincipal principal = principalOpt.get();
        String indId = profile != null ? profile.getId() : principal.getIndustryId();
        String cName = profile != null ? profile.getCompanyName() : (principal.getCompanyName() != null ? principal.getCompanyName() : principal.getOrganization());

        Map<String, Project> resultMap = new LinkedHashMap<>();
        if (indId != null) {
            for (Project p : projectService.getAllProjects()) {
                if (indId.equalsIgnoreCase(p.getIndustryId())) {
                    if (p.getId() != null) resultMap.put(p.getId(), p);
                }
            }
        }
        if (cName != null) {
            for (Project p : projectService.getAllProjects()) {
                if (p.getCompanyName() != null && p.getCompanyName().equalsIgnoreCase(cName)) {
                    if (p.getId() != null) resultMap.put(p.getId(), p);
                }
            }
        }
        if (principal.getId() != null) {
            for (Project p : projectService.getAllProjects()) {
                if (principal.getId().equals(p.getIndustryUserId())) {
                    if (p.getId() != null) resultMap.put(p.getId(), p);
                }
            }
        }
        return new ArrayList<>(resultMap.values());
    }

    public Map<String, Object> getIndustryMetrics() {
        return getIndustryMetrics(null, null, null);
    }

    public Map<String, Object> getIndustryMetrics(String industryId, String userId, String companyName) {
        List<Problem> matchedProblems = getMyMatchedProblems();
        List<Collaboration> collabs = getMyCollaborations();
        List<Project> projects = getMyProjects();

        long matchedCount = matchedProblems.size();
        long commitmentsCount = collabs.size();
        long activeCollabsCount = collabs.stream().filter(c -> !"REJECTED".equalsIgnoreCase(c.getStatus())).count();
        long activeProjectsCount = projects.stream().filter(p -> !"RESOLVED".equalsIgnoreCase(p.getStatus())).count();

        // Calculate total confirmed funding committed
        double totalFundingLakhs = 0.0;
        for (Collaboration c : collabs) {
            if (c.getFundingAmount() != null) {
                String raw = c.getFundingAmount().replaceAll("[^0-9.]", "").trim();
                if (!raw.isEmpty()) {
                    try {
                        double val = Double.parseDouble(raw);
                        if (c.getFundingAmount().toLowerCase().contains("cr")) {
                            totalFundingLakhs += val * 100.0;
                        } else {
                            totalFundingLakhs += val;
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }
        }

        String formattedFunding = totalFundingLakhs >= 100.0 ?
                String.format("₹ %.2f Cr", totalFundingLakhs / 100.0) :
                (totalFundingLakhs > 0 ? String.format("₹ %.1f Lakhs", totalFundingLakhs) : "₹ 0");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("matchedOpportunities", matchedCount);
        result.put("csrCommitments", commitmentsCount);
        result.put("myProposals", commitmentsCount);
        result.put("activeCollaborations", activeCollabsCount);
        result.put("activeProjects", activeProjectsCount);
        result.put("totalFundingCommitted", formattedFunding);

        // Backward compatibility keys
        result.put("totalProblems", matchedCount);
        result.put("newProblems", matchedCount);
        result.put("currentlyWorking", activeProjectsCount);
        result.put("fundsApproved", activeCollabsCount);

        return result;
    }

    public IndustryPartner updateIndustryProfile(IndustryPartner updated) {
        if (updated == null) return null;
        IndustryPartner current = getCurrentIndustryProfile();
        String targetId = (current != null && current.getId() != null) ? current.getId() : updated.getId();
        if (targetId == null) {
            targetId = "IND-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            updated.setId(targetId);
        } else {
            updated.setId(targetId);
        }

        if (updated.getCompanyName() == null && current != null) updated.setCompanyName(current.getCompanyName());
        if (updated.getHeadquarters() == null && current != null) updated.setHeadquarters(current.getHeadquarters());
        if (updated.getStatus() == null && current != null) updated.setStatus(current.getStatus());

        return industryRepository.save(updated);
    }
}

