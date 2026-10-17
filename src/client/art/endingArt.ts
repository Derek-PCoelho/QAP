// =============================================================================
// Vinhetas 320×180 dos finais, game overs e tela de título.
// drawEnding(ctx, kind, { blend, time, gender }) — parte estática em cache,
// animação leve por quadro (telefone tocando, vapor, chama, fluorescente).
// =============================================================================
import { Pix, presentPix, hash2, mulberry, gradedCopy, bayerOn } from './pix';
import { HOME, CENTRAL, mix, shade, homeGrader, quantize } from './palette';
import { drawText, textWidth } from './font';
import type { Rect } from './scenes';
import { figurePix, extraFigurePix } from './figures';
import { drawDog } from './dog';
import { PROTAGONIST_FIRST, SON_NAME } from '../../engine/text';
import { portraitThumbPix } from './portraits';
import { renderCityMap } from './mapRender';
import { deskPhone, familyPhoto, papers, manualBinder, postit, corkBoard, pushPin, cornCake, floorShadow, kidDrawing, monitorFrame, fridge, sewingMachine, woodChair, housePlate, cardBox } from './props';

export type EndingKind =
  | 'desenho_davi'
  | 'desenho_cadeira'
  | 'cracha_prego'
  | 'calcada_moveis'
  | 'telefone_escuro'
  | 'gaveta'
  | 'quarto_alugado'
  | 'escritorio_ar'
  | 'mural'
  | 'bolo_porta'
  | 'titulo';

export const ENDING_KINDS: EndingKind[] = [
  'desenho_davi',
  'desenho_cadeira',
  'cracha_prego',
  'calcada_moveis',
  'telefone_escuro',
  'gaveta',
  'quarto_alugado',
  'escritorio_ar',
  'mural',
  'bolo_porta',
  'titulo',
];

export interface EndingOpts {
  /** Desgaste/100 (esfria as vinhetas domésticas) */
  blend?: number;
  /** ms */
  time: number;
  gender: 'M' | 'F';
}

const W = 320;
const H = 180;

// -----------------------------------------------------------------------------
// Giz de cera
// -----------------------------------------------------------------------------
export const CRAYON = {
  red: '#d8322a',
  blue: '#2e5fc0',
  lblue: '#5aa0e0',
  green: '#3a9a3a',
  lgreen: '#7ac04a',
  yellow: '#f2c81a',
  orange: '#f08a1a',
  brown: '#8a5228',
  black: '#2a2a2a',
  pink: '#e86a9a',
  purple: '#7a4aa8',
  gray: '#8a8a8a',
  skin: '#e8b48a',
  white: '#ffffff',
};

function waxDot(p: Pix, x: number, y: number, r: number, col: string, rnd: () => number, cover = 0.82): void {
  const R = Math.max(0, r);
  for (let dy = -Math.ceil(R); dy <= Math.ceil(R); dy++)
    for (let dx = -Math.ceil(R); dx <= Math.ceil(R); dx++) {
      if (dx * dx + dy * dy > R * R + 0.6) continue;
      if (rnd() > cover) continue;
      const v = rnd();
      p.px(Math.round(x + dx), Math.round(y + dy), v < 0.12 ? shade(col, 0.22) : v > 0.92 ? shade(col, -0.18) : col);
    }
}

/** traço de giz tremido ao longo de uma polilinha */
function crayon(p: Pix, pts: [number, number][], col: string, w: number, seed: number, o: { closed?: boolean; jitter?: number; cover?: number } = {}): void {
  const rnd = mulberry(seed);
  const jit = o.jitter ?? 0.9;
  const P = o.closed ? [...pts, pts[0]] : pts;
  let k = seed % 97;
  for (let i = 0; i + 1 < P.length; i++) {
    const [ax, ay] = P[i];
    const [bx, by] = P[i + 1];
    const len = Math.max(1, Math.hypot(bx - ax, by - ay));
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    for (let s = 0; s <= len; s += 0.8) {
      const t = s / len;
      const off = Math.sin(k * 0.21) * jit + (rnd() - 0.5) * 0.5;
      k++;
      waxDot(p, ax + (bx - ax) * t + nx * off, ay + (by - ay) * t + ny * off, w / 2, col, rnd, o.cover ?? 0.8);
    }
  }
}

function inPoly(pts: [number, number][], x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** preenchimento rabiscado em zigue-zague, recortado pelo polígono */
function scribble(p: Pix, pts: [number, number][], col: string, seed: number, spacing = 2.2, cover = 0.75): void {
  const rnd = mulberry(seed);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  const span = x1 - x0 + (y1 - y0);
  for (let d = 0; d < span; d += spacing) {
    // diagonal x + y = x0 + y0 + d
    for (let s = 0; s <= y1 - y0 + 1; s += 0.7) {
      const y = y0 + s;
      const x = x0 + d - s + Math.sin((d + s) * 0.7 + seed) * 0.6;
      if (!inPoly(pts, x, y)) continue;
      if (rnd() > cover) continue;
      const v = rnd();
      p.px(Math.round(x), Math.round(y), v < 0.1 ? shade(col, 0.25) : col);
      if (rnd() < 0.5) p.px(Math.round(x) + 1, Math.round(y), col);
    }
  }
}

function rectPts(x: number, y: number, w: number, h: number): [number, number][] {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
}

function circlePts(cx: number, cy: number, r: number, n = 18, ry = r): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * ry]);
  }
  return out;
}

/** letras de criança: usa a fonte 3×5 como esqueleto, em gotas de cera */
function crayonText(p: Pix, text: string, x: number, y: number, col: string, scale: number, seed: number): void {
  const tmp = new Pix(textWidth(text) + 2, 9);
  drawText(tmp, text, 0, 3, '#000000');
  const rnd = mulberry(seed);
  for (let yy = 0; yy < tmp.h; yy++)
    for (let xx = 0; xx < tmp.w; xx++)
      if (tmp.get(xx, yy) >>> 24) waxDot(p, x + xx * scale + (rnd() - 0.5) * 1.2, y + (yy - 3) * scale + (rnd() - 0.5) * 1.2, scale * 0.55, col, rnd, 0.9);
}

function paperSheet(p: Pix, seed: number): void {
  // mesa de madeira e folha sulfite com sombra
  p.rect(0, 0, W, H, HOME.wood);
  for (let y = 0; y < H; y += 9) p.hl(0, W - 1, y, HOME.bg2);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (hash2(x, y, 3) < 0.05) p.px(x, y, HOME.wood2);
  p.rect(16, 9, 296, 168, '#3a2516');
  p.rect(12, 5, 296, 168, '#f4efe2');
  for (let y = 5; y < 173; y++)
    for (let x = 12; x < 308; x++) {
      const n = hash2(x, y, seed);
      if (n < 0.025) p.px(x, y, '#e6dfcc');
      else if (n > 0.992) p.px(x, y, '#ffffff');
    }
  // canto amassado
  p.poly(
    [
      [296, 173],
      [308, 161],
      [308, 173],
    ],
    HOME.wood,
  );
  p.line(296, 172, 307, 161, '#d8ceb8');
}

function crayonHouse(p: Pix, x: number, base: number, w: number, h: number, col: string, roof: string, lit: boolean, seed: number): void {
  const top = base - h;
  scribble(p, rectPts(x, top, w, h), mix(col, '#ffffff', 0.55), seed, 2.6, 0.5);
  crayon(p, rectPts(x, top, w, h), col, 2, seed, { closed: true });
  const roofPts: [number, number][] = [
    [x - 3, top],
    [x + w / 2, top - h * 0.6],
    [x + w + 3, top],
  ];
  scribble(p, roofPts, roof, seed + 1, 2, 0.8);
  crayon(p, roofPts, shade(roof, -0.2), 2, seed + 2, { closed: true });
  // janela: acesa é um quadrado amarelo cheio, com a moldura fininha por cima
  const wx = x + Math.round(w * 0.18);
  const wy = top + Math.round(h * 0.2);
  const ws = Math.max(6, Math.round(w * 0.36));
  if (lit) {
    p.rect(wx + 1, wy + 1, ws - 1, ws - 1, CRAYON.yellow);
    scribble(p, rectPts(wx, wy, ws, ws), '#ffe066', seed + 3, 1.1, 0.7);
  }
  crayon(p, rectPts(wx, wy, ws, ws), lit ? CRAYON.orange : CRAYON.black, 1, seed + 4, { closed: true, jitter: 0.4 });
  if (!lit)
    crayon(
      p,
      [
        [wx + ws / 2, wy],
        [wx + ws / 2, wy + ws],
      ],
      CRAYON.black,
      1.2,
      seed + 5,
    );
  // porta
  const dx = x + w - Math.round(w * 0.38);
  const dh = Math.round(h * 0.5);
  scribble(p, rectPts(dx, base - dh, Math.round(w * 0.26), dh), CRAYON.brown, seed + 6, 1.6, 0.85);
}

