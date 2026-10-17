// =============================================================================
// Videochamada: corpo inteiro de pessoas (paciente e figurantes) em pixel art.
//
// Esqueleto paramétrico por idade/sexo → partes rasterizadas numa camada de
// material + tom (o mesmo kit dos retratos: rampas com desvio de matiz, luz de
// cima-esquerda, contorno seletivo). Três vistas:
//   frente  — em pé, sentado, curvado, ajoelhado, agachado, encostado, parto…
//   cima    — deitado no chão visto pela câmera de quem filma (de barriga para
//             cima, caído, de lado, em convulsão, na cama): o rosto e o peito
//             continuam visíveis, que é onde estão os sinais;
//   costas  — de bruços, figurante de costas.
// Devolve o Pix da figura e os pontos úteis (cabeça, peito, barriga, mãos,
// ferimento) para a cena encaixar sinais, objetos e quem ajuda.
// Puro (sem DOM).
// =============================================================================
import { Pix, hash2 } from './pix';
import { Layer, compose, skinRamp, hairRamp, clothRamp, lit, mixLab, adjust, toLch } from './portraitKit';
import type { VideoAct, VideoGear, VideoHold, VideoPose, VideoSign, VideoWound } from '../../engine/types';
import type { Look } from './videoLook';

export type V2 = [number, number];

/** poses que o desenho conhece (as do paciente + as dos figurantes) */
export type FigPose =
  | VideoPose
  | 'rcp' // ajoelhado, braços esticados até o peito do paciente
  | 'ajoelhado_maos' // ajoelhado com as mãos num ponto (comprimir, segurar a cabeça, segurar a mão)
  | 'colo_adulto' // adulto sentado com bebê/criança no colo
  | 'sentado_chao'; // sentado no chão / meio-fio / degrau, joelhos para cima

export interface FigSpec {
  look: Look;
  pose: FigPose;
  signs?: VideoSign[];
  gear?: VideoGear[];
  wound?: VideoWound;
  act?: VideoAct;
  /** escala (1 = adulto de ~74 px em pé) */
  k: number;
  /** deitado: 1 = cabeça à esquerda; em pé: lado para onde olha/gira o tronco */
  dir: 1 | -1;
  /** quadro da animação (respiração, abalos, massagem) */
  phase: number;
  /** alvo das mãos (relativo à âncora, em px já na escala), para quem ajuda */
  reach?: V2;
  /** o que segura */
  hold?: VideoHold;
  /** olhar: -1 esquerda, 0 frente, 1 direita */
  gaze?: number;
}

export interface FigOut {
  pix: Pix;
  /** só antebraços e mãos de quem ajuda (vai por cima do paciente) */
  front?: Pix;
  /** posição da âncora dentro do Pix */
  ax: number;
  ay: number;
  /** pontos (relativos à âncora) */
  pts: Record<'head' | 'face' | 'mouth' | 'chest' | 'belly' | 'pelvis' | 'handL' | 'handR' | 'footL' | 'footR' | 'kneeL' | 'kneeR' | 'neck' | 'wound', V2>;
  /** raio da cabeça na tela */
  hr: number;
  /** a figura é horizontal (deitada) */
  lying: boolean;
}

// -----------------------------------------------------------------------------
// Medidas por idade e sexo (px em k = 1)
// -----------------------------------------------------------------------------
interface Dim {
  hrx: number;
  hry: number;
  neck: number;
  sh: number; // meia largura dos ombros
  waist: number;
  hip: number;
  torso: number; // ombro → quadril
  up: number; // braço
  fore: number; // antebraço
  ar0: number;
  ar1: number;
  hand: number;
  thigh: number;
  shin: number;
  lr0: number;
  lr1: number;
  foot: number;
  /** idoso curvado */
  stoop: number;
  /** barriga (idoso/adulto) */
  belly: number;
}

function dimFor(L: Look): Dim {
  const f = L.sex === 'F';
  // cabeça um pouco maior que o real (leitura em baixa resolução); ombros com caimento
  switch (L.age) {
    case 'bebe':
      // cabeça ~1/4 do corpo, sem pescoço, barriga redonda, braços e pernas curtos e gordinhos
      return { hrx: 5.6, hry: 5.6, neck: 0.2, sh: 4.6, waist: 5.2, hip: 5, torso: 9.5, up: 4, fore: 3.6, ar0: 2.1, ar1: 1.9, hand: 1.6, thigh: 4.4, shin: 4, lr0: 2.7, lr1: 2.2, foot: 2.4, stoop: 0, belly: 1.4 };
    case 'crianca':
      // cabeça grande para o corpo, ombros estreitos, sem cintura, pernas curtas
      return { hrx: 5.5, hry: 6, neck: 0.9, sh: 5.8, waist: 5.4, hip: 5.4, torso: 13.5, up: 7.2, fore: 6.6, ar0: 1.8, ar1: 1.6, hand: 1.6, thigh: 10, shin: 9.5, lr0: 2.5, lr1: 1.9, foot: 3.6, stoop: 0, belly: 0.4 };
    case 'adolescente':
      return f
        ? { hrx: 5.1, hry: 6.1, neck: 1.8, sh: 7.2, waist: 5.6, hip: 7.6, torso: 22, up: 11, fore: 10, ar0: 1.9, ar1: 1.6, hand: 1.7, thigh: 16, shin: 15, lr0: 3.2, lr1: 2.1, foot: 4.4, stoop: 0, belly: 0 }
        : { hrx: 5.3, hry: 6.3, neck: 2, sh: 8.2, waist: 6.6, hip: 7, torso: 23.5, up: 11.5, fore: 11, ar0: 2.1, ar1: 1.8, hand: 1.9, thigh: 16.5, shin: 15.5, lr0: 3.2, lr1: 2.2, foot: 5, stoop: 0, belly: 0 };
    case 'idoso':
      return f
        ? { hrx: 5.3, hry: 6.3, neck: 1.6, sh: 7.8, waist: 7.4, hip: 8.8, torso: 22.5, up: 11, fore: 10, ar0: 2.1, ar1: 1.8, hand: 1.8, thigh: 15, shin: 14.5, lr0: 3.5, lr1: 2.3, foot: 4.5, stoop: 1.6, belly: 1.5 }
        : { hrx: 5.5, hry: 6.5, neck: 1.8, sh: 8.8, waist: 8, hip: 7.8, torso: 24, up: 12, fore: 11, ar0: 2.3, ar1: 1.9, hand: 2, thigh: 15.5, shin: 15, lr0: 3.3, lr1: 2.3, foot: 5.2, stoop: 2, belly: 2 };
    default:
      return f
        ? { hrx: 5.3, hry: 6.3, neck: 2, sh: 7.8, waist: 6.1, hip: 8.4, torso: 23, up: 11.5, fore: 10.5, ar0: 2, ar1: 1.7, hand: 1.8, thigh: 16.5, shin: 15.5, lr0: 3.4, lr1: 2.2, foot: 4.6, stoop: 0, belly: 0 }
        : { hrx: 5.5, hry: 6.5, neck: 2, sh: 9, waist: 7.4, hip: 7.8, torso: 25, up: 12.5, fore: 11.5, ar0: 2.4, ar1: 2, hand: 2, thigh: 17, shin: 16, lr0: 3.5, lr1: 2.4, foot: 5.2, stoop: 0, belly: 0.6 };
  }
}

// -----------------------------------------------------------------------------
// Esqueleto
// -----------------------------------------------------------------------------
interface Arm {
  s: V2;
  e: V2;
  w: V2;
  /** desenhar na frente do tronco */
  front: boolean;
  /** mão escondida (no bolso, atrás) */
  hide?: boolean;
}
interface Leg {
  hip: V2;
  knee: V2;
  ankle: V2;
  /** ponta do pé */
  toe: V2;
  front: boolean;
  /** coxa encurtada (sentado de frente) */
  lap?: boolean;
  /** ajoelhado: o joelho apoia no chão, a canela e o pé ficam atrás (só a sola aparece) */
  kneel?: boolean;
}
interface Rig {
  view: 'front' | 'top' | 'back';
  head: V2;
  hrx: number;
  hry: number;
  /** eixo coroa → queixo (tela) */
  fax: V2;
  neck0: V2;
  neck1: V2;
  /** tronco: ombro esq/dir, quadril esq/dir (polígono com cintura) */
  torso: V2[];
  /** eixo ombros → quadril */
  tax: V2;
  chest: V2;
  belly: V2;
  pelvis: V2;
  arms: [Arm, Arm];
  legs: [Leg, Leg];
  /** pernas desenhadas atrás do tronco (deitado de lado, encolhido) */
  legsBehind?: boolean;
  /** compressão vertical da vista de cima */
  sq: number;
  /** a cabeça vira (olhar) */
  turn: number;
  /** de lado (posição lateral): tronco estreito */
  side?: boolean;
  /** cobertor por cima (cama) */
  blanket?: boolean;
  /** saia/lençol (parto): tenda sobre os joelhos */
  tent?: boolean;
  /** lençol do parto: joelhos para cima */
  knees?: V2;
  /** sentado de frente: o colo (coxas) fica na frente do tronco */
  legsFront?: boolean;
  /** quadril esq/dir (bordas), centro dos ombros e meia largura dos ombros (para roupa e sinais) */
  hipL: V2;
  hipR: V2;
  shC: V2;
  shW: number;
}

const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];
const mul = (a: V2, k: number): V2 => [a[0] * k, a[1] * k];
const lerp = (a: V2, b: V2, t: number): V2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const len = (a: V2) => Math.hypot(a[0], a[1]);
const norm = (a: V2): V2 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};

