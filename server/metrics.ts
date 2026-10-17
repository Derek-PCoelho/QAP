// =============================================================================
// Métricas de calibragem (documento de design, seção 2.8 "Metas de calibragem
// para o playtest"), calculadas a partir da telemetria bruta.
//
// Como os eventos viram campanhas:
//  • jogador = profileId do evento, ou o profileId visto em outro evento da mesma
//    sessão, ou o sessionId (o cliente guarda o sessionId no navegador);
//  • os eventos de cada jogador são ordenados pelo horário do cliente (t) e cada
//    `campaign_start` abre uma campanha nova; a 1ª delas é a "1ª campanha", a não
//    ser que o cliente tenha mandado `first: false` (o navegador já jogara antes);
//  • eventos antes de qualquer `campaign_start` formam uma campanha "órfã": entram
//    nas médias por dia, game overs, tempo por ligação e taxas gerais, mas nunca
//    nas métricas de 1ª campanha (nem quando há filtro de dificuldade);
//  • eventos idênticos (mesma sessão, nome, t e dados) contam uma vez só.
// =============================================================================
import type { TelemetryRecord } from './store/types';

export const METRIC_EVENTS = [
  'campaign_start',
  'day_end',
  'ending',
  'gameover',
  'bico',
  'd9_choice',
  'rendezvous',
  'cida_d19',
  'call_time',
  'infinite_end',
] as const;

export type EndingKind = 'ruim' | 'normal' | 'bom' | 'secreto';
export const ENDING_KINDS: readonly EndingKind[] = ['ruim', 'normal', 'bom', 'secreto'];
const ENDING_LABELS: Record<EndingKind, string> = { ruim: 'Ruim', normal: 'Normal', bom: 'Bom', secreto: 'Secreto' };

export const GAMEOVER_KINDS = ['exonerado', 'despejo', 'colapso', 'sindicancia'] as const;
const GAMEOVER_LABELS: Record<string, string> = {
  exonerado: 'Exonerado',
  despejo: 'Despejo',
  colapso: 'Colapso',
  sindicancia: 'Sindicância',
};

export const TARGETS = {
  reach20: { min: 55, max: 65 },
  endings: { ruim: 30, normal: 50, bom: 15, secreto: 5, tolerance: 10 } as Record<EndingKind, number> & { tolerance: number },
  bicos: { min: 2, max: 4 },
  usaDavi: { min: 35, max: 50, alertBelow: 20 },
  rendezvous: { min: 10, max: 15 },
  /** "≈60%": aceitamos 50–70%; abaixo de 40% é alerta */
  cida: { min: 50, max: 70, alertBelow: 40 },
  callTime: { min: 75, max: 95 },
} as const;

/** call_time acima disso (ou ≤ 0) é descartado como lixo (jogo pausado, aba esquecida…) */
export const CALL_TIME_MAX_SECONDS = 3600;
/** abaixo disso a métrica ganha a nota "amostra pequena" */
export const SMALL_SAMPLE = 10;

export const PER_DAY_FIELDS = ['warnings', 'notes', 'deaths', 'saves', 'handled', 'pay', 'desgaste', 'money'] as const;
export type PerDayField = (typeof PER_DAY_FIELDS)[number];

export type Status = 'ok' | 'bad' | 'nodata';
export type MetricId = 'reach20' | 'bicos' | 'usaDavi' | 'rendezvous' | 'cida' | 'callTime';

export interface Metric {
  id: MetricId;
  label: string;
  /** como o número é calculado (mostrado no painel) */
  definition: string;
  unit: '%' | 's' | '';
  value: number | null;
  /** tamanho da amostra (denominador) */
  n: number;
  status: Status;
  target: { min: number; max: number; text: string };
  /** faixa do medidor no painel */
  scale: { min: number; max: number };
  notes: string[];
  /** o mesmo cálculo restrito à 1ª campanha de cada jogador */
  firstCampaign?: { value: number | null; n: number };
  detail?: Record<string, number | null>;
}

export interface EndingsReport {
  n: number;
  status: Status;
  tolerance: number;
  kinds: Array<{ kind: EndingKind; label: string; count: number; pct: number | null; target: number; status: Status }>;
  notes: string[];
}

