// frontend/src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout, role } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            // Try to tell Supabase we are leaving
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // EXECUTE THIS NO MATTER WHAT:
            // 1. Clear any stuck state in the browser
            localStorage.clear();
            // 2. Force the browser to go back to home
            window.location.href = '/'; 
        }
    };

    return (
        <nav className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
            <h1 className="text-xl font-bold tracking-wide">Event Sys</h1>
            <div>
                {user ? (
                    <div className="flex gap-4 items-center">
                        <span className="uppercase font-semibold text-sm bg-blue-700 px-3 py-1 rounded">
                            {role || 'User'}
                        </span>
                        <button 
                            onClick={handleLogout} 
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded transition-colors text-sm font-medium"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <Link to="/" className="text-white hover:text-blue-200 underline">Login</Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;