// =============================================================================
// Sprites de corpo inteiro da família (~16×32): o cônjuge (Lúcia ou Alex), o
// Liam (id DAVI), Dona Zélia e você.
// Poses: em_pe / sentado / deitado. Respiração (1px), piscadas e pequenas
// mudanças por status (frio treme e ganha xale; doente/crítico empalidece;
// triste baixa a cabeça). Mesmas cores dos retratos.
// =============================================================================
import { Pix } from './pix';
import { SKIN, HAIR, HOME, mix, shade } from './palette';
import type { MemberStatus } from '../../engine/types';

export type CastId = 'LUCIA' | 'ALEX' | 'DAVI' | 'ZELIA' | 'EU_M' | 'EU_F';
export type Pose = 'em_pe' | 'sentado' | 'deitado';

type Kind = 'adult_f' | 'adult_m' | 'child' | 'elder_f';

interface Body {
  kind: Kind;
  skin: string;
  hair: string;
  top: string;
  top2?: string;
  bottom: string;
  shoes: string;
  hairStyle: 'curly_big' | 'short_m' | 'bun_low' | 'kid' | 'bun_top' | 'bucket_hat' | 'curly_short';
  topStyle: 'blouse_tape' | 'shirt_tape' | 'scrubs' | 'stripes' | 'floral' | 'plaid';
  bottomStyle: 'skirt' | 'pants' | 'shorts' | 'long_skirt';
  glasses?: boolean;
  earrings?: boolean;
  stubble?: boolean;
  /** barba cheia curta (e bigode) */
  beard?: boolean;
}

/** personagens extras só para vinhetas de final */
export type ExtraId = 'ANTONIO' | 'ESPOSA';

const EXTRA: Record<ExtraId, Body> = {
  ANTONIO: {
    kind: 'adult_m', skin: SKIN[2], hair: HAIR[3], top: '#8a3a2c', top2: '#5a2418', bottom: '#8a7a5a', shoes: '#4a3424',
    hairStyle: 'bucket_hat', topStyle: 'plaid', bottomStyle: 'pants', stubble: true,
  },
  ESPOSA: {
    kind: 'elder_f', skin: SKIN[2], hair: HAIR[3], top: '#c86a8a', bottom: '#5a4a6a', shoes: '#5a3a2a',
    hairStyle: 'bun_top', topStyle: 'floral', bottomStyle: 'long_skirt', glasses: true,
  },
};

const BODIES: Record<CastId, Body> = {
  LUCIA: {
    kind: 'adult_f', skin: SKIN[3], hair: HAIR[0], top: HOME.fabricRed, bottom: '#3a4660', shoes: '#2a1a12',
    hairStyle: 'curly_big', topStyle: 'blouse_tape', bottomStyle: 'skirt', earrings: true,
  },
  // o marido (protagonista mulher): mesmo papel e mesma paleta da Lúcia, costureiro de fita no pescoço
  ALEX: {
    kind: 'adult_m', skin: SKIN[3], hair: HAIR[0], top: HOME.fabricRed, bottom: '#3a4660', shoes: '#2a1a12',
    hairStyle: 'curly_short', topStyle: 'shirt_tape', bottomStyle: 'pants', beard: true,
  },
  DAVI: {
    kind: 'child', skin: SKIN[2], hair: HAIR[0], top: HOME.fabricBlue, top2: '#e9e2cf', bottom: '#b49a6a', shoes: '#c8302a',
    hairStyle: 'kid', topStyle: 'stripes', bottomStyle: 'shorts',
  },
  ZELIA: {
    kind: 'elder_f', skin: SKIN[1], hair: HAIR[3], top: '#7a5c8e', bottom: '#40343e', shoes: '#5a3a2a',
    hairStyle: 'bun_top', topStyle: 'floral', bottomStyle: 'long_skirt', glasses: true,
  },
  EU_M: {
    kind: 'adult_m', skin: SKIN[1], hair: HAIR[0], top: '#4f8a6e', bottom: '#4a8268', shoes: '#d8dcd4',
    hairStyle: 'short_m', topStyle: 'scrubs', bottomStyle: 'pants', stubble: true,
  },
  EU_F: {
    kind: 'adult_f', skin: SKIN[1], hair: HAIR[0], top: '#4f8a6e', bottom: '#4a8268', shoes: '#d8dcd4',
    hairStyle: 'bun_low', topStyle: 'scrubs', bottomStyle: 'pants',
  },
};

interface Geo {
  w: number;
  h: number;
  /** rosto */
  fx0: number;
  fx1: number;
  fy0: number;
  fy1: number;
  eyeY: number;
  eyeL: number;
  eyeR: number;
  mouthY: number;
  neckY: number;
  torsoY0: number;
  torsoY1: number;
  tx0: number;
  tx1: number;
  armL: number;
  armR: number;
  sleeveTo: number;
  hipY: number;
  legY0: number;
  legY1: number;
  legL: [number, number];
  legR: [number, number];
}