export type PerDayRow = { day: number; n: number } & Record<PerDayField, number | null>;

export interface MetricsReport {
  generatedAt: string;
  storage: string;
  version: string;
  filters: { difficulty: string | null; since: number | null };
  totals: {
    /** eventos de jogo considerados (após filtros e deduplicação) */
    events: number;
    /** eventos guardados no servidor (todos os tipos, sem filtro) */
    stored: number;
    sessions: number;
    players: number;
    campaigns: number;
    firstCampaigns: number;
  };
  metrics: Metric[];
  endings: EndingsReport;
  firstCampaignOutcomes: { total: number; reached20: number; gameover: number; inProgress: number };
  gameovers: { total: number; byKind: Array<{ kind: string; label: string; count: number; avgDay: number | null }> };
  perDay: PerDayRow[];
  d9: { M: Record<string, number>; G: Record<string, number>; marcia: Record<string, number> };
  infinite: { runs: number; avgScore: number | null; avgCalls: number | null; bestScore: number | null };
  callTime: { n: number; mean: number | null; median: number | null; p90: number | null };
}

export interface MetricsOptions {
  difficulty?: string | null;
  since?: number | null;
  storage?: string;
  version?: string;
  /** total de eventos guardados (para exibição) */
  stored?: number;
  now?: number;
}

// ----------------------------------------------------------------------------
// utilidades
// ----------------------------------------------------------------------------
type Data = Record<string, unknown>;

const asData = (v: unknown): Data => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Data) : {});
const num = (d: Data, k: string): number | null => {
  const v = d[k];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};
