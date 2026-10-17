// =============================================================================
// Pix — buffer de pixels em software (Uint32 RGBA), sem antialiasing.
// Toda a arte do jogo é rasterizada aqui (retângulos, linhas, discos, dithering
// ordenado, brilhos em faixas) e só no fim vira canvas/dataURL. Puro: importar
// em Node é seguro; só toCanvas/toDataURL precisam do DOM.
// =============================================================================
import type { Sprite } from './sprite';
import { hexToRgb } from './palette';

const packCache = new Map<string, number>();

/** '#rrggbb' (ou '#rgb', '#rrggbbaa', 'transparent') → inteiro empacotado 0xAABBGGRR. */
export function pack(hex: string): number {
  let v = packCache.get(hex);
  if (v !== undefined) return v;
  if (hex === 'transparent' || hex === '') v = 0;
  else {
    const [r, g, b] = hexToRgb(hex);
    let a = 255;
    const h = hex.replace('#', '');
    if (h.length === 8) a = parseInt(h.slice(6, 8), 16);
    v = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }
  packCache.set(hex, v);
  return v;
}

export function unpackRgb(v: number): [number, number, number, number] {
  return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
}

/** Matriz de Bayer 4×4 (limiares 0..15). */
export const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Matriz de Bayer 8×8 (limiares 0..63). */
export const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

/** true se o pixel (x,y) deve ser aceso para densidade d ∈ [0,1] (dithering ordenado 4×4). */
export function bayerOn(x: number, y: number, d: number): boolean {
  return (BAYER4[((y & 3) << 2) | (x & 3)] + 0.5) / 16 < d;
}

export function hasDOM(): boolean {
  return typeof document !== 'undefined' && typeof document.createElement === 'function';
}

