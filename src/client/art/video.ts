// =============================================================================
// Videochamada (Programa VER) e vista da equipe na Intervenção.
//
// A cena (VideoScene) vira um "palco" montado uma vez por ligação: o lugar
// (videoPlace), os móveis em que o paciente está, os objetos (videoProps), quem
// está em volta e o paciente (videoFigure), tudo com UMA aparência por pessoa
// (videoLook) e a luz do lugar (videoLight). Os enquadramentos são janelas
// sobre esse mesmo palco: o plano geral, "em volta" (a câmera vira), as pessoas;
// os closes (rosto, peito, mãos, pernas, ferimento, objeto, chão) usam a mesma
// aparência, o mesmo lugar e a mesma luz (videoClose).
//
// Quadro nativo VIDEO_W × VIDEO_H (4:3). A VER é a câmera do celular de quem liga
// (tremida, compressão, travamento com sinal ruim, vinheta e ruído no escuro);
// a Intervenção ("campo") é o olho da equipe: imagem limpa e, à noite, a luz
// das lanternas e dos faróis da ambulância.
// Puro até virar canvas (seguro em Node). Determinístico pela semente.
// =============================================================================
import { Pix, presentPix, mulberry, hashStr, bayerOn } from './pix';
import type { VideoScene, VideoFocus, VideoPose, VideoProp, VideoExtra, VideoRole, VideoAct, VideoAge, VideoWear, VideoPatient, VideoPlace } from '../../engine/types';
import { lookFor, type Look } from './videoLook';
import { drawFigure, type FigOut, type FigPose, type FigSpec, type V2 } from './videoFigure';
import { PLACES, WORLD_W, WORLD_H, VIEW_W, drawSofa, drawChair, drawBed, drawCrib, drawBench, drawBusSeat, drawPew, drawTable, type Layout, type PlaceCtx, type SeatKind } from './videoPlace';
import { propSprite, PROP_HOME } from './videoProps';
import { lightMap, applyLight, lightModeFor, type LightMap, type LightMode } from './videoLight';
import { renderClose } from './videoClose';

export const VIDEO_H = 144;
/** 4:3 */
export const VIDEO_W = (VIDEO_H * 4) / 3;

export interface VideoFrameOpts {
  scene: VideoScene;
  focus: VideoFocus;
  signal: 'bom' | 'fraco' | 'ruim';
  /** ms (animação) */
  t: number;
  /** semente estável por ligação (aparência das pessoas, objetos) */
  seed: string;
  /** 0..1 conectando (tela de espera) */
  connecting?: number;
  /** 'ver' = câmera do celular de quem liga (padrão); 'campo' = a equipe está lá (Intervenção) */
  view?: 'ver' | 'campo';
}

// -----------------------------------------------------------------------------
// Palco
// -----------------------------------------------------------------------------
export interface Actor {
  id: string;
  patient: boolean;
  look: Look;
  pose: FigPose;
  act?: VideoAct;
  role?: VideoRole;
  /** âncora no mundo */
  x: number;
  y: number;
  k: number;
  dir: 1 | -1;
  /** quadros de animação e duração de cada um (ms) */
  phases: number;
  period: number;
  reach?: V2;
  hold?: FigSpec['hold'];
  gaze?: number;
  frames: Map<number, { fig: FigOut; pix: Pix; front?: Pix }>;
  spec: Omit<FigSpec, 'phase' | 'k' | 'dir' | 'look' | 'pose'>;
  /** desenhado acima da âncora (bebê no colo: a âncora fica no chão, para a ordem de desenho) */
  lift?: number;
}

/** y em que o ator é desenhado (âncora menos o colo) */
export const drawY = (a: Actor) => a.y - (a.lift ?? 0);

interface PlacedProp {
  prop: VideoProp;
  x: number;
  y: number;
  k: number;
  variant?: string;
}

export interface Stage {
  key: string;
  scene: VideoScene;
  seed: string;
  view: 'ver' | 'campo';
  layout: Layout;
  mode: LightMode;
  lm: LightMap;
  /** fundo já iluminado (mundo 256×144) */
  bg: Pix;
  /** coisas na frente das pessoas (mesa na frente do debruçado, volante) já iluminadas */
  fg?: Pix;
  actors: Actor[];
  patient?: Actor;
  props: PlacedProp[];
  /** luzes que piscam (giroflex, fogo) */
  flashers: { x: number; y: number; r: number; colors: string[]; period: number }[];
  camX: number;
  envX: number;
  peopleX: number;
  rain: boolean;
  place: VideoPlace;
}

const stages = new Map<string, Stage>();

/** lugares sem letreiro nem lado certo: podem aparecer espelhados */
const MIRROR: VideoPlace[] = ['sala', 'quarto', 'cozinha', 'banheiro', 'corredor', 'quintal', 'escada', 'campo', 'chacara', 'praia', 'rio', 'piscina', 'obra', 'academia', 'escritorio', 'igreja', 'estacionamento', 'alagado', 'telhado', 'praca', 'fabrica'];

const LYING: VideoPose[] = ['deitado', 'caido', 'convulsao', 'lateral', 'brucos', 'cama'];
export const isLyingPose = (p: VideoPose | FigPose) => (LYING as string[]).includes(p);

/** escala pela profundidade (1 perto do paciente; menor no fundo) */
function kAt(lay: Layout, y: number): number {
  const ref = 116;
  const t = (y - lay.floorY) / Math.max(10, ref - lay.floorY);
  return Math.max(0.5, Math.min(1.22, 0.62 + 0.38 * t));
}

