// =============================================================================
// Vaga zero: o "tempo parando" (docs/roteiro-1.1/vaga-zero.md, §6 e §7).
// O clímax de Papers, Please: o mundo congela e o jogador decide a palavra.
//
// Um quadro 320×180 da central vista da sua cadeira, em função do tempo, para
// a interface animar:
//   entrada (≈1,2 s) — o relógio digital trava no minuto (os dígitos ficam
//     vermelhos e o ":" para de piscar), a vinheta fecha 20 %, a central perde a
//     cor (cinza-azulado) e só a sua mesa e o telefone continuam em cor; a
//     Simone congela no meio do gesto, a caneta no ar;
//   negociando — a vinheta pulsa no ritmo do coração (mais rápido com a
//     Resistência alta); a fita de papel do fax sai devagar (o pavio da rodada);
//     o rosto do Dr. Saulo na janelinha da linha, "PS DO REGIONAL";
//   acordo — o ":" volta a piscar e a cor volta de dentro para fora (da sua
//     mesa para as bordas); o post-it azul "VAGA ZERO ✓" no seu monitor;
//   sem_acordo — o relógio salta os minutos perdidos de uma vez, a cor volta
//     devagar e o painel da frota mostra "RETIDA";
//   peixoto — corta para o interfone: tudo cinza, a cor só no rosto do Peixoto.
// Versão do dia 19 (special 'cida'): a Simone não fica cinza — de pé ao lado da
// sua mesa, olhando para você — e o post-it da Cida no quadro fica em cor.
// Puro (sem DOM) até o drawVagaZero.
// =============================================================================
import { Pix, presentPix, hash2, bayerOn } from './pix';
import { CENTRAL, shade } from './palette';
import { drawText, textWidth } from './font';
import { portraitPix, type Mood } from './portraits';
import { extraFigurePix } from './figures';
import { deskPhone, postit, papers, manualBinder, corkBoard, pushPin, familyPhoto, floorShadow } from './props';

export const VZ_W = 320;
export const VZ_H = 180;

export type VagaZeroPhase = 'normal' | 'entrada' | 'negociando' | 'acordo' | 'sem_acordo' | 'peixoto';
export const VAGA_ZERO_PHASES: VagaZeroPhase[] = ['normal', 'entrada', 'negociando', 'acordo', 'sem_acordo', 'peixoto'];

/** durações (ms) das transições */
export const VAGA_ZERO_TIMING = { entrada: 1200, acordo: 900, sem_acordo: 2600, peixoto: 500 };

export interface VagaZeroOpts {
  /** ms desde que o telefone do Regional tocou (o começo do clímax) */
  t: number;
  /** fase; padrão: 'entrada' até VAGA_ZERO_TIMING.entrada, depois 'negociando' */
  phase?: VagaZeroPhase;
  /** ms desde o começo da fase atual (para as saídas); padrão = t */
  phaseT?: number;
  gender: 'M' | 'F';
  /** o minuto congelado no relógio da central ('HH:MM'), padrão '18:30' */
  clock?: string;
  /** sem acordo: os minutos que o relógio cobra de uma vez (padrão 40) */
  lostMinutes?: number;
  /** Resistência do Saulo (0..5): o pulso acelera com ela */
  resistance?: number;
  /** quanto da fita do fax já saiu nesta rodada (0..1) */
  fuse?: number;
  /** versão especial: 'cida' (dia 19) — a Simone de pé, em cor, e o post-it da Cida; 'henrique' (dia 20) — só a fala, sem fita */
  special?: 'cida' | 'henrique' | null;
  /** humor do Saulo na janelinha da linha (false = sem janelinha) */
  saulo?: Mood | false;
  /** humor do Peixoto na fase 'peixoto' */
  peixoto?: Mood;
  /** texto do post-it do acordo (padrão "VAGA ZERO"; na Cida, "CIDA 18:36") */
  note?: string;
}

/** batidas por minuto do pulso grave pela Resistência (60 sem resistência, ~135 com 5) */
export function vagaZeroPulse(resistance = 3): number {
  return 60 + Math.max(0, Math.min(5, resistance)) * 15;
}

/** fase em que o quadro está (a padrão pelo tempo) */
function phaseOf(o: VagaZeroOpts): VagaZeroPhase {
  if (o.phase) return o.phase;
  return o.t < VAGA_ZERO_TIMING.entrada ? 'entrada' : 'negociando';
}

