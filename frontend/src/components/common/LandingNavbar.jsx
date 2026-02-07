import { Link } from 'react-router-dom';

const LandingNavbar = () => {
  // Function to handle smooth scrolling
  const handleScroll = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav style={{
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '1.5rem 3rem',
      position: 'fixed',
      width: '100%',
      top: 0,
      zIndex: 100,
      background: 'rgba(5, 5, 5, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.1)'
    }}>
      
      {/* --- LOGO STYLES (Kept exactly as you provided) --- */}
      <style>{`
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
          font-size: 1.4rem; letter-spacing: 2px; z-index: 10;
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
        @keyframes shine {
          0% { background-position: -100%; } 20% { background-position: 200%; } 100% { background-position: 200%; }
        }
        
        /* New Link Styles */
        .nav-link {
          color: var(--text-cream, #f5f5f5); text-decoration: none;
          fontSize: 0.9rem; letter-spacing: 1px; cursor: pointer;
          transition: color 0.3s;
        }
        .nav-link:hover { color: #ffd54f; }
      `}</style>

      {/* --- LOGO --- */}
      <Link to="/" className="ef-logo-container" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
        <div className="bg"></div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 342 208" className="splash">
          <path strokeLinecap="round" d="M54.1054 99.7837C54.1054 99.7837 40.0984 90.7874 26.6893 97.6362C13.2802 104.485 1.5 97.6362 1.5 97.6362"></path>
          <path strokeLinecap="round" d="M285.273 99.7841C285.273 99.7841 299.28 90.7879 312.689 97.6367C326.098 104.486 340.105 95.4893 340.105 95.4893"></path>
          <path strokeLinecap="round" strokeOpacity="0.3" d="M281.133 64.9917C281.133 64.9917 287.96 49.8089 302.934 48.2295C317.908 46.6501 319.712 36.5272 319.712 36.5272"></path>
          <path strokeLinecap="round" strokeOpacity="0.3" d="M281.133 138.984C281.133 138.984 287.96 154.167 302.934 155.746C317.908 157.326 319.712 167.449 319.712 167.449"></path>
        </svg>
        <div className="wrap">
          <div className="content" data-text="EVENTFLOW">EVENTFLOW</div>
        </div>
      </Link>

      {/* --- NAVIGATION LINKS --- */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        
        {/* Scroll Links */}
        <a href="#wedding" className="nav-link" onClick={(e) => handleScroll(e, 'wedding')}>WEDDINGS</a>
        <a href="#theatre" className="nav-link" onClick={(e) => handleScroll(e, 'theatre')}>THEATRE</a>
        <a href="#graduation" className="nav-link" onClick={(e) => handleScroll(e, 'graduation')}>GRADUATION</a>
        <a href="#concert" className="nav-link" onClick={(e) => handleScroll(e, 'concert')}>CONCERTS</a>

        {/* Auth Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginLeft: '1rem' }}>
          {/* ✅ FIXED: Points to actual Login Page */}
          <Link to="/login" style={{ 
            color: '#ffd54f', 
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>LOGIN</Link>
          
          {/* ✅ FIXED: Points to actual Register Page */}
          <Link to="/register" style={{ 
            padding: '0.6rem 1.8rem', 
            background: 'linear-gradient(45deg, #ffe082, #ffb300)',
            borderRadius: '2px',
            color: '#000',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}>REGISTER</Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;