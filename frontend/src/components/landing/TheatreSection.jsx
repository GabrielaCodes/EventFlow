import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

// Using the new cursor image per your request
import stagelightCursor from "../../assets/theatre/stagelight.png";
import img1 from "../../assets/theatre/1.jpg";
import img2 from "../../assets/theatre/2.jpg";
import img3 from "../../assets/theatre/3.jpg";
import img4 from "../../assets/theatre/4.jpg";
import img5 from "../../assets/theatre/5.jpg";

const images = [img1, img2, img3, img4, img5];

const TheatreSection = () => {
  const sectionRef = useRef(null);
  const [revealedImages, setRevealedImages] = useState(new Set());
  
  // 1. Intersection Observer for Cursor Logic
  const isInView = useInView(sectionRef, { amount: 0.1 });

  useEffect(() => {
    // Apply the custom cursor to the whole document body when this section is in view
    if (isInView) {
      document.body.style.cursor = `url(${stagelightCursor}) 32 32, crosshair`;
    } else {
      document.body.style.cursor = 'auto'; // Revert back when leaving
    }

    // Cleanup on unmount to prevent stuck cursors
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [isInView]);

  // 2. Spotlight Reveal Interaction
  const handleReveal = (index) => {
    if (!revealedImages.has(index)) {
      setRevealedImages((prev) => new Set(prev).add(index));
    }
  };

  return (
    <section
      ref={sectionRef}
      className="theatre-section"
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(ellipse at center, #2d1810 0%, #0a0604 80%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5rem 1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient Glow / Background Structure */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(218,165,32,0.1), transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: '1200px', width: '100%', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* 3. Tagline Overlay */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            textAlign: 'center',
            fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
            marginBottom: '6vh',
            marginTop: '0',
            fontWeight: '300',
            fontFamily: "'Playfair Display', 'Georgia', serif",
            letterSpacing: '0.05em',
            background: 'linear-gradient(135deg, #FFFACD, #e7c96f, #FFFACD)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(255,215,150,0.4)',
            padding: '0 1rem'
          }}
        >
          "We make you shine brighter when you are under the spotlight"
        </motion.h2>

        {/* Image Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '2rem',
            width: '100%',
            maxWidth: '1000px',
            padding: '0 1rem',
          }}
        >
          {images.map((src, index) => {
            const isRevealed = revealedImages.has(index);
            const isLastImage = index === 4;

            return (
              <div
                key={index}
                onMouseEnter={() => handleReveal(index)}
                style={{
                  // The 5th image spans across both columns to create a nice hero-like base
                  gridColumn: isLastImage ? 'span 2' : 'auto',
                  aspectRatio: isLastImage ? '16/7' : '4/3',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#0a0604',
                  // Soft spotlight glow activates once revealed
                  boxShadow: isRevealed 
                    ? '0 15px 50px rgba(218,165,32,0.3)' 
                    : 'none',
                  transition: 'box-shadow 1.2s ease',
                }}
              >
                <img
                  src={src}
                  alt={`Theatre Moment ${index + 1}`}
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    // Invisible/dark initially, fades in gracefully on hover
                    opacity: isRevealed ? 1 : 0, 
                    filter: isRevealed ? 'brightness(1) grayscale(0)' : 'brightness(0) grayscale(1)',
                    transform: isRevealed ? 'scale(1)' : 'scale(1.05)',
                    transition: 'opacity 1.2s ease, filter 1.5s ease, transform 1.5s ease',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TheatreSection;