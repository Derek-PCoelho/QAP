// =============================================================================
// Retratos 64×64 (busto: cabeça, pescoço e ombros) — gerador paramétrico em
// pixel art. Forma do rosto, pele, cabelo (mechas com faixa de brilho, cachos,
// crespo), olhos com íris/pupila/brilho, sobrancelhas que carregam o humor,
// nariz, boca, barba, óculos, chapéus, roupa, acessórios e fundo suave por
// ambiente; 7 humores. Luz única de cima-esquerda, rampas de 5 tons com desvio
// de matiz, contorno seletivo e luz de recorte do ambiente no lado da sombra.
//
// portraitPix(id, mood, { blend }) → Pix 64×64 (em cache por id/humor/desgaste)
// portrait(id, mood, { blend, size }) → dataURL nativo 64×64 (a UI amplia ×1,
// ×2 ou ×3 com image-rendering: pixelated). Puro até a conversão final.
// =============================================================================
import { Pix, hasDOM, pack, unpackRgb, hash2, mulberry } from './pix';
import { CENTRAL, HOME, SKIN, HAIR, homeGrader, gradeSkin, quantize, rgbToHex } from './palette';
import { SON_NAME } from '../../engine/text';
import { protagonistLabel } from './names';
import {
  Layer,
  Mask,
  P,
  ramp,
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
  dith2,
  skinRamp,
  hairRamp,
  clothRamp,
  paintHair,
  paintCurls,
  curlySilhouette,
  belowLine,
  type HairPaint,
  type EyeMood,
  type BrowMood,
  type Role,
  type EyeShape,
} from './portraitKit';

export type Mood = 'neutro' | 'feliz' | 'triste' | 'bravo' | 'preocupado' | 'surpreso' | 'cansado';
export const MOODS: Mood[] = ['neutro', 'feliz', 'triste', 'bravo', 'preocupado', 'surpreso', 'cansado'];

/** lado do retrato em pixels nativos */
export const PORTRAIT_SIZE = 64;

export type CharacterId =
  | 'EU_M'
  | 'EU_F'
  | 'LUCIA'
  | 'ALEX'
  | 'DAVI'
  | 'ZELIA'
  | 'SIMONE'
  | 'PEIXOTO'
  | 'HENRIQUE'
  | 'BENE'
  | 'CARLA'
  | 'ARLINDO'
  | 'ASSESSOR'
  | 'CIDA'
  | 'JAIRO'
  | 'BIEL'
  | 'NOGUEIRA'
  | 'JULIANA'
  | 'ANTONIO'
  | 'ROSANGELA'
  | 'WESLEY'
  | 'MARCIA'
  | 'PAULA'
  | 'PLANTONISTA';

type FaceShape = 'oval' | 'fem' | 'round' | 'square' | 'long' | 'child' | 'teen';
type HairStyle =
  | 'short'
  | 'wavy'
  | 'kid_straight'
  | 'bun_low'
  | 'curly'
  | 'kid'
  | 'bun_top'
  | 'pixie_side'
  | 'balding'
  | 'messy'
  | 'slick'
  | 'gel'
  | 'curly_short'
  | 'long'
  | 'ponytail'
  | 'shoulder'
  | 'crop'
  | 'asym'
  | 'under_hat'
  | 'none';
type Hat = 'samu_cap' | 'cap' | 'cap_back' | 'fedora' | 'bucket' | 'helmet' | 'scrub_cap';
type Facial = 'shadow' | 'stubble' | 'heavy' | 'gray_stubble' | 'mustache' | 'mustache_white' | 'mustache_thin';
type Glasses = 'round' | 'rect' | 'half_chain' | 'sun_head';
type Clothes =
  | 'scrubs'
  | 'blouse'
  | 'shirt'
  | 'stripes'
  | 'floral'
  | 'cardigan_top'
  | 'shirt_tie'
  | 'coat_open'
  | 'samu'
  | 'jacket'
  | 'suit'
  | 'suit_slim'
  | 'cardigan'
  | 'overalls'
  | 'hoodie'
  | 'vest'
  | 'tee'
  | 'plaid'
  | 'moto'
  | 'coat';
type Acc =
  | 'earrings'
  | 'studs'
  | 'tape'
  | 'headset'
  | 'lipstick'
  | 'badge'
  | 'pen_ear'
  | 'notebook'
  | 'stetho'
  | 'mask_chin'
  | 'dark_circles'
  | 'blush'
  | 'lanyard'
  | 'freckles'
  | 'tiepin'
  | 'pocket_pen'
  | 'necklace';
type BgKind = 'home' | 'central' | 'night' | 'street' | 'office' | 'hospital' | 'school' | 'warm_street';
type Nose = 'small' | 'medium' | 'broad' | 'long' | 'button';

export interface CharacterInfo {
  /** nome exibido */
  name: string;
  /** papel na história */
  role: string;
  age: number;
}

interface Look extends CharacterInfo {
  sex: 'M' | 'F';
  face: FaceShape;
  skin: string;
  hair: string;
  style: HairStyle;
  hat?: Hat;
  hatColor?: string;
  eyes?: 'normal' | 'tired' | 'big' | 'small' | 'narrow';
  /** formato do olho (sobrepõe o formato escolhido por idade/sexo) */
  eyeShape?: 'almond';
  iris?: string;
  brows?: 'thin' | 'normal' | 'thick';
  browColor?: string;
  facial?: Facial;
  glasses?: Glasses;
  glassColor?: string;
  clothes: Clothes;
  c1: string;
  c2?: string;
  c3?: string;
  acc?: Acc[];
  bg: BgKind;
  /** 0..3 marcas de idade */
  lines?: number;
  /** expressão de repouso */
  rest?: 'smug' | 'stern' | 'wry' | 'soft';
  nose?: Nose;
  lips?: 'thin' | 'full';
}

/** pele da Lúcia: clara, um tom de marfim levemente dourado */
const LUCIA_SKIN = '#f3d3b5';

const CH: Record<CharacterId, Look> = {
  EU_M: {
    name: protagonistLabel('M'), role: 'médico regulador (você)', age: 29,
    sex: 'M', face: 'oval', skin: SKIN[1], hair: HAIR[0], style: 'short', eyes: 'tired', facial: 'stubble', iris: '#4a2e1c',
    clothes: 'scrubs', c1: '#4f8a6e', acc: ['dark_circles', 'pocket_pen'], bg: 'central',
  },
  EU_F: {
    name: protagonistLabel('F'), role: 'médica reguladora (você)', age: 29,
    sex: 'F', face: 'fem', skin: SKIN[1], hair: HAIR[0], style: 'bun_low', eyes: 'tired', iris: '#4a2e1c',
    clothes: 'scrubs', c1: '#4f8a6e', acc: ['dark_circles', 'studs', 'pocket_pen'], bg: 'central',
  },
  LUCIA: {
    name: 'Lúcia', role: 'esposa, costureira', age: 31,
    sex: 'F', face: 'fem', skin: LUCIA_SKIN, hair: HAIR[0], style: 'long', eyeShape: 'almond', iris: '#3a2418', nose: 'small', brows: 'thin',
    clothes: 'blouse', c1: HOME.fabricRed, acc: ['studs', 'tape'], bg: 'home', rest: 'soft',
  },
  // o marido, quando a protagonista é mulher: o mesmo papel da Lúcia (costura, ateliê) e a mesma paleta
  ALEX: {
    name: 'Alex', role: 'marido, costureiro', age: 37,
    sex: 'M', face: 'long', skin: SKIN[0], hair: HAIR[0], style: 'wavy', iris: '#3e5a70', nose: 'medium', brows: 'thick',
    facial: 'shadow', clothes: 'shirt', c1: HOME.fabricRed, acc: ['tape'], bg: 'home', rest: 'soft',
  },
  DAVI: {
    name: SON_NAME, role: 'filho, 8 anos', age: 8,
    sex: 'M', face: 'child', skin: SKIN[0], hair: HAIR[1], style: 'kid_straight', eyes: 'big', iris: '#3a2414', nose: 'button',
    clothes: 'stripes', c1: HOME.fabricBlue, c2: '#e9e2cf', acc: ['blush'], bg: 'home',
  },
  ZELIA: {
    name: 'Dona Zélia', role: 'mãe, 66 anos', age: 66,
    sex: 'F', face: 'round', skin: SKIN[1], hair: HAIR[3], style: 'bun_top', eyes: 'small', iris: '#5a3a22',
    glasses: 'round', glassColor: '#9a7040', clothes: 'floral', c1: '#7a5c8e', lines: 3, bg: 'home', rest: 'wry',
  },
  SIMONE: {
    name: 'Simone', role: 'TARM veterana', age: 52,
    sex: 'F', face: 'fem', skin: SKIN[1], hair: '#a3402a', style: 'pixie_side', iris: '#4a5a3a',
    glasses: 'half_chain', glassColor: '#5a3424', clothes: 'cardigan_top', c1: '#2f6a62', c2: '#1d2224',
    acc: ['headset', 'lipstick'], lines: 1, bg: 'central', rest: 'wry',
  },
  PEIXOTO: {
    name: 'Peixoto', role: 'coordenador (Saúde+ Gestão)', age: 54,
    sex: 'M', face: 'square', skin: SKIN[0], hair: HAIR[2], style: 'balding', facial: 'mustache', brows: 'thick', iris: '#5a4030', nose: 'broad',
    clothes: 'shirt_tie', c1: '#a8c2d6', c2: '#7a2a2e', acc: ['badge'], lines: 1, bg: 'office',
  },
  HENRIQUE: {
    name: 'Dr. Henrique', role: 'regulador do noturno', age: 44,
    sex: 'M', face: 'long', skin: SKIN[0], hair: HAIR[1], style: 'messy', eyes: 'tired', facial: 'heavy', iris: '#3a4a52', nose: 'long',
    clothes: 'coat_open', c1: '#dfe5dc', c2: '#2a3036', acc: ['dark_circles'], lines: 1, bg: 'night',
  },
  BENE: {
    name: 'Seu Bene', role: 'condutor da USA 03', age: 64,
    sex: 'M', face: 'round', skin: SKIN[2], hair: HAIR[4], style: 'under_hat', hat: 'samu_cap', eyes: 'small', iris: '#3a2416', nose: 'broad',
    facial: 'mustache_white', clothes: 'samu', c1: '#e8742a', lines: 3, bg: 'street', rest: 'soft',
  },
  CARLA: {
    name: 'Carla', role: 'jornalista', age: 34,
    sex: 'F', face: 'fem', skin: SKIN[0], hair: HAIR[1], style: 'asym', iris: '#4a6a4a',
    clothes: 'jacket', c1: '#6f6c3c', c2: '#e6e1d4', acc: ['pen_ear', 'notebook', 'studs'], bg: 'street',
  },
  ARLINDO: {
    name: 'Vereador Arlindo', role: 'vereador', age: 63,
    sex: 'M', face: 'long', skin: SKIN[0], hair: HAIR[3], style: 'slick', brows: 'thick', browColor: '#8f8f88', iris: '#5a6a78', nose: 'long',
    clothes: 'suit', c1: '#26304a', c2: '#9a2a2e', acc: ['tiepin'], lines: 2, bg: 'office', rest: 'smug',
  },
  ASSESSOR: {
    name: 'Assessor', role: 'assessor do vereador', age: 26,
    sex: 'M', face: 'oval', skin: SKIN[1], hair: HAIR[1], style: 'gel', glasses: 'sun_head', iris: '#3a2a1c',
    clothes: 'suit_slim', c1: '#4a505c', c2: '#1b2028', bg: 'office', rest: 'smug',
  },
  CIDA: {
    name: 'Dona Cida', role: 'viúva que liga todo dia', age: 79,
    sex: 'F', face: 'round', skin: SKIN[0], hair: HAIR[4], style: 'curly_short', eyes: 'small', iris: '#6a7a88',
    clothes: 'cardigan', c1: '#b9788f', c2: '#efe6cf', acc: ['blush', 'necklace'], lines: 3, bg: 'warm_street', rest: 'soft',
  },
  JAIRO: {
    name: 'Seu Jairo', role: 'técnico de geladeira', age: 67,
    sex: 'M', face: 'square', skin: SKIN[2], hair: HAIR[3], style: 'under_hat', hat: 'cap', hatColor: '#3f5a78', iris: '#3a2416', nose: 'broad',
    glasses: 'rect', glassColor: '#2a2420', clothes: 'overalls', c1: '#6f777d', c2: '#2e3a4e', lines: 2, bg: 'street',
  },
  BIEL: {
    name: 'Biel', role: 'Gabriel, 15 anos', age: 15,
    sex: 'M', face: 'teen', skin: SKIN[2], hair: HAIR[0], style: 'under_hat', hat: 'cap_back', hatColor: '#b8332a', iris: '#3a2414',
    clothes: 'hoodie', c1: '#384050', c2: '#e6e1d4', bg: 'street', rest: 'wry',
  },
  NOGUEIRA: {
    name: 'Seu Nogueira', role: 'senhorio', age: 72,
    sex: 'M', face: 'long', skin: SKIN[0], hair: HAIR[3], style: 'under_hat', hat: 'fedora', hatColor: '#4a4238', iris: '#4a5058', nose: 'long',
    brows: 'thick', browColor: '#9a968c', clothes: 'vest', c1: '#8a6a48', c2: '#ddd8cc', lines: 3, bg: 'warm_street', rest: 'stern',
  },
  JULIANA: {
    name: 'Juliana', role: 'filha do Seu Antônio', age: 30,
    sex: 'F', face: 'fem', skin: SKIN[2], hair: HAIR[1], style: 'long', iris: '#3a2414',
    clothes: 'blouse', c1: '#2f7a78', acc: ['studs'], bg: 'street',
  },
  ANTONIO: {
    name: 'Seu Antônio', role: 'pescador, infarto', age: 58,
    sex: 'M', face: 'square', skin: SKIN[2], hair: HAIR[3], style: 'under_hat', hat: 'bucket', hatColor: '#9b8e62', iris: '#3a2416', nose: 'broad',
    facial: 'gray_stubble', clothes: 'plaid', c1: '#8a3a2c', c2: '#5a2418', lines: 2, bg: 'warm_street', rest: 'soft',
  },
  ROSANGELA: {
    name: 'Rosângela', role: 'sócia do ateliê', age: 38,
    sex: 'F', face: 'fem', skin: SKIN[3], hair: HAIR[0], style: 'ponytail', iris: '#2e1a10', lips: 'full',
    clothes: 'tee', c1: '#7a5a8a', acc: ['studs'], bg: 'home',
  },
  WESLEY: {
    name: 'Wesley', role: 'filho da Simone, motoboy', age: 19,
    sex: 'M', face: 'teen', skin: SKIN[2], hair: HAIR[0], style: 'none', hat: 'helmet', hatColor: '#b8332a', iris: '#3a2414',
    clothes: 'moto', c1: '#202428', c2: '#c0392b', bg: 'street',
  },
  MARCIA: {
    name: 'Tia Márcia', role: `professora do ${SON_NAME}`, age: 41,
    sex: 'F', face: 'fem', skin: SKIN[1], hair: HAIR[2], style: 'shoulder', iris: '#5a4a2a',
    glasses: 'rect', glassColor: '#5a2a3a', clothes: 'cardigan', c1: '#c4923a', c2: '#efe6cf', acc: ['lanyard'], bg: 'school', rest: 'soft',
  },
  PAULA: {
    name: 'Dra. Paula', role: 'reguladora substituta', age: 36,
    sex: 'F', face: 'fem', skin: SKIN[4], hair: HAIR[0], style: 'crop', iris: '#2a160c', lips: 'full', nose: 'broad',
    clothes: 'coat', c1: '#e3e8e0', c2: '#6a5a8a', acc: ['stetho', 'studs'], bg: 'central',
  },
  PLANTONISTA: {
    name: 'Plantonista', role: 'médico do Regional', age: 38,
    sex: 'M', face: 'oval', skin: SKIN[1], hair: HAIR[1], style: 'none', hat: 'scrub_cap', hatColor: '#4f7fa8', eyes: 'tired', iris: '#3a2a1c',
    facial: 'stubble', clothes: 'scrubs', c1: '#4a78a6', acc: ['mask_chin', 'stetho'], bg: 'hospital',
  },
};

/** Metadados dos personagens (nome de exibição, papel, idade). */
export const CHARACTERS: Record<CharacterId, CharacterInfo> = Object.fromEntries(
  (Object.keys(CH) as CharacterId[]).map((id) => [id, { name: CH[id].name, role: CH[id].role, age: CH[id].age }]),
) as Record<CharacterId, CharacterInfo>;

export const CHARACTER_IDS = Object.keys(CH) as CharacterId[];

/**
 * Nome de exibição do personagem. Para o protagonista (EU_M/EU_F), passe o
 * primeiro nome escolhido pelo jogador: characterName('EU_F', 'Ana') → "Dra. Ana Moura".
 * (CHARACTERS[...].name guarda só o padrão Thiago/Camille.)
 */
export function characterName(id: CharacterId, first?: string | null): string {
  if (id === 'EU_M') return protagonistLabel('M', first);
  if (id === 'EU_F') return protagonistLabel('F', first);
  return CH[id]?.name ?? id;
}

/** Dados visuais compartilhados com os sprites de corpo inteiro. */
export function characterColors(id: CharacterId): { skin: string; hair: string; c1: string; c2?: string; sex: 'M' | 'F' } {
  const l = CH[id];
  return { skin: l.skin, hair: l.hair, c1: l.c1, c2: l.c2, sex: l.sex };
}

// -----------------------------------------------------------------------------
// Rampas
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Geometria (64×64): meia-largura do rosto por linha, posições dos traços
// -----------------------------------------------------------------------------
interface Geo {
  top: number;
  hw: number[];
  chin: number;
  /** topo da caixa dos olhos (linha da pálpebra) */
  eyeY: number;
  /** x da caixa do olho esquerdo (na tela) e direito */
  eyeLX: number;
  eyeRX: number;
  eye: EyeShape;
  browY: number;
  noseY: number;
  mouthY: number;
  earY0: number;
  earY1: number;
  neckHW: number;
  /** ombros: tabela distância-do-centro → linha do topo do tronco */
  shoulder: [number, number][];
  body: 'M' | 'F' | 'K';
}

const FACE_HW: Record<FaceShape, { top: number; hw: number[] }> = {
  oval: { top: 11, hw: [5, 8, 10, 11, 12, 12, 13, 13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13, 13, 13, 12, 12, 11, 10, 9, 7, 5] },
  fem: { top: 12, hw: [5, 8, 9, 10, 11, 12, 12, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 12, 12, 11, 11, 10, 9, 8, 6, 4] },
  round: { top: 11, hw: [6, 9, 10, 11, 12, 13, 13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13, 13, 12, 12, 11, 9, 6] },
  square: { top: 11, hw: [6, 9, 11, 12, 13, 13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 13, 13, 12, 12, 11, 10, 8] },
  long: { top: 10, hw: [5, 8, 9, 10, 11, 12, 12, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 12, 12, 12, 11, 11, 10, 9, 8, 6, 4] },
  child: { top: 13, hw: [6, 9, 10, 11, 12, 12, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 12, 11, 10, 9, 7, 5] },
  teen: { top: 12, hw: [5, 8, 10, 11, 12, 12, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12, 12, 12, 11, 11, 10, 9, 7, 5] },
};

