// =============================================================================
// QAP — áudio · o "tempo parando" da vaga zero (1.1)
//
// Referência: o clímax de Papers, Please. Ao abrir a negociação com o Regional:
//  · o telefone do Regional toca diferente (dois toques curtos, mais graves);
//  · a central inteira (zumbido, ambiente, música, os outros telefones) passa por um passa-baixa
//    — como ouvir debaixo d'água — e cai de volume;
//  · entra um pulso grave (≈ 60 bpm, coração) que acelera quando o Saulo endurece e desacelera
//    quando ele cede, e uma nota sustentada de sintetizador;
//  · a voz do fone continua limpa, em primeiro plano; a bolacha do Saulo faz "crec";
//  · cada argumento escolhido carimba com um som seco de papel.
// Ao fechar, o filtro abre e o mundo volta de uma vez.
//
// As vozes e os sons próprios da tela vão direto para os barramentos (sem o filtro).
// =============================================================================
import { every, type Rig } from './core';
import { filt, gain, osc, stopSafe, clamp } from './dsp';
import { noiseHit, tone } from './kit';

const OPEN = 18000;
const UNDERWATER = 380;

export class FreezeFx {
  private lpAmb: BiquadFilterNode | null = null;
  private lpMusic: BiquadFilterNode | null = null;
  private lpSfx: BiquadFilterNode | null = null;
  private duck: GainNode | null = null;
  private drone: { stop(t: number): void } | null = null;
  private cancelPulse: (() => void) | null = null;
  bpm = 60;
  on = false;

  constructor(private rig: Rig) {}

  /** insere (uma vez) os filtros entre os barramentos da central e a saída; abertos, são transparentes */
  private ensureRouting(): void {
    if (this.lpAmb) return;
    const rig = this.rig;
    const ctx = rig.ctx;
    // ambiente da sala e da ligação: barramento → passa-baixa → atenuação → master
    this.lpAmb = filt(ctx, 'lowpass', OPEN, 0.7);
    this.duck = gain(ctx, 1);
    rig.bus.ambient.disconnect();
    rig.bus.ambient.connect(this.lpAmb).connect(this.duck).connect(rig.master);
    // música (casa/temas: normalmente desligada no plantão)
    this.lpMusic = filt(ctx, 'lowpass', OPEN, 0.7);
    rig.bus.music.disconnect();
    rig.bus.music.connect(this.lpMusic).connect(rig.master);
    // sfx comuns (os outros telefones tocando na fila): entrada → passa-baixa → barramento
    this.lpSfx = filt(ctx, 'lowpass', OPEN, 0.7);
    (rig.in.sfx as GainNode).disconnect();
    (rig.in.sfx as GainNode).connect(this.lpSfx).connect(rig.bus.sfx);
  }

  enter(bpm: number): void {
    this.ensureRouting();
    const rig = this.rig;
    const now = rig.clock.now;
    this.bpm = clamp(bpm, 40, 140);
    if (!this.on) {
      for (const f of [this.lpAmb!, this.lpMusic!, this.lpSfx!]) {
        f.frequency.cancelScheduledValues(now);
        f.frequency.setValueAtTime(f.frequency.value, now);
        f.frequency.exponentialRampToValueAtTime(UNDERWATER, now + 1.1);
      }
      this.duck!.gain.cancelScheduledValues(now);
      this.duck!.gain.setTargetAtTime(0.45, now, 0.35);
      this.ring(now + 0.05);
      this.startDrone(now + 0.9);
      this.cancelPulse = every(
        rig.clock,
        now + 1.25,
        () => 60 / this.bpm,
        (t) => this.thump(t),
      );
    }
    this.on = true;
  }

  setBpm(bpm: number): void {
    this.bpm = clamp(bpm, 40, 140);
  }

  exit(): void {
    if (!this.on) return;
    this.on = false;
    const rig = this.rig;
    const now = rig.clock.now;
    this.cancelPulse?.();
    this.cancelPulse = null;
    this.drone?.stop(now);
    this.drone = null;
    // o mundo volta "de uma vez": o filtro abre rápido
    for (const f of [this.lpAmb, this.lpMusic, this.lpSfx]) {
      if (!f) continue;
      f.frequency.cancelScheduledValues(now);
      f.frequency.setValueAtTime(Math.max(UNDERWATER, f.frequency.value), now);
      f.frequency.exponentialRampToValueAtTime(OPEN, now + 0.35);
    }
    if (this.duck) {
      this.duck.gain.cancelScheduledValues(now);
      this.duck.gain.setTargetAtTime(1, now, 0.12);
    }
  }

