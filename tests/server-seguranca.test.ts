// Segurança do servidor local (docs/SEGURANCA.md; checklist, seções 7, 9, 11, 12, 13 e 15):
// Host contra DNS rebinding, painel só neste computador ou com ADMIN_TOKEN, cabeçalhos e CSP,
// nomes com Unicode malicioso, registro sem o id de perfil, exclusão de dados (LGPD), remoção
// de fraude no ranking e "kill switches".
import { describe, it, expect, afterAll } from 'vitest';
import http from 'node:http';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type App, type AppOptions } from '../server/app';
import { openStore, loadSqliteModule, type Store } from '../server/store';
import { sanitizeLabel } from '../server/validate';
import { hostName, isLoopbackAddress, makeHostCheck, redactUrl } from '../server/security';

const sqliteAvailable = !!(await loadSqliteModule());
const dirs: string[] = [];
afterAll(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

interface Ctx {
  app: App;
  store: Store;
  port: number;
  logs: string[];
}

async function start(kind: 'json' | 'sqlite', extra: Partial<AppOptions> = {}): Promise<Ctx> {
  const dir = mkdtempSync(join(tmpdir(), 'qap-seg-'));
  dirs.push(dir);
  const clientDir = join(dir, 'client');
  mkdirSync(join(clientDir, 'assets'), { recursive: true });
  writeFileSync(join(clientDir, 'index.html'), '<!doctype html><html><head><meta charset="utf-8"></head><body>JOGO</body></html>');
  const store = await openStore({ dataDir: join(dir, 'data'), prefer: kind, log: () => {} });
  const logs: string[] = [];
  const app = createServer({ store, clientDir, rateLimits: false, log: (m) => logs.push(m), ...extra });
  const info = await app.listen(0, '127.0.0.1');
  return { app, store, port: info.port, logs };
}

interface Res {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}
function call(c: Ctx, path: string, o: { method?: string; host?: string; headers?: Record<string, string>; body?: unknown } = {}): Promise<Res> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = { ...(o.headers ?? {}) };
    const payload = o.body === undefined ? undefined : JSON.stringify(o.body);
    if (payload !== undefined) {
      headers['Content-Type'] = 'application/json';
      // DELETE com corpo: sem Content-Length o cliente do Node não manda o corpo direito
      headers['Content-Length'] = String(Buffer.byteLength(payload));
    }
    const r = http.request(
      { host: '127.0.0.1', port: c.port, path, method: o.method ?? 'GET', headers: { Host: o.host ?? `127.0.0.1:${c.port}`, ...headers }, setHost: false },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
      },
    );
    r.on('error', reject);
    if (payload !== undefined) r.write(payload);
    r.end();
  });
}
const json = (r: Res) => JSON.parse(r.body);

describe('Host (DNS rebinding)', () => {
  it('lê o nome do Host sem a porta e recusa formatos inválidos', () => {
    expect(hostName('Localhost:7270')).toBe('localhost');
    expect(hostName('[::1]:7270')).toBe('::1');
    expect(hostName('192.168.0.5')).toBe('192.168.0.5');
    expect(hostName('a:b:c')).toBe('');
    expect(hostName('evil.com:abc')).toBe('');
    expect(hostName('localhost:99999')).toBe('');
    expect(hostName('ev il.com')).toBe('');
    expect(hostName(undefined)).toBe('');
  });

  it('aceita IPs, localhost e o nome desta máquina; nomes de fora só com ALLOWED_HOSTS', () => {
    const ok = makeHostCheck(['jogo.exemplo.com.br']);
    for (const h of ['127.0.0.1:7270', 'localhost:7270', '[::1]:7270', '192.168.1.20:7270', 'app.localhost', 'jogo.exemplo.com.br']) expect(ok(h), h).toBe(true);
    for (const h of ['atacante.example:7270', 'localhost.atacante.example', '127.0.0.1.nip.io', '', undefined]) expect(ok(h), String(h)).toBe(false);
  });

  it('o servidor recusa outro domínio em toda rota (API, painel e jogo)', async () => {
    const c = await start('json');
    try {
      for (const [path, method, body] of [
        ['/api/ranking', 'GET'],
        ['/api/metrics', 'GET'],
        ['/admin', 'GET'],
        ['/', 'GET'],
        ['/api/telemetry', 'POST', { sessionId: 'abcdefgh123', events: [] }],
      ] as const) {
        const r = await call(c, path, { method, host: `atacante.example:${c.port}`, body, headers: method === 'POST' ? { Origin: `http://atacante.example:${c.port}` } : {} });
        expect(r.status, `${method} ${path}`).toBe(403);
      }
      expect((await call(c, '/api/health', { host: `localhost:${c.port}` })).status).toBe(200);
    } finally {
      await c.app.close();
    }
  });
});

