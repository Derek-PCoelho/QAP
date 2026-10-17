// =============================================================================
// Mapa de Santa Aurora (64×40 tiles) em pixel art fria.
// Camada estática (quadras, ruas, rio, parques, marcos, nomes) fica em cache
// por (tile, rótulos, alagamento); por quadro só se desenham o brilho do rio,
// rotas, marcadores, viaturas e o tile sob o cursor. Feito para tile = 8
// (512×320), funciona em outros tamanhos.
// =============================================================================
import {
  grid,
  MAP_W,
  MAP_H,
  STREETS,
  BAIRROS,
  LANDMARKS,
  landmarkPos,
  bairroAt,
  TILE_ROAD,
  TILE_AVENUE,
  TILE_WATER,
  TILE_PARK,
  type Landmark,
} from '../../engine/city/map';
import { tileCost } from '../../engine/city/path';
import { Pix, presentPix, hash2, hashStr } from './pix';
import { drawText, textWidth } from './font';
import { CENTRAL, HOME, UNIT_STATUS_COLOR, mix } from './palette';
import type { UnitStatus } from '../../engine/types';

export interface MapUnit {
  id: string;
  type: 'USA' | 'USB';
  /** posição em tiles (pode ser fracionária, para interpolar) */
  x: number;
  y: number;
  status: string;
  label: string;
  selected?: boolean;
}
export interface MapRoute {
  path: [number, number][];
  color: string;
  dashed?: boolean;
}
export interface MapMarker {
  x: number;
  y: number;
  kind: 'chamada' | 'invalido' | 'casa' | 'alvo';
  label?: string;
}
export interface CityMapOpts {
  tile: number;
  /** ms (animações: brilho do rio, pulsos, sirenes) */
  t: number;
  flood?: boolean;
  showLabels?: boolean;
  units?: MapUnit[];
  routes?: MapRoute[];
  markers?: MapMarker[];
  highlightStreet?: string;
  hoverTile?: [number, number];
}

/** tamanho do mapa em pixels para um tile */
export function mapPixelSize(tile: number): { w: number; h: number } {
  return { w: MAP_W * tile, h: MAP_H * tile };
}

/** tile sob um pixel (coordenadas do canvas do mapa), limitado às bordas do mapa */
export function tileFromPixel(px: number, py: number, tile: number): [number, number] {
  const x = Math.floor(px / Math.max(1, tile));
  const y = Math.floor(py / Math.max(1, tile));
  return [Math.max(0, Math.min(MAP_W - 1, x)), Math.max(0, Math.min(MAP_H - 1, y))];
}

// -----------------------------------------------------------------------------
// Cores
// -----------------------------------------------------------------------------
export const MAP_COLORS = {
  road: '#394c43',
  avenue: '#40554b',
  curb: '#52675b',
  dash: '#a9c0b2',
  water: '#12303a',
  water2: '#163a45',
  waterHi: '#3f7f94',
  waterHi2: '#7cc0dc',
  foam: '#5d8f9c',
  park: '#1c3326',
  tree: '#2b5537',
  treeHi: '#3e744a',
  treeDk: '#16291d',
  path: '#33473a',
  bank: '#1e3328',
  flood: '#2e78b4',
  floodSlow: '#5aa7d6',
  label: '#7a9488',
  labelOutline: '#0b100e',
};

interface Tone {
  ground: string;
  roof: string;
  roof2: string;
  hi: string;
  sh: string;
  kind: 'casas' | 'nobre' | 'galpao' | 'centro' | 'denso' | 'expo';
}

/** um tom por bairro (BAIRROS[i].tone) */
const TONES: Tone[] = [
  { ground: '#18231f', roof: '#2e3d35', roof2: '#29372f', hi: '#3a4b41', sh: '#101814', kind: 'casas' }, // Santa Luzia
  { ground: '#17221f', roof: '#2b3933', roof2: '#33423a', hi: '#3c4d44', sh: '#0f1714', kind: 'casas' }, // Jardim Norte
  { ground: '#192722', roof: '#33443c', roof2: '#2d3d35', hi: '#42544a', sh: '#101915', kind: 'nobre' }, // Bela Vista
  { ground: '#192121', roof: '#2d3738', roof2: '#343f40', hi: '#414c4d', sh: '#0f1515', kind: 'galpao' }, // Distrito
  { ground: '#151e1b', roof: '#26322d', roof2: '#2d3a34', hi: '#3b4a42', sh: '#0b1210', kind: 'centro' }, // Centro
  { ground: '#182520', roof: '#31413a', roof2: '#2b3a33', hi: '#3f5147', sh: '#0f1814', kind: 'casas' }, // J. Primavera
  { ground: '#17211d', roof: '#2b3832', roof2: '#323f38', hi: '#3b4941', sh: '#0e1613', kind: 'denso' }, // V. Esperança
  { ground: '#161f1c', roof: '#29352f', roof2: '#2f3b35', hi: '#38453e', sh: '#0d1411', kind: 'denso' }, // Vila Nova
  { ground: '#19261f', roof: '#2f3e36', roof2: '#2a3831', hi: '#3e4e45', sh: '#0f1814', kind: 'expo' }, // Parque
];

// -----------------------------------------------------------------------------
// Ícones de marcos 7×7
// -----------------------------------------------------------------------------
const LM_PAL: Record<string, string> = {
  w: '#e6efd9',
  p: '#c4d4c0',
  s: '#8fa89a',
  m: '#5f7a6c',
  r: '#e0483d',
  b: '#5aa7d6',
  B: '#2f6f9e',
  P: '#e07a9a',
  o: '#f07a2a',
  y: '#e8c84a',
  g: '#6fbf6a',
  G: '#2f6a3c',
  n: '#7a5030',
  N: '#4a2e1a',
  t: HOME.wall,
  T: HOME.tan,
  h: HOME.lampLight,
  H: HOME.lamp,
  x: '#7d8a84',
  k: '#0b100e',
};

