// Testes do servidor (node:http + armazenamento JSON/SQLite), das métricas,
// do bundle e do cliente src/client/api.ts.
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import http from 'node:http';
import net from 'node:net';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';
import * as esbuild from 'esbuild';
import { createServer, type App, type AppOptions } from '../server/app';
import { openStore, loadSqliteModule, type Store, type TelemetryRecord } from '../server/store';
import { computeMetrics, type MetricsReport } from '../server/metrics';
import { resolvePaths } from '../server/paths';
import { RateLimiter } from '../server/ratelimit';
import { sanitizeLabel } from '../server/validate';

const sqliteAvailable = !!(await loadSqliteModule());
const KINDS = ['json', 'sqlite'] as const;
type Kind = (typeof KINDS)[number];

// -----------------------------------------------------------------------------
// utilidades
// -----------------------------------------------------------------------------
const tempDirs: string[] = [];
function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'qap-test-'));
  tempDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
});

const BIG_JS = `// app\n${'export const linha = "qap — central de regulação";\n'.repeat(200)}`;
const MP3 = Buffer.from(Array.from({ length: 4096 }, (_, i) => i % 251));

function makeClient(dir: string): void {
  mkdirSync(join(dir, 'assets'), { recursive: true });
  mkdirSync(join(dir, 'sons'), { recursive: true });
  writeFileSync(
    join(dir, 'index.html'),
    '<!doctype html><html><head><meta charset="utf-8"><title>QAP</title></head><body><div id="root">JOGO-INDEX</div>' +
      '<script type="module" src="./assets/index-AbCd1234.js"></script></body></html>',
  );
  writeFileSync(join(dir, 'assets', 'index-AbCd1234.js'), BIG_JS);
  writeFileSync(join(dir, 'assets', 'index-Zz9_8-7y.css'), 'body{background:#000}');
  writeFileSync(join(dir, 'favicon.ico'), Buffer.from([0, 0, 1, 0]));
  writeFileSync(join(dir, 'sons', 'bip.mp3'), MP3);
  writeFileSync(join(dir, '.segredo'), 'oculto');
}

interface Ctx {
  app: App;
  store: Store;
  base: string;
  port: number;
  dir: string;
  clientDir: string;
  dataDir: string;
}

async function startApp(kind: Kind, extra: Partial<AppOptions> = {}, opts: { client?: boolean } = {}): Promise<Ctx> {
  const dir = tempDir();
  const clientDir = join(dir, 'client');
  const dataDir = join(dir, 'data');
  if (opts.client !== false) makeClient(clientDir);
  writeFileSync(join(dir, 'secret.txt'), 'TOP-SECRET');
  const store = await openStore({ dataDir, prefer: kind, log: () => {} });
  const app = createServer({ store, clientDir, rateLimits: false, log: () => {}, ...extra });
  const info = await app.listen(0, '127.0.0.1');
  return { app, store, base: `http://127.0.0.1:${info.port}`, port: info.port, dir, clientDir, dataDir };
}

async function stopApp(c: Ctx | undefined): Promise<void> {
  if (!c) return;
  await c.app.close();
  await c.store.close();
}

interface Res {
  status: number;
  json: any;
  text: string;
  headers: Headers;
}

async function req(c: Ctx, method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<Res> {
  const init: RequestInit = { method, headers: { ...headers } };
  if (body !== undefined) {
    init.body = typeof body === 'string' || Buffer.isBuffer(body) ? (body as string) : JSON.stringify(body);
    (init.headers as Record<string, string>)['content-type'] ??= 'application/json';
  }
  const res = await fetch(c.base + path, init);
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text, headers: res.headers };
}

/** requisição crua (o caminho vai exatamente como escrito, sem normalização do cliente) */
function raw(
  c: Ctx,
  path: string,
  opts: { method?: string; headers?: Record<string, string>; body?: string | Buffer } = {},
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const r = http.request(
      { host: '127.0.0.1', port: c.port, path, method: opts.method ?? 'GET', headers: opts.headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (d: Buffer) => chunks.push(d));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
      },
    );
    r.on('error', reject);
    if (opts.body !== undefined) r.write(opts.body);
    r.end();
  });
}

const summary = { day: 3, phase: 'casa', mode: 'campanha', money: 150, gender: 'F', difficulty: 'padrao' };
const gameJson = (extra: Record<string, unknown> = {}) => JSON.stringify({ v: 3, day: 3, flags: { a: true }, ...extra });

// -----------------------------------------------------------------------------
// telemetria sintética (cenário usado nos testes de métricas)
// -----------------------------------------------------------------------------
interface EvIn {
  sessionId: string;
  profileId?: string | null;
  name: string;
  data: Record<string, unknown>;
  t: number;
}

const PROFILE_C = 'PROFILEc00000001';

