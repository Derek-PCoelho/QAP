// =============================================================================
// QAP — Emergency Dispatch — laboratório de áudio (página de teste manual: /audio-lab.html)
// Botões para todos os sons + medição offline (RMS/pico) exposta em
// window.__audioLab para testes automatizados.
// =============================================================================
import type { AmbientId, LineStyle, VoiceId } from '../../engine/types';
import { AMBIENT_IDS, audio, AudioEngine, SFX_NAMES, THEME_KINDS, type ThemeKind, type VoiceChannel } from './index';
import { PROFILES } from './speech';

const STYLES: LineStyle[] = ['arrastada', 'sussurro', 'grito', 'choro', 'tremida', 'calma', 'ofegante', 'rindo', 'fantasma'];
const VOICES = Object.keys(PROFILES) as VoiceId[];
const SAMPLE = 'Moço, pelo amor de Deus, meu marido caiu no banheiro e não acorda! Rua das Flores, 214.';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
}

function section(title: string): HTMLElement {
  const s = el('section');
  s.append(el('h2', {}, title));
  document.getElementById('app')!.append(s);
  return s;
}

function button(parent: HTMLElement, label: string, fn: () => void, id?: string): HTMLButtonElement {
  const b = el('button', { type: 'button', ...(id ? { id } : {}) }, label);
  b.addEventListener('click', () => {
    void audio.unlock();
    fn();
  });
  parent.append(b);
  return b;
}

function slider(parent: HTMLElement, label: string, min: number, max: number, step: number, value: number, fn: (v: number) => void): HTMLInputElement {
  const wrap = el('label', { class: 'slider' });
  const out = el('output', {}, String(value));
  const i = el('input', { type: 'range', min: String(min), max: String(max), step: String(step), value: String(value) });
  i.addEventListener('input', () => {
    out.textContent = i.value;
    fn(Number(i.value));
  });
  wrap.append(el('span', {}, label), i, out);
  parent.append(wrap);
  return i;
}

function select<T extends string>(parent: HTMLElement, label: string, opts: readonly T[], value: T): HTMLSelectElement {
  const wrap = el('label', { class: 'field' });
  const s = el('select');
  for (const o of opts) {
    const op = el('option', { value: o }, o);
    if (o === value) op.selected = true;
    s.append(op);
  }
  wrap.append(el('span', {}, label), s);
  parent.append(wrap);
  return s;
}

const status = el('p', { id: 'status', class: 'status' }, 'Áudio bloqueado — clique em qualquer botão.');

