// =============================================================================
// Cenas 320×180 (casa, central, rua, hospital, escola, igreja, escritório...).
// Vista 3/4 "casa de bonecas": parede ao fundo, piso visto de cima, gente de
// ~16×32 px. Camadas estáticas (fundo e frente) ficam em cache por
// (cenário, desgaste quantizado, objetos); por quadro desenhamos só o que mexe
// (vapor, chama, TV, goteira, respiração, piscadas) e o elenco.
// Com o Desgaste (blend), a casa quente desliza para a paleta fria da central.
// =============================================================================
import type { SceneBg, MemberStatus } from '../../engine/types';
import { Pix, presentPix, hash2, bayerOn, gradedCopy } from './pix';
import { HOME, CENTRAL, mix, shade, homeGrader, quantize } from './palette';
import { drawText, textWidth } from './font';
import { figurePix, figureHeight, type CastId, type Pose } from './figures';
import { drawDog, ozzyPlayAt, OZZY_PLAY_PATHS, type DogPose } from './dog';
import { statusIconPix } from './icons';
import { renderCityMap } from './mapRender';
import {
  floorShadow,
  badge,
  kidDrawing,
  fridge,
  sewingMachine,
  plateEdge,
  cup,
  sugarTin,
  juiceGlass,
  insulin,
  stainedSock,
  closedShoes,
  handbag,
  interviewClothes,
  angryDrawing,
  cornCake,
  candle,
  bucket,
  fatEnvelope,
  ring,
  inhaler,
  flowers,
  letter,
  styrofoam,
  woodChair,
  hangingBulb,
  deskPhone,
  familyPhoto,
  monitorFrame,
  postit,
  papers,
  manualBinder,
  corkBoard,
  pushPin,
  nail,
  housePlate,
  cardBox,
} from './props';

export const SCENE_W = 320;
export const SCENE_H = 180;

export const SCENE_BGS: SceneBg[] = ['cozinha', 'sala', 'quarto', 'porta', 'escola', 'central', 'rua', 'hospital', 'calcada', 'escritorio', 'igreja', 'mesa', 'preto'];

/** ids de objetos de cena suportados */
export const SCENE_OBJECTS = [
  'geladeira_quebrada',
  'geladeira_ok',
  'isopor',
  'maquina',
  'desenhos',
  'cracha',
  'prato_seco',
  'xicara',
  'lata_acucar',
  'suco_escondido',
  'insulina',
  'meia_mancha',
  'sapato_fechado',
  'bolsa_passagem',
  'roupa_varal',
  'cartao_maquina',
  'desenho_raiva',
  'bolo',
  'vela',
  'goteira',
  'balde',
  'envelope',
  'alianca',
  'bombinha',
  'mesa_vazia',
  'moveis_calcada',
  'cadeira_vazia',
  'flores',
  'carta',
] as const;
export type SceneObjectId = (typeof SCENE_OBJECTS)[number];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SceneCast {
  /** LUCIA ou ALEX: o cônjuge (quem chama passa ALEX quando a protagonista é mulher) */
  id: 'LUCIA' | 'ALEX' | 'DAVI' | 'ZELIA' | 'EU_M' | 'EU_F';
  pose: 'em_pe' | 'sentado' | 'deitado';
  /** centro horizontal na grade 320×180 */
  x: number;
  status?: MemberStatus;
}

export interface SceneOpts {
  bg: SceneBg;
  /** Desgaste/100: 0 = casa quente, 1 = fluorescente */
  blend: number;
  objects: string[];
  cast?: SceneCast[];
  /** Ozzy, o lulu da família, no lugar dele no chão (só nos cômodos da casa: cozinha, sala, quarto, porta) */
  ozzy?: DogPose | false;
  /**
   * Brincadeira com o Ozzy: ms desde que o jogador escolheu "Brincar com o Ozzy".
   * Enquanto existir, ignora `ozzy` e o Ozzy corre pelo cômodo latindo (balão "AU!"),
   * depois deita e dorme no tapete com "zzz" (ver ozzyPlayAt em dog.ts).
   * Cômodos com caminho: sala (o principal), cozinha, quarto, porta.
   */
  ozzyPlay?: number;
  /** caminho próprio para a brincadeira (pixels da cena; o último ponto é onde ele dorme) */
  ozzyPath?: [number, number][];
  /** ms */
  time: number;
}

type Layer = 'back' | 'front';
type Has = Set<string>;

interface ObjDef {
  r: Rect;
  layer: Layer;
  draw?: (p: Pix, r: Rect, has: Has) => void;
  anim?: (p: Pix, r: Rect, t: number, has: Has) => void;
}

interface Placement {
  x: number;
  bottom: number;
  layer: 'back' | 'top';
  chair?: boolean;
  blanket?: string;
  /** lugar marcado (cadeira, poltrona, cama) que esta pessoa ocupa */
  seat?: string;
}

interface BgDef {
  warm: boolean;
  back: (p: Pix, has: Has) => void;
  front?: (p: Pix, has: Has) => void;
  /** luz/vinheta estáticas depois dos objetos (front = camada da frente, só pixels opacos) */
  light?: (p: Pix, front: boolean) => void;
  anim?: (p: Pix, has: Has, t: number, blend: number) => void;
  place: (c: SceneCast, has: Has) => Placement | null;
  /** lugares vazios (cadeiras sem ninguém), desenhados por quadro antes do elenco da frente */
  seats?: (p: Pix, has: Has, occupied: Set<string>) => void;
  /** marcação de palco da família: x de cada um neste cômodo (ver familyMarks) */
  marks?: Partial<Record<SceneCast['id'], number>>;
  /** onde o Ozzy pode ficar (centro x, linha das patas y), em ordem de preferência */
  ozzy?: { x: number; y: number; flip?: boolean; layer?: Placement['layer'] }[];
  /** onde o Ozzy dorme depois da brincadeira */
  ozzySleep?: { x: number; y: number };
  objects: Record<string, ObjDef>;
}

const clampX = (x: number, a = 10, b = 310) => Math.max(a, Math.min(b, Math.round(x)));

// -----------------------------------------------------------------------------
// Utilitários de cenário
// -----------------------------------------------------------------------------
function plaster(p: Pix, x: number, y: number, w: number, h: number, base: string, spot: string, seed: number, dens = 0.05): void {
  p.rect(x, y, w, h, base);
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (hash2(xx, yy, seed) < dens) p.px(xx, yy, spot);
}

function tileGrid(p: Pix, x: number, y: number, w: number, h: number, base: string, grout: string, tw: number, th: number, stagger = false): void {
  p.rect(x, y, w, h, base);
  for (let yy = y; yy < y + h; yy += th) p.hl(x, x + w - 1, yy, grout);
  for (let row = 0; row * th < h; row++) {
    const off = stagger && row % 2 ? Math.floor(tw / 2) : 0;
    for (let xx = x + off; xx < x + w; xx += tw) p.vl(xx, y + row * th, Math.min(y + h - 1, y + row * th + th - 1), grout);
  }
}

/** piso com rejunte em perspectiva leve (linhas mais espaçadas perto da câmera) */
function floorTiles(p: Pix, y0: number, y1: number, base: string, grout: string, shine: string, seed: number): void {
  p.rect(0, y0, 320, y1 - y0, base);
  let y = y0;
  let step = 7;
  let row = 0;
  while (y < y1) {
    p.hl(0, 319, y, grout);
    const tw = Math.round(step * 2.2);
    const off = row % 2 ? Math.floor(tw / 2) : 0;
    for (let x = off; x < 320; x += tw) p.vl(x, y, Math.min(y1 - 1, y + step - 1), grout);
    y += step;
    step = Math.min(16, step + 1.3);
    row++;
  }
  for (let yy = y0; yy < y1; yy++) for (let xx = 0; xx < 320; xx++) if (hash2(xx, yy, seed) < 0.025) p.px(xx, yy, shine);
}

function planks(p: Pix, x: number, y: number, w: number, h: number, base: string, line: string, ph: number, seed: number): void {
  p.rect(x, y, w, h, base);
  for (let yy = y; yy < y + h; yy += ph) {
    p.hl(x, x + w - 1, yy, line);
    const off = Math.floor(hash2(yy, 1, seed) * 40);
    for (let xx = x + off; xx < x + w; xx += 44) p.vl(xx, yy, Math.min(y + h - 1, yy + ph - 1), line);
  }
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (hash2(xx, yy, seed + 1) < 0.03) p.px(xx, yy, shade(base, 0.12));
}

/** escurece cantos em faixas pontilhadas */
function vignette(p: Pix, col: string, strength: number, opaqueOnly = false, cx = 160, cy = 96): void {
  for (let y = 0; y < SCENE_H; y++)
    for (let x = 0; x < SCENE_W; x++) {
      if (opaqueOnly && !(p.get(x, y) >>> 24)) continue;
      const dx = (x - cx) / 180;
      const dy = (y - cy) / 115;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 0.72) continue;
      let a = Math.min(1, (d - 0.72) / 0.55) * strength;
      const q = a * 3;
      const fl = Math.floor(q);
      a = (fl + (bayerOn(x, y, q - fl) ? 1 : 0)) / 3;
      if (a > 0) p.pxa(x, y, col, Math.min(0.85, a));
    }
}

/** moldura de "casa de bonecas": paredes cortadas */
function roomFrame(p: Pix, col: string): void {
  p.rect(0, 174, 320, 6, col);
  p.hl(0, 319, 174, shade(col, 0.25));
}

function nightWindow(p: Pix, x: number, y: number, w: number, h: number, frame: string, has: Has, opts: { clothes?: boolean; curtain?: string; moon?: boolean } = {}): void {
  // céu noturno
  p.vgrad(x, y, w, h, ['#141c34', '#1e2a46', '#2a3654'], 0.7);
  for (let i = 0; i < 7; i++) p.px(x + 2 + Math.floor(hash2(i, x, 3) * (w - 4)), y + 2 + Math.floor(hash2(i, y, 4) * (h / 2)), '#c8d4f0');
  if (opts.moon) {
    p.disc(x + w - 9, y + 7, 3, '#e8ecd8');
    p.disc(x + w - 8, y + 6, 2, '#1e2a46');
  }
  // vizinhança: muro e janela acesa
  p.rect(x, y + h - 9, w, 9, '#18202c');
  p.rect(x + 4, y + h - 13, 14, 5, '#202838');
  p.rect(x + 7, y + h - 12, 3, 2, '#e8b860');
  p.rect(x + w - 16, y + h - 15, 12, 7, '#1c2434');
  p.px(x + w - 12, y + h - 12, '#9fb8d0');
  if (opts.clothes !== false) {
    // varal
    p.line(x, y + 9, x + w - 1, y + 7, '#5a6070');
    if (has.has('roupa_varal')) interviewClothes(p, x + Math.floor(w / 2) - 15, y + 8);
    else {
      p.rect(x + 6, y + 9, 6, 5, '#c8b8a0');
      p.rect(x + w - 14, y + 8, 5, 6, '#8a9ab8');
    }
  }
  // moldura e cruzeta
  p.frame(x - 2, y - 2, w + 4, h + 4, shade(frame, -0.25));
  p.frame(x - 1, y - 1, w + 2, h + 2, frame);
  p.vl(x + Math.floor(w / 2), y, y + h - 1, frame);
  p.hl(x, x + w - 1, y + Math.floor(h / 2), frame);
  // reflexo
  p.line(x + 3, y + h - 4, x + 8, y + h - 9, '#3a4868');
  // peitoril
  p.rect(x - 3, y + h + 1, w + 6, 2, shade(frame, 0.15));
  if (opts.curtain) {
    const c = opts.curtain;
    for (let yy = y - 2; yy < y + 7; yy++)
      for (let xx = x - 2; xx < x + w + 2; xx++) {
        if (yy === y + 6 && (xx & 3) === 0) continue;
        p.px(xx, yy, ((xx >> 1) + (yy >> 1)) % 2 ? c : shade(c, 0.3));
      }
  }
}

function door(p: Pix, x: number, y: number, w: number, h: number, ajar: boolean): void {
  const wood = HOME.wood2;
  const dk = HOME.wood;
  p.rect(x - 2, y - 2, w + 4, h + 2, dk);
  p.hl(x - 2, x + w + 1, y - 2, HOME.tan);
  p.rect(x, y, w, h, wood);
  // almofadas
  p.frame(x + 3, y + 4, w - 6, Math.floor(h / 2) - 6, dk);
  p.frame(x + 3, y + Math.floor(h / 2) + 1, w - 6, Math.floor(h / 2) - 5, dk);
  p.hl(x + 4, x + w - 4, y + 5, HOME.tan);
  p.px(x + 4, y + Math.floor(h / 2) - 1, '#d8b448');
  p.rect(x + 3, y + Math.floor(h / 2) - 1, 2, 2, '#d8b448');
  if (ajar) {
    p.rect(x + w - 3, y, 3, h, '#1a120c');
    p.vl(x + w - 4, y, y + h - 1, shade(wood, 0.2));
  }
}

function bulbLight(p: Pix, x: number, y: number, front: boolean, floorY = 132): void {
  p.glow(x, y, 175, HOME.lampLight, 0.24, 5, 1, front);
  p.glow(x, floorY, 150, HOME.lampLight, 0.15, 4, 0.42, front);
  p.glow(x, y, 26, '#fff4d0', 0.35, 3, 1, front);
}

// -----------------------------------------------------------------------------
// Casa: composição comum dos cômodos
// Com o diálogo aberto a tela de casa sobe a cena 33 linhas e a caixa de texto
// cobre da linha ~160 para baixo; o cabeçalho (retratos da família) cobre o
// canto de cima à esquerda até a linha ~54. Por isso tudo o que importa fica
// na faixa 40..156: a parede com o que conta a história do cômodo, o rodapé
// em WALL_Y e as marcas de chão do elenco entre 118 e 150.
// -----------------------------------------------------------------------------
/** linha do rodapé: onde a parede encontra o piso */
const WALL_Y = 100;
/** marcas de chão (pés) do elenco: fundo (encostado na mobília), meio e frente */
const FEET_BACK = 121;
const FEET_FRONT = 149;

/** piso em perspectiva de um ponto: rejuntes horizontais que se abrem e linhas que fogem para (vx, vy) */
function perspFloor(p: Pix, y0: number, y1: number, base: string, joint: string, o: { vx?: number; vy?: number; step?: number; first?: number; grow?: number; alt?: string; speck?: string; seed?: number } = {}): void {
  const vx = o.vx ?? 160;
  const vy = o.vy ?? y0 - 70;
  const step = o.step ?? 26;
  p.rect(0, y0, 320, y1 - y0, base);
  // fileiras (mais espaçadas perto da câmera)
  const rows: number[] = [y0];
  let s = o.first ?? 5;
  for (let y = y0; y < y1; ) {
    y += Math.max(2, Math.round(s));
    rows.push(Math.min(y1, y));
    s *= o.grow ?? 1.32;
  }
  // xadrez sutil (cerâmica) antes dos rejuntes
  if (o.alt) {
    for (let r = 0; r + 1 < rows.length; r++)
      for (let y = rows[r]; y < rows[r + 1]; y++) {
        const k = (y - vy) / (y0 - vy);
        for (let x = 0; x < 320; x++) {
          const col = Math.floor((vx + (x - vx) / k - (vx - step * 20)) / step);
          if ((col + r) & 1) p.px(x, y, o.alt);
        }
      }
  }
  for (const y of rows) p.hl(0, 319, y, joint);
  for (let k = -24; k <= 24; k++) {
    const xb = vx + k * step;
    const xAt = (y: number) => vx + ((xb - vx) * (y - vy)) / (y0 - vy);
    p.line(xAt(y0), y0, xAt(y1), y1, joint);
  }
  if (o.speck) for (let y = y0; y < y1; y++) for (let x = 0; x < 320; x++) if (hash2(x, y, o.seed ?? 5) < 0.02) p.px(x, y, o.speck);
}

/** rodapé de madeira em WALL_Y */
function skirting(p: Pix, y = WALL_Y): void {
  p.rect(0, y - 4, 320, 4, HOME.wood);
  p.hl(0, 319, y - 4, HOME.tan);
  p.hl(0, 319, y - 1, HOME.bg2);
}

/** sombra de contato da mobília encostada na parede (faixa escura no piso) */
function wallContact(p: Pix, x: number, w: number, y = WALL_Y): void {
  p.recta(x - 1, y, w + 2, 1, '#120a06', 0.45);
  p.recta(x, y + 1, w, 1, '#120a06', 0.25);
}

/**
 * Luz da lâmpada pendurada: um cone pontilhado descendo da lâmpada até a poça
 * de luz no chão (o foco da cena) e um halo amplo. Nas camadas da frente só
 * ilumina pixels opacos.
 */
function bulbCone(p: Pix, x: number, y: number, poolY: number, poolRX: number, front: boolean): void {
  p.glow(x, y, 190, HOME.lampLight, 0.2, 5, 1, front);
  // cone: trapézio da lâmpada até a poça, mais fraco nas bordas
  for (let yy = y + 3; yy < poolY; yy++) {
    const t = (yy - y) / (poolY - y);
    const hw = 3 + t * (poolRX - 3);
    for (let xx = Math.floor(x - hw); xx <= Math.ceil(x + hw); xx++) {
      if (front && !(p.get(xx, yy) >>> 24)) continue;
      const edge = Math.abs(xx - x) / hw;
      if (edge > 1) continue;
      const a = 0.11 * (1 - edge * edge) * (1 - t * 0.35);
      if (bayerOn(xx, yy, 0.75)) p.pxa(xx, yy, HOME.lampLight, a);
    }
  }
  p.glow(x, poolY, poolRX + 26, HOME.lampLight, 0.2, 4, 0.36, front);
  p.glow(x, y + 2, 20, '#fff4d0', 0.45, 3, 1, front);
}

/**
 * Escuridão em volta da fonte de luz: cada pixel escurece com a distância
 * elíptica até (cx, cy), em faixas pontilhadas (nada de degradê contínuo).
 * Deixa o foco da cena claro e os cantos no escuro.
 */
function roomDark(p: Pix, cx: number, cy: number, rx: number, ry: number, col: string, strength: number, front: boolean, start = 0.42, bands = 3, floorY = -1, fry = ry * 0.6): void {
  // faixas chapadas; o pontilhado fica só numa franja estreita entre uma faixa e a outra
  const lo = 0.36;
  const hi = 0.64;
  for (let y = 0; y < SCENE_H; y++)
    for (let x = 0; x < SCENE_W; x++) {
      if (front && !(p.get(x, y) >>> 24)) continue;
      const dx = (x - cx) / rx;
      // no piso (abaixo de floorY) a poça de luz é uma elipse achatada pela perspectiva
      const dy = floorY >= 0 && y >= floorY ? (y - floorY) / fry + (floorY - cy) / ry : (y - cy) / ry;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= start) continue;
      const k = Math.min(1, (d - start) / (1.25 - start)) * bands;
      const fl = Math.floor(k);
      const f = k - fl;
      const q = fl + (f >= hi ? 1 : f <= lo ? 0 : bayerOn(x, y, (f - lo) / (hi - lo)) ? 1 : 0);
      if (q > 0) p.pxa(x, y, col, (Math.min(q, bands) / bands) * strength);
    }
}

/** luminária pendente de esmalte (cúpula verde por fora, branca por dentro) com a lâmpada acesa embaixo */
function pendantLamp(p: Pix, x: number, y: number, top = 0): void {
  p.vl(x, top, y - 2, '#1e1610');
  p.rect(x - 1, y - 2, 3, 2, '#2e2622');
  p.poly(
    [
      [x - 2, y],
      [x + 3, y],
      [x + 7, y + 5],
      [x - 6, y + 5],
    ],
    '#3f6a5a',
  );
  p.hl(x - 1, x + 1, y, '#5f8a7a');
  p.line(x - 2, y + 1, x - 5, y + 4, '#5f8a7a');
  p.hl(x - 6, x + 7, y + 5, '#e8e4d0');
  p.rect(x - 2, y + 6, 5, 2, '#ffe8b0');
  p.px(x - 1, y + 6, '#ffffff');
}

/** lâmpada nua pendurada no fio, com soquete de baquelite */
function bareBulb(p: Pix, x: number, y: number): void {
  p.vl(x, 0, y - 3, '#1e1610');
  p.rect(x - 1, y - 3, 3, 3, '#2e2622');
  p.px(x - 1, y - 3, '#4a403a');
  p.rect(x - 2, y, 5, 4, '#ffe8b0');
  p.rect(x - 1, y + 4, 3, 1, '#ffe8b0');
  p.px(x - 1, y + 1, '#ffffff');
  p.px(x, y + 1, '#fffbe8');
  p.px(x + 2, y + 2, '#f2c46b');
}