// prettier-ignore
const LM_ICON: Record<string, string[]> = {
  hospital: ['wwwwwww', 'wrwwwrw', 'wrwwwrw', 'wrrrrrw', 'wrwwwrw', 'wrwwwrw', 'wwwwwww'],
  upa: ['bbbbbbb', 'bwbbbwb', 'bwbbbwb', 'bwbbbwb', 'bwbbbwb', 'bbwwwbb', 'BBBBBBB'],
  maternidade: ['PPPPPPP', 'PwwPwwP', 'PwwwwwP', 'PwwwwwP', 'PPwwwPP', 'PPPwPPP', 'PPPPPPP'],
  base: ['ooooooo', 'ooowooo', 'owowowo', 'oowwwoo', 'owowowo', 'ooowooo', 'ooooooo'],
  central: ['...r...', '...p...', '..ppp..', '.pwpwp.', '.ppppp.', '.pwpwp.', '.ppppp.'],
  escola: ['...ggy.', '...x...', '.yyyyy.', 'yyyyyyy', 'ybybyby', 'yyyyyyy', 'yyynyyy'],
  igreja: ['...w...', '..www..', '...w...', '..ppp..', '.ppppp.', '.ppmpp.', '.ppmpp.'],
  parque: ['..ggg..', '.ggggg.', 'gggggGg', '.gGGGG.', '..GnG..', '...n...', '..GGG..'],
  casa: ['...N...', '..NnN..', '.NnnnN.', 'NNNNNNN', '.thhtt.', '.thhtN.', '.ttttN.'],
  ubs: ['wwwwwww', 'wwwgwww', 'wwwgwww', 'wgggggw', 'wwwgwww', 'wwwgwww', 'ppppppp'],
  posto: ['.sssss.', '.swwws.', '.swwws.', '.sssss.', '.ssssy.', '.sssssy', '.sssss.'],
  comercio: ['..p.p..', '.p...p.', 'sssssss', 'swwwwws', 'swwwwws', 'swwwwws', 'sssssss'],
  publico: ['.ppppp.', 'ppppppp', '.......', '.p.p.p.', '.p.p.p.', '.p.p.p.', 'ppppppp'],
  praca: ['..ggg..', '.ggggg.', 'gggggGg', '.gGGGG.', '..GnG..', '...n...', '..GGG..'],
};

function lmIconPix(kind: string): Pix {
  const rows = LM_ICON[kind] ?? LM_ICON.publico;
  const p = new Pix(9, 9);
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 7; x++) {
      const ch = rows[y][x];
      if (ch !== '.' && LM_PAL[ch]) p.px(x + 1, y + 1, LM_PAL[ch]);
    }
  p.outline(LM_PAL.k);
  return p;
}

const MAJOR = new Set(['hospital', 'upa', 'maternidade', 'base', 'central', 'escola', 'igreja', 'parque', 'casa']);

// -----------------------------------------------------------------------------
// Posição dos marcos (num tile de quadra vizinho à rua do endereço)
// -----------------------------------------------------------------------------
interface PlacedLandmark {
  lm: Landmark;
  road: [number, number];
  at: [number, number];
}

let PLACED: PlacedLandmark[] | null = null;

function tileType(x: number, y: number): number {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return -1;
  return grid()[y * MAP_W + x];
}

function placeLandmarks(): PlacedLandmark[] {
  if (PLACED) return PLACED;
  const taken = new Set<string>();
  const out: PlacedLandmark[] = [];
  for (const lm of LANDMARKS) {
    if (lm.hidden) continue;
    let road: [number, number];
    try {
      road = landmarkPos(lm.id);
    } catch {
      continue;
    }
    const [rx, ry] = road;
    const wantPark = lm.kind === 'parque' || lm.kind === 'praca';
    const cand: [number, number][] = [
      [rx, ry - 1],
      [rx, ry + 1],
      [rx - 1, ry],
      [rx + 1, ry],
      [rx - 1, ry - 1],
      [rx + 1, ry - 1],
      [rx - 1, ry + 1],
      [rx + 1, ry + 1],
    ];
    const ok = (t: number) => (wantPark ? t === TILE_PARK : t === 0);
    let at = cand.find(([x, y]) => ok(tileType(x, y)) && !taken.has(`${x},${y}`));
    if (!at) at = cand.find(([x, y]) => (tileType(x, y) === 0 || tileType(x, y) === TILE_PARK) && !taken.has(`${x},${y}`));
    if (!at) at = [rx, ry];
    taken.add(`${at[0]},${at[1]}`);
    out.push({ lm, road, at });
  }
  PLACED = out;
  return out;
}

/** tile onde o ícone do marco é desenhado (útil para a UI posicionar dicas) */
export function landmarkTile(id: string): [number, number] | null {
  const p = placeLandmarks().find((x) => x.lm.id === id);
  return p ? p.at : null;
}

// -----------------------------------------------------------------------------
// Camada estática
// -----------------------------------------------------------------------------
function isRoadT(t: number): boolean {
  return t === TILE_ROAD || t === TILE_AVENUE;
}

/** telhado com cumeeira (metade de cima clara, de baixo escura) e sombra projetada */
function roof(p: Pix, x: number, y: number, w: number, h: number, tone: Tone, alt: boolean, lit: boolean): void {
  if (w <= 0 || h <= 0) return;
  const base = alt ? tone.roof2 : tone.roof;
  p.rect(x + 1, y + 1, w, h, tone.sh);
  p.rect(x, y, w, h, base);
  if (h >= 3) {
    p.rect(x, y, w, Math.max(1, Math.floor(h / 2)), mix(base, tone.hi, 0.6));
    p.hl(x, x + w - 1, y, tone.hi);
  } else p.hl(x, x + w - 1, y, tone.hi);
  if (lit && w >= 2 && h >= 2) p.px(x + w - 1, y + h - 1, '#9fb8a8');
}

