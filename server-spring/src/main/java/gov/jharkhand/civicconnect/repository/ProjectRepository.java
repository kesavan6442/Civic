package gov.jharkhand.civicconnect.repository;

import gov.jharkhand.civicconnect.model.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends MongoRepository<Project, String> {
    List<Project> findByProblemId(String problemId);
    List<Project> findByUniversityId(String universityId);
    List<Project> findByIndustryId(String industryId);
}
