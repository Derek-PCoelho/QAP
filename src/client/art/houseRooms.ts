// =============================================================================
// Casa explorável: os cômodos novos (quarto do casal, quintal, banheiro).
// Mesma vista 3/4 de "casa de bonecas", mesma paleta quente da casa (o
// Desgaste esfria tudo pelo setMap de quem desenha), mesmas faixas de palco
// (parede até WALL_Y = 100, pés do elenco entre 118 e 150) e as mesmas regras
// de leitura: o que conta a história do cômodo fica na faixa 40..156.
// Cada cômodo tem portas/saídas para os outros (HouseExit), lugares marcados
// para a família e o Ozzy, e objetos clicáveis desenhados aqui (OBJECTS de
// cada cômodo, com o retângulo que a UI usa para o clique).
// Hora do dia: 'noite' (padrão), 'dia' e 'madrugada' (o modo Bico).
// =============================================================================
import { Pix, hash2, bayerOn } from './pix';
import { HOME, mix, shade } from './palette';
import { drawText, textWidth } from './font';
import {
  type Rect,
  type SceneCast,
  type Has,
  type ObjDef,
  type Placement,
  type BgDef,
  type HouseExit,
  clampX,
  plaster,
  tileGrid,
  WALL_Y,
  FEET_FRONT,
  perspFloor,
  skirting,
  wallContact,
  bulbCone,
  roomDark,
  bareBulb,
  windowFrame,
  frontChair,
  dayRoomLight,
  dawnRoomLight,
  shadeAll,
  moonGrade,
  windowShaft,
  tod,
  genderOf,
  o,
} from './sceneKit';
import { floorShadow, badge, inhaler, cup, insulin, closedShoes, stainedSock, letter, fatEnvelope, ring, familyPhoto, bucket, postit, cardBox, sewingMachine } from './props';
import { liamDrawing } from './liamArt';

// -----------------------------------------------------------------------------
// Peças comuns
// -----------------------------------------------------------------------------
/** porta interna de madeira (vão + folha), topo em y, chão em WALL_Y; entreaberta mostra a luz do corredor */
function innerDoor(p: Pix, x: number, y: number, w: number, ajar: boolean): void {
  const h = WALL_Y - y;
  p.rect(x - 3, y - 3, w + 6, h + 3, HOME.wood);
  p.hl(x - 3, x + w + 2, y - 3, HOME.tan);
  p.vl(x - 3, y - 2, WALL_Y - 1, shade(HOME.wood, 0.15));
  if (ajar) {
    // corredor lá fora: luz quente da sala no fim
    const night = tod() !== 'dia';
    const dark = tod() === 'madrugada';
    p.rect(x, y, w, h, dark ? '#0a0806' : night ? '#2a1c12' : '#6a5440');
    p.rect(x + 2, y + 4, 5, h - 4, dark ? '#0e0c0a' : night ? '#a8763f' : '#c8a878');
    if (!dark) p.dith(x + 2, y + 4, 5, h - 4, night ? HOME.lamp : '#f0e0c0', 0.3);
    // a folha aberta para dentro, de quina
    p.poly(
      [
        [x + w - 6, y],
        [x + w + 1, y - 2],
        [x + w + 1, WALL_Y + 2],
        [x + w - 6, WALL_Y],
      ],
      HOME.wood2,
    );
    p.vl(x + w - 6, y, WALL_Y - 1, shade(HOME.wood2, 0.18));
    p.vl(x + w + 1, y - 2, WALL_Y + 2, HOME.wood);
    p.rect(x + w - 4, y + Math.floor(h / 2), 2, 2, '#d8b448');
  } else {
    p.rect(x, y, w, h, HOME.wood2);
    p.frame(x + 3, y + 4, w - 6, Math.floor(h / 2) - 6, HOME.wood);
    p.frame(x + 3, y + Math.floor(h / 2) + 1, w - 6, Math.floor(h / 2) - 5, HOME.wood);
    p.hl(x + 4, x + w - 4, y + 5, HOME.tan);
    p.rect(x + w - 5, y + Math.floor(h / 2) - 1, 2, 3, '#d8b448');
    p.vl(x, y, WALL_Y - 1, shade(HOME.wood2, 0.18));
  }
}

/** tapete de retalhos oval (anéis de tecido) */
function ragRug(p: Pix, cx: number, cy: number, rx: number, ry: number, cols: string[]): void {
  cols.forEach((c, i) => p.ellipse(cx, cy, rx - (i * rx) / (cols.length + 0.4), ry - (i * ry) / (cols.length + 0.4), c));
  for (let x = Math.floor(cx - rx + 3); x < cx + rx - 3; x += 3) p.px(x, Math.round(cy + Math.sin(x * 0.9) * (ry * 0.35)), '#efe6cf');
}

/** calendário de parede com a folha do mês; `circle` = dia circulado em vermelho */
function wallCalendar(p: Pix, x: number, y: number, circle: boolean): void {
  p.rect(x, y, 12, 16, '#f4f0e6');
  p.rect(x, y, 12, 4, '#3f5f8a');
  p.px(x + 3, y - 1, '#2a2a2a');
  p.px(x + 8, y - 1, '#2a2a2a');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) p.px(x + 2 + c * 3, y + 6 + r * 3, '#8a948f');
  p.hl(x, x + 11, y + 15, '#d8d0c0');
  if (circle) {
    p.ring(x + 5, y + 9, 2, '#d94436');
    p.px(x + 7, y + 7, '#d94436');
  }
}

// -----------------------------------------------------------------------------
// QUARTO DO CASAL
// Parede rosada com barrado de tinta a óleo e piso vermelhão. Da esquerda para
// a direita: a porta para a sala (entreaberta, a luz do corredor), o cabide de
// parede com o jaleco (e o crachá, quando há), a cômoda com o espelho e o
// porta-retrato do casamento, o criado-mudo com o abajur, a cama de casal
// encostada na parede com a colcha de fuxico, a mesinha do outro lado
// (celular, despertador, guardanapo do Bené), a janela para o quintal e a
// cadeira com roupa. O lustre de vidro no meio do teto.
// -----------------------------------------------------------------------------
/** cama de casal: cabeceira e pé, borda de trás e da frente do colchão, chão */
export const CASAL_BED = { x0: 132, x1: 234, back: 90, front: 106, floor: 119 };
const CASAL_LAMP = { x: 122, y: 74 };
const CASAL_WIN: Rect = { x: 264, y: 42, w: 38, h: 28 };
const CASAL_CHAIR = { x: 294, floor: 140 };

/** colcha de fuxico: florzinhas de tecido franzidas (3×3) de muitas cores, num forro creme */
function fuxicoQuilt(p: Pix, x0: number, x1: number, y0: number, y1: number, hem: number): void {
  const cols = ['#c8413a', '#3f6f9a', '#e8b931', '#5f8a4a', '#d86a8a', '#e8dcc4', '#a8582e', '#7a5a9a'];
  p.rect(x0, y0, x1 - x0, y1 - y0, '#e4d8bc');
  p.rect(x0, y1, x1 - x0, hem, '#cbbc9c');
  let row = 0;
  for (let y = y0 + 1; y < y1 + hem - 2; y += 3, row++) {
    const side = y >= y1;
    for (let x = x0 + (row % 2) * 3; x < x1 - 4; x += 6) {
      const c0 = cols[Math.floor(hash2(x, y, 71) * cols.length)];
      const c = side ? shade(c0, -0.22) : c0;
      const d = shade(c, -0.25);
      // florzinha de tecido: 4×3 de cantos cortados, a luz em cima e o franzido escuro no meio
      p.hl(x + 1, x + 2, y, shade(c, 0.18));
      p.hl(x, x + 3, y + 1, c);
      p.hl(x + 1, x + 2, y + 2, d);
      p.px(x + 1, y + 1, shade(c, -0.45));
      p.px(x + 2, y + 1, d);
    }
  }
  // barra recortada em ondinhas
  for (let x = x0; x < x1; x++) if (x % 4 === 0) p.px(x, y1 + hem, '#a89878');
  p.hl(x0, x1 - 1, y0, '#efe6cf');
}

