// =============================================================================
// QAP — Emergency Dispatch — cliente da API do servidor local (browser).
//
// Regras de ouro:
//  • nada aqui toca DOM, localStorage ou rede na importação (tudo é preguiçoso);
//  • nenhuma função lança: sem servidor, tudo devolve null / [] / false;
//  • no build standalone (JOGAR.html, __STANDALONE__ = true) ou em file:// a API
//    fica desligada e nem tenta rede.
//
// Telemetria: api.track(nome, dados) só enfileira. A fila é enviada a cada 10 s,
// ao juntar 50 eventos e, ao esconder/fechar a aba, via navigator.sendBeacon.
// =============================================================================

import { storage } from './native';

declare const __STANDALONE__: boolean | undefined;

export type SaveSlot = 'auto' | '1' | '2' | '3' | 'infinito';
export const SAVE_SLOTS: readonly SaveSlot[] = ['auto', '1', '2', '3', 'infinito'];

/** Resumo mostrado na lista de saves (campos extras enviados são ignorados). */
export interface SaveSummary {
  day: number;
  phase: string;
  mode: string;
  money: number;
  gender: string;
  difficulty: string;
}

export interface SaveMeta {
  slot: SaveSlot;
  savedAt: number;
  summary: SaveSummary;
}

export interface SaveRecord extends SaveMeta {
  /** JSON serializado do jogo, exatamente como foi enviado */
  data: string;
}

export interface Profile {
  id: string;
  name: string;
  createdAt: number;
}

export interface RankingRow {
  name: string;
  score: number;
  calls: number;
  correct: number;
  seed: string;
  createdAt: number;
}

export interface ScoreEntry {
  /** se omitido, usa o perfil atual (api.profileId) */
  profileId?: string | null;
  name: string;
  score: number;
  calls: number;
  correct: number;
  seed: string;
  mode?: string;
  version?: string;
}

export interface SubmitScoreResult {
  /** virou o novo recorde deste nome nesta semente */
  improved: boolean;
  /** posição do recorde do nome no ranking da semente (1 = primeiro) */
  rank: number;
  best: RankingRow;
}

export interface TelemetryEvent {
  name: string;
  data: Record<string, unknown>;
  t: number;
}

const BASE = '/api';
const HEALTH_TIMEOUT_MS = 3000;
const REQUEST_TIMEOUT_MS = 10_000;
const SAVE_TIMEOUT_MS = 30_000;
/** sem servidor? tenta de novo depois disso (ex.: o jogador abriu o servidor depois) */
const RECHECK_AFTER_MS = 30_000;
const FLUSH_EVERY_MS = 10_000;
const FLUSH_AT = 50;
const MAX_BATCH_EVENTS = 200;
/** o servidor aceita 64 KB por lote e o sendBeacon também tem teto de 64 KB */
const MAX_BATCH_BYTES = 60_000;
/** o servidor aceita até 4 KB por evento */
const MAX_EVENT_BYTES = 4000;
const MAX_QUEUE = 1000;
const MAX_SAVE_BYTES = 2 * 1024 * 1024;
const NAME_MAX = 24;
const SEED_MAX = 64;
const VERSION_MAX = 32;
const ID_RE = /^[A-Za-z0-9_-]{16}$/;
const SID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const SLOT_RE = /^(?:auto|[123]|infinito)$/;
const EVENT_RE = /^[a-z][a-z0-9_]{0,39}$/;

const KEY_PREFIX = 'qap.api.';

// -----------------------------------------------------------------------------
// ambiente
// -----------------------------------------------------------------------------
function isStandalone(): boolean {
  return typeof __STANDALONE__ !== 'undefined' && !!__STANDALONE__;
}

function disabled(): boolean {
  if (isStandalone()) return true;
  if (typeof fetch !== 'function') return true;
  try {
    if (typeof location !== 'undefined' && location.protocol === 'file:') return true;
  } catch {
    /* sem location */
  }
  return false;
}

function readKey(key: string): string | null {
  return storage.get(KEY_PREFIX + key);
}

function writeKey(key: string, value: string | null): void {
  if (value === null) storage.remove(KEY_PREFIX + key);
  else storage.set(KEY_PREFIX + key, value);
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function randomId(len = 16): string {
  const bytes = new Uint8Array(len);
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes);
  else for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] & 63];
  return out;
}

let encoder: TextEncoder | null | undefined;
function byteLength(s: string): number {
  if (encoder === undefined) encoder = typeof TextEncoder === 'function' ? new TextEncoder() : null;
  return encoder ? encoder.encode(s).length : s.length * 3;
}

