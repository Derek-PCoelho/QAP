// =============================================================================
// Objetos e móveis em pixel art (desenhados direto num Pix). Usados pelas cenas
// da casa, pela mesa da regulação e pelas vinhetas de final. Coordenadas = canto
// superior esquerdo do objeto. Cores literais: a gradação do Desgaste é aplicada
// pelo Pix (setMap) de quem chama.
// =============================================================================
import { Pix, hash2 } from './pix';
import { HOME, CENTRAL, shade, mix } from './palette';
import { drawText } from './font';

export const INK = '#1b1a17';
export const PAPER = '#efe6cf';

/** sombra elíptica no chão */
export function floorShadow(p: Pix, cx: number, cy: number, rx: number, ry: number, a = 0.32): void {
  p.ellipse(cx, cy, rx, ry, '#120a06', a);
}

/** prego na parede */
export function nail(p: Pix, x: number, y: number): void {
  p.px(x, y, '#2a2420');
  p.px(x + 1, y, '#8a8278');
  p.px(x, y + 1, '#4a4038');
}

/** crachá da central pendurado num prego em (x+5, y). Ocupa ~11×19. */
export function badge(p: Pix, x: number, y: number): void {
  const nx = x + 5;
  const ny = y;
  nail(p, nx, ny);
  p.line(nx, ny + 1, x + 2, y + 8, '#2a3a6a');
  p.line(nx + 1, ny + 1, x + 8, y + 8, '#1f2b52');
  // cartão
  p.rect(x + 1, y + 8, 9, 11, '#dfe6dc');
  p.rect(x + 1, y + 8, 9, 1, '#f4f8f0');
  p.rect(x + 1, y + 9, 9, 2, '#c8302a');
  p.px(x + 2, y + 9, '#f2b0a8');
  // foto 3×4
  p.rect(x + 2, y + 12, 3, 4, '#b98a62');
  p.rect(x + 2, y + 12, 3, 1, '#1c1410');
  p.px(x + 3, y + 14, '#3a2418');
  // linhas de texto
  p.hl(x + 6, x + 8, y + 12, '#6f7a74');
  p.hl(x + 6, x + 7, y + 14, '#8a948f');
  p.hl(x + 2, x + 8, y + 17, '#2a5aa0');
  p.px(x + 9, y + 10, '#a02420');
  p.vl(x + 10, y + 9, y + 18, '#9aa49e');
  p.hl(x + 2, x + 10, y + 19, '#8a948f');
}

/** desenho infantil (papel com giz de cera) */
export function kidDrawing(p: Pix, x: number, y: number, w: number, h: number, kind: 'ambulancia' | 'casa' | 'sol' | 'familia', seed = 1): void {
  const paper = '#f4efe2';
  p.rect(x, y, w, h, paper);
  p.hl(x, x + w - 1, y + h - 1, '#d8ceb8');
  p.vl(x + w - 1, y, y + h - 1, '#d8ceb8');
  // fita adesiva / ímã
  p.rect(x + Math.floor(w / 2) - 1, y - 1, 3, 2, seed % 2 ? '#e8566a' : '#5aa7d6');
  const cx = x + Math.floor(w / 2);
  const by = y + h - 3;
  switch (kind) {
    case 'ambulancia': {
      // ambulância de giz: caixa branca, contorno preto, cruz vermelha, rodas
      const aw = Math.max(6, w - 3);
      const ax = x + 1;
      const ay = by - 5;
      p.frame(ax, ay, aw, 5, '#2a2a2a');
      p.rect(ax + 1, ay + 1, aw - 2, 3, '#ffffff');
      p.px(ax + 2, ay + 2, '#e0302a');
      p.px(ax + 3, ay + 2, '#e0302a');
      p.px(ax + 2, ay + 1, '#e0302a');
      p.px(ax + aw - 2, ay + 1, '#4a8ad0');
      p.px(ax + 1, ay + 5, '#2a2a2a');
      p.px(ax + aw - 2, ay + 5, '#2a2a2a');
      p.px(ax + 1, ay - 1, '#e0302a');
      p.px(ax + 2, ay - 1, '#3a6ad0');
      if (h > 9) {
        p.px(x + w - 3, y + 2, '#f2c43a');
        p.px(x + w - 2, y + 2, '#f2c43a');
        p.px(x + w - 3, y + 3, '#f2c43a');
      }
      break;
    }
    case 'casa': {
      p.line(cx - 3, by - 3, cx, by - 6, '#c8302a');
      p.line(cx, by - 6, cx + 3, by - 3, '#c8302a');
      p.frame(cx - 3, by - 3, 7, 4, '#3a6ad0');
      p.px(cx, by - 1, '#8a5a32');
      p.px(x + 1, y + 1, '#f2c43a');
      p.px(x + 2, y + 2, '#f2c43a');
      break;
    }
    case 'sol': {
      p.disc(cx, y + Math.floor(h / 2) - 1, 1, '#f2c43a');
      p.px(cx - 3, y + Math.floor(h / 2) - 1, '#f29a3a');
      p.px(cx + 3, y + Math.floor(h / 2) - 1, '#f29a3a');
      p.px(cx, y + 1, '#f29a3a');
      p.hl(x + 1, x + w - 2, by + 1, '#4fae5b');
      break;
    }
    case 'familia': {
      for (let i = 0; i < 3; i++) {
        const fx = x + 2 + i * Math.max(2, Math.floor((w - 4) / 3));
        p.px(fx, by - 4, '#3a2418');
        p.vl(fx, by - 3, by - 1, ['#c8302a', '#3a6ad0', '#8a5aa0'][i]);
      }
      p.hl(x + 1, x + w - 2, by + 1, '#4fae5b');
      break;
    }
  }
  // traço de giz tremido no rodapé (o "nome")
  if (w >= 8) for (let i = 1; i < Math.min(w - 2, 6); i++) if (hash2(x + i, y, seed) < 0.7) p.px(x + i, y + h - 2, '#8a8478');
}

