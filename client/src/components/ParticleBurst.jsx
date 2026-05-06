import { useEffect, useMemo } from "react";

const colors = ["#ffffff", "#fed7aa", "#fb923c", "#c4b5fd", "#fef08a"];

export default function ParticleBurst({ active, onDone }) {
  const particles = useMemo(() => {
    return Array.from({ length: 82 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 82;
      const distance = 118 + (index % 9) * 19;
      const size = 5 + (index % 7);
      const originX = 22 + ((index * 17) % 57);
      const originY = 20 + ((index * 23) % 50);

      return {
        color: colors[index % colors.length],
        delay: `${(index % 9) * 14}ms`,
        id: index,
        originX: `${originX}%`,
        originY: `${originY}%`,
        size: `${size}px`,
        x: `${Math.cos(angle) * distance}px`,
        y: `${Math.sin(angle) * distance}px`
      };
    });
  }, []);

  useEffect(() => {
    if (!active) return undefined;

    const timeoutId = window.setTimeout(() => {
      onDone?.();
    }, 1250);

    return () => window.clearTimeout(timeoutId);
  }, [active, onDone]);

  if (!active) {
    return null;
  }

  return (
    <div aria-hidden="true" className="particle-burst">
      {particles.map((particle) => (
        <span
          className="particle-burst__dot"
          key={particle.id}
          style={{
            "--particle-color": particle.color,
            "--particle-delay": particle.delay,
            "--particle-origin-x": particle.originX,
            "--particle-origin-y": particle.originY,
            "--particle-size": particle.size,
            "--particle-x": particle.x,
            "--particle-y": particle.y
          }}
        />
      ))}
    </div>
  );
}
