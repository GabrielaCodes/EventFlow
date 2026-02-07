import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/api'; 

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Perform the Auth Login
            const { user, error: loginError } = await login(email, password);
            if (loginError || !user) throw new Error("Invalid email or password");

            // 2. Security Check: Fetch Profile Status
            let { data: profile, error } = await supabase
                .from('profiles')
                .select('verification_status')
                .eq('id', user.id)
                .maybeSingle();

            if (error) console.warn("Profile fetch warning:", error);

            // 🛑 BLOCK PENDING USERS
            if (profile?.verification_status === 'pending') {
                await logout(); 
                alert("🚫 Account Pending Approval.\n\nPlease wait for the Chief Coordinator to verify you.");
                setLoading(false);
                return;
            }

            // 🛑 BLOCK REJECTED USERS
            if (profile?.verification_status === 'rejected') {
                await logout();
                alert("❌ Account Rejected.\n\nYour access has been revoked.");
                setLoading(false);
                return;
            }

            // 3. Success
            navigate('/dashboard'); 

        } catch (err) {
            console.error('Login error:', err.message);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 relative">
            
            {/* ✅ MANUAL HOME LINK (Top Left) */}
            <Link 
                to="/" 
                className="absolute top-6 left-6 text-blue-600 hover:text-blue-800 font-bold flex items-center gap-2"
            >
                ← Home
            </Link>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl mb-4 font-bold text-center text-gray-800">Login</h2>
                
                <input 
                    className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    type="email" 
                    placeholder="Email" 
                    onChange={(e) => setEmail(e.target.value)} 
                />
                <input 
                    className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    type="password" 
                    placeholder="Password" 
                    onChange={(e) => setPassword(e.target.value)} 
                />
                
                <button 
                    disabled={loading}
                    type="submit" 
                    className={`w-full text-white p-2 rounded font-semibold transition ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {loading ? "Signing In..." : "Sign In"}
                </button>
                
                <p className="mt-4 text-center text-sm text-gray-600">
                    Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Sign Up</Link>
                </p>
            </form>
        </div>
    );
};

export default Login;