function geo(kind: Kind): Geo {
  switch (kind) {
    case 'child':
      return {
        w: 12, h: 24, fx0: 3, fx1: 8, fy0: 4, fy1: 9, eyeY: 6, eyeL: 4, eyeR: 7, mouthY: 8, neckY: 10,
        torsoY0: 11, torsoY1: 16, tx0: 3, tx1: 8, armL: 2, armR: 9, sleeveTo: 12, hipY: 17, legY0: 20, legY1: 21,
        legL: [3, 4], legR: [7, 8],
      };
    case 'elder_f':
      return {
        w: 14, h: 29, fx0: 4, fx1: 9, fy0: 4, fy1: 10, eyeY: 7, eyeL: 5, eyeR: 8, mouthY: 9, neckY: 11,
        torsoY0: 12, torsoY1: 19, tx0: 3, tx1: 10, armL: 2, armR: 11, sleeveTo: 16, hipY: 20, legY0: 26, legY1: 26,
        legL: [4, 5], legR: [8, 9],
      };
    case 'adult_m':
      return {
        w: 16, h: 32, fx0: 5, fx1: 10, fy0: 3, fy1: 10, eyeY: 6, eyeL: 6, eyeR: 9, mouthY: 9, neckY: 11,
        torsoY0: 12, torsoY1: 20, tx0: 4, tx1: 11, armL: 3, armR: 12, sleeveTo: 14, hipY: 21, legY0: 22, legY1: 29,
        legL: [4, 6], legR: [9, 11],
      };
    case 'adult_f':
    default:
      return {
        w: 16, h: 32, fx0: 5, fx1: 10, fy0: 4, fy1: 10, eyeY: 7, eyeL: 6, eyeR: 9, mouthY: 9, neckY: 11,
        torsoY0: 12, torsoY1: 19, tx0: 4, tx1: 11, armL: 3, armR: 12, sleeveTo: 14, hipY: 20, legY0: 26, legY1: 29,
        legL: [5, 6], legR: [9, 10],
      };
  }
}

interface Paint {
  skin: string;
  skinS: string;
  skinD: string;
  hair: string;
  hairL: string;
  hairD: string;
  top: string;
  topS: string;
  topL: string;
  bottom: string;
  bottomS: string;
}

function colors(b: Body, status?: MemberStatus): Paint {
  let skin = b.skin;
  if (status === 'doente') skin = mix(skin, '#a9bb9a', 0.3);
  if (status === 'critico') skin = mix(skin, '#c9c6bc', 0.38);
  if (status === 'frio') skin = mix(skin, '#9fb4c8', 0.12);
  const light = b.hair === HAIR[3] || b.hair === HAIR[4];
  return {
    skin,
    skinS: shade(skin, -0.2),
    skinD: shade(skin, -0.42),
    hair: b.hair,
    hairL: light ? '#e2e2da' : mix(b.hair, '#6a5a64', 0.45),
    hairD: light ? '#8a8a84' : mix(b.hair, '#000000', 0.45),
    top: b.top,
    topS: shade(b.top, -0.25),
    topL: shade(b.top, 0.16),
    bottom: b.bottom,
    bottomS: shade(b.bottom, -0.28),
  };
}

