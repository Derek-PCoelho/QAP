// =============================================================================
// QAP — Emergency Dispatch — áudio · núcleo (relógio, barramentos, bancos de buffers)
// =============================================================================
import {
  bubbleSamples,
  clamp,
  crackleSamples,
  dropSamples,
  filt,
  gain,
  impulseSamples,
  ksPluck,
  mtof,
  noiseSamples,
  shaper,
  toBuffer,
  type NoiseColor,
} from './dsp';

export type BusName = 'music' | 'sfx' | 'ambient' | 'voice';

/** Algo que agenda eventos até um horizonte de tempo de áudio. */
export interface Ticker {
  tick(horizon: number): void;
}

/**
 * Relógio "de dois tempos": um setInterval curto agenda eventos no relógio do
 * AudioContext com antecedência (lookahead). No modo offline, tudo é agendado
 * de uma vez até o fim da renderização.
 */
export class Clock {
  private tickers = new Set<Ticker>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private ctx: BaseAudioContext,
    readonly offlineEnd: number | null,
    /** deslocamento do "agora" (pré-rolagem na renderização offline) */
    private offset = 0,
  ) {}

  get now(): number {
    return this.ctx.currentTime + this.offset;
  }

  horizon(): number {
    if (this.offlineEnd !== null) return this.offlineEnd;
    const hidden = typeof document !== 'undefined' && document.hidden;
    return this.ctx.currentTime + (hidden ? 1.6 : 0.3);
  }

  add(t: Ticker): void {
    this.tickers.add(t);
    this.safeTick(t, this.horizon());
    if (this.offlineEnd === null && this.tickers.size && this.timer === null) {
      this.timer = setInterval(() => this.run(), 40);
    }
  }

  remove(t: Ticker): void {
    this.tickers.delete(t);
    if (!this.tickers.size && this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Executa fn aproximadamente no tempo de áudio t (só em tempo real). */
  at(t: number, fn: () => void): void {
    if (this.offlineEnd !== null) return;
    const ms = Math.max(0, (t - this.now) * 1000);
    setTimeout(fn, ms);
  }

  dispose(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.tickers.clear();
  }

  private run(): void {
    const h = this.horizon();
    for (const t of Array.from(this.tickers)) this.safeTick(t, h);
  }

  private safeTick(t: Ticker, h: number): void {
    try {
      t.tick(h);
    } catch (e) {
      console.warn('[audio] ticker removido após erro', e);
      this.remove(t);
    }
  }
}

/**
 * Agenda fn em instantes sucessivos (intervalo dado por gap()) a partir de t0.
 * Retorna a função que cancela o agendamento.
 */
export function every(clock: Clock, t0: number, gap: () => number, fn: (t: number, i: number) => void): () => void {
  let next = t0;
  let i = 0;
  let alive = true;
  const tk: Ticker = {
    tick: (h) => {
      if (!alive) return;
      if (clock.offlineEnd === null && next < clock.now - 0.05) next = clock.now + 0.02; // aba travou: não dispara em rajada
      let guard = 0;
      while (alive && next < h && guard++ < 512) {
        fn(next, i++);
        next += Math.max(0.005, gap());
      }
    },
  };
  clock.add(tk);
  return () => {
    alive = false;
    clock.remove(tk);
  };
}

// -----------------------------------------------------------------------------
// Bancos (buffers e formas de onda), criados sob demanda por contexto
// -----------------------------------------------------------------------------
export class Banks {
  private bufs = new Map<string, AudioBuffer>();
  private waves = new Map<string, PeriodicWave>();

  constructor(private ctx: BaseAudioContext) {}

  private memo(key: string, make: () => AudioBuffer): AudioBuffer {
    let b = this.bufs.get(key);
    if (!b) {
      b = make();
      this.bufs.set(key, b);
    }
    return b;
  }

  noise(color: NoiseColor): AudioBuffer {
    const sr = this.ctx.sampleRate;
    return this.memo('n:' + color, () => toBuffer(this.ctx, noiseSamples(color, Math.floor(sr * 5), color.length * 977 + 13)));
  }

  crackle(): AudioBuffer {
    const sr = this.ctx.sampleRate;
    return this.memo('crackle', () => toBuffer(this.ctx, crackleSamples(sr, 4, 45, 4242)));
  }

  bubbles(): AudioBuffer {
    const sr = this.ctx.sampleRate;
    return this.memo('bubbles', () => toBuffer(this.ctx, bubbleSamples(sr, 6, 70, 777)));
  }

  drops(): AudioBuffer {
    const sr = this.ctx.sampleRate;
    return this.memo('drops', () => toBuffer(this.ctx, dropSamples(sr, 6, 120, 31337)));
  }

  /** Nota de violão (KS) cacheada por nota MIDI e faixa de brilho. */
  pluck(midi: number, brightBucket: number): AudioBuffer {
    const sr = this.ctx.sampleRate;
    const b = clamp(Math.round(brightBucket), 0, 2);
    return this.memo(`ks:${midi}:${b}`, () => {
      const low = midi < 50;
      const dur = low ? 3.4 : 2.6;
      const data = ksPluck(sr, mtof(midi), dur, {
        bright: 0.22 + b * 0.22,
        t60: low ? 3.2 : 2.2,
        pos: 0.18 + (midi % 5) * 0.012,
        seed: midi * 31 + b,
      });
      return toBuffer(this.ctx, data);
    });
  }

  ir(key: string, seconds: number, damp: number): AudioBuffer {
    const sr = this.ctx.sampleRate;
    return this.memo('ir:' + key, () => {
      const [l, r] = impulseSamples(sr, seconds, 99 + key.length, damp);
      const b = this.ctx.createBuffer(2, l.length, sr);
      b.getChannelData(0).set(l);
      b.getChannelData(1).set(r);
      return b;
    });
  }

  /** Onda periódica a partir de amplitudes harmônicas (seno). */
  wave(key: string, amps: () => number[]): PeriodicWave {
    let w = this.waves.get(key);
    if (!w) {
      const a = amps();
      const real = new Float32Array(a.length + 1);
      const imag = new Float32Array(a.length + 1);
      for (let i = 0; i < a.length; i++) imag[i + 1] = a[i];
      w = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
      this.waves.set(key, w);
    }
    return w;
  }

  /** Fonte glotal: harmônicos caindo 1/n^tilt. */
  glottal(tilt: number): PeriodicWave {
    const t = Math.round(tilt * 20) / 20;
    return this.wave('glot:' + t, () => {
      const a: number[] = [];
      for (let n = 1; n <= 64; n++) a.push(1 / Math.pow(n, t));
      return a;
    });
  }
}

// -----------------------------------------------------------------------------
// Rig: grafo de mixagem
// -----------------------------------------------------------------------------
export interface Rig {
  ctx: BaseAudioContext;
  clock: Clock;
  offline: boolean;
  banks: Banks;
  /** entradas: ligue as fontes aqui */
  in: {
    music: AudioNode;
    sfx: AudioNode;
    /** sfx ouvido pelo fone (tom de discagem, ocupado) */
    sfxPhone: AudioNode;
    /** ambiente do chamador (passa pela linha telefônica) */
    ambient: AudioNode;
    /** ambiente da sala (zumbido da central) — sem filtro de linha */
    room: AudioNode;
    voice: AudioNode;
    voicePhone: AudioNode;
    voiceRadio: AudioNode;
  };
  /** envios de reverberação (respeitam o volume do barramento) */
  send: Record<BusName, AudioNode>;
  bus: Record<BusName, GainNode>;
  sendVol: Record<BusName, GainNode>;
  duck: { ambient: GainNode; music: GainNode };
  master: GainNode;
  muteGain: GainNode;
  /** contagem de fontes de sfx ativas (limite de polifonia) */
  sfxActive: number;
}

/** Linha telefônica: banda limitada + presença + leve saturação. */
function phoneLine(ctx: BaseAudioContext, dest: AudioNode, drive = 0.12): AudioNode {
  const hp = filt(ctx, 'highpass', 260, 0.7);
  const hp2 = filt(ctx, 'highpass', 170, 0.6);
  const lp = filt(ctx, 'lowpass', 3700, 0.7);
  const pk = filt(ctx, 'peaking', 1700, 0.9, 3);
  const sh = shaper(ctx, drive);
  const out = gain(ctx, 1.15, dest);
  hp.connect(hp2).connect(lp).connect(pk).connect(sh).connect(out);
  return hp;
}

/** Rádio HT das viaturas: banda estreita e saturada. */
function radioLine(ctx: BaseAudioContext, dest: AudioNode): AudioNode {
  const hp = filt(ctx, 'highpass', 400, 0.9);
  const lp = filt(ctx, 'lowpass', 2500, 1.1);
  const lp2 = filt(ctx, 'lowpass', 3200, 0.7);
  const pk = filt(ctx, 'peaking', 1300, 1.2, 6);
  const sh = shaper(ctx, 0.55);
  const out = gain(ctx, 0.85, dest);
  hp.connect(lp).connect(lp2).connect(pk).connect(sh).connect(out);
  return hp;
}

export const BUS_TRIM: Record<BusName, number> = { music: 2, sfx: 0.9, ambient: 0.85, voice: 1 };

export function buildRig(ctx: BaseAudioContext, offlineEnd: number | null, offset = 0): Rig {
  const banks = new Banks(ctx);
  const clock = new Clock(ctx, offlineEnd, offset);

  // saída: master → mute → compressor suave → limitador → compensação → destino
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 2.5;
  comp.attack.value = 0.005;
  comp.release.value = 0.2;
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -3;
  lim.knee.value = 0;
  lim.ratio.value = 20;
  lim.attack.value = 0.001;
  lim.release.value = 0.08;
  // o DynamicsCompressor aplica ganho de compensação fixo (~+6 dB nestes
  // ajustes); cancelamos para que os níveis fiquem previsíveis.
  const makeup = gain(ctx, 0.502);
  const muteGain = gain(ctx, 1);
  const master = gain(ctx, 0.64);
  master.connect(muteGain).connect(comp).connect(lim).connect(makeup).connect(ctx.destination);

  const bus = {
    music: gain(ctx, 0.49 * BUS_TRIM.music, master),
    sfx: gain(ctx, 0.64 * BUS_TRIM.sfx, master),
    ambient: gain(ctx, 0.49 * BUS_TRIM.ambient, master),
    voice: gain(ctx, 0.72 * BUS_TRIM.voice, master),
  } satisfies Record<BusName, GainNode>;

  // reverb global (sala quente) — música, sfx, vozes presenciais
  const verb = ctx.createConvolver();
  verb.normalize = false;
  verb.buffer = banks.ir('sala', 2.4, 0.55);
  const verbRet = gain(ctx, 0.9, master);
  verb.connect(verbRet);

  // reverb do ambiente do chamador (dentro da linha telefônica)
  const duckAmb = gain(ctx, 1, bus.ambient);
  const ambLine = phoneLine(ctx, duckAmb, 0.1);
  const ambVerb = ctx.createConvolver();
  ambVerb.normalize = false;
  ambVerb.buffer = banks.ir('rua', 1.7, 0.75);
  ambVerb.connect(gain(ctx, 0.8, ambLine));

  const duckMusic = gain(ctx, 1, bus.music);

  const sendVol = {
    music: gain(ctx, 0.49 * BUS_TRIM.music, verb),
    sfx: gain(ctx, 0.64 * BUS_TRIM.sfx, verb),
    ambient: gain(ctx, 1, ambVerb),
    voice: gain(ctx, 0.72 * BUS_TRIM.voice, verb),
  } satisfies Record<BusName, GainNode>;

  const voiceIn = gain(ctx, 1.7, bus.voice);
  const rig: Rig = {
    ctx,
    clock,
    offline: offlineEnd !== null,
    banks,
    in: {
      music: gain(ctx, 1, duckMusic),
      sfx: gain(ctx, 1, bus.sfx),
      sfxPhone: phoneLine(ctx, bus.sfx, 0.05),
      ambient: ambLine,
      room: gain(ctx, 1, bus.ambient),
      voice: voiceIn,
      voicePhone: phoneLine(ctx, bus.voice, 0.14),
      voiceRadio: radioLine(ctx, bus.voice),
    },
    send: { music: sendVol.music, sfx: sendVol.sfx, ambient: sendVol.ambient, voice: sendVol.voice },
    bus,
    sendVol,
    duck: { ambient: duckAmb, music: duckMusic },
    master,
    muteGain,
    sfxActive: 0,
  };
  return rig;
}

/** Ganho perceptual (curva quadrática) para volumes 0..1. */
export const volCurve = (v: number): number => {
  const x = clamp(Number.isFinite(v) ? v : 0, 0, 1);
  return x * x;
};
