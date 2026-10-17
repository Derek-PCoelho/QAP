// =============================================================================
// Kit dos retratos 64×64 (e dos rostos de paciente na videochamada).
//
// - Rampas de 5 tons por material (fundo, sombra, base, luz, brilho) com
//   desvio de matiz em OKLCH: sombras puxam para azul-violeta, luzes para
//   amarelo.
// - Camada "material + tom" em vez de cores soltas: permite limpar pixels
//   órfãos nas faixas de sombra, fazer contorno seletivo (escuro tingido pela
//   cor vizinha, mais claro do lado da luz) e luz de recorte no lado da sombra.
// - Máscaras de forma (elipse, polígono, faixas), iluminação de cima-esquerda,
//   geradores de olhos, sobrancelhas, nariz e boca.
// Módulo puro (sem DOM).
// =============================================================================
import { Pix, hash2, mulberry } from './pix';
import { hexToRgb, rgbToHex } from './palette';

// -----------------------------------------------------------------------------
// Cor: OKLab / OKLCH
// -----------------------------------------------------------------------------
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const toLin = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const toGam = (v: number): number => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055) * 255;

const lchCache = new Map<string, [number, number, number]>();

/** '#rrggbb' → [L, C, h°] (OKLCH). */
export function toLch(hex: string): [number, number, number] {
  const hit = lchCache.get(hex);
  if (hit) return hit;
  const [r8, g8, b8] = hexToRgb(hex);
  const r = toLin(r8);
  const g = toLin(g8);
  const b = toLin(b8);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  const out: [number, number, number] = [L, C, h];
  lchCache.set(hex, out);
  return out;
}

function labToLinRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** OKLCH → '#rrggbb' (reduz o croma até caber no sRGB). */
export function lch(L: number, C: number, hDeg: number): string {
  const h = (hDeg * Math.PI) / 180;
  let c = Math.max(0, C);
  L = clamp(L, 0, 1);
  for (let i = 0; i < 40; i++) {
    const [r, g, b] = labToLinRgb(L, c * Math.cos(h), c * Math.sin(h));
    const ok = r >= -0.0005 && r <= 1.0005 && g >= -0.0005 && g <= 1.0005 && b >= -0.0005 && b <= 1.0005;
    if (ok || c < 0.0015) return rgbToHex(toGam(clamp(r, 0, 1)), toGam(clamp(g, 0, 1)), toGam(clamp(b, 0, 1)));
    c *= 0.9;
  }
  const [r, g, b] = labToLinRgb(L, 0, 0);
  return rgbToHex(toGam(clamp(r, 0, 1)), toGam(clamp(g, 0, 1)), toGam(clamp(b, 0, 1)));
}

/** gira o matiz h em direção a `target` (pelo arco menor), no máximo `deg` graus */
export function hueToward(h: number, target: number, deg: number): number {
  const d = ((target - h + 540) % 360) - 180;
  const step = Math.sign(d) * Math.min(Math.abs(d), Math.abs(deg));
  return (h + step + 360) % 360;
}

/** mistura perceptual (OKLab) entre duas cores */
export function mixLab(a: string, b: string, t: number): string {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const [L1, C1, h1] = toLch(a);
  const [L2, C2, h2] = toLch(b);
  const a1 = C1 * Math.cos((h1 * Math.PI) / 180);
  const b1 = C1 * Math.sin((h1 * Math.PI) / 180);
  const a2 = C2 * Math.cos((h2 * Math.PI) / 180);
  const b2 = C2 * Math.sin((h2 * Math.PI) / 180);
  const L = L1 + (L2 - L1) * t;
  const A = a1 + (a2 - a1) * t;
  const B = b1 + (b2 - b1) * t;
  const C = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return lch(L, C, h);
}

/** ajusta L/C/h de uma cor */
export function adjust(hex: string, dL: number, cMul = 1, dh = 0): string {
  const [L, C, h] = toLch(hex);
  return lch(L + dL, C * cMul, (h + dh + 360) % 360);
}

export interface RampSpec {
  /** deltas de L (OKLab) para [fundo, sombra, luz, brilho] */
  dl?: [number, number, number, number];
  /** multiplicadores de croma para [fundo, sombra, luz, brilho] */
  ck?: [number, number, number, number];
  /** giro máximo de matiz (graus) das sombras (→ violeta) e das luzes (→ amarelo) */
  hs?: number;
  hl?: number;
  /** alvo de matiz das sombras (padrão 292°, azul-violeta) */
  shadowHue?: number;
  /** alvo de matiz das luzes (padrão 85°, amarelo quente) */
  lightHue?: number;
}

/**
 * Rampa de 5 tons [fundo, sombra, base, luz, brilho] a partir da cor base,
 * com desvio de matiz (sombras frias, luzes quentes).
 */
export function ramp(base: string, s: RampSpec = {}): string[] {
  const [L, C, h] = toLch(base);
  const dl = s.dl ?? [-0.25, -0.12, 0.075, 0.15];
  const ck = s.ck ?? [0.9, 1.05, 0.95, 0.72];
  const hs = s.hs ?? 24;
  const hl = s.hl ?? 16;
  const SH = s.shadowHue ?? 292;
  const HL = s.lightHue ?? 85;
  const neutral = C < 0.035;
  const mk = (dL: number, cm: number, target: number, deg: number, tintC: number) => {
    let C2 = C * cm;
    let h2 = hueToward(h, target, deg);
    if (neutral) {
      // neutros ganham um leve tom na direção do alvo (sombra violeta, luz creme)
      const w = 1 - C / 0.035;
      C2 = C2 * (1 - w) + tintC * w;
      h2 = w > 0.5 ? target : h2;
    }
    return lch(L + dL, C2, h2);
  };
  return [mk(dl[0], ck[0], SH, hs, 0.03), mk(dl[1], ck[1], SH, hs * 0.55, 0.022), base, mk(dl[2], ck[2], HL, hl * 0.55, 0.012), mk(dl[3], ck[3], HL, hl, 0.018)];
}

