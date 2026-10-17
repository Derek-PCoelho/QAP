// =============================================================================
// QAP — Emergency Dispatch — áudio · primitivas de síntese (one-shots autolimpantes)
// =============================================================================
import type { BusName, Rig } from './core';
import { bufSrc, cleanup, filt, gain, osc, panner, type NoiseColor } from './dsp';

interface Common {
  /** envio de reverb (0..1) */
  send?: number;
  sendBus?: BusName;
  pan?: number;
}

export interface NoiseOpts extends Common {
  color?: NoiseColor;
  type?: BiquadFilterType;
  freq?: number;
  freqEnd?: number;
  q?: number;
  peak: number;
  attack?: number;
  hold?: number;
  decay: number;
  /** usar buffer de estalos em vez de ruído */
  crackle?: boolean;
}

function route(rig: Rig, node: AudioNode, dest: AudioNode, o: Common, extra: AudioNode[]): void {
  let out: AudioNode = node;
  if (o.pan) {
    const p = panner(rig.ctx, o.pan, dest);
    node.connect(p);
    extra.push(p);
    out = p;
  } else node.connect(dest);
  if (o.send && o.send > 0) {
    const s = gain(rig.ctx, o.send, rig.send[o.sendBus ?? 'sfx']);
    out.connect(s);
    extra.push(s);
  }
}

/** Rajada de ruído filtrado com envelope. Retorna o tempo final. */
export function noiseHit(rig: Rig, dest: AudioNode, t: number, o: NoiseOpts): number {
  const ctx = rig.ctx;
  const buf = o.crackle ? rig.banks.crackle() : rig.banks.noise(o.color ?? 'white');
  const src = bufSrc(ctx, buf, true);
  const f = filt(ctx, o.type ?? 'bandpass', o.freq ?? 1000, o.q ?? 1);
  const g = gain(ctx, 0);
  src.connect(f).connect(g);
  const extra: AudioNode[] = [];
  route(rig, g, dest, o, extra);
  const a = Math.max(0.001, o.attack ?? 0.002);
  const h = Math.max(0, o.hold ?? 0);
  const end = t + a + h + o.decay * 1.1 + 0.02;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.peak, t + a);
  if (h > 0) g.gain.setValueAtTime(o.peak, t + a + h);
  g.gain.setTargetAtTime(0, t + a + h, Math.max(0.001, o.decay / 5));
  if (o.freqEnd) {
    f.frequency.setValueAtTime(o.freq ?? 1000, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, o.freqEnd), t + a + h + o.decay);
  }
  src.start(t, Math.random() * (buf.duration - 0.5));
  src.stop(end);
  cleanup(src, f, g, ...extra);
  return end;
}

export interface ToneOpts extends Common {
  type?: OscillatorType;
  wave?: PeriodicWave;
  freq: number;
  freqEnd?: number;
  /** duração do glide até freqEnd (s) */
  glide?: number;
  peak: number;
  attack?: number;
  hold?: number;
  decay: number;
  detune?: number;
  lp?: number;
  /** liberação linear ao fim do hold (em vez de decaimento exponencial) */
  linear?: boolean;
}

/** Tom com envelope. Retorna o tempo final. */
export function tone(rig: Rig, dest: AudioNode, t: number, o: ToneOpts): number {
  const ctx = rig.ctx;
  const s = ctx.createOscillator();
  if (o.wave) s.setPeriodicWave(o.wave);
  else s.type = o.type ?? 'sine';
  s.frequency.value = o.freq;
  if (o.detune) s.detune.value = o.detune;
  const g = gain(ctx, 0);
  const nodes: AudioNode[] = [g];
  if (o.lp) {
    const f = filt(ctx, 'lowpass', o.lp, 0.7);
    s.connect(f).connect(g);
    nodes.push(f);
  } else s.connect(g);
  route(rig, g, dest, o, nodes);
  const a = Math.max(0.001, o.attack ?? 0.003);
  const h = Math.max(0, o.hold ?? 0);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.peak, t + a);
  if (h > 0) g.gain.setValueAtTime(o.peak, t + a + h);
  let end: number;
  if (o.linear) {
    g.gain.linearRampToValueAtTime(0, t + a + h + o.decay);
    end = t + a + h + o.decay + 0.02;
  } else {
    g.gain.setTargetAtTime(0, t + a + h, Math.max(0.001, o.decay / 5));
    end = t + a + h + o.decay * 1.1 + 0.02;
  }
  if (o.freqEnd) {
    s.frequency.setValueAtTime(o.freq, t);
    s.frequency.exponentialRampToValueAtTime(Math.max(10, o.freqEnd), t + (o.glide ?? a + h + o.decay));
  }
  s.start(t);
  s.stop(end);
  cleanup(s, ...nodes);
  return end;
}

