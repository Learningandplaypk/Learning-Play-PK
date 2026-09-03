"use client";

/**
 * Procedural sound engine — zero audio files, everything synthesized with WebAudio.
 * Subtle hover blips, click pops, win/lose stingers, whoosh transitions, coin chime.
 */

type SfxName = "hover" | "click" | "correct" | "wrong" | "win" | "lose" | "coin" | "whoosh" | "levelup" | "tick";

let ctx: AudioContext | null = null;
let enabled = true;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSfxEnabled(v: boolean) {
  enabled = v;
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number, delay = 0) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseWhoosh(dur = 0.35) {
  const a = ac();
  if (!a) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(400, a.currentTime);
  filter.frequency.exponentialRampToValueAtTime(3200, a.currentTime + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.14, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  src.connect(filter).connect(g).connect(a.destination);
  src.start();
}

export function sfx(name: SfxName) {
  if (!enabled) return;
  switch (name) {
    case "hover":
      tone(1800, 0.05, "sine", 0.015);
      break;
    case "click":
      tone(700, 0.07, "triangle", 0.06, 900);
      break;
    case "correct":
      tone(660, 0.09, "sine", 0.08);
      tone(990, 0.12, "sine", 0.07, undefined, 0.07);
      break;
    case "wrong":
      tone(220, 0.18, "sawtooth", 0.05, 140);
      break;
    case "win":
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, "sine", 0.08, undefined, i * 0.09));
      break;
    case "lose":
      [392, 330, 262].forEach((f, i) => tone(f, 0.2, "triangle", 0.07, undefined, i * 0.12));
      break;
    case "coin":
      tone(1318, 0.06, "square", 0.04);
      tone(1760, 0.18, "square", 0.045, undefined, 0.05);
      break;
    case "whoosh":
      noiseWhoosh();
      break;
    case "levelup":
      [440, 554, 659, 880, 1108].forEach((f, i) => tone(f, 0.2, "sine", 0.09, undefined, i * 0.08));
      break;
    case "tick":
      tone(1200, 0.03, "square", 0.02);
      break;
  }
}