function scenario(): EvIn[] {
  const out: EvIn[] = [];
  let t = 1_700_000_000_000;
  const add = (sessionId: string, name: string, data: Record<string, unknown>, profileId: string | null = null) =>
    out.push({ sessionId, profileId, name, data, t: (t += 1000) });
  const day = (sid: string, d: number, extra: Record<string, unknown> = {}, pid: string | null = null) =>
    add(sid, 'day_end', { day: d, warnings: 1, notes: 0, deaths: 0, saves: 2, handled: 10, pay: 30, desgaste: 20, money: 100 + d, ...extra }, pid);

  // A — 1ª campanha completa (final normal), depois uma 2ª campanha que termina em despejo
  add('sessA0001', 'campaign_start', { difficulty: 'padrao', gender: 'F', variable: false, first: true });
  for (let d = 1; d <= 20; d++) {
    day('sessA0001', d);
    if ([3, 7, 12].includes(d)) add('sessA0001', 'bico', { day: d });
    if (d === 1) add('sessA0001', 'call_time', { seconds: 80, day: 1 });
    if (d === 2) add('sessA0001', 'call_time', { seconds: 100, day: 2 });
    if (d === 9) {
      add('sessA0001', 'd9_choice', { scenario: 'M', davi: 'USA', marcia: 'USB' });
      add('sessA0001', 'rendezvous', { day: 9 });
    }
    if (d === 19) add('sessA0001', 'cida_d19', { recognized: true });
  }
  add('sessA0001', 'ending', { kind: 'normal', keys: 4, money: 300, lacos: 6, integridade: 7 });
  out.push({ ...out[out.length - 1] }); // reenvio idêntico: deve contar uma vez só
  add('sessA0001', 'campaign_start', { difficulty: 'padrao', gender: 'F', variable: false, first: false });
  for (let d = 1; d <= 5; d++) day('sessA0001', d);
  add('sessA0001', 'gameover', { kind: 'despejo', day: 5 });
  out.push({ ...out[out.length - 1] }); // duplicata

  // B — game over no dia 8, recarrega o save e chega ao final ruim
  add('sessB0001', 'campaign_start', { difficulty: 'padrao', gender: 'M', variable: false, first: true });
  for (let d = 1; d <= 8; d++) day('sessB0001', d);
  add('sessB0001', 'gameover', { kind: 'despejo', day: 8 });
  day('sessB0001', 8, { money: 0 }); // dia 8 rejogado: vale este registro
  for (let d = 9; d <= 20; d++) day('sessB0001', d);
  add('sessB0001', 'd9_choice', { scenario: 'G', davi: 'USA', marcia: 'NONE' });
  add('sessB0001', 'ending', { kind: 'ruim', keys: 1, money: 10, lacos: 2, integridade: 3 });

  // C — dificuldade real; parte dos eventos já com perfil
  add('sessC0001', 'campaign_start', { difficulty: 'real', gender: 'F', variable: true, first: true });
  for (let d = 1; d <= 20; d++) {
    day('sessC0001', d, {}, d > 10 ? PROFILE_C : null);
    if (d === 2 || d === 4) add('sessC0001', 'bico', { day: d });
    if (d === 3) add('sessC0001', 'call_time', { seconds: 90, day: 3 });
    if (d === 9) add('sessC0001', 'd9_choice', { scenario: 'M', davi: 'ORI', marcia: 'ORI' });
    if (d === 19) add('sessC0001', 'cida_d19', { recognized: false }, PROFILE_C);
  }
  add('sessC0001', 'ending', { kind: 'bom', keys: 6, money: 500, lacos: 8, integridade: 9 }, PROFILE_C);

  // D — em andamento (dia 10)
  add('sessD0001', 'campaign_start', { difficulty: 'padrao', gender: 'M', variable: false, first: true });
  for (let d = 1; d <= 10; d++) {
    day('sessD0001', d);
    if (d === 9) add('sessD0001', 'd9_choice', { scenario: 'M', davi: 'IMPEDIMENTO', marcia: 'NONE' });
  }

  // E — telemetria sem campaign_start (campanha "órfã") + valores de call_time inválidos
  add('sessE0001', 'day_end', { day: 5, warnings: 2, notes: 0, deaths: 1, saves: 0, handled: 8, pay: 20, desgaste: 40, money: 50 });
  add('sessE0001', 'call_time', { seconds: 60, day: 5 });
  add('sessE0001', 'call_time', { seconds: 0, day: 5 });
  add('sessE0001', 'call_time', { seconds: 5000, day: 5 });

  // F — o navegador já tinha jogado antes (first: false): não é "1ª campanha"
  add('sessF0001', 'campaign_start', { difficulty: 'padrao', gender: 'F', variable: false, first: false });
  for (let d = 1; d <= 20; d++) day('sessF0001', d);
  add('sessF0001', 'ending', { kind: 'secreto', keys: 7, money: 900, lacos: 10, integridade: 10 });

  // modo infinito
  add('sessA0001', 'infinite_end', { score: 1000, calls: 10 });
  add('sessG0001', 'infinite_end', { score: 3000, calls: 20 });
  return out;
}

function toRecords(evs: EvIn[]): TelemetryRecord[] {
  return evs.map((e, i) => ({
    seq: i + 1,
    sessionId: e.sessionId,
    profileId: e.profileId ?? null,
    name: e.name,
    data: e.data,
    t: e.t,
    receivedAt: e.t,
  }));
}

const metric = (r: MetricsReport, id: string) => {
  const m = r.metrics.find((x) => x.id === id);
  if (!m) throw new Error(`métrica ${id} ausente`);
  return m;
};

function checkScenario(r: MetricsReport): void {
  expect(r.totals).toMatchObject({ sessions: 7, players: 7, campaigns: 6, firstCampaigns: 4 });

  const reach = metric(r, 'reach20');
  expect(reach).toMatchObject({ value: 66.7, n: 3, status: 'bad' });
  expect(r.firstCampaignOutcomes).toEqual({ total: 4, reached20: 2, gameover: 1, inProgress: 1 });

  expect(r.endings.n).toBe(3);
  expect(r.endings.status).toBe('bad');
  const ek = Object.fromEntries(r.endings.kinds.map((k) => [k.kind, k]));
  expect(ek.ruim).toMatchObject({ count: 1, pct: 33.3, status: 'ok' });
  expect(ek.normal).toMatchObject({ count: 1, pct: 33.3, status: 'bad' });
  expect(ek.bom).toMatchObject({ count: 1, pct: 33.3, status: 'bad' });
  expect(ek.secreto).toMatchObject({ count: 0, pct: 0, status: 'ok' });

  expect(metric(r, 'bicos')).toMatchObject({ value: 1.3, n: 4, status: 'bad', firstCampaign: { value: 1.7, n: 3 } });

  const davi = metric(r, 'usaDavi');
  expect(davi).toMatchObject({ value: 33.3, n: 3, status: 'bad' });
  expect(davi.detail).toEqual({ USA: 1, USB: 0, ORI: 1, IMPEDIMENTO: 1 });

  expect(metric(r, 'rendezvous')).toMatchObject({ value: 20, n: 5, status: 'bad', firstCampaign: { value: 25, n: 4 } });
  expect(metric(r, 'cida')).toMatchObject({ value: 50, n: 2, status: 'ok' });

  const call = metric(r, 'callTime');
  expect(call).toMatchObject({ value: 82.5, n: 4, status: 'ok' });
  expect(r.callTime).toEqual({ n: 4, mean: 82.5, median: 85, p90: 97 });

  expect(r.gameovers.total).toBe(2);
  expect(r.gameovers.byKind.find((k) => k.kind === 'despejo')).toMatchObject({ count: 2, avgDay: 6.5 });

  const d5 = r.perDay.find((d) => d.day === 5);
  expect(d5).toMatchObject({ n: 7, warnings: 1.1, deaths: 0.1, money: 97.1 });
  const d8 = r.perDay.find((d) => d.day === 8);
  expect(d8).toMatchObject({ n: 5, money: 86.4 });
  expect(r.perDay.map((d) => d.day)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));

  expect(r.d9.M).toEqual({ USA: 1, ORI: 1, IMPEDIMENTO: 1 });
  expect(r.d9.G).toEqual({ USA: 1 });
  expect(r.infinite).toEqual({ runs: 2, avgScore: 2000, avgCalls: 15, bestScore: 3000 });
}

// -----------------------------------------------------------------------------
// unidades
// -----------------------------------------------------------------------------
describe('métricas de calibragem (cálculo puro)', () => {
  it('calcula todas as metas do cenário sintético', () => {
    checkScenario(computeMetrics(toRecords(scenario())));
  });

  it('filtra por dificuldade (eventos órfãos e modo infinito ficam de fora)', () => {
    const r = computeMetrics(toRecords(scenario()), { difficulty: 'real' });
    expect(r.totals).toMatchObject({ campaigns: 1, firstCampaigns: 1, players: 1 });
    expect(metric(r, 'reach20')).toMatchObject({ value: 100, n: 1, status: 'bad' });
    expect(r.endings.kinds.find((k) => k.kind === 'bom')).toMatchObject({ count: 1, pct: 100 });
    expect(metric(r, 'callTime')).toMatchObject({ value: 90, n: 1 });
    expect(r.infinite.runs).toBe(0);
  });

  it('sem dados: tudo "nodata"', () => {
    const r = computeMetrics([]);
    for (const m of r.metrics) expect(m).toMatchObject({ value: null, n: 0, status: 'nodata' });
    expect(r.endings.status).toBe('nodata');
    expect(r.perDay).toEqual([]);
  });

  it('alertas: dilema fraco (< 20%) e sinais do AVC (< 40%)', () => {
    const evs: EvIn[] = [];
    for (let i = 0; i < 6; i++) {
      const sid = `sessX000${i}`;
      evs.push({ sessionId: sid, name: 'campaign_start', data: { difficulty: 'padrao' }, t: 1 });
      evs.push({ sessionId: sid, name: 'd9_choice', data: { scenario: 'M', davi: i === 0 ? 'USA' : 'USB', marcia: 'NONE' }, t: 2 });
      evs.push({ sessionId: sid, name: 'cida_d19', data: { recognized: i < 2 }, t: 3 });
    }
    const r = computeMetrics(toRecords(evs));
    expect(metric(r, 'usaDavi').value).toBe(16.7);
    expect(metric(r, 'usaDavi').notes[0]).toMatch(/dilema está fraco/);
    expect(metric(r, 'cida').value).toBe(33.3);
    expect(metric(r, 'cida').notes[0]).toMatch(/reforçar os sinais/);
    expect(metric(r, 'cida').notes).toContain('Amostra pequena (n = 6).');
  });
});

