// =============================================================================
// Ozzy, o lulu da pomerânia laranja da família (corpo inteiro, ~16×13).
// Bola de pelo laranja, juba creme no peito, orelhinhas em pé, cauda de pluma
// enrolada sobre as costas, olhinhos e focinho pretos. Mesma linguagem dos
// sprites da família: cores chapadas, luz de cima-esquerda, contorno escuro.
// Poses: sentado (abana o rabo), deitado (respira), dormindo (enrolado) e
// brincando (pula atrás da bolinha). Nada de ruim acontece com o Ozzy: não
// existe pose triste, doente ou machucada.
//
// dogPix(pose, t) → Pix do quadro (em cache), virado para a direita
// dogPortraitPix(pose, t, blend) / dogPortrait(...) → retrato 64×64 (fundo de casa), para a UI
// drawDog(p, x, y, pose, t, { map, flip }) → desenha com o centro em x e as
// patas na linha y (a mesma convenção de "bottom" do elenco das cenas)
// =============================================================================
import { Pix, gradedCopy, hasDOM } from './pix';
import { homeGrader, quantize } from './palette';
import { makeSprite, type Sprite } from './sprite';
import { floorShadow } from './props';
import { drawText } from './font';

export type DogPose = 'sentado' | 'deitado' | 'dormindo' | 'brincando' | 'correndo' | 'latindo' | 'deitando';
export const DOG_POSES: DogPose[] = ['sentado', 'deitado', 'dormindo', 'brincando', 'correndo', 'latindo', 'deitando'];

/** paleta do Ozzy (laranja de lulu, creme da juba) */
const PAL: Record<string, string> = {
  o: '#f4ac56', // laranja claro (lado da luz)
  O: '#e0822e', // laranja
  S: '#b4581e', // sombra
  D: '#84391a', // sombra funda (olho fechado)
  c: '#f8dca6', // creme (juba, focinho, patinhas)
  C: '#ddb478', // creme na sombra
  k: '#1b1210', // olhos e focinho
  t: '#e8687a', // língua
  b: '#3a6ad0', // bolinha azul
  B: '#2a4a98', // bolinha na sombra
  w: '#f4f8ff', // brilho da bolinha
};

