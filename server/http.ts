// =============================================================================
// Utilitários HTTP: erros com status, leitura de corpo com limite, respostas.
// =============================================================================
import type { IncomingMessage, ServerResponse } from 'node:http';
import { MB } from './config';

export class HttpError extends Error {
  readonly status: number;
  readonly headers?: Record<string, string>;
  constructor(status: number, message: string, headers?: Record<string, string>) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.headers = headers;
  }
}

export function formatBytes(n: number): string {
  if (n >= MB) return `${+(n / MB).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

/** depois disso deixamos de drenar o corpo excedente e derrubamos a conexão */
const DRAIN_EXTRA = 8 * MB;

/**
 * Lê o corpo inteiro respeitando `limit`. Corpos grandes demais viram 413.
 * O excedente (até um teto) é drenado para que o cliente receba a resposta
 * em vez de um "connection reset".
 */
export function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const tooBig = () => new HttpError(413, `corpo da requisição grande demais (máx. ${formatBytes(limit)})`);
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared > limit + DRAIN_EXTRA) {
      req.resume();
      reject(tooBig());
      return;
    }
    let overflow = Number.isFinite(declared) && declared > limit;
    let size = 0;
    let settled = false;
    const chunks: Buffer[] = [];

    const cleanup = () => {
      req.off('data', onData);
      req.off('end', onEnd);
      req.off('error', onError);
      req.off('close', onClose);
    };
    const finish = (err: HttpError | null, value?: Buffer) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (err) reject(err);
      else resolve(value as Buffer);
    };
    const onData = (chunk: Buffer) => {
      size += chunk.length;
      if (overflow || size > limit) {
        overflow = true;
        chunks.length = 0;
        if (size > limit + DRAIN_EXTRA) {
          finish(tooBig());
          req.destroy();
        }
        return;
      }
      chunks.push(chunk);
    };
    const onEnd = () => finish(overflow ? tooBig() : null, overflow ? undefined : Buffer.concat(chunks, size));
    const onError = () => finish(new HttpError(400, 'falha ao ler o corpo da requisição'));
    const onClose = () => finish(new HttpError(400, 'requisição interrompida'));

    req.on('data', onData);
    req.on('end', onEnd);
    req.on('error', onError);
    req.on('close', onClose);
  });
}

const utf8 = new TextDecoder('utf-8', { fatal: true });

/** Lê e interpreta JSON (aceita qualquer Content-Type: o sendBeacon manda text/plain). */
export async function readJson(req: IncomingMessage, limit: number): Promise<unknown> {
  const buf = await readBody(req, limit);
  if (buf.length === 0) throw new HttpError(400, 'corpo JSON ausente');
  let text: string;
  try {
    text = utf8.decode(buf);
  } catch {
    throw new HttpError(400, 'corpo não é UTF-8 válido');
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new HttpError(400, 'JSON inválido');
  }
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function sendJson(
  req: IncomingMessage,
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string | number> = {},
): void {
  if (res.headersSent) {
    res.destroy();
    return;
  }
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(req.method === 'HEAD' ? undefined : payload);
}

export function sendText(
  req: IncomingMessage,
  res: ServerResponse,
  status: number,
  text: string,
  type = 'text/plain; charset=utf-8',
  headers: Record<string, string | number> = {},
): void {
  if (res.headersSent) {
    res.destroy();
    return;
  }
  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(req.method === 'HEAD' ? undefined : text);
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}
