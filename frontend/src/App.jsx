import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar'; // ✅ 1. Import Navbar
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

// Import the Dashboards
import ClientDashboard from './pages/dashboards/ClientDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import SponsorDashboard from './pages/dashboards/SponsorDashboard';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard';
import EventModifications from './pages/dashboards/EventModifications';
// Helper component to redirect based on Role
const DashboardRedirect = () => {
    const { user, role, loading } = useAuth();
    if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;
    if (!user) return <Navigate to="/" replace />;

    if (role === 'manager') return <Navigate to="/manager-dashboard" replace />;
    if (role === 'client') return <Navigate to="/client-dashboard" replace />;
    if (role === 'employee') return <Navigate to="/employee-dashboard" replace />;
    if (role === 'sponsor') return <Navigate to="/sponsor-dashboard" replace />;

    return <div className="p-10 text-red-500">Error: No role assigned.</div>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* ✅ 2. Place Navbar here so it shows on EVERY page */}
        {/* It is inside AuthProvider (so it can read user/role) */}
        {/* It is inside BrowserRouter (so links work) */}
        <Navbar />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* The Switcher */}
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

          <Route path="*" element={<div className="p-10">404 - Page Not Found</div>} />
        <Route 
  path="/event-modifications/:id" 
  element={
    <ProtectedRoute allowedRoles={['manager', 'client']}>
      <EventModifications />
    </ProtectedRoute>
  } 
/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;