/** idade, sexo e roupa padrão de figurante por papel */
function roleDefaults(role: VideoRole, pt: VideoPatient | null | undefined, place: VideoPlace, r: () => number): { age: VideoAge; sex: 'M' | 'F'; wear?: VideoWear } {
  const pa = pt?.age ?? 'adulto';
  const older = (a: VideoAge): VideoAge => (a === 'bebe' || a === 'crianca' || a === 'adolescente' ? 'adulto' : 'idoso');
  const younger = (a: VideoAge): VideoAge => (a === 'idoso' ? 'adulto' : a === 'adulto' ? (r() < 0.5 ? 'adolescente' : 'crianca') : 'crianca');
  switch (role) {
    case 'mae':
      return { age: older(pa), sex: 'F' };
    case 'pai':
      return { age: older(pa), sex: 'M' };
    case 'esposa':
      return { age: pa === 'idoso' ? 'idoso' : 'adulto', sex: 'F' };
    case 'marido':
      return { age: pa === 'idoso' ? 'idoso' : 'adulto', sex: 'M' };
    case 'filho':
      return { age: younger(pa), sex: 'M' };
    case 'filha':
      return { age: younger(pa), sex: 'F' };
    case 'avo':
      return { age: 'idoso', sex: r() < 0.6 ? 'F' : 'M' };
    case 'neto':
      return { age: r() < 0.5 ? 'crianca' : 'adolescente', sex: r() < 0.5 ? 'F' : 'M' };
    case 'irmao':
      return { age: pa === 'bebe' ? 'crianca' : pa, sex: 'M' };
    case 'irma':
      return { age: pa === 'bebe' ? 'crianca' : pa, sex: 'F' };
    case 'crianca':
      return { age: 'crianca', sex: r() < 0.5 ? 'F' : 'M' };
    case 'bebe':
      return { age: 'bebe', sex: r() < 0.5 ? 'F' : 'M' };
    case 'policial':
      return { age: 'adulto', sex: r() < 0.75 ? 'M' : 'F', wear: 'farda' };
    case 'bombeiro':
      return { age: 'adulto', sex: 'M', wear: 'bombeiro' };
    case 'seguranca':
      return { age: 'adulto', sex: 'M', wear: 'seguranca' };
    case 'socorrista':
      return { age: 'adulto', sex: r() < 0.7 ? 'M' : 'F', wear: 'socorrista' };
    case 'enfermeira':
      return { age: 'adulto', sex: r() < 0.75 ? 'F' : 'M', wear: 'jaleco' };
    case 'garcom':
      return { age: 'adulto', sex: 'M', wear: 'avental' };
    case 'professor':
      return { age: 'adulto', sex: r() < 0.6 ? 'F' : 'M' };
    case 'aluno':
      return { age: r() < 0.5 ? 'crianca' : 'adolescente', sex: r() < 0.5 ? 'F' : 'M', wear: 'escolar' };
    case 'colega':
      return {
        age: 'adulto',
        sex: place === 'obra' ? 'M' : r() < 0.5 ? 'F' : 'M',
        wear: place === 'obra' ? 'obra' : place === 'academia' ? 'esporte' : place === 'padaria' ? 'avental' : place === 'escritorio' ? 'social' : place === 'loja' || place === 'mercado' || place === 'fabrica' ? 'uniforme' : undefined,
      };
    case 'motorista':
    case 'atirador':
      return { age: 'adulto', sex: 'M' };
    case 'fiel':
      return { age: r() < 0.5 ? 'idoso' : 'adulto', sex: r() < 0.6 ? 'F' : 'M' };
    default:
      return { age: r() < 0.15 ? 'idoso' : r() < 0.2 ? 'adolescente' : 'adulto', sex: r() < 0.5 ? 'F' : 'M', wear: place === 'praia' || place === 'piscina' ? (r() < 0.6 ? 'banho' : undefined) : undefined };
  }
}

const FAMILY: VideoRole[] = ['mae', 'pai', 'filho', 'filha', 'avo', 'neto', 'irmao', 'irma', 'familiar', 'bebe'];
const HOME_PLACES: VideoPlace[] = ['sala', 'quarto', 'cozinha', 'banheiro', 'quintal', 'escada', 'porta', 'corredor', 'chacara', 'campo'];

/** figurantes padrão quando a cena só diz quantos são */
function defaultCast(sc: VideoScene, r: () => number): VideoExtra[] {
  const pt = sc.patient;
  const n = Math.max(0, Math.min(5, (sc.people ?? 1) - (pt ? 1 : 0)));
  if (!n) return [];
  const place = sc.place;
  const home = HOME_PLACES.includes(place);
  const role = (i: number): VideoRole => {
    if (sc.laughing) return 'curioso';
    if (home) return i === 0 ? (pt?.age === 'bebe' || pt?.age === 'crianca' ? 'mae' : pt?.age === 'idoso' ? (r() < 0.5 ? 'filha' : 'filho') : r() < 0.5 ? 'esposa' : 'marido') : 'familiar';
    if (place === 'obra' || place === 'padaria' || place === 'academia' || place === 'escritorio' || place === 'fabrica' || place === 'central') return 'colega';
    if (place === 'escola' || place === 'quadra') return i === 0 ? 'professor' : 'aluno';
    if (place === 'igreja') return 'fiel';
    if (place === 'onibus') return i === 0 ? 'motorista' : 'passageiro';
    if (place === 'hospital') return i === 0 ? 'enfermeira' : 'curioso';
    if (place === 'bar') return i === 0 ? 'garcom' : 'curioso';
    return 'curioso';
  };
  const grave = !!pt && (pt.skin === 'cinza' || pt.skin === 'cianose' || (pt.signs ?? []).includes('olhos_fechados') || pt.pose === 'convulsao');
  const lying = !!pt && isLyingPose(pt.pose);
  const out: VideoExtra[] = [];
  for (let i = 0; i < n; i++) {
    let act: VideoAct = 'olhando';
    let at: VideoExtra['at'] = i % 2 === 0 ? 'fundo' : r() < 0.5 ? 'esq' : 'dir';
    if (sc.laughing) {
      act = i === 0 ? 'filmando' : 'rindo';
      at = i === 0 ? 'fundo' : i % 2 ? 'esq' : 'dir';
    } else if (i === 0 && lying && grave && pt?.pose !== 'convulsao') {
      act = home ? 'segurando_mao' : 'ajoelhado';
      at = 'fundo';
    } else if (i === 0 && lying) {
      act = 'ajoelhado';
      at = 'fundo';
    } else if (!home && i >= 1) act = r() < 0.35 ? 'filmando' : r() < 0.5 ? 'mao_na_boca' : 'olhando';
    else if (home && i >= 1) act = r() < 0.4 ? 'mao_na_boca' : 'olhando';
    if (place === 'onibus' && role(i) === 'passageiro') act = 'sentado';
    out.push({ role: role(i), act, at });
  }
  return out;
}

