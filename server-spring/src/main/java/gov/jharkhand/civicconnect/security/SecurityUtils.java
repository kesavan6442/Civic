package gov.jharkhand.civicconnect.security;

import gov.jharkhand.civicconnect.model.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Optional<UserPrincipal> getCurrentUserPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return Optional.of((UserPrincipal) authentication.getPrincipal());
        }
        return Optional.empty();
    }

    public static String getCurrentUserId() {
        return getCurrentUserPrincipal().map(UserPrincipal::getId).orElse(null);
    }

    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        if (authentication.getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) authentication.getPrincipal()).getUsername();
        }
        return authentication.getName();
    }

    public static Role getCurrentUserRole() {
        return getCurrentUserPrincipal().map(UserPrincipal::getRole).orElse(null);
    }

    public static boolean isAdmin() {
        return getCurrentUserPrincipal()
                .map(p -> p.getRole() == Role.ADMIN)
                .orElse(false);
    }

    public static boolean isUniversity() {
        return getCurrentUserPrincipal()
                .map(p -> p.getRole() == Role.UNIVERSITY)
                .orElse(false);
    }

    public static boolean isIndustry() {
        return getCurrentUserPrincipal()
                .map(p -> p.getRole() == Role.INDUSTRY)
                .orElse(false);
    }

    public static String getCurrentUniversityId() {
        return getCurrentUserPrincipal()
                .map(p -> {
                    if (p.getUniversityId() != null && !p.getUniversityId().trim().isEmpty()) {
                        return p.getUniversityId().trim();
                    }
                    if (p.getUniversityName() != null && !p.getUniversityName().trim().isEmpty()) {
                        return p.getUniversityName().trim();
                    }
                    if (p.getOrganization() != null && !p.getOrganization().trim().isEmpty()) {
                        return p.getOrganization().trim();
                    }
                    return null;
                })
                .orElse(null);
    }

    public static String getCurrentIndustryId() {
        return getCurrentUserPrincipal()
                .map(p -> {
                    if (p.getIndustryId() != null && !p.getIndustryId().trim().isEmpty()) {
                        return p.getIndustryId().trim();
                    }
                    if (p.getCompanyName() != null && !p.getCompanyName().trim().isEmpty()) {
                        return p.getCompanyName().trim();
                    }
                    if (p.getOrganization() != null && !p.getOrganization().trim().isEmpty()) {
                        return p.getOrganization().trim();
                    }
                    return null;
                })
                .orElse(null);
    }

    public static String getCurrentInstitutionName() {
        return getCurrentUserPrincipal()
                .map(p -> {
                    if (p.getUniversityName() != null && !p.getUniversityName().trim().isEmpty()) {
                        return p.getUniversityName().trim();
                    }
                    if (p.getCompanyName() != null && !p.getCompanyName().trim().isEmpty()) {
                        return p.getCompanyName().trim();
                    }
                    if (p.getOrganization() != null && !p.getOrganization().trim().isEmpty()) {
                        return p.getOrganization().trim();
                    }
                    return p.getFullName();
                })
                .orElse(null);
    }

    public static boolean isOwnerOrAdmin(String resourceOwnerId) {
        if (isAdmin()) {
            return true;
        }
        String currentUserId = getCurrentUserId();
        return currentUserId != null && resourceOwnerId != null && currentUserId.equals(resourceOwnerId);
    }
}
