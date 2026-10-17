// =============================================================================
// QAP — Emergency Dispatch — motor de áudio (Web Audio, 100% sintetizado em tempo real)
//
//   import { audio } from './audio';
//   window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
//
// Sem AudioContext (Node, testes, SSR) todos os métodos viram no-ops.
// Nada acessa DOM/AudioContext na importação.
// =============================================================================
import type { AmbientId, LineStyle, VoiceId } from '../../engine/types';
import { AMBIENT_IDS, AmbientMixer } from './ambient';
import { buildRig, BUS_TRIM, volCurve, type BusName, type Rig } from './core';
import { clamp, mulberry32, type Rand } from './dsp';
import { noiseBed } from './kit';
import { HomeMusic, playTheme as startTheme, type Theme, type ThemeKind } from './music';
import { CentralHum, Heart, Metronome, ringBurst, RingLoop } from './phone';
import { LOW_PRIORITY, playSfx, SFX_NAMES, type SfxName } from './sfx';
import { buildPlan, MAX_LINE, parseText, PROFILES, specFor, speechSeed, type Channel } from './speech';
import { Speaker } from './voice';
import { FreezeFx } from './vagazero';

export type { SfxName } from './sfx';
export type { ThemeKind } from './music';
export type { Channel as VoiceChannel } from './speech';
export { AMBIENT_IDS } from './ambient';
export { SFX_NAMES } from './sfx';

export interface Volumes {
  master: number;
  music: number;
  sfx: number;
  ambient: number;
  voice: number;
}

export interface VoiceHandle {
  stop(): void;
  /** duração prevista da fala em segundos (calculada mesmo sem áudio) */
  duration: number;
}

export interface VoiceOptions {
  style?: LineStyle;
  rate?: number;
  /**
   * Extensão opcional: força o canal. Padrão: perfis de chamador ('homem',
   * 'mulher', 'idoso'...) soam pela linha telefônica enquanto o zumbido da
   * central está ligado (plantão) e "na sala" fora dele; simone/peixoto/
   * henrique/bene/família soam na sala; 'radio' pelo rádio.
   */
  channel?: Channel;
  /**
   * Segundos que o texto leva para aparecer na tela. A fala acelera um pouco e,
   * se ainda sobrar, termina junto com o texto (para não continuar falando sozinha).
   */
  fit?: number;
}

export const THEME_KINDS: readonly ThemeKind[] = ['titulo', 'final_bom', 'final_normal', 'final_ruim', 'gameover', 'jornal'];
const LOOPING_THEMES = new Set<ThemeKind>(['titulo', 'final_bom', 'final_normal', 'final_ruim']);
const VOICE_SET = new Set<string>(Object.keys(PROFILES));
const AMBIENT_SET = new Set<string>(AMBIENT_IDS);
const SFX_SET = new Set<string>(SFX_NAMES);
const MAX_AMBIENT_LAYERS = 4;

const NOOP_HANDLE: VoiceHandle = { stop() {}, duration: 0 };

interface Want {
  hum: boolean;
  ring: number | null;
  ambient: { ids: AmbientId[]; intensity: number };
  home: { mood: number; desgaste: number } | null;
  theme: ThemeKind | null;
  metronome: { bpm: number; onTick?: (i: number, accent: boolean) => void } | null;
  heart: number | null;
}

interface Systems {
  hum: CentralHum;
  ring: RingLoop;
  amb: AmbientMixer;
  metro: Metronome;
  heart: Heart;
}

type AnyAudioContextCtor = new (opts?: AudioContextOptions) => AudioContext;
type AnyOfflineCtor = new (channels: number, length: number, sampleRate: number) => OfflineAudioContext;

export class AudioEngine {
  private ctx: BaseAudioContext | null = null;
  private rig: Rig | null = null;
  private sys: Systems | null = null;
  private unlocking: Promise<void> | null = null;
  private unavailable = false;
  private offline = false;
  private vols: Volumes = { master: 0.8, music: 0.7, sfx: 0.8, ambient: 0.7, voice: 0.85 };
  private isMuted = false;
  private home: HomeMusic | null = null;
  private theme: Theme | null = null;
  private voices: { profile: VoiceId; sp: Speaker }[] = [];
  private radios: { stop(): void; end: number }[] = [];
  private radioUntil = 0;
  /** até quando a fala do telefone/sala atual vai (o rádio fica baixo enquanto isso) */
  private voiceUntil = 0;
  private lastSfx = new Map<string, number>();
  private lastRingOnce = -10;
  private duckUntil = { ambient: 0, music: 0 };
  private rnd: Rand | null = null;
  private autoBound = false;
  private want: Want = {
    hum: false,
    ring: null,
    ambient: { ids: [], intensity: 0.6 },
    home: null,
    theme: null,
    metronome: null,
    heart: null,
  };