/** 0..1: quanto o mundo está congelado (cinza) neste quadro, e o raio da cor que volta (acordo) */
function freezeOf(o: VagaZeroOpts, ph: VagaZeroPhase): { d: number; radius: number } {
  const pt = o.phaseT ?? o.t;
  switch (ph) {
    case 'normal':
      return { d: 0, radius: 0 };
    case 'entrada': {
      const k = Math.min(1, pt / VAGA_ZERO_TIMING.entrada);
      // em degraus (steps), como as animações do jogo
      return { d: Math.round(k * 6) / 6, radius: 0 };
    }
    case 'acordo': {
      // 0,5 s de silêncio e então a cor volta de dentro para fora
      const k = Math.max(0, (pt - 500) / VAGA_ZERO_TIMING.acordo);
      return { d: k >= 1 ? 0 : 1, radius: Math.round(k * 8) / 8 };
    }
    case 'sem_acordo': {
      const k = Math.max(0, (pt - 400) / VAGA_ZERO_TIMING.sem_acordo);
      return { d: Math.max(0, 1 - Math.round(k * 10) / 10), radius: 0 };
    }
    default:
      return { d: 1, radius: 0 };
  }
}

function addMinutes(hhmm: string, m: number): string {
  const [h, mm] = hhmm.split(':').map((v) => Number(v) || 0);
  const tot = (h * 60 + mm + m + 24 * 60) % (24 * 60);
  return `${String(Math.floor(tot / 60)).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`;
}

// -----------------------------------------------------------------------------
// A central (meia resolução 160×90, ampliada ×2)
// -----------------------------------------------------------------------------
interface Room {
  ph: VagaZeroPhase;
  clock: string;
  colon: boolean;
  frozenDigits: boolean;
  retida: boolean;
  fuse: number;
  special: VagaZeroOpts['special'];
  armUp: boolean;
  g: 'M' | 'F';
  note: string | null;
  ringing: boolean;
  t: number;
}

