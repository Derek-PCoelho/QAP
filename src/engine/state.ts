// Estado inicial, contextos para conteúdo e efeitos.
import type {
  GameState, Ctx, EffCtx, VarName, Gender, Difficulty, Mode, KeyPatient, Source, DiaryKind,
  BoardEntryIn, FamilyMember, MemberStatus, Toast,
} from './types';
import { rngNext, clamp, hashString } from './util';
import { resolveTokens, cleanName } from './text';

export const SAVE_VERSION = 4;

export const VAR_RANGE: Record<VarName, [number, number]> = {
  desgaste: [0, 100],
  lacos: [0, 10],
  integridade: [0, 10],
  humanidade: [0, 10],
  lealSimone: [0, 10],
  lealHenrique: [0, 10],
  intimBene: [0, 10],
  pressao: [0, 10],
  wesley: [0, 10],
  emprego: [0, 10],
};

export const VAR_LABEL: Record<VarName, string> = {
  desgaste: 'Desgaste',
  lacos: 'Laços',
  integridade: 'Integridade',
  humanidade: 'Humanidade',
  lealSimone: 'Lealdade da Simone',
  lealHenrique: 'Lealdade do Henrique',
  intimBene: 'Intimidade com o Bené',
  pressao: 'Pressão',
  wesley: 'Wesley',
  emprego: 'Emprego',
};

export interface NewGameOpts {
  gender: Gender;
  difficulty: Difficulty;
  mode?: Mode;
  seed?: number;
  variable?: boolean;
  /** começa a campanha neste dia (seleção de capítulo / testes) */
  startDay?: number;
  /** primeiro nome do protagonista (vazio = padrão do gênero) */
  name?: string;
}

export function newGameState(o: NewGameOpts): GameState {
  const seed = o.seed ?? (Math.floor(Math.random() * 2 ** 31) | 0);
  return {
    v: SAVE_VERSION,
    id: 'p' + (seed >>> 0).toString(36) + Date.now().toString(36),
    seed,
    rng: seed ^ 0x5f3759df,
    mode: o.mode ?? 'campanha',
    difficulty: o.difficulty,
    gender: o.gender,
    ...(cleanName(o.name) ? { name: cleanName(o.name) } : {}),
    variable: o.variable ?? false,
    day: Math.max(1, Math.min(20, Math.floor(o.startDay ?? 1))),
    phase: 'jornal',
    money: 150,
    vars: { desgaste: 10, lacos: 5, integridade: 7, humanidade: 3, lealSimone: 5, lealHenrique: 5, intimBene: 0, pressao: 4, wesley: 5, emprego: 6 },
    keys: {},
    sources: {},
    flags: {},
    family: {
      lucia: { status: 'bem', hunger: 0, risk: 0 },
      davi: { status: 'bem', hunger: 0, risk: 0 },
      zelia: { status: 'bem', hunger: 0, risk: 0 },
    },
    bills: {
      rentDebt: 0,
      rentOverdue: 0,
      rent: 100,
      energyMissed: 0,
      energyCut: false,
      foodMissed: 0,
      medsMissed: 0,
      gasMissed: 0,
      icebox: false,
      fridgeBroken: false,
      insulinSpoiled: false,
    },
    diary: [],
    board: [],
    docs: [],
    manual: [],
    achievements: [],
    history: [],
    totals: { warnings: 0, notes: 0, deaths: 0, saves: 0, handled: 0, pranks: 0, sindicancias: 0, coffee: 0, bicos: 0, calls: 0, golden: 0 },
    irritado: 0,
    createdAt: Date.now(),
    playSeconds: 0,
  };
}

export function randOf(s: GameState): number {
  const [n, v] = rngNext(s.rng);
  s.rng = n;
  return v;
}

export function makeCtx(s: GameState): Ctx {
  return {
    s,
    day: s.day,
    g: s.gender,
    flag: (n) => !!s.flags[n],
    val: <T,>(n: string) => s.flags[n] as unknown as T | undefined,
    v: (n) => s.vars[n],
    money: () => s.money,
    key: (k) => s.keys[k],
    rand: () => randOf(s),
  };
}

export interface EffSink {
  onVar?(v: VarName, delta: number, reason?: string): void;
  onMoney?(amount: number, reason: string): void;
  onToast?(t: Omit<Toast, 'id' | 't'>): void;
  onAchievement?(id: string): void;
}

// ---------------------------------------------------------------------------
// Origem do dinheiro (1.1, ROTEIRO Parte 3.1): a família fala do dinheiro que existe e de onde veio.
// Cada entrada positiva soma em `flags['renda_<origem>']` (total da campanha) e em
// `flags['renda_<origem>_d<dia>']` (do dia). Bicos: `flags['bico_d<dia>']` (noite na Intervenção naquele dia);
// o total de noites é `flags['noites_intervencao']` (gravado pela Intervenção, field.ts).
// ---------------------------------------------------------------------------
export type IncomeOrigin = 'salario' | 'bico' | 'atelie' | 'vereador' | 'outros';
export const INCOME_ORIGINS: readonly IncomeOrigin[] = ['salario', 'bico', 'atelie', 'vereador', 'outros'];

