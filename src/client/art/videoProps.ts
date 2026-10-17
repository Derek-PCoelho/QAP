// =============================================================================
// Videochamada: objetos da cena (remédios, garrafa, caneta de insulina, moto,
// carro batido, viatura, berço, churrasqueira, galão de veneno…).
// Cada objeto é desenhado num Pix próprio, com contorno escuro, a partir da
// escala k (1 = tamanho no plano geral, perto do paciente; 3–4 = close).
// Âncora = ponto de apoio no chão (centro de baixo). Puro (sem DOM).
// =============================================================================
import { Pix } from './pix';
import { shade } from './palette';
import { drawText } from './font';
import type { VideoProp } from '../../engine/types';

const INK = '#1a1418';

export interface PropSprite {
  pix: Pix;
  /** âncora (centro da base) dentro do Pix */
  ax: number;
  ay: number;
}

/** onde o objeto costuma ficar */
export type PropHome = 'chao' | 'mesa' | 'fundo' | 'rua' | 'parede' | 'junto';

export const PROP_HOME: Partial<Record<VideoProp, PropHome>> = {
  remedios: 'mesa', cartela: 'mesa', seringa: 'mesa', caneta_insulina: 'mesa', garrafa: 'mesa', copo: 'mesa', bombinha: 'mesa',
  produto: 'mesa', celular: 'mesa', glicosimetro: 'mesa', mamadeira: 'mesa', termometro: 'mesa', bolo: 'mesa', faca: 'mesa',
  moto: 'rua', carro: 'rua', bicicleta: 'rua', viatura: 'fundo', ambulancia: 'fundo', onibus: 'fundo', poste: 'rua', cones: 'rua',
  quadro_luz: 'parede', aquecedor: 'parede', tv: 'fundo', bexigas: 'parede', andaime: 'fundo', esteira: 'fundo', masseira: 'junto', maquina: 'junto',
};

function sprite(w: number, h: number, draw: (q: Pix, cx: number, by: number) => void, outline = true): PropSprite {
  const q = new Pix(w + 4, h + 4);
  const cx = Math.floor((w + 4) / 2);
  const by = h + 1;
  draw(q, cx, by);
  if (outline) q.outline(INK);
  return { pix: q, ax: cx, ay: by + 1 };
}

const R = (q: Pix, x: number, y: number, w: number, h: number, c: string) => q.rect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)), c);

/** frasco de remédio */
function frasco(q: Pix, x: number, by: number, k: number, cap: string, body = '#f2f2ea'): void {
  R(q, x - 2 * k, by - 7 * k, 4 * k, 7 * k, body);
  R(q, x - 2 * k, by - 9 * k, 4 * k, 2 * k, cap);
  R(q, x - 2 * k, by - 5 * k, 4 * k, 2 * k, shade(cap, 0.25));
  R(q, x + 1 * k, by - 7 * k, Math.max(1, k * 0.8), 7 * k, shade(body, -0.12));
}

