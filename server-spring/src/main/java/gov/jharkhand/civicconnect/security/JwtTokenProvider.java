package gov.jharkhand.civicconnect.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private static final String ISSUER = "CivicConnect-Jharkhand";
    private static final String AUDIENCE = "CivicConnect-Portal";

    @Value("${jwt.secret:9a3f2c4e8b1d7a6f5e0c3b2a1d4e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5}")
    private String jwtSecret;

    // Default 15 minutes for access token
    @Value("${jwt.access-expiration-ms:900000}")
    private long accessTokenExpirationMs;

    // Default 7 days for refresh token
    @Value("${jwt.refresh-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(String username, String role, String userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpirationMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(ISSUER)
                .audience().add(AUDIENCE).and()
                .subject(username)
                .claim("role", role)
                .claim("userId", userId)
                .claim("type", "access")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    public String generateRefreshToken(String username, String userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpirationMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(ISSUER)
                .audience().add(AUDIENCE).and()
                .subject(username)
                .claim("userId", userId)
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    // Backwards compatibility helper
    public String generateToken(String username, String role, String userId) {
        return generateAccessToken(username, role, userId);
    }

    public Claims getClaimsFromJWT(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .requireIssuer(ISSUER)
                .requireAudience(AUDIENCE)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getUsernameFromJWT(String token) {
        return getClaimsFromJWT(token).getSubject();
    }

    public String getUsernameFromToken(String token) {
        return getUsernameFromJWT(token);
    }

    public String getRoleFromJWT(String token) {
        return (String) getClaimsFromJWT(token).get("role");
    }

    public String getRoleFromToken(String token) {
        return getRoleFromJWT(token);
    }

    public String getUserIdFromJWT(String token) {
        return (String) getClaimsFromJWT(token).get("userId");
    }

    public String getUserIdFromToken(String token) {
        return getUserIdFromJWT(token);
    }

    public String getTokenType(String token) {
        return (String) getClaimsFromJWT(token).get("type");
    }

    public Date getExpirationDateFromJWT(String token) {
        return getClaimsFromJWT(token).getExpiration();
    }

    public boolean validateToken(String authToken) {
        try {
            Claims claims = getClaimsFromJWT(authToken);
            return claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }
}