/** janela noturna com caixilho de madeira (céu, estrelas, muro do vizinho); o miolo pode ser trocado */
function nightPane(p: Pix, x: number, y: number, w: number, h: number, has: Has, o: { moon?: boolean; clothes?: boolean; seed?: number } = {}): void {
  p.vgrad(x, y, w, h, ['#121a30', '#1c2844', '#2a3654'], 0.7);
  for (let i = 0; i < Math.floor(w / 4); i++) p.px(x + 1 + Math.floor(hash2(i, x, o.seed ?? 3) * (w - 2)), y + 1 + Math.floor(hash2(i, y, (o.seed ?? 3) + 1) * (h * 0.5)), '#c8d4f0');
  if (o.moon) {
    p.disc(x + w - 7, y + 5, 3, '#eef0dc');
    p.disc(x + w - 6, y + 4, 2, '#1c2844');
  }
  // muro e casa do vizinho com a janela acesa
  p.rect(x, y + h - 6, w, 6, '#161e2a');
  p.rect(x + 2, y + h - 11, 13, 5, '#1d2636');
  p.rect(x + 5, y + h - 10, 3, 2, '#e8b860');
  if (o.clothes) {
    // varal da área de serviço
    p.line(x, y + 5, x + w - 1, y + 4, '#6a7080');
    if (has.has('roupa_varal')) interviewClothes(p, x + Math.floor(w / 2) - 15, y + 5);
    else {
      p.rect(x + 4, y + 6, 6, 5, '#c8b8a0');
      p.rect(x + w - 11, y + 5, 5, 6, '#8a9ab8');
    }
  }
}

/** caixilho da janela (moldura, cruzeta, peitoril) por cima do miolo */
function windowFrame(p: Pix, x: number, y: number, w: number, h: number, col: string = HOME.wood2): void {
  p.frame(x - 2, y - 2, w + 4, h + 4, shade(col, -0.3));
  p.frame(x - 1, y - 1, w + 2, h + 2, col);
  p.vl(x + Math.floor(w / 2), y, y + h - 1, col);
  p.hl(x, x + w - 1, y + Math.floor(h / 2), col);
  p.line(x + 2, y + h - 3, x + 6, y + h - 7, '#46567a');
  p.rect(x - 4, y + h + 1, w + 8, 2, shade(col, 0.18));
  p.hl(x - 4, x + w + 3, y + h + 3, shade(col, -0.35));
}

// -----------------------------------------------------------------------------
// COZINHA
// Parede com azulejo até meia altura (friso azul), e na linha do rodapé, da
// esquerda para a direita: porta da área com o crachá no prego, geladeira,
// pia sob a janela, fogão, botijão, filtro de barro, aparador e armário. No
// meio do piso vermelhão, a mesa de toalha xadrez sob a lâmpada: é o foco.
// -----------------------------------------------------------------------------
/** mesa da cozinha: borda de trás/da frente do tampo, largura e linha do chão */
const TABLE = { x: 128, y: 113, w: 64, front: 124, floor: 141 };

function cozinhaBack(p: Pix, has: Has): void {
  // parede de reboco (mais escura perto do teto)
  plaster(p, 0, 0, 320, 70, HOME.wall, mix(HOME.wall, HOME.wall2, 0.7), 11);
  p.rect(0, 0, 320, 4, HOME.wall2);
  p.dith(0, 4, 320, 4, HOME.wall2, 0.5);
  // azulejo branco até meia parede, friso azul em cima
  tileGrid(p, 0, 70, 320, 30, '#ece2c8', '#d2c29c', 7, 7);
  for (let x = 0; x < 320; x += 7) {
    p.rect(x + 1, 71, 6, 5, '#5f7fa8');
    p.px(x + 3, 73, '#ece2c8');
    p.px(x + 4, 73, '#c8d4e4');
  }
  p.hl(0, 319, 70, '#3f5f8a');
  p.hl(0, 319, 76, '#d2c29c');
  skirting(p);
  // piso de cimento queimado vermelho, com juntas em perspectiva e brilho de cera
  perspFloor(p, WALL_Y, 180, '#8e3e2c', '#7c3424', { step: 30, first: 7, speck: '#a4503a', seed: 21 });
  // tapete de retalhos na frente da pia
  for (let r = 0; r < 4; r++) p.ellipse(112, 107, 19 - r * 4.4, 4.6 - r * 1.1, ['#5f7fa8', '#c8a050', '#a8413a', '#e8dcc4'][r]);
  for (let x = 96; x < 129; x += 3) p.px(x, 107 + Math.round(Math.sin(x) * 1.6), '#efe6cf');

  // porta da área, entreaberta (escuro lá fora) + crachá no prego
  const dx = 12;
  p.rect(dx - 3, 54, 28, 46, HOME.wood);
  p.hl(dx - 3, dx + 24, 54, HOME.tan);
  p.rect(dx, 57, 22, 43, '#120c10');
  p.rect(dx + 3, 57, 19, 43, HOME.wood2);
  p.frame(dx + 6, 61, 13, 15, HOME.wood);
  p.frame(dx + 6, 80, 13, 16, HOME.wood);
  p.hl(dx + 7, dx + 17, 62, HOME.tan);
  p.rect(dx + 5, 78, 2, 3, '#d8b448');
  p.vl(dx + 3, 57, 99, shade(HOME.wood2, 0.18));
  // nesga da noite pela fresta
  p.vl(dx + 1, 60, 96, '#1c2844');
  p.px(dx + 1, 64, '#c8d4f0');
  // cesto de roupa suja (a meia da Dona Zélia aparece em cima dele)
  laundryBasket(p, 38, 108, has.has('meia_mancha'));

  // geladeira antiga
  const quebrada = has.has('geladeira_quebrada') && !has.has('geladeira_ok');
  fridge(p, 52, 62, quebrada ? 'quebrada' : 'ok', has.has('desenhos') && !quebrada);
  if (quebrada && has.has('desenhos')) {
    // com a porta aberta, os desenhos ficam presos na parede ao lado
    kidDrawing(p, 40, 84, 9, 9, 'ambulancia', 3);
  }
  wallContact(p, 52, 22);

  // janela sobre a pia, com cortininha de chita
  nightPane(p, 98, 46, 30, 21, has, { clothes: true, seed: 7 });
  windowFrame(p, 98, 46, 30, 21);
  for (let x = 95; x < 132; x++) {
    p.px(x, 44, (x & 1) ? HOME.fabricRed : shade(HOME.fabricRed, 0.25));
    p.px(x, 45, (x & 1) ? shade(HOME.fabricRed, -0.2) : HOME.fabricRed);
    if ((x & 3) !== 0) p.px(x, 46, shade(HOME.fabricRed, -0.15));
  }
  p.hl(94, 132, 43, '#8a8478');
  // bancada de granito com armário embaixo
  const bx = 78;
  const bw = 72;
  p.rect(bx, 82, bw, 4, '#d6cdb9');
  for (let x = bx; x < bx + bw; x++) if (hash2(x, 83, 4) < 0.35) p.px(x, 83 + Math.floor(hash2(x, 2, 5) * 3), '#b8ae9a');
  p.hl(bx, bx + bw - 1, 82, '#ece6d8');
  p.hl(bx, bx + bw - 1, 85, '#a89e8a');
  p.rect(bx + 1, 86, bw - 2, 14, HOME.wood2);
  for (let x = bx + 18; x < bx + bw - 2; x += 18) p.vl(x, 87, 99, HOME.wood);
  for (let x = bx + 8; x < bx + bw; x += 18) p.rect(x, 89, 3, 1, '#d8b448');
  p.hl(bx + 1, bx + bw - 2, 86, shade(HOME.wood2, 0.15));
  wallContact(p, bx, bw);
  // cuba e torneira
  p.rect(100, 82, 24, 3, '#8a9090');
  p.hl(101, 122, 83, '#5f6666');
  p.vl(112, 75, 82, '#b8bcb8');
  p.hl(112, 116, 75, '#b8bcb8');
  p.px(116, 76, '#8a9090');
  p.px(111, 79, '#d8dcd8');
  // garrafa térmica vermelha
  p.rect(82, 70, 6, 12, '#c8302a');
  p.vl(87, 70, 81, '#8a2018');
  p.vl(82, 71, 80, '#e05a4a');
  p.rect(81, 68, 8, 3, '#e8e4dc');
  p.px(83, 67, '#e8e4dc');
  // escorredor com copos e pratos
  p.rect(128, 80, 19, 2, '#8a948f');
  for (let x = 129; x < 147; x += 3) p.vl(x, 74, 80, '#9aa49e');
  p.hl(128, 146, 74, '#9aa49e');
  if (has.has('prato_seco')) plateEdge(p, 134, 71, true);
  else plateEdge(p, 134, 71, false);
  p.rect(129, 76, 3, 4, '#cfe6f0');
  p.rect(140, 76, 4, 4, '#e8e4dc');

  // fogão branco de quatro bocas, com a panela
  const fx = 152;
  p.rect(fx, 81, 26, 3, '#f4f0e6');
  p.hl(fx, fx + 25, 81, '#ffffff');
  for (const ox of [3, 9, 15, 20]) p.rect(fx + ox, 82, 4, 1, '#2a2a2a');
  p.rect(fx, 84, 26, 16, '#e4e0d4');
  p.vl(fx + 25, 84, 99, '#b8b4a8');
  p.hl(fx + 2, fx + 23, 85, '#c8ccc8');
  for (let i = 0; i < 4; i++) p.px(fx + 4 + i * 6, 86, '#2a2a2a');
  p.rect(fx + 3, 88, 20, 10, '#3a3a3a');
  p.rect(fx + 5, 90, 16, 6, '#1e1e1e');
  p.hl(fx + 6, fx + 12, 90, '#4a4a4a');
  p.hl(fx + 3, fx + 22, 87, '#d0d4d0');
  wallContact(p, fx, 26);
  if (!has.has('mesa_vazia')) {
    p.rect(fx + 3, 74, 10, 7, '#b8bcb8');
    p.hl(fx + 3, fx + 12, 74, '#e0e4e0');
    p.vl(fx + 12, 74, 80, '#8a9090');
    p.px(fx + 1, 76, '#2a2a2a');
    p.px(fx + 14, 76, '#2a2a2a');
    p.hl(fx + 4, fx + 11, 73, '#d0d4d0');
    p.px(fx + 8, 72, '#2a2a2a');
  }
  // prateleira com potes, entre a janela e a lâmpada
  p.rect(133, 59, 21, 2, HOME.wood2);
  p.hl(133, 153, 59, HOME.tan);
  p.px(134, 61, HOME.wood);
  p.px(152, 61, HOME.wood);
  for (const [x, c] of [
    [134, '#c8a050'],
    [140, '#e8e0cc'],
    [147, '#5f7fa8'],
  ] as [number, string][]) {
    // a lata de açúcar (e o copo escondido atrás dela) tomam o lugar dos potes da direita
    if ((x === 140 && has.has('lata_acucar')) || (x === 147 && (has.has('suco_escondido') || has.has('lata_acucar')))) continue;
    p.rect(x, 53, 5, 6, c);
    p.hl(x, x + 4, 53, shade(c, 0.3));
    p.vl(x + 4, 54, 58, shade(c, -0.25));
  }
  // copo de suco escondido atrás da lata, e a lata puxada para a frente, torta
  if (has.has('suco_escondido')) juiceGlass(p, 148, 50);
  if (has.has('lata_acucar')) {
    sugarTin(p, 140, 46);
    p.px(140, 46, HOME.wall);
    p.px(147, 59, '#a8a090');
  }
  // botijão de gás
  p.rect(180, 87, 8, 13, '#4a6a8a');
  p.vl(187, 87, 99, '#34506a');
  p.vl(180, 88, 98, '#6a8aa8');
  p.rect(181, 84, 6, 3, '#2a3a4a');
  p.px(183, 83, '#c8302a');
  p.hl(180, 187, 92, '#6a8aa8');

  // filtro de barro no banquinho
  const qx = 191;
  p.rect(qx, 84, 16, 3, HOME.wood2);
  p.hl(qx, qx + 15, 84, HOME.tan);
  p.vl(qx + 1, 87, 99, HOME.wood);
  p.vl(qx + 14, 87, 99, HOME.wood);
  p.hl(qx + 1, qx + 14, 94, HOME.wood);
  p.rect(qx + 3, 63, 10, 9, '#b5653a');
  p.rect(qx + 3, 72, 10, 12, '#a8582e');
  p.hl(qx + 3, qx + 12, 63, '#d0804a');
  p.hl(qx + 3, qx + 12, 72, '#8a4422');
  p.vl(qx + 12, 64, 83, '#7a3e1e');
  p.vl(qx + 3, 64, 83, '#c87444');
  p.rect(qx + 5, 61, 6, 2, '#c87444');
  p.px(qx + 2, 79, '#c8c8c0');
  p.px(qx + 1, 79, '#c8c8c0');
  // relógio de parede (sempre atrasado)
  p.disc(178, 47, 5, '#5a3a22');
  p.disc(178, 47, 4, '#f4ecd8');
  p.vl(178, 44, 47, '#1b1a17');
  p.hl(178, 180, 47, '#1b1a17');
  p.px(178, 43, '#c8302a');

  // calendário e foto da família, sobre o aparador
  p.rect(214, 50, 13, 17, '#f4f0e6');
  p.rect(214, 50, 13, 4, '#c8302a');
  p.px(217, 49, '#2a2a2a');
  p.px(223, 49, '#2a2a2a');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) p.px(216 + c * 3, 56 + r * 3, '#8a948f');
  p.ring(222, 59, 2, '#d94436');
  familyPhoto(p, 231, 54, 14, 11);
  // aparador (mesa de costura quando há máquina)
  const ax = 212;
  p.rect(ax, 84, 34, 3, HOME.wood2);
  p.hl(ax, ax + 33, 84, HOME.tan);
  p.vl(ax + 1, 87, 99, HOME.wood);
  p.vl(ax + 32, 87, 99, HOME.wood);
  p.hl(ax + 1, ax + 32, 93, HOME.wood);
  if (has.has('maquina')) sewingMachine(p, ax + 4, 67, has.has('cartao_maquina'));
  else {
    // rádio de pilha e cesta de linhas
    p.rect(ax + 4, 75, 12, 9, '#7a4a2a');
    p.rect(ax + 5, 76, 6, 5, '#3a2a1a');
    for (let yy = 76; yy < 81; yy += 2) p.hl(ax + 5, ax + 10, yy, '#5a4a3a');
    p.px(ax + 13, 77, '#d8b448');
    p.px(ax + 13, 80, '#d8b448');
    p.line(ax + 14, 75, ax + 18, 68, '#8a948f');
    p.ellipse(ax + 25, 81, 5, 2.6, '#a8763f');
    p.px(ax + 23, 79, '#c8302a');
    p.px(ax + 26, 79, '#3f5f8a');
    if (has.has('cartao_maquina')) {
      p.rect(ax + 19, 75, 6, 4, '#f8f6ee');
      p.hl(ax + 20, ax + 23, 76, '#2a3a6a');
    }
  }
  // armário alto de duas portas
  const cx = 252;
  p.rect(cx, 52, 40, 4, HOME.wood2);
  p.hl(cx, cx + 39, 52, HOME.tan);
  p.rect(cx, 56, 40, 44, HOME.wood);
  p.rect(cx + 2, 58, 17, 41, HOME.wood2);
  p.rect(cx + 21, 58, 17, 41, HOME.wood2);
  p.frame(cx + 4, 61, 13, 16, HOME.wood);
  p.frame(cx + 23, 61, 13, 16, HOME.wood);
  p.frame(cx + 4, 80, 13, 16, HOME.wood);
  p.frame(cx + 23, 80, 13, 16, HOME.wood);
  p.px(cx + 17, 78, '#d8b448');
  p.px(cx + 22, 78, '#d8b448');
  p.vl(cx + 39, 56, 99, HOME.bg2);
  p.vl(cx + 2, 58, 98, shade(HOME.wood2, 0.12));
  wallContact(p, cx, 40);
  // cesto de vime em cima do armário
  p.rect(cx + 8, 46, 16, 6, '#a8763f');
  p.hl(cx + 8, cx + 23, 46, '#c8a060');
  for (let x = cx + 9; x < cx + 23; x += 2) p.px(x, 48, '#8a5a2a');
  // vassoura encostada no canto
  p.line(302, 58, 306, 96, '#a8763f');
  p.rect(303, 94, 7, 6, '#c8a050');
  for (let x = 303; x < 310; x += 2) p.vl(x, 96, 99, '#a8803a');

  // lâmpada sobre a mesa
  bareBulb(p, 160, 58);
  // cadeiras de trás da mesa (encostos aparecem acima do tampo)
  for (const x of [139, 167]) chairBack(p, x, 99);
}

/** encosto de cadeira de madeira visto de frente (14 de largura), topo em y */
function chairBack(p: Pix, x: number, y: number): void {
  p.vl(x, y, y + 16, HOME.wood);
  p.vl(x + 13, y, y + 16, HOME.wood);
  p.rect(x, y, 14, 3, HOME.wood2);
  p.hl(x, x + 13, y, HOME.tan);
  p.hl(x + 1, x + 12, y + 6, HOME.wood2);
  p.hl(x + 1, x + 12, y + 7, HOME.wood);
}

/**
 * Cadeira de madeira vista de frente, vazia (18 de largura), centrada em cx com
 * os pés em floorY: encosto com duas travessas, assento na altura do colo de
 * quem senta (o mesmo desenho da cadeira dos sprites sentados).
 */
function frontChair(p: Pix, cx: number, floorY: number): void {
  const x = cx - 9;
  const top = floorY - 16;
  const seat = floorY - 6;
  floorShadow(p, cx, floorY + 1, 10, 1.6, 0.32);
  // pernas de trás e montantes do encosto
  p.vl(x + 1, top, floorY, HOME.wood);
  p.vl(x + 16, top, floorY, HOME.wood);
  p.px(x + 1, top, HOME.tan);
  p.px(x + 16, top, HOME.tan);
  // travessas do encosto
  p.rect(x + 2, top + 1, 14, 3, HOME.wood2);
  p.hl(x + 2, x + 15, top + 1, HOME.tan);
  p.hl(x + 2, x + 15, top + 3, HOME.wood);
  p.hl(x + 2, x + 15, top + 6, HOME.wood2);
  p.hl(x + 2, x + 15, top + 7, HOME.wood);
  // assento e pernas da frente
  p.rect(x, seat, 18, 2, HOME.wood2);
  p.hl(x, x + 17, seat, HOME.tan);
  p.hl(x, x + 17, seat + 2, HOME.bg2);
  p.vl(x + 2, seat + 2, floorY, HOME.wood);
  p.vl(x + 15, seat + 2, floorY, HOME.wood);
  p.px(x + 2, floorY, HOME.bg2);
  p.px(x + 15, floorY, HOME.bg2);
}

/** cesto de roupa suja de vime (14×10), base em bottomY; com a meia manchada por cima */
function laundryBasket(p: Pix, x: number, bottomY: number, sock: boolean): void {
  const y = bottomY - 10;
  floorShadow(p, x + 7, bottomY + 1, 8, 1.5, 0.32);
  // toalhas saindo por cima
  p.rect(x + 2, y - 2, 10, 3, '#e8dcc4');
  p.rect(x + 6, y - 3, 5, 2, '#7a98c0');
  p.px(x + 3, y - 3, '#e8dcc4');
  // corpo trançado
  p.rect(x, y, 14, 10, '#a8763f');
  for (let yy = y + 1; yy < y + 10; yy += 2) for (let xx = x + ((yy >> 1) & 1); xx < x + 14; xx += 2) p.px(xx, yy, '#8a5a2a');
  p.hl(x, x + 13, y, '#c8a060');
  p.vl(x + 13, y + 1, y + 9, '#6a4422');
  p.hl(x + 1, x + 12, bottomY - 1, '#6a4422');
  if (sock) stainedSock(p, x + 3, y - 6);
}

/** xale de crochê lilás da Dona Zélia dobrado no encosto de uma cadeira vazia */
function shawlOn(p: Pix, cx: number, floorY: number): void {
  const x = cx - 8;
  const y = floorY - 16;
  const c = '#9a7ab0';
  const cd = '#6a4a80';
  for (let yy = y; yy <= y + 9; yy++)
    for (let xx = x; xx <= x + 15; xx++) {
      if (yy === y + 9 && (xx + yy) % 2 === 0) continue;
      p.px(xx, yy, (xx + yy) % 3 === 0 ? cd : yy === y ? shade(c, 0.2) : c);
    }
  for (let xx = x + 1; xx <= x + 15; xx += 3) p.px(xx, y + 10, cd);
}

