// =============================================================================
// Kit das fotos de jornal. Cada foto é desenhada numa lona de TONS em pixels
// nativos (0 = tinta chapada, 1 = papel) e só no fim vira retícula ordenada
// (tinta #1b1a17 sobre papel #efe6cf). Regras do kit:
//  - o tom vem da retícula e a forma vem do contraste: assunto claro sobre
//    fundo escuro (ou o contrário), nunca cinza sobre cinza;
//  - os tons de T caem nos níveis limpos da retícula 4×4 (n/16);
//  - detalhe fino é sempre chapado (0 ou 1), para não se desfazer em pontos;
//  - nada de grão nem desfoque; no fim, uma "nitidez de clichê" (máscara de
//    desfocagem) reforça bordas, como nas fotos de jornal de cidade pequena.
// Puro: importar em Node é seguro.
// =============================================================================
import { Pix, mulberry, BAYER4 } from './pix';
import { drawText, type TextOpts } from './font';

/** quadro nativo das fotos (a Gazeta mostra em ×2) */
export const NEWS_W = 144;
export const NEWS_H = 96;

/** tons de referência (fração de papel), nos níveis limpos da retícula */
export const T = {
  ink: 0,
  black: 0.125,
  dark: 0.25,
  dim: 0.375,
  mid: 0.5,
  soft: 0.625,
  light: 0.75,
  pale: 0.875,
  paper: 1,
} as const;

export type Pt = [number, number];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Lona de tons em pixels nativos. */
export class Tone {
  readonly w: number;
  readonly h: number;
  readonly d: Float32Array;
  constructor(w = NEWS_W, h = NEWS_H, v = 1) {
    this.w = w;
    this.h = h;
    this.d = new Float32Array(w * h).fill(v);
  }

  get(x: number, y: number): number {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 1;
    return this.d[y * this.w + x];
  }

  /** pinta um pixel; a < 1 mistura com o que já está lá */
  set(x: number, y: number, v: number, a = 1): void {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    this.d[i] = a >= 1 ? v : this.d[i] + (v - this.d[i]) * a;
  }

  /** multiplica o pixel (f < 1 escurece) */
  mul(x: number, y: number, f: number): void {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    this.d[i] = clamp01(this.d[i] * f);
  }

  fill(v: number): this {
    this.d.fill(v);
    return this;
  }

