// =============================================================================
// Videochamada: a aparência de cada pessoa da cena (paciente e figurantes).
//
// Uma aparência só, sorteada UMA vez pela semente (ligação + papel), e usada por
// todos os enquadramentos: plano geral, rosto (faces.ts), peito, mãos, pernas,
// ferimento. Antes o rosto sorteava tom de pele, cabelo e camisa com outro
// gerador e saía "branco no plano geral, moreno no close".
// Os sorteios acontecem sempre na mesma ordem; o que a cena define (tom, roupa,
// capacete) só substitui o resultado. Puro (sem DOM).
// =============================================================================
import { SKIN, HAIR } from './palette';
import { mulberry, hashStr } from './pix';
import { tintsFor, faceHairChoices, type FaceHair } from './faces';
import type { VideoAge, VideoHat, VideoPlace, VideoSkin, VideoWear } from '../../engine/types';

export type Legs = 'calca' | 'bermuda' | 'saia' | 'shorts' | 'fralda' | 'saia_longa';
export type Sleeve = 'curta' | 'longa' | 'regata' | 'nenhuma';

export interface Look {
  age: VideoAge;
  sex: 'M' | 'F';
  /** índice em SKIN (0 claro … 4 escuro) */
  tone: number;
  skinBase: string;
  /** pele já com o estado (pálido, cianose…) — a mesma cor do close do rosto */
  skin: string;
  lip: string;
  state: VideoSkin;
  hair: string;
  style: FaceHair;
  beard: boolean;
  glasses: boolean;
  wear: VideoWear;
  /** roupa de cima, detalhe (listra, faixa refletiva, gola) */
  top: string;
  top2: string;
  sleeve: Sleeve;
  bottom: string;
  legs: Legs;
  /** sapato; '' = descalço; 'chinelo' desenha só a tira */
  shoes: string;
  chinelo: boolean;
  /** vestido: a parte de baixo é a mesma peça */
  dress: boolean;
  hat?: VideoHat;
  hatColor: string;
  /** estampa da camiseta: listras, logo no peito */
  print: 'liso' | 'listras' | 'logo' | 'xadrez' | 'flores';
}

export const TOPS = ['#3f6f9a', '#a8443c', '#4f7f4a', '#7a5a9a', '#c08a3a', '#3c3c44', '#5a8a8a', '#b86a8a', '#6a6a6a', '#2f5f7f', '#d8d0c0', '#8a3a4a', '#d0a040', '#e4e0d6', '#6b8f3a', '#c86a3a'];
const BOTTOMS = ['#2f3a4f', '#3b5577', '#4a3f35', '#5a5a60', '#2a2a30', '#8a7a5a', '#3a4a3a', '#46506a'];
const SHOES = ['#2a2420', '#d8d4cc', '#5a3a2a', '#2a2a3a', '#a03a2a', '#e8e4dc'];
const PASTEL = ['#9cc0dc', '#e0a8b8', '#c8d8a8', '#e8d8a0', '#c0b0dc', '#e8e4dc'];

export interface LookSpec {
  age: VideoAge;
  sex?: 'M' | 'F';
  tone?: number;
  state?: VideoSkin;
  wear?: VideoWear;
  /** null = sem chapéu/capacete mesmo que a roupa peça */
  hat?: VideoHat | null;
  /** lugar e luz ajudam a escolher roupa quando ninguém disse (praia → roupa de banho, noite no quarto → pijama) */
  place?: VideoPlace;
  night?: boolean;
  /** figurante: roupa do papel */
  roleWear?: VideoWear;
}

const lookCache = new Map<string, Look>();

