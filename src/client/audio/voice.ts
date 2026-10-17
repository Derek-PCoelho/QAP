// =============================================================================
// QAP — Emergency Dispatch — áudio · síntese de voz por formantes (balbucio)
// Fonte glotal (onda periódica) + ruído → 3 filtros passa-banda (F1–F3) cujas
// frequências seguem a vogal de cada sílaba. Um ConstantSource serve de
// envelope compartilhado entre o vozeamento e a soprosidade.
// =============================================================================
import { every, type Rig } from './core';
import { bufSrc, cleanup, fadeOut, filt, gain, mulberry32, osc, oscWave, rr, shaper, stopSafe, type Rand } from './dsp';
import {
  buildPlan,
  FORMANTS,
  randomRaw,
  vowelFormants,
  type BeepSeg,
  type BreathSeg,
  type Onset,
  type Plan,
  type SylSeg,
  type VoiceSpec,
  type Vowel,
} from './speech';

type F3 = [number, number, number];

/** Formantes de consoantes vozeadas/nasais (adulto masculino). */
const CONS_FMT: Partial<Record<Onset, F3>> = {
  n: [280, 1250, 2500],
  l: [360, 1150, 2600],
  b: [250, 1100, 2400],
  v: [300, 1300, 2500],
  z: [300, 1600, 2600],
  j: [300, 1800, 2600],
  dj: [280, 1900, 2700],
};

/** Ruído de fricativas/plosivas: [freq, Q, nível]. */
const FRIC: Partial<Record<Onset, F3>> = {
  p: [2800, 0.8, 0.55],
  b: [2000, 0.8, 0.25],
  f: [4200, 0.5, 0.2],
  v: [4000, 0.5, 0.1],
  s: [6200, 1.6, 0.34],
  z: [6000, 1.6, 0.18],
  x: [3000, 1.3, 0.36],
  j: [3000, 1.3, 0.2],
  tch: [3200, 1.3, 0.36],
  dj: [3100, 1.3, 0.2],
};
/** Amplitudes relativas de F1–F3 por vogal (síntese paralela, à la Klatt). */
const VOWEL_AMP: Record<Vowel, F3> = {
  a: [1, 0.7, 0.3],
  E: [1, 0.8, 0.35],
  e: [0.9, 0.95, 0.45],
  i: [0.6, 1.25, 0.7],
  O: [1, 0.6, 0.2],
  o: [1, 0.5, 0.15],
  u: [1, 0.38, 0.1],
};
const CONS_AMP: Partial<Record<Onset, F3>> = {
  n: [1, 0.22, 0.08],
  l: [1, 0.5, 0.25],
  b: [1, 0.3, 0.1],
  v: [0.8, 0.4, 0.2],
  z: [0.8, 0.4, 0.2],
  j: [0.8, 0.45, 0.2],
  dj: [0.8, 0.45, 0.2],
};
const BREATH_AMP: F3 = [1, 0.8, 0.45];
const VOICED_ONSET = new Set<Onset>(['b', 'v', 'z', 'j', 'n', 'l', 'dj']);
const PLOSIVE = new Set<Onset>(['p', 'b']);
const AFFRICATE = new Set<Onset>(['tch', 'dj']);

/**
 * Um "trato vocal" persistente. Pode falar várias sílabas/frases em sequência
 * (as automações são agendadas em ordem cronológica).
 */
export class Speaker {
  readonly out: GainNode;
  private o: OscillatorNode;
  private env: ConstantSourceNode;
  private aspX: GainNode;
  private fric: GainNode;
  private fricF: BiquadFilterNode;
  private F: BiquadFilterNode[] = [];
  private FG: GainNode[] = [];
  private srcs: AudioScheduledSourceNode[] = [];
  private envV = 0;
  private envT = 0;
  private stopped = false;
  /** fim natural agendado (tempo de áudio) */
  endAt = Infinity;