function build(): void {
  const app = document.getElementById('app')!;
  app.append(status);
  setInterval(() => {
    status.textContent = audio.ready ? 'Áudio pronto.' : 'Áudio bloqueado — clique em qualquer botão.';
    status.dataset.ready = String(audio.ready);
  }, 300);

  // ---- geral
  const g = section('Geral');
  button(g, 'Desbloquear', () => void audio.unlock(), 'unlock');
  button(g, 'Parar tudo', () => audio.stopAll(), 'stopAll');
  const mute = el('label', { class: 'check' });
  const mi = el('input', { type: 'checkbox' });
  mi.addEventListener('change', () => audio.mute(mi.checked));
  mute.append(mi, el('span', {}, 'mudo'));
  g.append(mute);
  const vols = el('div', { class: 'row' });
  g.append(vols);
  const v = audio.volumes;
  for (const k of ['master', 'music', 'sfx', 'ambient', 'voice'] as const) slider(vols, k, 0, 1, 0.05, v[k], (x) => audio.setVolumes({ [k]: x }));

  // ---- central
  const c = section('Central');
  let level = 0.3;
  slider(c, 'nível do dia', 0, 1, 0.05, level, (x) => {
    level = x;
    if (ringing) audio.ringLoop(true, level);
  });
  let hum = false;
  let ringing = false;
  button(c, 'Zumbido on/off', () => {
    hum = !hum;
    if (hum) audio.startCentralHum();
    else audio.stopCentralHum();
  }, 'hum');
  button(c, 'Toque em loop on/off', () => {
    ringing = !ringing;
    audio.ringLoop(ringing, level);
  }, 'ringLoop');
  button(c, 'Um toque', () => audio.ringOnce(level), 'ringOnce');
  button(c, 'Toque fantasma', () => audio.ringOnce(level, { phantom: true }), 'ringPhantom');
  let bpm = 110;
  let metro = false;
  let heart = false;
  slider(c, 'bpm', 40, 180, 1, bpm, (x) => {
    bpm = x;
    if (metro) audio.metronome(bpm, true);
    if (heart) audio.heartbeat(true, bpm);
  });
  const beatOut = el('span', { class: 'beat' }, '·');
  button(c, 'Metrônomo RCP on/off', () => {
    metro = !metro;
    audio.metronome(bpm, metro, (i, acc) => {
      beatOut.textContent = `${(i % 30) + 1}${acc ? ' ●' : ''}`;
    });
  }, 'metronome');
  button(c, 'Coração on/off', () => {
    heart = !heart;
    audio.heartbeat(heart, bpm);
  }, 'heartbeat');
  c.append(beatOut);

  // ---- efeitos
  const s = section('Efeitos (sfx)');
  for (const n of SFX_NAMES) button(s, n, () => audio.sfx(n), 'sfx-' + n);

  // ---- ambientes
  const a = section('Ambientes da ligação');
  let intensity = 0.8;
  const active = new Set<AmbientId>();
  const apply = (): void => audio.setAmbient([...active], intensity);
  slider(a, 'intensidade', 0, 1, 0.05, intensity, (x) => {
    intensity = x;
    apply();
  });
  button(a, 'limpar []', () => {
    active.clear();
    a.querySelectorAll('button.on').forEach((b) => b.classList.remove('on'));
    apply();
  }, 'amb-clear');
  const grid = el('div', { class: 'grid' });
  a.append(grid);
  for (const id of AMBIENT_IDS) {
    const b = button(grid, id, () => {
      if (active.has(id)) active.delete(id);
      else active.add(id);
      b.classList.toggle('on', active.has(id));
      apply();
    }, 'amb-' + id);
  }

  // ---- vozes
  const vs = section('Vozes');
  const ta = el('textarea', { rows: '2', id: 'voiceText' });
  ta.value = SAMPLE;
  vs.append(ta);
  const row = el('div', { class: 'row' });
  vs.append(row);
  const prof = select(row, 'perfil', VOICES, 'mulher');
  const sty = select(row, 'estilo', ['(nenhum)', ...STYLES] as const, '(nenhum)');
  const ch = select(row, 'canal', ['auto', 'phone', 'room', 'radio'] as const, 'auto');
  const durOut = el('span', { class: 'beat' }, '');
  let handle: { stop(): void } | null = null;
  button(vs, 'Falar', () => {
    const style = sty.value === '(nenhum)' ? undefined : (sty.value as LineStyle);
    const channel = ch.value === 'auto' ? undefined : (ch.value as VoiceChannel);
    const h = audio.voice(ta.value, prof.value as VoiceId, { style, channel });
    handle = h;
    durOut.textContent = `${h.duration.toFixed(2)} s`;
  }, 'speak');
  button(vs, 'Parar fala', () => handle?.stop(), 'speakStop');
  button(vs, 'Rádio', () => {
    const h = audio.radio(ta.value, prof.value as VoiceId);
    durOut.textContent = `rádio ${h.duration.toFixed(2)} s`;
  }, 'radio');
  vs.append(durOut);
  const vgrid = el('div', { class: 'grid' });
  vs.append(vgrid);
  for (const p of VOICES) button(vgrid, p, () => audio.voice('Alô? Tem alguém aí? Preciso de ajuda, por favor.', p, { channel: 'phone' }), 'voice-' + p);
  const sgrid = el('div', { class: 'grid' });
  vs.append(sgrid);
  for (const st of STYLES) button(sgrid, st, () => audio.voice('Ele não está respirando direito, doutora... faz alguma coisa!', 'mulher', { style: st, channel: 'phone' }), 'style-' + st);

  // ---- casa e temas
  const h = section('Casa e temas');
  let mood = 0.5;
  let desg = 30;
  slider(h, 'laços (mood)', 0, 1, 0.05, mood, (x) => {
    mood = x;
    audio.updateHomeMusic(mood, desg);
  });
  slider(h, 'desgaste', 0, 100, 1, desg, (x) => {
    desg = x;
    audio.updateHomeMusic(mood, desg);
  });
  button(h, 'Música de casa ▶', () => audio.startHomeMusic(mood, desg), 'home');
  button(h, 'Música de casa ■', () => audio.stopHomeMusic(), 'homeStop');
  for (const k of THEME_KINDS) button(h, 'tema ' + k, () => audio.playTheme(k), 'theme-' + k);
  button(h, 'parar tema', () => audio.stopTheme(), 'themeStop');

  // ---- medição offline
  const m = section('Medição offline (RMS / pico)');
  const out = el('pre', { id: 'measure' }, '');
  button(m, 'Medir tudo', async () => {
    out.textContent = 'renderizando…';
    const res = await measureAll();
    out.textContent = formatTable(res);
  }, 'measureAll');
  m.append(out);
}

// -----------------------------------------------------------------------------
// Medição offline
// -----------------------------------------------------------------------------
export interface Stat {
  name: string;
  seconds: number;
  rmsDb: number;
  peakDb: number;
  clipped: number;
  ok: boolean;
  note?: string;
}

const PREROLL = 0.4;

function stats(name: string, buf: AudioBuffer | null, minRmsDb = -60): Stat {
  if (!buf) return { name, seconds: 0, rmsDb: -Infinity, peakDb: -Infinity, clipped: 0, ok: false, note: 'sem OfflineAudioContext' };
  let sum = 0;
  let peak = 0;
  let clipped = 0;
  let n = 0;
  let nan = false;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = Math.floor(PREROLL * buf.sampleRate); i < d.length; i++) {
      const x = d[i];
      if (!Number.isFinite(x)) {
        nan = true;
        continue;
      }
      const a = Math.abs(x);
      sum += x * x;
      if (a > peak) peak = a;
      if (a >= 0.999) clipped++;
      n++;
    }
  }
  const rms = Math.sqrt(sum / Math.max(1, n));
  const rmsDb = 20 * Math.log10(rms + 1e-12);
  const peakDb = 20 * Math.log10(peak + 1e-12);
  const ok = !nan && rmsDb > minRmsDb && clipped === 0;
  return { name, seconds: buf.duration - PREROLL, rmsDb, peakDb, clipped, ok, note: nan ? 'NaN' : undefined };
}