function cozinhaFront(p: Pix, has: Has): void {
  const { x, y, w, front, floor } = TABLE;
  floorShadow(p, x + w / 2, floor, w / 2 + 10, 4.5, 0.42);
  if (has.has('mesa_vazia')) {
    // mesa nua, sem toalha, um prato vazio no meio
    p.rect(x, y, w, front - y, HOME.wood2);
    for (let yy = y + 2; yy < front; yy += 3) p.hl(x + 2, x + w - 3, yy, shade(HOME.wood2, -0.12));
    p.hl(x, x + w - 1, y, HOME.tan);
    p.rect(x, front, w, 4, HOME.wood);
    p.hl(x, x + w - 1, front, shade(HOME.wood, 0.2));
    for (const lx of [x + 2, x + w - 5]) p.rect(lx, front + 4, 3, floor - front - 4, HOME.wood);
    p.ellipse(160, y + 6, 9, 3, '#f4f0e6');
    p.ellipse(160, y + 6, 5.5, 1.8, '#e0dcd0');
    p.hl(170, 175, y + 6, '#b8bcb8');
  } else {
    // toalha xadrez: tampo em perspectiva e a barra caindo na frente
    const hemTo = front + 7;
    for (let yy = y; yy < hemTo; yy++)
      for (let xx = x - 2; xx < x + w + 2; xx++) {
        const hem = yy >= front;
        if (hem && yy === hemTo - 1 && (xx & 3) === 0) continue;
        // quadros de 4 px, achatados no tampo (perspectiva)
        const ry = hem ? (yy - front) >> 2 : (yy - y) / 2.5;
        const check = ((xx >> 2) + Math.floor(ry)) & 1;
        let c = check ? '#efe4cc' : HOME.fabricRed;
        if ((xx >> 2) & 1 && Math.floor(ry) & 1) c = '#c87060';
        if (hem) c = shade(c, -0.2);
        p.px(xx, yy, c);
      }
    p.hl(x - 2, x + w + 1, y, '#f8f0dc');
    p.hl(x - 2, x + w + 1, front, shade('#efe4cc', -0.1));
    for (const lx of [x + 1, x + w - 4]) p.rect(lx, hemTo, 3, floor - hemTo, HOME.wood);
    for (const lx of [x + 1, x + w - 4]) p.px(lx, hemTo, HOME.bg2);
    // fruteira no centro (quando nada mais ocupa o meio)
    if (!has.has('bolo') && !has.has('vela')) {
      p.ellipse(167, y + 6, 8, 3, '#a8763f');
      p.ellipse(167, y + 5, 6.5, 2.2, '#7a5030');
      p.disc(164, y + 3, 2, '#f29a2a');
      p.disc(169, y + 2, 2, '#e8a33d');
      p.line(170, y + 4, 175, y + 1, '#f2d45c');
      p.line(170, y + 5, 175, y + 2, '#e8c040');
      p.px(163, y + 2, '#ffd08a');
    }
    // açucareiro de louça
    p.rect(139, y + 3, 5, 4, '#f4f0e6');
    p.hl(139, 143, y + 3, '#ffffff');
    p.vl(143, y + 4, y + 6, '#c8c4bc');
    p.px(141, y + 2, '#d8d4cc');
  }
}

function cozinhaPlace(c: SceneCast): Placement {
  const x = clampX(c.x, 24, 296);
  if (c.pose === 'deitado') return { x: clampX(x, 70, 250), bottom: 152, layer: 'top', blanket: HOME.fabricBlue };
  if (c.pose === 'sentado') {
    // atrás da mesa (só o tronco aparece acima do tampo) ou numa das cabeceiras
    if (x >= 124 && x <= 196) return { x: x < 160 ? 146 : 174, bottom: FEET_BACK + 1, layer: 'back' };
    if (x < 124) return { x: 116, bottom: 138, layer: 'top', chair: true, seat: 'cab_esq' };
    return { x: 204, bottom: 138, layer: 'top', chair: true, seat: 'cab_dir' };
  }
  // em pé: atrás da mesa (a criança mais perto da borda, para o tronco aparecer), ou na frente, dos lados
  if (x >= 118 && x <= 202) return { x: clampX(x, 134, 186), bottom: c.id === 'DAVI' ? TABLE.y + 5 : FEET_BACK + 2, layer: 'back' };
  if (x < 118) return { x: clampX(x, 40, 100), bottom: FEET_FRONT - 2, layer: 'top' };
  return { x: clampX(x, 230, 276), bottom: FEET_FRONT - 2, layer: 'top' };
}

/** cadeiras das cabeceiras sem ninguém: a bolsa largada na da esquerda, o xale da Zélia na dela */
function cozinhaSeats(p: Pix, has: Has, occ: Set<string>): void {
  if (!occ.has('cab_esq')) {
    frontChair(p, 116, 138);
    if (has.has('bolsa_passagem')) handbag(p, 110, 120);
  }
  if (!occ.has('cab_dir')) {
    frontChair(p, 204, 138);
    if (has.has('cadeira_vazia')) shawlOn(p, 204, 138);
  }
}

function cozinhaAnim(p: Pix, has: Has, t: number): void {
  // vapor da panela
  if (!has.has('mesa_vazia')) {
    for (let i = 0; i < 3; i++) {
      const ph = ((t / 900 + i / 3) % 1 + 1) % 1;
      const yy = 71 - Math.floor(ph * 14);
      const xx = 159 + i * 2 + Math.round(Math.sin(ph * 6 + i) * 1.5);
      p.pxa(xx, yy, '#ffffff', 0.5 * (1 - ph));
      p.pxa(xx + 1, yy - 1, '#ffffff', 0.32 * (1 - ph));
    }
  }
  // geladeira quebrada: gota pingando na poça
  if (has.has('geladeira_quebrada') && !has.has('geladeira_ok')) {
    const ph = (t % 1400) / 1400;
    if (ph < 0.7) p.px(60, 77 + Math.floor(ph * 26), '#9fd0ea');
    else p.ellipse(60, 104, 2 + (ph - 0.7) * 10, 1, '#bfe3f2', 0.6);
  }
}

function cozinhaLight(p: Pix, front: boolean): void {
  bulbCone(p, 160, 60, TABLE.y + 6, 44, front);
  roomDark(p, 160, 62, 200, 120, HOME.bg0, 0.6, front, 0.45, 3, 118, 70);
}

// -----------------------------------------------------------------------------
// SALA
// Papel de parede listrado e piso cerâmico bege. Na parede do fundo: a porta
// da frente (com o crachá no prego), a estante com a TV, o sofá azul sob a
// janela, o bordado "LAR DOCE LAR" e o canto da costura. Na frente do sofá, o
// tapete e a mesinha de centro; a poltrona vermelha da Dona Zélia de lado,
// virada para a TV. A luz vem da lâmpada no meio e do azul da novela.
// -----------------------------------------------------------------------------
const COFFEE = { x: 136, y: 121, w: 48, front: 127, floor: 134 };
/** poltrona da Dona Zélia: centro e linha do chão */
const ARMCHAIR = { x: 236, floor: 124 };

function salaBack(p: Pix, has: Has): void {
  // papel de parede listrado com florzinhas
  p.rect(0, 0, 320, WALL_Y, HOME.wall);
  for (let x = 0; x < 320; x += 8) p.rect(x, 0, 3, WALL_Y, mix(HOME.wall, HOME.wall2, 0.5));
  for (let y = 8; y < 92; y += 10) for (let x = 5; x < 320; x += 16) p.px(x + ((y / 10) % 2) * 8, y, mix(HOME.wall, HOME.fabricRed, 0.35));
  p.rect(0, 0, 320, 4, HOME.wall2);
  p.dith(0, 4, 320, 4, HOME.wall2, 0.5);
  // viga do teto (de madeira, atravessando a sala)
  p.rect(0, 26, 320, 5, HOME.wood);
  p.hl(0, 319, 26, HOME.tan);
  p.hl(0, 319, 30, HOME.bg2);
  p.recta(0, 31, 320, 2, '#120a06', 0.25);
  skirting(p);
  // piso cerâmico bege em perspectiva
  perspFloor(p, WALL_Y, 180, '#b0926a', '#9a7c56', { step: 26, first: 6, speck: '#c4a880', seed: 33 });
  salaRug(p);

  // porta da frente e capacho
  const dx = 12;
  p.rect(dx - 3, 52, 28, 48, HOME.wood);
  p.hl(dx - 3, dx + 24, 52, HOME.tan);
  p.rect(dx, 55, 22, 45, HOME.wood2);
  p.frame(dx + 3, 59, 16, 16, HOME.wood);
  p.frame(dx + 3, 79, 16, 17, HOME.wood);
  p.hl(dx + 4, dx + 17, 60, HOME.tan);
  p.rect(dx + 17, 77, 2, 3, '#d8b448');
  p.px(dx + 11, 66, '#1b1a17');
  p.vl(dx, 55, 99, shade(HOME.wood2, 0.18));
  p.rect(dx - 2, 101, 26, 4, '#7a5a3a');
  for (let xx = dx - 1; xx < dx + 23; xx += 2) p.px(xx, 102, '#5a4028');

  // estante com a TV de tubo, planta e bibelô
  const ex = 54;
  p.rect(ex, 86, 44, 3, HOME.wood2);
  p.hl(ex, ex + 43, 86, HOME.tan);
  p.rect(ex, 89, 44, 11, HOME.wood);
  p.rect(ex + 2, 90, 19, 9, HOME.wood2);
  p.rect(ex + 23, 90, 19, 9, HOME.wood2);
  p.px(ex + 19, 94, '#d8b448');
  p.px(ex + 25, 94, '#d8b448');
  wallContact(p, ex, 44);
  p.rect(ex + 10, 68, 24, 18, '#1e1e22');
  p.rect(ex + 12, 70, 20, 13, '#2a3448');
  p.rect(ex + 18, 84, 8, 2, '#2a2a2e');
  p.px(ex + 31, 84, '#d94436');
  p.line(ex + 18, 68, ex + 14, 60, '#8a8a8a');
  p.line(ex + 24, 68, ex + 29, 60, '#8a8a8a');
  p.rect(ex + 2, 79, 5, 7, '#a8582e');
  p.disc(ex + 4, 76, 4, HOME.plant);
  p.px(ex + 2, 74, shade(HOME.plant, 0.3));
  p.px(ex + 6, 73, shade(HOME.plant, -0.2));
  p.rect(ex + 37, 81, 4, 5, '#e8e4dc');
  p.px(ex + 38, 80, '#e8e4dc');
  // janela sobre o sofá, com cortinas azuis
  nightPane(p, 140, 40, 40, 26, has, { moon: true, clothes: has.has('roupa_varal'), seed: 9 });
  windowFrame(p, 140, 40, 40, 26);
  for (const [x0, x1] of [
    [133, 141],
    [179, 187],
  ] as [number, number][])
    for (let x = x0; x < x1; x++) p.vl(x, 37, 70, (x & 1) ? HOME.fabricBlue : shade(HOME.fabricBlue, 0.22));
  p.hl(130, 190, 36, '#8a8478');
  // sofá azul com manta de crochê no encosto
  const sx = 118;
  const sw = 84;
  const sofa = HOME.fabricBlue;
  p.rect(sx + 5, 74, sw - 10, 14, sofa);
  p.hl(sx + 5, sx + sw - 6, 74, shade(sofa, 0.25));
  for (let xx = sx + 5 + 25; xx < sx + sw - 6; xx += 25) p.vl(xx, 75, 87, shade(sofa, -0.25));
  for (let yy = 75; yy < 83; yy++) for (let xx = sx + 46; xx < sx + 66; xx++) if ((xx + yy) % 2 === 0 || yy === 75) p.px(xx, yy, yy === 82 ? '#d8d0c0' : '#f0e8d8');
  p.rect(sx + 5, 88, sw - 10, 5, shade(sofa, 0.12));
  for (let xx = sx + 5 + 25; xx < sx + sw - 6; xx += 25) p.vl(xx, 88, 92, shade(sofa, -0.1));
  p.rect(sx + 5, 93, sw - 10, 6, shade(sofa, -0.22));
  p.rect(sx, 80, 6, 19, shade(sofa, -0.05));
  p.hl(sx, sx + 5, 80, shade(sofa, 0.3));
  p.rect(sx + sw - 6, 80, 6, 19, shade(sofa, -0.32));
  p.hl(sx, sx + sw - 1, 99, HOME.bg2);
  p.vl(sx + 2, 99, 100, HOME.bg2);
  p.vl(sx + sw - 3, 99, 100, HOME.bg2);
  wallContact(p, sx, sw);

  // bordado "LAR DOCE LAR" no bastidor (trabalho do ateliê)
  const hx = 214;
  const hy = 58;
  p.disc(hx, hy, 12, '#a8763f');
  p.disc(hx, hy, 11, '#f4ecd8');
  p.ring(hx, hy, 11, '#8a5a2a');
  drawText(p, 'LAR', hx, hy - 8, '#c8302a', { align: 'center' });
  drawText(p, 'DOCE', hx, hy - 2, '#3f5f8a', { align: 'center' });
  drawText(p, 'LAR', hx, hy + 4, '#c8302a', { align: 'center' });
  p.px(hx - 8, hy + 3, '#4fae5b');
  p.px(hx + 8, hy + 3, '#4fae5b');
  p.px(hx, hy + 10, '#e8566a');
  p.rect(hx - 1, hy - 14, 3, 2, '#d8b448');

  // canto da costura: mesa, pilha de tecidos, cesta de linhas
  const kx = 248;
  p.rect(kx, 84, 46, 3, HOME.wood2);
  p.hl(kx, kx + 45, 84, HOME.tan);
  p.vl(kx + 1, 87, 99, HOME.wood);
  p.vl(kx + 44, 87, 99, HOME.wood);
  p.hl(kx + 1, kx + 44, 94, HOME.wood);
  wallContact(p, kx, 46);
  p.rect(kx + 33, 76, 11, 3, '#5f7fa8');
  p.rect(kx + 34, 79, 10, 3, '#e8a33d');
  p.rect(kx + 33, 82, 11, 2, '#c86a8a');
  p.ellipse(kx + 10, 97, 6, 3, '#a8763f');
  p.px(kx + 8, 95, '#c8302a');
  p.px(kx + 11, 95, '#4fae5b');
  if (has.has('maquina')) sewingMachine(p, kx + 4, 67, has.has('cartao_maquina'));
  else {
    // costura à mão: almofada de alfinetes, tesoura e retalhos
    p.disc(kx + 8, 81, 3, '#c8302a');
    p.px(kx + 7, 79, '#e8e4dc');
    p.px(kx + 9, 78, '#e8e4dc');
    p.line(kx + 15, 83, kx + 20, 80, '#b8bcb8');
    p.line(kx + 15, 80, kx + 20, 83, '#b8bcb8');
    p.rect(kx + 22, 82, 8, 2, '#f0e8d8');
    if (has.has('cartao_maquina')) {
      p.rect(kx + 22, 78, 6, 4, '#f8f6ee');
      p.hl(kx + 23, kx + 26, 79, '#2a3a6a');
    }
  }
  // manequim de costura no canto
  p.ellipse(305, 66, 6, 8, '#d8c8b0');
  p.ellipse(305, 66, 5, 7, '#e8dcc4');
  p.rect(303, 56, 5, 3, '#d8c8b0');
  p.vl(305, 74, 97, '#5a3a22');
  p.hl(300, 310, 98, '#5a3a22');
  p.line(300, 62, 310, 70, '#e8c84a');

  // poltrona da Dona Zélia
  armchair(p, ARMCHAIR.x, ARMCHAIR.floor);
  // luminária pendurada na viga
  pendantLamp(p, 160, 33, 31);
}

/** poltrona vermelha da Dona Zélia, de três quartos (virada para a TV), centro cx e chão floorY */
function armchair(p: Pix, cx: number, floorY: number): void {
  const red = HOME.fabricRed;
  const x = cx - 13;
  const y = floorY - 26;
  floorShadow(p, cx, floorY + 1, 15, 2.2, 0.38);
  // encosto alto
  p.rect(x + 4, y, 20, 14, red);
  p.hl(x + 4, x + 23, y, shade(red, 0.25));
  p.rect(x + 5, y + 1, 18, 1, shade(red, 0.15));
  // braços
  p.rect(x, y + 9, 6, 14, shade(red, -0.08));
  p.hl(x, x + 5, y + 9, shade(red, 0.22));
  p.rect(x + 21, y + 9, 6, 14, shade(red, -0.3));
  p.hl(x + 21, x + 26, y + 9, shade(red, 0.05));
  // assento
  p.rect(x + 6, y + 14, 15, 4, shade(red, 0.12));
  p.rect(x + 6, y + 18, 15, 5, shade(red, -0.2));
  // pés de palito
  p.vl(x + 2, y + 23, floorY, HOME.wood);
  p.vl(x + 24, y + 23, floorY, HOME.wood);
  p.px(x + 2, floorY, HOME.bg2);
  p.px(x + 24, floorY, HOME.bg2);
}

function salaFront(p: Pix, has: Has): void {
  // tapete persa de feira e a mesinha de centro
  const { x, y, w, front, floor } = COFFEE;
  floorShadow(p, x + w / 2, floor + 1, w / 2 + 3, 2.5, 0.35);
  p.rect(x, y, w, front - y, HOME.wood2);
  p.hl(x, x + w - 1, y, HOME.tan);
  p.rect(x, front, w, 3, HOME.wood);
  p.hl(x, x + w - 1, front + 2, HOME.bg2);
  for (const lx of [x + 2, x + w - 4]) p.rect(lx, front + 3, 2, floor - front - 3, HOME.wood);
  // paninho de crochê
  p.ellipse(x + w / 2, y + 3, 9, 2.4, '#f0e8d8');
  for (let xx = x + w / 2 - 8; xx < x + w / 2 + 9; xx += 2) p.px(xx, y + 5, '#d8d0c0');
}

function salaRug(p: Pix): void {
  // tapete vermelho com barra dourada e franjas, sob a mesinha
  const x0 = 104;
  const x1 = 216;
  const y0 = 110;
  const y1 = 144;
  p.rect(x0, y0, x1 - x0, y1 - y0, HOME.fabricRed);
  p.frame(x0, y0, x1 - x0, y1 - y0, '#7a2a24');
  p.frame(x0 + 3, y0 + 2, x1 - x0 - 6, y1 - y0 - 4, '#e8c46a');
  for (let yy = y0 + 6; yy < y1 - 4; yy += 6) for (let xx = x0 + 9; xx < x1 - 6; xx += 10) p.px(xx + ((yy / 6) % 2) * 5, yy, '#e8c46a');
  for (let xx = x0; xx < x1; xx += 2) {
    p.px(xx, y0 - 1, '#d8c4a0');
    p.px(xx, y1, '#d8c4a0');
  }
}

function salaPlace(c: SceneCast): Placement {
  const x = clampX(c.x, 24, 296);
  if (c.pose === 'deitado') {
    // deitado no sofá, coberto com a manta
    if (x >= 110 && x <= 210) return { x: 160, bottom: 92, layer: 'back', blanket: '#8a6aa0', seat: 'sofa' };
    return { x: clampX(x, 60, 260), bottom: 150, layer: 'top', blanket: HOME.fabricBlue };
  }
  if (c.pose === 'sentado') {
    if (x >= 210) return { x: ARMCHAIR.x, bottom: ARMCHAIR.floor - 2, layer: 'back', seat: 'poltrona' };
    if (x >= 112) return { x: clampX(x, 134, 186), bottom: 98, layer: 'back' };
    return { x: clampX(x, 40, 96), bottom: FEET_FRONT - 2, layer: 'top', chair: true };
  }
  // em pé: ao lado do sofá, entre o sofá e a mesinha, ou no canto da costura
  if (x >= 214) return { x: clampX(x, 262, 290), bottom: 122, layer: 'back' };
  if (x >= 126) return { x: clampX(x, 134, 194), bottom: 116, layer: 'back' };
  return { x: clampX(x, 40, 112), bottom: 126, layer: 'back' };
}

/** poltrona vazia: com o xale dobrado quando a Dona Zélia não está */
function salaSeats(p: Pix, has: Has, occ: Set<string>): void {
  if (occ.has('poltrona')) return;
  if (has.has('cadeira_vazia')) {
    const x = ARMCHAIR.x - 9;
    const y = ARMCHAIR.floor - 22;
    for (let yy = y; yy < y + 9; yy++) for (let xx = x; xx < x + 18; xx++) p.px(xx, yy, (xx + yy) % 3 ? '#9a7ab0' : '#6a4a80');
    for (let xx = x + 1; xx < x + 18; xx += 3) p.px(xx, y + 9, '#6a4a80');
  }
}