/**
 * Geladeira antiga de quinas arredondadas (22×38, na escala do elenco: um
 * pouco mais alta que um adulto de 32 px). x,y = canto de cima à esquerda;
 * os pés tocam o chão em y+37.
 */
export function fridge(p: Pix, x: number, y: number, state: 'ok' | 'quebrada', drawings: boolean): void {
  const W = 22;
  const H = 38;
  const body = '#e6dcc4';
  const bodyS = '#c4b89c';
  const bodyD = '#a89c80';
  const bodyL = '#f6efdf';
  // corpo com o topo arredondado
  p.rect(x + 2, y, W - 4, 1, bodyL);
  p.rect(x + 1, y + 1, W - 2, 1, bodyL);
  p.rect(x, y + 2, W, H - 3, body);
  p.rect(x + W - 4, y + 2, 4, H - 3, bodyS);
  p.vl(x + W - 1, y + 2, y + H - 2, bodyD);
  p.vl(x, y + 2, y + H - 2, bodyL);
  p.px(x + W - 2, y + 1, bodyS);
  // pés
  p.rect(x + 1, y + H - 1, 3, 1, '#3a3028');
  p.rect(x + W - 4, y + H - 1, 3, 1, '#3a3028');
  p.hl(x + 1, x + W - 2, y + H - 2, bodyD);
  floorShadow(p, x + W / 2, y + H, W / 2 + 2, 1.8, 0.35);
  if (state === 'quebrada') {
    // congelador fechado em cima, pingando
    p.hl(x + 1, x + W - 2, y + 11, bodyD);
    p.rect(x + 2, y + 5, 2, 4, '#b8bcb8');
    p.px(x + 8, y + 12, '#9fd0ea');
    // porta de baixo escancarada: interior apagado
    p.rect(x + 2, y + 13, W - 5, 21, '#2c2822');
    p.hl(x + 2, x + W - 4, y + 13, '#1e1a16');
    for (const sy of [19, 25, 30]) p.hl(x + 3, x + W - 4, y + sy, '#5a544a');
    // coisas murchas
    p.rect(x + 4, y + 15, 3, 4, '#d8d4c8');
    p.px(x + 4, y + 15, '#5aa7d6');
    p.rect(x + 10, y + 16, 2, 3, '#4a7a3a');
    p.rect(x + 12, y + 21, 5, 3, '#c9b48a');
    p.px(x + 13, y + 21, '#efe6cf');
    p.rect(x + 5, y + 26, 4, 4, '#8a3a2a');
    // a porta aberta, de lado, à direita
    p.rect(x + W, y + 12, 5, 24, body);
    p.vl(x + W, y + 12, y + 35, bodyS);
    p.vl(x + W + 4, y + 12, y + 35, bodyL);
    for (const sy of [16, 22, 28]) p.hl(x + W + 1, x + W + 3, y + sy, bodyD);
    // poça no chão
    p.ellipse(x + W / 2 + 3, y + H + 4, 14, 2.6, '#5aa7d6', 0.55);
    p.ellipse(x + W / 2 + 5, y + H + 4, 7, 1.4, '#9fd0ea', 0.45);
    p.px(x + W / 2 + 1, y + H + 3, '#e6f4fb');
  } else {
    // congelador e porta, puxadores cromados
    p.hl(x + 1, x + W - 2, y + 11, bodyD);
    p.hl(x + 1, x + W - 2, y + 12, bodyL);
    p.rect(x + 2, y + 5, 2, 4, '#b8bcb8');
    p.rect(x + 2, y + 15, 2, 8, '#b8bcb8');
    p.vl(x + 2, y + 15, y + 22, '#e8ece8');
    // plaquinha da marca
    p.hl(x + 9, x + 13, y + 33, '#b8bcb8');
    // ímãs
    p.px(x + 16, y + 5, '#d94436');
    p.px(x + 8, y + 7, '#4fae5b');
    if (drawings) {
      kidDrawing(p, x + 6, y + 15, 9, 9, 'ambulancia', 1);
      kidDrawing(p, x + 10, y + 25, 8, 8, 'casa', 2);
    }
  }
}

