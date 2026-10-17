// =============================================================================
// Videochamada: os lugares (fundo de cada cena) em pixel art.
//
// Mundo de 256×144 (a câmera mostra um quadro 4:3 de VIEW_W × WORLD_H e pode "virar" para mostrar em
// volta). Cada lugar desenha o fundo de dia; a noite e o escuro saem depois,
// pelo mapa de luz (videoLight.ts), com as lâmpadas que o próprio lugar
// declara. Os móveis em que o paciente senta ou deita (sofá, cama, banco,
// cadeira, banco do ônibus, do carro) são desenhados pela cena, na posição do
// paciente, com as funções daqui.
// Puro (sem DOM).
// =============================================================================
import { Pix, mulberry, hashStr } from './pix';
import { shade, mix } from './palette';
import { drawText, textWidth } from './font';
import type { VideoPlace } from '../../engine/types';

export const WORLD_W = 256;
export const WORLD_H = 144;
export const VIEW_W = (WORLD_H * 4) / 3;

export type SeatKind = 'sofa' | 'cadeira' | 'cadeira_plastico' | 'banco' | 'meiofio' | 'chao' | 'cama' | 'banco_onibus' | 'banco_carro' | 'banco_igreja' | 'degrau' | 'longarina' | 'carteira' | 'banqueta';
export type FloorKind = 'piso' | 'madeira' | 'vermelhao' | 'azulejo' | 'cimento' | 'asfalto' | 'calcada' | 'grama' | 'areia' | 'agua' | 'terra' | 'borracha' | 'carpete' | 'telha' | 'quadra' | 'onibus' | 'carro';
export type SurfaceKind = 'mesa' | 'criado' | 'balcao' | 'pia' | 'chao' | 'banco' | 'painel' | 'estante';

export interface Lamp {
  x: number;
  y: number;
  r: number;
  /** força 0..1 */
  k: number;
  /** cor da luz (tingimento) */
  hue?: 'quente' | 'sodio' | 'fria' | 'tv' | 'vermelha' | 'azul';
}

export interface Layout {
  outdoor: boolean;
  /** base da parede do fundo / linha do horizonte do chão */
  floorY: number;
  /** ponto de fuga */
  vpY: number;
  seat: SeatKind;
  /** tem cama de verdade (pose "cama") */
  bed: boolean;
  /** cor dominante do fundo (close sem recorte) */
  wall: string;
  floor: FloorKind;
  floorCol: [string, string];
  surface: SurfaceKind;
  lamps: Lamp[];
  /** x do lado com mais coisas (para "mostrar em volta") */
  env: number;
  /** y do chão onde o paciente fica (deitado) e onde ficam os pés de quem está em pé */
  lieY: number;
  standY: number;
}

export interface PlaceCtx {
  night: boolean;
  dark: boolean;
  seed: string;
  r: () => number;
  /** elementos que brilham (janela acesa, TV, poste): desenhados depois da luz */
  glow: ((p: Pix) => void)[];
  /** o paciente vai usar o móvel (não desenhar o móvel "de enfeite") */
  usesSeat: boolean;
  usesBed: boolean;
  /** variação do lugar (ex.: farmácia na calçada) */
  variant?: string;
  rain: boolean;
}

// -----------------------------------------------------------------------------
// Pincéis
// -----------------------------------------------------------------------------
const W = WORLD_W;
const H = WORLD_H;

/** caixa com face de cima (vista de cima-frente): frente (x,y,w,h) e tampo de profundidade d */
export function box(p: Pix, x: number, y: number, w: number, h: number, d: number, front: string, topC?: string, opts: { edge?: boolean; side?: number } = {}): void {
  const tc = topC ?? shade(front, 0.12);
  if (d > 0) {
    // tampo levemente em perspectiva (estreita para o fundo)
    const inset = Math.max(0, Math.round(d * 0.35));
    p.poly([
      [x + inset, y - d],
      [x + w - inset, y - d],
      [x + w, y],
      [x, y],
    ], tc);
    p.hl(x + inset, x + w - inset - 1, y - d, shade(tc, 0.08));
  }
  p.rect(x, y, w, h, front);
  if (opts.edge !== false) {
    p.rect(x, y, w, 1, shade(front, 0.1));
    p.rect(x, y + h - 1, w, 1, shade(front, -0.22));
    p.rect(x, y, 1, h, shade(front, 0.05));
    p.rect(x + w - 1, y, 1, h, shade(front, -0.14));
  }
}

/** parede com leve degradê pontilhado (mais escura embaixo e nos cantos) */
function wallFill(p: Pix, y0: number, y1: number, c: string): void {
  p.vgrad(0, y0, W, y1 - y0, [shade(c, 0.05), c, shade(c, -0.07)]);
}

/** rodapé */
function baseboard(p: Pix, y: number, c: string): void {
  p.rect(0, y - 3, W, 3, c);
  p.hl(0, W - 1, y - 3, shade(c, 0.12));
}

/** linhas de piso em perspectiva (horizontais com espaçamento 1/d e fugantes) */
function floorGrid(p: Pix, y0: number, vpY: number, line: string, opts: { step?: number; fan?: number; d0?: number; noH?: boolean; noV?: boolean; alt?: string; x0?: number; x1?: number } = {}): void {
  const d0 = opts.d0 ?? 9;
  const x0 = opts.x0 ?? 0;
  const x1 = opts.x1 ?? W;
  const cx = W / 2;
  // horizontais
  if (!opts.noH) {
    for (let n = 1; n < 40; n++) {
      const y = Math.round(vpY + ((y0 - vpY) * d0) / (d0 - n * (opts.step ?? 1)));
      if (y >= H || y <= y0) break;
      p.hl(x0, x1 - 1, y, line);
    }
  }
  // fugantes
  if (!opts.noV) {
    const fan = opts.fan ?? 16;
    for (let x = -W * 2; x <= W * 3; x += fan) {
      const ax = x;
      // reta de (cx, vpY) por (ax, y0)
      const t0 = (y0 - vpY) / Math.max(1, y0 - vpY);
      void t0;
      for (let y = y0; y < H; y++) {
        const xx = Math.round(cx + ((ax - cx) * (y - vpY)) / (y0 - vpY));
        if (xx >= x0 && xx < x1) p.px(xx, y, line);
      }
    }
  }
}

/** piso cerâmico em xadrez sutil */
function floorChecker(p: Pix, y0: number, vpY: number, c1: string, c2: string, fan = 22, d0 = 8): void {
  const cx = W / 2;
  for (let y = y0; y < H; y++) {
    // linha de profundidade
    const depth = Math.floor(d0 - (d0 * (y0 - vpY)) / Math.max(1, y - vpY) + 1000);
    for (let x = 0; x < W; x++) {
      const u = Math.floor(((x - cx) * (y0 - vpY)) / Math.max(1, y - vpY) / fan + 1000);
      if ((u + depth) % 2) p.px(x, y, c2);
    }
  }
  void c1;
}

/** janela com céu (dia/noite), moldura e cortina opcional */
function windowAt(p: Pix, c: PlaceCtx, x: number, y: number, w: number, h: number, frame: string, opts: { curtain?: string; grid?: boolean; bars?: boolean; sill?: boolean; view?: 'ceu' | 'muro' | 'predios' | 'arvore' } = {}): void {
  p.rect(x - 2, y - 2, w + 4, h + 4, frame);
  p.rect(x - 2, y - 2, w + 4, 1, shade(frame, 0.12));
  // vidro
  if (c.night || c.dark) {
    p.vgrad(x, y, w, h, ['#121a2e', '#1c2a46']);
    if (!c.dark && c.r() < 0.6) {
      // uma janela acesa lá fora
      const lx = x + 2 + Math.floor(c.r() * Math.max(1, w - 6));
      c.glow.push((q) => q.rect(lx, y + h - 6, 3, 3, '#e8c870'));
    }
  } else {
    p.vgrad(x, y, w, h, ['#9cc8e8', '#c8e2f2']);
    const v = opts.view ?? 'ceu';
    if (v === 'predios') {
      for (let i = 0; i < 3; i++) {
        const bx = x + Math.floor((i * w) / 3);
        const bh = Math.floor(h * (0.35 + c.r() * 0.4));
        p.rect(bx, y + h - bh, Math.ceil(w / 3) - 1, bh, mix('#b8c4cc', '#8a98a4', c.r()));
      }
    } else if (v === 'arvore') {
      p.ellipse(x + w * 0.65, y + h * 0.7, w * 0.45, h * 0.45, '#6f9a58');
      p.ellipse(x + w * 0.55, y + h * 0.62, w * 0.3, h * 0.3, '#86b06a');
    } else if (v === 'muro') {
      p.rect(x, y + Math.floor(h * 0.55), w, Math.ceil(h * 0.45), '#c8b89a');
    }
    // reflexo diagonal
    for (let i = 0; i < Math.min(w, h) - 2; i += 1) if (i % 5 < 2) p.pxa(x + 2 + i, y + h - 3 - i, '#ffffff', 0.35);
  }
  if (opts.grid !== false) {
    p.vl(x + Math.floor(w / 2), y, y + h - 1, frame);
    if (h > 14) p.hl(x, x + w - 1, y + Math.floor(h / 2), frame);
  }
  if (opts.bars) for (let bx = x + 2; bx < x + w; bx += 3) p.vl(bx, y, y + h - 1, shade(frame, -0.3));
  if (opts.sill !== false) {
    p.rect(x - 3, y + h + 2, w + 6, 2, shade(frame, 0.1));
    p.hl(x - 3, x + w + 2, y + h + 4, shade(frame, -0.25));
  }
  if (opts.curtain) {
    const cc = opts.curtain;
    for (const side of [0, 1]) {
      const cx0 = side === 0 ? x - 5 : x + w - 3;
      p.rect(cx0, y - 4, 8, h + 9, cc);
      for (let i = 1; i < 8; i += 3) p.vl(cx0 + i, y - 3, y + h + 4, shade(cc, -0.14));
      p.vl(cx0, y - 4, y + h + 4, shade(cc, 0.08));
    }
    p.rect(x - 7, y - 6, w + 14, 2, shade(cc, -0.35));
  }
}

function door(p: Pix, x: number, y: number, w: number, h: number, c: string, opts: { open?: boolean; knob?: boolean; glass?: boolean } = {}): void {
  p.rect(x - 2, y - 2, w + 4, h + 2, shade(c, -0.25));
  if (opts.open) {
    p.rect(x, y, w, h, '#2a2228');
    p.poly([
      [x, y],
      [x + Math.floor(w * 0.35), y + 3],
      [x + Math.floor(w * 0.35), y + h - 1],
      [x, y + h],
    ], c);
  } else {
    p.rect(x, y, w, h, c);
    p.rect(x + 2, y + 3, w - 4, Math.floor(h * 0.4) - 3, shade(c, -0.06));
    p.rect(x + 2, y + Math.floor(h * 0.45), w - 4, Math.floor(h * 0.5), shade(c, -0.06));
    if (opts.glass) p.rect(x + 3, y + 4, w - 6, Math.floor(h * 0.3), '#9ab8c8');
  }
  if (opts.knob !== false && !opts.open) p.rect(x + w - 4, y + Math.floor(h * 0.52), 2, 2, '#d8c070');
}

/** quadro na parede */
function picture(p: Pix, x: number, y: number, w: number, h: number, frame: string, art: string): void {
  p.rect(x, y, w, h, frame);
  p.rect(x + 1, y + 1, w - 2, h - 2, art);
  p.rect(x + 2, y + h - 4, w - 4, 2, shade(art, -0.2));
  p.px(x + w - 4, y + 2, shade(art, 0.3));
}

function plant(p: Pix, x: number, y: number, s = 1): void {
  // vaso + folhas
  p.rect(x - 4 * s, y - 6 * s, 8 * s, 6 * s, '#a85a3a');
  p.rect(x - 4 * s, y - 6 * s, 8 * s, 1, '#c8744a');
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.45;
    const lx = x + Math.cos(a) * 7 * s;
    const ly = y - 6 * s + Math.sin(a) * 9 * s;
    p.line(x, y - 6 * s, lx, ly, i % 2 ? '#4f8a3a' : '#6aa04a');
    p.ellipse(lx, ly, 2 * s, 1.4 * s, i % 2 ? '#4f8a3a' : '#6aa04a');
  }
}

function tree(p: Pix, x: number, y: number, s: number, c = '#5f8a4a', trunk = '#6a4a32'): void {
  p.rect(Math.round(x - 1.5 * s), Math.round(y - 14 * s), Math.max(2, Math.round(3 * s)), Math.round(14 * s), trunk);
  p.vl(Math.round(x - 1.5 * s), Math.round(y - 14 * s), y - 1, shade(trunk, 0.15));
  const blobs: [number, number, number][] = [
    [0, -22, 10],
    [-7, -17, 7],
    [7, -17, 7],
    [-3, -27, 7],
    [4, -26, 6],
  ];
  for (const [dx, dy, r] of blobs) p.ellipse(x + dx * s, y + dy * s, r * s, r * s * 0.86, shade(c, -0.12));
  for (const [dx, dy, r] of blobs) p.ellipse(x + dx * s - s, y + dy * s - s, r * s * 0.8, r * s * 0.7, c);
  for (const [dx, dy, r] of blobs) p.ellipse(x + dx * s - 2 * s, y + dy * s - 2 * s, r * s * 0.4, r * s * 0.34, shade(c, 0.14));
}

function skyFill(p: Pix, c: PlaceCtx, y1: number): void {
  if (c.dark) p.vgrad(0, 0, W, y1, ['#05070c', '#0a0e18']);
  else if (c.night) {
    p.vgrad(0, 0, W, y1, ['#0b1224', '#141f3a', '#26304e']);
    const r = mulberry(hashStr(c.seed + ':stars'));
    for (let i = 0; i < 26; i++) {
      const sx = Math.floor(r() * W);
      const sy = Math.floor(r() * y1 * 0.7);
      c.glow.push((q) => q.px(sx, sy, r() < 0.3 ? '#e8ecf4' : '#8a94b0'));
    }
  } else if (c.rain) p.vgrad(0, 0, W, y1, ['#8a96a2', '#a8b2ba']);
  else {
    p.vgrad(0, 0, W, y1, ['#6aa8d8', '#9ccbe8', '#cfe6f2']);
    // nuvens
    const r = mulberry(hashStr(c.seed + ':clouds'));
    for (let i = 0; i < 3; i++) {
      const cx = r() * W;
      const cy = 8 + r() * y1 * 0.4;
      p.ellipse(cx, cy, 12 + r() * 10, 3 + r() * 2, '#f2f6fa');
      p.ellipse(cx + 6, cy - 2, 8, 3, '#ffffff');
    }
  }
}

/** prédios/casas ao longe, com janelas (acesas à noite) */
function skyline(p: Pix, c: PlaceCtx, base: number, opts: { tall?: number; houses?: boolean } = {}): void {
  const r = mulberry(hashStr(c.seed + ':sky'));
  let x = -6;
  while (x < W) {
    const bw = 18 + Math.floor(r() * 22);
    const bh = (opts.houses ? 14 : 18) + Math.floor(r() * (opts.tall ?? 26));
    const col = opts.houses ? ['#d8c4a0', '#c8d0b4', '#e0b8a0', '#b8c8d4', '#e4dcc4'][Math.floor(r() * 5)] : ['#9aa6b0', '#b0a898', '#a4aeb8', '#c0b4a4', '#8e9aa6'][Math.floor(r() * 5)];
    p.rect(x, base - bh, bw, bh, col);
    p.rect(x, base - bh, bw, 1, shade(col, 0.1));
    p.rect(x + bw - 2, base - bh, 2, bh, shade(col, -0.1));
    if (opts.houses) {
      // telhado
      p.poly([
        [x - 2, base - bh],
        [x + bw / 2, base - bh - 7],
        [x + bw + 2, base - bh],
      ], '#a8543a');
    }
    for (let wy = base - bh + 4; wy < base - 6; wy += 7)
      for (let wx = x + 3; wx < x + bw - 4; wx += 6) {
        const lit = r() < 0.45;
        p.rect(wx, wy, 3, 4, '#5a6a78');
        if (lit) c.glow.push((q) => q.rect(wx, wy, 3, 4, r() < 0.5 ? '#e8c870' : '#f2dca0'));
      }
    x += bw + Math.floor(r() * 4);
  }
}