const SHOULDERS: Record<'M' | 'F' | 'K', [number, number][]> = {
  M: [
    [0, 47],
    [6, 47],
    [10, 48],
    [14, 49.5],
    [18, 51],
    [22, 52.5],
    [25, 54],
    [27, 55.5],
    [29, 57.5],
    [30.5, 60],
    [32.5, 66],
  ],
  F: [
    [0, 48],
    [5, 48],
    [9, 49],
    [13, 50.5],
    [17, 52],
    [20, 53.5],
    [22.5, 55.5],
    [24, 58],
    [25, 61],
    [26.5, 66],
  ],
  K: [
    [0, 48],
    [5, 48],
    [8, 49],
    [11, 50.5],
    [14, 52],
    [16.5, 54],
    [18, 56.5],
    [19, 60],
    [20.5, 66],
  ],
};

function geoFor(l: Look): Geo {
  const f = FACE_HW[l.face];
  const chin = f.top + f.hw.length - 1;
  const kid = l.face === 'child';
  let eyeY = 26;
  let browY = 22;
  let noseY = 34;
  let mouthY = l.sex === 'F' ? 38 : 39;
  switch (l.face) {
    case 'long':
      eyeY = 25;
      browY = 21;
      noseY = 34;
      mouthY = 39;
      break;
    case 'child':
      eyeY = 28;
      browY = 24;
      noseY = 34;
      mouthY = 37;
      break;
    case 'teen':
      eyeY = 27;
      browY = 23;
      noseY = 34;
      mouthY = 39;
      break;
    case 'round':
      mouthY = 38;
      break;
  }
  const eyes = l.eyes ?? 'normal';
  const shape = l.eyeShape === 'almond' ? EYE_SHAPES.almond : eyes === 'big' ? EYE_SHAPES.big : eyes === 'small' ? EYE_SHAPES.small : l.sex === 'F' ? EYE_SHAPES.fem : EYE_SHAPES.adult;
  const w = shape.lid.length;
  // olhos: 7 px com 6 px entre eles; pequenos (6 px) um pouco mais afastados
  const eyeLX = w === 7 ? 22 : 23;
  const eyeRX = w === 7 ? 35 : 35;
  return {
    top: f.top,
    hw: f.hw,
    chin,
    eyeY,
    eyeLX,
    eyeRX,
    eye: shape,
    browY,
    noseY,
    mouthY,
    earY0: eyeY,
    earY1: noseY + 1,
    neckHW: kid ? 5 : l.sex === 'F' ? 6 : 7,
    shoulder: SHOULDERS[kid ? 'K' : l.sex],
    body: kid ? 'K' : l.sex,
  };
}

function hwAt(g: Geo, y: number): number {
  const r = y - g.top;
  if (r < 0 || r >= g.hw.length) return -1;
  return g.hw[r];
}

/** linha do topo do tronco na coluna x */
function shoulderY(g: Geo, x: number): number {
  const d = Math.abs(x + 0.5 - 32);
  const t = g.shoulder;
  for (let i = 1; i < t.length; i++) {
    if (d <= t[i][0]) {
      const [d0, y0] = t[i - 1];
      const [d1, y1] = t[i];
      return y0 + ((y1 - y0) * (d - d0)) / (d1 - d0);
    }
  }
  return 99;
}

// -----------------------------------------------------------------------------
// Materiais do retrato
// -----------------------------------------------------------------------------
interface Mats {
  skin: number;
  skinR: string[];
  blush: number;
  circles: number;
  stubble: number;
  lip: string[];
  hair: number;
  hairR: string[];
  brow: string;
  browL: string;
  /** pele com tinta de raiva/vergonha */
  flush: number;
}

function makeMats(L: Layer, l: Look): Mats {
  const skinR = skinRamp(l.skin);
  const skin = L.mat(skinR);
  const [sL] = toLch(l.skin);
  const blushC = sL > 0.6 ? '#e0707a' : sL > 0.45 ? '#c85a5a' : '#a04040';
  const blush = L.mat(skinRamp(mixLab(l.skin, blushC, sL > 0.6 ? 0.28 : 0.22)));
  const flush = L.mat(skinRamp(mixLab(l.skin, '#c83838', sL > 0.6 ? 0.3 : 0.24)));
  const circles = L.mat(skinRamp(mixLab(l.skin, '#6a4a78', sL > 0.6 ? 0.2 : 0.16)));
  const beardC = l.facial === 'gray_stubble' ? '#d4d0c8' : mixLab(l.hair, '#2a3040', 0.2);
  const beardK = l.facial === 'heavy' ? 0.62 : l.facial === 'gray_stubble' ? 0.34 : l.facial === 'shadow' ? 0.15 : sL > 0.6 ? 0.3 : 0.26;
  const stubble = L.mat(skinRamp(mixLab(l.skin, beardC, beardK)));
  const lipBase = l.acc?.includes('lipstick')
    ? '#b8323a'
    : sL > 0.62
      ? mixLab(l.skin, '#c05a62', 0.32)
      : sL > 0.45
        ? mixLab(l.skin, '#a84850', 0.28)
        : mixLab(l.skin, '#5a2030', l.lips === 'full' ? 0.22 : 0.2);
  const lip = ramp(lipBase, { dl: [-0.2, -0.09, 0.06, 0.12], hs: 18, hl: 8, shadowHue: 10 });
  const hairR = hairRamp(l.hair);
  const hair = L.mat(hairR);
  const bc = l.browColor ?? l.hair;
  const [bL] = toLch(bc);
  const brow = bL > 0.6 ? adjust(bc, -0.22, 1.2) : bL > 0.35 ? adjust(bc, -0.12, 1.1) : adjust(bc, -0.02, 1);
  const browL = bL > 0.6 ? adjust(bc, -0.12, 1.1) : adjust(bc, 0.06, 1);
  return { skin, skinR, blush, circles, stubble, lip, hair, hairR, brow, browL, flush };
}

// -----------------------------------------------------------------------------
// Fundo
// -----------------------------------------------------------------------------
const BG_INK: Record<BgKind, string> = {
  home: '#2c170e',
  warm_street: '#2a1d14',
  central: '#0e1613',
  night: '#090f0e',
  office: '#141b24',
  hospital: '#1e2b27',
  school: '#16231b',
  street: '#121821',
};

const BG_RIM: Record<BgKind, string> = {
  home: '#ffd9a0',
  warm_street: '#ffe2b8',
  central: '#a8e0c4',
  night: '#88b0d8',
  office: '#c4d8ec',
  hospital: '#e8f6ee',
  school: '#d0eac8',
  street: '#a8c4e4',
};

function background(kind: BgKind): Pix {
  const p = new Pix(64, 64);
  switch (kind) {
    case 'home': {
      p.vgrad(0, 0, 64, 64, ['#c9975c', '#b9864e', '#a07042'], 0.7);
      // moldura de quadro desfocada à direita
      p.recta(46, 10, 14, 18, '#8a5e36', 0.35);
      p.recta(48, 12, 10, 14, '#d8b07a', 0.3);
      // batente de porta à esquerda
      p.recta(0, 0, 5, 64, '#7a5030', 0.3);
      p.glow(12, 8, 26, '#ffe2a3', 0.42, 5);
      break;
    }
    case 'warm_street': {
      p.vgrad(0, 0, 64, 64, ['#b49a74', '#9c8462', '#7c6a52'], 0.7);
      p.recta(0, 40, 64, 24, '#6a5a46', 0.25);
      p.glow(52, 6, 26, '#fff0c8', 0.35, 5);
      // sombra de folhagem
      for (let i = 0; i < 18; i++) {
        const x = Math.floor(hash2(i, 1, 7) * 64);
        const y = Math.floor(hash2(i, 2, 7) * 26);
        p.disc(x, y, 2 + Math.floor(hash2(i, 3, 7) * 3), '#6a5a44', 0.12);
      }
      break;
    }
    case 'central': {
      p.vgrad(0, 0, 64, 64, ['#33473e', '#2a3b34', '#21302a'], 0.7);
      // faixa de luz fluorescente no alto
      p.recta(0, 0, 64, 2, '#4a6458', 0.6);
      // monitor desfocado à direita
      p.recta(44, 18, 22, 14, '#4c6e60', 0.35);
      p.recta(46, 20, 18, 10, '#6f9a86', 0.2);
      // luzinhas (bokeh)
      p.disc(7, 30, 1.5, '#e8a33d', 0.25);
      p.disc(56, 42, 1.5, '#7fd17a', 0.22);
      p.disc(4, 46, 1, '#5aa7d6', 0.2);
      break;
    }
    case 'night': {
      p.vgrad(0, 0, 64, 64, ['#1f2c28', '#18231f', '#111a17'], 0.7);
      // janela fria
      p.recta(44, 4, 16, 22, '#2e4450', 0.45);
      p.recta(51, 4, 1, 22, '#1a2a30', 0.5);
      p.recta(44, 14, 16, 1, '#1a2a30', 0.5);
      p.glow(52, 14, 18, '#6a90b0', 0.18, 4);
      break;
    }
    case 'office': {
      p.vgrad(0, 0, 64, 64, ['#5e6e7c', '#4e5e6c', '#3e4c58'], 0.7);
      // persiana
      for (let y = 4; y < 40; y += 3) p.recta(40, y, 24, 1, '#8a9cac', 0.22);
      p.recta(40, 2, 24, 40, '#a8bccc', 0.08);
      break;
    }
    case 'hospital': {
      p.vgrad(0, 0, 64, 64, ['#bdd0c4', '#aac0b4', '#93ab9e'], 0.7);
      for (let x = 2; x < 64; x += 10) p.recta(x, 0, 1, 64, '#a0b8aa', 0.35);
      for (let y = 6; y < 64; y += 10) p.recta(0, y, 64, 1, '#a0b8aa', 0.35);
      p.recta(0, 0, 64, 3, '#e8f4ec', 0.3);
      break;
    }
    case 'school': {
      p.vgrad(0, 0, 64, 64, ['#56735f', '#4a6553', '#3e5646'], 0.7);
      // borrões de giz
      p.recta(4, 10, 14, 1, '#c8d8c0', 0.12);
      p.recta(6, 14, 10, 1, '#c8d8c0', 0.1);
      p.recta(46, 8, 12, 1, '#c8d8c0', 0.12);
      p.recta(48, 12, 8, 1, '#c8d8c0', 0.1);
      p.recta(0, 58, 64, 2, '#7a6040', 0.5);
      break;
    }
    case 'street':
    default: {
      p.vgrad(0, 0, 64, 64, ['#62728a', '#526278', '#424f62'], 0.7);
      // prédios desfocados
      p.recta(0, 16, 12, 48, '#3c4858', 0.35);
      p.recta(50, 8, 14, 56, '#3c4858', 0.35);
      for (let y = 20; y < 60; y += 6) {
        p.recta(3, y, 3, 2, '#e8c890', 0.18);
        p.recta(54, y - 4, 3, 2, '#e8c890', 0.16);
      }
      p.glow(58, 6, 12, '#ffd8a0', 0.2, 3);
      break;
    }
  }
  // vinheta suave
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const dx = (x + 0.5 - 32) / 34;
      const dy = (y + 0.5 - 28) / 38;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 0.82) p.pxa(x, y, '#000000', Math.min(0.22, (d - 0.82) * 0.6));
    }
  return p;
}

// -----------------------------------------------------------------------------
// Corpo: pescoço e tronco
// -----------------------------------------------------------------------------
function torsoMask(g: Geo): Mask {
  const m = new Mask();
  for (let x = 0; x < 64; x++) {
    const sy = shoulderY(g, x);
    for (let y = Math.ceil(sy); y < 64; y++) m.set(x, y);
  }
  return m;
}

/** tom do tronco (cilindro + ombros voltados para cima) */
function torsoTone(g: Geo, x: number, y: number, bias = 0): number {
  const sy = shoulderY(g, x);
  const half = g.shoulder[g.shoulder.length - 2][0];
  const u = (x + 0.5 - 32) / half;
  const top = y - sy;
  let ny = 0.15;
  if (top < 3) ny = -0.55 + top * 0.18;
  const nx = u * 0.85;
  const I = lit(nx, ny, Math.sqrt(Math.max(0.05, 1 - nx * nx)));
  let t = toneOf(I + bias, [0.05, 0.42, 0.8, 0.95]);
  // sombra da cabeça no peito
  const dx = (x + 0.5 - 33.5) / 10;
  const dy = (y + 0.5 - 49) / 4.5;
  if (dx * dx + dy * dy < 1) t = Math.min(t, 1);
  return t;
}

/** última linha do rosto na coluna x (ou -1) */
function jawRow(g: Geo, x: number): number {
  for (let y = g.chin; y >= g.top; y--) {
    const hw = hwAt(g, y);
    if (x >= 32 - hw && x <= 31 + hw) return y;
  }
  return -1;
}

function drawNeck(L: Layer, g: Geo, m: Mats): void {
  const hw = g.neckHW;
  const mk = new Mask();
  for (let y = g.chin - 6; y <= 58; y++) {
    const widen = y >= 49 ? Math.min(4, Math.floor((y - 48) * 1.3)) : 0;
    mk.hl(32 - hw - widen, 31 + hw + widen, y);
  }
  L.paint(mk, m.skin, P.NECK, (x, y) => neckTone(g, x, y));
}

/** pescoço/colo: sombra da cabeça logo abaixo do queixo, lado esquerdo iluminado */
function neckTone(g: Geo, x: number, y: number): number {
  const hw = g.neckHW;
  const u = (x + 0.5 - 32) / (hw + 1);
  const jr = jawRow(g, x);
  const below = jr < 0 ? 99 : y - jr;
  if (below <= 1) return u < -0.6 ? 1 : 0;
  if (below <= 3) return u < -0.45 ? 2 : 1;
  if (y >= g.chin + 7) {
    // colo (peito): plano de frente, recebe luz
    return u < 0.35 ? (u < -0.7 ? 2 : 3) : u > 1.1 ? 1 : 2;
  }
  return u < -0.15 ? 2 : u > 0.55 ? 1 : 2;
}

// -----------------------------------------------------------------------------
// Cabeça: orelhas e rosto
// -----------------------------------------------------------------------------
const FACE_TH: [number, number, number, number] = [-0.12, 0.4, 0.8, 0.985];

/**
 * Planos do rosto: frente quase plana (base), lados que viram rápido (luz à
 * esquerda, sombra à direita), testa inclinada para cima, queixo e mandíbula
 * virando para baixo.
 */
function faceTone(g: Geo, x: number, y: number): number {
  const hw = hwAt(g, y);
  if (hw < 0) return 2;
  // largura "de sombreamento" contínua (elipse): faixas curvas em vez de colunas retas
  const hwMax = Math.max(...g.hw);
  const yc = g.eyeY + 4;
  const ry = (g.chin - g.top) / 2 + 5;
  const e = (y + 0.5 - yc) / ry;
  const hwS = Math.min(hw + 0.6, (hwMax + 0.7) * Math.sqrt(Math.max(0.08, 1 - e * e)));
  const u = Math.max(-1, Math.min(1, (x + 0.5 - 32) / Math.max(hw * 0.6, hwS)));
  let ny: number;
  if (y < g.browY) ny = (-0.32 * (g.browY - y)) / Math.max(1, g.browY - g.top);
  else if (y < g.noseY) ny = 0;
  else ny = 0.56 * Math.pow((y - g.noseY) / Math.max(1, g.chin - g.noseY), 1.5);
  const nx = Math.sign(u) * Math.pow(Math.abs(u), 1.35) * 0.98;
  const nz = Math.sqrt(Math.max(0.03, 1 - nx * nx - ny * ny));
  let t = toneOf(lit(nx, ny, nz), FACE_TH);
  // borda direita sempre na sombra; esquerda nunca estoura
  if (x >= 31 + hw) t = Math.min(t, 1);
  if (x <= 32 - hw) t = Math.min(t, 2);
  return t;
}

function faceMask(g: Geo): Mask {
  const m = new Mask();
  for (let y = g.top; y <= g.chin; y++) {
    const hw = hwAt(g, y);
    m.hl(32 - hw, 31 + hw, y);
  }
  return m;
}

/**
 * Orelhas desenhadas à mão (colunas: borda externa → junção com o rosto).
 * Dígito = tom; '.' = vazio. A direita é espelhada e cai na sombra.
 */
const EAR_L = ['.22.', '2321', '3211', '3101', '3111', '2211', '2111', '.221', '.221', '..11'];
const EAR_R = ['.11.', '1111', '1012', '0012', '1012', '1111', '1111', '111.', '111.', '11..'];

function drawEars(L: Layer, g: Geo, m: Mats, l: Look): void {
  const y0 = g.earY0;
  const y1 = g.earY1;
  const hwE = hwAt(g, y0 + 2);
  const xl = 32 - hwE; // primeira coluna do rosto à esquerda
  const xr = 31 + hwE;
  const h = y1 - y0 + 1;
  for (let i = 0; i < h; i++) {
    const r = Math.min(EAR_L.length - 1, Math.round((i * (EAR_L.length - 1)) / Math.max(1, h - 1)));
    const y = y0 + i;
    for (let c = 0; c < 4; c++) {
      const a = EAR_L[r][c];
      if (a !== '.') L.set(xl - 3 + c, y, m.skin, +a, P.EAR);
      // direita: coluna 0 = junção (xr), 3 = borda externa
      const b = EAR_R[r][3 - c];
      if (b !== '.') L.set(xr + 3 - c, y, m.skin, +b, P.EAR);
    }
  }
  void l;
}

function drawFaceBase(L: Layer, g: Geo, m: Mats): Mask {
  const fm = faceMask(g);
  L.paint(fm, m.skin, P.FACE, (x, y) => faceTone(g, x, y));
  return fm;
}

// -----------------------------------------------------------------------------
// Expressões
// -----------------------------------------------------------------------------
interface Expr {
  eye: EyeMood;
  brow: BrowMood;
  mouth: string;
  blush: number;
  tear: boolean;
  sweat: boolean;
  furrow: boolean;
  bags: number;
  heavy: boolean;
}

