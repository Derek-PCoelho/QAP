// =============================================================================
// QAP — Emergency Dispatch — áudio · ambientes das ligações (ouvidos pela linha telefônica)
// Cada camada é construída com ruídos compartilhados + osciladores + eventos
// aleatórios agendados pelo relógio. Tudo é discreto: fica por baixo da voz.
// =============================================================================
import type { AmbientId } from '../../engine/types';
import { every, type Rig } from './core';
import { bufSrc, cleanup, clamp, fadeOut, filt, gain, hashStr, mtof, mulberry32, osc, pick, rr, stopSafe, type NoiseColor, type Rand } from './dsp';
import { bell, noiseBed, noiseHit, pluck, tone } from './kit';
import { buildPlan, specFor, type Onset, type RawSyl, type Vowel, type VoiceSpec } from './speech';
import { babbleBed, utter } from './voice';

export const AMBIENT_IDS: readonly AmbientId[] = [
  'tv', 'chuva', 'festa', 'choro', 'silencio', 'chuveiro', 'rua', 'risadas', 'radio_am', 'passaros', 'cachorro', 'ventilador',
  'buzinas', 'sirene', 'respiracao', 'videogame', 'gemidos', 'multidao', 'vento', 'agua', 'cozinha', 'bar', 'igreja', 'escola',
  'maquina', 'tiros', 'gritos', 'bebe', 'desenho', 'onibus', 'academia', 'musica',
];

const FADE = 0.8;
const levelFor = (intensity: number): number => 0.4 + 0.75 * clamp(intensity, 0, 1);

/** Kit de construção de uma camada. */
export class Layer {
  readonly fade: GainNode;
  readonly out: GainNode;
  readonly r: Rand;
  readonly t: number;
  private stops: ((t: number) => void)[] = [];
  private cancels: (() => void)[] = [];
  private disposed = false;

  constructor(
    readonly rig: Rig,
    readonly id: AmbientId,
    public intensity: number,
    seed: number,
  ) {
    const ctx = rig.ctx;
    this.t = rig.clock.now + 0.03;
    this.r = mulberry32(seed);
    this.fade = gain(ctx, 0, rig.in.ambient);
    this.out = gain(ctx, 1, this.fade);
    this.fade.gain.setValueAtTime(0, this.t);
    this.fade.gain.linearRampToValueAtTime(levelFor(intensity), this.t + FADE);
  }

  /** envio de reverb (dentro da linha) */
  get send(): AudioNode {
    return this.rig.send.ambient;
  }

  setIntensity(x: number): void {
    this.intensity = clamp(x, 0, 1);
    const p = this.fade.gain;
    const now = this.rig.clock.now;
    p.cancelScheduledValues(now);
    p.setTargetAtTime(levelFor(this.intensity), now, 0.25);
  }

  /** leito de ruído contínuo */
  bed(o: { color?: NoiseColor; type?: BiquadFilterType; freq?: number; q?: number; level: number; buffer?: AudioBuffer; rate?: number; dest?: AudioNode }) {
    const b = noiseBed(this.rig, o.dest ?? this.out, this.t, { ...o, fade: 0.3 });
    this.stops.push((t) => b.stop(t));
    return b;
  }

  /** oscilador contínuo (registrado para parar) */
  osc(type: OscillatorType, freq: number, dest: AudioNode): OscillatorNode {
    const o = osc(this.rig.ctx, type, freq, dest);
    o.start(this.t);
    this.src(o);
    return o;
  }

  /** LFO → parâmetro */
  lfo(freq: number, depth: number, target: AudioParam, type: OscillatorType = 'sine'): OscillatorNode {
    const g = gain(this.rig.ctx, depth);
    g.connect(target);
    const o = this.osc(type, freq, g);
    cleanup(o, g);
    return o;
  }

  src(s: AudioScheduledSourceNode): void {
    this.stops.push((t) => stopSafe(s, t));
  }

  hold(s: { stop(t: number): void }): void {
    this.stops.push((t) => s.stop(t));
  }

  /** eventos aleatórios; o intervalo encolhe com a intensidade (scale=false desliga) */
  events(min: number, max: number, fn: (t: number, i: number) => void, first = 0.3, scale = true): void {
    const r = this.r;
    const c = every(this.rig.clock, this.t + first, () => rr(r, min, max) / (scale ? 0.6 + this.intensity : 1), fn);
    this.cancels.push(c);
  }

  /** eventos periódicos com período fixo */
  periodic(period: number, fn: (t: number, i: number) => void, first = 0.05): void {
    const c = every(this.rig.clock, this.t + first, () => period, fn);
    this.cancels.push(c);
  }

  /** encadeia eventos sem sobreposição: fn devolve a duração; depois espera gap() */
  chain(fn: (t: number) => number, gap: () => number, first = 0.3): void {
    let next = this.t + first;
    const c = every(this.rig.clock, this.t + first, () => 0.1, (t) => {
      if (t + 0.1 < next) return;
      const at = Math.max(next, t);
      next = at + Math.max(0.05, fn(at)) + Math.max(0, gap());
    });
    this.cancels.push(c);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const now = this.rig.clock.now;
    for (const c of this.cancels) c();
    fadeOut(this.fade.gain, now, FADE);
    for (const s of this.stops) s(now + FADE + 0.05);
    const fade = this.fade;
    this.rig.clock.at(now + FADE + 0.3, () => {
      try {
        fade.disconnect();
      } catch {
        /* noop */
      }
    });
  }
}

