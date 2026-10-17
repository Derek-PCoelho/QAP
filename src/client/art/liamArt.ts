// =============================================================================
// Os desenhos do Liam na escala da cena (presos na geladeira, na parede do
// quarto, molhados no sofá…), em três níveis que acompanham as aulas de
// desenho com a Dona Iolanda:
//   0 — giz de cera: cores puras, traço que falha, preenchimento rabiscado;
//   1 — traço firme (1–2 aulas): contorno de canetinha contínuo, cor chapada e
//       uma linha de chão com sombra;
//   2 — grafite e aquarela (3+ aulas): contorno cinza de lápis, aguadas claras
//       com a borda mais escura e um passe-partout creme em volta.
// Cada assunto é escrito uma vez com um "pincel" (Brush) e sai nos três estilos.
// =============================================================================
import { Pix, hash2 } from './pix';
import { mix, shade } from './palette';
import { drawText } from './font';

export type LiamSubject =
  | 'ambulancia'
  | 'ambulancia_perdida'
  | 'familia'
  | 'casa'
  | 'sol'
  | 'jairo'
  | 'onibus'
  | 'moco_escada'
  | 'central'
  | 'um_dia'
  | 'bene'
  | 'cidade'
  | 'raiva'
  | 'secreto';

export const LIAM_SUBJECTS: LiamSubject[] = ['ambulancia', 'ambulancia_perdida', 'familia', 'casa', 'sol', 'jairo', 'onibus', 'moco_escada', 'central', 'um_dia', 'bene', 'cidade', 'raiva', 'secreto'];

const PAPER = '#f4efe2';

/** cores de giz/canetinha */
const C = {
  red: '#d8322a',
  blue: '#2e5fc0',
  lblue: '#5aa0e0',
  green: '#3a9a3a',
  yellow: '#f2c81a',
  orange: '#f08a1a',
  brown: '#8a5228',
  black: '#2a2a2a',
  pink: '#e86a9a',
  purple: '#7a4aa8',
  skin: '#e8b48a',
  white: '#ffffff',
  gray: '#8a8a8a',
};

interface Brush {
  level: 0 | 1 | 2;
  /** contorno (giz preto falhando / canetinha / grafite) */
  ink(x0: number, y0: number, x1: number, y1: number, col?: string): void;
  /** área de cor (rabisco / chapada / aguada) */
  paint(x: number, y: number, w: number, h: number, col: string): void;
  px(x: number, y: number, col: string): void;
}

function brush(p: Pix, level: 0 | 1 | 2, seed: number): Brush {
  let k = seed * 13;
  return {
    level,
    ink(x0, y0, x1, y1, col) {
      const c = level === 2 ? '#6a6a70' : level === 1 ? '#1b1a17' : col ?? C.black;
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) {
        k++;
        if (level === 0 && hash2(k, 3, seed) < 0.16) continue;
        const jy = level === 0 && hash2(k, 5, seed) < 0.12 ? 1 : 0;
        p.px(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n) + jy, c);
      }
    },
    paint(x, y, w, h, col) {
      for (let yy = y; yy < y + h; yy++)
        for (let xx = x; xx < x + w; xx++) {
          if (level === 0) {
            // rabisco: diagonais com falhas
            if ((xx + yy) % 2 === 1 && hash2(xx, yy, seed) < 0.75) continue;
            p.px(xx, yy, col);
          } else if (level === 1) p.px(xx, yy, col);
          else {
            // aguada: clara, com a borda de baixo mais escura (onde a tinta secou)
            const edge = yy === y + h - 1 || xx === x + w - 1;
            p.px(xx, yy, edge ? mix(col, PAPER, 0.25) : mix(col, PAPER, 0.5));
          }
        }
    },
    px(x, y, col) {
      p.px(x, y, level === 2 ? mix(col, PAPER, 0.35) : col);
    },
  };
}