function expression(l: Look, mood: Mood): Expr {
  const tired = l.eyes === 'tired';
  const narrow = l.eyes === 'narrow' || l.rest === 'smug';
  const kid = l.face === 'child';
  const e: Expr = { eye: {}, brow: { out: 1, mid: 0, inn: 1 }, mouth: 'neutro', blush: 0, tear: false, sweat: false, furrow: false, bags: 0, heavy: false };
  switch (mood) {
    case 'neutro':
      if (tired) e.heavy = true;
      if (narrow) e.eye = { drop: 1, lift: 0 };
      if (l.rest === 'stern') {
        e.eye = { inDrop: 1 };
        e.brow = { out: 0, mid: 0, inn: 2, knit: 1 };
        e.mouth = 'stern';
        e.furrow = true;
      } else if (l.rest === 'smug') {
        e.brow = { out: 0, mid: -1, inn: 1 };
        e.mouth = 'smug';
      } else if (l.rest === 'wry') {
        e.brow = { out: 1, mid: 0, inn: 1 };
        e.mouth = 'wry';
      } else if (l.rest === 'soft') {
        e.mouth = 'soft';
      }
      break;
    case 'feliz':
      e.eye = kid ? { closed: 'happy' } : { lift: 1 };
      e.brow = { out: 0, mid: -1, inn: 0 };
      e.mouth = l.rest === 'smug' ? 'smirk' : 'feliz';
      e.blush = 0.5;
      break;
    case 'triste':
      e.eye = { outDrop: 1, wet: true };
      e.brow = { out: 1, mid: 0, inn: -2 };
      e.mouth = 'triste';
      e.tear = kid;
      break;
    case 'bravo':
      e.eye = { inDrop: 2 };
      e.brow = { out: -1, mid: 0, inn: 2, knit: 1 };
      e.mouth = 'bravo';
      e.blush = 0.7;
      e.furrow = true;
      break;
    case 'preocupado':
      e.eye = { look: [-1, 0] };
      e.brow = { out: 1, mid: -1, inn: -2, knit: 1 };
      e.mouth = 'preocupado';
      e.sweat = true;
      break;
    case 'surpreso':
      e.eye = { raise: 1, tinyPupil: true };
      e.brow = { out: -1, mid: -3, inn: -2 };
      e.mouth = 'surpreso';
      break;
    case 'cansado':
      e.eye = { drop: 2 };
      e.brow = { out: 2, mid: 1, inn: 1 };
      e.mouth = 'cansado';
      e.bags = 2;
      e.heavy = true;
      break;
  }
  return e;
}

// -----------------------------------------------------------------------------
// Traços do rosto
// -----------------------------------------------------------------------------
function drawFeatures(L: Layer, g: Geo, l: Look, m: Mats, mood: Mood, ex: Expr): void {
  const fem = l.sex === 'F';
  const kid = l.face === 'child';
  const lines = l.lines ?? 0;
  const [sL] = toLch(l.skin);
  const ec = eyeColors(vividIris(l.iris ?? '#5a3a24'), { lid: sL < 0.45 ? '#120a0c' : '#24121a', white: sL < 0.45 ? '#f2ede4' : '#ede7dd' });
  const eyeW = g.eye.lid.length;
  const ey = g.eyeY;
  const eyeBot = ey + Math.max(...g.eye.bot);

  // ---- estrutura (tons da pele)
  const sk = (x: number, y: number, t: number) => {
    if (L.part(x, y) !== P.FACE || L.locked(x, y)) return;
    if (L.toneAt(x, y) > t) L.tone(x, y, t);
  };
  const skUp = (x: number, y: number, t: number) => {
    if (L.part(x, y) !== P.FACE || L.locked(x, y)) return;
    if (L.toneAt(x, y) < t) L.tone(x, y, t);
  };
  // órbitas: o lado do nariz do olho esquerdo e o canto externo do direito ficam na sombra
  sk(g.eyeLX + eyeW, ey, 1);
  sk(g.eyeLX + eyeW, ey + 1, 1);
  sk(g.eyeLX + eyeW, ey + 2, 2);
  sk(g.eyeRX + eyeW, ey - 1, 1);
  sk(g.eyeRX + eyeW, ey, 1);
  sk(g.eyeRX + eyeW - 1, ey - 1, 2);
  sk(g.eyeRX + eyeW - 2, ey - 1, 2);
  // ponte do nariz entre os olhos
  skUp(30, ey + 1, 3);
  skUp(30, ey + 2, 3);
  // maçã do rosto esquerda (luz)
  for (const [dx, dy] of [
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
    [1, 3],
    [2, 3],
  ] as [number, number][])
    skUp(g.eyeLX + dx, eyeBot + dy, 3);
  // maçã direita: meio-tom com borda de sombra embaixo
  sk(g.eyeRX + eyeW - 2, eyeBot + 5, 1);
  sk(g.eyeRX + eyeW - 3, eyeBot + 6, 1);
  // testa: brilho
  skUp(g.eyeLX + 2, g.browY - 3, 3);
  skUp(g.eyeLX + 3, g.browY - 3, 3);
  skUp(g.eyeLX + 4, g.browY - 3, 3);
  skUp(g.eyeLX + 3, g.browY - 4, 4);
  skUp(g.eyeLX + 4, g.browY - 4, 3);
  // queixo: luz
  skUp(29, g.chin - 2, 3);
  skUp(30, g.chin - 2, 3);
  skUp(30, g.chin - 3, 3);

  // ---- rugas e olheiras
  if (lines >= 1) {
    // pés de galinha
    sk(g.eyeLX - 2, ey + 1, 1);
    sk(g.eyeLX - 2, ey + 3, 1);
    sk(g.eyeRX + eyeW + 1, ey + 1, 1);
    sk(g.eyeRX + eyeW + 1, ey + 3, 1);
  }
  if (lines >= 2) {
    // sulcos nasolabiais
    const pts: [number, number][] = [
      [27, g.noseY + 1],
      [26, g.noseY + 2],
      [26, g.noseY + 3],
      [25, g.noseY + 4],
    ];
    for (const [x, y] of pts) {
      sk(x, y, 1);
      sk(63 - x, y, 1);
    }
  }
  if (lines >= 3) {
    // testa (se ficar à mostra), bolsas e papada
    for (let x = 25; x <= 38; x++) if (x % 6 !== 0) sk(x, g.browY - 3, 2);
    for (let x = 27; x <= 36; x++) if (x % 5 !== 2) sk(x, g.browY - 5, 2);
    sk(24, g.chin - 1, 1);
    sk(39, g.chin - 1, 1);
  }
  const bags = Math.max(ex.bags, l.acc?.includes('dark_circles') ? 1 : 0);
  if (bags) {
    for (const x0 of [g.eyeLX, g.eyeRX])
      for (let i = 1; i < eyeW - 1; i++) {
        L.remat(x0 + i, eyeBot + 2, m.circles, m.skin);
        if ((bags > 1 || i % 2 === 1) && i > 1 && i < eyeW - 2) L.remat(x0 + i, eyeBot + 3, m.circles, m.skin);
        if (bags > 1) sk(x0 + i, eyeBot + 2, 2);
      }
  }
  // bochechas coradas
  const blush = (l.acc?.includes('blush') ? 0.85 : fem ? 0.4 : 0) + ex.blush * (fem || kid ? 1 : 0.7);
  if (blush > 0.15) {
    const mat = mood === 'bravo' ? m.flush : m.blush;
    for (const cx of [g.eyeLX + 2.5, g.eyeRX + eyeW - 2.5]) {
      const cy = eyeBot + 3.5;
      for (let y = Math.floor(cy - 2); y <= Math.ceil(cy + 2); y++)
        for (let x = Math.floor(cx - 3.5); x <= Math.ceil(cx + 3.5); x++) {
          const dx = (x + 0.5 - cx) / 3.3;
          const dy = (y + 0.5 - cy) / 1.7;
          const d = dx * dx + dy * dy;
          if (d > 1) continue;
          const k = Math.min(1, blush);
          if (d < 0.4 * k || dith2(x, y, (1 - d) * k * 0.9)) L.remat(x, y, mat, m.skin);
        }
    }
  }
  if (l.acc?.includes('freckles')) {
    for (const [x, y] of [
      [g.eyeLX + 2, eyeBot + 3],
      [g.eyeLX + 4, eyeBot + 4],
      [g.eyeRX + 2, eyeBot + 4],
      [g.eyeRX + 4, eyeBot + 3],
      [30, eyeBot + 3],
      [33, eyeBot + 3],
    ])
      sk(x, y, 1);
  }

  // ---- barba (antes da boca)
  drawBeard(L, g, l, m);

  // ---- olhos
  const shape = g.eye;
  const lashes = fem ? (l.age > 60 ? 1 : 2) : 0;
  const hooded = lines >= 2 || l.eyes === 'small';
  const ed = { shape, mood: { ...ex.eye }, colors: ec, skinMat: m.skin, lashes, crease: false, hooded, heavy: ex.heavy, bags: 0 };
  drawEye(L, g.eyeLX, ey, 'L', ed);
  drawEye(L, g.eyeRX, ey, 'R', ed);

  // ---- sobrancelhas
  const thick = l.brows === 'thick' ? 3 : l.brows === 'thin' ? 1 : 2;
  const blen = eyeW + 1;
  drawBrow(L, g.eyeLX - 1, g.browY, 'L', blen, ex.brow, m.brow, thick, fem ? undefined : m.browL);
  drawBrow(L, g.eyeRX + eyeW, g.browY, 'R', blen, ex.brow, m.brow, thick, fem ? undefined : m.browL);
  if (ex.furrow) {
    sk(31, g.browY + 1, 1);
    sk(31, g.browY + 2, 1);
    sk(32, g.browY + 2, 2);
  }

  // ---- nariz e boca
  drawNose(L, g, l, m);
  drawMouth(L, g, l, m, ex.mouth);

  // ---- lágrima / suor
  if (ex.tear) {
    const tx = g.eyeLX + 1;
    for (let i = 0; i < 3; i++) L.color(tx, eyeBot + 2 + i, i === 2 ? '#e8f8ff' : '#a8d8f0');
  }
  if (ex.sweat) {
    const sx = g.eyeRX + eyeW + 2;
    const sy = g.browY - 2;
    L.color(sx, sy, '#e8f8ff', P.FEAT);
    L.color(sx, sy + 1, '#a8d8f0', P.FEAT);
    L.color(sx - 1, sy + 1, '#d8f0fc', P.FEAT);
    L.color(sx, sy + 2, '#7ab4d4', P.FEAT);
    L.color(sx - 1, sy + 2, '#a8d8f0', P.FEAT);
  }
}

/** íris mais legível: clareia castanhos muito escuros, mantendo o matiz */
function vividIris(hex: string): string {
  const [L, C, h] = toLch(hex);
  if (L >= 0.42) return hex;
  return adjust(hex, 0.42 - L, C < 0.03 ? 1 : 1.25, 0);
  void h;
}

function drawNose(L: Layer, g: Geo, l: Look, m: Mats): void {
  const kind: Nose = l.nose ?? (l.face === 'child' ? 'button' : l.sex === 'F' ? 'small' : 'medium');
  const roles: Record<string, Role> = { s: skinTone(1), d: skinTone(0), l: skinTone(3), h: skinTone(4), b: skinTone(2) };
  // linha 'âncora' = ponta do nariz; '|' marca a coluna central à esquerda (x=31)
  let rows: string[];
  switch (kind) {
    case 'button':
      rows = ['..lh.s..', '.s....s.', '..dssd..'];
      break;
    case 'small':
      rows = ['...l....', '..lh..s.', '.s....s.', '..dssd..'];
      break;
    case 'broad':
      rows = ['....l.....', '....l..s..', '...lh...s.', '..s......s', '...dsssd..'];
      break;
    case 'long':
      rows = ['...l....', '...l....', '...l..s.', '...l..s.', '..lh..s.', '.s.....s', '..dssd..'];
      break;
    case 'medium':
    default:
      rows = ['...l....', '...l..s.', '..lh..s.', '.s.....s', '..dssd..'];
      break;
  }
  stamp(L, rows, 31.5, g.noseY, rows.length - 2, roles);
}

/** moldes de boca: [masculino, feminino/cheio, criança] por expressão */
const MOUTHS: Record<string, [string[], string[], string[]]> = {
  neutro: [
    ['...xxxx...', '.mMMMMMMm.', '...BBhB...', '....ss....'],
    ['...UUUU...', '..mMMMMm..', '...BBhB...', '....ss....'],
    ['..mMMm..', '...hB...', '...ss...'],
  ],
  full: [
    ['..UUUUUU..', '.mMMMMMMm.', '..BBBhBB..', '...BBBB...', '....ss....'],
    ['..UUUUUU..', '.mMMMMMMm.', '..BBBhBB..', '...BBBB...', '....ss....'],
    ['..mMMm..', '...hB...', '...ss...'],
  ],
  soft: [
    ['.m......m.', '..mMMMMm..', '....hB....', '....ss....'],
    ['.m.UUUU.m.', '..mMMMMm..', '...BBhB...', '....ss....'],
    ['.m....m.', '..mMMm..', '...hB...'],
  ],
  stern: [
    ['..........', 'mMMMMMMMMm', '.s.BBhB.s.', '...ssss...'],
    ['..UUUUUU..', 'mMMMMMMMMm', '.s.BBhB.s.', '...ssss...'],
    ['.mMMMMm.', '...hB...'],
  ],
  wry: [
    ['........m.', '.mMMMMMMm.', '...BBh....', '...ss.....'],
    ['...UUUU.m.', '.mMMMMMMm.', '...BBhB...', '....ss....'],
    ['......m.', '.mMMMMm.', '..hB....'],
  ],
  smug: [
    ['.......mM.', '..mMMMMM..', '...BBh....', '...ss.....'],
    ['....UUUmM.', '..mMMMMM..', '...BBhB...', '....ss....'],
    ['.....mM.', '.mMMMM..', '..hB....'],
  ],
  smirk: [
    ['.......mM.', '.mMMMMMMM.', '..MTTTTM..', '...MMMM...', '....hB....'],
    ['....UUUmM.', '.mMMMMMMM.', '..MTTTTM..', '...MMMM...', '....hB....'],
    ['.....mM.', '.MMMMMM.', '..MTTM..'],
  ],
  feliz: [
    ['.m......m.', '..MMMMMM..', '..MTTTTM..', '...MggM...', '....hB....'],
    ['.m......m.', '..MMMMMM..', '..MTTTTM..', '...MggM...', '...BhBB...'],
    ['m......m', '.MMMMMM.', '.MTTTTM.', '..MggM..', '...hB...'],
  ],
  triste: [
    ['....xx....', '...mMMm...', '..mM..Mm..', '.m..hB..m.', '....ss....'],
    ['...UUUU...', '...mMMm...', '..mMBBMm..', '.m..hB..m.', '....ss....'],
    ['..mMMm..', '.mMBBMm.', '.m.hB..m'],
  ],
  bravo: [
    ['.m......m.', '.MMMMMMMM.', '.MtTTTTtM.', '..MMMMMM..', '...BBBB...'],
    ['.m......m.', '.MMMMMMMM.', '.MtTTTTtM.', '..MMMMMM..', '...BBBB...'],
    ['mMMMMMMm', 'MtTTTTtM', '.MMMMMM.'],
  ],
  preocupado: [
    ['......m...', '..mMMM.m..', '.m....MMm.', '....hB....', '....ss....'],
    ['......m...', '..mMMM.m..', '.m.UUUMMm.', '....hB....', '....ss....'],
    ['....m...', '.mMM.m..', 'm...Mm..'],
  ],
  surpreso: [
    ['...MMMM...', '..MOOOOM..', '..MOggOM..', '...MMMM...', '....hB....'],
    ['...UUUU...', '..MOOOOM..', '..MOggOM..', '...MMMM...', '....hB....'],
    ['..MMM...', '.MOOOM..', '.MOgOM..', '..MMM...'],
  ],
  cansado: [
    ['..........', '..mMMMMm..', '...MOOM...', '....hB....', '....ss....'],
    ['...UUUU...', '..mMMMMm..', '...MOOM...', '...BhBB...', '....ss....'],
    ['..mMMm..', '...MM...', '...hB...'],
  ],
};

function drawMouth(L: Layer, g: Geo, l: Look, m: Mats, kind: string): void {
  const lip = m.lip;
  const lipstick = l.acc?.includes('lipstick');
  const fem = l.sex === 'F';
  const kid = l.face === 'child';
  const line = mixLab(lip[0], '#24101a', 0.5);
  const roles: Record<string, Role> = {
    M: solidRole(line),
    m: solidRole(mixLab(lip[0], lip[1], 0.35)),
    U: solidRole(lip[1]),
    B: solidRole(lip[2]),
    h: solidRole(lip[3]),
    T: solidRole('#f4eee4'),
    t: solidRole('#cfc3b8'),
    O: solidRole('#3a1418'),
    g: solidRole('#b04850'),
    s: skinTone(1),
    d: skinTone(0),
    l: skinTone(3),
    x: (Lr, x, y) => {
      if (Lr.part(x, y) === P.FACE && !Lr.locked(x, y)) Lr.tone(x, y, Math.min(Lr.toneAt(x, y), 1));
    },
  };
  let key = kind;
  if (kind === 'neutro' && (l.lips === 'full' || lipstick)) key = 'full';
  const set = MOUTHS[key] ?? MOUTHS.neutro;
  const rows = kid ? set[2] : fem || l.lips === 'full' || lipstick ? set[1] : set[0];
  // âncora: a primeira linha com 'M' (a linha da boca)
  let anchor = rows.findIndex((r) => r.includes('M'));
  if (anchor < 0) anchor = 0;
  if (kind === 'triste' || kind === 'preocupado') anchor = 1;
  stamp(L, rows, 31.5, g.mouthY, anchor, roles);
}

function drawBeard(L: Layer, g: Geo, l: Look, m: Mats): void {
  const f = l.facial;
  if (!f || f === 'mustache' || f === 'mustache_white' || f === 'mustache_thin') return;
  const heavy = f === 'heavy';
  const startY = heavy ? g.noseY - 2 : g.noseY + 1;
  const inBeard = (x: number, y: number): number => {
    // 0 = fora, 1 = borda (pontilhada), 2 = dentro
    const hw = hwAt(g, y);
    if (hw < 0 || y < startY) return 0;
    const u = (x + 0.5 - 32) / hw;
    const au = Math.abs(u);
    if (au > 1) return 0;
    const aboveMouth = y < g.mouthY - 1;
    if (y < g.noseY + 2 && au < 0.34) return 0;
    if (aboveMouth && !heavy) {
      // bigode ralo + costeleta descendo pela mandíbula
      if (au < 0.32) return y >= g.mouthY - 2 ? 2 : 1;
      if (au > 0.82) return y > g.noseY + 2 ? 2 : 1;
      return au > 0.72 ? 1 : 0;
    }
    if (aboveMouth && heavy && au > 0.38 && au < 0.66 && y < g.mouthY - 2) return y > g.noseY ? 1 : 0;
    if (y === startY) return 1;
    return au > 0.95 ? 1 : 2;
  };
  for (let y = startY; y <= g.chin; y++) {
    const hw = hwAt(g, y);
    for (let x = 32 - hw; x <= 31 + hw; x++) {
      if (L.part(x, y) !== P.FACE || L.locked(x, y)) continue;
      const k = inBeard(x, y);
      if (k === 2 || (k === 1 && dith2(x, y, 0.5))) L.remat(x, y, m.stubble, m.skin);
    }
  }
  if (heavy) {
    // barba cerrada: fios mais escuros esparsos e borda de baixo mais densa
    for (let y = g.mouthY + 1; y <= g.chin; y++)
      for (let x = 18; x <= 45; x++) if (L.matAt(x, y) === m.stubble && hash2(x, y, 9) < 0.16) L.shift(x, y, -1);
    for (let x = 18; x <= 45; x++) {
      const jr = jawRow(g, x);
      if (jr > 0 && L.matAt(x, jr) === m.stubble) L.tone(x, jr, Math.min(L.toneAt(x, jr), 1));
    }
  }
}