// -----------------------------------------------------------------------------
// Peças reutilizáveis
// -----------------------------------------------------------------------------
/** "Parede": abafador (som vindo de outro cômodo / alto-falante de TV). */
function wall(L: Layer, lp: number, hp = 120): AudioNode {
  const ctx = L.rig.ctx;
  const h = filt(ctx, 'highpass', hp, 0.7);
  const l = filt(ctx, 'lowpass', lp, 0.7, 0, L.out);
  h.connect(l);
  return h;
}

/** Voz de fundo com perfil anônimo. */
function anon(base: Parameters<typeof specFor>[0], style?: Parameters<typeof specFor>[1], o: Partial<VoiceSpec> = {}): VoiceSpec {
  return specFor(base, style, 1, { channel: 'phone', verb: 0, ...o });
}

/** Frase curta de sílabas escolhidas (choro, gemido, grito, bebê). */
function cry(L: Layer, dest: AudioNode, t: number, spec: VoiceSpec, n: number, vowels: Vowel[], onsets: Onset[], rate: number): number {
  const r = L.r;
  const list: RawSyl[] = [];
  for (let i = 0; i < n; i++) {
    list.push({ onset: pick(r, onsets), v: pick(r, vowels), nasal: false, coda: '', stress: i === 0 || r() < 0.4, wordStart: true, wordEnd: true, caps: false, punct: i === n - 1 ? '.' : '' });
  }
  const sp = { ...spec, rate };
  const plan = buildPlan(list, sp, r, 8);
  utter(L.rig, dest, t, sp, plan, r);
  return plan.dur;
}

/** Risada de plateia (TV) ou de grupo: muitos "ha" de ruído formântico. */
function crowdLaugh(L: Layer, dest: AudioNode, t: number, size: number, dur: number, peak: number): void {
  const r = L.r;
  const n = Math.round(size * dur * 7);
  for (let i = 0; i < n; i++) {
    const u = r();
    const tt = t + u * dur;
    const env = Math.sin(Math.PI * Math.min(1, u * 1.15)) * peak;
    noiseHit(L.rig, dest, tt, { type: 'bandpass', freq: rr(r, 650, 1400), q: rr(r, 2, 4), peak: env * rr(r, 0.5, 1), attack: 0.012, decay: rr(r, 0.06, 0.1) });
  }
  noiseHit(L.rig, dest, t, { type: 'bandpass', color: 'pink', freq: 900, q: 0.7, peak: peak * 0.5, attack: dur * 0.3, decay: dur * 0.8 });
}

function horn(L: Layer, t: number, long: boolean, dest: AudioNode): void {
  const r = L.r;
  const f = rr(r, 330, 470);
  const d = long ? rr(r, 0.5, 0.9) : rr(r, 0.15, 0.28);
  for (const k of [1, 1.26]) tone(L.rig, dest, t, { type: 'square', freq: f * k, peak: 0.035, attack: 0.01, hold: d, decay: 0.04, lp: 1600, linear: true });
  if (!long && r() < 0.4) for (const k of [1, 1.26]) tone(L.rig, dest, t + d + 0.12, { type: 'square', freq: f * k, peak: 0.035, attack: 0.01, hold: d, decay: 0.04, lp: 1600, linear: true });
}

function carPass(L: Layer, t: number, peak: number): void {
  const ctx = L.rig.ctx;
  const r = L.r;
  const d = rr(r, 2.2, 3.8);
  const src = bufSrc(ctx, L.rig.banks.noise('pink'), true);
  const bp = filt(ctx, 'bandpass', 450, 0.9);
  const g = gain(ctx, 0, L.out);
  src.connect(bp).connect(g);
  bp.frequency.setValueAtTime(450, t);
  bp.frequency.linearRampToValueAtTime(rr(r, 1000, 1400), t + d * 0.5);
  bp.frequency.linearRampToValueAtTime(500, t + d);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + d * 0.5);
  g.gain.linearRampToValueAtTime(0, t + d);
  src.start(t, r() * 4);
  src.stop(t + d + 0.05);
  cleanup(src, bp, g);
}

function moto(L: Layer, t: number): void {
  const ctx = L.rig.ctx;
  const r = L.r;
  const d = rr(r, 2, 3.2);
  const s = osc(ctx, 'sawtooth', 130);
  const bp = filt(ctx, 'bandpass', 1100, 1.5);
  const g = gain(ctx, 0, L.out);
  s.connect(bp).connect(g);
  s.frequency.setValueAtTime(rr(r, 110, 140), t);
  s.frequency.linearRampToValueAtTime(rr(r, 170, 210), t + d * 0.6);
  s.frequency.linearRampToValueAtTime(rr(r, 120, 150), t + d);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.05, t + d * 0.5);
  g.gain.linearRampToValueAtTime(0, t + d);
  s.start(t);
  s.stop(t + d + 0.02);
  cleanup(s, bp, g);
}

function bark(L: Layer, t: number, dest: AudioNode, k: number): void {
  const ctx = L.rig.ctx;
  const s = osc(ctx, 'sawtooth', 430 * k);
  const f1 = filt(ctx, 'bandpass', 900 * k, 1.5);
  const f2 = filt(ctx, 'bandpass', 1650 * k, 3);
  const g = gain(ctx, 0, dest);
  s.connect(f1).connect(g);
  s.connect(f2).connect(g);
  s.frequency.setValueAtTime(430 * k, t);
  s.frequency.exponentialRampToValueAtTime(250 * k, t + 0.1);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.5, t + 0.006);
  g.gain.setTargetAtTime(0, t + 0.03, 0.035);
  s.start(t);
  s.stop(t + 0.2);
  cleanup(s, f1, f2, g);
  noiseHit(L.rig, dest, t, { type: 'bandpass', freq: 1200 * k, q: 1, peak: 0.18, decay: 0.08 });
}