function salaAnim(p: Pix, has: Has, t: number): void {
  // TV: novela piscando
  const k = Math.floor(t / 260);
  const cols = ['#6a8ab8', '#8aa8c8', '#7a98b0', '#a8b8c8', '#5a7aa8'];
  const c = cols[k % cols.length];
  p.rect(66, 70, 20, 13, c);
  for (let i = 0; i < 4; i++) p.hl(66, 85, 71 + ((k * 3 + i * 4) % 12), shade(c, 0.15));
  p.rect(68 + (k % 3) * 3, 75, 5, 8, '#3a3040');
  p.rect(77 - (k % 2) * 2, 74, 4, 9, '#5a3a3a');
  p.glow(76, 78, 34, c, 0.13, 3);
}

function salaLight(p: Pix, front: boolean): void {
  bulbCone(p, 160, 40, COFFEE.y + 2, 50, front);
  roomDark(p, 160, 52, 210, 130, HOME.bg0, 0.55, front, 0.5, 3, 118, 84);
}

// -----------------------------------------------------------------------------
// QUARTO (do Liam)
// Parede azul com estrelinhas e os desenhos de ambulância por cima da cama. A
// cama encostada na parede (cabeceira à esquerda), o criado-mudo com o abajur
// (a luz quente do quarto), a janela com a lua (luz fria), a escrivaninha dos
// lápis de cor e o guarda-roupa com o adesivo de ambulância. No chão, o tapete
// redondo e a ambulância de brinquedo.
// -----------------------------------------------------------------------------
/** cama: x da cabeceira e do pé, linha do colchão (borda da frente) e do chão */
const BED = { x0: 14, x1: 104, top: 98, floor: 108 };
const LAMP = { x: 113, y: 75 };

function quartoBack(p: Pix, has: Has): void {
  const wall = '#8fa2ba';
  p.rect(0, 0, 320, WALL_Y, wall);
  for (let y = 8; y < 94; y += 12)
    for (let x = 6; x < 320; x += 18) {
      const sx = x + ((y / 12) % 2) * 9;
      p.px(sx, y, '#c8d4e4');
      p.px(sx - 1, y, '#aebcd0');
      p.px(sx + 1, y, '#aebcd0');
      p.px(sx, y - 1, '#aebcd0');
      p.px(sx, y + 1, '#aebcd0');
    }
  p.rect(0, 0, 320, 4, shade(wall, -0.2));
  p.dith(0, 4, 320, 4, shade(wall, -0.2), 0.5);
  // faixa de cor na meia parede
  p.rect(0, 80, 320, 2, '#e8c46a');
  skirting(p);
  // piso de tacos em perspectiva
  perspFloor(p, WALL_Y, 180, '#8a6038', '#6a4428', { step: 13, first: 4, grow: 1.22, speck: '#9a7048', seed: 41 });
  // tapete redondo
  p.ellipse(176, 132, 44, 11, '#4f7f5a');
  p.ellipse(176, 132, 38, 8.8, '#e8c46a');
  p.ellipse(176, 132, 31, 6.6, '#4f7f5a');
  p.ellipse(176, 132, 22, 4.4, '#7a9f6a');

  // desenhos de ambulância por cima da cama (sempre)
  kidDrawing(p, 26, 56, 14, 12, 'ambulancia', 1);
  kidDrawing(p, 44, 61, 12, 11, 'familia', 2);
  kidDrawing(p, 60, 55, 14, 12, 'ambulancia', 3);
  kidDrawing(p, 78, 62, 11, 10, 'sol', 4);

  // cama: cabeceira, colchão visto de cima e de lado, pé da cama
  const { x0, x1, top, floor } = BED;
  floorShadow(p, (x0 + x1) / 2, floor + 1, (x1 - x0) / 2 + 2, 2.2, 0.38);
  p.rect(x0 + 4, top - 8, x1 - x0 - 6, 9, '#efe9dc');
  p.rect(x0 + 4, top + 1, x1 - x0 - 6, 4, '#d8d0c0');
  p.rect(x0 + 4, top + 5, x1 - x0 - 6, floor - top - 5, HOME.wood2);
  p.hl(x0 + 4, x1 - 3, top + 5, HOME.tan);
  // cobertor azul de estrelinhas (dobrado no travesseiro)
  for (let yy = top - 8; yy <= top + 4; yy++)
    for (let xx = x0 + 22; xx < x1 - 2; xx++) {
      let c: string = HOME.fabricBlue;
      if (yy > top) c = shade(HOME.fabricBlue, -0.28);
      else if ((xx * 7 + yy * 3) % 23 === 0) c = '#f2d45c';
      else if (yy === top - 8) c = shade(HOME.fabricBlue, 0.25);
      p.px(xx, yy, c);
    }
  p.rect(x0 + 19, top - 8, 3, 13, '#efe9dc');
  // travesseiro
  p.rect(x0 + 6, top - 7, 12, 6, '#f8f4ea');
  p.hl(x0 + 6, x0 + 17, top - 2, '#d8d0c0');
  // cabeceira alta e pé baixo
  p.rect(x0, top - 26, 5, floor - top + 26, HOME.wood);
  p.hl(x0, x0 + 4, top - 26, HOME.tan);
  p.vl(x0 + 1, top - 25, floor - 1, shade(HOME.wood, 0.18));
  p.rect(x1 - 3, top - 10, 4, floor - top + 10, HOME.wood);
  p.hl(x1 - 3, x1, top - 10, HOME.tan);

  // criado-mudo e abajur
  const nx = 107;
  p.rect(nx, 86, 25, 3, HOME.wood2);
  p.hl(nx, nx + 24, 86, HOME.tan);
  p.rect(nx, 89, 25, 11, HOME.wood);
  p.hl(nx + 2, nx + 22, 94, HOME.wood2);
  p.px(nx + 12, 91, '#d8b448');
  wallContact(p, nx, 25);
  p.rect(LAMP.x - 1, 80, 3, 6, '#c8c0b0');
  p.rect(LAMP.x - 3, 85, 7, 1, '#a8a090');
  p.poly(
    [
      [LAMP.x - 6, 80],
      [LAMP.x + 6, 80],
      [LAMP.x + 4, 72],
      [LAMP.x - 4, 72],
    ],
    '#f2d08a',
  );
  p.hl(LAMP.x - 4, LAMP.x + 4, 72, '#fff0c0');

  // janela com cortina amarela e a lua
  nightPane(p, 140, 46, 36, 26, has, { moon: true, seed: 5 });
  windowFrame(p, 140, 46, 36, 26);
  for (let x = 136; x < 181; x++) {
    p.px(x, 42, (x & 1) ? '#e8c46a' : '#f2d898');
    p.px(x, 43, (x & 1) ? '#c8a44a' : '#e8c46a');
    if ((x & 3) !== 0) p.px(x, 44, '#c8a44a');
  }
  p.hl(134, 182, 41, '#8a8478');

  // escrivaninha com lápis de cor e a cadeirinha vermelha
  const dx = 190;
  p.rect(dx, 84, 40, 3, HOME.wood2);
  p.hl(dx, dx + 39, 84, HOME.tan);
  p.vl(dx + 1, 87, 99, HOME.wood);
  p.vl(dx + 38, 87, 99, HOME.wood);
  p.rect(dx + 27, 87, 11, 7, HOME.wood);
  p.px(dx + 32, 90, '#d8b448');
  wallContact(p, dx, 40);
  p.rect(dx + 4, 80, 12, 4, '#f4efe2');
  p.line(dx + 6, 82, dx + 13, 81, '#3a6ad0');
  const crayons = ['#d94436', '#3a6ad0', '#4fae5b', '#f2d45c', '#f07a2a'];
  crayons.forEach((c, i) => p.vl(dx + 20 + i * 2, 78, 83, c));
  p.rect(dx + 19, 81, 11, 3, '#c8302a');
  // cadeirinha
  p.rect(dx + 10, 92, 12, 2, '#d94436');
  p.hl(dx + 10, dx + 21, 92, '#f06a5a');
  p.vl(dx + 11, 94, 104, '#a02c24');
  p.vl(dx + 20, 94, 104, '#a02c24');
  p.rect(dx + 11, 84, 10, 2, '#d94436');
  p.vl(dx + 11, 86, 91, '#a02c24');
  p.vl(dx + 20, 86, 91, '#a02c24');

  // guarda-roupa com o adesivo de ambulância
  const gx = 246;
  p.rect(gx, 44, 48, 4, HOME.wood2);
  p.hl(gx, gx + 47, 44, HOME.tan);
  p.rect(gx, 48, 48, 52, HOME.wood);
  p.rect(gx + 2, 50, 21, 49, HOME.wood2);
  p.rect(gx + 25, 50, 21, 49, HOME.wood2);
  p.px(gx + 21, 74, '#d8b448');
  p.px(gx + 27, 74, '#d8b448');
  p.vl(gx + 47, 48, 99, HOME.bg2);
  wallContact(p, gx, 48);
  p.rect(gx + 6, 58, 12, 7, '#f4f4ee');
  p.hl(gx + 6, gx + 17, 61, '#d94436');
  p.px(gx + 8, 65, '#1b1a17');
  p.px(gx + 15, 65, '#1b1a17');
  p.px(gx + 7, 57, '#d94436');
  p.px(gx + 8, 57, '#3a6ad0');
  // caixa de brinquedos ao lado
  p.rect(298, 88, 18, 12, '#3a6ad0');
  p.hl(298, 315, 88, '#6a9af0');
  p.rect(300, 85, 4, 3, '#f2d45c');
  p.rect(306, 84, 5, 4, '#4fae5b');

  // ambulância de brinquedo no chão
  p.rect(150, 141, 14, 7, '#f4f4ee');
  p.rect(162, 143, 5, 5, '#f4f4ee');
  p.hl(150, 166, 145, '#d94436');
  p.rect(163, 143, 3, 2, '#5f8fa8');
  p.px(152, 139, '#d94436');
  p.px(153, 139, '#3a6ad0');
  p.px(152, 148, '#1b1a17');
  p.px(153, 148, '#1b1a17');
  p.px(163, 148, '#1b1a17');
  p.px(164, 148, '#1b1a17');
  floorShadow(p, 158, 149, 9, 1.4, 0.3);
}

function quartoPlace(c: SceneCast): Placement {
  const x = clampX(c.x, 24, 296);
  if (c.pose === 'deitado') {
    // na cama, coberto até o peito: o travesseiro do sprite cai em cima do travesseiro da cama
    if (x <= 240) return { x: BED.x0 + 5 + (c.id === 'DAVI' ? 13 : 16), bottom: BED.top - 1, layer: 'back', blanket: HOME.fabricBlue, seat: 'cama' };
    return { x: clampX(x, 150, 270), bottom: 150, layer: 'top', blanket: HOME.fabricBlue };
  }
  if (c.pose === 'sentado') {
    // na beira da cama, ou na cadeirinha da escrivaninha
    if (x <= 140) return { x: clampX(x, 40, 92), bottom: BED.top + 7, layer: 'back' };
    return { x: 206, bottom: 106, layer: 'back', chair: true };
  }
  // em pé: no tapete, ao pé da cama ou perto da escrivaninha
  if (x < 140) return { x: clampX(x, 112, 136), bottom: 120, layer: 'back' };
  if (x <= 200) return { x: clampX(x, 150, 196), bottom: 128, layer: 'back' };
  return { x: clampX(x, 214, 236), bottom: 116, layer: 'back' };
}

function quartoLight(p: Pix, front: boolean): void {
  // luz quente do abajur e o luar entrando pela janela
  p.glow(LAMP.x, LAMP.y + 4, 120, HOME.lampLight, 0.3, 5, 1, front);
  for (let y = 74; y < 150; y++) {
    const t = (y - 74) / 76;
    const x0 = 140 + t * 22;
    const x1 = 176 + t * 30;
    for (let x = Math.floor(x0); x <= x1; x++) {
      if (front && !(p.get(x, y) >>> 24)) continue;
      if (bayerOn(x, y, 0.55)) p.pxa(x, y, '#a8c0e8', 0.1 * (1 - t * 0.6));
    }
  }
  roomDark(p, LAMP.x + 30, 82, 190, 120, HOME.bg0, 0.62, front, 0.4, 3, 112, 80);
}

// -----------------------------------------------------------------------------
// PORTA (fachada à noite)
// A casa azul vista da varanda: a porta no meio sob a marquise, a arandela
// acesa (a única luz quente da rua), a janela de grade com a cortina iluminada,
// o número 40 e a caixa de correio. A família fica na varanda, entre a porta e
// o muro baixo; a Dona Zélia na cadeira de fio da varanda. Na frente, o muro
// com o portão aberto e a calçada; à direita, o poste de luz fria.
// -----------------------------------------------------------------------------
/** linha da varanda (onde a fachada encontra o piso) */
const PORCH_Y = 120;
const DOOR = { x: 150, w: 22, top: 74 };

/** janela de grade com cortina: acesa (noite, alguém em casa) ou fechada */
function barredWindow(p: Pix, x: number, y: number, w: number, h: number, lit: boolean, has: Has): void {
  p.rect(x - 3, y - 3, w + 6, h + 6, '#4a3a2a');
  if (lit) {
    p.rect(x, y, w, h, '#f2c46b');
    for (let xx = x + 2; xx < x + w; xx += 5) p.vl(xx, y, y + h - 1, '#e8a83a');
    // sombra da máquina de costura atrás da cortina (o ateliê)
    if (has.has('maquina')) {
      const mx = x + 8;
      const my = y + h - 14;
      p.rect(mx, my + 10, 22, 3, '#b07a30');
      p.rect(mx + 15, my + 2, 5, 8, '#b07a30');
      p.rect(mx + 2, my + 2, 18, 4, '#b07a30');
      p.rect(mx + 1, my + 2, 4, 8, '#b07a30');
      p.disc(mx + 21, my + 5, 2, '#b07a30');
    }
    p.rect(x, y, w, 4, HOME.fabricRed);
    for (let xx = x; xx < x + w; xx += 2) p.px(xx, y + 4, shade(HOME.fabricRed, -0.2));
  } else {
    p.rect(x, y, w, h, '#2a3644');
    for (let yy = y + 2; yy < y + h; yy += 3) p.hl(x, x + w - 1, yy, '#3a4a5a');
  }
  // grade de ferro
  for (let xx = x + 3; xx < x + w; xx += 6) p.vl(xx, y, y + h - 1, '#1e1a18');
  for (let yy = y + 8; yy < y + h; yy += 10) p.hl(x, x + w - 1, yy, '#1e1a18');
  p.rect(x - 4, y + h + 3, w + 8, 3, '#d8d0c0');
  p.hl(x - 4, x + w + 3, y + h + 5, '#a8a090');
}

/** cadeira de fio da varanda (de plástico trançado, azul), vista de frente; chão em floorY */
function stringChair(p: Pix, cx: number, floorY: number): void {
  const x = cx - 9;
  const seat = floorY - 6;
  const top = floorY - 18;
  const c = '#3a7ab8';
  const d = '#24507a';
  floorShadow(p, cx, floorY + 1, 10, 1.6, 0.32);
  // encosto de fios
  p.vl(x + 1, top, seat, '#8a9098');
  p.vl(x + 16, top, seat, '#8a9098');
  p.hl(x + 1, x + 16, top, '#a8b0b8');
  for (let yy = top + 2; yy < seat; yy += 2) p.hl(x + 2, x + 15, yy, (yy >> 1) & 1 ? c : d);
  // assento e pés de ferro
  p.rect(x, seat, 18, 2, c);
  p.hl(x, x + 17, seat, shade(c, 0.3));
  p.line(x + 2, seat + 2, x + 1, floorY, '#5a6068');
  p.line(x + 15, seat + 2, x + 16, floorY, '#5a6068');
}

function portaBack(p: Pix, has: Has): void {
  // céu e beiral de telhas
  p.vgrad(0, 0, 320, 16, ['#0e1424', '#18223a'], 0.6);
  for (let i = 0; i < 16; i++) p.px(Math.floor(hash2(i, 1, 8) * 320), Math.floor(hash2(i, 2, 8) * 11), '#c8d4f0');
  p.rect(0, 12, 320, 9, '#6a3a2a');
  for (let x = 0; x < 320; x += 6) {
    p.vl(x, 12, 20, '#4a2418');
    p.px(x + 3, 20, '#8a4a34');
    p.px(x + 2, 13, '#8a4a34');
  }
  p.hl(0, 319, 21, '#2a1a12');
  // fachada azul
  const wall = '#6f8fb4';
  plaster(p, 0, 22, 320, PORCH_Y - 22, wall, shade(wall, -0.1), 61, 0.06);
  p.dith(0, 22, 320, 4, '#1a2440', 0.4);
  // barrado mais escuro embaixo (respingo de chuva)
  p.rect(0, PORCH_Y - 8, 320, 8, shade(wall, -0.16));
  p.hl(0, 319, PORCH_Y - 8, shade(wall, 0.12));
  // janela da sala (acesa) e janela do quarto (apagada)
  barredWindow(p, 52, 60, 46, 34, true, has);
  barredWindow(p, 222, 62, 34, 28, false, has);
  // marquise sobre a porta
  p.rect(DOOR.x - 12, DOOR.top - 6, DOOR.w + 24, 5, '#d8d0c0');
  p.hl(DOOR.x - 12, DOOR.x + DOOR.w + 11, DOOR.top - 6, '#ece6d8');
  p.hl(DOOR.x - 12, DOOR.x + DOOR.w + 11, DOOR.top - 2, '#8a8478');
  p.recta(DOOR.x - 10, DOOR.top - 1, DOOR.w + 20, 3, '#0e1626', 0.4);
  // porta de madeira com almofadas e olho mágico
  p.rect(DOOR.x - 3, DOOR.top, DOOR.w + 6, PORCH_Y - DOOR.top, '#3a2414');
  p.rect(DOOR.x, DOOR.top + 2, DOOR.w, PORCH_Y - DOOR.top - 2, HOME.wood2);
  p.frame(DOOR.x + 3, DOOR.top + 6, DOOR.w - 6, 16, HOME.wood);
  p.frame(DOOR.x + 3, DOOR.top + 25, DOOR.w - 6, 17, HOME.wood);
  p.hl(DOOR.x + 4, DOOR.x + DOOR.w - 4, DOOR.top + 7, HOME.tan);
  p.rect(DOOR.x + DOOR.w - 4, DOOR.top + 22, 2, 3, '#d8b448');
  p.px(DOOR.x + 10, DOOR.top + 12, '#1b1a17');
  p.vl(DOOR.x, DOOR.top + 2, PORCH_Y - 1, shade(HOME.wood2, 0.15));
  // capacho
  p.rect(DOOR.x - 1, PORCH_Y + 1, DOOR.w + 2, 4, '#7a5a3a');
  for (let xx = DOOR.x; xx < DOOR.x + DOOR.w; xx += 2) p.px(xx, PORCH_Y + 2, '#5a4028');
  // arandela acesa ao lado da porta
  p.rect(DOOR.x - 11, DOOR.top + 4, 5, 8, '#2a2a2a');
  p.rect(DOOR.x - 10, DOOR.top + 6, 3, 5, '#ffe2a3');
  p.px(DOOR.x - 10, DOOR.top + 6, '#ffffff');
  // número 40 e caixa de correio
  housePlate(p, DOOR.x + DOOR.w + 6, DOOR.top + 8);
  p.rect(DOOR.x + DOOR.w + 8, DOOR.top + 24, 10, 9, '#8a2a24');
  p.hl(DOOR.x + DOOR.w + 8, DOOR.x + DOOR.w + 17, DOOR.top + 24, '#b84a3a');
  p.hl(DOOR.x + DOOR.w + 9, DOOR.x + DOOR.w + 16, DOOR.top + 27, '#3a1410');
  // vaso de planta (espada-de-são-jorge) ao lado da porta
  p.rect(DOOR.x - 26, PORCH_Y - 10, 12, 10, '#a8582e');
  p.hl(DOOR.x - 26, DOOR.x - 15, PORCH_Y - 10, '#c87444');
  for (const [dx, h] of [
    [-24, 16],
    [-22, 22],
    [-20, 19],
    [-18, 24],
    [-16, 15],
  ] as [number, number][]) {
    p.vl(DOOR.x + dx, PORCH_Y - 10 - h, PORCH_Y - 11, '#4f7a3a');
    p.px(DOOR.x + dx, PORCH_Y - 10 - h, '#8ab05a');
    p.px(DOOR.x + dx + 1, PORCH_Y - 12 - Math.floor(h / 2), '#d8c45a');
  }
  // piso da varanda (lajota vermelha), que continua pelo vão do portão até a calçada
  tileGrid(p, 0, PORCH_Y, 320, 20, '#8a3e2c', '#6a2e20', 16, 7, true);
  tileGrid(p, 136, PORCH_Y + 20, 50, 16, '#8a3e2c', '#6a2e20', 16, 7, true);
  p.hl(0, 319, PORCH_Y, '#a8503a');
  p.recta(0, PORCH_Y + 1, 320, 2, '#120a06', 0.3);
  // muro baixo com o portão aberto
  const mw = '#7d9cc0';
  for (const [a, b] of [
    [0, 136],
    [186, 320],
  ] as [number, number][]) {
    p.rect(a, 140, b - a, 16, mw);
    p.rect(a, 140, b - a, 3, '#e6e1d4');
    p.hl(a, b - 1, 140, '#f4f0e6');
    p.hl(a, b - 1, 155, shade(mw, -0.3));
  }
  // pilastras do portão (aberto), com a bola de concreto em cima
  for (const x of [130, 186]) {
    p.rect(x, 134, 6, 22, '#e6e1d4');
    p.vl(x + 5, 134, 155, '#b8b2a4');
    p.hl(x, x + 5, 134, '#f4f0e6');
    p.disc(x + 2.5, 131, 2.5, '#d8d2c4');
    p.px(x + 2, 130, '#f4f0e6');
  }
  // calçada de pedra portuguesa e rua
  p.rect(0, 156, 320, 18, '#d8d4cc');
  for (let y = 156; y < 174; y++)
    for (let x = 0; x < 320; x++) {
      const wv = Math.sin((x / 320) * Math.PI * 8) * 4;
      if (Math.abs(((y - 156 + wv + 200) % 10) - 5) < 1.2) p.px(x, y, '#3a3a3a');
    }
  p.rect(0, 174, 320, 2, '#b8b4a8');
  p.rect(0, 176, 320, 4, '#1e2226');
  // poste com a luz fria
  p.rect(296, 22, 4, 134, '#3a3e42');
  p.vl(296, 22, 155, '#4a4e52');
  p.rect(280, 18, 20, 4, '#3a3e42');
  p.rect(278, 21, 8, 3, '#e6f4f0');
}