/** máquina de costura preta com frisos dourados (~26×17). x,y = topo-esquerdo */
export function sewingMachine(p: Pix, x: number, y: number, card = false): void {
  const b = '#1e1d22';
  const bl = '#3a3a44';
  const g = '#d8b448';
  // base/mesa da máquina
  p.rect(x, y + 13, 26, 4, '#2a2a30');
  p.hl(x, x + 25, y + 13, '#4a4a54');
  // coluna à direita
  p.rect(x + 18, y + 3, 6, 10, b);
  p.vl(x + 18, y + 3, y + 12, bl);
  // braço superior
  p.rect(x + 4, y + 2, 20, 5, b);
  p.hl(x + 4, x + 23, y + 2, bl);
  // cabeçote
  p.rect(x + 2, y + 2, 5, 9, b);
  p.vl(x + 2, y + 2, y + 10, bl);
  // agulha e calcador
  p.vl(x + 4, y + 11, y + 12, '#c8c8c0');
  p.px(x + 3, y + 12, '#c8c8c0');
  // volante
  p.disc(x + 25, y + 6, 2, '#2e2e36');
  p.px(x + 25, y + 6, '#9a9aa4');
  // frisos dourados
  p.hl(x + 8, x + 16, y + 4, g);
  p.px(x + 10, y + 5, g);
  p.px(x + 14, y + 5, g);
  p.px(x + 20, y + 8, g);
  p.px(x + 4, y + 5, g);
  // carretel de linha
  p.rect(x + 14, y, 2, 2, '#c8302a');
  p.px(x + 15, y - 1, '#c8c8c0');
  // tecido sob a agulha
  p.rect(x - 2, y + 12, 9, 2, '#5f7fa8');
  p.px(x - 2, y + 12, '#8aa8cc');
  p.rect(x + 5, y + 12, 3, 1, '#c86a8a');
  if (card) {
    // cartão de visita espetado na máquina
    p.rect(x + 9, y - 3, 6, 4, '#f8f6ee');
    p.hl(x + 10, x + 13, y - 2, '#2a3a6a');
    p.hl(x + 10, x + 12, y, '#8a948f');
    p.px(x + 14, y - 3, '#d8d4c8');
  }
}

/** prato em pé no escorredor (3×10) com brilho */
export function plateEdge(p: Pix, x: number, y: number, sparkle = false): void {
  for (let yy = 0; yy < 10; yy++) {
    const w = yy === 0 || yy === 9 ? 1 : 3;
    const xx = yy === 0 || yy === 9 ? x + 1 : x;
    p.hl(xx, xx + w - 1, y + yy, yy > 6 ? '#d8d8d0' : '#f4f4ee');
  }
  p.vl(x + 2, y + 2, y + 8, '#c0c0b8');
  if (sparkle) {
    p.px(x + 1, y + 2, '#ffffff');
    p.px(x - 1, y + 1, '#ffffff');
    p.px(x + 3, y + 1, '#ffffff');
  }
}

/** xícara com pires (7×6); full = com café */
export function cup(p: Pix, x: number, y: number, full = true): void {
  p.ellipse(x + 3.5, y + 5, 3.8, 1.3, '#e8e4dc');
  p.hl(x + 1, x + 6, y + 5, '#c8c4bc');
  p.rect(x + 1, y + 1, 5, 4, '#f4f0e6');
  p.vl(x + 5, y + 1, y + 4, '#d0ccc2');
  p.hl(x + 1, x + 5, y, '#ffffff');
  p.hl(x + 2, x + 4, y + 1, full ? '#4a2a18' : '#d8d0c0');
  if (!full) p.px(x + 4, y + 1, '#8a6a4a');
  p.px(x + 6, y + 2, '#f4f0e6');
  p.px(x + 7, y + 2, '#d0ccc2');
  p.px(x + 7, y + 3, '#d0ccc2');
  p.px(x + 6, y + 4, '#d0ccc2');
}

/** lata de mantimentos "AÇÚCAR" (8×13) */
export function sugarTin(p: Pix, x: number, y: number): void {
  p.rect(x, y + 2, 8, 11, '#efe8d8');
  p.vl(x + 6, y + 2, y + 12, '#d0c8b4');
  p.vl(x + 7, y + 2, y + 12, '#b8b09c');
  p.rect(x, y, 8, 2, '#c8302a');
  p.hl(x + 1, x + 6, y, '#e85a4a');
  p.rect(x, y + 5, 8, 4, '#3a6aa8');
  p.hl(x + 1, x + 5, y + 6, '#efe8d8');
  p.hl(x + 1, x + 4, y + 7, '#cfe0f4');
  p.hl(x, x + 7, y + 12, '#a8a090');
}

/** copo de suco de laranja (5×9) */
export function juiceGlass(p: Pix, x: number, y: number): void {
  p.vl(x, y, y + 8, '#d8eef4');
  p.vl(x + 4, y, y + 8, '#a8c8d0');
  p.hl(x, x + 4, y + 8, '#a8c8d0');
  p.rect(x + 1, y + 2, 3, 6, '#f29a2a');
  p.hl(x + 1, x + 3, y + 2, '#f8c060');
  p.px(x + 1, y + 4, '#f8c060');
}