function casalBack(p: Pix, has: Has): void {
  const g = genderOf(has);
  const day = tod() === 'dia';
  // parede rosada (reboco) com barrado de tinta a óleo terracota até meia altura
  const wall = '#cfa088';
  const barra = '#a86a56';
  plaster(p, 0, 0, 320, 74, wall, shade(wall, -0.06), 81);
  for (let y = 10; y < 70; y += 12) for (let x = 6 + ((y / 12) % 2) * 9; x < 320; x += 18) p.px(x, y, shade(wall, 0.1));
  p.rect(0, 0, 320, 4, shade(wall, -0.22));
  p.dith(0, 4, 320, 4, shade(wall, -0.22), 0.5);
  plaster(p, 0, 74, 320, WALL_Y - 74, barra, shade(barra, -0.08), 83, 0.04);
  p.hl(0, 319, 74, shade(barra, 0.3));
  p.hl(0, 319, 75, shade(barra, -0.25));
  skirting(p);
  // piso vermelhão em perspectiva, com o brilho da cera
  perspFloor(p, WALL_Y, 180, '#8a3c2c', '#783222', { step: 32, first: 7, speck: '#a24c38', seed: 29 });
  // tapete de retalhos na frente da cama
  ragRug(p, 186, 131, 40, 8, ['#3f5f8a', '#e8c46a', '#a8413a', '#e8dcc4']);

  // porta para a sala (entreaberta)
  innerDoor(p, 10, 52, 22, true);

  // cabide de parede com o jaleco (o crachá, quando há, é um objeto)
  const hx = 42;
  p.rect(hx, 55, 20, 3, HOME.wood2);
  p.hl(hx, hx + 19, 55, HOME.tan);
  for (const px of [hx + 3, hx + 10, hx + 16]) {
    p.px(px, 58, HOME.wood);
    p.px(px, 59, '#d8b448');
  }
  whiteCoat(p, hx + 2, 59, has.has('jaleco_postit'), has.has('bilhete_jaleco'));

  // espelho oval sobre a cômoda, com o reflexo da janela
  const mx = 87;
  p.ellipse(mx, 54, 14, 15, HOME.wood);
  p.ellipse(mx, 54, 12, 13, '#a8b8c0');
  p.ellipse(mx - 3, 50, 7, 7, '#c4d4d8');
  p.line(mx - 7, 46, mx - 1, 40, '#e4eef0');
  p.line(mx - 5, 50, mx + 1, 44, '#e4eef0');
  p.rect(mx - 1, 39, 3, 2, '#d8b448');
  // cômoda de três gavetas
  const cx = 62;
  const cw = 50;
  p.rect(cx, 78, cw, 3, HOME.wood2);
  p.hl(cx, cx + cw - 1, 78, HOME.tan);
  p.rect(cx + 1, 81, cw - 2, 18, HOME.wood);
  const drawerOpen = has.has('envelope_gaveta');
  for (let i = 0; i < 3; i++) {
    const dy = 82 + i * 6;
    if (i === 0 && drawerOpen) continue;
    p.rect(cx + 2, dy, cw - 4, 5, HOME.wood2);
    p.hl(cx + 2, cx + cw - 3, dy, shade(HOME.wood2, 0.15));
    p.rect(cx + cw / 2 - 3, dy + 2, 6, 1, '#d8b448');
  }
  p.vl(cx + cw - 1, 81, 99, HOME.bg2);
  wallContact(p, cx, cw);
  // em cima da cômoda: o porta-retrato do casamento, o vidro de perfume e a toalhinha de crochê
  p.rect(cx + 3, 77, 30, 1, '#f0e8d8');
  for (let x = cx + 3; x < cx + 33; x += 2) p.px(x, 78, '#f0e8d8');
  weddingPhoto(p, cx + 4, 63, g);
  p.rect(cx + 22, 71, 4, 6, '#e8a8b8');
  p.rect(cx + 23, 69, 2, 2, '#d8b448');
  p.px(cx + 23, 72, '#fff0f4');
  p.rect(cx + 28, 73, 5, 4, '#f4f0e6');
  p.hl(cx + 28, cx + 32, 73, '#ffffff');

  // crucifixo de madeira sobre a cama
  const kx = 184;
  p.rect(kx - 1, 52, 3, 15, HOME.wood);
  p.rect(kx - 5, 56, 11, 3, HOME.wood);
  p.px(kx, 52, HOME.tan);
  p.px(kx - 5, 56, HOME.tan);
  p.px(kx, 60, '#d8b448');
  // ramo de palha benta atrás da cruz
  p.line(kx + 2, 64, kx + 8, 50, '#c8a050');
  p.line(kx + 3, 64, kx + 9, 52, '#a8803a');

  // criado-mudo com o abajur
  const nx = 112;
  p.rect(nx, 86, 18, 3, HOME.wood2);
  p.hl(nx, nx + 17, 86, HOME.tan);
  p.rect(nx + 1, 89, 16, 10, HOME.wood);
  p.hl(nx + 2, nx + 15, 93, HOME.wood2);
  p.px(nx + 8, 91, '#d8b448');
  wallContact(p, nx, 18);
  p.rect(CASAL_LAMP.x - 1, 80, 3, 6, '#c8c0b0');
  p.rect(CASAL_LAMP.x - 3, 85, 7, 1, '#a8a090');
  p.poly(
    [
      [CASAL_LAMP.x - 6, 80],
      [CASAL_LAMP.x + 6, 80],
      [CASAL_LAMP.x + 4, 72],
      [CASAL_LAMP.x - 4, 72],
    ],
    tod() === 'noite' ? '#f2d08a' : '#d8c8a8',
  );
  p.hl(CASAL_LAMP.x - 4, CASAL_LAMP.x + 4, 72, tod() === 'noite' ? '#fff0c0' : '#e8dcc0');
  // franjinha da cúpula
  for (let x = CASAL_LAMP.x - 6; x <= CASAL_LAMP.x + 6; x += 2) p.px(x, 81, '#c8a050');

  // cama de casal encostada na parede (cabeceira à esquerda)
  const B = CASAL_BED;
  floorShadow(p, (B.x0 + B.x1) / 2, B.floor + 1, (B.x1 - B.x0) / 2 + 3, 2.4, 0.4);
  // estrado/lateral de madeira
  p.rect(B.x0 + 4, B.front + 7, B.x1 - B.x0 - 6, B.floor - B.front - 7, HOME.wood2);
  p.hl(B.x0 + 4, B.x1 - 3, B.front + 7, HOME.tan);
  p.hl(B.x0 + 4, B.x1 - 3, B.floor - 1, HOME.wood);
  // travesseiros (o de trás e o da frente) e a colcha de fuxico
  const made = !has.has('cama_desfeita');
  fuxicoQuilt(p, B.x0 + 24, B.x1 - 2, B.back + 1, B.front, 7);
  p.rect(B.x0 + 4, B.back + 1, 20, B.front - B.back, '#efe9dc');
  p.rect(B.x0 + 4, B.front, 20, 7, '#d8d0c0');
  for (const [py, ph] of [
    [B.back + 1, 6],
    [B.back + 8, 6],
  ] as [number, number][]) {
    p.rect(B.x0 + 7, py, 15, ph, '#f8f4ea');
    p.hl(B.x0 + 7, B.x0 + 21, py + ph - 1, '#d8d0c0');
    p.px(B.x0 + 7, py, '#efe9dc');
    p.px(B.x0 + 21, py, '#efe9dc');
  }
  if (!made) {
    // colcha puxada, o lençol à mostra
    p.rect(B.x0 + 24, B.back + 1, 26, B.front - B.back - 1, '#efe9dc');
    p.line(B.x0 + 50, B.back + 1, B.x0 + 44, B.front, '#c8b898');
  }
  // cabeceira alta de madeira torneada e o pé mais baixo
  p.rect(B.x0, B.back - 24, 6, B.floor - B.back + 24, HOME.wood);
  p.hl(B.x0, B.x0 + 5, B.back - 24, HOME.tan);
  p.disc(B.x0 + 3, B.back - 26, 2, HOME.wood2);
  p.vl(B.x0 + 1, B.back - 23, B.floor - 1, shade(HOME.wood, 0.18));
  p.rect(B.x1 - 4, B.back - 8, 5, B.floor - B.back + 8, HOME.wood);
  p.hl(B.x1 - 4, B.x1, B.back - 8, HOME.tan);
  p.disc(B.x1 - 2, B.back - 10, 1.6, HOME.wood2);

  // mesinha do outro lado (o despertador sempre; o resto são objetos)
  const tx = 238;
  p.rect(tx, 86, 18, 3, HOME.wood2);
  p.hl(tx, tx + 17, 86, HOME.tan);
  p.vl(tx + 1, 89, 99, HOME.wood);
  p.vl(tx + 16, 89, 99, HOME.wood);
  p.hl(tx + 1, tx + 16, 94, HOME.wood);
  wallContact(p, tx, 18);
  if (!has.has('despertador')) alarmClock(p, tx + 11, 80, false);

  // calendário na parede, sobre a mesinha
  wallCalendar(p, 241, 58, has.has('calendario_maquina'));

  // janela para o quintal, com cortina de renda
  quintalPane(p, CASAL_WIN.x, CASAL_WIN.y, CASAL_WIN.w, CASAL_WIN.h, 13);
  windowFrame(p, CASAL_WIN.x, CASAL_WIN.y, CASAL_WIN.w, CASAL_WIN.h);
  for (const [x0, x1] of [
    [CASAL_WIN.x - 4, CASAL_WIN.x + 6],
    [CASAL_WIN.x + CASAL_WIN.w - 6, CASAL_WIN.x + CASAL_WIN.w + 4],
  ] as [number, number][])
    for (let x = x0; x < x1; x++)
      for (let y = CASAL_WIN.y - 4; y < CASAL_WIN.y + CASAL_WIN.h + 2; y++) if ((x + y) % 3 !== 0 || y === CASAL_WIN.y - 4) p.px(x, y, (x + y) % 2 ? '#f4efe2' : '#e4dccc');
  p.hl(CASAL_WIN.x - 6, CASAL_WIN.x + CASAL_WIN.w + 5, CASAL_WIN.y - 5, '#8a8478');

  // lustre de vidro no meio do teto (ou a lâmpada pelada, depois que o Valdemar levou o lustre)
  if (has.has('lampada_nua')) bareBulb(p, 184, 30);
  else globeLamp(p, 184, 24);
  void day;
}

/** lustre de globo de vidro leitoso (aceso só à noite) */
function globeLamp(p: Pix, x: number, y: number): void {
  const on = tod() === 'noite';
  p.vl(x, 0, y - 4, '#1e1610');
  p.rect(x - 2, y - 4, 5, 2, '#8a7448');
  p.hl(x - 2, x + 2, y - 4, '#c8a858');
  p.ellipse(x, y + 1, 5, 4, on ? '#ffe8b0' : '#e0dccc');
  p.ellipse(x - 1, y, 3, 2.4, on ? '#fff8e0' : '#f0ece0');
  p.px(x - 2, y - 1, '#ffffff');
  p.hl(x - 3, x + 3, y + 4, on ? '#f2c46b' : '#b8b4a4');
}

/** jaleco branco pendurado no gancho (14×34), com o bolso e a caneta; post-it nas costas / bilhete no bolso */
function whiteCoat(p: Pix, x: number, y: number, postitBack: boolean, note: boolean): void {
  const c = '#eef0ea';
  const s = '#c8ccc4';
  const d = '#a8aca4';
  // ombros e corpo que alarga para baixo
  for (let yy = 0; yy < 34; yy++) {
    const half = Math.min(7, 4 + yy * 0.5);
    const x0 = Math.round(x + 7 - half);
    const x1 = Math.round(x + 7 + half);
    p.hl(x0, x1, y + yy, c);
    p.px(x1, y + yy, s);
    if (yy > 3) p.px(x0, y + yy, '#f8faf6');
  }
  // gola e lapelas
  p.line(x + 7, y + 1, x + 5, y + 10, d);
  p.line(x + 7, y + 1, x + 9, y + 10, d);
  p.vl(x + 7, y + 10, y + 33, s);
  // mangas caindo dos lados
  p.vl(x + 1, y + 6, y + 26, s);
  p.vl(x + 13, y + 6, y + 26, d);
  // bolso com a caneta azul
  p.frame(x + 9, y + 18, 4, 4, s);
  p.vl(x + 10, y + 16, y + 19, '#2a5aa0');
  p.px(x + 10, y + 15, '#e6efd9');
  // barra e dobra
  p.hl(x, x + 14, y + 33, d);
  p.px(x + 7, y, '#5a4a3a');
  if (postitBack) {
    // o post-it amarelo da Simone grudado nas costas (aparece de viés pela gola)
    p.rect(x + 2, y + 12, 5, 5, '#f2d45c');
    p.hl(x + 3, x + 6, y + 14, '#8a7a2a');
    p.px(x + 6, y + 12, '#d8b840');
  }
  if (note) {
    // o bilhete das 22:07 aparecendo no bolso
    p.rect(x + 9, y + 16, 3, 3, '#f4f0e6');
    p.px(x + 11, y + 16, '#c8c0b0');
  }
}

/** porta-retrato do casamento (18×14): o protagonista e o cônjuge, a moça/o moço da festa */
function weddingPhoto(p: Pix, x: number, y: number, g: 'M' | 'F'): void {
  p.rect(x, y, 16, 14, '#d8b448');
  p.frame(x, y, 16, 14, '#a8802a');
  p.hl(x, x + 15, y, '#f2d06a');
  p.rect(x + 2, y + 2, 12, 10, '#e8dcc4');
  p.rect(x + 2, y + 9, 12, 3, '#c8b8a0');
  // noivo e noiva: quem é quem muda com o gênero do protagonista (o cabelo do Alex / da Lúcia)
  const you = { skin: '#d9a57e', hair: '#1c1410' };
  const spouse = g === 'M' ? { skin: '#f3d3b5', hair: '#1c1410' } : { skin: '#f1c7a5', hair: '#1c1410' };
  const bride = g === 'M' ? spouse : you;
  const groom = g === 'M' ? you : spouse;
  // noivo (terno escuro) à esquerda
  p.px(x + 5, y + 3, groom.hair);
  p.px(x + 6, y + 3, groom.hair);
  p.px(x + 5, y + 4, groom.skin);
  p.px(x + 6, y + 4, groom.skin);
  p.rect(x + 4, y + 5, 4, 7, '#2a2a34');
  p.px(x + 5, y + 5, '#ffffff');
  // noiva (vestido branco e véu) à direita
  p.px(x + 9, y + 3, bride.hair);
  p.px(x + 10, y + 3, bride.hair);
  p.px(x + 9, y + 4, bride.skin);
  p.px(x + 10, y + 4, bride.skin);
  p.px(x + 11, y + 3, '#ffffff');
  p.px(x + 11, y + 4, '#f4f4ee');
  p.rect(x + 8, y + 5, 5, 7, '#fbfbf6');
  p.px(x + 12, y + 11, '#e8e8e0');
  p.px(x + 8, y + 7, '#d94436');
  p.px(x + 8, y + 8, '#4fae5b');
  // pezinho
  p.px(x + 13, y + 14, '#a8802a');
}

/** despertador de ponteiro com dois sininhos (9×9), x = centro; `ringing` = treme */
function alarmClock(p: Pix, cx: number, y: number, ringing: boolean): void {
  const dx = ringing ? 1 : 0;
  p.disc(cx - 3 + dx, y + 1, 1.5, '#d8b448');
  p.disc(cx + 3 + dx, y + 1, 1.5, '#d8b448');
  p.disc(cx + dx, y + 4, 4, '#c8302a');
  p.disc(cx + dx, y + 4, 3, '#f4f0e6');
  p.vl(cx + dx, y + 2, y + 4, '#1b1a17');
  p.hl(cx + dx, cx + 2 + dx, y + 4, '#1b1a17');
  p.px(cx - 3 + dx, y + 8, '#8a2018');
  p.px(cx + 3 + dx, y + 8, '#8a2018');
}

