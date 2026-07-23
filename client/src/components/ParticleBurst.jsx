import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Party palette — white sparks plus gold/purple/pink confetti.
const colors = ["#ffffff", "#fde047", "#fbbf24", "#facc15", "#a855f7", "#d946ef", "#f472b6", "#c4b5fd"];

// Longest a piece can live (max delay + max duration below). The onDone timer
// waits this long so the graceful fall isn't cut off mid-air.
const maxLifetimeMs = 3300;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// Build one fresh, irregular batch of confetti. Each piece launches upward from
// a scattered point over the lower-middle of the screen, decelerates to its own
// apex, then falls back down under gravity — drifting sideways and spinning the
// whole way. Positions use viewport units so the burst fills the whole screen.
function makeConfetti(count = 120) {
  return Array.from({ length: count }, (_, id) => {
    const isRect = Math.random() > 0.4;
    const base = rand(7, 13);

    return {
      id,
      color: colors[Math.floor(rand(0, colors.length))],
      // Launch point: a wide band across the middle of the viewport.
      left: `${rand(10, 90)}%`,
      top: `${rand(44, 62)}%`,
      width: `${isRect ? base : base * 0.9}px`,
      height: `${isRect ? base * rand(0.4, 0.7) : base * 0.9}px`,
      radius: isRect ? "1px" : "999px",
      // A gentle rise that stays on-screen, then a long fall well below it.
      apex: `${-rand(14, 42)}vh`,
      fall: `${rand(52, 76)}vh`,
      drift: `${rand(-24, 24)}vw`,
      rotate: `${rand(0, 360)}deg`,
      spin: `${rand(360, 1000) * (Math.random() > 0.5 ? 1 : -1)}deg`,
      delay: `${rand(0, 200)}ms`,
      duration: `${rand(2100, 3000)}ms`
    };
  });
}

export default function ParticleBurst({ active, onDone }) {
  const [pieces, setPieces] = useState([]);

  // Keep the latest onDone in a ref so the burst effect depends only on
  // `active`. Otherwise a parent that re-renders (e.g. the reveal's per-second
  // countdown) passes a fresh onDone each render, re-running the effect and
  // regenerating the confetti mid-flight — making it visibly jump to new spots.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!active) return undefined;

    // Honor reduced-motion: skip the confetti entirely, just resolve.
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      setPieces(makeConfetti());
    }

    const timeoutId = window.setTimeout(() => onDoneRef.current?.(), reduce ? 200 : maxLifetimeMs);
    return () => window.clearTimeout(timeoutId);
  }, [active]);

  if (!active || pieces.length === 0 || typeof document === "undefined") {
    return null;
  }

  // Portal to <body> so the full-screen overlay escapes the reveal card's
  // overflow/backdrop-filter, letting confetti fly across the entire viewport.
  return createPortal(
    <div aria-hidden="true" className="particle-burst">
      {pieces.map((piece) => (
        <span
          className="particle-burst__piece"
          key={piece.id}
          style={{
            left: piece.left,
            top: piece.top,
            width: piece.width,
            height: piece.height,
            borderRadius: piece.radius,
            background: piece.color,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            "--c-apex": piece.apex,
            "--c-fall": piece.fall,
            "--c-drift": piece.drift,
            "--c-rot": piece.rotate,
            "--c-spin": piece.spin
          }}
        />
      ))}
    </div>,
    document.body
  );
}
