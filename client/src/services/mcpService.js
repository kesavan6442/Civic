import { authService } from './authService';
import { API_BASE_URL } from './apiConfig';

const getBaseUrl = () => `${API_BASE_URL}/admin/mcp`;
const getFallbackUrl = () => `${API_BASE_URL}/mcp`;

const getHeaders = () => {
    const token = authService.getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const safeFetch = async (endpointPath, options = {}) => {
    const primaryUrl = `${getBaseUrl()}${endpointPath}`;
    const fallbackUrl = `${getFallbackUrl()}${endpointPath}`;
    
    try {
        const res = await fetch(primaryUrl, {
            ...options,
            headers: { ...getHeaders(), ...(options.headers || {}) }
        });
        if (res.ok) return await res.json();
        if (res.status !== 404 && res.status !== 403) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Request failed with status ${res.status}`);
        }
    } catch (e) {
        // Fall back to alternate endpoint
    }

    const fallbackRes = await fetch(fallbackUrl, {
        ...options,
        headers: { ...getHeaders(), ...(options.headers || {}) }
    });
    if (!fallbackRes.ok) {
        const err = await fallbackRes.json().catch(() => ({}));
        throw new Error(err.message || `Request failed with status ${fallbackRes.status}`);
    }
    return await fallbackRes.json();
};

export const mcpService = {
    /**
     * Get live MCP status, token metadata, and audit metrics
     */
    getStatus: async () => {
        return await safeFetch('/status', { method: 'GET' });
    },

    /**
     * Generate a new MCP Bearer token
     */
    generateToken: async (scopes = ['READ_PROBLEMS', 'ANALYZE_PROBLEMS', 'READ_PROJECTS', 'READ_ANALYTICS']) => {
        return await safeFetch('/tokens', {
            method: 'POST',
            body: JSON.stringify({ scopes })
        });
    },

    /**
     * Regenerate MCP token (revokes previous tokens)
     */
    regenerateToken: async (scopes = ['READ_PROBLEMS', 'ANALYZE_PROBLEMS', 'READ_PROJECTS', 'READ_ANALYTICS']) => {
        return await safeFetch('/tokens/regenerate', {
            method: 'POST',
            body: JSON.stringify({ scopes })
        });
    },

    /**
     * Revoke all active MCP tokens
     */
    revokeToken: async (reason = 'Manual Revocation via Admin Portal') => {
        return await safeFetch('/tokens/revoke', {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    },

    /**
     * Get list of all available MCP tools categorized
     */
    getToolsCatalog: async () => {
        return await safeFetch('/tools', { method: 'GET' });
    },

    /**
     * Get security audit logs
     */
    getAuditLogs: async () => {
        return await safeFetch('/audit-logs', { method: 'GET' });
    },

    /**
     * Call an MCP tool directly via the Spring Boot MCP Gateway
     */
    callTool: async (toolName, toolArgs = {}, bearerToken = null) => {
        const host = getHost();
        const url = `http://${host}:5000/mcp`;
        
        let token = bearerToken;
        if (!token) {
            try {
                const status = await safeFetch('/status', { method: 'GET' });
                // If there's an active token prefix or admin token in status
                token = status.plainTextToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('civic_mcp_bearer_token') : null);
            } catch (e) {}
        }

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {})
        };

        const rpcPayload = {
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: {
                name: toolName,
                arguments: toolArgs
            }
        };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(rpcPayload)
            });
            if (res.ok) {
                const data = await res.json();
                if (data.result && data.result.structuredData !== undefined) {
                    return data.result.structuredData;
                }
                return data.result;
            }
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || `MCP tool call failed with status ${res.status}`);
        } catch (err) {
            console.warn(`Direct MCP Gateway call failed for ${toolName}, falling back to admin API:`, err.message);
            throw err;
        }
    }
};

export default mcpService;