/** vista do quintal pela janela: varal, muro, o pé de limão e o céu (noite/madrugada/dia) */
function quintalPane(p: Pix, x: number, y: number, w: number, h: number, seed: number): void {
  const t = tod();
  if (t === 'dia') p.vgrad(x, y, w, h, ['#78a8d8', '#a8c8e4', '#d0e0ea'], 0.7);
  else p.vgrad(x, y, w, h, ['#121a30', '#1c2844', '#2a3654'], 0.7);
  if (t !== 'dia') for (let i = 0; i < 6; i++) p.px(x + 2 + Math.floor(hash2(i, x, seed) * (w - 4)), y + 1 + Math.floor(hash2(i, y, seed + 1) * 9), '#c8d4f0');
  else p.ellipse(x + 10, y + 5, 5, 1.5, '#ffffff');
  const leaf = t === 'dia' ? '#5f8a4a' : '#1e2c22';
  const leaf2 = t === 'dia' ? '#7aa65a' : '#283a2c';
  // muro do fundo
  p.rect(x, y + h - 9, w, 9, t === 'dia' ? '#b8b0a0' : '#1a2028');
  p.hl(x, x + w - 1, y + h - 9, t === 'dia' ? '#d8d0c0' : '#242c36');
  // pé de limão
  p.disc(x + w - 9, y + h - 14, 9, leaf);
  p.disc(x + w - 14, y + h - 10, 6, leaf2);
  p.rect(x + w - 10, y + h - 6, 2, 6, t === 'dia' ? '#6a4a2a' : '#1a140e');
  for (const [lx, ly] of [
    [-12, -16],
    [-6, -12],
    [-9, -8],
  ] as [number, number][])
    p.px(x + w + lx, y + h + ly, t === 'dia' ? '#f2d43a' : '#6a6a30');
  // varal
  p.line(x, y + 8, x + w - 1, y + 10, t === 'dia' ? '#6a7080' : '#3a4050');
  p.rect(x + 5, y + 9, 5, 5, t === 'dia' ? '#e8e0d0' : '#4a4e5a');
  p.rect(x + 13, y + 9, 4, 6, t === 'dia' ? '#3f6f9a' : '#2a3448');
}

function casalFront(p: Pix, has: Has): void {
  // cadeira com a roupa do dia empilhada (a roupa some quando alguém senta: ver casalSeats)
  void has;
  void p;
}

function casalPlace(c: SceneCast): Placement {
  const B = CASAL_BED;
  const x = clampX(c.x, 24, 300);
  if (c.pose === 'deitado') {
    // na cama, cabeça no travesseiro da esquerda: quem está mais à direita deita na frente
    const fr = x >= 186;
    const kid = c.id === 'DAVI';
    return { x: B.x0 + 5 + (kid ? 13 : 16), bottom: kid ? B.back + 12 : fr ? B.front - 1 : B.back + 6, layer: 'back', blanket: fr ? '#a8413a' : '#3f5f8a', seat: fr ? 'cama_frente' : kid ? 'cama_meio' : 'cama_fundo' };
  }
  if (c.pose === 'sentado') {
    // na beira da cama, ou na cadeira da janela
    if (x >= 262) return { x: CASAL_CHAIR.x, bottom: CASAL_CHAIR.floor - 2, layer: 'top', chair: true, seat: 'cadeira' };
    return { x: clampX(x, 152, 222), bottom: B.front + 9, layer: 'back' };
  }
  // em pé: na frente da cômoda, no tapete ou perto da janela
  if (x < 120) return { x: clampX(x, 44, 108), bottom: FEET_FRONT - 4, layer: 'top' };
  if (x <= 240) return { x: clampX(x, 150, 228), bottom: 136, layer: 'top' };
  return { x: clampX(x, 252, 286), bottom: 128, layer: 'back' };
}

/** a cadeira da janela: vazia, com a roupa empilhada; ocupada, a roupa vai para o colo de quem senta (some) */
function casalSeats(p: Pix, has: Has, occ: Set<string>): void {
  frontChair(p, CASAL_CHAIR.x, CASAL_CHAIR.floor);
  if (!occ.has('cadeira')) {
    const x = CASAL_CHAIR.x - 8;
    const y = CASAL_CHAIR.floor - 10;
    p.rect(x, y, 16, 3, '#3f5f8a');
    p.rect(x + 2, y - 2, 12, 2, '#e8dcc4');
    p.rect(x + 1, y + 3, 6, 4, '#3f5f8a');
    p.rect(x + 9, y - 3, 6, 2, '#4f8a6e');
    p.hl(x, x + 15, y, shade('#3f5f8a', 0.25));
  }
  void has;
}

function casalAnim(p: Pix, has: Has, t: number): void {
  // telefone tocando na mesinha (o filho do Nogueira, às 21h): treme e acende
  if (has.has('telefone_tocando')) {
    const ring = Math.floor(t / 120) % 2 === 0 && t % 1800 < 1100;
    const x = 241 + (ring ? 1 : 0);
    p.rect(x, 82, 9, 4, '#2a2a2e');
    p.rect(x + 1, 80, 7, 2, '#3a3a40');
    p.px(x + 7, 83, ring ? '#e8a33d' : '#5a3a14');
    if (ring) {
      p.glow(x + 7, 83, 10, '#e8a33d', 0.3, 3);
      p.line(x - 3, 79, x - 1, 81, '#e8e4dc');
      p.line(x + 11, 79, x + 9, 81, '#e8e4dc');
    }
  }
  // celular em cima da cama com as chamadas perdidas (pisca)
  if (has.has('telefone_cama') && Math.floor(t / 700) % 2 === 0) p.px(185, 99, '#7fd17a');
}

function casalLight(p: Pix, front: boolean): void {
  // abajur quente à esquerda e o lustre no meio
  p.glow(CASAL_LAMP.x, CASAL_LAMP.y + 4, 110, HOME.lampLight, 0.28, 5, 1, front);
  bulbCone(p, 184, 26, 126, 46, front);
  roomDark(p, 168, 70, 205, 125, HOME.bg0, 0.6, front, 0.44, 3, 116, 82);
}

function casalLightDia(p: Pix, front: boolean): void {
  dayRoomLight(p, front, [CASAL_WIN]);
}

function casalLightMadrugada(p: Pix, front: boolean): void {
  dawnRoomLight(p, front, [CASAL_WIN]);
}

const CASAL_OBJECTS: Record<string, ObjDef> = {
  // o crachá novo no cabide, por cima do jaleco
  cracha: o(50, 58, 12, 21, 'back', (p, r) => badge(p, r.x, r.y)),
  jaleco: o(42, 56, 18, 38, 'back'),
  jaleco_postit: o(42, 56, 18, 38, 'back'),
  bilhete_jaleco: o(50, 72, 8, 8, 'back'),
  // em cima da cômoda
  foto_casamento: o(65, 62, 18, 16, 'back'),
  caixa_costura: o(91, 70, 16, 9, 'back', (p, r, has) => biscuitTin(p, r.x + 1, r.y + 1, has.has('caixa_pesada'))),
  caixa_pesada: o(91, 70, 16, 9, 'back'),
  receita_sus: o(97, 73, 12, 6, 'back', (p, r) => prescription(p, r.x + 1, r.y + 1)),
  cartao_jairo: o(98, 74, 9, 5, 'back', (p, r) => {
    p.rect(r.x + 1, r.y + 1, 7, 4, '#f8f6ee');
    p.hl(r.x + 2, r.x + 6, r.y + 2, '#3a7ad0');
    p.px(r.x + 6, r.y + 4, '#d94436');
  }),
  anuncio_textil: o(84, 72, 12, 7, 'back', (p, r) => {
    p.rect(r.x + 1, r.y + 1, 10, 6, '#efe6cf');
    p.rect(r.x + 2, r.y + 2, 8, 1, '#1b1a17');
    p.hl(r.x + 2, r.x + 8, r.y + 4, '#8a8478');
    p.hl(r.x + 2, r.x + 7, r.y + 5, '#8a8478');
  }),
  foto_pais_onibus: o(62, 60, 14, 18, 'back', (p, r) => parentsBusPhoto(p, r.x, r.y)),
  cartao_marcia: o(97, 46, 9, 8, 'back', (p, r) => {
    p.rect(r.x + 1, r.y + 1, 7, 6, '#f2a0b8');
    p.px(r.x + 3, r.y + 3, '#d94436');
    p.px(r.x + 4, r.y + 3, '#d94436');
    p.px(r.x + 3, r.y + 4, '#d94436');
    p.hl(r.x + 2, r.x + 6, r.y + 6, '#c86a8a');
  }),
  // a gaveta de cima aberta, com o envelope gordo dentro
  envelope_gaveta: o(63, 80, 48, 10, 'back', (p, r) => {
    p.rect(r.x + 1, r.y + 1, 46, 2, '#2a1a10');
    p.rect(r.x + 1, r.y + 3, 46, 5, HOME.wood2);
    p.hl(r.x + 1, r.x + 46, r.y + 3, shade(HOME.wood2, 0.15));
    p.rect(r.x + 21, r.y + 5, 6, 1, '#d8b448');
    fatEnvelope(p, r.x + 14, r.y - 4);
  }),
  // na cama
  telefone_cama: o(180, 96, 10, 7, 'back', (p, r) => {
    p.rect(r.x + 1, r.y + 1, 8, 5, '#1a1a1e');
    p.rect(r.x + 2, r.y + 2, 6, 3, '#3a5a7a');
    p.px(r.x + 3, r.y + 3, '#d94436');
    p.px(r.x + 5, r.y + 3, '#d94436');
  }),
  caixinha_veludo: o(138, 87, 9, 7, 'back', (p, r, has) => velvetBox(p, r.x + 1, r.y + 1, has.has('caixinha_vazia') ? 'vazia' : has.has('alianca') ? 'alianca' : 'fechada')),
  caixinha_vazia: o(138, 87, 9, 7, 'back'),
  alianca: o(138, 87, 9, 7, 'back', undefined, (p, r, t, has) => {
    if (has.has('caixinha_veludo') && !has.has('caixinha_vazia') && Math.floor(t / 600) % 3 === 0) p.px(r.x + 5, r.y, '#ffffff');
    else if (!has.has('caixinha_veludo')) ring(p, r.x + 2, r.y + 3, t);
  }),
  cama_desfeita: o(156, 90, 50, 16, 'back'),
  // na mesinha
  despertador: o(244, 78, 11, 10, 'back', undefined, (p, r, t, has) => alarmClock(p, r.x + 5, r.y + 2, has.has('despertador_tocando') && Math.floor(t / 90) % 2 === 0)),
  despertador_tocando: o(244, 78, 11, 10, 'back'),
  celular_carregando: o(238, 80, 9, 8, 'back', (p, r) => {
    p.rect(r.x + 1, r.y + 2, 4, 6, '#1a1a1e');
    p.rect(r.x + 2, r.y + 3, 2, 4, '#3a5a7a');
    p.line(r.x + 3, r.y + 8, r.x + 7, r.y + 14, '#e8e4dc');
  }, (p, r, t) => {
    if (Math.floor(t / 900) % 2 === 0) p.px(r.x + 3, r.y + 4, '#7fd17a');
  }),
  celular_desligado: o(238, 80, 9, 8, 'back', (p, r) => {
    p.rect(r.x + 1, r.y + 2, 4, 6, '#1a1a1e');
    p.rect(r.x + 2, r.y + 3, 2, 4, '#141418');
  }),
  guardanapo_mapa: o(247, 82, 9, 5, 'back', (p, r) => napkinMap(p, r.x + 1, r.y + 1)),
  telefone_tocando: o(239, 78, 13, 9, 'back'),
  calendario_maquina: o(240, 57, 14, 18, 'back'),
  lampada_nua: o(178, 20, 13, 16, 'back'),
  // no chão
  sapato_fechado: o(286, 141, 16, 7, 'front', (p, r) => closedShoes(p, r.x + 1, r.y + 1)),
  meia_mancha: o(100, 136, 11, 8, 'back', (p, r) => stainedSock(p, r.x + 1, r.y + 1)),
  carta: o(136, 96, 11, 8, 'back', (p, r) => letter(p, r.x + 1, r.y + 1)),
  envelope: o(196, 94, 16, 10, 'back', (p, r) => fatEnvelope(p, r.x, r.y)),
  bombinha: o(146, 98, 17, 9, 'back', (p, r) => inhaler(p, r.x + 1, r.y + 1)),
  xicara: o(114, 78, 9, 8, 'back', (p, r) => cup(p, r.x, r.y)),
  insulina: o(240, 80, 16, 9, 'back', (p, r) => insulin(p, r.x, r.y)),
};
// sapato: camada da frente
CASAL_OBJECTS.sapato_fechado.layer = 'front';