/** caneta de insulina + caixinha (14×7) */
export function insulin(p: Pix, x: number, y: number): void {
  // caixa
  p.rect(x, y, 8, 5, '#f4f4ee');
  p.hl(x, x + 7, y + 1, '#3a6aa8');
  p.vl(x + 7, y, y + 4, '#c8c8c0');
  p.hl(x, x + 7, y + 4, '#c8c8c0');
  p.px(x + 2, y + 3, '#d94436');
  // caneta
  p.hl(x + 3, x + 12, y + 5, '#9aa0a4');
  p.hl(x + 3, x + 12, y + 6, '#6a7074');
  p.hl(x + 11, x + 13, y + 5, '#f07a2a');
  p.hl(x + 11, x + 13, y + 6, '#b8561a');
  p.px(x + 6, y + 5, '#ffffff');
  p.px(x + 2, y + 6, '#c8c8c0');
}

/** meia branca com mancha (9×6) */
export function stainedSock(p: Pix, x: number, y: number): void {
  p.rect(x, y, 4, 4, '#ece8de');
  p.rect(x, y + 3, 9, 3, '#ece8de');
  p.hl(x, x + 8, y + 5, '#c8c2b4');
  p.vl(x, y, y + 5, '#d8d2c4');
  p.hl(x, x + 3, y, '#d0cabc');
  // mancha
  p.px(x + 5, y + 3, '#7a3a24');
  p.px(x + 6, y + 3, '#9a4a2a');
  p.px(x + 6, y + 4, '#7a3a24');
  p.px(x + 7, y + 4, '#a8603a');
  p.px(x + 5, y + 4, '#a8603a');
}

/** par de sapatos sociais fechados (14×5) */
export function closedShoes(p: Pix, x: number, y: number): void {
  for (const dx of [0, 7]) {
    p.rect(x + dx, y + 1, 6, 3, '#1a1614');
    p.rect(x + dx + 1, y, 3, 1, '#1a1614');
    p.hl(x + dx + 1, x + dx + 3, y + 1, '#4a4440');
    p.px(x + dx + 4, y + 2, '#5a5450');
    p.hl(x + dx, x + dx + 5, y + 4, '#0c0a08');
  }
}

/** bolsa de mão com passagem de ônibus aparecendo (13×11) */
export function handbag(p: Pix, x: number, y: number): void {
  // alça
  p.line(x + 3, y + 3, x + 5, y, '#5a3420');
  p.line(x + 6, y, x + 9, y, '#5a3420');
  p.line(x + 9, y, x + 10, y + 3, '#5a3420');
  // corpo
  p.rect(x + 1, y + 4, 11, 7, '#7a4a2a');
  p.hl(x + 1, x + 11, y + 4, '#9a6238');
  p.vl(x + 11, y + 4, y + 10, '#5a3420');
  p.hl(x + 1, x + 11, y + 10, '#4a2a18');
  p.px(x + 6, y + 6, '#d8b448');
  // passagem saindo
  p.rect(x + 8, y + 1, 4, 4, '#f4f0e2');
  p.hl(x + 8, x + 11, y + 2, '#f07a2a');
  p.px(x + 9, y + 3, '#5f7a6c');
}

/** roupa de entrevista no varal (camisa social clara e calça escura) ~30×16 */
export function interviewClothes(p: Pix, x: number, y: number): void {
  // pregadores
  p.px(x + 3, y, '#d94436');
  p.px(x + 11, y, '#d94436');
  p.px(x + 18, y, '#4fae5b');
  p.px(x + 26, y, '#4fae5b');
  // camisa
  p.rect(x + 1, y + 1, 13, 11, '#eef2f4');
  p.rect(x + 1, y + 1, 3, 6, '#dfe6ea');
  p.rect(x + 11, y + 1, 3, 6, '#cfd8de');
  p.px(x + 6, y + 1, '#b8c4cc');
  p.px(x + 8, y + 1, '#b8c4cc');
  p.vl(x + 7, y + 2, y + 11, '#b8c4cc');
  for (let yy = y + 4; yy <= y + 10; yy += 3) p.px(x + 7, yy, '#8a98a4');
  p.hl(x + 1, x + 13, y + 11, '#c8d2d8');
  // calça
  p.rect(x + 17, y + 1, 10, 4, '#2a3040');
  p.rect(x + 17, y + 5, 4, 10, '#2a3040');
  p.rect(x + 23, y + 5, 4, 10, '#2a3040');
  p.vl(x + 20, y + 5, y + 14, '#3a4254');
  p.vl(x + 26, y + 5, y + 14, '#1c2030');
}

