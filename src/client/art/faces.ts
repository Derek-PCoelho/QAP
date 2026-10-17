// =============================================================================
// Rostos de pacientes vistos pela videochamada: close 64×64, fundo
// transparente (a cena do celular desenha a parede atrás).
//
// Mesmo kit dos retratos (rampas com desvio de matiz, contorno seletivo, luz de
// cima-esquerda), em escala maior: o rosto ocupa quase o quadro e os sinais
// clínicos têm que ser lidos de relance pelo médico regulador:
//   palido     pele dessaturada/esbranquiçada, lábios descorados
//   cianose    lábios e contorno da boca azul-arroxeados, leve tom frio na pele
//   vermelho   rubor forte (bochechas, nariz, testa)
//   amarelado  pele E esclera amareladas (icterícia)
//   cinza      pele acinzentada sem vida, lábios cinza-arroxeados
// e ainda suor, olhos (abertos/fechados/semicerrados/revirados), desvio de rima
// (AVC), hematoma em volta do olho, inchaço de lábios e pálpebras (alergia),
// sangue (couro cabeludo/nariz), espuma na boca, petéquias e expressões.
// Cabelo, formato do rosto e roupa variam pela seed.
// =============================================================================
import { Pix, mulberry, hash2 } from './pix';
import { SKIN, HAIR } from './palette';
import {
  Layer,
  Mask,
  P,
  compose,
  lit,
  sphereN,
  toneOf,
  drawEye,
  drawBrow,
  stamp,
  skinTone,
  solidRole,
  eyeColors,
  EYE_SHAPES,
  mixLab,
  adjust,
  toLch,
  lch,
  dith2,
  skinRamp,
  hairRamp,
  clothRamp,
  paintHair,
  paintCurls,
  curlySilhouette,
  belowLine,
  type Role,
  type EyeMood,
  type BrowMood,
  type EyeShape,
} from './portraitKit';

export interface PatientFaceSpec {
  seed: number;
  age: 'bebe' | 'crianca' | 'adolescente' | 'adulto' | 'idoso';
  sex: 'M' | 'F';
  /** índice em SKIN (0 claro … 4 escuro); sem ele, vem da seed */
  skin?: number;
  /** cor do cabelo, penteado e camisa (a videochamada passa os mesmos do plano geral); sem eles, vêm da seed */
  hair?: string;
  hairStyle?: FaceHair;
  shirt?: string;
  /** barba por fazer (adulto) */
  beard?: boolean;
  state: 'normal' | 'palido' | 'cianose' | 'vermelho' | 'amarelado' | 'cinza';
  sweat?: boolean;
  eyes?: 'abertos' | 'fechados' | 'semi' | 'revirados';
  /** lado do rosto que cai (AVC), lado do PACIENTE: 'dir' aparece à esquerda da imagem */
  droop?: 'esq' | 'dir';
  /** hematoma em volta do olho */
  bruise?: boolean;
  /** inchaço de lábios e pálpebras (alergia) */
  swelling?: boolean;
  /** sangue escorrendo */
  blood?: boolean;
  /** de onde vem o sangue (padrão: couro cabeludo; metade das seeds também nariz) */
  bloodFrom?: 'cabeca' | 'nariz' | 'ambos';
  /** espuma na boca */
  froth?: boolean;
  /** pontinhos roxos na pele */
  petechiae?: boolean;
  expression?: 'dor' | 'calmo' | 'assustado' | 'rindo';
}

const W = 64;
const CX = 32;

// -----------------------------------------------------------------------------
// Geometria do close
// -----------------------------------------------------------------------------
interface FGeo {
  top: number;
  chin: number;
  hw: number[];
  eyeY: number;
  eyeLX: number;
  eyeRX: number;
  eye: EyeShape;
  browY: number;
  noseY: number;
  mouthY: number;
  earY0: number;
  earY1: number;
  neckHW: number;
  shoulderY: number;
  kid: boolean;
  baby: boolean;
}

/** contorno: crânio em arco até a linha das maçãs, depois mandíbula até o queixo */
function contour(top: number, chin: number, hwMax: number, cheekRow: number, chinHW: number, jawPow: number, round: boolean): number[] {
  const out: number[] = [];
  for (let y = top; y <= chin; y++) {
    let hw: number;
    if (y < cheekRow) {
      const t = (cheekRow - y) / (cheekRow - top + 0.5);
      hw = hwMax * Math.sqrt(Math.max(0, 1 - t * t));
    } else {
      const t = (y - cheekRow) / Math.max(1, chin - cheekRow);
      if (round) hw = chinHW + (hwMax - chinHW) * Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.2)));
      else hw = hwMax + (chinHW - hwMax) * Math.pow(t, jawPow);
    }
    out.push(Math.max(2, Math.round(hw)));
  }
  return out;
}

function geoFor(s: PatientFaceSpec, rnd: () => number): FGeo {
  const baby = s.age === 'bebe';
  const kid = s.age === 'crianca';
  const fem = s.sex === 'F';
  const v = rnd(); // variação do rosto
  if (baby) {
    const top = 8;
    const chin = 51;
    return {
      top,
      chin,
      hw: contour(top, chin, 20, 37, 9, 1, true),
      eyeY: 29,
      eyeLX: 19,
      eyeRX: 36,
      eye: EYE_SHAPES.patientBig,
      browY: 24,
      noseY: 39,
      mouthY: 44,
      earY0: 29,
      earY1: 40,
      neckHW: 8,
      shoulderY: 55,
      kid: true,
      baby: true,
    };
  }
  if (kid) {
    const top = 7;
    const chin = 51;
    return {
      top,
      chin,
      hw: contour(top, chin, 19, 36, 7 + Math.round(v * 2), 1.4, true),
      eyeY: 28,
      eyeLX: 19,
      eyeRX: 36,
      eye: EYE_SHAPES.patientBig,
      browY: 23,
      noseY: 38,
      mouthY: 44,
      earY0: 28,
      earY1: 40,
      neckHW: 8,
      shoulderY: 56,
      kid: true,
      baby: false,
    };
  }
  const top = 6;
  const chin = fem ? 51 : 52;
  const wide = v < 0.33 ? 0 : v < 0.66 ? 1 : -1; // rosto mais largo / mais fino
  // adolescente: geometria de adulto, rosto um pouco mais fino
  const hwMax = (fem ? 17 : 18) + wide - (s.age === 'adolescente' ? 1 : 0);
  const chinHW = fem ? 4 + Math.round(rnd() * 2) : 6 + Math.round(rnd() * 3);
  return {
    top,
    chin,
    hw: contour(top, chin, hwMax, fem ? 33 : 34, chinHW, fem ? 1.5 : 1.9, fem),
    eyeY: 25,
    eyeLX: 19,
    eyeRX: 36,
    eye: s.age === 'idoso' ? { ...EYE_SHAPES.patient, lid: EYE_SHAPES.patient.lid.map((l, i) => l + (i > 0 && i < 8 ? 1 : 0)) } : EYE_SHAPES.patient,
    browY: 20,
    noseY: 37,
    mouthY: fem ? 43 : 44,
    earY0: 25,
    earY1: 38,
    neckHW: fem ? 8 : 10,
    shoulderY: 57,
    kid: false,
    baby: false,
  };
}

