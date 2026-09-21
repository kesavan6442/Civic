package gov.jharkhand.civicconnect.security;

import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    // Map of token -> expiration timestamp
    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    public void blacklistToken(String token, Date expirationDate) {
        if (token == null || token.trim().isEmpty()) {
            return;
        }
        long expiry = (expirationDate != null) ? expirationDate.getTime() : (System.currentTimeMillis() + 86400000L);
        blacklistedTokens.put(token.trim(), expiry);
        cleanupExpiredTokens();
    }

    public void blacklistToken(String token) {
        blacklistToken(token, (Date) null);
    }

    public void blacklistToken(String token, String clientIp) {
        blacklistToken(token, (Date) null);
    }

    public boolean isBlacklisted(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        Long expiry = blacklistedTokens.get(token.trim());
        if (expiry == null) {
            return false;
        }
        if (System.currentTimeMillis() > expiry) {
            blacklistedTokens.remove(token.trim());
            return false;
        }
        return true;
    }

    private void cleanupExpiredTokens() {
        if (blacklistedTokens.size() > 5000) {
            long now = System.currentTimeMillis();
            blacklistedTokens.entrySet().removeIf(entry -> entry.getValue() < now);
        }
    }
}