  // ---------------------------------------------------------------- ciclo de vida
  /** Cria/retoma o AudioContext. Chame num gesto do usuário. Pode ser chamado várias vezes. */
  unlock(): Promise<void> {
    if (this.offline || this.unavailable) return Promise.resolve();
    if (!this.ctx) {
      const g = globalThis as unknown as { AudioContext?: AnyAudioContextCtor; webkitAudioContext?: AnyAudioContextCtor };
      const AC = g.AudioContext ?? g.webkitAudioContext;
      if (!AC) {
        this.unavailable = true;
        return Promise.resolve();
      }
      let ctx: AudioContext;
      try {
        ctx = new AC({ latencyHint: 'interactive' });
      } catch {
        try {
          ctx = new AC();
        } catch {
          this.unavailable = true;
          return Promise.resolve();
        }
      }
      try {
        // desbloqueio iOS: um buffer mudo
        const b = ctx.createBuffer(1, 1, 22050);
        const s = ctx.createBufferSource();
        s.buffer = b;
        s.connect(ctx.destination);
        s.start(0);
      } catch {
        /* noop */
      }
      this.attach(ctx, null);
    }
    const ctx = this.ctx as AudioContext;
    if (ctx.state === 'running' || typeof ctx.resume !== 'function') return Promise.resolve();
    if (!this.unlocking) {
      this.unlocking = ctx
        .resume()
        .catch(() => undefined)
        .then(() => {
          this.unlocking = null;
        });
    }
    return this.unlocking;
  }

  /** true quando o contexto existe e está tocando. */
  get ready(): boolean {
    if (this.offline) return true;
    return !!this.ctx && this.ctx.state === 'running';
  }

  /**
   * Extensão: registra ouvintes de gesto (pointerdown/keydown/touchend) que
   * chamam unlock() — e voltam a chamar se o navegador suspender o contexto.
   */
  autoUnlock(target: EventTarget | null = typeof window !== 'undefined' ? window : null): void {
    if (this.autoBound || !target) return;
    this.autoBound = true;
    const h = (): void => {
      if (!this.ready) void this.unlock();
    };
    for (const ev of ['pointerdown', 'keydown', 'touchend']) target.addEventListener(ev, h, { passive: true });
  }

  private attach(ctx: BaseAudioContext, offlineEnd: number | null, offset = 0): void {
    this.ctx = ctx;
    this.rig = buildRig(ctx, offlineEnd, offset);
    this.sys = {
      hum: new CentralHum(this.rig),
      ring: new RingLoop(this.rig),
      amb: new AmbientMixer(this.rig),
      metro: new Metronome(this.rig),
      heart: new Heart(this.rig),
    };
    this.rnd = mulberry32((Date.now() ^ 0x5eed) >>> 0);
    this.applyVolumes(true);
    this.applyMute(true);
    this.applyWanted();
  }

  private applyWanted(): void {
    const s = this.sys;
    const rig = this.rig;
    if (!s || !rig) return;
    const w = this.want;
    try {
      if (w.hum) s.hum.start();
      if (w.ring !== null) s.ring.start(w.ring);
      if (w.ambient.ids.length) s.amb.set(w.ambient.ids, w.ambient.intensity);
      if (w.home) this.home = new HomeMusic(rig, w.home.mood, w.home.desgaste);
      else if (w.theme) this.theme = startTheme(rig, w.theme);
      if (w.metronome) {
        s.metro.onTick = w.metronome.onTick;
        s.metro.start(w.metronome.bpm);
      }
      if (w.heart !== null) s.heart.start(w.heart);
    } catch (e) {
      console.warn('[audio] estado pendente', e);
    }
  }

