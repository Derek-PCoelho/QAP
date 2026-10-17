// =============================================================================
// Fotos de jornal (Gazeta de Santa Aurora): cenas compostas em tons e
// impressas em retícula ordenada (tinta sobre papel). Quadro 144×96, exibido
// ×2; na diagramação apertada a Gazeta usa o recorte 96×64 de cada foto (o
// enquadramento do editor), também ×2. Kit de desenho: newsPhotoKit.ts.
//
// Regra de leitura: cada foto tem UM assunto de silhueta forte, claro sobre
// escuro ou escuro sobre claro, com primeiro plano e fundo; meio-tom só em
// áreas grandes (céu, parede, chão, água).
// =============================================================================
import { hasDOM, mulberry, type Pix } from './pix';
import { CENTRAL } from './palette';
import {
  Tone,
  T,
  NEWS_W,
  NEWS_H,
  printTone,
  person,
  crowd,
  ambulanceL,
  ambulanceS,
  flash,
  policeCar,
  windows,
  treeCrown,
  tape,
  rain,
  bars,
  roofTiles,
  truss,
  trussV,
  palm,
  streetLamp,
  bush,
  type Pt,
} from './newsPhotoKit';

export { NEWS_W, NEWS_H } from './newsPhotoKit';
/** recorte da diagramação apertada */
export const NEWS_CROP_W = 96;
export const NEWS_CROP_H = 64;

export type NewsKind =
  | 'ambulancia'
  | 'hospital'
  | 'multidao'
  | 'chuva'
  | 'retrato'
  | 'casa'
  | 'predio'
  | 'policia'
  | 'parque'
  | 'calor'
  | 'abelhas'
  | 'fogo'
  | 'escola'
  | 'tribunal'
  | 'enchente'
  | 'show'
  | 'camara'
  | 'central'
  | 'generico'
  // fotos específicas de manchete
  | 'coletiva'
  | 'garagem'
  | 'vip'
  | 'rua'
  | 'bar'
  | 'dengue'
  | 'fumace'
  | 'veneno'
  | 'cronometro'
  | 'grade'
  | 'corredor'
  | 'condutor'
  | 'planilha'
  | 'anonimo'
  | 'poltrona';

export const NEWS_KINDS: NewsKind[] = [
  'ambulancia',
  'hospital',
  'multidao',
  'chuva',
  'retrato',
  'casa',
  'predio',
  'policia',
  'parque',
  'calor',
  'abelhas',
  'fogo',
  'escola',
  'tribunal',
  'enchente',
  'show',
  'camara',
  'central',
  'generico',
  'coletiva',
  'garagem',
  'vip',
  'rua',
  'bar',
  'dengue',
  'fumace',
  'veneno',
  'cronometro',
  'grade',
  'corredor',
  'condutor',
  'planilha',
  'anonimo',
  'poltrona',
];

interface PhotoDef {
  draw: (t: Tone) => void;
  /** canto do recorte 96×64 (padrão: centro) */
  crop?: Pt;
  /** força da nitidez de clichê (padrão 0.5) */
  sharpen?: number;
}

/** puxa uma área para um tom (fundo "fora de foco", névoa, fumaça) */
function fade(t: Tone, x: number, y: number, w: number, h: number, v: number, a: number): void {
  t.rect(x, y, w, h, v, a);
}

/**
 * Rosto oval com luz da esquerda (retrato de jornal): lado aceso em papel,
 * faixa de transição, lado da sombra em meio-tom e bordas levemente escuras.
 */
function shadedFace(t: Tone, cx: number, cy: number, rx: number, ry: number): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      // queixo mais estreito que a testa
      const w = ny > 0 ? 1 - ny * ny * 0.2 : 1;
      if ((nx * nx) / (w * w) + ny * ny > 1) continue;
      const edge = 0.28 + ny * ny * 0.2;
      let v: number = T.paper;
      if (nx > edge + 0.22) v = T.mid;
      else if (nx > edge) v = T.light;
      else if (nx < -0.8 || ny > 0.8) v = T.pale;
      t.set(x, y, v);
    }
}