function lampPost(p: Pix, c: PlaceCtx, x: number, base: number, h: number, lamps: Lamp[]): void {
  p.rect(x, base - h, 2, h, '#4a4e54');
  p.rect(x, base - h, 9, 2, '#4a4e54');
  p.rect(x + 7, base - h + 1, 4, 2, '#6a6e74');
  lamps.push({ x: x + 9, y: base - h + 6, r: 70, k: 1, hue: 'sodio' });
  if (c.night || c.dark) c.glow.push((q) => q.rect(x + 7, base - h + 2, 4, 2, '#ffe0a0'));
}

/** meio-fio e sarjeta (linha da calçada) */
function curb(p: Pix, y: number, c = '#b8b4aa'): void {
  p.rect(0, y, W, 3, c);
  p.hl(0, W - 1, y, shade(c, 0.12));
  p.rect(0, y + 3, W, 1, shade(c, -0.4));
}

function asphalt(p: Pix, y0: number, y1: number, vpY: number, c: PlaceCtx, lanes = true): void {
  p.vgrad(0, y0, W, y1 - y0, ['#54585e', '#4a4e54', '#43474c']);
  const r = mulberry(hashStr(c.seed + ':asf'));
  for (let i = 0; i < 160; i++) p.px(Math.floor(r() * W), y0 + Math.floor(r() * (y1 - y0)), r() < 0.5 ? '#5e6268' : '#3e4248');
  if (lanes) {
    // faixa central tracejada em perspectiva
    const cx = W / 2;
    for (let y = y0 + 1; y < y1; y++) {
      const t = (y - vpY) / Math.max(1, y0 - vpY);
      const seg = Math.floor(Math.log(t) * 9);
      if (seg % 2) continue;
      const w = Math.max(1, Math.round(t * 0.9));
      p.rect(Math.round(cx - w / 2 + (y - y0) * 0.0), y, w, 1, '#d8d4a0');
    }
  }
}

/** calçada de pedra portuguesa (ondas preto e branco) ou ladrilho */
function sidewalk(p: Pix, y0: number, y1: number, c: PlaceCtx, kind: 'portuguesa' | 'ladrilho' | 'cimento' = 'portuguesa'): void {
  if (kind === 'cimento') {
    p.vgrad(0, y0, W, y1 - y0, ['#b4b0a6', '#a8a49a']);
    for (let x = 6; x < W; x += 26) p.vl(x, y0, y1 - 1, '#98948a');
    return;
  }
  if (kind === 'ladrilho') {
    p.vgrad(0, y0, W, y1 - y0, ['#b89a84', '#a88a74']);
    for (let y = y0 + 3; y < y1; y += 5) p.hl(0, W - 1, y, '#9a7c66');
    for (let y = y0; y < y1; y++) for (let x = (y % 10 < 5 ? 0 : 3); x < W; x += 6) p.px(x, y, '#9a7c66');
    return;
  }
  p.rect(0, y0, W, y1 - y0, '#d6d2c8');
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0);
    // ondas finas (pedra portuguesa), mais largas perto da câmera
    const per = 10 + t * 8;
    for (let x = 0; x < W; x++) {
      const ph = (x / per + Math.sin((y - y0) / (3 + t * 3)) * 0.35) % 1;
      if (ph > 0.42 && ph < 0.42 + 0.12 + t * 0.04) p.px(x, y, '#5a5a62');
      else if ((x * 7 + y * 13) % 9 === 0) p.px(x, y, '#c6c2b8');
    }
  }
  void c;
}

function grass(p: Pix, y0: number, y1: number, c: PlaceCtx, col = '#6a9a4a'): void {
  p.vgrad(0, y0, W, y1 - y0, [shade(col, -0.08), col, shade(col, 0.05)]);
  const r = mulberry(hashStr(c.seed + ':grass'));
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(r() * W);
    const y = y0 + Math.floor(r() * (y1 - y0));
    const t = (y - y0) / (y1 - y0);
    p.px(x, y, r() < 0.5 ? shade(col, 0.16) : shade(col, -0.18));
    if (t > 0.4 && r() < 0.4) p.px(x, y - 1, shade(col, 0.1));
  }
}

function water(p: Pix, y0: number, y1: number, c: PlaceCtx, col: string, opts: { ripples?: boolean } = {}): void {
  p.vgrad(0, y0, W, y1 - y0, [shade(col, 0.1), col, shade(col, -0.12)]);
  if (opts.ripples !== false) {
    const r = mulberry(hashStr(c.seed + ':water'));
    for (let i = 0; i < 60; i++) {
      const x = Math.floor(r() * W);
      const y = y0 + Math.floor(r() * (y1 - y0));
      const t = (y - y0) / Math.max(1, y1 - y0);
      const len = 2 + Math.floor(t * 8);
      p.hl(x, x + len, y, shade(col, 0.22));
      if (r() < 0.3) p.hl(x + 1, x + len - 1, y + 1, shade(col, -0.15));
    }
  }
}

function rainOver(p: Pix, c: PlaceCtx): void {
  if (!c.rain) return;
  const r = mulberry(hashStr(c.seed + ':rain'));
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(r() * W);
    const y = Math.floor(r() * H);
    p.line(x, y, x - 1, y + 4, '#c8d4dc', 0.45);
  }
}

// -----------------------------------------------------------------------------
// Móveis usados pelo paciente (desenhados pela cena)
// -----------------------------------------------------------------------------
/** sofá visto de frente; (x = centro, y = frente do assento no chão), k = escala */
export function drawSofa(p: Pix, x: number, y: number, k: number, col: string, w = 70): void {
  const sw = Math.round(w * k);
  const x0 = Math.round(x - sw / 2);
  const seatH = Math.round(15 * k);
  const backH = Math.round(17 * k);
  const arm = Math.round(7 * k);
  const top = y - seatH - backH;
  // encosto
  box(p, x0 + arm - 2, top, sw - arm * 2 + 4, backH + 2, 0, shade(col, -0.06));
  for (let i = 1; i < 3; i++) p.vl(x0 + Math.round((sw * i) / 3), top + 2, top + backH - 1, shade(col, -0.18));
  p.hl(x0 + arm, x0 + sw - arm - 1, top, shade(col, 0.08));
  // assento (almofadas)
  box(p, x0 + arm - 1, y - seatH, sw - arm * 2 + 2, seatH - Math.round(3 * k), Math.round(3 * k), col, shade(col, 0.1));
  p.vl(x0 + Math.round(sw / 2), y - seatH - Math.round(2 * k), y - Math.round(4 * k), shade(col, -0.16));
  // braços
  box(p, x0, top + Math.round(6 * k), arm, backH + seatH - Math.round(6 * k) - Math.round(3 * k), Math.round(3 * k), shade(col, -0.04), shade(col, 0.12));
  box(p, x0 + sw - arm, top + Math.round(6 * k), arm, backH + seatH - Math.round(6 * k) - Math.round(3 * k), Math.round(3 * k), shade(col, -0.1), shade(col, 0.08));
  // base e pés
  p.rect(x0 + 1, y - Math.round(3 * k), sw - 2, Math.round(2 * k), shade(col, -0.32));
  p.rect(x0 + 2, y - 1, 2, 2, '#3a2a20');
  p.rect(x0 + sw - 4, y - 1, 2, 2, '#3a2a20');
}

/** cadeira (madeira ou plástico) vista de frente */
export function drawChair(p: Pix, x: number, y: number, k: number, col: string, plastic = false): void {
  // mais larga que o quadril e de encosto alto: aparece dos dois lados de quem está sentado
  const w = Math.round((plastic ? 23 : 21) * k);
  const x0 = Math.round(x - w / 2);
  const seatY = y - Math.round(15 * k);
  const backTop = seatY - Math.round((plastic ? 21 : 19) * k);
  if (plastic) {
    p.poly([
      [x0 + 1, backTop + 2],
      [x0 + w - 1, backTop + 2],
      [x0 + w - 2, seatY],
      [x0 + 2, seatY],
    ], shade(col, -0.05));
    p.ellipse(x, backTop + 3, w / 2, 3 * k, col);
    for (let i = 0; i < 3; i++) p.hl(x0 + 4, x0 + w - 5, backTop + 6 + i * 3, shade(col, -0.18));
  } else {
    p.rect(x0 + 1, backTop, 2, seatY - backTop, shade(col, -0.1));
    p.rect(x0 + w - 3, backTop, 2, seatY - backTop, shade(col, -0.2));
    p.rect(x0 + 1, backTop, w - 2, Math.round(4 * k), col);
    p.rect(x0 + 1, backTop + Math.round(7 * k), w - 2, Math.round(2 * k), shade(col, -0.08));
  }
  box(p, x0, seatY, w, Math.round(2 * k), Math.round(3 * k), col, shade(col, 0.1));
  p.rect(x0 + 1, seatY + 2, 2, y - seatY - 2, shade(col, -0.15));
  p.rect(x0 + w - 3, seatY + 2, 2, y - seatY - 2, shade(col, -0.25));
}

/** cama vista do pé, levemente de cima: (x centro, y = pé da cama no chão) */
export function drawBed(p: Pix, x: number, y: number, k: number, sheet: string, wood = '#6a4a36', w = 92, depth = 30): { top: number; left: number; right: number } {
  const bw = Math.round(w * k);
  const x0 = Math.round(x - bw / 2);
  const d = Math.round(depth * k);
  const h = Math.round(10 * k);
  const mat = y - h;
  // cabeceira (atrás)
  p.rect(x0 + 3, mat - d - Math.round(16 * k), bw - 6, Math.round(18 * k), wood);
  p.rect(x0 + 3, mat - d - Math.round(16 * k), bw - 6, 2, shade(wood, 0.15));
  p.rect(x0 + 6, mat - d - Math.round(12 * k), bw - 12, Math.round(9 * k), shade(wood, -0.1));
  // colchão (tampo)
  p.poly([
    [x0 + 4, mat - d],
    [x0 + bw - 4, mat - d],
    [x0 + bw, mat],
    [x0, mat],
  ], sheet);
  // travesseiro
  p.ellipse(x - bw * 0.22, mat - d + 4 * k, 12 * k, 3.4 * k, '#f2f0ea');
  p.ellipse(x + bw * 0.22, mat - d + 4 * k, 12 * k, 3.4 * k, '#ece8e0');
  // lateral do colchão + estrado
  p.rect(x0, mat, bw, Math.round(4 * k), shade(sheet, -0.12));
  p.rect(x0, mat + Math.round(4 * k), bw, h - Math.round(4 * k), wood);
  p.hl(x0, x0 + bw - 1, mat + Math.round(4 * k), shade(wood, 0.15));
  p.rect(x0 + 1, y - 2, 3, 2, shade(wood, -0.3));
  p.rect(x0 + bw - 4, y - 2, 3, 2, shade(wood, -0.3));
  return { top: mat - d, left: x0, right: x0 + bw };
}

/**
 * berço visto de frente, um pouco de cima: (x centro, y = pés no chão). O fundo
 * (cabeceira, grade de trás, colchão) vai em `p`; a grade da frente em `front`,
 * para o bebê ficar entre as duas.
 */
export function drawCrib(p: Pix, front: Pix, x: number, y: number, k: number, wood = '#efe9de', sheet = '#cfe6f2'): { top: number; left: number; right: number } {
  const bw = Math.round(58 * k);
  const x0 = Math.round(x - bw / 2);
  const d = Math.round(16 * k);
  const mat = y - Math.round(16 * k);
  const railH = Math.round(14 * k);
  // grade de trás
  p.rect(x0 + 2, mat - d - railH, bw - 4, 2, wood);
  for (let bx = x0 + 4; bx < x0 + bw - 3; bx += Math.max(3, Math.round(4 * k))) p.vl(bx, mat - d - railH, mat - d, shade(wood, -0.12));
  // colchão (tampo) e lençol
  p.poly([
    [x0 + 3, mat - d],
    [x0 + bw - 3, mat - d],
    [x0 + bw, mat],
    [x0, mat],
  ], sheet);
  p.rect(x0, mat, bw, Math.round(3 * k), shade(sheet, -0.15));
  // pés
  for (const fx of [x0, x0 + bw - 3]) p.rect(fx, mat - d - railH, 3, y - (mat - d - railH), shade(wood, -0.08));
  p.rect(x0 + 1, mat + Math.round(3 * k), bw - 2, 2, shade(wood, -0.18));
  // grade da frente
  front.rect(x0, mat - railH + Math.round(4 * k), bw, 2, wood);
  front.rect(x0, mat + 1, bw, 2, wood);
  for (let bx = x0 + 3; bx < x0 + bw - 2; bx += Math.max(3, Math.round(4 * k))) front.vl(bx, mat - railH + Math.round(5 * k), mat, wood);
  for (const fx of [x0, x0 + bw - 3]) front.rect(fx, mat - railH + Math.round(2 * k), 3, y - (mat - railH + Math.round(2 * k)), shade(wood, -0.05));
  return { top: mat - d, left: x0, right: x0 + bw };
}

/** banco de praça / de ponto (ripas) */
export function drawBench(p: Pix, x: number, y: number, k: number, col = '#8a6a44', w = 60, metal = '#3a3e44'): void {
  const bw = Math.round(w * k);
  const x0 = Math.round(x - bw / 2);
  const seatY = y - Math.round(13 * k);
  // encosto
  for (let i = 0; i < 3; i++) box(p, x0, seatY - Math.round((12 - i * 4) * k), bw, Math.max(2, Math.round(2.4 * k)), 0, shade(col, -0.04 * i));
  // assento
  box(p, x0, seatY, bw, Math.round(2 * k), Math.round(4 * k), col, shade(col, 0.1));
  // pés de ferro
  for (const fx of [x0 + 3, x0 + bw - 6]) p.rect(fx, seatY + 2, 3, y - seatY - 2, metal);
}

/** meio-fio onde alguém senta */
export function drawCurbSeat(p: Pix, y: number): void {
  curb(p, y - 4);
}

/** banco de ônibus (fileira, visto de trás-frente) */
export function drawBusSeat(p: Pix, x: number, y: number, k: number, col = '#3a5a8a'): void {
  const w = Math.round(30 * k);
  const x0 = Math.round(x - w / 2);
  const seatY = y - Math.round(14 * k);
  box(p, x0 + 1, seatY - Math.round(18 * k), w - 2, Math.round(18 * k), 0, col);
  p.rect(x0 + 3, seatY - Math.round(16 * k), w - 6, Math.round(12 * k), shade(col, 0.08));
  p.rect(x0, seatY - Math.round(20 * k), w, Math.round(3 * k), '#c8ccd0');
  box(p, x0, seatY, w, Math.round(3 * k), Math.round(3 * k), col);
  p.rect(Math.round(x - 1), seatY + 3, 3, y - seatY - 3, '#8a8e94');
}

/** banco de igreja */
export function drawPew(p: Pix, x: number, y: number, k: number, col = '#6a4a30', w = 90): void {
  const bw = Math.round(w * k);
  const x0 = Math.round(x - bw / 2);
  const seatY = y - Math.round(14 * k);
  box(p, x0, seatY - Math.round(16 * k), bw, Math.round(14 * k), 0, shade(col, -0.05));
  p.hl(x0, x0 + bw - 1, seatY - Math.round(16 * k), shade(col, 0.2));
  box(p, x0, seatY, bw, Math.round(3 * k), Math.round(4 * k), col, shade(col, 0.12));
  box(p, x0 - 2, seatY - Math.round(18 * k), 4, y - seatY + Math.round(18 * k), 0, shade(col, -0.15));
  box(p, x0 + bw - 2, seatY - Math.round(18 * k), 4, y - seatY + Math.round(18 * k), 0, shade(col, -0.2));
}

