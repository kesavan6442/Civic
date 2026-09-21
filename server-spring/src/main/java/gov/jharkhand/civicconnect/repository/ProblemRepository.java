package gov.jharkhand.civicconnect.repository;

import gov.jharkhand.civicconnect.model.Problem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemRepository extends MongoRepository<Problem, String> {
    List<Problem> findByDistrictIgnoreCase(String district);
    List<Problem> findByCategoryIgnoreCase(String category);
    List<Problem> findByStatusIgnoreCase(String status);
    List<Problem> findByPriorityIgnoreCase(String priority);
    List<Problem> findByUserId(String userId);
    List<Problem> findByCitizenEmailIgnoreCase(String citizenEmail);
    List<Problem> findByCitizenPhone(String citizenPhone);
    List<Problem> findByApprovalStatusIgnoreCase(String approvalStatus);
    List<Problem> findByMatchedUniversityIdsContaining(String universityId);
    List<Problem> findByMatchedIndustryIdsContaining(String industryId);
}
