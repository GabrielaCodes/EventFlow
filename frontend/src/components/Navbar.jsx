import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout, role, loading } = useAuth();

    // Helper to determine dashboard link
    const getHomeLink = () => {
        if (role === 'manager') return '/manager-dashboard';
        if (role === 'client') return '/client-dashboard';
        if (role === 'employee') return '/employee-dashboard';
        return '/';
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.clear();
            window.location.href = '/';
        }
    };

    return (
        <nav className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
            {/* ✅ FIXED: Logo now links to the correct dashboard */}
            <Link to={getHomeLink()} className="text-xl font-bold tracking-wide hover:text-blue-100 transition">
                Eventflow
            </Link>

            {!loading && (
                <div>
                    {user ? (
                        <div className="flex gap-4 items-center">
                            <span className="uppercase font-semibold text-sm bg-blue-700 px-3 py-1 rounded shadow-sm border border-blue-500">
                                {role || 'User'}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded transition-colors text-sm font-medium shadow-sm"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/"
                            className="text-white hover:text-blue-200 underline font-medium"
                        >
                            Login
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;