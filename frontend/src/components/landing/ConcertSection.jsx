import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import './ConcertSection.css';

import img1 from "../../assets/concerts/1.jpg";
import img2 from "../../assets/concerts/2.jpg";
import img3 from "../../assets/concerts/3.jpg";
import img4 from "../../assets/concerts/4.jpg";
import img5 from "../../assets/concerts/c5.jpg";

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
  },
  {
    id: 5,
    src: img5,
    title: "Crimson Stage Sessions",
    subtitle: "Raw energy. Unfiltered nights.",
    expanded: "EventFlow curated an intimate stage takeover where the crowd and performers dissolved into one — no barriers, no scripts, just pure electric connection."
  }
];

// How many cards visible at once
const VISIBLE = 4;

const ConcertCard = ({ event, isActive }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{
        y: -6,
        boxShadow: "0 20px 50px 0 rgba(0,0,0,0.7)"
      }}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        borderLeft: "1px solid rgba(255,255,255,0.12)",
        borderBottom: "1px solid rgba(255,255,255,0.02)",
        borderRight: "1px solid rgba(255,255,255,0.02)",
        boxShadow: "0 8px 32px 0 rgba(0,0,0,0.4)",
        borderRadius: "16px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        cursor: "pointer",
        minWidth: 0,
        flex: "0 0 auto",
      }}
    >
      {/* Image / Description area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
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
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
              <p style={{
                color: "#e5e5e5",
                fontSize: "1rem",
                lineHeight: "1.6",
                margin: 0,
                fontFamily: "'Playfair Display', 'Georgia', serif",
                fontWeight: 300,
                letterSpacing: "0.02em"
              }}>
                {event.expanded}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play / Close button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
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
            padding: 0,
            borderRadius: "50%",
            background: isExpanded ? "#ffffff" : "#1ed760",
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
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style={{ marginLeft: "3px" }}>
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Title + subtitle */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "0 4px" }}>
        <h3 style={{
          margin: 0,
          color: "#ffffff",
          fontSize: "1.05rem",
          fontWeight: 600,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontFamily: "'Playfair Display', Georgia, serif",
          letterSpacing: "0.01em"
        }}>
          {event.title}
        </h3>
        <p style={{
          margin: 0,
          color: "#a7a7a7",
          fontSize: "0.825rem",
          fontWeight: 400,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: "italic"
        }}>
          {event.subtitle}
        </p>
      </div>
    </motion.div>
  );
};

// Nav button
const NavButton = ({ direction, onClick }) => (
  <motion.button
    className="concert-nav-btn"
    onClick={onClick}
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.96 }}
  >
    {direction === "prev" ? <span>|◁</span> : <span>▷|</span>}
  </motion.button>
);

const ConcertSection = () => {
  const total = concertEvents.length;
  // offset = index of leftmost visible card
  const [offset, setOffset] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  const goNext = () => {
    setDirection(1);
    setOffset((prev) => (prev + 1) % total);
  };

  const goPrev = () => {
    setDirection(-1);
    setOffset((prev) => (prev - 1 + total) % total);
  };

  // Build the visible window of cards (wraps infinitely)
  const visibleCards = Array.from({ length: VISIBLE }, (_, i) =>
    concertEvents[(offset + i) % total]
  );

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
      {/* Ambient glow */}
      <div style={{
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
      }} />

      <div style={{ width: "100%", maxWidth: "1200px", position: "relative", zIndex: 1 }}>

        {/* Header row: title + nav buttons */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2.5rem",
          paddingLeft: "4px",
        }}>
          <h2 style={{
            color: "#fff",
            fontSize: "2.5rem",
            fontWeight: 700,
            margin: 0,
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: "-0.01em"
          }}>
            Live Experiences
          </h2>

          {/* Prev / Next + dot indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Dot indicators */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {concertEvents.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === offset ? 20 : 6,
                    background: i === offset ? "#1ed760" : "rgba(255,255,255,0.25)"
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: "6px",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setDirection(i > offset ? 1 : -1);
                    setOffset(i);
                  }}
                />
              ))}
            </div>
            <NavButton direction="prev" onClick={goPrev} />
            <NavButton direction="next" onClick={goNext} />
          </div>
        </div>

        {/* Carousel viewport */}
        <div style={{ overflow: "hidden", width: "100%" }}>
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={offset}
              custom={direction}
              variants={{
                enter: (dir) => ({
                  x: dir > 0 ? "25%" : "-25%",
                  opacity: 0,
                }),
                center: {
                  x: 0,
                  opacity: 1,
                },
                exit: (dir) => ({
                  x: dir > 0 ? "-25%" : "25%",
                  opacity: 0,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 280, damping: 32 },
                opacity: { duration: 0.25 }
              }}
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${VISIBLE}, 1fr)`,
                gap: "24px",
                width: "100%",
              }}
            >
              {visibleCards.map((event, i) => (
                <ConcertCard key={`${event.id}-${offset}-${i}`} event={event} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Track label */}
        <div style={{
          marginTop: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          opacity: 0.45,
          paddingLeft: "4px",
        }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
          <span style={{
            color: "#fff",
            fontSize: "0.75rem",
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: "0.12em",
            textTransform: "uppercase"
          }}>
            {offset + 1} of {total} &nbsp;·&nbsp; Scroll to explore
          </span>
        </div>
      </div>
    </section>
  );
};

export default ConcertSection;