function drawBlockTile(p: Pix, tx: number, ty: number, T: number): void {
  const b = bairroAt(tx, ty);
  const tone = TONES[b.tone % TONES.length];
  const X = tx * T;
  const Y = ty * T;
  p.rect(X, Y, T, T, tone.ground);
  const h = (k: number) => hash2(tx * 7 + k, ty * 13 - k, 9173);
  const s = T / 8;
  const R = (v: number) => Math.round(v * s);
  if (T < 5) {
    if (h(1) < 0.7) p.rect(X + 1, Y + 1, Math.max(1, T - 2), Math.max(1, T - 2), tone.roof);
    return;
  }
  const lit = h(9) < 0.18;
  switch (tone.kind) {
    case 'centro': {
      // prédios: telhado + fachada sul com janelas
      const v = Math.floor(h(2) * 3);
      if (v === 0) {
        p.rect(X + R(1), Y + R(1), R(6), R(4), tone.roof);
        p.hl(X + R(1), X + R(7) - 1, Y + R(1), tone.hi);
        p.rect(X + R(1), Y + R(5), R(6), R(2), tone.sh);
        for (let i = 0; i < 3; i++) p.px(X + R(2 + i * 2), Y + R(5) + Math.max(0, R(1) - 1), h(10 + i) < 0.4 ? '#a9c2b2' : '#3b4d45');
        p.px(X + R(3), Y + R(2), tone.hi);
      } else if (v === 1) {
        p.rect(X + R(1), Y + R(1), R(3), R(5), tone.roof2);
        p.rect(X + R(1), Y + R(6), R(3), R(1), tone.sh);
        p.rect(X + R(5), Y + R(2), R(2), R(4), tone.roof);
        p.rect(X + R(5), Y + R(6), R(2), R(1), tone.sh);
        p.hl(X + R(1), X + R(4) - 1, Y + R(1), tone.hi);
        if (h(11) < 0.5) p.px(X + R(2), Y + R(6), '#a9c2b2');
      } else {
        p.rect(X + R(1), Y + R(1), R(6), R(3), tone.roof2);
        p.hl(X + R(1), X + R(7) - 1, Y + R(1), tone.hi);
        p.rect(X + R(1), Y + R(4), R(6), R(1), tone.sh);
        p.rect(X + R(2), Y + R(5), R(4), R(2), tone.roof);
        if (h(12) < 0.5) p.px(X + R(5), Y + R(3), '#a9c2b2');
      }
      break;
    }
    case 'galpao': {
      // galpões com telha ondulada
      const wide = h(3) < 0.6;
      const gx = X + R(1);
      const gy = Y + R(1);
      const gw = wide ? R(6) : R(4);
      const gh = wide ? R(5) : R(6);
      p.rect(gx + 1, gy + 1, gw, gh, tone.sh);
      p.rect(gx, gy, gw, gh, tone.roof);
      for (let i = 0; i < gh; i += 2) p.hl(gx, gx + gw - 1, gy + i, tone.roof2);
      p.hl(gx, gx + gw - 1, gy, tone.hi);
      if (!wide) p.rect(X + R(6), Y + R(2), R(1), R(4), '#2a3434');
      if (h(4) < 0.3) p.px(X + R(6), Y + R(6), '#7f9488');
      break;
    }
    case 'nobre': {
      // casas maiores, quintal, piscina
      roof(p, X + R(1), Y + R(1), R(4), R(3), tone, h(5) < 0.5, lit);
      if (h(6) < 0.16) {
        p.rect(X + R(5), Y + R(5), R(2), R(2), '#2f6676');
        p.px(X + R(5), Y + R(5), '#5f9fb4');
      } else {
        p.rect(X + R(5), Y + R(4), R(2), R(2), '#244232');
        p.px(X + R(5), Y + R(4), '#2f5a3e');
      }
      if (h(7) < 0.6) roof(p, X + R(1), Y + R(5), R(3), R(2), tone, h(8) < 0.5, false);
      break;
    }
    case 'expo': {
      // pavilhões, pátios de cascalho
      if (h(2) < 0.5) {
        p.rect(X + R(1), Y + R(2), R(6), R(3), tone.roof);
        p.hl(X + R(1), X + R(7) - 1, Y + R(2), tone.hi);
        p.rect(X + R(1), Y + R(5), R(6), R(1), tone.sh);
      } else {
        p.dith(X + R(1), Y + R(1), R(6), R(6), '#24302a', 0.5);
        if (h(3) < 0.5) p.rect(X + R(2), Y + R(3), R(3), R(2), tone.roof2);
      }
      break;
    }
    case 'denso': {
      // casinhas apertadas, telhados desencontrados
      const v = Math.floor(h(2) * 3);
      if (v === 0) {
        roof(p, X + R(0), Y + R(1), R(3), R(3), tone, false, lit);
        roof(p, X + R(4), Y + R(0), R(3), R(3), tone, true, false);
        roof(p, X + R(1), Y + R(5), R(3), R(2), tone, true, false);
        roof(p, X + R(5), Y + R(4), R(2), R(3), tone, false, h(12) < 0.2);
      } else if (v === 1) {
        roof(p, X + R(1), Y + R(1), R(5), R(2), tone, true, false);
        roof(p, X + R(0), Y + R(4), R(3), R(3), tone, false, lit);
        roof(p, X + R(4), Y + R(4), R(3), R(3), tone, true, false);
      } else {
        roof(p, X + R(0), Y + R(0), R(3), R(3), tone, true, false);
        roof(p, X + R(4), Y + R(1), R(3), R(2), tone, false, lit);
        roof(p, X + R(0), Y + R(4), R(2), R(3), tone, false, false);
        roof(p, X + R(3), Y + R(4), R(4), R(3), tone, true, false);
      }
      break;
    }
    case 'casas':
    default: {
      const v = Math.floor(h(2) * 4);
      if (v === 0) {
        roof(p, X + R(1), Y + R(1), R(2), R(2), tone, false, lit);
        roof(p, X + R(4), Y + R(1), R(3), R(2), tone, true, false);
        roof(p, X + R(1), Y + R(4), R(3), R(3), tone, true, false);
        roof(p, X + R(5), Y + R(4), R(2), R(3), tone, false, false);
      } else if (v === 1) {
        roof(p, X + R(1), Y + R(1), R(5), R(3), tone, false, lit);
        roof(p, X + R(2), Y + R(5), R(3), R(2), tone, true, false);
        p.px(X + R(6), Y + R(6), MAP_COLORS.tree);
      } else if (v === 2) {
        roof(p, X + R(1), Y + R(2), R(3), R(4), tone, true, lit);
        roof(p, X + R(5), Y + R(1), R(2), R(3), tone, false, false);
        p.rect(X + R(5), Y + R(5), R(2), R(2), MAP_COLORS.tree);
        p.px(X + R(5), Y + R(5), MAP_COLORS.treeHi);
      } else {
        roof(p, X + R(1), Y + R(1), R(3), R(3), tone, false, false);
        roof(p, X + R(4), Y + R(4), R(3), R(3), tone, true, lit);
        p.rect(X + R(5), Y + R(1), R(2), R(2), MAP_COLORS.tree);
        p.px(X + R(5), Y + R(1), MAP_COLORS.treeHi);
      }
    }
  }
}

