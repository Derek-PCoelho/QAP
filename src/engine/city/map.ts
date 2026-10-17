// =============================================================================
// Santa Aurora — mapa da cidade (grade 64x40, 1 quadra-tile = 100 m)
// Numeração brasileira métrica: nº = metros desde o início da rua.
// =============================================================================
import type { AddrIn, Dest } from '../types';
import { Rng } from '../util';

export const MAP_W = 64;
export const MAP_H = 40;
/** minutos por tile percorrido (≈ 24 km/h médios, trânsito urbano) */
export const MIN_PER_TILE = 0.25;
/** tempo de saída da base */
export const DISPATCH_DELAY = 1;

export interface Bairro {
  id: string;
  name: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** cor (índice de tom no mapa) */
  tone: number;
}

export const BAIRROS: Bairro[] = [
  { id: 'santa_luzia', name: 'Santa Luzia', x0: 0, y0: 0, x1: 19, y1: 13, tone: 0 },
  { id: 'jardim_norte', name: 'Jardim Norte', x0: 20, y0: 0, x1: 41, y1: 13, tone: 1 },
  { id: 'bela_vista', name: 'Bela Vista', x0: 42, y0: 0, x1: 63, y1: 13, tone: 2 },
  { id: 'distrito', name: 'Distrito Industrial', x0: 0, y0: 14, x1: 19, y1: 25, tone: 3 },
  { id: 'centro', name: 'Centro', x0: 20, y0: 14, x1: 41, y1: 25, tone: 4 },
  { id: 'jardim_primavera', name: 'Jardim Primavera', x0: 42, y0: 14, x1: 63, y1: 25, tone: 5 },
  { id: 'vila_esperanca', name: 'Vila Esperança', x0: 0, y0: 26, x1: 19, y1: 39, tone: 6 },
  { id: 'vila_nova', name: 'Vila Nova', x0: 20, y0: 26, x1: 41, y1: 39, tone: 7 },
  { id: 'parque', name: 'Parque das Exposições', x0: 42, y0: 26, x1: 63, y1: 39, tone: 8 },
];

export interface Street {
  name: string;
  /** h = horizontal (numeração cresce para leste), v = vertical (cresce para sul) */
  axis: 'h' | 'v';
  /** linha (h) ou coluna (v) */
  at: number;
  from: number;
  to: number;
  /** número máximo (padrão: comprimento em metros) */
  max?: number;
  avenue?: boolean;
}

export const STREETS: Street[] = [
  // ---- horizontais ----
  { name: 'Rua Paineira', axis: 'h', at: 2, from: 0, to: 19 },
  { name: 'Rua Ipê', axis: 'h', at: 2, from: 20, to: 41 },
  { name: 'Rua dos Bem-te-vis', axis: 'h', at: 2, from: 42, to: 63 },
  { name: 'Rua Sete de Setembro', axis: 'h', at: 7, from: 0, to: 63 },
  { name: 'Av. Santos Dumont', axis: 'h', at: 12, from: 0, to: 63, avenue: true },
  { name: 'Rua das Indústrias', axis: 'h', at: 16, from: 0, to: 19 },
  { name: 'Rua XV de Novembro', axis: 'h', at: 16, from: 20, to: 41 },
  { name: 'Rua Jacarandá', axis: 'h', at: 16, from: 42, to: 63 },
  { name: 'Av. Brasil', axis: 'h', at: 20, from: 0, to: 63, avenue: true },
  { name: 'Rua Pará', axis: 'h', at: 24, from: 0, to: 19 },
  { name: 'Rua Bahia', axis: 'h', at: 24, from: 20, to: 41 },
  { name: 'Rua das Mangueiras', axis: 'h', at: 24, from: 42, to: 63 },
  { name: 'Rua das Acácias', axis: 'h', at: 28, from: 0, to: 19 },
  { name: 'Rua Tiradentes', axis: 'h', at: 28, from: 20, to: 41 },
  { name: 'Rua do Parque', axis: 'h', at: 28, from: 42, to: 63 },
  { name: 'Rua das Palmeiras', axis: 'h', at: 32, from: 0, to: 8, max: 820 },
  { name: 'Rua Sabiá', axis: 'h', at: 32, from: 9, to: 19 },
  { name: 'Rua São João', axis: 'h', at: 32, from: 20, to: 41 },
  { name: 'Rua dos Expositores', axis: 'h', at: 32, from: 42, to: 63 },
  { name: 'Av. Beira-Rio', axis: 'h', at: 36, from: 0, to: 63, avenue: true },
  // ---- verticais ----
  { name: 'Rua Goiás', axis: 'v', at: 2, from: 0, to: 36 },
  { name: 'Rua Minas Gerais', axis: 'v', at: 8, from: 0, to: 36 },
  { name: 'Rua Dom Pedro II', axis: 'v', at: 14, from: 0, to: 36 },
  { name: 'Rua Rui Barbosa', axis: 'v', at: 20, from: 0, to: 36 },
  { name: 'Av. Norte', axis: 'v', at: 26, from: 0, to: 20, avenue: true },
  { name: 'Av. Sul', axis: 'v', at: 26, from: 21, to: 36, avenue: true },
  { name: 'Rua Marechal Deodoro', axis: 'v', at: 32, from: 0, to: 36 },
  { name: 'Rua Padre Anchieta', axis: 'v', at: 38, from: 0, to: 36 },
  { name: 'Av. Primavera', axis: 'v', at: 44, from: 0, to: 36, avenue: true },
  { name: 'Rua Quaresmeira', axis: 'v', at: 50, from: 0, to: 36 },
  { name: 'Rua Pitangueira', axis: 'v', at: 56, from: 0, to: 36 },
  { name: 'Rua das Exposições', axis: 'v', at: 62, from: 0, to: 36 },
];