function clink(L: Layer, t: number, dest: AudioNode, peak: number): void {
  const r = L.r;
  const f = rr(r, 2000, 4200);
  tone(L.rig, dest, t, { freq: f, peak, decay: rr(r, 0.2, 0.45) });
  tone(L.rig, dest, t, { freq: f * 2.32, peak: peak * 0.5, decay: 0.15 });
  noiseHit(L.rig, dest, t, { type: 'highpass', freq: 4000, peak: peak * 0.6, decay: 0.008 });
}

function murmur(L: Layer, level: number, freq = 750): void {
  const b = L.bed({ color: 'pink', type: 'bandpass', freq, q: 0.6, level });
  L.lfo(rr(L.r, 0.2, 0.4), level * 0.35, b.g.gain);
  L.lfo(rr(L.r, 1.7, 2.6), level * 0.2, b.g.gain);
}

function babble(L: Layer, dest: AudioNode, spec: VoiceSpec, words: [number, number] = [2, 7], pause: [number, number] = [0.2, 0.9]): void {
  L.hold(babbleBed(L.rig, dest, L.t + rr(L.r, 0, 0.6), spec, hashStr(L.id) + Math.floor(L.r() * 1e6), { words, pause }));
}

/** Sequenciador simples de bateria/baixo abafados (festa, academia, música). */
function beat(L: Layer, bpm: number, dest: AudioNode, o: { kick?: boolean; hat?: boolean; snare?: boolean; bass?: number[]; bassType?: OscillatorType }): void {
  const step = 60 / bpm / 2; // colcheias
  const rig = L.rig;
  L.periodic(step, (t, i) => {
    const s = i % 8;
    if (o.kick && s % 2 === 0) {
      tone(rig, dest, t, { freq: 120, freqEnd: 55, glide: 0.08, peak: 0.55, attack: 0.002, decay: 0.16 });
      noiseHit(rig, dest, t, { type: 'lowpass', freq: 600, peak: 0.12, decay: 0.02 });
    }
    if (o.snare && (s === 2 || s === 6)) noiseHit(rig, dest, t, { type: 'bandpass', freq: 1800, q: 0.7, peak: 0.18, decay: 0.12 });
    if (o.hat && s % 2 === 1) noiseHit(rig, dest, t, { type: 'highpass', freq: 6000, peak: 0.06, decay: 0.03 });
    if (o.bass && s % 2 === 1) {
      const bar = Math.floor(i / 8) % o.bass.length;
      tone(rig, dest, t, { type: o.bassType ?? 'triangle', freq: o.bass[bar], peak: 0.3, attack: 0.005, hold: step * 0.6, decay: 0.08, lp: 900 });
    }
  });
}

/** Acordes dedilhados de violão (bar, música). */
function strums(L: Layer, bpm: number, dest: AudioNode, chords: number[][], every8: number[], vel: number): void {
  const step = 60 / bpm / 2;
  const r = L.r;
  L.periodic(step, (t, i) => {
    const s = i % 8;
    if (!every8.includes(s)) return;
    const chord = chords[Math.floor(i / 8) % chords.length];
    const down = s % 2 === 0;
    const notes = down ? chord : [...chord].reverse();
    notes.forEach((m, k) => pluck(L.rig, dest, t + k * 0.012 + rr(r, 0, 0.006), { midi: m, vel: vel * (down ? 1 : 0.7), bright: 1, dur: step * 3 }));
  });
}

function chirp(L: Layer, t: number, dest: AudioNode): void {
  const r = L.r;
  const kind = r();
  if (kind < 0.18) {
    // bem-te-vi: "bem-te-VI"
    const rig = L.rig;
    tone(rig, dest, t, { freq: 2200, freqEnd: 2350, glide: 0.1, peak: 0.05, attack: 0.01, hold: 0.08, decay: 0.03, linear: true });
    tone(rig, dest, t + 0.17, { freq: 2400, freqEnd: 2500, glide: 0.08, peak: 0.05, attack: 0.01, hold: 0.07, decay: 0.03, linear: true });
    tone(rig, dest, t + 0.33, { freq: 2850, freqEnd: 2250, glide: 0.3, peak: 0.06, attack: 0.02, hold: 0.22, decay: 0.05, linear: true });
  } else if (kind < 0.6) {
    const n = 2 + Math.floor(r() * 4);
    const f = rr(r, 2600, 3600);
    for (let i = 0; i < n; i++) tone(L.rig, dest, t + i * rr(r, 0.07, 0.11), { freq: f, freqEnd: f * rr(r, 1.3, 1.6), glide: 0.04, peak: 0.035, attack: 0.004, hold: 0.03, decay: 0.015, linear: true });
  } else if (kind < 0.85) {
    const ctx = L.rig.ctx;
    const c = osc(ctx, 'sine', rr(r, 3000, 3800));
    const am = osc(ctx, 'sine', rr(r, 22, 32));
    const ag = gain(ctx, 0.5);
    const g = gain(ctx, 0, dest);
    const amp = gain(ctx, 0.5);
    am.connect(ag).connect(amp.gain);
    c.connect(amp).connect(g);
    const d = rr(r, 0.35, 0.7);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.04);
    g.gain.linearRampToValueAtTime(0, t + d);
    c.start(t);
    am.start(t);
    c.stop(t + d + 0.02);
    am.stop(t + d + 0.02);
    cleanup(c, am, ag, g, amp);
  } else {
    const f = rr(r, 1800, 2600);
    tone(L.rig, dest, t, { freq: f * 1.3, freqEnd: f, glide: 0.15, peak: 0.04, attack: 0.01, hold: 0.1, decay: 0.05, linear: true });
  }
}

