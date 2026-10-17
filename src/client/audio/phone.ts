// =============================================================================
// QAP — Emergency Dispatch — áudio · central: toque do telefone, zumbido fluorescente,
// metrônomo da RCP e batimento cardíaco.
// =============================================================================
import { every, type Rig } from './core';
import { bufSrc, cleanup, clamp, fadeOut, filt, gain, mulberry32, osc, oscWave, rr, shaper, stopSafe, type Rand } from './dsp';
import { noiseHit, tone } from './kit';

export interface Stoppable {
  stop(t: number): void;
}

// -----------------------------------------------------------------------------
// Toque
// -----------------------------------------------------------------------------
/**
 * Um "trim" do telefone: dois tons alternados (~425 Hz e uma terça acima) com
 * caráter de sino FM e martelinho. level 0..1 = mais agudo, áspero e rápido.
 */
export function ringBurst(rig: Rig, dest: AudioNode, t: number, dur: number, level: number, phantom: boolean, r: Rand): Stoppable & { end: number } {
  const ctx = rig.ctx;
  const L = clamp(level, 0, 1);
  const fA = 425 * (1 + 0.06 * L) * (phantom ? 0.955 : 1);
  const fB = fA * 1.2;
  const w = phantom ? 15 : 18 + 6 * L;
  const nodes: AudioNode[] = [];
  const car = osc(ctx, 'sine', (fA + fB) / 2);
  const sq = osc(ctx, 'square', w);
  const sqg = gain(ctx, (fB - fA) / 2);
  sq.connect(sqg).connect(car.frequency);
  const mod = osc(ctx, 'sine', fA * 2.76);
  const mg = gain(ctx, 0);
  mod.connect(mg).connect(car.frequency);
  const saw = osc(ctx, 'sawtooth', w * 2);
  const sg = gain(ctx, -0.3);
  const amp = gain(ctx, 0.7);
  saw.connect(sg).connect(amp.gain);
  car.connect(amp);
  const body = filt(ctx, 'peaking', 1100, 1.2, 4);
  const sh = shaper(ctx, 0.12 + 0.5 * L);
  const env = gain(ctx, 0);
  amp.connect(body).connect(sh);
  let last: AudioNode = sh;
  const srcs: OscillatorNode[] = [car, sq, mod, saw];
  if (phantom) {
    const lp = filt(ctx, 'lowpass', 1800, 0.7);
    sh.connect(lp);
    last = lp;
    nodes.push(lp);
    const drift = osc(ctx, 'sine', 0.7 + r() * 0.4);
    const dg = gain(ctx, 22);
    drift.connect(dg).connect(car.detune);
    srcs.push(drift);
    nodes.push(dg);
    const send = gain(ctx, 0.7, rig.send.sfx);
    env.connect(send);
    nodes.push(send);
  }
  last.connect(env).connect(dest);
  nodes.push(sqg, mg, sg, amp, body, sh, env);
  const peak = (0.32 + 0.12 * L) * (phantom ? 0.45 : 1);
  const idx = (1.4 + 1.2 * L) * fA;
  mg.gain.setValueAtTime(idx, t);
  mg.gain.setTargetAtTime(idx * 0.35, t, 0.25);
  const atk = phantom ? 0.25 : 0.006;
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + atk);
  env.gain.setValueAtTime(peak, t + dur - 0.04);
  env.gain.linearRampToValueAtTime(0, t + dur);
  const end = t + dur + 0.02;
  for (const s of srcs) {
    s.start(t);
    s.stop(end);
  }
  cleanup(car, ...nodes, sq, mod, saw, ...srcs.slice(4));
  return {
    end,
    stop(t2: number) {
      if (t2 >= end) return;
      fadeOut(env.gain, Math.max(t, t2), 0.03);
      for (const s of srcs) stopSafe(s, Math.max(t, t2) + 0.05);
    },
  };
}

/** Toque em loop (1 s ligado / ~2 s desligado) enquanto há ligações na fila. */
export class RingLoop {
  private cancel: (() => void) | null = null;
  private bursts: (Stoppable & { end: number })[] = [];
  level = 0;

  constructor(private rig: Rig) {}

