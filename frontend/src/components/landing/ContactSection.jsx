import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FiArrowUpRight, FiMail, FiCopy } from "react-icons/fi"; // Ideally install react-icons

const ContactSection = () => {
  const containerRef = useRef(null);

  // 1. TRACK MOUSE POSITION
  // We use MotionValues to track the mouse state without re-rendering the component
  const mouseX = useMotionValue(0.5); // Start at center (0.5)
  const mouseY = useMotionValue(0.5);

  // 2. CREATE PHYSICS (THE "GSAP" FEEL)
  // The snippet used 'power4', which is heavy/smooth. We simulate that with a spring.
  const smoothX = useSpring(mouseX, { damping: 20, stiffness: 150, mass: 0.5 });
  const smoothY = useSpring(mouseY, { damping: 20, stiffness: 150, mass: 0.5 });

  // 3. MAP VALUES TO ANIMATIONS
  // This replicates the 'skewY' and 'scaleX' logic from your snippet
  const skewX = useTransform(smoothX, [0, 1], [15, -15]); // Skew based on horizontal move
  const rotateY = useTransform(smoothX, [0, 1], [15, -15]); // 3D Rotation
  const rotateX = useTransform(smoothY, [0, 1], [-10, 10]); // Vertical tilt
  const scale = useTransform(smoothX, [0, 0.5, 1], [0.95, 1, 0.95]); // Squash effect at edges

  // Parallax for the text behind (moving opposite to mouse)
  const backgroundTextX = useTransform(smoothX, [0, 1], ["10%", "-10%"]);

  const handleMouseMove = (e) => {
    const { width, height, left, top } = containerRef.current.getBoundingClientRect();
    // Calculate normalized position (0 to 1)
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText("eventflow@gmail.com");
    alert("Email copied to clipboard!");
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        height: "80vh",
        width: "100%",
        background: "#050505",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        perspective: "1200px", // Crucial for the 3D effect
        position: "relative",
        fontFamily: "'Montserrat', sans-serif"
      }}
    >
      {/* BACKGROUND KINETIC TEXT */}
      <motion.div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          x: backgroundTextX,
          y: "-50%",
          translateX: "-50%", // Center alignment fix
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
          zIndex: 0
        }}
      >
        <h1
          style={{
            fontSize: "15vw",
            fontWeight: 900,
            color: "#1a1a1a",
            whiteSpace: "nowrap",
            margin: 0,
            lineHeight: 0.8,
            letterSpacing: "-0.05em"
          }}
        >
          CONTACT US
        </h1>
      </motion.div>

      {/* THE "NICE BOX" */}
      <motion.div
        style={{
          rotateY,
          rotateX,
          skewX,
          scale,
          background: "rgba(20, 20, 20, 0.6)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "4rem",
          borderRadius: "4px", // Sharper corners for that brutalist look
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
          boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
          zIndex: 10,
          cursor: "default"
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2 style={{ 
            color: "#fff", 
            fontSize: "2rem", 
            fontWeight: 800, 
            margin: "0 0 10px 0",
            textTransform: "uppercase"
          }}>
            Let's Collaborate
          </h2>
          <p style={{ color: "#888", margin: 0 }}>
            Got a project in mind? We are ready.
          </p>
        </div>

        {/* EMAIL INTERACTION BOX */}
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            background: "#fff",
            padding: "10px 10px 10px 25px",
            borderRadius: "50px",
            transition: "transform 0.3s ease",
          }}
          className="email-box"
        >
          <a 
            href="mailto:eventflow@gmail.com" 
            style={{ 
              textDecoration: "none", 
              color: "#000", 
              fontWeight: 700,
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <FiMail />
            eventflow@gmail.com
          </a>
          
          <button
            onClick={copyEmail}
            style={{
              background: "#000",
              color: "#fff",
              border: "none",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <FiCopy size={16} />
          </button>
        </div>

        <motion.div 
          whileHover={{ scale: 1.1, rotate: 90 }}
          style={{
            color: "#fff",
            fontSize: "2rem",
            marginTop: "1rem"
          }}
        >
          <FiArrowUpRight />
        </motion.div>

      </motion.div>
    </section>
  );
};

export default ContactSection;