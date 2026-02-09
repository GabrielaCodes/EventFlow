import { motion, useInView } from 'framer-motion';
import { useState, useRef } from 'react';
import theatreLightOff from "../../assets/theatre/theatrelightoff.png";
import theatreLightOn from "../../assets/theatre/theatrelighton.jpeg";
import img1 from "../../assets/theatre/1.jpg";
import img2 from "../../assets/theatre/2.jpg";
import img3 from "../../assets/theatre/3.jpg";
import img4 from "../../assets/theatre/4.jpg";
import img5 from "../../assets/theatre/5.jpg";

const images = [img1, img2, img3, img4];

const TheatreSection = () => {
  const [isLightsOn, setIsLightsOn] = useState(false);
  
  // Ref to track the section
  const sectionRef = useRef(null);
  // Check if section is in view (amount: 0.5 means button appears when 50% of section is visible)
  const isInView = useInView(sectionRef, { amount: 0.5 });
  
  // Sweep duration
  const sweepDuration = 3.5;

  return (
    <section
      ref={sectionRef} // Attached ref here
      style={{
        minHeight: '100vh',
        // Default is #443429 (Dark), changes to #c4a88b (Fawn) only when clicked
        background: isLightsOn ? '#c4a88b' : '#443429', 
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        transition: 'background-color 0.8s ease' // Smooth color fade
      }}
    >
      {/* ================= LEFT SIDE: LIGHT SOURCE & IMG 5 ================= */}
      <div style={{ width: '40%', position: 'relative', height: '100vh', zIndex: 20 }}>
        
        {/* LIGHT FIXTURE CONTAINER */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', maxWidth: '500px' }}>

          {/* LIGHT OFF IMAGE */}
          <motion.img
            src={theatreLightOff}
            alt="Spotlight Off"
            draggable={false}
            animate={{ opacity: isLightsOn ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            style={{ width: '100%', position: 'absolute', zIndex: 1, top: 0, right: 0 }}
          />

          {/* LIGHT ON IMAGE */}
          <motion.img
            src={theatreLightOn}
            alt="Spotlight On"
            draggable={false}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLightsOn ? 1 : 0 }}
            transition={{ duration: 0.1 }}
            style={{ width: '100%', position: 'relative', zIndex: 2 }}
          />

          {/* CONTROL BUTTON - VISIBLE ONLY WHEN SCROLLED TO SECTION */}
          {!isLightsOn && isInView && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsLightsOn(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                position: 'fixed', // Keeps it centered on screen
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 50,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid #f5e6c8',
                color: '#f5e6c8',
                padding: '0.8rem 1.5rem',
                borderRadius: '30px',
                cursor: 'pointer',
                fontFamily: "'Playfair Display', serif",
                fontSize: '0.9rem',
                letterSpacing: '1px',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <span style={{ width: '8px', height: '8px', background: '#ff4444', borderRadius: '50%', boxShadow: '0 0 8px #ff4444' }}/>
              START SHOW
            </motion.button>
          )}

          {/* ================= THE BEAM PIVOT ================= */}
          <motion.div
            style={{
              position: 'absolute',
              top: '73%',
              left: '36%',
              width: 0,
              height: 0,
              zIndex: 30,
            }}
            initial={{ rotate: -25 }} 
            animate={isLightsOn ? { rotate: -60 } : {}}
            transition={{ duration: sweepDuration, ease: "easeInOut" }}
          >
            {/* VISIBLE LIGHT BEAM */}
            <motion.div
              initial={{ opacity: 0, scaleY: 0.2 }}
              animate={isLightsOn ? { opacity: [0, 1, 0.8, 0], scaleY: 1 } : {}}
              transition={{ 
                opacity: { duration: sweepDuration, times: [0, 0.1, 0.8, 1] },
                scaleY: { duration: 0.4 }
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: '-350px',
                width: '700px',
                height: '250vh',
                transformOrigin: 'top center',
                background: 'conic-gradient(from 180deg at 50% 0%, transparent 160deg, rgba(255, 220, 150, 0.7) 165deg, rgba(255, 255, 255, 1) 180deg, rgba(255, 220, 150, 0.7) 195deg, transparent 200deg)',
                filter: 'blur(20px)',
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
              }}
            >
              {/* RAYS LAYER */}
              <motion.div
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  background: 'repeating-conic-gradient(from 180deg at 50% 0%, rgba(255, 230, 150, 0.5) 0deg 2deg, transparent 2deg 36deg)',
                  filter: 'blur(10px)', mixBlendMode: 'screen', pointerEvents: 'none',
                }}
                initial={{ opacity: 0 }}
                animate={isLightsOn ? { opacity: [0, 1, 0.8, 0] } : {}}
                transition={{ opacity: { duration: sweepDuration, times: [0, 0.1, 0.8, 1] } }}
              />
            </motion.div>

            {/* LENS FLARE GLOW */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isLightsOn ? { opacity: [0, 1, 1, 0] } : {}}
              transition={{ opacity: { duration: sweepDuration, times: [0, 0.1, 0.9, 1] } }}
              style={{
                position: 'absolute', top: 0, left: 0,
                transform: 'translate(-50%, -50%)',
                width: '180px', height: '180px',
                background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,215,0,0.8) 40%, transparent 70%)',
                filter: 'blur(20px)',
                boxShadow: '0 0 80px 40px rgba(255, 215, 0, 0.6)',
                pointerEvents: 'none', mixBlendMode: 'screen'
              }}
            />
          </motion.div>
        </div>

        {/* ================= NEW: IMAGE 5 (BELOW LIGHT) ================= */}
        <motion.div
          initial={{ opacity: 0, filter: 'brightness(0)' }}
          animate={isLightsOn ? { 
            opacity: 1, 
            filter: ['brightness(0)', 'brightness(1.5)', 'brightness(1)'] 
          } : {}}
          transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
          style={{
  position: 'absolute',
  bottom: '-45px',   // ← adjust: -6px, -10px, -14px
  right: '10%',
  width: '71%',
  aspectRatio: '4/3',
  overflow: 'hidden',
  borderRadius: '4px',
  zIndex: 10
}}


        >
          <img 
            src={img5} 
            alt="Theatre 5"
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </motion.div>

      </div>

      {/* ================= RIGHT SIDE: CONTENT ================= */}
      <div style={{ width: '60%', padding: '15vh 4rem 0 2rem', zIndex: 10 }}>
        
        {/* SECTION TITLE */}
        

        {/* IMAGE GRID (1-4) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '2rem' }}>
          {images.map((src, index) => {
            const delay = index % 2 === 0 ? 1.0 : 2.2;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, filter: 'brightness(0)' }}
                animate={isLightsOn ? { 
                  opacity: 1, 
                  filter: ['brightness(0)', 'brightness(1.5)', 'brightness(1)']
                } : {}}
                transition={{ delay, duration: 1.2, ease: "easeOut" }}
                style={{ 
                  aspectRatio: '4/3', 
                  overflow: 'hidden',
                  borderRadius: '4px',
                  position: 'relative'
                }}
              >
                <img 
                  src={src} 
                  alt={`Theatre ${index + 1}`}
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TheatreSection;