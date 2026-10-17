// =============================================================================
// Videochamada: luz da cena (dia, noite, escuro).
//
// O lugar é desenhado com as cores de dia. A luz é um mapa de níveis por pixel
// (lâmpadas, postes, TV, lanterna do celular, faróis da ambulância), em faixas
// com pontilhado ordenado na fronteira — nada de degradê contínuo. Cada cor
// passa por uma gradação memorizada por nível: no escuro puxa para o
// azul-violeta, na luz da lâmpada para o amarelo quente, no poste para o sódio.
// Puro (sem DOM).
// =============================================================================
import { Pix, bayerOn, unpackRgb } from './pix';
import type { Lamp } from './videoPlace';

export type LightMode = 'dia_dentro' | 'dia_fora' | 'noite_dentro' | 'noite_fora' | 'escuro';

const BANDS = 6;

export interface LightMap {
  w: number;
  h: number;
  /** nível já em faixa (0..BANDS-1) */
  band: Uint8Array;
  /** tingimento dominante por pixel (índice em HUES) */
  hue: Uint8Array;
  mode: LightMode;
}

const HUES = ['quente', 'sodio', 'fria', 'tv', 'vermelha', 'azul'] as const;

/**
 * Monta o mapa de luz: ambiente + soma das lâmpadas (queda suave), quantizado
 * em faixas com pontilhado.
 */
export function lightMap(w: number, h: number, mode: LightMode, lamps: Lamp[], extra: { flashlight?: [number, number, number]; headlights?: boolean } = {}): LightMap {
  const band = new Uint8Array(w * h);
  const hue = new Uint8Array(w * h);
  const amb = mode === 'dia_fora' ? 1 : mode === 'dia_dentro' ? 0.86 : mode === 'noite_dentro' ? 0.34 : mode === 'noite_fora' ? 0.22 : 0.06;
  const ls = [...lamps];
  if (extra.flashlight) ls.push({ x: extra.flashlight[0], y: extra.flashlight[1], r: extra.flashlight[2], k: 1.1, hue: 'fria' });
  if (extra.headlights) {
    // faróis e lanternas da equipe: luz larga vindo da câmera
    ls.push({ x: w / 2, y: h + 30, r: 150, k: 0.95, hue: 'fria' });
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let L = amb;
      let best = 0;
      let bh = 0;
      if (mode === 'dia_dentro') {
        // dia dentro de casa: cantos e chão perto da câmera um pouco mais escuros
        const ex = (x - w / 2) / (w / 2);
        const ey = (y - h * 0.42) / (h * 0.7);
        L = 1 - Math.min(0.2, (ex * ex * 0.14 + ey * ey * 0.1) * 1.1);
      } else {
        for (const l of ls) {
          const dx = x - l.x;
          const dy = (y - l.y) * 1.15;
          const d = Math.sqrt(dx * dx + dy * dy) / l.r;
          if (d >= 1) continue;
          const v = (1 - d * d) * l.k;
          L += v * (1 - amb);
          if (v > best) {
            best = v;
            bh = Math.max(0, HUES.indexOf(l.hue ?? 'quente'));
          }
        }
      }
      L = Math.max(0, Math.min(1, L));
      const q = L * (BANDS - 1);
      const f = Math.floor(q);
      // pontilhado só numa faixa estreita na fronteira entre níveis
      const fr = q - f;
      const e = fr < 0.3 ? 0 : fr > 0.7 ? 1 : (fr - 0.3) / 0.4;
      const b = Math.min(BANDS - 1, f + (bayerOn(x, y, e) ? 1 : 0));
      band[y * w + x] = b;
      hue[y * w + x] = bh;
    }
  return { w, h, band, hue, mode };
}

// -----------------------------------------------------------------------------
// Gradação de cor por nível: "multiplicar" pela cor da sombra ou da luz
// -----------------------------------------------------------------------------
const memo = new Map<string, Map<number, number>>();

/** cor de multiplicação na sombra e na luz (por modo e fonte) */
const SHADOW: Record<LightMode, [number, number, number]> = {
  dia_fora: [1, 1, 1],
  dia_dentro: [0.8, 0.79, 0.86],
  noite_dentro: [0.24, 0.23, 0.38],
  noite_fora: [0.13, 0.15, 0.27],
  escuro: [0.05, 0.05, 0.09],
};
const LIGHT: Record<(typeof HUES)[number], [number, number, number]> = {
  quente: [1, 0.93, 0.8],
  sodio: [1, 0.84, 0.6],
  fria: [0.94, 0.99, 1],
  tv: [0.62, 0.78, 1],
  vermelha: [1, 0.45, 0.4],
  azul: [0.5, 0.62, 1],
};

function grade(r: number, g: number, b: number, level: number, mode: LightMode, hueIdx: number): [number, number, number] {
  const t = Math.pow(level / (BANDS - 1), 0.85);
  const sh = SHADOW[mode];
  const lt = mode === 'dia_dentro' ? [1, 1, 1] : mode === 'escuro' ? [0.95, 0.97, 1] : LIGHT[HUES[hueIdx] ?? 'quente'];
  const m0 = sh[0] + (lt[0] - sh[0]) * t;
  const m1 = sh[1] + (lt[1] - sh[1]) * t;
  const m2 = sh[2] + (lt[2] - sh[2]) * t;
  // um pouco de "luz de recorte" nas sombras para nada virar preto chapado
  const lift = mode === 'escuro' ? 3 : 6;
  return [Math.min(255, r * m0 + lift * (1 - t)), Math.min(255, g * m1 + lift * (1 - t)), Math.min(255, b * m2 + lift * 1.6 * (1 - t))];
}

/** aplica a luz a um Pix posicionado em (ox, oy) do mapa (pixels transparentes ficam) */
export function applyLight(p: Pix, lm: LightMap, ox = 0, oy = 0): void {
  if (lm.mode === 'dia_fora') return;
  for (let y = 0; y < p.h; y++) {
    const my = y + oy;
    if (my < 0 || my >= lm.h) continue;
    for (let x = 0; x < p.w; x++) {
      const mx = x + ox;
      if (mx < 0 || mx >= lm.w) continue;
      const i = y * p.w + x;
      const v = p.data[i];
      const a = v >>> 24;
      if (!a) continue;
      const j = my * lm.w + mx;
      const b = lm.band[j];
      const hu = lm.hue[j];
      const key = lm.mode + b + ':' + hu;
      let m = memo.get(key);
      if (!m) {
        m = new Map();
        memo.set(key, m);
      }
      const rgb = v & 0xffffff;
      let o = m.get(rgb);
      if (o === undefined) {
        const [r, g, bb] = unpackRgb(v);
        const [R, G2, B] = grade(r, g, bb, b, lm.mode, hu);
        o = ((Math.round(B) & 0xff) << 16) | ((Math.round(G2) & 0xff) << 8) | (Math.round(R) & 0xff);
        m.set(rgb, o);
      }
      p.data[i] = ((a << 24) | o) >>> 0;
    }
  }
}

export function lightModeFor(outdoor: boolean, light: 'dia' | 'noite' | 'escuro' | undefined): LightMode {
  if (light === 'escuro') return 'escuro';
  if (light === 'noite') return outdoor ? 'noite_fora' : 'noite_dentro';
  return outdoor ? 'dia_fora' : 'dia_dentro';
}