function drawRoadTile(p: Pix, tx: number, ty: number, T: number, g: Uint8Array): void {
  const t = g[ty * MAP_W + tx];
  const X = tx * T;
  const Y = ty * T;
  const av = t === TILE_AVENUE;
  p.rect(X, Y, T, T, av ? MAP_COLORS.avenue : MAP_COLORS.road);
  const n = isRoadT(tileType(tx, ty - 1));
  const sTile = isRoadT(tileType(tx, ty + 1));
  const w = isRoadT(tileType(tx - 1, ty));
  const e = isRoadT(tileType(tx + 1, ty));
  // calçadas (só nas bordas que dão para quadras)
  if (T >= 6) {
    if (!n) p.hl(X, X + T - 1, Y, MAP_COLORS.curb);
    if (!sTile) p.hl(X, X + T - 1, Y + T - 1, MAP_COLORS.curb);
    if (!w) p.vl(X, Y, Y + T - 1, MAP_COLORS.curb);
    if (!e) p.vl(X + T - 1, Y, Y + T - 1, MAP_COLORS.curb);
  }
  // faixa central tracejada nas avenidas (fora dos cruzamentos)
  if (av && T >= 6) {
    const horiz = (w || e) && !(n || sTile);
    const vert = (n || sTile) && !(w || e);
    const mid = Math.floor(T / 2);
    if (horiz) for (let i = 0; i < T; i++) if (((X + i) >> 1) % 2 === 0) p.px(X + i, Y + mid - (T % 2 === 0 ? 1 : 0), MAP_COLORS.dash);
    if (vert) for (let i = 0; i < T; i++) if (((Y + i) >> 1) % 2 === 0) p.px(X + mid - (T % 2 === 0 ? 1 : 0), Y + i, MAP_COLORS.dash);
  }
}

function drawParkTile(p: Pix, tx: number, ty: number, T: number): void {
  const X = tx * T;
  const Y = ty * T;
  p.rect(X, Y, T, T, MAP_COLORS.park);
  // grama pontilhada
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (hash2(X + x, Y + y, 77) < 0.08) p.px(X + x, Y + y, '#24402e');
  const h = (k: number) => hash2(tx * 3 + k, ty * 5 + k, 4411);
  const tree = (cx: number, cy: number, r: number) => {
    p.disc(cx + 1, cy + 1, r, MAP_COLORS.treeDk);
    p.disc(cx, cy, r, MAP_COLORS.tree);
    p.px(cx - Math.max(0, r - 1), cy - Math.max(0, r - 1), MAP_COLORS.treeHi);
    if (r >= 2) p.px(cx - r + 1, cy - r + 2, MAP_COLORS.treeHi);
  };
  const s = T / 8;
  const r = Math.max(1, Math.round(1.6 * s));
  if (h(1) < 0.75) tree(X + Math.round((2 + h(2) * 3) * s), Y + Math.round((2 + h(3) * 2) * s), r);
  if (h(4) < 0.5) tree(X + Math.round((5 + h(5)) * s), Y + Math.round((5 + h(6)) * s), Math.max(1, r - 1));
}

function drawWaterTile(p: Pix, tx: number, ty: number, T: number): void {
  const X = tx * T;
  const Y = ty * T;
  p.rect(X, Y, T, T, MAP_COLORS.water);
  // profundidade: mais escuro para o sul
  if (ty >= 39) p.dith(X, Y, T, T, '#0e2830', 0.5);
  // margem: espuma na borda com terra
  if (tileType(tx, ty - 1) !== TILE_WATER) {
    p.hl(X, X + T - 1, Y, MAP_COLORS.foam);
    for (let i = 0; i < T; i += 3) p.px(X + i + (ty % 2), Y + 1, MAP_COLORS.water2);
  }
  if (tx > 0 && tileType(tx - 1, ty) !== TILE_WATER && ty < 38) p.vl(X, Y, Y + T - 1, MAP_COLORS.foam);
  if (tx < MAP_W - 1 && tileType(tx + 1, ty) !== TILE_WATER && ty < 38) p.vl(X + T - 1, Y, Y + T - 1, MAP_COLORS.foam);
}

function drawBankTile(p: Pix, tx: number, ty: number, T: number): void {
  // terra na beira do rio (linha 37 que não é água)
  const X = tx * T;
  const Y = ty * T;
  p.rect(X, Y, T, T, MAP_COLORS.bank);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (hash2(X + x, Y + y, 31) < 0.12) p.px(X + x, Y + y, '#27402f');
  // juncos
  for (let i = 1; i < T; i += 3) {
    p.px(X + i, Y + T - 2, '#2f5a3a');
    p.px(X + i, Y + T - 3, '#2f5a3a');
  }
}

function labelBands(b: (typeof BAIRROS)[number]): number[] {
  // centros (em tiles) das faixas de quadras entre ruas horizontais, do meio para fora
  const cx = Math.round((b.x0 + b.x1) / 2);
  const isRoadRow = (y: number) =>
    y >= 37 || STREETS.some((s) => s.axis === 'h' && s.at === y && s.from <= cx && s.to >= cx) || tileType(cx, y) === TILE_WATER;
  const bands: [number, number][] = [];
  let start = -1;
  for (let y = b.y0; y <= b.y1 + 1; y++) {
    const road = y > b.y1 || isRoadRow(y);
    if (!road && start < 0) start = y;
    if (road && start >= 0) {
      bands.push([start, y - 1]);
      start = -1;
    }
  }
  const mid = (b.y0 + Math.min(b.y1, 36)) / 2;
  bands.sort((p, q) => q[1] - q[0] - (p[1] - p[0]) || Math.abs((p[0] + p[1]) / 2 - mid) - Math.abs((q[0] + q[1]) / 2 - mid));
  const good = bands.filter((x) => x[1] - x[0] >= 1);
  const list = (good.length ? good : bands).map((x) => (x[0] + x[1] + 1) / 2);
  return list.length ? list : [(b.y0 + b.y1 + 1) / 2];
}

