// =============================================================================
// QAP — Emergency Dispatch — áudio · efeitos sonoros (todos sintetizados)
// Cada efeito agenda seus nós a partir de t e devolve o tempo final.
// Pequenas variações aleatórias evitam o efeito "metralhadora".
// =============================================================================
import type { Rig } from './core';
import { bufSrc, cleanup, filt, gain, osc, rr, shaper, type Rand } from './dsp';
import { bell, noiseHit, pluck, tone } from './kit';

export type SfxName =
  | 'stamp' | 'click' | 'hover' | 'paper' | 'type' | 'warning' | 'note' | 'money' | 'insight' | 'wrong' | 'coffee' | 'photo'
  | 'interfone' | 'death' | 'saved' | 'tick' | 'door' | 'page' | 'hangup' | 'pickup' | 'dialtone' | 'busy' | 'siren' | 'thread'
  | 'unlock' | 'error' | 'achievement' | 'paper_slide' | 'pen' | 'radio_on' | 'radio_off';

export const SFX_NAMES: readonly SfxName[] = [
  'stamp', 'click', 'hover', 'paper', 'type', 'warning', 'note', 'money', 'insight', 'wrong', 'coffee', 'photo', 'interfone',
  'death', 'saved', 'tick', 'door', 'page', 'hangup', 'pickup', 'dialtone', 'busy', 'siren', 'thread', 'unlock', 'error',
  'achievement', 'paper_slide', 'pen', 'radio_on', 'radio_off',
];

/** Efeitos frequentes/descartáveis quando há sons demais tocando. */
export const LOW_PRIORITY = new Set<SfxName>(['hover', 'type', 'tick', 'click', 'pen', 'paper', 'page']);

type Fx = (rig: Rig, t: number, r: Rand) => number;

const S = (rig: Rig): AudioNode => rig.in.sfx;

/** Clique curto de plástico/metal. */
function clickAt(rig: Rig, t: number, freq: number, peak: number, dest = S(rig)): number {
  noiseHit(rig, dest, t, { type: 'bandpass', freq, q: 2.5, peak, decay: 0.012 });
  return tone(rig, dest, t, { type: 'triangle', freq: freq * 0.45, peak: peak * 0.35, decay: 0.012 });
}

/** Tom telefônico de 425 Hz (padrão Anatel) com cadência. */
function cadence(rig: Rig, t: number, on: number, off: number, cycles: number, peak: number): number {
  let end = t;
  for (let i = 0; i < cycles; i++) {
    const t0 = t + i * (on + off);
    end = tone(rig, rig.in.sfxPhone, t0, { freq: 425, peak, attack: 0.008, hold: on - 0.02, decay: 0.012, linear: true });
  }
  return end;
}

