import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="w-full bg-blue-600 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand */}
        <h1 className="text-xl font-bold tracking-wide">
          Eventflow
        </h1>

        {/* Right Section */}
        {user ? (
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-blue-500 px-3 py-1 text-sm font-semibold uppercase tracking-wide">
              {role}
            </span>

            <button
              onClick={handleLogout}
              className="rounded-md bg-red-500 px-4 py-1.5 text-sm font-medium transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