/** pose do figurante a partir da ação */
function poseForAct(act: VideoAct | undefined): FigPose {
  switch (act) {
    case 'rcp':
    case 'ventilando':
      return 'rcp';
    case 'comprimindo':
    case 'segurando_cabeca':
    case 'segurando_mao':
      return 'ajoelhado_maos';
    case 'ajoelhado':
      return 'ajoelhado';
    case 'agachado':
    case 'escondido':
      return 'agachado';
    case 'sentado':
      return 'sentado';
    case 'deitado':
      return 'deitado';
    case 'ferido':
      return 'sentado_chao';
    default:
      return 'em_pe';
  }
}

function animFor(pose: FigPose, signs: string[], act?: VideoAct): { phases: number; period: number } {
  if (signs.includes('rigidez') || signs.includes('livores')) return { phases: 1, period: 1000 };
  if (pose === 'convulsao') return { phases: 4, period: 90 };
  if (act === 'rcp' || pose === 'rcp') return { phases: 2, period: 270 };
  if (signs.includes('tremor')) return { phases: 2, period: 70 };
  if (signs.includes('agitado') || act === 'correndo') return { phases: 4, period: 190 };
  if (act === 'rindo' || act === 'gritando' || act === 'abanando') return { phases: 2, period: 170 };
  if (signs.includes('respira_rapido') || signs.includes('tiragem')) return { phases: 2, period: 190 };
  return { phases: 4, period: 520 };
}

/** monta (ou devolve do cache) o palco da cena */
export function stageFor(sc: VideoScene, seed: string, view: 'ver' | 'campo' = 'ver'): Stage {
  const key = view + '|' + seed + '|' + JSON.stringify(sc);
  const hit = stages.get(key);
  if (hit) return hit;
  const st = buildStage(sc, seed, view, key);
  if (stages.size > 10) stages.delete(stages.keys().next().value as string);
  stages.set(key, st);
  return st;
}

