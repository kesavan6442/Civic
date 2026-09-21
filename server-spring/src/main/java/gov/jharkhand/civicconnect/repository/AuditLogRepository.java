package gov.jharkhand.civicconnect.repository;

import gov.jharkhand.civicconnect.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findByEntityId(String entityId);
    List<AuditLog> findByEntityIdOrderByTimestampDesc(String entityId);
    List<AuditLog> findByEventTypeOrderByTimestampDesc(String eventType);
}