/** o fundo (o que perde a cor): parede, janela, relógio, painel da frota, quadro, a mesa da Simone, o fax */
function drawRoom(s: Pix, r: Room): void {
  // parede de painel verde-acinzentado, mais escura no alto
  s.rect(0, 0, 160, 54, '#26352f');
  s.rect(0, 0, 160, 3, '#16201c');
  for (let x = 0; x < 160; x += 20) s.vl(x, 3, 53, '#22302a');
  s.rect(0, 50, 160, 4, '#1f2c27');
  s.hl(0, 159, 50, '#3d5248');
  // tubos fluorescentes
  for (const x of [8, 62, 116]) {
    s.rect(x, 0, 30, 2, '#e6efd9');
    s.hl(x, x + 29, 2, '#8fa89a');
  }
  // janela com persiana: o fim de tarde lá fora
  s.vgrad(4, 8, 32, 22, ['#3a2a4a', '#8a4a4a', '#d8844a'], 0.6);
  for (let i = 0; i < 6; i++) s.rect(5 + i * 5, 22 - Math.floor(hash2(i, 1, 5) * 8), 4, 9, '#1a1420');
  for (let y = 9; y < 30; y += 2) s.hl(4, 35, y, '#3d5248');
  s.frame(3, 7, 34, 24, '#5f7a6c');
  // relógio digital da central
  s.rect(52, 5, 50, 15, '#0a0e0c');
  s.frame(51, 4, 52, 17, '#3d5248');
  const dcol = r.frozenDigits ? '#e0483d' : '#7fd17a';
  const txt = r.colon ? r.clock : r.clock.replace(':', ' ');
  const tw = textWidth(r.clock) * 2;
  drawText(s, txt, 77 - Math.floor(tw / 2), 7, dcol, { scale: 2 });
  if (r.frozenDigits) s.glow(77, 12, 26, '#e0483d', 0.1, 3);
  // painel da frota (o texto vai em resolução nativa: ver fleetText)
  s.rect(108, 4, 46, 16, '#0e1412');
  s.frame(107, 3, 48, 18, '#3d5248');
  // quadro de cortiça com os post-its por cor (azul, rosa, verde, branco)
  corkBoard(s, 112, 23, 44, 25);
  const pins: [number, number, string][] = [
    [116, 26, '#7ab0e0'],
    [127, 28, '#f2a0b8'],
    [138, 26, '#a8e0a0'],
    [148, 29, '#f4f2ea'],
    [120, 37, '#7ab0e0'],
    [142, 38, '#a8e0a0'],
  ];
  pins.forEach(([x, y, c], i) => {
    postit(s, x, y, c, i + 1);
    pushPin(s, x + 3, y, ['#d94436', '#3a6ad0', '#4fae5b'][i % 3]);
  });
  // o post-it amarelo da Cida (do dia 1) fica na camada da frente quando é a vez dela
  if (r.special !== 'cida') {
    postit(s, 131, 37, CENTRAL.postit, 9);
    pushPin(s, 134, 37, '#d94436');
  }
  // a mesa de trás (vazia), com o monitor apagado
  s.rect(44, 40, 40, 3, '#5f7a6c');
  s.hl(44, 83, 40, '#8fa89a');
  s.rect(44, 43, 40, 9, '#2f4139');
  s.rect(54, 28, 20, 12, '#121816');
  s.rect(55, 29, 18, 9, '#1a2420');
  // piso vinílico
  s.rect(0, 54, 160, 36, '#34463e');
  for (let y = 54; y < 90; y++) for (let x = 0; x < 160; x++) if (hash2(x, y, 44) < 0.05) s.px(x, y, '#3d5248');
  for (let y = 58; y < 90; y += 7) s.hl(0, 159, y, '#2f4139');
  // gaveteiro de arquivo no canto
  s.rect(2, 40, 20, 18, '#2f4139');
  s.hl(2, 21, 40, '#5f7a6c');
  for (const y of [44, 50]) {
    s.hl(4, 19, y, '#22302a');
    s.rect(10, y + 2, 4, 1, '#8fa89a');
  }
  // a mesa da Simone, à direita
  s.rect(96, 56, 64, 4, '#5f7a6c');
  s.hl(96, 159, 56, '#8fa89a');
  s.rect(96, 60, 64, 12, '#2f4139');
  s.vl(97, 60, 71, '#3d5248');
  s.rect(124, 42, 24, 14, '#121816');
  s.rect(125, 43, 22, 11, '#1f3a30');
  for (let i = 0; i < 4; i++) s.hl(126, 130 + Math.floor(hash2(i, 3, 2) * 14), 45 + i * 2, i === 1 ? '#e8a33d' : '#7fd17a');
  // a Simone sentada, congelada no meio do gesto (a caneta no ar) — ou a cadeira vazia (dia 19)
  if (r.special !== 'cida') {
    const sim = extraFigurePix('SIMONE', { pose: 'sentado' });
    const sx = 110 - Math.floor(sim.w / 2);
    const sy = 61 - sim.h;
    s.blit(sim, sx, sy);
    if (r.armUp) {
      // o braço direito levantado com a caneta
      s.vl(sx + sim.w - 2, sy + 4, sy + 13, '#6a4a7a');
      s.px(sx + sim.w - 2, sy + 3, '#f1c7a5');
      s.line(sx + sim.w - 2, sy + 2, sx + sim.w + 1, sy - 1, '#2a5aa0');
    }
  } else {
    // cadeira dela, vazia, virada
    s.rect(104, 46, 12, 10, '#2a3a33');
    s.hl(104, 115, 46, '#3d5248');
  }
}

