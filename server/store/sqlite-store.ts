// =============================================================================
// SqliteStore — usa o módulo nativo node:sqlite (DatabaseSync), presente a partir
// do Node 22.5 (sem flag no 22.13+/23.4+). Detectado por import dinâmico; se não
// existir, o servidor cai para o JsonStore.
// =============================================================================
import { existsSync, mkdirSync } from 'node:fs';
import { createRequire as makeRequire } from 'node:module';
import { join } from 'node:path';
import type { DatabaseSync, SQLInputValue, SQLOutputValue, StatementSync } from 'node:sqlite';
import { SQLITE_FILE } from '../config';
import { jsonFilesExist, loadJsonSnapshot } from './json-store';
import {
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

type SqliteModule = typeof import('node:sqlite');
type Row = Record<string, SQLOutputValue>;

let cachedModule: SqliteModule | null | undefined;

/**
 * Importa node:sqlite se existir neste Node. Silencia o ExperimentalWarning
 * ("SQLite is an experimental feature…") que o Node emite ao carregar o módulo.
 */
export async function loadSqliteModule(): Promise<SqliteModule | null> {
  if (cachedModule !== undefined) return cachedModule;
  const original = process.emitWarning;
  const filtered = function (this: unknown, warning: string | Error, ...rest: unknown[]): void {
    const message = typeof warning === 'string' ? warning : (warning?.message ?? '');
    const first = rest[0];
    const type =
      typeof first === 'string' ? first : first && typeof first === 'object' ? (first as { type?: unknown }).type : undefined;
    const name = typeof warning === 'object' && warning ? warning.name : undefined;
    if ((type === 'ExperimentalWarning' || name === 'ExperimentalWarning') && /sqlite/i.test(message)) return;
    (original as (...args: unknown[]) => void).call(process, warning, ...rest);
  };
  process.emitWarning = filtered as typeof process.emitWarning;
  try {
    let mod: SqliteModule;
    try {
      mod = (await import('node:sqlite')) as SqliteModule;
    } catch {
      // alguns carregadores (ex.: vite-node, nos testes) tiram o prefixo "node:" e não
      // acham módulos que só existem com prefixo; o require nativo do Node acha
      mod = makeRequire(import.meta.url)('node:sqlite') as SqliteModule;
    }
    cachedModule = typeof mod?.DatabaseSync === 'function' ? mod : null;
  } catch {
    cachedModule = null;
  } finally {
    if (process.emitWarning === (filtered as typeof process.emitWarning)) process.emitWarning = original;
  }
  return cachedModule;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS saves (
  profile_id TEXT NOT NULL,
  slot TEXT NOT NULL,
  saved_at INTEGER NOT NULL,
  summary TEXT NOT NULL,
  data TEXT NOT NULL,
  size INTEGER NOT NULL,
  PRIMARY KEY (profile_id, slot)
);
CREATE TABLE IF NOT EXISTS ranking (
  mode TEXT NOT NULL,
  seed TEXT NOT NULL,
  name_key TEXT NOT NULL,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  calls INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  version TEXT NOT NULL DEFAULT '',
  profile_id TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (mode, seed, name_key)
);
CREATE INDEX IF NOT EXISTS ranking_mode_score ON ranking (mode, score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS ranking_seed_score ON ranking (mode, seed, score DESC, created_at ASC);
CREATE TABLE IF NOT EXISTS telemetry (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  profile_id TEXT,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  t INTEGER NOT NULL,
  received_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS telemetry_name_t ON telemetry (name, t);
`;

export interface SqliteStoreOptions {
  /** eventos de telemetria guardados; os mais antigos saem primeiro (padrão 1 milhão) */
  maxTelemetry?: number;
  log?: (msg: string) => void;
}

const n = (v: SQLOutputValue | undefined): number => (typeof v === 'number' ? v : typeof v === 'bigint' ? Number(v) : Number(v ?? 0));
const s = (v: SQLOutputValue | undefined): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function rowToRanking(r: Row): RankingEntry {
  return {
    mode: s(r.mode),
    seed: s(r.seed),
    name: s(r.name),
    score: n(r.score),
    calls: n(r.calls),
    correct: n(r.correct),
    version: s(r.version),
    profileId: r.profile_id == null ? null : s(r.profile_id),
    createdAt: n(r.created_at),
  };
}

function rowToSummary(text: string): SaveSummary {
  const v = parseJson(text) as Partial<SaveSummary> | null;
  return {
    day: typeof v?.day === 'number' ? v.day : 0,
    phase: typeof v?.phase === 'string' ? v.phase : '',
    mode: typeof v?.mode === 'string' ? v.mode : '',
    money: typeof v?.money === 'number' ? v.money : 0,
    gender: typeof v?.gender === 'string' ? v.gender : '',
    difficulty: typeof v?.difficulty === 'string' ? v.difficulty : '',
  };
}

export class SqliteStore implements Store {
  readonly kind = 'sqlite' as const;
  readonly location: string;
  private readonly db: DatabaseSync;
  private readonly st: Record<
    | 'insertProfile'
    | 'importProfile'
    | 'getProfile'
    | 'listSaves'
    | 'getSave'
    | 'saveSize'
    | 'upsertSave'
    | 'deleteSave'
    | 'getScore'
    | 'insertScore'
    | 'importScore'
    | 'updateScore'
    | 'rankOf'
    | 'topAll'
    | 'topSeed'
    | 'insertTelemetry'
    | 'pruneTelemetry'
    | 'deleteScore'
    | 'deleteProfile'
    | 'deleteProfileSaves'
    | 'deleteProfileScores'
    | 'deleteProfileTelemetry',
    StatementSync
  >;
  private readonly maxTelemetry: number;
  private readonly log: (msg: string) => void;
  private counts = { profiles: 0, saves: 0, saveBytes: 0, ranking: 0, telemetry: 0, seq: 0 };
  private closed = false;

  /** Abre (ou cria) o banco em `dir`. Devolve null se node:sqlite não existir neste Node. */
  static async open(dir: string, opts: SqliteStoreOptions = {}): Promise<SqliteStore | null> {
    const mod = await loadSqliteModule();
    if (!mod) return null;
    mkdirSync(dir, { recursive: true });
    const file = join(dir, SQLITE_FILE);
    const isNew = !existsSync(file);
    const db = new mod.DatabaseSync(file);
    try {
      const store = new SqliteStore(db, file, opts);
      if (isNew && jsonFilesExist(dir)) store.importLegacyJson(dir);
      return store;
    } catch (err) {
      try {
        db.close();
      } catch {
        /* ignorar */
      }
      throw err;
    }
  }

  private constructor(db: DatabaseSync, file: string, opts: SqliteStoreOptions) {
    this.db = db;
    this.location = file;
    this.maxTelemetry = opts.maxTelemetry ?? 1_000_000;
    this.log = opts.log ?? ((m) => console.log(m));
    db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000;');
    db.exec(SCHEMA);
    db.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('schema', '1')").run();
    this.st = {
      insertProfile: db.prepare('INSERT INTO profiles (id, name, created_at) VALUES (?, ?, ?)'),
      importProfile: db.prepare('INSERT OR IGNORE INTO profiles (id, name, created_at) VALUES (?, ?, ?)'),
      getProfile: db.prepare('SELECT id, name, created_at FROM profiles WHERE id = ?'),
      listSaves: db.prepare('SELECT slot, saved_at, summary FROM saves WHERE profile_id = ?'),
      getSave: db.prepare('SELECT slot, saved_at, summary, data FROM saves WHERE profile_id = ? AND slot = ?'),
      saveSize: db.prepare('SELECT size FROM saves WHERE profile_id = ? AND slot = ?'),
      upsertSave: db.prepare(
        `INSERT INTO saves (profile_id, slot, saved_at, summary, data, size) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (profile_id, slot) DO UPDATE SET
           saved_at = excluded.saved_at, summary = excluded.summary, data = excluded.data, size = excluded.size`,
      ),
      deleteSave: db.prepare('DELETE FROM saves WHERE profile_id = ? AND slot = ?'),
      getScore: db.prepare('SELECT * FROM ranking WHERE mode = ? AND seed = ? AND name_key = ?'),
      insertScore: db.prepare(
        `INSERT INTO ranking (mode, seed, name_key, name, score, calls, correct, version, profile_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ),
      importScore: db.prepare(
        `INSERT OR IGNORE INTO ranking (mode, seed, name_key, name, score, calls, correct, version, profile_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ),
      updateScore: db.prepare(
        `UPDATE ranking SET name = ?, score = ?, calls = ?, correct = ?, version = ?, profile_id = ?, created_at = ?
         WHERE mode = ? AND seed = ? AND name_key = ?`,
      ),
      rankOf: db.prepare(
        `SELECT COUNT(*) AS n FROM ranking WHERE mode = ? AND seed = ?
           AND (score > ? OR (score = ? AND (created_at < ? OR (created_at = ? AND name < ?))))`,
      ),
      topAll: db.prepare('SELECT * FROM ranking WHERE mode = ? ORDER BY score DESC, created_at ASC, name ASC LIMIT ?'),
      topSeed: db.prepare(
        'SELECT * FROM ranking WHERE mode = ? AND seed = ? ORDER BY score DESC, created_at ASC, name ASC LIMIT ?',
      ),
      insertTelemetry: db.prepare(
        'INSERT INTO telemetry (session_id, profile_id, name, data, t, received_at) VALUES (?, ?, ?, ?, ?, ?)',
      ),
      pruneTelemetry: db.prepare('DELETE FROM telemetry WHERE seq <= ?'),
      deleteScore: db.prepare('DELETE FROM ranking WHERE mode = ? AND seed = ? AND name_key = ?'),
      deleteProfile: db.prepare('DELETE FROM profiles WHERE id = ?'),
      deleteProfileSaves: db.prepare('DELETE FROM saves WHERE profile_id = ?'),
      deleteProfileScores: db.prepare('DELETE FROM ranking WHERE profile_id = ?'),
      // a telemetria do perfil e a das sessões em que ele apareceu (o mesmo jogador)
      deleteProfileTelemetry: db.prepare(
        'DELETE FROM telemetry WHERE profile_id = ? OR session_id IN (SELECT DISTINCT session_id FROM telemetry WHERE profile_id = ?)',
      ),
    };
    this.refreshCounts();
  }

  private one(sql: string): Row {
    return (this.db.prepare(sql).get() ?? {}) as Row;
  }

  private refreshCounts(): void {
    const saves = this.one('SELECT COUNT(*) AS c, COALESCE(SUM(size), 0) AS b FROM saves');
    const tel = this.one('SELECT COUNT(*) AS c, COALESCE(MAX(seq), 0) AS m FROM telemetry');
    const seqRow = this.one("SELECT COALESCE(MAX(seq), 0) AS m FROM sqlite_sequence WHERE name = 'telemetry'");
    this.counts = {
      profiles: n(this.one('SELECT COUNT(*) AS c FROM profiles').c),
      saves: n(saves.c),
      saveBytes: n(saves.b),
      ranking: n(this.one('SELECT COUNT(*) AS c FROM ranking').c),
      telemetry: n(tel.c),
      seq: Math.max(n(tel.m), n(seqRow.m)),
    };
  }

  private assertOpen(): void {
    if (this.closed) throw new StoreError('armazenamento já foi fechado');
  }

  private transaction(fn: () => void): void {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      fn();
      this.db.exec('COMMIT');
    } catch (err) {
      try {
        this.db.exec('ROLLBACK');
      } catch {
        /* transação já encerrada */
      }
      throw err;
    }
  }

  /** Primeira execução com SQLite numa pasta que já tinha dados JSON: importa tudo. */
  private importLegacyJson(dir: string): void {
    const snap = loadJsonSnapshot(dir, 'ignore');
    const total = snap.profiles.length + snap.saves.length + snap.ranking.length + snap.telemetry.length;
    if (!total) return;
    try {
      this.transaction(() => {
        for (const p of snap.profiles) this.st.importProfile.run(p.id, p.name, p.createdAt);
        for (const r of snap.saves) {
          this.st.upsertSave.run(r.profileId, r.slot, r.savedAt, JSON.stringify(r.summary), r.data, Buffer.byteLength(r.data));
        }
        for (const r of snap.ranking) {
          this.st.importScore.run(r.mode, r.seed, nameKey(r.name), r.name, r.score, r.calls, r.correct, r.version, r.profileId, r.createdAt);
        }
        for (const e of snap.telemetry) {
          this.st.insertTelemetry.run(e.sessionId, e.profileId, e.name, JSON.stringify(e.data ?? null), Math.round(e.t), Math.round(e.receivedAt));
        }
      });
    } catch (err) {
      this.log(`[dados] não consegui importar os dados JSON antigos para o SQLite: ${(err as Error).message}`);
      return;
    }
    this.refreshCounts();
    this.log(
      `[dados] Importei para o SQLite os dados que estavam em JSON (${snap.profiles.length} perfis, ` +
        `${snap.saves.length} saves, ${snap.ranking.length} recordes, ${snap.telemetry.length} eventos). ` +
        'Os arquivos .json ficaram intactos como backup.',
    );
  }

  // --- perfis ---------------------------------------------------------------
  createProfile(p: Profile): void {
    this.assertOpen();
    this.st.insertProfile.run(p.id, p.name, p.createdAt);
    this.counts.profiles++;
  }

  getProfile(id: string): Profile | null {
    this.assertOpen();
    const r = this.st.getProfile.get(id);
    return r ? { id: s(r.id), name: s(r.name), createdAt: n(r.created_at) } : null;
  }

  // --- saves ----------------------------------------------------------------
  listSaves(profileId: string): SaveMeta[] {
    this.assertOpen();
    return this.st.listSaves
      .all(profileId)
      .map((r) => ({ slot: s(r.slot), savedAt: n(r.saved_at), summary: rowToSummary(s(r.summary)) }))
      .sort(compareSlots);
  }

  getSave(profileId: string, slot: string): SaveRecord | null {
    this.assertOpen();
    const r = this.st.getSave.get(profileId, slot);
    return r ? { slot: s(r.slot), savedAt: n(r.saved_at), summary: rowToSummary(s(r.summary)), data: s(r.data) } : null;
  }

  saveSize(profileId: string, slot: string): number {
    this.assertOpen();
    return n(this.st.saveSize.get(profileId, slot)?.size);
  }

  putSave(profileId: string, rec: SaveRecord): void {
    this.assertOpen();
    const size = Buffer.byteLength(rec.data);
    const previous = this.st.saveSize.get(profileId, rec.slot);
    this.st.upsertSave.run(profileId, rec.slot, rec.savedAt, JSON.stringify(rec.summary), rec.data, size);
    if (previous) {
      this.counts.saveBytes += size - n(previous.size);
    } else {
      this.counts.saves++;
      this.counts.saveBytes += size;
    }
  }

  deleteSave(profileId: string, slot: string): boolean {
    this.assertOpen();
    const previous = this.st.saveSize.get(profileId, slot);
    if (!previous) return false;
    this.st.deleteSave.run(profileId, slot);
    this.counts.saves--;
    this.counts.saveBytes -= n(previous.size);
    return true;
  }

  // --- ranking --------------------------------------------------------------
  getScore(mode: string, seed: string, name: string): RankingEntry | null {
    this.assertOpen();
    const r = this.st.getScore.get(mode, seed, nameKey(name));
    return r ? rowToRanking(r) : null;
  }

  submitScore(e: RankingEntry): SubmitResult {
    this.assertOpen();
    const key = nameKey(e.name);
    const current = this.st.getScore.get(e.mode, e.seed, key);
    let improved = false;
    if (!current) {
      this.st.insertScore.run(e.mode, e.seed, key, e.name, e.score, e.calls, e.correct, e.version, e.profileId, e.createdAt);
      this.counts.ranking++;
      improved = true;
    } else if (e.score > n(current.score)) {
      this.st.updateScore.run(e.name, e.score, e.calls, e.correct, e.version, e.profileId, e.createdAt, e.mode, e.seed, key);
      improved = true;
    }
    const best = improved ? { ...e } : rowToRanking(current as Row);
    const ahead = n(
      this.st.rankOf.get(best.mode, best.seed, best.score, best.score, best.createdAt, best.createdAt, best.name)?.n,
    );
    return { improved, best, rank: ahead + 1 };
  }

  topScores(q: RankingQuery): RankingEntry[] {
    this.assertOpen();
    const rows = q.seed == null ? this.st.topAll.all(q.mode, q.limit) : this.st.topSeed.all(q.mode, q.seed, q.limit);
    return rows.map(rowToRanking);
  }

  // --- telemetria -----------------------------------------------------------
  deleteScore(mode: string, seed: string, name: string): boolean {
    this.assertOpen();
    const r = this.st.deleteScore.run(mode, seed, nameKey(name));
    if (!Number(r.changes)) return false;
    this.counts.ranking--;
    return true;
  }

  deleteProfileData(profileId: string): DeletedData {
    this.assertOpen();
    const out: DeletedData = { profile: false, saves: 0, ranking: 0, telemetry: 0 };
    this.transaction(() => {
      out.profile = Number(this.st.deleteProfile.run(profileId).changes) > 0;
      out.saves = Number(this.st.deleteProfileSaves.run(profileId).changes);
      out.ranking = Number(this.st.deleteProfileScores.run(profileId).changes);
      out.telemetry = Number(this.st.deleteProfileTelemetry.run(profileId, profileId).changes);
    });
    this.refreshCounts();
    return out;
  }

  addTelemetry(events: readonly TelemetryInput[]): number {
    this.assertOpen();
    if (!events.length) return 0;
    let last = this.counts.seq;
    this.transaction(() => {
      for (const e of events) {
        const r = this.st.insertTelemetry.run(e.sessionId, e.profileId, e.name, JSON.stringify(e.data ?? null), e.t, e.receivedAt);
        last = Math.max(last, Number(r.lastInsertRowid));
      }
    });
    this.counts.telemetry += events.length;
    this.counts.seq = last;
    if (this.counts.telemetry > this.maxTelemetry) {
      this.st.pruneTelemetry.run(this.counts.seq - this.maxTelemetry);
      this.counts.telemetry = n(this.one('SELECT COUNT(*) AS c FROM telemetry').c);
    }
    return events.length;
  }

  readTelemetry(q: TelemetryQuery = {}): TelemetryRecord[] {
    this.assertOpen();
    const where: string[] = [];
    const params: SQLInputValue[] = [];
    if (q.names && q.names.length) {
      where.push(`name IN (${q.names.map(() => '?').join(', ')})`);
      params.push(...q.names);
    }
    if (q.since != null) {
      where.push('t >= ?');
      params.push(q.since);
    }
    const sql =
      'SELECT seq, session_id, profile_id, name, data, t, received_at FROM telemetry' +
      (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
      ' ORDER BY seq';
    return this.db
      .prepare(sql)
      .all(...params)
      .map((r) => ({
        seq: n(r.seq),
        sessionId: s(r.session_id),
        profileId: r.profile_id == null ? null : s(r.profile_id),
        name: s(r.name),
        data: parseJson(s(r.data)),
        t: n(r.t),
        receivedAt: n(r.received_at),
      }));
  }

  stats(): StorageStats {
    return {
      profiles: this.counts.profiles,
      saves: this.counts.saves,
      saveBytes: this.counts.saveBytes,
      ranking: this.counts.ranking,
      telemetry: this.counts.telemetry,
      telemetrySeq: this.counts.seq,
    };
  }

  // --- persistência ---------------------------------------------------------
  /** SQLite grava na hora (WAL); não há nada pendente. */
  flush(): Promise<void> {
    return Promise.resolve();
  }

  flushSync(): void {
    /* nada pendente */
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    try {
      this.db.exec('PRAGMA optimize; PRAGMA wal_checkpoint(TRUNCATE);');
    } catch {
      /* não essencial */
    }
    this.db.close();
  }
}