  rect(x: number, y: number, w: number, h: number, v: number, a = 1): this {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = Math.round(x + w);
    const y1 = Math.round(y + h);
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) this.set(xx, yy, v, a);
    return this;
  }

  /** escurece um retângulo multiplicando (sombra sobre o que já existe) */
  mulRect(x: number, y: number, w: number, h: number, f: number): this {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = Math.round(x + w);
    const y1 = Math.round(y + h);
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) this.mul(xx, yy, f);
    return this;
  }

  /** contorno de 1px */
  frame(x: number, y: number, w: number, h: number, v: number): this {
    this.rect(x, y, w, 1, v).rect(x, y + h - 1, w, 1, v).rect(x, y, 1, h, v).rect(x + w - 1, y, 1, h, v);
    return this;
  }

  vgrad(x: number, y: number, w: number, h: number, v0: number, v1: number): this {
    const y0 = Math.round(y);
    const y1 = Math.round(y + h);
    for (let yy = y0; yy < y1; yy++) {
      const k = (yy - y0) / Math.max(1, y1 - y0 - 1);
      this.rect(x, yy, w, 1, v0 + (v1 - v0) * k);
    }
    return this;
  }

  hgrad(x: number, y: number, w: number, h: number, v0: number, v1: number): this {
    const x0 = Math.round(x);
    const x1 = Math.round(x + w);
    for (let xx = x0; xx < x1; xx++) {
      const k = (xx - x0) / Math.max(1, x1 - x0 - 1);
      this.rect(xx, y, 1, h, v0 + (v1 - v0) * k);
    }
    return this;
  }

  /** varre um polígono chamando fn(x,y) em cada pixel interno (centro do pixel) */
  scan(pts: Pt[], fn: (x: number, y: number) => void): void {
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
      for (let i = 0; i + 1 < xs.length; i += 2)
        for (let x = Math.ceil(xs[i] - 0.5); x <= Math.floor(xs[i + 1] - 0.5); x++) fn(x, y);
    }
  }

  poly(pts: Pt[], v: number, a = 1): this {
    this.scan(pts, (x, y) => this.set(x, y, v, a));
    return this;
  }

  /** contorno interno de 1px de um polígono (borda da silhueta) */
  polyEdge(pts: Pt[], v: number): this {
    const m = new Uint8Array(this.w * this.h);
    this.scan(pts, (x, y) => {
      if (x >= 0 && y >= 0 && x < this.w && y < this.h) m[y * this.w + x] = 1;
    });
    const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < this.w && y < this.h && m[y * this.w + x] === 1;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (inside(x, y) && (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1))) this.set(x, y, v);
    return this;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, v: number, a = 1): this {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, v, a);
      }
    return this;
  }

  /** elipse que multiplica (sombra) */
  mulEllipse(cx: number, cy: number, rx: number, ry: number, f: number): this {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.mul(x, y, f);
      }
    return this;
  }

  /** volume arredondado com luz de cima-esquerda (tom base v ± light) */
  ball(cx: number, cy: number, rx: number, ry: number, v: number, light = 0.3): this {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        const r = dx * dx + dy * dy;
        if (r > 1) continue;
        this.set(x, y, clamp01(v + (-dx * 0.55 - dy * 0.75) * light));
      }
    return this;
  }

  /** anel de espessura th */
  ring(cx: number, cy: number, r: number, th: number, v: number): this {
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= r && d > r - th) this.set(x, y, v);
      }
    return this;
  }

  /** linha com pincel quadrado de largura w */
  line(x0: number, y0: number, x1: number, y1: number, v: number, w = 1, a = 1): this {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    const off = Math.floor((w - 1) / 2);
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n);
      const y = Math.round(y0 + ((y1 - y0) * i) / n);
      for (let dy = 0; dy < w; dy++) for (let dx = 0; dx < w; dx++) this.set(x + dx - off, y + dy - off, v, a);
    }
    return this;
  }

  /** brilho/sombra radial: puxa o tom para v com força a no centro, caindo até a borda */
  radial(cx: number, cy: number, rx: number, ry: number, v: number, a: number): this {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r >= 1) continue;
        this.set(x, y, v, a * (1 - r) * (1 - r));
      }
    return this;
  }

  /** texto na fonte 3×5 do jogo, chapado no tom v (halo: tom do contorno de 1px) */
  text(str: string, x: number, y: number, v: number, o: Pick<TextOpts, 'align' | 'scale' | 'spacing'> & { halo?: number } = {}): this {
    const base = { align: o.align, scale: o.scale, spacing: o.spacing };
    const p = new Pix(this.w, this.h);
    drawText(p, str, x, y, '#000000', base);
    let halo: Pix | null = null;
    if (o.halo !== undefined) {
      halo = new Pix(this.w, this.h);
      drawText(halo, str, x, y, '#000000', { ...base, outline: '#000000' });
    }
    for (let i = 0; i < p.data.length; i++) {
      const xx = i % this.w;
      const yy = (i / this.w) | 0;
      if (p.data[i] >>> 24) this.set(xx, yy, v);
      else if (halo && o.halo !== undefined && halo.data[i] >>> 24) this.set(xx, yy, o.halo);
    }
    return this;
  }

  /** "nitidez de clichê": v += k·(v − média 3×3); reforça bordas e silhuetas */
  sharpen(k = 0.5): this {
    const src = this.d.slice();
    const w = this.w;
    const h = this.h;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let s = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            s += src[yy * w + xx];
            n++;
          }
        }
        const v = src[y * w + x];
        this.d[y * w + x] = clamp01(v + k * (v - s / n));
      }
    return this;
  }

}

// -----------------------------------------------------------------------------
// Retícula ordenada 4×4: tinta se tom < limiar. Um tom n/16 acende n pontos.
// -----------------------------------------------------------------------------
export function screenThreshold(x: number, y: number): number {
  return 1 - (BAYER4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
}

/** imprime a lona em tinta sobre papel */
export function printTone(t: Tone, ink: string, paper: string): Pix {
  const p = new Pix(t.w, t.h);
  const inkC = p.c(ink);
  const papC = p.c(paper);
  for (let y = 0; y < t.h; y++)
    for (let x = 0; x < t.w; x++) p.raw(x, y, t.d[y * t.w + x] < screenThreshold(x, y) ? inkC : papC);
  return p;
}

// -----------------------------------------------------------------------------
// Referencial local (objetos de perfil espelháveis): u para a frente, v para
// cima a partir do chão. Um pixel local (u, v) cobre [u, u+1) × [v, v+1).
// -----------------------------------------------------------------------------
export class Local {
  constructor(
    readonly t: Tone,
    readonly x0: number,
    readonly y0: number,
    readonly dir: 1 | -1 = 1,
  ) {}
  X(u: number): number {
    return this.dir > 0 ? this.x0 + u : this.x0 - u;
  }
  Y(v: number): number {
    return this.y0 - v;
  }
  P(u: number, v: number): Pt {
    return [this.X(u), this.Y(v)];
  }
  /** retângulo u ∈ [u0,u1), v ∈ [v0,v1) */
  rect(u0: number, v0: number, u1: number, v1: number, tone: number): this {
    const xa = this.dir > 0 ? this.x0 + u0 : this.x0 - u1;
    this.t.rect(xa, this.y0 - v1, u1 - u0, v1 - v0, tone);
    return this;
  }
  poly(pts: Pt[], tone: number): this {
    this.t.poly(
      pts.map(([u, v]) => this.P(u, v)),
      tone,
    );
    return this;
  }
  edge(pts: Pt[], tone: number): this {
    this.t.polyEdge(
      pts.map(([u, v]) => this.P(u, v)),
      tone,
    );
    return this;
  }
  ellipse(u: number, v: number, ru: number, rv: number, tone: number): this {
    this.t.ellipse(this.X(u), this.Y(v), ru, rv, tone);
    return this;
  }
  line(u0: number, v0: number, u1: number, v1: number, tone: number, w = 1): this {
    this.t.line(this.X(u0), this.Y(v0), this.X(u1), this.Y(v1), tone, w);
    return this;
  }
  /** caixa de roda: disco cortado no chão (só pinta v ≥ vMin) */
  arch(u: number, v: number, r: number, tone: number, vMin: number): this {
    const cx = this.X(u);
    const cy = this.Y(v);
    const yMax = this.Y(vMin);
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
      if (y + 0.5 > yMax) continue;
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++)
        if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) this.t.set(x, y, tone);
    }
    return this;
  }
  /** texto (nunca espelhado), centrado em u, topo das letras em v */
  text(str: string, u: number, vTop: number, tone: number): this {
    this.t.text(str, this.dir > 0 ? this.x0 + u : this.x0 - u, this.y0 - vTop, tone, { align: 'center' });
    return this;
  }
}