function drawMustache(L: Layer, g: Geo, l: Look, m: Mats): void {
  const f = l.facial;
  if (f !== 'mustache' && f !== 'mustache_white' && f !== 'mustache_thin') return;
  const col = f === 'mustache_white' ? HAIR[4] : l.hair === HAIR[3] ? '#7a7068' : mixLab(l.hair, '#3a2a20', 0.3);
  const r = hairRamp(col);
  const mat = L.mat(r);
  const y0 = g.noseY + 2;
  const thin = f === 'mustache_thin';
  const mk = new Mask();
  if (thin) mk.hl(28, 35, y0 + 1);
  else {
    mk.hl(28, 35, y0);
    mk.hl(26, 37, y0 + 1);
    mk.hl(25, 38, y0 + 2);
    mk.set(25, y0 + 3).set(38, y0 + 3);
    if (f === 'mustache_white') {
      mk.hl(26, 37, y0 + 3);
      mk.set(24, y0 + 3).set(39, y0 + 3).set(24, y0 + 4).set(39, y0 + 4);
    }
  }
  L.paint(mk, mat, P.FEAT, (x, y) => {
    const u = (x + 0.5 - 32) / 7;
    if (y === y0) return u < 0 ? 3 : 2;
    if (y >= y0 + 3) return u < 0 ? 1 : 0;
    // fios
    const t = u < -0.3 ? 3 : u > 0.4 ? 1 : 2;
    return (x + y) % 3 === 0 ? Math.max(0, t - 1) : t;
  });
  for (let x = 25; x <= 38; x++) for (let y = y0; y <= y0 + 4; y++) if (mk.get(x, y)) L.k[L.idx(x, y)] = 1;
}

// -----------------------------------------------------------------------------
// Cabelo: pintura com mechas, faixa de brilho, cachos
// -----------------------------------------------------------------------------
interface HairOut {
  /** cabelo de trás (antes do rosto) */
  back?: Mask;
  /** cabelo da frente (depois do rosto) */
  front?: Mask;
}

function drawHairBack(L: Layer, g: Geo, l: Look, m: Mats): void {
  const s = l.style;
  const top = g.top;
  switch (s) {
    case 'curly': {
      const vol = new Mask().ellipse(32, top + 12, 20.5, 16).ellipse(15, top + 26, 8, 13).ellipse(49, top + 26, 8, 13);
      vol.and(new Mask().rect(0, 0, 64, top + 39));
      const { mask, centers } = curlySilhouette(vol, 3.1, 11);
      paintCurls(L, mask, m.hair, P.BACK, { r: 3.1, seed: 11, ball: [32, top + 14, 22, 24], back: false, centers });
      return;
    }
    case 'long': {
      const mk = new Mask().ellipse(32, top + 8.5, 16, 12.5);
      mk.poly([
        [16, top + 8],
        [48, top + 8],
        [50, top + 30],
        [52, top + 44],
        [50, 62],
        [41, 60],
        [32, 56],
        [23, 60],
        [14, 62],
        [12, top + 44],
        [14, top + 30],
      ]);
      paintHair(L, mk, m.hair, P.BACK, { src: [32, top - 1], ball: [32, top + 10, 18, 22], tex: 'strand', clump: 2.6, back: true, fallY: top + 18, seed: 4 });
      return;
    }
    case 'shoulder': {
      const mk = new Mask().ellipse(32, top + 8.5, 17, 13.5);
      mk.poly([
        [15, top + 8],
        [49, top + 8],
        [50.5, top + 24],
        [51, top + 31],
        [48.5, top + 35],
        [44, top + 34],
        [32, top + 30],
        [20, top + 34],
        [15.5, top + 35],
        [13, top + 31],
        [13.5, top + 24],
      ]);
      paintHair(L, mk, m.hair, P.BACK, { src: [26, top - 1], ball: [32, top + 10, 18, 22], tex: 'strand', clump: 2.8, back: true, fallY: top + 20, seed: 6 });
      return;
    }
    case 'bun_low': {
      const mk = new Mask().ellipse(47, top + 26.5, 5, 4.6);
      paintHair(L, mk, m.hair, P.BACK, { src: [47, top + 26.5], ball: [46, top + 24, 7, 7], tex: 'strand', clump: 2.2, band: [2, 3.6], seed: 3 });
      // xuxinha onde o coque encontra a nuca
      const tie = L.mat(['#3a2430', '#5a3446', '#7a4a60', '#9a6478', '#b88296']);
      for (const [x, y, tt] of [
        [43, top + 24, 3],
        [43, top + 25, 2],
        [43, top + 26, 2],
        [44, top + 25, 2],
        [44, top + 26, 1],
        [43, top + 27, 1],
      ] as [number, number, number][])
        L.set(x, y, tie, tt, P.BACK, 1);
      return;
    }
    case 'ponytail': {
      // o crespo preso no alto: um puff de cachos atrás do topo da cabeça
      const vol = new Mask().ellipse(33, top - 3.5, 13, 9).ellipse(41, top - 1, 7, 6);
      const { mask, centers } = curlySilhouette(vol, 2.6, 23);
      paintCurls(L, mask, m.hair, P.BACK, { r: 2.6, seed: 23, ball: [31, top - 6, 14, 10], back: false, centers });
      return;
    }
    case 'asym': {
      const mk = new Mask().ellipse(32, top + 9, 16.5, 12.5).poly([
        [15.5, top + 9],
        [26, top + 9],
        [25, top + 33],
        [20, top + 31],
        [15, top + 27],
        [13.5, top + 21],
      ]);
      paintHair(L, mk, m.hair, P.BACK, { src: [40, top - 1], ball: [32, top + 10, 18, 22], tex: 'strand', clump: 2.8, back: true, seed: 5 });
      return;
    }
    default:
      return;
  }
}

function drawHairFront(L: Layer, g: Geo, l: Look, m: Mats): void {
  const s = l.style;
  const t = g.top;
  const hairPart = (mk: Mask, h: HairPaint) => paintHair(L, mk, m.hair, P.HAIR, h);
  switch (s) {
    case 'wavy': {
      // curto liso com onda: laterais baixas, topo cheio penteado para trás e
      // para a direita, uma mecha ondulada caindo na testa do lado esquerdo
      const sil = new Mask().ellipse(32.5, t + 8.5, 16.2, 11.8);
      sil.ellipse(31, t - 1.6, 11, 4.8).ellipse(40, t, 7, 3.6);
      sil.and(new Mask().rect(0, 0, 64, t + 16));
      const win = belowLine([
        [16.5, t + 15],
        [18, t + 10],
        [20.5, t + 8.2],
        [23, t + 9.2],
        [25.5, t + 7.4],
        [29, t + 5.6],
        [34, t + 5.2],
        [39, t + 6],
        [42.5, t + 7.6],
        [45, t + 10],
        [47.5, t + 15],
      ]);
      win.rect(14, g.earY0, 4, 13).rect(46, g.earY0, 4, 13);
      sil.sub(win);
      sil.rect(17, t + 10, 2, 5).rect(45, t + 10, 2, 5);
      hairPart(sil, { src: [24, t - 3], ball: [32, t + 6, 17, 14], tex: 'strand', clump: 3, band: [5, 7.5], seed: 8 });
      // risca à esquerda e a onda: um gancho de fios escuros sobre a testa
      for (let y = t - 5; y <= t + 1; y++) L.tone(24, y, 0, P.HAIR);
      for (const [x, y, tt] of [
        [23, t + 2, 1],
        [22, t + 3, 1],
        [22, t + 4, 0],
        [21, t + 5, 1],
        [27, t + 4, 1],
        [26, t + 5, 0],
        [25, t + 6, 1],
      ] as [number, number, number][])
        if (L.part(x, y) === P.HAIR) L.tone(x, y, tt, P.HAIR);
      return;
    }
    case 'short': {
      // corte curto masculino: volume no alto penteado para o lado, laterais
      // baixas acima da orelha, entradas nas têmporas (linha em M) e risca à esquerda
      const sil = new Mask().ellipse(32.5, t + 8.5, 16, 11.5);
      sil.ellipse(29, t - 1.2, 9.5, 4.2).ellipse(38.5, t - 0.2, 7.5, 3.4);
      sil.and(new Mask().rect(0, 0, 64, t + 16));
      const win = belowLine([
        [16.5, t + 15],
        [18, t + 9.5],
        [20.5, t + 7],
        [23.5, t + 7.8],
        [27, t + 6.2],
        [32, t + 5.4],
        [37, t + 5.8],
        [41.5, t + 7.2],
        [44.5, t + 9.8],
        [47.5, t + 15],
      ]);
      // orelhas livres
      win.rect(14, g.earY0, 4, 13).rect(46, g.earY0, 4, 13);
      sil.sub(win);
      // costeletas curtas
      sil.rect(17, t + 10, 2, 6).rect(45, t + 10, 2, 6);
      hairPart(sil, { src: [26, t - 3], ball: [32, t + 7, 17, 14], tex: 'strand', clump: 2.8, band: [5.5, 8], seed: 2 });
      // risca do lado e a franja caindo para a direita
      for (let y = t - 4; y <= t + 2; y++) L.tone(26, y, 0, P.HAIR);
      L.tone(27, t + 3, 0, P.HAIR);
      return;
    }
    case 'bun_low': {
      const sil = new Mask().ellipse(32, t + 8.5, 15.2, 11).and(new Mask().rect(0, 0, 64, t + 20));
      const win = belowLine([
        [17, t + 13],
        [19, t + 10],
        [22, t + 7],
        [26, t + 5],
        [31, t + 4.2],
        [33, t + 4.2],
        [38, t + 5],
        [42, t + 7],
        [45, t + 10],
        [47, t + 13],
      ]);
      win.rect(14, g.earY0 + 2, 4, 12).rect(46, g.earY0 + 2, 4, 12);
      sil.sub(win);
      // mecha solta na têmpora esquerda
      sil.stroke(
        [
          [19.5, t + 9],
          [18.5, t + 14],
          [19, t + 19],
          [20.5, t + 23],
        ],
        0.6,
      );
      hairPart(sil, { src: [32, t + 3.5], ball: [32, t + 9, 17, 14], tex: 'comb', clump: 2.6, band: [7, 9.5], seed: 3 });
      // risca do meio
      for (let y = t - 2; y <= t + 3; y++) L.tone(32, y, 0, P.HAIR);
      return;
    }
    case 'curly': {
      // franja de cachos sobre a testa e têmporas (a massa já está atrás)
      const vol = new Mask().ellipse(32, t + 3, 17, 7.5);
      vol.ellipse(19, t + 13, 4.2, 9).ellipse(45, t + 13, 4.2, 9);
      const win = belowLine([
        [16, t + 22],
        [19, t + 14],
        [22, t + 9],
        [26, t + 7.5],
        [31, t + 6.5],
        [36, t + 7],
        [41, t + 9],
        [44, t + 13],
        [47, t + 22],
      ]);
      vol.sub(win);
      const { mask, centers } = curlySilhouette(vol, 2.8, 21);
      mask.sub(belowLine([
        [16, t + 26],
        [20, t + 17],
        [24, t + 11],
        [32, t + 9],
        [40, t + 11],
        [44, t + 17],
        [47, t + 26],
      ]));
      paintCurls(L, mask, m.hair, P.HAIR, { r: 2.8, seed: 21, ball: [32, t + 10, 20, 20], centers });
      return;
    }
    case 'kid_straight': {
      // menino de cabelo liso: copa redonda, franja reta e um pouco desfiada
      // caindo para o lado, laterais cobrindo o alto da orelha, redemoinho no alto
      const sil = new Mask().ellipse(32, t + 7.5, 15.6, 10.6).ellipse(30, t - 1, 9, 3.6);
      sil.and(new Mask().rect(0, 0, 64, t + 17));
      const win = belowLine([
        [16.5, t + 15],
        [18, t + 11],
        [20, t + 9.6],
        [23, t + 10.2],
        [25, t + 9.4],
        [28, t + 10.2],
        [31, t + 9.4],
        [34, t + 10],
        [37, t + 9.2],
        [40, t + 9.6],
        [43, t + 8.6],
        [45.5, t + 10],
        [47.5, t + 15],
      ]);
      win.rect(14, g.earY0 + 2, 4, 11).rect(46, g.earY0 + 2, 4, 11);
      sil.sub(win);
      hairPart(sil, { src: [35, t - 2], ball: [32, t + 6, 16, 13], tex: 'strand', clump: 2.4, band: [4, 6.5], seed: 33 });
      // pontas da franja (fios separando)
      for (const x of [24, 30, 36, 41]) if (L.part(x, t + 9) === P.HAIR) L.tone(x, t + 9, 1, P.HAIR);
      return;
    }
    case 'kid': {
      const vol = new Mask().ellipse(32, t + 7.5, 15, 10).and(new Mask().rect(0, 0, 64, t + 16));
      const win = belowLine([
        [17, t + 12],
        [19, t + 9],
        [23, t + 7],
        [32, t + 6.2],
        [41, t + 7],
        [45, t + 9],
        [47, t + 12],
      ]);
      win.rect(14, g.earY0 + 1, 4, 12).rect(46, g.earY0 + 1, 4, 12);
      vol.sub(win);
      const { mask, centers } = curlySilhouette(vol, 1.7, 31);
      mask.sub(win);
      paintCurls(L, mask, m.hair, P.HAIR, { r: 1.7, seed: 31, ball: [32, t + 8, 16, 13], centers });
      return;
    }
    case 'bun_top': {
      const sil = new Mask().ellipse(32, t + 8.5, 15.5, 10.5).and(new Mask().rect(0, 0, 64, t + 19));
      const win = belowLine([
        [17, t + 13],
        [19, t + 10],
        [22, t + 7.5],
        [27, t + 6],
        [32, t + 5.6],
        [37, t + 6],
        [42, t + 7.5],
        [45, t + 10],
        [47, t + 13],
      ]);
      win.rect(14, g.earY0 + 1, 4, 12).rect(46, g.earY0 + 1, 4, 12);
      sil.sub(win);
      hairPart(sil, { src: [32, t - 2], ball: [32, t + 8, 17, 14], tex: 'comb', clump: 2.4, band: [8, 10.5], seed: 7 });
      // coque
      const bun = new Mask().ellipse(32, t - 3.5, 6.5, 4.6);
      paintHair(L, bun, m.hair, P.HAIR, { src: [29, t - 7], ball: [31, t - 4, 7, 5.5], tex: 'strand', clump: 2, band: [3, 5], seed: 9 });
      return;
    }
    case 'pixie_side': {
      const sil = new Mask().ellipse(32, t + 8.5, 16.5, 12).and(new Mask().rect(0, 0, 64, t + 19));
      sil.ellipse(19, t + 12, 3, 6).ellipse(45, t + 12, 3, 4.5);
      const win = belowLine([
        [16, t + 19],
        [19, t + 15],
        [21, t + 13.5],
        [24, t + 12],
        [27, t + 10],
        [30, t + 9],
        [33, t + 7],
        [37, t + 5.5],
        [41, t + 6],
        [44, t + 8.5],
        [47, t + 12],
      ]);
      win.rect(46, g.earY0 + 1, 4, 12);
      sil.sub(win);
      hairPart(sil, { src: [41, t - 1], ball: [32, t + 9, 18, 15], tex: 'strand', clump: 3, band: [8, 11], seed: 12 });
      return;
    }
    case 'balding': {
      const sil = new Mask().ellipse(32, t + 13, 16.5, 9).and(new Mask().rect(0, t + 8, 64, 30));
      sil.sub(new Mask().ellipse(32, t + 9, 13.5, 10));
      const win = new Mask().rect(19, t + 9, 26, 30);
      win.rect(14, g.earY0 + 1, 4, 12).rect(46, g.earY0 + 1, 4, 12);
      sil.sub(win);
      hairPart(sil, { src: [32, t + 4], ball: [32, t + 12, 18, 12], tex: 'strand', clump: 2.4, seed: 13 });
      // fios penteados de lado por cima da careca (linhas contínuas, curvas)
      for (const [y0, x0, x1, bend] of [
        [t + 5, 21, 41, 3],
        [t + 3, 22, 40, 3],
        [t + 1, 24, 38, 2],
      ] as [number, number, number, number][])
        for (let x = x0; x <= x1; x++) {
          const k = (x - x0) / (x1 - x0);
          const y = Math.round(y0 - Math.sin(k * Math.PI) * bend + k * 1.5);
          L.set(x, y, m.hair, x < 30 ? 2 : 1, P.HAIR);
        }
      return;
    }
    case 'messy': {
      const sil = new Mask().ellipse(32, t + 8, 17, 12).and(new Mask().rect(0, 0, 64, t + 20));
      // tufos
      for (const [x, y, rx, ry] of [
        [20, t - 1, 4, 3],
        [27, t - 3, 4, 3],
        [35, t - 3.5, 4.5, 3],
        [43, t - 0.5, 4, 3],
        [15.5, t + 7, 2.5, 3.5],
        [48.5, t + 6, 2.5, 3.5],
      ] as [number, number, number, number][])
        sil.ellipse(x, y, rx, ry);
      sil.poly([
        [24, t - 3],
        [22, t - 7],
        [27, t - 4],
      ]);
      sil.poly([
        [38, t - 4],
        [42, t - 7],
        [42, t - 2],
      ]);
      const win = belowLine([
        [16, t + 15],
        [18, t + 11],
        [20, t + 13],
        [22, t + 9],
        [24, t + 12],
        [27, t + 8.5],
        [30, t + 11],
        [32, t + 7],
        [35, t + 10],
        [38, t + 7.5],
        [41, t + 10],
        [44, t + 8],
        [47, t + 12],
      ]);
      win.rect(14, g.earY0 + 3, 4, 10).rect(46, g.earY0 + 3, 4, 10);
      sil.sub(win);
      hairPart(sil, { src: [33, t - 2], ball: [32, t + 8, 19, 15], tex: 'strand', clump: 3.4, band: [8, 10.5], seed: 14, messy: true });
      return;
    }
    case 'slick': {
      const sil = new Mask().ellipse(32, t + 7.5, 16, 10.5).and(new Mask().rect(0, 0, 64, t + 18));
      const win = belowLine([
        [16, t + 14],
        [18.5, t + 10],
        [21, t + 5.5],
        [24, t + 5],
        [28, t + 6.5],
        [32, t + 7.5],
        [36, t + 6.5],
        [40, t + 5],
        [43, t + 5.5],
        [45.5, t + 10],
        [48, t + 14],
      ]);
      win.rect(14, g.earY0 + 1, 4, 12).rect(46, g.earY0 + 1, 4, 12);
      sil.sub(win);
      hairPart(sil, { src: [32, t + 18], ball: [32, t + 8, 17, 13], tex: 'comb', clump: 2.6, band: [12, 15], seed: 15 });
      return;
    }
    case 'gel': {
      // laterais curtas, topete para cima e para trás
      const sil = new Mask().ellipse(32, t + 8, 15.5, 9.5).and(new Mask().rect(0, 0, 64, t + 16));
      sil.poly([
        [19, t + 5],
        [21, t - 2],
        [25, t - 6],
        [31, t - 8],
        [38, t - 7],
        [43, t - 3],
        [45, t + 3],
        [45, t + 7],
      ]);
      const win = belowLine([
        [16, t + 12],
        [18, t + 9],
        [21, t + 7],
        [32, t + 6.5],
        [43, t + 7],
        [46, t + 9],
        [48, t + 12],
      ]);
      win.rect(14, g.earY0 + 1, 4, 12).rect(46, g.earY0 + 1, 4, 12);
      sil.sub(win);
      hairPart(sil, { src: [34, t + 14], ball: [31, t + 2, 16, 13], tex: 'comb', clump: 3, band: [13, 16.5], seed: 16 });
      // degradê nas laterais (pele aparecendo)
      for (let y = t + 3; y < t + 16; y++)
        for (const x of [17, 18, 19, 44, 45, 46]) if (L.part(x, y) === P.HAIR && dith2(x, y, 0.45)) L.set(x, y, m.skin, x < 32 ? 1 : 0, P.HAIR);
      return;
    }
    case 'curly_short': {
      const vol = new Mask().ellipse(32, t + 6.5, 16.5, 10).and(new Mask().rect(0, 0, 64, t + 16));
      vol.ellipse(17.5, t + 11, 2.6, 4).ellipse(46.5, t + 11, 2.6, 4);
      const win = belowLine([
        [17, t + 14],
        [19, t + 10],
        [23, t + 8],
        [32, t + 7],
        [41, t + 8],
        [45, t + 10],
        [47, t + 14],
      ]);
      win.rect(14, g.earY0 + 3, 4, 10).rect(46, g.earY0 + 3, 4, 10);
      vol.sub(win);
      const { mask, centers } = curlySilhouette(vol, 2.3, 41);
      mask.sub(win);
      paintCurls(L, mask, m.hair, P.HAIR, { r: 2.3, seed: 41, ball: [32, t + 6, 18, 14], centers });
      return;
    }
    case 'long': {
      const sil = new Mask().ellipse(32, t + 8.5, 16, 12.5).and(new Mask().rect(0, 0, 64, t + 21));
      // mechas que caem na frente dos ombros
      sil.poly([
        [16, t + 12],
        [21, t + 12],
        [20, t + 26],
        [19, t + 36],
        [18, t + 46],
        [13, t + 46],
        [13, t + 30],
      ]);
      sil.poly([
        [43, t + 12],
        [48, t + 12],
        [51, t + 30],
        [51, t + 46],
        [46, t + 46],
        [45, t + 36],
        [44, t + 26],
      ]);
      const win = belowLine([
        [18, t + 30],
        [19.5, t + 14],
        [22, t + 9],
        [26, t + 6],
        [31.5, t + 4],
        [32.5, t + 4],
        [38, t + 6],
        [42, t + 9],
        [44.5, t + 14],
        [46, t + 30],
      ]);
      sil.sub(win);
      hairPart(sil, { src: [32, t + 2], ball: [32, t + 10, 18, 22], tex: 'strand', clump: 2.6, band: [8, 10.5], fallY: t + 18, seed: 4 });
      for (let y = t - 3; y <= t + 3; y++) L.tone(32, y, 0, P.HAIR);
      return;
    }
    case 'ponytail': {
      // puxado para trás, rente ao crânio, até o puff de cachos (desenhado atrás)
      const sil = new Mask().ellipse(32, t + 8, 15.4, 11.6).and(new Mask().rect(0, 0, 64, t + 18));
      const win = belowLine([
        [17, t + 13],
        [19, t + 10],
        [22, t + 7.5],
        [27, t + 5.6],
        [32, t + 5],
        [37, t + 5.6],
        [42, t + 7.5],
        [45, t + 10],
        [47, t + 13],
      ]);
      win.rect(14, g.earY0 + 1, 4, 12).rect(46, g.earY0 + 1, 4, 12);
      sil.sub(win);
      hairPart(sil, { src: [33, t - 5], ball: [30, t + 4, 16, 12], tex: 'comb', clump: 2.2, band: [7, 8.5], seed: 18 });
      // xuxinha vermelha na base do puff
      for (let x = 28; x <= 38; x++) {
        const y = t - 2 + (x < 30 || x > 36 ? 1 : 0);
        L.color(x, y, x % 3 === 0 ? '#a8302a' : '#e05a4a', P.HAIR);
        L.color(x, y + 1, '#8a2420', P.HAIR);
      }
      return;
    }
    case 'shoulder': {
      // repicado na altura do ombro: copa cheia, risca do lado, laterais que
      // afinam perto do queixo e as pontas virando para fora
      const sil = new Mask().ellipse(32, t + 8.5, 17, 13.5).and(new Mask().rect(0, 0, 64, t + 21));
      sil.poly([
        [15, t + 12],
        [20.5, t + 12],
        [20.5, t + 22],
        [21.5, t + 29],
        [20, t + 33],
        [16.5, t + 35],
        [12.5, t + 34],
        [14, t + 30],
        [13.5, t + 22],
      ]);
      sil.poly([
        [43.5, t + 12],
        [49, t + 12],
        [50.5, t + 22],
        [50, t + 30],
        [51.5, t + 34],
        [47.5, t + 35],
        [44, t + 33],
        [42.5, t + 29],
        [43.5, t + 22],
      ]);
      const win = belowLine([
        [19, t + 30],
        [20, t + 12],
        [22, t + 8],
        [25, t + 5.5],
        [27, t + 5],
        [30, t + 7],
        [35, t + 9],
        [40, t + 11],
        [43, t + 14],
        [44, t + 30],
      ]);
      sil.sub(win);
      hairPart(sil, { src: [26, t - 2], ball: [30, t + 8, 18, 20], tex: 'strand', clump: 2.4, band: [6.5, 9], fallY: t + 21, seed: 6 });
      for (let y = t - 4; y <= t + 2; y++) L.tone(26, y, 0, P.HAIR);
      // pontas mais claras, viradas para fora
      for (const [x, y] of [
        [13, t + 33],
        [14, t + 34],
        [50, t + 33],
        [51, t + 34],
      ] as [number, number][])
        if (L.part(x, y) === P.HAIR) L.tone(x, y, 3, P.HAIR);
      return;
    }
    case 'crop': {
      const vol = new Mask().ellipse(32, t + 8, 15.2, 10).and(new Mask().rect(0, 0, 64, t + 15));
      const win = belowLine([
        [17, t + 11],
        [19, t + 8],
        [23, t + 6.2],
        [32, t + 5.6],
        [41, t + 6.2],
        [45, t + 8],
        [47, t + 11],
      ]);
      win.rect(14, g.earY0 + 1, 4, 12).rect(46, g.earY0 + 1, 4, 12);
      vol.sub(win);
      const { mask, centers } = curlySilhouette(vol, 1.5, 51);
      mask.sub(win);
      paintCurls(L, mask, m.hair, P.HAIR, { r: 1.5, seed: 51, ball: [32, t + 7, 16, 12], centers });
      return;
    }
    case 'asym': {
      // chanel assimétrico: o lado esquerdo comprido, cortado em diagonal (mais
      // comprido na frente), a risca bem marcada à direita e a nuca curta
      const sil = new Mask().ellipse(32, t + 9, 16.5, 12.5).ellipse(27, t - 0.5, 9, 4).and(new Mask().rect(0, 0, 64, t + 19));
      sil.poly([
        [15, t + 10],
        [22, t + 10],
        [22.5, t + 22],
        [25, t + 33],
        [21, t + 32],
        [16.5, t + 29],
        [13.5, t + 23],
      ]);
      const win = belowLine([
        [21, t + 31],
        [22, t + 17],
        [24, t + 13],
        [27, t + 10.5],
        [31, t + 8.5],
        [35, t + 7],
        [39, t + 6],
        [43, t + 7.5],
        [45.5, t + 10],
        [47, t + 12],
      ]);
      win.rect(46, g.earY0, 4, 13);
      sil.sub(win);
      hairPart(sil, { src: [40, t - 1], ball: [30, t + 8, 18, 18], tex: 'strand', clump: 2.4, band: [7, 9.5], fallY: t + 19, seed: 5 });
      // risca bem marcada
      for (let y = t - 3; y <= t + 3; y++) L.tone(40, y, 0, P.HAIR);
      L.tone(41, t + 4, 0, P.HAIR);
      // nuca raspada à direita
      for (let y = t + 12; y <= t + 18; y++) if (L.part(46, y) === P.FACE || L.part(45, y) === P.FACE) L.tone(45, y, 1, P.FACE);
      return;
    }
    case 'under_hat': {
      // só costeletas/laterais sob o chapéu
      const sil = new Mask();
      const y0 = l.hat === 'cap_back' ? t + 9 : t + 9;
      sil.rect(17, y0, 3, 9).rect(44, y0, 3, 9);
      if (l.hat === 'fedora' || l.hat === 'bucket') sil.rect(16, y0 - 1, 4, 9).rect(44, y0 - 1, 4, 9);
      sil.sub(new Mask().rect(14, g.earY0 + 3, 4, 12).rect(46, g.earY0 + 3, 4, 12));
      hairPart(sil, { src: [32, t], ball: [32, t + 10, 17, 14], tex: 'strand', clump: 2, seed: 19 });
      return;
    }
    default:
      return;
  }
}

