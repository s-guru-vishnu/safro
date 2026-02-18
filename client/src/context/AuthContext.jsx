import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const savedToken = localStorage.getItem('safro_token');
            const savedUser = localStorage.getItem('safro_user');

            if (savedToken) {
                setToken(savedToken);
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                    setLoading(false);
                } else {
                    // Token exists but no user data - fetch profile
                    try {
                        const res = await api.get('/auth/profile');
                        const userData = res.data.user;
                        localStorage.setItem('safro_user', JSON.stringify(userData));
                        setUser(userData);
                    } catch (err) {
                        console.error('Failed to fetch profile on init:', err);
                        localStorage.removeItem('safro_token');
                        localStorage.removeItem('safro_user');
                    } finally {
                        setLoading(false);
                    }
                }
            } else {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem('safro_token', newToken);
        localStorage.setItem('safro_user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        return userData;
    };

    const register = async (formData) => {
        const res = await api.post('/auth/register', formData);
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem('safro_token', newToken);
        localStorage.setItem('safro_user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('safro_token');
        localStorage.removeItem('safro_user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData) => {
        localStorage.setItem('safro_user', JSON.stringify(userData));
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
