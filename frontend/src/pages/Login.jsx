import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/api'; 

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, logout } = useAuth(); // ✅ Get logout
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Perform the Auth Login
            const { user } = await login(email, password);
            if (!user) throw new Error("Login failed");

            // 2. Security Check: Fetch Profile Status immediately
            // We do this here to catch them BEFORE they enter the app
            let { data: profile, error } = await supabase
                .from('profiles')
                .select('verification_status')
                .eq('id', user.id)
                .maybeSingle();

            if (error) console.warn("Profile fetch warning:", error);

            // 🛑 BLOCK PENDING USERS
            if (profile?.verification_status === 'pending') {
                await logout(); // Force logout in Supabase
                alert("🚫 Account Pending Approval.\n\nPlease wait for the Chief Coordinator to verify you.");
                setLoading(false);
                return; // Stop execution
            }

            // 🛑 BLOCK REJECTED USERS
            if (profile?.verification_status === 'rejected') {
                await logout();
                alert("❌ Account Rejected.\n\nYour access has been revoked. Contact support.");
                setLoading(false);
                return;
            }

            // 3. Success - Let App.jsx handle the routing
            navigate('/dashboard'); 

        } catch (err) {
            console.error('Login error:', err.message);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl mb-4 font-bold text-center">Login</h2>
                <input 
                    className="w-full mb-3 p-2 border rounded" 
                    type="email" 
                    placeholder="Email" 
                    onChange={(e) => setEmail(e.target.value)} 
                />
                <input 
                    className="w-full mb-3 p-2 border rounded" 
                    type="password" 
                    placeholder="Password" 
                    onChange={(e) => setPassword(e.target.value)} 
                />
                <button 
                    disabled={loading}
                    type="submit" 
                    className={`w-full text-white p-2 rounded ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {loading ? "Signing In..." : "Sign In"}
                </button>
                <p className="mt-4 text-center text-sm">
                    Don't have an account? <Link to="/register" className="text-blue-600 underline">Sign Up</Link>
                </p>
            </form>
        </div>
    );
};

export default Login;