// -----------------------------------------------------------------------------
// Máscara de forma
// -----------------------------------------------------------------------------
export class Mask {
  readonly w: number;
  readonly h: number;
  readonly a: Uint8Array;
  constructor(w = 64, h = 64) {
    this.w = w;
    this.h = h;
    this.a = new Uint8Array(w * h);
  }
  get(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    return this.a[y * this.w + x] !== 0;
  }
  set(x: number, y: number, v = 1): this {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    this.a[y * this.w + x] = v;
    return this;
  }
  clr(x: number, y: number): this {
    return this.set(x, y, 0);
  }
  rect(x: number, y: number, w: number, h: number, v = 1): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, v);
    return this;
  }
  /** linha horizontal x0..x1 (inclusive) */
  hl(x0: number, x1: number, y: number, v = 1): this {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, v);
    return this;
  }
  /** elipse cheia: centro/raios fracionários, amostra no centro do pixel */
  ellipse(cx: number, cy: number, rx: number, ry: number, v = 1): this {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, v);
      }
    return this;
  }
  /** polígono cheio (par-ímpar), amostra no centro do pixel */
  poly(pts: [number, number][], v = 1): this {
    if (pts.length < 3) return this;
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
        for (let x = x0; x <= x1; x++) this.set(x, y, v);
      }
    }
    return this;
  }
  /** faixas por linha: rows[i] = [x0, x1] para y = y0 + i */
  spans(y0: number, rows: [number, number][], v = 1): this {
    rows.forEach(([a, b], i) => this.hl(a, b, y0 + i, v));
    return this;
  }
  /** traço grosso (disco arrastado) ao longo de uma polilinha */
  stroke(pts: [number, number][], r: number, v = 1): this {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        this.ellipse(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, r, v);
      }
    }
    return this;
  }
  or(o: Mask): this {
    for (let i = 0; i < this.a.length; i++) if (o.a[i]) this.a[i] = 1;
    return this;
  }
  and(o: Mask): this {
    for (let i = 0; i < this.a.length; i++) if (!o.a[i]) this.a[i] = 0;
    return this;
  }
  sub(o: Mask): this {
    for (let i = 0; i < this.a.length; i++) if (o.a[i]) this.a[i] = 0;
    return this;
  }
  copy(): Mask {
    const m = new Mask(this.w, this.h);
    m.a.set(this.a);
    return m;
  }
  /** é borda: pixel cheio com vizinho (4) vazio na direção dada */
  edge(x: number, y: number, dx: number, dy: number): boolean {
    return this.get(x, y) && !this.get(x + dx, y + dy);
  }
  /** limites [x0, x1] da linha y (ou null) */
  rowSpan(y: number): [number, number] | null {
    let a = -1;
    let b = -1;
    for (let x = 0; x < this.w; x++)
      if (this.get(x, y)) {
        if (a < 0) a = x;
        b = x;
      }
    return a < 0 ? null : [a, b];
  }
  /** remove pixels isolados (com ≤ n vizinhos-4 cheios) */
  prune(n = 1): this {
    const src = this.a.slice();
    const g = (x: number, y: number) => x >= 0 && y >= 0 && x < this.w && y < this.h && src[y * this.w + x] !== 0;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (!g(x, y)) continue;
        const k = +g(x - 1, y) + +g(x + 1, y) + +g(x, y - 1) + +g(x, y + 1);
        if (k <= n) this.a[y * this.w + x] = 0;
      }
    return this;
  }
  /** preenche buracos de 1 pixel (≥ 3 vizinhos-4 cheios) */
  fillPits(): this {
    const src = this.a.slice();
    const g = (x: number, y: number) => x >= 0 && y >= 0 && x < this.w && y < this.h && src[y * this.w + x] !== 0;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (g(x, y)) continue;
        const k = +g(x - 1, y) + +g(x + 1, y) + +g(x, y - 1) + +g(x, y + 1);
        if (k >= 3) this.a[y * this.w + x] = 1;
      }
    return this;
  }
  count(): number {
    let n = 0;
    for (let i = 0; i < this.a.length; i++) if (this.a[i]) n++;
    return n;
  }
}

// -----------------------------------------------------------------------------
// Luz: de cima-esquerda, um pouco de frente
// -----------------------------------------------------------------------------
const LN = Math.hypot(-0.52, -0.5, 0.7);
export const LIGHT: [number, number, number] = [-0.52 / LN, -0.5 / LN, 0.7 / LN];

