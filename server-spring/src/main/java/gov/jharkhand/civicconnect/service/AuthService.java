package gov.jharkhand.civicconnect.service;

import gov.jharkhand.civicconnect.dto.AuthRequest;
import gov.jharkhand.civicconnect.dto.AuthResponse;
import gov.jharkhand.civicconnect.dto.RefreshTokenRequest;
import gov.jharkhand.civicconnect.dto.RegisterRequest;
import gov.jharkhand.civicconnect.model.IndustryPartner;
import gov.jharkhand.civicconnect.model.Role;
import gov.jharkhand.civicconnect.model.University;
import gov.jharkhand.civicconnect.model.User;
import gov.jharkhand.civicconnect.repository.IndustryRepository;
import gov.jharkhand.civicconnect.repository.UniversityRepository;
import gov.jharkhand.civicconnect.repository.UserRepository;
import gov.jharkhand.civicconnect.security.JwtTokenProvider;
import gov.jharkhand.civicconnect.security.TokenBlacklistService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private IndustryRepository industryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @Autowired
    private AuditLogService auditLogService;

    private static final Set<String> COMMON_WEAK_PASSWORDS = Set.of(
            "123456", "password", "12345678", "qwerty", "123456789", "12345", "1234", "111111",
            "admin", "welcome", "pass123", "password123", "secret", "jharkhand", "iloveyou"
    );

    public AuthResponse login(AuthRequest request, HttpServletRequest httpRequest) {
        String clientIp = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        return processLogin(request, clientIp);
    }

    public AuthResponse login(AuthRequest request, String clientIp) {
        return processLogin(request, clientIp != null ? clientIp : "127.0.0.1");
    }

    public AuthResponse login(AuthRequest request) {
        return processLogin(request, "127.0.0.1");
    }

    private AuthResponse processLogin(AuthRequest request, String clientIp) {
        String identifier = request.getUsername() != null && !request.getUsername().trim().isEmpty()
                ? request.getUsername().trim()
                : (request.getEmail() != null ? request.getEmail().trim() : "");

        if (identifier.isEmpty()) {
            throw new BadCredentialsException("Username or Email is required for login");
        }

        // Look up by username or email
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElse(null);

        if (user == null) {
            auditLogService.logSecurityEvent(AuditLogService.Action.LOGIN_FAILURE, null, identifier, null, clientIp, "User not found");
            throw new BadCredentialsException("Invalid username/email or password");
        }

        // Verify role match if role requested
        if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            String expectedRole = request.getRole().trim().toUpperCase();
            if (!user.getRole().name().equalsIgnoreCase(expectedRole) && user.getRole() != Role.ADMIN) {
                auditLogService.logSecurityEvent(AuditLogService.Action.LOGIN_FAILURE, user.getId(), user.getUsername(), null, clientIp, "Role mismatch: requested " + expectedRole + ", user has " + user.getRole());
                throw new BadCredentialsException("Account role does not match the requested portal (" + expectedRole + ")");
            }
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
            );
        } catch (Exception e) {
            auditLogService.logSecurityEvent(AuditLogService.Action.LOGIN_FAILURE, user.getId(), user.getUsername(), null, clientIp, "Password authentication failed");
            throw new BadCredentialsException("Invalid username/email or password");
        }

        auditLogService.logSecurityEvent(AuditLogService.Action.LOGIN_SUCCESS, user.getId(), user.getUsername(), null, clientIp, "Role=" + user.getRole());

        String accessToken = jwtTokenProvider.generateAccessToken(user.getUsername(), user.getRole().name(), user.getId());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername(), user.getId());

        // Never expose password hash in response
        User safeUser = sanitizeUser(user);

        return new AuthResponse(accessToken, refreshToken, safeUser, 900); // 15 min expiration in seconds
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        if (token == null || !jwtTokenProvider.validateToken(token)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        if (tokenBlacklistService.isBlacklisted(token)) {
            throw new IllegalArgumentException("Refresh token has been revoked");
        }

        String username = jwtTokenProvider.getUsernameFromJWT(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User account not found"));

        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getUsername(), user.getRole().name(), user.getId());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername(), user.getId());

        return new AuthResponse(newAccessToken, newRefreshToken, sanitizeUser(user), 900);
    }

    public void logout(String token) {
        if (token != null && !token.trim().isEmpty()) {
            String cleanToken = token.trim();
            if (cleanToken.startsWith("Bearer ")) {
                cleanToken = cleanToken.substring(7).trim();
            }
            tokenBlacklistService.blacklistToken(cleanToken);
            try {
                String username = jwtTokenProvider.getUsernameFromJWT(cleanToken);
                auditLogService.logSecurityEvent(AuditLogService.Action.LOGOUT, null, username, null, "127.0.0.1", "Session token revoked and blacklisted");
            } catch (Exception ignored) {}
        }
    }

    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        String clientIp = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        return processRegister(request, clientIp);
    }

    public AuthResponse register(RegisterRequest request, String clientIp) {
        return processRegister(request, clientIp != null ? clientIp : "127.0.0.1");
    }

    public AuthResponse register(RegisterRequest request) {
        return processRegister(request, "127.0.0.1");
    }

    private AuthResponse processRegister(RegisterRequest request, String clientIp) {
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        String username = request.getUsername() != null && !request.getUsername().trim().isEmpty()
                ? request.getUsername().trim()
                : email;

        if (email.isEmpty()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (username.isEmpty()) {
            throw new IllegalArgumentException("Username or Email is required.");
        }

        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("An account with this username already exists.");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        validatePasswordStrength(request.getPassword());

        Role role = request.getRole() != null ? request.getRole() : Role.CITIZEN;

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        String userId = "USR-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 900 + 100);

        User newUser = new User();
        newUser.setId(userId);
        newUser.setUsername(username);
        newUser.setEmail(email);
        newUser.setPassword(encodedPassword);
        newUser.setRole(role);
        newUser.setFullName(request.getFullName() != null ? request.getFullName() : (request.getRepresentativeName() != null ? request.getRepresentativeName() : username));
        newUser.setOrganization(request.getOrganization() != null ? request.getOrganization() : (request.getUniversityName() != null ? request.getUniversityName() : request.getCompanyName()));
        newUser.setDistrict(request.getDistrict() != null ? request.getDistrict() : (request.getCity() != null ? request.getCity() : "Ranchi"));
        newUser.setPhone(request.getPhone());
        newUser.setState(request.getState() != null ? request.getState() : "Jharkhand");
        newUser.setCity(request.getCity() != null ? request.getCity() : newUser.getDistrict());
        newUser.setRepresentativeName(request.getRepresentativeName());
        newUser.setDesignation(request.getDesignation());
        newUser.setUniversityName(request.getUniversityName());
        newUser.setCompanyName(request.getCompanyName());
        newUser.setAreasOfExpertise(request.getAreasOfExpertise() != null ? request.getAreasOfExpertise() : new ArrayList<>());
        newUser.setCapabilities(request.getCapabilities() != null ? request.getCapabilities() : new HashMap<>());
        newUser.setCapabilitiesCount(request.getCapabilitiesCount());
        newUser.setCreatedAt(Instant.now().toString());

        User savedUser = userRepository.save(newUser);

        // Sync linked role entity if applicable
        if (role == Role.UNIVERSITY && request.getUniversityName() != null && !request.getUniversityName().trim().isEmpty()) {
            University univ = new University();
            univ.setId("UNIV-" + savedUser.getId());
            univ.setName(request.getUniversityName());
            univ.setLocation(savedUser.getCity() + ", " + savedUser.getState());
            univ.setExpertise(savedUser.getAreasOfExpertise() != null ? savedUser.getAreasOfExpertise() : List.of("Engineering"));
            univ.setDepartments(savedUser.getAreasOfExpertise() != null && !savedUser.getAreasOfExpertise().isEmpty() ? savedUser.getAreasOfExpertise() : List.of("General Engineering"));
            univ.setActiveFacultyCount(50);
            univ.setCompletedCivicProjects(0);
            universityRepository.save(univ);
        } else if (role == Role.INDUSTRY && request.getCompanyName() != null && !request.getCompanyName().trim().isEmpty()) {
            IndustryPartner ind = new IndustryPartner();
            ind.setId("IND-" + savedUser.getId());
            ind.setCompanyName(request.getCompanyName());
            ind.setHeadquarters(savedUser.getCity() + ", " + savedUser.getState());
            ind.setContactEmail(savedUser.getEmail());
            ind.setContactPhone(savedUser.getPhone());
            ind.setContactPerson(savedUser.getRepresentativeName() != null ? savedUser.getRepresentativeName() : savedUser.getFullName());
            ind.setExpertiseSectors(savedUser.getAreasOfExpertise() != null ? savedUser.getAreasOfExpertise() : List.of("Infrastructure"));
            ind.setStatus("Active");
            ind.setActiveProjectsSupported(0);
            industryRepository.save(ind);
        }

        auditLogService.logSecurityEvent(AuditLogService.Action.REGISTER, savedUser.getId(), savedUser.getUsername(), null, clientIp, "New account created. Role=" + role);

        String accessToken = jwtTokenProvider.generateAccessToken(savedUser.getUsername(), savedUser.getRole().name(), savedUser.getId());
        String refreshToken = jwtTokenProvider.generateRefreshToken(savedUser.getUsername(), savedUser.getId());

        return new AuthResponse(accessToken, refreshToken, sanitizeUser(savedUser), 900);
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }
        if (COMMON_WEAK_PASSWORDS.contains(password.toLowerCase().trim())) {
            throw new IllegalArgumentException("This password is too common and insecure. Please choose a stronger password.");
        }
        boolean hasLetter = false;
        boolean hasDigit = false;
        for (char c : password.toCharArray()) {
            if (Character.isLetter(c)) hasLetter = true;
            if (Character.isDigit(c)) hasDigit = true;
        }
        if (!hasLetter || !hasDigit) {
            throw new IllegalArgumentException("Password must contain a mix of letters and numbers.");
        }
    }

    private User sanitizeUser(User user) {
        User copy = new User();
        copy.setId(user.getId());
        copy.setUsername(user.getUsername());
        copy.setEmail(user.getEmail());
        copy.setRole(user.getRole());
        copy.setFullName(user.getFullName());
        copy.setOrganization(user.getOrganization());
        copy.setDistrict(user.getDistrict());
        copy.setPhone(user.getPhone());
        copy.setState(user.getState());
        copy.setCity(user.getCity());
        copy.setRepresentativeName(user.getRepresentativeName());
        copy.setDesignation(user.getDesignation());
        copy.setCompanyName(user.getCompanyName());
        copy.setUniversityName(user.getUniversityName());
        copy.setAreasOfExpertise(user.getAreasOfExpertise());
        copy.setCapabilities(user.getCapabilities());
        copy.setCapabilitiesCount(user.getCapabilitiesCount());
        copy.setCreatedAt(user.getCreatedAt());
        copy.setPassword(null); // Purge password hash
        return copy;
    }
}
