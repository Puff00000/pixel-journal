import { useState } from "react";

interface Props {
  dark: boolean;
  onClose: () => void;
}

function parseSpotifyUrl(raw: string): { type: string; id: string } | null {
  try {
    const url = new URL(raw.trim());
    if (!url.hostname.includes("spotify.com")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) return { type: parts[0], id: parts[1].split("?")[0] };
  } catch (_) {}
  const uri = raw.trim().match(/^spotify:(playlist|album|track|artist):([A-Za-z0-9]+)$/);
  if (uri) return { type: uri[1], id: uri[2] };
  return null;
}

// Tiny pixel-art character using box-shadow pixel technique
function PixelChar({ dark }: { dark: boolean }) {
  const skin  = dark ? "#9B7060" : "#C8926A";
  const hair  = dark ? "#2A2A3A" : "#4A2A1A";
  const body  = dark ? "#3A4A6A" : "#F0A0B8";
  const legs  = dark ? "#2A3050" : "#C870A0";
  const shoes = dark ? "#1A1A2A" : "#3A2010";

  // pixel grid 8×14 — each row is [col indices that are filled]
  const GRID: { row: number; col: number; color: string }[] = [
    // hair
    { row: 0, col: 2, color: hair }, { row: 0, col: 3, color: hair },
    { row: 0, col: 4, color: hair }, { row: 0, col: 5, color: hair },
    { row: 1, col: 1, color: hair }, { row: 1, col: 2, color: hair },
    { row: 1, col: 5, color: hair }, { row: 1, col: 6, color: hair },
    // face
    { row: 1, col: 3, color: skin }, { row: 1, col: 4, color: skin },
    { row: 2, col: 2, color: skin }, { row: 2, col: 3, color: skin },
    { row: 2, col: 4, color: skin }, { row: 2, col: 5, color: skin },
    { row: 3, col: 2, color: skin }, { row: 3, col: 3, color: skin },
    { row: 3, col: 4, color: skin }, { row: 3, col: 5, color: skin },
    // eyes (dark dots on upper face row)
    { row: 2, col: 2, color: "#1A0800" }, { row: 2, col: 5, color: "#1A0800" },
    // mouth (tiny smile)
    { row: 3, col: 3, color: dark ? "#A05060" : "#D06070" },
    { row: 3, col: 4, color: dark ? "#A05060" : "#D06070" },
    // body
    { row: 4, col: 2, color: body }, { row: 4, col: 3, color: body },
    { row: 4, col: 4, color: body }, { row: 4, col: 5, color: body },
    { row: 5, col: 1, color: body }, { row: 5, col: 2, color: body },
    { row: 5, col: 3, color: body }, { row: 5, col: 4, color: body },
    { row: 5, col: 5, color: body }, { row: 5, col: 6, color: body },
    { row: 6, col: 1, color: body }, { row: 6, col: 2, color: body },
    { row: 6, col: 3, color: body }, { row: 6, col: 4, color: body },
    { row: 6, col: 5, color: body }, { row: 6, col: 6, color: body },
    // legs
    { row: 7, col: 2, color: legs }, { row: 7, col: 3, color: legs },
    { row: 7, col: 4, color: legs }, { row: 7, col: 5, color: legs },
    { row: 8, col: 2, color: legs }, { row: 8, col: 5, color: legs },
    { row: 9, col: 2, color: legs }, { row: 9, col: 5, color: legs },
    // shoes
    { row: 10, col: 1, color: shoes }, { row: 10, col: 2, color: shoes },
    { row: 10, col: 5, color: shoes }, { row: 10, col: 6, color: shoes },
  ];

  const CELL = 5;
  const COLS = 8, ROWS = 11;

  return (
    <div style={{ position: "relative", width: COLS * CELL, height: ROWS * CELL, imageRendering: "pixelated" }}>
      {GRID.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          left: p.col * CELL, top: p.row * CELL,
          width: CELL, height: CELL,
          background: p.color,
        }} />
      ))}
    </div>
  );
}