// -----------------------------------------------------------------------------
// Partes
// -----------------------------------------------------------------------------
function drawHeadAndHair(p: Pix, b: Body, g: Geo, c: Paint, o: { blink: boolean; down: number }): void {
  const dy = o.down;
  // rosto
  for (let y = g.fy0; y <= g.fy1; y++) {
    const edge = y === g.fy0 || y === g.fy1;
    const x0 = edge ? g.fx0 + 1 : g.fx0;
    const x1 = edge ? g.fx1 - 1 : g.fx1;
    for (let x = x0; x <= x1; x++) p.px(x, y + dy, x >= g.fx1 ? c.skinS : c.skin);
  }
  // cabelo
  const H = (x: number, y: number, col = c.hair) => p.px(x, y + dy, col);
  const fx0 = g.fx0;
  const fx1 = g.fx1;
  switch (b.hairStyle) {
    case 'curly_big': {
      // volume de cachos em volta do rosto
      for (let y = 0; y <= g.fy1 + 2; y++)
        for (let x = fx0 - 3; x <= fx1 + 3; x++) {
          const cx = (fx0 + fx1) / 2;
          const dx = (x - cx) / 6.6;
          const dyy = (y - 5) / 6.4;
          if (dx * dx + dyy * dyy > 1) continue;
          const inFace = x >= fx0 && x <= fx1 && y >= g.fy0 + 1 && y <= g.fy1;
          if (inFace) continue;
          if (y > g.fy1 && x >= fx0 && x <= fx1) continue;
          const k = (x * 5 + y * 3) % 7;
          H(x, y, k === 0 ? c.hairL : k === 3 ? c.hairD : c.hair);
        }
      // franja curta
      for (let x = fx0; x <= fx1; x++) H(x, g.fy0, (x & 1) === 0 ? c.hair : c.hairD);
      H(fx0, g.fy0 + 1);
      H(fx1, g.fy0 + 1);
      break;
    }
    case 'short_m': {
      // curto: volume em cima penteado para o lado, laterais rentes (sem "capacete")
      for (let x = fx0; x <= fx1; x++) {
        H(x, g.fy0 - 2, x < fx0 + 3 ? c.hairL : c.hair);
        H(x, g.fy0 - 1);
      }
      for (let x = fx0; x <= fx1 - 2; x++) H(x, g.fy0, x === fx0 + 1 ? c.hairD : c.hair);
      H(fx0 - 1, g.fy0 - 1);
      H(fx1 + 1, g.fy0 - 1, c.hairD);
      H(fx0 - 1, g.fy0, c.hairD);
      H(fx1 + 1, g.fy0, c.hairD);
      H(fx0, g.fy0 + 1, c.hairD);
      H(fx0 + 1, g.fy0 - 3, c.hairL);
      H(fx0 + 2, g.fy0 - 3);
      H(fx0 + 3, g.fy0 - 3);
      break;
    }
    case 'bun_low': {
      for (let x = fx0; x <= fx1; x++) {
        H(x, g.fy0 - 2, x < 8 ? c.hairL : c.hair);
        H(x, g.fy0 - 1);
      }
      for (let x = fx0 - 1; x <= fx1 + 1; x++) H(x, g.fy0);
      H(fx0 - 1, g.fy0 + 1);
      H(fx1 + 1, g.fy0 + 1);
      H(fx0 - 1, g.fy0 + 2);
      H(fx1 + 1, g.fy0 + 2);
      H(fx0, g.fy0 + 1);
      H(fx1, g.fy0 + 1);
      // coque baixo aparecendo à direita da nuca
      H(fx1 + 1, g.fy1 - 2, c.hair);
      H(fx1 + 2, g.fy1 - 2, c.hairD);
      H(fx1 + 1, g.fy1 - 1, c.hairD);
      H(fx1 + 2, g.fy1 - 1, c.hairD);
      break;
    }
    case 'kid': {
      for (let x = fx0; x <= fx1; x++) {
        H(x, g.fy0 - 2, x < 5 ? c.hairL : c.hair);
        H(x, g.fy0 - 1);
        H(x, g.fy0, (x & 1) ? c.hairD : c.hair);
      }
      H(fx0 - 1, g.fy0 - 1);
      H(fx1 + 1, g.fy0 - 1);
      H(fx0 - 1, g.fy0);
      H(fx1 + 1, g.fy0);
      H(fx0 - 1, g.fy0 + 1);
      H(fx1 + 1, g.fy0 + 1);
      H(fx0 + 1, g.fy0 - 3);
      H(fx0 + 3, g.fy0 - 3);
      break;
    }
    case 'curly_short': {
      // cachos curtos e cheios: topo ondulado, laterais rentes
      const curl = (x: number, y: number) => {
        const k = (x * 5 + y * 3) % 7;
        H(x, y, k === 0 || k === 4 ? c.hairL : k === 2 ? c.hairD : c.hair);
      };
      for (let x = fx0; x <= fx1; x += 2) curl(x, g.fy0 - 3);
      for (let x = fx0 - 1; x <= fx1 + 1; x++) {
        curl(x, g.fy0 - 2);
        curl(x, g.fy0 - 1);
      }
      for (let x = fx0; x <= fx1; x++) curl(x, g.fy0);
      H(fx0 - 1, g.fy0, c.hairD);
      H(fx1 + 1, g.fy0, c.hairD);
      H(fx0 - 1, g.fy0 + 1, c.hairD);
      H(fx1 + 1, g.fy0 + 1, c.hairD);
      break;
    }
    case 'bucket_hat': {
      // chapéu de pescador cáqui + cabelo grisalho dos lados
      const hat = '#9b8e62';
      const hatD = '#6f6440';
      for (let x = fx0; x <= fx1; x++) {
        H(x, g.fy0 - 3, x < 8 ? '#b8ab7e' : hat);
        H(x, g.fy0 - 2, hat);
        H(x, g.fy0 - 1, hatD);
      }
      for (let x = fx0 - 2; x <= fx1 + 2; x++) H(x, g.fy0, x > fx1 ? hatD : hat);
      H(fx0 - 1, g.fy0 + 1, c.hairL);
      H(fx1 + 1, g.fy0 + 1, c.hair);
      H(fx0 - 1, g.fy0 + 2, c.hair);
      H(fx1 + 1, g.fy0 + 2, c.hairD);
      break;
    }
    case 'bun_top': {
      for (let x = fx0; x <= fx1; x++) {
        H(x, g.fy0 - 1, x < 6 ? c.hairL : c.hair);
        H(x, g.fy0);
      }
      H(fx0 - 1, g.fy0);
      H(fx1 + 1, g.fy0);
      H(fx0 - 1, g.fy0 + 1);
      H(fx1 + 1, g.fy0 + 1);
      H(fx0 - 1, g.fy0 + 2, c.hairD);
      H(fx1 + 1, g.fy0 + 2, c.hairD);
      // coque no alto
      const cx = Math.floor((fx0 + fx1) / 2);
      H(cx, g.fy0 - 3, c.hairL);
      H(cx + 1, g.fy0 - 3);
      H(cx - 1, g.fy0 - 2, c.hairL);
      H(cx, g.fy0 - 2);
      H(cx + 1, g.fy0 - 2);
      H(cx + 2, g.fy0 - 2, c.hairD);
      break;
    }
  }
  // olhos
  const eyeC = '#1d1210';
  if (o.blink) {
    p.px(g.eyeL, g.eyeY + dy, c.skinD);
    p.px(g.eyeR, g.eyeY + dy, c.skinD);
  } else {
    p.px(g.eyeL, g.eyeY + dy + (o.down ? 0 : 0), eyeC);
    p.px(g.eyeR, g.eyeY + dy, eyeC);
    if (b.kind === 'child') {
      p.px(g.eyeL, g.eyeY - 1 + dy, '#f2ede2');
      p.px(g.eyeR, g.eyeY - 1 + dy, '#f2ede2');
    }
  }
  if (b.glasses) {
    const fr = '#7a5638';
    p.px(g.eyeL - 1, g.eyeY + dy, fr);
    p.px(g.eyeL + 1, g.eyeY + dy, fr);
    p.px(g.eyeR - 1, g.eyeY + dy, fr);
    p.px(g.eyeR + 1, g.eyeY + dy, fr);
    p.px(g.eyeL, g.eyeY - 1 + dy, fr);
    p.px(g.eyeR, g.eyeY - 1 + dy, fr);
  }
  // boca e bochechas
  p.px(Math.floor((g.fx0 + g.fx1) / 2), g.mouthY + dy, mix(c.skin, '#5a2020', 0.45));
  if (b.kind !== 'adult_m') p.px(Math.floor((g.fx0 + g.fx1) / 2) + 1, g.mouthY + dy, mix(c.skin, '#5a2020', 0.3));
  if (b.kind === 'child') {
    p.pxa(g.fx0, g.mouthY - 1 + dy, '#e8566a', 0.35);
    p.pxa(g.fx1, g.mouthY - 1 + dy, '#e8566a', 0.35);
  }
  if (b.beard) {
    // barba cheia curta: costeletas, bigode e queixo, com a boca (dois tons) de fora
    const mx = Math.floor((g.fx0 + g.fx1) / 2);
    const bt = (x: number, y: number) => p.px(x, y + dy, (x * 3 + y) % 5 === 0 ? c.hairL : c.hair);
    p.px(g.fx0, g.mouthY - 1 + dy, c.hair);
    p.px(g.fx1, g.mouthY - 1 + dy, c.hairD);
    bt(mx, g.mouthY - 1);
    bt(mx + 1, g.mouthY - 1);
    for (let x = g.fx0; x <= g.fx1; x++) if (x < mx || x > mx + 1) bt(x, g.mouthY);
    p.px(g.fx1, g.mouthY + dy, c.hairD);
    p.px(mx, g.mouthY + dy, mix(c.skin, '#5a2020', 0.5));
    p.px(mx + 1, g.mouthY + dy, mix(c.skin, '#5a2020', 0.3));
    for (let x = g.fx0 + 1; x < g.fx1; x++) bt(x, g.fy1);
    p.px(g.fx1 - 1, g.fy1 + dy, c.hairD);
    p.px(mx, g.fy1 + 1 + dy, c.hair);
    p.px(mx + 1, g.fy1 + 1 + dy, c.hairD);
  }
  if (b.stubble) {
    for (let x = g.fx0; x <= g.fx1; x++) p.pxa(x, g.fy1 + dy, '#3a3030', 0.35);
    p.pxa(g.fx0, g.fy1 - 1 + dy, '#3a3030', 0.3);
    p.pxa(g.fx1, g.fy1 - 1 + dy, '#3a3030', 0.3);
  }
  if (b.earrings) {
    p.px(g.fx0 - 1, g.mouthY + dy, '#e8c04a');
    p.px(g.fx1 + 1, g.mouthY + dy, '#e8c04a');
  }
}

