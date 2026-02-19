import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/api';
import './AuthStyles.css';

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
            const { user, error: loginError } = await login(email, password);
            if (loginError || !user) throw new Error("Invalid email or password");

            let { data: profile, error } = await supabase
                .from('profiles')
                .select('verification_status')
                .eq('id', user.id)
                .maybeSingle();

            if (error) console.warn("Profile fetch warning:", error);

            if (profile?.verification_status === 'pending') {
                await logout();
                alert("🚫 Account Pending Approval.\n\nYour account is currently under review. You will be able to log in once it has been approved. Please wait for an email notification.");
                setLoading(false);
                return;
            }

            if (profile?.verification_status === 'rejected') {
                await logout();
                alert("❌ Account Rejected.\n\nYour access has been revoked.");
                setLoading(false);
                return;
            }

            navigate('/dashboard');

        } catch (err) {
            console.error('Login error:', err.message);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="form8">
                
                {/* Stripes Background */}
                <div className="stripes">
                    <div className="stripe stripe1"></div>
                    <div className="stripe stripe2"></div>
                    <div className="stripe stripe3"></div>
                    <div className="stripe stripe4"></div>
                    <div className="stripe stripe5"></div>
                    <div className="stripe stripe6"></div>
                    <div className="stripe stripe7"></div>
                </div>

                {/* ✅ Home Link Removed (as requested) */}

                {/* Toggle to Register */}
                <Link to="/register" className="form8__btncircle" title="Switch to Register">
                    <span></span>
                    <span></span>
                    <span></span>
                </Link>

                <div className="form8__log">
                    <span className="form8__text">
                        <span>Sign in</span> now
                    </span>
                    
                    <form onSubmit={handleSubmit}>
                        <input 
                            className="form8__inpt"
                            type="email" 
                            placeholder="Email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                        <input 
                            className="form8__inpt"
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                        
                        <button className="form8__btn" disabled={loading}>
                            {loading ? "Signing In..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;