/** mesa (madeira, de bar ou de cozinha); devolve o y do tampo */
export function drawTable(p: Pix, x: number, y: number, k: number, col: string, w = 40, cloth?: string, plastic = false): number {
  const tw = Math.round(w * k);
  const x0 = Math.round(x - tw / 2);
  const topY = y - Math.round(20 * k);
  const d = Math.round(8 * k);
  if (cloth) {
    box(p, x0 - 1, topY, tw + 2, Math.round(7 * k), d, cloth, shade(cloth, 0.08));
    // xadrez da toalha
    for (let yy = topY - d; yy < topY + Math.round(7 * k); yy += 2) for (let xx = x0; xx < x0 + tw; xx += 4) p.px(xx + ((yy / 2) % 2) * 2, yy, shade(cloth, -0.25));
  } else box(p, x0, topY, tw, Math.max(2, Math.round(2.5 * k)), d, col, shade(col, 0.1));
  const legC = plastic ? shade(col, -0.1) : shade(col, -0.25);
  p.rect(x0 + 2, topY + 2, Math.max(2, Math.round(2 * k)), y - topY - 2, legC);
  p.rect(x0 + tw - 4, topY + 2, Math.max(2, Math.round(2 * k)), y - topY - 2, shade(legC, -0.1));
  return topY - Math.round(d / 2);
}

// -----------------------------------------------------------------------------
// Lugares
// -----------------------------------------------------------------------------
type PlaceFn = (p: Pix, c: PlaceCtx) => Layout;

function L0(over: Partial<Layout>): Layout {
  return {
    outdoor: false,
    floorY: 70,
    vpY: 28,
    seat: 'cadeira',
    bed: false,
    wall: '#c9b48a',
    floor: 'piso',
    floorCol: ['#b8ac98', '#a89c88'],
    surface: 'mesa',
    lamps: [],
    env: 60,
    lieY: 114,
    standY: 128,
    ...over,
  };
}

/** sala: parede pintada, janela com cortina, estante com TV, quadro, tapete */
const sala: PlaceFn = (p, c) => {
  const walls = ['#d8c49a', '#c8d4b4', '#e0c8b0', '#bccad8', '#e4d6a8'];
  const wall = walls[Math.floor(c.r() * walls.length)];
  // três jeitos de sala: TV na estante; cristaleira e ventilador (sem TV); estante de livros com TV pequena
  const v = Math.floor(c.r() * 3);
  const floorY = 72;
  wallFill(p, 0, floorY, wall);
  if (v === 1) {
    // piso vermelhão
    p.vgrad(0, floorY, W, H - floorY, ['#a8483a', '#983e32']);
    floorGrid(p, floorY, 26, '#8a3a2e', { fan: 30, d0: 7, step: 1.2 });
  } else if (v === 2) {
    // piso laminado
    p.vgrad(0, floorY, W, H - floorY, ['#a8825a', '#987250']);
    floorGrid(p, floorY, 26, '#86603e', { fan: 14, d0: 7, step: 0.7, noH: true });
  } else {
    // piso cerâmico bege
    p.vgrad(0, floorY, W, H - floorY, ['#c8b89c', '#b8a88c']);
    floorChecker(p, floorY, 26, '#c8b89c', '#bcac90', 26, 7);
    floorGrid(p, floorY, 26, '#a8987c', { fan: 26, d0: 7 });
  }
  baseboard(p, floorY, shade(wall, -0.3));
  windowAt(p, c, 26, 18, 30, 28, '#e8e4dc', { curtain: ['#a8413a', '#3f5f8a', '#c8a050'][Math.floor(c.r() * 3)], view: v === 2 ? 'arvore' : 'predios' });
  const lamps: Lamp[] = [{ x: 128, y: 6, r: 150, k: 1, hue: 'quente' }];
  let env = 200;
  if (v === 0) {
    // estante com TV (à direita)
    box(p, 176, floorY - 22, 56, 22, 0, '#6a4a32');
    p.rect(178, floorY - 18, 24, 14, '#4a3222');
    p.rect(206, floorY - 18, 24, 14, '#4a3222');
    box(p, 184, floorY - 44, 36, 22, 2, '#1e1f24', '#2a2c32');
    p.rect(186, floorY - 42, 32, 17, c.night ? '#2a3a5a' : '#2a3442');
    c.glow.push((q) => {
      if (c.night) q.rect(186, floorY - 42, 32, 17, '#5a8ab8');
      if (c.night) q.rect(188, floorY - 40, 10, 6, '#8ab8d8');
    });
    picture(p, 100, 14, 26, 18, '#6b4c35', ['#9fb87a', '#c8a07a', '#8aa8c8'][Math.floor(c.r() * 3)]);
    p.rect(204, floorY - 28, 6, 6, '#c8a050');
    lamps.push({ x: 204, y: floorY - 33, r: 34, k: 0.6, hue: 'tv' });
  } else if (v === 1) {
    // cristaleira com a louça boa, relógio de parede, fotos da família, ventilador de pé
    box(p, 178, 22, 46, floorY - 22, 0, '#7a5236');
    p.rect(182, 26, 38, 26, '#b8d0d8');
    for (const yy of [34, 42]) p.hl(182, 219, yy, '#7a5236');
    for (let i = 0; i < 5; i++) {
      p.ellipse(187 + i * 7, 32, 2.6, 1.6, '#f2f0ea');
      p.rect(185 + i * 7, 38, 3, 4, i % 2 ? '#c8a050' : '#e8e4dc');
    }
    p.rect(182, 56, 38, 12, '#6a4630');
    p.disc(110, 18, 6, '#f2f0ea');
    p.ring(110, 18, 6, '#5a3a24');
    p.line(110, 18, 110, 14, '#2a2a30');
    p.line(110, 18, 113, 19, '#2a2a30');
    for (let i = 0; i < 3; i++) picture(p, 130 + i * 13, 12 + (i % 2) * 4, 9, 11, '#5a3a24', ['#c8a07a', '#9fb87a', '#a8b8d8'][i]);
    // ventilador de pé
    p.rect(160, floorY - 26, 2, 30, '#6a6e74');
    p.ellipse(161, floorY + 4, 6, 1.6, '#4a4e54');
    p.disc(161, floorY - 30, 7, '#c8ccd0');
    p.ring(161, floorY - 30, 7, '#6a6e74');
    p.disc(161, floorY - 30, 2, '#3a7ad0');
    env = 196;
  } else {
    // estante de livros com TV pequena e porta-retratos
    box(p, 168, 14, 70, floorY - 14, 0, '#8a6a4a');
    for (const yy of [30, 46]) p.rect(170, yy, 66, 2, '#6a4a32');
    for (let i = 0; i < 18; i++) {
      const bx = 171 + i * 3.6;
      if (i > 6 && i < 12) continue;
      p.rect(Math.round(bx), 19 + (i % 3), 3, 11 - (i % 3), ['#a8413a', '#3f5f8a', '#c8a050', '#3f7a4a', '#e8e4dc'][i % 5]);
    }
    box(p, 194, 32, 22, 14, 1, '#1e1f24');
    p.rect(195, 33, 20, 11, c.night ? '#2a3a5a' : '#2a3442');
    c.glow.push((q) => {
      if (c.night) q.rect(195, 33, 20, 11, '#5a8ab8');
    });
    for (let i = 0; i < 4; i++) p.rect(172 + i * 16, 50, 8, 10, ['#c8a07a', '#e8e4dc', '#9fb87a', '#c8a050'][i]);
    door(p, 100, floorY - 50, 26, 50, '#8a6a4a');
    lamps.push({ x: 205, y: 38, r: 30, k: 0.6, hue: 'tv' });
    env = 202;
  }
  plant(p, 70, floorY + 2, 1);
  // tapete
  const rug = ['#a85a46', '#5a6a8a', '#8a7a4a'][v];
  p.ellipse(128, 112, 54, 11, shade(rug, -0.2));
  p.ellipse(128, 112, 50, 9, rug);
  for (let x = 82; x < 176; x += 6) p.px(x, 112, shade(rug, 0.2));
  // sofá de enfeite quando o paciente não está nele
  if (!c.usesSeat) drawSofa(p, 128, floorY + 14, 0.72, ['#5a3e6a', '#3f5f6a', '#6a4a3a'][Math.floor(c.r() * 3)]);
  return L0({ wall, floorY, vpY: 26, seat: 'sofa', floor: v === 2 ? 'madeira' : v === 1 ? 'vermelhao' : 'piso', floorCol: v === 1 ? ['#a8483a', '#983e32'] : v === 2 ? ['#a8825a', '#987250'] : ['#c8b89c', '#b8a88c'], surface: 'mesa', lamps, env });
};

const quarto: PlaceFn = (p, c) => {
  const walls = ['#c4d0e0', '#e0c8d0', '#d4ccb8', '#c8d8c8'];
  const wall = walls[Math.floor(c.r() * walls.length)];
  // três quartos: taco e guarda-roupa; cerâmica e cômoda com espelho; cimento queimado e cortina no lugar do armário
  const v = Math.floor(c.r() * 3);
  const floorY = 70;
  wallFill(p, 0, floorY, wall);
  if (v === 0) {
    p.vgrad(0, floorY, W, H - floorY, ['#9a7050', '#8a6044']);
    floorGrid(p, floorY, 24, '#7a5238', { fan: 9, d0: 7, step: 0.6 });
  } else if (v === 1) {
    p.vgrad(0, floorY, W, H - floorY, ['#d0c8b8', '#c0b8a8']);
    floorGrid(p, floorY, 24, '#aca492', { fan: 24, d0: 7 });
  } else {
    p.vgrad(0, floorY, W, H - floorY, ['#8a8e8a', '#7e827e']);
    const r = mulberry(hashStr(c.seed + ':cim'));
    for (let i = 0; i < 90; i++) p.px(Math.floor(r() * W), floorY + Math.floor(r() * (H - floorY)), '#969a96');
  }
  baseboard(p, floorY, shade(wall, -0.35));
  if (v === 0) {
    // guarda-roupa à esquerda
    box(p, 8, 10, 46, floorY - 10, 0, '#8a6a4a');
    p.vl(31, 12, floorY - 2, '#5a4030');
    p.rect(26, 38, 2, 6, '#d8c070');
    p.rect(34, 38, 2, 6, '#d8c070');
    p.rect(10, 12, 42, 2, '#a88a68');
  } else if (v === 1) {
    // cômoda com espelho, perfumes
    box(p, 10, floorY - 26, 44, 26, 0, '#c8b89a');
    for (const yy of [floorY - 22, floorY - 14, floorY - 6]) {
      p.hl(12, 51, yy, '#a8987a');
      p.rect(30, yy - 4, 4, 1, '#7a6a4a');
    }
    p.rect(16, 18, 32, 20, '#c8d8e0');
    p.frame(15, 17, 34, 22, '#a8987a');
    for (let x = 18; x < 46; x += 5) p.line(x, 36, x + 6, 20, '#e8f0f4');
    p.rect(18, floorY - 30, 3, 4, '#c8607a');
    p.rect(24, floorY - 31, 2, 5, '#7a9ac8');
  } else {
    // arara de roupa atrás de uma cortina
    p.rect(8, 12, 48, 2, '#6a6e74');
    p.rect(10, 14, 44, floorY - 16, '#c87a4a');
    for (let x = 12; x < 54; x += 5) p.vl(x, 15, floorY - 4, '#a85a3a');
    p.poly([[10, floorY - 2], [54, floorY - 2], [56, floorY + 2], [8, floorY + 2]], '#a85a3a');
  }
  windowAt(p, c, 196, 16, 30, 26, '#f2eee6', { curtain: ['#f0e8d8', '#e8c8d0', '#c8d8e8'][v], view: 'arvore' });
  // acima da cama: crucifixo, quadro de santa ou relógio
  if (v === 0) {
    p.rect(126, 12, 2, 10, '#5a3a24');
    p.rect(123, 15, 8, 2, '#5a3a24');
  } else if (v === 1) {
    picture(p, 116, 10, 20, 14, '#c8a050', '#7a9ac8');
  } else {
    p.disc(127, 16, 5, '#f2f0ea');
    p.ring(127, 16, 5, '#3a3a40');
    p.line(127, 16, 127, 13, '#2a2a30');
  }
  // criado-mudo com abajur e remédios
  box(p, 160, floorY - 14, 18, 14, 3, '#7a5a3e');
  p.rect(163, floorY - 26, 10, 8, '#e8d8a8');
  p.rect(167, floorY - 18, 2, 4, '#6a5a4a');
  p.rect(172, floorY - 20, 3, 4, '#f2f2ea');
  p.rect(172, floorY - 20, 3, 1, '#3a7ad0');
  c.glow.push((q) => {
    if (c.night) q.rect(163, floorY - 26, 10, 8, '#ffe8b0');
  });
  if (!c.usesBed && !c.usesSeat) drawBed(p, 112, floorY + 34, 0.8, ['#e8e0d0', '#d8e4ec', '#e8d0d8'][v]);
  const floorCol: [string, string] = v === 0 ? ['#9a7050', '#8a6044'] : v === 1 ? ['#d0c8b8', '#c0b8a8'] : ['#8a8e8a', '#7e827e'];
  return L0({ wall, floorY, vpY: 24, seat: 'cama', bed: true, floor: v === 0 ? 'madeira' : v === 1 ? 'piso' : 'cimento', floorCol, surface: 'criado', lamps: [{ x: 168, y: floorY - 22, r: 80, k: 0.9, hue: 'quente' }, { x: 120, y: 4, r: 120, k: 0.55, hue: 'quente' }], env: 60 });
};

/** cozinha: azulejo branco com friso azul, pia, fogão, geladeira, filtro de barro, mesa com toalha xadrez */
const cozinha: PlaceFn = (p, c) => {
  const floorY = 74;
  // três cozinhas: faixa azul e vermelhão; faixa verde e cerâmica clara; faixa vermelha e piso cinza
  const v = Math.floor(c.r() * 3);
  const band = ['#3f6fa8', '#4f8a5a', '#b8443a'][v];
  const fl: [string, string] = v === 0 ? ['#a8483a', '#983e32'] : v === 1 ? ['#d8d0c0', '#c8c0b0'] : ['#9a9890', '#8a8880'];
  p.rect(0, 0, W, floorY, '#ece8de');
  // azulejo
  for (let y = 4; y < floorY; y += 8) p.hl(0, W - 1, y, '#d4d0c4');
  for (let x = 0; x < W; x += 8) p.vl(x, 0, floorY - 1, '#d4d0c4');
  p.rect(0, 34, W, 4, band);
  for (let x = 2; x < W; x += 8) p.rect(x, 35, 3, 2, '#e8e4d8');
  // piso
  p.vgrad(0, floorY, W, H - floorY, fl);
  floorGrid(p, floorY, 26, shade(fl[1], -0.12), { fan: 30, d0: 7, step: 1.2 });
  baseboard(p, floorY, shade(fl[1], -0.12));
  // geladeira (esquerda)
  box(p, 8, 14, 28, floorY - 14, 0, v === 2 ? '#c8ccd0' : '#e8ece8');
  p.hl(9, 34, 34, '#b8bcb8');
  p.rect(31, 20, 2, 10, '#a8aca8');
  p.rect(31, 38, 2, 14, '#a8aca8');
  // bancada com pia e fogão
  box(p, 40, floorY - 24, 112, 24, 4, '#c8bca4', '#e8e4dc');
  p.rect(58, floorY - 30, 22, 4, '#c8ccd0');
  p.rect(60, floorY - 29, 18, 2, '#9aa4ac');
  p.rect(66, floorY - 40, 2, 10, '#a8acb0');
  p.rect(66, floorY - 40, 6, 2, '#a8acb0');
  for (let i = 0; i < 4; i++) p.rect(46 + i * 26, floorY - 20, 22, 18, '#b8ac94');
  // fogão
  box(p, 104, floorY - 26, 30, 26, 4, '#f0f0ea', '#2a2a30');
  for (const [bx, by] of [
    [110, floorY - 29],
    [124, floorY - 29],
  ])
    p.ellipse(bx, by, 4, 1.2, '#4a4a52');
  p.rect(108, floorY - 18, 22, 12, '#2a2a30');
  p.rect(110, floorY - 16, 18, 8, '#3a3e44');
  // armário de parede
  box(p, 42, 8, 60, 20, 0, '#d8c8a8');
  p.vl(72, 10, 26, '#a8987a');
  // filtro de barro e garrafa térmica
  p.ellipse(158, floorY - 32, 6, 8, '#b8683a');
  p.ellipse(158, floorY - 42, 5, 4, '#c8784a');
  p.rect(166, floorY - 34, 5, 10, '#c8352a');
  // mesa com toalha xadrez
  if (!c.usesSeat) {
    drawTable(p, 200, floorY + 24, 0.85, '#7a5236', 46, '#c8352a');
    drawChair(p, 178, floorY + 24, 0.8, '#7a5236');
  }
  // janela basculante
  windowAt(p, c, 186, 10, 30, 16, '#e8e4dc', { view: 'muro', curtain: undefined });
  return L0({ wall: '#ece8de', floorY, vpY: 26, seat: 'cadeira', floor: v === 0 ? 'vermelhao' : 'piso', floorCol: fl, surface: 'mesa', lamps: [{ x: 128, y: 4, r: 150, k: 1, hue: 'fria' }], env: 80 });
};