// -----------------------------------------------------------------------------
// Pessoas: montadas numa figurinha própria (grade inteira, fundo vazio) e
// carimbadas na lona, com contorno opcional. Proporção de foto, mas cabeça
// generosa (≥ 3×4 px) e antebraço cor de pele para o braço não sumir no tronco.
// -----------------------------------------------------------------------------
export type Pose = 'stand' | 'walk' | 'armUp' | 'armsUp' | 'phone' | 'point' | 'carry' | 'hip' | 'cross' | 'wave';

export interface PersonOpts {
  pose?: Pose;
  /** lado para onde a pessoa se volta (braço que aponta/levanta, aba do boné) */
  dir?: 1 | -1;
  shirt?: number;
  pants?: number;
  skin?: number;
  hair?: number;
  hat?: 'cap' | 'helmet' | 'cowboy' | 'hard' | 'none';
  /** vestido/saia até o joelho */
  dress?: boolean;
  /** faixas refletivas (socorrista, bombeiro) */
  vest?: boolean;
  /** silhueta chapada num tom só (gente contra a luz) */
  flat?: number;
  longHair?: boolean;
  /** manga comprida (braço inteiro na cor da camisa) */
  sleeves?: boolean;
  /** contorno externo de 1px neste tom */
  edge?: number;
}

/** figurinha: buffer de tons com transparência (NaN), origem nos pés */
export class Fig {
  readonly w: number;
  readonly h: number;
  readonly d: Float32Array;
  /** coluna do centro e linha logo abaixo dos pés */
  readonly ox: number;
  readonly oy: number;
  constructor(w: number, h: number, ox: number, oy: number) {
    this.w = w;
    this.h = h;
    this.ox = ox;
    this.oy = oy;
    this.d = new Float32Array(w * h).fill(NaN);
  }
  /** (dx, dy) relativos aos pés: dx para a frente, dy negativo para cima */
  set(dx: number, dy: number, v: number): void {
    const x = Math.floor(this.ox + dx);
    const y = Math.floor(this.oy + dy);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = v;
  }
  rect(dx: number, dy: number, w: number, h: number, v: number): void {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) this.set(dx + x, dy + y, v);
  }
  line(x0: number, y0: number, x1: number, y1: number, v: number, w = 1): void {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n);
      const y = Math.round(y0 + ((y1 - y0) * i) / n);
      this.rect(x - Math.floor((w - 1) / 2), y, w, 1, v);
    }
  }
  /** elipse inscrita no retângulo (dx, dy, w, h) */
  oval(dx: number, dy: number, w: number, h: number, v: number): void {
    const cx = dx + w / 2;
    const cy = dy + h / 2;
    for (let y = dy; y < dy + h; y++)
      for (let x = dx; x < dx + w; x++) {
        const ex = (x + 0.5 - cx) / (w / 2);
        const ey = (y + 0.5 - cy) / (h / 2);
        if (ex * ex + ey * ey <= 1.15) this.set(x, y, v);
      }
  }
  poly(pts: Pt[], v: number): void {
    const tmp = new Tone(this.w, this.h, -1);
    tmp.poly(
      pts.map(([x, y]) => [this.ox + x, this.oy + y] as Pt),
      2,
    );
    for (let i = 0; i < tmp.d.length; i++) if (tmp.d[i] === 2) this.d[i] = v;
  }
  /** carimba na lona com os pés em (x, y); dir −1 espelha */
  stamp(t: Tone, x: number, y: number, dir: 1 | -1 = 1, edge?: number): void {
    x = Math.round(x);
    y = Math.round(y);
    const at = (i: number, j: number) => (i < 0 || j < 0 || i >= this.w || j >= this.h ? NaN : this.d[j * this.w + i]);
    const tx = (i: number) => (dir > 0 ? x + (i - this.ox) : x - (i - this.ox));
    if (edge !== undefined)
      for (let j = -1; j <= this.h; j++)
        for (let i = -1; i <= this.w; i++) {
          if (!Number.isNaN(at(i, j))) continue;
          if (!Number.isNaN(at(i - 1, j)) || !Number.isNaN(at(i + 1, j)) || !Number.isNaN(at(i, j - 1)) || !Number.isNaN(at(i, j + 1)))
            t.set(tx(i), y + (j - this.oy), edge);
        }
    for (let j = 0; j < this.h; j++)
      for (let i = 0; i < this.w; i++) {
        const v = this.d[j * this.w + i];
        if (!Number.isNaN(v)) t.set(tx(i), y + (j - this.oy), v);
      }
  }
}