function portaFront(p: Pix, has: Has): void {
  // degrau da porta (na frente dos pés de quem está na soleira)
  p.rect(DOOR.x - 6, PORCH_Y + 16, DOOR.w + 12, 4, '#c8c0b0');
  p.hl(DOOR.x - 6, DOOR.x + DOOR.w + 5, PORCH_Y + 16, '#e0d8c8');
  void has;
}

function portaLight(p: Pix, front: boolean): void {
  // luz quente da arandela e luz fria do poste
  p.glow(DOOR.x - 8, DOOR.top + 9, 120, HOME.lampLight, 0.34, 5, 1, front);
  for (let y = 23; y < 176; y++) {
    const half = Math.floor((y - 20) * 0.42);
    for (let x = 282 - half; x <= 282 + half; x++) {
      if (front && !(p.get(x, y) >>> 24)) continue;
      const a = 0.15 * (1 - (y - 20) / 200);
      if (bayerOn(x, y, 0.85)) p.pxa(x, y, '#cfe8f0', a);
    }
  }
  roomDark(p, DOOR.x - 6, 96, 190, 110, '#060a12', 0.62, front, 0.42, 3);
}

function portaPlace(c: SceneCast): Placement {
  const x = clampX(c.x, 24, 296);
  // sentado: na cadeira de fio da varanda
  if (c.pose === 'sentado') return { x: 108, bottom: 133, layer: 'top', seat: 'cadeira' };
  if (c.pose === 'deitado') return { x: clampX(x, 60, 260), bottom: 152, layer: 'top', blanket: '#5a6a8a' };
  // em pé: na soleira da porta ou na varanda, dos dois lados
  if (x >= 146 && x <= 176) return { x: DOOR.x + DOOR.w / 2, bottom: PORCH_Y + 3, layer: 'back' };
  if (x < 146) return { x: clampX(x, 60, 138), bottom: 131, layer: 'back' };
  return { x: clampX(x, 184, 260), bottom: 131, layer: 'back' };
}

/** a cadeira de fio da varanda (quem senta é desenhado por cima); vazia, com a bolsa largada nela */
function portaSeats(p: Pix, has: Has, occ: Set<string>): void {
  stringChair(p, 108, 133);
  if (!occ.has('cadeira') && has.has('bolsa_passagem')) handbag(p, 102, 115);
}

// -----------------------------------------------------------------------------
// CALÇADA (dia) — despejo
// Vista da rua: a casa azul atrás do muro baixo (porta fechada com o aviso de
// despejo colado), e na calçada de pedra portuguesa a mudança inteira ao sol:
// sofá, geladeira, caixas com a máquina de costura em cima, colchão, cadeiras
// empilhadas e o fogão. A família fica de pé na calçada, ao lado das coisas.
// -----------------------------------------------------------------------------
/** linha do muro (topo) e da calçada (onde as coisas e as pessoas pisam) */
const WALL_TOP = 100;
const WALK_Y = 146;

function calcadaBack(p: Pix, has: Has): void {
  // céu de fim de tarde e beiral
  p.vgrad(0, 0, 320, 12, ['#7aa8d8', '#e8b888'], 0.6);
  p.ellipse(60, 5, 14, 3, '#f8e0c8');
  p.ellipse(72, 3, 8, 2.4, '#f8e0c8');
  p.ellipse(250, 6, 10, 2.4, '#f0d0b8');
  p.rect(0, 10, 320, 8, '#8a4a34');
  for (let x = 0; x < 320; x += 6) {
    p.vl(x, 10, 17, '#6a3424');
    p.px(x + 2, 11, '#a8604a');
  }
  p.hl(0, 319, 18, '#4a2418');
  // fachada azul ao sol
  const wall = '#7d9cc0';
  plaster(p, 0, 19, 320, WALL_TOP - 19, wall, shade(wall, 0.08), 77, 0.05);
  p.recta(0, 19, 320, 3, '#2a3a5a', 0.35);
  // janelas fechadas
  barredWindow(p, 48, 44, 46, 32, false, has);
  barredWindow(p, 226, 46, 34, 28, false, has);
  // porta fechada com o aviso de despejo
  const dx = 150;
  const dw = 22;
  const dt = 52;
  p.rect(dx - 12, dt - 6, dw + 24, 5, '#e0dace');
  p.hl(dx - 12, dx + dw + 11, dt - 2, '#9a948a');
  p.rect(dx - 3, dt, dw + 6, WALL_TOP - dt, '#3a2414');
  p.rect(dx, dt + 2, dw, WALL_TOP - dt - 2, HOME.wood2);
  p.frame(dx + 3, dt + 6, dw - 6, 16, HOME.wood);
  p.frame(dx + 3, dt + 25, dw - 6, 17, HOME.wood);
  p.rect(dx + dw - 4, dt + 22, 2, 3, '#d8b448');
  housePlate(p, dx + dw + 6, dt + 8);
  p.rect(dx + 4, dt + 9, 14, 17, '#f4f0e6');
  p.rect(dx + 4, dt + 9, 14, 3, '#c8302a');
  for (let y = dt + 14; y < dt + 25; y += 2) p.hl(dx + 6, dx + 15, y, '#8a948f');
  p.px(dx + 4, dt + 9, '#d8d0c0');
  // muro baixo com o portão aberto; atrás, um pedaço da varanda
  const mw = '#e6e1d4';
  p.rect(0, WALL_TOP, 320, 18, mw);
  p.rect(0, WALL_TOP, 320, 3, '#ffffff');
  p.hl(0, 319, WALL_TOP + 17, '#b8b2a4');
  p.rect(140, WALL_TOP, 42, 18, '#8a3e2c');
  for (let x = 140; x < 182; x += 8) p.vl(x, WALL_TOP, WALL_TOP + 17, '#6a2e20');
  for (let x = 140; x < 152; x += 3) p.vl(x, WALL_TOP - 6, WALL_TOP + 17, '#2a2a2a');
  p.hl(140, 151, WALL_TOP - 6, '#2a2a2a');
  // calçada de pedra portuguesa (ondas) e meio-fio
  // (ondas finas e cinza: o desenho da calçada não pode brigar com as pessoas)
  p.rect(0, WALL_TOP + 18, 320, 52, '#e2ddd2');
  for (let y = WALL_TOP + 18; y < WALL_TOP + 70; y++)
    for (let x = 0; x < 320; x++) {
      const wv = Math.sin((x / 320) * Math.PI * 7) * 4;
      if (Math.abs(((y - WALL_TOP + wv + 200) % 13) - 6.5) < 0.8) p.px(x, y, '#6a6660');
    }
  p.recta(0, WALL_TOP + 18, 320, 3, '#3a3020', 0.18);
  p.rect(0, WALL_TOP + 70, 320, 4, '#b8b4a8');
  p.hl(0, 319, WALL_TOP + 70, '#d8d4c8');
  p.rect(0, WALL_TOP + 74, 320, 6, '#3a3e42');
  // árvore da calçada à direita (sombra fresca)
  p.rect(304, 60, 5, 58, '#6a4a2a');
  p.disc(306, 40, 18, '#4f7a3a');
  p.disc(296, 48, 10, '#5f8a4a');
  p.disc(314, 30, 10, '#6f9a5a');
  p.ellipse(300, WALL_TOP + 24, 24, 5, '#1a2a12', 0.25);
}

/** um sofá azul de três lugares, de frente, com o chão em floorY (60 de largura) */
function streetSofa(p: Pix, x: number, floorY: number): void {
  const sofa = HOME.fabricBlue;
  floorShadow(p, x + 30, floorY + 1, 34, 2.4, 0.4);
  p.rect(x + 4, floorY - 24, 52, 10, sofa);
  p.hl(x + 4, x + 55, floorY - 24, shade(sofa, 0.25));
  for (let xx = x + 21; xx < x + 55; xx += 17) p.vl(xx, floorY - 23, floorY - 15, shade(sofa, -0.25));
  p.rect(x + 4, floorY - 14, 52, 5, shade(sofa, 0.12));
  p.rect(x + 4, floorY - 9, 52, 7, shade(sofa, -0.22));
  p.rect(x, floorY - 19, 6, 17, shade(sofa, -0.05));
  p.hl(x, x + 5, floorY - 19, shade(sofa, 0.3));
  p.rect(x + 54, floorY - 19, 6, 17, shade(sofa, -0.32));
  p.vl(x + 2, floorY - 2, floorY, HOME.wood);
  p.vl(x + 57, floorY - 2, floorY, HOME.wood);
}

/**
 * A mudança do despejo na calçada, com o chão das coisas em floorY:
 * sofá, geladeira, caixas com a máquina de costura em cima, colchão encostado
 * no muro, cadeiras empilhadas e o fogão.
 */
export function drawEvictionFurniture(p: Pix, dy = 0): void {
  const f = WALK_Y + dy;
  streetSofa(p, 10, f);
  fridge(p, 80, f - 37, 'ok', false);
  // caixas e a máquina de costura em cima
  floorShadow(p, 127, f + 1, 16, 2, 0.38);
  cardBox(p, 112, f - 14, 30, 14);
  cardBox(p, 116, f - 25, 22, 11);
  sewingMachine(p, 114, f - 42);
  // colchão encostado no muro
  p.rect(200, f - 44, 22, 44, '#e8dcc4');
  for (let y = f - 40; y < f - 2; y += 6) for (let x = 203; x < 220; x += 6) p.px(x, y, '#c8b898');
  p.vl(221, f - 44, f - 1, '#b8a888');
  p.hl(200, 221, f - 44, '#f4ecd8');
  floorShadow(p, 211, f + 1, 13, 1.8, 0.35);
  // cadeiras empilhadas
  woodChair(p, 228, f - 25);
  woodChair(p, 232, f - 33);
  // fogão
  p.rect(260, f - 18, 24, 18, '#e4e0d4');
  p.rect(260, f - 21, 24, 3, '#f0ece2');
  for (const ox of [3, 9, 15, 20]) p.rect(260 + ox, f - 21, 3, 1, '#2a2a2a');
  p.rect(263, f - 15, 18, 11, '#3a3a3a');
  p.rect(265, f - 13, 14, 7, '#1e1e1e');
  p.vl(283, f - 18, f - 1, '#b8b4a8');
  floorShadow(p, 272, f + 1, 14, 1.8, 0.35);
}

/** versão menor da mudança, empilhada na varanda (cenário da porta à noite) */
function porchFurniture(p: Pix): void {
  const f = 138;
  p.rect(262, f - 40, 20, 40, '#e8dcc4');
  for (let y = f - 36; y < f - 2; y += 6) for (let x = 265; x < 279; x += 6) p.px(x, y, '#c8b898');
  p.vl(281, f - 40, f - 1, '#b8a888');
  cardBox(p, 226, f - 14, 28, 14);
  cardBox(p, 230, f - 25, 20, 11);
  sewingMachine(p, 228, f - 42);
  woodChair(p, 286, f - 25);
}

function calcadaFront(p: Pix, has: Has): void {
  if (!has.has('moveis_calcada')) return;
  drawEvictionFurniture(p);
}

function calcadaPlace(c: SceneCast, has: Has): Placement {
  const x = clampX(c.x, 20, 300);
  if (c.pose === 'sentado') {
    // sentado no sofá largado na calçada (quando a mudança está lá), senão numa cadeira
    if (x <= 80 && has.has('moveis_calcada')) return { x: clampX(x, 24, 62), bottom: WALK_Y - 8, layer: 'top', seat: 'sofa' };
    return { x: clampX(x, 40, 296), bottom: WALK_Y + 2, layer: 'top', chair: true };
  }
  if (c.pose === 'deitado') return { x: clampX(x, 60, 260), bottom: WALK_Y + 6, layer: 'top', blanket: '#5a6a8a' };
  return { x: clampX(x, 150, 296), bottom: WALK_Y + 2, layer: 'top' };
}

function calcadaLight(p: Pix, front: boolean): void {
  // sol baixo de fim de tarde vindo da esquerda
  p.glow(-30, 20, 280, '#ffd8a0', 0.16, 4, 1, front);
  vignette(p, '#1a1a20', 0.25, front);
}

// -----------------------------------------------------------------------------
// ESCOLA (quadra da escola com o palco)
// "Quadra da E.M. Monteiro Lobato, oito da noite. Cadeiras de plástico, um
// ventilador de teto que não dá conta." No fundo, o palco com o cenário de
// papel (céu estrelado, casinhas, a faixa FESTA DA FAMÍLIA) e o Liam lendo a
// redação no microfone, sob o foco de luz. Na frente, a plateia: a família na
// primeira fila dos lados (o cônjuge de pé, a Zélia sentada na cadeira de
// plástico) e as outras famílias de costas, em silhueta, no meio.
// -----------------------------------------------------------------------------
const STAGE = { x0: 58, x1: 262, top: 98, lip: 106, floor: 116 };

function escolaBack(p: Pix, has: Has): void {
  // paredes da quadra (bloco pintado) com as janelas altas basculantes
  p.rect(0, 0, 320, STAGE.floor, '#3a4448');
  for (let y = 4; y < STAGE.floor; y += 6) {
    p.hl(0, 319, y, '#323b3e');
    for (let x = ((y / 6) & 1) * 8; x < 320; x += 16) p.vl(x, y, y + 5, '#323b3e');
  }
  p.rect(0, 0, 320, 36, '#2a3236');
  for (const x of [8, 274]) {
    p.rect(x, 8, 38, 14, '#141a2a');
    for (let xx = x + 1; xx < x + 38; xx += 6) p.vl(xx, 8, 21, '#5a6468');
    p.hl(x, x + 37, 14, '#5a6468');
    p.px(x + 30, 11, '#c8d4f0');
  }
  // ventilador de teto
  p.vl(160, 0, 8, '#1a1e20');
  p.rect(157, 8, 7, 3, '#2a3034');
  p.hl(140, 180, 9, '#4a5054');
  // cenário pintado no fundo do palco: céu estrelado de papel
  p.rect(STAGE.x0 + 10, 26, STAGE.x1 - STAGE.x0 - 20, STAGE.top - 26, '#26304e');
  for (let i = 0; i < 24; i++) {
    const x = STAGE.x0 + 14 + Math.floor(hash2(i, 3, 12) * (STAGE.x1 - STAGE.x0 - 28));
    const y = 58 + Math.floor(hash2(i, 4, 12) * 20);
    p.px(x, y, '#f2d45c');
    if (i % 3 === 0) {
      p.px(x - 1, y, '#c8a83a');
      p.px(x + 1, y, '#c8a83a');
      p.px(x, y - 1, '#c8a83a');
      p.px(x, y + 1, '#c8a83a');
    }
  }
  p.disc(232, 66, 6, '#f4ecd0');
  p.disc(235, 64, 5, '#26304e');
  // casinhas de papelão com as janelas acesas
  for (let i = 0; i < 6; i++) {
    const hx = STAGE.x0 + 16 + i * 30;
    const hh = 14 + (i % 3) * 4;
    p.rect(hx, STAGE.top - hh, 22, hh, ['#c86a4a', '#5f8fa8', '#e8c46a', '#8aa86a', '#c87aa0', '#a8a8b8'][i]);
    p.poly(
      [
        [hx - 2, STAGE.top - hh],
        [hx + 11, STAGE.top - hh - 8],
        [hx + 24, STAGE.top - hh],
      ],
      '#8a3a2a',
    );
    p.rect(hx + 4, STAGE.top - hh + 4, 4, 4, '#ffe2a3');
    p.rect(hx + 13, STAGE.top - hh + 4, 4, 4, i % 2 ? '#ffe2a3' : '#3a3a4a');
  }
  // faixa
  p.rect(98, 44, 124, 12, '#f4efe2');
  p.hl(98, 221, 55, '#d8ceb8');
  p.line(98, 44, 82, 30, '#8a8478');
  p.line(221, 44, 238, 30, '#8a8478');
  drawText(p, 'FESTA DA FAMÍLIA', 160, 48, '#c8302a', { align: 'center' });
  // bandeirinhas
  for (let x = STAGE.x0 + 12; x < STAGE.x1 - 12; x += 8) {
    if (x > 92 && x < 226) continue;
    const c = ['#d94436', '#f2d45c', '#4fae5b', '#3a6ad0', '#f07a2a'][Math.floor((x - STAGE.x0) / 8) % 5];
    const y = 32 + Math.round(Math.sin((x - STAGE.x0) / 30) * 1.5);
    p.px(x - 1, y - 1, '#8a8478');
    p.poly(
      [
        [x, y],
        [x + 6, y],
        [x + 3, y + 5],
      ],
      c,
    );
  }
  // palco: tablado visto de frente
  planks(p, STAGE.x0, STAGE.top, STAGE.x1 - STAGE.x0, STAGE.lip - STAGE.top, '#a07444', '#7a5430', 4, 13);
  p.rect(STAGE.x0, STAGE.lip, STAGE.x1 - STAGE.x0, STAGE.floor - STAGE.lip, '#4a2c18');
  p.hl(STAGE.x0, STAGE.x1 - 1, STAGE.lip, '#c08a54');
  for (let x = STAGE.x0 + 16; x < STAGE.x1; x += 24) p.vl(x, STAGE.lip + 1, STAGE.floor - 1, '#3a2010');
  // cortinas vermelhas dos lados do palco
  const red = '#8a2a2e';
  for (const [x0, x1] of [
    [STAGE.x0 - 4, STAGE.x0 + 12],
    [STAGE.x1 - 12, STAGE.x1 + 4],
  ] as [number, number][]) {
    for (let x = x0; x < x1; x++) p.vl(x, 22, STAGE.lip - 1, Math.sin((x - x0) / 2.2) > 0.3 ? shade(red, 0.2) : red);
  }
  p.rect(STAGE.x0 - 4, 20, STAGE.x1 - STAGE.x0 + 8, 6, shade(red, -0.15));
  for (let x = STAGE.x0; x < STAGE.x1; x += 8) p.disc(x + 4, 26, 3, shade(red, -0.15));
  // pedestal do microfone, ao lado de onde o Liam lê
  p.vl(176, 80, STAGE.top + 3, '#2a2a2a');
  p.hl(173, 179, STAGE.top + 3, '#2a2a2a');
  p.line(176, 80, 171, 77, '#2a2a2a');
  p.rect(169, 75, 3, 3, '#4a4a4a');
  // piso da quadra com as linhas pintadas
  p.rect(0, STAGE.floor, 320, 180 - STAGE.floor, '#6a7a5a');
  for (let y = STAGE.floor; y < 180; y++) for (let x = 0; x < 320; x++) if (hash2(x, y, 51) < 0.04) p.px(x, y, '#748462');
  p.hl(0, 319, STAGE.floor + 6, '#e8e4c8');
  p.ellipse(160, 180, 70, 30, '#e8e4c8');
  p.ellipse(160, 180, 69, 29, '#6a7a5a');
  p.recta(0, STAGE.floor, 320, 2, '#101410', 0.4);
  void has;
}