describe('utilitários', () => {
  it('saneia rótulos (controle, invisíveis, < >, espaços, NFC)', () => {
    expect(sanitizeLabel('  Dra.\u0007  Ana​ <b>\n')).toBe('Dra. Ana b');
    expect(sanitizeLabel('José')).toBe('José');
    expect(sanitizeLabel(42)).toBeNull();
  });

  it('token bucket devolve fichas com o tempo', () => {
    let now = 0;
    const rl = new RateLimiter({ api: { capacity: 2, refillPerSec: 1 } }, () => now);
    expect(rl.take('api', 'ip').ok).toBe(true);
    expect(rl.take('api', 'ip').ok).toBe(true);
    const denied = rl.take('api', 'ip');
    expect(denied).toEqual({ ok: false, retryAfter: 1 });
    expect(rl.take('api', 'outro-ip').ok).toBe(true);
    now = 1000;
    expect(rl.take('api', 'ip').ok).toBe(true);
    now = 60_000;
    rl.prune();
    expect(rl.size).toBe(0);
  });

  it('resolve as pastas do bundle e do código-fonte', () => {
    const root = join(tmpdir(), 'raiz-qap');
    const bundled = resolvePaths(pathToFileURL(join(root, 'dist', 'server', 'server.mjs')).href, {});
    expect(bundled.projectRoot).toBe(root);
    expect(bundled.clientDir.replace(/[\\/]$/, '')).toBe(join(root, 'dist', 'client'));
    expect(bundled.dataDir).toBe(join(root, 'data'));
    const source = resolvePaths(pathToFileURL(join(root, 'server', 'server.ts')).href, {});
    expect(source.clientDir).toBe(join(root, 'dist', 'client'));
    const env = resolvePaths(pathToFileURL(join(root, 'dist', 'server', 'server.mjs')).href, { DATA_DIR: 'dados', CLIENT_DIR: '/x/cliente' }, '/trabalho');
    expect(env.dataDir).toBe(join('/trabalho', 'dados'));
    expect(env.clientDir).toBe(join('/x/cliente'));
  });
});