/** a sua mesa, em primeiro plano (o que fica em cor): monitor, telefone fora do gancho, a ficha, o manual, a foto */
function drawDesk(s: Pix, r: Room): void {
  // dia 19: a Simone de pé do outro lado da sua mesa, olhando para você (a mesa cobre as pernas)
  if (r.special === 'cida') {
    const sim = extraFigurePix('SIMONE', { blink: r.t % 3800 < 130 });
    s.blit(sim, 120 - Math.floor(sim.w / 2), 74 - sim.h);
  }
  // tampo de fórmica que vem até a câmera
  s.poly(
    [
      [0, 66],
      [160, 64],
      [160, 90],
      [0, 90],
    ],
    '#2a3a33',
  );
  s.hl(0, 159, 65, '#5f7a6c');
  s.hl(0, 159, 66, '#3d5248');
  for (let y = 67; y < 90; y++) for (let x = 0; x < 160; x++) if (hash2(x, y, 12) < 0.04) s.px(x, y, '#32443c');
  for (let y = 74; y < 80; y++) for (let x = 0; x < 160; x++) if (bayerOn(x, y, 0.18)) s.px(x, y, '#3d5248');
  // o seu monitor (de frente, à esquerda) com a ficha aberta
  s.rect(10, 38, 40, 26, '#1e2420');
  s.frame(10, 38, 40, 26, '#0e1210');
  s.hl(11, 48, 38, '#3a443e');
  s.rect(13, 41, 34, 20, '#0d1311');
  s.rect(14, 42, 32, 3, '#26352f');
  drawText(s, 'REG', 15, 42, '#7fd17a');
  for (let i = 0; i < 6; i++) s.hl(15, 18 + Math.floor(hash2(i, 9, 4) * 24), 47 + i * 2, i === 2 ? '#e0483d' : '#b8e6a8');
  s.rect(26, 64, 8, 2, '#1e2420');
  s.rect(22, 66, 16, 2, '#2a322e');
  postit(s, 41, 39, CENTRAL.postit, 7);

  // o telefone, com o fone fora do gancho (você está na linha), o fio indo até a sua mão
  const px = 60;
  const py = 62;
  const ph = new Pix(46, 30);
  deskPhone(ph, 3, 2, r.ringing, r.t);
  if (!r.ringing) {
    // tira o fone do gancho: apaga o fone e deixa os dois garfos do gancho vazios
    for (let x = 0; x < ph.w; x++) for (let y = 0; y < 10; y++) ph.raw(x, y, 0);
    for (const gx of [8, 37]) {
      ph.rect(gx, 7, 2, 3, '#a8a290');
      ph.px(gx, 7, '#ece8da');
    }
  }
  s.blit(ph, px, py);
  if (!r.ringing) {
    // o fio enrolado saindo pela frente, para fora do quadro
    for (let i = 0; i < 14; i++) s.px(px + 22 + Math.round(Math.sin(i * 1.4) * 2), py + 22 + i, '#3a3a3a');
  }
  // a ficha com o carimbo REG e a caneta
  papers(s, 100, 72, 26, 16, 3);
  s.line(104, 86, 114, 81, '#2a5aa0');
  // o fax ao lado, com a fita de papel saindo devagar e caindo pela beira da mesa (o pavio da rodada)
  s.rect(130, 56, 28, 12, '#c4d4c0');
  s.hl(130, 157, 56, '#e6efd9');
  s.rect(132, 58, 18, 2, '#3d5248');
  s.rect(152, 58, 4, 3, '#2a3a33');
  s.px(153, 59, '#7fd17a');
  s.rect(130, 68, 28, 2, '#8fa89a');
  s.hl(130, 157, 69, '#5f7a6c');
  const len = Math.round(r.fuse * 30);
  for (let i = 0; i < len; i++) {
    const y = 70 + i;
    if (y > 89) {
      // já no chão: enrola para o lado
      s.hl(134 - (i - 20), 140 - (i - 20), 89, '#e8e2d4');
      continue;
    }
    const x = 134 + Math.round(Math.sin(i * 0.4) * 1.5);
    s.hl(x, x + 10, y, i % 6 === 0 ? '#d8d0bc' : '#f2ece0');
    if (i % 2 === 1) s.hl(x + 2, x + 2 + (i % 5) + 2, y, '#9aa49e');
  }
  // a foto da família (o único calor da mesa)
  s.glow(94, 70, 10, '#ffe2a3', 0.2, 3);
  familyPhoto(s, 86, 64, 12, 9, r.g);
  // o post-it da Cida em cor, no quadro (dia 19)
  if (r.special === 'cida') {
    postit(s, 131, 37, CENTRAL.postit, 9);
    pushPin(s, 134, 37, '#d94436');
    s.glow(135, 41, 9, '#f2d45c', 0.25, 3);
  }
}

// -----------------------------------------------------------------------------
// Efeitos (resolução nativa)
// -----------------------------------------------------------------------------
/** o painel da frota em resolução nativa: viatura e situação (a USA 01 retida quando não houve acordo) */
function fleetText(p: Pix, retida: boolean, t: number): void {
  const rows: [string, string, string][] = [
    ['USA 01', retida ? 'RETIDA' : 'LOCAL', retida ? '#c8a0f0' : '#e8a33d'],
    ['USA 02', 'QRV', '#7fd17a'],
    ['USB 01', 'TRANSP', '#5aa7d6'],
  ];
  rows.forEach(([lab, st, c], i) => {
    const y = 11 + i * 9;
    drawText(p, lab, 222, y, '#c4d4c0');
    if (retida && i === 0 && Math.floor(t / 400) % 2 === 0) p.rect(252, y - 1, textWidth(st) + 4, 7, '#3a2050');
    drawText(p, st, 254, y, c);
  });
}

