package gov.jharkhand.civicconnect.service;

import gov.jharkhand.civicconnect.model.AuditLog;
import gov.jharkhand.civicconnect.repository.AuditLogRepository;
import gov.jharkhand.civicconnect.security.SecurityUtils;
import gov.jharkhand.civicconnect.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public enum Action {
        LOGIN_SUCCESS,
        LOGIN_FAILURE,
        REGISTER,
        REGISTRATION_SUCCESS,
        REGISTRATION_FAILURE,
        TOKEN_REFRESH,
        LOGOUT,
        PROBLEM_CREATED,
        PROBLEM_UPDATED,
        MORE_INFO_RESPONDED,
        SOLUTION_SUBMITTED,
        COLLABORATION_CREATED,
        COLLABORATION_APPROVED,
        PROJECT_UPDATED,
        ADMIN_ACTION
    }

    public AuditLog logSecurityEvent(Action action, String userId, String username, String targetId, String ipAddress, String details) {
        AuditLog log = new AuditLog();
        log.setEventType(action != null ? action.name() : "SECURITY_EVENT");
        log.setEntityType(targetId != null ? "TARGET" : "AUTH");
        log.setEntityId(targetId);
        log.setPerformedByUserId(userId);
        log.setPerformedByEmail(username);
        log.setDetails(details);
        log.setMetadata(Map.of("ipAddress", ipAddress != null ? ipAddress : "unknown"));

        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isPresent()) {
            UserPrincipal p = principalOpt.get();
            if (log.getPerformedByUserId() == null) log.setPerformedByUserId(p.getId());
            if (log.getPerformedByEmail() == null) log.setPerformedByEmail(p.getEmail());
            if (p.getRole() != null) log.setPerformedByRole(p.getRole().name());
        } else {
            log.setPerformedByRole("SYSTEM");
        }

        return auditLogRepository.save(log);
    }

    public AuditLog logEvent(String eventType, String entityType, String entityId, String details, Map<String, Object> metadata) {
        return logEvent(eventType, entityType, entityId, details, "MANUAL", "SUCCESS", metadata);
    }

    public AuditLog logEvent(String eventType, String entityType, String entityId, String details, String executionMode, String result, Map<String, Object> metadata) {
        AuditLog log = new AuditLog();
        log.setEventType(eventType);
        log.setAction(eventType);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetails(details);
        log.setExecutionMode(executionMode != null ? executionMode : "MANUAL");
        log.setResult(result != null ? result : "SUCCESS");
        log.setMetadata(metadata != null ? metadata : Collections.emptyMap());

        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isPresent()) {
            UserPrincipal p = principalOpt.get();
            log.setPerformedByUserId(p.getId());
            log.setPerformedByEmail(p.getEmail() != null ? p.getEmail() : p.getUsername());
            if (p.getRole() != null) {
                log.setPerformedByRole(p.getRole().name());
            }
        } else {
            log.setPerformedByRole("SYSTEM");
        }

        return auditLogRepository.save(log);
    }

    public List<AuditLog> getLogsForEntity(String entityId) {
        if (entityId == null) return Collections.emptyList();
        return auditLogRepository.findByEntityIdOrderByTimestampDesc(entityId);
    }
}