/** dois segmentos de comprimento a e b ligando p a q, cotovelo/joelho para o lado `bend` */
function ik(p: V2, q: V2, a: number, b: number, bend: 1 | -1): V2 {
  const d = sub(q, p);
  const L = Math.max(0.001, len(d));
  const dd = Math.min(L, a + b - 0.01);
  const x = (a * a - b * b + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  const u = norm(d);
  const perp: V2 = [-u[1] * bend, u[0] * bend];
  return add(add(p, mul(u, x)), mul(perp, h));
}

const isLying = (p: FigPose) => p === 'deitado' || p === 'caido' || p === 'convulsao' || p === 'cama' || p === 'lateral' || p === 'brucos';

/**
 * Monta o esqueleto já na escala (âncora = chão entre os pés / ponto de apoio).
 */
function rigFor(s: FigSpec, D: Dim): Rig {
  const k = s.k;
  const sg = s.signs ?? [];
  const pose = s.pose;
  const ph = s.phase;
  if (isLying(pose)) return rigTop(s, D);
  const S = (v: number) => v * k;
  // ---------------------------------------------------------------- vista de frente
  const dirx = s.dir;
  let hipY = -(D.thigh + D.shin + 1.5);
  let lean = 0; // o tronco vem para a câmera (a cabeça desce)
  let sway = 0;
  let legs: [Leg, Leg];
  const hipX = D.hip * 0.54;
  const footX = hipX + 0.3;
  const conv = sg.includes('tremor') || sg.includes('agitado') ? (ph % 2 ? 0.6 : -0.6) : 0;
  let headTilt = 0;
  let headDrop = 0;
  let tent = false;
  let knees: V2 | undefined;
  let legsFront = false;
  let torsoK = 1; // encurtamento do tronco (curvado)
  switch (pose) {
    case 'sentado':
    case 'cadeira':
    case 'curvado':
    case 'colo_adulto':
    case 'debrucado':
    case 'preso': {
      const seat = D.shin + 1.5;
      hipY = -seat - 0.5;
      legsFront = true;
      if (pose === 'curvado') {
        lean = 2.4;
        torsoK = 0.78;
      }
      if (pose === 'debrucado') {
        lean = 4;
        torsoK = 0.6;
        headDrop = 2;
      }
      if (pose === 'preso') {
        headTilt = 0.4 * dirx;
        headDrop = 1;
      }
      const kneeY = hipY + 2.8;
      const kx = hipX + 1.4;
      legs = [
        { hip: [-hipX, hipY], knee: [-kx, kneeY], ankle: [-kx - 0.2, -1.6], toe: [-kx - 0.3, 0], front: true, lap: true },
        { hip: [hipX, hipY], knee: [kx, kneeY], ankle: [kx + 0.2, -1.6], toe: [kx + 0.3, 0], front: true, lap: true },
      ];
      break;
    }
    case 'encostado': {
      // sentado no chão, escorado, pernas esticadas para a câmera
      hipY = -2;
      headTilt = 0.5 * dirx;
      headDrop = 1.4;
      torsoK = 0.94;
      legsFront = true;
      legs = [
        { hip: [-hipX, hipY], knee: [-hipX - 1.4, hipY + 5.5], ankle: [-hipX - 2.2, hipY + 10.5], toe: [-hipX - 2.6, hipY + 12.5], front: true, lap: true },
        { hip: [hipX, hipY], knee: [hipX + 1.8, hipY + 5], ankle: [hipX + 3.2, hipY + 9.8], toe: [hipX + 3.6, hipY + 11.8], front: true, lap: true },
      ];
      break;
    }
    case 'ajoelhado':
    case 'rcp':
    case 'ajoelhado_maos': {
      // de três quartos: as coxas descem para a frente (para o lado do paciente), as canelas
      // ficam deitadas no chão para trás e a sola do sapato aparece no fim — não parece em pé
      hipY = -D.thigh * 0.8 - 1;
      if (pose === 'rcp') lean = 4.5 + (ph % 2 ? 1.2 : 0);
      if (pose === 'ajoelhado_maos') lean = 3.5;
      torsoK = pose === 'ajoelhado' ? 1 : 0.86;
      const fwd = D.thigh * 0.45;
      legs = [
        { hip: [-hipX * 0.7, hipY], knee: [dirx * fwd - hipX * 0.6, -1.4], ankle: [-dirx * D.shin * 0.5 - hipX * 0.4, -2.2], toe: [-dirx * (D.shin * 0.5 + D.foot * 0.6) - hipX * 0.4, -2.8], front: true, kneel: true },
        { hip: [hipX * 0.7, hipY], knee: [dirx * fwd + hipX * 0.6, -0.6], ankle: [-dirx * D.shin * 0.45 + hipX * 0.6, -1.2], toe: [-dirx * (D.shin * 0.45 + D.foot * 0.6) + hipX * 0.6, -1.6], front: true, kneel: true },
      ];
      break;
    }
    case 'agachado': {
      hipY = -D.shin * 0.7;
      lean = 3;
      torsoK = 0.85;
      legsFront = true;
      legs = [
        { hip: [-hipX, hipY], knee: [-hipX - 2.8, hipY - D.thigh * 0.42], ankle: [-footX - 1.2, -1.6], toe: [-footX - 1.4, 0], front: true },
        { hip: [hipX, hipY], knee: [hipX + 2.8, hipY - D.thigh * 0.42], ankle: [footX + 1.2, -1.6], toe: [footX + 1.4, 0], front: true },
      ];
      break;
    }
    case 'sentado_chao': {
      // sentado no chão ou no meio-fio: joelhos para cima, pés na frente
      hipY = -2.2;
      torsoK = 0.96;
      legsFront = true;
      legs = [
        { hip: [-hipX, hipY], knee: [-hipX - 2.2, hipY - D.thigh * 0.5], ankle: [-hipX - 1.4, 2.5], toe: [-hipX - 1.6, 4], front: true },
        { hip: [hipX, hipY], knee: [hipX + 2.2, hipY - D.thigh * 0.5], ankle: [hipX + 1.4, 2.5], toe: [hipX + 1.6, 4], front: true },
      ];
      break;
    }
    case 'parto': {
      // recostada no travesseiro, joelhos para cima e afastados, lençol por cima
      hipY = -2;
      torsoK = 0.84;
      tent = true;
      knees = [0, hipY - D.thigh * 0.62];
      legsFront = true;
      legs = [
        { hip: [-hipX, hipY], knee: [-hipX - 5.5, hipY - D.thigh * 0.62], ankle: [-hipX - 3, -0.5], toe: [-hipX - 3.2, 1], front: true },
        { hip: [hipX, hipY], knee: [hipX + 5.5, hipY - D.thigh * 0.62], ankle: [hipX + 3, -0.5], toe: [hipX + 3.2, 1], front: true },
      ];
      break;
    }
    default: {
      // em pé
      if (sg.includes('agitado')) sway = [0, 1.4, 0, -1.4][ph % 4];
      const kneeY = hipY + D.thigh;
      const st = s.act === 'correndo' ? [2.5, -1.5, -2.5, 1.5][ph % 4] : 0;
      legs = [
        { hip: [-hipX, hipY], knee: [-hipX - 0.2 + st * 0.3, kneeY], ankle: [-footX + st * 0.5, -1.8], toe: [-footX - 0.4 + st * 0.5, 0], front: true },
        { hip: [hipX, hipY], knee: [hipX + 0.2 - st * 0.3, kneeY], ankle: [footX - st * 0.5, -1.8], toe: [footX + 0.4 - st * 0.5, 0], front: true },
      ];
      if (s.act === 'gritando' || s.act === 'apontando') lean = -0.5;
    }
  }
  lean += D.stoop * 0.6;
  // respiração
  const dead = sg.includes('rigidez') || sg.includes('livores');
  const fast = sg.includes('respira_rapido') || sg.includes('tiragem');
  const br = dead ? 0 : fast ? (ph % 2 ? 0.8 : 0) : ph % 4 === 1 || ph % 4 === 2 ? 0.5 : 0;
  const pelvis: V2 = [sway * 0.4, hipY];
  const shoulderC: V2 = [sway + conv, hipY - D.torso * torsoK + lean - br];
  const tax = norm(sub(pelvis, shoulderC));
  const sh = D.sh * (pose === 'curvado' || pose === 'debrucado' ? 1.06 : 1);
  const waist = lerp(shoulderC, pelvis, 0.66);
  const bw = D.belly * 0.7;
  const torso: V2[] = [
    [shoulderC[0] - 2.2, shoulderC[1] - 0.4],
    [shoulderC[0] - sh + 1.4, shoulderC[1] + 0.8],
    [shoulderC[0] - sh, shoulderC[1] + 2.6],
    [shoulderC[0] - sh + 0.4, shoulderC[1] + 6.5],
    [waist[0] - D.waist - bw, waist[1]],
    [pelvis[0] - D.hip, pelvis[1] + 0.5],
    [pelvis[0] + D.hip, pelvis[1] + 0.5],
    [waist[0] + D.waist + bw, waist[1]],
    [shoulderC[0] + sh - 0.4, shoulderC[1] + 6.5],
    [shoulderC[0] + sh, shoulderC[1] + 2.6],
    [shoulderC[0] + sh - 1.4, shoulderC[1] + 0.8],
    [shoulderC[0] + 2.2, shoulderC[1] - 0.4],
  ];
  const shL: V2 = [shoulderC[0] - sh + 1.7, shoulderC[1] + 2.4];
  const shR: V2 = [shoulderC[0] + sh - 1.7, shoulderC[1] + 2.4];
  const neck1: V2 = [shoulderC[0], shoulderC[1] + 0.6];
  const neck0: V2 = [shoulderC[0] + headTilt * 1.2, shoulderC[1] - D.neck + headDrop * 0.5];
  const head: V2 = [neck0[0] + headTilt * 2.4 + conv, neck0[1] - D.hry + 1 + headDrop * 0.5 + D.stoop * 0.3];
  const chest = lerp(shoulderC, pelvis, 0.3);
  const belly = lerp(shoulderC, pelvis, 0.72);
  // ---------------------------------------------------------------- braços
  const arms = armsFront(s, D, shL, shR, chest, belly, head, pelvis, waist, legs, ph);
  const view: Rig['view'] = s.act === 'de_costas' ? 'back' : 'front';
  const hipLp: V2 = [pelvis[0] - D.hip, pelvis[1] + 0.5];
  const hipRp: V2 = [pelvis[0] + D.hip, pelvis[1] + 0.5];
  const r: Rig = { view, head, hrx: D.hrx, hry: D.hry, fax: [Math.sin(headTilt * 0.6), 1], neck0, neck1, torso, tax, chest, belly, pelvis, arms, legs, sq: 1, turn: s.gaze ?? 0, tent, knees, legsFront, hipL: hipLp, hipR: hipRp, shC: shoulderC, shW: sh };
  return scaleRig(r, k, S);
}

function scaleRig(r: Rig, k: number, S: (v: number) => number): Rig {
  const P = (p: V2): V2 => [p[0] * k, p[1] * k];
  return {
    ...r,
    head: P(r.head),
    hrx: S(r.hrx),
    hry: S(r.hry),
    fax: norm(r.fax),
    neck0: P(r.neck0),
    neck1: P(r.neck1),
    torso: r.torso.map(P),
    chest: P(r.chest),
    belly: P(r.belly),
    pelvis: P(r.pelvis),
    arms: r.arms.map((a) => ({ ...a, s: P(a.s), e: P(a.e), w: P(a.w) })) as [Arm, Arm],
    legs: r.legs.map((l) => ({ ...l, hip: P(l.hip), knee: P(l.knee), ankle: P(l.ankle), toe: P(l.toe) })) as [Leg, Leg],
    knees: r.knees ? P(r.knees) : undefined,
    hipL: P(r.hipL),
    hipR: P(r.hipR),
    shC: P(r.shC),
    shW: S(r.shW),
  };
}

/** braços na vista de frente, pelos sinais e pela ação */
function armsFront(s: FigSpec, D: Dim, shL: V2, shR: V2, chest: V2, belly: V2, head: V2, pelvis: V2, waist: V2, legs: [Leg, Leg], ph: number): [Arm, Arm] {
  const sg = s.signs ?? [];
  const a = D.up;
  const b = D.fore + D.hand * 0.5;
  const pose = s.pose;
  const act = s.act;
  // alvo de cada mão (esq = lado esquerdo da tela)
  let hL: V2;
  let hR: V2;
  let frontL = false;
  let frontR = false;
  // em pé, braços caídos junto do corpo (mão na altura da virilha)
  const side = D.waist + D.belly * 0.7 + D.ar1 + 1.1;
  const restL: V2 = [waist[0] - side - 0.4, pelvis[1] + 2.5];
  const restR: V2 = [waist[0] + side + 0.4, pelvis[1] + 2.5];
  const sitting = pose === 'sentado' || pose === 'cadeira' || pose === 'curvado' || pose === 'colo_adulto' || pose === 'preso';
  if (sitting) {
    // mãos no colo, sobre as coxas
    hL = [legs[0].knee[0] + 1.6, legs[0].knee[1] - 1.8];
    hR = [legs[1].knee[0] - 1.6, legs[1].knee[1] - 1.8];
    frontL = frontR = true;
    if (pose === 'curvado') {
      // cotovelos nos joelhos, mãos juntas na frente
      hL = [-1.2, legs[0].knee[1] - 3.5];
      hR = [1.2, legs[1].knee[1] - 3];
    }
    if (pose === 'preso') {
      // agarrado ao volante
      hL = [chest[0] - D.sh * 0.7, chest[1] + 5];
      hR = [chest[0] + D.sh * 0.7, chest[1] + 5];
    }
  } else if (pose === 'sentado_chao') {
    hL = [legs[0].knee[0] + 1.2, legs[0].knee[1] + 3];
    hR = [legs[1].knee[0] - 1.2, legs[1].knee[1] + 3];
    frontL = frontR = true;
  } else if (pose === 'encostado') {
    hL = [legs[0].hip[0] - 4, legs[0].hip[1] + 1];
    hR = [legs[1].hip[0] + 4, legs[1].hip[1] + 1.5];
  } else if (pose === 'debrucado') {
    hL = [head[0] - D.hrx - 2, head[1] + D.hry * 0.9];
    hR = [head[0] + D.hrx + 2, head[1] + D.hry * 0.9];
    frontL = frontR = true;
  } else if (pose === 'parto') {
    // segura os joelhos por cima do lençol
    hL = [legs[0].knee[0] + 0.8, legs[0].knee[1] - 0.6];
    hR = [legs[1].knee[0] - 0.8, legs[1].knee[1] - 0.6];
    frontL = frontR = true;
  } else if (pose === 'ajoelhado' || pose === 'agachado') {
    hL = [legs[0].knee[0] + 0.8, legs[0].knee[1] - 3];
    hR = [legs[1].knee[0] - 0.8, legs[1].knee[1] - 3];
    frontL = frontR = pose === 'agachado';
    if (pose === 'ajoelhado') {
      hL = restL;
      hR = restR;
    }
  } else {
    hL = restL;
    hR = restR;
  }
  // sinais
  if (sg.includes('mao_no_peito')) {
    hR = [chest[0] - 0.5, chest[1] + 1];
    frontR = true;
  }
  if (sg.includes('mao_na_barriga')) {
    hL = [belly[0] + 0.5, belly[1] + 0.5];
    frontL = true;
    if (!sg.includes('mao_no_peito')) {
      hR = [belly[0] + 2.5, belly[1] + 2];
      frontR = true;
    }
  }
  if (sg.includes('maos_no_pescoco')) {
    hL = [head[0] - 1.8, head[1] + D.hry + 1.8];
    hR = [head[0] + 1.8, head[1] + D.hry + 1.8];
    frontL = frontR = true;
  }
  if (sg.includes('maos_na_cabeca')) {
    hL = [head[0] - D.hrx - 0.6, head[1] - 1.5];
    hR = [head[0] + D.hrx + 0.6, head[1] - 1.5];
    frontL = frontR = true;
  }
  if (sg.includes('braco_caido')) {
    hL = [shL[0] - 1.4, shL[1] + a + b - 1];
    frontL = false;
  }
  if (sg.includes('agitado')) {
    const up = ph % 2 ? -3 : 0;
    hR = [shR[0] + 6, shR[1] - 6 + up];
    frontR = false;
  }
  // ações de figurante
  switch (act) {
    case 'mao_na_boca':
      hR = [head[0] + 0.5, head[1] + D.hry * 0.6];
      frontR = true;
      break;
    case 'maos_na_cabeca':
      hL = [head[0] - D.hrx - 0.6, head[1] - 2];
      hR = [head[0] + D.hrx + 0.6, head[1] - 2];
      frontL = frontR = true;
      break;
    case 'chorando':
      hL = [head[0] - 1.6, head[1] + 1.5];
      hR = [head[0] + 1.6, head[1] + 1.5];
      frontL = frontR = true;
      break;
    case 'filmando':
      hR = [head[0] + 3, head[1] + D.hry + 2];
      hL = [head[0] - 1, head[1] + D.hry + 3];
      frontL = frontR = true;
      break;
    case 'apontando':
      hR = [shR[0] + a + b - 3, shR[1] - 1.5];
      frontR = false;
      break;
    case 'gritando':
      hR = [shR[0] + 4, shR[1] - 8 - (ph % 2 ? 2 : 0)];
      hL = [shL[0] - 3, shL[1] + 6];
      break;
    case 'rindo':
      hL = [belly[0] - 1.5, belly[1] + 0.5];
      frontL = true;
      break;
    case 'abanando': {
      const sw = ph % 2 ? 3 : -1;
      hR = [shR[0] + 3 + sw, shR[1] - 4];
      break;
    }
    case 'lanterna':
      hR = [shR[0] + 5, shR[1] + 6];
      break;
    case 'segurando_crianca':
      hL = [chest[0] - 3, chest[1] + 6];
      hR = [chest[0] + 3.5, chest[1] + 4];
      frontL = frontR = true;
      break;
    case 'escondido':
      hL = [chest[0] - 2, chest[1] + 4];
      hR = [head[0] + 2.5, head[1] + 2.5];
      frontL = frontR = true;
      break;
    case 'segurando_mao':
      if (s.reach && pose === 'em_pe') {
        const t: V2 = [s.reach[0] / s.k, s.reach[1] / s.k];
        if (t[0] > 0) hR = t;
        else hL = t;
      }
      break;
    default:
      break;
  }
  if (pose === 'colo_adulto') {
    // ninando: a mão esquerda segura a cabeça do bebê por baixo, o antebraço direito passa na frente dele
    hL = [belly[0] - 11, belly[1] + 3.5];
    hR = [belly[0] + 9, belly[1] + 3];
    frontL = false;
    frontR = true;
  }
  if (pose === 'rcp' || pose === 'ajoelhado_maos') {
    const t: V2 = s.reach ? [s.reach[0] / s.k, s.reach[1] / s.k] : [0, 8];
    if (pose === 'rcp') {
      hL = [t[0] - 0.7, t[1] - 0.4];
      hR = [t[0] + 0.7, t[1] - 1];
    } else {
      hL = [t[0] - 2.6, t[1]];
      hR = [t[0] + 2.6, t[1]];
    }
    frontL = frontR = true;
  }
  // cotovelo sempre para fora
  const elbowL = ik(shL, hL, a, b, 1);
  const elbowR = ik(shR, hR, a, b, -1);
  const wL = ikEnd(shL, elbowL, hL, b);
  const wR = ikEnd(shR, elbowR, hR, b);
  return [
    { s: shL, e: elbowL, w: wL, front: frontL },
    { s: shR, e: elbowR, w: wR, front: frontR },
  ];
}

function ikEnd(_s: V2, e: V2, target: V2, b: number): V2 {
  const d = sub(target, e);
  const l = len(d);
  if (l <= b) return target;
  return add(e, mul(norm(d), b));
}

/**
 * Vista de cima (deitado): coordenadas do corpo (u ao longo, da coroa aos pés;
 * v atravessado) → tela com compressão sq. Âncora = centro do corpo no chão.
 */
function rigTop(s: FigSpec, D: Dim): Rig {
  const k = s.k;
  const sg = s.signs ?? [];
  const ph = s.phase;
  const pose = s.pose;
  const dir = s.dir; // 1 = cabeça à esquerda
  const sq = 0.74;
  const total = D.hry * 2 + D.neck + D.torso + D.thigh + D.shin + 2;
  const u0 = -total / 2;
  // u,v → tela (x, y), sem escala
  const T = (u: number, v: number): V2 => [dir * (u0 + u), v * sq];
  const conv = pose === 'convulsao' ? [[0.8, -0.6], [-0.7, 0.8], [0.6, 0.7], [-0.8, -0.5]][ph % 4] : [0, 0];
  const dead = sg.includes('rigidez') || sg.includes('livores');
  const fast = sg.includes('respira_rapido') || sg.includes('tiragem');
  const br = dead ? 0 : fast ? (ph % 2 ? 0.7 : 0) : ph % 4 === 1 || ph % 4 === 2 ? 0.45 : 0;
  const side = pose === 'lateral';
  const shW = side ? D.sh * 0.55 : D.sh;
  const hipW = side ? D.hip * 0.6 : D.hip;
  const headU = D.hry;
  const neckU0 = D.hry * 2 - 0.6;
  const shU = neckU0 + D.neck + 0.6;
  const hipU = shU + D.torso;
  const head = T(headU + conv[0] * 0.5, conv[1] * 0.6 + (side ? -0.6 : 0));
  const shoulderC = T(shU, 0);
  const pelvis = T(hipU, 0);
  const chest = T(shU + D.torso * 0.3, -br * 0.6);
  const belly = T(shU + D.torso * 0.7, 0);
  const torso: V2[] = [
    T(shU - 0.6, -shW + 1.2),
    T(shU + 1.6, -shW),
    T(shU + D.torso * 0.6, -(D.waist + D.belly * 0.5)),
    T(hipU, -hipW),
    T(hipU + 1.6, -hipW + 1),
    T(hipU + 1.6, hipW - 1),
    T(hipU, hipW),
    T(shU + D.torso * 0.6, D.waist + D.belly * 0.5),
    T(shU + 1.6, shW),
    T(shU - 0.6, shW - 1.2),
  ];
  // pernas
  const hipX = hipW * 0.55;
  const legLen = D.thigh + D.shin;
  let legs: [Leg, Leg];
  const kick = pose === 'convulsao' ? (ph % 2 ? 1.2 : -1.2) : 0;
  if (pose === 'caido') {
    legs = [
      { hip: T(hipU, -hipX), knee: T(hipU + D.thigh * 0.85, -hipX - 4), ankle: T(hipU + legLen * 0.86, -hipX - 1), toe: T(hipU + legLen * 0.86 + 1.5, -hipX - 0.5), front: true },
      { hip: T(hipU, hipX), knee: T(hipU + D.thigh, hipX + 0.8), ankle: T(hipU + legLen, hipX + 1.2), toe: T(hipU + legLen + 1.8, hipX + 1.4), front: true },
    ];
  } else if (side) {
    // posição de recuperação: perna de cima dobrada para a frente (para a câmera)
    legs = [
      { hip: T(hipU, -0.5), knee: T(hipU + D.thigh, -0.5), ankle: T(hipU + legLen, -0.5), toe: T(hipU + legLen + 1.5, -0.2), front: false },
      { hip: T(hipU, 0.6), knee: T(hipU + D.thigh * 0.62, D.thigh * 0.62), ankle: T(hipU + D.thigh * 0.62 + D.shin * 0.75, D.thigh * 0.62 - 1), toe: T(hipU + D.thigh * 0.62 + D.shin * 0.75 + 1.5, D.thigh * 0.62 - 1), front: true },
    ];
  } else {
    const spread = sg.includes('deformidade_perna') ? 0 : 0.6;
    legs = [
      { hip: T(hipU, -hipX), knee: T(hipU + D.thigh, -hipX - spread + kick * 0.5), ankle: T(hipU + legLen, -hipX - spread * 2 + kick), toe: T(hipU + legLen + 1.6, -hipX - spread * 2.2 + kick), front: true },
      { hip: T(hipU, hipX), knee: T(hipU + D.thigh, hipX + spread - kick * 0.5), ankle: T(hipU + legLen, hipX + spread * 2 - kick), toe: T(hipU + legLen + 1.6, hipX + spread * 2.2 - kick), front: true },
    ];
    if (sg.includes('deformidade_perna')) {
      // canela torta para fora, pé virado
      const kn = T(hipU + D.thigh, hipX + 0.6);
      legs[1] = { hip: T(hipU, hipX), knee: kn, ankle: T(hipU + D.thigh + D.shin * 0.82, hipX + 5.5), toe: T(hipU + D.thigh + D.shin * 0.82 + 0.8, hipX + 7.5), front: true };
    }
  }
  if (pose === 'cama') {
    legs = [
      { hip: T(hipU, -hipX), knee: T(hipU + D.thigh, -hipX), ankle: T(hipU + legLen, -hipX - 0.3), toe: T(hipU + legLen + 1.4, -hipX - 0.4), front: true },
      { hip: T(hipU, hipX), knee: T(hipU + D.thigh, hipX), ankle: T(hipU + legLen, hipX + 0.3), toe: T(hipU + legLen + 1.4, hipX + 0.4), front: true },
    ];
  }
  const baby = s.look.age === 'bebe' && !side && pose !== 'caido' && pose !== 'brucos';
  if (baby) {
    // pernas de sapo: joelhos para fora, pés voltando para o meio
    const kv = hipX + D.thigh * 0.8;
    const kick2 = pose === 'convulsao' ? kick * 0.8 : (ph % 4 === 1 ? 0.5 : 0);
    legs = [
      { hip: T(hipU - 0.4, -hipX), knee: T(hipU + D.thigh * 0.55, -kv - kick2), ankle: T(hipU + D.thigh * 0.55 + D.shin * 0.75, -hipX - 1.4), toe: T(hipU + D.thigh * 0.55 + D.shin * 0.75 + 1.4, -hipX - 0.6), front: true },
      { hip: T(hipU - 0.4, hipX), knee: T(hipU + D.thigh * 0.55, kv + kick2), ankle: T(hipU + D.thigh * 0.55 + D.shin * 0.75, hipX + 1.4), toe: T(hipU + D.thigh * 0.55 + D.shin * 0.75 + 1.4, hipX + 0.6), front: true },
    ];
  }
  // braços
  const a = D.up;
  const b = D.fore + D.hand * 0.6;
  const sL = T(shU + 1, -shW + 0.6);
  const sR = T(shU + 1, shW - 0.6);
  // braços estendidos ao longo do corpo, quase retos
  let hL: V2 = T(shU + 1 + (a + b) * 0.95, -shW - 2.6);
  let hR: V2 = T(shU + 1 + (a + b) * 0.95, shW + 2.6);
  let fL = false;
  let fR = false;
  if (pose === 'caido') {
    hL = T(shU - 3, -shW - 7); // braço jogado acima da cabeça
    hR = T(shU + a + b - 3, shW + 4);
  }
  if (pose === 'convulsao') {
    hL = T(shU + a * 0.7 + conv[1] * 2, -shW - 4 + conv[0] * 2);
    hR = T(shU + a * 0.7 - conv[1] * 2, shW + 4 - conv[0] * 2);
  }
  if (side) {
    // mão de cima apoiando o rosto, braço de baixo esticado à frente
    hR = T(headU + 1, 3.5);
    fR = true;
    hL = T(shU - a * 0.4, -5);
  }
  if (sg.includes('mao_no_peito')) {
    hR = add(chest, [0, 0.8]);
    fR = true;
  }
  if (sg.includes('mao_na_barriga')) {
    hL = add(belly, [0, -0.6]);
    fL = true;
  }
  if (sg.includes('maos_na_cabeca')) {
    hL = T(headU - 1, -D.hrx - 1.5);
    hR = T(headU - 1, D.hrx + 1.5);
  }
  if (pose === 'brucos') {
    hL = T(shU - 2, -shW - 5);
    hR = T(shU + a + b - 2, shW + 2.4);
  }
  if (baby && pose !== 'convulsao' && !sg.includes('mao_no_peito') && !sg.includes('mao_na_barriga')) {
    // braços em "W": cotovelos para fora, mãozinhas perto da cabeça
    const flail = ph % 4 === 3 ? 0.8 : 0;
    hL = T(headU + 2.2, -D.hrx - 0.4 - flail);
    hR = T(headU + 2.2, D.hrx + 0.4 + flail);
  }
  const eL = ik(sL, hL, a, b, dir === 1 ? -1 : 1);
  const eR = ik(sR, hR, a, b, dir === 1 ? 1 : -1);
  const arms: [Arm, Arm] = [
    { s: sL, e: eL, w: ikEnd(sL, eL, hL, b), front: fL },
    { s: sR, e: eR, w: ikEnd(sR, eR, hR, b), front: fR },
  ];
  const view: Rig['view'] = pose === 'brucos' ? 'back' : 'top';
  const r: Rig = {
    view,
    head,
    hrx: D.hrx,
    hry: D.hry,
    fax: [dir, 0],
    neck0: T(neckU0, 0),
    neck1: T(shU, 0),
    torso,
    tax: [dir, 0],
    chest,
    belly,
    pelvis,
    arms,
    legs,
    sq,
    turn: 0,
    side,
    blanket: pose === 'cama' && s.look.age !== 'bebe',
    hipL: T(hipU, -hipW),
    hipR: T(hipU, hipW),
    shC: T(shU, 0),
    shW: shW * sq,
  };
  void shoulderC;
  return scaleRig(r, k, (v) => v * k);
}

// -----------------------------------------------------------------------------
// Rasterização
// -----------------------------------------------------------------------------
export const TH_CLOTH: [number, number, number, number] = [-0.15, 0.36, 0.82, 0.97];
export const TH_SKIN: [number, number, number, number] = [-0.15, 0.4, 0.85, 0.97];

export class Fig {
  L: Layer;
  /** ordem de desenho de cada pixel (para os contornos internos) */
  ord: Uint8Array;
  /** grupo (membro) de cada pixel */
  grp: Uint8Array;
  ox: number;
  oy: number;
  n = 0;
  mats = new Map<string, number>();
  constructor(w: number, h: number, ox: number, oy: number) {
    this.L = new Layer(w, h);
    this.ord = new Uint8Array(w * h);
    this.grp = new Uint8Array(w * h);
    this.ox = ox;
    this.oy = oy;
  }
  mat(kind: 'skin' | 'hair' | 'cloth', hex: string): number {
    const key = kind + hex;
    let m = this.mats.get(key);
    if (m === undefined) {
      m = this.L.mat(kind === 'skin' ? skinRamp(hex) : kind === 'hair' ? hairRamp(hex) : clothRamp(hex));
      this.mats.set(key, m);
    }
    return m;
  }
  /** pinta um pixel (coordenadas relativas à âncora) */
  put(x: number, y: number, mat: number, tone: number, grp: number): void {
    const X = Math.floor(x + this.ox);
    const Y = Math.floor(y + this.oy);
    if (!this.L.in(X, Y)) return;
    this.L.set(X, Y, mat, tone, 2);
    const i = Y * this.L.w + X;
    this.ord[i] = this.n;
    this.grp[i] = grp;
  }
  next(): void {
    if (this.n < 254) this.n++;
  }
  /** cor travada (traço desenhado à mão) */
  ink(x: number, y: number, hex: string, grp = 99): void {
    const X = Math.floor(x + this.ox);
    const Y = Math.floor(y + this.oy);
    if (!this.L.in(X, Y)) return;
    this.L.color(X, Y, hex, 6);
    const i = Y * this.L.w + X;
    this.ord[i] = this.n;
    this.grp[i] = grp;
  }
  has(x: number, y: number): boolean {
    return this.L.filled(Math.floor(x + this.ox), Math.floor(y + this.oy));
  }
  grpAt(x: number, y: number): number {
    const X = Math.floor(x + this.ox);
    const Y = Math.floor(y + this.oy);
    return this.L.in(X, Y) && this.L.filled(X, Y) ? this.grp[Y * this.L.w + X] : -1;
  }
  shiftTone(x: number, y: number, d: number): void {
    this.L.shift(Math.floor(x + this.ox), Math.floor(y + this.oy), d);
  }
}

/** cápsula afunilada a→b com sombreamento cilíndrico */
export function capsule(F: Fig, a: V2, b: V2, ra: number, rb: number, mat: number, grp: number, th = TH_CLOTH, clip?: (x: number, y: number, t: number) => boolean): void {
  const d = sub(b, a);
  const L2 = d[0] * d[0] + d[1] * d[1] || 0.0001;
  const ln = Math.sqrt(L2);
  const u: V2 = [d[0] / ln, d[1] / ln];
  const p: V2 = [-u[1], u[0]];
  const rmax = Math.max(ra, rb);
  const x0 = Math.floor(Math.min(a[0], b[0]) - rmax - 1);
  const x1 = Math.ceil(Math.max(a[0], b[0]) + rmax + 1);
  const y0 = Math.floor(Math.min(a[1], b[1]) - rmax - 1);
  const y1 = Math.ceil(Math.max(a[1], b[1]) + rmax + 1);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const px = x + 0.5 - a[0];
      const py = y + 0.5 - a[1];
      let t = (px * d[0] + py * d[1]) / L2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const cx = a[0] + d[0] * t;
      const cy = a[1] + d[1] * t;
      const r = ra + (rb - ra) * t;
      const ex = x + 0.5 - cx;
      const ey = y + 0.5 - cy;
      const dist = Math.hypot(ex, ey);
      if (dist > r + 0.08) continue;
      if (clip && !clip(x, y, t)) continue;
      // normal: componente perpendicular ao eixo
      const sp = (ex * p[0] + ey * p[1]) / Math.max(0.6, r);
      const sa = (ex * u[0] + ey * u[1]) / Math.max(0.6, r);
      const nx = p[0] * sp + u[0] * sa * 0.6;
      const ny = p[1] * sp + u[1] * sa * 0.6;
      const nz = Math.sqrt(Math.max(0.04, 1 - sp * sp - sa * sa * 0.36));
      const I = lit(nx, ny, nz);
      F.put(x, y, mat, toneOf4(I, th), grp);
    }
}

