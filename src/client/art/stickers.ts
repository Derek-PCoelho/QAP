// =============================================================================
// Adesivos do Ozzy para o quadro de cortiça (estilo adesivo recortado: o
// desenho com uma borda branca de 2 px em volta da silhueta e uma sombrinha
// embaixo-direita, como vinil colado). Nativos ~30×28; a UI amplia ×2/×3.
//
// ozzyStickerPix(kind) → Pix com fundo transparente (em cache)
// ozzySticker(kind, scale) → dataURL PNG (fora do navegador devolve '')
// =============================================================================
import { Pix, hasDOM } from './pix';
import { dogFramePix } from './dog';
import { drawText } from './font';

export type OzzyStickerKind = 'feliz' | 'dormindo' | 'latindo' | 'coracao' | 'festa' | 'sirene';
export const OZZY_STICKERS: OzzyStickerKind[] = ['feliz', 'dormindo', 'latindo', 'coracao', 'festa', 'sirene'];
/** legenda curta de cada adesivo (para a UI) */
export const OZZY_STICKER_LABELS: Record<OzzyStickerKind, string> = {
  feliz: 'Ozzy feliz',
  dormindo: 'Ozzy dormindo',
  latindo: 'Ozzy latindo',
  coracao: 'Ozzy com coração',
  festa: 'Ozzy de chapéu de festa',
  sirene: 'Ozzy de sirene',
};

const INK = '#1b1a17';
const WHITE = '#fffaf0';

function heart(p: Pix, x: number, y: number, col: string, hi: string): void {
  const rows = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  rows.forEach((r, j) => [...r].forEach((ch, i) => ch === '#' && p.px(x + i, y + j, col)));
  p.px(x + 1, y + 1, hi);
}

/** chapéu de festa (cone listrado com pompom) com a ponta em (x, y) */
function partyHat(p: Pix, x: number, y: number): void {
  for (let j = 0; j < 8; j++) {
    const hw = Math.floor(j / 2);
    for (let i = -hw; i <= hw; i++) p.px(x + i, y + 2 + j, (j + i) % 3 === 0 ? '#f2d45c' : '#5aa7d6');
  }
  p.px(x - 1, y, '#e8566a');
  p.px(x, y, '#ff8a9a');
  p.px(x + 1, y, '#e8566a');
  p.px(x, y + 1, '#e8566a');
  p.px(x, y - 1, '#e8566a');
  // elástico
  p.px(x - 4, y + 10, '#d8d0c0');
  p.px(x + 4, y + 10, '#d8d0c0');
}

/** giroflex: cúpula vermelha e azul com raios */
function siren(p: Pix, x: number, y: number): void {
  p.rect(x - 3, y + 4, 7, 2, '#5a6460');
  p.rect(x - 3, y, 3, 4, '#e0483d');
  p.rect(x, y, 4, 4, '#4a8fd0');
  p.px(x - 2, y + 1, '#ff9a8a');
  p.px(x + 1, y + 1, '#bfe3f2');
  p.hl(x - 2, x + 2, y - 1, '#3a3a3a');
  // raios de luz
  for (const [dx, dy, c] of [
    [-6, 0, '#e0483d'],
    [-7, -2, '#e0483d'],
    [-5, -3, '#e0483d'],
    [6, 0, '#4a8fd0'],
    [7, -2, '#4a8fd0'],
    [5, -3, '#4a8fd0'],
  ] as [number, number, string][])
    p.px(x + dx, y + dy, c);
}

function compose(kind: OzzyStickerKind): Pix {
  const W = 30;
  const H = 28;
  const art = new Pix(W, H);
  const dog = (frame: string, bottom = H - 4) => {
    const d = dogFramePix(frame);
    const x = Math.round(W / 2 - d.w / 2);
    const y = bottom - d.h + 1;
    art.blit(d, x, y);
    return { x, y, w: d.w, h: d.h };
  };
  switch (kind) {
    case 'feliz': {
      const r = dog('brincando1');
      // brilhinhos
      for (const [x, y] of [
        [r.x - 2, r.y + 2],
        [r.x + r.w + 1, r.y + 1],
      ] as [number, number][]) {
        art.px(x, y - 1, '#f2d45c');
        art.px(x - 1, y, '#f2d45c');
        art.px(x, y, '#fff3c0');
        art.px(x + 1, y, '#f2d45c');
        art.px(x, y + 1, '#f2d45c');
      }
      break;
    }
    case 'dormindo': {
      const r = dog('dormindo0');
      const z = (x: number, y: number, n: number) => {
        art.hl(x, x + n - 1, y, '#5aa7d6');
        for (let j = 1; j < n - 1; j++) art.px(x + n - 1 - j, y + j, '#5aa7d6');
        art.hl(x, x + n - 1, y + n - 1, '#5aa7d6');
      };
      z(r.x + r.w - 6, r.y - 5, 4);
      z(r.x + r.w - 1, r.y - 10, 5);
      break;
    }
    case 'latindo': {
      const r = dog('latindo1');
      // "AU!" grande saindo do focinho
      drawText(art, 'AU!', r.x + r.w - 12, r.y - 7, '#e0483d', { outline: WHITE });
      break;
    }
    case 'coracao': {
      const r = dog('sentado0');
      heart(art, r.x + r.w - 6, r.y - 6, '#e0483d', '#ff9a8a');
      break;
    }
    case 'festa': {
      const r = dog('sentado1');
      partyHat(art, r.x + 10, r.y - 9);
      // confete
      for (const [x, y, c] of [
        [r.x - 2, r.y + 1, '#e8566a'],
        [r.x + 1, r.y - 4, '#7fd17a'],
        [r.x + r.w, r.y - 2, '#f2d45c'],
        [r.x + r.w + 1, r.y + 5, '#5aa7d6'],
      ] as [number, number, string][])
        art.px(x, y, c);
      break;
    }
    case 'sirene': {
      const r = dog('sentado0');
      siren(art, r.x + 10, r.y - 5);
      break;
    }
  }
  // recorte do adesivo: contorno escuro já vem do sprite; borda branca de 2 px e sombrinha
  const out = new Pix(W, H);
  out.blit(art, 0, 0);
  out.outline(WHITE, true);
  out.outline(WHITE, false);
  const sh = new Pix(W, H);
  sh.blit(out, 1, 1, { tint: '#000000', tintAmount: 1, alpha: 0.35 });
  sh.blit(out, 0, 0);
  return sh;
}

const cache = new Map<OzzyStickerKind, Pix>();

/** Adesivo do Ozzy (Pix 30×28, fundo transparente). */
export function ozzyStickerPix(kind: OzzyStickerKind): Pix {
  const k = (OZZY_STICKERS as string[]).includes(kind) ? kind : 'feliz';
  let p = cache.get(k);
  if (!p) {
    p = compose(k);
    cache.set(k, p);
  }
  return p;
}

const urls = new Map<string, string>();

/** Adesivo como dataURL PNG (scale inteiro: 1 = 30×28). Fora do navegador devolve ''. */
export function ozzySticker(kind: OzzyStickerKind, scale = 2): string {
  if (!hasDOM()) return '';
  const key = `${kind}|${scale}`;
  let u = urls.get(key);
  if (!u) {
    u = ozzyStickerPix(kind).toDataURL(Math.max(1, Math.round(scale)));
    urls.set(key, u);
  }
  return u;
}