/** cadeira de plástico branca (de festa), de frente; chão em floorY */
function plasticChair(p: Pix, cx: number, floorY: number): void {
  const x = cx - 8;
  const seat = floorY - 6;
  const top = floorY - 17;
  const c = '#ecece4';
  const d = '#b8b8ae';
  p.rect(x + 1, top, 14, 7, c);
  p.hl(x + 1, x + 14, top, '#ffffff');
  for (let xx = x + 3; xx < x + 14; xx += 3) p.vl(xx, top + 2, top + 5, d);
  p.vl(x + 1, top + 7, seat, d);
  p.vl(x + 14, top + 7, seat, d);
  p.rect(x, seat, 16, 2, c);
  p.hl(x, x + 15, seat + 1, d);
  p.line(x + 1, seat + 2, x, floorY, d);
  p.line(x + 14, seat + 2, x + 15, floorY, d);
}

function escolaFront(p: Pix): void {
  // as outras famílias da plateia, de costas, em silhueta contra o palco aceso
  for (let row = 0; row < 2; row++) {
    const y = 138 + row * 14;
    for (let x = 96 + row * 9; x < 236; x += 17) {
      const hx = x + Math.floor(hash2(x, row, 5) * 5);
      const hair = ['#1c1410', '#3b2516', '#4a3a2e', '#2a2420', '#8a8a84'][Math.floor(hash2(hx, row, 6) * 5)];
      const shirt = ['#2a2a3a', '#3a2a2a', '#2a3a34', '#343038'][Math.floor(hash2(hx, row, 7) * 4)];
      p.rect(hx - 7, y + 4, 15, 16, shirt);
      p.hl(hx - 6, hx + 6, y + 4, shade(shirt, 0.15));
      p.disc(hx, y, 4, hair);
      p.px(hx - 2, y - 3, shade(hair, 0.25));
    }
  }
  // alguém filmando com o celular erguido
  p.rect(186, 128, 6, 9, '#1a1a1a');
  p.rect(187, 129, 4, 6, '#9fd0ea');
  p.vl(189, 137, 141, '#c89a7a');
}

function escolaLight(p: Pix, front: boolean): void {
  // foco de luz em cima do Liam e o palco aceso; a quadra na penumbra
  if (!front) {
    for (let y = 0; y < STAGE.lip; y++) {
      const t = y / STAGE.lip;
      const hw = 6 + t * 22;
      for (let x = Math.floor(160 - hw); x <= Math.ceil(160 + hw); x++) if (bayerOn(x, y, 0.6)) p.pxa(x, y, '#fff0c8', 0.12 + 0.08 * t);
    }
    p.glow(160, STAGE.top + 2, 70, '#fff0c8', 0.3, 4, 0.4);
    p.glow(160, 70, 130, '#fff0c8', 0.1, 3);
  }
  roomDark(p, 160, 74, 200, 120, '#08060c', 0.7, front, 0.45, 3);
}

function escolaPlace(c: SceneCast): Placement {
  const x = clampX(c.x, 20, 300);
  // o Liam se apresenta no palco
  if (c.id === 'DAVI' && c.pose !== 'deitado') return { x: clampX(x, 100, 220), bottom: STAGE.top + 3, layer: 'back' };
  if (c.pose === 'deitado') return { x: clampX(x, 100, 220), bottom: STAGE.top + 4, layer: 'back' };
  // a família na primeira fila, dos lados da plateia
  if (c.pose === 'sentado') return x < 160 ? { x: 40, bottom: 150, layer: 'top', seat: 'plastico_esq' } : { x: 268, bottom: 150, layer: 'top', seat: 'plastico_dir' };
  return { x: x < 160 ? clampX(x, 30, 84) : clampX(x, 236, 300), bottom: 151, layer: 'top' };
}

/** cadeiras de plástico da primeira fila (debaixo de quem senta) e a guardada com a bolsa */
function escolaSeats(p: Pix, has: Has, occ: Set<string>): void {
  if (occ.has('plastico_esq')) plasticChair(p, 40, 150);
  if (occ.has('plastico_dir')) plasticChair(p, 268, 150);
  // a cadeira guardada para você
  plasticChair(p, 88, 152);
  handbag(p, 82, 135);
  void has;
}

// -----------------------------------------------------------------------------
// CENTRAL (sala de regulação)
// -----------------------------------------------------------------------------
let centralMap: Pix | null = null;

function smallMap(): Pix {
  if (!centralMap) centralMap = renderCityMap({ tile: 2, t: 0, showLabels: false });
  return centralMap;
}

function console3q(p: Pix, x: number, y: number, seed: number): void {
  // mesa
  p.rect(x, y + 14, 44, 5, '#5f7a6c');
  p.hl(x, x + 43, y + 14, '#8fa89a');
  p.rect(x, y + 19, 44, 14, '#2f4139');
  p.vl(x + 1, y + 19, y + 32, '#3d5248');
  // monitor
  p.rect(x + 8, y, 24, 14, '#121816');
  p.rect(x + 9, y + 1, 22, 11, '#1f3a30');
  for (let i = 0; i < 4; i++) p.hl(x + 10, x + 10 + 6 + Math.floor(hash2(i, seed, 2) * 12), y + 3 + i * 2, i === 1 ? '#e8a33d' : '#7fd17a');
  p.rect(x + 18, y + 13, 4, 2, '#1e2420');
  // headset e post-it
  p.ring(x + 37, y + 10, 3, '#1e2326');
  p.rect(x + 32, y + 1, 5, 5, CENTRAL.postit);
  // teclado
  p.rect(x + 10, y + 15, 18, 2, '#c4d4c0');
}

function centralBack(p: Pix): void {
  p.rect(0, 0, 320, 74, '#2a3a33');
  p.rect(0, 46, 320, 28, '#26352f');
  p.hl(0, 319, 46, '#3d5248');
  p.rect(0, 70, 320, 4, '#1f2c27');
  // piso vinílico
  p.rect(0, 74, 320, 106, '#34463e');
  for (let y = 74; y < 180; y++) for (let x = 0; x < 320; x++) if (hash2(x, y, 44) < 0.05) p.px(x, y, '#3d5248');
  for (let y = 80; y < 180; y += 14) p.hl(0, 319, y, '#2f4139');
  // janela com persiana (noite)
  p.rect(14, 12, 60, 34, '#0d1311');
  for (let y = 13; y < 46; y += 3) p.hl(14, 73, y, '#3d5248');
  p.frame(13, 11, 62, 36, '#5f7a6c');
  // painel com o mapa
  const m = smallMap();
  const crop = m.crop(6, 4, 116, 64);
  p.rect(98, 6, 124, 72, '#121816');
  p.frame(97, 5, 126, 74, '#5f7a6c');
  p.blit(crop, 102, 10);
  // relógio digital
  p.rect(236, 10, 30, 12, '#0d1311');
  drawText(p, '03:12', 240, 13, '#e0483d');
  // quadro de trotes (cortiça)
  corkBoard(p, 264, 26, 44, 36);
  postit(p, 270, 32, CENTRAL.postit, 1);
  postit(p, 282, 36, '#f2a0b8', 2);
  postit(p, 294, 31, CENTRAL.postit, 3);
  postit(p, 276, 46, '#a8e0a0', 4);
  pushPin(p, 273, 32, '#d94436');
  pushPin(p, 285, 36, '#3a6ad0');
  // fileira de trás
  console3q(p, 20, 70, 1);
  console3q(p, 76, 72, 2);
  console3q(p, 230, 70, 3);
  // tubos fluorescentes
  for (const x of [40, 140, 240]) {
    p.rect(x, 1, 44, 3, '#e6efd9');
    p.hl(x, x + 43, 4, '#8fa89a');
  }
}

function centralFront(p: Pix): void {
  console3q(p, 60, 118, 4);
  console3q(p, 190, 118, 5);
}

function centralLight(p: Pix, front: boolean): void {
  for (const x of [62, 162, 262]) p.glow(x, 6, 120, '#e6efd9', 0.16, 4, 1, front);
  p.glow(160, 42, 80, '#7fd17a', 0.06, 3, 1, front);
}

function centralPlace(c: SceneCast): Placement {
  const x = clampX(c.x);
  if (c.pose === 'sentado') return { x, bottom: 140, layer: 'back', chair: true };
  if (c.pose === 'deitado') return { x, bottom: 172, layer: 'top' };
  return { x, bottom: 170, layer: 'top' };
}

function centralAnim(p: Pix, has: Has, t: number): void {
  // tubo piscando
  if (Math.floor(t / 130) % 23 === 0) p.rect(140, 1, 44, 3, '#8fa89a');
}

// -----------------------------------------------------------------------------
// RUA (noite)
// -----------------------------------------------------------------------------
function ruaBack(p: Pix): void {
  p.vgrad(0, 0, 320, 60, ['#0c1222', '#18223a', '#26304a'], 0.6);
  for (let i = 0; i < 24; i++) p.px(Math.floor(hash2(i, 9, 2) * 320), Math.floor(hash2(i, 8, 2) * 40), '#c8d4f0');
  p.disc(262, 16, 6, '#eef0dc');
  p.disc(264, 14, 2, '#d8dcc8');
  // silhueta distante
  for (let x = 0; x < 320; x += 14) p.rect(x, 50 - Math.floor(hash2(x, 1, 3) * 16), 13, 30, '#1a2234');
  // casas
  const cols = ['#8a7a5a', '#6a8a7a', '#9a6a5a', '#7a7a9a', '#a8946a', '#6a7a8a'];
  for (let i = 0; i < 6; i++) {
    const hx = i * 54;
    const top = 58 + (i % 2) * 6;
    p.rect(hx, top, 52, 122 - top, cols[i]);
    p.rect(hx, top, 52, 3, shade(cols[i], -0.3));
    p.rect(hx + 6, top + 14, 14, 12, i % 3 === 0 ? '#3a4458' : '#f2c46b');
    p.frame(hx + 5, top + 13, 16, 14, '#2a2420');
    p.rect(hx + 30, top + 18, 12, 122 - top - 18, '#3a2a1e');
    p.px(hx + 39, top + 40, '#d8b448');
    if (i % 3 === 2) p.rect(hx + 8, top + 16, 10, 8, '#7aa0d0');
  }
  // fios e postes
  for (const x of [40, 200]) {
    p.rect(x, 26, 3, 100, '#2a2e32');
    p.hl(x - 8, x + 10, 30, '#2a2e32');
  }
  for (let x = 0; x < 320; x++) {
    p.px(x, 31 + Math.round(Math.sin((x / 160) * Math.PI) * 6), '#1a1e22');
    p.px(x, 35 + Math.round(Math.sin((x / 160) * Math.PI) * 6), '#1a1e22');
  }
  // calçada, meio-fio, rua
  p.rect(0, 122, 320, 18, '#6a6a66');
  for (let x = 0; x < 320; x += 12) p.vl(x, 122, 139, '#5a5a56');
  p.rect(0, 140, 320, 3, '#a8a49a');
  p.rect(0, 143, 320, 37, '#23272b');
  for (let x = 6; x < 320; x += 30) p.rect(x, 162, 14, 2, '#c8c4b0');
  // poste de luz
  p.rect(236, 30, 4, 110, '#3a3e42');
  p.rect(226, 26, 16, 4, '#3a3e42');
  p.rect(224, 28, 6, 3, '#e6f4f0');
}

function ruaFront(p: Pix): void {
  // fusca estacionado
  const x = 30;
  const y = 140;
  p.ellipse(x + 30, y + 24, 30, 3, '#000000', 0.4);
  p.rect(x + 2, y + 10, 56, 12, '#3a6a8a');
  p.ellipse(x + 30, y + 10, 20, 9, '#3a6a8a');
  p.rect(x + 16, y + 4, 26, 6, '#9fc0d8');
  p.vl(x + 29, y + 3, y + 9, '#3a6a8a');
  p.hl(x + 2, x + 57, y + 16, '#2a4a62');
  p.disc(x + 12, y + 22, 5, '#1a1a1a');
  p.disc(x + 47, y + 22, 5, '#1a1a1a');
  p.px(x + 12, y + 22, '#8a8a8a');
  p.px(x + 47, y + 22, '#8a8a8a');
  p.rect(x + 56, y + 12, 3, 3, '#f2d45c');
}

function ruaLight(p: Pix, front: boolean): void {
  for (let y = 31; y < 180; y++) {
    const half = Math.floor((y - 28) * 0.5);
    for (let x = 227 - half; x <= 227 + half; x++) {
      if (front && !(p.get(x, y) >>> 24)) continue;
      if (bayerOn(x, y, 0.85)) p.pxa(x, y, '#cfe8f0', 0.15 * (1 - (y - 28) / 220));
    }
  }
  vignette(p, '#04060c', 0.8, front);
}

function ruaPlace(c: SceneCast): Placement {
  const x = clampX(c.x);
  if (c.pose === 'sentado') return { x, bottom: 142, layer: 'back' };
  if (c.pose === 'deitado') return { x, bottom: 140, layer: 'back', blanket: '#5a6a8a' };
  return { x, bottom: 138, layer: 'back' };
}

// -----------------------------------------------------------------------------
// HOSPITAL (corredor em perspectiva)
// -----------------------------------------------------------------------------
const VP = { x: 160, y: 66 };

function hospitalBack(p: Pix): void {
  const bx0 = 126;
  const bx1 = 194;
  const by0 = 46;
  const by1 = 98;
  // teto
  p.poly(
    [
      [0, 0],
      [320, 0],
      [bx1, by0],
      [bx0, by0],
    ],
    '#c8d4cc',
  );
  // paredes
  p.poly(
    [
      [0, 0],
      [bx0, by0],
      [bx0, by1],
      [0, 180],
    ],
    '#b8cbbf',
  );
  p.poly(
    [
      [320, 0],
      [bx1, by0],
      [bx1, by1],
      [320, 180],
    ],
    '#aec2b6',
  );
  // barra verde (meia parede)
  p.poly(
    [
      [0, 112],
      [bx0, 80],
      [bx0, by1],
      [0, 180],
    ],
    '#7f9a8a',
  );
  p.poly(
    [
      [320, 112],
      [bx1, 80],
      [bx1, by1],
      [320, 180],
    ],
    '#748f80',
  );
  p.line(0, 112, bx0, 80, '#5f7a6c');
  p.line(320, 112, bx1, 80, '#5f7a6c');
  // piso
  p.poly(
    [
      [0, 180],
      [bx0, by1],
      [bx1, by1],
      [320, 180],
    ],
    '#9aa69e',
  );
  for (let i = -6; i <= 6; i++) p.line(160 + i * 60, 180, 160 + i * ((bx1 - bx0) / 12), by1, '#8a968e');
  for (const f of [0.08, 0.2, 0.36, 0.58, 0.85]) {
    const y = Math.round(by1 + (180 - by1) * f);
    const half = Math.round(((bx1 - bx0) / 2) * (1 - f) + 160 * f);
    p.hl(160 - half, 160 + half, y, '#8a968e');
  }
  // reflexo do teto no chão
  for (let y = by1 + 2; y < 180; y++) {
    const hw = 3 + Math.round((y - by1) * 0.16);
    p.dith(160 - hw, y, hw * 2, 1, '#bcc8c0', 0.4);
  }
  // fundo: portas vaivém
  p.rect(bx0, by0, bx1 - bx0, by1 - by0, '#a8bcb0');
  p.rect(146, 58, 28, 40, '#8fa89a');
  p.vl(160, 58, 97, '#5f7a6c');
  p.disc(153, 68, 3, '#c8e0e8');
  p.disc(167, 68, 3, '#c8e0e8');
  p.rect(150, 50, 20, 6, '#2a6a4a');
  drawText(p, 'UTI', 154, 51, '#e6efd9');
  // portas laterais em perspectiva (na geometria das paredes)
  const wallTop = (x: number) => (46 * x) / 126;
  const wallBot = (x: number) => 180 - ((180 - 98) * x) / 126;
  const doorTop = (x: number) => wallBot(x) - 0.64 * (wallBot(x) - wallTop(x));
  for (const [x1, x2] of [
    [10, 34],
    [64, 78],
    [100, 108],
  ] as [number, number][]) {
    for (const side of [1, -1]) {
      const X = (x: number) => (side > 0 ? x : 320 - x);
      p.poly(
        [
          [X(x1), doorTop(x1)],
          [X(x2), doorTop(x2)],
          [X(x2), wallBot(x2) - 1],
          [X(x1), wallBot(x1) - 1],
        ],
        '#5f7a6c',
      );
      const i1 = x1 + 2;
      const i2 = x2 - 1;
      p.poly(
        [
          [X(i1), doorTop(i1) + 2],
          [X(i2), doorTop(i2) + 1],
          [X(i2), wallBot(i2) - 2],
          [X(i1), wallBot(i1) - 2],
        ],
        side > 0 ? '#9fb4c0' : '#8fa4b0',
      );
      // visor da porta
      const vx = Math.round((i1 + i2) / 2);
      p.rect(X(vx) - 1, Math.round(doorTop(vx) + (wallBot(vx) - doorTop(vx)) * 0.2), 3, Math.max(2, Math.round((wallBot(vx) - doorTop(vx)) * 0.2)), '#cfe6ee');
    }
  }
  // luminárias no teto
  for (const f of [0.15, 0.4, 0.65, 0.85]) {
    const y = Math.round(by0 * f);
    const w = Math.round(30 * (1 - f) + 6);
    p.rect(160 - w, y, w * 2, Math.max(1, Math.round(4 * (1 - f))), '#f4fbf2');
  }
  // maca à esquerda
  p.rect(24, 132, 70, 6, '#e8ecea');
  p.rect(24, 128, 70, 4, '#f4f8f6');
  p.rect(30, 126, 18, 4, '#cfe0e8');
  p.vl(28, 138, 156, '#8a948f');
  p.vl(90, 138, 156, '#8a948f');
  p.px(28, 157, '#2a2a2a');
  p.px(90, 157, '#2a2a2a');
  // cadeiras à direita
  for (let i = 0; i < 3; i++) {
    const x = 236 + i * 20;
    p.rect(x, 120, 16, 4, '#3a6ab0');
    p.rect(x, 106, 16, 14, '#3a6ab0');
    p.hl(x, x + 15, 106, '#5a8ad0');
    p.vl(x + 2, 124, 138, '#5a5a5a');
    p.vl(x + 13, 124, 138, '#5a5a5a');
  }
  // placa SILÊNCIO
  p.rect(36, 60, 40, 10, '#e6efd9');
  drawText(p, 'SILÊNCIO', 40, 63, '#c8302a');
}

function hospitalLight(p: Pix, front: boolean): void {
  p.glow(160, 20, 150, '#f4fbf2', 0.16, 4, 1, front);
  vignette(p, '#1a2420', 0.5, front);
}

function hospitalPlace(c: SceneCast): Placement {
  const x = clampX(c.x, 24, 296);
  // sentado: nas cadeiras azuis da espera (encostadas na parede da direita)
  if (c.pose === 'sentado') return { x: x < 264 ? 244 : 264, bottom: 129, layer: 'back' };
  // deitado: na maca do corredor
  if (c.pose === 'deitado') return { x: 58, bottom: 133, layer: 'back', blanket: '#cfe0e8' };
  // em pé, no corredor (fora da maca e das cadeiras)
  return { x: x < 160 ? clampX(x, 110, 150) : clampX(x, 170, 222), bottom: 150, layer: 'top' };
}

function hospitalAnim(p: Pix, has: Has, t: number): void {
  if (Math.floor(t / 120) % 17 === 0) p.rect(160 - 18, Math.round(46 * 0.4), 36, 2, '#a8b4ac');
}

