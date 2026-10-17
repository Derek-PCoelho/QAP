// =============================================================================
// Casa explorável: os objetos de cada dia nos cômodos que já existiam
// (cozinha, sala, quarto do Liam, porta/portão), tirados de
// docs/roteiro-1.1/casa.md. Cada um tem o retângulo clicável e o desenho
// (estático, na camada de trás ou da frente) e/ou uma animação. Os retângulos
// seguem a mobília desenhada em scenes.ts (geladeira, mesa, sofá, cama…).
// Variações visuais por opção: o nível do desenho do Liam vem das aulas de
// desenho ('@liam:N'), o assunto do desenho da geladeira de '@geladeira:<assunto>'.
// =============================================================================
import { Pix, hash2 } from './pix';
import { HOME, shade } from './palette';
import { drawText } from './font';
import { type ObjDef, type Has, type Rect, o, liamLevel, hasFlag } from './sceneKit';
import { floorShadow, cornCake, candle, bucket, ring, kidDrawing } from './props';
import { liamDrawing, wetDrawing, type LiamSubject, LIAM_SUBJECTS } from './liamArt';
import { suitcase } from './houseRooms';

/** assunto do desenho da geladeira ('@geladeira:<assunto>'; padrão: a ambulância) */
const fridgeSubject = (has: Has): LiamSubject => {
  const s = hasFlag(has, 'geladeira') as LiamSubject | undefined;
  return s && LIAM_SUBJECTS.includes(s) ? s : 'ambulancia';
};

/** papelzinho com linhas (bilhete, recibo, conta) */
function note(p: Pix, x: number, y: number, w: number, h: number, band?: string, lines = '#8a948f'): void {
  p.rect(x, y, w, h, '#f8f6ee');
  p.hl(x, x + w - 1, y + h - 1, '#d8d0c0');
  if (band) p.rect(x, y, w, 2, band);
  for (let yy = y + (band ? 3 : 2); yy < y + h - 1; yy += 2) p.hl(x + 1, x + w - 2 - (yy % 4 === 0 ? 1 : 0), yy, lines);
}

/** ímã de pizzaria do Seu Toninho (5×3, vermelho com a fatia amarela) */
function pizzaMagnet(p: Pix, x: number, y: number): void {
  p.rect(x, y, 5, 3, '#c8302a');
  p.px(x + 1, y + 1, '#f2d45c');
  p.px(x + 2, y, '#f2d45c');
  p.px(x + 3, y + 1, '#e8a33d');
}

/** jornal dobrado em cima da mesa (a Gazeta), visto de cima; `circle` = anúncio circulado de caneta */
function gazette(p: Pix, x: number, y: number, circle: boolean): void {
  p.rect(x, y, 20, 8, '#efe6cf');
  p.hl(x, x + 19, y + 7, '#c8c0a8');
  p.rect(x + 1, y + 1, 18, 2, '#1b1a17');
  p.rect(x + 1, y + 4, 7, 3, '#8a8478');
  for (let yy = y + 4; yy < y + 7; yy += 2) p.hl(x + 10, x + 18, yy, '#8a8478');
  if (circle) p.ring(x + 14, y + 5, 2, '#d94436');
}

/** prato coberto com outro prato (o bolo de mel recusado / o seu prato guardado) */
function coveredPlate(p: Pix, x: number, y: number): void {
  p.ellipse(x + 8, y + 6, 8, 2.4, '#f4f0e6');
  p.ellipse(x + 8, y + 3.4, 7, 2.6, '#e8e4d8');
  p.hl(x + 3, x + 12, y + 2, '#ffffff');
  p.ellipse(x + 8, y + 6.4, 7.6, 1.2, '#c8c4b8');
}