/** medidas inteiras de uma pessoa de altura h */
function bodyDims(h: number) {
  const hw = Math.max(3, Math.round(h / 7.2)); // largura da cabeça
  const hh = Math.max(4, Math.round(h / 6.3)); // altura da cabeça
  const sw = Math.max(hw + 2, Math.round(h * 0.29) | 1); // ombros (ímpar)
  const neck = h >= 20 ? 1 : 0;
  const hipY = -Math.round(h * 0.47); // linha do quadril (relativa aos pés)
  const aw = h >= 34 ? 2 : 1; // largura do braço
  return { hw, hh, sw, neck, hipY, aw };
}

/** monta a figurinha de uma pessoa em pé */
export function personFig(h: number, o: PersonOpts = {}): Fig {
  h = Math.max(6, Math.round(h));
  const { hw, hh, sw, neck, hipY, aw } = bodyDims(h);
  const flat = o.flat;
  const skin = flat ?? o.skin ?? T.pale;
  const shirt = flat ?? o.shirt ?? T.light;
  const pants = flat ?? o.pants ?? T.dark;
  const hair = flat ?? o.hair ?? T.ink;
  const pose = o.pose ?? 'stand';
  const reach = Math.ceil(h * 0.5) + 4;
  const f = new Fig(reach * 2 + 1, h + Math.ceil(h * 0.3) + 4, reach, h + Math.ceil(h * 0.3) + 2);
  const top = -h;
  const hx = -Math.floor(hw / 2); // coluna esquerda da cabeça
  const shY = top + hh + neck; // topo dos ombros
  const sx = -Math.floor(sw / 2);
  const hipW = Math.max(3, sw - (h >= 24 ? 4 : 2));
  const hipX = -Math.floor(hipW / 2);
  const legW = Math.max(1, Math.floor((hipW - (h >= 14 ? 1 : 0)) / 2));
  // pernas
  if (o.dress) {
    const knee = -Math.round(h * 0.2);
    f.poly([[hipX, hipY], [hipX + hipW, hipY], [hipX + hipW + 1, knee], [hipX - 1, knee]], shirt);
    f.rect(hipX + 1, knee, Math.max(1, legW - 1), -knee, skin);
    f.rect(hipX + hipW - Math.max(1, legW - 1) - 1, knee, Math.max(1, legW - 1), -knee, skin);
  } else if (pose === 'walk') {
    const sp = Math.max(2, Math.round(h * 0.1));
    f.poly([[hipX, hipY], [hipX + legW, hipY], [hipX + legW - sp, 0], [hipX - sp, 0]], pants);
    f.poly([[hipX + hipW - legW, hipY], [hipX + hipW, hipY], [hipX + hipW + sp, 0], [hipX + hipW - legW + sp, 0]], pants);
  } else {
    f.rect(hipX, hipY, legW, -hipY, pants);
    f.rect(hipX + hipW - legW, hipY, legW, -hipY, pants);
    if (h >= 14) f.rect(hipX, hipY, hipW, Math.max(1, Math.round(h * 0.06)), pants);
  }
  if (h >= 16 && !o.dress) {
    f.rect(hipX - (pose === 'walk' ? Math.max(2, Math.round(h * 0.1)) : 0), -1, legW + 1, 1, flat ?? T.ink);
    f.rect(hipX + hipW - legW + (pose === 'walk' ? Math.max(2, Math.round(h * 0.1)) : 0), -1, legW + 1, 1, flat ?? T.ink);
  }
  // tronco (afunila até o quadril)
  const torsoH = hipY - shY + 1;
  for (let r = 0; r < torsoH; r++) {
    const k = r / Math.max(1, torsoH - 1);
    // ombro arredondado na primeira linha
    const w = r === 0 && h >= 16 ? sw - 2 : Math.round(sw - (sw - hipW) * k);
    f.rect(-Math.floor(w / 2), shY + r, w, 1, shirt);
  }
  if (o.vest && flat === undefined) {
    f.rect(sx + 1, shY + Math.round(torsoH * 0.45), sw - 2, 1, T.paper);
    if (h >= 26) f.rect(hipX, hipY + 2, hipW, 1, T.paper);
  }
  // braços: manga curta (cor da camisa) + antebraço de pele
  const armTone = (seg: number, n: number) => (o.sleeves || seg < Math.max(2, Math.round(n * 0.35)) ? shirt : skin);
  const arm = (side: 1 | -1, pts: Pt[]) => {
    // side: −1 = lado de trás (esquerda da figura), 1 = lado da frente
    const sxp = side < 0 ? sx : sx + sw - aw;
    let px = sxp;
    let py = shY + (h >= 24 ? 1 : 0);
    let total = 0;
    for (const [ex, ey] of pts) total += Math.max(Math.abs(ex - px), Math.abs(ey - py));
    let seg = 0;
    for (const [ex, ey] of pts) {
      const n = Math.max(1, Math.max(Math.abs(ex - px), Math.abs(ey - py)));
      for (let i = 0; i <= n; i++) {
        const x = Math.round(px + ((ex - px) * i) / n);
        const y = Math.round(py + ((ey - py) * i) / n);
        f.rect(x, y, aw, 1, armTone(seg + i, total));
      }
      seg += n;
      px = ex;
      py = ey;
    }
  };
  const L = sx - (h >= 24 ? 1 : 0); // braço solto, fora do tronco
  const R = sx + sw - aw + (h >= 24 ? 1 : 0);
  const hand = hipY + Math.round(h * 0.04);
  const hang = (side: 1 | -1) => arm(side, [[side < 0 ? L : R, hand]]);
  const up = top - Math.round(h * 0.08);
  switch (pose) {
    case 'armUp':
      hang(-1);
      arm(1, [[R + Math.round(h * 0.08), up]]);
      break;
    case 'armsUp':
      arm(-1, [[L - Math.round(h * 0.1), up]]);
      arm(1, [[R + Math.round(h * 0.1), up]]);
      break;
    case 'wave':
      hang(-1);
      arm(1, [[R + Math.round(h * 0.12), shY - Math.round(h * 0.02)], [R + Math.round(h * 0.16), top]]);
      break;
    case 'phone':
      hang(-1);
      arm(1, [[R, shY + Math.round(h * 0.14)], [hx + hw, top + Math.round(hh * 0.6)]]);
      break;
    case 'point':
      hang(-1);
      arm(1, [[R + Math.round(h * 0.3), shY + 1]]);
      break;
    case 'carry':
      arm(-1, [[L + Math.round(h * 0.12), hipY - 1]]);
      arm(1, [[R + Math.round(h * 0.14), hipY - 1]]);
      break;
    case 'hip':
      arm(-1, [[L - Math.round(h * 0.06), shY + Math.round(h * 0.12)], [hipX, hipY - 1]]);
      arm(1, [[R + Math.round(h * 0.06), shY + Math.round(h * 0.12)], [hipX + hipW - aw, hipY - 1]]);
      break;
    case 'cross':
      f.rect(sx, shY + Math.round(torsoH * 0.35), sw, Math.max(1, aw), skin);
      f.rect(sx, shY + Math.round(torsoH * 0.35) + aw, sw, 1, shirt);
      break;
    default:
      hang(-1);
      hang(1);
  }
  // pescoço e cabeça
  if (neck) f.rect(-Math.floor(Math.max(1, hw - 2) / 2), shY - 1, Math.max(1, hw - 2), 1, skin);
  f.oval(hx, top, hw, hh, skin);
  if (flat === undefined) {
    const hairRows = Math.max(1, Math.round(hh * 0.35));
    f.oval(hx, top, hw, hairRows * 2, hair);
    f.rect(hx, top + hairRows, hw, hh - hairRows, skin);
    if (h >= 22) f.rect(hx, top + hairRows, 1, Math.max(1, Math.round(hh * 0.3)), hair);
    if (o.longHair) {
      f.rect(hx - 1, top + 1, 1, hh + 1, hair);
      f.rect(hx + hw, top + 1, 1, hh + 1, hair);
      f.rect(hx, top + hh - 1, hw, 2, hair);
      f.rect(hx + 1, top + hairRows, hw - 2, hh - hairRows - 1, skin);
    }
    // lado da sombra do rosto (luz da esquerda)
    if (h >= 26) f.rect(hx + hw - 1, top + hairRows, 1, hh - hairRows, Math.max(0, skin - 0.25));
  }
  const hv = flat ?? T.ink;
  switch (o.hat) {
    case 'cap':
      f.oval(hx, top - 1, hw, Math.max(2, Math.round(hh * 0.6)), hv);
      f.rect(hx + Math.floor(hw / 2), top + Math.max(1, Math.round(hh * 0.3)) - 1, hw, 1, hv);
      break;
    case 'helmet':
      f.oval(hx - 1, top - 1, hw + 2, Math.max(3, Math.round(hh * 0.8)), flat ?? T.paper);
      f.rect(hx - 1, top - 1 + Math.max(3, Math.round(hh * 0.8)) - 1, hw + 2, 1, flat ?? T.dim);
      break;
    case 'hard':
      f.oval(hx, top - 1, hw, Math.max(2, Math.round(hh * 0.6)), flat ?? T.paper);
      f.rect(hx - 1, top - 1 + Math.max(2, Math.round(hh * 0.6)) - 1, hw + 2, 1, flat ?? T.paper);
      break;
    case 'cowboy':
      f.rect(hx - Math.max(1, Math.round(hw * 0.5)), top + Math.max(1, Math.round(hh * 0.3)) - 1, hw + 2 * Math.max(1, Math.round(hw * 0.5)), 1, hv);
      f.oval(hx, top - Math.max(1, Math.round(hh * 0.35)), hw, Math.max(2, Math.round(hh * 0.65)), hv);
      break;
  }
  return f;
}