  get on(): boolean {
    return this.cancel !== null;
  }

  /** algum toque soando ou prestes a soar? */
  busyAt(t: number): boolean {
    return this.bursts.some((b) => b.end > t - 0.2);
  }

  start(level: number): void {
    this.level = clamp(level, 0, 1);
    if (this.cancel) return;
    const rig = this.rig;
    const r = mulberry32(1920 + Math.floor(Math.random() * 1000));
    const t0 = rig.clock.now + 0.03;
    this.cancel = every(
      rig.clock,
      t0,
      () => 1.0 + (2.0 - 0.7 * this.level) * rr(r, 0.97, 1.03),
      (t) => {
        this.bursts = this.bursts.filter((b) => b.end > rig.clock.now);
        this.bursts.push(ringBurst(rig, rig.in.sfx, t, 1.0, this.level, false, r));
      },
    );
  }

  stop(): void {
    if (!this.cancel) return;
    this.cancel();
    this.cancel = null;
    const now = this.rig.clock.now;
    for (const b of this.bursts) b.stop(now);
    this.bursts = [];
  }
}

// -----------------------------------------------------------------------------
// Zumbido fluorescente da central
// -----------------------------------------------------------------------------
export class CentralHum {
  private parts: { stop(t: number): void }[] = [];
  private cancelFlicker: (() => void) | null = null;
  private out: GainNode | null = null;

  constructor(private rig: Rig) {}

  get on(): boolean {
    return this.out !== null;
  }

  start(): void {
    if (this.out) return;
    const rig = this.rig;
    const ctx = rig.ctx;
    const t = rig.clock.now + 0.02;
    const out = gain(ctx, 0, rig.in.room);
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(1, t + 1.5);
    this.out = out;
    const lp = filt(ctx, 'lowpass', 1500, 0.7, 0, out);
    const humG = gain(ctx, 0.05, lp);
    const wave = rig.banks.wave('hum120', () => [1, 0.5, 0.33, 0.25, 0.12, 0.08, 0.05, 0.04]);
    const h1 = oscWave(ctx, wave, 120);
    h1.connect(humG);
    const h2 = osc(ctx, 'sine', 120.4);
    const h2g = gain(ctx, 0.25, humG);
    h2.connect(h2g);
    // chiado do reator (bem baixo) + ar-condicionado
    const bz = bufSrc(ctx, rig.banks.noise('white'), true);
    const bzf = filt(ctx, 'bandpass', 2500, 2);
    const bzg = gain(ctx, 0.006, out);
    bz.connect(bzf).connect(bzg);
    const ac = bufSrc(ctx, rig.banks.noise('brown'), true);
    const acf = filt(ctx, 'lowpass', 320, 0.7);
    const acg = gain(ctx, 0.016, out);
    ac.connect(acf).connect(acg);
    const srcs: AudioScheduledSourceNode[] = [h1, h2, bz, ac];
    h1.start(t);
    h2.start(t);
    bz.start(t, Math.random() * 4);
    ac.start(t, Math.random() * 4);
    cleanup(h1, h2, h2g, humG, lp, bz, bzf, bzg, ac, acf, acg);
    this.parts.push({ stop: (t2) => srcs.forEach((s) => stopSafe(s, t2)) });

    // piscadas raras
    const r = mulberry32(120 + Math.floor(Math.random() * 999));
    this.cancelFlicker = every(rig.clock, t + rr(r, 8, 20), () => rr(r, 25, 70), (tf) => this.flicker(tf, r, humG.gain));
  }

  private flicker(t: number, r: Rand, humParam: AudioParam): void {
    const rig = this.rig;
    const ctx = rig.ctx;
    if (!this.out) return;
    const dur = rr(r, 0.3, 1.2);
    const s = osc(ctx, 'sawtooth', 120);
    const bp = filt(ctx, 'bandpass', 1500, 1);
    const g = gain(ctx, 0);
    s.connect(bp).connect(g).connect(this.out);
    let tt = t;
    while (tt < t + dur) {
      const on = r() < 0.6;
      g.gain.setValueAtTime(on ? rr(r, 0.012, 0.03) : 0, tt);
      humParam.setValueAtTime(on ? 0.05 : rr(r, 0.015, 0.04), tt);
      tt += rr(r, 0.015, 0.045);
    }
    g.gain.setValueAtTime(0, tt);
    humParam.setValueAtTime(0.05, tt);
    s.start(t);
    s.stop(tt + 0.02);
    cleanup(s, bp, g);
    noiseHit(rig, this.out, t, { type: 'bandpass', freq: 2200, q: 2, peak: 0.05, decay: 0.01 });
    noiseHit(rig, this.out, tt, { type: 'bandpass', freq: 2000, q: 2, peak: 0.04, decay: 0.01 });
  }