interface LRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
const hit = (a: LRect, b: LRect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** camada de nomes (bairros e marcos) de cada mapa-base */
const LABELS = new WeakMap<Pix, Pix>();

function buildBase(T: number, labels: boolean, flood: boolean): Pix {
  const { w, h } = mapPixelSize(T);
  const p = new Pix(w, h);
  const g = grid();
  for (let ty = 0; ty < MAP_H; ty++)
    for (let tx = 0; tx < MAP_W; tx++) {
      const t = g[ty * MAP_W + tx];
      if (isRoadT(t)) drawRoadTile(p, tx, ty, T, g);
      else if (t === TILE_WATER) drawWaterTile(p, tx, ty, T);
      else if (t === TILE_PARK) drawParkTile(p, tx, ty, T);
      else if (ty >= 37) drawBankTile(p, tx, ty, T);
      else drawBlockTile(p, tx, ty, T);
    }
  // praça da matriz: chafariz + caminhos em cruz
  {
    const cx = Math.round(35.5 * T);
    const cy = Math.round(18.5 * T);
    p.rect(33 * T, cy - Math.floor(T / 8), 5 * T, Math.max(1, Math.round(T / 4)), MAP_COLORS.path);
    p.rect(cx - Math.floor(T / 8), 17 * T, Math.max(1, Math.round(T / 4)), 3 * T, MAP_COLORS.path);
    p.disc(cx, cy, Math.max(1, Math.round(T / 3)), '#3d6f80');
    p.px(cx - 1, cy - 1, '#7cc0dc');
  }
  // Parque de Exposições: alamedas
  for (const y0 of [29, 33]) p.rect(51 * T, Math.round((y0 + 1.5) * T), 11 * T, Math.max(1, Math.round(T / 8)), MAP_COLORS.path);
  // alagamento (fixo para o dia)
  if (flood) {
    for (let ty = 0; ty < MAP_H; ty++)
      for (let tx = 0; tx < MAP_W; tx++) {
        const t = g[ty * MAP_W + tx];
        if (!isRoadT(t)) continue;
        const c = tileCost(tx, ty, 'flood');
        if (!isFinite(c)) {
          p.recta(tx * T, ty * T, T, T, '#1f5e96', 0.72);
          for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if ((tx * T + x + ty * T + y) % 4 === 0) p.pxa(tx * T + x, ty * T + y, '#7cc0e8', 0.55);
        } else if (c > 1) {
          p.recta(tx * T, ty * T, T, T, MAP_COLORS.floodSlow, 0.28);
          for (let y = 0; y < T; y += 4) for (let x = 0; x < T; x += 4) p.pxa(tx * T + x + (y % 8 ? 2 : 0), ty * T + y + 1, '#bfe3f2', 0.5);
        }
      }
    // quadras vizinhas a ruas submersas: lâmina d'água
    for (let ty = 0; ty < MAP_H; ty++)
      for (let tx = 0; tx < MAP_W; tx++) {
        const t = g[ty * MAP_W + tx];
        if (isRoadT(t) || t === TILE_WATER) continue;
        const nb: [number, number][] = [
          [tx, ty - 1],
          [tx, ty + 1],
          [tx - 1, ty],
          [tx + 1, ty],
        ];
        const wet = nb.filter(([x, y]) => isRoadT(tileType(x, y)) && !isFinite(tileCost(x, y, 'flood'))).length;
        if (wet >= 2 || (ty >= 37 && wet >= 1)) p.recta(tx * T, ty * T, T, T, MAP_COLORS.flood, 0.38);
        else if (wet === 1) p.recta(tx * T, ty * T, T, T, MAP_COLORS.flood, 0.18);
      }
  }
  // marcos
  for (const pl of placeLandmarks()) {
    const kind = pl.lm.kind;
    const ic = lmIconPix(kind);
    const [ax, ay] = pl.at;
    const cx = ax * T + Math.floor(T / 2);
    const cy = ay * T + Math.floor(T / 2);
    if (kind === 'casa') {
      // a única luz quente do mapa
      p.glow(cx, cy, Math.max(6, T * 1.6), HOME.lamp, 0.55, 4);
    }
    if (!MAJOR.has(kind)) {
      // marcos secundários: menores e discretos
      if (T >= 8) {
        const small = ic.crop(1, 1, 7, 7);
        p.blit(small, cx - 3, cy - 3, { alpha: 0.75 });
      }
      continue;
    }
    if (T >= 8) p.blit(ic, cx - 4, cy - 4);
    else p.rect(cx - 1, cy - 1, 3, 3, LM_PAL[LM_ICON[kind]?.[3]?.[3] ?? 'w'] ?? '#e6efd9');
  }
  // nomes (com desvio de colisões) numa camada à parte, desenhada por cima das
  // rotas (a linha da rota não apaga mais as letras de "MATERNIDADE", "VILA NOVA")
  const lab = new Pix(w, h);
  LABELS.set(p, lab);
  if (labels && T >= 6) {
    const placed: LRect[] = [];
    const icons: LRect[] = placeLandmarks().map((pl) => ({ x: pl.at[0] * T + Math.floor(T / 2) - 5, y: pl.at[1] * T + Math.floor(T / 2) - 5, w: 10, h: 10 }));
    const free = (r: LRect, avoidIcons = true) =>
      r.x >= 1 && r.y >= 1 && r.x + r.w <= w - 1 && r.y + r.h <= h - 1 && !placed.some((q) => hit(q, r)) && (!avoidIcons || !icons.some((q) => hit(q, r)));
    // 1) marcos principais
    const SHOW: Record<string, string> = { casa: 'SUA CASA', reg: 'REGIONAL', upa: 'UPA NORTE', mat: 'MATERNIDADE', central: 'CENTRAL' };
    for (const pl of placeLandmarks()) {
      const txt = SHOW[pl.lm.id];
      if (!txt) continue;
      const warm = pl.lm.kind === 'casa';
      const cx = pl.at[0] * T + Math.floor(T / 2);
      const cy = pl.at[1] * T + Math.floor(T / 2);
      const tw = textWidth(txt);
      const cands: [number, number][] = [
        [cx - Math.floor(tw / 2), cy - 12],
        [cx - Math.floor(tw / 2), cy + 8],
        [cx + 7, cy - 2],
        [cx - 7 - tw, cy - 2],
      ];
      let pick: [number, number] | null = null;
      for (const [x, y] of cands) {
        const r = { x: x - 2, y: y - 4, w: tw + 4, h: 10 };
        if (free(r)) {
          pick = [x, y];
          break;
        }
      }
      if (!pick) {
        const [x, y] = cands[0];
        pick = [Math.max(2, Math.min(w - tw - 2, x)), Math.max(5, y)];
      }
      placed.push({ x: pick[0] - 2, y: pick[1] - 4, w: tw + 4, h: 10 });
      drawText(lab, txt, pick[0], pick[1], warm ? HOME.lampLight : '#c4d4c0', { outline: warm ? HOME.bg1 : MAP_COLORS.labelOutline });
    }
    // 2) bairros
    for (const b of BAIRROS) {
      const name = b.name.toUpperCase();
      const tw = textWidth(name);
      const cxp = ((b.x0 + b.x1 + 1) / 2) * T;
      let pick: [number, number] | null = null;
      outer: for (const band of labelBands(b))
        for (const dx of [0, -2, 2, -4, 4, -6, 6]) {
          const x = Math.round(cxp + dx * T - tw / 2);
          const y = Math.round(band * T - 2);
          if (x < b.x0 * T || x + tw > (b.x1 + 1) * T) continue;
          if (free({ x: x - 2, y: y - 4, w: tw + 4, h: 10 })) {
            pick = [x, y];
            break outer;
          }
        }
      if (!pick) pick = [Math.round(cxp - tw / 2), Math.round(labelBands(b)[0] * T - 2)];
      placed.push({ x: pick[0] - 2, y: pick[1] - 4, w: tw + 4, h: 10 });
      drawText(lab, name, pick[0], pick[1], MAP_COLORS.label, { outline: MAP_COLORS.labelOutline });
    }
  }
  return p;
}

const baseCache = new Map<string, Pix>();

function base(T: number, labels: boolean, flood: boolean): Pix {
  const key = `${T}|${labels ? 1 : 0}|${flood ? 1 : 0}`;
  let b = baseCache.get(key);
  if (!b) {
    b = buildBase(T, labels, flood);
    baseCache.set(key, b);
    if (baseCache.size > 8) baseCache.delete(baseCache.keys().next().value as string);
  }
  return b;
}

// -----------------------------------------------------------------------------
// Camada dinâmica
// -----------------------------------------------------------------------------
function shimmer(p: Pix, T: number, t: number, flood: boolean): void {
  const g = grid();
  const ph = t / 900;
  for (let ty = 36; ty < MAP_H; ty++)
    for (let tx = 0; tx < MAP_W; tx++) {
      if (g[ty * MAP_W + tx] !== TILE_WATER) continue;
      for (let y = 1; y < T; y++)
        for (let x = 0; x < T; x++) {
          const X = tx * T + x;
          const Y = ty * T + y;
          // ondinhas que correm para leste
          const v = Math.sin(X * 0.21 - ph * 2.2 + Math.sin(Y * 0.9 + X * 0.05) * 1.7 + Y * 0.6);
          const n = hash2(X, Y, 5);
          if (v > 0.93 && n < 0.55) p.px(X, Y, n < 0.12 ? MAP_COLORS.waterHi2 : MAP_COLORS.waterHi);
          else if (v > 0.8 && n < 0.25) p.px(X, Y, MAP_COLORS.water2);
        }
    }
  if (flood) {
    // ondulação nas ruas alagadas
    for (let ty = 0; ty < MAP_H; ty++)
      for (let tx = 0; tx < MAP_W; tx++) {
        const tt = g[ty * MAP_W + tx];
        if (!isRoadT(tt)) continue;
        if (isFinite(tileCost(tx, ty, 'flood'))) continue;
        const k = Math.floor(ph * 3 + hash2(tx, ty, 2) * 8) % 8;
        const X = tx * T + ((k * 3) % T);
        const Y = ty * T + ((k * 5 + 2) % T);
        p.pxa(X, Y, '#9fd0ea', 0.7);
        p.pxa(X + 1, Y, '#9fd0ea', 0.5);
      }
    // chuva fina
    for (let i = 0; i < 70; i++) {
      const sx = (hash2(i, 1, 99) * p.w + t * 0.12) % p.w;
      const sy = (hash2(i, 2, 99) * p.h + t * 0.3) % p.h;
      p.pxa(sx, sy, '#bfe3f2', 0.35);
      p.pxa(sx - 1, sy - 2, '#bfe3f2', 0.22);
    }
  }
}

function drawRoute(p: Pix, r: MapRoute, T: number, t: number): void {
  if (r.path.length < 1) return;
  const lw = Math.max(1, Math.round(T / 4));
  const off = Math.floor(T / 2) - Math.floor(lw / 2);
  let dist = 0;
  const period = Math.max(4, T);
  const on = Math.ceil(period * 0.6);
  const march = Math.floor(t / 70);
  const plot = (x: number, y: number) => {
    if (r.dashed) {
      const k = (((dist - march) % period) + period) % period;
      if (k >= on) return;
    }
    p.rect(x, y, lw, lw, r.color);
  };
  // sombra
  for (let i = 0; i + 1 < r.path.length; i++) {
    const [ax, ay] = r.path[i];
    const [bx, by] = r.path[i + 1];
    const x0 = Math.round(ax * T + off);
    const y0 = Math.round(ay * T + off);
    const x1 = Math.round(bx * T + off);
    const y1 = Math.round(by * T + off);
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k <= n; k++) {
      const x = Math.round(x0 + ((x1 - x0) * k) / Math.max(1, n));
      const y = Math.round(y0 + ((y1 - y0) * k) / Math.max(1, n));
      p.rect(x + 1, y + 1, lw, lw, '#0b100e');
    }
  }
  for (let i = 0; i + 1 < r.path.length; i++) {
    const [ax, ay] = r.path[i];
    const [bx, by] = r.path[i + 1];
    const x0 = Math.round(ax * T + off);
    const y0 = Math.round(ay * T + off);
    const x1 = Math.round(bx * T + off);
    const y1 = Math.round(by * T + off);
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k < n; k++) {
      const x = Math.round(x0 + ((x1 - x0) * k) / Math.max(1, n));
      const y = Math.round(y0 + ((y1 - y0) * k) / Math.max(1, n));
      plot(x, y);
      dist++;
    }
  }
  // ponta: quadradinho no destino
  const [ex, ey] = r.path[r.path.length - 1];
  const cx = Math.round(ex * T + T / 2);
  const cy = Math.round(ey * T + T / 2);
  p.rect(cx - lw, cy - lw, lw * 2, lw * 2, r.color);
  p.frame(cx - lw - 1, cy - lw - 1, lw * 2 + 2, lw * 2 + 2, '#0b100e');
}