/** aparência determinística: semente + idade + sexo (+ o que a cena fixa) */
export function lookFor(seed: string, s: LookSpec): Look {
  const key = seed + '|' + JSON.stringify(s);
  const hit = lookCache.get(key);
  if (hit) return hit;
  const r = mulberry(hashStr(seed + ':look'));
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(r() * a.length) % a.length];
  const age = s.age;
  // sexo: se a cena não diz, sorteia (sempre consome o sorteio)
  const sexR: 'M' | 'F' = r() < 0.5 ? 'M' : 'F';
  const sex = s.sex ?? sexR;
  // ---- tom de pele
  const toneR = Math.floor(r() * SKIN.length) % SKIN.length;
  const tone = Math.max(0, Math.min(SKIN.length - 1, Math.round(s.tone ?? toneR)));
  const skinBase = SKIN[tone];
  const state = s.state ?? 'normal';
  const faceAge = age;
  const tint = tintsFor(skinBase, state, faceAge === 'adolescente' ? 'adulto' : faceAge);
  // ---- cabelo (mesma regra do close: idoso grisalho, bebê de pele escura com cabelo preto)
  const h1 = r();
  const h2 = r();
  let hair: string;
  if (age === 'idoso') hair = h1 < 0.5 ? HAIR[3] : HAIR[4];
  else if (tone >= 3) hair = h1 < 0.75 ? HAIR[0] : HAIR[1];
  else hair = HAIR[Math.floor(h2 * 3) % 3];
  const styles = faceHairChoices(age, sex);
  const style = pick(styles);
  const beardR = r();
  const beard = sex === 'M' && (age === 'adulto' || age === 'idoso') && beardR < 0.35;
  const glassesR = r();
  const glasses = (age === 'idoso' && glassesR < 0.45) || (age === 'adulto' && glassesR < 0.12);
  // ---- roupa
  const topR = pick(TOPS);
  const top2R = pick(TOPS);
  const bottomR = pick(BOTTOMS);
  const shoesR = pick(SHOES);
  const legsR = r();
  const sleeveR = r();
  const printR = r();
  const dressR = r();
  const pastelR = pick(PASTEL);
  const chineloR = r();
  let wear: VideoWear = s.wear ?? s.roleWear ?? 'casual';
  if (!s.wear && !s.roleWear) {
    if (age === 'bebe') wear = 'fralda';
    else if (s.place === 'praia' || s.place === 'piscina' || s.place === 'rio') wear = dressR < 0.7 ? 'banho' : 'casual';
    else if (s.place === 'obra') wear = 'obra';
    else if (s.place === 'fabrica') wear = 'uniforme';
    else if (s.place === 'padaria' && age === 'adulto') wear = 'avental';
    else if (s.place === 'academia') wear = 'esporte';
    else if ((s.place === 'escola' || s.place === 'quadra') && (age === 'crianca' || age === 'adolescente')) wear = 'escolar';
    else if (s.place === 'quarto' && s.night && dressR < 0.6) wear = 'pijama';
    else if (s.place === 'igreja' && age !== 'crianca') wear = sex === 'F' ? 'vestido' : 'social';
    else if (sex === 'F' && (age === 'adulto' || age === 'idoso') && dressR < 0.22) wear = 'vestido';
  }
  const L: Look = {
    age,
    sex,
    tone,
    skinBase,
    skin: tint.skin,
    lip: tint.lip,
    state,
    hair,
    style,
    beard,
    glasses,
    wear,
    top: topR,
    top2: top2R === topR ? '#e4e0d6' : top2R,
    sleeve: age === 'idoso' ? (sleeveR < 0.6 ? 'longa' : 'curta') : sleeveR < 0.14 ? 'longa' : sex === 'M' && sleeveR > 0.9 ? 'regata' : 'curta',
    bottom: bottomR,
    legs: age === 'crianca' ? (legsR < 0.55 ? 'bermuda' : 'calca') : sex === 'F' ? (legsR < 0.55 ? 'calca' : legsR < 0.75 ? 'saia' : 'bermuda') : legsR < 0.62 ? 'calca' : 'bermuda',
    shoes: shoesR,
    chinelo: chineloR < 0.3,
    dress: false,
    hatColor: '#c8352a',
    print: printR < 0.62 ? 'liso' : printR < 0.76 ? 'listras' : printR < 0.88 ? 'logo' : printR < 0.95 ? 'xadrez' : 'flores',
  };
  applyWear(L, wear, pastelR, r);
  // capacete/boné: a roupa sugere, a cena manda
  if (s.hat === null) L.hat = undefined;
  else if (s.hat) L.hat = s.hat;
  if (L.hat === 'capacete_obra') L.hatColor = pick(['#e8b931', '#e8e4dc', '#e07a2a', '#3a7ad0']);
  else if (L.hat === 'capacete') L.hatColor = pick(['#c8352a', '#2a2a30', '#e8e4dc', '#3a5aa0']);
  else if (L.hat === 'bone') L.hatColor = pick(['#2f3f5f', '#a8443c', '#3c3c44', '#e4e0d6']);
  else if (L.hat === 'quepe') L.hatColor = '#3a4048';
  else if (L.hat === 'touca') L.hatColor = pick(['#a8443c', '#3f6f9a', '#d8d0c0']);
  if (lookCache.size > 400) lookCache.delete(lookCache.keys().next().value as string);
  lookCache.set(key, L);
  return L;
}

