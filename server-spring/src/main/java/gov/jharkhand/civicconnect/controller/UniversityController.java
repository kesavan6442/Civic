package gov.jharkhand.civicconnect.controller;

import gov.jharkhand.civicconnect.dto.ApiResponse;
import gov.jharkhand.civicconnect.model.Collaboration;
import gov.jharkhand.civicconnect.model.Problem;
import gov.jharkhand.civicconnect.model.Project;
import gov.jharkhand.civicconnect.model.Solution;
import gov.jharkhand.civicconnect.model.University;
import gov.jharkhand.civicconnect.service.SolutionService;
import gov.jharkhand.civicconnect.service.UniversityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class UniversityController {

    @Autowired
    private UniversityService universityService;

    @Autowired
    private SolutionService solutionService;

    @GetMapping("/api/universities")
    public ResponseEntity<ApiResponse<List<University>>> getAllUniversities() {
        List<University> list = universityService.getAllUniversities();
        ApiResponse<List<University>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/universities/{id}")
    public ResponseEntity<ApiResponse<University>> getUniversityById(@PathVariable String id) {
        University u = universityService.getUniversityById(id);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("University not found"));
        }
        return ResponseEntity.ok(ApiResponse.ok(u));
    }

    @GetMapping("/api/university/me")
    public ResponseEntity<ApiResponse<University>> getMyUniversityProfile() {
        University profile = universityService.getCurrentUniversityProfile();
        if (profile == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Authenticated university profile not found"));
        }
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @GetMapping(value = {"/api/problems/matched", "/api/university/problems/matched", "/api/university/problems"})
    public ResponseEntity<ApiResponse<List<Problem>>> getMyMatchedProblems() {
        List<Problem> list = universityService.getMyMatchedProblems();
        ApiResponse<List<Problem>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/university/metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUniversityMetrics(
            @RequestParam(required = false) String universityId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String universityName
    ) {
        Map<String, Object> metrics = universityService.getMetrics(universityId, userId, universityName);
        return ResponseEntity.ok(ApiResponse.ok(metrics));
    }

    @GetMapping(value = {"/api/university/solutions/mine", "/api/solutions/mine"})
    public ResponseEntity<ApiResponse<List<Solution>>> getMyUniversitySolutions() {
        List<Solution> list = universityService.getMySolutions();
        ApiResponse<List<Solution>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = {"/api/university/collaborations/mine", "/api/collaborations/mine"})
    public ResponseEntity<ApiResponse<List<Collaboration>>> getMyUniversityCollaborations() {
        List<Collaboration> list = universityService.getMyCollaborations();
        ApiResponse<List<Collaboration>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = {"/api/university/projects/mine", "/api/projects/mine"})
    public ResponseEntity<ApiResponse<List<Project>>> getMyUniversityProjects() {
        List<Project> list = universityService.getMyProjects();
        ApiResponse<List<Project>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/university/solutions")
    public ResponseEntity<ApiResponse<Solution>> submitSolution(@RequestBody Solution solution) {
        Solution created = solutionService.submitSolution(solution);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Solution submitted successfully", created));
    }

    @PutMapping(value = {"/api/university/profile", "/api/university/me"})
    public ResponseEntity<ApiResponse<University>> updateUniversityProfile(@RequestBody University updatedProfile) {
        University saved = universityService.updateUniversityProfile(updatedProfile);
        return ResponseEntity.ok(ApiResponse.ok("University Capability Profile updated successfully", saved));
    }
}

