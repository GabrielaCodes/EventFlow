import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, role, profile, loading, logout } = useAuth();

    // 1️⃣ Still resolving auth session
    if (loading) {
        return <div className="p-6 text-center">Loading...</div>;
    }

    // 2️⃣ Not logged in → go to login
    // ✅ FIX: Redirect to /login instead of / (Landing Page)
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3️⃣ Role Restriction Check
    if (allowedRoles && role && !allowedRoles.includes(role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="p-8 bg-white rounded shadow text-center max-w-md border border-red-100">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You do not have permission to view this page.</p>
                    <button 
                        onClick={() => window.history.back()}
                        className="mt-4 text-blue-600 hover:underline text-sm"
                    >
                        &larr; Go Back
                    </button>
                </div>
            </div>
        );
    }

    // ============================================================
    // 4️⃣ EMPLOYEE STATUS CHECKS (Pending vs Rejected vs Verified)
    // ============================================================

    if (role === 'employee') {
        
        // 🛑 CASE A: REJECTED
        if (profile?.verification_status === 'rejected') {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6">
                    <div className="bg-white p-8 rounded shadow-md text-center max-w-md border-t-4 border-red-600">
                        <div className="text-5xl mb-4">🚫</div>
                        <h2 className="text-2xl font-bold text-red-700 mb-2">Application Rejected</h2>
                        <p className="text-gray-600 mb-6">
                            We're sorry, but your application has been reviewed and declined by the manager. 
                            You cannot access the workspace.
                        </p>
                        <button 
                            onClick={logout} 
                            className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-black transition font-semibold"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            );
        }

        // ⏳ CASE B: PENDING
        if (profile?.verification_status === 'pending') {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 p-6">
                    <div className="bg-white p-8 rounded shadow-md text-center max-w-md border-t-4 border-yellow-400">
                        <div className="text-5xl mb-4">⏳</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Approval Pending</h2>
                        <p className="text-gray-600 mb-6">
                            Thanks for signing up! Your account is currently waiting for manager approval.
                            <br /><br />
                            Please check back later or wait for an email confirmation.
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
    }

    // 5️⃣ Logged in, Role Allowed, & Verified (or not an employee)
    return children;
};

export default ProtectedRoute;