// Quadros desenhados à mão ('.' = transparente). Todos virados para a direita.
const FRAMES: Record<string, string[]> = {
  // sentado: a pluma do rabo deitada sobre as costas, colada na nuca
  sentado0: [
    '.......S...S....',
    '......SOOoOOS...',
    '..oo.oOOOOOOOS..',
    '.occooOOOOOOOOS.',
    'ocoocoOOkOOkOOS.',
    '.ooccoOOOckcOOOS',
    '..ooocOOOOcOOcS.',
    '.ooocccccccccS..',
    'ooOOOcccccccOOS.',
    '.oOOOOcccccOOS..',
    '.OOOOOOOOOOOOOS.',
    '.SOOOccOOccOS...',
    '..SSScCSScCS....',
  ],
  // sentado, abanando: a pluma do rabo balança
  sentado1: [
    '.......S...S....',
    '.oo...SOOoOOS...',
    'occo.oOOOOOOOS..',
    'ocooooOOOOOOOOS.',
    '.oocooOOkOOkOOS.',
    '..occoOOOckcOOOS',
    '..ooocOOOOcOOcS.',
    '.ooocccccccccS..',
    'ooOOOcccccccOOS.',
    '.oOOOOcccccOOS..',
    '.OOOOOOOOOOOOOS.',
    '.SOOOccOOccOS...',
    '..SSScCSScCS....',
  ],
  // deitado (esfinge): a mesma cabeça, o corpo esticado para trás, patinhas da frente esticadas
  deitado0: [
    '...........S...S...',
    '..........SOOoOOS..',
    '..oo.....oOOOOOOOS.',
    '.occo...oOOOOOOOOOS',
    'ocoocooOOOOkOOkOOS.',
    '.ooccoOOOOOOOckcOOS',
    '.oooooOOOOccOOcOOcS',
    '.ooOOOOOOOcccccccS.',
    '.oOOOOOOOOOcccccS..',
    '.SOOOOOOOOOOcccOccS',
    '..SSSSSSSSSSCcCScCS',
  ],
  // deitado, respirando (o lombo sobe 1 px)
  deitado1: [
    '...........S...S...',
    '..........SOOoOOS..',
    '..oo.....oOOOOOOOS.',
    '.occooooooOOOOOOOOS',
    'ocoocoOOOOOkOOkOOS.',
    '.ooccoOOOOOOOckcOOS',
    '.oooooOOOOccOOcOOcS',
    '.ooOOOOOOOcccccccS.',
    '.oOOOOOOOOOcccccS..',
    '.SOOOOOOOOOOcccOccS',
    '..SSSSSSSSSSCcCScCS',
  ],
  // dormindo enrolado: a pluma do rabo por cima das costas, cabeça nas patinhas, olho fechado
  dormindo0: [
    '..occo..........',
    '.occcco.........',
    '.ooccooo...S.S..',
    'oooooooOO.SOOoS.',
    'oOOOOOOOOSOOOOOS',
    'OOOOOOOOSOODDOOS',
    'OOOOOOOOSOOOOcck',
    'SOOOOOOOOSOOcccS',
    '.SOOOOOOOOccCCC.',
    '..SSSSSSSSSSSS..',
  ],
  dormindo1: [
    '..occo..........',
    '.occcco.........',
    'oooccooo...S.S..',
    'oooooooOO.SOOoS.',
    'oOOOOOOOOSOOOOOS',
    'OOOOOOOOSOODDOOS',
    'OOOOOOOOSOOOOcck',
    'SOOOOOOOOSOOcccS',
    'SSOOOOOOOOccCCC.',
    '.SSSSSSSSSSSSS..',
  ],
  // brincando: reverência (peito no chão, traseiro e rabo para cima, língua de fora) …
  brincando0: [
    '.oo................',
    'occo...............',
    'ocooo.......S...S..',
    '.oooocO....SOOoOOS.',
    '..oOOOOO..oOOOOOOOS',
    '..OOOOOOOOOOkOOkOOS',
    '..SOOOOOOOOOOckcOOS',
    '..SOOOOOcccOOOtOOcS',
    '..SOS..Scccccccccc.',
    '..SS....SCccCCccCc.',
  ],
  // … e o pulo: patas da frente para cima, boca aberta
  brincando1: [
    '.......S...S....',
    '.oo...SOOoOOS...',
    'occo.oOOOOOOOS..',
    'ocooooOOOOOOOOS.',
    '.oocooOOkOOkOOS.',
    '..occoOOOckcOOOS',
    '..ooocOOOOtOOcS.',
    '.ooocccccccccScc',
    'ooOOOcccccccOOcc',
    '.oOOOOcccccOOS..',
    '.OOOOOOOOOOOOS..',
    '.SOOOOOOOOOOS...',
    '..SSc.....cS....',
  ],
  // correndo de lado (galope em 4 quadros), perfil para a direita, a pluma do rabo
  // por cima das costas: esticado — traseiras para trás, dianteiras para a frente …
  correndo0: [
    '.............S..S..',
    '...oocc.....SoSSOS.',
    '..occcco...SoOOOOOS',
    '.ocoooocooooOOOkOcc',
    '.oooooooOOOOOOOOcck',
    '..oOOOOOOOOOcOOccCS',
    '.oOOOOOOOOOOcccccS.',
    '.OOOOOOOOOOOOcccS..',
    '.SOOOOOOOOOOOCcS...',
    '..SSOOOOOOOOOCS....',
    '.cS..........Sc....',
    'cC............Cc...',
  ],
  // … recolhendo (o corpo desce 1 px) …
  correndo1: [
    '...................',
    '.............S..S..',
    '...oocc.....SoSSOS.',
    '..occcco...SoOOOOOS',
    '.ocoooocooooOOOkOcc',
    '.oooooooOOOOOOOOcck',
    '..oOOOOOOOOOcOOccCS',
    '.oOOOOOOOOOOcccccS.',
    '.OOOOOOOOOOOOcccS..',
    '.SOOOOOOOOOOOCcS...',
    '..SSOOOOOOOOOCS....',
    '...cS......Sc......',
  ],
  // … no ar, as patinhas encolhidas debaixo da juba …
  correndo2: [
    '.............S..S..',
    '...oocc.....SoSSOS.',
    '..occcco...SoOOOOOS',
    '.ocoooocooooOOOkOcc',
    '.oooooooOOOOOOOOcck',
    '..oOOOOOOOOOcOOccCS',
    '.oOOOOOOOOOOcccccS.',
    '.OOOOOOOOOOOOcccS..',
    '.SOOOOOOOOOOOCcS...',
    '..SSOOOOOOOOOCS....',
    '....Sc....cS.......',
    '...................',
  ],
  // … pousando
  correndo3: [
    '...................',
    '.............S..S..',
    '...oocc.....SoSSOS.',
    '..occcco...SoOOOOOS',
    '.ocoooocooooOOOkOcc',
    '.oooooooOOOOOOOOcck',
    '..oOOOOOOOOOcOOccCS',
    '.oOOOOOOOOOOcccccS.',
    '.OOOOOOOOOOOOcccS..',
    '.SOOOOOOOOOOOCcS...',
    '..SSOOOOOOOOOCS....',
    '..cS.....Scc.......',
  ],
  // latindo: em pé de lado, firme nas quatro patas, boca fechada …
  latindo0: [
    '.............S..S..',
    '...oocc.....SoSSOS.',
    '..occcco...SoOOOOOS',
    '.ocoooocooooOOOkOcc',
    '.oooooooOOOOOOOOcck',
    '..oOOOOOOOOOcOOccCS',
    '.oOOOOOOOOOOcccccS.',
    '.OOOOOOOOOOOOcccS..',
    '.SOOOOOOOOOOOCcS...',
    '..SSOOOOOOOOOCS....',
    '..cS.cS...cS.cS....',
    '..cC.cC...cC.cC....',
  ],
  // … e o "au!": cabeça erguida, boca aberta com a língua
  latindo1: [
    '............S..S...',
    '...oocc....SoSSOS..',
    '..occcco..SoOOOOOS.',
    '.ocoooocoooOOOkOOcc',
    '.oooooooOOOOOOOOc.k',
    '..oOOOOOOOOOcOOcct.',
    '.oOOOOOOOOOOccccckS',
    '.OOOOOOOOOOOOcccS..',
    '.SOOOOOOOOOOOCcS...',
    '..SSOOOOOOOOOCS....',
    '..cS.cS...cS.cS....',
    '..cC.cC...cC.cC....',
  ],
  // deitando para dormir: a esfinge de olhos pesados (entre o deitado e o dormindo)
  deitando0: [
    '...........S...S...',
    '..........SOOoOOS..',
    '..oo.....oOOOOOOOS.',
    '.occo...oOOOOOOOOOS',
    'ocoocooOOOODDOODDS.',
    '.ooccoOOOOOOOckcOOS',
    '.oooooOOOOccOOcOOcS',
    '.ooOOOOOOOcccccccS.',
    '.oOOOOOOOOOcccccS..',
    '.SOOOOOOOOOOcccOccS',
    '..SSSSSSSSSSCcCScCS',
  ],
};