// -----------------------------------------------------------------------------
// Camadas
// -----------------------------------------------------------------------------
type Build = (L: Layer) => void;

const B: Record<AmbientId, Build> = {
  tv(L) {
    const spk = wall(L, 3000, 300);
    babble(L, spk, anon('homem', undefined, { level: 0.32, rate: 6.8, warm: 0.3 }), [3, 8], [0.15, 0.6]);
    babble(L, spk, anon('mulher', undefined, { level: 0.22, rate: 6.6 }), [2, 6], [0.8, 2.2]);
    L.events(6, 14, (t) => crowdLaugh(L, spk, t, 3, rr(L.r, 1, 2), 0.06), 3);
  },
  chuva(L) {
    L.bed({ color: 'pink', type: 'bandpass', freq: 2500, q: 0.4, level: 0.13 });
    L.bed({ buffer: L.rig.banks.drops(), type: 'highpass', freq: 900, level: 0.45 });
    L.bed({ color: 'brown', type: 'lowpass', freq: 420, level: 0.08 });
    L.events(0.4, 1.4, (t) => tone(L.rig, L.out, t, { freq: rr(L.r, 1200, 2200), freqEnd: rr(L.r, 2300, 2800), glide: 0.02, peak: 0.03, decay: 0.03 }));
    L.events(25, 60, (t) => noiseHit(L.rig, L.out, t, { color: 'brown', type: 'lowpass', freq: 220, peak: 0.3, attack: 0.8, hold: 0.6, decay: 2.5 }), 12, false);
  },
  festa(L) {
    murmur(L, 0.08, 800);
    babble(L, L.out, anon('jovem_m', undefined, { level: 0.18, rate: 7 }), [2, 5], [0.4, 1.4]);
    const w = wall(L, 520, 60);
    beat(L, 120, w, { kick: true, snare: true, bass: [110, 130.8, 98, 87.3], bassType: 'sawtooth' });
    L.events(8, 20, (t) => cry(L, L.out, t, anon('jovem_h', 'grito', { level: 0.25 }), 2, ['u', 'u', 'e'], ['h', ''], 3), 5);
    L.events(4, 10, (t) => clink(L, t, L.out, 0.03), 2);
  },
  choro(L) {
    const dest = wall(L, 2200, 200);
    const s = gain(L.rig.ctx, 0.25, L.send);
    dest.connect(s);
    L.chain(
      (t) => cry(L, dest, t, anon('mulher', 'choro', { level: 0.42 }), 2 + Math.floor(L.r() * 4), ['a', 'u', 'i', 'e'], ['h', '', 'n'], 2.6),
      () => rr(L.r, 1, 4) / (0.6 + L.intensity),
      0.4,
    );
    L.events(3, 7, (t) => noiseHit(L.rig, dest, t, { type: 'highpass', freq: 1800, peak: 0.05, attack: 0.08, decay: 0.12 }), 1.5, false);
  },
  silencio(L) {
    L.bed({ color: 'brown', type: 'lowpass', freq: 250, level: 0.035 });
    L.bed({ color: 'white', type: 'bandpass', freq: 2500, q: 0.5, level: 0.009 });
    L.periodic(1, (t, i) => noiseHit(L.rig, L.out, t, { type: 'bandpass', freq: i % 2 ? 2800 : 3500, q: 4, peak: 0.035, decay: 0.012 }), 0.5);
  },
  chuveiro(L) {
    const b = L.bed({ color: 'white', type: 'highpass', freq: 1500, level: 0.11 });
    L.lfo(0.4, 0.025, b.g.gain);
    L.bed({ color: 'pink', type: 'bandpass', freq: 800, q: 0.8, level: 0.05 });
    const s = gain(L.rig.ctx, 0.3, L.send);
    b.g.connect(s);
    L.events(1.5, 4, (t) => tone(L.rig, L.out, t, { freq: rr(L.r, 900, 1600), freqEnd: 2000, glide: 0.02, peak: 0.02, decay: 0.04 }));
  },
  rua(L) {
    L.bed({ color: 'brown', type: 'lowpass', freq: 320, level: 0.14 });
    L.bed({ color: 'pink', type: 'bandpass', freq: 600, q: 0.5, level: 0.025 });
    L.events(3, 9, (t) => carPass(L, t, 0.12), 0.8);
    L.events(9, 20, (t) => moto(L, t), 4);
    const hw = wall(L, 2400, 250);
    L.events(20, 50, (t) => horn(L, t, false, hw), 8, false);
  },
  risadas(L) {
    const r = L.r;
    L.bed({ color: 'brown', type: 'lowpass', freq: 300, level: 0.02 });
    L.events(2, 6, (t) => {
      const k = r();
      if (k < 0.55) cry(L, L.out, t, anon(pick(r, ['adolescente', 'jovem_m', 'menino'] as const), undefined, { level: 0.22, whisper: 0.55, breath: 0.4 }), 3 + Math.floor(r() * 4), ['i', 'e', 'i'], ['h', 'h', ''], 7.5);
      else if (k < 0.8) noiseHit(L.rig, L.out, t, { type: 'bandpass', freq: 800, q: 0.8, peak: 0.12, attack: 0.005, decay: 0.08 });
      else noiseHit(L.rig, L.out, t, { type: 'highpass', freq: 3000, peak: 0.07, attack: 0.05, hold: 0.25, decay: 0.1 });
    }, 0.6);
  },
  radio_am(L) {
    const am = wall(L, 2800, 500);
    babble(L, am, anon('homem', undefined, { level: 0.3, rate: 7.6, range: 0.24, drive: 0.3 }), [4, 10], [0.08, 0.35]);
    L.bed({ buffer: L.rig.banks.crackle(), type: 'bandpass', freq: 2000, q: 0.5, level: 0.14 });
    L.bed({ color: 'white', type: 'bandpass', freq: 2000, q: 0.3, level: 0.014 });
    const wh = L.osc('sine', 2400, gain(L.rig.ctx, 0.003, L.out));
    L.lfo(0.13, 40, wh.frequency);
  },
  passaros(L) {
    L.bed({ color: 'pink', type: 'bandpass', freq: 1500, q: 0.3, level: 0.014 });
    const dest = gain(L.rig.ctx, 1, L.out);
    const s = gain(L.rig.ctx, 0.2, L.send);
    dest.connect(s);
    L.events(0.3, 2.5, (t) => chirp(L, t, dest), 0.2);
  },
  cachorro(L) {
    const dest = wall(L, 2600, 200);
    const s = gain(L.rig.ctx, 0.25, L.send);
    dest.connect(s);
    const k = rr(L.r, 0.85, 1.2);
    L.events(3, 10, (t) => {
      const n = 1 + Math.floor(L.r() * 4);
      for (let i = 0; i < n; i++) bark(L, t + i * rr(L.r, 0.28, 0.45), dest, k * rr(L.r, 0.96, 1.04));
    }, 0.5);
  },
  ventilador(L) {
    const b = L.bed({ color: 'pink', type: 'bandpass', freq: 900, q: 0.5, level: 0.08 });
    L.lfo(0.08, 300, b.f.frequency);
    L.lfo(0.08, 0.025, b.g.gain);
    L.lfo(14, 0.008, b.g.gain);
    const hum = gain(L.rig.ctx, 0.01, L.out);
    L.osc('sine', 240, hum);
    L.osc('sine', 360, gain(L.rig.ctx, 0.5, hum));
  },
  buzinas(L) {
    L.bed({ color: 'brown', type: 'lowpass', freq: 320, level: 0.13 });
    L.bed({ color: 'pink', type: 'bandpass', freq: 650, q: 0.5, level: 0.03 });
    const hw = wall(L, 2400, 250);
    L.events(2, 6, (t) => horn(L, t, L.r() < 0.25, hw), 0.4);
    L.events(6, 14, (t) => moto(L, t), 2);
  },
  sirene(L) {
    const ctx = L.rig.ctx;
    const g = gain(ctx, 0.05, wall(L, 1800, 300));
    const s = gain(ctx, 0.4, L.send);
    g.connect(s);
    const a = L.osc('sawtooth', 960, g);
    const b = L.osc('triangle', 960, g);
    L.periodic(0.5, (t, i) => {
      const f = i % 2 ? 770 : 960;
      a.frequency.setTargetAtTime(f, t, 0.02);
      b.frequency.setTargetAtTime(f, t, 0.02);
    });
    L.lfo(1 / rr(L.r, 14, 20), 0.035, g.gain);
  },
  respiracao(L) {
    const r = L.r;
    L.chain(
      (t) => {
        const c = (3.6 - 1.6 * L.intensity) * rr(r, 0.92, 1.08);
        noiseHit(L.rig, L.out, t, { type: 'bandpass', freq: 1100, freqEnd: 1700, q: 1.2, peak: 0.22, attack: c * 0.25, decay: c * 0.1 });
        noiseHit(L.rig, L.out, t + c * 0.4, { type: 'bandpass', freq: 1000, freqEnd: 600, q: 1, peak: 0.26, attack: 0.05, hold: c * 0.15, decay: c * 0.25 });
        return c;
      },
      () => 0,
      0.2,
    );
  },
  videogame(L) {
    const ctx = L.rig.ctx;
    const tv = wall(L, 3000, 200);
    const pulse = L.rig.banks.wave('pulse25', () => {
      const a: number[] = [];
      for (let n = 1; n <= 24; n++) a.push((2 / (n * Math.PI)) * Math.sin((n * Math.PI) / 4));
      return a;
    });
    const mel = [69, 72, 76, 72, 74, 72, 69, 67, 69, 72, 76, 79, 81, 79, 76, 74];
    const bass = [45, 45, 41, 43];
    const step = 60 / 140 / 2;
    const g = gain(ctx, 0.45, tv);
    L.periodic(step, (t, i) => {
      const m = mel[i % mel.length];
      if (i % 16 !== 15) tone(L.rig, g, t, { wave: pulse, freq: mtof(m), peak: 0.06, attack: 0.002, hold: step * 0.6, decay: 0.03, linear: true });
      if (i % 2 === 0) tone(L.rig, g, t, { type: 'triangle', freq: mtof(bass[Math.floor(i / 16) % 4]), peak: 0.12, attack: 0.002, hold: step * 0.8, decay: 0.03, linear: true });
      if (i % 4 === 2) noiseHit(L.rig, g, t, { type: 'highpass', freq: 5000, peak: 0.05, decay: 0.03 });
    });
  },
  gemidos(L) {
    const dest = wall(L, 2000, 150);
    L.chain(
      (t) => cry(L, dest, t, anon(pick(L.r, ['grave', 'homem', 'idoso'] as const), undefined, { level: 0.4, breath: 0.3, slur: 0.6 }), 1 + Math.floor(L.r() * 2), ['o', 'u', 'a'], ['h', 'n', ''], 1.6),
      () => rr(L.r, 2, 6) / (0.6 + L.intensity),
      0.6,
    );
  },
  multidao(L) {
    murmur(L, 0.11, 700);
    babble(L, L.out, anon('homem', undefined, { level: 0.16, rate: 7 }), [2, 5], [0.3, 1]);
    babble(L, L.out, anon('mulher', undefined, { level: 0.13, rate: 7 }), [2, 5], [0.5, 1.5]);
    L.events(6, 15, (t) => cry(L, L.out, t, anon(pick(L.r, ['homem', 'mulher'] as const), 'grito', { level: 0.2 }), 2 + Math.floor(L.r() * 3), ['a', 'e', 'o'], ['', 'h', 'l', 'p'], 5), 2);
  },
  vento(L) {
    const r = L.r;
    const b = L.bed({ color: 'pink', type: 'bandpass', freq: 600, q: 1.8, level: 0.12 });
    const w = L.bed({ color: 'white', type: 'bandpass', freq: 1800, q: 12, level: 0.03 });
    L.bed({ color: 'brown', type: 'lowpass', freq: 200, level: 0.06 });
    L.events(0.6, 2, (t) => {
      b.f.frequency.setTargetAtTime(rr(r, 300, 1200), t, 0.5);
      b.g.gain.setTargetAtTime(rr(r, 0.04, 0.2), t, 0.6);
      w.f.frequency.setTargetAtTime(rr(r, 1400, 2400), t, 0.7);
      w.g.gain.setTargetAtTime(rr(r, 0, 0.04), t, 0.8);
    }, 0.1, false);
  },
  agua(L) {
    L.bed({ buffer: L.rig.banks.bubbles(), type: 'highpass', freq: 200, level: 0.5 });
    L.bed({ color: 'pink', type: 'bandpass', freq: 1200, q: 0.6, level: 0.06 });
    L.bed({ color: 'brown', type: 'lowpass', freq: 500, level: 0.05 });
  },
  cozinha(L) {
    const r = L.r;
    L.bed({ buffer: L.rig.banks.crackle(), type: 'highpass', freq: 1500, level: 0.16, rate: 1.3 });
    L.bed({ color: 'white', type: 'highpass', freq: 3000, level: 0.012 });
    L.events(2, 6, (t) => clink(L, t, L.out, 0.035), 1);
    L.events(6, 12, (t) => {
      // panela de pressão: "tchi-tchi" ritmado
      const d = rr(r, 2, 4);
      for (let k = 0; k < d * 3; k++) noiseHit(L.rig, L.out, t + k / 3, { type: 'highpass', freq: 2500, peak: 0.05, attack: 0.04, hold: 0.08, decay: 0.12 });
    }, 3, false);
    L.events(8, 16, (t) => {
      const n = 4 + Math.floor(r() * 5);
      for (let k = 0; k < n; k++) noiseHit(L.rig, L.out, t + k * rr(r, 0.18, 0.24), { type: 'bandpass', freq: 700, q: 1.5, peak: 0.12, decay: 0.03 });
    }, 5, false);
  },
  bar(L) {
    murmur(L, 0.08, 800);
    babble(L, L.out, anon('homem', 'arrastada', { level: 0.15 }), [2, 6], [0.4, 1.2]);
    L.events(1.5, 5, (t) => clink(L, t, L.out, 0.04), 0.5);
    L.events(6, 12, (t) => crowdLaugh(L, L.out, t, 1.5, rr(L.r, 0.8, 1.4), 0.07), 3);
    const w = wall(L, 1500, 150);
    strums(L, 100, w, [[60, 64, 67, 72], [57, 61, 64, 67], [62, 65, 69, 74], [55, 59, 62, 65]], [0, 3, 4, 6], 0.18);
  },
  igreja(L) {
    const ctx = L.rig.ctx;
    const g = gain(ctx, 0.05, wall(L, 2000, 100));
    const s = gain(ctx, 0.6, L.send);
    g.connect(s);
    const chords = [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]];
    L.periodic(7, (t, i) => {
      for (const m of chords[i % chords.length]) {
        for (const [h, a] of [[1, 1], [2, 0.5], [4, 0.2]] as const) {
          tone(L.rig, g, t, { freq: mtof(m) * h, peak: 0.3 * a, attack: 2, hold: 4, decay: 2.4, linear: true });
        }
      }
    });
    murmur(L, 0.03, 600);
  },
  escola(L) {
    babble(L, L.out, anon('crianca', undefined, { level: 0.16, rate: 8 }), [1, 4], [0.2, 1]);
    babble(L, L.out, anon('menino', undefined, { level: 0.14, rate: 7.6 }), [1, 4], [0.4, 1.4]);
    murmur(L, 0.05, 1200);
    L.events(4, 10, (t) => cry(L, L.out, t, anon('crianca', 'grito', { level: 0.18 }), 2 + Math.floor(L.r() * 2), ['e', 'a', 'i'], ['', 'h', 'l'], 5), 1.5);
    L.events(5, 12, (t) => tone(L.rig, L.out, t, { freq: 150, freqEnd: 90, glide: 0.05, peak: 0.2, decay: 0.08 }), 2);
    const bellOut = wall(L, 2500, 300);
    L.events(40, 90, (t) => {
      const ctx = L.rig.ctx;
      const s = osc(ctx, 'square', 1000);
      const am = osc(ctx, 'square', 22);
      const ag = gain(ctx, 0.5);
      const a = gain(ctx, 0.5);
      const g = gain(ctx, 0, bellOut);
      am.connect(ag).connect(a.gain);
      s.connect(a).connect(g);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.02, t + 0.02);
      g.gain.setValueAtTime(0.02, t + 2.4);
      g.gain.linearRampToValueAtTime(0, t + 2.5);
      s.start(t);
      am.start(t);
      s.stop(t + 2.55);
      am.stop(t + 2.55);
      cleanup(s, am, ag, a, g);
    }, 20, false);
  },
  maquina(L) {
    const ctx = L.rig.ctx;
    const hum = gain(ctx, 0.04, L.out);
    const w = L.rig.banks.wave('maq', () => [1, 0.6, 0.45, 0.3, 0.2, 0.15]);
    const o = ctx.createOscillator();
    o.setPeriodicWave(w);
    o.frequency.value = 120;
    o.connect(hum);
    o.start(L.t);
    L.src(o);
    L.bed({ color: 'white', type: 'bandpass', freq: 1500, q: 0.5, level: 0.05 });
    L.periodic(0.8, (t, i) => {
      noiseHit(L.rig, L.out, t, { type: 'bandpass', freq: 2000, q: 8, peak: 0.1, decay: 0.08 });
      tone(L.rig, L.out, t, { freq: 900, peak: 0.04, decay: 0.15 });
      if (i % 2 === 0) tone(L.rig, L.out, t, { freq: 140, freqEnd: 80, glide: 0.05, peak: 0.25, decay: 0.1 });
    });
    L.events(6, 12, (t) => noiseHit(L.rig, L.out, t, { type: 'highpass', freq: 1800, peak: 0.08, attack: 0.02, decay: 0.6 }), 3, false);
  },
  tiros(L) {
    L.bed({ color: 'brown', type: 'lowpass', freq: 260, level: 0.05 });
    const dest = gain(L.rig.ctx, 1, L.out);
    const s = gain(L.rig.ctx, 0.6, L.send);
    dest.connect(s);
    L.events(8, 25, (t) => {
      const n = 1 + Math.floor(L.r() * 4);
      let tt = t;
      for (let i = 0; i < n; i++) {
        noiseHit(L.rig, dest, tt, { type: 'lowpass', freq: 1500, peak: 0.28, attack: 0.001, decay: 0.25 });
        tone(L.rig, dest, tt, { freq: 90, freqEnd: 50, glide: 0.05, peak: 0.3, decay: 0.1 });
        tt += rr(L.r, 0.15, 0.6);
      }
    }, 2.5, false);
  },
  gritos(L) {
    murmur(L, 0.04, 900);
    const dest = wall(L, 2200, 200);
    const s = gain(L.rig.ctx, 0.3, L.send);
    dest.connect(s);
    L.events(2, 6, (t) => cry(L, dest, t, anon(pick(L.r, ['homem', 'mulher', 'jovem_h'] as const), 'grito', { level: 0.32 }), 2 + Math.floor(L.r() * 3), ['a', 'e', 'o', 'a'], ['', 'p', 'l', 'n', 's'], 4.5), 0.5);
  },
  bebe(L) {
    const dest = wall(L, 3000, 250);
    const spec: VoiceSpec = { ...anon('crianca'), f0: 430, fmt: 1.5, vib: 6, vibDepth: 40, rasp: 0.3, breath: 0.1, level: 0.42, range: 0.2, gap: 0.05 };
    L.chain(
      (t) => {
        const dur = cry(L, dest, t, spec, 2 + Math.floor(L.r() * 3), ['a', 'e', 'E'], ['h', 'n', ''], 1.8);
        noiseHit(L.rig, dest, t + dur + 0.05, { type: 'bandpass', freq: 1500, freqEnd: 2200, q: 1, peak: 0.08, attack: 0.15, decay: 0.08 });
        return dur + 0.3;
      },
      () => rr(L.r, 0.3, 1.0),
      0.3,
    );
  },
  desenho(L) {
    const tv = wall(L, 3200, 300);
    babble(L, tv, { ...anon('crianca'), f0: 330, fmt: 1.35, rate: 8, range: 0.3, vary: 0.15, level: 0.26 }, [2, 5], [0.3, 1]);
    L.events(3, 8, (t) => {
      const ctx = L.rig.ctx;
      if (L.r() < 0.5) {
        const s = osc(ctx, 'sine', 200);
        const v = osc(ctx, 'sine', 10);
        const vg = gain(ctx, 30);
        const g = gain(ctx, 0, tv);
        v.connect(vg).connect(s.frequency);
        s.connect(g);
        s.frequency.setValueAtTime(200, t);
        s.frequency.exponentialRampToValueAtTime(600, t + 0.3);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.08, t + 0.01);
        g.gain.setTargetAtTime(0, t + 0.1, 0.1);
        s.start(t);
        v.start(t);
        s.stop(t + 0.6);
        v.stop(t + 0.6);
        cleanup(s, v, vg, g);
      } else tone(L.rig, tv, t, { freq: 600, freqEnd: 1400, glide: 0.4, peak: 0.05, attack: 0.02, hold: 0.5, decay: 0.2 });
    }, 1);
    L.events(10, 20, (t) => {
      const sc = [72, 74, 76, 79, 81, 84];
      for (let i = 0; i < 5; i++) bell(L.rig, tv, t + i * 0.12, { freq: mtof(pick(L.r, sc)), ratio: 3.5, index: 0.5, peak: 0.05, decay: 0.4 });
    }, 4, false);
  },
  onibus(L) {
    const ctx = L.rig.ctx;
    const r = L.r;
    const eg = gain(ctx, 0.07, L.out);
    const lp = filt(ctx, 'lowpass', 700, 0.8, 0, eg);
    const eng = L.osc('sawtooth', 55, lp);
    L.events(3, 6, (t) => eng.frequency.setTargetAtTime(rr(r, 45, 75), t, 1.2), 0.5, false);
    L.bed({ color: 'brown', type: 'lowpass', freq: 800, level: 0.1 });
    murmur(L, 0.03, 700);
    L.events(15, 30, (t) => noiseHit(L.rig, L.out, t, { type: 'highpass', freq: 1500, peak: 0.16, attack: 0.02, decay: 0.6 }), 6, false);
    L.events(12, 25, (t) => bell(L.rig, L.out, t, { freq: 1500, ratio: 2.76, index: 0.4, peak: 0.05, decay: 0.6 }), 4, false);
  },
  academia(L) {
    const w = wall(L, 800, 60);
    beat(L, 128, w, { kick: true, hat: true, bass: [98, 98, 116.5, 87.3], bassType: 'sawtooth' });
    murmur(L, 0.03, 900);
    L.events(2, 5, (t) => {
      const f = rr(L.r, 600, 900);
      noiseHit(L.rig, L.out, t, { type: 'bandpass', freq: 2500, q: 6, peak: 0.12, decay: 0.05 });
      tone(L.rig, L.out, t, { freq: f, peak: 0.05, decay: 0.3 });
      tone(L.rig, L.out, t, { freq: f * 1.53, peak: 0.03, decay: 0.2 });
    }, 0.8);
    L.events(6, 14, (t) => cry(L, L.out, t, anon('grave', undefined, { level: 0.22, breath: 0.4 }), 1, ['u', 'a'], ['h'], 4), 3);
  },
  musica(L) {
    const w = wall(L, 2500, 150);
    const prog = [[48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]];
    const step = 60 / 96 / 2;
    L.periodic(step, (t, i) => {
      const ch = prog[Math.floor(i / 8) % prog.length];
      const s = i % 8;
      const order = [0, 2, 1, 3, 0, 2, 3, 2];
      pluck(L.rig, w, t, { midi: ch[order[s]] + (s === 0 ? 0 : 12), vel: s === 0 ? 0.3 : 0.2, bright: 1, dur: step * 4 });
      if (s === 0 || s === 4) tone(L.rig, w, t, { type: 'triangle', freq: mtof(ch[0] - 12), peak: 0.22, attack: 0.005, hold: step * 2, decay: 0.15, lp: 600 });
    });
    beat(L, 96, w, { kick: true, snare: true });
  },
};

