package gov.jharkhand.civicconnect.service;

import gov.jharkhand.civicconnect.model.*;
import gov.jharkhand.civicconnect.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class AssignmentService {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private SolutionRepository solutionRepository;

    @Autowired
    private ProblemService problemService;

    public List<Assignment> getAllAssignments() {
        List<Assignment> list = assignmentRepository.findAll();
        for (Assignment a : list) {
            DeadlineInfo dInfo = problemService.calculateDeadlineInfo(a.getDeadlineDate(), a.getSlaTimelineDays() != null ? a.getSlaTimelineDays() : 90);
            a.setDeadlineInfo(dInfo);
        }
        return list;
    }

    public Assignment assignProblem(String problemId, String universityId, String solutionId, String decisionNotes) {
        Problem problem = problemRepository.findById(problemId).orElse(null);
        University university = universityRepository.findById(universityId).orElse(null);
        Solution solution = solutionRepository.findById(solutionId).orElse(null);

        String asgnId = "ASGN-" + problemId;
        Assignment assignment = new Assignment();
        assignment.setId(asgnId);
        assignment.setProblemId(problemId);
        assignment.setProblemTitle(problem != null ? problem.getTitle() : "Civic Problem Statement");
        assignment.setProblemCategory(problem != null ? problem.getCategory() : "Civil Infrastructure");
        assignment.setUniversityId(universityId);
        assignment.setUniversityName(university != null ? university.getName() : "Jharkhand State University");
        assignment.setDepartment(solution != null && solution.getDepartment() != null ? solution.getDepartment() : (university != null && !university.getDepartments().isEmpty() ? university.getDepartments().get(0) : "Engineering R&D"));
        assignment.setSolutionId(solutionId);
        assignment.setSolutionTitle(solution != null ? solution.getSolutionTitle() : "Approved Technical Proposal");
        assignment.setEstimatedCost(solution != null ? solution.getEstimatedCost() : "₹ 5.0 Lakhs");
        assignment.setEstimatedTimeWeeks(solution != null && solution.getEstimatedTimeWeeks() != null ? solution.getEstimatedTimeWeeks() : 8);
        assignment.setAssignedDate(LocalDate.now().toString());
        assignment.setDeadlineDate(LocalDate.now().plusDays(90).toString());
        assignment.setDeadlineMonths(3);
        assignment.setSlaTimelineDays(90);
        assignment.setStatus("In Progress");
        assignment.setDecisionNotes(decisionNotes);
        assignment.setMilestones(List.of(
                new Milestone("Phase 1: Laboratory Prototype & Simulation", 100, true),
                new Milestone("Phase 2: District Field Deployment & Sensor Telemetry", 35, false),
                new Milestone("Phase 3: Municipal Integration & Citizen Validation", 0, false)
        ));

        DeadlineInfo dInfo = problemService.calculateDeadlineInfo(assignment.getDeadlineDate(), 90);
        assignment.setDeadlineInfo(dInfo);

        assignmentRepository.save(assignment);

        // Update Problem and Solution status in MongoDB
        if (problem != null) {
            problem.setStatus("Currently Working");
            problemRepository.save(problem);
        }

        if (solution != null) {
            solution.setStatus("Assigned");
            solutionRepository.save(solution);
        }

        return assignment;
    }

    public Assignment getAssignmentById(String id) {
        Assignment a = assignmentRepository.findById(id).orElse(null);
        if (a != null) {
            DeadlineInfo dInfo = problemService.calculateDeadlineInfo(a.getDeadlineDate(), a.getSlaTimelineDays() != null ? a.getSlaTimelineDays() : 90);
            a.setDeadlineInfo(dInfo);
        }
        return a;
    }
}