/** bolinha azul (5×5) */
const BALL = makeSprite(['.bb..', 'bwbb.', 'bbbB.', '.bBB.', '.....'], PAL);

const sprites = new Map<string, Sprite>();
function spriteOf(key: string): Sprite {
  let s = sprites.get(key);
  if (!s) {
    s = makeSprite(FRAMES[key], PAL);
    sprites.set(key, s);
  }
  return s;
}

/** quadro da pose no tempo t (ms) */
function frameKey(pose: DogPose, t: number): string {
  switch (pose) {
    case 'sentado':
      // abana o rabo em rajadas: quatro abanadas, uma pausa
      return Math.floor(t / 180) % 6 < 4 ? `sentado${Math.floor(t / 180) % 2}` : 'sentado0';
    case 'deitado':
      return `deitado${Math.sin((t / 1000) * ((2 * Math.PI) / 2.6)) > 0.3 ? 1 : 0}`;
    case 'dormindo':
      return `dormindo${Math.sin((t / 1000) * ((2 * Math.PI) / 3.2)) > 0.2 ? 1 : 0}`;
    case 'correndo':
      // galope rápido: 4 quadros de 85 ms
      return `correndo${Math.floor(t / 85) % 4}`;
    case 'latindo':
      // "au! au!": dois latidos curtos e uma pausa (ciclo de 720 ms)
      return [1, 0, 1, 0, 0, 0][Math.floor(t / 120) % 6] ? 'latindo1' : 'latindo0';
    case 'deitando':
      return 'deitando0';
    case 'brincando':
    default:
      return `brincando${Math.floor(t / 320) % 2}`;
  }
}