/** lata de biscoito redonda que virou caixa de costura (14×7); `heavy` = estufada, a tampa não fecha */
function biscuitTin(p: Pix, x: number, y: number, heavy: boolean): void {
  p.ellipse(x + 7, y + 6, 7, 1.8, '#1f3a6a');
  p.rect(x, y + 2, 14, 4, '#2f5a9a');
  p.hl(x, x + 13, y + 3, '#d8b448');
  p.ellipse(x + 7, y + 2 - (heavy ? 1 : 0), 7, 1.8, '#4a7ac0');
  p.ellipse(x + 7, y + 2 - (heavy ? 1 : 0), 4, 1, '#e8566a');
  if (heavy) {
    p.px(x + 2, y + 2, '#efe6cf');
    p.px(x + 11, y + 1, '#c8302a');
  }
}

/** receita médica (folha dobrada, 10×5) */
function prescription(p: Pix, x: number, y: number): void {
  p.rect(x, y, 10, 5, '#f8f6ee');
  p.hl(x + 1, x + 6, y + 1, '#2a5aa0');
  p.hl(x + 1, x + 8, y + 3, '#8a948f');
  p.px(x + 9, y, '#d8d0c0');
}

/** caixinha de veludo vermelho (7×5): fechada, com a aliança ou vazia */
function velvetBox(p: Pix, x: number, y: number, st: 'fechada' | 'alianca' | 'vazia'): void {
  if (st === 'fechada') {
    p.rect(x, y + 1, 7, 4, '#8a1a24');
    p.hl(x, x + 6, y + 1, '#c8303a');
    p.hl(x, x + 6, y + 3, '#5a0e16');
    return;
  }
  // aberta: a tampa para trás, o forro de cetim
  p.rect(x, y - 1, 7, 2, '#8a1a24');
  p.rect(x, y + 1, 7, 4, '#a8202c');
  p.rect(x + 1, y + 2, 5, 2, '#f0e8e0');
  if (st === 'alianca') {
    p.px(x + 3, y + 2, '#e8b931');
    p.px(x + 2, y + 3, '#c89a2a');
    p.px(x + 4, y + 3, '#c89a2a');
  } else p.px(x + 3, y + 3, '#d8ccc4');
}

/** guardanapo de papel com o mapa da Rua das Acácias desenhado a caneta (8×4) */
function napkinMap(p: Pix, x: number, y: number): void {
  p.rect(x, y, 8, 4, '#f8f6ee');
  p.line(x + 1, y + 3, x + 6, y, '#2a5aa0');
  p.hl(x + 1, x + 7, y + 2, '#2a5aa0');
  p.px(x + 5, y + 1, '#d94436');
}

/** foto antiga do casamento dos pais do protagonista (12×16): de terno grande e renda, num corredor de ônibus */
function parentsBusPhoto(p: Pix, x: number, y: number): void {
  p.rect(x, y, 12, 16, '#e8e0cc');
  p.frame(x, y, 12, 16, '#8a7a5a');
  // sépia: o corredor do ônibus com as janelas
  p.rect(x + 1, y + 1, 10, 14, '#c8b48a');
  for (let i = 0; i < 3; i++) p.rect(x + 1, y + 2 + i * 4, 2, 3, '#e8dcb8');
  for (let i = 0; i < 3; i++) p.rect(x + 9, y + 2 + i * 4, 2, 3, '#e8dcb8');
  p.hl(x + 3, x + 8, y + 2, '#8a7a5a');
  // ele magrelo de terno, ela de renda
  p.px(x + 4, y + 5, '#3a2a1a');
  p.px(x + 4, y + 6, '#d8b890');
  p.rect(x + 3, y + 7, 3, 7, '#4a3a2a');
  p.px(x + 7, y + 5, '#3a2a1a');
  p.px(x + 7, y + 6, '#d8b890');
  p.rect(x + 6, y + 7, 3, 7, '#f4ecd8');
  p.px(x + 6, y + 9, '#c8b890');
}

const CASAL_EXITS: HouseExit[] = [{ to: 'sala', label: 'Sala', r: { x: 8, y: 50, w: 26, h: 50 }, arrow: 'U' }];

export const QUARTO_CASAL: BgDef = {
  warm: true,
  back: casalBack,
  front: casalFront,
  light: casalLight,
  lightDia: casalLightDia,
  lightMadrugada: casalLightMadrugada,
  anim: casalAnim,
  place: casalPlace,
  seats: casalSeats,
  // o cônjuge na beira da cama, você perto da cômoda, o Liam no tapete, a Zélia na cadeira
  marks: { LUCIA: 200, ALEX: 200, EU_M: 92, EU_F: 92, DAVI: 166, ZELIA: 294 },
  ozzy: [
    { x: 210, y: 140, layer: 'top' },
    { x: 54, y: 146, layer: 'top' },
    { x: 262, y: 142, flip: true, layer: 'top' },
  ],
  ozzySleep: { x: 186, y: 133 },
  objects: CASAL_OBJECTS,
  windows: [CASAL_WIN],
  exits: CASAL_EXITS,
};

// -----------------------------------------------------------------------------
// QUINTAL
// Atrás da casa azul: a parede de trás com a porta da cozinha e a janela da
// cozinha (acesa à noite, a cortina de chita), o tanque e o tambor azul debaixo
// da calha; o varal atravessando o quintal; o muro de bloco do fundo com os
// telhados dos vizinhos por cima; a casinha de caixote do Ozzy; o pé de limão
// à direita, na terra; a cadeira de praia rasgada onde a Zélia toma sol. Piso
// de cimento queimado rachado. À direita, o corredor lateral até o portão.
// -----------------------------------------------------------------------------
const YARD_Y = 102;
const YARD_KWIN: Rect = { x: 48, y: 50, w: 26, h: 18 };
const YARD_DOOR = { x: 14, w: 22, top: 50 };
const YARD_DRUM = { x: 80, w: 15, top: 76 };
const YARD_HUT = { x: 194, y: 80, w: 34, floor: 112 };
const YARD_CHAIR = { x: 152, floor: 138 };
const YARD_TREE = { x: 284 };

function yardSky(p: Pix, rain: boolean): void {
  const t = tod();
  if (rain) {
    // céu fechado de temporal: nuvens baixas, sem lua nem estrelas
    p.vgrad(0, 0, 320, 60, t === 'dia' ? ['#6a747e', '#848c94', '#9aa2a8'] : ['#141820', '#1c222c', '#262c36'], 0.6);
    for (let i = 0; i < 7; i++) p.ellipse(100 + i * 36, 8 + (i % 3) * 7, 26, 5, t === 'dia' ? '#7a848c' : '#20262e', 0.8);
    return;
  }
  if (t === 'dia') {
    p.vgrad(0, 0, 320, 60, ['#6a9ad0', '#8cb4dc', '#b8d0e4'], 0.6);
    p.ellipse(150, 12, 18, 3.4, '#f4f8fc');
    p.ellipse(162, 9, 10, 3, '#ffffff');
    p.ellipse(240, 22, 12, 2.4, '#e8f0f8');
  } else {
    p.vgrad(0, 0, 320, 60, ['#0c1222', '#141c32', '#1c2640'], 0.6);
    for (let i = 0; i < 26; i++) p.px(90 + Math.floor(hash2(i, 1, 33) * 230), Math.floor(hash2(i, 2, 33) * 40), hash2(i, 3, 33) < 0.3 ? '#ffffff' : '#c8d4f0');
    // lua cheia entre os telhados
    p.disc(232, 18, 6, '#eef0dc');
    p.disc(230, 16, 2, '#dcdcc8');
    p.px(234, 20, '#dcdcc8');
    if (t === 'noite') p.glow(232, 18, 24, '#c8d4f0', 0.12, 3);
  }
}