/** o Ozzy de giz de cera, feliz: bola laranja, orelhinhas, rabo enrolado, língua de fora */
function crayonDog(p: Pix, cx: number, base: number, seed: number): void {
  // rabo enrolado por cima das costas
  const tail: [number, number][] = [];
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI * (0.9 + i * 0.11);
    const r = 6 - i * 0.25;
    tail.push([cx - 9 + Math.cos(a) * r, base - 15 + Math.sin(a) * r]);
  }
  crayon(p, tail, CRAYON.orange, 3, seed);
  crayon(p, tail, CRAYON.yellow, 1.2, seed + 1);
  // corpo e cabeça
  scribble(p, circlePts(cx - 3, base - 8, 9, 18, 6.5), CRAYON.orange, seed + 2, 1.5, 0.85);
  crayon(p, circlePts(cx - 3, base - 8, 9, 18, 6.5), CRAYON.brown, 1.4, seed + 3, { closed: true });
  scribble(p, circlePts(cx + 7, base - 15, 6), CRAYON.orange, seed + 4, 1.4, 0.9);
  crayon(p, circlePts(cx + 7, base - 15, 6), CRAYON.brown, 1.4, seed + 5, { closed: true });
  // juba creme no peito
  scribble(p, circlePts(cx + 4, base - 8, 4, 12, 3.5), CRAYON.yellow, seed + 6, 1.2, 0.7);
  // orelhinhas
  for (const ex of [cx + 3, cx + 9]) {
    const ear: [number, number][] = [
      [ex - 2, base - 19],
      [ex, base - 25],
      [ex + 2, base - 19],
    ];
    scribble(p, ear, CRAYON.orange, seed + ex, 1, 1);
    crayon(p, ear, CRAYON.brown, 1.2, seed + ex + 1);
  }
  // olhinhos, focinho e língua
  waxDot(p, cx + 5, base - 16, 1, CRAYON.black, mulberry(seed + 7), 1);
  waxDot(p, cx + 10, base - 16, 1, CRAYON.black, mulberry(seed + 8), 1);
  waxDot(p, cx + 8, base - 13, 1.2, CRAYON.black, mulberry(seed + 9), 1);
  waxDot(p, cx + 8, base - 10, 1.1, CRAYON.pink, mulberry(seed + 10), 1);
  // patinhas
  for (const lx of [cx - 8, cx - 2, cx + 3])
    crayon(
      p,
      [
        [lx, base - 3],
        [lx, base + 1],
      ],
      CRAYON.brown,
      2,
      seed + lx,
    );
}

// -----------------------------------------------------------------------------
// Vinhetas
// -----------------------------------------------------------------------------
interface Ctx {
  g: 'M' | 'F';
  blend: number;
}

/** traço reto de giz entre dois pontos */
function stroke(p: Pix, x0: number, y0: number, x1: number, y1: number, col: string, w: number, seed: number): void {
  crayon(
    p,
    [
      [x0, y0],
      [x1, y1],
    ],
    col,
    w,
    seed,
  );
}

function desenhoDavi(p: Pix, c: Ctx): void {
  // o desenho do Liam: você na mesa, de fone na orelha, no meio de casinhas com
  // a luz acesa, ligadas ao telefone por fios pontilhados. A faixa de cima fica
  // livre para o título escrito pela UI; o miolo fica na metade de cima (a caixa
  // de texto do final cobre o meio de baixo).
  paperSheet(p, 11);
  // lua minguante e estrelas nos cantos de cima
  const moon: [number, number][] = [];
  for (let i = 0; i <= 16; i++) {
    const a = -Math.PI / 2 + (i / 16) * Math.PI;
    moon.push([286 + Math.cos(a) * 10, 30 + Math.sin(a) * 10]);
  }
  for (let i = 16; i >= 0; i--) {
    const a = -Math.PI / 2 + (i / 16) * Math.PI;
    moon.push([283 + Math.cos(a) * 5, 30 + Math.sin(a) * 9]);
  }
  scribble(p, moon, CRAYON.yellow, 21, 1.4, 0.95);
  crayon(p, moon, CRAYON.orange, 1.4, 22, { closed: true });
  for (const [x, y] of [
    [30, 26],
    [258, 46],
    [300, 60],
    [62, 22],
  ] as [number, number][]) {
    stroke(p, x - 3, y, x + 3, y, CRAYON.yellow, 1.4, x);
    stroke(p, x, y - 3, x, y + 3, CRAYON.yellow, 1.4, y);
  }
  // chão verde com graminha
  const ground: [number, number][] = [];
  for (let x = 18; x <= 302; x += 8) ground.push([x, 104 + Math.sin(x / 19) * 2]);
  crayon(p, ground, CRAYON.green, 2.4, 31);
  for (let x = 22; x < 300; x += 11) stroke(p, x, 104, x + 2, 98, CRAYON.lgreen, 1.4, x);
  // casinhas com as luzes acesas, em arco em volta da mesa
  const houses: [number, number, number, number, string, string][] = [
    [20, 72, 24, 20, CRAYON.blue, CRAYON.red],
    [54, 58, 22, 18, CRAYON.orange, CRAYON.brown],
    [86, 50, 20, 16, CRAYON.green, CRAYON.red],
    [24, 102, 28, 22, CRAYON.purple, CRAYON.red],
    [62, 100, 24, 20, CRAYON.red, CRAYON.brown],
    [214, 50, 20, 16, CRAYON.purple, CRAYON.brown],
    [244, 64, 24, 20, CRAYON.green, CRAYON.red],
    [276, 86, 26, 22, CRAYON.pink, CRAYON.brown],
    [232, 102, 26, 22, CRAYON.blue, CRAYON.red],
  ];
  houses.forEach(([x, b, w, h, col, roof], i) => crayonHouse(p, x, b, w, h, col, roof, true, 100 + i * 17));
  // "fios" de telefone pontilhados, do telefone até a janela de cada casa
  const phone = { x: 160, y: 74 };
  for (const [x, b, w, h] of houses) {
    const hx = x + Math.round(w * 0.18) + 2;
    const hy = b - h + Math.round(h * 0.2) + 2;
    const n = 16;
    for (let i = 1; i < n; i += 2) {
      const tt = i / n;
      const mx = phone.x + (hx - phone.x) * tt;
      const my = phone.y + (hy - phone.y) * tt - Math.sin(tt * Math.PI) * 12;
      waxDot(p, mx, my, 0.9, CRAYON.yellow, mulberry(i + hx), 0.95);
    }
  }
  // mesa
  stroke(p, 120, 80, 200, 80, CRAYON.brown, 3.4, 41);
  stroke(p, 126, 81, 126, 104, CRAYON.brown, 2.6, 42);
  stroke(p, 194, 81, 194, 104, CRAYON.brown, 2.6, 43);
  // você: corpo de pijama verde
  const body: [number, number][] = [
    [145, 54],
    [175, 54],
    [182, 79],
    [138, 79],
  ];
  scribble(p, body, CRAYON.green, 51, 1.8, 0.85);
  crayon(p, body, shade(CRAYON.green, -0.25), 1.8, 52, { closed: true });
  // cabeça grande, sorrindo
  scribble(p, circlePts(160, 39, 13), CRAYON.skin, 53, 1.6, 0.7);
  crayon(p, circlePts(160, 39, 13), '#b97b52', 1.8, 54, { closed: true });
  if (c.g === 'M')
    crayon(
      p,
      [
        [147, 35],
        [149, 28],
        [155, 25],
        [165, 25],
        [171, 29],
        [173, 35],
      ],
      CRAYON.black,
      3,
      55,
    );
  else {
    crayon(
      p,
      [
        [147, 40],
        [148, 29],
        [155, 25],
        [165, 25],
        [172, 30],
        [173, 38],
      ],
      CRAYON.black,
      3,
      55,
    );
    scribble(p, circlePts(145, 44, 4), CRAYON.black, 56, 1.2, 0.9);
  }
  waxDot(p, 155, 38, 1.2, CRAYON.black, mulberry(1), 1);
  waxDot(p, 165, 38, 1.2, CRAYON.black, mulberry(2), 1);
  crayon(
    p,
    [
      [153, 44],
      [157, 47],
      [163, 47],
      [167, 44],
    ],
    CRAYON.red,
    1.4,
    57,
  );
  // braço com o fone na orelha
  crayon(
    p,
    [
      [175, 58],
      [182, 50],
      [176, 42],
    ],
    CRAYON.green,
    2.6,
    58,
  );
  scribble(p, rectPts(171, 35, 6, 13), CRAYON.red, 59, 1.2, 0.95);
  // telefone vermelho na mesa + fio enrolado
  scribble(p, rectPts(146, 67, 22, 12), CRAYON.red, 61, 1.4, 0.9);
  crayon(p, rectPts(146, 67, 22, 12), shade(CRAYON.red, -0.3), 1.6, 62, { closed: true });
  crayon(p, circlePts(157, 73, 3.5, 10), CRAYON.black, 1.2, 63, { closed: true });
  const coil: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const tt = i / 24;
    coil.push([168 + tt * 6 + Math.cos(i * 1.4) * 2, 71 - tt * 22 + Math.sin(i * 1.4) * 2]);
  }
  crayon(p, coil, CRAYON.black, 1, 64, { jitter: 0.2 });
  // ondinhas de som
  crayon(
    p,
    [
      [184, 33],
      [187, 37],
      [184, 41],
    ],
    CRAYON.black,
    1.2,
    65,
  );
  crayon(
    p,
    [
      [189, 30],
      [193, 37],
      [189, 44],
    ],
    CRAYON.black,
    1.2,
    66,
  );
  // coração
  const heart: [number, number][] = [
    [200, 24],
    [196, 20],
    [196, 16],
    [200, 14],
    [203, 17],
    [206, 14],
    [210, 16],
    [210, 20],
    [203, 28],
  ];
  scribble(p, heart, CRAYON.red, 71, 1.2, 0.95);
  // a rua cinza e a ambulância correndo nela, à esquerda
  const road: [number, number][] = [
    [16, 112],
    [304, 112],
    [304, 128],
    [16, 128],
  ];
  scribble(p, road, '#b8b8b0', 91, 2.4, 0.55);
  for (let x = 24; x < 300; x += 22) stroke(p, x, 120, x + 10, 120, CRAYON.yellow, 1.6, 92 + x);
  const ax = 18;
  const ay = 110;
  scribble(p, rectPts(ax, ay, 30, 13), '#fdfdf8', 81, 1.4, 0.4);
  crayon(p, rectPts(ax, ay, 30, 13), CRAYON.black, 1.8, 82, { closed: true });
  crayon(
    p,
    [
      [ax + 30, ay + 4],
      [ax + 38, ay + 7],
      [ax + 38, ay + 13],
      [ax + 30, ay + 13],
    ],
    CRAYON.black,
    1.8,
    83,
  );
  scribble(p, rectPts(ax + 10, ay + 3, 6, 6), CRAYON.red, 84, 1, 1);
  scribble(p, circlePts(ax + 8, ay + 14, 3.2, 10), CRAYON.black, 85, 1, 1);
  scribble(p, circlePts(ax + 30, ay + 14, 3.2, 10), CRAYON.black, 86, 1, 1);
  waxDot(p, ax + 4, ay - 3, 2, CRAYON.red, mulberry(9), 1);
  waxDot(p, ax + 9, ay - 3, 2, CRAYON.blue, mulberry(10), 1);
  // o Ozzy, de rabo abanando, no canto direito (fora da caixa de texto do final)
  crayonDog(p, 287, 152, 301);
  // assinatura
  crayonText(p, SON_NAME.toUpperCase(), 258, 160, CRAYON.blue, 2, 77);
}