/** o quadro (nome) que a pose mostra no tempo t — para a UI sincronizar o som do latido */
export function dogFrameAt(pose: DogPose, t: number): string {
  return frameKey(pose, t);
}

const cache = new Map<string, Pix>();

/** Pix do Ozzy na pose (contorno escuro, em cache por quadro e escala). Virado para a direita. */
export function dogPix(pose: DogPose = 'sentado', t = 0, scale = 1): Pix {
  const key = frameKey(pose, t);
  const sk = scale > 1 ? `${key}@${scale}` : key;
  let p = cache.get(sk);
  if (!p) {
    if (scale > 1) p = dogPix(pose, t).scaled(scale);
    else {
      const s = spriteOf(key);
      p = new Pix(s.w + 2, s.h + 2);
      p.sprite(s, 1, 1);
      p.outline('#120c08');
    }
    cache.set(sk, p);
  }
  return p;
}

/** nomes de todos os quadros desenhados (sentado0, correndo2, latindo1…) */
export const DOG_FRAMES = Object.keys(FRAMES);

/** Pix de um quadro pelo nome (contorno escuro, em cache). Virado para a direita. */
export function dogFramePix(frame: string, scale = 1): Pix {
  const key = FRAMES[frame] ? frame : 'sentado0';
  const sk = `#${key}@${scale}`;
  let p = cache.get(sk);
  if (!p) {
    if (scale > 1) p = dogFramePix(key).scaled(scale);
    else {
      const s = spriteOf(key);
      p = new Pix(s.w + 2, s.h + 2);
      p.sprite(s, 1, 1);
      p.outline('#120c08');
    }
    cache.set(sk, p);
  }
  return p;
}

export interface DogDrawOpts {
  /** gradação do Desgaste (ex.: homeGrader(q)); a mesma das cenas da casa */
  map?: ((hex: string) => string) | null;
  /** chave do cache da gradação (ex.: 'q' + passo do desgaste) */
  mapKey?: string;
  /** virado para a esquerda */
  flip?: boolean;
  /** sem sombra no chão */
  noShadow?: boolean;
  /** ampliação inteira (as vinhetas de final usam ×2) */
  scale?: number;
  /** balão "AU!" no quadro do latido (padrão: sim, na pose latindo) */
  bark?: boolean;
  /** "z z z" subindo quando dorme (padrão: não — as cenas antigas não tinham) */
  zzz?: boolean;
}