/** intensidade da luz para uma normal (não normalizada) */
export function lit(nx: number, ny: number, nz: number): number {
  const n = Math.hypot(nx, ny, nz) || 1;
  return (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / n;
}

/** normal de esfera (cx, cy, r) em (x, y); fora da esfera, achata no equador */
export function sphereN(x: number, y: number, cx: number, cy: number, rx: number, ry = rx): [number, number, number] {
  const dx = (x + 0.5 - cx) / rx;
  const dy = (y + 0.5 - cy) / ry;
  const d2 = dx * dx + dy * dy;
  if (d2 >= 1) {
    const d = Math.sqrt(d2);
    return [dx / d, dy / d, 0.05];
  }
  return [dx, dy, Math.sqrt(1 - d2)];
}

/** tom a partir da intensidade: limiares [fundo|sombra, sombra|base, base|luz, luz|brilho] */
export function toneOf(I: number, th: [number, number, number, number]): number {
  if (I < th[0]) return 0;
  if (I < th[1]) return 1;
  if (I < th[2]) return 2;
  if (I < th[3]) return 3;
  return 4;
}

// -----------------------------------------------------------------------------
// Camada material + tom
// -----------------------------------------------------------------------------
/** partes (para regras de sombra e contorno) */
export const P = {
  NONE: 0,
  BACK: 1, // cabelo de trás / coisas atrás da cabeça
  BODY: 2,
  NECK: 3,
  EAR: 4,
  FACE: 5,
  FEAT: 6, // olhos, boca, sobrancelhas (travados)
  HAIR: 7,
  HAT: 8,
  ACC: 9,
  GLASS: 10,
} as const;

export class Layer {
  readonly w: number;
  readonly h: number;
  /** material (0 = vazio) */
  readonly m: Uint8Array;
  /** tom 0..4 */
  readonly t: Uint8Array;
  /** parte (P.*) */
  readonly p: Uint8Array;
  /** 1 = pixel desenhado à mão (não limpar) */
  readonly k: Uint8Array;
  readonly ramps: string[][] = [['#000000', '#000000', '#000000', '#000000', '#000000']];
  /** material "irmão" para sobreposições (blush, barba...) */
  private solids = new Map<string, number>();

  constructor(w = 64, h = 64) {
    this.w = w;
    this.h = h;
    this.m = new Uint8Array(w * h);
    this.t = new Uint8Array(w * h);
    this.p = new Uint8Array(w * h);
    this.k = new Uint8Array(w * h);
  }

  private rampIds = new Map<string, number>();

  /** registra uma rampa de 5 tons → id do material (rampas iguais compartilham o id) */
  mat(r: string[]): number {
    const full = r.length === 5 ? r : [r[0], r[0], r[0], r[0], r[0]];
    const key = full.join(',');
    const hit = this.rampIds.get(key);
    if (hit !== undefined) return hit;
    if (this.ramps.length >= 255) throw new Error('[portrait] materiais demais');
    this.ramps.push(full);
    const id = this.ramps.length - 1;
    this.rampIds.set(key, id);
    return id;
  }

  /** material de cor única (em cache) */
  solid(hex: string): number {
    let id = this.solids.get(hex);
    if (id === undefined) {
      id = this.mat([hex, hex, hex, hex, hex]);
      this.solids.set(hex, id);
    }
    return id;
  }

  in(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  idx(x: number, y: number): number {
    return y * this.w + x;
  }
  filled(x: number, y: number): boolean {
    return this.in(x, y) && this.m[y * this.w + x] !== 0;
  }
  part(x: number, y: number): number {
    return this.in(x, y) ? this.p[y * this.w + x] : P.NONE;
  }
  matAt(x: number, y: number): number {
    return this.in(x, y) ? this.m[y * this.w + x] : 0;
  }
  toneAt(x: number, y: number): number {
    return this.in(x, y) ? this.t[y * this.w + x] : 0;
  }
  locked(x: number, y: number): boolean {
    return this.in(x, y) && this.k[y * this.w + x] !== 0;
  }

  set(x: number, y: number, mat: number, tone: number, part: number, lock = 0): void {
    x = Math.floor(x);
    y = Math.floor(y);
    if (!this.in(x, y)) return;
    const i = y * this.w + x;
    this.m[i] = mat;
    this.t[i] = clamp(Math.round(tone), 0, 4);
    this.p[i] = part;
    this.k[i] = lock;
  }

  /** cor sólida travada */
  color(x: number, y: number, hex: string, part: number = P.FEAT): void {
    this.set(x, y, this.solid(hex), 2, part, 1);
  }

  /** muda só o tom (se houver material e não estiver travado) */
  tone(x: number, y: number, tone: number, onlyPart?: number): void {
    if (!this.in(x, y)) return;
    const i = y * this.w + x;
    if (!this.m[i] || this.k[i]) return;
    if (onlyPart !== undefined && this.p[i] !== onlyPart) return;
    this.t[i] = clamp(Math.round(tone), 0, 4);
  }

  /** escurece/clareia o tom em d (limitado) */
  shift(x: number, y: number, d: number, onlyPart?: number): void {
    if (!this.in(x, y)) return;
    const i = y * this.w + x;
    if (!this.m[i] || this.k[i]) return;
    if (onlyPart !== undefined && this.p[i] !== onlyPart) return;
    this.t[i] = clamp(this.t[i] + d, 0, 4);
  }

  /** troca o material mantendo o tom (blush, barba, palidez...) */
  remat(x: number, y: number, mat: number, onlyMat?: number): void {
    if (!this.in(x, y)) return;
    const i = y * this.w + x;
    if (!this.m[i]) return;
    if (onlyMat !== undefined && this.m[i] !== onlyMat) return;
    this.m[i] = mat;
  }

  /** pinta uma máscara com um material; tom vem da função */
  paint(mask: Mask, mat: number, part: number, tone: (x: number, y: number) => number, only?: (x: number, y: number) => boolean): void {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (!mask.get(x, y)) continue;
        if (only && !only(x, y)) continue;
        this.set(x, y, mat, tone(x, y), part);
      }
  }

  /**
   * Limpa pixels órfãos de tom: dentro do mesmo material e parte, um pixel
   * cujos vizinhos-4 do mesmo material concordam num outro tom passa a esse tom.
   */
  despeckle(parts?: number[], passes = 1): void {
    for (let pass = 0; pass < passes; pass++) {
      const t0 = this.t.slice();
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          const i = y * this.w + x;
          if (!this.m[i] || this.k[i]) continue;
          if (parts && !parts.includes(this.p[i])) continue;
          const mi = this.m[i];
          const counts = [0, 0, 0, 0, 0];
          let n = 0;
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const xx = x + dx;
            const yy = y + dy;
            if (!this.in(xx, yy)) continue;
            const j = yy * this.w + xx;
            if (this.m[j] !== mi || this.p[j] !== this.p[i]) continue;
            counts[t0[j]]++;
            n++;
          }
          if (n < 3) continue;
          const own = t0[i];
          if (counts[own] > 0) continue;
          let best = own;
          let bc = 0;
          for (let k = 0; k < 5; k++)
            if (counts[k] > bc) {
              bc = counts[k];
              best = k;
            }
          if (bc >= n - 1) this.t[i] = best;
        }
    }
  }

  /** cor final do pixel */
  hexAt(x: number, y: number): string | null {
    if (!this.in(x, y)) return null;
    const i = y * this.w + x;
    if (!this.m[i]) return null;
    return this.ramps[this.m[i]][this.t[i]];
  }
}

