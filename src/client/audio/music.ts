// =============================================================================
// QAP — Emergency Dispatch — áudio · música (violão dedilhado em Karplus–Strong e temas)
// =============================================================================
import { every, type Rig } from './core';
import { bufSrc, cleanup, clamp, fadeOut, filt, gain, mtof, mulberry32, osc, oscWave, pick, rr, stopSafe, type Rand } from './dsp';
import { bell, noiseHit, pluck, tone } from './kit';
import { ringBurst } from './phone';

export type ThemeKind = 'titulo' | 'final_bom' | 'final_normal' | 'final_ruim' | 'gameover' | 'jornal';

type ChordName = 'Am' | 'Am7' | 'F' | 'Fmaj7' | 'C' | 'Cadd9' | 'G' | 'G/B' | 'Dm' | 'Dm7' | 'E7' | 'Em';
interface Chord {
  /** baixo (polegar) e baixo alternado */
  b: [number, number];
  /** cordas 3, 2, 1 */
  t: [number, number, number];
}
const CHORDS: Record<ChordName, Chord> = {
  Am: { b: [45, 52], t: [57, 60, 64] },
  Am7: { b: [45, 52], t: [55, 60, 64] },
  F: { b: [41, 48], t: [57, 60, 65] },
  Fmaj7: { b: [41, 48], t: [57, 60, 64] },
  C: { b: [48, 43], t: [55, 60, 64] },
  Cadd9: { b: [48, 43], t: [55, 62, 64] },
  G: { b: [43, 50], t: [55, 59, 67] },
  'G/B': { b: [47, 50], t: [55, 59, 67] },
  Dm: { b: [50, 45], t: [57, 62, 65] },
  Dm7: { b: [50, 45], t: [57, 60, 65] },
  E7: { b: [40, 47], t: [56, 59, 62] },
  Em: { b: [40, 47], t: [55, 59, 64] },
};

type Family = 'sparse' | 'arp' | 'full';
/** 8 colcheias por compasso. B = baixo, A = baixo alternado, x/y/z = cordas 3/2/1, '-' = pausa. */
const PATTERNS: Record<Family, string[][]> = {
  sparse: [
    ['B', '-', 'y', '-', 'z', '-', '-', '-'],
    ['B', '-', '-', 'x', '-', 'y', '-', '-'],
    ['B', '-', 'z', '-', 'A', '-', 'y', '-'],
    ['B', '-', '-', '-', 'x', '-', '-', '-'],
  ],
  arp: [
    ['B', 'x', 'y', 'z', 'A', 'z', 'y', 'x'],
    ['B', 'y', 'x', 'z', 'A', 'y', 'x', 'y'],
    ['B', 'x', 'y', 'x', 'A', 'x', 'z', 'x'],
  ],
  full: [
    ['Bz', 'x', 'y', 'x', 'Az', 'x', 'y', 'x'],
    ['Bz', 'y', 'A', 'x', 'B', 'yz', 'A', 'x'],
    ['B', 'x', 'y', 'z', 'Az', 'x', 'y', 'z'],
  ],
};
const PAN: Record<string, number> = { B: -0.22, A: -0.15, x: -0.04, y: 0.1, z: 0.22 };
const VEL: Record<string, number> = { B: 0.95, A: 0.78, x: 0.58, y: 0.6, z: 0.68 };

export interface SongParams {
  bpm(): number;
  prog(loop: number, r: Rand): ChordName[];
  family(): Family;
  density(): number;
  bright(): number;
  vel(): number;
  /** desafinação máxima em cents (desgaste) */
  detune(): number;
  swing?: number;
}

/** Sequenciador de violão: agenda compasso a compasso. */
export class GuitarSong {
  private cancel: (() => void) | null = null;
  private r: Rand;
  private strOff: Record<string, number> = {};
  private progs = new Map<number, ChordName[]>();

  constructor(
    private rig: Rig,
    private dest: AudioNode,
    private p: SongParams,
    seed: number,
  ) {
    this.r = mulberry32(seed);
    for (const k of ['B', 'A', 'x', 'y', 'z']) this.strOff[k] = this.r() * 2 - 1;
  }

  start(t: number): void {
    if (this.cancel) return;
    this.cancel = every(this.rig.clock, t, () => (60 / this.p.bpm()) * 4, (tb, i) => this.bar(tb, i));
  }

  stop(): void {
    this.cancel?.();
    this.cancel = null;
  }

