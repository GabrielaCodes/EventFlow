import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("1. Button clicked"); // Debug Log

        try {
            console.log("2. Attempting Supabase login..."); // Debug Log
            const { data, error } = await login(email, password);
            
            if (error) {
                console.error("Login Failed:", error.message); // Debug Log
                throw error;
            }

            console.log("3. Login Success! Redirecting..."); // Debug Log
            navigate('/dashboard'); 
            
        } catch (err) {
            console.error("4. Catch Error:", err); // Debug Log
            alert("Login failed: " + err.message);
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