/** o carimbo REG na ficha (resolução nativa, torto de 1 px como todo carimbo) */
function stampOn(p: Pix): void {
  const x = 226;
  const y = 150;
  const c = '#c8302a';
  p.frame(x, y, 17, 9, c);
  p.frame(x + 1, y + 1, 15, 7, '#e05a4a');
  drawText(p, 'REG', x + 3, y + 2, c);
  p.px(x + 16, y, '#f2ece0');
}

/** o post-it azul do acordo, colado no canto do seu monitor (texto em resolução nativa, com o ✓ à mão) */
function noteOn(p: Pix, note: string): void {
  const c = '#7ab0e0';
  const words = note.split(' ');
  const lines = words.length > 1 ? [words[0], words.slice(1).join(' ')] : [note];
  const w = Math.max(...lines.map((l) => textWidth(l))) + 8;
  const h = lines.length * 7 + 9;
  const x = 66;
  const y = 92;
  p.rect(x + 1, y + 1, w, h, '#0e1210');
  p.rect(x, y, w, h, c);
  p.hl(x, x + w - 1, y, shade(c, 0.22));
  p.px(x + w - 1, y + h - 1, shade(c, -0.35));
  lines.forEach((l, i) => drawText(p, l, x + 4, y + 3 + i * 7, '#1b2a5a'));
  const cy = y + h - 4;
  for (const [dx, dy] of [
    [0, 0],
    [1, 1],
    [2, 0],
    [3, -1],
    [4, -2],
  ] as [number, number][])
    p.px(x + 4 + dx, cy + dy, '#1b2a5a');
}

/** tira a cor: mistura cada pixel com o cinza-azulado da luminância; `mask(x,y)` = fica em cor */
function desaturate(p: Pix, k: number, keep?: (x: number, y: number) => boolean): void {
  if (k <= 0) return;
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (keep && keep(x, y)) continue;
      const v = p.get(x, y);
      const a = v >>> 24;
      if (!a) continue;
      const r = v & 255;
      const g = (v >>> 8) & 255;
      const b = (v >>> 16) & 255;
      const L = 0.3 * r + 0.59 * g + 0.11 * b;
      const tr = L * 0.78;
      const tg = L * 0.86;
      const tb = Math.min(255, L * 1.02 + 6);
      const dim = 1 - 0.18 * k;
      const nr = Math.round((r + (tr - r) * k) * dim);
      const ng = Math.round((g + (tg - g) * k) * dim);
      const nb = Math.round((b + (tb - b) * k) * dim);
      p.raw(x, y, ((a << 24) | (nb << 16) | (ng << 8) | nr) >>> 0);
    }
}

/** vinheta escura em faixas, fechando `close` (0..0.3) da tela */
function closingVignette(p: Pix, strength: number, close: number): void {
  if (strength <= 0) return;
  const start = 0.92 - close;
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      const dx = (x - 160) / 170;
      const dy = (y - 96) / 110;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= start) continue;
      const k = Math.min(1, (d - start) / 0.4) * 3;
      const fl = Math.floor(k);
      const f = k - fl;
      const q = fl + (f >= 0.66 ? 1 : f <= 0.34 ? 0 : bayerOn(x, y, (f - 0.34) / 0.32) ? 1 : 0);
      if (q > 0) p.pxa(x, y, '#020403', (Math.min(q, 3) / 3) * strength);
    }
}

/** janelinha da linha: o rosto de quem está do outro lado, com o rótulo */
function lineInset(p: Pix, x: number, y: number, face: Pix, label: string, gray: number): void {
  p.rect(x - 3, y - 3, 70, 82, '#0e1412');
  p.frame(x - 3, y - 3, 70, 82, '#3d5248');
  p.hl(x - 2, x + 65, y - 3, '#5f7a6c');
  const f = face.copy();
  desaturate(f, gray);
  p.blit(f, x, y);
  p.rect(x, y + 66, 64, 10, '#16201c');
  drawText(p, label, x + 32 - Math.floor(textWidth(label) / 2), y + 68, '#c4d4c0');
}

// -----------------------------------------------------------------------------
// Montagem
// -----------------------------------------------------------------------------
const out = new Pix(VZ_W, VZ_H);