// -----------------------------------------------------------------------------
// API por backend
// -----------------------------------------------------------------------------
for (const kind of KINDS) {
  describe.skipIf(kind === 'sqlite' && !sqliteAvailable)(`API HTTP com armazenamento ${kind}`, () => {
    let c: Ctx;
    beforeAll(async () => {
      c = await startApp(kind);
    });
    afterAll(async () => {
      await stopApp(c);
    });

    it('GET /api/health', async () => {
      const r = await req(c, 'GET', '/api/health');
      expect(r.status).toBe(200);
      expect(r.json).toMatchObject({ ok: true, storage: kind });
      expect(typeof r.json.version).toBe('string');
      expect(Number.isNaN(Date.parse(r.json.time))).toBe(false);
      expect(r.headers.get('content-type')).toMatch(/^application\/json/);
      expect(r.headers.get('cache-control')).toBe('no-store');
    });

    it('perfis: cria, busca e valida', async () => {
      const r = await req(c, 'POST', '/api/profiles', { name: '  Dra.  Ana  ' });
      expect(r.status).toBe(201);
      expect(r.json.id).toMatch(/^[A-Za-z0-9_-]{16}$/);
      expect(r.json.name).toBe('Dra. Ana');
      expect(typeof r.json.createdAt).toBe('number');
      expect((await req(c, 'GET', `/api/profiles/${r.json.id}`)).json).toEqual(r.json);

      expect((await req(c, 'POST', '/api/profiles', { name: '' })).status).toBe(400);
      expect((await req(c, 'POST', '/api/profiles', { name: 'x'.repeat(25) })).status).toBe(400);
      expect((await req(c, 'POST', '/api/profiles', { name: '<>' })).status).toBe(400);
      expect((await req(c, 'POST', '/api/profiles', { nome: 'Ana' })).status).toBe(400);
      expect((await req(c, 'POST', '/api/profiles', [1, 2])).status).toBe(400);
      expect((await req(c, 'GET', '/api/profiles/curto')).status).toBe(400);
      const missing = await req(c, 'GET', '/api/profiles/AAAAAAAAAAAAAAAA');
      expect(missing.status).toBe(404);
      expect(missing.json).toEqual({ error: 'perfil não encontrado' });
    });

    it('saves: grava, lista, lê, sobrescreve e apaga', async () => {
      const p = (await req(c, 'POST', '/api/profiles', { name: 'Saves' })).json;
      const base = `/api/saves/${p.id}`;
      expect((await req(c, 'GET', base)).json).toEqual([]);

      const put = await req(c, 'PUT', `${base}/2`, { data: gameJson(), summary: { ...summary, slot: '2', savedAt: 1 } });
      expect(put.status).toBe(200);
      expect(put.json).toMatchObject({ ok: true, slot: '2' });
      await req(c, 'PUT', `${base}/auto`, { data: gameJson({ day: 1 }), summary: { ...summary, day: 1 } });

      const list = (await req(c, 'GET', base)).json;
      expect(list.map((s: { slot: string }) => s.slot)).toEqual(['auto', '2']);
      expect(list[1]).toEqual({ slot: '2', savedAt: put.json.savedAt, summary });

      const got = await req(c, 'GET', `${base}/2`);
      expect(got.json).toEqual({ slot: '2', savedAt: put.json.savedAt, summary, data: gameJson() });

      await req(c, 'PUT', `${base}/2`, { data: gameJson({ day: 9 }), summary: { ...summary, day: 9 } });
      expect((await req(c, 'GET', `${base}/2`)).json.summary.day).toBe(9);
      expect(c.store.stats().saves).toBeGreaterThanOrEqual(2);

      expect((await req(c, 'DELETE', `${base}/2`)).json).toEqual({ ok: true, deleted: true });
      expect((await req(c, 'DELETE', `${base}/2`)).json).toEqual({ ok: true, deleted: false });
      const gone = await req(c, 'GET', `${base}/2`);
      expect(gone.status).toBe(404);
      expect(gone.json.error).toBe('save não encontrado');
    });

    it('saves: rejeita entradas inválidas', async () => {
      const p = (await req(c, 'POST', '/api/profiles', { name: 'Inválidos' })).json;
      const url = `/api/saves/${p.id}/1`;
      expect((await req(c, 'PUT', `/api/saves/${p.id}/4`, { data: gameJson(), summary })).status).toBe(400);
      expect((await req(c, 'GET', `/api/saves/${p.id}/..`)).status).toBe(404);
      expect((await req(c, 'PUT', '/api/saves/AAAAAAAAAAAAAAAA/1', { data: gameJson(), summary })).status).toBe(404);
      expect((await req(c, 'PUT', url, { data: 'não é json', summary })).status).toBe(400);
      expect((await req(c, 'PUT', url, { data: '[1,2]', summary })).status).toBe(400);
      expect((await req(c, 'PUT', url, { data: { v: 1 }, summary })).status).toBe(400);
      expect((await req(c, 'PUT', url, { data: gameJson(), summary: { ...summary, day: 'três' } })).status).toBe(400);
      expect((await req(c, 'PUT', url, { data: gameJson(), summary: { ...summary, phase: 'a b' } })).status).toBe(400);
      expect((await req(c, 'PUT', url, { data: gameJson() })).status).toBe(400);
      const big = await req(c, 'PUT', url, { data: JSON.stringify({ blob: 'x'.repeat(2 * 1024 * 1024) }), summary });
      expect(big.status).toBe(413);
      expect(big.json.error).toMatch(/save grande demais/);
      const huge = await req(c, 'PUT', url, `{"data":"${'y'.repeat(3 * 1024 * 1024 + 10)}"}`);
      expect(huge.status).toBe(413);
      expect((await req(c, 'GET', url)).status).toBe(404);
    });

    it('ranking: valida, guarda o melhor por (nome, semente) e ordena', async () => {
      const post = (b: Record<string, unknown>) =>
        req(c, 'POST', '/api/ranking', { mode: 'infinito', version: '1.0.0', seed: '2026-10-15', ...b });
      const a1 = await post({ name: 'Ana', score: 1000, calls: 10, correct: 8 });
      expect(a1.status).toBe(200);
      expect(a1.json).toMatchObject({ ok: true, improved: true, rank: 1, best: { name: 'Ana', score: 1000 } });
      const a2 = await post({ name: 'ANA', score: 900, calls: 10, correct: 7 });
      expect(a2.json).toMatchObject({ improved: false, rank: 1, best: { name: 'Ana', score: 1000 } });
      const b1 = await post({ name: 'Bia', score: 1500, calls: 10, correct: 9 });
      expect(b1.json).toMatchObject({ improved: true, rank: 1 });
      const a3 = await post({ name: 'ana', score: 2000, calls: 12, correct: 12 });
      expect(a3.json).toMatchObject({ improved: true, rank: 1, best: { name: 'ana', score: 2000 } });
      await post({ name: 'Caio', score: 500, calls: 5, correct: 5, seed: 'outra' });
      await post({ name: 'Ana', score: 300, calls: 5, correct: 1, seed: 'outra' });
      await post({ name: 'Dani <script>', score: 100, calls: 5, correct: 1, seed: 'outra', mode: 'campanha' });

      const seed = await req(c, 'GET', '/api/ranking?mode=infinito&seed=2026-10-15&limit=20');
      expect(seed.json.map((r: { name: string; score: number }) => [r.name, r.score])).toEqual([
        ['ana', 2000],
        ['Bia', 1500],
      ]);
      expect(Object.keys(seed.json[0]).sort()).toEqual(['calls', 'correct', 'createdAt', 'name', 'score', 'seed']);
      const all = await req(c, 'GET', '/api/ranking?mode=infinito');
      expect(all.json.map((r: { score: number }) => r.score)).toEqual([2000, 1500, 500, 300]);
      expect((await req(c, 'GET', '/api/ranking?limit=2')).json).toHaveLength(2);
      expect((await req(c, 'GET', '/api/ranking?limit=9999')).json).toHaveLength(4);
      const camp = await req(c, 'GET', '/api/ranking?mode=campanha');
      expect(camp.json).toEqual([expect.objectContaining({ name: 'Dani script', score: 100 })]);

      expect((await post({ name: 'Eva', score: 3601, calls: 10, correct: 5 })).status).toBe(400);
      expect((await post({ name: 'Eva', score: 10, calls: 3, correct: 4 })).status).toBe(400);
      expect((await post({ name: 'Eva', score: 1.5, calls: 3, correct: 1 })).status).toBe(400);
      expect((await post({ name: 'Eva', score: -1, calls: 3, correct: 1 })).status).toBe(400);
      expect((await post({ name: 'Eva', score: 1_000_001, calls: 99_999, correct: 1 })).status).toBe(400);
      expect((await post({ name: '', score: 10, calls: 3, correct: 1 })).status).toBe(400);
      expect((await post({ name: 'x'.repeat(25), score: 10, calls: 3, correct: 1 })).status).toBe(400);
      expect((await post({ name: 'Eva', score: 10, calls: 3, correct: 1, seed: '' })).status).toBe(400);
      expect((await post({ name: 'Eva', score: 10, calls: 3, correct: 1, mode: 'xadrez' })).status).toBe(400);
      expect((await post({ name: 'Eva', score: 10, calls: 3, correct: 1, profileId: 'curto' })).status).toBe(400);
      expect((await req(c, 'GET', '/api/ranking?mode=xadrez')).status).toBe(400);
      expect((await req(c, 'GET', '/api/ranking?limit=abc')).status).toBe(400);
    });

    it('telemetria → métricas', async () => {
      const evs = scenario();
      const bySession = new Map<string, EvIn[]>();
      for (const e of evs) {
        const k = `${e.sessionId}|${e.profileId ?? ''}`;
        bySession.set(k, [...(bySession.get(k) ?? []), e]);
      }
      for (const list of bySession.values()) {
        const r = await req(c, 'POST', '/api/telemetry', {
          sessionId: list[0].sessionId,
          ...(list[0].profileId ? { profileId: list[0].profileId } : {}),
          events: list.map((e) => ({ name: e.name, data: e.data, t: e.t })),
        });
        expect(r.status).toBe(200);
        expect(r.json).toEqual({ ok: true, accepted: list.length, rejected: 0 });
      }
      const m = await req(c, 'GET', '/api/metrics');
      expect(m.status).toBe(200);
      expect(m.json.storage).toBe(kind);
      expect(m.json.totals.stored).toBe(evs.length);
      checkScenario(m.json as MetricsReport);

      const real = await req(c, 'GET', '/api/metrics?difficulty=real');
      expect(real.json.totals.campaigns).toBe(1);
      const since = await req(c, 'GET', `/api/metrics?since=${evs[evs.length - 1].t}`);
      expect(since.json.totals.events).toBe(1);
      expect((await req(c, 'GET', '/api/metrics?since=2026-01-01')).status).toBe(200);
      expect((await req(c, 'GET', '/api/metrics?since=ontem')).status).toBe(400);
      expect((await req(c, 'GET', '/api/metrics?difficulty=a%20b')).status).toBe(400);
    });

    it('telemetria: valida lote e eventos', async () => {
      const post = (b: unknown) => req(c, 'POST', '/api/telemetry', b);
      expect((await post({ events: [] })).status).toBe(400);
      expect((await post({ sessionId: 'curto', events: [] })).status).toBe(400);
      expect((await post({ sessionId: 'sessao-valida', events: 'x' })).status).toBe(400);
      expect((await post({ sessionId: 'sessao-valida', profileId: '!', events: [] })).status).toBe(400);
      const tooMany = Array.from({ length: 201 }, () => ({ name: 'x', data: {}, t: 1 }));
      expect((await post({ sessionId: 'sessao-valida', events: tooMany })).status).toBe(400);
      const before = c.store.stats().telemetry;
      const mixed = await post({
        sessionId: 'sessao-valida',
        events: [
          { name: 'ok_evento', data: { a: 1 }, t: 123 },
          { name: 'sem_t', data: {} },
          { name: 'Maiúsculo', data: {} },
          { name: 'dados_lista', data: [1, 2] },
          { name: 'grande', data: { s: 'z'.repeat(4100) } },
          'texto',
        ],
      });
      expect(mixed.json).toEqual({ ok: true, accepted: 2, rejected: 4 });
      expect(c.store.stats().telemetry).toBe(before + 2);
      const stored = c.store.readTelemetry({ names: ['ok_evento', 'sem_t'] });
      expect(stored.find((e) => e.name === 'ok_evento')).toMatchObject({ sessionId: 'sessao-valida', t: 123, data: { a: 1 } });
      expect(stored.find((e) => e.name === 'sem_t')!.t).toBeGreaterThan(1_600_000_000_000);
      // sendBeacon manda text/plain
      const beacon = await req(c, 'POST', '/api/telemetry', JSON.stringify({ sessionId: 'sessao-beacon', events: [{ name: 'b', data: {}, t: 1 }] }), {
        'content-type': 'text/plain;charset=UTF-8',
      });
      expect(beacon.json).toMatchObject({ accepted: 1 });
    });

    it('erros: JSON inválido, UTF-8 inválido, corpo grande, rota e método', async () => {
      const bad = await req(c, 'POST', '/api/profiles', '{"name": ');
      expect(bad.status).toBe(400);
      expect(bad.json).toEqual({ error: 'JSON inválido' });
      expect((await req(c, 'POST', '/api/profiles', '')).status).toBe(400);
      const latin1 = await raw(c, '/api/profiles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: Buffer.from([0x7b, 0x22, 0x6e, 0x22, 0x3a, 0x22, 0xe9, 0x22, 0x7d]),
      });
      expect(latin1.status).toBe(400);
      const big = await req(c, 'POST', '/api/profiles', JSON.stringify({ name: 'a', pad: 'x'.repeat(70 * 1024) }));
      expect(big.status).toBe(413);
      expect(big.json.error).toMatch(/grande demais/);
      const nf = await req(c, 'GET', '/api/nada');
      expect(nf.status).toBe(404);
      expect(nf.json).toEqual({ error: 'rota não encontrada' });
      const wrong = await req(c, 'DELETE', '/api/health');
      expect(wrong.status).toBe(405);
      expect(wrong.headers.get('allow')).toBe('GET');
      expect((await req(c, 'GET', '/api/health/')).status).toBe(200);
      expect((await raw(c, '/api/profiles/%E0%A4%A', {})).status).toBe(400);
    });

    it('CORS só para o Vite e bloqueio de escrita de outras origens', async () => {
      const pre = await raw(c, '/api/profiles', {
        method: 'OPTIONS',
        headers: { origin: 'http://localhost:5173', 'access-control-request-method': 'POST' },
      });
      expect(pre.status).toBe(204);
      expect(pre.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(pre.headers['access-control-allow-methods']).toMatch(/PUT/);
      const ok = await req(c, 'GET', '/api/health', undefined, { origin: 'http://127.0.0.1:5173' });
      expect(ok.headers.get('access-control-allow-origin')).toBe('http://127.0.0.1:5173');
      const evil = await req(c, 'GET', '/api/health', undefined, { origin: 'http://malicioso.example' });
      expect(evil.status).toBe(200);
      expect(evil.headers.get('access-control-allow-origin')).toBeNull();
      const evilPre = await raw(c, '/api/profiles', { method: 'OPTIONS', headers: { origin: 'http://malicioso.example' } });
      expect(evilPre.headers['access-control-allow-origin']).toBeUndefined();
      const csrf = await req(c, 'POST', '/api/profiles', { name: 'CSRF' }, { origin: 'http://malicioso.example' });
      expect(csrf.status).toBe(403);
      const same = await req(c, 'POST', '/api/profiles', { name: 'Mesma origem' }, { origin: `http://127.0.0.1:${c.port}` });
      expect(same.status).toBe(201);
      const vite = await req(c, 'POST', '/api/profiles', { name: 'Via Vite' }, { origin: 'http://localhost:5173' });
      expect(vite.status).toBe(201);
    });

    it('persiste ao fechar e reabrir o armazenamento', async () => {
      const dataDir = join(tempDir(), 'dados');
      let store = await openStore({ dataDir, prefer: kind, log: () => {} });
      expect(store.kind).toBe(kind);
      store.createProfile({ id: 'Persist0000000001', name: 'Ana', createdAt: 1 });
      store.putSave('Persist0000000001', { slot: 'auto', savedAt: 2, summary, data: gameJson() });
      store.putSave('Persist0000000001', { slot: '3', savedAt: 3, summary, data: gameJson({ x: 'é' }) });
      store.deleteSave('Persist0000000001', '3');
      store.submitScore({ mode: 'infinito', seed: 's', name: 'Ana', score: 10, calls: 1, correct: 1, version: '', profileId: null, createdAt: 4 });
      store.addTelemetry(
        toRecords(scenario())
          .slice(0, 30)
          .map(({ seq: _seq, ...e }) => e),
      );
      await store.close();
      if (kind === 'json') {
        const files = readdirSync(dataDir).sort();
        expect(files).toEqual(['profiles.json', 'ranking.json', 'saves.json', 'telemetry.json']);
      } else {
        expect(existsSync(join(dataDir, 'qap.sqlite'))).toBe(true);
      }
      store = await openStore({ dataDir, prefer: kind, log: () => {} });
      expect(store.getProfile('Persist0000000001')).toEqual({ id: 'Persist0000000001', name: 'Ana', createdAt: 1 });
      expect(store.getSave('Persist0000000001', 'auto')).toEqual({ slot: 'auto', savedAt: 2, summary, data: gameJson() });
      expect(store.getSave('Persist0000000001', '3')).toBeNull();
      expect(store.topScores({ mode: 'infinito', seed: null, limit: 10 })).toHaveLength(1);
      const tel = store.readTelemetry();
      expect(tel).toHaveLength(30);
      expect(tel[0]).toMatchObject({ sessionId: 'sessA0001', name: 'campaign_start', data: { difficulty: 'padrao' } });
      expect(store.stats()).toMatchObject({ profiles: 1, saves: 1, ranking: 1, telemetry: 30 });
      expect(store.stats().saveBytes).toBe(Buffer.byteLength(gameJson()));
      await store.close();
      expect(() => store.createProfile({ id: 'X000000000000000', name: 'x', createdAt: 1 })).toThrow(/fechado/);
    });
  });
}

