import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

import CoordinatorRoute from './routes/CoordinatorRoute';
import ChiefCoordinatorDashboard from './pages/dashboards/ChiefCoordinatorDashboard';

// Import the Dashboards
import ClientDashboard from './pages/dashboards/ClientDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import SponsorDashboard from './pages/dashboards/SponsorDashboard';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard';
import EventModifications from './pages/dashboards/EventModifications';

// ✅ IMPROVED: Global Redirect & Security Guard
const DashboardRedirect = () => {
    // We need 'profile' to check verification_status
    const { user, role, profile, loading } = useAuth();

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!user) return <Navigate to="/" replace />;

    // 🛑 1. GLOBAL GUARD: Block Pending Users
    if (profile?.verification_status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded shadow text-center max-w-md">
                    <h2 className="text-2xl font-bold text-orange-600 mb-2">⏳ Approval Pending</h2>
                    <p className="text-gray-600 mb-6">
                        Your account is currently under review. You cannot access the dashboard until you are verified.
                    </p>
                    <button 
                        onClick={() => window.location.href = '/'} 
                        className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // 🛑 2. GLOBAL GUARD: Block Rejected Users
    if (profile?.verification_status === 'rejected') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded shadow text-center max-w-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">🚫 Account Disabled</h2>
                    <p className="text-gray-600 mb-6">
                        Your account has been rejected or deactivated by an administrator.
                    </p>
                    <button 
                        onClick={() => window.location.href = '/'} 
                        className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    // ✅ 3. ROUTING: Send Verified Users to their Dashboard
    if (role === 'chief_coordinator') return <Navigate to="/coordinator" replace />;
    if (role === 'manager') return <Navigate to="/manager-dashboard" replace />;
    if (role === 'client') return <Navigate to="/client-dashboard" replace />;
    if (role === 'employee') return <Navigate to="/employee-dashboard" replace />;
    if (role === 'sponsor') return <Navigate to="/sponsor-dashboard" replace />;

    return <div className="p-10 text-red-500">Error: Role '{role}' not recognized.</div>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Navbar inside AuthProvider so it can read user state */}
        <Navbar />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* The Switcher - Handles Role Redirection & Security Checks */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Protected Dashboard Routes */}
          <Route 
            path="/manager-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/client-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/employee-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/sponsor-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['sponsor']}>
                <SponsorDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Modifications Route */}
          <Route 
            path="/event-modifications/:id" 
            element={
              <ProtectedRoute allowedRoles={['manager', 'client']}>
                <EventModifications />
              </ProtectedRoute>
            } 
          />

          {/* Chief Coordinator Route */}
          <Route element={<CoordinatorRoute />}>
            <Route path="/coordinator" element={<ChiefCoordinatorDashboard />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<div className="p-10">404 - Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;