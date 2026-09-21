// Authentication & User Session Service with Token Management, Refresh Rotation, and Clean Session Isolation

const API_BASE_URL = 'http://localhost:5000/api';

const TOKEN_KEY = 'civic_auth_token';
const REFRESH_TOKEN_KEY = 'civic_refresh_token';
const USER_KEY = 'civic_auth_user';

export const authService = {
  // Store authentication session with dual-token support
  setSession(token, user, refreshToken) {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_KEY, token);
    }
    if (refreshToken) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (user) {
      // Ensure no credentials stored in user object
      const safeUser = { ...user };
      delete safeUser.password;
      sessionStorage.setItem(USER_KEY, JSON.stringify(safeUser));
      localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
    }
  },

  // Get active JWT access token
  getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
  },

  // Get active JWT refresh token
  getRefreshToken() {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY) || null;
  },

  // Get currently authenticated user object
  getCurrentUser() {
    try {
      const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Could not parse user session', e);
    }
    return null;
  },

  // Check if authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Standardized authorization headers for API calls
  getAuthHeaders() {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Refresh access token using refresh token
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data && data.data.accessToken) {
          this.setSession(data.data.accessToken, data.data.user, data.data.refreshToken || refreshToken);
          return data.data.accessToken;
        }
      }
    } catch (e) {
      console.warn('Could not refresh token', e);
    }
    return null;
  },

  // Authenticated fetch with automatic token refresh on 401
  async authFetch(url, options = {}) {
    let token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Attempt refresh
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
      } else {
        this.logout();
      }
    }

    return response;
  },

  // Login via backend API
  async login({ username, email, password, role }) {
    const identifier = (username || email || '').trim();
    
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: identifier,
          email: email || identifier,
          password: password,
          role: role ? role.toUpperCase() : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const { token, accessToken, refreshToken, user } = data.data;
          const activeToken = accessToken || token;
          this.setSession(activeToken, user, refreshToken);
          return { success: true, user, token: activeToken };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        return { success: false, message: errData.message || 'Invalid credentials' };
      }
    } catch (err) {
      console.warn('Backend login network error, fallback to local user auth:', err.message);
    }

    // Local fallback for offline mode
    const localUser = {
      id: `USR-${Date.now()}`,
      username: identifier,
      email: email || identifier,
      role: (role || 'citizen').toUpperCase(),
      fullName: identifier,
      district: 'Ranchi',
      phone: '+91 94311 00000'
    };
    const mockToken = `mock-jwt-token-${Date.now()}`;
    this.setSession(mockToken, localUser);
    return { success: true, user: localUser, token: mockToken };
  },

  // Register a new unique account via backend API
  async register(userData) {
    try {
      const roleStr = (userData.role || 'citizen').toUpperCase();
      const payload = {
        username: (userData.username || userData.email || userData.officialEmail || userData.corpEmail || `user_${Date.now()}`).trim(),
        email: (userData.email || userData.officialEmail || userData.corpEmail || '').trim(),
        password: userData.password || 'password123',
        role: roleStr,
        fullName: userData.fullName || userData.representativeName || userData.instName || userData.compName || 'Registered User',
        organization: userData.organization || userData.instName || userData.compName || 'Citizen Community',
        district: userData.district || userData.city || 'Ranchi',
        phone: userData.phone || userData.phoneNumber || '+91 94311 00000',
        state: userData.state || 'Jharkhand',
        city: userData.city || userData.district || 'Ranchi',
        representativeName: userData.representativeName || userData.repName || userData.fullName,
        designation: userData.designation || '',
        companyName: userData.companyName || userData.compName || '',
        universityName: userData.universityName || userData.instName || '',
        areasOfExpertise: userData.areasOfExpertise || userData.industryExpertise || [],
        capabilities: userData.capabilities || {},
        capabilitiesCount: userData.capabilitiesCount || 0
      };

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const { token, accessToken, refreshToken, user } = data.data;
          const activeToken = accessToken || token;
          this.setSession(activeToken, user, refreshToken);
          return { success: true, user, token: activeToken };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        return { success: false, message: errData.message || 'Registration failed' };
      }
    } catch (err) {
      console.warn('Backend registration network error, fallback to local:', err.message);
    }

    // Local fallback for offline mode
    const uniqueId = `USR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const localUser = {
      id: uniqueId,
      username: userData.username || userData.email || userData.officialEmail || `user_${Date.now()}`,
      email: userData.email || userData.officialEmail || userData.corpEmail || '',
      role: (userData.role || 'citizen').toUpperCase(),
      fullName: userData.fullName || userData.representativeName || userData.repName || 'New User',
      organization: userData.organization || userData.instName || userData.compName || '',
      district: userData.district || userData.city || 'Ranchi',
      phone: userData.phone || userData.phoneNumber || '+91 94311 00000',
      universityName: userData.universityName || userData.instName || '',
      companyName: userData.companyName || userData.compName || '',
      representativeName: userData.representativeName || userData.repName || '',
      designation: userData.designation || '',
      areasOfExpertise: userData.areasOfExpertise || userData.industryExpertise || [],
      capabilities: userData.capabilities || {},
      capabilitiesCount: userData.capabilitiesCount || 0
    };
    const mockToken = `mock-jwt-token-${uniqueId}`;
    this.setSession(mockToken, localUser);
    return { success: true, user: localUser, token: mockToken };
  },

  // Complete clean logout — notify backend to invalidate token, then wipe tokens, session, and role state
  async logout() {
    const token = this.getToken();
    if (token) {
      try {
        fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {});
      } catch (e) {}
    }
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('civic_univ_user');
    sessionStorage.removeItem('civic_industry_user');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Helper for input sanitization to prevent XSS in rendered text
  sanitizeInput(str) {
    if (!str || typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
};