function buildStage(sc: VideoScene, seed: string, view: 'ver' | 'campo', key: string): Stage {
  const pt = sc.patient ?? null;
  const pose = pt?.pose;
  const place: VideoPlace = pose === 'preso' && sc.place !== 'carro' ? 'carro' : sc.place;
  const fn = PLACES[place] ?? PLACES.sala!;
  const night = sc.light === 'noite';
  const dark = sc.light === 'escuro';
  const r = mulberry(hashStr(seed + ':palco'));
  const bg = new Pix(WORLD_W, WORLD_H);
  const sitting = pose === 'sentado' || pose === 'cadeira' || pose === 'curvado' || pose === 'colo' || pose === 'debrucado' || pose === 'encostado';
  const ctx: PlaceCtx = {
    night,
    dark,
    seed,
    r: mulberry(hashStr(seed + ':lugar:' + place)),
    glow: [],
    usesSeat: !!pt && (sitting || pose === 'parto'),
    usesBed: !!pt && (pose === 'cama' || pose === 'parto'),
    variant: sc.variant ?? ((sc.props ?? []).includes('remedios') && place === 'calcada' ? 'farmacia' : place === 'telhado' && sc.rain ? 'enchente' : undefined),
    rain: !!sc.rain,
  };
  const lay = fn(bg, ctx);
  // metade das vezes o cômodo aparece espelhado (lugares sem letreiro): mais casas diferentes com o mesmo desenho
  if (MIRROR.includes(place) && mulberry(hashStr(seed + ':espelho'))() < 0.5) {
    const m = bg.copy();
    bg.clear();
    bg.blit(m, 0, 0, { flipX: true });
    lay.lamps = lay.lamps.map((l) => ({ ...l, x: WORLD_W - 1 - l.x }));
    lay.env = WORLD_W - lay.env;
    const glows = ctx.glow;
    ctx.glow = [
      (q) => {
        const t = new Pix(WORLD_W, WORLD_H);
        for (const g of glows) g(t);
        q.blit(t, 0, 0, { flipX: true });
      },
    ];
  }
  const mode = lightModeFor(lay.outdoor, sc.light);
  const fg = new Pix(WORLD_W, WORLD_H);
  let fgUsed = false;
  // ------------------------------------------------------------------ paciente
  const actors: Actor[] = [];
  const props: PlacedProp[] = [];
  let patient: Actor | undefined;
  const px = 128 + Math.round((r() - 0.5) * 8);
  if (pt) {
    const age = pt.age ?? 'adulto';
    const look = lookFor(seed + ':paciente', { age, sex: pt.sex, tone: pt.tone, state: pt.skin ?? 'normal', wear: pt.wear, hat: pt.hat, place, night });
    let fpose: FigPose = pose === 'cadeira' ? 'sentado' : (pose as FigPose);
    let ax = px;
    let ay = lay.standY;
    let dir: 1 | -1 = r() < 0.5 ? 1 : -1;
    if (pose && LYING.includes(pose) && pose !== 'cama') {
      ay = lay.lieY;
    } else if (pose === 'cama' && age === 'bebe') {
      // bebê: no berço (a grade da frente fica na frente dele)
      const by = lay.floorY + 50;
      const k = kAt(lay, by) * 1.1;
      const crib = drawCrib(bg, fg, px, by, k);
      fgUsed = true;
      ay = Math.round(crib.top + 9 * k);
      dir = 1;
    } else if (pose === 'cama' && (place === 'sala' || lay.seat === 'sofa')) {
      // "deitado no sofá": sofá comprido, a cabeça num braço
      const sy = lay.floorY + 46;
      const k = kAt(lay, sy);
      drawSofa(bg, px, sy - 2, k, ['#5a3e6a', '#3f5f6a', '#6a4a3a', '#7a3a3a'][Math.floor(r() * 4)], 104);
      ay = sy - 2 - Math.round(13 * k);
      dir = r() < 0.5 ? 1 : -1;
      // no sofá: deitado por cima (sem o cobertor da cama)
      fpose = 'deitado';
    } else if (pose === 'cama') {
      const by = lay.floorY + 50;
      const k = kAt(lay, by);
      const bed = drawBed(bg, px, by, k, ['#e8e0d0', '#d8e4ec', '#e8d8e0'][Math.floor(r() * 3)]);
      ay = Math.round(bed.top + (by - bed.top) * 0.42);
      dir = 1;
    } else if (pose === 'parto') {
      if (lay.bed || place === 'quarto' || place === 'hospital') {
        const by = lay.floorY + 52;
        const k = kAt(lay, by);
        const bed = drawBed(bg, px, by, k, '#e8e4dc');
        ay = Math.round(bed.top + (by - bed.top) * 0.75);
      } else {
        // no chão, sobre toalhas
        ay = lay.lieY + 4;
        props.push({ prop: 'toalha', x: px + 14, y: ay + 4, k: 1.4 });
      }
    } else if (sitting) {
      // bebê e criança pequena sentam no chão (no tapete), não no sofá
      const seat: SeatKind = pose === 'encostado' || (age === 'bebe' && pose !== 'colo') ? 'chao' : lay.seat;
      const sy = lay.floorY + 46;
      ay = sy;
      const k = kAt(lay, sy);
      switch (seat) {
        case 'sofa':
          drawSofa(bg, px, sy - 2, k, ['#5a3e6a', '#3f5f6a', '#6a4a3a', '#7a3a3a'][Math.floor(r() * 4)]);
          break;
        case 'cadeira':
        case 'carteira':
          drawChair(bg, px, sy - 1, k, '#7a5236');
          break;
        case 'cadeira_plastico':
          drawChair(bg, px, sy - 1, k, ['#e8c040', '#c8352a', '#e8e4dc'][Math.floor(r() * 3)], true);
          break;
        case 'banco':
          drawBench(bg, px, sy - 1, k, '#8a6a44', 70);
          break;
        case 'banco_onibus':
          drawBusSeat(bg, px, sy - 1, k);
          break;
        case 'banco_igreja':
          drawPew(bg, px, sy - 1, k, '#6a4a30', 96);
          break;
        case 'longarina':
          drawBusSeat(bg, px, sy - 1, k, '#3a6aa8');
          break;
        case 'cama':
          drawBed(bg, px, sy + 1, k, '#e8e0d0');
          break;
        case 'banco_carro':
          break;
        default: {
          // chão, meio-fio, degrau; "encostado" sem parede atrás (rua, quadra) é sentado no chão
          const lean = pose === 'encostado' && !lay.outdoor;
          fpose = lean ? 'encostado' : 'sentado_chao';
          ay = lean ? lay.floorY + 36 : lay.lieY + 2;
          if (lay.seat === 'meiofio' && pose !== 'encostado') {
            bg.rect(0, ay - 6, WORLD_W, 3, '#b8b4aa');
            bg.hl(0, WORLD_W - 1, ay - 6, '#d0ccc2');
          }
        }
      }
      if (pose === 'curvado') fpose = seat === 'chao' || seat === 'meiofio' || seat === 'degrau' ? 'sentado_chao' : 'curvado';
      if (pose === 'colo') fpose = 'colo_adulto';
      if (pose === 'debrucado') {
        fpose = 'debrucado';
        fgUsed = true;
        const plastic = place === 'bar' || place === 'bar_porta' || place === 'salao';
        drawTable(fg, px, sy + 6, k, plastic ? '#e8c040' : '#7a5236', 46, undefined, plastic);
      }
    } else if (pose === 'preso') {
      ax = 96;
      ay = 136;
      fpose = 'preso';
    }
    const k = pose === 'preso' ? 1.12 : kAt(lay, ay);
    const signs = pt.signs ?? [];
    let pk = k;
    let lift = 0;
    if (pose === 'colo') {
      // quem segura: um adulto sentado, ninando; o bebê (ou a criança) deitado no colo, entre a barriga
      // e o antebraço da frente. A âncora do bebê fica logo na frente da de quem segura (ordem de desenho)
      // a mãe tem o tom de pele do filho (família)
      const holder = lookFor(seed + ':colo', { age: 'adulto', sex: 'F', place, night, tone: look.tone });
      actors.push(mkActor('colo', false, holder, 'colo_adulto', ax, ay, k, 1, { phases: 4, period: 600 }, {}, 'mae'));
      const hf = drawFigure({ look: holder, pose: 'colo_adulto', k, dir: 1, phase: 0 });
      fpose = 'deitado';
      dir = 1;
      pk = age === 'bebe' ? k * 1.15 : k * 0.84;
      lift = Math.round(1 - hf.pts.pelvis[1] + (age === 'bebe' ? 1.5 : 2.5) * k);
      ay = ay + 1;
    } else if (age === 'bebe' && pose && (LYING.includes(pose) || pose === 'cama')) {
      // bebê de verdade some no quadro: um pouco maior que a escala do lugar
      pk = k * 1.3;
    }
    const an = animFor(fpose, signs);
    patient = mkActor('paciente', true, look, fpose, ax, ay, pk, dir, an, { signs, gear: pt.gear, wound: pt.wound }, undefined, undefined, undefined, pt.hold);
    if (lift) patient.lift = lift;
    actors.push(patient);
    if (!lift) puddles(bg, patient, lay);
    if (pose === 'preso') {
      // volante e cinto na frente
      fgUsed = true;
      for (let y = 99; y < 126; y++)
        for (let x = ax + 15; x < ax + 46; x++) {
          const d = Math.hypot((x - ax - 30) / 15, (y - 112) / 13);
          if (d > 0.72 && d <= 1) fg.px(x, y, d > 0.9 ? '#141418' : '#2a2a30');
        }
      fg.rect(ax + 28, 112, 4, 30, '#2a2a30');
      fg.line(ax - 14, 74, ax + 12, 122, '#3a3a40');
      fg.line(ax - 13, 74, ax + 13, 122, '#4a4a52');
    }
  }
  // ------------------------------------------------------------------ objetos
  // dentro do carro, os veículos da rua não entram no quadro
  const list = (sc.props ?? []).filter((x) => !['sofa', 'cama', 'mesa'].includes(x) && !(place === 'carro' && ['carro', 'moto', 'poste', 'onibus', 'bicicleta'].includes(x)));
  let side = 1;
  const pX = patient?.x ?? 128;
  const pY = patient?.y ?? lay.lieY;
  let tableAt: [number, number] | null = null;
  const sg = pt?.signs ?? [];
  for (const prop of list) {
    const home = PROP_HOME[prop] ?? 'chao';
    const variant =
      prop === 'carro' && list.includes('poste') ? 'poste' : prop === 'carro' && sg.some((s) => s.startsWith('sangue')) ? 'batido' : prop === 'balde' && sg.includes('vomito_sangue') ? 'hda' : undefined;
    if (home === 'rua') {
      // veículos em escala (moto ~2 m, carro ~4 m ao lado de uma pessoa de 1,70 m)
      const car = props.find((q) => q.prop === 'carro');
      if (prop === 'moto') props.push({ prop, x: pX + side * 62, y: pY + 8, k: kAt(lay, pY + 8) * 2.1, variant: 'caida' });
      // carro no poste: do lado direito, de frente para o paciente, com o poste entre os dois
      else if (prop === 'carro' && variant === 'poste') props.push({ prop, x: pX + 74, y: pY - 16, k: kAt(lay, pY - 16) * 2.1, variant });
      else if (prop === 'carro') props.push({ prop, x: pX - side * 86, y: pY - 16, k: kAt(lay, pY - 16) * 2.1, variant });
      else if (prop === 'bicicleta') props.push({ prop, x: pX + side * 54, y: pY + 6, k: kAt(lay, pY + 6) * 2 });
      // o poste encosta na frente amassada do carro (a frente fica à esquerda do desenho)
      else if (prop === 'poste' && car) props.push({ prop, x: car.x - 24 * car.k, y: car.y - 2, k: car.k * 0.62 });
      else if (prop === 'poste') props.push({ prop, x: pX - side * 30, y: pY - 18, k: kAt(lay, pY - 18) * 1.3 });
      else props.push({ prop, x: pX + side * 40, y: pY + 4, k: kAt(lay, pY + 4) });
      side = -side;
    } else if (home === 'fundo') {
      const y = lay.floorY + 14;
      const big = prop === 'viatura' || prop === 'ambulancia' || prop === 'onibus';
      props.push({ prop, x: big ? lay.env : 40 + r() * 170, y, k: kAt(lay, y) * (big ? 1.9 : 0.95) });
    } else if (home === 'parede') {
      props.push({ prop, x: lay.env, y: lay.floorY - 10, k: kAt(lay, lay.floorY) });
    } else if (home === 'junto') {
      // máquina em que o paciente está preso: do lado dele, na mesma linha do chão (ele fica na frente)
      const k = kAt(lay, pY - 2);
      props.push({ prop, x: pX + 26 * k, y: pY - 2, k });
    } else if (home === 'mesa') {
      if (!tableAt) {
        // mesinha ao lado do paciente (no lado de fora, no chão mesmo)
        const tx = pX + (pX > 128 ? -58 : 58);
        const ty = Math.min(WORLD_H - 4, pY + 4);
        const tk = kAt(lay, ty);
        if (lay.outdoor || lay.surface === 'chao') tableAt = [tx, ty];
        else {
          const top = drawTable(bg, tx, ty, tk * 0.9, lay.surface === 'criado' ? '#7a5a3e' : '#7a5236', 30);
          tableAt = [tx, top + 2];
        }
      }
      const n = props.filter((q) => PROP_HOME[q.prop] === 'mesa').length;
      props.push({ prop, x: tableAt[0] - 8 + n * 9, y: tableAt[1], k: 0.9, variant });
    } else {
      const ox = side * (34 + props.length * 6);
      props.push({ prop, x: pX + ox, y: Math.min(WORLD_H - 4, pY + 8), k: 1, variant });
      side = -side;
    }
  }
  // ------------------------------------------------------------------ figurantes
  const cast = sc.cast ?? defaultCast(sc, r);
  let fl = 0;
  let frr = 0;
  let fb = 0;
  cast.forEach((ex, i) => {
    const rr = mulberry(hashStr(seed + ':fig' + i + ex.role));
    const d = roleDefaults(ex.role, pt, place, rr);
    const age = ex.age ?? d.age;
    const sex = ex.sex ?? d.sex;
    // família parece família: tom de pele igual ou vizinho ao do paciente
    const fam = FAMILY.includes(ex.role) && patient ? Math.max(0, Math.min(4, patient.look.tone + [0, 0, -1, 1][Math.floor(rr() * 4)])) : undefined;
    const look = lookFor(seed + ':fig' + i + ':' + ex.role, { age, sex, wear: ex.wear, roleWear: d.wear, place, night, tone: fam });
    const act = ex.act ?? 'olhando';
    let fpose = poseForAct(act);
    let ax = 128;
    let ay = lay.standY;
    let k = 1;
    let reach: V2 | undefined;
    let hold: FigSpec['hold'];
    let at = ex.at ?? 'fundo';
    // dentro do carro não cabe ninguém "ao fundo": quem ajuda aparece na porta, perto da câmera
    if (place === 'carro' && at === 'fundo') at = 'dir';
    const kneel = act === 'rcp' || act === 'comprimindo' || act === 'segurando_cabeca' || act === 'segurando_mao' || act === 'ajoelhado' || act === 'ventilando';
    const upright = !!patient && !isLyingPose(patient.pose);
    if (kneel && patient && upright) {
      // paciente sentado/em pé (parto, sofá): quem ajuda fica de pé ao lado, segurando a mão
      const P = patient;
      const fig = drawFigure({ ...P.spec, look: P.look, pose: P.pose, k: P.k, dir: P.dir, phase: 0 });
      const sideX = fb % 2 === 0 ? -1 : 1;
      // parto na cama: quem ajuda fica de pé NO CHÃO, ao lado da cama (antes subia no
      // colchão e saía gigante perto da parturiente)
      const onBed = P.pose === 'parto' && (!!lay.bed || place === 'quarto' || place === 'hospital');
      if (onBed) {
        const by = lay.floorY + 52;
        ay = by - 8;
        k = kAt(lay, ay);
        ax = Math.round(P.x + sideX * (56 + fb * 12) * kAt(lay, by));
      } else {
        ax = Math.round(P.x + sideX * (34 + fb * 6) * P.k);
        ay = Math.round(P.y - 4);
        k = kAt(lay, ay);
      }
      const hand = sideX < 0 ? fig.pts.handL : fig.pts.handR;
      reach = [P.x + hand[0] - ax, drawY(P) + hand[1] - ay];
      fpose = act === 'segurando_mao' ? 'em_pe' : 'ajoelhado';
      fb++;
    } else if (kneel && patient) {
      at = act === 'segurando_cabeca' || act === 'ventilando' ? 'cabeca' : 'fundo';
      // ajoelhado atrás do paciente, mãos no ponto
      const P = patient;
      const fig = drawFigure({ ...P.spec, look: P.look, pose: P.pose, k: P.k, dir: P.dir, phase: 0 });
      const pts = fig.pts;
      const target: V2 =
        act === 'rcp' ? pts.chest : act === 'comprimindo' ? pts.wound : act === 'segurando_mao' ? (pts.handR[1] < pts.handL[1] ? pts.handR : pts.handL) : act === 'segurando_cabeca' || act === 'ventilando' ? pts.head : pts.chest;
      const tx = P.x + target[0];
      const ty = drawY(P) + target[1];
      ax = Math.round(at === 'cabeca' ? P.x + pts.head[0] - P.dir * 10 * P.k : tx + (rr() - 0.5) * 6);
      ay = Math.round(P.y - (P.pose === 'cama' ? 14 : 7) * P.k - fb * 2);
      k = P.k * 0.98;
      reach = [tx - ax, ty - ay];
      fb++;
    }
    if (kneel && patient) {
      // posicionado acima
    } else if (at === 'esq' || at === 'dir') {
      // perto da câmera, nas bordas do quadro (meio cortado, como em vídeo de celular)
      const n = at === 'esq' ? fl++ : frr++;
      const camX0 = Math.max(0, Math.min(WORLD_W - VIEW_W, (patient?.x ?? 128) - VIEW_W / 2));
      ax = Math.round(at === 'esq' ? camX0 + 10 + n * 18 : camX0 + VIEW_W - 10 - n * 18);
      ay = WORLD_H + 22 + n * 4;
      k = 1.22;
    } else if (at === 'cabeca' || at === 'pes') {
      const P = patient;
      ax = P ? P.x + (at === 'cabeca' ? -1 : 1) * P.dir * 44 : 128;
      ay = P ? P.y - 4 : lay.standY;
      k = kAt(lay, ay);
    } else {
      // fundo: atrás do paciente, espalhados
      const n = fb++;
      const spread = [-48, 50, -80, 84, 0][n % 5];
      ax = Math.round((patient?.x ?? 128) + spread + (rr() - 0.5) * 8);
      ay = Math.round((patient ? Math.min(patient.y - 14, lay.standY - 14) : lay.standY) - (n > 1 ? 6 : 0));
      ay = Math.max(lay.floorY + 10, ay);
      k = kAt(lay, ay);
    }
    hold = ex.hold;
    if (act === 'filmando') hold = 'celular';
    if (act === 'lanterna') hold = 'lanterna';
    if (act === 'segurando_crianca') hold = 'bebe';
    if (act === 'abanando') hold = 'papelao';
    if (act === 'comprimindo') hold = 'pano';
    if (act === 'deitado') ay = Math.max(ay, lay.lieY - 18);
    if (ex.role === 'passageiro' && act === 'sentado') {
      drawBusSeat(bg, ax, ay - 1, k);
      fpose = 'sentado';
    }
    const gaze = patient ? Math.sign(patient.x - ax) * 0.6 : 0;
    const an = animFor(fpose, [], act);
    actors.push(mkActor('fig' + i, false, look, fpose, ax, ay, k, ax < (patient?.x ?? 128) ? 1 : -1, an, {}, ex.role, act, reach, hold, gaze));
  });
  // ------------------------------------------------------------------ ordem de profundidade
  actors.sort((a, b) => a.y - b.y || (a.patient ? 1 : 0) - (b.patient ? 1 : 0));
  // ------------------------------------------------------------------ luz
  const lamps = mode === 'dia_fora' || mode === 'dia_dentro' ? [] : [...lay.lamps];
  const flashers: Stage['flashers'] = [];
  for (const pr of props) {
    if (pr.prop === 'viatura' || pr.prop === 'ambulancia') {
      flashers.push({ x: pr.x - 2, y: pr.y - 22 * pr.k, r: 60, colors: ['#e03a3a', '#3a5ae8'], period: 260 });
      if (mode !== 'dia_fora') lamps.push({ x: pr.x, y: pr.y - 20, r: 90, k: 0.8, hue: 'vermelha' });
    }
    if (pr.prop === 'fogo') flashers.push({ x: pr.x, y: pr.y - 6, r: 30, colors: ['#e8902a', '#e8c040', '#e86a2a'], period: 120 });
  }
  // quem filma acende a lanterna do celular para mostrar o paciente na rua escura
  if (view === 'ver' && mode === 'noite_fora' && patient) lamps.push({ x: pX, y: pY - 10, r: 78, k: 0.85, hue: 'fria' });
  const lm = lightMap(WORLD_W, WORLD_H, mode, lamps, {
    // no escuro, quem filma acende a lanterna do celular no paciente (sem paciente: celular no bolso, tudo preto)
    flashlight: dark && pt ? [pX, pY - 6, view === 'campo' ? 120 : 92] : undefined,
    headlights: view === 'campo' && (night || dark) && lay.outdoor,
  });
  applyLight(bg, lm);
  for (const g of ctx.glow) g(bg);
  for (const pr of props) {
    const s = propSprite(pr.prop, pr.k, pr.variant);
    if (!s) continue;
    const q = s.pix.copy();
    const ox = Math.round(pr.x - s.ax);
    const oy = Math.round(pr.y - s.ay);
    applyLight(q, lm, ox, oy);
    bg.blit(q, ox, oy);
  }
  if (fgUsed) applyLight(fg, lm);
  // ------------------------------------------------------------------ câmera
  const clampX = (x: number) => Math.max(0, Math.min(WORLD_W - VIEW_W, Math.round(x)));
  const camX = clampX((patient?.x ?? 128) - VIEW_W / 2);
  let envX = clampX(lay.env - VIEW_W / 2);
  if (Math.abs(envX - camX) < 24) envX = clampX(camX + (lay.env > 128 ? 64 : -64));
  const others = actors.filter((a) => !a.patient);
  const peopleX = others.length ? clampX(others.reduce((s, a) => s + a.x, 0) / others.length - VIEW_W / 2) : envX;
  return { key, scene: sc, seed, view, layout: lay, mode, lm, bg, fg: fgUsed ? fg : undefined, actors, patient, props, flashers, camX, envX, peopleX, rain: !!sc.rain, place };
}