/** bolo de aniversário: fiado com a ambulância de plástico, pago, com sirene ou de dois andares */
function birthdayCake(p: Pix, x: number, y: number, kind: 'ambulancia' | 'pago' | 'sirene' | 'dois_andares'): void {
  p.ellipse(x + 11, y + 8, 11, 3, '#f4f0e6');
  p.ellipse(x + 11, y + 8.5, 10.5, 2.4, '#d8d4c8');
  const side = kind === 'pago' ? '#6a3a24' : '#f4ecf0';
  const top = kind === 'pago' ? '#7a4a2a' : '#ffffff';
  if (kind === 'dois_andares') {
    p.rect(x + 3, y + 3, 16, 5, side);
    p.ellipse(x + 11, y + 3, 8, 2.4, top);
    p.rect(x + 6, y - 2, 10, 5, '#e8b8c8');
    p.ellipse(x + 11, y - 2, 5, 1.6, '#f4d0dc');
    for (let xx = x + 4; xx < x + 19; xx += 2) p.px(xx, y + 7, '#5aa7d6');
    return;
  }
  p.rect(x + 3, y + 3, 16, 5, side);
  p.ellipse(x + 11, y + 7.5, 8, 2, shade(side, -0.12));
  p.ellipse(x + 11, y + 3, 8, 2.6, top);
  if (kind === 'pago') {
    // granulado colorido
    for (let i = 0; i < 9; i++) p.px(x + 5 + Math.floor(hash2(i, 1, 5) * 12), y + 2 + Math.floor(hash2(i, 2, 5) * 3), ['#d94436', '#f2d45c', '#4fae5b', '#5aa7d6'][i % 4]);
  } else if (kind === 'ambulancia') {
    // a ambulância de plástico em cima do glacê
    p.rect(x + 7, y - 1, 8, 4, '#f4f4ee');
    p.rect(x + 13, y + 0, 3, 3, '#f4f4ee');
    p.hl(x + 7, x + 15, y + 1, '#d94436');
    p.px(x + 8, y - 2, '#d94436');
    p.px(x + 9, y - 2, '#3a6ad0');
    p.px(x + 8, y + 3, '#1b1a17');
    p.px(x + 14, y + 3, '#1b1a17');
  } else {
    // a sirene de verdade (a luz gira na animação)
    p.rect(x + 9, y - 1, 4, 3, '#8a9098');
  }
  // bordinha de glacê
  for (let xx = x + 4; xx < x + 19; xx += 2) p.px(xx, y + 3 + ((xx >> 1) & 1), kind === 'pago' ? '#a86a3a' : '#f2a0b8');
}

/** geladeira nova (de duas portas, inox claro com o painel digital) no lugar da antiga */
export function newFridge(p: Pix, x: number, y: number): void {
  const W = 24;
  const H = 40;
  floorShadow(p, x + W / 2, y + H, W / 2 + 2, 1.8, 0.35);
  p.rect(x, y, W, H - 1, '#e4e8ea');
  p.vl(x, y, y + H - 2, '#f4f8fa');
  p.rect(x + W - 4, y, 4, H - 1, '#c4ccd0');
  p.vl(x + W - 1, y, y + H - 2, '#a8b0b4');
  p.hl(x, x + W - 1, y + 14, '#a8b0b4');
  p.rect(x + 2, y + 16, 2, 10, '#c8ccd0');
  p.rect(x + 2, y + 4, 2, 7, '#c8ccd0');
  // painel digital aceso
  p.rect(x + 9, y + 5, 7, 4, '#1e2a30');
  p.px(x + 10, y + 6, '#7fd17a');
  p.px(x + 12, y + 6, '#7fd17a');
  p.px(x + 14, y + 7, '#5aa7d6');
  p.rect(x + 1, y + H - 1, 3, 1, '#3a3028');
  p.rect(x + W - 4, y + H - 1, 3, 1, '#3a3028');
}

/** televisão nova ainda na caixa de papelão (ninguém abriu), 18×16 */
function tvBox(p: Pix, x: number, y: number): void {
  floorShadow(p, x + 9, y + 16, 10, 1.6, 0.4);
  p.rect(x, y, 18, 16, '#c49a62');
  p.hl(x, x + 17, y, '#d8b47a');
  p.vl(x + 17, y + 1, y + 15, '#a8804a');
  p.rect(x + 2, y + 3, 14, 8, '#2a2a30');
  p.rect(x + 3, y + 4, 12, 6, '#5a7aa8');
  p.rect(x + 3, y + 12, 8, 2, '#1b1a17');
  p.rect(x + 5, y - 1, 8, 2, '#e8e4dc');
}

