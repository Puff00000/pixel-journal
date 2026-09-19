import { useState, useRef, useCallback, useEffect } from "react";

interface Track {
  id: string;
  name: string;
  emoji: string;
  color: string;
  generate: (ac: AudioContext) => OscillatorNode | null;
}

function createLoFiMelody(ac: AudioContext, notes: number[], bpm: number, color: string): ScriptProcessorNode {
  const bufferSize = 4096;
  const processor = ac.createScriptProcessor(bufferSize, 0, 2);
  let phase = 0;
  let notePhase = 0;
  const noteDur = (60 / bpm) * ac.sampleRate;
  let noteIdx = 0;
  let currentFreq = notes[0];
  let targetFreq = notes[0];
  let t = 0;

  processor.onaudioprocess = (e) => {
    const left = e.outputBuffer.getChannelData(0);
    const right = e.outputBuffer.getChannelData(1);

    for (let i = 0; i < bufferSize; i++) {
      if (notePhase >= noteDur) {
        notePhase = 0;
        noteIdx = (noteIdx + 1) % notes.length;
        targetFreq = notes[noteIdx];
      }
      currentFreq += (targetFreq - currentFreq) * 0.001;

      // Simple sine with slight envelope
      const env = Math.min(notePhase / (noteDur * 0.1), 1) * Math.max(0, 1 - (notePhase - noteDur * 0.7) / (noteDur * 0.3));
      const sample = Math.sin(phase) * env * 0.15;
      // Add a subtle second harmonic
      const sample2 = Math.sin(phase * 2) * env * 0.04;
      // Lo-fi noise
      const noise = (Math.random() * 2 - 1) * 0.008;

      left[i] = sample + sample2 + noise;
      right[i] = sample + sample2 + noise;

      phase += (2 * Math.PI * currentFreq) / ac.sampleRate;
      if (phase > 2 * Math.PI) phase -= 2 * Math.PI;
      notePhase++;
      t++;
    }
  };

  return processor;
}

const TRACKS: Track[] = [
  {
    id: "lofi-rain",
    name: "Rainy Cafe",
    emoji: "☕",
    color: "#c080d0",
    generate: () => null,
  },
  {
    id: "dreamy",
    name: "Dream Pop",
    emoji: "✨",
    color: "#e090e0",
    generate: () => null,
  },
  {
    id: "cozy-night",
    name: "Cozy Night",
    emoji: "🌙",
    color: "#a060e0",
    generate: () => null,
  },
  {
    id: "pixel-wave",
    name: "Pixel Wave",
    emoji: "🌊",
    color: "#80a0f0",
    generate: () => null,
  },
  {
    id: "spring-bloom",
    name: "Spring Bloom",
    emoji: "🌸",
    color: "#f080c0",
    generate: () => null,
  },
];

// Note frequencies
const NOTES = {
  "lofi-rain": [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 349.23, 329.63],
  "dreamy": [523.25, 587.33, 659.25, 698.46, 523.25, 440.0, 493.88, 523.25],
  "cozy-night": [196.0, 220.0, 246.94, 261.63, 293.66, 261.63, 246.94, 220.0],
  "pixel-wave": [329.63, 369.99, 415.30, 440.0, 493.88, 440.0, 415.30, 369.99],
  "spring-bloom": [349.23, 392.0, 440.0, 523.25, 587.33, 523.25, 440.0, 392.0],
};