function drawTorso(p: Pix, b: Body, g: Geo, c: Paint, o: { shawl: boolean }): void {
  // pescoço
  p.px(Math.floor(g.w / 2) - 1, g.neckY, c.skinS);
  p.px(Math.floor(g.w / 2), g.neckY, c.skinS);
  // tronco
  for (let y = g.torsoY0; y <= g.torsoY1; y++) {
    const waist = y === g.torsoY1 && b.kind !== 'adult_m' ? 1 : 0;
    for (let x = g.tx0 + waist; x <= g.tx1 - waist; x++) {
      let col = c.top;
      if (x === g.tx1 - waist) col = c.topS;
      if (x === g.tx0 + waist && y > g.torsoY0) col = c.topL;
      p.px(x, y, col);
    }
  }
  // ombros arredondados
  p.px(g.tx0, g.torsoY0, c.top);
  // braços
  for (let y = g.torsoY0; y <= g.torsoY1; y++) {
    const sleeve = y <= g.sleeveTo;
    p.px(g.armL, y, sleeve ? c.topL : c.skin);
    p.px(g.armR, y, sleeve ? c.topS : c.skinS);
  }
  // mãos
  p.px(g.armL, g.torsoY1 + 1, c.skin);
  p.px(g.armR, g.torsoY1 + 1, c.skinS);
  const cx = Math.floor(g.w / 2);
  switch (b.topStyle) {
    case 'scrubs':
      // decote em V
      p.px(cx - 1, g.torsoY0, c.skin);
      p.px(cx, g.torsoY0, c.skin);
      p.px(cx - 1, g.torsoY0 + 1, c.skinS);
      p.px(cx, g.torsoY0 + 1, c.skin);
      p.px(cx - 2, g.torsoY0, c.topS);
      p.px(cx + 1, g.torsoY0, c.topS);
      // bolso com caneta
      p.px(g.tx1 - 2, g.torsoY0 + 3, c.topS);
      p.px(g.tx1 - 1, g.torsoY0 + 3, c.topS);
      p.px(g.tx1 - 2, g.torsoY0 + 2, '#2a5aa0');
      break;
    case 'blouse_tape': {
      p.px(cx - 1, g.torsoY0, c.skin);
      p.px(cx, g.torsoY0, c.skin);
      // fita métrica
      const ty = '#e8c84a';
      for (let y = g.torsoY0; y <= g.torsoY0 + 5; y++) {
        p.px(cx - 2, y, y % 2 ? ty : '#b8962e');
        p.px(cx + 1, y, y % 2 ? '#b8962e' : ty);
      }
      break;
    }
    case 'shirt_tape': {
      // camisa de botão de manga dobrada, gola clara e a fita métrica no pescoço
      const collar = shade(b.top, 0.32);
      p.px(cx - 1, g.torsoY0, c.skinS);
      p.px(cx, g.torsoY0, c.skinS);
      p.px(cx - 2, g.torsoY0, collar);
      p.px(cx + 1, g.torsoY0, collar);
      p.px(cx - 1, g.torsoY0 + 1, collar);
      for (let y = g.torsoY0 + 3; y <= g.torsoY1 - 1; y += 2) p.px(cx, y, shade(b.top, 0.4));
      // manga dobrada acima do cotovelo: antebraço de fora
      p.px(g.armL, g.sleeveTo, shade(b.top, 0.28));
      p.px(g.armR, g.sleeveTo, c.topS);
      const ty = '#e8c84a';
      for (let y = g.torsoY0; y <= g.torsoY0 + 5; y++) {
        p.px(cx - 3, y, y % 2 ? ty : '#b8962e');
        p.px(cx + 2, y, y % 2 ? '#b8962e' : ty);
      }
      break;
    }
    case 'stripes':
      for (let y = g.torsoY0 + 1; y <= g.torsoY1; y += 2) {
        for (let x = g.tx0; x <= g.tx1; x++) p.px(x, y, x === g.tx1 ? shade(b.top2 ?? '#eee', -0.2) : (b.top2 ?? '#eee'));
        p.px(g.armL, y, y <= g.sleeveTo ? (b.top2 ?? '#eee') : c.skin);
        p.px(g.armR, y, y <= g.sleeveTo ? shade(b.top2 ?? '#eee', -0.2) : c.skinS);
      }
      p.px(cx - 1, g.torsoY0, c.skin);
      p.px(cx, g.torsoY0, c.skin);
      break;
    case 'plaid':
      for (let y = g.torsoY0; y <= g.torsoY1; y++)
        for (let x = g.tx0; x <= g.tx1; x++) {
          if (x % 3 === 0 || y % 3 === 0) p.px(x, y, b.top2 ?? c.topS);
          if (x % 3 === 0 && y % 3 === 0) p.px(x, y, shade(b.top2 ?? c.topS, -0.3));
        }
      p.px(cx - 1, g.torsoY0, '#d8c8b0');
      p.px(cx, g.torsoY0, '#b8a890');
      break;
    case 'floral': {
      const fl = ['#e6a0bc', '#f2d45c', '#efe6cf'];
      for (let y = g.torsoY0 + 1; y <= g.torsoY1; y++)
        for (let x = g.tx0; x <= g.tx1; x++) if ((x * 3 + y * 5) % 7 === 0) p.px(x, y, fl[(x + y) % 3]);
      p.px(cx - 1, g.torsoY0, '#efe6cf');
      p.px(cx, g.torsoY0, '#efe6cf');
      break;
    }
  }
  if (o.shawl) {
    // xale por cima dos ombros (frio)
    const sh = '#5a6a8a';
    for (let x = g.armL; x <= g.armR; x++) {
      p.px(x, g.torsoY0, x === g.armR ? shade(sh, -0.3) : sh);
      p.px(x, g.torsoY0 + 1, (x + g.torsoY0) % 2 ? shade(sh, -0.2) : sh);
    }
    p.px(g.armL, g.torsoY0 + 2, sh);
    p.px(g.armR, g.torsoY0 + 2, shade(sh, -0.3));
    p.px(Math.floor(g.w / 2), g.torsoY0 + 2, sh);
    p.px(Math.floor(g.w / 2) - 1, g.torsoY0 + 3, shade(sh, -0.2));
  }
}