/** pessoa em pé, pés (centro) em (x, y), altura h */
export function person(t: Tone, x: number, y: number, h: number, o: PersonOpts = {}): void {
  personFig(h, o).stamp(t, x, y, o.dir ?? 1, o.edge);
}

/** fileira de gente entre x0 e x1, pés em y */
export function crowd(
  t: Tone,
  x0: number,
  x1: number,
  y: number,
  h: number,
  seed: number,
  o: { tone?: number; vary?: number; spacing?: number; arms?: number; hats?: number; flat?: boolean; edge?: number } = {},
): void {
  const r = mulberry(seed);
  const sp = o.spacing ?? h * 0.34;
  for (let x = x0; x < x1; x += sp * (0.75 + r() * 0.5)) {
    const hh = h * (0.88 + r() * 0.2);
    const tone = (o.tone ?? T.dark) + (r() - 0.5) * (o.vary ?? 0.2);
    const pose: Pose = r() < (o.arms ?? 0) ? (r() < 0.5 ? 'armUp' : 'armsUp') : 'stand';
    const hat = r() < (o.hats ?? 0) ? 'cowboy' : 'none';
    const d: 1 | -1 = r() < 0.5 ? 1 : -1;
    const yy = y + Math.round(r() * 2);
    if (o.flat) person(t, x, yy, hh, { flat: clamp01(tone), pose, dir: d, hat, edge: o.edge });
    else
      person(t, x, yy, hh, {
        shirt: clamp01(tone + 0.25 + r() * 0.4),
        pants: clamp01(tone - 0.1),
        skin: clamp01(tone + 0.35),
        hair: clamp01(tone - 0.2),
        pose,
        dir: d,
        hat,
        edge: o.edge,
      });
  }
}