export type LandmarkKind = 'hospital' | 'upa' | 'maternidade' | 'base' | 'central' | 'escola' | 'igreja' | 'praca' | 'casa' | 'parque' | 'posto' | 'comercio' | 'ubs' | 'publico';

export interface Landmark {
  id: string;
  name: string;
  short: string;
  kind: LandmarkKind;
  addr: AddrIn;
  /** tile (calculado) */
  pos?: [number, number];
  dest?: Dest;
  hidden?: boolean;
}

export const LANDMARKS: Landmark[] = [
  { id: 'central', name: 'Central de Regulação', short: 'CENTRAL', kind: 'central', addr: { rua: 'Rua XV de Novembro', n: 601, bairro: 'Centro' } },
  { id: 'reg', name: 'Hospital Regional de Santa Aurora', short: 'REGIONAL', kind: 'hospital', dest: 'REG', addr: { rua: 'Av. Brasil', n: 3301, bairro: 'Centro' } },
  { id: 'upa', name: 'UPA Norte 24h', short: 'UPA NORTE', kind: 'upa', dest: 'UPA', addr: { rua: 'Av. Norte', n: 801, bairro: 'Jardim Norte' } },
  { id: 'mat', name: 'Maternidade Municipal', short: 'MATERNIDADE', kind: 'maternidade', dest: 'MAT', addr: { rua: 'Rua Tiradentes', n: 1301, bairro: 'Vila Nova' } },
  { id: 'base_centro', name: 'Base Centro (USA 01 · USB 02 · USB 04)', short: 'BASE CENTRO', kind: 'base', addr: { rua: 'Av. Brasil', n: 2301, bairro: 'Centro' } },
  { id: 'base_norte', name: 'Base Norte (USA 02 · USB 03 · USB 05)', short: 'BASE NORTE', kind: 'base', addr: { rua: 'Av. Norte', n: 301, bairro: 'Jardim Norte' } },
  { id: 'base_ve', name: 'Base Vila Esperança (USA 03 · USB 01)', short: 'BASE V.ESP.', kind: 'base', addr: { rua: 'Rua das Acácias', n: 901, bairro: 'Vila Esperança' } },
  { id: 'casa', name: 'Sua casa — Rua das Acácias, 40', short: 'SUA CASA', kind: 'casa', addr: { rua: 'Rua das Acácias', n: 40, bairro: 'Vila Esperança' } },
  { id: 'escola', name: 'Escola Estadual Prof. Aurélio Valença', short: 'ESC. ESTADUAL', kind: 'escola', addr: { rua: 'Rua Ipê', n: 901, bairro: 'Jardim Norte' } },
  { id: 'escola_davi', name: 'E.M. Monteiro Lobato (escola do Liam)', short: 'ESC. LIAM', kind: 'escola', addr: { rua: 'Rua Sabiá', n: 501, bairro: 'Vila Esperança' } },
  { id: 'igreja_batista', name: 'Igreja Batista Nova Aliança', short: 'IGREJA', kind: 'igreja', addr: { rua: 'Rua Bahia', n: 300, bairro: 'Centro' } },
  { id: 'matriz', name: 'Igreja Matriz de N. Sra. Aparecida', short: 'MATRIZ', kind: 'igreja', addr: { rua: 'Rua XV de Novembro', n: 1201, bairro: 'Centro' } },
  { id: 'camara', name: 'Câmara Municipal', short: 'CÂMARA', kind: 'publico', addr: { rua: 'Rua XV de Novembro', n: 1601, bairro: 'Centro' } },
  { id: 'parque_exp', name: 'Parque de Exposições', short: 'PARQUE EXP.', kind: 'parque', addr: { rua: 'Rua do Parque', n: 1201, bairro: 'Parque das Exposições' } },
  { id: 'posto', name: 'Posto Avenida', short: 'POSTO', kind: 'posto', addr: { rua: 'Av. Norte', n: 1001, bairro: 'Jardim Norte' } },
  { id: 'shopping', name: 'Shopping Aurora', short: 'SHOPPING', kind: 'comercio', addr: { rua: 'Av. Brasil', n: 4801, bairro: 'Jardim Primavera' } },
  { id: 'rodoviaria', name: 'Rodoviária', short: 'RODOVIÁRIA', kind: 'publico', addr: { rua: 'Av. Brasil', n: 1501, bairro: 'Distrito Industrial' } },
  { id: 'ubs_ve', name: 'UBS Vila Esperança', short: 'UBS', kind: 'ubs', addr: { rua: 'Rua Sabiá', n: 1101, bairro: 'Vila Esperança' } },
  { id: 'ubs_centro', name: 'UBS Central', short: 'UBS', kind: 'ubs', addr: { rua: 'Rua Bahia', n: 1601, bairro: 'Centro' } },
];