function renderInto(o: VagaZeroOpts): Pix {
  const ph = phaseOf(o);
  const pt = o.phaseT ?? o.t;
  const { d, radius } = freezeOf(o, ph);
  const clock0 = o.clock ?? '18:30';
  const lost = o.lostMinutes ?? 40;
  // o relógio: normal (verde, ":" piscando); congelado (vermelho, ":" parado); sem acordo: salta os minutos
  let clock = clock0;
  let frozenDigits = ph === 'entrada' ? pt > 150 : ph === 'negociando' || ph === 'peixoto' || (ph === 'acordo' && pt < 500) || (ph === 'sem_acordo' && pt < 400);
  let colon = frozenDigits ? true : Math.floor(o.t / 500) % 2 === 0;
  if (ph === 'sem_acordo' && pt >= 400) {
    clock = addMinutes(clock0, lost);
    // os dígitos piscam duas vezes ao cobrar o tempo
    frozenDigits = pt < 1200 && Math.floor(pt / 160) % 2 === 0;
    colon = Math.floor(o.t / 500) % 2 === 0;
  }
  const note = ph === 'acordo' && pt >= 500 + VAGA_ZERO_TIMING.acordo * 0.5 ? o.note ?? (o.special === 'cida' ? `CIDA ${addMinutes(clock0, 6)}` : 'VAGA ZERO') : null;
  const room: Room = {
    ph,
    clock,
    colon,
    frozenDigits,
    retida: ph === 'sem_acordo' && pt >= 400,
    fuse: o.special === 'henrique' ? 0 : ph === 'negociando' || ph === 'peixoto' ? Math.max(0, Math.min(1, o.fuse ?? 0)) : 0,
    special: o.special ?? null,
    armUp: ph !== 'normal' && !(ph === 'acordo' && pt > 500) && !(ph === 'sem_acordo' && pt > 400),
    g: o.gender === 'F' ? 'F' : 'M',
    note,
    ringing: ph === 'normal' || (ph === 'entrada' && pt < 500),
    t: o.t,
  };
  const back = new Pix(160, 90);
  drawRoom(back, room);
  const front = new Pix(160, 90);
  drawDesk(front, room);
  out.clear('#000000');
  out.blit(back.scaled(2), 0, 0);
  fleetText(out, room.retida, o.t);
  // a central perde a cor (no acordo, a cor volta de dentro para fora, a partir da sua mesa)
  if (d > 0) {
    if (radius > 0) {
      const R = radius * 1.15;
      desaturate(out, d * 0.85, (x, y) => {
        const dd = Math.hypot((x - 150) / 190, (y - 160) / 150);
        return dd < R || (dd < R + 0.05 && bayerOn(x, y, 0.5));
      });
    } else desaturate(out, d * 0.85);
  }
  const fr = front.scaled(2);
  if (room.note) noteOn(fr, room.note);
  stampOn(fr);
  if (ph === 'peixoto') desaturate(fr, 0.85);
  out.blit(fr, 0, 0);
  // a vinheta fecha 20 % e pulsa no ritmo do coração
  const bpm = vagaZeroPulse(o.resistance ?? 3);
  const beatMs = 60000 / bpm;
  const inBeat = (o.t % beatMs) < 130 || ((o.t + beatMs * 0.82) % beatMs) < 70;
  const frozen = ph === 'entrada' ? d : ph === 'acordo' ? d * (1 - radius) : ph === 'sem_acordo' ? d : ph === 'normal' ? 0 : 1;
  closingVignette(out, 0.75 * frozen + (inBeat && frozen > 0.5 ? 0.1 : 0), 0.2 * frozen + (inBeat && frozen > 0.5 ? 0.03 : 0));
  // janelinhas: o Saulo do outro lado da linha; o Peixoto no interfone
  if (o.saulo !== false && ph !== 'normal') {
    const face = portraitPix('SAULO', o.saulo ?? (ph === 'acordo' ? 'cansado' : ph === 'sem_acordo' ? 'bravo' : 'neutro'));
    lineInset(out, 8, 8, face, 'PS DO REGIONAL', ph === 'peixoto' ? 0.85 : 0);
  }
  if (ph === 'peixoto') {
    const face = portraitPix('PEIXOTO', o.peixoto ?? 'neutro');
    const k = Math.min(1, pt / VAGA_ZERO_TIMING.peixoto);
    if (k > 0.3) lineInset(out, 244, 46, face, 'COORDENAÇÃO', 0);
  }
  return out;
}

/** Quadro do clímax da vaga zero num Pix 320×180 NOVO (puro, sem DOM). */
export function renderVagaZero(o: VagaZeroOpts): Pix {
  return renderInto(o).copy();
}

/** Desenha o quadro do clímax no contexto 2D em (0,0), pixels nativos 320×180 (amplie ×4 com CSS). */
export function drawVagaZero(ctx: CanvasRenderingContext2D, o: VagaZeroOpts): void {
  presentPix(ctx, renderInto(o), 0, 0, 1, 'vagazero');
}