function toneOf4(I: number, th: [number, number, number, number]): number {
  if (I < th[0]) return 0;
  if (I < th[1]) return 1;
  if (I < th[2]) return 2;
  if (I < th[3]) return 3;
  return 4;
}

/** polígono com sombreamento por "cilindro" ao longo do eixo ax */
export function polyShaded(F: Fig, pts: V2[], ax: V2, mat: number, grp: number, th = TH_CLOTH, bulge = 0.85): void {
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of pts) {
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
    minX = Math.min(minX, p[0]);
    maxX = Math.max(maxX, p[0]);
  }
  const perp: V2 = [-ax[1], ax[0]];
  // largura por linha ao longo do eixo: usa a projeção dos vértices
  let pmin = Infinity;
  let pmax = -Infinity;
  for (const p of pts) {
    const v = p[0] * perp[0] + p[1] * perp[1];
    pmin = Math.min(pmin, v);
    pmax = Math.max(pmax, v);
  }
  const pc = (pmin + pmax) / 2;
  const ph = Math.max(1, (pmax - pmin) / 2);
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const sy = y + 0.5;
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      if ((y1 <= sy && y2 > sy) || (y2 <= sy && y1 > sy)) xs.push(x1 + ((sy - y1) / (y2 - y1)) * (x2 - x1));
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const xa = Math.ceil(xs[i] - 0.5);
      const xb = Math.floor(xs[i + 1] - 0.5);
      for (let x = xa; x <= xb; x++) {
        const v = (x + 0.5) * perp[0] + sy * perp[1];
        const s = Math.max(-1, Math.min(1, (v - pc) / ph));
        const nx = perp[0] * s * bulge;
        const ny = perp[1] * s * bulge - 0.12;
        const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        F.put(x, y, mat, toneOf4(lit(nx, ny, nz), th), grp);
      }
    }
  }
}

