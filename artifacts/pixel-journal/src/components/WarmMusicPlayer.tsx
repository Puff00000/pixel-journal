import { useState, useRef, useCallback, useEffect } from "react";

// ─── Built-in synthesised tracks ────────────────────────────────
const TRACKS = [
  { id: "meadow",   name: "Meadow Walk",   emoji: "🌿", color: "#7CB850",
    notes: [261.63,293.66,329.63,349.23,392.0,440.0,349.23,329.63], bpm: 76 },
  { id: "sunshine", name: "Sunshine",      emoji: "☀️", color: "#FFD700",
    notes: [523.25,587.33,659.25,698.46,523.25,440.0,493.88,523.25], bpm: 84 },
  { id: "breeze",   name: "Gentle Breeze", emoji: "🌸", color: "#FFB0D0",
    notes: [329.63,369.99,415.30,440.0,493.88,440.0,415.30,369.99], bpm: 68 },
  { id: "cozy",     name: "Cozy Cottage",  emoji: "🏡", color: "#D4A856",
    notes: [196.0,220.0,246.94,261.63,293.66,261.63,246.94,220.0], bpm: 65 },
  { id: "garden",   name: "Garden Party",  emoji: "🌻", color: "#FF9940",
    notes: [349.23,392.0,440.0,523.25,587.33,523.25,440.0,392.0], bpm: 80 },
];

function synthMelody(ac: AudioContext, notes: number[], bpm: number): ScriptProcessorNode {
  const proc = ac.createScriptProcessor(4096, 0, 2);
  let phase = 0, notePhase = 0, noteIdx = 0;
  const noteDur = (60 / bpm) * ac.sampleRate;
  let curFreq = notes[0];
  proc.onaudioprocess = (e) => {
    const L = e.outputBuffer.getChannelData(0);
    const R = e.outputBuffer.getChannelData(1);
    for (let i = 0; i < 4096; i++) {
      if (notePhase >= noteDur) { notePhase = 0; noteIdx = (noteIdx + 1) % notes.length; }
      curFreq += (notes[noteIdx] - curFreq) * 0.002;
      const env =
        Math.min(notePhase / (noteDur * 0.12), 1) *
        Math.max(0, 1 - (notePhase - noteDur * 0.65) / (noteDur * 0.35));
      const s = Math.sin(phase) * env * 0.14 + Math.sin(phase * 2) * env * 0.035 +
                (Math.random() * 2 - 1) * 0.006;
      L[i] = R[i] = s;
      phase += (2 * Math.PI * curFreq) / ac.sampleRate;
      if (phase > 2 * Math.PI) phase -= 2 * Math.PI;
      notePhase++;
    }
  };
  return proc;
}

// ─── Spotify URL parser ─────────────────────────────────────────
function parseSpotifyUrl(raw: string): { type: string; id: string } | null {
  try {
    const url = new URL(raw.trim());
    if (!url.hostname.includes("spotify.com")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) return { type: parts[0], id: parts[1].split("?")[0] };
  } catch (_) {}
  // handle spotify:playlist:... URI format
  const uri = raw.trim().match(/^spotify:(playlist|album|track|artist):([A-Za-z0-9]+)$/);
  if (uri) return { type: uri[1], id: uri[2] };
  return null;
}

function toEmbedUrl(parsed: { type: string; id: string }) {
  return `https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0`;
}

// ─── Component ──────────────────────────────────────────────────
type Mode = "builtin" | "spotify";