  constructor(
    private rig: Rig,
    dest: AudioNode,
    readonly spec: VoiceSpec,
    t0: number,
    private r: Rand,
  ) {
    const ctx = rig.ctx;
    const nodes: AudioNode[] = [];
    const norm = Math.sqrt(110 / Math.max(60, spec.f0));
    this.out = gain(ctx, spec.level * norm * 1.5, dest);
    if (spec.verb > 0) this.out.connect(gain(ctx, spec.verb, rig.send.voice));
    const tone = filt(ctx, 'lowpass', 6800 - 4000 * spec.warm, 0.6, 0, this.out);
    nodes.push(this.out, tone);
    let pre: AudioNode = tone;
    if (spec.drive > 0) {
      const sh = shaper(ctx, spec.drive, tone);
      nodes.push(sh);
      pre = sh;
    }
    let sum: AudioNode = pre;
    if (spec.trem > 0) {
      const tg = gain(ctx, 1 - spec.trem * 0.5, pre);
      const lfo = osc(ctx, 'sine', spec.tremRate);
      const lg = gain(ctx, spec.trem * 0.5);
      lfo.connect(lg).connect(tg.gain);
      this.srcs.push(lfo);
      nodes.push(tg, lg);
      sum = tg;
    }
    // banco de formantes (paralelo)
    const fg = [1, 0.62, 0.3];
    const fq = [6, 8, 10];
    for (let i = 0; i < 3; i++) {
      const g = gain(ctx, fg[i], sum);
      const f = filt(ctx, 'bandpass', FORMANTS.a[i] * spec.fmt, fq[i], 0, g);
      this.F.push(f);
      this.FG.push(g);
      nodes.push(g, f);
    }
    // fonte vozeada
    this.o = oscWave(ctx, rig.banks.glottal(spec.tilt), spec.f0);
    const voiced = gain(ctx, 0);
    this.o.connect(voiced);
    let vOut: AudioNode = voiced;
    nodes.push(voiced);
    if (spec.rasp > 0) {
      // aspereza: modulação de amplitude por ruído grave
      const rg = gain(ctx, 1);
      voiced.connect(rg);
      const rn = bufSrc(ctx, rig.banks.noise('white'), true);
      const rl = filt(ctx, 'lowpass', 110, 0.7);
      const rgn = gain(ctx, spec.rasp * 6);
      rn.connect(rl).connect(rgn).connect(rg.gain);
      this.srcs.push(rn);
      nodes.push(rg, rl, rgn);
      vOut = rg;
    }
    for (const f of this.F) vOut.connect(f);
    // ruído: soprosidade (segue o envelope), aspiração livre e fricativas
    const noise = bufSrc(ctx, rig.banks.noise('white'), true);
    const asp = gain(ctx, 0);
    noise.connect(asp);
    for (const f of this.F) asp.connect(f);
    this.aspX = gain(ctx, 0);
    noise.connect(this.aspX);
    for (const f of this.F) this.aspX.connect(f);
    this.fricF = filt(ctx, 'bandpass', 5000, 1.2);
    this.fric = gain(ctx, 0);
    noise.connect(this.fricF).connect(this.fric).connect(pre);
    nodes.push(asp, this.aspX, this.fricF, this.fric);
    // envelope compartilhado
    this.env = ctx.createConstantSource();
    this.env.offset.value = 0;
    const vs = gain(ctx, 1 - spec.whisper);
    const as = gain(ctx, (spec.breath + spec.whisper * 1.25) * 3.2);
    this.env.connect(vs).connect(voiced.gain);
    this.env.connect(as).connect(asp.gain);
    nodes.push(vs, as);
    // vibrato
    if (spec.vibDepth > 0) {
      const lfo = osc(ctx, 'sine', spec.vib);
      const lg = gain(ctx, spec.vibDepth);
      lfo.connect(lg).connect(this.o.detune);
      this.srcs.push(lfo);
      nodes.push(lg);
    }
    this.srcs.push(this.o, noise, this.env);
    const off = r() * 4;
    for (const s of this.srcs) {
      if (s === noise) noise.start(t0, off);
      else s.start(t0);
    }
    this.envT = t0;
    this.env.offset.setValueAtTime(0, t0);
    cleanup(this.o, ...nodes, this.env, noise);
  }