function hwAt(g: FGeo, y: number): number {
  const r = y - g.top;
  if (r < 0 || r >= g.hw.length) return -1;
  return g.hw[r];
}

function jawRow(g: FGeo, x: number): number {
  for (let y = g.chin; y >= g.top; y--) {
    const hw = hwAt(g, y);
    if (x >= CX - hw && x <= CX - 1 + hw) return y;
  }
  return -1;
}

// -----------------------------------------------------------------------------
// Cores por estado
// -----------------------------------------------------------------------------
export interface Tints {
  skin: string;
  lip: string;
  sclera: string;
  /** tinta em volta da boca (cianose) */
  ring?: string;
  /** rubor das bochechas */
  flush?: string;
}

/** pele/lábios/esclera pelo estado (também usada pelo corpo na videochamada: mesmas cores no plano geral e no close) */
export function tintsFor(base: string, st: PatientFaceSpec['state'], age: PatientFaceSpec['age']): Tints {
  const [L, C, h] = toLch(base);
  const darkSkin = L < 0.5;
  const rosy = darkSkin ? mixLab(base, '#5a2232', 0.3) : mixLab(base, '#c04a58', 0.36);
  const sclera = '#eee8de';
  switch (st) {
    case 'palido': {
      // perde cor e clareia um pouco; em pele escura fica baça e acinzentada-clara
      const pale = lch(L + (darkSkin ? 0.08 : 0.02), C * (darkSkin ? 0.62 : 0.45), h);
      const skin = mixLab(pale, darkSkin ? '#c8b29c' : '#e6e0da', darkSkin ? 0.22 : 0.22);
      return { skin, lip: mixLab(skin, '#a89496', 0.3), sclera: '#f4f0ea' };
    }
    case 'cianose': {
      const skin = mixLab(base, '#8a90b4', darkSkin ? 0.16 : 0.2);
      return { skin, lip: darkSkin ? '#3e3a66' : '#5c5a9e', sclera, ring: darkSkin ? '#4a4c78' : '#8a8cc4' };
    }
    case 'vermelho': {
      const skin = mixLab(base, '#d84a3a', darkSkin ? 0.18 : 0.24);
      return { skin, lip: mixLab(rosy, '#b02a30', 0.4), sclera: '#f2e2dc', flush: darkSkin ? '#8a2020' : '#d83a32' };
    }
    case 'amarelado': {
      const skin = mixLab(base, '#e2cf3e', darkSkin ? 0.22 : 0.33);
      return { skin, lip: mixLab(rosy, '#b88a50', 0.25), sclera: '#e6d25c' };
    }
    case 'cinza': {
      // acinzentado sem vida: quase sem croma, puxado para cinza-esverdeado frio
      const gray = lch(L * (darkSkin ? 0.95 : 0.9), C * 0.12, h);
      const skin = mixLab(gray, '#76848a', darkSkin ? 0.26 : 0.34);
      return { skin, lip: mixLab(skin, '#54526a', 0.55), sclera: '#d6d6ce', ring: mixLab(skin, '#5e6478', 0.35) };
    }
    default:
      void age;
      return { skin: base, lip: rosy, sclera };
  }
}

// -----------------------------------------------------------------------------
// Rosto: planos, orelhas, pescoço
// -----------------------------------------------------------------------------
function faceTone(g: FGeo, x: number, y: number): number {
  const hw = hwAt(g, y);
  if (hw < 0) return 2;
  const hwMax = Math.max(...g.hw);
  const yc = g.eyeY + 6;
  const ry = (g.chin - g.top) / 2 + 6;
  const e = (y + 0.5 - yc) / ry;
  const hwS = Math.min(hw + 0.8, (hwMax + 0.9) * Math.sqrt(Math.max(0.08, 1 - e * e)));
  const u = Math.max(-1, Math.min(1, (x + 0.5 - CX) / Math.max(hw * 0.6, hwS)));
  let ny: number;
  if (y < g.browY) ny = (-0.32 * (g.browY - y)) / Math.max(1, g.browY - g.top);
  else if (y < g.noseY) ny = 0;
  else ny = 0.56 * Math.pow((y - g.noseY) / Math.max(1, g.chin - g.noseY), 1.5);
  const nx = Math.sign(u) * Math.pow(Math.abs(u), 1.35) * 0.98;
  const nz = Math.sqrt(Math.max(0.03, 1 - nx * nx - ny * ny));
  let t = toneOf(lit(nx, ny, nz), [-0.12, 0.4, 0.8, 0.985]);
  if (x >= CX - 1 + hw) t = Math.min(t, 1);
  if (x <= CX - hw) t = Math.min(t, 2);
  return t;
}

const EAR_L = ['.222.', '23221', '32211', '32111', '31011', '31011', '31111', '32111', '22211', '.2221', '.2221', '..221', '...11'];
const EAR_R = ['.111.', '11111', '11012', '11002', '11002', '11002', '11012', '11112', '11111', '1111.', '1111.', '111..', '11...'];

function drawEars(L: Layer, g: FGeo, skin: number): void {
  const y0 = g.earY0;
  const y1 = g.earY1;
  const hwE = hwAt(g, y0 + 3);
  const xl = CX - hwE;
  const xr = CX - 1 + hwE;
  const h = y1 - y0 + 1;
  for (let i = 0; i < h; i++) {
    const r = Math.min(EAR_L.length - 1, Math.round((i * (EAR_L.length - 1)) / Math.max(1, h - 1)));
    const y = y0 + i;
    for (let c = 0; c < 5; c++) {
      const a = EAR_L[r][c];
      if (a !== '.') L.set(xl - 4 + c, y, skin, +a, P.EAR);
      const b = EAR_R[r][4 - c];
      if (b !== '.') L.set(xr + 4 - c, y, skin, +b, P.EAR);
    }
  }
}

function drawNeckAndShirt(L: Layer, g: FGeo, skin: number, shirtHex: string, rnd: () => number): void {
  // pescoço
  const hw = g.neckHW;
  const nm = new Mask();
  for (let y = g.chin - 6; y < W; y++) nm.hl(CX - hw - (y > g.shoulderY ? 1 : 0), CX - 1 + hw + (y > g.shoulderY ? 1 : 0), y);
  L.paint(nm, skin, P.NECK, (x, y) => {
    const u = (x + 0.5 - CX) / (hw + 1);
    const jr = jawRow(g, x);
    const below = jr < 0 ? 99 : y - jr;
    if (below <= 1) return u < -0.6 ? 1 : 0;
    if (below <= 4) return u < -0.45 ? 2 : 1;
    return u < -0.15 ? 2 : u > 0.55 ? 1 : 2;
  });
  // ombros + camiseta
  const cm = L.mat(clothRamp(shirtHex));
  const sm = new Mask();
  for (let x = 0; x < W; x++) {
    const d = Math.abs(x + 0.5 - CX);
    const sy = g.shoulderY + (d < hw + 2 ? 0 : Math.min(8, Math.pow((d - hw - 2) / 5.5, 1.6)));
    for (let y = Math.ceil(sy); y < W; y++) sm.set(x, y);
  }
  // gola: decote redondo ou em V pela seed
  const vneck = rnd() < 0.4;
  const neckHole = new Mask();
  if (vneck) neckHole.poly([
    [CX - hw - 1, g.shoulderY - 1],
    [CX + hw + 1, g.shoulderY - 1],
    [CX, g.shoulderY + 7],
  ]);
  else neckHole.ellipse(CX, g.shoulderY - 1, hw + 1.5, 4);
  sm.sub(neckHole);
  L.paint(sm, cm, P.BODY, (x, y) => {
    const u = (x + 0.5 - CX) / 30;
    const top = !sm.get(x, y - 1);
    if (top && u < -0.1) return 3;
    if (top) return 2;
    const nb = neckHole.get(x, y - 1) || neckHole.get(x - 1, y) || neckHole.get(x + 1, y);
    if (nb) return u < 0 ? 1 : 0;
    return u < -0.45 ? 3 : u > 0.5 ? 1 : 2;
  });
}