/** desenho rabiscado com raiva (12×10) */
export function angryDrawing(p: Pix, x: number, y: number): void {
  p.rect(x, y, 12, 10, '#f4efe2');
  p.px(x, y, '#d8ceb8');
  p.px(x + 11, y + 9, '#d8ceb8');
  p.hl(x, x + 11, y + 9, '#d8ceb8');
  // rabiscos em zigue-zague
  const pts: [number, number][] = [
    [1, 2], [4, 7], [6, 1], [8, 8], [10, 2], [3, 5], [9, 5], [2, 8], [7, 3], [10, 7],
  ];
  for (let i = 0; i + 1 < pts.length; i++)
    p.line(x + pts[i][0], y + pts[i][1], x + pts[i + 1][0], y + pts[i + 1][1], i % 3 === 0 ? '#c8302a' : '#1b1a17');
  // papel amassado
  p.px(x + 5, y + 4, '#d8ceb8');
}

/** bolo de fubá (anel) no prato (22×11) */
export function cornCake(p: Pix, x: number, y: number): void {
  p.ellipse(x + 11, y + 8, 11, 3, '#f4f0e6');
  p.ellipse(x + 11, y + 8.5, 10.5, 2.4, '#d8d4c8');
  // lateral
  p.rect(x + 3, y + 3, 16, 5, '#d89a3a');
  p.ellipse(x + 11, y + 7.5, 8, 2, '#c4862e');
  // topo dourado
  p.ellipse(x + 11, y + 3, 8, 2.6, '#f0c050');
  p.ellipse(x + 11, y + 3, 2.6, 1, '#8a5a24');
  p.hl(x + 5, x + 9, y + 2, '#f8d878');
  p.px(x + 15, y + 4, '#e8a83a');
  p.px(x + 6, y + 5, '#c4862e');
  p.px(x + 16, y + 6, '#b07424');
}

/** vela acesa; t anima a chama (3×8 + chama) */
export function candle(p: Pix, x: number, y: number, t: number, lit = true): void {
  p.rect(x, y + 3, 2, 6, '#f4f0e6');
  p.vl(x + 1, y + 3, y + 8, '#d8d0c0');
  p.px(x, y + 5, '#5aa7d6');
  p.px(x + 1, y + 7, '#5aa7d6');
  p.px(x + 1, y + 2, '#2a2420');
  if (!lit) return;
  const f = Math.floor(t / 110) % 4;
  p.glow(x + 1, y, 7, '#ffd890', 0.35, 3);
  p.px(x + (f === 1 ? 0 : 1), y - 1, '#ffe8a0');
  p.px(x + 1, y, '#f8c040');
  p.px(x, y, f % 2 ? '#f8a030' : '#f8c040');
  p.px(x + 1, y + 1, '#f8a030');
  if (f !== 2) p.px(x + 1, y - 2, '#fff4c8');
}

/** balde de plástico com água (12×10) */
export function bucket(p: Pix, x: number, y: number): void {
  p.line(x + 1, y + 2, x + 6, y - 2, '#8a948f');
  p.line(x + 6, y - 2, x + 10, y + 2, '#8a948f');
  p.rect(x, y + 2, 12, 2, '#3a6aa8');
  p.ellipse(x + 6, y + 3, 5, 1.2, '#7cc0dc');
  for (let yy = 4; yy < 10; yy++) {
    const inset = Math.floor((yy - 4) / 3);
    p.hl(x + inset, x + 11 - inset, y + yy, yy === 9 ? '#1f4a7a' : '#2f5f9a');
    p.px(x + inset + 1, y + yy, '#4a7ac0');
  }
}

/** envelope gordo de dinheiro (14×8) */
export function fatEnvelope(p: Pix, x: number, y: number): void {
  p.rect(x, y + 1, 14, 7, '#c9a46a');
  p.hl(x + 1, x + 12, y, '#d8b47a');
  p.hl(x, x + 13, y + 7, '#9a7a48');
  p.line(x, y + 1, x + 6, y + 4, '#a8844e');
  p.line(x + 13, y + 1, x + 7, y + 4, '#a8844e');
  // notas aparecendo
  p.hl(x + 2, x + 6, y, '#5f9a5a');
  p.px(x + 3, y - 1, '#7fbf6a');
  p.px(x + 4, y - 1, '#5f9a5a');
  // volume
  p.px(x + 12, y + 2, '#b8935a');
  p.px(x + 1, y + 6, '#b8935a');
}

/** aliança (4×3) com brilho piscando */
export function ring(p: Pix, x: number, y: number, t = 0): void {
  p.px(x + 1, y, '#f2d06a');
  p.px(x + 2, y, '#e8b931');
  p.px(x, y + 1, '#e8b931');
  p.px(x + 3, y + 1, '#a8802a');
  p.px(x + 1, y + 2, '#a8802a');
  p.px(x + 2, y + 2, '#c89a2a');
  if (Math.floor(t / 600) % 3 === 0) {
    p.px(x + 4, y - 2, '#ffffff');
    p.px(x + 4, y - 1, '#fff4c8');
    p.px(x + 5, y - 2, '#fff4c8');
    p.px(x + 3, y - 2, '#fff4c8');
    p.px(x + 4, y - 3, '#fff4c8');
  }
}

