import { useMemo } from "react";

interface Props {
  plantCount: number;
  onBack: () => void;
}

// Pre-seeded flower slot positions arranged front-to-back for natural layering
// Each slot: x (%), depth 0=front large → 3=far back tiny
const SLOTS = [
  // Depth 0 — front row, large (fills first)
  { x: 48, depth: 0 },
  { x: 22, depth: 0 },
  { x: 74, depth: 0 },
  { x: 10, depth: 0 },
  { x: 86, depth: 0 },
  // Depth 1 — second row
  { x: 36, depth: 1 },
  { x: 61, depth: 1 },
  { x: 16, depth: 1 },
  { x: 79, depth: 1 },
  { x: 50, depth: 1 },
  // Depth 2 — mid row
  { x: 28, depth: 2 },
  { x: 54, depth: 2 },
  { x: 72, depth: 2 },
  { x: 8,  depth: 2 },
  { x: 90, depth: 2 },
  { x: 42, depth: 2 },
  // Depth 3 — far back
  { x: 18, depth: 3 },
  { x: 38, depth: 3 },
  { x: 58, depth: 3 },
  { x: 76, depth: 3 },
  { x: 3,  depth: 3 },
  { x: 94, depth: 3 },
];

const DEPTH_CONFIG = [
  { scale: 1.0,  bottomPct: 2,  zIndex: 10 },  // depth 0 — large, front
  { scale: 0.62, bottomPct: 14, zIndex: 8  },  // depth 1
  { scale: 0.40, bottomPct: 24, zIndex: 6  },  // depth 2
  { scale: 0.24, bottomPct: 32, zIndex: 4  },  // depth 3 — tiny, back
];

// SVG Sunflower component
function Sunflower({ size = 120, sway = true }: { size?: number; sway?: boolean }) {
  const outerPetals = Array.from({ length: 8 }, (_, i) => i * 45);
  const innerPetals = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5);

  return (
    <svg
      viewBox="0 0 100 200"
      width={size}
      height={size * 2}
      style={{ animation: sway ? "sunflower-sway 3s ease-in-out infinite" : "none", display: "block" }}
    >
      {/* Stem */}
      <path
        d="M 50 95 Q 48 140 50 200"
        stroke="#2D7A1F" strokeWidth="7" fill="none" strokeLinecap="round"
      />
      {/* Leaves */}
      <ellipse cx="38" cy="135" rx="18" ry="7" fill="#3A8A28"
        transform="rotate(-40, 38, 135)" />
      <ellipse cx="62" cy="155" rx="16" ry="6" fill="#3A8A28"
        transform="rotate(40, 62, 155)" />

      {/* Outer petals */}
      {outerPetals.map((angle, i) => (
        <ellipse key={`o${i}`}
          cx="50" cy="24" rx="9.5" ry="22"
          fill="#D4820A"
          transform={`rotate(${angle}, 50, 52)`}
          opacity="0.92"
        />
      ))}
      {/* Inner petals (lighter, shorter) */}
      {innerPetals.map((angle, i) => (
        <ellipse key={`i${i}`}
          cx="50" cy="28" rx="7" ry="17"
          fill="#F5A918"
          transform={`rotate(${angle}, 50, 52)`}
          opacity="0.88"
        />
      ))}

      {/* Center outer ring */}
      <circle cx="50" cy="52" r="20" fill="#2A0E00" />
      {/* Center */}
      <circle cx="50" cy="52" r="17" fill="#5C2800" />
      {/* Center highlight dots */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r = 10;
        return (
          <circle key={i}
            cx={50 + Math.cos(angle) * r}
            cy={52 + Math.sin(angle) * r}
            r="1.8" fill="#3A1500"
          />
        );
      })}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <circle key={i}
            cx={50 + Math.cos(angle) * 5}
            cy={52 + Math.sin(angle) * 5}
            r="2.2" fill="#3A1500"
          />
        );
      })}
    </svg>
  );
}

// Sort slots so deeper = rendered first (behind)
const SORTED_SLOTS = [...SLOTS].sort((a, b) => b.depth - a.depth);