// ----------------------------------------------------------------------------
// Grade
// ----------------------------------------------------------------------------
export const TILE_BLOCK = 0;
export const TILE_ROAD = 1;
export const TILE_AVENUE = 2;
export const TILE_WATER = 3;
export const TILE_PARK = 4;

let GRID: Uint8Array | null = null;

export function grid(): Uint8Array {
  if (GRID) return GRID;
  const g = new Uint8Array(MAP_W * MAP_H);
  // rio
  for (let x = 0; x < MAP_W; x++) {
    g[38 * MAP_W + x] = TILE_WATER;
    g[39 * MAP_W + x] = TILE_WATER;
    if ((x * 7) % 11 < 3) g[37 * MAP_W + x] = TILE_WATER;
  }
  // parques (praça da matriz, parque de exposições, bosque de santa luzia)
  const parks: [number, number, number, number][] = [
    [33, 17, 37, 19],
    [51, 29, 61, 31],
    [51, 33, 61, 35],
    [3, 3, 7, 6],
    [45, 3, 49, 6],
  ];
  for (const [x0, y0, x1, y1] of parks) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y * MAP_W + x] = TILE_PARK;
  for (const s of STREETS) {
    for (let i = s.from; i <= s.to; i++) {
      const [x, y] = s.axis === 'h' ? [i, s.at] : [s.at, i];
      if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
      const cur = g[y * MAP_W + x];
      g[y * MAP_W + x] = s.avenue || cur === TILE_AVENUE ? TILE_AVENUE : TILE_ROAD;
    }
  }
  GRID = g;
  return g;
}

export function tileAt(x: number, y: number): number {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return TILE_BLOCK;
  return grid()[y * MAP_W + x];
}

export function isRoad(x: number, y: number): boolean {
  const t = tileAt(x, y);
  return t === TILE_ROAD || t === TILE_AVENUE;
}

export function bairroAt(x: number, y: number): Bairro {
  for (const b of BAIRROS) if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) return b;
  return BAIRROS[4];
}

// ----------------------------------------------------------------------------
// Endereços
// ----------------------------------------------------------------------------
export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^(r\.|rua)\s+/, 'rua ')
    .replace(/^(av\.|avenida)\s+/, 'av. ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function streetsNamed(name: string): Street[] {
  const n = norm(name);
  return STREETS.filter((s) => norm(s.name) === n);
}

export function streetMax(s: Street): number {
  return s.max ?? (s.to - s.from) * 100 + 99;
}

export interface AddrResult {
  kind: 'ok' | 'sem_rua' | 'invalido' | 'bairro' | 'marco';
  street?: Street;
  pos?: [number, number];
  bairro?: Bairro;
  landmark?: Landmark;
  message: string;
  range?: [number, number];
}

function posOn(s: Street, n: number): [number, number] {
  const max = streetMax(s);
  const len = s.to - s.from;
  const frac = Math.min(1, Math.max(0, (n - 1) / Math.max(1, max)));
  // métrico: 100 m por tile
  const i = s.max ? s.from + Math.round(frac * len) : s.from + Math.min(len, Math.floor((n - 1) / 100));
  return s.axis === 'h' ? [i, s.at] : [s.at, i];
}