  /** o telefone do Regional: dois toques curtos, mais graves que os outros */
  ring(t = this.rig.clock.now): void {
    const rig = this.rig;
    const dest = rig.bus.sfx;
    for (const dt of [0, 0.42]) {
      tone(rig, dest, t + dt, { type: 'square', freq: 330, peak: 0.12, attack: 0.01, hold: 0.22, decay: 0.08, lp: 1400, linear: true });
      tone(rig, dest, t + dt, { type: 'square', freq: 392, peak: 0.08, attack: 0.01, hold: 0.22, decay: 0.08, lp: 1400, linear: true });
    }
  }

  /** a bolacha água e sal do Saulo */
  crec(t = this.rig.clock.now): void {
    const rig = this.rig;
    const dest = rig.in.voicePhone;
    for (let i = 0; i < 4; i++) noiseHit(rig, dest, t + i * 0.035 + Math.random() * 0.02, { type: 'bandpass', freq: 2600 + Math.random() * 1600, q: 1.4, peak: 0.5 - i * 0.08, attack: 0.001, decay: 0.03, crackle: i % 2 === 1 });
  }

  /** o argumento "carimba" (papel seco) */
  stamp(t = this.rig.clock.now): void {
    const rig = this.rig;
    const dest = rig.bus.sfx;
    noiseHit(rig, dest, t, { type: 'lowpass', freq: 900, peak: 0.55, attack: 0.001, decay: 0.07 });
    tone(rig, dest, t, { freq: 120, freqEnd: 70, glide: 0.05, peak: 0.35, attack: 0.002, decay: 0.08 });
    noiseHit(rig, dest, t + 0.012, { type: 'highpass', freq: 3000, peak: 0.12, attack: 0.001, decay: 0.04 });
  }

  /** sinal de ocupado (sem acordo) */
  busy(t = this.rig.clock.now): void {
    const rig = this.rig;
    for (let i = 0; i < 3; i++) tone(rig, rig.in.sfxPhone, t + i * 0.5, { freq: 425, peak: 0.16, attack: 0.005, hold: 0.24, decay: 0.03, linear: true });
  }

  /** o "Manda.": um acorde que se resolve */
  resolve(t = this.rig.clock.now): void {
    const rig = this.rig;
    const dest = rig.bus.sfx;
    for (const [f, d] of [[220, 0], [277.2, 0.06], [329.6, 0.12], [440, 0.2]] as [number, number][]) {
      tone(rig, dest, t + d, { type: 'triangle', freq: f, peak: 0.07, attack: 0.04, hold: 0.5, decay: 1.2, lp: 2600, send: 0.4 });
    }
  }

  private thump(t: number): void {
    const rig = this.rig;
    const dest = rig.bus.sfx;
    tone(rig, dest, t, { freq: 58, freqEnd: 40, glide: 0.09, peak: 0.55, attack: 0.008, decay: 0.2 });
    noiseHit(rig, dest, t, { type: 'lowpass', freq: 140, peak: 0.22, decay: 0.06 });
    const dt = clamp((0.3 * 60) / this.bpm, 0.18, 0.32);
    tone(rig, dest, t + dt, { freq: 66, freqEnd: 46, glide: 0.08, peak: 0.32, attack: 0.008, decay: 0.15 });
  }

  /** nota sustentada (dois osciladores desafinados num passa-baixa, com um sub grave) */
  private startDrone(t: number): void {
    const rig = this.rig;
    const ctx = rig.ctx;
    const out = gain(ctx, 0, rig.bus.sfx);
    const lp = filt(ctx, 'lowpass', 520, 0.9);
    lp.connect(out);
    const a = osc(ctx, 'sawtooth', 110, lp);
    const b = osc(ctx, 'sawtooth', 110, lp);
    b.detune.value = 9;
    const sub = osc(ctx, 'sine', 55, out);
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(0.055, t + 1.8);
    // um vibrato lento no corte do filtro: a tensão "respira"
    const lfo = osc(ctx, 'sine', 0.18);
    const lfoG = gain(ctx, 180);
    lfo.connect(lfoG);
    lfoG.connect(lp.frequency);
    for (const s of [a, b, sub, lfo]) s.start(t);
    this.drone = {
      stop: (at: number) => {
        out.gain.cancelScheduledValues(at);
        out.gain.setValueAtTime(out.gain.value, at);
        out.gain.linearRampToValueAtTime(0, at + 0.25);
        for (const s of [a, b, sub, lfo]) stopSafe(s, at + 0.3);
      },
    };
  }
}