/** cartela de comprimidos (6×4) */
function pillPack(p: Pix, x: number, y: number): void {
  p.rect(x, y, 6, 4, '#c8ccd0');
  for (let i = 0; i < 3; i++) {
    p.px(x + 1 + i * 2, y + 1, '#f4f4ee');
    p.px(x + 1 + i * 2, y + 2, i === 2 ? '#8a9098' : '#f4f4ee');
  }
}

/** fita métrica amarela de costureira, esticada (w px) */
function tapeMeasure(p: Pix, x: number, y: number, w: number): void {
  p.hl(x, x + w - 1, y, '#e8c84a');
  p.hl(x, x + w - 1, y + 1, '#c8a830');
  for (let xx = x; xx < x + w; xx += 3) p.px(xx, y, '#1b1a17');
  p.rect(x + w, y - 1, 3, 3, '#c8302a');
}

/** sofá aberto como sofá-cama da Zélia: o lençol, o travesseiro e a coberta dobrada */
function sofaBed(p: Pix): void {
  p.rect(124, 86, 74, 6, '#f4f0e6');
  p.hl(124, 197, 86, '#ffffff');
  p.rect(124, 92, 74, 4, '#d8d4c8');
  p.rect(126, 82, 16, 6, '#f8f6ee');
  p.hl(126, 141, 87, '#d8d0c0');
  for (let yy = 84; yy < 92; yy++) for (let xx = 166; xx < 196; xx++) p.px(xx, yy, (xx + yy) % 3 === 0 ? '#6a4a80' : '#9a7ab0');
}

/** a bacia com água fria e a garrafa de leite do Liam dentro (geladeira quebrada) */
function milkBasin(p: Pix, x: number, y: number): void {
  floorShadow(p, x + 9, y + 9, 10, 1.6, 0.35);
  p.ellipse(x + 9, y + 6, 9, 3, '#c8ccd0');
  p.ellipse(x + 9, y + 5.4, 7.4, 2.2, '#7cb0d0');
  p.rect(x + 7, y - 1, 4, 6, '#f8f8f0');
  p.rect(x + 7, y - 2, 4, 1, '#3a6ad0');
  p.px(x + 4, y + 5, '#d8eef8');
}

/** terço de contas pendurado em cima da TV */
function rosary(p: Pix, x: number, y: number): void {
  for (let i = 0; i < 12; i++) p.px(x + i, y + Math.round(Math.sin((i / 11) * Math.PI) * 3), i % 3 ? '#8a5a32' : '#e8dcc4');
  p.vl(x + 6, y + 3, y + 5, '#8a5a32');
  p.hl(x + 5, x + 7, y + 4, '#8a5a32');
}

/** caderno de capa dura cheio de guardanapos colados (o presente da Dona Cida) */
function napkinBook(p: Pix, x: number, y: number): void {
  p.rect(x, y, 15, 9, '#3a2a4a');
  p.hl(x, x + 14, y, '#5a4a6a');
  p.rect(x + 1, y + 1, 13, 7, '#f4f0e6');
  p.vl(x + 7, y + 1, y + 7, '#c8c0b0');
  // os guardanapos com retratos a caneta azul
  p.rect(x + 2, y + 2, 4, 4, '#fbf8f0');
  p.px(x + 3, y + 3, '#2a5aa0');
  p.px(x + 4, y + 4, '#2a5aa0');
  p.rect(x + 9, y + 2, 4, 4, '#fbf8f0');
  p.px(x + 10, y + 3, '#2a5aa0');
  p.px(x + 11, y + 3, '#2a5aa0');
  p.hl(x + 9, x + 12, y + 5, '#2a5aa0');
}

/** caixa de giz de cera de 12 cores — o lugar do azul vazio */
function crayonBox(p: Pix, x: number, y: number): void {
  const cols = ['#d94436', '#f07a2a', '#f2d45c', '#4fae5b', '', '#7a4aa8', '#e86a9a', '#8a5228', '#2a2a2a', '#5aa0e0', '#e8b48a', '#ffffff'];
  p.rect(x, y + 3, 12, 4, '#f2d45c');
  p.hl(x, x + 11, y + 3, '#fff27a');
  p.rect(x + 1, y + 4, 10, 1, '#c8302a');
  cols.forEach((c, i) => {
    if (!c) return;
    p.vl(x + (i % 12), y + (i % 2), y + 2, c);
  });
}