export function ellipseShaded(F: Fig, c: V2, rx: number, ry: number, mat: number, grp: number, th = TH_SKIN, clip?: (x: number, y: number) => boolean): void {
  for (let y = Math.floor(c[1] - ry - 1); y <= Math.ceil(c[1] + ry + 1); y++)
    for (let x = Math.floor(c[0] - rx - 1); x <= Math.ceil(c[0] + rx + 1); x++) {
      const dx = (x + 0.5 - c[0]) / rx;
      const dy = (y + 0.5 - c[1]) / ry;
      const d2 = dx * dx + dy * dy;
      if (d2 > 1.02) continue;
      if (clip && !clip(x, y)) continue;
      const nz = Math.sqrt(Math.max(0.03, 1 - d2));
      F.put(x, y, mat, toneOf4(lit(dx, dy, nz), th), grp);
    }
}

/** contornos internos: escurece a parte de trás onde encosta uma parte da frente de outro grupo */
export function innerLines(F: Fig): void {
  const L = F.L;
  const W = L.w;
  const H = L.h;
  const ord = F.ord;
  const grp = F.grp;
  const t0 = L.t.slice();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!L.m[i] || L.k[i]) continue;
      const g = grp[i];
      if (g >= 90) continue;
      let hit = false;
      let lightSide = true;
      for (const [dx, dy, lt] of [
        [1, 0, false],
        [0, 1, false],
        [-1, 0, true],
        [0, -1, true],
      ] as [number, number, boolean][]) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx;
        if (!L.m[j]) continue;
        const gj = grp[j];
        if (gj === g || gj >= 90) continue;
        if (ord[j] <= ord[i]) continue;
        if (SAME.has(g * 100 + gj)) continue;
        hit = true;
        if (!lt) lightSide = false;
      }
      if (hit) L.t[i] = Math.max(0, Math.min(t0[i], lightSide ? 1 : 0) - (lightSide ? 0 : 0));
    }
}

/** pares de grupos que não ganham linha entre si (pescoço↔cabeça, mão↔antebraço…) */
const SAME = new Set<number>();
export const G = {
  HAIRB: 1,
  LEGL: 2,
  LEGR: 3,
  SKIRT: 4,
  TORSO: 5,
  NECK: 6,
  HEAD: 7,
  HAIR: 8,
  ARML: 9,
  ARMR: 10,
  HANDL: 11,
  HANDR: 12,
  HAT: 13,
  BLANK: 14,
  SHOEL: 15,
  SHOER: 16,
  BABY: 17,
  GEAR: 18,
};
for (const [a, b] of [
  [G.NECK, G.HEAD],
  [G.HEAD, G.NECK],
  [G.TORSO, G.NECK],
  [G.NECK, G.TORSO],
  [G.ARML, G.HANDL],
  [G.HANDL, G.ARML],
  [G.ARMR, G.HANDR],
  [G.HANDR, G.ARMR],
  [G.HEAD, G.HAIR],
  [G.LEGL, G.SHOEL],
  [G.LEGR, G.SHOER],
  [G.SHOEL, G.LEGL],
  [G.SHOER, G.LEGR],
  [G.TORSO, G.SKIRT],
  [G.SKIRT, G.TORSO],
  [G.HAIRB, G.HAIR],
  [G.HAIR, G.HAIRB],
])
  SAME.add(a * 100 + b);

// -----------------------------------------------------------------------------
// Desenho da figura
// -----------------------------------------------------------------------------
export const INK = '#1a1418';

export function drawFigure(s: FigSpec): FigOut {
  const Lk = s.look;
  const D = dimFor(Lk);
  const r = rigFor(s, D);
  const k = s.k;
  const lying = r.view === 'top' || (r.view === 'back' && isLying(s.pose));
  // caixa da camada: generosa
  const W = Math.ceil((lying ? 96 : 64) * k) + 16;
  const H = Math.ceil((lying ? 52 : 96) * k) + 16;
  const ox = Math.floor(W / 2);
  const oy = lying ? Math.floor(H / 2) : H - Math.ceil(8 * k) - 6;
  const F = new Fig(W, H, ox, oy);
  const sg = s.signs ?? [];
  const gear = s.gear ?? [];
  const skinM = F.mat('skin', Lk.skin);
  const hairM = F.mat('hair', Lk.hair);
  const topM = F.mat(Lk.top === Lk.skin ? 'skin' : 'cloth', Lk.top);
  const botM = F.mat(Lk.bottom === Lk.skin ? 'skin' : 'cloth', Lk.bottom);
  const shoeM = Lk.shoes ? F.mat('cloth', Lk.shoes) : skinM;
  const hrx = r.hrx;
  const hry = r.hry;
  const front = r.view === 'front';
  const top = r.view === 'top';
  const back = r.view === 'back';
  const shirtless = Lk.top === Lk.skin;

  // ---------------------------------------------------------------- cabelo de trás
  if (!back) hairBack(F, r, Lk, hairM, k);
  F.next();
  // ---------------------------------------------------------------- braços atrás do tronco
  const drawArm = (i: 0 | 1, foreOnly = false) => {
    const a = r.arms[i];
    const g = i === 0 ? G.ARML : G.ARMR;
    const gh = i === 0 ? G.HANDL : G.HANDR;
    const ar0 = D.ar0 * k;
    const ar1 = D.ar1 * k;
    const sleeveEnd = Lk.sleeve === 'longa' ? 1.9 : Lk.sleeve === 'curta' ? 0.62 : Lk.sleeve === 'regata' ? 0.02 : -1;
    // braço
    if (!foreOnly) {
      if (sleeveEnd >= 1) capsule(F, a.s, a.e, ar0 * 1.08, ar1 * 1.04, topM, g);
      else if (sleeveEnd > 0) {
        capsule(F, a.s, a.e, ar0, ar1 * 0.98, skinM, g, TH_SKIN);
        const m = lerp(a.s, a.e, sleeveEnd);
        capsule(F, a.s, m, ar0 * 1.12, ar0 * 1.02, topM, g);
      } else capsule(F, a.s, a.e, ar0, ar1 * 0.98, skinM, g, TH_SKIN);
    }
    // antebraço
    if (sleeveEnd >= 1.5) capsule(F, a.e, a.w, ar1 * 1.04, ar1 * 0.92, topM, g);
    else capsule(F, a.e, a.w, ar1 * 0.95, ar1 * 0.82, skinM, g, TH_SKIN);
    F.next();
    // mão
    if (!a.hide) {
      const hr = D.hand * k;
      const dir = norm(sub(a.w, a.e));
      const hc = add(a.w, mul(dir, hr * 0.55));
      ellipseShaded(F, hc, hr * 1.02, hr * 1.02, skinM, gh);
    }
    F.next();
  };
  if (!r.arms[0].front && !lying) drawArm(0);
  if (!r.arms[1].front && !lying) drawArm(1);
  if (lying) {
    // deitado: os braços ficam no chão, antes do tronco (a não ser que cruzem o peito)
    if (!r.arms[0].front) drawArm(0);
    if (!r.arms[1].front) drawArm(1);
  }
  // ---------------------------------------------------------------- pernas
  const drawLeg = (i: 0 | 1) => {
    const l = r.legs[i];
    const g = i === 0 ? G.LEGL : G.LEGR;
    const gs = i === 0 ? G.SHOEL : G.SHOER;
    const lr0 = D.lr0 * k;
    const lr1 = D.lr1 * k;
    const longPants = Lk.legs === 'calca' || Lk.legs === 'saia_longa';
    const thighM = Lk.legs === 'fralda' || Lk.legs === 'saia' || Lk.legs === 'saia_longa' || Lk.dress ? skinM : botM;
    const lapK = l.lap ? 1.18 : 1;
    if (l.kneel) {
      // ajoelhado: canela e pé deitados no chão (atrás), depois a coxa até o joelho
      const longPants = Lk.legs === 'calca' || Lk.legs === 'saia_longa';
      const shinM = longPants ? botM : skinM;
      capsule(F, l.knee, l.ankle, lr1 * 1.02, lr1 * 0.8, shinM, g, longPants ? TH_CLOTH : TH_SKIN);
      capsule(F, l.ankle, l.toe, D.foot * k * 0.32, D.foot * k * 0.28, Lk.shoes && !Lk.chinelo ? shoeM : skinM, gs, Lk.shoes && !Lk.chinelo ? TH_CLOTH : TH_SKIN);
      F.next();
      const thM = longPants || thighM === botM ? botM : skinM;
      capsule(F, l.hip, l.knee, lr0 * 1.05, lr1 * 1.12, thM, g, thM === botM ? TH_CLOTH : TH_SKIN);
      if (Lk.legs === 'shorts' || Lk.legs === 'fralda' || Lk.legs === 'bermuda') capsule(F, l.hip, lerp(l.hip, l.knee, Lk.legs === 'bermuda' ? 0.8 : 0.42), lr0 * 1.1, lr0 * 1.02, botM, g);
      F.next();
      return;
    }
    // coxa
    if (Lk.legs === 'shorts' || Lk.legs === 'fralda') {
      capsule(F, l.hip, l.knee, lr0 * lapK, lr1 * 1.08 * lapK, skinM, g, TH_SKIN);
      const m = lerp(l.hip, l.knee, Lk.legs === 'fralda' ? 0.18 : 0.42);
      capsule(F, l.hip, m, lr0 * 1.1 * lapK, lr0 * 1.02 * lapK, botM, g);
    } else capsule(F, l.hip, l.knee, lr0 * lapK, lr1 * 1.1 * lapK, thighM === skinM ? skinM : botM, g, thighM === skinM ? TH_SKIN : TH_CLOTH);
    // canela
    const shinM = longPants ? botM : skinM;
    capsule(F, l.knee, l.ankle, lr1 * 1.06, lr1 * 0.78, shinM, g, longPants ? TH_CLOTH : TH_SKIN);
    if (Lk.legs === 'bermuda') capsule(F, l.knee, lerp(l.knee, l.ankle, 0.22), lr1 * 1.16, lr1 * 1.08, botM, g);
    F.next();
    // pé
    const fw = D.foot * k * 0.5;
    const fd = norm(sub(l.toe, l.ankle));
    const fc = lerp(l.ankle, l.toe, 0.55);
    if (r.view === 'front' && !l.lap) {
      // de frente: o pé aparece como uma forma baixa e larga, um pouco para fora
      const out = i === 0 ? -1 : 1;
      const c: V2 = [l.ankle[0] + out * 0.4 * k, l.toe[1] - 1 * k];
      ellipseShaded(F, c, fw * 1.15, Math.max(1.2, 1.3 * k), Lk.shoes && !Lk.chinelo ? shoeM : skinM, gs, Lk.shoes && !Lk.chinelo ? TH_CLOTH : TH_SKIN);
      if (Lk.chinelo && Lk.shoes) F.ink(c[0], c[1] - 0.5 * k, Lk.shoes === '#e8e4dc' ? '#3a7ad0' : Lk.shoes, gs);
    } else if (Lk.shoes && !Lk.chinelo) {
      capsule(F, add(l.ankle, mul(fd, -0.3)), add(l.toe, mul(fd, 0.2)), fw * 0.95, fw * 0.85, shoeM, gs);
    } else {
      capsule(F, l.ankle, l.toe, fw * 0.7, fw * 0.62, skinM, gs, TH_SKIN);
      if (Lk.chinelo && Lk.shoes) F.ink(fc[0], fc[1], Lk.shoes === '#e8e4dc' ? '#3a7ad0' : Lk.shoes, gs);
    }
    F.next();
  };
  if (!r.blanket && !r.legsFront) {
    drawLeg(0);
    drawLeg(1);
  }
  // ---------------------------------------------------------------- tronco
  const torsoM = topM;
  polyShaded(F, r.torso, r.tax, torsoM, G.TORSO, shirtless ? TH_SKIN : TH_CLOTH, top ? 0.95 : 0.85);
  // calça/saia: metade de baixo do tronco (cós)
  if (!Lk.dress && Lk.legs !== 'fralda' && !shirtless) {
    // camisa por fora: só uma faixa do cós na altura do quadril
    beltLine(F, r, Lk, botM, k);
  }
  if (Lk.legs === 'fralda' || (shirtless && (Lk.legs === 'shorts' || Lk.legs === 'bermuda' || Lk.legs === 'calca'))) briefs(F, r, botM, k);
  if (Lk.dress || Lk.legs === 'saia' || Lk.legs === 'saia_longa') skirt(F, r, Lk, Lk.dress ? topM : botM, k);
  F.next();
  // estampa / detalhes da roupa
  if (!shirtless) clothDetail(F, r, Lk, k);
  // gestante
  if (sg.includes('gravida')) pregnant(F, r, torsoM, k);
  F.next();
  // sentado: o colo vem na frente do tronco
  if (!r.blanket && r.legsFront && !r.tent) {
    drawLeg(0);
    drawLeg(1);
  }
  // ---------------------------------------------------------------- pescoço e cabeça
  capsule(F, r.neck0, r.neck1, hrx * 0.42, hrx * 0.46, skinM, G.NECK, TH_SKIN);
  if (front && !shirtless) collar(F, r, Lk, k);
  F.next();
  const swell = sg.includes('inchaco_rosto') ? 0.5 * k : 0;
  if (back) {
    ellipseShaded(F, r.head, hrx + swell, hry * (lying ? r.sq : 1), skinM, G.HEAD);
  } else if (top) {
    // cabeça vista de cima: comprimida na transversal
    const ax = r.fax;
    const rxS = Math.abs(ax[0]) > 0.5 ? hry : hrx * r.sq;
    const ryS = Math.abs(ax[0]) > 0.5 ? hrx * r.sq + swell * 0.6 : hry;
    ellipseShaded(F, r.head, rxS, ryS, skinM, G.HEAD);
  } else {
    ellipseShaded(F, r.head, hrx + swell, hry + swell * 0.4, skinM, G.HEAD);
    // orelhas
    if (hrx >= 3.4) {
      const ey = r.head[1] + hry * 0.08;
      F.put(r.head[0] - hrx - swell - 0.6, ey, skinM, 2, G.HEAD);
      F.put(r.head[0] + hrx + swell - 0.4, ey, skinM, 1, G.HEAD);
    }
  }
  F.next();
  // ---------------------------------------------------------------- rosto
  if (!back) face(F, r, Lk, sg, s, k);
  F.next();
  // ---------------------------------------------------------------- cabelo da frente e chapéu
  hairFront(F, r, Lk, hairM, k, back);
  F.next();
  if (Lk.hat) hat(F, r, Lk, k, back);
  F.next();
  // ---------------------------------------------------------------- cobertor (cama)
  if (r.blanket) blanket(F, r, D, k);
  // ---------------------------------------------------------------- tenda do parto (lençol sobre os joelhos)
  if (r.tent && r.knees) tent(F, r, k);
  // ---------------------------------------------------------------- braços na frente
  let frontPix: Pix | undefined;
  const reachy = s.pose === 'rcp' || s.pose === 'ajoelhado_maos' || s.pose === 'colo_adulto';
  if (r.arms[0].front && !(lying && !r.arms[0].front)) drawArm(0);
  if (r.arms[1].front) drawArm(1);
  // ---------------------------------------------------------------- sinais no corpo
  signsOn(F, r, Lk, sg, s, k, D);
  F.next();
  // ---------------------------------------------------------------- equipamento e objetos nas mãos
  gearOn(F, r, Lk, gear, k, D);
  if (sg.includes('recem_nascido')) newborn(F, r, Lk, k);
  if (s.hold) held(F, r, s, k);
  innerLines(F);
  F.L.despeckle(undefined, 1);
  const pix = compose(F.L, null, { ink: INK, rim: '#e8eef4', rimK: 0.12 });
  if (reachy) {
    // antebraços e mãos por cima do paciente: recorta da figura pronta
    const fp = new Pix(W, H);
    for (const i of (s.pose === 'colo_adulto' ? [1] : [0, 1]) as (0 | 1)[]) {
      const a = r.arms[i];
      const hr = D.hand * k + 2;
      const lo = lerp(a.e, a.w, 0.35);
      const x0 = Math.floor(Math.min(lo[0], a.w[0]) - hr + ox);
      const x1 = Math.ceil(Math.max(lo[0], a.w[0]) + hr + ox);
      const y0 = Math.floor(Math.min(lo[1], a.w[1]) - hr + oy);
      const y1 = Math.ceil(Math.max(lo[1], a.w[1]) + hr + 1 + oy);
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const v = pix.get(x, y);
          if (v >>> 24) fp.raw(x, y, v);
        }
    }
    frontPix = fp;
  }
  const P = (p: V2): V2 => [p[0], p[1]];
  const ankleL = r.legs[0].ankle;
  const ankleR = r.legs[1].ankle;
  const mouth = add(r.head, mul(r.fax, hry * 0.58));
  const woundPt = woundPoint(s, r, D, k);
  return {
    pix,
    front: frontPix,
    ax: ox,
    ay: oy,
    pts: {
      head: P(r.head),
      face: add(r.head, mul(r.fax, hry * 0.1)),
      mouth,
      chest: P(r.chest),
      belly: P(r.belly),
      pelvis: P(r.pelvis),
      handL: P(r.arms[0].w),
      handR: P(r.arms[1].w),
      footL: P(ankleL),
      footR: P(ankleR),
      kneeL: P(r.legs[0].knee),
      kneeR: P(r.legs[1].knee),
      neck: P(r.neck1),
      wound: woundPt,
    },
    hr: hry,
    lying,
  };
}

