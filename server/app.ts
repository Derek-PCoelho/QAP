// =============================================================================
// QAP — Emergency Dispatch — aplicação HTTP (sem dependências: só node:http).
// createServer(opts) devolve { server, listen, close }; server.ts é só a entrada.
// =============================================================================
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import type { AddressInfo, Socket } from 'node:net';
import { DEFAULT_LIMITS, DEFAULT_PORT, DEFAULT_HOST, DEV_ORIGINS, EVENT_NAME_RE, type Limits } from './config';
import { HttpError, formatBytes, isPlainObject, readJson, sendJson, sendText } from './http';
import { DEFAULT_RATE_LIMITS, RateLimiter, type BucketName, type BucketSpec } from './ratelimit';
import * as v from './validate';
import type { RankingEntry, SaveSummary, Store, TelemetryInput } from './store/types';
import { computeMetrics, METRIC_EVENTS, type MetricsReport } from './metrics';
import { StaticFiles } from './static';
import { renderAdminPage } from './admin';
import { VERSION } from './version';
import { ADMIN_COOKIE, SECURITY_HEADERS, adminAccess, makeHostCheck, redactUrl } from './security';

export interface AppOptions {
  store: Store;
  /** pasta do cliente compilado (dist/client) */
  clientDir: string;
  version?: string;
  /** limites por balde; `false` desliga o rate limit */
  rateLimits?: Partial<Record<BucketName, BucketSpec>> | false;
  limits?: Partial<Limits>;
  /** confiar no X-Forwarded-For (só atrás de um proxy reverso) */
  trustProxy?: boolean;
  /** origens extras com CORS liberado, além do Vite (localhost:5173) */
  allowedOrigins?: readonly string[];
  logRequests?: boolean;
  /**
   * Nomes de Host aceitos além de IPs, "localhost" e o nome desta máquina (proteção contra
   * DNS rebinding; ver security.ts). Ex.: o domínio de um proxy reverso.
   */
  allowedHosts?: readonly string[];
  /** libera o painel /admin e as métricas pela rede para quem tiver este token */
  adminToken?: string;
  /** desliga partes da API sem precisar de atualização (kill switch): respondem 503 */
  disabled?: { saves?: boolean; ranking?: boolean; telemetry?: boolean };
  /**
   * Ao escutar em 127.0.0.1, escuta também em ::1. No macOS "localhost" pode
   * resolver primeiro para IPv6 (e o proxy do Vite aponta para localhost:7270).
   */
  dualLoopback?: boolean;
  log?: (msg: string) => void;
}

export interface ListenInfo {
  host: string;
  port: number;
  /** URL amigável para mostrar/abrir */
  url: string;
  /** endereços extras em que também escutamos (ex.: ::1) */
  alsoOn: string[];
}

export interface App {
  readonly server: http.Server;
  readonly handler: http.RequestListener;
  listen(port?: number, host?: string): Promise<ListenInfo>;
  close(): Promise<void>;
}

interface RouteCtx {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  params: string[];
}

interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: RegExp;
  bucket?: BucketName;
  status?: number;
  handler: (ctx: RouteCtx) => unknown;
}

const SAVE_PATH = /^\/api\/saves\/([^/]+)\/([^/]+)$/;
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1']);

const newId = (): string => randomBytes(12).toString('base64url');

function publicEntry(e: RankingEntry) {
  return { name: e.name, score: e.score, calls: e.calls, correct: e.correct, seed: e.seed, createdAt: e.createdAt };
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    throw new HttpError(400, 'caminho inválido');
  }
}

function sameOrigin(origin: string, host: string | undefined): boolean {
  if (!host) return false;
  try {
    return new URL(origin).host === host.toLowerCase();
  } catch {
    return false;
  }
}