/** banheiro: azulejo, box com cortina, vaso, pia com espelho, piso pequeno */
const banheiro: PlaceFn = (p, c) => {
  const floorY = 74;
  p.rect(0, 0, W, floorY, '#e4ece8');
  for (let y = 5; y < floorY; y += 7) p.hl(0, W - 1, y, '#c8d4d0');
  for (let x = 3; x < W; x += 7) p.vl(x, 0, floorY - 1, '#c8d4d0');
  p.rect(0, 40, W, 3, '#5a9a9a');
  // piso
  p.rect(0, floorY, W, H - floorY, '#dce6ea');
  floorChecker(p, floorY, 24, '#dce6ea', '#8ab0c0', 12, 9);
  baseboard(p, floorY, '#a8b8bc');
  // box com cortina (esquerda)
  p.rect(6, 6, 60, floorY - 6, '#d0dce0');
  p.rect(8, 8, 2, 20, '#a8b0b4');
  p.ellipse(9, 30, 3, 2, '#b8c0c4');
  p.rect(4, 4, 66, 2, '#9aa4a8');
  for (let x = 30; x < 66; x += 4) {
    p.rect(x, 6, 4, floorY - 10, x % 8 ? '#f0e4a0' : '#e8d880');
    p.vl(x, 6, floorY - 5, '#d4c470');
  }
  // vaso
  box(p, 150, floorY - 30, 16, 14, 0, '#f4f6f6');
  p.ellipse(158, floorY - 12, 11, 5, '#f4f6f6');
  p.ellipse(158, floorY - 13, 8, 3, '#d8e4e8');
  p.rect(153, floorY - 8, 10, 8, '#e8eeee');
  // pia com espelho
  box(p, 186, floorY - 30, 30, 6, 3, '#f4f6f6');
  p.rect(197, floorY - 24, 8, 24, '#e8eeee');
  p.rect(184, 12, 34, 26, '#c8ccd0');
  p.rect(186, 14, 30, 22, '#a8c8d8');
  p.line(190, 34, 204, 16, '#d8eef4');
  // basculante
  windowAt(p, c, 100, 8, 26, 12, '#e8eeee', { view: 'muro', sill: false });
  // toalha pendurada
  p.rect(126, 30, 12, 18, ['#c8352a', '#3a7ad0', '#e8b931'][Math.floor(c.r() * 3)]);
  p.rect(124, 29, 16, 2, '#a8acb0');
  return L0({ wall: '#e4ece8', floorY, vpY: 24, seat: 'chao', floor: 'azulejo', floorCol: ['#dce6ea', '#8ab0c0'], surface: 'pia', lamps: [{ x: 128, y: 2, r: 140, k: 1, hue: 'fria' }], env: 180, lieY: 116 });
};

/** quintal: muro chapiscado, varal com roupa, tanque, piso cimentado, céu */
const quintal: PlaceFn = (p, c) => {
  const floorY = 76;
  skyFill(p, c, 40);
  // telhado do vizinho
  p.poly([
    [150, 40],
    [200, 22],
    [256, 40],
  ], '#a8543a');
  for (let x = 152; x < 256; x += 4) p.line(x, 40, 200 + (x - 200) * 0.3, 24, '#8a4430');
  // muro
  p.rect(0, 38, W, floorY - 38, '#c8b89a');
  const r = mulberry(hashStr(c.seed + ':muro'));
  for (let i = 0; i < 300; i++) p.px(Math.floor(r() * W), 38 + Math.floor(r() * (floorY - 38)), r() < 0.5 ? '#b8a88a' : '#d4c6aa');
  p.rect(0, 38, W, 2, '#d8ccb4');
  // tanque de lavar
  box(p, 196, floorY - 26, 34, 26, 4, '#c8ccc8', '#d8dcd8');
  p.rect(200, floorY - 28, 26, 2, '#8a9aa4');
  // varal
  p.line(0, 30, W, 34, '#4a4a4a');
  const clothes = ['#c8352a', '#3a7ad0', '#e8e4dc', '#e8b931', '#4f7f4a', '#b86a8a'];
  for (let i = 0; i < 7; i++) {
    const x = 20 + i * 30 + Math.floor(r() * 8);
    const y = 30 + Math.round((x / W) * 4);
    const col = clothes[Math.floor(r() * clothes.length)];
    p.rect(x, y, 10 + Math.floor(r() * 6), 12 + Math.floor(r() * 8), col);
    p.rect(x, y, 10, 1, shade(col, 0.15));
    p.px(x + 2, y - 1, '#d8c070');
  }
  // piso cimentado
  p.vgrad(0, floorY, W, H - floorY, ['#a8a49c', '#98948c']);
  for (let i = 0; i < 140; i++) p.px(Math.floor(r() * W), floorY + Math.floor(r() * (H - floorY)), r() < 0.5 ? '#b4b0a8' : '#8c8880');
  floorGrid(p, floorY, 30, '#8c8880', { fan: 64, d0: 6, step: 1.5 });
  // vasos de planta
  plant(p, 30, floorY + 4, 1.2);
  plant(p, 48, floorY + 2, 0.9);
  rainOver(p, c);
  return L0({ outdoor: true, wall: '#c8b89a', floorY, vpY: 30, seat: 'chao', floor: 'cimento', floorCol: ['#a8a49c', '#98948c'], surface: 'chao', lamps: [{ x: 120, y: 30, r: 120, k: 0.7, hue: 'quente' }], env: 200 });
};

/** escada: degraus subindo na diagonal, corrimão, parede */
const escada: PlaceFn = (p, c) => {
  const floorY = 96;
  wallFill(p, 0, floorY, '#d8ccb4');
  p.vgrad(0, floorY, W, H - floorY, ['#a89c88', '#988c78']);
  // degraus subindo da direita para a esquerda
  const steps = 9;
  for (let i = 0; i < steps; i++) {
    const x0 = 120 - i * 14;
    const y = floorY - i * 9;
    box(p, x0 - 40, y - 9, 120 + i * 0, 9, 3, '#b8ac98', '#ccc2b0');
  }
  // corrimão
  p.line(200, floorY - 30, 200 - 14 * steps, floorY - 30 - 9 * steps, '#5a4030');
  p.line(200, floorY - 29, 200 - 14 * steps, floorY - 29 - 9 * steps, '#7a5a40');
  for (let i = 0; i < steps; i += 2) p.vl(200 - i * 14, floorY - 30 - i * 9, floorY - i * 9, '#5a4030');
  door(p, 210, floorY - 54, 28, 54, '#8a6a4a');
  return L0({ wall: '#d8ccb4', floorY, vpY: 40, seat: 'degrau', floor: 'piso', floorCol: ['#b8ac98', '#a89c88'], surface: 'chao', lamps: [{ x: 120, y: 10, r: 130, k: 0.9, hue: 'quente' }], env: 210, lieY: 120, standY: 134 });
};

/** porta de casa: fachada com porta e janela gradeada, portão baixo, calçada */
const porta: PlaceFn = (p, c) => {
  skyFill(p, c, 30);
  const floorY = 100;
  // fachada
  const wallC = ['#7aa0c8', '#e4c890', '#c8d8b4', '#e8b4a0'][Math.floor(c.r() * 4)];
  p.rect(0, 14, W, floorY - 14, wallC);
  p.rect(0, 12, W, 4, '#a8543a');
  for (let x = 0; x < W; x += 5) p.vl(x, 12, 15, '#8a4430');
  door(p, 110, floorY - 50, 30, 50, '#5a4a3a', { open: false });
  windowAt(p, c, 160, 44, 36, 26, '#e8e4dc', { bars: true, curtain: '#e8d8b8' });
  windowAt(p, c, 40, 44, 36, 26, '#e8e4dc', { bars: true });
  // número da casa pela ligação (nunca o 40, que é a casa do protagonista), numa plaquinha
  const n = 2 + (hashStr(c.seed + ':num') % 498);
  const num = String(n === 40 ? 41 : n);
  const nw = textWidth(num);
  p.rect(145, 38, nw + 3, 9, '#efe6cf');
  p.frame(145, 38, nw + 3, 9, '#6a6a70');
  drawText(p, num, 147, 40, '#2a2a30');
  // muro baixo + portão
  p.rect(0, floorY - 14, W, 14, shade(wallC, -0.1));
  for (let x = 96; x < 156; x += 4) p.vl(x, floorY - 30, floorY - 1, '#3a3e44');
  p.hl(96, 155, floorY - 30, '#3a3e44');
  // calçada
  sidewalk(p, floorY, H, c, 'portuguesa');
  lampPost(p, c, 230, floorY + 4, 80, []);
  c.glow.push((q) => {
    if (c.night) q.rect(150, 32, 4, 4, '#ffe0a0');
  });
  return L0({ outdoor: true, wall: wallC, floorY, vpY: 34, seat: 'degrau', floor: 'calcada', floorCol: ['#d8d4ca', '#3a3a40'], surface: 'chao', lamps: [{ x: 152, y: 34, r: 90, k: 0.9, hue: 'quente' }, { x: 239, y: 30, r: 110, k: 1, hue: 'sodio' }], env: 180, lieY: 120, standY: 132 });
};

/** corredor em perspectiva com portas */
const corredor: PlaceFn = (p, c) => {
  const floorY = 76;
  const wall = '#e0d4bc';
  p.rect(0, 0, W, H, wall);
  // fundo do corredor
  p.rect(100, 18, 56, floorY - 18, shade(wall, -0.08));
  door(p, 116, 30, 24, floorY - 30, '#8a6a4a');
  // paredes laterais convergindo
  p.poly([
    [0, 0],
    [100, 18],
    [100, floorY],
    [0, H],
  ], shade(wall, -0.04));
  p.poly([
    [W, 0],
    [156, 18],
    [156, floorY],
    [W, H],
  ], shade(wall, -0.14));
  // portas laterais em perspectiva
  p.poly([
    [36, 22],
    [62, 28],
    [62, 96],
    [36, 112],
  ], '#7a5a3e');
  p.poly([
    [194, 28],
    [220, 22],
    [220, 112],
    [194, 96],
  ], '#6a4a32');
  // piso
  p.poly([
    [100, floorY],
    [156, floorY],
    [W, H],
    [0, H],
  ], '#b8ac94');
  for (let i = 1; i < 8; i++) {
    const y = floorY + (H - floorY) * (i / 8) ** 1.5;
    const xl = 100 - (100 * (y - floorY)) / (H - floorY);
    const xr = 156 + (100 * (y - floorY)) / (H - floorY);
    p.hl(Math.round(xl), Math.round(xr), Math.round(y), '#a89c84');
  }
  picture(p, 66, 30, 14, 12, '#5a3a24', '#c8a07a');
  return L0({ wall, floorY, vpY: 50, seat: 'chao', floor: 'piso', floorCol: ['#b8ac94', '#a89c84'], surface: 'chao', lamps: [{ x: 128, y: 6, r: 110, k: 0.9, hue: 'quente' }], env: 200 });
};

/** carro estacionado de frente/trás (fundo do estacionamento) */
function parkedCar(p: Pix, x: number, y: number, col: string): void {
  p.ellipse(x + 14, y + 1, 16, 2, '#2a2a30');
  box(p, x, y - 10, 28, 9, 0, col);
  p.poly([
    [x + 4, y - 10],
    [x + 7, y - 17],
    [x + 21, y - 17],
    [x + 24, y - 10],
  ], shade(col, -0.05));
  p.rect(x + 8, y - 16, 12, 5, '#3a4a5a');
  p.rect(x + 2, y - 7, 4, 2, '#e8e0a0');
  p.rect(x + 22, y - 7, 4, 2, '#e8e0a0');
  p.rect(x + 10, y - 5, 8, 2, '#d8d8d0');
  p.rect(x + 1, y - 2, 4, 3, '#1e1e22');
  p.rect(x + 23, y - 2, 4, 3, '#1e1e22');
}

// ---------------------------------------------------------------- rua e lugares abertos
/** fachadas de comércio/casas (porta de aço, letreiro), base = linha da calçada */
function facades(p: Pix, c: PlaceCtx, base: number, top: number, opts: { shops?: boolean; pharmacy?: boolean; bar?: boolean } = {}): void {
  const r = mulberry(hashStr(c.seed + ':fac'));
  let x = -10;
  let i = 0;
  const cols = ['#d8c8a0', '#c8d4c0', '#e0b8a0', '#b8c8d8', '#e8dcc0', '#c8a888', '#a8c0b0'];
  while (x < W) {
    const w = 46 + Math.floor(r() * 26);
    const h = base - top - Math.floor(r() * 12);
    const col = cols[Math.floor(r() * cols.length)];
    p.rect(x, base - h, w, h, col);
    p.rect(x, base - h, w, 2, shade(col, 0.12));
    p.rect(x + w - 2, base - h, 2, h, shade(col, -0.12));
    // janela de cima
    if (h > 46) {
      windowAt(p, c, x + 10, base - h + 6, 14, 12, '#e8e4dc', { grid: true, sill: true, view: 'ceu' });
      windowAt(p, c, x + w - 24, base - h + 6, 14, 12, '#e8e4dc', { grid: true, sill: true, view: 'ceu' });
    }
    // farmácia: a fachada do meio (atrás do paciente), de porta de aço fechada, cruz verde no letreiro
    const isPh = !!opts.pharmacy && x <= 128 && x + w > 128;
    const roll = r();
    const shop = isPh || (opts.shops !== false && roll < 0.75);
    if (shop) {
      // porta de aço (meio aberta) e letreiro
      const dw = w - 14;
      const dx = x + 7;
      const dh = 30;
      p.rect(dx, base - dh, dw, dh, '#3a3a40');
      const openH = isPh ? 0 : Math.floor(dh * (0.4 + r() * 0.5));
      for (let yy = base - dh; yy < base - dh + (dh - openH); yy += 2) p.hl(dx, dx + dw - 1, yy, '#8a8e94');
      p.rect(dx, base - dh + (dh - openH), dw, openH, c.night ? '#2a2420' : '#5a5048');
      if (c.night && r() < 0.6) c.glow.push((q) => q.rect(dx + 1, base - openH, dw - 2, openH, '#e8c890'));
      const sc = ['#c8352a', '#3a6ab0', '#e8b931', '#3f8a4a', '#e8e4dc'][Math.floor(r() * 5)];
      p.rect(dx - 2, base - dh - 9, dw + 4, 8, sc);
      p.rect(dx, base - dh - 7, dw, 1, shade(sc, 0.25));
      if (isPh) {
        p.rect(dx - 2, base - dh - 9, dw + 4, 8, '#2f8a4a');
        const cx = Math.round(dx + 6);
        const cross = (q: Pix, col: string) => {
          q.rect(cx - 1, base - dh - 8, 3, 7, col);
          q.rect(cx - 3, base - dh - 6, 7, 3, col);
        };
        cross(p, '#e8f4ea');
        drawText(p, 'FARMÁCIA', cx + 6, base - dh - 7, '#e8f4ea');
        c.glow.push((q) => {
          if (c.night) cross(q, '#9af0a8');
        });
      }
    } else {
      door(p, x + Math.floor(w / 2) - 7, base - 28, 14, 28, ['#6a4a32', '#3a5a7a', '#7a3a2a'][Math.floor(r() * 3)]);
      windowAt(p, c, x + 6, base - 24, 12, 12, '#e8e4dc', { bars: true, sill: false });
    }
    x += w;
    i++;
  }
}