/** sombra do cabelo/chapéu na testa e no pescoço */
function castShadows(L: Layer): void {
  const W = L.w;
  const src = L.p.slice();
  for (let y = 1; y < L.h; y++)
    for (let x = 0; x < W; x++) {
      const p = src[y * W + x];
      if (p !== P.FACE && p !== P.EAR && p !== P.NECK) continue;
      if (L.locked(x, y)) continue;
      const above = src[(y - 1) * W + x];
      const above2 = y > 1 ? src[(y - 2) * W + x] : 0;
      if (above === P.HAIR || above === P.HAT) L.tone(x, y, Math.min(L.toneAt(x, y), 1));
      else if ((above2 === P.HAIR || above2 === P.HAT) && x > 30) L.tone(x, y, Math.min(L.toneAt(x, y), 2));
      // lateral: cabelo à esquerda (lado da luz) faz sombra à direita
      const left = x > 0 ? src[y * W + x - 1] : 0;
      if (left === P.HAIR && x > 32) L.tone(x, y, Math.min(L.toneAt(x, y), 1));
    }
  // cabelo encostado na pele fica mais escuro na borda de baixo
  for (let y = 0; y < L.h - 1; y++)
    for (let x = 0; x < W; x++) {
      if (src[y * W + x] !== P.HAIR || L.locked(x, y)) continue;
      const below = src[(y + 1) * W + x];
      if (below === P.FACE || below === P.EAR) L.tone(x, y, Math.min(L.toneAt(x, y), 1));
    }
}

// -----------------------------------------------------------------------------
// Chapéus
// -----------------------------------------------------------------------------
function drawHat(L: Layer, g: Geo, l: Look, m: Mats): void {
  if (!l.hat) return;
  const t = g.top;
  const col = l.hat === 'samu_cap' ? '#e8742a' : l.hatColor ?? '#3f5a78';
  const R = clothRamp(col);
  const mat = L.mat(R);
  const dome = (cy: number, rx: number, ry: number) => (x: number, y: number) => toneOf(lit(...sphereN(x, y, 32, cy, rx, ry)), [-0.2, 0.3, 0.72, 0.93]);
  switch (l.hat) {
    case 'samu_cap':
    case 'cap': {
      const crown = new Mask().ellipse(32, t + 6.5, 16, 10).and(new Mask().rect(0, 0, 64, t + 10));
      L.paint(crown, mat, P.HAT, dome(t + 7, 17, 12));
      // costuras dos gomos
      for (let y = t - 3; y <= t + 9; y++) {
        L.shift(32, y, -1, P.HAT);
        if (y > t) {
          L.shift(24 - Math.floor((y - t) / 5), y, -1, P.HAT);
          L.shift(40 + Math.floor((y - t) / 5), y, -1, P.HAT);
        }
      }
      L.set(31, t - 4, mat, 1, P.HAT);
      L.set(32, t - 4, mat, 0, P.HAT);
      if (l.hat === 'samu_cap') {
        // painel frontal claro + estrela da vida
        const pr = clothRamp('#eef0ea');
        const pm = L.mat(pr);
        const panel = new Mask().ellipse(32, t + 7, 9, 8).and(new Mask().rect(0, t + 1, 64, 9));
        L.paint(panel, pm, P.HAT, (x, y) => (x > 36 ? 1 : y < t + 3 ? 3 : 2));
        const red = '#d63a30';
        const reds: [number, number][] = [
          [31, t + 3],
          [32, t + 3],
          [31, t + 4],
          [32, t + 4],
          [29, t + 5],
          [30, t + 5],
          [31, t + 5],
          [32, t + 5],
          [33, t + 5],
          [34, t + 5],
          [29, t + 6],
          [30, t + 6],
          [31, t + 6],
          [32, t + 6],
          [33, t + 6],
          [34, t + 6],
          [31, t + 7],
          [32, t + 7],
          [31, t + 8],
          [32, t + 8],
        ];
        for (const [x, y] of reds) L.color(x, y, red, P.HAT);
        L.color(31, t + 3, '#ef5a4a', P.HAT);
      } else {
        // logotipo pequeno
        L.color(27, t + 5, '#e6e1d4', P.HAT);
        L.color(28, t + 5, '#e6e1d4', P.HAT);
        L.color(27, t + 6, '#d94436', P.HAT);
        L.color(28, t + 6, '#e6e1d4', P.HAT);
      }
      // aba: elipse achatada à frente
      const brim = new Mask().ellipse(32, t + 10.5, 17, 3.2).and(new Mask().rect(0, t + 9, 64, 6));
      L.paint(brim, mat, P.HAT, (x, y) => {
        if (y >= t + 12) return 0;
        if (y === t + 11) return x < 30 ? 2 : 1;
        return x < 26 ? 3 : x > 42 ? 1 : 2;
      });
      return;
    }
    case 'cap_back': {
      const crown = new Mask().ellipse(32, t + 7, 16.2, 10.5).and(new Mask().rect(0, 0, 64, t + 12));
      L.paint(crown, mat, P.HAT, dome(t + 7, 17, 12));
      for (let y = t - 3; y <= t + 10; y++) L.shift(32, y, -1, P.HAT);
      // abertura do regulador com cabelo aparecendo
      const hairR = m.hair;
      const open = new Mask().ellipse(32, t + 11, 4.6, 4).and(new Mask().rect(0, t + 7, 64, 4));
      L.paint(open, hairR, P.HAIR, (x, y) => (y === t + 7 ? 0 : x < 31 ? 2 : 1));
      // tira de regulagem atravessando a abertura
      for (let x = 28; x <= 35; x++) L.color(x, t + 9, x % 2 ? '#2a2624' : '#4a4440', P.HAT);
      // faixa de baixo
      for (let x = 16; x <= 47; x++) {
        if (L.part(x, t + 11) === P.HAT) L.tone(x, t + 11, 1);
      }
      // franja por baixo da aba
      const fr = new Mask();
      for (let x = 18; x <= 45; x++) if (x % 3 !== 0 && (x < 27 || x > 36)) fr.set(x, t + 12);
      fr.rect(17, t + 11, 2, 7).rect(45, t + 11, 2, 7);
      L.paint(fr, m.hair, P.HAIR, (x) => (x < 30 ? 1 : 0));
      return;
    }
    case 'fedora': {
      const crown = new Mask().ellipse(32, t + 3.5, 12.5, 9).and(new Mask().rect(0, 0, 64, t + 8));
      L.paint(crown, mat, P.HAT, dome(t + 4, 13, 10));
      // vinco do topo
      for (let x = 28; x <= 36; x++) L.tone(x, t - 5, 1);
      L.tone(31, t - 4, 1);
      L.tone(32, t - 4, 1);
      L.tone(33, t - 4, 0);
      // fita
      const band = L.mat(clothRamp('#2a2420'));
      for (let x = 19; x <= 44; x++) for (let y = t + 5; y <= t + 7; y++) if (L.part(x, y) === P.HAT) L.set(x, y, band, x < 28 ? 3 : x > 40 ? 1 : 2, P.HAT);
      // aba larga
      const brim = new Mask().ellipse(32, t + 9, 23, 3.5).and(new Mask().rect(0, t + 7, 64, 6));
      L.paint(brim, mat, P.HAT, (x, y) => {
        if (y >= t + 11) return 0;
        if (y === t + 10) return x < 24 ? 2 : 1;
        return x < 18 ? 3 : x > 46 ? 1 : 2;
      });
      return;
    }
    case 'bucket': {
      const crown = new Mask().ellipse(32, t + 4.5, 13.5, 9).and(new Mask().rect(0, 0, 64, t + 9));
      L.paint(crown, mat, P.HAT, dome(t + 5, 14, 11));
      // costuras em círculos
      for (let x = 20; x <= 44; x++) {
        if (x % 2 === 0) L.shift(x, t + 1, -1, P.HAT);
      }
      for (let x = 19; x <= 45; x++) L.tone(x, t + 7, 1);
      // aba caída (trapézio)
      const brim = new Mask().poly([
        [17, t + 7],
        [47, t + 7],
        [52, t + 13],
        [12, t + 13],
      ]);
      L.paint(brim, mat, P.HAT, (x, y) => {
        if (y >= t + 12) return 0;
        const u = (x + 0.5 - 32) / 20;
        return u < -0.5 ? 3 : u > 0.5 ? 1 : 2;
      });
      for (let x = 13; x <= 51; x += 2) L.shift(x, t + 11, -1, P.HAT);
      return;
    }
    case 'helmet': {
      // capacete aberto com viseira levantada
      const shell = new Mask().ellipse(32, t + 12, 19, 18.5).and(new Mask().rect(0, 0, 64, g.chin + 3));
      const open = new Mask().ellipse(32, g.eyeY + 7, 12.5, 15).and(new Mask().rect(0, t + 9, 64, 64));
      shell.sub(open);
      L.paint(shell, mat, P.HAT, (x, y) => {
        const tt = toneOf(lit(...sphereN(x, y, 32, t + 10, 20, 20)), [-0.25, 0.25, 0.68, 0.9]);
        return tt;
      });
      // listra branca central
      const white = L.mat(clothRamp('#eef0ea'));
      for (let y = t - 6; y <= t + 3; y++) for (const x of [31, 32]) if (L.part(x, y) === P.HAT) L.set(x, y, white, x === 31 ? 3 : 2, P.HAT);
      // viseira fumê levantada
      const visor = L.mat(ramp('#2a3440', { dl: [-0.08, -0.04, 0.12, 0.3] }));
      const vm = new Mask().ellipse(32, t + 8, 14, 3.2).and(new Mask().rect(0, t + 6, 64, 6));
      L.paint(vm, visor, P.HAT, (x, y) => (y === t + 6 ? 3 : x < 24 ? 3 : x < 28 ? 2 : 1));
      L.color(22, t + 7, '#c8d8e4', P.HAT);
      L.color(23, t + 7, '#9ab0c0', P.HAT);
      // espuma interna (borda escura do rosto)
      const pad = L.mat(clothRamp('#2a2a2e'));
      for (let y = t + 9; y <= g.chin + 2; y++)
        for (let x = 0; x < 64; x++) {
          if (L.part(x, y) !== P.HAT) continue;
          const inner = open.get(x - 1, y) || open.get(x + 1, y) || open.get(x, y - 1);
          if (inner) L.set(x, y, pad, x < 32 ? 1 : 0, P.HAT);
        }
      return;
    }
    case 'scrub_cap': {
      const cap = new Mask().ellipse(32, t + 7, 16, 11).and(new Mask().rect(0, 0, 64, t + 11));
      cap.rect(16, t + 10, 32, 1);
      L.paint(cap, mat, P.HAT, (x, y) => {
        let tt = toneOf(lit(...sphereN(x, y, 32, t + 8, 17, 13)), [-0.2, 0.3, 0.72, 0.93]);
        if (y >= t + 10) tt = 1;
        return tt;
      });
      // estampa: pontinhos claros
      for (let y = t - 3; y <= t + 9; y++)
        for (let x = 17; x <= 46; x++) if (L.part(x, y) === P.HAT && (x * 3 + y * 5) % 9 === 0) L.shift(x, y, 2);
      // amarração atrás
      L.set(48, t + 6, mat, 1, P.HAT);
      L.set(49, t + 7, mat, 1, P.HAT);
      L.set(49, t + 8, mat, 0, P.HAT);
      L.set(48, t + 9, mat, 1, P.HAT);
      return;
    }
  }
}