function desenhoCadeira(p: Pix, c: Ctx): void {
  // o outro desenho do Liam: você atrás de uma mesa enorme, sem telefone; o
  // "94" na parede, o ar-condicionado soprando frio, as casinhas apagadas na
  // janela. Ele mesmo, pequenininho, olhando do canto. Tudo em cinza.
  paperSheet(p, 12);
  const g = CRAYON.gray;
  // chão cinza
  stroke(p, 18, 150, 302, 148, g, 2.2, 11);
  // janela com as casinhas apagadas
  crayon(p, rectPts(226, 20, 62, 46), CRAYON.black, 2, 12, { closed: true });
  stroke(p, 257, 20, 257, 66, CRAYON.black, 1.6, 13);
  for (const [x, b] of [
    [232, 62],
    [260, 60],
    [274, 63],
  ] as [number, number][])
    crayonHouse(p, x, b, 12, 12, g, CRAYON.gray, false, x);
  // painel com o 94
  crayon(p, rectPts(32, 22, 64, 38), CRAYON.black, 2, 21, { closed: true });
  crayon(p, circlePts(51, 34, 5.5, 14), CRAYON.red, 2.4, 22, { closed: true });
  crayon(
    p,
    [
      [56.5, 34],
      [56, 44],
      [52, 50],
    ],
    CRAYON.red,
    2.4,
    24,
  );
  crayon(
    p,
    [
      [72, 26],
      [65, 42],
      [78, 42],
    ],
    CRAYON.red,
    2.4,
    25,
  );
  stroke(p, 75, 32, 75, 51, CRAYON.red, 2.4, 26);
  crayon(
    p,
    [
      [38, 56],
      [52, 50],
      [66, 52],
      [90, 28],
    ],
    CRAYON.green,
    1.4,
    23,
  );
  // ar-condicionado soprando frio em cima da cadeira
  crayon(p, rectPts(134, 18, 52, 12), CRAYON.black, 1.8, 31, { closed: true });
  for (let i = 0; i < 4; i++)
    crayon(
      p,
      [
        [142 + i * 12, 34],
        [140 + i * 12, 40],
        [143 + i * 12, 46],
      ],
      CRAYON.lblue,
      1.2,
      32 + i,
    );
  // cadeira grande atrás
  scribble(p, rectPts(144, 50, 32, 34), '#5a6070', 41, 2.4, 0.6);
  crayon(p, rectPts(144, 50, 32, 34), CRAYON.black, 1.6, 47, { closed: true });
  // você atrás da mesa, sem telefone, boca reta (o rosto por cima do papel, não da cadeira)
  p.disc(160, 66, 8, '#f4efe2');
  scribble(p, circlePts(160, 66, 8), CRAYON.skin, 42, 1.4, 0.75);
  crayon(p, circlePts(160, 66, 8), '#b97b52', 1.4, 43, { closed: true });
  if (c.g === 'F') scribble(p, circlePts(151, 69, 2.8), CRAYON.black, 44, 1, 1);
  crayon(
    p,
    [
      [152, 62],
      [155, 58],
      [165, 58],
      [168, 62],
    ],
    CRAYON.black,
    2,
    45,
  );
  waxDot(p, 157, 66, 0.9, CRAYON.black, mulberry(3), 1);
  waxDot(p, 163, 66, 0.9, CRAYON.black, mulberry(4), 1);
  stroke(p, 157, 71, 163, 71, CRAYON.black, 1, 46);
  // mesa enorme
  const desk: [number, number][] = rectPts(70, 76, 180, 50);
  scribble(p, desk, g, 51, 1.6, 0.9);
  crayon(p, desk, CRAYON.black, 2.6, 52, { closed: true });
  // o Liam pequenininho olhando, do canto esquerdo
  scribble(p, circlePts(36, 106, 5), CRAYON.skin, 61, 1.2, 0.7);
  crayon(p, circlePts(36, 106, 5), '#b97b52', 1.2, 62, { closed: true });
  stroke(p, 36, 111, 36, 124, CRAYON.blue, 3, 63);
  stroke(p, 36, 124, 32, 132, CRAYON.black, 1.4, 64);
  stroke(p, 36, 124, 40, 132, CRAYON.black, 1.4, 65);
  stroke(p, 34, 109, 38, 109, CRAYON.black, 1, 66);
  crayonText(p, SON_NAME.toUpperCase(), 258, 160, g, 2, 78);
}

function crachaPrego(p: Pix, c: Ctx, sway = 0): void {
  // porta da cozinha em close (tábuas, almofadas, luz vindo da esquerda)
  p.rect(0, 0, W, H, HOME.wood2);
  for (let x = 0; x < 286; x += 22) {
    p.vl(x, 0, H - 1, HOME.wood);
    p.vl(x + 1, 0, H - 1, shade(HOME.wood2, 0.12));
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < 286; x++) if (hash2(x, y, 19) < 0.05) p.px(x, y, shade(HOME.wood2, -0.1));
  p.frame(24, 12, 80, 74, HOME.wood);
  p.frame(25, 13, 78, 72, HOME.tan);
  p.frame(204, 12, 74, 74, HOME.wood);
  p.frame(205, 13, 72, 72, HOME.tan);
  p.frame(24, 102, 80, 70, HOME.wood);
  p.frame(204, 102, 74, 70, HOME.wood);
  // marcas de uso em volta do prego (o crachá pendurado ali todo dia)
  p.px(150, 14, shade(HOME.wood2, -0.15));
  p.px(156, 15, shade(HOME.wood2, -0.15));
  p.px(153, 17, shade(HOME.wood2, -0.12));
  // batente e parede à direita
  p.rect(286, 0, 8, H, HOME.wood);
  p.rect(294, 0, 26, H, HOME.wall);
  p.vl(294, 0, H - 1, HOME.wall2);
  p.rect(288, 30, 4, 12, '#b8bcb8');
  p.rect(288, 128, 4, 12, '#b8bcb8');
  // luz quente vindo da esquerda (lâmpada da cozinha)
  p.glow(-20, 40, 260, HOME.lampLight, 0.32, 5);
  // prego (alto na porta: o crachá inteiro fica acima da caixa de texto do final)
  const nx = 152;
  const ny = 8;
  p.rect(nx, ny, 3, 3, '#2a2420');
  p.px(nx, ny, '#a8a098');
  // cordão (alça azul da Regulação)
  const bx = 114 + sway;
  const by = 30;
  const cw = 72;
  const strap = (x0: number, y0: number, x1: number, y1: number) => {
    p.line(x0, y0, x1, y1, '#1f2b52');
    p.line(x0 + 1, y0, x1 + 1, y1, '#2a3a6a');
    p.line(x0 + 2, y0, x1 + 2, y1, '#2a3a6a');
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 4; i < n; i += 6) p.px(Math.round(x0 + 1 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), '#e6efd9');
  };
  strap(nx - 1, ny + 2, bx + 24, by - 4);
  strap(nx + 1, ny + 2, bx + 46, by - 4);
  // sombra do crachá na porta
  p.recta(bx + 5, by + 4, cw + 2, 88, '#1a0f08', 0.35);
  // presilha
  p.rect(bx + 30, by - 6, 12, 8, '#9aa49e');
  p.rect(bx + 32, by - 4, 8, 4, '#5a6460');
  // cartão
  p.rect(bx, by, cw, 86, '#cfd6cc');
  p.rect(bx + 2, by + 2, cw - 4, 82, '#f2f5ee');
  p.rect(bx + 2, by + 2, cw - 4, 15, '#c8302a');
  p.hl(bx + 2, bx + cw - 3, by + 2, '#e8584a');
  const t1 = 'REGULAÇÃO';
  drawText(p, t1, bx + Math.floor(cw / 2) - Math.floor(textWidth(t1) / 2), by + 7, '#ffffff');
  // foto (retrato do protagonista)
  // retrato 64×64 reduzido 2:1 para a foto 3×4 do crachá
  const face = portraitThumbPix(c.g === 'F' ? 'EU_F' : 'EU_M', 'neutro', { bg: true });
  p.rect(bx + 5, by + 21, 28, 34, '#8a948f');
  p.blit(face.crop(3, 0, 26, 32), bx + 6, by + 22);
  // nome e função
  const name1 = c.g === 'F' ? 'DRA.' : 'DR.';
  const name2 = PROTAGONIST_FIRST[c.g].toUpperCase();
  drawText(p, name1, bx + 37, by + 24, '#1b1a17');
  drawText(p, name2, bx + 37, by + 31, '#1b1a17');
  drawText(p, 'MOURA', bx + 37, by + 38, '#1b1a17');
  drawText(p, c.g === 'F' ? 'MÉDICA' : 'MÉDICO', bx + 37, by + 48, '#5f7a6c');
  drawText(p, c.g === 'F' ? 'REGULADORA' : 'REGULADOR', bx + 6, by + 59, '#5f7a6c');
  // código de barras e matrícula
  for (let i = 0; i < 44; i++) if (hash2(i, 3, 5) < 0.6) p.vl(bx + 8 + i, by + 66, by + 73, '#1b1a17');
  drawText(p, 'MAT 0417-4', bx + 8, by + 76, '#5f7a6c');
  // logo Saúde+ Gestão
  p.rect(bx + cw - 13, by + 72, 8, 8, '#2f8f86');
  p.rect(bx + cw - 10, by + 73, 2, 6, '#ffffff');
  p.rect(bx + cw - 12, by + 75, 6, 2, '#ffffff');
  // reflexo no plástico
  p.line(bx + 44, by + 18, bx + 66, by + 40, '#ffffff', 0.25);
  p.line(bx + 46, by + 18, bx + 67, by + 39, '#ffffff', 0.15);
  // escurecer cantos
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = (x - 140) / 190;
      const dy = (y - 90) / 120;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 0.75 && bayerOn(x, y, Math.min(1, (d - 0.75) * 1.6))) p.pxa(x, y, HOME.bg0, 0.4);
    }
}

