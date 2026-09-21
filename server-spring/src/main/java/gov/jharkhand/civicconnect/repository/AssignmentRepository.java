package gov.jharkhand.civicconnect.repository;

import gov.jharkhand.civicconnect.model.Assignment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentRepository extends MongoRepository<Assignment, String> {
    Optional<Assignment> findByProblemId(String problemId);
    List<Assignment> findByUniversityId(String universityId);
    List<Assignment> findByUniversityNameIgnoreCase(String universityName);
    List<Assignment> findByUserId(String userId);
    List<Assignment> findByUserEmailIgnoreCase(String userEmail);
}