// -----------------------------------------------------------------------------
// Cabelo por seed
// -----------------------------------------------------------------------------
export type FaceHair = 'curto' | 'raspado' | 'careca' | 'cacheado' | 'crespo' | 'longo' | 'coque' | 'chanel' | 'rabo' | 'bebe' | 'permanente';
type FHair = FaceHair;

/** penteados possíveis por idade e sexo (a videochamada sorteia daqui para o corpo e o close baterem) */
export function faceHairChoices(age: PatientFaceSpec['age'], sex: 'M' | 'F'): FaceHair[] {
  if (age === 'bebe') return ['bebe'];
  if (age === 'crianca') return sex === 'F' ? ['rabo', 'cacheado', 'chanel', 'crespo'] : ['curto', 'crespo', 'raspado'];
  if (age === 'idoso') return sex === 'F' ? ['permanente', 'coque', 'chanel'] : ['careca', 'curto', 'raspado'];
  if (age === 'adolescente') return sex === 'F' ? ['longo', 'rabo', 'cacheado', 'crespo', 'chanel'] : ['curto', 'raspado', 'crespo', 'cacheado'];
  return sex === 'F' ? ['longo', 'coque', 'cacheado', 'chanel', 'rabo', 'crespo'] : ['curto', 'raspado', 'crespo', 'cacheado', 'careca', 'curto'];
}

function hairFor(s: PatientFaceSpec, rnd: () => number): FHair {
  const a = faceHairChoices(s.age, s.sex);
  return a[Math.floor(rnd() * a.length) % a.length];
}

