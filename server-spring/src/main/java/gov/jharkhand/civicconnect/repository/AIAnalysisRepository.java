package gov.jharkhand.civicconnect.repository;

import gov.jharkhand.civicconnect.model.AIAnalysis;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AIAnalysisRepository extends MongoRepository<AIAnalysis, String> {
    Optional<AIAnalysis> findByProblemId(String problemId);
}
