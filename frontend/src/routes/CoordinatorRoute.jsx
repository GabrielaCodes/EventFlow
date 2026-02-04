import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ Correct import based on your App.jsx

const CoordinatorRoute = () => {
    const { user, role, loading } = useAuth();

    if (loading) {
        return <div className="p-10 text-center">Checking permissions...</div>;
    }

    // 1. Must be logged in
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // 2. Must be Chief Coordinator
    if (role !== 'chief_coordinator') {
        return <Navigate to="/dashboard" replace />; // Redirects to their correct dashboard
    }

    return <Outlet />;
};

export default CoordinatorRoute;