function drawHair(L: Layer, g: FGeo, style: FHair, hairMat: number, front: boolean, seed: number): void {
  const t = g.top;
  const part = front ? P.HAIR : P.BACK;
  const earsFree = (m: Mask) => m.rect(CX - 24, g.earY0 + 2, 6, 14).rect(CX + 18, g.earY0 + 2, 6, 14);
  switch (style) {
    case 'curto': {
      if (!front) return;
      const sil = new Mask().ellipse(CX, t + 11, 21, 14.5).and(new Mask().rect(0, 0, W, t + 22));
      sil.ellipse(CX - 8, t, 6, 3.6).ellipse(CX + 1, t - 1, 7, 4).ellipse(CX + 9, t + 0.5, 6, 3.6);
      sil.rect(CX - 22, t + 14, 4, 9).rect(CX + 18, t + 14, 4, 9);
      const win = belowLine([
        [CX - 22, t + 15],
        [CX - 18, t + 12],
        [CX - 14, t + 13],
        [CX - 11, t + 9.5],
        [CX - 7, t + 12],
        [CX - 3, t + 9],
        [CX + 1, t + 11],
        [CX + 5, t + 8.5],
        [CX + 10, t + 10],
        [CX + 15, t + 9.5],
        [CX + 19, t + 12],
        [CX + 22, t + 15],
      ]);
      earsFree(win);
      sil.sub(win);
      paintHair(L, sil, hairMat, part, { src: [CX + 4, t - 3], ball: [CX, t + 11, 23, 19], tex: 'strand', clump: 3.4, band: [9, 12], seed });
      return;
    }
    case 'raspado': {
      if (!front) return;
      const sil = new Mask().ellipse(CX, t + 11.5, 19.6, 13).and(new Mask().rect(0, 0, W, t + 19));
      const win = belowLine([
        [CX - 21, t + 16],
        [CX - 18, t + 12],
        [CX - 12, t + 10],
        [CX, t + 9.4],
        [CX + 12, t + 10],
        [CX + 18, t + 12],
        [CX + 21, t + 16],
      ]);
      earsFree(win);
      sil.sub(win);
      paintHair(L, sil, hairMat, part, { src: [CX, t + 8], ball: [CX, t + 11, 21, 16], tex: 'smooth', seed });
      // fios curtos: pontilhado mais claro (pele aparecendo)
      for (let y = t; y < t + 19; y++) for (let x = 0; x < W; x++) if (L.part(x, y) === part && hash2(x, y, seed) < 0.18) L.shift(x, y, 1);
      return;
    }
    case 'careca': {
      if (!front) return;
      const sil = new Mask().ellipse(CX, t + 17, 21, 10).and(new Mask().rect(0, t + 11, W, 14));
      sil.sub(new Mask().ellipse(CX, t + 11, 17.5, 12.5));
      const win = new Mask().rect(CX - 16, t + 10, 32, 30);
      earsFree(win);
      sil.sub(win);
      paintHair(L, sil, hairMat, part, { src: [CX, t + 8], ball: [CX, t + 15, 22, 14], tex: 'strand', clump: 2.6, seed });
      return;
    }
    case 'cacheado': {
      if (front) {
        const vol = new Mask().ellipse(CX, t + 5, 20, 8.5).ellipse(CX - 17, t + 15, 5, 9).ellipse(CX + 17, t + 15, 5, 9);
        const win = belowLine([
          [CX - 21, t + 26],
          [CX - 17, t + 15],
          [CX - 12, t + 10],
          [CX - 5, t + 8.4],
          [CX + 3, t + 8],
          [CX + 10, t + 9],
          [CX + 16, t + 13],
          [CX + 21, t + 26],
        ]);
        vol.sub(win);
        const { mask, centers } = curlySilhouette(vol, 3.2, seed + 3);
        mask.sub(belowLine([
          [CX - 21, t + 30],
          [CX - 16, t + 18],
          [CX - 10, t + 12],
          [CX, t + 10.5],
          [CX + 10, t + 12],
          [CX + 16, t + 18],
          [CX + 21, t + 30],
        ]));
        paintCurls(L, mask, hairMat, part, { r: 3.2, seed: seed + 3, ball: [CX, t + 12, 24, 22], centers });
      } else {
        const vol = new Mask().ellipse(CX, t + 13, 25, 18).and(new Mask().rect(0, 0, W, t + 40));
        const { mask, centers } = curlySilhouette(vol, 3.4, seed + 1);
        paintCurls(L, mask, hairMat, part, { r: 3.4, seed: seed + 1, ball: [CX, t + 14, 26, 26], centers });
      }
      return;
    }
    case 'crespo': {
      if (!front) return;
      const vol = new Mask().ellipse(CX, t + 9, 21.5, 13).and(new Mask().rect(0, 0, W, t + 19));
      const win = belowLine([
        [CX - 22, t + 15],
        [CX - 19, t + 12],
        [CX - 13, t + 9.5],
        [CX, t + 8.6],
        [CX + 13, t + 9.5],
        [CX + 19, t + 12],
        [CX + 22, t + 15],
      ]);
      earsFree(win);
      vol.sub(win);
      const { mask, centers } = curlySilhouette(vol, 1.9, seed + 5);
      mask.sub(win);
      paintCurls(L, mask, hairMat, part, { r: 1.9, seed: seed + 5, ball: [CX, t + 9, 22, 16], centers });
      return;
    }
    case 'longo': {
      if (front) {
        const sil = new Mask().ellipse(CX, t + 11, 20.5, 15).and(new Mask().rect(0, 0, W, t + 27));
        sil.poly([
          [CX - 21, t + 14],
          [CX - 15, t + 14],
          [CX - 15.5, t + 34],
          [CX - 17, t + 50],
          [CX - 24, t + 50],
          [CX - 23, t + 30],
        ]);
        sil.poly([
          [CX + 15, t + 14],
          [CX + 21, t + 14],
          [CX + 23, t + 30],
          [CX + 24, t + 50],
          [CX + 17, t + 50],
          [CX + 15.5, t + 34],
        ]);
        const win = belowLine([
          [CX - 16, t + 40],
          [CX - 15.5, t + 17],
          [CX - 12, t + 11],
          [CX - 6, t + 7.5],
          [CX - 0.5, t + 5.5],
          [CX + 0.5, t + 5.5],
          [CX + 6, t + 7.5],
          [CX + 12, t + 11],
          [CX + 15.5, t + 17],
          [CX + 16, t + 40],
        ]);
        sil.sub(win);
        paintHair(L, sil, hairMat, part, { src: [CX, t + 3], ball: [CX, t + 12, 23, 26], tex: 'strand', clump: 3, band: [10, 13], fallY: t + 22, seed });
        for (let y = t - 3; y <= t + 4; y++) L.tone(CX, y, 0, part);
      } else {
        const mk = new Mask().ellipse(CX, t + 11, 20.5, 15);
        mk.poly([
          [CX - 20, t + 12],
          [CX + 20, t + 12],
          [CX + 23, t + 40],
          [CX + 24, 63],
          [CX - 24, 63],
          [CX - 23, t + 40],
        ]);
        paintHair(L, mk, hairMat, part, { src: [CX, t - 2], ball: [CX, t + 12, 24, 30], tex: 'smooth', back: true, fallY: t + 22, seed });
      }
      return;
    }
    case 'coque': {
      if (!front) return;
      const sil = new Mask().ellipse(CX, t + 10.5, 19.5, 13.5).and(new Mask().rect(0, 0, W, t + 22));
      const win = belowLine([
        [CX - 21, t + 17],
        [CX - 18, t + 12.5],
        [CX - 12, t + 8.5],
        [CX - 5, t + 6.8],
        [CX + 5, t + 6.8],
        [CX + 12, t + 8.5],
        [CX + 18, t + 12.5],
        [CX + 21, t + 17],
      ]);
      earsFree(win);
      sil.sub(win);
      paintHair(L, sil, hairMat, part, { src: [CX, t - 2], ball: [CX, t + 10, 21, 17], tex: 'comb', clump: 3, band: [10, 13], seed });
      const bun = new Mask().ellipse(CX, t - 3, 7.5, 5);
      paintHair(L, bun, hairMat, part, { src: [CX - 3, t - 8], ball: [CX - 1, t - 4, 8, 6.5], tex: 'strand', clump: 2.4, band: [3.5, 6], seed: seed + 2 });
      return;
    }
    case 'chanel': {
      if (front) {
        const sil = new Mask().ellipse(CX, t + 11, 21, 15).and(new Mask().rect(0, 0, W, t + 25));
        sil.poly([
          [CX - 21, t + 14],
          [CX - 15, t + 14],
          [CX - 15, t + 36],
          [CX - 22.5, t + 37],
          [CX - 22.5, t + 24],
        ]);
        sil.poly([
          [CX + 15, t + 14],
          [CX + 21, t + 14],
          [CX + 22.5, t + 24],
          [CX + 22.5, t + 37],
          [CX + 15, t + 36],
        ]);
        const win = belowLine([
          [CX - 16, t + 36],
          [CX - 15.5, t + 14],
          [CX - 11, t + 11],
          [CX - 4, t + 10],
          [CX + 2, t + 8],
          [CX + 8, t + 7],
          [CX + 13, t + 9],
          [CX + 15.5, t + 14],
          [CX + 16, t + 36],
        ]);
        sil.sub(win);
        paintHair(L, sil, hairMat, part, { src: [CX + 7, t - 1], ball: [CX, t + 12, 23, 22], tex: 'strand', clump: 3, band: [10, 13], fallY: t + 22, seed });
      } else {
        const mk = new Mask().ellipse(CX, t + 11, 21, 15).rect(CX - 22, t + 12, 44, 25);
        paintHair(L, mk, hairMat, part, { src: [CX + 7, t - 1], ball: [CX, t + 12, 23, 24], tex: 'smooth', back: true, seed });
      }
      return;
    }
    case 'rabo': {
      if (front) {
        const sil = new Mask().ellipse(CX, t + 10.5, 19.5, 13.5).and(new Mask().rect(0, 0, W, t + 21));
        const win = belowLine([
          [CX - 21, t + 17],
          [CX - 18, t + 12],
          [CX - 12, t + 8.5],
          [CX - 4, t + 7],
          [CX + 6, t + 7.2],
          [CX + 13, t + 9],
          [CX + 18, t + 12.5],
          [CX + 21, t + 17],
        ]);
        earsFree(win);
        sil.sub(win);
        paintHair(L, sil, hairMat, part, { src: [CX + 16, t + 14], ball: [CX, t + 10, 21, 17], tex: 'comb', clump: 3, band: [16, 20], seed });
      } else {
        const tail = new Mask().poly([
          [CX + 15, t + 13],
          [CX + 21, t + 15],
          [CX + 25, t + 25],
          [CX + 26, t + 38],
          [CX + 23, t + 46],
          [CX + 20, t + 36],
          [CX + 19, t + 24],
        ]);
        paintHair(L, tail, hairMat, part, { src: [CX + 17, t + 12], ball: [CX + 21, t + 28, 8, 18], tex: 'strand', clump: 2.6, fallY: t + 18, seed });
      }
      return;
    }
    case 'permanente': {
      if (!front) return;
      const vol = new Mask().ellipse(CX, t + 8, 21, 12).and(new Mask().rect(0, 0, W, t + 18));
      vol.ellipse(CX - 19, t + 14, 3.5, 5).ellipse(CX + 19, t + 14, 3.5, 5);
      const win = belowLine([
        [CX - 22, t + 18],
        [CX - 18, t + 12],
        [CX - 11, t + 10],
        [CX, t + 9.2],
        [CX + 11, t + 10],
        [CX + 18, t + 12],
        [CX + 22, t + 18],
      ]);
      win.rect(CX - 24, g.earY0 + 4, 6, 12).rect(CX + 18, g.earY0 + 4, 6, 12);
      vol.sub(win);
      const { mask, centers } = curlySilhouette(vol, 2.6, seed + 9);
      mask.sub(win);
      paintCurls(L, mask, hairMat, part, { r: 2.6, seed: seed + 9, ball: [CX, t + 8, 22, 16], centers });
      return;
    }
    case 'bebe': {
      if (!front) return;
      // penugem fina no alto da cabeça e um topete enrolado
      const fuzz = new Mask().ellipse(CX, t + 7.5, 17.5, 8).and(new Mask().rect(0, 0, W, t + 4));
      fuzz.sub(new Mask().ellipse(CX, t + 9.5, 16, 7.5));
      fuzz.stroke(
        [
          [CX - 2, t - 1],
          [CX + 1, t + 1],
          [CX + 1.5, t + 4],
          [CX - 1, t + 5.5],
          [CX - 2.5, t + 4],
        ],
        0.6,
      );
      paintHair(L, fuzz, hairMat, part, { src: [CX, t + 2], ball: [CX, t + 8, 18, 12], tex: 'smooth', seed });
      return;
    }
  }
}