function calcadaMoveis(p: Pix, c: Ctx, t: number): void {
  // o despejo: a casa azul de porta fechada com o aviso colado, a mudança na
  // calçada de pedra portuguesa e o cônjuge com o Liam no meio das coisas (ele
  // aperta contra o peito o desenho da ambulância). O Ozzy não aparece.
  half(p, (s) => {
    const k = 'q' + c.blend;
    // céu de fim de tarde, beiral e fachada
    s.vgrad(0, 0, 160, 8, ['#7aa8d8', '#e8b888'], 0.6);
    s.rect(0, 6, 160, 4, '#8a4a34');
    for (let x = 0; x < 160; x += 4) s.vl(x, 6, 9, '#6a3424');
    s.hl(0, 159, 10, '#4a2418');
    s.rect(0, 11, 160, 30, '#7d9cc0');
    for (let y = 11; y < 41; y++) for (let x = 0; x < 160; x++) if (hash2(x, y, 77) < 0.05) s.px(x, y, '#8aa8c8');
    // janela fechada
    s.rect(8, 15, 26, 18, '#4a3a2a');
    s.rect(10, 17, 22, 14, '#2a3644');
    for (let x = 12; x < 32; x += 4) s.vl(x, 17, 30, '#1e1a18');
    s.rect(7, 33, 28, 2, '#d8d0c0');
    // porta fechada com o aviso de despejo, e o número 40
    s.rect(66, 14, 18, 27, '#3a2414');
    s.rect(68, 16, 14, 25, HOME.wood2);
    s.rect(70, 20, 9, 11, '#f4f0e6');
    s.rect(70, 20, 9, 2, '#c8302a');
    for (let y = 23; y < 30; y += 2) s.hl(71, 77, y, '#8a948f');
    housePlate(s, 88, 18);
    // muro baixo, aberto no portão
    s.rect(0, 40, 160, 8, '#e6e1d4');
    s.hl(0, 159, 40, '#ffffff');
    s.hl(0, 159, 47, '#b8b2a4');
    s.rect(64, 40, 22, 8, '#8a3e2c');
    // calçada de pedra portuguesa
    s.rect(0, 48, 160, 42, '#e2ddd2');
    for (let y = 48; y < 90; y++)
      for (let x = 0; x < 160; x++) {
        const wv = Math.sin((x / 160) * Math.PI * 5) * 3;
        if (Math.abs(((y - 48 + wv + 200) % 9) - 4.5) < 0.6) s.px(x, y, '#7a766e');
      }
    // a mudança: sofá, caixas com a máquina de costura, geladeira, colchão, cadeiras
    const sofa = HOME.fabricBlue;
    floorShadow(s, 22, 66, 22, 2, 0.4);
    s.rect(3, 46, 38, 8, sofa);
    s.hl(3, 40, 46, shade(sofa, 0.25));
    s.rect(3, 54, 38, 4, shade(sofa, 0.12));
    s.rect(3, 58, 38, 5, shade(sofa, -0.22));
    s.rect(0, 50, 4, 13, shade(sofa, -0.05));
    s.rect(40, 50, 4, 13, shade(sofa, -0.32));
    s.vl(2, 63, 65, HOME.wood);
    s.vl(41, 63, 65, HOME.wood);
    floorShadow(s, 56, 67, 12, 1.8, 0.4);
    cardBox(s, 46, 54, 22, 12);
    cardBox(s, 49, 45, 16, 9);
    sewingMachine(s, 45, 29);
    fridge(s, 118, 28, 'ok', false);
    s.rect(144, 22, 14, 42, '#e8dcc4');
    for (let y = 26; y < 62; y += 5) for (let x = 146; x < 157; x += 5) s.px(x, y, '#c8b898');
    s.vl(157, 22, 63, '#b8a888');
    floorShadow(s, 151, 65, 8, 1.4, 0.35);
    woodChair(s, 102, 40);
    // o cônjuge e o Liam (com o desenho da ambulância apertado no peito)
    const map = s.map;
    const sp = graded(s, figurePix(c.g === 'F' ? 'ALEX' : 'LUCIA', 'em_pe', { status: 'triste', blink: (t + 700) % 4400 < 140 }), k);
    floorShadow(s, 86, 66, 8, 1.4, 0.35);
    s.blit(sp, 86 - Math.floor(sp.w / 2), 66 - sp.h + 1);
    const lv = graded(s, figurePix('DAVI', 'em_pe', { status: 'triste', blink: t % 3900 < 140 }), k);
    const fx = 74 - Math.floor(lv.w / 2);
    const fy = 67 - lv.h + 1;
    floorShadow(s, 74, 67, 6, 1.2, 0.35);
    s.blit(lv, fx, fy);
    const draw = new Pix(10, 9).setMap(map);
    draw.rect(0, 0, 10, 9, '#f4efe2');
    draw.frame(0, 0, 10, 9, '#d8ceb8');
    draw.rect(2, 3, 6, 3, '#ffffff');
    draw.frame(2, 3, 6, 3, '#2a2a2a');
    draw.px(4, 4, '#d8322a');
    draw.px(3, 6, '#2a2a2a');
    draw.px(7, 6, '#2a2a2a');
    s.blit(draw, fx + 1, fy + 10);
    s.px(fx + 1, fy + 14, '#b97b52');
    s.px(fx + 2, fy + 15, '#b97b52');
    s.px(fx + 10, fy + 14, '#9a6340');
    s.px(fx + 9, fy + 15, '#9a6340');
    // sol baixo vindo da esquerda e os cantos mais escuros
    s.glow(-20, 10, 140, '#ffd8a0', 0.16, 4);
    darkBands(s, 80, 40, 110, 70, '#1a1a20', 0.4, 0.62);
  });
}

