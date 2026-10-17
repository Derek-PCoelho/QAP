// Rotas: Dijkstra sobre as ruas da grade, com alagamentos opcionais (dia 17).
import { MAP_W, MAP_H, isRoad, MIN_PER_TILE, DISPATCH_DELAY, BAIRROS, resolveAddress, STREETS, streetMax } from './map';
import type { AddrIn } from '../types';

export interface Route {
  path: [number, number][];
  cost: number;
  minutes: number;
  blocked: boolean;
}

export type FloodMode = 'none' | 'flood';

/** custo de atravessar o tile (1 = normal, Infinity = bloqueado) */
export function tileCost(x: number, y: number, mode: FloodMode): number {
  if (!isRoad(x, y)) return Infinity;
  if (mode === 'flood') {
    if (y === 36) return Infinity; // Av. Beira-Rio submersa
    if (y >= 33 && x >= 18 && x <= 46) return Infinity; // baixada da Vila Nova
    if (y >= 29 && y <= 32 && x >= 12 && x <= 40) return 3.2; // alagamentos parciais
    if (x === 26 && y >= 21) return 2.4; // Av. Sul com lâmina d'água
  }
  return 1;
}

/** fator de trânsito pela hora (min do dia) */
export function trafficFactor(min: number): number {
  const h = min / 60;
  if (h >= 7 && h < 8.5) return 1.3;
  if (h >= 11.75 && h < 13.25) return 1.15;
  if (h >= 17 && h < 19) return 1.35;
  return 1;
}

const DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function nearestRoad(p: [number, number]): [number, number] {
  const [px, py] = [Math.round(p[0]), Math.round(p[1])];
  if (isRoad(px, py)) return [px, py];
  for (let r = 1; r < 30; r++) {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const x = px + dx;
        const y = py + dy;
        if (isRoad(x, y)) return [x, y];
      }
  }
  return [26, 20];
}

/** Dijkstra simples (grade pequena: 2560 tiles). */
export function route(from: [number, number], to: [number, number], mode: FloodMode = 'none', timeOfDay = 600): Route {
  const a = nearestRoad(from);
  const b = nearestRoad(to);
  const N = MAP_W * MAP_H;
  const dist = new Float64Array(N).fill(Infinity);
  const prev = new Int32Array(N).fill(-1);
  const done = new Uint8Array(N);
  const start = a[1] * MAP_W + a[0];
  const goal = b[1] * MAP_W + b[0];
  dist[start] = 0;
  // fila de prioridade binária simples
  const heap: number[] = [start];
  const push = (i: number) => {
    heap.push(i);
    let c = heap.length - 1;
    while (c > 0) {
      const p = (c - 1) >> 1;
      if (dist[heap[p]] <= dist[heap[c]]) break;
      [heap[p], heap[c]] = [heap[c], heap[p]];
      c = p;
    }
  };
  const pop = (): number => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let c = 0;
      for (;;) {
        const l = c * 2 + 1;
        const r = l + 1;
        let m = c;
        if (l < heap.length && dist[heap[l]] < dist[heap[m]]) m = l;
        if (r < heap.length && dist[heap[r]] < dist[heap[m]]) m = r;
        if (m === c) break;
        [heap[m], heap[c]] = [heap[c], heap[m]];
        c = m;
      }
    }
    return top;
  };
  while (heap.length) {
    const cur = pop();
    if (done[cur]) continue;
    done[cur] = 1;
    if (cur === goal) break;
    const cx = cur % MAP_W;
    const cy = (cur / MAP_W) | 0;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
      const c = tileCost(nx, ny, mode);
      if (!isFinite(c)) continue;
      const ni = ny * MAP_W + nx;
      const nd = dist[cur] + c;
      if (nd < dist[ni]) {
        dist[ni] = nd;
        prev[ni] = cur;
        push(ni);
      }
    }
  }
  if (!isFinite(dist[goal])) {
    // sem rota: ainda assim devolve linha reta lenta (viatura presa / contorno pela rodovia)
    const manhattan = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    return {
      path: [a, b],
      cost: manhattan * 4,
      minutes: DISPATCH_DELAY + manhattan * 4 * MIN_PER_TILE * trafficFactor(timeOfDay),
      blocked: true,
    };
  }
  const path: [number, number][] = [];
  let c = goal;
  while (c !== -1) {
    path.push([c % MAP_W, (c / MAP_W) | 0]);
    if (c === start) break;
    c = prev[c];
  }
  path.reverse();
  return {
    path,
    cost: dist[goal],
    minutes: DISPATCH_DELAY + dist[goal] * MIN_PER_TILE * trafficFactor(timeOfDay),
    blocked: false,
  };
}

/** Posição alvo de um endereço (inclusive inválidos: ponta da rua / centro do bairro). */
export function addressTarget(a: AddrIn): [number, number] {
  const r = resolveAddress(a);
  if (r.pos) return r.pos;
  if (r.street) {
    const s = r.street;
    const i = s.to;
    return nearestRoad(s.axis === 'h' ? [i, s.at] : [s.at, i]);
  }
  const b = BAIRROS.find((x) => x.name.toLowerCase() === a.bairro.toLowerCase()) ?? BAIRROS[4];
  return nearestRoad([Math.round((b.x0 + b.x1) / 2), Math.round((b.y0 + b.y1) / 2)]);
}

export function streetCount(): number {
  return STREETS.length + STREETS.reduce((a, s) => a + (streetMax(s) > 0 ? 0 : 1), 0);
}