// -----------------------------------------------------------------------------
// Boca (moldes do close) e desvio de rima
// -----------------------------------------------------------------------------
const MOUTH: Record<string, { adult: string[]; kid: string[]; baby: string[] }> = {
  calmo: {
    adult: ['....xxxx....', '..mMMMMMMm..', '...BBBhBB...', '....BBBB....', '.....ss.....'],
    kid: ['...xxxx...', '..mMMMMm..', '...BBhB...', '....ss....'],
    baby: ['...mMMm...', '....hB....', '....ss....'],
  },
  dor: {
    adult: ['.m........m.', '.MMMMMMMMMM.', 'MtTTTTTTTTtM', '.MMMMMMMMMM.', '...BBBBBB...', '....ssss....'],
    kid: ['m........m', 'MMMMMMMMMM', 'MtTTTTTTtM', '.MMMMMMMM.', '..BBBBBB..'],
    baby: ['...MMMM...', '..MOOOOM..', '.MOOggOOM.', '.MOggggOM.', '..MMMMMM..', '...BBBB...'],
  },
  assustado: {
    adult: ['....MMMM....', '...MOOOOM...', '..MOOggOOM..', '...MMMMMM...', '....BBBB....', '.....ss.....'],
    kid: ['...MMMM...', '..MOOOOM..', '..MOggOM..', '...MMMM...', '....BB....'],
    baby: ['...MMMM...', '..MOOOOM..', '..MOggOM..', '...MMMM...'],
  },
  rindo: {
    adult: ['m..........m', '.MMMMMMMMMM.', '.MTTTTTTTTM.', '..MOggggOM..', '...MMMMMM...', '....BhBB....'],
    kid: ['m........m', '.MMMMMMMM.', '.MTTTTTTM.', '..MOggOM..', '...MMMM...'],
    baby: ['m......m', '.MMMMMM.', '.MOggOM.', '..MMMM..'],
  },
};

/** desvia o canto da boca de um lado para baixo (colunas mais para baixo perto do canto) */
function droopRows(rows: string[], side: 'L' | 'R', amount: number): string[] {
  const w = Math.max(...rows.map((r) => r.length));
  const extra = amount + 1;
  const out: string[][] = [];
  for (let i = 0; i < rows.length + extra; i++) out.push(new Array(w).fill('.'));
  for (let c = 0; c < w; c++) {
    const t = side === 'L' ? (w / 2 - c) / (w / 2) : (c - (w / 2 - 1)) / (w / 2);
    const d = t > 0 ? Math.round(amount * Math.pow(Math.min(1, t), 1.3)) : 0;
    for (let r = 0; r < rows.length; r++) {
      const ch = rows[r][c] ?? '.';
      if (ch !== '.') out[r + d][c] = ch;
    }
  }
  return out.map((r) => r.join(''));
}

// -----------------------------------------------------------------------------
// Montagem
// -----------------------------------------------------------------------------
const SHIRTS = ['#3f6f9a', '#a8443c', '#4f7f4a', '#7a5a9a', '#c08a3a', '#3c3c44', '#5a8a8a', '#b86a8a', '#6a6a6a', '#2f5f7f', '#d8d0c0', '#8a3a4a'];

