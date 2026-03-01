import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout, role, loading, profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const displayName = 
        profile?.full_name || 
        user?.user_metadata?.full_name || 
        user?.email?.split('@')[0] || 
        'User';

    const companyName = profile?.company_name || user?.user_metadata?.company_name;
    const categoryName = profile?.event_categories?.name;

    const getHomeLink = () => {
        if (role === 'chief_coordinator') return '/coordinator';
        if (role === 'manager') return '/manager-dashboard';
        if (role === 'client') return '/client-dashboard';
        if (role === 'employee') return '/employee-dashboard';
        if (role === 'sponsor') return '/sponsor-dashboard';
        return '/';
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.clear();
            navigate('/login', { replace: true }); 
        }
    };

    return (
        <nav style={{
            background: 'rgba(5,5,5,0.9)',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid rgba(255, 215, 0, 0.15)',
            padding: '0.9rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>

            {/* Premium Logo Styles */}
            <style>{`
                @keyframes shine {
                    0% { background-position: -100%; }
                    100% { background-position: 200%; }
                }

                .ef-logo {
                    font-family: 'Montserrat', sans-serif;
                    font-weight: 800;
                    letter-spacing: 3px;
                    font-size: 1.1rem;
                    text-decoration: none;
                    background: linear-gradient(to bottom, #fff8dc, #ffd54f);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    position: relative;
                }

                .ef-logo::after {
                    content: attr(data-text);
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        120deg,
                        transparent 30%,
                        rgba(255,255,255,0.7) 50%,
                        transparent 70%
                    );
                    background-size: 200% 100%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    animation: shine 5s linear infinite;
                    opacity: 0.5;
                }

                .gold-chip {
                    background: rgba(255, 215, 0, 0.15);
                    border: 1px solid rgba(255, 215, 0, 0.25);
                    color: #ffd54f;
                    border-radius: 6px;
                    padding: 3px 6px;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.6px;
                }
            `}</style>

            {/* LOGO */}
            <Link to={getHomeLink()} className="ef-logo" data-text="EVENTFLOW">
                EVENTFLOW
            </Link>

            {!loading && (
                <div>
                    {user ? (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            
                            {/* Name + Company */}
                            <div style={{ textAlign: 'right', lineHeight: 1.1 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                                    {displayName}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                                    {role === 'manager' && categoryName 
                                        ? categoryName 
                                        : companyName
                                    }
                                </div>
                            </div>

                            {/* Role Badge */}
                            <span className="gold-chip">
                                {role ? role.replace('_', ' ') : 'Guest'}
                            </span>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                style={{
                                    background: 'linear-gradient(45deg,#ffe082,#ffb300)',
                                    color: '#000',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '1.2rem', fontSize: '0.85rem' }}>
                            
                            <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>
                                Home
                            </Link>

                            {location.pathname === '/register' && (
                                <Link to="/login" style={{ color: '#ffd54f', textDecoration: 'none' }}>
                                    Login
                                </Link>
                            )}

                            {location.pathname === '/login' && (
                                <Link to="/register" style={{ color: '#ffd54f', textDecoration: 'none' }}>
                                    Register
                                </Link>
                            )}

                            {location.pathname !== '/login' && location.pathname !== '/register' && (
                                <Link to="/login" style={{ color: '#ffd54f', textDecoration: 'none' }}>
                                    Login
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;