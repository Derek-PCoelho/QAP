// =============================================================================
// QAP — Emergency Dispatch — áudio · utilitários de DSP
// Funções puras + construtores de nós. Nada aqui toca em DOM/AudioContext na
// importação; tudo recebe o contexto como parâmetro.
// =============================================================================

export type Rand = () => number;

/** Hash 32 bits estável (FNV-1a + avalanche). */
export function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** PRNG determinístico rápido. */
export function mulberry32(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rr = (r: Rand, a: number, b: number): number => a + (b - a) * r();
export const ri = (r: Rand, a: number, b: number): number => Math.floor(a + (b - a + 1) * r());
export function pick<T>(r: Rand, arr: readonly T[]): T {
  return arr[Math.min(arr.length - 1, Math.floor(r() * arr.length))];
}
export const clamp = (x: number, a: number, b: number): number => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const mtof = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
export const db = (d: number): number => Math.pow(10, d / 20);

// -----------------------------------------------------------------------------
// Construtores de nós
// -----------------------------------------------------------------------------
export function gain(ctx: BaseAudioContext, v = 1, dest?: AudioNode): GainNode {
  const g = ctx.createGain();
  g.gain.value = v;
  if (dest) g.connect(dest);
  return g;
}

export function filt(
  ctx: BaseAudioContext,
  type: BiquadFilterType,
  freq: number,
  q = 0.707,
  gainDb = 0,
  dest?: AudioNode,
): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  f.gain.value = gainDb;
  if (dest) f.connect(dest);
  return f;
}

export function osc(ctx: BaseAudioContext, type: OscillatorType, freq: number, dest?: AudioNode): OscillatorNode {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  if (dest) o.connect(dest);
  return o;
}

export function oscWave(ctx: BaseAudioContext, wave: PeriodicWave, freq: number, dest?: AudioNode): OscillatorNode {
  const o = ctx.createOscillator();
  o.setPeriodicWave(wave);
  o.frequency.value = freq;
  if (dest) o.connect(dest);
  return o;
}

export function bufSrc(ctx: BaseAudioContext, buffer: AudioBuffer, loop = false, dest?: AudioNode): AudioBufferSourceNode {
  const s = ctx.createBufferSource();
  s.buffer = buffer;
  s.loop = loop;
  if (dest) s.connect(dest);
  return s;
}

export function panner(ctx: BaseAudioContext, pan: number, dest?: AudioNode): AudioNode {
  if (typeof ctx.createStereoPanner === 'function') {
    const p = ctx.createStereoPanner();
    p.pan.value = clamp(pan, -1, 1);
    if (dest) p.connect(dest);
    return p;
  }
  return gain(ctx, 1, dest);
}

/** Curvas de saturação compartilhadas (tanh). */
const curveCache = new Map<number, Float32Array<ArrayBuffer>>();
export function softClipCurve(drive: number): Float32Array<ArrayBuffer> {
  const k = Math.round(drive * 20) / 20;
  let c = curveCache.get(k);
  if (c) return c;
  const n = 1024;
  c = new Float32Array(n);
  const d = 1 + k * 8;
  const norm = Math.tanh(d);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(x * d) / norm;
  }
  curveCache.set(k, c);
  return c;
}

export function shaper(ctx: BaseAudioContext, drive: number, dest?: AudioNode): WaveShaperNode {
  const w = ctx.createWaveShaper();
  w.curve = softClipCurve(drive);
  w.oversample = '2x';
  if (dest) w.connect(dest);
  return w;
}

/** Desconecta a cadeia quando a fonte termina (evita vazamento de nós). */
export function cleanup(src: AudioScheduledSourceNode, ...nodes: AudioNode[]): void {
  src.onended = () => {
    try {
      src.disconnect();
    } catch {
      /* já desconectado */
    }
    for (const n of nodes) {
      try {
        n.disconnect();
      } catch {
        /* idem */
      }
    }
  };
}

/** Para uma fonte com segurança (ignora InvalidStateError). */
export function stopSafe(src: AudioScheduledSourceNode, t: number): void {
  try {
    src.stop(t);
  } catch {
    /* já parada ou não iniciada */
  }
}

// -----------------------------------------------------------------------------
// Envelopes
// -----------------------------------------------------------------------------
/** Envelope percussivo: 0 → pico (attack) → ~0 (decay exponencial). */
export function perc(p: AudioParam, t: number, peak: number, attack: number, decay: number): void {
  p.setValueAtTime(0, t);
  p.linearRampToValueAtTime(peak, t + Math.max(0.001, attack));
  p.setTargetAtTime(0, t + attack, Math.max(0.002, decay / 4));
}

/** Envelope AR linear com sustentação. */
export function ar(p: AudioParam, t: number, peak: number, attack: number, hold: number, release: number): void {
  p.setValueAtTime(0, t);
  p.linearRampToValueAtTime(peak, t + Math.max(0.001, attack));
  p.setValueAtTime(peak, t + attack + Math.max(0, hold));
  p.linearRampToValueAtTime(0, t + attack + Math.max(0, hold) + Math.max(0.005, release));
}