// -----------------------------------------------------------------------------
// Óculos
// -----------------------------------------------------------------------------
function drawGlasses(L: Layer, g: Geo, l: Look): void {
  if (!l.glasses) return;
  const c = l.glassColor ?? '#2a2420';
  const cl = adjust(c, 0.18, 0.9);
  const ey = g.eyeY;
  const w = g.eye.lid.length;
  const put = (x: number, y: number, hex = c) => L.color(x, y, hex, P.GLASS);
  const lens = (x: number, y: number) => {
    if (!L.filled(x, y)) return;
    const h = L.hexAt(x, y);
    if (!h) return;
    L.color(x, y, mixLab(h, '#e8f4ff', 0.16), L.part(x, y) === P.FEAT ? P.FEAT : P.GLASS);
  };
  switch (l.glasses) {
    case 'round': {
      for (const x0 of [g.eyeLX, g.eyeRX]) {
        const cx = x0 + w / 2;
        const cy = ey + 2;
        const rx = w / 2 + 1.2;
        const ry = 3.6;
        for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
          for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
            const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
            const dOut = ((x + 0.5 - cx) / (rx + 0.9)) ** 2 + ((y + 0.5 - cy) / (ry + 0.9)) ** 2;
            if (d > 1 && dOut <= 1) put(x, y, y < cy && x < cx ? cl : c);
            else if (d <= 1 && (x + y) % 2 === 0 && x - cx < y - cy - 1) lens(x, y);
          }
      }
      put(30, ey + 1);
      put(31, ey + 1);
      put(32, ey + 1);
      put(33, ey + 1);
      // hastes até as orelhas
      for (let x = g.eyeLX - 4; x < g.eyeLX - 1; x++) put(x, ey + 1);
      for (let x = g.eyeRX + w + 2; x <= g.eyeRX + w + 4; x++) put(x, ey + 1);
      // brilho
      L.color(g.eyeRX + w - 1, ey, '#ffffff', P.GLASS);
      L.color(g.eyeLX + w - 1, ey, '#f4f4f0', P.GLASS);
      return;
    }
    case 'rect': {
      for (const x0 of [g.eyeLX - 1, g.eyeRX - 1]) {
        const x1 = x0 + w + 1;
        for (let x = x0; x <= x1; x++) {
          put(x, ey - 1, x < x0 + 3 ? cl : c);
          put(x, ey + 4);
        }
        for (let y = ey - 1; y <= ey + 4; y++) {
          put(x0, y);
          put(x1, y);
        }
        for (let x = x0 + 1; x < x1; x++) lens(x, ey + 3);
        L.color(x1 - 1, ey, '#f4f8ff', P.GLASS);
      }
      put(30, ey);
      put(31, ey);
      put(32, ey);
      put(33, ey);
      for (let x = g.eyeLX - 4; x < g.eyeLX - 1; x++) put(x, ey);
      for (let x = g.eyeRX + w + 1; x <= g.eyeRX + w + 3; x++) put(x, ey);
      return;
    }
    case 'half_chain': {
      // meia-lua baixa no nariz (ela olha por cima das lentes)
      const y = ey + Math.max(...g.eye.bot) + 2;
      for (const x0 of [g.eyeLX - 1, g.eyeRX - 1]) {
        const x1 = x0 + w + 1;
        put(x0, y, x0 < 30 ? cl : c);
        put(x1, y);
        for (let x = x0 + 1; x < x1; x++) {
          put(x, y + 2, x < x0 + 3 ? cl : c);
          lens(x, y + 1);
          if (x === x0 + 1 || x === x1 - 1) put(x, y + 1);
        }
        put(x0, y + 1);
        put(x1, y + 1);
        L.color(x0 + 2, y + 1, '#f8fbff', P.GLASS);
      }
      put(30, y);
      put(31, y - 1);
      put(32, y - 1);
      put(33, y);
      // cordão fininho: sai das hastes, desce rente ao rosto e some atrás do
      // maxilar a caminho da nuca (pontilhado, em dourado apagado, para não
      // parecer brinco comprido)
      const ch = '#b8964e';
      const chd = '#6a5028';
      const x0 = g.eyeLX - 2;
      for (let i = 0; i <= 9; i++) {
        const yy = y + 1 + i;
        const x = x0 - (i < 4 ? Math.floor(i / 2) : 2) + (i > 7 ? 1 : 0);
        if (i % 2 === 1) continue;
        put(x, yy, i % 4 ? chd : ch);
        put(63 - x, yy, i % 4 ? ch : chd);
      }
      return;
    }
    case 'sun_head': {
      // óculos escuros apoiados no topete
      const y = g.top - 3;
      const lensM = L.mat(['#07080a', '#0f1216', '#1a1f26', '#3a4656', '#7a8ea4']);
      for (const x0 of [22, 33]) {
        const lm = new Mask().ellipse(x0 + 4.5, y + 1.6, 4.6, 2.3);
        L.paint(lm, lensM, P.GLASS, (x, yy) => (yy <= y && x < x0 + 4 ? 3 : x > x0 + 6 ? 1 : 2));
        for (let yy = y - 1; yy <= y + 4; yy++) for (let x = x0; x <= x0 + 9; x++) if (lm.get(x, yy)) L.k[L.idx(x, yy)] = 1;
        L.color(x0 + 2, y + 1, '#c8d6e4', P.GLASS);
        L.color(x0 + 3, y, '#e8f0f8', P.GLASS);
      }
      put(31, y + 1, '#2a2e34');
      put(32, y + 1, '#2a2e34');
      put(21, y + 1, '#2a2e34');
      put(42, y + 1, '#2a2e34');
      return;
    }
  }
}