// -----------------------------------------------------------------------------
// Ambulâncias (furgão de teto alto, branco, faixa escura)
// -----------------------------------------------------------------------------
export interface VanOpts {
  /** frente para a direita (1) ou para a esquerda (-1) */
  dir?: 1 | -1;
  /** escrever REGULAÇÃO na lateral (só a grande) */
  label?: boolean;
  /** giroflex aceso */
  flash?: boolean;
  /** portas traseiras abertas */
  doorsOpen?: boolean;
}

/** roda vista de lado (centro local u, v) */
function localWheel(L: Local, u: number, v: number, r: number): void {
  L.ellipse(u, v, r, r, T.ink);
  L.ellipse(u, v, r * 0.5, r * 0.5, T.dim);
  L.ellipse(u, v, Math.max(0.8, r * 0.18), Math.max(0.8, r * 0.18), T.pale);
}

/**
 * Ambulância grande de perfil (≈ 82×44). (x, y) = chão sob a traseira; com
 * dir = -1 ela se estende para a esquerda de x.
 */
export function ambulanceL(t: Tone, x: number, y: number, o: VanOpts = {}): void {
  const L = new Local(t, x, y, o.dir ?? 1);
  // sombra no chão
  L.rect(-3, -2, 86, 0, T.ink);
  t.mulRect(L.dir > 0 ? x - 6 : x - 92, y + 2, 98, 2, 0.6);
  const body: Pt[] = [[0, 5], [0, 39], [2, 41], [56, 41], [59, 40], [61, 37], [70, 23], [78, 20], [81, 17], [82, 14], [82, 5]];
  L.poly(body, T.paper);
  L.rect(0, 5, 82, 8, T.pale);
  // faixa e filete
  L.rect(0, 12, 80, 18, T.dark);
  L.rect(0, 18, 78, 19, T.ink);
  // para-brisa visto de lado (faixa escura na rampa), coluna e janela da porta
  L.poly([[59, 37.5], [61.5, 37.5], [70.5, 23], [68, 23]], T.ink);
  L.poly([[55, 36], [57.5, 36], [65.5, 24], [55, 24]], T.black);
  L.poly([[56, 34], [57.5, 34], [56, 31]], T.mid);
  // portas, puxadores, retrovisor
  L.rect(54, 7, 55, 37, T.dim);
  L.rect(56, 20, 59, 21, T.ink);
  L.rect(30, 7, 31, 38, T.dim);
  L.rect(32, 20, 35, 21, T.ink);
  L.rect(69, 24, 72, 28, T.ink);
  // farol, para-choques, lanterna
  L.rect(79, 13, 82, 16, T.paper);
  L.rect(78, 4, 83, 8, T.black);
  L.rect(-1, 4, 2, 8, T.black);
  L.rect(0, 22, 2, 30, T.dark);
  // cruz e letreiro
  L.rect(8, 25, 11, 34, T.ink);
  L.rect(5, 28, 14, 31, T.ink);
  if (o.label) L.text('REGULAÇÃO', 34.5, 30, T.ink);
  // contorno da silhueta
  L.edge(body, T.black);
  // caixas de roda e rodas
  L.arch(15.5, 5, 8.5, T.ink, 1);
  L.arch(64.5, 5, 8.5, T.ink, 1);
  localWheel(L, 15.5, 6, 6);
  localWheel(L, 64.5, 6, 6);
  // giroflex: base preta, lâmpada acesa e apagada
  L.rect(45, 41, 59, 44, T.ink);
  L.rect(46, 42, 51, 44, T.paper);
  L.rect(53, 42, 58, 44, T.mid);
  if (o.doorsOpen) {
    L.poly([[-11, 7], [0, 7], [0, 39], [-11, 37]], T.pale);
    L.edge([[-11, 7], [0, 7], [0, 39], [-11, 37]], T.black);
    L.rect(-1, 8, 0, 38, T.ink);
  }
  if (o.flash) flash(t, L.X(48.5), L.Y(43), 8);
}

