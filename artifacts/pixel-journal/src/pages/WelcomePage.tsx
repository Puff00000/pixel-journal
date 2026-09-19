import { useState } from "react";

interface Props { onBegin: () => void; }

const CLOUDS = [
  { x: 10, y: 8, w: 80, delay: 0 },
  { x: 40, y: 5, w: 60, delay: 2 },
  { x: 70, y: 12, w: 90, delay: 4 },
  { x: 25, y: 20, w: 50, delay: 1 },
];

export default function WelcomePage({ onBegin }: Props) {
  const [clicked, setClicked] = useState(false);

  const handle = () => { setClicked(true); setTimeout(onBegin, 400); };

  return (
    <div
      onClick={handle}
      style={{
        position: "fixed", inset: 0, cursor: "pointer",
        background: "linear-gradient(180deg, #87CEEB 0%, #B8E0F7 40%, #E8F4D9 70%, #C8E6A0 100%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        transition: "opacity 0.4s",
        opacity: clicked ? 0 : 1,
      }}
    >
      {/* Clouds */}
      {CLOUDS.map((c, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${c.x}%`, top: `${c.y}%`,
          animation: `cloud-drift ${8 + i * 2}s ease-in-out ${c.delay}s infinite alternate`,
        }}>
          <div style={{ position: "relative", width: c.w, height: 28 }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 18, background: "#fff", opacity: 0.85 }} />
            <div style={{ position: "absolute", bottom: 14, left: "20%", width: "40%", height: 16, background: "#fff", opacity: 0.85 }} />
            <div style={{ position: "absolute", bottom: 10, left: "50%", width: "35%", height: 20, background: "#fff", opacity: 0.85 }} />
          </div>
        </div>
      ))}

      {/* Bird (animated) */}
      <div style={{
        position: "absolute", top: "18%",
        animation: "bird-fly 12s linear infinite",
      }}>
        <div style={{ fontFamily: "monospace", fontSize: 14, color: "#555", letterSpacing: "-2px" }}>^  ^</div>
      </div>

      {/* Ground & grass */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 100,
        background: "#7CB850",
      }} />
      <div style={{
        position: "absolute", bottom: 96, left: 0, right: 0, height: 12,
        background: "#8FCC5E",
      }} />
      {/* Grass tufts */}
      {Array.from({ length: 30 }, (_, i) => (
        <div key={i} style={{
          position: "absolute",
          bottom: 96,
          left: `${(i * 3.5) % 100}%`,
          width: 6, height: 12 + (i % 5) * 3,
          background: "#5A9E2E",
          transformOrigin: "bottom center",
          animation: `sway ${2 + (i % 3) * 0.5}s ease-in-out ${(i * 0.2) % 2}s infinite`,
        }} />
      ))}

      {/* Pixel flowers in ground */}
      {[8, 22, 38, 55, 72, 88].map((x, i) => (
        <div key={i} style={{ position: "absolute", bottom: 100, left: `${x}%` }}>
          {/* stem */}
          <div style={{ width: 4, height: 20 + (i % 3) * 8, background: "#4A8C28", margin: "0 auto" }} />
          {/* head */}
          <div style={{
            width: 14, height: 14,
            background: i % 2 === 0 ? "#FFD700" : "#FF9EC4",
            marginLeft: -5,
            marginTop: -14,
            boxShadow: `inset 0 0 0 4px ${i % 2 === 0 ? "#E8A800" : "#FF6BA8"}`,
          }} />
        </div>
      ))}

      {/* Main card */}
      <div style={{
        background: "rgba(255,248,235,0.92)",
        border: "3px solid #D4A856",
        padding: "36px 48px",
        textAlign: "center",
        boxShadow: "4px 4px 0 0 rgba(180,140,60,0.4)",
        animation: "bounce-in 0.6s ease-out",
        maxWidth: 400,
        zIndex: 10,
      }}>
        <div style={{ fontSize: 36, marginBottom: 16, animation: "sun-pulse 2s ease-in-out infinite" }}>🌻</div>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 13, color: "#7B4F0F",
          letterSpacing: "0.15em", marginBottom: 12,
          textShadow: "2px 2px 0 rgba(180,120,0,0.3)",
        }}>
          PIXEL JOURNAL
        </div>
        <div style={{
          fontFamily: "monospace", fontSize: 11,
          color: "#9B6A20", lineHeight: 2,
          letterSpacing: "0.08em", marginBottom: 28,
        }}>
          write your heart out<br />
          then choose your mood<br />
          and watch the garden grow ✦
        </div>
        <div style={{
          fontFamily: "monospace", fontSize: 10,
          color: "#B8891C",
          border: "2px solid #D4A856",
          padding: "8px 20px",
          background: "#FFF3C4",
          animation: "sun-pulse 1.5s ease-in-out infinite",
          letterSpacing: "0.12em",
        }}>
          click anywhere to begin
        </div>
      </div>
    </div>
  );
}