/** garrafa pet deitada (8×3) */
function petBottle(p: Pix, x: number, y: number): void {
  p.rect(x, y, 7, 3, '#cfe6f0');
  p.hl(x, x + 6, y, '#eef8fc');
  p.rect(x + 7, y + 1, 1, 1, '#3a7ad0');
  p.px(x + 2, y + 1, '#9fc8dc');
}

/** capa de lençol azul pendurada (8×18); `star` = com a estrela azul costurada à mão */
function sheetCape(p: Pix, x: number, y: number, star: boolean): void {
  for (let yy = 0; yy < 18; yy++) {
    const half = 3 + Math.floor(yy / 5);
    p.hl(x + 4 - half, x + 4 + half, y + yy, yy % 4 === 0 ? '#4a7ac0' : '#5a8ad0');
  }
  p.hl(x + 1, x + 7, y, '#2a4a8a');
  if (star) {
    p.px(x + 4, y + 7, '#f4f4ee');
    p.px(x + 3, y + 8, '#f4f4ee');
    p.px(x + 5, y + 8, '#f4f4ee');
    p.px(x + 4, y + 8, '#3a6ad0');
    p.px(x + 4, y + 9, '#f4f4ee');
  }
}

/** crachá de "fiscal da dengue" de papel com cordão, pendurado na maçaneta */
function dengueBadge(p: Pix, x: number, y: number): void {
  p.line(x + 4, y, x + 1, y + 6, '#c8302a');
  p.line(x + 4, y, x + 7, y + 6, '#c8302a');
  p.rect(x, y + 6, 9, 8, '#f4f0e6');
  p.rect(x, y + 6, 9, 2, '#4fae5b');
  // o mosquito riscado
  p.px(x + 4, y + 10, '#1b1a17');
  p.px(x + 3, y + 9, '#1b1a17');
  p.px(x + 5, y + 11, '#1b1a17');
  p.line(x + 2, y + 12, x + 6, y + 8, '#d94436');
}

/** urso de pelúcia sentado, olhando para a porta */
function teddy(p: Pix, x: number, y: number): void {
  p.disc(x + 5, y + 4, 3, '#a8763f');
  p.disc(x + 2, y + 1, 1.4, '#a8763f');
  p.disc(x + 8, y + 1, 1.4, '#a8763f');
  p.ellipse(x + 5, y + 9, 4, 3, '#a8763f');
  p.px(x + 4, y + 4, '#1b1a17');
  p.px(x + 6, y + 4, '#1b1a17');
  p.px(x + 5, y + 5, '#5a3a22');
  p.rect(x + 3, y + 6, 5, 1, '#d94436');
}

/** notas de cinquenta caídas na calçada */
function bankNotes(p: Pix, x: number, y: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const nx = x + Math.floor(hash2(i, 1, 9) * 36);
    const ny = y + Math.floor(hash2(i, 2, 9) * 6);
    p.rect(nx, ny, 6, 3, '#e8b46a');
    p.hl(nx, nx + 5, ny, '#f8d08a');
    p.px(nx + 2, ny + 1, '#a8703a');
  }
}

/** a vassoura de piaçava encostada e as marcas de varrido na pedra portuguesa */
function sweptWalk(p: Pix, x: number, y: number): void {
  for (let i = 0; i < 14; i++) p.line(x + i * 4, y + 18, x + i * 4 + 6, y + 14, '#f0ece2', 0.5);
  p.line(x + 54, y - 6, x + 50, y + 18, '#a8763f');
  p.rect(x + 46, y + 16, 8, 5, '#c8a050');
  for (let xx = x + 46; xx < x + 54; xx += 2) p.vl(xx, y + 18, y + 21, '#a8803a');
}

const lv = liamLevel;

