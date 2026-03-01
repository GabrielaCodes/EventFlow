import { useState, useRef, useEffect } from 'react';
import { motion, useInView, useMotionValue } from 'framer-motion';

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
  const [isHoveringSection, setIsHoveringSection] = useState(false);
  
  // 1. Framer Motion values to smoothly track mouse position
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const isInView = useInView(sectionRef, { amount: 0.1 });

  // 2. Track global mouse coordinates for the custom cursor
  useEffect(() => {
    const updateMousePosition = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, [cursorX, cursorY]);

  // 3. Spotlight Reveal Interaction
  const handleReveal = (index) => {
    if (!revealedImages.has(index)) {
      setRevealedImages((prev) => new Set(prev).add(index));
    }
  };

  return (
    <section
      ref={sectionRef}
      className="theatre-section"
      onMouseEnter={() => setIsHoveringSection(true)}
      onMouseLeave={() => setIsHoveringSection(false)}
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
        cursor: 'none' // Hide the default cursor when inside this section
      }}
    >
      {/* ================= CUSTOM CURSOR ================= */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          x: cursorX,
          y: cursorY,
          pointerEvents: 'none',
          zIndex: 99999, // Ensure it stays above everything
          // Center hotspot adjustment (tweak percentages if the pointer tip feels off)
          translateX: '-25%',
          translateY: '-25%',
          opacity: isHoveringSection ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        {/* Upper Left Glow Element */}
        <div
          style={{
            position: 'absolute',
            top: '-15px',
            left: '-15px',
            width: '60px',
            height: '60px',
            background: 'radial-gradient(circle, rgba(255, 230, 150, 0.9) 0%, rgba(218, 165, 32, 0.5) 40%, transparent 70%)',
            filter: 'blur(12px)',
            zIndex: 1,
          }}
        />
        
        {/* The Bigger Cursor Image */}
        <img
          src={stagelightCursor}
          alt="Spotlight Cursor"
          style={{
            width: '90px', // Explicitly making it much larger
            height: 'auto',
            position: 'relative',
            zIndex: 2,
            // Adds a very subtle global glow to the image itself to match the theme
            filter: 'drop-shadow(0px 0px 8px rgba(255, 215, 0, 0.3))' 
          }}
        />
      </motion.div>


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
        
        {/* Tagline Overlay */}
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
                  gridColumn: isLastImage ? 'span 2' : 'auto',
                  aspectRatio: isLastImage ? '16/7' : '4/3',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#0a0604',
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