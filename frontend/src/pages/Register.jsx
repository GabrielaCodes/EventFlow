import { useState, useEffect } from 'react';
import { supabase } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'client',
        category_id: '',
        companyName: '' 
    });
    
    const [categories, setCategories] = useState([]); 
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCats = async () => {
            const { data } = await supabase.from('event_categories').select('*');
            if (data) setCategories(data);
        };
        fetchCats();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const needsCategory = ['manager', 'employee'].includes(formData.role);

            if (needsCategory && !formData.category_id) {
                alert("Please select a Department/Category.");
                setLoading(false);
                return;
            }

            if (formData.role === 'sponsor' && !formData.companyName) {
                alert("Please enter a Company Name.");
                setLoading(false);
                return;
            }

            const { error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: formData.role,
                        category_id: needsCategory ? formData.category_id : null,
                        company_name: formData.role === 'sponsor' ? formData.companyName : null
                    },
                },
            });

            if (authError) throw authError;

            alert("Registration Successful! Please Log In.");
            navigate('/login'); // ✅ Redirect to Login Page

        } catch (err) {
            console.error("Registration Error:", err);
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
                
                <select 
                    name="role" 
                    className="w-full mb-3 p-2 border rounded" 
                    onChange={handleChange}
                    value={formData.role}
                >
                    <option value="client">Client</option>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="sponsor">Sponsor</option>
                </select>

                {formData.role === 'sponsor' && (
                    <input 
                        name="companyName" 
                        placeholder="Company Name" 
                        required
                        className="w-full mb-3 p-2 border rounded animate-fade-in border-purple-400 bg-purple-50"
                        onChange={handleChange} 
                    />
                )}

                {['manager', 'employee'].includes(formData.role) && (
                    <div className="mb-3 animate-fade-in">
                        <label className="block text-sm text-gray-600 mb-1">
                            Select Department:
                        </label>
                        <select 
                            name="category_id" 
                            className="w-full p-2 border rounded border-blue-400 bg-blue-50" 
                            onChange={handleChange}
                            required
                        >
                            <option value="">-- Select Category --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        {formData.role === 'employee' && (
                            <p className="text-xs text-gray-500 mt-1">
                                You will be assigned to a manager in this department for verification.
                            </p>
                        )}
                    </div>
                )}

                <button 
                    disabled={loading}
                    className="w-full text-white p-2 rounded bg-green-600 hover:bg-green-700"
                >
                    {loading ? "Creating Account..." : "Sign Up"}
                </button>
                
                <p className="mt-4 text-center text-sm">
                    {/* ✅ FIXED: Point to Login Page, not Landing Page */}
                    Already have an account? <Link to="/login" className="text-blue-600 underline">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default Register;