  private chords(loop: number): ChordName[] {
    let c = this.progs.get(loop);
    if (!c) {
      c = this.p.prog(loop, this.r);
      this.progs.set(loop, c);
      this.progs.delete(loop - 3);
    }
    return c;
  }

  private bar(tb: number, idx: number): void {
    const p = this.p;
    const r = this.r;
    const loop = Math.floor(idx / 4);
    const b = idx % 4;
    const chord = CHORDS[this.chords(loop)[b]];
    const fam = p.family();
    const pat = pick(r, PATTERNS[fam]);
    const eighth = 60 / p.bpm() / 2;
    const swing = p.swing ?? 0.06;
    const dens = clamp(p.density(), 0, 1);
    const bright = p.bright();
    const vel = p.vel();
    const det = p.detune();
    const skipTreble = fam === 'sparse' && r() < 0.15;
    for (let s = 0; s < 8; s++) {
      const slot = pat[s];
      if (s === 7 && b === 3 && r() < 0.5) {
        // baixo caminhando para o próximo acorde
        const nextRoot = CHORDS[this.chords(loop + 1)[0]].b[0];
        const t = tb + s * eighth + swing * eighth;
        pluck(this.rig, this.dest, t, { midi: nextRoot - (r() < 0.5 ? 1 : 2), vel: vel * 0.6, bright, pan: PAN.B, cents: this.strOff.B * det });
        continue;
      }
      if (slot === '-') continue;
      const t0 = tb + s * eighth + (s % 2 === 1 ? swing * eighth : 0) + rr(r, -0.007, 0.007);
      let k = 0;
      for (const ch of slot) {
        let midi: number;
        if (ch === 'B') midi = chord.b[0];
        else if (ch === 'A') midi = chord.b[1];
        else {
          if (skipTreble || r() > dens) continue;
          midi = chord.t[ch === 'x' ? 0 : ch === 'y' ? 1 : 2];
        }
        const accent = s === 0 ? 1.1 : 1;
        pluck(this.rig, this.dest, t0 + k * 0.009, {
          midi,
          vel: vel * VEL[ch] * accent * rr(r, 0.85, 1.05),
          bright,
          pan: PAN[ch],
          cents: this.strOff[ch] * det + rr(r, -2, 2),
        });
        k++;
      }
    }
  }
}

/** Corpo do violão: EQ + saída + envio de reverb. */
function guitarBody(rig: Rig, dest: AudioNode, verb: number): { input: AudioNode; send: GainNode; nodes: AudioNode[] } {
  const ctx = rig.ctx;
  const p1 = filt(ctx, 'peaking', 110, 1.2, 3);
  const p2 = filt(ctx, 'peaking', 220, 1.4, 2);
  const hs = filt(ctx, 'highshelf', 3500, 0.7, -5);
  const lp = filt(ctx, 'lowpass', 5500, 0.7);
  const out = gain(ctx, 0.9, dest);
  p1.connect(p2).connect(hs).connect(lp).connect(out);
  const send = gain(ctx, verb, rig.send.music);
  lp.connect(send);
  return { input: p1, send, nodes: [p1, p2, hs, lp, out, send] };
}

/** Zumbido fluorescente desafinado (desgaste "vazando" para casa). */
function detunedHum(rig: Rig, dest: AudioNode, t: number): { g: GainNode; stop(t: number): void } {
  const ctx = rig.ctx;
  const g = gain(ctx, 0, dest);
  const lp = filt(ctx, 'lowpass', 1400, 0.7, 0, g);
  const w = rig.banks.wave('hum120', () => [1, 0.5, 0.33, 0.25, 0.12, 0.08, 0.05, 0.04]);
  const a = oscWave(ctx, w, 119.2, lp);
  const b = oscWave(ctx, w, 121.1);
  const bg = gain(ctx, 0.6, lp);
  b.connect(bg);
  const n = bufSrc(ctx, rig.banks.noise('white'), true);
  const nf = filt(ctx, 'bandpass', 1800, 3);
  const ng = gain(ctx, 0.12, lp);
  n.connect(nf).connect(ng);
  a.start(t);
  b.start(t);
  n.start(t, Math.random() * 4);
  cleanup(a, b, bg, lp, n, nf, ng);
  return {
    g,
    stop(t2: number) {
      for (const s of [a, b, n]) stopSafe(s, t2);
    },
  };
}

