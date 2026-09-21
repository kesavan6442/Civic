package gov.jharkhand.civicconnect.mcp;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface McpTokenRepository extends MongoRepository<McpToken, String> {
    Optional<McpToken> findByTokenHashAndActiveTrue(String tokenHash);
    Optional<McpToken> findByTokenHash(String tokenHash);
    List<McpToken> findByCreatedByAndActiveTrue(String createdBy);
    List<McpToken> findByActiveTrue();
    Optional<McpToken> findFirstByOrderByCreatedAtDesc();
}
