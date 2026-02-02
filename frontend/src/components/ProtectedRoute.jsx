import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    // ✅ NEW: Destructure 'profile' and 'logout'
    const { user, role, profile, loading, logout } = useAuth();

    // 1️⃣ Still resolving auth session
    if (loading) {
        return <div className="p-6 text-center">Loading...</div>;
    }

    // 2️⃣ Not logged in → go to login
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // 3️⃣ Logged in, but role-restricted route
    if (allowedRoles && role && !allowedRoles.includes(role)) {
        return (
            <div className="p-10 text-red-500 font-semibold">
                Access Denied
            </div>
        );
    }

    // 4️⃣ ✅ NEW: BLOCK PENDING EMPLOYEES
    // If user is an employee AND their status is NOT 'verified', block them.
    if (role === 'employee' && profile?.verification_status !== 'verified') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
                <div className="bg-white p-8 rounded shadow-md text-center max-w-md border-t-4 border-yellow-400">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">⏳ Approval Pending</h2>
                    <p className="text-gray-600 mb-6">
                        Thanks for signing up! Your account is currently waiting for manager approval.
                        <br /><br />
                        Please check back later or contact your manager.
                    </p>
                    <button 
                        onClick={logout} 
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                        &larr; Logout and return to home
                    </button>
                </div>
            </div>
        );
    }

    // 5️⃣ Logged in, Role Allowed, & Verified -> Render the Page
    return children;
};

export default ProtectedRoute;