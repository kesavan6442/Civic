package gov.jharkhand.civicconnect.controller;

import gov.jharkhand.civicconnect.dto.ApiResponse;
import gov.jharkhand.civicconnect.model.Project;
import gov.jharkhand.civicconnect.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<Project>>> getMyProjects() {
        List<Project> list = projectService.getMyProjects();
        return ResponseEntity.ok(ApiResponse.ok("Projects retrieved successfully", list));
    }

    @GetMapping("/{problemId}")
    public ResponseEntity<ApiResponse<Project>> getProjectByProblemId(@PathVariable String problemId) {
        Project project = projectService.getProjectByProblemId(problemId);
        if (project == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Project not found for problem: " + problemId));
        }
        return ResponseEntity.ok(ApiResponse.ok("Project retrieved successfully", project));
    }

    @PatchMapping("/{problemId}/progress")
    public ResponseEntity<ApiResponse<Project>> updateProjectProgress(
            @PathVariable String problemId,
            @RequestBody Map<String, Object> progressData) {
        try {
            Project updated = projectService.updateProjectProgress(problemId, progressData);
            return ResponseEntity.ok(ApiResponse.ok("Project milestone progress updated successfully", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        } catch (org.springframework.dao.OptimisticLockingFailureException e) {
            return ResponseEntity.status(409).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{problemId}/submit-completion")
    public ResponseEntity<ApiResponse<Project>> submitProjectCompletion(
            @PathVariable String problemId,
            @RequestBody Map<String, Object> completionData) {
        try {
            Project completed = projectService.submitProjectCompletion(problemId, completionData);
            return ResponseEntity.ok(ApiResponse.ok("Project completion submitted for administrative review", completed));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        }
    }
}
