// =============================================================================
// Proteções HTTP do servidor (ver docs/SEGURANCA.md):
//  • Host conferido contra DNS rebinding (um site malicioso aberto no navegador do
//    jogador fazendo o próprio domínio apontar para 127.0.0.1 e falar com a central);
//  • painel /admin e métricas só neste computador, ou pela rede com ADMIN_TOKEN;
//  • cabeçalhos de segurança e a Content-Security-Policy da página do jogo;
//  • registro de requisições sem o id de perfil (que é a senha do perfil) nem tokens.
// =============================================================================
import { createHash, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { hostname as osHostname } from 'node:os';
import type { IncomingMessage } from 'node:http';

/** nome do cabeçalho Host sem a porta, em minúsculas ('' se faltar ou for inválido) */
export function hostName(raw: string | undefined): string {
  if (!raw) return '';
  const h = raw.trim().toLowerCase();
  if (h.startsWith('[')) {
    const end = h.indexOf(']');
    const rest = end > 0 ? h.slice(end + 1) : 'x';
    return end > 0 && (rest === '' || /^:\d{1,5}$/.test(rest)) ? h.slice(1, end) : '';
  }
  const first = h.indexOf(':');
  const last = h.lastIndexOf(':');
  if (first !== last) return ''; // IPv6 sem colchetes não é um Host válido
  const name = last >= 0 ? h.slice(0, last) : h;
  if (last >= 0 && !(/^\d{1,5}$/.test(h.slice(last + 1)) && Number(h.slice(last + 1)) <= 65535)) return '';
  return /^[a-z0-9._-]+$/.test(name) ? name : '';
}

/**
 * Monta a conferência do Host. Passam sempre: endereços IP (o rebinding depende de um NOME
 * de domínio do atacante que passa a apontar para cá), "localhost" e "*.localhost", e o nome
 * desta máquina (ex.: meu-mac.local, para abrir pela rede local). Outros nomes só com
 * ALLOWED_HOSTS (ex.: atrás de um proxy reverso com domínio próprio).
 */
export function makeHostCheck(extra: readonly string[] = []): (raw: string | undefined) => boolean {
  const names = new Set(extra.map((h) => h.trim().toLowerCase()).filter(Boolean));
  const me = osHostname().trim().toLowerCase();
  if (me) {
    const short = me.split('.')[0];
    for (const n of [me, `${me}.local`, short, `${short}.local`]) names.add(n);
  }
  return (raw) => {
    const h = hostName(raw);
    if (!h) return false;
    if (isIP(h)) return true;
    if (h === 'localhost' || h.endsWith('.localhost')) return true;
    return names.has(h);
  };
}

/** a conexão vem deste computador? (127.0.0.0/8 ou ::1, inclusive em IPv6 mapeado) */
export function isLoopbackAddress(addr: string | undefined): boolean {
  if (!addr) return false;
  const a = addr.toLowerCase().startsWith('::ffff:') ? addr.slice(7) : addr;
  return a === '::1' || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(a);
}

const digest = (s: string) => createHash('sha256').update(s, 'utf8').digest();
/** compara segredos em tempo constante (os dois lados viram SHA-256 do mesmo tamanho) */
export function sameSecret(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

export function cookieValue(req: IncomingMessage, name: string): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

export const ADMIN_COOKIE = 'qap_admin';

export type AdminAccess = { ok: true; via: 'local' | 'token'; fromQuery: boolean } | { ok: false; message: string };

/**
 * Pode ver o painel e as métricas? Neste computador, sim (a menos que o servidor esteja atrás
 * de um proxy: aí toda conexão parece local). Pela rede, só com o ADMIN_TOKEN: no cabeçalho
 * Authorization (Bearer), no cookie do painel ou, uma vez, em /admin?token=… (que vira cookie).
 */
export function adminAccess(req: IncomingMessage, url: URL, opts: { token?: string; trustProxy?: boolean }): AdminAccess {
  const token = opts.token?.trim();
  if (token) {
    const auth = /^Bearer\s+(.+)$/i.exec(String(req.headers.authorization ?? ''))?.[1]?.trim();
    if (auth && sameSecret(auth, token)) return { ok: true, via: 'token', fromQuery: false };
    const cookie = cookieValue(req, ADMIN_COOKIE);
    if (cookie && sameSecret(cookie, token)) return { ok: true, via: 'token', fromQuery: false };
    const q = url.searchParams.get('token');
    if (q && sameSecret(q, token)) return { ok: true, via: 'token', fromQuery: true };
  }
  if (!opts.trustProxy && isLoopbackAddress(req.socket.remoteAddress)) return { ok: true, via: 'local', fromQuery: false };
  return {
    ok: false,
    message: token
      ? 'acesso negado: o painel pela rede pede o ADMIN_TOKEN'
      : 'o painel e as métricas só abrem neste computador (para abrir pela rede, defina ADMIN_TOKEN)',
  };
}

/** URL para o registro: sem o id de perfil (é a senha do perfil) nem tokens */
export function redactUrl(url: string | undefined): string {
  return (url ?? '')
    .replace(/[\\/](saves|profiles)[\\/][^/\\?#]+/gi, '/$1/<perfil>')
    .replace(/([?&]token=)[^&#]*/gi, '$1<oculto>')
    .slice(0, 300);
}

/** cabeçalhos em toda resposta */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), display-capture=()',
});

/**
 * Content-Security-Policy da página do jogo (dist/client): só scripts, estilos e fontes do
 * próprio servidor, imagens e sons gerados na página (data:, blob:), API no mesmo endereço.
 */
export const GAME_CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' data: blob:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');