/** ambulância pequena de perfil (≈ 54×30) */
export function ambulanceS(t: Tone, x: number, y: number, o: VanOpts = {}): void {
  const L = new Local(t, x, y, o.dir ?? 1);
  L.rect(-2, -1, 56, 0, T.ink);
  const body: Pt[] = [[0, 4], [0, 26], [1, 28], [37, 28], [39, 27], [41, 25], [46, 16], [51, 14], [53, 12], [54, 10], [54, 4]];
  L.poly(body, T.paper);
  L.rect(0, 4, 54, 6, T.pale);
  L.rect(0, 9, 52, 12, T.dark);
  L.rect(0, 12, 51, 13, T.ink);
  L.poly([[39.5, 25.5], [41.5, 25.5], [46.5, 16], [44.5, 16]], T.ink);
  L.poly([[36, 24], [38.5, 24], [43, 17], [36, 17]], T.black);
  L.rect(35, 6, 36, 25, T.dim);
  L.rect(45, 17, 47, 20, T.ink);
  L.rect(51, 3, 55, 6, T.black);
  L.rect(-1, 3, 1, 6, T.black);
  L.rect(8, 15, 10, 24, T.ink);
  L.rect(5, 18, 13, 20, T.ink);
  L.edge(body, T.black);
  L.arch(10.5, 4, 5.5, T.ink, 1);
  L.arch(43.5, 4, 5.5, T.ink, 1);
  localWheel(L, 10.5, 4, 4);
  localWheel(L, 43.5, 4, 4);
  L.rect(29, 28, 39, 30, T.ink);
  L.rect(30, 28, 33, 30, T.paper);
  if (o.doorsOpen) {
    L.poly([[-7, 5], [0, 5], [0, 26], [-7, 24]], T.pale);
    L.edge([[-7, 5], [0, 5], [0, 26], [-7, 24]], T.black);
  }
  if (o.flash) flash(t, L.X(31.5), L.Y(29.5), 6);
}

/** clarão de giroflex/flash: halo curto, raios brancos e miolo chapado */
export function flash(t: Tone, cx: number, cy: number, r: number): void {
  t.radial(cx, cy, r * 1.1, r * 0.8, 1, 0.9);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const len = i % 2 ? r * 0.55 : r;
    t.line(cx, cy, cx + Math.cos(a) * len * 1.2, cy + Math.sin(a) * len * 0.75, T.paper);
  }
  t.ellipse(cx, cy, Math.max(1.5, r * 0.22), Math.max(1.2, r * 0.17), T.paper);
}

/** viatura de polícia de perfil (≈ 46×23): branca, POLÍCIA na porta, giroflex */
export function policeCar(t: Tone, x: number, y: number, dir: 1 | -1 = 1, lit = true): void {
  const L = new Local(t, x, y, dir);
  L.rect(-1, -1, 47, 0, T.ink);
  const body: Pt[] = [[0, 4], [0, 13], [8, 14], [13, 21], [32, 21], [38, 14], [46, 12], [46, 4]];
  L.poly(body, T.paper);
  L.rect(0, 4, 46, 6, T.pale);
  L.poly([[14, 20], [22, 20], [22, 15], [11, 15]], T.black);
  L.poly([[23.5, 20], [31, 20], [35, 15], [23.5, 15]], T.black);
  L.rect(0, 5, 46, 7, T.ink);
  L.text('POLÍCIA', 24, 11, T.ink);
  L.edge(body, T.ink);
  L.arch(9.5, 4, 4.5, T.ink, 1);
  L.arch(36.5, 4, 4.5, T.ink, 1);
  localWheel(L, 9.5, 4, 3.6);
  localWheel(L, 36.5, 4, 3.6);
  L.rect(17, 21, 29, 23, T.dark);
  L.rect(18, 21, 21, 23, T.paper);
  L.rect(25, 21, 28, 23, T.black);
  if (lit) flash(t, L.X(19.5), L.Y(22.5), 8);
}

// -----------------------------------------------------------------------------
// Cidade
// -----------------------------------------------------------------------------
/** grade de janelas (lit: fração acesa com tom litV) */
export function windows(t: Tone, x: number, y: number, cols: number, rows: number, w: number, h: number, gx: number, gy: number, v: number, seed = 1, lit = 0, litV: number = T.paper): void {
  const r = mulberry(seed);
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) t.rect(x + j * (w + gx), y + i * (h + gy), w, h, r() < lit ? litV : v);
}

