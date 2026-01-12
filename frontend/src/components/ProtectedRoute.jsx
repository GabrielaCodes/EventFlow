import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, role, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/" />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <div className="p-10 text-red-500">Access Denied: You are not authorized to view this page.</div>;
    }

    return children;
};

export default ProtectedRoute;