package gov.jharkhand.civicconnect.repository;

import gov.jharkhand.civicconnect.model.Milestone;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MilestoneRepository extends MongoRepository<Milestone, String> {
}