// -----------------------------------------------------------------------------
// COZINHA
// -----------------------------------------------------------------------------
const FRIDGE_DRAW: Rect = { x: 57, y: 77, w: 11, h: 10 };
const fridgeDrawing = (s?: LiamSubject) => (p: Pix, r: Rect, has: Has) => {
  liamDrawing(p, FRIDGE_DRAW.x, FRIDGE_DRAW.y, FRIDGE_DRAW.w, FRIDGE_DRAW.h, s ?? fridgeSubject(has), lv(has), 3, true);
  void r;
};

export const COZINHA_EXTRA: Record<string, ObjDef> = {
  // o desenho preso com o ímã da pizzaria (o assunto vem de '@geladeira:…'; evolui com as aulas)
  desenho_geladeira: o(55, 73, 15, 16, 'back', fridgeDrawing()),
  desenho_ambulancia_perdida: o(55, 73, 15, 16, 'back', fridgeDrawing('ambulancia_perdida')),
  ima_pizzaria: o(59, 64, 9, 6, 'back', (p) => pizzaMagnet(p, 61, 66)),
  bilhete_ima: o(58, 63, 11, 11, 'back', (p) => {
    note(p, 60, 66, 8, 7);
    pizzaMagnet(p, 61, 64);
  }),
  recibo_jairo: o(58, 87, 11, 10, 'back', (p) => {
    note(p, 60, 89, 7, 7, '#3a7ad0');
    pizzaMagnet(p, 61, 87);
  }),
  conta_luz: o(56, 63, 12, 12, 'back', (p) => {
    note(p, 58, 66, 9, 8, '#e8a33d');
    pizzaMagnet(p, 60, 64);
  }),
  conta_fiado: o(58, 87, 11, 10, 'back', (p) => {
    note(p, 60, 89, 7, 7, '#c8302a', '#2a5aa0');
    pizzaMagnet(p, 61, 87);
  }),
  // a chave da casa em cima da geladeira, presa com o ímã (final ruim)
  chave_ima: o(54, 56, 14, 8, 'back', (p) => {
    p.ring(58, 59, 1, '#d8b448');
    p.hl(59, 64, 59, '#d8b448');
    p.px(63, 60, '#d8b448');
    p.px(65, 60, '#d8b448');
    pizzaMagnet(p, 55, 58);
  }),
  geladeira_nova: o(50, 60, 26, 42, 'back'),
  // o envelope do DAE em cima do filtro de barro
  envelope_dae: o(190, 55, 16, 8, 'back', (p) => {
    p.rect(192, 57, 12, 5, '#dce8f4');
    p.hl(192, 203, 57, '#eef4fa');
    p.line(192, 57, 197, 60, '#a8b8c8');
    p.line(203, 57, 198, 60, '#a8b8c8');
    p.rect(193, 61, 4, 1, '#3a6aa8');
  }),
  torneira_pingando: o(108, 72, 14, 12, 'back', undefined, (p, r, t) => {
    const ph = (t % 900) / 900;
    if (ph < 0.75) p.px(116, 77 + Math.floor(ph * 6), '#9fd0ea');
    else p.px(115 + (ph > 0.88 ? 2 : 0), 82, '#cfe8f4');
    void r;
  }),
  pote_margarina: o(138, 73, 9, 8, 'back', (p) => {
    p.rect(140, 75, 6, 5, '#f2d45c');
    p.hl(140, 145, 75, '#fff27a');
    p.rect(140, 74, 6, 1, '#3a7ad0');
  }),
  passagem_rasgada: o(82, 76, 16, 7, 'back', (p) => {
    // a passagem rasgada debaixo das cascas de batata
    p.rect(84, 79, 5, 3, '#f4f0e6');
    p.rect(90, 78, 4, 3, '#e8e4d8');
    p.px(85, 80, '#2a5aa0');
    for (const [x, y] of [
      [86, 78],
      [89, 80],
      [93, 79],
      [95, 80],
    ] as [number, number][])
      p.px(x, y, '#c8a050');
  }),
  // em cima da mesa
  gazeta: o(144, 112, 22, 10, 'front', (p) => gazette(p, 145, 113, false)),
  gazeta_circulada: o(144, 112, 22, 10, 'front', (p) => gazette(p, 145, 113, true)),
  celular_extrato: o(175, 113, 10, 8, 'front', (p) => {
    p.rect(177, 114, 6, 5, '#1a1a1e');
    p.rect(178, 115, 4, 3, '#cfe8f4');
    p.hl(178, 181, 116, '#4fae5b');
  }),
  bolo_mel: o(150, 108, 18, 10, 'front', (p) => coveredPlate(p, 151, 110)),
  prato_coberto: o(150, 108, 18, 10, 'front', (p) => coveredPlate(p, 151, 110)),
  cartao_carla: o(134, 116, 11, 7, 'front', (p) => {
    p.rect(135, 119, 7, 3, '#f8f6ee');
    p.hl(136, 140, 120, '#2a3a6a');
  }),
  bolo_ambulancia: o(149, 102, 22, 15, 'front', (p) => birthdayCake(p, 149, 106, 'ambulancia')),
  bolo_pago: o(149, 102, 22, 15, 'front', (p) => birthdayCake(p, 149, 106, 'pago')),
  bolo_sirene: o(149, 102, 22, 15, 'front', (p) => birthdayCake(p, 149, 106, 'sirene'), (p, r, t) => {
    const on = Math.floor(t / 180) % 2 === 0;
    p.rect(159, 104, 2, 1, on ? '#e0302a' : '#3a5ad0');
    p.glow(160, 104, 9, on ? '#e0302a' : '#3a5ad0', 0.35, 3);
    void r;
  }),
  bolo_dois_andares: o(149, 98, 22, 19, 'front', (p) => birthdayCake(p, 149, 106, 'dois_andares')),
  // os baldes da goteira espalhados e o pano de chão
  baldes: o(240, 132, 44, 18, 'front', (p) => {
    bucket(p, 244, 136);
    bucket(p, 268, 138);
    p.poly(
      [
        [256, 146],
        [266, 144],
        [270, 148],
        [258, 150],
      ],
      '#d8d0c0',
    );
    p.ellipse(250, 148, 8, 1.6, '#5aa7d6', 0.45);
  }),
};

