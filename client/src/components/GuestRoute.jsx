import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const GuestRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <LoadingSpinner size="lg" text="Loading..." />;

    if (user) {
        const routes = { rider: '/', driver: '/', admin: '/' };
        return <Navigate to={routes[user.role] || '/'} replace />;
    }

    return children;
};

export default GuestRoute;
