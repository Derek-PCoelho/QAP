// =============================================================================
// QAP — Emergency Dispatch — constantes do servidor (limites, formatos de id, slots).
// =============================================================================

export const KB = 1024;
export const MB = 1024 * KB;

export const DEFAULT_PORT = 7270;
export const DEFAULT_HOST = '127.0.0.1';

export interface Limits {
  /** corpo JSON padrão das rotas da API */
  body: number;
  /**
   * corpo do PUT de save. O campo `data` (até 2 MB) vai escapado dentro do JSON,
   * então o corpo pode passar um pouco de 2 MB; o limite semântico é `saveData`.
   */
  saveBody: number;
  /** tamanho máximo (bytes UTF-8) do JSON serializado do jogo (campo `data`) */
  saveData: number;
  /** eventos por lote de telemetria */
  telemetryEvents: number;
  /** bytes por evento de telemetria ({ name, data, t } serializado) */
  telemetryEventBytes: number;
  /** nome de perfil/ranking: 1..nameMax caracteres */
  nameMax: number;
  /** rótulo de semente: 1..seedMax caracteres */
  seedMax: number;
  versionMax: number;
  rankingDefault: number;
  rankingMax: number;
  /** travas contra encher o disco (relevantes quando o servidor fica exposto na rede) */
  maxProfiles: number;
  maxSaveBytesTotal: number;
  maxRankingEntries: number;
  maxScore: number;
  maxCalls: number;
  /** pontuação máxima plausível por ligação no modo infinito */
  pointsPerCall: number;
}

export const DEFAULT_LIMITS: Readonly<Limits> = Object.freeze({
  body: 64 * KB,
  saveBody: 3 * MB,
  saveData: 2 * MB,
  telemetryEvents: 200,
  telemetryEventBytes: 4 * KB,
  nameMax: 24,
  seedMax: 64,
  versionMax: 32,
  rankingDefault: 20,
  rankingMax: 100,
  maxProfiles: 10_000,
  maxSaveBytesTotal: 512 * MB,
  maxRankingEntries: 100_000,
  maxScore: 1_000_000,
  maxCalls: 100_000,
  pointsPerCall: 360,
});

export const SLOTS = ['auto', '1', '2', '3', 'infinito'] as const;
export type Slot = (typeof SLOTS)[number];

export const MODES = ['infinito', 'campanha', 'simone'] as const;
export type GameMode = (typeof MODES)[number];

/** id de perfil: 16 caracteres url-safe (base64url de 12 bytes aleatórios) */
export const ID_RE = /^[A-Za-z0-9_-]{16}$/;
export const SLOT_RE = /^(?:auto|[123]|infinito)$/;
export const SESSION_RE = /^[A-Za-z0-9_-]{8,64}$/;
export const EVENT_NAME_RE = /^[a-z][a-z0-9_]{0,39}$/;
/** strings curtas do resumo do save (phase, mode, difficulty...) */
export const TOKEN_RE = /^[A-Za-z0-9_-]{1,24}$/;

/** origens do Vite em desenvolvimento — as únicas com CORS liberado por padrão */
export const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export const SQLITE_FILE = 'qap.sqlite';