const BPMS: Record<string, number> = {
  "lofi-rain": 72, "dreamy": 60, "cozy-night": 66, "pixel-wave": 80, "spring-bloom": 76,
};

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string>("lofi-rain");
  const [volume, setVolume] = useState(0.5);
  const [expanded, setExpanded] = useState(false);

  const acRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [barHeights, setBarHeights] = useState([3, 6, 4, 8, 5, 7, 3, 6]);

  const stopMusic = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const startMusic = useCallback((trackId: string) => {
    if (!acRef.current) {
      acRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ac = acRef.current;

    stopMusic();

    const gain = ac.createGain();
    gain.gain.value = volume;
    gainRef.current = gain;
    gain.connect(ac.destination);

    const notes = NOTES[trackId as keyof typeof NOTES];
    const bpm = BPMS[trackId] || 72;
    const processor = createLoFiMelody(ac, notes, bpm, "#fff");
    processorRef.current = processor;
    processor.connect(gain);

    // Animate bars
    let t = 0;
    const animate = () => {
      t += 0.08;
      setBarHeights(prev => prev.map((_, i) =>
        Math.max(2, Math.abs(Math.sin(t + i * 0.7) * 10 + Math.sin(t * 1.3 + i * 0.4) * 5))
      ));
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, [volume, stopMusic]);

  const togglePlay = useCallback(() => {
    if (playing) {
      stopMusic();
      setPlaying(false);
    } else {
      startMusic(currentTrack);
      setPlaying(true);
    }
  }, [playing, currentTrack, startMusic, stopMusic]);

  const selectTrack = useCallback((id: string) => {
    setCurrentTrack(id);
    if (playing) {
      stopMusic();
      setTimeout(() => startMusic(id), 50);
    }
  }, [playing, startMusic, stopMusic]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => { stopMusic(); };
  }, [stopMusic]);

  const track = TRACKS.find(t => t.id === currentTrack)!;

  return (
    <div
      className="pixel-border"
      style={{
        background: "rgba(30,10,50,0.92)",
        border: "2px solid rgba(180,80,200,0.6)",
        borderRadius: "2px",
        padding: "12px",
        width: "220px",
        fontFamily: "'Courier New', monospace",
        color: "#f0c0f8",
        userSelect: "none",
        backdropFilter: "blur(8px)",
        boxShadow: "0 0 20px rgba(160,80,200,0.3), inset 0 0 40px rgba(60,0,80,0.4)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ fontSize: "7px", letterSpacing: "0.15em", color: "#e080f0", textTransform: "uppercase" }}>
          ♪ Music Player
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: "none", border: "none", color: "#c080d0", cursor: "pointer", fontSize: "10px", padding: "2px 4px",
          }}
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Current track display */}
      <div style={{
        background: "rgba(60,10,80,0.8)",
        border: "1px solid rgba(150,60,180,0.5)",
        padding: "8px",
        marginBottom: "10px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "18px", marginBottom: "4px" }}>{track.emoji}</div>
        <div style={{ fontSize: "7px", color: track.color, letterSpacing: "0.1em" }}>{track.name}</div>
      </div>

      {/* Visualizer bars */}
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        gap: "3px", height: "24px", marginBottom: "10px",
      }}>
        {barHeights.map((h, i) => (
          <div key={i} style={{
            width: "5px",
            height: playing ? `${h}px` : "3px",
            background: playing
              ? `hsl(${280 + i * 15}, 70%, ${50 + h * 3}%)`
              : "rgba(150,80,180,0.3)",
            transition: "height 0.1s ease",
            imageRendering: "pixelated",
          }} />
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "10px" }}>
        <button
          onClick={togglePlay}
          className="pixel-btn"
          style={{
            background: playing ? "rgba(200,80,220,0.3)" : "rgba(150,60,180,0.3)",
            border: `2px solid ${playing ? "#e080f0" : "#a060c0"}`,
            color: playing ? "#f0c0ff" : "#d090e0",
            fontSize: "14px",
            width: "36px", height: "36px",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "2px",
          }}
        >
          {playing ? "⏸" : "▶"}
        </button>
      </div>

      {/* Volume */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: expanded ? "10px" : "0" }}>
        <span style={{ fontSize: "8px", color: "#c080d0" }}>♪</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          style={{
            flex: 1, height: "4px", appearance: "none",
            background: `linear-gradient(to right, #c080d0 ${volume * 100}%, rgba(80,40,100,0.5) ${volume * 100}%)`,
            outline: "none", cursor: "pointer", borderRadius: "0",
          }}
        />
        <span style={{ fontSize: "8px", color: "#c080d0" }}>♪♪</span>
      </div>

      {/* Track list */}
      {expanded && (
        <div style={{
          borderTop: "1px solid rgba(150,60,180,0.3)",
          paddingTop: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}>
          <div style={{ fontSize: "7px", color: "#a060c0", marginBottom: "4px", letterSpacing: "0.1em" }}>SELECT TRACK</div>
          {TRACKS.map(t => (
            <button
              key={t.id}
              onClick={() => selectTrack(t.id)}
              style={{
                background: currentTrack === t.id ? "rgba(180,80,200,0.3)" : "transparent",
                border: `1px solid ${currentTrack === t.id ? t.color : "rgba(100,40,120,0.5)"}`,
                color: currentTrack === t.id ? t.color : "#c090d0",
                fontSize: "7px",
                padding: "4px 8px",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                letterSpacing: "0.08em",
                borderRadius: "2px",
                fontFamily: "'Courier New', monospace",
              }}
            >
              <span>{t.emoji}</span>
              <span>{t.name}</span>
              {currentTrack === t.id && playing && (
                <span style={{ marginLeft: "auto", animation: "pixel-shimmer 1s ease-in-out infinite" }}>♪</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