export interface ComposeOpts {
  /** cor-base do contorno (tinta escura do fundo) */
  ink: string;
  /** luz de recorte (lado direito/sombra) */
  rim?: string;
  /** força da luz de recorte 0..1 */
  rimK?: number;
  /** não contornar a borda de baixo do quadro */
  openBottom?: boolean;
}

/**
 * Converte a camada em Pix: cores das rampas, contorno seletivo (cor do
 * material vizinho escurecida em direção à tinta; mais clara no lado da luz),
 * luz de recorte opcional na borda direita. Compõe sobre o fundo dado.
 */
export function compose(L: Layer, bg: Pix | null, o: ComposeOpts): Pix {
  const out = bg ? bg.copy() : new Pix(L.w, L.h);
  const W = L.w;
  const H = L.h;
  const deepOf = new Map<number, string>();
  const litOf = new Map<number, string>();
  const rimOf = new Map<string, string>();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const mi = L.m[i];
      if (!mi) continue;
      let hex = L.ramps[mi][L.t[i]];
      if (o.rim && (o.rimK ?? 0) > 0 && !L.k[i]) {
        // borda direita da silhueta (vizinho à direita vazio), fora do topo
        const right = !L.filled(x + 1, y) && L.filled(x - 1, y);
        const p = L.p[i];
        if (right && L.t[i] <= 2 && p !== P.FEAT && p !== P.EAR && y < H - 1) {
          const key = hex;
          let r = rimOf.get(key);
          if (!r) {
            r = mixLab(L.ramps[mi][Math.min(4, L.t[i] + 1)], o.rim, o.rimK ?? 0.4);
            rimOf.set(key, r);
          }
          hex = r;
        }
      }
      out.px(x, y, hex);
    }
  // contorno externo
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (L.filled(x, y)) continue;
      // vizinho preferido: direita, baixo, esquerda, cima
      let src = -1;
      let litSide = false;
      const cand: [number, number, boolean][] = [
        [x + 1, y, true],
        [x, y + 1, true],
        [x - 1, y, false],
        [x, y - 1, false],
      ];
      for (const [xx, yy, lt] of cand) {
        if (L.filled(xx, yy)) {
          src = yy * W + xx;
          litSide = lt;
          break;
        }
      }
      if (src < 0) continue;
      if (o.openBottom && y === H - 1) continue;
      const mi = L.m[src];
      let c = litSide ? litOf.get(mi) : deepOf.get(mi);
      if (!c) {
        const r = L.ramps[mi];
        c = litSide ? mixLab(r[0], o.ink, 0.42) : mixLab(r[0], o.ink, 0.7);
        (litSide ? litOf : deepOf).set(mi, c);
      }
      out.px(x, y, c);
    }
  return out;
}

// -----------------------------------------------------------------------------
// Olhos
// -----------------------------------------------------------------------------
export interface EyeShape {
  /** linha da pálpebra superior por coluna (de fora para dentro), relativa ao topo da caixa */
  lid: number[];
  /** última linha aberta por coluna */
  bot: number[];
  /** diâmetro da íris (px) */
  iris: number;
  /** linha do topo da íris */
  irisTop: number;
  /** altura da íris */
  irisH: number;
}

/** formatos-base dos olhos (coluna 0 = canto externo) */
export const EYE_SHAPES: Record<string, EyeShape> = {
  // adulto, 7 px
  adult: { lid: [1, 0, 0, 0, 0, 0, 1], bot: [2, 3, 3, 3, 3, 2, 2], iris: 3, irisTop: 1, irisH: 3 },
  // adulto feminino: canto externo mais alongado
  fem: { lid: [1, 0, 0, 0, 0, 0, 1], bot: [2, 3, 3, 3, 3, 2, 2], iris: 3, irisTop: 1, irisH: 3 },
  // criança: grandes
  big: { lid: [1, 0, 0, 0, 0, 0, 1], bot: [3, 4, 4, 4, 4, 4, 3], iris: 3, irisTop: 1, irisH: 4 },
  // idoso: pequenos, encapuzados
  small: { lid: [1, 0, 0, 0, 0, 1], bot: [1, 2, 2, 2, 2, 1], iris: 2, irisTop: 1, irisH: 2 },
  // close de paciente, 9 px
  patient: { lid: [2, 1, 0, 0, 0, 0, 0, 1, 2], bot: [3, 4, 5, 5, 5, 5, 4, 4, 3], iris: 4, irisTop: 1, irisH: 5 },
  // close de bebê/criança
  patientBig: { lid: [2, 1, 0, 0, 0, 0, 0, 1, 2], bot: [4, 5, 6, 6, 6, 6, 5, 5, 4], iris: 5, irisTop: 1, irisH: 6 },
};

export interface EyeMood {
  /** baixa a pálpebra toda (px) */
  drop?: number;
  /** sobe a pálpebra toda (px, olhos arregalados) */
  raise?: number;
  /** baixa a pálpebra no canto externo (tristeza) */
  outDrop?: number;
  /** baixa a pálpebra no canto interno (raiva) */
  inDrop?: number;
  /** sobe a pálpebra de baixo (sorriso, apertar) */
  lift?: number;
  /** direção do olhar */
  look?: [number, number];
  /** olho fechado: arco de sorriso, arco para baixo (dormindo), linha */
  closed?: 'happy' | 'down' | 'flat';
  /** pupila menor (susto) */
  tinyPupil?: boolean;
  /** brilho úmido extra (choro) */
  wet?: boolean;
  /** olhos revirados (só o branco aparece) */
  rolled?: boolean;
}

export interface EyeColors {
  lid: string; // linha da pálpebra / cílios
  white: string;
  whiteS: string; // branco na sombra da pálpebra
  iris: string;
  irisD: string;
  irisL: string;
  pupil: string;
  shine: string;
}

