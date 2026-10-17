// =============================================================================
// JsonStore — um arquivo JSON por coleção em DATA_DIR (profiles.json, saves.json,
// ranking.json, telemetry.json). Os dados vivem em memória; as gravações são
// agrupadas (debounce) e atômicas (arquivo temporário + fsync + rename).
// =============================================================================
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeSync,
} from 'node:fs';
import { open, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { isPlainObject } from '../http';
import {
  byteLength,
  compareScores,
  compareSlots,
  nameKey,
  StoreError,
  type Profile,
  type RankingEntry,
  type RankingQuery,
  type SaveMeta,
  type SaveRecord,
  type SaveSummary,
  type StorageStats,
  type Store,
  type SubmitResult,
  type TelemetryInput,
  type TelemetryQuery,
  type TelemetryRecord,
  type DeletedData,
} from './types';

export type CollectionName = 'profiles' | 'saves' | 'ranking' | 'telemetry';
export const JSON_COLLECTIONS: readonly CollectionName[] = ['profiles', 'saves', 'ranking', 'telemetry'];

const FORMAT = 'qap';
const FILE_VERSION = 1;
const TMP_RE = /^(?:profiles|saves|ranking|telemetry)\.json\.\d+-[0-9a-f]{8}\.tmp$/;

export interface SaveRow extends SaveRecord {
  profileId: string;
}

export interface JsonSnapshot {
  profiles: Profile[];
  saves: SaveRow[];
  ranking: RankingEntry[];
  telemetry: TelemetryRecord[];
  telemetrySeq: number;
}

export interface JsonStoreOptions {
  /** espera após a última alteração antes de gravar (padrão 400 ms) */
  flushDelayMs?: number;
  /** espera máxima com alterações pendentes (padrão 3 s) */
  maxWaitMs?: number;
  /** eventos de telemetria guardados; os mais antigos saem primeiro (padrão 250 mil) */
  maxTelemetry?: number;
  log?: (msg: string) => void;
}

// ----------------------------------------------------------------------------
// Leitura dos arquivos
// ----------------------------------------------------------------------------

const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function toProfile(v: unknown): Profile | null {
  if (!isPlainObject(v) || !isStr(v.id) || !isStr(v.name) || !isNum(v.createdAt)) return null;
  return { id: v.id, name: v.name, createdAt: v.createdAt };
}

function toSummary(v: unknown): SaveSummary | null {
  if (!isPlainObject(v)) return null;
  return {
    day: isNum(v.day) ? v.day : 0,
    phase: isStr(v.phase) ? v.phase : '',
    mode: isStr(v.mode) ? v.mode : '',
    money: isNum(v.money) ? v.money : 0,
    gender: isStr(v.gender) ? v.gender : '',
    difficulty: isStr(v.difficulty) ? v.difficulty : '',
  };
}

function toSaveRow(v: unknown): SaveRow | null {
  if (!isPlainObject(v) || !isStr(v.profileId) || !isStr(v.slot) || !isNum(v.savedAt) || !isStr(v.data)) return null;
  const summary = toSummary(v.summary);
  if (!summary) return null;
  return { profileId: v.profileId, slot: v.slot, savedAt: v.savedAt, summary, data: v.data };
}

function toRanking(v: unknown): RankingEntry | null {
  if (!isPlainObject(v) || !isStr(v.mode) || !isStr(v.seed) || !isStr(v.name)) return null;
  if (!isNum(v.score) || !isNum(v.calls) || !isNum(v.correct) || !isNum(v.createdAt)) return null;
  return {
    mode: v.mode,
    seed: v.seed,
    name: v.name,
    score: v.score,
    calls: v.calls,
    correct: v.correct,
    version: isStr(v.version) ? v.version : '',
    profileId: isStr(v.profileId) ? v.profileId : null,
    createdAt: v.createdAt,
  };
}

function toTelemetry(v: unknown): TelemetryRecord | null {
  if (!isPlainObject(v) || !isNum(v.seq) || !isStr(v.sessionId) || !isStr(v.name) || !isNum(v.t)) return null;
  return {
    seq: v.seq,
    sessionId: v.sessionId,
    profileId: isStr(v.profileId) ? v.profileId : null,
    name: v.name,
    data: v.data ?? null,
    t: v.t,
    receivedAt: isNum(v.receivedAt) ? v.receivedAt : v.t,
  };
}

function readCollection(
  dir: string,
  name: CollectionName,
  onCorrupt: 'rename' | 'ignore',
  log: (msg: string) => void,
): { items: unknown[]; seq: number } | null {
  const file = join(dir, `${name}.json`);
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    if (isPlainObject(parsed) && Array.isArray(parsed.items)) {
      return { items: parsed.items, seq: isNum(parsed.seq) ? parsed.seq : 0 };
    }
  } catch {
    /* tratado abaixo */
  }
  if (onCorrupt === 'rename') {
    const bad = `${file}.corrompido-${Date.now()}`;
    try {
      renameSync(file, bad);
      log(`[dados] ${name}.json estava ilegível; guardei uma cópia em ${bad} e recomecei essa coleção do zero.`);
    } catch {
      log(`[dados] ${name}.json estava ilegível e não consegui renomeá-lo; recomecei essa coleção do zero.`);
    }
  }
  return null;
}

