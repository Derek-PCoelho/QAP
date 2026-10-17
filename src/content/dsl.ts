// Ajudantes de autoria: efeitos, condições, números e endereços recorrentes.
import type { Effect, Cond, VarName, KeyPatient, Source, BoardEntryIn, CallDef, DayDef, SceneDef, AddrIn, Ctx } from '../engine/types';

export const fx = {
  set: (f: string, v: boolean | number | string = true): Effect => (e) => e.set(f, v),
  unset: (f: string): Effect => (e) => e.unset(f),
  add: (v: VarName, d: number, reason?: string): Effect => (e) => e.add(v, d, reason),
  money: (d: number, reason: string): Effect => (e) => e.pay(d, reason),
  key: (k: KeyPatient, r: 'salvo' | 'perdido'): Effect => (e) => e.keyPatient(k, r),
  source: (s: Source): Effect => (e) => e.source(s),
  doc: (id: string): Effect => (e) => e.doc(id),
  board: (b: BoardEntryIn): Effect => (e) => e.board(b),
  ach: (id: string): Effect => (e) => e.achievement(id),
  toast: (t: string): Effect => (e) => e.toast(t),
  diary: (text: string, name = '', kind: 'nota' | 'vivo' | 'morto' = 'nota'): Effect => (e) => e.diary(text, kind, name),
  all: (...fs: Effect[]): Effect => (e) => fs.forEach((f) => f(e)),
  when: (c: Cond, f: Effect, g?: Effect): Effect => (e) => (c(e) ? f(e) : g?.(e)),
};

type Op = '>=' | '<=' | '>' | '<' | '==';
const cmp = (a: number, op: Op, b: number) => (op === '>=' ? a >= b : op === '<=' ? a <= b : op === '>' ? a > b : op === '<' ? a < b : a === b);

export const is = {
  flag: (f: string): Cond => (c) => c.flag(f),
  not: (f: string): Cond => (c) => !c.flag(f),
  v: (name: VarName, op: Op, n: number): Cond => (c) => cmp(c.v(name), op, n),
  money: (op: Op, n: number): Cond => (c) => cmp(c.money(), op, n),
  key: (k: KeyPatient, r: 'salvo' | 'perdido'): Cond => (c) => c.key(k) === r,
  day: (op: Op, n: number): Cond => (c) => cmp(c.day, op, n),
  all: (...cs: Cond[]): Cond => (c) => cs.every((x) => x(c)),
  any: (...cs: Cond[]): Cond => (c) => cs.some((x) => x(c)),
  present: (m: 'lucia' | 'davi' | 'zelia'): Cond => (c) => {
    const f = c.s.family[m];
    return f.status !== 'ausente' && f.status !== 'morto' && !f.away;
  },
  alive: (m: 'lucia' | 'davi' | 'zelia'): Cond => (c) => c.s.family[m].status !== 'morto',
};

/** identidade com tipagem (facilita autoria) */
export const call = (d: CallDef): CallDef => d;
export const day = (d: DayDef): DayDef => d;
export const scene = (s: SceneDef): SceneDef => s;

/** Números de telefone recorrentes (o quadro de trotes compara os 5 últimos dígitos). */
export const NUM = {
  cida: '(17) 3322-1408',
  biel: '(17) 99209-8877',
  casa: '(17) 3324-0040',
  vereador: '(17) 99100-0001',
  carla: '(17) 99812-3030',
  peixoto: '(17) 3321-4720',
  jairo: '(17) 3326-1720',
  rosangela: '(17) 99644-0112',
  marcos: '(17) 99731-2150',
  henrique_vizinha: '(17) 3321-3020',
} as const;

/** Endereços recorrentes (todos validados contra o mapa de Santa Aurora). */
export const ADDR: Record<string, AddrIn> = {
  cida: { rua: 'Rua Pitangueira', n: 845, bairro: 'Bela Vista', ref: 'Casa amarela com portão verde, do lado da Igreja São Benedito.' },
  casa: { rua: 'Rua das Acácias', n: 40, bairro: 'Vila Esperança', ref: 'Casa azul de muro baixo, perto da Base Vila Esperança.' },
  jairo: { rua: 'Rua Quaresmeira', n: 1720, bairro: 'Jardim Primavera', ref: 'Jairo Refrigeração, a casa é nos fundos da oficina.' },
  marcia: { rua: 'Rua Jacarandá', n: 215, bairro: 'Jardim Primavera', ref: 'Casa do portão azul, tem um pé de manga enorme na frente.' },
  rosangela: { rua: 'Rua Ipê', n: 112, bairro: 'Jardim Norte', ref: 'Sobrado verde, primeira casa depois da esquina.' },
  diego: { rua: 'Rua das Acácias', n: 88, bairro: 'Vila Esperança', ref: 'Quatro casas depois da casa azul.' },
  escola: { rua: 'Rua Ipê', n: 905, bairro: 'Jardim Norte', ref: 'Em frente à Escola Estadual Prof. Aurélio.' },
  igreja_bahia: { rua: 'Rua Bahia', n: 300, bairro: 'Centro' },
  parque: { rua: 'Rua do Parque', n: 1201, bairro: 'Parque das Exposições', ref: 'Portão principal do Parque de Exposições.' },
  central: { rua: 'Rua XV de Novembro', n: 601, bairro: 'Centro', ref: 'A própria Central de Regulação.' },
  osvaldo: { rua: 'Rua dos Bem-te-vis', n: 1480, bairro: 'Bela Vista', ref: 'Prédio Solar das Palmeiras, apto 41.' },
  odete: { rua: 'Rua dos Bem-te-vis', n: 610, bairro: 'Bela Vista', ref: 'Casa de esquina com grade dourada.' },
  henrique: { rua: 'Rua XV de Novembro', n: 1950, bairro: 'Centro', ref: 'Edifício Aurora, apartamento 302.' },
  antonio: { rua: 'Rua São João', n: 1240, bairro: 'Vila Nova', ref: 'Do lado do campinho de várzea.' },
};

/** texto condicionado ao gênero do protagonista */
export const g = (m: string, f: string) => (c: Ctx) => (c.g === 'M' ? m : f);