describe('painel e métricas', () => {
  it('só neste computador: atrás de proxy (TRUST_PROXY) toda conexão parece local, então pede token', async () => {
    const c = await start('json', { trustProxy: true });
    try {
      expect((await call(c, '/admin')).status).toBe(403);
      expect((await call(c, '/api/metrics')).status).toBe(403);
    } finally {
      await c.app.close();
    }
    const local = await start('json');
    try {
      expect((await call(local, '/admin')).status).toBe(200);
      expect((await call(local, '/api/metrics')).status).toBe(200);
    } finally {
      await local.app.close();
    }
  });

  it('pela rede com ADMIN_TOKEN: Bearer, ou /admin?token= que vira cookie (e o token some da URL)', async () => {
    const token = 'segredo-do-painel-0123456789';
    const c = await start('json', { trustProxy: true, adminToken: token });
    try {
      expect((await call(c, '/api/metrics', { headers: { Authorization: 'Bearer errado' } })).status).toBe(403);
      expect((await call(c, '/api/metrics', { headers: { Authorization: `Bearer ${token}` } })).status).toBe(200);
      expect((await call(c, '/admin?token=errado')).status).toBe(403);
      const first = await call(c, `/admin?token=${token}`);
      expect(first.status).toBe(303);
      expect(first.headers.location).toBe('/admin');
      const cookie = String(first.headers['set-cookie']?.[0] ?? '');
      expect(cookie).toMatch(/^qap_admin=.+; HttpOnly; SameSite=Strict; Path=\//);
      const jar = cookie.split(';')[0];
      expect((await call(c, '/admin', { headers: { Cookie: jar } })).status).toBe(200);
      expect((await call(c, '/api/metrics', { headers: { Cookie: jar } })).status).toBe(200);
      expect((await call(c, '/admin', { headers: { Cookie: 'qap_admin=outro' } })).status).toBe(403);
    } finally {
      await c.app.close();
    }
  });

  it('tentar adivinhar o ADMIN_TOKEN esbarra no limite de taxa', async () => {
    const c = await start('json', { trustProxy: true, adminToken: 'segredo-bem-comprido-123', rateLimits: undefined });
    try {
      const codes: number[] = [];
      for (let i = 0; i < 14; i++) codes.push((await call(c, `/admin?token=chute${i}`)).status);
      expect(codes.slice(0, 5).every((x) => x === 403)).toBe(true);
      expect(codes).toContain(429);
    } finally {
      await c.app.close();
    }
  });

  it('reconhece conexões deste computador', () => {
    for (const a of ['127.0.0.1', '127.8.9.10', '::1', '::ffff:127.0.0.1']) expect(isLoopbackAddress(a), a).toBe(true);
    for (const a of ['192.168.0.2', '::ffff:10.0.0.1', '1.127.0.0', '', undefined]) expect(isLoopbackAddress(a), String(a)).toBe(false);
  });
});

describe('cabeçalhos e registro', () => {
  it('toda resposta traz os cabeçalhos de segurança; a página do jogo traz a CSP', async () => {
    const c = await start('json');
    try {
      const page = await call(c, '/');
      expect(page.headers['content-security-policy']).toMatch(/default-src 'none'; script-src 'self'/);
      expect(page.headers['content-security-policy']).toMatch(/frame-ancestors 'none'/);
      const api = await call(c, '/api/health');
      for (const h of ['x-content-type-options', 'referrer-policy', 'x-frame-options', 'cross-origin-opener-policy', 'permissions-policy']) {
        expect(page.headers[h], `${h} na página`).toBeTruthy();
        expect(api.headers[h], `${h} na API`).toBeTruthy();
      }
    } finally {
      await c.app.close();
    }
  });

  it('o registro de requisições não mostra o id do perfil nem tokens', async () => {
    expect(redactUrl('/api/saves/AbCdEfGh12345678/1?x=1')).toBe('/api/saves/<perfil>/1?x=1');
    expect(redactUrl('/admin?token=abc&y=2')).toBe('/admin?token=<oculto>&y=2');
    // barras invertidas: o servidor as trata como "/", o registro também
    expect(redactUrl('/api\\saves\\AbCdEfGh12345678')).toBe('/api/saves/<perfil>');
    const c = await start('json', { logRequests: true });
    try {
      const p = json(await call(c, '/api/profiles', { method: 'POST', body: { name: 'Ana' } }));
      await call(c, `/api/saves/${p.id}`);
      await new Promise((r) => setTimeout(r, 50));
      expect(c.logs.join('\n')).toContain('/api/saves/<perfil>');
      expect(c.logs.join('\n')).not.toContain(p.id);
    } finally {
      await c.app.close();
    }
  });
});

describe('nomes com Unicode malicioso', () => {
  it('tira direção invertida, largura zero, brancos invisíveis e acentos empilhados; NFKC', () => {
    expect(sanitizeLabel('Ana‮txt.exe')).toBe('Anatxt.exe');
    expect(sanitizeLabel('A​d‌m‍i⁠n')).toBe('Admin');
    expect(sanitizeLabel('ＡＤＭＩＮ')).toBe('ADMIN');
    expect(sanitizeLabel('\u{1D41A}\u{1D41D}\u{1D426}')).toBe('adm');
    expect(sanitizeLabel('ㅤㅤ')).toBe('');
    expect(sanitizeLabel('⠀ ⠀')).toBe('');
    const zalgo = sanitizeLabel('Z' + '́̂̃̄̅̆̇̈')!;
    expect(Array.from(zalgo.normalize('NFD')).length).toBeLessThanOrEqual(4);
    expect(sanitizeLabel('＜b＞')).toBe('b');
    expect(sanitizeLabel('José da Silva')).toBe('José da Silva');
    // só marcas (nada visível): seletores de variação, o joiner U+034F, acentos sem letra
    for (const inv of ['\u034F\u034F', '\uFE0F\uFE0F', '\u0301\u0301', '\u{1D17B}', ' \u0301 ']) expect(sanitizeLabel(inv), JSON.stringify(inv)).toBe('');
    // teto de acentos contado depois de decompor: a + 4 acentos vira no máximo 2
    const a4 = sanitizeLabel('a\u0301\u0302\u0303\u0304')!;
    expect(Array.from(a4.normalize('NFD')).length).toBe(3);
    expect(sanitizeLabel('Zoë')).toBe('Zoë');
  });
});

for (const kind of ['json', 'sqlite'] as const) {
  describe.skipIf(kind === 'sqlite' && !sqliteAvailable)(`dados (${kind})`, () => {
    it('exclusão de dados do perfil (LGPD): perfil, saves, recordes e telemetria', async () => {
      const c = await start(kind);
      try {
        const a = json(await call(c, '/api/profiles', { method: 'POST', body: { name: 'Ana' } }));
        const b = json(await call(c, '/api/profiles', { method: 'POST', body: { name: 'Bia' } }));
        const summary = { day: 1, phase: 'jornal', mode: 'campanha', money: 0, gender: 'F', difficulty: 'padrao' };
        for (const p of [a, b]) {
          await call(c, `/api/saves/${p.id}/1`, { method: 'PUT', body: { data: '{"v":3}', summary } });
          await call(c, '/api/ranking', { method: 'POST', body: { profileId: p.id, name: p.name, seed: 's', score: 10, calls: 5, correct: 1, mode: 'infinito' } });
        }
        await call(c, '/api/telemetry', { method: 'POST', body: { sessionId: 'sessaoAna1', profileId: a.id, events: [{ name: 'day_end', data: { day: 1 } }] } });
        await call(c, '/api/telemetry', { method: 'POST', body: { sessionId: 'sessaoAna1', events: [{ name: 'bico', data: { day: 1 } }] } });
        await call(c, '/api/telemetry', { method: 'POST', body: { sessionId: 'sessaoBia1', profileId: b.id, events: [{ name: 'day_end', data: { day: 1 } }] } });
        const del = await call(c, `/api/profiles/${a.id}`, { method: 'DELETE' });
        expect(del.status).toBe(200);
        expect(json(del).deleted).toEqual({ profile: true, saves: 1, ranking: 1, telemetry: 2 });
        expect((await call(c, `/api/profiles/${a.id}`)).status).toBe(404);
        expect(json(await call(c, '/api/ranking?mode=infinito')).map((e: { name: string }) => e.name)).toEqual(['Bia']);
        expect(c.store.readTelemetry().map((e) => e.sessionId)).toEqual(['sessaoBia1']);
        expect(c.store.stats().saves).toBe(1);
        // de outro site não dá (CSRF)
        expect((await call(c, `/api/profiles/${b.id}`, { method: 'DELETE', headers: { Origin: 'http://malicioso.example' } })).status).toBe(403);
      } finally {
        await c.app.close();
      }
    });

    it('o painel tira uma entrada fraudulenta do ranking', async () => {
      const c = await start(kind);
      try {
        await call(c, '/api/ranking', { method: 'POST', body: { name: 'Fraude', seed: 's', score: 999, calls: 5, correct: 5, mode: 'infinito' } });
        const del = await call(c, '/api/admin/ranking', { method: 'DELETE', body: { mode: 'infinito', seed: 's', name: 'FRAUDE' } });
        expect(del.status).toBe(200);
        expect(json(del).deleted).toBe(true);
        expect(json(await call(c, '/api/ranking?mode=infinito'))).toEqual([]);
        expect(json(await call(c, '/api/admin/ranking', { method: 'DELETE', body: { mode: 'infinito', seed: 's', name: 'Fraude' } })).deleted).toBe(false);
      } finally {
        await c.app.close();
      }
      const remote = await start(kind, { trustProxy: true });
      try {
        expect((await call(remote, '/api/admin/ranking', { method: 'DELETE', body: { mode: 'infinito', seed: 's', name: 'x' } })).status).toBe(403);
      } finally {
        await remote.app.close();
      }
    });
  });
}

describe('kill switches', () => {
  it('saves, ranking e telemetria desligados respondem 503; o resto segue', async () => {
    const c = await start('json', { disabled: { saves: true, ranking: true, telemetry: true } });
    try {
      const p = json(await call(c, '/api/profiles', { method: 'POST', body: { name: 'Ana' } }));
      expect((await call(c, `/api/saves/${p.id}`)).status).toBe(503);
      expect((await call(c, '/api/ranking', { method: 'POST', body: { name: 'A', seed: 's', score: 1, calls: 1, correct: 1, mode: 'infinito' } })).status).toBe(503);
      expect((await call(c, '/api/telemetry', { method: 'POST', body: { sessionId: 'abcdefgh123', events: [] } })).status).toBe(503);
      expect((await call(c, '/api/ranking?mode=infinito')).status).toBe(503);
      expect((await call(c, '/api/health')).status).toBe(200);
    } finally {
      await c.app.close();
    }
  });
});