export default function PixelTunesPanel({ dark, onClose }: Props) {
  const [spotifyInput, setSpotifyInput] = useState("");
  const [embedUrl, setEmbedUrl]         = useState<string | null>(null);
  const [error, setError]               = useState("");
  const [showInput, setShowInput]       = useState(false);

  const bg     = dark ? "#0F111A" : "#FFF0F5";
  const border = dark ? "#2A3A5A" : "#F0B0CC";
  const text   = dark ? "#C0D0FF" : "#C05080";
  const dim    = dark ? "#5A6A8A" : "#D090B0";
  const inputBg = dark ? "#1A2030" : "#FFF8FC";
  const btnBg   = dark ? "#1A3A2A" : "#FFF0F5";
  const btnBorder = dark ? "#2A8A5A" : "#E888B0";
  const btnText   = dark ? "#4AE880" : "#D05090";
  const dotColor  = dark ? "#2A8A5A" : "#E888B0";

  const handleLoad = () => {
    setError("");
    const parsed = parseSpotifyUrl(spotifyInput);
    if (!parsed) { setError("paste a valid spotify link"); return; }
    setEmbedUrl(`https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0`);
    setShowInput(false);
  };

  return (
    <div style={{
      position: "absolute",
      top: 52,
      right: 16,
      width: 270,
      zIndex: 50,
      background: bg,
      border: `2px solid ${border}`,
      boxShadow: dark
        ? "0 4px 32px rgba(0,0,40,0.7), inset 0 0 40px rgba(10,20,60,0.4)"
        : "0 4px 24px rgba(200,100,160,0.25), inset 0 0 40px rgba(255,220,240,0.3)",
      fontFamily: "'Courier New', monospace",
      animation: "bounce-in 0.25s ease-out",
    }}>
      {/* Title bar */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "8px 10px",
        borderBottom: `1px solid ${border}`,
        background: dark ? "#131828" : "#FFE8F5",
      }}>
        <div style={{ fontSize: 8, letterSpacing: "0.18em", color: text, flex: 1, textTransform: "uppercase" }}>
          <span style={{ color: dotColor }}>■</span> PIXEL TUNES
        </div>
        <div style={{ fontSize: 7, color: dim, letterSpacing: "0.2em", marginRight: 10 }}>
          {"········"}
        </div>
        <button onClick={onClose} style={{
          background: "none", border: `1px solid ${border}`,
          color: dim, cursor: "pointer", fontSize: 10,
          width: 20, height: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>
      </div>

      {/* Character + status */}
      {!embedUrl && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 12px 10px",
          borderBottom: `1px solid ${border}`,
        }}>
          <div style={{
            background: dark ? "#1A2540" : "#FFE0EE",
            border: `1px solid ${border}`,
            padding: "8px 10px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PixelChar dark={dark} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, background: dim }} />
              <div style={{ fontSize: 7, color: dim, letterSpacing: "0.12em" }}>IDLE</div>
            </div>
            <div style={{ fontSize: 8, color: text, letterSpacing: "0.08em" }}>
              pick a track
            </div>
          </div>
        </div>
      )}

      {/* Spotify embed */}
      {embedUrl && (
        <div style={{ padding: "10px 10px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, background: "#1DB954", animation: "sun-pulse 1s ease-in-out infinite" }} />
            <div style={{ fontSize: 7, color: "#1DB954", letterSpacing: "0.12em" }}>PLAYING</div>
            <button onClick={() => setEmbedUrl(null)} style={{
              marginLeft: "auto", background: "none", border: "none",
              color: dim, cursor: "pointer", fontSize: 8,
            }}>✕ clear</button>
          </div>
          <iframe
            src={embedUrl}
            width="100%"
            height="180"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ display: "block", border: `1px solid ${border}` }}
          />
        </div>
      )}

      {/* Paste link section */}
      <div style={{ padding: "10px 10px 12px" }}>
        {!showInput && !embedUrl && (
          <button
            onClick={() => setShowInput(true)}
            style={{
              width: "100%",
              background: btnBg,
              border: `2px solid ${btnBorder}`,
              color: btnText,
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              padding: "8px 0",
              cursor: "pointer",
              letterSpacing: "0.12em",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <span style={{ fontSize: 10 }}>+</span> paste link
          </button>
        )}

        {(showInput || embedUrl) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {!embedUrl && (
              <div style={{ fontSize: 7, color: text, letterSpacing: "0.08em", opacity: 0.7 }}>
                paste spotify link below
              </div>
            )}
            <div style={{ display: "flex", gap: 4 }}>
              <input
                autoFocus
                type="text"
                value={spotifyInput}
                onChange={e => { setSpotifyInput(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLoad()}
                placeholder="open.spotify.com/..."
                style={{
                  flex: 1,
                  background: inputBg,
                  border: `1px solid ${error ? "#E04040" : border}`,
                  color: dark ? "#C0D0FF" : "#803060",
                  fontFamily: "monospace",
                  fontSize: 7, padding: "5px 6px",
                  outline: "none",
                  letterSpacing: "0.04em",
                }}
              />
              <button
                onClick={handleLoad}
                style={{
                  background: "#1DB954", border: "none",
                  color: "#fff", fontFamily: "monospace",
                  fontSize: 8, padding: "5px 8px",
                  cursor: "pointer", letterSpacing: "0.06em",
                  flexShrink: 0,
                }}
              >▶</button>
            </div>
            {error && <div style={{ fontSize: 6, color: "#E04040", letterSpacing: "0.06em" }}>{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
