import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import ClientDashboard from './pages/dashboards/ClientDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './pages/Register';

const DashboardRedirect = () => {
    const { user, role, loading } = useAuth();

    // 1. Wait for Supabase to finish loading
    if (loading) {
        return <div className="p-10">Loading your profile...</div>;
    }

    // 2. If not logged in, kick back to login
    if (!user) {
        return <Navigate to="/" />;
    }

    // 3. Redirect based on Role
    if (role === 'client') return <Navigate to="/client" />;
    if (role === 'manager') return <Navigate to="/manager" />;
    if (role === 'employee') return <Navigate to="/employee" />;
    if (role === 'sponsor') return <Navigate to="/sponsor" />;

    // 4. Fallback if role is missing
    return <div className="p-10 text-red-600">Error: No role assigned to this user.</div>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* <-- Add this Route */}
          <Route path="/dashboard" element={<DashboardRedirect />} />
          {/* ... other protected routes ... */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;