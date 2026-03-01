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
            padding: '1rem 1.8rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>

            {/* LOGO STYLES */}
            <style>{`
                @keyframes shine {
                    0% { background-position: -100%; }
                    100% { background-position: 200%; }
                }

                .ef-logo-container {
                  --gold-100: #fff9c4; --gold-200: #ffd54f; --gold-300: #ffb300;
                  --gold-400: #ff8f00; --gold-500: #ff6f00; --black-bg: #000000;
                  --radius: 12px;
                  position: relative; width: 200px; height: 55px;
                  transform: skewX(-10deg); display: flex; align-items: center;
                  justify-content: center; text-decoration: none;
                }
                .ef-logo-container .bg {
                  position: absolute; inset: 0; border-radius: var(--radius);
                  background: var(--black-bg); border: 1px solid rgba(255, 215, 0, 0.3);
                }
                .ef-logo-container .bg::before {
                  content: ""; position: absolute; inset: 0; border-radius: var(--radius);
                  background: var(--gold-500); filter: blur(15px); opacity: 0.2;
                  z-index: -1; transition: opacity 0.3s ease;
                }
                .ef-logo-container:hover .bg::before { opacity: 0.5; }
                .ef-logo-container .wrap {
                  position: relative; width: 96%; height: 90%;
                  border-radius: calc(var(--radius) - 2px);
                  background: linear-gradient(180deg, #1a1a1a 0%, #000 100%);
                  display: flex; align-items: center; justify-content: center;
                  overflow: hidden; box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
                }
                .ef-logo-container .content {
                  font-family: 'Montserrat', sans-serif; font-weight: 900;
                  font-size: 1.3rem; letter-spacing: 2px; z-index: 10;
                  background: linear-gradient(to bottom, var(--gold-100), var(--gold-300));
                  -webkit-background-clip: text; background-clip: text; color: transparent;
                  text-shadow: 0 2px 10px rgba(255, 179, 0, 0.3);
                  transform: skewX(10deg); position: relative;
                }
                .ef-logo-container .content::after {
                  content: attr(data-text); position: absolute; left: 0; top: 0;
                  width: 100%; height: 100%;
                  background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.8) 50%, transparent 70%);
                  background-size: 200% 100%; -webkit-background-clip: text;
                  background-clip: text; color: transparent; animation: shine 4s infinite linear;
                  opacity: 0.5;
                }
                .ef-logo-container .splash {
                  position: absolute; top: -20%; left: -10%; width: 120%; height: 140%;
                  pointer-events: none; stroke: var(--gold-300); stroke-width: 1;
                  stroke-dasharray: 60 60; stroke-dashoffset: 60; opacity: 0.5;
                }
            `}</style>

            {/* PREMIUM LOGO */}
            <Link 
              to={getHomeLink()} 
              className="ef-logo-container"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="bg"></div>

              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 342 208" className="splash">
                <path strokeLinecap="round" d="M54.1054 99.7837C54.1054 99.7837 40.0984 90.7874 26.6893 97.6362C13.2802 104.485 1.5 97.6362 1.5 97.6362"></path>
                <path strokeLinecap="round" d="M285.273 99.7841C285.273 99.7841 299.28 90.7879 312.689 97.6367C326.098 104.486 340.105 95.4893 340.105 95.4893"></path>
                <path strokeLinecap="round" strokeOpacity="0.3" d="M281.133 64.9917C281.133 64.9917 287.96 49.8089 302.934 48.2295C317.908 46.6501 319.712 36.5272 319.712 36.5272"></path>
                <path strokeLinecap="round" strokeOpacity="0.3" d="M281.133 138.984C281.133 138.984 287.96 154.167 302.934 155.746C317.908 157.326 319.712 167.449 319.712 167.449"></path>
              </svg>

              <div className="wrap">
                <div className="content" data-text="EVENTFLOW">
                  EVENTFLOW
                </div>
              </div>
            </Link>

            {/* RIGHT SIDE */}
            {!loading && (
                <div>
                    {user ? (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#fff' }}>
                            
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                    {displayName}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#bbb' }}>
                                    {role === 'manager' && categoryName ? categoryName : companyName}
                                </div>
                            </div>

                            <span style={{
                                background: 'rgba(255,215,0,0.15)',
                                border: '1px solid rgba(255,215,0,0.3)',
                                color: '#ffd54f',
                                padding: '3px 6px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                textTransform: 'uppercase'
                            }}>
                                {role ? role.replace('_', ' ') : 'Guest'}
                            </span>

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
                            <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link>

                            {location.pathname === '/register' && (
                                <Link to="/login" style={{ color: '#ffd54f', textDecoration: 'none' }}>Login</Link>
                            )}

                            {location.pathname === '/login' && (
                                <Link to="/register" style={{ color: '#ffd54f', textDecoration: 'none' }}>Register</Link>
                            )}

                            {location.pathname !== '/login' && location.pathname !== '/register' && (
                                <Link to="/login" style={{ color: '#ffd54f', textDecoration: 'none' }}>Login</Link>
                            )}
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;