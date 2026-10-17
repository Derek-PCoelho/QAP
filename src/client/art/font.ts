// =============================================================================
// Fonte bitmap 3×5 ("versalete de mapa") com acentos do português.
// Desenha direto num Pix — nítida em qualquer escala inteira. Tudo é
// convertido para maiúsculas. Acentos ocupam 3 linhas acima da letra.
// =============================================================================
import type { Pix } from './pix';

const G: Record<string, string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  // 2 de topo redondo (o Z tem topo reto)
  '2': ['.#.', '#.#', '..#', '.#.', '###'],
  '3': ['##.', '..#', '.#.', '..#', '##.'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '##.', '..#', '##.'],
  '6': ['.##', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '##.'],
  ' ': ['..', '..', '..', '..', '..'],
  '.': ['.', '.', '.', '.', '#'],
  ',': ['.', '.', '.', '#', '#'],
  ':': ['.', '#', '.', '#', '.'],
  ';': ['.', '#', '.', '#', '#'],
  '!': ['#', '#', '#', '.', '#'],
  '?': ['##.', '..#', '.#.', '...', '.#.'],
  '-': ['...', '...', '###', '...', '...'],
  '+': ['...', '.#.', '###', '.#.', '...'],
  '=': ['...', '###', '...', '###', '...'],
  '/': ['..#', '..#', '.#.', '#..', '#..'],
  '(': ['.#', '#.', '#.', '#.', '.#'],
  ')': ['#.', '.#', '.#', '.#', '#.'],
  "'": ['#', '#', '.', '.', '.'],
  '"': ['#.#', '#.#', '...', '...', '...'],
  '%': ['#.#', '..#', '.#.', '#..', '#.#'],
  '#': ['#.#', '###', '#.#', '###', '#.#'],
  '*': ['...', '#.#', '.#.', '#.#', '...'],
  '<': ['..#', '.#.', '#..', '.#.', '..#'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'],
  '_': ['...', '...', '...', '...', '###'],
  'º': ['##', '##', '..', '..', '..'],
  '°': ['##', '##', '..', '..', '..'],
  '$': ['.##', '##.', '.#.', '.##', '##.'],
  '&': ['.#.', '#.#', '.#.', '#.#', '.##'],
};

/** marcas de acento: lista de [dx, dy] relativa ao topo-esquerdo da letra */
const MARK: Record<string, [number, number][]> = {
  acute: [
    [2, -3],
    [1, -2],
  ],
  grave: [
    [0, -3],
    [1, -2],
  ],
  circ: [
    [1, -3],
    [0, -2],
    [2, -2],
  ],
  tilde: [
    [1, -3],
    [2, -3],
    [0, -2],
    [1, -2],
  ],
  cedil: [
    [1, 5],
    [0, 6],
  ],
  uml: [
    [0, -2],
    [2, -2],
  ],
};

const ACCENTED: Record<string, [string, keyof typeof MARK]> = {
  Á: ['A', 'acute'],
  À: ['A', 'grave'],
  Â: ['A', 'circ'],
  Ã: ['A', 'tilde'],
  É: ['E', 'acute'],
  Ê: ['E', 'circ'],
  Í: ['I', 'acute'],
  Ó: ['O', 'acute'],
  Ô: ['O', 'circ'],
  Õ: ['O', 'tilde'],
  Ú: ['U', 'acute'],
  Ü: ['U', 'uml'],
  Ç: ['C', 'cedil'],
};

export const FONT_H = 5;

function glyph(ch: string): { rows: string[]; mark?: keyof typeof MARK } {
  const up = ch.toUpperCase();
  const acc = ACCENTED[up];
  if (acc) return { rows: G[acc[0]], mark: acc[1] };
  return { rows: G[up] ?? G['?'] };
}

/** largura em pixels (escala 1) de um texto, com 1px entre letras */
export function textWidth(str: string, scale = 1, spacing = 1): number {
  let w = 0;
  const s = str.toUpperCase();
  for (let i = 0; i < s.length; i++) {
    const g = glyph(s[i]);
    w += g.rows[0].length + (i < s.length - 1 ? spacing : 0);
  }
  return w * scale;
}

export interface TextOpts {
  scale?: number;
  /** alinhamento horizontal em relação a x */
  align?: 'left' | 'center' | 'right';
  /** cor de sombra (1px abaixo/direita) */
  shadow?: string;
  /** cor de contorno (1px em volta, 8-vizinhança) */
  outline?: string;
  spacing?: number;
  /** alfa 0..1 */
  alpha?: number;
}

/** Desenha texto em versalete 3×5. (x,y) = topo da letra (acentos sobem 3px). */
export function drawText(p: Pix, str: string, x: number, y: number, color: string, o: TextOpts = {}): number {
  const sc = Math.max(1, Math.floor(o.scale ?? 1));
  const sp = o.spacing ?? 1;
  const s = str.toUpperCase();
  const w = textWidth(s, sc, sp);
  let cx = Math.round(o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x);
  const cy = Math.round(y);
  const plot = (px: number, py: number, col: string) => {
    if (sc === 1) {
      if (o.alpha !== undefined && o.alpha < 1) p.pxa(px, py, col, o.alpha);
      else p.px(px, py, col);
    } else if (o.alpha !== undefined && o.alpha < 1) p.recta(px, py, sc, sc, col, o.alpha);
    else p.rect(px, py, sc, sc, col);
  };
  const pass = (dx: number, dy: number, col: string) => {
    let xx = cx;
    for (let i = 0; i < s.length; i++) {
      const g = glyph(s[i]);
      const gw = g.rows[0].length;
      for (let r = 0; r < g.rows.length; r++)
        for (let c = 0; c < gw; c++) if (g.rows[r][c] === '#') plot(xx + (c + dx) * sc, cy + (r + dy) * sc, col);
      if (g.mark) for (const [mx, my] of MARK[g.mark]) plot(xx + (mx + dx) * sc, cy + (my + dy) * sc, col);
      xx += (gw + sp) * sc;
    }
  };
  if (o.outline) {
    for (const [dx, dy] of [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ])
      pass(dx, dy, o.outline);
  } else if (o.shadow) pass(1, 1, o.shadow);
  pass(0, 0, color);
  return w;
}

/** quebra simples por largura máxima (em px, escala 1) */
export function wrapText(str: string, maxW: number): string[] {
  const words = str.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (textWidth(t) > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
