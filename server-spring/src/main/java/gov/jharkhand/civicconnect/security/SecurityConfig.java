package gov.jharkhand.civicconnect.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private gov.jharkhand.civicconnect.mcp.McpAuthenticationFilter mcpAuthenticationFilter;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        .contentTypeOptions(contentTypeOptions -> {})
                        .frameOptions(frameOptions -> frameOptions.deny())
                        .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' http://localhost:5000 http://localhost:8000;"
                        ))
                )
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/health/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/files/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/problems/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/metrics/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                        // MCP Protocol public discovery & token-authenticated endpoints
                        .requestMatchers("/mcp/**", "/api/mcp/**", "/api/admin/mcp/**").permitAll()

                        // Admin restricted endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Collaboration & Industry endpoints
                        .requestMatchers("/api/collaborations/mine", "/api/industry/collaborations/mine", "/api/industry/proposals/mine").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/collaborations/**", "/api/industry/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/collaborations/**", "/api/industry/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/collaborations/**", "/api/industry/**").permitAll()

                        // University & Solution submission endpoints (allow proposal submission for both authenticated and guest/portal users)
                        .requestMatchers("/api/solutions/mine", "/api/university/proposals/mine", "/api/university/solutions/mine").permitAll()
                        .requestMatchers("/api/solutions", "/api/solutions/**", "/api/proposals", "/api/proposals/**", "/api/university/**", "/api/industry/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/problems/**").permitAll()

                        // Project execution & milestone tracking
                        .requestMatchers("/api/projects/mine", "/api/university/projects/mine", "/api/industry/projects/mine").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/projects/**").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/projects/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/projects/**").authenticated()

                        // Notifications
                        .requestMatchers("/api/notifications/**").authenticated()

                        // File upload
                        .requestMatchers("/api/files/upload", "/api/upload/**").permitAll()

                        // Any other endpoint
                        .anyRequest().permitAll()
                );

        http.addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(mcpAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
