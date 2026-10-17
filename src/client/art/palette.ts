// =============================================================================
// QAP — Emergency Dispatch — paletas oficiais e utilitários de cor.
// CENTRAL = luz fria de fluorescente (trabalho). HOME = luz quente de lâmpada
// incandescente (casa). Com o Desgaste, a casa "vai ficando fluorescente":
// cada cor quente desliza para a sua contrapartida fria (blendHome / homeGrader).
// Módulo puro: sem DOM.
// =============================================================================
import type { UnitStatus, MemberStatus, Color } from '../../engine/types';

export const CENTRAL = {
  bg0: '#0d1311',
  bg1: '#16201c',
  bg2: '#1f2c27',
  panel: '#26352f',
  panel2: '#2f4139',
  line: '#3d5248',
  mid: '#5f7a6c',
  soft: '#8fa89a',
  pale: '#c4d4c0',
  light: '#e6efd9',
  red: '#e0483d',
  amber: '#e8a33d',
  green: '#7fd17a',
  blue: '#5aa7d6',
  samu: '#f07a2a',
  postit: '#f2d45c',
  paper: '#efe6cf',
  ink: '#1b1a17',
} as const;
export type CentralKey = keyof typeof CENTRAL;
export type CentralPalette = Record<CentralKey, string>;

export const HOME = {
  bg0: '#140d08',
  bg1: '#24170e',
  bg2: '#3a2516',
  wood: '#5a3a22',
  wood2: '#7a5030',
  tan: '#a8763f',
  lamp: '#f2c46b',
  lampLight: '#ffe2a3',
  wall: '#c99a5e',
  wall2: '#b5844c',
  fabricRed: '#a8413a',
  fabricBlue: '#3f5f8a',
  plant: '#5f8a4a',
} as const;
export type HomeKey = keyof typeof HOME;
export type HomePalette = Record<HomeKey, string>;

/** Contrapartida fria de cada cor da casa (para onde ela desliza com o Desgaste). */
export const HOME_COLD: HomePalette = {
  bg0: CENTRAL.bg0,
  bg1: CENTRAL.bg1,
  bg2: CENTRAL.bg2,
  wood: CENTRAL.panel,
  wood2: CENTRAL.panel2,
  tan: '#6f8a7b',
  lamp: CENTRAL.pale,
  lampLight: CENTRAL.light,
  wall: CENTRAL.soft,
  wall2: '#779182',
  fabricRed: '#55695d',
  fabricBlue: '#41595e',
  plant: CENTRAL.mid,
};

export const TRIAGE: Record<Color, string> = {
  vermelho: '#d94436',
  amarelo: '#e8b931',
  verde: '#4fae5b',
  azul: '#4a8fd0',
};

export const SKIN = ['#f1c7a5', '#d9a57e', '#b97b52', '#8d5634', '#5e3a22'] as const;
export const HAIR = ['#1c1410', '#3b2516', '#6b4a2e', '#bdbdb5', '#e8e4dc'] as const;

/** Cores de status das viaturas (ponto no mapa e chips da UI). */
export const UNIT_STATUS_COLOR: Record<UnitStatus, string> = {
  QRV: CENTRAL.green,
  DESLOC: CENTRAL.amber,
  LOCAL: CENTRAL.red,
  TRANSP: CENTRAL.blue,
  RETIDO: '#a477d6',
  RETORNO: CENTRAL.pale,
  PANE: '#6f7873',
  FORA: '#6f7873',
};

/** Cor de destaque de cada estado de familiar (ícones de status). */
export const MEMBER_STATUS_COLOR: Record<MemberStatus, string> = {
  bem: CENTRAL.green,
  fome: CENTRAL.amber,
  frio: CENTRAL.blue,
  doente: '#9bc45a',
  triste: '#7f9fc4',
  critico: CENTRAL.red,
  internado: CENTRAL.pale,
  ausente: CENTRAL.mid,
  morto: CENTRAL.ink,
};

// -----------------------------------------------------------------------------
// Conversões
// -----------------------------------------------------------------------------
const rgbCache = new Map<string, [number, number, number]>();

/** '#rgb' | '#rrggbb' → [r, g, b] (0..255). */
export function hexToRgb(hex: string): [number, number, number] {
  const hit = rgbCache.get(hex);
  if (hit) return hit;
  let h = hex.trim().replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  const out: [number, number, number] = Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [255, 0, 255];
  rgbCache.set(hex, out);
  return out;
}

