package gov.jharkhand.civicconnect.security;

import gov.jharkhand.civicconnect.model.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                if (tokenBlacklistService.isBlacklisted(jwt)) {
                    log.warn("Blocked request with blacklisted/logged-out JWT token");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"message\":\"Token has been invalidated. Please log in again.\"}");
                    return;
                }

                String tokenType = tokenProvider.getTokenType(jwt);
                if (tokenType != null && "refresh".equalsIgnoreCase(tokenType)) {
                    log.warn("Attempted to authenticate API with refresh token");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"message\":\"Refresh token cannot be used directly for API authorization.\"}");
                    return;
                }

                String username = tokenProvider.getUsernameFromJWT(jwt);
                String userId = tokenProvider.getUserIdFromJWT(jwt);
                String roleStr = tokenProvider.getRoleFromJWT(jwt);

                Role role = Role.CITIZEN;
                if (roleStr != null) {
                    try {
                        role = Role.valueOf(roleStr.toUpperCase());
                    } catch (IllegalArgumentException ignored) {}
                }

                UserPrincipal principal;
                try {
                    principal = (UserPrincipal) customUserDetailsService.loadUserByUsername(username);
                } catch (Exception e) {
                    principal = new UserPrincipal(
                            userId,
                            username,
                            username.contains("@") ? username : null,
                            "",
                            role,
                            username,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()))
                    );
                }

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        principal, null, principal.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            log.warn("Could not set user authentication in security context: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7).trim();
        }
        return null;
    }
}