/** origem pelo motivo escrito no pagamento (fx.money/e.pay) */
export function incomeOriginOf(reason: string | undefined): IncomeOrigin {
  const r = (reason ?? '').toLowerCase();
  if (/vereador|envelope|gabinete|assessor/.test(r)) return 'vereador';
  if (/ateli|costura|barra|encomenda/.test(r)) return 'atelie';
  if (/interven|plant[aã]o extra|bico|ambul[aâ]ncia de noite/.test(r)) return 'bico';
  if (/sal[aá]rio|plant[aã]o do dia|pagamento do plant/.test(r)) return 'salario';
  return 'outros';
}

/** soma uma entrada de dinheiro na origem (total e do dia) */
export function recordIncome(s: GameState, origin: IncomeOrigin, amount: number) {
  if (!(amount > 0)) return;
  const k = 'renda_' + origin;
  s.flags[k] = (Number(s.flags[k]) || 0) + amount;
  const kd = `${k}_d${s.day}`;
  s.flags[kd] = (Number(s.flags[kd]) || 0) + amount;
}

/** quanto entrou de uma origem nos últimos `days` dias (incluindo hoje) */
export function incomeRecent(s: GameState, origin: IncomeOrigin, days: number): number {
  let sum = 0;
  for (let d = Math.max(1, s.day - days + 1); d <= s.day; d++) sum += Number(s.flags[`renda_${origin}_d${d}`]) || 0;
  return sum;
}

/** noites na Intervenção nos últimos `days` dias (incluindo hoje) */
export function bicosRecent(s: GameState, days = 4): number {
  let n = 0;
  for (let d = Math.max(1, s.day - days + 1); d <= s.day; d++) if (s.flags['bico_d' + d]) n++;
  return n;
}

/**
 * Origem dominante do dinheiro agora (ROTEIRO 3.1): vereador (envelope aceito/usado e não
 * devolvido) > bico (2+ noites nos últimos 4 dias) > ateliê (máquina rendendo nos últimos 3 dias)
 * > aliança (no dia da venda e no seguinte) > salário.
 */
export function moneyOrigin(s: GameState): IncomeOrigin | 'alianca' {
  const f = s.flags;
  if ((f['envelope_aceito'] || f['envelope_usado']) && !f['envelope_devolvido'] && !f['envelope_entregue']) return 'vereador';
  if (bicosRecent(s, 4) >= 2) return 'bico';
  if (f['maquina'] && (incomeRecent(s, 'atelie', 3) > 0 || f['juliana_cliente'])) return 'atelie';
  const av = Number(f['alianca_vendida_dia']) || 0;
  if (f['alianca_vendida'] && av && s.day - av <= 1) return 'alianca';
  return 'salario';
}

/** faixa do saldo (ROTEIRO 3.1): aperto < 150 ≤ justo < 600 ≤ folga < 1200 ≤ sobra */
export function moneyBand(money: number): 'aperto' | 'justo' | 'folga' | 'sobra' {
  return money < 150 ? 'aperto' : money < 600 ? 'justo' : money < 1200 ? 'folga' : 'sobra';
}

/** Contexto de efeitos: altera o estado com limites e registra notificações. */
export function makeEffCtx(s: GameState, sink: EffSink = {}): EffCtx {
  const c = makeCtx(s);
  const e: EffCtx = {
    ...c,
    set(flag, value = true) {
      s.flags[flag] = value;
    },
    unset(flag) {
      delete s.flags[flag];
    },
    add(v, delta, reason) {
      const [lo, hi] = VAR_RANGE[v];
      const before = s.vars[v];
      s.vars[v] = clamp(before + delta, lo, hi);
      const real = s.vars[v] - before;
      if (real !== 0) sink.onVar?.(v, real, reason);
    },
    pay(amount, reason) {
      s.money += amount;
      if (amount > 0) recordIncome(s, incomeOriginOf(reason), amount);
      sink.onMoney?.(amount, reason);
    },
    keyPatient(k: KeyPatient, r) {
      s.keys[k] = r;
    },
    source(src: Source) {
      s.sources[src] = true;
    },
    diary(text, kind: DiaryKind = 'nota', name = '') {
      s.diary.push({ id: 'd' + s.diary.length + '_' + s.day, day: s.day, name, text: resolveTokens(text, s.gender, s), kind, updates: [] });
    },
    board(entry: BoardEntryIn) {
      const ex = s.board.find((b) => b.id === entry.id);
      if (ex) ex.count++;
      else s.board.push({ ...entry, day: s.day, count: 1 });
    },
    doc(id) {
      if (!s.docs.includes(id)) s.docs.push(id);
    },
    toast(text) {
      sink.onToast?.({ text, kind: 'info' });
    },
    family(m: FamilyMember, status: MemberStatus) {
      s.family[m].status = status;
    },
    achievement(id) {
      if (!s.achievements.includes(id)) {
        s.achievements.push(id);
        sink.onAchievement?.(id);
      }
    },
  };
  return e;
}

/** 1.1 — cada café do plantão vira este Desgaste em casa (antes: 8), além de chegar irritado */
export const COFFEE_HOME_COST = 2;

export function seedFromLabel(label: string): number {
  return hashString(label);
}

/** precisão padrão da Simone por dia */
export function simoneAccuracy(s: GameState, dayAcc?: number): number {
  if (s.difficulty === 'narrativo') return 1;
  let a = dayAcc ?? (s.day <= 9 ? 0.9 : 0.75);
  if (s.vars.lealSimone >= 7) a += 0.08;
  if (s.vars.lealSimone <= 3) a -= 0.1;
  if (s.difficulty === 'real') a -= 0.15;
  return clamp(a, 0.3, 1);
}