function cleanLabel(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  const s = value.replace(/\s+/g, ' ').replace(/[\u0000-\u001f\u007f<>]/g, '').trim();
  return Array.from(s).slice(0, max).join('').trim();
}

// -----------------------------------------------------------------------------
// identidade: sessão (por navegador) e perfil
// -----------------------------------------------------------------------------
let sid: string | null = null;

/** Id anônimo deste navegador (guardado em localStorage): identifica o jogador na telemetria. */
function getSessionId(): string {
  if (sid) return sid;
  const stored = readKey('sid');
  sid = stored && SID_RE.test(stored) ? stored : randomId(16);
  if (sid !== stored) writeKey('sid', sid);
  return sid;
}

let profile: string | null | undefined;

function getProfileId(): string | null {
  if (profile === undefined) {
    const stored = readKey('profile');
    profile = stored && ID_RE.test(stored) ? stored : null;
  }
  return profile;
}

/** Define o perfil atual (usado na telemetria e como padrão do submitScore). */
function setProfile(id: string | null | undefined): void {
  const next = typeof id === 'string' && ID_RE.test(id) ? id : null;
  if (next === getProfileId()) return;
  profile = next;
  writeKey('profile', next);
}

/** valida o id e lembra dele como perfil atual */
function useProfile(id: unknown): id is string {
  if (typeof id !== 'string' || !ID_RE.test(id)) return false;
  setProfile(id);
  return true;
}

// -----------------------------------------------------------------------------
// HTTP
// -----------------------------------------------------------------------------
async function timedFetch(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), ms) : null;
  try {
    return await fetch(url, { credentials: 'same-origin', ...init, signal: ctrl ? ctrl.signal : undefined });
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
}

let health: Promise<boolean> | null = null;
let healthResult: boolean | null = null;
let healthAt = 0;

async function checkHealth(): Promise<boolean> {
  try {
    const res = await timedFetch(BASE + '/health', { method: 'GET', cache: 'no-store', headers: { Accept: 'application/json' } }, HEALTH_TIMEOUT_MS);
    if (!res.ok) return false;
    const body = (await res.json()) as { ok?: unknown } | null;
    return !!body && body.ok === true;
  } catch {
    return false;
  }
}

/**
 * O servidor está no ar? Faz GET /api/health uma vez e guarda o resultado.
 * Se deu "não", tenta de novo depois de 30 s (ou já, com force = true).
 * Sempre false no build standalone / file://.
 */
function available(force = false): Promise<boolean> {
  if (disabled()) return Promise.resolve(false);
  const stale = healthResult === false && Date.now() - healthAt > RECHECK_AFTER_MS;
  if (!health || force || stale) {
    health = checkHealth().then((ok) => {
      healthResult = ok;
      healthAt = Date.now();
      return ok;
    });
  }
  return health;
}

interface Reply<T> {
  /** 0 = sem servidor / falha de rede */
  status: number;
  body: T | null;
}