export default function GardenPage({ plantCount, onBack }: Props) {
  // Which slots are visible: show plantCount flowers, picked in order (depth 0 first for drama)
  const visibleIndices = useMemo(() => new Set(
    SLOTS.slice(0, Math.min(plantCount, SLOTS.length)).map((_, i) => i)
  ), [plantCount]);

  const newestIdx = plantCount > 0 ? Math.min(plantCount - 1, SLOTS.length - 1) : -1;

  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      {/* ── SKY: Sunset gradient ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          linear-gradient(180deg,
            #0F0200 0%,
            #4A0E00 8%,
            #8A2200 18%,
            #C84000 28%,
            #E85E00 38%,
            #F08400 48%,
            #F8A800 57%,
            #FFC230 65%,
            #FFD850 70%,
            #FFE870 73%
          )
        `,
      }} />

      {/* Cloud texture overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse 90% 25% at 25% 8%,  rgba(30,5,0,0.72) 0%, transparent 70%),
          radial-gradient(ellipse 70% 20% at 75% 4%,  rgba(40,8,0,0.60) 0%, transparent 65%),
          radial-gradient(ellipse 80% 22% at 50% 18%, rgba(25,4,0,0.50) 0%, transparent 75%),
          radial-gradient(ellipse 60% 15% at 10% 22%, rgba(35,6,0,0.45) 0%, transparent 70%),
          radial-gradient(ellipse 50% 12% at 85% 28%, rgba(20,3,0,0.40) 0%, transparent 65%),
          radial-gradient(ellipse 100% 18% at 50% 38%,rgba(10,2,0,0.25) 0%, transparent 80%)
        `,
        pointerEvents: "none",
      }} />

      {/* Sun glow at horizon */}
      <div style={{
        position: "absolute", bottom: "27%", left: "50%",
        transform: "translateX(-50%)",
        width: 200, height: 200,
        background: "radial-gradient(circle, rgba(255,240,100,0.95) 0%, rgba(255,180,20,0.6) 25%, rgba(255,120,0,0.3) 50%, transparent 75%)",
        borderRadius: "50%",
        filter: "blur(8px)",
        pointerEvents: "none",
      }} />

      {/* ── GREEN FIELD ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "30%",
        background: "linear-gradient(180deg, #2A6A14 0%, #1A5010 40%, #124010 100%)",
      }} />

      {/* Field top edge (lighter stripe for grass tips) */}
      <div style={{
        position: "absolute", left: 0, right: 0,
        bottom: "29%", height: 24,
        background: "linear-gradient(180deg, transparent 0%, #3A8A20 40%, #2A6A14 100%)",
        pointerEvents: "none",
      }} />

      {/* ── SUNFLOWER FIELD ── */}
      <div style={{
        position: "absolute", bottom: "27%", left: 0, right: 0,
        height: "52%",
        pointerEvents: "none",
      }}>
        {SORTED_SLOTS.map((slot, sortedIdx) => {
          const origIdx = SLOTS.indexOf(slot);
          if (!visibleIndices.has(origIdx)) return null;

          const cfg = DEPTH_CONFIG[slot.depth];
          const isNewest = origIdx === newestIdx;
          const sw = 120 * cfg.scale;

          return (
            <div
              key={origIdx}
              style={{
                position: "absolute",
                left: `${slot.x}%`,
                bottom: `${cfg.bottomPct}%`,
                transform: `translateX(-50%) scale(${cfg.scale})`,
                transformOrigin: "bottom center",
                zIndex: cfg.zIndex,
                animation: isNewest ? "sunflower-grow 0.9s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
              }}
            >
              <Sunflower size={sw / cfg.scale} sway={slot.depth <= 1} />
            </div>
          );
        })}
      </div>

      {/* Empty state message */}
      {plantCount === 0 && (
        <div style={{
          position: "absolute", bottom: "36%", left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center", zIndex: 20,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8, color: "rgba(255,220,80,0.85)",
          letterSpacing: "0.15em", lineHeight: 2.2,
          textShadow: "0 0 12px rgba(255,140,0,0.8)",
        }}>
          your garden awaits<br />
          <span style={{ fontSize: 6, opacity: 0.7 }}>plant your first sunflower</span>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px",
        background: "rgba(10,3,0,0.55)",
        backdropFilter: "blur(6px)",
        borderBottom: "1px solid rgba(255,160,20,0.2)",
      }}>
        <button onClick={onBack} style={{
          background: "rgba(255,140,0,0.15)",
          border: "1px solid rgba(255,160,20,0.5)",
          color: "rgba(255,210,80,0.9)",
          fontFamily: "monospace", fontSize: 8,
          padding: "5px 12px", cursor: "pointer", letterSpacing: "0.1em",
        }}>← back</button>

        <div style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: 8,
          color: "rgba(255,220,80,0.9)", letterSpacing: "0.18em",
          textShadow: "0 0 10px rgba(255,140,0,0.7)",
        }}>
          {plantCount === 0 ? "YOUR GARDEN" : `${plantCount} sunflower${plantCount !== 1 ? "s" : ""} planted`}
        </div>

        <div style={{ width: 80 }} />
      </div>
    </div>
  );
}