function mapItems<T>(raw: { items: unknown[] } | null, fn: (v: unknown) => T | null): T[] {
  if (!raw) return [];
  const out: T[] = [];
  for (const item of raw.items) {
    const v = fn(item);
    if (v) out.push(v);
  }
  return out;
}

/** Carrega todas as coleções JSON de `dir` (coleções ausentes vêm vazias). */
export function loadJsonSnapshot(
  dir: string,
  onCorrupt: 'rename' | 'ignore' = 'ignore',
  log: (msg: string) => void = () => {},
): JsonSnapshot {
  const tel = readCollection(dir, 'telemetry', onCorrupt, log);
  const telemetry = mapItems(tel, toTelemetry).sort((a, b) => a.seq - b.seq);
  const lastSeq = telemetry.length ? telemetry[telemetry.length - 1].seq : 0;
  return {
    profiles: mapItems(readCollection(dir, 'profiles', onCorrupt, log), toProfile),
    saves: mapItems(readCollection(dir, 'saves', onCorrupt, log), toSaveRow),
    ranking: mapItems(readCollection(dir, 'ranking', onCorrupt, log), toRanking),
    telemetry,
    telemetrySeq: Math.max(tel?.seq ?? 0, lastSeq),
  };
}

export function jsonFilesExist(dir: string): boolean {
  return JSON_COLLECTIONS.some((c) => existsSync(join(dir, `${c}.json`)));
}

// ----------------------------------------------------------------------------
// Escrita atômica
// ----------------------------------------------------------------------------

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const tmpName = (file: string) => `${file}.${process.pid}-${randomBytes(4).toString('hex')}.tmp`;
const RETRY_CODES = new Set(['EPERM', 'EBUSY', 'EACCES']);

async function writeAtomic(file: string, text: string): Promise<void> {
  const tmp = tmpName(file);
  try {
    const fh = await open(tmp, 'w');
    try {
      await fh.writeFile(text, 'utf8');
      await fh.sync();
    } finally {
      await fh.close();
    }
    // no Windows o rename pode falhar por alguns ms se outro processo (antivírus) abriu o arquivo
    for (let attempt = 0; ; attempt++) {
      try {
        await rename(tmp, file);
        return;
      } catch (err) {
        if (attempt >= 4 || !RETRY_CODES.has((err as NodeJS.ErrnoException).code ?? '')) throw err;
        await delay(40 * (attempt + 1));
      }
    }
  } catch (err) {
    await unlink(tmp).catch(() => {});
    throw err;
  }
}