async function call<T>(method: string, path: string, body?: unknown, timeout = REQUEST_TIMEOUT_MS): Promise<Reply<T>> {
  try {
    if (!(await available())) return { status: 0, body: null };
    const init: RequestInit = { method, headers: { Accept: 'application/json' } };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    }
    const res = await timedFetch(BASE + path, init, timeout);
    let parsed: T | null = null;
    try {
      parsed = (await res.json()) as T;
    } catch {
      parsed = null;
    }
    return { status: res.status, body: res.ok ? parsed : null };
  } catch {
    return { status: 0, body: null };
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

// -----------------------------------------------------------------------------
// perfis
// -----------------------------------------------------------------------------
/** Cria um perfil (nome saneado e cortado em 24 caracteres) e o torna o perfil atual. */
async function createProfile(name: string): Promise<Profile | null> {
  const clean = cleanLabel(name, NAME_MAX);
  if (!clean) return null;
  const r = await call<Profile>('POST', '/profiles', { name: clean });
  if (!isObj(r.body) || typeof r.body.id !== 'string') return null;
  setProfile(r.body.id);
  return r.body;
}

async function getProfile(id: string): Promise<Profile | null> {
  if (typeof id !== 'string' || !ID_RE.test(id)) return null;
  const r = await call<Profile>('GET', `/profiles/${id}`);
  return isObj(r.body) && typeof r.body.id === 'string' ? r.body : null;
}

/** Devolve o perfil atual se ele ainda existir no servidor; senão cria um com `name`. */
async function ensureProfile(name: string): Promise<Profile | null> {
  const id = getProfileId();
  if (id) {
    const r = await call<Profile>('GET', `/profiles/${id}`);
    if (isObj(r.body) && typeof r.body.id === 'string') return r.body;
    if (r.status !== 404) return null; // servidor fora ou erro: não cria outro perfil à toa
  }
  return createProfile(name);
}

// -----------------------------------------------------------------------------
// saves
// -----------------------------------------------------------------------------
async function listSaves(profileId: string): Promise<SaveMeta[]> {
  if (!useProfile(profileId)) return [];
  const r = await call<SaveMeta[]>('GET', `/saves/${profileId}`);
  return Array.isArray(r.body) ? r.body : [];
}

async function getSave(profileId: string, slot: string): Promise<SaveRecord | null> {
  if (!useProfile(profileId) || !SLOT_RE.test(String(slot))) return null;
  const r = await call<SaveRecord>('GET', `/saves/${profileId}/${slot}`);
  return isObj(r.body) && typeof r.body.data === 'string' ? r.body : null;
}

/**
 * Grava um save. `data` é o JSON serializado do jogo (até 2 MB; objetos são
 * serializados aqui). Do `summary` só vão day, phase, mode, money, gender e difficulty.
 */
async function putSave(profileId: string, slot: string, data: string | object, summary: SaveSummary): Promise<boolean> {
  try {
    if (!useProfile(profileId) || !SLOT_RE.test(String(slot))) return false;
    const json = typeof data === 'string' ? data : JSON.stringify(data);
    if (!json || byteLength(json) > MAX_SAVE_BYTES) return false;
    const s = summary ?? ({} as SaveSummary);
    const body = {
      data: json,
      summary: { day: s.day, phase: s.phase, mode: s.mode, money: s.money, gender: s.gender, difficulty: s.difficulty },
    };
    const r = await call<{ ok?: boolean }>('PUT', `/saves/${profileId}/${slot}`, body, SAVE_TIMEOUT_MS);
    return r.body?.ok === true;
  } catch {
    return false;
  }
}

async function deleteSave(profileId: string, slot: string): Promise<boolean> {
  if (!useProfile(profileId) || !SLOT_RE.test(String(slot))) return false;
  const r = await call<{ ok?: boolean }>('DELETE', `/saves/${profileId}/${slot}`);
  return r.body?.ok === true;
}

// -----------------------------------------------------------------------------
// ranking
// -----------------------------------------------------------------------------
/** Melhores pontuações. Sem `seed` = ranking geral (todas as sementes). */
async function ranking(mode = 'infinito', seed?: string | null, limit = 20): Promise<RankingRow[]> {
  try {
    const q = new URLSearchParams({ mode, limit: String(Math.max(1, Math.min(100, Math.round(limit) || 20))) });
    if (seed) q.set('seed', seed);
    const r = await call<RankingRow[]>('GET', `/ranking?${q.toString()}`);
    return Array.isArray(r.body) ? r.body : [];
  } catch {
    return [];
  }
}

/** Envia uma pontuação. O servidor guarda só o melhor resultado por (nome, semente). */
async function submitScore(entry: ScoreEntry): Promise<SubmitScoreResult | null> {
  try {
    const name = cleanLabel(entry?.name, NAME_MAX);
    const seed = cleanLabel(entry?.seed, SEED_MAX);
    if (!name || !seed) return null;
    const int = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0);
    const calls = int(entry.calls);
    const pid = typeof entry.profileId === 'string' && ID_RE.test(entry.profileId) ? entry.profileId : getProfileId();
    const body = {
      name,
      seed,
      score: int(entry.score),
      calls,
      correct: Math.min(int(entry.correct), calls),
      mode: entry.mode ?? 'infinito',
      version: cleanLabel(entry.version ?? '', VERSION_MAX),
      ...(pid ? { profileId: pid } : {}),
    };
    const r = await call<{ ok?: boolean; improved: boolean; rank: number; best: RankingRow }>('POST', '/ranking', body);
    if (!r.body?.ok) return null;
    return { improved: !!r.body.improved, rank: r.body.rank, best: r.body.best };
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// telemetria
// -----------------------------------------------------------------------------
interface Queued {
  ev: TelemetryEvent;
  bytes: number;
}

let queue: Queued[] = [];
let ticker: ReturnType<typeof setInterval> | null = null;
let hooked = false;
let flushing: Promise<void> | null = null;

function hookFlushTriggers(): void {
  if (!ticker && typeof setInterval === 'function') {
    ticker = setInterval(() => void flush(), FLUSH_EVERY_MS);
    (ticker as unknown as { unref?: () => void }).unref?.();
  }
  if (hooked) return;
  hooked = true;
  try {
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushBeacon();
      });
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('pagehide', () => flushBeacon());
    }
  } catch {
    /* sem DOM */
  }
}

