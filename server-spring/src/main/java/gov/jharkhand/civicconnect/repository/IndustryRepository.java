package gov.jharkhand.civicconnect.repository;

import gov.jharkhand.civicconnect.model.IndustryPartner;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IndustryRepository extends MongoRepository<IndustryPartner, String> {
}
