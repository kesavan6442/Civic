package gov.jharkhand.civicconnect.repository;

import gov.jharkhand.civicconnect.model.Feedback;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends MongoRepository<Feedback, String> {
    List<Feedback> findByProblemId(String problemId);
}
