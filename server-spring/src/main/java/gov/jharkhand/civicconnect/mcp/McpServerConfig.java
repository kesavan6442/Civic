package gov.jharkhand.civicconnect.mcp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class McpServerConfig {

    @Value("${mcp.server-url:http://localhost:5000/mcp}")
    private String serverUrl;

    @Value("${mcp.enabled:true}")
    private boolean enabled;

    @Value("${mcp.token-expiry-days:30}")
    private int tokenExpiryDays;

    @Value("${mcp.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
    private String allowedOrigins;

    public String getServerUrl() {
        return serverUrl;
    }

    public void setServerUrl(String serverUrl) {
        this.serverUrl = serverUrl;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getTokenExpiryDays() {
        return tokenExpiryDays;
    }

    public void setTokenExpiryDays(int tokenExpiryDays) {
        this.tokenExpiryDays = tokenExpiryDays;
    }

    public List<String> getAllowedOriginsList() {
        if (allowedOrigins == null || allowedOrigins.trim().isEmpty()) {
            return List.of("*");
        }
        return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