function yardBack(p: Pix, has: Has): void {
  const t = tod();
  const day = t === 'dia';
  const lit = t === 'noite';
  yardSky(p, has.has('chuva'));
  // telhados dos vizinhos por cima do muro (silhuetas)
  const roofC = day ? '#a85a3e' : '#1a2030';
  const wallC = day ? '#d8c8a8' : '#202838';
  p.rect(96, 40, 70, 18, wallC);
  p.poly(
    [
      [92, 42],
      [131, 28],
      [170, 42],
    ],
    roofC,
  );
  p.rect(176, 44, 60, 14, day ? '#c8b8a0' : '#1c2434');
  p.rect(170, 40, 72, 5, roofC);
  for (let x = 172; x < 242; x += 4) p.px(x, 41, day ? '#c87458' : '#242c3c');
  p.rect(120, 46, 6, 5, lit ? '#e8b860' : day ? '#5a7a98' : '#2a3448');
  // caixa d'água e antena
  p.rect(200, 32, 14, 9, day ? '#5a8ab8' : '#1e2a3c');
  p.hl(200, 213, 32, day ? '#7aaad8' : '#2a3648');
  p.vl(150, 16, 30, day ? '#5a5a60' : '#2a3040');
  p.hl(145, 155, 18, day ? '#5a5a60' : '#2a3040');
  p.hl(147, 153, 22, day ? '#5a5a60' : '#2a3040');
  // pipa enroscada no fio
  p.line(96, 20, 320, 26, day ? '#3a3a40' : '#141a26');
  p.poly(
    [
      [178, 18],
      [183, 23],
      [178, 28],
      [173, 23],
    ],
    day ? '#d94436' : '#3a2030',
  );
  p.line(178, 28, 174, 38, day ? '#e8e4dc' : '#2a3040');

  // muro de bloco do fundo (chapisco), com o lodo embaixo
  const mw = day ? '#a8a296' : '#4a4c50';
  plaster(p, 86, 56, 234, YARD_Y - 56, mw, shade(mw, -0.1), 91, 0.08);
  for (let y = 60; y < YARD_Y; y += 8) {
    p.hl(86, 319, y, shade(mw, -0.14));
    for (let x = 86 + ((y / 8) % 2) * 10; x < 320; x += 20) p.vl(x, y, y + 7, shade(mw, -0.14));
  }
  p.rect(86, 54, 234, 3, shade(mw, 0.18));
  p.hl(86, 319, 57, shade(mw, -0.25));
  for (let x = 86; x < 320; x++) if (hash2(x, 5, 92) < 0.45) p.vl(x, YARD_Y - 3 - Math.floor(hash2(x, 6, 92) * 4), YARD_Y - 1, day ? '#6a7a4a' : '#2e3a2c');

  // parede de trás da casa (azul, como a fachada), com o beiral
  const hw = '#6f8fb4';
  plaster(p, 0, 18, 88, YARD_Y - 18, hw, shade(hw, -0.1), 61, 0.06);
  p.rect(0, YARD_Y - 8, 88, 8, shade(hw, -0.16));
  p.hl(0, 87, YARD_Y - 8, shade(hw, 0.12));
  p.rect(0, 12, 96, 7, '#6a3a2a');
  for (let x = 0; x < 96; x += 6) {
    p.vl(x, 12, 18, '#4a2418');
    p.px(x + 3, 18, '#8a4a34');
  }
  p.hl(0, 95, 19, '#2a1a12');
  p.vl(88, 19, YARD_Y - 1, shade(hw, -0.3));
  // calha descendo até o tambor
  p.rect(92, 16, 3, 4, '#8a9098');
  p.rect(93, 19, 2, YARD_DRUM.top - 19, '#9aa0a8');
  p.vl(93, 19, YARD_DRUM.top - 1, '#b8c0c8');
  p.rect(90, YARD_DRUM.top - 2, 5, 2, '#9aa0a8');
  // porta da cozinha (a porta da área, de madeira com vidro canelado)
  const D = YARD_DOOR;
  p.rect(D.x - 3, D.top - 3, D.w + 6, YARD_Y - D.top + 3, '#4a3020');
  p.rect(D.x, D.top, D.w, YARD_Y - D.top, HOME.wood2);
  p.rect(D.x + 4, D.top + 4, D.w - 8, 14, lit ? '#f2c46b' : day ? '#a8b8c0' : '#2a3040');
  for (let x = D.x + 5; x < D.x + D.w - 4; x += 2) p.vl(x, D.top + 4, D.top + 17, lit ? '#e8a83a' : day ? '#c8d4d8' : '#343c4a');
  p.frame(D.x + 3, D.top + 22, D.w - 6, 22, HOME.wood);
  p.rect(D.x + D.w - 5, D.top + 22, 2, 3, '#d8b448');
  p.vl(D.x, D.top, YARD_Y - 1, shade(HOME.wood2, 0.15));
  // degrau de cimento
  p.rect(D.x - 4, YARD_Y, D.w + 8, 3, '#a8a49a');
  p.hl(D.x - 4, D.x + D.w + 3, YARD_Y, '#c8c4b8');
  // arandela sobre a porta
  p.rect(D.x + 8, D.top - 9, 6, 5, '#2a2a2a');
  p.rect(D.x + 9, D.top - 8, 4, 3, lit ? '#ffe2a3' : '#c8c4b4');
  if (lit) p.px(D.x + 9, D.top - 8, '#ffffff');
  // janela da cozinha (a mesma do lado de dentro: cortina de chita)
  const W = YARD_KWIN;
  p.rect(W.x - 2, W.y - 2, W.w + 4, W.h + 4, '#4a3a2a');
  p.rect(W.x, W.y, W.w, W.h, lit ? '#f2c46b' : day ? '#a8b8c0' : '#202836');
  if (lit) {
    for (let x = W.x; x < W.x + W.w; x++) {
      p.px(x, W.y, (x & 1) ? HOME.fabricRed : shade(HOME.fabricRed, 0.25));
      p.px(x, W.y + 1, (x & 1) ? shade(HOME.fabricRed, -0.2) : HOME.fabricRed);
    }
    // a lâmpada da cozinha lá dentro
    p.px(W.x + 18, W.y + 6, '#fff8e0');
  } else if (day) p.line(W.x + 3, W.y + W.h - 3, W.x + 9, W.y + 3, '#e4eef0');
  p.vl(W.x + Math.floor(W.w / 2), W.y, W.y + W.h - 1, '#4a3a2a');
  for (let x = W.x + 3; x < W.x + W.w; x += 6) p.vl(x, W.y, W.y + W.h - 1, '#1e1a18');
  p.rect(W.x - 3, W.y + W.h + 2, W.w + 6, 2, '#d8d0c0');

  // tanque de cimento com a torneira e o sabão em pedra
  const tx = 44;
  p.rect(tx, 80, 34, 4, '#b8b4aa');
  p.hl(tx, tx + 33, 80, '#d8d4ca');
  p.rect(tx + 2, 84, 30, 9, '#a8a49a');
  for (let y = 85; y < 93; y += 2) p.hl(tx + 20, tx + 30, y, '#98948a');
  p.hl(tx + 2, tx + 31, 92, '#88847a');
  p.vl(tx + 4, 93, YARD_Y - 1, '#88847a');
  p.vl(tx + 29, 93, YARD_Y - 1, '#88847a');
  p.rect(tx + 4, 81, 14, 2, '#6a7a88');
  p.vl(tx + 10, 72, 80, '#b8bcb8');
  p.hl(tx + 10, tx + 13, 72, '#b8bcb8');
  p.px(tx + 13, 73, '#8a9090');
  p.rect(tx + 24, 78, 5, 2, '#e8d8a0');
  wallContact(p, tx, 34, YARD_Y);

  // tambor azul de água debaixo da calha (o nível é objeto: tambor_cheio / tambor_transbordando)
  drum(p, YARD_DRUM.x, YARD_DRUM.top, YARD_DRUM.w, has.has('tambor_transbordando') ? 'transbordando' : has.has('tambor_cheio') ? 'cheio' : 'metade');

  // vasos de planta encostados no muro (os pratinhos da dengue são objeto)
  for (const [x, c, h] of [
    [112, '#a8582e', 7],
    [124, '#c87444', 6],
    [168, '#a8582e', 8],
  ] as [number, string, number][]) {
    p.rect(x, YARD_Y - h, 9, h, c);
    p.hl(x, x + 8, YARD_Y - h, shade(c, 0.2));
    p.disc(x + 4, YARD_Y - h - 4, 4, day ? '#5f8a4a' : '#2e4a2a');
    p.px(x + 2, YARD_Y - h - 7, day ? '#8ab05a' : '#3e5a34');
    if (has.has('pratinhos')) {
      p.ellipse(x + 4, YARD_Y, 6, 1.4, '#8a5a3a');
      p.ellipse(x + 4, YARD_Y - 0.4, 4, 0.8, '#7cc0dc');
    }
  }

  // pé de limão na terra, à direita
  const T = YARD_TREE;
  p.ellipse(T.x, YARD_Y + 14, 34, 9, day ? '#7a5a3a' : '#2e2218');
  p.ellipse(T.x - 4, YARD_Y + 13, 22, 5, day ? '#8a6a44' : '#382a1e');
  p.rect(T.x - 3, 62, 6, YARD_Y + 12 - 62, day ? '#6a4a2a' : '#2a1e14');
  p.line(T.x, 76, T.x - 12, 62, day ? '#6a4a2a' : '#2a1e14');
  p.line(T.x + 1, 70, T.x + 14, 58, day ? '#6a4a2a' : '#2a1e14');
  const leaf = day ? ['#4f7a3a', '#5f8a4a', '#7aa65a'] : ['#1a2a1e', '#22342a', '#2c4234'];
  for (const [dx, dy, r, i] of [
    [0, -6, 22, 0],
    [-16, 6, 14, 1],
    [16, 2, 16, 1],
    [-6, -18, 13, 2],
    [10, -16, 12, 2],
    [-20, -6, 9, 2],
  ] as [number, number, number, number][])
    p.disc(T.x + dx, 48 + dy, r, leaf[i]);
  for (let i = 0; i < 40; i++) {
    const a = hash2(i, 1, 55) * Math.PI * 2;
    const rr = hash2(i, 2, 55) * 24;
    p.px(Math.round(T.x + Math.cos(a) * rr), Math.round(46 + Math.sin(a) * rr * 0.8), leaf[(i % 2) + 1]);
  }
  // limões
  for (let i = 0; i < 9; i++) {
    const lx = Math.round(T.x - 22 + hash2(i, 3, 57) * 44);
    const ly = Math.round(36 + hash2(i, 4, 57) * 30);
    p.rect(lx, ly, 2, 2, day ? '#f2d43a' : '#5a5a28');
    p.px(lx, ly, day ? '#fff27a' : '#6a6a30');
  }

  // casinha de caixote do Ozzy, com o paninho e o nome pintado
  const H = YARD_HUT;
  floorShadow(p, H.x + H.w / 2, H.floor + 1, H.w / 2 + 3, 2, 0.4);
  p.poly(
    [
      [H.x - 2, H.y + 6],
      [H.x + H.w / 2, H.y - 4],
      [H.x + H.w + 2, H.y + 6],
    ],
    '#8a5a32',
  );
  p.line(H.x - 2, H.y + 6, H.x + H.w / 2, H.y - 4, '#a8763f');
  p.rect(H.x, H.y + 6, H.w, H.floor - H.y - 6, '#a8763f');
  for (let y = H.y + 10; y < H.floor; y += 5) p.hl(H.x, H.x + H.w - 1, y, '#8a5a32');
  p.vl(H.x + H.w - 1, H.y + 6, H.floor - 1, '#7a4a2a');
  // porta redonda recortada, escura, com o paninho xadrez
  p.ellipse(H.x + H.w / 2, H.floor - 8, 8, 9, '#1e140c');
  p.rect(H.x + H.w / 2 - 8, H.floor - 8, 17, 8, '#1e140c');
  if (!has.has('ozzy_casinha')) {
    p.rect(H.x + 9, H.floor - 3, 16, 3, '#a8413a');
    for (let x = H.x + 9; x < H.x + 25; x += 2) p.px(x, H.floor - 2, '#e8dcc4');
  }
  drawText(p, 'OZZY', H.x + H.w / 2 - Math.floor(textWidth('OZZY') / 2), H.y + 7, '#efe6cf');
  // potinho de água e de ração
  p.ellipse(H.x - 6, H.floor + 1, 4, 1.6, '#3a6ad0');
  p.ellipse(H.x - 6, H.floor + 0.6, 2.6, 0.8, '#7cc0dc');

  // piso de cimento queimado, com as rachaduras e o ralo
  // (desenhado por cima do chão inteiro; a terra do limoeiro e a casinha vêm antes da luz)
  void bayerOn;
}

/** tambor azul de 200 L (w×(YARD_Y-top)) com os aros; nível da água */
function drum(p: Pix, x: number, top: number, w: number, level: 'metade' | 'cheio' | 'transbordando'): void {
  const b = YARD_Y;
  floorShadow(p, x + w / 2, b + 1, w / 2 + 3, 1.8, 0.4);
  p.rect(x, top + 2, w, b - top - 2, '#2f5f9a');
  p.vl(x, top + 2, b - 1, '#4a7ac0');
  p.vl(x + 1, top + 2, b - 1, '#3f6fb0');
  p.vl(x + w - 1, top + 2, b - 1, '#1f3f6a');
  p.vl(x + w - 2, top + 2, b - 1, '#264a7a');
  for (const yy of [top + 8, b - 7]) {
    p.hl(x, x + w - 1, yy, '#1f3f6a');
    p.hl(x, x + w - 1, yy + 1, '#4a7ac0');
  }
  // boca: aro e a água (mais alta quando cheio)
  p.ellipse(x + w / 2, top + 2, w / 2, 2, '#1f3f6a');
  p.ellipse(x + w / 2, top + 2, w / 2 - 1, 1.3, level === 'metade' ? '#1a2a3a' : '#7cb0d0');
  if (level !== 'metade') p.hl(x + 3, x + 6, top + 2, '#d8eef8');
  if (level === 'transbordando') {
    // escorrendo pelos lados e a poça
    p.vl(x + 2, top + 3, b - 2, '#7cb0d0');
    p.vl(x + w - 4, top + 4, b - 2, '#7cb0d0');
    p.ellipse(x + w / 2 + 4, b + 3, 16, 3, '#5aa7d6', 0.55);
    p.ellipse(x + w / 2 + 6, b + 3, 8, 1.4, '#9fd0ea', 0.45);
  }
}

function yardFloor(p: Pix): void {
  // cimento queimado em perspectiva (juntas de dilatação) com rachaduras e lodo
  const day = tod() === 'dia';
  perspFloor(p, YARD_Y, 180, day ? '#9a948a' : '#5a5650', day ? '#86817a' : '#4c4944', { step: 46, first: 9, grow: 1.4, speck: day ? '#aaa49a' : '#64605a', seed: 61 });
  // rachaduras
  for (const [x0, y0, x1, y1] of [
    [96, 118, 120, 132],
    [120, 132, 116, 146],
    [210, 150, 236, 140],
    [236, 140, 252, 152],
  ] as [number, number, number, number][])
    p.line(x0, y0, x1, y1, day ? '#6a665e' : '#3a3834');
  // ralo
  p.rect(64, 128, 8, 5, day ? '#6a6a6a' : '#343434');
  for (let x = 65; x < 72; x += 2) p.vl(x, 129, 132, day ? '#3a3a3a' : '#1a1a1a');
}

