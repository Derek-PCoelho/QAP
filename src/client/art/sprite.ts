// =============================================================================
// Sprites ASCII: cada caractere da grade é uma chave da paleta do sprite.
// '.' e ' ' são transparentes; uma chave mapeada para null também.
// Canvases e dataURLs são gerados sob demanda e guardados em cache.
// =============================================================================
import { Pix, newCanvas, hasDOM, mulberry, hashStr } from './pix';

export type Sprite = { w: number; h: number; rows: string[]; pal: Record<string, string | null> };

/** Monta um Sprite a partir das linhas (largura = maior linha). */
export function makeSprite(rows: string[], pal: Record<string, string | null>): Sprite {
  const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
  return { w, h: rows.length, rows, pal };
}

const keyMemo = new WeakMap<Sprite, string>();

/** Chave estável (hash de conteúdo) de um sprite, memoizada por identidade. */
export function spriteKey(s: Sprite): string {
  let k = keyMemo.get(s);
  if (!k) {
    const palStr = Object.keys(s.pal)
      .sort()
      .map((c) => c + '=' + (s.pal[c] ?? '_'))
      .join(',');
    k = `${s.w}x${s.h}:${(hashStr(s.rows.join('|')) >>> 0).toString(36)}:${(hashStr(palStr) >>> 0).toString(36)}`;
    keyMemo.set(s, k);
  }
  return k;
}

/** Rasteriza o sprite num Pix (escala 1, ou inteira). */
export function spritePix(s: Sprite, scale = 1, opts: { flipX?: boolean; tint?: string } = {}): Pix {
  const sc = Math.max(1, Math.floor(scale));
  const p = new Pix(s.w * sc, s.h * sc);
  p.sprite(s, 0, 0, { scale: sc, flipX: opts.flipX, tint: opts.tint });
  return p;
}

const canvasCache = new Map<string, HTMLCanvasElement>();
const urlCache = new Map<string, string>();

/** Canvas do sprite na escala inteira dada (cache por conteúdo+escala). */
export function spriteCanvas(s: Sprite, scale = 1): HTMLCanvasElement {
  const key = spriteKey(s) + '@' + scale;
  let c = canvasCache.get(key);
  if (!c) {
    c = spritePix(s, scale).toCanvas();
    canvasCache.set(key, c);
  }
  return c;
}

/** dataURL PNG do sprite (cache). Fora do navegador devolve ''. */
export function spriteURL(s: Sprite, scale = 1): string {
  if (!hasDOM()) return '';
  const key = spriteKey(s) + '@' + scale;
  let u = urlCache.get(key);
  if (!u) {
    u = spriteCanvas(s, scale).toDataURL('image/png');
    urlCache.set(key, u);
  }
  return u;
}

const tintCache = new Map<string, HTMLCanvasElement>();

/**
 * Desenha o sprite num contexto 2D em (x,y), escala inteira, sem suavização.
 * opts.tint pinta a silhueta inteira com a cor (flash de dano, sombra etc.).
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  s: Sprite,
  x: number,
  y: number,
  scale = 1,
  opts: { flipX?: boolean; tint?: string; alpha?: number } = {},
): void {
  let src: HTMLCanvasElement;
  if (opts.tint) {
    const key = spriteKey(s) + '@1#' + opts.tint;
    let c = tintCache.get(key);
    if (!c) {
      c = spritePix(s, 1, { tint: opts.tint }).toCanvas();
      tintCache.set(key, c);
    }
    src = c;
  } else src = spriteCanvas(s, 1);
  const prevSmooth = ctx.imageSmoothingEnabled;
  const prevAlpha = ctx.globalAlpha;
  ctx.imageSmoothingEnabled = false;
  if (opts.alpha !== undefined) ctx.globalAlpha = prevAlpha * opts.alpha;
  const w = s.w * scale;
  const h = s.h * scale;
  if (opts.flipX) {
    ctx.save();
    ctx.translate(Math.round(x) + w, Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0, w, h);
    ctx.restore();
  } else ctx.drawImage(src, Math.round(x), Math.round(y), w, h);
  ctx.imageSmoothingEnabled = prevSmooth;
  ctx.globalAlpha = prevAlpha;
}

/** RNG semeado (mulberry32) para variedade procedural determinística. */
export function seeded(seed: number | string): () => number {
  return mulberry(typeof seed === 'string' ? hashStr(seed) : seed);
}

/** Inteiro em [a, b] a partir de um RNG. */
export function rint(r: () => number, a: number, b: number): number {
  return a + Math.floor(r() * (b - a + 1));
}

/** Escolhe um item de uma lista a partir de um RNG. */
export function rpick<T>(r: () => number, arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length) % arr.length];
}