  private envTo(v: number, t: number): void {
    if (t <= this.envT) t = this.envT + 0.001;
    this.env.offset.linearRampToValueAtTime(v, t);
    this.envV = v;
    this.envT = t;
  }

  private envHold(t: number): void {
    if (t > this.envT) {
      this.env.offset.setValueAtTime(this.envV, t);
      this.envT = t;
    }
  }

  private setF(t: number, f: F3, tc: number): void {
    for (let i = 0; i < 3; i++) this.F[i].frequency.setTargetAtTime(f[i], t, tc);
  }

  private setA(t: number, a: F3, tc: number): void {
    for (let i = 0; i < 3; i++) this.FG[i].gain.setTargetAtTime(a[i], t, tc);
  }

  private scaleF(f: F3): F3 {
    const k = this.spec.fmt;
    return [f[0] * k, f[1] * k, f[2] * k];
  }

  /** Agenda uma sílaba (s.t relativo a t0). */
  syl(t0: number, s: SylSeg): void {
    if (this.stopped) return;
    const sp = this.spec;
    const ts = t0 + s.t;
    const D = s.dur;
    const vStart = ts + s.onsetDur;
    const vEnd = Math.max(vStart + 0.03, ts + D - s.gap - s.codaDur);
    const amp = s.amp;

    // pitch
    const tcP = 0.02 + sp.slur * 0.07;
    const k = s.crack ? 1.7 : 1;
    this.o.frequency.setTargetAtTime(s.f0 * k, ts, tcP);
    if (s.f0End !== s.f0) this.o.frequency.setTargetAtTime(s.f0End * k, vStart + (vEnd - vStart) * 0.45, tcP * 2 + 0.03);
    if (sp.jitter > 0) {
      const n = Math.max(2, Math.round(D / 0.045));
      for (let i = 0; i < n; i++) this.o.detune.setTargetAtTime((this.r() * 2 - 1) * sp.jitter, ts + (i * D) / n, 0.012);
    }

    // formantes
    const V = vowelFormants(s.v, sp, s.stress, s.nasal);
    const cf = CONS_FMT[s.onset];
    const tcV = 0.012 + sp.slur * 0.03;
    if (cf && s.onsetDur > 0) {
      this.setF(ts, this.scaleF(cf), 0.006);
      this.setA(ts, CONS_AMP[s.onset] ?? VOWEL_AMP.a, 0.006);
    } else if (s.onset === 'h') {
      this.setF(ts, V, 0.006);
      this.setA(ts, VOWEL_AMP[s.v], 0.006);
    }
    this.setF(vStart, V, tcV);
    this.setA(vStart, VOWEL_AMP[s.v], tcV);
    if (s.v2) {
      const tg = vStart + (vEnd - vStart) * 0.55;
      this.setF(tg, vowelFormants(s.v2, sp, false, s.nasal), 0.03);
      this.setA(tg, VOWEL_AMP[s.v2], 0.03);
    }
    if (s.coda === 'n') this.setF(vEnd - 0.03, [260 * sp.fmt, V[1] * 0.9, V[2]], 0.02);

    // envelope vozeado
    if (s.onset && !VOICED_ONSET.has(s.onset)) {
      this.envTo(0, Math.max(ts, this.envT) + 0.012);
      this.envHold(vStart);
    } else if (VOICED_ONSET.has(s.onset)) {
      this.envTo(amp * 0.28, Math.max(ts, this.envT) + 0.015);
      this.envHold(vStart);
    } else if (this.envV === 0) {
      this.envHold(vStart);
    }
    const atk = sp.reverse ? (vEnd - vStart) * 0.75 : 0.014;
    const rel = sp.reverse ? 0.02 : 0.035;
    this.envTo(amp, vStart + atk);
    this.envHold(Math.max(vStart + atk, vEnd - rel));
    this.envTo(s.legato && !sp.reverse ? amp * 0.5 : 0, vEnd);

    // ruídos (fricativas, explosões, aspiração)
    const fr = FRIC[s.onset];
    const fp = this.fric.gain;
    if (fr && s.onsetDur > 0) {
      const fq = Math.sqrt(sp.fmt);
      this.fricF.frequency.setValueAtTime(fr[0] * fq, ts);
      this.fricF.Q.setValueAtTime(fr[1], ts);
      const lvl = fr[2] * amp * (sp.whisper > 0.5 ? 1.4 : 1);
      if (PLOSIVE.has(s.onset)) {
        const tb = Math.max(ts + 0.005, vStart - 0.014);
        fp.setValueAtTime(0, tb);
        fp.linearRampToValueAtTime(lvl, tb + 0.003);
        fp.linearRampToValueAtTime(0, tb + 0.016);
      } else if (AFFRICATE.has(s.onset)) {
        const tb = ts + s.onsetDur * 0.4;
        fp.setValueAtTime(0, tb);
        fp.linearRampToValueAtTime(lvl, tb + 0.008);
        fp.setValueAtTime(lvl, Math.max(tb + 0.008, vStart - 0.012));
        fp.linearRampToValueAtTime(0, Math.max(tb + 0.012, vStart + 0.004));
      } else {
        fp.setValueAtTime(0, ts);
        fp.linearRampToValueAtTime(lvl, ts + s.onsetDur * 0.35);
        fp.setValueAtTime(lvl, Math.max(ts + s.onsetDur * 0.35, vStart - 0.015));
        fp.linearRampToValueAtTime(0, vStart + 0.005);
      }
    }
    const ap = this.aspX.gain;
    if (s.onset === 'h') {
      ap.setValueAtTime(0, ts);
      ap.linearRampToValueAtTime(0.9 * amp, ts + s.onsetDur * 0.4);
      ap.linearRampToValueAtTime(0, vStart + 0.02);
    }
    if (s.coda === 's' && s.codaDur > 0) {
      this.fricF.frequency.setValueAtTime(6000 * Math.sqrt(sp.fmt), vEnd - 0.01);
      this.fricF.Q.setValueAtTime(1.6, vEnd - 0.01);
      fp.setValueAtTime(0, vEnd - 0.01);
      fp.linearRampToValueAtTime(0.24 * amp, vEnd + s.codaDur * 0.4);
      fp.linearRampToValueAtTime(0, vEnd + s.codaDur);
    } else if (s.coda === 'r' && s.codaDur > 0) {
      ap.setValueAtTime(0, vEnd - 0.01);
      ap.linearRampToValueAtTime(0.5 * amp, vEnd + s.codaDur * 0.4);
      ap.linearRampToValueAtTime(0, vEnd + s.codaDur);
    }
  }