// -----------------------------------------------------------------------------
// Música de casa
// -----------------------------------------------------------------------------
export class HomeMusic {
  private mood = 0.5;
  private desgaste = 0;
  private out: GainNode;
  private song: GuitarSong;
  private hum: { g: GainNode; stop(t: number): void };
  private body: { input: AudioNode; send: GainNode; nodes: AudioNode[] };
  private band: 0 | 1 | 2 = 1;
  private stopped = false;

  constructor(
    private rig: Rig,
    mood: number,
    desgaste: number,
  ) {
    const ctx = rig.ctx;
    const t = rig.clock.now + 0.05;
    this.out = gain(ctx, 0, rig.in.music);
    this.out.gain.setValueAtTime(0, t);
    this.out.gain.linearRampToValueAtTime(1, t + 1.5);
    this.body = guitarBody(rig, this.out, 0.3);
    this.hum = detunedHum(rig, this.out, t);
    this.update(mood, desgaste);
    this.band = this.bandFor(this.mood);
    const self = this;
    this.song = new GuitarSong(
      rig,
      this.body.input,
      {
        bpm: () => 66 + 8 * self.mood,
        prog(loop, r) {
          self.band = self.bandFor(self.mood);
          const alt = loop % 2 === 1;
          if (self.band === 0) return alt && r() < 0.7 ? ['Am', 'Dm', 'E7', 'Am'] : ['Am', 'F', 'C', 'G'];
          if (self.band === 1) return alt ? ['Am', 'F', 'C', 'G'] : ['Am7', 'Fmaj7', 'C', 'G'];
          if (alt && r() < 0.4) return ['C', 'G/B', 'Am', 'F'];
          return alt ? ['Cadd9', 'Am7', 'Fmaj7', 'G'] : ['C', 'Am', 'F', 'G'];
        },
        family: () => (self.band === 0 ? 'sparse' : self.band === 1 ? 'arp' : 'full'),
        density: () => 0.55 + 0.45 * self.mood,
        bright: () => self.band,
        vel: () => 0.5 + 0.25 * self.mood,
        detune: () => (self.desgaste > 80 ? ((self.desgaste - 80) / 20) * 18 : 0),
      },
      4242,
    );
    this.song.start(t + 0.1);
  }

  /** histerese entre faixas de humor */
  private bandFor(m: number): 0 | 1 | 2 {
    const b = this.band;
    if (b === 0) return m > 0.38 ? (m > 0.7 ? 2 : 1) : 0;
    if (b === 2) return m < 0.63 ? (m < 0.3 ? 0 : 1) : 2;
    return m < 0.3 ? 0 : m > 0.7 ? 2 : 1;
  }

  update(mood: number, desgaste: number): void {
    this.mood = clamp(Number.isFinite(mood) ? mood : 0.5, 0, 1);
    this.desgaste = clamp(Number.isFinite(desgaste) ? desgaste : 0, 0, 100);
    const now = this.rig.clock.now;
    const h = this.desgaste > 60 ? Math.pow((this.desgaste - 60) / 40, 1.3) * 0.05 : 0;
    this.hum.g.gain.setTargetAtTime(h, now, 1.2);
    this.body.send.gain.setTargetAtTime(0.38 - 0.16 * this.mood, now, 1);
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    const now = this.rig.clock.now;
    this.song.stop();
    fadeOut(this.out.gain, now, 1.5);
    this.hum.stop(now + 1.6);
    const out = this.out;
    const nodes = this.body.nodes;
    this.rig.clock.at(now + 4.5, () => {
      for (const n of [out, ...nodes]) {
        try {
          n.disconnect();
        } catch {
          /* noop */
        }
      }
    });
  }
}

// -----------------------------------------------------------------------------
// Temas
// -----------------------------------------------------------------------------
export interface Theme {
  kind: ThemeKind;
  /** tempo em que termina sozinho (Infinity para loops) */
  end: number;
  stop(): void;
}

function pad(rig: Rig, dest: AudioNode, t: number, midis: number[], o: { peak: number; attack: number; hold: number; release: number; lp?: number }): void {
  for (const m of midis) {
    for (const d of [-6, 6]) {
      tone(rig, dest, t, { type: 'triangle', freq: mtof(m), detune: d, peak: o.peak, attack: o.attack, hold: o.hold, decay: o.release, lp: o.lp ?? 900, linear: true });
    }
  }
}