/** poças no chão sob o paciente (sangue, vômito, água) — no fundo, antes da luz */
function puddles(bg: Pix, P: Actor, lay: Layout): void {
  const sg = P.spec.signs ?? [];
  const want = sg.includes('sangue_chao') || sg.includes('vomito') || sg.includes('vomito_sangue') || sg.includes('molhado');
  if (!want || P.pose === 'cama') return;
  const fig = drawFigure({ ...P.spec, look: P.look, pose: P.pose, k: P.k, dir: P.dir, phase: 0 });
  const floorAt = (pt: V2): V2 => [P.x + pt[0], Math.max(P.y + pt[1] + 2, P.y - 2)];
  if (sg.includes('molhado') || lay.floor === 'agua') {
    const c: V2 = [P.x, P.y + 2 * P.k];
    bg.ellipse(c[0], c[1], 34 * P.k, 6 * P.k, '#7a9ab0', 0.45);
    bg.ellipse(c[0] - 8, c[1] - 1, 12 * P.k, 2 * P.k, '#c8e0ec', 0.35);
  }
  if (sg.includes('sangue_chao')) {
    const w = floorAt(fig.pts.wound);
    const c: V2 = [w[0] + 4 * P.k, Math.max(w[1], P.y + 1) + 2 * P.k];
    bg.ellipse(c[0], c[1], 16 * P.k, 4.2 * P.k, '#4a0a10');
    bg.ellipse(c[0] - 1, c[1] - 0.5, 13 * P.k, 3.2 * P.k, '#7a0c12');
    bg.ellipse(c[0] - 4, c[1] - 1, 5 * P.k, 1.2 * P.k, '#a3141c');
    bg.px(Math.round(c[0] - 6), Math.round(c[1] - 1), '#d8504a');
  }
  if (sg.includes('vomito') || sg.includes('vomito_sangue')) {
    const m = floorAt(fig.pts.mouth);
    const col = sg.includes('vomito_sangue') ? '#4a2018' : '#a69a3c';
    const c: V2 = fig.lying ? [m[0] + (P.dir === 1 ? -9 : 9) * P.k, P.y + 4 * P.k] : [P.x + 12 * P.k, P.y + 2];
    bg.ellipse(c[0], c[1], 7 * P.k, 2.2 * P.k, col);
    bg.ellipse(c[0] - 1, c[1] - 0.6, 4 * P.k, 1 * P.k, sg.includes('vomito_sangue') ? '#6a3020' : '#c8bc5a');
  }
}

