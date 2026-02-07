import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

// Assuming these imports remain the same
import img1 from "../../assets/concerts/1.jpg";
import img2 from "../../assets/concerts/2.jpg";
import img3 from "../../assets/concerts/3.jpg";
import img4 from "../../assets/concerts/4.jpg";

const initialCards = [
  { id: 1, src: img1, title: "Future Echoes" },
  { id: 2, src: img2, title: "Silent Horizon" },
  { id: 3, src: img3, title: "Neon Void" },
  { id: 4, src: img4, title: "Live Energy" }
];

const ConcertSection = () => {
  const ref = useRef(null);
  // Trigger when 40% of the section is visible
  const isInView = useInView(ref, { amount: 0.4, once: false });
  const [cards, setCards] = useState(initialCards);
  const [animating, setAnimating] = useState(false);

  const cycleCards = () => {
    if (animating) return;
    setAnimating(true);

    setCards((prev) => {
      const copy = [...prev];
      const last = copy.pop();
      copy.unshift(last);
      return copy;
    });

    setTimeout(() => setAnimating(false), 800);
  };

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        height: "100vh", // Full screen height to give space for scrolling
        width: "100%",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        background: "#050505"
      }}
      onClick={cycleCards}
    >
      {/* The internal container only animates/shows when in view. 
         Using layoutId or simple conditional rendering handles the 'visible on scroll' requirement.
      */}
      <div
        style={{
          position: "relative",
          width: "min(90vw, 500px)",
          height: "min(70vh, 600px)",
          perspective: "1000px", // Increased perspective for better 3D depth
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        {cards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? {
              opacity: 1,
              scale: 1,
              y: `${-10 + i * 8}%`, // Stacked offset
              z: i * 30,           // 3D depth offset
              rotateX: -10,        // Slight tilt for 3D effect
            } : { opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1]
            }}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "20px",
              overflow: "hidden",
              background: "#111",
              boxShadow: `0 20px 50px rgba(0,0,0,0.8)`,
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            <img
              src={card.src}
              alt={card.title}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: i === cards.length - 1 ? 1 : 0.6 // Brighten top card
              }}
            />

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: i === cards.length - 1 && isInView ? 1 : 0,
                y: i === cards.length - 1 ? 0 : 20 
              }}
              style={{
                position: "absolute",
                bottom: "10%",
                width: "100%",
                textAlign: "center",
                fontSize: "2rem",
                fontWeight: 600,
                color: "#fff",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)"
              }}
            >
              {card.title}
            </motion.h1>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ConcertSection;