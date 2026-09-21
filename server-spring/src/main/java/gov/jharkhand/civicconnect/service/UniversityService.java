package gov.jharkhand.civicconnect.service;

import gov.jharkhand.civicconnect.model.*;
import gov.jharkhand.civicconnect.repository.*;
import gov.jharkhand.civicconnect.security.SecurityUtils;
import gov.jharkhand.civicconnect.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UniversityService {

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private SolutionRepository solutionRepository;

    @Autowired
    private CollaborationRepository collaborationRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    public List<University> getAllUniversities() {
        return universityRepository.findAll();
    }

    public University getUniversityById(String id) {
        return universityRepository.findById(id).orElse(null);
    }

    public University getCurrentUniversityProfile() {
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isEmpty()) {
            return null;
        }
        UserPrincipal principal = principalOpt.get();
        String uId = principal.getUniversityId();
        String uName = principal.getUniversityName() != null ? principal.getUniversityName() : principal.getOrganization();

        if (uId != null && !uId.trim().isEmpty()) {
            University u = universityRepository.findById(uId.trim()).orElse(null);
            if (u != null) return u;
        }

        if (uName != null && !uName.trim().isEmpty()) {
            for (University u : universityRepository.findAll()) {
                if (u.getName() != null && (u.getName().equalsIgnoreCase(uName) || u.getName().toLowerCase().contains(uName.toLowerCase()) || uName.toLowerCase().contains(u.getName().toLowerCase()))) {
                    return u;
                }
            }
        }

        // Build fallback profile from user entity
        University fallback = new University();
        fallback.setId(uId != null ? uId : ("UNIV-" + principal.getId()));
        fallback.setName(uName != null ? uName : principal.getFullName());
        fallback.setLocation(principal.getDistrict() != null ? principal.getDistrict() : "Jharkhand");
        fallback.setAccreditation("NAAC Accredited Institution");
        fallback.setDepartments(List.of("Engineering & Technology", "Environmental Sciences", "Computer Science & AI"));
        fallback.setExpertise(List.of("Water Management", "Renewable Energy", "Urban Infrastructure", "AI & IoT"));
        fallback.setActiveFacultyCount(24);
        fallback.setCompletedCivicProjects(0);
        return fallback;
    }

    public List<Problem> getMyMatchedProblems() {
        University profile = getCurrentUniversityProfile();
        if (profile == null) {
            return Collections.emptyList();
        }

        final String uId = profile.getId();
        final String uName = profile.getName();
        final List<String> expertise = profile.getExpertise() != null ? profile.getExpertise() : Collections.emptyList();

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
            if (p.getMatchedUniversityIds() != null && !p.getMatchedUniversityIds().isEmpty()) {
                if ((uId != null && p.getMatchedUniversityIds().contains(uId)) ||
                    (uName != null && p.getMatchedUniversityIds().stream().anyMatch(m -> m.equalsIgnoreCase(uName) || uName.toLowerCase().contains(m.toLowerCase())))) {
                    return true;
                }
                return false;
            }

            // 2. Adopted or assigned to this university
            if (uName != null && p.getAdoptedByUniversity() != null && p.getAdoptedByUniversity().equalsIgnoreCase(uName)) {
                return true;
            }
            if (p.getAssignedTo() != null && uName != null) {
                Object assignedName = p.getAssignedTo().get("name");
                if (assignedName != null && assignedName.toString().equalsIgnoreCase(uName)) {
                    return true;
                }
            }

            // 3. Domain alignment for this specific university's expertise
            if (!expertise.isEmpty() && (p.getMatchedUniversityIds() == null || p.getMatchedUniversityIds().isEmpty())) {
                String probDomain = (p.getDomain() != null ? p.getDomain() : (p.getCategory() != null ? p.getCategory() : "")).toLowerCase();
                return expertise.stream().anyMatch(e -> probDomain.contains(e.toLowerCase()) || e.toLowerCase().contains(probDomain));
            }

            return false;
        }).collect(Collectors.toList());
    }

    public List<Solution> getMySolutions() {
        University profile = getCurrentUniversityProfile();
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isEmpty()) {
            return Collections.emptyList();
        }
        UserPrincipal principal = principalOpt.get();
        String uId = profile != null ? profile.getId() : principal.getUniversityId();
        String uName = profile != null ? profile.getName() : principal.getUniversityName();

        Map<String, Solution> resultMap = new LinkedHashMap<>();
        if (uId != null) {
            for (Solution s : solutionRepository.findByUniversityId(uId)) {
                if (s != null && s.getId() != null) resultMap.put(s.getId(), s);
            }
        }
        if (uName != null) {
            for (Solution s : solutionRepository.findByUniversityNameIgnoreCase(uName)) {
                if (s != null && s.getId() != null) resultMap.put(s.getId(), s);
            }
        }
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
        return new ArrayList<>(resultMap.values());
    }

    public List<Collaboration> getMyCollaborations() {
        University profile = getCurrentUniversityProfile();
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isEmpty()) {
            return Collections.emptyList();
        }
        UserPrincipal principal = principalOpt.get();
        String uId = profile != null ? profile.getId() : principal.getUniversityId();
        String uName = profile != null ? profile.getName() : principal.getUniversityName();

        Map<String, Collaboration> resultMap = new LinkedHashMap<>();
        if (uId != null) {
            for (Collaboration c : collaborationRepository.findByUniversityId(uId)) {
                if (c != null && c.getId() != null) resultMap.put(c.getId(), c);
            }
        }
        if (uName != null) {
            for (Collaboration c : collaborationRepository.findByUniversityNameIgnoreCase(uName)) {
                if (c != null && c.getId() != null) resultMap.put(c.getId(), c);
            }
        }
        if (principal.getId() != null) {
            for (Collaboration c : collaborationRepository.findByUserId(principal.getId())) {
                if (c != null && c.getId() != null) resultMap.put(c.getId(), c);
            }
        }
        return new ArrayList<>(resultMap.values());
    }

    public List<Project> getMyProjects() {
        University profile = getCurrentUniversityProfile();
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isEmpty()) {
            return Collections.emptyList();
        }
        UserPrincipal principal = principalOpt.get();
        String uId = profile != null ? profile.getId() : principal.getUniversityId();
        String uName = profile != null ? profile.getName() : (principal.getUniversityName() != null ? principal.getUniversityName() : principal.getOrganization());

        Map<String, Project> resultMap = new LinkedHashMap<>();
        if (uId != null) {
            for (Project p : projectRepository.findByUniversityId(uId)) {
                if (p != null && p.getId() != null) resultMap.put(p.getId(), p);
            }
        }
        if (uName != null) {
            for (Project p : projectRepository.findAll()) {
                if (p.getUniversityName() != null && p.getUniversityName().equalsIgnoreCase(uName)) {
                    if (p.getId() != null) resultMap.put(p.getId(), p);
                }
            }
        }
        if (principal.getId() != null) {
            for (Project p : projectRepository.findAll()) {
                if (principal.getId().equals(p.getUniversityUserId())) {
                    if (p.getId() != null) resultMap.put(p.getId(), p);
                }
            }
        }
        return new ArrayList<>(resultMap.values());
    }

    public Map<String, Object> getMetrics(String universityId, String userId, String universityName) {
        List<Problem> matchedProblems = getMyMatchedProblems();
        List<Solution> proposals = getMySolutions();
        List<Collaboration> collabs = getMyCollaborations();
        List<Project> projects = getMyProjects();

        long matchedCount = matchedProblems.size();
        long proposalsCount = proposals.size();
        long acceptedCount = proposals.stream().filter(s -> "Assigned".equalsIgnoreCase(s.getStatus()) || "Approved".equalsIgnoreCase(s.getStatus()) || "Accepted".equalsIgnoreCase(s.getStatus())).count();
        long collabsCount = collabs.size();
        long activeProjectsCount = projects.stream().filter(p -> !"RESOLVED".equalsIgnoreCase(p.getStatus())).count();
        long completedProjectsCount = projects.stream().filter(p -> "RESOLVED".equalsIgnoreCase(p.getStatus())).count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("matchedProblems", matchedCount);
        result.put("myProposals", proposalsCount);
        result.put("acceptedProposals", acceptedCount);
        result.put("activeCollaborations", collabsCount);
        result.put("activeProjects", activeProjectsCount);
        result.put("completedProjects", completedProjectsCount);

        // Backward compatibility keys
        result.put("totalProblems", matchedCount);
        result.put("newProblems", matchedCount);
        result.put("currentlyWorking", activeProjectsCount);
        result.put("submittedProblems", proposalsCount);
        result.put("fundingApproved", collabsCount);
        result.put("submittedToGovernment", proposalsCount);

        return result;
    }

    public University updateUniversityProfile(University updated) {
        if (updated == null) return null;
        University current = getCurrentUniversityProfile();
        String targetId = (current != null && current.getId() != null) ? current.getId() : updated.getId();
        if (targetId == null) {
            targetId = "UNIV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            updated.setId(targetId);
        } else {
            updated.setId(targetId);
        }

        if (updated.getName() == null && current != null) updated.setName(current.getName());
        if (updated.getLocation() == null && current != null) updated.setLocation(current.getLocation());
        if (updated.getAccreditation() == null && current != null) updated.setAccreditation(current.getAccreditation());
        
        return universityRepository.save(updated);
    }
}