function mkActor(
  id: string,
  isPatient: boolean,
  look: Look,
  pose: FigPose,
  x: number,
  y: number,
  k: number,
  dir: 1 | -1,
  an: { phases: number; period: number },
  spec: Actor['spec'],
  role?: VideoRole,
  act?: VideoAct,
  reach?: V2,
  hold?: FigSpec['hold'],
  gaze?: number,
): Actor {
  return { id, patient: isPatient, look, pose, act, role, x, y, k, dir, phases: an.phases, period: an.period, reach, hold, gaze, frames: new Map(), spec };
}

/** quadro de animação de um ator, já iluminado na posição */
export function actorFrame(st: Stage, a: Actor, t: number): { fig: FigOut; pix: Pix; front?: Pix } {
  const ph = a.phases > 1 ? Math.floor(t / a.period) % a.phases : 0;
  let f = a.frames.get(ph);
  if (f) return f;
  const fig = drawFigure({ ...a.spec, look: a.look, pose: a.pose, k: a.k, dir: a.dir, phase: ph, act: a.act, reach: a.reach, hold: a.hold, gaze: a.gaze });
  const pix = fig.pix.copy();
  const ox = Math.round(a.x - fig.ax);
  const oy = Math.round(drawY(a) - fig.ay);
  applyLight(pix, st.lm, ox, oy);
  let front: Pix | undefined;
  if (fig.front) {
    front = fig.front.copy();
    applyLight(front, st.lm, ox, oy);
  }
  f = { fig, pix, front };
  a.frames.set(ph, f);
  return f;
}