export function eyeColors(iris: string, opts: { lid?: string; white?: string; bloodshot?: boolean } = {}): EyeColors {
  const [L] = toLch(iris);
  const white = opts.white ?? '#ece6dc';
  return {
    lid: opts.lid ?? '#22141a',
    white,
    whiteS: opts.bloodshot ? '#c9a0a0' : mixLab(white, '#8a7c8c', 0.42),
    iris,
    irisD: adjust(iris, -Math.min(0.12, L * 0.45), 1.05, -8),
    irisL: adjust(iris, 0.1, 0.9, 10),
    pupil: '#120a0e',
    shine: '#fffaf0',
  };
}

export interface EyeDraw {
  shape: EyeShape;
  mood: EyeMood;
  colors: EyeColors;
  /** mat/tom da pele para pálpebra inferior e vinco */
  skinMat: number;
  /** cílios: 0 nenhum, 1 canto externo, 2 marcados */
  lashes?: number;
  /** vinco da pálpebra (dobra) */
  crease?: boolean;
  /** pálpebra pesada (idoso/cansado): vinco mais escuro e baixo */
  hooded?: boolean;
  /** bolsas sob os olhos */
  bags?: number;
  /** pálpebra pesada (cansaço): sombra logo acima da linha */
  heavy?: boolean;
}

/**
 * Desenha um olho com o canto superior-esquerdo da caixa em (x0, y0).
 * side: 'L' = olho à esquerda da tela (canto externo à esquerda).
 */
export function drawEye(L: Layer, x0: number, y0: number, side: 'L' | 'R', d: EyeDraw): void {
  const s = d.shape;
  const m = d.mood;
  const w = s.lid.length;
  const c = d.colors;
  const lidArr: number[] = [];
  const botArr: number[] = [];
  for (let i = 0; i < w; i++) {
    const tIn = i / (w - 1); // 0 = canto externo, 1 = interno
    let lid = s.lid[i];
    let bot = s.bot[i];
    lid += m.drop ?? 0;
    lid -= m.raise ?? 0;
    if (m.outDrop) lid += Math.round(m.outDrop * Math.pow(1 - tIn, 1.6) + 0.15);
    if (m.inDrop) lid += Math.round(m.inDrop * Math.pow(tIn, 1.6) + 0.15);
    if (m.lift) bot -= Math.round(m.lift * Math.sin(Math.PI * ((i + 0.5) / w)) + 0.2);
    if (m.raise && (i === 0 || i === w - 1)) lid = Math.min(lid, s.lid[i]);
    lidArr.push(lid);
    botArr.push(bot);
  }
  const col = (i: number) => (side === 'L' ? x0 + i : x0 + w - 1 - i);
  const put = (i: number, r: number, hex: string) => L.color(col(i), y0 + r, hex);
  const skin = (i: number, r: number, tone: number) => {
    const x = col(i);
    const y = y0 + r;
    if (!L.filled(x, y) || L.locked(x, y)) return;
    if (L.part(x, y) !== P.FACE) return;
    L.set(x, y, d.skinMat, Math.min(tone, L.toneAt(x, y)), P.FACE, 0);
  };

  // olho fechado
  if (m.closed) {
    const base = Math.max(...s.lid) + Math.floor((s.irisH + 1) / 2);
    for (let i = 0; i < w; i++) {
      const tc = (i + 0.5) / w;
      const arch = Math.sin(Math.PI * tc);
      let r = base;
      if (m.closed === 'happy') r = base - Math.round(arch * 1.6);
      else if (m.closed === 'down') r = base - 1 + Math.round(arch * 1.2);
      if (i === 0 && m.closed !== 'flat') r += m.closed === 'happy' ? 0 : -0;
      put(i, r, c.lid);
      if (m.closed === 'down' && arch > 0.5) skin(i, r - 1, 1);
    }
    if ((d.lashes ?? 0) > 0) {
      const r0 = m.closed === 'happy' ? base : base;
      put(-1, r0 - (m.closed === 'happy' ? 0 : 1), c.lid);
    }
    return;
  }

  // íris: posição
  const irisW = s.iris;
  const look = m.look ?? [0, 0];
  const lookX = side === 'L' ? look[0] : -look[0];
  const ic0 = Math.round((w - irisW) / 2 + lookX); // coluna (de fora para dentro) da íris
  const ir0 = s.irisTop + Math.round(look[1]) + (m.drop && m.drop > 1 ? 1 : 0);
  const ir1 = ir0 + s.irisH - 1;
  const inIris = (i: number, r: number) => {
    if (m.rolled) return i > ic0 && i < ic0 + irisW - 1 && r === lidArr[i] + 1;
    if (i < ic0 || i >= ic0 + irisW) return false;
    if (r < ir0 || r > ir1) return false;
    // cantos arredondados para íris grandes
    if (irisW >= 4 && s.irisH >= 5) {
      const edgeC = i === ic0 || i === ic0 + irisW - 1;
      const edgeR = r === ir0 || r === ir1;
      if (edgeC && edgeR) return false;
    }
    return true;
  };
  // pupila: centro da íris
  const pc = ic0 + (irisW - 1) / 2;
  const pr = ir0 + (s.irisH - 1) / 2 + (s.irisH >= 4 ? 0 : 0.5);
  const isPupil = (i: number, r: number) => {
    if (m.rolled) return false;
    const big = irisW >= 4 && !m.tinyPupil;
    if (big) return Math.abs(i - pc) <= 0.5 && Math.abs(r - pr) <= 0.5;
    if (irisW === 2) return false;
    return Math.abs(i - pc) < 0.6 && Math.abs(r - Math.floor(pr)) < 0.6;
  };

  for (let i = 0; i < w; i++) {
    const lid = lidArr[i];
    const bot = botArr[i];
    // linha da pálpebra
    put(i, lid, c.lid);
    const open = bot >= lid + 1;
    if (!open) continue;
    for (let r = lid + 1; r <= bot; r++) {
      const topRow = r === lid + 1;
      const corner = i === 0 || i === w - 1;
      let hex: string;
      if (inIris(i, r)) {
        hex = topRow ? c.irisD : r === ir1 && s.irisH >= 3 && r === bot ? c.irisL : c.iris;
        if (isPupil(i, r)) hex = c.pupil;
      } else {
        hex = topRow || corner ? c.whiteS : c.white;
        if (m.rolled && topRow) hex = c.whiteS;
      }
      put(i, r, hex);
    }
    // pálpebra de baixo: tom de sombra suave no meio
    const tc = (i + 0.5) / w;
    if (tc > 0.15 && tc < 0.85) skin(i, bot + 1, m.lift ? 1 : 2);
    if (m.lift && tc > 0.2 && tc < 0.8) skin(i, bot + 2, 2);
  }
  // brilho (sempre em cima-esquerda da pupila, nos dois olhos)
  if (!m.rolled) {
    const hiCol = side === 'L' ? ic0 : ic0 + irisW - 1; // coluna mais à esquerda da tela
    const leftmost = side === 'L' ? Math.min(ic0, ic0 + irisW - 1) : ic0 + irisW - 1;
    void leftmost;
    let hr = ir0 + (irisW >= 4 ? 1 : 0);
    // brilho fica 1 linha abaixo da pálpebra se a íris começa coberta
    const lidAt = lidArr[hiCol];
    if (hr <= lidAt) hr = lidAt + 1;
    const xh = side === 'L' ? x0 + hiCol + (irisW >= 4 ? 1 : 0) : x0 + w - 1 - hiCol + (irisW >= 4 ? 1 : 0);
    const hc = side === 'L' ? hiCol + (irisW >= 4 ? 1 : 0) : hiCol - (irisW >= 4 ? 1 : 0);
    if (hr <= botArr[Math.max(0, Math.min(w - 1, hc))] && hr > lidArr[Math.max(0, Math.min(w - 1, hc))]) L.color(xh, y0 + hr, c.shine);
    // segundo brilho (olhos grandes ou úmidos), embaixo à direita
    if ((irisW >= 4 && s.irisH >= 5) || m.wet) {
      const i2 = side === 'L' ? ic0 + irisW - 1 : ic0;
      const r2 = Math.min(botArr[i2], ir1);
      if (r2 > lidArr[i2] + 1) put(i2, r2, m.wet ? mixLab(c.irisL, '#ffffff', 0.6) : c.irisL);
    }
  }
  // cílios / canto externo
  const lashes = d.lashes ?? 0;
  if (lashes > 0) {
    put(-1, lidArr[0] - 1, c.lid);
    if (lashes > 1) {
      put(0, lidArr[0] - 1, c.lid);
      if (lidArr[1] <= lidArr[0]) put(1, lidArr[1] - 1, c.lid);
    }
  }
  // vinco da pálpebra
  if (d.crease || d.hooded || d.heavy) {
    const minLid = Math.min(...lidArr);
    for (let i = 1; i < w - 1; i++) {
      const r = d.hooded || d.heavy ? lidArr[i] - 1 : minLid - 2;
      if (lashes > 1 && (i === 1 || i === 0)) continue;
      skin(i, r, d.hooded || d.heavy ? 1 : 2);
    }
    if (d.hooded) skin(0, lidArr[0] - 1, 1);
    if (d.heavy) for (let i = 2; i < w - 2; i++) skin(i, minLid - 2, 2);
  }
  // bolsas
  if (d.bags) {
    for (let i = 1; i < w - 1; i++) {
      const r = botArr[i] + 2;
      skin(i, r, d.bags > 1 ? 1 : 2);
    }
  }
}

