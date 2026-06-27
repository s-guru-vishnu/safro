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
            const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');

            if (!isAuthRequest) {
                localStorage.removeItem('safro_token');
                localStorage.removeItem('safro_user');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
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

// Favorite Locations API methods
export const getFavorites = () => api.get('/locations');
export const addFavorite = (data) => api.post('/locations', data);
export const updateFavorite = (id, data) => api.put(`/locations/${id}`, data);
export const deleteFavorite = (id) => api.delete(`/locations/${id}`);

// Scheduled Rides API methods
export const scheduleRide = (data) => api.post('/rides/schedule', data);
export const getScheduledRides = () => api.get('/rides/scheduled');
export const rescheduleRide = (id, data) => api.put(`/rides/${id}/reschedule`, data);

// Split Fare API methods
export const createSplitFare = (data) => api.post('/split-fare/create', data);
export const inviteSplitFare = (data) => api.post('/split-fare/invite', data);
export const respondSplitFare = (data) => api.post('/split-fare/respond', data);
export const getSplitFare = (rideId) => api.get(`/split-fare/${rideId}`);
export const paySplitFare = (data) => api.post('/split-fare/pay', data);
export const joinSplitFare = (code) => api.post(`/split-fare/join/${code}`);
export const getMySplits = () => api.get('/split-fare/my-splits');

export default api;
