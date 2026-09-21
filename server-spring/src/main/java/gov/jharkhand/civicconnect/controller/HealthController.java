package gov.jharkhand.civicconnect.controller;

import gov.jharkhand.civicconnect.dto.ApiResponse;
import gov.jharkhand.civicconnect.repository.IndustryRepository;
import gov.jharkhand.civicconnect.repository.ProblemRepository;
import gov.jharkhand.civicconnect.repository.UniversityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
public class HealthController {

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private IndustryRepository industryRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "online",
                "backend", "Java Spring Boot 3",
                "portal", "Civic Connect",
                "state", "Government of Jharkhand",
                "roles", List.of(
                        Map.of("id", "citizen", "name", "Citizen", "hindi", "नागरिक", "color", "#036D33"),
                        Map.of("id", "university", "name", "University", "hindi", "विश्वविद्यालय", "color", "#024D24"),
                        Map.of("id", "industry", "name", "Industry", "hindi", "उद्योग", "color", "#036D33"),
                        Map.of("id", "admin", "name", "Admin", "hindi", "प्रशासन", "color", "#C62828")
                ),
                "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/api/roles/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRoleStats() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "citizensRegistered", 128450,
                "universitiesConnected", universityRepository.count(),
                "industryPartners", industryRepository.count(),
                "totalProblemsLogged", problemRepository.count(),
                "resolvedGrievances", 94210,
                "districtsCovered", 24
        )));
    }
}