/** balão de fala 15×9 com "AU!" (cabo apontando para baixo, do lado de quem late) */
function barkBubble(p: Pix, x: number, y: number, flip: boolean, k: number): void {
  const b = new Pix(17, 12);
  const ink = '#1b1a17';
  b.rect(1, 1, 15, 8, '#fffaf0');
  b.hl(2, 14, 0, ink);
  b.hl(2, 14, 9, ink);
  b.vl(0, 2, 7, ink);
  b.vl(16, 2, 7, ink);
  b.px(1, 1, ink);
  b.px(15, 1, ink);
  b.px(1, 8, ink);
  b.px(15, 8, ink);
  // cabo do balão
  const cx = flip ? 11 : 4;
  b.px(cx, 9, '#fffaf0');
  b.px(cx + 1, 9, '#fffaf0');
  b.px(cx + (flip ? 2 : -1), 9, ink);
  b.px(cx + (flip ? -1 : 2), 9, ink);
  b.px(cx + (flip ? 1 : 0), 10, ink);
  b.px(cx + (flip ? 2 : -1), 10, ink);
  b.px(cx + (flip ? 2 : -1), 11, ink);
  drawText(b, 'AU!', 3, 3, '#c8302a');
  p.blit(k > 1 ? b.scaled(k) : b, x, y);
}

/** "z Z z" subindo devagar sobre quem dorme */
function drawZzz(p: Pix, x: number, y: number, t: number, k: number): void {
  const ink = '#e6efd9';
  const shadow = '#1b1a17';
  for (let i = 0; i < 3; i++) {
    const ph = ((t / 2400 + i / 3) % 1 + 1) % 1; // 0..1: nasce embaixo, sobe e some
    if (ph > 0.92) continue;
    const big = i === 1;
    const zx = Math.round(x + (i * 4 + Math.sin(ph * 6.3) * 1.5) * k);
    const zy = Math.round(y - ph * 14 * k);
    const z = new Pix(big ? 5 : 4, big ? 5 : 4);
    const n = z.w;
    z.hl(0, n - 1, 0, ink);
    z.hl(0, n - 1, n - 1, ink);
    for (let j = 1; j < n - 1; j++) z.px(n - 1 - j, j, ink);
    const zz = k > 1 ? z.scaled(k) : z;
    p.blit(zz, zx + k, zy + k, { tint: shadow, tintAmount: 1, alpha: 0.5 });
    p.blit(zz, zx, zy, { alpha: ph < 0.7 ? 1 : 0.6 });
  }
}

/**
 * Desenha o Ozzy com o centro em x e as patas na linha y (pixels nativos).
 * Na pose "brincando" a bolinha quica na frente dele.
 */
export function drawDog(p: Pix, x: number, y: number, pose: DogPose = 'sentado', t = 0, o: DogDrawOpts = {}): void {
  const k = Math.max(1, Math.floor(o.scale ?? 1));
  const src = dogPix(pose, t, k);
  const g = gradedCopy(src, o.map ?? null, o.mapKey ?? 'dog');
  const jump = pose === 'brincando' && frameKey(pose, t) === 'brincando1' ? 3 * k : 0;
  const left = Math.round(x - g.w / 2);
  const top = Math.round(y - g.h + 1) - jump;
  if (!o.noShadow) floorShadow(p, Math.round(x), Math.round(y) + 1, Math.floor(g.w / 2), 1.4 * k, jump ? 0.22 : 0.32);
  p.blit(g, left, top, { flipX: !!o.flip });
  if (pose === 'brincando') {
    const ball = gradedCopy(ballPix(k), o.map ?? null, o.mapKey ?? 'dog');
    const ph = (t % 640) / 640;
    const hop = Math.round(Math.abs(Math.sin(ph * Math.PI)) * 6 * k);
    const bx = o.flip ? left - ball.w - k : left + g.w + k;
    p.blit(ball, bx, Math.round(y) - ball.h + 2 * k - hop);
  }
  if (pose === 'latindo' && (o.bark ?? true) && frameKey(pose, t) === 'latindo1') {
    // balão por cima da cabeça, do lado do focinho
    const bx = o.flip ? left - 9 * k : left + g.w - 8 * k;
    barkBubble(p, bx, top - 12 * k, !!o.flip, k);
  }
  if (pose === 'dormindo' && o.zzz) drawZzz(p, o.flip ? left + 1 * k : left + g.w - 6 * k, top - 3 * k, t, k);
}

