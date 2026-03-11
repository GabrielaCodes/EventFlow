import { useEffect, useRef, useState, useCallback } from "react";
import img1 from "../../assets/graduation/1.jpg";
import img2 from "../../assets/graduation/2.jpg";
import img3 from "../../assets/graduation/3.jpg";
import img4 from "../../assets/graduation/4.jpg";
import img5 from "../../assets/graduation/g5.jpg";
import img6 from "../../assets/graduation/g6.jpg";

/* ─────────────────────────────────────────
   PAGE DATA  (6 images = 3 spreads of 2)
───────────────────────────────────────── */
const PAGES = [
  {
    title: "The Final Chapter",
    subtitle: "The last bell before the world opens",
    image: img1,
    year: "2024",
    num: "I",
  },
  {
    title: "Caps in the Air",
    subtitle: "A moment suspended between past and future",
    image: img2,
    year: "2024",
    num: "II",
  },
  {
    title: "Bound by Memories",
    subtitle: "Friendships that outlive classrooms",
    image: img3,
    year: "2024",
    num: "III",
  },
  {
    title: "The Beginning of Everything",
    subtitle: "Not an ending — a launch",
    image: img4,
    year: "2024",
    num: "IV",
  },
  {
    title: "Honours & Beyond",
    subtitle: "A life shaped by years of dedication",
    image: img5,
    year: "2024",
    num: "V",
  },
  {
    title: "Into the Light",
    subtitle: "Every step forward was earned",
    image: img6,
    year: "2024",
    num: "VI",
  },
];

/* ─────────────────────────────────────────
   DUST PARTICLE SYSTEM
───────────────────────────────────────── */
const DustParticles = () => {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    duration: Math.random() * 14 + 10,
    delay: Math.random() * -20,
    drift: (Math.random() - 0.5) * 60,
    opacity: Math.random() * 0.35 + 0.05,
  }));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      <style>{`
        @keyframes dustFloat {
          0%   { transform: translateY(0px) translateX(0px); opacity: 0; }
          15%  { opacity: var(--op); }
          85%  { opacity: var(--op); }
          100% { transform: translateY(-100px) translateX(var(--drift)); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(231,201,111,0.9) 0%, rgba(231,201,111,0) 70%)`,
            "--op": p.opacity,
            "--drift": `${p.drift}px`,
            animation: `dustFloat ${p.duration}s ${p.delay}s infinite linear`,
          }}
        />
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────
   BOOK PAGE (single spread)
