import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar'; // Your Main App Navbar
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage'; // ✅ New Landing Page
import Login from './pages/Login';
import Register from './pages/Register';
import Gallery from './pages/Gallery'; // Assuming you moved this to pages

// Dashboards
import CoordinatorRoute from './routes/CoordinatorRoute';
import ChiefCoordinatorDashboard from './pages/dashboards/ChiefCoordinatorDashboard';
import ClientDashboard from './pages/dashboards/ClientDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import SponsorDashboard from './pages/dashboards/SponsorDashboard';
import EmployeeDashboard from './pages/dashboards/EmployeeDashboard';
import EventModifications from './pages/dashboards/EventModifications';

// --- Dashboard Redirect Logic ---
const DashboardRedirect = () => {
    const { user, role, profile, loading } = useAuth();

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />; // Redirect to login if trying to access dashboard unauthenticated

    if (profile?.verification_status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded shadow text-center max-w-md">
                    <h2 className="text-2xl font-bold text-orange-600 mb-2">⏳ Approval Pending</h2>
                    <p className="text-gray-600 mb-6">Your account is currently under review.</p>
                    <button onClick={() => window.location.href = '/'} className="bg-gray-800 text-white px-4 py-2 rounded">Back to Home</button>
                </div>
            </div>
        );
    }

    if (profile?.verification_status === 'rejected') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded shadow text-center max-w-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">🚫 Account Disabled</h2>
                    <p className="text-gray-600 mb-6">Your account has been rejected.</p>
                    <button onClick={() => window.location.href = '/'} className="bg-gray-800 text-white px-4 py-2 rounded">Back to Home</button>
                </div>
            </div>
        );
    }

    if (role === 'chief_coordinator') return <Navigate to="/coordinator" replace />;
    if (role === 'manager') return <Navigate to="/manager-dashboard" replace />;
    if (role === 'client') return <Navigate to="/client-dashboard" replace />;
    if (role === 'employee') return <Navigate to="/employee-dashboard" replace />;
    if (role === 'sponsor') return <Navigate to="/sponsor-dashboard" replace />;

    return <div className="p-10 text-red-500">Error: Role '{role}' not recognized.</div>;
};

// --- Layout Component to Hide Navbar on Landing Page ---
const Layout = ({ children }) => {
    const location = useLocation();
    // Don't show Main Navbar on Landing Page ('/') or Gallery ('/gallery') as they have their own or need none
    const hideNavbarPaths = ['/', '/gallery']; 
    const showNavbar = !hideNavbarPaths.includes(location.pathname);

    return (
        <>
            {showNavbar && <Navbar />}
            {children}
        </>
    );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
            <Routes>
                {/* ✅ PUBLIC ROUTES */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* ✅ DASHBOARD REDIRECT */}
                <Route path="/dashboard" element={<DashboardRedirect />} />

                {/* ✅ PROTECTED ROUTES */}
                <Route path="/manager-dashboard" element={
                    <ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>
                }/>

                <Route path="/client-dashboard" element={
                    <ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>
                }/>

                <Route path="/employee-dashboard" element={
                    <ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>
                }/>

                <Route path="/sponsor-dashboard" element={
                    <ProtectedRoute allowedRoles={['sponsor']}><SponsorDashboard /></ProtectedRoute>
                }/>

                <Route path="/event-modifications/:id" element={
                    <ProtectedRoute allowedRoles={['manager', 'client']}><EventModifications /></ProtectedRoute>
                }/>

                <Route element={<CoordinatorRoute />}>
                    <Route path="/coordinator" element={<ChiefCoordinatorDashboard />} />
                </Route>

                <Route path="*" element={<div className="p-10">404 - Page Not Found</div>} />
            </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;