const str = (d: Data, k: string): string | null => {
  const v = d[k];
  return typeof v === 'string' ? v : null;
};
const round1 = (x: number): number => Math.round(x * 10) / 10;
const pct = (hits: number, total: number): number | null => (total > 0 ? round1((hits / total) * 100) : null);
const mean = (xs: readonly number[]): number | null => (xs.length ? round1(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

function quantile(sorted: readonly number[], q: number): number | null {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return round1(sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo));
}

const band = (v: number | null, min: number, max: number): Status => (v === null ? 'nodata' : v >= min && v <= max ? 'ok' : 'bad');
const isEndingKind = (k: string): k is EndingKind => (ENDING_KINDS as readonly string[]).includes(k);

function sampleNotes(n: number): string[] {
  return n > 0 && n < SMALL_SAMPLE ? [`Amostra pequena (n = ${n}).`] : [];
}

// ----------------------------------------------------------------------------
// campanhas
// ----------------------------------------------------------------------------
interface Ev {
  name: string;
  d: Data;
}

interface Campaign {
  player: string;
  /** 0 = 1ª campanha do jogador; -1 = eventos sem campaign_start */
  index: number;
  /** campaign_start.first enviado pelo cliente (false = o navegador já tinha jogado antes) */
  firstFlag: boolean | null;
  difficulty: string | null;
  events: Ev[];
  sessions: Set<string>;
}

interface Facts {
  c: Campaign;
  /** primeiro desfecho: chegou ao dia 20 (day_end ≥ 20 ou final) ou game over */
  terminal: 'reached20' | 'gameover' | null;
  ending: EndingKind | null;
  completed: boolean;
  maxDay: number;
  bicoDays: Set<number>;
  d9: { scenario: string | null; davi: string | null; marcia: string | null } | null;
  rendezvous9: boolean;
  cida: boolean | null;
  dayEnds: Map<number, Data>;
  gameovers: Array<{ kind: string; day: number | null }>;
  callTimes: number[];
}

function analyze(c: Campaign): Facts {
  const f: Facts = {
    c,
    terminal: null,
    ending: null,
    completed: false,
    maxDay: 0,
    bicoDays: new Set(),
    d9: null,
    rendezvous9: false,
    cida: null,
    dayEnds: new Map(),
    gameovers: [],
    callTimes: [],
  };
  let anonymousBico = 0;
  const seeDay = (day: number | null) => {
    if (day !== null && Number.isInteger(day) && day > f.maxDay && day <= 99) f.maxDay = day;
  };
  for (const e of c.events) {
    const d = e.d;
    switch (e.name) {
      case 'day_end': {
        const day = num(d, 'day');
        if (day === null || !Number.isInteger(day) || day < 1 || day > 99) break;
        seeDay(day);
        f.dayEnds.set(day, d); // vale o último registro do dia (recarregar e rejogar substitui)
        if (day >= 20) {
          f.completed = true;
          if (f.terminal === null) f.terminal = 'reached20';
        }
        break;
      }
      case 'ending': {
        const kind = str(d, 'kind');
        if (kind !== null && isEndingKind(kind) && f.ending === null) f.ending = kind;
        f.completed = true;
        seeDay(20);
        if (f.terminal === null) f.terminal = 'reached20';
        break;
      }
      case 'gameover': {
        const day = num(d, 'day');
        seeDay(day);
        f.gameovers.push({ kind: str(d, 'kind') ?? 'desconhecido', day });
        if (f.terminal === null) f.terminal = 'gameover';
        break;
      }
      case 'bico': {
        const day = num(d, 'day');
        seeDay(day);
        f.bicoDays.add(day ?? -++anonymousBico);
        break;
      }
      case 'd9_choice':
        if (!f.d9) f.d9 = { scenario: str(d, 'scenario'), davi: str(d, 'davi'), marcia: str(d, 'marcia') };
        seeDay(9);
        break;
      case 'rendezvous': {
        const day = num(d, 'day');
        seeDay(day);
        if (day === 9) f.rendezvous9 = true;
        break;
      }
      case 'cida_d19':
        if (f.cida === null && typeof d.recognized === 'boolean') f.cida = d.recognized;
        seeDay(19);
        break;
      case 'call_time': {
        seeDay(num(d, 'day'));
        const sec = num(d, 'seconds');
        if (sec !== null && sec > 0 && sec <= CALL_TIME_MAX_SECONDS) f.callTimes.push(sec);
        break;
      }
      default:
        break;
    }
  }
  return f;
}

function rate(facts: readonly Facts[], hit: (f: Facts) => boolean): { value: number | null; n: number; hits: number } {
  const hits = facts.filter(hit).length;
  return { value: pct(hits, facts.length), n: facts.length, hits };
}

// ----------------------------------------------------------------------------
// cálculo principal
// ----------------------------------------------------------------------------
export function computeMetrics(records: readonly TelemetryRecord[], opts: MetricsOptions = {}): MetricsReport {
  const difficulty = opts.difficulty ?? null;

  // 1) deduplicação de reenvios
  const seen = new Set<string>();
  const events: TelemetryRecord[] = [];
  for (const r of records) {
    let key: string;
    try {
      key = `${r.sessionId}\u0001${r.name}\u0001${r.t}\u0001${JSON.stringify(r.data)}`;
    } catch {
      key = `#${r.seq}`;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    events.push(r);
  }

  // 2) quem é o jogador de cada evento
  const sessionProfile = new Map<string, string>();
  for (const r of events) if (r.profileId && !sessionProfile.has(r.sessionId)) sessionProfile.set(r.sessionId, r.profileId);
  const playerOf = (r: TelemetryRecord): string => {
    const p = r.profileId ?? sessionProfile.get(r.sessionId);
    return p ? `p:${p}` : `s:${r.sessionId}`;
  };
  const byPlayer = new Map<string, TelemetryRecord[]>();
  for (const r of events) {
    const k = playerOf(r);
    const list = byPlayer.get(k);
    if (list) list.push(r);
    else byPlayer.set(k, [r]);
  }

  // 3) campanhas
  const campaigns: Campaign[] = [];
  const infinite: Array<{ d: Data; sessionId: string; player: string }> = [];
  for (const [player, list] of byPlayer) {
    list.sort((a, b) => a.t - b.t || a.seq - b.seq);
    let current: Campaign | null = null;
    let orphan: Campaign | null = null;
    let count = 0;
    for (const r of list) {
      const d = asData(r.data);
      if (r.name === 'campaign_start') {
        current = {
          player,
          index: count++,
          firstFlag: typeof d.first === 'boolean' ? d.first : null,
          difficulty: str(d, 'difficulty'),
          events: [],
          sessions: new Set([r.sessionId]),
        };
        campaigns.push(current);
        continue;
      }
      if (r.name === 'infinite_end') {
        infinite.push({ d, sessionId: r.sessionId, player });
        continue;
      }
      let target = current;
      if (!target) {
        if (!orphan) {
          orphan = { player, index: -1, firstFlag: null, difficulty: null, events: [], sessions: new Set() };
          campaigns.push(orphan);
        }
        target = orphan;
      }
      target.events.push({ name: r.name, d });
      target.sessions.add(r.sessionId);
    }
  }

  // 4) filtro de dificuldade (eventos sem campanha conhecida ficam de fora)
  const included = difficulty ? campaigns.filter((c) => c.difficulty === difficulty) : campaigns;
  const facts = included.map(analyze);
  const real = facts.filter((f) => f.c.index >= 0);
  const isFirst = (f: Facts) => f.c.index === 0 && f.c.firstFlag !== false;
  const firsts = facts.filter(isFirst);

  // totais
  const sessions = new Set<string>();
  const players = new Set<string>();
  let considered = 0;
  for (const c of included) {
    for (const sid of c.sessions) sessions.add(sid);
    players.add(c.player);
    considered += c.events.length + (c.index >= 0 ? 1 : 0);
  }
  const infiniteRuns = difficulty ? [] : infinite;
  for (const run of infiniteRuns) {
    sessions.add(run.sessionId);
    players.add(run.player);
    considered++;
  }

  const metrics: Metric[] = [];

  // --- chegam ao dia 20 na 1ª tentativa -------------------------------------
  const concluded = firsts.filter((f) => f.terminal !== null);
  const reach = rate(concluded, (f) => f.terminal === 'reached20');
  const inProgress = firsts.length - concluded.length;
  metrics.push({
    id: 'reach20',
    label: 'Chegam ao dia 20 na 1ª tentativa',
    definition:
      '1ªs campanhas já decididas cujo primeiro desfecho foi chegar ao dia 20 (day_end do dia 20 ou final) antes de qualquer game over.',
    unit: '%',
    value: reach.value,
    n: reach.n,
    status: band(reach.value, TARGETS.reach20.min, TARGETS.reach20.max),
    target: { min: TARGETS.reach20.min, max: TARGETS.reach20.max, text: '55–65%' },
    scale: { min: 0, max: 100 },
    notes: [
      ...sampleNotes(reach.n),
      ...(inProgress > 0 ? [`${inProgress} 1ª(s) campanha(s) em andamento ou abandonada(s) ficaram de fora.`] : []),
    ],
    detail: { chegaram: reach.hits, gameOver: reach.n - reach.hits, emAndamento: inProgress },
  });

  // --- bicos por campanha ----------------------------------------------------
  const completed = real.filter((f) => f.completed);
  const bicos = mean(completed.map((f) => f.bicoDays.size));
  const completedFirst = completed.filter(isFirst);
  metrics.push({
    id: 'bicos',
    label: 'Bicos por campanha',
    definition: 'Média de dias com bico (dias distintos) nas campanhas que chegaram ao fim (dia 20 ou final).',
    unit: '',
    value: bicos,
    n: completed.length,
    status: band(bicos, TARGETS.bicos.min, TARGETS.bicos.max),
    target: { min: TARGETS.bicos.min, max: TARGETS.bicos.max, text: '2–4 por campanha' },
    scale: { min: 0, max: Math.max(8, Math.ceil((bicos ?? 0) + 1)) },
    notes: sampleNotes(completed.length),
    firstCampaign: { value: mean(completedFirst.map((f) => f.bicoDays.size)), n: completedFirst.length },
  });

  // --- USA para o Liam no cenário M ------------------------------------------
  const inM = facts.filter((f) => f.d9?.scenario === 'M');
  const davi = rate(inM, (f) => f.d9?.davi === 'USA');
  const daviFirst = rate(
    inM.filter(isFirst),
    (f) => f.d9?.davi === 'USA',
  );
  const daviNotes = sampleNotes(davi.n);
  if (davi.value !== null && davi.value < TARGETS.usaDavi.alertBelow) {
    daviNotes.unshift('Abaixo de 20%: o dilema está fraco demais.');
  }
  metrics.push({
    id: 'usaDavi',
    label: 'Mandam a USA para o Liam (cenário M)',
    definition: 'Entre as campanhas com a escolha do dia 9 no cenário M (vale a primeira escolha registrada), % que mandou a USA para o Liam.',
    unit: '%',
    value: davi.value,
    n: davi.n,
    status: band(davi.value, TARGETS.usaDavi.min, TARGETS.usaDavi.max),
    target: { min: TARGETS.usaDavi.min, max: TARGETS.usaDavi.max, text: '35–50% (abaixo de 20%: dilema fraco)' },
    scale: { min: 0, max: 100 },
    notes: daviNotes,
    firstCampaign: { value: daviFirst.value, n: daviFirst.n },
  });

  // --- rendez-vous das 14:20 no dia 9 ----------------------------------------
  const reached9 = facts.filter((f) => f.maxDay >= 9);
  const rv = rate(reached9, (f) => f.rendezvous9);
  const rvFirst = rate(
    reached9.filter(isFirst),
    (f) => f.rendezvous9,
  );
  metrics.push({
    id: 'rendezvous',
    label: 'Descobrem o encontro das 14:20 no dia 9',
    definition: 'Entre as campanhas que chegaram ao dia 9, % com o evento rendezvous no dia 9.',
    unit: '%',
    value: rv.value,
    n: rv.n,
    status: band(rv.value, TARGETS.rendezvous.min, TARGETS.rendezvous.max),
    target: { min: TARGETS.rendezvous.min, max: TARGETS.rendezvous.max, text: '10–15%' },
    scale: { min: 0, max: 100 },
    notes: sampleNotes(rv.n),
    firstCampaign: { value: rvFirst.value, n: rvFirst.n },
  });

  // --- AVC da Dona Cida no dia 19 --------------------------------------------
  const withCida = facts.filter((f) => f.cida !== null);
  const cida = rate(withCida, (f) => f.cida === true);
  const cidaFirst = rate(
    withCida.filter(isFirst),
    (f) => f.cida === true,
  );
  const cidaNotes = sampleNotes(cida.n);
  if (cida.value !== null && cida.value < TARGETS.cida.alertBelow) {
    cidaNotes.unshift('Abaixo de 40%: reforçar os sinais do AVC.');
  }
  metrics.push({
    id: 'cida',
    label: 'Reconhecem o AVC da Dona Cida (dia 19)',
    definition: 'Entre as campanhas com o evento cida_d19, % em que o AVC foi reconhecido.',
    unit: '%',
    value: cida.value,
    n: cida.n,
    status: band(cida.value, TARGETS.cida.min, TARGETS.cida.max),
    target: { min: TARGETS.cida.min, max: TARGETS.cida.max, text: '≈60% (50–70%; abaixo de 40%: reforçar sinais)' },
    scale: { min: 0, max: 100 },
    notes: cidaNotes,
    firstCampaign: { value: cidaFirst.value, n: cidaFirst.n },
  });

  // --- tempo por ligação ------------------------------------------------------
  const times = facts.flatMap((f) => f.callTimes).sort((a, b) => a - b);
  const callMean = mean(times);
  const callTime = { n: times.length, mean: callMean, median: quantile(times, 0.5), p90: quantile(times, 0.9) };
  metrics.push({
    id: 'callTime',
    label: 'Tempo médio por ligação',
    definition: `Média de call_time.seconds (segundos reais); ignora valores ≤ 0 ou acima de ${CALL_TIME_MAX_SECONDS} s.`,
    unit: 's',
    value: callMean,
    n: times.length,
    status: band(callMean, TARGETS.callTime.min, TARGETS.callTime.max),
    target: { min: TARGETS.callTime.min, max: TARGETS.callTime.max, text: '75–95 s' },
    scale: { min: 0, max: Math.max(180, Math.ceil(((callMean ?? 0) * 1.2) / 10) * 10) },
    notes: sampleNotes(times.length),
    detail: { mediana: callTime.median, p90: callTime.p90 },
  });

  // --- finais na 1ª campanha -------------------------------------------------
  const withEnding = firsts.filter((f) => f.ending !== null);
  const tol = TARGETS.endings.tolerance;
  const kinds = ENDING_KINDS.map((kind) => {
    const count = withEnding.filter((f) => f.ending === kind).length;
    const p = pct(count, withEnding.length);
    const target = TARGETS.endings[kind];
    const status: Status = p === null ? 'nodata' : Math.abs(p - target) <= tol ? 'ok' : 'bad';
    return { kind, label: ENDING_LABELS[kind], count, pct: p, target, status };
  });
  const endings: EndingsReport = {
    n: withEnding.length,
    tolerance: tol,
    kinds,
    status: withEnding.length === 0 ? 'nodata' : kinds.every((k) => k.status === 'ok') ? 'ok' : 'bad',
    notes: sampleNotes(withEnding.length),
  };

  // --- game overs --------------------------------------------------------------
  const allGameovers = facts.flatMap((f) => f.gameovers);
  const goKinds = [...GAMEOVER_KINDS, ...new Set(allGameovers.map((g) => g.kind).filter((k) => !(GAMEOVER_KINDS as readonly string[]).includes(k)))];
  const gameovers = {
    total: allGameovers.length,
    byKind: goKinds.map((kind) => {
      const list = allGameovers.filter((g) => g.kind === kind);
      const days = list.map((g) => g.day).filter((d): d is number => d !== null);
      return { kind, label: GAMEOVER_LABELS[kind] ?? kind, count: list.length, avgDay: mean(days) };
    }),
  };

  // --- médias por dia (último day_end de cada campanha em cada dia) ----------
  const acc = new Map<number, { n: number; sum: Record<string, number>; cnt: Record<string, number> }>();
  for (const f of facts) {
    for (const [day, d] of f.dayEnds) {
      let a = acc.get(day);
      if (!a) acc.set(day, (a = { n: 0, sum: {}, cnt: {} }));
      a.n++;
      for (const k of PER_DAY_FIELDS) {
        const v = num(d, k);
        if (v === null) continue;
        a.sum[k] = (a.sum[k] ?? 0) + v;
        a.cnt[k] = (a.cnt[k] ?? 0) + 1;
      }
    }
  }
  const perDay: PerDayRow[] = [...acc.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, a]) => {
      const row = { day, n: a.n } as PerDayRow;
      for (const k of PER_DAY_FIELDS) row[k] = a.cnt[k] ? round1(a.sum[k] / a.cnt[k]) : null;
      return row;
    });

  // --- escolhas do dia 9 (contagens) -------------------------------------------
  const d9 = { M: {} as Record<string, number>, G: {} as Record<string, number>, marcia: {} as Record<string, number> };
  for (const f of facts) {
    if (!f.d9) continue;
    const bucket = f.d9.scenario === 'M' ? d9.M : f.d9.scenario === 'G' ? d9.G : null;
    if (bucket && f.d9.davi) bucket[f.d9.davi] = (bucket[f.d9.davi] ?? 0) + 1;
    if (f.d9.marcia) d9.marcia[f.d9.marcia] = (d9.marcia[f.d9.marcia] ?? 0) + 1;
  }
  const daviCounts: Record<string, number | null> = {};
  for (const k of ['USA', 'USB', 'ORI', 'IMPEDIMENTO']) daviCounts[k] = d9.M[k] ?? 0;
  (metrics.find((m) => m.id === 'usaDavi') as Metric).detail = daviCounts;

  // --- modo infinito -------------------------------------------------------------
  const scores = infiniteRuns.map((r) => num(r.d, 'score')).filter((x): x is number => x !== null);
  const calls = infiniteRuns.map((r) => num(r.d, 'calls')).filter((x): x is number => x !== null);

  return {
    generatedAt: new Date(opts.now ?? Date.now()).toISOString(),
    storage: opts.storage ?? '',
    version: opts.version ?? '',
    filters: { difficulty, since: opts.since ?? null },
    totals: {
      events: considered,
      stored: opts.stored ?? records.length,
      sessions: sessions.size,
      players: players.size,
      campaigns: real.length,
      firstCampaigns: firsts.length,
    },
    metrics,
    endings,
    firstCampaignOutcomes: { total: firsts.length, reached20: reach.hits, gameover: reach.n - reach.hits, inProgress },
    gameovers,
    perDay,
    d9,
    infinite: {
      runs: infiniteRuns.length,
      avgScore: mean(scores),
      avgCalls: mean(calls),
      bestScore: scores.length ? scores.reduce((a, b) => (b > a ? b : a), -Infinity) : null,
    },
    callTime,
  };
}