───────────────────────────────────────── */
const BookPage = ({ page, side, zIndex, style = {} }) => {
  const isLeft = side === "left";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        width: "50%",
        height: "100%",
        left: isLeft ? 0 : "50%",
        zIndex,
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Paper texture layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(
              ${isLeft ? "to right" : "to left"},
              rgba(0,0,0,0.18) 0%,
              rgba(0,0,0,0.04) 8%,
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #1a1610 0%,
              #151209 40%,
              #1c1812 100%
            )
          `,
        }}
      />

      {/* Gold page edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          [isLeft ? "left" : "right"]: 0,
          width: "3px",
          background: "linear-gradient(to bottom, #c9a84c, #e7c96f 30%, #f5e09a 50%, #e7c96f 70%, #c9a84c)",
          opacity: 0.7,
          zIndex: 2,
        }}
      />

      {/* Page content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          padding: "clamp(1.5rem, 3vw, 3rem)",
          gap: "1rem",
        }}
      >
        {/* Roman numeral + year header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(231,201,111,0.2)",
            paddingBottom: "0.6rem",
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontSize: "clamp(0.6rem, 1vw, 0.85rem)",
              color: "rgba(231,201,111,0.5)",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            EventFlow
          </span>
          <span
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontSize: "clamp(0.6rem, 1vw, 0.85rem)",
              color: "rgba(231,201,111,0.4)",
              letterSpacing: "0.2em",
            }}
          >
            {page.year} · {page.num}
          </span>
        </div>

        {/* Photo */}
        <div
          style={{
            flex: "0 0 auto",
            aspectRatio: "4/3",
            overflow: "hidden",
            position: "relative",
            borderRadius: "2px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(231,201,111,0.12)",
          }}
        >
          <img
            src={page.image}
            alt={page.title}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: "sepia(0.12) contrast(1.05) brightness(0.92)",
            }}
          />
          {/* Photo overlay vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)",
            }}
          />
        </div>

        {/* Text content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "0.4rem" }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontSize: "clamp(1rem, 1.8vw, 1.6rem)",
              fontWeight: 700,
              fontStyle: "italic",
              color: "#e7c96f",
              margin: 0,
              lineHeight: 1.2,
              textShadow: "0 0 30px rgba(231,201,111,0.3)",
            }}
          >
            {page.title}
          </h2>
          <p
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontSize: "clamp(0.65rem, 1vw, 0.9rem)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "rgba(231,201,111,0.55)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {page.subtitle}
          </p>
          {/* Decorative line */}
          <div
            style={{
              width: "2rem",
              height: "1px",
              background: "linear-gradient(to right, rgba(231,201,111,0.6), transparent)",
              marginTop: "0.4rem",
            }}
          />
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   FLIPPING PAGE (the animated leaf)
───────────────────────────────────────── */
const FlippingLeaf = ({ page, direction, onDone }) => {
  const isForward = direction === "forward";
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.style.transform = isForward
        ? "perspective(2000px) rotateY(-180deg)"
        : "perspective(2000px) rotateY(0deg)";
      el.style.opacity = "1";
    });
    const timer = setTimeout(onDone, 820);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, []);

  const startRotate = isForward
    ? "perspective(2000px) rotateY(0deg)"
    : "perspective(2000px) rotateY(-180deg)";

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: 0,
        left: "50%",
        width: "50%",
        height: "100%",
        transformOrigin: "left center",
        transform: startRotate,
        transition: "transform 0.78s cubic-bezier(0.645, 0.045, 0.355, 1.000)",
        transformStyle: "preserve-3d",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      {/* Front face */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backfaceVisibility: "hidden",
          background: "linear-gradient(to left, #1a1610, #151209)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 40%)",
            zIndex: 1,
          }}
        />
        <BookPage page={page} side="left" zIndex={0} />
      </div>

      {/* Back face */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: "linear-gradient(to right, #1a1610, #151209)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to left, rgba(0,0,0,0.45) 0%, transparent 40%)",
            zIndex: 1,
          }}
        />
        <BookPage page={page} side="right" zIndex={0} />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   CTA SPREAD (final page)
───────────────────────────────────────── */
const CTASpread = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "1.2rem",
      background: "linear-gradient(135deg, #0e0c09 0%, #151209 100%)",
      padding: "3rem",
    }}
  >
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "'Playfair Display', 'Georgia', serif",
          fontSize: "clamp(0.7rem, 1.2vw, 0.9rem)",
          color: "rgba(231,201,111,0.45)",
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          marginBottom: "1.2rem",
        }}
      >
        ✦ &nbsp; EventFlow &nbsp; ✦
      </div>
      <h2
        style={{
          fontFamily: "'Playfair Display', 'Georgia', serif",
          fontSize: "clamp(1.2rem, 2.5vw, 2.2rem)",
          fontWeight: 700,
          fontStyle: "italic",
          color: "#e7c96f",
          margin: "0 0 0.8rem",
          lineHeight: 1.25,
          textShadow: "0 0 40px rgba(231,201,111,0.25)",
        }}
      >
        Celebrate Milestones
        <br />
        with EventFlow
      </h2>
      <p
        style={{
          fontFamily: "'Playfair Display', 'Georgia', serif",
          fontStyle: "italic",
          color: "rgba(231,201,111,0.5)",
          fontSize: "clamp(0.7rem, 1.1vw, 0.95rem)",
          margin: "0 auto",
          maxWidth: "320px",
          lineHeight: 1.6,
        }}
      >
        Every achievement deserves to be remembered with the elegance it earned.
      </p>
      <div
        style={{
          marginTop: "2rem",
          display: "inline-block",
          border: "1px solid rgba(231,201,111,0.35)",
          padding: "0.6rem 2rem",
          fontFamily: "'Playfair Display', 'Georgia', serif",
          fontSize: "0.75rem",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(231,201,111,0.7)",
        }}
      >
        Begin Your Story
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   MAIN SECTION
───────────────────────────────────────── */
const GraduationSection = () => {
  // spread 0 = pages 0&1, spread 1 = pages 2&3, spread 2 = pages 4&5, spread 3 = CTA
  const [spread, setSpread] = useState(0);
  const [flipping, setFlipping] = useState(null);
  const [hoverSide, setHoverSide] = useState(null);
  const totalSpreads = 3; // 0,1,2 = photo spreads, 3 = CTA
  const isAnimating = useRef(false);
  const bookRef = useRef(null);
  const touchStartX = useRef(null);

  const canGoNext = spread < totalSpreads;
  const canGoPrev = spread > 0;

  const flipForward = useCallback(() => {
    if (isAnimating.current || !canGoNext) return;
    isAnimating.current = true;
    const pageIdx = spread * 2;
    setFlipping({ direction: "forward", pageIdx });
  }, [spread, canGoNext]);

  const flipBackward = useCallback(() => {
    if (isAnimating.current || !canGoPrev) return;
    isAnimating.current = true;
    const pageIdx = (spread - 1) * 2;
    setFlipping({ direction: "backward", pageIdx });
  }, [spread, canGoPrev]);

  const onFlipDone = useCallback(() => {
    setFlipping((f) => {
      if (!f) return null;
      setSpread((s) => (f.direction === "forward" ? s + 1 : s - 1));
      return null;
    });
    setTimeout(() => { isAnimating.current = false; }, 50);
  }, []);

  const handleClick = useCallback((e) => {
    const rect = bookRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    if (x > rect.width / 2) flipForward();
    else flipBackward();
  }, [flipForward, flipBackward]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) flipForward();
    else flipBackward();
  };

  const handleMouseMove = useCallback((e) => {
    const rect = bookRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    setHoverSide(x > rect.width / 2 ? "right" : "left");
  }, []);

  const leftPage = PAGES[spread * 2];
  const rightPage = PAGES[spread * 2 + 1];

  // dot indicators: 4 dots for spreads 0–3
  const dotCount = totalSpreads + 1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');

        .grad-book-wrap { perspective: 2400px; }

        @keyframes hintCorner {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }

        .corner-hint {
          animation: hintCorner 2.4s ease-in-out infinite;
        }

        @media (max-width: 640px) {
          .grad-book-inner {
            transform: scale(0.72) !important;
            transform-origin: center center !important;
          }
        }
      `}</style>

      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          background: "#000000",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
        }}
      >
        <DustParticles />

        {/* Section header */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            marginBottom: "clamp(1.5rem, 3vh, 3rem)",
          }}
        >
          <p
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontSize: "clamp(0.65rem, 1vw, 0.8rem)",
              letterSpacing: "0.55em",
              textTransform: "uppercase",
              color: "rgba(231,201,111,0.45)",
              margin: "0 0 0.6rem",
            }}
          >
            ✦ &nbsp; Graduation &nbsp; ✦
          </p>
          <h1
            style={{
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontSize: "clamp(1.8rem, 4vw, 3.2rem)",
              fontWeight: 700,
              fontStyle: "italic",
              margin: 0,
              background: "linear-gradient(135deg, #c9a84c, #e7c96f 40%, #f5e09a 60%, #e7c96f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.15,
            }}
          >
            Academic Excellence
          </h1>
          <div
            style={{
              width: "4rem",
              height: "1px",
              background: "linear-gradient(to right, transparent, rgba(231,201,111,0.5), transparent)",
              margin: "1rem auto 0",
            }}
          />
        </div>

        {/* ── THE BOOK ── */}
        <div
          className="grad-book-wrap"
          style={{ position: "relative", zIndex: 10, width: "min(900px, 92vw)" }}
        >
          {/* book shadow */}
          <div
            style={{
              position: "absolute",
              bottom: "-2.5rem",
              left: "50%",
              transform: "translateX(-50%)",
              width: "75%",
              height: "3rem",
              background: "radial-gradient(ellipse at center, rgba(231,201,111,0.08) 0%, transparent 70%)",
              filter: "blur(12px)",
              pointerEvents: "none",
            }}
          />

          <div
            ref={bookRef}
            className="grad-book-inner"
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverSide(null)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "2 / 1.3",
              cursor:
                hoverSide === "right" && canGoNext
                  ? "e-resize"
                  : hoverSide === "left" && canGoPrev
                  ? "w-resize"
                  : "default",
              userSelect: "none",
              boxShadow: `
                0 0 0 2px rgba(231,201,111,0.18),
                0 0 0 4px rgba(0,0,0,0.9),
                0 0 60px rgba(0,0,0,0.9),
                0 25px 60px rgba(0,0,0,0.8)
              `,
              borderRadius: "2px 6px 6px 2px",
              overflow: "hidden",
            }}
          >
            {/* ── SPINE ── */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "6px",
                height: "100%",
                background: "linear-gradient(to right, rgba(0,0,0,0.7), rgba(231,201,111,0.2) 50%, rgba(0,0,0,0.7))",
                zIndex: 50,
                pointerEvents: "none",
              }}
            />

            {/* ── CURRENT SPREAD ── */}
            {spread < totalSpreads ? (
              <>
                {leftPage && <BookPage page={leftPage} side="left" zIndex={1} />}
                {rightPage && <BookPage page={rightPage} side="right" zIndex={1} />}
              </>
            ) : (
              <CTASpread />
            )}

            {/* ── ANIMATING LEAF ── */}
            {flipping && (
              <FlippingLeaf
                page={PAGES[flipping.pageIdx] || PAGES[PAGES.length - 1]}
                direction={flipping.direction}
                onDone={onFlipDone}
              />
            )}

            {/* ── HOVER CORNER HINTS ── */}
            {canGoNext && hoverSide === "right" && !isAnimating.current && (
              <div
                className="corner-hint"
                style={{
                  position: "absolute",
                  bottom: "1rem",
                  right: "1rem",
                  zIndex: 60,
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  color: "rgba(231,201,111,0.5)",
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  fontSize: "0.7rem",
                  letterSpacing: "0.15em",
                }}
              >
                <span>Turn</span>
                <span style={{ fontSize: "0.85rem" }}>›</span>
              </div>
            )}
            {canGoPrev && hoverSide === "left" && !isAnimating.current && (
              <div
                className="corner-hint"
                style={{
                  position: "absolute",
                  bottom: "1rem",
                  left: "1rem",
                  zIndex: 60,
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  color: "rgba(231,201,111,0.5)",
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  fontSize: "0.7rem",
                  letterSpacing: "0.15em",
                }}
              >
                <span style={{ fontSize: "0.85rem" }}>‹</span>
                <span>Turn</span>
              </div>
            )}

            {/* vignette */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)",
                pointerEvents: "none",
                zIndex: 40,
              }}
            />
          </div>

          {/* ── PAGE INDICATOR DOTS ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.6rem",
              marginTop: "1.6rem",
            }}
          >
            {Array.from({ length: dotCount }, (_, i) => (
              <div
                key={i}
                style={{
                  width: i === spread ? "1.8rem" : "0.35rem",
                  height: "0.35rem",
                  borderRadius: "2px",
                  background:
                    i === spread
                      ? "linear-gradient(to right, #c9a84c, #e7c96f)"
                      : "rgba(231,201,111,0.2)",
                  transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            ))}
          </div>

          {/* instruction text */}
          <p
            style={{
              textAlign: "center",
              marginTop: "1rem",
              fontFamily: "'Playfair Display', 'Georgia', serif",
              fontStyle: "italic",
              fontSize: "clamp(0.6rem, 0.9vw, 0.75rem)",
              color: "rgba(231,201,111,0.25)",
              letterSpacing: "0.2em",
            }}
          >
            Click the edges to turn pages
          </p>
        </div>
      </section>
    </>
  );
};

export default GraduationSection;