/** boneco de desenho (cabeça 2×2, corpo 2×h) */
function stick(b: Brush, x: number, base: number, h: number, shirt: string, hair = '#3b2516', small = false): void {
  const top = base - h;
  b.paint(x, top, 2, 2, C.skin);
  b.px(x, top - 1, hair);
  b.px(x + 1, top - 1, hair);
  b.paint(x - (small ? 0 : 1), top + 2, small ? 2 : 4, h - 4, shirt);
  b.ink(x, base - 2, x, base, C.black);
  b.ink(x + 1, base - 2, x + 1, base, C.black);
}

function subject(b: Brush, s: LiamSubject, x: number, y: number, w: number, h: number): void {
  const cx = x + Math.floor(w / 2);
  const by = y + h - 2;
  const ground = () => {
    if (b.level >= 1) b.paint(x + 1, by, w - 2, 1, b.level === 2 ? '#7a9a5a' : C.green);
  };
  switch (s) {
    case 'ambulancia':
    case 'bene': {
      const aw = Math.max(7, w - 4);
      const ax = x + 2;
      const ay = by - 5;
      b.paint(ax + 1, ay + 1, aw - 2, 3, C.white);
      b.ink(ax, ay, ax + aw - 1, ay);
      b.ink(ax, ay + 4, ax + aw - 1, ay + 4);
      b.ink(ax, ay, ax, ay + 4);
      b.ink(ax + aw - 1, ay, ax + aw - 1, ay + 4);
      b.px(ax + 2, ay + 2, C.red);
      b.px(ax + 3, ay + 2, C.red);
      b.px(ax + 2, ay + 1, C.red);
      b.px(ax + 1, ay - 1, C.red);
      b.px(ax + 2, ay - 1, C.blue);
      b.px(ax + 1, ay + 5, C.black);
      b.px(ax + aw - 2, ay + 5, C.black);
      if (s === 'bene') {
        // o motorista de bigode na janela
        b.px(ax + aw - 3, ay + 1, C.skin);
        b.px(ax + aw - 3, ay + 2, C.white);
        b.px(ax + aw - 4, ay + 2, '#e8e4dc');
      } else b.px(ax + aw - 2, ay + 1, C.lblue);
      if (b.level >= 1) b.paint(ax + 4, ay + 2, aw - 6, 1, C.orange);
      if (h > 9) {
        b.px(x + w - 3, y + 2, C.yellow);
        b.px(x + w - 2, y + 2, C.yellow);
      }
      ground();
      break;
    }
    case 'ambulancia_perdida': {
      // a USB rodando entre placas, com um ponto de interrogação
      subject(b, 'ambulancia', x, y + 1, w - 3, h - 1);
      b.ink(x + w - 2, by - 6, x + w - 2, by);
      b.paint(x + w - 4, by - 8, 4, 2, C.green);
      b.ink(x + 1, by - 7, x + 1, by - 1);
      b.paint(x, by - 9, 3, 2, C.green);
      b.px(cx, y + 1, C.black);
      b.px(cx + 1, y + 2, C.black);
      b.px(cx, y + 3, C.black);
      b.px(cx, y + 5, C.black);
      break;
    }
    case 'familia': {
      const n = 4;
      const step = Math.max(2, Math.floor((w - 3) / n));
      const shirts = ['#4f8a6e', C.red, C.blue, C.purple];
      for (let i = 0; i < n; i++) stick(b, x + 1 + i * step, by, i === 2 ? 5 : 7, shirts[i], i === 3 ? '#bdbdb5' : '#3b2516', i === 2);
      b.px(x + w - 3, by - 1, C.orange);
      b.px(x + w - 2, by - 1, C.orange);
      ground();
      break;
    }
    case 'casa': {
      b.paint(cx - 3, by - 4, 7, 4, b.level === 0 ? C.blue : '#6a8ad0');
      b.ink(cx - 4, by - 4, cx, by - 7, C.red);
      b.ink(cx, by - 7, cx + 4, by - 4, C.red);
      b.px(cx, by - 2, C.brown);
      b.px(cx, by - 1, C.brown);
      b.px(x + 1, y + 1, C.yellow);
      b.px(x + 2, y + 2, C.yellow);
      ground();
      break;
    }
    case 'sol': {
      const sy = y + Math.floor(h / 2) - 1;
      b.paint(cx - 1, sy - 1, 3, 3, C.yellow);
      b.px(cx - 3, sy, C.orange);
      b.px(cx + 3, sy, C.orange);
      b.px(cx, sy - 3, C.orange);
      b.px(cx, sy + 3, C.orange);
      b.paint(x + 1, by, w - 2, 1, C.green);
      break;
    }
    case 'jairo': {
      // "O DOUTOR DA GELADEIRA": a geladeira e o homem de boné com o estetoscópio
      b.paint(x + 2, by - 8, 4, 8, C.white);
      b.ink(x + 2, by - 8, x + 5, by - 8);
      b.ink(x + 2, by - 4, x + 5, by - 4);
      stick(b, x + 8, by, 7, C.blue);
      b.px(x + 8, by - 8, C.red);
      b.px(x + 9, by - 8, C.red);
      b.px(x + 7, by - 4, C.black);
      b.px(x + 6, by - 4, C.black);
      ground();
      break;
    }
    case 'onibus': {
      const bw = w - 3;
      b.paint(x + 1, by - 5, bw, 4, C.yellow);
      b.ink(x + 1, by - 6, x + bw, by - 6);
      for (let i = 0; i < bw - 2; i += 3) b.px(x + 2 + i, by - 4, C.lblue);
      b.px(x + 2, by - 1, C.black);
      b.px(x + bw - 1, by - 1, C.black);
      if (b.level >= 1 && w >= 12) {
        b.px(x + bw - 2, by - 3, C.black);
        b.px(x + bw - 3, by - 3, C.black);
      }
      ground();
      break;
    }
    case 'moco_escada': {
      // o moço sentado na escada do terceiro andar, com a bala na mão
      for (let i = 0; i < 4; i++) b.ink(x + 1 + i * 2, by - i * 2, x + 3 + i * 2, by - i * 2, C.brown);
      stick(b, x + 5, by - 3, 5, '#e8e4dc', '#1c1410');
      b.px(x + 7, by - 5, C.pink);
      break;
    }
    case 'central': {
      // a central: a mesa com o telefone, você de fone e a tela com o mapa
      b.paint(x + 2, by - 3, w - 4, 2, C.brown);
      stick(b, cx - 2, by - 3, 6, '#4f8a6e', '#1c1410');
      b.px(cx - 3, by - 8, C.black);
      b.paint(x + w - 6, by - 8, 4, 3, b.level === 2 ? '#5a7a6c' : C.green);
      b.px(x + 3, by - 4, C.red);
      if (b.level >= 1) b.ink(x + 2, by - 1, x + w - 3, by - 1);
      break;
    }
    case 'um_dia': {
      // você e ele no açude, com a vara de pescar
      b.paint(x + 1, by - 2, w - 2, 2, b.level === 0 ? C.blue : C.lblue);
      stick(b, x + 2, by - 2, 6, '#4f8a6e');
      stick(b, x + 5, by - 2, 4, C.blue, '#3b2516', true);
      b.ink(x + 7, by - 6, x + w - 2, by - 8, C.brown);
      b.px(x + w - 2, by - 7, C.black);
      b.px(x + w - 3, y + 1, C.yellow);
      break;
    }
    case 'cidade': {
      // a cidade "pra ambulância não se perder": ruas em grade, casinhas e a casa com ponto vermelho
      for (let i = 1; i < w - 1; i += 4) b.ink(x + i, y + 2, x + i, by, C.gray);
      for (let j = y + 3; j < by; j += 3) b.ink(x + 1, j, x + w - 2, j, C.gray);
      b.px(x + 5, y + 4, C.red);
      b.px(x + 6, y + 4, C.red);
      break;
    }
    case 'raiva': {
      // riscado com força
      for (let i = 0; i < 6; i++) {
        const a = hash2(i, 1, 77);
        b.ink(x + 1 + Math.floor(a * 3), y + 1 + i, x + w - 2, y + h - 2 - Math.floor(hash2(i, 2, 77) * 3), C.black);
      }
      b.px(cx, y + 2, C.red);
      break;
    }
    case 'secreto':
      break;
  }
}