function drawMarker(p: Pix, m: MapMarker, T: number, t: number): void {
  const cx = Math.round(m.x * T + T / 2);
  const cy = Math.round(m.y * T + T / 2);
  const ink = '#0b100e';
  switch (m.kind) {
    case 'chamada': {
      const ph = (t % 1200) / 1200;
      const r = 3 + Math.floor(ph * Math.max(5, T));
      p.ring(cx, cy, r, ph < 0.6 ? CENTRAL.red : '#8a2a24');
      if (ph < 0.5) p.ring(cx, cy, r + 1, '#5a1c18');
      // losango
      for (let dy = -3; dy <= 3; dy++) {
        const w = 3 - Math.abs(dy);
        for (let dx = -w - 1; dx <= w + 1; dx++) p.px(cx + dx, cy + dy, ink);
      }
      for (let dy = -2; dy <= 2; dy++) {
        const w = 2 - Math.abs(dy);
        for (let dx = -w; dx <= w; dx++) p.px(cx + dx, cy + dy, CENTRAL.red);
      }
      p.px(cx, cy, '#ffffff');
      p.px(cx, cy - 1, '#f8b0a8');
      break;
    }
    case 'invalido': {
      const blink = Math.floor(t / 450) % 2 === 0;
      const col = blink ? CENTRAL.amber : '#9a6a24';
      const r = Math.max(4, Math.round(T * 0.6));
      for (let a = 0; a < 16; a++) {
        if (a % 2) continue;
        const ang = (a / 16) * Math.PI * 2;
        p.px(Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r), col);
      }
      p.rect(cx - 2, cy - 3, 5, 7, ink);
      drawText(p, '?', cx - 1, cy - 2, col);
      break;
    }
    case 'casa': {
      const home = landmarkTile('casa');
      const lp = (() => {
        try {
          return landmarkPos('casa');
        } catch {
          return null;
        }
      })();
      const atHome = !!lp && Math.abs(lp[0] - m.x) <= 1.5 && Math.abs(lp[1] - m.y) <= 1.5;
      if (atHome && home) {
        // a casa já está no mapa: só um pulso quente em volta
        const hx = home[0] * T + Math.floor(T / 2);
        const hy = home[1] * T + Math.floor(T / 2);
        const ph = (t % 2400) / 2400;
        p.glow(hx, hy, Math.max(7, T * 1.2) + ph * T, HOME.lamp, 0.3 * (1 - ph), 3);
        return;
      }
      const ic = lmIconPix('casa');
      p.glow(cx, cy, Math.max(7, T * 1.5), HOME.lamp, 0.4, 4);
      p.blit(ic, cx - 4, cy - 4);
      break;
    }
    case 'alvo': {
      const r = Math.max(4, Math.round(T * 0.7));
      const col = CENTRAL.pale;
      const k = Math.floor(t / 300) % 2;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        for (let i = 2 + k; i <= r + k; i++) {
          p.px(cx + dx * i + (dy ? 1 : 0), cy + dy * i + (dx ? 1 : 0), ink);
          p.px(cx + dx * i, cy + dy * i, col);
        }
      }
      p.rect(cx - 1, cy - 1, 3, 3, ink);
      p.px(cx, cy, CENTRAL.amber);
      break;
    }
  }
  if (m.label) {
    const wpx = textWidth(m.label);
    let x = cx + 7;
    if (x + wpx > p.w - 2) x = cx - 7 - wpx;
    const y = cy - 2;
    p.recta(x - 2, y - 2, wpx + 4, 9, '#0b100e', 0.78);
    drawText(p, m.label, x, y, m.kind === 'chamada' ? '#f6c2bb' : m.kind === 'casa' ? HOME.lampLight : CENTRAL.pale);
  }
}