function drawLegsStanding(p: Pix, b: Body, g: Geo, c: Paint): void {
  const cx = Math.floor(g.w / 2);
  switch (b.bottomStyle) {
    case 'skirt':
    case 'long_skirt': {
      const to = b.bottomStyle === 'long_skirt' ? g.legY0 - 1 : g.legY0 - 1;
      for (let y = g.hipY; y <= to; y++) {
        const flare = Math.floor((y - g.hipY) / 3);
        for (let x = g.tx0 - flare + (y === g.hipY ? 1 : 0); x <= g.tx1 + flare - (y === g.hipY ? 1 : 0); x++)
          p.px(x, y, x >= g.tx1 + flare - 1 ? c.bottomS : (x + y) % 5 === 0 ? shade(c.bottom, 0.1) : c.bottom);
      }
      for (let y = g.legY0; y <= g.legY1; y++) {
        for (let x = g.legL[0]; x <= g.legL[1]; x++) p.px(x, y, c.skin);
        for (let x = g.legR[0]; x <= g.legR[1]; x++) p.px(x, y, c.skinS);
      }
      break;
    }
    case 'shorts': {
      for (let y = g.hipY; y <= g.legY0 - 1; y++) for (let x = g.tx0; x <= g.tx1; x++) p.px(x, y, x === g.tx1 ? c.bottomS : c.bottom);
      p.px(cx - 1, g.legY0 - 1, c.bottomS);
      p.px(cx, g.legY0 - 1, c.bottomS);
      for (let y = g.legY0; y <= g.legY1; y++) {
        for (let x = g.legL[0]; x <= g.legL[1]; x++) p.px(x, y, c.skin);
        for (let x = g.legR[0]; x <= g.legR[1]; x++) p.px(x, y, c.skinS);
      }
      break;
    }
    case 'pants':
    default: {
      for (let x = g.tx0; x <= g.tx1; x++) p.px(x, g.hipY, x === g.tx1 ? c.bottomS : c.bottom);
      for (let y = g.hipY + 1; y <= g.legY1; y++) {
        for (let x = g.legL[0]; x <= g.legL[1]; x++) p.px(x, y, x === g.legL[0] ? shade(c.bottom, 0.12) : c.bottom);
        for (let x = g.legR[0]; x <= g.legR[1]; x++) p.px(x, y, x === g.legR[1] ? c.bottomS : c.bottom);
        if (g.legL[1] + 1 < g.legR[0] - 1) {
          /* vão entre as pernas */
        }
      }
      // junta as pernas no quadril
      for (let x = g.legL[1]; x <= g.legR[0]; x++) p.px(x, g.hipY + 1, c.bottomS);
    }
  }
  // pés
  const fy = g.legY1 + 1;
  const shoe = b.shoes;
  const shoeS = shade(shoe, -0.3);
  for (let y = fy; y < g.h; y++) {
    for (let x = g.legL[0] - 1; x <= g.legL[1]; x++) p.px(x, y, y === g.h - 1 ? shoeS : shoe);
    for (let x = g.legR[0]; x <= g.legR[1] + 1; x++) p.px(x, y, y === g.h - 1 ? shoeS : shoe);
  }
  if (b.kind === 'child') {
    // tênis com sola branca
    for (let x = g.legL[0] - 1; x <= g.legL[1]; x++) p.px(x, g.h - 1, '#efe6cf');
    for (let x = g.legR[0]; x <= g.legR[1] + 1; x++) p.px(x, g.h - 1, '#efe6cf');
  }
}