function woundPoint(s: FigSpec, r: Rig, D: Dim, k: number): V2 {
  const w = s.wound;
  const sg = s.signs ?? [];
  const at = w?.at ?? (sg.includes('sangue_cabeca') || sg.includes('sangue_rosto') ? 'cabeca' : sg.includes('sangue_tronco') ? 'barriga' : sg.includes('sangue_braco') ? 'braco' : sg.includes('sangue_perna') || sg.includes('deformidade_perna') ? 'perna' : 'peito');
  void D;
  void k;
  switch (at) {
    case 'cabeca':
    case 'rosto':
      return add(r.head, mul(r.fax, -r.hry * 0.4));
    case 'peito':
      return r.chest;
    case 'barriga':
      return r.belly;
    case 'braco':
    case 'mao':
      return lerp(r.arms[1].e, r.arms[1].w, 0.5);
    case 'joelho':
      return r.legs[1].knee;
    case 'pe':
      return r.legs[1].ankle;
    default:
      return lerp(r.legs[1].hip, r.legs[1].knee, 0.55);
  }
}

// -----------------------------------------------------------------------------
// Rosto (pequeno: 10–14 px de cabeça)
// -----------------------------------------------------------------------------
function face(F: Fig, r: Rig, Lk: Look, sg: VideoSign[], s: FigSpec, k: number): void {
  const fax = r.fax;
  const perp: V2 = [fax[1], -fax[0]];
  const hry = r.hry;
  const hrx = r.hrx;
  const top = r.view === 'top';
  const sqv = top ? r.sq : 1;
  // ponto do rosto em coordenadas (lateral, coroa→queixo) relativas ao centro da cabeça
  const at = (fx: number, fy: number): V2 => {
    const turn = (s.gaze ?? 0) * hrx * 0.22;
    return add(r.head, add(mul(perp, (fx + turn) * sqv), mul(fax, fy)));
  };
  const dark = toLch(Lk.skin)[0] < 0.5;
  const eyeHex = '#1a1012';
  const lineHex = mixLab(Lk.skin, '#2a1418', dark ? 0.55 : 0.6);
  const dead = sg.includes('rigidez') || sg.includes('livores');
  const closed = sg.includes('olhos_fechados') || dead || s.act === 'chorando';
  const rolled = sg.includes('olhos_revirados');
  // criança e bebê: olhos mais baixos (testa grande) e maiores — é o que faz ler "criança" em poucos pixels
  const kidish = Lk.age === 'crianca' || Lk.age === 'bebe';
  const ex = Math.max(1.6, hrx * (kidish ? 0.4 : 0.42));
  const ey = hry * (Lk.age === 'bebe' ? 0.24 : Lk.age === 'crianca' ? 0.16 : 0.06);
  const big = hry >= 6.2 || (kidish && hry >= 5.4);
  // olhos
  for (const sx of [-1, 1]) {
    const p = at(sx * ex, ey);
    if (closed) {
      const q = at(sx * ex + 1 * sx * 0, ey + 0.4);
      F.ink(q[0] - (top ? 0 : 0.5), q[1], lineHex);
      if (!top) F.ink(q[0] + 0.5, q[1], lineHex);
    } else if (rolled) {
      F.ink(p[0], p[1], '#e8e4dc');
      if (big) F.ink(p[0], p[1] - 1, eyeHex);
    } else {
      F.ink(p[0], p[1], eyeHex);
      if (big && !top) F.ink(p[0], p[1] + 1, eyeHex);
    }
  }
  // sobrancelhas (dão a expressão)
  if (hry >= 5.4 && !top && Lk.age !== 'bebe') {
    const pain = Lk.state !== 'normal' || sg.includes('suor') || s.act === 'gritando' || s.act === 'chorando' || s.act === 'maos_na_cabeca';
    const browHex = mixLab(Lk.hair, '#1a1012', Lk.age === 'idoso' ? 0.2 : Lk.age === 'crianca' ? 0.15 : 0.35);
    for (const sx of [-1, 1]) {
      const b0 = at(sx * (ex - 0.6), ey - 2.2);
      const b1 = at(sx * (ex + 0.9), ey - 2.2 + (pain ? 0.9 : 0));
      F.ink(b0[0], b0[1] - (pain ? 0.4 : 0), browHex);
      F.ink(b1[0], b1[1], browHex);
    }
  }
  // nariz: sombra de 1 px
  if (!top && hry >= 5) {
    const n = at(0.6, ey + hry * 0.3);
    F.shiftTone(n[0], n[1], -1);
  }
  // boca
  const my = hry * (kidish ? 0.6 : 0.56);
  const lip = Lk.state === 'cianose' || Lk.state === 'cinza' ? (dark ? '#3e3a66' : '#5c5a9e') : mixLab(Lk.lip, '#3a1418', 0.35);
  const open = s.act === 'gritando' || s.act === 'rindo' || sg.includes('rindo') || sg.includes('maos_no_pescoco');
  if (open) {
    const a0 = at(-0.6, my - 0.4);
    F.ink(a0[0], a0[1], '#3a1016');
    const a1 = at(0.6, my - 0.4);
    F.ink(a1[0], a1[1], '#3a1016');
    const a2 = at(0, my + 0.6);
    F.ink(a2[0], a2[1], '#3a1016');
  } else if (sg.includes('face_torta')) {
    const a0 = at(-1.2, my - 0.3);
    const a1 = at(0, my);
    const a2 = at(1.3, my + 1);
    F.ink(a0[0], a0[1], lip);
    F.ink(a1[0], a1[1], lip);
    F.ink(a2[0], a2[1], lip);
  } else {
    const w = hrx >= 4.6 ? 1 : 0.5;
    const a0 = at(-w, my);
    const a1 = at(w, my);
    F.ink(a0[0], a0[1], lip);
    if (Math.floor(a1[0]) !== Math.floor(a0[0]) || Math.floor(a1[1]) !== Math.floor(a0[1])) F.ink(a1[0], a1[1], lip);
    if (sg.includes('inchaco_rosto')) {
      const b0 = at(-w, my + 1);
      const b1 = at(w, my + 1);
      F.ink(b0[0], b0[1], lip);
      F.ink(b1[0], b1[1], lip);
    }
  }
  // cianose: halo frio em volta da boca
  if (Lk.state === 'cianose') {
    for (const [fx, fy] of [
      [-1.8, my],
      [1.8, my],
      [0, my + 1.2],
    ] as V2[]) {
      const q = at(fx, fy);
      if (F.has(q[0], q[1])) F.ink(q[0], q[1], mixLab(Lk.skin, '#6a6aa8', 0.45));
    }
  }
  // rubor das bochechas (criança, vermelho)
  if (Lk.state === 'vermelho' || Lk.age === 'bebe' || Lk.age === 'crianca') {
    const blush = mixLab(Lk.skin, Lk.state === 'vermelho' ? '#d83a32' : '#e0707a', Lk.state === 'vermelho' ? 0.45 : 0.25);
    for (const sx of [-1, 1]) {
      const q = at(sx * (ex + 0.8), ey + 1.6);
      if (F.has(q[0], q[1])) F.ink(q[0], q[1], blush);
    }
  }
  // barba
  if (Lk.beard && !top && hry >= 5) {
    const bh = mixLab(Lk.skin, Lk.hair, 0.38);
    for (const [fx, fy] of [
      [-2.6, my - 0.2],
      [2.4, my - 0.2],
      [-1.6, my + 1.2],
      [1.4, my + 1.2],
      [0, my + 1.6],
    ] as V2[]) {
      const q = at(fx, fy);
      if (F.has(q[0], q[1])) F.ink(q[0], q[1], bh);
    }
  }
  // óculos
  if (Lk.glasses && !top && hry >= 5) {
    for (const sx of [-1, 1]) {
      const p = at(sx * ex, ey);
      F.ink(p[0] - 1, p[1], '#2a2a30');
      F.ink(p[0] + 1, p[1], '#2a2a30');
    }
  }
  void k;
}

// -----------------------------------------------------------------------------
// Cabelo
// -----------------------------------------------------------------------------
function inHead(r: Rig, x: number, y: number, grow = 0): boolean {
  const top = r.view === 'top';
  const rx = top && Math.abs(r.fax[0]) > 0.5 ? r.hry + grow : r.hrx + grow;
  const ry = top && Math.abs(r.fax[0]) > 0.5 ? r.hrx * r.sq + grow : r.hry + grow;
  const dx = (x + 0.5 - r.head[0]) / rx;
  const dy = (y + 0.5 - r.head[1]) / ry;
  return dx * dx + dy * dy <= 1;
}