function applyWear(L: Look, w: VideoWear, pastel: string, r: () => number) {
  switch (w) {
    case 'fralda':
      // bebê: body de algodão (cor clara) por cima da fralda, braços e pernas de fora
      L.legs = 'fralda';
      L.top = r() < 0.75 ? pastel : '#f2f0ea';
      L.bottom = L.top;
      L.sleeve = r() < 0.7 ? 'curta' : 'longa';
      L.shoes = '';
      L.print = 'liso';
      break;
    case 'pijama':
      L.top = pastel;
      L.top2 = '#f2f0ea';
      L.bottom = pastel;
      L.legs = 'calca';
      L.sleeve = 'longa';
      L.shoes = '';
      L.print = r() < 0.5 ? 'liso' : 'listras';
      break;
    case 'escolar':
      L.top = '#e8e6e0';
      L.top2 = '#2f5f9f';
      L.bottom = '#2f3f6a';
      L.legs = L.age === 'crianca' && r() < 0.5 ? 'bermuda' : 'calca';
      L.sleeve = 'curta';
      L.shoes = r() < 0.5 ? '#2a2a30' : '#e8e4dc';
      L.print = 'logo';
      break;
    case 'obra':
      L.top = r() < 0.5 ? '#5a6a7a' : '#8a7a5a';
      L.top2 = '#e8b931';
      L.bottom = '#3b5577';
      L.legs = 'calca';
      L.sleeve = 'curta';
      L.shoes = '#4a3424';
      L.hat = 'capacete_obra';
      L.print = 'liso';
      break;
    case 'motoboy':
      L.top = r() < 0.6 ? '#2a2a30' : '#2f3f5f';
      L.top2 = '#e8d040';
      L.bottom = '#2f3a4f';
      L.legs = 'calca';
      L.sleeve = 'longa';
      L.shoes = '#2a2420';
      L.hat = 'capacete';
      L.print = 'listras';
      break;
    case 'social':
      L.top = r() < 0.5 ? '#e8e6e0' : '#b8cce0';
      L.top2 = '#3a3a50';
      L.bottom = '#2a2a30';
      L.legs = 'calca';
      L.sleeve = r() < 0.5 ? 'longa' : 'curta';
      L.shoes = '#2a2018';
      L.print = 'logo';
      break;
    case 'esporte':
      L.top = r() < 0.5 ? '#c8352a' : r() < 0.5 ? '#3a7ad0' : '#2a2a30';
      L.top2 = '#e8e4dc';
      L.bottom = '#2a2a30';
      L.legs = L.sex === 'F' ? 'calca' : 'shorts';
      L.sleeve = L.sex === 'M' && r() < 0.5 ? 'regata' : 'curta';
      L.shoes = '#e8e4dc';
      L.print = 'liso';
      break;
    case 'banho':
      if (L.sex === 'M' || L.age === 'crianca') {
        L.top = L.skin;
        L.sleeve = 'nenhuma';
        L.legs = 'shorts';
        L.bottom = r() < 0.5 ? '#3a7ad0' : '#c8352a';
      } else {
        L.top = r() < 0.5 ? '#c8352a' : '#2a6a8a';
        L.bottom = L.top;
        L.sleeve = 'nenhuma';
        L.legs = 'fralda'; // maiô: a peça de baixo é curta
      }
      L.shoes = '';
      L.print = 'liso';
      break;
    case 'vestido':
      L.dress = true;
      L.legs = L.age === 'idoso' ? 'saia_longa' : 'saia';
      L.bottom = L.top;
      L.sleeve = r() < 0.6 ? 'curta' : 'regata';
      L.print = r() < 0.5 ? 'flores' : 'liso';
      L.chinelo = true;
      break;
    case 'farda':
      L.top = '#6a7078';
      L.top2 = '#2a2e34';
      L.bottom = '#5a6068';
      L.legs = 'calca';
      L.sleeve = 'curta';
      L.shoes = '#1e1c1c';
      L.hat = 'quepe';
      L.print = 'logo';
      break;
    case 'bombeiro':
      L.top = '#a8885a';
      L.top2 = '#d8d040';
      L.bottom = '#a8885a';
      L.legs = 'calca';
      L.sleeve = 'longa';
      L.shoes = '#1e1c1c';
      L.print = 'listras';
      break;
    case 'socorrista':
      L.top = '#e8702a';
      L.top2 = '#c8ccd0';
      L.bottom = '#e8702a';
      L.legs = 'calca';
      L.sleeve = 'curta';
      L.shoes = '#1e1c1c';
      L.print = 'listras';
      break;
    case 'seguranca':
      L.top = '#26262c';
      L.top2 = '#c8ccd0';
      L.bottom = '#26262c';
      L.legs = 'calca';
      L.sleeve = 'curta';
      L.shoes = '#1e1c1c';
      L.print = 'logo';
      break;
    case 'lanchonete':
      L.top = r() < 0.5 ? '#c8352a' : '#e8b931';
      L.top2 = '#f2f0ea';
      L.bottom = '#2a2a30';
      L.legs = 'calca';
      L.sleeve = 'curta';
      L.shoes = '#1e1c1c';
      L.hat = 'bone';
      L.print = 'logo';
      break;
    case 'avental':
      L.top2 = '#f2f0ea';
      L.print = 'liso';
      break;
    case 'uniforme':
      L.top = r() < 0.5 ? '#2f6a9a' : '#3f7a4a';
      L.top2 = '#f2f0ea';
      L.bottom = '#2f3a4f';
      L.legs = 'calca';
      L.sleeve = 'curta';
      L.print = 'logo';
      break;
    case 'jaleco':
      L.top = '#f2f2ee';
      L.top2 = '#9ab8d0';
      L.sleeve = 'longa';
      L.print = 'liso';
      break;
    case 'sem_camisa':
      L.top = L.skin;
      L.sleeve = 'nenhuma';
      L.print = 'liso';
      break;
    default:
      break;
  }
  // a pele de quem está sem camisa acompanha o estado
  if (L.sleeve === 'nenhuma' && (w === 'sem_camisa' || (w === 'banho' && L.top !== L.bottom) || w === 'fralda')) L.top = L.skin;
}

/** índice de tom e cores que o close do rosto (faces.ts) precisa para bater com o corpo */
export function faceLook(L: Look): { skin: number; hair: string; hairStyle: FaceHair; shirt: string; beard: boolean } {
  return { skin: L.tone, hair: L.hair, hairStyle: L.style, shirt: L.top === L.skin ? L.skin : L.top, beard: L.beard };
}
