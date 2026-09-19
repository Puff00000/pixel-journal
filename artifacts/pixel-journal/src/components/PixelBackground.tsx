import { useMemo } from "react";

const STAR_COUNT = 40;
const PIXEL_STAR_SIZES = [2, 3, 4, 2, 3];

interface StarData {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

const STAR_COLORS = [
  "#f0c0ff", "#e080f0", "#c060d0", "#ffd6ff", "#b0a0ff",
  "#ff90e0", "#c8a0ff", "#ffb0e0", "#a0c0ff", "#f8d0ff",
];

export default function PixelBackground() {
  const stars = useMemo<StarData[]>(() =>
    Array.from({ length: STAR_COUNT }, (_, i) => ({
      x: (i * 37.3 + 11) % 100,
      y: (i * 29.7 + 23) % 100,
      size: PIXEL_STAR_SIZES[i % PIXEL_STAR_SIZES.length],
      color: STAR_COLORS[i % STAR_COLORS.length],
      delay: (i * 0.37) % 3,
      duration: 1.5 + (i * 0.41) % 2,
    })),
  []);

  const floatingPixels = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      x: (i * 53.1 + 7) % 95,
      y: (i * 41.7 + 15) % 90,
      size: 4 + (i % 4) * 2,
      color: STAR_COLORS[(i * 3) % STAR_COLORS.length],
      delay: (i * 0.6) % 4,
    })),
  []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {/* Gradient background */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #1a0830 0%, #2a0848 30%, #1e0838 60%, #150628 100%)",
      }} />

      {/* Grid lines */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(180,80,220,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(180,80,220,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "32px 32px",
      }} />

      {/* Stars */}
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: s.color,
            imageRendering: "pixelated",
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* Floating pixel squares */}
      {floatingPixels.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            opacity: 0.15,
            imageRendering: "pixelated",
            animation: `float-pixel ${3 + (i % 3)}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Corner decorations */}
      <div style={{
        position: "absolute", top: 16, left: 16,
        fontSize: "10px", color: "rgba(200,100,240,0.4)",
        fontFamily: "monospace", letterSpacing: "0.1em",
        lineHeight: "1.6",
      }}>
        {"✦ pixel journal ✦"}
      </div>
      <div style={{
        position: "absolute", bottom: 16, right: 16,
        fontSize: "8px", color: "rgba(200,100,240,0.3)",
        fontFamily: "monospace", letterSpacing: "0.15em",
      }}>
        {"v1.0.0 ♥"}
      </div>

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(10,0,20,0.6) 100%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}