// -----------------------------------------------------------------------------
// Quadro
// -----------------------------------------------------------------------------
function drawWide(p: Pix, st: Stage, camX: number, t: number): void {
  p.blit(st.bg, -camX, 0);
  const fronts: { pix: Pix; x: number; y: number }[] = [];
  for (const a of st.actors) {
    const f = actorFrame(st, a, t);
    const x = Math.round(a.x - f.fig.ax) - camX;
    const y = Math.round(drawY(a) - f.fig.ay);
    // sombra no chão (quem está no colo não tem)
    if (a.lift) {
      // nada
    } else if (!f.fig.lying && a.y < WORLD_H) p.ellipse(a.x - camX, a.y, 9 * a.k, 1.6 * a.k, '#000000', 0.22);
    else if (f.fig.lying) p.ellipse(a.x - camX, a.y + 3 * a.k, 30 * a.k, 4 * a.k, '#000000', 0.18);
    p.blit(f.pix, x, y);
    if (f.front) fronts.push({ pix: f.front, x, y });
  }
  if (st.fg) p.blit(st.fg, -camX, 0);
  for (const fr of fronts) p.blit(fr.pix, fr.x, fr.y);
  // luzes que piscam
  for (const fl of st.flashers) {
    const i = Math.floor(t / fl.period) % fl.colors.length;
    p.glow(fl.x - camX, fl.y, fl.r, fl.colors[i], 0.32, 3);
  }
  if (st.rain) rain(p, t);
}

function rain(p: Pix, t: number): void {
  const r = mulberry(Math.floor(t / 90));
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(r() * p.w);
    const y = Math.floor(r() * p.h);
    p.line(x, y, x - 1, y + 5, '#c8d4e0', 0.4);
  }
}