export function createServer(opts: AppOptions): App {
  const store = opts.store;
  const limits: Limits = { ...DEFAULT_LIMITS, ...opts.limits };
  const version = opts.version ?? VERSION;
  const log = opts.log ?? ((m: string) => console.log(m));
  const limiter = opts.rateLimits === false ? null : new RateLimiter({ ...DEFAULT_RATE_LIMITS, ...opts.rateLimits });
  const corsOrigins = new Set([...DEV_ORIGINS, ...(opts.allowedOrigins ?? [])]);
  const statics = new StaticFiles(opts.clientDir);
  const hostOk = makeHostCheck(opts.allowedHosts ?? []);
  const disabled = opts.disabled ?? {};
  let metricsCache: { key: string; at: number; value: MetricsReport } | null = null;

  // ---------------------------------------------------------------------------
  // auxiliares de domínio
  // ---------------------------------------------------------------------------
  function existingProfile(rawId: string) {
    const id = v.requireProfileId(rawId);
    const p = store.getProfile(id);
    if (!p) throw new HttpError(404, 'perfil não encontrado');
    return p;
  }

  /** painel e métricas: só neste computador ou com o ADMIN_TOKEN (security.ts) */
  function requireAdmin(req: IncomingMessage, url: URL): void {
    const a = adminAccess(req, url, { token: opts.adminToken, trustProxy: opts.trustProxy });
    if (!a.ok) throw new HttpError(403, a.message);
  }

  /** kill switch: a parte desligada responde 503 */
  function requireOn(part: 'saves' | 'ranking' | 'telemetry'): void {
    if (disabled[part]) {
      const label = { saves: 'saves', ranking: 'ranking', telemetry: 'telemetria' }[part];
      throw new HttpError(503, `${label} desligado neste servidor`);
    }
  }

  function parseSummary(value: unknown): SaveSummary {
    const s = v.requireObject(value, 'summary');
    return {
      day: v.requireInt(s.day, 'summary.day', 0, 9999),
      phase: v.requireToken(s.phase, 'summary.phase'),
      mode: v.requireToken(s.mode, 'summary.mode'),
      money: v.requireNumber(s.money, 'summary.money', -1e9, 1e9),
      gender: v.requireToken(s.gender, 'summary.gender'),
      difficulty: v.requireToken(s.difficulty, 'summary.difficulty'),
    };
  }

  function parseLimit(raw: string | null): number {
    if (raw === null || raw.trim() === '') return limits.rankingDefault;
    if (!/^\d{1,6}$/.test(raw.trim())) throw new HttpError(400, 'limit inválido');
    return Math.min(limits.rankingMax, Math.max(1, Number(raw)));
  }

  function normalizeEvent(raw: unknown, sessionId: string, profileId: string | null, now: number): TelemetryInput | null {
    if (!isPlainObject(raw)) return null;
    const name = raw.name;
    if (typeof name !== 'string' || !EVENT_NAME_RE.test(name)) return null;
    const data = raw.data === undefined || raw.data === null ? {} : raw.data;
    if (!isPlainObject(data)) return null;
    const t = typeof raw.t === 'number' && Number.isFinite(raw.t) && raw.t > 0 && raw.t < 8.64e15 ? Math.round(raw.t) : now;
    let size: number;
    try {
      size = Buffer.byteLength(JSON.stringify({ name, data, t }));
    } catch {
      return null;
    }
    if (size > limits.telemetryEventBytes) return null;
    return { sessionId, profileId, name, data, t, receivedAt: now };
  }

  // ---------------------------------------------------------------------------
  // rotas
  // ---------------------------------------------------------------------------
  const routes: Route[] = [
    {
      method: 'GET',
      path: /^\/api\/health$/,
      handler: () => ({ ok: true, version, storage: store.kind, time: new Date().toISOString() }),
    },
    {
      method: 'POST',
      path: /^\/api\/profiles$/,
      bucket: 'profiles',
      status: 201,
      handler: async ({ req }) => {
        const body = v.requireObject(await readJson(req, limits.body));
        const name = v.requireLabel(body.name, 'name', 1, limits.nameMax);
        if (store.stats().profiles >= limits.maxProfiles) throw new HttpError(507, 'limite de perfis deste servidor atingido');
        let id = newId();
        for (let i = 0; i < 5 && store.getProfile(id); i++) id = newId();
        const profile = { id, name, createdAt: Date.now() };
        store.createProfile(profile);
        return profile;
      },
    },
    {
      method: 'GET',
      path: /^\/api\/profiles\/([^/]+)$/,
      handler: ({ params }) => existingProfile(params[0]),
    },
    {
      method: 'DELETE',
      path: /^\/api\/profiles\/([^/]+)$/,
      bucket: 'profiles',
      // pedido de exclusão de dados (LGPD): quem tem o id apaga o perfil, os saves, os
      // recordes do ranking e a telemetria ligados a ele
      handler: ({ params }) => {
        const p = existingProfile(params[0]);
        return { ok: true, deleted: store.deleteProfileData(p.id) };
      },
    },
    {
      method: 'GET',
      path: /^\/api\/saves\/([^/]+)$/,
      handler: ({ params }) => {
        requireOn('saves');
        return store.listSaves(existingProfile(params[0]).id);
      },
    },
    {
      method: 'GET',
      path: SAVE_PATH,
      handler: ({ params }) => {
        requireOn('saves');
        const pid = v.requireProfileId(params[0]);
        const slot = v.requireSlot(params[1]);
        existingProfile(pid);
        const save = store.getSave(pid, slot);
        if (!save) throw new HttpError(404, 'save não encontrado');
        return save;
      },
    },
    {
      method: 'PUT',
      path: SAVE_PATH,
      handler: async ({ req, params }) => {
        requireOn('saves');
        const pid = v.requireProfileId(params[0]);
        const slot = v.requireSlot(params[1]);
        existingProfile(pid);
        const body = v.requireObject(await readJson(req, limits.saveBody));
        const data = body.data;
        if (typeof data !== 'string' || data.length === 0) {
          throw new HttpError(400, 'data deve ser o JSON serializado do jogo (string)');
        }
        const size = Buffer.byteLength(data, 'utf8');
        if (size > limits.saveData) throw new HttpError(413, `save grande demais (máx. ${formatBytes(limits.saveData)})`);
        let parsed: unknown;
        try {
          parsed = JSON.parse(data);
        } catch {
          throw new HttpError(400, 'data não é um JSON válido');
        }
        if (!isPlainObject(parsed)) throw new HttpError(400, 'data deve ser um objeto JSON serializado');
        const summary = parseSummary(body.summary);
        if (store.stats().saveBytes - store.saveSize(pid, slot) + size > limits.maxSaveBytesTotal) {
          throw new HttpError(507, 'espaço para saves deste servidor esgotado');
        }
        const savedAt = Date.now();
        store.putSave(pid, { slot, savedAt, summary, data });
        return { ok: true, slot, savedAt };
      },
    },
    {
      method: 'DELETE',
      path: SAVE_PATH,
      handler: ({ params }) => {
        requireOn('saves');
        const pid = v.requireProfileId(params[0]);
        const slot = v.requireSlot(params[1]);
        existingProfile(pid);
        return { ok: true, deleted: store.deleteSave(pid, slot) };
      },
    },
    {
      method: 'GET',
      path: /^\/api\/ranking$/,
      handler: ({ url }) => {
        requireOn('ranking');
        const q = url.searchParams;
        const mode = v.requireMode(q.get('mode'));
        const seedRaw = q.get('seed');
        const seed = seedRaw === null || seedRaw.trim() === '' ? null : v.requireLabel(seedRaw, 'seed', 1, limits.seedMax);
        return store.topScores({ mode, seed, limit: parseLimit(q.get('limit')) }).map(publicEntry);
      },
    },
    {
      method: 'POST',
      path: /^\/api\/ranking$/,
      bucket: 'ranking',
      handler: async ({ req }) => {
        requireOn('ranking');
        const b = v.requireObject(await readJson(req, limits.body));
        const name = v.requireLabel(b.name, 'name', 1, limits.nameMax);
        const seed = v.requireLabel(b.seed, 'seed', 1, limits.seedMax);
        const mode = v.requireMode(b.mode);
        const ver = b.version === undefined || b.version === null ? '' : v.requireLabel(b.version, 'version', 0, limits.versionMax);
        const profileId = v.optionalProfileId(b.profileId);
        const calls = v.requireInt(b.calls, 'calls', 0, limits.maxCalls);
        const correct = v.requireInt(b.correct, 'correct', 0, limits.maxCalls);
        const score = v.requireInt(b.score, 'score', 0, limits.maxScore);
        if (correct > calls) throw new HttpError(400, 'correct não pode ser maior que calls');
        if (score > calls * limits.pointsPerCall) {
          throw new HttpError(400, `pontuação implausível (máx. ${limits.pointsPerCall} pontos por ligação)`);
        }
        if (store.stats().ranking >= limits.maxRankingEntries && !store.getScore(mode, seed, name)) {
          throw new HttpError(507, 'ranking deste servidor está cheio');
        }
        const r = store.submitScore({ mode, seed, name, score, calls, correct, version: ver, profileId, createdAt: Date.now() });
        return { ok: true, improved: r.improved, rank: r.rank, best: publicEntry(r.best) };
      },
    },
    {
      method: 'POST',
      path: /^\/api\/telemetry$/,
      bucket: 'telemetry',
      handler: async ({ req }) => {
        requireOn('telemetry');
        const b = v.requireObject(await readJson(req, limits.body));
        const sessionId = v.requireSessionId(b.sessionId);
        const profileId = v.optionalProfileId(b.profileId);
        if (!Array.isArray(b.events)) throw new HttpError(400, 'events deve ser uma lista');
        if (b.events.length > limits.telemetryEvents) {
          throw new HttpError(400, `no máximo ${limits.telemetryEvents} eventos por lote`);
        }
        const now = Date.now();
        const accepted: TelemetryInput[] = [];
        let rejected = 0;
        for (const raw of b.events) {
          const ev = normalizeEvent(raw, sessionId, profileId, now);
          if (ev) accepted.push(ev);
          else rejected++;
        }
        if (accepted.length) store.addTelemetry(accepted);
        return { ok: true, accepted: accepted.length, rejected };
      },
    },
    {
      method: 'GET',
      path: /^\/api\/metrics$/,
      handler: ({ req, url }) => {
        requireAdmin(req, url);
        const q = url.searchParams;
        const diffRaw = q.get('difficulty');
        const difficulty = diffRaw ? v.requireToken(diffRaw, 'difficulty') : null;
        const since = v.parseSince(q.get('since'));
        const stats = store.stats();
        const key = `${stats.telemetrySeq}|${stats.telemetry}|${difficulty ?? ''}|${since ?? ''}`;
        const now = Date.now();
        if (metricsCache && metricsCache.key === key && now - metricsCache.at < 60_000) return metricsCache.value;
        const records = store.readTelemetry({ names: METRIC_EVENTS, since });
        const report = computeMetrics(records, { difficulty, since, storage: store.kind, version, stored: stats.telemetry, now });
        metricsCache = { key, at: now, value: report };
        return report;
      },
    },
    {
      method: 'DELETE',
      path: /^\/api\/admin\/ranking$/,
      // tira do ranking uma entrada fraudulenta (só o painel: este computador ou ADMIN_TOKEN)
      handler: async ({ req, url }) => {
        requireAdmin(req, url);
        const b = v.requireObject(await readJson(req, limits.body));
        const mode = v.requireMode(b.mode);
        const seed = v.requireLabel(b.seed, 'seed', 1, limits.seedMax);
        const name = v.requireLabel(b.name, 'name', 1, limits.nameMax);
        return { ok: true, deleted: store.deleteScore(mode, seed, name) };
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // despacho
  // ---------------------------------------------------------------------------
  function clientIp(req: IncomingMessage): string {
    if (opts.trustProxy) {
      const xff = req.headers['x-forwarded-for'];
      const first = (Array.isArray(xff) ? xff[0] : xff)?.split(',')[0]?.trim();
      if (first) return first;
    }
    const ip = req.socket.remoteAddress ?? 'desconhecido';
    return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  }

  function rateLimit(bucket: BucketName, req: IncomingMessage): void {
    if (!limiter) return;
    const r = limiter.take(bucket, clientIp(req));
    if (!r.ok) {
      throw new HttpError(429, `muitas requisições; tente de novo em ${r.retryAfter} s`, { 'Retry-After': String(r.retryAfter) });
    }
  }

  async function handleApi(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
    const origin = req.headers.origin;
    const corsOk = typeof origin === 'string' && corsOrigins.has(origin);
    if (corsOk) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    const method = (req.method ?? 'GET').toUpperCase();
    if (method === 'OPTIONS') {
      const headers: Record<string, string | number> = { 'Content-Length': 0 };
      if (corsOk) {
        headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        headers['Access-Control-Allow-Headers'] = 'Content-Type';
        headers['Access-Control-Max-Age'] = 600;
      }
      res.writeHead(204, headers);
      res.end();
      return;
    }
    // escrita vinda de outra página (CSRF): só a própria origem ou as liberadas
    if (method !== 'GET' && method !== 'HEAD' && typeof origin === 'string' && !corsOk && !sameOrigin(origin, req.headers.host)) {
      throw new HttpError(403, 'origem não permitida');
    }
    rateLimit('api', req);

    let path = url.pathname;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    const allowed: string[] = [];
    for (const route of routes) {
      const m = route.path.exec(path);
      if (!m) continue;
      allowed.push(route.method);
      if (route.method !== method && !(method === 'HEAD' && route.method === 'GET')) continue;
      if (route.bucket) rateLimit(route.bucket, req);
      const params = m.slice(1).map(safeDecode);
      const result = await route.handler({ req, res, url, params });
      sendJson(req, res, route.status ?? 200, result);
      return;
    }
    if (allowed.length) throw new HttpError(405, 'método não permitido', { Allow: [...new Set(allowed)].join(', ') });
    throw new HttpError(404, 'rota não encontrada');
  }

  function serveAdmin(req: IncomingMessage, res: ServerResponse, url: URL): void {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendText(req, res, 405, 'Método não permitido.', undefined, { Allow: 'GET, HEAD' });
      return;
    }
    const access = adminAccess(req, url, { token: opts.adminToken, trustProxy: opts.trustProxy });
    if (!access.ok) {
      // quem tenta adivinhar o token passa pelo limite de taxa (10 tentativas por minuto)
      const tried = url.searchParams.has('token') || !!req.headers.authorization || /(?:^|;\s*)qap_admin=/.test(String(req.headers.cookie ?? ''));
      if (tried) {
        try {
          rateLimit('profiles', req);
        } catch (e) {
          const h = e instanceof HttpError ? e.headers : undefined;
          sendText(req, res, 429, 'Muitas tentativas. Espere um pouco.', undefined, h);
          return;
        }
      }
      sendText(req, res, 403, `Painel indisponível: ${access.message}.`);
      return;
    }
    if (access.fromQuery) {
      // o token da URL vira cookie do painel e some da barra de endereços (e do histórico)
      res.writeHead(303, {
        Location: '/admin',
        'Set-Cookie': `${ADMIN_COOKIE}=${encodeURIComponent(opts.adminToken!.trim())}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`,
        'Cache-Control': 'no-store',
        'Content-Length': 0,
      });
      res.end();
      return;
    }
    const nonce = randomBytes(16).toString('base64');
    sendText(req, res, 200, renderAdminPage({ nonce, version }), 'text/html; charset=utf-8', {
      'Content-Security-Policy':
        `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; ` +
        "img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
    });
  }

  function sendError(req: IncomingMessage, res: ServerResponse, err: unknown, asJson: boolean): void {
    let status = 500;
    let message = 'erro interno do servidor';
    let headers: Record<string, string> = {};
    if (err instanceof HttpError) {
      status = err.status;
      message = err.message;
      headers = { ...err.headers };
    } else {
      console.error(`[qap] erro interno em ${req.method} ${redactUrl(req.url)}:`, err);
    }
    if (status === 413) headers.Connection = 'close';
    if (res.headersSent) {
      res.destroy();
      return;
    }
    if (asJson) sendJson(req, res, status, { error: message }, headers);
    else sendText(req, res, status, message, undefined, headers);
  }

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const started = Date.now();
    if (opts.logRequests) {
      // sem o id de perfil (é a senha do perfil) nem tokens
      res.on('finish', () => log(`${req.method} ${redactUrl(req.url)} → ${res.statusCode} (${Date.now() - started} ms)`));
    }
    let isApi = false;
    try {
      for (const [k, val] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, val);
      isApi = (req.url ?? '').startsWith('/api');
      // DNS rebinding: um site de fora com o próprio domínio apontado para cá não passa
      if (!hostOk(req.headers.host)) throw new HttpError(403, 'host não permitido (proteção contra DNS rebinding; veja ALLOWED_HOSTS)');
      let url: URL;
      try {
        url = new URL(req.url ?? '/', 'http://localhost');
      } catch {
        throw new HttpError(400, 'URL inválida');
      }
      const pathname = url.pathname;
      isApi = pathname === '/api' || pathname.startsWith('/api/');
      if (isApi) return await handleApi(req, res, url);
      if (pathname === '/admin' || pathname === '/admin/') return serveAdmin(req, res, url);
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return sendText(req, res, 405, 'Método não permitido.', undefined, { Allow: 'GET, HEAD' });
      }
      await statics.handle(req, res, pathname);
    } catch (err) {
      try {
        sendError(req, res, err, isApi);
      } catch {
        res.destroy();
      }
    }
  }

  const handler: http.RequestListener = (req, res) => {
    void handle(req, res);
  };

  // conexões abertas e as que têm requisição em andamento: no close() as demais
  // (keep-alive ociosas e pré-conexões do navegador, sem requisição) caem na hora
  const sockets = new Set<Socket>();
  const busy = new Set<Socket>();
  let closingDown = false;

  // conexões abertas por endereço: um cliente sozinho não ocupa o servidor inteiro com conexões
  // paradas (atrás de proxy todas vêm do mesmo endereço, então ali não há limite por endereço)
  const perIp = new Map<string, number>();
  const MAX_CONN_PER_IP = 32;

  function configure(s: http.Server): http.Server {
    s.requestTimeout = 60_000;
    s.headersTimeout = 15_000;
    s.keepAliveTimeout = 5_000;
    // conexões e cabeçalhos limitados: um cliente sozinho não esgota o servidor
    s.maxConnections = 512;
    s.maxHeadersCount = 100;
    s.on('connection', (socket: Socket) => {
      const ip = socket.remoteAddress ?? '?';
      if (!opts.trustProxy) {
        const n = (perIp.get(ip) ?? 0) + 1;
        perIp.set(ip, n);
        socket.once('close', () => {
          const left = (perIp.get(ip) ?? 1) - 1;
          if (left > 0) perIp.set(ip, left);
          else perIp.delete(ip);
        });
        if (n > MAX_CONN_PER_IP) {
          socket.destroy();
          return;
        }
      }
      sockets.add(socket);
      socket.once('close', () => {
        sockets.delete(socket);
        busy.delete(socket);
      });
    });
    s.on('request', (req: IncomingMessage, res: ServerResponse) => {
      const socket = req.socket;
      busy.add(socket);
      if (closingDown) res.shouldKeepAlive = false;
      res.once('close', () => {
        busy.delete(socket);
        // encerrando: a resposta terminou, não há por que manter o keep-alive
        if (closingDown) socket.end();
      });
    });
    s.on('clientError', (err: NodeJS.ErrnoException, socket) => {
      if (err.code === 'ECONNRESET' || !socket.writable) {
        socket.destroy();
        return;
      }
      const status = err.code === 'HPE_HEADER_OVERFLOW' ? '431 Request Header Fields Too Large' : err.code === 'ERR_HTTP_REQUEST_TIMEOUT' ? '408 Request Timeout' : '400 Bad Request';
      socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
    });
    return s;
  }

  // conexões paradas sem cabeçalho conferidas a cada 2 s (o padrão do Node é 30 s)
  const serverOpts: http.ServerOptions = { connectionsCheckingInterval: 2_000 };
  const server = configure(http.createServer(serverOpts, handler));
  const extraServers: http.Server[] = [];
  const pruneTimer = setInterval(() => limiter?.prune(), 60_000);
  pruneTimer.unref();

  function listenOn(s: http.Server, port: number, host: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const onError = (err: Error) => {
        s.off('listening', onListening);
        reject(err);
      };
      const onListening = () => {
        s.off('error', onError);
        resolve();
      };
      s.once('error', onError);
      s.once('listening', onListening);
      s.listen(port, host);
    });
  }

  async function listen(port: number = DEFAULT_PORT, host: string = DEFAULT_HOST): Promise<ListenInfo> {
    await listenOn(server, port, host);
    const actual = (server.address() as AddressInfo).port;
    const alsoOn: string[] = [];
    if (opts.dualLoopback && (host === '127.0.0.1' || host === 'localhost')) {
      const extra = configure(http.createServer(serverOpts, handler));
      try {
        await listenOn(extra, actual, '::1');
        extraServers.push(extra);
        alsoOn.push('::1');
      } catch {
        /* sem IPv6 ou já ocupado: tudo bem */
      }
    }
    const shown = LOOPBACK.has(host) || host === '0.0.0.0' || host === '::' ? 'localhost' : host.includes(':') ? `[${host}]` : host;
    return { host, port: actual, url: `http://${shown}:${actual}/`, alsoOn };
  }

  async function close(): Promise<void> {
    clearInterval(pruneTimer);
    closingDown = true;
    const closing = [server, ...extraServers].map(
      (s) =>
        new Promise<void>((resolve) => {
          if (!s.listening) return resolve();
          // respostas em andamento têm 2 s para terminar
          const force = setTimeout(() => s.closeAllConnections?.(), 2000);
          force.unref();
          s.close(() => {
            clearTimeout(force);
            resolve();
          });
        }),
    );
    // keep-alive ociosas e pré-conexões do navegador (sem requisição) caem já
    for (const socket of sockets) if (!busy.has(socket)) socket.destroy();
    await Promise.all(closing);
  }

  return { server, handler, listen, close };
}
