import { useState } from "react";

interface Entry {
  id: number;
  date: string;
  preview: string;
  wordCount: number;
  mood: string;
}

const SAMPLE_ENTRIES: Entry[] = [
  { id: 1, date: "JUN 22", preview: "Today the sky was the color of...", wordCount: 142, mood: "🌸" },
  { id: 2, date: "JUN 20", preview: "I discovered a new coffee shop...", wordCount: 89, mood: "☕" },
  { id: 3, date: "JUN 18", preview: "Dreams of a purple forest where...", wordCount: 203, mood: "✨" },
];

interface Props {
  charCount: number;
  onNewEntry: () => void;
}

export default function JournalEntries({ charCount, onNewEntry }: Props) {
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      width: "200px",
      fontFamily: "'Courier New', monospace",
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(30,10,50,0.92)",
        border: "2px solid rgba(180,80,200,0.5)",
        padding: "10px",
        backdropFilter: "blur(8px)",
        boxShadow: "0 0 20px rgba(160,80,200,0.2)",
      }}>
        <div style={{ fontSize: "7px", color: "#e080f0", letterSpacing: "0.15em", marginBottom: "8px", textTransform: "uppercase" }}>
          ✦ My Journal
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px",
        }}>
          <div style={{ background: "rgba(60,10,80,0.6)", padding: "6px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#f0c0ff", fontWeight: "bold" }}>
              {charCount}
            </div>
            <div style={{ fontSize: "6px", color: "#a060c0", letterSpacing: "0.1em" }}>CHARS</div>
          </div>
          <div style={{ background: "rgba(60,10,80,0.6)", padding: "6px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", color: "#f0c0ff", fontWeight: "bold" }}>
              {SAMPLE_ENTRIES.length + 1}
            </div>
            <div style={{ fontSize: "6px", color: "#a060c0", letterSpacing: "0.1em" }}>ENTRIES</div>
          </div>
        </div>
      </div>

      {/* New entry button */}
      <button
        onClick={onNewEntry}
        className="pixel-btn"
        style={{
          background: "linear-gradient(135deg, rgba(200,80,220,0.3), rgba(150,60,180,0.3))",
          border: "2px solid rgba(220,100,240,0.7)",
          color: "#f0c0ff",
          fontSize: "7px",
          padding: "8px",
          letterSpacing: "0.12em",
          width: "100%",
          textTransform: "uppercase",
          fontFamily: "'Courier New', monospace",
          backdropFilter: "blur(4px)",
        }}
      >
        + New Entry
      </button>

      {/* Past entries */}
      <div style={{
        background: "rgba(30,10,50,0.92)",
        border: "2px solid rgba(140,60,170,0.4)",
        padding: "10px",
        backdropFilter: "blur(8px)",
        boxShadow: "0 0 20px rgba(160,80,200,0.2)",
      }}>
        <div style={{ fontSize: "7px", color: "#c070e0", letterSpacing: "0.12em", marginBottom: "8px", textTransform: "uppercase" }}>
          Past Entries
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {SAMPLE_ENTRIES.map(entry => (
            <button
              key={entry.id}
              onClick={() => setSelectedEntry(selectedEntry === entry.id ? null : entry.id)}
              style={{
                background: selectedEntry === entry.id ? "rgba(160,60,200,0.3)" : "rgba(50,10,70,0.5)",
                border: `1px solid ${selectedEntry === entry.id ? "rgba(200,100,240,0.7)" : "rgba(100,40,140,0.4)"}`,
                color: "#d0a0e8",
                fontSize: "7px",
                padding: "6px 8px",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "'Courier New', monospace",
                lineHeight: "1.6",
                borderRadius: "2px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                <span style={{ color: "#e090f0", fontSize: "7px" }}>{entry.date}</span>
                <span>{entry.mood}</span>
              </div>
              <div style={{ color: "#b080d0", fontSize: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {entry.preview}
              </div>
              <div style={{ color: "#806090", fontSize: "6px", marginTop: "2px" }}>
                {entry.wordCount} words
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mood tracker */}
      <div style={{
        background: "rgba(30,10,50,0.92)",
        border: "2px solid rgba(140,60,170,0.4)",
        padding: "10px",
        backdropFilter: "blur(8px)",
      }}>
        <div style={{ fontSize: "7px", color: "#c070e0", letterSpacing: "0.12em", marginBottom: "8px", textTransform: "uppercase" }}>
          Today's Mood
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["🌸", "☕", "✨", "🌙", "🦋", "🌊"].map(m => (
            <button
              key={m}
              style={{
                background: "rgba(60,10,80,0.6)",
                border: "1px solid rgba(120,60,160,0.4)",
                fontSize: "14px",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "2px",
                transition: "transform 0.1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.2)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
