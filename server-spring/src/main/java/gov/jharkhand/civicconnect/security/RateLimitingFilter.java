package gov.jharkhand.civicconnect.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_AUTH_REQUESTS_PER_MINUTE = 120;
    private static final int MAX_GENERAL_REQUESTS_PER_MINUTE = 600;

    private static class RequestCounter {
        final long windowStartTime;
        final AtomicInteger count;

        RequestCounter(long windowStartTime) {
            this.windowStartTime = windowStartTime;
            this.count = new AtomicInteger(1);
        }
    }

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = getClientIP(request);

        // Relax for local development loopback
        boolean isLocal = "127.0.0.1".equals(clientIp) || "0:0:0:0:0:0:0:1".equals(clientIp) || "localhost".equalsIgnoreCase(clientIp);

        boolean isSensitiveAuth = path.startsWith("/api/auth/login") ||
                                  path.startsWith("/api/auth/register") ||
                                  path.startsWith("/api/auth/forgot");

        int limit = isSensitiveAuth 
                ? (isLocal ? 300 : MAX_AUTH_REQUESTS_PER_MINUTE) 
                : (isLocal ? 1500 : MAX_GENERAL_REQUESTS_PER_MINUTE);
        String key = (isSensitiveAuth ? "AUTH:" : "GEN:") + clientIp;

        long now = System.currentTimeMillis();
        long window = 60000L; // 1 minute

        RequestCounter counter = requestCounts.compute(key, (k, existing) -> {
            if (existing == null || (now - existing.windowStartTime) > window) {
                return new RequestCounter(now);
            }
            existing.count.incrementAndGet();
            return existing;
        });

        if (counter.count.get() > limit) {
            response.setStatus(429); // Too Many Requests
            response.setContentType("application/json");
            response.setHeader("Retry-After", "60");
            response.getWriter().write("{\"success\":false,\"message\":\"Rate limit exceeded. Please wait a moment before retrying.\"}");
            return;
        }

        // Periodic cleanup
        if (requestCounts.size() > 5000) {
            requestCounts.entrySet().removeIf(e -> (now - e.getValue().windowStartTime) > window * 2);
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isEmpty()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