/** bombinha + espaçador (15×7) */
export function inhaler(p: Pix, x: number, y: number): void {
  // espaçador (tubo transparente)
  p.rect(x + 4, y + 2, 10, 4, '#cfe6f0');
  p.hl(x + 4, x + 13, y + 2, '#eef8fc');
  p.hl(x + 4, x + 13, y + 5, '#9fc4d4');
  p.vl(x + 14, y + 2, y + 5, '#7aa8bc');
  p.rect(x + 13, y + 3, 2, 2, '#5f8fa8');
  // bombinha (L)
  p.rect(x, y, 3, 5, '#3a6ad0');
  p.hl(x, x + 2, y, '#6a9af0');
  p.rect(x, y + 4, 5, 3, '#eef0ea');
  p.hl(x, x + 4, y + 6, '#c8ccc6');
}

/** vaso de flores (10×20) */
export function flowers(p: Pix, x: number, y: number): void {
  // caules
  p.line(x + 5, y + 12, x + 2, y + 4, '#3f7a3a');
  p.line(x + 5, y + 12, x + 5, y + 2, '#3f7a3a');
  p.line(x + 5, y + 12, x + 8, y + 5, '#3f7a3a');
  p.px(x + 3, y + 8, '#5f9a4a');
  p.px(x + 7, y + 9, '#5f9a4a');
  // flores
  const fl = (cx: number, cy: number, c: string, d: string) => {
    p.px(cx, cy - 1, c);
    p.px(cx - 1, cy, c);
    p.px(cx + 1, cy, d);
    p.px(cx, cy + 1, d);
    p.px(cx, cy, '#f2d45c');
  };
  fl(x + 2, y + 3, '#e8566a', '#a83448');
  fl(x + 5, y + 1, '#f4f0e6', '#c8c0b0');
  fl(x + 8, y + 4, '#f29a3a', '#b86a1a');
  // vaso
  p.rect(x + 2, y + 12, 6, 7, '#5f8fa8');
  p.hl(x + 2, x + 7, y + 12, '#8ab8d0');
  p.vl(x + 7, y + 13, y + 18, '#3f6f88');
  p.hl(x + 3, x + 6, y + 19, '#2f5f78');
  p.px(x + 3, y + 14, '#bfe3f2');
}

/** carta com selo (9×6) */
export function letter(p: Pix, x: number, y: number): void {
  p.rect(x, y, 9, 6, '#f4f0e6');
  p.hl(x, x + 8, y + 5, '#d0c8b4');
  p.vl(x + 8, y, y + 5, '#d0c8b4');
  p.rect(x + 6, y + 1, 2, 2, '#c8302a');
  p.hl(x + 1, x + 4, y + 3, '#8a948f');
  p.hl(x + 1, x + 3, y + 4, '#8a948f');
}

/** caixa de isopor com tampa (20×13) */
export function styrofoam(p: Pix, x: number, y: number): void {
  p.rect(x, y + 3, 20, 10, '#f2f2ec');
  p.vl(x + 19, y + 3, y + 12, '#c8c8c0');
  p.hl(x, x + 19, y + 12, '#b8b8b0');
  for (let i = 0; i < 9; i++) p.px(x + 2 + ((i * 7) % 16), y + 5 + ((i * 3) % 6), '#dcdcd4');
  // tampa levemente torta
  p.rect(x - 1, y + 1, 21, 3, '#fafaf6');
  p.hl(x - 1, x + 19, y + 3, '#d0d0c8');
  p.px(x + 20, y + 1, '#d0d0c8');
  // fita azul
  p.vl(x + 9, y + 1, y + 12, '#5aa7d6');
  p.vl(x + 10, y + 1, y + 12, '#3f87b6');
  floorShadow(p, x + 10, y + 13, 11, 2, 0.3);
}

/** cadeira de madeira em 3/4 (16×26). x,y = topo do encosto */
export function woodChair(p: Pix, x: number, y: number, shawl = false): void {
  const w = HOME.wood2;
  const d = HOME.wood;
  const l = HOME.tan;
  floorShadow(p, x + 8, y + 26, 9, 2.5, 0.3);
  // encosto
  p.vl(x + 2, y, y + 14, d);
  p.vl(x + 13, y, y + 14, d);
  p.rect(x + 2, y, 12, 3, w);
  p.hl(x + 2, x + 13, y, l);
  p.hl(x + 3, x + 12, y + 6, w);
  p.hl(x + 3, x + 12, y + 9, w);
  // assento
  p.rect(x, y + 14, 16, 4, w);
  p.hl(x, x + 15, y + 14, l);
  p.hl(x, x + 15, y + 17, d);
  // pernas
  p.vl(x + 1, y + 18, y + 25, d);
  p.vl(x + 14, y + 18, y + 25, d);
  p.vl(x + 3, y + 18, y + 22, '#3a2516');
  p.vl(x + 12, y + 18, y + 22, '#3a2516');
  if (shawl) {
    // xale de crochê da Dona Zélia no encosto
    const c = '#9a7ab0';
    const cd = '#6a4a80';
    for (let yy = y + 1; yy <= y + 9; yy++)
      for (let xx = x + 1; xx <= x + 14; xx++) {
        const edge = yy === y + 9 && (xx + yy) % 2 === 0;
        if (edge) continue;
        p.px(xx, yy, (xx + yy) % 3 === 0 ? cd : c);
      }
    for (let xx = x + 2; xx <= x + 13; xx += 3) p.px(xx, y + 10, cd);
  }
}

