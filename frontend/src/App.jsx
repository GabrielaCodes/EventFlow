import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';

// Import the Dashboards
import ClientDashboard from './pages/dashboards/ClientDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard';
import SponsorDashboard from './pages/dashboards/SponsorDashboard';

// Helper component to redirect based on Role
const DashboardRedirect = () => {
    const { user, role, loading } = useAuth();
    if (loading) return <div className="p-10">Loading...</div>;
    if (!user) return <Navigate to="/" />;
    
    // Redirect to the specific role folder
    if (role === 'manager') return <Navigate to="/manager" />;
    if (role === 'client') return <Navigate to="/client" />;
    if (role === 'employee') return <Navigate to="/employee" />;
    if (role === 'sponsor') return <Navigate to="/sponsor" />;
    
    return <Navigate to="/" />;
};

// Protected Route Wrapper (Security)
const ProtectedRoute = ({ children, allowedRole }) => {
    const { user, role, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/" />;
    if (allowedRole && role !== allowedRole) return <Navigate to="/dashboard" />;
    return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* The Switcher */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Protected Dashboard Routes - THIS WAS MISSING */}
          <Route 
            path="/manager" 
            element={
              <ProtectedRoute allowedRole="manager">
                <ManagerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/client" 
            element={
              <ProtectedRoute allowedRole="client">
                <ClientDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employee" 
            element={
              <ProtectedRoute allowedRole="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sponsor" 
            element={
              <ProtectedRoute allowedRole="sponsor">
                <SponsorDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;