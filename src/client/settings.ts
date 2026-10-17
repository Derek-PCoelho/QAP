// Preferências do jogador e progresso global (conquistas). Persistidos no navegador
// (localStorage) ou, no executável de desktop, em arquivos na pasta do usuário (ver native.ts).
import { storage } from './native';

export interface Settings {
  master: number;
  music: number;
  sfx: number;
  ambient: number;
  voice: number;
  textSpeed: number; // caracteres por segundo
  tremble: boolean;
  tutorial: boolean;
  scale: 'fit' | 'pixel';
  playerName: string;
  profileId?: string;
  variable: boolean;
  /** só no executável de desktop */
  fullscreen: boolean;
  /** ritmo do relógio do plantão e da ambulância: 1 normal, 0.75 calmo, 0.5 bem calmo */
  ritmo: number;
}

const KEY = 'qap.settings';
const ACH_KEY = 'qap.achievements';
const META_KEY = 'qap.meta';

export const DEFAULT_SETTINGS: Settings = {
  master: 0.8,
  music: 0.7,
  sfx: 0.8,
  ambient: 0.6,
  voice: 0.7,
  textSpeed: 55,
  tremble: true,
  tutorial: true,
  scale: 'fit',
  playerName: '',
  variable: false,
  fullscreen: true,
  ritmo: 1,
};

/**
 * Saves, opções e conquistas gravados com o prefixo antigo ("192plantao.") são
 * copiados para "qap." uma única vez. As chaves antigas ficam onde estão: nada é apagado.
 */
function migrateLegacyKeys(): void {
  try {
    if (storage.get('qap.migrated')) return;
    const OLD = '192plantao.';
    for (const k of storage.keys().filter((x) => x.startsWith(OLD))) {
      const nk = 'qap.' + k.slice(OLD.length);
      const v = storage.get(k);
      if (v !== null && storage.get(nk) === null) storage.set(nk, v);
    }
    storage.set('qap.migrated', '1');
  } catch {
    /* armazenamento indisponível */
  }
}
migrateLegacyKeys();

function safeGet(key: string): string | null {
  return storage.get(key);
}
function safeSet(key: string, v: string) {
  storage.set(key, v);
}

// ------------------------------------------------------------------ leitura defensiva
// Opções, conquistas, progresso e resumos de save vêm de arquivos que podem estar corrompidos ou
// editados à mão: cada campo é conferido (tipo e faixa) e o que não serve volta ao padrão, para
// um arquivo estragado não travar o título nem as telas (docs/SEGURANCA.md).
type Raw = Record<string, unknown>;
function parseObj(raw: string | null): Raw {
  if (!raw || raw.length > 1_000_000) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Raw) : {};
  } catch {
    return {};
  }
}
const numIn = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const boolOr = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const strOr = (v: unknown, d: string, max = 64) => (typeof v === 'string' ? v.slice(0, max) : d);

export function loadSettings(): Settings {
  const o = parseObj(safeGet(KEY));
  const d = DEFAULT_SETTINGS;
  return {
    master: numIn(o.master, 0, 1, d.master),
    music: numIn(o.music, 0, 1, d.music),
    sfx: numIn(o.sfx, 0, 1, d.sfx),
    ambient: numIn(o.ambient, 0, 1, d.ambient),
    voice: numIn(o.voice, 0, 1, d.voice),
    textSpeed: numIn(o.textSpeed, 10, 400, d.textSpeed),
    tremble: boolOr(o.tremble, d.tremble),
    tutorial: boolOr(o.tutorial, d.tutorial),
    scale: o.scale === 'pixel' ? 'pixel' : 'fit',
    playerName: strOr(o.playerName, d.playerName, 24),
    profileId: typeof o.profileId === 'string' && /^[A-Za-z0-9_-]{16}$/.test(o.profileId) ? o.profileId : undefined,
    variable: boolOr(o.variable, d.variable),
    fullscreen: boolOr(o.fullscreen, d.fullscreen),
    ritmo: [1, 0.75, 0.5].includes(o.ritmo as number) ? (o.ritmo as number) : d.ritmo,
  };
}
export function saveSettings(s: Settings) {
  safeSet(KEY, JSON.stringify(s));
}

export function loadAchievements(): string[] {
  const raw = safeGet(ACH_KEY);
  if (!raw || raw.length > 1_000_000) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length <= 64).slice(0, 500) : [];
  } catch {
    return [];
  }
}
export function saveAchievements(a: string[]) {
  safeSet(ACH_KEY, JSON.stringify(Array.from(new Set(a))));
}