/** Rampa suave de parâmetro a partir de "agora" sem estalos. */
export function glideTo(p: AudioParam, v: number, t: number, tc: number): void {
  p.cancelScheduledValues(t);
  p.setTargetAtTime(v, t, Math.max(0.001, tc));
}

/** Fade-out que sobrepõe automações anteriores (para stop()). */
export function fadeOut(p: AudioParam, t: number, dur: number): void {
  try {
    p.cancelScheduledValues(t);
    const v = p.value;
    p.setValueAtTime(v, t);
    p.linearRampToValueAtTime(0, t + Math.max(0.005, dur));
  } catch {
    /* noop */
  }
}

// -----------------------------------------------------------------------------
// Geração de amostras (JS puro → AudioBuffer)
// -----------------------------------------------------------------------------
export type NoiseColor = 'white' | 'pink' | 'brown';

/** Gera ruído colorido com emenda suave (loop sem estalo). */
export function noiseSamples(color: NoiseColor, n: number, seed: number): Float32Array<ArrayBuffer> {
  const fade = Math.min(2048, Math.floor(n / 8));
  const total = n + fade;
  const raw = new Float32Array(total);
  const r = mulberry32(seed);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < total; i++) {
    const w = r() * 2 - 1;
    if (color === 'white') raw[i] = w * 0.7;
    else if (color === 'pink') {
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.12;
      b6 = w * 0.115926;
    } else {
      last = (last + 0.02 * w) / 1.02;
      raw[i] = last * 3.2;
    }
  }
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = raw[i];
  for (let i = 0; i < fade; i++) {
    const a = i / fade;
    out[i] = raw[i] * a + raw[n + i] * (1 - a);
  }
  // remove DC
  let m = 0;
  for (let i = 0; i < n; i++) m += out[i];
  m /= n;
  for (let i = 0; i < n; i++) out[i] -= m;
  return out;
}

/** Estalos esparsos (estática de rádio/vinil/fritura). */
export function crackleSamples(sr: number, seconds: number, density: number, seed: number): Float32Array<ArrayBuffer> {
  const n = Math.floor(sr * seconds);
  const out = new Float32Array(n);
  const r = mulberry32(seed);
  const count = Math.floor(seconds * density);
  for (let k = 0; k < count; k++) {
    const pos = Math.floor(r() * n);
    const amp = Math.pow(r(), 3) * 0.9 + 0.05;
    const len = Math.floor(sr * (0.0004 + r() * 0.0025));
    const sign = r() < 0.5 ? -1 : 1;
    for (let i = 0; i < len; i++) {
      const idx = (pos + i) % n;
      out[idx] += sign * amp * Math.exp(-i / (len * 0.3)) * (r() * 2 - 1);
    }
  }
  return out;
}

/** Bolhas (água corrente): senoides curtas com pitch subindo (Minnaert). */
export function bubbleSamples(sr: number, seconds: number, rate: number, seed: number): Float32Array<ArrayBuffer> {
  const n = Math.floor(sr * seconds);
  const out = new Float32Array(n);
  const r = mulberry32(seed);
  const count = Math.floor(seconds * rate);
  for (let k = 0; k < count; k++) {
    const pos = Math.floor(r() * n);
    const f0 = 250 + Math.pow(r(), 2) * 1500;
    const tau = 0.004 + r() * 0.02;
    const rise = 2 + r() * 6;
    const amp = 0.08 + r() * 0.25;
    const len = Math.floor(sr * tau * 5);
    let ph = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const f = f0 * (1 + rise * t);
      ph += (2 * Math.PI * f) / sr;
      const env = Math.exp(-t / tau) * Math.min(1, i / 20);
      out[(pos + i) % n] += Math.sin(ph) * env * amp;
    }
  }
  return out;
}

/** Gotas de chuva: rajadas curtas brilhantes + alguns "plinks". */
export function dropSamples(sr: number, seconds: number, rate: number, seed: number): Float32Array<ArrayBuffer> {
  const n = Math.floor(sr * seconds);
  const out = new Float32Array(n);
  const r = mulberry32(seed);
  const count = Math.floor(seconds * rate);
  for (let k = 0; k < count; k++) {
    const pos = Math.floor(r() * n);
    const amp = Math.pow(r(), 2) * 0.6 + 0.04;
    const len = Math.floor(sr * (0.001 + r() * 0.004));
    let prev = 0;
    for (let i = 0; i < len; i++) {
      const w = r() * 2 - 1;
      const hp = w - prev; // diferenciação simples = agudo
      prev = w;
      out[(pos + i) % n] += hp * amp * Math.exp(-i / (len * 0.25));
    }
    if (r() < 0.12) {
      const f = 1500 + r() * 2500;
      const pl = Math.floor(sr * 0.03);
      for (let i = 0; i < pl; i++) {
        const t = i / sr;
        out[(pos + i) % n] += Math.sin(2 * Math.PI * f * (1 + 3 * t) * t) * Math.exp(-t / 0.006) * amp * 0.5;
      }
    }
  }
  return out;
}

