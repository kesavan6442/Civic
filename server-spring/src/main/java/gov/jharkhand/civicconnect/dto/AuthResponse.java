package gov.jharkhand.civicconnect.dto;

import gov.jharkhand.civicconnect.model.User;

public class AuthResponse {
    private String token;
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresIn = 900; // 15 mins default
    private User user;

    public AuthResponse() {}

    public AuthResponse(String accessToken, String refreshToken, User user, long expiresIn) {
        this.token = accessToken;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = user;
        this.expiresIn = expiresIn;
        if (this.user != null) {
            this.user.setPassword(null); // Never expose password in response
        }
    }

    public AuthResponse(String token, User user) {
        this(token, null, user, 900);
    }

    public String getToken() { return token != null ? token : accessToken; }
    public void setToken(String token) { this.token = token; this.accessToken = token; }
    public String getAccessToken() { return accessToken != null ? accessToken : token; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; this.token = accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
    public User getUser() { return user; }
    public void setUser(User user) {
        this.user = user;
        if (this.user != null) {
            this.user.setPassword(null);
        }
    }
}
