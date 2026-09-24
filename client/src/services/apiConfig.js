// Centralized API configuration supporting environment variables for production deployments (e.g. Render, Vercel)
const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    let url = import.meta.env.VITE_API_BASE_URL.trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;