// -----------------------------------------------------------------------------
// Roupas
// -----------------------------------------------------------------------------
function drawClothes(L: Layer, g: Geo, l: Look, m: Mats): void {
  const tm = torsoMask(g);
  const R1 = clothRamp(l.c1);
  const c1 = L.mat(R1);
  const tone = (x: number, y: number) => torsoTone(g, x, y);
  const top = Math.ceil(shoulderY(g, 32));
  const neckL = 32 - g.neckHW;
  const neckR = 31 + g.neckHW;
  const skinAt = (x: number, y: number, t: number) => L.set(x, y, m.skin, t, P.NECK);
  // tronco inteiro na cor principal
  L.paint(tm, c1, P.BODY, tone);
  // dobras das axilas / braços
  const armL = (() => {
    for (let x = 0; x < 32; x++) if (shoulderY(g, x) < 64) return x;
    return 0;
  })();
  const fold = (x: number, y0: number, y1: number, d = -1) => {
    for (let y = y0; y <= y1; y++) L.shift(x, y, d, P.BODY);
  };
  const armFoldL = armL + (g.body === 'M' ? 6 : 5);
  const armFoldR = 63 - armFoldL;
  fold(armFoldL, 57, 63);
  fold(armFoldR, 56, 63, -1);
  void neckR;
  void skinAt;
  switch (l.clothes) {
    case 'scrubs': {
      // decote em V com debrum
      const v = new Mask();
      for (let y = top - 1; y <= top + 9; y++) {
        const k = y - (top - 1);
        const hw = Math.max(0, 6 - Math.floor(k * 0.62));
        v.hl(32 - hw, 31 + hw, y);
      }
      L.paint(v, m.skin, P.NECK, (x, y) => (y < top + 2 ? 0 : x < 31 ? 2 : 1));
      const trim = L.mat(clothRamp(adjust(l.c1, -0.06, 1.05)));
      for (let y = top - 1; y <= top + 10; y++) {
        const k = y - (top - 1);
        const hw = Math.max(0, 6 - Math.floor(k * 0.62));
        const xl = 32 - hw - 1;
        const xr = 31 + hw + 1;
        L.set(xl, y, trim, 3, P.BODY);
        L.set(xl - 1, y, trim, 2, P.BODY);
        L.set(xr, y, trim, 1, P.BODY);
        L.set(xr + 1, y, trim, 1, P.BODY);
      }
      // bolso no peito (lado esquerdo do personagem = direita da tela)
      for (let x = 40; x <= 47; x++) L.shift(x, 56, -1, P.BODY);
      for (let y = 56; y <= 63; y++) {
        L.shift(40, y, -1, P.BODY);
        L.shift(47, y, -1, P.BODY);
      }
      if (l.acc?.includes('pocket_pen')) {
        L.color(42, 53, '#2a5aa0', P.ACC);
        L.color(42, 54, '#2a5aa0', P.ACC);
        L.color(42, 55, '#e6efd9', P.ACC);
        L.color(44, 54, '#c8302a', P.ACC);
        L.color(44, 55, '#e6efd9', P.ACC);
      }
      return;
    }
    case 'blouse': {
      // decote redondo
      const v = new Mask().ellipse(32, top - 1, 8.5, 6).and(new Mask().rect(0, top - 2, 64, 10));
      L.paint(v, m.skin, P.NECK, (x, y) => (y < top + 1 ? 0 : x < 30 ? 2 : 1));
      // debrum
      for (let x = 22; x <= 42; x++)
        for (let y = top - 1; y <= top + 6; y++) {
          if (L.part(x, y) !== P.BODY) continue;
          if (L.part(x, y - 1) === P.NECK || L.part(x - 1, y) === P.NECK || L.part(x + 1, y) === P.NECK) L.shift(x, y, x < 32 ? 1 : -1, P.BODY);
        }
      // franzido no decote
      for (const x of [25, 28, 35, 38]) fold(x, top + 4, top + 6);
      return;
    }
    case 'shirt': {
      // camisa de botão de colarinho aberto (sem gravata), carcela e botões
      const collar = L.mat(clothRamp(adjust(l.c1, 0.1, 0.95)));
      const v = new Mask().poly([
        [26.5, top - 2],
        [37.5, top - 2],
        [32, top + 5],
      ]);
      L.paint(v, m.skin, P.NECK, (x) => (x < 30 ? 1 : 0));
      L.paint(
        new Mask().poly([
          [24, top - 3],
          [32, top + 6],
          [28, top + 7],
          [22, top],
        ]),
        collar,
        P.BODY,
        () => 3,
      );
      L.paint(
        new Mask().poly([
          [40, top - 3],
          [42, top],
          [36, top + 7],
          [32, top + 6],
        ]),
        collar,
        P.BODY,
        () => 1,
      );
      for (let y = top + 7; y < 64; y++) L.shift(32, y, -1, P.BODY);
      for (let y = top + 9; y < 64; y += 4) L.color(33, y, '#efe6cf', P.ACC);
      return;
    }
    case 'stripes': {
      const c2 = L.mat(clothRamp(l.c2 ?? '#e9e2cf'));
      for (let y = top + 2; y < 64; y++)
        for (let x = 0; x < 64; x++) {
          if (L.part(x, y) !== P.BODY) continue;
          if ((y - top) % 4 === 2 || (y - top) % 4 === 3) L.set(x, y, c2, L.toneAt(x, y), P.BODY);
        }
      // gola careca
      const v = new Mask().ellipse(32, top - 1, 6.5, 3.6);
      L.paint(v, m.skin, P.NECK, (x) => (x < 30 ? 1 : 0));
      const rib = L.mat(clothRamp(adjust(l.c1, -0.05)));
      for (let x = 23; x <= 40; x++)
        for (let y = top - 2; y <= top + 3; y++) {
          if (L.part(x, y) !== P.BODY) continue;
          if (L.part(x, y - 1) === P.NECK || L.part(x, y - 2) === P.NECK) L.set(x, y, rib, x < 30 ? 2 : 1, P.BODY);
        }
      return;
    }
    case 'floral': {
      // casaquinho lilás florido sobre blusa creme com gola
      const blouse = L.mat(clothRamp('#efe6cf'));
      const front = new Mask().poly([
        [26, top - 1],
        [38, top - 1],
        [36, 64],
        [28, 64],
      ]);
      L.paint(front, blouse, P.BODY, (x, y) => (x > 33 ? 1 : 2));
      const v = new Mask().ellipse(32, top - 1, 5.5, 3.5);
      L.paint(v, m.skin, P.NECK, (x) => (x < 30 ? 1 : 0));
      // gola redonda (bico)
      const col = L.mat(clothRamp('#f6f2e8'));
      const collar = new Mask().ellipse(28.5, top + 1.5, 4, 2.5).ellipse(35.5, top + 1.5, 4, 2.5);
      collar.sub(v);
      L.paint(collar, col, P.BODY, (x, y) => (x < 32 ? (y < top + 1 ? 3 : 2) : 1));
      // botões
      for (let y = top + 5; y < 64; y += 3) L.color(32, y, '#c8b890', P.ACC);
      // flores no casaquinho: cruzinhas (pétalas + miolo) em grade alternada
      const petal = ['#f0b4cc', '#f6ecdc', '#b8d8ee'];
      for (let gy = top - 1, row = 0; gy < 66; gy += 5, row++)
        for (let gx = (row % 2) * 3; gx < 66; gx += 6) {
          const fx = gx + Math.floor(hash2(gx, gy, 5) * 2);
          const fy = gy + Math.floor(hash2(gx, gy, 6) * 2);
          if (L.matAt(fx, fy) !== c1 || L.part(fx, fy) !== P.BODY) continue;
          const pc = petal[Math.floor(hash2(gx, gy, 7) * petal.length)];
          const shadeSide = fx > 40;
          const pcol = shadeSide ? adjust(pc, -0.14, 0.9) : pc;
          for (const [dx, dy] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ] as [number, number][])
            if (L.matAt(fx + dx, fy + dy) === c1) L.color(fx + dx, fy + dy, pcol, P.BODY);
          L.color(fx, fy, shadeSide ? '#c8a03a' : '#f2d45c', P.BODY);
        }
      // borda do casaquinho
      for (let y = top; y < 64; y++) {
        L.shift(27 - Math.floor((y - top) / 9), y, -1, P.BODY);
        L.shift(37 + Math.floor((y - top) / 9), y, -1, P.BODY);
      }
      return;
    }
    case 'cardigan_top':
    case 'cardigan': {
      const innerHex = l.clothes === 'cardigan_top' ? l.c2 ?? '#1d2224' : l.c2 ?? '#efe6cf';
      const inner = L.mat(clothRamp(innerHex));
      const front = new Mask().poly([
        [24.5, top - 1],
        [39.5, top - 1],
        [37, 64],
        [27, 64],
      ]);
      L.paint(front, inner, P.BODY, (x, y) => (x > 34 ? 1 : y < top + 3 ? 1 : 2));
      const v = new Mask().ellipse(32, top - 1.5, l.clothes === 'cardigan' ? 5.5 : 7, l.clothes === 'cardigan' ? 3 : 4.5);
      L.paint(v, m.skin, P.NECK, (x, y) => (y < top ? 0 : x < 30 ? 2 : 1));
      // bordas do cardigã (faixa de malha)
      for (let y = top - 1; y < 64; y++) {
        const k = (y - top) / 30;
        const xl = Math.round(24.5 + k * 2.5);
        const xr = Math.round(39.5 - k * 2.5);
        L.set(xl - 1, y, c1, 3, P.BODY);
        L.set(xl, y, c1, 2, P.BODY);
        L.set(xr, y, c1, 1, P.BODY);
        L.set(xr + 1, y, c1, 1, P.BODY);
      }
      // tricô: pontos
      for (let y = top; y < 64; y++)
        for (let x = 0; x < 64; x++)
          if (L.matAt(x, y) === c1 && L.part(x, y) === P.BODY && (x + (y % 2) * 2) % 4 === 0 && y % 2 === 0) L.shift(x, y, -1, P.BODY);
      if (l.clothes === 'cardigan') for (let y = top + 4; y < 64; y += 4) L.color(Math.round(25 + ((y - top) / 30) * 2.5) - 1, y, '#efe6cf', P.ACC);
      return;
    }
    case 'shirt_tie': {
      // gola branca-azulada, gravata, bolso; mangas curtas com braço
      const collar = L.mat(clothRamp('#e8f0f6'));
      const cm = new Mask().poly([
        [24, top - 2],
        [31, top + 4],
        [33, top + 4],
        [40, top - 2],
        [41, top + 1],
        [34, top + 6],
        [30, top + 6],
        [23, top + 1],
      ]);
      const v = new Mask().poly([
        [25.5, top - 2],
        [38.5, top - 2],
        [32, top + 3],
      ]);
      L.paint(v, m.skin, P.NECK, (x) => (x < 30 ? 1 : 0));
      cm.sub(v);
      L.paint(cm, collar, P.BODY, (x, y) => (x < 30 ? (y < top + 2 ? 3 : 2) : 1));
      // gravata
      const tie = L.mat(clothRamp(l.c2 ?? '#7a2a2e'));
      const tm2 = new Mask().poly([
        [30.5, top + 2],
        [33.5, top + 2],
        [33, top + 5],
        [34.5, 62],
        [32, 64],
        [29.5, 62],
        [31, top + 5],
      ]);
      L.paint(tm2, tie, P.BODY, (x, y) => (y <= top + 4 ? (x < 32 ? 2 : 1) : x < 31 ? 3 : x > 32 ? 1 : 2));
      // listras diagonais na gravata
      for (let y = top + 6; y < 64; y++) for (let x = 29; x <= 35; x++) if (L.matAt(x, y) === tie && (x + y) % 4 === 0) L.shift(x, y, -1, P.BODY);
      // bolso
      for (let x = 19; x <= 25; x++) L.shift(x, 55, -1, P.BODY);
      for (let y = 55; y <= 61; y++) {
        L.shift(19, y, -1, P.BODY);
        L.shift(25, y, -1, P.BODY);
      }
      L.color(21, 54, '#3a5a9a', P.ACC);
      L.color(21, 55, '#3a5a9a', P.ACC);
      // mangas curtas: braços à mostra nas pontas
      for (let y = 60; y < 64; y++)
        for (let x = 0; x < 64; x++) {
          const d = Math.abs(x + 0.5 - 32);
          const edge = g.shoulder[g.shoulder.length - 2][0];
          if (d > edge - 2.5 && L.part(x, y) === P.BODY) L.set(x, y, m.skin, x < 32 ? 2 : 1, P.NECK);
        }
      return;
    }
    case 'coat_open':
    case 'coat': {
      const open = l.clothes === 'coat_open';
      const innerHex = l.c2 ?? '#2a3036';
      const inner = L.mat(clothRamp(innerHex));
      const front = new Mask().poly(
        open
          ? [
              [23, top - 1],
              [41, top - 1],
              [38, 64],
              [26, 64],
            ]
          : [
              [26, top - 1],
              [38, top - 1],
              [32.5, top + 9],
              [31.5, top + 9],
            ],
      );
      L.paint(front, inner, P.BODY, (x, y) => (x > 33 ? 1 : y < top + 3 ? 1 : 2));
      const v = new Mask().ellipse(32, top - 1.5, 6, 3.5);
      L.paint(v, m.skin, P.NECK, (x, y) => (y < top ? 0 : x < 30 ? 2 : 1));
      // lapelas
      const lap = (pts: [number, number][], tt: number) => L.paint(new Mask().poly(pts), c1, P.BODY, () => tt);
      if (open) {
        lap(
          [
            [21, top - 2],
            [24, top - 2],
            [27, top + 10],
            [25, top + 14],
          ],
          3,
        );
        lap(
          [
            [40, top - 2],
            [43, top - 2],
            [39, top + 14],
            [37, top + 10],
          ],
          1,
        );
        for (let y = top + 4; y < 64; y++) {
          L.shift(25 + Math.floor((y - top) / 12), y, -2, P.BODY);
          L.shift(38 - Math.floor((y - top) / 12), y, -1, P.BODY);
        }
      } else {
        lap(
          [
            [24, top - 2],
            [27, top - 2],
            [31.5, top + 9],
            [29, top + 12],
          ],
          3,
        );
        lap(
          [
            [37, top - 2],
            [40, top - 2],
            [35, top + 12],
            [32.5, top + 9],
          ],
          1,
        );
        for (let y = top + 10; y < 64; y++) L.shift(32, y, -1, P.BODY);
        L.color(31, top + 14, '#c8ccc8', P.ACC);
        L.color(31, top + 19, '#c8ccc8', P.ACC);
      }
      // bolso com canetas
      for (let x = 41; x <= 48; x++) L.shift(x, 57, -1, P.BODY);
      L.color(43, 55, '#2a5aa0', P.ACC);
      L.color(43, 56, '#2a5aa0', P.ACC);
      L.color(45, 55, '#c8302a', P.ACC);
      L.color(45, 56, '#c8302a', P.ACC);
      return;
    }
    case 'samu': {
      // gola alta, zíper, faixas refletivas e emblema
      const v = new Mask().ellipse(32, top - 1.5, 6.5, 3);
      L.paint(v, m.skin, P.NECK, (x) => (x < 30 ? 1 : 0));
      for (let x = 22; x <= 41; x++)
        for (let y = top - 3; y <= top + 1; y++) {
          if (L.part(x, y) !== P.BODY) continue;
          if (L.part(x, y - 1) === P.NECK || L.part(x, y - 2) === P.NECK || y <= top - 1) L.shift(x, y, x < 30 ? 0 : -1, P.BODY);
        }
      const refl = L.mat(ramp('#d8dcd8', { dl: [-0.3, -0.16, 0.05, 0.1], ck: [1, 1, 1, 1] }));
      for (const y0 of [58, 59, 60]) for (let x = 0; x < 64; x++) if (L.part(x, y0) === P.BODY) L.set(x, y0, refl, y0 === 58 ? 3 : y0 === 59 ? 2 : 1, P.BODY);
      for (let y = top + 1; y < 64; y++) if (y < 58 || y > 60) L.shift(32, y, -2, P.BODY);
      // emblema (estrela da vida) no peito, lado esquerdo do personagem
      const ex0 = 41;
      const ey0 = 51;
      L.color(ex0 + 1, ey0, '#eef0ea', P.ACC);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) L.color(ex0 + i - 1, ey0 + j, '#eef0ea', P.ACC);
      const red = '#d63a30';
      for (const [dx, dy] of [
        [1, 0],
        [1, 1],
        [0, 1],
        [2, 1],
        [-1, 2],
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
        [1, 3],
        [0, 3],
        [2, 3],
        [1, 4],
      ] as [number, number][])
        L.color(ex0 + dx, ey0 + dy, red, P.ACC);
      return;
    }
    case 'jacket': {
      const tee = L.mat(clothRamp(l.c2 ?? '#e6e1d4'));
      const front = new Mask().poly([
        [25, top - 1],
        [39, top - 1],
        [38, 64],
        [26, 64],
      ]);
      L.paint(front, tee, P.BODY, (x, y) => (x > 34 ? 1 : 2));
      const v = new Mask().ellipse(32, top - 1.5, 5.5, 3.2);
      L.paint(v, m.skin, P.NECK, (x, y) => (y < top ? 0 : x < 30 ? 2 : 1));
      // gola levantada da jaqueta
      L.paint(
        new Mask().poly([
          [20, top - 4],
          [25, top - 3],
          [27, top + 4],
          [23, top + 6],
        ]),
        c1,
        P.BODY,
        () => 3,
      );
      L.paint(
        new Mask().poly([
          [39, top - 3],
          [44, top - 4],
          [41, top + 6],
          [37, top + 4],
        ]),
        c1,
        P.BODY,
        () => 1,
      );
      for (let y = top + 5; y < 64; y++) {
        L.shift(25, y, -2, P.BODY);
        L.shift(38, y, -1, P.BODY);
      }
      // bolsos com lapela
      for (let x = 12; x <= 19; x++) L.shift(x, 58, -1, P.BODY);
      for (let x = 45; x <= 52; x++) L.shift(x, 58, -1, P.BODY);
      L.color(15, 59, '#c8c0a0', P.ACC);
      L.color(48, 59, '#a8a080', P.ACC);
      return;
    }
    case 'suit':
    case 'suit_slim': {
      const slim = l.clothes === 'suit_slim';
      const shirt = L.mat(clothRamp('#eef0ec'));
      const front = new Mask().poly([
        [25.5, top - 2],
        [38.5, top - 2],
        [33, 64],
        [31, 64],
      ]);
      L.paint(front, shirt, P.BODY, (x) => (x > 33 ? 1 : 2));
      const v = new Mask().poly([
        [27, top - 2],
        [37, top - 2],
        [32, top + 2],
      ]);
      L.paint(v, m.skin, P.NECK, (x) => (x < 30 ? 1 : 0));
      // gravata
      const tieHex = slim ? l.c2 ?? '#1b2028' : l.c2 ?? '#9a2a2e';
      const tie = L.mat(clothRamp(tieHex));
      L.paint(
        new Mask().poly([
          [30.5, top + 1],
          [33.5, top + 1],
          [33, top + 4],
          [34, 64],
          [30, 64],
          [31, top + 4],
        ]),
        tie,
        P.BODY,
        (x, y) => (y <= top + 3 ? (x < 32 ? 2 : 1) : x < 31 ? 3 : x > 32 ? 1 : 2),
      );
      // lapelas do paletó
      L.paint(
        new Mask().poly([
          [22, top - 3],
          [26, top - 2],
          [31, top + 12],
          [29, 64],
          [26, top + 12],
        ]),
        c1,
        P.BODY,
        () => 3,
      );
      L.paint(
        new Mask().poly([
          [38, top - 2],
          [42, top - 3],
          [38, top + 12],
          [35, 64],
          [33, top + 12],
        ]),
        c1,
        P.BODY,
        () => 1,
      );
      for (let y = top + 6; y < 64; y++) {
        L.shift(29 - Math.floor((y - top - 6) / 8), y, -2, P.BODY);
        L.shift(35 + Math.floor((y - top - 6) / 8), y, -1, P.BODY);
      }
      if (!slim) {
        // lenço no bolso
        L.color(43, 55, '#f4f0e6', P.ACC);
        L.color(44, 54, '#f4f0e6', P.ACC);
        L.color(45, 55, '#d8d0c0', P.ACC);
        for (let x = 41; x <= 47; x++) L.shift(x, 56, -1, P.BODY);
      }
      return;
    }
    case 'overalls': {
      const shirt = L.mat(clothRamp(l.c2 ?? '#2e3a4e'));
      for (let y = top - 2; y < 64; y++) for (let x = 0; x < 64; x++) if (L.part(x, y) === P.BODY) L.set(x, y, shirt, L.toneAt(x, y), P.BODY);
      const v = new Mask().ellipse(32, top - 1.5, 6.5, 3);
      L.paint(v, m.skin, P.NECK, (x) => (x < 30 ? 1 : 0));
      // gola da camisa
      L.paint(
        new Mask().poly([
          [24, top - 2],
          [29, top + 3],
          [26, top + 4],
          [22, top],
        ]),
        shirt,
        P.BODY,
        () => 3,
      );
      L.paint(
        new Mask().poly([
          [40, top - 2],
          [42, top],
          [38, top + 4],
          [35, top + 3],
        ]),
        shirt,
        P.BODY,
        () => 1,
      );
      // peitilho e alças
      const bib = new Mask().rect(22, 55, 20, 9);
      L.paint(bib, c1, P.BODY, (x, y) => (y === 55 ? 3 : x > 38 ? 1 : 2));
      for (let y = top; y <= 55; y++) {
        const k = (y - top) / Math.max(1, 55 - top);
        const xl = Math.round(17 + k * 5);
        const xr = Math.round(46 - k * 5);
        L.set(xl, y, c1, 3, P.BODY);
        L.set(xl + 1, y, c1, 2, P.BODY);
        L.set(xl + 2, y, c1, 2, P.BODY);
        L.set(xr, y, c1, 1, P.BODY);
        L.set(xr - 1, y, c1, 1, P.BODY);
        L.set(xr - 2, y, c1, 2, P.BODY);
      }
      L.color(23, 56, '#d8d0b0', P.ACC);
      L.color(40, 56, '#b8b090', P.ACC);
      for (let x = 28; x <= 35; x++) L.shift(x, 58, -1, P.BODY);
      for (let y = 58; y <= 63; y++) {
        L.shift(28, y, -1, P.BODY);
        L.shift(35, y, -1, P.BODY);
      }
      return;
    }
    case 'hoodie': {
      // capuz embolado em volta do pescoço
      const hood = new Mask().ellipse(32, top + 0.5, 15, 4.5);
      L.paint(hood, c1, P.BODY, (x, y) => {
        const u = (x + 0.5 - 32) / 15;
        return y < top - 1 ? (u < 0 ? 3 : 2) : u < -0.3 ? 2 : u > 0.4 ? 0 : 1;
      });
      const v = new Mask().ellipse(32, top - 1, 6.5, 3);
      L.paint(v, m.skin, P.NECK, (x) => (x < 30 ? 1 : 0));
      for (let x = 24; x <= 40; x++) if (L.part(x, top + 2) === P.BODY) L.tone(x, top + 2, 0);
      // cordões
      const cord = l.c2 ?? '#e6e1d4';
      for (let y = top + 3; y <= top + 11; y++) {
        L.color(28, y, y === top + 11 ? adjust(cord, -0.2) : cord, P.ACC);
        L.color(36, y, y === top + 11 ? adjust(cord, -0.25) : adjust(cord, -0.12), P.ACC);
      }
      // bolso canguru
      for (let x = 20; x <= 43; x++) L.shift(x, 61, -1, P.BODY);
      L.shift(20, 62, -1, P.BODY);
      L.shift(43, 62, -1, P.BODY);
      return;
    }
    case 'vest': {
      const shirt = L.mat(clothRamp(l.c2 ?? '#ddd8cc'));
      for (let y = top - 2; y < 64; y++)
        for (let x = 0; x < 64; x++) {
          if (L.part(x, y) !== P.BODY) continue;
          const d = Math.abs(x + 0.5 - 32);
          const vestHalf = 17 - Math.max(0, (y - 54) * 0.3);
          const inV = d < Math.max(0, (y - top) * 0.6);
          if (d > vestHalf || (y < top + 12 && d < 7 - (y - top) * 0.55)) L.set(x, y, shirt, L.toneAt(x, y), P.BODY);
          void inV;
        }
      const v = new Mask().poly([
        [26.5, top - 2],
        [37.5, top - 2],
        [32, top + 3],
      ]);
      L.paint(v, m.skin, P.NECK, (x) => (x < 30 ? 1 : 0));
      L.paint(
        new Mask().poly([
          [24, top - 2],
          [30, top + 4],
          [27, top + 5],
          [22, top],
        ]),
        shirt,
        P.BODY,
        () => 3,
      );
      L.paint(
        new Mask().poly([
          [40, top - 2],
          [42, top],
          [37, top + 5],
          [34, top + 4],
        ]),
        shirt,
        P.BODY,
        () => 1,
      );
      for (let y = top + 12; y < 64; y += 3) L.color(32, y, '#3a2a1a', P.ACC);
      // textura do colete
      for (let y = top; y < 64; y++) for (let x = 0; x < 64; x++) if (L.matAt(x, y) === c1 && (x + y * 3) % 7 === 0) L.shift(x, y, -1, P.BODY);
      return;
    }
    case 'tee': {
      const v = new Mask().ellipse(32, top - 1, 7, 3.8);
      L.paint(v, m.skin, P.NECK, (x) => (x < 30 ? 1 : 0));
      for (let x = 23; x <= 40; x++)
        for (let y = top - 2; y <= top + 3; y++) {
          if (L.part(x, y) !== P.BODY) continue;
          if (L.part(x, y - 1) === P.NECK) L.shift(x, y, x < 31 ? 1 : -1, P.BODY);
        }
      fold(20, 58, 63);
      fold(43, 57, 63);
      return;
    }
    case 'plaid': {
      const line = L.mat(clothRamp(l.c2 ?? '#5a2418'));
      const light = L.mat(clothRamp(adjust(l.c1, 0.12, 0.9)));
      for (let y = top - 2; y < 64; y++)
        for (let x = 0; x < 64; x++) {
          if (L.part(x, y) !== P.BODY) continue;
          const tt = L.toneAt(x, y);
          const gx = (x + 64) % 6;
          const gy = (y + 64) % 6;
          if (gx === 0 || gy === 0) L.set(x, y, line, tt, P.BODY);
          if (gx === 0 && gy === 0) L.set(x, y, line, Math.max(0, tt - 1), P.BODY);
          if (gx === 3 && gy === 3) L.set(x, y, light, tt, P.BODY);
        }
      const v = new Mask().poly([
        [26.5, top - 2],
        [37.5, top - 2],
        [32, top + 4],
      ]);
      L.paint(v, m.skin, P.NECK, (x) => (x < 30 ? 1 : 0));
      const collar = L.mat(clothRamp(adjust(l.c1, -0.05)));
      L.paint(
        new Mask().poly([
          [24, top - 3],
          [31, top + 5],
          [27, top + 6],
          [22, top],
        ]),
        collar,
        P.BODY,
        () => 3,
      );
      L.paint(
        new Mask().poly([
          [40, top - 3],
          [42, top],
          [37, top + 6],
          [33, top + 5],
        ]),
        collar,
        P.BODY,
        () => 1,
      );
      for (let y = top + 7; y < 64; y += 4) L.color(32, y, '#d8c8b0', P.ACC);
      return;
    }
    case 'moto': {
      const red = L.mat(clothRamp(l.c2 ?? '#c0392b'));
      for (let y = top; y < 64; y++)
        for (let x = 0; x < 64; x++) {
          if (L.part(x, y) !== P.BODY) continue;
          const d = Math.abs(x + 0.5 - 32);
          if (d > 15 && d < 21) L.set(x, y, red, L.toneAt(x, y), P.BODY);
        }
      // gola alta
      const collar = new Mask().rect(24, top - 4, 16, 6);
      L.paint(collar, c1, P.BODY, (x, y) => (y === top - 4 ? 3 : x < 28 ? 2 : x > 36 ? 0 : 1));
      // zíper
      for (let y = top - 4; y < 64; y++) L.color(32, y, y % 2 ? '#9aa0a4' : '#6a7074', P.ACC);
      // refletivo
      const refl = L.mat(ramp('#d0d6d4', { dl: [-0.3, -0.16, 0.05, 0.1] }));
      for (let x = 0; x < 64; x++) if (L.matAt(x, 59) === red) L.set(x, 59, refl, x < 32 ? 3 : 2, P.BODY);
      return;
    }
  }
}