// -----------------------------------------------------------------------------
// Brincadeira: o Ozzy dá voltas correndo pela sala, para e late, e depois deita
// no tapete e pega no sono. Animação por tempo; quem chama só passa os ms desde
// o começo da brincadeira (e, se quiser, o caminho).
// -----------------------------------------------------------------------------
export type OzzyPlayPhase = 'correndo' | 'latindo' | 'deitando' | 'dormindo';

export interface OzzyPlayFrame {
  /** centro horizontal e linha das patas (pixels da cena) */
  x: number;
  y: number;
  /** pose para drawDog */
  pose: DogPose;
  /** virado para a esquerda (drawDog flip) */
  flip: boolean;
  /** nome do quadro (dogFramePix) */
  frame: string;
  phase: OzzyPlayPhase;
  /** true no quadro do "au!" (a UI pode tocar o latido quando mudar para true) */
  bark: boolean;
  /** já dormiu (a brincadeira acabou; ele fica dormindo no último ponto) */
  done: boolean;
  /** tempo (ms) para passar ao drawDog e obter exatamente este quadro */
  t: number;
}

export interface OzzyPlayOpts {
  /** velocidade da corrida em px/s (padrão 95) */
  speed?: number;
  /** quanto tempo late em cada parada (padrão 760 ms) */
  barkMs?: number;
  /** quanto tempo leva para deitar antes de dormir (padrão 1300 ms) */
  settleMs?: number;
}

/**
 * Caminho padrão da brincadeira por cômodo (pixels da cena 320×180, linha das patas).
 * O último ponto é onde ele dorme (na sala, o tapete vermelho); ele late em cada
 * ponto do meio.
 */
export const OZZY_PLAY_PATHS: Record<string, [number, number][]> = {
  sala: [
    [70, 148],
    [262, 150],
    [118, 140],
    [282, 140],
    [196, 140],
  ],
  cozinha: [
    [70, 150],
    [250, 150],
    [120, 142],
    [112, 136],
  ],
  quarto: [
    [110, 148],
    [250, 146],
    [140, 146],
    [180, 140],
  ],
  porta: [
    [80, 160],
    [240, 160],
    [150, 158],
  ],
};

/** duração total (ms) até ele pegar no sono, para o caminho dado */
export function ozzyPlayDuration(path: [number, number][] = OZZY_PLAY_PATHS.sala, o: OzzyPlayOpts = {}): number {
  const speed = (o.speed ?? 95) / 1000;
  let d = 0;
  for (let i = 1; i < path.length; i++) d += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]) / speed;
  return d + Math.max(0, path.length - 2) * (o.barkMs ?? 760) + (o.settleMs ?? 1300);
}

/**
 * Onde o Ozzy está e o que faz `elapsed` ms depois de começar a brincadeira.
 * Corre de um ponto ao outro (virando para o lado do movimento), late parado em
 * cada ponto do meio, no último deita (`deitando`) e depois dorme para sempre.
 */
export function ozzyPlayAt(elapsed: number, path: [number, number][] = OZZY_PLAY_PATHS.sala, o: OzzyPlayOpts = {}): OzzyPlayFrame {
  const pts = path.length ? path : OZZY_PLAY_PATHS.sala;
  const speed = (o.speed ?? 95) / 1000;
  const barkMs = o.barkMs ?? 760;
  const settleMs = o.settleMs ?? 1300;
  let t = Math.max(0, elapsed);
  let flip = false;
  const mk = (x: number, y: number, pose: DogPose, phase: OzzyPlayPhase, tt: number, done = false): OzzyPlayFrame => {
    const frame = frameKey(pose, tt);
    return { x: Math.round(x), y: Math.round(y), pose, flip, frame, phase, bark: frame === 'latindo1', done, t: tt };
  };
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const dur = Math.hypot(x1 - x0, y1 - y0) / speed;
    if (x1 !== x0) flip = x1 < x0;
    if (t < dur) {
      const u = dur > 0 ? t / dur : 1;
      return mk(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, 'correndo', 'correndo', elapsed);
    }
    t -= dur;
    if (i < pts.length - 1) {
      if (t < barkMs) {
        // late virado para o centro da sala
        flip = x1 > 160;
        return mk(x1, y1, 'latindo', 'latindo', t);
      }
      t -= barkMs;
    }
  }
  const [lx, ly] = pts[pts.length - 1];
  if (t < settleMs) return mk(lx, ly, 'deitando', 'deitando', t);
  return mk(lx, ly, 'dormindo', 'dormindo', elapsed, true);
}

