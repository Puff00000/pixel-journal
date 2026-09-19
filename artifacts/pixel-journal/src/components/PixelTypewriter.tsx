import { useEffect, useRef, useCallback, useState } from "react";
import { useTypingSound } from "@/hooks/useAudio";

const COL = {
  bodyTop: "#c8a0d8", bodyMid: "#b080c8", bodyBot: "#8060a8",
  bodyHL: "#e0c0f0", bodyShad: "#604080",
  platen: "#2a1a3a", platenHL: "#5a3a7a", platenSh: "#150a1e",
  knob: "#c080d0", knobHL: "#e0a0f0", knobDark: "#704080",
  lever: "#c0a0d0", leverDk: "#806090",
  paper: "#fff0f8", paperRl: "#f0c0e0",
  tbar: "#3a1a4a", tbarHL: "#c080d0",
  kbBody: "#2a1040", kbEdge: "#150820",
  cap: "#f0d8f8", capSh: "#c8a0d8", capPrs: "#e080c8",
  capText: "#2a0840",
  base: "#9060a8", baseHL: "#c090d8", baseSh: "#603080",
  ribbon: "#1a0828",
  dropSh: "rgba(80,0,80,0.30)",
};

const PAP = { x: 160, y: 20, w: 240, h: 220 };
const PLT = { x: 100, y: 222, w: 360, h: 36 };
const BODY = { x: 90, y: 258, w: 380, h: 150 };
const KB = { x: 80, y: 395, w: 400, h: 170 };
const BASE = { x: 72, y: 540, w: 416, h: 36 };
const KW = 22, KH = 20, KSTEP = 27;
const keyRows = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M"],
];
const ROW_CY = [KB.y + 30, KB.y + 60, KB.y + 90];
const CW = 560;
const MAX_CHARS = 24;
const FONT_SZ = 10, LINE_H = 14;
const PAP_PAD_TOP = 12, PAP_PAD_BOT = 16;

function rowStartX(n: number) {
  const total = n * KW + (n - 1) * (KSTEP - KW);
  return (CW - total) / 2;
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill?: string, stroke?: string, lw?: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}

interface Props {
  onCharCountChange?: (count: number) => void;
}

