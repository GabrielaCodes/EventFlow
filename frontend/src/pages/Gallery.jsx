import LandingNavbar from '../components/common/LandingNavbar';

// 1. You MUST import the images from your src/assets subfolder
import img1 from '../assets/weddings/1.jpeg'; 
import img2 from '../assets/weddings/2.jpeg';
import img3 from '../assets/weddings/3.jpeg';
import img4 from '../assets/weddings/4.jpeg';
import img5 from '../assets/weddings/5.jpeg';
import img6 from '../assets/weddings/6.jpeg';

const Gallery = () => {
  // 2. Put the imports into an array
  const eventImages = [img1, img2, img3, img4, img5, img6];

  return (
    <div style={{ background: '#000000', minHeight: '100vh', fontFamily: 'Open Sans, sans-serif' }}>
      <LandingNavbar />
      <div style={{ padding: '8rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '3rem', 
          color: '#d4af37', 
          textTransform: 'uppercase',
          letterSpacing: '3px',
          textShadow: '0 0 15px rgba(212, 175, 55, 0.3)'
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
              // ✅ FORCES 4:3 RATIO
              aspectRatio: '4 / 3', 
              background: '#050505', 
              borderRadius: '12px',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
              transition: 'transform 0.3s ease'
            }}>
              {/* ✅ THE IMAGE TAG IS NOW UNCOMMENTED AND WORKING */}
              <img 
                src={src} 
                alt={`Event ${index + 1}`} 
                style={{
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', // ✅ Prevents stretching
                  display: 'block'
                }} 
              />
              
              {/* Golden Glass Overlay at the bottom */}
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