export interface Meta {
  campaignsFinished: number;
  endings: string[];
  firstCampaignStarted: boolean;
  infiniteBest: number;
  simoneUnlocked: boolean;
  /** gênero do protagonista na última campanha terminada (Mesa 1 na campanha da Simone) */
  lastGender?: 'M' | 'F';
}
export function loadMeta(): Meta {
  const o = parseObj(safeGet(META_KEY));
  const m: Meta = {
    campaignsFinished: Math.floor(numIn(o.campaignsFinished, 0, 1e6, 0)),
    endings: Array.isArray(o.endings) ? o.endings.filter((x): x is string => typeof x === 'string' && x.length <= 32).slice(0, 20) : [],
    firstCampaignStarted: boolOr(o.firstCampaignStarted, false),
    infiniteBest: Math.floor(numIn(o.infiniteBest, 0, 1e9, 0)),
    simoneUnlocked: boolOr(o.simoneUnlocked, false),
  };
  if (o.lastGender === 'M' || o.lastGender === 'F') m.lastGender = o.lastGender;
  return m;
}
export function saveMeta(m: Meta) {
  safeSet(META_KEY, JSON.stringify(m));
}

// ------------------------------------------------------------------ saves locais
export interface SaveSummary {
  slot: string;
  savedAt: number;
  day: number;
  phase: string;
  mode: string;
  money: number;
  gender: string;
  difficulty: string;
  /** de qual campanha é o save (o id da partida) e quanto tempo de jogo ela tinha: servem para
   *  saber se outra campanha, ou um ponto anterior da mesma, vai gravar por cima */
  gameId?: string;
  playSeconds?: number;
  /** nome escolhido para o protagonista (saves antigos não têm: usa o padrão do gênero) */
  name?: string;
}

const SAVE_PREFIX = 'qap.save.';

/** o resumo de um save, conferido campo a campo (a tela Carregar mostra estes valores) */
function cleanSummary(o: Raw, slot: string): SaveSummary | null {
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(slot)) return null;
  return {
    slot,
    savedAt: numIn(o.savedAt, 0, 1e15, 0),
    day: Math.floor(numIn(o.day, 0, 99, 0)),
    phase: strOr(o.phase, '', 16),
    mode: strOr(o.mode, 'campanha', 16),
    money: Math.round(numIn(o.money, -1e9, 1e9, 0)),
    gender: o.gender === 'F' ? 'F' : 'M',
    difficulty: strOr(o.difficulty, 'padrao', 16),
    gameId: typeof o.gameId === 'string' ? o.gameId.slice(0, 40) : undefined,
    playSeconds: typeof o.playSeconds === 'number' && Number.isFinite(o.playSeconds) ? Math.max(0, o.playSeconds) : undefined,
    name: typeof o.name === 'string' && o.name.trim() ? o.name.slice(0, 40) : undefined,
  };
}

export function listLocalSaves(): SaveSummary[] {
  const out: SaveSummary[] = [];
  for (const k of storage.keys()) {
    if (!k.startsWith(SAVE_PREFIX + 'meta.')) continue;
    const s = cleanSummary(parseObj(storage.get(k)), k.slice((SAVE_PREFIX + 'meta.').length));
    if (s) out.push(s); // save corrompido: o resumo vira valores neutros e o carregamento avisa
  }
  return out.sort((a, b) => b.savedAt - a.savedAt);
}

export function writeLocalSave(slot: string, data: string, summary: SaveSummary) {
  safeSet(SAVE_PREFIX + slot, data);
  safeSet(SAVE_PREFIX + 'meta.' + slot, JSON.stringify(summary));
}

export function readLocalSave(slot: string): string | null {
  return safeGet(SAVE_PREFIX + slot);
}

export function deleteLocalSave(slot: string) {
  storage.remove(SAVE_PREFIX + slot);
  storage.remove(SAVE_PREFIX + 'meta.' + slot);
}

// ------------------------------------------------------------------ saves guardados
// Nenhum save some de vez sem o jogador querer. Apagar um save, o fim da campanha e gravar outra
// campanha (ou um ponto anterior da mesma) por cima de um save guardam antes uma cópia aqui. As
// cópias ficam TRASH_DAYS dias (no máximo TRASH_MAX) e aparecem em Carregar → "Saves guardados",
// onde dá para carregar de volta ou apagar de vez. No desktop são arquivos qap.lixeira.*.json na
// pasta dos saves.
const TRASH_PREFIX = 'qap.lixeira.';
const TRASH_META = TRASH_PREFIX + 'meta.';
const TRASH_ID_RE = /^[a-z0-9]{1,12}_[A-Za-z0-9_-]{1,40}$/;
export const TRASH_DAYS = 30;
export const TRASH_MAX = 10;

export interface TrashEntry {
  id: string;
  /** o espaço de onde a cópia saiu (auto, dia, 1, simone_auto…) */
  slot: string;
  /** quando a cópia foi guardada */
  deletedAt: number;
  /** por quê: "apagado por você", "outra campanha começou"… */
  reason: string;
  summary: SaveSummary;
}

/** grava e confere lendo de volta (o navegador sem espaço e o desktop sem disco falham em silêncio) */
function writeChecked(key: string, value: string): boolean {
  storage.set(key, value);
  return storage.get(key) === value;
}

