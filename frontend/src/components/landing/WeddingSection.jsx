import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import img1 from "../../assets/weddings/1.jpg";
import img2 from "../../assets/weddings/2.jpg";
import img3 from "../../assets/weddings/3.jpg";
import img4 from "../../assets/weddings/4.jpg";

const images = [img1, img2, img3, img4];

const WeddingSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  // Timing configuration
  const imageRevealDuration = 1.4;
  const ribbonDrawDuration = 1.2;
  
  // Image reveal timings
  const imageTimings = [
    { start: 0.8, complete: 0.8 + imageRevealDuration },      // Top-Left
    { start: 3.4, complete: 3.4 + imageRevealDuration },      // Top-Right
    { start: 2.0, complete: 2.0 + imageRevealDuration },      // Bottom-Left
    { start: 4.6, complete: 4.6 + imageRevealDuration },      // Bottom-Right
  ];

  /* Segment Logic (Unchanged) */
  const ribbonFlows = [
    // 1. RICH GOLD (Front/Highlight Layer)
    {
      color: 'gold',
      zIndex: 3,
      segments: [
        { 
          d: "M-50,100 Q200,80 350,165 Q450,220 380,520", 
          drawStart: 0, drawEnd: ribbonDrawDuration,
          fadeStart: imageTimings[0].complete, fadeEnd: imageTimings[0].complete + 0.8 
        },
        { 
          d: "M380,520 Q320,650 600,450 T1050,170",
          drawStart: imageTimings[0].complete - 0.2, drawEnd: imageTimings[0].complete + ribbonDrawDuration,
          fadeStart: imageTimings[2].complete, fadeEnd: imageTimings[2].complete + 0.8
        },
        { 
          d: "M1050,170 Q1200,80 1200,300 T1050,570",
          drawStart: imageTimings[2].complete - 0.2, drawEnd: imageTimings[2].complete + ribbonDrawDuration,
          fadeStart: imageTimings[1].complete, fadeEnd: imageTimings[1].complete + 0.8
        },
        { 
          d: "M1050,570 Q950,750 1450,650",
          drawStart: imageTimings[1].complete - 0.2, drawEnd: imageTimings[1].complete + ribbonDrawDuration,
          fadeStart: imageTimings[3].complete + 1, fadeEnd: imageTimings[3].complete + 2
        },
      ]
    },
    // 2. DARK RED / BURGUNDY (Middle/Body Layer)
    {
      color: 'darkRed',
      zIndex: 2,
      segments: [
        { 
          d: "M-80,150 Q180,140 330,220 Q430,280 340,580",
          drawStart: 0.2, drawEnd: 0.2 + ribbonDrawDuration,
          fadeStart: imageTimings[0].complete + 0.2, fadeEnd: imageTimings[0].complete + 1.0
        },
        { 
          d: "M340,580 Q280,720 580,500 T1030,220",
          drawStart: imageTimings[0].complete, drawEnd: imageTimings[0].complete + ribbonDrawDuration,
          fadeStart: imageTimings[2].complete + 0.2, fadeEnd: imageTimings[2].complete + 1.0
        },
        { 
          d: "M1030,220 Q1180,120 1180,350 T1020,620",
          drawStart: imageTimings[2].complete, drawEnd: imageTimings[2].complete + ribbonDrawDuration,
          fadeStart: imageTimings[1].complete + 0.2, fadeEnd: imageTimings[1].complete + 1.0
        },
        { 
          d: "M1020,620 Q900,800 1430,700",
          drawStart: imageTimings[1].complete, drawEnd: imageTimings[1].complete + ribbonDrawDuration,
          fadeStart: imageTimings[3].complete + 1.2, fadeEnd: imageTimings[3].complete + 2.2
        },
      ]
    },
    // 3. CHOCOLATE BROWN (Back/Shadow Layer)
    {
      color: 'brown',
      zIndex: 1,
      segments: [
        { 
          d: "M-30,200 Q220,190 380,270 Q480,330 390,630",
          drawStart: 0.4, drawEnd: 0.4 + ribbonDrawDuration,
          fadeStart: imageTimings[0].complete + 0.4, fadeEnd: imageTimings[0].complete + 1.2
        },
        { 
          d: "M390,630 Q330,770 630,550 T1080,270",
          drawStart: imageTimings[0].complete + 0.2, drawEnd: imageTimings[0].complete + 0.2 + ribbonDrawDuration,
          fadeStart: imageTimings[2].complete + 0.4, fadeEnd: imageTimings[2].complete + 1.2
        },
        { 
          d: "M1080,270 Q1230,170 1230,400 T1070,670",
          drawStart: imageTimings[2].complete + 0.2, drawEnd: imageTimings[2].complete + 0.2 + ribbonDrawDuration,
          fadeStart: imageTimings[1].complete + 0.4, fadeEnd: imageTimings[1].complete + 1.2
        },
        { 
          d: "M1070,670 Q950,850 1480,750",
          drawStart: imageTimings[1].complete + 0.2, drawEnd: imageTimings[1].complete + 0.2 + ribbonDrawDuration,
          fadeStart: imageTimings[3].complete + 1.4, fadeEnd: imageTimings[3].complete + 2.4
        },
      ]
    }
  ];

  /* CHANGES HERE: Increased widths and changed blur references to larger values.
     Added blurs to the highlight layers to make them look like glowing filaments.
  */
  const liquidLayers = {
    gold: [
      // Wider, softer glow
      { stroke: "url(#goldFlow)", width: 90, opacity: 0.6, blur: 35 }, 
      // Brighter, wider core
      { stroke: "url(#goldCore)", width: 30, opacity: 1.0, blur: 10 },  
      // Hot glowing filament highlight (added blur here)
      { stroke: "#FFF8E7", width: 8, opacity: 0.9, blur: 4 },             
    ],
    darkRed: [
      // Wider, softer glow
      { stroke: "url(#redFlow)", width: 80, opacity: 0.7, blur: 30 },
      { stroke: "url(#redCore)", width: 25, opacity: 1.0, blur: 8 },
      // Added a subtle hot red highlight
      { stroke: "#FF4500", width: 4, opacity: 0.6, blur: 3 }, 
    ],
    brown: [
      { stroke: "url(#brownFlow)", width: 75, opacity: 0.6, blur: 30 },
      { stroke: "url(#brownCore)", width: 22, opacity: 1.0, blur: 8 },
    ],
  };

  return (
    <section
      ref={sectionRef}
      className="wedding-section"
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, #2d1810 0%, #1a0f0a 80%)', // Slightly brighter center
      }}
    >
      {/* Enhanced Background Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          // Brighter, warmer ambient glow
          background: 'radial-gradient(circle at center, rgba(218,165,32,0.2), transparent 60%)', 
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: '1200px', width: '100%', height: '100%', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            textAlign: 'center',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            marginBottom: '2vh',
            marginTop: '0',
            fontWeight: '300',
            letterSpacing: '0.15em',
            background: 'linear-gradient(135deg, #FFFACD, #e7c96f, #FFFACD)', // Brighter text gradient
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            // Stronger text shadow for glow
            textShadow: '0 0 40px rgba(255,215,150,0.5), 0 0 20px rgba(255,215,150,0.3)', 
            flexShrink: 0,
          }}
        >
          ETERNAL UNIONS
        </motion.h2>

        <div style={{ position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center' }}>

          {/* ================= LIQUID SVG LAYER ================= */}
          <svg
            style={{
              position: 'absolute',
              inset: '-15%', // Extend further to catch the wider blurs
              width: '130%',
              height: '130%',
              zIndex: 5,
              pointerEvents: 'none',
            }}
            viewBox="0 0 1400 800"
            preserveAspectRatio="none"
          >
            <defs>
              {/* CHANGES HERE: Significantly increased stdDeviation values for heavier glow */}
              <filter id="liquidBlur35"> <feGaussianBlur stdDeviation="35" /> </filter>
              <filter id="liquidBlur30"> <feGaussianBlur stdDeviation="30" /> </filter>
              <filter id="liquidBlur10"> <feGaussianBlur stdDeviation="10" /> </filter>
              <filter id="liquidBlur8"> <feGaussianBlur stdDeviation="8" /> </filter>
              <filter id="liquidBlur4"> <feGaussianBlur stdDeviation="4" /> </filter>
              <filter id="liquidBlur3"> <feGaussianBlur stdDeviation="3" /> </filter>

              {/* --- GOLD GRADIENTS (Made brighter) --- */}
              <linearGradient id="goldFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(181, 81, 9, 0)" />
                <stop offset="50%" stopColor="rgba(205,127,50,0.85)" /> {/* reddish gold */}
                <stop offset="100%" stopColor="rgba(160,90,40,0)" />
               </linearGradient>

              <linearGradient id="goldCore" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#E6B873" /> {/* warm reddish gold */}
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>


              {/* --- DARK RED GRADIENTS (Made brighter/hotter) --- */}
              <linearGradient id="redFlow" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stopColor="rgba(60,0,0,0)" />
  <stop offset="50%" stopColor="rgba(120,10,20,0.9)" /> {/* deep wine red */}
  <stop offset="100%" stopColor="rgba(238, 18, 18, 0)" />