/** rua: asfalto em perspectiva, calçada do outro lado com fachadas, poste */
const rua: PlaceFn = (p, c) => {
  const far = 62;
  skyFill(p, c, 40);
  skyline(p, c, 40, { tall: 18, houses: true });
  facades(p, c, far - 6, 18);
  // calçada do outro lado
  p.rect(0, far - 6, W, 6, '#bcb8ae');
  curb(p, far, '#a8a49a');
  asphalt(p, far + 4, H, 20, c, true);
  // faixa de pedestres ao longe
  for (let x = 160; x < 230; x += 8) p.rect(x, far + 5, 5, 3, '#d8d8d0');
  lampPost(p, c, 40, far - 2, 54, []);
  lampPost(p, c, 200, far - 2, 54, []);
  rainOver(p, c);
  return L0({ outdoor: true, wall: '#9aa6b0', floorY: far + 4, vpY: 20, seat: 'meiofio', floor: 'asfalto', floorCol: ['#4e5258', '#43474c'], surface: 'chao', lamps: [{ x: 49, y: 14, r: 120, k: 1, hue: 'sodio' }, { x: 209, y: 14, r: 120, k: 1, hue: 'sodio' }], env: 60, lieY: 112, standY: 126 });
};

/** calçada: fachadas perto, calçada no chão, meio-fio embaixo */
const calcada: PlaceFn = (p, c) => {
  const base = 92;
  skyFill(p, c, 26);
  facades(p, c, base, 6, { pharmacy: c.variant === 'farmacia' });
  sidewalk(p, base, 132, c, 'portuguesa');
  curb(p, 132);
  asphalt(p, 136, H, 60, c, false);
  lampPost(p, c, 222, 134, 104, []);
  rainOver(p, c);
  return L0({ outdoor: true, wall: '#d8c8a0', floorY: base, vpY: 30, seat: 'meiofio', floor: 'calcada', floorCol: ['#d4d0c6', '#4a4a50'], surface: 'chao', lamps: [{ x: 231, y: 34, r: 140, k: 1, hue: 'sodio' }, { x: 100, y: 70, r: 70, k: 0.6, hue: 'quente' }], env: 200, lieY: 116, standY: 128 });
};

/** ponto de ônibus: abrigo com banco e placa, rua atrás */
const ponto_onibus: PlaceFn = (p, c) => {
  const far = 60;
  skyFill(p, c, 40);
  skyline(p, c, 44, { tall: 22 });
  facades(p, c, far - 4, 22, { shops: true });
  curb(p, far - 4, '#a8a49a');
  asphalt(p, far, 92, 18, c, true);
  curb(p, 92);
  sidewalk(p, 96, H, c, 'cimento');
  // abrigo
  const x0 = 64;
  const x1 = 196;
  p.rect(x0, 30, x1 - x0, 5, '#5a6a7a');
  p.rect(x0, 30, x1 - x0, 1, '#8a9aaa');
  p.rect(x0 + 2, 35, x1 - x0 - 4, 2, '#3a4a5a');
  for (const px of [x0 + 2, x1 - 5]) p.rect(px, 35, 3, 82, '#4a5a6a');
  // painel de vidro e cartaz
  p.recta(x0 + 6, 38, x1 - x0 - 12, 50, '#b8d8e8', 0.35);
  p.rect(x1 - 40, 42, 30, 40, '#e8e0c8');
  p.rect(x1 - 38, 44, 26, 18, '#c86a3a');
  drawText(p, 'LINHA 12', x1 - 38, 66, '#2a2a30');
  c.glow.push((q) => {
    if (c.night) {
      q.rect(x0 + 6, 35, x1 - x0 - 12, 1, '#f0f4ff');
      q.rect(x1 - 40, 42, 30, 40, '#f4ecd0');
    }
  });
  // placa de ponto
  p.rect(214, 40, 2, 76, '#4a4e54');
  p.rect(206, 34, 18, 12, '#3a6ab0');
  p.rect(209, 37, 12, 6, '#e8e4dc');
  if (!c.usesSeat) drawBench(p, 128, 116, 0.95, '#6a7a8a', 96, '#4a5a6a');
  rainOver(p, c);
  return L0({ outdoor: true, wall: '#9aa6b0', floorY: 96, vpY: 18, seat: 'banco', floor: 'cimento', floorCol: ['#b4b0a6', '#a8a49a'], surface: 'chao', lamps: [{ x: 130, y: 36, r: 100, k: 1, hue: 'fria' }, { x: 30, y: 10, r: 110, k: 0.8, hue: 'sodio' }], env: 210, lieY: 120, standY: 130 });
};

/** praça: árvores, bancos, coreto ao fundo, calçamento, postes */
const praca: PlaceFn = (p, c) => {
  const floorY = 70;
  skyFill(p, c, floorY);
  // igreja matriz ao longe
  p.rect(186, 26, 40, floorY - 26, '#e8dcc4');
  p.rect(198, 8, 16, 20, '#e8dcc4');
  p.poly([
    [196, 8],
    [206, -2],
    [216, 8],
  ], '#a8543a');
  p.rect(205, 0, 2, 4, '#d8c070');
  door(p, 200, floorY - 18, 12, 18, '#6a4a32');
  // coreto
  p.rect(70, 40, 60, 4, '#e8e4dc');
  p.poly([
    [66, 40],
    [100, 26],
    [134, 40],
  ], '#c8543a');
  for (let x = 72; x < 130; x += 12) p.rect(x, 44, 2, 18, '#e8e4dc');
  p.rect(66, 60, 68, 6, '#d8d0c0');
  grass(p, floorY - 6, H, c, '#6a9a4a');
  // caminho de pedra portuguesa
  p.poly([
    [96, floorY - 4],
    [160, floorY - 4],
    [220, H],
    [36, H],
  ], '#d4d0c6');
  for (let y = floorY - 3; y < H; y += 3) {
    const t = (y - floorY) / (H - floorY);
    const xl = 96 - 60 * t;
    const xr = 160 + 60 * t;
    for (let x = Math.round(xl); x < xr; x += 5) if ((x + y) % 7 === 0) p.px(x, y, '#4a4a50');
  }
  tree(p, 24, floorY + 6, 1.4, '#4f8a3a');
  tree(p, 236, floorY + 10, 1.6, '#5f9a4a');
  tree(p, 156, floorY - 4, 0.9, '#c86a9a', '#5a3a2a'); // ipê rosa
  lampPost(p, c, 52, floorY + 30, 70, []);
  if (!c.usesSeat) drawBench(p, 196, 112, 0.9);
  rainOver(p, c);
  return L0({ outdoor: true, wall: '#6a9a4a', floorY, vpY: 24, seat: 'banco', floor: 'calcada', floorCol: ['#d4d0c6', '#6a9a4a'], surface: 'banco', lamps: [{ x: 61, y: floorY - 34, r: 120, k: 1, hue: 'sodio' }], env: 200, lieY: 116, standY: 128 });
};

/** feira: barracas com lona listrada, caixotes de frutas, rua */
const feira: PlaceFn = (p, c) => {
  const floorY = 84;
  skyFill(p, c, 40);
  facades(p, c, 52, 10, { shops: false });
  p.rect(0, 52, W, floorY - 52, '#9a9890');
  const r = mulberry(hashStr(c.seed + ':feira'));
  const lonas = [['#c8352a', '#e8e4dc'], ['#3a7ad0', '#e8e4dc'], ['#e8b931', '#c8352a'], ['#4f8a4a', '#e8e4dc']];
  for (let i = 0; i < 4; i++) {
    const x0 = -8 + i * 68;
    const [a, b] = lonas[i % lonas.length];
    // toldo
    for (let x = x0; x < x0 + 62; x++) p.vl(x, 40, 50, Math.floor((x - x0) / 6) % 2 ? a : b);
    p.hl(x0, x0 + 61, 50, shade(a, -0.3));
    for (const sx of [x0 + 1, x0 + 59]) p.rect(sx, 50, 2, 34, '#6a6e74');
    // bancada com frutas
    box(p, x0 + 4, 64, 54, 18, 6, '#8a6a44', '#a07a50');
    const fruits = ['#e8902a', '#c8352a', '#e8d040', '#6aa04a', '#8a3a6a'];
    for (let j = 0; j < 14; j++) p.disc(x0 + 8 + (j % 7) * 7, 59 + Math.floor(j / 7) * 3, 2.2, fruits[Math.floor(r() * fruits.length)]);
    // placa de preço
    p.rect(x0 + 22, 52, 14, 8, '#f2f0e6');
    drawText(p, '2', x0 + 27, 53, '#2a2a30');
  }
  asphalt(p, floorY, H, 30, c, false);
  // caixotes
  for (let i = 0; i < 4; i++) box(p, 20 + i * 60, floorY + 4, 14, 9, 3, '#b8945a');
  rainOver(p, c);
  return L0({ outdoor: true, wall: '#9a9890', floorY, vpY: 30, seat: 'chao', floor: 'asfalto', floorCol: ['#4e5258', '#43474c'], surface: 'balcao', lamps: [{ x: 128, y: 30, r: 160, k: 0.8, hue: 'quente' }], env: 40, lieY: 118, standY: 130 });
};

/** estacionamento: faixas brancas, carros parados, muro, postes altos */
const estacionamento: PlaceFn = (p, c) => {
  const floorY = 66;
  skyFill(p, c, 40);
  tree(p, 40, 46, 1.1);
  tree(p, 210, 46, 1.2);
  p.rect(0, 40, W, floorY - 40, '#c8c0b0');
  p.rect(0, 40, W, 2, '#d8d0c0');
  asphalt(p, floorY, H, 22, c, false);
  // fileira de vagas no fundo, com carros parados
  for (let x = 0; x < W; x += 36) p.line(x + 6, floorY, x - 4, floorY + 16, '#e8e4dc');
  p.hl(0, W - 1, floorY + 16, '#e8e4dc');
  const r = mulberry(hashStr(c.seed + ':carros'));
  for (const x of [20, 92, 200]) parkedCar(p, x, floorY + 12, ['#c8352a', '#e8e4dc', '#3a5a8a', '#2a2a30', '#8a8e94'][Math.floor(r() * 5)]);
  lampPost(p, c, 120, floorY, 60, []);
  rainOver(p, c);
  return L0({ outdoor: true, wall: '#c8c0b0', floorY, vpY: 22, seat: 'chao', floor: 'asfalto', floorCol: ['#4e5258', '#43474c'], surface: 'chao', lamps: [{ x: 129, y: 12, r: 140, k: 1, hue: 'fria' }], env: 200, lieY: 114, standY: 128 });
};

/** posto de gasolina: cobertura iluminada, bombas, rua */
const posto: PlaceFn = (p, c) => {
  const floorY = 72;
  skyFill(p, c, 50);
  skyline(p, c, 52, { tall: 16, houses: true });
  // cobertura
  p.rect(20, 18, 220, 10, '#e8e4dc');
  p.rect(20, 26, 220, 3, '#2f6aa8');
  p.rect(20, 18, 220, 1, '#ffffff');
  for (const x of [60, 190]) p.rect(x, 29, 6, floorY - 29, '#d8d4cc');
  c.glow.push((q) => {
    if (c.night) for (let x = 30; x < 236; x += 22) q.rect(x, 28, 12, 1, '#f4f8ff');
  });
  // bombas
  for (const x of [96, 150]) {
    box(p, x, floorY - 26, 16, 26, 4, '#e8e4dc', '#c8352a');
    p.rect(x + 3, floorY - 22, 10, 6, '#2a3a2a');
    p.rect(x + 2, floorY - 14, 12, 3, '#c8352a');
    c.glow.push((q) => q.rect(x + 3, floorY - 22, 10, 6, '#6af08a'));
  }
  // placa de preço
  p.rect(232, 30, 3, 40, '#4a4e54');
  p.rect(222, 20, 24, 18, '#2f6aa8');
  drawText(p, '5,89', 224, 28, '#f2f0e6');
  p.rect(0, floorY - 2, W, 2, '#bcb8ae');
  p.vgrad(0, floorY, W, H - floorY, ['#9a968e', '#8a867e']);
  floorGrid(p, floorY, 24, '#7e7a72', { fan: 40, d0: 6, step: 1.4 });
  rainOver(p, c);
  return L0({ outdoor: true, wall: '#e8e4dc', floorY, vpY: 24, seat: 'chao', floor: 'cimento', floorCol: ['#9a968e', '#8a867e'], surface: 'chao', lamps: [{ x: 128, y: 30, r: 170, k: 1, hue: 'fria' }], env: 160, lieY: 114, standY: 128 });
};

/** porta de bar à noite: porta de aço aberta, balcão lá dentro, mesas de plástico na calçada */
const bar_porta: PlaceFn = (p, c) => {
  const base = 88;
  skyFill(p, c, 20);
  p.rect(0, 14, W, base - 14, '#c8b48a');
  p.rect(0, 14, W, 2, '#d8c49a');
  // letreiro (genérico: o nome do bar fica na fala de quem liga)
  const sign = ['BAR E LANCHES', 'BAR', 'BOTECO', 'BAR E MERCEARIA'][Math.floor(c.r() * 4)];
  const sx = Math.round(128 - textWidth(sign) / 2);
  p.rect(70, 18, 116, 12, ['#c8352a', '#2f5f9f', '#3a7a3a'][Math.floor(c.r() * 3)]);
  drawText(p, sign, sx, 21, '#f2e8c8');
  c.glow.push((q) => {
    if (c.night) drawText(q, sign, sx, 21, '#fff4c8');
  });
  // porta de aço levantada: dentro, balcão e garrafas
  p.rect(64, 34, 128, base - 34, '#4a3428');
  for (let yy = 34; yy < 38; yy++) p.hl(64, 191, yy, '#8a8e94');
  p.rect(64, 34, 128, 1, '#6a6e74');
  for (let i = 0; i < 12; i++) {
    const bx = 72 + i * 10;
    p.rect(bx, 44, 3, 8, ['#3f8a4a', '#8a5a2a', '#e8e4dc', '#c8a040'][i % 4]);
  }
  p.rect(66, 53, 124, 2, '#6a4a32');
  box(p, 70, 64, 116, base - 64, 4, '#7a5236', '#9a7250');
  c.glow.push((q) => {
    if (c.night) {
      q.recta(64, 38, 128, 26, '#ffd890', 0.25);
    }
  });
  windowAt(p, c, 16, 40, 30, 26, '#e8e4dc', { bars: true, sill: false });
  // calçada e mesas de plástico
  sidewalk(p, base, 128, c, 'cimento');
  curb(p, 128);
  asphalt(p, 132, H, 60, c, false);
  if (!c.usesSeat) {
    drawTable(p, 34, 120, 0.8, '#e8c040', 30, undefined, true);
    drawChair(p, 18, 122, 0.75, '#e8c040', true);
    drawTable(p, 226, 124, 0.85, '#c8352a', 30, undefined, true);
  }
  lampPost(p, c, 236, 128, 100, []);
  rainOver(p, c);
  return L0({ outdoor: true, wall: '#c8b48a', floorY: base, vpY: 30, seat: 'cadeira_plastico', floor: 'cimento', floorCol: ['#b4b0a6', '#a8a49a'], surface: 'mesa', lamps: [{ x: 128, y: 56, r: 110, k: 1, hue: 'quente' }, { x: 245, y: 30, r: 120, k: 0.8, hue: 'sodio' }], env: 128, lieY: 116, standY: 128 });
};

/** rua alagada: água barrenta até a canela, chuva, casas com marca d'água */
const alagado: PlaceFn = (p, c) => {
  const floorY = 76;
  skyFill(p, c, 30);
  skyline(p, c, 34, { tall: 10, houses: true });
  facades(p, c, floorY, 24, { shops: false });
  // marca d'água nas paredes
  p.recta(0, floorY - 10, W, 4, '#6a5a3a', 0.35);
  water(p, floorY - 4, H, c, '#8a7a50');
  // coisas boiando
  box(p, 40, 100, 10, 4, 2, '#c8352a');
  p.ellipse(190, 112, 6, 2, '#3a7ad0');
  p.rect(150, 96, 12, 2, '#6a4a32');
  return L0({ outdoor: true, wall: '#c8b48a', floorY, vpY: 26, seat: 'chao', floor: 'agua', floorCol: ['#8a7a50', '#7a6a44'], surface: 'chao', lamps: [{ x: 128, y: 20, r: 130, k: 0.7, hue: 'sodio' }], env: 60, lieY: 116, standY: 130 });
};

