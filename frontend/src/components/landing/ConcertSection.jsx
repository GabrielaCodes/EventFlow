import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

import img1 from "../../assets/concerts/1.jpg";
import img2 from "../../assets/concerts/2.jpg";
import img3 from "../../assets/concerts/3.jpg";
import img4 from "../../assets/concerts/4.jpg";

const concertEvents = [
  {
    id: 1,
    src: img1,
    title: "Neon Pulse Live",
    subtitle: "A night where bass met skyline",
    expanded: "EventFlow transformed an open rooftop into a neon-lit arena, syncing lights, sound, and crowd energy into one seamless pulse that carried till midnight."
  },
  {
    id: 2,
    src: img2,
    title: "Echoes Under the Stars",
    subtitle: "Indie voices. Infinite skies.",
    expanded: "We curated an open-air indie concert with ambient lighting and immersive staging, turning a quiet venue into a shared moment of music and stillness."
  },
  {
    id: 3,
    src: img3,
    title: "Midnight Frequency Fest",
    subtitle: "When the city tuned in together",
    expanded: "From stage design to live visuals, EventFlow engineered a high-voltage night where electronic beats, LED waves, and crowd rhythm moved as one frequency."
  },
  {
    id: 4,
    src: img4,
    title: "Amplify Arena Night",
    subtitle: "Sound louder than the moment",
    expanded: "We built a stadium-grade concert experience with precision acoustics and immersive visuals, delivering a night where every drop hit harder than the last."
  }
];

// Reusable Glass Card Component
const ConcertCard = ({ event }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        y: -5,
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
        boxShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.6)"
      }}
      style={{
        /* PREMIUM GLASSMORPHISM SETTINGS */
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.005) 100%)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)", /* Safari support */
        
        /* Edge Lighting (Top/Left brighter, Bottom/Right darker) */
        borderTop: "1px solid rgba(255, 255, 255, 0.12)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.02)",
        borderRight: "1px solid rgba(255, 255, 255, 0.02)",
        
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.4)",
        borderRadius: "16px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
      }}
    >
      {/* Top Image / Description Area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)", // Inner rim for the image
          background: "#0a0a0a"
        }}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.img
              key="image"
              src={event.src}
              alt={event.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <motion.div
              key="description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                width: "100%",
                height: "100%",
                padding: "24px",
                display: "flex",
                alignItems: "center",
                background: "linear-gradient(135deg, rgba(20,20,20,0.9) 0%, rgba(5,5,5,0.95) 100%)",
                backdropFilter: "blur(10px)"
              }}
            >
              <p
                style={{
                  color: "#e5e5e5",
                  fontSize: "1rem",
                  lineHeight: "1.6",
                  margin: 0,
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  fontWeight: 300,
                  letterSpacing: "0.02em"
                }}
              >
                {event.expanded}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spotify-style Action Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation(); // Prevents double-triggering if you add onClick to the card later
            setIsExpanded(!isExpanded);
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: isHovered || isExpanded ? 1 : 0, 
            y: isHovered || isExpanded ? 0 : 10 
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: isExpanded ? "#ffffff" : "#1ed760", // Spotify Green
            color: "#000000",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 8px 16px rgba(0,0,0,0.4)",
            zIndex: 10,
          }}
        >
          {isExpanded ? (
            // Close / Back Icon
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          ) : (
            // Play Icon
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style={{ marginLeft: "4px" }}>
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Bottom Text Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "0 4px" }}>
        <h3
          style={{
            margin: 0,
            color: "#ffffff",
            fontSize: "1.1rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontFamily: "system-ui, -apple-system, sans-serif",
            letterSpacing: "-0.01em"
          }}
        >
          {event.title}
        </h3>
        <p
          style={{
            margin: 0,
            color: "#a7a7a7",
            fontSize: "0.875rem",
            fontWeight: 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontFamily: "system-ui, -apple-system, sans-serif"
          }}
        >
          {event.subtitle}
        </p>
      </div>
    </motion.div>
  );
};

const ConcertSection = () => {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        background: "#000000",
        padding: "6rem 2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Very faint ambient light behind the cards to make the glass effect visible */}
      <div 
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "60vw",
          height: "60vh",
          background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0
        }}
      />

      <div style={{ width: "100%", maxWidth: "1200px", position: "relative", zIndex: 1 }}>
        <h2 style={{ 
          color: "#fff", 
          fontSize: "2.5rem", 
          fontWeight: 700, 
          marginBottom: "3rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
          paddingLeft: "8px",
          letterSpacing: "-0.02em"
        }}>
          Live Experiences
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "24px",
            width: "100%",
          }}
        >
          {concertEvents.map((event) => (
            <ConcertCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ConcertSection;