  // ---------------------------------------------------------------- volumes
  setVolumes(v: Partial<Volumes>): void {
    if (!v) return;
    for (const k of ['master', 'music', 'sfx', 'ambient', 'voice'] as const) {
      const x = v[k];
      if (typeof x === 'number' && Number.isFinite(x)) this.vols[k] = clamp(x, 0, 1);
    }
    this.applyVolumes(false);
  }

  /** Extensão: volumes atuais (0..1). */
  get volumes(): Volumes {
    return { ...this.vols };
  }

  private applyVolumes(immediate: boolean): void {
    const rig = this.rig;
    if (!rig) return;
    const now = rig.clock.now;
    const set = (p: AudioParam, v: number): void => {
      if (immediate) p.value = v;
      else p.setTargetAtTime(v, now, 0.03);
    };
    set(rig.master.gain, volCurve(this.vols.master));
    for (const b of ['music', 'sfx', 'ambient', 'voice'] as BusName[]) {
      const g = volCurve(this.vols[b]) * BUS_TRIM[b];
      set(rig.bus[b].gain, g);
      if (b !== 'ambient') set(rig.sendVol[b].gain, g);
    }
  }

  mute(m: boolean): void {
    this.isMuted = !!m;
    this.applyMute(false);
  }

  /** Extensão: estado do mudo. */
  get muted(): boolean {
    return this.isMuted;
  }

  private applyMute(immediate: boolean): void {
    const rig = this.rig;
    if (!rig) return;
    const v = this.isMuted ? 0 : 1;
    if (immediate) rig.muteGain.gain.value = v;
    else rig.muteGain.gain.setTargetAtTime(v, rig.clock.now, 0.02);
  }

  // ---------------------------------------------------------------- central
  startCentralHum(): void {
    this.want.hum = true;
    this.sys?.hum.start();
  }

  stopCentralHum(): void {
    this.want.hum = false;
    this.sys?.hum.stop();
  }

  /** Toque em loop enquanto há ligações esperando. level 0..1 = progressão do jogo. */
  ringLoop(on: boolean, level: number): void {
    const L = clamp(Number.isFinite(level) ? level : 0, 0, 1);
    this.want.ring = on ? L : null;
    const s = this.sys;
    if (!s) return;
    if (on) {
      s.ring.level = L;
      s.ring.start(L);
    } else s.ring.stop();
  }

  /** Um toque. phantom = desafinado/fantasmagórico (exaustão). */
  ringOnce(level: number, opts?: { phantom?: boolean }): void {
    const rig = this.rig;
    const s = this.sys;
    if (!rig || !s) return;
    const now = rig.clock.now;
    const phantom = !!opts?.phantom;
    if (!phantom && (s.ring.on || now - this.lastRingOnce < 0.9)) return;
    if (!phantom) this.lastRingOnce = now;
    ringBurst(rig, rig.in.sfx, now + 0.02, phantom ? 1.15 : 1.0, clamp(Number.isFinite(level) ? level : 0, 0, 1), phantom, this.rand());
  }

  /** Crossfade (~0,8 s) para este conjunto de camadas de fundo da ligação. [] = silêncio. */
  setAmbient(layers: AmbientId[], intensity = 0.6): void {
    const ids: AmbientId[] = [];
    for (const id of layers ?? []) {
      if (AMBIENT_SET.has(id) && !ids.includes(id)) ids.push(id);
      if (ids.length >= MAX_AMBIENT_LAYERS) break;
    }
    const x = clamp(Number.isFinite(intensity) ? intensity : 0.6, 0, 1);
    this.want.ambient = { ids, intensity: x };
    this.sys?.amb.set(ids, x);
  }

