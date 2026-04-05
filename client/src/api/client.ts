import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Create a pre-configured Axios instance
export const apiClient: AxiosInstance = axios.create({
    // Fallback to localhost if the environment variable isn't set
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    });

    // Request Interceptor: Attach the JWT token to every outgoing request
    apiClient.interceptors.request.use(
    (config) => {
        // 1. Grab the token from localStorage
        const token = localStorage.getItem('jwt_token');
        
        // 2. If it exists, append it to the Authorization header
        if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle Global 401 Unauthorized errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the backend rejects the token (e.g., it expired after 7 days)
        if (error.response?.status === 401) {
        
            // 1. Clear the dead session data
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user');
            localStorage.removeItem('active_org');
            
            // 2. Force a redirect to the login page
            // We check the pathname so we don't get stuck in an infinite redirect loop if they are already on /login
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);