// -----------------------------------------------------------------------------
// Poses
// -----------------------------------------------------------------------------
const CHAIR = { wood: HOME.wood2, dark: HOME.wood, light: HOME.tan };

function standing(b: Body, c: Paint, o: FigOpts): Pix {
  const g = geo(b.kind);
  const p = new Pix(g.w, g.h);
  drawLegsStanding(p, b, g, c);
  drawTorso(p, b, g, c, { shawl: o.status === 'frio' });
  drawHeadAndHair(p, b, g, c, { blink: !!o.blink, down: o.status === 'triste' || o.status === 'doente' ? 1 : 0 });
  return p;
}

function sitting(b: Body, c: Paint, o: FigOpts): Pix {
  const g = geo(b.kind);
  // altura sentada: tronco igual, pernas dobradas (coxas em escorço)
  const legRows = b.kind === 'child' ? 5 : 7;
  const h = g.hipY + legRows;
  const p = new Pix(g.w + 2, h);
  const ox = 1;
  const q = new Pix(g.w, h);
  if (o.chair) {
    // cadeira de madeira vista de frente, por trás de quem senta: o encosto fica
    // escondido pelo tronco; aparecem só as pontas dos montantes ao lado do
    // quadril, a tábua do assento sob o colo e as pernas
    const post = g.hipY - 4;
    for (let y = post; y < h; y++) {
      p.px(0, y, y === post ? CHAIR.light : CHAIR.dark);
      p.px(g.w + 1, y, y === post ? CHAIR.wood : CHAIR.dark);
    }
    for (let x = 0; x <= g.w + 1; x++) p.px(x, g.hipY + 1, x < 3 ? CHAIR.light : CHAIR.wood);
    for (let x = 0; x <= g.w + 1; x++) p.px(x, g.hipY + 2, CHAIR.dark);
    for (let y = g.hipY + 3; y < h; y++) {
      p.px(2, y, CHAIR.dark);
      p.px(g.w - 1, y, CHAIR.dark);
    }
  }
  // colo (coxas vindo para a frente)
  const lapC = b.bottomStyle === 'shorts' ? c.bottom : c.bottom;
  for (let y = g.hipY; y <= g.hipY + 2; y++)
    for (let x = g.tx0 - 1; x <= g.tx1 + 1; x++) q.px(x, y, y === g.hipY + 2 ? shade(lapC, -0.25) : x >= g.tx1 ? shade(lapC, -0.2) : lapC);
  // canelas
  const shinC = b.bottomStyle === 'pants' ? c.bottom : c.skin;
  for (let y = g.hipY + 3; y < h - 1; y++) {
    for (let x = g.legL[0]; x <= g.legL[1]; x++) q.px(x, y, shinC);
    for (let x = g.legR[0]; x <= g.legR[1]; x++) q.px(x, y, shade(shinC, -0.15));
  }
  for (let x = g.legL[0] - 1; x <= g.legL[1]; x++) q.px(x, h - 1, b.shoes);
  for (let x = g.legR[0]; x <= g.legR[1] + 1; x++) q.px(x, h - 1, b.shoes);
  drawTorso(q, b, g, c, { shawl: o.status === 'frio' });
  drawHeadAndHair(q, b, g, c, { blink: !!o.blink, down: o.status === 'triste' || o.status === 'doente' ? 1 : 0 });
  p.blit(q, ox, 0);
  return p;
}

