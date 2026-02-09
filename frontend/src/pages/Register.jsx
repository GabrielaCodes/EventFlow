import { useState, useEffect } from 'react';
import { supabase } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import './AuthStyles.css';

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
            navigate('/login');

        } catch (err) {
            console.error("Registration Error:", err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            {/* register__bg active: Gold Card Style */}
            <div className="form8 register__bg">
                
                <div className="stripes">
                    <div className="stripe stripe1"></div>
                    <div className="stripe stripe2"></div>
                    <div className="stripe stripe3"></div>
                    <div className="stripe stripe4"></div>
                    <div className="stripe stripe5"></div>
                    <div className="stripe stripe6"></div>
                    <div className="stripe stripe7"></div>
                </div>

                {/* ✅ Home Link Removed */}

                {/* Toggle to Login */}
                <Link to="/login" className="form8__btncircle active" title="Switch to Login">
                    <span></span>
                    <span></span>
                    <span></span>
                </Link>

                <div className="form8__reg" style={{ opacity: 1, top: 0 }}>
                    <span className="form8__text">
                        <span>Sign up</span> free
                    </span>

                    <form onSubmit={handleSubmit}>
                        <input 
                            name="fullName" placeholder="Full Name" required
                            className="form8__inpt"
                            onChange={handleChange} 
                        />
                        <input 
                            name="email" type="email" placeholder="Email" required
                            className="form8__inpt"
                            onChange={handleChange} 
                        />
                        <input 
                            name="password" type="password" placeholder="Password" required
                            className="form8__inpt"
                            onChange={handleChange} 
                        />

                        <select 
                            name="role" 
                            className="form8__inpt" 
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
                                className="form8__inpt"
                                onChange={handleChange} 
                            />
                        )}

                        {['manager', 'employee'].includes(formData.role) && (
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <select 
                                    name="category_id" 
                                    className="form8__inpt"
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select Department --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button className="form8__btn" disabled={loading}>
                            {loading ? "Creating..." : "Submit"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;