// -----------------------------------------------------------------------------
// SALA
// -----------------------------------------------------------------------------
export const SALA_EXTRA: Record<string, ObjDef> = {
  // a mesinha do telefone fixo, com o número do Nogueira a caneta na parede
  telefone_fixo: o(98, 66, 18, 34, 'back', (p) => {
    p.rect(101, 86, 12, 2, HOME.wood2);
    p.hl(101, 112, 86, HOME.tan);
    p.vl(102, 88, 99, HOME.wood);
    p.vl(111, 88, 99, HOME.wood);
    p.rect(103, 82, 8, 4, '#2a2a2e');
    p.rect(104, 80, 6, 2, '#3a3a40');
    p.px(106, 83, '#8a9098');
    p.line(110, 84, 113, 90, '#2a2a2e');
    drawText(p, '9-41', 100, 70, '#2a5aa0');
    p.hl(100, 114, 76, '#2a5aa0');
  }),
  cartela_remedio: o(220, 102, 10, 8, 'front', (p) => pillPack(p, 222, 104)),
  retalhos: o(138, 116, 34, 10, 'front', (p) => {
    for (const [x, y, w, c] of [
      [140, 119, 8, '#5f7fa8'],
      [146, 121, 7, '#e8a33d'],
      [154, 119, 9, '#c86a8a'],
      [161, 121, 6, '#4f8a6e'],
    ] as [number, number, number, string][]) {
      p.rect(x, y, w, 3, c);
      p.hl(x, x + w - 1, y, shade(c, 0.2));
    }
    tapeMeasure(p, 144, 124, 22);
  }),
  fita_metrica: o(248, 80, 46, 6, 'back', (p) => tapeMeasure(p, 252, 83, 34)),
  bacia_leite: o(186, 124, 20, 12, 'front', (p) => milkBasin(p, 187, 126)),
  terco: o(64, 62, 18, 8, 'back', (p) => rosary(p, 66, 64)),
  bilhete_sofa: o(116, 76, 10, 8, 'back', (p) => {
    note(p, 118, 78, 6, 5);
    p.hl(119, 122, 79, '#2a5aa0');
  }),
  panfleto_dengue: o(158, 116, 14, 10, 'front', (p) => {
    p.rect(160, 118, 10, 7, '#f4f0e6');
    p.rect(160, 118, 10, 2, '#4fae5b');
    p.px(164, 121, '#1b1a17');
    p.px(163, 122, '#1b1a17');
    p.px(165, 122, '#1b1a17');
    p.hl(161, 168, 124, '#8a948f');
  }),
  caderno_guardanapos: o(148, 114, 18, 11, 'front', (p) => napkinBook(p, 149, 116)),
  desenhos_molhados: o(124, 84, 64, 12, 'back', (p, r, has) => {
    const l = lv(has);
    wetDrawing(p, 128, 86, 12, 10, 'ambulancia', l, 4);
    wetDrawing(p, 146, 87, 12, 9, 'familia', l, 5);
    wetDrawing(p, 166, 86, 12, 10, 'casa', l, 6);
    void r;
  }),
  mala_azul: o(148, 126, 28, 16, 'front', (p) => suitcase(p, 150, 128, true)),
  desenho_um_dia: o(168, 115, 16, 13, 'front', (p, r, has) => liamDrawing(p, 170, 117, 13, 10, 'um_dia', lv(has), 8)),
  sofa_cama: o(118, 72, 84, 30, 'back', (p) => sofaBed(p)),
  tv_caixa: o(36, 82, 20, 20, 'back', (p) => tvBox(p, 37, 84)),
};
SALA_EXTRA.cartela_remedio.layer = 'front';