// -----------------------------------------------------------------------------
// Composições
// -----------------------------------------------------------------------------
const PHOTOS: Record<NewsKind, PhotoDef> = {
  // Ambulância em atendimento: furgão branco de perfil, giroflex aceso,
  // fachadas em meio-tom atrás; curiosos na calçada.
  ambulancia: {
    crop: [22, 26],
    draw: (t) => {
      t.vgrad(0, 0, 144, 20, T.pale, T.light);
      // fachadas: farmácia com porta de aço, prédios com janelas
      t.rect(0, 10, 52, 58, T.mid);
      windows(t, 6, 14, 5, 1, 6, 7, 3, 4, T.ink, 3);
      t.rect(2, 26, 46, 9, T.paper).frame(2, 26, 46, 9, T.ink);
      t.text('FARMÁCIA', 25, 28, T.ink, { align: 'center' });
      t.rect(4, 38, 42, 30, T.black);
      for (let y = 39; y < 52; y += 2) t.rect(4, y, 42, 1, T.soft);
      t.rect(52, 18, 48, 50, T.dim);
      windows(t, 56, 22, 6, 3, 5, 6, 3, 5, T.ink, 5, 0.25, T.light);
      t.rect(100, 6, 44, 62, T.mid);
      windows(t, 104, 10, 4, 5, 6, 6, 4, 4, T.ink, 7, 0.3, T.paper);
      // calçada, meio-fio e asfalto
      t.rect(0, 66, 144, 6, T.light);
      t.rect(0, 71, 144, 1, T.paper);
      t.rect(0, 72, 144, 24, T.dark);
      for (let x = 2; x < 144; x += 24) t.rect(x, 92, 12, 2, T.paper);
      ambulanceL(t, 30, 88, { label: true, flash: true });
      // curiosos
      person(t, 12, 72, 28, { shirt: T.paper, pants: T.ink, pose: 'point', dir: 1, edge: T.ink });
      person(t, 23, 72, 25, { shirt: T.ink, pants: T.ink, dress: true, longHair: true });
      person(t, 131, 72, 29, { shirt: T.paper, pants: T.dark, pose: 'phone', dir: -1, hat: 'cap', edge: T.ink });
    },
  },

  // Hospital Regional: prédio claro com faixas de janela, H no telhado,
  // marquise do pronto-socorro e ambulância chegando.
  hospital: {
    crop: [24, 0],
    draw: (t) => {
      t.vgrad(0, 0, 144, 30, 1, T.pale);
      treeCrown(t, 6, 48, 14, 18, T.dark, 3, 0.15);
      t.rect(5, 60, 3, 14, T.ink);
      treeCrown(t, 138, 44, 14, 20, T.dark, 4, 0.15);
      t.rect(137, 58, 3, 16, T.ink);
      // prédio
      t.rect(16, 16, 112, 58, T.pale);
      t.rect(16, 16, 112, 2, T.mid);
      t.rect(16, 18, 112, 1, T.ink);
      t.rect(122, 19, 6, 55, T.light);
      for (let i = 0; i < 3; i++) {
        t.rect(20, 23 + i * 9, 104, 5, T.ink);
        for (let x = 27; x < 124; x += 8) t.rect(x, 23 + i * 9, 1, 5, T.mid);
      }
      // H no telhado
      t.rect(63, 1, 18, 15, T.ink);
      t.rect(67, 4, 3, 9, T.paper).rect(74, 4, 3, 9, T.paper).rect(70, 7, 4, 3, T.paper);
      t.text('HOSPITAL REGIONAL', 72, 51, T.ink, { align: 'center' });
      // marquise do pronto-socorro
      t.rect(34, 58, 76, 7, T.ink);
      t.text('PRONTO-SOCORRO', 72, 59, T.paper, { align: 'center' });
      t.rect(38, 65, 2, 9, T.ink).rect(104, 65, 2, 9, T.ink);
      t.rect(40, 65, 64, 9, T.black);
      t.rect(52, 66, 18, 8, T.light);
      t.rect(60, 66, 2, 8, T.dark);
      // pátio
      t.rect(0, 74, 144, 22, T.light);
      t.rect(0, 74, 144, 1, T.mid);
      for (let x = 0; x < 144; x += 16) t.rect(x, 84, 8, 1, T.paper);
      ambulanceS(t, 126, 95, { dir: -1 });
      person(t, 46, 75, 14, { shirt: T.paper, pants: T.ink });
      person(t, 26, 92, 20, { shirt: T.ink, pants: T.dark, pose: 'walk', edge: T.paper });
      person(t, 17, 92, 18, { shirt: T.mid, pants: T.ink, dress: true, longHair: true, edge: T.paper });
    },
  },

  // Corredor do Regional lotado: macas em fila encostadas na parede, com
  // paciente e soro; a enfermeira passa entre elas. Luz fria no teto.
  corredor: {
    crop: [2, 24],
    draw: (t) => {
      // teto com tubos, parede meio-escura, corrimão, placa, chão encerado
      t.rect(0, 0, 144, 9, T.dark);
      for (const x of [6, 58, 110]) t.rect(x, 3, 30, 3, T.paper);
      t.rect(0, 9, 144, 63, T.dim);
      t.rect(0, 9, 144, 1, T.ink);
      t.rect(0, 38, 144, 2, T.ink).rect(0, 40, 144, 1, T.mid);
      t.rect(0, 66, 144, 6, T.black);
      t.rect(54, 13, 38, 11, T.paper).frame(54, 13, 38, 11, T.ink);
      t.text('SILÊNCIO', 73, 17, T.ink, { align: 'center' });
      t.rect(0, 72, 144, 24, T.light);
      for (const x of [14, 66, 118]) t.rect(x, 80, 24, 1, T.paper).rect(x + 4, 84, 16, 1, T.paper);
      // maca: lençol branco sobre o paciente, armação, pés e rodas
      const maca = (x0: number, x1: number, top: number, floor: number, headLeft: boolean, s: number) => {
        const side = top + Math.round(7 * s);
        const rail = side + Math.round(2 * s);
        t.rect(x0, top, x1 - x0, side - top, T.paper);
        t.frame(x0, top, x1 - x0, side - top, T.ink);
        t.rect(x0 + 1, side, x1 - x0 - 2, rail - side, T.ink);
        for (const lx of [x0 + 3 * s, x1 - 4 * s]) {
          t.rect(lx, rail, Math.max(1, Math.round(s * 1.5)), floor - rail - 3 * s, T.ink);
          t.ellipse(lx + s, floor - 2 * s, 2.4 * s, 2.4 * s, T.ink);
        }
        t.line(x0 + 3 * s, floor - 5 * s, x1 - 3 * s, floor - 5 * s, T.ink);
        // corpo: peito, joelhos e pés sob o lençol
        const hx = headLeft ? x0 + 7 * s : x1 - 7 * s;
        const d = headLeft ? 1 : -1;
        const body: Pt[] = [
          [hx + d * 6 * s, top + 1],
          [hx + d * 9 * s, top - 6 * s],
          [hx + d * 26 * s, top - 5 * s],
          [hx + d * 36 * s, top - 3 * s],
          [hx + d * 50 * s, top - 3 * s],
          [hx + d * 54 * s, top - 6 * s],
          [hx + d * 57 * s, top + 1],
        ];
        t.poly(body, T.paper);
        t.polyEdge(body, T.ink);
        t.line(hx + d * 14 * s, top - 4 * s, hx + d * 22 * s, top, T.light);
        // travesseiro e cabeça (cabelo escuro, rosto para cima)
        t.ellipse(hx, top - 1.5 * s, 6 * s, 2.6 * s, T.paper);
        t.ring(hx, top - 1.5 * s, 6 * s, 1, T.ink);
        t.ellipse(hx + d * s, top - 5 * s, 4 * s, 4 * s, T.pale);
        t.ring(hx + d * s, top - 5 * s, 4 * s, 1, T.ink);
        t.ellipse(hx - d * 1.5 * s, top - 6 * s, 2.6 * s, 3.2 * s, T.ink);
        t.rect(hx + d * 3.5 * s, top - 7 * s, 1, 2, T.ink);
        // braço por cima do lençol
        t.line(hx + d * 8 * s, top - 3 * s, hx + d * 20 * s, top - 2 * s, T.pale, Math.max(1, Math.round(1.6 * s)));
      };
      maca(4, 76, 60, 92, true, 1.2);
      maca(86, 136, 52, 74, false, 0.85);
      // soro da maca da frente
      t.rect(3, 22, 2, 70, T.ink);
      t.rect(0, 22, 9, 1, T.ink);
      t.rect(5, 23, 6, 11, T.paper).frame(5, 23, 6, 11, T.ink);
      t.line(8, 34, 20, 51, T.ink);
      // enfermeira passando entre as macas
      person(t, 82, 86, 40, { shirt: T.ink, pants: T.ink, pose: 'walk', dir: 1, edge: T.pale });
      t.rect(78, 50, 8, 2, T.paper);
    },
  },

  // Central de Regulação: sala escura, telão com o mapa, operadores de fone
  // de costas contra as telas acesas.
  central: {
    crop: [24, 14],
    draw: (t) => {
      t.fill(T.dark);
      t.rect(0, 0, 144, 6, T.black);
      t.rect(14, 2, 34, 2, T.paper).rect(96, 2, 34, 2, T.paper);
      // telão com o mapa da cidade
      t.rect(26, 9, 92, 33, T.ink);
      t.rect(28, 11, 88, 6, T.black);
      t.text('REGULAÇÃO', 72, 12, T.paper, { align: 'center' });
      t.rect(28, 18, 88, 22, T.pale);
      for (let x = 32; x < 116; x += 9) t.rect(x, 18, 1, 22, T.dim);
      for (let y = 21; y < 40; y += 6) t.rect(28, y, 88, 1, T.dim);
      t.line(28, 34, 60, 26, T.ink, 2).line(60, 26, 116, 30, T.ink, 2);
      for (const [x, y] of [[44, 24], [70, 34], [93, 22], [104, 36], [52, 37]] as Pt[]) t.rect(x, y, 3, 3, T.ink);
      t.rect(81, 27, 3, 3, T.ink).frame(79, 25, 7, 7, T.ink);
      // bancada do fundo: monitores e operadores de costas
      t.rect(0, 58, 144, 5, T.light);
      t.rect(0, 63, 144, 3, T.black);
      for (let i = 0; i < 6; i++) {
        const x = 4 + i * 24;
        t.rect(x, 46, 16, 11, T.ink);
        t.rect(x + 1, 47, 14, 9, i % 2 ? T.paper : T.pale);
        for (let k = 0; k < 3; k++) t.rect(x + 3, 49 + k * 2, 8 - k * 2, 1, T.dim);
      }
      for (const [x, s] of [[16, 1], [62, 1], [110, 1]] as Pt[]) {
        person(t, x, 70, 26 * s, { shirt: T.mid, pants: T.ink, hair: T.ink, skin: T.ink, flat: T.ink });
        t.ring(x, 49, 4.5, 1, T.light);
        t.rect(x + 3, 50, 2, 3, T.light);
      }
      // primeiro plano: operador grande de costas, fone, monitor aceso
      t.rect(0, 80, 144, 16, T.soft);
      t.rect(0, 80, 144, 1, T.paper);
      t.rect(60, 54, 34, 24, T.ink);
      t.rect(62, 56, 30, 19, T.paper);
      for (let k = 0; k < 5; k++) t.rect(65, 59 + k * 3, 22 - (k % 2) * 8, 1, T.dark);
      t.rect(74, 78, 6, 3, T.ink);
      t.poly([[96, 96], [100, 76], [108, 72], [132, 72], [140, 76], [144, 96]], T.light);
      t.poly([[100, 96], [102, 80], [112, 76], [128, 76], [136, 80], [140, 96]], T.mid);
      t.ellipse(119, 62, 9, 10, T.ink);
      t.ring(119, 62, 11, 2, T.light);
      t.rect(127, 60, 4, 7, T.light);
      t.line(129, 67, 123, 74, T.light);
      // papéis e telefone na mesa da esquerda
      t.rect(8, 84, 22, 10, T.paper).frame(8, 84, 22, 10, T.dim);
      t.rect(36, 82, 14, 8, T.ink).rect(37, 81, 12, 2, T.dark);
    },
  },

  // Coletiva da Saúde+ Gestão: porta-voz de terno no púlpito, buquê de
  // microfones, painel da marca atrás e a imprensa em silhueta.
  coletiva: {
    crop: [24, 4],
    draw: (t) => {
      // painel cinza com a marca repetida (o rosto claro salta dele)
      t.fill(T.mid);
      for (let y = 26; y < 92; y += 12) for (let x = (y / 12) % 2 ? -10 : 10; x < 150; x += 40) t.text('SAÚDE+', x, y, T.light);
      t.rect(0, 0, 144, 22, T.paper);
      t.text('SAÚDE+ GESTÃO', 72, 8, T.ink, { align: 'center', scale: 2 });
      t.rect(0, 21, 144, 1, T.ink);
      // bandeiras penduradas nos mastros (pano claro com dobras)
      for (const x of [10, 132]) {
        t.rect(x, 22, 2, 74, T.ink);
        t.poly([[x + 2, 24], [x + 12, 26], [x + 11, 56], [x + 2, 58]], T.pale);
        t.polyEdge([[x + 2, 24], [x + 12, 26], [x + 11, 56], [x + 2, 58]], T.ink);
        t.line(x + 5, 28, x + 6, 55, T.mid).line(x + 9, 28, x + 9, 55, T.light);
      }
      // porta-voz: terno, camisa, gravata
      t.poly([[40, 96], [46, 58], [58, 48], [86, 48], [98, 58], [104, 96]], T.ink);
      t.poly([[64, 48], [80, 48], [72, 66]], T.paper);
      t.poly([[70, 50], [74, 50], [75, 62], [72, 67], [69, 62]], T.black);
      t.line(58, 49, 66, 64, T.dark).line(86, 49, 78, 64, T.dark);
      // pescoço, orelhas e rosto (branco, lado direito na sombra)
      t.rect(67, 41, 11, 8, T.pale).rect(74, 41, 4, 8, T.light);
      t.ellipse(62.5, 32, 2.5, 4, T.paper).ellipse(81.5, 32, 2.5, 4, T.light);
      const face: Pt[] = [[64, 23], [80, 23], [82, 30], [81, 38], [77, 42], [72, 43], [67, 42], [63, 38], [62, 30]];
      t.poly(face, T.paper);
      t.poly([[77, 24], [80, 23], [82, 30], [81, 38], [77, 42], [76, 33]], T.light);
      // cabelo, sobrancelhas, olhos, nariz e boca falando
      t.ellipse(72, 22, 10, 5, T.ink);
      t.rect(62, 22, 3, 7, T.ink).rect(80, 22, 2, 6, T.ink);
      t.rect(66, 28, 5, 1, T.ink).rect(74, 28, 5, 1, T.ink);
      t.rect(67, 30, 3, 2, T.ink).rect(75, 30, 3, 2, T.ink);
      t.rect(72, 32, 1, 4, T.light).rect(71, 36, 3, 1, T.mid);
      t.rect(69, 38, 7, 2, T.ink);
      // púlpito com a marca
      t.poly([[50, 60], [94, 60], [90, 96], [54, 96]], T.black);
      t.rect(47, 57, 50, 4, T.ink);
      t.rect(60, 70, 24, 10, T.dark);
      t.text('SAÚDE+', 72, 73, T.paper, { align: 'center' });
      // buquê de microfones: espumas claras contra o terno
      for (const [x, hx, hy] of [
        [58, 61, 50],
        [64, 66, 47],
        [72, 72, 48],
        [80, 78, 47],
        [86, 83, 50],
      ] as [number, number, number][]) {
        t.line(x, 57, hx, hy + 2, T.ink);
        t.ellipse(hx, hy, 2.5, 2.5, T.light);
        t.ring(hx, hy, 2.5, 1, T.ink);
        t.rect(hx - 2, hy + 2, 5, 3, T.paper).frame(hx - 2, hy + 2, 5, 3, T.ink);
      }
      // imprensa em silhueta e um flash
      t.ellipse(14, 92, 11, 12, T.ink);
      t.ellipse(36, 96, 10, 10, T.ink);
      t.rect(24, 74, 18, 12, T.ink).ellipse(38, 80, 5, 5, T.black);
      t.line(30, 86, 32, 96, T.ink, 3);
      t.ellipse(122, 94, 12, 12, T.ink);
      t.rect(100, 78, 12, 18, T.ink);
      t.rect(102, 80, 8, 12, T.light);
      t.ellipse(140, 90, 8, 10, T.ink);
      flash(t, 33, 77, 9);
    },
  },

  // Garagem da OS: a ambulância parada atrás do portão trancado, corrente,
  // cadeado e a placa FORA DE SERVIÇO.
  garagem: {
    crop: [22, 26],
    draw: (t) => {
      t.fill(T.light);
      t.rect(0, 0, 144, 4, T.mid);
      t.rect(28, 5, 88, 10, T.paper).frame(28, 5, 88, 10, T.ink);
      t.text('BASE VILA ESPERANÇA', 72, 8, T.ink, { align: 'center' });
      // vão da garagem e a ambulância lá dentro, de perfil
      t.rect(8, 18, 128, 70, T.ink);
      t.rect(6, 16, 2, 72, T.dark).rect(136, 16, 2, 72, T.dark);
      ambulanceL(t, 22, 86, {});
      t.rect(106, 54, 30, 32, T.black);
      // portão: barras de ferro (aresta escura + brilho)
      for (let x = 10; x < 136; x += 6) {
        t.rect(x, 18, 1, 70, T.ink);
        t.rect(x + 1, 18, 1, 70, T.soft);
      }
      t.rect(8, 22, 128, 2, T.soft).rect(8, 24, 128, 1, T.ink);
      t.rect(8, 80, 128, 2, T.soft).rect(8, 82, 128, 1, T.ink);
      // corrente e cadeado no batente
      for (let i = 0; i < 7; i++) t.ring(60 + i * 4, 68 + Math.round(Math.abs(i - 3) * -0.6) + 2, 2.2, 1, T.ink);
      t.rect(70, 70, 9, 9, T.ink);
      t.ring(74.5, 69, 3.2, 1.2, T.ink);
      t.rect(74, 73, 2, 3, T.light);
      // placa pendurada
      t.line(92, 44, 100, 38, T.ink).line(112, 44, 104, 38, T.ink);
      t.rect(84, 44, 34, 16, T.paper).frame(84, 44, 34, 16, T.ink);
      t.text('FORA DE', 101, 46, T.ink, { align: 'center' });
      t.text('SERVIÇO', 101, 53, T.ink, { align: 'center' });
      // chão
      t.rect(0, 88, 144, 8, T.pale);
      t.rect(0, 88, 144, 1, T.mid);
    },
  },

  // Foto de leitor: ambulância parada na porta da casa do vereador, na
  // Bela Vista (sobrado, grade de lança, palmeira).
  vip: {
    crop: [36, 22],
    draw: (t) => {
      t.vgrad(0, 0, 144, 40, 1, T.pale);
      // sobrado
      t.poly([[24, 22], [72, 6], [124, 22]], T.ink);
      roofTiles(t, 34, 12, 76, 10, T.dark, 3);
      t.rect(28, 22, 92, 48, T.paper);
      t.rect(28, 22, 92, 2, T.dim);
      t.rect(40, 28, 12, 14, T.ink).rect(64, 28, 16, 14, T.ink).rect(96, 28, 12, 14, T.ink);
      t.rect(36, 42, 76, 2, T.ink);
      for (let x = 37; x < 112; x += 3) t.rect(x, 44, 1, 5, T.ink);
      t.rect(36, 49, 76, 1, T.ink);
      for (const x of [50, 66, 82, 98]) t.rect(x, 50, 4, 20, T.light).rect(x + 3, 50, 1, 20, T.mid);
      t.rect(68, 52, 12, 18, T.dark);
      // palmeira e muro com grade de lança
      palm(t, 14, 74, 54);
      t.rect(0, 62, 144, 14, T.mid);
      t.rect(0, 62, 144, 2, T.light);
      for (let x = 2; x < 144; x += 4) {
        t.rect(x, 46, 1, 16, T.ink);
        t.set(x, 45, T.ink);
      }
      t.rect(0, 50, 144, 1, T.ink);
      // rua
      t.rect(0, 76, 144, 20, T.dim);
      t.rect(0, 76, 144, 2, T.light);
      ambulanceL(t, 46, 92, { doorsOpen: true });
      // a mãe do vereador e o filho de terno
      person(t, 28, 90, 22, { shirt: T.dark, dress: true, hair: T.paper, longHair: false, edge: T.light });
      person(t, 38, 90, 26, { shirt: T.ink, pants: T.ink, hair: T.mid, pose: 'point', dir: 1 });
    },
  },

  // Parada cardíaca na calçada da Av. Brasil: a testemunha faz a massagem
  // orientada pelo telefone; curiosos em volta, um deles ao celular.
  rua: {
    crop: [24, 28],
    draw: (t) => {
      // fachadas escuras, letreiro, porta de aço, vitrine e toldo
      t.fill(T.dark);
      t.rect(0, 0, 144, 5, T.pale);
      t.rect(0, 5, 144, 2, T.ink);
      t.rect(4, 10, 50, 9, T.paper).frame(4, 10, 50, 9, T.ink);
      t.text('PADARIA', 29, 12, T.ink, { align: 'center' });
      t.rect(6, 22, 46, 34, T.black);
      for (let y = 23; y < 56; y += 2) t.rect(6, y, 46, 1, T.dim);
      t.rect(62, 8, 82, 48, T.black);
      windows(t, 66, 12, 7, 2, 8, 12, 3, 6, T.mid, 11, 0.4, T.light);
      for (let x = 60; x < 144; x += 6) t.rect(x, 52, 3, 4, T.paper).rect(x + 3, 52, 3, 4, T.ink);
      // calçada clara
      t.rect(0, 58, 144, 38, T.pale);
      t.rect(0, 58, 144, 1, T.mid);
      for (let y = 70; y < 96; y += 8) for (let x = 114 + ((y / 8) % 2) * 6; x < 144; x += 12) t.line(x, y, x + 5, y - 2, T.light).line(x + 5, y - 2, x + 10, y, T.light);
      // curiosos contra as fachadas
      person(t, 13, 68, 38, { shirt: T.paper, pants: T.ink, pose: 'cross' });
      person(t, 30, 66, 35, { shirt: T.mid, pants: T.ink, dress: true, longHair: true });
      person(t, 104, 66, 36, { shirt: T.paper, pants: T.dark, pose: 'phone', dir: -1 });
      person(t, 121, 68, 38, { shirt: T.light, pants: T.ink, hat: 'cap', dir: -1, pose: 'hip' });
      person(t, 137, 66, 33, { shirt: T.ink, pants: T.dark, dir: -1, edge: T.mid });
      // a vítima deitada de costas, cabeça à esquerda
      t.rect(36, 88, 74, 2, T.mid);
      t.poly([[74, 80], [104, 82], [105, 88], [74, 88]], T.ink);
      t.rect(104, 78, 3, 7, T.ink).rect(107, 81, 3, 5, T.ink);
      t.poly([[46, 79], [75, 78], [76, 88], [46, 88]], T.light);
      t.polyEdge([[46, 79], [75, 78], [76, 88], [46, 88]], T.ink);
      t.rect(50, 85, 22, 3, T.pale);
      t.rect(50, 84, 22, 1, T.dim);
      t.rect(43, 82, 4, 4, T.soft);
      t.ellipse(39, 84, 5.5, 4.5, T.pale);
      t.ellipse(36, 84, 3, 4.5, T.ink);
      t.rect(41, 83, 2, 1, T.ink);
      // quem faz a massagem: ajoelhada atrás dele, braços retos no peito
      t.poly([[66, 87], [77, 87], [86, 68], [76, 65]], T.ink);
      t.poly([[74, 70], [88, 66], [73, 46], [60, 50]], T.paper);
      t.polyEdge([[74, 70], [88, 66], [73, 46], [60, 50]], T.ink);
      t.line(61, 51, 59, 76, T.pale, 2).line(65, 51, 62, 76, T.pale, 2);
      t.line(58, 51, 57, 76, T.ink).line(67, 52, 64, 76, T.ink);
      t.rect(55, 75, 9, 4, T.pale).frame(55, 75, 9, 4, T.ink);
      t.ellipse(60, 43, 5, 5.5, T.pale);
      t.ellipse(63, 41, 5, 5.5, T.ink);
      t.poly([[63, 42], [69, 44], [70, 56], [65, 52]], T.ink);
      t.rect(57, 44, 2, 1, T.ink);
    },
  },

  // Bar do Neno de manhã: portas de aço, mesas de plástico, cacos de
  // garrafa; a chaminé da usina ao fundo e a viatura chegando.
  bar: {
    crop: [10, 22],
    draw: (t) => {
      t.vgrad(0, 0, 144, 30, T.paper, T.pale);
      // usina ao fundo
      t.ellipse(126, 6, 12, 5, T.light).ellipse(134, 3, 9, 4, T.pale);
      t.rect(118, 4, 8, 40, T.dark);
      t.rect(118, 10, 8, 2, T.paper).rect(118, 18, 8, 2, T.paper);
      // fachada
      t.rect(0, 14, 112, 62, T.light);
      t.rect(4, 18, 100, 16, T.paper).frame(4, 18, 100, 16, T.ink);
      t.text('BAR DO NENO', 54, 21, T.ink, { align: 'center', scale: 2 });
      for (const x0 of [6, 58]) {
        t.rect(x0, 38, 44, 38, T.ink);
        t.rect(x0, 38, 44, 10, T.dim);
        for (let y = 39; y < 48; y += 2) t.rect(x0, y, 44, 1, T.light);
      }
      t.rect(10, 56, 36, 4, T.dark);
      for (let x = 12; x < 44; x += 4) t.rect(x, 52, 2, 4, T.pale);
      // calçada
      t.rect(0, 76, 144, 20, T.pale);
      t.rect(0, 76, 144, 1, T.mid);
      // mesas e cadeiras de plástico brancas
      const chair = (x: number, y: number, d: 1 | -1) => {
        t.rect(x, y - 8, 7, 2, T.paper).frame(x - 1, y - 9, 9, 4, T.ink);
        t.rect(x + (d > 0 ? 0 : 6), y - 16, 1, 9, T.ink);
        t.rect(x + (d > 0 ? 0 : 5), y - 16, 2, 8, T.paper);
        t.rect(x, y - 6, 1, 6, T.ink).rect(x + 6, y - 6, 1, 6, T.ink);
      };
      const table = (x: number, y: number) => {
        t.rect(x - 9, y - 12, 18, 3, T.paper).frame(x - 10, y - 13, 20, 5, T.ink);
        t.rect(x - 7, y - 8, 1, 8, T.ink).rect(x + 6, y - 8, 1, 8, T.ink);
        t.rect(x - 3, y - 17, 2, 5, T.ink).rect(x + 2, y - 16, 2, 4, T.dim);
      };
      table(24, 92);
      chair(8, 92, 1);
      chair(33, 93, -1);
      // engradado e cacos
      t.rect(52, 80, 14, 9, T.ink);
      for (let x = 53; x < 66; x += 3) t.rect(x, 79, 2, 2, T.dim);
      for (const [x, y] of [[44, 92], [48, 90], [56, 93], [60, 91]] as Pt[]) t.poly([[x, y], [x + 3, y - 1], [x + 2, y + 1]], T.ink);
      // dois homens na porta e a viatura chegando
      person(t, 74, 82, 30, { shirt: T.paper, pants: T.dark, pose: 'cross', edge: T.ink });
      person(t, 88, 82, 32, { shirt: T.ink, pants: T.dark, pose: 'point', dir: 1, hat: 'cap' });
      policeCar(t, 96, 94, 1, true);
    },
  },

  // Dengue: o mosquito em close sobre a pele (patas listradas, liras no
  // tórax, patas de trás erguidas).
  dengue: {
    crop: [24, 14],
    sharpen: 0.35,
    draw: (t) => {
      for (let y = 0; y < 96; y++) for (let x = 0; x < 144; x++) t.set(x, y, 0.9 - (x / 144) * 0.12 - (y / 96) * 0.2);
      const r = mulberry(9);
      for (let i = 0; i < 40; i++) t.set(r() * 144, r() * 96, T.dim);
      for (let i = 0; i < 10; i++) {
        const x = r() * 144;
        const y = r() * 96;
        t.line(x, y, x + 6 + r() * 4, y - 3 - r() * 3, T.mid);
      }
      // sombra do mosquito na pele
      t.mulEllipse(66, 84, 46, 7, 0.75);
      const leg = (pts: Pt[], w = 1) => {
        let k = 0;
        for (let i = 0; i + 1 < pts.length; i++) {
          const [x0, y0] = pts[i];
          const [x1, y1] = pts[i + 1];
          const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
          for (let j = 0; j <= n; j++, k++) {
            const x = x0 + ((x1 - x0) * j) / n;
            const y = y0 + ((y1 - y0) * j) / n;
            const band = k % 7 >= 5;
            t.rect(x, y, i === 0 ? w + 1 : w, i === 0 ? w + 1 : w, band ? T.paper : T.ink);
          }
        }
      };
      // patas
      leg([[46, 52], [34, 64], [24, 84]]);
      leg([[50, 54], [44, 70], [38, 86]]);
      leg([[56, 55], [62, 70], [62, 87]]);
      leg([[60, 54], [80, 64], [94, 86]]);
      leg([[62, 50], [92, 42], [126, 22]]);
      leg([[60, 48], [86, 30], [118, 10]]);
      // asas (vidro: branco com nervuras)
      t.poly([[60, 40], [96, 26], [128, 18], [131, 21], [100, 34], [64, 46]], T.paper);
      t.polyEdge([[60, 40], [96, 26], [128, 18], [131, 21], [100, 34], [64, 46]], T.ink);
      t.line(66, 42, 126, 20, T.mid).line(76, 40, 120, 25, T.light);
      // abdome com anéis brancos, para cima
      t.poly([[58, 50], [66, 43], [104, 31], [112, 30], [110, 35], [70, 54]], T.ink);
      for (let i = 0; i < 6; i++) {
        const x = 70 + i * 7;
        t.line(x, 49 - i * 2.4, x + 2, 53 - i * 2.4, T.paper, 1);
      }
      // tórax com as liras
      t.ellipse(52, 46, 11, 10, T.ink);
      t.line(47, 38, 49, 47, T.paper).line(49, 47, 47, 52, T.paper);
      t.line(57, 38, 55, 47, T.paper).line(55, 47, 57, 52, T.paper);
      t.rect(51, 37, 2, 2, T.paper);
      // cabeça, olho, palpos e probóscide até a pele
      t.ellipse(37, 54, 7, 6, T.ink);
      t.ellipse(35, 52, 3, 3, T.dark);
      t.set(34, 51, T.paper);
      t.line(31, 50, 20, 42, T.ink).line(32, 49, 22, 38, T.ink);
      t.line(31, 58, 14, 84, T.ink, 2);
      t.ellipse(13, 86, 3, 2, T.dark);
    },
  },

  // Fumacê: agente com a máquina nas costas no meio da nuvem branca, na rua
  // da Vila Esperança; crianças olham do portão.
  fumace: {
    crop: [16, 22],
    draw: (t) => {
      t.vgrad(0, 0, 144, 16, T.light, T.pale);
      // casas escuras (a fumaça branca precisa de fundo escuro)
      t.rect(0, 16, 144, 58, T.dark);
      roofTiles(t, 0, 10, 60, 8, T.black, 2);
      roofTiles(t, 64, 14, 80, 6, T.black, 5);
      t.rect(6, 28, 12, 12, T.ink).rect(24, 34, 10, 32, T.ink).rect(40, 28, 12, 12, T.ink);
      t.rect(70, 28, 14, 10, T.ink).rect(98, 30, 10, 30, T.ink).rect(118, 28, 14, 12, T.ink);
      t.rect(0, 56, 50, 18, T.mid);
      bars(t, 8, 48, 30, 74, 3, T.ink);
      person(t, 15, 74, 18, { shirt: T.paper, pants: T.ink });
      person(t, 23, 74, 15, { shirt: T.paper, pants: T.ink, dress: true });
      // rua
      t.rect(0, 74, 144, 22, T.light);
      t.rect(0, 74, 144, 1, T.mid);
      // nuvem do fumacê
      const r = mulberry(13);
      for (let i = 0; i < 60; i++) {
        const k = i / 60;
        const cx = 82 + k * 66 + (r() - 0.5) * 16;
        const cy = 58 - k * 26 + (r() - 0.5) * 26;
        const rr = 5 + k * 15 + r() * 5;
        t.ellipse(cx, cy, rr, rr * 0.8, T.paper, 0.6);
      }
      for (let i = 0; i < 26; i++) t.ball(88 + r() * 60, 26 + r() * 50, 6 + r() * 8, 5 + r() * 6, T.pale, 0.15);
      t.radial(84, 60, 26, 18, 1, 0.95);
      // agente: uniforme escuro, máscara, máquina costal clara
      person(t, 58, 94, 46, { shirt: T.ink, pants: T.ink, hat: 'cap', pose: 'carry', dir: 1, sleeves: true, edge: T.paper });
      t.rect(57, 54, 6, 3, T.paper);
      t.rect(42, 54, 12, 24, T.pale).frame(42, 54, 12, 24, T.ink);
      t.ellipse(48, 52, 6, 4, T.light).ring(48, 52, 6, 1, T.ink);
      t.rect(44, 60, 8, 2, T.dim).rect(44, 66, 8, 1, T.dim);
      t.line(53, 72, 66, 68, T.ink, 2).line(66, 68, 84, 60, T.ink, 2);
      t.rect(82, 58, 5, 4, T.ink);
    },
  },

  // Intoxicação de criança: armário da pia aberto, galão com caveira e
  // soda; a criança sentada estica o braço.
  veneno: {
    crop: [0, 16],
    draw: (t) => {
      t.fill(T.light);
      // piso em xadrez
      for (let y = 70; y < 96; y += 9) for (let x = (Math.floor(y / 9) % 2) * 12; x < 144; x += 24) t.rect(x, y, 12, 9, T.soft);
      t.rect(0, 70, 144, 1, T.mid);
      // armário: tampo, porta aberta e interior escuro
      t.rect(38, 4, 106, 6, T.paper).rect(38, 10, 106, 2, T.dim);
      t.rect(40, 12, 104, 58, T.dim);
      t.rect(46, 16, 92, 52, T.ink);
      t.poly([[30, 14], [40, 12], [40, 70], [30, 74]], T.pale);
      t.polyEdge([[30, 14], [40, 12], [40, 70], [30, 74]], T.ink);
      t.rect(32, 40, 2, 6, T.ink);
      // cano da pia
      t.rect(86, 16, 4, 10, T.light).rect(86, 24, 18, 4, T.light).rect(100, 16, 4, 10, T.light);
      // galão com a caveira
      t.poly([[54, 68], [54, 44], [58, 38], [66, 38], [66, 34], [72, 34], [72, 38], [78, 44], [78, 68]], T.paper);
      t.polyEdge([[54, 68], [54, 44], [58, 38], [66, 38], [66, 34], [72, 34], [72, 38], [78, 44], [78, 68]], T.ink);
      t.rect(57, 47, 18, 16, T.ink);
      t.ellipse(66, 53, 4, 4, T.paper);
      t.rect(64, 55, 5, 3, T.paper);
      t.rect(64, 53, 2, 2, T.ink).rect(67, 53, 2, 2, T.ink);
      t.line(59, 59, 73, 61, T.paper).line(59, 61, 73, 59, T.paper);
      // borrifador e caixa de soda
      t.rect(84, 44, 10, 24, T.pale).frame(84, 44, 10, 24, T.ink);
      t.rect(86, 36, 6, 8, T.ink).rect(80, 37, 6, 3, T.ink);
      t.rect(100, 48, 30, 20, T.paper).frame(100, 48, 30, 20, T.ink);
      t.text('SODA', 115, 52, T.ink, { align: 'center' });
      t.rect(103, 59, 24, 1, T.ink).rect(103, 62, 18, 1, T.mid);
      // a criança sentada no chão, de perfil para o armário, braço esticado
      t.ellipse(22, 73, 16, 3, T.ink, 0.45);
      t.poly([[18, 64], [40, 66], [42, 71], [18, 72]], T.pale);
      t.polyEdge([[18, 64], [40, 66], [42, 71], [18, 72]], T.ink);
      t.ellipse(42, 68, 3, 3.5, T.pale);
      t.ring(42, 68, 3.5, 1, T.ink);
      t.ellipse(17, 56, 11, 14, T.paper);
      t.ring(17, 56, 13.5, 1, T.ink);
      t.ellipse(18, 66, 11, 6, T.paper);
      t.polyEdge([[7, 62], [29, 62], [29, 72], [7, 72]], T.light);
      t.line(24, 48, 50, 55, T.pale, 3);
      t.line(24, 46, 50, 53, T.ink).line(25, 51, 50, 57, T.ink);
      t.ellipse(52, 55, 3, 3, T.pale);
      t.ring(52, 55, 3, 1, T.ink);
      t.ellipse(21, 34, 10, 11, T.pale);
      t.ring(21, 34, 11, 1, T.ink);
      t.ellipse(16, 27, 7, 4, T.dim);
      t.rect(12, 24, 3, 3, T.ink).rect(19, 22, 3, 2, T.ink);
      t.rect(27, 33, 2, 2, T.ink);
      t.rect(30, 37, 2, 1, T.dim);
      t.ellipse(12, 36, 2, 3, T.soft);
      t.rect(24, 40, 4, 1, T.mid);
    },
  },

  // "Quanto tempo leva uma ambulância?": mão segurando o cronômetro em
  // primeiro plano; a ambulância passa, fora de foco, ao fundo.
  cronometro: {
    crop: [14, 18],
    draw: (t) => {
      // fundo: rua com a ambulância (depois esmaecido = fora de foco)
      t.vgrad(0, 0, 144, 40, T.pale, T.light);
      t.rect(0, 20, 144, 44, T.dim);
      windows(t, 4, 24, 14, 3, 6, 7, 4, 5, T.dark, 3, 0.3, T.light);
      t.rect(0, 64, 144, 32, T.mid);
      ambulanceS(t, 84, 88, { flash: true });
      fade(t, 0, 0, 144, 96, T.light, 0.45);
      // mão (dedos por trás e polegar no botão)
      const finger = (x: number, y: number, w: number, h: number) => {
        t.ellipse(x, y, w, h, T.pale);
        t.ring(x, y, Math.max(w, h), 1, T.ink);
      };
      t.poly([[0, 60], [18, 50], [30, 66], [26, 96], [0, 96]], T.pale);
      t.polyEdge([[0, 60], [18, 50], [30, 66], [26, 96], [0, 96]], T.ink);
      finger(26, 70, 6, 5);
      finger(28, 80, 6, 5);
      finger(26, 89, 6, 5);
      // cronômetro
      const cx = 56;
      const cy = 54;
      t.ellipse(cx, cy, 30, 30, T.ink);
      t.ellipse(cx, cy, 27, 27, T.light);
      t.ellipse(cx, cy, 24, 24, T.paper);
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2;
        const r0 = i % 5 ? 22 : 18;
        t.line(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0, cx + Math.sin(a) * 23, cy - Math.cos(a) * 23, T.ink);
      }
      t.text('60', cx, cy - 15, T.ink, { align: 'center' });
      t.text('30', cx, cy + 10, T.ink, { align: 'center' });
      t.text('15', cx + 13, cy - 2, T.ink, { align: 'center' });
      t.text('45', cx - 13, cy - 2, T.ink, { align: 'center' });
      const a = (40 / 60) * Math.PI * 2;
      t.line(cx, cy, cx + Math.sin(a) * 20, cy - Math.cos(a) * 20, T.ink, 2);
      t.line(cx, cy, cx + Math.sin(a + Math.PI) * 6, cy - Math.cos(a + Math.PI) * 6, T.ink, 2);
      t.ellipse(cx, cy, 2.5, 2.5, T.ink);
      // coroa, argola e botão lateral
      t.rect(cx - 4, cy - 37, 8, 7, T.ink);
      t.ring(cx, cy - 41, 5, 2, T.ink);
      t.rect(cx + 22, cy - 26, 6, 5, T.ink);
      // polegar apertando a coroa
      t.poly([[18, 34], [34, 22], [50, 18], [54, 22], [40, 30], [24, 44]], T.pale);
      t.polyEdge([[18, 34], [34, 22], [50, 18], [54, 22], [40, 30], [24, 44]], T.ink);
    },
  },

  // Show da Expo Aurora: palco com treliça e canhões de luz, o cantor de
  // chapéu em contraluz e a multidão de mãos para o alto.
  show: {
    crop: [24, 10],
    draw: (t) => {
      t.fill(T.ink);
      // névoa iluminada do palco: é contra ela que a plateia vira silhueta
      t.radial(72, 74, 96, 40, T.light, 0.95);
      t.radial(72, 62, 46, 24, T.paper, 0.95);
      // feixes de luz
      for (const [x0, xa, xb] of [
        [20, 50, 76],
        [124, 68, 94],
        [44, 76, 104],
        [100, 40, 66],
      ] as [number, number, number][])
        t.poly([[x0 - 2, 12], [x0 + 2, 12], [xb, 66], [xa, 66]], T.paper, 0.3);
      // treliça do palco, refletores e faixa
      truss(t, 6, 6, 138, 6, T.light, 6);
      trussV(t, 8, 12, 68, 6, T.light, 6);
      trussV(t, 130, 12, 68, 6, T.light, 6);
      for (const x of [20, 44, 100, 124]) t.rect(x - 3, 12, 6, 4, T.mid);
      t.rect(28, 17, 88, 16, T.pale);
      t.frame(28, 17, 88, 16, T.ink);
      t.text('EXPO AURORA', 72, 20, T.ink, { align: 'center', scale: 2 });
      // palco e cantor em contraluz
      t.rect(14, 64, 116, 2, T.paper);
      t.rect(14, 66, 116, 4, T.ink);
      person(t, 72, 64, 30, { flat: T.ink, hat: 'cowboy', pose: 'armUp', dir: 1 });
      t.line(62, 64, 62, 46, T.ink).line(62, 46, 67, 43, T.ink);
      // plateia de chapéu, mãos para cima
      crowd(t, -4, 150, 88, 26, 37, { flat: true, tone: T.black, vary: 0, arms: 0.35, hats: 0.6, spacing: 7 });
      crowd(t, -8, 152, 100, 40, 31, { flat: true, tone: T.ink, vary: 0, arms: 0.45, hats: 0.55, spacing: 10 });
    },
  },

  // A grade "reforçada" no chão: um trecho ainda em pé, o seguinte tombado;
  // socorristas levam uma vítima na maca até a ambulância de portas abertas.
  grade: {
    crop: [26, 28],
    draw: (t) => {
      t.vgrad(0, 0, 144, 30, T.paper, T.pale);
      // palco ao fundo e gente indo embora
      trussV(t, 100, 4, 40, 5, T.mid, 5);
      trussV(t, 136, 4, 40, 5, T.mid, 5);
      truss(t, 100, 4, 141, 5, T.mid, 5);
      t.rect(104, 10, 32, 8, T.light);
      crowd(t, 4, 96, 40, 11, 5, { flat: true, tone: T.mid, vary: 0.1, spacing: 5 });
      // gramado
      t.rect(0, 38, 144, 58, T.soft);
      t.rect(0, 38, 144, 1, T.mid);
      const r = mulberry(21);
      for (let i = 0; i < 150; i++) t.rect(r() * 144, 40 + r() * 56, 1, 2, T.dim);
      // grade em pé (dois trechos) e o terceiro tombado para a frente
      const standing = (x: number, y: number) => {
        t.rect(x, y - 16, 26, 2, T.ink).rect(x, y - 3, 26, 2, T.ink);
        t.rect(x, y - 16, 2, 16, T.ink).rect(x + 24, y - 16, 2, 16, T.ink);
        for (let k = x + 4; k < x + 24; k += 3) t.rect(k, y - 15, 1, 13, T.ink);
        t.poly([[x - 3, y + 1], [x + 1, y - 3], [x + 5, y + 1]], T.ink);
        t.poly([[x + 21, y + 1], [x + 25, y - 3], [x + 29, y + 1]], T.ink);
      };
      standing(2, 56);
      standing(30, 56);
      const A: Pt = [58, 56];
      const B: Pt = [86, 58];
      const A2: Pt = [44, 76];
      const B2: Pt = [74, 80];
      t.poly([A, B, B2, A2], T.light, 0.6);
      for (let i = 0; i <= 10; i++) {
        const k = i / 10;
        t.line(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A2[0] + (B2[0] - A2[0]) * k, A2[1] + (B2[1] - A2[1]) * k, T.ink);
      }
      t.line(A[0], A[1], B[0], B[1], T.ink, 2);
      t.line(A2[0], A2[1], B2[0], B2[1], T.ink, 2);
      t.line(A[0], A[1], A2[0], A2[1], T.ink, 2);
      t.line(B[0], B[1], B2[0], B2[1], T.ink, 2);
      // objetos perdidos
      t.ellipse(30, 86, 9, 2.5, T.ink).ellipse(30, 83, 4.5, 3, T.ink);
      t.rect(60, 88, 7, 3, T.ink);
      t.rect(14, 74, 3, 7, T.paper).frame(14, 74, 3, 7, T.ink);
      // ambulância de portas abertas e a maca
      ambulanceS(t, 150, 78, { dir: -1, doorsOpen: true, flash: true });
      person(t, 92, 86, 34, { shirt: T.paper, pants: T.ink, vest: true, pose: 'carry', dir: 1, edge: T.ink });
      person(t, 128, 86, 35, { shirt: T.paper, pants: T.ink, vest: true, pose: 'carry', dir: -1, edge: T.ink, hat: 'cap' });
      t.rect(94, 67, 34, 4, T.paper).frame(94, 67, 34, 4, T.ink);
      t.rect(100, 62, 24, 5, T.dark);
      t.ellipse(123, 63, 3, 3, T.pale);
      t.rect(96, 71, 2, 3, T.ink).rect(124, 71, 2, 3, T.ink);
    },
  },

  // Enchente na Vila Nova: casas com água pela janela, céu de chuva, o bote
  // dos bombeiros com uma moradora e um morador acenando do telhado.
  enchente: {
    crop: [40, 28],
    draw: (t) => {
      t.vgrad(0, 0, 144, 52, T.dark, T.dim);
      // casas claras contra o céu escuro
      t.poly([[0, 30], [20, 16], [40, 30]], T.ink);
      t.rect(2, 30, 36, 30, T.pale);
      t.rect(8, 36, 9, 10, T.ink).rect(24, 36, 9, 10, T.ink);
      t.poly([[44, 32], [66, 18], [88, 32]], T.ink);
      t.rect(46, 32, 40, 28, T.light);
      t.rect(52, 38, 9, 10, T.ink).rect(70, 36, 10, 20, T.ink);
      t.rect(92, 24, 52, 36, T.pale);
      t.rect(92, 22, 52, 3, T.ink);
      windows(t, 97, 29, 5, 2, 6, 8, 4, 4, T.ink, 2);
      // poste e fios
      t.rect(40, 6, 2, 54, T.ink);
      t.line(0, 10, 144, 16, T.ink).line(0, 12, 144, 19, T.black);
      person(t, 66, 22, 13, { shirt: T.paper, pants: T.ink, pose: 'armsUp' });
      // água barrenta: escura, com poucas linhas de reflexo
      t.rect(0, 56, 144, 40, T.dark);
      for (let y = 59; y < 96; y += 4) {
        const off = (y * 7) % 17;
        for (let x = off - 17; x < 144; x += 19 + (y % 5)) t.rect(x, y, 6, 1, T.light);
      }
      for (const [x0, w] of [[4, 32], [48, 36], [94, 48]] as Pt[]) for (let y = 58; y < 66; y += 2) t.rect(x0 + ((y * 3) % 5), y, w - 6, 1, T.mid);
      // teto do carro submerso
      t.poly([[10, 64], [16, 59], [34, 59], [40, 64]], T.ink);
      t.rect(18, 60, 6, 3, T.mid).rect(26, 60, 6, 3, T.mid);
      // bote de resgate
      t.poly([[60, 74], [138, 74], [132, 88], [66, 88]], T.paper);
      t.polyEdge([[60, 74], [138, 74], [132, 88], [66, 88]], T.ink);
      t.rect(62, 78, 74, 1, T.light);
      t.rect(64, 88, 70, 2, T.light);
      person(t, 76, 80, 22, { shirt: T.ink, pants: T.ink, hat: 'helmet', pose: 'carry', dir: 1 });
      person(t, 96, 80, 19, { shirt: T.paper, pants: T.dark, dress: true, longHair: true, edge: T.ink });
      person(t, 104, 80, 13, { shirt: T.light, pants: T.dark, edge: T.ink });
      person(t, 124, 80, 23, { shirt: T.ink, pants: T.ink, hat: 'helmet', pose: 'point', dir: 1 });
      t.line(128, 62, 140, 92, T.ink, 1);
      rain(t, 4, 110, 0.5);
    },
  },

  // Seu Bené, com nome e foto: condutor de boné (a aba faz sombra nos olhos),
  // bigode branco, macacão com faixa refletiva, na frente da ambulância.
  condutor: {
    crop: [24, 4],
    sharpen: 0.3,
    draw: (t) => {
      // fundo: escuro à esquerda (o rosto iluminado salta), lateral da
      // ambulância desfocada à direita (faixa e cruz)
      t.hgrad(0, 0, 144, 96, T.dark, T.light);
      t.rect(96, 60, 48, 8, T.mid);
      t.rect(118, 12, 9, 30, T.mid).rect(108, 23, 29, 9, T.mid);
      // macacão escuro, luz no ombro esquerdo, faixa refletiva e nome
      t.poly([[14, 96], [20, 78], [44, 68], [100, 68], [124, 78], [130, 96]], T.black);
      t.poly([[16, 96], [22, 80], [40, 72], [46, 96]], T.dim);
      t.rect(18, 82, 108, 6, T.paper);
      t.rect(18, 81, 108, 1, T.ink).rect(18, 88, 108, 1, T.ink);
      t.rect(84, 90, 34, 6, T.paper);
      t.text('BENEDITO', 101, 91, T.ink, { align: 'center' });
      // gola e pescoço com a sombra do queixo
      t.poly([[54, 66], [72, 77], [90, 66], [92, 72], [72, 83], [52, 72]], T.ink);
      t.rect(62, 58, 20, 12, T.light);
      t.rect(76, 58, 6, 12, T.mid);
      t.rect(62, 58, 20, 4, T.dim);
      // orelhas e rosto
      t.ellipse(53, 42, 3, 6, T.pale).ellipse(91, 42, 3, 6, T.mid);
      t.rect(53, 39, 1, 6, T.soft);
      const cx = 72;
      const cy = 42;
      const rx = 18;
      const ry = 21;
      shadedFace(t, cx, cy, rx, ry);
      // sombra da aba sobre a testa e os olhos (recortada no rosto)
      for (let y = 26; y < 39; y++) {
        const k = (y + 0.5 - cy) / ry;
        const hw = rx * Math.sqrt(Math.max(0, 1 - k * k));
        t.rect(Math.round(cx - hw), y, Math.round(hw * 2), 1, y < 37 ? T.dark : T.dim);
        t.rect(Math.round(cx + hw * 0.3), y, Math.round(hw * 0.7), 1, T.black);
      }
      // olhos brilhando na sombra
      t.rect(61, 33, 6, 2, T.ink).set(62, 33, T.paper);
      t.rect(79, 33, 5, 2, T.ink).set(80, 33, T.light);
      // cabelo branco nas têmporas
      t.rect(54, 28, 3, 9, T.paper).rect(87, 28, 3, 8, T.light);
      // boné: copa, distintivo e aba
      t.ellipse(72, 18, 21, 11, T.ink);
      t.rect(51, 18, 42, 8, T.ink);
      t.rect(66, 11, 12, 7, T.paper).frame(66, 11, 12, 7, T.dim);
      t.rect(71, 12, 2, 5, T.ink).rect(69, 14, 6, 1, T.ink);
      t.poly([[47, 25], [97, 25], [102, 30], [42, 30]], T.ink);
      // nariz: aresta clara, ponta, narinas e a sombra para a direita
      t.line(70, 39, 70, 46, T.paper);
      t.poly([[72, 39], [76, 48], [74, 51], [72, 47]], T.mid);
      t.ellipse(71, 48, 3, 2.5, T.paper);
      t.rect(68, 50, 2, 1, T.ink).rect(73, 50, 2, 1, T.ink);
      // vincos
      t.line(64, 47, 60, 55, T.mid).line(80, 47, 84, 55, T.dark);
      // bigode branco, grosso, sobre a pele levemente sombreada do buço
      for (let y = 49; y < 63; y++) {
        const k = (y + 0.5 - cy) / ry;
        const hw = rx * (1 - k * k * 0.2) * Math.sqrt(Math.max(0, 1 - k * k));
        t.rect(Math.round(cx - hw * 0.92), y, Math.round(hw * 1.84), 1, y < 51 ? T.light : T.soft);
      }
      const must: Pt[] = [[61, 54], [66, 51], [72, 52], [78, 51], [83, 54], [83, 59], [78, 57], [72, 58], [66, 57], [61, 59]];
      t.poly(must, T.paper);
      t.line(61, 59, 66, 57, T.ink).line(66, 57, 72, 58, T.ink).line(72, 58, 78, 57, T.ink).line(78, 57, 83, 59, T.ink);
      t.line(65, 53, 67, 56, T.light).line(79, 53, 77, 56, T.light);
      // boca e queixo
      t.rect(66, 60, 12, 1, T.ink);
      t.rect(67, 61, 10, 1, T.mid);
    },
  },

  // Retrato de gabinete: homem de terno e gravata, cabelo grisalho
  // penteado para trás, bandeira e estante ao fundo.
  retrato: {
    crop: [24, 4],
    sharpen: 0.3,
    draw: (t) => {
      t.hgrad(0, 0, 144, 96, T.dark, T.mid);
      // bandeira caída à esquerda, estante à direita
      t.poly([[0, 0], [40, 0], [26, 96], [0, 96]], T.dim);
      t.line(12, 0, 2, 50, T.black, 3).line(32, 0, 18, 96, T.black, 2);
      t.rect(108, 0, 36, 96, T.dark);
      for (let y = 6; y < 96; y += 18) {
        t.rect(108, y + 14, 36, 2, T.black);
        for (let x = 110; x < 144; x += 4) t.rect(x, y + 4 + (x % 3), 3, 10 - (x % 3), x % 8 ? T.mid : T.soft);
      }
      // terno, camisa, gravata, broche dourado
      t.poly([[16, 96], [24, 74], [48, 64], [96, 64], [120, 74], [128, 96]], T.ink);
      t.poly([[58, 64], [86, 64], [72, 92]], T.paper);
      t.poly([[69, 66], [75, 66], [77, 86], [72, 92], [67, 86]], T.black);
      t.rect(70, 74, 4, 1, T.pale);
      t.line(58, 64, 68, 86, T.dark).line(86, 64, 76, 86, T.dark);
      t.rect(90, 76, 3, 3, T.pale);
      // pescoço
      t.rect(62, 54, 20, 12, T.light);
      t.rect(76, 54, 6, 12, T.mid);
      t.rect(62, 54, 20, 3, T.dim);
      shadedFace(t, 72, 38, 18, 21);
      t.ellipse(53, 40, 3, 6, T.pale).ellipse(91, 40, 3, 6, T.mid);
      // cabelo grisalho penteado para trás
      t.ellipse(72, 20, 19, 9, T.light);
      t.rect(53, 20, 4, 12, T.light).rect(87, 20, 4, 11, T.mid);
      for (let x = 57; x < 89; x += 4) t.line(x, 13, x + 4, 21, T.mid);
      t.rect(55, 27, 34, 1, T.mid);
      // sobrancelhas, olhos, nariz e o sorriso de canto
      t.rect(58, 31, 10, 2, T.ink).rect(77, 31, 9, 2, T.ink);
      t.rect(60, 35, 6, 2, T.ink).set(61, 35, T.paper);
      t.rect(78, 35, 5, 2, T.ink);
      t.line(70, 35, 70, 44, T.paper);
      t.poly([[72, 36], [75, 45], [73, 48], [72, 44]], T.soft);
      t.ellipse(71, 46, 3, 2.3, T.paper);
      t.rect(68, 48, 2, 1, T.ink).rect(73, 48, 2, 1, T.ink);
      t.line(64, 46, 62, 53, T.soft).line(79, 46, 82, 52, T.dim);
      t.line(65, 53, 72, 54, T.ink).line(72, 54, 80, 51, T.ink);
      t.rect(67, 56, 11, 2, T.pale);
    },
  },

  // A planilha vazada: folhas impressas na mesa, tabela com a linha marcada,
  // caneta, carimbo CONFIDENCIAL.
  planilha: {
    crop: [6, 8],
    draw: (t) => {
      t.fill(T.dark);
      for (let y = 2; y < 96; y += 5) t.line(0, y, 144, y + 3, T.black);
      // folha de trás com carimbo
      t.rect(86, 6, 58, 78, T.black, 0.4);
      t.rect(84, 4, 58, 78, T.pale);
      for (let y = 34; y < 78; y += 5) t.rect(94, y, 42 - (y % 3) * 6, 1, T.mid);
      t.frame(88, 12, 52, 11, T.ink);
      t.frame(89, 13, 50, 9, T.ink);
      t.text('CONFIDENCIAL', 114, 15, T.ink, { align: 'center' });
      // folha da frente: tabela
      t.rect(14, 14, 78, 80, T.black, 0.5);
      t.rect(10, 10, 78, 82, T.paper);
      t.text('USA POR PLANTÃO', 49, 15, T.ink, { align: 'center' });
      t.rect(14, 23, 70, 7, T.ink);
      t.text('DIA', 22, 24, T.paper, { align: 'center' });
      t.text('USA', 45, 24, T.paper, { align: 'center' });
      t.text('META', 70, 24, T.paper, { align: 'center' });
      for (let i = 0; i < 7; i++) {
        const y = 30 + i * 8;
        t.rect(14, y + 7, 70, 1, T.mid);
        t.text(String(10 + i), 22, y + 2, T.ink, { align: 'center' });
        t.text(String([5, 4, 4, 3, 2, 4, 3][i]), 45, y + 2, T.ink, { align: 'center' });
        t.text(i === 4 ? 'OK' : '-', 70, y + 2, T.ink, { align: 'center' });
      }
      t.rect(14, 30, 1, 56, T.ink).rect(33, 23, 1, 63, T.ink).rect(57, 23, 1, 63, T.ink).rect(83, 23, 1, 63, T.ink);
      // linha marcada a caneta e círculo
      t.rect(15, 63, 68, 6, T.light, 0.9);
      t.text('14', 22, 64, T.ink, { align: 'center' });
      t.text('2', 45, 64, T.ink, { align: 'center' });
      t.text('OK', 70, 64, T.ink, { align: 'center' });
      t.ring(45, 66, 7, 1, T.ink);
      t.ring(46, 66, 8, 1, T.ink);
      // clipe e caneta
      t.rect(40, 6, 18, 6, T.ink).rect(44, 3, 10, 4, T.mid);
      t.line(96, 92, 140, 62, T.ink, 3);
      t.line(96, 92, 92, 95, T.ink, 1);
      t.line(130, 70, 140, 63, T.paper, 1);
    },
  },

  // Fonte anônima: silhueta contra a janela de persiana; gravador e café
  // na mesa.
  anonimo: {
    crop: [24, 22],
    draw: (t) => {
      t.fill(T.dark);
      // janela de persiana estourada de luz
      t.rect(14, 0, 116, 74, T.ink);
      for (let y = 2; y < 72; y += 6) t.rect(16, y, 112, 4, T.paper);
      for (let y = 6; y < 72; y += 6) t.rect(16, y, 112, 2, T.pale);
      t.rect(70, 0, 2, 74, T.ink);
      // silhueta: cabeça e ombros, sem rosto
      t.ellipse(72, 34, 15, 18, T.ink);
      t.rect(64, 48, 16, 10, T.ink);
      t.poly([[18, 96], [26, 66], [48, 56], [96, 56], [118, 66], [126, 96]], T.ink);
      // luz de recorte no contorno
      for (let a = -2.6; a < -0.5; a += 0.02) t.set(72 + Math.cos(a) * 15, 34 + Math.sin(a) * 18, T.light);
      t.line(27, 66, 47, 57, T.mid);
      // mesa, gravador e xícara
      t.rect(0, 80, 144, 16, T.black);
      t.rect(0, 80, 144, 1, T.mid);
      t.rect(30, 82, 22, 9, T.pale).frame(30, 82, 22, 9, T.ink);
      for (let x = 32; x < 42; x += 2) t.rect(x, 84, 1, 5, T.ink);
      t.rect(45, 84, 4, 4, T.ink).rect(46, 85, 2, 2, T.paper);
      t.rect(100, 80, 12, 12, T.pale).frame(100, 80, 12, 12, T.ink);
      t.ring(114, 86, 3, 1, T.pale);
      t.rect(100, 80, 12, 2, T.dark);
    },
  },

  // Idosa que morava sozinha: a poltrona vazia, a TV ligada na novela e o
  // telefone fora do gancho.
  poltrona: {
    crop: [36, 20],
    draw: (t) => {
      t.fill(T.black);
      t.rect(0, 74, 144, 22, T.ink);
      // luz da TV
      t.radial(26, 46, 60, 46, T.dim, 0.9);
      // TV
      t.rect(4, 30, 38, 30, T.ink);
      t.rect(7, 33, 32, 22, T.paper);
      t.ellipse(18, 44, 5, 6, T.dim).ellipse(29, 42, 5, 6, T.mid);
      t.rect(13, 49, 10, 6, T.dim).rect(25, 47, 10, 8, T.mid);
      t.rect(10, 60, 26, 14, T.dark);
      t.rect(9, 74, 2, 6, T.ink).rect(35, 74, 2, 6, T.ink);
      // mesinha com o telefone fora do gancho: gancho vazio, fone pendurado
      t.rect(44, 60, 26, 4, T.mid).rect(46, 64, 2, 24, T.dim).rect(66, 64, 2, 24, T.dim);
      t.rect(50, 52, 16, 8, T.pale).frame(50, 52, 16, 8, T.ink);
      t.ring(58, 56, 3, 1, T.ink);
      t.rect(50, 50, 3, 3, T.pale).frame(50, 50, 3, 3, T.ink);
      t.rect(63, 50, 3, 3, T.pale).frame(63, 50, 3, 3, T.ink);
      for (let i = 0; i < 8; i++) t.rect(50 + (i % 2) * 2, 60 + i * 1.2, 2, 1, T.pale);
      t.rect(49, 70, 3, 9, T.pale).frame(49, 70, 3, 9, T.ink);
      t.ellipse(50.5, 69, 3.2, 2.2, T.pale);
      t.ring(50.5, 69, 3.2, 1, T.ink);
      t.ellipse(50.5, 80, 3.2, 2.2, T.pale);
      t.ring(50.5, 80, 3.2, 1, T.ink);
      // poltrona de orelha vazia, com paninho de crochê
      t.poly([[80, 22], [126, 22], [130, 30], [130, 60], [76, 60], [76, 30]], T.dim);
      t.poly([[80, 22], [100, 22], [96, 60], [76, 60], [76, 30]], T.mid);
      t.rect(70, 44, 14, 36, T.mid).rect(122, 44, 14, 36, T.dark);
      t.rect(70, 44, 14, 3, T.soft);
      t.rect(84, 58, 38, 14, T.soft);
      t.rect(84, 58, 38, 2, T.light);
      t.rect(76, 72, 56, 10, T.dark);
      t.rect(78, 82, 3, 6, T.ink).rect(128, 82, 3, 6, T.ink);
      t.rect(92, 24, 22, 12, T.paper);
      for (let x = 93; x < 114; x += 3) t.set(x, 35, T.dim);
      for (let x = 94; x < 113; x += 4) t.rect(x, 28, 2, 2, T.light);
      // chinelos
      t.ellipse(96, 90, 6, 2.5, T.pale).ellipse(108, 91, 6, 2.5, T.pale);
      t.rect(94, 89, 4, 1, T.dim).rect(106, 90, 4, 1, T.dim);
    },
  },

  // Casa de bairro: fachada clara, telhado de telha, muro baixo com portão;
  // vizinhos na frente.
  casa: {
    crop: [24, 24],
    draw: (t) => {
      t.vgrad(0, 0, 144, 30, T.paper, T.pale);
      treeCrown(t, 132, 34, 16, 22, T.dark, 8, 0.15);
      t.rect(130, 50, 3, 26, T.ink);
      // telhado
      t.poly([[18, 34], [40, 12], [104, 12], [126, 34]], T.dark);
      roofTiles(t, 30, 14, 84, 18, T.dark, 4);
      t.rect(16, 34, 112, 2, T.ink);
      // fachada
      t.rect(22, 36, 100, 34, T.pale);
      t.rect(22, 36, 100, 3, T.mid);
      t.rect(34, 44, 22, 16, T.ink);
      for (let x = 36; x < 56; x += 4) t.rect(x, 44, 1, 16, T.light);
      t.rect(34, 51, 22, 1, T.light);
      t.rect(80, 42, 16, 28, T.dark);
      t.rect(93, 56, 2, 2, T.paper);
      t.rect(104, 46, 10, 10, T.ink);
      t.rect(66, 40, 8, 4, T.ink);
      t.text('112', 70, 41, T.paper, { align: 'center' });
      // muro, portão e plantas
      t.rect(0, 62, 144, 16, T.mid);
      t.rect(0, 62, 144, 2, T.light);
      bush(t, 4, 62, 22, 8, T.dark, 3);
      bush(t, 104, 62, 22, 8, T.dark, 5);
      t.rect(62, 56, 26, 22, T.light);
      bars(t, 63, 56, 87, 78, 3, T.ink);
      t.rect(62, 56, 26, 2, T.ink);
      // calçada e rua
      t.rect(0, 78, 144, 6, T.pale);
      t.rect(0, 84, 144, 12, T.dim);
      // vizinhos no portão
      person(t, 52, 82, 28, { shirt: T.ink, pants: T.ink, dress: true, longHair: true, pose: 'cross', edge: T.paper });
      person(t, 98, 82, 30, { shirt: T.paper, pants: T.dark, pose: 'hip', edge: T.ink });
    },
  },

  // Viatura da PM à noite, sob o poste: fita zebrada no primeiro plano,
  // policial ao lado do carro, casas apagadas.
  policia: {
    crop: [24, 20],
    draw: (t) => {
      t.vgrad(0, 0, 144, 50, T.ink, T.black);
      // casas apagadas com janelas acesas
      t.rect(0, 30, 60, 44, T.ink);
      t.poly([[0, 30], [30, 18], [60, 30]], T.ink);
      t.rect(84, 26, 60, 48, T.ink);
      t.rect(10, 44, 10, 10, T.light).rect(100, 38, 10, 12, T.pale).rect(120, 40, 8, 10, T.mid);
      t.rect(36, 50, 10, 24, T.dark);
      // poste e poça de luz
      streetLamp(t, 18, 80, 56, 1);
      t.rect(0, 74, 144, 22, T.ink);
      t.ellipse(30, 82, 40, 9, T.dim);
      t.ellipse(72, 84, 50, 8, T.dark, 0.8);
      // viatura
      policeCar(t, 50, 84, 1, true);
      // policial ao lado
      person(t, 104, 84, 30, { shirt: T.dark, pants: T.ink, hat: 'cap', pose: 'hip', dir: -1, edge: T.dim });
      t.rect(102, 64, 4, 1, T.paper);
      // fita zebrada
      tape(t, -2, 88, 146, 80, 4);
      t.rect(6, 76, 2, 20, T.light).rect(136, 70, 2, 26, T.light);
    },
  },

  // Calor recorde: o termômetro de rua marcando 34 °C, sol estourado,
  // gente se protegendo.
  calor: {
    crop: [6, 10],
    draw: (t) => {
      t.vgrad(0, 0, 144, 60, T.mid, T.pale);
      // sol estourado
      t.radial(112, 18, 34, 30, 1, 0.9);
      t.ellipse(112, 18, 10, 10, T.paper);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        t.line(112 + Math.cos(a) * 13, 18 + Math.sin(a) * 13, 112 + Math.cos(a) * (i % 2 ? 17 : 21), 18 + Math.sin(a) * (i % 2 ? 17 : 21), T.paper);
      }
      // prédios no horizonte e rua clara
      t.rect(0, 48, 144, 18, T.soft);
      windows(t, 4, 52, 16, 2, 5, 4, 4, 3, T.dim, 9);
      t.rect(0, 66, 144, 30, T.paper);
      for (let y = 68; y < 76; y += 3) for (let x = (y * 5) % 11; x < 144; x += 14) t.line(x, y, x + 6, y, T.light);
      // termômetro de rua
      t.rect(32, 40, 3, 50, T.ink);
      t.rect(10, 10, 48, 32, T.ink);
      t.rect(12, 12, 44, 28, T.black);
      t.text('12:40', 34, 15, T.light, { align: 'center' });
      t.text('34°C', 34, 24, T.paper, { align: 'center', scale: 2 });
      // gente: sombrinha e garrafa d'água
      person(t, 84, 92, 34, { shirt: T.paper, pants: T.ink, dress: true, longHair: true, pose: 'armUp', dir: 1, edge: T.ink });
      t.poly([[70, 56], [86, 48], [102, 56]], T.ink);
      t.rect(87, 50, 1, 8, T.ink);
      person(t, 118, 92, 36, { shirt: T.ink, pants: T.dark, pose: 'phone', dir: -1, hat: 'cap' });
      t.rect(112, 60, 3, 7, T.pale).frame(112, 60, 3, 7, T.ink);
      t.ellipse(84, 93, 10, 1.5, T.dark).ellipse(118, 93, 10, 1.5, T.dark);
    },
  },

  // Enxame: a colmeia pendurada no galho da mangueira, a nuvem de abelhas e
  // o bombeiro de roupa de apicultor.
  abelhas: {
    crop: [36, 16],
    draw: (t) => {
      t.vgrad(0, 0, 144, 60, T.paper, T.pale);
      // parede dos fundos em sombra (a roupa branca precisa de fundo escuro)
      t.rect(92, 18, 52, 58, T.dim);
      t.rect(92, 16, 52, 3, T.dark);
      t.rect(112, 28, 18, 16, T.ink);
      // mangueira: tronco, copa no canto e o galho comprido
      t.poly([[14, 30], [26, 30], [30, 92], [8, 92]], T.ink);
      treeCrown(t, 18, 10, 30, 18, T.dark, 17, 0.2);
      t.line(24, 30, 76, 34, T.ink, 3);
      t.line(50, 32, 60, 22, T.ink, 2);
      treeCrown(t, 62, 20, 9, 6, T.dark, 3, 0.2);
      // colmeia
      t.rect(69, 34, 2, 5, T.ink);
      t.ellipse(70, 47, 7, 10, T.black);
      for (let y = 40; y < 56; y += 3) t.rect(64, y, 12, 1, T.dim);
      // abelhas: cacho na colmeia e nuvem para a direita
      const r = mulberry(17);
      for (let i = 0; i < 260; i++) {
        const a = r() * Math.PI * 2;
        const d = Math.pow(r(), 0.8);
        t.rect(70 + Math.cos(a) * d * 14, 47 + Math.sin(a) * d * 14, 1, 1, T.ink);
      }
      for (let i = 0; i < 200; i++) {
        const k = r();
        const x = 76 + k * 30 + (r() - 0.5) * 18;
        const y = 44 - k * 8 + (r() - 0.5) * 22;
        t.rect(x, y, 1, 1, T.ink);
        if (r() < 0.3) t.set(x + 1, y - 1, T.ink);
      }
      // gramado
      t.rect(0, 76, 144, 20, T.soft);
      t.rect(0, 76, 144, 1, T.mid);
      for (let i = 0; i < 80; i++) t.rect(r() * 144, 78 + r() * 18, 1, 2, T.dim);
      // bombeiro apicultor: macacão branco, véu, fumigador
      person(t, 116, 92, 46, { shirt: T.paper, pants: T.paper, skin: T.dim, hair: T.dim, sleeves: true, edge: T.ink, pose: 'point', dir: -1 });
      t.rect(105, 44, 22, 2, T.paper).frame(104, 43, 24, 4, T.ink);
      t.rect(111, 47, 10, 7, T.mid);
      t.rect(94, 60, 6, 8, T.ink);
      t.ellipse(90, 57, 6, 5, T.pale);
      t.ellipse(84, 53, 5, 4, T.paper, 0.7);
    },
  },

  // Multidão de protesto na frente da Câmara, faixa "QUEREMOS AMBULÂNCIA".
  multidao: {
    crop: [24, 18],
    draw: (t) => {
      t.vgrad(0, 0, 144, 30, T.paper, T.pale);
      // colunata clara ao fundo
      t.rect(0, 10, 144, 40, T.light);
      for (let x = 6; x < 144; x += 16) t.rect(x, 12, 6, 38, T.paper).rect(x + 5, 12, 1, 38, T.mid);
      t.rect(0, 8, 144, 4, T.mid);
      crowd(t, -4, 150, 60, 16, 3, { tone: T.dim, vary: 0.2, arms: 0.2, spacing: 5 });
      // faixa
      t.rect(18, 24, 2, 34, T.ink).rect(124, 24, 2, 34, T.ink);
      t.rect(20, 24, 104, 14, T.paper);
      t.polyEdge([[20, 24], [124, 24], [124, 38], [20, 38]], T.ink);
      t.text('QUEREMOS AMBULÂNCIA', 72, 29, T.ink, { align: 'center' });
      crowd(t, -6, 150, 78, 24, 7, { tone: T.mid, vary: 0.3, arms: 0.3, spacing: 7 });
      // cartazes
      for (const [x, y] of [[40, 46], [100, 48]] as Pt[]) {
        t.rect(x, y, 1, 14, T.ink);
        t.rect(x - 7, y - 8, 15, 9, T.paper).frame(x - 7, y - 8, 15, 9, T.ink);
        t.rect(x - 5, y - 6, 11, 1, T.ink).rect(x - 5, y - 3, 8, 1, T.ink);
      }
      // primeira fila em silhueta, punhos erguidos
      crowd(t, -10, 156, 104, 40, 11, { flat: true, tone: T.ink, vary: 0, arms: 0.4, spacing: 12, edge: T.light });
    },
  },

  // Chuva: guarda-chuvas pretos atravessando a faixa de pedestres no asfalto
  // molhado, faróis e janelas refletidos.
  chuva: {
    crop: [24, 28],
    draw: (t) => {
      t.vgrad(0, 0, 144, 40, T.mid, T.soft);
      // prédios escuros com janelas acesas
      t.rect(0, 10, 46, 40, T.dark).rect(46, 20, 40, 30, T.black).rect(86, 6, 58, 44, T.dark);
      windows(t, 4, 14, 5, 3, 5, 5, 3, 4, T.ink, 3, 0.45, T.pale);
      windows(t, 90, 10, 7, 4, 5, 5, 3, 3, T.ink, 5, 0.4, T.light);
      // asfalto molhado com reflexos verticais das luzes
      t.rect(0, 50, 144, 46, T.dark);
      for (const [x, w] of [[8, 4], [26, 3], [96, 4], [112, 3], [128, 4]] as Pt[])
        for (let y = 52; y < 96; y += 2) t.rect(x + ((y >> 1) % 2), y, w, 1, T.mid);
      // faixa de pedestres em perspectiva
      for (let i = 0; i < 7; i++) {
        const x0 = 6 + i * 20;
        t.poly([[x0, 70], [x0 + 11, 70], [x0 + 14, 86], [x0 + 1, 86]], T.paper);
      }
      // faróis de um carro chegando
      t.radial(136, 62, 22, 10, 1, 0.9);
      t.ellipse(132, 62, 3, 2, T.paper).ellipse(141, 62, 3, 2, T.paper);
      // pedestres de guarda-chuva preto
      const umbrella = (x: number, y: number, r: number) => {
        t.poly([[x - r, y], [x - r * 0.8, y - r * 0.42], [x - r * 0.4, y - r * 0.62], [x, y - r * 0.68], [x + r * 0.4, y - r * 0.62], [x + r * 0.8, y - r * 0.42], [x + r, y]], T.ink);
        for (let k = 0; k < 4; k++) {
          const cx = x - r + (r / 2) * (k + 0.5);
          t.ellipse(cx, y + 0.5, r / 4, 1.5, T.ink);
        }
        t.rect(x, y - r * 0.8, 1, 2, T.ink);
      };
      for (const [x, y, h] of [[34, 90, 36], [70, 84, 30], [104, 92, 38]] as [number, number, number][]) {
        person(t, x, y, h, { shirt: T.dim, pants: T.ink, pose: 'phone', dir: 1, edge: T.ink });
        t.line(x + 2, y - h * 0.62, x + 2, y - h - 3, T.ink);
        umbrella(x + 2, y - h - 2, h * 0.62);
        t.rect(x - 5, y, 12, 2, T.black);
      }
      rain(t, 8, 120, 0.5);
    },
  },

  // Prédio de apartamentos visto de baixo, varandas e roupa no varal.
  predio: {
    crop: [24, 10],
    draw: (t) => {
      t.vgrad(0, 0, 144, 96, T.paper, T.light);
      t.poly([[0, 20], [34, 26], [34, 96], [0, 96]], T.dim);
      windows(t, 4, 30, 3, 6, 6, 7, 4, 4, T.ink, 2, 0.2, T.light);
      // torre principal em perspectiva
      t.poly([[44, 4], [108, 0], [112, 96], [40, 96]], T.pale);
      t.poly([[108, 0], [128, 8], [130, 96], [112, 96]], T.mid);
      for (let i = 0; i < 9; i++) {
        const y = 8 + i * 10;
        t.rect(48, y, 58, 4, T.ink);
        t.rect(46, y + 4, 62, 2, T.dim);
        for (let x = 48; x < 106; x += 4) t.rect(x, y + 6, 1, 3, T.ink);
        t.rect(46, y + 6, 62, 1, T.ink);
        t.rect(112, y + 2, 16, 5, T.dark);
      }
      t.rect(64, 44, 4, 6, T.paper).rect(70, 44, 3, 5, T.light).rect(76, 44, 4, 6, T.paper);
      t.rect(62, 43, 20, 1, T.ink);
      t.rect(0, 88, 144, 8, T.mid);
    },
  },

  // Incêndio à noite: chamas saindo das janelas, coluna de fumaça, bombeiros
  // com a mangueira contra o clarão, a escada do caminhão.
  fogo: {
    crop: [24, 14],
    draw: (t) => {
      t.fill(T.ink);
      // coluna de fumaça (cinza contra o céu preto)
      const r = mulberry(21);
      for (let i = 0; i < 26; i++) t.ball(68 + r() * 26 + i * 1.4, 32 - i * 1.5, 8 + r() * 7, 6 + r() * 4, T.dim + r() * 0.15, 0.2);
      // prédio
      t.rect(30, 30, 76, 66, T.black);
      windows(t, 36, 36, 6, 4, 7, 8, 4, 6, T.ink, 8);
      // clarão e chamas
      t.radial(66, 44, 52, 38, 1, 0.45);
      const flame = (x: number, y: number, s: number) => {
        t.poly([[x - 6 * s, y + 8 * s], [x - 7 * s, y], [x - 3 * s, y - 6 * s], [x - 2 * s, y - 2 * s], [x, y - 12 * s], [x + 3 * s, y - 3 * s], [x + 5 * s, y - 7 * s], [x + 7 * s, y + 8 * s]], T.paper);
        t.poly([[x - 3 * s, y + 8 * s], [x - 2 * s, y + 2 * s], [x, y - 4 * s], [x + 2 * s, y + 2 * s], [x + 3 * s, y + 8 * s]], T.pale);
      };
      flame(50, 44, 1.2);
      flame(80, 34, 1.5);
      flame(92, 56, 1);
      flame(66, 28, 1.1);
      // chão iluminado pelo fogo, para os bombeiros virarem silhueta
      t.radial(40, 96, 70, 22, T.light, 0.9);
      // escada do caminhão
      t.line(144, 96, 106, 44, T.light, 2).line(138, 96, 102, 48, T.light, 1);
      for (let i = 0; i < 12; i++) t.line(140 - i * 3.2, 92 - i * 4.4, 136 - i * 3.2, 94 - i * 4.4, T.light);
      // bombeiros com a mangueira: capacete e faixas refletivas
      for (const [x, h] of [[14, 32], [30, 28]] as Pt[]) {
        person(t, x, 96, h, { flat: T.ink, hat: 'helmet', pose: 'carry', dir: 1 });
        t.rect(x - h * 0.15, 96 - h * 0.55, h * 0.3, 1, T.paper);
        t.rect(x - h * 0.12, 96 - h * 0.18, h * 0.24, 1, T.paper);
      }
      t.line(20, 82, 40, 74, T.ink, 2);
      for (let i = 0; i < 30; i++) {
        const q = i / 30;
        t.rect(40 + q * 36, 72 - Math.sin(q * Math.PI) * 24 + q * 6, 2, 1, T.paper);
      }
    },
  },

  // Escola Estadual: portão, faixa com o nome, bandeira e alunos com mochila.
  escola: {
    crop: [24, 22],
    draw: (t) => {
      t.vgrad(0, 0, 144, 30, T.paper, T.pale);
      treeCrown(t, 10, 30, 14, 18, T.dark, 2);
      // prédio baixo
      t.rect(14, 30, 120, 40, T.pale);
      t.rect(10, 26, 128, 5, T.dim);
      t.rect(10, 30, 128, 1, T.ink);
      for (let x = 20; x < 130; x += 18) {
        t.rect(x, 38, 12, 12, T.ink);
        for (let k = 0; k < 12; k += 3) t.rect(x + k, 38, 1, 12, T.light);
      }
      t.rect(40, 54, 64, 10, T.paper).frame(40, 54, 64, 10, T.ink);
      t.text('ESCOLA ESTADUAL', 72, 57, T.ink, { align: 'center' });
      // bandeira
      t.rect(128, 2, 2, 68, T.ink);
      t.rect(130, 4, 14, 10, T.mid);
      t.poly([[131, 9], [137, 5], [143, 9], [137, 13]], T.light);
      t.ellipse(137, 9, 2.5, 2.5, T.dark);
      // muro, portão aberto e alunos
      t.rect(0, 66, 144, 10, T.light);
      t.rect(56, 62, 32, 14, T.dark);
      bars(t, 46, 62, 56, 76, 2, T.ink);
      t.rect(0, 76, 144, 20, T.pale);
      for (const [x, h, s] of [[20, 22, T.paper], [34, 18, T.ink], [62, 20, T.paper], [76, 17, T.mid], [100, 22, T.paper], [114, 19, T.ink]] as [number, number, number][]) {
        person(t, x, 90, h, { shirt: s, pants: T.ink, edge: s === T.paper ? T.ink : undefined, pose: x === 100 ? 'walk' : 'stand' });
        t.rect(x - 4, 90 - h * 0.78, 3, h * 0.3, T.dim);
      }
    },
  },

  // Fórum: frontão, colunas com sombra funda, escadaria e gente de terno.
  tribunal: {
    crop: [24, 10],
    draw: (t) => {
      t.vgrad(0, 0, 144, 40, T.paper, T.pale);
      t.poly([[16, 22], [72, 4], [128, 22]], T.pale);
      t.polyEdge([[16, 22], [72, 4], [128, 22]], T.ink);
      t.ellipse(72, 15, 4, 4, T.dim);
      t.rect(16, 22, 112, 8, T.light);
      t.text('FÓRUM', 72, 24, T.ink, { align: 'center' });
      t.rect(16, 30, 112, 2, T.ink);
      t.rect(20, 32, 104, 36, T.ink);
      for (let i = 0; i < 7; i++) {
        const x = 22 + i * 15;
        t.rect(x, 32, 8, 36, T.paper).rect(x + 6, 32, 2, 36, T.light);
        t.rect(x - 1, 32, 10, 2, T.pale).rect(x - 1, 66, 10, 2, T.pale);
      }
      for (let i = 0; i < 5; i++) t.rect(12 - i * 3, 68 + i * 4, 120 + i * 6, 4, i % 2 ? T.light : T.pale);
      t.rect(0, 88, 144, 8, T.soft);
      person(t, 44, 80, 18, { shirt: T.ink, pants: T.ink, edge: T.paper });
      person(t, 52, 80, 17, { shirt: T.ink, pants: T.ink, pose: 'walk', edge: T.paper });
      person(t, 100, 88, 22, { shirt: T.dark, pants: T.ink, dress: true, longHair: true, edge: T.paper });
    },
  },

  // Câmara Municipal: prédio modernista com o letreiro, mastros e bandeiras.
  camara: {
    crop: [24, 16],
    draw: (t) => {
      t.vgrad(0, 0, 144, 40, T.paper, T.pale);
      for (const x of [56, 72, 88]) {
        t.rect(x, 0, 1, 44, T.ink);
        t.poly([[x + 1, 2], [x + 12, 4], [x + 11, 11], [x + 1, 10]], x === 72 ? T.dim : T.mid);
      }
      palm(t, 10, 70, 46);
      palm(t, 134, 70, 42);
      t.rect(20, 30, 104, 40, T.paper);
      t.rect(20, 28, 104, 3, T.ink);
      t.text('CÂMARA MUNICIPAL', 72, 34, T.ink, { align: 'center' });
      t.rect(28, 42, 88, 2, T.mid);
      for (let x = 30; x < 116; x += 10) t.rect(x, 46, 7, 22, T.ink);
      t.rect(60, 50, 24, 20, T.black);
      t.rect(71, 50, 2, 20, T.dim);
      t.poly([[40, 70], [104, 70], [116, 82], [28, 82]], T.light);
      t.rect(0, 82, 144, 14, T.soft);
      person(t, 50, 84, 18, { shirt: T.ink, pants: T.ink, edge: T.paper });
      person(t, 90, 86, 20, { shirt: T.paper, pants: T.dark, pose: 'walk', edge: T.ink });
    },
  },

  // Parque: árvores, banco, caminho e gente passeando.
  parque: {
    crop: [24, 22],
    draw: (t) => {
      t.vgrad(0, 0, 144, 40, T.paper, T.pale);
      for (const [x, y, r] of [[12, 26, 16], [44, 20, 18], [100, 22, 18], [134, 28, 14]] as [number, number, number][]) {
        t.rect(x - 1, y + r * 0.6, 3, 40, T.ink);
        treeCrown(t, x, y, r, r * 0.85, T.dark, x, 0.18);
      }
      t.rect(0, 58, 144, 38, T.soft);
      t.poly([[60, 96], [86, 96], [78, 58], [70, 58]], T.paper);
      // banco
      t.rect(14, 70, 26, 3, T.ink).rect(14, 64, 26, 3, T.ink);
      t.rect(16, 73, 2, 6, T.ink).rect(36, 73, 2, 6, T.ink);
      // poste
      t.rect(112, 30, 2, 50, T.ink);
      t.rect(108, 28, 10, 3, T.ink);
      person(t, 78, 80, 24, { shirt: T.ink, pants: T.dark, pose: 'walk', edge: T.paper });
      person(t, 88, 79, 20, { shirt: T.paper, pants: T.ink, dress: true, longHair: true, edge: T.ink });
    },
  },

  // Santa Aurora: a Matriz contra o céu do fim de tarde, telhados, fios e
  // passarinhos (foto de arquivo).
  generico: {
    crop: [24, 12],
    draw: (t) => {
      t.vgrad(0, 0, 144, 60, T.pale, T.light);
      t.poly([[0, 52], [30, 40], [62, 46], [100, 36], [144, 46], [144, 60], [0, 60]], T.soft);
      // igreja
      t.rect(52, 34, 40, 44, T.paper);
      t.polyEdge([[52, 34], [92, 34], [92, 78], [52, 78]], T.ink);
      t.poly([[50, 34], [72, 20], [94, 34]], T.paper);
      t.polyEdge([[50, 34], [72, 20], [94, 34]], T.ink);
      t.rect(64, 6, 16, 30, T.paper).frame(64, 6, 16, 30, T.ink);
      t.rect(68, 12, 8, 10, T.ink);
      t.poly([[62, 6], [72, -2], [82, 6]], T.dark);
      t.rect(71, -4, 2, 8, T.ink);
      t.ring(72, 44, 5, 1.5, T.ink);
      t.rect(66, 58, 12, 20, T.ink);
      t.rect(56, 46, 4, 10, T.ink).rect(84, 46, 4, 10, T.ink);
      // casario em volta
      const r = mulberry(5);
      for (let x = -4; x < 144; x += 14) {
        if (x > 40 && x < 96) continue;
        const h = 14 + r() * 14;
        t.rect(x, 78 - h, 13, h, T.dim + r() * 0.2);
        t.poly([[x - 1, 78 - h], [x + 6, 72 - h], [x + 14, 78 - h]], T.dark);
        t.rect(x + 3, 84 - h, 4, 5, T.ink);
      }
      t.rect(0, 78, 144, 18, T.dark);
      t.rect(0, 78, 144, 1, T.ink);
      // fios e passarinhos
      t.line(0, 28, 144, 22, T.ink).line(0, 31, 144, 26, T.ink);
      for (const x of [16, 22, 30, 112, 120]) t.rect(x, 26 - (x / 144) * 6, 2, 2, T.ink);
    },
  },
};

// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------
export interface NewsPhotoOpts {
  /** recorte 96×64 (diagramação apertada) em vez do quadro inteiro */
  crop?: boolean;
  /** ampliação inteira já embutida no dataURL (para a página girada não costurar a retícula) */
  scale?: number;
}

function defOf(kind: string): PhotoDef {
  return (PHOTOS as Record<string, PhotoDef | undefined>)[kind] ?? PHOTOS.generico;
}

/** canto (x, y) do recorte 96×64 de uma foto */
export function newsPhotoCrop(kind: NewsKind | string): Pt {
  return defOf(kind).crop ?? [(NEWS_W - NEWS_CROP_W) / 2, (NEWS_H - NEWS_CROP_H) / 2];
}

/** Pix da foto de jornal (puro): quadro 144×96 ou recorte 96×64. */
export function newsPhotoPix(kind: NewsKind | string, opts: NewsPhotoOpts = {}): Pix {
  const def = defOf(kind);
  const t = new Tone(NEWS_W, NEWS_H);
  def.draw(t);
  t.sharpen(def.sharpen ?? 0.5);
  const p = printTone(t, CENTRAL.ink, CENTRAL.paper);
  if (!opts.crop) return p;
  const [cx, cy] = newsPhotoCrop(kind);
  return p.crop(cx, cy, NEWS_CROP_W, NEWS_CROP_H);
}

const cache = new Map<string, string>();

/** Foto de jornal em retícula (tinta sobre papel) como dataURL. Fora do navegador devolve ''. */
export function newsPhoto(kind: NewsKind | string, opts: NewsPhotoOpts = {}): string {
  if (!hasDOM()) return '';
  const sc = Math.max(1, Math.floor(opts.scale ?? 1));
  const key = `${kind}|${opts.crop ? 'c' : 'f'}|${sc}`;
  let u = cache.get(key);
  if (!u) {
    u = newsPhotoPix(kind, opts).toDataURL(sc);
    cache.set(key, u);
  }
  return u;
}