  /** Respiração (inspiração/expiração) sem vozeamento. */
  breath(t0: number, b: BreathSeg): void {
    if (this.stopped) return;
    const ts = t0 + b.t;
    const d = b.dur;
    this.envTo(0, Math.max(ts, this.envT) + 0.01);
    this.envHold(ts + d);
    this.setF(ts, this.scaleF(b.inhale ? [550, 1700, 2600] : [650, 1250, 2450]), 0.01);
    this.setA(ts, BREATH_AMP, 0.01);
    const ap = this.aspX.gain;
    ap.setValueAtTime(0, ts);
    ap.linearRampToValueAtTime(b.amp * 0.85, ts + d * (b.inhale ? 0.7 : 0.25));
    ap.linearRampToValueAtTime(0, ts + d);
    if (b.inhale) {
      this.fricF.frequency.setValueAtTime(2600, ts);
      this.fricF.Q.setValueAtTime(0.7, ts);
      const fp = this.fric.gain;
      fp.setValueAtTime(0, ts);
      fp.linearRampToValueAtTime(0.06 * b.amp, ts + d * 0.7);
      fp.linearRampToValueAtTime(0, ts + d);
    }
  }

  /**
   * "Piii" da censura (1.1): a voz cala e entra um tom senoidal puro (~1 kHz) com envelope curto
   * (5 ms de ataque e de soltura, sem clique). Sai pelo mesmo destino da voz (passa pela linha
   * telefônica e soa "de TV"), num nível fixo que não depende do perfil (grito, sussurro).
   */
  beep(t0: number, b: BeepSeg): void {
    if (this.stopped) return;
    const ctx = this.rig.ctx;
    const ts = Math.max(t0 + b.t, ctx.currentTime + 0.005);
    const end = ts + Math.max(0.05, b.dur);
    // a voz não fala por baixo do bipe
    this.envTo(0, Math.max(ts, this.envT) + 0.008);
    this.envHold(end);
    const norm = Math.sqrt(110 / Math.max(60, this.spec.f0));
    const lvl = (0.32 * b.amp) / Math.max(0.05, this.spec.level * norm * 1.5);
    const g = gain(ctx, 0, this.out);
    const o = osc(ctx, 'sine', b.f, g);
    g.gain.setValueAtTime(0, ts);
    g.gain.linearRampToValueAtTime(lvl, ts + 0.005);
    g.gain.setValueAtTime(lvl, end - 0.005);
    g.gain.linearRampToValueAtTime(0, end);
    o.start(ts);
    o.stop(end + 0.02);
    this.srcs.push(o);
    cleanup(o, g);
  }