// -----------------------------------------------------------------------------
// Sobrancelhas
// -----------------------------------------------------------------------------
export interface BrowMood {
  /** deslocamento vertical (px) do canto externo, do arco e do canto interno (+ = para baixo) */
  out: number;
  mid: number;
  inn: number;
  /** aproxima o canto interno do nariz (px) */
  knit?: number;
}

/**
 * Sobrancelha de comprimento len (px), base em (xOuter, y) indo para dentro.
 * thick: espessura no canto interno (1..3), afinando para fora.
 */
export function drawBrow(L: Layer, xOuter: number, y: number, side: 'L' | 'R', len: number, mood: BrowMood, color: string, thick: number, light?: string): void {
  const dir = side === 'L' ? 1 : -1;
  const knit = Math.max(0, Math.round(mood.knit ?? 0));
  const n = len + knit;
  const tops: number[] = [];
  const t1 = 0.42;
  const a = mood.out;
  const b = mood.mid;
  const cc = mood.inn;
  for (let i = 0; i < n; i++) {
    const t = Math.min(1, i / (len - 1)); // 0 = externo, 1 = interno
    // curva por (0,out) (0.42,mid) (1,inn) — interpolação de Lagrange
    const yy = (a * (t - t1) * (t - 1)) / ((0 - t1) * (0 - 1)) + (b * t * (t - 1)) / (t1 * (t1 - 1)) + (cc * t * (t - t1)) / (1 - t1);
    tops.push(y + Math.round(yy));
  }
  let pTop = 0;
  let pBot = 0;
  for (let i = 0; i < n; i++) {
    const th = i === 0 ? 1 : i === 1 ? Math.min(thick, 2) : thick;
    let y0 = tops[i];
    let y1 = y0 + th - 1;
    if (i > 0) {
      // continuidade: sem buracos entre colunas vizinhas
      if (y0 > pBot + 1) y0 = pBot + 1;
      if (y1 < pTop - 1) y1 = pTop - 1;
    }
    const x = xOuter + dir * i;
    for (let yy = y0; yy <= y1; yy++) L.color(x, yy, light && yy === y1 && y1 > y0 && th > 1 ? light : color);
    pTop = y0;
    pBot = y1;
  }
}

// -----------------------------------------------------------------------------
// Moldes em texto (nariz, boca): cada caractere é um papel
// -----------------------------------------------------------------------------
export type Role = (L: Layer, x: number, y: number) => void;

