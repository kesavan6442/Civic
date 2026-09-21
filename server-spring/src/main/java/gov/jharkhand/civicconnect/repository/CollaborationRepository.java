package gov.jharkhand.civicconnect.repository;

import gov.jharkhand.civicconnect.model.Collaboration;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollaborationRepository extends MongoRepository<Collaboration, String> {
    List<Collaboration> findByProblemId(String problemId);
    List<Collaboration> findByIndustryId(String industryId);
    List<Collaboration> findByUniversityId(String universityId);
    List<Collaboration> findByCompanyNameIgnoreCase(String companyName);
    List<Collaboration> findByUniversityNameIgnoreCase(String universityName);
    List<Collaboration> findByUserId(String userId);
    List<Collaboration> findByUserEmailIgnoreCase(String userEmail);
    List<Collaboration> findByStatus(String status);
    List<Collaboration> findByProblemIdAndStatus(String problemId, String status);
}