export default function PixelTypewriter({ onCharCountChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const ptxtRef = useRef<HTMLDivElement>(null);
  const blinkRef = useRef<HTMLSpanElement>(null);
  const poverRef = useRef<HTMLDivElement>(null);

  const linesRef = useRef<string[]>([""]);
  const lineIdxRef = useRef(0);
  const pressedKeyRef = useRef<{ row?: number; col?: number; space?: boolean } | null>(null);
  const tbarAnimRef = useRef(0);
  const tbRafRef = useRef<number | null>(null);
  const chCurrentRef = useRef(620);
  const papHRef = useRef(PAP.h);
  const [hint, setHint] = useState("click here, then type");

  const { clack, ding, thunk } = useTypingSound();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const CH = chCurrentRef.current;
    ctx.clearRect(0, 0, CW, CH);

    // Background
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, CW, CH);

    // Drop shadow
    rr(ctx, 72, 564, 416, 24, 12, COL.dropSh);

    // BASE
    rr(ctx, BASE.x, BASE.y, BASE.w, BASE.h, 10, COL.base, COL.baseSh, 2);
    rr(ctx, BASE.x + 8, BASE.y + 4, BASE.w - 16, 6, 3, COL.baseHL);

    // KEYBOARD
    rr(ctx, KB.x, KB.y, KB.w, KB.h, 8, COL.kbBody, COL.kbEdge, 2);
    rr(ctx, KB.x + 10, KB.y + 10, KB.w - 20, KB.h - 20, 5, "#1a0830", COL.kbEdge, 1);

    // BODY
    rr(ctx, BODY.x, BODY.y, BODY.w, BODY.h, 10, COL.bodyMid, COL.bodyShad, 2);
    rr(ctx, BODY.x + 12, BODY.y + 6, 60, 8, 3, COL.bodyHL);
    ctx.fillStyle = COL.bodyBot;
    ctx.fillRect(BODY.x + BODY.w - 16, BODY.y + 10, 10, BODY.h - 20);

    // TYPEBARS
    const TB_CX = CW / 2, TB_CY = BODY.y + BODY.h - 10;
    ctx.save();
    ctx.translate(TB_CX, TB_CY);
    const N_BARS = 13;
    for (let i = 0; i < N_BARS; i++) {
      const t = i / (N_BARS - 1) - 0.5;
      const angle = t * 0.85;
      const isCenter = i === Math.floor(N_BARS / 2);
      const lifted = isCenter && tbarAnimRef.current > 0.05;
      const barLen = 64;
      const liftY = lifted ? -barLen * 0.85 * tbarAnimRef.current : 0;
      ctx.save();
      ctx.rotate(angle);
      ctx.strokeStyle = lifted ? COL.tbarHL : COL.tbar;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -barLen + liftY);
      ctx.stroke();
      if (lifted) {
        ctx.fillStyle = COL.tbarHL;
        ctx.beginPath(); ctx.arc(0, -barLen + liftY, 4, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = COL.tbar;
        ctx.beginPath(); ctx.arc(0, -barLen, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();

    // INK RIBBON
    ctx.fillStyle = COL.ribbon;
    ctx.fillRect(BODY.x + 50, BODY.y + 64, BODY.w - 100, 6);
    rr(ctx, BODY.x + 36, BODY.y + 52, 30, 22, 4, "#2a0830", "#1a0818", 1.5);
    ctx.fillStyle = "#4a1040";
    ctx.beginPath(); ctx.arc(BODY.x + 51, BODY.y + 63, 7, 0, Math.PI * 2); ctx.fill();
    rr(ctx, BODY.x + BODY.w - 66, BODY.y + 52, 30, 22, 4, "#2a0830", "#1a0818", 1.5);
    ctx.fillStyle = "#4a1040";
    ctx.beginPath(); ctx.arc(BODY.x + BODY.w - 51, BODY.y + 63, 7, 0, Math.PI * 2); ctx.fill();

    // PLATEN
    rr(ctx, PLT.x, PLT.y, PLT.w, PLT.h, 8, COL.platen, COL.platenSh, 2.5);
    ctx.fillStyle = COL.platenHL;
    ctx.fillRect(PLT.x + 20, PLT.y + 6, PLT.w - 40, 4);

    // KNOBS
    for (const sx of [PLT.x + 22, PLT.x + PLT.w - 22]) {
      const cy = PLT.y + PLT.h / 2;
      ctx.fillStyle = COL.knobDark;
      ctx.beginPath(); ctx.arc(sx, cy, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COL.knob;
      ctx.beginPath(); ctx.arc(sx, cy - 1, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COL.knobHL;
      ctx.beginPath(); ctx.arc(sx - 4, cy - 5, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COL.knobDark;
      ctx.beginPath(); ctx.arc(sx, cy - 1, 6, 0, Math.PI * 2); ctx.fill();
    }

    // LEVER
    ctx.save();
    ctx.translate(PLT.x + 10, PLT.y + 4);
    ctx.strokeStyle = COL.leverDk; ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-34, -44); ctx.stroke();
    ctx.strokeStyle = COL.lever; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-34, -44); ctx.stroke();
    ctx.fillStyle = COL.lever;
    ctx.beginPath(); ctx.arc(-34, -44, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COL.leverDk;
    ctx.beginPath(); ctx.arc(-34, -44, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // PAPER GUIDES
    ctx.fillStyle = COL.platenHL;
    ctx.fillRect(PAP.x - 8, PLT.y - 4, 6, 28);
    ctx.fillRect(PAP.x + PAP.w + 2, PLT.y - 4, 6, 28);

    // PAPER
    const papH = papHRef.current;
    ctx.fillStyle = COL.paper;
    ctx.fillRect(PAP.x, PAP.y, PAP.w, papH);
    ctx.strokeStyle = COL.paperRl; ctx.lineWidth = 0.5;
    for (let py = PAP.y + 32; py < PAP.y + papH - 4; py += 14) {
      ctx.beginPath(); ctx.moveTo(PAP.x + 6, py); ctx.lineTo(PAP.x + PAP.w - 6, py); ctx.stroke();
    }
    ctx.fillStyle = "rgba(80,0,60,0.06)";
    ctx.fillRect(PAP.x, PAP.y, 5, papH);
    ctx.fillRect(PAP.x + PAP.w - 5, PAP.y, 5, papH);
    ctx.fillRect(PAP.x, PAP.y + papH - 8, PAP.w, 8);

    // KEYS
    for (let r = 0; r < keyRows.length; r++) {
      const n = keyRows[r].length;
      const sx = rowStartX(n);
      const cy = ROW_CY[r];
      for (let c = 0; c < n; c++) {
        const kx = sx + c * KSTEP;
        const ky = cy - KH / 2;
        const k = keyRows[r][c];
        const pk = pressedKeyRef.current;
        const pressed = pk && pk.row === r && pk.col === c;
        const dy = pressed ? 3 : 0;
        rr(ctx, kx, ky + dy + 3, KW, KH, 4, COL.capSh);
        rr(ctx, kx, ky + dy, KW, KH, 4, pressed ? COL.capPrs : COL.cap);
        if (!pressed) {
          ctx.fillStyle = "rgba(255,230,255,0.5)";
          ctx.fillRect(kx + 3, ky + 3, KW - 6, 5);
        }
        ctx.fillStyle = COL.capText;
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(k, kx + KW / 2, ky + KH / 2 + dy);
      }
    }

    // SPACEBAR
    const pk = pressedKeyRef.current;
    const sbPressed = pk && pk.space;
    const sbDy = sbPressed ? 3 : 0;
    const SBX = KB.x + 60, SBW = KB.w - 120, SBY = KB.y + 118;
    rr(ctx, SBX, SBY + sbDy + 3, SBW, 14, 4, COL.capSh);
    rr(ctx, SBX, SBY + sbDy, SBW, 14, 4, sbPressed ? COL.capPrs : COL.cap);
    if (!sbPressed) {
      ctx.fillStyle = "rgba(255,230,255,0.45)";
      ctx.fillRect(SBX + 3, SBY + 3, SBW - 6, 4);
    }

    // SHIFT KEYS
    const r2sx = rowStartX(keyRows[2].length);
    const r2end = r2sx + keyRows[2].length * KSTEP - (KSTEP - KW);
    const SHCY = ROW_CY[2];
    const lsW = r2sx - KB.x - 18;
    const lsX = KB.x + 12;
    if (lsW > 10) {
      rr(ctx, lsX, SHCY - KH / 2 + 3, lsW, KH, 4, COL.capSh);
      rr(ctx, lsX, SHCY - KH / 2, lsW, KH, 4, COL.cap);
      ctx.fillStyle = "rgba(255,230,255,0.45)";
      ctx.fillRect(lsX + 3, SHCY - KH / 2 + 3, lsW - 6, 5);
      ctx.fillStyle = COL.capText;
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("⇧", lsX + lsW / 2, SHCY);
    }
    const rsX = r2end + 6;
    const rsW = (KB.x + KB.w - 12) - rsX;
    if (rsW > 10) {
      rr(ctx, rsX, SHCY - KH / 2 + 3, rsW, KH, 4, COL.capSh);
      rr(ctx, rsX, SHCY - KH / 2, rsW, KH, 4, COL.cap);
      ctx.fillStyle = "rgba(255,230,255,0.45)";
      ctx.fillRect(rsX + 3, SHCY - KH / 2 + 3, rsW - 6, 5);
      ctx.fillStyle = COL.capText;
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("⇧", rsX + rsW / 2, SHCY);
    }
  }, []);

  const renderText = useCallback(() => {
    if (!ptxtRef.current || !poverRef.current) return;
    ptxtRef.current.textContent = linesRef.current.join("\n");
    const needed = PAP_PAD_TOP + linesRef.current.length * LINE_H + PAP_PAD_BOT;
    const newH = Math.max(PAP.h, needed);
    if (newH !== papHRef.current) {
      papHRef.current = newH;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const newCH = Math.max(620, PAP.y + newH + 20);
      if (newCH !== chCurrentRef.current) {
        chCurrentRef.current = newCH;
        const DPR = 2;
        canvas.width = CW * DPR;
        canvas.height = newCH * DPR;
        canvas.style.width = CW + "px";
        canvas.style.height = newCH + "px";
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
      draw();
    }
    const total = linesRef.current.reduce((s, l) => s + l.length, 0);
    onCharCountChange?.(total);
  }, [draw, onCharCountChange]);

  const fireTypebar = useCallback(() => {
    let start: number | null = null;
    if (tbRafRef.current) cancelAnimationFrame(tbRafRef.current);
    function step(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 220, 1);
      tbarAnimRef.current = p < 0.4 ? p / 0.4 : 1 - (p - 0.4) / 0.6;
      draw();
      if (p < 1) tbRafRef.current = requestAnimationFrame(step);
      else { tbarAnimRef.current = 0; draw(); }
    }
    tbRafRef.current = requestAnimationFrame(step);
  }, [draw]);

  const shakeCarriage = useCallback(() => {
    const seq = [3, -2, 1, -1, 0];
    let i = 0;
    function s() {
      if (!poverRef.current) return;
      if (i >= seq.length) { poverRef.current.style.transform = ""; return; }
      poverRef.current.style.transform = `translateX(${seq[i++]}px)`;
      setTimeout(s, 30);
    }
    s();
  }, []);

  const findKey = useCallback((ch: string) => {
    const u = ch.toUpperCase();
    for (let r = 0; r < keyRows.length; r++) {
      const c = keyRows[r].indexOf(u);
      if (c !== -1) return { row: r, col: c };
    }
    return null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const DPR = 2;
    canvas.width = CW * DPR;
    canvas.height = chCurrentRef.current * DPR;
    canvas.style.width = CW + "px";
    canvas.style.height = chCurrentRef.current + "px";
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(DPR, DPR);
    draw();

    // Position overlay
    if (poverRef.current && ptxtRef.current && blinkRef.current) {
      poverRef.current.style.left = PAP.x + 8 + "px";
      poverRef.current.style.top = PAP.y + PAP_PAD_TOP + "px";
      poverRef.current.style.width = PAP.w - 16 + "px";
      ptxtRef.current.style.fontSize = FONT_SZ + "px";
      ptxtRef.current.style.lineHeight = LINE_H + "px";
      blinkRef.current.style.width = "6px";
      blinkRef.current.style.height = FONT_SZ + "px";
    }
  }, [draw]);

  // Cursor blink
  useEffect(() => {
    let on = true;
    const id = setInterval(() => {
      on = !on;
      if (blinkRef.current) blinkRef.current.style.opacity = on ? "1" : "0";
    }, 500);
    return () => clearInterval(id);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    const k = e.key;

    if (k === "Backspace") {
      if (linesRef.current[lineIdxRef.current].length > 0) {
        linesRef.current[lineIdxRef.current] = linesRef.current[lineIdxRef.current].slice(0, -1);
        clack(); fireTypebar(); shakeCarriage();
      } else if (lineIdxRef.current > 0) {
        linesRef.current.pop();
        lineIdxRef.current--;
        thunk();
      }
      renderText();
      return;
    }

    if (k === "Enter") {
      ding(); setTimeout(thunk, 200);
      lineIdxRef.current++;
      if (linesRef.current.length <= lineIdxRef.current) linesRef.current.push("");
      renderText(); draw();
      return;
    }

    if (k.length === 1) {
      if (linesRef.current[lineIdxRef.current].length >= MAX_CHARS) {
        ding(); setTimeout(thunk, 220);
        lineIdxRef.current++;
        if (linesRef.current.length <= lineIdxRef.current) linesRef.current.push("");
      }
      linesRef.current[lineIdxRef.current] += k;
      clack(); fireTypebar(); shakeCarriage();

      const kp = findKey(k);
      if (kp) {
        pressedKeyRef.current = kp; draw();
        setTimeout(() => { pressedKeyRef.current = null; draw(); }, 140);
      } else if (k === " ") {
        pressedKeyRef.current = { space: true }; draw();
        setTimeout(() => { pressedKeyRef.current = null; draw(); }, 140);
      }
      renderText();
    }
  }, [clack, ding, thunk, draw, fireTypebar, shakeCarriage, findKey, renderText]);

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      outline-none="true"
      style={{ outline: "none", cursor: "default", display: "flex", flexDirection: "column", alignItems: "center" }}
      onClick={() => wrapRef.current?.focus()}
      onKeyDown={handleKeyDown}
      onFocus={() => setHint("type away...")}
      onBlur={() => setHint("click here, then type")}
    >
      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          style={{ display: "block", imageRendering: "pixelated" }}
        />
        <div
          ref={poverRef}
          style={{
            position: "absolute",
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            ref={ptxtRef}
            style={{
              fontFamily: "'Courier New', monospace",
              color: "#3a1040",
              lineHeight: "1.55",
              whiteSpace: "pre",
              letterSpacing: "0.04em",
            }}
          />
          <span
            ref={blinkRef}
            style={{ display: "inline-block", background: "#3a1040", verticalAlign: "bottom" }}
          />
        </div>
      </div>
      <div style={{
        color: "rgba(220,160,240,0.8)",
        fontSize: "8px",
        marginTop: "8px",
        letterSpacing: "0.12em",
        fontFamily: "monospace",
        textTransform: "uppercase",
      }}>
        {hint}
      </div>
    </div>
  );
}