function telefoneEscuro(p: Pix, c: Ctx, t: number): void {
  // a mesa no escuro e o telefone tocando, alto no quadro (a caixa de texto
  // cobre o meio de baixo); a mão que não obedece vem da direita
  p.clear('#060908');
  p.vgrad(0, 70, W, 110, ['#0a110e', '#0d1513'], 0.6);
  for (let y = 70; y < H; y++) for (let x = 0; x < W; x++) if (hash2(x, y, 13) < 0.03) p.px(x, y, '#121c18');
  p.hl(0, W - 1, 70, '#16201c');
  // brilho frio de um monitor apagando, lá em cima
  p.glow(160, -10, 120, '#5f7a6c', 0.12, 3);
  // telefone 3×
  const ph = new Pix(46, 30);
  deskPhone(ph, 3, 2, true, t);
  const big = ph.scaled(3);
  const ox = 160 - Math.floor(big.w / 2);
  const oy = 6;
  const ringing = Math.floor(t / 250) % 2 === 0;
  p.glow(ox + 31 * 3, oy + 17 * 3, 50, '#ff4a3a', ringing ? 0.3 : 0.1, 4);
  p.blit(big, ox, oy);
  // escurece o telefone (sala no escuro), menos a luz da linha: só onde há telefone
  for (let y = oy; y < oy + big.h; y++)
    for (let x = ox; x < ox + big.w; x++) {
      if (((big.get(x - ox, y - oy) >>> 24) & 255) < 200) continue;
      const v = p.get(x, y);
      const r = v & 255;
      const isLight = r > 200 && ((v >>> 8) & 255) < 120;
      if (!isLight) p.pxa(x, y, '#060908', 0.5);
    }
  // marcas de vibração
  if (Math.floor(t / 120) % 2 === 0) {
    for (const [x, y, d] of [
      [ox - 8, oy + 10, -1],
      [ox + big.w + 6, oy + 10, 1],
    ] as [number, number, number][]) {
      p.line(x, y, x + d * 4, y - 4, '#8a3a32');
      p.line(x + d * 2, y + 8, x + d * 7, y + 6, '#8a3a32');
    }
  }
  // a mão que não obedece, parada a um palmo do fone
  const hx = 250;
  const hy = 52;
  const skin = '#6a5a4c';
  const skinS = '#4a3e34';
  p.ellipse(hx + 18, hy + 14, 18, 11, skin);
  p.ellipse(hx + 22, hy + 18, 14, 7, skinS, 0.6);
  for (let i = 0; i < 4; i++) {
    const fy = hy + 4 + i * 5;
    p.rect(hx - 10 + i * 2, fy, 16 - i * 2, 4, skin);
    p.hl(hx - 10 + i * 2, hx + 4, fy + 3, skinS);
    p.px(hx - 10 + i * 2, fy + 1, '#7a6a5a');
  }
  p.rect(hx + 6, hy - 2, 10, 5, skin);
  p.rect(hx + 30, hy + 4, 40, 22, '#1a2420');
  p.hl(hx + 30, hx + 69, hy + 4, '#26352f');
  // vinheta forte, em faixas
  darkBands(p, 160, 52, 180, 110, '#000000', 0.7, 0.45);
}

function gaveta(p: Pix, c: Ctx): void {
  const s = new Pix(160, 90);
  // tampo da mesa
  s.rect(0, 0, 160, 90, '#26352f');
  for (let y = 0; y < 90; y++) for (let x = 0; x < 160; x++) if (hash2(x, y, 7) < 0.04) s.px(x, y, '#2f4139');
  // a frente da mesa embaixo da gaveta
  s.rect(0, 76, 160, 14, '#1a2420');
  s.hl(0, 159, 76, '#3d5248');
  s.rect(0, 10, 160, 4, '#1a2420');
  s.hl(0, 159, 10, '#3d5248');
  // gaveta aberta
  s.rect(22, 14, 98, 60, '#3a3430');
  s.rect(24, 16, 94, 56, '#5a5048');
  s.rect(26, 18, 90, 52, '#6a6058');
  s.hl(24, 117, 16, '#7a7068');
  s.rect(22, 70, 98, 6, '#2a2420');
  s.rect(62, 72, 18, 2, '#9aa49e');
  // conteúdo: manual, diário, caneta da farmácia, post-its, clipes
  manualBinder(s, 30, 22, 22, 30);
  s.rect(58, 26, 22, 28, '#6a3a22');
  s.rect(58, 26, 3, 28, '#4a2814');
  s.hl(58, 79, 26, '#8a5232');
  s.vl(74, 26, 60, '#c8302a');
  s.px(75, 60, '#c8302a');
  s.rect(63, 32, 12, 4, '#efe6cf');
  s.line(84, 56, 104, 44, '#f4f4ee');
  s.line(84, 57, 104, 45, '#d8d8d0');
  s.px(97, 48, '#3a9a3a');
  s.px(98, 48, '#3a9a3a');
  s.px(104, 44, '#2a2a2a');
  postit(s, 90, 22, CENTRAL.postit, 3);
  postit(s, 100, 30, '#f2a0b8', 4);
  for (const [x, y] of [
    [36, 58],
    [44, 62],
    [104, 60],
  ] as [number, number][]) {
    s.frame(x, y, 4, 3, '#b8c4c0');
  }
  // caixa de papelão com as coisas indo embora
  s.rect(126, 20, 32, 52, '#a87a48');
  s.rect(128, 22, 28, 48, '#c49a62');
  s.hl(126, 157, 20, '#d8b47a');
  s.rect(130, 16, 8, 8, '#e6efd9');
  s.rect(138, 14, 10, 10, '#3d5248');
  s.px(141, 17, '#7fd17a');
  s.rect(146, 17, 8, 6, '#efe6cf');
  // porta-retrato virado para baixo, em cima do tampo
  s.rect(100, 1, 18, 8, '#5a3a22');
  s.rect(101, 2, 16, 6, '#7a5030');
  s.hl(101, 116, 5, '#5a3a22');
  p.blit(s.scaled(2), 0, 0);
  // luz fria de cima
  p.glow(160, -20, 200, '#e6efd9', 0.12, 4);
  darkBands(p, 160, 70, 190, 120, '#0d1311', 0.55, 0.6);
}

function quartoAlugado(p: Pix, c: Ctx, t: number): void {
  // seis meses depois: um quarto alugado, você sentado na beira da cama de
  // solteiro com a mão no peito; a única luz é a tela do celular ligando para a
  // emergência (e a lâmpada pelada, fraca). Chuva na janela.
  half(p, (s) => {
    // parede descascando e piso gasto
    const wall = '#6f7f78';
    s.rect(0, 0, 160, 58, wall);
    for (let y = 0; y < 58; y++) for (let x = 0; x < 160; x++) if (hash2(x, y, 23) < 0.06) s.px(x, y, '#66766f');
    for (const [x, y, w, h] of [
      [20, 10, 12, 6],
      [92, 20, 8, 10],
      [52, 6, 10, 4],
    ] as [number, number, number, number][]) {
      s.ellipse(x, y, w / 2, h / 2, '#98a49a');
      s.ellipse(x + 1, y + 1, w / 2 - 1.5, h / 2 - 1.5, '#b4bcae');
    }
    s.line(150, 0, 146, 12, '#55625c');
    s.line(146, 12, 150, 20, '#55625c');
    s.rect(0, 56, 160, 2, '#3e4a44');
    s.rect(0, 58, 160, 32, '#45514b');
    for (let y = 62; y < 90; y += 6) s.hl(0, 159, y, '#3e4a44');
    for (let y = 58; y < 90; y++) for (let x = 0; x < 160; x++) if (hash2(x, y, 29) < 0.03) s.px(x, y, '#505e57');
    // janela com chuva e as luzes da cidade
    s.rect(110, 8, 38, 28, '#0f1626');
    for (let i = 0; i < 6; i++) {
      const bx = 111 + i * 6;
      const bh = 6 + Math.floor(hash2(i, 1, 4) * 12);
      s.rect(bx, 36 - bh, 5, bh, '#1a2236');
      if (hash2(i, 2, 4) < 0.7) s.px(bx + 2, 36 - bh + 2, '#9fb8d0');
      if (hash2(i, 3, 4) < 0.4) s.px(bx + 1, 36 - bh + 5, '#e8c070');
    }
    s.frame(108, 6, 42, 32, '#55625c');
    s.vl(129, 7, 36, '#55625c');
    s.rect(106, 38, 46, 2, '#7a867f');
    // lâmpada pelada, fraca
    s.vl(64, 0, 9, '#1e2420');
    s.rect(63, 9, 3, 2, '#2e3430');
    s.rect(62, 11, 5, 3, '#c4d4c0');
    // mesinha com o fogareiro e a mochila no chão
    s.rect(8, 40, 22, 2, '#5a4a3a');
    s.vl(9, 42, 58, '#4a3a2a');
    s.vl(28, 42, 58, '#4a3a2a');
    s.rect(11, 35, 9, 5, '#2a2a2a');
    s.ellipse(15, 35, 3, 1, '#4a4a4a');
    s.rect(22, 36, 5, 4, '#b8bcb8');
    s.rect(118, 52, 12, 13, '#3a4a5a');
    s.rect(120, 49, 8, 4, '#2a3a4a');
    s.hl(118, 129, 57, '#2a3a4a');
    floorShadow(s, 124, 65, 8, 1.5, 0.4);
    // cama de solteiro com cobertor cinza e o travesseiro murcho
    const bx0 = 34;
    const bx1 = 104;
    s.rect(bx0, 44, bx1 - bx0, 6, '#d8dcd4');
    s.rect(bx0, 44, 14, 5, '#eef0ea');
    s.rect(bx0 + 14, 45, bx1 - bx0 - 14, 5, '#7a8480');
    s.hl(bx0 + 14, bx1 - 1, 45, '#8f9a94');
    for (const fx of [58, 74, 90]) s.line(fx, 46, fx + 3, 49, '#68726e');
    s.rect(bx0, 50, bx1 - bx0, 4, '#626c68');
    s.rect(bx0, 54, bx1 - bx0, 3, '#3a3430');
    s.vl(bx0 + 1, 57, 60, '#3a3430');
    s.vl(bx1 - 2, 57, 60, '#3a3430');
    floorShadow(s, (bx0 + bx1) / 2, 61, 36, 2, 0.4);
    // o celular aceso em cima da cama, ligando
    const cx = 80;
    const cy = 38;
    s.rect(cx, cy, 13, 9, '#1a1a1a');
    s.rect(cx + 1, cy + 1, 11, 7, '#cfe8f4');
    drawText(s, 'SOS', cx + 1, cy + 2, '#c8302a', { spacing: 1 });
    // você, sentado na beira da cama, mão no peito
    const id = c.g === 'F' ? 'EU_F' : 'EU_M';
    const breathe = Math.sin(t / 900) > 0.5;
    const fig = graded(s, figurePix(id, 'sentado', { status: 'triste', inhale: breathe, blink: t % 4100 < 140 }), 'q' + c.blend);
    const fx = 60 - Math.floor(fig.w / 2);
    const fy = 59 - fig.h + 1;
    s.blit(fig, fx, fy);
    s.px(fx + 7, fy + 15, '#d9a57e');
    s.px(fx + 8, fy + 15, '#d9a57e');
    s.px(fx + 8, fy + 16, '#b98a62');
    // luz: a tela do celular e a lâmpada fraca
    s.glow(64, 13, 70, '#c4d4c0', 0.12, 4);
    const pulse = 0.2 + 0.08 * Math.sin(t / 300);
    s.glow(cx + 6, cy + 4, 26, '#cfe8f4', pulse, 4);
    // chuva na janela
    for (let i = 0; i < 12; i++) {
      const x = 110 + ((i * 37 + Math.floor(t / 16)) % 38);
      const y = 8 + ((i * 23 + Math.floor(t / 9)) % 28);
      s.pxa(x, y, '#9fb8d0', 0.6);
      s.pxa(x - 1, y - 1, '#9fb8d0', 0.35);
    }
    // escuro nos cantos
    darkBands(s, 72, 40, 96, 58, '#05080a', 0.6, 0.5);
  });
}