// -----------------------------------------------------------------------------
// QUARTO DO LIAM
// -----------------------------------------------------------------------------
/** o desenho do dia na parede sobre a escrivaninha (o lugar do desenho com raiva) */
const deskWall = (s: LiamSubject) => (p: Pix, r: Rect, has: Has) => {
  liamDrawing(p, 196, 59, 14, 12, s, lv(has), 9);
  void r;
};

export const QUARTO_EXTRA: Record<string, ObjDef> = {
  giz_cera: o(218, 76, 14, 8, 'back', (p) => crayonBox(p, 219, 77)),
  desenho_caido: o(58, 110, 16, 9, 'back', (p, r, has) => {
    liamDrawing(p, 60, 112, 12, 7, 'ambulancia', lv(has), 2);
    void r;
  }),
  garrafas_pet: o(62, 100, 28, 8, 'back', (p) => {
    petBottle(p, 64, 102);
    petBottle(p, 73, 103);
    petBottle(p, 82, 102);
  }),
  espacador: o(64, 86, 14, 8, 'back', (p) => {
    // o espaçador rachado, com a fita crepe
    p.rect(66, 88, 10, 4, '#d8eef4');
    p.hl(66, 75, 88, '#eef8fc');
    p.rect(70, 87, 3, 6, '#e8d8a0');
    p.line(68, 89, 71, 91, '#8a9aa8');
  }),
  capa_lencol: o(258, 70, 14, 26, 'back', (p, r, has) => sheetCape(p, 262, 74, has.has('capa_estrela'))),
  capa_estrela: o(258, 70, 14, 26, 'back'),
  caderno_redacao: o(192, 77, 16, 8, 'back', (p) => {
    p.rect(194, 79, 12, 5, '#f8f6ee');
    p.vl(200, 79, 83, '#c8c0b0');
    p.hl(195, 199, 80, '#2a5aa0');
    p.hl(195, 198, 82, '#8a948f');
    p.rect(194, 84, 12, 1, '#3a6ad0');
  }),
  desenho_jairo: o(194, 57, 18, 16, 'back', deskWall('jairo')),
  desenho_onibus: o(194, 57, 18, 16, 'back', deskWall('onibus')),
  desenho_moco_escada: o(194, 57, 18, 16, 'back', deskWall('moco_escada')),
  desenho_bene: o(194, 57, 18, 16, 'back', deskWall('bene')),
  desenho_secreto: o(194, 57, 18, 16, 'back', deskWall('secreto')),
  desenho_central: o(194, 57, 18, 16, 'back', deskWall('central')),
  redacao_travesseiro: o(20, 86, 14, 8, 'back', (p) => {
    p.rect(22, 89, 8, 4, '#f8f6ee');
    p.hl(23, 28, 90, '#2a5aa0');
  }),
  cracha_dengue: o(262, 70, 12, 18, 'back', (p) => dengueBadge(p, 263, 72)),
  mapa_guardanapo: o(194, 76, 18, 8, 'back', (p, r, has) => {
    // o Liam copiando o guardanapo-mapa do Bené: o guardanapo e a folha com as ruas
    p.rect(196, 80, 6, 4, '#fbf8f0');
    p.line(197, 83, 201, 80, '#2a5aa0');
    liamDrawing(p, 203, 78, 9, 6, 'cidade', lv(has), 4);
    void r;
  }),
  urso: o(16, 80, 14, 14, 'back', (p) => teddy(p, 18, 82)),
  camiseta_manga: o(198, 82, 16, 12, 'back', (p) => {
    p.rect(201, 84, 10, 6, '#3f6f9a');
    p.rect(199, 85, 3, 7, '#3f6f9a');
    p.rect(210, 85, 3, 7, '#3f6f9a');
    p.hl(201, 210, 84, '#5a8ab8');
  }),
  desenho_um_dia: o(18, 84, 16, 12, 'back', (p, r, has) => liamDrawing(p, 20, 86, 13, 9, 'um_dia', lv(has), 7)),
  cama_molhada: o(38, 88, 56, 12, 'back', (p) => {
    p.ellipse(64, 94, 22, 3, '#2a4a7a', 0.55);
    p.ellipse(60, 93, 12, 1.6, '#5a8ab8', 0.5);
    p.px(70, 92, '#9fd0ea');
    p.px(52, 95, '#9fd0ea');
  }),
  convite_mostra: o(212, 60, 14, 12, 'back', (p) => {
    p.rect(214, 62, 10, 8, '#f4f0e6');
    p.rect(214, 62, 10, 2, '#7a4aa8');
    p.hl(215, 222, 65, '#8a948f');
    p.hl(215, 220, 67, '#8a948f');
    p.px(219, 61, '#d94436');
  }),
};