/**
 * Um desenho do Liam numa folha w×h em (x, y), com o ímã ou a fita em cima.
 * `level` 0/1/2 pelas aulas de desenho; `magnet` = ímã de pizzaria (o do
 * Toninho, vermelho com a fatia) em vez da fita.
 */
export function liamDrawing(p: Pix, x: number, y: number, w: number, h: number, s: LiamSubject, level: 0 | 1 | 2 = 0, seed = 1, magnet = false): void {
  if (s === 'secreto') {
    // a folha virada para a parede: o verso branco, a fita e "SÓ PODE VER AMANHÃ" em letra de criança
    p.rect(x, y, w, h, '#fbf8f0');
    p.hl(x, x + w - 1, y + h - 1, '#d8ceb8');
    p.vl(x + w - 1, y, y + h - 1, '#d8ceb8');
    for (let i = 0; i < 3; i++) for (let xx = x + 1; xx < x + w - 2; xx++) if (hash2(xx, i, seed) < 0.7) p.px(xx, y + 2 + i * 3, i === 1 ? '#d8322a' : '#2e5fc0');
    p.rect(x + Math.floor(w / 2) - 2, y - 1, 5, 2, '#e8e4c8');
    return;
  }
  // folha (no nível 2, com passe-partout e moldurinha)
  if (level === 2) {
    p.rect(x - 1, y - 1, w + 2, h + 2, '#8a6a44');
    p.rect(x, y, w, h, '#efe6cf');
    p.rect(x + 1, y + 1, w - 2, h - 2, PAPER);
  } else {
    p.rect(x, y, w, h, PAPER);
    p.hl(x, x + w - 1, y + h - 1, '#d8ceb8');
    p.vl(x + w - 1, y, y + h - 1, '#d8ceb8');
  }
  const b = brush(p, level, seed);
  const pad = level === 2 ? 1 : 0;
  subject(b, s, x + pad, y + pad, w - pad * 2, h - pad * 2);
  // assinatura: no giz, um risco tremido; no traço firme e no grafite, as iniciais
  if (w >= 9) {
    if (level === 0) {
      for (let i = 1; i < Math.min(w - 2, 6); i++) if (hash2(x + i, y, seed) < 0.7) p.px(x + i, y + h - 2, '#8a8478');
    } else p.hl(x + w - 4, x + w - 2, y + h - 2, level === 2 ? '#8a8a90' : '#2e5fc0');
  }
  // ímã de pizzaria ou fita
  if (magnet) {
    const mx = x + Math.floor(w / 2) - 2;
    p.rect(mx, y - 2, 5, 3, '#c8302a');
    p.px(mx + 1, y - 1, '#f2d45c');
    p.px(mx + 2, y - 2, '#f2d45c');
    p.px(mx + 3, y - 1, '#e8a33d');
  } else if (level !== 2) p.rect(x + Math.floor(w / 2) - 1, y - 1, 3, 2, seed % 2 ? '#e8566a' : '#5aa7d6');
}

/** desenhos molhados (dia 17): o papel ondulado e a tinta escorrida */
export function wetDrawing(p: Pix, x: number, y: number, w: number, h: number, s: LiamSubject, level: 0 | 1 | 2, seed: number): void {
  liamDrawing(p, x, y, w, h, s, level, seed);
  for (let xx = x; xx < x + w; xx++) {
    if (hash2(xx, 1, seed) < 0.4) p.pxa(xx, y + h - 2 - Math.floor(hash2(xx, 2, seed) * 3), '#5a7a9a', 0.35);
    if (xx % 3 === 0) p.pxa(xx, y + Math.floor(h / 2), '#c8d4e0', 0.3);
  }
  p.pxa(x, y, '#8a9ab0', 0.4);
}

void shade;
void drawText;