export function playTheme(rig: Rig, kind: ThemeKind): Theme {
  const ctx = rig.ctx;
  const t = rig.clock.now + 0.05;
  const out = gain(ctx, 0, rig.in.music);
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(1, t + (kind === 'jornal' || kind === 'gameover' ? 0.05 : 2));
  const cancels: (() => void)[] = [];
  const stops: ((t: number) => void)[] = [];
  const body = guitarBody(rig, out, 0.35);
  const r = mulberry32(kind.length * 131 + 7);
  let end = Infinity;

  const song = (p: Partial<SongParams> & Pick<SongParams, 'prog'>, seed: number, t0 = t + 0.1): GuitarSong => {
    const g = new GuitarSong(
      rig,
      body.input,
      { bpm: () => 70, family: () => 'arp', density: () => 0.8, bright: () => 1, vel: () => 0.55, detune: () => 0, ...p },
      seed,
    );
    g.start(t0);
    cancels.push(() => g.stop());
    return g;
  };

  switch (kind) {
    case 'titulo': {
      // drone frio + violão + motivo "1-9-2" no sino + telefone distante
      const lp = filt(ctx, 'lowpass', 700, 0.7, 0, out);
      const dg = gain(ctx, 0.05, lp);
      const d1 = osc(ctx, 'triangle', 110, dg);
      const d2 = osc(ctx, 'triangle', 164.8, dg);
      d2.detune.value = 4;
      const lf = osc(ctx, 'sine', 0.07);
      const lfg = gain(ctx, 250);
      lf.connect(lfg).connect(lp.frequency);
      const hw = rig.banks.wave('hum120', () => [1, 0.5, 0.33, 0.25, 0.12, 0.08, 0.05, 0.04]);
      const hum = oscWave(ctx, hw, 120);
      const hg = gain(ctx, 0.01, out);
      hum.connect(hg);
      for (const s of [d1, d2, lf, hum]) s.start(t);
      cleanup(d1, d2, lf, lfg, dg, lp, hum, hg);
      stops.push((t2) => [d1, d2, lf, hum].forEach((s) => stopSafe(s, t2)));
      const bpm = 68;
      const barDur = (60 / bpm) * 4;
      song({ bpm: () => bpm, prog: () => ['Am', 'F', 'C', 'E7'], family: () => (r() < 0.5 ? 'sparse' : 'arp'), density: () => 0.75, vel: () => 0.5 }, 192);
      const motifSend = gain(ctx, 0.5, rig.send.music);
      const motif = gain(ctx, 1, out);
      motif.connect(motifSend);
      cancels.push(
        every(rig.clock, t + 0.1, () => barDur * 4, (tl, i) => {
          if (i % 2 === 0) {
            const q = 60 / bpm;
            [69, 83, 71].forEach((m, k) => bell(rig, motif, tl + q * (k + 1), { freq: mtof(m), ratio: 1, index: 1.2, peak: 0.07, decay: 2.2 }));
            bell(rig, motif, tl + barDur + q, { freq: mtof(72), ratio: 1, index: 1, peak: 0.06, decay: 2.5 });
          }
          if (i % 3 === 2) ringBurst(rig, motif, tl + barDur * 2.5, 1, 0.1, true, r);
        }),
      );
      break;
    }
    case 'final_bom': {
      const bpm = 74;
      song({ bpm: () => bpm, prog: (loop) => (loop % 2 ? ['C', 'G', 'F', 'C'] : ['C', 'G/B', 'Am', 'F']), family: () => 'full', density: () => 1, bright: () => 2, vel: () => 0.6 }, 7);
      const barDur = (60 / bpm) * 4;
      const roots: number[][] = [[60, 64, 67], [59, 62, 67], [57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62], [53, 57, 60], [60, 64, 67]];
      cancels.push(every(rig.clock, t + 0.1, () => barDur, (tb, i) => pad(rig, out, tb, roots[i % 8], { peak: 0.018, attack: 0.8, hold: barDur - 0.8, release: 0.6, lp: 1200 })));
      break;
    }
    case 'final_normal':
      song({ bpm: () => 70, prog: (loop) => (loop % 2 ? ['Am7', 'Fmaj7', 'C', 'G'] : ['Am', 'F', 'C', 'G']), family: () => 'arp', density: () => 0.85, bright: () => 1, vel: () => 0.55 }, 70);
      break;
    case 'final_ruim': {
      const bpm = 62;
      song({ bpm: () => bpm, prog: () => ['Am', 'Dm', 'E7', 'Am'], family: () => 'sparse', density: () => 0.6, bright: () => 0, vel: () => 0.45, detune: () => 20 }, 13);
      body.send.gain.value = 0.5;
      const hum = detunedHum(rig, out, t);
      hum.g.gain.setTargetAtTime(0.045, t, 4);
      stops.push((t2) => hum.stop(t2));
      const barDur = (60 / bpm) * 4;
      const far = gain(ctx, 0.6, rig.send.music);
      cancels.push(every(rig.clock, t + barDur * 3, () => barDur * 8, (tl) => ringBurst(rig, far, tl, 1, 0.3, true, r)));
      break;
    }
    case 'gameover': {
      const lp = filt(ctx, 'lowpass', 300, 0.7, 0, out);
      tone(rig, lp, t, { freq: 55, peak: 0.16, attack: 1.5, hold: 2.5, decay: 3, linear: true });
      tone(rig, lp, t, { type: 'triangle', freq: 110, peak: 0.05, attack: 1.5, hold: 2, decay: 3, linear: true });
      const send = gain(ctx, 0.6, rig.send.music);
      const g = gain(ctx, 1, out);
      g.connect(send);
      [52, 48, 45].forEach((m, k) => pluck(rig, g, t + 0.5 + k * 0.95, { midi: m, vel: 0.35, bright: 0, cents: -8 * k }));
      const hw = rig.banks.wave('hum120', () => [1, 0.5, 0.33, 0.25, 0.12, 0.08, 0.05, 0.04]);
      const hum = oscWave(ctx, hw, 120);
      const hg = gain(ctx, 0, out);
      hum.connect(hg);
      hg.gain.setValueAtTime(0, t);
      hg.gain.linearRampToValueAtTime(0.012, t + 3.5);
      for (let k = 0; k < 6; k++) hg.gain.setValueAtTime(k % 2 ? 0.012 : 0.002, t + 3.9 + k * 0.05);
      hg.gain.setValueAtTime(0, t + 4.25);
      hum.start(t);
      hum.stop(t + 4.3);
      cleanup(hum, hg);
      noiseHit(rig, out, t + 4.25, { type: 'bandpass', freq: 2200, q: 2, peak: 0.04, decay: 0.012 });
      end = t + 7.2;
      stops.push(() => undefined);
      rig.clock.at(end + 0.2, () => {
        try {
          lp.disconnect();
          g.disconnect();
        } catch {
          /* noop */
        }
      });
      break;
    }
    case 'jornal': {
      const bpm = 112;
      const q = 60 / bpm;
      const s16 = q / 4;
      for (let i = 0; i < 32; i++) {
        const tt = t + i * s16;
        const acc = i % 4 === 0;
        noiseHit(rig, out, tt, { type: 'bandpass', freq: acc ? 2600 : 3400, q: 3, peak: acc ? 0.12 : 0.06, decay: 0.02 });
      }
      for (let b = 0; b < 8; b += 2) tone(rig, out, t + b * q, { freq: 98, freqEnd: 70, glide: 0.2, peak: 0.16, decay: 0.45 });
      const send = gain(ctx, 0.4, rig.send.music);
      const m = gain(ctx, 1, out);
      m.connect(send);
      [76, 74, 72, 71].forEach((n, k) => bell(rig, m, t + 4 * q + k * q, { freq: mtof(n), ratio: 1, index: 1.4, peak: 0.08, decay: 1.4 }));
      pad(rig, m, t + 8 * q, [57, 60, 64, 71], { peak: 0.02, attack: 0.1, hold: 0.8, release: 2.4, lp: 1500 });
      tone(rig, m, t + 8 * q, { freq: 55, peak: 0.12, attack: 0.02, decay: 2 });
      end = t + 8 * q + 3.5;
      rig.clock.at(end + 0.2, () => {
        try {
          m.disconnect();
        } catch {
          /* noop */
        }
      });
      break;
    }
  }

  let stopped = false;
  const stopAll = (fade: number): void => {
    if (stopped) return;
    stopped = true;
    const now = rig.clock.now;
    for (const c of cancels) c();
    fadeOut(out.gain, now, fade);
    for (const s of stops) s(now + fade + 0.05);
    rig.clock.at(now + fade + 3.5, () => {
      for (const n of [out, ...body.nodes]) {
        try {
          n.disconnect();
        } catch {
          /* noop */
        }
      }
    });
  };
  return {
    kind,
    end,
    stop: () => stopAll(kind === 'gameover' || kind === 'jornal' ? 0.6 : 1.2),
  };
}