function render(s: PatientFaceSpec): Pix {
  const rnd = mulberry(((s.seed | 0) ^ 0x5bd1e995) + 7);
  const g = geoFor(s, rnd);
  const fem = s.sex === 'F';
  const kidish = g.kid;
  const old = s.age === 'idoso';
  const skinIdx = Math.max(0, Math.min(SKIN.length - 1, Math.round(s.skin ?? Math.floor(rnd() * SKIN.length))));
  const tint = tintsFor(SKIN[skinIdx], s.state, s.age);
  const L = new Layer(W, W);
  const skin = L.mat(skinRamp(tint.skin));
  // os sorteios acontecem sempre (mesma sequência); cabelo e camisa dados na spec só substituem o resultado
  const hairRnd = old ? (rnd() < 0.5 ? HAIR[3] : HAIR[4]) : s.age === 'bebe' ? (skinIdx >= 3 ? HAIR[0] : HAIR[Math.floor(rnd() * 3)]) : HAIR[Math.floor(rnd() * 3)];
  const hairHex = s.hair ?? hairRnd;
  const hairMat = L.mat(hairRamp(hairHex));
  const styleRnd = hairFor(s, rnd);
  const style = s.hairStyle ?? styleRnd;
  const shirtRnd = SHIRTS[Math.floor(rnd() * SHIRTS.length)];
  const shirt = s.shirt ?? shirtRnd;
  const hseed = 1 + Math.floor(rnd() * 97);
  const [sL] = toLch(tint.skin);

  // ---- camadas de trás → frente
  drawHair(L, g, style, hairMat, false, hseed);
  drawNeckAndShirt(L, g, skin, shirt, rnd);
  drawEars(L, g, skin);
  const fm = new Mask();
  for (let y = g.top; y <= g.chin; y++) {
    const hw = hwAt(g, y);
    fm.hl(CX - hw, CX - 1 + hw, y);
  }
  L.paint(fm, skin, P.FACE, (x, y) => faceTone(g, x, y));

  // ---- desvio de rima: lado da imagem que cai (lado do paciente espelhado)
  const droopSide: 'L' | 'R' | null = s.droop === 'dir' ? 'L' : s.droop === 'esq' ? 'R' : null;

  // ---- tintas de estado sobre a pele (antes dos traços)
  const sk = (x: number, y: number, t: number) => {
    if (L.part(x, y) !== P.FACE || L.locked(x, y)) return;
    if (L.toneAt(x, y) > t) L.tone(x, y, t);
  };
  const skUp = (x: number, y: number, t: number) => {
    if (L.part(x, y) !== P.FACE || L.locked(x, y)) return;
    if (L.toneAt(x, y) < t) L.tone(x, y, t);
  };
  const eyeW = g.eye.lid.length;
  const eyeBot = g.eyeY + Math.max(...g.eye.bot);
  // estrutura
  sk(g.eyeLX + eyeW, g.eyeY, 1);
  sk(g.eyeLX + eyeW, g.eyeY + 1, 1);
  sk(g.eyeLX + eyeW, g.eyeY + 2, 2);
  sk(g.eyeRX + eyeW, g.eyeY - 1, 1);
  sk(g.eyeRX + eyeW, g.eyeY, 1);
  for (let i = 1; i <= 4; i++) skUp(g.eyeLX + i, eyeBot + 3, 3);
  for (let i = 2; i <= 3; i++) skUp(g.eyeLX + i, eyeBot + 4, 3);
  skUp(g.eyeLX + 4, g.browY - 4, 4);
  skUp(g.eyeLX + 5, g.browY - 4, 3);
  skUp(g.eyeLX + 3, g.browY - 4, 3);
  skUp(g.eyeLX + 4, g.browY - 5, 3);
  skUp(CX - 3, g.chin - 2, 3);
  skUp(CX - 2, g.chin - 2, 3);
  // rugas (idoso)
  if (old) {
    for (let x = CX - 9; x <= CX + 8; x++) if ((x + 1) % 7 !== 0) sk(x, g.browY - 4, 2);
    for (let x = CX - 7; x <= CX + 6; x++) if (x % 6 !== 0) sk(x, g.browY - 7, 2);
    sk(g.eyeLX - 2, g.eyeY + 2, 1);
    sk(g.eyeLX - 2, g.eyeY + 4, 1);
    sk(g.eyeRX + eyeW + 1, g.eyeY + 2, 1);
    sk(g.eyeRX + eyeW + 1, g.eyeY + 4, 1);
  }
  if (old || (!kidish && droopSide)) {
    // sulcos nasolabiais: curva contínua da asa do nariz ao canto da boca (somem do lado paralisado)
    const fold: [number, number][] = [
      [6, 1],
      [7, 2],
      [7, 3],
      [8, 4],
      [8, 5],
      [8, 6],
    ];
    for (const [k, dy] of fold) {
      if (droopSide !== 'L') sk(CX - 1 - k, g.noseY + dy, dy < 2 ? 2 : 1);
      if (droopSide !== 'R') sk(CX + k, g.noseY + dy, dy < 2 ? 2 : 1);
    }
  }
  // lado paralisado: bochecha caída (sombra baixa) e pálpebra de baixo frouxa
  if (droopSide) {
    const sx = droopSide === 'L' ? -1 : 1;
    const X = (k: number) => CX + sx * k - (sx > 0 ? 1 : 0);
    // contorno da bochecha que despenca até abaixo do canto da boca
    for (let i = 0; i <= 7; i++) sk(X(13 - Math.floor(i / 2)), g.mouthY - 4 + i, 1);
    for (let i = 0; i <= 3; i++) sk(X(9 - i), g.mouthY + 4 + Math.floor(i / 2), 1);
    // pálpebra inferior caída
    const ex0 = droopSide === 'L' ? g.eyeLX : g.eyeRX;
    for (let i = 2; i < eyeW - 2; i++) sk(ex0 + i, eyeBot + 2, 1);
  }
  // barba por fazer: pontilhado mais escuro no buço, no queixo e na mandíbula
  if (s.beard && !kidish) {
    const bm = L.mat(skinRamp(mixLab(tint.skin, hairHex, sL > 0.55 ? 0.3 : 0.22)));
    for (let y = g.noseY + 2; y <= g.chin; y++)
      for (let x = CX - 18; x <= CX + 17; x++) {
        if (L.part(x, y) !== P.FACE || L.locked(x, y)) continue;
        const side = Math.abs(x + 0.5 - CX) > 7.5;
        if (y < g.mouthY - 2 && side) continue;
        if (dith2(x, y, y > g.mouthY + 2 || side ? 0.7 : 0.45)) L.remat(x, y, bm, skin);
      }
  }
  // bochechas: rubor (vermelho, bebê/criança) ou palidez (sem rosado)
  const flushMat = L.mat(skinRamp(mixLab(tint.skin, tint.flush ?? (sL > 0.6 ? '#e0707a' : '#b85050'), tint.flush ? 0.4 : 0.22)));
  const cheeks = tint.flush ? 1 : g.baby ? 0.9 : kidish ? 0.7 : fem && s.state === 'normal' ? 0.4 : 0;
  if (cheeks > 0) {
    for (const cx of [g.eyeLX + 3.5, g.eyeRX + eyeW - 3.5]) {
      const cy = eyeBot + 5;
      const rx = tint.flush ? 6 : 4.5;
      const ry = tint.flush ? 3.4 : 2.4;
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
          const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
          if (d > 1) continue;
          if (d < 0.45 * cheeks || dith2(x, y, (1 - d) * cheeks)) L.remat(x, y, flushMat, skin);
        }
    }
    if (tint.flush) {
      // nariz e testa também
      for (let y = g.noseY - 3; y <= g.noseY + 1; y++) for (let x = CX - 3; x <= CX + 2; x++) L.remat(x, y, flushMat, skin);
      for (let y = g.browY - 6; y <= g.browY - 3; y++) for (let x = CX - 6; x <= CX + 5; x++) if (dith2(x, y, 0.6)) L.remat(x, y, flushMat, skin);
    }
  }
  // cianose/cinza: halo frio em volta da boca
  if (tint.ring) {
    const ringMat = L.mat(skinRamp(mixLab(tint.skin, tint.ring, 0.45)));
    const cy = g.mouthY + 0.5;
    for (let y = g.noseY + 1; y <= g.mouthY + 6; y++)
      for (let x = CX - 10; x <= CX + 9; x++) {
        const d = ((x + 0.5 - CX) / 9) ** 2 + ((y + 0.5 - cy) / 5.2) ** 2;
        if (d > 1) continue;
        if (d < 0.6 || dith2(x, y, (1 - d) * 1.6)) L.remat(x, y, ringMat, skin);
      }
  }
  // hematoma em volta de um olho (o da direita da imagem)
  if (s.bruise) {
    const bm = L.mat(skinRamp(mixLab(tint.skin, '#5a2a6e', sL > 0.5 ? 0.5 : 0.42)));
    const bm2 = L.mat(skinRamp(mixLab(tint.skin, '#3a1a4a', sL > 0.5 ? 0.6 : 0.5)));
    const cx = g.eyeRX + eyeW / 2;
    const cy = g.eyeY + 3;
    for (let y = g.eyeY - 5; y <= eyeBot + 6; y++)
      for (let x = g.eyeRX - 4; x <= g.eyeRX + eyeW + 4; x++) {
        const d = ((x + 0.5 - cx) / 8) ** 2 + ((y + 0.5 - cy) / 6.2) ** 2;
        if (d > 1) continue;
        if (d < 0.5) L.remat(x, y, bm2, skin);
        else if (d < 0.8 || dith2(x, y, (1 - d) * 3)) L.remat(x, y, bm, skin);
      }
  }
  // petéquias
  if (s.petechiae) {
    const pr = mulberry(s.seed * 31 + 5);
    const cols = ['#7a2050', '#8a2a5a', '#6a1a48'];
    for (let i = 0; i < 46; i++) {
      const x = Math.floor(CX - 17 + pr() * 34);
      const y = Math.floor(g.browY - 6 + pr() * (g.chin + 10 - g.browY));
      const part = L.part(x, y);
      if (part !== P.FACE && part !== P.NECK) continue;
      if (y >= g.eyeY - 1 && y <= eyeBot + 1 && ((x >= g.eyeLX - 1 && x <= g.eyeLX + eyeW) || (x >= g.eyeRX - 1 && x <= g.eyeRX + eyeW))) continue;
      L.color(x, y, cols[i % 3], part);
      if (pr() < 0.25) L.color(x + 1, y, cols[(i + 1) % 3], part);
    }
  }

  // ---- expressão e olhos
  const ex = s.expression ?? 'calmo';
  let eye: EyeMood = {};
  let brow: BrowMood = { out: 1, mid: 0, inn: 1 };
  if (ex === 'dor') {
    eye = { drop: 1, lift: 1, inDrop: 1 };
    brow = { out: 1, mid: -1, inn: -3, knit: 1 };
  } else if (ex === 'assustado') {
    eye = { raise: 1, tinyPupil: true };
    brow = { out: -1, mid: -3, inn: -3 };
  } else if (ex === 'rindo') {
    eye = { closed: 'happy' };
    brow = { out: 0, mid: -2, inn: -1 };
  }
  const es = s.eyes ?? 'abertos';
  if (es === 'fechados') eye = { closed: 'down' };
  else if (es === 'semi') eye = { ...eye, closed: undefined, drop: 3, raise: 0, lift: 0 };
  else if (es === 'revirados') eye = { drop: 1, rolled: true };
  if (s.swelling && !eye.closed) eye = { ...eye, drop: Math.max(eye.drop ?? 0, 2) };
  const ec = eyeColors(irisFor(rnd, skinIdx), { lid: sL < 0.45 ? '#120a0c' : '#24121a', white: tint.sclera });
  if (s.state === 'amarelado') {
    ec.whiteS = mixLab(tint.sclera, '#a08a3a', 0.4);
  }
  const lashes = fem && !g.baby ? 2 : g.baby ? 1 : 0;
  const base = { shape: g.eye, colors: ec, skinMat: skin, lashes, crease: false, hooded: old, heavy: es === 'semi', bags: 0 };
  const eyeL: EyeMood = { ...eye, drop: (eye.drop ?? 0) + (droopSide === 'L' && !eye.closed ? 1 : 0) };
  const eyeR: EyeMood = { ...eye, drop: (eye.drop ?? 0) + ((droopSide === 'R' || (s.bruise && !eye.closed)) && !eye.closed ? 1 : 0) };
  drawEye(L, g.eyeLX, g.eyeY, 'L', { ...base, mood: eyeL });
  drawEye(L, g.eyeRX, g.eyeY, 'R', { ...base, mood: eyeR });
  // pálpebras inchadas
  if (s.swelling) {
    for (const x0 of [g.eyeLX, g.eyeRX])
      for (let i = 1; i < eyeW - 1; i++) {
        skUp(x0 + i, g.eyeY - 1, 3);
        skUp(x0 + i, g.eyeY - 2, i > 2 && i < eyeW - 3 ? 3 : 2);
        skUp(x0 + i, eyeBot + 1, 3);
      }
  }
  // olheiras fundas (cinza, pálido, semi)
  if (s.state === 'cinza' || s.state === 'palido' || es === 'semi') {
    const cm = L.mat(skinRamp(mixLab(tint.skin, '#5a4a6a', 0.2)));
    for (const x0 of [g.eyeLX, g.eyeRX]) for (let i = 1; i < eyeW - 1; i++) L.remat(x0 + i, eyeBot + 2, cm, skin);
  }

  // ---- sobrancelhas
  const browHex = old ? adjust(hairHex, -0.3, 1.2) : adjust(hairHex === HAIR[0] ? hairHex : hairHex, hairHex === HAIR[0] ? 0.02 : -0.12, 1.1);
  const thick = g.baby ? 1 : fem || kidish ? 2 : 3;
  const browL = { ...brow, inn: brow.inn + (droopSide === 'L' ? 1 : 0), out: brow.out + (droopSide === 'L' ? 1 : 0) };
  const browR = { ...brow, inn: brow.inn + (droopSide === 'R' ? 1 : 0), out: brow.out + (droopSide === 'R' ? 1 : 0) };
  const bcol = g.baby ? mixLab(browHex, tint.skin, 0.55) : browHex;
  drawBrow(L, g.eyeLX - 1, g.browY, 'L', eyeW + 2, browL, bcol, thick);
  drawBrow(L, g.eyeRX + eyeW, g.browY, 'R', eyeW + 2, browR, bcol, thick);
  if (ex === 'dor') {
    sk(CX - 1, g.browY + 1, 1);
    sk(CX - 1, g.browY + 2, 1);
    sk(CX, g.browY + 3, 2);
  }

  // ---- nariz
  const nroles: Record<string, Role> = { s: skinTone(1), d: skinTone(0), l: skinTone(3), h: skinTone(4) };
  const nose = g.baby
    ? ['....l.....', '...lh..s..', '..s.....s.', '...dssd...']
    : kidish
      ? ['....l.....', '....l..s..', '...lh...s.', '..s......s', '...dsssd..']
      : ['.....l.....', '.....l..s..', '....lh...s.', '...l......s', '..s.......s', '..s.dssd..s', '....ssss...'];
  stamp(L, nose, CX - 0.5, g.noseY, nose.length - (g.baby ? 2 : kidish ? 2 : 2), nroles);

  // ---- boca
  const lipR = skinRamp(tint.lip).map((c, i) => (i === 2 ? tint.lip : c));
  const line = mixLab(lipR[0], '#24101a', 0.45);
  const mroles: Record<string, Role> = {
    M: solidRole(line),
    m: solidRole(mixLab(lipR[0], lipR[1], 0.35)),
    U: solidRole(lipR[1]),
    B: solidRole(s.swelling ? adjust(lipR[2], 0.03, 1.2) : lipR[2]),
    h: solidRole(lipR[3]),
    T: solidRole('#f2ece2'),
    t: solidRole('#c9bdb2'),
    O: solidRole('#3a1418'),
    g: solidRole(s.state === 'cianose' ? '#7a5a8a' : s.state === 'cinza' ? '#7a6a72' : '#b04850'),
    s: skinTone(1),
    x: (Lr, x, y) => {
      if (Lr.part(x, y) === P.FACE && !Lr.locked(x, y)) Lr.tone(x, y, Math.min(Lr.toneAt(x, y), 1));
    },
  };
  const set = MOUTH[ex] ?? MOUTH.calmo;
  let rows = g.baby ? set.baby : kidish ? set.kid : set.adult;
  if (s.swelling) {
    // lábios grossos: lábio de cima e de baixo dobrados
    rows = rows.map((r) => r.replace(/x/g, 'U'));
    const i = rows.findIndex((r) => r.includes('B'));
    if (i >= 0) rows = [...rows.slice(0, i + 1), rows[i].replace(/h/g, 'B'), ...rows.slice(i + 1)];
    rows = [rows[0].replace(/[.]{2}(?=U)/, '.U'), ...rows.slice(1)];
  } else if (fem || s.state !== 'normal') rows = rows.map((r) => r.replace(/x/g, 'U'));
  if (droopSide) rows = droopRows(rows, droopSide, 3);
  const anchor = Math.max(0, rows.findIndex((r) => r.includes('M')));
  stamp(L, rows, CX - 0.5, g.mouthY, anchor, mroles);
  // baba/espuma
  if (s.froth) {
    const fr = mulberry(s.seed * 17 + 3);
    const foam = ['#ffffff', '#eef4f6', '#d8e2e8', '#b8c8d0'];
    for (let i = 0; i < 70; i++) {
      const a = fr() * Math.PI * 2;
      const rr = Math.sqrt(fr());
      const x = Math.round(CX - 0.5 + Math.cos(a) * rr * 7.5);
      const y = Math.round(g.mouthY + 1 + Math.sin(a) * rr * 3.2);
      L.color(x, y, foam[Math.floor(fr() * 2) + (y > g.mouthY + 1 ? 1 : 0)], P.FEAT);
    }
    // escorrendo pelo queixo
    for (let y = g.mouthY + 3; y <= g.mouthY + 7; y++) {
      L.color(CX + 3, y, y % 2 ? '#e8f0f4' : '#ffffff', P.FEAT);
      if (y < g.mouthY + 6) L.color(CX + 4, y, '#b8c8d0', P.FEAT);
    }
    for (const [x, y] of [
      [CX - 6, g.mouthY - 1],
      [CX + 5, g.mouthY - 1],
      [CX - 7, g.mouthY + 1],
    ])
      L.color(x, y, '#ffffff', P.FEAT);
  }

  // ---- cabelo da frente e sombras
  drawHair(L, g, style, hairMat, true, hseed);
  castShadows(L);
  L.despeckle([P.FACE, P.HAIR, P.BACK, P.BODY, P.NECK], 2);

  // ---- suor e sangue (por cima de tudo)
  if (s.sweat) {
    const drops: [number, number][] = [
      [g.eyeLX + 1, g.browY - 5],
      [CX + 7, g.browY - 7],
      [g.eyeRX + eyeW + 1, g.browY - 1],
      [g.eyeLX - 3, g.eyeY + 6],
      [CX + 1, g.browY - 3],
      [g.eyeRX + eyeW + 3, g.noseY - 1],
    ];
    for (const [x, y] of drops) {
      if (L.part(x, y) !== P.FACE && L.part(x, y + 2) !== P.FACE) continue;
      L.color(x, y, '#f4fbff', P.FEAT);
      L.color(x, y + 1, '#a8d4ec', P.FEAT);
      L.color(x + 1, y + 1, '#7ab0d0', P.FEAT);
      L.color(x, y + 2, '#6a9ec0', P.FEAT);
    }
    // pele brilhando: pontos de brilho extra
    for (const [x, y] of [
      [CX - 1, g.noseY - 2],
      [g.eyeLX + 2, eyeBot + 3],
      [CX - 4, g.browY - 5],
    ])
      if (L.part(x, y) === P.FACE && !L.locked(x, y)) L.tone(x, y, 4);
  }
  if (s.blood) {
    const from = s.bloodFrom ?? ((s.seed & 1) === 0 ? 'ambos' : 'cabeca');
    const red = ['#4a0a10', '#7a1218', '#a3141c', '#c8302c'];
    if (from === 'cabeca' || from === 'ambos') {
      // ferida na linha do cabelo + filete descendo pela testa e têmpora
      const x0 = CX + 6;
      let y = g.top + 8;
      for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) if (dith2(x0 - 3 + i, y - 1 + j, 0.75)) L.color(x0 - 3 + i, y - 1 + j, red[1 + ((i + j) % 2)], P.FEAT);
      let x = x0 + 1;
      for (; y < g.eyeY + 2; y++) {
        if (y > g.top + 14 && y % 3 === 0) x += 1;
        L.color(x, y, red[2], P.FEAT);
        L.color(x + 1, y, red[1], P.FEAT);
        if (y % 4 === 0) L.color(x - 1, y, red[3], P.FEAT);
      }
      L.color(x, y, red[1], P.FEAT);
      L.color(x + 1, y, red[0], P.FEAT);
    }
    if (from === 'nariz' || from === 'ambos') {
      // do nariz até o lábio
      const nx = CX + 1;
      for (let y = g.noseY + 1; y <= g.mouthY + (from === 'nariz' ? 2 : 1); y++) {
        L.color(nx, y, red[2], P.FEAT);
        if (y > g.noseY + 2) L.color(nx + 1, y, red[1], P.FEAT);
      }
      L.color(nx - 1, g.noseY + 1, red[1], P.FEAT);
      L.color(nx, g.noseY + 2, red[3], P.FEAT);
    }
  }

  return compose(L, null, { ink: '#1a1418', rim: '#e8eef4', rimK: 0.18, openBottom: true });
}