  // ---------------------------------------------------------------- vozes
  /**
   * Balbucio sincronizado ao texto (~1 sílaba a cada 2,5 caracteres, máx. ~6 s).
   * Determinístico: o mesmo texto + perfil + estilo soa sempre igual.
   * Uma nova fala do mesmo perfil corta a anterior.
   */
  voice(text: string, profile: VoiceId, opts?: VoiceOptions): VoiceHandle {
    if (typeof text !== 'string' || !text.trim()) return NOOP_HANDLE;
    const prof: VoiceId = VOICE_SET.has(profile) ? profile : 'homem';
    const o = opts ?? {};
    const spec = specFor(prof, o.style, o.rate ?? 1);
    let ch: Channel = o.channel ?? spec.channel;
    if (!o.channel && ch === 'phone' && !this.want.hum) ch = 'room';
    if (ch === 'radio') return this.transmit(text, prof, o.style, o.rate ?? 1);
    if (ch === 'room' && spec.verb < 0.05) spec.verb = 0.05;
    if (ch !== 'room') spec.verb = 0;
    const r = speechSeed(text, prof, o.style);
    const maxDur = o.fit && o.fit > 0 ? Math.max(0.6, Math.min(MAX_LINE, o.fit + 0.25)) : MAX_LINE;
    const plan = buildPlan(parseText(text), spec, r, maxDur);
    const rig = this.rig;
    if (!rig || !plan.segs.length) return { stop() {}, duration: plan.dur };
    const now = rig.clock.now;
    const t0 = now + 0.03;
    // uma pessoa fala de cada vez: a fala nova corta quem ainda estava falando (de qualquer perfil)
    this.voices = this.voices.filter((v) => v.sp.alive);
    for (const v of this.voices) v.sp.stop(now, 0.05);
    this.voices = [];
    this.voiceUntil = t0 + plan.dur;
    const dest = ch === 'phone' ? rig.in.voicePhone : rig.in.voice;
    const sp = new Speaker(rig, dest, spec, t0, r);
    sp.play(t0, plan);
    sp.finish(t0 + plan.dur + 0.04);
    this.voices.push({ profile: prof, sp });
    this.duck(ch === 'room' ? 'music' : 'ambient', t0, t0 + plan.dur);
    return { stop: () => sp.stop(rig.clock.now, 0.06), duration: plan.dur };
  }

  /**
   * Rádio HT das viaturas: clique de squelch + balbucio em banda estreita +
   * chiado. Transmissões entram em fila (half-duplex). Extensão: devolve um
   * VoiceHandle (duration inclui a espera na fila).
   */
  radio(text: string, profile: VoiceId = 'radio'): VoiceHandle {
    if (typeof text !== 'string' || !text.trim()) return NOOP_HANDLE;
    return this.transmit(text, VOICE_SET.has(profile) ? profile : 'radio', undefined, 1);
  }

  private transmit(text: string, prof: VoiceId, style: LineStyle | undefined, rate: number): VoiceHandle {
    const spec = specFor(prof, style, 1.05 * rate, { channel: 'radio', verb: 0, warm: 0 });
    const r = speechSeed(text, 'radio:' + prof, style);
    const plan = buildPlan(parseText(text), spec, r);
    const rig = this.rig;
    if (!rig) return { stop() {}, duration: plan.dur + 0.45 };
    const now = rig.clock.now;
    this.radios = this.radios.filter((x) => x.end > now);
    // rádio atrasado demais fica fora de sincronia com o texto: só o clique do PTT
    if (this.radios.length >= 2 || this.radioUntil > now + 1.5) {
      playSfx(rig, 'radio_on', now + 0.02, r);
      playSfx(rig, 'radio_off', now + 0.22, r);
      return { stop() {}, duration: 0.25 };
    }
    // com alguém falando no telefone ou na sala, o rádio fica baixo, ao fundo
    if (this.voiceUntil > now) spec.level *= 0.35;
    const t0 = Math.max(now + 0.03, this.radioUntil + 0.25);
    const dest = rig.in.voiceRadio;
    playSfx(rig, 'radio_on', t0, r);
    const bed = noiseBed(rig, dest, t0, { color: 'white', type: 'bandpass', freq: 1800, q: 0.5, level: 0.035, fade: 0.02 });
    const cr = noiseBed(rig, dest, t0, { buffer: rig.banks.crackle(), type: 'highpass', freq: 800, level: 0.22, fade: 0.02 });
    const ts = t0 + 0.14;
    const sp = new Speaker(rig, dest, spec, ts, r);
    sp.play(ts, plan);
    sp.finish(ts + plan.dur + 0.03);
    const tEnd = ts + plan.dur + 0.08;
    bed.stop(tEnd);
    cr.stop(tEnd);
    playSfx(rig, 'radio_off', tEnd, r);
    this.radioUntil = tEnd + 0.2;
    const entry = {
      end: tEnd + 0.3,
      stop: () => {
        const n = rig.clock.now;
        sp.stop(n, 0.04);
        bed.stop(n);
        cr.stop(n);
      },
    };
    this.radios.push(entry);
    return { stop: entry.stop, duration: tEnd + 0.25 - now };
  }

