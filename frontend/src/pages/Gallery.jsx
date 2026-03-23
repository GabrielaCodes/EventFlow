import { useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/common/LandingNavbar';

// 1. You MUST import the images from your src/assets subfolder
import img1 from '../assets/weddings/1.jpeg'; 
import img2 from '../assets/weddings/2.jpeg';
import img3 from '../assets/weddings/3.jpeg';
import img4 from '../assets/weddings/4.jpeg';
import img5 from '../assets/weddings/5.jpeg';
import img6 from '../assets/weddings/6.jpeg';

const Gallery = () => {
  const navigate = useNavigate();
  
  const eventImages = [img1, img2, img3, img4, img5, img6];

  // --- SMART BACK FUNCTION ---
  const handleBack = () => {
    // If history length is 1 or 2, it means this is a newly opened tab or a direct link
    if (window.history.length <= 2) {
      // Attempt to close the newly opened tab (returning them to the dashboard)
      window.close();
      
      // Fallback: If the browser's security blocks window.close(), route to home
      setTimeout(() => {
        navigate('/');
      }, 300);
    } else {
      // Normal behavior: go back one page
      navigate(-1);
    }
  };

  return (
    <div style={{ background: '#000000', minHeight: '100vh', fontFamily: 'Open Sans, sans-serif' }}>
      <LandingNavbar />
      <div style={{ padding: '8rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* --- SMART BACK BUTTON --- */}
        <button 
          onClick={handleBack}
          style={{
            background: 'transparent',
            color: '#d4af37',
            border: '1px solid rgba(212, 175, 55, 0.5)',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '2rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.85rem',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
            e.currentTarget.style.border = '1px solid #d4af37';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.border = '1px solid rgba(212, 175, 55, 0.5)';
          }}
        >
          ← Back
        </button>

        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '3rem', 
          color: '#d4af37', 
          textTransform: 'uppercase',
          letterSpacing: '3px',
          textShadow: '0 0 15px rgba(212, 175, 55, 0.3)',
          marginTop: '0' 
        }}>
          Event <span style={{ color: '#fff' }}>Gallery</span>
        </h1>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '2rem' 
        }}>
          {eventImages.map((src, index) => (
            <div key={index} style={{ 
              aspectRatio: '4 / 3', 
              background: '#050505', 
              borderRadius: '12px',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
              transition: 'transform 0.3s ease'
            }}>
              <img 
                src={src} 
                alt={`Event ${index + 1}`} 
                style={{
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  display: 'block'
                }} 
              />
              
              <div style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height: '4px',
                background: 'linear-gradient(90deg, #b8860b, #ffd700, #b8860b)'
              }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;