function irisFor(rnd: () => number, skinIdx: number): string {
  const r = rnd();
  if (skinIdx <= 1 && r < 0.25) return r < 0.12 ? '#4a6a8a' : '#5a7a4a';
  return r < 0.5 ? '#6a4228' : '#4e3020';
}

/** sombra do cabelo na testa */
function castShadows(L: Layer): void {
  const src = L.p.slice();
  for (let y = 1; y < W; y++)
    for (let x = 0; x < W; x++) {
      const p = src[y * W + x];
      if (p !== P.FACE && p !== P.EAR && p !== P.NECK) continue;
      if (L.locked(x, y)) continue;
      const above = src[(y - 1) * W + x];
      if (above === P.HAIR) L.tone(x, y, Math.min(L.toneAt(x, y), 1));
    }
  for (let y = 0; y < W - 1; y++)
    for (let x = 0; x < W; x++) {
      if (src[y * W + x] !== P.HAIR || L.locked(x, y)) continue;
      const below = src[(y + 1) * W + x];
      if (below === P.FACE || below === P.EAR) L.tone(x, y, Math.min(L.toneAt(x, y), 1));
    }
}

const cache = new Map<string, Pix>();

/**
 * Rosto de paciente 64×64 (fundo transparente) para a videochamada.
 * Determinístico pela spec; em cache (devolve cópia).
 */
export function patientFacePix(s: PatientFaceSpec): Pix {
  const key = JSON.stringify([s.seed, s.age, s.sex, s.skin, s.state, s.sweat, s.eyes, s.droop, s.bruise, s.swelling, s.blood, s.bloodFrom, s.froth, s.petechiae, s.expression, s.hair, s.hairStyle, s.shirt, s.beard]);
  let p = cache.get(key);
  if (!p) {
    p = render(s);
    if (cache.size > 64) cache.delete(cache.keys().next().value as string);
    cache.set(key, p);
  }
  return p.copy();
}

void sphereN;
