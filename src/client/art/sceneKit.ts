// =============================================================================
// Kit comum dos cenários 320×180: tipos (Rect, SceneCast, BgDef…), pincéis de
// parede e piso, luz da lâmpada, janelas, cadeiras — usado pelos cômodos de
// scenes.ts e pelos cômodos novos da casa explorável (houseRooms.ts).
// Também guarda a hora do dia do cenário que está sendo montado (noite, dia,
// madrugada): as janelas e as lâmpadas leem daqui.
// =============================================================================
import type { MemberStatus } from '../../engine/types';
import { Pix, hash2, bayerOn } from './pix';
import { HOME, shade } from './palette';
import { floorShadow, interviewClothes } from './props';

export const SCENE_W = 320;
export const SCENE_H = 180;

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

export type Layer = 'back' | 'front';
export type Has = Set<string>;

export interface ObjDef {
  r: Rect;
  layer: Layer;
  draw?: (p: Pix, r: Rect, has: Has) => void;
  anim?: (p: Pix, r: Rect, t: number, has: Has) => void;
}

export interface Placement {
  x: number;
  bottom: number;
  layer: 'back' | 'top';
  chair?: boolean;
  blanket?: string;
  /** lugar marcado (cadeira, poltrona, cama) que esta pessoa ocupa */
  seat?: string;
}

export interface BgDef {
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

export const clampX = (x: number, a = 10, b = 310) => Math.max(a, Math.min(b, Math.round(x)));

// -----------------------------------------------------------------------------
// Utilitários de cenário
// -----------------------------------------------------------------------------
export function plaster(p: Pix, x: number, y: number, w: number, h: number, base: string, spot: string, seed: number, dens = 0.05): void {
  p.rect(x, y, w, h, base);
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (hash2(xx, yy, seed) < dens) p.px(xx, yy, spot);
}

export function tileGrid(p: Pix, x: number, y: number, w: number, h: number, base: string, grout: string, tw: number, th: number, stagger = false): void {
  p.rect(x, y, w, h, base);
  for (let yy = y; yy < y + h; yy += th) p.hl(x, x + w - 1, yy, grout);
  for (let row = 0; row * th < h; row++) {
    const off = stagger && row % 2 ? Math.floor(tw / 2) : 0;
    for (let xx = x + off; xx < x + w; xx += tw) p.vl(xx, y + row * th, Math.min(y + h - 1, y + row * th + th - 1), grout);
  }
}

export function planks(p: Pix, x: number, y: number, w: number, h: number, base: string, line: string, ph: number, seed: number): void {
  p.rect(x, y, w, h, base);
  for (let yy = y; yy < y + h; yy += ph) {
    p.hl(x, x + w - 1, yy, line);
    const off = Math.floor(hash2(yy, 1, seed) * 40);
    for (let xx = x + off; xx < x + w; xx += 44) p.vl(xx, yy, Math.min(y + h - 1, yy + ph - 1), line);
  }
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (hash2(xx, yy, seed + 1) < 0.03) p.px(xx, yy, shade(base, 0.12));
}

/** escurece cantos em faixas pontilhadas */
export function vignette(p: Pix, col: string, strength: number, opaqueOnly = false, cx = 160, cy = 96): void {
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

// -----------------------------------------------------------------------------
// Casa: composição comum dos cômodos
// Com o diálogo aberto a tela de casa sobe a cena 33 linhas e a caixa de texto
// cobre da linha ~160 para baixo; o cabeçalho (retratos da família) cobre o
// canto de cima à esquerda até a linha ~54. Por isso tudo o que importa fica
// na faixa 40..156: a parede com o que conta a história do cômodo, o rodapé
// em WALL_Y e as marcas de chão do elenco entre 118 e 150.
// -----------------------------------------------------------------------------
/** linha do rodapé: onde a parede encontra o piso */
export const WALL_Y = 100;
/** marcas de chão (pés) do elenco: fundo (encostado na mobília), meio e frente */
export const FEET_BACK = 121;
export const FEET_FRONT = 149;

/** piso em perspectiva de um ponto: rejuntes horizontais que se abrem e linhas que fogem para (vx, vy) */
export function perspFloor(p: Pix, y0: number, y1: number, base: string, joint: string, o: { vx?: number; vy?: number; step?: number; first?: number; grow?: number; alt?: string; speck?: string; seed?: number } = {}): void {
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
export function skirting(p: Pix, y = WALL_Y): void {
  p.rect(0, y - 4, 320, 4, HOME.wood);
  p.hl(0, 319, y - 4, HOME.tan);
  p.hl(0, 319, y - 1, HOME.bg2);
}

/** sombra de contato da mobília encostada na parede (faixa escura no piso) */
export function wallContact(p: Pix, x: number, w: number, y = WALL_Y): void {
  p.recta(x - 1, y, w + 2, 1, '#120a06', 0.45);
  p.recta(x, y + 1, w, 1, '#120a06', 0.25);
}

/**
 * Luz da lâmpada pendurada: um cone pontilhado descendo da lâmpada até a poça
 * de luz no chão (o foco da cena) e um halo amplo. Nas camadas da frente só
 * ilumina pixels opacos.
 */
export function bulbCone(p: Pix, x: number, y: number, poolY: number, poolRX: number, front: boolean): void {
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
export function roomDark(p: Pix, cx: number, cy: number, rx: number, ry: number, col: string, strength: number, front: boolean, start = 0.42, bands = 3, floorY = -1, fry = ry * 0.6): void {
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
export function pendantLamp(p: Pix, x: number, y: number, top = 0): void {
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
export function bareBulb(p: Pix, x: number, y: number): void {
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
export function nightPane(p: Pix, x: number, y: number, w: number, h: number, has: Has, o: { moon?: boolean; clothes?: boolean; seed?: number } = {}): void {
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
export function windowFrame(p: Pix, x: number, y: number, w: number, h: number, col: string = HOME.wood2): void {
  p.frame(x - 2, y - 2, w + 4, h + 4, shade(col, -0.3));
  p.frame(x - 1, y - 1, w + 2, h + 2, col);
  p.vl(x + Math.floor(w / 2), y, y + h - 1, col);
  p.hl(x, x + w - 1, y + Math.floor(h / 2), col);
  p.line(x + 2, y + h - 3, x + 6, y + h - 7, '#46567a');
  p.rect(x - 4, y + h + 1, w + 8, 2, shade(col, 0.18));
  p.hl(x - 4, x + w + 3, y + h + 3, shade(col, -0.35));
}

/** encosto de cadeira de madeira visto de frente (14 de largura), topo em y */
export function chairBack(p: Pix, x: number, y: number): void {
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
export function frontChair(p: Pix, cx: number, floorY: number): void {
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


/** atalho de objeto: retângulo clicável + camada + desenho estático e/ou animação */
export const o = (x: number, y: number, w: number, h: number, layer: Layer, draw?: ObjDef['draw'], anim?: ObjDef['anim']): ObjDef => ({ r: { x, y, w, h }, layer, draw, anim });