/** copa de árvore em tufos (estrutura, não ruído) */
export function treeCrown(t: Tone, cx: number, cy: number, rx: number, ry: number, v: number, seed: number, light = 0.18): void {
  const r = mulberry(seed);
  t.ellipse(cx, cy, rx, ry, v);
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2;
    const d = 0.55 + r() * 0.35;
    const br = Math.min(rx, ry) * (0.3 + r() * 0.25);
    t.ball(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, br * 1.1, br, v, light);
  }
  t.ball(cx - rx * 0.2, cy - ry * 0.25, rx * 0.45, ry * 0.4, v + light * 0.4, light);
}

/** fita zebrada de isolamento entre dois pontos (faixas alternadas) */
export function tape(t: Tone, x0: number, y0: number, x1: number, y1: number, w = 3): void {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = y0 + ((y1 - y0) * i) / n;
    for (let k = 0; k < w; k++) t.set(x, y + k, (Math.floor(i + k) >> 2) & 1 ? T.ink : T.paper);
  }
}

/** chuva: riscos claros diagonais (alfa a) */
export function rain(t: Tone, seed: number, n: number, a = 0.6, v: number = T.paper): void {
  const r = mulberry(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * (t.w + 10);
    const y = r() * t.h;
    t.line(x, y, x - 2, y + 5, v, 1, a);
  }
}

/** barras verticais (grade, portão) de x0 a x1, tom v */
export function bars(t: Tone, x0: number, y0: number, x1: number, y1: number, gap: number, v: number, w = 1): void {
  for (let x = x0; x <= x1; x += gap) t.rect(x, y0, w, y1 - y0, v);
}

/** telhado de telha colonial: fileiras onduladas com sombra embaixo de cada uma */
export function roofTiles(t: Tone, x: number, y: number, w: number, h: number, base: number = T.dark, seed = 1): void {
  const r = mulberry(seed);
  t.rect(x, y, w, h, base);
  for (let yy = y + 1; yy < y + h; yy += 3) {
    const ph = Math.floor(r() * 4);
    for (let xx = x; xx < x + w; xx++) if ((xx + ph) % 4 === 0) t.rect(xx, yy, 1, 2, T.ink);
    t.rect(x, yy + 2, w, 1, T.black);
  }
}

/** treliça de palco/torre: duas barras com zigue-zague entre (horizontal) */
export function truss(t: Tone, x0: number, y: number, x1: number, h: number, v: number = T.ink, step = 6): void {
  t.rect(x0, y, x1 - x0, 1, v).rect(x0, y + h - 1, x1 - x0, 1, v);
  for (let x = x0, up = true; x < x1; x += step, up = !up) t.line(x, up ? y : y + h - 1, Math.min(x1, x + step), up ? y + h - 1 : y, v);
}

/** treliça vertical */
export function trussV(t: Tone, x: number, y0: number, y1: number, w: number, v: number = T.ink, step = 6): void {
  t.rect(x, y0, 1, y1 - y0, v).rect(x + w - 1, y0, 1, y1 - y0, v);
  for (let y = y0, l = true; y < y1; y += step, l = !l) t.line(l ? x : x + w - 1, y, l ? x + w - 1 : x, Math.min(y1, y + step), v);
}

/** palmeira: tronco curvo e folhas em leque */
export function palm(t: Tone, x: number, y: number, h: number, v: number = T.ink): void {
  for (let i = 0; i < h; i++) {
    const k = i / h;
    t.rect(x + Math.round(Math.sin(k * 1.4) * h * 0.12), y - i, k < 0.8 ? 3 : 2, 1, v);
  }
  const tx = x + Math.round(Math.sin(1.4) * h * 0.12) + 1;
  const ty = y - h;
  for (const [dx, dy] of [[-14, 4], [-12, -3], [-6, -8], [5, -9], [12, -4], [15, 3], [9, 8], [-8, 9]] as Pt[]) {
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const px = tx + dx * k;
      const py = ty + dy * k + k * k * 5;
      t.rect(px, py, 2, 1, v);
      if (i % 2 === 0 && k > 0.2) t.set(px + (dy > 0 ? 1 : 0), py + 1 + (k > 0.6 ? 1 : 0), v);
    }
  }
}

/** poste com luminária e cone de luz no chão */
export function streetLamp(t: Tone, x: number, yGround: number, h: number, dir: 1 | -1 = 1, glow = true): void {
  t.rect(x, yGround - h, 2, h, T.ink);
  t.line(x + 1, yGround - h, x + dir * 8, yGround - h - 2, T.ink, 2);
  t.rect(x + dir * 8 - 2, yGround - h - 2, 5, 2, T.ink);
  if (glow) {
    t.radial(x + dir * 8, yGround - h + 1, 10, 7, 1, 0.9);
    t.set(x + dir * 8, yGround - h, T.paper);
  }
}

/** folhagem de canteiro/arbusto em tufos (tom v) */
export function bush(t: Tone, x: number, y: number, w: number, h: number, v: number, seed: number): void {
  const r = mulberry(seed);
  for (let i = 0; i < Math.max(3, w / 4); i++) {
    const bx = x + r() * w;
    const br = h * (0.4 + r() * 0.4);
    t.ball(bx, y - br * 0.8, br, br * 0.85, v, 0.2);
  }
}