function yardBackAll(p: Pix, has: Has): void {
  yardFloor(p);
  yardBack(p, has);
  if (has.has('chuva')) {
    // poças no cimento
    for (const [x, y, rx] of [
      [70, 132, 18],
      [180, 150, 26],
      [260, 128, 14],
      [120, 164, 20],
    ] as [number, number, number][]) {
      p.ellipse(x, y, rx, rx * 0.18, '#5a7a9a', 0.5);
      p.hl(x - rx / 2, x, y - 1, '#a8c0d8');
    }
  }
}

function yardFront(p: Pix, has: Has): void {
  // varal atravessando o quintal (na frente de tudo, mas alto: não cobre ninguém)
  const day = tod() === 'dia';
  const wire = day ? '#5a6070' : '#3a4050';
  const poles = [102, 236];
  for (const x of poles) {
    p.rect(x, 52, 3, 66, day ? '#8a6a44' : '#3a2e22');
    p.hl(x - 3, x + 5, 52, day ? '#a8804a' : '#4a3a2a');
    floorShadow(p, x + 1, 118, 4, 1, 0.4);
  }
  const sag = (x: number) => 54 + Math.round(Math.sin(((x - poles[0]) / (poles[1] - poles[0])) * Math.PI) * 5);
  for (let x = poles[0] + 2; x < poles[1]; x++) p.px(x, sag(x), wire);
  // roupas no varal (com pregadores)
  const cloth = (x: number, w: number, h: number, c: string, stripes?: string) => {
    const y = sag(x + w / 2) + 1;
    p.rect(x, y, w, h, c);
    if (stripes) for (let yy = y + 1; yy < y + h; yy += 2) p.hl(x, x + w - 1, yy, stripes);
    p.vl(x + w - 1, y, y + h - 1, shade(c, -0.2));
    p.px(x + 1, y - 1, '#d94436');
    p.px(x + w - 2, y - 1, '#4fae5b');
  };
  const dim = (c: string) => (day ? c : mix(c, '#1a2030', 0.45));
  cloth(112, 10, 12, dim('#e8e4dc'));
  cloth(126, 9, 11, dim(HOME.fabricBlue), dim('#e9e2cf'));
  if (!has.has('roupa_sarau')) cloth(140, 8, 10, dim('#f4f0e6'));
  cloth(152, 14, 9, dim('#d86a8a'));
  cloth(172, 12, 14, dim('#4f8a6e'));
  cloth(190, 6, 8, dim('#e8b931'));
  cloth(200, 10, 11, dim('#c8302a'));
  if (has.has('urso_varal')) {
    // o urso de pelúcia pendurado pelas orelhas, pingando
    const x = 216;
    const y = sag(x) + 1;
    p.disc(x + 4, y + 3, 3, dim('#a8763f'));
    p.disc(x + 1, y + 1, 1.4, dim('#a8763f'));
    p.disc(x + 7, y + 1, 1.4, dim('#a8763f'));
    p.rect(x + 1, y + 6, 7, 7, dim('#a8763f'));
    p.px(x + 3, y + 3, '#1b1a17');
    p.px(x + 5, y + 3, '#1b1a17');
    p.px(x + 4, y + 14, '#9fd0ea');
  }
}

function yardPlace(c: SceneCast): Placement {
  const x = clampX(c.x, 20, 300);
  if (c.pose === 'sentado') {
    // na cadeira de praia (a Zélia toma sol) ou no degrau da porta da cozinha
    if (x >= 110 && x <= 210) return { x: YARD_CHAIR.x, bottom: YARD_CHAIR.floor - 1, layer: 'top', seat: 'cadeira_praia' };
    return { x: YARD_DOOR.x + YARD_DOOR.w / 2, bottom: YARD_Y + 3, layer: 'back' };
  }
  if (c.pose === 'deitado') return { x: clampX(x, 80, 250), bottom: 150, layer: 'top', blanket: '#e8dcc4' };
  // em pé: perto do tanque, no meio do quintal ou debaixo do limoeiro
  if (x < 100) return { x: clampX(x, 40, 92), bottom: 120, layer: 'back' };
  if (x > 248) return { x: clampX(x, 252, 296), bottom: 132, layer: 'top' };
  return { x: clampX(x, 110, 236), bottom: 140, layer: 'top' };
}

/** cadeira de praia listrada e rasgada (sempre ali; quem senta é desenhado por cima) */
function yardSeats(p: Pix, has: Has, occ: Set<string>): void {
  beachChair(p, YARD_CHAIR.x, YARD_CHAIR.floor, occ.has('cadeira_praia'));
  void has;
}

function beachChair(p: Pix, cx: number, floorY: number, occupied: boolean): void {
  const x = cx - 10;
  const day = tod() === 'dia';
  floorShadow(p, cx, floorY + 1, 12, 2, 0.34);
  const al = day ? '#c8ccd0' : '#7a7e84';
  // encosto inclinado e assento de lona listrada
  for (let y = 0; y < 14; y++) {
    const xx = x + 3 - Math.floor(y / 5);
    for (let k = 0; k < 16; k++) {
      const c = (Math.floor(k / 2) % 2) ? (day ? '#3a7ad0' : '#2a4a7a') : day ? '#f4f0e6' : '#8a8a90';
      p.px(xx + k + 1, floorY - 22 + y, c);
    }
  }
  // o rasgo na lona (o pano repuxado e o furo)
  if (!occupied) {
    p.line(x + 9, floorY - 16, x + 12, floorY - 12, '#1b1a17');
    p.px(x + 10, floorY - 13, '#1b1a17');
    p.px(x + 11, floorY - 15, day ? '#e8dcc4' : '#6a6a70');
  }
  p.rect(x, floorY - 8, 20, 3, day ? '#3a7ad0' : '#2a4a7a');
  for (let k = 0; k < 20; k += 4) p.rect(x + k, floorY - 8, 2, 3, day ? '#f4f0e6' : '#8a8a90');
  // armação de alumínio em X
  p.line(x + 1, floorY, x + 18, floorY - 8, al);
  p.line(x + 18, floorY, x + 1, floorY - 8, al);
  p.line(x + 2, floorY - 8, x, floorY - 22, al);
  p.line(x + 19, floorY - 8, x + 17, floorY - 22, al);
}

function yardAnim(p: Pix, has: Has, t: number): void {
  // abelhas no pé de limão (dia 9)
  if (has.has('abelhas')) {
    for (let i = 0; i < 5; i++) {
      const a = t / 260 + i * 1.3;
      const x = Math.round(YARD_TREE.x - 8 + Math.cos(a) * (10 + i * 2));
      const y = Math.round(54 + Math.sin(a * 1.7) * 6 + i);
      p.px(x, y, '#e8b931');
      p.px(x + 1, y, '#1b1a17');
      if (Math.floor(t / 60 + i) % 2) p.px(x, y - 1, '#e8f0f8');
    }
  }
  // chuva (dia 17): riscos finos e o tambor transbordando
  if (has.has('chuva')) {
    for (let i = 0; i < 60; i++) {
      const x = Math.floor(hash2(i, 1, 7) * 330 + t / 6) % 330;
      const y = Math.floor(hash2(i, 2, 7) * 190 + t / 3) % 190;
      p.line(x, y, x - 1, y + 4, '#a8c0d8', 0.4);
    }
  }
}

function yardLight(p: Pix, front: boolean): void {
  // noite: a arandela da porta e a janela acesa da cozinha (quentes) e o luar (frio)
  p.glow(YARD_DOOR.x + 11, YARD_DOOR.top - 6, 100, HOME.lampLight, 0.3, 5, 1, front);
  p.glow(YARD_KWIN.x + 13, YARD_KWIN.y + 9, 60, HOME.lamp, 0.16, 4, 1, front);
  windowShaft(p, { x: YARD_KWIN.x - 4, y: YARD_Y, w: YARD_KWIN.w + 8, h: 0 }, HOME.lampLight, 0.12, front, 132, 0.2);
  p.glow(232, 18, 260, '#a8c0e8', 0.06, 3, 1, front);
  roomDark(p, 70, 84, 230, 130, '#060a12', 0.62, front, 0.42, 3);
}

function yardLightDia(p: Pix, front: boolean): void {
  // sol de manhã vindo da esquerda: claridade, sombra do muro no fundo
  p.glow(-20, -10, 300, '#fff4d8', 0.18, 4, 1, front);
  if (!front) {
    for (let y = YARD_Y; y < YARD_Y + 7; y++) for (let x = 88; x < 320; x++) if (bayerOn(x, y, 1 - (y - YARD_Y) / 7)) p.pxa(x, y, '#2a2418', 0.22);
  }
  roomDark(p, 160, 80, 260, 160, '#2a2018', 0.25, front, 0.6, 2);
}

function yardLightMadrugada(p: Pix, front: boolean): void {
  // tudo apagado; só a lua
  moonGrade(p, front, 0.66);
  p.glow(232, 18, 220, '#9ab4e0', 0.1, 3, 1, front);
  roomDark(p, 200, 90, 220, 130, '#020308', 0.5, front, 0.45, 3);
}

