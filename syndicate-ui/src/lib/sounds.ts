/**
 * Syndicate Sound Design — Web Audio API synthesized sounds.
 * No external files. Generated at runtime. Satisfying, minimal, premium.
 */

type SoundName = 'click' | 'whoosh' | 'ping' | 'success' | 'error' | 'ambient';

let audioCtx: AudioContext | null = null;
let muted = false;
const VOLUME = 0.25;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function setMuted(value: boolean) { muted = value; }
export function isMuted() { return muted; }

export function playSound(name: SoundName) {
  if (muted) return;
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();

  switch (name) {
    case 'click': return playClick(ctx);
    case 'whoosh': return playWhoosh(ctx);
    case 'ping': return playPing(ctx);
    case 'success': return playSuccess(ctx);
    case 'error': return playError(ctx);
    case 'ambient': return playAmbient(ctx);
  }
}

function playClick(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain).connect(ctx.destination);
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(VOLUME * 0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  osc.start(); osc.stop(ctx.currentTime + 0.08);
}

function playWhoosh(ctx: AudioContext) {
  const bufferSize = ctx.sampleRate * 0.3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.15);
  filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(VOLUME * 0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(); source.stop(ctx.currentTime + 0.3);
}

function playPing(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.connect(gain).connect(ctx.destination);
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(VOLUME * 0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.start(); osc.stop(ctx.currentTime + 0.2);
}

function playSuccess(ctx: AudioContext) {
  [0, 0.1, 0.2].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain).connect(ctx.destination);
    osc.frequency.setValueAtTime([523, 659, 784][i], ctx.currentTime + delay);
    gain.gain.setValueAtTime(VOLUME * 0.4, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.3);
  });
}

function playError(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.connect(gain).connect(ctx.destination);
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(VOLUME * 0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.start(); osc.stop(ctx.currentTime + 0.2);
}

function playAmbient(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc2.type = 'sine';
  osc.frequency.setValueAtTime(55, ctx.currentTime);
  osc2.frequency.setValueAtTime(82.5, ctx.currentTime);
  gain.gain.setValueAtTime(VOLUME * 0.05, ctx.currentTime);
  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  osc.start(); osc2.start();
  osc.stop(ctx.currentTime + 4); osc2.stop(ctx.currentTime + 4);
}
