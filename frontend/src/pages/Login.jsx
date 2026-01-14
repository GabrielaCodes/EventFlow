import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/api'; // Import supabase directly for the role check

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // 1. Perform the Auth Login
            const { user } = await login(email, password);

            if (!user) throw new Error("Login failed");

            // 2. Fetch the role manually (to avoid waiting for Context sync)
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            // 3. Dynamic Redirect
            switch (profile.role) {
                case 'manager':
                    navigate('/manager-dashboard');
                    break;
                case 'sponsor':
                    navigate('/sponsor-dashboard');
                    break;
                case 'client':
                    navigate('/client-dashboard');
                    break;
                // Add this if you enabled 'employee' in the DB
                case 'employee': 
                    navigate('/employee-dashboard'); 
                    break;
                default:
                    navigate('/'); // Fallback
            }

        } catch (err) {
            console.error('Login error:', err.message);
            alert(err.message);
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
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                    Sign In
                </button>
                <p className="mt-4 text-center text-sm">
                    Don't have an account? <Link to="/register" className="text-blue-600 underline">Sign Up</Link>
                </p>
            </form>
        </div>
    );
};

export default Login;