// -----------------------------------------------------------------------------
// Mixer de camadas (crossfade)
// -----------------------------------------------------------------------------
/** Ajuste fino de nível por camada (medido offline: ~-32 dB RMS a 0,8 de intensidade). */
const TRIM: Partial<Record<AmbientId, number>> = {
  tv: 0.8, chuva: 1.4, festa: 0.5, choro: 0.63, chuveiro: 1.25, rua: 1.8, risadas: 1.8, radio_am: 0.45, passaros: 1.4,
  ventilador: 2, buzinas: 1.25, sirene: 0.35, respiracao: 1.6, videogame: 2.5, gemidos: 0.7, multidao: 1.2, vento: 2.5,
  agua: 0.55, cozinha: 4, bar: 0.5, igreja: 1.1, escola: 1.6, maquina: 1.6, tiros: 1.2, gritos: 0.56, bebe: 0.9,
  desenho: 1.1, onibus: 1.4, academia: 0.63, musica: 0.63,
};
export class AmbientMixer {
  private layers = new Map<AmbientId, Layer>();
  private seq = 0;

  constructor(private rig: Rig) {}

  get current(): AmbientId[] {
    return Array.from(this.layers.keys());
  }

  set(ids: readonly AmbientId[], intensity: number): void {
    const want = new Set(ids.filter((id) => id in B));
    for (const [id, layer] of this.layers) {
      if (!want.has(id)) {
        layer.dispose();
        this.layers.delete(id);
      }
    }
    for (const id of want) {
      const existing = this.layers.get(id);
      if (existing) {
        if (Math.abs(existing.intensity - intensity) > 0.01) existing.setIntensity(intensity);
        continue;
      }
      const layer = new Layer(this.rig, id, intensity, hashStr(id) + 7919 * ++this.seq);
      layer.out.gain.value = TRIM[id] ?? 1;
      try {
        B[id](layer);
      } catch (e) {
        console.warn('[audio] ambiente', id, e);
      }
      this.layers.set(id, layer);
    }
  }

  stopAll(): void {
    for (const l of this.layers.values()) l.dispose();
    this.layers.clear();
  }
}
