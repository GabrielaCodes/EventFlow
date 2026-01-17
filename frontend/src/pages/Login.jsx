import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/api'; 

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Perform the Auth Login
            const { user } = await login(email, password);

            if (!user) throw new Error("Login failed");

            // 2. Fetch the role manually (SAFER METHOD)
            // We use .maybeSingle() instead of .single() to avoid the "Cannot coerce" crash
            let { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            // 🛑 RETRY LOGIC: If profile is missing (race condition), wait 1 second and try again
            if (!profile) {
                console.log("⚠️ Profile not ready. Waiting for trigger...");
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const retry = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();
                
                profile = retry.data;
            }

            if (error) console.error("Profile fetch error:", error);

            // 3. Robust Fallback
            // If the profile is STILL missing, default to 'client' so the user isn't stuck.
            const userRole = profile?.role || 'client';

            // 4. Dynamic Redirect
            switch (userRole) {
                case 'manager':
                    navigate('/manager-dashboard');
                    break;
                case 'sponsor':
                    navigate('/sponsor-dashboard');
                    break;
                case 'client':
                    navigate('/client-dashboard');
                    break;
                case 'employee': 
                    navigate('/employee-dashboard'); 
                    break;
                default:
                    navigate('/client-dashboard'); 
            }

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