/** coordenadas do rosto de um pixel: (lateral, coroa→queixo), normalizadas pelo raio */
function faceCoords(r: Rig, x: number, y: number): V2 {
  const d = sub([x + 0.5, y + 0.5], r.head);
  const perp: V2 = [r.fax[1], -r.fax[0]];
  const sqv = r.view === 'top' ? r.sq : 1;
  return [(d[0] * perp[0] + d[1] * perp[1]) / (r.hrx * sqv), (d[0] * r.fax[0] + d[1] * r.fax[1]) / r.hry];
}

function hairBack(F: Fig, r: Rig, Lk: Look, hairM: number, k: number): void {
  const st = Lk.style;
  if (st !== 'longo' && st !== 'cacheado' && st !== 'chanel' && st !== 'rabo') return;
  const top = r.view === 'top';
  const hx = r.head[0];
  const hy = r.head[1];
  const rx = r.hrx;
  const ry = r.hry;
  if (top) {
    // cabelo espalhado no chão, atrás da coroa
    const back = mul(r.fax, -1);
    const spread = st === 'longo' ? 1.5 : st === 'cacheado' ? 1.2 : 0.7;
    const c = add(r.head, mul(back, ry * 0.55));
    const ext = add(c, mul(back, ry * spread * 0.8));
    capsule(F, c, ext, rx * r.sq * 1.15, rx * r.sq * (st === 'longo' ? 1.25 : 1), hairM, G.HAIRB, TH_CLOTH);
    return;
  }
  const len = st === 'longo' ? ry * 2.3 : st === 'cacheado' ? ry * 1.7 : st === 'chanel' ? ry * 1.15 : 0;
  if (st === 'rabo') {
    // rabo de cavalo aparecendo de lado
    const s0: V2 = [hx + rx * 0.7, hy - ry * 0.2];
    capsule(F, s0, [hx + rx * 1.15, hy + ry * 1.1], 1.3 * k, 0.9 * k, hairM, G.HAIRB, TH_CLOTH);
    return;
  }
  const w = st === 'cacheado' ? rx + 2.2 * k : rx + 0.9 * k;
  for (let y = Math.floor(hy - ry * 0.3); y <= Math.ceil(hy + len); y++)
    for (let x = Math.floor(hx - w - 1); x <= Math.ceil(hx + w + 1); x++) {
      const t = (y + 0.5 - hy) / Math.max(1, len);
      const ww = w * (st === 'cacheado' ? 1 - Math.max(0, t - 0.6) * 0.8 : 1 - Math.max(0, t - 0.75) * 0.6);
      if (Math.abs(x + 0.5 - hx) > ww) continue;
      if (st === 'cacheado' && Math.abs(x + 0.5 - hx) > ww - 1 && (x + y) % 3 === 0) continue;
      const u = (x + 0.5 - hx) / ww;
      const I = lit(u * 0.8, 0.1, Math.sqrt(Math.max(0.1, 1 - u * u * 0.64)));
      F.put(x, y, hairM, Math.max(0, toneOf4(I, TH_CLOTH) - 1), G.HAIRB);
    }
}

function hairFront(F: Fig, r: Rig, Lk: Look, hairM: number, k: number, back: boolean): void {
  const st = Lk.style;
  const hx = r.head[0];
  const hy = r.head[1];
  const top = r.view === 'top';
  const hrx = r.hrx;
  const hry = r.hry;
  const x0 = Math.floor(hx - hry - 4 * k);
  const x1 = Math.ceil(hx + hry + 4 * k);
  const y0 = Math.floor(hy - hry - 4 * k);
  const y1 = Math.ceil(hy + hry + 3 * k);
  // linha do cabelo (coordenada coroa→queixo normalizada) por penteado
  let hairline = -0.32;
  let grow = 0.7 * k;
  let curly = false;
  let sides = 0.2; // até onde descem as laterais (coroa→queixo)
  switch (st) {
    case 'raspado':
      hairline = -0.42;
      grow = 0.35 * k;
      sides = -0.1;
      break;
    case 'careca':
      hairline = 9; // só as laterais
      grow = 0.3 * k;
      sides = 0.15;
      break;
    case 'crespo':
      hairline = -0.36;
      grow = 1.4 * k;
      curly = true;
      sides = 0.05;
      break;
    case 'cacheado':
      hairline = -0.32;
      grow = 2 * k;
      curly = true;
      sides = 0.85;
      break;
    case 'permanente':
      hairline = -0.3;
      grow = 1.3 * k;
      curly = true;
      sides = 0.1;
      break;
    case 'longo':
      hairline = -0.36;
      grow = 0.8 * k;
      sides = 1.1;
      break;
    case 'chanel':
      hairline = -0.28;
      grow = 0.9 * k;
      sides = 0.75;
      break;
    case 'coque':
    case 'rabo':
      hairline = -0.38;
      grow = 0.5 * k;
      sides = 0.1;
      break;
    case 'bebe':
      hairline = -0.75;
      grow = 0.2 * k;
      sides = -0.6;
      break;
    default:
      break;
  }
  if (Lk.hat === 'capacete') return; // o capacete cobre tudo
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const [fu, fv] = faceCoords(r, x, y);
      const inside = inHead(r, x, y, grow);
      if (!inside) continue;
      const onHead = inHead(r, x, y, 0);
      // de costas: cabelo cobre a cabeça toda menos a nuca
      let isHair: boolean;
      if (back) isHair = fv < 0.45 || !onHead;
      else if (st === 'careca') isHair = Math.abs(fu) > 0.72 && fv > -0.55 && fv < sides;
      else {
        const side = Math.abs(fu) > 0.7;
        isHair = fv < hairline + Math.abs(fu) * 0.12 || (side && fv < sides) || (!onHead && fv < sides + 0.3);
        // franja do chanel cobre a testa toda
        if (st === 'chanel' && fv < -0.18) isHair = true;
      }
      if (!isHair) continue;
      if (curly && !onHead && (x * 7 + y * 3) % 5 === 0) continue;
      // sombreamento: esfera do volume
      const dx = (x + 0.5 - hx) / (hrx + grow);
      const dy = (y + 0.5 - hy) / (hry + grow);
      const nz = Math.sqrt(Math.max(0.05, 1 - dx * dx - dy * dy));
      let t = toneOf4(lit(dx, dy, nz), [-0.2, 0.3, 0.72, 0.95]);
      if (curly && (x + y * 2) % 4 === 0) t = Math.max(0, t - 1);
      if (!top && !back && fv > hairline - 0.05 && Math.abs(fu) < 0.9 && fv < 0) t = Math.min(t, 1);
      F.put(x, y, hairM, t, G.HAIR);
    }
  // coque
  if (st === 'coque' && !top) ellipseShaded(F, [hx + (back ? 0 : 0), hy - hry - 1.2 * k], 2.4 * k, 2 * k, hairM, G.HAIR, TH_CLOTH);
  if (st === 'coque' && top) ellipseShaded(F, add(r.head, mul(r.fax, -hry - 1.5 * k)), 2 * k, 2 * k * r.sq, hairM, G.HAIR, TH_CLOTH);
  if (st === 'bebe' && !top) {
    F.put(hx, hy - hry, hairM, 2, G.HAIR);
    F.put(hx + 1, hy - hry - 1, hairM, 3, G.HAIR);
  }
}

function hat(F: Fig, r: Rig, Lk: Look, k: number, back: boolean): void {
  const h = Lk.hat;
  if (!h) return;
  const hm = F.mat('cloth', Lk.hatColor);
  const hx = r.head[0];
  const hy = r.head[1];
  const top = r.view === 'top';
  if (top) {
    // capacete/boné visto de cima: casco sobre a coroa
    const c = add(r.head, mul(r.fax, h === 'capacete' ? 0 : -r.hry * 0.25));
    const rx = h === 'capacete' ? r.hry + 1.2 * k : r.hry * 0.85;
    const ry = (r.hrx + (h === 'capacete' ? 1.2 * k : 0.6 * k)) * r.sq;
    ellipseShaded(F, c, Math.abs(r.fax[0]) > 0.5 ? rx : ry, Math.abs(r.fax[0]) > 0.5 ? ry : rx, hm, G.HAT, TH_CLOTH, (x, y) => (h === 'capacete' ? faceCoords(r, x, y)[1] < 0.15 || !inHead(r, x, y, 0) : true));
    if (h === 'capacete') {
      // viseira escura sobre o rosto
      for (let y = Math.floor(hy - r.hry); y <= Math.ceil(hy + r.hry); y++)
        for (let x = Math.floor(hx - r.hry - 2); x <= Math.ceil(hx + r.hry + 2); x++) {
          const [fu, fv] = faceCoords(r, x, y);
          if (inHead(r, x, y, 0.6 * k) && fv > -0.15 && fv < 0.35 && Math.abs(fu) < 0.85) F.put(x, y, F.mat('cloth', '#26303a'), 1, G.HAT);
        }
    }
    return;
  }
  if (h === 'capacete') {
    ellipseShaded(F, [hx, hy - 0.3 * k], r.hrx + 1.5 * k, r.hry + 1.3 * k, hm, G.HAT, TH_CLOTH);
    if (!back) {
      // viseira escura com reflexo
      const vy0 = Math.round(hy - r.hry * 0.25);
      for (let y = vy0; y <= vy0 + Math.max(2, Math.round(2.4 * k)); y++)
        for (let x = Math.floor(hx - r.hrx * 0.95); x <= Math.ceil(hx + r.hrx * 0.95); x++) F.put(x - F.ox + F.ox, y, F.mat('cloth', '#2a3440'), y === vy0 ? 3 : 1, G.HAT);
      F.ink(hx - r.hrx * 0.5, vy0 + 1, '#9ab8d0');
    }
    return;
  }
  if (h === 'capacete_obra') {
    ellipseShaded(F, [hx, hy - r.hry * 0.45], r.hrx + 1 * k, r.hry * 0.62, hm, G.HAT, TH_CLOTH, (_x, y) => y + 0.5 <= hy - r.hry * 0.2);
    capsule(F, [hx - r.hrx - 1.6 * k, hy - r.hry * 0.25], [hx + r.hrx + 1.6 * k, hy - r.hry * 0.25], 0.7 * k, 0.7 * k, hm, G.HAT);
    return;
  }
  if (h === 'bone' || h === 'quepe' || h === 'touca') {
    ellipseShaded(F, [hx, hy - r.hry * 0.4], r.hrx + 0.6 * k, r.hry * 0.62, hm, G.HAT, TH_CLOTH, (_x, y) => y + 0.5 <= hy - r.hry * (h === 'touca' ? 0.1 : 0.25));
    if (h !== 'touca' && !back) capsule(F, [hx - r.hrx * 0.6, hy - r.hry * 0.28], [hx + r.hrx * 0.9 + (h === 'bone' ? 2 * k : 0), hy - r.hry * 0.2], 0.7 * k, 0.6 * k, F.mat('cloth', h === 'quepe' ? '#1e2024' : adjust(Lk.hatColor, -0.06)), G.HAT);
    if (h === 'quepe' && !back) F.ink(hx, hy - r.hry * 0.62, '#d8b84a');
  }
}

// -----------------------------------------------------------------------------
// Roupa: cós, saia, gola, estampa, barriga de grávida
// -----------------------------------------------------------------------------
function beltLine(F: Fig, r: Rig, Lk: Look, botM: number, k: number): void {
  // faixa da calça na altura do quadril (a camisa por cima)
  const ax = r.tax;
  const h = Math.max(1.4, 2.4 * k);
  const pts: V2[] = [add(r.hipL, mul(ax, -h)), add(r.hipR, mul(ax, -h)), add(r.hipR, mul(ax, 1)), add(r.hipL, mul(ax, 1))];
  polyShaded(F, pts, r.view === 'top' ? r.tax : [0, 1], botM, G.SKIRT, TH_CLOTH, 0.9);
  void Lk;
}

function briefs(F: Fig, r: Rig, botM: number, k: number): void {
  const ax = r.tax;
  const h = 3.2 * k;
  polyShaded(F, [add(r.hipL, mul(ax, -h)), add(r.hipR, mul(ax, -h)), add(r.hipR, mul(ax, 1.2 * k)), add(r.hipL, mul(ax, 1.2 * k))], r.view === 'top' ? r.tax : [0, 1], botM, G.SKIRT, TH_CLOTH);
}

function skirt(F: Fig, r: Rig, Lk: Look, m: number, k: number): void {
  const longSk = Lk.legs === 'saia_longa';
  if (r.view === 'top') {
    // vista de cima: a saia cobre as coxas
    const hipC = lerp(r.legs[0].hip, r.legs[1].hip, 0.5);
    const kneeC = lerp(r.legs[0].knee, r.legs[1].knee, 0.5);
    const end = longSk ? lerp(r.legs[0].ankle, r.legs[1].ankle, 0.5) : kneeC;
    const wide = Math.abs(r.legs[0].knee[1] - r.legs[1].knee[1]) / 2 + 3.2 * k;
    capsule(F, hipC, end, wide * 0.9, wide * 1.05, m, G.SKIRT);
    return;
  }
  const lk = r.legs[0].lap;
  const kneeY = Math.max(r.legs[0].knee[1], r.legs[1].knee[1]);
  const bottomY = longSk ? Math.max(r.legs[0].ankle[1], r.legs[1].ankle[1]) - 0.5 : kneeY + (lk ? 1.5 * k : 0.5 * k);
  const flare = lk ? 1.5 * k : 2.4 * k;
  const pts: V2[] = [add(r.hipL, [0, -1.5 * k]), add(r.hipR, [0, -1.5 * k]), [Math.max(r.hipR[0], r.legs[1].knee[0]) + flare, bottomY], [Math.min(r.hipL[0], r.legs[0].knee[0]) - flare, bottomY]];
  polyShaded(F, pts, [0, 1], m, G.SKIRT, TH_CLOTH, 0.7);
  // pregas
  const mid = lerp(pts[0], pts[1], 0.5);
  const bm = lerp(pts[2], pts[3], 0.5);
  for (let i = 1; i < 4; i++) {
    const q = lerp(mid, bm, 0.45 + i * 0.15);
    F.shiftTone(q[0] + 2 * k, q[1], -1);
  }
}