/** Enfileira um evento de telemetria. Nunca lança; não faz nada sem servidor. */
function track(name: string, data: Record<string, unknown> = {}): void {
  try {
    if (disabled()) return;
    if (healthResult === false) {
      // sem servidor: descarta, mas de tempos em tempos confere se ele apareceu
      if (Date.now() - healthAt > RECHECK_AFTER_MS) void available();
      return;
    }
    if (typeof name !== 'string' || !EVENT_RE.test(name)) return;
    const t = Date.now();
    let payload: Record<string, unknown>;
    try {
      payload = isObj(data) ? (JSON.parse(JSON.stringify(data)) as Record<string, unknown>) : {};
    } catch {
      payload = { _invalido: true };
    }
    let bytes = byteLength(JSON.stringify({ name, data: payload, t }));
    if (bytes > MAX_EVENT_BYTES) {
      payload = { _truncado: true };
      bytes = byteLength(JSON.stringify({ name, data: payload, t }));
    }
    queue.push({ ev: { name, data: payload, t }, bytes });
    if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
    hookFlushTriggers();
    if (queue.length >= FLUSH_AT) void flush();
  } catch {
    /* telemetria nunca derruba o jogo */
  }
}

function takeBatch(): Queued[] {
  const batch: Queued[] = [];
  let bytes = 160; // envelope: sessionId, profileId, chaves
  while (queue.length && batch.length < MAX_BATCH_EVENTS) {
    const next = queue[0];
    if (batch.length && bytes + next.bytes + 1 > MAX_BATCH_BYTES) break;
    batch.push(queue.shift() as Queued);
    bytes += next.bytes + 1;
  }
  return batch;
}

function requeue(batch: Queued[]): void {
  queue = batch.concat(queue);
  if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
}

function envelope(batch: Queued[]): string {
  const pid = getProfileId();
  return JSON.stringify({ sessionId: getSessionId(), ...(pid ? { profileId: pid } : {}), events: batch.map((q) => q.ev) });
}

async function postBatch(batch: Queued[]): Promise<'ok' | 'retry' | 'drop'> {
  try {
    const res = await timedFetch(
      BASE + '/telemetry',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: envelope(batch) },
      REQUEST_TIMEOUT_MS,
    );
    if (res.ok) return 'ok';
    return res.status === 429 || res.status === 408 || res.status >= 500 ? 'retry' : 'drop';
  } catch {
    return 'retry';
  }
}

/** Envia agora o que estiver na fila (via fetch). */
function flush(): Promise<void> {
  if (flushing) return flushing;
  const run = (async () => {
    while (queue.length) {
      if (!(await available())) {
        queue = [];
        return;
      }
      const batch = takeBatch();
      if (!batch.length) return;
      const outcome = await postBatch(batch);
      if (outcome === 'retry') {
        requeue(batch);
        return;
      }
    }
  })();
  const done = run.then(
    () => {
      flushing = null;
    },
    () => {
      flushing = null;
    },
  );
  flushing = done;
  return done;
}

/** Envio de última hora (aba escondida/fechando): sendBeacon, com fetch keepalive de reserva. */
function flushBeacon(): void {
  try {
    if (disabled() || !queue.length) return;
    if (healthResult === false) {
      queue = [];
      return;
    }
    while (queue.length) {
      const batch = takeBatch();
      if (!batch.length) break;
      const body = envelope(batch);
      let sent = false;
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
          sent = navigator.sendBeacon(BASE + '/telemetry', body);
        }
      } catch {
        sent = false;
      }
      if (!sent) {
        try {
          void fetch(BASE + '/telemetry', {
            method: 'POST',
            body,
            keepalive: true,
            credentials: 'same-origin',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          }).catch(() => {});
          sent = true;
        } catch {
          sent = false;
        }
      }
      if (!sent) {
        requeue(batch);
        break;
      }
    }
  } catch {
    /* nada a fazer */
  }
}

// -----------------------------------------------------------------------------
export const api = {
  available,
  createProfile,
  getProfile,
  ensureProfile,
  setProfile,
  listSaves,
  getSave,
  putSave,
  deleteSave,
  ranking,
  submitScore,
  track,
  flush,
  /** id anônimo deste navegador (persistido em localStorage) */
  get sessionId(): string {
    return getSessionId();
  },
  /** perfil atual (o último criado/usado), ou null */
  get profileId(): string | null {
    return getProfileId();
  },
  /** false no build standalone, em file:// ou sem fetch */
  get enabled(): boolean {
    return !disabled();
  },
};
