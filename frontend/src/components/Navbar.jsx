import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout, role, loading } = useAuth();

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
            <h1 className="text-xl font-bold tracking-wide">Eventflow</h1>

            {/* ⛔ Do NOTHING while auth is resolving */}
            {!loading && (
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
                        <Link
                            to="/"
                            className="text-white hover:text-blue-200 underline"
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
