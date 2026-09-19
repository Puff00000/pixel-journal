import { useRef, useCallback } from "react";

export function useTypingSound() {
  const acRef = useRef<AudioContext | null>(null);

  const getAC = useCallback(async () => {
    if (!acRef.current) {
      acRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Modern browsers auto-suspend AudioContext — must resume after user gesture
    if (acRef.current.state === "suspended") {
      await acRef.current.resume();
    }
    return acRef.current;
  }, []);

  const noise = useCallback((dur: number, gain: number) => {
    getAC().then((a) => {
      try {
        const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (a.sampleRate * dur * 0.18));
        }
        const src = a.createBufferSource();
        src.buffer = buf;
        const g = a.createGain();
        g.gain.value = gain;
        src.connect(g);
        g.connect(a.destination);
        src.start();
      } catch (_) {}
    }).catch(() => {});
  }, [getAC]);

  const tone = useCallback((freq: number, dur: number, gain: number) => {
    getAC().then((a) => {
      try {
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        g.gain.setValueAtTime(gain, a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
        o.connect(g);
        g.connect(a.destination);
        o.start();
        o.stop(a.currentTime + dur);
      } catch (_) {}
    }).catch(() => {});
  }, [getAC]);

  const clack = useCallback(() => noise(0.055, 0.32), [noise]);
  const ding  = useCallback(() => tone(920, 0.38, 0.22), [tone]);
  const thunk = useCallback(() => noise(0.10, 0.38), [noise]);

  return { clack, ding, thunk };
}