export default function WarmMusicPlayer() {
  const [mode, setMode] = useState<Mode>("builtin");

  // Built-in state
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState("meadow");
  const [volume, setVolume]     = useState(0.5);
  const [expanded, setExpanded] = useState(false);
  const [bars, setBars]         = useState([3, 6, 4, 8, 5, 7, 3, 6]);

  // Spotify state
  const [spotifyInput, setSpotifyInput]   = useState("");
  const [spotifyEmbed, setSpotifyEmbed]   = useState<string | null>(null);
  const [spotifyError, setSpotifyError]   = useState("");
  const [spotifyHistory, setSpotifyHistory] = useState<{ label: string; url: string }[]>([]);

  const acRef   = useRef<AudioContext | null>(null);
  const procRef = useRef<ScriptProcessorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const rafRef  = useRef<number | null>(null);

  // ── Built-in playback ─────────────────────────────────────────
  const stop = useCallback(() => {
    procRef.current?.disconnect();
    procRef.current = null;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  const startBuiltin = useCallback((id: string) => {
    if (!acRef.current) {
      acRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ac = acRef.current;
    if (ac.state === "suspended") ac.resume();
    stop();
    const gain = ac.createGain();
    gain.gain.value = volume;
    gainRef.current = gain;
    gain.connect(ac.destination);
    const t = TRACKS.find(t => t.id === id)!;
    const proc = synthMelody(ac, t.notes, t.bpm);
    procRef.current = proc;
    proc.connect(gain);
    let tick = 0;
    const animate = () => {
      tick += 0.09;
      setBars(prev => prev.map((_, i) =>
        Math.max(2, Math.abs(Math.sin(tick + i * 0.7) * 9 + Math.sin(tick * 1.4 + i * 0.5) * 4))
      ));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [volume, stop]);

  const togglePlay = () => {
    if (playing) { stop(); setPlaying(false); }
    else { startBuiltin(current); setPlaying(true); }
  };

  const select = (id: string) => {
    setCurrent(id);
    if (playing) { stop(); setTimeout(() => startBuiltin(id), 40); }
  };

  useEffect(() => { if (gainRef.current) gainRef.current.gain.value = volume; }, [volume]);
  useEffect(() => () => stop(), [stop]);

  // Stop built-in when switching to Spotify
  useEffect(() => {
    if (mode === "spotify") { stop(); setPlaying(false); }
  }, [mode, stop]);

  // ── Spotify connect ───────────────────────────────────────────
  const handleSpotifyConnect = () => {
    setSpotifyError("");
    const parsed = parseSpotifyUrl(spotifyInput);
    if (!parsed) {
      setSpotifyError("Paste a Spotify playlist, album, or track URL");
      return;
    }
    const embed = toEmbedUrl(parsed);
    setSpotifyEmbed(embed);
    // Save to quick-access history (max 3)
    const label = spotifyInput.trim().split("/").filter(Boolean).slice(-2).join(" › ");
    setSpotifyHistory(prev => {
      const next = [{ label, url: embed }, ...prev.filter(h => h.url !== embed)].slice(0, 3);
      return next;
    });
    setSpotifyInput("");
  };

  const track = TRACKS.find(t => t.id === current)!;

  // ── Shared tab bar ────────────────────────────────────────────
  const tabStyle = (active: boolean, accent: string) => ({
    flex: 1, padding: "6px 0",
    background: active ? "#FFF3C4" : "transparent",
    border: "none",
    borderBottom: active ? `2px solid ${accent}` : "2px solid transparent",
    color: active ? "#7B4F0F" : "#B09060",
    fontFamily: "'Courier New', monospace",
    fontSize: 7, letterSpacing: "0.1em",
    cursor: "pointer",
    display: "flex", flexDirection: "column" as const,
    alignItems: "center", gap: 2,
  });

  return (
    <div style={{
      background: "rgba(255,248,225,0.97)",
      border: "2px solid #D4A856",
      padding: 12, width: 210,
      fontFamily: "'Courier New', monospace",
      color: "#7B4F0F",
      boxShadow: "3px 3px 0 0 rgba(180,140,60,0.35)",
    }}>
      {/* Header */}
      <div style={{ fontSize: 7, letterSpacing: "0.14em", color: "#9B6A20", textTransform: "uppercase", marginBottom: 8 }}>
        ♪ Music Player
      </div>

      {/* Tab switcher */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid #D4C080",
        marginBottom: 10,
      }}>
        <button onClick={() => setMode("builtin")} style={tabStyle(mode === "builtin", "#D4A856")}>
          <span>🎹</span>
          <span>Pixel Tunes</span>
        </button>
        <button onClick={() => setMode("spotify")} style={tabStyle(mode === "spotify", "#1DB954")}>
          <span>🎧</span>
          <span>Spotify</span>
        </button>
      </div>

      {/* ── BUILT-IN PANEL ─────────────────────────────────────── */}
      {mode === "builtin" && (
        <>
          {/* Current track display */}
          <div style={{
            background: "#FFF3C4", border: "1px solid #D4A856",
            padding: "8px", marginBottom: 10, textAlign: "center",
          }}>
            <div style={{ fontSize: 18, marginBottom: 3 }}>{track.emoji}</div>
            <div style={{ fontSize: 7, color: track.color, letterSpacing: "0.1em" }}>{track.name}</div>
          </div>

          {/* Equaliser bars */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 3, height: 22, marginBottom: 10 }}>
            {bars.map((h, i) => (
              <div key={i} style={{
                width: 5,
                height: playing ? `${h}px` : "3px",
                background: playing ? `hsl(${38 + i * 8}, 80%, ${45 + h * 3}%)` : "#D4C090",
                transition: "height 0.1s ease",
              }} />
            ))}
          </div>

          {/* Play / pause */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <button
              onClick={togglePlay}
              className="pixel-btn"
              style={{
                background: playing ? "#FFD700" : "#FFF3C4",
                border: `2px solid ${playing ? "#C4A000" : "#D4A856"}`,
                color: "#3A2800",
                fontSize: 14, width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {playing ? "⏸" : "▶"}
            </button>
          </div>

          {/* Volume slider */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: expanded ? 10 : 0 }}>
            <span style={{ fontSize: 8, color: "#C49040" }}>♪</span>
            <input
              type="range" min={0} max={1} step={0.01} value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              style={{
                flex: 1, height: 4, appearance: "none",
                background: `linear-gradient(to right,#D4A856 ${volume * 100}%,#E8D8A0 ${volume * 100}%)`,
                outline: "none", cursor: "pointer",
              }}
            />
            <span style={{ fontSize: 8, color: "#C49040" }}>♪♪</span>
          </div>

          {/* Track list toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: "none", border: "none", color: "#C49040",
              cursor: "pointer", fontSize: 10, display: "block",
              width: "100%", textAlign: "center", marginTop: 6, padding: "2px 0",
            }}
          >
            {expanded ? "▲ hide tracks" : "▼ browse tracks"}
          </button>

          {expanded && (
            <div style={{ borderTop: "1px solid #D4C080", paddingTop: 10, marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              {TRACKS.map(t => (
                <button
                  key={t.id}
                  onClick={() => select(t.id)}
                  style={{
                    background: current === t.id ? "#FFF3C4" : "transparent",
                    border: `1px solid ${current === t.id ? "#D4A856" : "#D4C080"}`,
                    color: current === t.id ? "#7B4F0F" : "#A07830",
                    fontSize: 7, padding: "4px 8px",
                    cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 6,
                    letterSpacing: "0.07em",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  <span>{t.emoji}</span>
                  <span>{t.name}</span>
                  {current === t.id && playing && (
                    <span style={{ marginLeft: "auto", color: t.color }}>♪</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── SPOTIFY PANEL ──────────────────────────────────────── */}
      {mode === "spotify" && (
        <>
          {/* Explanation */}
          <div style={{
            background: "#F0FFF0", border: "1px solid #B8D8A0",
            padding: "8px", marginBottom: 10, fontSize: 7,
            color: "#3A6A20", lineHeight: 1.8, letterSpacing: "0.06em",
          }}>
            <span style={{ color: "#1DB954", fontWeight: "bold" }}>●</span> Paste any Spotify<br />
            playlist, album, or track<br />
            URL to play it here ✦
          </div>

          {/* URL input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            <input
              type="text"
              value={spotifyInput}
              onChange={e => { setSpotifyInput(e.target.value); setSpotifyError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSpotifyConnect()}
              placeholder="https://open.spotify.com/..."
              style={{
                background: "#FFFBF0",
                border: `1px solid ${spotifyError ? "#E05040" : "#D4A856"}`,
                color: "#5A3A00",
                fontFamily: "monospace",
                fontSize: 7,
                padding: "6px 8px",
                outline: "none",
                letterSpacing: "0.04em",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            {spotifyError && (
              <div style={{ fontSize: 7, color: "#C04030", letterSpacing: "0.06em" }}>
                ⚠ {spotifyError}
              </div>
            )}
            <button
              onClick={handleSpotifyConnect}
              className="pixel-btn"
              style={{
                background: "#1DB954",
                border: "2px solid #17A349",
                color: "#fff",
                fontFamily: "monospace",
                fontSize: 7,
                padding: "6px 0",
                letterSpacing: "0.1em",
                width: "100%",
                textTransform: "uppercase",
              }}
            >
              ▶ Load Player
            </button>
          </div>

          {/* Quick-access history */}
          {spotifyHistory.length > 0 && !spotifyEmbed && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 6, color: "#A07830", letterSpacing: "0.1em", marginBottom: 4 }}>RECENT</div>
              {spotifyHistory.map((h, i) => (
                <button key={i} onClick={() => setSpotifyEmbed(h.url)} style={{
                  background: "transparent",
                  border: "1px solid #D4C080",
                  color: "#8B5E0A",
                  fontFamily: "monospace", fontSize: 6,
                  padding: "3px 6px", marginBottom: 3,
                  cursor: "pointer", textAlign: "left",
                  display: "block", width: "100%",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  letterSpacing: "0.05em",
                }}>
                  🎵 {h.label}
                </button>
              ))}
            </div>
          )}

          {/* Spotify embed player */}
          {spotifyEmbed && (
            <div style={{ marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 7, color: "#1DB954", letterSpacing: "0.08em" }}>● Now playing</div>
                <button
                  onClick={() => setSpotifyEmbed(null)}
                  style={{ background: "none", border: "none", color: "#B09060", cursor: "pointer", fontSize: 9 }}
                >
                  ✕
                </button>
              </div>
              <iframe
                src={spotifyEmbed}
                width="100%"
                height="200"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ border: "1px solid #D4A856", display: "block" }}
              />
              <div style={{ fontSize: 6, color: "#A07830", marginTop: 4, letterSpacing: "0.06em", textAlign: "center" }}>
                Controls play on your active Spotify device
              </div>
              {/* Paste another */}
              <button
                onClick={() => setSpotifyEmbed(null)}
                style={{
                  background: "none", border: "1px dashed #D4A856",
                  color: "#C49040", fontFamily: "monospace", fontSize: 6,
                  padding: "4px 0", width: "100%", cursor: "pointer",
                  marginTop: 6, letterSpacing: "0.08em",
                }}
              >
                + load another playlist
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