/** carimba um molde: rows centradas em cx (com âncora na linha `anchor`) */
export function stamp(L: Layer, rows: string[], cx: number, y: number, anchor: number, roles: Record<string, Role>, flip = false): void {
  const w = Math.max(...rows.map((r) => r.length));
  const x0 = Math.round(cx + 0.5 - w / 2);
  rows.forEach((row, r) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[flip ? row.length - 1 - i : i];
      if (ch === '.' || ch === ' ') continue;
      const f = roles[ch];
      if (f) f(L, x0 + i, y + r - anchor);
    }
  });
}

/** papel "tom de pele": só altera o tom (mantém material) */
export function skinTone(tone: number, part: number = P.FACE): Role {
  return (L, x, y) => {
    if (L.part(x, y) !== part && L.part(x, y) !== P.FEAT) return;
    if (L.locked(x, y)) return;
    L.tone(x, y, tone);
  };
}

/** papel "material da pele com tom" (desenhado e travado) */
export function skinLock(mat: number, tone: number): Role {
  return (L, x, y) => {
    if (!L.filled(x, y)) return;
    L.set(x, y, mat, tone, P.FEAT, 1);
  };
}

/** papel "cor fixa" */
export function solidRole(hex: string, part: number = P.FEAT): Role {
  return (L, x, y) => L.color(x, y, hex, part);
}

/** dithering ordenado 2×2 (para meias-tintas) */
export function dith2(x: number, y: number, k: number): boolean {
  const M = [0, 2, 3, 1];
  return (M[(y & 1) * 2 + (x & 1)] + 0.5) / 4 < k;
}

// -----------------------------------------------------------------------------
// Rampas de pele, cabelo e tecido
// -----------------------------------------------------------------------------
/** rampa de pele: sombras para o vermelho-rosado, luzes para o pêssego */
export function skinRamp(skin: string): string[] {
  const [L] = toLch(skin);
  const dark = L < 0.5;
  const mid = L < 0.62;
  const spec: RampSpec = {
    dl: dark ? [-0.15, -0.07, 0.065, 0.14] : mid ? [-0.19, -0.09, 0.055, 0.11] : [-0.21, -0.095, 0.045, 0.085],
    ck: dark ? [1.05, 1.08, 1.0, 0.8] : [1.25, 1.15, 0.88, 0.66],
    hs: 26,
    hl: 10,
    shadowHue: 12,
    lightHue: 78,
  };
  return ramp(skin, spec);
}

/** rampa de cabelo, com brilho mais forte em cabelos escuros */
export function hairRamp(hex: string): string[] {
  const [L, C] = toLch(hex);
  if (L < 0.27) {
    // preto: sombras quase pretas, brilho frio azul-violeta
    return [adjust(hex, -0.09, 1), adjust(hex, -0.045, 1), hex, mixLab(adjust(hex, 0.085, 1), '#3a3a5e', 0.35), mixLab(adjust(hex, 0.2, 0.6), '#6a6c94', 0.5)];
  }
  if (L < 0.36) {
    // castanho escuro: brilho quente-acastanhado
    return ramp(hex, { dl: [-0.11, -0.055, 0.085, 0.19], ck: [1, 1.05, 1.05, 0.85], hs: 14, hl: 16 });
  }
  if (L > 0.78 && C < 0.03) {
    // branco / grisalho claro: sombras lilases
    return ramp(hex, { dl: [-0.26, -0.13, 0.05, 0.09], ck: [1, 1, 1, 1], hs: 0, hl: 0 }).map((c, i) => (i < 2 ? mixLab(c, '#7a74a0', 0.25) : c));
  }
  if (L > 0.6 && C < 0.03) {
    return ramp(hex, { dl: [-0.24, -0.12, 0.08, 0.15], ck: [1, 1, 1, 1] }).map((c, i) => (i < 2 ? mixLab(c, '#6a6890', 0.2) : c));
  }
  return ramp(hex, { dl: [-0.2, -0.1, 0.09, 0.18], ck: [0.95, 1.05, 1, 0.8], hs: 22, hl: 18 });
}

export function clothRamp(hex: string): string[] {
  const [L] = toLch(hex);
  if (L > 0.86) return ramp(hex, { dl: [-0.22, -0.1, 0.03, 0.06], ck: [1, 1, 1, 1], hs: 30, hl: 10 });
  if (L < 0.3) return ramp(hex, { dl: [-0.1, -0.05, 0.07, 0.14], ck: [1, 1, 1, 0.9], hs: 20, hl: 12 });
  return ramp(hex, { dl: [-0.2, -0.1, 0.07, 0.13] });
}

// -----------------------------------------------------------------------------
// Cabelo: mechas com anel de brilho; cachos/crespo em células de Voronoi
// -----------------------------------------------------------------------------
export interface HairPaint {
  /** fonte do fluxo (risca/coroa) */
  src: [number, number];
  /** esfera de luz: cx, cy, rx, ry */
  ball: [number, number, number, number];
  tex: 'strand' | 'smooth' | 'comb';
  clump?: number;
  /** faixa de brilho (distâncias da fonte) */
  band?: [number, number];
  seed?: number;
  /** escurece (cabelo atrás) */
  back?: boolean;
  /** abaixo desta linha os fios caem retos */
  fallY?: number;
  /** variação de tom por mecha (cabelo bagunçado) */
  messy?: boolean;
}

