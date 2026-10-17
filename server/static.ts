// =============================================================================
// Arquivos estáticos do cliente (dist/client): MIME, cache, ETag/304, gzip,
// Range, fallback para index.html e bloqueio de directory traversal.
// =============================================================================
import { createReadStream, promises as fsp, type Stats } from 'node:fs';
import { extname, join, posix, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';
import { gzip } from 'node:zlib';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { MB } from './config';
import { sendText } from './http';
import { GAME_CSP } from './security';

const gzipAsync = promisify(gzip);

export const MIME: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.cur': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.mid': 'audio/midi',
  '.midi': 'audio/midi',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
};

const COMPRESSIBLE = /^(?:text\/|application\/(?:json|javascript|xml|manifest\+json|wasm)|image\/svg\+xml|image\/x-icon|image\/bmp|font\/(?:ttf|otf))/;
/** arquivos do Vite com hash no nome (assets/index-AbC123xy.js) podem ficar em cache "para sempre" */
const HASHED_ASSET_RE = /^\/assets\/(?:[^/]+\/)*[^/]+[-.][A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/;
const GZ_CACHE_BYTES = 64 * MB;
const GZ_MAX_FILE = 32 * MB;

export function notBuiltPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Plantão em preparo</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07100b; color: #d2f5dc;
         font: 15px/1.6 ui-monospace, "SF Mono", Menlo, Consolas, monospace; padding: 16px; box-sizing: border-box; }
  main { max-width: 560px; border: 2px solid #2c5440; background: #0f1d16; box-shadow: 6px 6px 0 #020604; padding: 24px; }
  h1 { margin: 0 0 12px; font-size: 18px; letter-spacing: .12em; text-transform: uppercase; color: #46f08c; }
  code { background: #07100b; border: 1px solid #1f3a2b; padding: 1px 6px; color: #fff; }
  a { color: #9cc8a8; }
  p { margin: 0 0 12px; }
</style>
</head>
<body>
<main>
  <h1>QAP — Emergency Dispatch</h1>
  <p>A central está no ar, mas o jogo (cliente) ainda não foi compilado.</p>
  <p>Rode <code>npm run build</code> (ou só <code>npm run build:client</code>) e recarregue esta página.</p>
  <p>Para desenvolver, use <code>npm run dev</code> e abra <code>http://localhost:5173</code>.</p>
  <p><a href="/admin">Painel de calibragem</a> · <a href="/api/health">/api/health</a></p>
</main>
</body>
</html>
`;
}

async function statSafe(file: string): Promise<Stats | null> {
  try {
    return await fsp.stat(file);
  } catch {
    return null;
  }
}

function parseRange(header: string, size: number): { start: number; end: number } | 'invalid' | 'unsatisfiable' {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '')) return 'invalid';
  let start: number;
  let end: number;
  if (m[1] === '') {
    const suffix = Number(m[2]);
    if (suffix === 0) return 'unsatisfiable';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) return 'unsatisfiable';
  return { start, end };
}

function isFresh(req: IncomingMessage, etag: string, mtimeMs: number): boolean {
  const inm = req.headers['if-none-match'];
  if (inm) {
    const strip = (t: string) => t.trim().replace(/^W\//, '');
    const want = strip(etag);
    return inm === '*' || inm.split(',').some((t) => strip(t) === want);
  }
  const ims = req.headers['if-modified-since'];
  if (ims) {
    const since = Date.parse(ims);
    return Number.isFinite(since) && Math.floor(mtimeMs / 1000) * 1000 <= since;
  }
  return false;
}

export class StaticFiles {
  readonly root: string;
  private readonly gzDone = new Map<string, Buffer>();
  private readonly gzPending = new Map<string, Promise<Buffer>>();
  private gzBytes = 0;

  constructor(root: string) {
    this.root = resolve(root);
  }

  /** O cliente foi compilado? (existe index.html na raiz) */
  async built(): Promise<boolean> {
    return !!(await statSafe(join(this.root, 'index.html')))?.isFile();
  }

  async handle(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<void> {
    let decoded: string;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return sendText(req, res, 400, 'Caminho inválido.');
    }
    if (decoded.includes('\0') || decoded.includes('\\')) return sendText(req, res, 400, 'Caminho inválido.');
    const segments = decoded.split('/');
    if (segments.includes('..')) return sendText(req, res, 403, 'Proibido.');
    if (segments.some((s) => s.startsWith('.') && s !== '.well-known')) return sendText(req, res, 404, 'Não encontrado.');

    const target = resolve(this.root, '.' + posix.normalize('/' + decoded));
    if (target !== this.root && !target.startsWith(this.root + sep)) return sendText(req, res, 403, 'Proibido.');

    let file = target;
    let st = await statSafe(file);
    if (st?.isDirectory()) {
      file = join(file, 'index.html');
      st = await statSafe(file);
    }
    if (st?.isFile()) return this.sendFile(req, res, file, st, decoded);

    // não existe: se parece arquivo (tem extensão), 404; senão é rota do app → index.html
    const ext = extname(decoded).toLowerCase();
    if (ext && ext !== '.html' && ext !== '.htm') return sendText(req, res, 404, 'Arquivo não encontrado.');
    return this.sendIndexFallback(req, res, decoded);
  }

  private async sendIndexFallback(req: IncomingMessage, res: ServerResponse, requestPath: string): Promise<void> {
    const file = join(this.root, 'index.html');
    let html: string;
    try {
      html = await fsp.readFile(file, 'utf8');
    } catch {
      return sendText(req, res, 503, notBuiltPage(), 'text/html; charset=utf-8', { 'Retry-After': '30', 'Content-Security-Policy': GAME_CSP });
    }
    // o build usa base './': em caminhos aninhados os assets relativos quebrariam sem <base href="/">
    const depth = requestPath.split('/').filter(Boolean).length;
    if (depth >= 2 && !/<base\s/i.test(html)) html = html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}<base href="/">`);
    sendText(req, res, 200, html, 'text/html; charset=utf-8', { 'Cache-Control': 'no-cache', 'Content-Security-Policy': GAME_CSP });
  }

  private async sendFile(req: IncomingMessage, res: ServerResponse, file: string, st: Stats, urlPath: string): Promise<void> {
    const ext = extname(file).toLowerCase();
    const type = MIME[ext] ?? 'application/octet-stream';
    const isHtml = ext === '.html' || ext === '.htm';
    const cacheControl = !isHtml && HASHED_ASSET_RE.test(urlPath) ? 'public, max-age=31536000, immutable' : 'no-cache';
    const tag = `${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}`;
    const compressible = COMPRESSIBLE.test(type) && st.size >= 1024 && st.size <= GZ_MAX_FILE;
    const acceptsGzip = /\bgzip\b/i.test(String(req.headers['accept-encoding'] ?? ''));
    const useGzip = compressible && acceptsGzip && !req.headers.range;
    const etag = `W/"${tag}${useGzip ? '-gz' : ''}"`;

    const headers: Record<string, string | number> = {
      'Content-Type': type,
      'Cache-Control': cacheControl,
      ETag: etag,
      'Last-Modified': st.mtime.toUTCString(),
    };
    if (compressible) headers.Vary = 'Accept-Encoding';
    if (isHtml) headers['Content-Security-Policy'] = GAME_CSP;

    if (isFresh(req, etag, st.mtimeMs)) {
      const h304: Record<string, string> = { ETag: etag, 'Cache-Control': cacheControl };
      if (compressible) h304.Vary = 'Accept-Encoding';
      res.writeHead(304, h304);
      res.end();
      return;
    }

    if (useGzip) {
      let gz: Buffer | null = null;
      try {
        gz = await this.gzipped(file, tag);
      } catch {
        gz = null; // arquivo sumiu ou falhou: serve sem compressão
      }
      if (gz) {
        headers['Content-Encoding'] = 'gzip';
        headers['Content-Length'] = gz.length;
        res.writeHead(200, headers);
        res.end(req.method === 'HEAD' ? undefined : gz);
        return;
      }
      headers.ETag = `W/"${tag}"`;
    }

    headers['Accept-Ranges'] = 'bytes';
    let start = 0;
    let end = st.size - 1;
    let status = 200;
    const range = req.headers.range;
    if (range && st.size > 0) {
      const r = parseRange(range, st.size);
      if (r === 'unsatisfiable') {
        res.writeHead(416, { 'Content-Range': `bytes */${st.size}` });
        res.end();
        return;
      }
      if (r !== 'invalid') {
        start = r.start;
        end = r.end;
        status = 206;
        headers['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
      }
    }
    headers['Content-Length'] = st.size === 0 ? 0 : end - start + 1;
    res.writeHead(status, headers);
    if (req.method === 'HEAD' || st.size === 0) {
      res.end();
      return;
    }
    try {
      await pipeline(createReadStream(file, { start, end }), res);
    } catch {
      res.destroy();
    }
  }

  private async gzipped(file: string, tag: string): Promise<Buffer> {
    const key = `${file}|${tag}`;
    const hit = this.gzDone.get(key);
    if (hit) {
      this.gzDone.delete(key);
      this.gzDone.set(key, hit); // LRU: volta para o fim
      return hit;
    }
    const pending = this.gzPending.get(key);
    if (pending) return pending;
    const p = fsp.readFile(file).then((buf) => gzipAsync(buf, { level: 6 }));
    this.gzPending.set(key, p);
    try {
      const gz = await p;
      this.gzDone.set(key, gz);
      this.gzBytes += gz.length;
      while (this.gzBytes > GZ_CACHE_BYTES && this.gzDone.size > 1) {
        const oldest = this.gzDone.keys().next();
        if (oldest.done) break;
        this.gzBytes -= this.gzDone.get(oldest.value)?.length ?? 0;
        this.gzDone.delete(oldest.value);
      }
      return gz;
    } finally {
      this.gzPending.delete(key);
    }
  }
}