// -----------------------------------------------------------------------------
// específicos de cada backend
// -----------------------------------------------------------------------------
describe('JsonStore', () => {
  it('grava sozinho depois do debounce, de forma atômica', async () => {
    const dataDir = join(tempDir(), 'dados');
    const store = await openStore({ dataDir, prefer: 'json', log: () => {}, json: { flushDelayMs: 20, maxWaitMs: 100 } });
    store.createProfile({ id: 'Debounce00000001', name: 'Bia', createdAt: 1 });
    expect(existsSync(join(dataDir, 'profiles.json'))).toBe(false);
    await new Promise((r) => setTimeout(r, 200));
    await store.flush();
    const file = JSON.parse(readFileSync(join(dataDir, 'profiles.json'), 'utf8'));
    expect(file).toMatchObject({ format: 'qap', collection: 'profiles', version: 1 });
    expect(file.items).toEqual([{ id: 'Debounce00000001', name: 'Bia', createdAt: 1 }]);
    expect(readdirSync(dataDir).filter((f) => f.endsWith('.tmp'))).toEqual([]);
    await store.close();
  });

  it('arquivo corrompido vira backup e a coleção recomeça vazia', async () => {
    const dataDir = join(tempDir(), 'dados');
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(join(dataDir, 'profiles.json'), '{ isto não é json');
    writeFileSync(join(dataDir, 'ranking.json'), JSON.stringify({ items: [{ mode: 'infinito', seed: 's', name: 'Ok', score: 5, calls: 1, correct: 1, createdAt: 1 }, { lixo: true }] }));
    const logs: string[] = [];
    const store = await openStore({ dataDir, prefer: 'json', log: (m) => logs.push(m) });
    expect(store.stats().profiles).toBe(0);
    expect(store.stats().ranking).toBe(1);
    expect(logs.join('\n')).toMatch(/profiles\.json estava ilegível/);
    expect(readdirSync(dataDir).some((f) => f.startsWith('profiles.json.corrompido-'))).toBe(true);
    await store.close();
  });

  it('limita a telemetria guardada (descarta as mais antigas)', async () => {
    const store = await openStore({ dataDir: join(tempDir(), 'dados'), prefer: 'json', log: () => {}, json: { maxTelemetry: 5 } });
    store.addTelemetry(Array.from({ length: 8 }, (_, i) => ({ sessionId: 'sessao-cap', profileId: null, name: 'e', data: { i }, t: i + 1, receivedAt: 0 })));
    const left = store.readTelemetry();
    expect(left.map((e) => (e.data as { i: number }).i)).toEqual([3, 4, 5, 6, 7]);
    expect(store.stats()).toMatchObject({ telemetry: 5, telemetrySeq: 8 });
    await store.close();
  });
});