const FX: Record<SfxName, Fx> = {
  stamp(rig, t, r) {
    const out = S(rig);
    const k = rr(r, 0.92, 1.08);
    tone(rig, out, t, { freq: 98 * k, freqEnd: 52 * k, glide: 0.09, peak: 0.95, attack: 0.002, decay: 0.2 });
    noiseHit(rig, out, t, { type: 'lowpass', freq: 380, q: 0.7, peak: 0.9, attack: 0.001, decay: 0.07 });
    noiseHit(rig, out, t, { type: 'bandpass', freq: 230 * k, q: 2, peak: 0.6, decay: 0.12 });
    noiseHit(rig, out, t + 0.002, { type: 'bandpass', freq: 1250, q: 0.8, peak: 0.28, decay: 0.03 });
    return noiseHit(rig, out, t + rr(r, 0.12, 0.16), { type: 'highpass', freq: 2600, q: 0.7, peak: 0.07, attack: 0.012, decay: 0.05 });
  },
  click(rig, t, r) {
    const out = S(rig);
    tone(rig, out, t, { type: 'triangle', freq: 1800 * rr(r, 0.95, 1.05), freqEnd: 1150, glide: 0.02, peak: 0.3, attack: 0.001, decay: 0.03 });
    return noiseHit(rig, out, t, { type: 'highpass', freq: 4200, q: 0.7, peak: 0.14, decay: 0.008 });
  },
  hover(rig, t, r) {
    return tone(rig, S(rig), t, { freq: 2600 * rr(r, 0.97, 1.03), peak: 0.15, attack: 0.002, decay: 0.022 });
  },
  paper(rig, t, r) {
    const out = S(rig);
    noiseHit(rig, out, t, { type: 'bandpass', freq: 1800, q: 0.5, peak: 0.22, attack: 0.06, decay: 0.22 });
    let end = t;
    const n = 5 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      end = noiseHit(rig, out, t + rr(r, 0, 0.3), {
        type: 'bandpass', freq: rr(r, 2500, 5500), q: 0.9, peak: rr(r, 0.15, 0.45), attack: 0.004, decay: rr(r, 0.02, 0.06),
      });
    }
    return Math.max(end, t + 0.4);
  },
  type(rig, t, r) {
    const out = S(rig);
    noiseHit(rig, out, t, { type: 'highpass', freq: 2000, q: 0.7, peak: 0.38, decay: 0.012 });
    noiseHit(rig, out, t + 0.004, { type: 'bandpass', freq: 1500 * rr(r, 0.9, 1.12), q: 6, peak: 0.32, decay: 0.04 });
    return tone(rig, out, t + 0.003, { freq: 160 * rr(r, 0.9, 1.1), peak: 0.32, decay: 0.05 });
  },
  warning(rig, t) {
    const out = S(rig);
    let end = t;
    for (const t0 of [t, t + 0.24]) {
      tone(rig, out, t0, { type: 'square', freq: 220, peak: 0.16, attack: 0.005, hold: 0.14, decay: 0.03, lp: 1400, linear: true });
      end = tone(rig, out, t0, { type: 'sawtooth', freq: 223, peak: 0.09, attack: 0.005, hold: 0.14, decay: 0.03, lp: 900, linear: true });
    }
    return end;
  },
  note(rig, t) {
    const out = S(rig);
    noiseHit(rig, out, t, { type: 'highpass', freq: 3000, q: 0.7, peak: 0.12, attack: 0.004, decay: 0.05 });
    tone(rig, out, t + 0.03, { freq: 196, peak: 0.3, attack: 0.01, decay: 0.5, send: 0.1 });
    tone(rig, out, t + 0.03, { type: 'triangle', freq: 392, peak: 0.06, attack: 0.01, decay: 0.3 });
    return tone(rig, out, t + 0.16, { freq: 174.6, peak: 0.26, attack: 0.01, decay: 0.6, send: 0.1 });
  },
  money(rig, t, r) {
    const out = S(rig);
    let end = t;
    const n = 4 + Math.floor(r() * 3);
    let tt = t;
    for (let i = 0; i < n; i++) {
      const f = rr(r, 2300, 3600);
      const p = rr(r, 0.09, 0.17);
      const pan = rr(r, -0.4, 0.4);
      tone(rig, out, tt, { freq: f, peak: p, decay: rr(r, 0.15, 0.3), pan });
      tone(rig, out, tt, { freq: f * 1.47, peak: p * 0.6, decay: 0.16, pan });
      end = tone(rig, out, tt, { freq: f * 2.09, peak: p * 0.4, decay: 0.1, pan });
      noiseHit(rig, out, tt, { type: 'highpass', freq: 5000, peak: p * 0.6, decay: 0.01 });
      tt += rr(r, 0.045, 0.09);
    }
    return end;
  },
  insight(rig, t) {
    const out = S(rig);
    pluck(rig, out, t, { midi: 64, vel: 0.5, bright: 2, dur: 1.4, send: 0.15 });
    tone(rig, out, t + 0.05, { freq: 1760, peak: 0.16, attack: 0.004, decay: 0.9, send: 0.35 });
    tone(rig, out, t + 0.05, { freq: 2637, peak: 0.08, attack: 0.004, decay: 0.6, send: 0.35 });
    return bell(rig, out, t + 0.05, { freq: 1760, ratio: 2.01, index: 0.6, peak: 0.06, decay: 0.7, send: 0.3 });
  },
  wrong(rig, t) {
    const out = S(rig);
    tone(rig, out, t, { freq: 110, freqEnd: 64, glide: 0.12, peak: 0.75, decay: 0.26 });
    noiseHit(rig, out, t, { type: 'lowpass', freq: 300, peak: 0.45, decay: 0.08 });
    return tone(rig, out, t + 0.01, { type: 'square', freq: 92, peak: 0.12, decay: 0.3, lp: 500 });
  },
  coffee(rig, t, r) {
    const ctx = rig.ctx;
    const out = S(rig);
    // líquido: ruído em passa-banda subindo (xícara enchendo) + gorgolejo
    const src = bufSrc(ctx, rig.banks.noise('white'), true);
    const bp = filt(ctx, 'bandpass', 650, 4);
    const am = gain(ctx, 0.6);
    const g = gain(ctx, 0, out);
    const l1 = osc(ctx, 'sine', 9.3);
    const l2 = osc(ctx, 'sine', 13.7);
    const lg = gain(ctx, 0.25);
    l1.connect(lg);
    l2.connect(lg);
    lg.connect(am.gain);
    src.connect(bp).connect(am).connect(g);
    const dur = 1.45;
    bp.frequency.setValueAtTime(650, t);
    bp.frequency.exponentialRampToValueAtTime(1500, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.75, t + 0.12);
    g.gain.setValueAtTime(0.75, t + dur - 0.3);
    g.gain.linearRampToValueAtTime(0, t + dur);
    src.start(t, r() * 3);
    for (const s of [src, l1, l2]) {
      if (s !== src) s.start(t);
      s.stop(t + dur + 0.05);
    }
    cleanup(src, bp, am, g, lg, l1, l2);
    noiseHit(rig, out, t, { type: 'highpass', freq: 1500, peak: 0.12, attack: 0.01, decay: 0.15 });
    tone(rig, out, t + dur + 0.08, { freq: 2950, peak: 0.08, decay: 0.25 });
    return tone(rig, out, t + dur + 0.08, { freq: 4320, peak: 0.04, decay: 0.15 });
  },
  photo(rig, t) {
    const out = S(rig);
    clickAt(rig, t, 3000, 0.45);
    clickAt(rig, t + 0.075, 2400, 0.36);
    tone(rig, out, t + 0.15, { freq: 523.25, peak: 0.055, attack: 0.35, decay: 1.4, send: 0.4, sendBus: 'sfx' });
    return tone(rig, out, t + 0.15, { freq: 659.25, peak: 0.04, attack: 0.45, decay: 1.4, send: 0.4 });
  },
  interfone(rig, t) {
    const ctx = rig.ctx;
    const out = S(rig);
    let end = t;
    for (const t0 of [t, t + 0.44]) {
      const a = osc(ctx, 'sawtooth', 120);
      const b = osc(ctx, 'sawtooth', 181);
      const bp = filt(ctx, 'bandpass', 950, 1.2);
      const sh = shaper(ctx, 0.6);
      const g = gain(ctx, 0, out);
      a.connect(bp);
      b.connect(bp);
      bp.connect(sh).connect(g);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.32, t0 + 0.01);
      g.gain.setValueAtTime(0.32, t0 + 0.3);
      g.gain.linearRampToValueAtTime(0, t0 + 0.33);
      end = t0 + 0.35;
      for (const s of [a, b]) {
        s.start(t0);
        s.stop(end);
      }
      cleanup(a, b, bp, sh, g);
    }
    return end;
  },
  death(rig, t) {
    const out = S(rig);
    tone(rig, out, t, { freq: 55, peak: 0.28, attack: 0.25, decay: 2.8, lp: 400, send: 0.3 });
    tone(rig, out, t, { freq: 82.41, peak: 0.13, attack: 0.3, decay: 2.4, lp: 400, send: 0.3 });
    tone(rig, out, t + 0.05, { type: 'triangle', freq: 110, peak: 0.07, attack: 0.3, decay: 2.2, lp: 500, send: 0.3 });
    tone(rig, out, t + 0.05, { type: 'triangle', freq: 116.54, peak: 0.05, attack: 0.5, decay: 2.0, lp: 500 });
    return noiseHit(rig, out, t + 0.1, { type: 'lowpass', color: 'brown', freq: 500, peak: 0.08, attack: 0.4, decay: 1.4 });
  },
  saved(rig, t) {
    const out = S(rig);
    let end = t;
    [349.23, 440, 523.25, 783.99].forEach((f, i) => {
      const t0 = t + i * 0.12;
      tone(rig, out, t0, { freq: f, peak: 0.16, attack: 0.02, decay: 0.8, send: 0.25 });
      end = tone(rig, out, t0, { type: 'triangle', freq: f * 2, peak: 0.03, attack: 0.02, decay: 0.5, send: 0.25 });
    });
    return end;
  },
  tick(rig, t, r) {
    const out = S(rig);
    noiseHit(rig, out, t, { type: 'bandpass', freq: 3500 * rr(r, 0.95, 1.05), q: 3, peak: 0.8, decay: 0.012 });
    return tone(rig, out, t, { freq: 2400, peak: 0.28, decay: 0.015 });
  },
  door(rig, t) {
    const ctx = rig.ctx;
    const out = S(rig);
    clickAt(rig, t, 2500, 0.3);
    tone(rig, out, t + 0.01, { type: 'triangle', freq: 900, peak: 0.08, decay: 0.03 });
    // rangido
    const s = osc(ctx, 'sawtooth', 180);
    const vib = osc(ctx, 'sine', 7.3);
    const vg = gain(ctx, 18);
    vib.connect(vg).connect(s.frequency);
    const bp = filt(ctx, 'bandpass', 900, 3);
    const g = gain(ctx, 0, out);
    s.connect(bp).connect(g);
    const c0 = t + 0.08;
    s.frequency.setValueAtTime(180, c0);
    s.frequency.linearRampToValueAtTime(240, c0 + 0.45);
    g.gain.setValueAtTime(0, c0);
    g.gain.linearRampToValueAtTime(0.07, c0 + 0.1);
    g.gain.linearRampToValueAtTime(0.03, c0 + 0.35);
    g.gain.linearRampToValueAtTime(0, c0 + 0.48);
    s.start(c0);
    vib.start(c0);
    s.stop(c0 + 0.5);
    vib.stop(c0 + 0.5);
    cleanup(s, vib, vg, bp, g);
    tone(rig, out, t + 0.62, { freq: 78, freqEnd: 52, glide: 0.15, peak: 0.4, decay: 0.28 });
    noiseHit(rig, out, t + 0.62, { type: 'lowpass', freq: 260, peak: 0.35, decay: 0.1 });
    return clickAt(rig, t + 0.64, 2200, 0.22);
  },
  page(rig, t, r) {
    const out = S(rig);
    noiseHit(rig, out, t, { type: 'bandpass', freq: 900, freqEnd: 4000, q: 0.8, peak: 0.4, attack: 0.03, decay: 0.13 });
    return noiseHit(rig, out, t + rr(r, 0.13, 0.17), { type: 'highpass', freq: 3500, peak: 0.22, decay: 0.02 });
  },
  hangup(rig, t) {
    const out = S(rig);
    tone(rig, out, t, { freq: 140, freqEnd: 90, glide: 0.08, peak: 0.5, decay: 0.1 });
    noiseHit(rig, out, t, { type: 'bandpass', freq: 600, q: 1.5, peak: 0.4, decay: 0.06 });
    return clickAt(rig, t + 0.035, 3000, 0.25);
  },
  pickup(rig, t, r) {
    const out = S(rig);
    for (let i = 0; i < 3; i++) noiseHit(rig, out, t + rr(r, 0, 0.07), { type: 'bandpass', freq: rr(r, 1500, 2600), q: 2, peak: 0.2, decay: 0.015 });
    clickAt(rig, t + 0.06, 2800, 0.38);
    return noiseHit(rig, rig.in.sfxPhone, t + 0.08, { type: 'bandpass', freq: 1500, q: 0.5, peak: 0.035, attack: 0.05, decay: 0.3 });
  },
  dialtone(rig, t) {
    return tone(rig, rig.in.sfxPhone, t, { freq: 425, peak: 0.08, attack: 0.01, hold: 1.55, decay: 0.05, linear: true });
  },
  busy(rig, t) {
    return cadence(rig, t, 0.25, 0.25, 5, 0.08);
  },
  siren(rig, t) {
    const ctx = rig.ctx;
    const out = S(rig);
    const dur = 3.2;
    const s = osc(ctx, 'sawtooth', 960);
    const s2 = osc(ctx, 'triangle', 960);
    const lp = filt(ctx, 'lowpass', 2200, 0.8);
    const g = gain(ctx, 0, out);
    const send = gain(ctx, 0.25, rig.send.sfx);
    g.connect(send);
    s.connect(lp);
    s2.connect(lp);
    lp.connect(g);
    // dois tons (hi-lo), com efeito Doppler após a metade
    for (let i = 0, tt = t; tt < t + dur; i++, tt += 0.45) {
      const dop = tt > t + dur / 2 ? 0.94 : 1;
      const f = (i % 2 === 0 ? 960 : 770) * dop;
      s.frequency.setTargetAtTime(f, tt, 0.015);
      s2.frequency.setTargetAtTime(f, tt, 0.015);
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.13, t + dur * 0.45);
    g.gain.linearRampToValueAtTime(0, t + dur);
    for (const o of [s, s2]) {
      o.start(t);
      o.stop(t + dur + 0.02);
    }
    cleanup(s, s2, lp, g, send);
    return t + dur;
  },
  thread(rig, t) {
    const out = S(rig);
    noiseHit(rig, out, t, { type: 'bandpass', freq: 600, freqEnd: 2400, q: 4, peak: 0.13, attack: 0.04, decay: 0.2 });
    tone(rig, out, t, { freq: 330, freqEnd: 495, glide: 0.2, peak: 0.05, attack: 0.03, decay: 0.2 });
    return pluck(rig, out, t + 0.22, { midi: 69, vel: 0.28, bright: 2, dur: 0.7 });
  },
  unlock(rig, t) {
    const out = S(rig);
    noiseHit(rig, out, t, { type: 'bandpass', freq: 3500, q: 4, peak: 0.35, decay: 0.02 });
    noiseHit(rig, out, t + 0.07, { type: 'bandpass', freq: 2900, q: 4, peak: 0.3, decay: 0.025 });
    tone(rig, out, t + 0.12, { freq: 880, peak: 0.17, attack: 0.005, decay: 0.15 });
    return tone(rig, out, t + 0.2, { freq: 1318.5, peak: 0.17, attack: 0.005, decay: 0.25, send: 0.15 });
  },
  error(rig, t) {
    const out = S(rig);
    tone(rig, out, t, { type: 'square', freq: 330, peak: 0.13, attack: 0.004, hold: 0.07, decay: 0.03, lp: 1200, linear: true });
    return tone(rig, out, t + 0.1, { type: 'square', freq: 247, peak: 0.13, attack: 0.004, hold: 0.12, decay: 0.05, lp: 1100, linear: true });
  },
  achievement(rig, t) {
    const out = S(rig);
    let end = t;
    [783.99, 1046.5, 1318.5, 1568].forEach((f, i) => {
      end = bell(rig, out, t + i * 0.08, { freq: f, ratio: 3.5, index: 0.8, peak: 0.13, decay: 1.3, send: 0.35 });
      tone(rig, out, t + i * 0.08, { freq: f, peak: 0.06, decay: 1.0, send: 0.3 });
    });
    noiseHit(rig, out, t + 0.3, { type: 'highpass', freq: 6000, peak: 0.03, attack: 0.05, decay: 0.4 });
    return end;
  },
  paper_slide(rig, t) {
    const out = S(rig);
    noiseHit(rig, out, t, { type: 'bandpass', freq: 1300, freqEnd: 800, q: 0.6, peak: 0.3, attack: 0.08, hold: 0.12, decay: 0.16 });
    return noiseHit(rig, out, t, { crackle: true, type: 'highpass', freq: 2500, peak: 0.45, attack: 0.08, hold: 0.12, decay: 0.15 });
  },
  pen(rig, t, r) {
    const out = S(rig);
    let tt = t;
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const d = rr(r, 0.06, 0.11);
      noiseHit(rig, out, tt, { type: 'bandpass', freq: rr(r, 3000, 5000), q: 1.5, peak: rr(r, 0.15, 0.27), attack: 0.01, hold: d * 0.5, decay: 0.05 });
      tt += d + rr(r, 0.01, 0.04);
    }
    return noiseHit(rig, out, tt, { type: 'bandpass', freq: 2200, q: 2, peak: 0.27, decay: 0.015 });
  },
  radio_on(rig, t) {
    const out = S(rig);
    clickAt(rig, t, 2200, 0.4);
    noiseHit(rig, out, t + 0.01, { type: 'bandpass', freq: 1800, q: 0.5, peak: 0.17, attack: 0.002, hold: 0.05, decay: 0.03 });
    return tone(rig, out, t + 0.07, { freq: 1000, peak: 0.05, attack: 0.003, hold: 0.035, decay: 0.01, linear: true });
  },
  radio_off(rig, t) {
    const out = S(rig);
    noiseHit(rig, out, t, { type: 'bandpass', freq: 2000, q: 0.4, peak: 0.26, attack: 0.003, decay: 0.18 });
    clickAt(rig, t + 0.19, 2000, 0.3);
    tone(rig, out, t + 0.02, { freq: 1200, peak: 0.04, attack: 0.003, hold: 0.05, decay: 0.01, linear: true });
    return tone(rig, out, t + 0.09, { freq: 900, peak: 0.04, attack: 0.003, hold: 0.05, decay: 0.01, linear: true });
  },
};

/** Toca um efeito; devolve o tempo final (ou t se o nome for desconhecido). */
export function playSfx(rig: Rig, name: SfxName, t: number, r: Rand): number {
  const fx = FX[name];
  if (!fx) return t;
  return fx(rig, t, r);
}