  private duck(which: 'ambient' | 'music', t0: number, t1: number): void {
    const rig = this.rig;
    if (!rig) return;
    const p = rig.duck[which].gain;
    const until = Math.max(t1, this.duckUntil[which]);
    this.duckUntil[which] = until;
    p.cancelScheduledValues(t0);
    p.setTargetAtTime(which === 'music' ? 0.6 : 0.55, t0, 0.06);
    p.setTargetAtTime(1, until, 0.35);
  }

  // ---------------------------------------------------------------- efeitos
  sfx(name: SfxName): void {
    const rig = this.rig;
    if (!rig || !SFX_SET.has(name)) return;
    const now = rig.clock.now;
    const minGap = name === 'hover' ? 0.04 : name === 'type' ? 0.025 : 0.012;
    const last = this.lastSfx.get(name) ?? -1;
    if (now - last < minGap && !this.offline) return;
    this.lastSfx.set(name, now);
    if (!this.offline && rig.sfxActive > 24 && LOW_PRIORITY.has(name)) return;
    try {
      const end = playSfx(rig, name, now + 0.005, this.rand());
      if (!this.offline) {
        rig.sfxActive++;
        rig.clock.at(end, () => {
          rig.sfxActive = Math.max(0, rig.sfxActive - 1);
        });
      }
    } catch (e) {
      console.warn('[audio] sfx', name, e);
    }
    if (name === 'photo') {
      // "por um segundo, a central fica em silêncio"
      for (const p of [(rig.in.room as GainNode).gain, rig.duck.ambient.gain]) {
        p.cancelScheduledValues(now);
        p.setTargetAtTime(0.12, now + 0.05, 0.12);
        p.setTargetAtTime(1, now + 1.4, 0.5);
      }
      this.duckUntil.ambient = Math.max(this.duckUntil.ambient, now + 1.4);
    }
  }

  /** Metrônomo da RCP: bloco de madeira no bpm; acento a cada 30ª batida. onTick (extensão) sincroniza visuais. */
  metronome(bpm: number, on: boolean, onTick?: (index: number, accent: boolean) => void): void {
    const b = clamp(Number.isFinite(bpm) ? bpm : 110, 20, 260);
    this.want.metronome = on ? { bpm: b, onTick } : null;
    const s = this.sys;
    if (!s) return;
    if (on) {
      s.metro.bpm = b;
      if (onTick) s.metro.onTick = onTick;
      s.metro.start(b);
    } else {
      s.metro.stop();
      s.metro.onTick = undefined;
    }
  }

  heartbeat(on: boolean, bpm = 72): void {
    const b = clamp(Number.isFinite(bpm) ? bpm : 72, 30, 220);
    this.want.heart = on ? b : null;
    const s = this.sys;
    if (!s) return;
    if (on) {
      s.heart.bpm = b;
      s.heart.start(b);
    } else s.heart.stop();
  }

  // ---------------------------------------------------------------- casa / temas
  /** mood 0..1 (Laços): baixo = menor e esparso; alto = maior e cheio. desgaste > 60 traz o zumbido para casa. */
  startHomeMusic(mood: number, desgaste: number): void {
    this.want.home = { mood, desgaste };
    this.want.theme = null;
    const rig = this.rig;
    if (!rig) return;
    if (this.home) {
      this.home.update(mood, desgaste);
      return;
    }
    this.theme?.stop();
    this.theme = null;
    this.home = new HomeMusic(rig, mood, desgaste);
  }

  updateHomeMusic(mood: number, desgaste: number): void {
    if (this.want.home) this.want.home = { mood, desgaste };
    this.home?.update(mood, desgaste);
  }

  stopHomeMusic(): void {
    this.want.home = null;
    this.home?.stop();
    this.home = null;
  }