  /** Agenda um plano inteiro a partir de t0. */
  play(t0: number, plan: Plan): void {
    for (const s of plan.segs) {
      if (s.kind === 'syl') this.syl(t0, s);
      else if (s.kind === 'beep') this.beep(t0, s);
      else this.breath(t0, s);
    }
  }

  /** Fim natural: silencia e libera as fontes depois de tEnd. */
  finish(tEnd: number): void {
    if (this.stopped) return;
    this.envTo(0, Math.max(tEnd, this.envT + 0.01));
    this.endAt = tEnd + 0.12;
    for (const s of this.srcs) stopSafe(s, this.endAt);
  }

  /** Corte com fade curto. */
  stop(t: number, fade = 0.06): void {
    if (this.stopped) return;
    this.stopped = true;
    fadeOut(this.out.gain, t, fade);
    this.endAt = Math.min(this.endAt, t + fade + 0.03);
    for (const s of this.srcs) stopSafe(s, t + fade + 0.03);
  }

  get alive(): boolean {
    return !this.stopped && this.rig.ctx.currentTime < this.endAt;
  }
}

/** Fala completa de um plano (uma fonte, liberada ao fim). */
export function utter(rig: Rig, dest: AudioNode, t0: number, spec: VoiceSpec, plan: Plan, r: Rand): Speaker {
  const sp = new Speaker(rig, dest, spec, t0, r);
  sp.play(t0, plan);
  sp.finish(t0 + plan.dur + 0.04);
  return sp;
}

/**
 * Balbucio contínuo de fundo (TV, rádio AM, multidão…). Frases aleatórias
 * separadas por pausas, agendadas pelo relógio.
 */
export function babbleBed(
  rig: Rig,
  dest: AudioNode,
  t0: number,
  spec: VoiceSpec,
  seed: number,
  opts: { words?: [number, number]; pause?: [number, number] } = {},
): { stop(t: number): void } {
  const r = mulberry32(seed);
  const sp = new Speaker(rig, dest, spec, t0, r);
  const [wMin, wMax] = opts.words ?? [2, 7];
  const [pMin, pMax] = opts.pause ?? [0.2, 0.9];
  let next = t0 + rr(r, 0, 0.4);
  const cancel = every(
    rig.clock,
    t0,
    () => 0.25,
    (t) => {
      // agenda frases inteiras quando a próxima começaria em breve
      let guard = 0;
      while (next < t + 0.5 && guard++ < 4) {
        const plan = buildPlan(randomRaw(r, Math.round(rr(r, wMin, wMax))), spec, r, 30);
        sp.play(next, plan);
        next += plan.dur + rr(r, pMin, pMax);
      }
    },
  );
  return {
    stop(t: number) {
      cancel();
      sp.stop(t, 0.3);
    },
  };
}