function escritorioAr(p: Pix, c: Ctx, t: number): void {
  // a cadeira: você atrás da mesa executiva, sem telefone, no frio do
  // ar-condicionado; atrás, o painel do índice 94 e a janela de persiana
  half(p, (s) => {
    // parede fria e carpete
    s.rect(0, 0, 160, 50, '#46545f');
    for (let y = 0; y < 50; y += 5) s.hl(0, 159, y, '#424f59');
    s.rect(0, 48, 160, 2, '#2e3a44');
    s.rect(0, 50, 160, 40, '#343f4b');
    for (let y = 50; y < 90; y++) for (let x = 0; x < 160; x++) if ((x + y * 3) % 7 === 0) s.px(x, y, '#3a4652');
    // janela grande de persiana, com a cidade
    s.rect(110, 4, 46, 38, '#a8c4d8');
    for (let i = 0; i < 6; i++) s.rect(111 + i * 8, 24 - Math.floor(hash2(i, 1, 5) * 14), 7, 30, '#7f9ab0');
    for (let y = 5; y < 42; y += 2) s.hl(110, 155, y, '#d8e4ec');
    s.frame(109, 3, 48, 40, '#8a9aa8');
    s.rect(108, 43, 50, 2, '#9aa8b4');
    // ar-condicionado em cima da cadeira, soprando frio em você
    s.rect(62, 3, 36, 9, '#eef2f4');
    s.hl(62, 97, 3, '#ffffff');
    s.hl(64, 95, 9, '#b8c4cc');
    s.hl(64, 95, 10, '#b8c4cc');
    s.px(94, 5, '#7fd17a');
    for (let i = 0; i < 4; i++) {
      const ph = ((t / 1400 + i / 4) % 1 + 1) % 1;
      const y = 13 + Math.floor(ph * 12);
      s.pxa(67 + i * 8 + Math.floor(ph * 3), y, '#e6f4fb', 0.55 * (1 - ph));
      s.pxa(68 + i * 8 + Math.floor(ph * 3), y + 1, '#e6f4fb', 0.35 * (1 - ph));
    }
    // painel de metas na parede da esquerda: o índice 94
    const mx = 8;
    const my = 12;
    s.rect(mx - 2, my - 2, 52, 30, '#14181c');
    s.rect(mx, my, 48, 26, '#0f1a20');
    let prev = my + 22;
    for (let i = 0; i < 24; i += 3) {
      const v = my + 22 - Math.floor((i / 24) * 12 + hash2(i, 1, 9) * 4);
      s.line(mx + 2 + i - 3, prev, mx + 2 + i, v, '#7fd17a');
      prev = v;
    }
    for (let i = 0; i < 4; i++) {
      const bh = 3 + Math.floor(hash2(i, 2, 9) * 6);
      s.rect(mx + 3 + i * 4, my + 25 - bh, 3, bh, i === 3 ? '#e8a33d' : '#5aa7d6');
    }
    drawText(s, 'ÍNDICE', mx + 23, my + 4, '#8fa89a');
    drawText(s, '94', mx + 26, my + 11, '#e6efd9', { scale: 2 });
    const blink = Math.floor(t / 700) % 2 === 0;
    s.rect(mx + 44, my + 2, 2, 2, blink ? '#7fd17a' : '#2f6a3c');
    // cadeira executiva de couro preto (encosto alto) e você nela
    s.rect(67, 18, 26, 34, '#1e1e22');
    s.hl(68, 91, 18, '#3a3a40');
    s.px(67, 18, '#46545f');
    s.px(92, 18, '#46545f');
    s.vl(67, 19, 51, '#2a2a30');
    const id = c.g === 'F' ? 'EU_F' : 'EU_M';
    const fig = graded(s, figurePix(id, 'sentado', { inhale: Math.sin(t / 1300) > 0.5, blink: t % 4600 < 140 }), 'end');
    s.blit(fig, 80 - Math.floor(fig.w / 2), 56 - fig.h);
    // mesa executiva enorme (sem telefone): pasta do plano, monitor fino, copo d'água
    s.rect(24, 50, 112, 6, '#3a2a22');
    s.hl(24, 135, 50, '#5a4234');
    s.rect(26, 56, 108, 28, '#2a1e18');
    s.hl(26, 133, 56, '#1a120e');
    for (let x = 40; x < 130; x += 30) s.vl(x, 58, 82, '#221812');
    // a pasta do Plano de Otimização, com a etiqueta vermelha
    s.rect(34, 46, 18, 4, '#e6eef2');
    s.hl(34, 51, 46, '#ffffff');
    s.rect(34, 45, 5, 2, '#c8302a');
    s.hl(41, 49, 48, '#8a9aa8');
    s.rect(98, 38, 16, 11, '#1e2228');
    s.rect(99, 39, 14, 8, '#2a4a5a');
    s.rect(105, 49, 3, 1, '#1e2228');
    s.rect(120, 44, 4, 6, '#bfe3f2');
    s.hl(120, 123, 44, '#ffffff');
    floorShadow(s, 80, 85, 58, 2, 0.45);
    // planta no canto
    s.rect(146, 66, 9, 12, '#c8c4bc');
    s.disc(150, 58, 7, '#3f6a4a');
    s.disc(147, 54, 4, '#4f7a5a');
    s.disc(154, 61, 3, '#2f5a3a');
    // luz fria da janela e cantos escuros
    s.glow(132, 22, 90, '#d8ecf8', 0.14, 4);
    darkBands(s, 80, 34, 100, 64, '#0e141a', 0.55, 0.55);
  });
}

/** 8 molduras vazias do mural (área da foto, 320×180) para a UI sobrepor legendas */
export const MURAL_FRAMES: Rect[] = (() => {
  const out: Rect[] = [];
  const xs = [30, 100, 170, 240];
  const ys = [26, 98];
  const jitter = [0, 3, -2, 2, 2, -1, 3, -3];
  let i = 0;
  for (const y of ys)
    for (const x of xs) {
      out.push({ x: x + 4, y: y + jitter[i] + 4, w: 50, h: 38 });
      i++;
    }
  return out;
})();

function mural(p: Pix, c: Ctx): void {
  plaster(p, 0, 0, W, H, HOME.wall, mix(HOME.wall, HOME.wall2, 0.6), 41);
  corkBoard(p, 14, 10, 292, 162);
  // fio com pregadores (decoração)
  for (let x = 20; x < 300; x++) p.px(x, 18 + Math.round(Math.sin((x - 20) / 89) * 3), '#5a4a3a');
  const pins = ['#d94436', '#3a6ad0', '#4fae5b', '#f2d45c', '#f07a2a', '#a477d6', '#d94436', '#3a6ad0'];
  MURAL_FRAMES.forEach((r, i) => {
    const x = r.x - 4;
    const y = r.y - 4;
    // sombra + polaroid
    p.recta(x + 2, y + 2, 58, 56, '#3a2516', 0.45);
    p.rect(x, y, 58, 56, '#f4f2ea');
    p.hl(x, x + 57, y + 55, '#d8d4c8');
    p.vl(x + 57, y, y + 55, '#d8d4c8');
    // área da foto vazia (papel fotográfico desbotado)
    p.vgrad(r.x, r.y, r.w, r.h, ['#c9d0cc', '#b4bcb8'], 0.6);
    p.frame(r.x, r.y, r.w, r.h, '#a8b0ac');
    pushPin(p, x + 29, y + 1, pins[i]);
  });
  // legenda escrita à mão embaixo de cada foto
  MURAL_FRAMES.forEach((r, i) => {
    const len = 18 + Math.floor(hash2(i, 5, 41) * 22);
    for (let x = 0; x < len; x++) if (hash2(r.x + x, i, 43) < 0.8) p.px(r.x + 2 + x, r.y + r.h + 6 + (x % 5 === 0 ? 1 : 0), '#4a4a6a');
  });
  // o fio vermelho ligando algumas fotos (as histórias que se cruzaram)
  const pin = (i: number): [number, number] => [MURAL_FRAMES[i].x + 25, MURAL_FRAMES[i].y - 3];
  for (const [a, b] of [
    [0, 5],
    [5, 2],
    [2, 7],
  ] as [number, number][]) {
    const [x0, y0] = pin(a);
    const [x1, y1] = pin(b);
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k <= n; k++) {
      const tt = k / n;
      p.px(Math.round(x0 + (x1 - x0) * tt), Math.round(y0 + (y1 - y0) * tt + Math.sin(tt * Math.PI) * 4), '#c8302a');
    }
  }
  // recorte da Gazeta no canto de cima
  p.rect(256, 14, 34, 10, '#efe6cf');
  p.rect(258, 16, 30, 3, '#1b1a17');
  for (let x = 258; x < 288; x += 2) p.px(x, 21, '#8a8478');
  pushPin(p, 272, 14, '#3a6ad0');
  // desenho do Liam preso no canto e um post-it
  kidDrawing(p, 274, 140, 26, 24, 'familia', 9);
  pushPin(p, 286, 140, '#d94436');
  postit(p, 22, 150, CENTRAL.postit, 5);
  pushPin(p, 25, 150, '#4fae5b');
  p.glow(160, 20, 220, HOME.lampLight, 0.18, 4);
}