/** telhado: telhas em perspectiva, outros telhados, céu (e água lá embaixo na enchente) */
const telhado: PlaceFn = (p, c) => {
  skyFill(p, c, 70);
  // telhados vizinhos
  for (let i = 0; i < 5; i++) {
    const x = -10 + i * 58;
    p.poly([
      [x, 70],
      [x + 26, 54 + (i % 2) * 4],
      [x + 54, 70],
    ], i % 2 ? '#a8543a' : '#b8643a');
  }
  if (c.variant === 'enchente') {
    // enchente: a água barrenta cobre a rua até o meio das janelas; só os telhados aparecem
    p.vgrad(0, 62, W, 18, ['#8a7a50', '#6e6040']);
    const r = mulberry(hashStr(c.seed + ':enchente'));
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(r() * W);
      const y = 63 + Math.floor(r() * 15);
      p.hl(x, x + 3 + Math.floor(r() * 5), y, '#a8986a');
    }
    // o que boia: um pneu, um galho, uma cadeira de plástico
    p.ellipse(40 + r() * 30, 70, 4, 1.6, '#1e1e22');
    p.line(150, 68, 166, 66, '#5a4030');
    p.line(156, 67, 160, 64, '#5a4030');
    p.rect(206, 66, 6, 3, '#e8e4dc');
    p.hl(205, 213, 69, '#a8986a');
  }
  // nosso telhado (telhas cerâmicas em perspectiva)
  const y0 = 78;
  p.vgrad(0, y0, W, H - y0, ['#b85a3a', '#a84a30']);
  for (let y = y0 + 2; y < H; y += 5) {
    const t = (y - y0) / (H - y0);
    for (let x = (y % 10) < 5 ? 0 : 4; x < W; x += Math.max(6, Math.round(6 + t * 6))) p.ellipse(x, y, 3 + t * 3, 1.4 + t, '#c86a44');
    p.hl(0, W - 1, y + 2, '#8a3a24');
  }
  return L0({ outdoor: true, wall: '#a8543a', floorY: y0, vpY: 40, seat: 'chao', floor: 'telha', floorCol: ['#b85a3a', '#a84a30'], surface: 'chao', lamps: [{ x: 128, y: 0, r: 160, k: 0.4, hue: 'fria' }], env: 60, lieY: 118, standY: 132 });
};

// ---------------------------------------------------------------- água, campo, obra
const praia: PlaceFn = (p, c) => {
  skyFill(p, c, 46);
  water(p, 46, 70, c, '#3a8ab0');
  for (let x = 0; x < W; x += 9) p.hl(x, x + 5, 66 + ((x / 9) % 3), '#e8f4f8');
  p.vgrad(0, 70, W, H - 70, ['#e8d8a8', '#dcc898', '#d4bc88']);
  const r = mulberry(hashStr(c.seed + ':areia'));
  for (let i = 0; i < 200; i++) p.px(Math.floor(r() * W), 70 + Math.floor(r() * (H - 70)), r() < 0.5 ? '#c8b07a' : '#f0e4c0');
  // guarda-sol
  p.rect(206, 40, 2, 50, '#e8e4dc');
  p.poly([
    [180, 44],
    [207, 32],
    [234, 44],
  ], '#c8352a');
  for (let x = 186; x < 234; x += 8) p.line(207, 32, x, 44, '#e8e4dc');
  return L0({ outdoor: true, wall: '#3a8ab0', floorY: 70, vpY: 40, seat: 'chao', floor: 'areia', floorCol: ['#e8d8a8', '#d4bc88'], surface: 'chao', lamps: [], env: 210, lieY: 114, standY: 128 });
};

const rio: PlaceFn = (p, c) => {
  skyFill(p, c, 40);
  // margem do outro lado com árvores
  p.rect(0, 34, W, 14, '#5f8a4a');
  for (let i = 0; i < 9; i++) tree(p, 10 + i * 30, 48, 0.7 + (i % 3) * 0.15, i % 2 ? '#4f7a3a' : '#5f8a4a');
  water(p, 48, 84, c, '#5a7a7a');
  // reflexo
  p.recta(0, 48, W, 6, '#4f7a3a', 0.3);
  grass(p, 82, H, c, '#6a9a4a');
  // barranco de terra
  p.rect(0, 82, W, 4, '#8a6a44');
  for (let x = 0; x < W; x += 3) p.px(x, 82 + (x % 4), '#6a4a30');
  return L0({ outdoor: true, wall: '#5a7a7a', floorY: 84, vpY: 36, seat: 'chao', floor: 'grama', floorCol: ['#6a9a4a', '#5a8a3a'], surface: 'chao', lamps: [{ x: 128, y: 20, r: 160, k: 0.4, hue: 'fria' }], env: 60, lieY: 116, standY: 130 });
};

const piscina: PlaceFn = (p, c) => {
  skyFill(p, c, 30);
  // muro do clube
  p.rect(0, 24, W, 26, '#e8e0cc');
  p.rect(0, 24, W, 2, '#f4ecdc');
  tree(p, 30, 30, 0.8);
  tree(p, 226, 30, 0.9);
  // borda e água
  p.rect(0, 50, W, 4, '#d8d0c0');
  water(p, 54, 94, c, '#3aa8c8');
  // azulejos no fundo da piscina (linhas)
  for (let x = 20; x < W; x += 40) p.vl(x, 56, 92, '#2a90b0');
  for (let x = 0; x < W; x += 7) p.hl(x, x + 3, 60 + ((x / 7) % 4) * 8, '#8ad8ec');
  p.rect(0, 94, W, 5, '#e8e4dc');
  p.hl(0, W - 1, 94, '#ffffff');
  // deque
  p.vgrad(0, 99, W, H - 99, ['#c8b8a0', '#b8a890']);
  for (let y = 102; y < H; y += 6) p.hl(0, W - 1, y, '#a89880');
  // escadinha
  for (const x of [200, 212]) p.line(x, 80, x, 100, '#c8ccd0');
  // espreguiçadeira
  p.poly([
    [20, 118],
    [70, 118],
    [74, 112],
    [24, 112],
  ], '#e8e4dc');
  return L0({ outdoor: true, wall: '#3aa8c8', floorY: 99, vpY: 40, seat: 'chao', floor: 'piso', floorCol: ['#c8b8a0', '#b8a890'], surface: 'chao', lamps: [{ x: 128, y: 10, r: 160, k: 0.7, hue: 'fria' }], env: 40, lieY: 120, standY: 132 });
};

const campo: PlaceFn = (p, c) => {
  const floorY = 58;
  skyFill(p, c, floorY);
  // morros
  p.ellipse(60, floorY + 6, 90, 16, '#7aa05a');
  p.ellipse(200, floorY + 8, 110, 18, '#6a9a4a');
  // casa da fazenda ao longe
  p.rect(176, 40, 26, 16, '#e8e4dc');
  p.poly([
    [172, 40],
    [189, 30],
    [206, 40],
  ], '#a8543a');
  p.vgrad(0, floorY, W, H - floorY, ['#6a8a3a', '#5a7a32']);
  // fileiras da plantação convergindo
  for (let x = -W; x < 2 * W; x += 14) {
    for (let y = floorY; y < H; y++) {
      const xx = Math.round(W / 2 + ((x - W / 2) * (y - 30)) / (floorY - 30) / 3);
      if (xx >= 0 && xx < W) {
        p.px(xx, y, '#4a6a2a');
        if ((y + x) % 4 === 0) p.px(xx + 1, y - 1, '#7aa04a');
      }
    }
  }
  // cerca
  for (let x = 4; x < W; x += 22) p.rect(x, floorY + 6, 2, 12, '#7a5a3a');
  p.hl(0, W - 1, floorY + 9, '#7a5a3a');
  p.hl(0, W - 1, floorY + 14, '#7a5a3a');
  return L0({ outdoor: true, wall: '#6a9a4a', floorY, vpY: 30, seat: 'chao', floor: 'terra', floorCol: ['#8a6a44', '#6a5a3a'], surface: 'chao', lamps: [{ x: 128, y: 10, r: 150, k: 0.5, hue: 'quente' }], env: 200, lieY: 116, standY: 130 });
};

/** varanda de chácara: piso vermelho, pilares, rede, plantação além */
const chacara: PlaceFn = (p, c) => {
  skyFill(p, c, 60);
  p.ellipse(128, 70, 160, 16, '#6a9a4a');
  for (let i = 0; i < 6; i++) tree(p, 20 + i * 44, 62, 0.6, '#5f8a4a');
  // telhado da varanda (beiral) e pilares
  p.rect(0, 0, W, 14, '#8a5a3a');
  for (let x = 0; x < W; x += 6) p.vl(x, 0, 13, '#6a4028');
  p.rect(0, 14, W, 3, '#5a3a24');
  for (const x of [14, 120, 230]) box(p, x, 17, 10, 70, 0, '#e8e0cc');
  // parede da casa (fundo direito)
  // muretinha
  p.rect(0, 74, W, 12, '#e8e0cc');
  p.rect(0, 74, W, 2, '#f4ecdc');
  // piso vermelho
  p.vgrad(0, 86, W, H - 86, ['#a84a3a', '#983e32']);
  floorGrid(p, 86, 40, '#8a3a2e', { fan: 30, d0: 6, step: 1.3 });
  // rede pendurada entre dois pilares
  for (let x = 24; x <= 120; x++) {
    const t = (x - 24) / 96;
    const y = 30 + Math.sin(t * Math.PI) * 16;
    p.vl(x, Math.round(y), Math.round(y + 3 + Math.sin(t * Math.PI) * 3), x % 6 < 3 ? '#e8b931' : '#c8352a');
  }
  p.line(24, 28, 24, 31, '#a88a5a');
  p.line(120, 28, 120, 31, '#a88a5a');
  // galão de veneno no canto
  return L0({ outdoor: true, wall: '#e8e0cc', floorY: 86, vpY: 40, seat: 'chao', floor: 'vermelhao', floorCol: ['#a84a3a', '#983e32'], surface: 'chao', lamps: [{ x: 128, y: 18, r: 140, k: 1, hue: 'quente' }], env: 200, lieY: 118, standY: 132 });
};

/** obra: parede de tijolo baiano, andaime, areia, betoneira, carrinho de mão */
const obra: PlaceFn = (p, c) => {
  skyFill(p, c, 50);
  // estrutura de concreto com tijolos
  p.rect(0, 14, W, 62, '#b4643a');
  for (let y = 16; y < 76; y += 5)
    for (let x = (y % 10 < 5 ? 0 : 6); x < W; x += 12) {
      p.rect(x, y, 11, 4, '#c8744a');
      p.hl(x, x + 10, y, '#d8845a');
    }
  for (const x of [0, 96, 190]) box(p, x, 8, 12, 68, 0, '#b8b4ac');
  p.rect(0, 8, W, 8, '#b8b4ac');
  // vão de janela
  p.rect(130, 30, 30, 22, '#2a2a30');
  // andaime
  for (const x of [20, 70]) p.rect(x, 4, 2, 80, '#8a8e94');
  for (let y = 10; y < 80; y += 18) p.hl(16, 76, y, '#8a8e94');
  for (let y = 10; y < 80; y += 18) p.line(20, y, 70, y + 18, '#6a6e74');
  p.rect(16, 46, 62, 3, '#a8845a');
  // chão de terra e areia
  p.vgrad(0, 76, W, H - 76, ['#a88a64', '#987a54']);
  const r = mulberry(hashStr(c.seed + ':terra'));
  for (let i = 0; i < 200; i++) p.px(Math.floor(r() * W), 76 + Math.floor(r() * (H - 76)), r() < 0.5 ? '#b89a74' : '#887048');
  p.ellipse(214, 86, 30, 9, '#d8c08a');
  p.ellipse(214, 83, 22, 6, '#e8d09a');
  // betoneira
  p.ellipse(178, 68, 9, 8, '#e07a2a');
  p.rect(172, 74, 3, 12, '#4a4e54');
  p.rect(182, 74, 3, 12, '#4a4e54');
  // pilha de tijolos
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4 - i; j++) box(p, 110 + j * 9 + i * 4, 84 - i * 4, 8, 4, 1, '#c8744a');
  return L0({ outdoor: true, wall: '#b4643a', floorY: 76, vpY: 30, seat: 'chao', floor: 'terra', floorCol: ['#a88a64', '#987a54'], surface: 'chao', lamps: [{ x: 128, y: 6, r: 170, k: 0.6, hue: 'quente' }], env: 50, lieY: 116, standY: 130 });
};

// ---------------------------------------------------------------- comércio, trabalho, serviço
/** bar por dentro: balcão, prateleira de garrafas, mesas de plástico, TV no canto, sinuca */
const bar: PlaceFn = (p, c) => {
  const floorY = 72;
  // azulejo até a metade, parede pintada em cima
  p.rect(0, 0, W, floorY, '#c8a878');
  p.rect(0, 40, W, floorY - 40, '#d8d0b8');
  for (let y = 44; y < floorY; y += 6) p.hl(0, W - 1, y, '#c4bca4');
  for (let x = 0; x < W; x += 6) p.vl(x, 40, floorY - 1, '#c4bca4');
  p.rect(0, 38, W, 2, '#8a6a44');
  // prateleira com garrafas
  for (const sy of [10, 24]) {
    p.rect(60, sy + 10, 140, 2, '#6a4a32');
    for (let i = 0; i < 18; i++) {
      const bx = 64 + i * 7.5;
      const col = ['#3f8a4a', '#8a5a2a', '#e8e4dc', '#c8a040', '#6a2a2a'][(i * 3 + sy) % 5];
      p.rect(Math.round(bx), sy + 2, 3, 8, col);
      p.rect(Math.round(bx) + 1, sy, 1, 2, col);
      p.px(Math.round(bx), sy + 4, shade(col, 0.4));
    }
  }
  // espelho/letreiro
  p.rect(210, 8, 36, 16, '#2a2a30');
  drawText(p, 'FIADO SÓ', 212, 10, '#e8c040');
  drawText(p, 'AMANHÃ', 214, 17, '#e8c040');
  // TV no alto (futebol)
  box(p, 8, 6, 34, 22, 0, '#1e1f24');
  p.rect(10, 8, 30, 18, '#3a8a3a');
  p.hl(10, 39, 16, '#e8e4dc');
  c.glow.push((q) => {
    q.rect(10, 8, 30, 18, '#4aa84a');
    q.hl(10, 39, 16, '#e8f4e8');
    q.px(24, 12, '#ffffff');
  });
  // geladeira de cerveja
  box(p, 210, 30, 30, floorY - 30, 0, '#c8352a');
  p.rect(214, 34, 22, floorY - 40, '#9ab8c8');
  for (let y = 38; y < floorY - 8; y += 6) p.hl(214, 235, y, '#6a8a9a');
  c.glow.push((q) => {
    if (c.night) q.recta(214, 34, 22, floorY - 40, '#e0f4ff', 0.35);
  });
  // balcão
  box(p, 50, floorY - 26, 150, 26, 5, '#7a5236', '#9a7250');
  p.rect(50, floorY - 26, 150, 2, '#a8845a');
  for (let i = 0; i < 4; i++) {
    const sx = 70 + i * 36;
    p.ellipse(sx, floorY - 2, 6, 2, '#a8352a');
    p.rect(sx - 1, floorY - 1, 2, 10, '#6a6e74');
  }
  // piso
  p.vgrad(0, floorY, W, H - floorY, ['#9a8a74', '#8a7a64']);
  floorChecker(p, floorY, 26, '#9a8a74', '#8e7e68', 20, 8);
  // mesa de sinuca no canto
  box(p, 0, floorY + 6, 30, 12, 8, '#3a7a3a', '#4a8a4a');
  if (!c.usesSeat) {
    drawTable(p, 196, floorY + 40, 0.9, '#e8c040', 34, undefined, true);
    drawChair(p, 222, floorY + 42, 0.85, '#e8c040', true);
  }
  return L0({ wall: '#c8a878', floorY, vpY: 26, seat: 'cadeira_plastico', floor: 'piso', floorCol: ['#9a8a74', '#8a7a64'], surface: 'mesa', lamps: [{ x: 128, y: 4, r: 140, k: 1, hue: 'quente' }, { x: 25, y: 17, r: 40, k: 0.5, hue: 'tv' }], env: 220 });
};