const YARD_OBJECTS: Record<string, ObjDef> = {
  // nível do tambor azul (o padrão é pela metade)
  tambor_cheio: o(YARD_DRUM.x - 1, YARD_DRUM.top - 1, YARD_DRUM.w + 2, YARD_Y - YARD_DRUM.top + 2, 'back'),
  tambor_transbordando: o(YARD_DRUM.x - 1, YARD_DRUM.top - 1, YARD_DRUM.w + 18, YARD_Y - YARD_DRUM.top + 6, 'back'),
  tambor: o(YARD_DRUM.x - 1, YARD_DRUM.top - 1, YARD_DRUM.w + 2, YARD_Y - YARD_DRUM.top + 2, 'back'),
  tanque: o(44, 70, 34, 32, 'back'),
  // o balde do tanque no chão (o Ozzy bebe dele)
  balde: o(60, 106, 14, 14, 'back', (p, r) => bucket(p, r.x, r.y + 2)),
  casinha_ozzy: o(YARD_HUT.x - 2, YARD_HUT.y - 4, YARD_HUT.w + 4, YARD_HUT.floor - YARD_HUT.y + 5, 'back'),
  ozzy_casinha: o(YARD_HUT.x + 8, YARD_HUT.floor - 16, 18, 16, 'back'),
  cadeira_praia: o(YARD_CHAIR.x - 11, YARD_CHAIR.floor - 23, 23, 24, 'front'),
  pe_limao: o(YARD_TREE.x - 34, 24, 60, 90, 'back'),
  abelhas: o(YARD_TREE.x - 30, 40, 40, 26, 'back'),
  varal: o(102, 50, 138, 30, 'front'),
  roupa_sarau: o(134, 132, 18, 10, 'back', (p, r) => {
    // a camisa social do Liam caída no chão, embolada
    p.rect(r.x + 2, r.y + 3, 13, 5, '#f4f0e6');
    p.rect(r.x + 1, r.y + 5, 4, 3, '#e4e0d4');
    p.hl(r.x + 2, r.x + 14, r.y + 7, '#c8c4b8');
    p.px(r.x + 8, r.y + 4, '#3a3a40');
    p.rect(r.x + 10, r.y + 2, 3, 2, '#c8302a');
  }),
  urso_varal: o(214, 54, 12, 18, 'front'),
  // os pratinhos de planta cheios d'água (dengue) e as tampinhas viradas
  pratinhos: o(108, 90, 72, 14, 'back'),
  tampinhas: o(240, 112, 22, 8, 'back', (p, r) => {
    for (let i = 0; i < 4; i++) {
      const x = r.x + 2 + i * 5;
      p.ellipse(x + 1, r.y + 4, 2, 1, i % 2 ? '#c8302a' : '#3a7ad0');
      p.px(x + 1, r.y + 3, '#e8e4dc');
    }
  }),
  tampinha: o(262, 116, 8, 6, 'back', (p, r) => {
    p.ellipse(r.x + 3, r.y + 3, 2, 1, '#c8302a');
    p.px(r.x + 3, r.y + 2, '#f2d45c');
  }),
  caixa_ferramentas: o(232, 108, 20, 11, 'back', (p, r) => {
    floorShadow(p, r.x + 10, r.y + 11, 10, 1.4, 0.35);
    p.rect(r.x + 1, r.y + 4, 18, 7, '#c8302a');
    p.hl(r.x + 1, r.x + 18, r.y + 4, '#e8584a');
    p.rect(r.x + 6, r.y + 1, 8, 3, '#2a2a2e');
    p.rect(r.x + 7, r.y + 2, 6, 2, '#c8302a');
    p.hl(r.x + 2, r.x + 17, r.y + 7, '#8a2018');
    p.px(r.x + 4, r.y + 3, '#b8bcb8');
  }),
  mala_sol: o(150, 108, 26, 14, 'back', (p, r) => suitcase(p, r.x + 1, r.y + 1, false)),
  maquina_carrinho: o(240, 100, 40, 24, 'front', (p, r) => {
    // carrinho de mão do vizinho com a máquina de costura da Dona Cida em cima
    floorShadow(p, r.x + 20, r.y + 23, 18, 2, 0.4);
    p.poly(
      [
        [r.x + 4, r.y + 12],
        [r.x + 30, r.y + 12],
        [r.x + 26, r.y + 20],
        [r.x + 8, r.y + 20],
      ],
      '#5a7a5a',
    );
    p.hl(r.x + 4, r.x + 30, r.y + 12, '#7a9a7a');
    p.disc(r.x + 32, r.y + 20, 3, '#2a2a2e');
    p.line(r.x + 4, r.y + 13, r.x - 2, r.y + 18, '#8a6a44');
    p.line(r.x + 8, r.y + 20, r.x + 8, r.y + 23, '#5a5a60');
    sewingMachine(p, r.x + 6, r.y - 4);
  }),
  telha_nova: o(296, 92, 14, 14, 'back', (p, r) => {
    // telha nova encostada no muro, com o bilhete "sobra"
    p.poly(
      [
        [r.x + 2, r.y + 13],
        [r.x + 6, r.y + 1],
        [r.x + 12, r.y + 1],
        [r.x + 10, r.y + 13],
      ],
      '#c87458',
    );
    p.line(r.x + 6, r.y + 1, r.x + 12, r.y + 1, '#e8946a');
    p.rect(r.x + 4, r.y + 6, 6, 4, '#f4f0e6');
    p.hl(r.x + 5, r.x + 8, r.y + 8, '#2a5aa0');
  }),
  lona_telhado: o(0, 8, 96, 14, 'back', (p, r) => {
    // a lona azul em cima do beiral, presa com tijolos
    p.rect(r.x, r.y + 4, r.w, 6, '#2a6ad0');
    for (let x = r.x; x < r.x + r.w; x += 4) p.px(x, r.y + 9, '#1a4a9a');
    p.hl(r.x, r.x + r.w - 1, r.y + 4, '#5a9af0');
    for (const x of [14, 46, 78]) {
      p.rect(r.x + x, r.y + 1, 8, 4, '#a8582e');
      p.hl(r.x + x, r.x + x + 7, r.y + 1, '#c87444');
    }
  }),
  chuva: o(0, 0, 0, 0, 'back'),
  bola: o(118, 128, 8, 8, 'back', undefined, (p, r, t) => {
    const hop = Math.abs(Math.sin(t / 220)) * 3;
    const y = Math.round(r.y + 6 - hop);
    floorShadow(p, r.x + 4, r.y + 8, 3, 1, 0.35);
    p.disc(r.x + 4, y - 1, 3, '#f4f0e6');
    p.px(r.x + 3, y - 2, '#1b1a17');
    p.px(r.x + 5, y, '#1b1a17');
  }),
};
YARD_OBJECTS.maquina_carrinho.layer = 'front';

/** mala de viagem azul com a etiqueta "COZINHA" (24×12); `big` = ×1,4 */
export function suitcase(p: Pix, x: number, y: number, label = true): void {
  floorShadow(p, x + 12, y + 12, 13, 1.6, 0.38);
  p.rect(x, y + 2, 24, 10, '#2f5a9a');
  p.hl(x, x + 23, y + 2, '#4a7ac0');
  p.vl(x + 23, y + 3, y + 11, '#1f3f6a');
  p.hl(x, x + 23, y + 11, '#1f3f6a');
  p.rect(x + 9, y, 6, 2, '#1e1d22');
  p.vl(x + 6, y + 3, y + 10, '#1f3f6a');
  p.vl(x + 17, y + 3, y + 10, '#1f3f6a');
  if (label) {
    p.rect(x + 7, y + 5, 10, 4, '#f4f0e6');
    p.hl(x + 8, x + 15, y + 7, '#2a2a2a');
  }
}

const YARD_EXITS: HouseExit[] = [
  { to: 'cozinha', label: 'Cozinha', r: { x: YARD_DOOR.x - 3, y: YARD_DOOR.top - 3, w: YARD_DOOR.w + 6, h: YARD_Y - YARD_DOOR.top + 6 }, arrow: 'U' },
  { to: 'porta', label: 'Portão', r: { x: 302, y: 118, w: 18, h: 34 }, arrow: 'R' },
];

export const QUINTAL: BgDef = {
  warm: true,
  back: yardBackAll,
  front: yardFront,
  light: yardLight,
  lightDia: yardLightDia,
  lightMadrugada: yardLightMadrugada,
  anim: yardAnim,
  place: yardPlace,
  seats: yardSeats,
  // a Zélia na cadeira de praia, o cônjuge no tanque, o Liam no meio, você debaixo do limoeiro
  marks: { ZELIA: 152, LUCIA: 66, ALEX: 66, DAVI: 196, EU_M: 268, EU_F: 268 },
  ozzy: [
    { x: 211, y: 124, layer: 'top' },
    { x: 262, y: 128, flip: true, layer: 'top' },
    { x: 100, y: 128, layer: 'top' },
  ],
  ozzySleep: { x: 211, y: 111 },
  objects: YARD_OBJECTS,
  windows: [],
  exits: YARD_EXITS,
};

// -----------------------------------------------------------------------------
// BANHEIRO
// Pequeno, de azulejo rosa até a altura do ombro (friso de flor) e piso de
// pastilha. A porta para o corredor, a pia de coluna com o armarinho de
// espelho (as escovas da família no copo), o vaso com a caixa acoplada, o box
// com a cortina de plástico florida e o chuveiro elétrico (a luzinha vermelha),
// o basculante alto, o toalheiro e o cesto. O tapete na frente do box.
// -----------------------------------------------------------------------------
const BATH_TILE_Y = 70;
const BATH_WIN: Rect = { x: 214, y: 34, w: 26, h: 14 };
const BATH_TOILET = { x: 108, floor: 112 };