const DRAW: Partial<Record<VideoProp, (k: number, variant?: string) => PropSprite>> = {
  remedios: (k) =>
    sprite(Math.ceil(14 * k), Math.ceil(10 * k), (q, cx, by) => {
      frasco(q, cx - 3 * k, by, k, '#3a7ad0');
      frasco(q, cx + 3 * k, by, k * 0.8, '#d04a3a', '#e8e4dc');
      // caixinha
      R(q, cx - 7 * k, by - 3 * k, 5 * k, 3 * k, '#e8d8a0');
      R(q, cx - 7 * k, by - 3 * k, 5 * k, 1 * k, '#c8352a');
    }),
  cartela: (k) =>
    sprite(Math.ceil(12 * k), Math.ceil(4 * k + 2), (q, cx, by) => {
      // cartela de comprimidos deitada, vários buracos vazios
      R(q, cx - 6 * k, by - 3 * k, 12 * k, 3 * k, '#c8ccd0');
      for (let i = 0; i < 5; i++) {
        const empty = i !== 1 && i !== 3;
        R(q, cx - 5 * k + i * 2.2 * k, by - 2.4 * k, Math.max(1, 1.4 * k), Math.max(1, 1.4 * k), empty ? '#7a7e84' : '#f2f2ea');
      }
      R(q, cx - 6 * k, by - 3 * k, 12 * k, Math.max(1, 0.5 * k), '#e8ecf0');
    }),
  seringa: (k) =>
    sprite(Math.ceil(12 * k), Math.ceil(3 * k + 2), (q, cx, by) => {
      R(q, cx - 5 * k, by - 2 * k, 8 * k, 2 * k, '#e8f0f4');
      R(q, cx - 3 * k, by - 2 * k, 4 * k, 2 * k, '#c8e0ec');
      R(q, cx + 3 * k, by - 1.5 * k, 3 * k, Math.max(1, k * 0.6), '#a8acb0');
      R(q, cx - 6 * k, by - 2.5 * k, Math.max(1, k), 3 * k, '#6a6e74');
    }),
  caneta_insulina: (k) =>
    sprite(Math.ceil(14 * k), Math.ceil(3 * k + 2), (q, cx, by) => {
      R(q, cx - 6 * k, by - 2 * k, 11 * k, 2 * k, '#3a5aa0');
      R(q, cx + 2 * k, by - 2 * k, 3 * k, 2 * k, '#e8a33d');
      R(q, cx - 6 * k, by - 2 * k, 11 * k, Math.max(1, 0.5 * k), '#6a8ad0');
      R(q, cx - 7.5 * k, by - 1.5 * k, 1.5 * k, Math.max(1, k), '#c8ccd0');
    }),
  glicosimetro: (k) =>
    sprite(Math.ceil(8 * k), Math.ceil(6 * k), (q, cx, by) => {
      R(q, cx - 3 * k, by - 6 * k, 6 * k, 6 * k, '#2a2a30');
      R(q, cx - 2 * k, by - 5 * k, 4 * k, 2.4 * k, '#8ab0a0');
      R(q, cx - 1 * k, by - 7 * k, 2 * k, 1 * k, '#e8e4dc');
    }),
  garrafa: (k, v) =>
    sprite(Math.ceil(6 * k), Math.ceil(14 * k), (q, cx, by) => {
      const glass = v === 'cachaca' ? '#d8e8e0' : '#3f8a4a';
      R(q, cx - 2 * k, by - 10 * k, 4 * k, 10 * k, glass);
      R(q, cx - 1 * k, by - 14 * k, 2 * k, 4 * k, glass);
      R(q, cx - 2 * k, by - 7 * k, 4 * k, 3 * k, '#e8e0c8');
      R(q, cx - 1.5 * k, by - 10 * k, Math.max(1, 0.6 * k), 9 * k, shade(glass, 0.3));
    }),
  garrafa_quebrada: (k) =>
    sprite(Math.ceil(10 * k), Math.ceil(6 * k), (q, cx, by) => {
      R(q, cx - 4 * k, by - 3 * k, 6 * k, 3 * k, '#3f8a4a');
      q.poly([
        [cx + 2 * k, by - 3 * k],
        [cx + 4 * k, by - 5 * k],
        [cx + 3 * k, by - 2 * k],
        [cx + 5 * k, by - 3 * k],
        [cx + 3 * k, by],
      ], '#5aa060');
      for (let i = 0; i < 3; i++) R(q, cx - 5 * k + i * 4 * k, by - 0.5 * k, Math.max(1, k), Math.max(1, 0.6 * k), '#8ac890');
    }),
  copo: (k) =>
    sprite(Math.ceil(5 * k), Math.ceil(6 * k), (q, cx, by) => {
      R(q, cx - 2 * k, by - 6 * k, 4 * k, 6 * k, '#d8eef4');
      R(q, cx - 2 * k, by - 3 * k, 4 * k, 3 * k, '#e8a33d');
      R(q, cx - 2 * k, by - 6 * k, Math.max(1, 0.6 * k), 6 * k, '#ffffff');
    }),
  bombinha: (k) =>
    sprite(Math.ceil(8 * k), Math.ceil(8 * k), (q, cx, by) => {
      R(q, cx - 2 * k, by - 8 * k, 3 * k, 6 * k, '#3a7ad0');
      R(q, cx - 2 * k, by - 3 * k, 6 * k, 3 * k, '#c8ccd0');
      R(q, cx - 2 * k, by - 9 * k, 3 * k, 1 * k, '#f2f2ea');
    }),
  produto: (k, v) =>
    sprite(Math.ceil(7 * k), Math.ceil(12 * k), (q, cx, by) => {
      const lab = v === 'soda' ? '#e8b931' : '#d04a3a';
      R(q, cx - 3 * k, by - 9 * k, 6 * k, 9 * k, '#f2f2ea');
      R(q, cx - 1 * k, by - 11 * k, 2 * k, 2 * k, lab);
      R(q, cx - 3 * k, by - 6 * k, 6 * k, 3 * k, lab);
      R(q, cx + 1.5 * k, by - 9 * k, Math.max(1, 0.8 * k), 9 * k, '#d8d8d0');
    }),
  galao: (k) =>
    sprite(Math.ceil(10 * k), Math.ceil(12 * k), (q, cx, by) => {
      // galão de agrotóxico sem rótulo
      R(q, cx - 4 * k, by - 10 * k, 8 * k, 10 * k, '#e8e4dc');
      R(q, cx - 4 * k, by - 10 * k, 8 * k, 1 * k, '#ffffff');
      R(q, cx + 1 * k, by - 12 * k, 2 * k, 2 * k, '#2f8a4a');
      R(q, cx - 3 * k, by - 12 * k, 3 * k, 2 * k, '#c8c4bc');
      R(q, cx + 2 * k, by - 10 * k, 2 * k, 10 * k, '#c8c4bc');
      R(q, cx - 3 * k, by - 6 * k, 5 * k, Math.max(1, k), '#5a8a3a');
    }),
  faca: (k) =>
    sprite(Math.ceil(13 * k), Math.ceil(3 * k + 2), (q, cx, by) => {
      R(q, cx - 6 * k, by - 2 * k, 8 * k, Math.max(1, 1.2 * k), '#d8dce0');
      R(q, cx - 6 * k, by - 2 * k, 8 * k, Math.max(1, 0.5 * k), '#ffffff');
      R(q, cx + 2 * k, by - 2.5 * k, 4 * k, 2 * k, '#5a3a2a');
    }),
  arma: (k) =>
    sprite(Math.ceil(9 * k), Math.ceil(5 * k), (q, cx, by) => {
      R(q, cx - 4 * k, by - 4 * k, 7 * k, 2 * k, '#2a2a2e');
      R(q, cx + 1 * k, by - 2 * k, 2 * k, 2.4 * k, '#2a2a2e');
      R(q, cx - 4 * k, by - 4 * k, 7 * k, Math.max(1, 0.5 * k), '#4a4a52');
    }),
  celular: (k) =>
    sprite(Math.ceil(5 * k), Math.ceil(7 * k), (q, cx, by) => {
      R(q, cx - 2 * k, by - 7 * k, 4 * k, 7 * k, '#26262c');
      R(q, cx - 1.5 * k, by - 6 * k, 3 * k, 4.6 * k, '#3a5a7a');
    }),
  mamadeira: (k) =>
    sprite(Math.ceil(5 * k), Math.ceil(9 * k), (q, cx, by) => {
      R(q, cx - 2 * k, by - 7 * k, 4 * k, 7 * k, '#e8f0f4');
      R(q, cx - 2 * k, by - 4 * k, 4 * k, 4 * k, '#f2ecd8');
      R(q, cx - 1 * k, by - 9 * k, 2 * k, 2 * k, '#e8b480');
    }),
  termometro: (k) =>
    sprite(Math.ceil(9 * k), Math.ceil(3 * k), (q, cx, by) => {
      R(q, cx - 4 * k, by - 2 * k, 8 * k, Math.max(1, 1.2 * k), '#e8ecf0');
      R(q, cx - 4 * k, by - 2 * k, 2 * k, Math.max(1, 1.2 * k), '#c8352a');
    }),
  balde: (k, v) =>
    sprite(Math.ceil(10 * k), Math.ceil(9 * k), (q, cx, by) => {
      q.poly([
        [cx - 4 * k, by - 8 * k],
        [cx + 4 * k, by - 8 * k],
        [cx + 3 * k, by],
        [cx - 3 * k, by],
      ], '#3a7ad0');
      q.ellipse(cx, by - 8 * k, 4 * k, 1.4 * k, v === 'hda' ? '#3a2018' : '#4a3a2a');
      R(q, cx - 4 * k, by - 6 * k, 8 * k, Math.max(1, 0.6 * k), '#6a9ae0');
      q.ring(cx, by - 9 * k, 3.5 * k, '#a8acb0');
    }),
  ketchup: (k) =>
    sprite(Math.ceil(14 * k), Math.ceil(7 * k), (q, cx, by) => {
      q.ellipse(cx - 2 * k, by - 1 * k, 5 * k, 1.5 * k, '#c81c1c');
      R(q, cx + 4 * k, by - 6 * k, 2.4 * k, 6 * k, '#c81c1c');
      R(q, cx + 4 * k, by - 7 * k, 2.4 * k, 1 * k, '#f2f2ea');
    }, true),
  boneco: (k) =>
    sprite(Math.ceil(26 * k), Math.ceil(9 * k), (q, cx, by) => {
      // travesseiro com uma camiseta por cima (a "vítima" do trote)
      q.ellipse(cx, by - 3 * k, 12 * k, 3.6 * k, '#e8e8f0');
      q.ellipse(cx + 3 * k, by - 4 * k, 7 * k, 3 * k, '#d04a3a');
      R(q, cx - 1 * k, by - 6 * k, 3 * k, 2 * k, '#d04a3a');
    }),
  tijolos: (k) =>
    sprite(Math.ceil(18 * k), Math.ceil(8 * k), (q, cx, by) => {
      for (let i = 0; i < 3; i++) R(q, cx - 9 * k + i * 6 * k, by - 3 * k, 5 * k, 3 * k, '#b4582f');
      for (let i = 0; i < 2; i++) R(q, cx - 6 * k + i * 6 * k, by - 6 * k, 5 * k, 3 * k, '#a04e2a');
      R(q, cx - 3 * k, by - 8 * k, 5 * k, 2 * k, '#c4683f');
    }),
  fio: (k) =>
    sprite(Math.ceil(30 * k), Math.ceil(18 * k), (q, cx, by) => {
      // fio caído saindo de um poste/parede, ponta faiscando
      q.line(cx - 14 * k, by - 17 * k, cx - 6 * k, by - 4 * k, '#1a1a1a');
      q.line(cx - 6 * k, by - 4 * k, cx + 12 * k, by - 1 * k, '#1a1a1a');
      R(q, cx + 12 * k, by - 2 * k, 2 * k, 2 * k, '#ffe04a');
    }, false),
  quadro_luz: (k) =>
    sprite(Math.ceil(12 * k), Math.ceil(16 * k), (q, cx, by) => {
      R(q, cx - 6 * k, by - 16 * k, 12 * k, 16 * k, '#c8ccd0');
      R(q, cx - 5 * k, by - 15 * k, 10 * k, 14 * k, '#8a8e94');
      for (let i = 0; i < 4; i++) R(q, cx - 4 * k + i * 2.4 * k, by - 12 * k, 1.6 * k, 4 * k, i === 2 ? '#c8352a' : '#2a2a30');
    }),
  aquecedor: (k) =>
    sprite(Math.ceil(12 * k), Math.ceil(16 * k), (q, cx, by) => {
      R(q, cx - 5 * k, by - 16 * k, 10 * k, 16 * k, '#e8e8e0');
      R(q, cx - 3 * k, by - 6 * k, 6 * k, 3 * k, '#2a2a30');
      R(q, cx - 2 * k, by - 5 * k, 4 * k, 1 * k, '#5a9ae8');
      R(q, cx - 1 * k, by - 19 * k, 2 * k, 3 * k, '#a8acb0');
    }),
  oxigenio: (k) =>
    sprite(Math.ceil(6 * k), Math.ceil(16 * k), (q, cx, by) => {
      R(q, cx - 2.5 * k, by - 13 * k, 5 * k, 13 * k, '#3f8a5a');
      R(q, cx - 1 * k, by - 15 * k, 2 * k, 2 * k, '#c8ccd0');
      R(q, cx - 2.5 * k, by - 13 * k, Math.max(1, 0.8 * k), 13 * k, '#5aa070');
    }),
  mochila: (k) =>
    sprite(Math.ceil(10 * k), Math.ceil(11 * k), (q, cx, by) => {
      q.ellipse(cx, by - 5 * k, 4.5 * k, 5.5 * k, '#2f4a6a');
      R(q, cx - 3 * k, by - 4 * k, 6 * k, 3 * k, '#3a5a7a');
      R(q, cx - 1 * k, by - 11 * k, 2 * k, 1.5 * k, '#2a2a30');
    }),
  toalha: (k) =>
    sprite(Math.ceil(16 * k), Math.ceil(5 * k), (q, cx, by) => {
      q.ellipse(cx, by - 2 * k, 8 * k, 2.4 * k, '#e8e4dc');
      R(q, cx - 5 * k, by - 2 * k, 10 * k, Math.max(1, 0.8 * k), '#3a7ad0');
    }),
  gelo: (k) =>
    sprite(Math.ceil(8 * k), Math.ceil(5 * k), (q, cx, by) => {
      q.ellipse(cx, by - 2 * k, 4 * k, 2.4 * k, '#d8eef8');
      R(q, cx - 2 * k, by - 3 * k, 2 * k, 2 * k, '#ffffff');
    }),
  vasos: (k) =>
    sprite(Math.ceil(22 * k), Math.ceil(8 * k), (q, cx, by) => {
      // vasos de planta quebrados, terra espalhada
      q.ellipse(cx, by - 1 * k, 10 * k, 2 * k, '#6a4a30');
      for (let i = 0; i < 4; i++) q.poly([
        [cx - 8 * k + i * 5 * k, by - 1 * k],
        [cx - 6 * k + i * 5 * k, by - 4 * k],
        [cx - 4 * k + i * 5 * k, by - 1 * k],
      ], '#b8683a');
      R(q, cx + 4 * k, by - 7 * k, 1 * k, 4 * k, '#4f8a3a');
    }),
  pau: (k) =>
    sprite(Math.ceil(18 * k), Math.ceil(4 * k), (q, cx, by) => {
      q.line(cx - 8 * k, by - 1 * k, cx + 8 * k, by - 3 * k, '#7a5236');
      q.line(cx - 8 * k, by, cx + 8 * k, by - 2 * k, '#5a3a24');
    }),
  vidro: (k) =>
    sprite(Math.ceil(16 * k), Math.ceil(4 * k), (q, cx, by) => {
      for (let i = 0; i < 6; i++) q.poly([
        [cx - 7 * k + i * 2.6 * k, by],
        [cx - 6 * k + i * 2.6 * k, by - 2 * k - (i % 2) * k],
        [cx - 5 * k + i * 2.6 * k, by],
      ], '#c8e8f0');
    }, false),
  brinquedo: (k) =>
    sprite(Math.ceil(9 * k), Math.ceil(6 * k), (q, cx, by) => {
      R(q, cx - 4 * k, by - 4 * k, 4 * k, 4 * k, '#e8b931');
      R(q, cx, by - 3 * k, 3 * k, 3 * k, '#4fae5b');
      R(q, cx - 2 * k, by - 6 * k, 3 * k, 2 * k, '#c8352a');
    }),
  bola: (k) =>
    sprite(Math.ceil(7 * k), Math.ceil(7 * k), (q, cx, by) => {
      q.disc(cx, by - 3 * k, 3 * k, '#f2f2ea');
      q.disc(cx, by - 3 * k, 1.2 * k, '#2a2a30');
      R(q, cx - 3 * k, by - 3.4 * k, 1 * k, 1 * k, '#2a2a30');
    }),
  livros: (k) =>
    sprite(Math.ceil(10 * k), Math.ceil(6 * k), (q, cx, by) => {
      R(q, cx - 5 * k, by - 2 * k, 10 * k, 2 * k, '#3a6ab0');
      R(q, cx - 4 * k, by - 4 * k, 8 * k, 2 * k, '#c8352a');
      R(q, cx - 4 * k, by - 6 * k, 9 * k, 2 * k, '#e8b931');
    }),
  pipoca: (k) =>
    sprite(Math.ceil(6 * k), Math.ceil(8 * k), (q, cx, by) => {
      q.poly([
        [cx - 3 * k, by - 6 * k],
        [cx + 3 * k, by - 6 * k],
        [cx + 2 * k, by],
        [cx - 2 * k, by],
      ], '#e8e4dc');
      R(q, cx - 1 * k, by - 6 * k, 1 * k, 6 * k, '#c8352a');
      q.disc(cx, by - 7 * k, 2.5 * k, '#f8f0c8');
    }),
  videogame: (k) =>
    sprite(Math.ceil(8 * k), Math.ceil(4 * k), (q, cx, by) => {
      q.ellipse(cx, by - 2 * k, 4 * k, 1.6 * k, '#2a2a30');
      R(q, cx - 2.5 * k, by - 2.5 * k, Math.max(1, k), Math.max(1, k), '#c8352a');
    }),
  fralda: (k) =>
    sprite(Math.ceil(8 * k), Math.ceil(5 * k), (q, cx, by) => {
      q.ellipse(cx, by - 2 * k, 4 * k, 2 * k, '#f2f0ea');
      R(q, cx - 1 * k, by - 3 * k, 2 * k, 1 * k, '#9ad0e8');
    }),
  bengala: (k) =>
    sprite(Math.ceil(10 * k), Math.ceil(4 * k), (q, cx, by) => {
      q.line(cx - 5 * k, by - 1 * k, cx + 4 * k, by - 2 * k, '#6a4a32');
      R(q, cx + 4 * k, by - 3 * k, 2 * k, 1 * k, '#6a4a32');
    }),
  sacola: (k) =>
    sprite(Math.ceil(8 * k), Math.ceil(9 * k), (q, cx, by) => {
      R(q, cx - 3.5 * k, by - 7 * k, 7 * k, 7 * k, '#f2f0ea');
      q.ring(cx, by - 8 * k, 2 * k, '#d8d4cc');
      R(q, cx - 2 * k, by - 5 * k, 4 * k, 2 * k, '#c8352a');
      q.disc(cx + 1 * k, by - 8 * k, 1.4 * k, '#e8902a');
    }),
  bolo: (k) =>
    sprite(Math.ceil(10 * k), Math.ceil(9 * k), (q, cx, by) => {
      R(q, cx - 5 * k, by - 5 * k, 10 * k, 5 * k, '#f0d8e0');
      R(q, cx - 5 * k, by - 5 * k, 10 * k, 1.4 * k, '#c86a8a');
      R(q, cx - 0.5 * k, by - 8 * k, Math.max(1, k), 3 * k, '#3a7ad0');
    }),
  panela: (k) =>
    sprite(Math.ceil(12 * k), Math.ceil(6 * k), (q, cx, by) => {
      R(q, cx - 4 * k, by - 5 * k, 8 * k, 5 * k, '#a8acb0');
      R(q, cx - 4 * k, by - 5 * k, 8 * k, 1 * k, '#d8dce0');
      R(q, cx + 4 * k, by - 4 * k, 3 * k, Math.max(1, k), '#2a2a30');
    }),
  fumaca: (k) =>
    sprite(Math.ceil(22 * k), Math.ceil(26 * k), (q, cx, by) => {
      for (let i = 0; i < 6; i++) q.disc(cx + Math.sin(i * 1.7) * 4 * k, by - 4 * k - i * 3.6 * k, (3 + i * 0.9) * k, i % 2 ? '#8a8e94' : '#a8acb0', 0.7);
    }, false),
  fogo: (k) =>
    sprite(Math.ceil(12 * k), Math.ceil(14 * k), (q, cx, by) => {
      q.poly([
        [cx - 5 * k, by],
        [cx - 4 * k, by - 6 * k],
        [cx - 1 * k, by - 4 * k],
        [cx, by - 13 * k],
        [cx + 2 * k, by - 5 * k],
        [cx + 4 * k, by - 8 * k],
        [cx + 5 * k, by],
      ], '#e8602a');
      q.poly([
        [cx - 3 * k, by],
        [cx - 1 * k, by - 6 * k],
        [cx + 1 * k, by - 3 * k],
        [cx + 3 * k, by],
      ], '#f8d050');
    }, false),
  agua: (k) =>
    sprite(Math.ceil(30 * k), Math.ceil(5 * k), (q, cx, by) => {
      q.ellipse(cx, by - 2 * k, 14 * k, 2.4 * k, '#8ab8d0', 0.75);
      q.hl(cx - 8 * k, cx - 2 * k, by - 2 * k, '#c8e8f4');
    }, false),
  cones: (k) =>
    sprite(Math.ceil(26 * k), Math.ceil(10 * k), (q, cx, by) => {
      for (const dx of [-9, 0, 9])
        q.poly([
          [cx + (dx - 3) * k, by],
          [cx + dx * k, by - 9 * k],
          [cx + (dx + 3) * k, by],
        ], '#e8702a');
      for (const dx of [-9, 0, 9]) R(q, cx + (dx - 2) * k, by - 5 * k, 4 * k, Math.max(1, k), '#f2f2ea');
    }),
  cachorro: (k) =>
    sprite(Math.ceil(18 * k), Math.ceil(12 * k), (q, cx, by) => {
      q.ellipse(cx, by - 6 * k, 6 * k, 3.5 * k, '#a8784a');
      q.disc(cx + 6 * k, by - 9 * k, 3 * k, '#a8784a');
      R(q, cx + 8 * k, by - 9 * k, 2.5 * k, 1.6 * k, '#8a5a34');
      R(q, cx + 4 * k, by - 12 * k, 2 * k, 2 * k, '#6a4428');
      for (const dx of [-4, -1, 3, 5]) R(q, cx + dx * k, by - 3 * k, 1.4 * k, 3 * k, '#8a5a34');
      R(q, cx - 7 * k, by - 9 * k, 1.4 * k, 3 * k, '#a8784a');
      R(q, cx + 7 * k, by - 10 * k, Math.max(1, 0.8 * k), Math.max(1, 0.8 * k), '#1a1418');
    }),
  gato: (k) =>
    sprite(Math.ceil(12 * k), Math.ceil(9 * k), (q, cx, by) => {
      q.ellipse(cx, by - 3 * k, 4 * k, 2.5 * k, '#6a6a72');
      q.disc(cx + 4 * k, by - 6 * k, 2.2 * k, '#6a6a72');
      R(q, cx + 3 * k, by - 9 * k, 1 * k, 1.5 * k, '#6a6a72');
      R(q, cx + 5 * k, by - 9 * k, 1 * k, 1.5 * k, '#6a6a72');
      q.line(cx - 4 * k, by - 3 * k, cx - 7 * k, by - 7 * k, '#6a6a72');
    }),
  animal: (k) => DRAW.cachorro!(k),
  capacete: (k) =>
    sprite(Math.ceil(10 * k), Math.ceil(8 * k), (q, cx, by) => {
      q.ellipse(cx, by - 4 * k, 4.5 * k, 4 * k, '#c8352a');
      R(q, cx - 4.5 * k, by - 4 * k, 9 * k, 4 * k, '#c8352a');
      R(q, cx - 1 * k, by - 5 * k, 5 * k, 2.4 * k, '#26303a');
      R(q, cx - 3 * k, by - 7 * k, 2 * k, 1 * k, '#e86a5a');
    }),
  cadeira_rodas: (k) =>
    sprite(Math.ceil(18 * k), Math.ceil(20 * k), (q, cx, by) => {
      q.ring(cx - 2 * k, by - 6 * k, 6 * k, '#4a4e54');
      q.ring(cx - 2 * k, by - 6 * k, 5 * k, '#6a6e74');
      R(q, cx - 6 * k, by - 12 * k, 12 * k, 2 * k, '#2a2a30');
      R(q, cx + 4 * k, by - 20 * k, 2 * k, 10 * k, '#2a2a30');
      R(q, cx + 5 * k, by - 3 * k, 2 * k, 3 * k, '#4a4e54');
    }, false),
  andador: (k) =>
    sprite(Math.ceil(14 * k), Math.ceil(16 * k), (q, cx, by) => {
      for (const dx of [-5, 5]) R(q, cx + dx * k, by - 15 * k, Math.max(1, k), 15 * k, '#a8acb0');
      R(q, cx - 5 * k, by - 15 * k, 11 * k, Math.max(1, k), '#a8acb0');
      R(q, cx - 5 * k, by - 9 * k, 11 * k, Math.max(1, k), '#a8acb0');
    }, false),
  berco: (k) =>
    sprite(Math.ceil(40 * k), Math.ceil(26 * k), (q, cx, by) => {
      R(q, cx - 19 * k, by - 24 * k, 38 * k, 2 * k, '#e8e4dc');
      R(q, cx - 19 * k, by - 10 * k, 38 * k, 3 * k, '#e8e4dc');
      for (let i = 0; i <= 12; i++) R(q, cx - 19 * k + i * 3.1 * k, by - 24 * k, Math.max(1, k), 17 * k, '#f2f0ea');
      R(q, cx - 19 * k, by - 24 * k, 2 * k, 24 * k, '#d8d4cc');
      R(q, cx + 17 * k, by - 24 * k, 2 * k, 24 * k, '#d8d4cc');
      R(q, cx - 17 * k, by - 13 * k, 34 * k, 3 * k, '#9ad0e8');
    }, false),
  carrinho_bebe: (k) =>
    sprite(Math.ceil(20 * k), Math.ceil(20 * k), (q, cx, by) => {
      q.ellipse(cx, by - 10 * k, 8 * k, 5 * k, '#3a5a8a');
      q.poly([
        [cx - 8 * k, by - 10 * k],
        [cx - 2 * k, by - 18 * k],
        [cx + 2 * k, by - 10 * k],
      ], '#2a4a7a');
      q.ring(cx - 6 * k, by - 2 * k, 2 * k, '#2a2a30');
      q.ring(cx + 6 * k, by - 2 * k, 2 * k, '#2a2a30');
      q.line(cx + 6 * k, by - 10 * k, cx + 10 * k, by - 17 * k, '#a8acb0');
    }),
  carrinho: (k) =>
    sprite(Math.ceil(20 * k), Math.ceil(16 * k), (q, cx, by) => {
      for (let y = 0; y < 8; y += 2) q.hl(cx - 8 * k, cx + 6 * k, by - 6 * k - y * k, '#a8acb0');
      for (let x = 0; x < 14; x += 3) q.vl(cx - 8 * k + x * k, by - 13 * k, by - 6 * k, '#a8acb0');
      q.line(cx + 6 * k, by - 13 * k, cx + 9 * k, by - 15 * k, '#c8352a');
      q.ring(cx - 6 * k, by - 2 * k, 1.5 * k, '#2a2a30');
      q.ring(cx + 4 * k, by - 2 * k, 1.5 * k, '#2a2a30');
    }, false),
  churrasqueira: (k) =>
    sprite(Math.ceil(20 * k), Math.ceil(18 * k), (q, cx, by) => {
      R(q, cx - 9 * k, by - 10 * k, 18 * k, 4 * k, '#3a3a40');
      for (let i = 0; i < 6; i++) R(q, cx - 8 * k + i * 3 * k, by - 11 * k, 2 * k, 1 * k, '#c8402a');
      for (const dx of [-8, 7]) R(q, cx + dx * k, by - 6 * k, 1.5 * k, 6 * k, '#3a3a40');
      R(q, cx - 4 * k, by - 13 * k, 3 * k, 2 * k, '#8a4a2a');
      R(q, cx + 1 * k, by - 13 * k, 4 * k, 2 * k, '#a85a3a');
    }),
  escada: (k) =>
    sprite(Math.ceil(14 * k), Math.ceil(34 * k), (q, cx, by) => {
      // escada de mão caída/encostada
      q.line(cx - 5 * k, by, cx - 1 * k, by - 33 * k, '#a8acb0');
      q.line(cx + 5 * k, by, cx + 8 * k, by - 33 * k, '#a8acb0');
      for (let i = 1; i < 8; i++) {
        const t = i / 8;
        q.line(cx - 5 * k + 4 * k * t, by - 33 * k * t, cx + 5 * k + 3 * k * t, by - 33 * k * t, '#c8ccd0');
      }
    }, false),
  bicicleta: (k) =>
    sprite(Math.ceil(24 * k), Math.ceil(14 * k), (q, cx, by) => {
      q.ring(cx - 7 * k, by - 5 * k, 5 * k, '#2a2a2e');
      q.ring(cx + 7 * k, by - 5 * k, 5 * k, '#2a2a2e');
      q.line(cx - 7 * k, by - 5 * k, cx - 1 * k, by - 11 * k, '#c8352a');
      q.line(cx - 1 * k, by - 11 * k, cx + 7 * k, by - 5 * k, '#c8352a');
      q.line(cx - 1 * k, by - 11 * k, cx, by - 5 * k, '#c8352a');
      q.line(cx, by - 5 * k, cx - 7 * k, by - 5 * k, '#c8352a');
      q.line(cx + 5 * k, by - 13 * k, cx + 7 * k, by - 5 * k, '#c8352a');
      R(q, cx + 4 * k, by - 14 * k, 3 * k, 1 * k, '#2a2a2e');
      R(q, cx - 3 * k, by - 12 * k, 3 * k, 1 * k, '#2a2a2e');
    }, false),
  moto: (k, v) =>
    sprite(Math.ceil(30 * k), Math.ceil(16 * k), (q, cx, by) => {
      const caida = v !== 'em_pe';
      if (caida) {
        // moto tombada de lado: rodas na vertical vistas de cima-lado
        q.ellipse(cx - 9 * k, by - 3 * k, 4 * k, 3 * k, '#1a1a1e');
        q.ellipse(cx + 10 * k, by - 3 * k, 4 * k, 3 * k, '#1a1a1e');
        q.ellipse(cx - 9 * k, by - 3 * k, 1.8 * k, 1.2 * k, '#6a6e74');
        q.ellipse(cx + 10 * k, by - 3 * k, 1.8 * k, 1.2 * k, '#6a6e74');
        q.poly([
          [cx - 6 * k, by - 4 * k],
          [cx + 7 * k, by - 6 * k],
          [cx + 8 * k, by - 2 * k],
          [cx - 5 * k, by - 1 * k],
        ], '#c8352a');
        R(q, cx - 1 * k, by - 7 * k, 6 * k, 3 * k, '#2a2a30');
        q.line(cx + 8 * k, by - 7 * k, cx + 13 * k, by - 10 * k, '#a8acb0');
        R(q, cx - 2 * k, by - 3 * k, 5 * k, Math.max(1, k), '#e8d040');
      } else {
        q.disc(cx - 9 * k, by - 4 * k, 4 * k, '#1a1a1e');
        q.disc(cx + 9 * k, by - 4 * k, 4 * k, '#1a1a1e');
        q.disc(cx - 9 * k, by - 4 * k, 1.6 * k, '#6a6e74');
        q.disc(cx + 9 * k, by - 4 * k, 1.6 * k, '#6a6e74');
        q.poly([
          [cx - 7 * k, by - 7 * k],
          [cx + 5 * k, by - 10 * k],
          [cx + 8 * k, by - 6 * k],
          [cx - 4 * k, by - 4 * k],
        ], '#c8352a');
        R(q, cx - 4 * k, by - 11 * k, 7 * k, 2 * k, '#2a2a30');
        q.line(cx + 7 * k, by - 9 * k, cx + 9 * k, by - 14 * k, '#a8acb0');
      }
    }),
  carro: (k, v) =>
    sprite(Math.ceil(56 * k), Math.ceil(22 * k), (q, cx, by) => {
      const col = '#5a7a9a';
      const batido = v === 'batido' || v === 'poste';
      // carroceria de lado
      // a frente fica à esquerda (farol amarelo); batido = frente amassada
      q.poly([
        [cx - (batido ? 22 : 26) * k, by - 4 * k],
        [cx - 26 * k, by - 11 * k],
        [cx - 18 * k, by - 12 * k],
        [cx - 11 * k, by - 20 * k],
        [cx + 9 * k, by - 20 * k],
        [cx + 16 * k, by - 12 * k],
        [cx + 26 * k, by - 11 * k],
        [cx + 26 * k, by - 4 * k],
      ], col);
      // janelas
      q.poly([
        [cx - 9 * k, by - 18 * k],
        [cx - 1 * k, by - 18 * k],
        [cx - 1 * k, by - 12 * k],
        [cx - 15 * k, by - 12 * k],
      ], '#9fc4dc');
      q.poly([
        [cx + 1 * k, by - 18 * k],
        [cx + 8 * k, by - 18 * k],
        [cx + 13 * k, by - 12 * k],
        [cx + 1 * k, by - 12 * k],
      ], '#9fc4dc');
      R(q, cx - 26 * k, by - 11 * k, 52 * k, Math.max(1, k), shade(col, 0.2));
      if (!batido) R(q, cx - 24 * k, by - 7 * k, 3 * k, 2 * k, '#e8d8a0');
      R(q, cx + 22 * k, by - 7 * k, 3 * k, 2 * k, '#c8352a');
      if (batido) {
        // frente amassada, farol quebrado e para-brisa trincado
        q.poly([
          [cx - 20 * k, by - 11 * k],
          [cx - 26 * k, by - 9 * k],
          [cx - 22 * k, by - 6 * k],
          [cx - 25 * k, by - 4 * k],
          [cx - 18 * k, by - 4 * k],
        ], shade(col, -0.3));
        R(q, cx - 23 * k, by - 7 * k, 2 * k, 1 * k, '#6a6050');
        q.line(cx - 4 * k, by - 17 * k, cx - 10 * k, by - 13 * k, '#e8f4f8');
        q.line(cx - 6 * k, by - 18 * k, cx - 3 * k, by - 13 * k, '#e8f4f8');
      }
      for (const dx of [-16, 14]) {
        q.disc(cx + dx * k, by - 3 * k, 4 * k, '#1a1a1e');
        q.disc(cx + dx * k, by - 3 * k, 1.8 * k, '#8a8e94');
      }
    }),
  viatura: (k) =>
    sprite(Math.ceil(56 * k), Math.ceil(24 * k), (q, cx, by) => {
      const col = '#e8e8e4';
      q.poly([
        [cx - 26 * k, by - 4 * k],
        [cx - 26 * k, by - 11 * k],
        [cx - 18 * k, by - 12 * k],
        [cx - 11 * k, by - 20 * k],
        [cx + 9 * k, by - 20 * k],
        [cx + 16 * k, by - 12 * k],
        [cx + 26 * k, by - 11 * k],
        [cx + 26 * k, by - 4 * k],
      ], col);
      R(q, cx - 26 * k, by - 10 * k, 52 * k, 3 * k, '#2a3a6a');
      q.poly([
        [cx - 9 * k, by - 18 * k],
        [cx + 7 * k, by - 18 * k],
        [cx + 12 * k, by - 12 * k],
        [cx - 15 * k, by - 12 * k],
      ], '#3a4a5a');
      // giroflex (desenhado aceso pela cena)
      R(q, cx - 6 * k, by - 22 * k, 5 * k, 2 * k, '#c8352a');
      R(q, cx - 1 * k, by - 22 * k, 5 * k, 2 * k, '#3a5ad0');
      drawText(q, 'PM', Math.round(cx - 4 * k), Math.round(by - 9 * k), '#f2f2ee');
      for (const dx of [-16, 14]) {
        q.disc(cx + dx * k, by - 3 * k, 4 * k, '#1a1a1e');
        q.disc(cx + dx * k, by - 3 * k, 1.8 * k, '#8a8e94');
      }
    }),
  ambulancia: (k) =>
    sprite(Math.ceil(60 * k), Math.ceil(30 * k), (q, cx, by) => {
      R(q, cx - 28 * k, by - 26 * k, 40 * k, 22 * k, '#f2f2ee');
      q.poly([
        [cx + 12 * k, by - 20 * k],
        [cx + 22 * k, by - 18 * k],
        [cx + 28 * k, by - 10 * k],
        [cx + 28 * k, by - 4 * k],
        [cx + 12 * k, by - 4 * k],
      ], '#f2f2ee');
      q.poly([
        [cx + 14 * k, by - 18 * k],
        [cx + 21 * k, by - 17 * k],
        [cx + 25 * k, by - 11 * k],
        [cx + 14 * k, by - 11 * k],
      ], '#3a4a5a');
      R(q, cx - 28 * k, by - 12 * k, 56 * k, 3 * k, '#f07a2a');
      R(q, cx - 28 * k, by - 9 * k, 56 * k, 1 * k, '#c8352a');
      R(q, cx - 4 * k, by - 22 * k, 6 * k, 2 * k, '#c8352a');
      R(q, cx - 2 * k, by - 24 * k, 2 * k, 6 * k, '#c8352a');
      R(q, cx - 20 * k, by - 28 * k, 6 * k, 2 * k, '#c8352a');
      for (const dx of [-18, 18]) {
        q.disc(cx + dx * k, by - 3 * k, 4 * k, '#1a1a1e');
        q.disc(cx + dx * k, by - 3 * k, 1.8 * k, '#8a8e94');
      }
    }),
  onibus: (k) =>
    sprite(Math.ceil(110 * k), Math.ceil(36 * k), (q, cx, by) => {
      R(q, cx - 54 * k, by - 34 * k, 108 * k, 30 * k, '#e8b931');
      R(q, cx - 54 * k, by - 34 * k, 108 * k, 2 * k, '#f8d860');
      for (let i = 0; i < 7; i++) R(q, cx - 50 * k + i * 15 * k, by - 30 * k, 12 * k, 10 * k, '#3a4a5a');
      R(q, cx - 54 * k, by - 16 * k, 108 * k, 3 * k, '#2f6aa8');
      R(q, cx + 40 * k, by - 30 * k, 4 * k, 26 * k, '#3a4a5a');
      for (const dx of [-38, 36]) {
        q.disc(cx + dx * k, by - 3 * k, 5 * k, '#1a1a1e');
        q.disc(cx + dx * k, by - 3 * k, 2.2 * k, '#8a8e94');
      }
    }),
  poste: (k) =>
    sprite(Math.ceil(8 * k), Math.ceil(60 * k), (q, cx, by) => {
      R(q, cx - 2.5 * k, by - 60 * k, 5 * k, 60 * k, '#9a9e94');
      R(q, cx - 2.5 * k, by - 60 * k, Math.max(1, k), 60 * k, '#b8bcb2');
      R(q, cx + 1.5 * k, by - 60 * k, Math.max(1, k), 60 * k, '#7a7e74');
    }),
  tv: (k) =>
    sprite(Math.ceil(22 * k), Math.ceil(14 * k), (q, cx, by) => {
      R(q, cx - 10 * k, by - 14 * k, 20 * k, 13 * k, '#1e1f24');
      R(q, cx - 9 * k, by - 13 * k, 18 * k, 10 * k, '#3a5a7a');
      R(q, cx - 2 * k, by - 1 * k, 4 * k, 1 * k, '#1e1f24');
    }),
  bexigas: (k) =>
    sprite(Math.ceil(16 * k), Math.ceil(22 * k), (q, cx, by) => {
      const cols = ['#c8352a', '#3a7ad0', '#e8b931'];
      for (let i = 0; i < 3; i++) {
        const x = cx - 5 * k + i * 5 * k;
        q.line(x, by - 12 * k + i * k, cx, by, '#8a8e94');
        q.ellipse(x, by - 15 * k + i * k, 3 * k, 4 * k, cols[i]);
      }
    }, false),
  andaime: (k) =>
    sprite(Math.ceil(30 * k), Math.ceil(50 * k), (q, cx, by) => {
      for (const dx of [-14, 14]) R(q, cx + dx * k, by - 50 * k, Math.max(1, 1.5 * k), 50 * k, '#8a8e94');
      for (let y = 0; y < 50; y += 16) q.hl(cx - 14 * k, cx + 14 * k, by - y * k - 2, '#8a8e94');
      for (let y = 0; y < 48; y += 16) q.line(cx - 14 * k, by - y * k, cx + 14 * k, by - (y + 16) * k, '#6a6e74');
    }, false),
  esteira: (k) =>
    sprite(Math.ceil(36 * k), Math.ceil(26 * k), (q, cx, by) => {
      R(q, cx - 16 * k, by - 6 * k, 32 * k, 6 * k, '#2a2a30');
      R(q, cx + 10 * k, by - 24 * k, 3 * k, 18 * k, '#3a3e44');
      R(q, cx + 6 * k, by - 26 * k, 10 * k, 4 * k, '#3a3e44');
    }),
  masseira: (k) =>
    // masseira de padaria: base, bacia de inox com massa, coluna e braço com o gancho espiral
    sprite(Math.ceil(34 * k), Math.ceil(38 * k), (q, cx, by) => {
      R(q, cx - 12 * k, by - 12 * k, 24 * k, 12 * k, '#5a6a7a');
      R(q, cx - 12 * k, by - 12 * k, 24 * k, 1.4 * k, '#7a8a9a');
      R(q, cx + 8 * k, by - 12 * k, 4 * k, 12 * k, '#4a5868');
      R(q, cx - 13 * k, by - 21 * k, 26 * k, 9 * k, '#b8c0c8');
      for (let i = 0; i < 4; i++) R(q, cx - 12 * k + i * 7 * k, by - 21 * k, 2 * k, 9 * k, i % 2 ? '#d8e0e8' : '#9aa4ac');
      q.ellipse(cx, by - 21 * k, 13 * k, 3.6 * k, '#d8e0e8');
      q.ellipse(cx, by - 21 * k, 11 * k, 2.6 * k, '#e8dcc0');
      q.ellipse(cx - 3 * k, by - 21.5 * k, 4 * k, 1.2 * k, '#f4ecd8');
      R(q, cx + 12 * k, by - 36 * k, 4 * k, 26 * k, '#6a7a8a');
      R(q, cx - 2 * k, by - 37 * k, 18 * k, 5 * k, '#6a7a8a');
      R(q, cx - 2 * k, by - 37 * k, 18 * k, 1.2 * k, '#8a9aaa');
      for (let y = 0; y < 12; y += 2) R(q, cx + (y % 4 ? -1 : 1) * k, by - 32 * k + y * k, 2 * k, 2 * k, '#c8ccd0');
      R(q, cx + 13 * k, by - 30 * k, 2.4 * k, 2.4 * k, '#d83a2a');
    }),
  maquina: (k) =>
    // máquina de rolos (calandra) de fábrica: corpo azul, dois rolos de aço, proteção amarela, botão de emergência
    sprite(Math.ceil(40 * k), Math.ceil(34 * k), (q, cx, by) => {
      R(q, cx - 19 * k, by - 24 * k, 38 * k, 24 * k, '#2f5f8f');
      R(q, cx - 19 * k, by - 24 * k, 38 * k, 1.4 * k, '#4f7faf');
      R(q, cx + 13 * k, by - 24 * k, 6 * k, 24 * k, '#244c74');
      R(q, cx - 17 * k, by - 21 * k, 34 * k, 4 * k, '#c8ccd0');
      R(q, cx - 17 * k, by - 21 * k, 34 * k, 1 * k, '#eef0f2');
      R(q, cx - 17 * k, by - 16.6 * k, 34 * k, 4 * k, '#a8acb0');
      R(q, cx - 17 * k, by - 12.6 * k, 34 * k, 1 * k, '#1e2024');
      R(q, cx - 19 * k, by - 27 * k, 38 * k, 3 * k, '#e8c040');
      for (let i = 0; i < 6; i++) R(q, cx - 18 * k + i * 6.4 * k, by - 27 * k, 3 * k, 3 * k, '#2a2a26');
      R(q, cx + 10 * k, by - 33 * k, 8 * k, 6 * k, '#e8c040');
      q.disc(cx + 14 * k, by - 31 * k, 2 * k, '#d83a2a');
      R(q, cx - 16 * k, by - 9 * k, 10 * k, 5 * k, '#244c74');
      R(q, cx - 15 * k, by - 8 * k, 3 * k, 2 * k, '#6af0a0');
    }),
  cadeira: (k) =>
    sprite(Math.ceil(16 * k), Math.ceil(30 * k), (q, cx, by) => {
      R(q, cx - 7 * k, by - 30 * k, 14 * k, 3 * k, '#e8c040');
      R(q, cx - 7 * k, by - 16 * k, 14 * k, 3 * k, '#e8c040');
      for (const dx of [-7, 5]) R(q, cx + dx * k, by - 30 * k, 2 * k, 30 * k, '#d8b030');
    }),
  mesa_bar: (k) =>
    sprite(Math.ceil(30 * k), Math.ceil(22 * k), (q, cx, by) => {
      R(q, cx - 14 * k, by - 20 * k, 28 * k, 3 * k, '#e8c040');
      for (const dx of [-12, 10]) R(q, cx + dx * k, by - 17 * k, 2 * k, 17 * k, '#d8b030');
    }),
  mesa: (k) =>
    sprite(Math.ceil(34 * k), Math.ceil(22 * k), (q, cx, by) => {
      R(q, cx - 16 * k, by - 20 * k, 32 * k, 3 * k, '#7a5236');
      for (const dx of [-14, 12]) R(q, cx + dx * k, by - 17 * k, 2 * k, 17 * k, '#5a3a24');
    }),
  sofa: (k) =>
    sprite(Math.ceil(40 * k), Math.ceil(20 * k), (q, cx, by) => {
      R(q, cx - 20 * k, by - 18 * k, 40 * k, 10 * k, '#5a3e6a');
      R(q, cx - 20 * k, by - 9 * k, 40 * k, 7 * k, '#6a4a7a');
    }),
  cama: (k) =>
    sprite(Math.ceil(50 * k), Math.ceil(16 * k), (q, cx, by) => {
      R(q, cx - 25 * k, by - 12 * k, 50 * k, 6 * k, '#e8e0d0');
      R(q, cx - 25 * k, by - 6 * k, 50 * k, 6 * k, '#8a6a52');
    }),
  fogao: (k) =>
    sprite(Math.ceil(20 * k), Math.ceil(22 * k), (q, cx, by) => {
      R(q, cx - 9 * k, by - 20 * k, 18 * k, 20 * k, '#f0f0ea');
      R(q, cx - 9 * k, by - 22 * k, 18 * k, 2 * k, '#2a2a30');
      R(q, cx - 7 * k, by - 14 * k, 14 * k, 9 * k, '#2a2a30');
    }),
};

const cache = new Map<string, PropSprite>();

/** sprite do objeto em escala k (cache por objeto+escala+variação) */
export function propSprite(prop: VideoProp, k: number, variant?: string): PropSprite | null {
  const kk = Math.round(k * 4) / 4;
  const key = prop + ':' + kk + ':' + (variant ?? '');
  const hit = cache.get(key);
  if (hit) return hit;
  const f = DRAW[prop];
  if (!f) return null;
  const s = f(kk, variant);
  if (cache.size > 300) cache.delete(cache.keys().next().value as string);
  cache.set(key, s);
  return s;
}

export function drawProp(p: Pix, prop: VideoProp, x: number, y: number, k: number, variant?: string): { w: number; h: number } | null {
  const s = propSprite(prop, k, variant);
  if (!s) return null;
  p.blit(s.pix, Math.round(x - s.ax), Math.round(y - s.ay));
  return { w: s.pix.w, h: s.pix.h };
}