// -----------------------------------------------------------------------------
// ESCRITÓRIO (ar-condicionado e painel de metas)
// -----------------------------------------------------------------------------
export function metricsScreen(p: Pix, x: number, y: number, w: number, h: number, value = '94', t = 0): void {
  p.rect(x - 3, y - 3, w + 6, h + 6, '#14181c');
  p.rect(x, y, w, h, '#0f1a20');
  // gráfico de linha
  let prev = y + h - 10;
  for (let i = 0; i < w - 8; i += 4) {
    const v = y + h - 10 - Math.floor(((i / (w - 8)) * (h - 22) + hash2(i, 1, 9) * 6));
    p.line(x + 4 + i - 4, prev, x + 4 + i, v, '#7fd17a');
    prev = v;
  }
  // barras
  for (let i = 0; i < 5; i++) {
    const bh = 4 + Math.floor(hash2(i, 2, 9) * 10);
    p.rect(x + 6 + i * 6, y + h - 4 - bh, 4, bh, i === 4 ? '#e8a33d' : '#5aa7d6');
  }
  // índice grande
  drawText(p, 'ÍNDICE', x + w - 34, y + 5, '#8fa89a');
  drawText(p, value, x + w - 34, y + 12, '#e6efd9', { scale: 3 });
  const blink = Math.floor(t / 700) % 2 === 0;
  p.rect(x + w - 8, y + 4, 3, 3, blink ? '#7fd17a' : '#2f6a3c');
  p.hl(x, x + w - 1, y + h - 2, '#26352f');
}

function escritorioBack(p: Pix): void {
  p.rect(0, 0, 320, 84, '#46545f');
  p.rect(0, 80, 320, 4, '#2e3a44');
  // carpete
  p.rect(0, 84, 320, 96, '#343f4b');
  for (let y = 84; y < 180; y++) for (let x = 0; x < 320; x++) if ((x + y * 3) % 7 === 0) p.px(x, y, '#3a4652');
  // janela grande com persianas
  p.rect(204, 8, 104, 66, '#a8c4d8');
  for (let i = 0; i < 6; i++) p.rect(206 + i * 17, 40 - Math.floor(hash2(i, 1, 5) * 24), 14, 34, '#7f9ab0');
  for (let y = 9; y < 74; y += 3) p.hl(204, 307, y, '#d8e4ec');
  p.frame(203, 7, 106, 68, '#8a9aa8');
  // ar-condicionado
  p.rect(36, 8, 58, 14, '#eef2f4');
  p.hl(36, 93, 8, '#ffffff');
  p.hl(38, 91, 18, '#b8c4cc');
  p.hl(38, 91, 20, '#b8c4cc');
  p.px(88, 12, '#7fd17a');
  // painel de metas
  metricsScreen(p, 62, 28, 124, 46, '94');
  // mesa executiva
  p.rect(70, 100, 180, 12, '#3a2a22');
  p.hl(70, 249, 100, '#5a4234');
  p.rect(72, 112, 176, 34, '#2a1e18');
  p.hl(72, 247, 112, '#1a120e');
  floorShadow(p, 160, 147, 92, 3, 0.4);
  // cadeira executiva (encosto acima da mesa)
  p.rect(146, 74, 28, 26, '#1e1e22');
  p.hl(146, 173, 74, '#3a3a40');
  // objetos na mesa
  p.rect(84, 94, 12, 6, '#c8d4dc');
  p.rect(226, 90, 6, 10, '#bfe3f2');
  p.hl(226, 231, 90, '#ffffff');
  // planta
  p.rect(292, 126, 16, 20, '#c8c4bc');
  p.disc(300, 112, 12, '#3f6a4a');
  p.disc(295, 104, 7, '#4f7a5a');
  p.disc(306, 116, 6, '#2f5a3a');
}

function escritorioLight(p: Pix, front: boolean): void {
  p.glow(256, 40, 160, '#d8ecf8', 0.14, 4, 1, front);
  vignette(p, '#0e141a', 0.5, front);
}

function escritorioAnim(p: Pix, has: Has, t: number): void {
  // vento do ar-condicionado
  for (let i = 0; i < 4; i++) {
    const ph = ((t / 1400 + i / 4) % 1 + 1) % 1;
    const y = 24 + Math.floor(ph * 18);
    p.pxa(44 + i * 12 + Math.floor(ph * 4), y, '#e6f4fb', 0.5 * (1 - ph));
    p.pxa(45 + i * 12 + Math.floor(ph * 4), y + 1, '#e6f4fb', 0.35 * (1 - ph));
  }
  const blink = Math.floor(t / 700) % 2 === 0;
  p.rect(62 + 124 - 8, 28 + 4, 3, 3, blink ? '#7fd17a' : '#2f6a3c');
}

function escritorioPlace(c: SceneCast): Placement {
  const x = clampX(c.x);
  if (c.pose === 'sentado') return { x: x >= 80 && x <= 240 ? 160 : x, bottom: x >= 80 && x <= 240 ? 112 : 168, layer: x >= 80 && x <= 240 ? 'back' : 'top', chair: !(x >= 80 && x <= 240) };
  return { x, bottom: 168, layer: 'top' };
}

// -----------------------------------------------------------------------------
// IGREJA
// -----------------------------------------------------------------------------
function igrejaBack(p: Pix): void {
  plaster(p, 0, 0, 320, 86, '#d6ccb8', '#c8bea8', 91, 0.05);
  // colunas
  for (const x of [20, 96, 214, 290]) {
    p.rect(x, 0, 10, 86, '#e6dec8');
    p.vl(x + 9, 0, 85, '#b8ae98');
  }
  // vitrais
  for (const x of [44, 258]) {
    p.rect(x, 14, 20, 44, '#2a2420');
    p.disc(x + 10, 14, 10, '#2a2420');
    for (let yy = 6; yy < 56; yy++)
      for (let xx = x + 2; xx < x + 18; xx++) {
        const inArch = yy >= 14 || (xx - (x + 10)) ** 2 + (yy - 14) ** 2 <= 64;
        if (!inArch) continue;
        const k = (Math.floor((xx - x) / 4) + Math.floor(yy / 5)) % 4;
        p.px(xx, yy, ['#c8302a', '#3a6ad0', '#f2d45c', '#4fae5b'][k]);
      }
    for (let yy = 8; yy < 56; yy += 5) p.hl(x + 2, x + 17, yy, '#2a2420');
    p.vl(x + 10, 6, 55, '#2a2420');
  }
  // cruz e altar
  p.rect(157, 10, 6, 40, '#5a3a22');
  p.rect(146, 20, 28, 6, '#5a3a22');
  p.hl(157, 162, 10, '#7a5030');
  p.rect(126, 64, 68, 6, '#f4f0e6');
  p.rect(128, 70, 64, 18, '#e8e0cc');
  p.hl(126, 193, 70, '#c8bea8');
  p.rect(150, 72, 20, 12, '#d8b448');
  // castiçais
  for (const x of [118, 200]) {
    p.rect(x, 50, 3, 20, '#d8b448');
    p.rect(x - 2, 70, 7, 3, '#b8942a');
    p.rect(x, 44, 2, 6, '#f4f0e6');
  }
  // piso
  p.rect(0, 86, 320, 94, '#8a7a64');
  tileGrid(p, 0, 86, 320, 94, '#8a7a64', '#76674f', 20, 10, true);
  // tapete do corredor
  p.poly(
    [
      [146, 86],
      [174, 86],
      [196, 180],
      [124, 180],
    ],
    '#8a2a2e',
  );
  p.line(146, 86, 124, 179, '#d8b448');
  p.line(174, 86, 196, 179, '#d8b448');
  // bancos
  for (const y of [94, 110, 126, 142]) drawPews(p, y);
}

function drawPews(p: Pix, y: number): void {
  const k = (y - 86) / 94;
  const inset = Math.round(16 * k);
  for (const [a, b] of [
    [20 - inset, 140 - inset],
    [180 + inset, 300 + inset],
  ] as [number, number][]) {
    p.rect(a, y, b - a, 4, '#6a4428');
    p.hl(a, b - 1, y, '#8a6038');
    p.rect(a, y + 4, b - a, 3, '#4a2e1a');
    p.rect(a, y + 7, b - a, 3, '#7a5030');
    p.vl(a, y, y + 12, '#4a2e1a');
    p.vl(b - 1, y, y + 12, '#3a2414');
  }
}

function igrejaFront(p: Pix): void {
  drawPews(p, 158);
}

function igrejaLight(p: Pix, front: boolean): void {
  p.glow(54, 120, 50, '#e88a7a', 0.12, 3, 0.5, front);
  p.glow(268, 120, 50, '#7aa8e8', 0.12, 3, 0.5, front);
  p.glow(160, 40, 90, '#fff0c8', 0.18, 4, 1, front);
  vignette(p, '#140e0a', 0.7, front);
}

function igrejaPlace(c: SceneCast): Placement {
  const x = clampX(c.x);
  if (c.pose === 'sentado') return { x, bottom: 152, layer: 'back' };
  if (c.pose === 'deitado') return { x: 160, bottom: 100, layer: 'back', blanket: '#f4f0e6' };
  return { x, bottom: 154, layer: 'back' };
}

function igrejaAnim(p: Pix, has: Has, t: number): void {
  candle(p, 118, 44, t, true);
  candle(p, 200, 44, t + 300, true);
}

// -----------------------------------------------------------------------------
// MESA (close na mesa do regulador)
// -----------------------------------------------------------------------------
let mesaMap: Pix | null = null;

function mesaBack(p: Pix, has: Has): void {
  // close: tudo desenhado a 1× numa mesa 160×90 e ampliado 2× (pixels gordos)
  const s = new Pix(160, 90);
  s.rect(0, 0, 160, 90, '#22302a');
  for (let y = 0; y < 90; y++) for (let x = 0; x < 160; x++) if (hash2(x, y, 5) < 0.05) s.px(x, y, '#2a3a33');
  // reflexo do fluorescente na fórmica
  for (let y = 34; y < 40; y++) for (let x = 0; x < 160; x++) if (bayerOn(x, y, 0.22)) s.px(x, y, '#3d5248');
  // borda da mesa
  s.rect(0, 86, 160, 4, '#16201c');
  s.hl(0, 159, 86, '#3d5248');
  monitorFrame(s, 36, 2, 88, 30);
  postit(s, 30, 3, CENTRAL.postit, 7);
  postit(s, 122, 6, '#f2a0b8', 8);
  // teclado
  s.rect(48, 40, 62, 9, '#c4d4c0');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 15; c++) s.rect(50 + c * 4, 41 + r * 2, 3, 1, '#e6efd9');
  s.hl(48, 109, 48, '#8fa89a');
  // telefone
  deskPhone(s, 4, 44);
  // formulários + caneta
  papers(s, 58, 54, 30, 26, 2);
  s.line(74, 74, 84, 66, '#2a5aa0');
  s.px(84, 66, '#e6efd9');
  // carimbo e almofada
  s.rect(94, 70, 12, 5, '#3a2a2a');
  s.rect(95, 71, 10, 3, '#a02c24');
  s.rect(110, 66, 6, 2, '#c8302a');
  s.rect(111, 60, 4, 6, '#7a5030');
  s.rect(112, 57, 2, 3, '#8a5a32');
  // manual
  manualBinder(s, 132, 52, 22, 30);
  // foto da família — o único calor da mesa
  s.glow(125, 41, 12, '#ffe2a3', 0.22, 3);
  familyPhoto(s, 118, 36, 14, 11);
  // caneca de café
  s.rect(102, 50, 8, 8, '#e6efd9');
  s.hl(102, 109, 50, '#ffffff');
  s.hl(103, 108, 51, '#4a2a18');
  s.vl(109, 51, 57, '#c4d4c0');
  s.px(110, 52, '#e6efd9');
  s.px(111, 53, '#c4d4c0');
  s.px(111, 54, '#c4d4c0');
  s.px(110, 55, '#c4d4c0');
  s.hl(102, 109, 58, '#8fa89a');
  // objetos de inspeção
  if (has.has('carta')) letter(s, 90, 46);
  if (has.has('envelope')) fatEnvelope(s, 88, 48);
  if (has.has('alianca')) ring(s, 116, 64, 0);
  if (has.has('cracha')) badge(s, 14, 62);
  if (has.has('flores')) flowers(s, 146, 14);
  p.blit(s.scaled(2), 0, 0);
  // conteúdo do monitor em resolução nativa (tela tem pixels mais finos)
  if (!mesaMap) mesaMap = renderCityMap({ tile: 3, t: 0, showLabels: false });
  p.blit(mesaMap.crop(10, 34, 176, 60), 72, 4);
  for (let y = 4; y < 64; y += 2) p.recta(72, y, 176, 1, '#000000', 0.12);
}

function mesaAnim(p: Pix, has: Has, t: number): void {
  // vapor da caneca e brilho da aliança
  for (let i = 0; i < 2; i++) {
    const ph = ((t / 1000 + i / 2) % 1 + 1) % 1;
    p.pxa(210 + i * 4 + Math.round(Math.sin(ph * 6) * 2), 96 - Math.floor(ph * 18), '#e6efd9', 0.35 * (1 - ph));
  }
  if (has.has('alianca') && Math.floor(t / 600) % 3 === 0) {
    p.px(240, 126, '#ffffff');
    p.px(239, 127, '#fff4c8');
    p.px(241, 127, '#fff4c8');
  }
}

function mesaLight(p: Pix, front: boolean): void {
  vignette(p, '#0a100e', 0.7, front);
}

// -----------------------------------------------------------------------------
// Objetos por cenário
// -----------------------------------------------------------------------------
const o = (x: number, y: number, w: number, h: number, layer: Layer, draw?: ObjDef['draw'], anim?: ObjDef['anim']): ObjDef => ({ r: { x, y, w, h }, layer, draw, anim });

const DRAW = {
  cracha: (p: Pix, r: Rect) => badge(p, r.x, r.y),
  isopor: (p: Pix, r: Rect) => styrofoam(p, r.x, r.y),
  xicara: (p: Pix, r: Rect) => cup(p, r.x, r.y, true),
  lata: (p: Pix, r: Rect) => sugarTin(p, r.x, r.y),
  suco: (p: Pix, r: Rect) => juiceGlass(p, r.x, r.y),
  insulina: (p: Pix, r: Rect) => insulin(p, r.x, r.y),
  meia: (p: Pix, r: Rect) => stainedSock(p, r.x, r.y),
  sapato: (p: Pix, r: Rect) => closedShoes(p, r.x, r.y),
  bolsa: (p: Pix, r: Rect) => handbag(p, r.x, r.y),
  raiva: (p: Pix, r: Rect) => angryDrawing(p, r.x, r.y),
  bolo: (p: Pix, r: Rect) => cornCake(p, r.x, r.y),
  envelope: (p: Pix, r: Rect) => fatEnvelope(p, r.x, r.y),
  bombinha: (p: Pix, r: Rect) => inhaler(p, r.x, r.y),
  flores: (p: Pix, r: Rect) => flowers(p, r.x, r.y),
  carta: (p: Pix, r: Rect) => letter(p, r.x, r.y),
  balde: (p: Pix, r: Rect) => bucket(p, r.x, r.y + 2),
};

/** vela: em cima do bolo (se houver) ou num pires */
function candleAnim(cakeAt: Rect | null) {
  return (p: Pix, r: Rect, t: number, has: Has) => {
    if (has.has('bolo') && cakeAt) candle(p, cakeAt.x + 10, cakeAt.y - 5, t);
    else {
      p.ellipse(r.x + 2, r.y + 10, 4, 1.4, '#f4f0e6');
      candle(p, r.x + 1, r.y + 1, t);
    }
  };
}

function ringAnim(p: Pix, r: Rect, t: number): void {
  ring(p, r.x + 1, r.y + 3, t);
}

/** goteira: mancha no teto e gotas caindo até o balde (ou poça) */
function leakAnim(x: number, floorY: number, topY = 4) {
  return (p: Pix, r: Rect, t: number, has: Has) => {
    const ph = (t % 1100) / 1100;
    const y = topY + Math.floor(ph * ph * (floorY - topY - 2));
    if (ph < 0.92) {
      p.px(x, y, '#9fd0ea');
      p.px(x, y - 1, '#cfe8f4');
    } else {
      const k = (ph - 0.92) / 0.08;
      p.px(x - 2 - Math.floor(k * 2), floorY - 2 - Math.floor(k * 3), '#cfe8f4');
      p.px(x + 2 + Math.floor(k * 2), floorY - 2 - Math.floor(k * 3), '#cfe8f4');
    }
    void r;
    void has;
  };
}

function leakStain(x: number, floorY: number, topY = 2) {
  return (p: Pix, r: Rect, has: Has) => {
    // mancha de infiltração: aréola marrom com o miolo escuro e o escorrido
    p.ellipse(x, topY, 8, 4, '#7a5a3a', 0.4);
    p.ellipse(x, topY - 1, 5, 2.4, '#5a4028', 0.5);
    p.line(x, topY + 2, x, topY + 6, '#5a4028', 0.45);
    if (!has.has('balde')) p.ellipse(x, floorY, 9, 2.4, '#5aa7d6', 0.5);
    void r;
  };
}

const COZ_CAKE = { x: 149, y: 106, w: 22, h: 11 };
const SALA_CAKE = { x: 149, y: 113, w: 22, h: 11 };