function plaster(p: Pix, x: number, y: number, w: number, h: number, base: string, spot: string, seed: number): void {
  p.rect(x, y, w, h, base);
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (hash2(xx, yy, seed) < 0.05) p.px(xx, yy, spot);
}

/**
 * Cantos no escuro em faixas chapadas (3 degraus), com o pontilhado só numa
 * franja estreita entre um degrau e outro (nada de xadrez espalhado).
 */
function darkBands(p: Pix, cx: number, cy: number, rx: number, ry: number, col: string, strength: number, start = 0.55): void {
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= start) continue;
      const k = Math.min(1, (d - start) / (1.2 - start)) * 3;
      const fl = Math.floor(k);
      const f = k - fl;
      const q = fl + (f >= 0.66 ? 1 : f <= 0.34 ? 0 : bayerOn(x, y, (f - 0.34) / 0.32) ? 1 : 0);
      if (q > 0) p.pxa(x, y, col, (Math.min(q, 3) / 3) * strength);
    }
}

/**
 * Desenha numa tela de 160×90 e amplia ×2: câmera mais perto, gente grande e
 * a mesma densidade de pixel em tudo (nada de sprite ×2 em cenário ×1).
 */
function half(p: Pix, draw: (s: Pix) => void): void {
  const s = new Pix(160, 90).setMap(p.map);
  draw(s);
  p.blit(s.scaled(2), 0, 0);
}

/** figura (ou extra) já gradada pela luz do Desgaste da tela de destino */
function graded(s: Pix, fig: Pix, key: string): Pix {
  return gradedCopy(fig, s.map, key);
}

function boloPorta(p: Pix, c: Ctx, t: number): void {
  // por dentro da sala, olhando a porta aberta: a visita do Seu Antônio e da
  // esposa com o bolo de fubá, de dia; o Ozzy recebe abanando o rabo
  half(p, (s) => {
    const k = 'end' + c.blend;
    // parede de dentro (quente) e piso vermelhão
    plaster(s, 0, 0, 160, 60, HOME.wall, mix(HOME.wall, HOME.wall2, 0.6), 51);
    s.rect(0, 56, 160, 4, HOME.wood);
    s.hl(0, 159, 56, HOME.tan);
    s.rect(0, 60, 160, 30, '#8e3e2c');
    for (let y = 64; y < 90; y += 6) s.hl(0, 159, y, '#7c3424');
    for (let x = 0; x < 160; x++) for (let y = 60; y < 90; y++) if (hash2(x, y, 9) < 0.03) s.px(x, y, '#a4503a');
    // lá fora, pela porta: dia claro, a rua, a árvore e a casa da frente
    const dx0 = 50;
    const dx1 = 110;
    const dy0 = 4;
    const floor = 56;
    s.vgrad(dx0, dy0, dx1 - dx0, 30, ['#a8d0ec', '#d8ecf4'], 0.6);
    s.ellipse(96, 10, 8, 2, '#ffffff');
    s.rect(dx0, 26, dx1 - dx0, 14, '#e8d8b8');
    s.rect(dx0 + 30, 22, 22, 18, '#d8a878');
    s.rect(dx0 + 33, 28, 5, 6, '#4a3a2a');
    s.poly(
      [
        [dx0 + 28, 22],
        [dx0 + 41, 15],
        [dx0 + 54, 22],
      ],
      '#a85a3a',
    );
    s.disc(dx0 + 10, 20, 9, '#5f8a4a');
    s.disc(dx0 + 6, 16, 5, '#7aa65a');
    s.rect(dx0 + 9, 26, 3, 14, '#6a4a2a');
    s.rect(dx0, 40, dx1 - dx0, 4, '#c8c4b8');
    s.rect(dx0, 44, dx1 - dx0, floor - 44, '#d8d4cc');
    for (let y = 44; y < floor; y++) for (let x = dx0; x < dx1; x++) if (Math.abs(((y - 44 + Math.sin(x / 6) * 2 + 100) % 6) - 3) < 0.7) s.px(x, y, '#8a867c');
    // a luz do dia entrando pela porta e caindo no piso (chapada, com a borda pontilhada)
    for (let y = floor; y < 90; y++) {
      const sp = (y - floor) * 0.5;
      const xa = dx0 - sp;
      const xb = dx1 + sp * 1.4;
      const fade = (y - floor) / 34;
      for (let x = Math.floor(xa); x < xb; x++) {
        const edge = Math.min(x - xa, xb - x);
        if (edge < 2 && !bayerOn(x, y, 0.5)) continue;
        if (fade > 0.7 && !bayerOn(x, y, 1 - (fade - 0.7) / 0.3)) continue;
        s.pxa(x, y, '#ffd8a8', 0.2);
      }
    }
    // o casal na soleira, com o bolo na altura da cintura
    const ant = graded(s, extraFigurePix('ANTONIO', { inhale: Math.sin(t / 1100) > 0.4, blink: t % 4700 < 140 }), k);
    const esp = graded(s, extraFigurePix('ESPOSA', { inhale: Math.sin(t / 1100 + 1.4) > 0.4, blink: (t + 900) % 5200 < 140 }), k);
    floorShadow(s, 72, floor + 1, 9, 1.5, 0.35);
    floorShadow(s, 89, floor + 1, 8, 1.5, 0.35);
    s.blit(ant, 72 - Math.floor(ant.w / 2), floor + 1 - ant.h);
    s.blit(esp, 89 - Math.floor(esp.w / 2), floor + 1 - esp.h);
    cornCake(s, 70, floor - 18);
    s.rect(68, floor - 10, 3, 2, '#b97b52');
    s.rect(91, floor - 10, 3, 2, '#d9a57e');
    // batente e a porta aberta para dentro
    s.rect(dx0 - 4, dy0 - 4, 4, floor - dy0 + 4, HOME.wood);
    s.rect(dx1, dy0 - 4, 4, floor - dy0 + 4, HOME.wood);
    s.rect(dx0 - 4, dy0 - 4, dx1 - dx0 + 8, 4, HOME.wood);
    s.hl(dx0 - 4, dx1 + 3, dy0 - 4, HOME.tan);
    s.vl(dx0 - 1, dy0, floor, shade(HOME.wood, -0.2));
    s.poly(
      [
        [dx1 + 4, dy0 - 4],
        [dx1 + 20, dy0 - 8],
        [dx1 + 20, floor + 6],
        [dx1 + 4, floor],
      ],
      HOME.wood2,
    );
    s.line(dx1 + 4, dy0 - 4, dx1 + 20, dy0 - 8, HOME.tan);
    s.vl(dx1 + 20, dy0 - 8, floor + 6, HOME.wood);
    s.rect(dx1 + 15, 30, 2, 3, '#d8b448');
    for (const [y0, y1] of [
      [4, 24],
      [30, 50],
    ] as [number, number][])
      s.line(dx1 + 7, y0 + 1, dx1 + 7, y1, HOME.wood);
    // capacho na soleira
    s.rect(dx0 + 4, floor + 1, dx1 - dx0 - 8, 4, '#7a5a3a');
    for (let x = dx0 + 5; x < dx1 - 4; x += 2) s.px(x, floor + 2, '#5a4028');
    // do lado de dentro: o porta-retrato da família e o cabideiro com a mochila do Liam
    familyPhoto(s, 14, 14, 18, 13);
    s.vl(140, 6, 44, HOME.wood);
    s.hl(134, 146, 8, HOME.wood);
    s.rect(135, 10, 9, 12, HOME.fabricBlue);
    s.hl(135, 143, 10, shade(HOME.fabricBlue, 0.25));
    s.rect(137, 15, 5, 3, '#d94436');
    // luz quente de dentro
    s.glow(20, 8, 70, HOME.lampLight, 0.16, 4);
  });
  // o Ozzy (×2) abanando o rabo para a visita, do lado de dentro
  drawDog(p, 40, 128, 'sentado', t, { map: p.map, mapKey: 'end' + c.blend, scale: 2 });
}

