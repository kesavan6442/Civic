package gov.jharkhand.civicconnect.repository;

import gov.jharkhand.civicconnect.model.Solution;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SolutionRepository extends MongoRepository<Solution, String> {
    List<Solution> findByProblemId(String problemId);
    List<Solution> findByUniversityId(String universityId);
    List<Solution> findByUniversityNameIgnoreCase(String universityName);
    List<Solution> findByCompanyId(String companyId);
    List<Solution> findByCompanyNameIgnoreCase(String companyName);
    List<Solution> findByUserId(String userId);
    List<Solution> findByUserEmailIgnoreCase(String userEmail);
}