describe.skipIf(!sqliteAvailable)('SqliteStore', () => {
  it('importa os dados JSON antigos na primeira execução', async () => {
    const dataDir = join(tempDir(), 'dados');
    const json = await openStore({ dataDir, prefer: 'json', log: () => {} });
    json.createProfile({ id: 'Legacy0000000001', name: 'Antiga', createdAt: 1 });
    json.putSave('Legacy0000000001', { slot: '1', savedAt: 2, summary, data: gameJson() });
    json.submitScore({ mode: 'infinito', seed: 's', name: 'Antiga', score: 99, calls: 1, correct: 1, version: '', profileId: null, createdAt: 3 });
    json.addTelemetry([{ sessionId: 'sessao-legado', profileId: null, name: 'bico', data: { day: 2 }, t: 5, receivedAt: 5 }]);
    await json.close();
    const logs: string[] = [];
    const sqlite = await openStore({ dataDir, prefer: 'sqlite', log: (m) => logs.push(m) });
    expect(sqlite.kind).toBe('sqlite');
    expect(logs.join('\n')).toMatch(/Importei para o SQLite/);
    expect(sqlite.getProfile('Legacy0000000001')?.name).toBe('Antiga');
    expect(sqlite.getSave('Legacy0000000001', '1')?.data).toBe(gameJson());
    expect(sqlite.topScores({ mode: 'infinito', limit: 5 })[0]).toMatchObject({ name: 'Antiga', score: 99 });
    expect(sqlite.readTelemetry()).toEqual([expect.objectContaining({ name: 'bico', data: { day: 2 } })]);
    await sqlite.close();
    // segunda abertura não importa de novo
    const again = await openStore({ dataDir, prefer: 'sqlite', log: () => {} });
    expect(again.stats()).toMatchObject({ profiles: 1, saves: 1, ranking: 1, telemetry: 1 });
    await again.close();
  });

  it('STORE desconhecido cai na escolha automática (sqlite)', async () => {
    const logs: string[] = [];
    const store = await openStore({ dataDir: join(tempDir(), 'dados'), prefer: 'mongo', log: (m) => logs.push(m) });
    expect(store.kind).toBe('sqlite');
    expect(logs[0]).toMatch(/STORE=mongo não existe/);
    await store.close();
  });
});

