// =============================================================================
// Contrato de armazenamento. Dois backends: SqliteStore (node:sqlite, Node ≥ 22.5)
// e JsonStore (um arquivo JSON por coleção). Leituras e escritas são síncronas
// (ambos trabalham em memória/arquivo local); flush/close são assíncronos.
// =============================================================================

export type StorageKind = 'sqlite' | 'json';

export interface Profile {
  id: string;
  name: string;
  createdAt: number;
}

export interface SaveSummary {
  day: number;
  phase: string;
  mode: string;
  money: number;
  gender: string;
  difficulty: string;
}

export interface SaveMeta {
  slot: string;
  savedAt: number;
  summary: SaveSummary;
}

export interface SaveRecord extends SaveMeta {
  /** JSON serializado do jogo, guardado exatamente como chegou */
  data: string;
}

export interface RankingEntry {
  mode: string;
  seed: string;
  name: string;
  score: number;
  calls: number;
  correct: number;
  version: string;
  profileId: string | null;
  createdAt: number;
}

export interface RankingQuery {
  mode: string;
  /** sem semente = ranking geral (todas as sementes) */
  seed?: string | null;
  limit: number;
}

export interface SubmitResult {
  /** a pontuação enviada virou o novo recorde de (nome, semente) */
  improved: boolean;
  /** melhor registro atual de (nome, semente) */
  best: RankingEntry;
  /** posição (1 = primeiro) do melhor registro no ranking daquela semente */
  rank: number;
}

export interface TelemetryInput {
  sessionId: string;
  profileId: string | null;
  name: string;
  data: unknown;
  /** horário do cliente (ms desde a época) */
  t: number;
  /** horário do servidor ao receber (ms desde a época) */
  receivedAt: number;
}

export interface TelemetryRecord extends TelemetryInput {
  seq: number;
}

export interface TelemetryQuery {
  names?: readonly string[];
  /** só eventos com t >= since */
  since?: number | null;
}

export interface StorageStats {
  profiles: number;
  saves: number;
  saveBytes: number;
  ranking: number;
  telemetry: number;
  /** maior seq de telemetria já atribuído (muda a cada inserção) */
  telemetrySeq: number;
}

/** o que foi apagado num pedido de exclusão de dados (LGPD) */
export interface DeletedData {
  profile: boolean;
  saves: number;
  ranking: number;
  telemetry: number;
}

export interface Store {
  readonly kind: StorageKind;
  /** arquivo (SQLite) ou pasta (JSON) onde os dados vivem */
  readonly location: string;

  createProfile(p: Profile): void;
  getProfile(id: string): Profile | null;

  listSaves(profileId: string): SaveMeta[];
  getSave(profileId: string, slot: string): SaveRecord | null;
  /** grava ou substitui o save do slot */
  putSave(profileId: string, rec: SaveRecord): void;
  /** tamanho (bytes UTF-8) do `data` gravado no slot, ou 0 */
  saveSize(profileId: string, slot: string): number;
  deleteSave(profileId: string, slot: string): boolean;

  getScore(mode: string, seed: string, name: string): RankingEntry | null;
  submitScore(entry: RankingEntry): SubmitResult;
  topScores(q: RankingQuery): RankingEntry[];

  /** tira uma entrada do ranking (ex.: fraude); true se ela existia */
  deleteScore(mode: string, seed: string, name: string): boolean;
  /**
   * Pedido de exclusão de dados: apaga o perfil, os saves dele, os recordes enviados com o id
   * dele e a telemetria dele (inclusive a das sessões em que ele apareceu).
   */
  deleteProfileData(profileId: string): DeletedData;
  addTelemetry(events: readonly TelemetryInput[]): number;
  readTelemetry(q?: TelemetryQuery): TelemetryRecord[];

  stats(): StorageStats;
  flush(): Promise<void>;
  /** grava pendências de forma síncrona (uso em process.on('exit') / erro fatal) */
  flushSync(): void;
  close(): Promise<void>;
}

/** chave de comparação de nomes no ranking ("Ana" e "ANA" são a mesma pessoa) */
export function nameKey(name: string): string {
  return name.normalize('NFC').toLocaleLowerCase('pt-BR');
}

/** ordenação do ranking: maior pontuação, depois quem fez primeiro, depois nome */
export function compareScores(a: RankingEntry, b: RankingEntry): number {
  return b.score - a.score || a.createdAt - b.createdAt || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
}

export const SLOT_ORDER: Record<string, number> = { auto: 0, '1': 1, '2': 2, '3': 3, infinito: 4 };

export function compareSlots(a: { slot: string }, b: { slot: string }): number {
  return (SLOT_ORDER[a.slot] ?? 99) - (SLOT_ORDER[b.slot] ?? 99);
}

export function byteLength(s: string): number {
  return Buffer.byteLength(s, 'utf8');
}

export class StoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoreError';
  }
}
