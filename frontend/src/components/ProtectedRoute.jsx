import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, role, loading } = useAuth();

    // 1️⃣ Still resolving auth session
    if (loading) {
        return <div className="p-6 text-center">Loading...</div>;
    }

    // 2️⃣ Not logged in → go to login
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // 3️⃣ Logged in, but role-restricted route
    // Only block IF role exists AND is invalid
    if (allowedRoles && role && !allowedRoles.includes(role)) {
        return (
            <div className="p-10 text-red-500 font-semibold">
                Access Denied
            </div>
        );
    }

    // 4️⃣ Logged in, role still resolving OR role allowed
    return children;
};

export default ProtectedRoute;