/** vinheta e ruído da câmera do celular */
export function phoneLook(p: Pix, mode: LightMode, t: number): void {
  const dark = mode === 'noite_fora' || mode === 'noite_dentro' || mode === 'escuro';
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const dx = (x - p.w / 2) / (p.w / 2);
      const dy = (y - p.h / 2) / (p.h / 2);
      const d = dx * dx * 0.7 + dy * dy * 0.9;
      if (d < 0.62) continue;
      const a = Math.min(0.42, (d - 0.62) * 0.55);
      if (bayerOn(x, y, a * 2.2)) p.pxa(x, y, '#000000', 0.28);
    }
  if (dark) {
    const r = mulberry(Math.floor(t / 110) * 7 + 3);
    for (let i = 0; i < (mode === 'escuro' ? 260 : 120); i++) {
      const x = Math.floor(r() * p.w);
      const y = Math.floor(r() * p.h);
      p.pxa(x, y, r() < 0.5 ? '#ffffff' : '#000000', 0.12);
    }
  }
}

const frozen = new Map<string, { t: number; pix: Pix }>();

export function renderVideoFrame(o: VideoFrameOpts): Pix {
  const p = new Pix(VIDEO_W, VIDEO_H);
  const sc = o.scene;
  if (o.connecting !== undefined && o.connecting < 1) {
    p.clear('#0d1418');
    const dots = Math.floor(o.t / 300) % 4;
    for (let i = 0; i < 3; i++) p.disc(84 + i * 12, 70, 3, i < dots ? '#7ad0a0' : '#2a3a40');
    p.rect(36, 90, 120, 3, '#1f2a30');
    p.rect(36, 90, Math.round(120 * o.connecting), 3, '#7ad0a0');
    return p;
  }
  const view = o.view ?? 'ver';
  const st = stageFor(sc, o.seed, view);
  const focus = o.focus;
  if (focus === 'ambiente') drawWide(p, st, st.envX, o.t);
  else if (focus === 'pessoas') drawWide(p, st, st.peopleX, o.t);
  else if (focus === 'geral' && st.patient && (st.patient.look.age === 'bebe' || st.patient.lift)) {
    // bebê (ou criança no colo): quem filma chega perto — plano médio (o recorte em volta, ampliado 2×)
    const P = st.patient;
    const world = new Pix(WORLD_W, WORLD_H);
    drawWide(world, st, 0, o.t);
    const cx = Math.max(0, Math.min(WORLD_W - 96, Math.round(P.x - 48)));
    const cy = Math.max(0, Math.min(WORLD_H - 72, Math.round(drawY(P) - 42)));
    const crop = new Pix(96, 72);
    crop.blit(world, -cx, -cy);
    p.blit(crop.scaled(2), 0, 0);
  } else if (focus === 'geral') drawWide(p, st, st.camX, o.t);
  else {
    const half = renderClose(st, focus, o.t);
    if (half) p.blit(half.scaled(2), 0, 0);
    else drawWide(p, st, st.camX, o.t);
  }
  if (view === 'ver') phoneLook(p, st.mode, o.t);
  return p;
}

/** fachada vista da esquina (cena insegura, antes de a equipe entrar) */
const FACHADA: Partial<Record<VideoPlace, VideoPlace>> = {
  sala: 'porta', quarto: 'porta', cozinha: 'porta', banheiro: 'porta', corredor: 'porta', escada: 'porta',
  bar: 'bar_porta', loja: 'calcada', mercado: 'calcada', padaria: 'calcada', academia: 'calcada', escritorio: 'calcada',
  salao: 'calcada', igreja: 'calcada', escola: 'calcada', quadra: 'calcada', hospital: 'calcada', central: 'calcada', fabrica: 'calcada',
  onibus: 'ponto_onibus', carro: 'rua',
};

/** cena de longe: a fachada do lugar, gente na porta, o paciente (se estiver fora) pequeno no fundo */
export function farScene(sc: VideoScene): VideoScene {
  const out = FACHADA[sc.place];
  const cast = (sc.cast ?? []).filter((c) => c.act === 'gritando' || c.act === 'escondido' || c.act === 'filmando' || c.act === 'apontando');
  const n = Math.max(2, Math.min(4, (sc.people ?? 3) - 1));
  while (cast.length < n) cast.push({ role: 'curioso', act: cast.length % 2 ? 'apontando' : 'olhando', at: 'fundo' });
  return { place: out ?? sc.place, light: sc.light, rain: sc.rain, patient: out ? null : sc.patient, props: out ? [] : sc.props, cast };
}

/** efeitos de celular por cima do quadro (tremida, compressão, travamento) */
export function drawVideoFeed(ctx: CanvasRenderingContext2D, o: VideoFrameOpts, scale = 1): void {
  const key = o.seed;
  const freezeEvery = o.signal === 'ruim' ? 700 : o.signal === 'fraco' ? 260 : 0;
  let pix: Pix;
  const fr = frozen.get(key);
  if (freezeEvery && fr && o.t - fr.t < freezeEvery && o.connecting === undefined) pix = fr.pix;
  else {
    pix = renderVideoFrame(o);
    // compressão: blocos chapados de 6×6 (mais com sinal fraco/ruim)
    const r = mulberry(Math.floor(o.t / 120) + hashStr(key));
    const blocks = o.signal === 'ruim' ? 34 : o.signal === 'fraco' ? 12 : 2;
    for (let i = 0; i < blocks; i++) {
      const bx = Math.floor(r() * (VIDEO_W / 6)) * 6;
      const by = Math.floor(r() * (VIDEO_H / 6)) * 6;
      const v = pix.get(bx + 2, by + 2);
      for (let yy = by; yy < by + 6; yy++) for (let xx = bx; xx < bx + 6; xx++) pix.raw(xx, yy, v);
    }
    frozen.set(key, { t: o.t, pix });
  }
  const shake = o.scene.shaky && o.connecting === undefined ? Math.round(Math.sin(o.t / 70) * 1.2) : 0;
  const shakeY = o.scene.shaky && o.connecting === undefined ? Math.round(Math.cos(o.t / 95) * 1) : 0;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, VIDEO_W * scale, VIDEO_H * scale);
  presentPix(ctx, pix, shake * scale, shakeY * scale, scale, 'video');
}