function lying(b: Body, c: Paint, o: FigOpts): Pix {
  // deitado de costas, cabeça à esquerda no travesseiro, coberto até o peito
  const W = b.kind === 'child' ? 26 : 32;
  const p = new Pix(W, 12);
  const pil = '#efe9dc';
  const pilS = '#cfc6b2';
  for (let y = 2; y <= 10; y++) for (let x = 0; x <= 9; x++) if (!((x === 0 || x === 9) && (y === 2 || y === 10))) p.px(x, y, y >= 9 ? pilS : pil);
  // cabeça (rosto virado para cima, testa à esquerda)
  for (let y = 3; y <= 8; y++) for (let x = 3; x <= 8; x++) if (!((x === 3 || x === 8) && (y === 3 || y === 8))) p.px(x, y, x >= 8 ? c.skinS : c.skin);
  // cabelo do lado da testa
  for (let y = 3; y <= 8; y++) {
    p.px(2, y, c.hair);
    p.px(3, y, y === 3 || y === 8 ? c.hair : c.hairD);
  }
  if (b.hairStyle === 'curly_big') {
    for (let y = 1; y <= 10; y++) {
      p.px(1, y, c.hair);
      p.px(2, y, (y & 1) ? c.hairL : c.hair);
    }
    p.px(3, 2, c.hair);
    p.px(3, 9, c.hair);
  }
  if (b.hairStyle === 'curly_short') {
    for (let y = 3; y <= 8; y++) p.px(1, y, (y & 1) ? c.hairL : c.hair);
  }
  if (b.beard) {
    // barba (rosto deitado: queixo à direita)
    for (let y = 4; y <= 7; y++) p.px(8, y, c.hairD);
    p.px(7, 4, c.hair);
    p.px(7, 7, c.hair);
  }
  if (b.hairStyle === 'bun_top') {
    p.px(1, 5, c.hairL);
    p.px(1, 6, c.hair);
    p.px(0, 5, c.hair);
    p.px(0, 6, c.hairD);
  }
  // olhos fechados (empilhados, rosto deitado)
  p.px(5, 4, c.skinD);
  p.px(5, 7, c.skinD);
  p.px(7, 5, mix(c.skin, '#5a2020', 0.35));
  p.px(7, 6, mix(c.skin, '#5a2020', 0.35));
  if (b.glasses) {
    p.px(5, 3, '#7a5638');
    p.px(5, 8, '#7a5638');
  }
  // contorno só na cabeça e no travesseiro: o cobertor se funde com a cama
  p.outline('#120c08');
  // cobertor: o volume do corpo (peito sobe na respiração), estrelinhas no azul
  const bl = o.blanket ?? HOME.fabricRed;
  const blS = shade(bl, -0.28);
  const blL = shade(bl, 0.2);
  const chestUp = o.inhale ? 1 : 0;
  for (let x = 9; x < W; x++) {
    const top = x >= 11 && x <= 18 ? 3 - chestUp : x > W - 5 ? 4 : 3;
    for (let y = top; y <= 11; y++) {
      let col = bl;
      if (y === top) col = blL;
      if (y >= 10) col = blS;
      else if ((x * 7 + y * 3) % 23 === 0 && bl === HOME.fabricBlue) col = '#f2d45c';
      else if ((x + y) % 6 === 0 && y > top) col = shade(bl, -0.12);
      p.px(x, y, col);
    }
    p.px(x, top - 1, blS);
  }
  // lençol dobrado
  for (let y = 3 - chestUp; y <= 11; y++) {
    p.px(9, y, '#efe9dc');
    p.px(10, y, '#d8d0bc');
  }
  // pés sob o cobertor
  p.px(W - 3, 2, blL);
  p.px(W - 2, 2, blL);
  p.px(W - 4, 3, blL);
  return p;
}

