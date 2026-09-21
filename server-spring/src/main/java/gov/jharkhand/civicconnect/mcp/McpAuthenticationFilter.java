package gov.jharkhand.civicconnect.mcp;

import gov.jharkhand.civicconnect.model.Role;
import gov.jharkhand.civicconnect.security.UserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
public class McpAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(McpAuthenticationFilter.class);

    private final McpTokenService mcpTokenService;
    private final McpAuditService mcpAuditService;

    public McpAuthenticationFilter(McpTokenService mcpTokenService, McpAuditService mcpAuditService) {
        this.mcpTokenService = mcpTokenService;
        this.mcpAuditService = mcpAuditService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        String authHeader = request.getHeader("Authorization");

        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer civic_mcp_")) {
            String rawToken = authHeader.substring(7).trim();
            Optional<McpToken> tokenOpt = mcpTokenService.validateBearerToken(rawToken);

            if (tokenOpt.isPresent()) {
                McpToken token = tokenOpt.get();
                UserPrincipal principal = new UserPrincipal(
                        token.getId(),
                        token.getCreatedByAdmin() != null ? token.getCreatedByAdmin() : "mcp-service-account",
                        "mcp@jharkhand.gov.in",
                        "",
                        Role.ADMIN,
                        "MCP Client Agent",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        List.of(
                                new SimpleGrantedAuthority("ROLE_ADMIN"),
                                new SimpleGrantedAuthority("ROLE_MCP_CLIENT")
                        )
                );

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        principal,
                        token,
                        principal.getAuthorities()
                );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("MCP Bearer token authenticated successfully for endpoint {}", path);
            } else {
                log.warn("Invalid or revoked MCP bearer token presented for {}", path);
                mcpAuditService.logEvent(
                        McpAuditService.McpAuditEvent.MCP_AUTH_FAILURE,
                        "anonymous",
                        "MCP_CLIENT",
                        request.getMethod() + " " + path,
                        null,
                        "FAILED",
                        401,
                        "Invalid or revoked bearer token"
                );

                if (path.startsWith("/mcp") || path.startsWith("/api/mcp")) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"jsonrpc\":\"2.0\",\"error\":{\"code\":-32001,\"message\":\"Unauthorized: Invalid, expired, or revoked MCP Bearer token\"},\"id\":null}");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