export function listTrash(): TrashEntry[] {
  const out: TrashEntry[] = [];
  for (const k of storage.keys()) {
    if (!k.startsWith(TRASH_META)) continue;
    const id = k.slice(TRASH_META.length);
    if (!TRASH_ID_RE.test(id)) continue;
    const o = parseObj(storage.get(k));
    const slot = typeof o.slot === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(o.slot) ? o.slot : 'auto';
    const summary = cleanSummary(o.summary && typeof o.summary === 'object' ? (o.summary as Raw) : {}, slot);
    if (!summary) continue;
    out.push({ id, slot, deletedAt: numIn(o.deletedAt, 0, 1e15, 0), reason: strOr(o.reason, '', 80), summary });
  }
  return out.sort((a, b) => b.deletedAt - a.deletedAt);
}

export function readTrash(id: string): string | null {
  return TRASH_ID_RE.test(id) ? storage.get(TRASH_PREFIX + id) : null;
}

/** apaga de vez uma cópia guardada */
export function purgeTrash(id: string): void {
  if (!TRASH_ID_RE.test(id)) return;
  storage.remove(TRASH_PREFIX + id);
  storage.remove(TRASH_META + id);
}

/** tira as cópias com mais de TRASH_DAYS dias e, passando de `keep`, as mais antigas; e restos sem resumo */
export function pruneTrash(now = Date.now(), keep = TRASH_MAX): void {
  listTrash().forEach((e, i) => {
    if (i >= keep || now - e.deletedAt > TRASH_DAYS * 86_400_000) purgeTrash(e.id);
  });
  for (const k of storage.keys()) {
    if (!k.startsWith(TRASH_PREFIX) || k.startsWith(TRASH_META)) continue;
    const id = k.slice(TRASH_PREFIX.length);
    if (storage.get(TRASH_META + id) === null) storage.remove(k);
  }
}

/**
 * Guarda uma cópia do save do espaço `slot` (dados e resumo). true se não havia save ou se a cópia
 * foi gravada e conferida; false se não deu para gravar (aí quem chamou não deve apagar o original).
 */
export function backupLocalSave(slot: string, reason: string, now = Date.now()): boolean {
  const data = storage.get(SAVE_PREFIX + slot);
  if (data === null) return true;
  const summary = cleanSummary(parseObj(storage.get(SAVE_PREFIX + 'meta.' + slot)), slot);
  if (!summary) return false;
  let t = now;
  let id = `${t.toString(36)}_${slot}`;
  while (storage.get(TRASH_META + id) !== null) id = `${(++t).toString(36)}_${slot}`;
  const meta = JSON.stringify({ slot, deletedAt: now, reason: reason.slice(0, 80), summary });
  for (let attempt = 0; attempt <= TRASH_MAX; attempt++) {
    if (writeChecked(TRASH_PREFIX + id, data) && writeChecked(TRASH_META + id, meta)) {
      pruneTrash(now);
      return true;
    }
    // sem espaço (navegador): tira a cópia guardada mais antiga e tenta de novo
    purgeTrash(id);
    const older = listTrash();
    if (!older.length) break;
    purgeTrash(older[older.length - 1].id);
  }
  purgeTrash(id);
  return false;
}

/** apaga o save do espaço guardando antes uma cópia; false (e nada apagado) se a cópia não deu certo */
export function trashLocalSave(slot: string, reason: string): boolean {
  if (!backupLocalSave(slot, reason)) return false;
  deleteLocalSave(slot);
  return true;
}

/**
 * O que está gravado num espaço: undefined se está vazio, null se não dá para ler (save
 * corrompido: na dúvida, guarda-se uma cópia), ou a campanha e o tempo de jogo dela.
 */
export function savedInfo(slot: string): { id: string; playSeconds: number } | null | undefined {
  const meta = parseObj(storage.get(SAVE_PREFIX + 'meta.' + slot));
  const raw = storage.get(SAVE_PREFIX + slot);
  if (raw === null) return undefined;
  if (typeof meta.gameId === 'string' && typeof meta.playSeconds === 'number') return { id: meta.gameId, playSeconds: meta.playSeconds };
  try {
    const o = JSON.parse(raw) as { id?: unknown; playSeconds?: unknown };
    return typeof o?.id === 'string' ? { id: o.id, playSeconds: typeof o.playSeconds === 'number' ? o.playSeconds : 0 } : null;
  } catch {
    return null;
  }
}

/**
 * Gravar `next` no lugar do que está no espaço perde algo? Sim se o espaço tem outra campanha, um
 * save ilegível ou um ponto mais adiantado da mesma campanha (quem carregou um save antigo e
 * seguiu jogando grava, sem querer, por cima do progresso mais novo).
 */
export function replacingLosesProgress(prev: { id: string; playSeconds: number } | null | undefined, next: { id: string; playSeconds: number }): string | null {
  if (prev === undefined) return null;
  if (prev === null) return 'save ilegível substituído';
  if (prev.id !== next.id) return 'outra campanha gravou por cima';
  if (next.playSeconds + 5 < prev.playSeconds) return 'um ponto anterior gravou por cima';
  return null;
}