export interface FigOpts {
  inhale?: boolean;
  blink?: boolean;
  status?: MemberStatus;
  /** desenhar cadeira (pose sentado) */
  chair?: boolean;
  /** cor do cobertor (pose deitado) */
  blanket?: string;
}

const cache = new Map<string, Pix>();

/** Pix do personagem na pose (cache por estado). */
export function figurePix(id: CastId, pose: Pose, o: FigOpts = {}): Pix {
  const key = `${id}|${pose}|${o.inhale ? 1 : 0}|${o.blink ? 1 : 0}|${o.status ?? ''}|${o.chair ? 1 : 0}|${o.blanket ?? ''}`;
  let p = cache.get(key);
  if (p) return p;
  const b = BODIES[id] ?? BODIES.LUCIA;
  const c = colors(b, o.status);
  if (pose === 'deitado') p = lying(b, c, o);
  else {
    p = pose === 'sentado' ? sitting(b, c, o) : standing(b, c, o);
    if (o.inhale) {
      // inspira: cabeça e tronco sobem 1px
      const g = geo(b.kind);
      const q = p.copy();
      const cut = g.torsoY1;
      for (let y = 0; y < cut; y++) for (let x = 0; x < p.w; x++) q.raw(x, y, p.get(x, y + 1));
      p = q;
    }
  }
  // deitado já vem com o contorno só na cabeça (o cobertor se funde com a cama)
  if (pose !== 'deitado') p.outline('#120c08');
  cache.set(key, p);
  if (cache.size > 400) cache.delete(cache.keys().next().value as string);
  return p;
}

/** sprite de personagem extra (só vinhetas), em pé */
export function extraFigurePix(id: ExtraId, o: FigOpts = {}): Pix {
  const key = `X:${id}|${o.inhale ? 1 : 0}|${o.blink ? 1 : 0}`;
  let p = cache.get(key);
  if (p) return p;
  const b = EXTRA[id];
  p = standing(b, colors(b), o);
  p.outline('#120c08');
  cache.set(key, p);
  return p;
}

/** altura útil (px) do sprite na pose — para posicionar ícones acima da cabeça */
export function figureHeight(id: CastId, pose: Pose): number {
  const b = BODIES[id] ?? BODIES.LUCIA;
  const g = geo(b.kind);
  if (pose === 'deitado') return 12;
  if (pose === 'sentado') return g.hipY + (b.kind === 'child' ? 5 : 7);
  return g.h;
}

export const CAST_IDS: CastId[] = ['LUCIA', 'ALEX', 'DAVI', 'ZELIA', 'EU_M', 'EU_F'];
