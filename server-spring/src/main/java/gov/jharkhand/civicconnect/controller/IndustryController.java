package gov.jharkhand.civicconnect.controller;

import gov.jharkhand.civicconnect.dto.ApiResponse;
import gov.jharkhand.civicconnect.model.Collaboration;
import gov.jharkhand.civicconnect.model.IndustryPartner;
import gov.jharkhand.civicconnect.model.Problem;
import gov.jharkhand.civicconnect.model.Project;
import gov.jharkhand.civicconnect.security.SecurityUtils;
import gov.jharkhand.civicconnect.service.IndustryService;
import gov.jharkhand.civicconnect.service.ProblemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class IndustryController {

    @Autowired
    private IndustryService industryService;

    @Autowired
    private ProblemService problemService;

    @GetMapping("/api/industry/partners")
    public ResponseEntity<ApiResponse<List<IndustryPartner>>> getAllPartners() {
        List<IndustryPartner> list = industryService.getAllPartners();
        ApiResponse<List<IndustryPartner>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/industry/me")
    public ResponseEntity<ApiResponse<IndustryPartner>> getMyIndustryProfile() {
        IndustryPartner profile = industryService.getCurrentIndustryProfile();
        if (profile == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Authenticated industry profile not found"));
        }
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @GetMapping(value = {"/api/industry/problems/matched", "/api/industry/problems"})
    public ResponseEntity<ApiResponse<List<Problem>>> getIndustryProblems(
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String category
    ) {
        // Strict tenant isolation: return opportunities matched to current industry
        List<Problem> list = industryService.getMyMatchedProblems();
        if (district != null && !district.equalsIgnoreCase("All")) {
            list = list.stream().filter(p -> p.getDistrict() != null && p.getDistrict().equalsIgnoreCase(district)).toList();
        }
        if (category != null && !category.equalsIgnoreCase("All")) {
            list = list.stream().filter(p -> p.getCategory() != null && p.getCategory().toLowerCase().contains(category.toLowerCase())).toList();
        }
        ApiResponse<List<Problem>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = {"/api/collaborations/mine", "/api/industry/collaborations/mine", "/api/industry/proposals/mine"})
    public ResponseEntity<ApiResponse<List<Collaboration>>> getMyCollaborations() {
        List<Collaboration> list = industryService.getMyCollaborations();
        ApiResponse<List<Collaboration>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = {"/api/collaborations/{id}", "/api/industry/collaborations/{id}"})
    public ResponseEntity<ApiResponse<Collaboration>> getCollaborationById(@PathVariable String id) {
        Collaboration collab = industryService.getCollaborationById(id);
        if (collab == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Collaboration not found: " + id));
        }
        return ResponseEntity.ok(ApiResponse.ok(collab));
    }

    @GetMapping(value = {"/api/collaborations/problem/{problemId}", "/api/industry/collaborations/problem/{problemId}"})
    public ResponseEntity<ApiResponse<List<Collaboration>>> getCollaborationsByProblem(@PathVariable String problemId) {
        List<Collaboration> list = industryService.getCollaborationsByProblemId(problemId);
        ApiResponse<List<Collaboration>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/industry/collaborations")
    public ResponseEntity<ApiResponse<List<Collaboration>>> getCollaborations(
            @RequestParam(required = false) String industryId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String companyName
    ) {
        List<Collaboration> list = industryService.getMyCollaborations();
        ApiResponse<List<Collaboration>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = {"/api/industry/projects/mine"})
    public ResponseEntity<ApiResponse<List<Project>>> getMyIndustryProjects() {
        List<Project> list = industryService.getMyProjects();
        ApiResponse<List<Project>> response = ApiResponse.ok(list);
        response.setCount(list.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = {"/api/collaborations", "/api/industry/collaborate", "/api/industry/sponsor", "/api/funding-approvals"})
    public ResponseEntity<ApiResponse<Collaboration>> registerCollaboration(@RequestBody Collaboration collaboration) {
        Collaboration created = industryService.registerCollaboration(collaboration);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("CSR Collaboration commitment submitted for Admin Review", created));
    }

    @GetMapping("/api/industry/metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getIndustryMetrics(
            @RequestParam(required = false) String industryId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String companyName
    ) {
        Map<String, Object> metrics = industryService.getIndustryMetrics(industryId, userId, companyName);
        return ResponseEntity.ok(ApiResponse.ok(metrics));
    }

    @PutMapping(value = {"/api/industry/profile", "/api/industry/me"})
    public ResponseEntity<ApiResponse<IndustryPartner>> updateIndustryProfile(@RequestBody IndustryPartner updatedProfile) {
        IndustryPartner saved = industryService.updateIndustryProfile(updatedProfile);
        return ResponseEntity.ok(ApiResponse.ok("Industry CSR Capability Profile updated successfully", saved));
    }
}