// viatura (vista lateral, frente para a direita) 9×6 + contorno
// prettier-ignore
const AMB_ROWS = [
  '.LL......',
  'wwwwww...',
  'wwXwwwcw.',
  'wXXXwwccw',
  'SSSSSSSSS',
  'wwwwwwwww',
  '.kk...kk.',
];

const lastPos = new Map<string, { x: number; dir: 1 | -1 }>();

function ambulancePix(type: 'USA' | 'USB', status: string, t: number, dir: 1 | -1): Pix {
  const stripe = type === 'USA' ? '#e0483d' : '#f07a2a';
  const moving = status === 'DESLOC' || status === 'TRANSP';
  const blink = Math.floor(t / 180) % 2 === 0;
  const off = status === 'PANE' || status === 'FORA';
  const pal: Record<string, string> = {
    w: off ? '#9aa39e' : '#e6efd9',
    X: stripe,
    c: '#5f8fa8',
    S: stripe,
    k: '#14181a',
    L: moving ? (blink ? '#ff5a4a' : '#5aa7ff') : '#7a8a84',
  };
  const p = new Pix(11, 9);
  AMB_ROWS.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      const xx = dir === 1 ? x : 8 - x;
      p.px(xx + 1, y + 1, pal[ch]);
    }),
  );
  p.outline('#0b100e');
  return p;
}

function drawUnits(p: Pix, units: MapUnit[], T: number, t: number): void {
  // agrupa viaturas sobrepostas e espalha em leque
  const groups = new Map<string, MapUnit[]>();
  for (const u of units) {
    const key = `${Math.round(u.x * 2)},${Math.round(u.y * 2)}`;
    const arr = groups.get(key) ?? [];
    arr.push(u);
    groups.set(key, arr);
  }
  const placed: { u: MapUnit; px: number; py: number; up: boolean }[] = [];
  for (const arr of groups.values()) {
    arr.sort((a, b) => a.id.localeCompare(b.id));
    arr.forEach((u, i) => {
      const cx = Math.round(u.x * T + T / 2);
      const cy = Math.round(u.y * T + T / 2);
      const spread = 13;
      const px = cx + Math.round((i - (arr.length - 1) / 2) * spread);
      placed.push({ u, px, py: cy, up: arr.length > 1 && i % 2 === 1 });
    });
  }
  const labels: { u: MapUnit; px: number; ax: number; ay: number; up: boolean }[] = [];
  // não selecionadas primeiro
  placed.sort((a, b) => Number(!!a.u.selected) - Number(!!b.u.selected) || a.py - b.py);
  for (const { u, px, py, up } of placed) {
    const prev = lastPos.get(u.id);
    let dir: 1 | -1 = prev?.dir ?? 1;
    if (prev && Math.abs(u.x - prev.x) > 0.01) dir = u.x > prev.x ? 1 : -1;
    lastPos.set(u.id, { x: u.x, dir });
    const amb = ambulancePix(u.type, u.status, t, dir);
    const ax = px - 5;
    const ay = py - 5;
    // sombra
    p.recta(ax + 2, ay + 8, 8, 1, '#000000', 0.45);
    p.blit(amb, ax, ay);
    // ponto de status
    const sc = UNIT_STATUS_COLOR[u.status as UnitStatus] ?? CENTRAL.pale;
    const dx = dir === 1 ? ax - 2 : ax + 9;
    p.rect(dx, ay - 1, 5, 5, '#0b100e');
    p.rect(dx + 1, ay, 3, 3, sc);
    p.px(dx + 1, ay, mix(sc, '#ffffff', 0.5));
    if (u.selected) {
      const on = Math.floor(t / 260) % 2 === 0;
      const col = on ? CENTRAL.amber : CENTRAL.light;
      const x0 = ax - 3;
      const y0 = ay - 3;
      const x1 = ax + 13;
      const y1 = ay + 11;
      for (const [x, y, sx, sy] of [
        [x0, y0, 1, 1],
        [x1, y0, -1, 1],
        [x0, y1, 1, -1],
        [x1, y1, -1, -1],
      ]) {
        p.px(x, y, col);
        p.px(x + sx, y, col);
        p.px(x + 2 * sx, y, col);
        p.px(x, y + sy, col);
        p.px(x, y + 2 * sy, col);
      }
    }
    labels.push({ u, px, ax, ay, up });
  }
  // rótulos por último, sem se sobrepor (nem uns aos outros, nem às viaturas)
  const bodies: LRect[] = placed.map(({ px, py }) => ({ x: px - 7, y: py - 6, w: 16, h: 11 }));
  const taken: LRect[] = [];
  // a selecionada escolhe primeiro
  labels.sort((a, b) => Number(!!b.u.selected) - Number(!!a.u.selected));
  for (const { u, px, ax, ay, up } of labels) {
    const lab = u.label;
    const wpx = textWidth(lab);
    const cl = (x: number) => Math.max(1, Math.min(p.w - wpx - 1, x));
    const below = ay + 11;
    const above = ay - 9;
    const cands: [number, number][] = [
      [cl(px - Math.floor(wpx / 2)), up ? above : below],
      [cl(px - Math.floor(wpx / 2)), up ? below : above],
      [cl(px - Math.floor(wpx / 2)), below + 7],
      [cl(px - Math.floor(wpx / 2)), above - 7],
      [cl(ax + 13), ay + 2],
      [cl(ax - wpx - 3), ay + 2],
      [cl(px - Math.floor(wpx / 2)), below + 14],
    ];
    const fits = ([x, y]: [number, number]) => {
      if (y < 1 || y + 6 > p.h) return false;
      const r = { x: x - 1, y: y - 1, w: wpx + 2, h: 7 };
      return !taken.some((q) => hit(q, r)) && !bodies.some((q) => hit(q, r));
    };
    const pick = cands.find(fits) ?? cands.find(([, y]) => y >= 1 && y + 6 <= p.h) ?? cands[0];
    const [lx, ly] = pick;
    taken.push({ x: lx - 1, y: ly - 1, w: wpx + 2, h: 7 });
    p.recta(lx - 1, ly - 1, wpx + 2, 7, '#0b100e', u.selected ? 0.9 : 0.7);
    drawText(p, lab, lx, ly, u.selected ? CENTRAL.amber : u.type === 'USA' ? '#f2b2aa' : '#f5c49a');
  }
}

