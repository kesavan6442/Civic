package gov.jharkhand.civicconnect.controller;

import gov.jharkhand.civicconnect.dto.ApiResponse;
import gov.jharkhand.civicconnect.model.Notification;
import gov.jharkhand.civicconnect.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications() {
        List<Notification> list = notificationService.getMyNotifications();
        return ResponseEntity.ok(ApiResponse.ok("Notifications retrieved successfully", list));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Notification>> markAsRead(@PathVariable String id) {
        Notification updated = notificationService.markAsRead(id);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", updated));
    }
}