/** loja: prateleiras de produtos, balcão com caixa, porta de vidro */
const loja: PlaceFn = (p, c) => {
  const floorY = 74;
  wallFill(p, 0, floorY, '#e8e4dc');
  // prateleiras na parede
  const r = mulberry(hashStr(c.seed + ':loja'));
  for (let sx = 6; sx < 170; sx += 54) {
    box(p, sx, 8, 50, floorY - 8, 0, '#d8d0c0');
    for (let sy = 14; sy < floorY - 6; sy += 13) {
      p.rect(sx + 2, sy + 9, 46, 2, '#a89c88');
      for (let i = 0; i < 8; i++) {
        const col = ['#c8352a', '#3a7ad0', '#e8b931', '#4f8a4a', '#e8e4dc', '#b86a8a', '#2a2a30'][Math.floor(r() * 7)];
        const h = 5 + Math.floor(r() * 4);
        p.rect(sx + 3 + i * 6, sy + 9 - h, 5, h, col);
        p.hl(sx + 3 + i * 6, sx + 7 + i * 6, sy + 9 - h, shade(col, 0.2));
      }
    }
  }
  // porta de vidro com a rua lá fora
  p.rect(184, 10, 56, floorY - 10, '#8a8e94');
  p.rect(186, 12, 52, floorY - 12, c.night ? '#1a2238' : '#a8c8d8');
  p.vl(212, 12, floorY - 1, '#8a8e94');
  if (!c.night) p.rect(186, 50, 52, floorY - 50, '#b8b4aa');
  // balcão com caixa registradora
  box(p, 120, floorY - 24, 60, 24, 4, '#c8b8a0', '#e8e0d0');
  box(p, 150, floorY - 34, 18, 10, 2, '#2a2a30');
  p.rect(152, floorY - 32, 10, 4, '#4a6a5a');
  // piso
  p.vgrad(0, floorY, W, H - floorY, ['#d8d4cc', '#c8c4bc']);
  floorGrid(p, floorY, 26, '#b8b4ac', { fan: 24, d0: 7 });
  if (c.variant === 'farmacia') {
    p.rect(14, 2, 40, 6, '#2f8a4a');
    c.glow.push((q) => q.rect(30, 2, 6, 6, '#9af0a8'));
  }
  return L0({ wall: '#e8e4dc', floorY, vpY: 26, seat: 'chao', floor: 'piso', floorCol: ['#d8d4cc', '#c8c4bc'], surface: 'balcao', lamps: [{ x: 128, y: 2, r: 170, k: 1, hue: 'fria' }], env: 210 });
};

/** mercado: corredor de gôndolas em perspectiva, carrinho, luz fria */
const mercado: PlaceFn = (p, c) => {
  const vpX = W / 2;
  const vpY = 40;
  p.rect(0, 0, W, H, '#e4e8e4');
  // teto com luminárias
  p.rect(0, 0, W, 14, '#d8dcd8');
  for (let i = 0; i < 4; i++) {
    const y = 4 + i * 3;
    const w = 40 - i * 8;
    p.rect(vpX - w / 2, y, w, 1, '#f8fcf8');
    c.glow.push((q) => q.rect(vpX - w / 2, y, w, 1, '#ffffff'));
  }
  // gôndolas dos dois lados (em perspectiva)
  const r = mulberry(hashStr(c.seed + ':merc'));
  for (const side of [-1, 1]) {
    const xNear = side < 0 ? 0 : W;
    const xFar = vpX + side * 26;
    p.poly([
      [xNear, 10],
      [xFar, 30],
      [xFar, 62],
      [xNear, 130],
    ], '#c8ccd0');
    // prateleiras com produtos
    for (let k = 0; k < 6; k++) {
      const t0 = k / 6;
      const yTop = 10 + (30 - 10) * 0 + t0 * 0;
      void yTop;
      for (let sx = 0; sx < 1; sx += 0.02) {
        const x = xNear + (xFar - xNear) * sx;
        const top = 10 + (30 - 10) * sx;
        const bot = 130 + (62 - 130) * sx;
        const y = top + (bot - top) * t0;
        const col = ['#c8352a', '#3a7ad0', '#e8b931', '#4f8a4a', '#e8e4dc', '#e07a2a'][Math.floor(r() * 6)];
        p.rect(Math.round(x), Math.round(y + 2), Math.max(1, Math.round(4 * (1 - sx))), Math.max(1, Math.round((bot - top) / 6 - 3)), col);
      }
      for (let sx = 0; sx < 1; sx += 0.01) {
        const x = xNear + (xFar - xNear) * sx;
        const top = 10 + 20 * sx;
        const bot = 130 - 68 * sx;
        p.px(Math.round(x), Math.round(top + (bot - top) * t0), '#8a8e94');
      }
    }
  }
  // fundo do corredor
  p.rect(vpX - 26, 30, 52, 32, '#b8c0c4');
  // piso brilhante
  p.poly([
    [vpX - 26, 62],
    [vpX + 26, 62],
    [W, 130],
    [W, H],
    [0, H],
    [0, 130],
  ], '#d8dcd8');
  for (let i = 1; i < 10; i++) {
    const y = 62 + (H - 62) * (i / 10) ** 1.6;
    p.hl(0, W - 1, Math.round(y), '#c8ccc8');
  }
  return L0({ wall: '#e4e8e4', floorY: 64, vpY, seat: 'chao', floor: 'piso', floorCol: ['#d8dcd8', '#c8ccc8'], surface: 'estante', lamps: [{ x: 128, y: 6, r: 170, k: 1, hue: 'fria' }], env: 60, lieY: 118, standY: 132 });
};

/** padaria (fundos): masseira, sacos de farinha, forno, mesa de inox, azulejo */
const padaria: PlaceFn = (p, c) => {
  const floorY = 76;
  p.rect(0, 0, W, floorY, '#f0ece4');
  for (let y = 6; y < floorY; y += 9) p.hl(0, W - 1, y, '#d8d4cc');
  for (let x = 0; x < W; x += 9) p.vl(x, 0, floorY - 1, '#d8d4cc');
  // forno de lastro
  box(p, 150, 14, 90, floorY - 14, 0, '#8a8e94');
  for (const y of [22, 44]) {
    p.rect(160, y, 70, 16, '#2a2a30');
    p.rect(162, y + 2, 66, 2, '#c8ccd0');
    c.glow.push((q) => q.rect(164, y + 6, 62, 6, '#e8843a'));
  }
  // masseira
  p.ellipse(84, 50, 26, 8, '#c8ccd0');
  p.ellipse(84, 50, 22, 6, '#e8dcc0');
  box(p, 62, 52, 44, 22, 0, '#9aa4ac');
  p.rect(76, 30, 3, 20, '#6a6e74');
  p.rect(70, 28, 30, 4, '#6a6e74');
  // sacos de farinha
  for (let i = 0; i < 3; i++) {
    p.ellipse(18 + i * 13, floorY - 8 - (i === 1 ? 10 : 0), 8, 9, '#ece4d0');
    p.hl(12 + i * 13, 24 + i * 13, floorY - 10 - (i === 1 ? 10 : 0), '#c8352a');
  }
  p.vgrad(0, floorY, W, H - floorY, ['#b8b0a0', '#a8a090']);
  floorGrid(p, floorY, 26, '#9a9284', { fan: 20, d0: 7 });
  // farinha no chão
  p.ellipse(60, 100, 18, 3, '#e8e4dc');
  return L0({ wall: '#f0ece4', floorY, vpY: 26, seat: 'chao', floor: 'piso', floorCol: ['#b8b0a0', '#a8a090'], surface: 'balcao', lamps: [{ x: 128, y: 2, r: 170, k: 1, hue: 'fria' }], env: 80 });
};

/** academia: esteiras, espelho, halteres, piso de borracha */
const academia: PlaceFn = (p, c) => {
  const floorY = 76;
  wallFill(p, 0, floorY, '#d8dce4');
  // espelho
  p.rect(10, 10, 236, 50, '#a8b8c4');
  p.rect(10, 10, 236, 1, '#e8f0f4');
  for (let x = 20; x < 246; x += 30) p.line(x, 58, x + 20, 12, '#c8d8e0');
  p.rect(8, 60, 240, 2, '#8a9aa4');
  // esteiras (de frente, uma ao lado da outra)
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * 58;
    p.rect(x, floorY - 26, 40, 22, '#3a3e44');
    p.rect(x + 4, floorY - 30, 32, 4, '#2a2a30');
    p.rect(x + 14, floorY - 40, 12, 10, '#3a3e44');
    p.rect(x + 16, floorY - 38, 8, 5, '#4a8a6a');
    c.glow.push((q) => q.rect(x + 16, floorY - 38, 8, 5, '#6af0a0'));
    p.rect(x + 2, floorY - 6, 36, 6, '#2a2a30');
  }
  // halteres
  for (let i = 0; i < 5; i++) {
    p.rect(200 + i * 9, floorY + 4, 6, 2, '#4a4e54');
    p.rect(199 + i * 9, floorY + 2, 2, 6, '#2a2a30');
    p.rect(205 + i * 9, floorY + 2, 2, 6, '#2a2a30');
  }
  p.vgrad(0, floorY, W, H - floorY, ['#3a3e44', '#34383e']);
  const r = mulberry(hashStr(c.seed + ':borr'));
  for (let i = 0; i < 160; i++) p.px(Math.floor(r() * W), floorY + Math.floor(r() * (H - floorY)), '#4a4e54');
  floorGrid(p, floorY, 26, '#2a2e34', { fan: 40, d0: 7, step: 1.4 });
  return L0({ wall: '#d8dce4', floorY, vpY: 26, seat: 'chao', floor: 'borracha', floorCol: ['#3a3e44', '#34383e'], surface: 'chao', lamps: [{ x: 128, y: 2, r: 170, k: 1, hue: 'fria' }], env: 60 });
};

/** fábrica (galpão do Distrito Industrial): bloco cinza, janelas altas, máquina de rolos, faixa de segurança no piso */
const fabrica: PlaceFn = (p, c) => {
  const floorY = 74;
  wallFill(p, 0, floorY, '#a4a8a4');
  for (let y = 22; y < floorY - 16; y += 6) for (let x = y % 12 < 6 ? 0 : 8; x < W; x += 16) p.hl(x, x + 14, y, '#b2b6b2');
  // barrado verde e janelas basculantes no alto
  p.rect(0, floorY - 16, W, 16, '#4f6e5a');
  p.hl(0, W - 1, floorY - 16, '#6a8a74');
  for (let i = 0; i < 4; i++) windowAt(p, c, 12 + i * 64, 4, 40, 12, '#5a5e64', { grid: true, sill: false });
  // pilares metálicos
  for (const x of [0, 124, 248]) box(p, x, 0, 8, floorY, 0, '#6e7278');
  // máquina de rolos (à direita): corpo azul, rolo prateado, painel com botão vermelho
  box(p, 148, floorY - 36, 76, 36, 6, '#2f5f8f', '#3f6f9f');
  p.rect(152, floorY - 28, 66, 7, '#c8ccd0');
  p.hl(152, 217, floorY - 27, '#eef0f2');
  p.hl(152, 217, floorY - 22, '#7a7e84');
  p.rect(152, floorY - 20, 66, 2, '#1e2024');
  p.rect(200, floorY - 46, 18, 10, '#e8c040');
  p.disc(205, floorY - 41, 2, '#d83a2a');
  p.rect(212, floorY - 43, 4, 4, '#2a2a30');
  // estante com caixas (à esquerda)
  box(p, 18, floorY - 44, 52, 44, 0, '#5a5e64');
  for (const y of [floorY - 42, floorY - 28, floorY - 14]) {
    p.hl(18, 69, y + 12, '#e07a2a');
    for (let x = 21; x < 66; x += 15) box(p, x, y, 12, 11, 0, '#b48a5a', undefined, { edge: false });
  }
  // piso de concreto com faixa amarela e preta
  p.vgrad(0, floorY, W, H - floorY, ['#9a9a94', '#8a8a84']);
  floorGrid(p, floorY, 24, '#828278', { fan: 46, d0: 9, step: 1.6 });
  for (let y = floorY + 2; y < H; y += 1) {
    const x = Math.round(140 - (y - floorY) * 0.9);
    p.hl(x, x + 3, y, Math.floor((y - floorY) / 4) % 2 ? '#2a2a26' : '#e8c040');
  }
  const r = mulberry(hashStr(c.seed + ':graxa'));
  for (let i = 0; i < 6; i++) p.ellipse(150 + r() * 90, floorY + 6 + r() * 20, 5 + r() * 6, 1.5, '#6e6e66', 0.6);
  return L0({ wall: '#a4a8a4', floorY, vpY: 24, seat: 'chao', floor: 'cimento', floorCol: ['#9a9a94', '#8a8a84'], surface: 'balcao', lamps: [{ x: 64, y: 2, r: 120, k: 1, hue: 'fria' }, { x: 190, y: 2, r: 120, k: 1, hue: 'fria' }], env: 186 });
};

/** escritório: mesas com computador, persiana, bebedouro */
const escritorio: PlaceFn = (p, c) => {
  const floorY = 72;
  wallFill(p, 0, floorY, '#dcdcd4');
  // janela com persiana
  p.rect(150, 8, 90, 36, '#9ab8c8');
  for (let y = 9; y < 44; y += 3) p.hl(150, 239, y, '#e8e8e0');
  p.rect(148, 6, 94, 2, '#a8a8a0');
  // mesas
  for (const x of [20, 90]) {
    box(p, x, floorY - 20, 56, 4, 6, '#c8b090', '#d8c0a0');
    p.rect(x + 2, floorY - 16, 2, 16, '#6a6e74');
    p.rect(x + 52, floorY - 16, 2, 16, '#6a6e74');
    box(p, x + 18, floorY - 40, 22, 16, 0, '#2a2a30');
    p.rect(x + 20, floorY - 38, 18, 11, '#3a5a7a');
    c.glow.push((q) => q.rect(x + 20, floorY - 38, 18, 11, '#6a9ac8'));
    p.rect(x + 27, floorY - 24, 4, 4, '#2a2a30');
  }
  // bebedouro
  p.rect(232, floorY - 34, 14, 34, '#e8e8e4');
  p.ellipse(239, floorY - 40, 6, 7, '#8ac8e8');
  p.vgrad(0, floorY, W, H - floorY, ['#8a98a8', '#7a8898']);
  floorGrid(p, floorY, 26, '#6a7888', { fan: 16, d0: 7 });
  return L0({ wall: '#dcdcd4', floorY, vpY: 26, seat: 'cadeira', floor: 'carpete', floorCol: ['#8a98a8', '#7a8898'], surface: 'mesa', lamps: [{ x: 128, y: 2, r: 170, k: 1, hue: 'fria' }], env: 60 });
};

/** sala de aula: lousa verde, carteiras, janelas, cartazes */
const escola: PlaceFn = (p, c) => {
  const floorY = 72;
  p.rect(0, 0, W, floorY, '#e8e0c4');
  p.rect(0, 36, W, floorY - 36, '#c8d4b0');
  p.rect(0, 36, W, 2, '#a8b490');
  // lousa
  p.rect(60, 8, 120, 40, '#6a4a2a');
  p.rect(62, 10, 116, 36, '#2f4a3a');
  drawText(p, 'ADIÇÃO 3+4=7', 70, 16, '#d8dcd0');
  p.line(70, 30, 120, 30, '#a8b0a4');
  p.rect(62, 46, 116, 2, '#8a6a44');
  // cartazes e janelas
  picture(p, 10, 12, 20, 16, '#c8352a', '#f2e8c8');
  windowAt(p, c, 200, 10, 36, 30, '#e8e4dc', { view: 'arvore' });
  // carteiras
  for (const [x, y] of [
    [30, 92],
    [96, 92],
    [178, 92],
  ]) {
    box(p, x, y - 16, 34, 3, 6, '#c8a878', '#d8b888');
    p.rect(x + 2, y - 13, 2, 13, '#4a5a6a');
    p.rect(x + 30, y - 13, 2, 13, '#4a5a6a');
  }
  p.vgrad(0, floorY, W, H - floorY, ['#b8a884', '#a89874']);
  floorGrid(p, floorY, 26, '#988864', { fan: 12, d0: 7, step: 0.8 });
  return L0({ wall: '#e8e0c4', floorY, vpY: 26, seat: 'carteira', floor: 'madeira', floorCol: ['#b8a884', '#a89874'], surface: 'mesa', lamps: [{ x: 128, y: 2, r: 170, k: 1, hue: 'fria' }], env: 210 });
};