export function resolveAddress(a: AddrIn): AddrResult {
  const segs = streetsNamed(a.rua);
  if (!segs.length) {
    return { kind: 'sem_rua', message: `"${a.rua}" não existe no cadastro de logradouros de Santa Aurora.` };
  }
  // segmentos da mesma rua (ex.: Av. Norte/Sul são nomes distintos; a mesma rua não se repete)
  const s = segs[0];
  const max = streetMax(s);
  if (a.n < 1 || a.n > max) {
    return {
      kind: 'invalido',
      street: s,
      range: [1, max],
      message: `${s.name} vai do nº 1 ao nº ${max}. O nº ${a.n} não existe.`,
    };
  }
  const pos = posOn(s, a.n);
  const b = bairroAt(pos[0], pos[1]);
  const lm = landmarkAtAddress(a);
  if (norm(b.name) !== norm(a.bairro)) {
    return {
      kind: 'bairro',
      street: s,
      pos,
      bairro: b,
      landmark: lm,
      message: `${s.name}, ${a.n} fica no ${b.name}, não em "${a.bairro}".`,
    };
  }
  if (lm) {
    return { kind: 'marco', street: s, pos, bairro: b, landmark: lm, message: `${s.name}, ${a.n} — ${b.name}. No endereço: ${lm.name}.` };
  }
  return { kind: 'ok', street: s, pos, bairro: b, message: `${s.name}, ${a.n} — ${b.name}.` };
}

export function landmarkAtAddress(a: AddrIn): Landmark | undefined {
  const n = norm(a.rua);
  return LANDMARKS.find((l) => norm(l.addr.rua) === n && Math.abs(l.addr.n - a.n) <= 30 && l.kind !== 'casa' && l.kind !== 'base');
}

export function landmarkPos(id: string): [number, number] {
  const l = LANDMARKS.find((x) => x.id === id);
  if (!l) throw new Error('landmark ' + id);
  if (!l.pos) {
    const r = resolveAddress(l.addr);
    l.pos = r.pos ?? [0, 0];
  }
  return l.pos;
}

export function destLandmark(d: Dest): Landmark {
  return LANDMARKS.find((l) => l.dest === d)!;
}

/** Faixas de numeração por bairro (para autores de conteúdo e geração). */
export function streetRanges(): { street: string; bairro: string; from: number; to: number }[] {
  const out: { street: string; bairro: string; from: number; to: number }[] = [];
  for (const s of STREETS) {
    const max = streetMax(s);
    let cur: { bairro: string; from: number; to: number } | null = null;
    const step = s.max ? Math.max(1, Math.floor(max / (s.to - s.from + 1))) : 100;
    for (let n = 1; n <= max; n += step) {
      const p = posOn(s, n);
      const b = bairroAt(p[0], p[1]).name;
      if (!cur || cur.bairro !== b) {
        if (cur) out.push({ street: s.name, ...cur });
        cur = { bairro: b, from: n, to: n };
      } else cur.to = Math.min(max, n + step - 1);
    }
    if (cur) out.push({ street: s.name, ...cur, to: max });
  }
  return out;
}

/** Endereço aleatório válido (opcionalmente num bairro). */
export function randomAddress(rng: Rng, bairroName?: string): AddrIn {
  const ranges = streetRanges().filter((r) => !bairroName || r.bairro === bairroName);
  const r = rng.pick(ranges);
  const span = Math.max(1, r.to - r.from);
  let n = r.from + Math.floor(rng.next() * span);
  n = Math.max(r.from, Math.min(r.to, n - (n % 2) + (rng.chance(0.5) ? 1 : 0)));
  if (n < 1) n = 1;
  return { rua: r.street, n, bairro: r.bairro };
}

/** Endereço que NÃO existe (para trotes). */
export function invalidAddress(rng: Rng): AddrIn {
  const fakeStreets = ['Rua Saturno', 'Rua das Galáxias', 'Rua Marte', 'Travessa do Sossego', 'Rua 47', 'Rua Plutão', 'Alameda das Estrelas'];
  if (rng.chance(0.5)) {
    return { rua: rng.pick(fakeStreets), n: rng.int(10, 999), bairro: rng.pick(BAIRROS).name };
  }
  const s = rng.pick(STREETS.filter((x) => streetMax(x) < 2500));
  return { rua: s.name, n: streetMax(s) + rng.int(200, 3000), bairro: bairroAt(...posOn(s, streetMax(s))).name };
}

export function addrText(a: AddrIn): string {
  return `${a.rua}, ${a.n} — ${a.bairro}`;
}
