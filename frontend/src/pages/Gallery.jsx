import LandingNavbar from '../components/common/LandingNavbar';

const Gallery = () => {
  // In a real app, you might map over an array of imported images
  // import img1 from '../assets/images/weddings/w1.jpg';
  
  const dummyImages = [1, 2, 3, 4, 5, 6];

  return (
    <div style={{ background: 'var(--bg-chocolate)', minHeight: '100vh' }}>
      <LandingNavbar />
      <div style={{ padding: '8rem 2rem' }}>
        <h1 className="gold-text" style={{ textAlign: 'center', marginBottom: '3rem' }}>Event Gallery</h1>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {dummyImages.map((id) => (
            <div key={id} style={{ 
              height: '250px', 
              background: '#2b1d16', 
              borderRadius: '8px',
              border: '1px solid var(--text-gold-dim)',
              overflow: 'hidden'
            }}>
              {/* <img src={`/assets/images/event-${id}.jpg`} alt="Event" style={{width: '100%', height:'100%', objectFit:'cover'}} /> */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;