export function newCanvas(w: number, h: number): HTMLCanvasElement {
  if (!hasDOM()) throw new Error('[art] canvas indisponível fora do navegador');
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export interface BlitOpts {
  flipX?: boolean;
  /** pinta todos os pixels opacos com esta cor */
  tint?: string;
  /** 0..1: quanto da cor de tint aplicar (padrão 1 = silhueta) */
  tintAmount?: number;
  /** opacidade global 0..1 */
  alpha?: number;
}

export class Pix {
  readonly w: number;
  readonly h: number;
  readonly data: Uint32Array;
  private mapFn: ((hex: string) => string) | null = null;
  private mcache = new Map<string, number>();

  constructor(w: number, h: number) {
    this.w = Math.max(1, w | 0);
    this.h = Math.max(1, h | 0);
    this.data = new Uint32Array(this.w * this.h);
  }

  /** Função de gradação aplicada a toda cor desenhada (ex.: homeGrader(t)). */
  setMap(fn: ((hex: string) => string) | null): this {
    this.mapFn = fn;
    this.mcache.clear();
    return this;
  }

  get map(): ((hex: string) => string) | null {
    return this.mapFn;
  }

  /** Cor hex → valor empacotado (já gradado). */
  c(hex: string): number {
    if (!this.mapFn) return pack(hex);
    let v = this.mcache.get(hex);
    if (v === undefined) {
      v = pack(hex === 'transparent' ? hex : this.mapFn(hex));
      this.mcache.set(hex, v);
    }
    return v;
  }

  clear(hex?: string): this {
    this.data.fill(hex ? this.c(hex) : 0);
    return this;
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x: number, y: number): number {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[y * this.w + x];
  }

  /** escreve valor empacotado cru */
  raw(x: number, y: number, v: number): void {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = v;
  }

  px(x: number, y: number, hex: string): void {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = this.c(hex);
  }

  /** pixel com mistura alfa (a ∈ 0..1) */
  pxa(x: number, y: number, hex: string, a: number): void {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = y * this.w + x;
    const src = this.c(hex);
    if (a >= 1) {
      this.data[i] = src;
      return;
    }
    const dst = this.data[i];
    const da = (dst >>> 24) & 255;
    const sr = src & 255;
    const sg = (src >>> 8) & 255;
    const sb = (src >>> 16) & 255;
    if (da === 0) {
      this.data[i] = ((Math.round(a * 255) << 24) | (sb << 16) | (sg << 8) | sr) >>> 0;
      return;
    }
    const dr = dst & 255;
    const dg = (dst >>> 8) & 255;
    const db = (dst >>> 16) & 255;
    const r = dr + (sr - dr) * a;
    const g = dg + (sg - dg) * a;
    const b = db + (sb - db) * a;
    const na = Math.min(255, da + (255 - da) * a);
    this.data[i] = ((na << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0)) >>> 0;
  }

  rect(x: number, y: number, w: number, h: number, hex: string): void {
    let x0 = Math.floor(x);
    let y0 = Math.floor(y);
    let x1 = x0 + Math.floor(w);
    let y1 = y0 + Math.floor(h);
    if (x0 < 0) x0 = 0;
    if (y0 < 0) y0 = 0;
    if (x1 > this.w) x1 = this.w;
    if (y1 > this.h) y1 = this.h;
    if (x1 <= x0 || y1 <= y0) return;
    const v = this.c(hex);
    for (let yy = y0; yy < y1; yy++) this.data.fill(v, yy * this.w + x0, yy * this.w + x1);
  }

  recta(x: number, y: number, w: number, h: number, hex: string, a: number): void {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    for (let yy = y0; yy < y0 + h; yy++) for (let xx = x0; xx < x0 + w; xx++) this.pxa(xx, yy, hex, a);
  }

  /** contorno de retângulo 1px */
  frame(x: number, y: number, w: number, h: number, hex: string): void {
    this.rect(x, y, w, 1, hex);
    this.rect(x, y + h - 1, w, 1, hex);
    this.rect(x, y, 1, h, hex);
    this.rect(x + w - 1, y, 1, h, hex);
  }

  hl(x0: number, x1: number, y: number, hex: string): void {
    if (x1 < x0) [x0, x1] = [x1, x0];
    this.rect(x0, y, x1 - x0 + 1, 1, hex);
  }

  vl(x: number, y0: number, y1: number, hex: string): void {
    if (y1 < y0) [y0, y1] = [y1, y0];
    this.rect(x, y0, 1, y1 - y0 + 1, hex);
  }

  /** linha de Bresenham */
  line(x0: number, y0: number, x1: number, y1: number, hex: string, a = 1): void {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let guard = 0; guard < 4096; guard++) {
      if (a >= 1) this.px(x0, y0, hex);
      else this.pxa(x0, y0, hex, a);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /** linha tracejada (on/off em pixels), com deslocamento de fase */
  dashed(x0: number, y0: number, x1: number, y1: number, hex: string, on = 2, off = 2, phase = 0): void {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    const per = on + off;
    for (let i = 0; i <= n; i++) {
      const k = (((i + phase) % per) + per) % per;
      if (k >= on) continue;
      const t = n === 0 ? 0 : i / n;
      this.px(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), hex);
    }
  }

  /** disco cheio "pixel-friendly" (centro pode ser .5) */
  disc(cx: number, cy: number, r: number, hex: string, a = 1): void {
    const rr = r * r + r * 0.6;
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
        const dx = x + 0.5 - (cx + 0.5);
        const dy = y + 0.5 - (cy + 0.5);
        if (dx * dx + dy * dy <= rr) {
          if (a >= 1) this.px(x, y, hex);
          else this.pxa(x, y, hex, a);
        }
      }
  }

  /** anel de 1px */
  ring(cx: number, cy: number, r: number, hex: string): void {
    const outer = r * r + r * 0.6;
    const inner = (r - 1) * (r - 1) + (r - 1) * 0.6;
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
        const dx = x - cx;
        const dy = y - cy;
        const d = dx * dx + dy * dy;
        if (d <= outer && d > inner) this.px(x, y, hex);
      }
  }

  /** elipse cheia (centro e raios podem ser fracionários) */
  ellipse(cx: number, cy: number, rx: number, ry: number, hex: string, a = 1): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          if (a >= 1) this.px(x, y, hex);
          else this.pxa(x, y, hex, a);
        }
      }
  }

  /** polígono cheio (regra par-ímpar, amostragem no centro do pixel) */
  poly(pts: [number, number][], hex: string, a = 1): void {
    if (pts.length < 3) return;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minY = Math.min(minY, p[1]);
      maxY = Math.max(maxY, p[1]);
    }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const sy = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const x0 = Math.ceil(xs[i] - 0.5);
        const x1 = Math.floor(xs[i + 1] - 0.5);
        for (let x = x0; x <= x1; x++) {
          if (a >= 1) this.px(x, y, hex);
          else this.pxa(x, y, hex, a);
        }
      }
    }
  }

  /** preenchimento com dithering ordenado: acende pixels com densidade d ∈ [0,1] */
  dith(x: number, y: number, w: number, h: number, hex: string, d: number, ox = 0, oy = 0): void {
    if (d <= 0) return;
    if (d >= 1) return this.rect(x, y, w, h, hex);
    const v = this.c(hex);
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.w, Math.floor(x) + Math.floor(w));
    const y1 = Math.min(this.h, Math.floor(y) + Math.floor(h));
    for (let yy = y0; yy < y1; yy++)
      for (let xx = x0; xx < x1; xx++) if (bayerOn(xx + ox, yy + oy, d)) this.data[yy * this.w + xx] = v;
  }

  /** xadrez 50% */
  checker(x: number, y: number, w: number, h: number, hex: string, phase = 0): void {
    const v = this.c(hex);
    for (let yy = Math.max(0, y); yy < Math.min(this.h, y + h); yy++)
      for (let xx = Math.max(0, x); xx < Math.min(this.w, x + w); xx++) if (((xx + yy + phase) & 1) === 0) this.data[yy * this.w + xx] = v;
  }

  /**
   * Degradê vertical em faixas com transição pontilhada entre cores da lista
   * (pixel art: nada de degradê contínuo).
   */
  vgrad(x: number, y: number, w: number, h: number, colors: string[], ditherBand = 0.5): void {
    if (colors.length === 1) return this.rect(x, y, w, h, colors[0]);
    const n = colors.length - 1;
    for (let yy = 0; yy < h; yy++) {
      const t = h <= 1 ? 0 : (yy / (h - 1)) * n;
      const i = Math.min(n - 1, Math.floor(t));
      const f = t - i;
      // faixa: até (1-ditherBand)/2 cor i; depois dither; depois cor i+1
      const lo = (1 - ditherBand) / 2;
      const hi = 1 - lo;
      if (f <= lo) this.rect(x, y + yy, w, 1, colors[i]);
      else if (f >= hi) this.rect(x, y + yy, w, 1, colors[i + 1]);
      else {
        this.rect(x, y + yy, w, 1, colors[i]);
        this.dith(x, y + yy, w, 1, colors[i + 1], (f - lo) / (hi - lo));
      }
    }
  }

  /** degradê horizontal (mesma lógica) */
  hgrad(x: number, y: number, w: number, h: number, colors: string[], ditherBand = 0.5): void {
    if (colors.length === 1) return this.rect(x, y, w, h, colors[0]);
    const n = colors.length - 1;
    for (let xx = 0; xx < w; xx++) {
      const t = w <= 1 ? 0 : (xx / (w - 1)) * n;
      const i = Math.min(n - 1, Math.floor(t));
      const f = t - i;
      const lo = (1 - ditherBand) / 2;
      const hi = 1 - lo;
      if (f <= lo) this.rect(x + xx, y, 1, h, colors[i]);
      else if (f >= hi) this.rect(x + xx, y, 1, h, colors[i + 1]);
      else {
        this.rect(x + xx, y, 1, h, colors[i]);
        this.dith(x + xx, y, 1, h, colors[i + 1], (f - lo) / (hi - lo));
      }
    }
  }

  /**
   * Brilho radial em faixas (luz de lâmpada): anéis concêntricos com alfa
   * decrescente, borda de cada anel pontilhada.
   */
  glow(cx: number, cy: number, r: number, hex: string, a0: number, bands = 4, sy = 1, opaqueOnly = false): void {
    for (let y = Math.floor(cy - r * sy); y <= Math.ceil(cy + r * sy); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if (opaqueOnly && !(this.get(x, y) >>> 24)) continue;
        const dx = x + 0.5 - cx;
        const dy = (y + 0.5 - cy) / sy;
        const d = Math.sqrt(dx * dx + dy * dy) / r;
        if (d >= 1) continue;
        // faixa quantizada + pontilhado na fronteira
        let q = (1 - d) * bands;
        const fl = Math.floor(q);
        const fr = q - fl;
        q = fl + (bayerOn(x, y, fr) ? 1 : 0);
        const a = (q / bands) * a0;
        if (a > 0) this.pxa(x, y, hex, a);
      }
  }

  /** copia outro Pix (respeitando transparência) */
  blit(src: Pix, dx: number, dy: number, o: BlitOpts = {}): void {
    dx = Math.floor(dx);
    dy = Math.floor(dy);
    const tint = o.tint ? this.c(o.tint) : 0;
    const ta = o.tintAmount ?? 1;
    const alpha = o.alpha ?? 1;
    for (let y = 0; y < src.h; y++) {
      const ty = dy + y;
      if (ty < 0 || ty >= this.h) continue;
      for (let x = 0; x < src.w; x++) {
        const tx = dx + x;
        if (tx < 0 || tx >= this.w) continue;
        const sx = o.flipX ? src.w - 1 - x : x;
        let v = src.data[y * src.w + sx];
        const sa = (v >>> 24) & 255;
        if (sa === 0) continue;
        if (o.tint) {
          if (ta >= 1) v = (tint & 0x00ffffff) | (sa << 24);
          else {
            const [r, g, b] = unpackRgb(v);
            const [tr, tg, tb] = unpackRgb(tint);
            v = (((sa << 24) | (Math.round(b + (tb - b) * ta) << 16) | (Math.round(g + (tg - g) * ta) << 8) | Math.round(r + (tr - r) * ta)) >>> 0);
          }
        }
        if (alpha >= 1 && sa === 255) this.data[ty * this.w + tx] = v;
        else this.blendRaw(tx, ty, v, (sa / 255) * alpha);
      }
    }
  }

  private blendRaw(x: number, y: number, v: number, a: number): void {
    const i = y * this.w + x;
    const dst = this.data[i];
    const da = (dst >>> 24) & 255;
    if (da === 0) {
      this.data[i] = ((Math.round(a * 255) << 24) | (v & 0x00ffffff)) >>> 0;
      return;
    }
    const r = (dst & 255) + ((v & 255) - (dst & 255)) * a;
    const g = ((dst >>> 8) & 255) + (((v >>> 8) & 255) - ((dst >>> 8) & 255)) * a;
    const b = ((dst >>> 16) & 255) + (((v >>> 16) & 255) - ((dst >>> 16) & 255)) * a;
    const na = Math.min(255, da + (255 - da) * a);
    this.data[i] = ((na << 24) | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0)) >>> 0;
  }

  /** desenha um Sprite ASCII */
  sprite(s: Sprite, x: number, y: number, o: BlitOpts & { scale?: number } = {}): void {
    const sc = Math.max(1, Math.floor(o.scale ?? 1));
    x = Math.floor(x);
    y = Math.floor(y);
    for (let r = 0; r < s.h; r++) {
      const row = s.rows[r] ?? '';
      for (let c = 0; c < s.w; c++) {
        const ch = row[c];
        if (ch === undefined || ch === '.' || ch === ' ') continue;
        const col = s.pal[ch];
        if (!col) continue;
        const color = o.tint ?? col;
        const cx = o.flipX ? s.w - 1 - c : c;
        if (sc === 1) {
          if (o.alpha !== undefined && o.alpha < 1) this.pxa(x + cx, y + r, color, o.alpha);
          else this.px(x + cx, y + r, color);
        } else if (o.alpha !== undefined && o.alpha < 1) this.recta(x + cx * sc, y + r * sc, sc, sc, color, o.alpha);
        else this.rect(x + cx * sc, y + r * sc, sc, sc, color);
      }
    }
  }

  /**
   * Contorno automático: pinta de `hex` todo pixel transparente vizinho
   * (4-vizinhança, ou 8 com diag) de um pixel opaco.
   */
  outline(hex: string, diag = false): this {
    const v = this.c(hex);
    const w = this.w;
    const h = this.h;
    const src = this.data.slice();
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if ((src[i] >>> 24) !== 0) continue;
        let hit = false;
        if (x > 0 && src[i - 1] >>> 24) hit = true;
        else if (x < w - 1 && src[i + 1] >>> 24) hit = true;
        else if (y > 0 && src[i - w] >>> 24) hit = true;
        else if (y < h - 1 && src[i + w] >>> 24) hit = true;
        else if (diag) {
          if (x > 0 && y > 0 && src[i - w - 1] >>> 24) hit = true;
          else if (x < w - 1 && y > 0 && src[i - w + 1] >>> 24) hit = true;
          else if (x > 0 && y < h - 1 && src[i + w - 1] >>> 24) hit = true;
          else if (x < w - 1 && y < h - 1 && src[i + w + 1] >>> 24) hit = true;
        }
        if (hit) this.data[i] = v;
      }
    return this;
  }

  /** sombra projetada simples: copia a silhueta deslocada, por baixo */
  dropShadow(hex: string, dx = 1, dy = 1, a = 1): this {
    const src = this.data.slice();
    const v = this.c(hex);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const sx = x - dx;
        const sy = y - dy;
        if (sx < 0 || sy < 0 || sx >= this.w || sy >= this.h) continue;
        const i = y * this.w + x;
        if (src[i] >>> 24) continue;
        if (src[sy * this.w + sx] >>> 24) {
          if (a >= 1) this.data[i] = v;
          else this.blendRaw(x, y, v, a);
        }
      }
    return this;
  }

  /** aplica função a cada pixel opaco (ex.: gradação pós-desenho) */
  remap(fn: (v: number) => number): this {
    for (let i = 0; i < this.data.length; i++) {
      const v = this.data[i];
      if (v >>> 24) this.data[i] = fn(v) >>> 0;
    }
    return this;
  }

  copy(): Pix {
    const p = new Pix(this.w, this.h);
    p.data.set(this.data);
    return p;
  }

  copyFrom(src: Pix): this {
    if (src.w === this.w && src.h === this.h) this.data.set(src.data);
    else {
      this.data.fill(0);
      this.blit(src, 0, 0);
    }
    return this;
  }

  /** recorte */
  crop(x: number, y: number, w: number, h: number): Pix {
    const p = new Pix(w, h);
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++) p.data[yy * w + xx] = this.get(x + xx, y + yy);
    return p;
  }

  /** ampliação inteira (vizinho mais próximo) */
  scaled(k: number): Pix {
    k = Math.max(1, Math.floor(k));
    if (k === 1) return this.copy();
    const p = new Pix(this.w * k, this.h * k);
    for (let y = 0; y < p.h; y++)
      for (let x = 0; x < p.w; x++) p.data[y * p.w + x] = this.data[((y / k) | 0) * this.w + ((x / k) | 0)];
    return p;
  }

  toImageData(): ImageData {
    const bytes = new Uint8ClampedArray(this.w * this.h * 4);
    bytes.set(new Uint8Array(this.data.buffer, this.data.byteOffset, this.data.byteLength));
    return new ImageData(bytes, this.w, this.h);
  }

  /** escreve no canvas dado (redimensiona se preciso) ou cria um novo */
  toCanvas(target?: HTMLCanvasElement): HTMLCanvasElement {
    const c = target ?? newCanvas(this.w, this.h);
    if (c.width !== this.w || c.height !== this.h) {
      c.width = this.w;
      c.height = this.h;
    }
    const ctx = c.getContext('2d');
    if (ctx) ctx.putImageData(this.toImageData(), 0, 0);
    return c;
  }

  toDataURL(scale = 1): string {
    if (!hasDOM()) return '';
    const src = scale > 1 ? this.scaled(scale) : this;
    return src.toCanvas().toDataURL('image/png');
  }
}

