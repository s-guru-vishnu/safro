import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add JWT token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('safro_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('safro_token');
            localStorage.removeItem('safro_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API methods
export const forgotPassword = (emailOrPhone) => api.post('/auth/forgot-password', { emailOrPhone });
export const verifyOtpForReset = (emailOrPhone, otp) => api.post('/auth/verify-reset-otp', { emailOrPhone, otp });
export const resetPassword = (emailOrPhone, otp, newPassword) => api.post('/auth/reset-password', { emailOrPhone, otp, newPassword });

// OTP API methods
export const sendOtp = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOtp = (phone, otp) => api.post('/auth/verify-otp', { phone, otp });
export const resendOtp = (phone) => api.post('/auth/resend-otp', { phone });

export default api;
