/**
 * Syndicate Sound Engine
 *
 * Synthesized sounds via Web Audio API — zero network requests, zero latency.
 * All sounds are deliberately subtle and satisfying.
 */

import { create } from 'zustand';

// ── Mute state (persisted) ──────────────────────────────────

interface SoundState {
  muted: boolean;
  toggle: () => void;
}

export const useSoundStore = create<SoundState>((set) => ({
  muted: typeof window !== 'undefined'
    ? localStorage.getItem('syndicate.muted') === 'true'
    : false,
  toggle: () =>
    set((s) => {
      const next = !s.muted;
      localStorage.setItem('syndicate.muted', String(next));
      return { muted: next };
    }),
}));

// ── Audio context (lazy init) ────────────────────────────────

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ── Core oscillator helper ───────────────────────────────────

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.08,
  startTime = 0,
) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, ac.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ac.currentTime + startTime + duration,
  );

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime + startTime);
  osc.stop(ac.currentTime + startTime + duration + 0.05);
}

function playSweep(
  startFreq: number,
  endFreq: number,
  duration: number,
  volume = 0.06,
) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, ac.currentTime + duration);
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration + 0.05);
}

// ── Public API ───────────────────────────────────────────────

function ifNotMuted(fn: () => void) {
  if (!useSoundStore.getState().muted) {
    try { fn(); } catch { /* Audio context not available */ }
  }
}

/** Quick frequency sweep — task submitted */
export function playWhoosh() {
  ifNotMuted(() => playSweep(400, 900, 0.15, 0.06));
}

/** Short sine ping — agent joined room */
export function playPing() {
  ifNotMuted(() => playTone(880, 0.12, 'sine', 0.07));
}

/** Two-tone ascending — review passed */
export function playDing() {
  ifNotMuted(() => {
    playTone(523, 0.15, 'sine', 0.07, 0);
    playTone(659, 0.2, 'sine', 0.07, 0.1);
  });
}

/** Soft bell — approval needed */
export function playChime() {
  ifNotMuted(() => {
    playTone(1047, 0.3, 'sine', 0.05, 0);
    playTone(1319, 0.25, 'sine', 0.03, 0.05);
  });
}

/** Rising 3-note — task complete */
export function playRise() {
  ifNotMuted(() => {
    playTone(523, 0.15, 'triangle', 0.08, 0);
    playTone(659, 0.15, 'triangle', 0.08, 0.12);
    playTone(784, 0.25, 'triangle', 0.08, 0.24);
  });
}