function collar(F: Fig, r: Rig, Lk: Look, k: number): void {
  const n = r.neck1;
  const skinM = F.mat('skin', Lk.skin);
  if (Lk.wear === 'social' || Lk.wear === 'farda' || Lk.wear === 'jaleco' || Lk.wear === 'uniforme') {
    // gola de camisa: duas pontas claras
    const c = F.mat('cloth', Lk.wear === 'social' ? '#f2f2ee' : adjust(Lk.top, 0.06));
    F.put(n[0] - 1.6 * k, n[1] + 0.6 * k, c, 3, G.TORSO);
    F.put(n[0] + 1.2 * k, n[1] + 0.6 * k, c, 2, G.TORSO);
    if (Lk.wear === 'social' && Lk.sex === 'M') {
      const tie = F.mat('cloth', Lk.top2);
      for (let i = 1; i < 6; i++) F.put(n[0], n[1] + i * k, tie, i < 2 ? 3 : 2, G.TORSO);
    }
    return;
  }
  // decote: V ou redondo
  const v = Lk.sex === 'F' || Lk.wear === 'pijama';
  const depth = (v ? 2.6 : 1.6) * k;
  for (let i = 0; i <= depth; i++) {
    const w = (v ? (depth - i) * 0.55 : 1.3 * k - i * 0.35) + 0.4;
    for (let x = Math.floor(n[0] - w); x <= Math.ceil(n[0] + w - 1); x++) F.put(x, n[1] + i, skinM, x < n[0] ? 2 : 1, G.NECK);
  }
}

function clothDetail(F: Fig, r: Rig, Lk: Look, k: number): void {
  const top = r.view === 'top';
  const c2 = F.mat('cloth', Lk.top2);
  const shC = r.shC;
  const hipC = lerp(r.hipL, r.hipR, 0.5);
  const ax = norm(sub(hipC, shC));
  const perp: V2 = [-ax[1], ax[0]];
  const width = r.shW;
  const L0 = len(sub(hipC, shC));
  const inTorso = (p: V2) => {
    const g = F.grpAt(p[0], p[1]);
    return g === G.TORSO;
  };
  if (Lk.print === 'listras' || Lk.wear === 'socorrista' || Lk.wear === 'bombeiro' || Lk.wear === 'motoboy') {
    // faixas: refletivas (uniforme) ou listras
    const bands = Lk.wear === 'socorrista' || Lk.wear === 'bombeiro' ? [0.62] : Lk.wear === 'motoboy' ? [0.4, 0.55] : [0.2, 0.4, 0.6, 0.8];
    for (const t of bands)
      for (let s = -width; s <= width; s += 0.5) {
        const p = add(add(shC, mul(ax, L0 * t)), mul(perp, s));
        if (inTorso(p)) F.put(p[0], p[1], c2, Lk.wear === 'socorrista' ? 3 : 2, G.TORSO);
      }
  } else if (Lk.print === 'logo' && !top) {
    // logo/bolso no peito
    const p = add(add(shC, mul(ax, L0 * 0.26)), mul(perp, width * -0.4));
    for (let dy = 0; dy < Math.max(1, Math.round(1.6 * k)); dy++)
      for (let dx = 0; dx < Math.max(1, Math.round(2 * k)); dx++) if (inTorso([p[0] + dx, p[1] + dy])) F.put(p[0] + dx, p[1] + dy, c2, 2, G.TORSO);
  } else if (Lk.print === 'xadrez') {
    for (let y = -40; y < 40; y += 3)
      for (let x = -30; x < 30; x++) {
        const p = add(shC, [x * 0.5, y * 0.5 * k]);
        if ((Math.floor(p[0]) + Math.floor(p[1])) % 3 === 0 && inTorso(p)) F.shiftTone(p[0], p[1], -1);
      }
  } else if (Lk.print === 'flores') {
    const pts: V2[] = [
      [-0.5, 0.25],
      [0.4, 0.4],
      [-0.1, 0.62],
      [0.55, 0.8],
      [-0.6, 0.85],
    ];
    for (const [s, t] of pts) {
      const p = add(add(shC, mul(ax, L0 * t)), mul(perp, width * s));
      if (inTorso(p)) F.put(p[0], p[1], c2, 3, G.TORSO);
    }
  }
  if (Lk.wear === 'avental') {
    const ap = F.mat('cloth', '#f2f0ea');
    const a0 = add(shC, mul(ax, L0 * 0.3));
    polyShaded(F, [add(a0, mul(perp, -width * 0.6)), add(a0, mul(perp, width * 0.6)), add(add(hipC, mul(perp, width * 0.7)), mul(ax, 3 * k)), add(add(hipC, mul(perp, -width * 0.7)), mul(ax, 3 * k))], ax, ap, G.TORSO);
  }
  if (Lk.wear === 'jaleco' && !top) {
    // jaleco aberto: linha central
    for (let t = 0.1; t < 1; t += 0.05) {
      const p = add(shC, mul(ax, L0 * t));
      F.shiftTone(p[0], p[1], -2);
    }
  }
}

function pregnant(F: Fig, r: Rig, m: number, k: number): void {
  const c = r.view === 'top' ? r.belly : add(r.belly, [0, -1.5 * k]);
  const rr = 4.6 * k;
  if (r.view === 'top') ellipseShaded(F, c, rr * 1.1, rr * r.sq * 1.05, m, G.TORSO, TH_CLOTH);
  else ellipseShaded(F, add(c, [0.8 * k, 0]), rr * 0.95, rr * 0.85, m, G.TORSO, TH_CLOTH);
}

function blanket(F: Fig, r: Rig, D: Dim, k: number): void {
  // cobertor do peito para baixo
  const m = F.mat('cloth', '#8a6a9a');
  const from = lerp(r.chest, r.belly, 0.15);
  const to = lerp(r.legs[0].toe, r.legs[1].toe, 0.5);
  const ax = norm(sub(to, from));
  const perp: V2 = [-ax[1], ax[0]];
  const w = (D.sh + 2.6) * k * r.sq;
  const pts: V2[] = [add(from, mul(perp, -w)), add(from, mul(perp, w)), add(add(to, mul(ax, 2.5 * k)), mul(perp, w * 0.92)), add(add(to, mul(ax, 2.5 * k)), mul(perp, -w * 0.92))];
  polyShaded(F, pts, ax, m, G.BLANK, TH_CLOTH, 0.9);
  // dobra do lençol
  const s0 = add(from, mul(perp, -w));
  const s1 = add(from, mul(perp, w));
  const sm = F.mat('cloth', '#e8e4dc');
  capsule(F, s0, s1, 1.1 * k, 1.1 * k, sm, G.BLANK);
}

function tent(F: Fig, r: Rig, k: number): void {
  // lençol do parto: cai sobre os dois joelhos levantados (duas corcovas, dobras para baixo)
  const m = F.mat('cloth', '#e6e2da');
  const kL = r.legs[0].knee;
  const kR = r.legs[1].knee;
  const base = 2 * k;
  const x0 = Math.floor(kL[0] - 7 * k);
  const x1 = Math.ceil(kR[0] + 7 * k);
  const topAt = (x: number) => {
    const a = kL[1] - 1 * k + ((x - kL[0]) / (2.6 * k)) ** 2;
    const b = kR[1] - 1 * k + ((x - kR[0]) / (2.6 * k)) ** 2;
    const sag = Math.min(a, b);
    // entre os joelhos o pano faz uma "rede"
    const mid = (kL[0] + kR[0]) / 2;
    const between = x > kL[0] && x < kR[0] ? Math.max(kL[1], kR[1]) + 2.2 * k - Math.abs(x - mid) * 0.35 : 99;
    return Math.min(base, Math.min(sag, between));
  };
  for (let x = x0; x <= x1; x++) {
    const top = topAt(x + 0.5);
    for (let y = Math.floor(top); y <= Math.ceil(base); y++) {
      if (y + 0.5 < top) continue;
      // inclinação da superfície: lado esquerdo do morro claro, direito escuro
      const sl = topAt(x + 1.5) - topAt(x - 0.5);
      let t = sl > 0.5 ? 3 : sl < -0.5 ? 1 : 2;
      if (y - top > 6 * k) t = Math.min(t, 2);
      // dobras descendo dos joelhos
      for (const kn of [kL, kR]) {
        const dx = x + 0.5 - kn[0];
        if (Math.abs(Math.abs(dx) - (y - kn[1]) * 0.45) < 0.5 && y > kn[1] + 2) t = 1;
      }
      F.put(x, y, m, t, G.BLANK);
    }
  }
}

// -----------------------------------------------------------------------------
// Sinais clínicos no corpo (plano geral): sangue onde está o ferimento,
// espuma, vômito, queimadura, roxos, petéquias, suor, lágrimas, poeira…
// -----------------------------------------------------------------------------
export const BLOOD = ['#4a0a10', '#7a0c12', '#a3141c', '#c8302c'];

/** mancha de sangue irregular, só sobre a figura */
export function stain(F: Fig, c: V2, rx: number, ry: number, seed: number, cols = BLOOD): void {
  for (let y = Math.floor(c[1] - ry - 1); y <= Math.ceil(c[1] + ry + 1); y++)
    for (let x = Math.floor(c[0] - rx - 1); x <= Math.ceil(c[0] + rx + 1); x++) {
      const dx = (x + 0.5 - c[0]) / Math.max(0.8, rx);
      const dy = (y + 0.5 - c[1]) / Math.max(0.8, ry);
      const d = dx * dx + dy * dy;
      if (d > 1 - hash2(x, y, seed) * 0.45) continue;
      if (!F.has(x, y)) continue;
      F.ink(x, y, d < 0.35 ? cols[1] : dx + dy < -0.6 ? cols[3] : cols[2]);
    }
}

export function trickle(F: Fig, a: V2, dir: V2, n: number, col = BLOOD[2]): void {
  for (let i = 0; i < n; i++) {
    const x = a[0] + dir[0] * i;
    const y = a[1] + dir[1] * i;
    if (F.has(x, y)) F.ink(x, y, i === n - 1 ? BLOOD[1] : col);
  }
}

export function dots(F: Fig, c: V2, rx: number, ry: number, n: number, col: string, seed: number, onSkin?: number): void {
  for (let i = 0; i < n * 3 && n > 0; i++) {
    const x = c[0] + (hash2(i, 1, seed) - 0.5) * 2 * rx;
    const y = c[1] + (hash2(i, 2, seed) - 0.5) * 2 * ry;
    if (!F.has(x, y)) continue;
    if (onSkin !== undefined && F.L.matAt(Math.floor(x + F.ox), Math.floor(y + F.oy)) !== onSkin) continue;
    F.ink(x, y, col);
    n--;
  }
}

