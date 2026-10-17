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

export type DogPose = 'sentado' | 'deitado' | 'dormindo' | 'brincando';
export const DOG_POSES: DogPose[] = ['sentado', 'deitado', 'dormindo', 'brincando'];

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
    case 'brincando':
    default:
      return `brincando${Math.floor(t / 320) % 2}`;
  }
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