// -----------------------------------------------------------------------------
// arquivos estáticos e /admin
// -----------------------------------------------------------------------------
describe('arquivos estáticos e painel', () => {
  let c: Ctx;
  beforeAll(async () => {
    c = await startApp('json');
  });
  afterAll(async () => {
    await stopApp(c);
  });

  it('serve index.html sem cache e assets com hash como imutáveis', async () => {
    const root = await raw(c, '/');
    expect(root.status).toBe(200);
    expect(root.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(root.headers['cache-control']).toBe('no-cache');
    expect(root.body.toString()).toContain('JOGO-INDEX');
    expect((await raw(c, '/index.html')).status).toBe(200);

    const js = await raw(c, '/assets/index-AbCd1234.js');
    expect(js.status).toBe(200);
    expect(js.headers['content-type']).toBe('text/javascript; charset=utf-8');
    expect(js.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(js.body.toString()).toBe(BIG_JS);
    const css = await raw(c, '/assets/index-Zz9_8-7y.css');
    expect(css.headers['content-type']).toBe('text/css; charset=utf-8');
    expect((await raw(c, '/favicon.ico')).headers['content-type']).toBe('image/x-icon');
    expect((await raw(c, '/favicon.ico')).headers['cache-control']).toBe('no-cache');
  });

  it('gzip, ETag/304 e Range', async () => {
    const gz = await raw(c, '/assets/index-AbCd1234.js', { headers: { 'accept-encoding': 'gzip, br' } });
    expect(gz.headers['content-encoding']).toBe('gzip');
    expect(gz.headers.vary).toBe('Accept-Encoding');
    expect(gunzipSync(gz.body).toString()).toBe(BIG_JS);
    expect(gz.body.length).toBeLessThan(Buffer.byteLength(BIG_JS));
    const again = await raw(c, '/assets/index-AbCd1234.js', { headers: { 'accept-encoding': 'gzip', 'if-none-match': String(gz.headers.etag) } });
    expect(again.status).toBe(304);
    expect(again.body.length).toBe(0);

    const part = await raw(c, '/sons/bip.mp3', { headers: { range: 'bytes=10-19' } });
    expect(part.status).toBe(206);
    expect(part.headers['content-type']).toBe('audio/mpeg');
    expect(part.headers['content-range']).toBe(`bytes 10-19/${MP3.length}`);
    expect(part.body.equals(MP3.subarray(10, 20))).toBe(true);
    const tail = await raw(c, '/sons/bip.mp3', { headers: { range: 'bytes=-5' } });
    expect(tail.body.equals(MP3.subarray(MP3.length - 5))).toBe(true);
    expect((await raw(c, '/sons/bip.mp3', { headers: { range: 'bytes=99999-' } })).status).toBe(416);
    const head = await raw(c, '/sons/bip.mp3', { method: 'HEAD' });
    expect(head.status).toBe(200);
    expect(head.headers['content-length']).toBe(String(MP3.length));
    expect(head.body.length).toBe(0);
  });

  it('fallback para index.html em rotas do app; 404 para arquivos inexistentes', async () => {
    const route = await raw(c, '/jogar');
    expect(route.status).toBe(200);
    expect(route.body.toString()).toContain('JOGO-INDEX');
    const nested = await raw(c, '/jogo/campanha?dia=3');
    expect(nested.status).toBe(200);
    expect(nested.body.toString()).toContain('<head><base href="/">');
    expect((await raw(c, '/assets/nao-existe-12345678.js')).status).toBe(404);
    expect((await raw(c, '/.segredo')).status).toBe(404);
    expect((await raw(c, '/', { method: 'POST' })).status).toBe(405);
  });

  it('bloqueia directory traversal', async () => {
    const attempts = [
      '/../secret.txt',
      '/../../secret.txt',
      '/%2e%2e/secret.txt',
      '/%2E%2E/%2E%2E/secret.txt',
      '/..%2fsecret.txt',
      '/assets/..%2f..%2fsecret.txt',
      '/assets/%2e%2e%2f%2e%2e%2fsecret.txt',
      '/%5c..%5csecret.txt',
      '/..%5c..%5csecret.txt',
      '/assets/%00.js',
      '/%c0%ae%c0%ae/secret.txt',
      '//secret.txt',
    ];
    for (const path of attempts) {
      const r = await raw(c, path);
      expect(r.body.toString(), path).not.toContain('TOP-SECRET');
      if (r.status === 200) expect(r.body.toString(), path).toContain('JOGO-INDEX');
      else expect([400, 403, 404], path).toContain(r.status);
    }
  });

  it('GET /admin entrega o painel com CSP e nonce', async () => {
    const r = await raw(c, '/admin');
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toBe('text/html; charset=utf-8');
    const csp = String(r.headers['content-security-policy']);
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce).toBeTruthy();
    const html = r.body.toString();
    expect(html).toContain(`<script nonce="${nonce}">`);
    expect(html).toContain('/api/metrics');
    expect(html).toContain('<title>Central de Calibragem</title>');
    expect((await raw(c, '/admin/')).status).toBe(200);
    expect((await raw(c, '/admin', { method: 'POST' })).status).toBe(405);
  });

  it('o script do painel é JavaScript válido', async () => {
    const html = (await raw(c, '/admin')).body.toString();
    const script = /<script nonce="[^"]+">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';
    expect(script.length).toBeGreaterThan(1000);
    expect(() => new Function(script)).not.toThrow();
  });
});

describe('cliente não compilado', () => {
  let c: Ctx;
  beforeAll(async () => {
    c = await startApp('json', {}, { client: false });
  });
  afterAll(async () => {
    await stopApp(c);
  });

  it('responde 503 com página amigável', async () => {
    const r = await raw(c, '/');
    expect(r.status).toBe(503);
    expect(r.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(r.body.toString()).toMatch(/ainda não foi compilado/);
    expect(r.body.toString()).toMatch(/npm run build/);
    expect((await raw(c, '/qualquer/rota')).status).toBe(503);
    expect((await raw(c, '/assets/app-12345678.js')).status).toBe(404);
    expect((await raw(c, '/api/health')).status).toBe(200);
    expect((await raw(c, '/admin')).status).toBe(200);
  });
});

describe('rate limit', () => {
  let c: Ctx;
  beforeAll(async () => {
    c = await startApp('json', {
      rateLimits: { api: { capacity: 8, refillPerSec: 0.001 }, telemetry: { capacity: 2, refillPerSec: 0.001 } },
    });
  });
  afterAll(async () => {
    await stopApp(c);
  });

  it('devolve 429 com Retry-After quando o balde esvazia', async () => {
    const tel = { sessionId: 'sessao-rl', events: [{ name: 'x', data: {}, t: 1 }] };
    expect((await req(c, 'POST', '/api/telemetry', tel)).status).toBe(200);
    expect((await req(c, 'POST', '/api/telemetry', tel)).status).toBe(200);
    const limitedTel = await req(c, 'POST', '/api/telemetry', tel);
    expect(limitedTel.status).toBe(429);
    expect(Number(limitedTel.headers.get('retry-after'))).toBeGreaterThan(0);
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await req(c, 'GET', '/api/health')).status);
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses[5]).toBe(429);
    const last = await req(c, 'GET', '/api/health');
    expect(last.json.error).toMatch(/muitas requisições/);
    // arquivos estáticos não entram no limite
    expect((await raw(c, '/')).status).toBe(200);
  });
});

describe('encerramento', () => {
  it('close() derruba na hora conexões sem requisição e espera as que estão em andamento', async () => {
    const c = await startApp('json');
    const idle = net.connect(c.port, '127.0.0.1'); // como a pré-conexão de um navegador
    await once(idle, 'connect');
    const idleClosed = once(idle, 'close');
    const slow = new Promise<number>((resolve, reject) => {
      const r = http.request(
        { host: '127.0.0.1', port: c.port, path: '/api/profiles', method: 'POST', headers: { 'content-type': 'application/json' } },
        (res) => {
          res.resume();
          res.on('end', () => resolve(res.statusCode ?? 0));
        },
      );
      r.on('error', reject);
      r.write('{"name":');
      setTimeout(() => r.end('"Lenta"}'), 300);
    });
    await new Promise((r) => setTimeout(r, 100));
    const t0 = Date.now();
    const closing = c.app.close();
    await idleClosed;
    expect(Date.now() - t0).toBeLessThan(200);
    expect(await slow).toBe(201);
    await closing;
    expect(Date.now() - t0).toBeLessThan(1500);
    await c.store.close();
  });
});