function bathBack(p: Pix, has: Has): void {
  const t = tod();
  // parede de cima pintada e o azulejo rosa até meia parede
  plaster(p, 0, 0, 320, BATH_TILE_Y, '#d4c4a4', '#c8b898', 101, 0.05);
  p.rect(0, 0, 320, 4, '#b8a888');
  p.dith(0, 4, 320, 4, '#b8a888', 0.5);
  // mancha de umidade no canto do teto (o banheiro é o cômodo mais úmido da casa)
  p.ellipse(296, 6, 16, 5, '#a89878', 0.35);
  p.ellipse(298, 5, 9, 3, '#988868', 0.35);
  tileGrid(p, 0, BATH_TILE_Y, 320, WALL_Y - BATH_TILE_Y, '#e8b8c0', '#d09aa4', 8, 8);
  for (let y = BATH_TILE_Y + 2; y < WALL_Y; y += 8) for (let x = 2; x < 320; x += 8) if (hash2(x, y, 103) < 0.3) p.px(x + 2, y + 1, '#f4d0d6');
  // friso de florzinhas
  p.rect(0, BATH_TILE_Y - 4, 320, 4, '#c86a8a');
  for (let x = 2; x < 320; x += 6) {
    p.px(x, BATH_TILE_Y - 3, '#f4e0e6');
    p.px(x + 1, BATH_TILE_Y - 2, '#f4e0e6');
    p.px(x - 1 + 1, BATH_TILE_Y - 2, '#5f8a4a');
  }
  p.hl(0, 319, BATH_TILE_Y - 5, '#a84a6a');
  p.hl(0, 319, WALL_Y - 1, '#b8848e');
  // piso de pastilhinha (xadrez creme e azul), mais fino que o da cozinha
  perspFloor(p, WALL_Y, 180, '#dcd4bc', '#bcb49c', { step: 8, first: 3, grow: 1.12, alt: '#d0c8b0', speck: '#e8e2d0', seed: 105 });
  // barrado de pastilhas azuis rente à parede
  for (let x = 0; x < 320; x += 3) p.rect(x, WALL_Y + 1, 2, 2, (x / 3) % 2 ? '#5a7aa8' : '#7a98c0');

  // porta para o corredor (fechada por dentro: o trinco)
  innerDoor(p, 10, 54, 22, false);
  p.rect(26, 74, 3, 2, '#b8bcb8');

  // armarinho de espelho e a pia de coluna
  const sx = 46;
  p.rect(sx, 40, 26, 22, '#e8e4dc');
  p.frame(sx, 40, 26, 22, '#b8b4a8');
  p.rect(sx + 2, 42, 22, 18, '#9ab0b8');
  p.line(sx + 4, 56, sx + 12, 44, '#c8dce0');
  p.line(sx + 7, 57, sx + 15, 45, '#c8dce0');
  p.rect(sx + 21, 50, 2, 3, '#b8bcb8');
  // prateleirinha de vidro com o copo das escovas e o sabonete
  p.rect(sx - 2, 63, 30, 2, '#c8dce0');
  p.hl(sx - 2, sx + 27, 63, '#e8f4f8');
  const brushes = ['#d94436', '#3a6ad0', '#4fae5b', has.has('escova_zelia') ? '#a477d6' : ''];
  p.rect(sx + 2, 58, 5, 5, '#d8eef4');
  brushes.forEach((c, i) => {
    if (c) p.vl(sx + 3 + i, 55 + (i % 2), 58, c);
  });
  p.rect(sx + 18, 60, 5, 3, '#f2a0b8');
  // pia
  p.rect(sx - 2, 76, 30, 5, '#f4f2ea');
  p.hl(sx - 2, sx + 27, 76, '#ffffff');
  p.ellipse(sx + 13, 78, 9, 1.6, '#c8c8c0');
  p.vl(sx + 13, 72, 76, '#b8bcb8');
  p.hl(sx + 13, sx + 16, 72, '#b8bcb8');
  p.rect(sx + 9, 81, 9, WALL_Y - 81, '#ece8de');
  p.vl(sx + 17, 81, WALL_Y - 1, '#c8c4b8');
  wallContact(p, sx + 8, 11);

  // vaso sanitário com a caixa acoplada e o papel higiênico
  const tx = BATH_TOILET.x;
  p.rect(tx - 9, 72, 18, 13, '#f4f2ea');
  p.hl(tx - 9, tx + 8, 72, '#ffffff');
  p.vl(tx + 8, 73, 84, '#c8c4b8');
  p.rect(tx - 3, 74, 6, 2, '#c8c8c0');
  p.ellipse(tx, 92, 11, 5, '#ece8de');
  p.ellipse(tx, 91, 9, 3.4, '#f8f6ee');
  p.rect(tx - 6, 94, 12, BATH_TOILET.floor - 94, '#ece8de');
  p.vl(tx + 5, 94, BATH_TOILET.floor - 1, '#c8c4b8');
  floorShadow(p, tx, BATH_TOILET.floor + 1, 10, 1.6, 0.35);
  // tapete de vaso (rosa, felpudo) e o rolo de papel na parede
  p.ellipse(tx, BATH_TOILET.floor + 4, 13, 3, '#d86a8a');
  for (let x = tx - 11; x < tx + 12; x += 2) p.px(x, BATH_TOILET.floor + 6, '#f2a0b8');
  p.rect(tx + 14, 80, 6, 6, '#f8f6ee');
  p.hl(tx + 13, tx + 20, 79, '#b8bcb8');

  // box: azulejo até em cima, cortina florida aberta pela metade, o chuveiro elétrico
  const bx0 = 140;
  const bx1 = 206;
  tileGrid(p, bx0, 30, bx1 - bx0, BATH_TILE_Y - 30, '#e8b8c0', '#d09aa4', 8, 8);
  p.rect(bx0 - 2, 26, bx1 - bx0 + 4, 3, '#b8bcb8');
  p.hl(bx0 - 2, bx1 + 1, 26, '#e0e4e0');
  // chuveiro elétrico branco com a luz vermelha e o cano
  p.vl(184, 26, 40, '#b8bcb8');
  p.rect(178, 40, 12, 8, '#f4f2ea');
  p.hl(178, 189, 40, '#ffffff');
  p.ellipse(184, 49, 6, 1.6, '#d8d8d0');
  p.px(186, 43, t === 'noite' ? '#e0302a' : '#8a3a32');
  p.line(190, 44, 200, 34, '#2a2a2a');
  // registro e a saboneteira
  p.disc(196, 62, 2, '#c8ccd0');
  p.rect(150, 58, 8, 3, '#f4f2ea');
  p.rect(151, 56, 4, 2, '#e8d8a0');
  p.rect(160, 54, 3, 6, '#5aa7d6');
  p.rect(164, 55, 3, 5, '#e8566a');
  // degrauzinho do box
  p.rect(bx0, WALL_Y - 2, bx1 - bx0, 4, '#e0d8c4');
  p.hl(bx0, bx1 - 1, WALL_Y - 2, '#f0eadc');
  // a cortina de plástico: puxada para a esquerda, com bolinhas e flores
  for (let x = bx0; x < bx0 + 30; x++) {
    const wave = (Math.floor((x - bx0) / 3) % 2) ? 1 : 0;
    for (let y = 30; y < WALL_Y + 2; y++) {
      let c = wave ? '#9ad0d8' : '#b4e0e6';
      if ((x * 3 + y * 5) % 23 === 0) c = '#f2a0b8';
      else if ((x * 7 + y * 3) % 31 === 0) c = '#f2d45c';
      p.px(x, y, c);
    }
  }
  for (let x = bx0; x < bx0 + 30; x += 3) p.px(x, 28, '#8a9098');

  // basculante alto, de vidro canelado
  const W = BATH_WIN;
  p.rect(W.x - 2, W.y - 2, W.w + 4, W.h + 4, '#b8b4a8');
  p.rect(W.x, W.y, W.w, W.h, t === 'dia' ? '#d8e8f0' : t === 'madrugada' ? '#1a2234' : '#2a3654');
  for (let x = W.x + 1; x < W.x + W.w; x += 2) p.vl(x, W.y, W.y + W.h - 1, t === 'dia' ? '#eef6fa' : '#34405e');
  p.hl(W.x, W.x + W.w - 1, W.y + Math.floor(W.h / 2), '#b8b4a8');

  // toalheiro com as toalhas da casa
  p.hl(244, 292, 64, '#b8bcb8');
  p.px(244, 65, '#8a9098');
  p.px(292, 65, '#8a9098');
  for (const [x, w, c, h] of [
    [247, 12, '#3f6f9a', 20],
    [261, 11, '#d86a8a', 18],
    [274, 9, '#4fae5b', 14],
    [285, 6, '#e8dcc4', 12],
  ] as [number, number, string, number][]) {
    p.rect(x, 64, w, h, c);
    p.hl(x, x + w - 1, 64, shade(c, 0.25));
    p.hl(x, x + w - 1, 64 + h - 3, shade(c, -0.2));
    p.vl(x + w - 1, 65, 64 + h - 1, shade(c, -0.25));
  }
  // a toalha do Liam tem um dinossauro
  p.px(279, 72, '#1e5a2e');
  p.px(278, 73, '#1e5a2e');
  p.px(280, 73, '#1e5a2e');
  // cesto de roupa de plástico
  p.rect(298, 82, 16, 18, '#3a7ad0');
  for (let y = 84; y < 100; y += 3) for (let x = 299; x < 313; x += 3) p.px(x, y, '#2a5aa0');
  p.hl(298, 313, 82, '#6a9af0');
  wallContact(p, 298, 16);
  // lâmpada pelada no teto
  bareBulb(p, 160, 14);
}

function bathFront(p: Pix, has: Has): void {
  // o tapete na frente do box (torto e embolado depois da queda)
  if (has.has('tapete_torto')) {
    p.poly(
      [
        [150, 128],
        [182, 120],
        [190, 130],
        [158, 140],
      ],
      '#4f8a6e',
    );
    p.line(152, 129, 184, 121, '#6aa88a');
    p.ellipse(186, 128, 4, 2, '#3a6a54');
  } else {
    p.rect(152, 118, 40, 12, '#4f8a6e');
    p.frame(152, 118, 40, 12, '#3a6a54');
    for (let x = 154; x < 190; x += 3) p.px(x, 130, '#6aa88a');
  }
}

function bathPlace(c: SceneCast): Placement {
  const x = clampX(c.x, 30, 300);
  if (c.pose === 'sentado') return { x: BATH_TOILET.x, bottom: BATH_TOILET.floor - 3, layer: 'back', seat: 'vaso' };
  if (c.pose === 'deitado') return { x: clampX(x, 150, 240), bottom: 146, layer: 'top', blanket: '#e8dcc4' };
  if (x < 90) return { x: clampX(x, 52, 80), bottom: 122, layer: 'top' };
  if (x > 220) return { x: clampX(x, 236, 286), bottom: 128, layer: 'top' };
  return { x: clampX(x, 140, 214), bottom: 140, layer: 'top' };
}

function bathAnim(p: Pix, has: Has, t: number): void {
  // pingo do chuveiro
  const ph = (t % 1700) / 1700;
  if (ph < 0.8) p.px(184, 50 + Math.floor(ph * ph * 44), '#9fd0ea');
  // o chuveiro ligado (vapor)
  if (has.has('chuveiro_ligado')) {
    for (let i = 0; i < 14; i++) {
      const x = 178 + ((i * 5) % 13);
      const y = 50 + ((Math.floor(t / 40) + i * 7) % 46);
      p.px(x, y, '#cfe8f4');
    }
    for (let i = 0; i < 3; i++) {
      const q = ((t / 1400 + i / 3) % 1 + 1) % 1;
      p.pxa(168 + i * 10, 46 - Math.floor(q * 18), '#ffffff', 0.4 * (1 - q));
    }
  }
}

function bathLight(p: Pix, front: boolean): void {
  bulbCone(p, 160, 16, 132, 50, front);
  roomDark(p, 160, 60, 210, 130, HOME.bg0, 0.5, front, 0.5, 3, 116, 90);
}

const BATH_OBJECTS: Record<string, ObjDef> = {
  chinelo_zelia: o(120, 132, 16, 7, 'back', (p, r) => slippers(p, r.x + 1, r.y + 1, false)),
  chinelo_virado: o(196, 134, 16, 8, 'back', (p, r) => slippers(p, r.x + 1, r.y + 1, true)),
  poca_agua: o(150, 130, 50, 14, 'back', (p, r) => {
    p.ellipse(r.x + 25, r.y + 7, 24, 4, '#7cc0dc', 0.5);
    p.ellipse(r.x + 20, r.y + 6, 10, 1.4, '#cfe8f4', 0.6);
  }),
  tapete_torto: o(150, 118, 42, 22, 'front'),
  escova_zelia: o(46, 52, 10, 11, 'back'),
  escovas: o(46, 52, 10, 11, 'back'),
  remedios_zelia: o(48, 42, 22, 18, 'back', (p, r) => {
    // o armarinho aberto: os vidros da Zélia
    p.rect(r.x + 1, r.y + 1, 20, 16, '#f4f2ea');
    p.hl(r.x + 1, r.x + 20, r.y + 8, '#c8c4b8');
    for (const [x, y, c] of [
      [3, 3, '#d94436'],
      [7, 2, '#3a7ad0'],
      [12, 3, '#e8b931'],
      [4, 10, '#4fae5b'],
      [10, 10, '#f2a0b8'],
      [15, 11, '#8a5a32'],
    ] as [number, number, string][]) {
      p.rect(r.x + x, r.y + y, 3, 5, '#f8f8f0');
      p.rect(r.x + x, r.y + y, 3, 1, c);
    }
  }),
  toalha_chao: o(214, 132, 24, 10, 'back', (p, r) => {
    p.poly(
      [
        [r.x + 1, r.y + 8],
        [r.x + 6, r.y + 1],
        [r.x + 22, r.y + 3],
        [r.x + 20, r.y + 9],
      ],
      '#d86a8a',
    );
    p.line(r.x + 6, r.y + 1, r.x + 22, r.y + 3, '#f2a0b8');
  }),
  chuveiro_ligado: o(172, 38, 24, 60, 'back'),
  insulina: o(68, 59, 16, 9, 'back', (p, r) => insulin(p, r.x, r.y)),
  bombinha: o(64, 58, 17, 9, 'back', (p, r) => inhaler(p, r.x + 1, r.y + 1)),
  meia_mancha: o(300, 74, 11, 8, 'back', (p, r) => stainedSock(p, r.x + 1, r.y + 1)),
  goteira: o(232, 14, 16, 14, 'back'),
  balde: o(226, 134, 14, 14, 'front', (p, r) => bucket(p, r.x, r.y + 2)),
};

/** par de chinelos (14×5): arrumados ou um virado de sola para cima (a queda) */
function slippers(p: Pix, x: number, y: number, flipped: boolean): void {
  p.ellipse(x + 3, y + 2, 3, 1.6, '#e8e4dc');
  p.hl(x + 1, x + 5, y + 1, '#3a7ad0');
  if (flipped) {
    p.ellipse(x + 11, y + 4, 3, 1.6, '#3a7ad0');
    p.px(x + 10, y + 4, '#2a5aa0');
    p.px(x + 12, y + 3, '#2a5aa0');
  } else {
    p.ellipse(x + 10, y + 2, 3, 1.6, '#e8e4dc');
    p.hl(x + 8, x + 12, y + 1, '#3a7ad0');
  }
}

const BATH_EXITS: HouseExit[] = [{ to: 'sala', label: 'Sala', r: { x: 7, y: 51, w: 28, h: 49 }, arrow: 'U' }];

export const BANHEIRO: BgDef = {
  warm: true,
  back: bathBack,
  front: bathFront,
  light: bathLight,
  lightMadrugada: (p, front) => dawnRoomLight(p, front, [BATH_WIN]),
  lightDia: (p, front) => dayRoomLight(p, front, [BATH_WIN]),
  anim: bathAnim,
  place: bathPlace,
  // a Zélia sentada no vaso (a queda do dia 10), o cônjuge na porta, você na frente do box
  marks: { ZELIA: 108, LUCIA: 64, ALEX: 64, EU_M: 176, EU_F: 176, DAVI: 250 },
  ozzy: [
    { x: 60, y: 140, layer: 'top' },
    { x: 260, y: 142, flip: true, layer: 'top' },
  ],
  ozzySleep: { x: 172, y: 130 },
  objects: BATH_OBJECTS,
  windows: [BATH_WIN],
  exits: BATH_EXITS,
};

void postit;
void cardBox;
void familyPhoto;
void liamDrawing;