function writeAtomicSync(file: string, text: string): void {
  const tmp = tmpName(file);
  try {
    const fd = openSync(tmp, 'w');
    try {
      const buf = Buffer.from(text, 'utf8');
      let off = 0;
      while (off < buf.length) off += writeSync(fd, buf, off, buf.length - off);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    renameSync(tmp, file);
  } catch (err) {
    try {
      unlinkSync(tmp);
    } catch {
      /* já não existe */
    }
    throw err;
  }
}

/** Remove temporários órfãos (de quedas anteriores) com mais de 1 minuto. */
function cleanupTempFiles(dir: string): void {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return;
  }
  const cutoff = Date.now() - 60_000;
  for (const n of names) {
    if (!TMP_RE.test(n)) continue;
    const file = join(dir, n);
    try {
      if (statSync(file).mtimeMs < cutoff) unlinkSync(file);
    } catch {
      /* ignorar */
    }
  }
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

const saveKey = (profileId: string, slot: string) => `${profileId}/${slot}`;
/** rótulos saneados não têm quebra de linha, então "\n" é um separador seguro */
const rankKey = (mode: string, seed: string, name: string) => `${mode}\n${seed}\n${nameKey(name)}`;

export class JsonStore implements Store {
  readonly kind = 'json' as const;
  readonly location: string;
  private readonly dir: string;
  private readonly flushDelayMs: number;
  private readonly maxWaitMs: number;
  private readonly maxTelemetry: number;
  private readonly log: (msg: string) => void;

  private readonly profiles = new Map<string, Profile>();
  private readonly saves = new Map<string, SaveRow>();
  private readonly saveSizes = new Map<string, number>();
  private saveBytes = 0;
  private readonly ranking = new Map<string, RankingEntry>();
  private telemetry: TelemetryRecord[] = [];
  private seq = 0;

  private readonly dirty = new Set<CollectionName>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private firstDirtyAt = 0;
  private chain: Promise<void> = Promise.resolve();
  private closed = false;

  static async open(dir: string, opts: JsonStoreOptions = {}): Promise<JsonStore> {
    return new JsonStore(dir, opts);
  }

  constructor(dir: string, opts: JsonStoreOptions = {}) {
    this.dir = dir;
    this.location = dir;
    this.flushDelayMs = opts.flushDelayMs ?? 400;
    this.maxWaitMs = opts.maxWaitMs ?? 3000;
    this.maxTelemetry = opts.maxTelemetry ?? 250_000;
    this.log = opts.log ?? ((m) => console.warn(m));

    mkdirSync(dir, { recursive: true });
    cleanupTempFiles(dir);
    const snap = loadJsonSnapshot(dir, 'rename', this.log);
    for (const p of snap.profiles) this.profiles.set(p.id, p);
    for (const s of snap.saves) {
      const key = saveKey(s.profileId, s.slot);
      const size = byteLength(s.data);
      this.saves.set(key, s);
      this.saveSizes.set(key, size);
      this.saveBytes += size;
    }
    for (const r of snap.ranking) this.ranking.set(rankKey(r.mode, r.seed, r.name), r);
    this.telemetry = snap.telemetry;
    this.seq = snap.telemetrySeq;
  }

  // --- perfis ---------------------------------------------------------------
  createProfile(p: Profile): void {
    this.assertOpen();
    this.profiles.set(p.id, { id: p.id, name: p.name, createdAt: p.createdAt });
    this.markDirty('profiles');
  }

  getProfile(id: string): Profile | null {
    const p = this.profiles.get(id);
    return p ? { ...p } : null;
  }

  // --- saves ----------------------------------------------------------------
  listSaves(profileId: string): SaveMeta[] {
    const out: SaveMeta[] = [];
    for (const s of this.saves.values()) {
      if (s.profileId === profileId) out.push({ slot: s.slot, savedAt: s.savedAt, summary: { ...s.summary } });
    }
    return out.sort(compareSlots);
  }

  getSave(profileId: string, slot: string): SaveRecord | null {
    const s = this.saves.get(saveKey(profileId, slot));
    return s ? { slot: s.slot, savedAt: s.savedAt, summary: { ...s.summary }, data: s.data } : null;
  }

  saveSize(profileId: string, slot: string): number {
    return this.saveSizes.get(saveKey(profileId, slot)) ?? 0;
  }

  putSave(profileId: string, rec: SaveRecord): void {
    this.assertOpen();
    const key = saveKey(profileId, rec.slot);
    const size = byteLength(rec.data);
    this.saveBytes += size - (this.saveSizes.get(key) ?? 0);
    this.saveSizes.set(key, size);
    this.saves.set(key, { profileId, slot: rec.slot, savedAt: rec.savedAt, summary: { ...rec.summary }, data: rec.data });
    this.markDirty('saves');
  }

  deleteSave(profileId: string, slot: string): boolean {
    this.assertOpen();
    const key = saveKey(profileId, slot);
    if (!this.saves.delete(key)) return false;
    this.saveBytes -= this.saveSizes.get(key) ?? 0;
    this.saveSizes.delete(key);
    this.markDirty('saves');
    return true;
  }

  // --- ranking --------------------------------------------------------------
  getScore(mode: string, seed: string, name: string): RankingEntry | null {
    const r = this.ranking.get(rankKey(mode, seed, name));
    return r ? { ...r } : null;
  }

  submitScore(entry: RankingEntry): SubmitResult {
    this.assertOpen();
    const key = rankKey(entry.mode, entry.seed, entry.name);
    const current = this.ranking.get(key);
    let improved = false;
    if (!current || entry.score > current.score) {
      this.ranking.set(key, { ...entry });
      improved = true;
      this.markDirty('ranking');
    }
    const best = this.ranking.get(key) as RankingEntry;
    let rank = 1;
    for (const r of this.ranking.values()) {
      if (r !== best && r.mode === best.mode && r.seed === best.seed && compareScores(r, best) < 0) rank++;
    }
    return { improved, best: { ...best }, rank };
  }

  topScores(q: RankingQuery): RankingEntry[] {
    const rows: RankingEntry[] = [];
    for (const r of this.ranking.values()) {
      if (r.mode === q.mode && (q.seed == null || r.seed === q.seed)) rows.push(r);
    }
    return rows
      .sort(compareScores)
      .slice(0, q.limit)
      .map((r) => ({ ...r }));
  }

  deleteScore(mode: string, seed: string, name: string): boolean {
    this.assertOpen();
    if (!this.ranking.delete(rankKey(mode, seed, name))) return false;
    this.markDirty('ranking');
    return true;
  }

  deleteProfileData(profileId: string): DeletedData {
    this.assertOpen();
    const out: DeletedData = { profile: this.profiles.delete(profileId), saves: 0, ranking: 0, telemetry: 0 };
    if (out.profile) this.markDirty('profiles');
    for (const [key, s] of [...this.saves]) {
      if (s.profileId !== profileId) continue;
      this.saves.delete(key);
      this.saveBytes -= this.saveSizes.get(key) ?? 0;
      this.saveSizes.delete(key);
      out.saves++;
    }
    if (out.saves) this.markDirty('saves');
    for (const [key, r] of [...this.ranking]) {
      if (r.profileId !== profileId) continue;
      this.ranking.delete(key);
      out.ranking++;
    }
    if (out.ranking) this.markDirty('ranking');
    const sessions = new Set(this.telemetry.filter((e) => e.profileId === profileId).map((e) => e.sessionId));
    const before = this.telemetry.length;
    this.telemetry = this.telemetry.filter((e) => e.profileId !== profileId && !sessions.has(e.sessionId));
    out.telemetry = before - this.telemetry.length;
    if (out.telemetry) this.markDirty('telemetry');
    return out;
  }

  // --- telemetria -----------------------------------------------------------
  addTelemetry(events: readonly TelemetryInput[]): number {
    this.assertOpen();
    if (!events.length) return 0;
    for (const e of events) this.telemetry.push({ ...e, seq: ++this.seq });
    const excess = this.telemetry.length - this.maxTelemetry;
    if (excess > 0) this.telemetry.splice(0, excess);
    this.markDirty('telemetry');
    return events.length;
  }

  readTelemetry(q: TelemetryQuery = {}): TelemetryRecord[] {
    const names = q.names ? new Set(q.names) : null;
    const since = q.since ?? null;
    return this.telemetry.filter((e) => (!names || names.has(e.name)) && (since === null || e.t >= since));
  }

  stats(): StorageStats {
    return {
      profiles: this.profiles.size,
      saves: this.saves.size,
      saveBytes: this.saveBytes,
      ranking: this.ranking.size,
      telemetry: this.telemetry.length,
      telemetrySeq: this.seq,
    };
  }

  // --- persistência ---------------------------------------------------------
  private assertOpen(): void {
    if (this.closed) throw new StoreError('armazenamento já foi fechado');
  }

  private markDirty(c: CollectionName): void {
    this.dirty.add(c);
    if (this.closed) return;
    const now = Date.now();
    if (this.timer) {
      // já esperou demais: deixa o timer atual disparar
      if (now - this.firstDirtyAt >= this.maxWaitMs) return;
      clearTimeout(this.timer);
    } else {
      this.firstDirtyAt = now;
    }
    const wait = Math.max(0, Math.min(this.flushDelayMs, this.firstDirtyAt + this.maxWaitMs - now));
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, wait);
  }

  private serialize(c: CollectionName): string {
    const head = { format: FORMAT, collection: c, version: FILE_VERSION };
    switch (c) {
      case 'profiles':
        return JSON.stringify({ ...head, items: [...this.profiles.values()] }, null, 1);
      case 'ranking':
        return JSON.stringify({ ...head, items: [...this.ranking.values()] }, null, 1);
      case 'saves':
        return JSON.stringify({ ...head, items: [...this.saves.values()] });
      case 'telemetry':
        return JSON.stringify({ ...head, seq: this.seq, items: this.telemetry });
    }
  }

  /** Grava as coleções alteradas. Nunca rejeita: falhas são registradas e tentadas de novo. */
  flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const run = async () => {
      for (const c of JSON_COLLECTIONS) {
        if (!this.dirty.has(c)) continue;
        this.dirty.delete(c);
        const text = this.serialize(c);
        try {
          await writeAtomic(join(this.dir, `${c}.json`), text);
        } catch (err) {
          this.dirty.add(c);
          this.log(`[dados] falha ao gravar ${c}.json: ${(err as Error).message}`);
          if (!this.closed && !this.timer) {
            this.firstDirtyAt = Date.now();
            this.timer = setTimeout(() => {
              this.timer = null;
              void this.flush();
            }, 5000);
          }
        }
      }
    };
    this.chain = this.chain.then(run, run);
    return this.chain;
  }

  flushSync(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    for (const c of JSON_COLLECTIONS) {
      if (!this.dirty.has(c)) continue;
      try {
        writeAtomicSync(join(this.dir, `${c}.json`), this.serialize(c));
        this.dirty.delete(c);
      } catch (err) {
        this.log(`[dados] falha ao gravar ${c}.json: ${(err as Error).message}`);
      }
    }
  }

  async close(): Promise<void> {
    this.closed = true;
    await this.flush();
    if (this.dirty.size) this.flushSync();
  }
}
