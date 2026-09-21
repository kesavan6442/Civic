package gov.jharkhand.civicconnect;

import gov.jharkhand.civicconnect.dto.AuthRequest;
import gov.jharkhand.civicconnect.dto.AuthResponse;
import gov.jharkhand.civicconnect.dto.RefreshTokenRequest;
import gov.jharkhand.civicconnect.dto.RegisterRequest;
import gov.jharkhand.civicconnect.model.Problem;
import gov.jharkhand.civicconnect.model.Role;
import gov.jharkhand.civicconnect.model.User;
import gov.jharkhand.civicconnect.repository.UserRepository;
import gov.jharkhand.civicconnect.security.JwtTokenProvider;
import gov.jharkhand.civicconnect.security.TokenBlacklistService;
import gov.jharkhand.civicconnect.service.AuthService;
import gov.jharkhand.civicconnect.service.FileUploadService;
import gov.jharkhand.civicconnect.service.ProblemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class SecurityIntegrationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @Autowired
    private FileUploadService fileUploadService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProblemService problemService;

    private static final String TEST_USER = "sectest_user_" + System.currentTimeMillis();
    private static final String TEST_EMAIL = "sectest_" + System.currentTimeMillis() + "@jharkhand.gov.in";
    private static final String STRONG_PASS = "JharkhandSecure#2026!";

    @BeforeEach
    void setup() {
        // Ensure test user exists
        if (userRepository.findByUsername(TEST_USER).isEmpty()) {
            RegisterRequest reg = new RegisterRequest();
            reg.setUsername(TEST_USER);
            reg.setEmail(TEST_EMAIL);
            reg.setPassword(STRONG_PASS);
            reg.setRole("CITIZEN");
            reg.setFullName("Security Test Citizen");
            reg.setDistrict("Ranchi");
            reg.setPhone("+91 94311 00000");
            authService.register(reg);
        }
    }

    @Test
    void testSuccessfulAuthenticationWithBCrypt() {
        AuthRequest req = new AuthRequest(TEST_USER, STRONG_PASS, "CITIZEN");
        AuthResponse resp = authService.login(req);

        assertNotNull(resp);
        assertNotNull(resp.getAccessToken());
        assertNotNull(resp.getRefreshToken());
        assertEquals(TEST_USER, resp.getUser().getUsername());
        assertNull(resp.getUser().getPassword(), "Password hash must NEVER be exposed in AuthResponse");
    }

    @Test
    void testFailedAuthenticationWithBadPassword() {
        AuthRequest req = new AuthRequest(TEST_USER, "WrongPassword123!", "CITIZEN");
        assertThrows(Exception.class, () -> authService.login(req), "Login with wrong password must throw AuthenticationException");
    }

    @Test
    void testWeakPasswordRejection() {
        RegisterRequest weakReg = new RegisterRequest();
        weakReg.setUsername("weakuser_" + System.currentTimeMillis());
        weakReg.setEmail("weak_" + System.currentTimeMillis() + "@test.com");
        weakReg.setPassword("12345"); // Weak password
        weakReg.setRole("CITIZEN");

        assertThrows(IllegalArgumentException.class, () -> authService.register(weakReg), "Weak password must be rejected");
    }

    @Test
    void testJwtTokenValidationAndClaims() {
        String token = jwtTokenProvider.generateAccessToken(TEST_USER, "ROLE_CITIZEN", "TEST-ID-123");
        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals(TEST_USER, jwtTokenProvider.getUsernameFromJWT(token));
        assertEquals("ROLE_CITIZEN", jwtTokenProvider.getRoleFromJWT(token));
        assertEquals("TEST-ID-123", jwtTokenProvider.getUserIdFromJWT(token));
    }

    @Test
    void testTokenBlacklistRevocationOnLogout() {
        String token = jwtTokenProvider.generateAccessToken(TEST_USER, "ROLE_CITIZEN", "TEST-ID-123");
        assertTrue(jwtTokenProvider.validateToken(token));
        assertFalse(tokenBlacklistService.isBlacklisted(token));

        // Invalidate token
        authService.logout(token);
        assertTrue(tokenBlacklistService.isBlacklisted(token), "Token must be blacklisted after logout");
    }

    @Test
    void testRefreshTokenRotationFlow() {
        AuthRequest req = new AuthRequest(TEST_USER, STRONG_PASS, "CITIZEN");
        AuthResponse loginResp = authService.login(req);

        RefreshTokenRequest refreshReq = new RefreshTokenRequest(loginResp.getRefreshToken());
        AuthResponse refreshResp = authService.refreshToken(refreshReq);

        assertNotNull(refreshResp);
        assertNotNull(refreshResp.getAccessToken());
        assertEquals(TEST_USER, refreshResp.getUser().getUsername());
    }

    @Test
    void testFileUploadSecurityMagicBytesValid() throws IOException {
        // Valid JPEG header bytes (FF D8 FF E0)
        byte[] validJpegContent = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46};
        MockMultipartFile validFile = new MockMultipartFile("file", "evidence.jpg", "image/jpeg", validJpegContent);

        FileUploadService.UploadResult result = fileUploadService.storeFile(validFile);
        assertNotNull(result);
        assertTrue(result.getFileUrl().startsWith("/api/files/"));
        assertFalse(result.getSafeFilename().contains("evidence.jpg"), "Uploaded file must use randomized UUID filename, not raw original name");
    }

    @Test
    void testFileUploadSecurityExecutableRejection() {
        // Malicious executable masquerading as jpg
        byte[] exeHeader = new byte[]{(byte) 0x4D, (byte) 0x5A, 0x00, 0x00}; // MZ header
        MockMultipartFile exeFile = new MockMultipartFile("file", "malware.exe", "application/x-msdownload", exeHeader);

        assertThrows(IllegalArgumentException.class, () -> fileUploadService.storeFile(exeFile), "Executables must be rejected");
    }

    @Test
    void testFileUploadSecuritySpoofedExtensionRejection() {
        // Executable binary named with .jpg extension
        byte[] exeHeader = new byte[]{(byte) 0x4D, (byte) 0x5A, 0x00, 0x00};
        MockMultipartFile spoofedFile = new MockMultipartFile("file", "fake_image.jpg", "image/jpeg", exeHeader);

        assertThrows(IllegalArgumentException.class, () -> fileUploadService.storeFile(spoofedFile), "Spoofed mime/magic bytes must be rejected");
    }

    @Test
    void testUserDataIsolationScoping() {
        String citizenA_Email = "citizenA_" + System.currentTimeMillis() + "@jharkhand.gov.in";
        String citizenB_Email = "citizenB_" + System.currentTimeMillis() + "@jharkhand.gov.in";

        Problem pA = new Problem();
        pA.setTitle("Water pipeline leak in Ward 2");
        pA.setCategory("Water Supply & Quality");
        pA.setDistrict("Ranchi");
        pA.setCitizenEmail(citizenA_Email);
        pA.setUserId("USER-A-999");
        problemService.createProblem(pA);

        Problem pB = new Problem();
        pB.setTitle("Broken solar light in Village 5");
        pB.setCategory("Renewable Energy & Solar Microgrids");
        pB.setDistrict("Latehar");
        pB.setCitizenEmail(citizenB_Email);
        pB.setUserId("USER-B-888");
        problemService.createProblem(pB);

        // Query scoped to User A
        List<Problem> userAProblems = problemService.getAllProblems(null, null, null, null, null, null, null, "USER-A-999", citizenA_Email, null);
        assertTrue(userAProblems.stream().allMatch(p -> "USER-A-999".equals(p.getUserId()) || citizenA_Email.equals(p.getCitizenEmail())));
        assertFalse(userAProblems.stream().anyMatch(p -> "USER-B-888".equals(p.getUserId())), "User A should NEVER see User B private data");
    }
}