const to2 = (v: number) => {
  const c = Math.max(0, Math.min(255, Math.round(v)));
  return (c < 16 ? '0' : '') + c.toString(16);
};

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + to2(r) + to2(g) + to2(b);
}

/** Interpolação linear entre duas cores hex (t ∈ [0,1]). */
export function mix(a: string, b: string, t: number): string {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

/** Luminância perceptual 0..1. */
export function luma(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Saturação aproximada 0..1 (max-min). */
export function chroma(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
}

/**
 * Sombra/luz com desvio de matiz (pixel art): amt < 0 escurece puxando para um
 * roxo-escuro; amt > 0 clareia puxando para um branco quente.
 */
export function shade(hex: string, amt: number): string {
  if (amt < 0) return mix(hex, '#160d1c', Math.min(1, -amt));
  if (amt > 0) return mix(hex, '#fff3d6', Math.min(1, amt));
  return hex;
}

/** Variante fria de sombra (para a central): escurece puxando para verde-petróleo. */
export function shadeCold(hex: string, amt: number): string {
  if (amt < 0) return mix(hex, '#06100e', Math.min(1, -amt));
  if (amt > 0) return mix(hex, '#eef7e6', Math.min(1, amt));
  return hex;
}

/** Paleta da casa já misturada com a contrapartida fria (t = Desgaste/100). */
export function blendHome(t: number): HomePalette {
  const k = Math.max(0, Math.min(1, t));
  const out = {} as HomePalette;
  for (const key of Object.keys(HOME) as HomeKey[]) out[key] = mix(HOME[key], HOME_COLD[key], k);
  return out;
}

/** Variáveis CSS a partir de uma paleta: { '--prefix-chave': '#hex' } (serve como style do React). */
export function cssVars(pal: Record<string, string>, prefix: string): Record<string, string> {
  const out: Record<string, string> = {};
  const p = prefix.replace(/^-+/, '').replace(/-+$/, '');
  for (const [k, v] of Object.entries(pal)) out[`--${p ? p + '-' : ''}${k}`] = v;
  return out;
}

/** Mesmo que cssVars, mas como texto "--x: #..; --y: #..;" para injetar em <style>. */
export function cssVarsText(pal: Record<string, string>, prefix: string): string {
  return Object.entries(cssVars(pal, prefix))
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ');
}

// -----------------------------------------------------------------------------
// Gradação "a casa vai ficando fluorescente"
// Transferência de cor por âncoras (interpolação de Shepard): cada cor da casa
// vai exatamente para a sua contrapartida; cores derivadas (sombras, pele,
// objetos) seguem o deslocamento das âncoras mais próximas. Cores muito
// saturadas (alertas, giz de cera) perdem só parte da cor, para continuarem
// legíveis.
// -----------------------------------------------------------------------------
type Anchor = { from: [number, number, number]; d: [number, number, number] };

let ANCHORS: Anchor[] | null = null;

function anchors(): Anchor[] {
  if (ANCHORS) return ANCHORS;
  const list: [string, string][] = [];
  for (const k of Object.keys(HOME) as HomeKey[]) list.push([HOME[k], HOME_COLD[k]]);
  // pele sob fluorescente: pálida, levemente esverdeada
  for (const s of SKIN) list.push([s, mix(s, mix('#a9b8a8', s, 0.25), 0.55)]);
  // neutros
  list.push(['#ffffff', CENTRAL.light]);
  list.push(['#000000', '#050807']);
  list.push([CENTRAL.paper, '#dfe6d6']);
  list.push([CENTRAL.ink, '#121815']);
  ANCHORS = list.map(([a, b]) => {
    const A = hexToRgb(a);
    const B = hexToRgb(b);
    return { from: A, d: [B[0] - A[0], B[1] - A[1], B[2] - A[2]] };
  });
  return ANCHORS;
}

const COLD_RAMP = [CENTRAL.bg0, CENTRAL.bg1, CENTRAL.bg2, CENTRAL.panel, CENTRAL.panel2, CENTRAL.line, CENTRAL.mid, CENTRAL.soft, CENTRAL.pale, CENTRAL.light];

/** Cor da rampa fria com a mesma luminância (0..1). */
export function coldRampAt(l: number): string {
  const lums = COLD_RAMP.map(luma);
  if (l <= lums[0]) return COLD_RAMP[0];
  for (let i = 1; i < COLD_RAMP.length; i++) {
    if (l <= lums[i]) return mix(COLD_RAMP[i - 1], COLD_RAMP[i], (l - lums[i - 1]) / Math.max(1e-6, lums[i] - lums[i - 1]));
  }
  return COLD_RAMP[COLD_RAMP.length - 1];
}

/** tons registrados como pele (sprites de corpo): gradeHome usa gradeSkin neles */
const SKIN_TONES = new Set<string>();

/** Marca cores como pele, para o Desgaste esfriá-las por igual (gradeSkin) nas cenas. */
export function markSkinTones(...hexes: string[]): void {
  for (const h of hexes) SKIN_TONES.add(h.toLowerCase());
}

/** Gradua uma cor qualquer da cena doméstica para o Desgaste t (0 = casa quente, 1 = central). */
export function gradeHome(hex: string, t: number): string {
  if (t <= 0) return hex;
  if (SKIN_TONES.has(hex.toLowerCase())) return gradeSkin(hex, t);
  const k = Math.min(1, t);
  const c = hexToRgb(hex);
  const an = anchors();
  let wsum = 0;
  let dx = 0;
  let dy = 0;
  let dz = 0;
  for (const a of an) {
    const ex = c[0] - a.from[0];
    const ey = c[1] - a.from[1];
    const ez = c[2] - a.from[2];
    const d2 = ex * ex + ey * ey + ez * ez;
    if (d2 < 1) {
      return rgbToHex(c[0] + a.d[0] * k, c[1] + a.d[1] * k, c[2] + a.d[2] * k);
    }
    const w = 1 / (d2 * Math.sqrt(d2)); // potência 3: influência local
    wsum += w;
    dx += a.d[0] * w;
    dy += a.d[1] * w;
    dz += a.d[2] * w;
  }
  dx /= wsum;
  dy /= wsum;
  dz /= wsum;
  // cores saturadas: preservar parte da cor (informação continua legível)
  const sat = chroma(hex);
  const keep = sat > 0.45 ? 0.45 : sat > 0.3 ? 0.7 : 1;
  const shifted = rgbToHex(c[0] + dx * k, c[1] + dy * k, c[2] + dz * k);
  // e um leve puxão para a rampa fria (unifica tudo sob a mesma luz)
  const ramp = coldRampAt(luma(shifted));
  return mix(shifted, ramp, 0.35 * k * keep);
}

/**
 * Gradação da PELE sob a luz fria: uma transformação contínua (a mesma para
 * qualquer tom, do mais claro ao mais escuro) — mantém a luminância relativa,
 * tira parte da cor e puxa para um cinza-esverdeado pálido. Ao contrário da
 * transferência por âncoras, tons vizinhos da mesma rampa nunca vão para
 * destinos diferentes, então a pele escura esfria por igual (sem placas).
 */
export function gradeSkin(hex: string, t: number): string {
  if (t <= 0) return hex;
  const k = Math.min(1, t);
  const [r, g, b] = hexToRgb(hex);
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  // um pouco mais pálida (luz de tubo), sem achatar os tons escuros
  const y2 = y + (255 - y) * 0.1 * k;
  const f = y2 / Math.max(1, y);
  // cinza da mesma luminância, levemente verde-azulado
  const gr = [y2 * 0.95, y2 * 1.03, y2 * 0.99];
  const keep = 1 - 0.62 * k; // fração da cor original que sobra
  const out = [0, 1, 2].map((i) => [r, g, b][i] * f * keep + gr[i] * (1 - keep));
  return rgbToHex(out[0], out[1], out[2]);
}

const graderCache = new Map<number, (hex: string) => string>();

/** Função memoizada de gradação para um t (quantizado em 1/40). */
export function homeGrader(t: number): (hex: string) => string {
  const q = Math.round(Math.max(0, Math.min(1, t)) * 40);
  let fn = graderCache.get(q);
  if (fn) return fn;
  const k = q / 40;
  const memo = new Map<string, string>();
  fn = (hex: string) => {
    let v = memo.get(hex);
    if (v === undefined) {
      v = gradeHome(hex, k);
      memo.set(hex, v);
    }
    return v;
  };
  graderCache.set(q, fn);
  return fn;
}

/** Quantiza t para chaves de cache. */
export function quantize(t: number, steps = 40): number {
  return Math.round(Math.max(0, Math.min(1, t)) * steps) / steps;
}