/** quadra coberta: piso pintado com linhas, tabela de basquete, arquibancada */
const quadra: PlaceFn = (p, c) => {
  const floorY = 62;
  // estrutura metálica do telhado
  p.rect(0, 0, W, 24, '#8a929a');
  for (let x = 0; x < W; x += 16) p.line(x, 0, x + 16, 24, '#6a7278');
  p.rect(0, 22, W, 2, '#5a6268');
  // muro com arquibancada
  p.rect(0, 24, W, floorY - 24, '#d8d4c4');
  for (let i = 0; i < 4; i++) box(p, 0, 30 + i * 8, W, 6, 2, '#a8a49a', '#c8c4b8');
  // tabela
  p.rect(126, 26, 4, 30, '#4a4e54');
  p.rect(116, 18, 24, 14, '#e8e8e4');
  p.rect(121, 22, 14, 7, '#c8352a');
  p.ellipse(128, 34, 5, 1.4, '#e07a2a');
  // piso verde com linhas
  p.vgrad(0, floorY, W, H - floorY, ['#3a8a6a', '#2f7a5a']);
  p.hl(0, W - 1, floorY + 6, '#e8e4dc');
  p.ellipse(128, floorY + 26, 40, 9, '#e8e4dc');
  p.ellipse(128, floorY + 26, 39, 8, '#3a8a6a');
  for (let y = floorY + 6; y < H; y++) {
    const xl = 128 - 20 - (y - floorY) * 0.9;
    p.px(Math.round(xl), y, '#e8e4dc');
    p.px(Math.round(256 - xl), y, '#e8e4dc');
  }
  return L0({ wall: '#d8d4c4', floorY, vpY: 24, seat: 'banco', floor: 'quadra', floorCol: ['#3a8a6a', '#2f7a5a'], surface: 'chao', lamps: [{ x: 128, y: 10, r: 170, k: 1, hue: 'fria' }], env: 60, lieY: 112, standY: 128 });
};

/** igreja: bancos em perspectiva, corredor, altar com cruz, vitrais */
const igreja: PlaceFn = (p, c) => {
  const floorY = 70;
  p.rect(0, 0, W, floorY, '#ece4d0');
  // arcos e vitrais
  for (const x of [16, 214]) {
    p.rect(x, 12, 26, 44, '#7a5a3a');
    p.ellipse(x + 13, 14, 13, 8, '#7a5a3a');
    const cols = ['#c8352a', '#3a6ab0', '#e8b931', '#4f8a4a'];
    for (let yy = 16; yy < 54; yy += 5) for (let xx = x + 2; xx < x + 24; xx += 5) p.rect(xx, yy, 4, 4, cols[(xx + yy) % 4]);
    c.glow.push((q) => {
      if (!c.night) for (let yy = 16; yy < 54; yy += 5) for (let xx = x + 2; xx < x + 24; xx += 5) q.pxa(xx + 1, yy + 1, '#ffffff', 0.4);
    });
  }
  // altar
  box(p, 96, floorY - 18, 64, 18, 4, '#f2ece0', '#ffffff');
  p.rect(96, floorY - 12, 64, 3, '#c8a040');
  p.rect(126, 14, 4, 34, '#8a6a3a');
  p.rect(118, 22, 20, 4, '#8a6a3a');
  for (const x of [104, 150]) {
    p.rect(x, floorY - 28, 2, 10, '#f2ece0');
    c.glow.push((q) => q.px(x, floorY - 30, '#ffe080'));
  }
  // piso com tapete vermelho
  p.vgrad(0, floorY, W, H - floorY, ['#c8b898', '#b8a888']);
  p.poly([
    [118, floorY],
    [138, floorY],
    [170, H],
    [86, H],
  ], '#a8302a');
  // bancos laterais (fileiras)
  if (!c.usesSeat) {
    for (let i = 0; i < 3; i++) {
      const y = floorY + 12 + i * 22;
      const k = 0.6 + i * 0.2;
      drawPew(p, 50 - i * 10, y, k, '#6a4a30', 70);
      drawPew(p, 206 + i * 10, y, k, '#6a4a30', 70);
    }
  }
  return L0({ wall: '#ece4d0', floorY, vpY: 30, seat: 'banco_igreja', floor: 'piso', floorCol: ['#c8b898', '#b8a888'], surface: 'banco', lamps: [{ x: 128, y: 10, r: 170, k: 0.9, hue: 'quente' }], env: 128 });
};

/** salão de festas: bexigas, faixa, mesas com toalha, cadeiras de plástico */
const salao: PlaceFn = (p, c) => {
  const floorY = 70;
  wallFill(p, 0, floorY, '#e8d8c8');
  // faixa
  p.rect(60, 8, 136, 12, '#e8b931');
  drawText(p, 'FELIZ ANIVERSÁRIO', 66, 11, '#8a3a2a');
  // bexigas
  const cols = ['#c8352a', '#3a7ad0', '#e8b931', '#4f8a4a', '#b86a8a'];
  for (let i = 0; i < 14; i++) {
    const x = 6 + i * 18;
    const y = 30 + ((i * 7) % 11);
    p.line(x, y + 5, x + 1, y + 16, '#8a8e94');
    p.ellipse(x, y, 4, 5, cols[i % 5]);
    p.px(x - 1, y - 2, shade(cols[i % 5], 0.5));
  }
  // mesa do bolo
  box(p, 100, floorY - 18, 56, 18, 4, '#f2ece0', '#ffffff');
  p.rect(116, floorY - 30, 24, 12, '#f0d8e0');
  p.rect(116, floorY - 30, 24, 3, '#c86a8a');
  p.rect(127, floorY - 36, 2, 6, '#3a7ad0');
  c.glow.push((q) => q.px(127, floorY - 37, '#ffe080'));
  // piso
  p.vgrad(0, floorY, W, H - floorY, ['#c8c0b0', '#b8b0a0']);
  floorChecker(p, floorY, 26, '#c8c0b0', '#bcb4a4', 26, 7);
  if (!c.usesSeat) {
    drawTable(p, 40, floorY + 34, 0.85, '#e8e4dc', 40, '#f2ece0');
    drawTable(p, 216, floorY + 38, 0.9, '#e8e4dc', 40, '#f2ece0');
    drawChair(p, 64, floorY + 36, 0.8, '#e8e4dc', true);
  }
  return L0({ wall: '#e8d8c8', floorY, vpY: 26, seat: 'cadeira_plastico', floor: 'piso', floorCol: ['#c8c0b0', '#b8b0a0'], surface: 'mesa', lamps: [{ x: 128, y: 2, r: 170, k: 1, hue: 'quente' }], env: 128 });
};

/** UPA: recepção com guichê, longarinas, TV, placas, luz fria */
const hospital: PlaceFn = (p, c) => {
  const floorY = 72;
  p.rect(0, 0, W, floorY, '#e4ece8');
  p.rect(0, 40, W, floorY - 40, '#b8d4c8');
  p.rect(0, 40, W, 2, '#8ab4a4');
  // guichê
  box(p, 150, 18, 90, floorY - 18, 0, '#d8e0dc');
  p.rect(158, 24, 74, 22, '#a8c8d4');
  p.rect(158, 24, 74, 1, '#e8f4f8');
  p.rect(150, 46, 90, 4, '#c8d0cc');
  p.rect(176, 8, 40, 9, '#3a7a5a');
  drawText(p, 'RECEPÇÃO', 179, 10, '#f2f6f4');
  // placa triagem
  p.rect(20, 10, 44, 9, '#3a6aa8');
  drawText(p, 'TRIAGEM >', 22, 12, '#f2f6f4');
  // TV
  box(p, 86, 8, 30, 18, 0, '#1e1f24');
  p.rect(88, 10, 26, 14, '#3a5a7a');
  c.glow.push((q) => q.rect(88, 10, 26, 14, '#6a9ac8'));
  // longarinas
  if (!c.usesSeat) {
    for (let i = 0; i < 4; i++) {
      const x = 12 + i * 22;
      box(p, x, floorY - 4, 18, 3, 3, '#3a6aa8');
      p.rect(x + 1, floorY - 18, 16, 12, '#3a6aa8');
    }
    p.rect(10, floorY - 1, 92, 2, '#8a8e94');
  }
  p.vgrad(0, floorY, W, H - floorY, ['#d8dcd8', '#c8ccc8']);
  floorChecker(p, floorY, 26, '#d8dcd8', '#cdd2ce', 24, 7);
  return L0({ wall: '#e4ece8', floorY, vpY: 26, seat: 'longarina', floor: 'piso', floorCol: ['#d8dcd8', '#c8ccc8'], surface: 'balcao', lamps: [{ x: 128, y: 2, r: 170, k: 1, hue: 'fria' }], env: 200 });
};

/** central de regulação: mesas com monitores, mapa da cidade na parede */
const central: PlaceFn = (p, c) => {
  const floorY = 72;
  p.rect(0, 0, W, floorY, '#26352f');
  p.rect(0, floorY - 30, W, 30, '#1f2c27');
  // painel com o mapa
  p.rect(60, 6, 136, 40, '#0d1311');
  p.rect(62, 8, 132, 36, '#16201c');
  for (let i = 0; i < 40; i++) p.rect(64 + ((i * 37) % 126), 10 + ((i * 17) % 30), 6, 3, '#2f4139');
  c.glow.push((q) => {
    for (let i = 0; i < 8; i++) q.px(70 + ((i * 41) % 118), 14 + ((i * 13) % 26), ['#7fd17a', '#e8a33d', '#e0483d'][i % 3]);
  });
  // mesas com monitores
  for (const x of [10, 96, 182]) {
    box(p, x, floorY - 20, 64, 4, 5, '#3d5248', '#5f7a6c');
    box(p, x + 8, floorY - 40, 22, 16, 0, '#0d1311');
    box(p, x + 34, floorY - 40, 22, 16, 0, '#0d1311');
    c.glow.push((q) => {
      q.rect(x + 10, floorY - 38, 18, 11, '#2f5a3a');
      q.rect(x + 36, floorY - 38, 18, 11, '#1f3a2f');
    });
  }
  p.vgrad(0, floorY, W, H - floorY, ['#3a4440', '#323a36']);
  floorGrid(p, floorY, 26, '#2a3430', { fan: 18, d0: 7 });
  return L0({ wall: '#26352f', floorY, vpY: 26, seat: 'cadeira', floor: 'carpete', floorCol: ['#3a4440', '#323a36'], surface: 'mesa', lamps: [{ x: 128, y: 2, r: 160, k: 0.8, hue: 'fria' }], env: 128 });
};

/** dentro do ônibus: corredor, bancos, janelas, barras */
const onibus: PlaceFn = (p, c) => {
  const vpX = W / 2;
  p.rect(0, 0, W, H, '#c8c4b4');
  // teto
  p.poly([
    [0, 0],
    [W, 0],
    [vpX + 30, 28],
    [vpX - 30, 28],
  ], '#e0dccc');
  c.glow.push((q) => {
    q.line(40, 6, vpX - 20, 24, '#fffcf0');
    q.line(W - 40, 6, vpX + 20, 24, '#fffcf0');
  });
  // janelas dos dois lados (em perspectiva)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const t0 = i / 4;
      const t1 = t0 + 0.2;
      const xa = side < 0 ? 0 + (vpX - 30) * t0 : W - (W - vpX - 30) * t0;
      const xb = side < 0 ? 0 + (vpX - 30) * t1 : W - (W - vpX - 30) * t1;
      const ya = 12 + 16 * t0;
      const yb = 12 + 16 * t1;
      p.poly([
        [xa, ya],
        [xb, yb],
        [xb, yb + 30 - 18 * t1],
        [xa, ya + 30 - 18 * t0],
      ], c.night ? '#1a2238' : '#9cc8e0');
      if (!c.night) p.poly([
        [xa, ya + 20 - 12 * t0],
        [xb, yb + 20 - 12 * t1],
        [xb, yb + 30 - 18 * t1],
        [xa, ya + 30 - 18 * t0],
      ], '#b8c4a8');
    }
  }
  // fundo
  p.rect(vpX - 30, 28, 60, 34, '#b8b4a4');
  p.rect(vpX - 22, 32, 44, 14, c.night ? '#1a2238' : '#9cc8e0');
  // barras
  for (const x of [vpX - 40, vpX + 40]) p.vl(x, 4, 110, '#d8dce0');
  p.hl(0, W - 1, 6, '#d8dce0');
  // corredor
  p.poly([
    [vpX - 16, 62],
    [vpX + 16, 62],
    [vpX + 60, H],
    [vpX - 60, H],
  ], '#5d5f63');
  for (let y = 66; y < H; y += 6) p.hl(Math.round(vpX - 16 - (y - 62) * 0.55), Math.round(vpX + 16 + (y - 62) * 0.55), y, '#525458');
  // fileiras de bancos dos dois lados
  if (!c.usesSeat)
    for (let i = 0; i < 3; i++) {
      const k = 0.55 + i * 0.25;
      const y = 70 + i * 26;
      drawBusSeat(p, vpX - 46 - i * 26, y, k);
      drawBusSeat(p, vpX + 46 + i * 26, y, k);
    }
  return L0({ wall: '#c8c4b4', floorY: 62, vpY: 30, seat: 'banco_onibus', floor: 'onibus', floorCol: ['#5d5f63', '#525458'], surface: 'banco', lamps: [{ x: 128, y: 10, r: 170, k: 1, hue: 'fria' }], env: 60, lieY: 118, standY: 132 });
};

/** dentro do carro (pela porta do motorista): banco, volante, painel, para-brisa trincado */
const carro: PlaceFn = (p, c) => {
  // lá fora (pelo para-brisa e pela janela do outro lado)
  if (c.night) p.vgrad(0, 0, W, H, ['#0b1224', '#1a2238']);
  else p.vgrad(0, 0, W, H, ['#9cc8e0', '#c8e0ec']);
  // teto do carro
  p.rect(0, 0, W, 12, '#3a3e44');
  p.rect(0, 12, W, 2, '#2a2e34');
  // para-brisa trincado
  p.rect(150, 14, 106, 44, c.night ? '#141c30' : '#a8cce0');
  for (const [x0, y0, x1, y1] of [
    [196, 30, 176, 18],
    [196, 30, 226, 20],
    [196, 30, 184, 52],
    [196, 30, 236, 44],
    [196, 30, 160, 34],
  ])
    p.line(x0, y0, x1, y1, '#e8f4f8');
  // poste lá fora
  p.rect(214, 14, 6, 44, '#6a6e74');
  // painel
  p.poly([
    [140, 58],
    [W, 52],
    [W, 80],
    [140, 84],
  ], '#2a2a30');
  p.rect(160, 60, 30, 10, '#1a1a1e');
  c.glow.push((q) => {
    q.rect(164, 62, 6, 3, '#e8843a');
    q.rect(174, 62, 10, 3, '#6ac8e8');
  });
  // banco (encosto) e interior escuro
  p.rect(0, 14, 150, H - 14, '#26262c');
  p.rect(60, 20, 70, 100, '#3a3e48');
  p.rect(64, 22, 62, 96, '#444852');
  for (let y = 30; y < 110; y += 12) p.hl(66, 123, y, '#3a3e48');
  // moldura da porta (primeiro plano)
  p.rect(0, 0, 22, H, '#8a2a26');
  p.rect(22, 0, 3, H, '#5a1a18');
  p.rect(W - 18, 0, 18, H, '#8a2a26');
  p.rect(0, H - 10, W, 10, '#5a1a18');
  return L0({ wall: '#3a3e48', floorY: 120, vpY: 30, seat: 'banco_carro', floor: 'carro', floorCol: ['#2a2a30', '#26262c'], surface: 'painel', lamps: [{ x: 128, y: 10, r: 120, k: 0.6, hue: 'fria' }], env: 200, lieY: 118, standY: 132 });
};

export const PLACES: Partial<Record<VideoPlace, PlaceFn>> = { sala, quarto, cozinha, banheiro, quintal, escada, porta, corredor, rua, calcada, ponto_onibus, praca, feira, estacionamento, posto, bar_porta, alagado, telhado, praia, rio, piscina, campo, chacara, obra, bar, loja, mercado, padaria, academia, escritorio, fabrica, escola, quadra, igreja, salao, hospital, central, onibus, carro };

export const PLACE_HELPERS = { box, wallFill, baseboard, floorGrid, floorChecker, windowAt, door, picture, plant, tree, skyFill, skyline, lampPost, curb, asphalt, sidewalk, grass, water, rainOver, L0 };
