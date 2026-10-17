// Content-Security-Policy da versão de arquivo único (JOGAR.html e o programa de desktop).
//
// O jogo inteiro está dentro do HTML: um <script> embutido, estilos embutidos, fontes e
// imagens em data:. A política só deixa rodar aquele script (pelo hash SHA-256 dele), não
// deixa a página falar com a rede nem carregar nada de fora. Se alguém conseguisse injetar
// HTML na página, o script injetado não rodaria e nada sairia do computador.
import { createHash } from 'node:crypto';

const META_RE = /\s*<meta http-equiv="Content-Security-Policy"[^>]*>/gi;

/** a política para este HTML (com o hash de cada <script> embutido) */
export function cspFor(html) {
  const clean = html.replace(META_RE, '');
  if (/<script\b[^>]*\bsrc\s*=/i.test(clean.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (m) => m.slice(0, m.indexOf('>') + 1)))) {
    throw new Error('o arquivo único não pode ter <script src>: a política só aceita scripts embutidos');
  }
  const hashes = [];
  for (const m of clean.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    hashes.push(`'sha256-${createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);
  }
  if (!hashes.length) throw new Error('nenhum <script> embutido no HTML');
  return [
    "default-src 'none'",
    `script-src ${hashes.join(' ')}`,
    "style-src 'unsafe-inline'",
    'img-src data: blob:',
    'font-src data:',
    'media-src data: blob:',
    "connect-src 'none'",
    "worker-src 'none'",
    "frame-src 'none'",
    "child-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "manifest-src 'none'",
  ].join('; ');
}

/** devolve o HTML com a meta tag da política logo depois do charset (troca a anterior, se houver) */
export function withCsp(html) {
  const clean = html.replace(META_RE, '');
  const meta = `<meta http-equiv="Content-Security-Policy" content="${cspFor(clean)}" />`;
  const charset = clean.match(/<meta charset="[^"]*"\s*\/?>/i);
  const out = charset ? clean.replace(charset[0], `${charset[0]}\n    ${meta}`) : clean.replace(/<head>/i, `<head>\n    ${meta}`);
  if (out === clean) throw new Error('<head> não encontrado no HTML');
  return out;
}