/** lâmpada pendurada (fio do teto até y+bulbY) */
export function hangingBulb(p: Pix, x: number, bulbY: number): void {
  p.vl(x, 0, bulbY - 2, '#1e1610');
  p.rect(x - 1, bulbY - 2, 3, 2, '#3a3430');
  p.rect(x - 2, bulbY, 5, 4, '#ffe8b0');
  p.rect(x - 1, bulbY, 3, 5, '#ffe8b0');
  p.px(x - 1, bulbY + 1, '#ffffff');
  p.px(x, bulbY + 1, '#fffbe8');
}

/** telefone de mesa da central (40×24), com teclado e fone no gancho */
export function deskPhone(p: Pix, x: number, y: number, ring = false, t = 0): void {
  const body = '#d8d2c0';
  const bodyS = '#a8a290';
  const dark = '#2a2a2a';
  floorShadow(p, x + 20, y + 23, 22, 3, 0.4);
  // base trapezoidal
  p.poly(
    [
      [x + 4, y + 8],
      [x + 36, y + 8],
      [x + 40, y + 22],
      [x, y + 22],
    ],
    body,
  );
  p.hl(x, x + 40, y + 22, bodyS);
  p.hl(x + 4, x + 36, y + 8, '#ece8da');
  // teclado 3×4
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 3; c++) {
      const kx = x + 14 + c * 4;
      const ky = y + 11 + r * 3;
      p.rect(kx, ky, 3, 2, '#f4f0e6');
      p.px(kx + 1, ky + 1, '#8a8478');
    }
  // visor e luz de linha
  p.rect(x + 27, y + 11, 8, 3, '#3a4a3a');
  p.hl(x + 28, x + 33, y + 12, '#7fd17a');
  const on = ring && Math.floor(t / 250) % 2 === 0;
  p.rect(x + 29, y + 16, 3, 2, on ? '#ff5040' : '#6a2420');
  p.rect(x + 33, y + 16, 2, 2, '#4a4a44');
  // fone no gancho
  const hy = ring && Math.floor(t / 90) % 2 === 0 ? -1 : 0;
  p.rect(x + 2, y + 3 + hy, 36, 5, dark);
  p.hl(x + 3, x + 36, y + 3 + hy, '#4a4a4a');
  p.rect(x, y + 2 + hy, 7, 7, dark);
  p.rect(x + 33, y + 2 + hy, 7, 7, dark);
  p.hl(x + 1, x + 5, y + 2 + hy, '#5a5a5a');
  p.hl(x + 34, x + 38, y + 2 + hy, '#5a5a5a');
  // fio enrolado
  for (let i = 0; i < 6; i++) p.px(x - 2 - (i % 2), y + 10 + i * 2, '#3a3a3a');
}

/**
 * porta-retrato da família (quente): você, o cônjuge (de vermelho) e o Liam.
 * gender = gênero do protagonista ('M' → a Lúcia, de cabelo preto comprido;
 * 'F' → o Alex); sem ele, o cônjuge sai neutro (cabelo preto curto).
 */
export function familyPhoto(p: Pix, x: number, y: number, w = 16, h = 12, gender?: 'M' | 'F'): void {
  p.rect(x, y, w, h, '#7a5030');
  p.frame(x, y, w, h, '#5a3a22');
  p.hl(x, x + w - 1, y, '#a8763f');
  const ix = x + 2;
  const iy = y + 2;
  const iw = w - 4;
  const ih = h - 4;
  p.rect(ix, iy, iw, ih, '#ffe2a3');
  p.rect(ix, iy + ih - 3, iw, 3, '#e8b860');
  const fig = (fx: number, hair: string, shirt: string, skin: string, small = false, longHair = false) => {
    const top = iy + (small ? 3 : 1);
    p.px(fx, top, hair);
    p.px(fx + 1, top, hair);
    p.px(fx, top + 1, skin);
    p.px(fx + 1, top + 1, skin);
    p.rect(fx - (small ? 0 : 1), top + 2, small ? 2 : 4, ih - (small ? 5 : 3), shirt);
    if (longHair) {
      // cabelo liso caindo dos dois lados do rosto até o ombro
      p.px(fx - 1, top + 1, hair);
      p.px(fx + 2, top + 1, hair);
      p.px(fx - 1, top + 2, hair);
      p.px(fx + 2, top + 2, hair);
    }
  };
  const step = Math.max(3, Math.floor(iw / 3));
  fig(ix + 1, '#1c1410', '#4f8a6e', '#d9a57e');
  fig(ix + 1 + step, '#1c1410', '#a8413a', gender === 'M' ? '#f3d3b5' : '#f1c7a5', false, gender === 'M');
  fig(ix + 1 + step * 2 - 1, '#3b2516', '#3f5f8a', '#f1c7a5', true);
  // pé do porta-retrato
  p.px(x + w - 3, y + h, '#5a3a22');
}