type Case = [name: string, seconds: number, play: (e: AudioEngine) => void, minRmsDb?: number];

export function cases(): Case[] {
  const list: Case[] = [];
  for (const n of SFX_NAMES) list.push([`sfx:${n}`, n === 'busy' || n === 'siren' || n === 'death' ? 3.5 : 2, (e) => e.sfx(n), n === 'hover' ? -75 : -60]);
  for (const id of AMBIENT_IDS) list.push([`amb:${id}`, 6, (e) => e.setAmbient([id], 0.8), -70]);
  for (const p of VOICES) list.push([`voice:${p}`, 6.5, (e) => void e.voice(SAMPLE, p, { channel: p === 'radio' ? 'radio' : 'phone' })]);
  for (const st of STYLES) list.push([`style:${st}`, 6.5, (e) => void e.voice(SAMPLE, 'mulher', { style: st, channel: 'phone' }), st === 'fantasma' ? -70 : -60]);
  list.push(['voice:room-lucia', 6.5, (e) => void e.voice(SAMPLE, 'lucia')]);
  list.push(['voice:room-alex', 6.5, (e) => void e.voice(SAMPLE, 'alex')]);
  list.push(['radio:bene', 7, (e) => void e.radio('QRV, central. Viatura 2 chegando no local, paciente consciente.', 'bene')]);
  list.push(['ring:once', 2, (e) => e.ringOnce(0.2)]);
  list.push(['ring:once-l1', 2, (e) => e.ringOnce(1)]);
  list.push(['ring:phantom', 2.5, (e) => e.ringOnce(0.8, { phantom: true })]);
  list.push(['ring:loop', 7, (e) => e.ringLoop(true, 0.5)]);
  list.push(['hum', 5, (e) => e.startCentralHum(), -70]);
  list.push(['metronome', 4, (e) => e.metronome(110, true)]);
  list.push(['heartbeat', 4, (e) => e.heartbeat(true, 80)]);
  list.push(['home:mood0', 10, (e) => e.startHomeMusic(0.1, 20)]);
  list.push(['home:mood05', 10, (e) => e.startHomeMusic(0.5, 40)]);
  list.push(['home:mood1', 10, (e) => e.startHomeMusic(0.95, 10)]);
  list.push(['home:desgaste95', 10, (e) => e.startHomeMusic(0.3, 95)]);
  for (const k of THEME_KINDS) list.push([`theme:${k}`, k === 'gameover' || k === 'jornal' ? 8 : 12, (e) => e.playTheme(k as ThemeKind)]);
  list.push(['mix:call', 6.5, (e) => {
    e.startCentralHum();
    e.setAmbient(['tv', 'chuva', 'cachorro'], 0.8);
    e.voice(SAMPLE, 'idosa', { style: 'choro' });
    e.sfx('stamp');
  }]);
  return list;
}

export async function measure(name: string): Promise<Stat> {
  const c = cases().find((x) => x[0] === name);
  if (!c) return { name, seconds: 0, rmsDb: -Infinity, peakDb: -Infinity, clipped: 0, ok: false, note: 'caso desconhecido' };
  const [n, sec, play, min] = c;
  try {
    const buf = await AudioEngine.renderOffline(sec, play, 44100, PREROLL);
    return stats(n, buf, min);
  } catch (err) {
    return { name: n, seconds: sec, rmsDb: -Infinity, peakDb: -Infinity, clipped: 0, ok: false, note: String(err) };
  }
}

export async function measureAll(filter?: string): Promise<Stat[]> {
  const out: Stat[] = [];
  for (const c of cases()) {
    if (filter && !c[0].startsWith(filter)) continue;
    out.push(await measure(c[0]));
  }
  return out;
}

function formatTable(rows: Stat[]): string {
  const pad = (s: string, n: number): string => (s.length >= n ? s : s + ' '.repeat(n - s.length));
  const lines = rows.map((r) => `${r.ok ? 'ok ' : 'XX '} ${pad(r.name, 22)} rms ${r.rmsDb.toFixed(1).padStart(6)} dB  pico ${r.peakDb.toFixed(1).padStart(6)} dB  clip ${r.clipped}${r.note ? '  ' + r.note : ''}`);
  const bad = rows.filter((r) => !r.ok).length;
  return `${rows.length} casos, ${bad} com problema\n` + lines.join('\n');
}

declare global {
  interface Window {
    __audioLab?: { measure: typeof measure; measureAll: typeof measureAll; cases: () => string[]; audio: typeof audio };
  }
}

window.__audioLab = { measure, measureAll, cases: () => cases().map((c) => c[0]), audio };
build();
