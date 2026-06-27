import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { updateUser } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            const error = searchParams.get('error');

            if (error) {
                toast.error('Google Login Failed');
                navigate('/login');
                return;
            }

            if (token) {
                try {
                    // Store token first so API interceptor can use it
                    localStorage.setItem('safro_token', token);

                    // Fetch profile to get role and name
                    const res = await api.get('/auth/profile');
                    const userData = res.data.user;

                    // Save user data
                    localStorage.setItem('safro_user', JSON.stringify(userData));
                    updateUser(userData);

                    // Redirection logic based on role
                    const routes = {
                        rider: '/rider/home',
                        driver: '/driver/dashboard',
                        admin: '/admin/dashboard'
                    };

                    const targetPath = routes[userData.role] || '/';
                    toast.success(`Welcome back, ${userData.name}!`);
                    navigate(targetPath);
                } catch (err) {
                    console.error('Google callback error:', err);
                    toast.error('Failed to complete login');
                    localStorage.removeItem('safro_token');
                    navigate('/login');
                }
            } else {
                navigate('/login');
            }
        };

        handleCallback();
    }, [searchParams, navigate, updateUser]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
            <LoadingSpinner size="lg" text="Authenticating with Google..." />
        </div>
    );
};

export default GoogleCallback;