function signsOn(F: Fig, r: Rig, Lk: Look, sg: VideoSign[], s: FigSpec, k: number, D: Dim): void {
  const fax = r.fax;
  const perp: V2 = [fax[1], -fax[0]];
  const sqv = r.view === 'top' ? r.sq : 1;
  const H = (fx: number, fy: number): V2 => add(r.head, add(mul(perp, fx * r.hrx * sqv), mul(fax, fy * r.hry)));
  const skinM = F.mat('skin', Lk.skin);
  const wp = woundPoint(s, r, D, k);
  const down: V2 = r.view === 'top' ? [0, 1] : [0, 1];
  const blanket = !!r.blanket;
  if (sg.includes('sangue_tronco')) {
    const c = s.wound?.at === 'peito' ? r.chest : r.belly;
    stain(F, c, 3.4 * k, 2.8 * k, 11);
    trickle(F, add(c, [0.5 * k, 2.4 * k]), down, Math.round(3 * k));
  }
  if (sg.includes('sangue_perna') && !blanket) {
    const l = r.legs[1];
    const c = s.wound?.at === 'pe' ? l.ankle : s.wound?.at === 'joelho' ? l.knee : lerp(l.hip, l.knee, 0.55);
    stain(F, c, 2.6 * k, 3 * k, 13);
    trickle(F, add(c, [0, 2.4 * k]), down, Math.round(2.5 * k));
  }
  if (sg.includes('sangue_braco')) {
    const a = r.arms[1];
    const c = s.wound?.at === 'mao' ? a.w : lerp(a.e, a.w, 0.5);
    stain(F, c, 1.8 * k, 1.8 * k, 17);
  }
  if (sg.includes('sangue_cabeca') && r.view !== 'back') {
    const c = H(0.35, -0.55);
    stain(F, c, 1.6 * k, 1.4 * k, 19);
    trickle(F, H(0.55, -0.4), r.view === 'top' ? fax : [0.15, 1], Math.round(4 * k));
  }
  if (sg.includes('sangue_cabeca') && r.view === 'back') stain(F, H(0.2, -0.5), 2.2 * k, 1.8 * k, 19);
  if (sg.includes('sangue_rosto')) {
    stain(F, H(-0.35, -0.3), 1.2 * k, 1 * k, 23);
    trickle(F, H(-0.4, -0.15), r.view === 'top' ? fax : [0, 1], Math.round(3 * k));
  }
  if (sg.includes('sangue_nariz')) trickle(F, H(0.08, 0.36), fax, Math.max(2, Math.round(2.2 * k)));
  if (sg.includes('sangue_boca')) {
    const q = H(0.3, 0.62);
    F.ink(q[0], q[1], BLOOD[2]);
    trickle(F, add(q, fax), fax, Math.round(1.5 * k));
  }
  if (sg.includes('espuma') || sg.includes('baba')) {
    const n = sg.includes('espuma') ? 5 : 2;
    for (let i = 0; i < n; i++) {
      const q = H((hash2(i, 3, 5) - 0.5) * 0.8, 0.6 + hash2(i, 4, 5) * 0.25);
      F.ink(q[0], q[1], i % 2 ? '#f4f8fa' : '#d8e4ea');
    }
  }
  if (sg.includes('vomito') || sg.includes('vomito_sangue')) {
    const q = H(-0.2, 0.75);
    F.ink(q[0], q[1], sg.includes('vomito_sangue') ? '#4a2018' : '#a69a3c');
  }
  if (sg.includes('queimadura')) {
    const c = s.wound?.kind === 'queimadura' ? wp : r.chest;
    const burnM = F.mat('skin', mixLab(Lk.skin, '#d8564a', 0.55));
    for (let y = Math.floor(c[1] - 3.4 * k); y <= Math.ceil(c[1] + 3.4 * k); y++)
      for (let x = Math.floor(c[0] - 4 * k); x <= Math.ceil(c[0] + 4 * k); x++) {
        const d = ((x + 0.5 - c[0]) / (4 * k)) ** 2 + ((y + 0.5 - c[1]) / (3.2 * k)) ** 2;
        if (d > 1 - hash2(x, y, 29) * 0.3 || !F.has(x, y)) continue;
        F.put(x, y, burnM, d < 0.4 ? 3 : 2, 98);
        if (hash2(x, y, 31) < 0.12) F.ink(x, y, '#f4dccc');
      }
  }
  if (sg.includes('hematomas')) {
    const bruise = mixLab(Lk.skin, '#4a2a6a', 0.5);
    for (const a of r.arms) dots(F, lerp(a.e, a.w, 0.4), 1.6 * k, 1.6 * k, 3, bruise, 37, skinM);
    dots(F, H(0.4, 0.2), 0.3 * r.hrx, 0.25 * r.hry, 2, bruise, 41, skinM);
  }
  if (sg.includes('hematoma_olho') && r.view !== 'back') {
    const e = H(0.42, 0.06);
    const bruise = mixLab(Lk.skin, '#3a1a4a', 0.55);
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [-1, -1],
    ] as V2[]) {
      const q = add(e, [dx, dy]);
      if (F.has(q[0], q[1])) F.ink(q[0], q[1], bruise);
    }
  }
  if (sg.includes('manchas_roxas')) {
    const pur = '#6a1f5a';
    if (!blanket) for (const l of r.legs) dots(F, lerp(l.knee, l.ankle, 0.5), 2 * k, 3.5 * k, 5, pur, 43, skinM);
    for (const a of r.arms) dots(F, lerp(a.e, a.w, 0.5), 1.4 * k, 1.8 * k, 2, pur, 47, skinM);
    dots(F, r.head, r.hrx * 0.7, r.hry * 0.6, 3, pur, 53, skinM);
  }
  if (sg.includes('placas')) {
    const red = mixLab(Lk.skin, '#d84a4a', 0.4);
    dots(F, r.neck1, 2 * k, 1.4 * k, 3, red, 59, skinM);
    for (const a of r.arms) dots(F, lerp(a.s, a.w, 0.6), 1.8 * k, 3 * k, 4, red, 61, skinM);
  }
  if (sg.includes('suor') && r.view !== 'back') {
    const on = s.phase % 2 === 0;
    for (const [fx, fy] of [
      [-0.45, -0.38],
      [0.35, -0.5],
    ] as V2[]) {
      const q = H(fx, fy);
      F.ink(q[0], q[1], on ? '#f4fbff' : '#a8d4ec');
    }
  }
  if (sg.includes('chorando') && r.view !== 'back') {
    for (const sx of [-1, 1]) {
      const q = H(sx * 0.42, 0.3);
      F.ink(q[0], q[1], '#a8d8f0');
    }
  }
  if (sg.includes('molhado')) dots(F, lerp(r.shC, r.pelvis, 0.5), r.shW, 8 * k, 6, '#c8e4f4', 67);
  if (sg.includes('poeira')) {
    dots(F, lerp(r.shC, r.pelvis, 0.5), r.shW, 9 * k, 9, '#c8bca4', 71);
    dots(F, r.head, r.hrx, r.hry, 4, '#d8ccb4', 73);
  }
  if (sg.includes('curativo')) {
    const q = s.wound?.at === 'braco' ? lerp(r.arms[1].e, r.arms[1].w, 0.5) : H(0.3, -0.45);
    for (let i = -1; i <= 1; i++) for (let j = 0; j <= 1; j++) if (F.has(q[0] + i, q[1] + j)) F.ink(q[0] + i, q[1] + j, j ? '#e8e4dc' : '#f8f6f0');
  }
  if (sg.includes('livores') && r.view === 'top') {
    // manchas roxas no lado que encosta no chão (borda de baixo)
    const pur = mixLab(Lk.skin, '#5a2a6a', 0.45);
    for (const a of r.arms) dots(F, lerp(a.e, a.w, 0.5), 1.4 * k, 1 * k, 3, pur, 79, skinM);
    dots(F, r.neck1, 1.5 * k, 1 * k, 2, pur, 83, skinM);
  }
}

/** recém-nascido no peito da mãe, enrolado num pano claro (por cima da manta, para aparecer) */
function newborn(F: Fig, r: Rig, Lk: Look, k: number): void {
  const top = r.view === 'top';
  const c = add(r.chest, top ? [0, 0] : [0, 1.5 * k]);
  ellipseShaded(F, c, 4.4 * k, (top ? 2.8 : 3) * k, F.mat('cloth', '#f2f0ea'), G.BABY, TH_CLOTH);
  const head = add(c, top ? [-r.fax[0] * 3.6 * k, -0.4 * k] : [-3.2 * k, -1.4 * k]);
  ellipseShaded(F, head, 2.2 * k, 2 * k, F.mat('skin', mixLab(Lk.skin, '#e08a8a', 0.25)), G.BABY);
  // touquinha
  F.ink(head[0] - (top ? r.fax[0] * 1.6 * k : 0), head[1] - (top ? 0 : 1.6 * k), '#9ac8e8');
}

// -----------------------------------------------------------------------------
// Equipamento da equipe e objetos nas mãos
// -----------------------------------------------------------------------------
function gearOn(F: Fig, r: Rig, Lk: Look, gear: VideoGear[], k: number, D: Dim): void {
  const top = r.view === 'top';
  if (gear.includes('colar')) {
    const m = F.mat('cloth', '#e07a2a');
    capsule(F, r.neck0, r.neck1, r.hrx * 0.62, r.hrx * 0.66, m, G.GEAR);
  }
  if (gear.includes('mascara_o2') || gear.includes('ambu')) {
    const c = add(r.head, mul(r.fax, r.hry * 0.5));
    const m = F.mat('cloth', '#bfe8d0');
    ellipseShaded(F, c, (top ? 1.6 : 1.9) * k, (top ? 1.9 : 1.5) * k, m, G.GEAR, TH_CLOTH);
    if (gear.includes('ambu')) {
      const bag = add(c, mul(r.fax, 4.5 * k));
      capsule(F, c, bag, 1 * k, 2 * k, F.mat('cloth', '#e8b931'), G.GEAR);
    }
  }
  if (gear.includes('manta')) {
    const m = F.mat('cloth', '#d8c070');
    const from = r.chest;
    const to = lerp(r.legs[0].ankle, r.legs[1].ankle, 0.5);
    const ax = norm(sub(to, from));
    const perp: V2 = [-ax[1], ax[0]];
    const w = (D.sh + 3) * k * (top ? r.sq : 1);
    polyShaded(F, [add(from, mul(perp, -w)), add(from, mul(perp, w)), add(to, mul(perp, w)), add(to, mul(perp, -w))], ax, m, G.GEAR, [-0.3, 0.1, 0.5, 0.8], 0.95);
  }
  if (gear.includes('toalha')) {
    // toalha de banho nos ombros (saiu da água, tremendo)
    const col = ['#e8a33d', '#3f8ac8', '#d86a8a', '#4fa86a'][Math.floor(hash2(Lk.tone, Lk.hair.length, 7) * 4) % 4];
    const m = F.mat('cloth', col);
    if (top) {
      const from = r.chest;
      const to = lerp(r.pelvis, lerp(r.legs[0].knee, r.legs[1].knee, 0.5), 0.3);
      const ax = norm(sub(to, from));
      const perp: V2 = [-ax[1], ax[0]];
      const w = (D.sh + 2.4) * k * r.sq;
      polyShaded(F, [add(from, mul(perp, -w)), add(from, mul(perp, w)), add(to, mul(perp, w)), add(to, mul(perp, -w))], ax, m, G.GEAR, TH_CLOTH, 0.95);
    } else {
      const c = r.shC;
      const w = r.shW + 2.2 * k;
      const y0 = c[1] - 1.6 * k;
      const y1 = lerp(r.shC, r.pelvis, 0.85)[1];
      polyShaded(F, [[c[0] - w + 1.5 * k, y0], [c[0] + w - 1.5 * k, y0], [c[0] + w + 1.2 * k, y1], [c[0] - w - 1.2 * k, y1]], [0, 1], m, G.GEAR, TH_CLOTH, 0.9);
      for (const yy of [y1 - 2 * k, y1 - 3 * k]) for (let x = Math.floor(c[0] - w); x <= Math.ceil(c[0] + w); x++) if (F.has(x, yy) && F.grpAt(x, yy) === G.GEAR) F.ink(x, yy, mixLab(col, '#ffffff', 0.45));
      // a frente aberta: o peito aparece no meio
      for (let y = Math.floor(y0 + 2 * k); y <= y1; y++) for (let x = Math.floor(c[0] - 1.2 * k); x <= Math.ceil(c[0] + 1.2 * k); x++) if (F.grpAt(x, y) === G.GEAR) F.put(x, y, F.mat(Lk.top === Lk.skin ? 'skin' : 'cloth', Lk.top), 2, G.TORSO);
    }
  }
  if (gear.includes('torniquete')) {
    const l = r.legs[1];
    const p = lerp(l.hip, l.knee, 0.28);
    const d = norm(sub(l.knee, l.hip));
    const pp: V2 = [-d[1], d[0]];
    const w = D.lr0 * k * 1.25;
    capsule(F, add(p, mul(pp, -w)), add(p, mul(pp, w)), 0.8 * k, 0.8 * k, F.mat('cloth', '#26262c'), G.GEAR);
  }
  if (gear.includes('tala')) {
    const l = r.legs[1];
    capsule(F, lerp(l.hip, l.knee, 0.5), lerp(l.knee, l.ankle, 0.85), 1 * k, 1 * k, F.mat('cloth', '#e8a33d'), G.GEAR);
  }
  if (gear.includes('compressa')) {
    const p = woundPoint({ look: Lk, pose: 'deitado', k, dir: 1, phase: 0 } as FigSpec, r, D, k);
    const m = F.mat('cloth', '#f2f2ee');
    ellipseShaded(F, p, 2.2 * k, 1.6 * k, m, G.GEAR, TH_CLOTH);
    F.ink(p[0] + 0.5, p[1], '#a3141c');
  }
  if (gear.includes('soro')) {
    // acesso no antebraço: esparadrapo branco
    const a = r.arms[0];
    const p = lerp(a.e, a.w, 0.6);
    F.ink(p[0], p[1], '#f2f2ee');
    F.ink(p[0] + 1, p[1], '#f2f2ee');
  }
  if (gear.includes('oximetro')) {
    const a = r.arms[1];
    F.ink(a.w[0], a.w[1] + 1, '#3a6ab0');
  }
}

function held(F: Fig, r: Rig, s: FigSpec, k: number): void {
  const hR = r.arms[1].w;
  const hL = r.arms[0].w;
  switch (s.hold) {
    case 'celular': {
      const m = F.mat('cloth', '#26262c');
      const c = lerp(hL, hR, 0.5);
      for (let y = -2; y <= 1; y++) for (let x = -1; x <= 0; x++) F.put(c[0] + x, c[1] + y - 1 * k, m, 1, G.GEAR);
      break;
    }
    case 'lanterna': {
      const m = F.mat('cloth', '#3a3a40');
      capsule(F, hR, add(hR, [2.5 * k, 1 * k]), 0.8 * k, 1 * k, m, G.GEAR);
      F.ink(hR[0] + 3 * k, hR[1] + 1 * k, '#fff6c8');
      break;
    }
    case 'bebe': {
      // bebê enrolado na manta
      const c = add(lerp(hL, hR, 0.5), [0, -1.5 * k]);
      const m = F.mat('cloth', '#e8d8a0');
      ellipseShaded(F, c, 4 * k, 2.4 * k, m, G.BABY, TH_CLOTH);
      ellipseShaded(F, add(c, [-3.2 * k, -0.8 * k]), 1.8 * k, 1.7 * k, F.mat('skin', s.look.skin), G.BABY);
      break;
    }
    case 'pano':
    case 'papelao': {
      const m = F.mat('cloth', s.hold === 'pano' ? '#e8e4dc' : '#b8945a');
      const c = hR;
      ellipseShaded(F, add(c, [0, -1.5 * k]), 2.4 * k, 1.8 * k, m, G.GEAR, TH_CLOTH);
      break;
    }
    case 'garrafa': {
      const m = F.mat('cloth', '#3f8a4a');
      capsule(F, add(hR, [0, -2.5 * k]), add(hR, [0, 2 * k]), 0.9 * k, 1.1 * k, m, G.GEAR);
      break;
    }
    case 'pau': {
      const m = F.mat('cloth', '#7a5236');
      capsule(F, add(hR, [-2 * k, 6 * k]), add(hR, [3 * k, -9 * k]), 0.7 * k, 0.7 * k, m, G.GEAR);
      break;
    }
    case 'bolsa_soro': {
      const m = F.mat('cloth', '#d8eef4');
      const c = add(hR, [0, -3 * k]);
      ellipseShaded(F, c, 1.6 * k, 2.4 * k, m, G.GEAR, TH_CLOTH);
      break;
    }
    case 'caneta': {
      const m = F.mat('cloth', '#3a5aa0');
      capsule(F, hR, add(hR, [3 * k, -1 * k]), 0.5 * k, 0.5 * k, m, G.GEAR);
      break;
    }
    case 'colher': {
      // colher de cozinha (o cabo na mão, a concha para cima)
      const m = F.mat('cloth', '#c8ccd0');
      capsule(F, hR, add(hR, [1.5 * k, -4 * k]), 0.4 * k, 0.4 * k, m, G.GEAR);
      ellipseShaded(F, add(hR, [1.8 * k, -5 * k]), 0.9 * k, 1.3 * k, m, G.GEAR, TH_CLOTH);
      break;
    }
    case 'galao': {
      // galão de veneno sem rótulo
      const m = F.mat('cloth', '#e8e4dc');
      ellipseShaded(F, add(hR, [0, 2.4 * k]), 2.2 * k, 2.8 * k, m, G.GEAR, TH_CLOTH);
      F.ink(hR[0], hR[1] - 0.6 * k, '#3a7a3a');
      break;
    }
    default:
      break;
  }
}
