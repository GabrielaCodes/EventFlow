import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout, role, loading, profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // ✅ Get current path

    // 1. Determine Display Name
    const displayName = 
        profile?.full_name || 
        user?.user_metadata?.full_name || 
        user?.email?.split('@')[0] || 
        'User';

    const companyName = profile?.company_name || user?.user_metadata?.company_name;
    const categoryName = profile?.event_categories?.name;

    // 2. Determine Dashboard Link
    const getHomeLink = () => {
        if (role === 'chief_coordinator') return '/coordinator';
        if (role === 'manager') return '/manager-dashboard';
        if (role === 'client') return '/client-dashboard';
        if (role === 'employee') return '/employee-dashboard';
        if (role === 'sponsor') return '/sponsor-dashboard';
        return '/'; // Default to Landing Page
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.clear();
            navigate('/login', { replace: true }); 
        }
    };

    return (
        <nav className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
            {/* LOGO */}
            <Link to={getHomeLink()} className="text-xl font-bold tracking-wide hover:text-blue-100 transition">
                Eventflow
            </Link>

            {!loading && (
                <div>
                    {user ? (
                        <div className="flex gap-3 items-center">
                            
                            <div className="text-right flex flex-col justify-center">
                                <span className="text-sm font-bold leading-none">
                                    {displayName}
                                </span>
                                <div className="text-xs text-blue-200 opacity-90 leading-none mt-0.5">
                                    {role === 'manager' && categoryName 
                                        ? categoryName 
                                        : companyName
                                    }
                                </div>
                            </div>

                            <span className="uppercase font-semibold text-[10px] sm:text-xs bg-blue-700 px-2 py-1 rounded shadow-sm border border-blue-500">
                                {role ? role.replace('_', ' ') : 'Guest'}
                            </span>

                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors text-xs sm:text-sm font-medium shadow-sm"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-6 text-sm font-medium">
                            {/* ✅ Always show Home */}
                            <Link to="/" className="text-white hover:text-blue-200 transition">
                                Home
                            </Link>

                            {/* ✅ If on Register Page -> Show Login */}
                            {location.pathname === '/register' && (
                                <Link to="/login" className="text-white hover:text-blue-200 transition">
                                    Login
                                </Link>
                            )}

                            {/* ✅ If on Login Page -> Show Register */}
                            {location.pathname === '/login' && (
                                <Link to="/register" className="text-white hover:text-blue-200 transition">
                                    Register
                                </Link>
                            )}

                            {/* Optional: Fallback if on neither (e.g. 404 page) show both or just Login */}
                            {location.pathname !== '/login' && location.pathname !== '/register' && (
                                <Link to="/login" className="text-white hover:text-blue-200 transition">
                                    Login
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;