// -----------------------------------------------------------------------------
// PORTA (fachada, portão)
// -----------------------------------------------------------------------------
export const PORTA_EXTRA: Record<string, ObjDef> = {
  // o aviso do DAE preso no portão com fita crepe
  aviso_portao: o(184, 134, 12, 14, 'back', (p) => {
    note(p, 186, 137, 9, 10, '#3a6aa8');
    p.rect(188, 136, 5, 1, '#e8d8a0');
  }),
  panfleto_portao: o(122, 136, 12, 12, 'back', (p) => {
    p.rect(124, 138, 7, 9, '#f2d45c');
    p.rect(124, 138, 7, 2, '#c8302a');
    p.hl(125, 129, 142, '#1b1a17');
    p.hl(125, 129, 144, '#1b1a17');
  }),
  notas_calcada: o(146, 158, 46, 12, 'back', (p) => bankNotes(p, 148, 161, 5)),
  calcada_varrida: o(236, 140, 62, 34, 'back', (p) => sweptWalk(p, 238, 152)),
  agua_meiofio: o(0, 168, 320, 12, 'back', (p) => {
    p.rect(0, 171, 320, 5, '#5a7a9a');
    p.hl(0, 319, 171, '#8ab0c8');
  }, (p, r, t) => {
    for (let i = 0; i < 18; i++) {
      const x = Math.floor((i * 37 + t / 22) % 330) - 5;
      p.hl(x, x + 5, 172 + (i % 3), '#c8e0ec');
    }
    void r;
  }),
};
PORTA_EXTRA.agua_meiofio.layer = 'front';

// -----------------------------------------------------------------------------
// Animação dos objetos que piscam (o anel da caixinha etc. já estão nos cômodos)
// -----------------------------------------------------------------------------
void candle;
void cornCake;
void ring;
void kidDrawing;
