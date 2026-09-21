package gov.jharkhand.civicconnect.controller;

import gov.jharkhand.civicconnect.dto.ApiResponse;
import gov.jharkhand.civicconnect.dto.AuthRequest;
import gov.jharkhand.civicconnect.dto.AuthResponse;
import gov.jharkhand.civicconnect.dto.RefreshTokenRequest;
import gov.jharkhand.civicconnect.dto.RegisterRequest;
import gov.jharkhand.civicconnect.security.SecurityUtils;
import gov.jharkhand.civicconnect.security.UserPrincipal;
import gov.jharkhand.civicconnect.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping({"/login", "/signin"})
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody @Valid AuthRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIP(httpRequest);
        try {
            AuthResponse response = authService.login(request, clientIp);
            return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
        } catch (org.springframework.security.core.AuthenticationException | IllegalArgumentException e) {
            return ResponseEntity.status(401).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping({"/register", "/signup"})
    public ResponseEntity<ApiResponse<AuthResponse>> register(@RequestBody @Valid RegisterRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIP(httpRequest);
        try {
            AuthResponse response = authService.register(request, clientIp);
            return ResponseEntity.ok(ApiResponse.ok("Registration successful", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@RequestBody @Valid RefreshTokenRequest request, HttpServletRequest httpRequest) {
        try {
            AuthResponse response = authService.refreshToken(request);
            return ResponseEntity.ok(ApiResponse.ok("Token refreshed successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest httpRequest) {
        String bearerToken = httpRequest.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            authService.logout(bearerToken.substring(7).trim());
        }
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserPrincipal>> getCurrentUser() {
        return SecurityUtils.getCurrentUserPrincipal()
                .map(user -> ResponseEntity.ok(ApiResponse.ok("Current user profile", user)))
                .orElse(ResponseEntity.status(401).body(ApiResponse.error("Not authenticated")));
    }

    private String getClientIP(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isEmpty()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
