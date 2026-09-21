package gov.jharkhand.civicconnect.repository;

import gov.jharkhand.civicconnect.model.University;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UniversityRepository extends MongoRepository<University, String> {
}