const OBJECTS: Partial<Record<SceneBg, Record<string, ObjDef>>> = {
  cozinha: {
    roupa_varal: o(98, 46, 30, 21, 'back'),
    prato_seco: o(131, 68, 9, 14, 'back'),
    lata_acucar: o(138, 44, 11, 16, 'back'),
    suco_escondido: o(147, 47, 7, 13, 'back'),
    geladeira_ok: o(52, 62, 22, 38, 'back'),
    geladeira_quebrada: o(52, 62, 28, 44, 'back'),
    desenhos: o(56, 76, 14, 20, 'back'),
    desenho_raiva: o(56, 63, 14, 12, 'back', (p, r) => angryDrawing(p, r.x + 1, r.y + 1)),
    carta: o(55, 64, 11, 9, 'back', (p, r) => {
      letter(p, r.x + 1, r.y + 2);
      p.px(r.x + 5, r.y + 1, '#d94436');
    }),
    maquina: o(214, 64, 30, 20, 'back'),
    cartao_maquina: o(222, 61, 11, 9, 'back'),
    cracha: o(39, 60, 12, 21, 'back', (p, r) => badge(p, r.x, r.y + 1)),
    bombinha: o(79, 74, 17, 9, 'back', (p, r) => inhaler(p, r.x + 1, r.y + 1)),
    isopor: o(208, 99, 22, 15, 'back', (p, r) => styrofoam(p, r.x + 1, r.y + 1)),
    meia_mancha: o(37, 90, 16, 19, 'back'),
    // os pés da Dona Zélia, sentada na cabeceira dela (o sapato fechado é o que ela calça)
    sapato_fechado: o(195, 129, 18, 11, 'back'),
    goteira: o(292, 32, 16, 14, 'back', leakStain(300, 147, 40), leakAnim(300, 147, 44)),
    balde: o(293, 135, 14, 14, 'front', DRAW.balde),
    mesa_vazia: o(124, 112, 72, 30, 'front'),
    cadeira_vazia: o(195, 120, 18, 20, 'front'),
    bolo: o(COZ_CAKE.x, COZ_CAKE.y, COZ_CAKE.w, COZ_CAKE.h, 'front', DRAW.bolo),
    vela: o(156, 98, 8, 12, 'front', undefined, candleAnim(COZ_CAKE)),
    flores: o(178, 94, 12, 22, 'front', DRAW.flores),
    insulina: o(144, 115, 16, 9, 'front', DRAW.insulina),
    xicara: o(182, 111, 9, 8, 'front', DRAW.xicara),
    envelope: o(130, 115, 16, 10, 'front', DRAW.envelope),
    alianca: o(186, 117, 8, 7, 'front', undefined, ringAnim),
    // a bolsa largada na cadeira vazia da cabeceira (desenhada em cozinhaSeats)
    bolsa_passagem: o(108, 118, 17, 14, 'front'),
  },
  sala: {
    cracha: o(37, 57, 12, 21, 'back', (p, r) => badge(p, r.x, r.y + 1)),
    roupa_varal: o(140, 40, 40, 26, 'back'),
    maquina: o(250, 64, 30, 20, 'back'),
    cartao_maquina: o(259, 61, 11, 9, 'back'),
    cadeira_vazia: o(222, 97, 28, 28, 'back'),
    sapato_fechado: o(38, 100, 16, 7, 'back', (p, r) => closedShoes(p, r.x + 1, r.y + 1)),
    carta: o(15, 99, 11, 8, 'back', (p, r) => letter(p, r.x + 1, r.y + 1)),
    bolsa_passagem: o(180, 79, 15, 13, 'back', DRAW.bolsa),
    meia_mancha: o(84, 135, 11, 8, 'back', DRAW.meia),
    goteira: o(188, 25, 16, 12, 'back', leakStain(196, 146, 33), leakAnim(196, 146, 34)),
    desenhos: o(100, 55, 30, 20, 'back', (p, r) => {
      kidDrawing(p, r.x + 2, r.y + 3, 12, 11, 'ambulancia', 6);
      kidDrawing(p, r.x + 16, r.y + 1, 11, 12, 'familia', 7);
    }),
    isopor: o(270, 99, 22, 15, 'back', (p, r) => styrofoam(p, r.x + 1, r.y + 1)),
    geladeira_quebrada: o(0, 0, 0, 0, 'back'),
    geladeira_ok: o(0, 0, 0, 0, 'back'),
    bolo: o(SALA_CAKE.x, SALA_CAKE.y, SALA_CAKE.w, SALA_CAKE.h, 'front', DRAW.bolo),
    vela: o(156, 105, 8, 12, 'front', undefined, candleAnim(SALA_CAKE)),
    flores: o(170, 102, 12, 22, 'front', DRAW.flores),
    alianca: o(140, 120, 8, 7, 'front', undefined, ringAnim),
    envelope: o(138, 117, 16, 10, 'front', DRAW.envelope),
    xicara: o(172, 117, 9, 8, 'front', DRAW.xicara),
    insulina: o(150, 119, 16, 9, 'front', DRAW.insulina),
    bombinha: o(140, 119, 17, 9, 'front', DRAW.bombinha),
    lata_acucar: o(174, 109, 10, 14, 'front', (p, r) => sugarTin(p, r.x + 1, r.y)),
    desenho_raiva: o(222, 140, 14, 12, 'front', DRAW.raiva),
    balde: o(189, 134, 14, 14, 'front', DRAW.balde),
  },
  quarto: {
    // do lado do travesseiro, em cima do cobertor
    bombinha: o(48, 85, 17, 9, 'back', (p, r) => inhaler(p, r.x + 1, r.y + 1)),
    xicara: o(121, 78, 9, 8, 'back', (p, r) => cup(p, r.x, r.y)),
    insulina: o(117, 78, 16, 9, 'back', (p, r) => insulin(p, r.x + 1, r.y)),
    alianca: o(123, 80, 8, 7, 'back', undefined, ringAnim),
    desenho_raiva: o(195, 59, 14, 12, 'back', (p, r) => angryDrawing(p, r.x + 1, r.y + 1)),
    desenhos: o(24, 53, 68, 21, 'back'),
    meia_mancha: o(116, 132, 11, 8, 'back', DRAW.meia),
    carta: o(70, 88, 11, 8, 'back', DRAW.carta),
    envelope: o(66, 88, 16, 10, 'back', DRAW.envelope),
    flores: o(222, 63, 12, 22, 'back', DRAW.flores),
    sapato_fechado: o(250, 101, 16, 7, 'back', (p, r) => closedShoes(p, r.x + 1, r.y + 1)),
    goteira: o(186, 34, 16, 12, 'back', leakStain(194, 140, 40), leakAnim(194, 140, 42)),
    balde: o(187, 128, 14, 14, 'front', DRAW.balde),
  },
  porta: {
    carta: o(178, 97, 13, 13, 'back', (p, r) => {
      letter(p, r.x + 2, r.y + 1);
    }),
    flores: o(129, 98, 12, 22, 'back', DRAW.flores),
    bolo: o(212, 129, 22, 11, 'back', DRAW.bolo),
    vela: o(219, 121, 8, 12, 'back', undefined, candleAnim({ x: 212, y: 129, w: 22, h: 11 })),
    sapato_fechado: o(DOOR.x + 3, PORCH_Y - 1, 16, 7, 'back', (p, r) => closedShoes(p, r.x + 1, r.y + 1)),
    envelope: o(DOOR.x + 3, PORCH_Y + 1, 16, 10, 'back', DRAW.envelope),
    bolsa_passagem: o(100, 113, 17, 14, 'front'),
    maquina: o(52, 60, 46, 34, 'back'),
    cartao_maquina: o(52, 60, 46, 34, 'back'),
    moveis_calcada: o(222, 92, 96, 50, 'front', (p) => porchFurniture(p)),
  },
  calcada: {
    moveis_calcada: o(8, 96, 290, 52, 'front'),
    maquina: o(112, 100, 30, 22, 'front'),
    desenho_raiva: o(188, 148, 14, 12, 'front', DRAW.raiva),
    flores: o(286, 125, 12, 22, 'front', DRAW.flores),
    carta: o(153, 60, 16, 18, 'back'),
  },
  escola: {
    flores: o(204, 79, 12, 22, 'back', DRAW.flores),
    desenhos: o(98, 44, 124, 12, 'back'),
  },
  igreja: {
    flores: o(132, 52, 12, 22, 'back', DRAW.flores),
    vela: o(118, 40, 8, 12, 'back'),
    carta: o(170, 74, 11, 8, 'back', DRAW.carta),
  },
  mesa: {
    xicara: o(202, 98, 22, 20, 'back'),
    carta: o(180, 92, 18, 12, 'back'),
    envelope: o(176, 94, 28, 18, 'back'),
    alianca: o(230, 124, 12, 10, 'back'),
    cracha: o(28, 124, 22, 40, 'back'),
    flores: o(292, 26, 22, 42, 'back'),
  },
  escritorio: {
    envelope: o(118, 92, 16, 10, 'back', DRAW.envelope),
    carta: o(196, 92, 11, 8, 'back', DRAW.carta),
    flores: o(100, 82, 12, 22, 'back', DRAW.flores),
  },
  central: {
    xicara: o(66, 128, 9, 8, 'front', DRAW.xicara),
    cracha: o(4, 40, 12, 20, 'back', (p, r) => badge(p, r.x, r.y)),
  },
};

/** retângulo padrão de cada objeto (posição na cozinha, ou no primeiro cenário onde aparece) */
export const OBJECT_RECTS: Record<string, Rect> = (() => {
  const out: Record<string, Rect> = {};
  for (const bg of ['cozinha', 'sala', 'quarto', 'porta', 'calcada', 'mesa'] as SceneBg[]) {
    const objs = OBJECTS[bg];
    if (!objs) continue;
    for (const [id, d] of Object.entries(objs)) if (!out[id] && d.r.w > 0) out[id] = { ...d.r };
  }
  for (const id of SCENE_OBJECTS) if (!out[id]) out[id] = { x: 140, y: 100, w: 40, h: 30 };
  return out;
})();

/** retângulo clicável (modo inspeção) do objeto no cenário, em coordenadas 320×180 */
export function objectRect(bg: SceneBg, id: string): Rect {
  const d = OBJECTS[bg]?.[id];
  if (d && d.r.w > 0) return { ...d.r };
  return { ...(OBJECT_RECTS[id] ?? { x: 140, y: 100, w: 40, h: 30 }) };
}

/** objetos que o cenário sabe desenhar */
export function objectsFor(bg: SceneBg): string[] {
  return Object.keys(OBJECTS[bg] ?? {});
}

// -----------------------------------------------------------------------------
// Definições
// -----------------------------------------------------------------------------
const noPlace = (): Placement | null => null;

const BGS: Record<SceneBg, BgDef> = {
  cozinha: {
    warm: true,
    back: cozinhaBack,
    front: cozinhaFront,
    light: cozinhaLight,
    anim: cozinhaAnim,
    place: cozinhaPlace,
    seats: cozinhaSeats,
    // a Zélia na cabeceira dela, o Liam atrás da mesa, o cônjuge na frente perto da pia
    marks: { LUCIA: 86, ALEX: 86, DAVI: 150, ZELIA: 204, EU_M: 176, EU_F: 176 },
    ozzy: [
      { x: 248, y: 147, flip: true, layer: 'top' },
      { x: 104, y: 149, layer: 'top' },
      { x: 268, y: 112, flip: true },
    ],
    ozzySleep: { x: 112, y: 108 },
    objects: OBJECTS.cozinha ?? {},
  },
  sala: {
    warm: true,
    back: salaBack,
    front: salaFront,
    light: salaLight,
    anim: salaAnim,
    place: salaPlace,
    seats: salaSeats,
    // a Zélia na poltrona dela, o Liam entre o sofá e a mesinha, o cônjuge ao lado do sofá
    marks: { LUCIA: 112, ALEX: 112, DAVI: 152, ZELIA: 236, EU_M: 84, EU_F: 84 },
    ozzy: [
      { x: 122, y: 146, layer: 'top' },
      { x: 226, y: 146, flip: true, layer: 'top' },
      { x: 288, y: 138, flip: true, layer: 'top' },
    ],
    ozzySleep: { x: 192, y: 111 },
    objects: OBJECTS.sala ?? {},
  },
  quarto: {
    warm: true,
    back: quartoBack,
    light: quartoLight,
    place: quartoPlace,
    // o Liam no tapete, o cônjuge perto do abajur, a Zélia sentada na beira da cama
    marks: { DAVI: 168, LUCIA: 126, ALEX: 126, ZELIA: 80, EU_M: 222, EU_F: 222 },
    ozzy: [
      { x: 202, y: 141, flip: true, layer: 'top' },
      { x: 140, y: 146, layer: 'top' },
    ],
    ozzySleep: { x: 180, y: 134 },
    objects: OBJECTS.quarto ?? {},
  },
  porta: {
    warm: true,
    back: portaBack,
    front: portaFront,
    light: portaLight,
    place: portaPlace,
    seats: portaSeats,
    // o cônjuge na soleira, o Liam ao lado, a Zélia na cadeira de fio
    marks: { LUCIA: 161, ALEX: 161, DAVI: 196, ZELIA: 108, EU_M: 132, EU_F: 132 },
    ozzy: [
      { x: 232, y: 135, flip: true },
      { x: 76, y: 135 },
    ],
    objects: OBJECTS.porta ?? {},
  },
  calcada: {
    warm: true,
    back: calcadaBack,
    front: calcadaFront,
    light: calcadaLight,
    place: calcadaPlace,
    // de pé na calçada, ao lado da mudança; a Zélia sentada no sofá
    marks: { LUCIA: 178, ALEX: 178, DAVI: 160, ZELIA: 40, EU_M: 290, EU_F: 290 },
    objects: OBJECTS.calcada ?? {},
  },
  escola: {
    warm: true,
    back: escolaBack,
    front: escolaFront,
    light: escolaLight,
    place: escolaPlace,
    seats: escolaSeats,
    // o Liam no palco; a família na primeira fila, dos lados
    marks: { DAVI: 152, LUCIA: 60, ALEX: 60, ZELIA: 268, EU_M: 248, EU_F: 248 },
    objects: OBJECTS.escola ?? {},
  },
  central: { warm: false, back: centralBack, front: centralFront, light: centralLight, anim: centralAnim, place: centralPlace, objects: OBJECTS.central ?? {} },
  rua: { warm: true, back: ruaBack, front: ruaFront, light: ruaLight, place: ruaPlace, objects: {} },
  hospital: {
    warm: false,
    back: hospitalBack,
    light: hospitalLight,
    anim: hospitalAnim,
    place: hospitalPlace,
    // a Zélia na cadeira da espera, a família de pé ao lado
    marks: { ZELIA: 264, LUCIA: 214, ALEX: 214, DAVI: 196, EU_M: 140, EU_F: 140 },
    objects: {},
  },
  escritorio: { warm: false, back: escritorioBack, light: escritorioLight, anim: escritorioAnim, place: escritorioPlace, objects: OBJECTS.escritorio ?? {} },
  igreja: { warm: true, back: igrejaBack, front: igrejaFront, light: igrejaLight, anim: igrejaAnim, place: igrejaPlace, objects: OBJECTS.igreja ?? {} },
  mesa: { warm: false, back: mesaBack, light: mesaLight, anim: mesaAnim, place: noPlace, objects: OBJECTS.mesa ?? {} },
  preto: { warm: false, back: (p) => p.clear('#050505'), place: noPlace, objects: {} },
};

// -----------------------------------------------------------------------------
// Renderização
// -----------------------------------------------------------------------------
interface Layers {
  back: Pix;
  front: Pix;
  map: ((hex: string) => string) | null;
  q: number;
}

const layerCache = new Map<string, Layers>();

function buildLayers(bg: SceneBg, q: number, objs: string[]): Layers {
  const def = BGS[bg] ?? BGS.preto;
  const has: Has = new Set(objs);
  const map = def.warm && q > 0 ? homeGrader(q) : null;
  const back = new Pix(SCENE_W, SCENE_H).setMap(map);
  back.clear('#000000');
  def.back(back, has);
  for (const [id, d] of Object.entries(def.objects)) if (has.has(id) && d.layer === 'back' && d.draw) d.draw(back, d.r, has);
  def.light?.(back, false);
  const front = new Pix(SCENE_W, SCENE_H).setMap(map);
  def.front?.(front, has);
  for (const [id, d] of Object.entries(def.objects)) if (has.has(id) && d.layer === 'front' && d.draw) d.draw(front, d.r, has);
  def.light?.(front, true);
  return { back, front, map, q };
}

function layersFor(bg: SceneBg, blend: number, objects: string[]): Layers {
  const def = BGS[bg] ?? BGS.preto;
  const q = def.warm ? quantize(blend, 20) : 0;
  const objs = [...new Set(objects)].filter((id) => def.objects[id]).sort();
  const key = `${bg}|${q}|${objs.join(',')}`;
  let l = layerCache.get(key);
  if (!l) {
    l = buildLayers(bg, q, objs);
    layerCache.set(key, l);
    if (layerCache.size > 24) layerCache.delete(layerCache.keys().next().value as string);
  }
  return l;
}

const PHASE: Record<string, number> = { LUCIA: 0.1, ALEX: 0.1, DAVI: 0.55, ZELIA: 0.3, EU_M: 0.8, EU_F: 0.8 };

/**
 * Marcação de palco da família na tela de casa: cada um tem o seu lugar em
 * cada cômodo (a Dona Zélia na cabeceira da mesa ou na poltrona, o Liam atrás
 * da mesa, o cônjuge na frente...), em vez de uma fila por ordem de fala. Assim
 * ninguém cai atrás da caixa de diálogo e os objetos pessoais (a xícara da
 * Zélia, a bolsa na cadeira) ficam perto de quem é dono deles.
 * Devolve o x de cada id (na ordem recebida); quem não tem marca neste cômodo
 * entra numa fila entre 70 e 250.
 */
export function familyMarks(bg: SceneBg, ids: SceneCast['id'][]): number[] {
  const marks = BGS[bg]?.marks ?? {};
  let free = 0;
  return ids.map((id) => {
    const m = marks[id] ?? marks[id === 'ALEX' ? 'LUCIA' : id === 'LUCIA' ? 'ALEX' : id === 'EU_F' ? 'EU_M' : id === 'EU_M' ? 'EU_F' : id];
    if (m !== undefined) return m;
    return 70 + 60 * free++;
  });
}

/** altura aproximada do sprite na pose (para evitar sobreposição com o Ozzy) */
function castHeight(c: SceneCast): number {
  if (c.pose === 'deitado') return 12;
  return figureHeight(c.id as CastId, c.pose as Pose);
}

function drawCastMember(p: Pix, c: SceneCast, pl: Placement, t: number, map: Layers['map'], q: number, icons: { x: number; y: number; s: MemberStatus }[]): void {
  const ph = PHASE[c.id] ?? 0;
  const inhale = Math.sin((t / 1000) * ((2 * Math.PI) / 3.4) + ph * 6.28) > 0.35;
  const blink = ((t + ph * 3000) % 4300) < 150;
  const fig = figurePix(c.id as CastId, c.pose as Pose, { inhale, blink, status: c.status, chair: pl.chair, blanket: pl.blanket });
  const g = gradedCopy(fig, map, 'q' + q);
  let x = pl.x - Math.floor(g.w / 2);
  if (c.status === 'frio' && t % 2200 < 800) x += Math.floor(t / 70) % 2;
  const y = pl.bottom - g.h + 1;
  if (c.pose !== 'deitado') floorShadow(p, pl.x, pl.bottom + 1, Math.floor(g.w / 2) + 1, 1.6, 0.35);
  p.blit(g, x, y);
  if (c.status && c.status !== 'bem') {
    const top = c.pose === 'deitado' ? y - 2 : pl.bottom - figureHeight(c.id as CastId, c.pose as Pose) + 1;
    icons.push({ x: pl.x - 6, y: Math.max(36, top - 15) + (Math.floor(t / 420) % 2), s: c.status });
  }
}

const work = new Pix(SCENE_W, SCENE_H);
let workKey = '';

/** desenha a cena no Pix de trabalho `work` (reutilizado a cada quadro) */
function renderSceneInto(o: SceneOpts): Pix {
  const bg: SceneBg = BGS[o.bg] ? o.bg : 'preto';
  const def = BGS[bg];
  const L = layersFor(bg, o.blend, o.objects ?? []);
  const has: Has = new Set(o.objects ?? []);
  const t = o.time;
  const mk = `${bg}|${L.q}`;
  if (mk !== workKey) {
    work.setMap(L.map);
    workKey = mk;
  }
  work.copyFrom(L.back);
  def.anim?.(work, has, t, o.blend);
  for (const [id, d] of Object.entries(def.objects)) if (has.has(id) && d.layer === 'back' && d.anim) d.anim(work, d.r, t, has);
  // elenco (e o Ozzy, na ordem de profundidade)
  const icons: { x: number; y: number; s: MemberStatus }[] = [];
  const cast = (o.cast ?? []).map((c) => ({ c, pl: def.place(c, has) })).filter((x): x is { c: SceneCast; pl: Placement } => !!x.pl);
  const occupied = new Set(cast.map((x) => x.pl.seat).filter((s): s is string => !!s));
  const placed: { bottom: number; layer: Placement['layer']; draw: () => void }[] = cast.map(({ c, pl }) => ({ bottom: pl.bottom, layer: pl.layer, draw: () => drawCastMember(work, c, pl, t, L.map, L.q, icons) }));
  const pose = o.ozzy;
  const playPath = o.ozzyPath ?? OZZY_PLAY_PATHS[bg];
  if (o.ozzyPlay != null && playPath) {
    const f = ozzyPlayAt(o.ozzyPlay, playPath);
    const layer: Placement['layer'] = bg === 'cozinha' && (f.phase === 'deitando' || f.phase === 'dormindo') ? 'back' : 'top';
    placed.push({ bottom: f.y, layer, draw: () => drawDog(work, f.x, f.y, f.pose, f.t, { map: L.map, mapKey: 'q' + L.q, flip: f.flip, zzz: true }) });
  } else if (pose && def.ozzy?.length) {
    // o primeiro lugar livre (sem ninguém do elenco em cima); dormindo, o cantinho dele
    const free = def.ozzy.find((s) => cast.every(({ c, pl }) => Math.abs(pl.x - s.x) > 17 || s.y < pl.bottom - castHeight(c) - 2 || s.y - 13 > pl.bottom + 1)) ?? def.ozzy[0];
    const at = pose === 'dormindo' && def.ozzySleep ? { ...def.ozzySleep, layer: 'back' as const, flip: false } : { x: free.x, y: free.y, layer: free.layer ?? 'back', flip: !!free.flip };
    placed.push({ bottom: at.y, layer: at.layer, draw: () => drawDog(work, at.x, at.y, pose, t, { map: L.map, mapKey: 'q' + L.q, flip: at.flip }) });
  }
  placed.sort((a, b) => a.bottom - b.bottom);
  for (const m of placed) if (m.layer === 'back') m.draw();
  work.blit(L.front, 0, 0);
  for (const [id, d] of Object.entries(def.objects)) if (has.has(id) && d.layer === 'front' && d.anim) d.anim(work, d.r, t, has);
  def.seats?.(work, has, occupied);
  for (const m of placed) if (m.layer === 'top') m.draw();
  // ícones de status (sem gradação: informação precisa continuar legível)
  for (const ic of icons) work.blit(statusIconPix(ic.s), ic.x, ic.y);
  // fluorescente: com muito desgaste a luz de casa tremula
  if (def.warm && o.blend > 0.45) {
    const k = Math.floor(t / 125);
    const r = hash2(k, 7, 3);
    if (r < 0.05 + (o.blend - 0.45) * 0.12) work.recta(0, 0, SCENE_W, SCENE_H, '#0d1311', 0.16 + 0.1 * o.blend);
    else if (r > 0.985) work.recta(0, 0, SCENE_W, SCENE_H, '#e6efd9', 0.05);
  }
  return work;
}

/** Renderiza a cena num Pix 320×180 NOVO (puro, sem DOM; pode ser guardado). */
export function renderScene(o: SceneOpts): Pix {
  return renderSceneInto(o).copy();
}

/**
 * Desenha a cena no contexto 2D em (0,0), em pixels nativos 320×180
 * (amplie com CSS image-rendering: pixelated, ex.: ×4).
 */
export function drawScene(ctx: CanvasRenderingContext2D, o: SceneOpts): void {
  presentPix(ctx, renderSceneInto(o), 0, 0, 1, 'scene');
}

void mix;
void nail;