export function hairTone(x: number, y: number, h: HairPaint, mask: Mask): number {
  const [bx, by, brx, bry] = h.ball;
  let [nx, ny, nz] = sphereN(x, y, bx, by, brx, bry);
  const fall = h.fallY !== undefined && y > h.fallY;
  // coordenada da mecha (perpendicular ao fluxo)
  let s: number;
  let r: number;
  if (fall) {
    s = x * 1.0 + (y - (h.fallY ?? 0)) * 0.12 * Math.sign(x + 0.5 - 32);
    r = y;
    // queda: cilindro vertical
    const span = mask.rowSpan(y);
    if (span) {
      const u = (x + 0.5 - (span[0] + span[1] + 1) / 2) / Math.max(2, (span[1] - span[0] + 1) / 2);
      nx = u * 0.7;
      ny = 0.25;
      nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
    }
  } else {
    const dx = x + 0.5 - h.src[0];
    const dy = y + 0.5 - h.src[1];
    r = Math.hypot(dx, dy);
    s = Math.atan2(dx, dy) * 11;
  }
  const cl = h.clump ?? 4;
  const seed = h.seed ?? 1;
  const q = s / cl + Math.sin(r * 0.25 + seed) * 0.12;
  const ci = Math.floor(q);
  const frac = q - ci;
  // tom de base: só a forma (massa lisa); textura = fios finos + anel de brilho
  let I = lit(nx, ny, nz);
  if (h.messy) I += (hash2(ci, 3, seed) - 0.5) * 0.22;
  let t = toneOf(I, [-0.3, 0.17, 0.6, 0.97]);
  // fio de separação fino na borda de cada mecha (não em todas), só nos meios-tons
  if (h.tex !== 'smooth' && frac > 0.84 && t >= 1 && t <= 3 && hash2(ci, 7, seed) < 0.8) t -= 1;
  if (h.tex === 'comb' && frac > 0.4 && frac < 0.55 && I > 0.35) t = Math.min(3, t + 1);
  // faixa de brilho (anel), quebrada nas mechas: cada mecha tem seu comprimento
  if (h.band && !fall) {
    const k = hash2(ci, 5, seed);
    const r0 = h.band[0] + (k - 0.5) * 1.6;
    const r1 = h.band[1] + (hash2(ci, 6, seed) - 0.5) * 2.2;
    if (r > r0 && r < r1 && I > 0.2 && frac > 0.1 && frac < 0.86) t = Math.max(t, I > 0.5 && r > r0 + 0.8 && r < r1 - 0.8 ? 4 : 3);
  }
  if (h.back) t = Math.max(0, t - 1);
  return Math.min(t, 4);
}

export function paintHair(L: Layer, mask: Mask, mat: number, part: number, h: HairPaint): void {
  L.paint(mask, mat, part, (x, y) => hairTone(x, y, h, mask));
}

/** cachos/crespo: células de Voronoi sombreadas como pequenas esferas */
export function paintCurls(L: Layer, mask: Mask, mat: number, part: number, o: { r: number; seed: number; ball: [number, number, number, number]; back?: boolean; centers?: [number, number][] }): [number, number][] {
  const centers = o.centers ?? poissonIn(mask, o.r * 1.55, o.seed);
  const [bx, by, brx, bry] = o.ball;
  L.paint(mask, mat, part, (x, y) => {
    let d1 = 1e9;
    let d2 = 1e9;
    let c1x = 0;
    let c1y = 0;
    for (const [cx, cy] of centers) {
      const d = (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2;
      if (d < d1) {
        d2 = d1;
        d1 = d;
        c1x = cx;
        c1y = cy;
      } else if (d < d2) d2 = d;
    }
    const lx = (x + 0.5 - c1x) / o.r;
    const ly = (y + 0.5 - c1y) / o.r;
    const ll = Math.min(0.95, lx * lx + ly * ly);
    const [gx, gy, gz] = sphereN(x, y, bx, by, brx, bry);
    const nx = lx * 0.75 + gx * 0.55;
    const ny = ly * 0.75 + gy * 0.55;
    const nz = Math.sqrt(1 - ll) * 0.8 + gz * 0.5;
    let t = toneOf(lit(nx, ny, nz), [-0.1, 0.3, 0.66, 0.9]);
    // fronteira entre cachos: sulco escuro do lado de baixo-direita
    const gap = Math.sqrt(d2) - Math.sqrt(d1);
    if (gap < 0.85 && lx + ly > -0.2) t = Math.max(0, t - 1);
    if (o.back) t = Math.max(0, t - 1);
    return t;
  });
  return centers;
}

export function poissonIn(mask: Mask, minD: number, seed: number): [number, number][] {
  const rnd = mulberry(seed * 7919 + 13);
  const pts: [number, number][] = [];
  const cand: [number, number][] = [];
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (mask.get(x, y)) cand.push([x + 0.5, y + 0.5]);
  if (!cand.length) return pts;
  for (let i = 0; i < cand.length * 3; i++) {
    const c = cand[Math.floor(rnd() * cand.length)];
    const p: [number, number] = [c[0] + (rnd() - 0.5) * 0.6, c[1] + (rnd() - 0.5) * 0.6];
    let ok = true;
    for (const q of pts)
      if ((q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 < minD * minD) {
        ok = false;
        break;
      }
    if (ok) pts.push(p);
  }
  return pts;
}

/** silhueta encaracolada: discos nos centros próximos da borda de um volume */
export function curlySilhouette(vol: Mask, r: number, seed: number): { mask: Mask; centers: [number, number][] } {
  const centers = poissonIn(vol, r * 1.55, seed);
  const m = vol.copy();
  for (const [cx, cy] of centers) m.ellipse(cx, cy, r, r);
  return { mask: m, centers };
}

/** máscara da "janela" do rosto abaixo da linha do cabelo (pontos x,y) */
export function belowLine(pts: [number, number][], x0 = 0, x1 = 63): Mask {
  const m = new Mask();
  for (let x = x0; x <= x1; x++) {
    const xc = x + 0.5;
    let y: number;
    if (xc <= pts[0][0]) y = pts[0][1];
    else if (xc >= pts[pts.length - 1][0]) y = pts[pts.length - 1][1];
    else {
      let i = 1;
      while (i < pts.length && pts[i][0] < xc) i++;
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      y = ay + ((by - ay) * (xc - ax)) / Math.max(0.001, bx - ax);
    }
    for (let yy = Math.ceil(y - 0.5); yy < 64; yy++) m.set(x, yy);
  }
  return m;
}