// -----------------------------------------------------------------------------
// bundle (esbuild) rodando com node puro
// -----------------------------------------------------------------------------
describe('bundle dist/server/server.mjs', () => {
  it('compila, sobe com node, responde e grava os dados ao receber SIGTERM', async () => {
    const root = tempDir();
    const outfile = join(root, 'dist', 'server', 'server.mjs');
    await esbuild.build({
      entryPoints: [join(__dirname, '..', 'server', 'server.ts')],
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node18',
      outfile,
      banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
      logLevel: 'silent',
    });
    const child = spawn(process.execPath, [outfile], {
      env: { ...process.env, PORT: '0', HOST: '127.0.0.1', STORE: 'json', DATA_DIR: '', CLIENT_DIR: '' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', (d: Buffer) => (out += d.toString()));
    child.stderr.on('data', (d: Buffer) => (out += d.toString()));
    const exited = new Promise<number | null>((resolve) => child.on('exit', (code) => resolve(code)));
    try {
      const port = await new Promise<number>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`servidor não subiu:\n${out}`)), 10_000);
        child.stdout.on('data', () => {
          const m = /http:\/\/localhost:(\d+)\//.exec(out);
          if (m) {
            clearTimeout(timer);
            resolve(Number(m[1]));
          }
        });
        child.on('exit', () => reject(new Error(`servidor saiu cedo:\n${out}`)));
      });
      expect(out).toMatch(/QAP/);
      expect(out).toMatch(/ainda não foi compilado/);
      const base = `http://127.0.0.1:${port}`;
      const health = await (await fetch(`${base}/api/health`)).json();
      expect(health).toMatchObject({ ok: true, storage: 'json' });
      expect((await fetch(`${base}/`)).status).toBe(503);
      const p = await (
        await fetch(`${base}/api/profiles`, { method: 'POST', body: JSON.stringify({ name: 'Bundle' }), headers: { 'content-type': 'application/json' } })
      ).json();
      expect(p.name).toBe('Bundle');
      child.kill('SIGTERM');
      expect(await exited).toBe(0);
      expect(out).toMatch(/Encerrando o plantão/);
      const saved = JSON.parse(readFileSync(join(root, 'data', 'profiles.json'), 'utf8'));
      expect(saved.items).toEqual([p]);
    } finally {
      if (child.exitCode === null) child.kill('SIGKILL');
    }
  });
});

// -----------------------------------------------------------------------------
// cliente src/client/api.ts
// -----------------------------------------------------------------------------
describe('cliente src/client/api.ts', () => {
  const realFetch = globalThis.fetch;
  let c: Ctx;
  beforeAll(async () => {
    c = await startApp(sqliteAvailable ? 'sqlite' : 'json');
  });
  afterAll(async () => {
    await stopApp(c);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function freshApi() {
    vi.resetModules();
    return (await import('../src/client/api')).api;
  }

  it('fala com o servidor: perfil, saves, ranking e telemetria', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${input}`);
      return realFetch(new URL(String(input), c.base), init);
    });
    const api = await freshApi();
    expect(api.enabled).toBe(true);
    expect(await api.available()).toBe(true);
    expect(await api.available()).toBe(true);
    expect(calls.filter((x) => x.endsWith('/api/health'))).toHaveLength(1);

    const p = await api.createProfile('  Doutora com um nome comprido demais  ');
    expect(p?.name).toBe('Doutora com um nome comp');
    expect(api.profileId).toBe(p!.id);
    expect((await api.getProfile(p!.id))?.id).toBe(p!.id);
    expect((await api.ensureProfile('Outra'))?.id).toBe(p!.id);

    const localSummary = { slot: 'auto', savedAt: 1, ...summary }; // formato do settings.ts do cliente
    expect(await api.putSave(p!.id, 'auto', gameJson(), localSummary)).toBe(true);
    expect(await api.putSave(p!.id, '1', { v: 3, objeto: true }, summary)).toBe(true);
    expect((await api.listSaves(p!.id)).map((s) => s.slot)).toEqual(['auto', '1']);
    expect((await api.getSave(p!.id, 'auto'))?.data).toBe(gameJson());
    expect(await api.deleteSave(p!.id, '1')).toBe(true);
    expect(await api.getSave(p!.id, '1')).toBeNull();
    expect(await api.putSave(p!.id, 'slot-ruim', gameJson(), summary)).toBe(false);
    expect(await api.getSave('id-invalido', 'auto')).toBeNull();

    const sub = await api.submitScore({ name: 'Cliente', score: 600, calls: 3, correct: 3, seed: 'semente-cliente', mode: 'infinito', version: '1.0.0', profileId: undefined });
    expect(sub).toMatchObject({ improved: true, rank: 1, best: { name: 'Cliente', score: 600 } });
    expect(await api.submitScore({ name: 'Cliente', score: 9999, calls: 3, correct: 3, seed: 'semente-cliente' })).toBeNull();
    const rows = await api.ranking('infinito', 'semente-cliente', 20);
    expect(rows).toEqual([expect.objectContaining({ name: 'Cliente', score: 600, seed: 'semente-cliente' })]);
    expect((await api.ranking('infinito', undefined, 5)).length).toBeGreaterThan(0);

    const before = c.store.stats().telemetry;
    api.track('campaign_start', { difficulty: 'padrao', gender: 'F', variable: false, first: true });
    api.track('day_end', { day: 1, warnings: 0 });
    api.track('NomeInvalido', {});
    api.track('grande', { s: 'x'.repeat(5000) });
    await api.flush();
    expect(c.store.stats().telemetry).toBe(before + 3);
    const sent = c.store.readTelemetry({ names: ['campaign_start', 'grande'] }).filter((e) => e.sessionId === api.sessionId);
    expect(sent).toHaveLength(2);
    expect(sent[0]).toMatchObject({ profileId: p!.id, data: { difficulty: 'padrao', first: true } });
    expect(sent[1].data).toEqual({ _truncado: true });
    expect(api.sessionId).toMatch(/^[A-Za-z0-9_-]{16}$/);

    // 50 eventos disparam o envio sozinhos
    for (let i = 0; i < 50; i++) api.track('call_time', { seconds: 80 + i, day: 2 });
    await vi.waitFor(() => expect(c.store.stats().telemetry).toBe(before + 53));
  });

  it('sem servidor: nada lança, tudo volta vazio', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
    const api = await freshApi();
    expect(await api.available()).toBe(false);
    expect(await api.createProfile('Ana')).toBeNull();
    expect(await api.ensureProfile('Ana')).toBeNull();
    expect(await api.getProfile('AAAAAAAAAAAAAAAA')).toBeNull();
    expect(await api.listSaves('AAAAAAAAAAAAAAAA')).toEqual([]);
    expect(await api.getSave('AAAAAAAAAAAAAAAA', 'auto')).toBeNull();
    expect(await api.putSave('AAAAAAAAAAAAAAAA', 'auto', '{}', summary)).toBe(false);
    expect(await api.deleteSave('AAAAAAAAAAAAAAAA', 'auto')).toBe(false);
    expect(await api.ranking('infinito')).toEqual([]);
    expect(await api.submitScore({ name: 'Ana', score: 1, calls: 1, correct: 1, seed: 's' })).toBeNull();
    expect(() => api.track('bico', { day: 1 })).not.toThrow();
    await expect(api.flush()).resolves.toBeUndefined();
  });

  it('servidor estático sem API (404 em HTML) conta como indisponível', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('<!doctype html><p>404</p>', { status: 404, headers: { 'content-type': 'text/html' } })));
    const api = await freshApi();
    expect(await api.available()).toBe(false);
    expect(await api.ranking()).toEqual([]);
  });

  it('build standalone (__STANDALONE__): a API fica desligada e não toca a rede', async () => {
    const fetchSpy = vi.fn(() => Promise.reject(new Error('não deveria chamar')));
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('__STANDALONE__', true);
    const api = await freshApi();
    expect(api.enabled).toBe(false);
    expect(await api.available()).toBe(false);
    expect(await api.createProfile('Ana')).toBeNull();
    expect(await api.listSaves('AAAAAAAAAAAAAAAA')).toEqual([]);
    api.track('bico', { day: 1 });
    await api.flush();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