/** Desenha o quadro da brincadeira num Pix (balão "AU!" e "zzz" incluídos). */
export function drawOzzyPlay(p: Pix, elapsed: number, o: DogDrawOpts & OzzyPlayOpts & { path?: [number, number][] } = {}): OzzyPlayFrame {
  const f = ozzyPlayAt(elapsed, o.path, o);
  drawDog(p, f.x, f.y, f.pose, f.t, { ...o, flip: f.flip, zzz: true });
  return f;
}

const ballCache = new Map<number, Pix>();
function ballPix(k = 1): Pix {
  let b = ballCache.get(k);
  if (!b) {
    if (k > 1) b = ballPix(1).scaled(k);
    else {
      b = new Pix(BALL.w + 2, BALL.h + 2);
      b.sprite(BALL, 1, 1);
      b.outline('#120c08');
    }
    ballCache.set(k, b);
  }
  return b;
}

const portraitCache = new Map<string, Pix>();

/**
 * Retrato 64×64 do Ozzy (o sprite ampliado no fundo quente de casa dos retratos),
 * para a interface usar como ícone. blend = Desgaste/100, como nos retratos da família.
 */
export function dogPortraitPix(pose: DogPose = 'sentado', t = 0, blend = 0): Pix {
  const q = quantize(blend, 20);
  const key = `${frameKey(pose, t)}|${q}`;
  let p = portraitCache.get(key);
  if (!p) {
    p = new Pix(64, 64).setMap(q > 0 ? homeGrader(q) : null);
    // o mesmo fundo "casa" dos retratos: parede de reboco, quadro desfocado, luz da lâmpada
    p.vgrad(0, 0, 64, 64, ['#c9975c', '#b9864e', '#a07042'], 0.7);
    p.recta(46, 10, 14, 18, '#8a5e36', 0.35);
    p.recta(48, 12, 10, 14, '#d8b07a', 0.3);
    p.recta(0, 0, 5, 64, '#7a5030', 0.3);
    p.glow(12, 8, 26, '#ffe2a3', 0.42, 5);
    // tapete de retalhos onde ele senta
    p.ellipse(32, 60, 30, 6, '#5f7fa8');
    p.ellipse(32, 60, 24, 4.5, '#c8a050');
    p.ellipse(32, 60, 17, 3, '#a8413a');
    // sentado e dormindo cabem ×3; deitado e brincando (com a bolinha) só ×2
    const k = pose === 'sentado' || pose === 'dormindo' ? 3 : 2;
    drawDog(p, pose === 'brincando' ? 26 : 32, 61, pose, t, { map: p.map, mapKey: 'p' + q, scale: k });
    portraitCache.set(key, p);
    if (portraitCache.size > 40) portraitCache.delete(portraitCache.keys().next().value as string);
  }
  return p;
}

const portraitUrls = new Map<string, string>();

/** Retrato do Ozzy como dataURL PNG (nativo 64×64; size em múltiplos de 64 amplia). Fora do navegador devolve ''. */
export function dogPortrait(pose: DogPose = 'sentado', o: { t?: number; blend?: number; size?: number } = {}): string {
  if (!hasDOM()) return '';
  const size = Math.max(64, Math.round((o.size ?? 64) / 64) * 64);
  const key = `${frameKey(pose, o.t ?? 0)}|${quantize(o.blend ?? 0, 20)}|${size}`;
  let u = portraitUrls.get(key);
  if (!u) {
    u = dogPortraitPix(pose, o.t ?? 0, o.blend ?? 0).toDataURL(size / 64);
    portraitUrls.set(key, u);
  }
  return u;
}