function drawHighlight(p: Pix, name: string, T: number, t: number, skipLabel = false): void {
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const segs = STREETS.filter((s) => norm(s.name) === norm(name));
  if (!segs.length) return;
  const a = 0.35 + 0.15 * Math.sin(t / 220);
  for (const s of segs) {
    for (let i = s.from; i <= s.to; i++) {
      const [x, y] = s.axis === 'h' ? [i, s.at] : [s.at, i];
      p.recta(x * T, y * T, T, T, CENTRAL.amber, a);
    }
    if (skipLabel) continue;
    // nome ao longo da rua
    const midI = Math.round((s.from + s.to) / 2);
    const [mx, my] = s.axis === 'h' ? [midI, s.at] : [s.at, midI];
    const label = s.name.toUpperCase();
    const wpx = textWidth(label);
    let x = mx * T + Math.floor(T / 2) - Math.floor(wpx / 2);
    x = Math.max(2, Math.min(p.w - wpx - 2, x));
    let y = s.axis === 'h' ? my * T - 8 : my * T + Math.floor(T / 2) - 2;
    if (s.axis === 'v') x = Math.min(p.w - wpx - 2, mx * T + T + 3);
    if (y < 4) y = my * T + T + 3;
    p.recta(x - 2, y - 2, wpx + 4, 9, '#0b100e', 0.85);
    drawText(p, label, x, y, CENTRAL.amber);
  }
}

function drawHover(p: Pix, ht: [number, number], T: number): void {
  const [x, y] = ht;
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
  p.frame(x * T - 1, y * T - 1, T + 2, T + 2, '#0b100e');
  p.frame(x * T, y * T, T, T, CENTRAL.light);
}

function drawLiveLandmarks(p: Pix, T: number, t: number): void {
  if (T < 8) return;
  for (const pl of placeLandmarks()) {
    if (pl.lm.kind === 'central') {
      // luz da antena piscando
      const [ax, ay] = pl.at;
      const cx = ax * T + Math.floor(T / 2);
      const cy = ay * T + Math.floor(T / 2);
      if (Math.floor(t / 600) % 2 === 0) {
        p.px(cx - 1, cy - 4, '#ff6a5a');
        p.pxa(cx - 2, cy - 4, '#ff6a5a', 0.4);
        p.pxa(cx, cy - 4, '#ff6a5a', 0.4);
      } else p.px(cx - 1, cy - 4, '#6a2420');
    }
  }
}

const work = new Map<string, Pix>();

/** desenha no Pix de trabalho (reutilizado a cada quadro, um por tamanho) */
function renderMapInto(o: CityMapOpts): Pix {
  const T = Math.max(2, Math.floor(o.tile));
  const b = base(T, o.showLabels !== false, !!o.flood);
  const key = `${b.w}x${b.h}`;
  let p = work.get(key);
  if (!p) {
    p = new Pix(b.w, b.h);
    work.set(key, p);
  }
  p.copyFrom(b);
  shimmer(p, T, o.t, !!o.flood);
  drawLiveLandmarks(p, T, o.t);
  if (o.highlightStreet) {
    const n = o.highlightStreet.trim().toLowerCase();
    const shown = (o.markers ?? []).some((m) => (m.label ?? '').trim().toLowerCase() === n);
    drawHighlight(p, o.highlightStreet, T, o.t, shown);
  }
  for (const r of o.routes ?? []) drawRoute(p, r, T, o.t);
  const lab = LABELS.get(b);
  if (lab) p.blit(lab, 0, 0);
  for (const m of o.markers ?? []) drawMarker(p, m, T, o.t);
  if (o.units?.length) drawUnits(p, o.units, T, o.t);
  if (o.hoverTile) drawHover(p, o.hoverTile, T);
  return p;
}

/** Renderiza o mapa num Pix NOVO (puro, sem DOM; pode ser guardado). */
export function renderCityMap(o: CityMapOpts): Pix {
  return renderMapInto(o).copy();
}

/**
 * Desenha o mapa no contexto 2D, em (0,0), em pixels nativos
 * (MAP_W·tile × MAP_H·tile). Amplie com CSS image-rendering: pixelated.
 */
export function drawCityMap(ctx: CanvasRenderingContext2D, o: CityMapOpts): void {
  presentPix(ctx, renderMapInto(o), 0, 0, 1, 'map');
}

/** cor de status de viatura (para chips da UI) */
export function unitStatusColor(status: string): string {
  return UNIT_STATUS_COLOR[status as UnitStatus] ?? CENTRAL.pale;
}

void hashStr;
