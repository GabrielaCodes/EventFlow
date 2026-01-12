import { useState } from 'react';
import { supabase } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'client' // Default role
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Sign up with Supabase Auth
            // We pass "data" so the SQL Trigger automatically creates the Profile
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: formData.role,
                    },
                },
            });

            if (error) throw error;

            alert("Registration Successful! Please Log In.");
            navigate('/');
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl mb-4 font-bold text-center">Create Account</h2>
                
                <input 
                    name="fullName" placeholder="Full Name" required
                    className="w-full mb-3 p-2 border rounded" 
                    onChange={handleChange} 
                />
                <input 
                    name="email" type="email" placeholder="Email" required
                    className="w-full mb-3 p-2 border rounded" 
                    onChange={handleChange} 
                />
                <input 
                    name="password" type="password" placeholder="Password" required
                    className="w-full mb-3 p-2 border rounded" 
                    onChange={handleChange} 
                />
                
                <select name="role" className="w-full mb-3 p-2 border rounded" onChange={handleChange}>
                    <option value="client">Client</option>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="sponsor">Sponsor</option>
                </select>

                <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
                    Sign Up
                </button>
                
                <p className="mt-4 text-center text-sm">
                    Already have an account? <Link to="/" className="text-blue-600 underline">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default Register;