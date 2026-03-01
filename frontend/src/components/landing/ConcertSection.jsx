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

// Reusable Card Component
const ConcertCard = ({ event }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        cursor: "pointer",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        transition: "background-color 0.3s ease",
      }}
    >
      {/* Top Image / Description Area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          background: "#121212"
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
                background: "linear-gradient(135deg, rgba(30,30,30,1) 0%, rgba(10,10,10,1) 100%)",
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
          onClick={() => setIsExpanded(!isExpanded)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: isHovered || isExpanded ? 1 : 0, 
            y: isHovered || isExpanded ? 0 : 10 
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: isExpanded ? "#ffffff" : "#1ed760", // Spotify Green
            color: isExpanded ? "#000000" : "#000000",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 8px 8px rgba(0,0,0,0.3)",
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
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <h3
          style={{
            margin: 0,
            color: "#ffffff",
            fontSize: "1.1rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontFamily: "system-ui, -apple-system, sans-serif"
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
        minHeight: "100vh",
        width: "100%",
        background: "#000000", // Solid black context
        padding: "6rem 2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1200px" }}>
        
        {/* Optional Section Header (remove if not needed) */}
        <h2 style={{ 
          color: "#fff", 
          fontSize: "2rem", 
          fontWeight: 700, 
          marginBottom: "2rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
          paddingLeft: "8px"
        }}>
          Live Experiences
        </h2>

        {/* CSS Grid for the Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
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