/** monitor com o mapa da cidade (conteúdo blitado por quem chama) */
export function monitorFrame(p: Pix, x: number, y: number, w: number, h: number): void {
  p.rect(x - 3, y - 3, w + 6, h + 6, '#1e2420');
  p.frame(x - 3, y - 3, w + 6, h + 6, '#0e1210');
  p.hl(x - 2, x + w + 1, y - 3, '#3a443e');
  p.rect(x, y, w, h, '#0d1311');
  // pé
  p.rect(x + Math.floor(w / 2) - 6, y + h + 3, 12, 4, '#1e2420');
  p.rect(x + Math.floor(w / 2) - 10, y + h + 7, 20, 2, '#2a322e');
}

/** post-it (8×8) com rabisco */
export function postit(p: Pix, x: number, y: number, c: string = CENTRAL.postit, seed = 1): void {
  p.rect(x, y, 8, 8, c);
  p.hl(x, x + 7, y, shade(c, 0.2));
  p.px(x + 7, y + 7, shade(c, -0.35));
  p.px(x + 6, y + 7, shade(c, -0.2));
  for (let r = 0; r < 3; r++) {
    const len = 3 + Math.floor(hash2(x + r, y, seed) * 4);
    p.hl(x + 1, x + len, y + 2 + r * 2, '#3a3a6a');
  }
}

/** pilha de papéis/formulários (w×h) */
export function papers(p: Pix, x: number, y: number, w: number, h: number, seed = 1): void {
  p.rect(x + 2, y + 2, w, h, '#c8c0aa');
  p.rect(x, y, w, h, '#f2ece0');
  p.hl(x, x + w - 1, y + h - 1, '#d4ccb8');
  for (let r = 3; r < h - 2; r += 2) {
    const len = Math.floor(w * (0.5 + hash2(r, x, seed) * 0.4));
    p.hl(x + 2, x + len, y + r, '#9aa49e');
  }
  p.rect(x + 2, y + 1, Math.min(10, w - 4), 1, '#c8302a');
}

/** manual de regulação (fichário verde) w×h */
export function manualBinder(p: Pix, x: number, y: number, w = 26, h = 34): void {
  p.rect(x, y, w, h, '#2f6a3c');
  p.rect(x, y, 4, h, '#1f4a2a');
  for (let r = 4; r < h - 2; r += 8) p.rect(x + 1, y + r, 2, 2, '#c8c8c0');
  p.hl(x, x + w - 1, y, '#4f8a5a');
  // etiqueta centrada na capa (o "REG" tem 11 px)
  const lw = Math.max(13, w - 8);
  const lx = x + 4 + Math.floor((w - 4 - lw) / 2);
  p.rect(lx, y + 5, lw, 9, PAPER);
  drawText(p, 'REG', lx + Math.floor((lw - 11) / 2), y + 7, '#c8302a');
  p.hl(x + 7, x + w - 5, y + 18, '#4f8a5a');
}

/** quadro de cortiça */
export function corkBoard(p: Pix, x: number, y: number, w: number, h: number): void {
  p.rect(x, y, w, h, '#5a3a22');
  p.rect(x + 2, y + 2, w - 4, h - 4, '#b8864e');
  for (let yy = y + 2; yy < y + h - 2; yy++)
    for (let xx = x + 2; xx < x + w - 2; xx++) {
      const n = hash2(xx, yy, 71);
      if (n < 0.18) p.px(xx, yy, '#a87640');
      else if (n > 0.93) p.px(xx, yy, '#c8965e');
    }
  p.hl(x, x + w - 1, y, '#7a5030');
  p.hl(x, x + w - 1, y + h - 1, '#3a2516');
}

/** percevejo */
export function pushPin(p: Pix, x: number, y: number, c: string): void {
  p.px(x, y, c);
  p.px(x + 1, y, shade(c, -0.3));
  p.px(x, y + 1, shade(c, -0.3));
  p.px(x - 1, y - 1, mix(c, '#ffffff', 0.5));
}

/** placa do número da casa (13×9) */
export function housePlate(p: Pix, x: number, y: number): void {
  p.rect(x, y, 13, 9, '#efe6cf');
  p.frame(x, y, 13, 9, '#c8bea8');
  drawText(p, '40', x + 3, y + 2, '#2a3a6a');
}

/** caixa de papelão fechada com fita */
export function cardBox(p: Pix, x: number, y: number, w: number, h: number): void {
  p.rect(x, y, w, h, '#c49a62');
  p.hl(x, x + w - 1, y, '#d8b47a');
  p.vl(x + w - 1, y + 1, y + h - 1, '#a8804a');
  p.vl(x + Math.floor(w / 2), y, y + 3, '#e8d4a8');
  p.hl(x, x + w - 1, y + h - 1, '#8a6a3a');
}
