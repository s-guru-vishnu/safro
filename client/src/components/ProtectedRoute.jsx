import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <LoadingSpinner size="lg" text="Loading..." />;

    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const routes = { rider: '/rider/home', driver: '/driver/dashboard', admin: '/admin/dashboard' };
        return <Navigate to={routes[user.role] || '/'} replace />;
    }

    return children;
};

export default ProtectedRoute;
