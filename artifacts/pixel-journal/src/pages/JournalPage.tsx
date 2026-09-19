import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import WarmTypewriter from "@/components/WarmTypewriter";
import PixelTunesPanel from "@/components/PixelTunesPanel";

interface Props {
  onPlant: (text: string) => void;
  onBack?: () => void;
}

const DAY_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 5.7 + 3) % 96, y: (i * 7.3 + 8) % 88,
  size: 4 + (i % 4) * 2,
  color: ["#FFD6E8","#E8D6FF","#D6EEFF","#FFE8D6","#F0D6FF","#FFD6F0"][i % 6],
  delay: (i * 0.4) % 3, dur: 2 + (i * 0.3) % 2,
}));

const NIGHT_STARS = Array.from({ length: 50 }, (_, i) => ({
  x: (i * 4.1 + 1.5) % 99, y: (i * 6.7 + 2) % 85,
  size: 1 + (i % 3), delay: (i * 0.25) % 4, dur: 1.5 + (i * 0.2) % 2,
}));

function loadStampCount() {
  try { return parseInt(localStorage.getItem("pj_stampCount") ?? "0") || 0; } catch { return 0; }
}

type StampPhase = null | "stamping" | "flying" | "landing";

export default function JournalPage({ onPlant, onBack }: Props) {
  const [dark, setDark]           = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [stampKey, setStampKey]   = useState(0);
  const [stampPhase, setStampPhase] = useState<StampPhase>(null);
  const [stampCount, setStampCount] = useState(loadStampCount);
  const [folderBounce, setFolderBounce] = useState(false);
  const textRef = useRef("");
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleText = useCallback((t: string, count: number) => {
    textRef.current = t; setCharCount(count);
  }, []);

  const handleStamp = () => {
    setSaveModal(false);
    setStampPhase("stamping");
    phaseTimer.current = setTimeout(() => {
      setStampPhase("flying");
      phaseTimer.current = setTimeout(() => {
        setStampPhase("landing");
        setFolderBounce(true);
        const next = stampCount + 1;
        setStampCount(next);
        try { localStorage.setItem("pj_stampCount", String(next)); } catch { /* noop */ }
        phaseTimer.current = setTimeout(() => {
          setStampPhase(null);
          setFolderBounce(false);
          setStampKey(k => k + 1);
          setCharCount(0);
          textRef.current = "";
        }, 400);
      }, 650);
    }, 700);
  };

  const handlePlant = () => {
    setSaveModal(false);
    onPlant(textRef.current);
  };

  useEffect(() => () => { if (phaseTimer.current) clearTimeout(phaseTimer.current); }, []);

  const T = useMemo(() => dark ? {
    bg: "radial-gradient(ellipse at 30% 20%, #0D1B3E 0%, #060B1A 60%, #080F22 100%)",
    navBg: "rgba(8,12,28,0.92)", navBorder: "rgba(60,80,160,0.3)",
    title: "#7090FF", btnBg: "rgba(20,30,80,0.8)", btnBorder: "rgba(60,90,200,0.5)",
    btnText: "#8090E0", iconColor: "#6080C0", iconActive: "#A0C0FF",
    hint: "rgba(100,130,200,0.6)",
  } : {
    bg: "radial-gradient(ellipse at 60% 30%, #FFE8F5 0%, #F8F0FF 40%, #EEF4FF 100%)",
    navBg: "rgba(255,255,255,0.85)", navBorder: "rgba(220,170,200,0.4)",
    title: "#C05080", btnBg: "rgba(255,240,248,0.9)", btnBorder: "rgba(220,150,180,0.5)",
    btnText: "#B05070", iconColor: "#C080A0", iconActive: "#E040A0",
    hint: "rgba(180,120,160,0.6)",
  }, [dark]);

  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden",
      background: T.bg,
      display: "flex", flexDirection: "column",
      transition: "background 0.5s",
      fontFamily: "'Courier New', monospace",
    }}>

      {/* Background particles */}
      {dark
        ? NIGHT_STARS.map((s, i) => (
            <div key={i} style={{
              position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size, background: "#fff",
              opacity: 0.6, animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
              pointerEvents: "none",
            }} />
          ))
        : DAY_PARTICLES.map((p, i) => (
            <div key={i} style={{
              position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size, background: p.color,
              opacity: 0.7, borderRadius: 1,
              animation: `twinkle ${p.dur}s ease-in-out ${p.delay}s infinite`,
              pointerEvents: "none",
            }} />
          ))
      }

      {/* ── TOP NAVBAR ── */}
      <div style={{
        position: "relative", zIndex: 20,
        display: "flex", alignItems: "center",
        padding: "0 14px", height: 48,
        background: T.navBg, borderBottom: `1px solid ${T.navBorder}`,
        backdropFilter: "blur(12px)", flexShrink: 0,
      }}>
        {/* Back */}
        <button onClick={onBack} style={{
          background: T.btnBg, border: `1px solid ${T.btnBorder}`,
          color: T.btnText, fontFamily: "monospace",
          fontSize: 8, padding: "5px 10px", cursor: "pointer", letterSpacing: "0.1em",
        }}>← back</button>

        {/* Title */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 10,
            color: T.title, letterSpacing: "0.2em",
            textShadow: dark ? "0 0 12px rgba(100,140,255,0.6)" : "0 0 8px rgba(200,80,140,0.3)",
          }}>PIXEL JOURNAL</span>
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          {/* FOLDER BUTTON */}
          <button
            onClick={() => charCount > 0 && setSaveModal(true)}
            title={`Save entries (${stampCount} stamped)`}
            style={{
              position: "relative",
              background: folderBounce
                ? (dark ? "rgba(60,40,10,0.95)" : "rgba(255,230,180,0.98)")
                : (charCount > 0 ? (dark ? "rgba(40,30,8,0.9)" : "rgba(255,245,220,0.95)") : T.btnBg),
              border: `1px solid ${dark ? "#7A6020" : "#D4A030"}`,
              cursor: charCount > 0 ? "pointer" : "default",
              opacity: charCount > 0 ? 1 : 0.5,
              padding: 0,
              width: 38, height: 30,
              animation: folderBounce ? "folder-bounce 0.35s ease-out" : "none",
              transition: "background 0.2s",
            }}
          >
            {/* Folder tab */}
            <div style={{
              position: "absolute", top: -6, left: 3,
              width: 14, height: 6,
              background: dark ? "#5A4015" : "#E8C060",
              border: `1px solid ${dark ? "#7A6020" : "#D4A030"}`,
              borderBottom: "none",
              borderRadius: "2px 2px 0 0",
            }} />
            {/* Envelope count */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: "100%", gap: 3,
            }}>
              <span style={{ fontSize: 11 }}>💌</span>
              {stampCount > 0 && (
                <span style={{
                  fontSize: 7, fontFamily: "monospace",
                  color: dark ? "#D4A030" : "#8A6010",
                  letterSpacing: "0.05em",
                }}>{stampCount}</span>
              )}
            </div>
          </button>

          {/* Day/Night toggle */}
          <button onClick={() => setDark(d => !d)} title={dark ? "Day mode" : "Night mode"} style={{
            position: "relative", width: 44, height: 24,
            background: dark ? "#2A3A6A" : "#E0E8FF",
            border: `1px solid ${dark ? "#3A50A0" : "#C0CCF0"}`,
            borderRadius: 12, cursor: "pointer", padding: 0, transition: "background 0.3s",
          }}>
            <div style={{
              position: "absolute", top: 3, left: dark ? 22 : 3,
              width: 16, height: 16,
              borderRadius: dark ? "50%" : 0,
              background: dark ? "#6080E0" : "transparent",
              boxShadow: dark ? "0 0 6px rgba(80,120,255,0.8)" : "none",
              transition: "left 0.25s ease, background 0.25s",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {dark ? (
                <span style={{ fontSize: 9, lineHeight: 1 }}>🌙</span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" style={{ overflow: "visible" }}>
                  {/* rays */}
                  {[0,45,90,135,180,225,270,315].map(deg => {
                    const r = Math.PI * deg / 180;
                    const x1 = 8 + Math.cos(r) * 5.2;
                    const y1 = 8 + Math.sin(r) * 5.2;
                    const x2 = 8 + Math.cos(r) * 7.6;
                    const y2 = 8 + Math.sin(r) * 7.6;
                    return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />;
                  })}
                  {/* body */}
                  <circle cx="8" cy="8" r="4" fill="#FBBF24" />
                  <circle cx="8" cy="8" r="2.8" fill="#FDE68A" />
                </svg>
              )}
            </div>
          </button>

          {/* Bookmark */}
          <button title="Entries" style={{
            background: T.btnBg, border: `1px solid ${T.btnBorder}`,
            color: T.iconColor, width: 32, height: 32, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>🔖</button>

          {/* Headphone */}
          <button onClick={() => setMusicOpen(o => !o)} title="Music" style={{
            background: musicOpen ? (dark ? "rgba(40,60,160,0.8)" : "rgba(255,200,230,0.9)") : T.btnBg,
            border: `1px solid ${musicOpen ? (dark ? "#5070D0" : "#E888B0") : T.btnBorder}`,
            color: musicOpen ? T.iconActive : T.iconColor,
            width: 32, height: 32, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, transition: "all 0.15s",
          }}>🎧</button>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{
        position: "relative", zIndex: 10,
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-start",
        paddingTop: 12, overflow: "hidden",
      }}>
        <div style={{
          fontFamily: "monospace", fontSize: 9, color: T.hint,
          letterSpacing: "0.14em", marginBottom: 10, transition: "opacity 0.3s",
          opacity: charCount > 0 ? 0 : 1,
        }}>start typing...</div>

        <div style={{ transform: "scale(0.88)", transformOrigin: "top center", flexShrink: 0 }}>
          <WarmTypewriter key={stampKey} onTextChange={handleText} />
        </div>
      </div>

      {/* ── PIXEL TUNES PANEL ── */}
      {musicOpen && <PixelTunesPanel dark={dark} onClose={() => setMusicOpen(false)} />}

      {/* ── SAVE MODAL ── */}
      {saveModal && (
        <div onClick={() => setSaveModal(false)} style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: dark ? "#0D1530" : "#FFF8FC",
            border: `2px solid ${dark ? "#2A4A80" : "#F0A0C8"}`,
            padding: "28px 32px", textAlign: "center",
            boxShadow: dark ? "0 0 40px rgba(40,80,200,0.4)" : "0 4px 32px rgba(200,80,140,0.25)",
            animation: "bounce-in 0.28s ease-out", minWidth: 320,
          }}>
            <div style={{
              fontSize: 9, letterSpacing: "0.15em",
              color: dark ? "#7090FF" : "#C05080", marginBottom: 6,
            }}>what do you want to do?</div>
            <div style={{
              fontSize: 7, color: dark ? "#4A5A80" : "#C0A0B0",
              letterSpacing: "0.08em", marginBottom: 22,
            }}>with your entry</div>

            <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
              {/* Stamp It */}
              <button onClick={handleStamp} style={{
                background: dark ? "rgba(160,40,80,0.15)" : "#FFF0F5",
                border: `2px solid ${dark ? "#A03050" : "#E888B0"}`,
                color: dark ? "#FF8090" : "#C04070",
                fontFamily: "monospace", fontSize: 8,
                padding: "14px 18px", cursor: "pointer", letterSpacing: "0.1em",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                transition: "transform 0.1s",
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <span style={{ fontSize: 28 }}>💌</span>
                <span>STAMP IT</span>
                <span style={{ fontSize: 7, opacity: 0.7 }}>keep & seal the entry</span>
              </button>

              {/* Plant It */}
              <button onClick={handlePlant} style={{
                background: dark ? "rgba(180,140,0,0.15)" : "#FFFBEA",
                border: `2px solid ${dark ? "#C09020" : "#D4A000"}`,
                color: dark ? "#F0D060" : "#7B5000",
                fontFamily: "monospace", fontSize: 8,
                padding: "14px 18px", cursor: "pointer", letterSpacing: "0.1em",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                transition: "transform 0.1s",
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <span style={{ fontSize: 28 }}>🌻</span>
                <span>PLANT IT</span>
                <span style={{ fontSize: 7, opacity: 0.7 }}>grow in the garden</span>
              </button>
            </div>

            <button onClick={() => setSaveModal(false)} style={{
              background: "none", border: "none",
              color: dark ? "#4A5A80" : "#C0A0B0",
              fontFamily: "monospace", fontSize: 7,
              cursor: "pointer", marginTop: 16, letterSpacing: "0.1em",
            }}>✕ cancel</button>
          </div>
        </div>
      )}

      {/* ── STAMP ANIMATION OVERLAY ── */}
      {stampPhase === "stamping" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 90,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div style={{
            fontSize: 80,
            animation: "heart-stamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            filter: "drop-shadow(0 0 20px rgba(255,50,100,0.6))",
          }}>❤️</div>
        </div>
      )}

      {/* Flying envelope */}
      {stampPhase === "flying" && (
        <div style={{
          position: "fixed",
          left: "50%", top: "50%",
          fontSize: 36, zIndex: 91,
          animation: "envelope-fly 0.65s cubic-bezier(0.4,0,0.6,1) forwards",
          pointerEvents: "none",
        }}>💌</div>
      )}
    </div>
  );
}