</linearGradient>

              <linearGradient id="redCore" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stopColor="transparent" />
  <stop offset="50%" stopColor="#5C0A12" /> {/* very dark red */}
  <stop offset="100%" stopColor="transparent" />
</linearGradient>


              {/* --- BROWN GRADIENTS (Warmer) --- */}
              <linearGradient id="brownFlow" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stopColor="rgba(62, 1, 1, 0)" />
  <stop offset="50%" stopColor="rgba(180,180,185,0.75)" /> {/* grey silver */}
  <stop offset="100%" stopColor="rgba(120,120,120,0)" />
</linearGradient>

             <linearGradient id="brownCore" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stopColor="transparent" />
  <stop offset="50%" stopColor="#D1D1D6" /> {/* soft silver */}
  <stop offset="100%" stopColor="transparent" />
</linearGradient>

            </defs>

            {ribbonFlows.map((flow, i) => (
              <g key={i} style={{ zIndex: flow.zIndex, mixBlendMode: 'screen' }}> {/* Screen blend mode helps glow pop */}
                {flow.segments.map((seg, j) => (
                  <g key={j}>
                    {liquidLayers[flow.color].map((layer, k) => (
                      <motion.path
                        key={k}
                        d={seg.d}
                        fill="none"
                        stroke={layer.stroke}
                        strokeWidth={layer.width}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={isInView ? { 
                          pathLength: 1, 
                          opacity: [0, layer.opacity, layer.opacity, 0]
                        } : {}}
                        transition={{
                          pathLength: { 
                            delay: seg.drawStart, 
                            duration: seg.drawEnd - seg.drawStart, 
                            ease: "easeInOut"
                          },
                          opacity: {
                            times: [0, 0.1, 0.8, 1],
                            delay: seg.drawStart,
                            duration: seg.fadeEnd - seg.drawStart,
                            ease: "linear"
                          }
                        }}
                        filter={layer.blur ? `url(#liquidBlur${layer.blur})` : undefined}
                      />
                    ))}
                  </g>
                ))}
              </g>
            ))}
          </svg>

          {/* ================= IMAGE GRID ================= */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1.5rem',
              width: '100%',
              height: '100%', 
              maxHeight: '80vh',
            }}
          >
            {images.map((src, index) => {
              const timing = imageTimings[index];
              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ delay: timing.start, duration: imageRevealDuration, ease: "easeOut" }}
                  style={{
                    width: '100%',
                    height: '100%', 
                    maxHeight: '38vh',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    background: '#0a0604',
                    // Stronger golden backlight on the images themselves
                    boxShadow: '0 15px 60px rgba(218,165,32,0.3)', 
                    zIndex: 10,
                  }}
                >
                  <motion.img
                    src={src}
                    alt={`Wedding ${index + 1}`}
                    draggable={false}
                    initial={{ filter: 'brightness(0.3) grayscale(0.8)' }}
                    animate={{
                      filter: 'brightness(1) grayscale(0)',
                      boxShadow: [
                        'inset 0 0 0 rgba(255,215,0, 0)',
                        'inset 0 0 60px rgba(255,215,0, 0.6)', // Brighter flash
                        'inset 0 0 0 rgba(255,215,0, 0)',
                      ],
                    }}
                    transition={{
                      filter: { delay: timing.start, duration: imageRevealDuration },
                      boxShadow: { delay: timing.start, duration: 1.5, times: [0, 0.5, 1] }
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};

export default WeddingSection;