/** Sino FM (portadora + moduladora com índice decrescente). */
export function bell(
  rig: Rig,
  dest: AudioNode,
  t: number,
  o: Common & { freq: number; ratio?: number; index?: number; peak: number; decay: number; attack?: number },
): number {
  const ctx = rig.ctx;
  const c = osc(ctx, 'sine', o.freq);
  const m = osc(ctx, 'sine', o.freq * (o.ratio ?? 1.4));
  const mg = gain(ctx, 0);
  m.connect(mg).connect(c.frequency);
  const g = gain(ctx, 0);
  c.connect(g);
  const nodes: AudioNode[] = [g, mg, m];
  route(rig, g, dest, o, nodes);
  const a = o.attack ?? 0.002;
  const idx = (o.index ?? 2) * o.freq;
  mg.gain.setValueAtTime(idx, t);
  mg.gain.setTargetAtTime(idx * 0.15, t, o.decay / 4);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.peak, t + a);
  g.gain.setTargetAtTime(0, t + a, o.decay / 5);
  const end = t + a + o.decay * 1.1 + 0.02;
  c.start(t);
  m.start(t);
  c.stop(end);
  m.stop(end);
  cleanup(c, ...nodes);
  return end;
}

/** Toca uma nota de violão (Karplus–Strong pré-calculado). */
export function pluck(
  rig: Rig,
  dest: AudioNode,
  t: number,
  o: Common & { midi: number; vel: number; bright?: number; cents?: number; dur?: number },
): number {
  const ctx = rig.ctx;
  const buf = rig.banks.pluck(o.midi, o.bright ?? 1);
  const src = bufSrc(ctx, buf);
  if (o.cents) src.detune.value = o.cents;
  const g = gain(ctx, o.vel);
  src.connect(g);
  const nodes: AudioNode[] = [g];
  route(rig, g, dest, o, nodes);
  const dur = Math.min(buf.duration, o.dur ?? buf.duration);
  if (dur < buf.duration) {
    g.gain.setValueAtTime(o.vel, t + dur - 0.08);
    g.gain.linearRampToValueAtTime(0, t + dur);
  }
  src.start(t);
  src.stop(t + dur + 0.01);
  cleanup(src, ...nodes);
  return t + dur;
}

/**
 * Camada contínua (loop de ruído filtrado). Retorna o nó de ganho e um stop().
 */
export function noiseBed(
  rig: Rig,
  dest: AudioNode,
  t: number,
  o: { color?: NoiseColor; type?: BiquadFilterType; freq?: number; q?: number; level: number; fade?: number; buffer?: AudioBuffer; rate?: number },
): { g: GainNode; f: BiquadFilterNode; src: AudioBufferSourceNode; stop(t: number): void } {
  const ctx = rig.ctx;
  const buf = o.buffer ?? rig.banks.noise(o.color ?? 'white');
  const src = bufSrc(ctx, buf, true);
  if (o.rate) src.playbackRate.value = o.rate;
  const f = filt(ctx, o.type ?? 'lowpass', o.freq ?? 20000, o.q ?? 0.7);
  const g = gain(ctx, 0, dest);
  src.connect(f).connect(g);
  const fade = o.fade ?? 0.05;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.level, t + fade);
  src.start(t, Math.random() * Math.max(0, buf.duration - 0.1));
  cleanup(src, f, g);
  let stopped = false;
  return {
    g,
    f,
    src,
    stop(t2: number) {
      if (stopped) return;
      stopped = true;
      try {
        g.gain.cancelScheduledValues(t2);
        g.gain.setTargetAtTime(0, t2, 0.08);
        src.stop(t2 + 0.5);
      } catch {
        /* noop */
      }
    },
  };
}