// -----------------------------------------------------------------------------
// Saída para um contexto 2D (com canvas intermediário reaproveitado)
// -----------------------------------------------------------------------------
const stage = new Map<string, HTMLCanvasElement>();

/**
 * Desenha o Pix no contexto em (x,y) com escala inteira/real, sem suavização.
 * Usa um canvas intermediário reaproveitado por tamanho.
 */
export function presentPix(ctx: CanvasRenderingContext2D, p: Pix, x = 0, y = 0, scale = 1, slot = 'default'): void {
  const key = `${slot}:${p.w}x${p.h}`;
  let c = stage.get(key);
  if (!c) {
    c = newCanvas(p.w, p.h);
    stage.set(key, c);
  }
  p.toCanvas(c);
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c, x, y, p.w * scale, p.h * scale);
  ctx.imageSmoothingEnabled = prev;
}

const gradeMemo = new WeakMap<Pix, Map<string, Pix>>();

/**
 * Cópia do Pix com cada cor passada por `fn` (ex.: homeGrader(t)), em cache
 * por (Pix, chave). Útil para blitar sprites já gradados.
 */
export function gradedCopy(src: Pix, fn: ((hex: string) => string) | null, key: string): Pix {
  if (!fn) return src;
  let m = gradeMemo.get(src);
  if (!m) {
    m = new Map();
    gradeMemo.set(src, m);
  }
  let out = m.get(key);
  if (out) return out;
  out = src.copy();
  const memo = new Map<number, number>();
  out.remap((v) => {
    let o = memo.get(v);
    if (o === undefined) {
      const r = v & 255;
      const g = (v >>> 8) & 255;
      const b = (v >>> 16) & 255;
      const a = (v >>> 24) & 255;
      const hex = '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
      o = ((pack(fn(hex)) & 0x00ffffff) | (a << 24)) >>> 0;
      memo.set(v, o);
    }
    return o;
  });
  m.set(key, out);
  return out;
}

/** RNG determinístico mulberry32 */
export function mulberry(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** hash de inteiros (posição) → 0..1 */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}