  stop(): void {
    if (!this.out) return;
    const t = this.rig.clock.now;
    this.cancelFlicker?.();
    this.cancelFlicker = null;
    fadeOut(this.out.gain, t, 0.8);
    for (const p of this.parts) p.stop(t + 0.9);
    this.parts = [];
    const out = this.out;
    this.out = null;
    this.rig.clock.at(t + 1, () => {
      try {
        out.disconnect();
      } catch {
        /* noop */
      }
    });
  }
}

// -----------------------------------------------------------------------------
// Metrônomo (RCP) e coração
// -----------------------------------------------------------------------------
export function woodblock(rig: Rig, dest: AudioNode, t: number, accent: boolean): number {
  const f = accent ? 1600 : 1200;
  const p = accent ? 0.62 : 0.45;
  tone(rig, dest, t, { type: 'sine', freq: f, peak: p, attack: 0.001, decay: 0.05 });
  tone(rig, dest, t, { type: 'sine', freq: f * 2.4, peak: p * 0.35, attack: 0.001, decay: 0.025 });
  return noiseHit(rig, dest, t, { type: 'bandpass', freq: 3000, q: 1.5, peak: p * 0.5, decay: 0.006 });
}

export class Metronome {
  private cancel: (() => void) | null = null;
  bpm = 110;
  onTick?: (index: number, accent: boolean) => void;

  constructor(private rig: Rig) {}

  get on(): boolean {
    return this.cancel !== null;
  }

  start(bpm: number): void {
    this.bpm = clamp(bpm || 110, 20, 260);
    if (this.cancel) return;
    const rig = this.rig;
    this.cancel = every(
      rig.clock,
      rig.clock.now + 0.05,
      () => 60 / this.bpm,
      (t, i) => {
        const accent = (i + 1) % 30 === 0;
        woodblock(rig, rig.in.sfx, t, accent);
        const cb = this.onTick;
        if (cb) rig.clock.at(t, () => cb(i, accent));
      },
    );
  }

  stop(): void {
    this.cancel?.();
    this.cancel = null;
  }
}

export function heartbeatAt(rig: Rig, dest: AudioNode, t: number, bpm: number): void {
  tone(rig, dest, t, { freq: 62, freqEnd: 42, glide: 0.08, peak: 0.75, attack: 0.008, decay: 0.16 });
  tone(rig, dest, t, { freq: 124, freqEnd: 90, glide: 0.08, peak: 0.22, attack: 0.008, decay: 0.1 });
  noiseHit(rig, dest, t, { type: 'lowpass', freq: 160, peak: 0.3, decay: 0.05 });
  const dt = clamp((0.3 * 60) / bpm, 0.16, 0.32);
  tone(rig, dest, t + dt, { freq: 72, freqEnd: 50, glide: 0.07, peak: 0.5, attack: 0.008, decay: 0.12 });
  tone(rig, dest, t + dt, { freq: 140, peak: 0.13, attack: 0.008, decay: 0.08 });
}

export class Heart {
  private cancel: (() => void) | null = null;
  bpm = 72;

  constructor(private rig: Rig) {}

  get on(): boolean {
    return this.cancel !== null;
  }

  start(bpm: number): void {
    this.bpm = clamp(bpm || 72, 30, 220);
    if (this.cancel) return;
    const rig = this.rig;
    this.cancel = every(
      rig.clock,
      rig.clock.now + 0.05,
      () => 60 / this.bpm,
      (t) => heartbeatAt(rig, rig.in.sfx, t, this.bpm),
    );
  }

  stop(): void {
    this.cancel?.();
    this.cancel = null;
  }
}
