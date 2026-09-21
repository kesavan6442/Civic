package gov.jharkhand.civicconnect.service;

import gov.jharkhand.civicconnect.model.Notification;
import gov.jharkhand.civicconnect.repository.NotificationRepository;
import gov.jharkhand.civicconnect.security.SecurityUtils;
import gov.jharkhand.civicconnect.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public Notification sendNotification(String recipientUserId, String recipientRole, String title, String message, String type, String referenceId) {
        Notification notification = new Notification(recipientUserId, recipientRole, title, message, type, referenceId);
        return notificationRepository.save(notification);
    }

    public List<Notification> getMyNotifications() {
        Optional<UserPrincipal> principalOpt = SecurityUtils.getCurrentUserPrincipal();
        if (principalOpt.isEmpty()) {
            return Collections.emptyList();
        }
        UserPrincipal principal = principalOpt.get();
        java.util.Set<String> seenIds = new java.util.HashSet<>();
        List<Notification> results = new ArrayList<>();

        if (principal.getId() != null) {
            for (Notification n : notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(principal.getId())) {
                if (n != null && n.getId() != null && seenIds.add(n.getId())) {
                    results.add(n);
                }
            }
        }
        if (principal.getEmail() != null) {
            for (Notification n : notificationRepository.findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(principal.getEmail())) {
                if (n != null && n.getId() != null && seenIds.add(n.getId())) {
                    results.add(n);
                }
            }
        }
        if (principal.getRole() != null) {
            for (Notification n : notificationRepository.findByRecipientRoleOrderByCreatedAtDesc(principal.getRole().name())) {
                if (n != null && n.getId() != null && seenIds.add(n.getId())) {
                    results.add(n);
                }
            }
        }
        return results;
    }

    public Notification markAsRead(String notificationId) {
        if (notificationId == null) return null;
        Notification n = notificationRepository.findById(notificationId).orElse(null);
        if (n != null) {
            n.setRead(true);
            return notificationRepository.save(n);
        }
        return null;
    }
}