/** Resposta ao impulso sintética (sala quente), estéreo. */
export function impulseSamples(sr: number, seconds: number, seed: number, damp = 0.5): [Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>] {
  const n = Math.floor(sr * seconds);
  const chans: Float32Array<ArrayBuffer>[] = [];
  for (let c = 0; c < 2; c++) {
    const r = mulberry32(seed + c * 7919);
    const d = new Float32Array(n);
    const pre = Math.floor(sr * 0.012);
    let lp = 0;
    for (let i = pre; i < n; i++) {
      const t = (i - pre) / sr;
      const env = Math.exp((-6.9 * t) / (seconds * 0.85)) * Math.min(1, t / 0.004);
      // filtro passa-baixa que escurece com o tempo
      const a = clamp(0.85 - damp * (t / seconds) * 1.4, 0.06, 0.95);
      lp += a * (r() * 2 - 1 - lp);
      d[i] = lp * env;
    }
    // primeiras reflexões
    for (let k = 0; k < 6; k++) {
      const p = pre + Math.floor(sr * (0.008 + r() * 0.05));
      if (p < n) d[p] += (r() < 0.5 ? -1 : 1) * (0.5 - k * 0.06);
    }
    let e = 0;
    for (let i = 0; i < n; i++) e += d[i] * d[i];
    const g = 1 / Math.sqrt(e / 4 + 1e-9);
    for (let i = 0; i < n; i++) d[i] *= g * 0.5;
    chans.push(d);
  }
  return [chans[0], chans[1]];
}

/**
 * Karplus–Strong estendido (corda de náilon): excitação triangular + ruído,
 * filtro de posição de ataque, perda por média de 2 pontos e afinação
 * fracionária por all-pass. Retorna amostras mono normalizadas.
 */
export function ksPluck(
  sr: number,
  freq: number,
  dur: number,
  opts: { bright?: number; t60?: number; pos?: number; seed?: number } = {},
): Float32Array<ArrayBuffer> {
  const bright = clamp(opts.bright ?? 0.5, 0, 1);
  const t60 = opts.t60 ?? 2.5;
  const pos = opts.pos ?? 0.2;
  const r = mulberry32(opts.seed ?? 1);
  const N = sr / freq;
  const L = Math.max(2, Math.floor(N - 0.6));
  const d = N - L - 0.5;
  const C = (1 - d) / (1 + d);
  const dl = new Float32Array(L);
  // excitação: triângulo (deslocamento inicial) + ruído filtrado
  const peakAt = Math.max(1, Math.floor(L * pos));
  for (let i = 0; i < L; i++) {
    const tri = i < peakAt ? i / peakAt : (L - i) / (L - peakAt);
    dl[i] = tri * 0.75 + (r() * 2 - 1) * (0.15 + 0.35 * bright);
  }
  // passa-baixa da excitação (dedos = timbre macio)
  const a = 0.25 + 0.6 * bright;
  for (let pass = 0; pass < 2; pass++) {
    let y = dl[L - 1];
    for (let i = 0; i < L; i++) {
      y += a * (dl[i] - y);
      dl[i] = y;
    }
  }
  // filtro de posição de ataque (pente)
  const P = Math.max(1, Math.round(pos * L));
  const tmp = Float32Array.from(dl);
  for (let i = 0; i < L; i++) dl[i] = tmp[i] - 0.6 * tmp[(i - P + L) % L];
  let mean = 0;
  for (let i = 0; i < L; i++) mean += dl[i];
  mean /= L;
  for (let i = 0; i < L; i++) dl[i] -= mean;

  const g = Math.pow(10, -3 / (t60 * freq));
  const rho = Math.min(0.99995, g / Math.max(0.5, Math.cos((Math.PI * freq) / sr)));
  const n = Math.floor(sr * dur);
  const out = new Float32Array(n);
  let p = 0;
  let prev = 0;
  let apX = 0;
  let apY = 0;
  let peak = 1e-9;
  for (let i = 0; i < n; i++) {
    const y = dl[p];
    out[i] = y;
    const lp = 0.5 * (y + prev);
    prev = y;
    const ap = C * (lp - apY) + apX;
    apX = lp;
    apY = ap;
    dl[p] = ap * rho;
    p++;
    if (p >= L) p = 0;
    const ay = y < 0 ? -y : y;
    if (ay > peak) peak = ay;
  }
  // ataque suave (2 ms) + fade final
  const atk = Math.floor(sr * 0.002);
  const fo = Math.floor(sr * 0.08);
  const norm = 0.9 / peak;
  for (let i = 0; i < n; i++) {
    let e = norm;
    if (i < atk) e *= i / atk;
    if (i > n - fo) e *= (n - i) / fo;
    out[i] *= e;
  }
  return out;
}

/** Cria AudioBuffer mono a partir de amostras. */
export function toBuffer(ctx: BaseAudioContext, data: Float32Array<ArrayBuffer>): AudioBuffer {
  const b = ctx.createBuffer(1, data.length, ctx.sampleRate);
  b.getChannelData(0).set(data);
  return b;
}