  /** Temas: titulo/final_* tocam em loop até stopTheme(); gameover e jornal tocam uma vez. */
  playTheme(kind: 'titulo' | 'final_bom' | 'final_normal' | 'final_ruim' | 'gameover' | 'jornal'): void {
    if (!THEME_KINDS.includes(kind)) return;
    this.want.theme = LOOPING_THEMES.has(kind) ? kind : null;
    const rig = this.rig;
    if (!rig) return;
    const now = rig.clock.now;
    if (this.theme && this.theme.kind === kind && this.theme.end > now) return; // já tocando
    this.theme?.stop();
    this.home?.stop();
    this.home = null;
    this.want.home = null;
    this.theme = startTheme(rig, kind);
  }

  stopTheme(): void {
    this.want.theme = null;
    this.theme?.stop();
    this.theme = null;
  }

  // ---------------------------------------------------------------- 1.1: vaga zero (o tempo parando)
  private freezeFx: FreezeFx | null = null;

  /**
   * Liga/desliga o "tempo parando" da negociação de vaga zero: a central passa por um passa-baixa
   * e baixa, entra um pulso grave (bpm sobe com a resistência do plantonista) e uma nota
   * sustentada; a voz do fone fica limpa. Chamar de novo com `on` só atualiza o bpm.
   */
  vagaZero(on: boolean, bpm = 60): void {
    const rig = this.rig;
    if (!rig) return;
    try {
      this.freezeFx ??= new FreezeFx(rig);
      if (!on) this.freezeFx.exit();
      else if (this.freezeFx.on) this.freezeFx.setBpm(bpm);
      else this.freezeFx.enter(bpm);
    } catch {
      /* sem áudio: segue o jogo */
    }
  }

  /** sons próprios da tela da vaga zero (fora do filtro da central) */
  vagaZeroSfx(kind: 'crec' | 'stamp' | 'busy' | 'resolve' | 'ring'): void {
    const rig = this.rig;
    if (!rig) return;
    try {
      this.freezeFx ??= new FreezeFx(rig);
      this.freezeFx[kind]();
    } catch {
      /* noop */
    }
  }

  /** Para tudo (não fecha o contexto). */
  stopAll(): void {
    this.freezeFx?.exit();
    this.want = { hum: false, ring: null, ambient: { ids: [], intensity: 0.6 }, home: null, theme: null, metronome: null, heart: null };
    const s = this.sys;
    const rig = this.rig;
    if (!s || !rig) return;
    const now = rig.clock.now;
    s.hum.stop();
    s.ring.stop();
    s.amb.stopAll();
    s.metro.stop();
    s.heart.stop();
    for (const v of this.voices) v.sp.stop(now, 0.08);
    this.voices = [];
    for (const r of this.radios) r.stop();
    this.radios = [];
    this.radioUntil = 0;
    this.voiceUntil = 0;
    this.home?.stop();
    this.home = null;
    this.theme?.stop();
    this.theme = null;
  }

  private rand(): Rand {
    if (!this.rnd) this.rnd = mulberry32(12345);
    return this.rnd;
  }

  // ---------------------------------------------------------------- render offline (testes)
  /**
   * Renderiza num OfflineAudioContext (sem tocar nada). Útil para medir
   * RMS/pico. Devolve null onde não há OfflineAudioContext. preroll (s)
   * atrasa o início dos sons — o compressor do Chrome começa "fechado" nos
   * primeiros ~300 ms de um contexto novo.
   *   const buf = await AudioEngine.renderOffline(3, (e) => e.sfx('stamp'));
   */
  static async renderOffline(seconds: number, play: (e: AudioEngine) => void, sampleRate = 44100, preroll = 0): Promise<AudioBuffer | null> {
    const g = globalThis as unknown as { OfflineAudioContext?: AnyOfflineCtor; webkitOfflineAudioContext?: AnyOfflineCtor };
    const OAC = g.OfflineAudioContext ?? g.webkitOfflineAudioContext;
    if (!OAC) return null;
    const total = seconds + Math.max(0, preroll);
    const ctx = new OAC(2, Math.max(1, Math.ceil(total * sampleRate)), sampleRate);
    const e = new AudioEngine();
    e.offline = true;
    e.attach(ctx, total, Math.max(0, preroll));
    play(e);
    const buf = await ctx.startRendering();
    e.rig?.clock.dispose();
    return buf;
  }
}

/** Instância única usada pelo jogo. */
export const audio = new AudioEngine();
export default audio;