// -----------------------------------------------------------------------------
// Acessórios
// -----------------------------------------------------------------------------
function drawAccessories(L: Layer, g: Geo, l: Look, m: Mats): void {
  const acc = l.acc ?? [];
  const top = Math.ceil(shoulderY(g, 32));
  const earX = (side: -1 | 1) => (side < 0 ? 32 - hwAt(g, g.earY0 + 2) - 2 : 31 + hwAt(g, g.earY0 + 2) + 2);
  if (acc.includes('earrings')) {
    const gold = ['#7a5418', '#a8802a', '#e0b444', '#f4d470', '#fff0b0'];
    const gm = L.mat(gold);
    for (const side of [-1, 1] as const) {
      const cx = earX(side) + (side < 0 ? -0.5 : 0.5);
      const cy = g.earY1 + 4;
      for (let y = Math.floor(cy - 4); y <= Math.ceil(cy + 4); y++)
        for (let x = Math.floor(cx - 4); x <= Math.ceil(cx + 4); x++) {
          const d = Math.hypot((x + 0.5 - cx) / 2.6, (y + 0.5 - cy) / 3.2);
          if (d <= 1 && d > 0.62) L.set(x, y, gm, y < cy ? (x < cx ? 4 : 3) : x < cx ? 2 : 1, P.ACC, 1);
        }
    }
  }
  if (acc.includes('studs')) {
    for (const side of [-1, 1] as const) {
      const x = earX(side) + (side < 0 ? 0 : 0);
      L.color(x, g.earY1, side < 0 ? '#f4ecd8' : '#c8bca0', P.ACC);
    }
  }
  if (acc.includes('necklace')) {
    for (let i = 0; i <= 14; i++) {
      const tt = i / 14;
      const x = Math.round(25 + tt * 14);
      const y = Math.round(top - 1 + Math.sin(tt * Math.PI) * 4);
      if (i % 2 === 0) L.color(x, y, x < 32 ? '#fbf6ea' : '#d8d0c0', P.ACC);
    }
    L.color(32, top + 4, '#e0bc50', P.ACC);
  }
  if (acc.includes('tape')) {
    // fita métrica no pescoço: passa por trás e cai dos dois lados do peito
    const tm = L.mat(['#7a5a10', '#b88a1a', '#e8c84a', '#f6dc78', '#fff0b0']);
    const y0 = g.chin + 2;
    for (const side of [-1, 1] as const) {
      for (let y = y0; y < 64; y++) {
        const k = (y - y0) / (64 - y0);
        const xin = Math.round(32 + side * (g.neckHW + 0.5 + k * 3.5)) - (side > 0 ? 1 : 0);
        L.set(xin, y, tm, side < 0 ? 3 : 2, P.ACC, 1);
        L.set(xin + side, y, tm, side < 0 ? 2 : 1, P.ACC, 1);
        if (y % 2 === 0) L.color(xin + side, y, '#4a3410', P.ACC);
      }
    }
    // ponta metálica
    const tipX = Math.round(32 - (g.neckHW + 4)) - 1;
    L.color(tipX, 62, '#c8ccd0', P.ACC);
    L.color(tipX + 1, 62, '#8a9094', P.ACC);
    L.color(tipX, 63, '#8a9094', P.ACC);
    L.color(tipX + 1, 63, '#5a6064', P.ACC);
  }
  if (acc.includes('lanyard')) {
    const blue = '#3a6ab0';
    for (let y = top - 2; y <= 56; y++) {
      const k = (y - top + 2) / (58 - top);
      L.color(Math.round(26 - k * 1.5), y, blue, P.ACC);
      L.color(Math.round(38 + k * 1.5), y, adjust(blue, -0.1), P.ACC);
    }
    const card = L.mat(clothRamp('#efe6cf'));
    const cm = new Mask().rect(27, 56, 11, 8);
    L.paint(cm, card, P.ACC, (x, y) => (y === 56 ? 3 : x > 35 ? 1 : 2));
    for (let x = 27; x <= 37; x++) L.color(x, 57, blue, P.ACC);
    L.color(29, 59, '#5f7a6c', P.ACC);
    L.color(30, 59, '#5f7a6c', P.ACC);
    L.color(29, 60, '#5f7a6c', P.ACC);
    L.color(30, 60, '#5f7a6c', P.ACC);
    for (let x = 32; x <= 36; x++) L.color(x, 60, '#a8a090', P.ACC);
  }
  if (acc.includes('stetho')) {
    const tube = L.mat(['#0e1012', '#1a1d20', '#2a2e32', '#454b50', '#6a7278']);
    const pts: [number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const tt = i / 24;
      const a = Math.PI * (0.05 + tt * 0.9);
      pts.push([32 - Math.cos(a) * 12.5, top - 3 + Math.sin(a) * 12]);
    }
    for (const [x, y] of pts) L.set(Math.round(x), Math.round(y), tube, Math.round(x) < 32 ? 3 : 1, P.ACC, 1);
    // pontas descendo
    for (let y = top - 3; y <= top + 2; y++) {
      L.set(19, y, tube, 3, P.ACC, 1);
      L.set(44, y, tube, 1, P.ACC, 1);
    }
    // campânula
    const bell = L.mat(['#4a5050', '#7a8484', '#b4bcbc', '#dce4e4', '#ffffff']);
    const bm = new Mask().ellipse(44.5, top + 4.5, 2.6, 2.4);
    L.paint(bm, bell, P.ACC, (x, y) => (x < 44 && y < top + 4 ? 4 : x > 45 ? 1 : 2));
    for (let x = 43; x <= 46; x++) for (let y = top + 3; y <= top + 6; y++) if (bm.get(x, y)) L.k[L.idx(x, y)] = 1;
  }
  if (acc.includes('badge')) {
    const card = L.mat(clothRamp('#eef2ee'));
    L.color(43, 51, '#8a9494', P.ACC);
    L.color(43, 52, '#6a7474', P.ACC);
    L.paint(new Mask().rect(40, 53, 8, 10), card, P.ACC, (x, y) => (y === 53 ? 3 : x > 45 ? 1 : 2));
    for (let x = 40; x <= 47; x++) L.color(x, 54, '#2f8f86', P.ACC);
    for (let x = 41; x <= 42; x++) for (let y = 56; y <= 58; y++) L.color(x, y, '#c4a890', P.ACC);
    for (let x = 44; x <= 46; x++) L.color(x, 57, '#9aa8a0', P.ACC);
    L.color(44, 59, '#9aa8a0', P.ACC);
    L.color(45, 59, '#9aa8a0', P.ACC);
    for (let y = 53; y <= 62; y++) L.k[L.idx(40, y)] = 1;
  }
  if (acc.includes('tiepin')) {
    for (let x = 30; x <= 34; x++) L.color(x, 56, x === 31 ? '#fff0a0' : x === 34 ? '#a8802a' : '#e8b931', P.ACC);
  }
  if (acc.includes('pen_ear')) {
    // caneta azul presa atrás da orelha: corpo em diagonal subindo para trás,
    // tampa com clipe em cima e a ponta saindo na frente da orelha
    const x0 = earX(1) - 2;
    const y0 = g.earY0 + 1;
    for (let i = 0; i < 9; i++) {
      const x = x0 + i;
      const yy = y0 - Math.floor(i * 0.6);
      L.color(x, yy, i === 0 ? '#2a2420' : i === 1 ? '#c8c4b8' : i < 6 ? '#2f5ab8' : '#e6e1d4', P.ACC);
      L.color(x, yy + 1, i === 0 ? '#2a2420' : i < 6 ? '#1c3878' : '#a8a498', P.ACC);
    }
    L.color(x0 + 8, y0 - 6, '#d8d4c8', P.ACC);
  }
  if (acc.includes('notebook')) {
    // mão segurando um bloquinho no canto
    const paper = L.mat(clothRamp('#f2ebd8'));
    L.paint(new Mask().rect(3, 52, 11, 12), paper, P.ACC, (x, y) => (y === 52 ? 3 : x > 11 ? 1 : 2));
    for (let x = 3; x <= 13; x++) L.color(x, 52, '#c8302a', P.ACC);
    for (let x = 4; x <= 12; x += 2) L.color(x, 51, '#8a9494', P.ACC);
    for (const y of [55, 57, 59, 61]) for (let x = 5; x <= 11; x++) if ((x + y) % 5 !== 0) L.color(x, y, '#9a9484', P.ACC);
    // dedos
    const sk = m.skin;
    L.paint(new Mask().rect(12, 55, 4, 7), sk, P.ACC, (x, y) => (y % 2 === 0 ? 1 : x < 14 ? 3 : 2));
    for (let y = 55; y <= 61; y++) L.k[L.idx(12, y)] = 1;
  }
  if (acc.includes('mask_chin')) {
    const mk = L.mat(clothRamp('#a8d0e4'));
    const mm = new Mask();
    for (let y = g.mouthY + 3; y <= g.chin + 2; y++) {
      const hw = Math.max(5, (hwAt(g, Math.min(y, g.chin)) || 6) - 1);
      mm.hl(32 - hw, 31 + hw, y);
    }
    L.paint(mm, mk, P.ACC, (x, y) => {
      const u = (x + 0.5 - 32) / 10;
      if ((y - g.mouthY) % 2 === 0) return u < 0 ? 2 : 1;
      return u < -0.3 ? 3 : u > 0.5 ? 1 : 2;
    });
    // elásticos até as orelhas
    for (let i = 0; i < 5; i++) {
      L.color(20 - i, g.mouthY + 2 - i, '#e8f0f4', P.ACC);
      L.color(43 + i, g.mouthY + 2 - i, '#c0ccd4', P.ACC);
    }
  }
  if (acc.includes('headset')) {
    const hs = L.mat(['#0a0c0e', '#14181b', '#22282c', '#3a4248', '#5a646a']);
    // arco
    for (let x = 15; x <= 48; x++) {
      const dx = (x + 0.5 - 32) / 17;
      const y = Math.round(g.eyeY - 1 - Math.sqrt(Math.max(0, 1 - dx * dx)) * 21);
      L.set(x, y, hs, x < 30 ? 3 : 2, P.ACC, 1);
      if (Math.abs(dx) > 0.85) L.set(x, y + 1, hs, 1, P.ACC, 1);
    }
    // concha esquerda (na orelha)
    const cup = new Mask().ellipse(15, g.earY0 + 4, 3.5, 5);
    L.paint(cup, hs, P.ACC, (x, y) => (x < 14 && y < g.earY0 + 4 ? 4 : x < 15 ? 3 : 1));
    for (let y = 0; y < 64; y++) for (let x = 10; x < 20; x++) if (cup.get(x, y)) L.k[L.idx(x, y)] = 1;
    // almofada direita
    const pad = new Mask().rect(47, g.earY0 + 1, 3, 6);
    L.paint(pad, hs, P.ACC, () => 1);
    // haste do microfone até a boca
    for (let i = 0; i <= 12; i++) {
      const tt = i / 12;
      const x = Math.round(16 + tt * 10);
      const y = Math.round(g.earY0 + 8 + tt * (g.mouthY - g.earY0 - 7) + Math.sin(tt * Math.PI) * 1.5);
      L.set(x, y, hs, 2, P.ACC, 1);
    }
    L.color(26, g.mouthY + 1, '#3a2a2a', P.ACC);
    L.color(27, g.mouthY + 1, '#5a3a3a', P.ACC);
    L.color(27, g.mouthY, '#2a1a1a', P.ACC);
  }
}

// -----------------------------------------------------------------------------
// Montagem
// -----------------------------------------------------------------------------
function render(id: CharacterId, mood: Mood, withBg: boolean): Pix {
  const l = CH[id];
  const g = geoFor(l);
  const L = new Layer(64, 64);
  const m = makeMats(L, l);
  const ex = expression(l, mood);
  drawHairBack(L, g, l, m);
  drawClothes(L, g, l, m);
  drawNeck(L, g, m);
  // roupa por cima do pescoço (gola)
  drawClothesOverNeck(L, g, l, m);
  drawEars(L, g, m, l);
  drawFaceBase(L, g, m);
  drawFeatures(L, g, l, m, mood, ex);
  drawMustache(L, g, l, m);
  drawHairFront(L, g, l, m);
  drawHat(L, g, l, m);
  castShadows(L);
  L.despeckle([P.FACE, P.HAIR, P.BACK, P.BODY, P.HAT, P.NECK], 2);
  drawGlasses(L, g, l);
  drawAccessories(L, g, l, m);
  skinMasks.set(`${id}|${mood}|${withBg ? 1 : 0}`, skinMask(L));
  const bg = withBg ? background(l.bg) : null;
  return compose(L, bg, { ink: BG_INK[l.bg], rim: BG_RIM[l.bg], rimK: 0.32, openBottom: true });
}

/** a gola é redesenhada depois do pescoço (o pescoço entra por baixo dela) */
function drawClothesOverNeck(L: Layer, g: Geo, l: Look, m: Mats): void {
  // o pescoço foi pintado por cima do tronco; recolocar o tronco onde o
  // pescoço passa abaixo do decote: refazendo as roupas numa camada auxiliar
  const aux = new Layer(64, 64);
  const am = makeMatsInto(aux, L, m);
  drawClothes(aux, g, l, am);
  for (let y = 40; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const i = aux.idx(x, y);
      if (!aux.m[i]) continue;
      if (L.part(x, y) !== P.NECK) continue;
      // o pescoço permanece só onde a roupa deixa pele à mostra
      if (aux.p[i] === P.NECK) continue;
      const mi = L.mat(aux.ramps[aux.m[i]]);
      L.set(x, y, mi, aux.t[i], aux.p[i], aux.k[i]);
    }
}

/** espelha os materiais base de uma camada noutra (mesmas rampas) */
function makeMatsInto(aux: Layer, src: Layer, m: Mats): Mats {
  const re = (id: number) => aux.mat(src.ramps[id]);
  return { ...m, skin: re(m.skin), blush: re(m.blush), circles: re(m.circles), stubble: re(m.stubble), hair: re(m.hair), flush: re(m.flush) };
}

/**
 * Desgaste no retrato: o fundo, o cabelo e a roupa seguem a gradação da casa
 * (homeGrader); a pele (rosto, orelhas, pescoço — máscara `skin`) usa gradeSkin,
 * contínua, para qualquer tom esfriar por igual.
 */
function gradePix(p: Pix, t: number, skin?: Uint8Array): Pix {
  if (t <= 0) return p;
  const g = homeGrader(t);
  const memo = new Map<number, number>();
  const memoS = new Map<number, number>();
  for (let i = 0; i < p.data.length; i++) {
    const v = p.data[i];
    if (!(v >>> 24)) continue;
    const isSkin = !!skin?.[i];
    const mm = isSkin ? memoS : memo;
    let o = mm.get(v);
    if (o === undefined) {
      const [r, gg, b, a] = unpackRgb(v);
      const src = rgbToHex(r, gg, b);
      const n = pack(isSkin ? gradeSkin(src, t) : g(src));
      o = ((n & 0x00ffffff) | (a << 24)) >>> 0;
      mm.set(v, o);
    }
    p.data[i] = o;
  }
  return p;
}

/** máscara (1 por pixel) das partes de pele de uma camada de retrato */
function skinMask(L: Layer): Uint8Array {
  const out = new Uint8Array(L.w * L.h);
  for (let i = 0; i < out.length; i++) {
    const part = L.p[i];
    if (part === P.FACE || part === P.NECK || part === P.EAR || part === P.FEAT) out[i] = 1;
  }
  return out;
}
const skinMasks = new Map<string, Uint8Array>();

const pixCache = new Map<string, Pix>();

/** Pix 64×64 do retrato (para compor em cenas/finais). Devolve uma cópia. */
export function portraitPix(id: CharacterId, mood: Mood = 'neutro', opts: { blend?: number; bg?: boolean } = {}): Pix {
  const blend = quantize(opts.blend ?? 0, 20);
  const bg = opts.bg !== false;
  const key = `${id}|${mood}|${bg ? 1 : 0}|${blend}`;
  let p = pixCache.get(key);
  if (!p) {
    const baseKey = `${id}|${mood}|${bg ? 1 : 0}|0`;
    let base = pixCache.get(baseKey);
    if (!base) {
      base = render(id, mood, bg);
      pixCache.set(baseKey, base);
    }
    p = blend > 0 ? gradePix(base.copy(), blend, skinMasks.get(`${id}|${mood}|${bg ? 1 : 0}`)) : base;
    pixCache.set(key, p);
  }
  return p.copy();
}

/** Miniatura 32×32 (redução 2:1 que preserva traços escuros), para crachás e afins. */
export function portraitThumbPix(id: CharacterId, mood: Mood = 'neutro', opts: { blend?: number; bg?: boolean } = {}): Pix {
  return downsample2(portraitPix(id, mood, opts));
}

/** redução 2:1 para pixel art: em cada bloco 2×2, prefere o tom mais escuro se for traço, senão a média */
export function downsample2(src: Pix): Pix {
  const out = new Pix(Math.floor(src.w / 2), Math.floor(src.h / 2));
  for (let y = 0; y < out.h; y++)
    for (let x = 0; x < out.w; x++) {
      const vs = [src.get(2 * x, 2 * y), src.get(2 * x + 1, 2 * y), src.get(2 * x, 2 * y + 1), src.get(2 * x + 1, 2 * y + 1)];
      const lum = vs.map((v) => (v >>> 24 ? (v & 255) * 0.3 + ((v >>> 8) & 255) * 0.59 + ((v >>> 16) & 255) * 0.11 : 999));
      const opaque = vs.filter((v) => v >>> 24);
      if (!opaque.length) continue;
      const minL = Math.min(...lum);
      const avg = lum.filter((l) => l < 999).reduce((a, b) => a + b, 0) / opaque.length;
      let pick: number;
      if (avg - minL > 60) pick = vs[lum.indexOf(minL)];
      else {
        let r = 0;
        let gg = 0;
        let b = 0;
        for (const v of opaque) {
          r += v & 255;
          gg += (v >>> 8) & 255;
          b += (v >>> 16) & 255;
        }
        const n = opaque.length;
        pick = ((255 << 24) | (Math.round(b / n) << 16) | (Math.round(gg / n) << 8) | Math.round(r / n)) >>> 0;
      }
      out.raw(x, y, pick);
    }
  return out;
}

const urlCache = new Map<string, string>();

/**
 * Retrato do personagem como dataURL PNG (nativo 64×64; size=128/192 amplia
 * por vizinho-mais-próximo). blend = Desgaste/100 (esfria a imagem).
 * Fora do navegador devolve ''.
 */
export function portrait(id: CharacterId, mood: Mood = 'neutro', opts: { blend?: number; size?: number; bg?: boolean } = {}): string {
  if (!hasDOM()) return '';
  const blend = quantize(opts.blend ?? 0, 20);
  const size = Math.max(64, Math.round((opts.size ?? 64) / 64) * 64);
  const key = `${id}|${mood}|${blend}|${size}|${opts.bg === false ? 0 : 1}`;
  let u = urlCache.get(key);
  if (!u) {
    u = portraitPix(id, mood, { blend, bg: opts.bg }).toDataURL(size / 64);
    urlCache.set(key, u);
  }
  return u;
}

/** id de personagem a partir do "who" das falas ('EU' resolve pelo gênero). */
export function characterFor(who: string, gender: 'M' | 'F' = 'M'): CharacterId | null {
  const w = who.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (w === 'EU') return gender === 'F' ? 'EU_F' : 'EU_M';
  // o cônjuge fala como LUCIA (id interno); com a protagonista mulher, é o Alex
  if (w === 'LUCIA' || w === 'ALEX') return gender === 'F' ? 'ALEX' : 'LUCIA';
  if (w === 'LIAM') return 'DAVI';
  if (w === 'ROSANGELA') return 'ROSANGELA';
  if ((CH as Record<string, Look>)[w]) return w as CharacterId;
  return null;
}