let tituloMap: Pix | null = null;

// a tela de título cobre a metade esquerda com o menu (degradê escuro até ~x 205):
// o que conta a história fica na metade direita
const TPHONE = { x: 214, y: 114 };

function titulo(p: Pix, c: Ctx, t: number): void {
  // a mesa da regulação de madrugada: parede escura com a janela da cidade
  // (à esquerda, sob o menu), o tubo fluorescente, o monitor com o mapa, o
  // telefone com a linha piscando e o único calor da cena: o porta-retrato
  p.rect(0, 0, W, 104, '#101814');
  for (let y = 0; y < 104; y++) for (let x = 0; x < W; x++) if (hash2(x, y, 61) < 0.03) p.px(x, y, '#16201c');
  // janela com a cidade
  p.rect(20, 18, 124, 60, '#0a0f1c');
  for (let i = 0; i < 16; i++) {
    const bx = 22 + i * 7.6;
    const bh = 10 + Math.floor(hash2(i, 1, 7) * 30);
    p.rect(Math.round(bx), 78 - bh, 7, bh, '#141c2c');
    for (let k = 0; k < 3; k++) if (hash2(i, k + 5, 7) < 0.35) p.px(Math.round(bx) + 2 + (k % 2) * 3, 78 - bh + 4 + k * 6, '#9fb8d0');
  }
  p.disc(124, 32, 5, '#d8dcc8');
  p.disc(126, 30, 4, '#0a0f1c');
  p.frame(18, 16, 128, 64, '#2f4139');
  p.vl(82, 18, 77, '#2f4139');
  // quadro de avisos com post-its, na parede da direita
  corkBoard(p, 154, 22, 44, 30);
  postit(p, 158, 26, CENTRAL.postit, 1);
  postit(p, 170, 30, '#f2a0b8', 2);
  postit(p, 184, 26, '#a8e0a0', 3);
  pushPin(p, 161, 26, '#d94436');
  pushPin(p, 173, 30, '#3a6ad0');
  // tubo fluorescente
  p.rect(176, 3, 120, 4, '#e6efd9');
  p.hl(176, 295, 7, '#8fa89a');
  p.rect(174, 2, 3, 6, '#3d5248');
  p.rect(295, 2, 3, 6, '#3d5248');
  p.glow(236, 6, 160, '#e6efd9', 0.16, 4);
  // mesa
  p.rect(0, 104, W, 76, '#1f2c27');
  for (let y = 104; y < H; y++) for (let x = 0; x < W; x++) if (hash2(x, y, 67) < 0.04) p.px(x, y, '#26352f');
  p.hl(0, W - 1, 104, '#3d5248');
  p.dith(170, 108, 140, 4, '#3d5248', 0.3);
  // monitor com o mapa da cidade
  if (!tituloMap) tituloMap = renderCityMap({ tile: 2, t: 0, showLabels: false });
  monitorFrame(p, 214, 34, 90, 56);
  p.blit(tituloMap.crop(14, 10, 90, 56), 214, 34);
  for (let y = 34; y < 90; y += 2) p.recta(214, y, 90, 1, '#000000', 0.12);
  p.glow(259, 62, 70, '#7fd17a', 0.07, 3);
  postit(p, 208, 36, CENTRAL.postit, 2);
  // papéis à esquerda, sob o menu
  papers(p, 22, 118, 70, 46, 4);
  // caneca de café e o fone de ouvido de operador largado na mesa
  p.rect(150, 128, 14, 14, '#c4d4c0');
  p.hl(150, 163, 128, '#e6efd9');
  p.hl(151, 162, 129, '#3a2214');
  p.rect(164, 131, 3, 6, '#c4d4c0');
  p.hl(150, 163, 142, '#8fa89a');
  // headset: arco, conchas e a haste do microfone
  for (let a = Math.PI; a <= Math.PI * 2; a += 0.08) p.px(Math.round(187 + Math.cos(a) * 8), Math.round(156 + Math.sin(a) * 7), '#5f6e68');
  p.rect(177, 154, 5, 8, '#3a4440');
  p.hl(177, 181, 154, '#6f7e78');
  p.rect(193, 154, 5, 8, '#3a4440');
  p.hl(193, 197, 154, '#6f7e78');
  p.line(195, 162, 203, 168, '#5f6e68');
  p.rect(203, 167, 3, 2, '#2a3034');
  // foto da família (o único calor)
  p.glow(190, 124, 34, HOME.lampLight, 0.26, 4);
  const fp = new Pix(20, 16);
  familyPhoto(fp, 1, 1, 17, 13);
  p.blit(fp.scaled(2), 172, 104);
  // telefone (2×), com a linha da fila piscando em tituloAnim
  const ph = new Pix(46, 30);
  deskPhone(ph, 3, 2, false, t);
  p.blit(ph.scaled(2), TPHONE.x, TPHONE.y);
  // manual da regulação, ao lado dos papéis
  const mb = new Pix(26, 36);
  manualBinder(mb, 0, 0, 24, 34);
  p.blit(mb, 104, 124);
}

function tituloAnim(p: Pix, t: number): void {
  // luz da linha piscando no telefone (chamada na fila)
  const on = Math.floor(t / 400) % 2 === 0;
  p.rect(TPHONE.x + 32 * 2, TPHONE.y + 18 * 2, 6, 4, on ? '#e8a33d' : '#5a3a14');
  if (on) p.glow(TPHONE.x + 32 * 2 + 3, TPHONE.y + 18 * 2 + 2, 16, '#e8a33d', 0.32, 3);
  // vapor da caneca
  for (let i = 0; i < 3; i++) {
    const ph = ((t / 1100 + i / 3) % 1 + 1) % 1;
    p.pxa(154 + i * 3 + Math.round(Math.sin(ph * 6 + i) * 2), 126 - Math.floor(ph * 20), '#c4d4c0', 0.4 * (1 - ph));
  }
  // fluorescente tremulando
  if (Math.floor(t / 140) % 29 === 0) p.rect(176, 3, 120, 4, '#8fa89a');
}

// -----------------------------------------------------------------------------
// Montagem
// -----------------------------------------------------------------------------
const STATIC: Partial<Record<EndingKind, (p: Pix, c: Ctx) => void>> = {
  desenho_davi: desenhoDavi,
  desenho_cadeira: desenhoCadeira,
  gaveta,
  mural,
};

const WARM: Partial<Record<EndingKind, boolean>> = {
  desenho_davi: false,
  desenho_cadeira: false,
  cracha_prego: true,
  mural: true,
  bolo_porta: true,
};

const cache = new Map<string, Pix>();
const out = new Pix(W, H);

/** Renderiza a vinheta num Pix 320×180 (puro, sem DOM). */
export function renderEnding(kind: EndingKind | string, o: EndingOpts): Pix {
  const k = (ENDING_KINDS as string[]).includes(kind) ? (kind as EndingKind) : 'telefone_escuro';
  const blend = quantize(o.blend ?? 0, 20);
  const c: Ctx = { g: o.gender === 'F' ? 'F' : 'M', blend };
  const t = o.time;
  const map = WARM[k] && blend > 0 ? homeGrader(blend) : null;
  const st = STATIC[k];
  if (st) {
    const key = `${k}|${c.g}|${map ? blend : 0}`;
    let p = cache.get(key);
    if (!p) {
      p = new Pix(W, H).setMap(map);
      st(p, c);
      cache.set(key, p);
    }
    out.copyFrom(p);
    return out;
  }
  switch (k) {
    case 'cracha_prego': {
      const sway = Math.floor(t / 1700) % 4 === 1 ? 1 : 0;
      const key = `${k}|${c.g}|${map ? blend : 0}|${sway}`;
      let p = cache.get(key);
      if (!p) {
        p = new Pix(W, H).setMap(map);
        crachaPrego(p, c, sway);
        cache.set(key, p);
      }
      out.copyFrom(p);
      // poeira na luz
      for (let i = 0; i < 6; i++) {
        const x = (i * 53 + t / 40) % 200;
        const y = (i * 29 + t / 70) % 140;
        out.pxa(x, y, '#fff4d0', 0.35);
      }
      return out;
    }
    case 'calcada_moveis':
      out.setMap(null).clear();
      calcadaMoveis(out, c, t);
      return out;
    case 'escritorio_ar':
      out.setMap(null).clear();
      escritorioAr(out, c, t);
      return out;
    case 'telefone_escuro':
      out.setMap(null).clear();
      telefoneEscuro(out, c, t);
      return out;
    case 'quarto_alugado':
      out.setMap(null).clear();
      quartoAlugado(out, c, t);
      return out;
    case 'bolo_porta': {
      out.setMap(map).clear();
      boloPorta(out, c, t);
      return out;
    }
    case 'titulo':
    default: {
      const key = `titulo|${c.g}`;
      let p = cache.get(key);
      if (!p) {
        p = new Pix(W, H);
        titulo(p, c, 0);
        cache.set(key, p);
      }
      out.setMap(null).copyFrom(p);
      tituloAnim(out, t);
      return out;
    }
  }
}

/** Desenha a vinheta no contexto 2D em (0,0), pixels nativos 320×180. */
export function drawEnding(ctx: CanvasRenderingContext2D, kind: EndingKind | string, o: EndingOpts): void {
  presentPix(ctx, renderEnding(kind, o), 0, 0, 1, 'ending');
}

void CRAYON;
